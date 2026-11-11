/* How much there is to do on the Formia map, screen by screen: npx tsx tools/formia/density.ts [--csv]
   (VISIONE.md, V3: «no screen without something to do».)

   A screen is what a laptop shows of the map, 20 × 12 tiles. For each one the tool counts what a player can do there:
   someone to talk to, a sign to read, the door of a place (not of the houses that only fill the streets), a lost thing, tall grass or rock pools with creatures, a trainer. Then
   it measures the desert: the tiles you can walk on that are more than FAR steps from anything to do, and how much
   of the walk between the stops of the story is spent in it. The numbers to bring down are at the bottom.

   It reads the map as the game prepares it (story/maps.ts): what the story hides behind a flag is counted as there.
   tests/unit/density.test.ts holds the numbers of today as a ceiling: the desert can shrink, not grow. */
import { MAPS } from '../../src/data/maps';
import { prepare } from '../../src/story/maps';
import { TRAINERS } from '../../src/data/trainers';
import { pathToFileURL } from 'node:url';

export const SW = 20, SH = 12, FAR = 10;
export type Kind = 'person' | 'trainer' | 'sign' | 'door' | 'item' | 'wild';
export interface Screen { cx: number; cy: number; walk: number; n: Record<Kind, number>; desert: number }
/** the tall grass of one patch counts once: a screen has creatures or it has not */
export function things(s: Screen) { return s.n.person + s.n.trainer + s.n.sign + s.n.door + s.n.item + (s.n.wild ? 1 : 0); }
/** the map measured: every screen, the ones you walk with nothing to do, the walkable tiles and how many are desert */
export function density() {
  const P = prepare('formia'), W = P.w, H = P.h, N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const solid = (x: number, y: number) => x < 0 || y < 0 || x >= W || y >= H || P.solid[y * W + x] === 1;

  /* what there is to do, tile by tile */
  const todo: { x: number; y: number; k: Kind }[] = [];
  P.people.forEach((p) => {
    if (p.n.pet != null) return;
    todo.push({ x: p.x, y: p.y, k: p.n.wild ? 'wild' : p.n.trainer && TRAINERS[p.n.trainer] ? 'trainer' : 'person' });
  });
  (P.signs || []).forEach((s) => todo.push({ x: s.x, y: s.y, k: 'sign' }));
  (P.buildings || []).forEach((b) => { if (b.to || b.gate || b.id.indexOf('casa-') !== 0) todo.push({ x: b.door[0], y: b.door[1], k: 'door' }); });
  P.items.forEach((i) => todo.push({ x: i.x, y: i.y, k: 'item' }));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = P.cell(x, y).deco; if (d === 'tall' || d === 'pools') todo.push({ x, y, k: 'wild' }); }

  /* the tiles reached on foot from home, and how far each is from something to do (through walkable tiles) */
  const [sx, sy] = MAPS.formia.start;
  const flood = (from: number[]) => {
    const d = new Int32Array(W * H).fill(-1), q = from.slice();
    q.forEach((k) => { d[k] = 0; });
    for (let i = 0; i < q.length; i++) {
      const k = q[i], x = k % W, y = (k / W) | 0;
      for (const [a, b] of N4) { const nx = x + a, ny = y + b; if (!solid(nx, ny) && d[ny * W + nx] < 0) { d[ny * W + nx] = d[k] + 1; q.push(ny * W + nx); } }
    }
    return d;
  };
  const home = flood([sx + sy * W]);
  /* something to do is reached from the walkable tiles beside it (a person, a sign and a door are solid themselves) */
  const seeds: number[] = [];
  todo.forEach((t) => { for (const [a, b] of [[0, 0], ...N4]) { const x = t.x + a, y = t.y + b; if (!solid(x, y) && home[y * W + x] >= 0) seeds.push(x + y * W); } });
  const near = flood(Array.from(new Set(seeds)));

  /* screen by screen */
  const cols = Math.ceil(W / SW), rows = Math.ceil(H / SH);
  const screens: Screen[] = [];
  for (let cy = 0; cy < rows; cy++) for (let cx = 0; cx < cols; cx++) {
    const s: Screen = { cx, cy, walk: 0, n: { person: 0, trainer: 0, sign: 0, door: 0, item: 0, wild: 0 }, desert: 0 };
    for (let y = cy * SH; y < Math.min(H, (cy + 1) * SH); y++) for (let x = cx * SW; x < Math.min(W, (cx + 1) * SW); x++) {
      if (!solid(x, y) && home[y * W + x] >= 0) { s.walk++; if (near[y * W + x] < 0 || near[y * W + x] > FAR) s.desert++; }
    }
    todo.forEach((t) => { if (Math.floor(t.x / SW) === cx && Math.floor(t.y / SH) === cy) s.n[t.k]++; });
    screens.push(s);
  }
  const walked = screens.filter((s) => s.walk >= 12), empty = walked.filter((s) => things(s) === 0), poor = walked.filter((s) => things(s) > 0 && things(s) <= 2);
  let land = 0, desert = 0;
  screens.forEach((s) => { land += s.walk; desert += s.desert; });
  return { W, H, cols, rows, screens, todo, walked, empty, poor, land, desert };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { W, H, cols, rows, screens, todo, walked, empty, poor, land, desert } = density();
  if (process.argv.includes('--csv')) {
    console.log('col,row,walkable,person,trainer,sign,door,item,wild,things,desert');
    screens.forEach((s) => console.log([s.cx, s.cy, s.walk, s.n.person, s.n.trainer, s.n.sign, s.n.door, s.n.item, s.n.wild, things(s), s.desert].join(',')));
  } else {
    console.log('Formia, ' + W + ' × ' + H + ' tiles: ' + cols + ' × ' + rows + ' screens of ' + SW + ' × ' + SH + '.');
    console.log('Things to do on each screen (· no walking there, 0 a screen you cross with nothing to do):\n');
    for (let cy = 0; cy < rows; cy++) {
      console.log('  ' + screens.filter((s) => s.cy === cy).map((s) => (s.walk < 12 ? '·' : String(Math.min(99, things(s)))).padStart(3)).join(''));
    }
    const count = (k: Kind) => todo.filter((t) => t.k === k).length;
    console.log('\nTo do in all: ' + count('person') + ' people, ' + count('trainer') + ' trainers, ' + count('sign') + ' signs, ' + count('door') + ' doors, ' + count('item') + ' lost things, ' + count('wild') + ' tiles with creatures.');
    console.log('\nThe numbers to bring down (VISIONE.md, V3):');
    console.log('  screens you walk with nothing to do:  ' + empty.length + ' of ' + walked.length + '  (' + empty.map((s) => s.cx + ',' + s.cy).join(' ') + ')');
    console.log('  screens with one or two things only:  ' + poor.length + ' of ' + walked.length);
    console.log('  walkable tiles more than ' + FAR + ' steps from anything to do:  ' + desert + ' of ' + land + '  (' + Math.round(100 * desert / land) + '%)');
  }
}
