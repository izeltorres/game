// Cat Clans - game logic.
// This file only holds the rules of the game (no drawing and no web page code),
// so the tests can run it directly. render3d.js draws it and script.js connects it to the page.
//
// The world is 3D: x and z are the ground, y is up. One unit is about one cat length.
// player.heading is the direction the cat faces: forward = (sin(heading), cos(heading)).
// North is +z. The world is split into 4 clan territories, one per quarter (Round 2).

// ======================================================
// Settings
// ======================================================
const GAME_NAME = "Cat Clans";      // R21
const WORLD_HALF = 120;          // the world goes from -120 to 120 on x and z
const CAMP_DISTANCE = 60;        // each camp is in the middle of its quarter

// Water: the big river (WindClan and RiverClan land) and a stream (ThunderClan and ShadowClan land)
const RIVER_X0 = 30;
const RIVER_X1 = 36;
const STREAM_X0 = -34;
const STREAM_X1 = -30;
const WATERS = [{ x0: RIVER_X0, x1: RIVER_X1, bends: true }, { x0: STREAM_X0, x1: STREAM_X1 }];   // x0/x1: the river's edges at z = 0
const RIVER_BEND = 5;      // R74: the river's middle moves up to this far either way...
const RIVER_WAVE = 80;     // ...one full bend every this many units of z (the stream stays straight)

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
const PREY_FOOD = { beetle: 8, mouse: 20, vole: 18, sparrow: 15, squirrel: 40, rabbit: 45, hare: 70,
                    fish: 30, freshKill: 10, pile: 25 };
const PREY_RESPAWN = 10;         // seconds until caught small prey comes back (R13)

// Prey (R13, R47): how close you can get before they notice, how fast they run, how far you can reach
// to catch them. Bigger prey notices you sooner and runs faster.
const PREY_KINDS = {
  beetle:   { name: "beetle",   size: "tiny",   notice: 1,  stalkNotice: 0,   flee: 1.5, wander: 0.6, reach: 1.5, hideDist: 6,  hideTime: 3 },
  mouse:    { name: "mouse",    size: "small",  notice: 5,  stalkNotice: 0.8, flee: 6,   wander: 2,   reach: 1.8, hideDist: 15, hideTime: 3 },
  vole:     { name: "vole",     size: "small",  notice: 4.5, stalkNotice: 0.7, flee: 5.5, wander: 1.8, reach: 1.8, hideDist: 15, hideTime: 3 },
  sparrow:  { name: "sparrow",  size: "small",  notice: 6,  stalkNotice: 1,   flee: 7,   wander: 2.2, reach: 1.8, hideDist: 15, hideTime: 3 },
  squirrel: { name: "squirrel", size: "medium", notice: 7,  stalkNotice: 1.2, flee: 8,   wander: 1.5, reach: 2.2, hideDist: 25, hideTime: 2.5 },
  rabbit:   { name: "rabbit",   size: "medium", notice: 8,  stalkNotice: 1.4, flee: 9,   wander: 2.2, reach: 2.2, hideDist: 25, hideTime: 3 },
  hare:     { name: "hare",     size: "big",    notice: 10, stalkNotice: 1.6, flee: 11,  wander: 2.5, reach: 2.4, hideDist: 30, hideTime: 3 },
};
const KIT_PREY = ["beetle", "mouse"];   // the only prey that comes into camp for kits (R42)
const KIT_PREY_WARINESS = 0.5;          // camp prey notices kits at half the distance (R56)
const KIT_PREY_SPEED = 0.6;             // and moves slower (R56)
const BIG_HUNT_PIECES = 4;              // a hare caught on a big hunt fills the pile this much (R47)

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
const PATTERNS = ["Solid", "Tabby", "Patches", "Tuxedo", "Calico", "Spotted", "Colorpoint"];   // R21
const WARRIOR_SUFFIXES = ["heart", "claw", "pelt", "storm", "whisker", "fang", "tail", "stripe"];

// The three stages of a cat's life (Round 4: R42, R43, R45): rank name, name ending, size
const STAGES = [
  { rank: "Kit",        suffix: "kit", size: 0.5 },   // stays in camp, catches a mix of small prey
  { rank: "Apprentice", suffix: "paw", size: 0.86 },  // does its mentor's tasks
  { rank: null,         suffix: null,  size: 1 },     // a full clan cat: the rank is the role
];

// Kits (R42, R45): stay inside the camp and catch this mix to become an apprentice
const KIT_NEEDS = { beetle: 5, mouse: 3 };
const KIT_BOUNDARY = 12;           // how far from the middle of camp a kit may go
const KIT_GROWN_SIZE = 0.75;       // a kit grows from 0.5 to this as it catches its mix

// Apprentices (R44, R45): the tasks the mentor gives, in order
const APPRENTICE_TASKS = ["patrol", "squirrel", "climb", "fish", "rogue"];   // "climb": R64
const FISH_FOR_TASK = 3;
// Border markers for patrols, measured from the camp like the other spots
const BORDER_MARKER_SPOTS = [[10, -50], [50, -15], [-10, 45]];   // well away from where rogues appear
const MARKER_RADIUS = 4;

// Paths (R43): the player chooses one of these; warriors earn Deputy and then Leader (R45)
const ROLES = ["Warrior", "Medicine cat"];
const DEPUTY_NEEDS = { hunts: 5, fights: 3, patrols: 1 };
const LEADER_NEEDS = { hunts: 3, fights: 2, trained: 1, missions: 1 };   // missions: R49
const LESSONS = ["hunt", "battle", "patrol"];   // training your own apprentice (R36, R39)
const LESSON_HUNTS = 3;
const LESSON_HITS = 3;
const LEADER_LIVES = 9;            // R37
const LIFE_SHIELD = 2;             // seconds nothing can hurt a leader after losing a life
const ORDERS = { Digit1: "follow", Digit2: "hunt", Digit3: "guard", Digit4: "bighunt" };

// Gatherings (R48): the leader is called to the Great Oak in the middle of the world
const GATHERING_TIME = 900;        // seconds between Gatherings
const GATHERING_OPEN = 300;        // how long a call stays open
const GATHERING_SPOT = { x: 0, z: 0 };
const GATHERING_REACH = 8;         // how close to the oak the leader must come
const TRUCE_RADIUS = 12;           // no cat attacks this close to the Great Oak (its clearing)
const DECISION_TIME = 300;         // a leader's big decision comes about this often (R50)

// Deputy missions (R49)
const MISSION_TYPES = ["message", "stolen", "lostkit"];
const MISSION_GAP = 30;

// Rivalries (R54)
const RIVALRY_START = 30;
const RIVALRY_FRIENDLY = 20;       // below this their cats only warn you off
const RIVALRY_HOSTILE = 70;        // from this they spot you sooner and raid your camp
const HOSTILE_SIGHT = 20;
const RAID_TIME = 240;
const TRESPASS_TIME = 10;          // seconds on a rival's land for +1 rivalry

// Medicine cats (R52, R57)
const MEDICINE_NAMES = { own: "Thymeleaf", ThunderClan: "Larkpool", ShadowClan: "Reedmist", RiverClan: "Owlfeather", WindClan: "Heathsong" };
const MEDICINE_HEAL_COOLDOWN = 60;
const TREAT_AFTER = 30;            // the camp's medicine cat treats a cat hurt for this long
const MED_RANKS = ["Medicine cat apprentice", "Medicine cat", "Senior medicine cat"];
const MED_NEEDS = [{ quests: 1, treated: 2, store: 0 }, { quests: 1, treated: 3, store: 6 }];
const MED_QUESTS = [{ marigold: 3, dock: 2 }, { marigold: 2, dock: 3 }];

// Clicking herbs (R53)
const AIM_REACH = 3.5;
const AIM_CONE = 0.2;              // radians either side of the aiming dot

// ---------- Round 6 ----------
const CAT_BODY = 0.75;             // cats can't be closer than this to you (kits: 3/4 of it) (R58)
const CURRENT_SPEED = 1;           // the river pushes swimmers south in deep water (R59)
const SHALLOW = 1.2;               // how wide the wading shallows are along each bank
const WADE_SPEED = 0.75;
const STONE_CROSSINGS = [20, -20]; // z of the stepping-stone crossings over both waters
const ROGUE_PACK_HP = 90;          // rogue packs after the apprenticeship (R62)
const ROGUE_PACK_DAMAGE = 18;
const ROGUE_SIGHT = 18;
const ROGUE_RAID_AFTER = 120;      // a pack not chased off by then raids your camp
const ROGUE_DODGE = 0.3;           // chance a smart rogue sidesteps a hit
const GROOM_COOLDOWN = 30;         // sharing tongues (R63)
const GROOM_HEAL = 10;
const SOCIAL_TIME = 10;            // camp cats pair up this often
const LOOKOUT_HEIGHT = 3;          // high in a tree you can see far (R64)
const LOOKOUT_RANGE = 60;
const TREE_REACH = 1.5;            // enemies can't reach you above this, except ThunderClan cats
const CLIMB_TASK_HEIGHT = 1.8;
const PERCH_HEIGHT = 1.6;
const HUNGER_TIME = 180;           // camp cats eat from the pile about this often (R66)
const SEASONS = ["newleaf", "greenleaf", "leaf-fall", "leaf-bare"];   // R69
const SEASON_DAYS = 30;
const BEETLES_PER_PREY = 4;        // R69c
const DEMOS = { patrol: "sniff", squirrel: "stalk", climb: "look-up", fish: "swipe", rogue: "fight" };   // R58
const TIPS = {
  patrol: "Tip: the markers glow, and the next one glows brightest.",
  squirrel: "Tip: hold Shift to stalk; a squirrel hears you from 7 paces if you walk.",
  climb: "Tip: walk into a trunk and hold forward to climb; Space jumps down.",
  fish: "Tip: wait until a fish is right under the ripple before you swipe.",
  rogue: "Tip: dodge with C when it crouches, then swipe or pounce.",
};

// Kits living in camps (R31)
const KIT_NAMES = ["Pebble", "Ember", "Sedge", "Wren"];
const RIVAL_KITS = 2;

// Weather (R30)
const WEATHERS = ["clear", "rain", "fog", "wind", "storm"];
const WEATHER_TIME = 240;          // seconds between weather changes
const WEATHER_SCENT = { clear: 1, rain: 0.6, fog: 1, wind: 1.5, storm: 0.4 };

// Looking up and down with the mouse (R32)
const CAM_PITCH_MIN = -0.5;
const CAM_PITCH_MAX = 0.8;
const MOUSE_SPEED = 0.0025;

// 3D fishing (R35)
const FISH_COUNT = 4;
const PAW_REACH = 0.55;            // how close a fish must be to the paw; RiverClan reaches further
const LOW_HEALTH = 30;             // below this a cat limps (R46)

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
// Huts (R25): big enough to walk into, standing about 9 from the middle of camp, doors facing the middle
const HUT_R = 3;
const HUT_WALL = 0.15;
const HUT_DOOR = 0.3;              // half the width of the doorway, as an angle
const DEN_SPOTS = [
  { id: "nursery",     name: "nursery",          spot: [-7, 5.5] },
  { id: "apprentices", name: "apprentices' den", spot: [7, 5.5] },
  { id: "warriors",    name: "warriors' den",    spot: [8.5, -3] },
  { id: "medicine",    name: "medicine den",     spot: [-8.5, -3] },
  { id: "leader",      name: "leader's den",     spot: [0, -9] },   // in front of the Highrock
];
// Rocks (R23): a ring of stones around each camp and the Highrock behind the leader's den
const HIGHROCK_SPOT = [0, -15];
const HIGHROCK_R = 2.5;
const STONE_RING = 14;
const STONE_R = 0.5;
const CAMP_CLEARING = 20;         // no trees this close to a camp
const CAMP_YARD = 4.5;            // camp cats wander this close to the middle
const FRESH_KILL_SPOT = [3, 0];
const DROP_TIME = 0.4;            // how long dropped prey takes to fall (R27)
const MOUTH_HEIGHT = 0.6;

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
const kitCatches = { beetle: 0, mouse: 0 };   // R45
let taskIndex = 0;          // which of the mentor's tasks the apprentice is on (R44)
let markersVisited = 0;     // border markers visited on the current patrol
let trainee = null;         // the deputy's own apprentice (R36, R39)
let weather = "clear";      // R30
let weatherTimer = WEATHER_TIME;
let boundaryWarned = -10;   // when the kit was last told to stay in camp
let pendingChoice = null;   // a speech (R48) or decision (R50) waiting for the player; the game waits
let gatheringTimer = GATHERING_TIME;
const gathering = { called: false, open: 0 };
let gatheringLeaders = [];  // the other clans' leaders at the Great Oak
let decisionTimer = DECISION_TIME;
let mission = null;         // the deputy's current mission (R49)
let missionIndex = 0;
let missionTimer = 0;
let stolenPrey = null;      // { x, z, clan } for the stolen-prey mission
let graceClan = null;       // after delivering a message, that clan lets you leave in peace for a while
let graceTimer = 0;
const rivalry = {};         // other clans' rivalry with yours, 0-100 (R54)
let trespassTimer = 0;
let raidTimer = RAID_TIME;
let raiders = [];           // rival cats raiding your camp
let warnedAt = -10;         // when a friendly patrol last warned you off
let medicineCats = [];      // one per camp (R52)
let medRank = 0;            // the player's medicine cat rank (R57)
let herbStore = 0;          // herbs kept in your medicine den
let medQuest = null;        // the herbs Thymeleaf wants collected
const questDeposited = { marigold: 0, dock: 0 };
let rogueMates = [];        // the rest of a rogue pack (R62)
let pileItems = [];         // what is on the fresh-kill pile: { kind, day } (R65)
let pileDay = 1;
let leaders = [];           // every clan's leader (R69a)
let steppingStones = [];    // stepping stones across the water (R59)
let socialClock = SOCIAL_TIME;   // when camp cats next pair up (R63)

// Places for the player's own clan (filled in by resetGame)
const CAMP = { x: 0, z: 0 };
const ROGUE_HOME = { x: 0, z: 0 };
const ROGUE_SPAWNS = [];
const FRESH_KILL = { x: 0, z: 0 };
const BORDER_MARKERS = [];
let dens = [];

const player = {};
const squirrel = {};
const rogue = {};
const fishing = {};
const stats = {};   // counted toward the next promotion (R45, R49, R57); see resetStats()
function resetStats() {
  Object.assign(stats, { hunts: 0, fights: 0, patrols: 0, trained: 0, missions: 0, quests: 0, treated: 0, beetles: 0 });
}
resetStats();
const ui = { map: false, pouch: false, menu: false, gameOver: false }; // map (R15), pouch (R18), main menu (R26, R37)
let trees = [];
let herbs = [];
let prey = [];          // beetles and mice (R13)
let clanmates = [];     // a leader's 3 followers (R9)
let campCats = [];      // the cats living in your camp, including the mentors (R16, R19)
let patrols = [];       // other clans' cats: patrols (R16) and camp cats (R29); p.mode says which
let huts = [];          // every camp's huts (R25)
let rocks = [];         // camp stones and Highrocks (R23)
let dropped = [];       // prey dropped on the ground (R27)
let kits = [];          // kits in every camp (R31); the deputy's apprentice is one of them

// script.js fills these in so the logic can talk to the page
const hooks = { message: null, afterUpdate: null, sound: null };   // sound: R61

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
  ui.menu = false;
  ui.gameOver = false;
  dropped = [];
  resetStats();
  Object.assign(kitCatches, { beetle: 0, mouse: 0 });
  taskIndex = 0;
  markersVisited = 0;
  trainee = null;
  weather = "clear";
  weatherTimer = WEATHER_TIME;
  pendingChoice = null;
  gatheringTimer = GATHERING_TIME;
  Object.assign(gathering, { called: false, open: 0 });
  gatheringLeaders = [];
  decisionTimer = DECISION_TIME;
  mission = null;
  missionIndex = 0;
  missionTimer = 0;
  graceClan = null;
  graceTimer = 0;
  stolenPrey = null;
  for (const c in CLANS) rivalry[c] = RIVALRY_START;
  delete rivalry[clanName];
  trespassTimer = 0;
  raidTimer = RAID_TIME;
  raiders = [];
  medRank = 0;
  herbStore = 0;
  medQuest = null;
  Object.assign(questDeposited, { marigold: 0, dock: 0 });

  // Places for this clan
  Object.assign(CAMP, campOf(clanName));
  Object.assign(ROGUE_HOME, spotFor(clanName, ...ROGUE_HOME_SPOT));
  ROGUE_SPAWNS.length = 0;
  ROGUE_SPAWN_SPOTS.forEach(([u, v]) => ROGUE_SPAWNS.push(spotFor(clanName, u, v)));
  Object.assign(FRESH_KILL, spotFor(clanName, ...FRESH_KILL_SPOT));
  huts = buildHuts();
  rocks = buildRocks();
  dens = huts.filter((h) => h.clan === clanName);
  BORDER_MARKERS.length = 0;
  BORDER_MARKER_SPOTS.forEach(([u, v]) => BORDER_MARKERS.push(spotFor(clanName, u, v)));

  Object.assign(player, {
    x: CAMP.x, z: CAMP.z + 3, y: 0, vy: 0, heading: 0, turnVel: 0, camHeading: 0, camPitch: 0, onGround: true,
    crouching: false, moving: false, running: false, scenting: false, climbing: null, walk: 0,
    hp: 100, food: 100, attackTimer: 0, attackCooldown: 0, hurtTimer: 0,
    dodgeTimer: 0, dodgeCooldown: 0, dodgeX: 0, dodgeZ: 0, recover: 0, biteCooldown: 0,
    carrying: null, dropTimer: 0, pouch: { marigold: 0, dock: 0 },
    lives: 0, lifeShield: 0, idleTime: 0, eatTimer: 0,
  });
  // critter state: idle | hopping | fleeing | hidden | caught
  const s = spotFor(clanName, 4, 24);
  Object.assign(squirrel, { kind: "squirrel", x: s.x, z: s.z, state: "idle", timer: 1, dirX: 0, dirZ: 1, hop: 0,
                            respawn: 0, trail: [], trailTimer: 0 });
  // rogue.state: waiting | fighting | fleeing | gone
  Object.assign(rogue, { x: ROGUE_HOME.x, z: ROGUE_HOME.z, hp: ROGUE_HP, heading: Math.PI, walk: 0, windup: 0,
                         cooldown: 0, hurtTimer: 0, stagger: 0, fleeTimer: 0, respawn: 0, state: "waiting",
                         smart: false, damage: 14, raidClock: 0, raiding: false, target: null });
  Object.assign(fishing, { active: false, catches: 0, flash: 0, flashGood: false, fish: [] });

  trees = buildTrees();
  herbs = buildHerbs();
  clanmates = [];
  prey = [];
  for (let i = 0; i < 6; i++) prey.push(makeCritter("beetle", prey.length));
  for (let i = 0; i < 4; i++) prey.push(makeCritter("mouse", prey.length));
  // R47: bigger prey for apprentices and older (hidden while you are a kit)
  for (let i = 0; i < 3; i++) prey.push(makeCritter("vole", prey.length));
  for (let i = 0; i < 3; i++) prey.push(makeCritter("sparrow", prey.length));
  for (let i = 0; i < 2; i++) prey.push(makeCritter("rabbit", prey.length));
  squirrel.slot = 0;
  campCats = buildCampCats();
  patrols = buildPatrols();
  kits = buildKits();
  medicineCats = buildMedicineCats();
  // Round 6
  rogueMates = [];
  pileItems = [{ kind: "mouse", day: 1 }, { kind: "vole", day: 1 }, { kind: "sparrow", day: 1 }];
  freshKill = pileItems.length;
  pileDay = day;
  leaders = buildLeaders();
  steppingStones = buildSteppingStones();
  socialClock = SOCIAL_TIME;
  campCats.forEach((c, i) => { c.hungerTimer = 150 + i * 45; c.social = null; c.groomedAt = -99; });
  addPerchedBirds();
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

// Huts can only be entered through their doorway (R25): if the cat and its target are not in the
// same hut, head for the doorway first (from inside, the spot just inside it; from outside, just outside it)
function viaDoorway(body, target) {
  const from = insideHut(body);
  const to = insideHut(target);
  if (from === to) return target;
  const h = from || to;
  const angle = Math.atan2(body.x - h.x, body.z - h.z);
  const lined = Math.abs(wrapAngle(angle - h.door)) < HUT_DOOR * 0.7;   // lined up with the doorway
  const reach = from ? h.R - 0.8 : h.R + 0.8;
  const doorSpot = { x: h.x + Math.sin(h.door) * reach, z: h.z + Math.cos(h.door) * reach };
  if (from) return lined || distance(body, doorSpot) < 0.3 ? { x: h.x + Math.sin(h.door) * (h.R + 0.8), z: h.z + Math.cos(h.door) * (h.R + 0.8) } : doorSpot;
  return lined || distance(body, doorSpot) < 0.3 ? target : doorSpot;
}

// Walk a cat toward a target. If something solid is in the way (R23), try turning more and more
// until a step makes progress, so the cat walks around it. It keeps turning to the same side as
// last time, so it doesn't swing back and forth in front of an obstacle. A cat never steps into
// a hut by accident: only when the hut is where it is going (R25).
function moveToward(body, target, speed, dt) {
  target = viaDoorway(body, target);
  const d = distance(body, target);
  if (d < 0.05) {
    body.moving = false;
    return;
  }
  const want = Math.atan2(target.x - body.x, target.z - body.z);
  const stepSize = Math.min(speed * dt, d);
  const side = body.avoidSide || 1;
  const fromHut = insideHut(body);
  const targetHut = insideHut(target);
  const doorHut = fromHut || targetHut || doorwayHut(body);   // standing in a doorway keeps that door open
  // Stuck in a pocket (e.g. between a hut and the Highrock)? Walk along the obstacle for a moment.
  if ((body.detour || 0) > 0) {
    body.detour -= dt;
    for (let k = 0; k < 4; k++) {
      const h = body.detourHeading + k * 0.6 * side;
      const trial = { x: body.x + Math.sin(h) * stepSize, z: body.z + Math.cos(h) * stepSize };
      pushOutOfObstacles(trial, CAT_R, doorHut);
      const trialHut = insideHut(trial);
      if (!fromHut && trialHut && trialHut !== targetHut) continue;
      if (distance(trial, body) > stepSize * 0.5) {
        body.x = trial.x;
        body.z = trial.z;
        body.heading = h;
        body.detourHeading = h;
        body.walk = (body.walk || 0) + stepSize * 3;
        body.moving = true;
        return;
      }
    }
    body.detour = 0;
  }
  let best = null;
  for (const turn of [0, 0.6, -0.6, 1.2, -1.2, 1.8, -1.8, 2.4, -2.4]) {
    const h = want + turn * side;
    const trial = { x: body.x + Math.sin(h) * stepSize, z: body.z + Math.cos(h) * stepSize };
    pushOutOfObstacles(trial, CAT_R, doorHut);
    const trialHut = insideHut(trial);
    if (!fromHut && trialHut && trialHut !== targetHut) continue;   // don't wander into a hut
    const progress = d - distance(trial, target);
    if (!best || progress > best.progress) best = { trial, h, progress, turn };
    if (progress > stepSize * 0.3) break;
  }
  // R58: cats are solid, so no one walks into you (they stop when they reach you)
  const room = kits.includes(body) ? CAT_BODY * 0.75 : CAT_BODY;
  if (best && !player.climbing && distance(best.trial, player) < room && distance(best.trial, player) < distance(body, player)) {
    body.heading = best.h;
    best = null;
  }
  if (best) {
    body.x = best.trial.x;
    body.z = best.trial.z;
    body.heading = best.h;
    if (best.turn !== 0) body.avoidSide = Math.sign(best.turn) * side;
  }
  // Every half second, check how far the cat really got (stepping back and forth in front of an obstacle
  // looks like moving frame by frame). Hardly anywhere while trying to walk: go along the obstacle for a
  // moment (above). This looks at the cat's own movement, so chasing something that runs away doesn't count.
  body.stuckClock = (body.stuckClock || 0) + dt;
  if (body.stuckClock >= 0.5) {
    if (body.stuckFrom && distance(body, body.stuckFrom) < speed * 0.5 * 0.2 && d > 1) {
      body.detour = 1.2;
      body.detourHeading = want + (body.avoidSide || 1) * 1.6;
    }
    body.stuckFrom = { x: body.x, z: body.z };
    body.stuckClock = 0;
  }
  body.walk = (body.walk || 0) + stepSize * 3;
  body.moving = true;
}

// A kit grows a little with every catch toward its mix (R45)
function kitProgress() {
  const need = KIT_NEEDS.beetle + KIT_NEEDS.mouse;
  return (Math.min(kitCatches.beetle, KIT_NEEDS.beetle) + Math.min(kitCatches.mouse, KIT_NEEDS.mouse)) / need;
}

function catSize() {
  if (stage === 0) return STAGES[0].size + (KIT_GROWN_SIZE - STAGES[0].size) * kitProgress();
  return STAGES[stage].size;
}

function rankName() {
  if (stage < 2) return STAGES[stage].rank;
  if (role === "Medicine cat") return MED_RANKS[medRank];   // R57
  return role || "Apprentice";
}

function fullName() {
  if (stage < 2) return catName + STAGES[stage].suffix;
  if (role === "Leader") return catName + "star";
  return catName + warriorSuffix;
}

// The task the mentor has given the apprentice (R44), or null
function currentTask() {
  return stage === 1 && mentor ? APPRENTICE_TASKS[taskIndex] || null : null;
}

function mentorCat() {
  return campCats.find((c) => c.mentorId === mentor) || null;
}

// R74: how far the winding river is moved sideways at this z
function riverShift(z) {
  return RIVER_BEND * Math.sin((2 * Math.PI * z) / RIVER_WAVE);
}

// The edges of the river and the stream at this z: [river, stream]
function watersAt(z) {
  return WATERS.map((w) => (w.bends ? { x0: w.x0 + riverShift(z), x1: w.x1 + riverShift(z) } : { x0: w.x0, x1: w.x1 }));
}

function inRiver(x, z) {
  return watersAt(z).some((w) => x > w.x0 && x < w.x1);
}

function nearRiver(x, z) {
  return watersAt(z).some((w) => x > w.x0 - 3 && x < w.x1 + 3);
}

function eat(amount) {
  player.food = Math.min(100, player.food + amount);
}

// Mentor and clan bonuses
function stealthMult() {
  return CLANS[clanName].stealth * (mentor === "hunter" ? 0.7 : 1) * (weather === "fog" ? 0.6 : 1);   // fog: R30
}
function damageMult() {
  return CLANS[clanName].damage * (mentor === "fighter" ? 1.25 : 1);
}
function scentRange() {
  return Math.round((mentor === "hunter" ? 45 : 30) * WEATHER_SCENT[weather]);   // weather: R30
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
    if (watersAt(z).some((w) => x > w.x0 - 4 && x < w.x1 + 4)) continue;   // not by the water
    if (Object.keys(CLANS).some((c) => distance({ x, z }, campOf(c)) < CAMP_CLEARING)) continue;  // camps are clearings
    if (distance({ x, z }, GATHERING_SPOT) < 12) continue;   // the clearing around the Great Oak (R48)
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

// R31: 4 kits play in your camp, and each other camp has 2 kits
function buildKits() {
  const list = [];
  const furs = [FURS.Grey, FURS.Ginger, FURS.Brown, FURS.Cream];
  for (const clan in CLANS) {
    const camp = campOf(clan);
    const count = clan === clanName ? KIT_NAMES.length : RIVAL_KITS;
    for (let i = 0; i < count; i++) {
      const a = i * 1.9 + 0.5;
      list.push({
        clan, baseName: KIT_NAMES[i], name: KIT_NAMES[i] + "kit", size: 0.5, lesson: null,
        x: camp.x + Math.sin(a) * 2.5, z: camp.z + Math.cos(a) * 2.5, heading: a, walk: 0, moving: false,
        activity: "wander", timer: i * 0.7, target: null, home: camp,
        look: { fur: furs[(i + clan.length) % furs.length], eyes: EYES.Green, pattern: PATTERNS[(i + clan.length) % 4] },
      });
    }
  }
  return list;
}

const PATROL_FURS = {
  ThunderClan: ["#b5562a", "#5a4a3a"], RiverClan: ["#6f8fa8", "#9a8a70"],
  WindClan: ["#c9b27a", "#8a7a5a"], ShadowClan: ["#2b2830", "#4a4050"],
};

// Other clans' cats: 2 patrol cats walking a loop around the camp (R16), then 4 cats living in the camp (R29)
function buildPatrols() {
  const list = [];
  const campPatterns = ["Tabby", "Spotted", "Calico", "Tuxedo"];
  for (const clan in CLANS) {
    if (clan === clanName) continue;
    for (let i = 0; i < 6; i++) {
      const mode = i < 2 ? "patrol" : "camp";
      const c = { clan, mode, home: campOf(clan), angle: i * Math.PI, hp: PATROL_HP, state: "patrol", heading: 0, walk: 0,
                  moving: false, windup: 0, cooldown: 0, hurtTimer: 0, stagger: 0, fleeTimer: 0, respawn: 0,
                  target: null, timer: i,
                  look: { fur: PATROL_FURS[clan][i % 2], eyes: EYES.Yellow,
                          pattern: mode === "patrol" ? (i ? "Tabby" : "Solid") : campPatterns[i - 2] } };
      if (mode === "camp") {
        const a = i * 1.7;
        Object.assign(c, { x: c.home.x + Math.sin(a) * 3, z: c.home.z + Math.cos(a) * 3 });
      } else {
        Object.assign(c, patrolPoint(c));
      }
      list.push(c);
    }
  }
  return list;
}

function patrolPoint(c) {
  return { x: c.home.x + Math.sin(c.angle) * PATROL_RADIUS, z: c.home.z + Math.cos(c.angle) * PATROL_RADIUS };
}

// A random spot in the open middle of a camp, for cats wandering around it
function campYardSpot(camp) {
  const a = Math.random() * Math.PI * 2;
  const r = 1.5 + Math.random() * (CAMP_YARD - 1.5);
  return { x: camp.x + Math.sin(a) * r, z: camp.z + Math.cos(a) * r };
}

// Huts for every camp (R25); a clan's own huts are its dens (R20)
function buildHuts() {
  const list = [];
  for (const clan in CLANS) {
    const camp = campOf(clan);
    for (const d of DEN_SPOTS) {
      const spot = spotFor(clan, ...d.spot);
      list.push({ id: d.id, name: d.name, clan, x: spot.x, z: spot.z, R: HUT_R,
                  door: Math.atan2(camp.x - spot.x, camp.z - spot.z) });
    }
  }
  return list;
}

// The Highrock and a ring of stones around every camp, with gaps behind the huts (R23)
function buildRocks() {
  const list = [];
  // R48: the trunk of the Great Oak in the middle of the world
  list.push({ kind: "greatoak", clan: null, x: GATHERING_SPOT.x, z: GATHERING_SPOT.z, r: 1.7 });
  for (const clan in CLANS) {
    const camp = campOf(clan);
    const highrock = spotFor(clan, ...HIGHROCK_SPOT);
    list.push({ kind: "highrock", clan, x: highrock.x, z: highrock.z, r: HIGHROCK_R });
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const stone = { kind: "stone", clan, x: camp.x + Math.sin(a) * STONE_RING, z: camp.z + Math.cos(a) * STONE_RING, r: STONE_R };
      const nearHut = DEN_SPOTS.some((d) => distance(stone, spotFor(clan, ...d.spot)) < HUT_R + 2.5);
      if (nearHut || distance(stone, highrock) < HIGHROCK_R + 2.5) continue;
      list.push(stone);
    }
  }
  return list;
}

// The hut whose doorway something is standing in, if any
function doorwayHut(body) {
  return huts.find((h) => Math.abs(distance(body, h) - h.R) < CAT_R + HUT_WALL + 0.2 &&
                          Math.abs(wrapAngle(Math.atan2(body.x - h.x, body.z - h.z) - h.door)) < HUT_DOOR) || null;
}

// The hut something is inside, if any
function insideHut(body) {
  return huts.find((h) => distance(body, h) < h.R - 0.05) || null;
}

// Push something with radius `radius` out of every solid thing: trees, rocks and hut walls (R23, R25).
// Doorways are open for the player. Other cats pass `doorsOpenFor`: only that hut's doorway is open
// to them (null = all doors closed), so a hut is just a round obstacle to walk around.
function pushOutOfObstacles(body, radius, doorsOpenFor) {
  pushOutOfTrees(body, radius);
  for (const r of rocks) {
    const dx = body.x - r.x;
    const dz = body.z - r.z;
    const d = Math.hypot(dx, dz);
    const min = r.r + radius;
    if (d < min && d > 0.0001) {
      body.x = r.x + (dx / d) * min;
      body.z = r.z + (dz / d) * min;
    }
  }
  for (const h of huts) {
    const dx = body.x - h.x;
    const dz = body.z - h.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.0001 || Math.abs(d - h.R) >= radius + HUT_WALL) continue;   // not touching the wall
    const doorOpen = doorsOpenFor === undefined || doorsOpenFor === h;
    if (doorOpen && Math.abs(wrapAngle(Math.atan2(dx, dz) - h.door)) < HUT_DOOR) continue; // in the doorway
    // stay on the side you are on ("inside" means the same here as in insideHut, so there is no gap between them)
    const keep = d < h.R - 0.05 ? h.R - radius - HUT_WALL : h.R + radius + HUT_WALL;
    body.x = h.x + (dx / d) * keep;
    body.z = h.z + (dz / d) * keep;
  }
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
  if (playing && ui.menu) {
    // The main menu pauses the game (R26); after a game over it can't be closed (R37)
    if (pressed.Escape && !ui.gameOver) ui.menu = false;
  } else if (playing && !choosingRole && !choosingMentor && !pendingChoice) {
    updateMenusKeys();
    updateDay(dt);
    updateWeather(dt);
    if (fishing.active) updateFishing(dt);
    else updatePlayer(dt);
    updateMarkers();
    updateFood(dt);
    updateCritter(squirrel, dt);
    prey.forEach((p) => updateCritter(p, dt));
    if (rogueActive() || rogue.state === "fighting") updateRogue(dt);
    patrols.forEach((c) => updatePatrol(c, dt));
    updateCampCats(dt);
    updateKits(dt);
    updateHerbs(dt);
    updateDropped(dt);
    updatePile();
    updateLeaders(dt);
    updateSocial(dt);
    updateLeaderEvents(dt);
    updateMissions(dt);
    updateRivalry(dt);
    updateMedicineCats(dt);
    if (stage === 2) updateClanmates(dt);
    updateCamera(dt);
  }
  if (hooks.afterUpdate) hooks.afterUpdate();
  for (const k in pressed) delete pressed[k];
}

// Esc: main menu (R26; while fishing, Esc stops fishing instead). M: map (R15).
// H: herb pouch (R18); while it is open, 1 and 2 use herbs.
function updateMenusKeys() {
  if (pressed.Escape && !fishing.active) ui.menu = true;
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
  player.dropTimer = Math.max(0, player.dropTimer - dt);
  player.eatTimer = Math.max(0, player.eatTimer - dt);
  player.lifeShield = Math.max(0, player.lifeShield - dt);
  player.splashTimer = Math.max(0, (player.splashTimer || 0) - dt);
  // R46: how long the cat has stood still (for sitting and lying down)
  const busy = isDown("KeyW", "ArrowUp", "KeyS", "ArrowDown", "KeyA", "ArrowLeft", "KeyD", "ArrowRight", "Space") ||
               Object.keys(pressed).length > 0 || !player.onGround;
  player.idleTime = busy ? 0 : player.idleTime + dt;

  if (stage === 2 && role === "Leader" && !ui.pouch) {
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
    pushOutOfObstacles(player, CAT_R);
    keepInWorld(player);
    keepKitInCamp();
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
  const depth = onSteppingStone(player) ? null : waterDepthAt(player.x, player.z);
  if (depth === "deep") speed *= clan.swim;               // swimming (R6)
  else if (depth === "shallow") speed *= WADE_SPEED;     // wading in the shallows (R59)

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
  pushOutOfObstacles(player, CAT_R);
  keepKitInCamp();

  // R8: moving uses food, running twice as much per distance
  const moved = Math.hypot(player.x - oldX, player.z - oldZ);
  player.food = Math.max(0, player.food - moved * FOOD_PER_UNIT * (player.running ? 2 : 1));
  if (player.moving) player.walk += moved * 3 / catSize();
  // R59: the current carries swimmers downstream, and walking into the water splashes
  if (swimming(player) && player.onGround) {
    player.z -= CURRENT_SPEED * dt;
    keepInWorld(player);
  }
  const wet = inRiver(player.x, player.z) && !onSteppingStone(player);
  if (wet && !player.wasWet) {
    player.splashTimer = 0.6;
    playSound("splash");
  }
  player.wasWet = wet;
  pushPlayerOutOfCats();   // R58: cats are solid

  // Jumping and falling
  if (wasPressed("Space") && player.onGround && !player.crouching) {
    player.vy = JUMP_SPEED;
    player.onGround = false;
  }
  updateFalling(dt);

  if (pressed.KeyC) tryDodge();
  else if (pressed.KeyF) tryPounceAttack();
  else if (pressed.KeyR) tryBite();
  else if (pressed.KeyG) dropPrey();
  else if (pressed.KeyE) doAction();
}

// R42: a kit can't go past the camp boundary
function keepKitInCamp() {
  if (stage !== 0) return;
  const d = distance(player, CAMP);
  if (d <= KIT_BOUNDARY) return;
  player.x = CAMP.x + (player.x - CAMP.x) * (KIT_BOUNDARY / d);
  player.z = CAMP.z + (player.z - CAMP.z) * (KIT_BOUNDARY / d);
  if (time - boundaryWarned > 2) {
    boundaryWarned = time;
    say("Kits must stay in camp! Hunt the beetles and mice in here.", 2);
  }
}

// R32: moving the mouse turns the cat (left/right) and tilts the camera (up/down)
function lookWithMouse(dx, dy) {
  player.heading -= dx * MOUSE_SPEED;
  player.camHeading -= dx * MOUSE_SPEED;   // the camera follows the mouse at once
  player.camPitch = clamp(player.camPitch - dy * MOUSE_SPEED, CAM_PITCH_MIN, CAM_PITCH_MAX);
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
  // R64: catch a bird perched at your height in this tree, and the mentor's climbing task
  if (pressed.KeyE) {
    const bird = prey.find((p) => p.perch && p.perch.tree === tree && critterVisible(p) && Math.abs(p.perch.y - player.y) < 1);
    if (bird) catchPrey(bird);
  }
  if (currentTask() === "climb" && player.y >= CLIMB_TASK_HEIGHT) finishTask("You can see our whole territory from up there!");
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
    if (player.hp <= 0) knockedOut("You are starving and faint... Your clanmates carry you back to camp. Eat something!");
  }
}

// Health has reached 0: a leader loses one of its nine lives (R37), anyone else faints
function knockedOut(faintText) {
  if (role !== "Leader") {
    faint(faintText);
    return;
  }
  player.lives--;
  if (player.lives <= 0) {
    // R37: the ninth life is gone - game over
    player.hp = 0;
    ui.menu = true;
    ui.gameOver = true;
    say("You have lost all nine lives. Your time as leader is over.", 6);
    return;
  }
  player.hp = 100;
  player.lifeShield = LIFE_SHIELD;
  player.hurtTimer = 0;
  say(`You lose a life! StarClan sends you back. ${player.lives} ${player.lives === 1 ? "life" : "lives"} left.`, 3);
}

function faint(text) {
  say(text, 3);
  Object.assign(player, {
    x: CAMP.x, z: CAMP.z + 1, y: 0, vy: 0, onGround: true, climbing: null, running: false, scenting: false,
    hp: 100, food: Math.max(player.food, 50), hurtTimer: 0, dodgeTimer: 0, recover: 0, turnVel: 0,
  });
  snapCamera();
  fishing.active = false;
  if (rogue.state === "fighting" && rogue.smart) {
    // R62: a pack goes back to roaming
    Object.assign(rogue, { state: "roaming", windup: 0, raiding: false, raidClock: 0, target: null });
    rogueMates.forEach((m) => { m.state = "roaming"; m.windup = 0; });
  } else   if (rogue.state === "fighting") {
    const home = stage === 1 ? ROGUE_HOME : ROGUE_SPAWNS[rogueSpawn % ROGUE_SPAWNS.length];
    Object.assign(rogue, { x: home.x, z: home.z, hp: ROGUE_HP, windup: 0, cooldown: 0, stagger: 0, state: "waiting" });
  }
  patrols.forEach((c) => { if (c.state === "fighting") c.state = "patrol"; });
}

// E does whatever fits where the cat is: fight, use the camp, pick herbs, catch prey or fish
function doAction() {
  if (enemyInFront(2.2, 0.35)) trySwipe();
  else if (trySparring()) return;
  else if (tryInteract()) return;
  else if (preyInReach()) catchPrey(preyInReach());
  else if (tryTalk()) return;
  else if (stage >= 1 && nearRiver(player.x, player.z)) tryFishing();
  else if (currentTask() === "fish") say("Find the river or the stream in your territory first.", 1.5);
  else if (stage === 0) pounceMiss();
  else trySwipe();
}

// ======================================================
// Hunting (R4, R13): the squirrel, beetles and mice
// ======================================================
// slot: a number per critter, used by the weather to decide who comes out in the rain (R30)
function makeCritter(kind, slot) {
  const c = { kind, slot, state: "idle", timer: Math.random() * 2, dirX: 0, dirZ: 1, hop: 0, respawn: 0, trail: [], trailTimer: 0 };
  Object.assign(c, preySpot());
  return c;
}

// Kits hunt inside the camp (R42); everyone else hunts out in the territory
function preySpot() {
  return stage === 0 ? campPreySpot() : randomHomeSpot();
}

// Somewhere in the open part of the camp, away from huts, rocks and the fresh-kill pile
function campPreySpot() {
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 2 + Math.random() * (KIT_BOUNDARY - 3);
    const s = { x: CAMP.x + Math.sin(a) * r, z: CAMP.z + Math.cos(a) * r };
    if (insideHut(s) || distance(s, FRESH_KILL) < 2) continue;
    pushOutOfObstacles(s, 0.3, null);
    if (distance(s, CAMP) <= KIT_BOUNDARY - 0.5) return s;
  }
  return { x: CAMP.x + 1, z: CAMP.z - 2 };
}

// Somewhere in your territory, away from camp and water
function randomHomeSpot() {
  let spot = spotFor(clanName, 30, 30);
  for (let i = 0; i < 30; i++) {
    const s = spotFor(clanName, -52 + Math.random() * 104, -52 + Math.random() * 104);
    if (distance(s, CAMP) < CAMP_CLEARING || nearRiver(s.x, s.z)) continue;
    spot = s;
    break;
  }
  pushOutOfObstacles(spot, 0.3);
  return spot;
}

// Keep prey where it belongs: in the camp for kits (R42), otherwise in your territory and out of the water
function keepCritterHome(c) {
  if (stage === 0 && c !== squirrel) {
    const d = distance(c, CAMP);
    if (d > KIT_BOUNDARY - 0.5) {
      c.x = CAMP.x + (c.x - CAMP.x) * ((KIT_BOUNDARY - 0.5) / d);
      c.z = CAMP.z + (c.z - CAMP.z) * ((KIT_BOUNDARY - 0.5) / d);
    }
    return;
  }
  keepInTerritory(c, clanName);
  for (const w of watersAt(c.z)) {
    if (c.x > w.x0 - 1 && c.x < w.x1 + 1) c.x = c.x < (w.x0 + w.x1) / 2 ? w.x0 - 1 : w.x1 + 1;
  }
}

function critterVisible(c) {
  return c.state === "idle" || c.state === "hopping";
}

function allCritters() {
  return [squirrel, ...prey];
}

// R30: rain keeps half the prey hidden and a thunderstorm keeps all of it hidden.
// Squirrels never come into the camp for kits (R42).
function preyAllowed(c) {
  if (stage === 0 && (c === squirrel || !KIT_PREY.includes(c.kind))) return false;   // only beetles and mice come into camp
  if (weather === "storm") return false;
  if (weather === "rain" || season() === "leaf-bare") return (c.slot || 0) % 2 === 0;   // leaf-bare: R69
  return true;
}

// The nearest prey in front of the cat that it can reach
function preyInReach() {
  let best = null;
  let bestDist = Infinity;
  for (const c of allCritters()) {
    if (c.perch) continue;   // perched birds are caught from up the tree (R64)
    if (!critterVisible(c) || !inFront(player, player.heading, c, PREY_KINDS[c.kind].reach, 0.5)) continue;
    const d = distance(player, c);
    if (d < bestDist) {
      best = c;
      bestDist = d;
    }
  }
  return best;
}

// R47: the leader's big hunt - a hare appears and the clanmates surround it
function startBigHunt() {
  prey = prey.filter((p) => p.kind !== "hare");
  // Somewhere about 15 away from the cat, on the side away from camp
  const away = Math.atan2(player.x - CAMP.x, player.z - CAMP.z);
  const spot = { x: player.x + Math.sin(away) * 15, z: player.z + Math.cos(away) * 15 };
  keepInTerritory(spot, clanName);
  pushOutOfObstacles(spot, 0.4, null);
  const hare = makeCritter("hare", 0);
  Object.assign(hare, spot, { state: "idle", timer: 2 });
  keepCritterHome(hare);
  prey.push(hare);
  say("Big hunt! A hare is near. Your clanmates will surround it - then go in and catch it (E).", 4);
}

function theHare() {
  return prey.find((p) => p.kind === "hare") || null;
}

// The three clanmates stand around the hare, leaving the side toward the leader open
function hareSurrounded() {
  const hare = theHare();
  return !!hare && clanmates.length === 3 && clanmates.every((c) => distance(c, hare) < 5);
}

function catchPrey(c) {
  if (c.kind === "hare") {
    player.attackTimer = 0.3;
    prey = prey.filter((p) => p !== c);
    addToPile("hare", BIG_HUNT_PIECES);
    giveOrder("follow");
    say(`You caught the hare! The clan will eat well: ${BIG_HUNT_PIECES} pieces on the fresh-kill pile.`, 4);
    if (stage === 2 && role) {
      stats.hunts++;
      checkPromotion();
    }
    return;
  }
  player.attackTimer = 0.3;
  const name = PREY_KINDS[c.kind].name;
  c.state = "hidden";
  c.respawn = respawnTime(c === squirrel ? 4 : PREY_RESPAWN);   // greenleaf: R69

  // Eat it, or carry it to the fresh-kill pile if you are full (beetles are always eaten)
  let carried = false;
  if (c.kind !== "beetle" && player.food >= 100 && !player.carrying) {
    player.carrying = c.kind;
    carried = true;
  } else {
    eat(PREY_FOOD[c.kind]);
    player.eatTimer = 1;   // R46: eating animation
    playSound("crunch");   // R61
  }

  if (stage === 0) {
    kitCaught(c.kind);
  } else if (c === squirrel && currentTask() === "squirrel") {
    finishTask("You caught the squirrel! Well stalked.");
  } else if (stage === 2 && role && c.kind === "beetle" && ++stats.beetles % BEETLES_PER_PREY === 0) {
    // R69c: every 4 beetles count as 1 prey
    stats.hunts++;
    say(`${BEETLES_PER_PREY} beetles make a meal - that counts as prey! (prey caught: ${stats.hunts})`, 2);
    checkPromotion();
  } else if (stage === 2 && role && c.kind !== "beetle") {
    stats.hunts++;
    say(`You caught a ${name}! (prey caught: ${stats.hunts})`, 2);
    checkPromotion();
  } else {
    say(carried ? `You carry the ${name} in your mouth. Take it to the fresh-kill pile in camp.` : `You caught a ${name}!`, 2);
  }
}

// R45: a kit's catches count toward its mix of 5 beetles and 3 mice
function kitCaught(kind) {
  if (kitCatches[kind] !== undefined && kitCatches[kind] < KIT_NEEDS[kind]) kitCatches[kind]++;
  if (kitCatches.beetle >= KIT_NEEDS.beetle && kitCatches.mouse >= KIT_NEEDS.mouse) {
    becomeApprentice();
  } else {
    say(`You caught a ${kind}! Beetles ${kitCatches.beetle}/${KIT_NEEDS.beetle}, mice ${kitCatches.mouse}/${KIT_NEEDS.mouse}.`, 2);
  }
}

// Missed pounce as a kit: leap forward a little
function pounceMiss() {
  player.attackTimer = 0.3;
  if (player.onGround) {
    player.vy = 3.5;
    player.onGround = false;
    player.x += Math.sin(player.heading) * 0.5;
    player.z += Math.cos(player.heading) * 0.5;
    keepKitInCamp();
  }
}

function scareCritter(c) {
  c.state = "fleeing";
  const dx = c.x - player.x;
  const dz = c.z - player.z;
  const d = Math.hypot(dx, dz) || 1;
  c.dirX = dx / d;
  c.dirZ = dz / d;
  if (c === squirrel && currentTask() === "squirrel") say("The squirrel heard you! Hold Shift to stalk slowly.", 2);
}

function respawnCritter(c) {
  if (c.perch) {
    // R64: a perched bird comes back in another tree
    const own = trees.filter((t) => territoryAt(t.x, t.z) === clanName);
    perchOn(c, own.length ? own[Math.floor(Math.random() * own.length)] : c.perch.tree);
    c.trail = [];
    return;
  }
  if (c === squirrel) {
    // Come back somewhere 12-20 units from the player
    const angle = Math.random() * Math.PI * 2;
    const d = 12 + Math.random() * 8;
    c.x = player.x + Math.sin(angle) * d;
    c.z = player.z + Math.cos(angle) * d;
    keepCritterHome(c);
    pushOutOfObstacles(c, 0.3, null);
  } else {
    Object.assign(c, preySpot());
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
    c.state = "hidden";
    c.respawn = 4;
    return;
  }
  if (c.state === "hidden") {
    if (!preyAllowed(c)) return;   // stays hidden while the weather (or the camp) keeps it away
    c.respawn -= dt;
    if (c.respawn <= 0) respawnCritter(c);
    return;
  }
  if (!preyAllowed(c)) {
    // Weather sends it into hiding (R30)
    c.state = "hidden";
    c.respawn = 2;
    return;
  }
  if (c.perch) return;   // R64: perched birds sit still in their tree
  recordTrail(c, dt);

  // R56: prey in camp is slower and less wary for kits
  const kitCamp = stage === 0 && c !== squirrel;
  const speed = kitCamp ? KIT_PREY_SPEED : 1;

  if (c.state === "fleeing") {
    c.x += c.dirX * kind.flee * speed * dt;
    c.z += c.dirZ * kind.flee * speed * dt;
    keepCritterHome(c);
    c.hop += dt * 14;
    if (distance(c, player) > kind.hideDist || territoryAt(c.x, c.z) !== clanName ||
        (stage === 0 && distance(c, CAMP) >= KIT_BOUNDARY - 0.6)) {
      c.state = "hidden";
      c.respawn = respawnTime(kind.hideTime);
    }
    return;
  }

  // Notice the player if they get too close without stalking
  // R47: a hare surrounded by your clanmates on a big hunt has nowhere to run, so it just crouches
  if (c.kind === "hare" && hareSurrounded()) {
    c.state = "idle";
    c.timer = 1;
    return;
  }
  const radius = (player.crouching ? kind.stalkNotice : kind.notice) * stealthMult() * (kitCamp ? KIT_PREY_WARINESS : 1);
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
    c.x += c.dirX * kind.wander * speed * dt;
    c.z += c.dirZ * kind.wander * speed * dt;
    keepCritterHome(c);
    pushOutOfObstacles(c, 0.3);
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
// Fishing in 3D (R35): crouch at the bank and swipe when a fish swims under your paw
// ======================================================
// Which water (0 = river, 1 = stream) is nearest to x at this z
function waterNear(x, z) {
  const list = watersAt(z);
  const mid = (w) => Math.abs(x - (w.x0 + w.x1) / 2);
  return mid(list[0]) <= mid(list[1]) ? 0 : 1;
}

// Where the cat's paw reaches into the water
function pawSpot() {
  return { x: player.x + Math.sin(player.heading) * 1.4, z: player.z + Math.cos(player.heading) * 1.4 };
}

// How close a fish must be to the paw; RiverClan reaches further (R6)
function pawReach(clan) {
  return PAW_REACH * CLANS[clan || clanName].fishZone;
}

function tryFishing() {
  if (!nearRiver(player.x, player.z)) {
    say("Find the river or the stream in your territory first.", 1.5);
    return;
  }
  const which = waterNear(player.x, player.z);
  const w = watersAt(player.z)[which];
  // Face the water
  player.heading = player.x < (w.x0 + w.x1) / 2 ? Math.PI / 2 : -Math.PI / 2;
  snapCamera();
  const paw = pawSpot();
  fishing.fish = [];
  for (let i = 0; i < FISH_COUNT; i++) {
    const fz = paw.z + (Math.random() - 0.5) * 8;
    const fw = watersAt(fz)[which];
    fishing.fish.push({ x: fw.x0 + 0.4 + Math.random() * (fw.x1 - fw.x0 - 0.8), z: fz,
                        heading: Math.random() * Math.PI * 2, speed: 0.6 + Math.random() * 0.5, dart: 0, turn: 0 });
  }
  Object.assign(fishing, { active: true, catches: 0, flash: 0, flashGood: false, water: which });
  player.moving = false;
  player.running = false;
  player.scenting = false;
  player.turnVel = 0;
  player.crouching = true;
  const goal = currentTask() === "fish" ? ` Catch ${FISH_FOR_TASK}.` : "";
  say(`Watch the water and press E when a fish swims under your paw!${goal}`, 2.5);
}

function stopFishing() {
  fishing.active = false;
  player.crouching = false;
}

// Fish swim about in the water near the cat, and dart away after a splash
function updateFish(dt) {
  const paw = pawSpot();
  for (const f of fishing.fish) {
    const w = watersAt(f.z)[fishing.water];   // the water's edges where this fish is (R74)
    f.dart = Math.max(0, f.dart - dt);
    f.turn -= dt;
    if (f.turn <= 0) {
      f.heading += (Math.random() - 0.5) * 2;
      f.turn = 0.8 + Math.random() * 1.5;
    }
    const speed = f.dart > 0 ? 3 : f.speed;
    f.x += Math.sin(f.heading) * speed * dt;
    f.z += Math.cos(f.heading) * speed * dt;
    // Stay in the water, and within a few units of the cat
    if (f.x < w.x0 + 0.3 || f.x > w.x1 - 0.3) { f.x = clamp(f.x, w.x0 + 0.3, w.x1 - 0.3); f.heading = -f.heading; }
    if (Math.abs(f.z - paw.z) > 5) { f.z = paw.z + Math.sign(f.z - paw.z) * 5; f.heading = Math.PI - f.heading; }
  }
}

function updateFishing(dt) {
  if (pressed.Escape) {
    stopFishing();
    return;
  }
  fishing.flash = Math.max(0, fishing.flash - dt);
  if (pressed.KeyE) swipeAtFish();
  if (fishing.active) updateFish(dt);
}

function swipeAtFish() {
  const paw = pawSpot();
  fishing.flash = 0.4;
  const fish = fishing.fish.find((f) => distance(f, paw) < pawReach());
  fishing.flashGood = !!fish;
  if (!fish) {
    // Splash! Nearby fish dart away from the paw
    for (const f of fishing.fish) {
      if (distance(f, paw) < 2.5) {
        f.dart = 1;
        f.heading = Math.atan2(f.x - paw.x, f.z - paw.z);
      }
    }
    return;
  }
  fishing.catches++;
  // The caught fish is replaced by a new one further along the water
  fish.z = paw.z + (Math.random() < 0.5 ? -4 : 4);
  fish.dart = 0;
  if (player.food >= 100 && !player.carrying) {
    player.carrying = "fish";
  } else {
    eat(PREY_FOOD.fish);
    player.eatTimer = 1;
    playSound("crunch");
  }
  if (currentTask() === "fish") {
    if (fishing.catches >= FISH_FOR_TASK) {
      stopFishing();
      finishTask("Three fish! You'll make a fine hunter.");
    } else {
      say(`You caught a fish! (${fishing.catches}/${FISH_FOR_TASK})`, 1.5);
    }
    return;
  }
  // Each fish is one more piece of prey
  stopFishing();
  if (stage === 2 && role) {
    stats.hunts++;
    say(`You caught a fish! (prey caught: ${stats.hunts})`, 2);
    checkPromotion();
  } else {
    say("You caught a fish!", 2);
  }
}

// ======================================================
// Fighting (R4, R16, R17): the rogue and other clans' patrols
// ======================================================
function fightingEnemies() {
  return [rogue, ...rogueMates, ...patrols, ...raiders].filter((e) => e.state === "fighting");
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
  if (e.clan && rivalry[e.clan] !== undefined) changeRivalry(e.clan, 5);   // R54
  e.state = "fleeing";
  e.fleeTimer = 3;
  if (stage === 2 && role) {
    stats.fights++;
    say(`The ${e.clan} cat runs home! (fights won: ${stats.fights})`, 2.5);
    checkPromotion();
  } else {
    say(`The ${e.clan} cat runs home!`, 2);
  }
}

// Swipe (E): quick and weak, anyone can do it
function trySwipe() {
  if (player.attackCooldown > 0) return;
  player.attackCooldown = 0.4;
  player.attackTimer = 0.25;
  playSound("swish");   // R61
  const e = enemyInFront(2, 0.35);
  if (!e) return;
  if (!playerHits(e, SWIPE_DAMAGE * damageMult())) return;   // R62: a smart rogue may sidestep
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
  if (stage < 1) {
    say("Kits are too small to pounce-attack. Swipe (E) and dodge (C)!", 2);
    return;
  }
  if (!player.onGround) return;
  player.x += Math.sin(player.heading) * 2;
  player.z += Math.cos(player.heading) * 2;
  keepInWorld(player);
  pushOutOfObstacles(player, CAT_R);
  player.vy = 3;
  player.onGround = false;
  player.attackTimer = 0.3;
  pushPlayerOutOfCats();   // R58: you land next to the cat you pounced on, not inside it
  player.recover = POUNCE_RECOVER;
  playSound("swish");
  const e = enemyInFront(2.2, 0.3);
  if (e && playerHits(e, POUNCE_DAMAGE * damageMult())) e.stagger = Math.max(e.stagger, POUNCE_STAGGER);
}

// Bite (R): stronger than a swipe, double damage on a staggered enemy
function canBite() {
  return (stage === 2 && role !== null) || (stage === 1 && mentor === "fighter");
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
  playSound("swish");
  if (e) playerHits(e, BITE_DAMAGE * damageMult() * (e.stagger > 0 ? 2 : 1));
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
  // R64: you are up a tree it can't climb, so it waits at the bottom
  if (outOfReach(e)) {
    e.windup = 0;
    if (dist > 1.6) moveToward(e, player, 3, dt);
    return;
  }
  if (e.windup > 0) {
    e.windup -= dt;
    if (e.windup <= 0) {
      e.cooldown = 1.1;
      if (dist < 1.8) hurtPlayer(e.damage || 14, e);
    }
  } else if (dist > 1.3) {
    moveToward(e, player, 4, dt);   // walks around trees and rocks (R23)
  } else if (e.cooldown <= 0) {
    e.windup = 0.45;
  } else if (e.smart) {
    // R62: a smart rogue circles you between attacks
    const around = Math.atan2(e.x - player.x, e.z - player.z) + 0.6;
    const spot = { x: player.x + Math.sin(around) * 1.5, z: player.z + Math.cos(around) * 1.5 };
    moveToward(e, spot, 2.5, dt);
    e.heading = Math.atan2(player.x - e.x, player.z - e.z);
  }
}

function beatRogue() {
  rogue.state = "fleeing";
  rogue.fleeTimer = 3;
  rogueMates.forEach((m) => { m.state = "fleeing"; m.fleeTimer = 3; });   // R62: the whole pack runs
  if (currentTask() === "rogue") {
    finishTask("The rogue runs for its life! You fought bravely.");
  } else if (stage === 2 && role) {
    stats.fights++;
    say(`The rogue runs away! (fights won: ${stats.fights})`, 2.5);
    checkPromotion();
  }
}

function updateRogue(dt) {
  const r = rogue;
  r.hurtTimer = Math.max(0, r.hurtTimer - dt);
  r.stagger = Math.max(0, r.stagger - dt);
  updateRoguePack(dt);   // R62: the rest of a pack, and a roaming pack

  if (r.state === "gone") {
    if (stage < 2) return;
    // R9, R62: a new rogue pack comes some time after the last one ran away
    r.respawn -= dt;
    if (r.respawn <= 0) {
      rogueSpawn++;
      spawnRoguePack(ROGUE_SPAWNS[rogueSpawn % ROGUE_SPAWNS.length]);
    }
    return;
  }
  if (r.state === "roaming") return;   // handled by updateRoguePack

  if (r.state === "fleeing") {
    // Run straight away from camp
    const away = Math.atan2(r.x - CAMP.x, r.z - CAMP.z);
    r.heading = away;
    r.x += Math.sin(away) * 8 * dt;
    r.z += Math.cos(away) * 8 * dt;
    pushOutOfObstacles(r, CAT_R);
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
    playSound("hiss");   // R61
    say("A rogue! Chase it off your clan's territory! E swipe, C dodge, F pounce, R bite.", 3);
  }
  fightStep(r, dt);
}

// R16: other clans' patrols walk around their camps and attack cats on their land
function updatePatrol(c, dt) {
  c.hurtTimer = Math.max(0, c.hurtTimer - dt);
  c.stagger = Math.max(0, c.stagger - dt);

  if (c.state === "resting") {
    // R69b: limps home and lies down to rest until its medicine cat treats it
    if (distance(c, c.home) > 4) moveToward(c, c.home, 2, dt);
    else c.moving = false;
    c.restTime = (c.restTime || 0) + dt;
    c.respawn -= dt;
    if (c.respawn <= 0) Object.assign(c, { state: "patrol", hp: PATROL_HP }, c.mode === "camp" ? campYardSpot(c.home) : patrolPoint(c));
    return;
  }
  if (c.state === "fleeing") {
    moveToward(c, c.home, 7, dt);
    c.fleeTimer -= dt;
    if (c.fleeTimer <= 0) {
      c.state = "resting";
      c.respawn = PATROL_RECOVER;
      c.restTime = 0;
    }
    keepInTerritory(c, c.clan);
    return;
  }

  // They only go for you on their own land, and never near the Great Oak (R48) or while you carry them
  // a message (R49)
  const playerOnTheirLand = territoryAt(player.x, player.z) === c.clan && !truceWith(c.clan);
  if (c.state === "patrol") {
    if (c.mode === "camp" || weather === "storm") {
      // R29: camp cats wander around their camp, and defend it (R30: in a storm the patrols stay home too)
      c.timer -= dt;
      if (c.timer <= 0 || !c.target) {
        c.target = campYardSpot(c.home);
        c.timer = 3 + Math.random() * 4;
      }
      moveToward(c, c.target, distance(c, c.home) > 8 ? 5 : 1.5, dt);
    } else {
      c.angle += dt * 0.12;
      moveToward(c, patrolPoint(c), 2.5, dt);
    }
    // R54: friendly clans warn you off; hostile ones spot you from further away
    const sight = rivalry[c.clan] >= RIVALRY_HOSTILE ? HOSTILE_SIGHT : PATROL_SIGHT;
    if (playerOnTheirLand && distance(c, player) < sight && rivalry[c.clan] < RIVALRY_FRIENDLY) {
      if (time - warnedAt > 5) {
        warnedAt = time;
        say(`A ${c.clan} cat warns you off their territory. They are friendly with your clan, for now.`, 2.5);
      }
    } else if (playerOnTheirLand && distance(c, player) < sight) {
      playSound("hiss");   // R61
      c.state = "fighting";
      c.windup = 0;
      say(c.mode === "camp" ? `${c.clan} cats defend their camp!` : `A ${c.clan} patrol attacks! You are on their territory.`, 2.5);
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
  if (player.dodgeTimer > 0 || player.lifeShield > 0) return;   // dodged (R17), or a leader just lost a life (R37)
  if (from && outOfReach(from)) return;                        // safe up a tree (R64)
  player.hp -= amount;
  player.hurtTimer = 0.3;
  player.x += Math.sin(from.heading) * 1;
  player.z += Math.cos(from.heading) * 1;
  pushOutOfObstacles(player, CAT_R);
  if (player.hp <= 0) knockedOut("You were beaten... You wake up back at camp. Rest, then try again.");
}

// ======================================================
// Levelling up, mentors and roles (R9, R19)
// ======================================================
// R45: the kit has caught its mix and becomes an apprentice (R41: -paw), then chooses a mentor
function becomeApprentice() {
  stage = 1;
  player.hp = 100;
  taskIndex = 0;
  markersVisited = 0;
  say(`You are now ${fullName()}, an apprentice of ${clanName}! Choose a mentor.`, 3.5);
  choosingMentor = true;   // script.js shows the mentor buttons
  clearKeys();
  // Prey goes back out into the territory, and squirrels come out for apprentices
  prey.forEach((p) => { p.state = "hidden"; p.respawn = 1 + Math.random() * 3; });
  squirrel.state = "hidden";
  squirrel.respawn = 3;
}

// What the mentor says when giving each task (R44)
const TASK_TEXT = {
  patrol: "We'll walk the border. Visit the 3 border markers in order. Follow me!",
  squirrel: "Now show me how you hunt. Stalk a squirrel (hold Shift) and pounce with E.",
  climb: "A warrior must climb. Walk into a tree trunk, climb up and look out over our territory.",
  fish: "Come to the water. Catch 3 fish: press E when one swims under your paw.",
  rogue: "A rogue is on our territory. Chase it off! E swipe, C dodge, F pounce, R bite.",
};

// R44: the mentor announces the next task
function giveTask() {
  const task = currentTask();
  if (task) say(`${mentorName()}: ${TASK_TEXT[task]}`, 4);
}

// R45: one of the mentor's tasks is done; move on to the next, or end the apprenticeship
function finishTask(text) {
  taskIndex++;
  markersVisited = 0;
  if (taskIndex < APPRENTICE_TASKS.length) {
    say(`${mentorName()}: ${text} ${TASK_TEXT[APPRENTICE_TASKS[taskIndex]]}`, 4.5);
    if (APPRENTICE_TASKS[taskIndex] === "squirrel") {
      squirrel.state = "hidden";
      squirrel.respawn = 1;
    }
    return;
  }
  // Apprenticeship finished: choose a path (R43)
  stage = 2;
  player.hp = 100;
  say(`${mentorName()}: ${text} Your apprenticeship is over. Choose your path.`, 4);
  choosingRole = true;     // script.js shows the role buttons
  clearKeys();
}

// The place the current task happens, for the mentor to lead the way to (R44)
function taskSpot() {
  const task = currentTask();
  if (task === "patrol") return BORDER_MARKERS[markersVisited];
  if (task === "squirrel") return critterVisible(squirrel) ? squirrel : spotFor(clanName, 20, 25);
  if (task === "climb") {
    // R64: the nearest tree in your territory
    const own = trees.filter((t) => territoryAt(t.x, t.z) === clanName);
    return own.sort((a, b) => distance(a, player) - distance(b, player))[0] || spotFor(clanName, 20, 25);
  }
  if (task === "fish") return { x: watersAt(CAMP.z)[CAMP.x > 0 ? 0 : 1].x0 - 1, z: CAMP.z };
  if (task === "rogue") return ROGUE_HOME;
  return null;
}

// The rogue only shows up for the apprentice's rogue task, and for full clan cats (R44)
function rogueActive() {
  return stage === 2 || currentTask() === "rogue";
}

// Border markers (R45): visited in order by an apprentice (its first task), by a warrior (to become
// deputy), and by a deputy with its own apprentice (the last lesson)
function updateMarkers() {
  const patrolling = currentTask() === "patrol" || (stage === 2 && role !== "Medicine cat" && role !== "Leader");
  if (!patrolling) return;
  const next = BORDER_MARKERS[markersVisited];
  if (!next || distance(player, next) > MARKER_RADIUS) return;
  markersVisited++;
  if (markersVisited < BORDER_MARKERS.length) {
    say(`Border marker ${markersVisited} of ${BORDER_MARKERS.length}.`, 1.5);
    return;
  }
  markersVisited = 0;
  if (currentTask() === "patrol") {
    finishTask("Good, now you know our borders.");
    return;
  }
  stats.patrols++;
  if (trainee && trainee.lesson === "patrol") finishTraining();
  else say("You finished a border patrol.", 2);
  checkPromotion();
}

function clearKeys() {
  player.running = false;
  player.turnVel = 0;
  for (const k in keys) keys[k] = false;
}

function chooseMentor(id) {
  const m = MENTORS.find((x) => x.id === id);
  if (!m || stage !== 1 || mentor !== null) return;
  mentor = id;
  choosingMentor = false;
  taskIndex = 0;
  giveTask();   // R44: the mentor gives the first task straight away
}

function mentorName() {
  const m = MENTORS.find((x) => x.id === mentor);
  return m ? m.name : null;
}

// R43: at the end of the apprenticeship, warrior or medicine cat. R40: the leader gives a warrior name.
function chooseRole(choice) {
  if (stage !== 2 || role !== null || !ROLES.includes(choice)) return;
  role = choice;
  choosingRole = false;
  warriorSuffix = WARRIOR_SUFFIXES[Math.floor(Math.random() * WARRIOR_SUFFIXES.length)];
  resetStats();
  markersVisited = 0;
  const ceremony = `${ownLeaderName()}, your clan leader, calls the clan together from the Highrock: "From this day on you will be known as ${fullName()}."`;
  if (role === "Medicine cat") {
    // R57: you start as Thymeleaf's apprentice, with a collecting quest
    medRank = 0;
    giveMedQuest(`${MEDICINE_NAMES.own}: Welcome, ${fullName()}. The clan leader has named you, and you are my medicine cat apprentice now. `);
  } else {
    say(`${ceremony} To become deputy: catch ${DEPUTY_NEEDS.hunts} prey, win ${DEPUTY_NEEDS.fights} fights ` +
        `and lead a border patrol.`, 6);
  }
}

// R45: warriors become deputy, deputies become leader, when they have done enough
function checkPromotion() {
  if (role === "Warrior") {
    const need = DEPUTY_NEEDS;
    if (stats.hunts >= need.hunts && stats.fights >= need.fights && stats.patrols >= need.patrols) promote("Deputy");
  } else if (role === "Deputy") {
    const need = LEADER_NEEDS;
    if (stats.hunts >= need.hunts && stats.fights >= need.fights && stats.trained >= need.trained &&
        stats.missions >= need.missions) promote("Leader");
  }
}

function promote(newRole) {
  role = newRole;
  resetStats();
  markersVisited = 0;
  if (newRole === "Deputy") {
    missionIndex = 0;
    startMission();   // R49: the first mission comes straight away
    const missionText = lastMessage;
    // R36, R39: one of the camp's kits becomes the new deputy's apprentice
    trainee = kits.find((k) => k.clan === clanName && k.lesson === null) || null;
    if (trainee) {
      trainee.name = trainee.baseName + "paw";
      trainee.size = 0.8;
      trainee.lesson = "hunt";
      trainee.lessonCount = 0;
    }
    say(`You are now deputy of ${clanName}! ${trainee ? trainee.name + " is your apprentice. " : ""}` +
        `To become leader: catch ${LEADER_NEEDS.hunts} prey, win ${LEADER_NEEDS.fights} fights, train your apprentice ` +
        `and complete a mission. First lesson: take it hunting. ${missionText}`, 8);
    return;
  }
  // Leader (R37: nine lives; R9: three clanmates to give orders to)
  const old = leaders.find((l) => l.clan === clanName);   // R69a: the old leader retires to the elders' den
  if (old) old.retired = true;
  if (trainee) {
    // An apprentice still in training finishes as a warrior when its mentor becomes leader
    trainee.lesson = "done";
    trainee.name = trainee.baseName + WARRIOR_SUFFIXES[(KIT_NAMES.indexOf(trainee.baseName) + 3) % WARRIOR_SUFFIXES.length];
    trainee.size = 0.95;
    trainee = null;
  }
  mission = null;
  stolenPrey = null;
  gatheringTimer = GATHERING_TIME;   // R48
  decisionTimer = DECISION_TIME;     // R50
  player.lives = LEADER_LIVES;
  const furs = [FURS.Grey, FURS.Brown, FURS.Cream];
  clanmates = furs.map((fur, i) => ({
    x: player.x + (i - 1) * 2, z: player.z - 2, heading: player.heading, walk: 0, timer: 0,
    look: { fur, eyes: EYES.Amber, pattern: PATTERNS[i] },
  }));
  giveOrder("follow");
  say(`StarClan gives you nine lives. You are now ${fullName()}, leader of ${clanName}! ` +
      `Press 1 Follow, 2 Hunt, 3 Guard.`, 6);
}

// ======================================================
// Training your own apprentice (R36, R39)
// ======================================================
function trySparring() {
  if (!trainee || trainee.lesson !== "battle") return false;
  if (!inFront(player, player.heading, trainee, 2.2, 0.35) || player.attackCooldown > 0) return false;
  player.attackCooldown = 0.4;
  player.attackTimer = 0.25;
  trainee.lessonCount++;
  if (trainee.lessonCount >= LESSON_HITS) {
    trainee.lesson = "patrol";
    trainee.lessonCount = 0;
    say(`Well done! ${trainee.name} has learned to fight. Last lesson: walk the border markers together.`, 4);
  } else {
    say(`Practice hit ${trainee.lessonCount} of ${LESSON_HITS}.`, 1.2);
  }
  return true;
}

function finishTraining() {
  trainee.lesson = "done";
  trainee.name = trainee.baseName + WARRIOR_SUFFIXES[(KIT_NAMES.indexOf(trainee.baseName) + 3) % WARRIOR_SUFFIXES.length];
  trainee.size = 0.95;
  // It walks straight home to camp
  trainee.activity = "wander";
  trainee.target = campYardSpot(trainee.home);
  trainee.timer = 30;
  stats.trained++;
  say(`Your apprentice is now a warrior: ${trainee.name}!`, 3.5);
  trainee = null;
}

// The deputy's apprentice follows, and during the hunting lesson catches prey near the deputy
function updateTrainee(t, dt) {
  if (t.lesson === "hunt") {
    const target = allCritters()
      .filter((c) => critterVisible(c) && distance(c, player) < 15)
      .sort((a, b) => distance(a, t) - distance(b, t))[0];
    if (target) {
      moveToward(t, target, 4, dt);
      if (distance(t, target) < 0.7) {
        target.state = "hidden";
        target.respawn = target === squirrel ? 4 : PREY_RESPAWN;
        t.lessonCount++;
        if (t.lessonCount >= LESSON_HUNTS) {
          t.lesson = "battle";
          t.lessonCount = 0;
          say(`${t.name} caught ${LESSON_HUNTS} prey! Next lesson: battle practice. Face your apprentice and press E.`, 4);
        } else {
          say(`${t.name} caught some prey (${t.lessonCount}/${LESSON_HUNTS}).`, 1.5);
        }
      }
      return;
    }
  }
  const spot = behindPlayer(2, -1.2);
  const d = distance(t, spot);
  if (d > 0.4) moveToward(t, spot, Math.min(d * 3, 7), dt);   // runs to catch up when far behind
  else t.moving = false;
}

// ======================================================
// Kits (R31): play in camp; other clans' kits hide from you
// ======================================================
function updateKits(dt) {
  for (const k of kits) {
    if (k.lost) {
      // R49: a lost kit waits where it is until found, then runs after you
      if (k.following) moveToward(k, behindPlayer(1.5, 1), Math.min(distance(k, player) * 3, 7), dt);
      else k.moving = false;
      continue;
    }
    if (k === trainee) {
      updateTrainee(k, dt);
      continue;
    }
    if (k.clan !== clanName) {
      // Other clans' kits hide in their nursery while you are near on their land
      k.hiding = territoryAt(player.x, player.z) === k.clan && distance(player, k.home) < 15 + CAMP_YARD;
      if (k.hiding) {
        const nursery = huts.find((h) => h.clan === k.clan && h.id === "nursery");
        moveToward(k, { x: nursery.x - Math.sin(nursery.door) * 1, z: nursery.z - Math.cos(nursery.door) * 1 }, 4, dt);
        k.activity = "wander";
        continue;
      }
    }
    // Play: a new game every few seconds (a kit that is indoors and not hiding comes out to play)
    k.timer -= dt;
    if (insideHut(k) && k.activity !== "wander") k.timer = 0;
    if (k.timer <= 0 || !k.target) {
      k.activity = k.lesson === "done" || insideHut(k) ? "wander" : ["chase", "pounce", "tumble", "wander"][Math.floor(Math.random() * 4)];
      k.timer = 2 + Math.random() * 3;
      k.target = campYardSpot(k.home);
    }
    // R63: kits come up to an apprentice or older who is in their camp
    if (k.activity !== "playpounce" && k.activity !== "visit" && k.clan === clanName && stage >= 1 && k.lesson !== "done" &&
        distance(player, k.home) < KIT_BOUNDARY - 1 && !player.climbing && Math.random() < dt * 0.15) {
      k.activity = "visit";
      k.timer = 6;
    }
    if (k.activity === "visit") k.target = behindPlayer(-1.4, (kits.indexOf(k) % 3 - 1) * 0.9);
    if (k.activity === "chase") {
      const other = kits.find((o) => o !== k && o.clan === k.clan && o !== trainee) || k;
      moveToward(k, other === k ? k.target : other, 3.5, dt);
    } else if (k.activity === "tumble") {
      k.moving = false;   // rolls on the spot (drawn by render3d.js)
    } else if (k.activity === "visit" && distance(k, k.target) < 0.4) {
      k.moving = false;   // sits in front of you, looking up
      k.heading = Math.atan2(player.x - k.x, player.z - k.z);
    } else {
      moveToward(k, k.target, distance(k, k.home) > KIT_BOUNDARY ? 5 : (k.activity === "pounce" ? 3 : 1.5), dt);
    }
    // R31, R42: kits never leave their camp (a newly trained warrior walks home first)
    const d = distance(k, k.home);
    if (d > KIT_BOUNDARY - 1 && k.lesson !== "done") {
      k.x = k.home.x + (k.x - k.home.x) * ((KIT_BOUNDARY - 1) / d);
      k.z = k.home.z + (k.z - k.home.z) * ((KIT_BOUNDARY - 1) / d);
    }
  }
}

// ======================================================
// Weather (R30)
// ======================================================
function setWeather(w) {
  weather = w;
  weatherTimer = WEATHER_TIME;
}

function updateWeather(dt) {
  weatherTimer -= dt;
  if (weatherTimer > 0) return;
  // Pick a different weather; storms are the rarest
  const choices = weatherChoicesFor(season()).filter((w) => w !== weather);   // R69: weather that fits the season
  setWeather(choices[Math.floor(Math.random() * choices.length)]);
  const words = { clear: "The sky clears.", rain: "It starts to rain. Prey hides from the wet.",
                  fog: "Fog rolls in. Prey won't notice you so easily.", wind: "The wind picks up. Scents carry far.",
                  storm: "A thunderstorm! Prey hides, and other clans' patrols stay in camp." };
  say(words[weather], 3);
}

function giveOrder(newOrder) {
  if (role !== "Leader") return;
  order = newOrder;
  clanmates.forEach((c, i) => { c.timer = 12 + i * 3; });
  if (newOrder === "bighunt") startBigHunt();   // R47
  else prey = prey.filter((p) => p.kind !== "hare");
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
  // R47: surround the hare - behind it and on both sides, leaving the side toward the leader open
  if (order === "bighunt" && theHare()) {
    const h = theHare();
    const fromLeader = Math.atan2(h.x - player.x, h.z - player.z);
    const a = fromLeader + (i - 1) * 1.6;
    return { x: h.x + Math.sin(a) * 3, z: h.z + Math.cos(a) * 3 };
  }
  if (order === "guard") {
    const angle = (i / 3) * Math.PI * 2;
    return { x: CAMP.x + Math.sin(angle) * 3.5, z: CAMP.z + Math.cos(angle) * 3.5 };
  }
  // hunt: wander a loop in your territory, well away from camp, each cat in its own place
  const angle = time * 0.1 + i * 2;
  return spotFor(clanName, 36 + Math.sin(angle) * 8, 12 + Math.cos(angle) * 8 + i * 4);
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
  return stage === 1 && mentor !== null && c.mentorId === mentor;
}

// R44: the mentor leads the apprentice toward the task, but comes back if the apprentice falls behind
function mentorTarget(c) {
  const spot = taskSpot();
  if (!spot || distance(c, player) > 10) return behindPlayer(2.2, 1.4);
  if (distance(c, spot) < 3) return c;   // waits at the task
  // Walk toward the task, but not more than 10 away from the apprentice
  const d = distance(spot, player);
  if (d <= 9) return spot;
  return { x: player.x + (spot.x - player.x) * (9 / d), z: player.z + (spot.z - player.z) * (9 / d) };
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
      const target = mentorTarget(c);
      const d = distance(c, target);
      if (d > 0.4) moveToward(c, target, Math.min(d * 3, 5.5), dt);
      else c.moving = false;
      // R58: at the task's place the mentor shows how it is done
      const spot = taskSpot();
      c.demo = spot && distance(c, spot) < 3.5 ? DEMOS[currentTask()] : null;
      continue;
    }
    c.demo = null;
    // R66: a hungry cat walks to the fresh-kill pile and eats a piece
    c.hungerTimer = (c.hungerTimer === undefined ? HUNGER_TIME : c.hungerTimer) - dt;
    if (c.hungerTimer <= 0) {
      if (freshKill <= 0) {
        c.hungerTimer = 30;   // nothing to eat yet; try again later
      } else {
        c.eating = true;
        moveToward(c, FRESH_KILL, 2.5, dt);
        if (distance(c, FRESH_KILL) < 1.6) {
          takeFromPile(1);
          c.eating = false;
          c.hungerTimer = HUNGER_TIME + Math.random() * 60;
        }
        continue;
      }
    }
    // R63: pairing up with another camp cat
    if (c.social && c.partner) {
      if (distance(c, c.partner) > 1.2) moveToward(c, c.partner, 1.8, dt);
      else c.moving = false;
      continue;
    }
    // Wander around camp; hurry back if far away
    c.timer -= dt;
    if (c.timer <= 0 || !c.target) {
      c.target = campYardSpot(CAMP);
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
  if (isMedicine()) {
    stats.treated++;   // R57
    checkMedRank();
  }
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
  if (stage === 1 || (stage === 2 && role === null)) id = "apprentices";
  else if (stage === 2 && role === "Leader") id = "leader";
  else if (stage === 2 && role === "Medicine cat") id = "medicine";
  else if (stage === 2) id = "warriors";
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
  if (player.carrying && mission && mission.type === "stolen" && mission.carried) {
    // R49: the stolen rabbit is back where it belongs
    player.carrying = null;
    addToPile("rabbit");
    completeMission("You put the stolen rabbit back on your fresh-kill pile.");
    return;
  }
  if (player.carrying) {
    say(`You drop the ${player.carrying} on the fresh-kill pile for your clan.`, 2);
    addToPile(player.carrying);   // R65: the real prey goes on the pile
    player.carrying = null;
  } else if (player.food < 100 && freshKill > 0) {
    takeFromPile(1);
    eat(PREY_FOOD.pile);
    player.eatTimer = 1;
    playSound("crunch");
    say("You eat a piece of fresh-kill.", 1.5);
  } else {
    say(freshKill > 0 ? "You aren't hungry." : "The fresh-kill pile is empty. Go hunting!", 1.5);
  }
}

// Things in the world you can use with E: hurt clanmates, herbs, the fresh-kill pile, dens
function tryInteract() {
  // Pick up prey dropped on the ground (R27)
  const lying = dropped.find((d) => distance(player, d) < 1.5);
  if (lying && !player.carrying) {
    dropped.splice(dropped.indexOf(lying), 1);
    player.carrying = lying.kind;
    say(`You pick up the ${lying.kind}.`, 1.5);
    return true;
  }
  // R49: take back the stolen rabbit, or find the lost kit
  if (mission && mission.type === "stolen" && !mission.carried && stolenPrey && distance(player, stolenPrey) < 1.5 && !player.carrying) {
    mission.carried = true;
    stolenPrey.taken = true;
    player.carrying = "rabbit";
    changeRivalry(mission.clan, 5);   // R54
    say("You grab the stolen rabbit. Now get it home to the fresh-kill pile!", 2.5);
    return true;
  }
  if (mission && mission.type === "lostkit" && !mission.kit.following && distance(player, mission.kit) < 2) {
    mission.kit.following = true;
    say(`${mission.kit.name} is so glad to see you! It follows you home.`, 2.5);
    return true;
  }
  // R52: your clan's medicine cat heals you
  const medic = ownMedicineCat();
  if (medic && distance(player, medic) < 2 && !isMedicine()) {
    if (medic.healCooldown > 0 || player.hp >= 100) {
      say(player.hp >= 100 ? `${medic.name}: You look healthy to me.` : `${medic.name}: Rest a while; I can't treat you again so soon.`, 2);
    } else {
      player.hp = 100;
      medic.healCooldown = MEDICINE_HEAL_COOLDOWN;
      say(`${medic.name} checks you over and treats your wounds.`, 2.5);
    }
    return true;
  }
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
  // Inside one of your camp's huts (R25): rest if it is your den
  const den = insideHut(player);
  if (den && den.clan === clanName) {
    // R57: a medicine cat puts herbs into the store in the medicine den
    if (den.id === "medicine" && isMedicine() && pouchCount() > 0) {
      depositHerbs();
      return true;
    }
    useDen(den);
    return true;
  }
  return false;
}

// E facing another cat (after catching prey, so it never gets in the way of hunting):
// R58 talk to your mentor (the task again, with a tip); R63 share tongues or play with a kit
function tryTalk() {
  const m = mentorCat();
  if (m && stage === 1 && currentTask() && inFront(player, player.heading, m, 2, 0.5)) {
    playSound("meow");
    say(`${m.name}: ${TASK_TEXT[currentTask()]} ${TIPS[currentTask()]}`, 5);
    return true;
  }
  return trySocial();
}

// G: drop the prey you carry (R27). At the fresh-kill pile it goes onto the pile.
function dropPrey() {
  if (!player.carrying) return;
  const kind = player.carrying;
  player.carrying = null;
  player.dropTimer = DROP_TIME;
  if (distance(player, FRESH_KILL) < 1.8) {
    addToPile(kind);
    if (mission && mission.type === "stolen" && mission.carried) {
      completeMission("You put the stolen rabbit back on your fresh-kill pile.");   // R49
      return;
    }
    say(`You drop the ${kind} on the fresh-kill pile for your clan.`, 2);
    return;
  }
  dropped.push({
    kind, fall: DROP_TIME, y: MOUTH_HEIGHT * catSize(), start: MOUTH_HEIGHT * catSize(),
    x: player.x + Math.sin(player.heading) * 0.8, z: player.z + Math.cos(player.heading) * 0.8,
  });
}

// Dropped prey falls from the cat's mouth to the ground
function updateDropped(dt) {
  for (const d of dropped) {
    if (d.fall <= 0) continue;
    d.fall = Math.max(0, d.fall - dt);
    d.y = d.start * (d.fall / DROP_TIME) * (d.fall / DROP_TIME);
  }
}

// R26: Restart from the main menu: the same cat and clan start over as a kit
function restartGame() {
  resetGame();
  playing = true;
  ui.menu = false;
}

// ======================================================
// Choices (R48 speeches, R50 decisions): shown by script.js; the game waits until one is picked
// ======================================================
function chooseOption(i) {
  if (!pendingChoice || !pendingChoice.options[i]) return;
  const choice = pendingChoice;
  pendingChoice = null;
  choice.options[i].apply();
  if (choice.kind === "speech") Object.assign(gathering, { called: false, open: 0 });
}

function changeRivalry(clan, amount) {
  if (rivalry[clan] === undefined) return;
  rivalry[clan] = clamp(rivalry[clan] + amount, 0, 100);
}

function otherClans() {
  return Object.keys(CLANS).filter((c) => c !== clanName);
}

// ======================================================
// Gatherings (R48) and big decisions (R50) - for leaders
// ======================================================
function updateLeaderEvents(dt) {
  if (role !== "Leader") return;
  // The full-moon Gathering
  if (!gathering.called) {
    gatheringTimer -= dt;
    if (gatheringTimer <= 0) {
      gatheringTimer = GATHERING_TIME;
      Object.assign(gathering, { called: true, open: GATHERING_OPEN });
      say("Tonight is the full-moon Gathering! Go to the Great Oak in the middle of the forest, where the four territories meet.", 5);
    }
  } else {
    gathering.open -= dt;
    if (gathering.open <= 0) {
      Object.assign(gathering, { called: false, open: 0 });
      say("You missed the Gathering. The other clans noticed.", 3);
      otherClans().forEach((c) => changeRivalry(c, 5));
    } else if (distance(player, GATHERING_SPOT) < GATHERING_REACH && !pendingChoice) {
      startGathering();
    }
  }
  // Big decisions
  decisionTimer -= dt;
  if (decisionTimer <= 0 && !pendingChoice) {
    decisionTimer = DECISION_TIME;
    const ids = Object.keys(DECISIONS);
    triggerDecision(ids[Math.floor(Math.random() * ids.length)]);
  }
}

function startGathering() {
  // The other leaders stand around the Great Oak
  gatheringLeaders = otherClans().map((clan, i) => {
    const a = i * 2.1 + 0.6;
    // R69a: the real leaders; any still on the way are already there by the time you arrive
    const l = leaders.find((x) => x.clan === clan);
    return Object.assign(l, gatheringSpotFor(clan), { heading: a + Math.PI, moving: false });
  });
  const news = gatheringLeaders.map((l) => {
    const r = rivalry[l.clan];
    const mood = r >= RIVALRY_HOSTILE ? "glares at you" : (r < RIVALRY_FRIENDLY ? "greets you warmly" : "nods stiffly");
    return `${l.name} of ${l.clan} ${mood} and says the prey is ${r >= RIVALRY_HOSTILE ? "thin and their borders need guarding" : "running well"}.`;
  }).join(" ");
  const mostRival = otherClans().sort((a, b) => rivalry[b] - rivalry[a])[0];
  pendingChoice = {
    kind: "speech",
    title: "The full-moon Gathering",
    text: `${news} Now it is your turn to speak.`,
    options: [
      { label: "Speak of peace between the clans", apply: () => { otherClans().forEach((c) => changeRivalry(c, -15)); say("Your words calm the clans.", 3); } },
      { label: "Boast of your clan's strength", apply: () => { otherClans().forEach((c) => changeRivalry(c, 10)); addToPile("rabbit", 2); say("Your clanmates walk home proud and hunt hard.", 3); } },
      { label: `Warn ${mostRival} off your border`, apply: () => {
        otherClans().forEach((c) => changeRivalry(c, c === mostRival ? 15 : -5));
        say(`${mostRival} bristles; the others respect your firmness.`, 3);
      } },
    ],
  };
}

const CLAN_LEADER_NAMES = { ThunderClan: "Oakstar", ShadowClan: "Nightstar", WindClan: "Gorsestar", RiverClan: "Brookstar" };

// R50: things that happen to the clan; each choice changes the whole clan
const DECISIONS = {
  sickness: () => ({
    title: "Sickness in camp",
    text: "Coughing has spread through the camp.",
    options: [
      { label: "Send cats out for herbs", apply: () => { herbStore += 2; takeFromPile(1); } },
      { label: "Rest and wait", apply: () => hurtCampCats(2) },
    ],
  }),
  stray: () => ({
    title: "A stray kit",
    text: "A patrol found a lost kit at the border, crying for its mother.",
    options: [
      { label: "Take it in", apply: () => { addStrayKit(); takeFromPile(1); } },
      { label: "Send it away", apply: () => {} },
    ],
  }),
  theft: () => {
    const clan = otherClans()[Math.floor(Math.random() * 3)];
    return {
      clan,
      title: "Prey stolen",
      text: `${clan} cats were seen taking prey from your territory.`,
      options: [
        { label: "Raid their camp", apply: () => { addToPile("rabbit", 2); changeRivalry(clan, 20); } },
        { label: "Let it go", apply: () => { takeFromPile(2); } },
        { label: "Complain at the Gathering", apply: () => changeRivalry(clan, -5) },
      ],
    };
  },
  scarce: () => ({
    title: "Prey is scarce",
    text: "A cold spell has driven the prey underground.",
    options: [
      { label: "Send extra hunting patrols", apply: () => { addToPile("vole", 2); hurtCampCats(1); } },
      { label: "Share what we have", apply: () => {} },
    ],
  }),
};

function triggerDecision(id) {
  pendingChoice = Object.assign({ kind: "decision" }, DECISIONS[id]());
  clearKeys();
}

function hurtCampCats(n) {
  campCats.filter((c) => !c.injured && !isFollowingMentor(c)).slice(0, n).forEach((c) => {
    Object.assign(c, { injured: true, hp: 40, injuredTime: 0 });
  });
}

function addStrayKit() {
  const name = ["Moss", "Fern", "Rook", "Hazel"][kits.length % 4];
  const a = Math.random() * Math.PI * 2;
  kits.push({ clan: clanName, baseName: name, name: name + "kit", size: 0.45, lesson: null,
              x: CAMP.x + Math.sin(a) * 2, z: CAMP.z + Math.cos(a) * 2, heading: a, walk: 0, moving: false,
              activity: "wander", timer: 1, target: null, home: CAMP, look: { fur: FURS.Grey, eyes: EYES.Blue, pattern: "Tabby" } });
  say(`${name}kit joins your clan.`, 2.5);
}

// The Great Oak's truce (R48), and the clan you carry a message to (R49), mean nobody attacks
function truceWith(clan) {
  if (distance(player, GATHERING_SPOT) < TRUCE_RADIUS) return true;
  if (clan === graceClan && graceTimer > 0) return true;
  return !!mission && mission.type === "message" && mission.clan === clan;
}

// ======================================================
// Deputy missions (R49)
// ======================================================
function updateMissions(dt) {
  graceTimer = Math.max(0, graceTimer - dt);
  if (role !== "Deputy") return;
  if (!mission) {
    missionTimer -= dt;
    if (missionTimer <= 0) startMission();
    return;
  }
  if (mission.type === "message" && distance(player, mission.target) < 6) {
    graceClan = mission.clan;
    graceTimer = 20;
    completeMission(`You deliver the message to ${mission.clan}. They let you leave in peace.`);
    return;
  }
  if (mission.type === "lostkit") {
    const k = mission.kit;
    if (k.following && distance(k, CAMP) < KIT_BOUNDARY) {
      k.lost = false;
      k.following = false;
      k.home = CAMP;
      completeMission(`${k.name} is safe at home!`);
    }
  }
}

function startMission() {
  const type = MISSION_TYPES[missionIndex % MISSION_TYPES.length];
  const clan = otherClans()[missionIndex % 3];
  missionIndex++;
  mission = { type, clan, target: campOf(clan) };
  if (type === "message") {
    say(`Mission: carry a message to the ${clan} camp. Their cats will let you pass.`, 4);
  } else if (type === "stolen") {
    stolenPrey = Object.assign({ clan }, spotFor(clan, -15, -20));
    mission.target = stolenPrey;
    say(`Mission: ${clan} stole a rabbit. Find it on their land, take it (E) and bring it to your fresh-kill pile.`, 4);
  } else {
    const k = kits.find((x) => x.clan === clanName && x.lesson === null && x !== trainee && !x.lost);
    if (!k) {
      completeMission("All your kits are safe.");
      return;
    }
    Object.assign(k, spotFor(clan, -25, -25), { lost: true, following: false });
    k.home = campOf(clan);   // until found it stays where it is
    mission.kit = k;
    mission.target = k;
    say(`Mission: ${k.name} has wandered into ${clan} territory! Find it, press E, and bring it home.`, 4);
  }
}

function completeMission(text) {
  mission = null;
  stolenPrey = null;
  missionTimer = MISSION_GAP;
  stats.missions++;
  say(`${text} (missions done: ${stats.missions})`, 3);
  checkPromotion();
}

// ======================================================
// Rivalries (R54): trespassing, and raids by hostile clans
// ======================================================
function updateRivalry(dt) {
  const land = territoryAt(player.x, player.z);
  if (land !== clanName && !truceWith(land)) {
    trespassTimer += dt;
    if (trespassTimer >= TRESPASS_TIME) {
      trespassTimer -= TRESPASS_TIME;
      changeRivalry(land, 1);
    }
  } else {
    trespassTimer = 0;
  }
  raidTimer -= dt;
  if (raidTimer <= 0) {
    raidTimer = RAID_TIME;
    const hostile = otherClans().filter((c) => rivalry[c] >= RIVALRY_HOSTILE).sort((a, b) => rivalry[b] - rivalry[a])[0];
    if (hostile && raiders.length === 0) startRaid(hostile);
  }
  raiders.forEach((r) => updateRaider(r, dt));
  raiders = raiders.filter((r) => r.state !== "gone");
}

function startRaid(clan) {
  const away = Math.atan2(campOf(clan).x - CAMP.x, campOf(clan).z - CAMP.z);
  raiders = [0, 1].map((i) => ({
    clan, mode: "raid", state: "raid", hp: PATROL_HP, heading: 0, walk: 0, moving: false, windup: 0, cooldown: 0,
    hurtTimer: 0, stagger: 0, fleeTimer: 0, stolen: false,
    x: CAMP.x + Math.sin(away + (i - 0.5) * 0.4) * (STONE_RING + 3), z: CAMP.z + Math.cos(away + (i - 0.5) * 0.4) * (STONE_RING + 3),
    look: { fur: PATROL_FURS[clan][i], eyes: EYES.Yellow, pattern: "Tabby" },
  }));
  say(`${clan} is raiding your camp! Drive them off before they steal your fresh-kill.`, 4);
}

function updateRaider(r, dt) {
  r.hurtTimer = Math.max(0, r.hurtTimer - dt);
  r.stagger = Math.max(0, r.stagger - dt);
  if (r.state === "fleeing") {
    // Run home and disappear
    moveToward(r, campOf(r.clan), 7, dt);
    r.fleeTimer -= dt;
    if (r.fleeTimer <= 0) r.state = "gone";
    return;
  }
  if (r.state === "fighting") {
    if (distance(player, r) > 20) r.state = "raid";
    else fightStep(r, dt);
    return;
  }
  // Raiding: go for the fresh-kill pile; fight you if you come close
  if (distance(player, r) < PATROL_SIGHT && !truceWith(r.clan)) {
    r.state = "fighting";
    playSound("hiss");
    return;
  }
  moveToward(r, FRESH_KILL, 4, dt);
  if (distance(r, FRESH_KILL) < 1.5) {
    takeFromPile(1);
    say(`The ${r.clan} raiders grab fresh-kill and run!`, 2.5);
    r.state = "fleeing";
    r.fleeTimer = 6;
    raiders.forEach((o) => { if (o.state === "raid") { o.state = "fleeing"; o.fleeTimer = 6; } });
  }
}

// ======================================================
// Medicine cats (R52, R57)
// ======================================================
function buildMedicineCats() {
  return Object.keys(CLANS).map((clan) => {
    const den = huts.find((h) => h.clan === clan && h.id === "medicine");
    const spot = { x: den.x + Math.sin(den.door) * (den.R + 1), z: den.z + Math.cos(den.door) * (den.R + 1) };
    return Object.assign({ clan, name: clan === clanName ? MEDICINE_NAMES.own : MEDICINE_NAMES[clan], home: spot,
                           heading: den.door, walk: 0, moving: false, patient: null, healCooldown: 0,
                           look: { fur: "#a89878", eyes: EYES.Green, pattern: "Patches" } }, spot);
  });
}

function isMedicine() {
  return role === "Medicine cat";
}

function ownMedicineCat() {
  return medicineCats.find((m) => m.clan === clanName);
}

function updateMedicineCats(dt) {
  for (const c of campCats) if (c.injured) c.injuredTime = (c.injuredTime || 0) + dt;
  for (const m of medicineCats) {
    m.healCooldown = Math.max(0, m.healCooldown - dt);
    if (m.clan === clanName && !isMedicine()) {
      // R52: treat a camp cat that has been hurt for a while
      if (!m.patient) m.patient = campCats.find((c) => c.injured && c.injuredTime >= TREAT_AFTER) || null;
      if (m.patient) {
        if (!m.patient.injured) { m.patient = null; continue; }
        moveToward(m, m.patient, 3, dt);
        if (distance(m, m.patient) < 1.5) {
          if (herbStore > 0) herbStore--;
          Object.assign(m.patient, { injured: false, hp: 100, injuredTime: 0 });
          m.patient = null;
        }
        continue;
      }
    }
    // R69b: a rival clan's medicine cat treats its own beaten cats
    if (m.clan !== clanName) {
      if (m.patient && m.patient.state !== "resting") m.patient = null;
      if (!m.patient) m.patient = patrols.find((p) => p.clan === m.clan && p.state === "resting" && p.restTime >= 3) || null;
      if (m.patient) {
        moveToward(m, m.patient, 3, dt);
        if (distance(m, m.patient) < 1.5) {
          m.patient.respawn = 0;
          m.patient = null;
        }
        continue;
      }
    }
    // Otherwise stay by the medicine den
    if (distance(m, m.home) > 0.3) moveToward(m, m.home, 2, dt);
    else m.moving = false;
  }
}

// R57: Thymeleaf hands out herb collecting quests
function giveMedQuest(intro) {
  medQuest = Object.assign({}, MED_QUESTS[medRank % MED_QUESTS.length]);
  Object.assign(questDeposited, { marigold: 0, dock: 0 });
  say(`${intro || MEDICINE_NAMES.own + ": "}Collect ${medQuest.marigold} marigold and ${medQuest.dock} dock leaf, and put them in the store in our medicine den.`, 5);
}

// Inside the medicine den, E puts the pouch's herbs into the herb store (R57)
function depositHerbs() {
  const moved = pouchCount();
  if (moved === 0) {
    say(`The herb store holds ${herbStore} herbs. Bring herbs in your pouch to add to it.`, 2.5);
    return;
  }
  questDeposited.marigold += player.pouch.marigold;
  questDeposited.dock += player.pouch.dock;
  herbStore += moved;
  player.pouch = { marigold: 0, dock: 0 };
  if (medQuest && questDeposited.marigold >= medQuest.marigold && questDeposited.dock >= medQuest.dock) {
    stats.quests++;
    medQuest = null;
    say(`${MEDICINE_NAMES.own}: Well gathered! The store now holds ${herbStore} herbs.`, 3);
    checkMedRank();
    if (!medQuest) giveMedQuest();
  } else {
    say(`You put ${moved} herbs in the store (${herbStore} now).`, 2);
  }
}

function checkMedRank() {
  const need = MED_NEEDS[medRank];
  if (!isMedicine() || !need) return;
  if (stats.quests >= need.quests && stats.treated >= need.treated && herbStore >= need.store) {
    medRank++;
    resetStats();
    say(`${MEDICINE_NAMES.own}: You have learned well. You are now ${fullName()}, ${MED_RANKS[medRank].toLowerCase()} of ${clanName}!`, 5);
    if (medRank < MED_RANKS.length - 1) giveMedQuest();
  }
}

// ======================================================
// Clicking herbs (R53): the herb under the aiming dot in the middle of the screen
// ======================================================
function aimedHerb() {
  const cam = cameraFor();
  const look = { x: cam.lookX - cam.x, y: cam.lookY - cam.y, z: cam.lookZ - cam.z };
  const lookLen = Math.hypot(look.x, look.y, look.z);
  let best = null;
  let bestAngle = AIM_CONE;
  for (const h of herbs) {
    if (!h.ready || distance(player, h) > AIM_REACH) continue;
    const to = { x: h.x - cam.x, y: 0.25 - cam.y, z: h.z - cam.z };
    const toLen = Math.hypot(to.x, to.y, to.z);
    const angle = Math.acos(clamp((look.x * to.x + look.y * to.y + look.z * to.z) / (lookLen * toLen), -1, 1));
    if (angle < bestAngle) {
      best = h;
      bestAngle = angle;
    }
  }
  return best;
}

function clickToPick() {
  if (!playing || ui.menu || pendingChoice || choosingRole || choosingMentor) return false;
  const h = aimedHerb();
  if (!h) return false;
  pickHerb(h);
  return true;
}

// ======================================================
// Round 6
// ======================================================
// R61: game events that make a sound; sound.js plays them
function playSound(name) {
  if (hooks.sound) hooks.sound(name);
}

// Where a rival leader stands at the Great Oak
function gatheringSpotFor(clan) {
  const a = otherClans().indexOf(clan) * 2.1 + 0.6;
  return { x: GATHERING_SPOT.x + Math.sin(a) * 5, z: GATHERING_SPOT.z + Math.cos(a) * 5 };
}

// R69a: leaders stand by their Highrock; rival leaders walk to the Great Oak when a Gathering is called
function updateLeaders(dt) {
  for (const l of leaders) {
    if (l.retired) continue;
    const target = l.clan !== clanName && gathering.called && otherClans().includes(l.clan) ? gatheringSpotFor(l.clan) : l.home;
    if (distance(l, target) > 0.5) moveToward(l, target, 3, dt);
    else l.moving = false;
  }
}

// R69a: every clan's leader, standing by its Highrock
function buildLeaders() {
  return Object.keys(CLANS).map((clan) => {
    const spot = spotFor(clan, 4, -13);
    return Object.assign({ clan, name: CLAN_LEADER_NAMES[clan], home: spot, heading: 0, walk: 0, moving: false, retired: false,
                           look: { fur: PATROL_FURS[clan][0], eyes: EYES.Yellow, pattern: "Solid" } }, spot);
  });
}

function ownLeaderName() {
  return CLAN_LEADER_NAMES[clanName];
}

// R59: stepping stones across both waters
function buildSteppingStones() {
  const list = [];
  for (const z of STONE_CROSSINGS) {
    for (const w of watersAt(z)) {
      for (let x = w.x0 + 0.6; x < w.x1 - 0.3; x += 1.2) list.push({ x, z, r: 0.6 });
    }
  }
  return list;
}

function onSteppingStone(body) {
  return steppingStones.some((s) => distance(body, s) < s.r);
}

// "deep" in the middle of the water, "shallow" along its banks, null on land
function waterDepthAt(x, z) {
  const w = watersAt(z).find((v) => x > v.x0 && x < v.x1);
  if (!w) return null;
  return x - w.x0 < SHALLOW || w.x1 - x < SHALLOW ? "shallow" : "deep";
}

function swimming(body) {
  return waterDepthAt(body.x, body.z) === "deep" && !onSteppingStone(body);
}

// R64: sparrows perched in trees
function addPerchedBirds() {
  const own = trees.filter((t) => territoryAt(t.x, t.z) === clanName);
  for (let i = 0; i < 2 && own.length; i++) {
    const bird = makeCritter("sparrow", prey.length);
    perchOn(bird, own[Math.floor(Math.random() * own.length)]);
    prey.push(bird);
  }
}

function perchOn(bird, tree) {
  Object.assign(bird, { x: tree.x, z: tree.z, y: PERCH_HEIGHT, perch: { tree, y: PERCH_HEIGHT }, state: "idle", timer: 99 });
}

// R58: cats are solid; you are pushed out of any cat you walk into
function catBodies() {
  return [
    ...campCats, ...medicineCats, ...clanmates,
    ...kits.filter((k) => !k.lost || k.following),
    ...patrols.filter((p) => p.state !== "resting"),
    ...(rogue.state !== "gone" && (rogueActive() || rogue.state === "fighting") ? [rogue] : []),
    ...rogueMates.filter((m) => m.state !== "gone"),
    ...raiders, ...leaders.filter((l) => !l.retired),
  ];
}

function pushPlayerOutOfCats() {
  if (player.climbing) return;
  for (const c of catBodies()) {
    const min = kits.includes(c) ? CAT_BODY * 0.75 : CAT_BODY;
    const dx = player.x - c.x;
    const dz = player.z - c.z;
    const d = Math.hypot(dx, dz);
    if (d < min && d > 0.0001) {
      player.x = c.x + (dx / d) * min;
      player.z = c.z + (dz / d) * min;
    }
  }
}

// R64: up a tree, rogues and other clans' cats can't reach you (ThunderClan cats can climb after you)
function canReachUpTree(enemy) {
  return enemy.clan === "ThunderClan";
}

function outOfReach(enemy) {
  return !!player.climbing && player.y > TREE_REACH && !canReachUpTree(enemy);
}

// R64: high in a tree you can see far
function lookingOut() {
  return !!player.climbing && player.y > LOOKOUT_HEIGHT;
}

function spottedFromTree() {
  if (!lookingOut()) return [];
  const things = [...allCritters().filter((c) => c.state !== "hidden" && c.state !== "caught"),
                  ...patrols.filter((p) => p.state !== "resting"), ...raiders,
                  ...(rogue.state !== "gone" ? [rogue, ...rogueMates] : [])];
  return things.filter((t) => distance(t, player) <= LOOKOUT_RANGE);
}

// R69: seasons of 30 game days
function season() {
  return SEASONS[Math.floor((day - 1) / SEASON_DAYS) % SEASONS.length];
}

// R69: in greenleaf, hidden prey comes back twice as fast
function respawnTime(base) {
  return season() === "greenleaf" ? base / 2 : base;
}

// R69: weather that fits the season (picked at random from the list)
function weatherChoicesFor(s) {
  return {
    newleaf: ["clear", "clear", "clear", "rain", "rain", "fog", "fog", "wind", "wind", "storm"],
    greenleaf: ["clear", "clear", "clear", "clear", "clear", "rain", "fog", "wind", "storm", "storm"],
    "leaf-fall": ["clear", "clear", "rain", "rain", "rain", "fog", "wind", "wind", "wind", "storm"],
    "leaf-bare": ["clear", "clear", "fog", "fog", "fog", "wind", "wind", "wind"],
  }[s];
}

// R65: the fresh-kill pile holds real prey; freshKill is always how many pieces there are
function addToPile(kind, n) {
  for (let i = 0; i < (n || 1); i++) pileItems.push({ kind: kind || "mouse", day });
  freshKill = pileItems.length;
}

function takeFromPile(n) {
  for (let i = 0; i < (n || 1) && pileItems.length; i++) pileItems.shift();   // the oldest piece first
  freshKill = pileItems.length;
}

// Keeps the pile's list matching freshKill if something changed the count directly, and clears stale prey
function updatePile() {
  while (pileItems.length < freshKill) pileItems.push({ kind: "mouse", day });
  while (pileItems.length > freshKill) pileItems.shift();
  if (day !== pileDay) {
    pileDay = day;
    const before = pileItems.length;
    pileItems = pileItems.filter((p) => day - p.day <= 1);
    freshKill = pileItems.length;
    if (pileItems.length < before) say(`${before - pileItems.length} pieces of stale prey are cleared from the fresh-kill pile.`, 2.5);
  }
}

// R63: E next to a camp cat grooms it (share tongues); next to a kit, plays a pounce game
function trySocial() {
  const near = [...campCats.filter((c) => !c.injured), ...clanmates,
                ...kits.filter((k) => k.clan === clanName && !k.lost && k !== trainee && k.lesson !== "done")]
    .filter((c) => inFront(player, player.heading, c, 1.8, 0.3))
    .sort((a, b) => distance(a, player) - distance(b, player))[0];
  if (!near) return false;
  if (kits.includes(near)) {
    near.activity = "playpounce";
    near.timer = 3;
    near.target = { x: player.x, z: player.z };
    playSound("meow");
    say(`You play a pounce game with ${near.name}! It squeaks with delight.`, 2);
    return true;
  }
  const name = near.name || "your clanmate";
  if (time - (near.groomedAt || -99) < GROOM_COOLDOWN) {
    say(`${name} was groomed only a moment ago.`, 1.5);
    return true;
  }
  near.groomedAt = time;
  near.social = "groom";
  near.socialTimer = 4;
  player.hp = Math.min(100, player.hp + GROOM_HEAL);
  playSound("purr");
  say(`You share tongues with ${name}. You both feel better.`, 2);
  return true;
}

// R63: camp cats pair up to groom, greet, share prey or argue
function updateSocial(dt) {
  for (const c of campCats) {
    if (c.socialTimer > 0) {
      c.socialTimer -= dt;
      if (c.socialTimer <= 0) { c.social = null; c.partner = null; }
    }
  }
  socialClock -= dt;
  if (socialClock > 0) return;
  socialClock = SOCIAL_TIME;
  const free = campCats.filter((c) => !c.injured && !isFollowingMentor(c) && !c.social && !c.eating);
  if (free.length < 2) return;
  const a = free.splice(Math.floor(Math.random() * free.length), 1)[0];
  const b = free[Math.floor(Math.random() * free.length)];
  const type = ["groom", "greet", "share", "argue"][Math.floor(Math.random() * 4)];
  for (const [c, other] of [[a, b], [b, a]]) Object.assign(c, { social: type, socialTimer: 6, partner: other });
}

// R62: a smart rogue sometimes sidesteps your hit
function playerHits(e, amount) {
  if (e.smart && e.stagger <= 0 && Math.random() < ROGUE_DODGE) {
    const side = Math.random() < 0.5 ? 1 : -1;
    e.x += Math.cos(player.heading) * side;
    e.z -= Math.sin(player.heading) * side;
    pushOutOfObstacles(e, CAT_R);
    return false;
  }
  hurtEnemy(e, amount);
  return true;
}

// R62: after the apprenticeship, rogues come as packs of 2-3 that roam the territory
function spawnRoguePack(spot) {
  Object.assign(rogue, { x: spot.x, z: spot.z, hp: ROGUE_PACK_HP, windup: 0, cooldown: 0, stagger: 0, state: "roaming",
                         smart: true, damage: ROGUE_PACK_DAMAGE, raidClock: 0, raiding: false, target: null, timer: 0 });
  const size = 1 + Math.floor(Math.random() * 2);   // 1-2 more
  rogueMates = [];
  for (let i = 0; i < size; i++) {
    rogueMates.push({ x: spot.x + (i ? -1.5 : 1.5), z: spot.z - 1, hp: ROGUE_HP, heading: 0, walk: 0, windup: 0, cooldown: 1 + i,
                      hurtTimer: 0, stagger: 0, fleeTimer: 0, state: "roaming", smart: true, damage: 14, isMate: true,
                      look: { fur: ["#5a5048", "#7a6a5a"][i], eyes: "#d4c84a", pattern: "Tabby" } });
  }
  say("A pack of rogues has been seen on your territory! They are roaming - and dangerous.", 3);
}

// Where a roaming pack goes next: somewhere in your territory, or your camp when it is time to raid
function rogueRoamTarget() {
  if (rogue.raiding) return FRESH_KILL;
  if (!rogue.target || distance(rogue, rogue.target) < 2) rogue.target = spotFor(clanName, -40 + Math.random() * 90, -40 + Math.random() * 90);
  return rogue.target;
}

function updateRoguePack(dt) {
  const r = rogue;
  // The rest of the pack sticks with the leader and fights with it
  for (const m of rogueMates) {
    m.hurtTimer = Math.max(0, m.hurtTimer - dt);
    m.stagger = Math.max(0, m.stagger - dt);
    if (m.state === "fleeing") {
      const away = Math.atan2(m.x - CAMP.x, m.z - CAMP.z);
      m.x += Math.sin(away) * 8 * dt;
      m.z += Math.cos(away) * 8 * dt;
      m.fleeTimer -= dt;
      if (m.fleeTimer <= 0) m.state = "gone";
    } else if (r.state === "fighting" && m.state !== "gone") {
      if (m.state !== "fighting") m.state = "fighting";
      fightStep(m, dt);
    } else if (m.state !== "gone") {
      m.state = "roaming";
      moveToward(m, { x: r.x + (m.cooldown > 1.5 ? -1.5 : 1.5), z: r.z - 1 }, 4.5, dt);
    }
  }
  rogueMates = rogueMates.filter((m) => m.state !== "gone");
  if (r.state !== "roaming") return;
  // Roaming: look for you, and raid the camp if nobody chases the pack off
  if (distance(player, r) < ROGUE_SIGHT && !outOfReach(r)) {
    r.state = "fighting";
    rogueMates.forEach((m) => { m.state = "fighting"; });
    playSound("hiss");
    say("The rogue pack attacks!", 2);
    return;
  }
  r.raidClock += dt;
  if (r.raidClock >= ROGUE_RAID_AFTER && !r.raiding) {
    r.raiding = true;
    say("The rogue pack is heading for your camp!", 3);
  }
  moveToward(r, rogueRoamTarget(), r.raiding ? 5 : 2.5, dt);
  if (r.raiding && distance(r, FRESH_KILL) < 2) {
    // Steal and hurt, then go back to roaming
    takeFromPile(1);
    hurtCampCats(1);
    r.raiding = false;
    r.raidClock = 0;
    r.target = null;
    say("Rogues raided your camp! They stole fresh-kill and hurt a clanmate.", 3.5);
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
  // R32: looking up lowers the camera and tilts it up; looking down raises it and tilts it down
  const pitch = player.camPitch || 0;
  const cam = {
    x: player.x - fx * back,
    y: Math.max(0.12, player.y + height - pitch * 0.5 * size),
    z: player.z - fz * back,
    lookX: player.x + fx * 4,
    lookY: player.y + 0.45 * size + Math.tan(pitch) * 4,
    lookZ: player.z + fz * 4,
  };
  // R25: inside a hut, keep the camera inside the walls
  const hut = insideHut(player);
  if (hut) {
    const room = hut.R - 0.4;
    const d = distance(cam, hut);
    if (d > room) {
      cam.x = hut.x + (cam.x - hut.x) * (room / d);
      cam.z = hut.z + (cam.z - hut.z) * (room / d);
    }
    cam.y = Math.min(cam.y, hut.R * 0.6);
  }
  return cam;
}

// Letters only, first letter capital: "fIRE" -> "Fire"
function cleanName(raw) {
  const letters = raw.replace(/[^a-zA-Z]/g, "");
  if (!letters) return "Fire";
  return letters[0].toUpperCase() + letters.slice(1).toLowerCase();
}

resetGame();
