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
import { W, H, col, row } from '../../src/data/maps/formia-projection';
import { PAINT, CLEAR } from './paint';
import { PLACES, SPOTS } from '../../src/data/maps/formia-places';

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
/* the beaches of Vindicio and Gianola are widened into the sea: at this scale they would be one tile deep */
const WIDEN: { x0: number; x1: number; by: number }[] = [{ x0: 14, x1: 50, by: 4 }, { x0: 148, x1: W, by: 2 }];
for (const z of WIDEN) for (let pass = 0; pass < z.by; pass++) {
  const grow: [number, number][] = [];
  for (let y = 0; y < H; y++) for (let x = z.x0; x < z.x1; x++) if (sea[y][x] && [[1, 0], [-1, 0], [0, -1], [0, 1]].some(([a, b]) => isLand(x + a, y + b) && inside(x + a, y + b))) grow.push([x, y]);
  for (const [x, y] of grow) { sea[y][x] = false; set(x, y, ':'); }
}
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

/* ---------- 7. the places: a free spot near where each one really is ---------- */
const reserved = Array.from({ length: H }, () => Array(W).fill(false));
const free = (x: number, y: number) => inside(x, y) && !reserved[y][x];
const GROUND: Record<string, RegExp> = { land: /[.f_v,TiQ]/, sand: /[:PI]/, sea: /~/, area: /[.f_v,TiQ=:]/, beach: /[:PI~]/ };
const STEP_ON = /[.f:_v,=H]/;
interface At { x: number; y: number; w: number; h: number; door?: [number, number] }
const placed: Record<string, At> = {};
const misses: string[] = [];
function rings(cx: number, cy: number, reach: number, fn: (x: number, y: number) => boolean) {
  for (let r = 0; r <= reach; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    if (fn(cx + dx, cy + dy)) return true;
  }
  return false;
}
for (const p of PLACES) {
  const [px, py] = P(p.at), x0 = Math.round(px - p.w / 2), y0 = Math.round(py - p.h / 2);
  /* an open place may cover a street: you walk on both */
  const ok = p.kind === 'area' ? (p.on === 'sand' ? GROUND.beach : GROUND.area) : GROUND[p.on || 'land'], dx = p.doorAt == null ? Math.floor(p.w / 2) : p.doorAt;
  const fits = (x: number, y: number) => {
    for (let yy = y; yy < y + p.h; yy++) for (let xx = x; xx < x + p.w; xx++) if (!free(xx, yy) || !ok.test(get(xx, yy))) return false;
    if (p.door && !(free(x + dx, y + p.h) && STEP_ON.test(get(x + dx, y + p.h)))) return false;
    return true;
  };
  const found = rings(x0, y0, p.reach == null ? 8 : p.reach, (x, y) => {
    if (!fits(x, y)) return false;
    placed[p.id] = { x, y, w: p.w, h: p.h, door: p.door ? [x + dx, y + p.h - 1] : undefined };
    return true;
  });
  if (!found) { misses.push(p.id + ' near ' + x0 + ',' + y0); continue; }
  const at = placed[p.id], room = p.room == null ? 1 : p.room;
  for (let y = at.y - room; y < at.y + at.h + room; y++) for (let x = at.x - room; x < at.x + at.w + room; x++) {
    if (!inside(x, y)) continue;
    reserved[y][x] = true;
    const inFoot = x >= at.x && x < at.x + at.w && y >= at.y && y < at.y + at.h;
    if (!inFoot && /[TiQPI]/.test(get(x, y))) set(x, y, get(x, y) === 'P' || get(x, y) === 'I' ? ':' : '.');
  }
  /* open places are painted into the ground */
  if (p.kind === 'area') for (let y = at.y; y < at.y + at.h; y++) for (let x = at.x; x < at.x + at.w; x++) {
    const edge = x === at.x || y === at.y || x === at.x + at.w - 1 || y === at.y + at.h - 1;
    if (p.fill === 'piazza') set(x, y, edge && (x - at.x) % 3 === 0 && y === at.y ? 'L' : 'v');
    else if (p.fill === 'garden') set(x, y, edge && noise(x, y, 11) < 0.45 ? 'T' : noise(x, y, 12) < 0.3 ? 'f' : '.');
    else if (p.fill === 'beach') { set(x, y, ':'); sea[y][x] = false; }
  }
  if (p.kind !== 'area' && p.on !== 'sea') for (let y = at.y; y < at.y + at.h; y++) for (let x = at.x; x < at.x + at.w; x++) if (/[TiQ]/.test(get(x, y))) set(x, y, '.');
}
/* the Eclipse: rows of umbrellas, and a beach-volley net */
{
  const b = placed['eclipse-spiaggia'];
  if (b) {
    for (let k = 0; k < 4; k++) { set(b.x + 1 + k * 2, b.y + 2, 'u'); set(b.x + 1 + k * 2, b.y + 4, 'u'); }
    for (let k = 0; k < 3; k++) set(b.x + 9 + k, b.y + 3, 'N');
  }
}
const spots: Record<string, [number, number]> = {};
const STAND: Record<string, RegExp> = { land: /[.f_v,]/, sand: /[:]/, any: /[.f_v,:]/, sea: /~/ };
for (const s of SPOTS) {
  let tx: number, ty: number;
  if (s.near) {
    const p = placed[s.near.place];
    if (!p) { misses.push(s.id + ' (no ' + s.near.place + ')'); continue; }
    tx = p.x + s.near.dx; ty = p.y + s.near.dy;
  } else { const q = P(s.at!); tx = Math.floor(q[0]); ty = Math.floor(q[1]); }
  const ok = STAND[s.on || 'land'];
  const found = rings(tx, ty, 6, (x, y) => {
    if (!free(x, y) || !ok.test(get(x, y))) return false;
    /* it must be reachable: at least one walkable free tile next to it */
    if (![[1, 0], [-1, 0], [0, 1], [0, -1]].some(([ax, ay]) => free(x + ax, y + ay) && STEP_ON.test(get(x + ax, y + ay)))) return false;
    spots[s.id] = [x, y]; reserved[y][x] = true;
    return true;
  });
  if (!found) misses.push(s.id + ' near ' + tx + ',' + ty);
}
/* the tunnels' mouths, where the railway goes into the hill */
const tunnels: [number, number][] = [];
for (const r of osm.rail) if (r.tunnel) for (const e of [r.pts[0], r.pts[r.pts.length - 1]]) {
  const [x, y] = P(e).map(Math.floor);
  const t: [number, number] = [x, y - 1];
  if (inside(x, y) && isLand(x, y) && !tunnels.some((q) => Math.abs(q[0] - t[0]) < 3 && Math.abs(q[1] - t[1]) < 3) && free(x, y - 1) && free(x, y)) {
    tunnels.push(t); reserved[y - 1][x] = true; reserved[y][x] = true;
  }
}

/* ---------- 8. the town around: houses in every neighbourhood, where there is room ---------- */
const TOWN: { x0: number; y0: number; x1: number; y1: number; kinds: string[] }[] = [
  { x0: 26, y0: 44, x1: 56, y1: 62, kinds: ['house', 'house', 'condo'] },          /* Vindicio, above the lungomare */
  { x0: 44, y0: 6, x1: 112, y1: 34, kinds: ['house', 'condo', 'house'] },          /* north of the railway: Rio Fresco, Acqualonga */
  { x0: 52, y0: 34, x1: 76, y1: 58, kinds: ['house', 'house', 'shop'] },           /* Castellone */
  { x0: 74, y0: 26, x1: 116, y1: 48, kinds: ['house', 'condo', 'shop', 'house'] }, /* the centre and Mola */
  { x0: 112, y0: 14, x1: 150, y1: 32, kinds: ['condo', 'house', 'condo'] },        /* Gianola, Via Amendola, Santo Janni */
  { x0: 146, y0: 26, x1: 165, y1: 48, kinds: ['house', 'house'] }                  /* Gianola, by the sea */
];
const houses: { kind: string; x: number; y: number; w: number; h: number; door: [number, number]; v: number }[] = [];
for (const z of TOWN) for (let y = z.y0; y < z.y1; y += 3) for (let x = z.x0; x < z.x1; x += 4) {
  const kind = z.kinds[Math.floor(noise(x, y, 13) * z.kinds.length)], w = kind === 'condo' ? 4 : 3, h = kind === 'condo' ? 3 : 2;
  const xx = x + Math.floor(noise(x, y, 14) * 2), yy = y + Math.floor(noise(x, y, 15) * 2);
  let fits = noise(x, y, 16) < 0.8;
  for (let a = yy; a < yy + h && fits; a++) for (let b = xx; b < xx + w && fits; b++) if (!free(b, a) || !/[.f_T]/.test(get(b, a))) fits = false;
  /* room to walk around it */
  for (let a = yy - 1; a <= yy + h && fits; a++) for (let b = xx - 1; b <= xx + w && fits; b++) if (!free(b, a) || /[~rRMQ]/.test(get(b, a))) fits = false;
  const dx = xx + Math.floor(w / 2);
  if (!fits || !STEP_ON.test(get(dx, yy + h))) continue;
  houses.push({ kind, x: xx, y: yy, w, h, door: [dx, yy + h - 1], v: Math.floor(noise(x, y, 17) * 1000) });
  for (let a = yy - 1; a <= yy + h; a++) for (let b = xx - 1; b <= xx + w; b++) if (inside(b, a)) reserved[a][b] = true;
  for (let a = yy; a < yy + h; a++) for (let b = xx; b < xx + w; b++) set(b, a, '.');
}
if (misses.length) console.log('NOT PLACED:', misses.join(' | '));

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
fs.writeFileSync(file, '/* Generated by tools/formia/build.ts from OpenStreetMap (© OpenStreetMap contributors, ODbL 1.0). Do not edit by hand:\n   change the generator, tools/formia/paint.ts or formia-places.ts, and run it again. One character per tile, see legend.ts. */\n' +
  'export const FORMIA_ROWS: string[] = [\n' + rows.map((r) => '  ' + JSON.stringify(r)).join(',\n') + '\n];\n' +
  '/** where each place of formia-places.ts ended up: top-left corner, size, door */\n' +
  'export const FORMIA_AT: Record<string, { x: number; y: number; w: number; h: number; door?: [number, number] }> = ' + JSON.stringify(placed) + ';\n' +
  '/** where each spot of formia-places.ts ended up */\n' +
  'export const FORMIA_SPOT: Record<string, [number, number]> = ' + JSON.stringify(spots) + ';\n' +
  '/** the mouths of the railway tunnels */\n' +
  'export const FORMIA_TUNNELS: [number, number][] = ' + JSON.stringify(tunnels) + ';\n' +
  '/** the houses of the town around */\n' +
  'export const FORMIA_HOUSES: { kind: string; x: number; y: number; w: number; h: number; door: [number, number]; v: number }[] = ' + JSON.stringify(houses) + ';\n');
console.log('wrote', W + '×' + H, 'tiles to', path.relative(process.cwd(), file));
