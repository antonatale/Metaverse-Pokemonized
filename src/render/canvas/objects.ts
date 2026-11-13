import type { Palette } from './palette';
import { T, STICKER_INK, mk, rr, hash, fillStroke, circle, ell, poly, blobs, plaque, cylinder, type Ctx } from './draw';
import { cortina, castello, anchor, castlewall, cannelle } from './cortina';

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
  /** a palazzo of a cortina: what its ground floor is (see cortina) */
  look?: string;
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

/* the De Amicis, the elementary school of Mola: a building of the thirties in ochre plaster, two tall floors of
   windows in stone frames, the portal in the middle under its balcony, the name in capitals along the frieze, the
   stair of the entrance; the flags out of the balcony */
function oldSchool(c: Ctx, w: number, h: number, P: Palette, o: ObjOpts) {
  var dx = (o.doorX! - o.x!) * T, cx = dx + T / 2, top = -T * 0.75, k;
  ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
  rr(c, 1, top - 9, w - 2, 12, 2); fillStroke(c, P['roof-a'], P.ink, 1.6);
  c.strokeStyle = P.ink; c.globalAlpha = 0.3; c.lineWidth = 0.9; for (k = 5; k < w - 2; k += 5) { c.beginPath(); c.moveTo(k, top - 8); c.lineTo(k, top + 2); c.stroke(); } c.globalAlpha = 1;
  rr(c, 3, top, w - 6, h - top - 2, 1.5); fillStroke(c, P['wall-g'], P.ink, 1.9);
  /* the frieze with the name, the string course, the rusticated base */
  rr(c, 1, top + 1, w - 2, 9, 1); fillStroke(c, P.wall, P.ink, 1.3);
  var mid = top + (h - top) * 0.47;
  rr(c, 2, mid - 2, w - 4, 4, 1); fillStroke(c, P.wall, P.ink, 1);
  c.fillStyle = P.stone; c.fillRect(4, h - 14, w - 8, 11);
  c.strokeStyle = P.ink; c.lineWidth = 0.8; c.globalAlpha = 0.45;
  c.beginPath(); c.moveTo(4, h - 8.5); c.lineTo(w - 4, h - 8.5); c.stroke();
  for (k = 10; k < w - 4; k += 14) { c.beginPath(); c.moveTo(k, h - 14); c.lineTo(k, h - 8.5); c.moveTo(k + 7, h - 8.5); c.lineTo(k + 7, h - 3); c.stroke(); }
  c.globalAlpha = 1;
  /* tall windows in their frames, upstairs with a little pediment */
  var cols = Math.round(w / T);
  for (k = 0; k < cols; k++) {
    var wx = k * T + T / 2 - 6;
    if (Math.abs(wx + 6 - cx) < 4) continue;
    [[top + 14, true], [mid + 5, false]].forEach(function (r) {
      var wy = r[0] as number;
      rr(c, wx - 2, wy - 2, 16, 23, 1); fillStroke(c, P.wall, P.ink, 1);
      rr(c, wx, wy, 12, 19, 1); fillStroke(c, '#bfe3ff', P.ink, 1.1);
      c.strokeStyle = P.ink; c.lineWidth = 0.8; c.beginPath(); c.moveTo(wx + 6, wy); c.lineTo(wx + 6, wy + 19); c.moveTo(wx, wy + 7); c.lineTo(wx + 12, wy + 7); c.stroke();
      if (r[1]) { poly(c, [[wx - 3, wy - 3], [wx + 6, wy - 7], [wx + 15, wy - 3]]); fillStroke(c, P.wall, P.ink, 1); }
    });
  }
  /* the portal, the balcony over it with the flags, the steps */
  rr(c, cx - 13, mid + 1, 26, h - mid - 4, 2); fillStroke(c, P.stone, P.ink, 1.4);
  c.beginPath(); c.moveTo(cx - 8, h - 5); c.lineTo(cx - 8, mid + 13); c.arc(cx, mid + 13, 8, Math.PI, 0); c.lineTo(cx + 8, h - 5); c.closePath(); fillStroke(c, P.wood2, P.ink, 1.3);
  c.strokeStyle = P.ink; c.lineWidth = 0.9; c.beginPath(); c.moveTo(cx, mid + 6); c.lineTo(cx, h - 5); c.stroke();
  rr(c, cx - 16, mid - 6, 32, 6, 1); fillStroke(c, P.stone, P.ink, 1.2);
  c.strokeStyle = P.ink; c.lineWidth = 0.8; for (k = cx - 14; k < cx + 15; k += 3.5) { c.beginPath(); c.moveTo(k, mid - 13); c.lineTo(k, mid - 6); c.stroke(); }
  c.beginPath(); c.moveTo(cx - 16, mid - 13); c.lineTo(cx + 16, mid - 13); c.stroke();
  rr(c, cx - 6, top + 14, 12, mid - top - 28, 1); fillStroke(c, '#bfe3ff', P.ink, 1.1);
  [[cx - 13, ['#2c9a55', '#ffffff', '#d14b3a']], [cx + 13, ['#2d4fb3']]].forEach(function (f) {
    var fx = f[0] as number, fc = f[1] as string[], dir = fx < cx ? -1 : 1;
    c.strokeStyle = P.ink; c.lineWidth = 1.3; c.beginPath(); c.moveTo(fx, mid - 10); c.lineTo(fx + dir * 9, mid - 24); c.stroke();
    fc.forEach(function (col, i) { c.fillStyle = col; c.beginPath(); c.moveTo(fx + dir * (9 - i * 2), mid - 24 + i * 3); c.lineTo(fx + dir * (9 - i * 2 + 8), mid - 22 + i * 3); c.lineTo(fx + dir * (9 - i * 2 + 7), mid - 18 + i * 3); c.lineTo(fx + dir * (8 - i * 2), mid - 20 + i * 3); c.closePath(); c.fill(); });
  });
  rr(c, cx - 18, h - 5, 36, 4, 1); fillStroke(c, P.stone2, P.ink, 1);
  if (o.label) plaque(c, P, o.label, w / 2, top + 5.5, Math.min(w - 30, 110), 10);
}

/* ---------- tall objects: drawn sorted by their bottom edge, so people walk behind them ---------- */
/** how far above its footprint each kind of thing is drawn, in px (1 tile when missing) */
export const HEIGHT: Record<string, number> = { tower: T * 2.4, tomb: T * 1.9, house: T * 0.75, station: T * 0.75, circolo: T * 0.9, bar: T * 0.75, shop: T * 0.75, palazzo: T * 1.1,
  church: T * 2.15, octagon: T * 2.1, clocktower: T * 2.05, coni: T * 0.75, lido: T * 0.9, kiosk: T * 0.6, ferry: T * 0.75, cypress: T * 1.6,
  lifeguard: T * 1.4, ruins: T * 0.9, tunnel: T * 0.5, fountain: T * 0.5, car: T * 0.2, item: T * 0.4, pine: T * 1.4, condo: T * 1.75, pub: T * 0.75,
  arena: T * 0.9, train: T * 0.6, monument: T * 1.5, lighthouse: T * 1.6, gazebo: T * 0.6, board: T * 1.1, windsurf: T * 0.7, pedalo: T * 0.3,
  borgo: T * 0.75, villa: T * 0.5, cistern: T * 0.5, collegiata: T * 2.6, school: T * 1.6, parish: T * 2.3, aqueduct: T * 0.6, gelateria: T * 0.8, bakery: T * 0.75, pharmacy: T * 0.75, fishmonger: T * 0.75, bookshop: T * 0.75, newsstand: T * 0.4, market: T * 0.4,
  tobacconist: T * 0.75, winebar: T * 0.75, barber: T * 0.75, hospital: T * 2.4, hermitage: T * 2.3, grandstand: T * 0.6,
  /* the 12 November revision (cortina.ts): the palazzi have their own height, the Torre di Mola dominates Mola */
  cortina: T, castello: T * 5.2, swings: T * 0.7, slide: T * 0.5, streetPlate: T, anchor: T * 0.85, castlewall: T * 0.6, cannelle: T * 0.7, gozzo: T * 0.2, festoon: T * 2.2, buoy: T * 1.1, bottle: T * 0.2 };
export function paintObject(kind: string, P: Palette, s: number, opt?: ObjOpts): Sprite {
  opt = opt || {};
  var w = (opt.w || 1) * T, h = (opt.h || 1) * T, up = opt.up == null ? T : opt.up;
  var cv = mk(w * s, (h + up) * s), c = cv.getContext('2d')!;
  c.scale(s, s); c.translate(0, up); c.lineCap = 'round'; c.lineJoin = 'round';
  (OBJ[kind] || OBJ.box)(c, w, h, P, opt);
  return { cv: cv, w: w, h: h + up, up: up };
}
const OBJ: Record<string, ObjFn> = {
  cortina: cortina, castello: castello, anchor: anchor, castlewall: castlewall, cannelle: cannelle,
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
  /* a gozzo of Mola, moored along the quay: double-ended, painted, the wood inside, the thwarts, the outboard at the
     stern */
  gozzo: function (c, w, h, P, o) {
    var col = o.color || '#3f7ccf', cx = w / 2, hull = function (k: number) {
      c.beginPath(); c.moveTo(cx, -5 + k * 2); c.quadraticCurveTo(cx + 11 * k, 5, cx + 10.5 * k, 17); c.quadraticCurveTo(cx + 8.5 * k, 28 - k, cx, 31 - k * 3);
      c.quadraticCurveTo(cx - 8.5 * k, 28 - k, cx - 10.5 * k, 17); c.quadraticCurveTo(cx - 11 * k, 5, cx, -5 + k * 2); c.closePath();
    };
    c.strokeStyle = P.foam; c.lineWidth = 1.5; c.beginPath(); c.ellipse(cx, 22, 13, 9, 0, 0.2, Math.PI - 0.2); c.stroke();
    hull(1); fillStroke(c, col, P.ink, 1.6);
    c.save(); hull(1); c.clip(); c.fillStyle = col === '#ffffff' ? '#3f7ccf' : '#ffffff'; c.fillRect(0, 2, w, 2.4); c.restore();
    hull(0.64); fillStroke(c, P.wood, P.ink, 1.1);
    c.strokeStyle = P.wood2; c.lineWidth = 2.2;
    [7, 14, 21].forEach(function (y, i) { var hw = [4.6, 5.8, 4.8][i]; c.beginPath(); c.moveTo(cx - hw, y); c.lineTo(cx + hw, y); c.stroke(); });
    rr(c, cx - 3, 25, 6, 7, 1.5); fillStroke(c, '#30323a', P.ink, 1);
  },
  /* the lights strung across a lane, seen from the street: wires in a zigzag from the first floor of the palazzi on
     the far side (up top) to the roof edge of the ones on the near side (down here), each sagging a little, with
     their bulbs; the glass colour of the bulbs is what lights them at night */
  festoon: function (c, w, h, P, o) {
    var up = o.up == null ? T * 2.2 : o.up, far = -up + 6, near = h - 6, n = Math.round(w / T), k;
    var pts: [number, number][] = [];
    for (k = 0; k <= n; k++) pts.push([Math.min(w - 2, Math.max(2, k * T)), k % 2 ? near : far]);
    for (k = 0; k < n; k++) {
      var a = pts[k], b = pts[k + 1], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 + 11;
      c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.75;
      c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(mx, my, b[0], b[1]); c.stroke(); c.globalAlpha = 1;
      for (var t = 0.08; t < 0.96; t += 0.14) {
        var bx = (1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * mx + t * t * b[0], by = (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * my + t * t * b[1];
        c.fillStyle = '#30323a'; c.fillRect(bx - 0.8, by, 1.6, 1.6);
        circle(c, bx, by + 2.6, 1.9); c.fillStyle = '#e8f5ff'; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 0.5; c.stroke();
      }
    }
    /* the hooks in the walls */
    c.fillStyle = P.ink; pts.forEach(function (p) { c.fillRect(p[0] - 1, p[1] - 1, 2, 2); });
  },
  /* a buoy out at sea: a round float in its colour with a white band, a little mast with a flag, the foam around */
  buoy: function (c, w, h, P, o) {
    var col = o.color || '#ffffff', cx = w / 2, by = h - 9;
    c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, by + 4, 13, 4.5, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = P.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, by - 9); c.lineTo(cx, by - 30); c.stroke();
    poly(c, [[cx, by - 30], [cx + 11, by - 26.5], [cx, by - 23]]); fillStroke(c, col === '#ffffff' ? '#e9765f' : col, P.ink, 1.2);
    circle(c, cx, by - 2, 10); fillStroke(c, col, P.ink, 1.8);
    c.save(); circle(c, cx, by - 2, 10); c.clip(); c.fillStyle = col === '#ffffff' ? '#e9765f' : '#ffffff'; c.fillRect(cx - 11, by - 4, 22, 4); c.restore();
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.6; ell(c, cx - 4, by - 6, 3, 2); c.fill(); c.globalAlpha = 1;
  },
  /* a bottle adrift with a message inside, half under water */
  bottle: function (c, w, h, P) {
    var cx = w / 2, by = h - 8;
    c.strokeStyle = P.foam; c.lineWidth = 1.6; c.beginPath(); c.ellipse(cx, by + 2, 11, 3.4, 0, 0, Math.PI * 2); c.stroke();
    c.save(); c.translate(cx, by - 2); c.rotate(-0.35);
    rr(c, -9, -4, 14, 8, 3.5); fillStroke(c, '#7cc49a', P.ink, 1.4);
    rr(c, 4, -2, 6, 4, 1.5); fillStroke(c, '#7cc49a', P.ink, 1.2);
    rr(c, 9.5, -2.2, 2.6, 4.4, 1); fillStroke(c, P.wood, P.ink, 1);
    rr(c, -6, -2, 7, 4, 1); c.fillStyle = '#fff3d6'; c.fill();
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.6; c.fillRect(-7, -3, 9, 1.2); c.globalAlpha = 1;
    c.restore();
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
  /* a belvedere: a telescope on its post, the kind you put a coin in, by a bit of railing (VISIONE.md, V4) */
  viewer: function (c, w, h, P) {
    ell(c, 16, 29, 9, 2.6); c.fillStyle = P.shadow; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(3, 28); c.lineTo(3, 17); c.moveTo(29, 28); c.lineTo(29, 17); c.moveTo(2, 18); c.lineTo(30, 18); c.moveTo(2, 23); c.lineTo(30, 23); c.stroke();
    rr(c, 14, 6, 4, 23, 1.5); fillStroke(c, P.stone2, P.ink, 1.5);
    c.save(); c.translate(16, 3); c.rotate(-0.22);
    rr(c, -11, -5, 20, 10, 4); fillStroke(c, P['roof-b'], P.ink, 1.7);
    circle(c, 10, 0, 5.2); fillStroke(c, P['roof-b'], P.ink, 1.7);
    circle(c, 10, 0, 2.8); fillStroke(c, P.foam, P.ink, 1.2);
    rr(c, -13.5, -3, 4, 6, 1.5); fillStroke(c, P.ink, null);
    c.restore();
    circle(c, 16, 14, 2.4); fillStroke(c, P['roof-c'], P.ink, 1.2);
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
  /* a car parked nose-in in a bay of Largo Paone, seen from above: the bonnet, the windscreen, the roof, the rear window */
  car: function (c, w, h, P, o) {
    var col = o.color || '#e86a5c', x0 = w / 2 - 10, y0 = -3, cw = 20, ch = h + 1;
    ell(c, w / 2 + 2, h - 2, 12, 4); c.fillStyle = P.shadow; c.fill();
    c.fillStyle = '#20263a';
    [[x0 - 1.5, y0 + 5], [x0 + cw - 2.5, y0 + 5], [x0 - 1.5, y0 + ch - 11], [x0 + cw - 2.5, y0 + ch - 11]].forEach(function (p) { rr(c, p[0], p[1], 4, 7, 1.5); c.fill(); });
    rr(c, x0, y0, cw, ch, 6); fillStroke(c, col, P.ink, 1.6);
    rr(c, x0 + 2.5, y0 + 8, cw - 5, 6, 2); fillStroke(c, '#bfe3ff', P.ink, 1.1);
    rr(c, x0 + 3, y0 + 14, cw - 6, ch - 25, 3); c.fillStyle = col; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 0.9; c.stroke();
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.25; rr(c, x0 + 5, y0 + 15, 4, ch - 28, 2); c.fill(); c.globalAlpha = 1;
    rr(c, x0 + 3, y0 + ch - 11, cw - 6, 5, 2); fillStroke(c, '#bfe3ff', P.ink, 1);
    c.fillStyle = '#fff3a0'; rr(c, x0 + 2, y0 + 1.5, 4, 2.5, 1); c.fill(); rr(c, x0 + cw - 6, y0 + 1.5, 4, 2.5, 1); c.fill();
    c.fillStyle = '#e63946'; rr(c, x0 + 2, y0 + ch - 4, 4, 2.2, 1); c.fill(); rr(c, x0 + cw - 6, y0 + ch - 4, 4, 2.2, 1); c.fill();
  },
  /* Antonio's scooter, parked */
  scooter: function (c, w, h, P, o) {
    ell(c, 16, 28, 12, 3); c.fillStyle = P.shadow; c.fill();
    circle(c, 7, 24, 4.5); fillStroke(c, '#30323a', P.ink, 1.4); circle(c, 25, 24, 4.5); fillStroke(c, '#30323a', P.ink, 1.4);
    c.beginPath(); c.moveTo(5, 21); c.quadraticCurveTo(6, 12, 14, 13); c.lineTo(20, 13); c.quadraticCurveTo(28, 13, 28, 21); c.lineTo(22, 22); c.lineTo(10, 22); c.closePath();
    fillStroke(c, o.color || '#5b8fd9', P.ink, 1.5);
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
  /* a puff of the clouds that still cover the second cities beyond their stations */
  cloud: function (c, w, h, P) {
    blobs(c, [[4, 18, 11], [16, 12, 13], [28, 18, 11], [16, 22, 10]], '#f4f6fb', P.ink, 1.2);
    blobs(c, [[10, 14, 4], [20, 10, 3]], '#ffffff', null, 0);
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
  /* San Giovanni Battista at Mola as it is (Gustavo Giovannoni's design, finished by Giuseppe Zander in 1953): a plain
     front of brick under a pale cornice, a great arch with the door at its foot and the oculus in it, the bell tower
     of brick beside it */
  collegiata: function (c, w, h, P, o) {
    var dx = (o.doorX! - o.x!) * T, tw = 28, cx = dx + T / 2, hw = Math.min(48, (w - tw - 8) / 2);
    cx = Math.max(hw + 2, Math.min(w - hw - 2, cx));
    var fx = cx - hw, fw = hw * 2, ls = fx - 2, rs = w - 2 - (fx + fw);
    /* the bell tower on the narrower side when it fits there, the canonica on the other */
    var towerRight = rs >= tw + 2 && (rs <= ls || ls < tw + 2), bx = towerRight ? fx + fw + 1 : fx - tw - 1;
    var top = -T * 1.25, btop = -T * 2.35, brick = P['roof-a'], k;
    var cn = towerRight ? [2, fx - 1] : [fx + fw + 1, w - 2];
    ell(c, w / 2, h - 1, w / 2, 6); c.fillStyle = P.shadow; c.fill();
    var courses = function (x0: number, y0: number, ww: number, hh: number) {
      c.save(); c.beginPath(); c.rect(x0, y0, ww, hh); c.clip();
      c.strokeStyle = P.ink; c.globalAlpha = 0.16; c.lineWidth = 0.8;
      for (var yy = y0 + 5, r = 0; yy < y0 + hh; yy += 5, r++) {
        c.beginPath(); c.moveTo(x0, yy); c.lineTo(x0 + ww, yy); c.stroke();
        for (var xx = x0 + (r % 2 ? 4 : 10); xx < x0 + ww; xx += 12) { c.beginPath(); c.moveTo(xx, yy - 5); c.lineTo(xx, yy); c.stroke(); }
      }
      c.restore();
    };
    /* the bell tower: brick, a pale belfry with its openings, a low roof and the cross */
    rr(c, bx, btop + 16, tw, h - btop - 18, 2); fillStroke(c, brick, P.ink, 1.8); courses(bx + 1, btop + 34, tw - 2, h - btop - 38);
    rr(c, bx - 1.5, btop + 14, tw + 3, 22, 2); fillStroke(c, P.stone, P.ink, 1.5);
    for (k = 0; k < 2; k++) { var ox = bx + 6 + k * (tw / 2 - 2); c.beginPath(); c.moveTo(ox, btop + 33); c.lineTo(ox, btop + 24); c.arc(ox + 4.5, btop + 24, 4.5, Math.PI, 0); c.lineTo(ox + 9, btop + 33); c.closePath(); fillStroke(c, '#20263a', P.ink, 1.1); }
    poly(c, [[bx - 3, btop + 15], [bx + tw / 2, btop + 3], [bx + tw + 3, btop + 15]]); fillStroke(c, P['roof-a'], P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(bx + tw / 2, btop + 3); c.lineTo(bx + tw / 2, btop - 9); c.moveTo(bx + tw / 2 - 4, btop - 4); c.lineTo(bx + tw / 2 + 4, btop - 4); c.stroke();
    /* the canonica beside the church: white, two floors, the loggia of arches below, a tiled roof, plants */
    if (cn[1] - cn[0] >= 24) {
      var nx = cn[0], nw = cn[1] - cn[0], nt = -T * 0.45, ng = h - 30;
      rr(c, nx - 1, nt - 8, nw + 2, 11, 2); fillStroke(c, P['roof-a'], P.ink, 1.4);
      c.strokeStyle = P.ink; c.globalAlpha = 0.3; c.lineWidth = 0.9; for (k = nx + 4; k < nx + nw; k += 5) { c.beginPath(); c.moveTo(k, nt - 7); c.lineTo(k, nt + 2); c.stroke(); } c.globalAlpha = 1;
      rr(c, nx, nt, nw, h - nt - 2, 1.5); fillStroke(c, P.wall, P.ink, 1.7);
      var nwin = Math.max(1, Math.floor(nw / 22));
      for (k = 0; k < nwin * 2; k++) { var wy0 = k % 2 ? nt + 40 : nt + 9; if (wy0 + 16 < ng - 6) shuttered(c, P, nx + (Math.floor(k / 2) + 0.5) * nw / nwin - 5, wy0, 10, 13, P['shutter-a']); }
      rr(c, nx + 1, ng - 4, nw - 2, 3, 1); fillStroke(c, P.stone, P.ink, 0.9);
      var na = Math.max(1, Math.floor(nw / 18)), aw2 = nw / na;
      for (k = 0; k < na; k++) {
        var ax2 = nx + k * aw2 + 3, ww2 = aw2 - 6;
        c.beginPath(); c.moveTo(ax2, h - 3); c.lineTo(ax2, ng + ww2 / 2); c.arc(ax2 + ww2 / 2, ng + ww2 / 2, ww2 / 2, Math.PI, 0); c.lineTo(ax2 + ww2, h - 3); c.closePath(); fillStroke(c, '#5a5048', P.ink, 1.2);
      }
      blobs(c, [[nx + 6, h - 6, 4], [nx + nw - 6, h - 6, 4]], P.leaf, P.ink, 1);
    }
    /* the front */
    rr(c, fx, top, fw, h - top - 2, 2); fillStroke(c, brick, P.ink, 1.9); courses(fx + 1, top + 8, fw - 2, h - top - 12);
    /* pilasters at its edges, the low gable and its pale cornice */
    [fx + 1, fx + fw - 8].forEach(function (px) { rr(c, px, top + 2, 7, h - top - 6, 1); fillStroke(c, P.stone, P.ink, 1.1); });
    poly(c, [[fx - 3, top + 2], [cx, top - 14], [fx + fw + 3, top + 2]]); fillStroke(c, brick, P.ink, 1.6);
    c.strokeStyle = P.stone; c.lineWidth = 4; c.beginPath(); c.moveTo(fx - 2, top + 1); c.lineTo(cx, top - 14); c.lineTo(fx + fw + 2, top + 1); c.stroke();
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(fx - 4, top + 3); c.lineTo(cx, top - 17); c.lineTo(fx + fw + 4, top + 3); c.stroke();
    rr(c, fx - 3, top - 1, fw + 6, 6, 2); fillStroke(c, P.stone, P.ink, 1.4);
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(cx, top - 16); c.lineTo(cx, top - 29); c.moveTo(cx - 4.5, top - 24); c.lineTo(cx + 4.5, top - 24); c.stroke();
    /* the great arch, its frame of pale stone; in it the oculus and, at its foot, the door */
    var ar = Math.min(fw * 0.3, 34), ay = top + 14 + ar;
    c.beginPath(); c.moveTo(cx - ar, h - 2); c.lineTo(cx - ar, ay); c.arc(cx, ay, ar, Math.PI, 0); c.lineTo(cx + ar, h - 2); c.closePath(); fillStroke(c, P.stone, P.ink, 1.7);
    c.beginPath(); c.moveTo(cx - ar + 6, h - 2); c.lineTo(cx - ar + 6, ay); c.arc(cx, ay, ar - 6, Math.PI, 0); c.lineTo(cx + ar - 6, h - 2); c.closePath(); fillStroke(c, P['wall-d'], P.ink, 1.3);
    circle(c, cx, ay - 2, 9.5); fillStroke(c, '#bfe3ff', P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 0.9; for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(cx - Math.cos(k * Math.PI / 4) * 9.5, ay - 2 - Math.sin(k * Math.PI / 4) * 9.5); c.lineTo(cx + Math.cos(k * Math.PI / 4) * 9.5, ay - 2 + Math.sin(k * Math.PI / 4) * 9.5); c.stroke(); }
    rr(c, cx - 11, h - T + 2, 22, T - 4, 2); fillStroke(c, P.wood2, P.ink, 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, h - T + 2); c.lineTo(cx, h - 2); c.stroke();
    rr(c, cx - 14, h - T - 3, 28, 5, 1); fillStroke(c, P.stone, P.ink, 1.2);
    /* two narrow windows beside the arch, the steps */
    [-1, 1].forEach(function (sd) { var sx = cx + sd * (ar + (fw / 2 - ar) / 2) - 3.5; if (sx < fx + 4 || sx > fx + fw - 11) return; rr(c, sx, top + 26, 7, 22, 3.5); fillStroke(c, '#bfe3ff', P.ink, 1.2); });
    rr(c, cx - ar - 4, h - 4, ar * 2 + 8, 4, 1); fillStroke(c, P.stone2, P.ink, 1);
    if (o.label) plaque(c, P, o.label, fx + fw / 2, top + 4.5, fw - 20, 11);
  },
  /* the tobacconist of Largo Paone: the «T» of every tabaccheria on its sign, the window of the lottery, a rack of postcards */
  tobacconist: function (c, w, h, P, o) {
    building(c, w, h, P, o, { roof: P['roof-b'], windows: 0, wall: P['wall-b'], awning: '#3d5a80' });
    var dx = (o.doorX! - o.x!) * T, wx = dx > w / 2 ? 7 : dx + T + 2, ww = Math.max(22, (dx > w / 2 ? dx : w - 7) - wx - 3), wy = h - T + 3;
    rr(c, wx, wy, ww, T - 9, 2); fillStroke(c, '#bfe3ff', P.ink, 1.4);
    for (var k = 0; k * 9 + 8 < ww; k++) { rr(c, wx + 3 + k * 9, wy + 4 + (k % 2) * 7, 6, 5, 1); fillStroke(c, ['#ffd166', '#ff9a8b', '#fffdf6', '#9ec5ff'][k % 4], P.ink, 0.8); }
    var tx = dx > w / 2 ? w - 15 : 15, ty = T * 0.9 + 2;
    rr(c, tx - 8, ty - 9, 16, 19, 2); fillStroke(c, '#20263a', P.ink, 1.3);
    c.fillStyle = '#ffffff'; c.fillRect(tx - 5, ty - 5, 10, 3); c.fillRect(tx - 1.5, ty - 5, 3, 11);
  },
  /* the enoteca: dark wood, bottles in the window, a barrel by the door */
  winebar: function (c, w, h, P, o) {
    building(c, w, h, P, o, { roof: P['roof-a'], windows: 0, wall: P['wall-d'], door: P.wood2 });
    var dx = (o.doorX! - o.x!) * T, wx = dx > w / 2 ? 7 : dx + T + 2, ww = Math.max(22, (dx > w / 2 ? dx : w - 7) - wx - 3), wy = h - T + 3;
    rr(c, wx, wy, ww, T - 9, 2); fillStroke(c, P.wood2, P.ink, 1.4);
    rr(c, wx + 2.5, wy + 2.5, ww - 5, T - 14, 1.5); fillStroke(c, '#ffe2a8', P.ink, 1);
    for (var k = 0; k * 7 + 9 < ww; k++) {
      var bx0 = wx + 6 + k * 7, col = ['#5d2a3a', '#2f5a3a', '#5d2a3a', '#c9a23a'][k % 4];
      rr(c, bx0, wy + 9, 4, 10, 1.2); fillStroke(c, col, P.ink, 0.8); rr(c, bx0 + 1.1, wy + 5, 1.8, 5, 0.8); fillStroke(c, col, P.ink, 0.7);
    }
    var kx = dx > w / 2 ? dx - 9 : dx + T + ww + 1;
    if (kx > 4 && kx < w - 12) { ell(c, kx + 4, h - 7, 5, 6.5); fillStroke(c, P.wood, P.ink, 1.2); c.strokeStyle = P.ink; c.lineWidth = 0.9; [-3.5, 3.5].forEach(function (d) { c.beginPath(); c.moveTo(kx - 0.6, h - 7 + d); c.lineTo(kx + 8.6, h - 7 + d); c.stroke(); }); }
  },
  /* the barber: the striped pole turning by the door, the big window with the chair behind it */
  barber: function (c, w, h, P, o) {
    building(c, w, h, P, o, { roof: '#20263a', windows: 0, wall: P.wall, awning: '#e63946' });
    var dx = (o.doorX! - o.x!) * T, wx = dx > w / 2 ? 7 : dx + T + 2, ww = Math.max(22, (dx > w / 2 ? dx : w - 7) - wx - 3), wy = h - T + 3;
    rr(c, wx, wy, ww, T - 9, 2); fillStroke(c, '#bfe3ff', P.ink, 1.4);
    /* the chair, and a mirror on the wall behind it */
    var chx = wx + ww / 2;
    rr(c, chx - 9, wy + 3, 7, 9, 1.5); fillStroke(c, '#fffdf6', P.ink, 0.9);
    rr(c, chx - 1, wy + 8, 9, 7, 2); fillStroke(c, '#e63946', P.ink, 1); rr(c, chx + 5, wy + 3, 3, 8, 1.2); fillStroke(c, '#e63946', P.ink, 1);
    c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(chx + 3.5, wy + 15); c.lineTo(chx + 3.5, wy + 20); c.moveTo(chx, wy + 20); c.lineTo(chx + 7, wy + 20); c.stroke();
    /* the pole: red, white and blue */
    var px = dx > w / 2 ? dx - 5 : dx + T - 1, py = h - T + 1;
    c.save(); rr(c, px, py, 5, 20, 2.5); c.clip();
    c.fillStyle = '#ffffff'; c.fillRect(px, py, 5, 20);
    for (var k = -1; k < 6; k++) { c.fillStyle = k % 2 ? '#3d5a80' : '#e63946'; c.beginPath(); c.moveTo(px, py + k * 5); c.lineTo(px + 5, py + k * 5 - 3.5); c.lineTo(px + 5, py + k * 5 - 1); c.lineTo(px, py + k * 5 + 2.5); c.closePath(); c.fill(); }
    c.restore(); rr(c, px, py, 5, 20, 2.5); c.strokeStyle = P.ink; c.lineWidth = 1.1; c.stroke();
    circle(c, px + 2.5, py - 1.5, 2.6); fillStroke(c, P.chrome, P.ink, 1); circle(c, px + 2.5, py + 21.5, 2.6); fillStroke(c, P.chrome, P.ink, 1);
  },
  /* the Dono Svizzero, the hospital of via Appia: a long block of the seventies, its ground floor in brick, four
     white floors banded by ribbon windows and grey spandrels, the plant room and the red cross on the flat roof, the
     glass doors of the emergency room under a deep canopy, an ambulance waiting, the blue railing along the street */
  hospital: function (c, w, h, P, o) {
    var top = -T * 1.3, dx = (o.doorX! - o.x!) * T, cx = dx + T / 2, k, r, gt = h - T - 4, brick = P['roof-a'], n = Math.floor((gt - top - 4) / 24);
    ell(c, w / 2, h - 1, w / 2, 6); c.fillStyle = P.shadow; c.fill();
    /* the roof: the parapet, the plant room, the lift tower, the cross */
    rr(c, 3, top - 16, w - 6, 20, 2); fillStroke(c, P.stone, P.ink, 1.6);
    rr(c, 8, top - 13, w - 16, 14, 1.5); c.strokeStyle = P.stone2; c.lineWidth = 1.1; c.stroke();
    rr(c, 18, top - 24, 34, 18, 1.5); fillStroke(c, P.stone2, P.ink, 1.3);
    c.strokeStyle = P.ink; c.lineWidth = 0.8; c.globalAlpha = 0.5; for (k = 0; k < 5; k++) { c.beginPath(); c.moveTo(22 + k * 6, top - 21); c.lineTo(22 + k * 6, top - 9); c.stroke(); } c.globalAlpha = 1;
    rr(c, w - 40, top - 30, 24, 26, 3); fillStroke(c, '#ffffff', P.ink, 1.4);
    c.fillStyle = '#e63946'; c.fillRect(w - 30.5, top - 27, 5, 20); c.fillRect(w - 38, top - 19.5, 20, 5);
    /* the block */
    rr(c, 3, top, w - 6, h - top - 2, 2); fillStroke(c, P.wall, P.ink, 1.9);
    for (r = 0; r < n; r++) {
      var wy = gt - (n - r) * 24 + 3;
      c.fillStyle = P.stone2; c.fillRect(4, wy + 15, w - 8, 7); c.strokeStyle = P.ink; c.lineWidth = 0.6; c.globalAlpha = 0.4; c.strokeRect(4, wy + 15, w - 8, 7); c.globalAlpha = 1;
      rr(c, 8, wy, w - 16, 14, 1.5); fillStroke(c, '#bfe3ff', P.ink, 1.2);
      c.strokeStyle = P.ink; c.lineWidth = 0.8;
      for (k = 8 + 11; k < w - 8; k += 11) { c.beginPath(); c.moveTo(k, wy); c.lineTo(k, wy + 14); c.stroke(); }
      /* blinds half down here and there */
      for (k = 0; 8 + k * 11 < w - 19; k++) if (hash(k, r, 340) < 0.3) { c.fillStyle = '#e9e1cf'; c.fillRect(9 + k * 11, wy + 1, 10, 4 + hash(k, r, 341) * 6); }
    }
    /* the brick ground floor, with its windows and the stair of the entrance */
    rr(c, 3, gt, w - 6, h - gt - 2, 1.5); fillStroke(c, brick, P.ink, 1.6);
    c.save(); c.beginPath(); c.rect(4, gt + 1, w - 8, h - gt - 4); c.clip();
    c.strokeStyle = P.ink; c.globalAlpha = 0.15; c.lineWidth = 0.8;
    for (var yy = gt + 5, rw = 0; yy < h - 2; yy += 5, rw++) { c.beginPath(); c.moveTo(4, yy); c.lineTo(w - 4, yy); c.stroke(); for (var xx = 4 + (rw % 2 ? 4 : 10); xx < w; xx += 12) { c.beginPath(); c.moveTo(xx, yy - 5); c.lineTo(xx, yy); c.stroke(); } }
    c.restore(); c.globalAlpha = 1;
    for (k = 12; k + 14 < w - 8; k += 24) { if (Math.abs(k + 7 - cx) < 30) continue; rr(c, k, gt + 7, 14, 14, 1); fillStroke(c, '#bfe3ff', P.ink, 1.1); }
    /* the entrance of the emergency room: glass doors, the deep canopy on its pillars, the sign */
    rr(c, cx - 17, gt + 6, 34, h - gt - 8, 2); fillStroke(c, '#e8f5ff', P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, gt + 6); c.lineTo(cx, h - 2); c.stroke();
    [cx - 25, cx + 22].forEach(function (px) { rr(c, px, gt + 2, 3.5, h - gt - 4, 1); fillStroke(c, P.stone, P.ink, 1); });
    rr(c, cx - 30, gt - 5, 60, 9, 2); fillStroke(c, '#ffffff', P.ink, 1.5);
    c.fillStyle = '#e63946'; c.fillRect(cx - 29, gt + 1, 58, 2.5);
    rr(c, cx - 22, gt - 16, 44, 10, 2); fillStroke(c, '#e63946', P.ink, 1.2);
    c.fillStyle = '#ffffff'; c.fillRect(cx - 18, gt - 12.5, 7, 3); c.fillRect(cx - 16, gt - 14.5, 3, 7);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(cx - 7, gt - 11); c.lineTo(cx + 18, gt - 11); c.stroke();
    /* an ambulance waiting by the door */
    var ax = cx + 30 + 46 < w - 4 ? cx + 30 : cx - 30 - 44;
    if (ax > 4) {
      rr(c, ax, h - 22, 44, 18, 3); fillStroke(c, '#ffffff', P.ink, 1.4);
      rr(c, ax + 30, h - 20, 12, 8, 2); fillStroke(c, '#bfe3ff', P.ink, 1);
      c.fillStyle = '#ff8a3c'; c.fillRect(ax + 1, h - 12, 42, 3);
      c.fillStyle = '#e63946'; c.fillRect(ax + 12, h - 19, 3, 8); c.fillRect(ax + 9.5, h - 16.5, 8, 3);
      rr(c, ax + 18, h - 25, 8, 3, 1); fillStroke(c, '#3f7ccf', P.ink, 0.8);
      c.fillStyle = '#20263a'; circle(c, ax + 9, h - 3.5, 3.4); c.fill(); circle(c, ax + 35, h - 3.5, 3.4); c.fill();
    }
    /* the blue railing along the street */
    c.strokeStyle = '#3f7ccf'; c.lineWidth = 1.6;
    [[4, cx - 34], [cx + 34, ax > cx ? ax - 4 : w - 4]].forEach(function (seg) {
      if (seg[1] - seg[0] < 10) return;
      c.beginPath(); c.moveTo(seg[0], h - 9); c.lineTo(seg[1], h - 9); c.stroke();
      for (var px = seg[0] + 2; px < seg[1]; px += 5) { c.beginPath(); c.moveTo(px, h - 9); c.lineTo(px, h - 3); c.stroke(); }
    });
    if (o.label) plaque(c, P, o.label, w / 2 - 14, top + 1, Math.min(w - 70, 150), 12);
  },
  /* the hermitage of San Michele Arcangelo: a front of pale stone built into a hollow of the mountain, in the
     neo-Gothic of 1895: the pointed door, the rose window over it, a little bell gable; the rock closes over it */
  hermitage: function (c, w, h, P) {
    var cx = w / 2, top = -T * 1.2, fw = w * 0.5, fx = cx - fw / 2, k;
    ell(c, cx, h - 1, w / 2 - 4, 5); c.fillStyle = P.shadow; c.fill();
    /* the rock around and above it */
    c.beginPath(); c.moveTo(0, h - 2); c.lineTo(2, top + 26); c.quadraticCurveTo(8, top - 6, 30, top - 16); c.quadraticCurveTo(cx - 10, top - 34, cx + 14, top - 26);
    c.quadraticCurveTo(w - 18, top - 22, w - 6, top + 6); c.lineTo(w, h - 2); c.closePath(); fillStroke(c, P.rock, P.ink, 1.9);
    c.strokeStyle = P.rock2; c.lineWidth = 1.3;
    [[8, top + 30, 22, top + 12], [w - 24, top + 4, w - 10, top + 30], [26, top - 10, 44, top - 20], [cx + 18, top - 20, w - 30, top - 12], [6, h - 22, 16, h - 34], [w - 16, h - 30, w - 7, h - 16]].forEach(function (q) { c.beginPath(); c.moveTo(q[0], q[1]); c.lineTo(q[2], q[3]); c.stroke(); });
    /* the hollow, dark, and the two low wings of the pilgrims' rooms */
    c.beginPath(); c.moveTo(fx - 16, h - 2); c.lineTo(fx - 16, top + 22); c.quadraticCurveTo(cx, top - 16, fx + fw + 16, top + 22); c.lineTo(fx + fw + 16, h - 2); c.closePath(); c.fillStyle = P.ink; c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1;
    [fx - 15, fx + fw + 1].forEach(function (x) { rr(c, x, h - 34, 14, 32, 1.5); fillStroke(c, P.stone2, P.ink, 1.3); rr(c, x + 4, h - 26, 6, 8, 1); fillStroke(c, '#20263a', P.ink, 0.9); });
    /* the front: a gable, the rose window, the pointed door */
    c.beginPath(); c.moveTo(fx, h - 2); c.lineTo(fx, top + 22); c.lineTo(cx, top); c.lineTo(fx + fw, top + 22); c.lineTo(fx + fw, h - 2); c.closePath(); fillStroke(c, P.stone, P.ink, 1.8);
    c.strokeStyle = P.stone2; c.lineWidth = 0.9; for (k = 0; k < 5; k++) { c.beginPath(); c.moveTo(fx + 2, top + 30 + k * 11); c.lineTo(fx + fw - 2, top + 30 + k * 11); c.stroke(); }
    circle(c, cx, top + 30, 8.5); fillStroke(c, '#bfe3ff', P.ink, 1.5);
    c.strokeStyle = P.ink; c.lineWidth = 0.8; for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(cx - Math.cos(k * Math.PI / 4) * 8.5, top + 30 - Math.sin(k * Math.PI / 4) * 8.5); c.lineTo(cx + Math.cos(k * Math.PI / 4) * 8.5, top + 30 + Math.sin(k * Math.PI / 4) * 8.5); c.stroke(); }
    circle(c, cx, top + 30, 2.6); fillStroke(c, P.stone, P.ink, 0.8);
    c.beginPath(); c.moveTo(cx - 9, h - 2); c.lineTo(cx - 9, h - 20); c.quadraticCurveTo(cx - 9, h - 31, cx, h - 36); c.quadraticCurveTo(cx + 9, h - 31, cx + 9, h - 20); c.lineTo(cx + 9, h - 2); c.closePath(); fillStroke(c, P.wood2, P.ink, 1.6);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(cx, h - 35); c.lineTo(cx, h - 2); c.stroke();
    /* the bell gable and the cross */
    rr(c, cx - 5, top - 11, 10, 12, 1.5); fillStroke(c, P.stone, P.ink, 1.3); rr(c, cx - 2.2, top - 8, 4.4, 6, 2); fillStroke(c, '#20263a', P.ink, 0.8);
    c.strokeStyle = P.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx, top - 11); c.lineTo(cx, top - 20); c.moveTo(cx - 3.5, top - 16.5); c.lineTo(cx + 3.5, top - 16.5); c.stroke();
  },
  /* the stand of the Zauli, along the home straight: rows of seats climbing away from the track, a roof over them */
  grandstand: function (c, w, h, P) {
    var k, rows = 5, rw = (w - 8) / rows;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 2, -T * 0.25, w - 4, h + T * 0.25 - 2, 3); fillStroke(c, P.stone, P.ink, 1.8);
    for (k = 0; k < rows; k++) {
      var x = w - 4 - (k + 1) * rw;
      c.fillStyle = k % 2 ? P['roof-b'] : P['roof-d']; c.fillRect(x, -T * 0.25 + 6 + k * 2, rw - 1.5, h + T * 0.25 - 12 - k * 2);
      c.strokeStyle = P.ink; c.lineWidth = 0.8; c.globalAlpha = 0.45;
      for (var y = 4; y < h - 8; y += 9) { c.beginPath(); c.moveTo(x, y); c.lineTo(x + rw - 1.5, y); c.stroke(); }
      c.globalAlpha = 1;
    }
    /* the roof, on its posts, over the back rows */
    rr(c, -1, -T * 0.6, w * 0.62, h + T * 0.45, 3); c.fillStyle = P.wall; c.globalAlpha = 0.88; c.fill(); c.globalAlpha = 1; c.strokeStyle = P.ink; c.lineWidth = 1.6; c.stroke();
    c.strokeStyle = P.stone2; c.lineWidth = 1; for (k = 1; k < 6; k++) { c.beginPath(); c.moveTo(1, -T * 0.6 + k * (h + T * 0.45) / 6); c.lineTo(w * 0.62 - 2, -T * 0.6 + k * (h + T * 0.45) / 6); c.stroke(); }
  },
  /* a school of the sixties: two floors of ribbon windows, the entrance under a canopy, the flags */
  school: function (c, w, h, P, o) {
    if (o.look === 'deamicis') { oldSchool(c, w, h, P, o); return; }
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
  /* the plate at the corner of a friend's street, with the name of the street written on it, big enough to read on
     the map: white marble, a dark frame, black capitals, on its pole. Three tiles wide, the pole in the middle one */
  streetPlate: function (c, w, h, P, o) {
    var txt = (o.label || '').toUpperCase(), cx = w / 2;
    ell(c, cx, 29, 6, 2); c.fillStyle = P.shadow; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 2.8; c.beginPath(); c.moveTo(cx, 29); c.lineTo(cx, 2); c.stroke();
    c.strokeStyle = '#9aa1b8'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 0.6, 27); c.lineTo(cx - 0.6, 4); c.stroke();
    c.font = 'bold 8.5px Georgia, "Times New Roman", serif';
    var tw = Math.min(w - 4, c.measureText(txt).width + 14), y0 = -16;
    rr(c, cx - tw / 2 + 1.5, y0 + 2, tw, 17, 2.5); c.fillStyle = 'rgba(28,35,64,.25)'; c.fill();
    rr(c, cx - tw / 2, y0, tw, 17, 2.5); fillStroke(c, '#fbfbf7', P.ink, 1.6);
    rr(c, cx - tw / 2 + 2.5, y0 + 2.5, tw - 5, 12, 1.2); c.strokeStyle = P.ink; c.lineWidth = 0.8; c.stroke();
    c.fillStyle = '#1b1f2e'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, cx, y0 + 9, tw - 9);
  },
  /* a swing set of a little park: a metal A at each end, the bar, two seats on chains */
  swings: function (c, w, h, P) {
    ell(c, w / 2, h - 2, w / 2 - 4, 4); c.fillStyle = P.shadow; c.fill();
    var frame = '#e2574c', top = -12;
    c.strokeStyle = P.ink; c.lineWidth = 4.2;
    [[6, 14], [w - 6, w - 14]].forEach(function (x) { c.beginPath(); c.moveTo(x[0], h - 2); c.lineTo((x[0] + x[1]) / 2, top); c.lineTo(x[1], h - 2); c.stroke(); });
    c.beginPath(); c.moveTo(10, top); c.lineTo(w - 10, top); c.stroke();
    c.strokeStyle = frame; c.lineWidth = 2.4;
    [[6, 14], [w - 6, w - 14]].forEach(function (x) { c.beginPath(); c.moveTo(x[0], h - 2); c.lineTo((x[0] + x[1]) / 2, top); c.lineTo(x[1], h - 2); c.stroke(); });
    c.beginPath(); c.moveTo(10, top); c.lineTo(w - 10, top); c.stroke();
    [w * 0.34, w * 0.66].forEach(function (x, k) {
      var sy = h - 12 + k * 2;
      c.strokeStyle = '#7d838c'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x - 5, top + 1); c.lineTo(x - 5, sy); c.moveTo(x + 5, top + 1); c.lineTo(x + 5, sy); c.stroke();
      rr(c, x - 7, sy - 1, 14, 4, 1.5); fillStroke(c, k ? '#ffd166' : '#5ab0ff', P.ink, 1.2);
    });
  },
  /* a little slide: the ladder at the back, the chute coming down toward you */
  slide: function (c, w, h, P) {
    ell(c, w / 2, h - 2, w / 2 - 2, 3.5); c.fillStyle = P.shadow; c.fill();
    c.strokeStyle = P.ink; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(9, -10); c.lineTo(9, h - 10); c.moveTo(23, -10); c.lineTo(23, h - 10); c.stroke();
    c.strokeStyle = '#7d838c'; c.lineWidth = 1.2;
    for (var y = -6; y < h - 12; y += 6) { c.beginPath(); c.moveTo(9, y); c.lineTo(23, y); c.stroke(); }
    c.beginPath(); c.moveTo(7, -10); c.lineTo(25, -10); c.lineTo(28, h - 4); c.lineTo(4, h - 4); c.closePath(); fillStroke(c, '#57c968', P.ink, 1.6);
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.4; c.globalAlpha = 0.6; c.beginPath(); c.moveTo(11, -6); c.lineTo(9, h - 8); c.stroke(); c.globalAlpha = 1;
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
