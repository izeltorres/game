// Forest Clans - 3D drawing with Three.js (free, loaded from a CDN in index.html).
// It only reads the game state from game.js; it never changes it.

let view = null;      // { renderer, scene, camera, ... } once the 3D view is ready
let preview = null;   // the small turning cat on the start menu

const ROGUE_LOOK = { fur: "#6b6156", eyes: "#d4c84a", pattern: "Tabby" };

const SKY = { night: "#0b1630", day: "#87b5d9", sunset: "#f08a4b" };
const PLACES = {
  forest: { ground: "#4f8a35", grass: "#6aa843", trunk: "#5b4030", leaves: ["#2f8a3a", "#3a7a3e", "#4a9a40"],
            fogNear: 40, fogFar: 150 },
  marsh:  { ground: "#3b4a2a", grass: "#6b7a3a", trunk: "#3e2e22", leaves: ["#1f4a2e", "#24563a", "#2c5e34"],
            fogNear: 12, fogFar: 70 },
};

function has3D() {
  return typeof THREE !== "undefined";
}

// Lambert materials are cheap and look fine for a low-poly forest
function mat(color, extra) {
  return new THREE.MeshLambertMaterial(Object.assign({ color }, extra || {}));
}

// ======================================================
// Cat model (faces +z, 1 unit long at size 1)
// ======================================================
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
      stripe.scale.set(1, 1.02, 1.02);
      body.add(stripe);
    }
  } else if (catLook.pattern === "Patches") {
    for (const [x, y, z, s] of [[0.12, 0.5, 0.1, 0.12], [-0.13, 0.45, -0.15, 0.1], [0, 0.32, 0.05, 0.14]]) {
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

  cat.userData = { body, head, legs, tail };
  cat.rotation.order = "YXZ";   // turn first, then tilt (for climbing)
  return cat;
}

// Move and animate a cat model. pose: { x, y, z, heading, size, moving, walk, crouch, attack, climbing }
function poseCat(model, pose, t) {
  const parts = model.userData;
  model.position.set(pose.x, pose.y, pose.z);
  model.rotation.y = pose.heading;
  model.rotation.x = pose.climbing ? -1.25 : 0;
  model.scale.setScalar(pose.size);
  parts.body.position.y = pose.crouch ? -0.12 : (pose.moving ? Math.abs(Math.sin(pose.walk)) * 0.03 : 0);
  parts.legs.forEach((leg, i) => {
    leg.rotation.x = pose.moving ? Math.sin(pose.walk + leg.userData.phase) * 0.6 : 0;
    if (pose.attack && i === 1) leg.rotation.x = -1.3;   // swipe with a front paw
  });
  parts.tail.rotation.z = Math.sin(t * 3) * 0.35;
  parts.tail.rotation.x = pose.crouch ? -1.4 : -0.9;
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

function makeShadow(radius) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(radius, 16),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
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

// Build the world for the current clan (ShadowClan gets the marsh, R6)
function buildScene() {
  if (!view) return;
  const place = PLACES[biome()];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY.day);
  scene.fog = new THREE.Fog(SKY.day, place.fogNear, place.fogFar);
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

  // Ground and river
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(WORLD_HALF * 2 + 120, WORLD_HALF * 2 + 120), mat(place.ground));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  const river = new THREE.Mesh(new THREE.PlaneGeometry(RIVER_X1 - RIVER_X0, WORLD_HALF * 2 + 120),
    new THREE.MeshPhongMaterial({ color: "#3f7fb8", shininess: 80, transparent: true, opacity: 0.9 }));
  river.rotation.x = -Math.PI / 2;
  river.position.set((RIVER_X0 + RIVER_X1) / 2, 0.03, 0);
  scene.add(river);

  // Marsh pools and reeds for ShadowClan (R6)
  if (biome() === "marsh") {
    const poolMat = new THREE.MeshPhongMaterial({ color: "#2b3b3a", shininess: 60 });
    const reedMat = mat("#7a7a3a");
    const reedGeo = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 4);
    for (let i = 0; i < 40; i++) {
      const x = -WORLD_HALF + random() * WORLD_HALF * 2;
      const z = -WORLD_HALF + random() * WORLD_HALF * 2;
      if (nearRiver(x) || Math.hypot(x, z) < 12) continue;
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
    }
  }

  // Trees: leafy oaks, or pines in the marsh
  const trunkMat = mat(place.trunk);
  const leafMats = place.leaves.map((c) => mat(c, { flatShading: true }));
  const trunkGeo = new THREE.CylinderGeometry(0.8, 1, 1, 8);
  trunkGeo.translate(0, 0.5, 0);
  const blobGeo = new THREE.IcosahedronGeometry(1, 1);
  const coneGeo = new THREE.ConeGeometry(1, 1, 8);
  const treeTops = [];
  for (const t of trees) {
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.scale.set(t.r, t.kind === "pine" ? t.h * 0.9 : t.h * 0.6, t.r);
    trunk.position.set(t.x, 0, t.z);
    scene.add(trunk);
    const top = new THREE.Group();
    top.position.set(t.x, t.kind === "pine" ? t.h * 0.3 : t.h * 0.6, t.z);
    if (t.kind === "pine") {
      for (let k = 0; k < 3; k++) {
        const cone = new THREE.Mesh(coneGeo, leafMats[k]);
        const w = (2.6 - k * 0.6) * (0.8 + t.r);
        cone.scale.set(w, t.h * 0.35, w);
        cone.position.y = t.h * (0.15 + k * 0.2);
        top.add(cone);
      }
    } else {
      const size = 2.2 + t.r * 2;
      for (const [bx, by, bz, s] of [[0, 0.5, 0, 1], [-0.8, 0, 0.3, 0.75], [0.8, 0.1, -0.2, 0.75], [0.1, 0.2, 0.9, 0.7], [0, 1.1, -0.2, 0.65]]) {
        const blob = new THREE.Mesh(blobGeo, leafMats[Math.floor(random() * leafMats.length)]);
        blob.scale.setScalar(size * s);
        blob.position.set(bx * size, by * size, bz * size);
        blob.userData.base = blob.position.clone();
        top.add(blob);
      }
    }
    top.userData.phase = t.phase;
    scene.add(top);
    treeTops.push(top);
  }

  // Waving grass: many thin blades drawn as one InstancedMesh
  const bladeGeo = new THREE.ConeGeometry(0.04, 0.45, 3);
  bladeGeo.translate(0, 0.225, 0);
  const blades = [];
  for (let i = 0; i < 6000 && blades.length < 4000; i++) {
    const x = -70 + random() * 140;
    const z = -70 + random() * 140;
    if (x > RIVER_X0 - 0.5 && x < RIVER_X1 + 0.5) continue;
    blades.push({ x, z, h: 0.45 + random() * 0.55, phase: random() * 6 });
  }
  const grass = new THREE.InstancedMesh(bladeGeo, mat(place.grass), blades.length);
  scene.add(grass);

  // Camp: a ring of stones and a big rock (Highrock)
  const stoneMat = mat("#8a8a80", { flatShading: true });
  const stoneGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const stone = new THREE.Mesh(stoneGeo, stoneMat);
    stone.scale.setScalar(0.35 + random() * 0.25);
    stone.position.set(CAMP.x + Math.sin(a) * 7, 0.15, CAMP.z + Math.cos(a) * 7);
    scene.add(stone);
  }
  const highrock = new THREE.Mesh(stoneGeo, stoneMat);
  highrock.scale.set(2.2, 1.6, 2);
  highrock.position.set(CAMP.x - 5, 0.8, CAMP.z - 3);
  scene.add(highrock);

  // Herbs (medicine cats, R9)
  const herbModels = herbs.map((h) => {
    const g = new THREE.Group();
    const bush = new THREE.Mesh(blobGeo, mat("#3f9a52", { flatShading: true }));
    bush.scale.set(0.35, 0.25, 0.35);
    bush.position.y = 0.2;
    g.add(bush);
    const flowerMat = mat("#c9a0ff", { emissive: "#7a40ff", emissiveIntensity: 0 });
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

  Object.assign(view, {
    scene, hemi, sun, sunBall, moonBall, stars, river, treeTops, grass, blades, herbModels,
    playerModel, playerShadow, rogueModel, rogueShadow, squirrelModel, clanmateModels: [],
  });
}

// ======================================================
// Drawing one frame
// ======================================================
function mixColors(a, b, amount) {
  return new THREE.Color(a).lerp(new THREE.Color(b), clamp(amount, 0, 1));
}

// R10: sky, sun and light follow the time of day
function updateSky() {
  const f = dayFraction();
  const light = daylight();
  const sunHeight = Math.sin((f - 0.25) * Math.PI * 2);        // 1 at noon, -1 at midnight
  const sunsetGlow = clamp(1 - Math.abs(sunHeight) / 0.3, 0, 1);

  const sky = mixColors(SKY.night, SKY.day, (light - 0.1) / 0.9).lerp(new THREE.Color(SKY.sunset), sunsetGlow * 0.65);
  view.scene.background = sky;
  view.scene.fog.color.copy(sky);

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
  view.sun.intensity = sunHeight > 0 ? 1.1 * light : 0.25;
  view.sun.color = sunHeight > 0 ? mixColors("#ffffff", "#ffa060", sunsetGlow) : new THREE.Color("#9fb4ff");
  view.hemi.intensity = 0.25 + 0.5 * light;
  view.hemi.color = mixColors("#5a6fa8", "#ffffff", light);
}

function updateTreesAndGrass(t) {
  // Leaves sway gently (spec: tree leaves wave)
  for (const top of view.treeTops) {
    const p = top.userData.phase;
    top.rotation.z = Math.sin(t * 1.3 + p) * 0.03;
    top.rotation.x = Math.sin(t * 1.1 + p * 2) * 0.02;
    for (const blob of top.children) {
      if (!blob.userData.base) continue;
      blob.position.x = blob.userData.base.x + Math.sin(t * 2 + p + blob.userData.base.z) * 0.08;
    }
  }
  // Grass: a slow wave moves across the field, plus a little flutter per blade
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const s = new THREE.Vector3();
  const pos = new THREE.Vector3();
  view.blades.forEach((b, i) => {
    const sway = Math.sin(t * 2.2 + b.x * 0.3) * 0.25 + Math.sin(t * 3.1 + b.phase) * 0.08;
    e.set(sway * 0.5, b.phase, sway);
    q.setFromEuler(e);
    pos.set(b.x, 0, b.z);
    s.set(1, b.h, 1);
    m.compose(pos, q, s);
    view.grass.setMatrixAt(i, m);
  });
  view.grass.instanceMatrix.needsUpdate = true;
}

function updateCats(t) {
  const size = catSize();
  const flicker = (timer) => timer > 0 && Math.floor(t * 20) % 2 === 0;

  // Player (lower in the river, so it looks like it is swimming)
  const swimDrop = inRiver(player.x) && !player.climbing ? 0.25 * size : 0;
  poseCat(view.playerModel, {
    x: player.x, y: player.y - swimDrop, z: player.z, heading: player.heading, size,
    moving: player.moving || (player.climbing && player.walk > 0), walk: player.walk, crouch: player.crouching,
    attack: player.attackTimer > 0, climbing: !!player.climbing,
  }, t);
  view.playerModel.visible = playing && !flicker(player.hurtTimer);
  view.playerShadow.position.set(player.x, 0.04, player.z);
  view.playerShadow.scale.setScalar(size * Math.max(0.3, 1 - player.y * 0.15));
  view.playerShadow.visible = playing && !swimDrop;

  // Rogue
  const rogueShown = playing && stage >= 2 && rogue.state !== "gone";
  poseCat(view.rogueModel, {
    x: rogue.x, y: 0, z: rogue.z, heading: rogue.heading, size: 0.95,
    moving: rogue.state === "fleeing" || (rogue.state === "fighting" && rogue.windup <= 0),
    walk: rogue.walk, crouch: rogue.windup > 0.15, attack: rogue.windup > 0 && rogue.windup <= 0.15,
  }, t);
  view.rogueModel.visible = rogueShown && !flicker(rogue.hurtTimer);
  view.rogueShadow.position.set(rogue.x, 0.04, rogue.z);
  view.rogueShadow.visible = rogueShown;

  // Squirrel
  const sq = squirrel;
  const sqMoving = sq.state === "hopping" || sq.state === "fleeing";
  view.squirrelModel.visible = playing && (stage === 0 || stage === 3) && (sq.state === "idle" || sqMoving);
  view.squirrelModel.position.set(sq.x, sqMoving ? Math.abs(Math.sin(sq.hop)) * 0.25 : 0, sq.z);
  if (sqMoving) view.squirrelModel.rotation.y = Math.atan2(sq.dirX, sq.dirZ);
  view.squirrelModel.userData.tail.rotation.x = -0.4 + Math.sin(t * 4) * 0.15;

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
                                       moving: c.moving, walk: c.walk, crouch: false, attack: false }, t);
  });

  // Herbs glow for a medicine cat; picked herbs disappear until they regrow
  herbs.forEach((h, i) => {
    const model = view.herbModels[i];
    if (!model) return;
    model.visible = h.ready;
    model.userData.flowerMat.emissiveIntensity = role === "Medicine cat" ? 0.6 + Math.sin(t * 3) * 0.3 : 0;
  });
}

function renderFrame() {
  if (!view) return;
  const t = time;
  updateSky();
  updateTreesAndGrass(t);
  updateCats(t);
  view.river.material.color = mixColors("#3f7fb8", "#5a9ad0", (Math.sin(t * 1.5) + 1) / 4);

  // R11: the camera sits low and close behind the cat
  const cam = playing ? cameraFor() : { x: -8, y: 3, z: -10, lookX: 0, lookY: 1, lookZ: 6 };
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
