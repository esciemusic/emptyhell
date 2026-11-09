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
        box(1.15,1.45,.08,lit ? windowWarmMat : windowMat,wx,wy,frontZ,{castShadow:false});
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
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const roof = new THREE.Mesh(new THREE.ShapeGeometry(shape), darkMat);
  roof.rotation.x = -Math.PI / 2;
  roof.position.y = h + .04;
  roof.receiveShadow = true;
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

function updateWorldStatus() {
  if (worldStatus) {
    const count = discoveryState.found.size;
    const stage = powerRestored
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
  updateWorldStatus();
}

updateWorldStatus();

// Verified frontage-derived massing from Ville de Montréal compilation sheet 31H12-010-0530.
// The footprints are traced from the official 1:1000 building outlines; height remains visual massing,
// not a claim about municipal storey/height attributes. The current slice starts with the closest
// verified frontage ring around the park while the remaining sheet footprints are reconciled.
const VERIFIED_FRONTAGE = [
  [[11.3,2.3],[15.8,15.9],[17.3,-1.8],[11.3,2.3]],
  [[15.1,-28.1],[2.4,-36.2],[-6.8,-37.6],[-9.0,-27.7],[4.8,-22.0],[14.8,-23.3],[15.1,-28.1]],
  [[18.6,-14.9],[28.0,-7.9],[40.9,-8.2],[43.1,-17.6],[36.7,-19.0],[29.5,-22.0],[18.5,-14.9],[18.6,-14.9]],
  [[36.4,24.3],[47.7,21.6],[44.4,12.0],[40.4,13.5],[33.7,10.7],[31.5,8.2],[26.2,6.0],[18.2,16.9],[29.3,21.4],[36.4,24.3]],
  [[-39.6,48.9],[-33.7,58.0],[-27.6,38.7],[-22.8,34.3],[-18.7,24.6],[-27.6,20.8],[-29.7,25.8],[-36.4,39.8],[-37.7,43.2],[-39.6,48.9]],
  [[15.8,52.8],[24.3,56.3],[29.6,55.5],[44.9,63.3],[53.0,66.2],[58.6,67.1],[62.2,57.7],[59.8,56.0],[54.7,54.9],[46.2,51.4],[26.2,42.5],[21.6,40.5],[17.7,39.1],[12.9,37.7],[9.3,35.3],[4.7,33.4],[-0.5,29.9],[-4.4,30.2],[-10.2,27.4],[-18.5,40.1],[-10.2,44.0],[0.8,41.3],[0.7,45.3],[4.7,44.5],[7.1,49.9],[10.8,52.0],[15.8,52.8]],
  [[-39.9,-12.5],[-25.3,-48.2],[-39.2,-41.0],[-43.3,-31.0],[-48.9,-23.9],[-61.6,-21.2],[-42.9,-5.1],[-39.9,-12.4],[-39.9,-12.5]],
  [[16.4,76.1],[29.6,81.6],[33.2,83.1],[40.6,87.5],[45.6,77.0],[37.4,72.8],[29.7,70.0],[18.1,65.2],[11.6,63.8],[11.1,62.4],[3.5,59.2],[-5.4,55.0],[-13.3,51.8],[-18.6,46.4],[-26.0,58.5],[-17.4,62.0],[-8.9,65.5],[-3.4,67.7],[-0.5,68.4],[2.8,70.2],[7.9,71.9],[12.4,75.7],[15.8,75.8],[16.4,76.1]],
  [[-69.9,23.4],[-80.7,7.5],[-70.2,0.9],[-57.2,33.9],[-63.3,33.2],[-75.5,37.2],[-69.9,23.4]],
  [[68.1,-31.1],[75.0,-28.2],[79.2,-26.3],[80.2,-25.5],[82.0,-25.6],[94.2,-33.1],[86.0,-34.6],[80.4,-40.3],[76.4,-39.3],[69.0,-43.6],[62.7,-46.7],[55.2,-49.1],[51.2,-51.0],[46.3,-52.7],[43.2,-56.8],[38.5,-56.6],[35.6,-41.9],[38.4,-41.3],[45.6,-38.9],[49.3,-36.9],[52.7,-35.5],[56.6,-33.3],[66.4,-29.2],[68.1,-31.1]],
  [[-66.9,-46.2],[-58.7,-58.7],[-59.2,-43.1],[-66.9,-46.2]],
  [[69.0,6.9],[62.5,5.4],[61.6,3.3],[54.6,0.4],[49.4,1.7],[47.9,0.3],[47.1,-9.9],[54.2,-12.6],[59.1,-10.3],[63.9,-8.3],[68.6,-6.4],[80.1,-2.1],[87.1,0.6],[110.9,10.9],[114.7,14.1],[127.2,25.3],[118.2,27.0],[111.1,24.1],[102.5,23.9],[98.2,21.9],[92.4,19.5],[88.5,17.9],[84.1,14.9],[76.5,13.0],[72.7,9.9],[68.5,8.1],[69.0,6.9]]
];
const frontageMats = [brickMat, concreteMat, brickDarkMat, brickMat, concreteMat, brickDarkMat];
for (let i=0;i<VERIFIED_FRONTAGE.length;i++) {
  const h = i % 5 === 0 ? 9.0 : (i % 3 === 0 ? 8.5 : 7.5);
  footprintBuilding(VERIFIED_FRONTAGE[i], h, frontageMats[i % frontageMats.length]);
}

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

// Player placeholder — temporary until the first character asset.
const keys = new Set();

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
player.position.set(15,0,20);

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
const mapClose = document.querySelector('#map-close');
mapClose.addEventListener('click', () => toggleMap(false));

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
  updateSnow(dt);

  const moving = locked && (Math.abs(velocity.x) + Math.abs(velocity.z) > .15);
  const bob = moving ? Math.sin(clock.elapsedTime * 11.5) * .035 : 0;
  body.position.y = .9 + bob;
  body.rotation.y = yaw;

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

setTimeout(() => document.querySelector('#loading').classList.add('hidden'), 900);
animate();
