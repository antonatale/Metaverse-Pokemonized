/* How long a race at sea takes in today's wind, sailed well (data/sea.ts, story/movement.ts): the same rules as the
   board, a tile at a time on the grid, the heading the sum of the last four moves; each leg straight (moves spread
   evenly) or in two tacks, whichever is quicker. It sets the good time of a race and how fast Nicola sails it, so
   that a race in a light headwind is not lost before the start. Pure: no DOM, no clock. */
import { BOARD, SAIL, headingSail, boardTop, steadyHeading, type Wind } from './wind';

type P = [number, number];
/** the moves from a to b, the two kinds spread evenly */
function moves(a: P, b: P): P[] {
  var dx = b[0] - a[0], dy = b[1] - a[1], ax = Math.abs(dx), ay = Math.abs(dy), out: P[] = [], ex = 0, ey = 0;
  for (var i = 0; i < ax + ay; i++) {
    var fx = ax ? (ax - ex) / ax : 0, fy = ay ? (ay - ey) / ay : 0;
    if (fx >= fy && ex < ax) { out.push([Math.sign(dx), 0]); ex++; } else { out.push([0, Math.sign(dy)]); ey++; }
  }
  return out;
}
/** seconds for a string of moves, from a standstill */
export function movesTime(ms: P[], w: Wind): number {
  var gear = 0, t = 0, wake: P[] = [], prev: P | null = null;
  for (var i = 0; i < ms.length; i++) {
    var m = ms[i], before: P = [0, 0];
    wake.forEach(function (v) { before[0] += v[0]; before[1] += v[1]; });
    wake.push(m); if (wake.length > 4) wake.shift();
    var h: P = [0, 0];
    wake.forEach(function (v) { h[0] += v[0]; h[1] += v[1]; });
    var P0 = SAIL[headingSail(h, w)], top = boardTop(P0.gears, w.strength, 0);
    gear = prev && ((m[0] === prev[0] && m[1] === prev[1]) || steadyHeading(before, h)) ? Math.min(top, gear + 1) : Math.max(0, Math.min(top, gear - 2));
    prev = m;
    t += BOARD[gear] / (P0.speed * (0.8 + 0.3 * w.strength));
  }
  return t / 1000;
}
function leg(a: P, b: P, w: Wind): number {
  var best = movesTime(moves(a, b), w), dx = b[0] - a[0], dy = b[1] - a[1];
  [0.3, 0.5, 0.7].forEach(function (f) {
    [-1, 1].forEach(function (s) {
      [0.3, 0.5, 0.8].forEach(function (k) {
        var mid: P = [Math.round(a[0] + dx * f - dy * k * s), Math.round(a[1] + dy * f + dx * k * s)];
        best = Math.min(best, movesTime(moves(a, mid).concat(moves(mid, b)), w));
      });
    });
  });
  return best;
}
/** the race from `start` round `marks`, sailed well, in seconds */
export function raceTime(start: P, marks: P[], w: Wind): number {
  var t = 0, at = start;
  marks.forEach(function (m) { t += leg(at, m, w); at = m; });
  return t;
}
/** the length of a way, in tiles (Nicola sails it straight) */
export function wayLength(pts: P[]): number { var L = 0; for (var i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; }
