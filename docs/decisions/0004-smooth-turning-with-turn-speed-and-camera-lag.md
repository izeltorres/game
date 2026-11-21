# 0004. Smooth turning with a turn speed that ramps up, plus a lagging camera

- Status: accepted
- Date: 2026-11-21
- Round: 2 (R12)

## Decision (Y-statement)

In the context of **R12 (turning should not be choppy)**,
facing **keyboard turning that started and stopped at full speed in one frame, with the camera
fixed behind the cat so the whole view jerked with it**,
we decided for **giving the cat a turning speed that speeds up and slows down (about 0.2 s to reach
full speed or stop), and a camera direction that eases towards the cat's direction, both kept in
`game.js`**,
and neglected **mouse-look (turning with the mouse), and smoothing only the camera inside
`render3d.js`**,
to achieve **turning that feels smooth on a keyboard, while short taps still allow small, precise
turns, and rules the tests can check exactly (turning speed, camera direction)**,
accepting **a slightly slower response to a quick change of direction, and that tests which
teleport the cat must call `snapCamera()` to put the camera straight behind it.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Mouse-look | Smooth, but needs pointer lock and changes every control. The owner asked about the turn buttons. It could still be added later. |
| Smooth only the camera in `render3d.js` | The cat itself would still snap between turning and not turning. Also, the drawing code must only read the game state (decision 0002), so camera state would have to live there, untested. |

## Consequences

- `player.turnVel` (turning speed) and `player.camHeading` (camera direction) are new parts of the state.
- `cameraFor()` uses `camHeading`, not `heading`. Code that moves the cat instantly (fainting,
  tests) calls `snapCamera()`.
- The settings are `TURN_SPEED`, `TURN_ACCEL` and `CAMERA_FOLLOW` at the top of `game.js`.
