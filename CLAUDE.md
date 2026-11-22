# CLAUDE

Guidance for Claude Code when working in this repository.

## Project
A game that allows for players to become a cat in a mystical game based on Warriors book.
The game is called **Cat Clans**. The name is `GAME_NAME` in `game.js`; the page and README use it too.

- `problem.md`: the problem and initial requirements.
- `SPEC.md`: the specification, written and edited by the owner. Build from it. If the code needs to differ from it, ask the owner first.
- `decision.md`: every decision the owner makes. Add each new decision to the end, under a heading for the current session.
- `handoff.md`: the handoff from before Round 1 (the 2D game). Kept as a record; don't edit or delete it.
- `index.html`, `style.css`: the game page.
- `game.js`: the game rules only (no page or drawing code), so tests can run them.
- `render3d.js`: draws the game in 3D with Three.js (loaded from a CDN).
- `script.js`: keyboard, menu, HUD and the main loop.
- `tests.html`: automatic tests; open it in a browser. Each check names its requirement ID.
- `docs/decisions/`: numbered decision records (Y-statements) for technical choices.
- `README.md`: overview and how to run it. Keep it up to date.

- `handoff-round-N.md`: where the project stood at the end of round N. Read the latest one at the start of a session.

## Rules
- Everything must be free: no paid hosting, databases, APIs, or accounts. Hosting is GitHub Pages.
- Keep the code simple and readable; this is a student project.
- `index.html` must keep working when opened straight from the file system (no build step, no local
  server). Load libraries as plain `<script>` tags from a CDN, not as ES modules.
- `game.js` holds only game rules: no DOM and no Three.js. `render3d.js` only reads the game state.
  `game.js` talks to the page only through `hooks`.
- Computer-controlled cats move only with `moveToward()` in `game.js`, which walks them around trees,
  rocks and huts. Changing their `x`/`z` directly lets them walk through walls or get stuck.
- Never undo or amend a commit. Commit in small steps with messages that say what changed and why.
- Record technical decisions that had real alternatives in `docs/decisions/` as Y-statements, numbered
  `0001`, `0002`, ... (next free number). Owner decisions also go in `decision.md`.

## Testing
Test after a change.
- Every new or changed requirement gets checks in `tests.html`. Each check starts with the requirement
  ID, e.g. `check("R7", "what is checked", () => ...)`.
- Checks run in order and share state, so set up what each check needs (see the helpers at the top of
  the test script).
- Place the cat relative to its own camp (`placeAt(dx, dz)`, `at(dx, dz)`), not at fixed world
  positions: camps differ per clan, and spots in another clan's territory start patrol fights.
- Prey moves randomly. Call `quiet()` before a check that presses E near the ground, then add the
  prey the check needs.
- After teleporting the cat or setting its `heading`, call `snapCamera()` before checking the camera.
- Call `step(0.5)` before a check that must start from walking: a W tap less than 0.3 s after the
  last one starts a run.
- Kits can't leave their camp. A check that needs to move around outside the camp must start as an
  apprentice or older (`freshApprentice()`, `freshWithRole()`).
- All checks, including earlier rounds', must pass before the work is done.
- Run the full suite at least twice before finishing. Cats and prey move randomly, so a check can pass
  once and still be flaky.
- There is no Node.js. Run the tests in headless Edge from Git Bash (absolute paths and a separate
  profile folder are required, or Edge prints nothing):

  ```sh
  PROFILE="$(cygpath -w "$TEMP/edge-test-profile")"
  "/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" --headless=new \
    --enable-unsafe-swiftshader --use-angle=swiftshader --no-first-run "--user-data-dir=$PROFILE" \
    --virtual-time-budget=120000 --dump-dom "file:///$(cygpath -w "$PWD/tests.html")" 2>/dev/null \
    | grep -oE '<h2 id="summary"[^>]*>[^<]*|<li class="fail">[^<]*' | sed -E 's/<[^>]*>//'
  ```

  It prints the summary line (`ALL N TESTS PASSED`, or how many failed) and each failing check.
  A full run takes a few minutes, so give the command a long timeout (or run it in the background).
