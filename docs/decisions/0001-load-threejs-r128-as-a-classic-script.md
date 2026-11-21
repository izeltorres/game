# 0001. Load Three.js r128 as a classic script from cdnjs

- Status: accepted
- Date: 2026-11-21
- Round: 1 (R11)

## Decision (Y-statement)

In the context of **R11 (a low camera behind the cat)**, which the owner chose to meet by
rebuilding the game in 3D with Three.js,
facing **the need to keep the game free, build-free, and playable by double-clicking
`index.html` as well as on GitHub Pages**,
we decided for **Three.js r128 loaded with a plain `<script>` tag from cdnjs.cloudflare.com**
and neglected **the latest Three.js loaded as an ES module (import map), downloading a copy of
Three.js into the repository, and a different engine (Babylon.js)**,
to achieve **a game that still opens straight from the file system with no build step or local
server, and code that uses the simple global `THREE` object**,
accepting **an older Three.js version (no newer features), and that the 3D view needs an internet
connection the first time it loads.**

## Alternatives considered

| Option | Why not chosen |
| --- | --- |
| Latest Three.js as an ES module | Browsers block ES module imports from `file://` pages, so `index.html` would need a local server to run. The README promises "open `index.html`". |
| Download Three.js into the repo | Works offline, but adds a large third-party file to a student repo. The CDN is free and already allowed by the hosting rules. |
| Babylon.js | Also free, but bigger and more than this game needs. Three.js is more common in tutorials, which helps a student project. |

## Consequences

- `index.html` and `tests.html` load `https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js`
  before `game.js`, `render3d.js` and `script.js`.
- If the library cannot load, the game shows a message asking the player to check their internet.
  The game rules in `game.js` do not need Three.js.
