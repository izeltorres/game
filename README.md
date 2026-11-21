# Forest Clans

A small 3D browser game inspired by the Warriors books. You make your own cat, join a clan, and grow
from a kit into an apprentice with a mentor, then choose to become a warrior, deputy or medicine cat.
Hunt and fight well enough and you can become leader of your clan. Watch out for other clans'
patrols on their land.

## How to play

1. Open `index.html` in a web browser. You don't need to install anything, but you need an internet
   connection the first time so the free Three.js 3D library can load.
2. Make your cat: type a name, then pick its fur colour, eye colour, pattern and clan.
3. Press **Start**.

The camera sits low and close behind your cat and swings round smoothly when you turn.

### Controls

| Key | Action |
| --- | --- |
| W / ↑ | Walk forward. **Tap twice quickly to run** (keeps running while held) |
| S / ↓ | Walk back (and climb down a tree) |
| A / D or ← / → | Turn |
| Shift | Stalk (crouch and move slowly) |
| Space | Jump (or jump off a tree) |
| E | Action: catch prey, fish, swipe, pick herbs, rest in your den, use the fresh-kill pile, heal a clanmate |
| Q (hold) | Scent the air: glowing trails lead to nearby prey |
| M | Map of the clan territories |
| H | Herb pouch. While it is open, 1 = marigold, 2 = dock leaf |
| C | Dodge (hold A or D to roll to that side) |
| F | Pounce attack (apprentices and older) |
| R | Bite (warriors and older, or apprentices with the fighter mentor) |
| Esc | Stop fishing |
| Walk into a tree | Climb it |
| 1 / 2 / 3 | Leader only, with the pouch closed: order clanmates to Follow, Hunt or Guard |

### The world

The world is split into 4 clan territories. Press **M** to see the map.

| Territory | Where | Look |
| --- | --- | --- |
| ThunderClan | south-west | Thick oak forest |
| ShadowClan | north-west | Foggy pine marsh with pools |
| WindClan | north-east | Open moor with heather and gorse |
| RiverClan | south-east | Riverside willows and reeds |

- Your clan's cats are friendly. On another clan's land, their patrols will attack you, and the HUD
  turns red. Leave their land and they let you go.
- Your camp has a nursery, an apprentices' den, a warriors' den, a medicine den, the leader's den
  under the Highrock, and a fresh-kill pile.
  - Press E at **your own** den to sleep: you heal fully and wake up the next morning.
  - Press E at the fresh-kill pile to drop off prey you carry, or to eat if you are hungry.

### Health, food, herbs and time

- **Health** and **Food** bars are at the bottom of the screen.
- Moving uses food, and running uses it twice as fast. Catching prey refills it:

  | Prey | Food |
  | --- | --- |
  | Beetle | +8 |
  | Mouse | +20 |
  | Squirrel | +40 |
  | Fish | +30 |
  | Fresh-kill pile | +25 |

  With full food, you carry prey in your mouth instead of eating it.
- Pick herbs with E into your **herb pouch** (5 herbs). Press H, then 1 for marigold (heals 30) or
  2 for dock leaf (heals 15).
- With no food, health slowly drops. At zero health your cat faints and wakes up at camp, keeping its progress.
- A full day and night lasts **one real hour**, with sunrise, sunset and a starry night.

### Tasks and ranks

| Rank | Task | Reward |
| --- | --- | --- |
| Kit | Hunt a squirrel. Stalk up to it without being heard, then pounce. Beetles and mice are easy extra food. | The cat grows |
| Kit | Go fishing at the water in your territory. Press E when the fish is in the gold zone, 3 times. | Become an apprentice (*-paw*) and choose a mentor |
| Apprentice | Chase a rogue cat off your territory. | Choose a role: Warrior, Deputy or Medicine cat |
| Warrior | Catch 5 prey (mice, squirrels, fish) and win 3 fights (rogues or patrols). | Become Leader (*-star*) |
| Deputy | Catch 3 prey and win 2 fights. | Become Leader |
| Medicine cat | Heal hurt clanmates in camp (E next to them, with herbs in your pouch). | Medicine cats never become leader |
| Leader | Give orders to your 3 clanmates: Follow (they help you fight), Hunt (they bring fresh-kill), Guard (they guard camp). | |

### Mentors

| Mentor | Specialty | Bonus for the rest of the game |
| --- | --- | --- |
| Mosswhisker | Hunter | Prey notices you less, and your scent sense reaches 45 instead of 30 |
| Briarfang | Fighter | All moves hit 25% harder, and you can bite as an apprentice |
| Fernsong | Herb-wise | Your pouch holds 8 herbs, and herbs heal 50% more |

### Combat

| Move | Key | Damage |
| --- | --- | --- |
| Swipe | E | 10, quick |
| Dodge | C | Attacks miss you during the roll |
| Pounce attack | F | 25 and staggers the enemy (it can't attack), but you need a moment to get up |
| Bite | R | 18, or 36 on a staggered enemy |

### Clans

| Clan | About | Attributes |
| --- | --- | --- |
| ThunderClan | Forest hunters | Best climbers: climb faster and much higher. Prey notices you less |
| RiverClan | Swimmers and fishers | Swim fast, bigger fishing zone |
| WindClan | Fast runners | Fastest walking and running |
| ShadowClan | Mysterious | Live in the foggy pine marsh. Strike harder in a fight |

## Files

- `index.html`, `style.css`: the game page.
- `game.js`: the game rules.
- `render3d.js`: the 3D drawing (Three.js).
- `script.js`: keyboard, menu, HUD, map, herb pouch and main loop.
- `tests.html`: automatic tests. Open it in a browser; it plays through the game and lists PASS/FAIL
  for each check, each named with its requirement ID (R1–R20).
- `problem.md`, `spec.md`: what the game should be.
- `decision.md`, `docs/decisions/`, `handoff.md`, `handoff-round-N.md`: project notes and decision records.

## Hosting

The game is plain HTML, CSS and JavaScript, so it can be hosted for free on GitHub Pages.
