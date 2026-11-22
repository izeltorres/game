# Handoff: end of Round 5 (2026-11-22)

For the session that will build the next round. Standing rules for every session are in
`CLAUDE.md`; this file covers only where things stand after Round 5. Earlier handoffs explain the
world (`handoff-round-2.md`), huts, rocks and grass (`handoff-round-3.md`), and the kit → leader
path (`handoff-round-4.md`). That is all still true except where Round 5 changed it, as described below.

## Current state

- Round 5 (R47–R57 in `problem.md`) is built. **All 367 checks in `tests.html` pass.**
  - 57 are new: R47 10, R48 5, R49 8, R50 5, R51 2, R52 5, R53 5, R54 6, R55 2, R56 2, R57 7.
- The full suite passed **3 times in a row** on the final code.
- To check that the tests can fail, two deliberate bugs were tried; each was caught by the matching check:
  - No truce at the Great Oak (R48).
  - Friendly clans attacking instead of warning (R54).
- Everything is committed and pushed: `master` = `origin/master` at `ea92956`.
- `problem.md` has an empty `## Round 6` heading. The next round's requirements go there. If it is
  still empty, ask the owner. Don't invent requirements.
- Screenshots were checked (a Gathering with the speech panel, the full-window layout, a big hunt),
  but **no one has played the game by hand yet**. That is still the most useful next check, because
  rounds 4 and 5 added a lot of play.
- **Process note:** during this round the owner asked for a commit and push while the test suite was
  still running. That push (`59154d8`) went up with 21 failing checks, which were fixed in
  `2f89063`. The current `master` is clean.

### What Round 5 added (all in `game.js` unless noted)

- **Prey sizes (R47):** `PREY_KINDS` gained vole, sparrow, rabbit and hare (each with a `size`), plus
  `PREY_FOOD`. `KIT_PREY` lists the only kinds that come into camp for kits.
- **Big hunt (R47):** order `Digit4` → `"bighunt"` calls `startBigHunt()`. `hareSurrounded()` stops
  the hare from fleeing. Catching it adds `BIG_HUNT_PIECES` to the pile.
- **Choices (R48, R50):** a single `pendingChoice` (`{ kind, title, text, options[{ label, apply }] }`),
  run by `chooseOption(i)`. `update()` pauses while it is set (decision record 0009). The page draws
  it in `#choice`.
- **Gatherings (R48):** `updateLeaderEvents()` handles `gatheringTimer`, the `gathering` object and
  `startGathering()` (with `gatheringLeaders`). `truceWith(clan)` covers the Great Oak clearing
  (`TRUCE_RADIUS` = 12), messenger passes, and the 20 s grace after a delivered message.
- **Decisions (R50):** `DECISIONS` holds the events. `triggerDecision(id)` starts one, which is
  handy for tests.
- **Missions (R49):** `mission`, `startMission()`, `updateMissions()` and `completeMission()` handle
  the message, stolen-prey and lost-kit missions, in that order. A lost kit has `lost` / `following`
  flags in `kits`. `LEADER_NEEDS.missions` = 1.
- **Rivalries (R54):** `rivalry[clan]`, `changeRivalry()`, and `updateRivalry()` (trespassing and raid
  timing). `raiders` are separate from `patrols`, and patrol sight and warnings depend on rivalry.
- **Medicine cats (R52, R57):** `medicineCats` (one per camp; yours is Thymeleaf) and
  `updateMedicineCats()`. For the medicine path: `medRank`, `MED_RANKS`, `MED_NEEDS`, `herbStore`,
  `medQuest`, `depositHerbs()` and `checkMedRank()`. `isMedicine()` checks for any medicine rank.
- **Clicking herbs (R53):** `aimedHerb()` (a cone around the camera's view) and `clickToPick()`.
  The page has `#aim`.
- **Full window (R55):** `#wrap` is fixed to the whole window in `style.css`. `fitView(w, h)` in
  `render3d.js` resizes the view, and `resizeGame()` in `script.js` calls it. The controls list is in
  `#controls-help` inside the Esc menu (the old `#controls` paragraph is gone).
- **`resetStats()`** now resets hunts, fights, patrols, trained, missions, quests and treated.

### Code size

| File | Lines |
| --- | --- |
| `game.js` | ~2940 |
| `render3d.js` | ~1420 |
| `script.js` | ~540 |
| `tests.html` | ~2180 |

## How to run

- **Game:** open `index.html`. It fills the browser window. It needs internet the first time
  (Three.js r128 from cdnjs).
- **Tests:** open `tests.html`, or use the headless Edge command in `CLAUDE.md`. **One full run now
  takes about 10 minutes.** Run it in the background (the Bash tool's foreground limit is 10 minutes)
  and wait for the notification.

## Decisions made in Round 5, and why

These are the owner's answers. They are logged in `decision.md`, Session 6.

| Decision | Why |
| --- | --- |
| Prey sizes = new kinds (vole, sparrow, rabbit, hare) (R47) | Owner's choice. |
| Big hunt done together with the clanmates (R47) | Owner's choice. |
| Full-moon Gatherings at a meeting place with a truce and a speech (R48) | Owner's choice. |
| Leader decisions are events with choices (R50) | Owner's choice. |
| Missions: message, stolen prey, lost kit (R49) | Owner picked these three. |
| Rivalry meter per clan, with raids when high (R54) | Owner's choice. |
| A medicine cat in every camp (R52) | Owner's choice. |
| Click the herb you aim at (R53) | Owner's choice. |
| Game fills the window (R55) | Owner's choice. |
| Slower, less wary camp prey for kits (R56) | Owner picked only this option. |
| Medicine path: quests, herb store, treating clanmates, ranks (R57) | Owner picked all four. |

These are technical decisions with records in `docs/decisions/`:

- **0009:** one paused choice panel for Gathering speeches and leader decisions.
- **0010:** a cat that is really stuck (judged by its own movement every half second) walks along the
  obstacle for 1.2 s. The hut wall now uses the same "inside" line as `insideHut()`. This extends 0006.

The owner did not ask for the following; they are listed at the end of the Round 5 session.
These are the ones most likely to be revisited:

- **Timings:**
  - Gathering every 15 minutes, open for 5.
  - A decision every 5 minutes.
  - A raid every 4 minutes.
  - 30 s between missions.
  - Thymeleaf heals you once a minute and treats a hurt cat after 30 s.
- **Rivalry:** starts at 30; friendly below 20; hostile from 70. Hostile cats see you from 20 units.
- **Effects:** what each speech and decision choice does, and the medicine rank needs.
- **Names:** the leaders, medicine cats and stray kits are invented.
- **Truce:** 12 units. 25 units, as first written, switched off patrols near the borders.

## Unresolved (ask the owner)

1. `CLAUDE.md` calls the spec `SPEC.md`, but the file is `spec.md`. This has been open since Round 1.
2. Is GitHub Pages turned on?
3. **Saving progress** is now quite important: reaching leader takes a long time, and there is no saving.
4. Speed on real hardware: is it smooth on the owner's computer? (See warnings.)
5. Older open items: the R17 "block" move, and the out-of-date line in `handoff-round-1.md`.

## Settled by the owner after Round 5 (not built yet)

The owner answered these after the round ended (logged in `decision.md`, "After Round 5"). They are
not in the code or tests yet, so build them when the next round says, or ask the owner whether to
build them as part of Round 6.

- **Leaders should be visible.** At the moment the clan leaders only appear at Gatherings, and your
  own clan has no leader until you become one.
- **Rival medicine cats should take care of their own clan.** For example, they could treat their own
  camp cats and patrol cats, like Thymeleaf does for yours.
- **Hut lighting is fine as it is.** No change.
- **Beetles do count as prey, but only a small amount.** They count for nothing now.
  - The exact amount is not decided. One option: 4 beetles = 1 prey toward promotions.
  - Ask the owner, or propose a number in the spec and point it out.

## Warnings for the next session

- **The suite is slow (about 10 minutes) and has a lot of randomness.** Run it in the background and
  at least twice (`CLAUDE.md`). If one check fails once, replay that scenario 20–60 times in a page
  that loads only `game.js`; that is how every flaky check in rounds 3–5 was explained.
- **An error inside `update()` stops everything after it in that frame,** including clearing
  `pressed`, and it shows up as many unrelated failures. If lots of checks suddenly fail, look for one
  thrown error first. This round, `updateMissions()` read `mission.type` after `mission` had been set
  to null.
- **`pendingChoice` pauses the game,** like the mentor and role choices. Leaders get a decision every
  5 minutes of game time and a Gathering every 15. A long test as leader could stop on one; set
  `decisionTimer` / `gatheringTimer` high if needed.
- **Test spots near the middle of the world** are inside the Great Oak truce (12 units). The R16
  patrol checks stand about 20 units from the middle, which is why the truce had to shrink.
- **Movement:** `moveToward()` now has a third mechanism (`stuckFrom` / `detour`) on top of the
  doorway rules. Judge "stuck" by the cat's own movement, not by distance to a moving target (that made
  chasing kits drift). See decision record 0010.
- **A cat that becomes leader has no apprentice in training.** `promote("Leader")` finishes a
  leftover trainee, because test helpers can skip the training lessons.
- **The test page overrides the full-window layout** (`#wrap` stays 960×540 in `tests.html`'s own
  style), so the R8 bar-position check still works. `resizeGame()` doesn't run on the test page.
- **Speed:** there are now about 50 cat models (camp cats, kits, patrols and camp cats of 3 clans,
  medicine cats, raiders, leaders), each animated every frame, and the game fills the whole window. If
  it is slow on real hardware, try a lower `setPixelRatio` first, then hide cats far from the player.
- Git prints LF→CRLF warnings on every commit. They are harmless.
