import { T, mk, hash, type Palette } from './canvas';
import { wind } from './atmosphere';

/* The tall grass where the wild creatures hide (13 November 2026, Antonio: «migliora il design dell'erba e
   dell'animazione di quando ci passi dentro con la creatura»).
   - The bed, flat in the ground (render/canvas/ground.ts, DECO.tall): a mat of dark meadow joined with the tiles of the
     same patch, the pen line only around the edge of the patch, short blades in it.
   - The tufts over it, drawn at every frame: three on each tile, of long blades and seed heads, leaning with the wind of
     the town and parting around whoever walks through them; behind someone they spring back and wobble a while.
   - Where Antonio or his creature step in, a rustle: bits of blade and seeds thrown up, falling back.
   Pictures of the tufts are drawn once at each lean, so a frame only lays down small images. Nothing here reads the
   story or touches the RNG of the battles; with reduced motion nothing moves (the tufts stand straight). */

/** how many leans a tuft is drawn at, on each side of upright */
const LEANS = 6;
/** the width and height of the picture of a tuft, in map px, and where its foot is in it */
const TW = 26, TH = 30, FOOT_X = 13, FOOT_Y = 27;
type Tuft = HTMLCanvasElement;
let sheet: { key: string; tufts: Tuft[][]; front: Tuft[] } | null = null;

/** one blade: a long thin leaf from the foot, curved by the lean */
function blade(c: CanvasRenderingContext2D, len: number, ang: number, lean: number, wide: number, fill: string, ink: string) {
  var tipX = Math.sin(ang + lean * 0.75) * len, tipY = -Math.cos(ang + lean * 0.75) * len * (1 - Math.abs(lean) * 0.12);
  var midX = Math.sin(ang + lean * 0.25) * len * 0.55, midY = -Math.cos(ang) * len * 0.55;
  var nx = Math.cos(ang) * wide, ny = Math.sin(ang) * wide;
  c.beginPath();
  c.moveTo(-wide, 0);
  c.quadraticCurveTo(midX - nx, midY - ny, tipX, tipY);
  c.quadraticCurveTo(midX + nx, midY + ny, wide, 0);
  c.closePath();
  c.fillStyle = fill; c.fill();
  /* the pen goes lightly round each blade: a dark line on every one would turn the patch into a scribble */
  c.globalAlpha = 0.55; c.strokeStyle = ink; c.lineWidth = 0.85; c.stroke(); c.globalAlpha = 1;
}
/** a seed head on a thin stem: the grass gone to seed, light against the green */
function seeds(c: CanvasRenderingContext2D, len: number, ang: number, lean: number, ink: string, col: string) {
  var a = ang + lean * 0.8, tx = Math.sin(a) * len, ty = -Math.cos(a) * len;
  c.strokeStyle = ink; c.lineWidth = 0.9;
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(Math.sin(ang) * len * 0.5, -len * 0.5, tx, ty); c.stroke();
  c.save(); c.translate(tx, ty); c.rotate(a);
  for (var k = 0; k < 3; k++) {
    c.beginPath(); c.ellipse(k % 2 ? 1.6 : -1.6, 1.2 + k * 2.4, 1.3, 2.3, k % 2 ? 0.5 : -0.5, 0, Math.PI * 2);
    c.fillStyle = col; c.fill(); c.lineWidth = 0.7; c.stroke();
  }
  c.restore();
}
/** a tuft at a lean (−1…1): blades fanning from one foot, the dark ones behind; variant 2 has gone to seed */
function tuft(P: Palette, s: number, lean: number, v: number, small: boolean): Tuft {
  var cv = mk(TW * s, TH * s), c = cv.getContext('2d')!;
  c.scale(s, s); c.translate(FOOT_X, FOOT_Y); c.lineJoin = 'round'; c.lineCap = 'round';
  var k0 = small ? 0.62 : 1, ink = P.ink;
  /* a little shade at the foot */
  c.globalAlpha = 0.35; c.fillStyle = P.grass3; c.beginPath(); c.ellipse(0, 0.5, 7 * k0, 2, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  var back = [[-0.62, 15, P.grass3], [0.5, 17, P.leaf2], [0.05, 21, P.grass3]], front = [[-0.3, 18, P.leaf2], [0.28, 16, P.hedge], [-0.05, 14, P.leaf]];
  if (v === 1) { back = [[-0.5, 19, P.leaf2], [0.62, 14, P.grass3], [0.2, 22, P.leaf2]]; front = [[-0.18, 16, P.hedge], [0.4, 18, P.leaf2], [-0.45, 13, P.leaf]]; }
  back.forEach(function (b) { blade(c, (b[1] as number) * k0, b[0] as number, lean, 2.3, b[2] as string, ink); });
  if (v === 2 && !small) { seeds(c, 22, -0.18, lean, ink, P.path2); seeds(c, 19, 0.35, lean, ink, P.path2); }
  front.forEach(function (b) { blade(c, (b[1] as number) * k0, b[0] as number, lean, 2.6, b[2] as string, ink); });
  /* the sun on one blade */
  var hx = Math.sin(0.28 + lean * 0.75) * 12 * k0, hy = -Math.cos(0.28 + lean * 0.75) * 12 * k0;
  c.strokeStyle = P['grass-hi']; c.lineWidth = 0.9; c.globalAlpha = 0.8;
  c.beginPath(); c.moveTo(1, -2); c.quadraticCurveTo(hx * 0.4 + 1, hy * 0.5, hx, hy); c.stroke(); c.globalAlpha = 1;
  return cv;
}
function tuftsFor(P: Palette, s: number) {
  var key = P.leaf + P.leaf2 + P.hedge + P.grass3 + P.ink + '|' + s;
  if (sheet && sheet.key === key) return sheet;
  var tufts: Tuft[][] = [0, 1, 2].map(function (v) {
    var out: Tuft[] = [];
    for (var i = -LEANS; i <= LEANS; i++) out.push(tuft(P, s, i / LEANS, v, false));
    return out;
  });
  var front: Tuft[] = [];
  for (var i = -LEANS; i <= LEANS; i++) front.push(tuft(P, s, i / LEANS, 1, true));
  sheet = { key: key, tufts: tufts, front: front };
  return sheet;
}
function pick(list: Tuft[], lean: number): Tuft {
  var i = Math.round(Math.max(-1, Math.min(1, lean)) * LEANS) + LEANS;
  return list[i];
}

/* ---------- who goes through the grass, and what it leaves behind ---------- */
/** someone in the grass this frame: the middle of their feet, in map px, and which way they go (−1, 0, 1) */
export interface Walker { x: number; y: number; dx: number }
/** the tiles stepped into lately: they spring back and wobble (`dir`: the way the step went) */
const touched: Record<string, { t: number; dir: number }> = {};
interface Bit { x: number; y: number; vx: number; vy: number; t0: number; life: number; rot: number; spin: number; seed: boolean }
let bits: Bit[] = [];
/** a step into the tall grass at a tile (map tiles), going `dir` across: the tufts bend and wobble, and with `burst`
    bits of blade and seeds fly up */
export function tallStep(tx: number, ty: number, dir: number, now: number, burst: boolean, still: boolean) {
  touched[tx + ',' + ty] = { t: now, dir: dir || (hash(tx, ty, 9) < 0.5 ? -1 : 1) };
  if (!burst || still) return;
  var n = 7 + Math.floor(hash(tx, ty, Math.floor(now) & 255) * 4);
  for (var k = 0; k < n; k++) {
    var r = hash(tx * 7 + k, ty, Math.floor(now / 7) & 1023), r2 = hash(tx, ty * 5 + k, Math.floor(now / 11) & 1023);
    bits.push({ x: tx * T + 6 + r * 20, y: ty * T + 22 + r2 * 6, vx: (r - 0.5) * 120 + dir * 30, vy: -70 - r2 * 90, t0: now + k * 12,
      life: 520 + r2 * 300, rot: r * 6.28, spin: (r2 - 0.5) * 14, seed: k % 3 === 2 });
  }
  if (bits.length > 160) bits = bits.slice(-160);
}
/** how a tuft at (x, y) map px leans this frame: the wind, whoever is close, and the wobble of a step */
function leanAt(tx: number, ty: number, x: number, y: number, now: number, still: boolean, walkers: Walker[]): number {
  var lean = still ? 0 : wind(x, y, now) * 0.22 + Math.sin(now / 260 + x * 0.21 + y * 0.13) * 0.05;
  for (var i = 0; i < walkers.length; i++) {
    var w = walkers[i], ddx = x - w.x, ddy = (y - w.y) * 1.6, d = Math.sqrt(ddx * ddx + ddy * ddy);
    /* parted around the body, the blades in its way pressed aside */
    if (d < 26) lean += (ddx >= 0 ? 1 : -1) * (1 - d / 26) * 1.15;
  }
  if (!still) for (var a = -1; a <= 1; a++) for (var b = -1; b <= 1; b++) {
    var q = touched[(tx + a) + ',' + (ty + b)];
    if (!q) continue;
    var dt = now - q.t;
    if (dt < 0 || dt > 1400) continue;
    var near = a === 0 && b === 0 ? 1 : 0.45;
    lean += q.dir * near * 0.9 * Math.exp(-dt / 380) * Math.cos(dt / 85);
  }
  return lean;
}
/** where the three tufts of a tile stand, as offsets from its corner */
function spots(x: number, y: number): [number, number, number][] {
  return [[5 + hash(x, y, 141) * 6, 13 + hash(x, y, 142) * 4, 0], [18 + hash(x, y, 143) * 7, 15 + hash(x, y, 144) * 5, 1], [9 + hash(x, y, 145) * 14, 27 + hash(x, y, 146) * 3, 2]];
}

/** the tufts of the tall grass in view, under the people (the map is in map units; x0…y1 the tiles in view) */
export function tallLayer(c: CanvasRenderingContext2D, isTall: (x: number, y: number) => boolean, x0: number, x1: number, y0: number, y1: number,
  now: number, still: boolean, walkers: Walker[], P: Palette, s: number) {
  var sh = tuftsFor(P, s);
  for (var key in touched) if (now - touched[key].t > 1600) delete touched[key];
  for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
    if (!isTall(x, y)) continue;
    var sp = spots(x, y);
    for (var k = 0; k < 3; k++) {
      var fx = x * T + sp[k][0], fy = y * T + sp[k][1], v = (Math.floor(hash(x, y, 150 + k) * 3) + k) % 3;
      /* the tuft at the bottom edge only where the patch goes on below: the patch ends cleanly */
      if (k === 2 && !isTall(x, y + 1)) fy = y * T + 25;
      c.drawImage(pick(sh.tufts[v], leanAt(x, y, fx, fy, now, still, walkers)), fx - FOOT_X, fy - FOOT_Y, TW, TH);
    }
  }
}
/** the blades in front of someone standing in the tall grass, over their feet (X, Y: the corner of the tile they are
    drawn on, in map px; `size`: how wide they are, a creature smaller than a person) */
export function tallFront(c: CanvasRenderingContext2D, X: number, Y: number, P: Palette, s: number, now: number, still: boolean, dx: number) {
  var sh = tuftsFor(P, s), base = Y + T + 1;
  for (var k = 0; k < 3; k++) {
    var fx = X + 5 + k * 11, lean = (k - 1) * 0.35 + (still ? 0 : Math.sin(now / 300 + k) * 0.08) - dx * 0.25;
    c.drawImage(pick(sh.front, lean), fx - FOOT_X, base - FOOT_Y, TW, TH);
  }
}
/** the bits thrown up by a step: over the people */
export function tallBits(c: CanvasRenderingContext2D, now: number, P: Palette) {
  if (!bits.length) return;
  c.save();
  bits = bits.filter(function (b) { return now - b.t0 < b.life; });
  bits.forEach(function (b) {
    var t = (now - b.t0) / 1000;
    if (t < 0) return;
    var x = b.x + b.vx * t, y = b.y + b.vy * t + 260 * t * t, a = 1 - (now - b.t0) / b.life;
    c.globalAlpha = Math.max(0, Math.min(1, a * 1.6));
    if (b.seed) { c.fillStyle = P['grass-hi']; c.beginPath(); c.arc(x, y, 1.3, 0, Math.PI * 2); c.fill(); return; }
    c.save(); c.translate(x, y); c.rotate(b.rot + b.spin * t);
    c.beginPath(); c.ellipse(0, 0, 3.6, 1.2, 0, 0, Math.PI * 2);
    c.fillStyle = P.hedge; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 0.6; c.stroke();
    c.restore();
  });
  c.restore();
}
/** the long blades of a tile in a still picture of the map: upright, as on a day without wind */
export function stillTuft(c: CanvasRenderingContext2D, X: number, Y: number, P: Palette, x: number, y: number, map: { cell(a: number, b: number): { deco?: string } }) {
  var sh = tuftsFor(P, 2), sp = spots(x, y);
  for (var k = 0; k < 3; k++) {
    var fx = X + sp[k][0], fy = Y + sp[k][1], v = (Math.floor(hash(x, y, 150 + k) * 3) + k) % 3;
    if (k === 2 && map.cell(x, y + 1).deco !== 'tall') fy = Y + 25;
    c.drawImage(pick(sh.tufts[v], (hash(x, y, 160 + k) - 0.5) * 0.3), fx - FOOT_X, fy - FOOT_Y, TW, TH);
  }
}
