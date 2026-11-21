// Forest Clans - a small 2D game inspired by the Warriors books.
// Everything is drawn on a <canvas> with plain JavaScript (no libraries).

// ======================================================
// Settings
// ======================================================
const W = 960;                 // canvas width
const H = 540;                 // canvas height
const GROUND = 450;            // y position of the ground line
const WORLD_WIDTH = 3600;      // how far the forest goes
const RIVER_START = 2150;      // river (task 2)
const RIVER_END = 2350;
const ROGUE_HOME = 3150;       // where the rogue cat waits (task 3)

const CLANS = {
  ThunderClan: { about: "Forest hunters", perk: "Prey notices you less", color: "#c8553d",
                 speed: 1, stealth: 0.6, fishZone: 1, damage: 1 },
  RiverClan:   { about: "Swimmers and fishers", perk: "Easier fishing, not slowed by water", color: "#3d8bc8",
                 speed: 1, stealth: 1, fishZone: 1.7, damage: 1 },
  WindClan:    { about: "Fast runners", perk: "Runs faster", color: "#c8b13d",
                 speed: 1.4, stealth: 1, fishZone: 1, damage: 1 },
  ShadowClan:  { about: "Mysterious", perk: "Strikes harder in a fight", color: "#6a4c93",
                 speed: 1, stealth: 1, fishZone: 1, damage: 1.6 },
};

const FURS = { Ginger: "#d9822b", Grey: "#8a8d91", Black: "#2e2b2b", White: "#efebe2", Brown: "#7a4f2a", Cream: "#e3c896" };
const EYES = { Green: "#4caf50", Amber: "#f0a020", Blue: "#4aa3df", Yellow: "#e8d33f" };
const PATTERNS = ["Solid", "Tabby", "Patches"];
const WARRIOR_SUFFIXES = ["heart", "claw", "pelt", "storm", "whisker", "fang", "tail", "stripe"];

// Each level: rank name, name ending, and how big the cat is drawn
const STAGES = [
  { rank: "Kit",        suffix: "kit", size: 0.55 },  // level 1: hunt a squirrel
  { rank: "Kit",        suffix: "kit", size: 0.72 },  // level 2: go fishing (cat has grown)
  { rank: "Apprentice", suffix: "paw", size: 0.86 },  // level 3: fight a rogue
  { rank: "Warrior",    suffix: null,  size: 1 },     // done
];

// ======================================================
// Game state
// ======================================================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const look = { fur: FURS.Ginger, eyes: EYES.Green, pattern: "Solid" };
let catName = "Fire";
let clanName = "ThunderClan";
let warriorSuffix = "heart";
let playing = false;
let stage = 0;
let time = 0;
let cameraX = 0;

const player = {};
const squirrel = {};
const rogue = {};
const fishing = {};

function resetGame() {
  stage = 0;
  Object.assign(player, {
    x: 200, y: GROUND, vy: 0, onGround: true, facing: 1, crouching: false, moving: false,
    walk: 0, hp: 100, attackTimer: 0, attackCooldown: 0, hurtTimer: 0,
  });
  // squirrel.state: idle | hopping | fleeing | hidden | caught
  Object.assign(squirrel, { x: 900, state: "idle", timer: 1, dir: 1, hop: 0, respawn: 0 });
  // rogue.state: waiting | fighting | fleeing | gone
  Object.assign(rogue, { x: ROGUE_HOME, hp: 60, facing: -1, walk: 0, windup: 0, cooldown: 0, hurtTimer: 0, state: "waiting" });
  Object.assign(fishing, { active: false, marker: 0, dir: 1, zone: 0.5, catches: 0, flash: 0, flashGood: false });
}
resetGame();

// ======================================================
// Keyboard
// ======================================================
const keys = {};     // keys held down right now
const pressed = {};  // keys pressed this frame

window.addEventListener("keydown", (e) => {
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (playing && ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
    e.preventDefault(); // stop the page from scrolling
  }
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

function isDown(...codes) {
  return codes.some((c) => keys[c]);
}

// ======================================================
// Helpers
// ======================================================
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

// Make a hex colour lighter (amount > 0) or darker (amount < 0)
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const r = clamp((n >> 16) + amount, 0, 255);
  const g = clamp(((n >> 8) & 255) + amount, 0, 255);
  const b = clamp((n & 255) + amount, 0, 255);
  return `rgb(${r}, ${g}, ${b})`;
}

// Random numbers that are the same every time (so the forest looks the same)
function makeRandom(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fullName() {
  return catName + (STAGES[stage].suffix || warriorSuffix);
}

function inRiver(x) {
  return x > RIVER_START && x < RIVER_END;
}

// ======================================================
// The forest (made once at the start)
// ======================================================
const random = makeRandom(42);

// factor = how fast a layer scrolls (smaller = further away)
function makeTrees(factor, gapMin, gapMax, hMin, hMax, avoidRiver) {
  const trees = [];
  for (let x = -100; x < WORLD_WIDTH * factor + W + 100; x += gapMin + random() * (gapMax - gapMin)) {
    if (avoidRiver && x > RIVER_START - 60 && x < RIVER_END + 60) continue;
    trees.push({ x, h: hMin + random() * (hMax - hMin), r: 0, phase: random() * 6 });
  }
  trees.forEach((t) => { t.r = 28 + t.h * 0.18; });
  return trees;
}

const farTrees = makeTrees(0.35, 50, 90, 90, 150, false);
const midTrees = makeTrees(0.65, 90, 160, 140, 210, false);
const nearTrees = makeTrees(1, 260, 420, 220, 300, true);

const grass = [];
for (let x = 0; x < WORLD_WIDTH; x += 6) {
  const gx = x + random() * 4;
  if (!inRiver(gx)) grass.push({ x: gx, h: 6 + random() * 8, phase: random() * 6 });
}

// ======================================================
// Update (game logic)
// ======================================================
function update(dt) {
  time += dt;
  if (playing) {
    if (fishing.active) updateFishing(dt);
    else updatePlayer(dt);
    if (stage === 0) updateSquirrel(dt);
    if (stage >= 2) updateRogue(dt);
    cameraX = clamp(player.x - W / 2, 0, WORLD_WIDTH - W);
    updateHud();
  }
  for (const k in pressed) delete pressed[k];
}

function updatePlayer(dt) {
  const clan = CLANS[clanName];
  const left = isDown("KeyA", "ArrowLeft");
  const right = isDown("KeyD", "ArrowRight");

  player.crouching = player.onGround && isDown("ShiftLeft", "ShiftRight", "KeyS", "ArrowDown");

  let speed = 210 * clan.speed;
  if (player.crouching) speed *= 0.35;
  if (inRiver(player.x) && clanName !== "RiverClan") speed *= 0.5;

  const dir = (right ? 1 : 0) - (left ? 1 : 0);
  player.moving = dir !== 0;
  if (dir !== 0) player.facing = dir;
  player.x = clamp(player.x + dir * speed * dt, 40, WORLD_WIDTH - 40);
  if (player.moving) player.walk += (dt * speed) / 18;

  // Jumping and falling
  if (isDown("KeyW", "ArrowUp", "Space") && player.onGround && !player.crouching) {
    player.vy = -420;
    player.onGround = false;
  }
  if (!player.onGround) {
    player.vy += 1200 * dt;
    player.y += player.vy * dt;
    if (player.y >= GROUND) {
      player.y = GROUND;
      player.vy = 0;
      player.onGround = true;
    }
  }

  player.attackTimer = Math.max(0, player.attackTimer - dt);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);

  if (pressed.KeyE) doAction();
}

// E does something different at each level
function doAction() {
  if (stage === 0) tryPounce();
  else if (stage === 1) tryFishing();
  else trySwipe();
}

// ---------- Level 1: hunt a squirrel ----------
function tryPounce() {
  player.attackTimer = 0.3;
  const dx = squirrel.x - player.x;
  const visible = squirrel.state === "idle" || squirrel.state === "hopping";

  if (visible && Math.abs(dx) < 100 && Math.sign(dx) === player.facing) {
    squirrel.state = "caught";
    advanceStage();
    return;
  }
  // Missed: leap forward a little
  if (player.onGround) {
    player.vy = -250;
    player.onGround = false;
    player.x = clamp(player.x + player.facing * 20, 40, WORLD_WIDTH - 40);
  }
  if (visible && Math.abs(dx) < 250) scareSquirrel();
}

function scareSquirrel() {
  squirrel.state = "fleeing";
  squirrel.dir = Math.sign(squirrel.x - player.x) || 1;
  showMessage("The squirrel heard you! Hold Shift to stalk slowly.", 2);
}

function updateSquirrel(dt) {
  const s = squirrel;

  if (s.state === "caught") return;

  if (s.state === "hidden") {
    s.respawn -= dt;
    if (s.respawn <= 0) {
      // Come back somewhere away from the player
      let x = player.x + (Math.random() < 0.5 ? -1 : 1) * (380 + Math.random() * 250);
      if (x < 300 || x > RIVER_START - 100) x = player.x < 1100 ? player.x + 450 : player.x - 450;
      s.x = clamp(x, 300, RIVER_START - 100);
      s.state = "idle";
      s.timer = 1;
    }
    return;
  }

  if (s.state === "fleeing") {
    s.x += s.dir * 320 * dt;
    s.hop += dt * 14;
    if (Math.abs(s.x - player.x) > 600 || s.x < 20 || s.x > WORLD_WIDTH - 20) {
      s.state = "hidden";
      s.respawn = 2.5;
    }
    return;
  }

  // Notice the player if they get too close without stalking
  const radius = (player.crouching ? 60 : 230) * CLANS[clanName].stealth;
  if (Math.abs(player.x - s.x) < radius) {
    scareSquirrel();
    return;
  }

  // Wander: sit still, then hop a little
  s.timer -= dt;
  if (s.timer <= 0) {
    if (s.state === "idle") {
      s.state = "hopping";
      s.dir = Math.random() < 0.5 ? -1 : 1;
      s.timer = 0.6 + Math.random() * 0.8;
    } else {
      s.state = "idle";
      s.timer = 1 + Math.random() * 2;
    }
  }
  if (s.state === "hopping") {
    s.x = clamp(s.x + s.dir * 60 * dt, 300, RIVER_START - 100);
    s.hop += dt * 10;
  }
}

// ---------- Level 2: go fishing ----------
function tryFishing() {
  if (player.x < RIVER_START - 80 || player.x > RIVER_END + 80) {
    showMessage("Find the river to the east first.", 1.5);
    return;
  }
  Object.assign(fishing, { active: true, marker: 0, dir: 1, catches: 0, flash: 0 });
  newFishZone();
  player.moving = false;
  player.crouching = true;
  showMessage("Press E when the fish is in the gold zone!", 2);
}

function fishZoneWidth() {
  return 0.12 * CLANS[clanName].fishZone;
}

function newFishZone() {
  const half = fishZoneWidth() / 2;
  fishing.zone = half + Math.random() * (1 - 2 * half);
}

function updateFishing(dt) {
  if (pressed.Escape) {
    fishing.active = false;
    player.crouching = false;
    return;
  }
  fishing.marker += fishing.dir * dt * 0.9;
  if (fishing.marker > 1) { fishing.marker = 1; fishing.dir = -1; }
  if (fishing.marker < 0) { fishing.marker = 0; fishing.dir = 1; }
  fishing.flash = Math.max(0, fishing.flash - dt);

  if (pressed.KeyE) {
    fishing.flash = 0.4;
    fishing.flashGood = Math.abs(fishing.marker - fishing.zone) < fishZoneWidth() / 2;
    if (fishing.flashGood) {
      fishing.catches++;
      if (fishing.catches >= 3) {
        fishing.active = false;
        player.crouching = false;
        advanceStage();
      } else {
        newFishZone();
      }
    }
  }
}

// ---------- Level 3: fight a rogue ----------
function trySwipe() {
  if (player.attackCooldown > 0) return;
  player.attackCooldown = 0.4;
  player.attackTimer = 0.25;
  if (stage !== 2 || rogue.state !== "fighting") return;

  const dx = rogue.x - player.x;
  if (Math.abs(dx) < 80 && Math.sign(dx) === player.facing) {
    rogue.hp -= 10 * CLANS[clanName].damage;
    rogue.hurtTimer = 0.25;
    rogue.x += player.facing * 35;
    if (rogue.hp <= 0) {
      rogue.state = "fleeing";
      advanceStage();
    }
  }
}

function updateRogue(dt) {
  const r = rogue;
  if (r.state === "gone") return;
  r.hurtTimer = Math.max(0, r.hurtTimer - dt);

  if (r.state === "fleeing") {
    r.facing = 1;
    r.x += 300 * dt;
    r.walk += dt * 16;
    if (r.x > WORLD_WIDTH + 100) r.state = "gone";
    return;
  }

  const dx = player.x - r.x;
  const dist = Math.abs(dx);

  if (r.state === "waiting") {
    if (dist > 450) return;
    r.state = "fighting";
    showMessage("A rogue! Chase it off your clan's territory! Press E to swipe.", 2.5);
  }

  r.facing = Math.sign(dx) || r.facing;
  r.cooldown -= dt;

  if (r.windup > 0) {
    // Getting ready to strike (the player can see it crouch)
    r.windup -= dt;
    if (r.windup <= 0) {
      r.cooldown = 1.1;
      if (dist < 75) hurtPlayer(14);
    }
  } else if (dist > 55) {
    r.x += r.facing * 120 * dt;
    r.walk += dt * 8;
  } else if (r.cooldown <= 0) {
    r.windup = 0.45;
  }
}

function hurtPlayer(amount) {
  player.hp -= amount;
  player.hurtTimer = 0.3;
  player.x = clamp(player.x + rogue.facing * 40, 40, WORLD_WIDTH - 40);

  if (player.hp <= 0) {
    showMessage("You were beaten... Rest, then try again.", 2.5);
    player.hp = 100;
    player.x = clamp(ROGUE_HOME - 600, 40, WORLD_WIDTH - 40);
    Object.assign(rogue, { x: ROGUE_HOME, hp: 60, windup: 0, cooldown: 0, state: "waiting" });
  }
}

// ---------- Levelling up ----------
function advanceStage() {
  stage++;
  player.hp = 100;
  if (stage === 1) {
    showMessage(`You caught the squirrel! ${fullName()} is growing bigger.`, 3);
  } else if (stage === 2) {
    showMessage(`Great fishing! You are now ${fullName()}, an apprentice of ${clanName}.`, 3.5);
  } else if (stage === 3) {
    warriorSuffix = WARRIOR_SUFFIXES[Math.floor(Math.random() * WARRIOR_SUFFIXES.length)];
    showMessage(`The rogue runs away! You are now ${fullName()}, a warrior of ${clanName}!`, 4.5);
  }
}

// ======================================================
// HUD and messages (HTML on top of the canvas)
// ======================================================
const hudEl = document.getElementById("hud");
const catInfoEl = document.getElementById("cat-info");
const taskEl = document.getElementById("task");
const messageEl = document.getElementById("message");
let messageTimeout = null;

function showMessage(text, seconds) {
  messageEl.textContent = text;
  messageEl.classList.remove("hidden");
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => messageEl.classList.add("hidden"), seconds * 1000);
}

function arrowTo(targetX) {
  const d = targetX - player.x;
  if (Math.abs(d) < 300) return "";
  return d > 0 ? "  →" : "  ←";
}

function taskText() {
  if (stage === 0) return "Task 1: Hunt a squirrel. Hold Shift to stalk slowly, then press E to pounce.";
  if (stage === 1) return "Task 2: Go fishing at the river to the east. Stand by the water and press E." + arrowTo(RIVER_START);
  if (stage === 2) return "Task 3: A rogue cat is on your territory far to the east. Chase it off!" + arrowTo(ROGUE_HOME);
  return "You are a warrior! Explore the forest, or press \"New cat\" to play again.";
}

// Only touch the page when the text changes
function updateHud() {
  const info = `${fullName()} · ${STAGES[stage].rank} of ${clanName}`;
  if (catInfoEl.textContent !== info) catInfoEl.textContent = info;
  const task = taskText();
  if (taskEl.textContent !== task) taskEl.textContent = task;
}

// ======================================================
// Drawing
// ======================================================
function draw() {
  drawSky();
  drawHills();
  drawTreeLayer(farTrees, 0.35, 0.55, 395, "#3b4a3a", "#3f6b4a");
  drawTreeLayer(midTrees, 0.65, 0.75, 425, "#4a3a2c", "#3a7a3e");
  drawGround();
  drawRiver();
  drawTreeLayer(nearTrees, 1, 1, GROUND + 4, "#5b4030", "#2f8a3a");

  if (playing && stage === 0) drawSquirrel();
  if (playing && stage >= 2 && rogue.state !== "gone") drawRogue();
  if (playing) drawPlayer();
  drawGrass();

  if (playing && stage === 2 && rogue.state === "fighting") drawHealthBars();
  if (fishing.active) drawFishing();
}

function drawSky() {
  const sky = ctx.createLinearGradient(0, 0, 0, GROUND);
  sky.addColorStop(0, "#7fb3d9");
  sky.addColorStop(1, "#d8ecd0");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);
}

function drawHills() {
  ctx.fillStyle = "#8fb59a";
  ctx.beginPath();
  ctx.moveTo(0, H);
  for (let sx = 0; sx <= W; sx += 10) {
    const wx = sx + cameraX * 0.15;
    ctx.lineTo(sx, 330 + Math.sin(wx * 0.006) * 30 + Math.sin(wx * 0.013) * 15);
  }
  ctx.lineTo(W, H);
  ctx.fill();
}

function drawTreeLayer(trees, factor, scale, baseY, trunkColor, leafColor) {
  for (const t of trees) {
    const sx = t.x - cameraX * factor;
    if (sx < -150 || sx > W + 150) continue;
    drawTree(sx, baseY, t, scale, trunkColor, leafColor);
  }
}

function drawTree(sx, baseY, t, scale, trunkColor, leafColor) {
  const h = t.h * scale;
  const r = t.r * scale;
  const top = baseY - h;
  const sway = Math.sin(time * 1.3 + t.phase) * 3 * scale; // whole top moves gently

  ctx.fillStyle = trunkColor;
  ctx.fillRect(sx - 7 * scale, top, 14 * scale, h);

  // Leaves: a few circles that each wave a little
  const blobs = [[0, 0, 1], [-0.8, 0.35, 0.75], [0.8, 0.35, 0.75], [0, -0.6, 0.7]];
  ctx.fillStyle = leafColor;
  for (const [bx, by, br] of blobs) {
    const wave = Math.sin(time * 2 + t.phase + bx * 2) * 2.5 * scale;
    ctx.beginPath();
    ctx.arc(sx + bx * r + sway + wave, top + by * r, br * r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.beginPath();
  ctx.arc(sx - r * 0.3 + sway, top - r * 0.3, r * 0.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawGround() {
  const g = ctx.createLinearGradient(0, GROUND, 0, H);
  g.addColorStop(0, "#4f8a35");
  g.addColorStop(1, "#3a5f27");
  ctx.fillStyle = g;
  ctx.fillRect(0, GROUND, W, H - GROUND);
}

function drawRiver() {
  const sx = RIVER_START - cameraX;
  const width = RIVER_END - RIVER_START;
  if (sx > W || sx + width < 0) return;
  ctx.fillStyle = "#3f7fb8";
  ctx.fillRect(sx, GROUND - 2, width, H - GROUND + 2);
  // Moving ripples
  ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    const y = GROUND + 10 + i * 14;
    const offset = ((time * 30 + i * 37) % width);
    ctx.beginPath();
    ctx.moveTo(sx + offset, y);
    ctx.lineTo(sx + Math.min(width, offset + 30), y);
    ctx.stroke();
  }
}

function drawGrass() {
  ctx.strokeStyle = "#6aa843";
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const b of grass) {
    const sx = b.x - cameraX;
    if (sx < -20 || sx > W + 20) continue;
    // A slow wave moves across the field, plus a little flutter per blade
    const sway = Math.sin(time * 2.2 + b.x * 0.03) * 4 + Math.sin(time * 3.1 + b.phase) * 1.5;
    ctx.moveTo(sx, GROUND + 3);
    ctx.quadraticCurveTo(sx + sway * 0.4, GROUND - b.h * 0.5, sx + sway, GROUND - b.h);
  }
  ctx.stroke();
}

// Draws a cat standing at (x, y) facing right (facing = 1) or left (-1).
// pose: { moving, walk, crouch, attack }
function drawCat(c, x, y, size, facing, catLook, pose) {
  const dark = shade(catLook.fur, -45);
  const low = pose.crouch ? 7 : 0;
  const bob = pose.moving ? Math.abs(Math.sin(pose.walk)) * 2 : 0;
  const bodyY = -30 + low - bob;

  c.save();
  c.translate(x, y);
  c.scale(facing * size, size);
  c.lineCap = "round";
  c.lineJoin = "round";

  // Tail (always swishing)
  const swish = Math.sin(time * 3) * 6;
  c.strokeStyle = catLook.fur;
  c.lineWidth = 7;
  c.beginPath();
  c.moveTo(-26, bodyY);
  c.quadraticCurveTo(-48, bodyY - 6, -44 + swish * 0.3, bodyY - (pose.crouch ? 10 : 32) + swish * 0.5);
  c.stroke();

  // Legs: back pair and front pair, swinging when walking
  const legs = [[-20, 0], [-12, Math.PI], [12, Math.PI], [20, 0]];
  c.lineWidth = 6;
  legs.forEach(([lx, phase], i) => {
    const swing = pose.moving ? Math.sin(pose.walk + phase) * 7 : 0;
    c.strokeStyle = i % 2 ? dark : catLook.fur;
    c.beginPath();
    c.moveTo(lx, bodyY + 6);
    c.lineTo(lx + swing, -2);
    c.stroke();
  });

  // Body
  c.fillStyle = catLook.fur;
  c.strokeStyle = "rgba(0, 0, 0, 0.35)";
  c.lineWidth = 1.5;
  c.beginPath();
  c.ellipse(0, bodyY, 29, 13, 0, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  const patchColor = catLook.fur === FURS.White ? FURS.Ginger : "#f4f1ea";
  if (catLook.pattern === "Tabby") {
    c.strokeStyle = dark;
    c.lineWidth = 3;
    for (const sx of [-16, -6, 4, 14]) {
      c.beginPath();
      c.moveTo(sx, bodyY - 12);
      c.quadraticCurveTo(sx + 3, bodyY - 4, sx, bodyY + 4);
      c.stroke();
    }
  } else if (catLook.pattern === "Patches") {
    c.fillStyle = patchColor;
    c.beginPath();
    c.ellipse(4, bodyY + 7, 16, 5, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.ellipse(-12, bodyY - 5, 7, 5, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Head
  const hx = 30;
  const hy = -44 + low * 1.3 - bob;
  c.fillStyle = catLook.fur;
  c.beginPath(); // ears
  c.moveTo(hx - 9, hy - 6); c.lineTo(hx - 6, hy - 20); c.lineTo(hx + 1, hy - 10);
  c.moveTo(hx + 2, hy - 10); c.lineTo(hx + 8, hy - 21); c.lineTo(hx + 11, hy - 5);
  c.fill();
  c.fillStyle = "#e8a0a0";
  c.beginPath(); // inside of the ears
  c.moveTo(hx - 6, hy - 9); c.lineTo(hx - 5, hy - 16); c.lineTo(hx - 1, hy - 10);
  c.moveTo(hx + 4, hy - 10); c.lineTo(hx + 7, hy - 17); c.lineTo(hx + 9, hy - 8);
  c.fill();

  c.fillStyle = catLook.fur;
  c.strokeStyle = "rgba(0, 0, 0, 0.35)";
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(hx, hy, 13, 0, Math.PI * 2);
  c.fill();
  c.stroke();

  if (catLook.pattern === "Tabby") {
    c.strokeStyle = dark;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(hx - 4, hy - 12); c.lineTo(hx - 3, hy - 6);
    c.moveTo(hx + 1, hy - 13); c.lineTo(hx + 1, hy - 7);
    c.stroke();
  } else if (catLook.pattern === "Patches") {
    c.fillStyle = patchColor;
    c.beginPath();
    c.ellipse(hx + 6, hy + 5, 7, 5, 0, 0, Math.PI * 2);
    c.fill();
  }

  // Eye, nose, whiskers
  c.fillStyle = catLook.eyes;
  c.beginPath();
  c.ellipse(hx + 5, hy - 2, 3.2, 3.6, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#111";
  c.beginPath();
  c.ellipse(hx + 5.8, hy - 2, 1.2, 3, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = "#d77a8a";
  c.beginPath();
  c.moveTo(hx + 11, hy + 2); c.lineTo(hx + 14, hy + 2); c.lineTo(hx + 12.5, hy + 4.5);
  c.fill();
  c.strokeStyle = "rgba(255, 255, 255, 0.7)";
  c.lineWidth = 0.8;
  c.beginPath();
  c.moveTo(hx + 10, hy + 5); c.lineTo(hx + 22, hy + 3);
  c.moveTo(hx + 10, hy + 6); c.lineTo(hx + 22, hy + 8);
  c.stroke();

  // Raised paw when pouncing or swiping
  if (pose.attack) {
    c.strokeStyle = catLook.fur;
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(18, bodyY + 2);
    c.lineTo(44, bodyY - 6);
    c.stroke();
    c.strokeStyle = "#fff";
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(46, bodyY - 9); c.lineTo(51, bodyY - 11);
    c.moveTo(47, bodyY - 6); c.lineTo(52, bodyY - 6);
    c.moveTo(46, bodyY - 3); c.lineTo(51, bodyY - 1);
    c.stroke();
  }

  c.restore();
}

function drawPlayer() {
  if (player.hurtTimer > 0 && Math.floor(time * 20) % 2 === 0) return; // flicker when hurt
  drawCat(ctx, player.x - cameraX, player.y, STAGES[stage].size, player.facing, look, {
    moving: player.moving && player.onGround,
    walk: player.walk,
    crouch: player.crouching,
    attack: player.attackTimer > 0,
  });
}

const ROGUE_LOOK = { fur: "#6b6156", eyes: "#d4c84a", pattern: "Tabby" };

function drawRogue() {
  if (rogue.hurtTimer > 0 && Math.floor(time * 20) % 2 === 0) return;
  drawCat(ctx, rogue.x - cameraX, GROUND, 0.95, rogue.facing, ROGUE_LOOK, {
    moving: rogue.state === "fleeing" || (rogue.state === "fighting" && rogue.windup <= 0),
    walk: rogue.walk,
    crouch: rogue.windup > 0.15,
    attack: rogue.windup > 0 && rogue.windup <= 0.15,
  });
}

function drawSquirrel() {
  const s = squirrel;
  if (s.state === "hidden" || s.state === "caught") return;
  const moving = s.state === "hopping" || s.state === "fleeing";
  const x = s.x - cameraX;
  const y = GROUND - (moving ? Math.abs(Math.sin(s.hop)) * 8 : 0);
  const face = s.state === "fleeing" ? s.dir : (s.state === "hopping" ? s.dir : 1);

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(face, 1);
  ctx.fillStyle = "#a0522d";
  // Bushy tail
  ctx.beginPath();
  ctx.ellipse(-10, -16 + Math.sin(time * 4) * 1.5, 6, 12, -0.4, 0, Math.PI * 2);
  ctx.fill();
  // Body and head
  ctx.beginPath();
  ctx.ellipse(0, -7, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -13, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath(); // ear
  ctx.moveTo(6, -17); ctx.lineTo(7, -21); ctx.lineTo(9, -17);
  ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.arc(9, -14, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawHealthBars() {
  drawBar(16, H - 34, player.hp / 100, "#4caf50", fullName());
  drawBar(W - 216, H - 34, Math.max(0, rogue.hp) / 60, "#c0392b", "Rogue");
}

function drawBar(x, y, fraction, color, label) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(x, y, 200, 18);
  ctx.fillStyle = color;
  ctx.fillRect(x + 2, y + 2, 196 * clamp(fraction, 0, 1), 14);
  ctx.fillStyle = "#fff";
  ctx.font = "13px Georgia";
  ctx.fillText(label, x + 6, y + 14);
}

function drawFishing() {
  const x = 280, y = 140, w = 400, h = 90;
  ctx.fillStyle = "rgba(15, 30, 45, 0.85)";
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = fishing.flash > 0 ? (fishing.flashGood ? "#7ddc6a" : "#e05a4a") : "#e9c46a";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = "#fff";
  ctx.font = "15px Georgia";
  ctx.fillText(`Fishing - catches: ${fishing.catches} / 3   (E to strike, Esc to stop)`, x + 14, y + 22);

  // The water bar, the gold zone, and the moving fish
  const barX = x + 20, barY = y + 40, barW = w - 40, barH = 30;
  ctx.fillStyle = "#3f7fb8";
  ctx.fillRect(barX, barY, barW, barH);
  const zoneW = fishZoneWidth() * barW;
  ctx.fillStyle = "rgba(233, 196, 106, 0.8)";
  ctx.fillRect(barX + fishing.zone * barW - zoneW / 2, barY, zoneW, barH);

  const fx = barX + fishing.marker * barW;
  ctx.save();
  ctx.translate(fx, barY + barH / 2);
  ctx.scale(fishing.dir, 1);
  ctx.fillStyle = "#c0c8d0";
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-8, 0); ctx.lineTo(-15, -5); ctx.lineTo(-15, 5);
  ctx.fill();
  ctx.restore();
}

// ======================================================
// Start menu
// ======================================================
const menuEl = document.getElementById("menu");
const nameInput = document.getElementById("name-input");
const previewCanvas = document.getElementById("preview");
const previewCtx = previewCanvas.getContext("2d");
const previewNameEl = document.getElementById("preview-name");

function selectIn(box, button) {
  box.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
  button.classList.add("selected");
}

function makeSwatches(boxId, colors, property) {
  const box = document.getElementById(boxId);
  for (const [label, color] of Object.entries(colors)) {
    const b = document.createElement("button");
    b.className = "swatch";
    b.style.background = color;
    b.title = label;
    b.setAttribute("aria-label", label);
    if (look[property] === color) b.classList.add("selected");
    b.addEventListener("click", () => {
      look[property] = color;
      selectIn(box, b);
    });
    box.appendChild(b);
  }
}

function buildMenu() {
  makeSwatches("fur-options", FURS, "fur");
  makeSwatches("eye-options", EYES, "eyes");

  const patternBox = document.getElementById("pattern-options");
  for (const p of PATTERNS) {
    const b = document.createElement("button");
    b.textContent = p;
    if (look.pattern === p) b.classList.add("selected");
    b.addEventListener("click", () => {
      look.pattern = p;
      selectIn(patternBox, b);
    });
    patternBox.appendChild(b);
  }

  const clanBox = document.getElementById("clan-options");
  for (const [name, clan] of Object.entries(CLANS)) {
    const b = document.createElement("button");
    b.className = "clan-btn";
    b.style.borderLeftColor = clan.color;
    b.innerHTML = `<strong>${name}</strong><small>${clan.about} &middot; ${clan.perk}</small>`;
    if (clanName === name) b.classList.add("selected");
    b.addEventListener("click", () => {
      clanName = name;
      selectIn(clanBox, b);
      updatePreviewName();
    });
    clanBox.appendChild(b);
  }

  nameInput.addEventListener("input", updatePreviewName);
  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("new-cat").addEventListener("click", showMenu);
  updatePreviewName();
}

// Letters only, first letter capital: "fIRE" -> "Fire"
function cleanName(raw) {
  const letters = raw.replace(/[^a-zA-Z]/g, "");
  if (!letters) return "Fire";
  return letters[0].toUpperCase() + letters.slice(1).toLowerCase();
}

function updatePreviewName() {
  previewNameEl.textContent = `${cleanName(nameInput.value)}kit of ${clanName}`;
}

function drawPreview() {
  previewCtx.fillStyle = "#2f4a28";
  previewCtx.fillRect(0, 0, previewCanvas.width, previewCanvas.height);
  previewCtx.fillStyle = "#4f8a35";
  previewCtx.fillRect(0, 172, previewCanvas.width, 28);
  drawCat(previewCtx, 125, 172, 2.1, 1, look, { moving: false, walk: 0, crouch: false, attack: false });
}

function startGame() {
  catName = cleanName(nameInput.value);
  resetGame();
  playing = true;
  menuEl.classList.add("hidden");
  hudEl.classList.remove("hidden");
  document.activeElement.blur(); // so keys move the cat instead of typing or clicking
  updateHud();
  showMessage(`Welcome to ${clanName}, ${fullName()}!`, 3);
}

function showMenu() {
  playing = false;
  fishing.active = false;
  cameraX = 0;
  menuEl.classList.remove("hidden");
  hudEl.classList.add("hidden");
  messageEl.classList.add("hidden");
  document.activeElement.blur();
}

// ======================================================
// Main loop
// ======================================================
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000); // cap so a slow frame doesn't break things
  lastTime = now;
  update(dt);
  draw();
  if (!playing) drawPreview();
  requestAnimationFrame(loop);
}

buildMenu();
requestAnimationFrame(loop);
