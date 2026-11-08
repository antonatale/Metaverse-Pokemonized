import type { Palette } from './palette';
import { T, STICKER_INK, mk, rr, hash, fillStroke, circle, ell, poly, blobs, plaque, cylinder, type Ctx } from './draw';

/** what a tall object is painted with */
export interface ObjOpts {
  /** footprint in tiles */
  w?: number; h?: number;
  /** how far above its footprint it is drawn, in px */
  up?: number;
  color?: string | null;
  /** buildings: left tile and door tile, label, roof and awning colours */
  x?: number; doorX?: number; label?: string; roof?: string; awning?: string;
  /** a lost thing: which one */
  item?: string;
  /** a house of the town: its variation seed (facade colour, roof, shutters, balconies) */
  v?: number;
}
/** a painted object: the picture, and its size in map px (up included) */
export interface Sprite { cv: HTMLCanvasElement; w: number; h: number; up: number }
type ObjFn = (c: Ctx, w: number, h: number, P: Palette, o: ObjOpts) => void;
interface BuildingLook { roof: string; windows: number; awning?: string; sign?: string; wall?: string; shutter?: string; chimney?: boolean; plants?: boolean; door?: string }
/** how a house of the town looks, from its variation seed: Formia's facades are cream, yellow, pink, peach or pale blue,
    with green or brown shutters; roofs are tiled, tiled with a chimney, or flat terraces */
function facade(P: Palette, v: number) {
  var walls = [P.wall, P['wall-b'], P['wall-c'], P['wall-d'], P['wall-e']];
  return {
    wall: walls[v % 5], shutter: Math.floor(v / 5) % 2 ? P['shutter-b'] : P['shutter-a'], roof: Math.floor(v / 10) % 3,
    plants: Math.floor(v / 30) % 2 === 0, tents: Math.floor(v / 7) % 3, door: Math.floor(v / 60) % 2 ? P.wood : P['shutter-a']
  };
}
/* a window with its two shutters open against the wall */
function shuttered(c: Ctx, P: Palette, x: number, y: number, ww: number, wh: number, shutter?: string) {
  if (shutter) {
    [x - 5, x + ww + 0.5].forEach(function (sx) {
      rr(c, sx, y, 4.5, wh, 1); fillStroke(c, shutter, P.ink, 1);
      c.strokeStyle = P.ink; c.globalAlpha = 0.35; c.lineWidth = 0.7;
      for (var k = 3; k < wh - 1; k += 3) { c.beginPath(); c.moveTo(sx + 0.8, y + k); c.lineTo(sx + 3.7, y + k); c.stroke(); }
      c.globalAlpha = 1;
    });
  }
  rr(c, x, y, ww, wh, 2); fillStroke(c, '#bfe3ff', P.ink, 1.4);
  c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(x + ww / 2, y); c.lineTo(x + ww / 2, y + wh); c.stroke();
}
/* a flower box under a window */
function flowers(c: Ctx, P: Palette, x: number, y: number, ww: number) {
  rr(c, x - 1, y, ww + 2, 4, 1); fillStroke(c, P.clay, P.ink, 1);
  c.fillStyle = P.leaf; for (var k = 0; k < 4; k++) { circle(c, x + 2 + k * (ww - 4) / 3, y - 1, 1.8); c.fill(); }
  c.fillStyle = P['flower-a']; circle(c, x + 3, y - 2, 1.3); c.fill(); c.fillStyle = P['flower-b']; circle(c, x + ww - 3, y - 2, 1.3); c.fill();
}

/* ---------- tall objects: drawn sorted by their bottom edge, so people walk behind them ---------- */
/** how far above its footprint each kind of thing is drawn, in px (1 tile when missing) */
export const HEIGHT: Record<string, number> = { tower: T * 2.4, tomb: T * 1.9, house: T * 0.75, station: T * 0.75, circolo: T * 0.9, bar: T * 0.75, shop: T * 0.75, palazzo: T * 1.1,
  church: T * 2.15, octagon: T * 2.1, clocktower: T * 2.05, coni: T * 0.75, lido: T * 0.9, kiosk: T * 0.6, ferry: T * 0.75, cypress: T * 1.6,
  lifeguard: T * 1.4, ruins: T * 0.9, tunnel: T * 0.5, fountain: T * 0.5, car: T * 0.2, item: T * 0.4, pine: T * 1.4, condo: T * 1.75, pub: T * 0.75,
  arena: T * 0.9, train: T * 0.6, monument: T * 1.5, lighthouse: T * 1.6, gazebo: T * 0.6, board: T * 1.1, windsurf: T * 0.7, pedalo: T * 0.3,
  borgo: T * 0.75, villa: T * 0.5, cistern: T * 0.5, collegiata: T * 2.6, school: T * 1.6, parish: T * 2.3, aqueduct: T * 0.6, gelateria: T * 0.8, bakery: T * 0.75, pharmacy: T * 0.75, fishmonger: T * 0.75, bookshop: T * 0.75, newsstand: T * 0.4, market: T * 0.4 };
export function paintObject(kind: string, P: Palette, s: number, opt?: ObjOpts): Sprite {
  opt = opt || {};
  var w = (opt.w || 1) * T, h = (opt.h || 1) * T, up = opt.up == null ? T : opt.up;
  var cv = mk(w * s, (h + up) * s), c = cv.getContext('2d')!;
  c.scale(s, s); c.translate(0, up); c.lineCap = 'round'; c.lineJoin = 'round';
  (OBJ[kind] || OBJ.box)(c, w, h, P, opt);
  return { cv: cv, w: w, h: h + up, up: up };
}
const OBJ: Record<string, ObjFn> = {
  tree: function (c, w, h, P) {
    ell(c, 16, 28, 11, 3.6); c.fillStyle = P.shadow; c.fill();
    rr(c, 13, 14, 6, 15, 2); fillStroke(c, P.trunk, P.ink, 1.6);
    blobs(c, [[9, 4, 9], [23, 4, 9], [16, -6, 11]], P.leaf, P.ink, 1.7);
    c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(6, 11); c.quadraticCurveTo(16, 15, 26, 11); c.stroke();
    c.fillStyle = P.leaf2; circle(c, 12, 0, 2.2); c.fill(); circle(c, 21, 5, 2.4); c.fill(); circle(c, 16, -9, 2); c.fill();
  },
  /* the umbrella pine of the Pineta di Vindicio: a tall bare trunk, a flat dark crown */
  pine: function (c, w, h, P) {
    ell(c, 16, 29, 9, 3); c.fillStyle = P.shadow; c.fill();
    c.beginPath(); c.moveTo(14, 29); c.quadraticCurveTo(13, 6, 16.5, -15); c.lineTo(19.5, -15); c.quadraticCurveTo(16, 6, 18.5, 29); c.closePath();
    fillStroke(c, P.trunk, P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(18, -11); c.lineTo(11, -18); c.moveTo(18, -12); c.lineTo(25, -19); c.stroke();
    blobs(c, [[6, -24, 6], [12, -27, 7], [20, -27, 7], [26, -24, 6], [16, -21, 7]], P.leaf2, P.ink, 1.6);
    c.fillStyle = P.leaf; c.globalAlpha = 0.8;
    [[10, -28], [20, -29], [25, -24], [7, -23], [15, -24]].forEach(function (d) { ell(c, d[0], d[1], 3.4, 1.8); c.fill(); });
    c.globalAlpha = 1;
  },
  olive: function (c, w, h, P) {
    ell(c, 16, 28, 10, 3.4); c.fillStyle = P.shadow; c.fill();
    c.beginPath(); c.moveTo(13, 29); c.quadraticCurveTo(10, 21, 14.5, 13); c.lineTo(18.5, 13); c.quadraticCurveTo(15.5, 20, 20, 29); c.closePath();
    fillStroke(c, P.trunk, P.ink, 1.5);
    blobs(c, [[8, 7, 7.5], [16, 1, 9], [24.5, 6, 7.5], [16, 10, 7]], P.olive, P.ink, 1.6);
    c.fillStyle = P.leaf2; c.globalAlpha = 0.55;
    [[10, 4], [19, -2], [23, 8], [14, 10], [21, 4]].forEach(function (d) { ell(c, d[0], d[1], 2, 1.2); c.fill(); });
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.35;
    [[12, 0], [21, 1], [8, 8]].forEach(function (d) { ell(c, d[0], d[1], 1.8, 1); c.fill(); });
    c.globalAlpha = 1;
  },
  cypress: function (c, w, h, P) {
    ell(c, 16, 29, 7.5, 2.6); c.fillStyle = P.shadow; c.fill();
    rr(c, 14.5, 21, 3, 8, 1); fillStroke(c, P.trunk, P.ink, 1.3);
    c.beginPath(); c.moveTo(16, -T * 1.42); c.bezierCurveTo(23, -T * 0.9, 25, 6, 16, 24); c.bezierCurveTo(7, 6, 9, -T * 0.9, 16, -T * 1.42); c.closePath();
    fillStroke(c, P.leaf2, P.ink, 1.6);
    c.strokeStyle = P.leaf; c.lineWidth = 1.1; c.globalAlpha = 0.85;
    for (var k = 0; k < 6; k++) { var yy = -T * 1.1 + k * 9, ww = 2.5 + Math.min(k, 6 - k) * 1.1; c.beginPath(); c.moveTo(16 - ww, yy + 3); c.quadraticCurveTo(16, yy, 16 + ww, yy + 3); c.stroke(); }
    c.globalAlpha = 1;
  },
  palm: function (c, w, h, P) {
    ell(c, 16, 28, 9, 3); c.fillStyle = P.shadow; c.fill();
    c.beginPath(); c.moveTo(14, 28); c.quadraticCurveTo(11, 10, 16, -6); c.lineTo(19, -6); c.quadraticCurveTo(15, 10, 19, 28); c.closePath();
    fillStroke(c, P.trunk, P.ink, 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 1; for (var k = 0; k < 5; k++) { c.beginPath(); c.moveTo(13 + k * 0.5, 22 - k * 6); c.lineTo(18.5 - k * 0.2, 21 - k * 6); c.stroke(); }
    var fronds = [[-14, -2], [-10, -14], [2, -20], [16, -14], [18, -2], [4, 2]];
    fronds.forEach(function (f) {
      c.beginPath(); c.moveTo(17, -8); c.quadraticCurveTo(17 + f[0] * 0.5, -8 + f[1] * 0.9 - 6, 17 + f[0], -8 + f[1]);
      c.quadraticCurveTo(17 + f[0] * 0.55, -8 + f[1] * 0.5, 17, -6); c.closePath();
      fillStroke(c, P.leaf, P.ink, 1.4);
    });
    c.fillStyle = P.trunk; circle(c, 17, -7, 2.4); c.fill();
  },
  lamp: function (c, w, h, P) {
    ell(c, 16, 28, 6, 2); c.fillStyle = P.shadow; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(16, 28); c.lineTo(16, -6); c.stroke();
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(16, -6); c.quadraticCurveTo(16, -12, 22, -12); c.stroke();
    rr(c, 19, -12, 8, 7, 2); fillStroke(c, '#ffe9a8', P.ink, 1.6);
  },
  umbrella: function (c, w, h, P, o) {
    ell(c, 16, 26, 12, 4); c.fillStyle = P.shadow; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(16, 26); c.lineTo(16, 0); c.stroke();
    c.beginPath(); c.moveTo(1, 4); c.quadraticCurveTo(16, -16, 31, 4); c.closePath();
    fillStroke(c, o.color || P['roof-a'], P.ink, 1.6);
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(11, 4); c.quadraticCurveTo(16, -12, 21, 4); c.closePath(); c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(11, 4); c.quadraticCurveTo(16, -12, 21, 4); c.stroke();
  },
  boat: function (c, w, h, P, o) {
    c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 22); c.quadraticCurveTo(16, 31, 32, 22); c.stroke();
    c.beginPath(); c.moveTo(2, 14); c.lineTo(30, 14); c.quadraticCurveTo(28, 26, 16, 27); c.quadraticCurveTo(4, 26, 2, 14); c.closePath();
    fillStroke(c, o.color || '#ffffff', P.ink, 1.7);
    c.fillStyle = P['roof-b']; c.fillRect(4, 16, 24, 3);
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(16, 14); c.lineTo(16, -6); c.stroke();
    c.beginPath(); c.moveTo(17, -5); c.lineTo(27, 10); c.lineTo(17, 10); c.closePath(); fillStroke(c, '#fffaf0', P.ink, 1.4);
  },
  mic: function (c, w, h, P) {
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(16, 24); c.lineTo(16, 4); c.moveTo(11, 26); c.lineTo(16, 24); c.lineTo(21, 26); c.stroke();
    rr(c, 13, -4, 6, 9, 3); fillStroke(c, '#30323a', P.ink, 1.4);
  },
  box: function (c, w, h, P) { rr(c, 2, 2, w - 4, h - 4, 3); fillStroke(c, P.stone, P.ink, 1.6); },
  sign: function (c, w, h, P) {
    ell(c, 16, 29, 7, 2.4); c.fillStyle = P.shadow; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(16, 29); c.lineTo(16, 12); c.stroke();
    rr(c, 4, -2, 24, 16, 2.5); fillStroke(c, P.wood, P.ink, 1.7);
    c.strokeStyle = P.wood2; c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(8, 3); c.lineTo(24, 3); c.moveTo(8, 8); c.lineTo(20, 8); c.stroke();
  },
  /* the ferry to Ponza and Ventotene, moored at the pier */
  ferry: function (c, w, h, P) {
    rr(c, 0, 36, w, 56, 26); c.strokeStyle = P.foam; c.lineWidth = 3; c.stroke();
    c.beginPath(); c.moveTo(4, 40); c.lineTo(w - 30, 40); c.quadraticCurveTo(w - 2, 44, w - 3, 62); c.quadraticCurveTo(w - 5, 84, w - 32, 88); c.lineTo(8, 88); c.quadraticCurveTo(1, 64, 4, 40); c.closePath();
    c.fillStyle = '#fbfbf7'; c.fill();
    c.save(); c.clip(); c.fillStyle = P['roof-b']; c.fillRect(0, 68, w, 9); c.fillStyle = '#d14b3a'; c.fillRect(0, 77, w, 12); c.restore();
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
    c.fillStyle = '#ffffff'; c.font = '700 9px ui-monospace, Menlo, monospace'; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('FORMIA · PONZA · VENTOTENE', 14, 73);
    rr(c, 12, 46, w - 52, 19, 4); fillStroke(c, '#e7ebf0', P.ink, 1.3);
    rr(c, 26, 50, 20, 8, 3); fillStroke(c, '#ff9a3c', P.ink, 1.2);
    rr(c, 60, 50, 20, 8, 3); fillStroke(c, '#ff9a3c', P.ink, 1.2);
    rr(c, 22, 10, 78, 38, 5); fillStroke(c, '#ffffff', P.ink, 1.6);
    for (var k = 0; k < 6; k++) { rr(c, 28 + k * 12, 18, 8, 7, 2); fillStroke(c, '#bfe3ff', P.ink, 1); }
    c.fillStyle = P['roof-b']; c.fillRect(28, 32, 66, 3);
    rr(c, 86, -4, 30, 24, 4); fillStroke(c, '#ffffff', P.ink, 1.6);
    rr(c, 90, 2, 22, 7, 2); fillStroke(c, '#20263a', P.ink, 1);
    rr(c, 46, -16, 16, 28, 3); fillStroke(c, '#ffd166', P.ink, 1.5);
    c.fillStyle = '#20263a'; c.fillRect(46.8, -15.2, 14.4, 5);
    c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(w - 40, 40); c.lineTo(w - 40, 24); c.stroke();
    poly(c, [[w - 40, 24], [w - 28, 27], [w - 40, 31]]); fillStroke(c, '#57c968', P.ink, 1);
  },
  /* Torre di Castellone: octagonal, 14th century */
  octagon: function (c, w, h, P) {
    var top = -T * 1.9, bot = h - 6, xl = 8, xr = w - 8, f = 11;
    ell(c, w / 2, bot, w / 2 - 2, 6); c.fillStyle = P.shadow; c.fill();
    poly(c, [[xl, top + 12], [xl + f, top + 8], [xr - f, top + 8], [xr, top + 12], [xr, bot], [xr - f, bot + 4], [xl + f, bot + 4], [xl, bot]]);
    fillStroke(c, P.stone, P.ink, 1.8);
    c.fillStyle = P.stone2; poly(c, [[xl, top + 12], [xl + f, top + 8], [xl + f, bot + 4], [xl, bot]]); c.fill();
    c.globalAlpha = 0.6; poly(c, [[xr - f, top + 8], [xr, top + 12], [xr, bot], [xr - f, bot + 4]]); c.fill(); c.globalAlpha = 1;
    c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(xl + f, top + 8); c.lineTo(xl + f, bot + 4); c.moveTo(xr - f, top + 8); c.lineTo(xr - f, bot + 4); c.stroke();
    c.strokeStyle = P.stone2; c.lineWidth = 1;
    for (var y = top + 20; y < bot - 4; y += 9) { c.beginPath(); c.moveTo(xl + f + 2, y + 1); c.lineTo(xr - f - 2, y + 1); c.stroke(); }
    var mw = (xr - xl - 4) / 5;
    for (var k = 0; k < 5; k++) { rr(c, xl + 2 + k * mw, top - 2, mw - 3, 11, 1); fillStroke(c, P.stone, P.ink, 1.4); }
    c.fillStyle = '#20263a'; rr(c, w / 2 - 2, top + 22, 4, 12, 2); c.fill(); rr(c, w / 2 - 2, top + 44, 4, 10, 2); c.fill();
    rr(c, w / 2 - 6, bot - 16, 12, 18, 6); fillStroke(c, P.wood, P.ink, 1.4);
  },
  /* Porta degli Spagnoli with the Torre dell'Orologio: the arch is cut out, so people show through it */
  clocktower: function (c, w, h, P) {
    var gateTop = h - 46, ax = w / 2, aw = 28, atop = h - 34;
    ell(c, w / 2, h - 2, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    c.beginPath(); c.rect(0, gateTop, w, h - gateTop - 1);
    c.moveTo(ax - aw / 2, h - 1); c.lineTo(ax - aw / 2, atop + aw / 2); c.arc(ax, atop + aw / 2, aw / 2, Math.PI, 0); c.lineTo(ax + aw / 2, h - 1); c.closePath();
    c.fillStyle = P.rock; c.fill('evenodd'); c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = P.rock2; c.lineWidth = 1.1;
    [[4, gateTop + 14, 26, gateTop + 12], [8, gateTop + 30, 30, gateTop + 28], [w - 28, gateTop + 12, w - 4, gateTop + 15], [w - 30, gateTop + 29, w - 6, gateTop + 31]]
      .forEach(function (l) { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); c.stroke(); });
    var tx0 = 26, tx1 = w - 26, ttop = -T * 1.7;
    rr(c, tx0, ttop, tx1 - tx0, gateTop - ttop + 2, 2); fillStroke(c, P.stone, P.ink, 1.8);
    for (var k = 0; k < 4; k++) { rr(c, tx0 + 1 + k * 11, ttop - 8, 8, 10, 1); fillStroke(c, P.stone, P.ink, 1.3); }
    var cx = w / 2, cy = ttop + 20;
    circle(c, cx, cy, 12); fillStroke(c, '#3f7ccf', P.ink, 1.5);
    circle(c, cx, cy, 8.5); fillStroke(c, '#fffdf6', P.ink, 1);
    c.fillStyle = '#ffd166'; for (var a = 0; a < 12; a++) { circle(c, cx + Math.cos(a * Math.PI / 6) * 10.3, cy + Math.sin(a * Math.PI / 6) * 10.3, 1.2); c.fill(); }
    c.strokeStyle = '#1c2340'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - 6); c.moveTo(cx, cy); c.lineTo(cx + 4.5, cy + 1); c.stroke();
    rr(c, cx - 4, ttop + 38, 8, 11, 4); c.fillStyle = '#20263a'; c.fill();
  },
  church: function (c, w, h, P, o) {
    var wallTop = T * 0.55, dx = (o.doorX! - o.x!) * T, bx = w - 30, btop = -T * 1.5, nw = bx + 2;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, bx, btop + 10, 24, h - btop - 12, 2); fillStroke(c, P.wall, P.ink, 1.7);
    rr(c, bx + 6, btop + 18, 12, 15, 6); fillStroke(c, '#20263a', P.ink, 1.2);
    circle(c, bx + 12, btop + 29, 3.2); c.fillStyle = '#ffd166'; c.fill();
    poly(c, [[bx - 2, btop + 11], [bx + 12, btop - 6], [bx + 26, btop + 11]]); fillStroke(c, P['roof-a'], P.ink, 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 1.7; c.beginPath(); c.moveTo(bx + 12, btop - 6); c.lineTo(bx + 12, btop - 17); c.moveTo(bx + 8, btop - 13); c.lineTo(bx + 16, btop - 13); c.stroke();
    rr(c, 3, wallTop, nw - 3, h - wallTop - 2, 2); fillStroke(c, P.wall, P.ink, 1.8);
    poly(c, [[0, wallTop + 4], [nw / 2 + 1, -T * 0.6], [nw + 2, wallTop + 4]]); fillStroke(c, P['roof-a'], P.ink, 1.8);
    poly(c, [[10, wallTop + 1], [nw / 2 + 1, -T * 0.3], [nw - 8, wallTop + 1]]); fillStroke(c, P.wall, P.ink, 1.2);
    var rx = nw / 2 + 1, ry = wallTop + 13;
    circle(c, rx, ry, 8); fillStroke(c, '#bfe3ff', P.ink, 1.4);
    c.strokeStyle = P.ink; c.lineWidth = 0.9;
    for (var k = 0; k < 8; k++) { c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(k * Math.PI / 4) * 8, ry + Math.sin(k * Math.PI / 4) * 8); c.stroke(); }
    [10, nw - 20].forEach(function (sx) { if (Math.abs(sx + 5 - (dx + T / 2)) > 18) { rr(c, sx, h - T - 4, 10, 18, 5); fillStroke(c, '#bfe3ff', P.ink, 1.2); } });
    rr(c, dx + 8, h - T + 1, T - 16, T - 4, 7); fillStroke(c, P.wood, P.ink, 1.5);
    rr(c, dx + 3, h - 5, T - 6, 4, 1); fillStroke(c, P.stone, P.ink, 1);
  },
  /* the town hall, with the archaeological museum in one wing */
  palazzo: function (c, w, h, P, o) {
    var wallTop = T * 0.25, dx = (o.doorX! - o.x!) * T;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 2, wallTop, w - 4, h - wallTop - 2, 2); fillStroke(c, P.wall, P.ink, 1.8);
    poly(c, [[-2, wallTop + 4], [8, -T * 0.75], [w - 8, -T * 0.75], [w + 2, wallTop + 4]]); fillStroke(c, P['roof-a'], P.ink, 1.8);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.35;
    for (var y = -T * 0.75 + 7; y < wallTop; y += 7) { c.beginPath(); c.moveTo(6, y); c.lineTo(w - 6, y); c.stroke(); }
    c.globalAlpha = 1;
    rr(c, -1, wallTop - 1, w + 2, 6, 1); fillStroke(c, P.stone, P.ink, 1.3);
    var n = Math.max(3, Math.round(w / 34));
    for (var k = 0; k < n; k++) {
      var wx = 12 + k * ((w - 24 - 14) / (n - 1));
      if (Math.abs(wx + 7 - (dx + T / 2)) < 24) continue;
      rr(c, wx, wallTop + 14, 14, 22, 2); fillStroke(c, '#bfe3ff', P.ink, 1.3);
      c.fillStyle = '#6fb387'; c.fillRect(wx - 4.5, wallTop + 14, 4, 22); c.fillRect(wx + 14.5, wallTop + 14, 4, 22);
      c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(wx - 4.5, wallTop + 14, 4, 22); c.strokeRect(wx + 14.5, wallTop + 14, 4, 22);
    }
    rr(c, dx + 3, h - T - 8, T - 6, T + 6, 13); fillStroke(c, P.wood, P.ink, 1.6);
    c.strokeStyle = P.wood2; c.lineWidth = 1.2; c.beginPath(); c.moveTo(dx + T / 2, h - T + 4); c.lineTo(dx + T / 2, h - 3); c.stroke();
    rr(c, dx - 8, h - T - 16, T + 16, 6, 2); fillStroke(c, P.stone, P.ink, 1.3);
    c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(dx + T + 6, h - T - 14); c.lineTo(dx + T + 6, h - T - 40); c.stroke();
    ['#2c9a55', '#ffffff', '#d14b3a'].forEach(function (col, i) { c.fillStyle = col; c.fillRect(dx + T + 6.5 + i * 5, h - T - 40, 5, 10); });
    c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(dx + T + 6.5, h - T - 40, 15, 10);
    if (o.label) plaque(c, P, o.label, w / 2, wallTop + 4, w - 20, 15);
  },
  /* the Olympic training centre: low and modern */
  coni: function (c, w, h, P, o) {
    var wallTop = T * 0.4;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 2, wallTop, w - 4, h - wallTop - 2, 2); fillStroke(c, P.wall, P.ink, 1.8);
    rr(c, -2, wallTop - 14, w + 4, 16, 2); fillStroke(c, P.stone2, P.ink, 1.7);
    rr(c, 10, wallTop + 10, w - 20, 22, 2); fillStroke(c, '#bfe3ff', P.ink, 1.4);
    c.strokeStyle = P.ink; c.lineWidth = 1;
    for (var x = 28; x < w - 12; x += 18) { c.beginPath(); c.moveTo(x, wallTop + 10); c.lineTo(x, wallTop + 32); c.stroke(); }
    ['#3f7ccf', '#ffd166', '#2c9a55'].forEach(function (col, i) { c.fillStyle = col; c.fillRect(6, h - 16 + i * 4, w - 12, 3); });
    var dx = (o.doorX! - o.x!) * T;
    rr(c, dx + 6, h - T + 3, T - 12, T - 5, 2); fillStroke(c, '#bfe3ff', P.ink, 1.4);
    if (o.label) plaque(c, P, o.label, w / 2, wallTop - 6, w - 12, 13);
  },
  lido: function (c, w, h, P, o) {
    ell(c, w / 2, h - 1, w / 2, 4); c.fillStyle = P.shadow; c.fill();
    rr(c, 6, 10, w - 12, h - 12, 2); fillStroke(c, P.wood, P.ink, 1.7);
    c.strokeStyle = P.wood2; c.lineWidth = 1.1;
    for (var x = 14; x < w - 8; x += 8) { c.beginPath(); c.moveTo(x, 12); c.lineTo(x, h - 3); c.stroke(); }
    rr(c, 18, 24, w - 36, 13, 2); fillStroke(c, '#20263a', P.ink, 1.2);
    rr(c, 14, 36, w - 28, 5, 1); fillStroke(c, P.wood2, P.ink, 1.1);
    poly(c, [[0, 14], [10, -18], [w - 10, -18], [w, 14]]);
    c.save(); c.clip();
    for (var k = 0; k * 12 < w; k++) { c.fillStyle = k % 2 ? '#ffffff' : P['roof-a']; c.fillRect(k * 12, -20, 12, 36); }
    c.restore();
    c.strokeStyle = P.ink; c.lineWidth = 1.7; c.stroke();
    c.fillStyle = P['roof-a'];
    for (k = 0; k * 12 < w; k++) { c.beginPath(); c.arc(k * 12 + 6, 14, 6, 0, Math.PI); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.2; c.stroke(); }
    if (o.label) plaque(c, P, o.label, w / 2, -6, w - 30, 13);
  },
  kiosk: function (c, w, h, P, o) {
    ell(c, w / 2, h - 2, w / 2 - 2, 4); c.fillStyle = P.shadow; c.fill();
    rr(c, 6, 12, w - 12, h - 14, 3); fillStroke(c, P.wall, P.ink, 1.7);
    poly(c, [[1, 16], [8, -10], [w - 8, -10], [w - 1, 16]]); fillStroke(c, P['roof-b'], P.ink, 1.7);
    rr(c, 12, 22, w - 24, 15, 2); fillStroke(c, '#bfe3ff', P.ink, 1.2);
    rr(c, 9, 37, w - 18, 4, 1); fillStroke(c, P.wood, P.ink, 1);
    if (o.label) plaque(c, P, o.label, w / 2, 3, w + 18, 11);
  },
  fountain: function (c, w, h, P) {
    ell(c, w / 2, h / 2 + 6, w / 2 - 2, h / 2 - 10); fillStroke(c, P.stone, P.ink, 1.8);
    ell(c, w / 2, h / 2 + 6, w / 2 - 9, h / 2 - 16); fillStroke(c, P.sea, P.ink, 1.3);
    c.strokeStyle = P.foam; c.lineWidth = 1.4;
    c.beginPath(); c.ellipse(w / 2, h / 2 + 8, 14, 5, 0, 0.3, Math.PI - 0.3); c.stroke();
    rr(c, w / 2 - 4, h / 2 - 16, 8, 22, 3); fillStroke(c, P.stone, P.ink, 1.4);
    ell(c, w / 2, h / 2 - 17, 11, 4); fillStroke(c, P.stone, P.ink, 1.4);
    c.strokeStyle = P.sea2; c.lineWidth = 2;
    c.beginPath(); c.moveTo(w / 2 - 8, h / 2 - 15); c.quadraticCurveTo(w / 2 - 15, h / 2 - 8, w / 2 - 15, h / 2 + 2);
    c.moveTo(w / 2 + 8, h / 2 - 15); c.quadraticCurveTo(w / 2 + 15, h / 2 - 8, w / 2 + 15, h / 2 + 2); c.stroke();
    c.strokeStyle = P.foam; c.lineWidth = 1.6; c.beginPath(); c.moveTo(w / 2, h / 2 - 21); c.lineTo(w / 2, h / 2 - 28); c.stroke();
  },
  car: function (c, w, h, P, o) {
    var col = o.color || '#e86a5c';
    ell(c, w / 2, h - 3, w / 2 - 4, 4); c.fillStyle = P.shadow; c.fill();
    c.fillStyle = '#20263a';
    [[10, 2], [w - 18, 2], [10, h - 8], [w - 18, h - 8]].forEach(function (p) { rr(c, p[0], p[1], 8, 6, 2); c.fill(); });
    rr(c, 3, 4, w - 6, h - 8, 9); fillStroke(c, col, P.ink, 1.7);
    rr(c, 18, 6, 26, h - 12, 6); fillStroke(c, '#bfe3ff', P.ink, 1.3);
    rr(c, 23, 8, 15, h - 16, 4); c.fillStyle = col; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1; c.stroke();
    c.fillStyle = '#fff3a0'; rr(c, w - 8, 7, 3, 5, 1); c.fill(); rr(c, w - 8, h - 12, 3, 5, 1); c.fill();
  },
  /* Antonio's scooter, parked */
  scooter: function (c, w, h, P) {
    ell(c, 16, 28, 12, 3); c.fillStyle = P.shadow; c.fill();
    circle(c, 7, 24, 4.5); fillStroke(c, '#30323a', P.ink, 1.4); circle(c, 25, 24, 4.5); fillStroke(c, '#30323a', P.ink, 1.4);
    c.beginPath(); c.moveTo(5, 21); c.quadraticCurveTo(6, 12, 14, 13); c.lineTo(20, 13); c.quadraticCurveTo(28, 13, 28, 21); c.lineTo(22, 22); c.lineTo(10, 22); c.closePath();
    fillStroke(c, '#5b8fd9', P.ink, 1.5);
    rr(c, 10, 9, 10, 4, 2); fillStroke(c, '#30323a', P.ink, 1.2);
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(25, 14); c.lineTo(27, 4); c.moveTo(24, 4); c.lineTo(30, 4); c.stroke();
    circle(c, 29, 8, 1.6); c.fillStyle = '#fff3a0'; c.fill();
  },
  lifeguard: function (c, w, h, P) {
    ell(c, 16, 28, 9, 3); c.fillStyle = P.shadow; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(6, 28); c.lineTo(11, -8); c.moveTo(26, 28); c.lineTo(21, -8); c.moveTo(8, 14); c.lineTo(24, 14); c.stroke();
    rr(c, 7, -14, 18, 7, 2); fillStroke(c, P.wood, P.ink, 1.5);
    rr(c, 9, -26, 14, 12, 2); fillStroke(c, P.wood, P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(27, -8); c.lineTo(27, -40); c.stroke();
    poly(c, [[27, -40], [38, -35], [27, -30]]); fillStroke(c, '#57c968', P.ink, 1.2);
  },
  /* the Roman villa of Mamurra, in the park of Gianola */
  ruins: function (c, w, h, P) {
    ell(c, w / 2, h - 4, w / 2 - 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 4, h - 18, w - 8, 14, 2); fillStroke(c, P.stone, P.ink, 1.6);
    c.strokeStyle = P.stone2; c.lineWidth = 1; c.beginPath(); c.moveTo(20, h - 18); c.lineTo(20, h - 4); c.moveTo(42, h - 18); c.lineTo(42, h - 4); c.stroke();
    [[13, 30], [31, 46], [49, 20]].forEach(function (p) {
      var cx = p[0], ch = p[1], top = h - 18 - ch;
      c.beginPath(); c.moveTo(cx - 5, h - 18); c.lineTo(cx - 5, top + 3); c.lineTo(cx - 2, top); c.lineTo(cx + 1, top + 4); c.lineTo(cx + 5, top + 1); c.lineTo(cx + 5, h - 18); c.closePath();
      fillStroke(c, P.stone, P.ink, 1.5);
      c.strokeStyle = P.stone2; c.lineWidth = 0.9; c.beginPath(); c.moveTo(cx - 1.5, h - 19); c.lineTo(cx - 1.5, top + 5); c.moveTo(cx + 2, h - 19); c.lineTo(cx + 2, top + 5); c.stroke();
    });
    ell(c, 22, h - 22, 4, 2.5); fillStroke(c, P.stone, P.ink, 1.2);
    c.fillStyle = P.leaf; [[9, h - 20], [28, h - 50], [52, h - 26], [40, h - 19]].forEach(function (p) { circle(c, p[0], p[1], 3); c.fill(); });
  },
  /* where the railway goes into the hill */
  tunnel: function (c, w, h, P) {
    blobs(c, [[4, 10, 13], [26, 8, 13], [16, -4, 12], [6, 40, 12], [28, 40, 12]], P.rock, P.ink, 1.6);
    c.beginPath(); c.moveTo(2, h - 14); c.lineTo(2, 44); c.quadraticCurveTo(2, 32, 14, 32); c.quadraticCurveTo(26, 32, 26, 44); c.lineTo(26, h - 14); c.closePath();
    fillStroke(c, '#20263a', P.ink, 1.6);
  },
  /* one of the things Antonio lost around town */
  item: function (c, w, h, P, o) {
    ell(c, 16, 27, 8, 2.6); c.fillStyle = P.shadow; c.fill();
    circle(c, 16, 15, 12); c.fillStyle = 'rgba(255,253,246,.75)'; c.fill();
    var ink = STICKER_INK;
    if (o.item === 'notes') {
      rr(c, 9, 4, 15, 19, 2); fillStroke(c, '#fffdf6', ink, 1.5);
      c.strokeStyle = '#8fd0f6'; c.lineWidth = 1; for (var k = 0; k < 4; k++) { c.beginPath(); c.moveTo(12, 9 + k * 4); c.lineTo(22, 9 + k * 4); c.stroke(); }
      c.strokeStyle = '#d14b3a'; c.beginPath(); c.moveTo(12, 5); c.lineTo(12, 22); c.stroke();
    } else if (o.item === 'wallet') {
      rr(c, 7, 8, 18, 13, 3); fillStroke(c, '#8a5a3c', ink, 1.5);
      rr(c, 15, 11, 11, 7, 2); fillStroke(c, '#6b4429', ink, 1.2);
      circle(c, 22, 14.5, 1.4); c.fillStyle = '#ffd166'; c.fill();
    } else if (o.item === 'charger') {
      c.strokeStyle = ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(13, 7); c.lineTo(13, 3); c.moveTo(19, 7); c.lineTo(19, 3); c.stroke();
      rr(c, 9, 7, 14, 11, 3); fillStroke(c, '#f3f3f3', ink, 1.5);
      c.strokeStyle = ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(16, 18); c.quadraticCurveTo(16, 25, 22, 24); c.quadraticCurveTo(27, 23, 26, 18); c.stroke();
    } else {
      rr(c, 9, 4, 15, 20, 2); fillStroke(c, '#7a1f2b', ink, 1.5);
      circle(c, 16.5, 12, 3.6); c.strokeStyle = '#ffd166'; c.lineWidth = 1.2; c.stroke();
      c.fillStyle = '#ffd166'; c.fillRect(12, 18, 9, 1.4);
    }
  },
  /* a palazzina, the apartment blocks of Formia (Antonio's is Parco la Fontana): flat roof, floors of balconies */
  condo: function (c, w, h, P, o) {
    var top = -T * 1.05, dx = (o.doorX! - o.x!) * T, v = o.v || 0, fa = facade(P, v), tent = fa.tents === 1 ? P['tent-a'] : P['tent-b'];
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    /* on the roof: a water tank and an aerial, now and then */
    if (v % 3 === 0) { rr(c, 10, top - 15, 14, 11, 4); fillStroke(c, P.stone, P.ink, 1.3); c.strokeStyle = P.ink; c.lineWidth = 1.3; c.beginPath(); c.moveTo(w - 16, top - 4); c.lineTo(w - 16, top - 22); c.moveTo(w - 22, top - 18); c.lineTo(w - 10, top - 18); c.moveTo(w - 20, top - 13); c.lineTo(w - 12, top - 13); c.stroke(); }
    rr(c, 3, top, w - 6, h - top - 2, 2); fillStroke(c, fa.wall, P.ink, 1.8);
    rr(c, 0, top - 5, w, 8, 2); fillStroke(c, P.stone2, P.ink, 1.6);
    c.fillStyle = o.roof || P['roof-b']; c.globalAlpha = 0.35; c.fillRect(4, top + 3, w - 8, 5); c.globalAlpha = 1;
    var floors = Math.max(2, Math.floor((h - T - top - 8) / 21));
    for (var f = 0; f < floors; f++) {
      var wy = top + 12 + f * 21;
      for (var x = 9; x + 14 <= w - 9; x += 19) {
        rr(c, x, wy, 14, 11, 2); fillStroke(c, '#bfe3ff', P.ink, 1.2);
        c.strokeStyle = P.ink; c.lineWidth = 1.1;
        c.beginPath(); c.moveTo(x - 3, wy + 14); c.lineTo(x + 17, wy + 14); c.moveTo(x - 3, wy + 14); c.lineTo(x - 3, wy + 18); c.moveTo(x + 17, wy + 14); c.lineTo(x + 17, wy + 18); c.stroke();
        /* a striped sun tent pulled down over some balconies */
        if (fa.tents && hash(x, f, v) < 0.45) {
          c.beginPath(); c.moveTo(x - 3, wy - 2); c.lineTo(x + 17, wy - 2); c.lineTo(x + 19, wy + 7); c.lineTo(x - 5, wy + 7); c.closePath();
          c.save(); c.clip(); for (var st = 0; st < 6; st++) { c.fillStyle = st % 2 ? '#ffffff' : tent; c.fillRect(x - 5 + st * 4, wy - 2, 4, 10); } c.restore();
          c.strokeStyle = P.ink; c.lineWidth = 1.1; c.stroke();
        }
        if ((x + f + v) % 3 === 0) { c.fillStyle = P['flower-a']; circle(c, x + 2, wy + 13, 1.8); c.fill(); }
      }
    }
    rr(c, dx + 5, h - T + 1, T - 10, T - 3, 3); fillStroke(c, '#bfe3ff', P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(dx + T / 2, h - T + 2); c.lineTo(dx + T / 2, h - 2); c.stroke();
    rr(c, dx + 2, h - T - 4, T - 4, 4, 1); fillStroke(c, P.stone2, P.ink, 1);
    if (o.label) plaque(c, P, o.label, w / 2, top + 1, w - 10, 13);
  },
  /* a birreria (Morgana in via Tullia): dark wood, warm windows, string lights, a mug on the sign */
  pub: function (c, w, h, P, o) {
    var wallTop = T * 0.45, dx = (o.doorX! - o.x!) * T;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 3, wallTop, w - 6, h - wallTop - 2, 3); fillStroke(c, P.wood2, P.ink, 1.8);
    c.strokeStyle = P.wood; c.lineWidth = 1.2;
    for (var y = wallTop + 8; y < h - 4; y += 7) { c.beginPath(); c.moveTo(5, y); c.lineTo(w - 5, y); c.stroke(); }
    rr(c, -1, wallTop - 10, w + 2, 12, 2); fillStroke(c, P.wood, P.ink, 1.7);
    [[10, wallTop + 12], [w - 10 - 30, wallTop + 12]].forEach(function (q) {
      if (Math.abs(q[0] + 15 - (dx + T / 2)) < 24) return;
      rr(c, q[0], q[1], 30, 20, 3); fillStroke(c, '#ffd98a', P.ink, 1.4);
      c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(q[0] + 15, q[1]); c.lineTo(q[0] + 15, q[1] + 20); c.stroke();
    });
    rr(c, dx + 6, h - T + 1, T - 12, T - 3, 3); fillStroke(c, P.wood, P.ink, 1.5);
    circle(c, dx + T - 10, h - T / 2 + 2, 1.4); c.fillStyle = P.ink; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 1;
    c.beginPath(); c.moveTo(2, wallTop - 12); for (var k = 0; k <= 8; k++) c.quadraticCurveTo(k * w / 8 - w / 16, wallTop - 6, k * w / 8, wallTop - 12); c.stroke();
    for (k = 0; k < 8; k++) { circle(c, k * w / 8 + w / 16, wallTop - 8.5, 1.8); c.fillStyle = k % 2 ? '#ffe9a8' : '#ffb36b'; c.fill(); }
    if (o.label) plaque(c, P, o.label, w / 2 - 6, wallTop - 4, w - 24, 14);
    var mx = w - 16, my = wallTop - 10;
    rr(c, mx - 6, my - 7, 11, 13, 2); fillStroke(c, '#ffd166', P.ink, 1.3);
    rr(c, mx - 7, my - 9, 13, 4, 2); fillStroke(c, '#fffdf6', P.ink, 1.1);
    c.beginPath(); c.arc(mx + 6, my - 1, 3.4, -Math.PI / 2, Math.PI / 2); c.strokeStyle = P.ink; c.lineWidth = 1.3; c.stroke();
  },
  /* the shops of the town, each its own face (data/maps/formia.ts, SHOP_AT): the pharmacy with its green cross and a
     window of bottles; the fishmonger with its counter of fish on ice; the bookshop with books in the window; the
     newsstand, a green kiosk hung with papers; the market, three stalls under their awnings */
  /* the bakery of Castellone: round tielle in the window, warm light, smoke from the oven's chimney */
  bakery: function (c, w, h, P, o) {
    building(c, w, h, P, o, { roof: o.roof || '#ff9a8b', windows: 0, wall: '#fbe7c6', awning: o.awning || '#ffb347', chimney: true });
    c.strokeStyle = '#c9ccd6'; c.lineWidth = 3; c.lineCap = 'round'; c.globalAlpha = 0.7;
    c.beginPath(); c.moveTo(w - 25, -T * 0.55 - 8); c.quadraticCurveTo(w - 31, -T * 0.55 - 16, w - 24, -T * 0.55 - 22); c.quadraticCurveTo(w - 18, -T * 0.55 - 28, w - 24, -T * 0.55 - 34); c.stroke(); c.globalAlpha = 1;
    var dx = (o.doorX! - o.x!) * T, wx = dx > w / 2 ? 7 : dx + T + 1, ww = Math.max(26, (dx > w / 2 ? dx : w - 7) - wx - 3), wy = h - T + 2;
    rr(c, wx, wy, ww, T - 8, 2); fillStroke(c, '#ffe2a8', P.ink, 1.5);
    for (var t0 = 0; t0 * 13 + 12 < ww; t0++) { circle(c, wx + 8 + t0 * 13, wy + 13, 5.5); fillStroke(c, '#e3a65a', P.ink, 1.1); circle(c, wx + 8 + t0 * 13, wy + 13, 2.6); c.fillStyle = t0 % 2 ? '#7a9a3a' : '#d96a4a'; c.fill(); }
  },
  pharmacy: function (c, w, h, P, o) {
    building(c, w, h, P, o, { roof: '#7cc68a', windows: 0, wall: '#f6f8f3' });
    var dx = (o.doorX! - o.x!) * T, wx = dx > w / 2 ? 7 : dx + T + 1, ww = Math.max(26, (dx > w / 2 ? dx : w - 7) - wx - 3), wy = h - T + 2;
    rr(c, wx, wy, ww, T - 8, 2); fillStroke(c, '#dff3ff', P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(wx + 2, wy + 9); c.lineTo(wx + ww - 2, wy + 9); c.moveTo(wx + 2, wy + 17); c.lineTo(wx + ww - 2, wy + 17); c.stroke();
    var cols = ['#ff8fc1', '#57c968', '#8fd0f6', '#ffd166'];
    for (var b = 0; b * 7 + 6 < ww; b++) { c.fillStyle = cols[b % 4]; c.fillRect(wx + 4 + b * 7, wy + 3 + (b % 2), 4, 6); c.fillRect(wx + 4 + b * 7, wy + 11 + ((b + 1) % 2), 4, 6); }
    /* the green cross, lit, on a bracket by the corner */
    var cx = dx > w / 2 ? 14 : w - 14, cy = T * 0.9 + 2;
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(cx, cy - 6); c.lineTo(cx, cy - 12); c.stroke();
    c.save(); c.shadowColor = '#57e08a'; c.shadowBlur = 10;
    poly(c, [[cx - 3, cy - 12], [cx + 3, cy - 12], [cx + 3, cy - 18], [cx + 9, cy - 18], [cx + 9, cy - 24], [cx + 3, cy - 24], [cx + 3, cy - 30], [cx - 3, cy - 30], [cx - 3, cy - 24], [cx - 9, cy - 24], [cx - 9, cy - 18], [cx - 3, cy - 18]]);
    fillStroke(c, '#2ecc71', P.ink, 1.4); c.restore();
  },
  fishmonger: function (c, w, h, P, o) {
    building(c, w, h, P, o, { roof: '#9ec5ff', windows: 1, wall: '#eef6fb', awning: '#3b8fd9' });
    /* the counter outside, white, with crushed ice and the fish of the morning */
    var y0 = h - 13;
    rr(c, 4, y0, w - 8, 11, 2); fillStroke(c, '#ffffff', P.ink, 1.5);
    c.fillStyle = '#d6efff'; c.fillRect(6, y0 + 2, w - 12, 4);
    for (var f = 0; f < 5; f++) {
      var fx = 12 + f * ((w - 24) / 4), fy = y0 + 3;
      c.beginPath(); c.ellipse(fx, fy, 6, 2.4, (f % 2 ? 0.2 : -0.2), 0, Math.PI * 2); fillStroke(c, f % 2 ? '#b8c6d6' : '#ff9a7a', P.ink, 1);
      c.beginPath(); c.moveTo(fx - 6, fy); c.lineTo(fx - 9, fy - 2.5); c.lineTo(fx - 9, fy + 2.5); c.closePath(); fillStroke(c, f % 2 ? '#b8c6d6' : '#ff9a7a', P.ink, 0.9);
    }
  },
  bookshop: function (c, w, h, P, o) {
    building(c, w, h, P, o, { roof: '#c3a6ff', windows: 0, wall: '#3f6b55', door: '#8a5a2b' });
    var dx = (o.doorX! - o.x!) * T, wx = dx > w / 2 ? 7 : dx + T + 1, ww = Math.max(26, (dx > w / 2 ? dx : w - 7) - wx - 3), wy = h - T + 2;
    rr(c, wx, wy, ww, T - 8, 2); fillStroke(c, '#fff3d6', P.ink, 1.5);
    /* books standing in the window, and one open in front */
    var spines = ['#d94f4f', '#3b8fd9', '#ffd166', '#57c968', '#c3a6ff', '#ff8a3c'];
    for (var k = 0; k * 4 + 5 < ww; k++) { c.fillStyle = spines[k % 6]; var bh = 9 + (k * 5) % 5; c.fillRect(wx + 3 + k * 4, wy + 15 - bh, 3, bh); }
    c.beginPath(); c.moveTo(wx + ww / 2 - 9, wy + 19); c.lineTo(wx + ww / 2, wy + 17); c.lineTo(wx + ww / 2 + 9, wy + 19); c.lineTo(wx + ww / 2 + 9, wy + 22); c.lineTo(wx + ww / 2, wy + 20); c.lineTo(wx + ww / 2 - 9, wy + 22); c.closePath();
    fillStroke(c, '#ffffff', P.ink, 1.1);
  },
  newsstand: function (c, w, h, P, o) {
    var kx = w / 2 - 28, kw = 56, top = 2;
    ell(c, w / 2, h - 2, 32, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, kx, top + 14, kw, h - top - 16, 3); fillStroke(c, '#2f7a52', P.ink, 1.8);
    poly(c, [[kx - 6, top + 16], [kx + 4, top], [kx + kw - 4, top], [kx + kw + 6, top + 16]]); fillStroke(c, '#3d9b68', P.ink, 1.8);
    rr(c, kx + 6, top + 20, kw - 12, 18, 2); fillStroke(c, '#20263a', P.ink, 1.2);
    /* the papers and the magazines, hung on the front and stacked on the shelf */
    var mags = ['#ffffff', '#ffd166', '#ff8fc1', '#8fd0f6', '#ffffff'];
    for (var m = 0; m < 5; m++) { rr(c, kx + 8 + m * 8.5, top + 22 + (m % 2) * 2, 7, 10, 1); fillStroke(c, mags[m], P.ink, 0.9); }
    rr(c, kx + 4, h - 14, kw - 8, 6, 1); fillStroke(c, '#fdfaf0', P.ink, 1.2);
    c.strokeStyle = P.ink; c.lineWidth = 0.8; for (var l = 0; l < 3; l++) { c.beginPath(); c.moveTo(kx + 8, h - 13 + l * 2); c.lineTo(kx + kw - 8, h - 13 + l * 2); c.stroke(); }
    if (o.label) plaque(c, P, o.label, w / 2, top + 9, kw + 8, 12);
  },
  market: function (c, w, h, P, o) {
    var tents = ['#ff6a5a', '#ffd166', '#57c968'], sw = (w - 6) / 3;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    for (var s0 = 0; s0 < 3; s0++) {
      var x0 = 3 + s0 * sw, y0 = 14 + (s0 % 2) * 4;
      c.strokeStyle = P.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0 + 3, y0); c.lineTo(x0 + 3, h - 4); c.moveTo(x0 + sw - 3, y0); c.lineTo(x0 + sw - 3, h - 4); c.stroke();
      /* the stall: a table with crates of what it sells */
      rr(c, x0 + 1, h - 20, sw - 2, 8, 1.5); fillStroke(c, P.wood, P.ink, 1.3);
      for (var q = 0; q < 3; q++) { circle(c, x0 + 6 + q * (sw - 12) / 2, h - 22, 3); fillStroke(c, ['#ff6a5a', '#ffb347', '#7ccf5a', '#ffe066'][(s0 + q) % 4], P.ink, 0.9); }
      /* its awning, striped */
      poly(c, [[x0 - 1, y0 + 4], [x0 + 4, y0 - 8], [x0 + sw - 4, y0 - 8], [x0 + sw + 1, y0 + 4]]);
      c.save(); c.clip(); for (var st0 = 0; st0 * 6 < sw + 6; st0++) { c.fillStyle = st0 % 2 ? '#ffffff' : tents[s0]; c.fillRect(x0 - 2 + st0 * 6, y0 - 10, 6, 16); } c.restore();
      c.strokeStyle = P.ink; c.lineWidth = 1.6; c.stroke();
    }
    if (o.label) plaque(c, P, o.label, w / 2, -6, w - 8, 12);
  },
  house: function (c, w, h, P, o) {
    var f = facade(P, o.v || 0);
    if (f.roof === 1) terrace(c, w, h, P, o, f);
    else building(c, w, h, P, o, { roof: o.roof || P['roof-a'], windows: 2, wall: f.wall, shutter: f.shutter, chimney: f.roof === 2, plants: f.plants, door: f.door });
  },
  shop: function (c, w, h, P, o) {
    var f = facade(P, o.v || 0);
    building(c, w, h, P, o, { roof: o.roof || P['roof-c'], windows: 1, awning: o.awning || '#ff8fc1', wall: f.wall, shutter: f.shutter, plants: f.plants });
  },
  station: function (c, w, h, P, o) {
    building(c, w, h, P, o, { roof: P['roof-b'], windows: 4, sign: 'STAZIONE' });
    var cx = w / 2; circle(c, cx, -2, 7); fillStroke(c, '#fffaf0', P.ink, 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, -2); c.lineTo(cx, -7); c.moveTo(cx, -2); c.lineTo(cx + 4, -1); c.stroke();
  },
  circolo: function (c, w, h, P, o) {
    building(c, w, h, P, o, { roof: '#7fc796', windows: 2, sign: 'CIRCOLO TENNIS', awning: '#e08a5e' });
    c.save(); c.translate(w - 26, 4); c.rotate(-0.6);
    ell(c, 0, -8, 6, 8); fillStroke(c, '#fffaf0', P.ink, 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 0.8; for (var k = -4; k <= 4; k += 2) { c.beginPath(); c.moveTo(k, -15); c.lineTo(k, -1); c.stroke(); }
    c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 9); c.stroke(); c.restore();
  },
  bar: function (c, w, h, P, o) { building(c, w, h, P, o, { roof: P['roof-c'], windows: 1, sign: 'BAR', awning: '#ff8fc1' }); },
  /* Torre di Mola: the round tower of the Angevin castle, 13th century */
  tower: function (c, w, h, P) {
    var top = -T * 2.05, bot = h - 7, x0 = 7, x1 = w - 7, cx = w / 2, rx = (x1 - x0) / 2;
    ell(c, cx, bot + 3, rx + 5, 6); c.fillStyle = P.shadow; c.fill();
    cylinder(c, P, x0, x1, top + 12, bot, 6);
    for (var k = 0; k < 6; k++) {   /* merlons, back row then front row */
      var a = Math.PI + (k + 0.5) * Math.PI / 6;
      rr(c, cx + Math.cos(a) * (rx - 3) - 3.5, top + 12 + Math.sin(a) * 5 - 9, 7, 9, 1); fillStroke(c, P.stone2, P.ink, 1.2);
    }
    ell(c, cx, top + 12, rx, 6); fillStroke(c, P.stone, P.ink, 1.6);
    for (k = 0; k < 6; k++) {
      var b = (k + 0.5) * Math.PI / 6;
      rr(c, cx + Math.cos(b) * (rx - 2) - 3.5, top + 12 + Math.sin(b) * 6 - 8, 7, 10, 1); fillStroke(c, P.stone, P.ink, 1.3);
    }
    c.fillStyle = '#20263a'; rr(c, cx - 2, top + 34, 4, 13, 2); c.fill(); rr(c, cx - 13, top + 58, 4, 10, 2); c.fill();
    rr(c, cx - 7, bot - 20, 14, 22, 7); fillStroke(c, P.wood, P.ink, 1.6);
  },
  /* the Palamendola, the sports hall of via Amendola: a long barrel-vault roof, glass all along the front */
  arena: function (c, w, h, P, o) {
    var wallTop = T * 0.45, roofTop = -T * 0.75, dx = (o.doorX! - o.x!) * T;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 2, wallTop, w - 4, h - wallTop - 2, 2); fillStroke(c, P.wall, P.ink, 1.8);
    c.beginPath(); c.moveTo(-1, wallTop + 3); c.bezierCurveTo(4, roofTop, w - 4, roofTop, w + 1, wallTop + 3); c.closePath();
    fillStroke(c, P['roof-b'], P.ink, 1.8);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.4;
    for (var k = 1; k < 9; k++) { var rx = k * w / 9; c.beginPath(); c.moveTo(rx, wallTop + 2); c.quadraticCurveTo(rx + (rx - w / 2) * 0.08, roofTop + 14, w / 2 + (rx - w / 2) * 0.55, roofTop + 9); c.stroke(); }
    c.globalAlpha = 1;
    rr(c, 10, wallTop + 8, w - 20, h - wallTop - 20, 2); fillStroke(c, '#bfe3ff', P.ink, 1.4);
    c.strokeStyle = P.ink; c.lineWidth = 1; for (var x = 26; x < w - 14; x += 16) { c.beginPath(); c.moveTo(x, wallTop + 8); c.lineTo(x, h - 12); c.stroke(); }
    ['#3f7ccf', '#ffd166', '#2c9a55'].forEach(function (col, i) { c.fillStyle = col; c.fillRect(6, h - 10 + i * 2.5, w - 12, 2); });
    rr(c, dx + 6, h - T + 3, T - 12, T - 5, 2); fillStroke(c, '#e8f5ff', P.ink, 1.4);
    /* a basketball over the entrance */
    circle(c, w - 22, wallTop - 4, 6); fillStroke(c, '#f08a3c', P.ink, 1.3);
    c.beginPath(); c.moveTo(w - 28, wallTop - 4); c.lineTo(w - 16, wallTop - 4); c.moveTo(w - 22, wallTop - 10); c.lineTo(w - 22, wallTop + 2); c.lineWidth = 0.9; c.stroke();
    if (o.label) plaque(c, P, o.label, w / 2, wallTop - 2, w - 40, 14);
  },
  /* a regional train standing at the station: two white coaches with a blue band, the pantograph up */
  train: function (c, w, h, P) {
    var top = -T * 0.45, bot = h - 4, half = w / 2;
    ell(c, w / 2, bot + 1, w / 2 - 6, 4); c.fillStyle = P.shadow; c.fill();
    [[3, half - 2], [half + 2, w - 3]].forEach(function (seg, i) {
      var x0 = seg[0], x1 = seg[1];
      c.beginPath();
      if (i === 0) { c.moveTo(x0 + 14, top); c.lineTo(x1, top); c.lineTo(x1, bot); c.lineTo(x0 + 4, bot); c.quadraticCurveTo(x0 - 2, top + 8, x0 + 14, top); }
      else { c.moveTo(x0, top); c.lineTo(x1 - 14, top); c.quadraticCurveTo(x1 + 2, top + 8, x1 - 4, bot); c.lineTo(x0, bot); c.closePath(); }
      c.closePath(); fillStroke(c, '#f7f7f4', P.ink, 1.7);
      c.save(); c.clip(); c.fillStyle = '#3f7ccf'; c.fillRect(x0 - 4, bot - 11, x1 - x0 + 8, 5); c.fillStyle = '#2c9a55'; c.fillRect(x0 - 4, bot - 6, x1 - x0 + 8, 3); c.restore();
      for (var x = x0 + 18; x < x1 - 16; x += 15) { rr(c, x, top + 6, 11, 9, 2); fillStroke(c, '#20263a', P.ink, 1); }
      rr(c, (x0 + x1) / 2 - 5, top + 5, 10, bot - top - 9, 2); fillStroke(c, '#d9dde6', P.ink, 1);
      c.fillStyle = '#20263a'; rr(c, i === 0 ? x0 + 5 : x1 - 13, top + 5, 8, 8, 3); c.fill();
    });
    c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(half - 30, top); c.lineTo(half - 22, top - 10); c.lineTo(half - 12, top - 10); c.moveTo(half - 26, top - 5); c.lineTo(half - 14, top - 10); c.stroke();
  },
  /* the monument in Piazza della Vittoria: a stone plinth, a column, a bronze victory on top */
  monument: function (c, w, h, P) {
    ell(c, 16, 29, 12, 3.6); c.fillStyle = P.shadow; c.fill();
    rr(c, 3, 18, 26, 11, 2); fillStroke(c, P.stone, P.ink, 1.6);
    rr(c, 7, 11, 18, 8, 1); fillStroke(c, P.stone2, P.ink, 1.4);
    rr(c, 12, -22, 8, 34, 2); fillStroke(c, P.stone, P.ink, 1.5);
    c.strokeStyle = P.stone2; c.lineWidth = 1; c.beginPath(); c.moveTo(14.5, -18); c.lineTo(14.5, 9); c.moveTo(17.5, -18); c.lineTo(17.5, 9); c.stroke();
    c.beginPath(); c.moveTo(16, -40); c.quadraticCurveTo(26, -38, 25, -30); c.lineTo(19, -28); c.lineTo(20, -22); c.lineTo(12, -22); c.lineTo(13, -28); c.lineTo(7, -30); c.quadraticCurveTo(6, -38, 16, -40); c.closePath();
    fillStroke(c, '#7c9a7a', P.ink, 1.4);
    circle(c, 16, -42, 3); fillStroke(c, '#7c9a7a', P.ink, 1.2);
  },
  /* the lighthouse at the end of the mole: white and red, a lantern on top */
  lighthouse: function (c, w, h, P) {
    ell(c, 16, 29, 9, 3); c.fillStyle = P.shadow; c.fill();
    c.beginPath(); c.moveTo(9, 28); c.lineTo(12, -34); c.lineTo(20, -34); c.lineTo(23, 28); c.closePath();
    c.save(); c.clip(); for (var k = 0; k < 6; k++) { c.fillStyle = k % 2 ? '#d14b3a' : '#fbfbf7'; c.fillRect(0, -34 + k * 11, w, 11); } c.restore();
    c.strokeStyle = P.ink; c.lineWidth = 1.7; c.stroke();
    rr(c, 9, -40, 14, 7, 1); fillStroke(c, '#ffe9a8', P.ink, 1.4);
    poly(c, [[8, -40], [16, -49], [24, -40]]); fillStroke(c, '#d14b3a', P.ink, 1.4);
    rr(c, 7, -34, 18, 3, 1); fillStroke(c, '#20263a', P.ink, 1);
  },
  /* a white gazebo of the lido: four poles and a peaked canopy */
  gazebo: function (c, w, h, P) {
    ell(c, 16, 27, 14, 4); c.fillStyle = P.shadow; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(4, 27); c.lineTo(4, 2); c.moveTo(28, 27); c.lineTo(28, 2); c.stroke();
    c.beginPath(); c.moveTo(-1, 4); c.lineTo(16, -14); c.lineTo(33, 4); c.closePath(); fillStroke(c, '#fffdf6', P.ink, 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.4; c.beginPath(); c.moveTo(16, -14); c.lineTo(8, 4); c.moveTo(16, -14); c.lineTo(24, 4); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = P['tent-b']; for (var k = 0; k < 5; k++) { c.beginPath(); c.arc(1 + k * 7.5, 4, 3.6, 0, Math.PI); c.fill(); }
  },
  /* a windsurf board planted in the sand, its sail up: the school of the Eclipse */
  board: function (c, w, h, P, o) {
    var sail = o.color || P['tent-a'];
    ell(c, 16, 28, 10, 3); c.fillStyle = P.shadow; c.fill();
    c.beginPath(); c.moveTo(10, 29); c.quadraticCurveTo(8, 6, 13, -16); c.quadraticCurveTo(17, 6, 15, 29); c.closePath(); fillStroke(c, '#fffdf6', P.ink, 1.4);
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(19, 26); c.lineTo(21, -30); c.stroke();
    c.beginPath(); c.moveTo(21, -30); c.quadraticCurveTo(33, -6, 21, 20); c.closePath(); fillStroke(c, sail, P.ink, 1.5);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(22, -18); c.lineTo(27, -14); c.moveTo(22, -4); c.lineTo(28, -2); c.stroke();
    c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(21, -2); c.lineTo(31, -6); c.stroke();
  },
  /* a canoe of the Lido Oriente pulled up on the sand, its paddle across it */
  canoe: function (c, w, h, P, o) {
    ell(c, 16, 25, 14, 3.5); c.fillStyle = P.shadow; c.fill();
    c.beginPath(); c.moveTo(1, 19); c.quadraticCurveTo(16, 11, 31, 19); c.quadraticCurveTo(16, 27, 1, 19); c.closePath(); fillStroke(c, o.color || '#ff6a4a', P.ink, 1.6);
    c.beginPath(); c.ellipse(16, 19, 6, 2.2, 0, 0, Math.PI * 2); fillStroke(c, '#20263a', P.ink, 1);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(5, 18); c.quadraticCurveTo(10, 15.5, 13, 15.6); c.stroke();
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(4, 12); c.lineTo(28, 25); c.stroke();
    c.beginPath(); c.ellipse(3, 11.5, 3, 1.6, 0.5, 0, Math.PI * 2); fillStroke(c, '#fffdf6', P.ink, 1.1);
    c.beginPath(); c.ellipse(29, 25.5, 3, 1.6, 0.5, 0, Math.PI * 2); fillStroke(c, '#fffdf6', P.ink, 1.1);
  },
  /* a pedalò of the Lido Oriente on the water: two floats, the seat, the slide */
  pedalo: function (c, w, h, P, o) {
    c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 26); c.quadraticCurveTo(16, 31, 32, 26); c.stroke();
    rr(c, 2, 19, 28, 5, 2.5); fillStroke(c, '#fffdf6', P.ink, 1.4);
    rr(c, 2, 12, 28, 5, 2.5); fillStroke(c, '#fffdf6', P.ink, 1.4);
    rr(c, 8, 9, 14, 12, 3); fillStroke(c, o.color || '#ffd166', P.ink, 1.5);
    c.beginPath(); c.moveTo(20, 9); c.quadraticCurveTo(30, 0, 22, -8); c.lineTo(18, -6); c.quadraticCurveTo(24, 1, 16, 9); c.closePath(); fillStroke(c, '#8fd0f6', P.ink, 1.4);
    c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(10, 14); c.lineTo(20, 14); c.stroke();
  },
  /* someone windsurfing in the bay: board, sail and sailor leaning out */
  windsurf: function (c, w, h, P, o) {
    var sail = o.color || P['tent-b'];
    c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.moveTo(2, 25); c.quadraticCurveTo(10, 29, 24, 25); c.moveTo(-2, 21); c.lineTo(5, 22); c.stroke();
    c.beginPath(); c.moveTo(4, 22); c.quadraticCurveTo(16, 18, 30, 22); c.quadraticCurveTo(16, 26, 4, 22); c.closePath(); fillStroke(c, '#fffdf6', P.ink, 1.3);
    c.strokeStyle = P.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(18, 21); c.lineTo(14, -18); c.stroke();
    c.beginPath(); c.moveTo(14, -18); c.quadraticCurveTo(2, 0, 16, 18); c.closePath(); fillStroke(c, sail, P.ink, 1.4);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(12, -8); c.lineTo(8, -5); c.moveTo(13, 4); c.lineTo(9, 6); c.stroke();
    /* the sailor, hanging off the boom */
    c.strokeStyle = STICKER_INK; c.lineWidth = 2.4; c.beginPath(); c.moveTo(22, 20); c.lineTo(23, 9); c.lineTo(16, 2); c.stroke();
    circle(c, 25, 6, 3.3); fillStroke(c, '#c99577', STICKER_INK, 1.2);
  },
  /* an old house of the borghi (Castellone, Mola): stone walls, an arched door, small shuttered windows, a tiled roof;
     in Mola the plaster is painted in the fishermen's colours */
  borgo: function (c, w, h, P, o) {
    var v = o.v || 0, dx = (o.doorX! - o.x!) * T, wallTop = T * 0.25, roofTop = -T * 0.62;
    var walls = [P.stone, P['wall-d'], P['wall-b'], P['wall-c'], P.stone];
    var wall = walls[v % walls.length], shutter = Math.floor(v / 5) % 2 ? P['shutter-b'] : P['shutter-a'];
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 3, wallTop, w - 6, h - wallTop - 2, 2); fillStroke(c, wall, P.ink, 1.8);
    /* the stones showing through the plaster */
    c.strokeStyle = P.stone2; c.lineWidth = 1;
    for (var k = 0; k < 7; k++) {
      var sx = 6 + hash(v, k, 200) * (w - 18), sy = wallTop + 6 + hash(v, k, 201) * (h - wallTop - 14);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 6, sy - 1); c.lineTo(sx + 7, sy + 4); c.lineTo(sx + 1, sy + 5); c.closePath(); c.stroke();
    }
    c.beginPath(); c.moveTo(-1, wallTop + 3); c.lineTo(8, roofTop); c.lineTo(w - 8, roofTop); c.lineTo(w + 1, wallTop + 3); c.closePath();
    fillStroke(c, o.roof || P['roof-a'], P.ink, 1.7);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.3;
    for (var y = roofTop + 6; y < wallTop; y += 6) { c.beginPath(); c.moveTo(4, y); c.lineTo(w - 4, y); c.stroke(); }
    for (var x = 8; x < w - 6; x += 6) { c.beginPath(); c.moveTo(x, roofTop + 1); c.lineTo(x - 2, wallTop + 2); c.stroke(); }
    c.globalAlpha = 1;
    /* small windows high up, one on each side of the door */
    [10, w - 22].forEach(function (wx) { if (Math.abs(wx + 6 - (dx + T / 2)) > 14) shuttered(c, P, wx, wallTop + 8, 11, 12, shutter); });
    if (v % 3 === 0) flowers(c, P, 10, wallTop + 21, 11);
    /* the arched door, with a stone frame */
    c.beginPath(); c.moveTo(dx + 8, h - 2); c.lineTo(dx + 8, h - T + 10); c.arc(dx + T / 2, h - T + 10, T / 2 - 8, Math.PI, 0); c.lineTo(dx + T - 8, h - 2); c.closePath();
    fillStroke(c, P.wood2, P.ink, 1.6);
    c.beginPath(); c.arc(dx + T / 2, h - T + 10, T / 2 - 5, Math.PI, 0); c.strokeStyle = P.stone2; c.lineWidth = 2.4; c.stroke();
    circle(c, dx + T - 12, h - T / 2 + 3, 1.3); c.fillStyle = P.ink; c.fill();
    /* now and then an outside stair up to the first floor */
    if (v % 4 === 1 && w >= T * 3) { c.fillStyle = P.stone2; for (var st = 0; st < 3; st++) c.fillRect(w - 18 + st * 4, h - 8 - st * 6, 14 - st * 4, 4); c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(w - 18, h - 20, 14, 18); }
  },
  /* a villa of Vindicio: low and white, a flat roof terrace, bougainvillea over the door, a palm in the garden */
  villa: function (c, w, h, P, o) {
    var v = o.v || 0, dx = (o.doorX! - o.x!) * T, top = T * 0.05;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 3, top, w - 6, h - top - 2, 3); fillStroke(c, v % 2 ? P.wall : P['wall-e'], P.ink, 1.8);
    rr(c, 1, top - 4, w - 2, 6, 2); fillStroke(c, P.wall, P.ink, 1.4);
    c.strokeStyle = P.ink; c.lineWidth = 1; for (var x = 6; x < w - 4; x += 5) { c.beginPath(); c.moveTo(x, top - 4); c.lineTo(x, top - 10); c.stroke(); }
    c.beginPath(); c.moveTo(2, top - 10); c.lineTo(w - 2, top - 10); c.stroke();
    /* a striped awning over the terrace */
    c.beginPath(); c.moveTo(w * 0.55, top - 10); c.lineTo(w - 4, top - 10); c.lineTo(w - 2, top - 2); c.lineTo(w * 0.55 - 2, top - 2); c.closePath();
    c.save(); c.clip(); for (var k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#ffffff' : P['tent-b']; c.fillRect(w * 0.55 - 4 + k * 5, top - 12, 5, 12); } c.restore();
    c.strokeStyle = P.ink; c.lineWidth = 1.1; c.stroke();
    [10, w - 26].forEach(function (wx) { if (Math.abs(wx + 8 - (dx + T / 2)) > 16) { rr(c, wx, top + 10, 16, 14, 2); fillStroke(c, '#bfe3ff', P.ink, 1.3); c.beginPath(); c.moveTo(wx + 8, top + 10); c.lineTo(wx + 8, top + 24); c.lineWidth = 1; c.stroke(); } });
    rr(c, dx + 7, h - T + 4, T - 14, T - 6, 3); fillStroke(c, P['tent-b'], P.ink, 1.6);
    /* bougainvillea climbing over the door */
    blobs(c, [[dx + 6, h - T + 2, 5], [dx + 13, h - T - 2, 5], [dx + 21, h - T - 1, 5], [dx + T - 5, h - T + 4, 4.5]], P['flower-a'], P.ink, 1.1);
    c.fillStyle = P.leaf2; [[dx + 9, h - T + 4], [dx + 18, h - T + 1], [dx + 25, h - T + 6]].forEach(function (q) { circle(c, q[0], q[1], 1.6); c.fill(); });
  },
  /* the way down into the Cisternone: a stone arch with an iron gate */
  cistern: function (c, w, h, P) {
    ell(c, 16, 29, 12, 3); c.fillStyle = P.shadow; c.fill();
    c.beginPath(); c.moveTo(3, 29); c.lineTo(3, 6); c.arc(16, 6, 13, Math.PI, 0); c.lineTo(29, 29); c.closePath(); fillStroke(c, P.stone, P.ink, 1.7);
    c.beginPath(); c.moveTo(8, 29); c.lineTo(8, 9); c.arc(16, 9, 8, Math.PI, 0); c.lineTo(24, 29); c.closePath(); fillStroke(c, '#20263a', P.ink, 1.4);
    c.strokeStyle = '#8f96a0'; c.lineWidth = 1.4; for (var k = 0; k < 4; k++) { c.beginPath(); c.moveTo(10 + k * 4, 29); c.lineTo(10 + k * 4, 6); c.stroke(); }
    c.beginPath(); c.moveTo(8, 16); c.lineTo(24, 16); c.stroke();
    c.strokeStyle = P.stone2; c.lineWidth = 1; c.beginPath(); c.moveTo(5, 14); c.lineTo(8, 13); c.moveTo(27, 18); c.lineTo(24, 17); c.stroke();
  },
  /* the collegiate church of Saints Lorenzo and Giovanni Battista, on Piazza San Giovanni in Mola: a baroque front in two
     orders with pilasters, a pediment and an oculus, three doors, and the bell tower with its clock beside it */
  collegiata: function (c, w, h, P, o) {
    /* the front is centred on the door; the bell tower stands on the side with more room */
    var dx = (o.doorX! - o.x!) * T, tw = 34, fw = w - tw - 6, cx = dx + T / 2, left = cx > w / 2;
    var fx = left ? tw + 4 : 2, bx = left ? 1 : w - tw - 1, top1 = T * 0.15, top2 = -T * 0.95, uw = fw * 0.3;
    ell(c, w / 2, h - 1, w / 2, 6); c.fillStyle = P.shadow; c.fill();
    var btop = -T * 2.2;
    rr(c, bx, btop + 16, tw, h - btop - 18, 2); fillStroke(c, P['wall-d'], P.ink, 1.8);
    for (var k = 0; k < 3; k++) { c.strokeStyle = P.stone2; c.lineWidth = 1.2; c.beginPath(); c.moveTo(bx + 2, btop + 40 + k * 26); c.lineTo(bx + tw - 2, btop + 40 + k * 26); c.stroke(); }
    rr(c, bx + 8, btop + 22, tw - 16, 16, 7); fillStroke(c, '#20263a', P.ink, 1.3);
    c.strokeStyle = '#d9a35c'; c.lineWidth = 2; c.beginPath(); c.arc(bx + tw / 2, btop + 34, 4.5, Math.PI, 0); c.stroke();
    circle(c, bx + tw / 2, btop + 54, 8); fillStroke(c, '#fffdf6', P.ink, 1.3);
    c.strokeStyle = P.ink; c.lineWidth = 1.3; c.beginPath(); c.moveTo(bx + tw / 2, btop + 54); c.lineTo(bx + tw / 2, btop + 49); c.moveTo(bx + tw / 2, btop + 54); c.lineTo(bx + tw / 2 + 4, btop + 55); c.stroke();
    poly(c, [[bx - 3, btop + 17], [bx + tw / 2, btop - 2], [bx + tw + 3, btop + 17]]); fillStroke(c, P['roof-a'], P.ink, 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(bx + tw / 2, btop - 2); c.lineTo(bx + tw / 2, btop - 14); c.moveTo(bx + tw / 2 - 4, btop - 9); c.lineTo(bx + tw / 2 + 4, btop - 9); c.stroke();
    /* the lower order: pilasters, a cornice, three doors */
    rr(c, fx, top1, fw, h - top1 - 2, 2); fillStroke(c, P.wall, P.ink, 1.9);
    [fx, cx - fw * 0.22 - 8, cx + fw * 0.22, fx + fw - 10].forEach(function (px) { c.fillStyle = P.stone; c.fillRect(px + 2, top1 + 2, 7, h - top1 - 6); c.strokeStyle = P.stone2; c.lineWidth = 1; c.strokeRect(px + 2, top1 + 2, 7, h - top1 - 6); });
    rr(c, fx - 2, top1 - 4, fw + 4, 7, 1); fillStroke(c, P.stone, P.ink, 1.4);
    /* the upper order, narrower: two niches with their saints, the oculus, the pediment with the cross */
    rr(c, cx - uw, top2 + 12, uw * 2, top1 - top2 - 12, 1); fillStroke(c, P.wall, P.ink, 1.7);
    poly(c, [[cx - uw - 5, top2 + 14], [cx, top2 - 8], [cx + uw + 5, top2 + 14]]); fillStroke(c, P.stone, P.ink, 1.7);
    poly(c, [[cx - uw + 5, top2 + 10], [cx, top2 - 1], [cx + uw - 5, top2 + 10]]); c.strokeStyle = P.stone2; c.lineWidth = 1; c.stroke();
    c.strokeStyle = P.ink; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(cx - uw, top1 - 4); c.quadraticCurveTo(cx - uw - 12, top1 - 4, cx - uw - 12, top1 - 10); c.stroke();
    c.beginPath(); c.moveTo(cx + uw, top1 - 4); c.quadraticCurveTo(cx + uw + 12, top1 - 4, cx + uw + 12, top1 - 10); c.stroke();
    [-1, 1].forEach(function (sd) {
      var nx = cx + sd * uw * 0.62 - 5, ny = top2 + 22;
      c.beginPath(); c.moveTo(nx, ny + 20); c.lineTo(nx, ny + 5); c.arc(nx + 5, ny + 5, 5, Math.PI, 0); c.lineTo(nx + 10, ny + 20); c.closePath(); fillStroke(c, P.stone2, P.ink, 1.1);
      circle(c, nx + 5, ny + 6, 2.2); c.fillStyle = P.stone; c.fill(); rr(c, nx + 2.5, ny + 9, 5, 9, 2); c.fill();
    });
    circle(c, cx, top2 + 30, 9); fillStroke(c, '#bfe3ff', P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 0.9; for (var r = 0; r < 6; r++) { c.beginPath(); c.moveTo(cx, top2 + 30); c.lineTo(cx + Math.cos(r * Math.PI / 3) * 9, top2 + 30 + Math.sin(r * Math.PI / 3) * 9); c.stroke(); }
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(cx, top2 - 8); c.lineTo(cx, top2 - 20); c.moveTo(cx - 4, top2 - 15); c.lineTo(cx + 4, top2 - 15); c.stroke();
    /* the main door under its little pediment, the two small ones, the step */
    c.beginPath(); c.moveTo(cx - 10, h - 2); c.lineTo(cx - 10, h - T + 6); c.arc(cx, h - T + 6, 10, Math.PI, 0); c.lineTo(cx + 10, h - 2); c.closePath(); fillStroke(c, P.wood2, P.ink, 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, h - T + 1); c.lineTo(cx, h - 2); c.stroke();
    poly(c, [[cx - 15, h - T - 6], [cx, h - T - 14], [cx + 15, h - T - 6]]); fillStroke(c, P.stone, P.ink, 1.2);
    [-1, 1].forEach(function (sd) { var sx = cx + sd * fw * 0.36 - 6; c.beginPath(); c.moveTo(sx, h - 2); c.lineTo(sx, h - 22); c.arc(sx + 6, h - 22, 6, Math.PI, 0); c.lineTo(sx + 12, h - 2); c.closePath(); fillStroke(c, P.wood2, P.ink, 1.3); });
    rr(c, cx - 22, h - 4, 44, 4, 1); fillStroke(c, P.stone2, P.ink, 1);
    if (o.label) plaque(c, P, o.label, fx + fw / 2, top1 + 9, fw - 24, 12);
  },
  /* a school of the sixties: two floors of ribbon windows, the entrance under a canopy, the flags */
  school: function (c, w, h, P, o) {
    var dx = (o.doorX! - o.x!) * T, top = -T * 0.55;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 2, top, w - 4, h - top - 2, 2); fillStroke(c, P['wall-b'], P.ink, 1.8);
    rr(c, 0, top - 5, w, 7, 2); fillStroke(c, P.stone2, P.ink, 1.5);
    [top + 8, top + 30].forEach(function (wy, f) {
      for (var x = 8; x + 16 <= w - 8; x += 20) {
        if (f === 1 && Math.abs(x + 8 - (dx + T / 2)) < 20) continue;
        rr(c, x, wy, 16, 14, 1); fillStroke(c, '#bfe3ff', P.ink, 1.2);
        c.strokeStyle = P.ink; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x + 8, wy); c.lineTo(x + 8, wy + 14); c.stroke();
        c.fillStyle = P['tent-a']; c.globalAlpha = 0.85; c.fillRect(x, wy, 16, 3); c.globalAlpha = 1;
      }
    });
    rr(c, dx + 4, h - T + 2, T - 8, T - 4, 2); fillStroke(c, '#e8f5ff', P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(dx + T / 2, h - T + 2); c.lineTo(dx + T / 2, h - 2); c.stroke();
    rr(c, dx - 6, h - T - 4, T + 12, 6, 1); fillStroke(c, P.stone, P.ink, 1.3);
    /* the Italian and the European flag */
    [[w - 14, ['#2c9a55', '#ffffff', '#d14b3a']], [w - 30, ['#2d4fb3']]].forEach(function (f) {
      var fx = f[0] as number, cols = f[1] as string[];
      c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(fx, top - 4); c.lineTo(fx, top - 30); c.stroke();
      cols.forEach(function (col, i) { c.fillStyle = col; c.fillRect(fx + 1 + i * (12 / cols.length), top - 30, 12 / cols.length, 8); });
      c.strokeStyle = P.ink; c.lineWidth = 0.9; c.strokeRect(fx + 1, top - 30, 12, 8);
      if (cols.length === 1) { c.fillStyle = '#ffd166'; for (var st = 0; st < 6; st++) { circle(c, fx + 7 + Math.cos(st * 1.05) * 2.6, top - 26 + Math.sin(st * 1.05) * 2.6, 0.6); c.fill(); } }
    });
    if (o.label) plaque(c, P, o.label, w / 2 - 10, top + 1, w - 50, 11);
  },
  /* the church of the Villaggio Don Bosco, a parish of the post-war town: a plain hall with its gable to the street, a tall
     stained-glass window over the door, a concrete canopy, the square bell tower with its open belfry, and beside the
     hall the low house of the parish */
  parish: function (c, w, h, P, o) {
    var dx = (o.doorX! - o.x!) * T, tw = 24, bx = w - tw - 4, cx = dx + T / 2, half = Math.max(30, Math.min(cx - 2, bx - 6 - cx, 64));
    var hx = cx - half, hw = half * 2, wallTop = -T * 0.05, peak = -T * 0.95;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    var btop = -T * 1.9, bc = bx + tw / 2;
    rr(c, bx, btop + 14, tw, h - btop - 16, 2); fillStroke(c, P.stone, P.ink, 1.7);
    rr(c, bx + 5, btop + 20, tw - 10, 19, 2); fillStroke(c, '#20263a', P.ink, 1.2);
    c.beginPath(); c.moveTo(bc - 6, btop + 35); c.quadraticCurveTo(bc - 5, btop + 23, bc, btop + 23); c.quadraticCurveTo(bc + 5, btop + 23, bc + 6, btop + 35); c.closePath(); fillStroke(c, '#d9a35c', P.ink, 1);
    rr(c, bx - 2, btop + 10, tw + 4, 6, 1); fillStroke(c, P.stone2, P.ink, 1.4);
    for (var k = 0; k < 3; k++) { rr(c, bc - 1.5, btop + 50 + k * 15, 3, 9, 1); c.fillStyle = '#20263a'; c.fill(); }
    c.strokeStyle = P.ink; c.lineWidth = 2.2; c.beginPath(); c.moveTo(bc, btop + 10); c.lineTo(bc, btop - 9); c.moveTo(bc - 5, btop - 3); c.lineTo(bc + 5, btop - 3); c.stroke();
    /* the parish house, low, on the other side */
    if (hx > 16) {
      var ay = T * 0.4;
      rr(c, 2, ay, hx - 3, h - ay - 2, 2); fillStroke(c, P['wall-d'], P.ink, 1.6);
      rr(c, 0, ay - 5, hx + 1, 7, 1); fillStroke(c, P.stone2, P.ink, 1.3);
      shuttered(c, P, 2 + (hx - 3) / 2 - 5, ay + 12, 10, 12, P['shutter-a']);
    }
    /* the hall, and its gable: the roof edges, the wall under them, a cross in relief */
    rr(c, hx, wallTop, hw, h - wallTop - 2, 2); fillStroke(c, P.wall, P.ink, 1.9);
    poly(c, [[hx - 5, wallTop + 4], [cx, peak - 3], [hx + hw + 5, wallTop + 4]]); fillStroke(c, P['roof-a'], P.ink, 1.8);
    poly(c, [[hx + 4, wallTop + 2], [cx, peak + 6], [hx + hw - 4, wallTop + 2]]); fillStroke(c, P.wall, P.ink, 1.3);
    c.strokeStyle = P.stone2; c.lineWidth = 2.6; c.beginPath(); c.moveTo(cx, peak + 13); c.lineTo(cx, wallTop - 1); c.moveTo(cx - 5, peak + 18); c.lineTo(cx + 5, peak + 18); c.stroke();
    /* the stained-glass window, in tall panes, with the cross across it */
    var gx = cx - 13, gy = wallTop + 17, gw = 26, gh = h - T - 6 - gy;
    rr(c, gx, gy, gw, gh, 3); fillStroke(c, '#bfe3ff', P.ink, 1.5);
    c.save(); rr(c, gx, gy, gw, gh, 3); c.clip();
    ['#9ec5ff', '#ffd166', '#ff9a8b', '#b6e07a', '#c3a6ff', '#9ec5ff'].forEach(function (col, i) { c.fillStyle = col; c.globalAlpha = 0.75; c.fillRect(gx + (i % 3) * gw / 3, gy + Math.floor(i / 3) * gh / 2, gw / 3, gh / 2); });
    c.restore(); c.globalAlpha = 1;
    c.strokeStyle = P.ink; c.lineWidth = 0.9;
    c.beginPath(); c.moveTo(gx + gw / 3, gy); c.lineTo(gx + gw / 3, gy + gh); c.moveTo(gx + gw * 2 / 3, gy); c.lineTo(gx + gw * 2 / 3, gy + gh); c.moveTo(gx, gy + gh / 2); c.lineTo(gx + gw, gy + gh / 2); c.stroke();
    c.strokeStyle = '#fffdf6'; c.lineWidth = 3.4; c.beginPath(); c.moveTo(cx, gy + 4); c.lineTo(cx, gy + gh - 4); c.moveTo(gx + 4, gy + gh * 0.33); c.lineTo(gx + gw - 4, gy + gh * 0.33); c.stroke();
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, gy + 4); c.lineTo(cx, gy + gh - 4); c.moveTo(gx + 4, gy + gh * 0.33); c.lineTo(gx + gw - 4, gy + gh * 0.33); c.stroke();
    /* narrow side windows, the door under its concrete canopy */
    [hx + 9, hx + hw - 15].forEach(function (sx) { rr(c, sx, wallTop + 14, 6, h - wallTop - 26, 2); fillStroke(c, '#bfe3ff', P.ink, 1.1); });
    rr(c, cx - T / 2 + 5, h - T + 6, T - 10, T - 8, 2); fillStroke(c, P.wood2, P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, h - T + 6); c.lineTo(cx, h - 2); c.stroke();
    rr(c, cx - T / 2 - 4, h - T + 1, T + 8, 5, 1); fillStroke(c, P.stone2, P.ink, 1.3);
    if (o.label) plaque(c, P, o.label, cx, wallTop + 7, Math.min(hw - 12, 96), 11);
  },
  /* remains of the Roman aqueduct: two arches in opus reticulatum, grass on top */
  aqueduct: function (c, w, h, P) {
    ell(c, w / 2, h - 3, w / 2 - 2, 4); c.fillStyle = P.shadow; c.fill();
    c.beginPath(); c.rect(2, -T * 0.5, w - 4, h + T * 0.5 - 4);
    for (var k = 0; k < 2; k++) { var ax = 12 + k * (w - 24) / 2, aw = (w - 24) / 2 - 8; c.moveTo(ax, h - 4); c.lineTo(ax, h - 26); c.arc(ax + aw / 2, h - 26, aw / 2, Math.PI, 0); c.lineTo(ax + aw, h - 4); }
    c.fillStyle = P.rock; c.fill('evenodd'); c.strokeStyle = P.ink; c.lineWidth = 1.7; c.stroke();
    c.strokeStyle = P.rock2; c.lineWidth = 0.8; c.globalAlpha = 0.7;
    for (var y = -T * 0.5 + 6; y < h - 30; y += 6) for (var x = 4 + (y % 12 ? 3 : 0); x < w - 6; x += 6) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + 3, y + 3); c.stroke(); }
    c.globalAlpha = 1;
    blobs(c, [[10, -T * 0.5, 5], [w / 2, -T * 0.5 - 2, 6], [w - 12, -T * 0.5 + 1, 4.5]], P.leaf, P.ink, 1.2);
  },
  /* the Gelateria Lavezzi, in Piazza Marconi since 1870: an old shop front with a carved cornice, the long
     window full of gelato tubs, a striped awning, the name in gold, a big cone on the corner */
  gelateria: function (c, w, h, P, o) {
    var dx = (o.doorX! - o.x!) * T, wallTop = T * 0.1, top = -T * 0.6;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 2, top, w - 4, h - top - 2, 2); fillStroke(c, P['wall-b'], P.ink, 1.8);
    rr(c, 0, top - 5, w, 8, 2); fillStroke(c, P.stone, P.ink, 1.5);
    for (var k = 0; k < 10; k++) { circle(c, 6 + k * (w - 12) / 9, top + 5, 1.6); c.fillStyle = P.stone2; c.fill(); }
    /* first-floor windows with green shutters */
    [12, w - 30].forEach(function (wx) { shuttered(c, P, wx, top + 12, 14, 13, P['shutter-a']); flowers(c, P, wx, top + 26, 14); });
    /* the sign: LAVEZZI in gold on deep green, "dal 1870" under it */
    rr(c, 10, wallTop + 2, w - 20, 17, 3); fillStroke(c, '#1f5c45', P.ink, 1.5);
    c.fillStyle = '#ffd98a'; c.font = '14px "Lilita One", "Arial Rounded MT Bold", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(o.label || 'LAVEZZI', w / 2, wallTop + 11, w - 28);
    c.fillStyle = '#1f5c45'; c.font = '700 8px ui-monospace, Menlo, monospace'; c.fillText('GELATERIA · DAL 1870', w / 2, wallTop + 25);
    /* the striped awning */
    c.beginPath(); c.moveTo(4, wallTop + 30); c.lineTo(w - 4, wallTop + 30); c.lineTo(w, wallTop + 42); c.lineTo(0, wallTop + 42); c.closePath();
    c.save(); c.clip(); for (var st = 0; st * 8 < w; st++) { c.fillStyle = st % 2 ? '#ffffff' : '#f4a6b8'; c.fillRect(st * 8, wallTop + 28, 8, 16); } c.restore();
    c.strokeStyle = P.ink; c.lineWidth = 1.4; c.stroke();
    for (st = 0; st * 8 < w; st++) { c.beginPath(); c.arc(st * 8 + 4, wallTop + 42, 4, 0, Math.PI); c.fillStyle = st % 2 ? '#ffffff' : '#f4a6b8'; c.fill(); c.lineWidth = 1; c.stroke(); }
    /* the window full of gelato */
    var gx = 8, gw = Math.max(20, dx - 12);
    rr(c, gx, h - T + 2, gw, T - 8, 2); fillStroke(c, '#e8f5ff', P.ink, 1.4);
    ['#fff3a0', '#ff9fb2', '#7a4a2c', '#b6e07a', '#fffdf6', '#c9a46a'].forEach(function (col, i) { if (i * 9 + 13 < gw) { rr(c, gx + 3 + i * 9, h - 16, 7, 6, 2); fillStroke(c, col, P.ink, 0.8); } });
    rr(c, dx + 6, h - T + 3, T - 12, T - 5, 2); fillStroke(c, '#e8f5ff', P.ink, 1.4);
    /* a big cone on the corner */
    var cx2 = w - 12, cy2 = h - T + 4;
    poly(c, [[cx2 - 6, cy2], [cx2 + 6, cy2], [cx2, cy2 + 16]]); fillStroke(c, '#e0a55b', P.ink, 1.3);
    blobs(c, [[cx2 - 3, cy2 - 3, 4.5], [cx2 + 3, cy2 - 3, 4.5], [cx2, cy2 - 8, 4.5]], '#ff9fb2', P.ink, 1.1);
  },
  /* a street-name plate on its pole, as at the corners of Formia: white marble, a dark frame */
  plate: function (c, w, h, P) {
    ell(c, 16, 29, 6, 2); c.fillStyle = P.shadow; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 2.6; c.beginPath(); c.moveTo(16, 29); c.lineTo(16, 6); c.stroke();
    rr(c, 2, -6, 28, 13, 2); fillStroke(c, '#fbfbf7', P.ink, 1.6);
    rr(c, 4.5, -3.5, 23, 8, 1); c.strokeStyle = P.ink; c.lineWidth = 0.9; c.stroke();
    c.fillStyle = P.ink; c.globalAlpha = 0.7; c.fillRect(8, -0.5, 16, 1.6); c.globalAlpha = 1;
  },
  /* the Tomb of Cicero on the Appia: a square base and a round drum, overgrown on top */
  tomb: function (c, w, h, P) {
    ell(c, w / 2, h - 4, w / 2 - 2, 6); c.fillStyle = P.shadow; c.fill();
    rr(c, 6, h - 40, w - 12, 36, 3); fillStroke(c, P.stone, P.ink, 1.8);
    c.strokeStyle = P.stone2; c.lineWidth = 1;
    [h - 28, h - 16].forEach(function (y) { c.beginPath(); c.moveTo(7, y); c.lineTo(w - 7, y); c.stroke(); });
    [20, 44, 68].forEach(function (x, i) { c.beginPath(); c.moveTo(x + (i % 2) * 8, h - 40); c.lineTo(x + (i % 2) * 8, h - 28); c.moveTo(x + 10, h - 28); c.lineTo(x + 10, h - 16); c.stroke(); });
    var x0 = 18, x1 = w - 18, top = -T * 1.45, bot = h - 40, cx = w / 2;
    cylinder(c, P, x0, x1, top + 8, bot, 5);
    c.beginPath(); c.moveTo(x0 - 1, top + 9);
    for (var k = 0; k <= 8; k++) c.lineTo(x0 + k * (x1 - x0) / 8, top + 9 - (k % 2 ? 6 : 1) - hash(k, 9, 175) * 3);
    c.lineTo(x1 + 1, top + 9); c.closePath(); fillStroke(c, P.stone2, P.ink, 1.4);
    blobs(c, [[x0 + 8, top + 2, 6], [cx, top - 2, 7], [x1 - 9, top + 3, 5.5]], P.leaf, P.ink, 1.3);
    c.strokeStyle = P.leaf2; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0 + 6, top + 8); c.quadraticCurveTo(x0 + 3, top + 22, x0 + 6, top + 34); c.stroke();
    rr(c, cx - 7, h - 27, 14, 23, 2); fillStroke(c, '#20263a', P.ink, 1.4);
  }
};
function building(c: Ctx, w: number, h: number, P: Palette, o: ObjOpts, d: BuildingLook) {
  var wallTop = T * 0.9, roofTop = -T * 0.55;
  ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
  if (d.chimney) { rr(c, w - 30, roofTop - 4, 9, 13, 1); fillStroke(c, d.wall || P.wall, P.ink, 1.4); rr(c, w - 31.5, roofTop - 6, 12, 4, 1); fillStroke(c, P.stone2, P.ink, 1.2); }
  rr(c, 3, wallTop, w - 6, h - wallTop - 2, 3); fillStroke(c, d.wall || P.wall, P.ink, 1.8);
  c.beginPath(); c.moveTo(-2, wallTop + 4); c.lineTo(10, roofTop); c.lineTo(w - 10, roofTop); c.lineTo(w + 2, wallTop + 4); c.closePath();
  fillStroke(c, d.roof, P.ink, 1.8);
  c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.35;
  for (var y = roofTop + 8; y < wallTop; y += 8) { c.beginPath(); c.moveTo(4, y); c.lineTo(w - 4, y); c.stroke(); }
  c.globalAlpha = 1;
  var dx = (o.doorX! - o.x!) * T, wy = wallTop + 10, n = d.windows;
  var slots = [];
  for (var k = 0; k < n + 1; k++) slots.push(10 + k * ((w - 20 - 18) / Math.max(1, n)));
  slots.forEach(function (sx) {
    if (Math.abs(sx + 9 - (dx + T / 2)) < 20) return;
    shuttered(c, P, sx + (d.shutter ? 2 : 0), wy, d.shutter ? 14 : 18, 14, d.shutter);
    if (d.plants) flowers(c, P, sx + (d.shutter ? 2 : 0), wy + 15, d.shutter ? 14 : 18);
  });
  if (d.awning) {
    var aw = Math.min(T * 1.6, w - 8), ax = dx + T / 2 - aw / 2;
    c.beginPath(); c.moveTo(ax, wallTop + 2); c.lineTo(ax + aw, wallTop + 2); c.lineTo(ax + aw - 4, wallTop + 14); c.lineTo(ax + 4, wallTop + 14); c.closePath();
    fillStroke(c, d.awning, P.ink, 1.5);
    c.fillStyle = '#ffffff'; for (var a = 0; a < 4; a++) c.fillRect(ax + 6 + a * (aw - 12) / 4, wallTop + 3, (aw - 12) / 8, 10);
  }
  rr(c, dx + 7, h - T + 4, T - 14, T - 6, 3); fillStroke(c, d.door || P.wood, P.ink, 1.6);
  circle(c, dx + T - 11, h - T / 2 + 2, 1.4); c.fillStyle = P.ink; c.fill();
  if (d.sign || o.label) plaque(c, P, (o.label || d.sign)!, w / 2, wallTop - 3, w - 12, 15);
}
/* a house with a flat roof terrace, as on the coast: a parapet, plants or a water tank up top, two floors of shuttered windows */
function terrace(c: Ctx, w: number, h: number, P: Palette, o: ObjOpts, f: ReturnType<typeof facade>) {
  var top = -T * 0.15, dx = (o.doorX! - o.x!) * T, v = o.v || 0;
  ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
  if (v % 2) { rr(c, w - 24, top - 16, 13, 12, 4); fillStroke(c, P.stone, P.ink, 1.3); c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(w - 21, top - 6); c.lineTo(w - 21, top - 1); c.moveTo(w - 14, top - 6); c.lineTo(w - 14, top - 1); c.stroke(); }
  else blobs(c, [[12, top - 6, 5], [20, top - 8, 6], [w - 14, top - 7, 5.5]], P.leaf, P.ink, 1.3);
  rr(c, 3, top, w - 6, h - top - 2, 3); fillStroke(c, f.wall, P.ink, 1.8);
  rr(c, 1, top - 4, w - 2, 6, 2); fillStroke(c, f.wall, P.ink, 1.5);
  c.fillStyle = P.ink; c.globalAlpha = 0.12; c.fillRect(4, top + 2, w - 8, 3); c.globalAlpha = 1;
  var rows = [top + 10, h - T + 2], n = Math.max(2, Math.round((w - 12) / 30));
  rows.forEach(function (wy, r) {
    for (var k = 0; k < n; k++) {
      var sx = 12 + k * ((w - 24 - 14) / Math.max(1, n - 1));
      if (r === 1 && Math.abs(sx + 7 - (dx + T / 2)) < 18) continue;
      shuttered(c, P, sx, wy, 14, 13, f.shutter);
      if (r === 0 && f.plants) flowers(c, P, sx, wy + 14, 14);
    }
  });
  rr(c, dx + 7, h - T + 4, T - 14, T - 6, 3); fillStroke(c, f.door, P.ink, 1.6);
  circle(c, dx + T - 11, h - T / 2 + 2, 1.4); c.fillStyle = P.ink; c.fill();
  if (o.label) plaque(c, P, o.label, w / 2, top + 3, w - 12, 13);
}
