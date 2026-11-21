# Forest Clans

A small 3D browser game inspired by the Warriors books. You make your own cat, join a clan, and grow
from a kit into an apprentice, then choose to become a warrior, deputy or medicine cat. Hunt and fight
well enough and you can become leader of your clan.

## How to play

1. Open `index.html` in a web browser. You don't need to install anything, but you need an internet
   connection the first time so the free Three.js 3D library can load.
2. Make your cat: type a name, then pick its fur colour, eye colour, pattern and clan.
3. Press **Start**.

The camera sits low and close behind your cat, at a cat's eye level.

### Controls

| Key | Action |
| --- | --- |
| W / ↑ | Walk forward. **Tap twice quickly to run** (keeps running while held) |
| S / ↓ | Walk back (and climb down a tree) |
| A / D or ← / → | Turn |
| Shift | Stalk (crouch and move slowly) |
| Space | Jump (or jump off a tree) |
| E | Action: pounce, fish, swipe, or gather herbs |
| Esc | Stop fishing |
| Walk into a tree | Climb it |
| 1 / 2 / 3 | Leader only: order clanmates to Follow, Hunt or Guard |

### Health, food and time

- **Health** and **Food** bars are at the bottom of the screen.
- Moving uses food, and running uses it twice as fast. Catching a squirrel or a fish refills it.
- With no food, health slowly drops. At zero health your cat faints and wakes up at camp, keeping its progress.
- A full day and night lasts **one real hour**, with sunrise, sunset and a starry night. The clock is in the top left.

### Tasks and ranks

| Rank | Task | Reward |
| --- | --- | --- |
| Kit | Hunt a squirrel. Stalk up to it without being heard, then pounce. | The cat grows |
| Kit | Go fishing at the river to the east. Press E when the fish is in the gold zone, 3 times. | Become an apprentice (name ends in *-paw*) |
| Apprentice | Chase a rogue cat off your territory. | Choose a role: Warrior, Deputy or Medicine cat |
| Warrior | Catch 5 prey and win 3 fights against new rogues. | Become Leader (name ends in *-star*) |
| Deputy | Catch 3 prey and win 2 fights. | Become Leader |
| Medicine cat | Gather glowing herbs (E) to heal. | Medicine cats never become leader |
| Leader | Give orders to your 3 clanmates: Follow (they help you fight), Hunt (they bring fresh-kill), Guard (they guard camp). | |

### Clans

| Clan | About | Attributes |
| --- | --- | --- |
| ThunderClan | Forest hunters | Best climbers: climb faster and much higher. Prey notices you less |
| RiverClan | Swimmers and fishers | Swim fast in the river, bigger fishing zone |
| WindClan | Fast runners | Fastest walking and running |
| ShadowClan | Mysterious | Live in a foggy, marshy pine forest. Strike harder in a fight |

## Files

- `index.html`, `style.css`: the game page.
- `game.js`: the game rules.
- `render3d.js`: the 3D drawing (Three.js).
- `script.js`: keyboard, menu, HUD and main loop.
- `tests.html`: automatic tests. Open it in a browser; it plays through the game and lists PASS/FAIL
  for each check, each named with its requirement ID (R1–R11).
- `problem.md`, `spec.md`: what the game should be.
- `decision.md`, `docs/decisions/`, `handoff.md`: project notes and decision records.

## Hosting

The game is plain HTML, CSS and JavaScript, so it can be hosted for free on GitHub Pages.
