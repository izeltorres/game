# 0013. Wind the river with a sine shift worked out from z

- Status: accepted
- Date: 2026-11-22
- Round: 7 (R74 a winding river)

## Decision (Y-statement)

In the context of **making the big river wind (R74) when about forty places in the rules, drawing,
map, grass shader, sound and tests assumed the water was a straight strip between two fixed x values**,
facing **the need for every one of those places to agree exactly on where the water is, including the
grass shader on the graphics card, and for the clan borders and existing camps to stay where they are**,
we decided for **one function, `riverShift(z) = 5 · sin(2πz / 80)`, that moves the river sideways at
each z, and `watersAt(z)` that returns both waters' edges there. `inRiver`, `nearRiver` and
`waterDepthAt` now take `z`; the water, banks and shallows are drawn as strips built along z; the
shader gets the same two numbers as a uniform**,
and neglected **a river drawn through a list of hand-placed points (a spline or polyline), and a river
made of tiles on a grid**,
to achieve **a river that winds smoothly, can be checked exactly by tests (its middle is at 33, 38
and 28 at z = 0, 20 and −20), and costs one sine per question in game code and in the shader**,
accepting **regular, evenly spaced bends rather than a natural-looking course, and that every caller
of the water functions must now pass `z`.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| A path of hand-placed points (spline/polyline) | Looks more natural, but finding "is this point in the water?" needs a search along the path, which is slow in the grass shader and much more code for a student project. |
| A grid of water tiles | Fits any shape, but makes jagged edges, needs a lookup table passed to the shader, and changes how the water is drawn completely. |

## Consequences

- `RIVER_X0`/`RIVER_X1` are now the river's edges at z = 0, not everywhere. Code and tests must use
  `watersAt(z)` (tests: `riverAt(z)`).
- Level with each camp (z = ±60) the river is at the top of a bend, so it runs straight along z there;
  river checks are placed there.
- The stream does not bend, and the clan borders do not change.
