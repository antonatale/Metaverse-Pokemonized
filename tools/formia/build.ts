/* Generates the ground of the Formia map from OpenStreetMap (tools/formia/osm-extract.json):
   sea and coast, beaches, the pineta, parks, hills, the railway and the main streets, at real positions
   through projection.ts. Buildings, people, signs and activities are placed by hand in src/data/maps/formia.ts,
   and the few hand-drawn touches on the ground (piazze, piers, the lidi) are the PAINT list below.
     npx tsx tools/formia/build.ts            writes src/data/maps/formia-ground.ts
     npx tsx tools/formia/build.ts --print    also prints the map
   Map data © OpenStreetMap contributors (ODbL 1.0). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W, H, col, row } from './projection';
import { PAINT, CLEAR } from './paint';

type LL = [number, number];   /* lat, lon */
interface Road { hw: string; name: string; tunnel: boolean; bridge: boolean; pts: LL[] }
interface Rail { tunnel: boolean; bridge: boolean; usage: string; pts: LL[] }
interface Area { kind: string; sport: string; name: string; rings: LL[][] }
const here = path.dirname(fileURLToPath(import.meta.url));
const osm = JSON.parse(fs.readFileSync(path.join(here, 'osm-extract.json'), 'utf8')) as { coast: LL[][]; roads: Road[]; rail: Rail[]; areas: Area[] };

const G: string[][] = Array.from({ length: H }, () => Array(W).fill('.'));
const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
const get = (x: number, y: number) => (inside(x, y) ? G[y][x] : '');
const set = (x: number, y: number, c: string) => { if (inside(x, y)) G[y][x] = c; };
const P = (p: LL): [number, number] => [col(p[1]), row(p[0])];
/* a fixed sequence, so the map comes out the same every time */
const noise = (x: number, y: number, k: number) => {
  let h = (x * 374761393 + y * 668265263 + k * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** every tile a segment passes through (supercover, so a line never leaks diagonally) */
function cells(a: [number, number], b: [number, number], fn: (x: number, y: number) => void) {
  let x = Math.floor(a[0]), y = Math.floor(a[1]);
  const x1 = Math.floor(b[0]), y1 = Math.floor(b[1]), dx = b[0] - a[0], dy = b[1] - a[1];
  const sx = dx > 0 ? 1 : -1, sy = dy > 0 ? 1 : -1;
  const tdx = dx !== 0 ? Math.abs(1 / dx) : Infinity, tdy = dy !== 0 ? Math.abs(1 / dy) : Infinity;
  let tx = dx !== 0 ? ((sx > 0 ? x + 1 - a[0] : a[0] - x) * tdx) : Infinity;
  let ty = dy !== 0 ? ((sy > 0 ? y + 1 - a[1] : a[1] - y) * tdy) : Infinity;
  fn(x, y);
  for (let guard = 0; (x !== x1 || y !== y1) && guard < 4000; guard++) {
    if (tx < ty) { tx += tdx; x += sx; } else { ty += tdy; y += sy; }
    fn(x, y);
  }
}
function polyline(pts: LL[], fn: (x: number, y: number) => void) { for (let i = 0; i + 1 < pts.length; i++) cells(P(pts[i]), P(pts[i + 1]), fn); }
/** tiles whose centre is inside a ring (even-odd) */
function polygon(ring: LL[], fn: (x: number, y: number) => void) {
  const pts = ring.map(P);
  for (let y = 0; y < H; y++) {
    const cy = y + 0.5, xs: number[] = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length];
      if ((a[1] <= cy && b[1] > cy) || (b[1] <= cy && a[1] > cy)) xs.push(a[0] + (cy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) if (inside(x, y)) fn(x, y);
  }
}

/* ---------- 1. sea: everything the gulf reaches without crossing the coast ---------- */
const coast = Array.from({ length: H }, () => Array(W).fill(false));
for (const c of osm.coast) {
  polyline(c, (x, y) => { if (inside(x, y)) coast[y][x] = true; });
  /* a coastline that stops inside the map is carried on to the edge, or the sea would leak around its end */
  for (const [a, b] of [[c[c.length - 2], c[c.length - 1]], [c[1], c[0]]] as [LL, LL][]) {
    const pa = P(a), pb = P(b);
    if (!inside(Math.floor(pb[0]), Math.floor(pb[1]))) continue;
    const dx = pb[0] - pa[0], dy = pb[1] - pa[1], n = Math.hypot(dx, dy) || 1;
    cells(pb, [pb[0] + dx / n * 400, pb[1] + dy / n * 400], (x, y) => { if (inside(x, y)) coast[y][x] = true; });
  }
}
const sea = Array.from({ length: H }, () => Array(W).fill(false));
{
  const [sx, sy] = P([41.2445, 13.620]);   /* the middle of the gulf */
  const q: [number, number][] = [[Math.floor(sx), Math.floor(sy)]];
  while (q.length) {
    const [x, y] = q.pop()!;
    if (!inside(x, y) || sea[y][x] || coast[y][x]) continue;
    sea[y][x] = true;
    q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (sea[y][x]) G[y][x] = '~';
const isLand = (x: number, y: number) => inside(x, y) && !sea[y][x];

/* ---------- 2. hills: the Aurunci along the top, the green hills west of town ---------- */
for (let x = 0; x < W; x++) {
  const top = 3 + Math.round(noise(x, 0, 1) * 1.6 + Math.sin(x / 9) * 0.8);
  for (let y = 0; y < top; y++) set(x, y, noise(x, y, 2) < 0.12 ? 'Q' : noise(x, y, 3) < 0.06 ? 'J' : 'M');
}
for (const a of osm.areas) if (a.kind === 'wood') for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) set(x, y, noise(x, y, 4) < 0.3 ? 'Q' : 'M'); });

/* ---------- 3. green: the pineta, parks ---------- */
for (const a of osm.areas) {
  if (a.kind === 'forest') for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) set(x, y, noise(x, y, 5) < 0.42 ? 'i' : noise(x, y, 6) < 0.08 ? 'f' : '.'); });
  if (a.kind === 'park' || a.kind === 'garden') {
    const pines = /pineta/i.test(a.name);
    for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) set(x, y, noise(x, y, 7) < 0.3 ? (pines ? 'i' : 'T') : noise(x, y, 8) < 0.25 ? 'f' : '.'); });
  }
}

/* ---------- 4. beaches, and what lines every shore ---------- */
for (const a of osm.areas) if (a.kind === 'beach') for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) set(x, y, ':'); });
/** how many tiles from the sea, up to 4 */
const shore = (x: number, y: number) => { for (let d = 1; d <= 4; d++) for (let k = -d; k <= d; k++) if (sea[y + d]?.[x + k] || sea[y + k]?.[x + d] || sea[y + k]?.[x - d] || sea[y - d]?.[x + k]) return d; return 9; };
/* west to east: Vindicio's long beach, rocks and harbours in town, beaches again at Gianola */
const SHORE: { x0: number; x1: number; kind: 'beach' | 'town' | 'rocky' }[] = [
  { x0: 0, x1: 52, kind: 'beach' }, { x0: 52, x1: 118, kind: 'town' }, { x0: 118, x1: 146, kind: 'rocky' }, { x0: 146, x1: W, kind: 'beach' }
];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (!isLand(x, y) || get(x, y) === 'r') continue;
  const d = shore(x, y), z = SHORE.find((s) => x >= s.x0 && x < s.x1)!;
  if (z.kind === 'beach' && d <= 3 && get(x, y) !== '=') set(x, y, d === 3 && noise(x, y, 9) < 0.25 ? 'P' : ':');
  if (z.kind === 'town' && d === 1 && get(x, y) !== '=') set(x, y, 'R');
  if (z.kind === 'town' && d === 2 && /[.f]/.test(get(x, y))) set(x, y, '_');
  if (z.kind === 'rocky' && d === 1 && get(x, y) !== '=') set(x, y, noise(x, y, 10) < 0.6 ? 'R' : ':');
}
/* rocks in the water are drawn as sea */
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (get(x, y) === 'R') { sea[y][x] = true; }

/* ---------- 5. railway (tunnels stay hidden), then the streets over it where they cross ---------- */
for (const r of osm.rail) if (!r.tunnel && (r.usage === 'main' || r.usage === '')) polyline(r.pts, (x, y) => { if (isLand(x, y)) set(x, y, 'r'); });

/* the streets that make Formia recognisable; the many small ones in between would turn it all to asphalt */
const MAIN = /^(trunk|primary|secondary|tertiary)$/;
const NAMED = new Set([
  'Via Giovanni Amendola', 'Via Acqualonga', 'Via Tullia', 'Via Abate Tosti', 'Via Cassio I', 'Via Cassio II', 'Via degli Olivetani',
  'Via del Tempio di Giano', 'Via del Porticciolo Romano', 'Via Antonio Gramsci', 'Via Giuseppe Garibaldi', 'Via Ferdinando Lavanga',
  'Via Porto Capossele', 'Via Angelo Rubino', 'Via Santo Janni', 'Via Gianola', 'Lungomare Città di Ferrara', 'Via Santo Janni Pescinola',
  'Via Remigio Paone', 'Via Fontana', 'Via Miramare', 'Via del Commercio', 'Piazzale Marinai d\'Italia', 'Largo Caduti Formiani', 'Via Mamurrano'
]);
const WALK = /^(pedestrian|living_street)$/;
const SKIP = new Set(['Via Rotabile', 'Via San Rocco', 'Lungomare Giovanni Caboto']);   /* up the hills, or in Gaeta */
for (const r of osm.roads) {
  if (r.tunnel || SKIP.has(r.name)) continue;
  const main = MAIN.test(r.hw), named = NAMED.has(r.name), walk = WALK.test(r.hw) && r.name;
  if (!main && !named && !walk) continue;
  const wide = r.hw === 'trunk' || r.hw === 'primary';
  polyline(r.pts, (x, y) => {
    if (!isLand(x, y)) return;
    const c = walk ? 'v' : '=';
    if (get(x, y) === 'r' && c === 'v') return;
    set(x, y, c);
    if (wide) { if (isLand(x, y + 1) && get(x, y + 1) !== 'r') set(x, y + 1, c); }
  });
}

/* ---------- 6. by hand ---------- */
for (const c of CLEAR) for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) if (isLand(x, y) && !/[=v,r]/.test(get(x, y))) set(x, y, c.to || '.');
for (const p of PAINT) p.rows.forEach((line, dy) => [...line].forEach((ch, dx) => { if (ch !== ' ') set(p.x + dx, p.y + dy, ch); }));

/* ---------- out ---------- */
const rows = G.map((r) => r.join(''));
if (process.argv.includes('--print')) {
  const ruler = (n: number) => Array.from({ length: W }, (_, x) => (x % 10 === 0 ? String((x / 10) % 10) : n === 0 ? '' : ' ')).join('');
  console.log('   ' + Array.from({ length: W }, (_, x) => (x % 10 === 0 ? String(Math.floor(x / 10) % 10) : ' ')).join(''));
  console.log('   ' + Array.from({ length: W }, (_, x) => String(x % 10)).join(''));
  rows.forEach((r, y) => console.log(String(y).padStart(2) + ' ' + r));
  void ruler;
}
const file = path.join(here, '../../src/data/maps/formia-ground.ts');
fs.writeFileSync(file, '/* Generated by tools/formia/build.ts from OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0). Do not edit by hand:\n   change the generator or tools/formia/paint.ts and run it again. One character per tile, see legend.ts. */\nexport const FORMIA_ROWS: string[] = [\n' + rows.map((r) => '  ' + JSON.stringify(r)).join(',\n') + '\n];\n');
console.log('wrote', W + '×' + H, 'tiles to', path.relative(process.cwd(), file));
