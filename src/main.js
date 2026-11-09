import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1016);
scene.fog = new THREE.FogExp2(0x0b1016, 0.0065);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
camera.position.set(0, 2.0, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.querySelector('#game').appendChild(renderer.domElement);

const hemi = new THREE.HemisphereLight(0x9db8d5, 0x20252b, 1.25);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0xc5d7ef, 2.0);
moon.position.set(-80, 95, 60);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
moon.shadow.camera.left = -180;
moon.shadow.camera.right = 180;
moon.shadow.camera.top = 180;
moon.shadow.camera.bottom = -180;
scene.add(moon);

const warm = new THREE.PointLight(0xffc78a, 18, 18, 2);
warm.position.set(12, 4, -8);
scene.add(warm);

const groundMat = new THREE.MeshStandardMaterial({ color:0x4a4a48, roughness:.92, metalness:.02 });
const asphaltMat = new THREE.MeshStandardMaterial({ color:0x25282b, roughness:.94, metalness:.01 });
const sidewalkMat = new THREE.MeshStandardMaterial({ color:0x777876, roughness:.96 });
const snowMat = new THREE.MeshStandardMaterial({ color:0xc7c9c6, roughness:1 });
const brickMat = new THREE.MeshStandardMaterial({ color:0x654f4b, roughness:.9 });
const brickDarkMat = new THREE.MeshStandardMaterial({ color:0x4c4140, roughness:.94 });
const concreteMat = new THREE.MeshStandardMaterial({ color:0x626467, roughness:.94 });
const darkMat = new THREE.MeshStandardMaterial({ color:0x1c2024, roughness:.82 });
const glassMat = new THREE.MeshStandardMaterial({ color:0x29353e, roughness:.35, metalness:.18 });

function box(w,h,d,mat,x,y,z,opts={}) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);
  m.castShadow = opts.castShadow ?? true;
  m.receiveShadow = opts.receiveShadow ?? true;
  scene.add(m);
  return m;
}

function interactable(mesh, title, text) {
  mesh.userData.interaction = { title, text };
  interactables.push(mesh);
  return mesh;
}

function street(width, length, x, z, rotation=0) {
  const road = box(width, .05, length, asphaltMat, x, .02, z, { castShadow:false });
  road.rotation.y = rotation;
  return road;
}

function sidewalk(width, length, x, z, rotation=0) {
  const s = box(width, .12, length, sidewalkMat, x, .08, z, { castShadow:false });
  s.rotation.y = rotation;
  return s;
}

const colliders = [];
const collisionMeshes = [];
const interactables = [];

function addCollider(x, z, w, d, mesh=null) {
  colliders.push({ minX:x-w/2, maxX:x+w/2, minZ:z-d/2, maxZ:z+d/2 });
  if (mesh) collisionMeshes.push(mesh);
}

function building(w,d,h,x,z,mat=brickMat) {
  const b = box(w,h,d,mat,x,h/2,z);
  const roof = box(w+.12,.12,d+.12,darkMat,x,h+.06,z);
  roof.castShadow = true;
  addCollider(x,z,w,d,b);
  return b;
}

function lamp(x,z) {
  const pole = box(.16,5,.16,darkMat,x,2.5,z);
  const light = new THREE.PointLight(0xffd7a3, 10, 11, 2);
  light.position.set(x,5,z);
  scene.add(light);
  return pole;
}

/*
  GEOGRAPHIC BLOCKOUT — v1
  Anchor: Parc du Centenaire-de-Parc-Extension.
  The layout follows verified street/park relationships from Montréal sources.
  It is intentionally simplified; it is not cadastral geometry.
*/

// World reference: 1 unit ≈ 1 metre.
// Parc du Centenaire is officially located facing rue Saint-Roch,
// between avenues Wiseman and Stuart.
const WORLD = {
  park: { x: 0, z: -18, w: 34, d: 38 },
  saintRoch: { z: 5 },
  ball: { z: 54 },
  ogilvy: { z: -58 },
  jarry: { z: 103 },
  westEdge: -112,
  eastEdge: 118,
  southEdge: 92,
  northEdge: -88,
  // Approximate frontage positions for the first slice.
  deLepee: -70,
  bloomfield: -28,
  champagneur: 23,
  wiseman: -3,
  stuart: 38,
  durocher: -57
};

// Ground plane.
box(240,.18,210,groundMat,3,-.09,4,{castShadow:false});

// Primary street skeleton.
street(8,230, WORLD.durocher, 7);
street(8,230, WORLD.deLepee, 7);
street(8,230, WORLD.bloomfield, 7);
street(8,230, WORLD.champagneur, 7);

street(8,250, 3, WORLD.saintRoch, Math.PI/2);
street(8,250, 3, WORLD.ball, Math.PI/2);
street(8,250, 3, WORLD.ogilvy, Math.PI/2);
street(8,250, 3, WORLD.jarry, Math.PI/2);

// Sidewalk bands — simple but physically readable.
for (const x of [WORLD.durocher, WORLD.deLepee, WORLD.bloomfield, WORLD.champagneur]) {
  sidewalk(2.4,230,x-5.4,7);
  sidewalk(2.4,230,x+5.4,7);
}
for (const z of [WORLD.saintRoch, WORLD.ball, WORLD.ogilvy, WORLD.jarry]) {
  sidewalk(2.4,250,3,z-5.4,Math.PI/2);
  sidewalk(2.4,250,3,z+5.4,Math.PI/2);
}

// Park du Centenaire — between Wiseman and Stuart, facing Saint-Roch.
box(WORLD.park.w,.10,WORLD.park.d,snowMat,WORLD.park.x,.13,WORLD.park.z,{castShadow:false});
box(WORLD.park.w-.8,.05,.8,darkMat,WORLD.park.x,.2,WORLD.park.z-WORLD.park.d/2+1);
box(WORLD.park.w-.8,.05,.8,darkMat,WORLD.park.x,.2,WORLD.park.z+WORLD.park.d/2-1);

// Park paths and modest winter landscaping.
street(2.5,30,0,-18);
street(2.5,30,0,-18,Math.PI/2);
for (const x of [-12,-4,4,12]) {
  box(.55,3.8,.55,darkMat,x,1.9,-18);
  box(3.2,.9,3.2,darkMat,x,4.0,-18);
}
box(3.5,1.4,1.2,darkMat,-9,.7,-7);
box(3.5,1.4,1.2,darkMat,9,.7,-7);

// Real-world park details documented by Montréal:
// two micro-libraries and the artwork Terre en vue.
interactable(
  box(1.6,1.7,.7,brickDarkMat,-8,.85,-5),
  'MICRO-LIBRARY',
  'A small neighbourhood library in the park. A place for exchange, pause, and ordinary life.'
);
interactable(
  box(1.6,1.7,.7,brickDarkMat,8,.85,-5),
  'MICRO-LIBRARY',
  'Another small community library. The object is simple; the fact that it is here matters.'
);
interactable(
  box(5,.08,.8,glassMat,0,1.0,-4),
  'TERRE EN VUE',
  'A park artwork marker. The first slice records the place without turning it into exposition.'
);

// Residential/commercial frontage blocks.
// These follow the street corridors and keep interiors simplified.
const frontage = [
  [-96, -48, 18, 11, brickMat], [-72,-48,18,13,concreteMat],
  [-42,-48,20,12,brickDarkMat], [-5,-48,18,14,brickMat],
  [42,-48,20,11,concreteMat], [74,-48,18,13,brickMat],
  [-96,20,18,12,concreteMat], [-73,20,20,14,brickMat],
  [-43,20,18,11,brickDarkMat], [49,20,20,13,brickMat],
  [76,20,18,12,concreteMat],
  [-94,69,20,12,brickMat], [-67,69,18,14,concreteMat],
  [-36,69,20,11,brickDarkMat], [5,69,18,13,brickMat],
  [47,69,20,12,concreteMat], [78,69,18,14,brickMat]
];
for (const [x,z,w,h,mat] of frontage) building(w,13,h,x,z,mat);

// Buildings near the park remain lower and more open so the park reads.
building(18,11,9,-38,-20,brickMat);
building(17,11,10,45,-20,concreteMat);

// Alley structure documented by Montréal: Ruelle De la Fête
// is in the quadrilateral Champagneur / Ball / Bloomfield / Saint-Roch.
box(5,.06,48,asphaltMat,0,0,29,{castShadow:false});
for (const z of [12,30,48]) {
  box(5.8,.08,.8,snowMat,0,.08,z,{castShadow:false});
}

// Rail pressure boundaries: the neighbourhood is physically enclosed by rail infrastructure
// on its eastern and southern edges. This slice renders pressure, not an arbitrary invisible wall.
const railX = 112;
const railXMesh = box(5,1.4,205,darkMat,railX,.7,4);
addCollider(railX,4,5,205,railXMesh);
for (let z=-95; z<=103; z+=4) {
  box(1.8,.22,.24,snowMat,railX,.82,z);
}
const railZ = 91;
const railZMesh = box(225,1.4,5,darkMat,3,.7,railZ);
addCollider(3,railZ,225,5,railZMesh);
for (let x=-108; x<=114; x+=4) {
  box(.24,.22,1.8,snowMat,x,.82,railZ);
}

// Western municipal boundary pressure: fence condition at the edge.
const fenceX = -112;
for (let z=-92; z<=94; z+=4) {
  box(.08,2.2,.08,darkMat,fenceX,1.1,z);
}
const fenceMesh = box(.08,2.2,186,darkMat,fenceX,1.1,1);
addCollider(fenceX,1,.08,186,fenceMesh);

// Streetlights around the first playable area.
for (const p of [
  [-44,-4],[-8,-4],[30,-4],[-44,40],[-8,40],[30,40],
  [-44,82],[-8,82],[30,82]
]) lamp(p[0],p[1]);

// Player placeholder — temporary until the first character asset.
const keys = new Set();

addEventListener('keydown', event => {
  keys.add(event.code);
  if (event.code === 'Escape') {
    togglePause(!pauseOpen);
    return;
  }
  if (event.code === 'KeyM' && !pauseOpen) {
    togglePause(true);
  }
});

addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => keys.clear());

const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(.38, .9, 5, 10),
  new THREE.MeshStandardMaterial({ color:0x16181c, roughness:.8 })
);
body.position.y = .9;
body.castShadow = true;
player.add(body);
scene.add(player);

// Spawn near the Saint-Roch / Stuart / park area.
player.position.set(28,0,18);

const playerRadius = 0.48;
const testPosition = new THREE.Vector3();

function collidesAt(x, z) {
  for (const c of colliders) {
    const closestX = THREE.MathUtils.clamp(x, c.minX, c.maxX);
    const closestZ = THREE.MathUtils.clamp(z, c.minZ, c.maxZ);
    const dx = x - closestX;
    const dz = z - closestZ;
    if (dx * dx + dz * dz < playerRadius * playerRadius) return true;
  }
  return false;
}

function tryMove(dx, dz) {
  testPosition.set(player.position.x + dx, player.position.y, player.position.z);
  if (!collidesAt(testPosition.x, testPosition.z)) player.position.x = testPosition.x;
  testPosition.set(player.position.x, player.position.y, player.position.z + dz);
  if (!collidesAt(testPosition.x, testPosition.z)) player.position.z = testPosition.z;
}

let yaw = 0;
let pitch = 0.16;
let locked = false;
const pause = document.querySelector('#pause');
const resume = document.querySelector('#resume');
let pauseOpen = false;

function togglePause(open) {
  pauseOpen = open;
  pause.classList.toggle('hidden', !open);
  if (open && document.pointerLockElement) document.exitPointerLock();
}

function lockGame() {
  if (!pauseOpen) renderer.domElement.requestPointerLock();
}

renderer.domElement.addEventListener('click', lockGame);
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
  if (!locked && !pauseOpen) togglePause(true);
});
document.addEventListener('mousemove', e => {
  if (!locked || pauseOpen) return;
  yaw -= e.movementX * 0.0025;
  pitch -= e.movementY * 0.0018;
  pitch = THREE.MathUtils.clamp(pitch, -0.05, 0.65);
});

resume.addEventListener('click', () => {
  pauseOpen = false;
  pause.classList.add('hidden');
  lockGame();
});

const interactionPrompt = document.querySelector('#interaction-prompt');
const interactionPanel = document.querySelector('#interaction-panel');
const interactionTitle = document.querySelector('#interaction-title');
const interactionText = document.querySelector('#interaction-text');
const interactionClose = document.querySelector('#interaction-close');
const mapOverlay = document.querySelector('#map-overlay');
const mapPlayer = document.querySelector('#map-player');
let activeInteraction = null;
let mapOpen = false;

function nearestInteraction() {
  if (!locked || pauseOpen || mapOpen) return null;
  const ray = new THREE.Raycaster();
  ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  const hits = ray.intersectObjects(interactables, false);
  if (!hits.length) return null;
  const hit = hits[0];
  if (hit.distance > 5.5) return null;
  return hit.object;
}

function updateInteraction() {
  const target = nearestInteraction();
  activeInteraction = target;
  interactionPrompt.classList.toggle('hidden', !target);
  if (target) {
    interactionPrompt.textContent = 'E  ' + target.userData.interaction.title;
  }
}

function openInteraction(target) {
  if (!target) return;
  const data = target.userData.interaction;
  interactionTitle.textContent = data.title;
  interactionText.textContent = data.text;
  interactionPanel.classList.remove('hidden');
  if (document.pointerLockElement) document.exitPointerLock();
}

function toggleMap(open) {
  mapOpen = open;
  mapOverlay.classList.toggle('hidden', !open);
  if (open && document.pointerLockElement) document.exitPointerLock();
  if (!open && !pauseOpen) lockGame();
}

interactionClose.addEventListener('click', () => {
  interactionPanel.classList.add('hidden');
  if (!pauseOpen && !mapOpen) lockGame();
});

addEventListener('keydown', event => {
  if (event.code === 'KeyE' && activeInteraction && !interactionPanel.classList.contains('hidden')) return;
  if (event.code === 'KeyE' && activeInteraction && !pauseOpen && !mapOpen) openInteraction(activeInteraction);
  if (event.code === 'KeyM' && !pauseOpen && interactionPanel.classList.contains('hidden')) {
    event.preventDefault();
    toggleMap(!mapOpen);
  }
});

mapOverlay.addEventListener('click', event => {
  if (event.target === mapOverlay) toggleMap(false);
});

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();

function move(dt) {
  if (!locked || pauseOpen) return;

  direction.set(0,0,0);
  if (keys.has('KeyW')) direction.z -= 1;
  if (keys.has('KeyS')) direction.z += 1;
  if (keys.has('KeyA')) direction.x -= 1;
  if (keys.has('KeyD')) direction.x += 1;
  if (direction.lengthSq()) direction.normalize();

  const speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 7 : 3.2;
  velocity.x = THREE.MathUtils.damp(velocity.x, direction.x * speed, 8, dt);
  velocity.z = THREE.MathUtils.damp(velocity.z, direction.z * speed, 8, dt);

  const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
  const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));
  const delta = new THREE.Vector3();
  delta.addScaledVector(forward, velocity.z * dt);
  delta.addScaledVector(right, velocity.x * dt);
  tryMove(delta.x, delta.z);

  player.position.x = THREE.MathUtils.clamp(player.position.x, -106, 106);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -82, 82);

  const target = new THREE.Vector3(player.position.x, player.position.y + 1.25, player.position.z);
  const cameraDistance = 5.2;
  const horizontal = Math.cos(pitch) * cameraDistance;
  const desired = new THREE.Vector3(
    target.x - Math.sin(yaw) * horizontal,
    target.y + Math.sin(pitch) * cameraDistance,
    target.z - Math.cos(yaw) * horizontal
  );
  const cameraRay = desired.clone().sub(target);
  const cameraLength = cameraRay.length();
  cameraRay.normalize();
  const raycaster = new THREE.Raycaster(target, cameraRay, 0.35, cameraLength);
  const hits = raycaster.intersectObjects(collisionMeshes, false);
  const safeDistance = hits.length ? Math.max(0.8, hits[0].distance - 0.18) : cameraLength;
  const cameraTarget = target.clone().addScaledVector(cameraRay, safeDistance);

  camera.position.lerp(cameraTarget, 1 - Math.pow(.0001, dt));
  camera.lookAt(target);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  move(dt);
  updateInteraction();
  const mapX = ((player.position.x + 112) / 224) * 100;
  const mapZ = ((player.position.z + 88) / 180) * 100;
  mapPlayer.style.left = mapX + '%';
  mapPlayer.style.top = mapZ + '%';
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

setTimeout(() => document.querySelector('#loading').classList.add('hidden'), 900);
animate();
