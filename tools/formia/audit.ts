/* How playable the Formia map is: npx tsx tools/formia/audit.ts
   the streets in one piece and without dead ends, the railway in one line, and how far you walk from home to
   each place against the straight line (a long detour means something is in the way). */
import { MAPS } from '../../src/data/maps';
import { prepare } from '../../src/story/maps';
import { FORMIA_AT, FORMIA_TUNNELS } from '../../src/data/maps/formia-ground';
import { streetPieces, deadEnds, railEnds } from './playable';

const m = MAPS.formia, R = m.rows, H = R.length, W = R[0].length;
const pieces = streetPieces(R), ends = deadEnds(R), loose = railEnds(R, FORMIA_TUNNELS);
console.log('street pieces:', pieces.length, '· sizes', pieces.map((c) => c.length).slice(0, 8).join(','));
console.log('street dead ends:', ends.length, ends.slice(0, 30).map((p) => p.join(',')).join(' '));
console.log('rail ends in the open:', loose.length, loose.slice(0, 30).map((p) => p.join(',')).join(' '));
/* walking: from home, how long the way to each place is, against the straight line */
const P = prepare('formia'), N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const solid = (x: number, y: number) => x < 0 || y < 0 || x >= W || y >= H || P.solid[y * W + x] === 1;
const [sx, sy] = m.start, d0 = new Int32Array(W * H).fill(-1), q = [sx + sy * W];
d0[sx + sy * W] = 0;
for (let i = 0; i < q.length; i++) {
  const k = q[i], x = k % W, y = (k / W) | 0;
  for (const [a, b] of N4) { const nx = x + a, ny = y + b; if (!solid(nx, ny) && d0[ny * W + nx] < 0) { d0[ny * W + nx] = d0[k] + 1; q.push(ny * W + nx); } }
}
let land = 0, reach = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!solid(x, y)) { land++; if (d0[y * W + x] >= 0) reach++; }
console.log('walkable tiles reached from home:', reach, 'of', land);
for (const id of ['zauli', 'tennis', 'morgana', 'gelati', 'piazza', 'stazione', 'erasmo', 'eclipse', 'tomba', 'oriente', 'mamurra']) {
  const p = FORMIA_AT[id];
  if (!p) { console.log(' ', id, 'not placed'); continue; }
  const tx = p.door ? p.door[0] : p.x + (p.w >> 1), ty = p.door ? p.door[1] + 1 : p.y + p.h;
  let best = -1;
  for (const [a, b] of [[0, 0], ...N4]) { const v = d0[(ty + b) * W + tx + a]; if (v >= 0 && (best < 0 || v < best)) best = v; }
  const man = Math.abs(tx - sx) + Math.abs(ty - sy);
  console.log(' ', id.padEnd(10), 'walk', String(best).padStart(4), 'straight', String(man).padStart(4), 'detour ×' + (best > 0 ? (best / man).toFixed(2) : '∞'));
}
