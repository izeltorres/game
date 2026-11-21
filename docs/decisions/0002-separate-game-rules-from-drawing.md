# 0002. Keep the game rules separate from the 3D drawing

- Status: accepted
- Date: 2026-11-21
- Round: 1 (R6–R11)

## Decision (Y-statement)

In the context of **rebuilding the game in 3D for Round 1 while keeping every earlier test passing**,
facing **the need to test running, food, climbing, roles and the day cycle quickly and exactly,
without a person watching the screen**,
we decided for **splitting the code into `game.js` (rules only, no page or Three.js code),
`render3d.js` (draws the state with Three.js) and `script.js` (keyboard, menu, HUD, main loop)**,
and neglected **keeping one big `script.js` as in the first version, and testing only by
playing the game by hand**,
to achieve **tests that run the rules directly (for example, an hour of game time in a moment)
and a 3D view that can change without breaking the rules**,
accepting **three files instead of one, and that `CLAUDE.md`'s file list needed updating.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| One `script.js` | Simple, but mixing 3D drawing with rules makes the file very long and the tests would depend on WebGL for every check. |
| Manual testing only | Slow, and changes like "running uses food twice as fast per distance" can't be checked by eye. |

## Consequences

- `tests.html` still runs in a browser (the project has no Node.js), and loads all three files.
  A few checks also draw the 3D view to make sure it works.
- `render3d.js` only reads the game state and never changes it.
