import { ITEMS } from '../data/items';
import type { Npc } from '../data/maps/types';
import { T, hash, palette, paintGround, tallFront, paintObject, walker, PEOPLE, LOOKS, townsperson, HEIGHT, type Palette, type Sprite, type PersonLook } from './canvas';
import { st } from '../save/story-progress';
import { M, prepare, present, blocked, key, DV, wildNow, type PreparedMap } from '../story/maps';
import { leadCreature, idOf } from '../story/growth';
import { mover, parity, STEP } from '../story/movement';
import { run } from '../story/run';
import { heading } from '../story/goals';
import { darkness, sunset } from '../story/daytime';
import { creature, MAGIC } from './svg/creatures';
import { cicero } from './svg/cicero';
import { standalone, thumb } from './svg';
import { SPECIES } from '../data/creatures';
import type { SpeciesId } from '../data/creatures';
import { FORMIA_AT, FORMIA_SPOT } from '../data/maps/formia-ground';
import { reduced } from '../ui/dom';
import { root, cv, ctx, ciceroShown } from '../ui/story-screen';

/* Drawing the story map: camera, cached pictures, everything sorted so people walk behind trees and roofs.
   This is the part a Phaser scene will take over; it only reads the story's state. */
const CH = 12;   /* tiles per side of a cached piece of ground */
function dpr() { return Math.min(2, window.devicePixelRatio || 1); }
type Walker = Record<string, HTMLCanvasElement[]>;
/** something drawn in the sorted pass: a still picture, or a person (walker frames, facing, frame) */
interface Drawn { yb: number; x: number; y?: number; spr?: Sprite; w?: Walker; d?: string; f?: number; img?: HTMLImageElement; glow?: string; alpha?: number; size?: number }
interface SceneItem { x: number; yb: number; spr: Sprite; bob: boolean; glide: number; lit?: boolean; glow?: HTMLCanvasElement | null }
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
  var add = function (x: number, yb: number, sp: Sprite, bob?: boolean, glide?: number, lit?: boolean) { items.push({ x: x, yb: yb, spr: sp, bob: !!bob, glide: glide || 0, lit: !!lit }); };
  for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
    var L = m.cell(x, y);
    if (!L.obj) continue;
    var sail = L.obj === 'board' || L.obj === 'windsurf';
    var color = L.obj === 'umbrella' ? UMBRELLAS[(x + y) % 3] : L.obj === 'boat' ? BOATS[(x + y) % 2] : sail ? SAILS[(x * 3 + y) % SAILS.length] : null, k = L.obj + (color || '');
    if (!spr[k]) spr[k] = paintObject(L.obj, P0, s, { color: color, up: UP[L.obj] });
    /* the windsurfers glide back and forth across the bay */
    add(x * T, (y + 1) * T, spr[k], L.obj === 'boat' || L.obj === 'windsurf', L.obj === 'windsurf' ? 3 : 0);
  }
  (m.buildings || []).forEach(function (b) {
    /* at night the windows light up: in every place, and in most of the houses */
    var lit = b.id.indexOf('casa-') !== 0 || hash(b.x, b.y, 7) < 0.7;
    add(b.x * T, (b.y + b.h) * T, paintObject(b.kind, P0, s, { w: b.w, h: b.h, up: UP[b.kind] || T, x: b.x, doorX: b.door[0], label: b.label, roof: b.roof, awning: b.awning, v: b.v }), false, 0, lit);
  });
  (m.objects || []).forEach(function (o) { add(o.x * T, (o.y + o.h) * T, paintObject(o.kind, P0, s, { w: o.w, h: o.h, up: UP[o.kind] || T, color: o.color }), o.bob); });
  if (m.signs && m.signs.length) {
    var sg = paintObject('sign', P0, s, {}), pl = paintObject('plate', P0, s, {});
    m.signs.forEach(function (g) { if (!g.quiet) add(g.x * T, (g.y + 1) * T, g.plate ? pl : sg); });
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
  while (cache.order.length > 12) delete cache.chunks[cache.order.shift()!];
  return c0;
}
/* the friends' faces on the map (Antonio's first) are their portraits of the battles: an image each, made once;
   until it has loaded they have the plain head */
var heads: Record<string, { img: HTMLImageElement; ok: boolean }> = {};
function headOf(id: string): HTMLImageElement | null {
  var h = heads[id];
  if (!h) {
    var img = new Image(), e = { img: img, ok: false };
    heads[id] = e;
    img.onload = function () { e.ok = true; };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(standalone(id, 'smirk', thumb(id)));
    return null;
  }
  return h.ok ? h.img : null;
}
function walkerFor(n: Pick<Npc, 'person' | 'seed' | 'look'>, s: number): Walker {
  var head = n.person ? headOf(n.person) : null, id = (n.person || n.look || ('npc' + n.seed)) + '@' + s + (head ? '+face' : '');
  return walkers[id] || (walkers[id] = walker(n.person ? (PEOPLE as Record<string, PersonLook>)[n.person] : n.look ? LOOKS[n.look] : townsperson(n.seed!), s, head || undefined));
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
function follower(now: number): Drawn | null {
  var uid = leadCreature(), img = uid ? creatureImage(idOf(uid) as SpeciesId) : null;
  if (!img) return null;
  if (!fol || fol.map !== M.id || (!mover && Math.abs(fol.x - st.x) + Math.abs(fol.y - st.y) > 2)) placeBehind();
  var f = fol!;
  if (mover && mover.t0 !== folStep) { folStep = mover.t0; f.fx = f.x; f.fy = f.y; f.x = mover.fx; f.y = mover.fy; f.t0 = mover.t0; }
  var t = Math.min(1, (now - f.t0) / STEP), hop = reduced || t >= 1 ? 0 : Math.sin(t * Math.PI) * 3;
  /* just behind Antonio when they are on the same row */
  return { yb: (f.fy + (f.y - f.fy) * t + 1) * T - 0.25 - hop, x: (f.fx + (f.x - f.fx) * t) * T, img: img, glow: MAGIC[SPECIES[idOf(uid!) as SpeciesId].type].col };
}
function itemSprite(kind: string, s: number): Sprite {
  var id = kind + '@' + s;
  return sprites[id] || (sprites[id] = paintObject('item', P || palette(), s, { item: kind, up: UP.item }));
}
/* draws the sorted items and the moving things in one pass, so people walk behind trees and roofs */
function drawSorted(c: CanvasRenderingContext2D, items: SceneItem[], people: Drawn[], s: number, view: { x: number; y: number; w: number; h: number } | null, now: number, night?: number, lit?: SceneItem[]) {
  var k = 0;
  var person = function (e: Drawn) {
    if (e.img) { var z = e.size || 52; if (e.alpha) c.globalAlpha = e.alpha; c.drawImage(e.img, e.x + 16 - z / 2, e.yb - z, z, z * (e.size ? 1.17 : 1)); c.globalAlpha = 1; return; }
    if (e.spr) { c.drawImage(e.spr.cv, e.x, e.yb - e.spr.h, e.spr.cv.width / s, e.spr.cv.height / s); return; }
    var img = e.w![e.d!][e.f || 0]; c.drawImage(img, e.x, e.y! - 12, img.width / s, img.height / s);
  };
  for (var n = 0; n < items.length; n++) {
    var it = items[n];
    while (k < people.length && people[k].yb <= it.yb) person(people[k++]);
    var gx = it.glide && now && !reduced ? Math.sin(now / 5200 + it.x * 0.013) * it.glide * T : 0;
    if (view && (it.x + gx + it.spr.w < view.x || it.x + gx > view.x + view.w || it.yb < view.y || it.yb - it.spr.h > view.y + view.h)) continue;
    var dy = it.bob && now && !reduced ? Math.sin(now / 650 + it.x * 0.037) * 1.5 : 0;
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
  var w = it.spr.cv.width, h = it.spr.cv.height, src: ImageData;
  try { src = it.spr.cv.getContext('2d')!.getImageData(0, 0, w, h); } catch (e) { return null; }
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
var lightCv: HTMLCanvasElement | null = null, NIGHT_A = 0.76, NIGHT_Q = 3;
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
  ctx.globalAlpha = dk * NIGHT_A; ctx.imageSmoothingEnabled = true;
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

var ME = { person: 'antonio' as const };
function playerPx(now: number) {
  if (!mover) return { x: st.x * T, y: st.y * T, t: 0 };
  var t = Math.min(1, (now - mover.t0) / STEP);
  return { x: (mover.fx + (mover.tx - mover.fx) * t) * T, y: (mover.fy + (mover.ty - mover.fy) * t) * T, t: t };
}
/** draws one frame of the map, around the player */
export function drawWorld(now: number) {
  ensureCaches(now);
  /* everything below is in map units (one tile = T); VS turns them into canvas pixels */
  var W = cv.width, H = cv.height, vw = W / VS, vh = H / VS, mw = M.w * T, mh = M.h * T;
  var pp = playerPx(now), lift = (H / DPR > 600 ? 56 : 28) / Z;   /* the player sits a little above the middle, clear of the pad */
  var camX = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, pp.x + T / 2 - vw / 2));
  var camY = mh <= vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, pp.y + T / 2 - vh / 2 + lift));
  camX = Math.round(camX * VS) / VS; camY = Math.round(camY * VS) / VS;
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
  var people: Drawn[] = [];
  M.people.filter(present).forEach(function (p) {
    if (p.n.wild) {
      /* a wild creature hops on the spot now and then */
      var img = creatureImage(wildNow(p.n)!.sp), hop = reduced ? 0 : Math.max(0, Math.sin(now / 260 + hash(p.x, p.y, 5) * 9)) * 4;
      if (img) people.push({ yb: (p.y + 1) * T - hop, x: p.x * T, img: img, glow: MAGIC[SPECIES[wildNow(p.n)!.sp].type].col });
      return;
    }
    var idle = p.n.person ? 0 : ((Math.floor(now / 700 + hash(p.x, p.y, 9) * 6) % 7) === 0 ? 1 : 0);
    people.push({ yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, RS), d: p.dir, f: reduced ? 0 : idle });
  });
  var step = mover && pp.t > 0.12 && pp.t < 0.88 ? (parity ? 1 : 2) : 0;
  people.push({ yb: pp.y + T + 0.5, x: pp.x, y: pp.y, w: walkerFor(ME, RS), d: st.dir, f: step });
  var fw = follower(now);
  if (fw) people.push(fw);
  var gh = ghost(now, pp);
  if (gh) people.push(gh);
  M.items.forEach(function (it) { if (!st.found[it.id]) people.push({ yb: (it.y + 1) * T, x: it.x * T, spr: itemSprite(ITEMS[it.move].icon, RS) }); });
  people.sort(function (a, b) { return a.yb - b.yb; });
  var date = new Date(), dk = M.inside ? 0 : darkness(date), sn = M.inside ? 0 : sunset(date), lit: SceneItem[] = [];
  drawSorted(ctx, cache.items, people, RS, { x: camX, y: camY, w: vw, h: vh }, now, lampsOn(dk), lit);
  /* in the tall grass the blades hide Antonio's feet, and his creature's */
  [[pp.x, pp.y]].concat(fw ? [[fw.x, fw.yb - T]] : []).forEach(function (q) {
    if (M.cell(Math.round(q[0] / T), Math.round(q[1] / T)).deco === 'tall') tallFront(ctx, q[0], q[1], P);
  });
  ctx.save(); drawNight(now, dk, sn, camX, camY, vw, vh, pp, lit, people); ctx.restore();
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
export function preview(el: HTMLElement | null) {
  if (!el) return;
  previewEl = el;
  var m = prepare('formia'), s = dpr(), P0 = palette(), mw = m.w * T, mh = m.h * T;
  var W = Math.max(200, el.clientWidth || 320), H = Math.max(100, el.clientHeight || 160), k = W < 420 ? 0.62 : 0.74;
  var c0 = document.createElement('canvas'), c = c0.getContext('2d')!;
  c0.width = Math.round(W * s); c0.height = Math.round(H * s);
  c0.setAttribute('aria-hidden', 'true');
  var me0 = st.map === 'formia' ? st : { x: m.start[0], y: m.start[1] };
  var sw = W / k, sh = H / k, fx = (me0.x + 0.5) * T, fy = (me0.y + 1.5) * T;
  var sx = Math.max(0, Math.min(mw - sw, fx - sw / 2)), sy = Math.max(0, Math.min(mh - sh, fy - sh / 2));
  var rx = Math.floor(sx / T), ry = Math.floor(sy / T), rect = { x: rx, y: ry, w: Math.min(m.w, Math.ceil((sx + sw) / T)) - rx, h: Math.min(m.h, Math.ceil((sy + sh) / T)) - ry };
  c.setTransform(s * k, 0, 0, s * k, -sx * s * k, -sy * s * k);
  c.drawImage(paintGround(m, P0, s, rect), rect.x * T, rect.y * T, rect.w * T, rect.h * T);
  var me = st.map === 'formia' ? st : { x: m.start[0], y: m.start[1], dir: m.start[2] };
  var people = m.people.filter(function (p) { return present(p) && !p.n.wild; }).map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s), d: p.dir }; });
  people.push({ yb: (me.y + 1) * T + 0.5, x: me.x * T, y: me.y * T, w: walkerFor(ME, s), d: me.dir });
  people.sort(function (a, b) { return a.yb - b.yb; });
  drawSorted(c, sceneItems(m, P0, s), people, s, { x: sx, y: sy, w: sw, h: sh }, 0);
  el.innerHTML = ''; el.appendChild(c0);
}


/** the whole map as one picture, as a data URL (used by the automated playtest) */
export function overview(id?: string, s?: number): string {
  var m = prepare(id || 'formia'), P0 = palette(), c0 = document.createElement('canvas'), c = c0.getContext('2d')!;
  s = s || 1; c0.width = m.w * T * s; c0.height = m.h * T * s;
  c.setTransform(s, 0, 0, s, 0, 0);
  c.drawImage(paintGround(m, P0, s), 0, 0, m.w * T, m.h * T);
  var people: Drawn[] = m.people.filter(function (p) { return present(p) && !p.n.wild; }).map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s!), d: p.dir }; });
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
