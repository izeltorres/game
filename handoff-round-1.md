# Handoff: end of Round 1 (2026-11-21)

For the session that will build the next round. Standing rules for every session are in
`CLAUDE.md`; this file covers only where things stand after Round 1.

## Current state

- Round 1 (R6–R11 in `problem.md`) is built, and all **89 checks in `tests.html` pass**: 30 earlier
  checks (R1–R5), ported to 3D, plus 59 new ones.
- The game is now **3D** (Three.js r128 from cdnjs). Before Round 1 it was a 2D side-scroller.
- `spec.md` has a "Round 1" section that describes exactly what was built. Read it before changing
  behaviour.
- **Commits are local only.** `master` is 7 commits ahead of `origin/master`; nothing was pushed.
- The owner's `problem.md` edits (requirement IDs R1–R11, SkyClan removed) are committed.
- GitHub Pages has still not been turned on (see the old `handoff.md`).
- No one has played the game by hand yet. It was checked only by the automatic tests and three
  headless screenshots (forest in the morning, ShadowClan marsh at sunset, RiverClan fishing at night).

### Code layout

| File | Role |
| --- | --- |
| `game.js` | All game rules and state as plain globals: tasks, clans, food and health, roles, day cycle, camera position. No DOM or Three.js code. |
| `render3d.js` | Builds the Three.js scene (`buildScene`) and draws a frame (`renderFrame`). Only reads the state. Also the menu preview cat. |
| `script.js` | Keyboard, menu, HUD, role-choice buttons and the main loop. It sets `hooks.message` and `hooks.afterUpdate` so `game.js` can talk to the page. |
| `tests.html` | Copies the page markup and loads the three scripts, then runs the checks in order. |

World coordinates: x and z are the ground and y is up. Forward is `(sin(heading), cos(heading))`.
The camp is at (0, 0) and the river is the strip from x = 30 to x = 36.

Progression: `stage` 0 → 1 → 2 → 3, where 3 is a full clan cat. At stage 3 the rank is `role`
(`null` while `choosingRole` is true, then Warrior, Deputy or Medicine cat, and later possibly Leader).

## How to run

- **Game:** open `index.html` in a browser. It needs internet the first time to load Three.js.
- **Tests:** open `tests.html` in a browser. The heading says `ALL 89 TESTS PASSED`, or how many
  failed, with a PASS/FAIL list underneath.
- **Tests from the command line:** there is no Node.js on this machine. Use headless Edge; the exact
  command is in `CLAUDE.md` under Testing.

## Decisions made in Round 1, and why

The owner answered these at the start of the round. They are logged in `decision.md`, Session 2.

| Decision | Why |
| --- | --- |
| Rebuild in 3D with Three.js (R11) | A camera "from behind the cat" can't work in a side view. |
| Choose the role after the apprentice task; warriors and deputies can become Leader (R9) | Owner's choice. Medicine cats can't become leader. |
| One full day lasts 1 real hour (R10) | Owner's reading of "1 hour is day". |
| All clans climb a little; ThunderClan climbs best (R6) | Owner's choice. |

These are technical decisions with records in `docs/decisions/`:

- **0001:** Three.js r128 loaded as a classic `<script>` from cdnjs, so `index.html` still opens
  from `file://`. ES modules don't load from `file://`.
- **0002:** rules (`game.js`), drawing (`render3d.js`) and page code (`script.js`) are kept apart
  so the tests can drive the rules directly.

The owner did not ask for any of the following. All of them are in `spec.md` or `README.md`, and the
owner may still change them:

- Deputy needs 3 prey and 2 fights to become leader; warrior needs 5 and 3. Only prey and fights
  after choosing a role count.
- Fainting wakes the cat at camp with full health and at least 50 food, and it keeps its progress.
  (Before the questions, the owner was told "half health". It was changed to full health to keep the
  earlier "losing resets the fight" test.)
- Running uses food 2× faster per distance. Food per unit walked is 0.2. Starving costs 2 health per second.
- Medicine cats gather herbs with E (+25 health; herbs regrow after 30 s).
- A leader's 3 clanmates: Follow (they help in fights), Hunt (+10 food each every 20 s), Guard (they
  go to camp).
- A new rogue comes 20 s after the last one is chased off, cycling through 4 fixed spots.
- S walks backwards now, so stalking is Shift only.
- Leaders' names end in "-star".

## Unresolved (ask the owner)

1. "Forest Clans" is still a placeholder title.
2. `CLAUDE.md` calls the spec `SPEC.md`, but the file is `spec.md`. The filename was left as it is.
3. Should the commits be pushed and GitHub Pages turned on?
4. Should progress be saved in the browser? There is no saving: reloading the page starts over.

## Settled after the round

- The old `handoff.md` (written before Round 1, describing the 2D game) **stays as a record**.
  Don't delete it or rewrite it into a current handoff; new handoffs are `handoff-round-N.md`.
- SkyClan: the owner removed it from `problem.md` in the Round 1 edits. That answers the old
  `handoff.md` question: no SkyClan.

## Warnings for the next session

- **Tests share state and run in order.** Each check builds on the ones before it (one game is
  played through from the menu). When adding checks, set up the state each one needs yourself:
  `place()`, `freshAtRoleChoice()`, `resetGame()`, `trees.length = 0`.
- **Running depends on timing.** If the last tap of W was less than 0.3 s ago in game time, the next
  tap starts a run. Call `step(0.5)` before a check that must start from walking. This already caused
  one false failure.
- `resetGame()` rebuilds `trees` from the clan, but `buildScene()` must be called too, or the
  3D trees won't match. `startGame()` does both.
- The headless test command needs **absolute paths** (`cygpath -w "$PWD/tests.html"`) and its own
  `--user-data-dir`. Otherwise Edge hands off to an existing process and prints nothing.
- Each of the three code commits (`c64aedc`, `92b323b`, `16b3b6b`) doesn't run alone; the game
  works from `16b3b6b` on. Keep that in mind if you bisect.
- Performance hasn't been measured on real hardware. The CPU updates 4000 grass blades and about
  150 trees every frame. If it's slow, reduce `blades` in `render3d.js` or move the sway into a shader.
- Simplifications that later rounds may hit:
  - Clanmates walk through tree trunks.
  - Marsh pools are only drawn; they don't slow the cat.
  - Squirrels only live west of the river.
  - The rogue health bar is HTML in the bottom right.
  - With a 1-hour day, a game reaches sunset only after about 25 minutes of play.
- Git prints LF→CRLF warnings on every commit. They are harmless.
