import { ITEMS } from '../data/items';
import type { Npc } from '../data/maps/types';
import { T, hash, palette, paintGround, tallFront, paintObject, walker, PEOPLE, PEOPLE_FORMS, LOOKS, townsperson, HEIGHT, type Palette, type Sprite } from './canvas';
import { st } from '../save/story-progress';
import { M, prepare, present, blocked, key, DV, wildNow, petAt, moveMode, moto, isSea, type PreparedMap } from '../story/maps';
import { leadCreature, idOf, creatureOf, formNow, firstHuman } from '../story/growth';
import type { FriendId } from '../data/characters';
import { mover, parity, STEP, gear, van } from '../story/movement';
import { vanSprite, VAN_W, VAN_H } from './canvas/van';
import { roadShift } from '../story/van';
/** the van is drawn smaller than its picture: a lane wide */
const VAN_K = 0.6;
import { covoOfBuilding } from '../data/covo-places';
import { covoState, lairsKey, hasGift } from '../story/lairs';
import { auraBack, auraFront, ambience, type AuraAt } from './canvas/covo';
import { motoParked, motoRider, MOTO_W, MOTO_H } from './canvas/moto';
import type { PersonLook } from './canvas/walkers';
import type { Dir } from '../data/maps/types';
import { mk } from './canvas/draw';
import { run } from '../story/run';
import { lead, pump, PUMP } from '../story/lead';
import { placeNow } from '../story/place-run';
import { drawThings } from './canvas/place';
import { heading, nextStop } from '../story/goals';
import { darkness, sunset, sunAt } from '../story/daytime';
import { creature, MAGIC } from './svg/creatures';
import { cicero, mamurra } from './svg/cicero';
import { SPECIES } from '../data/creatures';
import type { SpeciesId } from '../data/creatures';
import { FORMIA_AT, FORMIA_SPOT, FORMIA_HIDING } from '../data/maps/formia-ground';
import { BOTTLES } from '../data/maps/formia';
import { reduced } from '../ui/dom';
import { rich } from '../ui/gfx';
import { shade, volume, seaLife, pigeons, butterflies, fireflies, hawks, landing, wind, SWAY, type Caster, type Tiles } from './atmosphere';
import { root, cv, ctx, ciceroShown, skyFrom, skyWho, SKY_MS } from '../ui/story-screen';

/* Drawing the story map: camera, cached pictures, everything sorted so people walk behind trees and roofs.
   This is the part a Phaser scene will take over; it only reads the story's state. */
const CH = 12;   /* tiles per side of a cached piece of ground */
let CACHE_MAX = 12;   /* pieces kept: more while a winged creature shows Formia from above */
function dpr() { return Math.min(2, window.devicePixelRatio || 1); }
type Walker = Record<string, HTMLCanvasElement[]>;
/** something drawn in the sorted pass: a still picture, or a person (walker frames, facing, frame) */
interface Drawn { yb: number; x: number; y?: number; spr?: Sprite; w?: Walker; d?: string; f?: number; img?: HTMLImageElement; glow?: string; alpha?: number; size?: number; z?: number;
  /** a walker's little hop at each step (px), and how much it breathes standing still (its height, around 1) */
  hop?: number; breath?: number;
  /** Antonio, his creature, his scooter: shown through what hides them (see drawSorted) */
  me?: boolean;
  /** a creature walking: how far it rocks (radians) and how tall it is for a moment (around 1) */
  tilt?: number; sq?: number;
  /** out at sea: in the water to the waist, standing on a paddle board, sitting in a gozzo (with its colour) */
  float?: 'swim' | 'sup' | 'boat' | 'windsurf' }
interface SceneItem { x: number; yb: number; spr: Sprite; bob: boolean; glide: number; lit?: boolean; glow?: HTMLCanvasElement | null;
  /** the light and the wind (render/atmosphere.ts): how much it leans in the wind; the block that casts its shadow (a
      building), or none when it floats; the same picture without the light on it, to find its windows at night */
  sway?: number; box?: Caster['box']; afloat?: boolean; flat?: () => Sprite;
  /** thin over the street (lights on a wire): it does not count as hiding Antonio */
  thin?: boolean }
/** a light of the night, in map px: a soft circle of radius r, with a warm glow (warm) and maybe a bright bulb */
interface Light { x: number; y: number; r: number; a: number; warm: number; bulb?: [number, number] }

/* ---------- drawing ---------- */
/* DPR: device pixels per CSS pixel. Z: map zoom (big screens see the map larger). VS = DPR × Z: device pixels
   per map pixel on screen. RS: the resolution the cached pictures are painted at, the same as VS so zoomed
   tiles stay sharp, but at most 3 so a big map's ground stays a reasonable size in memory. */
var DPR = dpr(), Z = 1, VS = DPR, RS = DPR, P = null as unknown as Palette, themeK = '', themeAt = 0, previewEl: HTMLElement | null = null;
var cache: { map: string | null; theme: string; chunks: Record<string, HTMLCanvasElement>; order: string[]; items: SceneItem[]; lights: Light[] } = { map: null, theme: '', chunks: {}, order: [], items: [], lights: [] };
var walkers: Record<string, Walker> = {}, sprites: Record<string, Sprite> = {};
/* how far above its footprint each kind of thing is drawn */
const UP = HEIGHT;
/** how far a building is drawn above its footprint, in px: its own `up` (the palazzi of the cortine), or its kind's */
function upOf(b: { kind: string; up?: number }) { return b.up != null ? b.up * T : UP[b.kind] || T; }
var SCOOTERS = ['#5b8fd9', '#e86a5c', '#fffdf6', '#57c968', '#ffd166', '#3c4658', '#ff8fc1'], GOZZI = ['#3f7ccf', '#ffffff', '#2c9a55', '#e9765f', '#ffd166', '#8fd0f6'], CARS = ['#e86a5c', '#5b8fd9', '#fffdf6', '#3c4658', '#ffd166', '#9aa3b2', '#57c968', '#b03a48'], UMBRELLAS = ['#ff8fc1', '#8fd0f6', '#ffd166'], BOATS = ['#ffffff', '#ffe9a8'], SAILS = ['#ff8a3c', '#3f9fc4', '#e9765f', '#57c968', '#ffd166'];
function themeKey() { return getComputedStyle(document.documentElement).getPropertyValue('--m-paper').trim() + '|' + RS; }
/* the tall still things of a map, sorted by their bottom edge (the ground is painted in pieces, see chunk) */
/** a bottle adrift, drawn once */
var bottleSpr: Sprite | null = null, bottleRS = 0;
function bottleSprite(rs: number): Sprite { if (!bottleSpr || bottleRS !== rs) { bottleSpr = paintObject('bottle', P, rs, { up: UP.bottle }); bottleRS = rs; } return bottleSpr; }
function sceneItems(m: PreparedMap, P0: Palette, s: number): SceneItem[] {
  var items: SceneItem[] = [], spr: Record<string, Sprite> = {};
  var add = function (x: number, yb: number, sp: Sprite, bob?: boolean, glide?: number, lit?: boolean): SceneItem {
    var it: SceneItem = { x: x, yb: yb, spr: sp, bob: !!bob, glide: glide || 0, lit: !!lit };
    items.push(it);
    return it;
  };
  /* a block casts the shadow of its footprint, as high as it stands over it (and a little more: its front has a height too) */
  var block = function (x: number, y: number, w: number, h: number, kind: string, up?: number) { return { x: x * T, y: y * T, w: w * T, h: h * T, up: (up != null ? up : UP[kind] || T) + T * 0.45 }; };
  for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
    var L = m.cell(x, y);
    if (!L.obj) continue;
    var sail = L.obj === 'board' || L.obj === 'windsurf';
    var color = L.obj === 'car' ? CARS[Math.floor(hash(x, y, 41) * CARS.length)] : L.obj === 'scooter' ? SCOOTERS[Math.floor(hash(x, y, 47) * SCOOTERS.length)] : L.obj === 'umbrella' ? UMBRELLAS[(x + y) % 3] : L.obj === 'boat' ? BOATS[(x + y) % 2] : L.obj === 'gozzo' ? GOZZI[Math.floor(hash(x, y, 43) * GOZZI.length)] : sail ? SAILS[(x * 3 + y) % SAILS.length] : null, k = L.obj + (color || '');
    if (!spr[k]) spr[k] = volume(paintObject(L.obj, P0, s, { color: color, up: UP[L.obj] }), P0);
    /* the windsurfers glide back and forth across the bay */
    var it = add(x * T, (y + 1) * T, spr[k], L.obj === 'boat' || L.obj === 'gozzo' || L.obj === 'windsurf', L.obj === 'windsurf' ? 3 : 0);
    it.sway = SWAY[L.obj] || 0; it.afloat = L.g === 'sea';
  }
  var nextId = nextStop().id;
  (m.buildings || []).forEach(function (b) {
    /* at night the windows light up: in every place, and in most of the houses */
    var lit = b.id.indexOf('casa-') !== 0 || hash(b.x, b.y, 7) < 0.7;
    var up = upOf(b);
    /* a covo of the friends: as it stands now (story/lairs.ts); the home of the one played is a home */
    var cp = b.kind === 'covo' ? covoOfBuilding(b.id) : null, cs = cp ? covoState(cp.covo, nextId) : undefined;
    if (cp && cs === 'mine' && cp.base && UP[cp.base]) up = UP[cp.base];
    var label = cp && cs !== 'mine' ? cp.title : b.label;
    var paint = function () { return paintObject(b.kind, P0, s, { w: b.w, h: b.h, up: up, x: b.x, doorX: b.door[0], label: label, roof: b.roof, awning: b.awning, v: b.v, look: b.look, state: cs, base: cp ? cp.base : undefined }); };
    var it = add(b.x * T, (b.y + b.h) * T, volume(paint(), P0), false, 0, lit);
    it.box = block(b.x, b.y, b.w, b.h, b.kind, b.up != null ? up : undefined); it.flat = paint;
  });
  (m.objects || []).forEach(function (o) {
    var it = add(o.x * T, (o.y + o.h) * T, volume(paintObject(o.kind, P0, s, { w: o.w, h: o.h, up: UP[o.kind] || T, color: o.color }), P0), o.bob);
    /* wide things are blocks; slender ones (a monument, the lighthouse) are laid down as they are drawn */
    if (o.w * o.h > 2) it.box = block(o.x, o.y, o.w, o.h, o.kind);
    it.afloat = !!o.bob || m.cell(o.x, o.y).g === 'sea';
  });
  /* the lights across a lane: their foot just past the lane, so that whoever walks there passes under them */
  (m.festoons || []).forEach(function (f) {
    var raw = paintObject('festoon', P0, s, { w: f.x1 - f.x0 + 1, h: 1, up: UP.festoon });
    var it = add(f.x0 * T, (f.y + 1) * T + 2, volume(raw, P0), false, 0, true);
    it.thin = true; it.flat = function () { return raw; };
  });
  if (m.signs && m.signs.length) {
    var sg = volume(paintObject('sign', P0, s, {}), P0), vw = volume(paintObject('viewer', P0, s, {}), P0), by: Record<string, Sprite> = {};
    m.signs.forEach(function (g) {
      if (g.quiet) return;
      /* a buoy out at sea: white for the bathing waters, yellow on the shoals, red in the middle of the gulf */
      if (g.buoy) { var bc = g.view ? '#e9765f' : g.text[0].indexOf('gialla') >= 0 ? '#ffd166' : '#ffffff'; add(g.x * T, (g.y + 1) * T, by[bc] || (by[bc] = volume(paintObject('buoy', P0, s, { color: bc, up: UP.buoy }), P0)), true).afloat = true; return; }
      /* a plate with the name of its street on it, three tiles wide around its pole */
      if (g.plate) { var nm = g.text[0].replace(/\.$/, ''); add((g.x - 1) * T, (g.y + 1) * T, by['plate:' + nm] || (by['plate:' + nm] = volume(paintObject('streetPlate', P0, s, { w: 3, h: 1, label: nm, up: UP.streetPlate }), P0))); return; }
      add(g.x * T, (g.y + 1) * T, g.view ? vw : sg);
    });
  }
  items.sort(function (a, b) { return a.yb - b.yb; });
  return items;
}
var auras: AuraAt[] = [];
function ensureCaches(now: number) {
  /* the covi change with the story (story/lairs.ts): the key of how they stand goes with the theme's */
  if (!themeK || now - themeAt > 500) { themeK = themeKey() + '|' + (M.id === 'formia' ? lairsKey(nextStop().id) : ''); themeAt = now; }
  if (cache.map === M.id && cache.theme === themeK) return;
  P = palette();
  cache.items = sceneItems(M, P, RS); cache.lights = lightsOf(M); cache.chunks = {}; cache.order = []; sprites = {};
  cache.map = M.id; cache.theme = themeK;
  /* the auras of the covi still to beat: the next one burns */
  var nid = nextStop().id;
  auras = (M.inside ? [] : M.buildings || []).filter(function (b) { return b.kind === 'covo'; }).map(function (b): AuraAt | null {
    var cp = covoOfBuilding(b.id), cs = cp ? covoState(cp.covo, nid) : 'mine';
    return cs === 'next' || cs === 'waiting' ? { x: b.x * T, y: b.y * T, w: b.w * T, h: b.h * T, up: upOf(b), look: b.look || '', next: cs === 'next' } : null;
  }).filter(function (a): a is AuraAt { return !!a; });
}
/* the ground is painted in square pieces as they come into view, and the least recently used are dropped */
function chunk(cx: number, cy: number): HTMLCanvasElement {
  var k = cx + ',' + cy, c0 = cache.chunks[k], i = cache.order.indexOf(k);
  if (c0) { if (i < cache.order.length - 1) { cache.order.splice(i, 1); cache.order.push(k); } return c0; }
  c0 = paintGround(M, P, RS, { x: cx * CH, y: cy * CH, w: Math.min(CH, M.w - cx * CH), h: Math.min(CH, M.h - cy * CH) });
  cache.chunks[k] = c0; cache.order.push(k);
  while (cache.order.length > CACHE_MAX) delete cache.chunks[cache.order.shift()!];
  return c0;
}
function walkerFor(n: Pick<Npc, 'person' | 'seed' | 'look'>, s: number): Walker {
  /* a friend wears what the story has brought it to */
  var form = n.person ? formNow(n.person) : 0, id = (n.person || n.look || ('npc' + n.seed)) + (form ? 'f' + form : '') + '@' + s;
  return walkers[id] || (walkers[id] = walker(n.person ? Object.assign({}, PEOPLE[n.person], form ? PEOPLE_FORMS[n.person][form - 1] : null) : n.look ? LOOKS[n.look] : townsperson(n.seed!), s));
}
/** how whoever is played looks now: for the leg and the arm on the scooter */
function lookFor(id: FriendId): PersonLook { var form = formNow(id); return Object.assign({}, PEOPLE[id], form ? PEOPLE_FORMS[id][form - 1] : null); }
/* ---------- the scooter (render/canvas/moto.ts): parked where it was left, or under whoever is played ---------- */
var parkedCv: Record<string, HTMLCanvasElement> = {}, riderCv: HTMLCanvasElement | null = null, riderS = 0, turned = { dir: '' as string, at: 0 };
function parkedMoto(s: number): Drawn | null {
  var p = moto();
  if (st.sella || M.inside || p.map !== M.id) return null;
  var id = p.dir + '@' + s, cvs = parkedCv[id] || (parkedCv[id] = motoParked(P || palette(), s, p.dir));
  return { yb: (p.y + 1) * T - 0.4, x: p.x * T - (MOTO_W - T) / 2, spr: { cv: cvs, w: MOTO_W, h: MOTO_H, up: MOTO_H - T } };
}
function rider(now: number, s: number, pp: { x: number; y: number }): Drawn {
  if (!riderCv || riderS !== s) { riderCv = mk(MOTO_W * s, MOTO_H * s); riderS = s; }
  if (turned.dir !== st.dir) turned = { dir: st.dir, at: now };
  /* it leans into a bend for a moment (seen from in front or behind), and trembles with the engine under way */
  var since = now - turned.at, upDown = st.dir === 'up' || st.dir === 'down';
  var lean = reduced || !mover || since > 260 || !upDown ? 0 : 0.09 * Math.sin(since / 260 * Math.PI) * (hash(Math.round(turned.at), 3, 7) < 0.5 ? -1 : 1);
  var bob = reduced || !mover ? 0 : Math.sin(now / 38) * (0.35 + gear * 0.1);
  var uid = leadCreature();
  motoRider(riderCv, P || palette(), s, st.dir as Dir, { walker: walkerFor(hero(), s) as Record<Dir, HTMLCanvasElement[]>, look: lookFor(hero().person), pet: uid ? creatureImage(idOf(uid) as SpeciesId) : null, bob: bob, lean: lean });
  return { yb: pp.y + T + 0.5, x: pp.x - (MOTO_W - T) / 2, spr: { cv: riderCv, w: MOTO_W, h: MOTO_H, up: MOTO_H - T } };
}
/** the puffs of the exhaust behind the scooter under way: three of them, each growing and fading as it falls behind */
function exhaust(c: CanvasRenderingContext2D, now: number, pp: { x: number; y: number }) {
  if (reduced || !mover || !st.sella) return;
  var v = DV[st.dir], bx = pp.x + T / 2 - v[0] * 20 + (v[0] ? 0 : 5), by = pp.y + T - 7 - v[1] * 14 - (v[1] > 0 ? 8 : 0);
  c.fillStyle = (P || palette()).chrome;
  for (var i = 0; i < 3; i++) {
    var t = (now / (340 - gear * 30) + i / 3) % 1;
    c.globalAlpha = (1 - t) * 0.5;
    c.beginPath(); c.arc(bx - v[0] * t * 16 + Math.sin((t + i) * 5) * 1.5, by - v[1] * t * 12 - t * 5, 1.6 + t * 3.4, 0, Math.PI * 2); c.fill();
  }
  c.globalAlpha = 1;
}
/* the wild creatures on the map: their battle picture, as an image (it loads once, and until then they are not drawn) */
var monImg: Partial<Record<SpeciesId, { img: HTMLImageElement; ok: boolean }>> = {};
/** a creature's picture has a margin around the box it is drawn in: this much of the box, on each side */
const PAD = 0.12;
type PaddedImage = HTMLImageElement & { pad?: number };
/** draws a creature's picture with its box at (x, y), z × zh px: the margin around it falls outside */
function drawMon(c: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, z: number, zh?: number) {
  var p = (img as PaddedImage).pad || 0, h = zh || z;
  c.drawImage(img, x - z * p, y - h * p, z * (1 + 2 * p), h * (1 + 2 * p));
}
function creatureImage(sp: SpeciesId): HTMLImageElement | null {
  var m = monImg[sp];
  if (!m) {
    var img = new Image(), entry = { img: img, ok: false };
    monImg[sp] = entry;
    img.onload = function () { entry.ok = true; };
    /* painted with a margin around its 200 × 200 box (PAD of it on each side), so that a dragon's wings are not cut */
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(creature(sp, 'smirk', '', (-PAD * 200) + ' ' + (-PAD * 200) + ' ' + (200 + PAD * 400) + ' ' + (200 + PAD * 400), 'smirk'));
    (img as PaddedImage).pad = PAD;
    return null;
  }
  return m.ok ? m.img : null;
}
/* ---------- Nicola's van, and Nicola walking with the player ----------
   The van is drawn where it drives (story/movement.ts van): with the player in it, in the player's place (the camera
   follows it); coming up the street, on its own; parked (st.van), empty, where it stopped. */
var vanSprites: Record<string, Sprite> = {}, vanN = 0;
function vanDrawn(now: number, x: number, y: number, dir: Dir, driver: boolean, rider: boolean, moving: boolean): Drawn {
  var laugh = driver && moving && !reduced && Math.floor(now / 1300) % 4 === 0, bob = moving && !reduced ? Math.round(Math.sin(now / 50) * 2) / 4 : 0;
  var k = dir + (driver ? 'd' : '') + (rider ? 'r' + firstHuman() : '') + (laugh ? 'l' : '') + bob + '@' + RS;
  if (!vanSprites[k]) {
    if (++vanN > 60) { vanSprites = {}; vanN = 0; }
    /* drawn at VAN_K of its size: a van as wide as a lane, its wheels on the road (13 November 2026) */
    vanSprites[k] = { cv: vanSprite(P || palette(), RS * VAN_K, dir, driver ? LOOKS.nicola : null, rider ? lookFor(firstHuman() as FriendId) : null, laugh, bob), w: VAN_W * VAN_K, h: VAN_H * VAN_K, up: VAN_H * VAN_K - T };
  }
  /* in the middle of the street, never over the water (story/van.ts) */
  var sh = M && !M.inside ? roadShift(M, Math.round(x / T), Math.round(y / T), dir, T) : { dx: 0, dy: 0 };
  return { yb: y + T + 0.5 + sh.dy, x: x - (VAN_W * VAN_K - T) / 2 + sh.dx, spr: vanSprites[k] };
}
function vanNow(now: number, pp: { x: number; y: number }): Drawn | null {
  if (van) {
    if (van.carry) return Object.assign(vanDrawn(now, pp.x, pp.y, van.dir, true, true, !!mover), { me: true });
    var t = van.dur ? Math.min(1, (now - van.t0) / van.dur) : 1;
    return vanDrawn(now, (van.fx + (van.x - van.fx) * t) * T, (van.fy + (van.y - van.fy) * t) * T, van.dir, true, false, t < 1);
  }
  var v = st.van;
  if (!v || v.map !== M.id || M.inside) return null;
  return vanDrawn(now, v.x * T, v.y * T, v.dir, false, false, false);
}
/* Nicola walks behind: in the tile the creature has just left (or the player, when there is no creature with him). He
   stays out of houses, and off the scooter: back outside, or down from it, he is put behind again */
var comp: { map: string; x: number; y: number; fx: number; fy: number; t0: number } | null = null, compStep = -1, trail: [number, number][] = [];
function placeComp() {
  var f = fol && fol.map === M.id ? [fol.x, fol.y] : null, v = DV[st.dir];
  /* beside the player first (in sight), then behind; never where the van or a roof would hide him */
  var around: [number, number][] = [[st.x + 1, st.y], [st.x - 1, st.y], [st.x - v[0], st.y - v[1]], [st.x + 1, st.y + 1], [st.x - 1, st.y + 1], [st.x, st.y + 1], [st.x - v[0] * 2, st.y - v[1] * 2], [st.x, st.y - 1]];
  /* at sea he sails on the water beside the player */
  var free = function (c: [number, number]) { return moveMode.swim ? isSea(M, c[0], c[1]) && !M.people.some(function (p) { return p.x === c[0] && p.y === c[1]; }) : !blocked(M, c[0], c[1]) && !M.at[key(c[0], c[1])]; };
  var at = around.filter(function (c) { return free(c) && !(f && f[0] === c[0] && f[1] === c[1]); })[0] || [st.x, st.y];
  comp = { map: M.id, x: at[0], y: at[1], fx: at[0], fy: at[1], t0: 0 }; trail = [];
}
/** where Nicola is standing, when he walks with the player, for talking to him */
export function companionAt(): [number, number] | null { return comp && st.companion && comp.map === M.id && !M.inside && !st.sella && !van ? [comp.x, comp.y] : null; }
var compN = 0;
function companion(now: number): Drawn | null {
  /* at the start of a story he sails ahead to Gianola, and back alone (story/lead.ts) */
  var L = lead.now;
  if (L && M.id === 'formia' && !M.inside) {
    comp = null;
    var lx = L.x * T, ly = L.y * T, bob = reduced ? 0 : Math.sin(now / 500 + 1.3) * 1.5;
    return { yb: ly + T + bob, x: lx, y: ly + bob, w: walkerFor({ look: 'nicola' }, RS), d: L.dir, f: 0, hop: 0, float: 'windsurf', alpha: L.alpha < 1 ? L.alpha : undefined, breath: 1 };
  }
  if (st.companion !== 'nicola' || M.inside || st.sella || van) { comp = null; return null; }
  if (!comp || comp.map !== M.id || (!mover && Math.abs(comp.x - st.x) + Math.abs(comp.y - st.y) > 3)) placeComp();
  var c = comp!;
  if (mover && mover.t0 !== compStep) {
    compStep = mover.t0; compN++;
    trail.unshift([mover.fx, mover.fy]); trail.length = Math.min(trail.length, 3);
    var to = leadCreature() ? trail[1] : trail[0];
    if (to && (to[0] !== c.x || to[1] !== c.y)) { c.fx = c.x; c.fy = c.y; c.x = to[0]; c.y = to[1]; c.t0 = mover.t0; }
  }
  var t = Math.min(1, (now - c.t0) / STEP), going = t < 1 && !reduced, d = c.x > c.fx ? 'right' : c.x < c.fx ? 'left' : c.y < c.fy ? 'up' : c.y > c.fy ? 'down' : st.dir;
  var wx = (c.fx + (c.x - c.fx) * t) * T, wy = (c.fy + (c.y - c.fy) * t) * T, wet = isSea(M, c.x, c.y);
  /* on the water he is on his own windsurf */
  return { yb: wy + T, x: wx, y: wy, w: walkerFor({ look: 'nicola' }, RS), d: d, f: going && !wet ? 1 + (compN & 1) : 0, hop: going && !wet ? stepHop(t) : 0, float: wet ? 'windsurf' : undefined, breath: going || reduced ? 1 : 1 + 0.014 * Math.sin(now / 760 + 2) };
}
/* the ghost of Cicero appears near Antonio, a little behind him, see-through, only while he has something to say
   (ciceroShown fades him in and out) */
var ghostImg: { img: HTMLImageElement; ok: boolean } | null = null;
function ghost(now: number, pp: { x: number; y: number }): Drawn | null {
  if (!ghostImg) {
    var img = new Image(), g = { img: img, ok: false };
    ghostImg = g; img.onload = function () { g.ok = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(cicero());
  }
  var a = ciceroShown(now);
  if (!ghostImg.ok || !a) return null;
  var bob = reduced ? 0 : Math.sin(now / 900) * 4, sway = reduced ? 0 : Math.sin(now / 2300) * 3, rise = reduced ? 0 : (1 - a) * 10;
  return { yb: pp.y + T * 0.35 + bob - rise, x: pp.x - 26 + sway, img: ghostImg.img, alpha: 0.6 * a, size: 34 };
}
/* Mamurra's ghost, on the map */
var mamImg: { img: HTMLImageElement; ok: boolean } | null = null;
function mamurraImage(): HTMLImageElement | null {
  if (!mamImg) {
    var img = new Image(), g = { img: img, ok: false };
    mamImg = g; img.onload = function () { g.ok = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(mamurra());
  }
  return mamImg.ok ? mamImg.img : null;
}
/* Antonio's creature walks behind him: at each of his steps it moves to the tile he has just left. After a door,
   a warp or a scooter ride it is put behind him again */
var fol: { map: string; x: number; y: number; fx: number; fy: number; t0: number } | null = null, folStep = -1, folN = 0;
function placeBehind() {
  var v = DV[st.dir], around: [number, number][] = [[st.x - v[0], st.y - v[1]], [st.x, st.y + 1], [st.x - 1, st.y], [st.x + 1, st.y], [st.x, st.y - 1]];
  var at = around.filter(function (c) { return !blocked(M, c[0], c[1]) && !M.at[key(c[0], c[1])]; })[0] || [st.x, st.y];
  fol = { map: M.id, x: at[0], y: at[1], fx: at[0], fy: at[1], t0: 0 };
}
/** where Antonio's creature is standing on the map he is on, for talking to it */
export function followerAt(): [number, number] | null { return fol && fol.map === M.id && leadCreature() ? [fol.x, fol.y] : null; }
/** how big the creature that follows is drawn, in px (a wild one, or one at home, is 52) */
const FOLLOWER = 44;
function follower(now: number): Drawn | null {
  var uid = leadCreature(), img = uid ? creatureImage(idOf(uid) as SpeciesId) : null;
  if (!img) return null;
  if (!fol || fol.map !== M.id || (!mover && Math.abs(fol.x - st.x) + Math.abs(fol.y - st.y) > 2)) placeBehind();
  var f = fol!;
  if (mover && mover.t0 !== folStep) {
    folStep = mover.t0; folN++;
    /* stepping off the scooter leaves it on the tile behind him: the creature jumps down beside it */
    var pm = moto();
    if (pm.map === M.id && pm.x === mover.fx && pm.y === mover.fy) { placeBehind(); f = fol!; }
    else { f.fx = f.x; f.fy = f.y; f.x = mover.fx; f.y = mover.fy; f.t0 = mover.t0; }
  }
  var t = Math.min(1, (now - f.t0) / STEP), going = !reduced && t < 1, hop = going ? Math.sin(t * Math.PI) * 3 : 0;
  /* it walks with him: at each step it rocks onto the other foot (one way at one step, the other way at the next),
     and lands with a little squash; standing, it breathes */
  var side = folN & 1 ? 1 : -1, tilt = going ? side * 0.13 * Math.sin(t * Math.PI) : 0;
  var sq = going ? 1 + 0.05 * Math.sin(t * Math.PI) - (t > 0.8 ? 0.07 * Math.sin((t - 0.8) / 0.2 * Math.PI) : 0) : reduced ? 1 : 1 + 0.02 * Math.sin(now / 520);
  /* just behind Antonio when they are on the same row; a little smaller than a wild one, so that it does not hide him */
  return { yb: (f.fy + (f.y - f.fy) * t + 1) * T - 0.25 - hop, x: (f.fx + (f.x - f.fx) * t) * T, img: img, z: FOLLOWER, glow: MAGIC[SPECIES[idOf(uid!) as SpeciesId].type].col, tilt: tilt, sq: sq };
}
function itemSprite(kind: string, s: number): Sprite {
  var id = kind + '@' + s;
  return sprites[id] || (sprites[id] = paintObject('item', P || palette(), s, { item: kind, up: UP.item }));
}
/** the "!" over a trainer who has seen Antonio: a bubble that pops up, with a little bounce (t: ms since) */
function exclaim(c: CanvasRenderingContext2D, x: number, y: number, t: number) {
  var k = reduced ? 1 : t < 120 ? 0.3 + 0.9 * (t / 120) : t < 220 ? 1.2 - 0.2 * ((t - 120) / 100) : 1;
  c.save(); c.translate(x, y); c.scale(k, k);
  c.beginPath();
  c.moveTo(-3, -24); c.lineTo(3, -24); c.quadraticCurveTo(8, -24, 8, -19); c.lineTo(8, -9); c.quadraticCurveTo(8, -4, 3, -4);
  c.lineTo(1.5, -4); c.lineTo(0, 1.5); c.lineTo(-1.5, -4); c.lineTo(-3, -4); c.quadraticCurveTo(-8, -4, -8, -9); c.lineTo(-8, -19); c.quadraticCurveTo(-8, -24, -3, -24);
  c.closePath();
  c.fillStyle = '#ffffff'; c.strokeStyle = '#1c2340'; c.lineWidth = 1.8; c.lineJoin = 'round'; c.fill(); c.stroke();
  c.fillStyle = '#e63946';
  c.beginPath(); c.moveTo(-1.9, -21); c.lineTo(1.9, -21); c.lineTo(1.1, -11); c.lineTo(-1.1, -11); c.closePath(); c.fill();
  c.beginPath(); c.arc(0, -7.6, 1.7, 0, Math.PI * 2); c.fill();
  c.restore();
}
/* ---------- Faro's hydro pump, in front of the Eclipse (story/lead.ts, ui/nicola.ts) ---------- */
/** an old board, yellowed, with a faded red stripe and its fin: floating, or flying round and round */
function oldBoard(c: CanvasRenderingContext2D, x: number, y: number, rot: number, k: number) {
  c.save(); c.translate(x, y); c.rotate(rot); c.scale(k, k);
  c.beginPath(); c.ellipse(0, 0, 20, 4.6, 0, 0, Math.PI * 2); c.fillStyle = '#efe2bf'; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.4; c.stroke();
  c.strokeStyle = 'rgba(214,74,58,.7)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(-14, 0); c.lineTo(14, 0); c.stroke();
  c.beginPath(); c.moveTo(-15, 3.5); c.lineTo(-18, 8); c.lineTo(-12, 4); c.closePath(); c.fillStyle = '#5b6170'; c.fill();
  c.restore();
}
function pumpScene(c: CanvasRenderingContext2D, now: number) {
  var pu = pump.now, b = FORMIA_SPOT['tavola-vecchia'];
  if (!b) return;
  if (!pu) {
    /* before: the board floats in front of the Eclipse, until Faro has blown it away (or the story is past it) */
    if (st.seen['faro-show'] || st.seen.starter || st.seen['ws-start']) return;
    oldBoard(c, b[0] * T + T / 2, b[1] * T + T - 8 + (reduced ? 0 : Math.sin(now / 520) * 1.5), reduced ? 0 : Math.sin(now / 900) * 0.06, 1);
    return;
  }
  var t = now - pu.t0, fx = pu.from[0] * T + T / 2 + 6, fy = pu.from[1] * T + T - 30, bx = pu.to[0] * T + T / 2, by = pu.to[1] * T + T - 8;
  var lx = pu.land[0] * T + T / 2, ly = pu.land[1] * T + T - 8;
  if (t < PUMP.charge) {
    /* the breath: rings of light gather at his mouth */
    var g = t / PUMP.charge;
    c.strokeStyle = 'rgba(143,208,246,' + (0.9 - g * 0.5) + ')'; c.lineWidth = 2;
    for (var r0 = 0; r0 < 3; r0++) { c.beginPath(); c.arc(fx, fy, (1 - g) * 26 + r0 * 6, 0, Math.PI * 2); c.stroke(); }
  }
  if (t >= PUMP.charge && t < PUMP.jet + 120) {
    /* the jet: a thick arc of water, white at its heart, the drops thrown off it, the spray where it hits */
    var u = Math.min(1, (t - PUMP.charge) / 160), mx = (fx + bx) / 2, my = Math.min(fy, by) - 26, ex = fx + (bx - fx) * u, ey = fy + (by - fy) * u;
    var fade = t > PUMP.jet ? 1 - (t - PUMP.jet) / 120 : 1;
    c.save(); c.globalAlpha = fade; c.lineCap = 'round';
    c.strokeStyle = 'rgba(63,159,196,.85)'; c.lineWidth = 13; c.beginPath(); c.moveTo(fx, fy); c.quadraticCurveTo(mx, my, ex, ey); c.stroke();
    c.strokeStyle = '#bfe8ff'; c.lineWidth = 8; c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = 3.5; c.setLineDash([10, 8]); c.lineDashOffset = -t / 6; c.stroke(); c.setLineDash([]);
    for (var k = 0; k < 14; k++) {
      var q = ((k / 14) + t / 420) % 1, qx = (1 - q) * (1 - q) * fx + 2 * (1 - q) * q * mx + q * q * ex, qy = (1 - q) * (1 - q) * fy + 2 * (1 - q) * q * my + q * q * ey;
      var off = Math.sin(k * 7.3 + t / 90) * 9;
      c.fillStyle = k % 2 ? '#ffffff' : '#8fd0f6'; c.beginPath(); c.arc(qx + off * 0.4, qy + off, 2 + (k % 3), 0, Math.PI * 2); c.fill();
    }
    if (u >= 1) for (var j = 0; j < 10; j++) {
      var a = -Math.PI / 2 + (j - 4.5) * 0.28, rr = 8 + ((t / 3 + j * 37) % 22);
      c.fillStyle = 'rgba(255,255,255,.9)'; c.beginPath(); c.arc(bx + Math.cos(a) * rr, by + Math.sin(a) * rr, 2.2, 0, Math.PI * 2); c.fill();
    }
    c.restore();
  }
  if (t < PUMP.jet) {
    /* the board, shaking under the jet */
    var sh = t > PUMP.charge + 160 ? Math.sin(t / 25) * 2 : 0;
    oldBoard(c, bx + sh, by, sh * 0.03, 1);
  } else if (t < PUMP.fly) {
    /* and off it goes: high over the sea, round and round, and down far out */
    var v = (t - PUMP.jet) / (PUMP.fly - PUMP.jet), x = bx + (lx - bx) * v, y = by + (ly - by) * v - Math.sin(v * Math.PI) * 150;
    c.fillStyle = 'rgba(20,24,40,.18)'; c.beginPath(); c.ellipse(bx + (lx - bx) * v, by + (ly - by) * v + 4, 16 * (1 - Math.sin(v * Math.PI) * 0.6), 3.5, 0, 0, Math.PI * 2); c.fill();
    oldBoard(c, x, y, v * Math.PI * 6, 1 + Math.sin(v * Math.PI) * 0.35);
    c.fillStyle = 'rgba(191,232,255,.8)';
    for (var d0 = 1; d0 < 5; d0++) { var w = Math.max(0, v - d0 * 0.04); c.beginPath(); c.arc(bx + (lx - bx) * w, by + (ly - by) * w - Math.sin(w * Math.PI) * 150 + d0 * 4, 3 - d0 * 0.5, 0, Math.PI * 2); c.fill(); }
  } else {
    /* the splash, and its rings */
    var s0 = (t - PUMP.fly) / (PUMP.end - PUMP.fly);
    c.save(); c.globalAlpha = Math.max(0, 1 - s0);
    /* the spout first, a column of white water that falls back */
    var sp = Math.sin(Math.min(1, s0 * 1.4) * Math.PI) * 46;
    if (sp > 1) {
      c.fillStyle = 'rgba(255,255,255,.92)'; c.strokeStyle = '#3f9fc4'; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(lx - 12, ly); c.quadraticCurveTo(lx - 7, ly - sp * 0.7, lx - 3, ly - sp); c.quadraticCurveTo(lx, ly - sp - 6, lx + 3, ly - sp);
      c.quadraticCurveTo(lx + 7, ly - sp * 0.7, lx + 12, ly); c.closePath(); c.fill(); c.stroke();
    }
    c.strokeStyle = '#ffffff'; c.lineWidth = 3.5;
    for (var r1 = 0; r1 < 3; r1++) { c.beginPath(); c.ellipse(lx, ly, 8 + s0 * 44 + r1 * 11, (8 + s0 * 44 + r1 * 11) * 0.38, 0, 0, Math.PI * 2); c.stroke(); }
    for (var j2 = 0; j2 < 11; j2++) {
      var a2 = -Math.PI / 2 + (j2 - 5) * 0.3, h2 = Math.sin(Math.min(1, s0 * 1.6) * Math.PI) * 52;
      c.fillStyle = j2 % 2 ? '#ffffff' : '#bfe8ff'; c.strokeStyle = '#3f9fc4'; c.lineWidth = 1;
      c.beginPath(); c.arc(lx + Math.cos(a2) * (10 + s0 * 34), ly - h2 * (0.6 + 0.4 * Math.cos(j2)) + Math.sin(a2) * 4, 3.6, 0, Math.PI * 2); c.fill(); c.stroke();
    }
    c.restore();
  }
}
/* draws the sorted items and the moving things in one pass, so people walk behind trees and roofs */
/* ---------- out at sea: who swims, who paddles, who sits in a gozzo (Antonio too, with Nicola's board) ---------- */
var ROWBOAT = ['#3f7ccf', '#ffffff', '#2c9a55', '#e9765f'];
/** what is under someone afloat, before him: the board, the back of the boat */
function floatUnder(c: CanvasRenderingContext2D, e: Drawn) {
  var cx = e.x + T / 2, by = e.yb - 4;
  if (e.float === 'windsurf') {
    /* Nicola's windsurf: a white board with a blue stripe, its wake, and the sail behind (drawn over him, see below) */
    var go = e.d === 'left' ? -1 : 1, side = e.d === 'left' || e.d === 'right';
    c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.ellipse(cx - go * 4, by + 1, side ? 24 : 15, side ? 5 : 8, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(cx, by, side ? 21 : 9, side ? 4.6 : 13, 0, 0, Math.PI * 2); c.fillStyle = '#fbfbf7'; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = '#1f7fb5'; c.lineWidth = 1.6; c.beginPath(); if (side) { c.moveTo(cx - 16, by); c.lineTo(cx + 16, by); } else { c.moveTo(cx, by - 10); c.lineTo(cx, by + 10); } c.stroke();
    if (!side || e.d === 'up') sail(c, cx, by, e.d === 'up' ? 1 : -1, false);
  } else if (e.float === 'sup') {
    c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, by + 1, 21, 5, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(cx, by, 19, 4.6, 0, 0, Math.PI * 2); c.fillStyle = '#ffd166'; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.4; c.stroke();
    c.strokeStyle = '#e9765f'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx - 15, by); c.lineTo(cx + 15, by); c.stroke();
  } else if (e.float === 'boat') {
    var col = ROWBOAT[Math.floor(hash(Math.round(e.x / T), Math.round(e.yb / T), 47) * ROWBOAT.length)];
    c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, by + 3, 25, 7, 0, 0, Math.PI * 2); c.stroke();
    c.beginPath(); c.ellipse(cx, by - 4, 23, 8, 0, Math.PI, Math.PI * 2); c.lineTo(cx + 23, by - 4); c.fillStyle = P.wood; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.3; c.stroke();
    c.fillStyle = col; c.beginPath(); c.ellipse(cx, by - 4, 23, 7, 0, 0, Math.PI); c.fill();
  }
}
/** the sail of a windsurf: the mast, the boom held in both hands, the sail in red and yellow, swelling with the wind */
function sail(c: CanvasRenderingContext2D, cx: number, by: number, go: number, front: boolean) {
  var mx = cx + go * 7, top = by - 50, puff = reduced ? 0 : Math.sin(performance.now() / 420) * 1.5;
  c.beginPath(); c.moveTo(mx, by - 2); c.lineTo(mx, top); c.quadraticCurveTo(mx + go * (22 + puff), top + 22, mx + go * 20, by - 8); c.closePath();
  c.fillStyle = front ? 'rgba(226,58,79,.92)' : '#e23a4f'; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.4; c.stroke();
  c.beginPath(); c.moveTo(mx, top + 14); c.quadraticCurveTo(mx + go * (14 + puff), top + 26, mx + go * 16, by - 14); c.lineTo(mx, by - 10); c.closePath(); c.fillStyle = '#ffd166'; c.fill();
  c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(mx, by - 2); c.lineTo(mx, top); c.stroke();
  c.strokeStyle = '#3a3f55'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(mx - go * 6, by - 24); c.lineTo(mx + go * 14, by - 22); c.stroke();
}
/** what is in front of someone afloat, over his legs: the water to the waist, the paddle, the side of the boat */
function floatOver(c: CanvasRenderingContext2D, e: Drawn) {
  var cx = e.x + T / 2, by = e.yb - 4, wv = reduced ? 0 : Math.sin(performance.now() / 300 + e.x) * 1.5;
  if (e.float === 'windsurf') { if (e.d === 'left' || e.d === 'right') sail(c, cx, by, e.d === 'left' ? 1 : -1, true); else if (e.d === 'down') sail(c, cx, by, 1, true); return; }
  if (e.float === 'swim') {
    c.save(); c.globalAlpha = 0.92 * (c.globalAlpha || 1); c.fillStyle = P.sea;
    c.beginPath(); c.ellipse(cx, by - 3 + wv, T * 0.58, T * 0.34, 0, 0, Math.PI * 2); c.fill(); c.restore();
    c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, by - 9 + wv, T * 0.5, T * 0.16, 0, 0, Math.PI * 2); c.stroke();
  } else if (e.float === 'sup') {
    /* the paddle, held across, its blade in the water */
    c.strokeStyle = P.wood2; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + 9, by - 26); c.lineTo(cx + 15, by + 2); c.stroke();
    c.beginPath(); c.ellipse(cx + 15.5, by + 3, 2.4, 4, 0.2, 0, Math.PI * 2); c.fillStyle = P.wood2; c.fill();
  } else if (e.float === 'boat') {
    var col = ROWBOAT[Math.floor(hash(Math.round(e.x / T), Math.round(e.yb / T), 47) * ROWBOAT.length)];
    c.beginPath(); c.moveTo(cx - 25, by - 8); c.quadraticCurveTo(cx, by + 9, cx + 25, by - 8); c.quadraticCurveTo(cx, by - 1, cx - 25, by - 8); c.closePath();
    c.fillStyle = col; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.5; c.stroke();
    c.strokeStyle = col === '#ffffff' ? '#3f7ccf' : '#ffffff'; c.lineWidth = 1.3; c.beginPath(); c.moveTo(cx - 20, by - 5); c.quadraticCurveTo(cx, by + 4, cx + 20, by - 5); c.stroke();
  }
}
function drawSorted(c: CanvasRenderingContext2D, items: SceneItem[], people: Drawn[], s: number, view: { x: number; y: number; w: number; h: number } | null, now: number, night?: number, lit?: SceneItem[]) {
  var k = 0;
  var person = function (e: Drawn) {
    if (e.img) {
      var z = e.size || e.z || 52, zh = z * (e.size ? 1.17 : 1);
      if (e.alpha) c.globalAlpha = e.alpha;
      if (e.tilt || e.sq) {
        /* a creature walking: it rocks from one foot to the other, and squashes a little as it lands */
        var sq = e.sq || 1;
        c.save(); c.translate(e.x + 16, e.yb - 2); c.rotate(e.tilt || 0); c.scale(1 / Math.sqrt(sq), sq);
        drawMon(c, e.img, -z / 2, 2 - z, z, zh); c.restore();
      } else drawMon(c, e.img, e.x + 16 - z / 2, e.yb - z, z, zh);
      c.globalAlpha = 1; return;
    }
    if (e.spr) { if (e.alpha) c.globalAlpha = e.alpha; c.drawImage(e.spr.cv, e.x, e.yb - e.spr.h, e.spr.cv.width / s, e.spr.cv.height / s); c.globalAlpha = 1; return; }
    var img = e.w![e.d!][e.f || 0], ih = img.height / s, br = e.breath || 1;
    if (e.alpha) c.globalAlpha = e.alpha;
    if (e.float) floatUnder(c, e);
    /* breathing: the picture grows and shrinks by a hair from the feet up (the last 2 px are its shadow on the ground) */
    c.drawImage(img, e.x, e.y! - 12 - (e.hop || 0) - (ih - 2) * (br - 1), img.width / s, ih * br);
    if (e.float) floatOver(c, e);
    c.globalAlpha = 1;
  };
  /* whatever tall stands in front of Antonio (the Torre di Mola, a palazzo of a cortina) does not hide him: he is drawn
     again over it, see-through, the way a game shows its hero behind a wall */
  var mine: Drawn[] = [], hidden = false;
  var covers = function (it: SceneItem, gx: number) {
    if (it.thin || it.spr.h < T * 1.3) return false;
    for (var q = 0; q < mine.length; q++) {
      var e = mine[q], ex = e.x + (e.spr ? e.spr.w / 2 : 16), ey = e.yb - 18;
      if (ex > it.x + gx + 4 && ex < it.x + gx + it.spr.w - 4 && ey > it.yb - it.spr.h + 6 && ey < it.yb - 4) return true;
    }
    return false;
  };
  for (var n = 0; n < items.length; n++) {
    var it = items[n];
    while (k < people.length && people[k].yb <= it.yb) { if (people[k].me) mine.push(people[k]); person(people[k++]); }
    var gx = it.glide && now && !reduced ? Math.sin(now / 5200 + it.x * 0.013) * it.glide * T : 0;
    if (view && (it.x + gx + it.spr.w < view.x || it.x + gx > view.x + view.w || it.yb < view.y || it.yb - it.spr.h > view.y + view.h)) continue;
    var dy = it.bob && now && !reduced ? Math.sin(now / 650 + it.x * 0.037) * 1.5 : 0;
    if (it.sway && now && !reduced && rich()) {
      /* a tree in the wind: it leans from its foot, the top the most */
      c.save(); c.transform(1, 0, -it.sway * wind(it.x, it.yb, now), 1, it.x + T / 2, it.yb - 3);
      c.drawImage(it.spr.cv, -T / 2, 3 - it.spr.h, it.spr.cv.width / s, it.spr.cv.height / s); c.restore();
    } else
    c.drawImage(it.spr.cv, it.x + gx, it.yb - it.spr.h + dy, it.spr.cv.width / s, it.spr.cv.height / s);
    if (!hidden && mine.length && covers(it, gx)) hidden = true;
    if (night && it.lit) {
      var g = glowOf(it);
      if (g) { c.globalAlpha = night; c.drawImage(g, it.x, it.yb - it.spr.h, it.spr.cv.width / s, it.spr.cv.height / s); c.globalAlpha = 1; if (lit) lit.push(it); }
    }
  }
  while (k < people.length) person(people[k++]);
  if (hidden) mine.forEach(function (e) { var a = e.alpha; e.alpha = 0.45 * (a || 1); person(e); e.alpha = a; });
}

/* light/dark switches and late fonts repaint the map and the home preview */
(function listen() {
  var retheme = function () { themeAt = 0; if (previewEl && previewEl.isConnected) preview(previewEl); };
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) mq.addEventListener('change', retheme); else if (mq.addListener) mq.addListener(retheme);
  }
  if (window.MutationObserver) new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { cache.map = null; retheme(); });
})();
/* ---------- the night: street lamps, lit windows, the lighthouse ---------- */
/* what lights up once it is dark, by kind: floodlit monuments (the height of their light), places with life at the door */
const FLOOD: Record<string, number> = { tower: 1.3, octagon: 1.1, church: 1, collegiata: 1.2, tomb: 1, monument: 0.8, clocktower: 1, parish: 0.9, cistern: 0.3, fountain: 0.4, ruins: 0.5, aqueduct: 0.4 };
const LIVELY: Record<string, number> = { morgana: 2.4, bar: 1.7, gelati: 1.8, stazione: 2, eclipse: 2, forno: 1.3, biglietti: 1.3, casa: 1.4 };
function lightsOf(m: PreparedMap): Light[] {
  var out: Light[] = [];
  /* in the dark of a place, the braziers: where a fall brings Antonio back is where there is light */
  if (m.dark && m.place) m.place.things.forEach(function (t) { if (t.k === 'rest') out.push({ x: t.x * T + T / 2, y: t.y * T + T / 2, r: T * 3.4, a: 0.95, warm: 1 }); });
  if (m.inside) return out;
  for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
    /* a street lamp: the head leans to the right of its pole; the light falls on the ground around the foot */
    if (m.cell(x, y).obj === 'lamp') out.push({ x: x * T + 21, y: y * T + 18, r: T * 1.9, a: 0.85, warm: 1, bulb: [x * T + 23, y * T - 8.5] });
  }
  (m.buildings || []).forEach(function (b) {
    var house = b.id.indexOf('casa-') === 0;
    if (house && hash(b.x, b.y, 8) > 0.35) return;
    var big = LIVELY[b.id] || 0;
    /* the light over the door: of a few houses, of every place; the places with life around them glow wider */
    out.push({ x: b.door[0] * T + T / 2, y: (b.door[1] + 1) * T + 2, r: T * (big || (house ? 1 : 1.25)), a: house ? 0.6 : 0.8, warm: big ? 1.2 : house ? 0.6 : 0.8 });
    var f = FLOOD[b.kind];
    if (f) out.push({ x: (b.x + b.w / 2) * T, y: (b.y + b.h) * T - (UP[b.kind] || T) * 0.6, r: Math.max(b.w * T * 0.7, T * 2) * f, a: 0.7, warm: 0.3 });
  });
  (m.objects || []).forEach(function (o) {
    var f = FLOOD[o.kind];
    if (f) out.push({ x: (o.x + o.w / 2) * T, y: (o.y + o.h) * T - (UP[o.kind] || T) * 0.55, r: Math.max(o.w * T * 0.75, T * 2) * f, a: 0.75, warm: 0.35 });
    if (o.kind === 'lighthouse') out.push({ x: o.x * T + 16, y: o.y * T - 36, r: T * 1.4, a: 1, warm: 1.4, bulb: [o.x * T + 16, o.y * T - 36] });
    if (o.kind === 'train' || o.kind === 'ferry') out.push({ x: (o.x + o.w / 2) * T, y: (o.y + o.h / 2) * T, r: o.w * T * 0.55, a: 0.6, warm: 0.5 });
  });
  return out;
}
/* the windows of a building, lit: its glass (the pale blue of every window and shop front) painted warm */
var GLASS = [[191, 227, 255], [232, 245, 255]];
function glowOf(it: SceneItem): HTMLCanvasElement | null {
  if (it.glow !== undefined) return it.glow;
  it.glow = null;
  /* the glass is found by its colour, so on the picture as it was painted, before the light of the day went over it */
  var w = it.spr.cv.width, h = it.spr.cv.height, src: ImageData;
  try { src = (it.flat ? it.flat() : it.spr).cv.getContext('2d')!.getImageData(0, 0, w, h); } catch (e) { return null; }
  var c0 = document.createElement('canvas'); c0.width = w; c0.height = h;
  var c = c0.getContext('2d')!, out = c.createImageData(w, h), d = src.data, o = out.data, any = false;
  var n = parseInt((P.lamp || '#ffc96b').slice(1), 16), lr = (n >> 16) & 255, lg = (n >> 8) & 255, lb = n & 255;
  for (var i = 0; i < d.length; i += 4) {
    if (d[i + 3] < 250) continue;
    for (var k = 0; k < GLASS.length; k++) if (d[i] === GLASS[k][0] && d[i + 1] === GLASS[k][1] && d[i + 2] === GLASS[k][2]) { o[i] = lr; o[i + 1] = lg; o[i + 2] = lb; o[i + 3] = 255; any = true; break; }
  }
  if (!any) return null;
  c.putImageData(out, 0, 0);
  return (it.glow = c0);
}
var lightCv: HTMLCanvasElement | null = null, NIGHT_A = 0.76, NIGHT_Q = 3, DARK_A = 0.95;
/** the tiles Antonio has walked in a dark place, by map: for this session of play, it is only a help to the eye */
var walked: Record<string, Record<string, [number, number]>> = {};
function remembered(id: string) { return walked[id] || (walked[id] = {}); }
/** a tile remembered: a soft stamp, drawn once, because there can be many of them in view at every frame */
var memCv: HTMLCanvasElement | null = null;
function memStamp(): HTMLCanvasElement {
  if (memCv) return memCv;
  memCv = document.createElement('canvas'); memCv.width = memCv.height = 64;
  var c = memCv.getContext('2d')!, g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,.3)'); g.addColorStop(0.45, 'rgba(0,0,0,.15)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(0, 0, 64, 64);
  return memCv;
}
/** how much the lamps and windows are on: from nothing at dusk to full a little after */
function lampsOn(dk: number) { return Math.max(0, Math.min(1, (dk - 0.12) / 0.35)); }
function rgba(hex: string, a: number) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
/** darkens the frame by the hour: a sheet of night with holes where the lights are, then their warm glow */
function drawNight(now: number, dk: number, sn: number, camX: number, camY: number, vw: number, vh: number, pp: { x: number; y: number }, lit: SceneItem[], people: Drawn[]) {
  var W = cv.width, H = cv.height;
  if (sn > 0.01) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = sn * 0.16; ctx.fillStyle = P.dusk; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  if (dk < 0.01) return;
  var on = lampsOn(dk), q = NIGHT_Q, lw = Math.ceil(W / q), lh = Math.ceil(H / q);
  if (!lightCv) lightCv = document.createElement('canvas');
  if (lightCv.width !== lw || lightCv.height !== lh) { lightCv.width = lw; lightCv.height = lh; }
  var lc = lightCv.getContext('2d')!;
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = 1;
  lc.fillStyle = P.night; lc.fillRect(0, 0, lw, lh);
  lc.setTransform(VS / q, 0, 0, VS / q, -camX * VS / q, -camY * VS / q);
  lc.globalCompositeOperation = 'destination-out';
  var seen = function (x: number, y: number, r: number) { return x + r > camX && x - r < camX + vw && y + r > camY && y - r < camY + vh; };
  var hole = function (x: number, y: number, r: number, a: number) {
    if (a <= 0 || !seen(x, y, r)) return;
    var g = lc.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(0,0,0,' + a + ')'); g.addColorStop(0.45, 'rgba(0,0,0,' + a * 0.5 + ')'); g.addColorStop(1, 'rgba(0,0,0,0)');
    lc.fillStyle = g; lc.fillRect(x - r, y - r, r * 2, r * 2);
  };
  cache.lights.forEach(function (l) { hole(l.x, l.y, l.r, l.a * on); });
  /* a dark place stays readable: Antonio's own light, and a faint memory of the tiles he has walked (a labyrinth you cannot
     see at all is not hard, it is only tedious) */
  if (M.dark) {
    var mem = remembered(M.id), tile = key(Math.round(pp.x / T), Math.round(pp.y / T));
    if (!mem[tile]) mem[tile] = [Math.round(pp.x / T), Math.round(pp.y / T)];
    var soft = memStamp(), mr = T * 1.8;
    Object.keys(mem).forEach(function (k3) {
      var mx = mem[k3][0] * T + T / 2, my = mem[k3][1] * T + T / 2;
      if (seen(mx, my, mr)) lc.drawImage(soft, mx - mr, my - mr, mr * 2, mr * 2);
    });
    /* with Claudia's lantern the light goes much further (story/lairs.ts) */
    hole(pp.x + T / 2, pp.y + T / 2, T * (hasGift('lanterna') ? 7.6 : 4.8), 1);
  } else
  /* Antonio is never lost in the dark */
  hole(pp.x + T / 2, pp.y + T / 2, T * 2.4, 0.5);
  /* the creatures glow in the dark with the colour of their magic, softly breathing */
  var glowing = people.filter(function (e) { return !!e.glow && seen(e.x + 16, e.yb - 20, T * 2); });
  glowing.forEach(function (e) { hole(e.x + 16, e.yb - 20, T * 1.7, 0.75 * on); });
  /* the lit windows shine through */
  lc.globalAlpha = on * 0.9;
  lit.forEach(function (it) { lc.drawImage(it.glow!, it.x, it.yb - it.spr.h, it.spr.cv.width / RS, it.spr.cv.height / RS); });
  lc.globalAlpha = 1;
  /* the lighthouse at the end of the mole: two beams sweeping the bay */
  var lh0 = (M.objects || []).filter(function (o) { return o.kind === 'lighthouse'; })[0];
  if (lh0 && seen(lh0.x * T + 16, lh0.y * T - 36, T * 9)) {
    var bx = lh0.x * T + 16, by = lh0.y * T - 36, ang = reduced ? 0.6 : now / 1700;
    for (var k2 = 0; k2 < 2; k2++) {
      var a2 = ang + k2 * Math.PI, len = T * 9, spread = 0.16;
      var bg = lc.createLinearGradient(bx, by, bx + Math.cos(a2) * len, by + Math.sin(a2) * len * 0.6);
      bg.addColorStop(0, 'rgba(0,0,0,' + 0.85 * on + ')'); bg.addColorStop(1, 'rgba(0,0,0,0)');
      lc.beginPath(); lc.moveTo(bx, by);
      lc.lineTo(bx + Math.cos(a2 - spread) * len, by + Math.sin(a2 - spread) * len * 0.6);
      lc.lineTo(bx + Math.cos(a2 + spread) * len, by + Math.sin(a2 + spread) * len * 0.6);
      lc.closePath(); lc.fillStyle = bg; lc.fill();
    }
  }
  /* the light of lamps and windows is warm: their pools are tinted, not only uncovered */
  lc.globalCompositeOperation = 'source-over';
  glowing.forEach(function (e, k) {
    var x = e.x + 16, y = e.yb - 20, r = T * (1.35 + (reduced ? 0 : Math.sin(now / 700 + k) * 0.12)), g = lc.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, rgba(e.glow!, 0.55 * on)); g.addColorStop(1, rgba(e.glow!, 0));
    lc.fillStyle = g; lc.fillRect(x - r, y - r, r * 2, r * 2);
  });
  cache.lights.forEach(function (l) {
    if (!l.warm || !seen(l.x, l.y, l.r)) return;
    var r = l.r * 0.8, g = lc.createRadialGradient(l.x, l.y, 0, l.x, l.y, r);
    g.addColorStop(0, rgba(P.lamp, Math.min(0.55, 0.36 * l.warm) * on)); g.addColorStop(1, rgba(P.lamp, 0));
    lc.fillStyle = g; lc.fillRect(l.x - r, l.y - r, r * 2, r * 2);
  });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = dk * (M.dark ? DARK_A : NIGHT_A); ctx.imageSmoothingEnabled = true;
  ctx.drawImage(lightCv, 0, 0, lw * q, lh * q);
  ctx.globalAlpha = 1;
  /* a bright bulb on each lamp, and the lantern of the lighthouse */
  ctx.setTransform(VS, 0, 0, VS, -camX * VS, -camY * VS);
  ctx.globalCompositeOperation = 'lighter';
  cache.lights.forEach(function (l) {
    if (l.bulb && seen(l.bulb[0], l.bulb[1], 9)) {
      var b = ctx.createRadialGradient(l.bulb[0], l.bulb[1], 0, l.bulb[0], l.bulb[1], 9);
      b.addColorStop(0, rgba(P.lamp, 0.9 * on)); b.addColorStop(1, rgba(P.lamp, 0));
      ctx.fillStyle = b; ctx.fillRect(l.bulb[0] - 9, l.bulb[1] - 9, 18, 18);
    }
  });
  ctx.globalCompositeOperation = 'source-over';
}

/** sizes the canvas to the story screen; big screens see the map larger */
export function resize() {
  if (!root || root.hidden) return;
  DPR = dpr();
  var w = root.clientWidth, h = root.clientHeight;
  /* about 12 tiles on the short side: a phone sees the map at 1×, a laptop at 2× */
  Z = Math.round(Math.max(1, Math.min(2, Math.min(w, h) / (12 * T))) * 4) / 4;
  VS = DPR * Z; RS = Math.min(3, VS);
  cv.width = Math.max(1, Math.round(w * DPR)); cv.height = Math.max(1, Math.round(h * DPR));
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
}

/** drop the cached pictures: they are painted again on the next frame */
export function invalidate() { cache.map = null; }

/** whoever is being played walks the town */
function hero() { return { person: firstHuman() as FriendId }; }
function playerPx(now: number) {
  if (!mover) return { x: st.x * T, y: st.y * T, t: 0 };
  var t = Math.min(1, (now - mover.t0) / (mover.dur || STEP));
  return { x: (mover.fx + (mover.tx - mover.fx) * t) * T, y: (mover.fy + (mover.ty - mover.fy) * t) * T, t: t };
}
/** how far the camera is from the map: 1 normally, less while a winged creature shows Formia from above (story-screen skyFrom) */
function skyZoom(now: number): number {
  if (!skyFrom) return 1;
  var t = now - skyFrom, ease = function (u: number) { return u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; };
  if (t >= SKY_MS) return 1;
  if (t < 700) return 1 - 0.62 * ease(t / 700);
  if (t < SKY_MS - 700) return 0.38;
  return 0.38 + 0.62 * ease((t - (SKY_MS - 700)) / 700);
}
/** draws one frame of the map, around the player (from higher up during the view from above) */
/* where the last frame looked from: a click on the map is a tile (clicking to walk, ui/story-screen.ts) */
var lastCam = { x: 0, y: 0, vs: 1 };
/** the tile under a point of the screen, or null outside the map */
export function tileAt(clientX: number, clientY: number): [number, number] | null {
  var r = cv.getBoundingClientRect(), px = (clientX - r.left) * DPR / lastCam.vs + lastCam.x, py = (clientY - r.top) * DPR / lastCam.vs + lastCam.y;
  var tx = Math.floor(px / T), ty = Math.floor(py / T);
  return tx >= 0 && ty >= 0 && tx < M.w && ty < M.h ? [tx, ty] : null;
}
/** the middle of a tile on the screen (playtests click there) */
export function screenOf(tx: number, ty: number): [number, number] {
  var r = cv.getBoundingClientRect();
  return [r.left + ((tx + 0.5) * T - lastCam.x) * lastCam.vs / DPR, r.top + ((ty + 0.5) * T - lastCam.y) * lastCam.vs / DPR];
}
function renderScale() { return RS; }
/** a step is a little hop: up in the middle of it, down on the tile */
function stepHop(t: number): number { return Math.sin(Math.max(0, Math.min(1, t)) * Math.PI) * 1.6; }
/** the map as the light and the life of it read it (render/atmosphere.ts) */
var tilesFor: { m: PreparedMap; t: Tiles } | null = null;
function tilesOf(m: PreparedMap): Tiles {
  if (tilesFor && tilesFor.m === m) return tilesFor.t;
  var t: Tiles = {
    w: m.w, h: m.h,
    ground: function (x, y) { return m.cell(x, y).g; },
    deco: function (x, y) { return m.cell(x, y).deco; },
    free: function (x, y) { return !blocked(m, x, y) && !m.at[key(x, y)] && !m.people.some(function (p) { return p.x === x && p.y === y; }); }
  };
  tilesFor = { m: m, t: t };
  return t;
}
/** who and what casts a shadow in this frame: what stands on the land, and everyone who is not a ghost */
function casters(items: SceneItem[], people: Drawn[], now: number, rs?: number): Caster[] {
  var out: Caster[] = [], RS = rs || renderScale();
  items.forEach(function (it) {
    if (it.afloat) return;
    if (it.box) { out.push({ x: it.x, yb: it.yb, w: it.spr.cv.width / RS, h: it.spr.cv.height / RS, box: it.box }); return; }
    out.push({ x: it.x, yb: it.yb - 3, w: it.spr.cv.width / RS, h: it.spr.cv.height / RS, img: it.spr.cv, foot: 3, lean: it.sway && !reduced ? -it.sway * wind(it.x, it.yb, now) : 0 });
  });
  people.forEach(function (e) {
    if (e.alpha) return;
    if (e.img) { var z = e.size || e.z || 52; out.push({ x: e.x + 16 - z / 2, yb: e.yb - 5, w: z, h: z, img: e.img, foot: 5 }); return; }
    if (e.spr) { out.push({ x: e.x, yb: e.yb - 3, w: e.spr.cv.width / RS, h: e.spr.cv.height / RS, img: e.spr.cv, foot: 3 }); return; }
    var img = e.w![e.d!][e.f || 0];
    out.push({ x: e.x, yb: e.yb - 3, w: img.width / RS, h: img.height / RS, img: img, foot: 3 });
  });
  return out;
}
export function drawWorld(now: number) {
  var k = skyZoom(now);
  if (k === 1) { drawFrame(now, 1); return; }
  var vs0 = VS;
  VS = VS * k; CACHE_MAX = 90;
  try { drawFrame(now, k); } finally { VS = vs0; CACHE_MAX = 12; }
}
var framed: boolean | null = null, landed: { x: number; y: number; at: number } | null = null;
function drawFrame(now: number, sk: number) {
  ensureCaches(now);
  /* the darker frame around the picture is a sheet of the page over the canvas (.wframe): there with the graphics on Alta */
  if (framed !== rich()) { framed = rich(); root.classList.toggle('rich', framed); }
  /* everything below is in map units (one tile = T); VS turns them into canvas pixels */
  var W = cv.width, H = cv.height, vw = W / VS, vh = H / VS, mw = M.w * T, mh = M.h * T;
  var pp = playerPx(now), lift = (H / DPR > 600 ? 56 : 28) / Z;   /* the player sits a little above the middle, clear of the pad */
  var camX = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, pp.x + T / 2 - vw / 2));
  var camY = mh <= vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, pp.y + T / 2 - vh / 2 + lift));
  camX = Math.round(camX * VS) / VS; camY = Math.round(camY * VS) / VS;
  lastCam = { x: camX, y: camY, vs: VS };
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = M.inside ? P.stone2 : P.paper; ctx.fillRect(0, 0, W, H);   /* indoors, the outside is just wall */
  ctx.setTransform(VS, 0, 0, VS, -camX * VS, -camY * VS);
  var span = CH * T;
  for (var cy = Math.max(0, Math.floor(camY / span)); cy <= Math.min(Math.ceil(M.h / CH) - 1, Math.floor((camY + vh) / span)); cy++) {
    for (var cx = Math.max(0, Math.floor(camX / span)); cx <= Math.min(Math.ceil(M.w / CH) - 1, Math.floor((camX + vw) / span)); cx++) {
      ctx.drawImage(chunk(cx, cy), cx * span, cy * span, Math.min(CH, M.w - cx * CH) * T, Math.min(CH, M.h - cy * CH) * T);
    }
  }
  /* the sea moves a little */
  var x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(M.w - 1, Math.ceil((camX + vw) / T));
  var y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(M.h - 1, Math.ceil((camY + vh) / T));
  ctx.strokeStyle = P.foam; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.globalAlpha = 0.7;
  for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
    var Lt = M.cell(tx, ty);
    if (Lt.g !== 'sea' || Lt.deco) continue;
    var ph = hash(tx, ty, 3) * 6.28 + (reduced ? 0 : now / 900), ox = Math.sin(ph) * 3, oy = hash(tx, ty, 4) * 12;
    ctx.beginPath(); ctx.moveTo(tx * T + 5 + ox, ty * T + 8 + oy); ctx.quadraticCurveTo(tx * T + 10 + ox, ty * T + 5 + oy, tx * T + 15 + ox, ty * T + 8 + oy); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  /* the floor of a place with a puzzle: it changes with the steps, so it is not part of the ground */
  if (M.place) { var ps = placeNow(M.id); drawThings(ctx, P, M.place, ps.flags, ps.tick, now, reduced, { x0: x0, x1: x1, y0: y0, y1: y1 }); }
  /* the light and the life of Formia (render/atmosphere.ts): outdoors, with the graphics set to Alta */
  var date = new Date(), dk = M.dark ? 1 : M.inside ? 0 : darkness(date), sn = M.inside ? 0 : sunset(date), lit: SceneItem[] = [];
  var fx = rich() && !M.inside && !M.dark, sun = fx ? sunAt(date) : { x: 0, y: 0, k: 0 }, cam = { x: camX, y: camY, w: vw, h: vh }, tiles = fx ? tilesOf(M) : null;
  if (tiles) seaLife(ctx, tiles, x0, x1, y0, y1, now, reduced, 1 - dk * 0.8, P);
  var people: Drawn[] = [], alerts: [number, number, number][] = [];
  M.people.filter(present).forEach(function (p) {
    if (p.n.ghost) {
      /* a ghost of Formia floats over its spot, see-through */
      var gi = mamurraImage(), fl = reduced ? 0 : Math.sin(now / 800) * 3;
      if (gi) people.push({ yb: (p.y + 1) * T + fl, x: p.x * T, img: gi, alpha: 0.85, size: 40 });
      return;
    }
    if (p.n.pet != null) {
      /* one of Antonio's creatures, at home: it bounces about, happy */
      var pet = petAt(p.n.pet), pimg = pet ? creatureImage(pet.sp) : null, bounce = reduced ? 0 : Math.max(0, Math.sin(now / 300 + p.n.pet * 1.7)) * 5;
      if (pimg) people.push({ yb: (p.y + 1) * T - bounce, x: p.x * T, img: pimg });
      return;
    }
    if (p.n.mon) {
      /* someone's creature in the sea (Nicola's Delfaro): now and then it leaps out of the water in an arc */
      var mimg = creatureImage(p.n.mon), ph = (now / 2600 + hash(p.x, p.y, 3)) % 1, leap = reduced ? 0 : ph < 0.32 ? Math.sin(ph / 0.32 * Math.PI) * 30 : 0;
      var pu = pump.now, pt = pu ? now - pu.t0 : 0;
      if (mimg && pu && pu.from[0] === p.x && pu.from[1] === p.y) {
        /* the hydro pump: he rises out of the water, takes a breath, and the jet throws him back a little */
        var up = Math.min(1, pt / PUMP.charge), kick = pt > PUMP.charge && pt < PUMP.jet ? Math.sin((pt - PUMP.charge) / 60) * 1.5 - 4 : 0;
        people.push({ yb: (p.y + 1) * T - up * 20 + 6 * (1 - up), x: p.x * T + kick, img: mimg, tilt: -0.25 * up, glow: MAGIC[SPECIES[p.n.mon].type].col, size: 40 + up * 6 });
        return;
      }
      if (mimg) people.push({ yb: (p.y + 1) * T - leap + (leap ? 0 : 6), x: p.x * T + (leap ? (ph / 0.32 - 0.5) * 14 : 0), img: mimg, tilt: leap ? (ph / 0.32 - 0.5) * 1.1 : 0, glow: MAGIC[SPECIES[p.n.mon].type].col });
      return;
    }
    if (p.n.wild) {
      /* a wild creature hops on the spot now and then */
      var img = creatureImage(wildNow(p.n)!.sp), hop = reduced ? 0 : Math.max(0, Math.sin(now / 260 + hash(p.x, p.y, 5) * 9)) * 4;
      if (img) people.push({ yb: (p.y + 1) * T - hop, x: p.x * T, img: img, glow: MAGIC[SPECIES[wildNow(p.n)!.sp].type].col });
      return;
    }
    var idle = p.n.person ? 0 : ((Math.floor(now / 700 + hash(p.x, p.y, 9) * 6) % 7) === 0 ? 1 : 0);
    var wx = p.x * T, wy = p.y * T, wf = reduced ? 0 : idle;
    /* someone walking (a trainer coming to challenge Antonio, and back): between two tiles, a foot forward */
    if (p.mv) { var u = Math.min(1, (now - p.mv.t0) / STEP); wx = (p.mv.fx + (p.x - p.mv.fx) * u) * T; wy = (p.mv.fy + (p.y - p.mv.fy) * u) * T; wf = u > 0.12 && u < 0.88 ? 1 + ((p.x + p.y) & 1) : 0; }
    /* a beaten rival walking away fades out over his last steps */
    var fade = p.leaving ? Math.min(1, ((p.path ? p.path.length : 0) + 1) / 3) : 1;
    var bobS = p.n.float && !reduced ? Math.sin(now / 500 + p.x) * 1.5 : 0;
    people.push({ yb: wy + T + bobS, x: wx, y: wy + bobS, float: p.n.float, w: walkerFor(p.n, RS), d: p.dir, f: wf, alpha: fade < 1 ? fade : undefined,
      hop: p.mv && !reduced ? stepHop(Math.min(1, (now - p.mv.t0) / STEP)) : 0, breath: p.mv || reduced || !fx ? 1 : 1 + 0.014 * Math.sin(now / 820 + hash(p.x, p.y, 11) * 6.3) });
    if (p.alert) alerts.push([wx + T / 2, wy - 14, now - p.alert]);
  });
  var step = mover && pp.t > 0.12 && pp.t < 0.88 ? (parity ? 1 : 2) : 0;
  var riding = !!st.sella && !M.inside, vd = vanNow(now, pp), inVan = !!van && van.carry;
  if (vd) people.push(vd);
  if (inVan) { /* the player rides in the van */ }
  else if (riding) people.push(Object.assign(rider(now, RS, pp), { me: true }));
  else people.push({ me: true, yb: pp.y + T + 0.5, x: pp.x, y: pp.y, w: walkerFor(hero(), RS), d: st.dir, f: moveMode.swim ? 0 : step, float: moveMode.swim ? (moveMode.board ? 'windsurf' : 'swim') : undefined,
    hop: mover && !reduced && !moveMode.swim ? (mover.jump ? Math.sin(pp.t * Math.PI) * 13 : stepHop(pp.t)) : 0, breath: mover || reduced || !fx ? 1 : 1 + 0.014 * Math.sin(now / 820) });
  var pk = parkedMoto(RS);
  if (pk) people.push(pk);
  /* on the scooter the creature rides behind him */
  var fw = riding || inVan ? null : follower(now);
  if (fw) { fw.me = true; people.push(fw); }
  var nw = companion(now);
  if (nw) people.push(nw);
  var gh = ghost(now, pp);
  if (gh) people.push(gh);
  M.items.forEach(function (it) { if (!st.found[it.id]) people.push({ yb: (it.y + 1) * T, x: it.x * T, spr: itemSprite(ITEMS[it.move].icon, RS) }); });
  /* the bottles adrift in the gulf, rocking on the water */
  if (M.id === 'formia') BOTTLES.forEach(function (b) {
    if (st.seen[b.id] || b.x < x0 - 1 || b.x > x1 + 1 || b.y < y0 - 1 || b.y > y1 + 1) return;
    people.push({ yb: (b.y + 1) * T + (reduced ? 0 : Math.sin(now / 420 + b.x) * 2), x: b.x * T, spr: bottleSprite(RS) });
  });
  people.sort(function (a, b) { return a.yb - b.yb; });
  if (tiles) {
    /* on the ground, under everyone: the shadows, turning with the sun, and the clouds'; the pigeons that have not flown off */
    shade(ctx, W, H, VS, cam, casters(cache.items, people, now), sun, now, reduced, P);
    ctx.setTransform(VS, 0, 0, VS, -camX * VS, -camY * VS);
    pigeons(ctx, tiles, M.id, cam, now, reduced, pp.x, pp.y, 1 - dk, false);
  }
  if (riding) exhaust(ctx, now, pp);
  /* under the covi, the glow of their aura (render/canvas/covo.ts) */
  var inView = function (a: AuraAt) { return a.x + a.w + 120 > camX && a.x - 120 < camX + vw && a.y + a.h + 80 > camY && a.y - a.up - 300 < camY + vh; };
  auras.forEach(function (a) { if (inView(a)) auraBack(ctx, a, now, reduced, !rich()); });
  drawSorted(ctx, cache.items, people, RS, cam, now, lampsOn(dk), lit);
  if (M.id === 'formia') pumpScene(ctx, now);
  /* in the tall grass the blades hide Antonio's feet, and his creature's */
  [[pp.x, pp.y]].concat(fw ? [[fw.x, fw.yb - T]] : []).forEach(function (q) {
    if (M.cell(Math.round(q[0] / T), Math.round(q[1] / T)).deco === 'tall') tallFront(ctx, q[0], q[1], P);
  });
  if (tiles) {
    /* in the air, over everyone: the pigeons flying off, the butterflies */
    pigeons(ctx, tiles, M.id, cam, now, reduced, pp.x, pp.y, 1 - dk, true);
    butterflies(ctx, tiles, x0, x1, y0, y1, now, reduced, 1 - dk, P);
    hawks(ctx, tiles, M.id, cam, now, reduced, 1 - dk);
  }
  /* the dust where a jump down a terrace lands */
  if (mover && mover.jump) landed = { x: mover.tx * T + T / 2, y: mover.ty * T + T - 4, at: mover.t0 + (mover.dur || STEP) };
  if (landed && !reduced) { landing(ctx, landed.x, landed.y, (now - landed.at) / 380, P); if (now - landed.at > 380) landed = null; }
  ctx.save(); drawNight(now, dk, sn, camX, camY, vw, vh, pp, lit, people); ctx.restore();
  /* over the night too: the motes and the pillar of light of the covi; inside one, its mood */
  ctx.setTransform(VS, 0, 0, VS, -camX * VS, -camY * VS);
  auras.forEach(function (a) { if (inView(a)) auraFront(ctx, a, now, reduced, !rich()); });
  if (M.theme) ambience(ctx, M.theme, cam, now, reduced, !rich());
  if (tiles) { ctx.setTransform(VS, 0, 0, VS, -camX * VS, -camY * VS); fireflies(ctx, tiles, x0, x1, y0, y1, now, reduced, dk, P); }
  /* over the night too: the "!" of a trainer who has seen Antonio */
  alerts.forEach(function (a) { exclaim(ctx, a[0], a[1], a[2]); });
  /* from above, the lost things are easy to spot: a ring that pulses around each one, and the creature flying over Antonio */
  if (sk < 1) {
    M.items.forEach(function (it) {
      if (st.found[it.id]) return;
      var pr = (T * 0.9 + Math.sin(now / 200) * T * 0.25) / sk;
      ctx.strokeStyle = P.foam; ctx.lineWidth = 4 / sk; ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.arc(it.x * T + T / 2, it.y * T + T / 2, pr, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
    });
    var fly = skyWho ? creatureOf(skyWho) : null, fimg = fly ? creatureImage(fly.sp) : null;
    if (fimg) {
      var ang = now / 520, size = T * 1.6 / sk;
      drawMon(ctx, fimg, pp.x + T / 2 + Math.cos(ang) * T * 2.2 / sk - size / 2, pp.y - T * 1.5 / sk + Math.sin(ang) * T * 0.8 / sk - size / 2, size);
    }
  }
  /* a glint on the lost things, gulls over the water */
  M.items.forEach(function (it) {
    if (st.found[it.id]) return;
    var tw = reduced ? 0.8 : 0.5 + 0.5 * Math.sin(now / 260 + it.x), gx = it.x * T + 25, gy = it.y * T - 4, r = 2 + tw * 3;
    ctx.globalAlpha = 0.4 + tw * 0.6; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1c2340'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, gy - r * 1.8); ctx.lineTo(gx + r * 0.5, gy - r * 0.5); ctx.lineTo(gx + r * 1.8, gy); ctx.lineTo(gx + r * 0.5, gy + r * 0.5);
    ctx.lineTo(gx, gy + r * 1.8); ctx.lineTo(gx - r * 0.5, gy + r * 0.5); ctx.lineTo(gx - r * 1.8, gy); ctx.lineTo(gx - r * 0.5, gy - r * 0.5); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
  });
  /* the next stop of the tour: a bouncing arrow over the person, the thing or the door */
  var hd = run ? null : heading(M.id), Ld = lead.now && !lead.now.back && M.id === 'formia' ? lead.now : null;
  if (hd || Ld) {
    /* while Nicola leads the way to Gianola, the arrow is over him, high over his sail */
    var ax = Ld ? Ld.x * T + T / 2 : hd!.x * T + T / 2, ay = (Ld ? Ld.y * T - 52 : hd!.y * T - 16) + (reduced ? 0 : Math.sin(now / 220) * 3);
    ctx.beginPath(); ctx.moveTo(ax - 7, ay - 9); ctx.lineTo(ax + 7, ay - 9); ctx.lineTo(ax, ay); ctx.closePath();
    ctx.fillStyle = '#ffd166'; ctx.fill(); ctx.strokeStyle = '#1c2340'; ctx.lineWidth = 2; ctx.lineJoin = 'round'; ctx.stroke();
  }
  /* the flags of a run in the pineta */
  if (run) run.flags.forEach(function (f, k) {
    if (run!.got[k]) return;
    var fx = f[0] * T + 12, fy = f[1] * T + 28, wave = reduced ? 0 : Math.sin(now / 180 + k) * 2;
    ctx.strokeStyle = '#1c2340'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - 26); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fx + 1, fy - 26); ctx.quadraticCurveTo(fx + 8, fy - 24 + wave, fx + 14, fy - 21); ctx.lineTo(fx + 1, fy - 15); ctx.closePath();
    ctx.fillStyle = '#e8473a'; ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
  });
  /* the gulls sleep at night */
  if (dk < 0.5) M.gulls.forEach(function (gl) {
    var t1 = reduced ? gl.ph : gl.ph + now * gl.sp, x = gl.x + Math.cos(t1) * gl.r, y = gl.y + Math.sin(t1) * gl.r * 0.55;
    if (x < camX - 20 || x > camX + vw + 20 || y < camY - 20 || y > camY + vh + 20) return;
    var fl = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now / 140 + gl.ph * 9), wy = 2 + fl * 4;
    ctx.beginPath(); ctx.moveTo(x - 9, y - wy); ctx.quadraticCurveTo(x - 4, y - wy - 3, x, y); ctx.quadraticCurveTo(x + 4, y - wy - 3, x + 9, y - wy);
    ctx.strokeStyle = '#1c2340'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
  });
}

/* a still picture of Formia for the home page, around Antonio: wherever he is in town, or at home */
/** a still of Formia in an element: around Antonio, or around a point (`at`, in tiles), seeing at least `span` px of
    the map across (the title, on a big screen: the town fills it instead of showing half the gulf). The canvas stays
    within a few million pixels: Safari leaves a bigger one blank */
export function preview(el: HTMLElement | null, o?: { at?: [number, number]; span?: number }) {
  if (!el) return;
  if (!o) previewEl = el;
  var m = prepare('formia'), P0 = palette(), mw = m.w * T, mh = m.h * T;
  var W = Math.max(200, el.clientWidth || 320), H = Math.max(100, el.clientHeight || 160), k = W < 420 ? 0.62 : 0.74;
  if (o && o.span) k = Math.max(k, W / o.span);
  var s = Math.min(dpr(), Math.sqrt(4.5e6 / (W * H)));
  var c0 = document.createElement('canvas'), c = c0.getContext('2d')!;
  c0.width = Math.round(W * s); c0.height = Math.round(H * s);
  c0.setAttribute('aria-hidden', 'true');
  var me0 = o && o.at ? { x: o.at[0], y: o.at[1] } : st.map === 'formia' ? st : { x: m.start[0], y: m.start[1] };
  var sw = W / k, sh = H / k, fx = (me0.x + 0.5) * T, fy = (me0.y + 1.5) * T;
  var sx = Math.max(0, Math.min(mw - sw, fx - sw / 2)), sy = Math.max(0, Math.min(mh - sh, fy - sh / 2));
  var rx = Math.floor(sx / T), ry = Math.floor(sy / T), rect = { x: rx, y: ry, w: Math.min(m.w, Math.ceil((sx + sw) / T)) - rx, h: Math.min(m.h, Math.ceil((sy + sh) / T)) - ry };
  c.setTransform(s * k, 0, 0, s * k, -sx * s * k, -sy * s * k);
  c.drawImage(paintGround(m, P0, s, rect), rect.x * T, rect.y * T, rect.w * T, rect.h * T);
  var me = st.map === 'formia' ? st : { x: m.start[0], y: m.start[1], dir: m.start[2] };
  var people = m.people.filter(function (p) { return present(p) && !p.n.wild && !p.n.mon && p.n.pet == null; }).map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s), d: p.dir }; });
  people.push({ yb: (me.y + 1) * T + 0.5, x: me.x * T, y: me.y * T, w: walkerFor(hero(), s), d: me.dir });
  people.sort(function (a, b) { return a.yb - b.yb; });
  var items = sceneItems(m, P0, s);
  if (rich()) {
    /* the title is Formia on a sunny afternoon, whatever the hour (the picture is a still: the night is not drawn on it) */
    shade(c, c0.width, c0.height, s * k, { x: sx, y: sy, w: sw, h: sh }, casters(items, people, 0, s), { x: 0.42, y: 0.36, k: 1 }, 0, true, P0);
    c.setTransform(s * k, 0, 0, s * k, -sx * s * k, -sy * s * k);
  }
  drawSorted(c, items, people, s, { x: sx, y: sy, w: sw, h: sh }, 0);
  el.innerHTML = ''; el.appendChild(c0);
}


/** the whole map as one picture, as a data URL (used by the automated playtest) */
export function overview(id?: string, s?: number): string {
  var m = prepare(id || 'formia'), P0 = palette(), c0 = document.createElement('canvas'), c = c0.getContext('2d')!;
  s = s || 1; c0.width = m.w * T * s; c0.height = m.h * T * s;
  c.setTransform(s, 0, 0, s, 0, 0);
  c.drawImage(paintGround(m, P0, s), 0, 0, m.w * T, m.h * T);
  var people: Drawn[] = m.people.filter(function (p) { return present(p) && !p.n.wild && !p.n.mon && p.n.pet == null; }).map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s!), d: p.dir }; });
  m.items.forEach(function (it) { if (!st.found[it.id]) people.push({ yb: (it.y + 1) * T, x: it.x * T, spr: paintObject('item', P0, s!, { item: ITEMS[it.move].icon, up: UP.item }) }); });
  people.sort(function (a, b) { return a.yb - b.yb; });
  drawSorted(c, sceneItems(m, P0, s), people, s, null, 0);
  return c0.toDataURL('image/png');
}

/* ---------- the town map in the story menu: all of Formia, the places that matter, and where Antonio is ---------- */
var town: { key: string; cv: HTMLCanvasElement } | null = null;
const TOWN_LABELS: [string, string][] = [['Casa', 'casa'], ['Eclipse', 'eclipse'], ['Pineta', 'sign-pineta'], ['Morgana', 'morgana'], ['Piazza', 'piazza'], ['Castello', 'casa-claudia'], ['Torre verde', 'casa-valentin'],
  ['Stazione', 'stazione'], ['Bruno Zauli', 'zauli'], ['Tomba di Cicerone', 'tomba'], ['Gianola', 'mamurra']];
/** where Antonio is on the Formia map: indoors, at the door he went in by */
function whereOnFormia(): [number, number] {
  if (st.map === 'formia') return [st.x, st.y];
  const b = (prepare('formia').buildings || []).find(function (q) { return q.to === st.map; });
  return b ? [b.door[0], b.door[1] + 1] : [st.x, st.y];
}
export function townMap(el: HTMLElement) {
  /* drawn at the size it is shown, so labels and the marker stay readable on a phone */
  var m = prepare('formia'), cssW = Math.max(240, el.clientWidth || 340), s = cssW * dpr() / (m.w * T), u = dpr(), key = themeKey() + '|' + lairsKey(nextStop().id) + '|' + s.toFixed(4);
  if (!town || town.key !== key) {
    var P0 = palette(), c0 = document.createElement('canvas'), c = c0.getContext('2d')!;
    c0.width = Math.round(m.w * T * s); c0.height = Math.round(m.h * T * s);
    c.setTransform(s, 0, 0, s, 0, 0);
    c.drawImage(paintGround(m, P0, s), 0, 0, m.w * T, m.h * T);
    drawSorted(c, sceneItems(m, P0, s), [], s, null, 0);
    town = { key, cv: c0 };
  }
  var out = document.createElement('canvas'), o = out.getContext('2d')!, k = T * s;
  out.width = town.cv.width; out.height = town.cv.height;
  out.setAttribute('role', 'img'); out.setAttribute('aria-label', 'La pianta di Formia, con il punto dove si trova Antonio e una stella sulla prossima tappa');
  o.drawImage(town.cv, 0, 0);
  o.font = Math.round(11 * u) + 'px "Lilita One", "Arial Rounded MT Bold", sans-serif'; o.textAlign = 'center'; o.textBaseline = 'bottom';
  o.lineJoin = 'round'; o.lineWidth = 3 * u; o.strokeStyle = '#fffdf6'; o.fillStyle = '#1c2340';
  /* each label over its place; one that would cover another goes under its place, or beside it */
  var taken: number[][] = [], lh = 13 * u;
  TOWN_LABELS.forEach(function (l) {
    var p = FORMIA_AT[l[1]], q = FORMIA_SPOT[l[1]];
    if (!p && !q) return;
    var half = o.measureText(l[0]).width / 2 + 2 * u;
    var cx = p ? (p.x + p.w / 2) * k : (q[0] + 0.5) * k, top = p ? p.y * k - 2 : q[1] * k - 2, bottom = p ? (p.y + p.h) * k + lh : (q[1] + 1) * k + lh;
    var tries = [[cx, top], [cx, bottom], [cx - half - 4 * u, top], [cx + half + 4 * u, top], [cx - half - 4 * u, bottom], [cx + half + 4 * u, bottom]];
    var at = tries.map(function (t) { return [Math.max(half, Math.min(out.width - half, t[0])), Math.max(lh, Math.min(out.height, t[1]))]; })
      .find(function (t) { return !taken.some(function (b) { return Math.abs(b[0] - t[0]) < b[2] + half && Math.abs(b[1] - t[1]) < lh; }); }) || [Math.max(half, Math.min(out.width - half, cx)), top];
    taken.push([at[0], at[1], half]);
    o.strokeText(l[0], at[0], at[1]); o.fillText(l[0], at[0], at[1]);
  });
  /* the next stop, as a star */
  var hd0 = heading('formia');
  if (hd0) {
    var gx = (hd0.x + 0.5) * k, gy = (hd0.y + 0.5) * k, R = 7 * u;
    o.beginPath();
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, rr0 = i % 2 ? R * 0.45 : R; o.lineTo(gx + Math.cos(a) * rr0, gy + Math.sin(a) * rr0); }
    o.closePath(); o.fillStyle = '#ffd166'; o.fill(); o.lineWidth = 1.6 * u; o.strokeStyle = '#1c2340'; o.stroke();
  }
  /* with Antonio's visor (story/lairs.ts): the hiding places of the wild creatures, and the lost things not found yet */
  if (hasGift('visore')) {
    FORMIA_HIDING.forEach(function (h) { o.beginPath(); o.arc((h.x + 0.5) * k, (h.y + 0.5) * k, Math.max(3 * u, h.r * k), 0, Math.PI * 2); o.fillStyle = 'rgba(87,201,104,.28)'; o.fill(); o.lineWidth = 1 * u; o.strokeStyle = 'rgba(28,35,64,.5)'; o.stroke(); });
    (prepare('formia').items || []).forEach(function (it) { if (st.found[it.id]) return; var ix = (it.x + 0.5) * k, iy = (it.y + 0.5) * k; o.beginPath(); o.arc(ix, iy, 4 * u, 0, Math.PI * 2); o.fillStyle = '#fffdf6'; o.fill(); o.lineWidth = 2 * u; o.strokeStyle = '#b98cff'; o.stroke(); });
  }
  /* the scooter, wherever it was left, so it is never lost: a little blue Liberty with a ring */
  var mo = moto();
  if (mo.map === 'formia' && !st.sella) {
    var sx0 = (mo.x + 0.5) * k, sy0 = (mo.y + 0.5) * k, q = 4.5 * u;
    o.beginPath(); o.arc(sx0, sy0, q * 2.1, 0, Math.PI * 2); o.fillStyle = 'rgba(91,143,217,.25)'; o.fill();
    o.lineWidth = 1.6 * u; o.strokeStyle = '#1c2340';
    o.beginPath(); o.arc(sx0 - q, sy0 + q * 0.5, q * 0.55, 0, Math.PI * 2); o.fillStyle = '#1c2340'; o.fill();
    o.beginPath(); o.arc(sx0 + q, sy0 + q * 0.5, q * 0.55, 0, Math.PI * 2); o.fill();
    o.beginPath(); o.moveTo(sx0 - q * 1.2, sy0 + q * 0.2); o.lineTo(sx0 + q * 0.4, sy0 + q * 0.2); o.lineTo(sx0 + q * 0.9, sy0 - q * 1.1); o.lineTo(sx0 + q * 1.3, sy0 - q * 1.1); o.lineTo(sx0 + q * 1.1, sy0 + q * 0.2); o.lineTo(sx0 + q * 1.4, sy0 + q * 0.4);
    o.lineTo(sx0 - q * 1.4, sy0 + q * 0.4); o.closePath(); o.fillStyle = '#3f7ccf'; o.fill(); o.stroke();
    o.beginPath(); o.rect(sx0 - q * 1.5, sy0 - q * 0.9, q * 1.1, q * 0.9); o.fillStyle = '#3f7ccf'; o.fill(); o.stroke();
    o.font = Math.round(10 * u) + 'px "Lilita One", "Arial Rounded MT Bold", sans-serif'; o.textAlign = 'center'; o.textBaseline = 'top';
    o.lineWidth = 3 * u; o.strokeStyle = '#fffdf6'; o.strokeText('Liberty', sx0, sy0 + q * 1.3); o.fillStyle = '#1c2340'; o.fillText('Liberty', sx0, sy0 + q * 1.3);
    o.textBaseline = 'bottom';
  }
  var me = whereOnFormia(), mx = (me[0] + 0.5) * k, my = (me[1] + 0.5) * k, r = 5 * u;
  o.beginPath(); o.arc(mx, my, r * 1.9, 0, Math.PI * 2); o.fillStyle = 'rgba(232,71,58,.25)'; o.fill();
  o.beginPath(); o.arc(mx, my, r, 0, Math.PI * 2); o.fillStyle = '#e8473a'; o.fill(); o.lineWidth = 2 * u; o.strokeStyle = '#fffdf6'; o.stroke();
  out.style.width = '100%'; out.style.height = 'auto'; out.style.display = 'block';
  el.innerHTML = ''; el.appendChild(out);
}
