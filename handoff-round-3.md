# Handoff: end of Round 3 (2026-11-21)

For the session that will build the next round. Standing rules for every session are in
`CLAUDE.md`; this file covers only where things stand after Round 3. `handoff-round-2.md` explains
the world layout and the order E chooses an action in; that is all still true except where it is
changed below.

## Current state

- Round 3 (R21–R29 in `problem.md`) is built. **All 235 checks in `tests.html` pass.**
  - 171 come from R1–R20; a few were adjusted where Round 3 changed things (listed below).
  - 64 are new. Checks per ID: R21 13, R22 2, R23 4, R24 7, R25 7, R26 8, R27 7, R28 12, R29 6.
    Two of these (the 7-pattern count and the final "New cat" check) replace earlier R1 checks.
- The full suite passed **3 times in a row** (several cats move randomly).
- To check that the tests can fail, three deliberate bugs were tried; the matching tests failed for each:
  - Hut walls switched off: 2 R25 checks failed (and the R9 Follow check).
  - The fighting tail no longer puffed: 3 R28 checks failed.
  - Esc no longer opening the menu: 2 R26 checks failed.
- Everything is committed and pushed: `master` = `origin/master` at `e582552`.
- `problem.md` has empty `## Round 4`, `## Round 5` and `## Round 6` headings. The next round's
  requirements go there. If they are still empty, ask the owner. Don't invent requirements.
- Screenshots were checked (title screen, all patterns, inside a hut, camp with carried prey,
  grass), but **no one has played the game by hand yet**.

### What changed in Round 3

| Requirement | What was built |
| --- | --- |
| R21 | The game is called **Cat Clans** (`GAME_NAME` in `game.js`), with a title screen over the 3D forest, which circles the camp. A new cat model: short legs with paws, a fuller body, a muzzle. 7 patterns: Solid, Tabby, Patches, Tuxedo, Calico, Spotted, Colorpoint. |
| R22 | The name/rank/clan line (`#cat-info`) is removed from the HUD. |
| R23 | Trees, camp stones, Highrocks and hut walls are solid for every cat. |
| R24 | 9000 segmented grass blades in clumps. A shader handles the wind, the wrap-around and the colour. |
| R25 | 5 walk-in huts per camp, with doorways facing the middle of the camp. The camera stays inside a hut while you are in it. E anywhere inside your own den rests. |
| R26 | Esc opens a paused main menu: Resume, Restart (same cat, back to kit), New cat. The "New cat" button is gone. While fishing, Esc stops fishing. |
| R27 | G drops carried prey (it falls, and E picks it up again; at the pile it goes onto the pile). The prey shows in the mouth, the head lifts while carrying and dips when dropping. |
| R28 | An 8-segment tail posed by `tailPoseFor()` for each mood, shared by every cat. |
| R29 | 4 cats live in each other clan's camp and defend it. |

### Code layout

| File | Lines | What changed in Round 3 |
| --- | --- | --- |
| `game.js` | ~1780 | New state: `huts`, `rocks`, `dropped`, `ui.menu`. New functions: `buildHuts`, `buildRocks`, `insideHut`, `pushOutOfObstacles`, `viaDoorway`, a steering `moveToward`, `campYardSpot`, `dropPrey`, `updateDropped`, `restartGame`. `patrols` now holds both patrol cats (`mode: "patrol"`) and rival camp cats (`mode: "camp"`). |
| `render3d.js` | ~1060 | New cat model with `patternPieces`, `tailPivots`/`tailSegments`, `carryModels`, `paws`. Also `tailPoseFor`, `poseTail`, `makeHut`, `makeGrass` (shader), `grassAllowedAt`, `titleCamera`. Rocks and huts are drawn from the game state. The scene rebuilds itself when the clan or the cat's look changes. |
| `script.js` | ~410 | Main menu buttons and `restartFromMenu()`; sets the title from `GAME_NAME`. |
| `tests.html` | ~1590 | The Round 3 block is near the end, before the final "New cat" check. |

**Camp layout** (local `(u, v)` spots, see `spotFor`):

| Thing | Spot |
| --- | --- |
| Huts (radius 3) | nursery (−7, 5.5), apprentices (7, 5.5), warriors (8.5, −3), medicine (−8.5, −3), leader (0, −9) |
| Highrock (radius 2.5) | (0, −15) |
| Stone ring | radius 14, with gaps behind the huts and the Highrock |
| Fresh-kill pile | (3, 0) |
| Where camp cats wander | within 4.5 of the middle |
| No trees within | 20 of a camp |
| No grass within | 12.5 of a camp |

## How to run

- **Game:** open `index.html`. It needs internet the first time (Three.js r128 from cdnjs).
- **Tests:** open `tests.html`, or use the headless Edge command in `CLAUDE.md`. One run takes about
  1–2 minutes.

## Decisions made in Round 3, and why

These are the owner's answers. They are logged in `decision.md`, Session 4.

| Decision | Why |
| --- | --- |
| Name: Cat Clans; a title-screen look; a better preview cat (R21) | Owner said the start screen looked plain and the preview cat looked wrong. |
| Add Tuxedo, Calico, Spotted, Colorpoint (R21) | Owner picked all four. |
| The owner renumbered the duplicate R25 themselves | The round is R21–R29. |
| No menu button; Esc opens the menu (R26) | Owner's reading of "hidden". |
| Walk into huts, with the camera following (R25) | Owner's choice. |
| Rival camp cats defend their camp (R29) | Owner's choice. |
| Remove only the name line (R22) | Owner's choice. |
| Drop prey anywhere with G (R27) | Owner's choice. |

These are technical decisions with records in `docs/decisions/`:

- **0005:** grass placement and wind run in a shader (`onBeforeCompile`), so 9000 detailed blades
  don't slow the game. Not chosen: updating every blade on the CPU, or flat grass textures.
- **0006:** computer cats steer around obstacles step by step, with every doorway closed to them
  except the hut they are entering or leaving. Not chosen: A* grid path planning, or ignoring obstacles.

The owner did not ask for the following; they are listed at the end of the Round 3 session and are
in `spec.md`. These are the ones most likely to be revisited:

- **Camp:** the bigger layout, with the leader's den as a hut in front of the Highrock and bare earth
  in camps.
- **Patterns:** Calico always uses ginger and black patches whatever fur colour is chosen.
  Colorpoint lightens the body 70% toward cream.
- **Numbers:** all the tail angles and speeds, and the drop animation timing (0.4 s), are invented.
- **Rival camp cats:** they use the patrol numbers (sight 14, health 40, recover in 30 s).
- **Collision:** only trees, camp stones, Highrocks and hut walls are solid. Gorse, reeds and marsh
  pools are not.

## Unresolved (ask the owner)

1. `CLAUDE.md` calls the spec `SPEC.md`, but the file is `spec.md`. This has been open since Round 1.
2. Is GitHub Pages turned on?
3. Should progress be saved in the browser? There is still no saving.
4. Should the inside of the huts be lighter? It is quite dark in there.
5. R17's "block" move is still not added. Is it wanted?
6. Should beetles count as prey toward becoming leader? They don't now.
7. `handoff-round-1.md` has an out-of-date line saying its commits weren't pushed. It was left as
   written because handoffs are the owner's to edit.

## Warnings for the next session

- **The rule that computer cats move only with `moveToward()` is now in `CLAUDE.md`.** The rogue's
  flight and knockbacks are the only direct moves today; they call `pushOutOfObstacles` afterwards.
- `pushOutOfObstacles(body, radius, doorsOpenFor)`:
  - With no third argument (the player, prey), all doorways are open.
  - With `null`, all doorways are closed.
  - With a hut, only that hut's doorway is open.

  This difference is what stopped cats getting stuck in doorways (decision 0006). Keep it if you
  change huts.
- **Grass rules live in two places:** the shader in `makeGrass()` and `grassAllowedAt()`. Change both
  together. The shader also gets the water, camps and territory colours as uniforms.
- The shader replaces three r128 shader chunks (`color_vertex`, `begin_vertex`, `project_vertex`).
  Upgrading Three.js would need checking them.
- **The main menu pauses `update()` completely** (only Esc is read). Choosing a mentor or a role also
  pauses it. Tests that press keys while one of these is open will see nothing happen.
- **Rival camp cats are in `patrols`.** Code or tests that mean patrols only must filter by
  `p.mode === "patrol"`.
- The test spots near camps were moved: hunting checks use `placeAt(0, -30)`, outside the stone
  ring. Spots within about 14 of a camp centre can be inside a hut or next to a rock.
- **Performance is still unmeasured on real hardware.** The grass is now cheap on the CPU, but every
  hut, rock and tree is a separate mesh, and there are now about 30 cat models. If it's slow, the
  next things to try are merging static meshes or lowering the tree count.
- Debugging tip that worked this round: a temporary HTML page that loads only `game.js` (no
  Three.js) can run a scenario 60 times in a few seconds and show how often it fails. That is how
  the doorway trap was found (13 of 60 runs before the fix, 0 of 60 after).
- Git prints LF→CRLF warnings on every commit. They are harmless.
