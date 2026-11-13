import { covoProp } from './covo';
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
  hill: 'h', paving: 'pv', mura: 'mu', far: 'fr', scarp: 'sc' };

function groundFill(P: Palette, g: string): string {
  return ({ grass: P.grass, path: P.path, road: P.road, sand: P.sand, sea: P.sea, pier: P.wood, stone: P.stone, steps: P.stone, clay: P.clay, floor: P.wood,
    wall: P.wall, rail: P.path, hill: P.hill, paving: P.stone, mura: P.rock, far: P.far, scarp: P.rock } as Record<string, string>)[g] || P.paper;
}
/** the same kind of ground (its group) at a tile of the map */
function same(map: GroundMap, x: number, y: number, g: string): boolean {
  return x >= 0 && y >= 0 && x < map.w && y < map.h && GROUP[map.cell(x, y).g] === g;
}
/** a slow noise along a row, 0–1: where the ripples on the sand run and where they stop */
function noise1(u: number, row: number, k: number): number {
  var i = Math.floor(u), f = u - i, a = hash(i, row, k), b = hash(i + 1, row, k);
  return a + (b - a) * f * f * (3 - 2 * f);
}
/** a slow noise over the whole map, 0–1, on cells of s tiles: where the grass grows thick, where it flowers */
function noise2(x: number, y: number, s: number, k: number): number {
  var u = x / s, v = y / s, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
  fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv);
  var a = hash(i, j, k), b = hash(i + 1, j, k), c0 = hash(i, j + 1, k), d = hash(i + 1, j + 1, k);
  return (a + (b - a) * fu) * (1 - fv) + (c0 + (d - c0) * fu) * fv;
}
/** a little wave, "~", centred on x, y */
function wave(c: Ctx, x: number, y: number, w: number) {
  c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w / 2, y - 3, x, y); c.quadraticCurveTo(x + w / 2, y + 3, x + w, y); c.stroke();
}
/** sea next to the land */
function shore(map: GroundMap, x: number, y: number): boolean {
  return [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function (d) { var q = x + d[0], u = y + d[1]; return q >= 0 && u >= 0 && q < map.w && u < map.h && GROUP[map.cell(q, u).g] !== 'w'; });
}

/* The texture of one tile, over its colour. It is clipped to the tile, so nothing spills onto another kind of ground;
   the soft patches belong to a tile and are drawn by its neighbours of the same ground too, and the ripples and the
   flagstones are laid out on the whole map, so they run on from tile to tile and the squares do not show. */
function texture(c: Ctx, map: GroundMap, P: Palette, x: number, y: number) {
  var L = map.cell(x, y), X = x * T, Y = y * T, r = hash(x, y, 1), g = GROUP[L.g], k, dx, dy, q, u;
  c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
  if (L.g === 'grass' || L.g === 'hill') {
    /* the meadow is never one flat green: patches darker and lighter, shared with the tiles around so that no square
       shows, larger where the map's slow noise says the grass grows thicker */
    var dark = L.g === 'grass' ? P.grass2 : P.hill2, light = L.g === 'grass' ? P['grass-hi'] : P.grass;
    for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) {
      q = x + dx; u = y + dy;
      if (!same(map, q, u, g)) continue;
      var hq = hash(q, u, 3), thick = noise2(q, u, 5, 71);
      if (hq < 0.3 + thick * 0.25) {
        c.fillStyle = dark; c.globalAlpha = 0.16 + thick * 0.14;
        ell(c, q * T + 4 + hash(q, u, 4) * 24, u * T + 4 + hash(q, u, 5) * 24, 15 + hash(q, u, 6) * 14, 10 + hash(q, u, 7) * 10); c.fill();
      } else if (hq > 0.78 - (1 - thick) * 0.2) {
        c.fillStyle = light; c.globalAlpha = 0.5;
        ell(c, q * T + 4 + hash(q, u, 74) * 24, u * T + 4 + hash(q, u, 75) * 24, 10 + hash(q, u, 76) * 10, 6 + hash(q, u, 77) * 6); c.fill();
      }
    }
    c.globalAlpha = 1;
  }
  if (L.g === 'grass') {
    /* tufts of blades, each curved its own way: deep green, with a light one catching the sun; more of them where the
       meadow is thick. Their foot is in the tile, their tips may run over its edge into the next */
    /* the grain of the lawn: a stipple of darker green */
    c.fillStyle = P.grass2; c.globalAlpha = 0.55;
    for (k = 0; k < 7; k++) { c.fillRect(X + 1 + hash(x, y, 200 + k) * 30, Y + 1 + hash(x, y, 210 + k) * 30, 1.2, 1.2); }
    c.globalAlpha = 1;
    var dense = noise2(x, y, 4, 72), tufts = 2 + Math.floor(dense * 3.4 + hash(x, y, 13) * 1.2);
    for (k = 0; k < tufts; k++) {
      var gx = X + 4 + hash(x, y, 10 + k) * 24, gy = Y + 9 + hash(x, y, 20 + k) * 20, blades = 3 + Math.floor(hash(x, y, 30 + k) * 3), lean = (hash(x, y, 40 + k) - 0.5) * 3;
      c.globalAlpha = 0.35; c.fillStyle = P.grass2; ell(c, gx, gy + 0.6, 3.6, 1.2); c.fill(); c.globalAlpha = 1;
      for (var bl = 0; bl < blades; bl++) {
        var off = (bl - (blades - 1) / 2) * 1.7, len = 4 + hash(x + bl, y, 50 + k) * 4.5 - Math.abs(off) * 0.4, tip = off * 1.3 + lean;
        c.strokeStyle = bl === 1 && hash(x, y, 60 + k) < 0.5 ? P['grass-hi'] : P.grass3; c.lineWidth = bl === 1 ? 1.5 : 1.25;
        c.beginPath(); c.moveTo(gx + off * 0.5, gy); c.quadraticCurveTo(gx + off * 0.7, gy - len * 0.6, gx + tip, gy - len); c.stroke();
      }
    }
    /* a clover, a pebble */
    if (hash(x, y, 14) < 0.1) {
      var cx0 = X + 6 + hash(x, y, 15) * 20, cy0 = Y + 6 + hash(x, y, 16) * 20;
      c.fillStyle = P.grass3; for (k = 0; k < 3; k++) { circle(c, cx0 + Math.cos(k * 2.094 - 1.57) * 1.9, cy0 + Math.sin(k * 2.094 - 1.57) * 1.9, 1.7); c.fill(); }
    } else if (hash(x, y, 17) < 0.07) {
      c.fillStyle = P.stone2; ell(c, X + 6 + hash(x, y, 18) * 20, Y + 8 + hash(x, y, 19) * 18, 2.2, 1.5); c.fill();
    }
    /* the flowers come in meadows, where the slow noise says so; only now and then one alone elsewhere */
    var bloom = noise2(x, y, 7, 73), nf = bloom > 0.64 ? 1 + Math.floor((bloom - 0.64) * 9 * hash(x, y, 21)) : hash(x, y, 8) < 0.04 ? 1 : 0;
    for (k = 0; k < Math.min(3, nf); k++) {
      var fx = X + 5 + hash(x, y, 9 + k * 7) * 22, fy = Y + 5 + hash(x, y, 11 + k * 7) * 22, kind = hash(x, y, 12 + k * 7);
      if (kind < 0.55) {
        /* a daisy */
        c.fillStyle = '#ffffff'; for (q = 0; q < 6; q++) { ell(c, fx + Math.cos(q * 1.047) * 2.1, fy + Math.sin(q * 1.047) * 2.1, 1.3, 1.3); c.fill(); }
        circle(c, fx, fy, 1.1); c.fillStyle = '#ffd166'; c.fill();
      } else {
        c.fillStyle = kind < 0.8 ? P['flower-b'] : P['flower-a'];
        for (q = 0; q < 4; q++) { circle(c, fx + Math.cos(q * 1.571) * 1.8, fy + Math.sin(q * 1.571) * 1.8, 1.4); c.fill(); }
        circle(c, fx, fy, 0.9); c.fillStyle = P.foam; c.fill();
      }
    }
  } else if (L.g === 'path') {
    c.strokeStyle = P.path2; c.lineWidth = 1.2;
    for (k = 0; k < 3; k++) { var px = X + 4 + hash(x, y, 30 + k) * 22, py = Y + 4 + hash(x, y, 40 + k) * 22; rr(c, px, py, 6 + r * 3, 4 + r * 2, 2); c.stroke(); }
  } else if (L.g === 'road') {
    c.fillStyle = P.road2;
    for (k = 0; k < 4; k++) { circle(c, X + 3 + hash(x, y, 160 + k) * 26, Y + 3 + hash(x, y, 165 + k) * 26, 0.8); c.fill(); }
    c.strokeStyle = P.road2; c.lineWidth = 1;
    c.beginPath(); c.moveTo(X + 4 + r * 10, Y + 9); c.lineTo(X + 9 + r * 10, Y + 9); c.moveTo(X + 16, Y + 22 + r * 4); c.lineTo(X + 23, Y + 22 + r * 4); c.stroke();
    /* a level crossing: the railway on both sides of the street, a few tiles away at most */
    var track = function (tx: number, ty: number) {
      for (var s = 1; s <= 3; s++) {
        var a = x + tx * s, b = y + ty * s;
        if (a < 0 || b < 0 || a >= map.w || b >= map.h) return false;
        var gg = map.cell(a, b).g;
        if (gg === 'rail') return true;
        if (gg !== 'road') return false;
      }
      return false;
    };
    c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
    if (track(-1, 0) && track(1, 0)) { c.moveTo(X, Y + 11); c.lineTo(X + T, Y + 11); c.moveTo(X, Y + 21); c.lineTo(X + T, Y + 21); }
    if (track(0, -1) && track(0, 1)) { c.moveTo(X + 11, Y); c.lineTo(X + 11, Y + T); c.moveTo(X + 21, Y); c.lineTo(X + 21, Y + T); }
    c.stroke();
  } else if (L.g === 'sand') {
    /* ripples left by the wind, rows across the whole beach that come and go */
    c.strokeStyle = P.sand2; c.lineWidth = 1.1; c.globalAlpha = 0.6;
    for (var row = Math.floor(Y / 9) - 1; row * 9 < Y + T + 4; row++) {
      var ry0 = row * 9 + (hash(row, 7, 13) - 0.5) * 3, on = false;
      c.beginPath();
      for (var sx = Math.floor((X - 4) / 3) * 3; sx <= X + T + 4; sx += 3) {
        var vis = noise1(sx / 23, row, 14) > 0.55, sy = ry0 + Math.sin(sx / 7 + row * 1.9) * 1.6;
        if (vis) { if (on) c.lineTo(sx, sy); else c.moveTo(sx, sy); }
        on = vis;
      }
      c.stroke();
    }
    c.globalAlpha = 1;
    c.fillStyle = P.sand2;
    for (k = 0; k < 5; k++) { circle(c, X + 3 + hash(x, y, 50 + k) * 26, Y + 3 + hash(x, y, 60 + k) * 26, 0.9); c.fill(); }
  } else if (L.g === 'stone') {
    /* flagstones in staggered rows, laid on the whole square and not on the tiles */
    c.strokeStyle = P.stone2; c.lineWidth = 1;
    for (var fr = Math.floor(Y / 16); fr * 16 < Y + T; fr++) {
      var top = fr * 16, off = (fr % 2) * 11;
      c.beginPath(); c.moveTo(X, top); c.lineTo(X + T, top); c.stroke();
      for (var kx = Math.floor((X - off) / 22) - 1; kx * 22 + off < X + T + 22; kx++) {
        var jx = kx * 22 + off + (hash(kx, fr, 21) - 0.5) * 8;
        if (hash(kx, fr, 22) < 0.16) { c.fillStyle = P.stone2; c.globalAlpha = 0.25; c.fillRect(jx, top, 22, 16); c.globalAlpha = 1; }
        c.beginPath(); c.moveTo(jx, top); c.lineTo(jx, top + 16); c.stroke();
      }
    }
  } else if (L.g === 'pier' || L.g === 'floor') {
    c.strokeStyle = P.wood2; c.lineWidth = 1.2;
    for (k = 1; k < 4; k++) { c.beginPath(); c.moveTo(X, Y + k * 8); c.lineTo(X + T, Y + k * 8); c.stroke(); }
    c.beginPath(); c.moveTo(X + 6 + r * 18, Y + 8); c.lineTo(X + 6 + r * 18, Y + 16); c.moveTo(X + 20 - r * 12, Y + 16); c.lineTo(X + 20 - r * 12, Y + 24); c.stroke();
  } else if (L.g === 'wall') {
    c.fillStyle = P.stone; c.fillRect(X, Y + T - 8, T, 8);
    c.strokeStyle = P.stone2; c.lineWidth = 1;
    c.beginPath(); c.moveTo(X, Y + T - 8); c.lineTo(X + T, Y + T - 8); c.stroke();
  } else if (L.g === 'rail') {
    /* the track runs towards the rail next to it: along the row, down the column, or round a corner */
    var rl = function (tx: number, ty: number) { return x + tx >= 0 && y + ty >= 0 && x + tx < map.w && y + ty < map.h && map.cell(x + tx, y + ty).g === 'rail'; };
    var we = rl(-1, 0) || rl(1, 0), ns = rl(0, -1) || rl(0, 1);
    if (!we && !ns) we = true;
    /* half a track from the middle of the tile to one side: sleepers across, two rails along */
    var half = function (hx: number, hy: number) {
      var cx = X + T / 2, cy = Y + T / 2;
      c.strokeStyle = P.wood2; c.lineWidth = 3;
      for (var s = 0; s < 2; s++) {
        var o = 4 + s * 8;
        c.beginPath();
        if (hy === 0) { c.moveTo(cx + hx * o, Y + 6); c.lineTo(cx + hx * o, Y + 26); } else { c.moveTo(X + 6, cy + hy * o); c.lineTo(X + 26, cy + hy * o); }
        c.stroke();
      }
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath();
      if (hy === 0) { c.moveTo(cx - (hx < 0 ? 0 : 5), Y + 11); c.lineTo(hx < 0 ? X : X + T, Y + 11); c.moveTo(cx - (hx < 0 ? 0 : 5), Y + 21); c.lineTo(hx < 0 ? X : X + T, Y + 21); }
      else { c.moveTo(X + 11, cy - (hy < 0 ? 0 : 5)); c.lineTo(X + 11, hy < 0 ? Y : Y + T); c.moveTo(X + 21, cy - (hy < 0 ? 0 : 5)); c.lineTo(X + 21, hy < 0 ? Y : Y + T); }
      c.stroke();
    };
    /* a straight run goes right across, even where a road or a tunnel cuts it off on one side */
    if (we && !ns) { half(-1, 0); half(1, 0); }
    else if (ns && !we) { half(0, -1); half(0, 1); }
    else { if (rl(-1, 0)) half(-1, 0); if (rl(1, 0)) half(1, 0); if (rl(0, -1)) half(0, -1); if (rl(0, 1)) half(0, 1); }
  } else if (L.g === 'sea') {
    /* lighter water along the shore, shared with the sea around */
    c.fillStyle = P.foam; c.globalAlpha = 0.08;
    for (dy = -1; dy <= 1; dy++) for (dx = -1; dx <= 1; dx++) {
      q = x + dx; u = y + dy;
      if (!same(map, q, u, 'w') || !shore(map, q, u)) continue;
      ell(c, q * T + 16, u * T + 16, 30, 26); c.fill(); ell(c, q * T + 16, u * T + 16, 20, 17); c.fill();
    }
    c.globalAlpha = 1;
    c.strokeStyle = P.sea2; c.lineWidth = 1.6;
    if (r < 0.7) wave(c, X + 9 + hash(x, y, 15) * 14, Y + 9 + hash(x, y, 16) * 14, 5 + hash(x, y, 17) * 3);
    if (hash(x, y, 18) < 0.3) wave(c, X + 9 + hash(x, y, 23) * 14, Y + 9 + hash(x, y, 24) * 14, 4);
    /* the surf, along the beach */
    c.strokeStyle = P.foam; c.lineWidth = 2;
    [[0, -1], [0, 1], [-1, 0], [1, 0]].forEach(function (d) {
      if (!same(map, x + d[0], y + d[1], 's')) return;
      c.beginPath();
      if (d[0] === 0) { var ey = d[1] < 0 ? Y + 5 : Y + T - 5; c.moveTo(X + 7, ey); c.quadraticCurveTo(X + 12, ey - 2.5 * d[1], X + 16, ey); c.quadraticCurveTo(X + 20, ey + 2.5 * d[1], X + 25, ey); }
      else { var ex = d[0] < 0 ? X + 5 : X + T - 5; c.moveTo(ex, Y + 7); c.quadraticCurveTo(ex - 2.5 * d[0], Y + 12, ex, Y + 16); c.quadraticCurveTo(ex + 2.5 * d[0], Y + 20, ex, Y + 25); }
      c.stroke();
    });
    /* and a glint of sun, here and there */
    if (hash(x, y, 19) < 0.05) {
      var gx2 = X + 8 + hash(x, y, 25) * 16, gy2 = Y + 8 + hash(x, y, 26) * 16;
      c.fillStyle = P.foam; c.beginPath(); c.moveTo(gx2, gy2 - 4); c.lineTo(gx2 + 1, gy2 - 1); c.lineTo(gx2 + 4, gy2); c.lineTo(gx2 + 1, gy2 + 1); c.lineTo(gx2, gy2 + 4); c.lineTo(gx2 - 1, gy2 + 1); c.lineTo(gx2 - 4, gy2); c.lineTo(gx2 - 1, gy2 - 1); c.closePath(); c.fill();
    }
  } else if (L.g === 'clay') {
    c.fillStyle = P.sand2;
    for (k = 0; k < 4; k++) { circle(c, X + 3 + hash(x, y, 70 + k) * 26, Y + 3 + hash(x, y, 80 + k) * 26, 0.7); c.fill(); }
  } else if (L.g === 'hill') {
    /* the higher up the mountain, the farther away: paler, ridge behind ridge */
    var dep = hillDepth(map, x, y);
    if (dep > 1) { c.fillStyle = P.far; c.globalAlpha = Math.min(0.66, (dep - 1) * 0.085); c.fillRect(X, Y, T, T); c.globalAlpha = 1; }
    if ((dep === 4 || dep === 8) && same(map, x - 1, y, g) && same(map, x + 1, y, g) && hillDepth(map, x - 1, y) === dep && hillDepth(map, x + 1, y) === dep) {
      /* a crest: a line that runs on from tile to tile, the slope behind it lighter */
      var crest = function (px: number) { return Y + 17 + (noise1((x + px / T) * 0.9, dep, 61) - 0.5) * 18; };
      c.beginPath(); c.moveTo(X, crest(0));
      for (k = 4; k <= T; k += 4) c.lineTo(X + k, crest(k));
      c.lineTo(X + T, Y); c.lineTo(X, Y); c.closePath();
      c.fillStyle = P.far; c.globalAlpha = 0.3; c.fill(); c.globalAlpha = 0.9;
      c.beginPath(); c.moveTo(X, crest(0));
      for (k = 4; k <= T; k += 4) c.lineTo(X + k, crest(k));
      c.strokeStyle = P.hill2; c.lineWidth = 1.7; c.stroke(); c.globalAlpha = 1;
    }
    /* little "∧" marks, as a mountain is drawn on a hand-made map: fainter with the distance */
    c.globalAlpha = Math.max(0.3, 1 - dep * 0.08);
    c.strokeStyle = P.hill2; c.lineWidth = 1.4;
    for (k = 0; k < 2; k++) {
      var hx = X + 7 + hash(x, y, 110 + k) * 18, hy = Y + 9 + hash(x, y, 120 + k) * 15;
      c.beginPath(); c.moveTo(hx - 5, hy + 3); c.lineTo(hx, hy - 3); c.lineTo(hx + 5, hy + 3); c.stroke();
    }
    if (r < 0.2) { ell(c, X + 8 + r * 70, Y + 24, 3.6, 2.4); fillStroke(c, P.rock, P.ink, 1.1); }
    c.globalAlpha = 1;
  } else if (L.g === 'steps') {
    c.fillStyle = P.shadow;
    for (k = 1; k < 4; k++) c.fillRect(X + 1, Y + k * 8, T - 2, 2.5);
    c.strokeStyle = P.stone2; c.lineWidth = 1.2;
    for (k = 1; k < 4; k++) { c.beginPath(); c.moveTo(X + 1, Y + k * 8); c.lineTo(X + T - 1, Y + k * 8); c.stroke(); }
  } else if (L.g === 'paving') {
    /* sampietrini: rows of small cobbles, each a little out of line */
    c.strokeStyle = P.stone2; c.lineWidth = 0.9;
    for (var cy2 = 0; cy2 < 4; cy2++) for (var cx2 = 0; cx2 < 5; cx2++) {
      var bx = X + cx2 * 8 - (cy2 % 2) * 4 + 1 + (hash(x * 5 + cx2, y * 4 + cy2, 27) - 0.5) * 1.2, by = Y + cy2 * 8 + 1 + (hash(x * 5 + cx2, y * 4 + cy2, 28) - 0.5) * 1.2;
      rr(c, bx, by, 6, 6, 1.6); c.stroke();
    }
  } else if (L.g === 'mura') {
    /* polygonal blocks, like the walls of ancient Formia */
    var j = function (a: number) { return (hash(x, y, a) - 0.5) * 6; };
    var m1 = [X + 15 + j(1), Y + 1], m2 = [X + 13 + j(2), Y + 15 + j(3)], m3 = [X + T - 1, Y + 17 + j(4)], m4 = [X + 18 + j(5), Y + T - 1];
    c.strokeStyle = P.rock2; c.lineWidth = 1.3;
    [[[X + 1, Y + 2], m1, m2, [X + 1, Y + 13]], [m1, [X + T - 1, Y + 3], m3, m2], [[X + 1, Y + 13], m2, m4, [X + 1, Y + T - 1]], [m2, m3, [X + T - 1, Y + T - 1], m4]]
      .forEach(function (pts) { poly(c, pts); c.stroke(); });
  }
  c.restore();
}

/* ---------- the relief: Formia on three levels (VISIONE.md, V4) ---------- */
/** how far up the mountain a hill tile is: the rows from it down to the nearest ground that is not hill, looking south
    in a widening fan (so the height changes along slanting lines, not column by column); 10 at most */
function hillDepth(map: GroundMap, x: number, y: number): number {
  for (var d = 1; d < 10; d++) {
    if (y + d >= map.h) return 10;
    for (var dx = -d; dx <= d; dx++) { var q = x + dx; if (q >= 0 && q < map.w && map.cell(q, y + d).g !== 'hill') return d; }
  }
  return 10;
}
/** a hill that ends here, with lower ground to the south: its side shows as a face of rock */
function hillEnds(map: GroundMap, x: number, y: number): boolean {
  if (y + 1 >= map.h || map.cell(x, y).g !== 'hill') return false;
  var s = map.cell(x, y + 1).g;
  return s !== 'hill' && s !== 'scarp' && s !== 'far';
}
/** the face of a terrace: the higher ground runs on to its edge, then the rock (or the blocks of a retaining wall) goes
    down to the foot. The edge is one line from tile to tile. A ledge is where the edge dips: one jumps down there. */
function scarp(c: Ctx, map: GroundMap, P: Palette, x: number, y: number) {
  var L = map.cell(x, y), X = x * T, Y = y * T, ledge = L.deco === 'ledge', k: number;
  /* a ledge is made of what the scarp beside it is made of */
  var wall = L.deco === 'wall' || (ledge && (map.cell(x - 1, y).deco === 'wall' || map.cell(x + 1, y).deco === 'wall'));
  var up = y > 0 ? map.cell(x, y - 1) : L, top = Y + (wall ? 7 : 9);
  var edge = function (px: number) {
    var e = wall ? top : top + (noise1((x + px / T) * 1.4, y, 71) - 0.5) * 4.5;
    /* the dip of a ledge, in the middle of the tile */
    if (ledge) { var u = Math.abs(px - T / 2) / (T / 2); e += (1 - u * u) * (1 - u * u) * 12; }
    return e;
  };
  c.save(); c.beginPath(); c.rect(X, Y - 1.2, T, T + 1.2); c.clip();
  var g = c.createLinearGradient(0, top, 0, Y + T);
  g.addColorStop(0, wall ? P.stone : P.rock); g.addColorStop(1, wall ? P.stone2 : P.rock2);
  c.fillStyle = g; c.fillRect(X, Y - 1.2, T, T + 1.2);
  if (wall) {
    /* courses of squared blocks, the joints of one course over the middle of the blocks of the next */
    c.strokeStyle = P.stone2; c.lineWidth = 1.1;
    for (k = 1; k < 3; k++) { c.beginPath(); c.moveTo(X, top + k * 8.5); c.lineTo(X + T, top + k * 8.5); c.stroke(); }
    for (k = 0; k < 3; k++) for (var j = 0; j < 2; j++) { var jx = X + j * 16 + (k % 2) * 8; c.beginPath(); c.moveTo(jx, top + k * 8.5); c.lineTo(jx, top + (k + 1) * 8.5); c.stroke(); }
  } else {
    /* layers in the rock, a crack or two */
    c.strokeStyle = P.rock2; c.lineWidth = 1.1;
    for (k = 0; k < 2; k++) {
      c.beginPath();
      for (var sx = 0; sx <= T; sx += 4) { var sy = top + 7 + k * 7 + (noise1((x + sx / T) * 1.1, y * 3 + k, 72) - 0.5) * 5 + (ledge ? 6 : 0); if (sx) c.lineTo(X + sx, sy); else c.moveTo(X + sx, sy); }
      c.stroke();
    }
    c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.55;
    for (k = 0; k < 2; k++) { var cx0 = X + 5 + hash(x, y, 73 + k) * 22, cy0 = top + 6 + hash(x, y, 75 + k) * 6 + (ledge ? 8 : 0); c.beginPath(); c.moveTo(cx0, cy0); c.lineTo(cx0 + 1.5, cy0 + 4); c.lineTo(cx0 - 0.5, cy0 + 7); c.stroke(); }
    c.globalAlpha = 1;
  }
  /* the foot, in shade */
  c.fillStyle = P.shade; c.globalAlpha = 0.2; c.fillRect(X, Y + T - 4, T, 4); c.globalAlpha = 1;
  /* the higher ground, up to the edge */
  c.beginPath(); c.moveTo(X, Y - 1.2); c.lineTo(X + T, Y - 1.2);
  for (k = T; k >= 0; k -= 4) c.lineTo(X + k, edge(k));
  c.closePath(); c.fillStyle = up.g === 'scarp' ? P.rock : groundFill(P, up.g); c.fill();
  if (wall && !ledge) { c.fillStyle = P.wall; c.fillRect(X, top - 3.5, T, 4.5); c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X, top - 3.5); c.lineTo(X + T, top - 3.5); c.stroke(); }
  c.beginPath(); c.moveTo(X, edge(0));
  for (k = 4; k <= T; k += 4) c.lineTo(X + k, edge(k));
  c.strokeStyle = P.ink; c.lineWidth = 1.7; c.stroke();
  if (ledge) {
    /* two little arrows: this way down */
    c.strokeStyle = P.ink; c.lineWidth = 1.6; c.globalAlpha = 0.75;
    for (k = 0; k < 2; k++) { var ay = Y + 4 + k * 5; c.beginPath(); c.moveTo(X + 12, ay); c.lineTo(X + 16, ay + 3.5); c.lineTo(X + 20, ay); c.stroke(); }
    c.globalAlpha = 1;
  } else if (!wall && up.g === 'grass') {
    /* grass hanging over the edge */
    c.strokeStyle = P.grass2; c.lineWidth = 1.4;
    for (k = 0; k < 3; k++) { var tx = 4 + hash(x, y, 77 + k) * 24, ty = edge(tx); c.beginPath(); c.moveTo(X + tx - 2, ty - 1); c.lineTo(X + tx - 1, ty + 3); c.moveTo(X + tx + 1.5, ty - 1); c.lineTo(X + tx + 2, ty + 2.5); c.stroke(); }
  }
  c.restore();
}
/** the side of a hill over lower ground: a band of rock along its foot */
function hillFace(c: Ctx, P: Palette, x: number, y: number) {
  var X = x * T, Y = y * T, top = Y + T - 13, k: number;
  var edge = function (px: number) { return top + (noise1((x + px / T) * 1.4, y, 78) - 0.5) * 5; };
  c.save(); c.beginPath(); c.rect(X, Y, T, T); c.clip();
  var g = c.createLinearGradient(0, top, 0, Y + T);
  g.addColorStop(0, P.rock); g.addColorStop(1, P.rock2);
  c.beginPath(); c.moveTo(X, Y + T); c.lineTo(X, edge(0));
  for (k = 4; k <= T; k += 4) c.lineTo(X + k, edge(k));
  c.lineTo(X + T, Y + T); c.closePath(); c.fillStyle = g; c.fill();
  c.strokeStyle = P.rock2; c.lineWidth = 1;
  c.beginPath();
  for (k = 0; k <= T; k += 4) { var sy = top + 7 + (noise1((x + k / T) * 1.1, y, 79) - 0.5) * 4; if (k) c.lineTo(X + k, sy); else c.moveTo(X + k, sy); }
  c.stroke();
  c.fillStyle = P.shade; c.globalAlpha = 0.2; c.fillRect(X, Y + T - 3, T, 3); c.globalAlpha = 1;
  c.beginPath(); c.moveTo(X, edge(0));
  for (k = 4; k <= T; k += 4) c.lineTo(X + k, edge(k));
  c.strokeStyle = P.ink; c.lineWidth = 1.6; c.stroke();
  c.restore();
}
/** what stands higher throws a little shade on the ground at its foot */
function footShade(c: Ctx, P: Palette, x: number, y: number) {
  var X = x * T, Y = y * T, g = c.createLinearGradient(0, Y, 0, Y + 12);
  g.addColorStop(0, P.shade); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.save(); c.globalAlpha = 0.2; c.fillStyle = g; c.fillRect(X, Y, T, 12); c.restore();
}
/** the relief of a piece of the map, over its outlines */
function relief(c: Ctx, map: GroundMap, P: Palette, x0: number, y0: number, x1: number, y1: number) {
  for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
    var g = map.cell(x, y).g;
    if (g === 'scarp') scarp(c, map, P, x, y);
    else if (hillEnds(map, x, y)) hillFace(c, P, x, y);
    else if (y > 0 && g !== 'hill' && (map.cell(x, y - 1).g === 'scarp' || hillEnds(map, x, y - 1))) footShade(c, P, x, y);
  }
}

/* The ballpoint outline wherever two kinds of ground meet. Corners are rounded off: where a tile sticks out of the
   other three around a corner, that corner goes to the other ground and the line curves, so a coast, a beach or a
   square reads as a shape and not as a staircase of squares. Railways, walls, floors, piers and the polygonal walls
   keep their square corners. Every vertex draws half of each edge that ends on it, so pieces of the map drawn
   apart meet exactly. */
const ROUND: Record<string, boolean> = { g: true, p: true, r: true, s: true, w: true, st: true, h: true, pv: true, c: true, fr: true };
function outlines(c: Ctx, map: GroundMap, P: Palette, x0: number, y0: number, x1: number, y1: number) {
  var G = function (x: number, y: number) { return x < 0 || y < 0 || x >= map.w || y >= map.h ? null : GROUP[map.cell(x, y).g]; };
  var ink = function (a: string | null, b: string | null) { return a === 'fr' || b === 'fr' ? P.far2 : P.ink; };
  var h = T / 2;
  c.lineWidth = 1.8;
  for (var y = y0; y <= y1 + 1; y++) for (var x = x0; x <= x1 + 1; x++) {
    var tl = G(x - 1, y - 1), tr = G(x, y - 1), bl = G(x - 1, y), br = G(x, y), X = x * T, Y = y * T;
    var up = tl != null && tr != null && tl !== tr, down = bl != null && br != null && bl !== br;
    var left = tl != null && bl != null && tl !== bl, right = tr != null && br != null && tr !== br;
    if ((up ? 1 : 0) + (down ? 1 : 0) + (left ? 1 : 0) + (right ? 1 : 0) === 2 && (up || down) && (left || right)) {
      /* the tile that sticks out, and the one across the corner from it (the ground of the other three) */
      var odd = G(left ? x - 1 : x, up ? y - 1 : y), mx = left ? x : x - 1, my = up ? y : y - 1, other = G(mx, my);
      if (odd && other && ROUND[odd] && ROUND[other]) {
        var ay = up ? Y - h : Y + h, bx = left ? X - h : X + h;
        c.beginPath(); c.moveTo(X, ay); c.quadraticCurveTo(X, Y, bx, Y); c.lineTo(X, Y); c.closePath();
        c.fillStyle = groundFill(P, map.cell(mx, my).g); c.fill();
        c.strokeStyle = ink(odd, other);
        c.beginPath(); c.moveTo(X, ay); c.quadraticCurveTo(X, Y, bx, Y); c.stroke();
        continue;
      }
    }
    if (up) { c.strokeStyle = ink(tl, tr); c.beginPath(); c.moveTo(X, Y); c.lineTo(X, Y - h); c.stroke(); }
    if (down) { c.strokeStyle = ink(bl, br); c.beginPath(); c.moveTo(X, Y); c.lineTo(X, Y + h); c.stroke(); }
    if (left) { c.strokeStyle = ink(tl, bl); c.beginPath(); c.moveTo(X, Y); c.lineTo(X - h, Y); c.stroke(); }
    if (right) { c.strokeStyle = ink(tr, br); c.beginPath(); c.moveTo(X, Y); c.lineTo(X + h, Y); c.stroke(); }
  }
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
  /* first every colour, then every texture (which may reach into the tiles around), then the outlines */
  for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) { c.fillStyle = groundFill(P, map.cell(x, y).g); c.fillRect(x * T, y * T, T, T); }
  for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) texture(c, map, P, x, y);
  outlines(c, map, P, x0, y0, x1, y1);
  relief(c, map, P, x0, y0, x1, y1);
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

/** the blades of tall grass in front of someone standing in it, drawn over their feet (X, Y: the tile's corner) */
export function tallFront(c: Ctx, X: number, Y: number, P: Palette) {
  for (var k = 0; k < 3; k++) {
    var bx = X + 6 + k * 10, by = Y + T + 1;
    c.beginPath();
    c.moveTo(bx - 5, by); c.quadraticCurveTo(bx - 4, by - 5, bx - 6, by - 9); c.quadraticCurveTo(bx - 1, by - 5, bx, by - 12);
    c.quadraticCurveTo(bx + 2, by - 5, bx + 6, by - 9); c.quadraticCurveTo(bx + 4, by - 4, bx + 5, by); c.closePath();
    fillStroke(c, k % 2 ? P.leaf2 : P.hedge, P.ink, 1.2);
  }
}
const DECO: Record<string, DecoFn> = {
  /* a retaining wall and a ledge are faces of a terrace: they are drawn with the relief */
  wall: function () { /* see scarp */ },
  tartan: function () { /* see GROUND_OBJ.track */ },
  ledge: function () { /* see scarp */ },
  /* a macera, the dry-stone wall that holds an olive terrace: along the slope, or down it where the walls above and
     below say so */
  macera: function (c, X, Y, P, x, y, map) {
    var is = function (a: number, b: number) { var q = map.cell(a, b); return q.deco === 'macera' || q.g === 'scarp'; };
    var down = (is(x, y - 1) || is(x, y + 1)) && !is(x - 1, y) && !is(x + 1, y), k: number;
    for (k = 0; k < 6; k++) {
      var row = k % 2, n = Math.floor(k / 2), w = 9 + hash(x, y, 90 + k) * 4, h = 5.5 + hash(x, y, 96 + k) * 2;
      var sx = down ? X + 9 + row * 7 + hash(x, y, 102 + k) * 2 : X + 1 + n * 10.5 + row * 5, sy = down ? Y + 1 + n * 10.5 + row * 5 : Y + 11 + row * 6 + hash(x, y, 102 + k) * 2;
      rr(c, sx, sy, down ? h + 2 : w, down ? w : h, 2.6); fillStroke(c, row ? P.rock : P.stone, P.ink, 1.1);
    }
  },
  /* water you can wade through: lighter, with stones showing under it */
  ford: function (c, X, Y, P, x, y) {
    c.globalAlpha = 0.45; c.fillStyle = P.sea2; c.fillRect(X, Y, T, T); c.globalAlpha = 0.5;
    for (var k = 0; k < 3; k++) { ell(c, X + 5 + hash(x, y, 160 + k) * 22, Y + 5 + hash(x, y, 170 + k) * 22, 3 + hash(x, y, 180 + k) * 2, 2); c.fillStyle = P.stone; c.fill(); }
    c.globalAlpha = 1;
  },
  /* tall grass, where the wild creatures hide: four tufts of long blades that fill the tile */
  tall: function (c, X, Y, P, x, y) {
    for (var k = 0; k < 4; k++) {
      var bx = X + 8 + (k % 2) * 15 + (hash(x, y, 130 + k) - 0.5) * 4, by = Y + 15 + Math.floor(k / 2) * 14 + hash(x, y, 140 + k) * 2;
      c.beginPath();
      c.moveTo(bx - 6, by + 1); c.quadraticCurveTo(bx - 5, by - 6, bx - 8, by - 11); c.quadraticCurveTo(bx - 2, by - 6, bx - 1, by - 14);
      c.quadraticCurveTo(bx + 2, by - 6, bx + 7, by - 11); c.quadraticCurveTo(bx + 5, by - 5, bx + 6, by + 1); c.closePath();
      fillStroke(c, k % 3 ? P.hedge : P.leaf2, P.ink, 1.2);
    }
  },
  /* the scogli of the beach, where the wild creatures of the sea hide: slabs of grey limestone, flat on top and dark
     on their south side, with the pools of sea water between them, an urchin, a starfish, now and then a little crab */
  pools: function (c, X, Y, P, x, y) {
    var h = function (k: number) { return hash(x, y, 400 + k); };
    /* the pool first, low between the rocks */
    var px = X + 10 + h(1) * 12, py = Y + 13 + h(2) * 8, pr = 6 + h(3) * 3;
    ell(c, px, py, pr + 1.5, pr * 0.62 + 1.5); fillStroke(c, P.sand2, P.ink, 1.1);
    ell(c, px, py, pr, pr * 0.62); c.fillStyle = P.sea; c.fill();
    c.fillStyle = P.sea2; ell(c, px - 1, py + 1, pr * 0.6, pr * 0.3); c.fill();
    c.strokeStyle = P.foam; c.lineWidth = 1; c.beginPath(); c.ellipse(px, py, pr - 1.2, pr * 0.62 - 1.2, 0, Math.PI * 1.1, Math.PI * 1.7); c.stroke();
    var life = h(4);
    if (life < 0.35) {
      /* an urchin */
      c.strokeStyle = P.ink; c.lineWidth = 0.9;
      for (var k = 0; k < 8; k++) { var a = k * 0.785; c.beginPath(); c.moveTo(px + 1, py); c.lineTo(px + 1 + Math.cos(a) * 3.4, py + Math.sin(a) * 2.6); c.stroke(); }
      circle(c, px + 1, py, 1.9); fillStroke(c, '#3b2d4d', P.ink, 0.8);
    } else if (life < 0.6) {
      /* a starfish */
      c.beginPath();
      for (k = 0; k < 10; k++) { var ra = k % 2 ? 1.3 : 3.4, aa = -1.571 + k * 0.628; c.lineTo(px + Math.cos(aa) * ra, py + Math.sin(aa) * ra * 0.8); }
      c.closePath(); fillStroke(c, '#ff8a5c', P.ink, 0.9);
    } else if (life < 0.7) {
      /* a little crab, sideways */
      ell(c, px, py, 2.6, 1.8); fillStroke(c, '#e5533d', P.ink, 0.9);
      c.strokeStyle = P.ink; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px - 2.4, py - 1); c.lineTo(px - 4, py - 3); c.moveTo(px + 2.4, py - 1); c.lineTo(px + 4, py - 3); c.stroke();
    }
    /* the slabs round it: flat tops, the shadow of their south face, cracks; seaweed where the water reaches */
    var slabs = [[5 + h(5) * 3, 7 + h(6) * 3, 7 + h(7) * 2.5], [26 + h(8) * 2, 9 + h(9) * 4, 6.5 + h(10) * 2.5], [18 + h(11) * 5, 27 + h(12) * 2, 7 + h(13) * 2]].concat(h(14) < 0.5 ? [[4 + h(15) * 3, 25, 4.5 + h(16) * 1.5]] : []);
    slabs.forEach(function (sl, q) {
      var sx = X + sl[0], sy = Y + sl[1], sr = sl[2];
      var outline = function () {
        c.beginPath();
        for (var v = 0; v < 7; v++) { var av = v / 7 * Math.PI * 2, rv = sr * (0.8 + hash(x * 7 + q, y * 3 + v, 410) * 0.35); c.lineTo(sx + Math.cos(av) * rv * 1.25, sy + Math.sin(av) * rv * 0.85); }
        c.closePath();
      };
      c.fillStyle = P.rock2; c.save(); c.translate(0, 2.2); outline(); c.restore(); c.fill();
      outline(); fillStroke(c, P.rock, P.ink, 1.2);
      c.fillStyle = '#ffffff'; c.globalAlpha = 0.3; ell(c, sx - sr * 0.3, sy - sr * 0.3, sr * 0.55, sr * 0.3); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = P.rock3; c.lineWidth = 0.9; c.beginPath(); c.moveTo(sx - sr * 0.2, sy - sr * 0.5); c.lineTo(sx + sr * 0.1, sy + sr * 0.1); c.lineTo(sx + sr * 0.5, sy + sr * 0.3); c.stroke();
      if (hash(x, y, 420 + q) < 0.4) { c.strokeStyle = P.weed; c.lineWidth = 1.4; c.beginPath(); c.moveTo(sx - sr * 0.6, sy + sr * 0.75); c.quadraticCurveTo(sx - sr * 0.3, sy + sr * 0.3, sx - sr * 0.8, sy + sr * 0.1); c.stroke(); }
    });
  },
  flowers: function (c, X, Y, P, x, y) {
    for (var k = 0; k < 3; k++) {
      var fx = X + 6 + hash(x, y, 90 + k) * 20, fy = Y + 6 + hash(x, y, 95 + k) * 20, col = k % 2 ? P['flower-a'] : P['flower-b'];
      for (var a = 0; a < 5; a++) { circle(c, fx + Math.cos(a * 1.256) * 2.4, fy + Math.sin(a * 1.256) * 2.4, 1.7); c.fillStyle = col; c.fill(); }
      circle(c, fx, fy, 1.2); c.fillStyle = '#fff3a0'; c.fill();
    }
  },
  /* the railing of Parco la Fontana: iron bars with spear tips on a low stone kerb, joined to the next piece of it
     (seen edge on where it runs down the map) */
  fence: function (c, X, Y, P, x, y, map) {
    var is = function (a: number, b: number) { var d = map.cell(a, b).deco; return d === 'fence' || d === 'gate'; };
    var down = is(x, y - 1) || is(x, y + 1), across = is(x - 1, y) || is(x + 1, y) || !down, k: number;
    /* a piece alone, between two palazzi, runs across from one to the other */
    if (down) {
      var y0 = is(x, y - 1) ? Y : Y + 8, y1 = is(x, y + 1) ? Y + T : Y + 24;
      rr(c, X + 12, y0, 8, y1 - y0, 1.5); fillStroke(c, P.stone, P.ink, 1.2);
      c.strokeStyle = P.ink; c.lineWidth = 1.6;
      for (k = y0 + 3; k < y1; k += 6) { c.beginPath(); c.moveTo(X + 16, k + 2); c.lineTo(X + 16, k - 6); c.stroke(); }
      c.lineWidth = 1; c.beginPath(); c.moveTo(X + 16, y0 - 4); c.lineTo(X + 16, y1 - 4); c.stroke();
    }
    if (across) {
      var x0 = is(x - 1, y) || !down ? X : X + 12, x1 = is(x + 1, y) || !down ? X + T : X + 20;
      c.strokeStyle = P.ink; c.lineWidth = 1.4;
      for (k = x0 + 2; k < x1; k += 4) { c.beginPath(); c.moveTo(k, Y + 21); c.lineTo(k, Y + 6); c.stroke(); poly(c, [[k - 1.6, Y + 6.5], [k, Y + 3], [k + 1.6, Y + 6.5]]); c.fillStyle = P.ink; c.fill(); }
      c.lineWidth = 1.2; c.beginPath(); c.moveTo(x0, Y + 9); c.lineTo(x1, Y + 9); c.moveTo(x0, Y + 17); c.lineTo(x1, Y + 17); c.stroke();
      rr(c, x0, Y + 20, x1 - x0, 6, 1.5); fillStroke(c, P.stone, P.ink, 1.2);
    }
  },
  /* a locked gate of the park: two leaves of bars between stone pillars, the chain and the padlock in the middle */
  gate: function (c, X, Y, P, x, y, map) {
    var is = function (a: number, b: number) { var d = map.cell(a, b).deco; return d === 'fence' || d === 'gate'; };
    var down = (is(x, y - 1) || is(x, y + 1)) && !(is(x - 1, y) || is(x + 1, y)), k: number;
    if (down) {
      [Y + 1, Y + T - 9].forEach(function (py) { rr(c, X + 10, py, 12, 8, 1.5); fillStroke(c, P.stone, P.ink, 1.3); });
      c.strokeStyle = P.ink; c.lineWidth = 1.3;
      for (k = Y + 11; k < Y + T - 10; k += 3) { c.beginPath(); c.moveTo(X + 13, k); c.lineTo(X + 19, k); c.stroke(); }
      c.beginPath(); c.moveTo(X + 16, Y + 9); c.lineTo(X + 16, Y + T - 9); c.stroke();
    } else {
      [X, X + T - 6].forEach(function (px) { rr(c, px, Y + 2, 6, 24, 1.5); fillStroke(c, P.stone, P.ink, 1.3); rr(c, px - 1, Y + 1, 8, 4, 1); fillStroke(c, P.stone2, P.ink, 1); });
      c.strokeStyle = P.ink; c.lineWidth = 1.4;
      for (k = X + 8; k < X + T - 7; k += 3.2) { c.beginPath(); c.moveTo(k, Y + 24); c.lineTo(k, Y + 7); c.stroke(); }
      c.beginPath(); c.moveTo(X + 6, Y + 8); c.quadraticCurveTo(X + T / 2, Y + 3, X + T - 6, Y + 8); c.moveTo(X + 6, Y + 18); c.lineTo(X + T - 6, Y + 18); c.stroke();
    }
    /* the chain and the padlock */
    c.strokeStyle = P.chrome; c.lineWidth = 1.6; c.beginPath(); c.moveTo(X + 11, Y + 13); c.quadraticCurveTo(X + 16, Y + 18, X + 21, Y + 13); c.stroke();
    rr(c, X + 13, Y + 15, 6, 6, 1.2); fillStroke(c, '#ffd166', P.ink, 1);
  },
  /* the back door of Antonio's flat: a door in the wall on the left, the mat in front of it */
  backdoor: function (c, X, Y, P) {
    rr(c, X + 1, Y + 1, 7, T - 4, 1.5); fillStroke(c, P.wood2, P.ink, 1.4);
    circle(c, X + 6, Y + T / 2, 1.1); c.fillStyle = P.ink; c.fill();
    rr(c, X + 9, Y + 9, T - 14, 13, 3); fillStroke(c, P['roof-a'], P.ink, 1.2);
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
  /* the scogli: a mass of grey limestone that joins the next one into a reef, cut by cracks, its south face in shadow,
     the wet dark band and the seaweed at the waterline, barnacles, and the white of the foam all round where the sea
     touches it */
  rocks: function (c, X, Y, P, x, y, map) {
    var is = function (a: number, b: number) { return a >= 0 && b >= 0 && a < map.w && b < map.h && map.cell(a, b).deco === 'rocks'; };
    var n = is(x, y - 1), so = is(x, y + 1), w = is(x - 1, y), e = is(x + 1, y), h = function (k: number) { return hash(x, y, 300 + k); };
    var l = X + (w ? -3 : 3 + h(1) * 4), r = X + T + (e ? 3 : -3 - h(2) * 4), t = Y + (n ? -4 : 5 + h(3) * 4), b = Y + T + (so ? 2 : -4 - h(4) * 3);
    /* the outline: along each side, jagged where the sea is, straight where the reef goes on */
    var pts: number[][] = [], side = function (x0: number, y0: number, x1: number, y1: number, wet: boolean, k: number) {
      for (var q = 0; q < 4; q++) {
        var f = q / 4, px = x0 + (x1 - x0) * f, py = y0 + (y1 - y0) * f, jit = wet && q ? (h(k + q) - 0.5) * 6 : 0;
        pts.push([px + (y1 - y0 ? jit : 0), py + (x1 - x0 ? jit : 0)]);
      }
    };
    side(l, t, r, t, !n, 10); side(r, t, r, b, !e, 20); side(r, b, l, b, !so, 30); side(l, b, l, t, !w, 40);
    var path = function () {
      c.beginPath();
      var m0 = [(pts[0][0] + pts[pts.length - 1][0]) / 2, (pts[0][1] + pts[pts.length - 1][1]) / 2];
      c.moveTo(m0[0], m0[1]);
      for (var q = 0; q < pts.length; q++) { var p0 = pts[q], p1 = pts[(q + 1) % pts.length]; c.quadraticCurveTo(p0[0], p0[1], (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2); }
      c.closePath();
    };
    /* the foam where the sea breaks on it, and a few drops of spray */
    if (!(n && so && w && e)) {
      path(); c.strokeStyle = P.foam; c.globalAlpha = 0.75; c.lineWidth = 6; c.stroke(); c.globalAlpha = 1;
      c.fillStyle = P.foam;
      for (var k = 0; k < 3; k++) if (h(50 + k) < 0.6) { circle(c, X + 3 + h(55 + k) * 26, so ? Y + 2 + h(58 + k) * 6 : Y + T - 2 - h(58 + k) * 3, 1 + h(61 + k)); c.fill(); }
    }
    path(); fillStroke(c, P.rock, P.ink, 1.5);
    c.save(); path(); c.clip();
    /* the south face in shadow, the wet band and the seaweed at the waterline */
    if (!so) {
      c.fillStyle = P.rock2; c.fillRect(X - 4, b - 9, T + 8, 12);
      c.fillStyle = P.rock3; c.globalAlpha = 0.55; c.fillRect(X - 4, b - 3.5, T + 8, 5); c.globalAlpha = 1;
      c.strokeStyle = P.weed; c.lineWidth = 1.6;
      for (k = 0; k < 4; k++) { var wx = l + 3 + h(70 + k) * (r - l - 6); c.beginPath(); c.moveTo(wx, b + 1); c.quadraticCurveTo(wx + 2, b - 3, wx - 1, b - 5 - h(75 + k) * 2); c.stroke(); }
    }
    /* lighter facets on top, as the sun takes the stone */
    c.fillStyle = '#ffffff'; c.globalAlpha = 0.28;
    poly(c, [[l + 4 + h(80) * 6, t + 3], [l + 14 + h(81) * 6, t + 2], [l + 16 + h(82) * 4, t + 10 + h(83) * 4], [l + 5, t + 11]]); c.fill();
    if (h(84) < 0.6) { poly(c, [[r - 12, t + 6 + h(85) * 4], [r - 4, t + 5], [r - 5, t + 13], [r - 13, t + 14]]); c.fill(); }
    c.globalAlpha = 1;
    /* cracks, the pits of the limestone, barnacles */
    c.strokeStyle = P.rock3; c.lineWidth = 1;
    c.beginPath(); var cx0 = l + 6 + h(90) * (r - l - 12), cy0 = t + 3;
    c.moveTo(cx0, cy0); c.lineTo(cx0 + (h(91) - 0.5) * 6, cy0 + 7); c.lineTo(cx0 + (h(92) - 0.5) * 10, cy0 + 14); c.stroke();
    if (h(93) < 0.5) { c.beginPath(); c.moveTo(r - 3, t + 12 + h(94) * 5); c.lineTo(r - 9 - h(95) * 4, t + 16 + h(96) * 3); c.stroke(); }
    c.fillStyle = P.rock3; c.globalAlpha = 0.45;
    for (k = 0; k < 4; k++) { circle(c, l + 4 + h(100 + k) * (r - l - 8), t + 4 + h(105 + k) * (b - t - 14), 0.9 + h(110 + k) * 0.8); c.fill(); }
    c.globalAlpha = 1;
    if (!so) { c.fillStyle = P.stone; for (k = 0; k < 3; k++) { circle(c, l + 5 + h(120 + k) * (r - l - 10), b - 6 - h(125 + k) * 2, 1.1); c.fill(); } }
    c.restore();
  },
  /* a parking bay of Largo Paone: the white lines between the bays, and across their far end */
  stall: function (c, X, Y, P, x, y, map) {
    var st = function (a: number, b: number) { return map.cell(a, b).deco === 'stall'; };
    c.fillStyle = P.line; c.globalAlpha = 0.85;
    c.fillRect(X, Y + (st(x, y - 1) ? 0 : 2), 1.6, T - (st(x, y - 1) ? 0 : 2) - (st(x, y + 1) ? 0 : 2));
    if (!st(x + 1, y)) c.fillRect(X + T - 1.6, Y + 2, 1.6, T - 4);
    if (st(x, y - 1)) c.fillRect(X, Y - 0.8, T, 1.6);
    c.globalAlpha = 1;
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
  /* fishing nets spread out to dry on the quay of Mola, with their floats */
  nets: function (c, X, Y, P, x, y) {
    c.strokeStyle = P.ink; c.globalAlpha = 0.45; c.lineWidth = 0.8;
    for (var k = 0; k < 6; k++) { c.beginPath(); c.moveTo(X + 3 + k * 5, Y + 5); c.lineTo(X + 1 + k * 5, Y + 27); c.stroke(); c.beginPath(); c.moveTo(X + 3, Y + 5 + k * 4); c.lineTo(X + 29, Y + 7 + k * 4); c.stroke(); }
    c.globalAlpha = 1;
    for (k = 0; k < 4; k++) { circle(c, X + 6 + k * 7, Y + 5 + hash(x, y, 210 + k) * 3, 2); fillStroke(c, k % 2 ? '#ff8a3c' : '#ffd166', P.ink, 0.9); }
  },
  /* a pub table seen from above: four stools, the round top, two mugs */
  table: function (c, X, Y, P) {
    [[5, 5], [T - 5, 5], [5, T - 5], [T - 5, T - 5]].forEach(function (q) { circle(c, X + q[0], Y + q[1], 3.6); fillStroke(c, P.wood2, P.ink, 1.2); });
    circle(c, X + 16, Y + 16, 11); fillStroke(c, P.wood, P.ink, 1.6);
    c.strokeStyle = P.wood2; c.lineWidth = 1; c.beginPath(); c.arc(X + 16, Y + 16, 7, 0.4, 2.4); c.stroke();
    circle(c, X + 12, Y + 14, 3); fillStroke(c, '#ffd166', P.ink, 1.1); circle(c, X + 20, Y + 18, 3); fillStroke(c, '#c96b2c', P.ink, 1.1);
  },
  /* a café table outside the Gelateria Lavezzi: a white round top, two chairs, two cups of gelato */
  cafe: function (c, X, Y, P) {
    [[7, 16], [T - 7, 16]].forEach(function (q) { rr(c, X + q[0] - 4.5, Y + q[1] - 4.5, 9, 9, 2.5); fillStroke(c, P.wood2, P.ink, 1.2); });
    circle(c, X + 16, Y + 16, 9.5); fillStroke(c, '#fffdf6', P.ink, 1.6);
    circle(c, X + 13, Y + 14, 2.8); fillStroke(c, '#ff9fb2', P.ink, 1); circle(c, X + 19.5, Y + 18, 2.8); fillStroke(c, '#fff3a0', P.ink, 1);
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
  /* the things in the covi of the friends (data/maps/covi.ts): render/canvas/covo.ts */
  'covo-prop': function (c, o, P) { covoProp(c, o, P); },
  /* the things that say whose home it is (data/maps/homes.ts): o.text is which */
  'home-prop': function (c, o, P) {
    var w = o.w * T, h = o.h * T, k;
    c.save(); c.translate(o.x * T + w / 2, o.y * T + h / 2); c.lineCap = 'round'; c.lineJoin = 'round';
    ell(c, 0, h / 2 - 5, Math.min(w, h * 2) / 2 - 5, 3.5); c.fillStyle = P.shadow; c.fill();
    if (o.text === 'speaker') {
      rr(c, -10, -15, 20, 28, 3); fillStroke(c, P.case, P.ink, 1.6);
      circle(c, 0, 4, 6.5); fillStroke(c, P.tyre, P.ink, 1.2); circle(c, 0, 4, 2.2); fillStroke(c, P.case2, P.ink, 0.8);
      circle(c, 0, -8, 3); fillStroke(c, P.tyre, P.ink, 1);
    } else if (o.text === 'decks') {
      rr(c, -w / 2 + 4, -12, w - 8, 24, 3); fillStroke(c, P.case, P.ink, 1.6);
      [-1, 1].forEach(function (d) { circle(c, d * (w / 2 - 20), 0, 9.5); fillStroke(c, P.tyre, P.ink, 1.2); circle(c, d * (w / 2 - 20), 0, 3); fillStroke(c, P.tail, P.ink, 0.8); });
      rr(c, -9, -8, 18, 16, 2); fillStroke(c, P.case2, P.ink, 1.1);
      for (k = 0; k < 3; k++) { c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(-5 + k * 5, -5); c.lineTo(-5 + k * 5, 5); c.stroke(); circle(c, -5 + k * 5, -3 + k * 3, 1.6); fillStroke(c, P.beam, P.ink, 0.7); }
    } else if (o.text === 'barber-chair') {
      /* a barber's chair from the front: the chrome foot, the red seat and back, the armrests, the headrest */
      c.strokeStyle = P.ink; c.lineWidth = 3.2; c.beginPath(); c.moveTo(0, 6); c.lineTo(0, 11); c.stroke();
      ell(c, 0, 12, 8, 2.6); fillStroke(c, P.chrome, P.ink, 1.2);
      rr(c, -8, -9, 16, 13, 3); fillStroke(c, P.tail, P.ink, 1.5);
      rr(c, -9.5, 2, 19, 5.5, 2.5); fillStroke(c, P.tail, P.ink, 1.5);
      [-1, 1].forEach(function (d) { rr(c, d * 10.5 - 2, -3, 4, 8, 1.8); fillStroke(c, P.chrome, P.ink, 1.1); });
      rr(c, -4.5, -14, 9, 5.5, 2); fillStroke(c, P.case, P.ink, 1.2);
    } else if (o.text === 'mirror') {
      rr(c, -11, -14, 22, 20, 3); fillStroke(c, P.wood2, P.ink, 1.5);
      rr(c, -8.5, -11.5, 17, 15, 2); fillStroke(c, P.far, P.ink, 1);
      c.strokeStyle = P.glint; c.lineWidth = 1.6; c.globalAlpha = 0.8; c.beginPath(); c.moveTo(-5, 0); c.lineTo(2, -9); c.moveTo(0, 1); c.lineTo(5, -5); c.stroke(); c.globalAlpha = 1;
      rr(c, -10, 8, 20, 4, 1.5); fillStroke(c, P.wood, P.ink, 1.1);
    } else if (o.text === 'glasses') {
      [-1, 1].forEach(function (d) { rr(c, d * 7.5 - 6, -5, 12, 9, 3); fillStroke(c, P['shutter-a'], P.ink, 1.8); });
      c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-1.5, -1); c.lineTo(1.5, -1); c.stroke();
    } else if (o.text === 'roma') {
      rr(c, -w / 2 + 6, -9, w - 12, 18, 2); fillStroke(c, P['roof-a'], P.ink, 1.5);
      c.fillStyle = P.beam; c.fillRect(-w / 2 + 7, -3, w - 14, 6);
      c.strokeStyle = P.ink; c.lineWidth = 1; for (k = 0; k < 5; k++) { c.beginPath(); c.moveTo(w / 2 - 6, -7 + k * 3.5); c.lineTo(w / 2 - 2, -7 + k * 3.5); c.stroke(); }
    } else if (o.text === 'trophies') {
      [-1, 0, 1].forEach(function (d) {
        var x = d * (w / 3 - 2), big = d === 0 ? 1.25 : 1;
        c.beginPath(); c.moveTo(x - 5 * big, -9 * big); c.lineTo(x + 5 * big, -9 * big); c.quadraticCurveTo(x + 4 * big, 1, x, 2); c.quadraticCurveTo(x - 4 * big, 1, x - 5 * big, -9 * big); c.closePath(); fillStroke(c, P.beam, P.ink, 1.3);
        c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(x, 2); c.lineTo(x, 7); c.stroke();
        rr(c, x - 4.5, 7, 9, 3.5, 1); fillStroke(c, P.wood2, P.ink, 1);
      });
    } else if (o.text === 'racket') {
      ell(c, 0, -h / 2 + 16, 9, 12.5); fillStroke(c, P.blinker, P.ink, 1.7);
      c.strokeStyle = P.line; c.lineWidth = 0.9; for (k = -1; k <= 1; k++) { c.beginPath(); c.moveTo(k * 4.5, -h / 2 + 6); c.lineTo(k * 4.5, -h / 2 + 26); c.moveTo(-7, -h / 2 + 16 + k * 5); c.lineTo(7, -h / 2 + 16 + k * 5); c.stroke(); }
      c.strokeStyle = P.ink; c.lineWidth = 3.4; c.beginPath(); c.moveTo(0, -h / 2 + 29); c.lineTo(0, h / 2 - 8); c.stroke();
    } else if (o.text === 'weights') {
      c.strokeStyle = P.ink; c.lineWidth = 4; c.beginPath(); c.moveTo(-w / 2 + 12, 0); c.lineTo(w / 2 - 12, 0); c.stroke();
      c.strokeStyle = P.chrome; c.lineWidth = 2; c.beginPath(); c.moveTo(-w / 2 + 14, 0); c.lineTo(w / 2 - 14, 0); c.stroke();
      [-1, 1].forEach(function (d) { rr(c, d * (w / 2 - 12) - 5, -11, 10, 22, 3); fillStroke(c, P.case, P.ink, 1.5); rr(c, d * (w / 2 - 20) - 3, -8, 6, 16, 2); fillStroke(c, P.case2, P.ink, 1.2); });
    } else if (o.text === 'table') {
      /* a long table, three glasses and a vinyl sleeve: the Trinità sits here */
      rr(c, -w / 2 + 3, -10, w - 6, 18, 4); fillStroke(c, P.wood, P.ink, 1.6);
      c.strokeStyle = P.wood2; c.lineWidth = 1; c.beginPath(); c.moveTo(-w / 2 + 7, -4); c.lineTo(w / 2 - 7, -4); c.moveTo(-w / 2 + 7, 2); c.lineTo(w / 2 - 7, 2); c.stroke();
      [-1, 0, 1].forEach(function (d) { var x = d * (w / 2 - 14); rr(c, x - 3, -9, 6, 8, 1.5); fillStroke(c, P.far, P.ink, 1); c.fillStyle = P.beam; c.globalAlpha = 0.8; c.fillRect(x - 2, -5, 4, 3); c.globalAlpha = 1; });
      rr(c, -6, -1, 12, 8, 1); fillStroke(c, P.tail, P.ink, 1); circle(c, 0, 3, 2.4); fillStroke(c, P.tyre, P.ink, 0.8);
    } else if (o.text === 'plant') {
      rr(c, -6, 2, 12, 10, 2); fillStroke(c, P['roof-a'], P.ink, 1.4);
      c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(0, 3); c.quadraticCurveTo(2, -6, 7, -12); c.stroke();
      [[-4, -3, -0.6], [5, -7, 0.5], [2, -12, -0.3], [8, -13, 0.9], [-1, -8, -1]].forEach(function (l) { c.save(); c.translate(l[0], l[1]); c.rotate(l[2]); ell(c, 0, 0, 5, 2.6); fillStroke(c, P.grass2 || '#5f9a4f', P.ink, 1); c.restore(); });
    } else {
      /* papers: a few sheets, askew */
      [-0.2, 0.12].forEach(function (a, i) { c.save(); c.rotate(a); rr(c, -11 + i * 3, -9 + i * 2, 20, 16, 1); fillStroke(c, P.paper, P.ink, 1.1); c.strokeStyle = P.ink; c.globalAlpha = 0.5; c.lineWidth = 0.8; for (k = 0; k < 3; k++) { c.beginPath(); c.moveTo(-8 + i * 3, -5 + i * 2 + k * 4); c.lineTo(6 + i * 3, -5 + i * 2 + k * 4); c.stroke(); } c.restore(); });
    }
    c.restore();
  },
  banner: function (c, o, P) {
    var X = o.x * T + 2, Y = o.y * T + 2, W = o.w * T - 4, H = T - 12;
    c.beginPath(); c.moveTo(X, Y); c.lineTo(X + W, Y); c.lineTo(X + W, Y + H); c.lineTo(X + W / 2, Y + H + 4); c.lineTo(X, Y + H); c.closePath();
    fillStroke(c, o.color || P['roof-c'], P.ink, 1.6);
    c.fillStyle = '#1b1f2e'; c.font = '16px "Lilita One", "Arial Rounded MT Bold", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(o.text, X + W / 2, Y + H / 2 + 1);
  },
  /* a rug: o.color is a colour, or the name of one of the map's palette; an inner border, a fringe at both ends */
  rug: function (c, o, P) {
    var X = o.x * T + 4, Y = o.y * T + 5, W = o.w * T - 8, H = o.h * T - 10, k;
    rr(c, X, Y, W, H, 5); fillStroke(c, (P as unknown as Record<string, string>)[o.color || ''] || o.color || P['roof-b'], P.ink, 1.6);
    rr(c, X + 5, Y + 5, W - 10, H - 10, 2); c.strokeStyle = P.line; c.lineWidth = 1.2; c.globalAlpha = 0.75; c.stroke(); c.globalAlpha = 1;
    c.strokeStyle = P.ink; c.lineWidth = 1;
    for (k = 0; X + 4 + k * 5 < X + W - 2; k++) { c.beginPath(); c.moveTo(X + 4 + k * 5, Y - 3); c.lineTo(X + 4 + k * 5, Y); c.moveTo(X + 4 + k * 5, Y + H); c.lineTo(X + 4 + k * 5, Y + H + 3); c.stroke(); }
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
  /* the athletics track of the Olympic training centre, its long side down the map: six lanes of tartan two tiles
     wide (the generator makes the ground under them walkable: legend '7'), the finish line and the lane numbers on
     the home straight, the pitch in the middle */
  track: function (c, o, P) {
    var X = o.x * T + 3, Y = o.y * T + 3, W = o.w * T - 6, H = o.h * T - 6, R = W / 2, ring = T * 2 - 7, n = 6, k, d;
    rr(c, X, Y, W, H, R); rr(c, X + ring, Y + ring, W - ring * 2, H - ring * 2, R - ring, true);
    c.fillStyle = P.tartan; c.fill('evenodd');
    /* the tartan is a shade darker along its inner edge, where everybody runs */
    d = ring - ring / n; c.save();
    rr(c, X + d, Y + d, W - d * 2, H - d * 2, R - d); rr(c, X + ring, Y + ring, W - ring * 2, H - ring * 2, R - ring, true);
    c.fillStyle = P.tartan2; c.globalAlpha = 0.5; c.fill('evenodd'); c.restore();
    c.strokeStyle = P.line; c.lineWidth = 1.2; c.globalAlpha = 0.92;
    for (k = 1; k < n; k++) { d = ring * k / n; rr(c, X + d, Y + d, W - d * 2, H - d * 2, R - d); c.stroke(); }
    c.globalAlpha = 1;
    c.strokeStyle = P.ink; c.lineWidth = 1.8;
    rr(c, X, Y, W, H, R); c.stroke(); rr(c, X + ring, Y + ring, W - ring * 2, H - ring * 2, R - ring); c.stroke();
    /* the finish, on the straight by the stand; a start line up the straight */
    var fy = Y + H - R - 6, sy = Y + R + 6;
    c.strokeStyle = P.line; c.lineWidth = 3.2; c.beginPath(); c.moveTo(X + 1.5, fy); c.lineTo(X + ring - 1.5, fy); c.stroke();
    c.lineWidth = 1.6; c.beginPath(); c.moveTo(X + 1.5, sy); c.lineTo(X + ring - 1.5, sy); c.stroke();
    c.fillStyle = P.line; c.font = '700 8px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (k = 0; k < n; k++) c.fillText(String(n - k), X + ring * (k + 0.5) / n, fy - 8);
    /* the pitch: mown in stripes, its lines, the goals */
    var px = X + ring + 9, pw = W - ring * 2 - 18, py = Y + R - 16, ph = H - R * 2 + 32;
    c.save(); rr(c, px, py, pw, ph, 2); c.clip();
    c.fillStyle = P.grass2; c.globalAlpha = 0.28;
    for (k = 0; k * 22 < ph; k += 2) c.fillRect(px, py + k * 22, pw, 22);
    c.restore();
    c.strokeStyle = P.line; c.lineWidth = 1.6; c.globalAlpha = 0.9;
    c.strokeRect(px, py, pw, ph);
    c.beginPath(); c.moveTo(px, py + ph / 2); c.lineTo(px + pw, py + ph / 2); c.stroke();
    circle(c, px + pw / 2, py + ph / 2, 13); c.stroke();
    c.strokeRect(px + pw * 0.22, py, pw * 0.56, 20); c.strokeRect(px + pw * 0.22, py + ph - 20, pw * 0.56, 20);
    c.globalAlpha = 1; c.lineWidth = 2.2;
    c.strokeRect(px + pw * 0.38, py - 4, pw * 0.24, 4); c.strokeRect(px + pw * 0.38, py + ph, pw * 0.24, 4);
  },
  /* a hill village seen from far (Maranola, up in the Aurunci): houses in tiers and a bell tower */
  village: function (c, o, P) {
    var X = o.x * T, Y = o.y * T;
    for (var h = 0; h < 10; h++) {
      var hx = X + 8 + (h % 5) * 22 + hash(h, 1, 220) * 6, hy = Y + 12 + Math.floor(h / 5) * 26 - (h % 5 === 2 ? 8 : 0);
      rr(c, hx, hy, 18, 14, 2); fillStroke(c, h % 3 ? P.wall : P['wall-b'], P.ink, 1.2);
      poly(c, [[hx - 2, hy + 2], [hx + 9, hy - 6], [hx + 20, hy + 2]]); fillStroke(c, P['roof-a'], P.ink, 1.2);
      c.fillStyle = '#20263a'; c.fillRect(hx + 7, hy + 6, 4, 6);
    }
    var bx = X + 58, by = Y + 2;
    rr(c, bx, by, 10, 30, 1); fillStroke(c, P.stone, P.ink, 1.3);
    poly(c, [[bx - 1, by + 1], [bx + 5, by - 9], [bx + 11, by + 1]]); fillStroke(c, P['roof-a'], P.ink, 1.2);
    c.fillStyle = '#20263a'; rr(c, bx + 3, by + 6, 4, 6, 2); c.fill();
  },
  /* the Roman theatre of Castellone: the half circle of the cavea, its rows of seats, the houses built into it */
  cavea: function (c, o, P) {
    var cx = (o.x + o.w! / 2) * T, cy = (o.y + o.h!) * T - 4, R = Math.min(o.w! * T / 2, o.h! * T) - 2;
    c.lineCap = 'butt';
    for (var k = 0; k < 4; k++) {
      c.beginPath(); c.arc(cx, cy, R - k * 10, Math.PI, 0); c.strokeStyle = k % 2 ? P.stone : P.stone2; c.lineWidth = 9; c.stroke();
    }
    c.beginPath(); c.arc(cx, cy, R + 4, Math.PI, 0); c.strokeStyle = P.ink; c.lineWidth = 1.6; c.stroke();
    c.beginPath(); c.arc(cx, cy, R - 36, Math.PI, 0); c.lineWidth = 1.2; c.stroke();
    c.lineWidth = 1; c.globalAlpha = 0.5;
    for (var a = 1; a < 6; a++) { var ang = Math.PI + a * Math.PI / 6; c.beginPath(); c.moveTo(cx + Math.cos(ang) * (R - 36), cy + Math.sin(ang) * (R - 36)); c.lineTo(cx + Math.cos(ang) * (R + 4), cy + Math.sin(ang) * (R + 4)); c.stroke(); }
    c.globalAlpha = 1; c.lineCap = 'round';
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
