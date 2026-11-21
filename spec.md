spec.md

# spec: warrior cats inspired themed game

Based on `problem.md` (Initial requirements R1–R5 and Round 1 requirements R6–R11).

## Purpose
A rbg game that allows you play as a 3rd perspective account.

From Round 1 the game is **3D**: the world is drawn with the free Three.js library
(loaded from a CDN), and the camera follows the cat from behind (R11).

## Features

### 1. The cat
- starts as a kitten
- The user chooses and costumizes a the cat they will play as
- The user choses the clan it wants to play as

### 2. Background
- a forest
- grass will have a slight wave.
- trees leaves will have a wave too
- ShadowClan cats play in a different background: a marshy pine forest (R6)

### 3. Task
-the cat encounter several task, which each encounter allowing it to level up
-- level one: hunt a squirrel, cat grows
-- level two: go fishing, become an appretice
-- level three: combat another cat (a rogue), then choose a role (R9)

### 4. Clans
- options to choose
--ThunderCLan; forest hunters
--RiverClan; swimmers and fishers
--WindClan; fast runners
--ShadowClan; mysterous

## Round 1

### R6. Clan attributes
Each clan plays differently:

| Clan | Attribute |
| --- | --- |
| ThunderClan | Best tree climber: climbs faster and much higher than other clans. Prey also notices it less (kept from before). |
| RiverClan | Swims faster in the river (other clans are slowed down in water) and has a bigger fishing zone. |
| WindClan | Fastest walker and runner. |
| ShadowClan | Plays in a marshy pine forest (pine trees, marsh pools, fog, darker ground). Strikes harder in a fight (kept from before). |

- Every clan can climb trees a little; ThunderClan climbs best.
- To climb, walk forward into a tree trunk. Hold forward to climb up, back to climb down,
  and Space to jump off.

### R7. Running
- Tap the forward key twice quickly (within 0.3 seconds) to run.
- The cat keeps running while the key stays held, and walks again once it is released.
- Running is faster than walking and uses food faster.

### R8. Health and food bars
- A health bar and a food bar are shown along the bottom of the screen.
- Food goes down as the cat moves: the further it moves, the more food it uses.
  Running uses food twice as fast per distance. Standing still uses no food.
- Eating refills food: catching a squirrel or a fish.
- When food is empty, health slowly goes down.
- When health reaches zero the cat faints: it wakes up at camp with full health, at least
  half food, and keeps its progress. A rogue it was fighting goes back to waiting.

### R9. Roles
- Kit tasks (squirrel, fishing) → apprentice → apprentice task (chase off the rogue) →
  the player chooses a role: **Warrior**, **Deputy** or **Medicine cat**.
- Warriors and deputies keep their warrior name (e.g. Stormclaw).
- Hunting and fighting more:
  - Squirrels keep appearing in the forest, fish can still be caught at the river, and a
    new rogue appears some time after the last one is chased off.
  - A warrior who catches 5 prey and wins 3 fights after choosing a role becomes **Leader**.
  - A deputy needs only 3 prey and 2 fights.
  - A medicine cat cannot become leader. Instead, a medicine cat can gather healing herbs
    (press E next to an herb patch) to restore health.
- A leader's name ends in "star" (e.g. Stormstar).
- A leader has 3 clanmates and can give them orders:
  - **1 – Follow:** clanmates follow the leader and help in fights.
  - **2 – Hunt:** clanmates hunt and bring back fresh-kill that refills the leader's food.
  - **3 – Guard:** clanmates go back to camp and guard it.

### R10. Day and night
- One full day (morning → noon → sunset → night → morning) lasts **one real hour**.
- A game starts in the morning.
- The sky, sun and light change through the day, with an orange sunset and a dark night.
- The time of day is shown in the HUD.

### R11. Camera
- The camera sits low and close behind the cat, near the cat's eye level, and looks
  forward past the cat.
- Controls: W / ↑ forward, S / ↓ back, A / ← and D / → turn, Shift stalk, Space jump,
  E action, Esc stop fishing, 1/2/3 orders (leader only).
