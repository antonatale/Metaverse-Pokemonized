import { M, type PreparedMap } from '../story/maps';
import { st } from '../save/story-progress';
import { pathTo } from '../story/guide';
import { streetNear } from '../story/streets';
import { reduced } from './dom';

/* The navigator in the corner (27 November 2026, Antonio: the corner «è piccolo e non rappresenta bene e non ti fa
   capire bene dove vai ed è troppo statico»). In place of the little dial, a little map of where Antonio is, drawn
   from the map itself, that slides along with him: the way to the next stop traced on it along the streets, a dashed
   line that runs toward the stop; the stop a pin that bobs, or, off the little map, a pin on its edge pointing out;
   Antonio a dot with the way he faces; a secret a blue star. When a new stop is set the little map opens out to show
   the whole way, holds it a moment, and comes back to him. Beside it (ui/story-screen.ts) the words of a navigator:
   along which street, how many steps, and where it turns next, with the real names of the streets of Formia
   (story/streets.ts). */

/* ---------- the map, a pixel picture of it, once per map ---------- */
const PX = 4;   /* pixels of the picture per tile */
const GROUND: Record<string, string> = {
  grass: '#c9e4a6', path: '#ebe0c2', road: '#fffcf4', sand: '#f6e7b5', sea: '#a8d7f0', pier: '#cfae84', stone: '#e6dfcf', clay: '#ea9f7c',
  floor: '#f1e6cb', wall: '#8d8597', rail: '#b9b3a6', hill: '#b4c38c', steps: '#ddd2bb', paving: '#eee6d4', mura: '#bcae92', far: '#dfe7ef',
  scarp: '#a59d86', rock: '#bab3a6'
};
var base: { id: string; cv: HTMLCanvasElement } | null = null;
function picture(m: PreparedMap): HTMLCanvasElement {
  var cv = document.createElement('canvas'), w = m.w, h = m.h;
  cv.width = w * PX; cv.height = h * PX;
  var c = cv.getContext('2d')!;
  c.fillStyle = m.inside ? '#5d566b' : '#a8d7f0'; c.fillRect(0, 0, cv.width, cv.height);
  var gAt = function (x: number, y: number) { return x < 0 || y < 0 || x >= w || y >= h ? '' : m.cell(x, y).g; };
  for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
    var cell = m.cell(x, y), col = GROUND[cell.g] || '#d9d2c2';
    if (cell.deco === 'tartan') col = '#e9917a';
    else if (cell.deco === 'tall' || cell.deco === 'pools') col = cell.g === 'sand' ? '#e9d48f' : '#9fd07f';
    else if (cell.deco === 'hedge') col = '#93c27a';
    else if (m.inside && cell.solid && cell.g === 'floor') col = '#d9c9a6';
    c.fillStyle = col; c.fillRect(x * PX, y * PX, PX, PX);
    if (cell.obj === 'tree' || cell.obj === 'pine' || cell.obj === 'olive' || cell.obj === 'cypress' || cell.obj === 'palm') {
      c.fillStyle = cell.obj === 'olive' ? '#9db46d' : '#7fb768'; c.beginPath(); c.arc(x * PX + PX / 2, y * PX + PX / 2, PX * 0.62, 0, Math.PI * 2); c.fill();
    }
  }
  /* the edges of the streets, a line where they meet what is not a street, so they read as streets */
  c.fillStyle = 'rgba(120,104,80,.55)';
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    var g = gAt(x, y);
    if (g !== 'road' && g !== 'paving') continue;
    var edge = function (gg: string) { return gg !== 'road' && gg !== 'paving' && gg !== 'steps'; };
    if (edge(gAt(x, y - 1))) c.fillRect(x * PX, y * PX, PX, 0.8);
    if (edge(gAt(x, y + 1))) c.fillRect(x * PX, y * PX + PX - 0.8, PX, 0.8);
    if (edge(gAt(x - 1, y))) c.fillRect(x * PX, y * PX, 0.8, PX);
    if (edge(gAt(x + 1, y))) c.fillRect(x * PX + PX - 0.8, y * PX, 0.8, PX);
  }
  /* the coast: a darker line where the sea meets the land */
  c.fillStyle = 'rgba(40,110,160,.45)';
  for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
    if (gAt(x, y) !== 'sea') continue;
    if (gAt(x, y - 1) && gAt(x, y - 1) !== 'sea') c.fillRect(x * PX, y * PX, PX, 1);
    if (gAt(x - 1, y) && gAt(x - 1, y) !== 'sea') c.fillRect(x * PX, y * PX, 1, PX);
    if (gAt(x + 1, y) && gAt(x + 1, y) !== 'sea') c.fillRect(x * PX + PX - 1, y * PX, 1, PX);
    if (gAt(x, y + 1) && gAt(x, y + 1) !== 'sea') c.fillRect(x * PX, y * PX + PX - 1, PX, 1);
  }
  /* the buildings: the ones with a name warmer, the houses of the town paler; an ink edge */
  (m.buildings || []).forEach(function (b) {
    c.fillStyle = b.kind === 'covo' ? '#cdb3f5' : b.label ? '#f1b892' : '#e3d2be';
    c.fillRect(b.x * PX, b.y * PX, b.w * PX, b.h * PX);
    c.strokeStyle = 'rgba(28,35,64,.6)'; c.lineWidth = 1; c.strokeRect(b.x * PX + 0.5, b.y * PX + 0.5, b.w * PX - 1, b.h * PX - 1);
  });
  return cv;
}
function pictureOf(m: PreparedMap): HTMLCanvasElement {
  if (!base || base.id !== m.id) base = { id: m.id, cv: picture(m) };
  return base.cv;
}

/* ---------- what it shows ---------- */
export interface NavTarget { id: string; x: number; y: number; here: boolean }
var target: NavTarget | null = null, secret: { x: number; y: number } | null = null;
var way: [number, number][] | null = null, wayKey = '';
/** the stop the navigator leads to (null: none) */
export function navTarget(t: NavTarget | null) {
  var was = target;
  target = t;
  /* a new stop: the little map opens out to show the whole way (not at the first one, when the game opens) */
  if (t && (!was || was.id !== t.id) && sweepReady && !reduced) sweep = { at: performance.now() };
  sweepReady = true;
}
/** the secret a trainer told, a blue star on the little map */
export function navSecret(s: { x: number; y: number } | null) { secret = s; }
function wayNow(): [number, number][] | null {
  if (!target || target.here) return null;
  var k = M.id + ':' + st.x + ',' + st.y + '>' + target.x + ',' + target.y;
  if (k !== wayKey) { wayKey = k; way = pathTo(st.x, st.y, target.x, target.y, 900); }
  return way;
}

/* ---------- the words: along which street, how far, where next ---------- */
export interface Leg { dir: number; n: number; street: string }
/** the angle of a stretch, in eighths of a turn from east, clockwise (0 east, 2 south, 4 west, 6 north) */
function eighth(dx: number, dy: number) { return (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8; }
/** the way, cut into legs: along one street each, in Formia; elsewhere, a straight run each (a jog of a step or two
    does not count as a turn) */
export function legs(): Leg[] {
  var p = wayNow();
  if (!p || p.length < 2) return [];
  var out: { a: [number, number]; b: [number, number]; n: number; street: string; d: number }[] = [];
  for (var i = 1; i < p.length; i++) {
    var s = streetNear(p[i][0], p[i][1]), d = eighth(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]), last = out[out.length - 1];
    /* the same street goes on; with no names, the same direction goes on */
    if (last && (s ? s === last.street : !last.street && last.d === d)) { last.b = p[i]; last.n++; continue; }
    out.push({ a: p[i - 1], b: p[i], n: 1, street: s, d: d });
  }
  /* a nameless jog between two stretches is folded into the one before */
  for (var k = out.length - 2; k >= 1; k--) if (!out[k].street && out[k].n <= 2) { out[k - 1].b = out[k].b; out[k - 1].n += out[k].n; out.splice(k, 1); }
  return out.map(function (q) { return { dir: eighth(q.b[0] - q.a[0], q.b[1] - q.a[1]), n: q.n, street: q.street }; });
}

/* ---------- the drawing ---------- */
var cv: HTMLCanvasElement | null = null, ctx: CanvasRenderingContext2D | null = null, size = 0, dprNow = 1, drawnAt = 0;
var view = { x: -1, y: -1, z: 0, map: '' }, me = { x: -1, y: -1 }, sweep: { at: number } | null = null, sweepReady = false;
/** the canvas the navigator draws on */
export function navMount(c: HTMLCanvasElement) { cv = c; ctx = c.getContext('2d'); size = 0; view.map = ''; sweepReady = false; }
const SWEEP_OUT = 700, SWEEP_HOLD = 1500, SWEEP_BACK = 900;
function ease(t: number) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
/** draw the little map: from the frame of the world, a few times a second while still and smoothly while he walks */
export function navFrame(now: number) {
  if (!cv || !ctx || !cv.isConnected || !cv.offsetParent) return;
  var r = cv.getBoundingClientRect(), S = Math.round(r.width), d = Math.min(2, window.devicePixelRatio || 1);
  if (!S) return;
  if (S !== size || d !== dprNow) { size = S; dprNow = d; cv.width = Math.round(S * d); cv.height = Math.round(S * d); }
  var m = M, moving = me.x !== st.x || me.y !== st.y;
  if (!moving && !sweep && now - drawnAt < (reduced ? 500 : 33)) return;
  var dt = Math.min(80, now - (drawnAt || now));
  drawnAt = now;
  /* how close: in town about thirty-four tiles across; a room whole, as big as fits */
  var z0 = m.inside ? Math.min(9, S / Math.max(m.w, m.h) * 0.94) : S / 34;
  /* Antonio's dot glides after him rather than jumping a tile at a time, and in town the view goes with it */
  if (view.map !== m.id || reduced) { me.x = st.x; me.y = st.y; }
  else { var f = 1 - Math.exp(-dt / 90); me.x += (st.x - me.x) * f; me.y += (st.y - me.y) * f; if (Math.abs(st.x - me.x) < 0.01) me.x = st.x; if (Math.abs(st.y - me.y) < 0.01) me.y = st.y; }
  var fx = m.inside ? m.w / 2 - 0.5 : me.x, fy = m.inside ? m.h / 2 - 0.5 : me.y, z = z0;
  /* a new stop: out to show the whole way, then back */
  if (sweep && target && !m.inside) {
    var t = now - sweep.at, ow = Math.abs(target.x - st.x) + 10, oh = Math.abs(target.y - st.y) + 10;
    var zf = Math.max(S / 150, Math.min(z0, S / ow, S / oh)), k = t < SWEEP_OUT ? ease(t / SWEEP_OUT) : t < SWEEP_OUT + SWEEP_HOLD ? 1 : 1 - ease(Math.min(1, (t - SWEEP_OUT - SWEEP_HOLD) / SWEEP_BACK));
    z = z0 + (zf - z0) * k; fx = me.x + ((target.x + st.x) / 2 - me.x) * k; fy = me.y + ((target.y + st.y) / 2 - me.y) * k;
    if (t > SWEEP_OUT + SWEEP_HOLD + SWEEP_BACK) sweep = null;
  } else sweep = null;
  view.x = fx; view.y = fy; view.z = z; view.map = m.id;
  var c = ctx;
  c.setTransform(d, 0, 0, d, 0, 0);
  c.clearRect(0, 0, S, S);
  /* tile (x, y) to the canvas: the middle of the view is (view.x + .5, view.y + .5) */
  var ox = S / 2 - (view.x + 0.5) * z, oy = S / 2 - (view.y + 0.5) * z;
  var sx = function (x: number) { return ox + (x + 0.5) * z; }, sy = function (y: number) { return oy + (y + 0.5) * z; };
  /* only the piece of the picture that shows */
  var pic = pictureOf(m), tx0 = Math.max(0, Math.floor(-ox / z)), ty0 = Math.max(0, Math.floor(-oy / z)), tx1 = Math.min(m.w, Math.ceil((S - ox) / z)), ty1 = Math.min(m.h, Math.ceil((S - oy) / z));
  c.fillStyle = m.inside ? '#5d566b' : '#a8d7f0'; c.fillRect(0, 0, S, S);
  c.imageSmoothingEnabled = true;
  if (tx1 > tx0 && ty1 > ty0) c.drawImage(pic, tx0 * PX, ty0 * PX, (tx1 - tx0) * PX, (ty1 - ty0) * PX, ox + tx0 * z, oy + ty0 * z, (tx1 - tx0) * z, (ty1 - ty0) * z);
  /* the way: a white band and, on it, a dashed line that runs toward the stop */
  var p = wayNow();
  if (p && p.length > 1) {
    c.beginPath(); c.moveTo(sx(me.x), sy(me.y));
    for (var i = 1; i < p.length; i++) {
      /* only the corners, so the dashes run evenly */
      if (i < p.length - 1 && p[i + 1][0] - p[i][0] === p[i][0] - p[i - 1][0] && p[i + 1][1] - p[i][1] === p[i][1] - p[i - 1][1]) continue;
      c.lineTo(sx(p[i][0]), sy(p[i][1]));
    }
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,.92)'; c.lineWidth = Math.max(4, z * 1.25); c.stroke();
    c.strokeStyle = '#1c2340'; c.lineWidth = Math.max(2.6, z * 0.8); c.setLineDash([z * 1.6 + 3, z * 1.1 + 2]);
    c.lineDashOffset = reduced ? 0 : -now / 45; c.stroke();
    c.strokeStyle = '#ff9f1c'; c.lineWidth = Math.max(1.6, z * 0.5); c.stroke();
    c.setLineDash([]);
  }
  /* the secret: a blue star; the stop: a pin; on the edge, pointing out, when off the little map */
  if (secret && m.id === 'formia') mark(c, sx(secret.x), sy(secret.y), S, now, 'star');
  if (target) mark(c, sx(target.x), sy(target.y), S, now, target.here ? 'here' : 'pin');
  /* Antonio: a red disc with a white chevron the way he faces, a ring that breathes (not a pin: the pin is the stop) */
  var px = sx(me.x), py = sy(me.y);
  var faced = st.dir === 'up' ? -Math.PI / 2 : st.dir === 'down' ? Math.PI / 2 : st.dir === 'left' ? Math.PI : 0;
  if (!reduced) { var br = (now % 1600) / 1600; c.beginPath(); c.arc(px, py, 7 + br * 9, 0, Math.PI * 2); c.strokeStyle = 'rgba(232,106,92,' + (0.6 * (1 - br)).toFixed(2) + ')'; c.lineWidth = 2; c.stroke(); }
  c.beginPath(); c.arc(px, py, 7.4, 0, Math.PI * 2); c.fillStyle = '#e86a5c'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#1c2340'; c.stroke();
  c.save(); c.translate(px, py); c.rotate(faced);
  c.beginPath(); c.moveTo(4.6, 0); c.lineTo(-3, -4.2); c.lineTo(-1.2, 0); c.lineTo(-3, 4.2); c.closePath(); c.fillStyle = '#ffffff'; c.fill();
  c.restore();
}
/** a pin, a star, or the rings of «you are here», at (x, y); kept inside the little map, pointing out, when off it */
function mark(c: CanvasRenderingContext2D, x: number, y: number, S: number, now: number, kind: 'pin' | 'star' | 'here') {
  var m = 13, cx = S / 2, cy = S / 2, off = x < m || y < m || x > S - m || y > S - m;
  if (off) {
    /* along the line from the middle to it, to the edge */
    var dx = x - cx, dy = y - cy, k = Math.min((S / 2 - m) / Math.max(1e-6, Math.abs(dx)), (S / 2 - m) / Math.max(1e-6, Math.abs(dy)));
    x = cx + dx * k; y = cy + dy * k;
    var a = Math.atan2(dy, dx);
    c.save(); c.translate(x, y); c.rotate(a);
    c.beginPath(); c.moveTo(12, 0); c.lineTo(4, -6); c.lineTo(4, 6); c.closePath();
    c.fillStyle = kind === 'star' ? '#6fd3ff' : '#ffd166'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#1c2340'; c.stroke();
    c.restore();
  }
  var bob = reduced || off ? 0 : Math.abs(Math.sin(now / 320)) * 3;
  if (kind === 'here' || (!off && kind === 'pin')) {
    var t = reduced ? 0.4 : (now % 1300) / 1300;
    c.beginPath(); c.ellipse(x, y + 1, 3 + t * 11, (3 + t * 11) * 0.55, 0, 0, Math.PI * 2);
    c.strokeStyle = 'rgba(255,159,28,' + (0.9 * (1 - t)).toFixed(2) + ')'; c.lineWidth = 2.4; c.stroke();
  }
  if (kind === 'star') {
    c.save(); c.translate(x, y - (off ? 0 : 4) - bob);
    c.beginPath();
    for (var i = 0; i < 10; i++) { var r = i % 2 ? 2.8 : 6.6, an = -Math.PI / 2 + i * Math.PI / 5; if (i) c.lineTo(Math.cos(an) * r, Math.sin(an) * r); else c.moveTo(Math.cos(an) * r, Math.sin(an) * r); }
    c.closePath(); c.fillStyle = '#6fd3ff'; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#1c2340'; c.stroke();
    c.restore();
    return;
  }
  if (kind === 'here') return;
  /* the pin: a drop with a hole, its point on the stop */
  c.save(); c.translate(x, y - bob);
  var s = off ? 0.78 : 1;
  c.scale(s, s);
  c.beginPath(); c.moveTo(0, 0); c.bezierCurveTo(-3, -5, -7.5, -8, -7.5, -13); c.arc(0, -13, 7.5, Math.PI, 0); c.bezierCurveTo(7.5, -8, 3, -5, 0, 0); c.closePath();
  c.fillStyle = '#ffd166'; c.fill(); c.lineWidth = 2; c.strokeStyle = '#1c2340'; c.stroke();
  c.beginPath(); c.arc(0, -13, 2.8, 0, Math.PI * 2); c.fillStyle = '#1c2340'; c.fill();
  c.restore();
}
