// Forest Clans - connects the game (game.js) and the 3D view (render3d.js) to the web page:
// keyboard, start menu, HUD, role choice and the main loop.

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
const hudEl = document.getElementById("hud");
const catInfoEl = document.getElementById("cat-info");
const taskEl = document.getElementById("task");
const clockEl = document.getElementById("clock");
const ordersEl = document.getElementById("orders");
const messageEl = document.getElementById("message");
const roleChoiceEl = document.getElementById("role-choice");
const fishingEl = document.getElementById("fishing");
const rogueBarEl = document.getElementById("rogue-bar");
let messageTimeout = null;

function showMessage(text, seconds) {
  messageEl.textContent = text;
  messageEl.classList.remove("hidden");
  clearTimeout(messageTimeout);
  messageTimeout = setTimeout(() => messageEl.classList.add("hidden"), seconds * 1000);
}

// Which way to go, compared to where the cat is facing
function directionTo(target) {
  const dx = target.x - player.x;
  const dz = target.z - player.z;
  if (Math.hypot(dx, dz) < 12) return "";
  let angle = Math.atan2(dx, dz) - player.heading;
  angle = Math.atan2(Math.sin(angle), Math.cos(angle));   // between -PI and PI
  if (Math.abs(angle) < 0.5) return " (straight ahead)";
  if (Math.abs(angle) > 2.6) return " (behind you)";
  return angle > 0 ? " (turn left)" : " (turn right)";
}

function taskText() {
  if (stage === 0) return "Task 1: Hunt a squirrel. Hold Shift to stalk slowly, then press E to pounce.";
  if (stage === 1) return "Task 2: Go fishing at the river to the east. Stand by the water and press E." +
                          directionTo({ x: RIVER_X0 - 1, z: player.z });
  if (stage === 2) return "Task 3: A rogue cat is on your territory. Chase it off!" + directionTo(rogue);
  if (choosingRole) return "Choose your path.";
  if (role === "Leader") return "You lead your clan. Give orders: 1 Follow, 2 Hunt, 3 Guard.";
  if (role === "Medicine cat") return "Find glowing herbs and press E to heal. Fish and hunt to stay fed.";
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
  setText(catInfoEl, `${fullName()} · ${rankName()} of ${clanName}`);
  setText(taskEl, taskText());
  const phase = dayPhase();
  setText(clockEl, `Day ${day} · ${clockText()} · ${phase[0].toUpperCase() + phase.slice(1)}`);

  // R8: health and food bars at the bottom
  setBar(document.getElementById("health-bar"), player.hp, 100);
  setBar(document.getElementById("food-bar"), player.food, 100);
  document.getElementById("food-bar").classList.toggle("low", player.food < 20);

  rogueBarEl.classList.toggle("hidden", !(playing && rogue.state === "fighting"));
  setBar(rogueBarEl, Math.max(0, rogue.hp), ROGUE_HP);

  // R9: role choice and leader orders
  roleChoiceEl.classList.toggle("hidden", !(playing && choosingRole));
  const leader = playing && role === "Leader";
  ordersEl.classList.toggle("hidden", !leader);
  if (leader) {
    setText(ordersEl, ["follow", "hunt", "guard"]
      .map((o, i) => `${i + 1} ${o[0].toUpperCase() + o.slice(1)}${o === order ? " ◀" : ""}`).join("   "));
  }

  updateFishingBox();
}

function updateFishingBox() {
  fishingEl.classList.toggle("hidden", !fishing.active);
  if (!fishing.active) return;
  const goal = stage === 1 ? ` · catches: ${fishing.catches} / 3` : "";
  setText(document.getElementById("fishing-text"), `Fishing${goal}   (E to strike, Esc to stop)`);
  const zone = document.getElementById("fish-zone");
  zone.style.width = `${fishZoneWidth() * 100}%`;
  zone.style.left = `${(fishing.zone - fishZoneWidth() / 2) * 100}%`;
  const fish = document.getElementById("fish");
  fish.style.left = `${fishing.marker * 100}%`;
  fish.style.transform = `translateX(-50%) scaleX(${fishing.dir < 0 ? -1 : 1})`;
  document.getElementById("fish-water").className = fishing.flash > 0 ? (fishing.flashGood ? "good" : "bad") : "";
}

hooks.message = showMessage;
hooks.afterUpdate = updateHud;

// ======================================================
// Role choice (R9)
// ======================================================
const ROLE_TEXT = {
  "Warrior": "Hunt and fight for your clan. 5 prey and 3 fights make you leader.",
  "Deputy": "The leader's right paw. Only 3 prey and 2 fights to become leader.",
  "Medicine cat": "Heal with herbs. Medicine cats never become leader.",
};

function buildRoleChoice() {
  const box = document.getElementById("role-options");
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
const menuEl = document.getElementById("menu");
const nameInput = document.getElementById("name-input");
const previewNameEl = document.getElementById("preview-name");

function selectIn(box, button) {
  box.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
  button.classList.add("selected");
}

function makeSwatches(boxId, colors, property) {
  const box = document.getElementById(boxId);
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

  const patternBox = document.getElementById("pattern-options");
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

  const clanBox = document.getElementById("clan-options");
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
  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("new-cat").addEventListener("click", showMenu);
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
  showMessage(`Welcome to ${clanName}, ${fullName()}! W to walk (tap twice to run), A/D to turn.`, 4);
}

function showMenu() {
  playing = false;
  fishing.active = false;
  choosingRole = false;
  menuEl.classList.remove("hidden");
  hudEl.classList.add("hidden");
  messageEl.classList.add("hidden");
  roleChoiceEl.classList.add("hidden");
  fishingEl.classList.add("hidden");
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

buildMenu();
buildRoleChoice();
initView(document.getElementById("game"));
initPreview(document.getElementById("preview"));
if (!has3D()) {
  showMessage("The 3D library could not load. Check your internet connection and reload the page.", 30);
}
requestAnimationFrame(loop);
