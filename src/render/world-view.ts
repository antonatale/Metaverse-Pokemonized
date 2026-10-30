import { ITEMS } from '../data/items';
import type { Npc } from '../data/maps/types';
import { T, hash, palette, paintGround, paintObject, walker, PEOPLE, LOOKS, townsperson, HEIGHT, type Palette, type Sprite, type PersonLook } from './canvas';
import { st } from '../save/story-progress';
import { M, prepare, present, type PreparedMap } from '../story/maps';
import { mover, parity, STEP } from '../story/movement';
import { run } from '../story/run';
import { heading } from '../story/goals';
import { FORMIA_AT, FORMIA_SPOT } from '../data/maps/formia-ground';
import { reduced } from '../ui/dom';
import { root, cv, ctx } from '../ui/story-screen';

/* Drawing the story map: camera, cached pictures, everything sorted so people walk behind trees and roofs.
   This is the part a Phaser scene will take over; it only reads the story's state. */
const CH = 12;   /* tiles per side of a cached piece of ground */
function dpr() { return Math.min(2, window.devicePixelRatio || 1); }
type Walker = Record<string, HTMLCanvasElement[]>;
/** something drawn in the sorted pass: a still picture, or a person (walker frames, facing, frame) */
interface Drawn { yb: number; x: number; y?: number; spr?: Sprite; w?: Walker; d?: string; f?: number }
interface SceneItem { x: number; yb: number; spr: Sprite; bob: boolean; glide: number }

/* ---------- drawing ---------- */
/* DPR: device pixels per CSS pixel. Z: map zoom (big screens see the map larger). VS = DPR × Z: device pixels
   per map pixel on screen. RS: the resolution the cached pictures are painted at, the same as VS so zoomed
   tiles stay sharp, but at most 3 so a big map's ground stays a reasonable size in memory. */
var DPR = dpr(), Z = 1, VS = DPR, RS = DPR, P = null as unknown as Palette, themeK = '', themeAt = 0, previewEl: HTMLElement | null = null;
var cache: { map: string | null; theme: string; chunks: Record<string, HTMLCanvasElement>; order: string[]; items: SceneItem[] } = { map: null, theme: '', chunks: {}, order: [], items: [] };
var walkers: Record<string, Walker> = {}, sprites: Record<string, Sprite> = {};
/* how far above its footprint each kind of thing is drawn */
const UP = HEIGHT;
var UMBRELLAS = ['#ff8fc1', '#8fd0f6', '#ffd166'], BOATS = ['#ffffff', '#ffe9a8'], SAILS = ['#ff8a3c', '#3f9fc4', '#e9765f', '#57c968', '#ffd166'];
function themeKey() { return getComputedStyle(document.documentElement).getPropertyValue('--m-paper').trim() + '|' + RS; }
/* the tall still things of a map, sorted by their bottom edge (the ground is painted in pieces, see chunk) */
function sceneItems(m: PreparedMap, P0: Palette, s: number): SceneItem[] {
  var items: SceneItem[] = [], spr: Record<string, Sprite> = {};
  var add = function (x: number, yb: number, sp: Sprite, bob?: boolean, glide?: number) { items.push({ x: x, yb: yb, spr: sp, bob: !!bob, glide: glide || 0 }); };
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
    add(b.x * T, (b.y + b.h) * T, paintObject(b.kind, P0, s, { w: b.w, h: b.h, up: UP[b.kind] || T, x: b.x, doorX: b.door[0], label: b.label, roof: b.roof, awning: b.awning, v: b.v }));
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
function walkerFor(n: Pick<Npc, 'person' | 'seed' | 'look'>, s: number): Walker {
  var id = (n.person || n.look || ('npc' + n.seed)) + '@' + s;
  return walkers[id] || (walkers[id] = walker(n.person ? (PEOPLE as Record<string, PersonLook>)[n.person] : n.look ? LOOKS[n.look] : townsperson(n.seed!), s));
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
    var gx = it.glide && now && !reduced ? Math.sin(now / 5200 + it.x * 0.013) * it.glide * T : 0;
    if (view && (it.x + gx + it.spr.w < view.x || it.x + gx > view.x + view.w || it.yb < view.y || it.yb - it.spr.h > view.y + view.h)) continue;
    var dy = it.bob && now && !reduced ? Math.sin(now / 650 + it.x * 0.037) * 1.5 : 0;
    c.drawImage(it.spr.cv, it.x + gx, it.yb - it.spr.h + dy, it.spr.cv.width / s, it.spr.cv.height / s);
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
  var people: Drawn[] = M.people.filter(present).map(function (p) {
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
  M.gulls.forEach(function (gl) {
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
  var people = m.people.filter(present).map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s), d: p.dir }; });
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
  var people: Drawn[] = m.people.filter(present).map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s!), d: p.dir }; });
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
