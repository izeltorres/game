// Cat Clans - connects the game (game.js) and the 3D view (render3d.js) to the web page:
// keyboard, start menu, HUD, map, herb pouch, mentor and role choice, and the main loop.

// ======================================================
// Keyboard
// ======================================================
const GAME_KEYS = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

window.addEventListener("keydown", (e) => {
  startAudio();   // R61: browsers only allow sound after a key press or click
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (playing && GAME_KEYS.includes(e.code)) e.preventDefault(); // stop the page from scrolling
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });
window.addEventListener("pointerdown", () => startAudio());
window.addEventListener("blur", () => { for (const k in keys) keys[k] = false; });

// ======================================================
// HUD and messages (HTML on top of the 3D view)
// ======================================================
const $ = (id) => document.getElementById(id);
const hudEl = $("hud");
const messageEl = $("message");
let messageTimeout = null;

function showMessage(text, seconds) {
  messageEl.textContent = text;
  messageEl.classList.remove("hidden");
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => messageEl.classList.add("hidden"), seconds * 1000);
}

// Which way to go, in words, for a far-away target
function directionTo(target) {
  return distance(player, target) < 12 ? "" : ` (${turnHint(target)})`;
}

function taskText() {
  // Carrying prey adds a reminder in front of whatever the task is
  const carry = player.carrying ? `Carrying a ${player.carrying}: take it to the fresh-kill pile${directionTo(FRESH_KILL)} or drop it (G). ` : "";
  return carry + mainTask();
}

function mainTask() {
  // R42, R45: kits catch a mix of beetles and mice in camp
  if (stage === 0) return `Kit: catch beetles (${kitCatches.beetle}/${KIT_NEEDS.beetle}) and mice ` +
                          `(${kitCatches.mouse}/${KIT_NEEDS.mouse}) in camp. Stalk mice with Shift. Hold Q to sniff out prey.`;
  if (choosingMentor) return "Choose your mentor.";
  // R44: the mentor's tasks
  if (stage === 1) {
    const task = currentTask();
    // R67: the next border marker is always pointed to, with how far it is
    const where = !taskSpot() ? "" : task === "patrol" ? ` (${turnHint(taskSpot())}, ${Math.round(distance(player, taskSpot()))} paces)` : directionTo(taskSpot());
    const text = {
      patrol: `Border patrol: marker ${markersVisited + 1} of ${BORDER_MARKERS.length}`,
      squirrel: "Hunt a squirrel (stalk with Shift, pounce with E)",
      climb: `Climb a tree (${player.y.toFixed(1)} of ${CLIMB_TASK_HEIGHT} up)`,
      fish: `Catch fish at the water (${fishing.catches}/${FISH_FOR_TASK})`,
      rogue: "Chase off the rogue",
    }[task];
    return `${mentorName()}'s task: ${text}.${where}`;
  }
  if (choosingRole) return "Choose your path.";
  if (role === "Leader") {
    if (gathering.called) return `Go to the Gathering at the Great Oak${directionTo(GATHERING_SPOT)}. Orders: 1 Follow, 2 Hunt, 3 Guard, 4 Big hunt.`;
    return "You lead your clan. Orders: 1 Follow, 2 Hunt, 3 Guard, 4 Big hunt.";
  }
  if (role === "Medicine cat") {
    // R57: medicine cat tasks and ranks
    const need = MED_NEEDS[medRank];
    const quest = medQuest ? ` Quest: put ${medQuest.marigold} marigold and ${medQuest.dock} dock in the store (${questDeposited.marigold}/${medQuest.marigold}, ${questDeposited.dock}/${medQuest.dock}).` : "";
    if (!need) return `Keep the herb store stocked (${herbStore}) and heal hurt clanmates (E next to them).${quest}`;
    return `To become ${MED_RANKS[medRank + 1].toLowerCase()}: quests ${stats.quests}/${need.quests}, clanmates treated ${stats.treated}/${need.treated}` +
           `${need.store ? `, herb store ${herbStore}/${need.store}` : ""}.${quest}`;
  }
  // R45: the way to deputy and leader
  if (role === "Warrior") {
    const n = DEPUTY_NEEDS;
    return `To become deputy: prey ${stats.hunts}/${n.hunts}, fights ${stats.fights}/${n.fights}, ` +
           `border patrol ${stats.patrols}/${n.patrols} (next marker${directionTo(BORDER_MARKERS[markersVisited])}).`;
  }
  const n = LEADER_NEEDS;
  const lesson = trainee ? { hunt: `hunting lesson ${trainee.lessonCount}/${LESSON_HUNTS} (stay near prey)`,
                             battle: `battle practice ${trainee.lessonCount}/${LESSON_HITS} (face ${trainee.name}, press E)`,
                             patrol: `walk the border markers with ${trainee.name}` }[trainee.lesson] : "done";
  return `To become leader: prey ${stats.hunts}/${n.hunts}, fights ${stats.fights}/${n.fights}, ` +
         `train your apprentice: ${lesson}.`;
}

function setText(el, text) {
  if (el.textContent !== text) el.textContent = text;   // only touch the page when it changes
}

function setBar(el, value, max) {
  const width = `${clamp(value / max, 0, 1) * 100}%`;
  const fill = el.querySelector(".fill");
  if (fill.style.width !== width) fill.style.width = width;
}

function updateHud() {
  setText($("task"), taskText());
  const phase = dayPhase();
  const sky = { clear: "Clear", rain: "Rain", fog: "Fog", wind: "Windy", storm: "Thunderstorm" }[weather];   // R30
  const s = season();   // R69
  setText($("clock"), `Day ${day} · ${s[0].toUpperCase() + s.slice(1)} · ${clockText()} · ${phase[0].toUpperCase() + phase.slice(1)} · ${sky}` +
                      (lookingOut() ? " · Lookout: you can see far from up here (M for the map)" : ""));   // R64

  // R37: a leader's lives
  $("lives").classList.toggle("hidden", !(playing && role === "Leader"));
  if (role === "Leader") setText($("lives"), `Lives: ${"♥".repeat(Math.max(0, player.lives))} ${player.lives}`);

  // R16: whose land you are on
  const land = territoryAt(player.x, player.z);
  const enemyLand = playing && land !== clanName;
  setText($("territory"), enemyLand ? `⚠ ${land} territory: their patrols will attack!` : `${land} territory (home)`);
  $("territory").classList.toggle("danger", enemyLand);

  // R14: scent
  $("scent").classList.toggle("hidden", !(playing && player.scenting));
  if (player.scenting) setText($("scent"), scentHint());

  // R8: health and food bars at the bottom
  setBar($("health-bar"), player.hp, 100);
  setBar($("food-bar"), player.food, 100);
  $("food-bar").classList.toggle("low", player.food < 20);

  // The bar for whoever you are fighting
  const enemy = fightingEnemies()[0];
  $("rogue-bar").classList.toggle("hidden", !(playing && enemy));
  if (enemy) {
    setBar($("rogue-bar"), Math.max(0, enemy.hp), enemy === rogue ? ROGUE_HP : PATROL_HP);
    setText($("rogue-bar").querySelector("span"), enemy === rogue ? "Rogue" : `${enemy.clan} warrior`);
  }

  // R9, R19: choices and leader orders
  $("mentor-choice").classList.toggle("hidden", !(playing && choosingMentor));
  $("role-choice").classList.toggle("hidden", !(playing && choosingRole));
  const leader = playing && role === "Leader";
  $("orders").classList.toggle("hidden", !leader);
  if (leader) {
    const names = { follow: "Follow", hunt: "Hunt", guard: "Guard", bighunt: "Big hunt" };   // 4: R47
    setText($("orders"), ["follow", "hunt", "guard", "bighunt"]
      .map((o, i) => `${i + 1} ${names[o]}${o === order ? " ◀" : ""}`).join("   "));
  }

  // R48, R50: a speech or decision waiting for the player
  updateChoice();
  // R49: the deputy's mission
  $("mission").classList.toggle("hidden", !(playing && mission));
  if (mission) setText($("mission"), missionText());
  // R53: the aiming dot
  $("aim").classList.toggle("hidden", !(playing && !ui.menu && !pendingChoice));
  $("aim").classList.toggle("on-herb", playing && !!aimedHerb());
  $("main-menu").classList.toggle("hidden", !(playing && ui.menu));   // R26
  // R37: after a game over the menu can only restart
  setText($("main-menu-title"), ui.gameOver ? "You have lost all nine lives" : "Paused");
  $("main-menu").querySelector("[data-action='resume']").classList.toggle("hidden", ui.gameOver);
  $("main-menu").querySelector("[data-action='save']").classList.toggle("hidden", ui.gameOver);   // R84
  updatePouch();
  updateMap();
  updateFishingBox();
}

function updateFishingBox() {
  $("fishing").classList.toggle("hidden", !fishing.active);
  if (!fishing.active) return;
  // R35: fishing is in 3D now; this only gives the instructions
  const goal = currentTask() === "fish" ? ` · catches: ${fishing.catches} / ${FISH_FOR_TASK}` : "";
  const splash = fishing.flash > 0 ? (fishing.flashGood ? " · Caught one!" : " · Splash! Missed.") : "";
  setText($("fishing-text"), `Fishing${goal} · E when a fish is under your paw (the ripple) · Esc to stop${splash}`);
}

// ======================================================
// Mouse look (R32): click the game to capture the mouse
// ======================================================
let mouseLocked = false;

$("game").addEventListener("click", () => {
  clickToPick();   // R53: pick the herb under the aiming dot
  if (playing && !ui.menu && !choosingMentor && !choosingRole && $("game").requestPointerLock) $("game").requestPointerLock();
});
document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === $("game")) {
    mouseLocked = true;
    return;
  }
  // The mouse was let go (Esc does this): open the main menu
  if (mouseLocked && playing && !ui.menu) ui.menu = true;
  mouseLocked = false;
  updateHud();
});
document.addEventListener("mousemove", (e) => {
  if (mouseLocked && playing && !ui.menu) lookWithMouse(e.movementX, e.movementY);
});

// ======================================================
// Herb pouch (R18)
// ======================================================
function buildPouch() {
  const list = $("pouch-list");
  Object.keys(HERBS).forEach((kind, i) => {
    const b = document.createElement("button");
    b.dataset.herb = kind;
    b.addEventListener("click", () => {
      useHerb(kind);
      updateHud();
      document.activeElement.blur();
    });
    b.dataset.key = i + 1;
    list.appendChild(b);
  });
}

function updatePouch() {
  $("pouch").classList.toggle("hidden", !(playing && ui.pouch));
  if (!ui.pouch) return;
  setText($("pouch-count"), `${pouchCount()} / ${pouchSize()} herbs · medicine den store: ${herbStore} · H to close`);
  $("pouch-list").querySelectorAll("button").forEach((b) => {
    const herb = HERBS[b.dataset.herb];
    const heal = Math.round(herb.heal * healMult());
    setText(b, `${b.dataset.key}: ${herb.name} × ${player.pouch[b.dataset.herb]} (heals ${heal})`);
    b.disabled = player.pouch[b.dataset.herb] === 0;
  });
}

// ======================================================
// Map (R15)
// ======================================================
const MAP_SIZE = 360;

// World position -> pixel on the map canvas (north is up)
function mapToCanvas(x, z) {
  const scale = MAP_SIZE / (WORLD_HALF * 2);
  return { x: (x + WORLD_HALF) * scale, y: (WORLD_HALF - z) * scale };
}

// ======================================================
// Choices (R48, R50): a speech at the Gathering or a leader's decision
// ======================================================
let choiceShown = null;

function updateChoice() {
  $("choice").classList.toggle("hidden", !(playing && pendingChoice));
  if (!pendingChoice || choiceShown === pendingChoice) return;
  choiceShown = pendingChoice;
  setText($("choice-title"), pendingChoice.title);
  setText($("choice-text"), pendingChoice.text);
  const box = $("choice-options");
  box.innerHTML = "";
  pendingChoice.options.forEach((o, i) => {
    const b = document.createElement("button");
    b.textContent = o.label;
    b.addEventListener("click", () => {
      chooseOption(i);
      choiceShown = null;
      updateHud();
      document.activeElement.blur();
    });
    box.appendChild(b);
  });
}

// R49: what the deputy's mission needs
function missionText() {
  if (mission.type === "message") return `Mission: carry a message to the ${mission.clan} camp${directionTo(mission.target)}.`;
  if (mission.type === "stolen") {
    return mission.carried ? `Mission: bring the stolen rabbit to your fresh-kill pile${directionTo(FRESH_KILL)}.`
                           : `Mission: take back the rabbit ${mission.clan} stole${directionTo(mission.target)}.`;
  }
  return mission.kit.following ? `Mission: bring ${mission.kit.name} home to camp${directionTo(CAMP)}.`
                               : `Mission: find ${mission.kit.name} in ${mission.clan} territory${directionTo(mission.kit)}.`;
}

function buildMapLegend() {
  const legend = $("map-legend");
  for (const [name, clan] of Object.entries(CLANS)) {
    const li = document.createElement("li");
    li.dataset.clan = name;
    li.innerHTML = `<span class="key" style="background:${clan.color}"></span>${name}<small></small>`;
    legend.appendChild(li);
  }
  const you = document.createElement("li");
  you.innerHTML = `<span class="key" style="background:#fff"></span>You`;
  legend.appendChild(you);
}

let mapWasOpen = false;
let mapDrawnAt = -1;
let mapShowsSpotted = false;   // R64: the map shows what you can see from high in a tree

function updateMap() {
  const open = playing && ui.map;
  $("map").classList.toggle("hidden", !open);
  // Draw when it opens, then about 10 times a second
  if (open && (!mapWasOpen || time - mapDrawnAt > 0.1)) drawMap();
  // R54: rivalries in the legend
  if (open) {
    $("map-legend").querySelectorAll("li[data-clan]").forEach((li) => {
      const c = li.dataset.clan;
      const r = rivalry[c];
      const mood = r === undefined ? "your clan" : `rivalry ${Math.round(r)} (${r >= RIVALRY_HOSTILE ? "hostile" : (r < RIVALRY_FRIENDLY ? "friendly" : "tense")})`;
      setText(li.querySelector("small"), ` · ${mood}`);
    });
  }
  mapWasOpen = open;
}

function drawMap() {
  mapDrawnAt = time;
  const c = $("map-canvas").getContext("2d");
  const half = MAP_SIZE / 2;
  // Territories in their clan colours, wherever the borders are now (R78): painted in small squares
  const cell = 4;
  const toWorld = (px) => (px / MAP_SIZE) * WORLD_HALF * 2 - WORLD_HALF;
  for (let px = 0; px < MAP_SIZE; px += cell) {
    for (let py = 0; py < MAP_SIZE; py += cell) {
      c.fillStyle = CLANS[territoryAt(toWorld(px + cell / 2), -toWorld(py + cell / 2))].color;
      c.fillRect(px, py, cell, cell);
    }
  }
  // River and stream
  c.fillStyle = "#2f6fb0";
  // (drawn as a shape along z, so the river's bends show, R74)
  for (let i = 0; i < WATERS.length; i++) {
    c.beginPath();
    for (let z = -WORLD_HALF; z <= WORLD_HALF; z += 2) { const p = mapToCanvas(watersAt(z)[i].x0, z); c.lineTo(p.x, p.y); }
    for (let z = WORLD_HALF; z >= -WORLD_HALF; z -= 2) { const p = mapToCanvas(watersAt(z)[i].x1, z); c.lineTo(p.x, p.y); }
    c.closePath();
    c.fill();
  }
  // Camps and names
  c.textAlign = "center";
  c.font = "bold 13px Georgia";
  for (const name of Object.keys(CLANS)) {
    const p = mapToCanvas(campOf(name).x, campOf(name).z);
    c.fillStyle = "#3a2a1a";
    c.beginPath();
    c.arc(p.x, p.y, 6, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#fff";
    c.fillText(name === clanName ? `${name} (home)` : name, p.x, p.y + 22);
  }
  // R67: border markers in yellow, the next one bigger
  BORDER_MARKERS.forEach((mk, i) => {
    const q = mapToCanvas(mk.x, mk.z);
    c.fillStyle = "#ffd86b";
    c.beginPath();
    c.arc(q.x, q.y, i === markersVisited ? 6 : 4, 0, Math.PI * 2);
    c.fill();
  });
  // R64: from high in a tree you see prey (green) and enemies (red) far away
  mapShowsSpotted = lookingOut();
  for (const t of spottedFromTree()) {
    const q = mapToCanvas(t.x, t.z);
    c.fillStyle = PREY_KINDS[t.kind] ? "#7dff7a" : "#ff4a3a";
    c.beginPath();
    c.arc(q.x, q.y, 3, 0, Math.PI * 2);
    c.fill();
  }
  // You: a white dot with an arrow for the way you face
  const p = mapToCanvas(player.x, player.z);
  c.fillStyle = "#ffffff";
  c.strokeStyle = "#000";
  c.lineWidth = 1.5;
  c.beginPath();
  c.arc(p.x, p.y, 5, 0, Math.PI * 2);
  c.fill();
  c.stroke();
  c.strokeStyle = "#ffffff";
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(p.x, p.y);
  c.lineTo(p.x + Math.sin(player.heading) * 14, p.y - Math.cos(player.heading) * 14);
  c.stroke();
}

hooks.message = showMessage;
hooks.afterUpdate = () => { updateHud(); autosave(); };   // R84: autosave every 30 s of play

// ======================================================
// Mentor (R19) and role (R9) choices
// ======================================================
function buildMentorChoice() {
  const box = $("mentor-options");
  for (const m of MENTORS) {
    const b = document.createElement("button");
    b.dataset.mentor = m.id;
    b.innerHTML = `<strong>${m.name}</strong><em>${m.specialty}</em><small>${m.teaches}</small>`;
    b.addEventListener("click", () => {
      chooseMentor(m.id);
      updateHud();
      document.activeElement.blur();
    });
    box.appendChild(b);
  }
}

const ROLE_TEXT = {
  "Warrior": "Hunt, fight and patrol for your clan. Earn deputy, train an apprentice, and become leader.",
  "Medicine cat": "Heal yourself and hurt clanmates with herbs. Medicine cats never become leader.",
};

function buildRoleChoice() {
  const box = $("role-options");
  for (const r of ROLES) {
    const b = document.createElement("button");
    b.dataset.role = r;
    b.innerHTML = `<strong>${r}</strong><small>${ROLE_TEXT[r]}</small>`;
    b.addEventListener("click", () => {
      chooseRole(r);
      updateHud();
      document.activeElement.blur();
    });
    box.appendChild(b);
  }
}

// ======================================================
// Start menu
// ======================================================
const menuEl = $("menu");
const nameInput = $("name-input");
const previewNameEl = $("preview-name");

function selectIn(box, button) {
  box.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
  button.classList.add("selected");
}

function makeSwatches(boxId, colors, property) {
  const box = $(boxId);
  for (const [label, color] of Object.entries(colors)) {
    const b = document.createElement("button");
    b.className = "swatch";
    b.style.background = color;
    b.title = label;
    b.setAttribute("aria-label", label);
    if (look[property] === color) b.classList.add("selected");
    b.addEventListener("click", () => {
      look[property] = color;
      selectIn(box, b);
    });
    box.appendChild(b);
  }
}

function buildMenu() {
  makeSwatches("fur-options", FURS, "fur");
  makeSwatches("eye-options", EYES, "eyes");

  const patternBox = $("pattern-options");
  for (const p of PATTERNS) {
    const b = document.createElement("button");
    b.textContent = p;
    if (look.pattern === p) b.classList.add("selected");
    b.addEventListener("click", () => {
      look.pattern = p;
      selectIn(patternBox, b);
    });
    patternBox.appendChild(b);
  }

  const clanBox = $("clan-options");
  for (const [name, clan] of Object.entries(CLANS)) {
    const b = document.createElement("button");
    b.className = "clan-btn";
    b.style.borderLeftColor = clan.color;
    b.innerHTML = `<strong>${name}</strong><small>${clan.about} &middot; ${clan.perk}</small>`;
    if (clanName === name) b.classList.add("selected");
    b.addEventListener("click", () => {
      clanName = name;
      selectIn(clanBox, b);
      updatePreviewName();
    });
    clanBox.appendChild(b);
  }

  nameInput.addEventListener("input", updatePreviewName);
  $("start-btn").addEventListener("click", startGame);
  renderSaves();   // R84: saved cats to continue
  // R26: the main menu (opened with Esc)
  $("main-menu").querySelector("[data-action='resume']").addEventListener("click", () => { ui.menu = false; updateHud(); document.activeElement.blur(); });
  $("main-menu").querySelector("[data-action='restart']").addEventListener("click", restartFromMenu);
  $("main-menu").querySelector("[data-action='newcat']").addEventListener("click", showMenu);
  $("main-menu").querySelector("[data-action='save']").addEventListener("click", () => say(saveNow() ? "Game saved." : "Nothing to save yet.", 2));   // R84
  $("replace-cancel").addEventListener("click", () => $("replace-slot").classList.add("hidden"));
  // R61: volume and mute
  $("volume").addEventListener("input", (e) => setVolume(e.target.value));
  $("mute").addEventListener("change", (e) => setMuted(e.target.checked));
  updatePreviewName();
}

function updatePreviewName() {
  previewNameEl.textContent = `${cleanName(nameInput.value)}kit of ${clanName}`;
}

// ======================================================
// R84: save slots, kept in the browser (localStorage). game.js turns the game into data and back.
// ======================================================
const SAVE_KEY = document.getElementById("summary") ? "catclans-test-saves" : "catclans-saves";   // the test page has its own
const SAVE_SLOTS = 3;
const AUTOSAVE_EVERY = 30;   // seconds of play
let currentSlot = null;      // which slot this cat saves into
let lastAutosave = 0;

function saveSlots() {
  let list = [];
  try { list = JSON.parse(localStorage.getItem(SAVE_KEY)) || []; } catch (e) { list = []; }
  return Array.from({ length: SAVE_SLOTS }, (_, i) => list[i] || null);
}

function writeSlots(list) {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(list)); } catch (e) { /* storage full or blocked: nothing to do */ }
}

// Save the cat into its slot now. Each save gets a higher number than any before it, so the newest is clear.
function saveNow() {
  if (currentSlot === null || !playing || ui.gameOver) return false;
  const list = saveSlots();
  const newest = Math.max(0, ...list.map((s) => (s ? s.savedAt || 0 : 0)));
  list[currentSlot] = Object.assign(saveData(), { savedAt: newest + 1 });
  writeSlots(list);
  lastAutosave = time;
  return true;
}

function autosave() {
  if (playing && time - lastAutosave >= AUTOSAVE_EVERY) saveNow();
}

// The saved cats on the start menu, each with Continue and Delete
function renderSaves() {
  const box = $("saves");
  box.innerHTML = "";
  saveSlots().forEach((s, i) => {
    if (!s) return;
    const row = document.createElement("div");
    row.className = "save-row";
    const label = document.createElement("span");
    label.textContent = `${s.title} · ${s.rank} · Day ${s.day}`;
    const cont = document.createElement("button");
    cont.textContent = "Continue";
    cont.dataset.act = "continue";
    cont.addEventListener("click", () => continueSlot(i));
    const del = document.createElement("button");
    del.textContent = "Delete";
    del.dataset.act = "delete";
    del.addEventListener("click", () => {
      const list = saveSlots();
      list[i] = null;
      writeSlots(list);
      if (currentSlot === i) currentSlot = null;
      renderSaves();
    });
    row.append(label, cont, del);
    box.appendChild(row);
  });
}

function continueSlot(i) {
  const data = saveSlots()[i];
  if (!data) return;
  loadData(data);
  currentSlot = i;
  buildScene();
  playing = true;
  menuEl.classList.add("hidden");
  hudEl.classList.remove("hidden");
  $("replace-slot").classList.add("hidden");
  document.activeElement.blur();
  lastAutosave = time;
  updateHud();
}

// All slots full: ask which saved cat the new one replaces
function showReplaceChoice() {
  const box = $("replace-options");
  box.innerHTML = "";
  saveSlots().forEach((s, i) => {
    const b = document.createElement("button");
    b.textContent = `Replace ${s.title} (${s.rank}, day ${s.day})`;
    b.addEventListener("click", () => {
      $("replace-slot").classList.add("hidden");
      beginNewCat(i);
    });
    box.appendChild(b);
  });
  $("replace-slot").classList.remove("hidden");
}

window.addEventListener("beforeunload", () => saveNow());
hooks.saveNow = saveNow;

// Start: a new cat goes into an empty save slot (R84), or asks which one to replace
function startGame() {
  const free = saveSlots().indexOf(null);
  if (free < 0) {
    showReplaceChoice();
    return;
  }
  beginNewCat(free);
}

function beginNewCat(slot) {
  catName = cleanName(nameInput.value);
  resetGame();
  buildScene();   // the world depends on the clan and the cat's look
  playing = true;
  menuEl.classList.add("hidden");
  hudEl.classList.remove("hidden");
  document.activeElement.blur(); // so keys move the cat instead of typing or clicking
  updateHud();
  currentSlot = slot;
  saveNow();
  showMessage(`Welcome to ${clanName}, ${fullName()}! W to walk (tap twice to run), A/D to turn, M for the map.`, 4);
}

// R26: Restart from the main menu: the same cat and clan start over as a kit
function restartFromMenu() {
  restartGame();
  buildScene();
  updateHud();
  document.activeElement.blur();
  showMessage(`${fullName()} starts again in ${clanName}.`, 3);
  saveNow();   // R84: the same slot
}

function showMenu() {
  saveNow();   // R84: keep the cat you leave
  playing = false;
  fishing.active = false;
  choosingRole = false;
  choosingMentor = false;
  ui.map = false;
  ui.pouch = false;
  ui.menu = false;
  ui.gameOver = false;
  menuEl.classList.remove("hidden");
  hudEl.classList.add("hidden");
  for (const id of ["message", "role-choice", "mentor-choice", "fishing", "pouch", "map", "main-menu"]) $(id).classList.add("hidden");
  renderSaves();   // R84
  document.activeElement.blur();
}

// ======================================================
// Main loop
// ======================================================
let lastTime = performance.now();

function loop(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000); // cap so a slow frame doesn't break things
  lastTime = now;
  update(dt);
  renderFrame();
  if (!playing) renderPreview();
  updateSound();   // R61
  requestAnimationFrame(loop);
}

$("game-title").textContent = GAME_NAME;   // R21
document.title = document.title.replace("Forest Clans", GAME_NAME);
buildMenu();
buildMentorChoice();
buildRoleChoice();
buildPouch();
buildMapLegend();
// R55: the controls list lives in the main menu (Esc), so the game can fill the window
$("controls-help").innerHTML = `<h3>Controls</h3>
  <p>Walk: W/&uarr; (tap twice to run) &middot; Back: S/&darr; &middot; Turn: A/D or &larr;/&rarr; or the mouse &middot; Stalk: Shift &middot; Jump: Space</p>
  <p>Action: E &middot; Scent: hold Q &middot; Map: M &middot; Herbs: H (and click an herb you aim at) &middot; Drop prey: G</p>
  <p>Fight: E swipe &middot; C dodge &middot; F pounce attack &middot; R bite</p>
  <p>Look up/down: click the game, then move the mouse &middot; Climb: walk into a tree (E at a branch to lie on it)</p>
  <p>Call a patrol to help against a rogue pack: V</p>
  <p>Leader orders: 1 Follow &middot; 2 Hunt &middot; 3 Guard &middot; 4 Big hunt &middot; Menu: Esc (stops fishing while fishing)</p>`;
initView($("game"));
initPreview($("preview"));
// R55: the game fills the window
function resizeGame() {
  fitView(window.innerWidth, window.innerHeight);
}
window.addEventListener("resize", resizeGame);
if (!document.getElementById("summary")) resizeGame();   // (the test page keeps its fixed size)
if (!has3D()) {
  showMessage("The 3D library could not load. Check your internet connection and reload the page.", 30);
}
requestAnimationFrame(loop);
