/* Generates the ground of the Formia map from OpenStreetMap (tools/formia/osm-extract.json):
   sea and coast, beaches, the pineta, parks, hills, the railway and the main streets, at real positions
   through projection.ts. Streets and railway are redrawn at right angles, as on a game map, and joined into
   one network; every door gets a path to the street, and the houses of the town around line the streets.
   The places of formia-places.ts are set on the free spot nearest to where they really are, and the few
   hand-drawn touches on the ground are the PAINT list of paint.ts.
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
type XY = [number, number];   /* a tile */
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
const tileOf = (p: LL): XY => { const q = P(p); return [Math.floor(q[0]), Math.floor(q[1])]; };
const K = (x: number, y: number) => x + ',' + y;
const N4: XY[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const grid = <T>(v: T) => Array.from({ length: H }, () => Array<T>(W).fill(v));
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
/** Douglas-Peucker on tiles: drops the points within eps of the line, never the ones in keep (junctions) */
function simplify(pts: XY[], eps: number, keep: Set<string>): XY[] {
  if (pts.length < 3) return pts;
  const out: XY[] = [pts[0]];
  const rec = (i: number, j: number) => {
    const [ax, ay] = pts[i], [bx, by] = pts[j], len = Math.hypot(bx - ax, by - ay) || 1;
    let best = -1, far = eps;
    for (let k = i + 1; k < j; k++) {
      const d = keep.has(K(pts[k][0], pts[k][1])) ? Infinity : Math.abs((bx - ax) * (ay - pts[k][1]) - (ax - pts[k][0]) * (by - ay)) / len;
      if (d > far) { far = d; best = k; }
    }
    if (best < 0) { out.push(pts[j]); return; }
    rec(i, best); rec(best, j);
  };
  rec(0, pts.length - 1);
  return out;
}
/** a straight run of tiles, along a row or a column */
function run(x0: number, y0: number, x1: number, y1: number, fn: (x: number, y: number) => void) {
  const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
  for (let x = x0, y = y0; ; x += sx, y += sy) { fn(x, y); if (x === x1 && y === y1) break; }
}
/** a segment redrawn at right angles: a staircase of Z steps about `step` tiles deep, centred on the real line */
function zline(a: XY, b: XY, step: number, fn: (x: number, y: number) => void) {
  const dx = b[0] - a[0], dy = b[1] - a[1], across = Math.abs(dx) >= Math.abs(dy);
  const minor = across ? Math.abs(dy) : Math.abs(dx), major = across ? Math.abs(dx) : Math.abs(dy);
  const n = Math.max(1, Math.min(Math.round(minor / step), Math.floor(major / 3)));
  let p = a;
  for (let i = 1; i <= n; i++) {
    const q: XY = [Math.round(a[0] + dx * i / n), Math.round(a[1] + dy * i / n)];
    if (across) { const m = Math.round((p[0] + q[0]) / 2); run(p[0], p[1], m, p[1], fn); run(m, p[1], m, q[1], fn); run(m, q[1], q[0], q[1], fn); }
    else { const m = Math.round((p[1] + q[1]) / 2); run(p[0], p[1], p[0], m, fn); run(p[0], m, q[0], m, fn); run(q[0], m, q[0], q[1], fn); }
    p = q;
  }
}
/** cheapest way over the map from the `from` tiles to any tile `goal` accepts; cost(x, y) is Infinity where you can't go */
function cheapest(from: XY[], goal: (x: number, y: number) => boolean, cost: (x: number, y: number) => number, limit = Infinity): XY[] | null {
  const dist = grid(Infinity), prev = grid<number>(-1), open: [number, number, number][] = [];
  for (const [x, y] of from) { dist[y][x] = 0; open.push([0, x, y]); }
  while (open.length) {
    /* a small map: a sorted array is fast enough */
    let bi = 0;
    for (let i = 1; i < open.length; i++) if (open[i][0] < open[bi][0]) bi = i;
    const [d, x, y] = open[bi]; open[bi] = open[open.length - 1]; open.pop();
    if (d > dist[y][x]) continue;
    if (d > 0 && goal(x, y)) {
      const out: XY[] = [];
      for (let k = y * W + x; k >= 0; k = prev[Math.floor(k / W)][k % W]) out.unshift([k % W, Math.floor(k / W)]);
      return out;
    }
    if (d >= limit) continue;
    for (const [ax, ay] of N4) {
      const nx = x + ax, ny = y + ay;
      if (!inside(nx, ny)) continue;
      const c = goal(nx, ny) ? 0.5 : cost(nx, ny);
      if (d + c < dist[ny][nx]) { dist[ny][nx] = d + c; prev[ny][nx] = y * W + x; open.push([d + c, nx, ny]); }
    }
  }
  return null;
}

/* ---------- 1. sea: everything the gulf reaches without crossing the coast ---------- */
const coast = grid(false);
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
const sea = grid(false);
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
/* a smoother shore: no one-tile coves or spits */
for (let pass = 0; pass < 2; pass++) {
  const flip: XY[] = [];
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const wet = N4.filter(([a, b]) => sea[y + b][x + a]).length;
    if (sea[y][x] ? wet <= 1 : wet >= 3) flip.push([x, y]);
  }
  for (const [x, y] of flip) sea[y][x] = !sea[y][x];
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (sea[y][x]) G[y][x] = '~';
const isLand = (x: number, y: number) => inside(x, y) && !sea[y][x];

/* ---------- 2. hills: the Aurunci along the top, the green hills west of town ---------- */
for (let x = 0; x < W; x++) {
  const top = 3 + Math.round(noise(x, 0, 1) * 1.6 + Math.sin(x / 9) * 0.8);
  for (let y = 0; y < top; y++) set(x, y, noise(x, y, 2) < 0.12 ? 'Q' : noise(x, y, 3) < 0.06 ? 'J' : 'M');
}
for (const a of osm.areas) if (a.kind === 'wood') for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) set(x, y, noise(x, y, 4) < 0.3 ? 'Q' : 'M'); });

/* ---------- 3. green: the pineta, parks (no olive groves in them later) ---------- */
const green = grid(false);
for (const a of osm.areas) {
  if (a.kind === 'forest') for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) { green[y][x] = true; set(x, y, noise(x, y, 5) < 0.42 ? 'i' : noise(x, y, 6) < 0.08 ? 'f' : '.'); } });
  if (a.kind === 'park' || a.kind === 'garden') {
    const pines = /pineta/i.test(a.name);
    for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) { green[y][x] = true; set(x, y, noise(x, y, 7) < 0.3 ? (pines ? 'i' : 'T') : noise(x, y, 8) < 0.25 ? 'f' : '.'); } });
  }
}

/* ---------- 4. beaches, and what lines every shore ---------- */
for (const a of osm.areas) if (a.kind === 'beach') for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) set(x, y, ':'); });
/* the beaches of Vindicio and Gianola are widened into the sea: at this scale they would be one tile deep */
const WIDEN: { x0: number; x1: number; by: number }[] = [{ x0: 14, x1: 50, by: 4 }, { x0: 148, x1: W, by: 2 }];
for (const z of WIDEN) for (let pass = 0; pass < z.by; pass++) {
  const grow: [number, number][] = [];
  for (let y = 0; y < H; y++) for (let x = z.x0; x < z.x1; x++) if (sea[y][x] && N4.some(([a, b]) => isLand(x + a, y + b) && inside(x + a, y + b))) grow.push([x, y]);
  for (const [x, y] of grow) { sea[y][x] = false; set(x, y, ':'); }
}
/** how many tiles from the sea, up to 4 */
const shore = (x: number, y: number) => { for (let d = 1; d <= 4; d++) for (let k = -d; k <= d; k++) if (sea[y + d]?.[x + k] || sea[y + k]?.[x + d] || sea[y + k]?.[x - d] || sea[y - d]?.[x + k]) return d; return 9; };
/* west to east: Vindicio's long beach, the quays of the town, rocks and coves, beaches again at Gianola */
const SHORE: { x0: number; x1: number; kind: 'beach' | 'town' | 'rocky' }[] = [
  { x0: 0, x1: 52, kind: 'beach' }, { x0: 52, x1: 118, kind: 'town' }, { x0: 118, x1: 146, kind: 'rocky' }, { x0: 146, x1: W, kind: 'beach' }
];
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (!isLand(x, y)) continue;
  const d = shore(x, y), z = SHORE.find((s) => x >= s.x0 && x < s.x1)!;
  if (z.kind === 'beach' && d <= 3) set(x, y, d === 3 && noise(x, y, 9) < 0.25 ? 'P' : ':');
  /* behind the beach, the lungomare: a paved walk along the sand */
  if (z.kind === 'beach' && d === 4 && /[.f]/.test(get(x, y))) set(x, y, '_');
  /* in town the sea is walled by a stone quay, with a few rocks at its foot */
  if (z.kind === 'town' && d <= 2) set(x, y, d === 1 && noise(x, y, 10) < 0.18 ? 'R' : '_');
  if (z.kind === 'rocky' && d === 1) set(x, y, noise(x, y, 10) < 0.35 ? 'R' : ':');
}
/* rocks in the water are drawn as sea */
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (get(x, y) === 'R') { sea[y][x] = true; }

/** the ways that run beside one already kept (the second track, the other carriageway) are left out:
    drawn at right angles, two lines a tile apart would come out as two staircases */
function thin<T extends { pts: LL[] }>(ways: T[], rank: (w: T) => number): T[] {
  const sorted = ways.map((w) => {
    const tiles: XY[] = [];
    polyline(w.pts, (x, y) => { if (inside(x, y)) tiles.push([x, y]); });
    return { w, tiles };
  }).sort((a, b) => rank(a.w) - rank(b.w) || b.tiles.length - a.tiles.length);
  const near = grid(false), kept = new Set<T>();
  for (const o of sorted) {
    if (o.tiles.length && o.tiles.filter(([x, y]) => near[y][x]).length / o.tiles.length >= 0.75) continue;
    kept.add(o.w);
    for (const [x, y] of o.tiles) for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (inside(x + b, y + a)) near[y + a][x + b] = true;
  }
  return ways.filter((w) => kept.has(w));
}

/* ---------- 5. railway, at right angles (tunnels stay hidden) ---------- */
const railTiles = (r: Rail) => r.pts.map(tileOf);
for (const r of thin(osm.rail.filter((r) => !r.tunnel && (r.usage === 'main' || r.usage === '')), () => 0)) {
  const t = simplify(railTiles(r), 1.5, new Set([0, r.pts.length - 1].map((i) => K(...tileOf(r.pts[i])))));
  for (let i = 0; i + 1 < t.length; i++) zline(t[i], t[i + 1], 12, (x, y) => { if (isLand(x, y)) set(x, y, 'r'); });
}

/* ---------- 6. the places, before the streets: a free spot near where each one really is (the streets go round them) ---------- */
const reserved = grid(false);
/** the tiles under a building: nothing goes through them */
const foot = grid(false);
/** where no street is drawn: under buildings, gardens, beaches and squares */
const noStreet = grid(false);
/** the footpaths to the doors: no one stands on them */
const pathed = grid(false);
/** the tiles just above a building, hidden by its roof: no one stands there */
const roofed = grid(false);
const roof = (x: number, y: number, w: number) => { for (let a = y - 2; a < y; a++) for (let b = x; b < x + w; b++) if (inside(b, a)) roofed[a][b] = true; };
/** where people, signs and things stand */
const spotted = grid(false);
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
/** a footpath from the tile in front of a door to the nearest street, square or quay; false when there is none within `limit` */
function pathToStreet(x: number, y: number, limit: number, draw = true): number | null {
  if (/[=vz_]/.test(get(x, y))) return 0;
  const way = cheapest([[x, y]], (gx, gy) => /[=vz_,]/.test(get(gx, gy)) && !foot[gy][gx], (gx, gy) => {
    if (!isLand(gx, gy) || foot[gy][gx]) return Infinity;
    const g = get(gx, gy);
    if (/[.f:H]/.test(g)) return 1;
    if (/[TiOP]/.test(g)) return 2.5;
    return Infinity;
  }, limit);
  if (!way) return null;
  if (draw) for (const [px, py] of way.slice(0, -1)) { if (get(px, py) !== ':') set(px, py, ','); reserved[py][px] = true; pathed[py][px] = true; }
  return way.length - 1;
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
    if (p.fill === 'piazza') { set(x, y, edge && (x - at.x) % 3 === 0 && y === at.y ? 'L' : 'v'); noStreet[y][x] = true; }
    else if (p.fill === 'garden') set(x, y, edge && noise(x, y, 11) < 0.45 ? 'T' : noise(x, y, 12) < 0.3 ? 'f' : '.');
    else if (p.fill === 'beach') { set(x, y, ':'); sea[y][x] = false; }
    if (p.fill !== 'piazza') noStreet[y][x] = true;
  }
  if (p.kind !== 'area' && p.on !== 'sea') roof(at.x, at.y, at.w);
  if (p.kind !== 'area' && p.on !== 'sea') for (let y = at.y; y < at.y + at.h; y++) for (let x = at.x; x < at.x + at.w; x++) { foot[y][x] = true; noStreet[y][x] = true; if (/[TiQ]/.test(get(x, y))) set(x, y, '.'); }
}
/* ---------- 7. streets: the ones that make Formia recognisable, at right angles, joined into one network ---------- */
const MAIN = /^(trunk|primary|secondary|tertiary)$/;
const NAMED = new Set([
  'Via Giovanni Amendola', 'Via Acqualonga', 'Via Tullia', 'Via Abate Tosti', 'Via Cassio I', 'Via Cassio II', 'Via degli Olivetani',
  'Via del Tempio di Giano', 'Via del Porticciolo Romano', 'Via Antonio Gramsci', 'Via Giuseppe Garibaldi', 'Via Ferdinando Lavanga',
  'Via Porto Capossele', 'Via Angelo Rubino', 'Via Santo Janni', 'Via Gianola', 'Lungomare Città di Ferrara', 'Via Santo Janni Pescinola',
  'Via Remigio Paone', 'Via Fontana', 'Via Miramare', 'Via del Commercio', 'Piazzale Marinai d\'Italia', 'Largo Caduti Formiani', 'Via Mamurrano'
]);
const WALK = /^(pedestrian|living_street)$/;
const SKIP = new Set(['Via Rotabile', 'Via San Rocco', 'Lungomare Giovanni Caboto']);   /* up the hills, or in Gaeta */
const RANK = ['trunk', 'primary', 'secondary', 'tertiary'];
/* the neighbourhoods: their longer side streets are drawn too, so the houses have streets to line */
const TOWN: { x0: number; y0: number; x1: number; y1: number; kinds: string[]; every: number }[] = [
  { x0: 22, y0: 44, x1: 56, y1: 66, kinds: ['house', 'house', 'condo'], every: 0.55 },          /* Vindicio, above the lungomare */
  { x0: 44, y0: 6, x1: 112, y1: 34, kinds: ['house', 'condo', 'house'], every: 0.45 },          /* north of the railway: Rio Fresco, Acqualonga */
  { x0: 52, y0: 34, x1: 76, y1: 58, kinds: ['house', 'house', 'shop'], every: 0.75 },           /* Castellone */
  { x0: 74, y0: 24, x1: 118, y1: 50, kinds: ['house', 'condo', 'shop', 'house'], every: 0.8 },  /* the centre and Mola */
  { x0: 112, y0: 12, x1: 150, y1: 32, kinds: ['condo', 'house', 'condo'], every: 0.6 },         /* Gianola, Via Amendola, Santo Janni */
  { x0: 146, y0: 20, x1: 165, y1: 48, kinds: ['house', 'house'], every: 0.5 }                   /* Gianola, by the sea */
];
const LOCAL = /^(residential|unclassified)$/;
const local = (r: Road) => {
  if (!LOCAL.test(r.hw) || r.pts.length < 2) return false;
  const a = P(r.pts[0]), b = P(r.pts[r.pts.length - 1]), m = P(r.pts[Math.floor(r.pts.length / 2)]);
  return Math.hypot(b[0] - a[0], b[1] - a[1]) >= 7 && TOWN.some((z) => m[0] >= z.x0 && m[0] < z.x1 && m[1] >= z.y0 && m[1] < z.y1);
};
const streets = thin(osm.roads.filter((r) => !r.tunnel && !SKIP.has(r.name) && (MAIN.test(r.hw) || NAMED.has(r.name) || (WALK.test(r.hw) && r.name) || local(r))),
  (r) => (RANK.indexOf(r.hw) + 1 || (LOCAL.test(r.hw) && !NAMED.has(r.name) ? 10 : 9)));
/* where streets meet: a tile shared by two of them stays a corner of both */
const uses = new Map<string, number>();
const lines = streets.map((r) => {
  const t: XY[] = [];
  for (const p of r.pts.map(tileOf)) if (!t.length || K(...t[t.length - 1]) !== K(...p)) t.push(p);
  for (const k of new Set(t.map((p) => K(...p)))) uses.set(k, (uses.get(k) || 0) + 1);
  return t;
});
const junction = new Set([...uses].filter(([, n]) => n > 1).map(([k]) => k));
const isStreet = (x: number, y: number) => /[=vz]/.test(get(x, y));
streets.forEach((r, i) => {
  const wide = r.hw === 'trunk' || r.hw === 'primary', c = WALK.test(r.hw) ? 'v' : '=';
  const keep = new Set([...junction, K(...lines[i][0]), K(...lines[i][lines[i].length - 1])]);
  const t = simplify(lines[i], 1.2, keep);
  const put = (x: number, y: number) => {
    if (!isLand(x, y) || noStreet[y]?.[x] || /[MQJ]/.test(get(x, y)) && !wide) return;
    if (get(x, y) === 'r' && c === 'v') return;
    set(x, y, c);
  };
  for (let k = 0; k + 1 < t.length; k++) zline(t[k], t[k + 1], 4, (x, y) => { put(x, y); if (wide) { put(x + 1, y); put(x, y + 1); put(x + 1, y + 1); } });
});
/** the street tiles around one, by flood */
function components(test: (x: number, y: number) => boolean): XY[][] {
  const seen = grid(false), out: XY[][] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (seen[y][x] || !test(x, y)) continue;
    const comp: XY[] = [], q: XY[] = [[x, y]];
    seen[y][x] = true;
    while (q.length) {
      const [cx, cy] = q.pop()!;
      comp.push([cx, cy]);
      for (const [a, b] of N4) { const nx = cx + a, ny = cy + b; if (inside(nx, ny) && !seen[ny][nx] && test(nx, ny)) { seen[ny][nx] = true; q.push([nx, ny]); } }
    }
    out.push(comp);
  }
  return out;
}
/* little islands of grass between streets become street */
for (const c of components((x, y) => isLand(x, y) && !noStreet[y][x] && /[.fT]/.test(get(x, y)))) {
  if (c.length > 4) continue;
  const shut = c.every(([x, y]) => N4.every(([a, b]) => { const g = get(x + a, y + b); return g !== '' && (/[=vz.fT]/.test(g)); }));
  if (shut) for (const [x, y] of c) set(x, y, '=');
}
/* bits of street cut off by the coast or the hills are joined to the rest, the crumbs are dropped */
{
  const comps = components(isStreet).sort((a, b) => b.length - a.length);
  const net = grid(false);
  for (const [x, y] of comps[0]) net[y][x] = true;
  const walkCost = (x: number, y: number) => {
    const g = get(x, y);
    if (!isLand(x, y) || noStreet[y][x] || /[~R]/.test(g)) return Infinity;
    if (g === 'r') return 10;
    if (/[MQJ]/.test(g)) return 8;
    if (/[Ti]/.test(g)) return 3;
    return 1;
  };
  for (const c of comps.slice(1)) {
    if (c.length < 5) { for (const [x, y] of c) set(x, y, '.'); continue; }
    const link = cheapest(c, (x, y) => net[y][x], walkCost, 40);
    for (const [x, y] of c) net[y][x] = true;
    if (!link) continue;
    for (const [x, y] of link) { if (!isStreet(x, y)) set(x, y, '='); net[y][x] = true; }
  }
}
/* stubs: a street that goes one or two tiles past a corner and stops */
for (let pass = 0; pass < 2; pass++) {
  const ends: XY[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (get(x, y) === '=' && N4.filter(([a, b]) => isStreet(x + a, y + b)).length === 1) ends.push([x, y]);
  for (const [x, y] of ends) {
    const [a, b] = N4.find(([a, b]) => isStreet(x + a, y + b))!;
    if (N4.filter(([c, d]) => isStreet(x + a + c, y + b + d)).length >= 3) set(x, y, '.');
  }
}

/* ---------- 8. by hand ---------- */
for (const c of CLEAR) for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) if (isLand(x, y) && !/[=v,r]/.test(get(x, y))) set(x, y, c.to || '.');
for (const p of PAINT) p.rows.forEach((line, dy) => [...line].forEach((ch, dx) => { if (ch !== ' ') set(p.x + dx, p.y + dy, ch); }));

/* ---------- 9. a path from every door to the street ---------- */
for (const p of PLACES) {
  const at = placed[p.id];
  if (!at || !at.door || p.on === 'sand') continue;
  if (pathToStreet(at.door[0], at.door[1] + 1, 30) == null) misses.push(p.id + ' (no path to a street)');
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
  /* a spot may stand in the room around a place, never on a building, a door's path (Antonio himself may) or another spot */
  const open = (x: number, y: number) => inside(x, y) && !foot[y][x] && !roofed[y][x] && (!pathed[y][x] || !!s.walk);
  const found = rings(tx, ty, 6, (x, y) => {
    if (!open(x, y) || !ok.test(get(x, y))) return false;
    /* it must be reachable: at least one walkable tile next to it */
    if (!N4.some(([ax, ay]) => inside(x + ax, y + ay) && !foot[y + ay][x + ax] && STEP_ON.test(get(x + ax, y + ay)))) return false;
    spots[s.id] = [x, y]; reserved[y][x] = true; foot[y][x] = true; spotted[y][x] = true;
    return true;
  });
  if (!found) misses.push(s.id + ' near ' + tx + ',' + ty);
}
/* a tree just below someone would hide him behind its crown */
const UNDER: Record<string, string> = { T: '.', i: '.', O: '.', P: ':', I: ':', p: ',', Q: 'M', J: 'M' };
for (const [x, y] of Object.values(spots)) for (let d = 1; d <= 2; d++) { const g = get(x, y + d); if (UNDER[g]) set(x, y + d, UNDER[g]); }
/* footpaths through the pineta and up to the Tomba di Cicerone, from the people and signs there to the street */
for (const id of ['zendavid', 'sign-pineta', 'motorino-pineta', 'sign-tomba', 'turista']) {
  const sp = spots[id];
  if (!sp) continue;
  const by = N4.map(([a, b]): XY => [sp[0] + a, sp[1] + b]).find(([x, y]) => inside(x, y) && !foot[y][x] && /[.f,]/.test(get(x, y)));
  if (by && pathToStreet(by[0], by[1], 40) == null) misses.push(id + ' (no path to a street)');
}
/* the tunnels' mouths, where the railway goes into the hill */
const tunnels: [number, number][] = [];
for (const r of osm.rail) if (r.tunnel) for (const e of [r.pts[0], r.pts[r.pts.length - 1]]) {
  const [x, y] = tileOf(e);
  const t: [number, number] = [x, y - 1];
  if (inside(x, y) && isLand(x, y) && !tunnels.some((q) => Math.abs(q[0] - t[0]) < 3 && Math.abs(q[1] - t[1]) < 3) && free(x, y - 1) && free(x, y)) {
    tunnels.push(t); reserved[y - 1][x] = true; reserved[y][x] = true; foot[y - 1][x] = true;
  }
}

/* ---------- 10. the town around: houses along the streets of every neighbourhood ---------- */
const houses: { kind: string; x: number; y: number; w: number; h: number; door: [number, number]; v: number }[] = [];
/* first the houses with the door right on a street, then the ones a short path away */
for (const far of [0, 3]) for (const z of TOWN) for (let y = z.y0; y < z.y1; y++) for (let x = z.x0; x < z.x1; x++) {
  if (noise(x, y, 16) > z.every) continue;
  const kind = z.kinds[Math.floor(noise(x, y, 13) * z.kinds.length)], w = kind === 'condo' ? 4 : 3, h = kind === 'condo' ? 3 : 2;
  let fits = true;
  for (let a = y; a < y + h && fits; a++) for (let b = x; b < x + w && fits; b++) if (!free(b, a) || !/[.fT]/.test(get(b, a))) fits = false;
  /* room to walk around it */
  for (let a = y - 1; a <= y + h && fits; a++) for (let b = x - 1; b <= x + w && fits; b++) if (!inside(b, a) || foot[a][b] || /[~rRMQJ]/.test(get(b, a))) fits = false;
  for (let a = y - 2; a < y && fits; a++) for (let b = x; b < x + w && fits; b++) if (inside(b, a) && spotted[a][b]) fits = false;
  const dx = x + Math.floor(w / 2);
  if (!fits || !/[.f,=v_]/.test(get(dx, y + h)) || foot[y + h][dx]) continue;
  for (let a = y; a < y + h; a++) for (let b = x; b < x + w; b++) foot[a][b] = true;
  const len = pathToStreet(dx, y + h, far, false);
  if (len == null || len > far) { for (let a = y; a < y + h; a++) for (let b = x; b < x + w; b++) foot[a][b] = false; continue; }
  pathToStreet(dx, y + h, far);
  houses.push({ kind, x, y, w, h, door: [dx, y + h - 1], v: Math.floor(noise(x, y, 17) * 1000) });
  for (let a = y - 1; a <= y + h; a++) for (let b = x - 1; b <= x + w; b++) if (inside(b, a)) reserved[a][b] = true;
  for (let a = y; a < y + h; a++) for (let b = x; b < x + w; b++) set(b, a, '.');
}
/* ---------- 11. the centre is paved: pavements along its streets ---------- */
const URBAN: { x0: number; y0: number; x1: number; y1: number }[] = [{ x0: 56, y0: 28, x1: 118, y1: 60 }];
for (const z of URBAN) {
  const pave: XY[] = [];
  for (let y = z.y0; y < z.y1; y++) for (let x = z.x0; x < z.x1; x++) {
    if (!/[.f]/.test(get(x, y)) || (foot[y][x] && !spotted[y][x])) continue;
    let near = false;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (/[=z]/.test(get(x + b, y + a))) near = true;
    if (near) pave.push([x, y]);
  }
  for (const [x, y] of pave) set(x, y, '_');
  /* the scraps of grass left between quays, streets and pavements are paved too */
  const inZ = (x: number, y: number) => x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1;
  for (const c of components((x, y) => inZ(x, y) && /[.f]/.test(get(x, y)))) if (c.length <= 6) for (const [x, y] of c) set(x, y, '_');
}
/* ---------- 12. the countryside: olive groves and a few trees where the town thins out ---------- */
const nearStreet = (x: number, y: number) => N4.some(([a, b]) => /[=v,r_]/.test(get(x + a, y + b)));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (get(x, y) !== '.' || green[y][x] || !free(x, y) || foot[y][x] || nearStreet(x, y)) continue;
  const n = noise(x, y, 18), grove = noise(Math.floor(x / 6), Math.floor(y / 5), 19) < 0.45;
  if (grove && n < 0.16) set(x, y, 'O'); else if (n < 0.025) set(x, y, 'T');
}
if (misses.length) console.log('NOT PLACED:', misses.join(' | '));

/* ---------- out ---------- */
const rows = G.map((r) => r.join(''));
if (process.argv.includes('--print')) {
  console.log('   ' + Array.from({ length: W }, (_, x) => (x % 10 === 0 ? String(Math.floor(x / 10) % 10) : ' ')).join(''));
  console.log('   ' + Array.from({ length: W }, (_, x) => String(x % 10)).join(''));
  rows.forEach((r, y) => console.log(String(y).padStart(2) + ' ' + r));
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
console.log('wrote', W + '×' + H, 'tiles to', path.relative(process.cwd(), file), '·', houses.length, 'houses');
