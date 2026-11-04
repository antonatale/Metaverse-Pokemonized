import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { prepare } from '../../src/story/maps';
import { palette, paintGround } from '../../src/render/canvas';
import { FORMIA_AT } from '../../src/data/maps/formia-ground';

/* Formia in 3D, for the trailer: the game's own map raised into a diorama. The ground is the game's painting of it,
   the buildings rise from their footprints with roofs and bell towers, the trees stand where the map has them, the
   sea shines, the mountains close the view; by night the windows and the street lamps light up and the lighthouse
   turns. One scene for every shot (built once); a shot renders it from a camera that is a function of its time.
   Units: one tile of the map is one unit, x east, z south, y up. */

export type Light = 'day' | 'dusk' | 'night';
/** a camera: where it is, where it looks, its field of view; magic makes the motes of the old stones stronger (1 = normal) */
export interface Cam { pos: [number, number, number]; look: [number, number, number]; fov?: number; magic?: number }

const W = 1920, H = 1080;
let built: ReturnType<typeof build> | null = null;
/** a repeatable random number for i */
const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };

function build() {
  const m = prepare('formia'), P = palette();
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(W, H, false);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.0;
  const canvas = renderer.domElement;
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, W / H, 0.1, 600);
  /* the picture goes through a bloom: the lights glow (the composer's own target is multisampled, for clean edges) */
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4 }));
  composer.setPixelRatio(1); composer.setSize(W, H);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.8, 0.55, 0.5);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* the ground: the game's own painting of Formia, without the buildings */
  const groundCv = paintGround(m, P, 1);
  const groundTex = new THREE.CanvasTexture(groundCv);
  groundTex.colorSpace = THREE.SRGBColorSpace; groundTex.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), new THREE.MeshLambertMaterial({ map: groundTex }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(m.w / 2, 0, m.h / 2); ground.receiveShadow = true;
  scene.add(ground);
  /* beyond the map: the sea to the south, the countryside around */
  const far = new THREE.Mesh(new THREE.PlaneGeometry(1200, 1200), new THREE.MeshPhongMaterial({ color: new THREE.Color(P.sea).lerp(new THREE.Color('#3f9fd6'), 0.62), shininess: 140, specular: 0xffffff }));
  far.rotation.x = -Math.PI / 2; far.position.set(m.w / 2, -0.05, m.h / 2 + 560); scene.add(far);
  const land = new THREE.Mesh(new THREE.PlaneGeometry(1200, 600), new THREE.MeshLambertMaterial({ color: P.grass2 }));
  land.rotation.x = -Math.PI / 2; land.position.set(m.w / 2, -0.04, -300 + 1); scene.add(land);

  /* the sea shines: a water sheet over the sea tiles, with little waves that move */
  const mask = document.createElement('canvas'); mask.width = m.w; mask.height = m.h;
  const mc = mask.getContext('2d')!;
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) if (m.cell(x, y).g === 'sea') { mc.fillStyle = '#fff'; mc.fillRect(x, y, 1, 1); }
  const wavesCv = document.createElement('canvas'); wavesCv.width = wavesCv.height = 256;
  const wc = wavesCv.getContext('2d')!, img = wc.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const x = i % 256, y = Math.floor(i / 256), v = Math.sin(x / 9) * Math.cos(y / 13) + Math.sin((x + y) / 21) * 0.6;
    img.data[i * 4] = 128 + v * 40; img.data[i * 4 + 1] = 128 + Math.cos(x / 11 - y / 7) * 40; img.data[i * 4 + 2] = 255; img.data[i * 4 + 3] = 255;
  }
  wc.putImageData(img, 0, 0);
  const waves = new THREE.CanvasTexture(wavesCv); waves.wrapS = waves.wrapT = THREE.RepeatWrapping; waves.repeat.set(24, 12);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(m.w, m.h), new THREE.MeshPhongMaterial({
    color: '#3f9fd6', transparent: true, opacity: 0.62, alphaMap: new THREE.CanvasTexture(mask), normalMap: waves, normalScale: new THREE.Vector2(0.45, 0.45), shininess: 140, specular: 0xffffff
  }));
  water.rotation.x = -Math.PI / 2; water.position.set(m.w / 2, 0.03, m.h / 2);
  scene.add(water);

  /* the buildings: walls, a roof, windows that light up at night */
  const winCv = document.createElement('canvas'); winCv.width = winCv.height = 64;
  const wn = winCv.getContext('2d')!;
  wn.fillStyle = '#000'; wn.fillRect(0, 0, 64, 64); wn.fillStyle = '#ffd98a';
  [[10, 12], [38, 12], [10, 38], [38, 38]].forEach((p) => wn.fillRect(p[0], p[1], 16, 16));
  const winTex = new THREE.CanvasTexture(winCv); winTex.colorSpace = THREE.SRGBColorSpace;
  const WALLS = ['#fffaf0', '#fbe8b8', '#f7cdb9', '#f4dec6', '#dbe7ef', '#e4dfd2'], ROOFS = ['#ff9a8b', '#e8916a', '#9ec5ff', '#ffd166', '#c3a6ff'];
  const wallMats = WALLS.map((c) => new THREE.MeshLambertMaterial({ color: c, emissive: new THREE.Color('#ffc96b'), emissiveMap: winTex, emissiveIntensity: 0 }));
  const roofMats = ROOFS.map((c) => new THREE.MeshLambertMaterial({ color: c }));
  const stone = new THREE.MeshLambertMaterial({ color: '#d8cfbd', emissive: new THREE.Color('#ffc96b'), emissiveMap: winTex, emissiveIntensity: 0 });
  const flat = new THREE.MeshLambertMaterial({ color: '#e9e5da' });
  const HEIGHT: Record<string, [number, number]> = {
    house: [1.0, 1.5], villa: [1.0, 1.4], borgo: [1.3, 1.9], condo: [2.4, 3.4], shop: [1.2, 1.5], school: [1.5, 1.6], parish: [1.8, 1.8], church: [2.0, 2.0],
    collegiata: [2.2, 2.2], station: [1.3, 1.3], palazzo: [2.2, 2.2], arena: [0.9, 0.9], coni: [1.0, 1.0], circolo: [1.2, 1.2], pub: [1.3, 1.3], gelateria: [1.2, 1.2],
    bar: [1.2, 1.2], kiosk: [0.8, 0.8], lido: [0.7, 0.7]
  };
  const boxGeo = new THREE.BoxGeometry(1, 1, 1), roofGeo = new THREE.ConeGeometry(Math.SQRT1_2, 1, 4, 1);
  roofGeo.rotateY(Math.PI / 4);
  const lit: THREE.MeshLambertMaterial[] = wallMats.concat([stone]);
  (m.buildings || []).forEach(function (b, i) {
    const hh = HEIGHT[b.kind] || [1.2, 1.6], h = hh[0] + (hh[1] - hh[0]) * rnd(i + b.x * 7), borgo = b.kind === 'borgo';
    const wall = borgo ? stone : wallMats[Math.floor(rnd(i * 3 + b.y) * wallMats.length)];
    const box = new THREE.Mesh(boxGeo, [wall, wall, flat, flat, wall, wall]);
    box.scale.set(b.w * 0.94, h, b.h * 0.94); box.position.set(b.x + b.w / 2, h / 2, b.y + b.h / 2);
    box.castShadow = true; box.receiveShadow = true; scene.add(box);
    /* pitched roofs on the houses, flat terraces on the blocks of flats */
    if (b.kind !== 'condo' && b.kind !== 'arena' && b.kind !== 'coni' && b.kind !== 'lido') {
      const roof = new THREE.Mesh(roofGeo, roofMats[Math.floor(rnd(i * 5 + 1) * roofMats.length)]);
      roof.scale.set(b.w * 0.98, Math.min(1.1, 0.35 + Math.min(b.w, b.h) * 0.22), b.h * 0.98);
      roof.position.set(b.x + b.w / 2, h + roof.scale.y / 2, b.y + b.h / 2); roof.castShadow = true; scene.add(roof);
    }
    /* the churches have their bell tower */
    if (b.kind === 'church' || b.kind === 'collegiata' || b.kind === 'parish') {
      const bt = new THREE.Mesh(boxGeo, stone); bt.scale.set(0.9, 4.4, 0.9); bt.position.set(b.x + b.w - 0.5, 2.2, b.y + 0.5); bt.castShadow = true; scene.add(bt);
      const tip = new THREE.Mesh(roofGeo, roofMats[0]); tip.scale.set(1, 1, 1); tip.position.set(b.x + b.w - 0.5, 4.9, b.y + 0.5); scene.add(tip);
    }
  });
  /* the towers: Mola by the sea, the octagonal one of Castellone; the lighthouse at the end of the mole */
  const towerMat = new THREE.MeshLambertMaterial({ color: '#e7dcc4' });
  const tower = function (x: number, z: number, h: number, sides: number) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, h, sides), towerMat); t.position.set(x, h / 2, z); t.castShadow = true; scene.add(t);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.35, sides), towerMat); top.position.set(x, h + 0.17, z); scene.add(top);
  };
  const tm = FORMIA_AT['torre-mola'], tc = FORMIA_AT['torre-castellone'];
  if (tm) tower(tm.x + 1, tm.y + 1.5, 4.6, 16);
  if (tc) tower(tc.x + 1, tc.y + 1, 5.4, 8);
  const lighthouse = (m.objects || []).filter((o) => o.kind === 'lighthouse')[0];
  const lx = lighthouse ? lighthouse.x + 0.5 : 97.5, lz = lighthouse ? lighthouse.y + 0.5 : 50.5;
  const lh = new THREE.Group();
  [['#ffffff', 0], ['#e0533d', 1], ['#ffffff', 2]].forEach(function (p) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 1.1, 12), new THREE.MeshLambertMaterial({ color: p[0] as string }));
    s.position.y = 0.55 + (p[1] as number) * 1.1; s.castShadow = true; lh.add(s);
  });
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff2b0' }));
  lamp.position.y = 3.6; lh.add(lamp);
  lh.position.set(lx, 0, lz); scene.add(lh);
  /* the beam of the lighthouse: two cones of light that turn at night */
  const fadeCv = document.createElement('canvas'); fadeCv.width = 4; fadeCv.height = 64;
  const fc = fadeCv.getContext('2d')!, fg = fc.createLinearGradient(0, 0, 0, 64);
  fg.addColorStop(0, '#fff'); fg.addColorStop(0.35, '#777'); fg.addColorStop(1, '#000');
  fc.fillStyle = fg; fc.fillRect(0, 0, 4, 64);
  /* bright at the lamp, fading out over the sea */
  const beamMat = new THREE.MeshBasicMaterial({ color: '#fff3c0', transparent: true, opacity: 0.32, alphaMap: new THREE.CanvasTexture(fadeCv), blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false });
  const beam = new THREE.Group();
  [0, Math.PI].forEach(function (a) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(4.5, 36, 24, 1, true), beamMat);
    cone.rotation.z = Math.PI / 2; cone.position.x = 18; const g = new THREE.Group(); g.add(cone); g.rotation.y = a; beam.add(g);
  });
  beam.position.set(lx, 3.6, lz); scene.add(beam);

  /* trees, palms, cypresses, olives, pines; and the street lamps, with their bulbs */
  const leaf = new THREE.MeshLambertMaterial({ color: '#7cc96f' }), olive = new THREE.MeshLambertMaterial({ color: '#a7bf8f' }), dark = new THREE.MeshLambertMaterial({ color: '#4f9a5a' });
  const trunk = new THREE.MeshLambertMaterial({ color: '#a87b52' });
  const cells: Record<string, [number, number][]> = { tree: [], olive: [], cypress: [], pine: [], palm: [], lamp: [], boat: [], umbrella: [] };
  for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) { const o = m.cell(x, y).obj; if (o && cells[o]) cells[o].push([x, y]); }
  const forest = function (list: [number, number][], geo: THREE.BufferGeometry, mat: THREE.Material, y: number, sx: number, sy: number, shadow = true) {
    const im = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)), d = new THREE.Object3D();
    list.forEach(function (p, i) {
      const k = 0.8 + rnd(p[0] * 31 + p[1]) * 0.4;
      d.position.set(p[0] + 0.5, y * k, p[1] + 0.5); d.scale.set(sx * k, sy * k, sx * k); d.updateMatrix(); im.setMatrixAt(i, d.matrix);
    });
    im.count = list.length; im.castShadow = shadow; scene.add(im);
  };
  const sphere = new THREE.IcosahedronGeometry(0.5, 1), cone = new THREE.ConeGeometry(0.5, 1, 7), stick = new THREE.CylinderGeometry(0.08, 0.1, 1, 6);
  forest(cells.tree, sphere, leaf, 1.0, 1.0, 1.0); forest(cells.tree, stick, trunk, 0.35, 1, 0.7);
  forest(cells.olive, sphere, olive, 0.65, 0.8, 0.7); forest(cells.olive, stick, trunk, 0.25, 1, 0.5);
  forest(cells.cypress, cone, dark, 1.0, 0.5, 2.0);
  forest(cells.pine, new THREE.SphereGeometry(0.5, 10, 6), dark, 1.7, 1.6, 0.55); forest(cells.pine, stick, trunk, 0.8, 1.2, 1.6);
  forest(cells.palm, new THREE.ConeGeometry(0.6, 0.35, 6), leaf, 1.6, 1.4, 1); forest(cells.palm, stick, trunk, 0.8, 0.9, 1.6);
  forest(cells.lamp, stick, new THREE.MeshLambertMaterial({ color: '#3a4470' }), 0.6, 0.6, 1.2, false);
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#fff1c2' });
  forest(cells.lamp, new THREE.SphereGeometry(0.12, 8, 6), bulbMat, 1.25, 1, 1, false);
  /* a soft glow around each bulb at night */
  const glowCv = document.createElement('canvas'); glowCv.width = glowCv.height = 64;
  const gc = glowCv.getContext('2d')!, grad = gc.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,214,140,0.95)'); grad.addColorStop(0.35, 'rgba(255,190,110,0.35)'); grad.addColorStop(1, 'rgba(255,190,110,0)');
  gc.fillStyle = grad; gc.fillRect(0, 0, 64, 64);
  const glowMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(glowCv), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true });
  const glows: THREE.Sprite[] = [];
  cells.lamp.forEach(function (p) { const s = new THREE.Sprite(glowMat); s.position.set(p[0] + 0.5, 1.3, p[1] + 0.5); s.scale.set(1.7, 1.7, 1); scene.add(s); glows.push(s); });
  const lampGlow = new THREE.Sprite(glowMat); lampGlow.position.set(lx, 3.6, lz); lampGlow.scale.set(4, 4, 1); scene.add(lampGlow); glows.push(lampGlow);
  forest(cells.boat, new THREE.BoxGeometry(1, 0.3, 0.45), new THREE.MeshLambertMaterial({ color: '#ffffff' }), 0.15, 0.9, 1);
  forest(cells.umbrella, new THREE.ConeGeometry(0.55, 0.3, 8), new THREE.MeshLambertMaterial({ color: '#ff8fc1' }), 1.0, 1, 1);

  /* the Monti Aurunci behind the town: ridges of noise, low-poly, green below and rock on the tops, into the haze */
  const hash = function (x: number, y: number) { const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return v - Math.floor(v); };
  const vnoise = function (x: number, y: number) {
    const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * su + (c - a) * sv + (a - b - c + d) * su * sv;
  };
  const ridge = function (x: number, y: number) { let v = 0, amp = 0.6, f = 1; for (let o = 0; o < 4; o++) { v += amp * (1 - Math.abs(vnoise(x * f, y * f) * 2 - 1)); f *= 2.1; amp *= 0.42; } return v; };
  const MX = m.w + 240, MZ = 150, mgeo = new THREE.PlaneGeometry(MX, MZ, 240, 110);
  mgeo.rotateX(-Math.PI / 2);
  const mp = mgeo.attributes.position as THREE.BufferAttribute, mcol: number[] = [];
  const LOW = new THREE.Color('#8dba70'), MID = new THREE.Color('#5d9157'), ROCK = new THREE.Color('#aaa796'), tint = new THREE.Color();
  for (let i = 0; i < mp.count; i++) {
    /* in map units: the sheet runs from far in the north to two tiles inside the map's top edge */
    const x = mp.getX(i) + m.w / 2, z = mp.getZ(i) + 2 - MZ / 2;
    const d = Math.max(0, -z), side = Math.max(0, -x, x - m.w), foot = Math.min(1, d / 6), rise = Math.min(1, d / 95);
    let h = foot * (3 + rise * rise * 32) * (0.45 + 0.75 * ridge(x / 34, z / 34)) + Math.min(1, side / 40) * foot * 10 * ridge(x / 18 + 7, z / 18);
    h = Math.max(0, h - 0.5 * (1 - foot));
    mp.setY(i, h);
    const k = Math.min(1, h / 30), n = hash(Math.round(x), Math.round(z)) * 0.1;
    if (k < 0.45) tint.copy(LOW).lerp(MID, Math.min(1, k / 0.45 + n)); else tint.copy(MID).lerp(ROCK, Math.min(1, (k - 0.45) / 0.55 + n));
    mcol.push(tint.r, tint.g, tint.b);
  }
  mgeo.setAttribute('color', new THREE.Float32BufferAttribute(mcol, 3));
  mgeo.computeVertexNormals();
  const mountains = new THREE.Mesh(mgeo, new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }));
  mountains.position.set(m.w / 2, -0.2, 2 - MZ / 2); mountains.receiveShadow = true; scene.add(mountains);
  /* the sky: a dome with the colours of the hour, the stars and the moon at night */
  const sky = new THREE.Mesh(new THREE.SphereGeometry(500, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false,
    uniforms: { top: { value: new THREE.Color('#6fb8ee') }, bottom: { value: new THREE.Color('#e9f6ff') } },
    vertexShader: 'varying float h; void main() { h = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float h; void main() { gl_FragColor = vec4(mix(bottom, top, clamp(h * 2.2, 0.0, 1.0)), 1.0); }'
  }));
  sky.position.set(m.w / 2, 0, m.h / 2); scene.add(sky);
  const starGeo = new THREE.BufferGeometry(), starPos: number[] = [];
  for (let i = 0; i < 700; i++) {
    const a = rnd(i) * Math.PI * 2, e = 0.08 + rnd(i + 0.5) * 1.3, r = 420;
    starPos.push(m.w / 2 + Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, m.h / 2 + Math.sin(a) * Math.cos(e) * r);
  }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#ffffff', size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.9, fog: false }));
  scene.add(stars);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(9, 24, 16), new THREE.MeshBasicMaterial({ color: '#fff4d6', fog: false }));
  moon.position.set(m.w / 2 + 30, 105, -300); scene.add(moon);
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMat.map, color: '#c9d8ff', blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: false }));
  moonGlow.position.copy(moon.position); moonGlow.scale.set(55, 55, 1); scene.add(moonGlow);

  /* the magic of the old stones at night: motes of the five colours rising, fading in and out */
  const dotCv = document.createElement('canvas'); dotCv.width = dotCv.height = 64;
  const dc = dotCv.getContext('2d')!, dg = dc.createRadialGradient(32, 32, 0, 32, 32, 32);
  dg.addColorStop(0, 'rgba(255,255,255,1)'); dg.addColorStop(0.25, 'rgba(255,255,255,0.6)'); dg.addColorStop(1, 'rgba(255,255,255,0)');
  dc.fillStyle = dg; dc.fillRect(0, 0, 64, 64);
  const MAGIC = ['#8fd0f6', '#ffa04a', '#c3a0ff', '#ffd84d', '#ff8fc1'].map((c) => new THREE.Color(c));
  const homes: [string, number, number][] = [['torre-castellone', 7, 0.42], ['mamurra', 6, 0.24], ['pineta', 8, 0.22], ['tomba', 3, 0.12]];
  const MOTES = 360, moteGeo = new THREE.BufferGeometry(), motePos = new Float32Array(MOTES * 3), moteCol = new Float32Array(MOTES * 3);
  const motesAt: { x: number; z: number; h: number; sp: number; ph: number; c: THREE.Color }[] = [];
  for (let i = 0; i < MOTES; i++) {
    let r = rnd(i + 0.31), k = 0;
    while (k < homes.length - 1 && r > homes[k][2]) { r -= homes[k][2]; k++; }
    const a = FORMIA_AT[homes[k][0]], cx = a ? a.x + a.w / 2 : m.w / 2, cz = a ? a.y + a.h / 2 : m.h / 2, ang = rnd(i + 0.7) * Math.PI * 2, d = Math.sqrt(rnd(i + 0.9)) * homes[k][1];
    motesAt.push({ x: cx + Math.cos(ang) * d, z: cz + Math.sin(ang) * d * 0.7, h: 3 + rnd(i + 0.2) * 7, sp: 0.06 + rnd(i + 0.4) * 0.1, ph: rnd(i + 0.6), c: MAGIC[i % 5] });
  }
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3)); moteGeo.setAttribute('color', new THREE.BufferAttribute(moteCol, 3));
  const motes = new THREE.Points(moteGeo, new THREE.PointsMaterial({ size: 0.75, map: new THREE.CanvasTexture(dotCv), vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  motes.frustumCulled = false; scene.add(motes);
  function moveMotes(t: number, k: number) {
    motesAt.forEach(function (q, i) {
      const life = (t * q.sp + q.ph) % 1, glow = Math.sin(life * Math.PI) * k;
      motePos[i * 3] = q.x + Math.sin(t * 0.7 + i) * 0.5; motePos[i * 3 + 1] = 0.4 + life * q.h; motePos[i * 3 + 2] = q.z + Math.cos(t * 0.5 + i * 1.3) * 0.5;
      moteCol[i * 3] = q.c.r * glow; moteCol[i * 3 + 1] = q.c.g * glow; moteCol[i * 3 + 2] = q.c.b * glow;
    });
    moteGeo.attributes.position.needsUpdate = true; moteGeo.attributes.color.needsUpdate = true;
  }

  /* light */
  const hemi = new THREE.HemisphereLight('#d8ecff', '#8fbf73', 0.7); scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff1d0', 2.2);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera as THREE.OrthographicCamera; sc.left = -60; sc.right = 60; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 260;
  sun.shadow.bias = -0.0008; scene.add(sun); scene.add(sun.target);
  scene.fog = new THREE.Fog('#e9f6ff', 120, 380);
  /* a few warm pools of light in the squares at night */
  const pools: THREE.PointLight[] = [];
  [['piazza', 4, 3], ['morgana', 2, 3], ['bar', 2, 3], ['stazione', 4, 3], ['gelati', 2, 3], ['comune', 4, 3]].forEach(function (q) {
    const a = FORMIA_AT[q[0] as string]; if (!a) return;
    const pl = new THREE.PointLight('#ffb862', 0, 14, 1.6); pl.position.set(a.x + (q[1] as number), 2.2, a.y + (q[2] as number)); scene.add(pl); pools.push(pl);
  });

  function setLight(mode: Light) {
    const night = mode === 'night', dusk = mode === 'dusk';
    const u = (sky.material as THREE.ShaderMaterial).uniforms;
    u.top.value.set(night ? '#0b1640' : dusk ? '#3f4f9a' : '#6fb8ee');
    u.bottom.value.set(night ? '#243a7a' : dusk ? '#ffb27a' : '#e9f6ff');
    (scene.fog as THREE.Fog).color.set(night ? '#1a2a5c' : dusk ? '#e9a982' : '#e9f6ff');
    hemi.color.set(night ? '#3a4f9a' : dusk ? '#ffd2b0' : '#d8ecff'); hemi.groundColor.set(night ? '#141a33' : '#8fbf73'); hemi.intensity = night ? 0.55 : 0.7;
    sun.color.set(night ? '#9fb8ff' : dusk ? '#ffb27a' : '#fff1d0'); sun.intensity = night ? 0.55 : dusk ? 1.6 : 2.0;
    lit.forEach(function (mt) { mt.emissiveIntensity = night ? 1.0 : dusk ? 0.35 : 0; });
    glows.forEach(function (g) { g.visible = night || dusk; });
    bulbMat.color.set(night || dusk ? '#fff1c2' : '#cfd6e6');
    stars.visible = night; moon.visible = night; moonGlow.visible = night;
    beam.visible = night || dusk;
    pools.forEach(function (pl) { pl.intensity = night ? 9 : 0; });
    motes.visible = night;
    renderer.toneMappingExposure = night ? 1.2 : 1.0;
    bloom.strength = night ? 0.55 : dusk ? 0.35 : 0.1; bloom.radius = night ? 0.4 : 0.3; bloom.threshold = night ? 0.62 : dusk ? 0.75 : 0.95;
  }
  return { renderer, canvas, composer, camera, sun, moon, beam, waves, setLight, moveMotes };
}

/** renders Formia from a camera, at time t (seconds, for the waves and the lighthouse), into the element */
export function city(el: HTMLElement, mode: Light) {
  if (!built) built = build();
  const B = built;
  return function (cam: Cam, t: number) {
    if (B.canvas.parentElement !== el) el.appendChild(B.canvas);
    B.setLight(mode);
    B.camera.fov = cam.fov || 42; B.camera.updateProjectionMatrix();
    B.camera.position.set(cam.pos[0], cam.pos[1], cam.pos[2]); B.camera.lookAt(cam.look[0], cam.look[1], cam.look[2]);
    /* the sun from the south-west (low in the west at dusk); at night the moon over the mountains, shining on the sea;
       the shadows follow the camera */
    const lx = cam.look[0], lz = cam.look[2];
    if (mode === 'night') { const d = B.moon.position.clone().sub(new THREE.Vector3(lx, 0, lz)).setLength(90); B.sun.position.set(lx + d.x, d.y, lz + d.z); }
    else if (mode === 'dusk') B.sun.position.set(lx - 80, 22, lz + 30);
    else B.sun.position.set(lx - 40, 60, lz + 50);
    B.sun.target.position.set(lx, 0, lz); B.sun.target.updateMatrixWorld();
    B.beam.rotation.y = t * 0.9;
    B.waves.offset.set(t * 0.02, t * 0.013);
    B.moveMotes(t, cam.magic == null ? 1 : cam.magic);
    B.composer.render();
  };
}
/** a camera gliding through keyframes on one smooth curve, at an even speed; p (0–1) is already eased by the caller */
export function glide(keys: Cam[], p: number): Cam {
  const v = (a: [number, number, number]) => new THREE.Vector3(a[0], a[1], a[2]);
  const q = Math.min(1, Math.max(0, p));
  const pos = new THREE.CatmullRomCurve3(keys.map((k) => v(k.pos))).getPointAt(q), look = new THREE.CatmullRomCurve3(keys.map((k) => v(k.look))).getPointAt(q);
  const f = Math.min(keys.length - 1 - 1e-6, q * (keys.length - 1)), i = Math.floor(f), u = f - i;
  const a = keys[i], b = keys[i + 1], mix = (x: number, y: number) => x + (y - x) * u;
  return { pos: [pos.x, pos.y, pos.z], look: [look.x, look.y, look.z], fov: mix(a.fov || 42, b.fov || 42), magic: mix(a.magic == null ? 1 : a.magic, b.magic == null ? 1 : b.magic) };
}
