# Handoff: end of Round 6 (2026-11-22)

For the session that will build the next round. Standing rules for every session are in
`CLAUDE.md`; this file covers only where things stand after Round 6. Earlier handoffs explain the
world (`handoff-round-2.md`), huts, rocks and grass (`handoff-round-3.md`), the kit → leader path
(`handoff-round-4.md`), and Gatherings, missions, rivalry and medicine cats (`handoff-round-5.md`).
That is all still true except where Round 6 changed it, as described below.

## Current state

- Round 6 is built: R58–R69 from `problem.md`, plus R70–R72, the three items the owner settled after
  Round 5. They are numbered R70–R72 only in `spec.md`; `problem.md` stops at R69.
  - **All 424 checks in `tests.html` pass**, 57 of them new:

    | R58 | R59 | R60 | R61 | R62 | R63 | R64 | R65 | R66 | R67 | R68 | R69 | R70 | R71 | R72 |
    | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
    | 5 | 6 | 2 | 6 | 6 | 5 | 7 | 2 | 1 | 2 | 2 | 6 | 5 | 1 | 1 |

- The last two full runs passed. An earlier run had 3 flaky failures, explained and fixed (see warnings).
- Two deliberate bugs were tried, and each was caught:
  - Removing the river current failed R59.
  - Counting every beetle as a prey failed R72 and R13.
- Everything is committed and pushed: `master` = `origin/master` at `7aa0742`.
- `problem.md` has no Round 7 section yet. Ask the owner for the next round's requirements; don't
  invent them.
- **No one has played the game by hand since Round 4.** The tests can't judge how the sounds,
  textures, seasons, river and rogue packs look, sound or feel, or whether it runs smoothly. That is the
  most useful next check.

### What Round 6 added

The rules are in `game.js`, in a `// Round 6` section just above "Day and night", unless noted.

- **Solid cats (R58):**
  - `pushPlayerOutOfCats()` keeps you `CAT_BODY` (0.75) away from cats; kits get 3/4 of that.
  - `moveToward()` refuses a step that would take a cat closer to you than that, so cats stop when they
    reach you.
- **Mentor (R58):**
  - Following you, the mentor sets `c.demo` (from `DEMOS`) when it is within 3.5 of the task spot.
  - `tryTalk()` is E facing the mentor: it repeats `TASK_TEXT` plus `TIPS`.
- **River (R59):**
  - `waterDepthAt(x)` returns `"deep"`, `"shallow"` (the outer `SHALLOW` = 1.2 units) or `null`.
  - `swimming()` means deep water and not on a stone.
  - `CURRENT_SPEED` pushes deep-water swimmers toward −z; wading is `WADE_SPEED`.
  - `steppingStones` (from `buildSteppingStones()`) count as dry land.
  - Walking into water sets `player.splashTimer` and plays a splash.
- **Sound (R61):** new file `sound.js` (decision 0011).
  - `soundLevels()` is plain maths from the game state.
  - `startAudio()` runs on the first key or click; `updateSound()` runs every frame; `playCatSound()` is
    set as `hooks.sound`.
  - `game.js` calls `playSound(name)` with one of `meow`, `hiss`, `purr`, `swish`, `crunch`, `splash`.
  - `soundVolume` and `soundMuted` come from `#volume` and `#mute` in the Esc menu.
- **Rogue packs (R62):**
  - Once you are a warrior, `spawnRoguePack()` replaces the single rogue: the leader is the old `rogue`
    with `smart: true` and `state: "roaming"`, and the rest are in `rogueMates`.
  - `updateRoguePack()` handles roaming, spotting you (`ROGUE_SIGHT`) and the camp raid
    (`raidClock` ≥ `ROGUE_RAID_AFTER`).
  - In a fight, `playerHits()` gives smart rogues a `ROGUE_DODGE` chance to sidestep, and `fightStep()`
    makes them circle you.
  - `beatRogue()` makes the whole pack flee.
  - The apprentice's rogue is unchanged: single, `smart: false`.
- **Social (R63):**
  - `trySocial()`: E facing a camp cat or clanmate grooms it (+`GROOM_HEAL`, once per `GROOM_COOLDOWN`
    for each cat); E facing a kit starts a `"playpounce"` game.
  - `updateSocial()` pairs camp cats every `SOCIAL_TIME`, setting `c.social` / `c.partner`.
  - Kits get a `"visit"` activity, in which they sit in front of you.
- **Climbing (R64):**
  - `lookingOut()` and `spottedFromTree()` (above `LOOKOUT_HEIGHT`, within `LOOKOUT_RANGE`).
  - `outOfReach(enemy)`: enemies can't hit you above `TREE_REACH`; `canReachUpTree()` is true only for
    ThunderClan.
  - Perched sparrows have `perch: { tree, y }` and are caught with E while climbing at their height.
  - The task list is now patrol → squirrel → **climb** → fish → rogue.
- **Fresh-kill pile (R65/R66):**
  - `pileItems` holds `{ kind, day }`, and `freshKill` always equals its length.
  - Always change the pile with `addToPile(kind, n)` / `takeFromPile(n)`.
  - `updatePile()` clears pieces more than a day old.
  - Camp cats have a `hungerTimer`; at 0 they walk to the pile and eat one piece.
- **Seasons (R69):**
  - `season()` is worked out from `day` (`SEASON_DAYS` = 30, starting in newleaf).
  - `weatherChoicesFor(season)` is used by `updateWeather()`.
  - `respawnTime()` halves the time in greenleaf.
  - `preyAllowed()` treats leaf-bare like rain (half the prey).
- **Leaders (R70):**
  - `leaders` has one per clan, standing at `spotFor(clan, 4, -13)` by the Highrock, and moved by
    `updateLeaders()`.
  - Rival leaders walk to `gatheringSpotFor()` while a Gathering is called. `startGathering()` now uses
    these same objects as `gatheringLeaders`.
  - `promote("Leader")` sets your old leader's `retired`.
  - The ceremony names the leader.
- **Rival medicine cats (R71):** a beaten patrol cat limps home and lies `resting`, and after 3 s
  (`restTime`) its clan's medicine cat walks over and ends the rest.
- **Beetles (R72):** after choosing a role, `stats.beetles` counts them, and every `BEETLES_PER_PREY`
  (4) adds a hunt.
- **`render3d.js`:**
  - Textures: `makeTexture()` and `texturedMat()` (decision 0012).
  - `TREE_SWAY` = 0.5.
  - `updateRound6View()` draws: the flowing water, the jumping fish and splash, the pile prey
    (`view.pileModels`), the glowing `view.markerModels`, `view.leaves` and `view.snow`, the seasonal
    leaf tint, the lookout cones (`view.spotMarkers`) and `view.rogueMateModels`.
  - Leaders are always drawn; resting rival cats are drawn lying down.
  - Mentor demos, social poses and kit play are drawn in `updateCats()` / `updateKitModels()`.
- **`script.js`:**
  - The HUD shows the season and the lookout.
  - The patrol task always points to the next marker, with its distance.
  - The map shows markers (yellow, `#ffd86b`), plus spotted prey and enemies while you are looking out.
  - It also has the volume and mute wiring and the audio start.

### Code size

| File | Lines |
| --- | --- |
| `game.js` | ~3430 |
| `render3d.js` | ~1790 |
| `script.js` | ~570 |
| `sound.js` | ~200 |
| `tests.html` | ~2590 |

## How to run

- **Game:** open `index.html`. It needs internet the first time (Three.js r128 from cdnjs).
  - Sound starts after the first key press or click.
  - Esc opens the menu, with the controls, volume and mute.
- **Tests:** open `tests.html`, or use the headless Edge command in `CLAUDE.md`.
  - **One full run takes about 12–15 minutes.**
  - Run it in the background with a long timeout (e.g. 1 800 000 ms) and wait for the notification.
  - Two runs can go at the same time if each has its own `--user-data-dir` (see `CLAUDE.md`).

## Decisions made in Round 6, and why

These are the owner's answers, logged in `decision.md`, Session 7.

| Decision | Why |
| --- | --- |
| Build R70–R72 (visible leaders, rival medicine cats treat their own, 4 beetles = 1 prey) in Round 6 | Owner's choice. |
| Mentor: solid body, demonstrates, can be talked to (R58) | Owner picked these three. |
| All sound synthesized, no files (R61) | Owner's choice. |
| Rogues: packs, stronger and smarter, roam and hunt, steal and hurt (R62) | Owner picked all four. |
| Social: share tongues, play with kits, camp cats interact (R63) | Owner's choice. |
| Climbing: see further, escape danger, prey in trees, climbing task (R64) | Owner picked all four. |
| Seasons every 30 game days (R69) | Owner's choice. |
| River: current, banks and stones, depth, river life (R59) | Owner picked all four. |
| Textures on ground, trees and rocks, fur, huts and water (R60) | Owner picked all four. |
| Pile, markers and trees use the proposed defaults (R65, R67, R68) | Owner accepted the defaults. |

These are technical decisions with records in `docs/decisions/`:

- **0011:** every sound is made with Web Audio in `sound.js`. Files would need licences and can fail
  from `file://`. `soundLevels()` is plain maths, so it can be tested.
- **0012:** textures are drawn on a canvas at start-up, because WebGL refuses image files loaded from
  `file://`.

The owner did not ask for the following. They were listed at the end of the session, and these are
the ones most likely to be revisited:

- **Numbers:**
  - The current is 1 unit per second, and the shallows are 1.2 units wide.
  - Pack leaders have 90 hp and deal 18 damage; the rest have 60 hp and deal 14. Packs have a 30%
    dodge chance, spot you from 18 units, and raid after 2 minutes.
  - Grooming gives +10 hp, once every 30 s per cat.
  - The lookout starts above 3 units and reaches 60; enemies can't reach you above 1.5; the climb task
    finishes at 1.8.
  - Camp cats get hungry every 3–4 minutes.
  - Rival medicine cats treat a beaten cat after 3 s.
- **Choices:**
  - The apprentice's rogue stays single.
  - The river stays straight.
  - Stepping stones cross at z = ±20.
  - Your old leader simply disappears (`retired`) when you become leader.
  - The seasonal weather mixes and the number of leaves are my picks.
  - The music is one slow pentatonic loop.

## Unresolved (ask the owner)

1. `CLAUDE.md` calls the spec `SPEC.md`, but the file is `spec.md`. This has been open since Round 1.
2. Is GitHub Pages turned on?
3. **Saving progress:** reaching leader takes a long time, and a season lasts 30 game days (30 real
   hours). Without saving, nobody will see leaf-bare in normal play. Ask whether to add saving, or
   whether seasons should be shorter.
4. Speed on real hardware: Round 6 added textures, about 200 river meshes, 1 400 leaf and snow points,
   and more cat models. Is it smooth on the owner's computer?
5. Older open items: the R17 "block" move, and the out-of-date line in `handoff-round-1.md`.
6. Should a retired leader go to an elders' den, rather than disappear?

## Warnings for the next session

- **Cats are solid now (R58), and that affects tests.**
  - A check that walks the player forward toward a cat (an enemy in front, a mentor, a kit) is stopped
    about 0.75 units short.
  - The R17 pounce check had to walk away from the rogue instead.
  - If a movement check suddenly fails, look for a cat in the way first.
- **More things now happen on their own during long checks:**
  - Rogue packs roam and attack once you are a warrior.
  - Camp cats eat from the pile (the first after 150 s) and pair up every 10 s.
  - Kits walk up to you in camp.
  - This round, these broke checks that counted the pile exactly, watched one camp cat walk, or
    expected a leader to still have 9 lives. Set up what a check needs instead: `rogue.state = "gone"`
    with a big `rogue.respawn`, `rogueMates = []`, `c.hungerTimer = 999`, `socialClock = 999`, and count
    the pile relative to its value at the start.
- **Always change the pile through `addToPile()` / `takeFromPile()`.** `updatePile()` repairs a
  changed `freshKill`, but it adds plain mice and drops the oldest pieces.
- **E order** (`doAction()`):
  1. An enemy in front.
  2. Sparring.
  3. `tryInteract()`.
  4. Prey in reach.
  5. `tryTalk()` (mentor talk, grooming, kit play).
  6. Fishing.

  Talking and grooming come *after* prey on purpose. Before that change, the mentor beside you stole
  the squirrel pounce.
- **Mutation note:** with the river current removed, 15 unrelated deputy and leader checks (R39, R45,
  R9, R18, R37) also failed. Some check in that part accidentally relies on the current moving the cat
  (probably a deputy or leader placed in or near the water). It is harmless while the current exists,
  but find it before the river changes again.
- **`quiet()` removes all trees.** A check that needs trees after it (as the R60 texture check did) must
  add its own, or not depend on them.
- **The suite is slow and random.** Run it at least twice; parallel runs with separate profiles save
  time. If one check fails once, replay that scenario many times in a page that loads only `game.js`.
- An error inside `update()` stops the rest of that frame. If many unrelated checks fail at once, look
  for one thrown error first.
- Git prints LF→CRLF warnings on every commit. They are harmless.
