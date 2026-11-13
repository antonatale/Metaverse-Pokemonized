import type { Dir } from '../data/maps/types';
import { rideable, vanAt, type PreparedMap } from './maps';

/* Nicola's van on the map: the streets it drives along (the roads first, where it can; never steps, sand or sea), the
   street nearest to someone, and where it is parked once it has stopped. The drive itself, a step at a time with the
   camera following, is in story/movement.ts; its picture in render/canvas/van.ts. */

export type Tile = [number, number];
/** a tile the van can be on */
function drivable(m: PreparedMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
  return m.solid[y * m.w + x] !== 1 && rideable(m, x, y);
}
const isRoad = (m: PreparedMap, x: number, y: number) => m.cell(x, y).g === 'road';
/** the way from a to b over the streets, cheapest first: a road costs 1, anything else it can drive on 4, and every
    turn a little more, so it keeps to the streets and goes straight; null when b cannot be reached */
export function roadPath(m: PreparedMap, a: Tile, b: Tile): Tile[] | null {
  const W = m.w, N = W * m.h, cost = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), heap: number[] = [], hc: number[] = [];
  const push = (i: number, c: number) => { heap.push(i); hc.push(c); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (hc[p] <= hc[k]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; [hc[p], hc[k]] = [hc[k], hc[p]]; k = p; } };
  const pop = (): number => {
    const top = heap[0], li = heap.pop()!, lc = hc.pop()!;
    if (heap.length) { heap[0] = li; hc[0] = lc; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let s = k; if (l < heap.length && hc[l] < hc[s]) s = l; if (r < heap.length && hc[r] < hc[s]) s = r; if (s === k) break; [heap[s], heap[k]] = [heap[k], heap[s]]; [hc[s], hc[k]] = [hc[k], hc[s]]; k = s; } }
    return top;
  };
  const s0 = a[1] * W + a[0], goal = b[1] * W + b[0];
  cost[s0] = 0; push(s0, 0);
  const D = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (heap.length) {
    const i = pop(), x = i % W, y = (i - x) / W;
    if (i === goal) break;
    const pi = from[i], px = pi >= 0 ? pi % W : x, py = pi >= 0 ? (pi - px) / W : y;
    for (const [dx, dy] of D) {
      const nx = x + dx, ny = y + dy;
      if (!drivable(m, nx, ny)) continue;
      const j = ny * W + nx, turn = pi >= 0 && (x - px !== dx || y - py !== dy) ? 0.6 : 0;
      const c = cost[i] + (isRoad(m, nx, ny) ? 1 : 4) + turn;
      if (c < cost[j]) { cost[j] = c; from[j] = i; push(j, c); }
    }
  }
  if (cost[goal] === Infinity) return null;
  const out: Tile[] = [];
  for (let i = goal; i !== s0; i = from[i]) out.push([i % W, Math.floor(i / W)]);
  return out.reverse();
}
/** the road nearest to a tile, that the van can stop on (and someone can step out of it there) */
export function nearRoad(m: PreparedMap, x: number, y: number, r?: number, notOn?: boolean): Tile | null {
  const R = r || 14;
  let best: Tile | null = null, bd = Infinity;
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const xx = x + dx, yy = y + dy, d = Math.abs(dx) + Math.abs(dy) * 1.2;
    if (d >= bd || (notOn && Math.abs(dx) + Math.abs(dy) < 2) || !drivable(m, xx, yy) || !isRoad(m, xx, yy)) continue;
    best = [xx, yy]; bd = d;
  }
  return best;
}
/** a tile some way back along the road from t, where the van comes from */
export function backAlong(m: PreparedMap, t: Tile, n: number): Tile {
  const seen: Record<string, number> = {}, q: Tile[] = [t];
  seen[t[0] + ',' + t[1]] = 0;
  let far = t;
  while (q.length) {
    const c = q.shift()!, d = seen[c[0] + ',' + c[1]];
    if (d > seen[far[0] + ',' + far[1]]) far = c;
    if (d >= n) break;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c[0] + dx, ny = c[1] + dy, k = nx + ',' + ny;
      if (seen[k] != null || !drivable(m, nx, ny) || !isRoad(m, nx, ny)) continue;
      seen[k] = d + 1; q.push([nx, ny]);
    }
  }
  return far;
}
/** the way a step goes */
export function dirOf(dx: number, dy: number): Dir { return dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'; }
/** a free tile next to a tile, to step out of the van onto: toward `toward` if it can */
export function outOf(m: PreparedMap, t: Tile, toward: Tile, taken?: Tile): Tile | null {
  const c: Tile[] = [];
  for (let r = 1; r <= 3; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    const x = t[0] + dx, y = t[1] + dy;
    if (x < 0 || y < 0 || x >= m.w || y >= m.h || m.solid[y * m.w + x] === 1 || vanAt(m, x, y)) continue;
    const g = m.cell(x, y).g;
    if (g === 'sea' || (taken && taken[0] === x && taken[1] === y) || m.at[x + ',' + y]) continue;
    c.push([x, y]);
  }
  c.sort(function (p, q) { return (Math.hypot(p[0] - toward[0], p[1] - toward[1]) + Math.hypot(p[0] - t[0], p[1] - t[1]) * 2) - (Math.hypot(q[0] - toward[0], q[1] - toward[1]) + Math.hypot(q[0] - t[0], q[1] - t[1]) * 2); });
  return c[0] || null;
}
