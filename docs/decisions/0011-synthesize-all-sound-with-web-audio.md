# 0011. Make every sound in the browser with Web Audio

- Status: accepted
- Date: 2026-11-22
- Round: 6 (R61 music, background sounds and cat noises)

## Decision (Y-statement)

In the context of **adding background music, weather and nature sounds, and cat noises to a game that
must stay free, work from `file://` with no build step, and keep its rules testable without a page**,
facing **the choice between shipping recorded sound files and making the sounds in code, and the fact
that browsers block sound until the player presses a key or clicks**,
we decided for **a new `sound.js` that builds every sound with the Web Audio API (looping filtered noise
for wind, rain and the river; short tones for birds, crickets and a slow pentatonic tune; noise bursts
and gliding tones for meows, hisses, purrs, swipes, crunches and splashes). `soundLevels()` works out how
loud each background sound should be from the game state and is plain maths, so the tests can check it.
`game.js` asks for one-off sounds only through `hooks.sound(name)`, and the audio starts on the first key
press or click**,
and neglected **recorded sound files (MP3/OGG in the repository), and a sound library from a CDN**,
to achieve **sound with no downloads, licences or extra files, rules that still have no audio code, and
sound behaviour that the automatic tests can check without speakers**,
accepting **that synthesized sounds are simpler and less natural than recordings (a meow is a filtered
gliding tone), and that the actual audio output itself is not tested, only the levels and the events.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Recorded sound files | Owner chose "synthesized, all of it". Files also need free licences to be checked, add download size, and some browsers refuse to load audio from `file://` without a server. |
| A sound library from a CDN (e.g. Howler, Tone.js) | Another dependency for something Web Audio already does; Howler still needs files, and Tone.js is large for a few sounds. |

## Consequences

- New file `sound.js`, loaded after `render3d.js` and before `script.js` (also on `tests.html`).
- `hooks` gained `sound`. Sound names: `meow`, `hiss`, `purr`, `swish`, `crunch`, `splash`.
- The Esc menu has a volume slider (`#volume`) and a mute checkbox (`#mute`); a checkbox keeps the R26
  check of the menu's buttons unchanged.
- `script.js` calls `updateSound()` every frame and `startAudio()` on the first key press or click.
