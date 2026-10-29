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
}
/** a painted object: the picture, and its size in map px (up included) */
export interface Sprite { cv: HTMLCanvasElement; w: number; h: number; up: number }
type ObjFn = (c: Ctx, w: number, h: number, P: Palette, o: ObjOpts) => void;
interface BuildingLook { roof: string; windows: number; awning?: string; sign?: string }

/* ---------- tall objects: drawn sorted by their bottom edge, so people walk behind them ---------- */
/** how far above its footprint each kind of thing is drawn, in px (1 tile when missing) */
export const HEIGHT: Record<string, number> = { tower: T * 2.4, tomb: T * 1.9, house: T * 0.75, station: T * 0.75, circolo: T * 0.9, bar: T * 0.75, shop: T * 0.75, palazzo: T * 1.1,
  church: T * 2.15, octagon: T * 2.1, clocktower: T * 2.05, coni: T * 0.75, lido: T * 0.9, kiosk: T * 0.6, ferry: T * 0.75, cypress: T * 1.6,
  lifeguard: T * 1.4, ruins: T * 0.9, tunnel: T * 0.5, fountain: T * 0.5, car: T * 0.2, item: T * 0.4, pine: T * 1.4, condo: T * 1.1, pub: T * 0.75 };
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
    var top = -T * 1.05, dx = (o.doorX! - o.x!) * T;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 3, top, w - 6, h - top - 2, 2); fillStroke(c, P.wall, P.ink, 1.8);
    rr(c, 0, top - 5, w, 8, 2); fillStroke(c, P.stone2, P.ink, 1.6);
    c.fillStyle = o.roof || P['roof-b']; c.globalAlpha = 0.35; c.fillRect(4, top + 3, w - 8, 5); c.globalAlpha = 1;
    var floors = Math.max(2, Math.floor((h - T - top - 8) / 21));
    for (var f = 0; f < floors; f++) {
      var wy = top + 12 + f * 21;
      for (var x = 9; x + 14 <= w - 9; x += 19) {
        rr(c, x, wy, 14, 11, 2); fillStroke(c, '#bfe3ff', P.ink, 1.2);
        c.strokeStyle = P.ink; c.lineWidth = 1.1;
        c.beginPath(); c.moveTo(x - 3, wy + 14); c.lineTo(x + 17, wy + 14); c.moveTo(x - 3, wy + 14); c.lineTo(x - 3, wy + 18); c.moveTo(x + 17, wy + 14); c.lineTo(x + 17, wy + 18); c.stroke();
        if ((x + f) % 3 === 0) { c.fillStyle = P['flower-a']; circle(c, x + 2, wy + 13, 1.8); c.fill(); }
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
  house: function (c, w, h, P, o) { building(c, w, h, P, o, { roof: o.roof || P['roof-a'], windows: 2 }); },
  shop: function (c, w, h, P, o) { building(c, w, h, P, o, { roof: o.roof || P['roof-c'], windows: 1, awning: o.awning || '#ff8fc1' }); },
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
  rr(c, 3, wallTop, w - 6, h - wallTop - 2, 3); fillStroke(c, P.wall, P.ink, 1.8);
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
    rr(c, sx, wy, 18, 14, 2); fillStroke(c, '#bfe3ff', P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(sx + 9, wy); c.lineTo(sx + 9, wy + 14); c.stroke();
  });
  if (d.awning) {
    var aw = Math.min(T * 1.6, w - 8), ax = dx + T / 2 - aw / 2;
    c.beginPath(); c.moveTo(ax, wallTop + 2); c.lineTo(ax + aw, wallTop + 2); c.lineTo(ax + aw - 4, wallTop + 14); c.lineTo(ax + 4, wallTop + 14); c.closePath();
    fillStroke(c, d.awning, P.ink, 1.5);
    c.fillStyle = '#ffffff'; for (var a = 0; a < 4; a++) c.fillRect(ax + 6 + a * (aw - 12) / 4, wallTop + 3, (aw - 12) / 8, 10);
  }
  rr(c, dx + 7, h - T + 4, T - 14, T - 6, 3); fillStroke(c, P.wood, P.ink, 1.6);
  circle(c, dx + T - 11, h - T / 2 + 2, 1.4); c.fillStyle = P.ink; c.fill();
  if (d.sign || o.label) plaque(c, P, (o.label || d.sign)!, w / 2, wallTop - 3, w - 12, 15);
}
