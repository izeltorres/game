# Handoff: end of Round 7 (2026-11-22)

For the session that will build the next round. Standing rules for every session are in
`CLAUDE.md`; this file covers only where things stand after Round 7. Earlier handoffs explain the
world (`handoff-round-2.md`), huts, rocks and grass (`handoff-round-3.md`), the kit → leader path
(`handoff-round-4.md`), Gatherings, missions, rivalry and medicine cats (`handoff-round-5.md`), and
solid cats, sound, seasons, rogue packs and the fresh-kill pile (`handoff-round-6.md`). That is all
still true except where Round 7 changed it, as described below.

## Current state

- **Round 7 is built:** R70–R77 from `problem.md`.
  - **Renumbering:** as the owner chose, the three items settled after Round 5 are now **R69a–R69c**
    in `spec.md`, the test names and the code comments (they used to be R70–R72). Round 7 keeps the
    owner's R70–R77.
  - **Checks:** `tests.html` has **453 checks**, 29 of them new for Round 7:

    | R70 | R71 | R72 | R73 | R74 | R75 | R76 | R77 |
    | --- | --- | --- | --- | --- | --- | --- | --- |
    | 4 | 2 | 1 | 8 | 4 | 5 | 3 | 2 |

    There is also one new R39 check for the battle-practice fix.
- **Two small changes the owner asked for after the round** (commit `0797a16`, logged in `decision.md`
  under "After Round 7"):
  - **Rogue packs wait longer.** The first pack comes 2 minutes after the apprentice's rogue (it was
    20 s); later packs come 4 minutes after one is chased off (it was 40 s).
  - **Battle practice.** The deputy's apprentice squares up 1.5 units in front of you, crouched and
    facing you, and stays put so you can turn to face it. Before, it kept running round behind you.
- **Test status: not fully clean.**
  - Before those two changes, the suite passed 3 times in a row at `96ea4b3` (452 checks).
  - On the current code (`0797a16`, 453 checks), 3 parallel runs gave: all passed; 1 failure,
    "R39: your apprentice follows you"; and 1 failure, "R42: a kit can't walk out of camp". Each failed
    once and passed in the other two runs.
  - Neither has been investigated yet; both look like a flaky check rather than a broken rule:
    - **R42:** the kit walks out from the middle of camp for 4 s. A solid camp cat or kit (R58) in its
      way can stop it reaching the edge in time. Probably needs the same "move cats off the spot"
      setup as `kitSpot()`.
    - **R39:** during the hunting lesson the apprentice chases prey within 15 units of you, so after
      8 s it can still be more than 5 units away.
  - **Fix these first next session**, by replaying each scenario many times in a page that loads only
    `game.js`.
- **Deliberate bugs, each caught:**
  - Making the river straight failed all 4 R74 checks.
  - Removing the call cooldown failed the R75 "can't call again" check.
- Everything is committed and pushed: `master` = `origin/master` at `6d144a5`.
- **`problem.md` already has a `## Round 8` section (R78–R84).**
  - R78 and R79 also appear a second time, right after Round 7's list. Ask the owner which copy is
    meant before numbering anything.
  - Round 8 also contains R84 "save progress", which has been an open question since Round 4.
- **No one has played the game by hand since Round 4.** That is the most useful check still missing:
  how the winding river, the branches, the nametags and the sleeping pose look, and whether the game
  runs smoothly with about 520 branch models added.

### What Round 7 added

Unless noted, the rules are in `game.js`, in a `// Round 7` section just above "Day and night".

- **Nametags (R70):**
  - `importantCats()` returns your mentor (while you are an apprentice), your apprentice (while you
    are deputy), every leader that hasn't retired, and every medicine cat.
  - `render3d.js` `updateRound7View()` keeps one canvas-text sprite per cat in `view.nametags`
    (`userData.source`, `userData.text`). A tag shows only within `NAMETAG_RANGE` (25 units).
  - There are no deputy cats (owner's choice).
- **Sleeping (R71):**
  - `useDen()` now starts `player.sleeping = SLEEP_TIME` (3 s). `updatePlayer()` returns early while
    asleep, then calls `wakeUp()`, which does the old "next morning, full health" step.
  - It is drawn with the `curl` posture (`postureFor` / `tailPoseFor`).
- **Markers (R72):** each marker is now a flat glowing patch and ring (`view.markerModels`, with
  `userData.radius`, `glow`, `glowMat` and `ring`). There is no post.
- **Branches (R73):**
  - Every tree gets `branches: branchesFor(h, phase)`: a low branch (1.4–1.9 units up) and a high one.
    They are made from the tree's `phase`, so no extra random numbers are drawn and the tree layout
    doesn't change.
  - While climbing, E within `BRANCH_REACH` of a branch's height calls `stepOntoBranch()`, which sets
    `player.onBranch` and `player.branchTree`.
  - `updateBranch()` handles getting off: E or S goes back to the trunk, Space jumps down.
  - `outOfReach()` and `lookingOut()` count a branch as being up the tree.
  - The cat is drawn with the `lie` posture (`pose.lieDown`), and the branches with
    `view.branchModels`.
  - Trees that tests push themselves have no `branches`. The code allows for that with
    `tree.branches || []`.
- **Winding river (R74), decision 0013:**
  - `riverShift(z)` = 5·sin(2πz/80), and `watersAt(z)` returns `[river, stream]` edges at that z.
  - **`inRiver(x, z)`, `nearRiver(x, z)` and `waterDepthAt(x, z)` now need `z`.**
  - `waterNear(x, z)` returns an index (0 = river, 1 = stream), and `fishing.water` is now that index.
  - `RIVER_X0`/`RIVER_X1` are the river's edges at z = 0 only.
  - Drawing: the water, banks and shallows are strips built along z (`makeWaterStrip()`;
    `view.riverMesh.userData.middleAt(z)`), and the grass shader gets a `uBend` uniform.
  - The map and the river sound use `watersAt` too.
  - The stepping stones are at z = ±20, which is the top of a bend.
- **Calling a patrol (R75), decision 0014:**
  - V calls `callPatrol()`. It works only while `packAttacking()`, with `CALL_COOLDOWN` (60 s)
    between calls.
  - Up to 3 of the camp cats that aren't hurt are sent, never `QUEEN`. They get `helping`, `helpTimer`
    and `swipeTimer`.
  - `updateHelpers()` runs them to the nearest fighting rogue (8 damage every 1.2 s), then home.
    `updateCampCats()` skips them while they are out.
  - `defeatEnemy()` no longer counts a single pack member running off as a fight won. Only beating
    the leader (`beatRogue()`) counts.
- **Rain (R76):** `weatherChoicesFor()` now picks from 12 weathers per season.
  - Newleaf and leaf-fall are the rainy seasons.
  - Greenleaf has no plain rain, only one storm in its 12.
  - Leaf-bare has neither.
  - `setWeather()` makes rain and storms last `WEATHER_TIME / 2`.
- **Rogue packs (R77):** `ROGUE_PACK_HP` is 130 and `ROGUE_MATE_HP` is 80.
  - `ROGUE_RESPAWN` (120 s, now only the wait before the first pack) and `ROGUE_PACK_RESPAWN` (240 s)
    were lengthened after the round.
  - `updateRogue()` uses the pack wait when the beaten rogue was `smart`.
- **Battle practice fix:** in `updateTrainee()`, a `"battle"` lesson sets a `sparSpot` in front of
  you. The apprentice stays there facing you, play-swiping now and then (`attackTimer`), until you
  walk more than 5 units away.

### Code size

| File | Lines |
| --- | --- |
| `game.js` | ~3630 |
| `render3d.js` | ~1900 |
| `script.js` | ~575 |
| `sound.js` | ~200 |
| `tests.html` | ~2810 |

## How to run

- **Game:** open `index.html`. It needs internet the first time (Three.js r128 from cdnjs).
  - Esc opens the menu with the controls, volume and mute.
  - New key: **V** calls a patrol during a rogue-pack attack.
- **Tests:** open `tests.html`, or use the headless Edge command in `CLAUDE.md`.
  - A full run takes about 15–20 minutes, longer than before because the rogue waits are now 2 and 4
    minutes of game time.
  - Run it in the background with a long timeout (1 800 000–2 400 000 ms).
  - Three runs can go side by side with separate `--user-data-dir` folders.

## Decisions made in Round 7, and why

These are the owner's answers, logged in `decision.md`, Session 8 and "After Round 7".

| Decision | Why |
| --- | --- |
| Renumber last round's settled items R69a–R69c | Owner's choice, so Round 7 keeps R70–R77. |
| Nametags: mentor, apprentice, leaders, medicine cats; no deputy cats | Owner picked these. |
| Curl up only when sleeping in your den | Owner's choice. |
| Branches: lie on one; it counts as up the tree (safe, lookout) | Owner picked these two. |
| River winds, the stream stays straight, borders don't change | Owner's choice. |
| Calling for help brings a clan patrol, at any rank | Owner's choice. |
| Two rainy seasons (newleaf and leaf-fall) | Owner's choice. |
| Packs are tougher and come half as often | Owner picked these two. |
| After the round: wait longer for rogues; fix facing the apprentice in battle practice | Owner asked. The new times (2 and 4 minutes) are my pick. |

These are technical decisions with records in `docs/decisions/`:

- **0013:** the river winds by a sine shift worked out from z. Every part of the game must agree
  exactly on where the water is (including the grass shader), and a path of hand-placed points would
  be slow and a lot of code.
- **0014:** the patrol you call is the camp's own warriors, so there are no new cat models and the
  names are ones the player already knows.

The owner did not ask for the following. They were listed at the end of the session, and these are
the ones most likely to be revisited:

- Nametags show within 25 units.
- Sleep lasts 3 s.
- The marker patch is 1.3 units across.
- Branch heights: low 1.4–1.9, high about 3.3–5.3. Pines get branches too.
- The river bends 5 units either way, once every 80 units.
- The patrol: up to 3 helpers, 8 damage every 1.2 s, home after 60 s, 60 s between calls.
- Rain and storms last half as long, and the weather mix per season is mine.
- Pack health: 130 for the leader, 80 for the others.
- Rogue waits: 2 and 4 minutes.

## Unresolved (ask the owner)

1. **`problem.md` lists R78 and R79 twice** (after Round 7 and under Round 8). Which copy is meant?
2. **R82 "make the tree branches only up higher" (Round 8)** goes against R73's rule that every tree
   has a branch low enough for every clan (only ThunderClan climbs above 2 units). Ask whether the
   other clans should still have a branch they can reach.
3. **R83 (Round 8)**: "as a warrior your fight should be against one rogue, then as you level up so do
   the rogues". This changes R62 and R77 (packs straight after the apprenticeship). Ask what a deputy
   and a leader should face.
4. `CLAUDE.md` calls the spec `SPEC.md`, but the file is `spec.md`. This has been open since Round 1.
5. Is GitHub Pages turned on?
6. Speed on real hardware with the branches, the textures and about 50 cats.
7. Older open items: the R17 "block" move, and the out-of-date line in `handoff-round-1.md`.

## Warnings for the next session

- **The river bends.** Never compare against `RIVER_X0`/`RIVER_X1` directly. Use `watersAt(z)` in
  code and `riverAt(z)` in tests.
  - River checks are placed level with a camp (z = ±60), where the river is at the top of a bend and
    runs straight along z.
  - Stay away from z = ±20 (stepping stones).
- **The first pack now comes 2 minutes after the apprentice's rogue.** A check that waits for it steps
  121 s of game time, and a pack that has been roaming a while will find the cat and start fighting.
  - This round, a check that waited too long (41 s back then) failed. The wrong state it left behind
    then broke about 15 later deputy and leader checks (R39, R45, R9, R18, R37).
  - The same cascade appeared in Round 6 with the river-current mutation. If those checks all fail
    together, look at the R9 rogue checks first.
- **Kits are placed in the busy middle of camp.** Solid camp cats (R58) can push the kit aside.
  `kitSpot()` and the R17 kit check move nearby cats out of the way first. Do the same in any new
  check that places a cat in camp.
- **`helpers` and `callCooldown` are declared with the other state near the top of `game.js`.**
  `resetGame()` assigns them, and a `let` further down the file would throw when `resetGame()` runs.
- **E order while climbing:** a perched sparrow at your height comes first, then a branch.
- **`place()` in `tests.html` also clears `onBranch` and `sleeping`.** If a check moves the player
  another way, clear them itself.
- The suite is slow and random. Run it at least twice, and look for one thrown error first when many
  checks fail at once (`CLAUDE.md`).
- Git prints LF→CRLF warnings on every commit. They are harmless.
