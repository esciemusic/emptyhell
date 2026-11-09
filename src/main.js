import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1016);
scene.fog = new THREE.FogExp2(0x0b1016, 0.022);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 500);
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

const hemi = new THREE.HemisphereLight(0x9db8d5, 0x20252b, 1.35);
scene.add(hemi);

const moon = new THREE.DirectionalLight(0xc5d7ef, 2.1);
moon.position.set(-30, 45, 20);
moon.castShadow = true;
moon.shadow.mapSize.set(2048, 2048);
scene.add(moon);

const warm = new THREE.PointLight(0xffc78a, 18, 16, 2);
warm.position.set(7, 3.2, -5);
scene.add(warm);

const groundMat = new THREE.MeshStandardMaterial({ color:0x4a4a48, roughness:.92, metalness:.02 });
const snowMat = new THREE.MeshStandardMaterial({ color:0xc7c9c6, roughness:1 });
const brickMat = new THREE.MeshStandardMaterial({ color:0x654f4b, roughness:.9 });
const concreteMat = new THREE.MeshStandardMaterial({ color:0x626467, roughness:.94 });
const darkMat = new THREE.MeshStandardMaterial({ color:0x1c2024, roughness:.82 });

function box(w,h,d,mat,x,y,z) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
  m.position.set(x,y,z);
  m.castShadow = true;
  m.receiveShadow = true;
  scene.add(m);
  return m;
}

// Prototype sector: deliberately small and readable.
// Geometry is a visual/technical stand-in until verified Montréal map data is integrated.
box(90,.18,90,groundMat,0,-.09,0);
box(22,.06,90,snowMat,-22,.01,0);
box(8,.08,90,darkMat,0,.02,0);
box(22,.06,90,snowMat,22,.01,0);

// Residential massing.
for (let z=-36; z<=36; z+=12) {
  box(15,10,9,brickMat,-34,5,z);
  box(15,8,9,concreteMat,34,4,z+2);
}

// Alley / side-space.
box(10,5,3,concreteMat,9,2.5,-26);
box(3,5,28,concreteMat,14,2.5,-15);

// Railway pressure boundary.
box(4,1.2,82,darkMat,26,.6,0);
for (let z=-40; z<=40; z+=4) {
  box(1.6,.25,.22,snowMat,26,.78,z);
}

// Fence boundary.
for (let z=-40; z<=40; z+=4) {
  box(.08,2.2,.08,darkMat,-26,1.1,z);
}
box(.08,2.2,82,darkMat,-26,1.1,0);

// A small park anchor.
box(18,.08,18,snowMat,0,.04,28);
for (let x=-6; x<=6; x+=6) {
  box(.8,4,.8,darkMat,x,2,28);
  box(4,1.2,4,darkMat,x,4,28);
}

// Simple streetlights.
for (const z of [-28,-12,4,20]) {
  const pole = box(.16,5,.16,darkMat,-6,2.5,z);
  const lamp = new THREE.PointLight(0xffd7a3, 10, 10, 2);
  lamp.position.set(-6,5,z);
  scene.add(lamp);
}

// Player placeholder: restrained silhouette, intentionally temporary.
const player = new THREE.Group();
const body = new THREE.Mesh(
  new THREE.CapsuleGeometry(.38, .9, 5, 10),
  new THREE.MeshStandardMaterial({ color:0x16181c, roughness:.8 })
);
body.position.y = .9;
body.castShadow = true;
player.add(body);
scene.add(player);
player.position.set(0,0,14);

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
  player.position.addScaledVector(forward, velocity.z * dt);
  player.position.addScaledVector(right, velocity.x * dt);

  player.position.x = THREE.MathUtils.clamp(player.position.x, -24.5, 24.5);
  player.position.z = THREE.MathUtils.clamp(player.position.z, -42, 42);

  const target = new THREE.Vector3(player.position.x, player.position.y + 1.25, player.position.z);
  const cameraDistance = 5.2;
  const horizontal = Math.cos(pitch) * cameraDistance;
  const desired = new THREE.Vector3(
    target.x - Math.sin(yaw) * horizontal,
    target.y + Math.sin(pitch) * cameraDistance,
    target.z - Math.cos(yaw) * horizontal
  );
  camera.position.lerp(desired, 1 - Math.pow(.0001, dt));
  camera.lookAt(target);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .05);
  move(dt);
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

setTimeout(() => document.querySelector('#loading').classList.add('hidden'), 900);
animate();
