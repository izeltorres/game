spec.md

# spec: warrior cats inspired themed game

Based on `problem.md` (Initial requirements R1–R5, Round 1 requirements R6–R11, Round 2 requirements R12–R20, Round 3 requirements R21–R29, Round 4 requirements R30–R46 (there is no R33 or R34) and Round 5 requirements R47–R57).

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

## Round 3

### R21. Title screen, name and patterns
- The game is called **Cat Clans** (page title, title screen, README).
- The start screen looks like a proper title screen: a big "Cat Clans" title over the 3D forest,
  which slowly circles the camp in the background, with the cat maker on a clear panel.
- The preview cat looks more like a cat: shorter, thicker legs with paws, a fuller body and chest,
  a muzzle, and a soft, curved tail.
- 7 fur patterns, all drawn on the 3D cat and moving with it:

  | Pattern | What it looks like |
  | --- | --- |
  | Solid | One colour |
  | Tabby | Dark stripes over the back and head, and rings on the tail |
  | Patches | White patches |
  | Tuxedo | White chest, white paws and white muzzle |
  | Calico | Patches of ginger and black, and a white belly |
  | Spotted | Dark spots on the back and sides |
  | Colorpoint | Light body with dark face, ears, paws and tail |

### R22. Less text during play
- The line with your cat's name, rank and clan is removed from the game screen. The task, clock,
  territory line and bars stay.

### R23. Solid rocks and trees
- No cat can walk through trees, rocks (the camp stones and the Highrock) or hut walls. This
  includes you, your camp cats, mentors, clanmates, rogues and other clans' cats.
- Other cats walk around obstacles that are in their way.

### R24. More realistic grass
- Grass is made of thin, tapered blades that bend in several segments, growing in clumps, darker
  at the root and lighter at the tip.
- There is much more of it (8000+ blades around the cat). It sways in the wind in slow waves, and
  its colour depends on the territory.
- No grass grows in water or on the bare ground of a camp.
- The swaying is done on the graphics card so the extra grass doesn't slow the game down.

### R25. Enter the huts
- Every camp's dens are huts big enough to walk into: a bramble dome (radius 3) with a doorway
  facing the middle of the camp, and a mossy nest inside.
- The walls are solid; you can only go in and out through the doorway.
- When you are inside a hut, the camera comes in with you and stays inside the walls.
- Press E inside your own den to rest (same rules as R20). Inside another den, E tells you which den is yours.
- The camp is larger so the huts fit: huts stand about 9 units from the middle of the camp, the
  Highrock is behind the leader's den, and the stone ring is 14 units out.

### R26. Main menu (Esc)
- The "New cat" button is gone. There is no menu button on screen.
- Press **Esc** to open the main menu. It pauses the game and has **Resume**, **Restart** (the same
  cat and clan start over as a kit) and **New cat** (back to the cat maker).
- Esc or Resume closes it. While fishing, Esc still stops fishing and doesn't open the menu.

### R27. Dropping fresh-kill
- Press **G** to drop the prey you are carrying. It lands on the ground in front of you, and you can
  pick it up again with E. Dropping it at the fresh-kill pile adds it to the pile. E at the pile
  still works as before.
- Animations:
  - While carrying, the prey (mouse, squirrel or fish) is shown in the cat's mouth, and the head is
    held a little higher.
  - When dropping, the cat dips its head and the prey falls to the ground.

### R28. A real cat's tail
- The tail is made of 8 segments so it can curve, and it moves with the cat's mood:

  | When the cat is… | The tail… |
  | --- | --- |
  | Standing still | Held up with a gentle curve, slowly swishing |
  | Walking | Held high with a curled, question-mark tip |
  | Running | Streams out straight behind |
  | Stalking | Held low near the ground, tip twitching |
  | Fighting | Puffed up and lashing fast from side to side |
  | Climbing | Hangs down for balance |
  | Swimming | Floats out straight behind |
  | Hurt and lying down | Lies limp |

- When turning, the tail swings to the outside of the turn.
- The same tail behaviour is used for every cat.

### R29. Cats living in other camps
- Each other clan's camp has 4 cats living in it. They wander around their camp.
- They defend their camp: if you are on their territory and come within 14 units, they attack,
  just like patrols (R16). If you leave their territory they stop and go back.
- A beaten camp cat runs home and recovers after 30 seconds. After choosing a role, beating one
  counts as a fight won.

### Controls (Round 3)
Esc opens the main menu (or stops fishing). G drops carried prey. All other keys are as in Round 2.

## Round 4

Round 4 replaces how the cat moves up the ranks (R42, R43, R45). The kit tasks from the start of
this spec (squirrel, fishing, rogue) become the apprentice's mentor tasks, and the role choice
from R9 changes as described in R43.

### R45, R42, R41. Growing up: kit → apprentice
- A **kit** stays in camp: it can't walk past the camp boundary (12 units from the middle, inside
  the stone ring). A message says kits must stay in camp (R42).
- Beetles and mice scurry around inside the camp for kits. A kit must catch **5 beetles and 3 mice**.
  Each catch counts toward the mix and makes the kit a little bigger (from size 0.5 to 0.75).
- When the mix is complete, the kit becomes an **apprentice**: its name ends in **-paw** (R41) and it
  chooses a mentor (the 3 mentors from R19).

### R44, R45. The mentor teaches the apprentice
- The mentor gives the apprentice its tasks, one at a time, in order. Each task is announced by the
  mentor (the message starts with the mentor's name), and the HUD shows "<Mentor>'s task: …".
- The mentor **leads** the apprentice to each task: it walks ahead toward the place, and waits for
  the apprentice if it falls more than 10 units behind.
- The tasks:
  1. **Border patrol:** visit 3 border markers in your territory, in order.
  2. **Hunt a squirrel:** stalk and catch a squirrel.
  3. **Catch fish:** catch 3 fish at the water in your territory (R35).
  4. **Chase off a rogue:** beat the rogue (as before).
- The mentor's specialty bonus (R19) still applies.
- After the last task, the apprentice chooses its path (R43).

### R43, R40. Choosing a path
- At the end of the apprenticeship the player chooses only **Warrior** or **Medicine cat**. Deputy
  is no longer a choice; it is earned (R45).
- **Warrior name (R40):** when the apprenticeship ends, the clan leader gives the cat a random
  warrior name ending (e.g. Stormclaw) in a short ceremony message. Medicine cats get one too.
- Medicine cats work as before (heal hurt clanmates, never become leader).

### R45, R36, R39. Warrior → deputy → leader
- **Warrior → deputy:** catch 5 prey, win 3 fights, and lead 1 border patrol (visit the 3 border
  markers). Then the cat becomes **deputy**.
- **Deputy → leader:** catch 3 more prey, win 2 more fights, and **train an apprentice** (R36, R39).
  Then the cat becomes **leader**, and its name ends in **-star**.
- Counts start from zero at each promotion. Beetles don't count as prey.
- **Training an apprentice:** when the cat becomes deputy, one of the camp's kits becomes its
  apprentice (its name changes to -paw and it grows) and follows the deputy. Three lessons, in order:
  1. **Hunting lesson:** the apprentice catches 3 prey near you (within 15 units).
  2. **Battle practice:** face your apprentice and press E to land 3 practice hits (no harm done).
  3. **Border patrol:** visit the 3 border markers with your apprentice.

  After the lessons, the apprentice becomes a warrior and goes back to camp.

### R37. Nine lives
- A leader has **9 lives**. When a leader's health reaches 0, it loses one life and gets up on the
  spot with full health (2 seconds where nothing can hurt it). The HUD shows the lives left.
- Losing the 9th life is **game over**: the main menu opens with "You have lost all nine lives" and
  only Restart and New cat.
- Cats that are not leaders faint as before.

### R38. Hunger
- Unchanged and still required: when food is at zero, health goes down (2 per second).

### R31. More kits
- 4 kits live in your camp. They play: they chase each other, pounce on leaves, tumble about and
  wander, but never leave camp.
- Each other clan's camp has 2 kits. When you come near (within 15 units) on their territory, they
  run and hide in their nursery until you leave.

### R30. Weather
- Weather changes about every 4 minutes. It can be **clear, rain, fog, wind or a thunderstorm**.
  The HUD shows it next to the clock.

  | Weather | Prey | Scent (R14) | Other |
  | --- | --- | --- | --- |
  | Clear | All prey out | Normal | |
  | Rain | Only half the prey comes out | Shorter (×0.6) | Rain falls |
  | Fog | All prey out, but they notice you less (×0.6) | Normal | Thick fog, you see less |
  | Wind | All prey out | Further (×1.5) | Grass and trees sway more |
  | Thunderstorm | All prey hide | Much shorter (×0.4) | Heavy rain, lightning flashes; other clans' patrols stay in their camps |

### R32. Look up and down
- Click the game to capture the mouse. Moving the mouse up and down tilts the camera, and moving it
  left and right turns the cat.
- The tilt is limited so the camera never goes under the ground.
- Esc (or anything else that releases the mouse) opens the main menu.

### R35. More realistic fish and fishing
- Fish have a proper shape: a tapered body, a tail fin, a back fin and side fins, and speckled colours.
- Fishing is done in 3D, replacing the gold-zone bar:
  - Press E by the water. The cat crouches facing the water, and fish swim about under the surface.
  - Press E when a fish is under your paw (a ripple marks the spot) to catch it.
  - A swipe that misses splashes, and nearby fish dart away.
  - RiverClan's paw reaches further (easier fishing, R6).
  - Esc stops fishing.

### R46. More animations
- **Idle life:**
  - Breathing, blinking and ear twitches.
  - An idle cat looks around.
  - It sits down after 5 seconds of standing still, and lies down after 15.
- **Better moves:**
  - A leap pose when jumping or pouncing.
  - Running is a gallop (front legs together, back legs together), different from the walk.
  - Paddling legs when swimming.
- **Eating and hurt:**
  - The cat lowers its head and chews when it eats.
  - It limps when its health is low (under 30).
  - It flinches when it is hit.

## Round 5

### R47. Prey of different sizes, and the big hunt
- New prey, from small to big. Bigger prey gives more food, notices you from further away and runs faster:

  | Prey | Size | Food | Where |
  | --- | --- | --- | --- |
  | Beetle | tiny | 8 | camp (kits) and territory |
  | Mouse | small | 20 | camp (kits) and territory |
  | Vole | small | 18 | territory |
  | Sparrow | small | 15 | territory |
  | Squirrel | medium | 40 | territory |
  | Rabbit | medium | 45 | territory |
  | Hare | big | 70 | only on a big hunt |

- All of them except beetles count as prey toward promotions.
- **Big hunt (leader order 4):**
  - A hare appears in your territory, and your 3 clanmates go to surround it, one on each side, leaving
    the side toward you open.
  - While it is surrounded (all 3 clanmates within 5 units of it), it can't run away, so you can walk up
    and catch it.
  - A hare that isn't surrounded runs like other prey.
  - Catching it puts 4 pieces on the fresh-kill pile.

### R48. Gatherings
- About every 15 minutes the leader is told that tonight is the full-moon **Gathering** at the
  Great Oak, in the middle of the world where the four territories meet. The call stays open for 5 minutes.
- The Great Oak is a giant tree in a clearing, and there is a **truce** in the clearing: within 12 units, no cat attacks.
- When the leader arrives, the other three clans' leaders are there and each shares news.
- Then the player gives a speech (the game waits):
  - **Speak of peace:** every rivalry −15.
  - **Boast of your clan's strength:** every rivalry +10, but your clanmates get bolder (your fresh-kill pile +2).
  - **Warn one clan off your border:** that clan +15, the others −5.

### R49. Deputy missions
- A deputy is sent on missions outside the territory, one at a time. A new mission comes 30 seconds
  after the last one is done. They come in this order and then repeat:
  1. **Carry a message** to another clan's camp. That clan's cats let you pass while you carry it.
     Reaching their camp delivers it.
  2. **Recover stolen prey:** a rival has taken a rabbit. It lies in their territory: pick it up with E
     and bring it to your fresh-kill pile (+1 piece). Their cats attack as usual, and their rivalry rises by 5.
  3. **Find a lost kit:** one of your kits has wandered into another clan's land. Find it and press E;
     it follows you, and bringing it into camp completes the mission.
- **Deputy → leader now also needs 1 mission** (with 3 prey, 2 fights and a trained apprentice).

### R50. A leader's big decisions
- About every 5 minutes something happens to the clan, and the leader chooses what to do (the game waits).
  Each choice changes things for the whole clan:

  | Event | Choices |
  | --- | --- |
  | Sickness in camp | Send cats out for herbs (herb store +2, fresh-kill −1) · Rest and wait (2 camp cats get hurt) |
  | A stray kit at the border | Take it in (a new kit in camp, fresh-kill −1) · Send it away (nothing) |
  | A rival steals prey | Raid their camp (fresh-kill +2, that clan's rivalry +20) · Let it go (fresh-kill −2) · Complain at the Gathering (that clan's rivalry −5) |
  | Prey is scarce | Send extra hunting patrols (fresh-kill +2, a camp cat gets hurt) · Share what we have (nothing changes) |

### R51. Prey can't swim
- No prey ever goes into the water: frightened prey runs along the bank instead, and prey never appears in water.

### R52. Every camp has a medicine cat
- Each clan's camp has a medicine cat who lives by the medicine den.
- Yours (Thymeleaf) heals you to full health when you press E next to them (once a minute).
- Thymeleaf treats a hurt camp cat once it has been hurt for 30 seconds, using an herb from the herb
  store if there is one.
- If you choose the medicine cat path, Thymeleaf is your senior and gives you your medicine tasks (R57).

### R53. Click to pick herbs
- A small aiming dot sits in the middle of the screen. An herb you aim at (within 3.5 units) glows,
  and clicking picks it into your pouch. This works whether or not the mouse is captured (R32).

### R54. Rivalries
- Each other clan has a **rivalry** with yours, from 0 to 100. It starts at 30 and is shown on the map.
- **Rises:**
  - +5 for each of their cats you beat.
  - +1 for every 10 seconds you spend in their territory.
  - +5 when you take back stolen prey.
  - Decisions (R50).
- **Falls:** Gathering speeches and decisions.
- **Effects:**
  - **Below 20 (friendly):** their cats warn you off instead of attacking.
  - **20 to 69:** as before.
  - **70 and above (hostile):** their cats see you from 20 units away. Every 4 minutes, 2 of their cats
    raid your camp: they take a piece from the fresh-kill pile and fight you if you are near.

### R55. A bigger play screen
- The game fills the whole browser window and adjusts when the window changes size.
- The list of controls moves into the main menu (Esc).

### R56. Easier hunting for kits
- Prey in camp is slower (×0.6) and less wary (it notices a kit at half the usual distance).

### R57. More for medicine cats
- Medicine cats have ranks: **medicine cat apprentice** → **medicine cat** → **senior medicine cat**.
  Choosing the medicine path (R43) starts you as a medicine cat apprentice.
- The medicine den has a **herb store**. Inside the medicine den, press E to move the herbs from
  your pouch into it.
- Tasks, given by Thymeleaf:
  - **Herb collecting quests:** collect a set of herbs (e.g. 3 marigold and 2 dock) and put them in the store.
  - **Treat clanmates:** heal hurt camp cats.
  - **Keep the store stocked.**
- **Apprentice → medicine cat:** 1 collecting quest and 2 clanmates treated.
- **Medicine cat → senior medicine cat:** 1 more collecting quest, 3 more clanmates treated, and 6
  herbs in the store.
- Medicine cats still never become leader.

### Controls (Round 5)
4: big hunt (leader). Click: pick the herb you aim at. All other keys are as in Round 4; the
controls list is in the Esc menu.
