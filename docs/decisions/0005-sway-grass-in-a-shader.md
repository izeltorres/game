# 0005. Sway and place the grass in a shader on the graphics card

- Status: accepted
- Date: 2026-11-21
- Round: 3 (R24)

## Decision (Y-statement)

In the context of **R24 (more realistic grass)**,
facing **the need for far more blades, made of more vertices each (curved, tapered, in clumps),
than Round 2's 3500 cone blades, whose positions and colours the CPU updated one by one every frame**,
we decided for **one `InstancedMesh` of 9000 segmented blades whose positions never change. A small
shader added with `onBeforeCompile` wraps them around the cat, sways them in the wind, tints them by
territory, and hides them in water and camps**,
and neglected **keeping the per-frame CPU update with more blades, and flat grass textures or
billboard sprites**,
to achieve **much denser, nicer grass without slowing the game down, since the CPU now only sets two
values (time and the cat's position) per frame**,
accepting **a little GLSL code in a student project, a JavaScript copy of the "where can grass grow"
rule (`grassAllowedAt`) so the tests can check it, and that the shader depends on the names of
Three.js r128's shader chunks.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Keep updating every blade on the CPU, with more blades | 9000 matrix and colour updates every frame would likely make the game stutter on a school laptop. Performance was already an open warning in the Round 2 handoff. |
| Grass textures or billboards | Cheap, but flat cards don't look like separate blades from a camera that sits low in the grass (R11). |

## Consequences

- `makeGrass()` in `render3d.js` holds the shader. `renderFrame()` only updates `uTime` and `uCenter`.
- The world-layout values (water, camps, territory colours) are passed to the shader as uniforms. If
  the world layout changes, update them and `grassAllowedAt()` together.
- Upgrading Three.js past r128 means checking the shader chunk names it replaces (`color_vertex`,
  `begin_vertex`, `project_vertex`).
