# Handoff: end of Round 2 (2026-11-21)

For the session that will build the next round. Standing rules for every session are in
`CLAUDE.md`; this file covers only where things stand after Round 2. The Round 1 handoff
(`handoff-round-1.md`) is still useful background, but one line in it is out of date: its commits
were pushed after it was written.

## Current state

- Round 2 (R12–R20 in `problem.md`) is built. **All 171 checks in `tests.html` pass**: 89 from
  R1–R11, adjusted where Round 2 changed the world, plus 82 new ones.
- Everything is committed and pushed: `master` = `origin/master` at `730bb0b`.
- `spec.md` has a "Round 2" section that describes exactly what was built, including every number
  (damage, ranges, food values). Read it before changing behaviour.
- To check that the tests can fail, three deliberate bugs were tried; the matching tests failed for each:
  - Instant turning: 3 R12 checks failed.
  - Patrols that never see you: 2 R16 checks failed.
  - A pouch of 50: 5 R18/R19 checks failed.
- Six screenshots were checked visually, but **no one has played the game by hand yet**:
  - Camp with dens, as a medicine cat.
  - Scent trails.
  - The map with the herb pouch open.
  - A ShadowClan patrol fight in the marsh.
  - Plus Round 1's forest and night views.
- GitHub Pages: not known whether the owner has turned it on.

### What the game is now

- **World:** 240 × 240 units, split into 4 territories by x = 0 and z = 0:

  | Territory | Where | Look |
  | --- | --- | --- |
  | ThunderClan | south-west | Oak forest |
  | ShadowClan | north-west | Pine marsh |
  | WindClan | north-east | Moor |
  | RiverClan | south-east | Riverside |

  - Each camp is at (±60, ±60).
  - The big river is at x 30–36 and a stream at x −34 to −30, so every territory has water.
- **Progression:**
  1. Kit: squirrel, then fishing.
  2. Apprentice: **choose a mentor** (the game waits), then fight the rogue.
  3. **Choose a role** (Warrior, Deputy or Medicine cat).
  4. Warrior or deputy can become Leader.
- **Systems added in Round 2:**
  - Smooth turning (R12).
  - Beetles and mice (R13).
  - Scent with Q (R14).
  - Map with M (R15).
  - Camp cats and enemy patrols (R16).
  - Dodge C, pounce attack F, bite R (R17).
  - Herb pouch with H, and healing hurt camp cats (R18).
  - Mentors (R19).
  - Dens and the fresh-kill pile (R20).

### Code layout

| File | Lines | Role |
| --- | --- | --- |
| `game.js` | ~1570 | All rules and state as plain globals, in sections: settings, state, territories, helpers, world building, update loop, hunting, scent, fishing, fighting, levelling/mentors/roles, camp cats, herbs, camp, day, camera. |
| `render3d.js` | ~770 | `buildScene()` builds the whole world; `renderFrame()` draws a frame. It rebuilds the scene by itself if the clan changed. |
| `script.js` | ~400 | Keyboard, menu, HUD, map canvas (`drawMap`, `mapToCanvas`), herb pouch panel, mentor and role buttons, main loop. |
| `tests.html` | ~1190 | A copy of the page markup plus the checks, run in order. |

Key ideas in `game.js`:
- `spotFor(clan, u, v)` turns a place measured from a camp into world coordinates. The same layout
  is mirrored into each quarter: u and v point away from the middle of the world, and the water is
  at about u = −27 everywhere.
- `resetGame()` fills in `CAMP`, `ROGUE_HOME`, `ROGUE_SPAWNS`, `FRESH_KILL` and `dens` for the
  chosen clan, then rebuilds `trees`, `herbs`, `prey`, `campCats` and `patrols`.
- Pressing E runs `doAction()`, which picks one action in this order:
  1. An enemy in front: swipe.
  2. `tryInteract()`: a hurt clanmate, then a herb, the fresh-kill pile, a den.
  3. Prey in reach: catch it.
  4. Fish (when by the water).
  5. A kit's missed pounce.
  6. Otherwise, swipe.

  C, F and R are separate keys.
- Enemies (the rogue and patrol cats) share `fightStep()`, `hurtEnemy()` and `defeatEnemy()`. The
  player's moves only hit enemies whose `state === "fighting"`.
- `ui.map` and `ui.pouch` live in `game.js`, so the tests can press M and H like other keys.

## How to run

- **Game:** open `index.html` in a browser. It needs internet the first time (Three.js from cdnjs).
- **Tests:** open `tests.html`, or use the headless Edge command in `CLAUDE.md`. A full run takes
  about a minute.

## Decisions made in Round 2, and why

These are the owner's answers. They are logged in `decision.md`, Session 3.

| Decision | Why |
| --- | --- |
| 4 territories, each with its own look; your camp in your territory (R15/R16) | The map and attacks need other clans' land. |
| Keep the squirrel kit task; add beetles and mice anyone can catch, all game (R13) | Owner's choice. |
| Add pounce attack, dodge and bite (R17) | Owner picked these; block was not picked. |
| 3 mentors, one specialty each, bonus for the whole game (R19) | Owner's choice. |
| Herbs go into a small personal pouch (H); anyone heals themselves; medicine cats heal injured clanmates (R18) | Owner's choice. The owner stressed "the pouch is small". |
| The homebase is a full camp with dens and a fresh-kill pile (R20) | Owner's choice. |
| Scent: hold a key; glowing trails, even through trees (R14) | Owner's choice. |

These are technical decisions with records in `docs/decisions/`:

- **0003:** one fixed map in four quarters, with each camp in its clan's quarter. Not chosen: always
  putting your clan in the middle, or separate areas joined by paths.
- **0004:** smooth turning with a turn speed that ramps up plus a lagging camera, both in `game.js`.
  Not chosen: mouse-look, or smoothing only the camera in the renderer.

The owner did not ask for the following; they are listed in the final message of the Round 2
session and written in `spec.md`. These are the ones most likely to be revisited:

- **Map:** the quarter positions, the 240-unit world, and the added stream.
- **Prey:** 6 beetles and 4 mice at a time, back 10 s after being caught. Beetles don't count toward
  leader. With full food, prey is carried to the fresh-kill pile.
- **Patrols:** they see you within 14 units, have 40 health, and recover after 30 s. Beating one
  counts as a fight (after choosing a role).
- **Combat unlocks:** kits can only swipe and dodge. Pounce attack unlocks at apprentice and bite at
  warrior; the fighter mentor unlocks bite at apprentice. All combat numbers are in `spec.md`.
- **Names:** the mentors Mosswhisker, Briarfang and Fernsong, and the queen Dawnpetal, are invented
  names.
- **Herbs:** marigold heals 30 and dock leaf 15. A pouch holds 5, or 8 with the herb-wise mentor.
  A camp cat gets hurt about every 45 s.
- **Rest:** sleeping only works in your own rank's den, never during a fight, and wakes you at 07:12.

## Unresolved (ask the owner)

1. "Forest Clans" is still a placeholder title.
2. `CLAUDE.md` calls the spec `SPEC.md`, but the file is `spec.md`.
3. Is GitHub Pages turned on?
4. Should progress be saved in the browser? There is still no saving.
5. Should dens and the Highrock block movement? Right now cats walk through them.
6. R17's "block" move wasn't chosen. Is it wanted later?
7. Other clans' camps have dens but nobody lives in them except the patrols. Is that wanted?
8. Should beetles count as prey toward becoming leader?

## Warnings for the next session

- **The test-writing rules learned this round are now in `CLAUDE.md` under Testing.** They cover
  placing cats relative to the camp, `quiet()`, `snapCamera()`, and `step(0.5)` before walking.
  Random prey stealing an E press hasn't caused a failure yet, but it could.
- **The game pauses at the mentor choice (stage 2) and at the role choice (stage 3).** A test that
  sets `stage` directly skips the choice. A test that plays through must click a mentor button
  before the rogue fight.
- `resetGame()` replaces `trees`, `herbs`, `prey`, `campCats` and `patrols`. `renderFrame()`
  rebuilds the 3D scene by itself when the clan or those list lengths change. If you add new lists
  that have 3D models, add them to that check in `renderFrame()`, or call `buildScene()`.
- **While the herb pouch is open, 1 and 2 use herbs instead of giving leader orders.** Any new
  number-key feature must respect `ui.pouch`.
- **Performance is untested on real hardware, and the world is now 4× bigger:**
  - About 300 trees (only those within 80 units sway).
  - 3500 grass blades whose position and colour are updated every frame.
  - 14 cat models.

  If it's slow, try these first: the grass count (`blades` in `buildScene`), the tree count
  (`buildTrees`), or the marsh and moor details.
- `game.js` has grown to about 1570 lines. If the next round adds a lot, consider splitting the
  rules into more files (still with no page or Three.js code). That would need a decision record
  and a `CLAUDE.md` update.
- `clockText()` rounds to avoid showing 07:11 for 07:12 (floating-point). Keep that if you change it.
- Git prints LF→CRLF warnings on every commit. They are harmless.
