# 0012. Draw the textures on a canvas when the game starts

- Status: accepted
- Date: 2026-11-22
- Round: 6 (R60 more textures)

## Decision (Y-statement)

In the context of **adding textures to the ground, camp dirt, tree bark, rocks, cat fur, huts and water
in a page that must open straight from the file system**,
facing **the fact that Three.js can't load image files from `file://` in most browsers (the canvas
becomes "tainted" and WebGL refuses the image), and that every image file would also need a free
licence**,
we decided for **`makeTexture(kind)` in `render3d.js`, which draws each pattern once on a 128×128 canvas
(speckles for ground, dirt and rock, cracks for bark, short strokes for fur, crossing twigs for huts,
wavy lines for water) in greys, so the material's colour tints it; `texturedMat()` clones it with its own
repeat**,
and neglected **image files in the repository, and images loaded from a CDN or texture site**,
to achieve **textures that work from `file://`, need no files or licences, and keep every territory's
own colours**,
accepting **simple, slightly repetitive patterns instead of photo-real ones, and a small start-up cost
to draw seven canvases.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Image files in the repository | Blocked by the browser when the page is opened from `file://`, which `CLAUDE.md` requires to work. |
| Images from a CDN or texture website | Needs internet and cross-origin permission from that site, and a licence check for each image. |

## Consequences

- Textures are cached by kind; the water texture's offset moves with the river's current (R59).
- The cat fur texture sits under the existing pattern pieces (stripes, patches), which are unchanged.
