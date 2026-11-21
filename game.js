// Forest Clans - game logic.
// This file only holds the rules of the game (no drawing and no web page code),
// so the tests can run it directly. render3d.js draws it and script.js connects it to the page.
//
// The world is 3D: x and z are the ground, y is up. One unit is about one cat length.
// player.heading is the direction the cat faces: forward = (sin(heading), cos(heading)).
// North is +z. The world is split into 4 clan territories, one per quarter (Round 2).

// ======================================================
// Settings
// ======================================================
const WORLD_HALF = 120;          // the world goes from -120 to 120 on x and z
const CAMP_DISTANCE = 60;        // each camp is in the middle of its quarter

// Water: the big river (WindClan and RiverClan land) and a stream (ThunderClan and ShadowClan land)
const RIVER_X0 = 30;
const RIVER_X1 = 36;
const STREAM_X0 = -34;
const STREAM_X1 = -30;
const WATERS = [{ x0: RIVER_X0, x1: RIVER_X1 }, { x0: STREAM_X0, x1: STREAM_X1 }];

const ROGUE_HP = 60;
const ROGUE_RESPAWN = 20;        // seconds until a new rogue shows up (R9)
const PATROL_HP = 40;            // enemy patrol cats (R16)
const PATROL_SIGHT = 14;
const PATROL_RECOVER = 30;
const PATROL_RADIUS = 22;

const CAT_R = 0.4;               // how wide the cat is, for bumping into trees
const WALK_SPEED = 4;            // units per second
const TURN_SPEED = 2.6;          // top turning speed, radians per second
const TURN_ACCEL = 14;           // how fast turning speeds up and slows down (R12)
const CAMERA_FOLLOW = 10;        // how quickly the camera swings round behind the cat (R12)
const RUN_SPEED = 1.8;           // running is this many times faster than walking (R7)
const DOUBLE_TAP = 0.3;          // seconds between two taps of forward to start running (R7)
const GRAVITY = 18;
const JUMP_SPEED = 6;

// Combat moves (R17)
const SWIPE_DAMAGE = 10;
const POUNCE_DAMAGE = 25;
const POUNCE_STAGGER = 1.5;
const POUNCE_RECOVER = 1;
const BITE_DAMAGE = 18;
const BITE_COOLDOWN = 0.9;
const DODGE_TIME = 0.35;
const DODGE_SPEED = 7;
const DODGE_COOLDOWN = 1;

const FOOD_PER_UNIT = 0.2;       // food used per unit walked; running uses twice as much (R8)
const STARVE_DAMAGE = 2;         // health lost per second when food is empty (R8)
const PREY_FOOD = { beetle: 8, mouse: 20, squirrel: 40, fish: 30, freshKill: 10, pile: 25 };
const PREY_RESPAWN = 10;         // seconds until caught small prey comes back (R13)

// Small prey and the squirrel (R13): how close you can get before they notice,
// how fast they run, how far you can reach to catch them
const PREY_KINDS = {
  beetle:   { name: "beetle",   notice: 1,   stalkNotice: 0,   flee: 1.5, wander: 0.6, reach: 1.5, hideDist: 6,  hideTime: 3 },
  mouse:    { name: "mouse",    notice: 5,   stalkNotice: 0.8, flee: 6,   wander: 2,   reach: 1.8, hideDist: 15, hideTime: 3 },
  squirrel: { name: "squirrel", notice: 7,   stalkNotice: 1.2, flee: 8,   wander: 1.5, reach: 2.2, hideDist: 25, hideTime: 2.5 },
};

// Herbs (R18)
const HERBS = { marigold: { name: "Marigold", heal: 30 }, dock: { name: "Dock leaf", heal: 15 } };
const HERB_REGROW = 30;
const INJURY_TIME = 45;          // a camp cat gets hurt about this often

const DAY_LENGTH = 3600;         // one full day and night lasts one real hour (R10)
const START_TIME = 0.3;          // games start in the morning (fraction of a day): 07:12

// Clan attributes (R6) and territories (R15): sx/sz say which quarter of the world is theirs
const CLANS = {
  ThunderClan: { about: "Forest hunters", perk: "Best tree climbers; prey notices you less", color: "#c8553d",
                 speed: 1, run: 1, stealth: 0.6, fishZone: 1, damage: 1, swim: 0.45, climbSpeed: 3, climbHeight: 6,
                 sx: -1, sz: -1, biome: "forest" },
  RiverClan:   { about: "Swimmers and fishers", perk: "Swim fast; easier fishing", color: "#3d8bc8",
                 speed: 1, run: 1, stealth: 1, fishZone: 1.7, damage: 1, swim: 1.15, climbSpeed: 1, climbHeight: 2,
                 sx: 1, sz: -1, biome: "riverside" },
  WindClan:    { about: "Fast runners", perk: "Fastest walkers and runners", color: "#c8b13d",
                 speed: 1.3, run: 1.2, stealth: 1, fishZone: 1, damage: 1, swim: 0.45, climbSpeed: 1, climbHeight: 2,
                 sx: 1, sz: 1, biome: "moor" },
  ShadowClan:  { about: "Mysterious", perk: "Marshy pine forest; strike harder", color: "#6a4c93",
                 speed: 1, run: 1, stealth: 1, fishZone: 1, damage: 1.6, swim: 0.45, climbSpeed: 1, climbHeight: 2,
                 sx: -1, sz: 1, biome: "marsh" },
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

// Mentors (R19): they live in your camp
const MENTORS = [
  { id: "hunter",  name: "Mosswhisker", specialty: "Hunter",
    teaches: "Hunting: prey notices you less and your scent sense reaches further.", fur: "#7a4f2a", pattern: "Tabby" },
  { id: "fighter", name: "Briarfang",   specialty: "Fighter",
    teaches: "Fighting: all your moves hit 25% harder, and you can bite straight away.", fur: "#4a4440", pattern: "Solid" },
  { id: "herbs",   name: "Fernsong",    specialty: "Herb-wise",
    teaches: "Herbs: your pouch holds 8 herbs and they heal 50% more.", fur: "#e3c896", pattern: "Patches" },
];
const QUEEN = { name: "Dawnpetal", fur: "#efebe2", pattern: "Patches" };

// Places measured from a clan's camp, as (u, v): u points away from the middle of the world
// on x, v away from the middle on z, so every clan's land is laid out the same way.
// The water is at about u = -27 in every territory.
const ROGUE_HOME_SPOT = [35, 40];
const ROGUE_SPAWN_SPOTS = [[40, -35], [-45, 30], [15, 50], [45, 5]];
const OWN_HERB_SPOTS = [[12, -18, "marigold"], [-15, -8, "dock"], [20, 25, "marigold"], [-12, 28, "dock"],
                        [5, 40, "marigold"], [40, -20, "dock"]];
const OTHER_HERB_SPOTS = [[18, -22, "marigold"], [-14, 20, "dock"]];
const DEN_SPOTS = [
  { id: "nursery",     name: "nursery",          spot: [-5, 4] },
  { id: "apprentices", name: "apprentices' den", spot: [5, 4] },
  { id: "warriors",    name: "warriors' den",    spot: [6, -2] },
  { id: "medicine",    name: "medicine den",     spot: [-6, -2] },
  { id: "leader",      name: "leader's den",     spot: [0, -7] },   // under the Highrock
];
const FRESH_KILL_SPOT = [3, 0];

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
let mentor = null;          // null until chosen, then "hunter" | "fighter" | "herbs" (R19)
let choosingMentor = false; // true while the mentor buttons are shown (the game waits)
let time = 0;               // seconds since the page opened
let dayTime = 0;            // seconds since midnight of the current day (R10)
let day = 1;
let order = "follow";       // what a leader's clanmates are doing
let lastForwardTap = -10;   // when forward was last tapped (R7)
let rogueSpawn = 0;
let freshKill = 3;          // pieces on the fresh-kill pile (R20)
let injuryTimer = INJURY_TIME;
let lastMessage = "";

// Places for the player's own clan (filled in by resetGame)
const CAMP = { x: 0, z: 0 };
const ROGUE_HOME = { x: 0, z: 0 };
const ROGUE_SPAWNS = [];
const FRESH_KILL = { x: 0, z: 0 };
let dens = [];

const player = {};
const squirrel = {};
const rogue = {};
const fishing = {};
const stats = { hunts: 0, fights: 0 };   // counted after choosing a role (R9)
const ui = { map: false, pouch: false }; // the map (R15) and herb pouch (R18) are open or closed
let trees = [];
let herbs = [];
let prey = [];          // beetles and mice (R13)
let clanmates = [];     // a leader's 3 followers (R9)
let campCats = [];      // the cats living in your camp, including the mentors (R16, R19)
let patrols = [];       // other clans' patrol cats (R16)

// script.js fills these in so the logic can talk to the page
const hooks = { message: null, afterUpdate: null };

function say(text, seconds) {
  lastMessage = text;
  if (hooks.message) hooks.message(text, seconds);
}

// ======================================================
// Territories (R15, R16)
// ======================================================
function campOf(clan) {
  return { x: CLANS[clan].sx * CAMP_DISTANCE, z: CLANS[clan].sz * CAMP_DISTANCE };
}

// A place in a clan's territory, measured from its camp (see the note on spots above)
function spotFor(clan, u, v) {
  const camp = campOf(clan);
  return { x: camp.x + CLANS[clan].sx * u, z: camp.z + CLANS[clan].sz * v };
}

function territoryAt(x, z) {
  if (x < 0) return z < 0 ? "ThunderClan" : "ShadowClan";
  return z < 0 ? "RiverClan" : "WindClan";
}

function biomeAt(x, z) {
  return CLANS[territoryAt(x, z)].biome;
}

// The player's home: ShadowClan lives in the marsh (R6), WindClan on the moor, and so on
function biome() {
  return CLANS[clanName].biome;
}

// Keep something inside a clan's quarter of the world
function keepInTerritory(body, clan) {
  const c = CLANS[clan];
  const edge = WORLD_HALF - 1;
  body.x = c.sx < 0 ? clamp(body.x, -edge, -0.5) : clamp(body.x, 0.5, edge);
  body.z = c.sz < 0 ? clamp(body.z, -edge, -0.5) : clamp(body.z, 0.5, edge);
}

function resetGame() {
  stage = 0;
  role = null;
  choosingRole = false;
  mentor = null;
  choosingMentor = false;
  order = "follow";
  lastForwardTap = -10;
  rogueSpawn = 0;
  freshKill = 3;
  injuryTimer = INJURY_TIME;
  dayTime = START_TIME * DAY_LENGTH;
  day = 1;
  ui.map = false;
  ui.pouch = false;
  Object.assign(stats, { hunts: 0, fights: 0 });

  // Places for this clan
  Object.assign(CAMP, campOf(clanName));
  Object.assign(ROGUE_HOME, spotFor(clanName, ...ROGUE_HOME_SPOT));
  ROGUE_SPAWNS.length = 0;
  ROGUE_SPAWN_SPOTS.forEach(([u, v]) => ROGUE_SPAWNS.push(spotFor(clanName, u, v)));
  Object.assign(FRESH_KILL, spotFor(clanName, ...FRESH_KILL_SPOT));
  dens = DEN_SPOTS.map((d) => Object.assign({ id: d.id, name: d.name }, spotFor(clanName, ...d.spot)));

  Object.assign(player, {
    x: CAMP.x, z: CAMP.z + 3, y: 0, vy: 0, heading: 0, turnVel: 0, camHeading: 0, onGround: true,
    crouching: false, moving: false, running: false, scenting: false, climbing: null, walk: 0,
    hp: 100, food: 100, attackTimer: 0, attackCooldown: 0, hurtTimer: 0,
    dodgeTimer: 0, dodgeCooldown: 0, dodgeX: 0, dodgeZ: 0, recover: 0, biteCooldown: 0,
    carrying: null, pouch: { marigold: 0, dock: 0 },
  });
  // critter state: idle | hopping | fleeing | hidden | caught
  const s = spotFor(clanName, 4, 14);
  Object.assign(squirrel, { kind: "squirrel", x: s.x, z: s.z, state: "idle", timer: 1, dirX: 0, dirZ: 1, hop: 0,
                            respawn: 0, trail: [], trailTimer: 0 });
  // rogue.state: waiting | fighting | fleeing | gone
  Object.assign(rogue, { x: ROGUE_HOME.x, z: ROGUE_HOME.z, hp: ROGUE_HP, heading: Math.PI, walk: 0, windup: 0,
                         cooldown: 0, hurtTimer: 0, stagger: 0, fleeTimer: 0, respawn: 0, state: "waiting" });
  Object.assign(fishing, { active: false, marker: 0, dir: 1, zone: 0.5, catches: 0, flash: 0, flashGood: false });

  trees = buildTrees();
  herbs = buildHerbs();
  clanmates = [];
  prey = [];
  for (let i = 0; i < 6; i++) prey.push(makeCritter("beetle"));
  for (let i = 0; i < 4; i++) prey.push(makeCritter("mouse"));
  campCats = buildCampCats();
  patrols = buildPatrols();
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

// An angle between -PI and PI
function wrapAngle(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
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

// Which way to turn to face a target, in words
function turnHint(target) {
  const angle = wrapAngle(Math.atan2(target.x - player.x, target.z - player.z) - player.heading);
  if (Math.abs(angle) < 0.5) return "ahead";
  if (Math.abs(angle) > 2.6) return "behind you";
  return angle > 0 ? "to your left" : "to your right";
}

function moveToward(body, target, speed, dt) {
  const d = distance(body, target);
  if (d < 0.05) {
    body.moving = false;
    return;
  }
  body.heading = Math.atan2(target.x - body.x, target.z - body.z);
  const stepSize = Math.min(speed * dt, d);
  body.x += Math.sin(body.heading) * stepSize;
  body.z += Math.cos(body.heading) * stepSize;
  body.walk = (body.walk || 0) + stepSize * 3;
  body.moving = true;
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
  return WATERS.some((w) => x > w.x0 && x < w.x1);
}

function nearRiver(x) {
  return WATERS.some((w) => x > w.x0 - 3 && x < w.x1 + 3);
}

function eat(amount) {
  player.food = Math.min(100, player.food + amount);
}

// Mentor and clan bonuses
function stealthMult() {
  return CLANS[clanName].stealth * (mentor === "hunter" ? 0.7 : 1);
}
function damageMult() {
  return CLANS[clanName].damage * (mentor === "fighter" ? 1.25 : 1);
}
function scentRange() {
  return mentor === "hunter" ? 45 : 30;
}
function pouchSize() {
  return mentor === "herbs" ? 8 : 5;
}
function healMult() {
  return mentor === "herbs" ? 1.5 : 1;
}

// ======================================================
// The world (rebuilt for each new game)
// ======================================================
function buildTrees() {
  const random = makeRandom(42);
  const density = { forest: 1, marsh: 0.8, riverside: 0.55, moor: 0.12 };
  const kinds = { forest: "oak", marsh: "pine", riverside: "willow", moor: "oak" };
  const keepClear = [ROGUE_HOME, ...ROGUE_SPAWNS];
  for (const clan in CLANS) {
    OWN_HERB_SPOTS.concat(OTHER_HERB_SPOTS).forEach(([u, v]) => keepClear.push(spotFor(clan, u, v)));
  }
  const list = [];
  for (let i = 0; i < 520; i++) {
    const x = -WORLD_HALF + 4 + random() * (WORLD_HALF * 2 - 8);
    const z = -WORLD_HALF + 4 + random() * (WORLD_HALF * 2 - 8);
    const h = 9 + random() * 6;
    const r = 0.45 + random() * 0.3;
    const phase = random() * 6;
    const keep = random();
    const place = biomeAt(x, z);
    if (keep > density[place]) continue;
    if (nearRiver(x) || WATERS.some((w) => x > w.x0 - 4 && x < w.x1 + 4)) continue;   // not by the water
    if (Object.keys(CLANS).some((c) => distance({ x, z }, campOf(c)) < 16)) continue;  // camps are clearings
    if (keepClear.some((p) => Math.hypot(x - p.x, z - p.z) < 5)) continue;
    list.push({ x, z, r, h: place === "moor" ? h * 0.6 : h, kind: kinds[place], phase });
  }
  return list;
}

function buildHerbs() {
  const list = [];
  for (const clan in CLANS) {
    const spots = clan === clanName ? OWN_HERB_SPOTS : OTHER_HERB_SPOTS;
    spots.forEach(([u, v, kind]) => list.push(Object.assign({ kind, ready: true, regrow: 0 }, spotFor(clan, u, v))));
  }
  return list;
}

function buildCampCats() {
  const cats = MENTORS.map((m) => ({ name: m.name, mentorId: m.id, look: { fur: m.fur, eyes: EYES.Amber, pattern: m.pattern } }));
  cats.push({ name: QUEEN.name, mentorId: null, look: { fur: QUEEN.fur, eyes: EYES.Blue, pattern: QUEEN.pattern } });
  return cats.map((c, i) => Object.assign(c, {
    clan: clanName, hp: 100, injured: false, heading: 0, walk: 0, moving: false, timer: i,
    target: null, x: CAMP.x + Math.sin(i * 1.6) * 4, z: CAMP.z + Math.cos(i * 1.6) * 4,
  }));
}

const PATROL_FURS = {
  ThunderClan: ["#b5562a", "#5a4a3a"], RiverClan: ["#6f8fa8", "#9a8a70"],
  WindClan: ["#c9b27a", "#8a7a5a"], ShadowClan: ["#2b2830", "#4a4050"],
};

function buildPatrols() {
  const list = [];
  for (const clan in CLANS) {
    if (clan === clanName) continue;
    for (let i = 0; i < 2; i++) {
      const c = { clan, home: campOf(clan), angle: i * Math.PI, hp: PATROL_HP, state: "patrol", heading: 0, walk: 0,
                  moving: false, windup: 0, cooldown: 0, hurtTimer: 0, stagger: 0, fleeTimer: 0, respawn: 0,
                  look: { fur: PATROL_FURS[clan][i], eyes: EYES.Yellow, pattern: i ? "Tabby" : "Solid" } };
      Object.assign(c, patrolPoint(c));
      list.push(c);
    }
  }
  return list;
}

function patrolPoint(c) {
  return { x: c.home.x + Math.sin(c.angle) * PATROL_RADIUS, z: c.home.z + Math.cos(c.angle) * PATROL_RADIUS };
}

// Push something with radius `radius` out of every tree trunk
function pushOutOfTrees(body, radius) {
  for (const t of trees) {
    const dx = body.x - t.x;
    const dz = body.z - t.z;
    if (Math.abs(dx) > 2 || Math.abs(dz) > 2) continue;
    const d = Math.hypot(dx, dz);
    const min = t.r + radius;
    if (d < min && d > 0.0001) {
      body.x = t.x + (dx / d) * min;
      body.z = t.z + (dz / d) * min;
    }
  }
}

function keepInWorld(body) {
  body.x = clamp(body.x, -WORLD_HALF, WORLD_HALF);
  body.z = clamp(body.z, -WORLD_HALF, WORLD_HALF);
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
  if (playing && !choosingRole && !choosingMentor) {
    updateMenusKeys();
    updateDay(dt);
    if (fishing.active) updateFishing(dt);
    else updatePlayer(dt);
    updateFood(dt);
    updateCritter(squirrel, dt);
    prey.forEach((p) => updateCritter(p, dt));
    if (stage >= 2 || rogue.state === "fighting") updateRogue(dt);
    patrols.forEach((c) => updatePatrol(c, dt));
    updateCampCats(dt);
    updateHerbs(dt);
    if (stage === 3) updateClanmates(dt);
    updateCamera(dt);
  }
  if (hooks.afterUpdate) hooks.afterUpdate();
  for (const k in pressed) delete pressed[k];
}

// M: map (R15). H: herb pouch (R18); while it is open, 1 and 2 use herbs.
function updateMenusKeys() {
  if (pressed.KeyM) ui.map = !ui.map;
  if (pressed.KeyH) ui.pouch = !ui.pouch;
  if (ui.pouch) {
    if (pressed.Digit1) useHerb("marigold");
    if (pressed.Digit2) useHerb("dock");
  }
}

function updatePlayer(dt) {
  player.attackTimer = Math.max(0, player.attackTimer - dt);
  player.attackCooldown = Math.max(0, player.attackCooldown - dt);
  player.hurtTimer = Math.max(0, player.hurtTimer - dt);
  player.dodgeCooldown = Math.max(0, player.dodgeCooldown - dt);
  player.biteCooldown = Math.max(0, player.biteCooldown - dt);

  if (stage === 3 && role === "Leader" && !ui.pouch) {
    for (const code in ORDERS) if (pressed[code]) giveOrder(ORDERS[code]);
  }

  if (player.climbing) {
    updateClimbing(dt);
    return;
  }

  updateTurning(dt);

  // Dodging (R17): a quick roll; attacks miss while it lasts
  if (player.dodgeTimer > 0) {
    player.dodgeTimer -= dt;
    player.x += player.dodgeX * DODGE_SPEED * dt;
    player.z += player.dodgeZ * DODGE_SPEED * dt;
    pushOutOfTrees(player, CAT_R);
    keepInWorld(player);
    return;
  }

  // Getting up after a pounce attack (R17)
  if (player.recover > 0) {
    player.recover -= dt;
    player.moving = false;
    player.running = false;
    updateFalling(dt);
    return;
  }

  const clan = CLANS[clanName];
  const forwardHeld = isDown("KeyW", "ArrowUp");
  const back = isDown("KeyS", "ArrowDown");

  // R14: hold Q to scent the air
  player.scenting = isDown("KeyQ") && player.onGround;

  // R7: two quick taps of forward start a run, which lasts while forward is held
  if (wasPressed("KeyW", "ArrowUp")) {
    if (time - lastForwardTap < DOUBLE_TAP) player.running = true;
    lastForwardTap = time;
  }
  if (!forwardHeld || player.scenting) player.running = false;

  player.crouching = player.onGround && isDown("ShiftLeft", "ShiftRight");

  let speed = WALK_SPEED * clan.speed;
  if (player.running) speed *= RUN_SPEED * clan.run;
  if (player.crouching) speed *= 0.35;
  if (player.scenting) speed *= 0.5;
  if (inRiver(player.x)) speed *= clan.swim;   // swimming (R6)

  const dir = (forwardHeld ? 1 : 0) - (back ? 1 : 0);
  player.moving = dir !== 0;
  const oldX = player.x;
  const oldZ = player.z;

  // Walking forward into a trunk starts climbing it (R6)
  if (dir > 0 && player.onGround && trunkInFront()) {
    player.climbing = trunkInFront();
    player.running = false;
    player.turnVel = 0;
    return;
  }

  const stepSize = dir * speed * dt * (dir < 0 ? 0.6 : 1);
  player.x += Math.sin(player.heading) * stepSize;
  player.z += Math.cos(player.heading) * stepSize;
  keepInWorld(player);
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

  if (pressed.KeyC) tryDodge();
  else if (pressed.KeyF) tryPounceAttack();
  else if (pressed.KeyR) tryBite();
  else if (pressed.KeyE) doAction();
}

// R12: turning speeds up and slows down smoothly instead of starting and stopping at once
function updateTurning(dt) {
  const turn = (isDown("KeyA", "ArrowLeft") ? 1 : 0) - (isDown("KeyD", "ArrowRight") ? 1 : 0);
  const target = turn * TURN_SPEED;
  const change = TURN_ACCEL * dt;
  player.turnVel += clamp(target - player.turnVel, -change, change);
  player.heading += player.turnVel * dt;
}

// R12: the camera swings round behind the cat a little after it turns
function updateCamera(dt) {
  player.camHeading += wrapAngle(player.heading - player.camHeading) * Math.min(1, dt * CAMERA_FOLLOW);
}

function snapCamera() {
  player.camHeading = player.heading;
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
  player.scenting = false;
  player.turnVel = 0;
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
    x: CAMP.x, z: CAMP.z + 1, y: 0, vy: 0, onGround: true, climbing: null, running: false, scenting: false,
    hp: 100, food: Math.max(player.food, 50), hurtTimer: 0, dodgeTimer: 0, recover: 0, turnVel: 0,
  });
  snapCamera();
  fishing.active = false;
  if (rogue.state === "fighting") {
    const home = stage === 2 ? ROGUE_HOME : ROGUE_SPAWNS[rogueSpawn % ROGUE_SPAWNS.length];
    Object.assign(rogue, { x: home.x, z: home.z, hp: ROGUE_HP, windup: 0, cooldown: 0, stagger: 0, state: "waiting" });
  }
  patrols.forEach((c) => { if (c.state === "fighting") c.state = "patrol"; });
}

// E does whatever fits where the cat is: fight, use the camp, pick herbs, catch prey or fish
function doAction() {
  if (enemyInFront(2.2, 0.35)) trySwipe();
  else if (tryInteract()) return;
  else if (preyInReach()) catchPrey(preyInReach());
  else if (stage >= 1 && nearRiver(player.x)) tryFishing();
  else if (stage === 1) tryFishing();          // tells you where the river is
  else if (stage === 0) pounceMiss();
  else trySwipe();
}

// ======================================================
// Hunting (R4, R13): the squirrel, beetles and mice
// ======================================================
function makeCritter(kind) {
  const c = { kind, state: "idle", timer: Math.random() * 2, dirX: 0, dirZ: 1, hop: 0, respawn: 0, trail: [], trailTimer: 0 };
  Object.assign(c, randomHomeSpot());
  return c;
}

// Somewhere in your territory, away from camp and water
function randomHomeSpot() {
  let spot = spotFor(clanName, 30, 30);
  for (let i = 0; i < 30; i++) {
    const s = spotFor(clanName, -52 + Math.random() * 104, -52 + Math.random() * 104);
    if (distance(s, CAMP) < 15 || nearRiver(s.x)) continue;
    spot = s;
    break;
  }
  pushOutOfTrees(spot, 0.3);
  return spot;
}

// Keep prey in your territory and out of the water
function keepCritterHome(c) {
  keepInTerritory(c, clanName);
  for (const w of WATERS) {
    if (c.x > w.x0 - 1 && c.x < w.x1 + 1) c.x = c.x < (w.x0 + w.x1) / 2 ? w.x0 - 1 : w.x1 + 1;
  }
}

function critterVisible(c) {
  return c.state === "idle" || c.state === "hopping";
}

function allCritters() {
  return [squirrel, ...prey];
}

// The nearest prey in front of the cat that it can reach
function preyInReach() {
  let best = null;
  let bestDist = Infinity;
  for (const c of allCritters()) {
    if (!critterVisible(c) || !inFront(player, player.heading, c, PREY_KINDS[c.kind].reach, 0.5)) continue;
    const d = distance(player, c);
    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

function catchPrey(c) {
  player.attackTimer = 0.3;
  const name = PREY_KINDS[c.kind].name;
  const firstSquirrel = c === squirrel && stage === 0;
  c.state = firstSquirrel ? "caught" : "hidden";
  c.respawn = c === squirrel ? 4 : PREY_RESPAWN;

  // Eat it, or carry it to the fresh-kill pile if you are full (beetles are always eaten)
  let carried = false;
  if (c.kind !== "beetle" && player.food >= 100 && !player.carrying) {
    player.carrying = c.kind;
    carried = true;
  } else {
    eat(PREY_FOOD[c.kind]);
  }

  if (firstSquirrel) {
    advanceStage();
    return;
  }
  if (stage === 3 && role && c.kind !== "beetle") {
    stats.hunts++;
    say(`You caught a ${name}! (prey caught: ${stats.hunts})`, 2);
    checkLeader();
  } else {
    say(carried ? `You carry the ${name} in your mouth. Take it to the fresh-kill pile in camp.` : `You caught a ${name}!`, 2);
  }
}

// Missed pounce as a kit: leap forward a little (and maybe scare the squirrel)
function pounceMiss() {
  player.attackTimer = 0.3;
  if (player.onGround) {
    player.vy = 3.5;
    player.onGround = false;
    player.x += Math.sin(player.heading) * 0.5;
    player.z += Math.cos(player.heading) * 0.5;
  }
  if (critterVisible(squirrel) && distance(player, squirrel) < 6) scareCritter(squirrel);
}

function scareCritter(c) {
  c.state = "fleeing";
  const dx = c.x - player.x;
  const dz = c.z - player.z;
  const d = Math.hypot(dx, dz) || 1;
  c.dirX = dx / d;
  c.dirZ = dz / d;
  if (c === squirrel && stage === 0) say("The squirrel heard you! Hold Shift to stalk slowly.", 2);
}

function respawnCritter(c) {
  if (c === squirrel) {
    // Come back somewhere 12-20 units from the player
    const angle = Math.random() * Math.PI * 2;
    const d = 12 + Math.random() * 8;
    c.x = player.x + Math.sin(angle) * d;
    c.z = player.z + Math.cos(angle) * d;
    keepCritterHome(c);
    pushOutOfTrees(c, 0.3);
  } else {
    Object.assign(c, randomHomeSpot());
  }
  c.state = "idle";
  c.timer = 1;
  c.trail = [];
}

// Prey leaves a scent trail behind it (R14)
function recordTrail(c, dt) {
  c.trailTimer = (c.trailTimer || 0) + dt;
  if (c.trailTimer < 0.4) return;
  c.trailTimer = 0;
  const last = c.trail[c.trail.length - 1];
  if (last && Math.hypot(last.x - c.x, last.z - c.z) < 0.3) return;
  c.trail.push({ x: c.x, z: c.z });
  if (c.trail.length > 12) c.trail.shift();
}

function updateCritter(c, dt) {
  const kind = PREY_KINDS[c.kind];

  if (c.state === "caught") {
    // The kit task's squirrel comes back once the task is done (R13)
    if (stage > 0) {
      c.state = "hidden";
      c.respawn = 4;
    }
    return;
  }
  if (c.state === "hidden") {
    c.respawn -= dt;
    if (c.respawn <= 0) respawnCritter(c);
    return;
  }
  recordTrail(c, dt);

  if (c.state === "fleeing") {
    c.x += c.dirX * kind.flee * dt;
    c.z += c.dirZ * kind.flee * dt;
    c.hop += dt * 14;
    if (distance(c, player) > kind.hideDist || territoryAt(c.x, c.z) !== clanName) {
      c.state = "hidden";
      c.respawn = kind.hideTime;
    }
    return;
  }

  // Notice the player if they get too close without stalking
  const radius = (player.crouching ? kind.stalkNotice : kind.notice) * stealthMult();
  if (distance(player, c) < radius) {
    scareCritter(c);
    return;
  }

  // Wander: sit still, then move a little
  c.timer -= dt;
  if (c.timer <= 0) {
    if (c.state === "idle") {
      c.state = "hopping";
      const angle = Math.random() * Math.PI * 2;
      c.dirX = Math.sin(angle);
      c.dirZ = Math.cos(angle);
      c.timer = 0.6 + Math.random() * 0.8;
    } else {
      c.state = "idle";
      c.timer = 1 + Math.random() * 2;
    }
  }
  if (c.state === "hopping") {
    c.x += c.dirX * kind.wander * dt;
    c.z += c.dirZ * kind.wander * dt;
    keepCritterHome(c);
    pushOutOfTrees(c, 0.3);
    c.hop += dt * 10;
  }
}

// ======================================================
// Hunt by scent (R14)
// ======================================================
// Prey the cat can smell, nearest first (trees don't block scent)
function scentTargets() {
  return allCritters()
    .filter((c) => c.state !== "hidden" && c.state !== "caught")
    .map((c) => ({ prey: c, dist: distance(player, c) }))
    .filter((s) => s.dist <= scentRange())
    .sort((a, b) => a.dist - b.dist);
}

function scentHint() {
  const nearest = scentTargets()[0];
  if (!nearest) return "You smell no prey nearby.";
  const name = PREY_KINDS[nearest.prey.kind].name;
  return `You smell a ${name} · ${Math.round(nearest.dist)} m ${turnHint(nearest.prey)}`;
}

// ======================================================
// Fishing (level 2, and more fish later)
// ======================================================
function tryFishing() {
  if (!nearRiver(player.x)) {
    say("Find the river or the stream in your territory first.", 1.5);
    return;
  }
  Object.assign(fishing, { active: true, marker: 0, dir: 1, catches: 0, flash: 0 });
  newFishZone();
  player.moving = false;
  player.running = false;
  player.scenting = false;
  player.turnVel = 0;
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
    if (player.food >= 100 && !player.carrying) player.carrying = "fish";
    else eat(PREY_FOOD.fish);
    if (stage === 1) {
      if (fishing.catches >= 3) {
        stopFishing();
        advanceStage();
      } else {
        newFishZone();
      }
    } else {
      // Each fish is one more piece of prey
      stopFishing();
      if (stage === 3 && role) {
        stats.hunts++;
        say(`You caught a fish! (prey caught: ${stats.hunts})`, 2);
        checkLeader();
      } else {
        say("You caught a fish!", 2);
      }
    }
  }
}

// ======================================================
// Fighting (R4, R16, R17): the rogue and other clans' patrols
// ======================================================
function fightingEnemies() {
  return [rogue, ...patrols].filter((e) => e.state === "fighting");
}

// The nearest fighting enemy in front of the cat
function enemyInFront(range, cone) {
  let best = null;
  for (const e of fightingEnemies()) {
    if (!inFront(player, player.heading, e, range, cone)) continue;
    if (!best || distance(player, e) < distance(player, best)) best = e;
  }
  return best;
}

function hurtEnemy(e, amount) {
  e.hp -= amount;
  e.hurtTimer = 0.25;
  if (e.hp <= 0) defeatEnemy(e);
}

function defeatEnemy(e) {
  if (e === rogue) {
    beatRogue();
    return;
  }
  e.state = "fleeing";
  e.fleeTimer = 3;
  if (stage === 3 && role) {
    stats.fights++;
    say(`The ${e.clan} cat runs home! (fights won: ${stats.fights})`, 2.5);
    checkLeader();
  } else {
    say(`The ${e.clan} cat runs home!`, 2);
  }
}

// Swipe (E): quick and weak, anyone can do it
function trySwipe() {
  if (player.attackCooldown > 0) return;
  player.attackCooldown = 0.4;
  player.attackTimer = 0.25;
  const e = enemyInFront(2, 0.35);
  if (!e) return;
  hurtEnemy(e, SWIPE_DAMAGE * damageMult());
  e.x += Math.sin(player.heading) * 0.8;
  e.z += Math.cos(player.heading) * 0.8;
}

// Dodge (C): a quick roll to the side (A/D) or backwards; attacks miss during it
function tryDodge() {
  if (player.dodgeCooldown > 0 || !player.onGround) return;
  const h = player.heading;
  if (isDown("KeyA", "ArrowLeft")) {
    player.dodgeX = Math.cos(h);
    player.dodgeZ = -Math.sin(h);
  } else if (isDown("KeyD", "ArrowRight")) {
    player.dodgeX = -Math.cos(h);
    player.dodgeZ = Math.sin(h);
  } else {
    player.dodgeX = -Math.sin(h);
    player.dodgeZ = -Math.cos(h);
  }
  player.dodgeTimer = DODGE_TIME;
  player.dodgeCooldown = DODGE_COOLDOWN;
}

// Pounce attack (F): leap onto the enemy; big hit and a stagger, but you need a moment to get up
function tryPounceAttack() {
  if (stage < 2) {
    say("Kits are too small to pounce-attack. Swipe (E) and dodge (C)!", 2);
    return;
  }
  if (!player.onGround) return;
  player.x += Math.sin(player.heading) * 2;
  player.z += Math.cos(player.heading) * 2;
  keepInWorld(player);
  pushOutOfTrees(player, CAT_R);
  player.vy = 3;
  player.onGround = false;
  player.attackTimer = 0.3;
  player.recover = POUNCE_RECOVER;
  const e = enemyInFront(2.2, 0.3);
  if (e) {
    e.stagger = POUNCE_STAGGER;
    hurtEnemy(e, POUNCE_DAMAGE * damageMult());
  }
}

// Bite (R): stronger than a swipe, double damage on a staggered enemy
function canBite() {
  return (stage === 3 && role !== null) || (stage === 2 && mentor === "fighter");
}

function tryBite() {
  if (!canBite()) {
    say("You haven't learned to bite in a fight yet.", 2);
    return;
  }
  if (player.biteCooldown > 0) return;
  player.biteCooldown = BITE_COOLDOWN;
  player.attackTimer = 0.3;
  const e = enemyInFront(1.8, 0.35);
  if (e) hurtEnemy(e, BITE_DAMAGE * damageMult() * (e.stagger > 0 ? 2 : 1));
}

// One step of an enemy fighting the player: walk up, crouch (wind up), then strike
function fightStep(e, dt) {
  const dist = distance(player, e);
  e.heading = Math.atan2(player.x - e.x, player.z - e.z);
  e.cooldown -= dt;
  if (e.stagger > 0) {
    e.windup = 0;    // a staggered enemy can't attack
    return;
  }
  if (e.windup > 0) {
    e.windup -= dt;
    if (e.windup <= 0) {
      e.cooldown = 1.1;
      if (dist < 1.8) hurtPlayer(14, e);
    }
  } else if (dist > 1.3) {
    e.x += Math.sin(e.heading) * 4 * dt;
    e.z += Math.cos(e.heading) * 4 * dt;
    pushOutOfTrees(e, CAT_R);
    e.walk += dt * 8;
  } else if (e.cooldown <= 0) {
    e.windup = 0.45;
  }
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
  r.stagger = Math.max(0, r.stagger - dt);

  if (r.state === "gone") {
    if (stage < 3) return;
    // R9: a new rogue comes some time after the last one ran away
    r.respawn -= dt;
    if (r.respawn <= 0) {
      rogueSpawn++;
      const spot = ROGUE_SPAWNS[rogueSpawn % ROGUE_SPAWNS.length];
      Object.assign(r, { x: spot.x, z: spot.z, hp: ROGUE_HP, windup: 0, cooldown: 0, stagger: 0, state: "waiting" });
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

  if (r.state === "waiting") {
    if (distance(player, r) > 15) return;
    r.state = "fighting";
    say("A rogue! Chase it off your clan's territory! E swipe, C dodge, F pounce, R bite.", 3);
  }
  fightStep(r, dt);
}

// R16: other clans' patrols walk around their camps and attack cats on their land
function updatePatrol(c, dt) {
  c.hurtTimer = Math.max(0, c.hurtTimer - dt);
  c.stagger = Math.max(0, c.stagger - dt);

  if (c.state === "resting") {
    c.respawn -= dt;
    if (c.respawn <= 0) Object.assign(c, { state: "patrol", hp: PATROL_HP }, patrolPoint(c));
    return;
  }
  if (c.state === "fleeing") {
    moveToward(c, c.home, 7, dt);
    c.fleeTimer -= dt;
    if (c.fleeTimer <= 0) {
      c.state = "resting";
      c.respawn = PATROL_RECOVER;
    }
    keepInTerritory(c, c.clan);
    return;
  }

  const playerOnTheirLand = territoryAt(player.x, player.z) === c.clan;
  if (c.state === "patrol") {
    c.angle += dt * 0.12;
    moveToward(c, patrolPoint(c), 2.5, dt);
    if (playerOnTheirLand && distance(c, player) < PATROL_SIGHT) {
      c.state = "fighting";
      c.windup = 0;
      say(`A ${c.clan} patrol attacks! You are on their territory.`, 2.5);
    }
  } else if (c.state === "fighting") {
    if (!playerOnTheirLand) {
      c.state = "patrol";
      say(`The ${c.clan} patrol lets you go.`, 2);
    } else {
      fightStep(c, dt);
    }
  }
  keepInTerritory(c, c.clan);
}

function hurtPlayer(amount, from) {
  if (player.dodgeTimer > 0) return;   // dodged (R17)
  player.hp -= amount;
  player.hurtTimer = 0.3;
  player.x += Math.sin(from.heading) * 1;
  player.z += Math.cos(from.heading) * 1;
  pushOutOfTrees(player, CAT_R);
  if (player.hp <= 0) faint("You were beaten... You wake up back at camp. Rest, then try again.");
}

// ======================================================
// Levelling up, mentors and roles (R9, R19)
// ======================================================
function advanceStage() {
  stage++;
  player.hp = 100;
  if (stage === 1) {
    say(`You caught the squirrel! ${fullName()} is growing bigger.`, 3);
  } else if (stage === 2) {
    say(`Great fishing! You are now ${fullName()}, an apprentice of ${clanName}. Choose a mentor.`, 3.5);
    choosingMentor = true;   // script.js shows the mentor buttons
    clearKeys();
  } else if (stage === 3) {
    choosingRole = true;     // script.js shows the role buttons
    clearKeys();
  }
}

function clearKeys() {
  player.running = false;
  player.turnVel = 0;
  for (const k in keys) keys[k] = false;
}

function chooseMentor(id) {
  const m = MENTORS.find((x) => x.id === id);
  if (!m || stage !== 2 || mentor !== null) return;
  mentor = id;
  choosingMentor = false;
  say(`${m.name} will be your mentor. ${m.teaches}`, 4);
}

function mentorName() {
  const m = MENTORS.find((x) => x.id === mentor);
  return m ? m.name : null;
}

function chooseRole(choice) {
  if (stage !== 3 || role !== null || !ROLES.includes(choice)) return;
  role = choice;
  choosingRole = false;
  warriorSuffix = WARRIOR_SUFFIXES[Math.floor(Math.random() * WARRIOR_SUFFIXES.length)];
  Object.assign(stats, { hunts: 0, fights: 0 });
  if (role === "Medicine cat") {
    say(`You are now ${fullName()}, medicine cat of ${clanName}. Keep herbs in your pouch (H) and heal hurt clanmates with E.`, 5);
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

// A spot behind the player, `side` to the right
function behindPlayer(back, side) {
  return {
    x: player.x - Math.sin(player.heading) * back + Math.cos(player.heading) * side,
    z: player.z - Math.cos(player.heading) * back - Math.sin(player.heading) * side,
  };
}

// Where each leader's clanmate wants to stand right now
function clanmateTarget(c, i) {
  if (order === "follow") return behindPlayer(2.5, (i - 1) * 1.6);
  if (order === "guard") {
    const angle = (i / 3) * Math.PI * 2;
    return { x: CAMP.x + Math.sin(angle) * 3.5, z: CAMP.z + Math.cos(angle) * 3.5 };
  }
  // hunt: wander a loop in your territory, each cat in its own place
  const angle = time * 0.1 + i * 2;
  return spotFor(clanName, 20 + Math.sin(angle) * 12 + i * 4, Math.cos(angle) * 12 + i * 6);
}

function updateClanmates(dt) {
  clanmates.forEach((c, i) => {
    const target = clanmateTarget(c, i);
    const d = distance(c, target);
    if (d > 0.3) moveToward(c, target, Math.min(d * 3, 5.5), dt);
    else c.moving = false;

    c.timer -= dt;
    if (order === "hunt" && c.timer <= 0) {
      c.timer = 20;
      eat(PREY_FOOD.freshKill);
      say("A clanmate brings you fresh-kill.", 1.5);
    }
    // Following clanmates help fight
    const enemy = fightingEnemies().find((e) => distance(c, e) < 3);
    if (order === "follow" && enemy && c.timer <= 0) {
      c.timer = 1;
      hurtEnemy(enemy, 4);
    }
  });
}

// ======================================================
// Camp cats (R16 friendly, R18 injured, R19 mentors)
// ======================================================
function isFollowingMentor(c) {
  return stage === 2 && mentor !== null && c.mentorId === mentor;
}

function updateCampCats(dt) {
  // Now and then a camp cat gets hurt (R18)
  injuryTimer -= dt;
  if (injuryTimer <= 0) {
    injuryTimer = INJURY_TIME;
    const healthy = campCats.filter((c) => !c.injured && !isFollowingMentor(c));
    if (healthy.length) {
      const c = healthy[Math.floor(Math.random() * healthy.length)];
      c.injured = true;
      c.hp = 40;
      if (role === "Medicine cat") say(`${c.name} is hurt! Bring herbs and press E next to them.`, 3);
    }
  }

  for (const c of campCats) {
    if (c.injured) {
      c.moving = false;   // lies still until healed
      continue;
    }
    if (isFollowingMentor(c)) {
      const target = behindPlayer(2.2, 1.4);
      const d = distance(c, target);
      if (d > 0.4) moveToward(c, target, Math.min(d * 3, 5.5), dt);
      else c.moving = false;
      continue;
    }
    // Wander around camp; hurry back if far away
    c.timer -= dt;
    if (c.timer <= 0 || !c.target) {
      const a = Math.random() * Math.PI * 2;
      const r = 1.5 + Math.random() * 4.5;
      c.target = { x: CAMP.x + Math.sin(a) * r, z: CAMP.z + Math.cos(a) * r };
      c.timer = 3 + Math.random() * 4;
    }
    moveToward(c, c.target, distance(c, CAMP) > 8 ? 5 : 1.5, dt);
  }
}

// ======================================================
// Herbs and the herb pouch (R18)
// ======================================================
function pouchCount() {
  return player.pouch.marigold + player.pouch.dock;
}

function pickHerb(h) {
  if (pouchCount() >= pouchSize()) {
    say(`Your herb pouch is full (${pouchSize()} herbs). Press H to use some.`, 2);
    return;
  }
  player.pouch[h.kind]++;
  h.ready = false;
  h.regrow = HERB_REGROW;
  say(`You pick some ${HERBS[h.kind].name.toLowerCase()} and put it in your pouch.`, 2);
}

function useHerb(kind) {
  if (player.pouch[kind] <= 0) {
    say(`You have no ${HERBS[kind].name.toLowerCase()}.`, 1.5);
    return false;
  }
  if (player.hp >= 100) {
    say("You aren't hurt. Save your herbs.", 1.5);
    return false;
  }
  player.pouch[kind]--;
  player.hp = Math.min(100, player.hp + HERBS[kind].heal * healMult());
  say(`You chew the ${HERBS[kind].name.toLowerCase()} and feel better.`, 2);
  return true;
}

// Medicine cats treat hurt clanmates with the best herb in the pouch
function healClanmate(c) {
  const kind = player.pouch.marigold > 0 ? "marigold" : (player.pouch.dock > 0 ? "dock" : null);
  if (!kind) {
    say(`${c.name} needs herbs, but your pouch is empty.`, 2);
    return;
  }
  player.pouch[kind]--;
  c.injured = false;
  c.hp = 100;
  say(`You treat ${c.name} with ${HERBS[kind].name.toLowerCase()}. ${c.name} thanks you!`, 2.5);
}

function updateHerbs(dt) {
  for (const h of herbs) {
    if (h.ready) continue;
    h.regrow -= dt;
    if (h.regrow <= 0) h.ready = true;
  }
}

// ======================================================
// The camp: dens and the fresh-kill pile (R20)
// ======================================================
function myDen() {
  let id = "nursery";
  if (stage === 2 || (stage === 3 && role === null)) id = "apprentices";
  else if (stage === 3 && role === "Leader") id = "leader";
  else if (stage === 3 && role === "Medicine cat") id = "medicine";
  else if (stage === 3) id = "warriors";
  return dens.find((d) => d.id === id);
}

function useDen(den) {
  if (fightingEnemies().length) {
    say("You can't rest while an enemy is attacking you!", 2);
    return;
  }
  const mine = myDen();
  if (den.id !== mine.id) {
    say(`This is the ${den.name}. Your den is the ${mine.name}.`, 2.5);
    return;
  }
  // Sleep until the next morning
  if (dayFraction() >= START_TIME) day++;
  dayTime = START_TIME * DAY_LENGTH;
  player.hp = 100;
  say(`You curl up in the ${den.name} and sleep. You wake up refreshed at ${clockText()}.`, 3);
}

function useFreshKill() {
  if (player.carrying) {
    say(`You drop the ${player.carrying} on the fresh-kill pile for your clan.`, 2);
    player.carrying = null;
    freshKill++;
  } else if (player.food < 100 && freshKill > 0) {
    freshKill--;
    eat(PREY_FOOD.pile);
    say("You eat a piece of fresh-kill.", 1.5);
  } else {
    say(freshKill > 0 ? "You aren't hungry." : "The fresh-kill pile is empty. Go hunting!", 1.5);
  }
}

// Things in the world you can use with E: hurt clanmates, herbs, the fresh-kill pile, dens
function tryInteract() {
  const hurt = campCats.find((c) => c.injured && distance(player, c) < 2);
  if (hurt) {
    if (role === "Medicine cat") {
      healClanmate(hurt);
      return true;
    }
    say(`${hurt.name} is hurt. Only a medicine cat can treat injuries.`, 2);
  }
  const herb = herbs.find((h) => h.ready && distance(player, h) < 2);
  if (herb) {
    pickHerb(herb);
    return true;
  }
  if (distance(player, FRESH_KILL) < 1.8) {
    useFreshKill();
    return true;
  }
  const den = dens.filter((d) => distance(player, d) < 2.5).sort((a, b) => distance(player, a) - distance(player, b))[0];
  if (den) {
    useDen(den);
    return true;
  }
  return false;
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
  const minutes = Math.round(dayFraction() * 24 * 60 * 1000) / 1000;
  const whole = Math.floor(minutes);
  const hh = String(Math.floor(whole / 60)).padStart(2, "0");
  const mm = String(whole % 60).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ======================================================
// Camera (R11, R12): low and close behind the cat, swinging round smoothly
// ======================================================
function cameraFor() {
  const size = catSize();
  const back = 1.6 + 1.4 * size;
  const height = 0.35 + 0.7 * size;
  const fx = Math.sin(player.camHeading);
  const fz = Math.cos(player.camHeading);
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
