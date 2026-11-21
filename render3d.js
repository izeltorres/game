// Forest Clans - 3D drawing with Three.js (free, loaded from a CDN in index.html).
// It only reads the game state from game.js; it never changes it.

let view = null;      // { renderer, scene, camera, ... } once the 3D view is ready
let preview = null;   // the small turning cat on the start menu

const ROGUE_LOOK = { fur: "#6b6156", eyes: "#d4c84a", pattern: "Tabby" };

const SKY = { night: "#0b1630", day: "#87b5d9", sunset: "#f08a4b" };
// The look of each kind of territory (R6, R15)
const PLACES = {
  forest:    { ground: "#4f8a35", grass: "#6aa843", trunk: "#5b4030", leaves: ["#2f8a3a", "#3a7a3e", "#4a9a40"], fogNear: 40, fogFar: 150 },
  marsh:     { ground: "#3b4a2a", grass: "#6b7a3a", trunk: "#3e2e22", leaves: ["#1f4a2e", "#24563a", "#2c5e34"], fogNear: 12, fogFar: 70 },
  moor:      { ground: "#8a9a55", grass: "#a8a860", trunk: "#5b4a35", leaves: ["#5a7a35", "#6a8a3a", "#4f6f30"], fogNear: 60, fogFar: 200 },
  riverside: { ground: "#5a9a4a", grass: "#7ab850", trunk: "#6b5a45", leaves: ["#6aa84a", "#7cba5a", "#5a9a42"], fogNear: 45, fogFar: 160 },
};
const GRASS_WINDOW = 70;   // grass is drawn in a square this big around the cat

function has3D() {
  return typeof THREE !== "undefined";
}

// Lambert materials are cheap and look fine for a low-poly forest
function mat(color, extra) {
  return new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));
}

// ======================================================
// Models
// ======================================================
// Cat model (faces +z, 1 unit long at size 1)
function makeCatModel(catLook) {
  const fur = mat(catLook.fur);
  const dark = mat(new THREE.Color(catLook.fur).multiplyScalar(0.6));
  const light = mat(catLook.fur === "#efebe2" ? "#d9822b" : "#f4f1ea");
  const cat = new THREE.Group();
  const body = new THREE.Group();   // everything that moves down when crouching
  cat.add(body);

  const sphere = new THREE.SphereGeometry(1, 16, 12);

  const torso = new THREE.Mesh(sphere, fur);
  torso.scale.set(0.23, 0.22, 0.48);
  torso.position.set(0, 0.48, 0);
  body.add(torso);

  if (catLook.pattern === "Tabby") {
    for (const z of [-0.3, -0.12, 0.06, 0.24]) {
      const stripe = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.025, 6, 12, Math.PI), dark);
      stripe.position.set(0, 0.48, z);
      stripe.rotation.y = Math.PI / 2;
      stripe.scale.set(1, 1.1, 1.15);
      body.add(stripe);
    }
  } else if (catLook.pattern === "Patches") {
    for (const [x, y, z, s] of [[0.14, 0.5, 0.1, 0.12], [-0.15, 0.45, -0.15, 0.1], [0, 0.31, 0.05, 0.14]]) {
      const patch = new THREE.Mesh(sphere, light);
      patch.scale.set(s * 0.6, s * 0.6, s);
      patch.position.set(x, y, z);
      body.add(patch);
    }
  }

  // Head with ears, eyes and nose
  const head = new THREE.Group();
  head.position.set(0, 0.7, 0.5);
  body.add(head);
  const skull = new THREE.Mesh(sphere, fur);
  skull.scale.set(0.2, 0.18, 0.19);
  head.add(skull);
  const earGeo = new THREE.ConeGeometry(0.07, 0.16, 4);
  for (const side of [-1, 1]) {
    const ear = new THREE.Mesh(earGeo, fur);
    ear.position.set(side * 0.1, 0.17, -0.02);
    ear.rotation.z = -side * 0.25;
    head.add(ear);
    const eye = new THREE.Mesh(sphere, mat(catLook.eyes, { emissive: catLook.eyes, emissiveIntensity: 0.25 }));
    eye.scale.set(0.04, 0.045, 0.03);
    eye.position.set(side * 0.08, 0.03, 0.16);
    head.add(eye);
    const pupil = new THREE.Mesh(sphere, mat("#111111"));
    pupil.scale.set(0.015, 0.035, 0.02);
    pupil.position.set(side * 0.08, 0.03, 0.185);
    head.add(pupil);
  }
  const nose = new THREE.Mesh(sphere, mat("#d77a8a"));
  nose.scale.set(0.03, 0.022, 0.02);
  nose.position.set(0, -0.03, 0.19);
  head.add(nose);
  // Prey carried in the mouth (R13, R20)
  const carry = new THREE.Mesh(sphere, mat("#8a6a50"));
  carry.scale.set(0.07, 0.05, 0.12);
  carry.position.set(0, -0.12, 0.2);
  carry.visible = false;
  head.add(carry);

  // Legs swing from the hip
  const legGeo = new THREE.CylinderGeometry(0.05, 0.045, 0.36, 8);
  legGeo.translate(0, -0.18, 0);
  const legs = [];
  for (const [x, z, phase] of [[-0.11, 0.3, 0], [0.11, 0.3, Math.PI], [-0.11, -0.3, Math.PI], [0.11, -0.3, 0]]) {
    const leg = new THREE.Mesh(legGeo, x < 0 ? dark : fur);
    leg.position.set(x, 0.38, z);
    leg.userData.phase = phase;
    cat.add(leg);
    legs.push(leg);
  }

  // Tail: two pieces so it can curve and swish
  const tailGeo = new THREE.CylinderGeometry(0.04, 0.05, 0.4, 8);
  tailGeo.translate(0, 0.2, 0);
  const tail = new THREE.Mesh(tailGeo, fur);
  tail.position.set(0, 0.55, -0.44);
  tail.rotation.x = -0.9;
  body.add(tail);
  const tailTip = new THREE.Mesh(tailGeo, catLook.pattern === "Solid" ? fur : dark);
  tailTip.position.set(0, 0.4, 0);
  tailTip.rotation.x = 0.7;
  tailTip.rotation.z = 0.5;
  tail.add(tailTip);

  // A red cross over a hurt cat (R18)
  const hurt = new THREE.Group();
  const red = new THREE.MeshBasicMaterial({ color: "#e0302a" });
  const bar = new THREE.BoxGeometry(0.28, 0.08, 0.08);
  const across = new THREE.Mesh(bar, red);
  const down = new THREE.Mesh(bar, red);
  down.rotation.z = Math.PI / 2;
  hurt.add(across, down);
  hurt.position.set(0, 1.25, 0);
  hurt.visible = false;
  cat.add(hurt);

  cat.userData = { body, head, legs, tail, carry, hurt };
  cat.rotation.order = "YXZ";   // turn first, then tilt (for climbing)
  return cat;
}

// Move and animate a cat model. pose: { x, y, z, heading, size, moving, walk, crouch, attack, climbing, lying }
function poseCat(model, pose, t) {
  const parts = model.userData;
  model.position.set(pose.x, pose.y, pose.z);
  model.rotation.y = pose.heading;
  model.rotation.x = pose.climbing ? -1.25 : 0;
  model.rotation.z = pose.lying ? 1.3 : 0;
  model.scale.setScalar(pose.size);
  parts.body.position.y = pose.crouch ? -0.12 : (pose.moving ? Math.abs(Math.sin(pose.walk)) * 0.03 : 0);
  parts.legs.forEach((leg, i) => {
    leg.rotation.x = pose.moving ? Math.sin(pose.walk + leg.userData.phase) * 0.6 : 0;
    if (pose.attack && i === 1) leg.rotation.x = -1.3;   // swipe with a front paw
  });
  parts.tail.rotation.z = Math.sin(t * 3) * 0.35;
  parts.tail.rotation.x = pose.crouch ? -1.4 : -0.9;
  parts.carry.visible = !!pose.carrying;
  parts.hurt.visible = !!pose.hurt;
  parts.hurt.rotation.y = t * 2;
}

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

// A den: a low bramble dome with a dark entrance facing the middle of camp (R20)
function makeDen(den, color) {
  const g = new THREE.Group();
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1.4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(color, { flatShading: true }));
  dome.scale.set(1, 0.8, 1);
  g.add(dome);
  const door = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), new THREE.MeshBasicMaterial({ color: "#1a120c" }));
  door.position.set(0, 0.4, 1.38);
  g.add(door);
  g.position.set(den.x, 0, den.z);
  return g;
}

// ======================================================
// Setting up the 3D view
// ======================================================
function initView(canvas) {
  if (!has3D()) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.width, canvas.height, false);
  const camera = new THREE.PerspectiveCamera(70, canvas.width / canvas.height, 0.05, 400);
  view = { renderer, camera, scene: null };
  buildScene();
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
  const edge = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF * 4, WORLD_HALF * 4), mat("#3d5a30"));
  edge.rotation.x = -Math.PI / 2;
  edge.position.y = -0.02;
  scene.add(edge);
  for (const clan in CLANS) {
    const c = CLANS[clan];
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF, WORLD_HALF), mat(PLACES[c.biome].ground));
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(c.sx * WORLD_HALF / 2, 0, c.sz * WORLD_HALF / 2);
    scene.add(ground);
  }

  // The river and the stream
  const waterMat = new THREE.MeshPhongMaterial({ color: "#3f7fb8", shininess: 80, transparent: true, opacity: 0.9 });
  for (const w of WATERS) {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(w.x1 - w.x0, WORLD_HALF * 2), waterMat);
    water.rotation.x = -Math.PI / 2;
    water.position.set((w.x0 + w.x1) / 2, 0.03, 0);
    scene.add(water);
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
    const nearCamp = Object.keys(CLANS).some((c) => distance({ x, z }, campOf(c)) < 12);
    if (nearRiver(x) || nearCamp) continue;
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
    for (const x of [RIVER_X0 - 0.3, RIVER_X1 + 0.3]) {
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
    trunkMats[name] = mat(PLACES[name].trunk);
    leafMats[name] = PLACES[name].leaves.map((c) => mat(c, { flatShading: true }));
  }
  const treeTops = [];
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
        const blob = new THREE.Mesh(blobGeo, leafMats[place][Math.floor(random() * 3)]);
        blob.scale.set(size * s, size * s * (t.kind === "willow" ? 1.3 : 1), size * s);
        blob.position.set(bx * size, by * size, bz * size);
        blob.userData.base = blob.position.clone();
        top.add(blob);
      }
    }
    top.userData.phase = t.phase;
    scene.add(top);
    treeTops.push(top);
  }

  // Waving grass: thin blades drawn as one InstancedMesh, kept in a square around the cat
  const bladeGeo = new THREE.ConeGeometry(0.04, 0.45, 3);
  bladeGeo.translate(0, 0.225, 0);
  const blades = [];
  for (let i = 0; i < 3500; i++) {
    blades.push({ ox: random() * GRASS_WINDOW, oz: random() * GRASS_WINDOW, h: 0.45 + random() * 0.55, phase: random() * 6 });
  }
  const grass = new THREE.InstancedMesh(bladeGeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), blades.length);
  grass.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(blades.length * 3), 3);
  grass.frustumCulled = false;
  scene.add(grass);
  const grassColors = {};
  for (const name in PLACES) grassColors[name] = new THREE.Color(PLACES[name].grass);

  // Camps: a ring of stones, a big rock (Highrock), and dens for every clan (R20)
  const stoneMat = mat("#8a8a80", { flatShading: true });
  const stoneGeo = new THREE.DodecahedronGeometry(1, 0);
  let denModels = [];
  for (const clan in CLANS) {
    const camp = campOf(clan);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      const stone = new THREE.Mesh(stoneGeo, stoneMat);
      stone.scale.setScalar(0.35 + random() * 0.25);
      stone.position.set(camp.x + Math.sin(a) * 9, 0.15, camp.z + Math.cos(a) * 9);
      scene.add(stone);
    }
    const highrock = new THREE.Mesh(stoneGeo, stoneMat);
    const rockSpot = spotFor(clan, 0, -9);
    highrock.scale.set(2.2, 1.8, 2);
    highrock.position.set(rockSpot.x, 0.9, rockSpot.z);
    scene.add(highrock);
    const models = DEN_SPOTS.filter((d) => d.id !== "leader").map((d) => {
      const den = makeDen(spotFor(clan, ...d.spot), d.id === "medicine" ? "#4a6a3a" : "#5a4a30");
      den.lookAt(camp.x, 0, camp.z);
      scene.add(den);
      return den;
    });
    // The leader's den is a dark hollow under the Highrock
    const leaderSpot = spotFor(clan, ...DEN_SPOTS.find((d) => d.id === "leader").spot);
    const hollow = new THREE.Mesh(new THREE.CircleGeometry(0.6, 12), new THREE.MeshBasicMaterial({ color: "#1a120c" }));
    hollow.position.set(leaderSpot.x, 0.6, leaderSpot.z);
    hollow.lookAt(camp.x, 0.6, camp.z);
    scene.add(hollow);
    if (clan === clanName) denModels = models.concat([hollow]);
  }

  // The fresh-kill pile in your camp
  const pileModel = new THREE.Group();
  const pileMat = mat("#7a5a40");
  for (let k = 0; k < 8; k++) {
    const piece = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), pileMat);
    piece.scale.set(0.18, 0.12, 0.26);
    piece.position.set(Math.sin(k * 2.3) * 0.35, 0.1 + Math.floor(k / 4) * 0.15, Math.cos(k * 2.3) * 0.35);
    piece.rotation.y = k;
    pileModel.add(piece);
  }
  pileModel.position.set(FRESH_KILL.x, 0, FRESH_KILL.z);
  scene.add(pileModel);

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

  Object.assign(view, {
    scene, hemi, sun, sunBall, moonBall, stars, treeTops, grass, blades, grassColors, herbModels, denModels, pileModel,
    playerModel, playerShadow, rogueModel, rogueShadow, squirrelModel, campCatModels, patrolModels,
    preyModels: [], clanmateModels: [], scentDots, maxDots, builtFor: clanName,
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

function updateTreesAndGrass(t) {
  // Leaves sway gently (spec: tree leaves wave). Only trees near the cat need to move.
  for (const top of view.treeTops) {
    if (Math.abs(top.position.x - player.x) > 80 || Math.abs(top.position.z - player.z) > 80) continue;
    const p = top.userData.phase;
    top.rotation.z = Math.sin(t * 1.3 + p) * 0.03;
    top.rotation.x = Math.sin(t * 1.1 + p * 2) * 0.02;
    for (const blob of top.children) {
      if (!blob.userData.base) continue;
      blob.position.x = blob.userData.base.x + Math.sin(t * 2 + p + blob.userData.base.z) * 0.08;
    }
  }
  // Grass: each blade keeps its place in the world, and wraps around to stay near the cat.
  // A slow wave moves across the field, plus a little flutter per blade.
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const pos = new THREE.Vector3();
  const half = GRASS_WINDOW / 2;
  const wrap = (offset, centre) => centre - half + ((((offset - (centre - half)) % GRASS_WINDOW) + GRASS_WINDOW) % GRASS_WINDOW);
  view.blades.forEach((b, i) => {
    const x = wrap(b.ox, player.x);
    const z = wrap(b.oz, player.z);
    const hidden = inRiver(x) || Math.abs(x) > WORLD_HALF || Math.abs(z) > WORLD_HALF;
    const sway = Math.sin(t * 2.2 + x * 0.3) * 0.25 + Math.sin(t * 3.1 + b.phase) * 0.08;
    e.set(sway * 0.5, b.phase, sway);
    q.setFromEuler(e);
    pos.set(x, 0, z);
    s.set(1, hidden ? 0 : b.h, 1);
    m.compose(pos, q, s);
    view.grass.setMatrixAt(i, m);
    view.grass.setColorAt(i, view.grassColors[biomeAt(x, z)]);
  });
  view.grass.instanceMatrix.needsUpdate = true;
  view.grass.instanceColor.needsUpdate = true;
}

function updateCats(t) {
  const size = catSize();
  const flicker = (timer) => timer > 0 && Math.floor(t * 20) % 2 === 0;

  // Player (lower in the water, so it looks like it is swimming)
  const swimDrop = inRiver(player.x) && !player.climbing ? 0.25 * size : 0;
  const rolling = player.dodgeTimer > 0;
  poseCat(view.playerModel, {
    x: player.x, y: player.y - swimDrop, z: player.z, heading: player.heading, size,
    moving: player.moving || rolling || (player.climbing && player.walk > 0), walk: rolling ? t * 30 : player.walk,
    crouch: player.crouching || rolling || player.recover > 0, attack: player.attackTimer > 0,
    climbing: !!player.climbing, carrying: player.carrying,
  }, t);
  view.playerModel.visible = playing && !flicker(player.hurtTimer);
  view.playerShadow.position.set(player.x, 0.04, player.z);
  view.playerShadow.scale.setScalar(size * Math.max(0.3, 1 - player.y * 0.15));
  view.playerShadow.visible = playing && !swimDrop;

  // Rogue
  const rogueShown = playing && (stage >= 2 || rogue.state === "fighting") && rogue.state !== "gone";
  poseFighter(view.rogueModel, rogue, 0.95, t);
  view.rogueModel.visible = rogueShown && !flicker(rogue.hurtTimer);
  view.rogueShadow.position.set(rogue.x, 0.04, rogue.z);
  view.rogueShadow.visible = rogueShown;

  // Other clans' patrols (R16)
  patrols.forEach((c, i) => {
    const model = view.patrolModels[i];
    if (!model) return;
    poseFighter(model, c, 0.95, t);
    model.visible = playing && c.state !== "resting" && !flicker(c.hurtTimer);
  });

  // Camp cats, mentors (R16, R19)
  campCats.forEach((c, i) => {
    const model = view.campCatModels[i];
    if (!model) return;
    poseCat(model, { x: c.x, y: 0, z: c.z, heading: c.heading, size: 0.95, moving: c.moving, walk: c.walk,
                     lying: c.injured, hurt: c.injured }, t);
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
  poseCat(model, {
    x: e.x, y: 0, z: e.z, heading: e.heading, size,
    moving: e.state === "fleeing" || e.moving || (e.state === "fighting" && e.windup <= 0 && e.stagger <= 0),
    walk: e.walk, crouch: e.windup > 0.15 || e.stagger > 0, attack: e.windup > 0 && e.windup <= 0.15,
    lying: e.stagger > 0 && Math.floor(t * 4) % 2 === 0,
  }, t);
}

function updateCritters(t) {
  const shown = (c) => playing && (c.state === "idle" || c.state === "hopping" || c.state === "fleeing");
  const place = (model, c) => {
    const moving = c.state === "hopping" || c.state === "fleeing";
    model.visible = shown(c);
    model.position.set(c.x, moving && c.kind !== "beetle" ? Math.abs(Math.sin(c.hop)) * 0.15 : 0, c.z);
    if (moving) model.rotation.y = Math.atan2(c.dirX, c.dirZ);
    model.userData.tail.rotation.x = (c.kind === "squirrel" ? -0.4 : Math.PI / 2.4) + Math.sin(t * 4) * 0.15;
  };
  place(view.squirrelModel, squirrel);

  // Small prey (R13): make models to match the prey list
  if (view.preyModels.length !== prey.length || view.preyModels.some((m, i) => m.userData.kind !== prey[i].kind)) {
    view.preyModels.forEach((m) => view.scene.remove(m));
    view.preyModels = prey.map((p) => {
      const m = p.kind === "mouse" ? makeMouseModel() : makeBeetleModel();
      m.userData.kind = p.kind;
      view.scene.add(m);
      return m;
    });
  }
  prey.forEach((p, i) => place(view.preyModels[i], p));
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
  view.pileModel.children.forEach((piece, k) => { piece.visible = k < freshKill; });
  // Herbs glow while scenting or for a medicine cat; picked herbs disappear until they regrow
  herbs.forEach((h, i) => {
    const model = view.herbModels[i];
    if (!model) return;
    model.visible = h.ready;
    const glow = role === "Medicine cat" || mentor === "herbs" || player.scenting;
    model.userData.flowerMat.emissiveIntensity = glow ? 0.6 + Math.sin(time * 3) * 0.3 : 0;
  });
}

function renderFrame() {
  if (!view) return;
  if (view.builtFor !== clanName || view.campCatModels.length !== campCats.length ||
      view.patrolModels.length !== patrols.length || view.herbModels.length !== herbs.length) {
    buildScene();   // a new game with a different clan
  }
  const t = time;
  updateSky();
  updateTreesAndGrass(t);
  updateCats(t);
  updateCritters(t);
  updateScent(t);
  updateCamp();

  // R11/R12: the camera sits low and close behind the cat, swinging round smoothly
  const cam = playing ? cameraFor() : { x: CAMP.x - 8, y: 3, z: CAMP.z - 10, lookX: CAMP.x, lookY: 1, lookZ: CAMP.z + 6 };
  view.camera.position.set(cam.x, cam.y, cam.z);
  view.camera.lookAt(cam.lookX, cam.lookY, cam.lookZ);
  view.renderer.render(view.scene, view.camera);
}

// ======================================================
// Menu preview: the cat you are making, turning slowly
// ======================================================
function initPreview(canvas) {
  if (!has3D()) return;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.width, canvas.height, false);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#2f4a28");
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334422, 0.8));
  const light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(2, 3, 2);
  scene.add(light);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.2, 32), mat("#4f8a35"));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const camera = new THREE.PerspectiveCamera(35, canvas.width / canvas.height, 0.1, 50);
  camera.position.set(0, 1.1, 2.6);
  camera.lookAt(0, 0.45, 0);
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
  poseCat(preview.model, { x: 0, y: 0, z: 0, heading: time * 0.6, size: 1, moving: false, walk: 0,
                           crouch: false, attack: false }, time);
  preview.renderer.render(preview.scene, preview.camera);
}
