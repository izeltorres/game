# Cat Clans

A small 3D browser game, Cat Clans, inspired by the Warriors books. You make your own cat, join a clan, and grow
from a kit into an apprentice with a mentor, then choose to become a warrior, deputy or medicine cat.
Hunt and fight well enough and you can become leader of your clan. Watch out for other clans'
patrols on their land.

## How to play

1. Open `index.html` in a web browser. You don't need to install anything, but you need an internet
   connection the first time so the free Three.js 3D library can load.
2. Make your cat: type a name, then pick its fur colour, eye colour, pattern (Solid, Tabby, Patches, Tuxedo,
   Calico, Spotted or Colorpoint) and clan.
3. Press **Start**.

The game fills the browser window. Press **Esc** for the menu, which also lists all the controls and has a
volume slider and a mute switch. Music, weather and nature sounds and cat noises start after your first key
press or click.

The camera sits low and close behind your cat and swings round smoothly when you turn.

### Controls

| Key | Action |
| --- | --- |
| W / ↑ | Walk forward. **Tap twice quickly to run** (keeps running while held) |
| S / ↓ | Walk back (and climb down a tree) |
| A / D or ← / → | Turn |
| Shift | Stalk (crouch and move slowly) |
| Space | Jump (or jump off a tree) |
| E | Action: catch prey, fish, swipe, pick herbs, rest in your den, use the fresh-kill pile, heal a clanmate, groom a clanmate (share tongues), play with a kit, talk to your mentor |
| Mouse | Click the game to capture the mouse, then move it to look up and down and to turn. Esc lets go of the mouse and opens the menu |
| Q (hold) | Scent the air: glowing trails lead to nearby prey |
| M | Map of the clan territories |
| H | Herb pouch. While it is open, 1 = marigold, 2 = dock leaf |
| C | Dodge (hold A or D to roll to that side) |
| F | Pounce attack (apprentices and older) |
| R | Bite (warriors and older, or apprentices with the fighter mentor) |
| Esc | Main menu: Resume, Restart (same cat, start over as a kit), New cat. While fishing, Esc stops fishing |
| G | Drop the prey you are carrying (at the fresh-kill pile it goes onto the pile; pick it up again with E) |
| Walk into a tree | Climb it. High up you can see far (prey and enemies are marked, also on the map), and most enemies can't reach you. Press E to catch a sparrow perched at your height |
| 1 / 2 / 3 / 4 | Leader only, with the pouch closed: order clanmates to Follow, Hunt, Guard, or go on a Big hunt |
| Click | Pick the herb under the aiming dot in the middle of the screen |

### The world

The world is split into 4 clan territories. Press **M** to see the map.

| Territory | Where | Look |
| --- | --- | --- |
| ThunderClan | south-west | Thick oak forest |
| ShadowClan | north-west | Foggy pine marsh with pools |
| WindClan | north-east | Open moor with heather and gorse |
| RiverClan | south-east | Riverside willows and reeds |

- Your clan's cats are friendly. On another clan's land, their patrols and the cats living in their camp
  will attack you, and the HUD turns red. Leave their land and they let you go.
- In the middle of the world stands the **Great Oak**. Leaders are called there for full-moon **Gatherings**; nobody
  attacks in its clearing.
- Every other clan has a **rivalry** with yours (shown on the map). Fights and trespassing raise it, and good speeches
  and decisions lower it. Friendly clans only warn you off; hostile ones spot you sooner and raid your camp.
- Every camp has a **medicine cat**. Yours, Thymeleaf, heals you (E next to them, once a minute) and treats hurt clanmates.
- Kits play in every camp. Yours chase each other, pounce and tumble about; other clans' kits hide in their
  nursery when you come near. Your kits come up to you once you are an apprentice; press E to play a pounce game.
- Cats are solid: you can't walk through them. Camp cats groom, greet, share prey and argue with each other, and
  walk to the fresh-kill pile to eat when they are hungry. Every clan's **leader** stands by its Highrock.
- **The river** flows south: in deep water the current carries you along. You wade (slower, no current) in the
  shallows along the banks, and stepping stones cross both waters.
- **Rogues:** after your apprenticeship they come in packs of 2–3 that roam your territory, hunt you, circle and
  sidestep in a fight, and raid your camp if nobody chases them off. Beat the leader and the whole pack runs.
- Your camp has five huts you can walk into through their doorways (the nursery, the apprentices' den,
  the warriors' den, the medicine den and the leader's den in front of the Highrock), and a fresh-kill pile.
  Trees, rocks and hut walls are solid.
  - Press E inside **your own** den to sleep: you heal fully and wake up the next morning.
  - Press E at the fresh-kill pile to drop off prey you carry, or to eat if you are hungry. The pile shows the real
    prey on it, and prey older than a day is cleared away.

### Health, food, herbs and time

- **Health** and **Food** bars are at the bottom of the screen.
- Moving uses food, and running uses it twice as fast. Catching prey refills it:

  | Prey | Food |
  | --- | --- |
  | Beetle | +8 |
  | Mouse | +20 |
  | Vole | +18 |
  | Sparrow | +15 |
  | Squirrel | +40 |
  | Rabbit | +45 |
  | Hare (big hunt only) | 4 pieces on the fresh-kill pile |
  | Fish | +30 |
  | Fresh-kill pile | +25 |

  After you choose a path, every 4 beetles count as 1 prey toward promotion.

  With full food, you carry prey in your mouth instead of eating it.
- Pick herbs with E into your **herb pouch** (5 herbs). Press H, then 1 for marigold (heals 30) or
  2 for dock leaf (heals 15).
- With no food, health slowly drops. At zero health your cat faints and wakes up at camp, keeping its progress.
- A full day and night lasts **one real hour**, with sunrise, sunset and a starry night.
- **Seasons** change every 30 game days: newleaf, greenleaf (prey comes back twice as fast, more clear days and
  storms), leaf-fall (more rain and wind, lots of falling leaves) and leaf-bare (snow, half the prey, no storms).
- **Weather** changes every few minutes: clear, rain (only half the prey comes out, scent is weaker), fog (prey notices
  you less), wind (scent carries further) or a thunderstorm (all prey hides and other clans' patrols stay home).
- **Fishing:** press E by the water. Fish swim under the surface; press E when one is under your paw (the ripple).
  RiverClan's paw reaches further.

### Tasks and ranks

| Rank | What to do | Reward |
| --- | --- | --- |
| Kit | Stay in camp and catch 5 beetles and 3 mice there (stalk mice with Shift). You grow with every catch. Camp prey is slow and easy to sneak up on. | Become an apprentice (*-paw*) and choose a mentor |
| Apprentice | Do your mentor's tasks; your mentor leads the way: walk the border (3 glowing markers; the next one glows brightest), hunt a squirrel, climb a tree, catch 3 fish, chase off a rogue. Your mentor shows you how, and E next to them repeats the task with a tip. | Choose a path: Warrior or Medicine cat. The clan leader gives you your warrior name |
| Warrior | Catch 5 prey (mice, squirrels, fish), win 3 fights (rogues or other clans' cats) and walk a border patrol. | Become Deputy |
| Deputy | Catch 3 prey, win 2 fights, train one of the camp's kits as your apprentice (a hunting lesson, battle practice, a border patrol together), and complete a mission outside your territory: carry a message to another camp, take back stolen prey, or find a lost kit. | Become Leader (*-star*) with nine lives |
| Medicine cat | Start as Thymeleaf's apprentice. Collect the herbs Thymeleaf asks for and put them in the medicine den's store (E inside the den), and heal hurt clanmates (E next to them, with herbs in your pouch). | Medicine cat, then senior medicine cat (never leader) |
| Leader | Give orders to your 3 clanmates: Follow (they help you fight), Hunt (they bring fresh-kill), Guard (they guard camp). Order 4 starts a big hunt for a hare. Go to the Gatherings, and make big decisions for your clan when they come up. You have **nine lives**: at 0 health you lose one and get up again. Losing the ninth is game over. | |

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
- `sound.js`: music, background sounds and cat noises, all made in the browser (Web Audio).
- `tests.html`: automatic tests. Open it in a browser; it plays through the game and lists PASS/FAIL
  for each check, each named with its requirement ID (R1–R72).
- `problem.md`, `spec.md`: what the game should be.
- `decision.md`, `docs/decisions/`, `handoff.md`, `handoff-round-N.md`: project notes and decision records.

## Hosting

The game is plain HTML, CSS and JavaScript, so it can be hosted for free on GitHub Pages.
