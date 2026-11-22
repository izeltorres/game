// Cat Clans - music, background sounds and cat noises (R61)
// Every sound is made by the browser (Web Audio), so there are no sound files to download.
// soundLevels() works out how loud each background sound should be from the game state;
// it does no audio itself, so the tests can check it. The audio only starts after the first
// key press or click, because browsers don't allow sound before that.

let soundVolume = 0.6;
let soundMuted = false;
let audio = null;          // { ctx, master, layers: { name: gainNode }, noise, nextNote, nextChirp, nextCricket }

const MUSIC_NOTES = [0, 3, 5, 7, 10, 7, 5, 3, 0, 5, 7, 12, 10, 7, 5, 3];   // a calm minor-pentatonic tune
const MUSIC_ROOT = 220;    // A3
const NOTE_GAP = 0.75;     // seconds between notes

function setVolume(v) {
  soundVolume = Math.max(0, Math.min(1, Number(v)));
}

function setMuted(m) {
  soundMuted = !!m;
}

// How far the cat is from the nearest river or stream bank
function distanceToWater() {
  let best = Infinity;
  for (const w of WATERS) {
    if (player.x > w.x0 && player.x < w.x1) return 0;
    best = Math.min(best, Math.abs(player.x - w.x0), Math.abs(player.x - w.x1));
  }
  return best;
}

// How loud each background sound should be right now (0 = silent)
function soundLevels() {
  const master = soundMuted ? 0 : soundVolume;
  const s = typeof season === "function" ? season() : "newleaf";
  const phase = dayPhase();
  const wet = weather === "rain" || weather === "storm";
  const levels = {
    music: playing ? 0.35 : 0.25,
    wind: weather === "storm" ? 0.7 : weather === "wind" ? 0.6 : (s === "leaf-bare" ? 0.3 : 0.12),
    rain: weather === "storm" ? 0.9 : weather === "rain" ? 0.5 : 0,
    birds: phase !== "night" && !wet ? (s === "leaf-bare" ? 0.15 : 0.4) : 0,
    crickets: phase === "night" && !wet && s !== "leaf-bare" ? 0.35 : 0,
    river: Math.max(0, 1 - distanceToWater() / 15) * 0.6,
  };
  if (!playing) { levels.rain = 0; levels.birds = 0; levels.crickets = 0; levels.river = 0; }
  for (const k in levels) levels[k] *= master;
  return levels;
}

// ---------- the audio itself ----------
function startAudio() {
  if (audio) {
    if (audio.ctx.state === "suspended") audio.ctx.resume();
    return;
  }
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();
  const master = ctx.createGain();
  master.connect(ctx.destination);
  // Two seconds of white noise, reused by every noisy sound
  const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  audio = { ctx, master, noise, layers: {}, nextNote: ctx.currentTime + 0.5, noteIndex: 0, nextChirp: 0, nextCricket: 0 };

  // Looping noise layers, each with its own filter and volume
  const layer = (name, type, freq, q) => {
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = freq;
    filter.Q.value = q;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(master);
    src.start();
    audio.layers[name] = gain;
    return filter;
  };
  audio.windFilter = layer("wind", "lowpass", 400, 1);
  layer("rain", "highpass", 2500, 0.5);
  layer("river", "bandpass", 700, 0.8);
  // Birds, crickets and music are notes played now and then; these gains set their volume
  for (const name of ["birds", "crickets", "music"]) {
    const g = ctx.createGain();
    g.gain.value = 0;
    g.connect(master);
    audio.layers[name] = g;
  }
}

// A short tone: frequency glides from f0 to f1
function tone(out, type, f0, f1, start, length, peak) {
  const ctx = audio.ctx;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(f0, start);
  osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), start + length);
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(peak, start + Math.min(0.05, length / 3));
  env.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(env).connect(out);
  osc.start(start);
  osc.stop(start + length + 0.05);
  return osc;
}

// A burst of filtered noise
function noiseBurst(out, type, f0, f1, start, length, peak) {
  const ctx = audio.ctx;
  const src = ctx.createBufferSource();
  src.buffer = audio.noise;
  const filter = ctx.createBiquadFilter();
  filter.type = type;
  filter.frequency.setValueAtTime(f0, start);
  filter.frequency.exponentialRampToValueAtTime(f1, start + length);
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(peak, start + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, start + length);
  src.connect(filter).connect(env).connect(out);
  src.start(start, Math.random());
  src.stop(start + length + 0.05);
}

// Called every frame by script.js
function updateSound() {
  if (!audio) return;
  const ctx = audio.ctx;
  const now = ctx.currentTime;
  const levels = soundLevels();
  for (const name in audio.layers) audio.layers[name].gain.setTargetAtTime(levels[name] || 0, now, 0.5);
  audio.master.gain.setTargetAtTime(1, now, 0.1);
  // The wind rises and falls
  audio.windFilter.frequency.setTargetAtTime(300 + 250 * Math.sin(now * 0.3) + (weather === "storm" ? 400 : 0), now, 1);

  // Music: one note at a time, scheduled a little ahead
  while (audio.nextNote < now + 0.3) {
    const step = MUSIC_NOTES[audio.noteIndex % MUSIC_NOTES.length];
    const f = MUSIC_ROOT * Math.pow(2, step / 12);
    tone(audio.layers.music, "triangle", f, f, audio.nextNote, NOTE_GAP * 1.6, 0.25);
    if (audio.noteIndex % 8 === 0) tone(audio.layers.music, "sine", MUSIC_ROOT / 2, MUSIC_ROOT / 2, audio.nextNote, NOTE_GAP * 8, 0.2);
    audio.noteIndex++;
    audio.nextNote += NOTE_GAP;
  }
  // Birds chirp now and then
  if (levels.birds > 0 && now > audio.nextChirp) {
    const f = 2500 + Math.random() * 1500;
    for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
      tone(audio.layers.birds, "sine", f, f * 1.3, now + i * 0.12, 0.08, 0.3);
    }
    audio.nextChirp = now + 1 + Math.random() * 3;
  }
  // Crickets: quick high pulses
  if (levels.crickets > 0 && now > audio.nextCricket) {
    for (let i = 0; i < 3; i++) tone(audio.layers.crickets, "square", 4500, 4500, now + i * 0.06, 0.03, 0.08);
    audio.nextCricket = now + 0.6 + Math.random() * 0.6;
  }
}

// Cat noises and other one-off sounds, asked for by game.js through hooks.sound
function playCatSound(name) {
  if (!audio || soundMuted || soundVolume === 0) return;
  const ctx = audio.ctx;
  const now = ctx.currentTime;
  const out = ctx.createGain();
  out.gain.value = soundVolume;
  out.connect(ctx.destination);
  if (name === "meow") {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1800;
    filter.connect(out);
    const osc = tone(filter, "sawtooth", 500, 420, now, 0.5, 0.2);
    osc.frequency.setValueAtTime(500, now);
    osc.frequency.linearRampToValueAtTime(800, now + 0.15);
    osc.frequency.linearRampToValueAtTime(420, now + 0.5);
  } else if (name === "hiss") {
    noiseBurst(out, "highpass", 3000, 5000, now, 0.6, 0.35);
  } else if (name === "purr") {
    for (let i = 0; i < 12; i++) noiseBurst(out, "lowpass", 180, 120, now + i * 0.12, 0.1, 0.4);
  } else if (name === "swish") {
    noiseBurst(out, "bandpass", 1200, 4000, now, 0.15, 0.3);
  } else if (name === "crunch") {
    for (let i = 0; i < 3; i++) noiseBurst(out, "bandpass", 1500, 900, now + i * 0.13, 0.07, 0.4);
  } else if (name === "splash") {
    noiseBurst(out, "lowpass", 3000, 300, now, 0.5, 0.45);
  }
}

hooks.sound = playCatSound;
