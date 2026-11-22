// Cat Clans - 3D drawing with Three.js (free, loaded from a CDN in index.html).
// It only reads the game state from game.js; it never changes it.

let view = null;      // { renderer, scene, camera, ... } once the 3D view is ready
let preview = null;   // the small turning cat on the start menu

const ROGUE_LOOK = { fur: "#6b6156", eyes: "#d4c84a", pattern: "Tabby" };
const WHITE_FUR = "#f4f1ea";

const SKY = { night: "#0b1630", day: "#87b5d9", sunset: "#f08a4b" };
// The look of each kind of territory (R6, R15)
const PLACES = {
  forest:    { ground: "#4f8a35", grass: "#6aa843", trunk: "#5b4030", leaves: ["#2f8a3a", "#3a7a3e", "#4a9a40"], fogNear: 40, fogFar: 150 },
  marsh:     { ground: "#3b4a2a", grass: "#6b7a3a", trunk: "#3e2e22", leaves: ["#1f4a2e", "#24563a", "#2c5e34"], fogNear: 12, fogFar: 70 },
  moor:      { ground: "#8a9a55", grass: "#a8a860", trunk: "#5b4a35", leaves: ["#5a7a35", "#6a8a3a", "#4f6f30"], fogNear: 60, fogFar: 200 },
  riverside: { ground: "#5a9a4a", grass: "#7ab850", trunk: "#6b5a45", leaves: ["#6aa84a", "#7cba5a", "#5a9a42"], fogNear: 45, fogFar: 160 },
};

// Grass (R24): blades grow in clumps inside a square that moves with the cat
const GRASS_WINDOW = 60;
const GRASS_CLUMPS = 1500;
const BLADES_PER_CLUMP = 6;
const GRASS_CAMP_RADIUS = 12.5;   // bare ground in camps

const TAIL_SEGMENTS = 8;
const TAIL_LENGTH = 0.075;        // length of one tail segment

function has3D() {
  return typeof THREE !== "undefined";
}

// Lambert materials are cheap and look fine for a low-poly forest
function mat(color, extra) {
  return new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));
}

// ======================================================
// Textures (R60): drawn on a canvas when the game starts, so there are no image files
// ======================================================
const TREE_SWAY = 0.5;   // R68: trees sway half as much as in Round 5
const textureCache = {};

// A grey-to-white pattern; the material's colour tints it
function makeTexture(kind) {
  if (textureCache[kind]) return textureCache[kind];
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const c = canvas.getContext("2d");
  const random = makeRandom(kind.length * 31 + 5);
  const grey = (v, a) => `rgba(${v}, ${v}, ${v}, ${a === undefined ? 1 : a})`;
  c.fillStyle = grey(235);
  c.fillRect(0, 0, size, size);
  if (kind === "ground" || kind === "dirt" || kind === "rock") {
    // Speckles: small light and dark dots (pebbles and grit for dirt, lichen for rock)
    const count = kind === "rock" ? 500 : 900;
    for (let i = 0; i < count; i++) {
      c.fillStyle = grey(150 + Math.floor(random() * 105), 0.6);
      const r = kind === "dirt" ? 0.5 + random() * 2 : 0.5 + random() * 1.5;
      c.beginPath();
      c.arc(random() * size, random() * size, r, 0, Math.PI * 2);
      c.fill();
    }
    if (kind === "rock") {
      c.strokeStyle = grey(120, 0.5);
      for (let i = 0; i < 8; i++) {
        c.beginPath();
        c.moveTo(random() * size, random() * size);
        c.lineTo(random() * size, random() * size);
        c.stroke();
      }
    }
  } else if (kind === "bark") {
    // Long up-and-down cracks
    for (let i = 0; i < 40; i++) {
      c.strokeStyle = grey(110 + Math.floor(random() * 80), 0.7);
      c.lineWidth = 1 + random() * 2;
      const x = random() * size;
      c.beginPath();
      c.moveTo(x, 0);
      c.bezierCurveTo(x + (random() - 0.5) * 10, size / 3, x + (random() - 0.5) * 10, size * 2 / 3, x, size);
      c.stroke();
    }
  } else if (kind === "fur") {
    // Short soft strokes, all leaning the same way
    for (let i = 0; i < 1400; i++) {
      c.strokeStyle = grey(185 + Math.floor(random() * 70), 0.5);
      const x = random() * size;
      const y = random() * size;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x + 1, y + 4 + random() * 3);
      c.stroke();
    }
  } else if (kind === "bramble") {
    // Woven twigs criss-crossing
    for (let i = 0; i < 60; i++) {
      c.strokeStyle = grey(90 + Math.floor(random() * 90), 0.8);
      c.lineWidth = 1.5 + random() * 2;
      const x = random() * size;
      const y = random() * size;
      const a = random() * Math.PI;
      c.beginPath();
      c.moveTo(x - Math.cos(a) * 30, y - Math.sin(a) * 30);
      c.lineTo(x + Math.cos(a) * 30, y + Math.sin(a) * 30);
      c.stroke();
    }
  } else if (kind === "water") {
    // Wavy light lines
    for (let i = 0; i < 26; i++) {
      c.strokeStyle = grey(255, 0.35 + random() * 0.3);
      c.lineWidth = 1 + random();
      const y = random() * size;
      const x = random() * size;
      c.beginPath();
      for (let k = 0; k <= 20; k++) c.lineTo(x + k * 2, y + Math.sin(k * 0.8) * 1.5);
      c.stroke();
    }
    c.globalCompositeOperation = "multiply";
    c.fillStyle = grey(210);
    c.fillRect(0, 0, size, size);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  textureCache[kind] = texture;
  return texture;
}

// A material with a texture repeated `repeat` times (each material gets its own copy so repeats can differ)
function texturedMat(color, kind, repeatX, repeatY, extra) {
  const map = makeTexture(kind).clone();
  map.needsUpdate = true;
  map.repeat.set(repeatX, repeatY === undefined ? repeatX : repeatY);
  return mat(color, Object.assign({ map }, extra || {}));
}

// ======================================================
// Cats (R21: better shape and 7 patterns; R28: a tail that moves like a real cat's)
// ======================================================
// A cat facing +z, about 1 unit long at size 1.
// userData: body, head, legs, paws, torso, tailPivots, tailSegments, patternPieces, carryModels, hurt
function makeCatModel(catLook) {
  const sphere = new THREE.SphereGeometry(1, 16, 12);
  const pattern = catLook.pattern;
  // Colorpoint cats have a light body; their fur colour shows on the "points" (R21)
  const bodyColor = pattern === "Colorpoint" ? new THREE.Color(catLook.fur).lerp(new THREE.Color("#f2ead8"), 0.7) : new THREE.Color(catLook.fur);
  const fur = mat(bodyColor, { map: makeTexture("fur") });   // R60: fur texture
  const darkColor = new THREE.Color(catLook.fur).multiplyScalar(pattern === "Colorpoint" ? 0.5 : 0.55);
  const dark = mat(darkColor);
  const white = mat(catLook.fur === FURS.White && pattern === "Patches" ? FURS.Ginger : WHITE_FUR);
  const patternPieces = [];
  const addPiece = (parent, mesh, name) => {
    mesh.name = name;
    parent.add(mesh);
    patternPieces.push(mesh);
    return mesh;
  };
  const blob = (material, sx, sy, sz, x, y, z) => {
    const m = new THREE.Mesh(sphere, material);
    m.scale.set(sx, sy, sz);
    m.position.set(x, y, z);
    return m;
  };

  const cat = new THREE.Group();
  const body = new THREE.Group();   // everything that moves down when crouching
  cat.add(body);

  // Body: a long torso with a chest at the front and haunches at the back
  const torso = blob(fur, 0.21, 0.2, 0.42, 0, 0.42, 0);
  body.add(torso);
  body.add(blob(fur, 0.19, 0.2, 0.2, 0, 0.46, 0.28));     // chest
  body.add(blob(fur, 0.2, 0.2, 0.2, 0, 0.43, -0.25));     // haunches
  body.add(blob(fur, 0.11, 0.13, 0.13, 0, 0.57, 0.42));   // neck

  // Head with ears, cheeks, muzzle, eyes and nose
  const head = new THREE.Group();
  head.position.set(0, 0.68, 0.52);
  body.add(head);
  head.add(blob(fur, 0.17, 0.15, 0.16, 0, 0, 0));
  head.add(blob(fur, 0.15, 0.1, 0.11, 0, -0.04, 0.05));   // cheeks
  const muzzle = blob(fur, 0.075, 0.055, 0.06, 0, -0.06, 0.14);
  head.add(muzzle);
  const earGeo = new THREE.ConeGeometry(0.065, 0.14, 4);
  const eyes = [];
  const ears = [-1, 1].map((side) => {
    const ear = new THREE.Mesh(earGeo, fur);
    ear.position.set(side * 0.09, 0.14, -0.01);
    ear.rotation.z = -side * 0.25;
    head.add(ear);
    const inner = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.08, 4), mat("#e8a0a0"));
    inner.position.set(side * 0.088, 0.13, 0.02);
    inner.rotation.z = -side * 0.25;
    head.add(inner);
    const eye = blob(mat(catLook.eyes, { emissive: catLook.eyes, emissiveIntensity: 0.25 }), 0.035, 0.04, 0.025, side * 0.07, 0.02, 0.135);
    head.add(eye);
    eyes.push(eye);
    head.add(blob(mat("#111111"), 0.012, 0.032, 0.015, side * 0.07, 0.02, 0.157));
    return ear;
  });
  head.add(blob(mat("#d77a8a"), 0.025, 0.018, 0.016, 0, -0.035, 0.195));   // nose

  // Prey carried in the mouth (R27): one model per kind, shown when carrying it
  const carryModels = { mouse: makeMouseModel(), squirrel: makeSquirrelModel(), fish: makeFishModel(),
                        vole: makePreyModel("vole"), sparrow: makeSparrowModel(), rabbit: makePreyModel("rabbit") };
  for (const kind in carryModels) {
    const m = carryModels[kind];
    m.position.set(0.02, -0.16, 0.2);
    m.rotation.set(0, Math.PI / 2, 0.2);
    m.scale.setScalar(kind === "squirrel" ? 0.8 : 1);
    m.visible = false;
    head.add(m);
  }

  // Legs swing from the hip; short and thick, with paws (R21)
  const legLength = 0.3;
  const legGeo = new THREE.CylinderGeometry(0.052, 0.045, legLength, 8);
  legGeo.translate(0, -legLength / 2, 0);
  const legs = [];
  const paws = [];
  for (const [x, z, phase] of [[-0.1, 0.28, 0], [0.1, 0.28, Math.PI], [-0.11, -0.26, Math.PI], [0.11, -0.26, 0]]) {
    const leg = new THREE.Group();
    leg.position.set(x, 0.36, z);
    leg.userData.phase = phase;
    leg.add(new THREE.Mesh(legGeo, fur));
    const paw = blob(fur, 0.055, 0.035, 0.07, 0, -legLength - 0.005, 0.02);
    leg.add(paw);
    cat.add(leg);
    legs.push(leg);
    paws.push(paw);
  }

  // Tail: 8 segments, each one a pivot that can bend (R28)
  const tailRoot = new THREE.Group();
  tailRoot.position.set(0, 0.5, -0.43);
  body.add(tailRoot);
  const tailPivots = [];
  const tailSegments = [];
  let parent = tailRoot;
  for (let i = 0; i < TAIL_SEGMENTS; i++) {
    const pivot = new THREE.Group();
    if (i > 0) pivot.position.y = TAIL_LENGTH;
    parent.add(pivot);
    const r0 = 0.045 - i * 0.0028;
    const geo = new THREE.CylinderGeometry(r0 - 0.0028, r0, TAIL_LENGTH * 1.15, 8);
    geo.translate(0, TAIL_LENGTH / 2, 0);
    const seg = new THREE.Mesh(geo, fur);
    pivot.add(seg);
    tailPivots.push(pivot);
    tailSegments.push(seg);
    parent = pivot;
  }

  // ---------- Patterns (R21) ----------
  if (pattern === "Tabby") {
    // Stripes that hug the body: each is half a ring around the torso where it is that wide
    const ring = new THREE.TorusGeometry(1, 0.1, 6, 16, Math.PI);
    for (const z of [-0.3, -0.16, -0.02, 0.12, 0.25]) {
      const k = Math.sqrt(1 - (z / 0.42) ** 2);
      const stripe = new THREE.Mesh(ring, dark);
      stripe.scale.set(0.21 * k * 1.03, 0.2 * k * 1.03, 0.2);
      stripe.position.set(0, 0.42, z);
      addPiece(body, stripe, "stripe");
    }
    for (const x of [-0.05, 0, 0.05]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.012, 0.09), dark);
      s.position.set(x, 0.145, 0.02);
      addPiece(head, s, "head stripe");
    }
    tailPivots.forEach((p, i) => {
      if (i % 2 === 0) return;
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.045 - i * 0.0028, 0.012, 6, 12), dark);
      r.rotation.x = Math.PI / 2;
      r.position.y = TAIL_LENGTH / 2;
      addPiece(p, r, "tail ring");
    });
  } else if (pattern === "Patches") {
    for (const [x, y, z, s] of [[0.13, 0.47, 0.08, 0.1], [-0.14, 0.43, -0.15, 0.09], [0, 0.27, 0.05, 0.13]]) {
      addPiece(body, blob(white, s * 0.6, s * 0.6, s), "patch");
    }
    patternPieces.forEach((m, i) => m.position.set(...[[0.13, 0.47, 0.08], [-0.14, 0.43, -0.15], [0, 0.27, 0.05]][i]));
  } else if (pattern === "Tuxedo") {
    addPiece(body, blob(white, 0.15, 0.17, 0.1, 0, 0.42, 0.37), "chest");
    addPiece(head, blob(white, 0.082, 0.062, 0.065, 0, -0.065, 0.145), "muzzle");
    paws.forEach((p) => addPiece(p.parent, blob(white, 0.062, 0.04, 0.078, 0, -legLength - 0.005, 0.02), "paw"));
  } else if (pattern === "Calico") {
    const ginger = mat(FURS.Ginger);
    const black = mat(FURS.Black);
    addPiece(body, blob(white, 0.16, 0.08, 0.32, 0, 0.27, 0), "belly");
    for (const [m, x, y, z, s] of [[ginger, 0.14, 0.48, 0.12, 0.1], [black, -0.13, 0.5, -0.05, 0.11],
                                    [ginger, -0.1, 0.45, -0.28, 0.09], [black, 0.12, 0.44, -0.22, 0.08]]) {
      addPiece(body, blob(m, s * 0.7, s * 0.6, s), "patch").position.set(x, y, z);
    }
    addPiece(head, blob(ginger, 0.09, 0.07, 0.08, 0.08, 0.06, 0.02), "patch");
    addPiece(head, blob(black, 0.08, 0.07, 0.08, -0.08, 0.05, 0), "patch");
  } else if (pattern === "Spotted") {
    // Spots placed on the torso's surface
    for (let i = 0; i < 14; i++) {
      const z = -0.32 + (i % 7) * 0.1;
      const k = Math.sqrt(1 - (z / 0.42) ** 2);
      const a = (i < 7 ? 0.5 : 2.6) + (i % 3) * 0.25;   // around the body, on both sides and the back
      const spot = blob(dark, 0.035, 0.03, 0.04, Math.cos(a) * 0.21 * k, 0.42 + Math.sin(a) * 0.2 * k, z);
      addPiece(body, spot, "spot");
    }
  } else if (pattern === "Colorpoint") {
    addPiece(head, blob(dark, 0.09, 0.075, 0.07, 0, -0.04, 0.12), "face");
    ears.forEach((ear) => {
      const point = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.15, 4), dark);
      point.position.copy(ear.position);
      point.rotation.copy(ear.rotation);
      addPiece(head, point, "ear");
    });
    paws.forEach((p) => addPiece(p.parent, blob(dark, 0.062, 0.042, 0.078, 0, -legLength - 0.005, 0.02), "paw"));
    tailPivots.slice(4).forEach((p, i) => {
      const r0 = 0.05 - (i + 4) * 0.0028;
      const geo = new THREE.CylinderGeometry(r0 - 0.003, r0, TAIL_LENGTH * 1.1, 8);
      geo.translate(0, TAIL_LENGTH / 2, 0);
      addPiece(p, new THREE.Mesh(geo, dark), "tail");
    });
  }

  // A red cross over a hurt cat (R18)
  const hurt = new THREE.Group();
  const red = new THREE.MeshBasicMaterial({ color: "#e0302a" });
  const bar = new THREE.BoxGeometry(0.28, 0.08, 0.08);
  const across = new THREE.Mesh(bar, red);
  const down = new THREE.Mesh(bar, red);
  down.rotation.z = Math.PI / 2;
  hurt.add(across, down);
  hurt.position.set(0, 1.2, 0);
  hurt.visible = false;
  cat.add(hurt);

  cat.userData = { body, head, legs, paws, torso, tailPivots, tailSegments, patternPieces, carryModels, hurt,
                   legLength, bodyLength: 0.84, eyes, ears, torsoScale: torso.scale.clone(), eyeScale: eyes[0].scale.clone(),
                   posture: "stand", limp: false };
  cat.rotation.order = "YXZ";   // turn first, then tilt (for climbing)
  return cat;
}

// R28: how the tail is held for what the cat is doing.
// lift: angle above straight back (PI/2 = straight up, negative = hanging down); curl: bend per segment;
// tipCurl: extra bend of the last segments (the question-mark tip); swish/speed: side-to-side motion;
// puff: how fluffed up it is; side: swing to the cat's left (+) or right (-) when turning.
function tailPoseFor(s) {
  // R71: asleep, the tail wraps round to the nose
  if (s.curl) return { lift: -0.1, curl: 0, tipCurl: 0, swish: 0.02, speed: 1, puff: 1, side: 2.6 };
  let p;
  if (s.lying) p = { lift: -0.15, curl: 0.02, tipCurl: 0, swish: 0.04, speed: 1, puff: 1 };
  else if (s.fighting) p = { lift: 0.55, curl: -0.04, tipCurl: 0, swish: 0.9, speed: 9, puff: 1.6 };
  else if (s.climbing) p = { lift: -1.2, curl: 0.03, tipCurl: 0, swish: 0.12, speed: 2, puff: 1 };
  else if (s.swimming) p = { lift: 0.05, curl: 0, tipCurl: 0, swish: 0.3, speed: 2.5, puff: 1 };
  else if (s.crouch) p = { lift: 0, curl: 0, tipCurl: 0.1, swish: 0.25, speed: 7, puff: 1 };
  else if (s.running) p = { lift: 0.12, curl: 0, tipCurl: 0, swish: 0.08, speed: 3, puff: 1 };
  else if (s.moving) p = { lift: 1.35, curl: 0.02, tipCurl: 0.35, swish: 0.15, speed: 2, puff: 1 };
  else p = { lift: 0.9, curl: 0.1, tipCurl: 0.12, swish: 0.35, speed: 1.4, puff: 1 };
  p.side = -(s.turnVel || 0) * 0.25;
  return p;
}

function poseTail(model, pose, t) {
  const tail = tailPoseFor(pose);
  const pivots = model.userData.tailPivots;
  // The root points straight back at lift 0 and straight up at lift PI/2
  pivots[0].rotation.x = tail.lift - Math.PI / 2;
  pivots.forEach((p, i) => {
    const along = (i + 1) / pivots.length;   // more movement towards the tip
    if (i > 0) p.rotation.x = tail.curl + (i >= pivots.length - 3 ? tail.tipCurl : 0);
    p.rotation.z = tail.side / pivots.length + Math.sin(t * tail.speed - i * 0.6) * tail.swish * along / 3;
  });
  model.userData.tailSegments.forEach((seg) => seg.scale.set(tail.puff, 1, tail.puff));
}

// R46: what the cat's body is doing, from its pose
const BLINK_EVERY = 3.5;           // seconds between blinks
function postureFor(pose) {
  if (pose.curl) return "curl";        // R71: asleep in the den, nose to tail
  if (pose.lieDown) return "lie";      // R73: lying along a branch
  if (pose.lying) return "hurt";
  if (pose.climbing) return "climb";
  if (pose.airborne) return "leap";
  if (pose.swimming) return "swim";
  if (pose.flinch) return "flinch";
  if (pose.eating > 0) return "eat";
  if (pose.moving) return pose.running ? "run" : "walk";
  if (pose.crouch) return "crouch";
  if ((pose.idle || 0) >= 15) return "lie";
  if ((pose.idle || 0) >= 5) return "sit";
  return "stand";
}

// Move and animate a cat model.
// pose: { x, y, z, heading, size, moving, running, walk, crouch, attack, climbing, swimming, lying,
//         fighting, turnVel, carrying, dropping, hurt, idle, airborne, eating, limp, flinch }
function poseCat(model, pose, t) {
  const parts = model.userData;
  const posture = postureFor(pose);
  const walk = pose.walk || 0;
  // A different moment for each cat to blink and twitch, so they don't all do it together
  const offset = Math.abs(pose.x * 7.3 + pose.z * 3.1) % BLINK_EVERY;
  parts.posture = posture;
  parts.limp = !!pose.limp;

  model.position.set(pose.x, pose.y, pose.z);
  model.rotation.y = pose.heading;
  model.rotation.x = pose.climbing ? -1.25 : 0;
  model.rotation.z = pose.lying ? 1.3 : 0;
  model.scale.setScalar(pose.size);

  // Body: crouching, bobbing, sitting up, lying down, flinching, limping
  parts.body.rotation.set(0, 0, 0);
  parts.body.position.y = pose.crouch ? -0.1 : (pose.moving ? Math.abs(Math.sin(walk)) * (pose.running ? 0.06 : 0.03) : 0);
  if (posture === "sit") parts.body.rotation.x = -0.45;
  if (posture === "lie") parts.body.position.y = -0.22;
  if (posture === "curl") { parts.body.position.y = -0.24; parts.body.rotation.y = 0.35; }
  if (posture === "flinch") parts.body.rotation.x = -0.3;
  if (pose.limp && pose.moving) parts.body.rotation.z = Math.sin(walk) * 0.08;

  // Breathing and blinking (R46)
  parts.torso.scale.set(parts.torsoScale.x, parts.torsoScale.y * (1 + 0.03 * Math.sin(t * 2.2 + offset)), parts.torsoScale.z);
  const blinking = posture === "curl" || (t + offset) % BLINK_EVERY < 0.12;   // eyes shut while asleep
  parts.eyes.forEach((e) => e.scale.set(parts.eyeScale.x, parts.eyeScale.y * (blinking ? 0.15 : 1), parts.eyeScale.z));
  const twitch = (t + offset * 2) % 4.3 < 0.15 ? 0.35 : 0;
  parts.ears.forEach((ear, i) => { ear.rotation.z = (i ? -0.25 : 0.25) + (i ? -twitch : 0); });

  // Legs
  parts.legs.forEach((leg, i) => {
    const front = i < 2;
    let x = 0;
    if (posture === "run") {
      x = Math.sin(walk + [0, 0.3, Math.PI, Math.PI + 0.3][i]) * 0.9;   // gallop: front pair, then back pair
    } else if (posture === "walk") {
      const amount = pose.limp && i === 3 ? 0.2 : 0.6;                   // a limping cat favours one back leg
      x = Math.sin(walk + leg.userData.phase) * amount;
    } else if (posture === "leap") {
      x = front ? -0.9 : 0.9;                                           // stretched out in the air
    } else if (posture === "swim") {
      x = Math.sin(t * 8 + leg.userData.phase) * 0.5;                   // paddling
    } else if (posture === "sit") {
      x = front ? 0.25 : 1.3;
    } else if (posture === "lie" || posture === "curl") {
      x = front ? -1.4 : 1.4;
    }
    if (pose.attack && i === 1) x = -1.3;   // swipe with a front paw
    leg.rotation.x = x;
  });

  poseTail(model, pose, t);

  // Head: held higher while carrying (R27), dipped when dropping, down and chewing when eating (R46),
  // looking around when idle (R46)
  if (pose.carrying) parts.head.rotation.x = -0.25;
  else if (pose.dropping > 0) parts.head.rotation.x = 0.5 * pose.dropping / DROP_TIME;
  else if (posture === "eat") parts.head.rotation.x = 0.6 + Math.sin(t * 12) * 0.08;
  else if (posture === "curl") parts.head.rotation.x = 0.55;
  else parts.head.rotation.x = 0;
  const idleLook = (pose.idle || 0) >= 2 && ["stand", "sit", "lie"].includes(posture);
  parts.head.rotation.y = posture === "curl" ? 1.9 : (idleLook ? Math.sin(t * 0.5 + offset) * 0.5 : 0);   // asleep: head turned back to the tail

  for (const kind in parts.carryModels) parts.carryModels[kind].visible = pose.carrying === kind;
  parts.hurt.visible = !!pose.hurt;
  parts.hurt.rotation.y = t * 2;
}

// ======================================================
// Prey models
// ======================================================
function makeSquirrelModel() {
  const brown = mat("#a0522d");
  const sphere = new THREE.SphereGeometry(1, 12, 10);
  const s = new THREE.Group();
  const body = new THREE.Mesh(sphere, brown);
  body.scale.set(0.1, 0.1, 0.14);
  body.position.y = 0.12;
  s.add(body);
  const head = new THREE.Mesh(sphere, brown);
  head.scale.setScalar(0.07);
  head.position.set(0, 0.2, 0.12);
  s.add(head);
  const tail = new THREE.Mesh(sphere, mat("#b5653a"));
  tail.scale.set(0.07, 0.16, 0.07);
  tail.position.set(0, 0.24, -0.14);
  tail.rotation.x = -0.4;
  s.add(tail);
  s.userData.tail = tail;
  return s;
}

function makeMouseModel() {
  const grey = mat("#8a7f78");
  const sphere = new THREE.SphereGeometry(1, 10, 8);
  const m = new THREE.Group();
  const body = new THREE.Mesh(sphere, grey);
  body.scale.set(0.06, 0.05, 0.1);
  body.position.y = 0.05;
  m.add(body);
  const head = new THREE.Mesh(sphere, grey);
  head.scale.setScalar(0.04);
  head.position.set(0, 0.07, 0.1);
  m.add(head);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.16, 4), mat("#c9a0a0"));
  tail.rotation.x = Math.PI / 2.4;
  tail.position.set(0, 0.04, -0.16);
  m.add(tail);
  m.userData.tail = tail;
  return m;
}

// R35: a fish with a tapered body (thick at the head, thin at the tail), fins and speckles
function makeFishModel() {
  const f = new THREE.Group();
  // The body is a lathe shape: a profile turned around its long axis
  const profile = [];
  for (let i = 0; i <= 12; i++) {
    const s = i / 12;                                   // 0 = nose, 1 = tail
    const r = Math.sin(Math.PI * Math.pow(s, 0.7)) * 0.05 * (1 - s * 0.6) + 0.004;
    profile.push(new THREE.Vector2(r, (0.5 - s) * 0.3));
  }
  const bodyGeo = new THREE.LatheGeometry(profile, 12);
  bodyGeo.rotateX(Math.PI / 2);   // nose points +z
  const skin = new THREE.MeshPhongMaterial({ color: "#8a9a6a", shininess: 80, specular: "#cfd8e0" });
  const body = new THREE.Mesh(bodyGeo, skin);
  body.scale.set(0.8, 1.15, 1);   // flatter from side to side
  body.position.y = 0.06;
  f.add(body);
  const belly = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), new THREE.MeshPhongMaterial({ color: "#e8e4d8", shininess: 60 }));
  belly.scale.set(0.03, 0.025, 0.09);
  belly.position.set(0, 0.035, 0.02);
  f.add(belly);
  const finMat = new THREE.MeshPhongMaterial({ color: "#6a7a5a", side: THREE.DoubleSide, transparent: true, opacity: 0.85 });
  // Tail fin: a forked triangle at the back
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0.06, -0.08);
  tailShape.lineTo(0.02, 0);
  tailShape.lineTo(0.06, 0.08);
  tailShape.lineTo(0, 0);
  const tailFin = new THREE.Mesh(new THREE.ShapeGeometry(tailShape), finMat);
  tailFin.rotation.y = Math.PI / 2;
  tailFin.position.set(0, 0.06, -0.15);
  f.add(tailFin);
  // Back fin on top, and a fin on each side behind the head
  const dorsalFin = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.05, 3), finMat);
  dorsalFin.scale.set(0.3, 1, 1.6);
  dorsalFin.position.set(0, 0.115, -0.01);
  f.add(dorsalFin);
  const pectoralFins = [-1, 1].map((side) => {
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.018, 0.04, 3), finMat);
    fin.rotation.z = side * 1.2;
    fin.position.set(side * 0.04, 0.045, 0.06);
    f.add(fin);
    return fin;
  });
  // Speckles along the back and sides
  const speckMat = mat("#3a4630");
  const speckles = [];
  for (let i = 0; i < 10; i++) {
    const z = 0.1 - i * 0.022;
    const side = i % 2 ? 1 : -1;
    const speck = new THREE.Mesh(new THREE.SphereGeometry(0.006, 4, 3), speckMat);
    speck.position.set(side * 0.03, 0.085 - (i % 3) * 0.01, z);
    f.add(speck);
    speckles.push(speck);
  }
  // An eye on each side
  for (const side of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.008, 6, 4), mat("#111111"));
    eye.position.set(side * 0.03, 0.07, 0.11);
    f.add(eye);
  }
  f.userData = { tail: tailFin, body, tailFin, dorsalFin, pectoralFins, speckles };
  return f;
}

// R47: a simple furry body with ears and a tail, sized and coloured for each kind
function makeFurryPrey(color, length, earLength, tailLength) {
  const sphere = new THREE.SphereGeometry(1, 10, 8);
  const fur = mat(color);
  const g = new THREE.Group();
  const body = new THREE.Mesh(sphere, fur);
  body.scale.set(length * 0.45, length * 0.4, length * 0.6);
  body.position.y = length * 0.4;
  g.add(body);
  const head = new THREE.Mesh(sphere, fur);
  head.scale.setScalar(length * 0.3);
  head.position.set(0, length * 0.6, length * 0.55);
  g.add(head);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(sphere, fur);
    ear.scale.set(length * 0.06, earLength, length * 0.1);
    ear.position.set(side * length * 0.12, length * 0.75 + earLength * 0.8, length * 0.5);
    ear.rotation.x = -0.3;
    g.add(ear);
  }
  const tail = new THREE.Mesh(sphere, mat("#f0ece0"));
  tail.scale.setScalar(tailLength);
  tail.position.set(0, length * 0.45, -length * 0.6);
  g.add(tail);
  g.userData.tail = tail;
  return g;
}

function makeSparrowModel() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mat("#8a6a4a"));
  body.scale.set(0.05, 0.05, 0.08);
  body.position.y = 0.07;
  g.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mat("#6a4a32"));
  head.position.set(0, 0.11, 0.06);
  g.add(head);
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.03, 4), mat("#d8a840"));
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, 0.11, 0.1);
  g.add(beak);
  const tail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.008, 0.06), mat("#5a3a22"));
  tail.position.set(0, 0.08, -0.09);
  g.add(tail);
  g.userData.tail = tail;
  return g;
}

function makePreyModel(kind) {
  if (kind === "mouse") return makeMouseModel();
  if (kind === "squirrel") return makeSquirrelModel();
  if (kind === "fish") return makeFishModel();
  if (kind === "vole") return makeFurryPrey("#6a5040", 0.18, 0.02, 0.02);
  if (kind === "rabbit") return makeFurryPrey("#9a8068", 0.42, 0.12, 0.06);
  if (kind === "hare") return makeFurryPrey("#a8885a", 0.62, 0.2, 0.07);
  if (kind === "sparrow") return makeSparrowModel();
  return makeBeetleModel();
}

function makeBeetleModel() {
  const b = new THREE.Group();
  const shell = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshPhongMaterial({ color: "#1d2a40", shininess: 90 }));
  shell.scale.set(0.035, 0.022, 0.05);
  shell.position.y = 0.025;
  b.add(shell);
  b.userData.tail = shell;
  return b;
}

function makeShadow(radius) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

// ======================================================
// Huts (R25): a bramble dome with a doorway, a mossy nest inside
// ======================================================
// R60: woven brambles; one shared material for ordinary huts and one for medicine dens
const hutMaterials = {};
function hutMaterial(medicine) {
  const key = medicine ? "medicine" : "hut";
  if (!hutMaterials[key]) hutMaterials[key] = texturedMat(medicine ? "#4a6a3a" : "#5a4a30", "bramble", 3, 2, { flatShading: true, side: THREE.DoubleSide });
  return hutMaterials[key];
}

function makeHut(h) {
  const g = new THREE.Group();
  // The dome leaves a gap around local -x; the group is turned so the gap faces the door
  const gap = HUT_DOOR + 0.04;
  const domeGeo = new THREE.SphereGeometry(h.R, 24, 10, gap, Math.PI * 2 - gap * 2, 0, Math.PI / 2);
  const dome = new THREE.Mesh(domeGeo, hutMaterial(h.id === "medicine"));
  dome.scale.y = 0.75;
  g.add(dome);
  // A few brambles on top, so it doesn't look like a smooth bowl
  for (let k = 0; k < 6; k++) {
    const a = gap + 0.4 + k * 0.9;
    const twig = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), mat("#4a3a22", { flatShading: true }));
    twig.position.set(-Math.cos(a) * h.R * 0.75, h.R * 0.55, Math.sin(a) * h.R * 0.75);
    g.add(twig);
  }
  const nest = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.22, 6, 14), mat("#6a8a3a", { flatShading: true }));
  nest.rotation.x = Math.PI / 2;
  nest.position.set(0.6, 0.12, 0);
  g.add(nest);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(h.R - 0.1, 20), mat("#5a4a32"));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0.02;
  g.add(floor);
  g.position.set(h.x, 0, h.z);
  g.rotation.y = Math.atan2(Math.cos(h.door), -Math.sin(h.door));
  g.userData = { nest, doorway: true };
  return g;
}

// ======================================================
// Grass (R24): blades bend in segments, darker at the root; swaying is done on the graphics card
// ======================================================
function makeBladeGeometry() {
  const levels = 5;
  const positions = [];
  const colors = [];
  const vertex = (x, y) => {
    positions.push(x, y, 0.18 * y * y);              // a gentle forward curve
    const shade = 0.45 + 0.6 * y;                    // dark root, light tip
    colors.push(shade, shade, shade);
  };
  for (let j = 0; j < levels; j++) {
    const y0 = j / levels;
    const y1 = (j + 1) / levels;
    const w0 = 0.035 * (1 - y0);
    const w1 = 0.035 * (1 - y1);
    if (j === levels - 1) {
      vertex(-w0, y0); vertex(w0, y0); vertex(0, 1);  // the pointed tip
    } else {
      vertex(-w0, y0); vertex(w0, y0); vertex(w1, y1);
      vertex(-w0, y0); vertex(w1, y1); vertex(-w1, y1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return geo;
}

// Same rule as the grass shader: no grass in water, on camp ground, or past the edge of the world
function grassAllowedAt(x, z) {
  if (watersAt(z).some((w) => x > w.x0 - 0.5 && x < w.x1 + 0.5)) return false;   // the river bends (R74)
  if (Math.abs(x) > WORLD_HALF || Math.abs(z) > WORLD_HALF) return false;
  return !Object.keys(CLANS).some((c) => distance({ x, z }, campOf(c)) < GRASS_CAMP_RADIUS);
}

// Grass colour for each quarter of the world, in the order the shader uses
function grassColorList() {
  const order = ["ThunderClan", "ShadowClan", "RiverClan", "WindClan"];   // x<0 z<0, x<0 z>0, x>0 z<0, x>0 z>0
  return order.map((c) => new THREE.Color(PLACES[CLANS[c].biome].grass));
}

function makeGrass(random) {
  const geo = makeBladeGeometry();
  const uniforms = {
    uTime: { value: 0 },
    uCenter: { value: new THREE.Vector2() },
    uWindow: { value: GRASS_WINDOW },
    uColors: { value: grassColorList() },
    uWaters: { value: new THREE.Vector4(RIVER_X0, RIVER_X1, STREAM_X0, STREAM_X1) },
    uBend: { value: new THREE.Vector2(RIVER_BEND, (2 * Math.PI) / RIVER_WAVE) },   // R74: the river's bends
    uCamps: { value: Object.keys(CLANS).map((c) => new THREE.Vector2(campOf(c).x, campOf(c).z)) },
    uCampRadius: { value: GRASS_CAMP_RADIUS },
    uWorldHalf: { value: WORLD_HALF },
    uWind: { value: 1 },
  };
  const material = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  material.userData.wind = true;
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = `
      uniform float uTime;
      uniform vec2 uCenter;
      uniform float uWindow;
      uniform vec3 uColors[4];
      uniform vec4 uWaters;
      uniform vec2 uBend;
      uniform vec2 uCamps[4];
      uniform float uCampRadius;
      uniform float uWorldHalf;
      uniform float uWind;
      // Where this blade stands: its spot in the square, moved to the square around the cat
      vec2 grassBase() {
        vec2 o = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
        vec2 start = uCenter - uWindow * 0.5;
        return start + mod(o - start, uWindow);
      }
      float grassAllowed(vec2 p) {
        float shift = uBend.x * sin(p.y * uBend.y);
        if (p.x > uWaters.x + shift - 0.5 && p.x < uWaters.y + shift + 0.5) return 0.0;
        if (p.x > uWaters.z - 0.5 && p.x < uWaters.w + 0.5) return 0.0;
        if (abs(p.x) > uWorldHalf || abs(p.y) > uWorldHalf) return 0.0;
        for (int i = 0; i < 4; i++) { if (distance(p, uCamps[i]) < uCampRadius) return 0.0; }
        return 1.0;
      }
      vec3 grassTint(vec2 p) {
        if (p.x < 0.0) return p.y < 0.0 ? uColors[0] : uColors[1];
        return p.y < 0.0 ? uColors[2] : uColors[3];
      }
    ` + shader.vertexShader
      .replace("#include <color_vertex>", "#include <color_vertex>\n vColor.xyz *= grassTint(grassBase());")
      .replace("#include <begin_vertex>", "vec3 transformed = vec3(position);\n transformed.y *= grassAllowed(grassBase());")
      .replace("#include <project_vertex>", `
        vec2 gb = grassBase();
        vec4 mvPosition = instanceMatrix * vec4(transformed, 1.0);
        mvPosition.xz += gb - vec2(instanceMatrix[3][0], instanceMatrix[3][2]);
        // Wind: slow waves across the field plus a quick flutter; the tip moves most
        float h = position.y * position.y;
        float wave = sin(uTime * 1.6 + gb.x * 0.15 + gb.y * 0.1) * 0.35 + sin(uTime * 3.1 + gb.x * 1.7 + gb.y * 1.3) * 0.08;
        mvPosition.xz += vec2(0.8, 0.45) * wave * h * 0.35 * uWind;
        mvPosition = modelViewMatrix * mvPosition;
        gl_Position = projectionMatrix * mvPosition;
      `);
  };

  const count = GRASS_CLUMPS * BLADES_PER_CLUMP;
  const grass = new THREE.InstancedMesh(geo, material, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  let i = 0;
  for (let c = 0; c < GRASS_CLUMPS; c++) {
    const cx = random() * GRASS_WINDOW;
    const cz = random() * GRASS_WINDOW;
    for (let b = 0; b < BLADES_PER_CLUMP; b++) {
      const a = random() * Math.PI * 2;
      const r = random() * 0.25;
      e.set((random() - 0.5) * 0.5, random() * Math.PI * 2, (random() - 0.5) * 0.5);
      q.setFromEuler(e);
      const h = 0.3 + random() * 0.45;
      m.compose(new THREE.Vector3(cx + Math.sin(a) * r, 0, cz + Math.cos(a) * r), q, new THREE.Vector3(1, h, 1));
      grass.setMatrixAt(i++, m);
    }
  }
  grass.frustumCulled = false;
  grass.userData.clumps = GRASS_CLUMPS;
  return { grass, uniforms };
}

// ======================================================
// Setting up the 3D view
// ======================================================
// R55: size the 3D view to fill the window
function fitView(width, height) {
  if (!view) return;
  view.renderer.setSize(width, height, false);
  view.camera.aspect = width / height;
  view.camera.updateProjectionMatrix();
}

function initView(canvas) {
  if (!has3D()) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.width, canvas.height, false);
  const camera = new THREE.PerspectiveCamera(70, canvas.width / canvas.height, 0.05, 400);
  view = { renderer, camera, scene: null };
  buildScene();
}

// R74: a flat strip along a water, from `from` to `to` units past its west edge, bending with the river
function makeWaterStrip(water, from, to, y, material) {
  const n = water.bends ? 240 : 1;
  const pos = [];
  const uv = [];
  const index = [];
  for (let i = 0; i <= n; i++) {
    const z = -WORLD_HALF + (i / n) * WORLD_HALF * 2;
    const shift = water.bends ? riverShift(z) : 0;
    pos.push(water.x0 + from + shift, y, z, water.x0 + to + shift, y, z);
    uv.push(0, i / n, 1, i / n);
    if (i < n) index.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);   // facing up
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(index);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, material);
  // Where the middle of this strip is at z (read back from the drawn shape, for the tests)
  mesh.userData.middleAt = (z) => {
    const i = Math.round(((z + WORLD_HALF) / (WORLD_HALF * 2)) * n);
    const p = geo.attributes.position;
    return (p.getX(i * 2) + p.getX(i * 2 + 1)) / 2;
  };
  return mesh;
}

// Build the whole world: 4 territories, each with its own look
function buildScene() {
  if (!view) return;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY.day);
  scene.fog = new THREE.Fog(SKY.day, 40, 150);
  const random = makeRandom(7);

  // Light
  const hemi = new THREE.HemisphereLight(0xffffff, 0x445533, 0.6);
  const sun = new THREE.DirectionalLight(0xffffff, 1);
  scene.add(hemi, sun, sun.target);

  // Sun, moon and stars (R10)
  const sunBall = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 12), new THREE.MeshBasicMaterial({ color: "#fff2b0", fog: false }));
  const moonBall = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), new THREE.MeshBasicMaterial({ color: "#dfe6f0", fog: false }));
  scene.add(sunBall, moonBall);
  const starPositions = [];
  for (let i = 0; i < 500; i++) {
    const a = random() * Math.PI * 2;
    const up = 0.15 + random() * 0.85;
    const flat = Math.sqrt(1 - up * up);
    starPositions.push(Math.cos(a) * flat * 300, up * 300, Math.sin(a) * flat * 300);
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.Float32BufferAttribute(starPositions, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.5, sizeAttenuation: false,
                                                                      transparent: true, opacity: 0, fog: false }));
  scene.add(stars);

  // Ground: one square per territory, plus the land past the edge of the world
  const groundMaterials = [];
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF * 4, WORLD_HALF * 4), mat("#3d5a30"));
  edge.rotation.x = -Math.PI / 2;
  edge.position.y = -0.02;
  scene.add(edge);
  for (const clan in CLANS) {
    const c = CLANS[clan];
    const groundMat = texturedMat(PLACES[c.biome].ground, "ground", 40);   // R60
    groundMaterials.push(groundMat);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF, WORLD_HALF), groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(c.sx * WORLD_HALF / 2, 0, c.sz * WORLD_HALF / 2);
    scene.add(ground);
    // Bare earth in the camp
    const earthMat = texturedMat("#7a6a4a", "dirt", 5);
    groundMaterials.push(earthMat);
    const earth = new THREE.Mesh(new THREE.CircleGeometry(GRASS_CAMP_RADIUS + 0.5, 32), earthMat);
    earth.rotation.x = -Math.PI / 2;
    earth.position.set(campOf(clan).x, 0.01, campOf(clan).z);
    scene.add(earth);
  }

  // The river and the stream
  const waterMap = makeTexture("water").clone();   // R60: the water's ripples (moved along by the current, R59)
  waterMap.needsUpdate = true;
  waterMap.repeat.set(1, 60);
  const waterMat = new THREE.MeshPhongMaterial({ color: "#3f7fb8", shininess: 80, transparent: true, opacity: 0.65, map: waterMap });   // see the fish (R35)
  let riverMesh = null;
  for (const w of WATERS) {
    const water = makeWaterStrip(w, 0, w.x1 - w.x0, 0.03, waterMat);   // the river bends (R74)
    scene.add(water);
    if (w.bends) riverMesh = water;
  }

  // Extra details for each kind of land
  const reedMat = mat("#7a7a3a");
  const reedGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4);
  const poolMat = new THREE.MeshPhongMaterial({ color: "#2b3b3a", shininess: 60 });
  const heatherMat = mat("#8a5a8a");
  const gorseMat = mat("#5a7a2a", { flatShading: true });
  const gorseFlowerMat = mat("#e8c840");
  const blobGeo = new THREE.IcosahedronGeometry(1, 1);
  for (let i = 0; i < 260; i++) {
    const x = -WORLD_HALF + random() * WORLD_HALF * 2;
    const z = -WORLD_HALF + random() * WORLD_HALF * 2;
    const place = biomeAt(x, z);
    const nearCamp = Object.keys(CLANS).some((c) => distance({ x, z }, campOf(c)) < CAMP_CLEARING);
    if (nearRiver(x, z) || nearCamp) continue;
    if (place === "marsh" && i % 3 === 0) {
      // Marsh pools with reeds (ShadowClan, R6)
      const r = 1.5 + random() * 3;
      const pool = new THREE.Mesh(new THREE.CircleGeometry(r, 20), poolMat);
      pool.rotation.x = -Math.PI / 2;
      pool.position.set(x, 0.02, z);
      scene.add(pool);
      for (let k = 0; k < 6; k++) {
        const a = random() * Math.PI * 2;
        const reed = new THREE.Mesh(reedGeo, reedMat);
        reed.position.set(x + Math.cos(a) * r, 0.6, z + Math.sin(a) * r);
        reed.rotation.z = (random() - 0.5) * 0.3;
        scene.add(reed);
      }
    } else if (place === "moor") {
      // Heather and gorse on the moor (WindClan)
      const heather = new THREE.Mesh(new THREE.CircleGeometry(1 + random() * 2.5, 10), heatherMat);
      heather.rotation.x = -Math.PI / 2;
      heather.position.set(x, 0.015, z);
      scene.add(heather);
      if (i % 2 === 0) {
        const bush = new THREE.Mesh(blobGeo, gorseMat);
        bush.scale.set(0.9, 0.6, 0.9);
        bush.position.set(x + 2, 0.4, z + 1);
        scene.add(bush);
        const flower = new THREE.Mesh(new THREE.SphereGeometry(0.12, 5, 4), gorseFlowerMat);
        flower.position.set(x + 2.3, 0.95, z + 1.2);
        scene.add(flower);
      }
    }
  }
  // Reeds along the big river in RiverClan land
  for (let z = -WORLD_HALF; z < 0; z += 2.5) {
    const rw = watersAt(z)[0];
    for (const x of [rw.x0 - 0.3, rw.x1 + 0.3]) {
      const reed = new THREE.Mesh(reedGeo, reedMat);
      reed.position.set(x + (random() - 0.5), 0.6, z + random());
      scene.add(reed);
    }
  }

  // Trees: oaks, pines in the marsh, willows by the river, a few small oaks on the moor
  const trunkGeo = new THREE.CylinderGeometry(0.8, 1, 1, 8);
  trunkGeo.translate(0, 0.5, 0);
  const coneGeo = new THREE.ConeGeometry(1, 1, 8);
  const trunkMats = {};
  const leafMats = {};
  for (const name in PLACES) {
    trunkMats[name] = texturedMat(PLACES[name].trunk, "bark", 2, 1);   // R60
    leafMats[name] = PLACES[name].leaves.map((c) => mat(c, { flatShading: true }));
  }
  const branchModels = [];   // R73
  const branchGeo = new THREE.CylinderGeometry(0.06, 0.13, 1, 6);
  branchGeo.rotateX(Math.PI / 2);   // lying along +z, thin end outwards
  branchGeo.translate(0, 0, 0.5);
  const treeTops = [];
  const treeParts = [];   // R81: each tree's trunk, leaves and branches (same order as `trees`)
  for (const t of trees) {
    const place = biomeAt(t.x, t.z);
    const trunk = new THREE.Mesh(trunkGeo, trunkMats[place]);
    trunk.scale.set(t.r, t.kind === "pine" ? t.h * 0.9 : t.h * 0.6, t.r);
    trunk.position.set(t.x, 0, t.z);
    scene.add(trunk);
    const top = new THREE.Group();
    top.position.set(t.x, t.kind === "pine" ? t.h * 0.3 : t.h * 0.6, t.z);
    if (t.kind === "pine") {
      for (let k = 0; k < 3; k++) {
        const cone = new THREE.Mesh(coneGeo, leafMats[place][k]);
        const w = (2.6 - k * 0.6) * (0.8 + t.r);
        cone.scale.set(w, t.h * 0.35, w);
        cone.position.y = t.h * (0.15 + k * 0.2);
        top.add(cone);
      }
    } else {
      const size = (2.2 + t.r * 2) * (t.kind === "willow" ? 1.15 : 1);
      const blobs = t.kind === "willow"
        ? [[0, 0.3, 0, 1], [-0.7, -0.3, 0.2, 0.8], [0.7, -0.3, -0.2, 0.8], [0, -0.4, 0.7, 0.75]]   // droopy
        : [[0, 0.5, 0, 1], [-0.8, 0, 0.3, 0.75], [0.8, 0.1, -0.2, 0.75], [0.1, 0.2, 0.9, 0.7], [0, 1.1, -0.2, 0.65]];
      for (const [bx, by, bz, s] of blobs) {
        const leaves = new THREE.Mesh(blobGeo, leafMats[place][Math.floor(random() * 3)]);
        leaves.scale.set(size * s, size * s * (t.kind === "willow" ? 1.3 : 1), size * s);
        leaves.position.set(bx * size, by * size, bz * size);
        leaves.userData.base = leaves.position.clone();
        top.add(leaves);
      }
    }
    top.userData.phase = t.phase;
    scene.add(top);
    treeTops.push(top);
    const parts = { tree: t, trunk, top, branches: [] };
    treeParts.push(parts);
    // R73: branches to lie on, sticking out of the trunk
    for (const b of t.branches || []) {
      const branch = new THREE.Mesh(branchGeo, trunkMats[place]);
      branch.position.set(t.x + Math.sin(b.angle) * t.r * 0.6, b.y - 0.12, t.z + Math.cos(b.angle) * t.r * 0.6);
      branch.rotation.y = b.angle;
      branch.scale.set(1, 1, b.length + t.r * 0.4);
      scene.add(branch);
      branchModels.push(branch);
      parts.branches.push(branch);
    }
  }

  // Grass (R24)
  const { grass, uniforms: grassUniforms } = makeGrass(random);
  scene.add(grass);

  // Rocks from the game rules (R23): camp stones and the Highrocks
  const stoneMat = texturedMat("#8a8a80", "rock", 1, 1, { flatShading: true });   // R60
  const stoneGeo = new THREE.DodecahedronGeometry(1, 0);
  for (const r of rocks) {
    if (r.kind === "greatoak") continue;   // drawn as a tree below (R48)
    const rock = new THREE.Mesh(stoneGeo, stoneMat);
    if (r.kind === "highrock") rock.scale.set(r.r, 1.8, r.r * 0.9);
    else rock.scale.set(r.r, r.r * 0.7, r.r);
    rock.position.set(r.x, r.kind === "highrock" ? 0.9 : r.r * 0.3, r.z);
    rock.rotation.y = r.x + r.z;
    scene.add(rock);
  }

  // Huts in every camp (R25); your own are your dens
  let denModels = [];
  const hutModels = [];   // R81
  for (const h of huts) {
    const model = makeHut(h);
    model.userData.hut = h;
    hutModels.push(model);
    scene.add(model);
    if (h.clan === clanName) denModels.push(model);
  }

  // Herbs (R18): marigold has orange flowers, dock leaf has big green leaves
  const herbModels = herbs.map((h) => {
    const g = new THREE.Group();
    const bush = new THREE.Mesh(blobGeo, mat(h.kind === "dock" ? "#2f7a3a" : "#3f9a52", { flatShading: true }));
    bush.scale.set(0.35, h.kind === "dock" ? 0.15 : 0.25, 0.35);
    bush.position.y = 0.2;
    g.add(bush);
    const flowerMat = mat(h.kind === "dock" ? "#a8d080" : "#f0902a", { emissive: "#ffa040", emissiveIntensity: 0 });
    for (let k = 0; k < 5; k++) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 4), flowerMat);
      flower.position.set(Math.sin(k * 1.3) * 0.25, 0.42, Math.cos(k * 1.3) * 0.25);
      g.add(flower);
    }
    g.position.set(h.x, 0, h.z);
    g.userData.flowerMat = flowerMat;
    scene.add(g);
    return g;
  });

  // Cats and prey
  const playerModel = makeCatModel(look);
  const playerShadow = makeShadow(0.45);
  const rogueModel = makeCatModel(ROGUE_LOOK);
  const rogueShadow = makeShadow(0.45);
  const squirrelModel = makeSquirrelModel();
  scene.add(playerModel, playerShadow, rogueModel, rogueShadow, squirrelModel);
  const campCatModels = campCats.map((c) => { const m = makeCatModel(c.look); scene.add(m); return m; });
  const patrolModels = patrols.map((c) => { const m = makeCatModel(c.look); scene.add(m); return m; });

  // Scent trails (R14): glowing dots drawn on top of everything
  const maxDots = 600;
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(maxDots * 3), 3));
  dotGeo.setDrawRange(0, 0);
  const scentDots = new THREE.Points(dotGeo, new THREE.PointsMaterial({ color: "#ffd86b", size: 0.18, transparent: true,
                                                                         opacity: 0.9, depthTest: false, fog: false }));
  scentDots.frustumCulled = false;
  scentDots.renderOrder = 10;
  scentDots.visible = false;
  scene.add(scentDots);

  // Kits (R31)
  const kitModels = kits.map((k) => { const m = makeCatModel(k.look); scene.add(m); return m; });

  // R48: the Great Oak where the clans gather, in the middle of the world
  const greatOak = new THREE.Group();
  const oakTrunk = new THREE.Mesh(trunkGeo, mat("#5a4430"));
  oakTrunk.scale.set(1.6, 12, 1.6);
  greatOak.add(oakTrunk);
  for (const [bx, by, bz, s] of [[0, 14, 0, 7], [-5, 12, 2, 5], [5, 12.5, -2, 5], [1, 12, 5, 4.5], [-1, 13, -5, 4.5]]) {
    const leaves = new THREE.Mesh(blobGeo, mat("#3a7a32", { flatShading: true }));
    leaves.scale.setScalar(s);
    leaves.position.set(bx, by, bz);
    greatOak.add(leaves);
  }
  greatOak.position.set(GATHERING_SPOT.x, 0, GATHERING_SPOT.z);
  scene.add(greatOak);

  // R52: a medicine cat in every camp
  const medicineCatModels = medicineCats.map((m) => { const model = makeCatModel(m.look); scene.add(model); return model; });

  // R49: the stolen rabbit lying on a rival's land
  const stolenModel = makePreyModel("rabbit");
  stolenModel.rotation.z = Math.PI / 2;
  stolenModel.visible = false;
  scene.add(stolenModel);

  // Rain (R30): short falling streaks around the camera (each streak is a top and a bottom point)
  const rainCount = 1500;
  const rainGeo = new THREE.BufferGeometry();
  const rainPos = new Float32Array(rainCount * 6);
  for (let i = 0; i < rainCount; i++) {
    const x = (random() - 0.5) * 40;
    const y = random() * 20;
    const z = (random() - 0.5) * 40;
    rainPos.set([x, y, z, x + 0.05, y - 0.45, z], i * 6);
  }
  rainGeo.setAttribute("position", new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.LineSegments(rainGeo, new THREE.LineBasicMaterial({ color: "#b8cce0", transparent: true, opacity: 0.55 }));
  rain.frustumCulled = false;
  rain.visible = false;
  scene.add(rain);

  // Fish swimming under the water while fishing (R35), and a ripple where the paw reaches
  const fishModels = [];
  for (let i = 0; i < FISH_COUNT; i++) {
    const m = makeFishModel();
    m.scale.setScalar(2.4);
    m.visible = false;
    scene.add(m);
    fishModels.push(m);
  }
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.38, 24),
    new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
  ripple.rotation.x = -Math.PI / 2;
  ripple.visible = false;
  scene.add(ripple);

  // ---------- Round 6 ----------
  // R59: muddy banks, pebbles, shallow edges, lily pads and stepping stones
  const banks = [];
  const bankMat = texturedMat("#6a5a3e", "dirt", 1, 60);
  const shallowMat = new THREE.MeshPhongMaterial({ color: "#6fa8c8", shininess: 60, transparent: true, opacity: 0.5 });
  for (const w of WATERS) {
    for (const side of [-1, 1]) {
      const width = w.x1 - w.x0;
      const bank = makeWaterStrip(w, side < 0 ? -1.2 : width, side < 0 ? 0 : width + 1.2, 0.012, bankMat);
      scene.add(bank);
      banks.push(bank);
      const shallow = makeWaterStrip(w, side < 0 ? 0 : width - SHALLOW, side < 0 ? SHALLOW : width, 0.035, shallowMat);
      scene.add(shallow);
    }
  }
  const pebbleGeo = new THREE.DodecahedronGeometry(0.12, 0);
  const pebbles = [];
  for (let i = 0; i < 160; i++) {
    const pz = -WORLD_HALF + random() * WORLD_HALF * 2;
    const w = watersAt(pz)[i % 2];
    const side = random() < 0.5 ? w.x0 - random() * 1.2 : w.x1 + random() * 1.2;
    const pebble = new THREE.Mesh(pebbleGeo, stoneMat);
    pebble.position.set(side, 0.03, pz);
    pebble.scale.set(0.6 + random(), 0.4 + random() * 0.4, 0.6 + random());
    scene.add(pebble);
    pebbles.push(pebble);
  }
  const lilyMat = mat("#3f8a3a", { side: THREE.DoubleSide });
  const lilyGeo = new THREE.CircleGeometry(0.35, 10, 0.4, Math.PI * 2 - 0.4);   // a notch cut out
  const lilyPads = [];
  for (let i = 0; i < 70; i++) {
    const lz = -WORLD_HALF + random() * WORLD_HALF * 2;
    const w = watersAt(lz)[i % 2];
    const pad = new THREE.Mesh(lilyGeo, lilyMat);
    pad.rotation.x = -Math.PI / 2;
    pad.rotation.z = random() * Math.PI * 2;
    pad.position.set(w.x0 + 0.3 + random() * (w.x1 - w.x0 - 0.6), 0.045, lz);
    scene.add(pad);
    lilyPads.push(pad);
    if (i % 5 === 0) {
      const flower = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), mat("#f2d6e8"));
      flower.position.set(pad.position.x, 0.09, pad.position.z);
      scene.add(flower);
    }
  }
  // Reeds along the stream too
  for (let z = -WORLD_HALF; z < WORLD_HALF; z += 4) {
    const reed = new THREE.Mesh(reedGeo, reedMat);
    reed.position.set((random() < 0.5 ? STREAM_X0 - 0.3 : STREAM_X1 + 0.3) + (random() - 0.5) * 0.5, 0.6, z + random());
    scene.add(reed);
  }
  const stoneModels = steppingStones.map((s) => {
    const stone = new THREE.Mesh(new THREE.CylinderGeometry(s.r, s.r * 1.1, 0.25, 9), stoneMat);
    stone.position.set(s.x, 0.08, s.z);
    scene.add(stone);
    return stone;
  });
  // A fish that jumps out of the water now and then, and a splash ring when you walk in
  const jumpingFish = makeFishModel();
  jumpingFish.scale.setScalar(2);
  jumpingFish.visible = false;
  scene.add(jumpingFish);
  const splash = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.5, 20),
    new THREE.MeshBasicMaterial({ color: "#e8f4ff", transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  splash.rotation.x = -Math.PI / 2;
  splash.visible = false;
  scene.add(splash);

  // R65: the pile is made of the real prey on it
  const pileStack = new THREE.Group();
  pileStack.position.set(FRESH_KILL.x, 0, FRESH_KILL.z);
  scene.add(pileStack);

  // R72 (changes R67): border markers are glowing highlights on the ground, with no post
  const markerModels = BORDER_MARKERS.map((mk) => {
    const g = new THREE.Group();
    const radius = 1.3;
    const glowMat = new THREE.MeshBasicMaterial({ color: "#ffd86b", transparent: true, opacity: 0.35, depthWrite: false, fog: false });
    const patch = new THREE.Mesh(new THREE.CircleGeometry(radius, 28), glowMat);
    patch.rotation.x = -Math.PI / 2;
    patch.position.y = 0.04;
    const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.25, 32),
      new THREE.MeshBasicMaterial({ color: "#fff2b0", transparent: true, opacity: 0.85, side: THREE.DoubleSide, depthWrite: false, fog: false }));
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.05;
    g.add(patch, ring);
    g.position.set(mk.x, 0, mk.z);
    g.userData = { radius, glow: 0.5, glowMat, ring };
    scene.add(g);
    return g;
  });

  // R68: falling leaves around the camera, and R69: snow in leaf-bare
  const maxLeaves = 600;
  const leafPos = new Float32Array(maxLeaves * 3);
  for (let i = 0; i < maxLeaves; i++) leafPos.set([(random() - 0.5) * 50, random() * 14, (random() - 0.5) * 50], i * 3);
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute("position", new THREE.BufferAttribute(leafPos, 3));
  const leaves = new THREE.Points(leafGeo, new THREE.PointsMaterial({ color: "#c8762a", size: 0.18 }));
  leaves.frustumCulled = false;
  leaves.userData.amount = 0;
  scene.add(leaves);
  const snow = new THREE.Group();
  const snowCover = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF * 2, WORLD_HALF * 2),
    new THREE.MeshLambertMaterial({ color: "#f4f8ff", transparent: true, opacity: 0.55, depthWrite: false }));
  snowCover.rotation.x = -Math.PI / 2;
  snowCover.position.y = 0.025;
  const flakePos = new Float32Array(800 * 3);
  for (let i = 0; i < 800; i++) flakePos.set([(random() - 0.5) * 50, random() * 16, (random() - 0.5) * 50], i * 3);
  const flakeGeo = new THREE.BufferGeometry();
  flakeGeo.setAttribute("position", new THREE.BufferAttribute(flakePos, 3));
  const flakes = new THREE.Points(flakeGeo, new THREE.PointsMaterial({ color: "#ffffff", size: 0.12 }));
  flakes.frustumCulled = false;
  snow.add(snowCover, flakes);
  snow.userData.flakes = flakes;
  snow.visible = false;
  scene.add(snow);

  // R64: markers over what you can see from high in a tree
  const spotMarkers = [];
  for (let i = 0; i < 24; i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.4, 0.8, 6), new THREE.MeshBasicMaterial({ color: "#7dff7a", depthTest: false, fog: false }));
    m.rotation.x = Math.PI;   // pointing down at the thing
    m.renderOrder = 11;
    m.visible = false;
    scene.add(m);
    spotMarkers.push(m);
  }

  Object.assign(view, {
    scene, hemi, sun, sunBall, moonBall, stars, treeTops, grass, grassUniforms, herbModels, denModels, pileModel: pileStack,
    playerModel, playerShadow, rogueModel, rogueShadow, squirrelModel, campCatModels, patrolModels, kitModels,
    rain, fishModels, ripple, lightningFlash: 0, greatOak, medicineCatModels, stolenModel, raiderModels: [], leaderModels: [],
    preyModels: [], droppedModels: [], clanmateModels: [], scentDots, maxDots, builtFor: clanName, builtLook: JSON.stringify(look),
    branchModels, nametags: [],
    treeParts, hutModels,
    riverMesh,
    groundMaterials, barkMaterial: Object.values(trunkMats)[0], rockMaterial: stoneMat, hutMaterial: hutMaterial(false), waterMaterial: waterMat,
    banks, pebbles, lilyPads, stoneModels, jumpingFish, splash, pileStack, pileModels: [], markerModels, leaves, snow, spotMarkers,
    rogueMateModels: [], leafMats, leafColors: {}, builtStones: steppingStones.length,
  });
}

// ======================================================
// Drawing one frame
// ======================================================
function mixColors(a, b, amount) {
  return new THREE.Color(a).lerp(new THREE.Color(b), clamp(amount, 0, 1));
}

// R10: sky, sun and light follow the time of day; R14: scenting dims the view
function updateSky() {
  const f = dayFraction();
  const light = daylight();
  const sunHeight = Math.sin((f - 0.25) * Math.PI * 2);        // 1 at noon, -1 at midnight
  const sunsetGlow = clamp(1 - Math.abs(sunHeight) / 0.3, 0, 1);
  const dim = player.scenting ? 0.45 : 1;

  const sky = mixColors(SKY.night, SKY.day, (light - 0.1) / 0.9).lerp(new THREE.Color(SKY.sunset), sunsetGlow * 0.65);
  sky.multiplyScalar(dim);
  view.scene.background = sky;
  view.scene.fog.color.copy(sky);
  // Fog depends on where the cat is: thick in the marsh, thin on the moor
  const place = PLACES[biomeAt(player.x, player.z)];
  view.scene.fog.near = player.scenting ? 8 : place.fogNear;
  view.scene.fog.far = player.scenting ? 45 : place.fogFar;
  // R30: thick fog in foggy weather, and it closes in a little in rain and storms; rain darkens the sky
  const weatherFog = { clear: 1, wind: 1, rain: 0.7, storm: 0.5, fog: 0.25 }[weather];
  view.scene.fog.near *= weatherFog;
  view.scene.fog.far *= weatherFog;
  if (weather === "rain" || weather === "storm") {
    sky.multiplyScalar(weather === "storm" ? 0.55 : 0.75);
    view.scene.fog.color.copy(sky);
  }

  // The sun goes around from east (+x) to west (-x)
  const angle = (f - 0.25) * Math.PI * 2;
  const centre = new THREE.Vector3(player.x, 0, player.z);
  view.sunBall.position.set(centre.x + Math.cos(angle) * 250, Math.sin(angle) * 250, centre.z + 60);
  view.moonBall.position.set(centre.x - Math.cos(angle) * 250, -Math.sin(angle) * 250, centre.z - 60);
  view.sunBall.material.color = mixColors("#fff2b0", "#ff8a3a", sunsetGlow);
  view.stars.position.set(player.x, 0, player.z);
  view.stars.material.opacity = clamp((0.45 - light) * 3, 0, 1);

  view.sun.position.copy(sunHeight > 0 ? view.sunBall.position : view.moonBall.position);
  view.sun.target.position.copy(centre);
  view.sun.intensity = (sunHeight > 0 ? 1.1 * light : 0.25) * dim;
  view.sun.color = sunHeight > 0 ? mixColors("#ffffff", "#ffa060", sunsetGlow) : new THREE.Color("#9fb4ff");
  view.hemi.intensity = (0.25 + 0.5 * light) * dim;
  view.hemi.color = mixColors("#5a6fa8", "#ffffff", light);
}

function updateTreesAndGrass(t, centre) {
  // Leaves sway gently (spec: tree leaves wave). Only trees near the cat need to move.
  for (const top of view.treeTops) {
    if (Math.abs(top.position.x - centre.x) > 80 || Math.abs(top.position.z - centre.z) > 80) continue;
    const p = top.userData.phase;
    const gust = weather === "wind" ? 3 : (weather === "storm" ? 2.5 : 1);   // R30
    top.rotation.z = Math.sin(t * 1.3 * gust + p) * 0.03 * gust * TREE_SWAY;   // R68: half the sway
    top.rotation.x = Math.sin(t * 1.1 + p * 2) * 0.02 * TREE_SWAY;
    for (const leaves of top.children) {
      if (!leaves.userData.base) continue;
      leaves.position.x = leaves.userData.base.x + Math.sin(t * 2 + p + leaves.userData.base.z) * 0.08 * TREE_SWAY;
    }
  }
  // Grass (R24): the shader does the swaying and keeps the blades around the cat
  view.grassUniforms.uTime.value = t;
  view.grassUniforms.uCenter.value.set(centre.x, centre.z);
}

// What the player's cat is doing, for its pose and tail (R28)
function playerPose(size, t) {
  const swimming = inRiver(player.x, player.z) && !player.climbing && !player.onBranch;
  const rolling = player.dodgeTimer > 0;
  return {
    x: player.x, y: player.y - (swimming ? 0.25 * size : 0), z: player.z, heading: player.heading, size,
    moving: player.moving || rolling || (player.climbing && player.walk > 0), running: player.running,
    walk: rolling ? t * 30 : player.walk, crouch: player.crouching || rolling || player.recover > 0,
    attack: player.attackTimer > 0, climbing: !!player.climbing, swimming,
    fighting: fightingEnemies().some((e) => distance(e, player) < 6), turnVel: player.turnVel,
    carrying: player.carrying, dropping: player.dropTimer,
    // R46: still time, leaping, eating, limping when hurt, flinching when hit
    idle: player.idleTime, airborne: !player.onGround && !player.climbing, eating: player.eatTimer,
    limp: player.hp < LOW_HEALTH, flinch: player.hurtTimer > 0,
    curl: player.sleeping > 0, lieDown: !!player.onBranch,   // R71 asleep, R73 on a branch
  };
}

function updateCats(t) {
  const size = catSize();
  const flicker = (timer) => timer > 0 && Math.floor(t * 20) % 2 === 0;

  // Player
  const pose = playerPose(size, t);
  poseCat(view.playerModel, pose, t);
  view.playerModel.visible = playing && !flicker(player.hurtTimer);
  view.playerShadow.position.set(player.x, 0.04, player.z);
  view.playerShadow.scale.setScalar(size * Math.max(0.3, 1 - player.y * 0.15));
  view.playerShadow.visible = playing && !pose.swimming;

  // Rogue
  const rogueShown = playing && (stage >= 2 || rogue.state === "fighting") && rogue.state !== "gone";
  poseFighter(view.rogueModel, rogue, 0.95, t);
  view.rogueModel.visible = rogueShown && !flicker(rogue.hurtTimer);
  view.rogueShadow.position.set(rogue.x, 0.04, rogue.z);
  view.rogueShadow.visible = rogueShown;

  // Other clans' cats: patrols (R16) and camp cats (R29)
  patrols.forEach((c, i) => {
    const model = view.patrolModels[i];
    if (!model) return;
    if (c.state === "resting") {
      // R69b: a beaten cat lies resting in its camp until its medicine cat treats it
      poseCat(model, { x: c.x, y: 0, z: c.z, heading: c.heading, size: 0.95, moving: c.moving, walk: c.walk, lying: !c.moving, hurt: true, limp: c.moving }, t);
      model.visible = playing;
      return;
    }
    poseFighter(model, c, 0.95, t);
    model.visible = playing && !flicker(c.hurtTimer);
  });

  // Your camp cats and mentors (R16, R19)
  campCats.forEach((c, i) => {
    const model = view.campCatModels[i];
    if (!model) return;
    // R58: a mentor shows how a task is done; R63: cats groom, greet, share prey or argue
    const demo = c.demo;
    const social = c.social;
    const heading = social && c.partner ? Math.atan2(c.partner.x - c.x, c.partner.z - c.z) : c.heading;
    poseCat(model, { x: c.x, y: 0, z: c.z, heading, size: 0.95, moving: c.moving || demo === "stalk", walk: c.walk,
                     lying: c.injured, hurt: c.injured, crouch: demo === "sniff" || demo === "stalk" || social === "argue",
                     fighting: demo === "fight" || social === "argue" || !!c.helping, attack: (demo === "swipe" && Math.sin(t * 3) > 0.6) || c.attackTimer > 0,
                     eating: social === "share" ? 1 : 0, idle: social === "groom" ? 6 : 0 }, t);
    if (demo === "look-up") model.userData.head.rotation.x = -0.7;
    if (demo === "sniff") model.userData.head.rotation.x = 0.6;
    if (social === "groom") model.userData.head.rotation.x = 0.3 + Math.sin(t * 6) * 0.2;
    model.visible = playing;
  });

  // Clanmates (leader only, R9)
  if (view.clanmateModels.length !== clanmates.length) {
    view.clanmateModels.forEach((m) => view.scene.remove(m));
    view.clanmateModels = clanmates.map((c) => {
      const m = makeCatModel(c.look);
      view.scene.add(m);
      return m;
    });
  }
  clanmates.forEach((c, i) => {
    poseCat(view.clanmateModels[i], { x: c.x, y: 0, z: c.z, heading: c.heading, size: 0.95,
                                       moving: c.moving, walk: c.walk }, t);
  });
}

function poseFighter(model, e, size, t) {
  const fighting = e.state === "fighting";
  poseCat(model, {
    x: e.x, y: 0, z: e.z, heading: e.heading, size, fighting,
    moving: e.state === "fleeing" || e.moving || (fighting && e.windup <= 0 && e.stagger <= 0),
    running: e.state === "fleeing", walk: e.walk, crouch: e.windup > 0.15 || e.stagger > 0,
    attack: e.windup > 0 && e.windup <= 0.15, lying: e.stagger > 0 && Math.floor(t * 4) % 2 === 0,
  }, t);
}

function updateCritters(t) {
  const shown = (c) => playing && (c.state === "idle" || c.state === "hopping" || c.state === "fleeing");
  const place = (model, c) => {
    const moving = c.state === "hopping" || c.state === "fleeing";
    model.visible = shown(c);
    model.position.set(c.x, moving && c.kind !== "beetle" ? Math.abs(Math.sin(c.hop)) * 0.15 : 0, c.z);
    if (c.perch) model.position.set(c.x + c.perch.tree.r + 0.15, c.perch.y + 0.3, c.z);   // R64: on a branch
    if (moving) model.rotation.y = Math.atan2(c.dirX, c.dirZ);
    model.userData.tail.rotation.x = (c.kind === "squirrel" ? -0.4 : Math.PI / 2.4) + Math.sin(t * 4) * 0.15;
  };
  place(view.squirrelModel, squirrel);

  // Small prey (R13): make models to match the prey list
  if (view.preyModels.length !== prey.length || view.preyModels.some((m, i) => m.userData.kind !== prey[i].kind)) {
    view.preyModels.forEach((m) => view.scene.remove(m));
    view.preyModels = prey.map((p) => {
      const m = makePreyModel(p.kind);
      m.userData.kind = p.kind;
      view.scene.add(m);
      return m;
    });
  }
  prey.forEach((p, i) => place(view.preyModels[i], p));

  // Prey dropped on the ground (R27), falling from the mouth
  if (view.droppedModels.length !== dropped.length || view.droppedModels.some((m, i) => m.userData.kind !== dropped[i].kind)) {
    view.droppedModels.forEach((m) => view.scene.remove(m));
    view.droppedModels = dropped.map((d) => {
      const m = makePreyModel(d.kind);
      m.userData.kind = d.kind;
      view.scene.add(m);
      return m;
    });
  }
  dropped.forEach((d, i) => {
    const m = view.droppedModels[i];
    m.visible = playing;
    m.position.set(d.x, d.y, d.z);
    m.rotation.set(d.fall * 6, d.x, Math.PI / 2 * (1 - d.fall / DROP_TIME));   // tumbles, then lies on its side
  });
}

// R14: glowing dots along each prey's scent trail and on to the prey itself
function updateScent(t) {
  const dots = view.scentDots;
  dots.visible = playing && player.scenting;
  if (!dots.visible) return;
  const positions = dots.geometry.attributes.position;
  let n = 0;
  const add = (x, y, z) => {
    if (n >= view.maxDots) return;
    positions.setXYZ(n, x, y, z);
    n++;
  };
  for (const { prey: c } of scentTargets()) {
    // the old trail, then a column of dots rising over the prey so it can be seen through trees
    const points = c.trail.concat([{ x: c.x, z: c.z }]);
    for (let i = 1; i < points.length; i++) {
      const a = points[i - 1];
      const b = points[i];
      for (let k = 0; k < 4; k++) {
        const f = k / 4;
        add(a.x + (b.x - a.x) * f, 0.15 + Math.sin(t * 3 + i + k) * 0.05, a.z + (b.z - a.z) * f);
      }
    }
    for (let k = 0; k < 6; k++) add(c.x, 0.3 + k * 0.25 + Math.sin(t * 4) * 0.05, c.z);
  }
  positions.needsUpdate = true;
  dots.geometry.setDrawRange(0, n);
  dots.material.size = 0.16 + Math.sin(t * 5) * 0.03;
}

function updateCamp() {
  view.pileModel.visible = freshKill > 0;
  // Herbs glow while scenting or for a medicine cat; picked herbs disappear until they regrow
  herbs.forEach((h, i) => {
    const model = view.herbModels[i];
    if (!model) return;
    model.visible = h.ready;
    const glow = role === "Medicine cat" || mentor === "herbs" || player.scenting;
    // R53: the herb under the aiming dot glows brightly
    model.userData.aimed = playing && aimedHerb() === h;
    model.userData.flowerMat.emissiveIntensity = model.userData.aimed ? 1.4 : (glow ? 0.6 + Math.sin(time * 3) * 0.3 : 0);
  });
}

// R31: kits play (chase, pounce, tumble, wander); the deputy's apprentice grows bigger
function updateKitModels(t) {
  kits.forEach((k, i) => {
    const model = view.kitModels[i];
    if (!model) return;
    const pounce = k.activity === "pounce" && k.moving;
    poseCat(model, {
      x: k.x, y: pounce ? Math.abs(Math.sin(t * 6 + i)) * 0.25 : 0, z: k.z, heading: k.heading, size: k.size,
      moving: k.moving, running: k.activity === "chase", walk: k.walk, airborne: pounce && Math.sin(t * 6 + i) > 0.3,
      crouch: ((k.activity === "pounce" || k.activity === "playpounce") && !k.moving) || (k.lesson === "battle" && !k.moving),
      fighting: k === trainee && k.lesson === "battle", attack: k.attackTimer > 0,   // squaring up for battle practice
      idle: k.activity === "visit" && !k.moving ? 6 : 0,
    }, t);
    if (k.activity === "visit" && !k.moving) model.userData.head.rotation.x = -0.4;   // R63: looking up at you
    // Tumbling: roll over on the spot
    if (k.activity === "tumble") model.rotation.z = Math.sin(t * 5 + i) * 1.2;
    model.visible = playing;
  });
}

// R30: rain falls around the camera; lightning flashes in a storm; wind makes plants sway more
const LIGHTNING_EVERY = 5;
function updateWeatherView(t, cam) {
  const wet = weather === "rain" || weather === "storm";
  view.rain.visible = wet;
  if (wet) {
    const pos = view.rain.geometry.attributes.position;
    const fall = weather === "storm" ? 16 : 10;
    for (let i = 0; i < pos.count; i += 2) {
      let y = pos.getY(i) - fall / 60;
      if (y < 0) y += 20;
      pos.setY(i, y);
      pos.setY(i + 1, y - 0.45);
    }
    pos.needsUpdate = true;
    view.rain.position.set(cam.x, 0, cam.z);
    view.rain.material.opacity = weather === "storm" ? 0.75 : 0.55;
  }
  view.lightningFlash = weather === "storm" && t % LIGHTNING_EVERY < 0.2 ? 1 : 0;
  if (view.lightningFlash) {
    view.scene.background = new THREE.Color("#d8e0ff");
    view.hemi.intensity = 1.6;
  }
  view.grassUniforms.uWind.value = weather === "wind" ? 2.2 : (weather === "storm" ? 1.8 : 1);
}

// R35: while fishing, fish are drawn swimming under the water, with a ripple where the paw reaches
function updateFishingView(t) {
  view.fishModels.forEach((m, i) => {
    const f = fishing.active ? fishing.fish[i] : null;
    m.visible = !!f;
    if (!f) return;
    m.position.set(f.x, -0.06, f.z);   // just under the surface
    m.rotation.y = f.heading;
    m.userData.tailFin.rotation.y = Math.PI / 2 + Math.sin(t * (f.dart > 0 ? 20 : 8) + i) * 0.4;   // tail swish
  });
  view.ripple.visible = fishing.active;
  if (fishing.active) {
    const paw = pawSpot();
    view.ripple.position.set(paw.x, 0.06, paw.z);
    const s = 1 + (t * 1.5 % 1) * 0.6;
    view.ripple.scale.set(s * pawReach() / PAW_REACH, s * pawReach() / PAW_REACH, 1);
    view.ripple.material.color.set(fishing.flash > 0 ? (fishing.flashGood ? "#7ddc6a" : "#e05a4a") : "#ffffff");
  }
}

// Keep a list of models matching a list of cats (making new models when the list changes)
function syncCatModels(models, cats) {
  if (models.length === cats.length && models.every((m, i) => m.userData.source === cats[i])) return models;
  models.forEach((m) => view.scene.remove(m));
  return cats.map((c) => {
    const m = makeCatModel(c.look);
    m.userData.source = c;
    view.scene.add(m);
    return m;
  });
}

// Round 5: medicine cats (R52), raiders (R54), the other leaders at a Gathering (R48), stolen prey (R49)
function updateRound5View(t) {
  medicineCats.forEach((m, i) => {
    const model = view.medicineCatModels[i];
    poseCat(model, { x: m.x, y: 0, z: m.z, heading: m.heading, size: 0.95, moving: m.moving, walk: m.walk, idle: m.moving ? 0 : 6 }, t);
    model.visible = playing;
  });
  view.raiderModels = syncCatModels(view.raiderModels, raiders);
  raiders.forEach((r, i) => {
    poseFighter(view.raiderModels[i], r, 0.95, t);
    view.raiderModels[i].visible = playing;
  });
  // R69a: every clan's leader is always there (by its Highrock, or at the Great Oak for a Gathering)
  const showLeaders = leaders.filter((l) => !l.retired);
  view.leaderModels = syncCatModels(view.leaderModels, showLeaders);
  showLeaders.forEach((l, i) => {
    poseCat(view.leaderModels[i], { x: l.x, y: 0, z: l.z, heading: l.heading, size: 1.05, moving: l.moving, walk: l.walk, idle: l.moving ? 0 : 6 }, t);
    view.leaderModels[i].visible = playing;
  });
  const stolen = stolenPrey && !stolenPrey.taken;
  view.stolenModel.visible = playing && !!stolen;
  if (stolen) view.stolenModel.position.set(stolenPrey.x, 0.1, stolenPrey.z);
}

// ======================================================
// Round 6
// ======================================================
const LEAF_AMOUNT = { newleaf: 120, greenleaf: 80, "leaf-fall": 600, "leaf-bare": 0 };   // R68
const LEAF_COLOR = { newleaf: "#9ad06a", greenleaf: "#5f9a3a", "leaf-fall": "#d0782a", "leaf-bare": "#8a7a5a" };
// R69: how the trees' leaves are tinted each season
const SEASON_TINT = { newleaf: ["#a8e070", 0.25], greenleaf: ["#2f6a2a", 0], "leaf-fall": ["#c8641e", 0.55], "leaf-bare": ["#7a6a50", 0.6] };

function updateRound6View(t, cam) {
  const s = season();
  // R59: the water flows; a fish jumps now and then near you; a splash where you walked in
  view.waterMaterial.map.offset.y = -t * CURRENT_SPEED / (WORLD_HALF * 2) * 60;
  const jump = (t % 7) / 1.2;   // a jump lasts 1.2 s every 7 s
  const which = waterNear(player.x, player.z);
  const water = watersAt(player.z)[which];
  const nearWater = playing && Math.abs(player.x - (water.x0 + water.x1) / 2) < 25;
  view.jumpingFish.visible = nearWater && jump < 1;
  if (view.jumpingFish.visible) {
    const z = player.z + 6 + Math.floor(t / 7) % 5 * 2 - jump * 1.5;
    const there = watersAt(z)[which];   // the river bends (R74)
    view.jumpingFish.position.set((there.x0 + there.x1) / 2 + Math.sin(Math.floor(t / 7)) * 1.5, Math.sin(jump * Math.PI) * 0.9 - 0.05, z);
    view.jumpingFish.rotation.set(-Math.cos(jump * Math.PI) * 0.9, Math.PI, 0);
  }
  view.splash.visible = playing && player.splashTimer > 0;
  if (view.splash.visible) {
    const grow = 1 + (0.6 - player.splashTimer) * 3;
    view.splash.position.set(player.x, 0.07, player.z);
    view.splash.scale.set(grow, grow, 1);
    view.splash.material.opacity = player.splashTimer;
  }
  if (view.stoneModels.length !== steppingStones.length) buildScene();

  // R65: the fresh-kill pile shows the prey on it
  if (view.pileModels.length !== pileItems.length || view.pileModels.some((m, i) => m.userData.kind !== pileItems[i].kind)) {
    view.pileModels.forEach((m) => view.pileStack.remove(m));
    view.pileModels = pileItems.map((p, k) => {
      const m = p.kind === "fish" ? makeFishModel() : makePreyModel(p.kind);
      m.userData.kind = p.kind;
      const ring = k % 6;
      const layer = Math.floor(k / 6);
      m.position.set(Math.sin(ring * 1.05 + layer) * (0.45 - layer * 0.12), 0.06 + layer * 0.14, Math.cos(ring * 1.05 + layer) * (0.45 - layer * 0.12));
      m.rotation.set(0, ring * 1.05 + layer, Math.PI / 2);   // lying on their sides
      view.pileStack.add(m);
      return m;
    });
  }
  view.pileModels.forEach((m) => { m.visible = true; });

  // R67: the next marker glows brightest and pulses
  view.markerModels.forEach((m, i) => {
    const next = i === markersVisited;
    const glow = next ? 1.2 + Math.sin(t * 4) * 0.3 : (i < markersVisited ? 0.15 : 0.5);
    m.userData.glow = next ? 1.2 : (i < markersVisited ? 0.15 : 0.5);
    m.userData.glowMat.opacity = Math.min(0.9, 0.12 + glow * 0.45);   // the next one pulses brightest (R72)
    m.userData.ring.material.opacity = next ? 0.9 : 0.4;
    m.userData.ring.scale.setScalar(next ? 1 + (t % 1.5) * 0.25 : 1);
    m.visible = true;
  });

  // R68: leaves drift down around the camera (R69: how many depends on the season)
  const amount = LEAF_AMOUNT[s];
  view.leaves.userData.amount = amount;
  view.leaves.visible = amount > 0;
  view.leaves.material.color.set(LEAF_COLOR[s]);
  view.leaves.geometry.setDrawRange(0, amount);
  if (amount > 0) {
    const pos = view.leaves.geometry.attributes.position;
    for (let i = 0; i < amount; i++) {
      let y = pos.getY(i) - 0.9 / 60;
      if (y < 0) y += 14;
      pos.setY(i, y);
      pos.setX(i, pos.getX(i) + Math.sin(t * 1.5 + i) * 0.01);
    }
    pos.needsUpdate = true;
    view.leaves.position.set(cam.x, 0, cam.z);
  }
  // R69: snow in leaf-bare, and the trees change colour with the seasons
  view.snow.visible = s === "leaf-bare";
  if (view.snow.visible) {
    const flakes = view.snow.userData.flakes;
    const pos = flakes.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) - 1.2 / 60;
      if (y < 0) y += 16;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
    flakes.position.set(cam.x, 0, cam.z);
    view.snow.children[0].position.x = 0;
  }
  if (view.leafSeason !== s) {
    view.leafSeason = s;
    const [tint, amountTint] = SEASON_TINT[s];
    for (const place in view.leafMats) {
      view.leafMats[place].forEach((m, i) => {
        const base = PLACES[place].leaves[i];
        m.color.copy(mixColors(base, tint, place === "marsh" ? amountTint * 0.3 : amountTint));   // pines stay green
      });
    }
  }

  // R64: from high in a tree, markers over the prey (green) and enemies (red) you can see
  const seen = playing ? spottedFromTree() : [];
  view.spotMarkers.forEach((m, i) => {
    const thing = seen[i];
    m.visible = !!thing;
    if (!thing) return;
    m.position.set(thing.x, 2 + Math.sin(t * 3 + i) * 0.2, thing.z);
    m.material.color.set(PREY_KINDS[thing.kind] ? "#7dff7a" : "#ff4a3a");
  });

  // R62: the rest of a rogue pack
  view.rogueMateModels = syncCatModels(view.rogueMateModels, rogueMates);
  rogueMates.forEach((m, i) => {
    poseFighter(view.rogueMateModels[i], m, 0.9, t);
    view.rogueMateModels[i].visible = playing && !(m.hurtTimer > 0 && Math.floor(t * 20) % 2 === 0);
  });
}

// ======================================================
// Round 7
// ======================================================
// R70: a small nametag (a sprite with the name drawn on a canvas)
function makeNametag(text) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const c = canvas.getContext("2d");
  c.font = "bold 30px Georgia";
  const w = Math.min(248, c.measureText(text).width + 28);
  c.fillStyle = "rgba(20, 16, 10, 0.6)";
  c.beginPath();
  c.moveTo(128 - w / 2 + 14, 10);
  c.arcTo(128 + w / 2, 10, 128 + w / 2, 54, 14);
  c.arcTo(128 + w / 2, 54, 128 - w / 2, 54, 14);
  c.arcTo(128 - w / 2, 54, 128 - w / 2, 10, 14);
  c.arcTo(128 - w / 2, 10, 128 + w / 2, 10, 14);
  c.fill();
  c.fillStyle = "#fff4d8";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillText(text, 128, 33);
  const tag = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), depthWrite: false, fog: false }));
  tag.scale.set(1.6, 0.4, 1);
  tag.userData.text = text;
  return tag;
}

function updateRound7View() {
  // R70: tags over the important cats that are near you
  const cats = importantCats();
  if (view.nametags.length !== cats.length || view.nametags.some((t, i) => t.userData.source !== cats[i] || t.userData.text !== cats[i].name)) {
    view.nametags.forEach((t) => view.scene.remove(t));
    view.nametags = cats.map((c) => {
      const tag = makeNametag(c.name);
      tag.userData.source = c;
      view.scene.add(tag);
      return tag;
    });
  }
  view.nametags.forEach((tag) => {
    const c = tag.userData.source;
    tag.position.set(c.x, (c.size || 1) * 1.05 + 0.35, c.z);
    tag.visible = playing && distance(c, player) < NAMETAG_RANGE;
  });
}

// ======================================================
// Round 8
// ======================================================
// R81: things between the camera and your cat turn see-through while they are in the way
const FADE_OPACITY = 0.3;

function setFaded(obj, on) {
  if (!!obj.userData.faded === on) return;
  obj.userData.faded = on;
  obj.traverse((m) => {
    if (!m.isMesh) return;
    if (on) {
      if (!m.userData.baseMat) m.userData.baseMat = m.material;
      if (!m.userData.fadeMat) {
        const f = m.userData.baseMat.clone();   // its own copy, so other trees and cats sharing the material stay solid
        f.transparent = true;
        f.opacity = FADE_OPACITY * m.userData.baseMat.opacity;
        f.depthWrite = false;
        m.userData.fadeMat = f;
      }
      m.material = m.userData.fadeMat;
    } else if (m.userData.baseMat) {
      m.material = m.userData.baseMat;
    }
  });
}

// How far (x, z) is from the line from the camera to the cat, seen from above, and where along it
function nearSightLine(cam, target, x, z) {
  const dx = target.x - cam.x;
  const dz = target.z - cam.z;
  const len2 = dx * dx + dz * dz || 0.0001;
  const t = ((x - cam.x) * dx + (z - cam.z) * dz) / len2;
  const c = clamp(t, 0, 1);
  return { t, dist: Math.hypot(x - (cam.x + dx * c), z - (cam.z + dz * c)) };
}

function updateFading(cam) {
  const fade = new Set();
  if (playing) {
    const target = { x: player.x, y: player.y + 0.5, z: player.z };
    const between = (x, z, r) => { const s = nearSightLine(cam, target, x, z); return s.t > 0.02 && s.t < 0.97 && s.dist < r; };
    // Trees: the trunk, or the leaves if the sight line is up at their height
    for (const parts of view.treeParts) {
      const t = parts.tree;
      if (Math.abs(t.x - player.x) > 25 || Math.abs(t.z - player.z) > 25) continue;
      const s = nearSightLine(cam, target, t.x, t.z);
      if (s.t <= 0.02 || s.t >= 0.97) continue;
      const lineY = cam.y + (target.y - cam.y) * s.t;
      const canopy = (2.2 + t.r * 2) * (t.kind === "willow" ? 1.15 : 1);
      if (s.dist < t.r + 0.25 || (s.dist < canopy && lineY > parts.top.position.y - canopy * 0.8)) {
        fade.add(parts.trunk);
        fade.add(parts.top);
        parts.branches.forEach((b) => fade.add(b));
      }
    }
    // Other cats
    const cats = [...view.campCatModels, ...view.kitModels, ...view.patrolModels, ...view.medicineCatModels, ...view.leaderModels,
                  ...view.clanmateModels, ...view.raiderModels, ...view.rogueMateModels, view.rogueModel];
    for (const m of cats) {
      if (m && m.visible && between(m.position.x, m.position.z, 0.6)) fade.add(m);
    }
    // Hut walls (not the hut you are in)
    const inHut = insideHut(player);
    for (const m of view.hutModels) {
      const h = m.userData.hut;
      if (h === inHut || Math.abs(h.x - player.x) > 20 || Math.abs(h.z - player.z) > 20) continue;
      if (nearSightLine(cam, target, h.x, h.z).dist < h.R) fade.add(m);
    }
  }
  for (const obj of view.faded || []) if (!fade.has(obj)) setFaded(obj, false);
  for (const obj of fade) setFaded(obj, true);
  view.faded = fade;
}

// R21: on the title screen the camera slowly circles the camp
function titleCamera(t) {
  const a = t * 0.1;
  return { x: CAMP.x + Math.sin(a) * 18, y: 6, z: CAMP.z + Math.cos(a) * 18, lookX: CAMP.x, lookY: 1, lookZ: CAMP.z };
}

function renderFrame() {
  if (!view) return;
  if (view.builtFor !== clanName || view.campCatModels.length !== campCats.length ||
      view.patrolModels.length !== patrols.length || view.herbModels.length !== herbs.length ||
      view.kitModels.length !== kits.length || view.medicineCatModels.length !== medicineCats.length || view.builtLook !== JSON.stringify(look)) {
    buildScene();   // a new game with a different clan or cat
  }
  const t = time;
  const cam = playing ? cameraFor() : titleCamera(t);
  updateSky();
  updateTreesAndGrass(t, playing ? player : CAMP);
  updateCats(t);
  updateCritters(t);
  updateScent(t);
  updateCamp();
  updateKitModels(t);
  updateWeatherView(t, cam);
  updateFishingView(t);
  updateRound5View(t);
  updateRound6View(t, cam);
  updateRound7View();
  updateFading(cam);   // R81

  // R11/R12/R25: the camera sits low and close behind the cat (inside a hut when you are)
  view.camera.position.set(cam.x, cam.y, cam.z);
  view.camera.lookAt(cam.lookX, cam.lookY, cam.lookZ);
  view.renderer.render(view.scene, view.camera);
}

// ======================================================
// Menu preview: the cat you are making, turning slowly
// ======================================================
function initPreview(canvas) {
  if (!has3D()) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.width, canvas.height, false);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff4e0, 0x334422, 0.9));
  const light = new THREE.DirectionalLight(0xffffff, 0.7);
  light.position.set(2, 3, 2);
  scene.add(light);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(0.9, 32), mat("#4f8a35"));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const camera = new THREE.PerspectiveCamera(32, canvas.width / canvas.height, 0.1, 50);
  camera.position.set(0, 0.9, 2.3);
  camera.lookAt(0, 0.42, 0);
  preview = { renderer, scene, camera, model: null, key: "" };
}

function renderPreview() {
  if (!preview) return;
  const key = JSON.stringify(look);
  if (key !== preview.key) {
    if (preview.model) preview.scene.remove(preview.model);
    preview.model = makeCatModel(look);
    preview.scene.add(preview.model);
    preview.key = key;
  }
  poseCat(preview.model, { x: 0, y: 0, z: 0, heading: time * 0.6 + 0.6, size: 1 }, time);
  preview.renderer.render(preview.scene, preview.camera);
}
