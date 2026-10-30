import type { Ground, GroundObject } from '../../data/maps/types';
import type { Palette } from './palette';
import { T, mk, rr, hash, fillStroke, circle, ell, poly, blobs, type Ctx } from './draw';

/** what the ground painter needs of a map (the story mode prepares it) */
export interface GroundMap { w: number; h: number; cell(x: number, y: number): Ground; groundObjects?: GroundObject[] }
/** a piece of the map, in tiles */
export interface Rect { x: number; y: number; w: number; h: number }
type DecoFn = (c: Ctx, X: number, Y: number, P: Palette, x: number, y: number, map: GroundMap) => void;
/** each kind of ground object has the fields it draws */
type Placed = GroundObject & { w: number; h: number; text: string };
type GroundObjFn = (c: Ctx, o: Placed, P: Palette) => void;

/* ---------- ground: what each map character is made of (see data/maps/legend.ts) ---------- */
/** kinds of ground that get no outline between them */
const GROUP: Record<string, string> = { grass: 'g', path: 'p', road: 'r', sand: 's', sea: 'w', pier: 'd', stone: 'st', steps: 'st', clay: 'c', floor: 'f', wall: 'x', rail: 'rl',
  hill: 'h', paving: 'pv', mura: 'mu', far: 'fr' };

function groundFill(P: Palette, g: string): string {
  return ({ grass: P.grass, path: P.path, road: P.road, sand: P.sand, sea: P.sea, pier: P.wood, stone: P.stone, steps: P.stone, clay: P.clay, floor: P.wood,
    wall: P.wall, rail: P.path2, hill: P.hill, paving: P.stone, mura: P.rock, far: P.far } as Record<string, string>)[g] || P.paper;
}

/* one tile of ground with its texture */
function tile(c: Ctx, map: GroundMap, P: Palette, x: number, y: number) {
  var L = map.cell(x, y), X = x * T, Y = y * T, r = hash(x, y, 1), k;
  c.fillStyle = groundFill(P, L.g); c.fillRect(X, Y, T, T);
  if (L.g === 'grass') {
    c.strokeStyle = P.grass2; c.lineWidth = 1.4;
    for (k = 0; k < 3; k++) {
      var gx = X + 5 + hash(x, y, 10 + k) * 22, gy = Y + 8 + hash(x, y, 20 + k) * 18;
      c.beginPath(); c.moveTo(gx - 3, gy + 2); c.lineTo(gx - 1, gy - 2); c.moveTo(gx, gy + 2); c.lineTo(gx + 1, gy - 3); c.moveTo(gx + 3, gy + 2); c.lineTo(gx + 3.5, gy - 1.5); c.stroke();
    }
  } else if (L.g === 'path') {
    c.strokeStyle = P.path2; c.lineWidth = 1.2;
    for (k = 0; k < 3; k++) { var px = X + 4 + hash(x, y, 30 + k) * 22, py = Y + 4 + hash(x, y, 40 + k) * 22; rr(c, px, py, 6 + r * 3, 4 + r * 2, 2); c.stroke(); }
  } else if (L.g === 'road') {
    c.strokeStyle = P.road2; c.lineWidth = 1;
    c.beginPath(); c.moveTo(X + 4 + r * 10, Y + 9); c.lineTo(X + 9 + r * 10, Y + 9); c.moveTo(X + 16, Y + 22 + r * 4); c.lineTo(X + 23, Y + 22 + r * 4); c.stroke();
    /* a level crossing: the railway on both sides of the street, a few tiles away at most */
    var track = function (dx: number, dy: number) {
      for (var s = 1; s <= 3; s++) {
        var q = x + dx * s, u = y + dy * s;
        if (q < 0 || u < 0 || q >= map.w || u >= map.h) return false;
        var g = map.cell(q, u).g;
        if (g === 'rail') return true;
        if (g !== 'road') return false;
      }
      return false;
    };
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
    if (track(-1, 0) && track(1, 0)) { c.moveTo(X, Y + 11); c.lineTo(X + T, Y + 11); c.moveTo(X, Y + 21); c.lineTo(X + T, Y + 21); }
    if (track(0, -1) && track(0, 1)) { c.moveTo(X + 11, Y); c.lineTo(X + 11, Y + T); c.moveTo(X + 21, Y); c.lineTo(X + 21, Y + T); }
    c.stroke();
  } else if (L.g === 'sand') {
    c.fillStyle = P.sand2;
    for (k = 0; k < 6; k++) { circle(c, X + 3 + hash(x, y, 50 + k) * 26, Y + 3 + hash(x, y, 60 + k) * 26, 0.9); c.fill(); }
  } else if (L.g === 'stone') {
    c.strokeStyle = P.stone2; c.lineWidth = 1;
    c.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
    c.beginPath(); c.moveTo(X + 16, Y); c.lineTo(X + 16, Y + 16); c.moveTo(X, Y + 16); c.lineTo(X + T, Y + 16); c.stroke();
  } else if (L.g === 'pier' || L.g === 'floor') {
    c.strokeStyle = P.wood2; c.lineWidth = 1.2;
    for (k = 1; k < 4; k++) { c.beginPath(); c.moveTo(X, Y + k * 8); c.lineTo(X + T, Y + k * 8); c.stroke(); }
    c.beginPath(); c.moveTo(X + 6 + r * 18, Y + 8); c.lineTo(X + 6 + r * 18, Y + 16); c.moveTo(X + 20 - r * 12, Y + 16); c.lineTo(X + 20 - r * 12, Y + 24); c.stroke();
  } else if (L.g === 'wall') {
    c.fillStyle = P.stone; c.fillRect(X, Y + T - 8, T, 8);
    c.strokeStyle = P.stone2; c.lineWidth = 1;
    c.beginPath(); c.moveTo(X, Y + T - 8); c.lineTo(X + T, Y + T - 8); c.stroke();
  } else if (L.g === 'rail') {
    c.fillStyle = P.path; c.fillRect(X, Y, T, T);
    /* the track runs towards the rail next to it: along the row, down the column, or round a corner */
    var rl = function (dx: number, dy: number) { return x + dx >= 0 && y + dy >= 0 && x + dx < map.w && y + dy < map.h && map.cell(x + dx, y + dy).g === 'rail'; };
    var we = rl(-1, 0) || rl(1, 0), ns = rl(0, -1) || rl(0, 1);
    if (!we && !ns) we = true;
    /* half a track from the middle of the tile to one side: sleepers across, two rails along */
    var half = function (dx: number, dy: number) {
      var cx = X + T / 2, cy = Y + T / 2;
      c.strokeStyle = P.wood2; c.lineWidth = 3;
      for (var s = 0; s < 2; s++) {
        var o = 4 + s * 8;
        c.beginPath();
        if (dy === 0) { c.moveTo(cx + dx * o, Y + 6); c.lineTo(cx + dx * o, Y + 26); } else { c.moveTo(X + 6, cy + dy * o); c.lineTo(X + 26, cy + dy * o); }
        c.stroke();
      }
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
      if (dy === 0) { c.moveTo(cx - (dx < 0 ? 0 : 5), Y + 11); c.lineTo(dx < 0 ? X : X + T, Y + 11); c.moveTo(cx - (dx < 0 ? 0 : 5), Y + 21); c.lineTo(dx < 0 ? X : X + T, Y + 21); }
      else { c.moveTo(X + 11, cy - (dy < 0 ? 0 : 5)); c.lineTo(X + 11, dy < 0 ? Y : Y + T); c.moveTo(X + 21, cy - (dy < 0 ? 0 : 5)); c.lineTo(X + 21, dy < 0 ? Y : Y + T); }
      c.stroke();
    };
    /* a straight run goes right across, even where a road or a tunnel cuts it off on one side */
    if (we && !ns) { half(-1, 0); half(1, 0); }
    else if (ns && !we) { half(0, -1); half(0, 1); }
    else { if (rl(-1, 0)) half(-1, 0); if (rl(1, 0)) half(1, 0); if (rl(0, -1)) half(0, -1); if (rl(0, 1)) half(0, 1); }
  } else if (L.g === 'sea') {
    c.fillStyle = P.sea2;
    if (r < 0.5) { ell(c, X + 8 + r * 16, Y + 20, 7, 1.6); c.fill(); }
  } else if (L.g === 'clay') {
    c.fillStyle = P.sand2;
    for (k = 0; k < 4; k++) { circle(c, X + 3 + hash(x, y, 70 + k) * 26, Y + 3 + hash(x, y, 80 + k) * 26, 0.7); c.fill(); }
  } else if (L.g === 'hill') {
    /* little "∧" marks, as a mountain is drawn on a hand-made map */
    c.strokeStyle = P.hill2; c.lineWidth = 1.4;
    for (k = 0; k < 2; k++) {
      var hx = X + 7 + hash(x, y, 110 + k) * 18, hy = Y + 9 + hash(x, y, 120 + k) * 15;
      c.beginPath(); c.moveTo(hx - 5, hy + 3); c.lineTo(hx, hy - 3); c.lineTo(hx + 5, hy + 3); c.stroke();
    }
    if (r < 0.2) { ell(c, X + 8 + r * 70, Y + 24, 3.6, 2.4); fillStroke(c, P.rock, P.ink, 1.1); }
  } else if (L.g === 'steps') {
    c.fillStyle = P.shadow;
    for (k = 1; k < 4; k++) c.fillRect(X + 1, Y + k * 8, T - 2, 2.5);
    c.strokeStyle = P.stone2; c.lineWidth = 1.2;
    for (k = 1; k < 4; k++) { c.beginPath(); c.moveTo(X + 1, Y + k * 8); c.lineTo(X + T - 1, Y + k * 8); c.stroke(); }
  } else if (L.g === 'paving') {
    /* sampietrini: rows of small square cobbles */
    c.strokeStyle = P.stone2; c.lineWidth = 0.9;
    for (var ry = 0; ry < 4; ry++) for (var rx = 0; rx < 5; rx++) c.strokeRect(X + rx * 8 - (ry % 2) * 4 + 1, Y + ry * 8 + 1, 6, 6);
  } else if (L.g === 'mura') {
    /* polygonal blocks, like the walls of ancient Formia */
    var j = function (a: number) { return (hash(x, y, a) - 0.5) * 6; };
    var m1 = [X + 15 + j(1), Y + 1], m2 = [X + 13 + j(2), Y + 15 + j(3)], m3 = [X + T - 1, Y + 17 + j(4)], m4 = [X + 18 + j(5), Y + T - 1];
    c.strokeStyle = P.rock2; c.lineWidth = 1.3;
    [[[X + 1, Y + 2], m1, m2, [X + 1, Y + 13]], [m1, [X + T - 1, Y + 3], m3, m2], [[X + 1, Y + 13], m2, m4, [X + 1, Y + T - 1]], [m2, m3, [X + T - 1, Y + T - 1], m4]]
      .forEach(function (pts) { poly(c, pts); c.stroke(); });
  }
  /* the squared paper shows through */
  c.strokeStyle = P.grid; c.lineWidth = 0.6; c.globalAlpha = 0.5;
  c.strokeRect(X + 0.3, Y + 0.3, T - 0.6, T - 0.6);
  c.globalAlpha = 1;
}

/* paints the static ground of a map, or of the part of it in rect (in tiles): ground, borders, low decorations.
   Tiles one step outside rect are painted too, so strokes that cross the edge of a piece match its neighbour. */
export function paintGround(map: GroundMap, P: Palette, s: number, rect?: Rect): HTMLCanvasElement {
  var R = rect || { x: 0, y: 0, w: map.w, h: map.h };
  var cv = mk(R.w * T * s, R.h * T * s), c = cv.getContext('2d')!;
  c.scale(s, s); c.translate(-R.x * T, -R.y * T);
  c.lineCap = 'round'; c.lineJoin = 'round';
  c.fillStyle = P.paper; c.fillRect(R.x * T, R.y * T, R.w * T, R.h * T);
  var x0 = Math.max(0, R.x - 1), y0 = Math.max(0, R.y - 1), x1 = Math.min(map.w - 1, R.x + R.w), y1 = Math.min(map.h - 1, R.y + R.h), x, y, L;
  for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) tile(c, map, P, x, y);
  /* ballpoint outline wherever two kinds of ground meet (softer around faraway land) */
  c.lineWidth = 1.8;
  for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
    var here = map.cell(x, y).g, g = GROUP[here], X2 = x * T, Y2 = y * T;
    if (x + 1 < map.w) {
      var right = map.cell(x + 1, y).g;
      if (GROUP[right] !== g) { c.strokeStyle = here === 'far' || right === 'far' ? P.far2 : P.ink; c.beginPath(); c.moveTo(X2 + T, Y2); c.lineTo(X2 + T, Y2 + T); c.stroke(); }
    }
    if (y + 1 < map.h) {
      var below = map.cell(x, y + 1).g;
      if (GROUP[below] !== g) {
        c.strokeStyle = here === 'far' || below === 'far' ? P.far2 : P.ink;
        c.beginPath(); c.moveTo(X2, Y2 + T); c.lineTo(X2 + T, Y2 + T); c.stroke();
        if (g === 's' && GROUP[below] === 'w') { /* foam on the shoreline */
          c.strokeStyle = P.foam; c.lineWidth = 2.4;
          c.beginPath(); c.moveTo(X2 + 2, Y2 + T + 4); c.quadraticCurveTo(X2 + 10, Y2 + T + 1, X2 + 16, Y2 + T + 4); c.quadraticCurveTo(X2 + 24, Y2 + T + 7, X2 + 30, Y2 + T + 4); c.stroke();
          c.lineWidth = 1.8;
        }
      }
    }
  }
  /* low decorations, drawn flat into the ground */
  for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
    L = map.cell(x, y);
    if (L.deco) DECO[L.deco](c, x * T, y * T, P, x, y, map);
  }
  (map.groundObjects || []).forEach(function (o) {
    if (!GROUND_OBJ[o.kind]) return;
    if (o.w && o.h && (o.x > R.x + R.w + 1 || o.x + o.w < R.x - 1 || o.y > R.y + R.h + 1 || o.y + o.h < R.y - 1)) return;
    c.save(); GROUND_OBJ[o.kind](c, o as Placed, P); c.restore();
  });
  return cv;
}

const DECO: Record<string, DecoFn> = {
  flowers: function (c, X, Y, P, x, y) {
    for (var k = 0; k < 3; k++) {
      var fx = X + 6 + hash(x, y, 90 + k) * 20, fy = Y + 6 + hash(x, y, 95 + k) * 20, col = k % 2 ? P['flower-a'] : P['flower-b'];
      for (var a = 0; a < 5; a++) { circle(c, fx + Math.cos(a * 1.256) * 2.4, fy + Math.sin(a * 1.256) * 2.4, 1.7); c.fillStyle = col; c.fill(); }
      circle(c, fx, fy, 1.2); c.fillStyle = '#fff3a0'; c.fill();
    }
  },
  hedge: function (c, X, Y, P) {
    rr(c, X + 1, Y + 3, T - 2, T - 5, 9); fillStroke(c, P.hedge, P.ink, 1.6);
    c.fillStyle = P.leaf2;
    for (var k = 0; k < 3; k++) { circle(c, X + 8 + k * 8, Y + 12 + (k % 2) * 6, 2.6); c.fill(); }
  },
  bench: function (c, X, Y, P) {
    rr(c, X + 3, Y + 10, T - 6, 8, 2); fillStroke(c, P.wood, P.ink, 1.6);
    rr(c, X + 3, Y + 20, T - 6, 4, 1.5); fillStroke(c, P.wood2, P.ink, 1.4);
    c.strokeStyle = P.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(X + 6, Y + 24); c.lineTo(X + 6, Y + 29); c.moveTo(X + T - 6, Y + 24); c.lineTo(X + T - 6, Y + 29); c.stroke();
  },
  railing: function (c, X, Y, P) {
    c.strokeStyle = P.ink; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(X, Y + 12); c.lineTo(X + T, Y + 12); c.moveTo(X, Y + 20); c.lineTo(X + T, Y + 20); c.stroke();
    c.lineWidth = 2.4;
    c.beginPath(); c.moveTo(X + 6, Y + 8); c.lineTo(X + 6, Y + 24); c.moveTo(X + 22, Y + 8); c.lineTo(X + 22, Y + 24); c.stroke();
  },
  stage: function (c, X, Y, P) {
    c.fillStyle = P.wood; c.fillRect(X, Y + 4, T, T - 4);
    c.strokeStyle = P.wood2; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(X, Y + 14); c.lineTo(X + T, Y + 14); c.moveTo(X, Y + 22); c.lineTo(X + T, Y + 22); c.stroke();
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(X, Y + 4); c.lineTo(X + T, Y + 4); c.moveTo(X, Y + T); c.lineTo(X + T, Y + T); c.stroke();
  },
  net: function (c, X, Y, P) {
    c.fillStyle = 'rgba(28,35,64,.18)'; c.fillRect(X, Y + 14, T, 4);
    c.strokeStyle = P.ink; c.lineWidth = 1;
    for (var k = 0; k <= T; k += 4) { c.beginPath(); c.moveTo(X + k, Y + 6); c.lineTo(X + k, Y + 16); c.stroke(); }
    c.beginPath(); c.moveTo(X, Y + 11); c.lineTo(X + T, Y + 11); c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(X, Y + 6); c.lineTo(X + T, Y + 6); c.stroke();
    c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X, Y + 4.5); c.lineTo(X + T, Y + 4.5); c.stroke();
  },
  counter: function (c, X, Y, P) {
    rr(c, X, Y + 6, T, T - 8, 2); fillStroke(c, P.wood, P.ink, 1.6);
    c.fillStyle = P.wood2; c.fillRect(X + 2, Y + 8, T - 4, 4);
  },
  /* Antonio's flat, seen from above: furniture drawn flat into the floor */
  bed: function (c, X, Y, P) {
    rr(c, X + 3, Y + 2, T - 6, T - 4, 4); fillStroke(c, '#fffdf6', P.ink, 1.6);
    rr(c, X + 3, Y + 12, T - 6, T - 14, 3); fillStroke(c, P['roof-b'], P.ink, 1.4);
    rr(c, X + 7, Y + 4, T - 14, 6, 3); fillStroke(c, '#ffffff', P.ink, 1.2);
    c.strokeStyle = P.ink; c.globalAlpha = 0.3; c.lineWidth = 1; c.beginPath(); c.moveTo(X + 5, Y + 20); c.lineTo(X + T - 5, Y + 20); c.stroke(); c.globalAlpha = 1;
  },
  desk: function (c, X, Y, P) {
    rr(c, X + 1, Y + 4, T - 2, T - 10, 2); fillStroke(c, P.wood, P.ink, 1.6);
    rr(c, X + 7, Y + 7, 18, 12, 2); fillStroke(c, '#30323a', P.ink, 1.3);
    rr(c, X + 9, Y + 9, 14, 8, 1); c.fillStyle = '#bfe3ff'; c.fill();
    c.strokeStyle = '#1c2340'; c.lineWidth = 0.8; for (var k = 0; k < 3; k++) { c.beginPath(); c.moveTo(X + 10, Y + 11 + k * 2); c.lineTo(X + 19 - k * 3, Y + 11 + k * 2); c.stroke(); }
    circle(c, X + 27, Y + 20, 2.6); fillStroke(c, '#fffdf6', P.ink, 1);
  },
  tv: function (c, X, Y, P) {
    rr(c, X + 2, Y + 16, T - 4, 10, 2); fillStroke(c, P.wood2, P.ink, 1.5);
    rr(c, X + 3, Y + 3, T - 6, 14, 2); fillStroke(c, '#20242e', P.ink, 1.6);
    c.fillStyle = '#5b8fd9'; c.globalAlpha = 0.6; c.fillRect(X + 6, Y + 6, T - 12, 8); c.globalAlpha = 1;
    rr(c, X + 9, Y + 19, 14, 5, 2); fillStroke(c, '#f3f3f3', P.ink, 1);
  },
  sofa: function (c, X, Y, P) {
    rr(c, X + 2, Y + 6, T - 4, T - 10, 5); fillStroke(c, P['roof-d'], P.ink, 1.6);
    rr(c, X + 6, Y + 11, T - 12, T - 18, 3); fillStroke(c, P['roof-d'], P.ink, 1.1);
    rr(c, X + 9, Y + 13, 8, 6, 2); fillStroke(c, P['flower-b'], P.ink, 1);
  },
  shelf: function (c, X, Y, P) {
    rr(c, X + 2, Y + 3, T - 4, T - 8, 2); fillStroke(c, P.wood, P.ink, 1.6);
    var cols = ['#e86a5c', '#5b8fd9', '#f2c14e', '#62b38a', '#b07cd8'];
    for (var k = 0; k < 5; k++) { c.fillStyle = cols[k]; c.fillRect(X + 5 + k * 4.4, Y + 6, 3.4, 8); }
    rr(c, X + 9, Y + 16, 14, 8, 3); fillStroke(c, '#eef1f4', P.ink, 1.2);
    circle(c, X + 13, Y + 20, 1.6); c.fillStyle = '#7fe3ff'; c.fill(); circle(c, X + 19, Y + 20, 1.6); c.fill();
  },
  plant: function (c, X, Y, P) {
    circle(c, X + 16, Y + 22, 7); fillStroke(c, P.clay, P.ink, 1.5);
    blobs(c, [[11, 13, 6], [21, 13, 6], [16, 8, 6]].map(function (b) { return [X + b[0], Y + b[1], b[2]]; }), P.leaf, P.ink, 1.4);
  },
  mat: function (c, X, Y, P) {
    rr(c, X + 4, Y + 10, T - 8, 14, 3); fillStroke(c, P['roof-a'], P.ink, 1.4);
  },
  rocks: function (c, X, Y, P, x, y) {
    var n = 2 + Math.floor(hash(x, y, 130) * 2);
    for (var k = 0; k < n; k++) {
      var rx = X + 7 + hash(x, y, 131 + k) * 18, ry = Y + 10 + hash(x, y, 141 + k) * 14, s1 = 4 + hash(x, y, 151 + k) * 4;
      c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry + 1, s1 + 3, 0.25, Math.PI - 0.25); c.stroke();
      c.beginPath(); c.moveTo(rx - s1, ry + 2); c.quadraticCurveTo(rx - s1, ry - s1, rx, ry - s1); c.quadraticCurveTo(rx + s1 + 1, ry - s1 + 1, rx + s1, ry + 2); c.closePath();
      fillStroke(c, P.rock, P.ink, 1.4);
      c.strokeStyle = P.rock2; c.lineWidth = 1; c.beginPath(); c.moveTo(rx - s1 * 0.3, ry - s1 * 0.6); c.lineTo(rx + s1 * 0.2, ry); c.stroke();
    }
  },
  zebra: function (c, X, Y, P) {
    c.fillStyle = P.line;
    for (var k = 0; k < 3; k++) { rr(c, X + 4, Y + 3 + k * 10, T - 8, 5, 1); c.fill(); }
  },
  /* a sunbed of the lido, seen from above, with its towel */
  lounger: function (c, X, Y, P, x, y) {
    rr(c, X + 7, Y + 3, T - 14, T - 6, 3); fillStroke(c, '#fffdf6', P.ink, 1.5);
    rr(c, X + 9, Y + 5, T - 18, 8, 2); fillStroke(c, '#e9eef4', P.ink, 1);
    var towel = [P['tent-a'], P['tent-b'], P['flower-b']][Math.floor(hash(x, y, 180) * 3)];
    rr(c, X + 9, Y + 14, T - 18, 12, 2); c.fillStyle = towel; c.fill();
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.7; c.fillRect(X + 9, Y + 18, T - 18, 2); c.globalAlpha = 1;
  },
  /* a pub table seen from above: four stools, the round top, two mugs */
  table: function (c, X, Y, P) {
    [[5, 5], [T - 5, 5], [5, T - 5], [T - 5, T - 5]].forEach(function (q) { circle(c, X + q[0], Y + q[1], 3.6); fillStroke(c, P.wood2, P.ink, 1.2); });
    circle(c, X + 16, Y + 16, 11); fillStroke(c, P.wood, P.ink, 1.6);
    c.strokeStyle = P.wood2; c.lineWidth = 1; c.beginPath(); c.arc(X + 16, Y + 16, 7, 0.4, 2.4); c.stroke();
    circle(c, X + 12, Y + 14, 3); fillStroke(c, '#ffd166', P.ink, 1.1); circle(c, X + 20, Y + 18, 3); fillStroke(c, '#c96b2c', P.ink, 1.1);
  },
  /* the line of buoys that marks off the swimmers from the boats and the windsurfs */
  buoy: function (c, X, Y, P, x, y) {
    c.strokeStyle = P.foam; c.globalAlpha = 0.8; c.lineWidth = 1.4; c.setLineDash([3, 3]);
    c.beginPath(); c.moveTo(X, Y + 17); c.lineTo(X + T, Y + 17); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
    circle(c, X + 16, Y + 16, 4.6); fillStroke(c, hash(x, y, 181) < 0.5 ? '#ff8a3c' : '#ffffff', P.ink, 1.3);
    c.strokeStyle = P.foam; c.lineWidth = 1.4; c.beginPath(); c.arc(X + 16, Y + 18, 7, 0.3, Math.PI - 0.3); c.stroke();
  }
};

/* flat things drawn into the ground: court lines, banners, the mountains, the running track, names written on the map */
const GROUND_OBJ: Record<string, GroundObjFn> = {
  court: function (c, o, P) {
    var X = o.x * T + 6, Y = o.y * T + 6, W = o.w * T - 12, H = o.h * T - 12;
    c.strokeStyle = P.line; c.lineWidth = 2.6;
    c.strokeRect(X, Y, W, H);
    c.beginPath(); c.moveTo(X + W * 0.12, Y); c.lineTo(X + W * 0.12, Y + H); c.moveTo(X + W * 0.88, Y); c.lineTo(X + W * 0.88, Y + H); c.stroke();
    c.beginPath(); c.moveTo(X + W * 0.12, Y + H * 0.24); c.lineTo(X + W * 0.88, Y + H * 0.24); c.moveTo(X + W * 0.12, Y + H * 0.76); c.lineTo(X + W * 0.88, Y + H * 0.76);
    c.moveTo(X + W / 2, Y + H * 0.24); c.lineTo(X + W / 2, Y + H * 0.76); c.stroke();
  },
  scoreboard: function (c, o, P) {
    var X = o.x * T + 4, Y = o.y * T + 4, W = o.w * T - 8, H = T - 10;
    rr(c, X, Y, W, H, 3); fillStroke(c, '#20263a', P.ink, 1.6);
    c.fillStyle = '#ffd166'; c.font = '700 13px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(o.text || '15 – 0', X + W / 2, Y + H / 2 + 1);
  },
  banner: function (c, o, P) {
    var X = o.x * T + 2, Y = o.y * T + 2, W = o.w * T - 4, H = T - 12;
    c.beginPath(); c.moveTo(X, Y); c.lineTo(X + W, Y); c.lineTo(X + W, Y + H); c.lineTo(X + W / 2, Y + H + 4); c.lineTo(X, Y + H); c.closePath();
    fillStroke(c, o.color || P['roof-c'], P.ink, 1.6);
    c.fillStyle = '#1b1f2e'; c.font = '16px "Lilita One", "Arial Rounded MT Bold", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(o.text, X + W / 2, Y + H / 2 + 1);
  },
  rug: function (c, o, P) {
    rr(c, o.x * T + 4, o.y * T + 4, o.w * T - 8, o.h * T - 8, 6); fillStroke(c, o.color || P['roof-b'], P.ink, 1.6);
  },
  /* a range of mountains (the Aurunci behind Formia), two rows of peaks */
  peaks: function (c, o, P) {
    var X = o.x * T, Y = o.y * T, W = o.w * T, H = o.h * T, base = Y + H - 3;
    c.beginPath(); c.rect(X, Y, W, H); c.clip();
    var n = Math.max(1, Math.round(o.w / 3.4)), step = W / n;
    for (var pass = 0; pass < 2; pass++) {
      for (var i = -1; i <= n; i++) {
        var cx = X + (i + (pass ? 0.5 : 0)) * step, ph = H * (pass ? 0.8 : 0.98) * (0.8 + hash(o.x * 7 + i, o.y, 160 + pass) * 0.2);
        var bw = step * (pass ? 0.72 : 0.62), top = base - ph;
        c.beginPath(); c.moveTo(cx - bw, base + 2); c.quadraticCurveTo(cx - bw * 0.3, top + ph * 0.22, cx - 3, top + 2); c.quadraticCurveTo(cx, top - 1.5, cx + 3, top + 2);
        c.quadraticCurveTo(cx + bw * 0.3, top + ph * 0.22, cx + bw, base + 2); c.closePath();
        c.fillStyle = pass ? P.hill : P.hill2; c.fill();
        c.save(); c.clip();
        c.fillStyle = pass ? P.hill2 : P.ink; c.globalAlpha = pass ? 0.75 : 0.08; c.fillRect(cx + 1, top - 2, bw + 2, ph + 6);
        c.restore();
        c.strokeStyle = P.ink; c.lineWidth = 1.7; c.stroke();
        if (pass) {
          c.lineWidth = 1; c.globalAlpha = 0.45;
          for (var k = 1; k < 4; k++) { c.beginPath(); c.moveTo(cx + 3 + k * 6, top + 6 + k * ph * 0.17); c.lineTo(cx + k * 6, top + 12 + k * ph * 0.17); c.stroke(); }
          c.globalAlpha = 1;
          /* scrub at the foot */
          c.fillStyle = P.leaf2;
          for (k = 0; k < 3; k++) { circle(c, cx - bw * 0.6 + k * bw * 0.55 + hash(i, k, 165) * 6, base - 5 - hash(i, k, 166) * 6, 2.4); c.fill(); }
        }
      }
    }
    if (o.village) { /* a hill village (Maranola) */
      var vx = X + o.village[0] * T, vy = Y + o.village[1] * T;
      for (var h = 0; h < 6; h++) {
        var hx = vx + (h % 3) * 11 - 4, hy = vy + Math.floor(h / 3) * 9 - (h % 3 === 1 ? 4 : 0);
        rr(c, hx, hy, 10, 8, 1); fillStroke(c, P.wall, P.ink, 1.1);
        poly(c, [[hx - 1, hy + 1], [hx + 5, hy - 4], [hx + 11, hy + 1]]); fillStroke(c, P['roof-a'], P.ink, 1.1);
      }
      rr(c, vx + 9, vy - 18, 5, 14, 1); fillStroke(c, P.wall, P.ink, 1.1);   /* bell tower */
      poly(c, [[vx + 8, vy - 17], [vx + 11.5, vy - 23], [vx + 15, vy - 17]]); fillStroke(c, P['roof-a'], P.ink, 1.1);
    }
  },
  /* the athletics track of the Olympic training centre */
  track: function (c, o, P) {
    var X = o.x * T + 4, Y = o.y * T + 4, W = o.w * T - 8, H = o.h * T - 8, rad = H / 2, lane = 13;
    rr(c, X, Y, W, H, rad); rr(c, X + lane * 2, Y + lane * 2, W - lane * 4, H - lane * 4, rad - lane * 2, true);
    c.fillStyle = P.track; c.fill('evenodd');
    c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = P.line; c.lineWidth = 1.2; c.globalAlpha = 0.9;
    rr(c, X + lane, Y + lane, W - lane * 2, H - lane * 2, rad - lane); c.stroke();
    c.globalAlpha = 1; c.lineWidth = 2.2;
    c.beginPath(); c.moveTo(X + W / 2, Y + 2); c.lineTo(X + W / 2, Y + lane * 2 - 2); c.stroke();
    c.fillStyle = P.ink; c.font = '12px "Patrick Hand", "Comic Sans MS", cursive'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.globalAlpha = 0.55; c.fillText('100 m', X + W / 2, Y + H - lane); c.globalAlpha = 1;
  },
  /* a name written on the map in ballpoint */
  text: function (c, o, P) {
    c.font = (o.size || 17) + 'px "Patrick Hand", "Chalkboard SE", "Comic Sans MS", cursive';
    c.fillStyle = P.ink; c.globalAlpha = o.alpha || 0.62; c.textAlign = o.align || 'left'; c.textBaseline = 'middle';
    c.translate(o.x * T, o.y * T + T / 2); if (o.rot) c.rotate(o.rot);
    c.fillText(o.text, 0, 0);
  },
  /* Gaeta across the gulf: soft colours, no hard outlines, it is far away */
  gaeta: function (c, o, P) {
    var X = o.x * T, Y = o.y * T, W = o.w * T, H = o.h * T;
    c.beginPath(); c.rect(X, Y, W, H); c.clip();
    blobs(c, [[X + W * 0.24, Y + H * 0.62, H * 0.5], [X + W * 0.08, Y + H * 0.8, H * 0.42], [X + W * 0.42, Y + H * 0.9, H * 0.34]], P.far2, null);
    c.fillStyle = P.leaf2; c.globalAlpha = 0.35;
    for (var k = 0; k < 7; k++) { circle(c, X + W * 0.1 + k * 14, Y + H * 0.42 + hash(k, 1, 171) * 22, 4); c.fill(); }
    c.globalAlpha = 1;
    for (k = 0; k < 10; k++) {
      var hx = X + W * 0.46 + (k % 5) * 15, hy = Y + 14 + Math.floor(k / 5) * 13 + hash(k, 2, 172) * 5;
      rr(c, hx, hy, 12, 10, 1); fillStroke(c, P.wall, P.far2, 1);
      c.fillStyle = P['roof-a']; c.globalAlpha = 0.7; c.fillRect(hx, hy, 12, 3); c.globalAlpha = 1;
    }
    rr(c, X + W * 0.8, Y + 8, 30, 18, 1); fillStroke(c, P.stone, P.far2, 1.2);   /* the castle */
    for (k = 0; k < 4; k++) { c.fillStyle = P.stone; c.fillRect(X + W * 0.8 + 1 + k * 8, Y + 4, 5, 5); c.strokeStyle = P.far2; c.strokeRect(X + W * 0.8 + 1 + k * 8, Y + 4, 5, 5); }
    rr(c, X + W * 0.72, Y - 2, 7, 28, 1); fillStroke(c, P.wall, P.far2, 1.1);   /* a bell tower */
    poly(c, [[X + W * 0.72 - 1, Y - 1], [X + W * 0.72 + 3.5, Y - 9], [X + W * 0.72 + 8, Y - 1]]); fillStroke(c, P.stone2, P.far2, 1.1);
    c.font = '20px "Patrick Hand", "Chalkboard SE", "Comic Sans MS", cursive'; c.fillStyle = P.ink; c.globalAlpha = 0.6; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('Gaeta', X + 14, Y + H - 22);
  }
};
