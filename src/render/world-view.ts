import { ITEMS } from '../data/items';
import type { Npc } from '../data/maps/types';
import { T, hash, palette, paintGround, paintObject, walker, PEOPLE, townsperson, type Palette, type Sprite, type PersonLook } from './canvas';
import { st } from '../save/story-progress';
import { M, prepare, type PreparedMap } from '../story/maps';
import { mover, parity, STEP } from '../story/movement';
import { reduced } from '../ui/dom';
import { root, cv, ctx } from '../ui/story-screen';

/* Drawing the story map: camera, cached pictures, everything sorted so people walk behind trees and roofs.
   This is the part a Phaser scene will take over; it only reads the story's state. */
const CH = 12;   /* tiles per side of a cached piece of ground */
function dpr() { return Math.min(2, window.devicePixelRatio || 1); }
type Walker = Record<string, HTMLCanvasElement[]>;
/** something drawn in the sorted pass: a still picture, or a person (walker frames, facing, frame) */
interface Drawn { yb: number; x: number; y?: number; spr?: Sprite; w?: Walker; d?: string; f?: number }
interface SceneItem { x: number; yb: number; spr: Sprite; bob: boolean }

/* ---------- drawing ---------- */
/* DPR: device pixels per CSS pixel. Z: map zoom (big screens see the map larger). VS = DPR × Z: device pixels
   per map pixel on screen. RS: the resolution the cached pictures are painted at, the same as VS so zoomed
   tiles stay sharp, but at most 3 so a big map's ground stays a reasonable size in memory. */
var DPR = dpr(), Z = 1, VS = DPR, RS = DPR, P = null as unknown as Palette, themeK = '', themeAt = 0, previewEl: HTMLElement | null = null;
var cache: { map: string | null; theme: string; chunks: Record<string, HTMLCanvasElement>; order: string[]; items: SceneItem[] } = { map: null, theme: '', chunks: {}, order: [], items: [] };
var walkers: Record<string, Walker> = {}, sprites: Record<string, Sprite> = {};
/* how far above its footprint each kind of thing is drawn */
const UP: Record<string, number> = { tower: T * 2.4, tomb: T * 1.9, house: T * 0.75, station: T * 0.75, circolo: T * 0.9, bar: T * 0.75, shop: T * 0.75, palazzo: T * 1.1,
  church: T * 2.15, octagon: T * 2.1, clocktower: T * 2.05, coni: T * 0.75, lido: T * 0.9, kiosk: T * 0.6, ferry: T * 0.75, cypress: T * 1.6,
  lifeguard: T * 1.4, ruins: T * 0.9, tunnel: T * 0.5, fountain: T * 0.5, car: T * 0.2, item: T * 0.4 };
var UMBRELLAS = ['#ff8fc1', '#8fd0f6', '#ffd166'], BOATS = ['#ffffff', '#ffe9a8'];
function themeKey() { return getComputedStyle(document.documentElement).getPropertyValue('--m-paper').trim() + '|' + RS; }
/* the tall still things of a map, sorted by their bottom edge (the ground is painted in pieces, see chunk) */
function sceneItems(m: PreparedMap, P0: Palette, s: number): SceneItem[] {
  var items: SceneItem[] = [], spr: Record<string, Sprite> = {};
  var add = function (x: number, yb: number, sp: Sprite, bob?: boolean) { items.push({ x: x, yb: yb, spr: sp, bob: !!bob }); };
  for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
    var L = m.cell(x, y);
    if (!L.obj) continue;
    var color = L.obj === 'umbrella' ? UMBRELLAS[(x + y) % 3] : L.obj === 'boat' ? BOATS[(x + y) % 2] : null, k = L.obj + (color || '');
    if (!spr[k]) spr[k] = paintObject(L.obj, P0, s, { color: color, up: UP[L.obj] });
    add(x * T, (y + 1) * T, spr[k], L.obj === 'boat');
  }
  (m.buildings || []).forEach(function (b) {
    add(b.x * T, (b.y + b.h) * T, paintObject(b.kind, P0, s, { w: b.w, h: b.h, up: UP[b.kind] || T, x: b.x, doorX: b.door[0], label: b.label, roof: b.roof, awning: b.awning }));
  });
  (m.objects || []).forEach(function (o) { add(o.x * T, (o.y + o.h) * T, paintObject(o.kind, P0, s, { w: o.w, h: o.h, up: UP[o.kind] || T, color: o.color }), o.bob); });
  if (m.signs && m.signs.length) {
    var sg = paintObject('sign', P0, s, {});
    m.signs.forEach(function (g) { add(g.x * T, (g.y + 1) * T, sg); });
  }
  items.sort(function (a, b) { return a.yb - b.yb; });
  return items;
}
function ensureCaches(now: number) {
  if (!themeK || now - themeAt > 500) { themeK = themeKey(); themeAt = now; }
  if (cache.map === M.id && cache.theme === themeK) return;
  P = palette();
  cache.items = sceneItems(M, P, RS); cache.chunks = {}; cache.order = []; sprites = {};
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
function walkerFor(n: Pick<Npc, 'person' | 'seed'>, s: number): Walker {
  var id = (n.person || ('npc' + n.seed)) + '@' + s;
  return walkers[id] || (walkers[id] = walker(n.person ? (PEOPLE as Record<string, PersonLook>)[n.person] : townsperson(n.seed!), s));
}
function itemSprite(kind: string, s: number): Sprite {
  var id = kind + '@' + s;
  return sprites[id] || (sprites[id] = paintObject('item', P || palette(), s, { item: kind, up: UP.item }));
}
/* draws the sorted items and the moving things in one pass, so people walk behind trees and roofs */
function drawSorted(c: CanvasRenderingContext2D, items: SceneItem[], people: Drawn[], s: number, view: { x: number; y: number; w: number; h: number } | null, now: number) {
  var k = 0;
  var person = function (e: Drawn) {
    if (e.spr) { c.drawImage(e.spr.cv, e.x, e.yb - e.spr.h, e.spr.cv.width / s, e.spr.cv.height / s); return; }
    var img = e.w![e.d!][e.f || 0]; c.drawImage(img, e.x, e.y! - 12, img.width / s, img.height / s);
  };
  for (var n = 0; n < items.length; n++) {
    var it = items[n];
    while (k < people.length && people[k].yb <= it.yb) person(people[k++]);
    if (view && (it.x + it.spr.w < view.x || it.x > view.x + view.w || it.yb < view.y || it.yb - it.spr.h > view.y + view.h)) continue;
    var dy = it.bob && now && !reduced ? Math.sin(now / 650 + it.x * 0.037) * 1.5 : 0;
    c.drawImage(it.spr.cv, it.x, it.yb - it.spr.h + dy, it.spr.cv.width / s, it.spr.cv.height / s);
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
  var people: Drawn[] = M.people.map(function (p) {
    var idle = p.n.person ? 0 : ((Math.floor(now / 700 + hash(p.x, p.y, 9) * 6) % 7) === 0 ? 1 : 0);
    return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, RS), d: p.dir, f: reduced ? 0 : idle };
  });
  var step = mover && pp.t > 0.12 && pp.t < 0.88 ? (parity ? 1 : 2) : 0;
  people.push({ yb: pp.y + T + 0.5, x: pp.x, y: pp.y, w: walkerFor(ME, RS), d: st.dir, f: step });
  M.items.forEach(function (it) { if (!st.found[it.id]) people.push({ yb: (it.y + 1) * T, x: it.x * T, spr: itemSprite(ITEMS[it.move].icon, RS) }); });
  people.sort(function (a, b) { return a.yb - b.yb; });
  drawSorted(ctx, cache.items, people, RS, { x: camX, y: camY, w: vw, h: vh }, now);
  /* a glint on the lost things, gulls over the water */
  M.items.forEach(function (it) {
    if (st.found[it.id]) return;
    var tw = reduced ? 0.8 : 0.5 + 0.5 * Math.sin(now / 260 + it.x), gx = it.x * T + 25, gy = it.y * T - 4, r = 2 + tw * 3;
    ctx.globalAlpha = 0.4 + tw * 0.6; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1c2340'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(gx, gy - r * 1.8); ctx.lineTo(gx + r * 0.5, gy - r * 0.5); ctx.lineTo(gx + r * 1.8, gy); ctx.lineTo(gx + r * 0.5, gy + r * 0.5);
    ctx.lineTo(gx, gy + r * 1.8); ctx.lineTo(gx - r * 0.5, gy + r * 0.5); ctx.lineTo(gx - r * 1.8, gy); ctx.lineTo(gx - r * 0.5, gy - r * 0.5); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
  });
  M.gulls.forEach(function (gl) {
    var t1 = reduced ? gl.ph : gl.ph + now * gl.sp, x = gl.x + Math.cos(t1) * gl.r, y = gl.y + Math.sin(t1) * gl.r * 0.55;
    if (x < camX - 20 || x > camX + vw + 20 || y < camY - 20 || y > camY + vh + 20) return;
    var fl = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now / 140 + gl.ph * 9), wy = 2 + fl * 4;
    ctx.beginPath(); ctx.moveTo(x - 9, y - wy); ctx.quadraticCurveTo(x - 4, y - wy - 3, x, y); ctx.quadraticCurveTo(x + 4, y - wy - 3, x + 9, y - wy);
    ctx.strokeStyle = '#1c2340'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
  });
}

/* a still picture of Formia for the home page: the square, Mola and the seafront */
export function preview(el: HTMLElement | null) {
  if (!el) return;
  previewEl = el;
  var m = prepare('formia'), s = dpr(), P0 = palette(), mw = m.w * T, mh = m.h * T;
  var W = Math.max(200, el.clientWidth || 320), H = Math.max(100, el.clientHeight || 160), k = W < 420 ? 0.62 : 0.74;
  var c0 = document.createElement('canvas'), c = c0.getContext('2d')!;
  c0.width = Math.round(W * s); c0.height = Math.round(H * s);
  c0.setAttribute('aria-hidden', 'true');
  var sw = W / k, sh = H / k, fx = 23 * T, fy = 23.4 * T;
  var sx = Math.max(0, Math.min(mw - sw, fx - sw / 2)), sy = Math.max(0, Math.min(mh - sh, fy - sh / 2));
  var rx = Math.floor(sx / T), ry = Math.floor(sy / T), rect = { x: rx, y: ry, w: Math.min(m.w, Math.ceil((sx + sw) / T)) - rx, h: Math.min(m.h, Math.ceil((sy + sh) / T)) - ry };
  c.setTransform(s * k, 0, 0, s * k, -sx * s * k, -sy * s * k);
  c.drawImage(paintGround(m, P0, s, rect), rect.x * T, rect.y * T, rect.w * T, rect.h * T);
  var me = st.map === 'formia' ? st : { x: m.start[0], y: m.start[1], dir: m.start[2] };
  var people = m.people.map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s), d: p.dir }; });
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
  var people: Drawn[] = m.people.map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s!), d: p.dir }; });
  m.items.forEach(function (it) { if (!st.found[it.id]) people.push({ yb: (it.y + 1) * T, x: it.x * T, spr: paintObject('item', P0, s!, { item: ITEMS[it.move].icon, up: UP.item }) }); });
  people.sort(function (a, b) { return a.yb - b.yb; });
  drawSorted(c, sceneItems(m, P0, s), people, s, null, 0);
  return c0.toDataURL('image/png');
}
