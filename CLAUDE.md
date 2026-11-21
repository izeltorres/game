# CLAUDE

Guidance for Claude Code when working in this repository.

## Project
A game that allows for players to become a cat in a mystical game based on Warriors book

- `problem.md`: the problem and initial requirements.
- `SPEC.md`: the specification, written and edited by the owner. Build from it. If the code needs to differ from it, ask the owner first.
- `decision.md`: every decision the owner makes. Add each new decision to the end, under a heading for the current session.
- `handoff.md`: where the project stands and what to do next. Read it at the start of a session and update it at the end.
- `index.html`, `style.css`: the game page.
- `game.js`: the game rules only (no page or drawing code), so tests can run them.
- `render3d.js`: draws the game in 3D with Three.js (loaded from a CDN).
- `script.js`: keyboard, menu, HUD and the main loop.
- `tests.html`: automatic tests; open it in a browser. Each check names its requirement ID.
- `docs/decisions/`: numbered decision records (Y-statements) for technical choices.
- `README.md`: overview and how to run it. Keep it up to date.

## Rules
- Everything must be free: no paid hosting, databases, APIs, or accounts. Hosting is GitHub Pages.
- Keep the code simple and readable; this is a student project.

## Testing
Test after a change
