/* Reproducible geographic Formia. Urban scale: 20 m/tile; source streets, coast and sports grounds are OSM.
   Run npx tsx tools/formia/build.ts. Errors stop generation instead of silently dropping a place.
   © OpenStreetMap contributors, ODbL 1.0. See docs/fonti-formia.md for survey sources and approximations. */
import fs from 'node:fs';
import { W, H, col, row, tile } from '../../src/data/maps/formia-projection';
import { PLACES, SPOTS, HIDING } from '../../src/data/maps/formia-places';
import { STREETS, RAIL_LINES, PATHS, TRAILS, TERRACES, SCARPS, LEDGES, type XY, type Line } from './network';
import { LEGEND } from '../../src/data/maps/legend';
import { streetPieces, deadEnds, railEnds } from './playable';
type LL = [number, number];
interface Area {
  kind: string;
  sport: string;
  name: string;
  rings: LL[][];
}
interface SurveyWay {
  id: string;
  tags: Record<string, string>;
  pts: LL[];
}
interface At {
  x: number;
  y: number;
  w: number;
  h: number;
  door?: XY;
}
const read = (file: string) => JSON.parse(fs.readFileSync(new URL(file, import.meta.url), 'utf8'));
const osm = read('./osm-extract.json') as { coast: LL[][]; areas: Area[] };
const survey = read('./survey-osm.json') as { buildings: SurveyWay[] };
const centre = read('./survey-centre.json') as { ways: SurveyWay[] };
const grid = <T>(v: T): T[][] => Array.from({ length: H }, () => Array(W).fill(v));
const G = grid('.'),
  occupied = grid(false),
  reserved = grid(false),
  protectedGround = grid(false),
  doorKeep = grid(false);
const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W && y < H;
const get = (x: number, y: number) => (inside(x, y) ? G[y][x] : '');
const put = (x: number, y: number, ch: string) => {
  if (inside(x, y)) G[y][x] = ch;
};
const N4: XY[] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];
const P = ([a, b]: LL): XY => [col(b), row(a)];
const seed = (x: number, y: number, k = 0) => {
  let n = Math.imul(x + k * 17, 374761393) ^ Math.imul(y + k * 53, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
function cells(a: XY, b: XY, fn: (x: number, y: number) => void) {
  let x = Math.floor(a[0]),
    y = Math.floor(a[1]);
  const ex = Math.floor(b[0]),
    ey = Math.floor(b[1]),
    dx = b[0] - a[0],
    dy = b[1] - a[1],
    sx = dx > 0 ? 1 : -1,
    sy = dy > 0 ? 1 : -1;
  const tx = dx ? Math.abs(1 / dx) : Infinity,
    ty = dy ? Math.abs(1 / dy) : Infinity;
  let ux = dx ? (sx > 0 ? x + 1 - a[0] : a[0] - x) * tx : Infinity,
    uy = dy ? (sy > 0 ? y + 1 - a[1] : a[1] - y) * ty : Infinity;
  fn(x, y);
  for (let i = 0; (x !== ex || y !== ey) && i < 10000; i++) {
    if (ux < uy) {
      x += sx;
      ux += tx;
    } else {
      y += sy;
      uy += ty;
    }
    fn(x, y);
  }
}
function line(l: Line, fn: (x: number, y: number) => void) {
  for (let i = 1; i < l.pts.length; i++)
    cells(l.pts[i - 1], l.pts[i], (x, y) => {
      fn(x, y);
      if (l.w === 2) {
        fn(x + 1, y);
        fn(x, y + 1);
        fn(x + 1, y + 1);
      }
    });
}
function polygon(ring: LL[], fn: (x: number, y: number) => void) {
  const pts = ring.map(P),
    y0 = Math.max(0, Math.floor(Math.min(...pts.map((p) => p[1])))),
    y1 = Math.min(H - 1, Math.ceil(Math.max(...pts.map((p) => p[1]))));
  for (let y = y0; y <= y1; y++) {
    const xs: number[] = [],
      cy = y + 0.5;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i],
        b = pts[(i + 1) % pts.length];
      if ((a[1] <= cy && b[1] > cy) || (b[1] <= cy && a[1] > cy))
        xs.push(a[0] + ((cy - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
    }
    xs.sort((a, b) => a - b);
    for (let i = 0; i + 1 < xs.length; i += 2)
      for (
        let x = Math.max(0, Math.ceil(xs[i] - 0.5));
        x <= Math.min(W - 1, Math.floor(xs[i + 1] - 0.5));
        x++
      )
        fn(x, y);
  }
}
function flood(from: XY[], can: (x: number, y: number) => boolean) {
  const seen = grid(false),
    q = from.filter((p) => inside(...p));
  q.forEach(([x, y]) => (seen[y][x] = true));
  for (let i = 0; i < q.length; i++)
    for (const [a, b] of N4) {
      const x = q[i][0] + a,
        y = q[i][1] + b;
      if (inside(x, y) && !seen[y][x] && can(x, y)) {
        seen[y][x] = true;
        q.push([x, y]);
      }
    }
  return seen;
}
function nearest(x: number, y: number, radius: number, ok: (x: number, y: number) => boolean): XY | null {
  for (let r = 0; r <= radius; r++)
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        const a = x + dx,
          b = y + dy;
        if (inside(a, b) && ok(a, b)) return [a, b];
      }
  return null;
}
function rect(p: At, fn: (x: number, y: number) => void, margin = 0) {
  for (let y = p.y - margin; y < p.y + p.h + margin; y++)
    for (let x = p.x - margin; x < p.x + p.w + margin; x++) if (inside(x, y)) fn(x, y);
}
const streetName = grid('');
const coast = grid(false);
for (const ring of osm.coast) {
  for (let i = 1; i < ring.length; i++)
    cells(P(ring[i - 1]), P(ring[i]), (x, y) => {
      if (inside(x, y)) coast[y][x] = true;
    });
  for (const [a, b] of [
    [ring[1], ring[0]],
    [ring[ring.length - 2], ring[ring.length - 1]],
  ] as [LL, LL][]) {
    const u = P(a),
      v = P(b),
      d = Math.hypot(v[0] - u[0], v[1] - u[1]) || 1;
    cells(v, [v[0] + ((v[0] - u[0]) / d) * 1200, v[1] + ((v[1] - u[1]) / d) * 1200], (x, y) => {
      if (inside(x, y)) coast[y][x] = true;
    });
  }
}
const sea = flood([tile(41.2445, 13.62)], (x, y) => !coast[y][x]);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (sea[y][x]) G[y][x] = '~';
const land = (x: number, y: number) => inside(x, y) && !sea[y][x];
for (const a of osm.areas)
  for (const ring of a.rings)
    polygon(ring, (x, y) => {
      if (!land(x, y)) return;
      if (a.kind === 'beach') put(x, y, ':');
      if (/park|garden|forest/.test(a.kind))
        put(x, y, seed(x, y) < 0.24 ? (/pineta/i.test(a.name) ? 'i' : 'T') : '.');
      if (a.kind === 'wood') put(x, y, 'Q');
    });
/* Preserve the coast's orientation. Small beach access strips are enlarged by at most two urban tiles. */
for (let pass = 0; pass < 2; pass++) {
  const add: XY[] = [];
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      if (get(x, y) === '~' && (x < 125 || x > 365) && N4.some(([a, b]) => get(x + a, y + b) === ':'))
        add.push([x, y]);
  add.forEach(([x, y]) => {
    sea[y][x] = false;
    put(x, y, ':');
  });
}
/* Quays in the centre, sand at the two ends of the bay. */
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    if (land(x, y) && get(x, y) === '.' && N4.some(([a, b]) => get(x + a, y + b) === '~'))
      put(x, y, x > 125 && x < 370 ? '_' : ':');
for (const r of RAIL_LINES)
  line(r, (x, y) => {
    if (land(x, y)) put(x, y, 'r');
  });
for (const r of STREETS)
  line(r, (x, y) => {
    if (land(x, y)) {
      put(x, y, get(x, y) === 'r' ? 'z' : '=');
      streetName[y][x] = r.name;
    }
  });
for (const r of PATHS.concat(TRAILS))
  line(r, (x, y) => {
    if (land(x, y) && !/[=zr]/.test(get(x, y))) {
      put(x, y, r.ch || ',');
      streetName[y][x] = r.name;
    }
  });
/* Keep the connected urban road network. Disconnected fragments outside the playable road system remain paths. */
const pieces = streetPieces(G.map((r) => r.join('')));
for (const piece of pieces.slice(1)) for (const [x, y] of piece) put(x, y, ',');
const road = (x: number, y: number) => /[=zv_]/.test(get(x, y));
const placed: Record<string, At> = {},
  spots: Record<string, XY> = {},
  houses: (At & { kind: string; door: XY; v: number; id?: string })[] = [],
  streetSigns: { x: number; y: number; text: string[] }[] = [];
/* The track has its real north–south orientation. Areas keep roads through them; only building footprints block. */
for (const p of [...PLACES.filter((p) => p.kind === 'area'), ...PLACES.filter((p) => p.kind !== 'area')]) {
  const q = P(p.at),
    sx = p.tile?.[0] ?? Math.round(q[0] - p.w / 2),
    sy = p.tile?.[1] ?? Math.round(q[1] - p.h / 2);
  const can = (x: number, y: number) => {
    for (let b = y; b < y + p.h; b++)
      for (let a = x; a < x + p.w; a++)
        if (
          !inside(a, b) ||
          (p.kind !== 'area' && p.kind !== 'fountain' && protectedGround[b][a]) ||
          occupied[b][a] ||
          doorKeep[b][a] ||
          (!land(a, b) && p.on !== 'sea' && p.fill !== 'beach') ||
          (p.kind !== 'area' && /[=zr]/.test(get(a, b)))
        )
          return false;
    if (p.door) {
      const a = x + (p.doorAt ?? Math.floor(p.w / 2)),
        b = y + p.h;
      if (!land(a, b) || occupied[b][a] || get(a, b) === 'r') return false;
    }
    return p.on !== 'sea' || get(x, y) === '~';
  };
  const xy = nearest(sx, sy, p.reach ?? 8, can);
  if (!xy) {
    for (let y = sy - 10; y < sy + 12; y++)
      console.log(
        y,
        G[y]
          ?.slice(sx - 12, sx + 14)
          .map((c, k) => (occupied[y][sx - 12 + k] ? 'X' : c))
          .join(''),
      );
    throw Error('No placement for ' + p.id + ' at ' + sx + ',' + sy);
  }
  const at: At = { x: xy[0], y: xy[1], w: p.w, h: p.h };
  if (p.door) at.door = [at.x + (p.doorAt ?? Math.floor(p.w / 2)), at.y + p.h - 1];
  placed[p.id] = at;
  if (at.door) doorKeep[at.door[1] + 1][at.door[0]] = true;
  rect(at, (x, y) => {
    if (
      p.fill === 'courtyard' &&
      Math.hypot(x + 0.5 - (at.x + at.w / 2), y + 0.5 - (at.y + at.h / 2)) > at.w / 2
    )
      return;
    reserved[y][x] = true;
    if (p.kind !== 'area') {
      occupied[y][x] = true;
      put(x, y, p.on === 'sea' ? '~' : p.on === 'sand' ? ':' : '.');
      return;
    }
    if (/[=zr]/.test(get(x, y))) return;
    if (p.fill === 'beach' && !land(x, y)) return; // Keep the source shoreline: a lido must not become a rectangular peninsula.
    const fill = p.fill === 'piazza' ? 'v' : p.fill === 'beach' ? ':' : '.';
    put(x, y, fill);
    if (p.fill === 'beach') sea[y][x] = false;
    if (p.fill === 'pines' && seed(x, y, 1) < 0.24) put(x, y, 'i');
    if (p.fill === 'field' || p.fill === 'yard' || p.fill === 'courtyard') protectedGround[y][x] = true;
  });
}
/* A path is routed over land, never through another building. Dijkstra is unnecessary on uniform footpath ground. */
function connect(start: XY, goal: (x: number, y: number) => boolean, max = 1200) {
  if (goal(...start)) return;
  const seen = new Set<number>(),
    prev = new Map<number, number>(),
    q: XY[] = [start],
    key = (x: number, y: number) => y * W + x;
  seen.add(key(...start));
  let end: number | undefined;
  for (let i = 0; i < q.length; i++) {
    const [x, y] = q[i];
    if (goal(x, y)) {
      end = key(x, y);
      break;
    }
    if (Math.abs(x - start[0]) + Math.abs(y - start[1]) > max) continue;
    for (const [a, b] of N4) {
      const u = x + a,
        v = y + b,
        k = key(u, v);
      if (!land(u, v) || occupied[v][u] || seen.has(k) || /[r#]/.test(get(u, v))) continue;
      seen.add(k);
      prev.set(k, key(x, y));
      q.push([u, v]);
    }
  }
  if (end === undefined) throw Error('No path from ' + start);
  const origin = key(...start);
  for (let k = end; k !== origin; k = prev.get(k)!) {
    const x = k % W,
      y = Math.floor(k / W);
    if (!/[=zv_:H]/.test(get(x, y))) put(x, y, ',');
    reserved[y][x] = true;
  }
  if (!/[=zv_:H]/.test(get(...start))) put(...start, ',');
  reserved[start[1]][start[0]] = true;
}
{
  const c = placed.casa,
    g = placed.giardino;
  g.x = c.x - 2;
  g.y = c.y + c.h;
  g.w = 4;
  g.h = 3;
  rect(g, (x, y) => {
    reserved[y][x] = true;
    protectedGround[y][x] = true;
  });
  // A low garden must stay visible in front of the taller apartment blocks.
  for (let y = g.y + g.h; y <= g.y + g.h + 2; y++)
    for (let x = g.x; x < g.x + g.w; x++) if (inside(x, y)) reserved[y][x] = true;
}
for (const area of osm.areas)
  if (/Bruno Zauli/.test(area.name))
    for (const ring of area.rings)
      polygon(ring, (x, y) => {
        reserved[y][x] = true;
      });
/* Parco la Fontana: all residential footprints in the surveyed block, around the winding Via Amendola.
   These are buildings, not a single giant house. Antonio's ground-floor entrance is the first building by the bend. */
function addHouse(
  kind: string,
  x: number,
  y: number,
  w: number,
  h: number,
  v: number,
  id?: string,
  attach = true,
) {
  const p = { x, y, w, h };
  let ok = true;
  rect(p, (a, b) => {
    if (occupied[b][a] || reserved[b][a] || doorKeep[b][a] || !land(a, b) || /[=zr,:H]/.test(get(a, b)))
      ok = false;
  });
  if (
    !ok ||
    !inside(x + w - 1, y + h) ||
    occupied[y + h][x + Math.floor(w / 2)] ||
    get(x + Math.floor(w / 2), y + h) === 'r' ||
    !land(x + Math.floor(w / 2), y + h)
  )
    return false;
  const door: XY = [x + Math.floor(w / 2), y + h - 1];
  houses.push({ ...p, door, kind, v, id });
  rect(p, (a, b) => {
    occupied[b][a] = true;
    reserved[b][a] = true;
    put(a, b, '.');
  });
  try {
    if (attach) connect([door[0], door[1] + 1], road, 35);
  } catch {
    houses.pop();
    rect(p, (a, b) => {
      occupied[b][a] = false;
      reserved[b][a] = false;
    });
    return false;
  }
  doorKeep[door[1] + 1][door[0]] = true;
  return true;
}
for (const b of survey.buildings) {
  if (!b.id.startsWith('1205206')) continue;
  const p = b.pts.map(P),
    x = Math.floor(Math.min(...p.map((p) => p[0]))),
    y = Math.floor(Math.min(...p.map((p) => p[1]))),
    w = Math.max(2, Math.ceil(Math.max(...p.map((p) => p[0]))) - x),
    h = Math.max(2, Math.ceil(Math.max(...p.map((p) => p[1]))) - y);
  if (b.id === '1205206379') continue;
  const at = nearest(x, y, 5, (u, v) =>
    addHouse('condo', u, v, Math.min(3, w), Math.min(1, h), Number(b.id) % 1000, 'parco-' + b.id, false),
  );
  if (!at) throw Error('Missing surveyed apartment block ' + b.id);
}
for (const p of [...Object.values(placed), ...houses]) if (p.door) connect([p.door[0], p.door[1] + 1], road);
/* Private garden: hedge and iron gate, directly below Antonio's ground-floor flat. */
{
  const c = placed.casa,
    g = placed.giardino;
  // The gate is a walkable ground decoration; it must never become an invisible barrier.
  const gate: XY = [g.x, g.y + 1];
  rect(g, (x, y) => {
    if (occupied[y][x] || /[=zr]/.test(get(x, y))) return;
    const edge = y > g.y && (x === g.x || x === g.x + g.w - 1 || y === g.y + g.h - 1);
    put(x, y, edge ? '#' : '.');
    protectedGround[y][x] = true;
  });
  put(...gate, '!');
  connect(gate, road);
  connect([c.door![0], c.door![1] + 1], (x, y) => x === gate[0] && y === gate[1]);
  put(...gate, '!');
}
/* Sporting surfaces are protected from trees, signs and decorative houses. The entire track is walkable. */
const track = placed.pista;
rect(track, (x, y) => {
  if (!occupied[y][x]) {
    put(x, y, '.');
    protectedGround[y][x] = true;
    reserved[y][x] = true;
  }
});
for (let y = track.y; y < track.y + track.h; y++)
  for (let x = track.x; x < track.x + track.w; x++) {
    const cx = track.x + track.w / 2,
      cy = track.y + track.h / 2,
      r = track.w / 2 - 0.3,
      dy = Math.max(0, Math.abs(y + 0.5 - cy) - (track.h - track.w) / 2),
      d = Math.hypot(x + 0.5 - cx, dy);
    if (d <= r && d >= r - 1.05) put(x, y, '7');
  }
/* Beach furniture follows the existing diagonal shore. The area is a search envelope, not reclaimed land. */
{
  const b = placed['eclipse-spiaggia'];
  const sand = (x: number, y: number) => get(x, y) === ':' && !occupied[y][x];
  for (let y = b.y; y < b.y + b.h; y += 2)
    for (let x = b.x; x < b.x + b.w; x += 2)
      if (sand(x, y) && x !== b.x + Math.floor(b.w / 2)) put(x, y, 'u');
  for (const [dx, dy] of [
    [0, 0],
    [b.w - 1, 0],
    [0, b.h - 1],
    [b.w - 1, b.h - 1],
  ]) {
    const q = nearest(
      b.x + dx,
      b.y + dy,
      6,
      (x, y) => sand(x, y) && N4.filter(([a, c]) => get(x + a, y + c) === ':').length >= 2,
    );
    if (q) put(...q, 'g');
  }
  for (let y = b.y; y < b.y + b.h; y++) {
    const x = b.x + Math.floor(b.w / 2);
    if (land(x, y) && !occupied[y][x] && /[.:u]/.test(get(x, y))) put(x, y, ':');
  }
  for (const [kind, dx] of [
    ['S', 1],
    ['U', 3],
  ] as const) {
    const q = nearest(b.x + dx, b.y + b.h - 1, 8, sand);
    if (q) put(...q, kind);
  }
  for (let k = 0; k < 5; k++) {
    const q = nearest(b.x + 3 + k * 3, b.y + b.h + 1 + (k % 2), 6, (x, y) => get(x, y) === '~');
    if (q) put(...q, k % 2 ? 'y' : 'V');
  }
}
for (const id of ['oriente', 'scogliera']) {
  const p = placed[id];
  for (let d = 1; d <= 8; d += 2) {
    const q = nearest(p.x - 2, p.y + d, 5, (x, y) => get(x, y) === ':' && !occupied[y][x]);
    if (q) put(...q, 'u');
  }
}
/* Street furniture and source-backed urban blocks. Keep one free tile in front of every building. */
for (const b of centre.ways.filter((b) => b.tags.building && !b.tags.amenity && !b.tags.name)) {
  const pts = b.pts.map(P);
  if (!pts.length) continue;
  const x = Math.floor(Math.min(...pts.map((p) => p[0]))),
    y = Math.floor(Math.min(...pts.map((p) => p[1]))),
    w = Math.max(2, Math.min(4, Math.ceil(Math.max(...pts.map((p) => p[0]))) - x)),
    h = Math.max(2, Math.min(3, Math.ceil(Math.max(...pts.map((p) => p[1]))) - y));
  if (!nearest(x, y, 3, road)) continue;
  addHouse(x < 170 ? 'borgo' : x > 290 ? 'condo' : 'house', x, y, w, h, Number(b.id) % 1000);
}
/* Fill the un-surveyed residential verges at a modest density. */
for (let y = 28; y < H - 4; y += 3)
  for (let x = 8; x < W - 4; x += 4) {
    if (seed(x, y, 8) > 0.55 || !nearest(x, y, 2, road)) continue;
    addHouse(x < 125 ? 'villa' : x > 300 ? 'condo' : 'house', x, y, 2, 2, Math.floor(seed(x, y) * 1000));
  }
/* Keep the sea and wall powers tied to identifiable places after changing the map grid.
   The port's masonry is simplified to a navigable basin at the coastal site; see sources. */
const pond: XY = [452, 175];
['_____', '_~~__', '_~~__', '_____'].forEach((r, dy) =>
  [...r].forEach((ch, dx) => {
    const x = pond[0] + dx,
      y = pond[1] + dy;
    if (occupied[y][x]) throw Error('Peschiera overlaps a building');
    put(x, y, ch);
    sea[y][x] = ch === '~';
    reserved[y][x] = true;
  }),
);
const wall = nearest(...tile(41.2562, 13.5987), 12, (x, y) => {
  for (let i = -1; i <= 2; i++)
    for (let j = -1; j <= 1; j++)
      if (
        !land(x + i, y + j) ||
        occupied[y + j][x + i] ||
        LEGEND[get(x + i, y + j)]?.solid ||
        /[=zr]/.test(get(x + i, y + j))
      )
        return false;
  return true;
});
if (!wall) throw Error('No accessible wall of Castellone');
for (let i = -1; i <= 2; i++) {
  put(wall[0] + i, wall[1], 'W');
  occupied[wall[1]][wall[0] + i] = true;
  reserved[wall[1] + 1][wall[0] + i] = true;
}
const powers = {
  swim: [pond[0] + 1, pond[1]] as XY,
  treasure: [pond[0] + 1, pond[1] + 1] as XY,
  climb: [wall[0], wall[1] + 1] as XY,
  wall,
};
connect(powers.swim, road);
connect(powers.climb, road);
/* Re-home older narrative locations onto the appropriate geographic landmarks. */
const overrides: Record<string, XY> = {
  'sign-porticciolo': [455, 173],
  'selv-ulivi-1': [47, 143],
  'selv-ulivi-2': [59, 144],
  'sign-fontana': tile(41.2523, 13.5785),
  'tr-ciclista': tile(41.2528, 13.5825),
  'tr-contadino': [54, 144],
  'sign-tulliola': [45, 142],
  'vista-acervara': [39, 144],
  'selv-gianola-1': tile(41.2508, 13.6665),
  'selv-gianola-2': tile(41.2501, 13.6663),
  'selv-gianola-3': tile(41.2539, 13.6745),
  'sign-cisterna': [433, 153],
  'sign-janara': [428, 157],
  'tr-archeologa': [436, 154],
  'tr-polparo': [433, 162],
  'vista-gianola': [429, 164],
  'selv-macchia': [437, 156],
  'selv-giano': [431, 159],
  'selv-elmo': tile(41.2538, 13.6124),
  'selv-lamo': tile(41.2558, 13.5998),
  'tullio-appia': tile(41.2522, 13.5804),
  'nonna-penitro': tile(41.267, 13.616),
  'ragazzo-salti': [285, 26],
  corridore: [273, 25],
};
const front = grid(false);
for (const p of [...Object.values(placed), ...houses])
  if (p.door) {
    front[p.door[1] + 1][p.door[0]] = true;
  }
front[powers.swim[1]][powers.swim[0]] = true;
front[powers.climb[1]][powers.climb[0]] = true;
const open = (x: number, y: number) =>
  land(x, y) && !occupied[y][x] && !front[y][x] && !protectedGround[y][x] && !/[#r=zu ghSN7]/.test(get(x, y));
for (const s of SPOTS) {
  const p = s.near && placed[s.near.place];
  const q = overrides[s.id] || (p ? ([p.x + s.near!.dx, p.y + s.near!.dy] as XY) : s.tile || tile(...s.at!));
  const sight = (x: number, y: number) =>
    s.id !== 'studente' ||
    [1, 2, 3, 4].every((d) => land(x, y + d) && !occupied[y + d][x] && !LEGEND[get(x, y + d)]?.solid);
  const ok = (x: number, y: number) =>
    sight(x, y) &&
    open(x, y) &&
    (s.walk || !reserved[y][x]) &&
    (s.on !== 'sand' || get(x, y) === ':') &&
    N4.filter(([a, b]) => land(x + a, y + b) && !occupied[y + b][x + a] && !LEGEND[get(x + a, y + b)]?.solid)
      .length >= 2;
  const point =
    (s.walk && p?.door ? ([p.door[0], p.door[1] + 1] as XY) : null) ||
    nearest(...q, 24, ok) ||
    nearest(
      ...q,
      32,
      (x, y) =>
        open(x, y) && N4.filter(([a, b]) => land(x + a, y + b) && !occupied[y + b][x + a]).length >= 2,
    );
  if (!point) throw Error('No spot for ' + s.id + ' at ' + q);
  if (s.id === 'selv-lamo' || s.id === 'sign-cisternone') {
    put(point[0], point[1] + 1, '_');
    front[point[1] + 1][point[0]] = true;
  }
  if (s.id === 'studente') for (let d = 1; d <= 4; d++) front[point[1] + d][point[0]] = true;
  spots[s.id] = point;
  occupied[point[1]][point[0]] = true;
  reserved[point[1]][point[0]] = true;
  const neighbour = nearest(...point, 1, (x, y) => !occupied[y][x] && land(x, y) && !/[#r]/.test(get(x, y)));
  if (!neighbour) throw Error('No access to ' + s.id);
  connect(neighbour, road);
}
/* Mountain ledges, steps and terraces. The sanctuary is reached by the same climb as the belvedere. */
for (const t of TERRACES)
  for (let y = t.y0; y <= t.y1; y++)
    for (let x = t.x0; x <= t.x1; x++)
      if (land(x, y) && !occupied[y][x] && !/[=z,r]/.test(get(x, y))) {
        put(x, y, '.');
        reserved[y][x] = true;
      }
for (const s of SCARPS)
  line({ name: s.name, w: 1, pts: s.pts }, (x, y) => {
    if (!land(x, y) || occupied[y][x] || /[=z]/.test(get(x, y))) return;
    put(x, y, /[,H]/.test(get(x, y)) ? 'H' : s.ch);
    reserved[y][x] = true;
  });
for (const [x, y] of LEDGES) {
  if (!/\^|\[/.test(get(x, y))) continue;
  for (const d of [-1, 1])
    if (!occupied[y + d][x]) {
      put(x, y + d, '.');
      reserved[y + d][x] = true;
    }
  put(x, y, 'j');
}
/* Tall grass and tide pools. */
const hidden: { id: string; x: number; y: number; r: number }[] = [];
for (const h of HIDING) {
  let [x, y] = spots[h.spot];
  {
    const best = nearest(x, y, 60, (a, b) => {
      let n = 0;
      for (let j = -h.r; j <= h.r; j++)
        for (let i = -h.r; i <= h.r; i++)
          if (
            Math.hypot(i, j) <= h.r &&
            get(a + i, b + j) === (h.on === 'sand' ? ':' : '.') &&
            !occupied[b + j]?.[a + i] &&
            !protectedGround[b + j]?.[a + i]
          )
            n++;
      return n >= 9;
    });
    if (best) {
      x = best[0];
      y = best[1];
    }
  }
  hidden.push({ id: h.id, x, y, r: h.r });
  for (let b = y - h.r; b <= y + h.r; b++)
    for (let a = x - h.r; a <= x + h.r; a++)
      if (
        inside(a, b) &&
        Math.hypot(a - x, b - y) <= h.r &&
        !protectedGround[b][a] &&
        !occupied[b][a] &&
        get(a, b) === (h.on === 'grass' ? '.' : ':')
      )
        put(a, b, h.on === 'grass' ? 'E' : 'A');
}
/* Close remote countryside while leaving a generous verge around every route and landmark. */
const anchor = grid(false);
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    anchor[y][x] = reserved[y][x] || occupied[y][x] || /[=zv,_:HEA]/.test(get(x, y));
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++)
    if (land(x, y) && !anchor[y][x] && /[.TQ]/.test(get(x, y))) {
      let close = false;
      for (let b = -3; b <= 3 && !close; b++)
        for (let a = -3; a <= 3; a++)
          if (inside(x + a, y + b) && anchor[y + b][x + a]) {
            close = true;
            break;
          }
      if (!close) put(x, y, y < 60 ? 'M' : seed(x, y) < 0.5 ? 'O' : 'Q');
    }
/* Street plates follow actual street geometry, with a bounded spacing on long streets. */
const used = new Set<string>();
for (const r of STREETS) {
  let last: XY | undefined;
  for (const point of r.pts) {
    const x = Math.floor(point[0]),
      y = Math.floor(point[1]);
    if (!inside(x, y) || (!last && used.has(r.name)) || (last && Math.hypot(x - last[0], y - last[1]) < 24))
      continue;
    const q = nearest(
      x,
      y,
      3,
      (a, b) =>
        open(a, b) && !reserved[b][a] && !LEGEND[get(a, b)]?.solid && N4.some(([u, v]) => road(a + u, b + v)),
    );
    if (!q) continue;
    streetSigns.push({ x: q[0], y: q[1], text: [r.name + '.'] });
    occupied[q[1]][q[0]] = true;
    used.add(r.name);
    last = q;
  }
}
/* A player crossing a larger city still needs to know the street name. Fill gaps in the nameplates,
   using names rasterised from the source lines, rather than adding invented townsfolk or attractions. */
const pointsOfInterest = [
  ...Object.values(spots),
  ...streetSigns.map((s) => [s.x, s.y] as XY),
  ...Object.values(placed)
    .filter((p) => p.door)
    .map((p) => p.door!),
];
for (let by = 0; by < H; by += 12)
  for (let bx = 0; bx < W; bx += 20) {
    if (pointsOfInterest.some(([x, y]) => x >= bx && x < bx + 20 && y >= by && y < by + 12)) continue;
    let found = false;
    for (let y = by; y < Math.min(H, by + 12) && !found; y++)
      for (let x = bx; x < Math.min(W, bx + 20) && !found; x++) {
        if (!streetName[y][x]) continue;
        const q = nearest(
          x,
          y,
          2,
          (a, b) =>
            a >= bx &&
            a < bx + 20 &&
            b >= by &&
            b < by + 12 &&
            open(a, b) &&
            !reserved[b][a] &&
            !LEGEND[get(a, b)]?.solid,
        );
        if (q) {
          streetSigns.push({ x: q[0], y: q[1], text: [streetName[y][x] + '.'] });
          occupied[q[1]][q[0]] = true;
          found = true;
        }
      }
  }
/* Lamps stand on open verges with an eight-tile walkable ring: removing the centre cannot cut a route. */
for (let y = 26; y < H - 2; y++)
  for (let x = 1; x < W - 1; x++) {
    if (
      (x + y) % 14 ||
      reserved[y][x] ||
      occupied[y][x] ||
      front[y][x] ||
      !/[._]/.test(get(x, y)) ||
      !N4.some(([a, b]) => /[=z]/.test(get(x + a, y + b)))
    )
      continue;
    let ring = true;
    for (let b = -1; b <= 1; b++)
      for (let a = -1; a <= 1; a++)
        if (occupied[y + b][x + a] || LEGEND[get(x + a, y + b)]?.solid) ring = false;
    if (ring) put(x, y, get(x, y) === '_' ? 'L' : 'K');
  }
/* Real cul-de-sacs end on paving. They remain usable and do not falsely advertise a through road. */
for (const [x, y] of deadEnds(G.map((r) => r.join('')))) put(x, y, '_');
const tunnels: XY[] = railEnds(
  G.map((r) => r.join('')),
  [],
).map(([x, y]) => [x, y - 1]);
/* Verify access with the same solid terrain and footprints the game uses. */
const canWalk = (x: number, y: number) => inside(x, y) && !occupied[y][x] && !LEGEND[get(x, y)]?.solid;
const reachable = flood([spots.start], canWalk),
  problems: string[] = [];
for (const [id, p] of Object.entries(placed))
  if (p.door && !N4.some(([a, b]) => reachable[p.door![1] + b]?.[p.door![0] + a]))
    problems.push('door ' + id);
for (const [id, [x, y]] of Object.entries(spots))
  if (id !== 'start' && !N4.some(([a, b]) => reachable[y + b]?.[x + a]))
    problems.push('spot ' + id + ' ' + [x, y]);
if (problems.length) throw Error('Unreachable: ' + problems.join(' | '));
for (let i = streetSigns.length - 1; i >= 0; i--) {
  const s = streetSigns[i];
  if (!N4.some(([a, b]) => reachable[s.y + b]?.[s.x + a])) {
    occupied[s.y][s.x] = false;
    streetSigns.splice(i, 1);
  }
}
const rows = G.map((r) => r.join(''));
const out =
  '/* Generated by tools/formia/build.ts. © OpenStreetMap contributors, ODbL 1.0. */\n' +
  'export const FORMIA_ROWS: string[] = ' +
  JSON.stringify(rows, null, 2) +
  ';\n' +
  'export const FORMIA_AT: Record<string, { x:number; y:number; w:number; h:number; door?:[number,number] }> = ' +
  JSON.stringify(placed) +
  ';\n' +
  'export const FORMIA_SPOT: Record<string,[number,number]> = ' +
  JSON.stringify(spots) +
  ';\n' +
  'export const FORMIA_TUNNELS: [number,number][] = ' +
  JSON.stringify(tunnels) +
  ';\n' +
  'export const FORMIA_HOUSES: {kind:string;x:number;y:number;w:number;h:number;door:[number,number];v:number;id?:string}[] = ' +
  JSON.stringify(houses) +
  ';\n' +
  'export const FORMIA_HIDING: {id:string;x:number;y:number;r:number}[] = ' +
  JSON.stringify(hidden) +
  ';\n' +
  'export const FORMIA_POWERS: {swim:[number,number];treasure:[number,number];climb:[number,number];wall:[number,number]} = ' +
  JSON.stringify(powers) +
  ';\n' +
  'export const FORMIA_STREET_SIGNS: {x:number;y:number;text:string[]}[] = ' +
  JSON.stringify(streetSigns) +
  ';\n';
fs.writeFileSync(new URL('../../src/data/maps/formia-ground.ts', import.meta.url), out);
console.log(
  `Generated ${W} × ${H}: ${PLACES.length} places, ${houses.length} buildings, ${SPOTS.length} story spots, ${streetSigns.length} street plates.`,
);
if (process.argv.includes('--print') || process.argv.includes('--base')) console.log(rows.join('\n'));
