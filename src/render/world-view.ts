import { ITEMS } from '../data/items';
import type { Npc } from '../data/maps/types';
import { T, hash, palette, paintGround, tallFront, paintObject, walker, PEOPLE, PEOPLE_FORMS, LOOKS, townsperson, HEIGHT, type Palette, type Sprite } from './canvas';
import { st } from '../save/story-progress';
import { M, prepare, present, blocked, key, DV, wildNow, petAt, moveMode, moto, type PreparedMap } from '../story/maps';
import { leadCreature, idOf, creatureOf, formNow, firstHuman } from '../story/growth';
import type { FriendId } from '../data/characters';
import { mover, parity, STEP, gear } from '../story/movement';
import { motoParked, motoRider, MOTO_W, MOTO_H } from './canvas/moto';
import type { PersonLook } from './canvas/walkers';
import type { Dir } from '../data/maps/types';
import { mk } from './canvas/draw';
import { run } from '../story/run';
import { placeNow } from '../story/place-run';
import { drawThings } from './canvas/place';
import { heading } from '../story/goals';
import { darkness, sunset, sunAt } from '../story/daytime';
import { creature, MAGIC } from './svg/creatures';
import { cicero, mamurra } from './svg/cicero';
import { SPECIES } from '../data/creatures';
import type { SpeciesId } from '../data/creatures';
import { FORMIA_AT, FORMIA_SPOT } from '../data/maps/formia-ground';
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
  hop?: number; breath?: number }
interface SceneItem { x: number; yb: number; spr: Sprite; bob: boolean; glide: number; lit?: boolean; glow?: HTMLCanvasElement | null;
  /** the light and the wind (render/atmosphere.ts): how much it leans in the wind; the block that casts its shadow (a
      building), or none when it floats; the same picture without the light on it, to find its windows at night */
  sway?: number; box?: Caster['box']; afloat?: boolean; flat?: () => Sprite }
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
var UMBRELLAS = ['#ff8fc1', '#8fd0f6', '#ffd166'], BOATS = ['#ffffff', '#ffe9a8'], SAILS = ['#ff8a3c', '#3f9fc4', '#e9765f', '#57c968', '#ffd166'];
function themeKey() { return getComputedStyle(document.documentElement).getPropertyValue('--m-paper').trim() + '|' + RS; }
/* the tall still things of a map, sorted by their bottom edge (the ground is painted in pieces, see chunk) */
function sceneItems(m: PreparedMap, P0: Palette, s: number): SceneItem[] {
  var items: SceneItem[] = [], spr: Record<string, Sprite> = {};
  var add = function (x: number, yb: number, sp: Sprite, bob?: boolean, glide?: number, lit?: boolean): SceneItem {
    var it: SceneItem = { x: x, yb: yb, spr: sp, bob: !!bob, glide: glide || 0, lit: !!lit };
    items.push(it);
    return it;
  };
  /* a block casts the shadow of its footprint, as high as it stands over it (and a little more: its front has a height too) */
  var block = function (x: number, y: number, w: number, h: number, kind: string) { return { x: x * T, y: y * T, w: w * T, h: h * T, up: (UP[kind] || T) + T * 0.45 }; };
  for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
    var L = m.cell(x, y);
    if (!L.obj) continue;
    var sail = L.obj === 'board' || L.obj === 'windsurf';
    var color = L.obj === 'umbrella' ? UMBRELLAS[(x + y) % 3] : L.obj === 'boat' ? BOATS[(x + y) % 2] : sail ? SAILS[(x * 3 + y) % SAILS.length] : null, k = L.obj + (color || '');
    if (!spr[k]) spr[k] = volume(paintObject(L.obj, P0, s, { color: color, up: UP[L.obj] }), P0);
    /* the windsurfers glide back and forth across the bay */
    var it = add(x * T, (y + 1) * T, spr[k], L.obj === 'boat' || L.obj === 'windsurf', L.obj === 'windsurf' ? 3 : 0);
    it.sway = SWAY[L.obj] || 0; it.afloat = L.g === 'sea';
  }
  (m.buildings || []).forEach(function (b) {
    /* at night the windows light up: in every place, and in most of the houses */
    var lit = b.id.indexOf('casa-') !== 0 || hash(b.x, b.y, 7) < 0.7;
    var paint = function () { return paintObject(b.kind, P0, s, { w: b.w, h: b.h, up: UP[b.kind] || T, x: b.x, doorX: b.door[0], label: b.label, roof: b.roof, awning: b.awning, v: b.v }); };
    var it = add(b.x * T, (b.y + b.h) * T, volume(paint(), P0), false, 0, lit);
    it.box = block(b.x, b.y, b.w, b.h, b.kind); it.flat = paint;
  });
  (m.objects || []).forEach(function (o) {
    var it = add(o.x * T, (o.y + o.h) * T, volume(paintObject(o.kind, P0, s, { w: o.w, h: o.h, up: UP[o.kind] || T, color: o.color }), P0), o.bob);
    /* wide things are blocks; slender ones (a monument, the lighthouse) are laid down as they are drawn */
    if (o.w * o.h > 2) it.box = block(o.x, o.y, o.w, o.h, o.kind);
    it.afloat = !!o.bob || m.cell(o.x, o.y).g === 'sea';
  });
  if (m.signs && m.signs.length) {
    var sg = volume(paintObject('sign', P0, s, {}), P0), pl = volume(paintObject('plate', P0, s, {}), P0), vw = volume(paintObject('viewer', P0, s, {}), P0);
    m.signs.forEach(function (g) { if (!g.quiet) add(g.x * T, (g.y + 1) * T, g.view ? vw : g.plate ? pl : sg); });
  }
  items.sort(function (a, b) { return a.yb - b.yb; });
  return items;
}
function ensureCaches(now: number) {
  if (!themeK || now - themeAt > 500) { themeK = themeKey(); themeAt = now; }
  if (cache.map === M.id && cache.theme === themeK) return;
  P = palette();
  cache.items = sceneItems(M, P, RS); cache.lights = lightsOf(M); cache.chunks = {}; cache.order = []; sprites = {};
  cache.map = M.id; cache.theme = themeK;
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
function creatureImage(sp: SpeciesId): HTMLImageElement | null {
  var m = monImg[sp];
  if (!m) {
    var img = new Image(), entry = { img: img, ok: false };
    monImg[sp] = entry;
    img.onload = function () { entry.ok = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(creature(sp, 'smirk', '', '0 0 200 200', 'smirk'));
    return null;
  }
  return m.ok ? m.img : null;
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
var fol: { map: string; x: number; y: number; fx: number; fy: number; t0: number } | null = null, folStep = -1;
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
    folStep = mover.t0;
    /* stepping off the scooter leaves it on the tile behind him: the creature jumps down beside it */
    var pm = moto();
    if (pm.map === M.id && pm.x === mover.fx && pm.y === mover.fy) { placeBehind(); f = fol!; }
    else { f.fx = f.x; f.fy = f.y; f.x = mover.fx; f.y = mover.fy; f.t0 = mover.t0; }
  }
  var t = Math.min(1, (now - f.t0) / STEP), hop = reduced || t >= 1 ? 0 : Math.sin(t * Math.PI) * 3;
  /* just behind Antonio when they are on the same row; a little smaller than a wild one, so that it does not hide him */
  return { yb: (f.fy + (f.y - f.fy) * t + 1) * T - 0.25 - hop, x: (f.fx + (f.x - f.fx) * t) * T, img: img, z: FOLLOWER, glow: MAGIC[SPECIES[idOf(uid!) as SpeciesId].type].col };
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
/* draws the sorted items and the moving things in one pass, so people walk behind trees and roofs */
function drawSorted(c: CanvasRenderingContext2D, items: SceneItem[], people: Drawn[], s: number, view: { x: number; y: number; w: number; h: number } | null, now: number, night?: number, lit?: SceneItem[]) {
  var k = 0;
  var person = function (e: Drawn) {
    if (e.img) { var z = e.size || e.z || 52; if (e.alpha) c.globalAlpha = e.alpha; c.drawImage(e.img, e.x + 16 - z / 2, e.yb - z, z, z * (e.size ? 1.17 : 1)); c.globalAlpha = 1; return; }
    if (e.spr) { c.drawImage(e.spr.cv, e.x, e.yb - e.spr.h, e.spr.cv.width / s, e.spr.cv.height / s); return; }
    var img = e.w![e.d!][e.f || 0], ih = img.height / s, br = e.breath || 1;
    if (e.alpha) c.globalAlpha = e.alpha;
    /* breathing: the picture grows and shrinks by a hair from the feet up (the last 2 px are its shadow on the ground) */
    c.drawImage(img, e.x, e.y! - 12 - (e.hop || 0) - (ih - 2) * (br - 1), img.width / s, ih * br); c.globalAlpha = 1;
  };
  for (var n = 0; n < items.length; n++) {
    var it = items[n];
    while (k < people.length && people[k].yb <= it.yb) person(people[k++]);
    var gx = it.glide && now && !reduced ? Math.sin(now / 5200 + it.x * 0.013) * it.glide * T : 0;
    if (view && (it.x + gx + it.spr.w < view.x || it.x + gx > view.x + view.w || it.yb < view.y || it.yb - it.spr.h > view.y + view.h)) continue;
    var dy = it.bob && now && !reduced ? Math.sin(now / 650 + it.x * 0.037) * 1.5 : 0;
    if (it.sway && now && !reduced && rich()) {
      /* a tree in the wind: it leans from its foot, the top the most */
      c.save(); c.transform(1, 0, -it.sway * wind(it.x, it.yb, now), 1, it.x + T / 2, it.yb - 3);
      c.drawImage(it.spr.cv, -T / 2, 3 - it.spr.h, it.spr.cv.width / s, it.spr.cv.height / s); c.restore();
    } else
    c.drawImage(it.spr.cv, it.x + gx, it.yb - it.spr.h + dy, it.spr.cv.width / s, it.spr.cv.height / s);
    if (night && it.lit) {
      var g = glowOf(it);
      if (g) { c.globalAlpha = night; c.drawImage(g, it.x, it.yb - it.spr.h, it.spr.cv.width / s, it.spr.cv.height / s); c.globalAlpha = 1; if (lit) lit.push(it); }
    }
  }
  while (k < people.length) person(people[k++]);
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
    hole(pp.x + T / 2, pp.y + T / 2, T * 4.8, 1);
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
    people.push({ yb: wy + T, x: wx, y: wy, w: walkerFor(p.n, RS), d: p.dir, f: wf, alpha: fade < 1 ? fade : undefined,
      hop: p.mv && !reduced ? stepHop(Math.min(1, (now - p.mv.t0) / STEP)) : 0, breath: p.mv || reduced || !fx ? 1 : 1 + 0.014 * Math.sin(now / 820 + hash(p.x, p.y, 11) * 6.3) });
    if (p.alert) alerts.push([wx + T / 2, wy - 14, now - p.alert]);
  });
  var step = mover && pp.t > 0.12 && pp.t < 0.88 ? (parity ? 1 : 2) : 0;
  var riding = !!st.sella && !M.inside;
  if (riding) people.push(rider(now, RS, pp));
  else people.push({ yb: pp.y + T + 0.5, x: pp.x, y: pp.y, w: walkerFor(hero(), RS), d: st.dir, f: step,
    hop: mover && !reduced && !moveMode.swim ? (mover.jump ? Math.sin(pp.t * Math.PI) * 13 : stepHop(pp.t)) : 0, breath: mover || reduced || !fx ? 1 : 1 + 0.014 * Math.sin(now / 820) });
  var pk = parkedMoto(RS);
  if (pk) people.push(pk);
  /* on the scooter the creature rides behind him */
  var fw = riding ? null : follower(now);
  if (fw) people.push(fw);
  var gh = ghost(now, pp);
  if (gh) people.push(gh);
  M.items.forEach(function (it) { if (!st.found[it.id]) people.push({ yb: (it.y + 1) * T, x: it.x * T, spr: itemSprite(ITEMS[it.move].icon, RS) }); });
  people.sort(function (a, b) { return a.yb - b.yb; });
  if (tiles) {
    /* on the ground, under everyone: the shadows, turning with the sun, and the clouds'; the pigeons that have not flown off */
    shade(ctx, W, H, VS, cam, casters(cache.items, people, now), sun, now, reduced, P);
    ctx.setTransform(VS, 0, 0, VS, -camX * VS, -camY * VS);
    pigeons(ctx, tiles, M.id, cam, now, reduced, pp.x, pp.y, 1 - dk, false);
  }
  if (riding) exhaust(ctx, now, pp);
  drawSorted(ctx, cache.items, people, RS, cam, now, lampsOn(dk), lit);
  /* in the tall grass the blades hide Antonio's feet, and his creature's */
  [[pp.x, pp.y]].concat(fw ? [[fw.x, fw.yb - T]] : []).forEach(function (q) {
    if (M.cell(Math.round(q[0] / T), Math.round(q[1] / T)).deco === 'tall') tallFront(ctx, q[0], q[1], P);
  });
  /* swimming: the water comes up to his waist, with a ring of foam */
  if (moveMode.swim) {
    var wv = reduced ? 0 : Math.sin(now / 300) * 1.5;
    ctx.globalAlpha = 0.92; ctx.fillStyle = P.sea;
    ctx.beginPath(); ctx.ellipse(pp.x + T / 2, pp.y + T * 0.8 + wv, T * 0.58, T * 0.34, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = P.foam; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(pp.x + T / 2, pp.y + T * 0.62 + wv, T * 0.5, T * 0.16, 0, 0, Math.PI * 2); ctx.stroke();
  }
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
      ctx.drawImage(fimg, pp.x + T / 2 + Math.cos(ang) * T * 2.2 / sk - size / 2, pp.y - T * 1.5 / sk + Math.sin(ang) * T * 0.8 / sk - size / 2, size, size);
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
  var hd = run ? null : heading(M.id);
  if (hd) {
    var ax = hd.x * T + T / 2, ay = hd.y * T - 16 + (reduced ? 0 : Math.sin(now / 220) * 3);
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
  var people = m.people.filter(function (p) { return present(p) && !p.n.wild && p.n.pet == null; }).map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s), d: p.dir }; });
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
  var people: Drawn[] = m.people.filter(function (p) { return present(p) && !p.n.wild && p.n.pet == null; }).map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s!), d: p.dir }; });
  m.items.forEach(function (it) { if (!st.found[it.id]) people.push({ yb: (it.y + 1) * T, x: it.x * T, spr: paintObject('item', P0, s!, { item: ITEMS[it.move].icon, up: UP.item }) }); });
  people.sort(function (a, b) { return a.yb - b.yb; });
  drawSorted(c, sceneItems(m, P0, s), people, s, null, 0);
  return c0.toDataURL('image/png');
}

/* ---------- the town map in the story menu: all of Formia, the places that matter, and where Antonio is ---------- */
var town: { key: string; cv: HTMLCanvasElement } | null = null;
const TOWN_LABELS: [string, string][] = [['Casa', 'casa'], ['Eclipse', 'eclipse'], ['Pineta', 'sign-pineta'], ['Morgana', 'morgana'], ['Piazza', 'piazza'],
  ['Stazione', 'stazione'], ['Bruno Zauli', 'zauli'], ['Tomba di Cicerone', 'tomba'], ['Gianola', 'mamurra']];
/** where Antonio is on the Formia map: indoors, at the door he went in by */
function whereOnFormia(): [number, number] {
  if (st.map === 'formia') return [st.x, st.y];
  const b = (prepare('formia').buildings || []).find(function (q) { return q.to === st.map; });
  return b ? [b.door[0], b.door[1] + 1] : [st.x, st.y];
}
export function townMap(el: HTMLElement) {
  /* drawn at the size it is shown, so labels and the marker stay readable on a phone */
  var m = prepare('formia'), cssW = Math.max(240, el.clientWidth || 340), s = cssW * dpr() / (m.w * T), u = dpr(), key = themeKey() + '|' + s.toFixed(4);
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
  var me = whereOnFormia(), mx = (me[0] + 0.5) * k, my = (me[1] + 0.5) * k, r = 5 * u;
  o.beginPath(); o.arc(mx, my, r * 1.9, 0, Math.PI * 2); o.fillStyle = 'rgba(232,71,58,.25)'; o.fill();
  o.beginPath(); o.arc(mx, my, r, 0, Math.PI * 2); o.fillStyle = '#e8473a'; o.fill(); o.lineWidth = 2 * u; o.strokeStyle = '#fffdf6'; o.stroke();
  out.style.width = '100%'; out.style.height = 'auto'; out.style.display = 'block';
  el.innerHTML = ''; el.appendChild(out);
}
