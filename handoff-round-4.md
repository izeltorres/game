# Handoff: end of Round 4 (2026-11-21)

For the session that will build the next round. Standing rules for every session are in
`CLAUDE.md`; this file covers only where things stand after Round 4. The earlier handoffs are still
useful background (world layout in `handoff-round-2.md`; huts, rocks and grass in
`handoff-round-3.md`), except where Round 4 changed them as described below.

## Current state

- Round 4 (R30–R46 in `problem.md`; there is no R33 or R34) is built. **All 310 checks in
  `tests.html` pass.**
- The full suite passed **4 times in a row** on the final code.
- To check that the tests can fail, three deliberate bugs were tried; each was caught by the matching checks:
  - Kits allowed out of camp (R42).
  - Leaders fainting instead of losing a life (R37).
  - Storms not hiding prey (R30).
- Everything is committed and pushed: `master` = `origin/master` at `604900a`.
- `problem.md` has empty `## Round 5` and `## Round 6` headings. The next round's requirements go
  there. If they are still empty, ask the owner. Don't invent requirements.
- Screenshots were checked (kits in camp, fishing with fish in the water, a thunderstorm, a sitting
  leader with lives), but **no one has played the game by hand yet**. Round 4 changed the whole way
  through the game, so a full play-through by a person is the most useful next check.

### The path through the game now (R42–R45)

1. **Kit (`stage` 0):** stays inside the camp (`KIT_BOUNDARY` = 12). Catches 5 beetles and 3 mice
   (`KIT_NEEDS`, counted in `kitCatches`) and grows from size 0.5 to 0.75. Then
   `becomeApprentice()` runs.
2. **Apprentice (`stage` 1):** chooses a mentor. The mentor gives `APPRENTICE_TASKS` in order:
   `patrol` (3 `BORDER_MARKERS`), `squirrel`, `fish` (3 fish), `rogue`. `currentTask()` names the
   task, `finishTask()` moves on, and the mentor walks ahead toward `taskSpot()`.
3. **Path choice (`stage` 2):** Warrior or Medicine cat (`ROLES`). The ceremony message gives the
   warrior name.
4. **Warrior → Deputy:** `DEPUTY_NEEDS` (5 prey, 3 fights, 1 border patrol).
   **Deputy → Leader:** `LEADER_NEEDS` (3 prey, 2 fights, 1 trained apprentice). Both are checked
   in `checkPromotion()` and done in `promote()`.
5. **Training (deputy):** a camp kit becomes `trainee`. Lessons are in `trainee.lesson`: `hunt` (it
   catches 3 prey within 15 of you), `battle` (3 E hits facing it, handled by `trySparring()`), then
   `patrol` (the border markers). `finishTraining()` makes it a warrior.
6. **Leader:** `player.lives` = 9. At 0 health `knockedOut()` takes a life. The last life sets
   `ui.gameOver`.

### Other Round 4 systems

- **Weather (R30):** `weather`, `setWeather()`, `updateWeather()` (every `WEATHER_TIME` = 240 s).
  - `preyAllowed()` hides prey: rain lets out only the critters whose `slot` is even; storms hide all of it.
  - `scentRange()` and `stealthMult()` include the weather.
  - In a storm, patrols act like camp cats.
- **Kits (R31):** the `kits` list holds your 4 and 2 per rival camp. `updateKits()` handles play
  (`activity`: chase / pounce / tumble / wander), rival kits hiding (`hiding`), and the trainee.
- **3D fishing (R35):** `fishing.fish` swim in `fishing.water`. `pawSpot()` and `pawReach()` decide
  a catch. `swipeAtFish()` catches or splashes, and `fish.dart` makes fish flee.
- **Mouse look (R32):** `lookWithMouse(dx, dy)`, `player.camPitch`, and the pointer-lock handling in
  `script.js` (`mouseLocked`).
- **Animations (R46):** `postureFor()` and `poseCat()` in `render3d.js`. Game state feeds them
  `player.idleTime`, `player.eatTimer`, `hp < LOW_HEALTH` (limp) and `hurtTimer` (flinch).

### Code size

| File | Lines |
| --- | --- |
| `game.js` | ~2280 |
| `render3d.js` | ~1300 |
| `script.js` | ~460 |
| `tests.html` | ~1830 |

## How to run

- **Game:** open `index.html` (needs internet the first time, for Three.js r128 from cdnjs).
- **Tests:** open `tests.html`, or use the headless Edge command in `CLAUDE.md`. One run now takes
  about 3–4 minutes. Give the Bash tool a timeout of at least 300000 ms, or run it in the background.

## Decisions made in Round 4, and why

These are the owner's answers. They are logged in `decision.md`, Session 5.

| Decision | Why |
| --- | --- |
| Kits catch a mix: 5 beetles + 3 mice (R42/R45) | Owner picked the "mix" option. |
| Mentor tasks: patrol, squirrel, fish, rogue (R44/R45) | Owner picked all four. |
| Only deputy → leader needs training, with a camp kit (R36/R39) | Owner's choice. |
| Training by lessons together (R36/R39) | Owner's choice. |
| The 9th life lost = game over (R37) | Owner's choice. |
| Mouse tilts the camera (R32) | Owner's choice. |
| Realistic fish model + real 3D fishing (R35) | Owner picked both. |
| Weather: clear, rain, fog, wind, thunderstorm (R30) | Owner picked the thunderstorm set. |
| R38 unchanged | Owner said it was fine. |
| Random warrior name in a leader's ceremony (R40) | Owner's choice. |
| Kits in your camp and in other camps (R31) | Owner answered "both". |
| Animations: idle life, better moves, eating/hurt (R46) | Owner picked these three. |

These are technical decisions with records in `docs/decisions/`:

- **0007:** 3 life stages (`stage` 0/1/2), with the steps inside each kept as lists. Not chosen:
  keeping the old 4 stage numbers, or one number per step.
- **0008:** mouse look with Pointer Lock, where losing the lock opens the menu. Not chosen:
  click-and-drag, or following the pointer.

The owner did not ask for the following; they are listed at the end of the Round 4 session and are
in `spec.md`. These are the ones most likely to be revisited:

- **Numbers:** kit boundary 12; marker radius 4; training lessons (3 prey, 3 hits); weather timings
  and strengths; fishing reach 0.55; tilt limits −0.5 to 0.8; low health 30.
- **Kit names:** Pebble, Ember, Sedge and Wren are invented.
- **The clan leader:** gives the ceremony in a message but isn't a visible cat.
- **Fishing:** after the apprentice task, each fishing trip ends after one catch.
- **Border markers:** they were moved this round so they are well away from rogue spawn spots (see warnings).

## Unresolved (ask the owner)

1. `CLAUDE.md` calls the spec `SPEC.md`, but the file is `spec.md`. This has been open since Round 1.
2. Is GitHub Pages turned on?
3. Should progress be saved? A full game is now much longer, and there is still no saving.
4. Should there be a visible clan leader cat (for the ceremony, and the camp)?
5. Should the medicine cat path get more to do (its own tasks or promotion)? Right now it ends at
   healing clanmates.
6. Earlier open items are still open: lighter hut interiors, R17's "block" move, beetles counting as prey.
7. `handoff-round-1.md` still has an out-of-date line about its commits not being pushed.

## Warnings for the next session

- **Kits can't leave camp (R42), so checks that roam must not run as a kit.** Use `freshApprentice()`
  or `freshWithRole()` in `tests.html`, as `walkFor()` and `climbFor()` do. That rule is now in
  `CLAUDE.md`.
- **`quiet()` empties `prey`.** Checks that need prey afterwards must add it back with `addPrey()` or
  `makeCritter()`. The R30 weather checks do this.
- **`promote()` resets `stats` to zero.** Don't check a count after the promotion it triggered.
- **Border markers must stay away from rogue spawn spots.** A leader standing on a marker next to a
  rogue loses lives while the tests wait. Markers are at local spots (10, −50), (50, −15) and (−10, 45).
- **Doorways:** `moveToward()` opens the doorway of the hut a cat is in, is going to, or is standing
  in (`doorwayHut()`). Without the last one, cats got stuck bouncing in the band between "inside"
  (`R − 0.05`) and the wall line (`R`). Keep all three if you change huts.
- **Editing tip:** don't splice files with `awk -v f="$TEMP/..."`. `$TEMP` is a Windows path, and awk
  reads its backslashes as escapes, which silently loses the inserted text. This deleted a block of
  `game.js` this round (it was restored before any commit). In perl patterns, escape parentheses or
  use `\Q...\E`. A pattern with unescaped `(`…`)` silently matches nothing. The Edit tool avoids
  both problems.
- **Speed is still not measured on real hardware.** Round 4 added 10 kit models, rain streaks, and
  per-cat animation work every frame.
- Git prints LF→CRLF warnings on every commit. They are harmless.
