# 0008. Look around with the mouse using pointer lock

- Status: accepted
- Date: 2026-11-21
- Round: 4 (R32)

## Decision (Y-statement)

In the context of **R32 (tilt the camera up and down)**, after the owner chose the mouse,
facing **the need to read mouse movement without the pointer leaving the game or hitting the edge of
the screen, while Esc already opens the main menu (R26)**,
we decided for **the browser's Pointer Lock: clicking the game captures the mouse, mouse movement
tilts the camera (up/down) and turns the cat (left/right), and when the lock is released (Esc does
this) the main menu opens. The movement is applied by `lookWithMouse(dx, dy)` in `game.js`**,
and neglected **holding a mouse button and dragging to look, and following the pointer's position
on the screen**,
to achieve **smooth, unlimited looking like most 3D games, with the tilt rules (limits, never under
the ground) in the game rules where the tests can check them**,
accepting **that the player has to click the game first, and that the browser takes the first Esc
press to release the mouse, which is why releasing the lock opens the menu.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Click and drag to look | Works without capturing the mouse, but holding a button while also walking with the keyboard is awkward. |
| Follow the pointer's position | The view stops turning when the pointer reaches the edge of the window. |

## Consequences

- `script.js` listens for `pointerlockchange` and `mousemove` and keeps a `mouseLocked` flag.
- The tilt is stored in `player.camPitch`, limited by `CAM_PITCH_MIN` and `CAM_PITCH_MAX`.
  `cameraFor()` keeps the camera above the ground.
- The keyboard still turns the cat with A/D (R12), so the game can be played without the mouse.
