// Forest Clans - game logic.
// This file only holds the rules of the game (no drawing and no web page code),
// so the tests can run it directly. render3d.js draws it and script.js connects it to the page.
//
// The world is 3D: x and z are the ground, y is up. One unit is about one cat length.
// player.heading is the direction the cat faces: forward = (sin(heading), cos(heading)).

// ======================================================
// Settings
// ======================================================
const WORLD_HALF = 100;          // the forest goes from -100 to 100 on x and z
const CAMP = { x: 0, z: 0 };     // the clan camp, in the middle
const RIVER_X0 = 30;             // the river runs north-south between these x values (task 2)
const RIVER_X1 = 36;
const ROGUE_HOME = { x: -30, z: 45 };  // where the first rogue waits (task 3)
const ROGUE_SPAWNS = [{ x: -45, z: -40 }, { x: 15, z: 60 }, { x: -60, z: 10 }, { x: 10, z: -55 }];
const ROGUE_HP = 60;
const ROGUE_RESPAWN = 20;        // seconds until a new rogue shows up (R9)

const CAT_R = 0.4;               // how wide the cat is, for bumping into trees
const WALK_SPEED = 4;            // units per second
const TURN_SPEED = 2.6;          // radians per second
const RUN_SPEED = 1.8;           // running is this many times faster than walking (R7)
const DOUBLE_TAP = 0.3;          // seconds between two taps of forward to start running (R7)
const GRAVITY = 18;
const JUMP_SPEED = 6;

const FOOD_PER_UNIT = 0.2;       // food used per unit walked; running uses twice as much (R8)
const STARVE_DAMAGE = 2;         // health lost per second when food is empty (R8)
const PREY_FOOD = { squirrel: 40, fish: 30, freshKill: 10 };
const HERB_HEAL = 25;            // health a medicine cat gets from an herb (R9)
const HERB_REGROW = 30;

const DAY_LENGTH = 3600;         // one full day and night lasts one real hour (R10)
const START_TIME = 0.3;          // games start in the morning (fraction of a day)

// Clan attributes (R6)
const CLANS = {
  ThunderClan: { about: "Forest hunters", perk: "Best tree climbers; prey notices you less", color: "#c8553d",
                 speed: 1, run: 1, stealth: 0.6, fishZone: 1, damage: 1, swim: 0.45, climbSpeed: 3, climbHeight: 6 },
  RiverClan:   { about: "Swimmers and fishers", perk: "Swim fast; easier fishing", color: "#3d8bc8",
                 speed: 1, run: 1, stealth: 1, fishZone: 1.7, damage: 1, swim: 1.15, climbSpeed: 1, climbHeight: 2 },
  WindClan:    { about: "Fast runners", perk: "Fastest walkers and runners", color: "#c8b13d",
                 speed: 1.3, run: 1.2, stealth: 1, fishZone: 1, damage: 1, swim: 0.45, climbSpeed: 1, climbHeight: 2 },
  ShadowClan:  { about: "Mysterious", perk: "Marshy pine forest; strike harder", color: "#6a4c93",
                 speed: 1, run: 1, stealth: 1, fishZone: 1, damage: 1.6, swim: 0.45, climbSpeed: 1, climbHeight: 2 },
};

const FURS = { Ginger: "#d9822b", Grey: "#8a8d91", Black: "#2e2b2b", White: "#efebe2", Brown: "#7a4f2a", Cream: "#e3c896" };
const EYES = { Green: "#4caf50", Amber: "#f0a020", Blue: "#4aa3df", Yellow: "#e8d33f" };
const PATTERNS = ["Solid", "Tabby", "Patches"];
const WARRIOR_SUFFIXES = ["heart", "claw", "pelt", "storm", "whisker", "fang", "tail", "stripe"];

// Each level: rank name, name ending, and how big the cat is
const STAGES = [
  { rank: "Kit",        suffix: "kit", size: 0.55 },  // level 1: hunt a squirrel
  { rank: "Kit",        suffix: "kit", size: 0.72 },  // level 2: go fishing (cat has grown)
  { rank: "Apprentice", suffix: "paw", size: 0.86 },  // level 3: fight a rogue
  { rank: null,         suffix: null,  size: 1 },     // a full clan cat: the rank is the chosen role
];

// Roles (R9). Warriors and deputies become leader after enough hunting and fighting.
const ROLES = ["Warrior", "Deputy", "Medicine cat"];
const LEADER_NEEDS = { Warrior: { hunts: 5, fights: 3 }, Deputy: { hunts: 3, fights: 2 } };
const ORDERS = { Digit1: "follow", Digit2: "hunt", Digit3: "guard" };

const HERB_SPOTS = [{ x: 12, z: -18 }, { x: -22, z: -8 }, { x: 20, z: 25 }, { x: -15, z: 28 }, { x: 5, z: 40 }];

// ======================================================
// Game state
// ======================================================
const look = { fur: FURS.Ginger, eyes: EYES.Green, pattern: "Solid" };
let catName = "Fire";
let clanName = "ThunderClan";
let warriorSuffix = "heart";
let playing = false;
let stage = 0;
let role = null;            // null until chosen, then "Warrior" | "Deputy" | "Medicine cat" | "Leader"
let choosingRole = false;   // true while the role buttons are shown (the game waits)
let time = 0;               // seconds since the page opened
let dayTime = 0;            // seconds since midnight of the current day (R10)
let day = 1;
let order = "follow";       // what a leader's clanmates are doing
let lastForwardTap = -10;   // when forward was last tapped (R7)
let rogueSpawn = 0;

const player = {};
const squirrel = {};
const rogue = {};
const fishing = {};
const stats = { hunts: 0, fights: 0 };   // counted after choosing a role (R9)
let trees = [];
let herbs = [];
let clanmates = [];

// script.js fills these in so the logic can talk to the page
const hooks = { message: null, afterUpdate: null };

function say(text, seconds) {
  if (hooks.message) hooks.message(text, seconds);
}

function resetGame() {
  stage = 0;
  role = null;
  choosingRole = false;
  order = "follow";
  lastForwardTap = -10;
  rogueSpawn = 0;
  dayTime = START_TIME * DAY_LENGTH;
  day = 1;
  Object.assign(stats, { hunts: 0, fights: 0 });
  Object.assign(player, {
    x: CAMP.x, z: CAMP.z + 3, y: 0, vy: 0, heading: 0, onGround: true, crouching: false, moving: false,
    running: false, climbing: null, walk: 0, hp: 100, food: 100, attackTimer: 0, attackCooldown: 0, hurtTimer: 0,
  });
  // squirrel.state: idle | hopping | fleeing | hidden | caught
  Object.assign(squirrel, { x: 4, z: 14, state: "idle", timer: 1, dirX: 0, dirZ: 1, hop: 0, respawn: 0 });
  // rogue.state: waiting | fighting | fleeing | gone
  Object.assign(rogue, { x: ROGUE_HOME.x, z: ROGUE_HOME.z, hp: ROGUE_HP, heading: Math.PI, walk: 0, windup: 0,
                         cooldown: 0, hurtTimer: 0, fleeTimer: 0, respawn: 0, state: "waiting" });
  Object.assign(fishing, { active: false, marker: 0, dir: 1, zone: 0.5, catches: 0, flash: 0, flashGood: false });
  trees = buildTrees(biome());
  herbs = HERB_SPOTS.map((h) => ({ x: h.x, z: h.z, ready: true, regrow: 0 }));
  clanmates = [];
}

// ======================================================
// Keyboard (script.js fills these from the real keyboard)
// ======================================================
const keys = {};     // keys held down right now
const pressed = {};  // keys pressed this frame

function isDown(...codes) {
  return codes.some((c) => keys[c]);
}
function wasPressed(...codes) {
  return codes.some((c) => pressed[c]);
}

// ======================================================
// Helpers
// ======================================================
function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

// Random numbers that are the same every time (so the forest looks the same)
function makeRandom(seed) {
  return function () {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Is a point in front of something facing `heading`, and within `range`?
function inFront(from, heading, target, range, cone) {
  const dx = target.x - from.x;
  const dz = target.z - from.z;
  const d = Math.hypot(dx, dz);
  if (d > range) return false;
  if (d < 0.001) return true;
  return (dx * Math.sin(heading) + dz * Math.cos(heading)) / d > cone;
}

function catSize() {
  return STAGES[stage].size;
}

function rankName() {
  if (stage < 3) return STAGES[stage].rank;
  return role || "Apprentice";
}

function fullName() {
  if (stage < 3) return catName + STAGES[stage].suffix;
  if (role === "Leader") return catName + "star";
  return catName + warriorSuffix;
}

function inRiver(x) {
  return x > RIVER_X0 && x < RIVER_X1;
}

function nearRiver(x) {
  return x > RIVER_X0 - 3 && x < RIVER_X1 + 3;
}

function eat(amount) {
  player.food = Math.min(100, player.food + amount);
}

// ShadowClan lives in a marshy pine forest; the others in a leafy forest (R6)
function biome() {
  return clanName === "ShadowClan" ? "marsh" : "forest";
}

// ======================================================
// The forest (rebuilt for each new game, because it depends on the clan)
// ======================================================
function buildTrees(kindOfPlace) {
  const random = makeRandom(42);
  const list = [];
  const keepClear = [CAMP, ROGUE_HOME, ...ROGUE_SPAWNS, ...HERB_SPOTS];
  for (let i = 0; i < 260 && list.length < 150; i++) {
    const x = -WORLD_HALF + 5 + random() * (WORLD_HALF * 2 - 10);
    const z = -WORLD_HALF + 5 + random() * (WORLD_HALF * 2 - 10);
    const h = 9 + random() * 6;
    const r = 0.45 + random() * 0.3;
    const phase = random() * 6;
    if (x > RIVER_X0 - 4 && x < RIVER_X1 + 4) continue;           // not in or next to the river
    if (Math.hypot(x - CAMP.x, z - CAMP.z) < 16) continue;         // the camp is a clearing
    if (keepClear.some((p) => Math.hypot(x - p.x, z - p.z) < 5)) continue;
    list.push({ x, z, r, h, kind: kindOfPlace === "marsh" ? "pine" : "oak", phase });
  }
  return list;
}

// Push something with radius `radius` out of every tree trunk
function pushOutOfTrees(body, radius) {
  for (const t of trees) {
    const dx = body.x - t.x;
    const dz = body.z - t.z;
    const d = Math.hypot(dx, dz);
    const min = t.r + radius;
    if (d < min && d > 0.0001) {
      body.x = t.x + (dx / d) * min;
      body.z = t.z + (dz / d) * min;
    }
  }
}

// The tree trunk the cat is touching and facing, if any
function trunkInFront() {
  for (const t of trees) {
    const d = distance(player, t);
    if (d < t.r + CAT_R + 0.1 && inFront(player, player.heading, t, 99, 0.7)) return t;
  }
  return null;
}

// ======================================================
// Update (game logic) - called about 60 times a second
// ======================================================
function update(dt) {
  time += dt;
  if (playing && !choosingRole) {
    updateDay(dt);
    if (fishing.active) updateFishing(dt);
    else updatePlayer(dt);
    updateFood(dt);
    if (stage === 0 || stage === 3) updateSquirrel(dt);
    if (stage >= 2) updateRogue(dt);
    if (stage === 3) {
      updateHerbs(dt);
      updateClanmates(dt);
    }
  }
  if (hooks.afterUpdate) hooks.afterUpdate();
  for (const k in pressed) delete pressed[k];
}

function updatePlayer(dt) {
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);

  if (stage === 3 && role === "Leader") {
    for (const code in ORDERS) if (pressed[code]) giveOrder(ORDERS[code]);
  }

  if (player.climbing) {
    updateClimbing(dt);
    return;
  }

  const clan = CLANS[clanName];
  const forwardHeld = isDown("KeyW", "ArrowUp");
  const back = isDown("KeyS", "ArrowDown");

  // R7: two quick taps of forward start a run, which lasts while forward is held
  if (wasPressed("KeyW", "ArrowUp")) {
    if (time - lastForwardTap < DOUBLE_TAP) player.running = true;
    lastForwardTap = time;
  }
  if (!forwardHeld) player.running = false;

  // Turning
  const turn = (isDown("KeyA", "ArrowLeft") ? 1 : 0) - (isDown("KeyD", "ArrowRight") ? 1 : 0);
  player.heading += turn * TURN_SPEED * dt;

  player.crouching = player.onGround && isDown("ShiftLeft", "ShiftRight");

  let speed = WALK_SPEED * clan.speed;
  if (player.running) speed *= RUN_SPEED * clan.run;
  if (player.crouching) speed *= 0.35;
  if (inRiver(player.x)) speed *= clan.swim;   // swimming (R6)

  const dir = (forwardHeld ? 1 : 0) - (back ? 1 : 0);
  player.moving = dir !== 0;
  const oldX = player.x;
  const oldZ = player.z;

  // Walking forward into a trunk starts climbing it (R6)
  if (dir > 0 && player.onGround && trunkInFront()) {
    player.climbing = trunkInFront();
    player.running = false;
    return;
  }

  const step = dir * speed * dt * (dir < 0 ? 0.6 : 1);
  player.x = clamp(player.x + Math.sin(player.heading) * step, -WORLD_HALF, WORLD_HALF);
  player.z = clamp(player.z + Math.cos(player.heading) * step, -WORLD_HALF, WORLD_HALF);
  pushOutOfTrees(player, CAT_R);

  // R8: moving uses food, running twice as much per distance
  const moved = Math.hypot(player.x - oldX, player.z - oldZ);
  player.food = Math.max(0, player.food - moved * FOOD_PER_UNIT * (player.running ? 2 : 1));
  if (player.moving) player.walk += moved * 3 / catSize();

  // Jumping and falling
  if (wasPressed("Space") && player.onGround && !player.crouching) {
    player.vy = JUMP_SPEED;
    player.onGround = false;
  }
  updateFalling(dt);

  if (pressed.KeyE) doAction();
}

function updateFalling(dt) {
  if (player.onGround) return;
  player.vy -= GRAVITY * dt;
  player.y += player.vy * dt;
  if (player.y <= 0) {
    player.y = 0;
    player.vy = 0;
    player.onGround = true;
  }
}

// R6: every clan can climb a little; ThunderClan climbs faster and much higher
function updateClimbing(dt) {
  const clan = CLANS[clanName];
  const tree = player.climbing;
  player.moving = false;
  player.running = false;
  // Face the trunk
  player.heading = Math.atan2(tree.x - player.x, tree.z - player.z);

  if (wasPressed("Space")) {
    // Jump off, away from the trunk
    player.climbing = null;
    player.x -= Math.sin(player.heading) * 0.6;
    player.z -= Math.cos(player.heading) * 0.6;
    player.vy = 2;
    player.onGround = false;
    return;
  }
  const up = (isDown("KeyW", "ArrowUp") ? 1 : 0) - (isDown("KeyS", "ArrowDown") ? 1 : 0);
  const maxHeight = Math.min(clan.climbHeight, tree.h - 2);
  player.y = clamp(player.y + up * clan.climbSpeed * dt, 0, maxHeight);
  if (up !== 0) player.walk += dt * 8;
  if (player.y <= 0 && up < 0) {
    player.climbing = null;
    player.onGround = true;
  }
}

// R8: no food slowly hurts; zero health means fainting
function updateFood(dt) {
  if (player.food <= 0) {
    player.hp -= STARVE_DAMAGE * dt;
    if (player.hp <= 0) faint("You are starving and faint... Your clanmates carry you back to camp. Eat something!");
  }
}

function faint(text) {
  say(text, 3);
  Object.assign(player, {
    x: CAMP.x, z: CAMP.z + 1, y: 0, vy: 0, onGround: true, climbing: null, running: false,
    hp: 100, food: Math.max(player.food, 50), hurtTimer: 0,
  });
  fishing.active = false;
  if (rogue.state === "fighting") {
    const home = stage === 2 ? ROGUE_HOME : ROGUE_SPAWNS[rogueSpawn % ROGUE_SPAWNS.length];
    Object.assign(rogue, { x: home.x, z: home.z, hp: ROGUE_HP, windup: 0, cooldown: 0, state: "waiting" });
  }
}

// E does something different at each level
function doAction() {
  if (stage === 0) tryPounce();
  else if (stage === 1) tryFishing();
  else if (stage === 2) trySwipe();
  else if (nearRiver(player.x)) tryFishing();
  else if (role === "Medicine cat" && tryHerb()) return;
  else if (squirrelVisible() && distance(player, squirrel) < 3) tryPounce();
  else trySwipe();
}

// ---------- Hunting a squirrel (level 1, and more prey later) ----------
function squirrelVisible() {
  return squirrel.state === "idle" || squirrel.state === "hopping";
}

function tryPounce() {
  player.attackTimer = 0.3;
  const visible = squirrelVisible();

  if (visible && inFront(player, player.heading, squirrel, 2.2, 0.5)) {
    catchSquirrel();
    return;
  }
  // Missed: leap forward a little
  if (player.onGround) {
    player.vy = 3.5;
    player.onGround = false;
    player.x += Math.sin(player.heading) * 0.5;
    player.z += Math.cos(player.heading) * 0.5;
  }
  if (visible && distance(player, squirrel) < 6) scareSquirrel();
}

function catchSquirrel() {
  eat(PREY_FOOD.squirrel);
  if (stage === 0) {
    squirrel.state = "caught";
    advanceStage();
  } else {
    squirrel.state = "hidden";
    squirrel.respawn = 4;
    stats.hunts++;
    say(`You caught a squirrel! (prey caught: ${stats.hunts})`, 2);
    checkLeader();
  }
}

function scareSquirrel() {
  squirrel.state = "fleeing";
  const dx = squirrel.x - player.x;
  const dz = squirrel.z - player.z;
  const d = Math.hypot(dx, dz) || 1;
  squirrel.dirX = dx / d;
  squirrel.dirZ = dz / d;
  if (stage === 0) say("The squirrel heard you! Hold Shift to stalk slowly.", 2);
}

function updateSquirrel(dt) {
  const s = squirrel;
  if (s.state === "caught") return;

  if (s.state === "hidden") {
    s.respawn -= dt;
    if (s.respawn <= 0) {
      // Come back somewhere 12-20 units from the player, west of the river
      const angle = Math.random() * Math.PI * 2;
      const d = 12 + Math.random() * 8;
      s.x = clamp(player.x + Math.sin(angle) * d, -WORLD_HALF + 5, RIVER_X0 - 5);
      s.z = clamp(player.z + Math.cos(angle) * d, -WORLD_HALF + 5, WORLD_HALF - 5);
      pushOutOfTrees(s, 0.3);
      s.state = "idle";
      s.timer = 1;
    }
    return;
  }

  if (s.state === "fleeing") {
    s.x += s.dirX * 8 * dt;
    s.z += s.dirZ * 8 * dt;
    s.hop += dt * 14;
    if (distance(s, player) > 25 || Math.abs(s.x) > WORLD_HALF || Math.abs(s.z) > WORLD_HALF) {
      s.state = "hidden";
      s.respawn = 2.5;
    }
    return;
  }

  // Notice the player if they get too close without stalking
  const radius = (player.crouching ? 1.2 : 7) * CLANS[clanName].stealth;
  if (distance(player, s) < radius) {
    scareSquirrel();
    return;
  }

  // Wander: sit still, then hop a little
  s.timer -= dt;
  if (s.timer <= 0) {
    if (s.state === "idle") {
      s.state = "hopping";
      const angle = Math.random() * Math.PI * 2;
      s.dirX = Math.sin(angle);
      s.dirZ = Math.cos(angle);
      s.timer = 0.6 + Math.random() * 0.8;
    } else {
      s.state = "idle";
      s.timer = 1 + Math.random() * 2;
    }
  }
  if (s.state === "hopping") {
    s.x = clamp(s.x + s.dirX * 1.5 * dt, -WORLD_HALF + 5, RIVER_X0 - 5);
    s.z = clamp(s.z + s.dirZ * 1.5 * dt, -WORLD_HALF + 5, WORLD_HALF - 5);
    pushOutOfTrees(s, 0.3);
    s.hop += dt * 10;
  }
}

// ---------- Fishing (level 2, and more fish later) ----------
function tryFishing() {
  if (!nearRiver(player.x)) {
    say("Find the river to the east first.", 1.5);
    return;
  }
  Object.assign(fishing, { active: true, marker: 0, dir: 1, catches: 0, flash: 0 });
  newFishZone();
  player.moving = false;
  player.running = false;
  player.crouching = true;
  say(stage === 1 ? "Press E when the fish is in the gold zone! Catch 3." : "Press E when the fish is in the gold zone!", 2);
}

function fishZoneWidth() {
  return 0.12 * CLANS[clanName].fishZone;
}

function newFishZone() {
  const half = fishZoneWidth() / 2;
  fishing.zone = half + Math.random() * (1 - 2 * half);
}

function stopFishing() {
  fishing.active = false;
  player.crouching = false;
}

function updateFishing(dt) {
  if (pressed.Escape) {
    stopFishing();
    return;
  }
  fishing.marker += fishing.dir * dt * 0.9;
  if (fishing.marker > 1) { fishing.marker = 1; fishing.dir = -1; }
  if (fishing.marker < 0) { fishing.marker = 0; fishing.dir = 1; }
  fishing.flash = Math.max(0, fishing.flash - dt);

  if (pressed.KeyE) {
    fishing.flash = 0.4;
    fishing.flashGood = Math.abs(fishing.marker - fishing.zone) < fishZoneWidth() / 2;
    if (!fishing.flashGood) return;
    fishing.catches++;
    eat(PREY_FOOD.fish);
    if (stage === 1) {
      if (fishing.catches >= 3) {
        stopFishing();
        advanceStage();
      } else {
        newFishZone();
      }
    } else {
      // After choosing a role, each fish is one more prey caught
      stopFishing();
      stats.hunts++;
      say(`You caught a fish! (prey caught: ${stats.hunts})`, 2);
      checkLeader();
    }
  }
}

// ---------- Fighting a rogue (level 3, and new rogues later) ----------
function trySwipe() {
  if (player.attackCooldown > 0) return;
  player.attackCooldown = 0.4;
  player.attackTimer = 0.25;
  if (rogue.state !== "fighting") return;

  if (inFront(player, player.heading, rogue, 2, 0.35)) {
    hurtRogue(10 * CLANS[clanName].damage);
    rogue.x += Math.sin(player.heading) * 0.8;
    rogue.z += Math.cos(player.heading) * 0.8;
  }
}

function hurtRogue(amount) {
  rogue.hp -= amount;
  rogue.hurtTimer = 0.25;
  if (rogue.hp <= 0) beatRogue();
}

function beatRogue() {
  rogue.state = "fleeing";
  rogue.fleeTimer = 3;
  if (stage === 2) {
    advanceStage();
  } else {
    stats.fights++;
    say(`The rogue runs away! (fights won: ${stats.fights})`, 2.5);
    checkLeader();
  }
}

function updateRogue(dt) {
  const r = rogue;
  r.hurtTimer = Math.max(0, r.hurtTimer - dt);

  if (r.state === "gone") {
    if (stage < 3) return;
    // R9: a new rogue comes some time after the last one ran away
    r.respawn -= dt;
    if (r.respawn <= 0) {
      rogueSpawn++;
      const spot = ROGUE_SPAWNS[rogueSpawn % ROGUE_SPAWNS.length];
      Object.assign(r, { x: spot.x, z: spot.z, hp: ROGUE_HP, windup: 0, cooldown: 0, state: "waiting" });
      say("A new rogue has been seen on your territory!", 2.5);
    }
    return;
  }

  if (r.state === "fleeing") {
    // Run straight away from camp
    const away = Math.atan2(r.x - CAMP.x, r.z - CAMP.z);
    r.heading = away;
    r.x += Math.sin(away) * 8 * dt;
    r.z += Math.cos(away) * 8 * dt;
    r.walk += dt * 16;
    r.fleeTimer -= dt;
    if (r.fleeTimer <= 0) {
      r.state = "gone";
      r.respawn = ROGUE_RESPAWN;
    }
    return;
  }

  const dist = distance(player, r);

  if (r.state === "waiting") {
    if (dist > 15) return;
    r.state = "fighting";
    say("A rogue! Chase it off your clan's territory! Face it and press E to swipe.", 2.5);
  }

  r.heading = Math.atan2(player.x - r.x, player.z - r.z);
  r.cooldown -= dt;

  if (r.windup > 0) {
    // Getting ready to strike (the player can see it crouch)
    r.windup -= dt;
    if (r.windup <= 0) {
      r.cooldown = 1.1;
      if (dist < 1.8) hurtPlayer(14);
    }
  } else if (dist > 1.3) {
    r.x += Math.sin(r.heading) * 4 * dt;
    r.z += Math.cos(r.heading) * 4 * dt;
    pushOutOfTrees(r, CAT_R);
    r.walk += dt * 8;
  } else if (r.cooldown <= 0) {
    r.windup = 0.45;
  }
}

function hurtPlayer(amount) {
  player.hp -= amount;
  player.hurtTimer = 0.3;
  player.x += Math.sin(rogue.heading) * 1;
  player.z += Math.cos(rogue.heading) * 1;
  pushOutOfTrees(player, CAT_R);
  if (player.hp <= 0) faint("You were beaten... You wake up back at camp. Rest, then try again.");
}

// ---------- Levelling up and roles (R9) ----------
function advanceStage() {
  stage++;
  player.hp = 100;
  if (stage === 1) {
    say(`You caught the squirrel! ${fullName()} is growing bigger.`, 3);
  } else if (stage === 2) {
    say(`Great fishing! You are now ${fullName()}, an apprentice of ${clanName}.`, 3.5);
  } else if (stage === 3) {
    choosingRole = true;   // script.js shows the role buttons
    player.running = false;
    for (const k in keys) keys[k] = false;
  }
}

function chooseRole(choice) {
  if (stage !== 3 || role !== null || !ROLES.includes(choice)) return;
  role = choice;
  choosingRole = false;
  warriorSuffix = WARRIOR_SUFFIXES[Math.floor(Math.random() * WARRIOR_SUFFIXES.length)];
  Object.assign(stats, { hunts: 0, fights: 0 });
  if (role === "Medicine cat") {
    say(`You are now ${fullName()}, medicine cat of ${clanName}. Find glowing herbs and press E to heal.`, 5);
  } else {
    const need = LEADER_NEEDS[role];
    say(`You are now ${fullName()}, ${role.toLowerCase()} of ${clanName}! ` +
        `Catch ${need.hunts} prey and win ${need.fights} fights to become leader.`, 5);
  }
}

function checkLeader() {
  const need = LEADER_NEEDS[role];
  if (!need || stats.hunts < need.hunts || stats.fights < need.fights) return;
  role = "Leader";
  // Three clanmates join the new leader
  const furs = [FURS.Grey, FURS.Brown, FURS.Cream];
  clanmates = furs.map((fur, i) => ({
    x: player.x + (i - 1) * 2, z: player.z - 2, heading: player.heading, walk: 0, timer: 0,
    look: { fur, eyes: EYES.Amber, pattern: PATTERNS[i] },
  }));
  giveOrder("follow");
  say(`StarClan gives you nine lives. You are now ${fullName()}, leader of ${clanName}! ` +
      `Press 1 Follow, 2 Hunt, 3 Guard.`, 6);
}

function giveOrder(newOrder) {
  if (role !== "Leader") return;
  order = newOrder;
  clanmates.forEach((c, i) => { c.timer = 12 + i * 3; });
}

// Where each clanmate wants to stand right now
function clanmateTarget(c, i) {
  if (order === "follow") {
    // In a row behind the leader
    const side = (i - 1) * 1.6;
    const back = 2.5;
    return {
      x: player.x - Math.sin(player.heading) * back + Math.cos(player.heading) * side,
      z: player.z - Math.cos(player.heading) * back - Math.sin(player.heading) * side,
    };
  }
  if (order === "guard") {
    const angle = (i / 3) * Math.PI * 2;
    return { x: CAMP.x + Math.sin(angle) * 3.5, z: CAMP.z + Math.cos(angle) * 3.5 };
  }
  // hunt: wander a loop in the forest, each cat in its own place
  const angle = time * 0.1 + i * 2;
  return { x: -20 + Math.sin(angle) * 12 + i * 4, z: Math.cos(angle) * 12 + i * 6 };
}

function updateClanmates(dt) {
  clanmates.forEach((c, i) => {
    const target = clanmateTarget(c, i);
    const d = distance(c, target);
    if (d > 0.3) {
      const speed = Math.min(d * 3, 5.5);
      c.heading = Math.atan2(target.x - c.x, target.z - c.z);
      c.x += Math.sin(c.heading) * speed * dt;
      c.z += Math.cos(c.heading) * speed * dt;
      c.walk += speed * dt * 3;
      c.moving = true;
    } else {
      c.moving = false;
    }

    c.timer -= dt;
    if (order === "hunt" && c.timer <= 0) {
      c.timer = 20;
      eat(PREY_FOOD.freshKill);
      say("A clanmate brings you fresh-kill.", 1.5);
    }
    // Following clanmates help fight a rogue
    if (order === "follow" && rogue.state === "fighting" && distance(c, rogue) < 3 && c.timer <= 0) {
      c.timer = 1;
      hurtRogue(4);
    }
  });
}

// ---------- Herbs (medicine cats, R9) ----------
function tryHerb() {
  const herb = herbs.find((h) => h.ready && distance(player, h) < 2);
  if (!herb) return false;
  herb.ready = false;
  herb.regrow = HERB_REGROW;
  player.hp = Math.min(100, player.hp + HERB_HEAL);
  say("You chew the herbs and feel better.", 2);
  return true;
}

function updateHerbs(dt) {
  for (const h of herbs) {
    if (h.ready) continue;
    h.regrow -= dt;
    if (h.regrow <= 0) h.ready = true;
  }
}

// ======================================================
// Day and night (R10)
// ======================================================
function updateDay(dt) {
  dayTime += dt;
  while (dayTime >= DAY_LENGTH) {
    dayTime -= DAY_LENGTH;
    day++;
  }
}

// 0 = midnight, 0.25 = sunrise, 0.5 = noon, 0.75 = sunset
function dayFraction() {
  return dayTime / DAY_LENGTH;
}

function dayPhase() {
  const f = dayFraction();
  if (f >= 0.22 && f < 0.29) return "sunrise";
  if (f >= 0.29 && f < 0.71) return "day";
  if (f >= 0.71 && f < 0.8) return "sunset";
  return "night";
}

// How bright it is: about 1 at noon, about 0.1 at night
function daylight() {
  const sun = Math.sin((dayFraction() - 0.25) * Math.PI * 2);
  return 0.1 + 0.9 * clamp(sun + 0.2, 0, 1);
}

function clockText() {
  const minutes = Math.floor(dayFraction() * 24 * 60);
  const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mm = String(minutes % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ======================================================
// Camera (R11): low and close, behind the cat
// ======================================================
function cameraFor() {
  const size = catSize();
  const back = 1.6 + 1.4 * size;
  const height = 0.35 + 0.7 * size;
  const fx = Math.sin(player.heading);
  const fz = Math.cos(player.heading);
  return {
    x: player.x - fx * back,
    y: player.y + height,
    z: player.z - fz * back,
    lookX: player.x + fx * 4,
    lookY: player.y + 0.45 * size,
    lookZ: player.z + fz * 4,
  };
}

// Letters only, first letter capital: "fIRE" -> "Fire"
function cleanName(raw) {
  const letters = raw.replace(/[^a-zA-Z]/g, "");
  if (!letters) return "Fire";
  return letters[0].toUpperCase() + letters.slice(1).toLowerCase();
}

resetGame();
