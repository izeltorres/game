// Cat Clans - connects the game (game.js) and the 3D view (render3d.js) to the web page:
// keyboard, start menu, HUD, map, herb pouch, mentor and role choice, and the main loop.

// ======================================================
// Keyboard
// ======================================================
const GAME_KEYS = ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];

window.addEventListener("keydown", (e) => {
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
  if (playing && GAME_KEYS.includes(e.code)) e.preventDefault(); // stop the page from scrolling
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });
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
  if (player.carrying) return `Take the ${player.carrying} to the fresh-kill pile in camp.` + directionTo(FRESH_KILL);
  if (stage === 0) return "Task 1: Hunt a squirrel. Hold Shift to stalk slowly, then press E to pounce. Hold Q to sniff out prey.";
  if (stage === 1) return "Task 2: Go fishing at the water in your territory. Stand by the water and press E." +
                          directionTo({ x: CAMP.x > 0 ? RIVER_X0 - 1 : STREAM_X0 - 1, z: player.z });
  if (choosingMentor) return "Choose your mentor.";
  if (stage === 2) return `Task 3: A rogue cat is on your territory. Chase it off! Your mentor ${mentorName() || ""} is with you.` + directionTo(rogue);
  if (choosingRole) return "Choose your path.";
  if (role === "Leader") return "You lead your clan. Give orders: 1 Follow, 2 Hunt, 3 Guard.";
  if (role === "Medicine cat") return "Pick herbs (E) and heal hurt clanmates in camp (E next to them).";
  const need = LEADER_NEEDS[role];
  let text = `To become leader: prey ${stats.hunts}/${need.hunts}, fights ${stats.fights}/${need.fights}.`;
  if (rogue.state === "waiting") text += " A rogue is out there" + directionTo(rogue) + ".";
  return text;
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
  setText($("clock"), `Day ${day} · ${clockText()} · ${phase[0].toUpperCase() + phase.slice(1)}`);

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
    setText($("orders"), ["follow", "hunt", "guard"]
      .map((o, i) => `${i + 1} ${o[0].toUpperCase() + o.slice(1)}${o === order ? " ◀" : ""}`).join("   "));
  }

  $("main-menu").classList.toggle("hidden", !(playing && ui.menu));   // R26
  updatePouch();
  updateMap();
  updateFishingBox();
}

function updateFishingBox() {
  $("fishing").classList.toggle("hidden", !fishing.active);
  if (!fishing.active) return;
  const goal = stage === 1 ? ` · catches: ${fishing.catches} / 3` : "";
  setText($("fishing-text"), `Fishing${goal}   (E to strike, Esc to stop)`);
  const zone = $("fish-zone");
  zone.style.width = `${fishZoneWidth() * 100}%`;
  zone.style.left = `${(fishing.zone - fishZoneWidth() / 2) * 100}%`;
  const fish = $("fish");
  fish.style.left = `${fishing.marker * 100}%`;
  fish.style.transform = `translateX(-50%) scaleX(${fishing.dir < 0 ? -1 : 1})`;
  $("fish-water").className = fishing.flash > 0 ? (fishing.flashGood ? "good" : "bad") : "";
}

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
  setText($("pouch-count"), `${pouchCount()} / ${pouchSize()} herbs · H to close`);
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

function buildMapLegend() {
  const legend = $("map-legend");
  for (const [name, clan] of Object.entries(CLANS)) {
    const li = document.createElement("li");
    li.innerHTML = `<span class="key" style="background:${clan.color}"></span>${name}`;
    legend.appendChild(li);
  }
  const you = document.createElement("li");
  you.innerHTML = `<span class="key" style="background:#fff"></span>You`;
  legend.appendChild(you);
}

let mapWasOpen = false;
let mapDrawnAt = -1;

function updateMap() {
  const open = playing && ui.map;
  $("map").classList.toggle("hidden", !open);
  // Draw when it opens, then about 10 times a second
  if (open && (!mapWasOpen || time - mapDrawnAt > 0.1)) drawMap();
  mapWasOpen = open;
}

function drawMap() {
  mapDrawnAt = time;
  const c = $("map-canvas").getContext("2d");
  const half = MAP_SIZE / 2;
  // Territories in their clan colours
  for (const [name, clan] of Object.entries(CLANS)) {
    c.fillStyle = clan.color;
    c.fillRect(clan.sx < 0 ? 0 : half, clan.sz < 0 ? half : 0, half, half);
  }
  // Borders
  c.strokeStyle = "rgba(0, 0, 0, 0.6)";
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(half, 0); c.lineTo(half, MAP_SIZE);
  c.moveTo(0, half); c.lineTo(MAP_SIZE, half);
  c.stroke();
  // River and stream
  c.fillStyle = "#2f6fb0";
  for (const w of WATERS) {
    const a = mapToCanvas(w.x0, WORLD_HALF);
    const b = mapToCanvas(w.x1, -WORLD_HALF);
    c.fillRect(a.x, a.y, b.x - a.x, b.y - a.y);
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
hooks.afterUpdate = updateHud;

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
  "Warrior": "Hunt and fight for your clan. 5 prey and 3 fights make you leader.",
  "Deputy": "The leader's right paw. Only 3 prey and 2 fights to become leader.",
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
  // R26: the main menu (opened with Esc)
  $("main-menu").querySelector("[data-action='resume']").addEventListener("click", () => { ui.menu = false; updateHud(); document.activeElement.blur(); });
  $("main-menu").querySelector("[data-action='restart']").addEventListener("click", restartFromMenu);
  $("main-menu").querySelector("[data-action='newcat']").addEventListener("click", showMenu);
  updatePreviewName();
}

function updatePreviewName() {
  previewNameEl.textContent = `${cleanName(nameInput.value)}kit of ${clanName}`;
}

function startGame() {
  catName = cleanName(nameInput.value);
  resetGame();
  buildScene();   // the world depends on the clan and the cat's look
  playing = true;
  menuEl.classList.add("hidden");
  hudEl.classList.remove("hidden");
  document.activeElement.blur(); // so keys move the cat instead of typing or clicking
  updateHud();
  showMessage(`Welcome to ${clanName}, ${fullName()}! W to walk (tap twice to run), A/D to turn, M for the map.`, 4);
}

// R26: Restart from the main menu: the same cat and clan start over as a kit
function restartFromMenu() {
  restartGame();
  buildScene();
  updateHud();
  document.activeElement.blur();
  showMessage(`${fullName()} starts again in ${clanName}.`, 3);
}

function showMenu() {
  playing = false;
  fishing.active = false;
  choosingRole = false;
  choosingMentor = false;
  ui.map = false;
  ui.pouch = false;
  ui.menu = false;
  menuEl.classList.remove("hidden");
  hudEl.classList.add("hidden");
  for (const id of ["message", "role-choice", "mentor-choice", "fishing", "pouch", "map", "main-menu"]) $(id).classList.add("hidden");
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
  requestAnimationFrame(loop);
}

$("game-title").textContent = GAME_NAME;   // R21
document.title = document.title.replace("Forest Clans", GAME_NAME);
buildMenu();
buildMentorChoice();
buildRoleChoice();
buildPouch();
buildMapLegend();
initView($("game"));
initPreview($("preview"));
if (!has3D()) {
  showMessage("The 3D library could not load. Check your internet connection and reload the page.", 30);
}
requestAnimationFrame(loop);
