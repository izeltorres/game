spec.md

# spec: warrior cats inspired themed game

Based on `problem.md` (Initial requirements R1–R5, Round 1 requirements R6–R11 and Round 2 requirements R12–R20).

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
- From Round 2 the world has 4 clan territories, each with its own look (R15, R16)

### 3. Task
-the cat encounter several task, which each encounter allowing it to level up
-- level one: hunt a squirrel, cat grows
-- level two: go fishing, become an appretice, then choose a mentor (R19)
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

## Round 2

### World layout (used by R15, R16, R20)
- The world is a square split into 4 equal territories, one per clan, each with its own look:

  | Territory | Where | Look |
  | --- | --- | --- |
  | ThunderClan | south-west | Thick oak forest |
  | ShadowClan | north-west | Marshy pine forest with pools and fog (R6) |
  | WindClan | north-east | Open moor: few trees, gorse bushes, heather |
  | RiverClan | south-east | Riverside: willows, reeds, the big river |

- Each clan has a camp in the middle of its territory. The player lives in its own clan's camp.
- Every territory has water for fishing. The big river runs through WindClan and RiverClan land,
  and a stream runs through ThunderClan and ShadowClan land.
- The HUD shows whose territory the cat is standing in.

### R12. Smooth turning
- Turning speeds up and slows down gradually instead of starting and stopping at full speed.
- The camera swings around behind the cat smoothly, a little behind the cat's turn.

### R13. Easy prey for everyone, all game
- Beetles and mice appear in your territory for the whole game, and new ones keep coming.
- Anyone, including a kit, can catch them: walk up and press E. Beetles barely notice you. Mice notice
  you if you walk up loudly, but not if you stalk.
- Food: beetle +8, mouse +20 (squirrel +40, fish +30 as before).
- Squirrels now appear at every rank, not only as the kit task and after choosing a role.
- The kit task is still "hunt a squirrel".
- After choosing a role, mice, squirrels and fish count as prey toward leader. Beetles don't.
- If your food is already full, caught prey (except beetles, which are eaten) is carried in your mouth.
  Take it to the fresh-kill pile (R20).

### R14. Hunt by scent
- Hold Q to scent the air. The view dims and glowing scent trails lead to nearby prey, even through
  trees. Prey markers glow above the prey.
- The HUD names the nearest prey, its distance, and which way to turn.
- Range: 30 units (45 with the hunter mentor). The cat walks slowly while scenting and can't run.

### R15. Map
- Press M to open or close a map of the whole world: the 4 territories in their clan colours with
  their names, every camp, the river and stream, and an arrow showing where you are and which way you
  are facing.
- The game keeps running while the map is open.

### R16. Friendly clanmates, hostile territories
- Your own clan's cats (in your camp, and your mentor) are always friendly. They never attack.
- Each other clan has a patrol of 2 cats near its camp. If you step into their territory and come
  within 14 units of a patrol cat, it attacks.
- Patrol cats never leave their own territory. If you leave it, they stop chasing and go back.
- You fight patrol cats with the same moves as rogues (R17). A beaten patrol cat runs home and
  recovers after 30 seconds. After choosing a role, beating one counts as a fight won.
- Losing faints the cat, which wakes up in its own camp, as before (R8).
- A warning shows in the HUD while you are in another clan's territory.

### R17. More combat moves

| Move | Key | What it does | Who can use it |
| --- | --- | --- | --- |
| Swipe | E | Quick hit: 10 damage, 0.4 s cooldown (as before) | Everyone |
| Dodge | C | Quick roll sideways (A/D picks the side, otherwise backwards). Attacks miss you during the roll. 1 s cooldown | Everyone |
| Pounce attack | F | Leap forward and land on the enemy: 25 damage and the enemy is staggered for 1.5 s. You can't act for 1 s afterwards | Apprentices and older |
| Bite | R | 18 damage, 0.9 s cooldown. Double damage on a staggered enemy | Warriors and older; apprentices with the fighter mentor |

- A staggered enemy can't attack.
- Clan damage bonuses (ShadowClan) and the fighter mentor's bonus apply to every move.

### R18. Herb pouch and healing
- Herb patches grow in every territory. There are 2 kinds: **marigold** (heals 30) and **dock leaf** (heals 15).
- Any cat picks herbs with E into its herb pouch. The pouch is small: 5 herbs (8 with the herb-wise mentor).
- Press H to open or close the pouch. It lists the herbs. While it is open, press 1 to use a marigold or
  2 to use a dock leaf (or click the buttons) to heal yourself. It doesn't work at full health.
- Picked patches regrow after 30 seconds.
- **Medicine cats** can also heal others. Your clan's camp cats sometimes get hurt (a red mark shows
  over them). Walk up to an injured clanmate and press E: the best herb in your pouch heals them.
- Replaces the Round 1 rule that only medicine cats could gather herbs, eaten on the spot.

### R19. Mentor
- When the cat becomes an apprentice, the player chooses one of 3 mentors from its clan (the game waits):

  | Mentor | Specialty | Bonus for the rest of the game |
  | --- | --- | --- |
  | Mosswhisker | Hunter | Prey notices you less (×0.7) and scent range 45 instead of 30 |
  | Briarfang | Fighter | All moves do 25% more damage, and Bite is unlocked straight away |
  | Fernsong | Herb-wise | Pouch holds 8 herbs, and herbs heal 50% more |

- While you are an apprentice, your mentor follows you. After you choose a role, the mentor goes
  back to camp.

### R20. Homebase: the clan camp
- Your clan's camp has: the **nursery**, the **apprentices' den**, the **warriors' den**, the
  **medicine den**, the **leader's den** (under the Highrock) and the **fresh-kill pile**.
- **Resting:** press E at the entrance of your own den to sleep. Health goes back to full and the
  game skips to the next morning (07:12). Your den depends on your rank: kits use the nursery,
  apprentices the apprentices' den, warriors and deputies the warriors' den, medicine cats the
  medicine den, and leaders the leader's den. Other dens tell you which one is yours.
- **Fresh-kill pile:** starts with 3 pieces. Press E at the pile to drop prey you are carrying. If you
  carry nothing and you are hungry, E eats one piece (+25 food).
- 4 clan cats live in the camp and wander around it (R16, R18).

### Controls (Round 2)
W/S walk, A/D turn, Shift stalk, Space jump, E action, C dodge, F pounce attack, R bite, Q scent (hold),
M map, H herb pouch, 1/2 herbs (when the pouch is open), 1/2/3 orders (leader, when the pouch is closed), Esc stop fishing.
