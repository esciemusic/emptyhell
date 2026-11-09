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

  // Street-facing Montréal residential rhythm: narrow windows, stacked entries, and exterior stairs.
  const frontZ = z - d/2 - .025;
  const rows = Math.max(2, Math.floor(h / 3.2));
  const columns = Math.max(2, Math.floor(w / 4.2));
  const windowMat = new THREE.MeshStandardMaterial({
    color:0x24343d, roughness:.28, metalness:.12, emissive:0x0a1116, emissiveIntensity:.25
  });
  for (let row=0; row<rows; row++) {
    for (let col=0; col<columns; col++) {
      const wx = x - w/2 + 2.0 + col * ((w-4) / Math.max(1, columns-1));
      const wy = 2.0 + row * 3.0;
      if (wy < h-.8) box(1.15,1.45,.08,windowMat,wx,wy,frontZ,{castShadow:false});
    }
  }

  const doorMat = new THREE.MeshStandardMaterial({ color:0x17191c, roughness:.72 });
  const doorX = x + (w > 18 ? -w*.18 : 0);
  box(1.15,2.3,.1,doorMat,doorX,1.15,frontZ-.03,{castShadow:false});

  // Exterior steel stair and balcony language is used selectively, not on every building.
  if (h >= 11) {
    const railMat = new THREE.MeshStandardMaterial({ color:0x34383d, roughness:.72, metalness:.35 });
    const stepMat = new THREE.MeshStandardMaterial({ color:0x4a4d50, roughness:.86, metalness:.18 });
    const stairX = x + w*.18;
    const baseZ = frontZ - .9;
    for (let step=0; step<5; step++) {
      box(1.5,.16,.55,stepMat,stairX,0.18 + step*.28,baseZ - step*.42,{castShadow:true});
    }
    box(1.5,.08,.08,railMat,stairX,1.75,baseZ-2.1,{castShadow:true});
    box(.08,1.0,.08,railMat,stairX-.7,1.25,baseZ-2.1,{castShadow:true});
    box(.08,1.0,.08,railMat,stairX+.7,1.25,baseZ-2.1,{castShadow:true});

    // Shallow upper balcony: concrete/steel, recessed rather than ornamental.
    box(2.5,.12,.9,stepMat,stairX,3.45,frontZ-.55,{castShadow:true});
    box(2.5,.07,.07,railMat,stairX,4.35,frontZ-1.0,{castShadow:true});
    box(.07,.95,.07,railMat,stairX-1.2,3.9,frontZ-1.0,{castShadow:true});
    box(.07,.95,.07,railMat,stairX+1.2,3.9,frontZ-1.0,{castShadow:true});
  }

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
  // Localized first-sector reference. Street ordering follows the City map:
  // west/east: Durocher → De L'Épée → Bloomfield → Champagneur → Stuart → Wiseman.
  park: { x: 63, z: 18, w: 27, d: 30 },
  saintRoch: { z: 5 },
  ball: { z: 55 },
  ogilvy: { z: -48 },
  jarry: { z: 82 },
  westEdge: -90,
  eastEdge: 102,
  southEdge: 70,
  northEdge: -68,
  deLepee: -42,
  bloomfield: -12,
  champagneur: 18,
  wiseman: 78,
  stuart: 48,
  durocher: -72
};

// Ground plane.
box(240,.18,210,groundMat,3,-.09,4,{castShadow:false});

// Primary street skeleton. Keep the avenues separated as distinct blocks instead of a generic grid.
street(7.5,138, WORLD.durocher, 7);
street(7.5,138, WORLD.deLepee, 7);
street(7.5,138, WORLD.bloomfield, 7);
street(7.5,138, WORLD.champagneur, 7);
street(7.5,138, WORLD.stuart, 7);
street(7.5,138, WORLD.wiseman, 7);

street(7.5,190, 3, WORLD.saintRoch, Math.PI/2);
street(7.5,190, 3, WORLD.ball, Math.PI/2);
street(7.5,190, 3, WORLD.ogilvy, Math.PI/2);
street(7.5,190, 3, WORLD.jarry, Math.PI/2);

// Sidewalk bands — simple but physically readable.
for (const x of [WORLD.durocher, WORLD.deLepee, WORLD.bloomfield, WORLD.champagneur, WORLD.stuart, WORLD.wiseman]) {
  sidewalk(2.0,138,x-4.75,7);
  sidewalk(2.0,138,x+4.75,7);
}
for (const z of [WORLD.saintRoch, WORLD.ball, WORLD.ogilvy, WORLD.jarry]) {
  sidewalk(2.0,190,3,z-4.75,Math.PI/2);
  sidewalk(2.0,190,3,z+4.75,Math.PI/2);
}

// Park du Centenaire — between Wiseman and Stuart, facing Saint-Roch.
box(WORLD.park.w,.10,WORLD.park.d,snowMat,WORLD.park.x,.13,WORLD.park.z,{castShadow:false});
box(WORLD.park.w-.4,.06,.16,concreteMat,WORLD.park.x,.20,WORLD.park.z-WORLD.park.d/2,{castShadow:false});
box(.16,.06,WORLD.park.d-.4,concreteMat,WORLD.park.x-WORLD.park.w/2,.20,WORLD.park.z,{castShadow:false});
box(.16,.06,WORLD.park.d-.4,concreteMat,WORLD.park.x+WORLD.park.w/2,.20,WORLD.park.z,{castShadow:false});
box(WORLD.park.w-.8,.05,.8,darkMat,WORLD.park.x,.2,WORLD.park.z-WORLD.park.d/2+1);
box(WORLD.park.w-.8,.05,.8,darkMat,WORLD.park.x,.2,WORLD.park.z+WORLD.park.d/2-1);

// Park paths and modest winter landscaping.
street(2.2,WORLD.park.d-4,WORLD.park.x,WORLD.park.z);
street(2.2,WORLD.park.w-4,WORLD.park.x,WORLD.park.z,Math.PI/2);
for (const x of [16,23,30,37]) {
  box(.55,3.8,.55,darkMat,x,1.9,18);
  box(3.2,.9,3.2,darkMat,x,4.0,18);
}
box(3.5,1.4,1.2,darkMat,17,.7,27);
box(3.5,1.4,1.2,darkMat,35,.7,27);

// Real-world park details documented by Montréal:
// two micro-libraries and the artwork Terre en vue.
interactable(
  box(1.6,1.7,.7,brickDarkMat,18,.85,12),
  'MICRO-LIBRARY',
  'A small neighbourhood library in the park. A place for exchange, pause, and ordinary life.'
);
interactable(
  box(1.6,1.7,.7,brickDarkMat,34,.85,12),
  'MICRO-LIBRARY',
  'Another small community library. The object is simple; the fact that it is here matters.'
);
interactable(
  box(5,.08,.8,glassMat,26,1.0,14),
  'TERRE EN VUE',
  'A park artwork marker. The first slice records the place without turning it into exposition.'
);

// Residential/commercial frontage blocks.
// These follow the street corridors and keep interiors simplified.
const frontage = [
  [-57,-45,12,10,brickMat], [-27,-45,13,12,concreteMat],
  [3,-45,12,11,brickDarkMat], [33,-45,13,12,brickMat],
  [63,-45,12,10,concreteMat],
  [-57,22,13,11,concreteMat], [-27,22,12,12,brickMat],
  [3,22,13,10,brickDarkMat], [33,22,12,11,brickMat],
  [78,22,12,12,concreteMat],
  [-57,58,12,11,brickMat], [-27,58,13,12,concreteMat],
  [3,58,12,10,brickDarkMat], [33,58,13,11,brickMat],
  [63,58,12,12,concreteMat]
];
for (const [x,z,w,h,mat] of frontage) building(w,13,h,x,z,mat);

// Buildings near the park remain lower and more open so the park reads.
building(16,10,9,-57,-20,brickMat);
building(15,10,10,84,-20,concreteMat);
// Narrower Montréal residential frontage along the park-facing blocks.
// The park remains open between Stuart and Wiseman rather than being buried in the grid.
building(12,9,8,33,18,brickDarkMat);
// Keep the rail-side frontage clear; the railway remains a physical boundary.

// Alley structure documented by Montréal: Ruelle De la Fête
// is in the quadrilateral Champagneur / Ball / Bloomfield / Saint-Roch.
box(4.5,.06,34,asphaltMat,3,0,30,{castShadow:false});
for (const z of [15,30,45]) {
  box(5.3,.08,.8,snowMat,3,.08,z,{castShadow:false});
}
// Ruelle Wiseman occupies the Saint-Roch / Wiseman / d'Outremont / Ogilvy block.
box(4.5,.06,34,asphaltMat,-3,0,-22,{castShadow:false});

// The verified 1:1000 first-sector sheet (31H12-010-0530) contains no railway corridor.
// The authoritative Montréal 3D railway dataset places the nearest rail geometry outside this
// sheet, on adjacent sheets (notably 31H12-010-0531 / 0431). Do not invent a rail boundary
// inside the Parc du Centenaire first-sector slice. Railway geometry is therefore deferred
// until the adjacent-sheet corridor is explicitly brought into the playable world.

// Simplified Autoroute 40 edge: environmental pressure only until verified road geometry is imported.
const highwayZ = WORLD.northEdge;
box(236,.18,10,asphaltMat,3,.04,highwayZ,{castShadow:false});
box(236,.18,1.2,concreteMat,3,.22,highwayZ+5.2,{castShadow:false});
for (let x=-112; x<=118; x+=12) {
  box(5,.08,.12,snowMat,x,.18,highwayZ-2.1,{castShadow:false});
}
const highwayBarrier = box(236,1.1,.28,concreteMat,3,.55,highwayZ+5.4,{castShadow:false,receiveShadow:false});
addCollider(3,highwayZ+5.4,236,.28,highwayBarrier);

// Winter shoulder and reflectors reinforce the highway as a physical edge.
box(236,.14,1.4,snowMat,3,.20,highwayZ-5.5,{castShadow:false});
for (let x=-108; x<=114; x+=9) {
  box(.22,.06,.08,concreteMat,x,.18,highwayZ-3.8,{castShadow:false});
}

// Keep the camera from crossing the railway while preserving the physical appearance.
const railCameraEast = box(5,.9,140,darkMat,94,.45,1,{castShadow:false,receiveShadow:false});
const railCameraSouth = box(174,.9,5,darkMat,3,.45,70,{castShadow:false,receiveShadow:false});
collisionMeshes.push(railCameraEast,railCameraSouth);

// Western municipal boundary pressure: fence condition at the edge.
const fenceX = WORLD.westEdge;
for (let z=WORLD.northEdge+4; z<=WORLD.southEdge-2; z+=4) {
  box(.08,2.2,.08,darkMat,fenceX,1.1,z);
}
const fenceMesh = box(.08,2.2,WORLD.southEdge-WORLD.northEdge-6,darkMat,fenceX,1,(WORLD.northEdge+WORLD.southEdge)/2);
addCollider(fenceX,(WORLD.northEdge+WORLD.southEdge)/2,.08,WORLD.southEdge-WORLD.northEdge-6,fenceMesh);

// Winter surface details: compressed snow banks, tire grooves and curb accumulation.
function snowBank(x,z,w,d,h=.32) {
  const bank = box(w,h,d,snowMat,x,h/2,z,{castShadow:false});
  bank.rotation.y = (Math.random() - .5) * .08;
}
for (const x of [WORLD.durocher, WORLD.deLepee, WORLD.bloomfield, WORLD.champagneur, WORLD.stuart, WORLD.wiseman]) {
  snowBank(x-5.0, 7, .75, 136, .28);
  snowBank(x+5.0, 7, .75, 136, .28);
}
for (const z of [WORLD.saintRoch, WORLD.ball, WORLD.ogilvy]) {
  snowBank(3, z-5.0, 136, .75, .28);
  snowBank(3, z+5.0, 136, .75, .28);
}
const tireMat = new THREE.MeshStandardMaterial({ color:0x303336, roughness:1 });
for (const x of [-1.5,1.5]) box(.28,.012,136,tireMat,x,.105,4,{castShadow:false});

// Utility infrastructure: restrained poles and overhead lines make the streets read as lived-in space.
const utilityMat = new THREE.MeshStandardMaterial({ color:0x2b2d30, roughness:.82, metalness:.15 });
function utilityPole(x,z) {
  box(.18,7.5,.18,utilityMat,x,3.75,z);
  box(2.4,.12,.12,utilityMat,x,7.0,z);
  box(2.1,.035,.035,darkMat,x,7.0,z-.04,{castShadow:false});
}
for (const p of [[-52,12],[-18,12],[18,12],[54,12],[-52,58],[-18,58],[18,58],[54,58]]) utilityPole(p[0],p[1]);

// Low service/parking structures keep the frontage from reading like isolated cubes.
function lowGarage(x,z,w=6,d=5) {
  const g=box(w,2.4,d,concreteMat,x,1.2,z);
  addCollider(x,z,w,d,g);
  box(w*.72,1.7,.08,darkMat,x,1.0,z-d/2-.05,{castShadow:false});
}
lowGarage(-88,12,7,5);
lowGarage(88,12,7,5);
lowGarage(-88,62,7,5);
lowGarage(88,62,7,5);

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
// Spawn at the Saint-Roch-facing edge of the park, not inside the park geometry.
player.position.set(63,0,36);

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
  const mapX = ((player.position.x - WORLD.westEdge) / (WORLD.eastEdge - WORLD.westEdge)) * 100;
  const mapZ = ((player.position.z - WORLD.northEdge) / (WORLD.southEdge - WORLD.northEdge)) * 100;
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
