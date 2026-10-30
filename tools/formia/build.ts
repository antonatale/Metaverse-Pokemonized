/* Generates the ground of the Formia map: the real coast, beaches, pineta, parks and hills from OpenStreetMap
   (tools/formia/osm-extract.json, through formia-projection.ts), and on it the playable skeleton drawn by hand in
   network.ts: one railway line and one network of streets, straight and joined, as on a game map.
   Then every place of formia-places.ts is set near where it really is, with its door on a street; people, signs
   and things stand by their places; the houses of the town line the streets; the centre is paved and the
   countryside has rows of olive trees you can walk between.
     npx tsx tools/formia/build.ts            writes src/data/maps/formia-ground.ts
     npx tsx tools/formia/build.ts --print    also prints the map
     npx tsx tools/formia/build.ts --base     prints only the coast and the green, to draw the network on
   Map data © OpenStreetMap contributors (ODbL 1.0). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { W, H, col, row } from '../../src/data/maps/formia-projection';
import { PAINT, CLEAR } from './paint';
import { PLACES, SPOTS } from '../../src/data/maps/formia-places';
import { RAIL, TUNNEL_ENDS, HILLS, STREETS, PATHS, type Line } from './network';

type LL = [number, number];   /* lat, lon */
type XY = [number, number];   /* a tile */
interface Area { kind: string; sport: string; name: string; rings: LL[][] }
const here = path.dirname(fileURLToPath(import.meta.url));
const osm = JSON.parse(fs.readFileSync(path.join(here, 'osm-extract.json'), 'utf8')) as { coast: LL[][]; areas: Area[] };

const G: string[][] = Array.from({ length: H }, () => Array(W).fill('.'));
const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
const get = (x: number, y: number) => (inside(x, y) ? G[y][x] : '');
const set = (x: number, y: number, c: string) => { if (inside(x, y)) G[y][x] = c; };
const P = (p: LL): [number, number] => [col(p[1]), row(p[0])];
const N4: XY[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const grid = <T>(v: T) => Array.from({ length: H }, () => Array<T>(W).fill(v));
/* a fixed sequence, so the map comes out the same every time */
const noise = (x: number, y: number, k: number) => {
  let h = (x * 374761393 + y * 668265263 + k * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const problems: string[] = [];

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
/** the tiles of a hand-drawn line: straight runs between its corners, 2 tiles wide when w is 2 */
function walkLine(l: Line, fn: (x: number, y: number) => void) {
  for (let i = 0; i + 1 < l.pts.length; i++) {
    const [x0, y0] = l.pts[i], [x1, y1] = l.pts[i + 1];
    if (x0 !== x1 && y0 !== y1) { problems.push(l.name + ': ' + x0 + ',' + y0 + ' → ' + x1 + ',' + y1 + ' is not straight'); continue; }
    const sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
    for (let x = x0, y = y0; ; x += sx, y += sy) {
      fn(x, y);
      if (l.w === 2) { fn(x + 1, y); fn(x, y + 1); fn(x + 1, y + 1); }
      if (x === x1 && y === y1) break;
    }
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
/** the pieces a test cuts the map into, by flood */
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
function rings(cx: number, cy: number, reach: number, fn: (x: number, y: number) => boolean) {
  for (let r = 0; r <= reach; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    if (fn(cx + dx, cy + dy)) return true;
  }
  return false;
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
/* a game-map shore: each tile takes what most of its neighbours are, a few times over, so the thin piers,
   the one-tile coves and the jagged bits of the harbour go; then islands go under and puddles are filled */
for (let pass = 0; pass < 3; pass++) {
  const next = grid(false);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let wet = 0, all = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (inside(x + b, y + a)) { all++; if (sea[y + a][x + b]) wet++; }
    next[y][x] = wet * 2 > all;
  }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sea[y][x] = next[y][x];
}
{
  /* the sea is what the gulf reaches; land not joined to the mainland goes under */
  const [sx, sy] = P([41.2445, 13.620]), wet = grid(false), q: XY[] = [[Math.floor(sx), Math.floor(sy)]];
  while (q.length) { const [x, y] = q.pop()!; if (!inside(x, y) || wet[y][x] || !sea[y][x]) continue; wet[y][x] = true; q.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  const dry = grid(false), q2: XY[] = [[0, 0]];
  while (q2.length) { const [x, y] = q2.pop()!; if (!inside(x, y) || dry[y][x] || wet[y][x]) continue; dry[y][x] = true; q2.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]); }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) sea[y][x] = !dry[y][x];
}
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (sea[y][x]) G[y][x] = '~';
const isLand = (x: number, y: number) => inside(x, y) && !sea[y][x];

/* ---------- 2. hills: the Aurunci along the top, the green hills west of town ---------- */
for (let x = 0; x < W; x++) {
  const top = 3 + Math.round(noise(x, 0, 1) * 1.6 + Math.sin(x / 9) * 0.8);
  for (let y = 0; y < top; y++) set(x, y, noise(x, y, 2) < 0.12 ? 'Q' : noise(x, y, 3) < 0.06 ? 'J' : 'M');
}
for (const a of osm.areas) if (a.kind === 'wood') for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) set(x, y, noise(x, y, 4) < 0.3 ? 'Q' : 'M'); });
/* and the ones drawn by hand, with a ragged edge */
for (const h of HILLS) for (let y = h.y0; y < h.y1; y++) for (let x = h.x0; x < h.x1; x++) {
  const edge = x === h.x1 - 1 || y === h.y0 || y === h.y1 - 1;
  if (isLand(x, y) && !(edge && noise(x, y, 20) < 0.4)) set(x, y, noise(x, y, 4) < 0.3 ? 'Q' : 'M');
}

/* ---------- 3. green: the pineta, parks (no olive groves in them later) ---------- */
const green = grid(false);
for (const a of osm.areas) {
  /* the woods toward Gaeta: broadleaf trees (the umbrella pines are the Pineta di Vindicio's, drawn with the places) */
  if (a.kind === 'forest') for (const r of a.rings) polygon(r, (x, y) => { if (isLand(x, y)) { green[y][x] = true; set(x, y, noise(x, y, 5) < 0.22 ? 'T' : noise(x, y, 6) < 0.08 ? 'f' : '.'); } });
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
  /* in town the sea is walled by a stone quay */
  if (z.kind === 'town' && d <= 2) set(x, y, '_');
  if (z.kind === 'rocky' && d === 1) set(x, y, noise(x, y, 10) < 0.35 ? 'R' : ':');
}
/* rocks in the water are drawn as sea */
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (get(x, y) === 'R') { sea[y][x] = true; }
if (process.argv.includes('--base')) {
  console.log('    ' + Array.from({ length: W }, (_, x) => (x % 10 === 0 ? String(Math.floor(x / 10) % 10) : ' ')).join(''));
  console.log('    ' + Array.from({ length: W }, (_, x) => String(x % 10)).join(''));
  G.forEach((r, y) => console.log(String(y).padStart(3) + ' ' + r.map((c) => (/[~R]/.test(c) ? '~' : /[:P]/.test(c) ? ':' : /[MQJ]/.test(c) ? 'M' : /[iT_]/.test(c) ? c : '.')).join('')));
  process.exit(0);
}

/* ---------- 5. the railway: one line, from its tunnel to the edge of the map ---------- */
walkLine({ name: 'ferrovia', w: 1, pts: RAIL }, (x, y) => { if (!inside(x, y)) return; if (!isLand(x, y)) problems.push('railway in the sea at ' + x + ',' + y); else set(x, y, 'r'); });
const tunnels: [number, number][] = TUNNEL_ENDS.map(([x, y]) => [x, y - 1]);

/* ---------- 6. the streets, and the footpaths of the pineta ---------- */
const STREET = /[=vz]/;
const isStreet = (x: number, y: number) => STREET.test(get(x, y));
for (const l of STREETS) walkLine(l, (x, y) => {
  if (!inside(x, y)) return;
  if (!isLand(x, y)) { problems.push(l.name + ' in the sea at ' + x + ',' + y); return; }
  set(x, y, l.ch || '=');   /* over the railway: a level crossing */
});
for (const l of PATHS) walkLine(l, (x, y) => { if (isLand(x, y) && !isStreet(x, y) && get(x, y) !== 'r') set(x, y, ','); });
{
  const pieces = components(isStreet);
  if (pieces.length > 1) problems.push('the streets are in ' + pieces.length + ' pieces: ' + pieces.map((c) => c[0].join(',') + ' (' + c.length + ')').join(' '));
}

/* ---------- 7. by hand ---------- */
for (const c of CLEAR) for (let y = c.y; y < c.y + c.h; y++) for (let x = c.x; x < c.x + c.w; x++) if (isLand(x, y) && !/[=v,r]/.test(get(x, y))) set(x, y, c.to || '.');
for (const p of PAINT) p.rows.forEach((line, dy) => [...line].forEach((ch, dx) => { if (ch !== ' ') set(p.x + dx, p.y + dy, ch); }));

/* ---------- 8. the places: near where each one really is, with the door on a street ---------- */
const reserved = grid(false);
/** the tiles under a building: nothing goes through them */
const foot = grid(false);
/** the footpaths to the doors: no one stands on them */
const pathed = grid(false);
/** the tiles just above a building, hidden by its roof: no one stands there */
const roofed = grid(false);
const roof = (x: number, y: number, w: number) => { for (let a = y - 2; a < y; a++) for (let b = x; b < x + w; b++) if (inside(b, a)) roofed[a][b] = true; };
/** where people, signs and things stand */
const spotted = grid(false);
const free = (x: number, y: number) => inside(x, y) && !reserved[y][x];
/* buildings and gardens stand on open ground, never on a street, a quay or the railway */
const OPEN = /[.fTiOQ]/;
const GROUND: Record<string, RegExp> = { land: OPEN, sand: /[:PI]/, sea: /~/, area: OPEN, beach: /[:PI~]/ };
const STEP_ON = /[.f:_v,=zH]/;
/** a street, a square, a quay or a promenade: where a door may open */
const WAY = /[=vz_]/;
interface At { x: number; y: number; w: number; h: number; door?: [number, number] }
const placed: Record<string, At> = {};
const misses: string[] = [];
/** a footpath from the tile in front of a door to the nearest street, square or quay; null when there is none within `limit` */
function pathToStreet(x: number, y: number, limit: number, draw = true): number | null {
  if (WAY.test(get(x, y))) return 0;
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
  const ok = p.kind === 'area' ? (p.on === 'sand' ? GROUND.beach : GROUND.area) : GROUND[p.on || 'land'], dx = p.doorAt == null ? Math.floor(p.w / 2) : p.doorAt;
  const body = (x: number, y: number) => {
    for (let yy = y; yy < y + p.h; yy++) for (let xx = x; xx < x + p.w; xx++) if (!free(xx, yy) || !ok.test(get(xx, yy))) return false;
    return true;
  };
  /* a square must open on a street */
  const onStreet = (x: number, y: number) => {
    for (let k = -1; k <= p.w; k++) if (WAY.test(get(x + k, y - 1)) || WAY.test(get(x + k, y + p.h))) return true;
    for (let k = 0; k < p.h; k++) if (WAY.test(get(x - 1, y + k)) || WAY.test(get(x + p.w, y + k))) return true;
    return false;
  };
  /* first try with the door right on a street; then a few steps of footpath away */
  const tries: ((x: number, y: number) => boolean)[] = [];
  if (p.door && p.on !== 'sand') {
    tries.push((x, y) => free(x + dx, y + p.h) && WAY.test(get(x + dx, y + p.h)));
    tries.push((x, y) => free(x + dx, y + p.h) && STEP_ON.test(get(x + dx, y + p.h)) && pathToStreet(x + dx, y + p.h, 4, false) != null);
  } else if (p.door) tries.push((x, y) => free(x + dx, y + p.h) && STEP_ON.test(get(x + dx, y + p.h)));
  else if (p.fill === 'piazza') tries.push(onStreet);
  else tries.push(() => true);
  let found: boolean;
  if (p.tile) {
    /* picked by hand: it only has to keep off the streets, the railway, the sea and the other buildings (the room around them is fine) */
    const [tx, ty] = p.tile;
    found = true;
    for (let y = ty; y < ty + p.h; y++) for (let x = tx; x < tx + p.w; x++) if (!isLand(x, y) || /[=vzr]/.test(get(x, y)) || foot[y][x]) { problems.push(p.id + ' at ' + p.tile + ': tile ' + x + ',' + y + ' is taken (' + get(x, y) + ')'); found = false; }
    if (found) placed[p.id] = { x: tx, y: ty, w: p.w, h: p.h, door: p.door ? [tx + dx, ty + p.h - 1] : undefined };
  } else found = tries.some((door) => rings(x0, y0, p.reach == null ? 10 : p.reach, (x, y) => {
    if (!body(x, y) || !door(x, y)) return false;
    placed[p.id] = { x, y, w: p.w, h: p.h, door: p.door ? [x + dx, y + p.h - 1] : undefined };
    return true;
  }));
  if (!found) { misses.push(p.id + ' near ' + x0 + ',' + y0); continue; }
  const at = placed[p.id], room = p.room == null ? 1 : p.room;
  for (let y = at.y - room; y < at.y + at.h + room; y++) for (let x = at.x - room; x < at.x + at.w + room; x++) {
    if (!inside(x, y)) continue;
    reserved[y][x] = true;
    const inFoot = x >= at.x && x < at.x + at.w && y >= at.y && y < at.y + at.h;
    if (!inFoot && /[TiQPIO]/.test(get(x, y))) set(x, y, get(x, y) === 'P' || get(x, y) === 'I' ? ':' : get(x, y) === 'Q' ? 'M' : '.');
  }
  /* open places are painted into the ground */
  if (p.kind === 'area') for (let y = at.y; y < at.y + at.h; y++) for (let x = at.x; x < at.x + at.w; x++) {
    const edge = x === at.x || y === at.y || x === at.x + at.w - 1 || y === at.y + at.h - 1;
    if (p.fill === 'piazza') set(x, y, edge && (x - at.x) % 3 === 0 && y === at.y ? 'L' : 'v');
    else if (p.fill === 'garden') set(x, y, edge && noise(x, y, 11) < 0.45 ? 'T' : noise(x, y, 12) < 0.3 ? 'f' : '.');
    else if (p.fill === 'beach') { set(x, y, ':'); sea[y][x] = false; }
    else if (p.fill === 'pines') { green[y][x] = true; if (get(x, y) !== ',') set(x, y, noise(x, y, 5) < 0.42 ? 'i' : noise(x, y, 6) < 0.1 ? 'f' : '.'); }
    else if (p.fill === 'field') set(x, y, '.');
  }
  if (p.kind !== 'area' && p.on !== 'sea') {
    roof(at.x, at.y, at.w);
    for (let y = at.y; y < at.y + at.h; y++) for (let x = at.x; x < at.x + at.w; x++) { foot[y][x] = true; if (/[TiQO]/.test(get(x, y))) set(x, y, '.'); }
  }
}
/* the doors not right on a street get their few steps of footpath */
for (const p of PLACES) {
  const at = placed[p.id];
  if (!at || !at.door || p.on === 'sand') continue;
  if (pathToStreet(at.door[0], at.door[1] + 1, 30) == null) misses.push(p.id + ' (no path to a street)');
}
/* the Eclipse beach: two rows of umbrellas with their sunbeds, two gazebos, the beach-volley net, and the windsurf
   school on the shore (Nicola Spadea's boards); out at sea, windsurfers and the line of buoys */
{
  const b = placed['eclipse-spiaggia'];
  if (b) {
    for (const row of [1, 3]) for (let k = 0; k < 3; k++) { set(b.x + 1 + k * 3, b.y + row, 'u'); set(b.x + 2 + k * 3, b.y + row, 'h'); }
    for (let k = 0; k < 3; k++) set(b.x + 9 + k, b.y + 3, 'N');
    set(b.x, b.y, 'g'); set(b.x + b.w - 1, b.y, 'g');
    set(b.x, b.y + b.h - 1, 'S'); set(b.x + 1, b.y + b.h - 1, 'S');
    for (const [dx, dy] of [[3, 9], [10, 12], [-3, 12], [16, 9]]) if (get(b.x + dx, b.y + dy) === '~') set(b.x + dx, b.y + dy, 'V');
  }
}
/* the other lidi: a row of umbrellas and sunbeds on the sand in front */
for (const id of ['scogliera', 'oriente']) {
  const l = placed[id];
  if (!l) continue;
  for (let x = l.x - 1; x <= l.x + l.w; x++) {
    const y = l.y + l.h + 1, k = (x - l.x + 3) % 3;
    if (get(x, y) === ':' && free(x, y) && k < 2) set(x, y, k === 0 ? 'u' : 'h');
  }
}
/* the line of buoys off the beach of Vindicio, three tiles out, a buoy every few tiles */
{
  const wet = (x: number, y: number) => !inside(x, y) || sea[y][x];
  for (let y = 55; y < H; y++) for (let x = 18; x < 62; x++) {
    if (get(x, y) !== '~' || (x + y) % 4) continue;
    let near = 9;
    for (let d = 1; d <= 3 && near === 9; d++) for (let a = -d; a <= d; a++) for (let b = -d; b <= d; b++) if (!wet(x + a, y + b)) near = Math.min(near, d);
    if (near === 3) set(x, y, 'y');
  }
}
for (const [x, y] of tunnels) { reserved[y][x] = true; reserved[y + 1][x] = true; foot[y][x] = true; }

/* the Porticciolo romano of Gianola: the stone tanks of Mamurra's fishpond in the sea, joined to the beach */
{
  const POND = ['_______', '_~~_~~_', '_~~_~~_', '___~___'], px = 147, py = 60;
  POND.forEach((line, dy) => [...line].forEach((ch, dx) => { const x = px + dx, y = py + dy; if (!inside(x, y) || !sea[y][x]) return; set(x, y, ch); sea[y][x] = ch === '~'; }));
  for (let x = px + 7; x < W && sea[py + 1][x]; x++) { set(x, py + 1, '_'); sea[py + 1][x] = false; }
}
/* Maranola, up in the Aurunci: no trees where its houses are drawn */
for (let y = 0; y < 4; y++) for (let x = 71; x < 80; x++) if (/[QJ]/.test(get(x, y))) set(x, y, 'M');

/* ---------- 9. people, signs and things, by their places ---------- */
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
    /* two ways to reach it, so nothing placed later can shut it in, and it must not shut in a spot placed before */
    const walk = (a: number, b: number) => inside(a, b) && !foot[b][a] && STEP_ON.test(get(a, b));
    if (N4.filter(([ax, ay]) => walk(x + ax, y + ay)).length < 2) return false;
    if (N4.some(([ax, ay]) => inside(x + ax, y + ay) && spotted[y + ay][x + ax] && !N4.some(([bx, by]) => (x + ax + bx !== x || y + ay + by !== y) && walk(x + ax + bx, y + ay + by)))) return false;
    spots[s.id] = [x, y]; reserved[y][x] = true; foot[y][x] = true; spotted[y][x] = true;
    return true;
  });
  if (!found) misses.push(s.id + ' near ' + tx + ',' + ty);
}
/* a tree just below someone would hide him behind its crown */
const UNDER: Record<string, string> = { T: '.', i: '.', O: '.', P: ':', I: ':', p: ',', Q: 'M', J: 'M' };
for (const [x, y] of Object.values(spots)) for (let d = 1; d <= 2; d++) { const g = get(x, y + d); if (UNDER[g]) set(x, y + d, UNDER[g]); }
/* the people and signs off the streets (in the pineta, by the Tomba di Cicerone) get a footpath to them */
for (const id of ['zendavid', 'sign-pineta', 'motorino-pineta', 'sign-tomba', 'turista']) {
  const sp = spots[id];
  if (!sp) continue;
  const by = N4.map(([a, b]): XY => [sp[0] + a, sp[1] + b]).find(([x, y]) => inside(x, y) && !foot[y][x] && /[.f,_]/.test(get(x, y)));
  if (by && pathToStreet(by[0], by[1], 40) == null) misses.push(id + ' (no path to a street)');
}

/* boats moored along the quays of the harbour */
for (let y = 40; y < 58; y++) for (let x = 76; x < 104; x++) {
  if (get(x, y) !== '~' || !free(x, y) || !N4.some(([a, b]) => get(x + a, y + b) === '_')) continue;
  if (noise(x, y, 21) < 0.22) set(x, y, 'o');
}

/* ---------- 10. the town around: houses along the streets of every neighbourhood ---------- */
/* each neighbourhood has its own houses: the old stone houses of the borghi (Castellone, Mola), the villas of
   Vindicio, the palazzine of via Amendola, shops along via Vitruvio */
const TOWN: { x0: number; y0: number; x1: number; y1: number; kinds: string[]; every: number }[] = [
  { x0: 40, y0: 30, x1: 66, y1: 50, kinds: ['borgo', 'borgo', 'borgo', 'shop'], every: 0.9 },   /* Castellone */
  { x0: 84, y0: 22, x1: 112, y1: 41, kinds: ['borgo', 'borgo', 'shop', 'borgo'], every: 0.9 },  /* Mola */
  { x0: 19, y0: 34, x1: 40, y1: 62, kinds: ['villa', 'villa', 'house'], every: 0.6 },           /* Vindicio */
  { x0: 40, y0: 4, x1: 99, y1: 22, kinds: ['house', 'condo', 'house'], every: 0.5 },            /* Rio Fresco */
  { x0: 40, y0: 22, x1: 99, y1: 50, kinds: ['house', 'condo', 'shop', 'shop'], every: 0.85 },   /* the centre */
  { x0: 99, y0: 13, x1: 165, y1: 27, kinds: ['condo', 'house', 'condo'], every: 0.65 },         /* Santo Janni, Via Amendola */
  { x0: 148, y0: 29, x1: 165, y1: 56, kinds: ['villa', 'house'], every: 0.55 }                  /* Gianola */
];
const houses: { kind: string; x: number; y: number; w: number; h: number; door: [number, number]; v: number }[] = [];
/* first the houses with the door right on a street, then the ones a short path away */
for (const far of [0, 2]) for (const z of TOWN) for (let y = z.y0; y < z.y1; y++) for (let x = z.x0; x < z.x1; x++) {
  if (noise(x, y, 16) > z.every) continue;
  let kind = z.kinds[Math.floor(noise(x, y, 13) * z.kinds.length)];
  /* the north side of via Vitruvio is all shops */
  if (y + 2 === 36 && x >= 57 && x <= 96 && kind !== 'condo') kind = 'shop';
  const w = kind === 'condo' ? 4 : 3, h = kind === 'condo' ? 3 : 2;
  let fits = true;
  for (let a = y; a < y + h && fits; a++) for (let b = x; b < x + w && fits; b++) if (!free(b, a) || !/[.fT]/.test(get(b, a))) fits = false;
  /* room to walk around it: no building, railway, sea or hill right next to it */
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
/* tree-lined roads: the Appia out of town, the lungomare of Vindicio, the road along the bay to Gianola */
const AVENUES: { x0: number; y0: number; x1: number; y1: number; every: number }[] = [
  { x0: 0, y0: 47, x1: 40, y1: 51, every: 3 }, { x0: 16, y0: 50, x1: 22, y1: 82, every: 3 }, { x0: 99, y0: 25, x1: 165, y1: 30, every: 3 }
];
for (const a of AVENUES) for (let y = a.y0; y < a.y1; y++) for (let x = a.x0; x < a.x1; x++) {
  if (get(x, y) !== '.' || !free(x, y) || foot[y][x] || pathed[y][x]) continue;
  if (!N4.some(([dx, dy]) => get(x + dx, y + dy) === '=')) continue;
  if ((x + y) % a.every === 0) set(x, y, 'T');
}
/* zebra crossings where the streets of the centre meet Via Vitruvio and the Appia */
for (const [x, rows] of [[55, [36, 37]], [65, [36, 37]], [69, [36, 37]], [83, [36, 37]], [53, [48, 49]], [65, [48, 49]]] as [number, number[]][]) {
  for (const y of rows) if (get(x, y) === '=') set(x, y, 'z');
}

/* ---------- 11. the centre is paved: pavements along its streets, no scraps of grass between them ---------- */
const URBAN: { x0: number; y0: number; x1: number; y1: number }[] = [{ x0: 57, y0: 33, x1: 100, y1: 52 }];
for (const z of URBAN) {
  const pave: XY[] = [];
  for (let y = z.y0; y < z.y1; y++) for (let x = z.x0; x < z.x1; x++) {
    if (!/[.f]/.test(get(x, y)) || (foot[y][x] && !spotted[y][x])) continue;
    let near = false;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (/[=z]/.test(get(x + b, y + a))) near = true;
    if (near) pave.push([x, y]);
  }
  for (const [x, y] of pave) set(x, y, '_');
  const inZ = (x: number, y: number) => x >= z.x0 && x < z.x1 && y >= z.y0 && y < z.y1;
  for (const c of components((x, y) => inZ(x, y) && /[.f]/.test(get(x, y)))) if (c.length <= 6) for (const [x, y] of c) set(x, y, '_');
}
/* Castellone, the old borgo: no lawns, stone everywhere between its houses */
for (let y = 33; y < 49; y++) for (let x = 41; x < 66; x++) if (/[.fT]/.test(get(x, y)) && !green[y][x]) set(x, y, '_');
/* the polygonal walls of the borgo, along its edge under the railway and down via Castellone */
for (const [x, y] of [...Array.from({ length: 14 }, (_, k): XY => [42 + k, 33]), ...Array.from({ length: 5 }, (_, k): XY => [55, 38 + k])]) {
  if (get(x, y) === '_' && !foot[y][x] && !pathed[y][x]) set(x, y, 'W');
}
/* Mola: fishing nets drying on the quay by the boats */
for (let y = 28; y < 46; y++) for (let x = 84; x < 104; x++) {
  if (get(x, y) !== '_' || foot[y][x] || pathed[y][x] || !N4.some(([a, b]) => /[~o]/.test(get(x + a, y + b)))) continue;
  if (noise(x, y, 22) < 0.3) set(x, y, 'e');
}

/* ---------- 12. the countryside: olive trees in rows you can walk between, a few lone trees ---------- */
const nearStreet = (x: number, y: number) => N4.some(([a, b]) => /[=v,r_]/.test(get(x + a, y + b)));
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  if (get(x, y) !== '.' || green[y][x] || !free(x, y) || foot[y][x] || nearStreet(x, y)) continue;
  const grove = noise(Math.floor(x / 7), Math.floor(y / 6), 19) < 0.5;
  if (grove && y % 3 === 1 && x % 2 === 0) set(x, y, 'O'); else if (noise(x, y, 18) < 0.02) set(x, y, 'T');
}
if (misses.length) console.log('NOT PLACED:', misses.join(' | '));
if (problems.length) console.log('PROBLEMS:\n  ' + problems.slice(0, 40).join('\n  '));

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
