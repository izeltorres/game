# 0016. Fade what blocks the view, found from the sight line seen from above

- Status: accepted
- Date: 2026-11-22
- Round: 8 (R81 don't let things block the player's view)

## Decision (Y-statement)

In the context of **trees, other cats and huts hiding the player's cat from the low camera behind it
(R81), where the owner chose fading over moving the camera**,
facing **about 520 trees with branches, 50 cats and 20 huts, whose materials are shared (one bark
material for a whole forest), so changing one material would fade everything that uses it**,
we decided for **checking each frame, seen from above, which nearby trunks, tree tops (if the sight
line is at their height), cats and hut circles are within reach of the line from the camera to the
cat, and swapping just those meshes to their own see-through copy of their material (made the first
time it is needed), swapping back when they are out of the way**,
and neglected **casting rays through the 3D scene, and making the shared materials see-through**,
to achieve **only the things really in the way fading, cheaply enough for every frame, with results
the tests can check exactly**,
accepting **an approximate test (trees are cylinders and blobs, cats are circles), and one extra
material per faded mesh kept in memory after it has faded once.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Three.js raycasting every frame | Tests every triangle of hundreds of meshes, slow with the leaves and branches, and still needs per-mesh materials to fade only one tree. |
| Fade the shared material | Every tree of that kind (or every cat with that fur) would fade together. |

## Consequences

- `view.treeParts` lists each tree's trunk, top and branches in the order of `trees`; `view.hutModels`
  have `userData.hut`. Faded objects have `userData.faded`.
- The hut you are inside never fades; the camera is already inside it (R25).
