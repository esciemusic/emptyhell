import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1016);
scene.fog = new THREE.FogExp2(0x0b1016, 0.0065);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 900);
camera.position.set(0, 2.0, 8);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
const mobileViewport = window.matchMedia('(max-width: 800px), (pointer: coarse)').matches;
renderer.setPixelRatio(Math.min(devicePixelRatio, mobileViewport ? 1.35 : 1.8));
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
moon.shadow.mapSize.set(mobileViewport ? 1024 : 1536, mobileViewport ? 1024 : 1536);
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
const windowDarkMat = new THREE.MeshStandardMaterial({ color:0x172027, roughness:.32, metalness:.08, emissive:0x071016, emissiveIntensity:.18 });
const windowWarmMat = new THREE.MeshStandardMaterial({ color:0x8a765d, roughness:.28, metalness:.04, emissive:0xffb56a, emissiveIntensity:.55 });

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
const polygonColliders = [];
const collisionMeshes = [];
const playerRadius = 0.48;
const interactables = [];
const streetLights = [];
const livingWindows = [];

function addCollider(x, z, w, d, mesh=null) {
  colliders.push({ minX:x-w/2, maxX:x+w/2, minZ:z-d/2, maxZ:z+d/2 });
  if (mesh) collisionMeshes.push(mesh);
}

function addPolygonCollider(points, mesh=null) {
  const clean = points.filter((p,i) => i === 0 || p[0] !== points[i-1][0] || p[1] !== points[i-1][1]);
  const xs = clean.map(p => p[0]), zs = clean.map(p => p[1]);
  polygonColliders.push({
    points: clean,
    minX: Math.min(...xs) - playerRadius,
    maxX: Math.max(...xs) + playerRadius,
    minZ: Math.min(...zs) - playerRadius,
    maxZ: Math.max(...zs) + playerRadius
  });
  if (mesh) collisionMeshes.push(mesh);
}

function pointInPolygon(x, z, points) {
  let inside = false;
  for (let i=0, j=points.length-1; i<points.length; j=i++) {
    const [xi,zi]=points[i], [xj,zj]=points[j];
    const intersects = ((zi > z) !== (zj > z)) &&
      (x < (xj-xi) * (z-zi) / ((zj-zi) || Number.EPSILON) + xi);
    if (intersects) inside = !inside;
  }
  return inside;
}

function pointSegmentDistanceSq(px,pz,ax,az,bx,bz) {
  const vx=bx-ax, vz=bz-az;
  const wx=px-ax, wz=pz-az;
  const lenSq=vx*vx+vz*vz;
  const t=lenSq ? THREE.MathUtils.clamp((wx*vx+wz*vz)/lenSq,0,1) : 0;
  const dx=px-(ax+t*vx), dz=pz-(az+t*vz);
  return dx*dx+dz*dz;
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
  const windowMat = windowDarkMat;
  for (let row=0; row<rows; row++) {
    for (let col=0; col<columns; col++) {
      const wx = x - w/2 + 2.0 + col * ((w-4) / Math.max(1, columns-1));
      const wy = 2.0 + row * 3.0;
      if (wy < h-.8) {
        const lit = ((row * 17 + col * 31 + Math.round(x * 3)) % 9) === 0;
        (() => {
          const window = box(1.15,1.45,.08,lit ? windowWarmMat : windowMat,wx,wy,frontZ,{castShadow:false});
          livingWindows.push(window);
        })();
      }
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
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(.12,8,6), new THREE.MeshBasicMaterial({ color:0xffd7a3 }));
  bulb.position.set(x,4.93,z);
  bulb.castShadow = false;
  scene.add(bulb);
  streetLights.push({ light, bulb, base:10, seed:x * 7.13 + z * 3.71, restored:powerRestored });
  return pole;
}

/*
  VERIFIED GEOGRAPHIC FIRST-SECTOR REBUILD
  Source: Ville de Montréal road centerlines + Parc du Centenaire polygon.
  Local origin: official Parc du Centenaire anchor.
  Coordinates: x=east, z=-north, metres.
  Railway geometry is loaded separately from the verified municipal railway layer.
  The 1:1000 building sheet remains a building/parcel source only.
*/

function footprintBuilding(points, h, mat=brickMat) {
  if (!points || points.length < 4) return;
  const shape = new THREE.Shape();
  points.forEach(([x,z], i) => {
    const sy = -z;
    if (i === 0) shape.moveTo(x, sy);
    else shape.lineTo(x, sy);
  });
  const geom = new THREE.ExtrudeGeometry(shape, { depth:h, bevelEnabled:false, curveSegments:1 });
  geom.computeVertexNormals();
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.castShadow = !mobileViewport;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const roof = new THREE.Mesh(new THREE.ShapeGeometry(shape), darkMat);
  roof.rotation.x = -Math.PI / 2;
  roof.position.y = h + .04;
  roof.receiveShadow = !mobileViewport;
  scene.add(roof);

  const xs = points.map(p => p[0]), zs = points.map(p => p[1]);
  const minX=Math.min(...xs), maxX=Math.max(...xs), minZ=Math.min(...zs), maxZ=Math.max(...zs);
  const w=maxX-minX, d=maxZ-minZ;
  addPolygonCollider(points, mesh);

  // Restrained Montréal residential facade language: windows, entries, and roof hardware.
  const rows=Math.max(2,Math.floor(h/3.2));
  const cols=Math.max(2,Math.min(6,Math.floor(w/4.5)));
  for(let row=0;row<rows;row++){
    const y=2.0+row*3.0;
    if(y>h-1.2) continue;
    for(let col=0;col<cols;col++){
      const x=minX+(col+1)*w/(cols+1);
      const win=box(1.15,.9,.06,glassMat,x,y,minZ-.035,{castShadow:false});
      win.receiveShadow=false;
      const back=box(1.15,.9,.06,((row * 19 + col * 23 + Math.round(x * 2)) % 11 === 0) ? windowWarmMat : glassMat,x,y,maxZ+.035,{castShadow:false});
      back.receiveShadow=false;
    }
  }
  const sideRows=Math.max(1,Math.floor(d/7));
  for(let row=0;row<sideRows;row++){
    const y=2.2+row*3.0;
    if(y>h-1.0) continue;
    const z=minZ+(row+1)*d/(sideRows+1);
    const left=box(.06,.9,1.15,((row * 11 + Math.round(z * 2)) % 10 === 0) ? windowWarmMat : glassMat,minX-.035,y,z,{castShadow:false});
    left.receiveShadow=false;
    const right=box(.06,.9,1.15,((row * 13 + Math.round(z * 2)) % 10 === 0) ? windowWarmMat : glassMat,maxX+.035,y,z,{castShadow:false});
    right.receiveShadow=false;
  }
  const door=box(1.15,2.2,.08,darkMat,(minX+maxX)/2,1.1,minZ-.06,{castShadow:false});
  door.receiveShadow=false;
  const chimney=box(.7,.9,.7,darkMat,maxX-w*.18,h+.45,minZ+d*.18,{castShadow:true});
  return mesh;
}

let worldReady = false;

const WORLD = {
  // Verified first-sector envelope from the authoritative road centerlines.
  // Padding keeps the map/world edge from clipping the outermost verified segments.
  minX: -300, maxX: 500, minZ: -420, maxZ: 220,
  parkAnchor: { x: 0, z: 0 }
};

const VERIFIED_ROADS = [["Avenue Stuart",[400.78,189.879],[267.603,134.144]],["Avenue Stuart",[267.603,134.144],[261.014,131.355]],["Avenue Stuart",[261.014,131.355],[254.364,128.653]],["Avenue Stuart",[254.364,128.653],[41.008,40.381]],["Avenue Stuart",[41.008,40.381],[-29.568,11.112]],["Avenue Stuart",[-29.568,11.112],[-35.844,8.686]],["Avenue Stuart",[-35.844,8.686],[-42.097,6.231]],["Avenue Stuart",[-42.097,6.231],[-114.37,-23.545]],["Avenue Stuart",[-114.37,-23.545],[-273.133,-89.388]],["Avenue Wiseman",[425.731,131.604],[292.166,76.438]],["Avenue Wiseman",[292.166,76.438],[285.013,73.476]],["Avenue Wiseman",[285.013,73.476],[277.971,70.618]],["Avenue Wiseman",[277.971,70.618],[-12.164,-48.49]],["Avenue Wiseman",[-12.164,-48.49],[-18.185,-51.004]],["Avenue Wiseman",[-18.185,-51.004],[-255.53,-148.543]],["Rue Saint-Roch",[113.879,-350.873],[91.616,-296.848]],["Rue Saint-Roch",[91.616,-296.848],[89.296,-291.588]],["Rue Saint-Roch",[89.296,-291.588],[87.03,-286.417]],["Rue Saint-Roch",[87.03,-286.417],[66.352,-236.772]],["Rue Saint-Roch",[66.352,-236.772],[63.735,-230.739]],["Rue Saint-Roch",[63.735,-230.739],[61.584,-225.821]],["Rue Saint-Roch",[61.584,-225.821],[40.914,-176.336]],["Rue Saint-Roch",[40.914,-176.336],[38.727,-170.848]],["Rue Saint-Roch",[38.727,-170.848],[36.518,-165.235]],["Rue Saint-Roch",[36.518,-165.235],[16.087,-116.22]],["Rue Saint-Roch",[16.087,-116.22],[13.702,-110.369]],["Rue Saint-Roch",[13.702,-110.369],[11.393,-104.719]],["Rue Saint-Roch",[11.393,-104.719],[-10.069,-53.394]],["Rue Saint-Roch",[-10.069,-53.394],[-12.164,-48.49]],["Rue Saint-Roch",[-12.164,-48.49],[-14.3,-43.403]],["Rue Saint-Roch",[-14.3,-43.403],[-33.634,2.941]],["Rue Saint-Roch",[-33.634,2.941],[-35.844,8.686]],["Rue Saint-Roch",[-35.844,8.686],[-38.295,14.822]],["Rue Saint-Roch",[-38.295,14.822],[-54.643,53.536]],["Rue Saint-Roch",[-54.643,53.536],[-57.02,59.352]],["Rue Saint-Roch",[-57.02,59.352],[-59.295,65.027]],["Rue Saint-Roch",[-59.295,65.027],[-81.022,117.117]],["Rue Saint-Roch",[-85.311,127.52],[-81.022,117.117]],["Avenue Champagneur",[475.081,11.032],[342.266,-44.163]],["Avenue Champagneur",[342.266,-44.163],[335.384,-47.068]],["Avenue Champagneur",[335.384,-47.068],[328.822,-49.954]],["Avenue Champagneur",[328.822,-49.954],[45.211,-168.005]],["Avenue Champagneur",[45.211,-168.005],[38.727,-170.848]],["Avenue Champagneur",[38.727,-170.848],[7.78,-183.527]],["Avenue Champagneur",[7.78,-183.527],[-203.824,-271.987]],["Avenue Bloomfield",[360.513,-107.152],[353.632,-109.82]],["Avenue Bloomfield",[353.632,-109.82],[70.558,-227.791]],["Avenue Bloomfield",[70.558,-227.791],[63.735,-230.739]],["Avenue Bloomfield",[63.735,-230.739],[57.287,-233.572]],["Avenue Bloomfield",[57.287,-233.572],[40.51,-240.872]],["Avenue Bloomfield",[40.51,-240.872],[-144.13,-317.832]],["Avenue Bloomfield",[-144.13,-317.832],[-178.624,-332.423]],["Avenue Bloomfield",[396.508,-92.461],[367.572,-104.429]],["Avenue Bloomfield",[367.572,-104.429],[360.513,-107.152]],["Avenue De L'Épée",[385.778,-167.647],[378.74,-170.346]],["Avenue De L'Épée",[378.74,-170.346],[95.708,-288.967]],["Avenue De L'Épée",[95.708,-288.967],[89.296,-291.588]],["Avenue De L'Épée",[89.296,-291.588],[82.213,-294.468]],["Avenue De L'Épée",[82.213,-294.468],[-153.669,-393.144]],["Avenue Ogilvy",[383.797,-162.785],[363.036,-112.92]],["Avenue Ogilvy",[363.036,-112.92],[360.513,-107.152]],["Avenue Ogilvy",[360.513,-107.152],[358.004,-101.409]],["Avenue Ogilvy",[358.004,-101.409],[337.829,-52.774]],["Avenue Ogilvy",[337.829,-52.774],[335.384,-47.068]],["Avenue Ogilvy",[335.384,-47.068],[333.028,-41.323]],["Avenue Ogilvy",[333.028,-41.323],[313.092,6.841]],["Avenue Ogilvy",[313.092,6.841],[310.518,13.067]],["Avenue Ogilvy",[310.518,13.067],[307.97,19.213]],["Avenue Ogilvy",[307.97,19.213],[287.374,67.797]],["Avenue Ogilvy",[287.374,67.797],[285.013,73.476]],["Avenue Ogilvy",[285.013,73.476],[282.705,79.188]],["Avenue Ogilvy",[282.705,79.188],[263.272,125.933]],["Avenue Ogilvy",[263.272,125.933],[261.014,131.355]],["Avenue Ogilvy",[261.014,131.355],[258.562,137.404]],["Avenue Ogilvy",[258.562,137.404],[242.09,176.628]],["Avenue Ogilvy",[242.09,176.628],[239.735,182.071]]];
const PARK_POLYGON = [[14.119,-15.454],[-11.819,-26.105],[-13.536,-26.778],[-25.077,0.621],[-25.19,0.916],[-25.279,1.22],[-25.342,1.53],[-25.378,1.844],[-25.389,2.16],[-25.373,2.476],[-25.33,2.79],[-25.261,3.098],[-25.167,3.4],[-25.048,3.693],[-24.905,3.975],[-24.738,4.244],[-24.55,4.499],[-24.341,4.736],[-24.113,4.955],[-23.867,5.155],[-23.606,5.333],[-23.33,5.489],[-23.043,5.621],[1.194,15.56],[10.291,-6.271],[10.552,-6.898],[11.484,-9.132],[14.119,-15.454]];
/*
  DETERMINISTIC WINTER WEATHER
  Snow is a 3D world effect, not a map/UI layer. The seed is fixed so browser
  QA renders remain reproducible while the fall/wind motion stays continuous.
*/
const snowCount = 1400;
const snowPositions = new Float32Array(snowCount * 3);
const snowVelocity = new Float32Array(snowCount);
const snowDrift = new Float32Array(snowCount);
function seededUnit(i) {
  const v = Math.sin((i + 1) * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
}
for (let i=0;i<snowCount;i++) {
  snowPositions[i*3] = WORLD.minX + seededUnit(i*3) * (WORLD.maxX-WORLD.minX);
  snowPositions[i*3+1] = 1.5 + seededUnit(i*3+1) * 38;
  snowPositions[i*3+2] = WORLD.minZ + seededUnit(i*3+2) * (WORLD.maxZ-WORLD.minZ);
  snowVelocity[i] = 1.6 + seededUnit(i+1000) * 2.2;
  snowDrift[i] = (seededUnit(i+2000) - .5) * .65;
}
const snowGeometry = new THREE.BufferGeometry();
snowGeometry.setAttribute('position', new THREE.BufferAttribute(snowPositions, 3));
const snowMaterial = new THREE.PointsMaterial({
  color:0xe4e7e6,
  size:.075,
  transparent:true,
  opacity:.72,
  depthWrite:false,
  sizeAttenuation:true
});
const snowField = new THREE.Points(snowGeometry, snowMaterial);
snowField.frustumCulled = false;
scene.add(snowField);

function updateSnow(dt) {
  const positions = snowGeometry.attributes.position.array;
  for (let i=0;i<snowCount;i++) {
    const p=i*3;
    positions[p+1] -= snowVelocity[i] * dt;
    positions[p] += snowDrift[i] * dt;
    positions[p+2] += .12 * dt;
    if (positions[p+1] < .15) {
      positions[p] = WORLD.minX + seededUnit(i*3 + Math.floor(clock.elapsedTime)) * (WORLD.maxX-WORLD.minX);
      positions[p+1] = 32 + seededUnit(i*5 + 17) * 8;
      positions[p+2] = WORLD.minZ + seededUnit(i*7 + 31) * (WORLD.maxZ-WORLD.minZ);
    }
    if (positions[p] > WORLD.maxX + 4) positions[p] = WORLD.minX;
    if (positions[p] < WORLD.minX - 4) positions[p] = WORLD.maxX;
    if (positions[p+2] > WORLD.maxZ + 4) positions[p+2] = WORLD.minZ;
  }
  snowGeometry.attributes.position.needsUpdate = true;
}



function verifiedRoadSegment(a, b, width=8.2) {
  const dx=b[0]-a[0], dz=b[1]-a[1];
  const length=Math.hypot(dx,dz);
  if (length < 1) return;
  const x=(a[0]+b[0])/2, z=(a[1]+b[1])/2;
  const rotation=Math.atan2(dx,dz);
  street(width,length,x,z,rotation);
  sidewalk(1.7,length,x + Math.cos(rotation)*5.0,z - Math.sin(rotation)*5.0,rotation);
  sidewalk(1.7,length,x - Math.cos(rotation)*5.0,z + Math.sin(rotation)*5.0,rotation);
}

for (const road of VERIFIED_ROADS) verifiedRoadSegment(road[1],road[2]);

const parkShape = new THREE.Shape();
PARK_POLYGON.forEach(([x,z],i) => i ? parkShape.lineTo(x,z) : parkShape.moveTo(x,z));
const parkMesh = new THREE.Mesh(new THREE.ShapeGeometry(parkShape),snowMat);
parkMesh.rotation.x = -Math.PI/2;
parkMesh.position.y = .14;
parkMesh.receiveShadow = false;
scene.add(parkMesh);

// VERIFIED RAILWAY LAYER
// Primary source: Ville de Montréal Voies ferrées 3D 2020 / CARTO-FER-VOIE.
// Runtime layer has already passed the two-source reconciliation gate.
// One municipal "En construction" feature is held out; Québec-only reference
// segments do not override the authoritative Montréal geometry.
const railBedMat = new THREE.MeshStandardMaterial({ color:0x25282b, roughness:.96, metalness:.04 });
const railMat = new THREE.MeshStandardMaterial({ color:0x62676b, roughness:.42, metalness:.72 });
const sleeperMat = new THREE.MeshStandardMaterial({ color:0x3a302a, roughness:.95, metalness:.02 });

function addRailPolyline(points) {
  if (!Array.isArray(points) || points.length < 2) return;
  const clean = points.filter(p => Array.isArray(p) && p.length >= 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (clean.length < 2) return;

  const bed = [];
  const leftRail = [];
  const rightRail = [];
  const sleepers = [];

  for (let i=0;i<clean.length;i++) {
    const prev = clean[Math.max(0,i-1)];
    const next = clean[Math.min(clean.length-1,i+1)];
    const tx = next[0]-prev[0], tz = next[1]-prev[1];
    const len = Math.hypot(tx,tz) || 1;
    const nx = -tz/len, nz = tx/len;
    bed.push([clean[i][0]-nx*1.35, clean[i][1]-nz*1.35], [clean[i][0]+nx*1.35, clean[i][1]+nz*1.35]);
    leftRail.push([clean[i][0]-nx*.72, .19, clean[i][1]-nz*.72]);
    rightRail.push([clean[i][0]+nx*.72, .19, clean[i][1]+nz*.72]);
  }

  const bedPositions=[];
  for(let i=0;i<clean.length-1;i++){
    const a=bed[i*2], b=bed[i*2+2], c=bed[i*2+3], d=bed[i*2+1];
    bedPositions.push(a[0],.07,a[1], b[0],.07,b[1], d[0],.07,d[1], b[0],.07,b[1], c[0],.07,c[1], d[0],.07,d[1]);
  }
  const bedGeom=new THREE.BufferGeometry();
  bedGeom.setAttribute('position',new THREE.Float32BufferAttribute(bedPositions,3));
  bedGeom.computeVertexNormals();
  const bedMesh=new THREE.Mesh(bedGeom,railBedMat);
  bedMesh.receiveShadow=true;
  scene.add(bedMesh);

  function addRailLine(points) {
    const geom=new THREE.BufferGeometry();
    geom.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
    const line=new THREE.Line(geom,railMat);
    line.frustumCulled=true;
    scene.add(line);
  }
  addRailLine(leftRail);
  addRailLine(rightRail);

  let total=0;
  for(let i=0;i<clean.length-1;i++) total += Math.hypot(clean[i+1][0]-clean[i][0],clean[i+1][1]-clean[i][1]);
  const sleeperCount=Math.max(1,Math.floor(total/5));
  const sleeperGeom=new THREE.BoxGeometry(2.25,.12,.18);
  const inst=new THREE.InstancedMesh(sleeperGeom,sleeperMat,sleeperCount);
  inst.castShadow=true;
  inst.receiveShadow=true;
  const matrix=new THREE.Matrix4();
  let distance=0, nextSleeper=2.5, index=0;
  for(let i=0;i<clean.length-1 && index<sleeperCount;i++){
    const ax=clean[i][0], az=clean[i][1], bx=clean[i+1][0], bz=clean[i+1][1];
    const dx=bx-ax, dz=bz-az, seg=Math.hypot(dx,dz);
    if(!seg) continue;
    while(nextSleeper <= distance+seg && index<sleeperCount){
      const t=(nextSleeper-distance)/seg;
      const x=ax+dx*t, z=az+dz*t;
      const angle=Math.atan2(dx,dz);
      matrix.compose(new THREE.Vector3(x,.13,z),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),angle),new THREE.Vector3(1,1,1));
      inst.setMatrixAt(index++,matrix);
      nextSleeper+=5;
    }
    distance+=seg;
  }
  inst.count=index;
  inst.instanceMatrix.needsUpdate=true;
  scene.add(inst);
}

async function loadVerifiedRailway() {
  try {
    const response=await fetch('./data/first_sector_railway_runtime.json',{cache:'no-store'});
    if(!response.ok) throw new Error('railway layer HTTP '+response.status);
    const data=await response.json();
    addRailwayToMap(data.features || []);
    for(const feature of data.features || []) {
      const geometry=feature.geometry_local_m;
      if(!geometry) continue;
      if(geometry.type==='LineString') addRailPolyline(geometry.coordinates);
      if(geometry.type==='MultiLineString') {
        for(const line of geometry.coordinates || []) addRailPolyline(line);
      }
    }
    console.info('EMPTYHELL railway layer loaded',data.metadata || {});
  } catch(error) {
    console.error('EMPTYHELL railway layer failed to load',error);
  }
}
loadVerifiedRailway();

// Verified park perimeter, kept as low concrete edging.
// Do not use the road helper here: it would incorrectly create sidewalks around the park.
for (let i=0;i<PARK_POLYGON.length-1;i++) {
  const a=PARK_POLYGON[i], b=PARK_POLYGON[i+1];
  const dx=b[0]-a[0], dz=b[1]-a[1], len=Math.hypot(dx,dz);
  if (len < .5) continue;
  const angle=Math.atan2(dx,dz);
  const edge=box(.22,.08,len,concreteMat,(a[0]+b[0])/2,.20,(a[1]+b[1])/2,{castShadow:false});
  edge.rotation.y=angle;
}

// Park paths remain subordinate to the verified footprint.
street(2.2,26, -6, -4, .1);
street(2.2,30, -9, 2, Math.PI/2-.12);

interactable(
  box(1.6,1.7,.7,brickDarkMat,-15,.85,8),
  'MICRO-LIBRARY',
  'A small neighbourhood library in the park. A place for exchange, pause, and ordinary life.'
);
interactable(
  box(1.6,1.7,.7,brickDarkMat,5,.85,7),
  'MICRO-LIBRARY',
  'Another small community library. The object is simple; the fact that it is here matters.'
);
interactable(
  box(5,.08,.8,glassMat,-3,1.0,9),
  'TERRE EN VUE',
  'A park artwork marker. The first slice records the place without turning it into exposition.'
);

const discoveryStorageKey = 'emptyhell.discovery.v1';
const routeStorageKey = 'emptyhell.route.v1';
const transmissionStorageKey = 'emptyhell.transmission.v1';
const savedRoute = (() => {
  try {
    return localStorage.getItem(routeStorageKey) === 'reached';
  } catch {
    return false;
  }
})();
const savedTransmission = (() => {
  try {
    return localStorage.getItem(transmissionStorageKey) === 'complete';
  } catch {
    return false;
  }
})();
const encounterStorageKey = 'emptyhell.encounter.v1';
const doorStorageKey = 'emptyhell.door.v1';
const fragmentStorageKey = 'emptyhell.fragment.v1';
const trailStorageKey = 'emptyhell.trail.v1';
const powerStorageKey = 'emptyhell.power.v1';
const accessStorageKey = 'emptyhell.access.v1';
const chamberStorageKey = 'emptyhell.chamber.v1';
const descentStorageKey = 'emptyhell.descent.v1';
const sublevelStorageKey = 'emptyhell.sublevel.v1';
const lowerSignalStorageKey = 'emptyhell.lower-signal.v1';
const savedEncounter = (() => {
  try {
    return localStorage.getItem(encounterStorageKey) === 'complete';
  } catch {
    return false;
  }
})();
let transmissionComplete = savedTransmission;
let encounterComplete = savedEncounter;
const savedDoor = (() => {
  try {
    return localStorage.getItem(doorStorageKey) === 'open';
  } catch {
    return false;
  }
})();
let doorOpen = savedDoor;
const savedFragment = (() => {
  try {
    return localStorage.getItem(fragmentStorageKey) === 'found';
  } catch {
    return false;
  }
})();
let fragmentFound = savedFragment;
const savedTrail = (() => {
  try {
    return localStorage.getItem(trailStorageKey) === 'reached';
  } catch {
    return false;
  }
})();
let trailReached = savedTrail;
const savedPower = (() => {
  try {
    return localStorage.getItem(powerStorageKey) === 'restored';
  } catch {
    return false;
  }
})();
let powerRestored = savedPower;
const savedAccess = (() => {
  try {
    return localStorage.getItem(accessStorageKey) === 'open';
  } catch {
    return false;
  }
})();
let accessOpen = savedAccess;
const savedChamber = (() => {
  try { return localStorage.getItem(chamberStorageKey) === 'heard'; } catch { return false; }
})();
let chamberHeard = savedChamber;
const savedDescent = (() => { try { return localStorage.getItem(descentStorageKey) === 'open'; } catch { return false; } })();
let descentOpen = savedDescent;
const savedSublevel = (() => { try { return localStorage.getItem(sublevelStorageKey) === 'entered'; } catch { return false; } })();
let sublevelEntered = savedSublevel;
const savedLowerSignal = (() => { try { return localStorage.getItem(lowerSignalStorageKey) === 'heard'; } catch { return false; } })();
let lowerSignalHeard = savedLowerSignal;
warm.intensity = powerRestored ? 24 : 18;
const savedDiscovery = (() => {
  try {
    const raw = localStorage.getItem(discoveryStorageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
})();

const discoveryState = {
  found: new Set(savedDiscovery),
  total: 3
};
const worldStatus = document.querySelector('#world-status');

// Powered utility enclosure: a physical next-layer space, not a floating marker.
const utilityWallMat = new THREE.MeshStandardMaterial({ color:0x3b3f42, roughness:.94, metalness:.08 });
const utilityRoofMat = new THREE.MeshStandardMaterial({ color:0x272b2e, roughness:.9, metalness:.12 });
box(8,.18,8,utilityRoofMat,382,3.15,-208,{castShadow:true});
box(.35,3.0,8,utilityWallMat,377.85,1.5,-208,{castShadow:true});
box(.35,3.0,8,utilityWallMat,386.15,1.5,-208,{castShadow:true});
box(8,3.0,.35,utilityWallMat,382,1.5,-212,{castShadow:true});
box(3.05,3.0,.35,utilityWallMat,379.5,1.5,-204,{castShadow:true});
box(3.05,3.0,.35,utilityWallMat,384.5,1.5,-204,{castShadow:true});
addCollider(377.85,-208,.35,8);
addCollider(386.15,-208,.35,8);
addCollider(382,-212,8,.35);
addCollider(379.5,-204,3.05,.35);
addCollider(384.5,-204,3.05,.35);
const chamberLight = new THREE.PointLight(0x7b5cff, accessOpen ? 1.4 : 0, 10, 2);
chamberLight.position.set(382,2.4,-209);
scene.add(chamberLight);
const chamberReceiver = interactable(
  box(.75,1.2,.5,darkMat,382,1.05,-209),
  chamberHeard ? 'RECEIVER / QUIET' : 'RECEIVER / LISTEN',
  chamberHeard
    ? 'The chamber has gone quiet. The signal has moved deeper into Montréal.'
    : 'The receiver is close enough to hear now. Stay with it.'
);
chamberReceiver.visible = accessOpen;
chamberReceiver.userData.chamberState = chamberHeard ? 'heard' : 'active';
const descentHatch = interactable(
  box(1.8,.12,1.8,utilityRoofMat,382,.08,-210.2),
  descentOpen ? 'DESCENT / OPEN' : 'DESCENT / SEALED',
  descentOpen
    ? 'The hatch is open. The signal continues below the active slice.'
    : 'A second vibration is coming from beneath the chamber.'
);
descentHatch.visible = chamberHeard;
descentHatch.userData.descentState = descentOpen ? 'open' : 'active';
const descentCollider = { minX:381.1, maxX:382.9, minZ:-211.1, maxZ:-209.3 };
if (!descentOpen && chamberHeard) colliders.push(descentCollider);

// Fictional gameplay space below the verified surface slice. This is an explicit game layer, not a claim about a real Montréal structure.
const sublevelWallMat = new THREE.MeshStandardMaterial({ color:0x24292d, roughness:.9, metalness:.14 });
const sublevelFloorMat = new THREE.MeshStandardMaterial({ color:0x171b1e, roughness:1, metalness:.05 });
box(7,.18,22,sublevelFloorMat,382,.02,-221,{castShadow:false});
box(.35,3,22,sublevelWallMat,378.3,1.5,-221);
box(.35,3,22,sublevelWallMat,385.7,1.5,-221);
box(7,3,.35,sublevelWallMat,382,1.5,-232);
const sublevelLight = new THREE.PointLight(0x5139a8, sublevelEntered ? .9 : 0, 12, 2);
sublevelLight.position.set(382,2.2,-222);
scene.add(sublevelLight);
const lowerTunnelMat = new THREE.MeshStandardMaterial({ color:0x30343a, roughness:.86, metalness:.12 });
const lowerCableMat = new THREE.MeshStandardMaterial({ color:0x11151a, roughness:.72, metalness:.2 });
const lowerGlowMat = new THREE.MeshStandardMaterial({ color:0x2b1b48, roughness:.38, metalness:.18, emissive:0x5a2fa0, emissiveIntensity:.55 });

// Physical lower corridor: walls/ceiling and a short service tunnel with a gated receiver bay.
box(7,.18,34,sublevelFloorMat,382,.02,-227,{castShadow:false});
const lowerLeftWall=box(.35,3,34,sublevelWallMat,378.3,1.5,-227);
const lowerRightWall=box(.35,3,34,sublevelWallMat,385.7,1.5,-227);
const lowerCeiling=box(7,.22,34,sublevelWallMat,382,3.05,-227,{castShadow:false});
addCollider(378.3,-227,.35,34,lowerLeftWall);
addCollider(385.7,-227,.35,34,lowerRightWall);
addCollider(382,-244,7,.35,lowerCeiling);
for (let i=0;i<6;i++) {
  const z=-213-i*4.4;
  const cable=box(.08,.08,4,lowerCableMat,378.8,2.65,z,{castShadow:false});
  cable.rotation.y=Math.PI/2;
}
const lowerGate=box(6,2.7,.22,lowerGlowMat,382,1.35,-243,{castShadow:true});
if (!lowerSignalHeard) addCollider(382,-243,6,.22,lowerGate);
if (lowerSignalHeard) lowerGate.position.y = 3.1;
const lowerLamp=new THREE.PointLight(0x6b45c8,.85,9,2);
lowerLamp.position.set(382,2.35,-228);
scene.add(lowerLamp);
const lowerPulseLamp=new THREE.PointLight(0x7b5cff,lowerSignalHeard ? .9 : 0,8,2);
lowerPulseLamp.position.set(382,1.7,-240);
scene.add(lowerPulseLamp);

const sublevelReceiver = interactable(
  box(.7,1.3,.5,darkMat,382,1.1,-228),
  lowerSignalHeard ? 'SIGNAL / HEARD' : (sublevelEntered ? 'SIGNAL / BELOW' : 'SIGNAL / DESCEND'),
  lowerSignalHeard
    ? 'The lower receiver answers once. The gate ahead is carrying the same signal.'
    : (sublevelEntered
      ? 'The lower receiver is still transmitting. The active slice ends here, but the signal does not.'
      : 'The first sound below is not mechanical. Something is transmitting through the structure.')
);
sublevelReceiver.visible = sublevelEntered;
sublevelReceiver.userData.sublevelState = lowerSignalHeard ? 'heard' : (sublevelEntered ? 'entered' : 'locked');
const powerAccess = interactable(
  box(1.4,2.3,.16,darkMat,382,1.15,-204),
  accessOpen ? 'ACCESS / OPEN' : (powerRestored ? 'ACCESS / POWERED' : 'ACCESS / LOCKED'),
  accessOpen
    ? 'The entrance is already open. Whatever is inside belongs to the next layer.'
    : powerRestored
      ? 'Power has reached the structure. The entrance is no longer dead.'
    : 'The entrance has no power. Nothing responds.'
);
powerAccess.visible = powerRestored;
powerAccess.userData.accessState = accessOpen ? 'open' : (powerRestored ? 'active' : 'locked');
if (accessOpen) powerAccess.position.y += 2.6;
const powerAccessCollider = { minX:381.3, maxX:382.7, minZ:-204.08, maxZ:-203.92 }; 
if (!accessOpen && powerRestored) colliders.push(powerAccessCollider);

const powerAccessLight = new THREE.PointLight(0x7b5cff, powerRestored ? 1.2 : 0, 6, 2);
powerAccessLight.position.set(382,2.35,-203.7);
scene.add(powerAccessLight);

function activatePowerAccess() {
  if (!powerRestored || powerAccess.userData.accessState !== 'active') return;
  powerAccess.userData.accessState = 'open';
  accessOpen = true;
  powerAccess.position.y += 2.6;
  const index = colliders.indexOf(powerAccessCollider);
  if (index >= 0) colliders.splice(index, 1);
  powerAccess.userData.interaction.title = 'ACCESS / OPEN';
  powerAccess.userData.interaction.text = 'The powered entrance releases with a low mechanical click. Whatever is inside belongs to the next layer.';
  powerAccessLight.intensity = 2;
  chamberLight.intensity = 1.4;
  chamberReceiver.visible = true;
  try { localStorage.setItem(accessStorageKey, 'open'); } catch {}
  updateWorldStatus();
}

function completeChamber() {
  if (!accessOpen || chamberReceiver.userData.chamberState !== 'active') return;
  chamberReceiver.userData.chamberState = 'heard';
  chamberHeard = true;
  chamberReceiver.userData.interaction.title = 'RECEIVER / QUIET';
  chamberReceiver.userData.interaction.text = 'The chamber has gone quiet. The signal has moved deeper into Montréal.';
  chamberLight.intensity = .55;
  descentHatch.visible = true;
  try { localStorage.setItem(chamberStorageKey, 'heard'); } catch {}
  updateWorldStatus();
}

function enterSublevel() {
  if (!descentOpen || sublevelEntered) return;
  sublevelEntered = true;
  sublevelReceiver.visible = true;
  sublevelReceiver.userData.sublevelState = 'entered';
  sublevelReceiver.userData.interaction.title = 'SIGNAL / BELOW';
  sublevelReceiver.userData.interaction.text = 'The lower receiver is still transmitting. The active slice ends here, but the signal does not.';
  sublevelLight.intensity = .9;
  player.position.set(382,0,-218);
  try { localStorage.setItem(sublevelStorageKey, 'entered'); } catch {}
  updateWorldStatus();
}

function completeSublevelSignal() {
  if (!sublevelEntered || sublevelReceiver.userData.sublevelState === 'heard') return;
  sublevelReceiver.userData.sublevelState = 'heard';
  sublevelReceiver.userData.interaction.title = 'SIGNAL / HEARD';
  sublevelReceiver.userData.interaction.text = 'The lower receiver answers once. The gate ahead is carrying the same signal.';
  lowerPulseLamp.intensity = .9;
  lowerSignalHeard = true;
  lowerGate.userData = { ...(lowerGate.userData || {}), powered: true };
  try { localStorage.setItem(lowerSignalStorageKey, 'heard'); } catch {}
  const index = colliders.indexOf(lowerGate);
  if (index >= 0) colliders.splice(index, 1);
  lowerGate.position.y = 3.1;
  updateWorldStatus();
}

function openDescent() {
  if (!chamberHeard || descentHatch.userData.descentState !== 'active') return;
  descentHatch.userData.descentState = 'open';
  descentHatch.userData.interaction.title = 'DESCENT / OPEN';
  descentHatch.userData.interaction.text = 'The hatch is open. The signal continues below the active slice.';
  descentOpen = true;
  const index = colliders.indexOf(descentCollider);
  if (index >= 0) colliders.splice(index, 1);
  descentHatch.position.y -= .22;
  enterSublevel();
  try { localStorage.setItem(descentStorageKey, 'open'); } catch {}
  updateWorldStatus();
}

function updateWorldStatus() {
  if (worldStatus) {
    const count = discoveryState.found.size;
    const stage = sublevelReceiver?.userData.sublevelState === 'heard'
      ? 'SIGNAL ANSWERED'
      : sublevelEntered
      ? 'SIGNAL BELOW'
      : descentHatch?.userData.descentState === 'open'
      ? 'DESCENT OPEN'
      : chamberReceiver?.userData.chamberState === 'heard'
      ? 'SIGNAL MOVED DEEPER'
      : powerAccess?.userData.accessState === 'open'
      ? 'ACCESS OPEN'
      : powerRestored
      ? 'POWER RESTORED'
      : trailReached
        ? 'SIGNAL TRAIL COMPLETE'
      : fragmentFound
        ? 'FRAGMENT FOUND'
        : doorOpen
        ? 'PATH OPEN'
      : encounterComplete
        ? 'ENCOUNTER COMPLETE'
        : transmissionComplete
        ? 'TRANSMISSION COMPLETE · ENCOUNTER ACTIVE'
        : count === discoveryState.total
          ? 'ROUTE OPEN'
          : 'WORLD STATE ACTIVE';
    worldStatus.textContent = 'SIGNALS ' + count + ' / ' + discoveryState.total + ' · ' + stage;
  }
}

function discoverSignal(id) {
  discoveryState.found.add(id);
  try {
    localStorage.setItem(discoveryStorageKey, JSON.stringify([...discoveryState.found]));
  } catch {}
  updateWorldStatus();
  if (discoveryState.found.size === discoveryState.total) {
    routeMarker.visible = true;
    routeMarker.userData.interaction.text = 'Three receivers are answering each other. The route is no longer dormant.';
    routeDestination.visible = true;
  }
}

function reachRouteDestination() {
  if (routeDestination.userData.routeState === 'reached') return;
  routeDestination.userData.routeState = 'reached';
  routeDestination.userData.interaction.title = 'OBJECTIVE / COMPLETE';
  routeDestination.userData.interaction.text = 'The signal reaches the edge of the active slice. Something beyond it is answering back.';
  nextTransmission.visible = true;
  try {
    localStorage.setItem(routeStorageKey, 'reached');
  } catch {}
}

const signalNorth = interactable(
  box(.35,1.1,.35,darkMat,-42,.55,15),
  'SIGNAL / NORTH',
  'A small receiver fixed to the edge of the street. It has power, but no readable message.'
);
signalNorth.userData.signalId = 'north';

const signalEast = interactable(
  box(.35,1.1,.35,darkMat,74,.55,-18),
  'SIGNAL / EAST',
  'A second receiver. The indicator is still warm. Whatever passed through here was recent.'
);
signalEast.userData.signalId = 'east';

const signalRail = interactable(
  box(.35,1.1,.35,darkMat,166,.55,-103),
  'SIGNAL / RAIL',
  'A receiver near the railway corridor. The casing is marked, but the marking is not a name.'
);
signalRail.userData.signalId = 'rail';

const routeMarker = interactable(
  box(.42,1.35,.42,glassMat,0,.68,0),
  'ROUTE / OPEN',
  'The three signals converge here. The route is dormant until all three are found.'
);
routeMarker.visible = discoveryState.found.size === discoveryState.total;
routeMarker.userData.route = true;
if (routeMarker.visible) {
  routeMarker.userData.interaction.text = 'Three receivers are answering each other. The route is no longer dormant.';
}

const routeDestination = interactable(
  box(.5,1.5,.5,glassMat,205,.75,-126),
  savedRoute ? 'OBJECTIVE / COMPLETE' : 'OBJECTIVE / FOLLOW THE SIGNAL',
  savedRoute
    ? 'The signal reaches the edge of the active slice. Something beyond it is answering back.'
    : 'The route has opened. Follow the railway corridor toward the next transmission.'
);
routeDestination.userData.routeState = savedRoute ? 'reached' : 'open';
routeDestination.visible = discoveryState.found.size === discoveryState.total;
if (routeDestination.userData.routeState === 'reached') {
  routeDestination.userData.interaction.text = 'The signal reaches the edge of the active slice. Something beyond it is answering back.';
}

const nextTransmission = interactable(
  box(.38,1.2,.38,darkMat,235,.6,-145),
  'TRANSMISSION / RETURN',
  'A second receiver is waiting beyond the first route marker. The signal is weaker here.'
);
nextTransmission.visible = savedRoute;
nextTransmission.userData.routeState = savedTransmission ? 'complete' : (savedRoute ? 'active' : 'locked');
if (savedTransmission) {
  nextTransmission.userData.interaction.title = 'TRANSMISSION / COMPLETE';
  nextTransmission.userData.interaction.text = 'The second receiver goes quiet. The next signal is no longer local.';
}

function completeTransmission() {
  if (nextTransmission.userData.routeState !== 'active') return;
  nextTransmission.userData.routeState = 'complete';
  nextTransmission.userData.interaction.title = 'TRANSMISSION / COMPLETE';
  nextTransmission.userData.interaction.text = 'The second receiver goes quiet. The next signal is no longer local.';
  transmissionComplete = true;
  encounterSite.visible = true;
  encounterSite.userData.encounterState = encounterComplete ? 'complete' : 'active';
  encounterBeacon.visible = true;
  try {
    localStorage.setItem(transmissionStorageKey, 'complete');
  } catch {}
  updateWorldStatus();
}

const encounterSite = interactable(
  box(.48,1.55,.48,glassMat,270,.78,-164),
  savedEncounter ? 'ENCOUNTER / COMPLETE' : 'ENCOUNTER / LISTEN',
  savedEncounter
    ? 'The receiver is silent now. Whatever was listening has moved beyond this slice.'
    : 'A third receiver stands beyond the transmission. No message plays until you stay with it.'
);
encounterSite.visible = transmissionComplete;
encounterSite.userData.encounterState = savedEncounter ? 'complete' : (transmissionComplete ? 'active' : 'locked');

const encounterBeaconMat = new THREE.MeshStandardMaterial({
  color: 0x33404a,
  roughness: .28,
  metalness: .35,
  emissive: 0x21113d,
  emissiveIntensity: .35
});
const encounterBeacon = new THREE.Group();
const beaconCore = new THREE.Mesh(new THREE.CylinderGeometry(.11,.16,.72,10), encounterBeaconMat);
beaconCore.position.y = .52;
encounterBeacon.add(beaconCore);
const beaconRing = new THREE.Mesh(new THREE.TorusGeometry(.55,.025,6,24), encounterBeaconMat);
beaconRing.rotation.x = Math.PI / 2;
beaconRing.position.y = .12;
encounterBeacon.add(beaconRing);
const beaconLight = new THREE.PointLight(0x7b5cff, .65, 7, 2);
beaconLight.position.y = .8;
encounterBeacon.add(beaconLight);
encounterBeacon.position.copy(encounterSite.position);
encounterBeacon.visible = transmissionComplete;
scene.add(encounterBeacon);

function completeEncounter() {
  if (encounterSite.userData.encounterState !== 'active') return;
  encounterSite.userData.encounterState = 'complete';
  encounterSite.userData.interaction.title = 'ENCOUNTER / COMPLETE';
  encounterSite.userData.interaction.text = 'The receiver is silent now. Whatever was listening has moved beyond this slice.';
  encounterComplete = true;
  encounterDoor.visible = true;
  encounterDoor.userData.doorState = doorOpen ? 'open' : 'active';
  try {
    localStorage.setItem(encounterStorageKey, 'complete');
  } catch {}
  updateWorldStatus();
}

const encounterDoor = interactable(
  box(2.8,2.6,.22,darkMat,292,1.3,-164),
  savedDoor ? 'PATH / OPEN' : 'PATH / UNLOCKED',
  savedDoor
    ? 'The barrier has moved. The route continues beyond the receiver.'
    : 'The receiver released the lock. The barrier is physical; the route is not.'
);
encounterDoor.visible = encounterComplete;
encounterDoor.userData.doorState = savedDoor ? 'open' : (encounterComplete ? 'active' : 'locked');
const encounterDoorCollider = { minX:290.6, maxX:293.4, minZ:-164.2, maxZ:-163.8 };
if (!doorOpen) colliders.push(encounterDoorCollider);

function openEncounterDoor() {
  if (encounterDoor.userData.doorState !== 'active') return;
  encounterDoor.userData.doorState = 'open';
  encounterDoor.userData.interaction.title = 'PATH / OPEN';
  encounterDoor.userData.interaction.text = 'The barrier has moved. The route continues beyond the receiver.';
  doorOpen = true;
  encounterDoor.position.x += 3.2;
  signalFragment.visible = true;
  signalFragment.userData.fragmentState = fragmentFound ? 'found' : 'active';
  const index = colliders.indexOf(encounterDoorCollider);
  if (index >= 0) colliders.splice(index, 1);
  try {
    localStorage.setItem(doorStorageKey, 'open');
  } catch {}
  updateWorldStatus();
}

const signalFragment = interactable(
  box(.28,.52,.28,glassMat,306,.42,-164),
  savedFragment ? 'FRAGMENT / FOUND' : 'FRAGMENT / LISTEN',
  savedFragment
    ? 'The fragment is quiet now. Its signal has already been carried forward.'
    : 'A small physical fragment sits beyond the opened path. Stay close enough to hear the next transmission.'
);
signalFragment.visible = doorOpen;
signalFragment.userData.fragmentState = savedFragment ? 'found' : (doorOpen ? 'active' : 'locked');

function findSignalFragment() {
  if (signalFragment.userData.fragmentState !== 'active') return;
  signalFragment.userData.fragmentState = 'found';
  signalFragment.userData.interaction.title = 'FRAGMENT / FOUND';
  signalFragment.userData.interaction.text = 'The fragment is quiet now. Its signal has already been carried forward.';
  fragmentFound = true;
  try {
    localStorage.setItem(fragmentStorageKey, 'found');
  } catch {}
  signalTrail.visible = true;
  signalTerminal.visible = true;
  signalTerminal.userData.trailState = trailReached ? 'reached' : 'active';
  try {
    localStorage.setItem(fragmentStorageKey, 'found');
  } catch {}
  updateWorldStatus();
}

const signalTrail = new THREE.Group();
const trailMat = new THREE.MeshStandardMaterial({
  color: 0x26303a,
  roughness: .3,
  metalness: .4,
  emissive: 0x28145a,
  emissiveIntensity: .35
});
for (const [x,z] of [[318,-169],[330,-176],[342,-182],[354,-188]]) {
  const node = new THREE.Mesh(new THREE.TorusGeometry(.28,.025,6,18), trailMat);
  node.rotation.x = Math.PI / 2;
  node.position.set(x,.08,z);
  signalTrail.add(node);
}
signalTrail.visible = trailReached || fragmentFound;
scene.add(signalTrail);

const signalTerminal = interactable(
  box(.36,.72,.36,glassMat,354,.42,-188),
  savedTrail ? 'TRAIL / COMPLETE' : 'TRAIL / FOLLOW',
  savedTrail
    ? 'The last receiver has gone quiet. The signal continues beyond this slice.'
    : 'The fragment leaves a physical trail. Follow the receivers to the last point in this slice.'
);
signalTerminal.visible = savedTrail || fragmentFound;
signalTerminal.userData.trailState = savedTrail ? 'reached' : (fragmentFound ? 'active' : 'locked');

function reachSignalTrail() {
  if (signalTerminal.userData.trailState !== 'active') return;
  signalTerminal.userData.trailState = 'reached';
  signalTerminal.userData.interaction.title = 'TRAIL / COMPLETE';
  signalTerminal.userData.interaction.text = 'The last receiver has gone quiet. The signal continues beyond this slice.';
  trailReached = true;
  powerRestored = true;
  try {
    localStorage.setItem(trailStorageKey, 'reached');
    localStorage.setItem(powerStorageKey, 'restored');
  } catch {}
  for (const source of streetLights) source.restored = true;
  warm.intensity = 24;
  for (const window of livingWindows) window.material = windowWarmMat;
  powerAccess.visible = true;
  powerAccess.userData.accessState = 'active';
  powerAccess.userData.interaction.title = accessOpen ? 'ACCESS / OPEN' : 'ACCESS / POWERED';
  powerAccess.userData.accessState = accessOpen ? 'open' : 'active';
  powerAccessLight.intensity = accessOpen ? 2 : 1.2;
  updateWorldStatus();
}

updateWorldStatus();

// Verified frontage-derived massing from Ville de Montréal compilation sheet 31H12-010-0530.
// The footprints are traced from the official 1:1000 building outlines; height remains visual massing,
// not a claim about municipal storey/height attributes. The current slice starts with the closest
// verified frontage ring around the park while the remaining sheet footprints are reconciled.
const VERIFIED_FRONTAGE = [];

// Exact source-derived building polygons. Coordinates are quantized to 0.1m and delta-compressed.
const SOURCE_BUILDING_GEOMETRY = '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';
function decodeBase64Bytes(value) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/[^A-Za-z0-9+/]/g, '');
  const out=[];
  let buffer=0,bits=0;
  for(const ch of clean){ buffer=(buffer<<6)|chars.indexOf(ch); bits+=6; if(bits>=8){bits-=8;out.push((buffer>>bits)&255);} }
  return new Uint8Array(out);
}
async function loadSourceBuildingGeometry() {
  try {
    const bytes=decodeBase64Bytes(SOURCE_BUILDING_GEOMETRY);
    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
    const pairs=JSON.parse(await new Response(stream).text());
    let loaded=0;
    for(const [drawing,origin,deltas] of pairs){
      let x=origin[0], z=origin[1];
      const points=deltas.map(([dx,dz])=>{x+=dx;z+=dz;return [x/10,z/10];});
      if(points.length<4) continue;
      let area=0;
      for(let i=0;i<points.length;i++){const [ax,az]=points[i], [bx,bz]=points[(i+1)%points.length];area+=ax*bz-bx*az;}
      area=Math.abs(area)/2;
      const h=THREE.MathUtils.clamp(5.8+Math.sqrt(area)*.12,6.2,10.5);
      footprintBuilding(points,h,brickMat);
      loaded++;
    }
    window.__emptyhellBuildingsLoaded = loaded;
    worldReady = loaded === 128;
    window.__emptyhellWorldReady = worldReady;
    console.info('Source-aligned building polygons loaded:',loaded);
  } catch(error) {
    window.__emptyhellBuildingsLoaded = 0;
    worldReady = true;
    window.__emptyhellWorldReady = true;
    console.warn('Source building geometry failed to load:',error);
  }
}
loadSourceBuildingGeometry();

// Development boundary only: a visible low snow berm marks the current loaded slice.
// It is not claimed as a real municipal boundary.
function sliceEdge(x,z,w,d) {
  const edge=box(w,.28,d,snowMat,x,.14,z,{castShadow:false});
  addCollider(x,z,w,d,edge);
}
sliceEdge((WORLD.minX+WORLD.maxX)/2,WORLD.minZ, WORLD.maxX-WORLD.minX,.8);
sliceEdge((WORLD.minX+WORLD.maxX)/2,WORLD.maxZ, WORLD.maxX-WORLD.minX,.8);
sliceEdge(WORLD.minX,(WORLD.minZ+WORLD.maxZ)/2,.8,WORLD.maxZ-WORLD.minZ);
sliceEdge(WORLD.maxX,(WORLD.minZ+WORLD.maxZ)/2,.8,WORLD.maxZ-WORLD.minZ);

// Railway geometry is authoritative data; no guessed crossing or railway camera clamp is used.

// Winter surface details: road-edge snow follows the verified street segments.
function snowBank(x,z,w,d,h=.32) {
  const bank = box(w,h,d,snowMat,x,h/2,z,{castShadow:false});
  // Deterministic micro-variation: visual noise must not change between QA runs.
  const seed = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453;
  bank.rotation.y = (seed - Math.floor(seed) - .5) * .08;
}
for (const road of VERIFIED_ROADS) {
  const a=road[1], b=road[2];
  const dx=b[0]-a[0], dz=b[1]-a[1], len=Math.hypot(dx,dz);
  if (len < 8) continue;
  const angle=Math.atan2(dx,dz);
  const x=(a[0]+b[0])/2, z=(a[1]+b[1])/2;
  const nx=Math.cos(angle), nz=-Math.sin(angle);
  snowBank(x+nx*5.2,z+nz*5.2,0.65,len,0.24);
  snowBank(x-nx*5.2,z-nz*5.2,0.65,len,0.24);
}
const tireMat = new THREE.MeshStandardMaterial({ color:0x303336, roughness:1 });
for (const road of VERIFIED_ROADS.slice(0,14)) {
  const a=road[1],b=road[2],dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  if(len<10) continue;
  const angle=Math.atan2(dx,dz);
  const x=(a[0]+b[0])/2,z=(a[1]+b[1])/2;
  for(const offset of [-1.35,1.35]) {
    const nx=Math.cos(angle),nz=-Math.sin(angle);
    const g=box(.22,.012,len,tireMat,x+nx*offset,.105,z+nz*offset,{castShadow:false});
    g.rotation.y=angle;
  }
}

// Utility infrastructure: restrained poles and overhead lines make the verified streets read as lived-in space.
const utilityMat = new THREE.MeshStandardMaterial({ color:0x2b2d30, roughness:.82, metalness:.15 });
function utilityPole(x,z) {
  box(.18,7.5,.18,utilityMat,x,3.75,z);
  box(2.4,.12,.12,utilityMat,x,7.0,z);
  box(2.1,.035,.035,darkMat,x,7.0,z-.04,{castShadow:false});
}
for (const p of [[-34,30],[22,45],[65,-5],[112,-52],[165,-105],[250,60],[-65,75]]) utilityPole(p[0],p[1]);

// Low service structures remain sparse placeholders until parcel footprints are imported.
function lowGarage(x,z,w=6,d=5) {
  const g=box(w,2.4,d,concreteMat,x,1.2,z);
  addCollider(x,z,w,d,g);
  box(w*.72,1.7,.08,darkMat,x,1.0,z-d/2-.05,{castShadow:false});
}
lowGarage(-58,36);
lowGarage(52,54);
lowGarage(104,-36);
lowGarage(190,-118);


// Lived-in street layer: sparse parked vehicles sit beside verified roads.
// These are visual world props only; they do not alter the authoritative street geometry.
const carBodyMat = new THREE.MeshStandardMaterial({ color:0x24272b, roughness:.72, metalness:.28 });
const carGlassMat = new THREE.MeshStandardMaterial({ color:0x18232a, roughness:.24, metalness:.32 });
const carLampMat = new THREE.MeshBasicMaterial({ color:0xffd5a1 });
function parkedCar(x,z,rotation=0,scale=1) {
  const root = new THREE.Group();
  root.position.set(x,.22,z);
  root.rotation.y = rotation;
  root.scale.setScalar(scale);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8,.55,4.1),carBodyMat);
  body.position.y=.48;
  body.castShadow=true;
  root.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.48,.5,2.0),carGlassMat);
  cabin.position.set(0,.86,-.05);
  cabin.castShadow=true;
  root.add(cabin);
  for (const side of [-1,1]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(.34,.16,.06),carLampMat);
    lamp.position.set(side*.52,.53,-2.06);
    root.add(lamp);
  }
  scene.add(root);
}
parkedCar(-24.5,5.2,Math.atan2(-0.9,1),.95);
parkedCar(54.5,-15.5,Math.atan2(0.7,1),1.0);
parkedCar(101,-47,Math.atan2(0.55,1),.9);
parkedCar(173,-109,Math.atan2(0.55,1),.95);
parkedCar(292,72,Math.atan2(0.38,1),.9);

// Streetlights are placed near the verified road network rather than on the old axis-aligned grid.
for (const p of [[-34,30],[22,45],[65,-5],[112,-52],[165,-105],[250,60]]) lamp(p[0],p[1]);

// Player character: fully 3D in-world body; no 2D gameplay avatar.
const keys = new Set();
function createPlayerCharacter() {
  const root = new THREE.Group();
  const coatMat = new THREE.MeshStandardMaterial({ color:0x16181c, roughness:.82, metalness:.05 });
  const clothMat = new THREE.MeshStandardMaterial({ color:0x2a2d32, roughness:.9 });
  const skinMat = new THREE.MeshStandardMaterial({ color:0x6d5548, roughness:.95 });
  const shoeMat = new THREE.MeshStandardMaterial({ color:0x090a0c, roughness:.78 });
  const head = new THREE.Mesh(new THREE.SphereGeometry(.24,14,10), skinMat);
  head.position.y = 1.72;
  head.castShadow = true;
  root.add(head);
  const torso = new THREE.Mesh(new THREE.CapsuleGeometry(.34,.58,5,10), coatMat);
  torso.position.y = 1.12;
  torso.castShadow = true;
  root.add(torso);
  const hood = new THREE.Mesh(new THREE.TorusGeometry(.27,.055,8,16), clothMat);
  hood.rotation.x = Math.PI / 2;
  hood.position.set(0,1.73,0);
  hood.castShadow = true;
  root.add(hood);
  for (const side of [-1,1]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.09,.48,4,8), clothMat);
    arm.position.set(side*.39,1.14,0);
    arm.rotation.z = side*.08;
    arm.castShadow = true;
    root.add(arm);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.105,.5,4,8), coatMat);
    leg.position.set(side*.14,.55,0);
    leg.castShadow = true;
    root.add(leg);
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(.22,.12,.42), shoeMat);
    shoe.position.set(side*.14,.22,-.07);
    shoe.castShadow = true;
    root.add(shoe);
  }
  return root;
}
const touchDevice = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
const touchAxes = { x: 0, z: 0 };
let touchLookId = null;
let touchStickId = null;
let touchLookX = 0;
let touchLookY = 0;

addEventListener('keydown', event => {
  keys.add(event.code);
  if (event.code === 'Escape') {
    // Modal priority: close the active world layer before touching the pause state.
    if (!mapOverlay.classList.contains('hidden')) {
      toggleMap(false);
      return;
    }
    if (!interactionPanel.classList.contains('hidden')) {
      interactionPanel.classList.add('hidden');
      if (!pauseOpen) lockGame();
      return;
    }
    togglePause(!pauseOpen);
    return;
  }
});

addEventListener('keyup', event => keys.delete(event.code));
addEventListener('blur', () => keys.clear());

const player = createPlayerCharacter();
scene.add(player);

// Spawn near the Saint-Roch / Stuart / park area.
// Spawn at the Saint-Roch-facing edge of the park, not inside the park geometry.
player.position.set(sublevelEntered ? 382 : 15, 0, sublevelEntered ? -218 : 20);

const testPosition = new THREE.Vector3();

function collidesAt(x, z) {
  for (const c of colliders) {
    const closestX = THREE.MathUtils.clamp(x, c.minX, c.maxX);
    const closestZ = THREE.MathUtils.clamp(z, c.minZ, c.maxZ);
    const dx = x - closestX;
    const dz = z - closestZ;
    if (dx * dx + dz * dz < playerRadius * playerRadius) return true;
  }
  for (const c of polygonColliders) {
    if (x < c.minX || x > c.maxX || z < c.minZ || z > c.maxZ) continue;
    if (pointInPolygon(x, z, c.points)) return true;
    for (let i=0; i<c.points.length; i++) {
      const a=c.points[i], b=c.points[(i+1)%c.points.length];
      if (pointSegmentDistanceSq(x,z,a[0],a[1],b[0],b[1]) < playerRadius*playerRadius) return true;
    }
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

function setTouchControlsVisible(visible) {
  const controls = document.querySelector('#mobile-controls');
  if (!controls || !touchDevice) return;
  controls.style.visibility = visible ? 'visible' : 'hidden';
  controls.style.opacity = visible ? '1' : '0';
}
function togglePause(open) {
  pauseOpen = open;
  pause.classList.toggle('hidden', !open);
  setTouchControlsVisible(!open && !mapOpen && interactionPanel?.classList.contains('hidden') === true);
  if (open && document.pointerLockElement) document.exitPointerLock();
}

function lockGame() {
  if (pauseOpen) return;
  if (touchDevice) {
    locked = true;
    return;
  }
  renderer.domElement.requestPointerLock();
}

renderer.domElement.addEventListener('click', lockGame);
document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
  if (!locked && !pauseOpen) togglePause(true);
});
document.addEventListener('mousemove', e => {
  if (!locked || pauseOpen || touchDevice) return;
  yaw -= e.movementX * 0.0025;
  pitch -= e.movementY * 0.0018;
  pitch = THREE.MathUtils.clamp(pitch, -0.05, 0.65);
});

const touchStick = document.querySelector('#touch-stick');
const touchKnob = document.querySelector('#touch-knob');
const touchLook = document.querySelector('#touch-look');
const touchInteract = document.querySelector('#touch-interact');
const touchMap = document.querySelector('#touch-map');
const touchPause = document.querySelector('#touch-pause');

function resetTouchStick() {
  touchAxes.x = 0;
  touchAxes.z = 0;
  touchKnob.style.transform = 'translate(0, 0)';
}

touchStick?.addEventListener('pointerdown', event => {
  if (!touchDevice) return;
  event.preventDefault();
  touchStickId = event.pointerId;
  touchStick.setPointerCapture(event.pointerId);
  lockGame();
});

touchStick?.addEventListener('pointermove', event => {
  if (event.pointerId !== touchStickId) return;
  const rect = touchStick.getBoundingClientRect();
  const max = rect.width * .34;
  const dx = event.clientX - (rect.left + rect.width / 2);
  const dy = event.clientY - (rect.top + rect.height / 2);
  const distance = Math.hypot(dx, dy) || 1;
  const scale = Math.min(1, max / distance);
  const x = dx * scale;
  const y = dy * scale;
  touchAxes.x = x / max;
  touchAxes.z = -y / max;
  touchKnob.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
});

function releaseTouchStick(event) {
  if (event.pointerId !== touchStickId) return;
  touchStickId = null;
  resetTouchStick();
}
touchStick?.addEventListener('pointerup', releaseTouchStick);
touchStick?.addEventListener('pointercancel', releaseTouchStick);

touchLook?.addEventListener('pointerdown', event => {
  if (!touchDevice) return;
  event.preventDefault();
  touchLookId = event.pointerId;
  touchLookX = event.clientX;
  touchLookY = event.clientY;
  touchLook.setPointerCapture(event.pointerId);
  lockGame();
});

touchLook?.addEventListener('pointermove', event => {
  if (event.pointerId !== touchLookId || pauseOpen || !locked) return;
  event.preventDefault();
  const dx = event.clientX - touchLookX;
  const dy = event.clientY - touchLookY;
  touchLookX = event.clientX;
  touchLookY = event.clientY;
  yaw -= dx * .009;
  pitch -= dy * .006;
  pitch = THREE.MathUtils.clamp(pitch, -0.05, 0.65);
});

function releaseTouchLook(event) {
  if (event.pointerId === touchLookId) touchLookId = null;
}
touchLook?.addEventListener('pointerup', releaseTouchLook);
touchLook?.addEventListener('pointercancel', releaseTouchLook);

touchInteract?.addEventListener('pointerdown', event => {
  event.preventDefault();
  if (!pauseOpen && !mapOpen && activeInteraction) openInteraction(activeInteraction);
});
touchMap?.addEventListener('pointerdown', event => {
  event.preventDefault();
  if (!pauseOpen) toggleMap(!mapOpen);
});
touchPause?.addEventListener('pointerdown', event => {
  event.preventDefault();
  togglePause(!pauseOpen);
});

resume.addEventListener('click', () => {
  pauseOpen = false;
  pause.classList.add('hidden');
  setTouchControlsVisible(!mapOpen && interactionPanel.classList.contains('hidden'));
  lockGame();
});

const interactionPrompt = document.querySelector('#interaction-prompt');
const interactionPanel = document.querySelector('#interaction-panel');
const interactionTitle = document.querySelector('#interaction-title');
const interactionText = document.querySelector('#interaction-text');
const interactionClose = document.querySelector('#interaction-close');
const mapOverlay = document.querySelector('#map-overlay');
const mapPlayer = document.querySelector('#map-player');
const worldMapSvg = document.querySelector('#world-map-svg');
const mapRoads = document.querySelector('#map-roads');
const mapRail = document.querySelector('#map-rail');
const mapPark = document.querySelector('#map-park');

function mapPoint([x,z]) { return `${x},${z}`; }

function buildWorldMap() {
  if (!worldMapSvg) return;
  mapRoads.replaceChildren();
  for (const road of VERIFIED_ROADS) {
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1', road[1][0]); line.setAttribute('y1', road[1][1]);
    line.setAttribute('x2', road[2][0]); line.setAttribute('y2', road[2][1]);
    if (road[0] === 'Avenue Stuart' || road[0] === 'Rue Saint-Roch') line.classList.add('major');
    line.dataset.name = road[0];
    mapRoads.appendChild(line);
  }
  mapPark.setAttribute('points', PARK_POLYGON.map(mapPoint).join(' '));
}
function addRailwayToMap(features) {
  if (!mapRail) return;
  mapRail.replaceChildren();
  for (const feature of features || []) {
    const geometry = feature.geometry_local_m;
    if (!geometry) continue;
    const lines = geometry.type === 'LineString' ? [geometry.coordinates] : (geometry.type === 'MultiLineString' ? geometry.coordinates : []);
    for (const points of lines) {
      if (!Array.isArray(points) || points.length < 2) continue;
      for (let i=0; i<points.length-1; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg','line');
        line.setAttribute('x1', points[i][0]); line.setAttribute('y1', points[i][1]);
        line.setAttribute('x2', points[i+1][0]); line.setAttribute('y2', points[i+1][1]);
        mapRail.appendChild(line);
      }
    }
  }
}
buildWorldMap();
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
  if (target === powerAccess) activatePowerAccess();
  if (target === chamberReceiver && target.userData.chamberState === 'active') completeChamber();
  if (target === descentHatch && target.userData.descentState === 'active') openDescent();
  if (target === sublevelReceiver && target.userData.sublevelState === 'entered') completeSublevelSignal();

  if (!target) return;
  if (target.userData.signalId) discoverSignal(target.userData.signalId);
  if (target.userData === routeDestination?.userData && target.userData.routeState === 'open') reachRouteDestination();
  if (target.userData === nextTransmission?.userData && target.userData.routeState === 'active') completeTransmission();
  if (target.userData === encounterSite?.userData && target.userData.encounterState === 'active') completeEncounter();
  if (target.userData === encounterDoor?.userData && target.userData.doorState === 'active') openEncounterDoor();
  if (target.userData === signalFragment?.userData && target.userData.fragmentState === 'active') findSignalFragment();
  if (target.userData === signalTerminal?.userData && target.userData.trailState === 'active') reachSignalTrail();
  const data = target.userData.interaction;
  interactionTitle.textContent = data.title;
  interactionText.textContent = data.text;
  interactionPanel.classList.remove('hidden');
  setTouchControlsVisible(false);
  if (document.pointerLockElement) document.exitPointerLock();
}

function toggleMap(open) {
  mapOpen = open;
  mapOverlay.classList.toggle('hidden', !open);
  setTouchControlsVisible(!open && !pauseOpen && interactionPanel.classList.contains('hidden'));
  if (open && document.pointerLockElement) document.exitPointerLock();
  if (!open && !pauseOpen) lockGame();
}

interactionClose.addEventListener('click', () => {
  interactionPanel.classList.add('hidden');
  setTouchControlsVisible(!pauseOpen && !mapOpen);
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
const mapClose = document.querySelector('#map-close');
mapClose.addEventListener('click', () => toggleMap(false));

const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();

function move(dt) {
  if (!locked || pauseOpen || !worldReady) return;

  direction.set(0,0,0);
  if (keys.has('KeyW')) direction.z -= 1;
  if (keys.has('KeyS')) direction.z += 1;
  if (keys.has('KeyA')) direction.x -= 1;
  if (keys.has('KeyD')) direction.x += 1;
  if (touchDevice) {
    direction.x += touchAxes.x;
    direction.z += touchAxes.z;
  }
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
  updateSnow(dt);

  const moving = locked && (Math.abs(velocity.x) + Math.abs(velocity.z) > .15);
  const bob = moving ? Math.sin(clock.elapsedTime * 11.5) * .035 : 0;
  player.position.y = bob;
  player.rotation.y = yaw;

  for (const source of streetLights) {
    const flicker = Math.sin(clock.elapsedTime * 5.7 + source.seed) * .025 + Math.sin(clock.elapsedTime * 13.1 + source.seed * 1.7) * .012;
    const restored = source.restored || powerRestored;
    const target = restored ? source.base : source.base * .18;
    source.light.intensity = target * (1 + flicker);
    if (source.bulb) source.bulb.material.emissiveIntensity = restored ? .8 : .12;
  }

  if (encounterBeacon.visible) {
    const pulse = .5 + .5 * Math.sin(clock.elapsedTime * 2.4);
    beaconRing.scale.setScalar(.92 + pulse * .12);
    beaconRing.rotation.z += dt * (.22 + pulse * .08);
    beaconLight.intensity = .42 + pulse * .42;
    encounterBeaconMat.emissiveIntensity = .25 + pulse * .35;
  }

  updateInteraction();
  const mapX = ((player.position.x - WORLD.minX) / (WORLD.maxX - WORLD.minX)) * 100;
  const mapZ = ((player.position.z - WORLD.minZ) / (WORLD.maxZ - WORLD.minZ)) * 100;
  mapPlayer.style.left = mapX + '%';
  mapPlayer.style.top = mapZ + '%';
  renderer.render(scene, camera);
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const loadingScreen = document.querySelector('#loading');
const loadingStarted = performance.now();
let loadingFinished = false;
const finishLoading = () => {
  if (!loadingScreen || loadingScreen.classList.contains('hidden')) return;
  const elapsed = performance.now() - loadingStarted;
  if (window.__emptyhellWorldReady || elapsed > 4500) { loadingFinished = true; loadingScreen.classList.add('hidden'); }
  else setTimeout(finishLoading, 100);
};
finishLoading();
animate();
