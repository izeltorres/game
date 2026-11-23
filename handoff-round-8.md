# Handoff: end of Round 8 (2026-11-22)

For the session that will build the next round. Standing rules for every session are in
`CLAUDE.md`; this file covers only where things stand after Round 8. Earlier handoffs explain the
world (`handoff-round-2.md`), huts, rocks and grass (`handoff-round-3.md`), the kit → leader path
(`handoff-round-4.md`), Gatherings, missions, rivalry and medicine cats (`handoff-round-5.md`),
solid cats, sound, seasons, rogue packs and the pile (`handoff-round-6.md`), and nametags, branches,
the winding river and calling a patrol (`handoff-round-7.md`). That is all still true except where
Round 8 changed it, as described below.

## Current state

- **Round 8 is built:** R78–R84 from `problem.md`.
  - **Checks:** `tests.html` has **483 checks**, 32 of them new or rewritten for Round 8:

    | R78 | R79 | R80 | R81 | R82 | R83 | R84 |
    | --- | --- | --- | --- | --- | --- | --- |
    | 8 | 3 | 2 | 3 | 2 | 4 | 10 |

  - **The suite passed 3 times in a row** on the final code.
  - **Deliberate bugs, each caught:**
    - Borders that never move failed 6 R78 checks.
    - Letting rogues fight in camps failed both R79 checks.
  - The two flaky checks left from Round 7 (R39 "follows you", R42 "kit can't walk out of camp") are
    fixed.
- **Pushed:** `master` = `origin/master` at `fa0ac60`.
- **Not committed:** `reflection.md` (the owner's file, committed in `032e88e`) is **deleted in the
  working copy**. I didn't commit the deletion: ask the owner whether it was meant.
- **`problem.md` has no Round 9 section yet.** Ask the owner for the next round's requirements.
- **No one has played the game by hand since Round 4.** It is now the most important missing check,
  especially:
  - saving and loading in a normal browser;
  - how the fading looks;
  - borders moving during real play;
  - how smooth it is with everything Rounds 6–8 added.

### What Round 8 added

The rules are in `game.js`, and the page side is in `script.js` and `render3d.js` as noted.

- **Moving borders (R78):**
  - `borders` holds `{ x: {-1, 1}, z: {-1, 1} }`. `x[half]` is the north–south border in the south
    (−1) or north (1) half; `z[side]` is the east–west border in the west (−1) or east (1) half.
    All start at 0.
  - `territoryAt()` reads them. `biomeAt()` still uses the original quarters, so the land keeps its
    look whoever owns it.
  - `clanAtSide(sx, sz)` and `neighbours(clan)` are helpers.
  - `changeLand(clan, amount)` keeps `landScore[clan]`, and at ±`LAND_WIN` (5) moves the shared
    border by `LAND_STEP` (10), up to `LAND_MAX` (30). It only works with your two neighbours.
  - What counts: `defeatEnemy()` gives +1 per cat (not raiders); the last raider driven off before
    any stole gives +3. `hurtPlayer()` gives −1 when a neighbour's cat beats you. A raid that steals
    gives −3 (`updateRaider`).
  - `keepInTerritory()` clamps to the moved borders.
  - The map (`drawMap` in `script.js`) paints territories in 4-pixel squares using `territoryAt()`.
- **Rogues and camps (R79):**
  - `inAnyCamp(p)` is true within `CAMP_SAFE` (15) of any camp.
  - Roaming rogues (`smart`) don't start a fight when you are in a camp. If you run into one during a
    fight, `updateRogue()` switches them back to roaming.
  - `rogueRoamTarget()` steers them out of camp and never picks a spot inside it.
  - A rogue raid steals one piece and no longer hurts a camp cat.
  - **The apprentice's rogue (not `smart`) is left alone**, because the R17 combat checks use it as a
    sparring dummy inside camp.
- **Medicine cats in dens (R80):**
  - `buildMedicineCats()` puts each medicine cat 1.2 units in from the back of its den.
  - `denBed(clan)` is the middle of the den.
  - A hurt camp cat lies still until `TREAT_AFTER` (30 s), then walks to the bed.
  - `updateMedicineCats()` treats any patient within 1.8 units; the medicine cats no longer walk
    anywhere.
  - Beaten rival cats rest on their den's bed (R69b).
- **Clear view (R81, decision 0016):**
  - `updateFading(cam)` in `render3d.js` runs every frame. It uses `nearSightLine()` seen from above
    for trunks, tree tops (only if the sight line is at their height), other cats and hut circles.
  - `setFaded()` swaps a mesh to its own see-through copy of its material (`userData.fadeMat`, made
    once) and back.
  - `view.treeParts` (same order as `trees`) and `view.hutModels` (`userData.hut`) were added for it.
  - Also new: `disposeScene()` frees the old scene's graphics memory every time `buildScene()`
    rebuilds.
- **Branches (R82):** `branchesFor()` gives a low branch at 3–3.8 and a high one at 4.5–5.5 (at
  most `h − 2`). Only ThunderClan (climb height 6) reaches them.
- **Rogues by rank (R83):**
  - `spawnRoguePack()` sets `rogue.pack` only for a deputy or leader.
  - Otherwise there is one smart roaming rogue with `ROGUE_SOLO_HP` (100) and 18 damage, and no
    mates.
  - `packAttacking()` (for V, R75) now needs `rogue.pack`.
- **Saving (R84, decision 0015):**
  - `game.js` has `saveData()` (plain JSON of the progress) and `loadData(d)`. `loadData` calls
    `resetGame()`, then rebuilds a deputy or leader through `promote()`, then restores stats and the
    rest.
  - `requestSave()` calls `hooks.saveNow` after ranking up, choosing a path or mentor, and waking up.
    `loadingSave` stops a load from saving halfway.
  - `script.js` keeps `SAVE_SLOTS` (3) in `localStorage` under `SAVE_KEY`. That is
    `"catclans-saves"` in the game and `"catclans-test-saves"` on the test page (detected by
    `#summary`).
  - Saving works through `saveNow()` (and `savedAt`, a number one higher than any other save), with
    `autosave()` every 30 s from `hooks.afterUpdate`.
  - The page parts: `renderSaves()` (`#saves` rows with Continue and Delete), `continueSlot(i)`,
    `startGame()` (first empty slot, or `showReplaceChoice()` in `#replace-slot`), and
    `beginNewCat(slot)`.
  - Saves also happen on `beforeunload`, `showMenu()` and restart.
  - The Esc menu has a Save button (`data-action="save"`, hidden at game over).

### Code size

| File | Lines |
| --- | --- |
| `game.js` | ~3780 |
| `render3d.js` | ~2000 |
| `script.js` | ~690 |
| `sound.js` | ~200 |
| `tests.html` | ~3070 |

## How to run

- **Game:** open `index.html`. It needs internet the first time (Three.js r128 from cdnjs).
  - Saved cats are listed under Start (Continue or Delete).
  - Esc → Save saves now; the game also saves every 30 s.
  - Saves are per browser. Clearing site data deletes them.
- **Tests:** open `tests.html`, or use the headless Edge command in `CLAUDE.md`.
  - A full run takes about 15–20 minutes.
  - Run it in the background with a long timeout. Three runs can go side by side with separate
    `--user-data-dir` folders.

## Decisions made in Round 8, and why

These are the owner's answers, logged in `decision.md`, Session 9.

| Decision | Why |
| --- | --- |
| Borders are won and lost through fights and raids | Owner's choice. |
| Rogues may raid a camp but can't fight there ("the sheer amount of clan cats") | Owner's answer. |
| Medicine cats stay in their huts; hurt cats go in | Owner's answer. |
| Things in the way fade | Owner's choice. |
| Only ThunderClan uses branches (they start high) | Owner's choice. |
| Warriors meet one rogue; deputies and leaders meet packs | Owner's choice. |
| Autosave, Continue, a Save button and 3 slots | Owner picked all four. |

These are technical decisions with records in `docs/decisions/`:

- **0015:** saves keep only the progress, as plain data in `localStorage`. The whole game state would
  be large and full of object references, and a file or a server doesn't fit autosave or a free
  project.
- **0016:** what fades is found from the sight line seen from above, and only those meshes get a
  see-through copy of their material. Shared materials would fade every tree, and raycasting
  hundreds of meshes each frame is slow.

The owner did not ask for the following. They were listed at the end of the session, and these are
the ones most likely to be revisited:

- **Land scores:** +1, +3, −1 and −3; a border moves 10 units at ±5, at most 30.
- **Camp size for R79:** 15 units.
- **Fading:** 30% opacity, and a cat counts as in the way within 0.6 units of the sight line.
- **Branch heights:** 3–3.8 and 4.5–5.5.
- **The single rogue:** 100 health and 18 damage.
- **What is saved:** cats, prey and weather start fresh on load.
- **When it saves:** also on choosing a mentor, going to the menu and restarting.
- **Replacing a save:** the choice is made in the page, not in a browser dialog.

## Unresolved (ask the owner)

1. **`reflection.md` is deleted in the working copy.** Was that meant? (It is still in the history.)
2. Saves made now may not load cleanly if later rounds add new kinds of progress. Decide whether old
   saves should be upgraded or simply refused (there is a `version: 1` field to use for this).
3. Should beating the clan across the corner ever count for land? (Now it never does.)
4. `CLAUDE.md` calls the spec `SPEC.md`, but the file is `spec.md`. This has been open since Round 1.
5. Is GitHub Pages turned on?
6. Speed on real hardware: Rounds 6–8 added textures, about 520 branches, nametags, fading and about
   50 cats.
7. Older open items: the R17 "block" move, and the out-of-date line in `handoff-round-1.md`.

## Warnings for the next session

- **A syntax error in `tests.html` gives no results at all.**
  - The page just stays at "Running tests...", and this round that looked like an Edge crash. The
    cause was a helper (`medDen`) declared twice in the test script.
  - Before running the suite, check for duplicate names (the command is in `CLAUDE.md`).
  - If the summary never changes, capture the console with `--enable-logging=stderr --v=0` and grep
    for `Uncaught`.
- **Don't assume the four quarters.**
  - Who owns a place: `territoryAt()`.
  - What the land looks like: `biomeAt()`.
  - Where a clan's border is: `borders`.
  - Checks that need a known border must start from a fresh game (`resetGame()` resets `borders`).
- **New kinds of progress must be added to `saveData()` and `loadData()`.** Otherwise they are lost on
  load. Keep the save as plain data; no object references.
- **The test page has its own save key and starts a cat in slot 0** (its first Start click). The R84
  checks clear `SAVE_KEY` and set `currentSlot = null` first. Any new save checks must do the same, so
  they never touch the player's own saves.
- **Rogue state affects long check chains.**
  - The R39–R45 deputy section now starts with `rogue.state = "gone"`, a big `rogue.respawn` and no
    mates.
  - If many deputy and leader checks (R39, R45, R9, R18, R37) fail together, look first at what
    happened to the rogue and to the apprentice early in that section.
- **The R79 camp rule only applies to `smart` rogues.** If the apprentice's rogue ever becomes smart,
  the R17 combat checks (which spar inside camp) will break.
- **Fading swaps materials.** Code that changes a cat's or tree's material colour every frame must
  change `userData.baseMat` (and drop `userData.fadeMat`), or the change won't show while it is faded.
- The suite is slow and random. Run it at least twice, and look for one thrown error first when many
  checks fail at once (`CLAUDE.md`).
- Git prints LF→CRLF warnings on every commit. They are harmless.
