import type { Dir } from '../data/maps/types';
import { rideable, blocked, moto, type PreparedMap } from './maps';
import { st } from '../save/story-progress';
import { vanBody, motoBody, overlaps } from './vehicle-space';
import { T } from '../render/canvas/draw';

/* Nicola's van on the map: the streets it drives along (the roads first, where it can; never steps, sand or sea), the
   street nearest to someone, and where it is parked once it has stopped. The drive itself, a step at a time with the
   camera following, is in story/movement.ts; its picture in render/canvas/van.ts. */

export type Tile = [number, number];
const buildingMasks = new WeakMap<PreparedMap, Uint8Array>();
function buildingMask(m: PreparedMap): Uint8Array {
  let mask = buildingMasks.get(m);
  if (mask) return mask;
  mask = new Uint8Array(m.w * m.h);
  for (const b of m.buildings || []) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) mask[y * m.w + x] = 1;
  buildingMasks.set(m, mask);
  return mask;
}
/** a tile the van can be on */
function drivable(m: PreparedMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
  return m.solid[y * m.w + x] !== 1 && rideable(m, x, y);
}
/** Reserve the whole vehicle, including the scooter's overhang into an adjacent tile. */
export function vanFits(m: PreparedMap, x: number, y: number, dir: Dir): boolean {
  if (!drivable(m, Math.round(x), Math.round(y))) return false;
  const box = vanBody(m, x, y, dir), scooter = moto();
  if (!m.inside && !st.sella && scooter.map === m.id && overlaps(box, motoBody(scooter.x, scooter.y))) return false;
  const walls = buildingMask(m);
  for (let yy = Math.floor(box.top / T); yy < Math.ceil(box.bottom / T); yy++) for (let xx = Math.floor(box.left / T); xx < Math.ceil(box.right / T); xx++) {
    if (!drivable(m, xx, yy) || walls[yy * m.w + xx]) return false;
  }
  return true;
}
const DIRS: Dir[] = ['right', 'left', 'down', 'up'];
const DELTAS: Tile[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
/** Clearance for the complete step, including a turn and changes in the centre of the road. */
export function vanStepFits(m: PreparedMap, a: Tile, b: Tile): boolean {
  const dir = dirOf(b[0] - a[0], b[1] - a[1]);
  for (let i = 0; i <= 4; i++) if (!vanFits(m, a[0] + (b[0] - a[0]) * i / 4, a[1] + (b[1] - a[1]) * i / 4, dir)) return false;
  return true;
}
const isRoad = (m: PreparedMap, x: number, y: number) => m.cell(x, y).g === 'road';
const wet = (m: PreparedMap, x: number, y: number) => x >= 0 && y >= 0 && x < m.w && y < m.h && m.cell(x, y).g === 'sea';
/** what it costs to drive a tile in a direction beyond the road itself: seen from in front or behind the van is wider
    than its tile, so a lane with the sea beside it (the lungomare over the darsena of Mola) puts half of it in the water.
    Where the road has another lane, it takes that one */
export function shoreCost(m: PreparedMap, x: number, y: number, dx: number): number {
  return dx === 0 && (wet(m, x - 1, y) || wet(m, x + 1, y)) ? 6 : 0;
}
/** the way from a to b over the streets, cheapest first: a road costs 1, anything else it can drive on 4, and every
    turn a little more, so it keeps to the streets and goes straight; null when b cannot be reached */
export function roadPath(m: PreparedMap, a: Tile, b: Tile): Tile[] | null {
  const W = m.w, N = W * m.h * 4, cost = new Float64Array(N).fill(Infinity), from = new Int32Array(N).fill(-1), heap: number[] = [], hc: number[] = [];
  const push = (i: number, c: number) => { heap.push(i); hc.push(c); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (hc[p] <= hc[k]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; [hc[p], hc[k]] = [hc[k], hc[p]]; k = p; } };
  const pop = (): number => {
    const top = heap[0], li = heap.pop()!, lc = hc.pop()!;
    if (heap.length) { heap[0] = li; hc[0] = lc; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let s = k; if (l < heap.length && hc[l] < hc[s]) s = l; if (r < heap.length && hc[r] < hc[s]) s = r; if (s === k) break; [heap[s], heap[k]] = [heap[k], heap[s]]; [hc[s], hc[k]] = [hc[k], hc[s]]; k = s; } }
    return top;
  };
  const start = a[1] * W + a[0], goal = b[1] * W + b[0];
  if (!drivable(m, ...a) || !drivable(m, ...b)) return null;
  for (let d = 0; d < 4; d++) if (vanFits(m, ...a, DIRS[d])) { cost[start * 4 + d] = 0; push(start * 4 + d, 0); }
  let end = -1;
  while (heap.length) {
    const i = pop(), cell = Math.floor(i / 4), x = cell % W, y = Math.floor(cell / W), facing = i % 4;
    if (cell === goal) { end = i; break; }
    for (let d = 0; d < 4; d++) {
      const [dx, dy] = DELTAS[d];
      const nx = x + dx, ny = y + dy;
      if (!drivable(m, nx, ny)) continue;
      const j = (ny * W + nx) * 4 + d, turn = from[i] >= 0 && facing !== d ? 0.6 : 0;
      const c = cost[i] + (isRoad(m, nx, ny) ? 1 : 4) + turn + shoreCost(m, nx, ny, dx);
      if (c < cost[j] && vanStepFits(m, [x, y], [nx, ny])) { cost[j] = c; from[j] = i; push(j, c); }
    }
  }
  if (end < 0) return null;
  const out: Tile[] = [];
  for (let i = end; from[i] >= 0; i = from[i]) { const cell = Math.floor(i / 4); out.push([cell % W, Math.floor(cell / W)]); }
  return out.reverse();
}
/** the road nearest to a tile, that the van can stop on (and someone can step out of it there) */
export function nearRoad(m: PreparedMap, x: number, y: number, r?: number, notOn?: boolean, from?: Tile): Tile | null {
  const R = r || 14;
  const candidates: { at: Tile; distance: number }[] = [];
  for (let dy = -R; dy <= R; dy++) for (let dx = -R; dx <= R; dx++) {
    const xx = x + dx, yy = y + dy, d = Math.abs(dx) + Math.abs(dy) * 1.2;
    if ((notOn && Math.abs(dx) + Math.abs(dy) < 2) || !drivable(m, xx, yy) || !isRoad(m, xx, yy)) continue;
    candidates.push({ at: [xx, yy], distance: d });
  }
  candidates.sort((a, b) => a.distance - b.distance);
  for (const c of candidates) {
    if (!DIRS.some(dir => vanFits(m, ...c.at, dir))) continue;
    const approach = backAlong(m, c.at, 6);
    if (Math.abs(approach[0] - c.at[0]) + Math.abs(approach[1] - c.at[1]) < 3 || (from && !roadPath(m, from, c.at))) continue;
    return c.at;
  }
  return null;
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
      if (seen[k] != null || !drivable(m, nx, ny) || !isRoad(m, nx, ny) || !vanStepFits(m, [nx, ny], c)) continue;
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
    if (blocked(m, x, y)) continue;
    const g = m.cell(x, y).g;
    if (g === 'sea' || (taken && taken[0] === x && taken[1] === y) || m.at[x + ',' + y]) continue;
    c.push([x, y]);
  }
  c.sort(function (p, q) { return (Math.hypot(p[0] - toward[0], p[1] - toward[1]) + Math.hypot(p[0] - t[0], p[1] - t[1]) * 2) - (Math.hypot(q[0] - toward[0], q[1] - toward[1]) + Math.hypot(q[0] - t[0], q[1] - t[1]) * 2); });
  return c[0] || null;
}
