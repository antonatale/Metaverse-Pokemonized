import type { Dir, GroundObject, MapDef, Npc, Thing } from './types';

/* The floors of the covi (27 November 2026, Antonio: «gli interni dei covi voglio vederli decisamente più complessi e
   dettagliati e a più piani, dove all'ultimo piano in alto c'è il campione», and the way to him «difficile da
   raggiungere proprio fisicamente»). The ground floor of each covo is the one of data/maps/covi.ts (circolo.ts for
   Forchetta), with the stairs where the keeper used to sit; above it two floors, each with a test of its own made of the
   rules of story/place.ts, and the keeper on the last one, with his own creature (story/covo-crew.ts):
   - Claudia: the crypt, stone islands over the dark joined by bridges that give way once crossed; the hall of black
     obsidian, ice to the throne.
   - Antonio: the lab of portals and belts; the control room, its lasers sweeping on a beat.
   - Andrea: the levers of probability, each one opens a door and shuts another; the roulette, a ring that carries you.
   - Valentin: the dance floor wet with spritz, ice; the stage, its planks breaking and the bass going.
   - Costanzo: the counters of the bureaucracy, in order, under the stamps; the balcony, under the tomatoes of the square.
   - Zendavid: the room of the speakers, waves of bass; the floor of vinyl, ice to the console.
   - Forchetta: the studio of wet canvases that tear once stepped on; the centre court, the ball machine firing.
   Each floor is drawn here as a plan of letters (see `plan`), proved by tests/unit/place.test.ts (from the stairs up
   every state can still reach the top) and tests/unit/floors.test.ts (from the top, the way back down). */

/* ---------- the plan of a floor ---------- */
/** the letters of a plan: the map's own (x wall, F floor, @ a thing standing on the floor) and those of the test:
    # the dark (a floor nobody stands on, drawn as an abyss), i ice, c a floor that gives way, r a rest, R a reset,
    a b e plates that stay down and A B E the gates they open, o q plates that go up and down again and O Q their gates
    (G H: gates of o and q that shut when the plate is down), > < k j belts right, left, up and down,
    1–9 portals (their targets are given apart), Y the stairs up, Z the stairs down, K where the keeper stands */
interface Plan {
  rows: string[];
  pads?: Record<string, [number, number, Dir?]>;
  beats?: Thing[];
}
const PLATE: Record<string, [string, boolean]> = { a: ['a', true], b: ['b', true], e: ['e', true], o: ['o', false], q: ['q', false] };
const GATE: Record<string, [string, boolean]> = { A: ['a', false], B: ['b', false], E: ['e', false], O: ['o', false], Q: ['q', false], G: ['o', true], H: ['q', true] };
const BELT: Record<string, Dir> = { '>': 'right', '<': 'left', k: 'up', j: 'down' };
export interface Built { rows: string[]; things: Thing[]; voids: GroundObject[]; up: [number, number] | null; down: [number, number] | null; keeper: [number, number] | null }
export function plan(p: Plan): Built {
  const things: Thing[] = [], voids: GroundObject[] = [];
  let up: [number, number] | null = null, down: [number, number] | null = null, keeper: [number, number] | null = null;
  const rows = p.rows.map(function (r, y) {
    return [...r].map(function (ch, x) {
      if (ch === 'x' || ch === 'F' || ch === '@') return ch;
      if (ch === '#') { voids.push({ kind: 'void', x, y }); return '@'; }
      if (ch === 'i') things.push({ k: 'ice', x, y });
      else if (ch === 'c') things.push({ k: 'crumble', x, y });
      else if (ch === 'r') things.push({ k: 'rest', x, y });
      else if (ch === 'R') things.push({ k: 'reset', x, y });
      else if (PLATE[ch]) things.push({ k: 'plate', x, y, flag: PLATE[ch][0], once: PLATE[ch][1] || undefined });
      else if (GATE[ch]) things.push({ k: 'gate', x, y, flag: GATE[ch][0], open: GATE[ch][1] || undefined });
      else if (BELT[ch]) things.push({ k: 'slide', x, y, dir: BELT[ch] });
      else if (ch >= '1' && ch <= '9') { const t = p.pads![ch]; things.push({ k: 'pad', x, y, tx: t[0], ty: t[1], tdir: t[2] }); }
      else if (ch === 'Y') up = [x, y];
      else if (ch === 'Z') down = [x, y];
      else if (ch === 'K') keeper = [x, y];
      else throw new Error('plan: what is «' + ch + '» at ' + x + ',' + y);
      return 'F';
    }).join('');
  });
  const w = rows[0].length;
  rows.forEach(function (r, y) { if (r.length !== w) throw new Error('plan: row ' + y + ' is ' + r.length + ' long, not ' + w); });
  return { rows, things: things.concat(p.beats || []), voids, up, down, keeper };
}
const beatsAt = (tiles: [number, number][], every: number, on: number[], look?: Extract<Thing, { k: 'beat' }>['look']): Thing[] =>
  tiles.map(function (t) { return { k: 'beat', x: t[0], y: t[1], every, on, look } as Thing; });

/* ---------- what stands on a floor ---------- */
export const prop = (text: string, x: number, y: number, w = 1, h = 1): GroundObject => ({ kind: 'covo-prop', x, y, w, h, text });
export const rug = (x: number, y: number, w: number, h: number, color: string): GroundObject => ({ kind: 'rug', x, y, w, h, color });
export const banner = (x: number, w: number, text: string, color: string): GroundObject => ({ kind: 'banner', x, y: 0, w, text, color });
const stairs = (at: [number, number], dir: 'up' | 'down'): GroundObject => ({ kind: 'stairs', x: at[0], y: at[1], text: dir });
export const adept = (id: string, name: string, seed: number, x: number, y: number, dir: Npc['dir'], lines: string[], aside?: [number, number]): Npc =>
  ({ id, trainer: id, name, seed, x, y, dir, lines, ...(aside ? { aside } : {}) });
export const keeper = (id: string, person: Npc['person'], covo: string, x: number, y: number): Npc => ({ id, person, covo, x, y, dir: 'down' });

/** a floor: the plan, what stands on it, and the stairs to the floor below and to the one above (or the keeper) */
interface FloorOpts {
  id: string; name: string; theme: string; b: Built;
  below: { map: string; x: number; y: number };
  above?: string;
  objects?: GroundObject[]; signs?: MapDef['signs']; npcs?: Npc[];
  words?: { rest: string; hit: string; fall?: string };
  /** what stands on the `@` tiles nothing else covers (the rocks of an ice floor are tables, speakers, gargoyles) */
  fill?: string;
}
/** where one arrives from the stairs: the tile in front of them */
function inFront(at: [number, number], rows: string[]): [number, number] { return at[1] === rows.length - 1 ? [at[0], at[1] - 1] : at[1] === 0 ? [at[0], at[1] + 1] : [at[0], at[1] - 1]; }
export function floor(o: FloorOpts): MapDef {
  const b = o.b, down = b.down!, entry = inFront(down, b.rows);
  const warps: MapDef['warps'] = [{ x: down[0], y: down[1], to: o.below.map, tx: o.below.x, ty: o.below.y, tdir: 'down' }];
  if (o.above && b.up) { warps.push({ x: b.up[0], y: b.up[1], to: o.above, tx: ABOVE[o.above][0], ty: ABOVE[o.above][1], tdir: 'up' }); }
  /* a thing stands only where the plan has a thing (@): never where one walks */
  const onThing = (q: GroundObject) => { for (let y = q.y; y < q.y + (q.h || 1); y++) for (let x = q.x; x < q.x + (q.w || 1); x++) if ((b.rows[y] || '')[x] !== '@') return false; return true; };
  const goal = b.keeper || b.up!, objects = (o.objects || []).filter(function (q) { return q.kind !== 'covo-prop' || onThing(q); });
  if (o.fill) b.rows.forEach(function (r, y) {
    [...r].forEach(function (ch, x) {
      if (ch === '@' && !b.voids.concat(objects).some(function (q) { return x >= q.x && x < q.x + (q.w || 1) && y >= q.y && y < q.y + (q.h || 1); })) objects.push(prop(o.fill!, x, y));
    });
  });
  return {
    name: o.name, city: 'formia', inside: true, theme: o.theme, rows: b.rows,
    groundObjects: b.voids.concat(objects, [stairs(down, 'down')], b.up ? [stairs(b.up, 'up')] : []),
    signs: o.signs, warps, npcs: o.npcs,
    start: [entry[0], entry[1], 'up'],
    place: { entry: [entry[0], entry[1], 'up'], goal: [goal[0], goal[1]], words: o.words || { rest: '', hit: '' }, things: b.things }
  };
}
/** where each floor is arrived at from below: in front of its stairs down */
const ABOVE: Record<string, [number, number]> = {};
function register(id: string, b: Built) { ABOVE[id] = inFront(b.down!, b.rows); return b; }
/** where the stairs up of a floor are, for the floor above to come back down to (in front of them) */
const below = (map: string, b: Built) => ({ map, x: b.up![0], y: b.up![1] + 1 });

/* ======================================================================================================== */
/* ---------- Claudia: Il Castello del Padre ---------- */
/* the crypt: stone islands over the dark, joined by bridges of old flagstones that give way once crossed. The plate of
   the west chapel opens the first gate, the one of the east chapel the second: an island may be left by a bridge only
   once, so the way round has to be thought out. A fall lands in the vaults, and the floor is whole again */
const CLAUDIA_2 = register('covo-claudia-2', plan({
  rows: [
    'xxxxxxxxxxxxxxYxxx',
    'x@@FFFFFFrFFFFFF@x',
    'x@@@@@@@@Bxxxxxxxx',
    'x########A#######x',
    'x#######FFF######x',
    'x#aF#####c####Fb#x',
    'x#FFccccFFF###FF#x',
    'x#FF####FFFcccFF#x',
    'x#c######c#####c#x',
    'x@FFFFFFFFFFFFFF@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ],
  /* the candelabra of the gallery: flames that rise on a beat, the two out of step */
  beats: beatsAt([[11, 1]], 4, [0, 1], 'fire').concat(beatsAt([[13, 1]], 4, [2, 3], 'fire'))
}));
/* the hall of the Padre: black obsidian, polished like ice; whoever steps on it slides till something stops him */
const CLAUDIA_3 = register('covo-claudia-3', plan({
  rows: [
    'xxxxxxxxxxxxxxxxxx',
    'x@@@@@@@@@@@@@@@@x',
    'x@FFFFFFKFFFFFFF@x',
    'xxxxxxxxxFxxxxxxxx',
    'xiiiiiii@ii@iiiiix',
    'xii@iiii@@iiiiiiix',
    'xii@iiiiii@iiiiiix',
    'x@iiiiii@ii@ii@i@x',
    'xiiiiiiiiiiiiiii@x',
    'xiiiiii@iii@ii@iix',
    'xFFFFFFFFFFFFFFFFx',
    'xxxxxxxxZxxxxxxxxx'
  ]
}));

/* ---------- Antonio: La Cupola ---------- */
/* the lab of portals: the belts of the assembly line carry whoever steps on them; the portals throw him to the other side
   of a wall. The plate of the robot bay opens the way up, and the robot bay is reached only through a portal */
const ANTONIO_2 = register('covo-antonio-2', plan({
  rows: [
    'xxxxxxxxxxxYxxxxxx',
    'x@@@FFFFFFFFFFFF@x',
    'x@@@@@@@@@@Axxxxxx',
    'xF>>>>>>>>>FxFFFFx',
    'xkxxxxxxxxxFxFaFFx',
    'xkxF1FFFFxxFxFFjFx',
    'xkxFFFFFFxxFxxxjxx',
    'xkxxxFxxxxxFxxxjxx',
    'xkFFFFFFFFFFFFFjFx',
    'xFFFFFFFFFFFFFFFFx',
    'x@FFFFFFFFFFFFFF@x',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ],
  pads: { '1': [13, 3, 'right'] }
}));
/* the control room: the lasers sweep the floor on a beat; between them, the posts where one waits */
const ANTONIO_3 = register('covo-antonio-3', plan({
  rows: [
    'xxxxxxxxxxxxxxxxxx',
    'x@@@@@@@@@@@@@@@@x',
    'x@FFFFFFKFFFFFFF@x',
    'xxxxxxxFFFxxxxxxxx',
    'x@FFFFFFFFFFFFFF@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FrFF@@FFrFF@@@x',
    'xFFFFFFFFFFFFFFFFx',
    'xFFFFFFFFFFFFFFFFx',
    'x@@@FFrF@@FrFF@@@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@FFFFFFFFFFFFFF@x',
    'xxxxxxxxZxxxxxxxxx'
  ],
  beats: ([] as Thing[]).concat(
    beatsAt(Array.from({ length: 16 }, (_, i) => [i + 1, 10] as [number, number]), 4, [1], 'laser'),
    beatsAt(Array.from({ length: 16 }, (_, i) => [i + 1, 8] as [number, number]), 4, [3], 'laser'),
    beatsAt(Array.from({ length: 16 }, (_, i) => [i + 1, 7] as [number, number]), 4, [0], 'laser'),
    beatsAt(Array.from({ length: 16 }, (_, i) => [i + 1, 5] as [number, number]), 4, [2], 'laser'),
    beatsAt(Array.from({ length: 14 }, (_, i) => [i + 2, 4] as [number, number]), 4, [1, 2], 'laser'))
}));

/* ---------- Andrea: La Torre delle Probabilità ---------- */
/* the levers of probability: each lever goes up and down, and each opens one door while it shuts another; three rooms in
   a row, and the stairs past the third. Whoever pulls without thinking goes round in circles */
const ANDREA_2 = register('covo-andrea-2', plan({
  rows: [
    'xxxxxxxxxxxxxYxxxx',
    'x@@@FFFFFFFFFFFF@x',
    'x@@@@@@@@@@@Qxxxxx',
    'xFFFFFxxxxxxFFFFFx',
    'xFqFFFxxxxxxFFFFFx',
    'xFFFFFxxxxxxFFFFFx',
    'xxxOxxxxxxxxxxGxxx',
    'xFFFFFFFFFFFFFFFFx',
    'x@FFFFFFoFFFFFFF@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ]
}));
/* the roulette: a ring of belts that carries round and round; the gaps in it, where one steps off, change with the plates
   (the croupier's buttons). Andrea waits at the centre, on the zero */
const ANDREA_3 = register('covo-andrea-3', plan({
  rows: [
    'xxxxxxxxxxxxxxxxxx',
    'x@@@@@@@@@@@@@@@@x',
    'x@FFFFFFKFFFFFFF@x',
    'x@FFFFFFFFFFFFFF@x',
    'xxxxxxxxxxBxxxxxxx',
    'xFFFxFFFxFFFxFFFFx',
    'xF1FxF2FxF3FxF4bFx',
    'xFFFxFFFxFFFxFFFFx',
    'xxxxxxxxxxxxxxxxxx',
    'xF5FF6FFFF7FF8FFFx',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ],
  /* the dice: from the hall two of them throw to the room of the even, two to the room of the odd; from there… */
  pads: { '1': [13, 7, 'up'], '2': [9, 7, 'up'], '3': [8, 10, 'up'], '4': [9, 7, 'up'], '5': [6, 7, 'up'], '6': [2, 7, 'up'], '7': [6, 7, 'up'], '8': [2, 7, 'up'] }
}));

/* ---------- Valentin: Turnul Verde ---------- */
/* the dance floor, wet with spritz: whoever steps on it slides to the next table */
const VALENTIN_2 = register('covo-valentin-2', plan({
  rows: [
    'xxxxxxxxxxxxxxYx',
    'xFFFFFFFFFFFFFFx',
    'xxxxxxxxxFxxxxxx',
    'xii@iiiiiiiii@@x',
    'xiiiiiiiii@ii@@x',
    'xiiiiiiii@iii@@x',
    'xiii@iiiiiiiiiix',
    'xi@@@iiiiiiiiiix',
    'xiiiiiiiiiiiiiix',
    'xii@@iiiiiiiiiix',
    'xFFFFFFFFFFFFFFx',
    'xxxxxxxZxxxxxxxx'
  ]
}));
/* the stage: the planks give way once stepped on, and the bass from the speakers throws whoever is in front of them off
   his feet, on the beat. Valentin is at the mic */
const VALENTIN_3 = register('covo-valentin-3', plan({
  rows: [
    'xxxxxxxxxxxxxxxxxx',
    'x@@@@@@@@@@@@@@@@x',
    'x@FFFFFFKFFFFFFF@x',
    'xxxxxxxFFFxxxxxxxx',
    'x@##ccccFcccc##@@x',
    'x@##c###F###c##@@x',
    'x@##c###r###c##@@x',
    'x@##c###F###c##@@x',
    'x@##c###F###c##@@x',
    'x@FFFFFFFFFFFFF@@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ],
  beats: beatsAt([[8, 4], [8, 5], [8, 7], [8, 8]], 3, [0], 'bass').concat(beatsAt([[7, 3], [8, 3], [9, 3]], 3, [1], 'bass'))
}));

/* ---------- Costanzo: Il Palazzo del Popolo ---------- */
/* the counters: the first stamp opens the second counter, the second the third, the third the stairs; between them the
   stamps of the bureaucracy come down on a beat */
const COSTANZO_2 = register('covo-costanzo-2', plan({
  rows: [
    'xYxxxxxxxxxxxxxxxx',
    'xFFFFFFFFFFFFFFFFx',
    'xxxxxxxxxxxxxxxxrx',
    'x@a@@@@@b@@@@@e@Fx',
    'x@F@@@@@A@@@@@B@Ex',
    'xFFFFFFFFFFFFFFFFx',
    'xxxxxxxxFxxxxxxxxx',
    'x@FFFFFFFFFFFFFF@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@FFFFFFFFFFFFFF@x',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ],
  beats: beatsAt([[5, 5], [11, 5]], 3, [0], 'rock').concat(beatsAt([[8, 5]], 3, [1], 'rock'),
    beatsAt([[4, 1], [8, 1], [12, 1]], 4, [0, 1], 'rock'), beatsAt([[6, 1], [10, 1], [14, 1]], 4, [2, 3], 'rock'))
}));
/* the balcony: the square throws tomatoes on a beat, and the old floorboards of the balcony give way */
const COSTANZO_3 = register('covo-costanzo-3', plan({
  rows: [
    'xxxxxxxxxxxxxxxxxx',
    'x@@@@@@@@@@@@@@@@x',
    'x@FFFFFFKFFFFFFF@x',
    'x@FFFFFFFFFFFFFF@x',
    'xxxxxxxxFxxxxxxxxx',
    'x@FFFFFFFFFFFFFF@x',
    'x@F##c###c###c#F@x',
    'x@FFFFFFFFFFFFFF@x',
    'x@F#c###c###c##F@x',
    'x@FFFFFFFFFFFFFF@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ],
  beats: beatsAt([[3, 5], [7, 5], [11, 5], [14, 5]], 3, [0], 'rock').concat(beatsAt([[5, 5], [9, 5], [13, 5]], 3, [1], 'rock'),
    beatsAt([[4, 7], [8, 7], [12, 7], [2, 7], [15, 7]], 3, [2], 'rock'), beatsAt([[6, 9], [10, 9]], 3, [1], 'rock'))
}));

/* ---------- Zendavid: Il Tempio del Basso ---------- */
/* the room of the speakers: rows of bass that go out on a beat, the next one a step later, like a wave; the belts of the
   turntables carry whoever steps on them */
const ZENDAVID_2 = register('covo-zendavid-2', plan({
  rows: [
    'xxxxxxxxYxxxxxxxxx',
    'x@@@@@FFFFF@@@@@@x',
    'x@FFFFFFFFFFFFFF@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FFFFrFFFFFFF@@x',
    'xFFFFFFFFFFFFFFFFx',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FFFFFFFFrFFF@@x',
    'xFF<<<<<<<FFFFFFFx',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ],
  beats: ([] as Thing[]).concat(
    beatsAt(Array.from({ length: 16 }, (_, i) => [i + 1, 2] as [number, number]).filter((t) => t[0] > 1 && t[0] < 16), 4, [0], 'bass'),
    beatsAt(Array.from({ length: 16 }, (_, i) => [i + 1, 3] as [number, number]), 4, [1], 'bass'),
    beatsAt(Array.from({ length: 16 }, (_, i) => [i + 1, 5] as [number, number]), 4, [2], 'bass'),
    beatsAt(Array.from({ length: 16 }, (_, i) => [i + 1, 6] as [number, number]), 4, [3], 'bass'),
    beatsAt(Array.from({ length: 16 }, (_, i) => [i + 1, 9] as [number, number]), 4, [0], 'bass'))
}));
/* the floor of vinyl: polished, it carries whoever steps on it to the next speaker */
const ZENDAVID_3 = register('covo-zendavid-3', plan({
  rows: [
    'xxxxxxxxxxxxxxxxxx',
    'x@@@@@@@@@@@@@@@@x',
    'x@FFFFFFKFFFFFFF@x',
    'x@FFFFFFFFFFFFFF@x',
    'xxFxxxxxxxxxxxxxxx',
    'xii@iiiiiiiiii@iix',
    'xiiiiiiiiii@@i@iix',
    'xiiiiiiii@iiiiiiix',
    'xi@iii@@iiiiiiiiix',
    'xiiiii@@iiii@iiiix',
    'xiiii@i@iiiiii@i@x',
    'xFFFFFFFFFFFFFFFFx',
    'xxxxxxxxZxxxxxxxxx'
  ]
}));

/* ---------- Forchetta: Il Tempio della Terra Rossa ---------- */
/* the studio: the floor is covered with canvases still wet; each tears once stepped on. The plates of the two easels
   open the door to the stairs */
const FORCHETTA_2 = register('circolo-2', plan({
  rows: [
    'xxxxxxxxYxxxxxxxxx',
    'x@@FFFFFFFFFFFF@@x',
    'x@@@@@@@B@@@@@@@@x',
    'x@######A######@@x',
    'x@#aFcccFcccFb#@@x',
    'x@#FF###c###FF#@@x',
    'x@#c####c####c#@@x',
    'x@#c####c####c#@@x',
    'x@FFFFFFFFFFFFF@@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@FFFFFFFFFFFFFF@x',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ]
}));
/* the centre court: the ball machine fires along the lines of the court on a beat, and the red clay carries whoever
   steps on it to the baseline. Forchetta waits on the other side of the net */
const FORCHETTA_3 = register('circolo-3', plan({
  rows: [
    'xxxxxxxxxxxxxxxxxx',
    'x@@@@@@@@@@@@@@@@x',
    'x@FFFFFFKFFFFFFF@x',
    'x@FFFFFFFFFFFFFF@x',
    'xxxxxxxFFxxxxxxxxx',
    'x@FFFFFFFFFFFFFF@x',
    'x@jjjjjjFFjjjjjj@x',
    'x@FFFFFFFFFFFFFF@x',
    'x@jjjjFFjjjjjjjj@x',
    'x@FFFFFFFFFFFFFF@x',
    'xFFFFFFFFFFFFFFFFx',
    'x@@FFFFFFFFFFFF@@x',
    'xxxxxxxxZxxxxxxxxx'
  ],
  beats: beatsAt(Array.from({ length: 7 }, (_, i) => [i + 5, 5] as [number, number]), 3, [0], 'ball').concat(
    beatsAt(Array.from({ length: 14 }, (_, i) => [i + 2, 7] as [number, number]), 3, [1], 'ball'),
    beatsAt(Array.from({ length: 14 }, (_, i) => [i + 2, 9] as [number, number]), 3, [2], 'ball'))
}));

/* the plans, for the tests: whose floor, and its stairs */
export const FLOOR_PLANS: Record<string, Built> = {
  'covo-claudia-2': CLAUDIA_2, 'covo-claudia-3': CLAUDIA_3, 'covo-antonio-2': ANTONIO_2, 'covo-antonio-3': ANTONIO_3,
  'covo-andrea-2': ANDREA_2, 'covo-andrea-3': ANDREA_3, 'covo-valentin-2': VALENTIN_2, 'covo-valentin-3': VALENTIN_3,
  'covo-costanzo-2': COSTANZO_2, 'covo-costanzo-3': COSTANZO_3, 'covo-zendavid-2': ZENDAVID_2, 'covo-zendavid-3': ZENDAVID_3,
  'circolo-2': FORCHETTA_2, 'circolo-3': FORCHETTA_3
};
export { ABOVE, below, register };

/* ======================================================================================================== */
/* ---------- the floors dressed: names, things, words, who stands there ---------- */
const FALL = 'Il pavimento cede: cadi giù al piano di sotto, e quando risali è di nuovo intero.';
export const FLOOR_MAPS: Record<string, MapDef> = {
  /* Claudia */
  'covo-claudia-2': floor({ id: 'covo-claudia-2', fill: 'candles', name: 'Il Castello del Padre · La cripta', theme: 'claudia', b: CLAUDIA_2,
    below: { map: 'covo-claudia', x: 7, y: 3 }, above: 'covo-claudia-3',
    objects: [banner(9, 7, 'UNO ALLA VOLTA', '#d6403a'), prop('coffin', 1, 1, 2, 1), prop('coffin', 3, 1, 2, 1), prop('coffin', 5, 1, 2, 1), prop('candles', 7, 1), prop('candles', 8, 1),
      prop('gargoyle', 1, 2), prop('bat', 4, 2), prop('cauldron', 7, 2), prop('organ', 16, 1), prop('candles', 1, 9), prop('candles', 16, 9), prop('bat', 1, 11, 2, 1), prop('bat', 15, 11, 2, 1)],
    signs: [{ x: 3, y: 2, quiet: true, text: ['Una bara di pietra. Sul coperchio, inciso: «Qui riposa chi ha interrotto il Padre».', 'Sotto, più piccolo: «Ha capito il suo punto. Troppo tardi».'] }],
    npcs: [adept('custode-cripta', 'La custode della cripta', 144, 14, 10, 'left', ['Qui sotto le pietre reggono una volta sola. Come le promesse.'])],
    words: { rest: 'Una candela accesa sul ballatoio: se il fuoco ti prende, riparti da qui.', hit: 'Le fiamme del candelabro: indietro.', fall: FALL } }),
  'covo-claudia-3': floor({ id: 'covo-claudia-3', fill: 'gargoyle', name: 'Il Castello del Padre · La sala del Padre', theme: 'claudia', b: CLAUDIA_3,
    below: below('covo-claudia-2', CLAUDIA_2),
    objects: [banner(4, 10, 'HO CAPITO IL TUO PUNTO', '#d6403a'), prop('throne', 7, 1, 3, 1), prop('organ', 1, 1, 3, 1), prop('organ', 13, 1, 3, 1), prop('candles', 4, 1), prop('candles', 5, 1), prop('candles', 11, 1), prop('candles', 12, 1),
      prop('gargoyle', 1, 2), prop('gargoyle', 16, 2), rug(6, 2, 5, 1, '#7a1020')],
    signs: [{ x: 10, y: 1, quiet: true, text: ['Il trono vero, quello di sopra. Ossidiana nera, cuscino di velluto. Ci si siede solo il Padre.'] }],
    npcs: [keeper('claudia-covo', 'claudia', 'morgana', 8, 2), adept('ancella', 'L\'ancella del Padre', 145, 14, 2, 'left', ['Hai attraversato l\'ossidiana senza cadere. Il Padre se n\'è accorto.'])] }),
  /* Antonio */
  'covo-antonio-2': floor({ id: 'covo-antonio-2', fill: 'server', name: 'La Cupola · Il laboratorio dei portali', theme: 'antonio', b: ANTONIO_2,
    below: { map: 'covo-antonio', x: 7, y: 3 }, above: 'covo-antonio-3',
    objects: [banner(3, 8, 'SIM-TO-REAL', '#c3a0ff'), prop('server', 1, 1, 2, 1), prop('server', 3, 1, 2, 1), prop('screens', 5, 1, 2, 1), prop('robot-arm', 7, 1), prop('rocket', 8, 1), prop('whiteboard', 9, 1, 2, 1),
      prop('server', 1, 2, 3, 1), prop('hologram', 4, 2, 3, 1), prop('screens', 7, 2, 3, 1), prop('robot-arm', 12, 1), prop('server', 13, 1, 3, 1), prop('robot-arm', 16, 1),
      prop('screens', 1, 10), prop('server', 16, 10), prop('robot-arm', 1, 11, 2, 1), prop('server', 15, 11, 2, 1)],
    signs: [{ x: 9, y: 2, quiet: true, text: ['Una lavagna: «Nastri: verso destra. Portali: senza ritorno. Cappuccino: alle 11».'] }],
    npcs: [adept('tecnico-linea', 'Il tecnico della linea', 154, 15, 10, 'left', ['I nastri non si fermano. Mai. Neanche per i visitatori.'])],
    words: { rest: '', hit: '' } }),
  'covo-antonio-3': floor({ id: 'covo-antonio-3', name: 'La Cupola · La sala di controllo', theme: 'antonio', b: ANTONIO_3,
    below: below('covo-antonio-2', ANTONIO_2),
    objects: [banner(4, 10, 'FORMIA → TORINO → CHICAGO', '#c3a0ff'), prop('telescope', 7, 1, 3, 1), prop('server', 1, 1, 3, 1), prop('screens', 4, 1, 3, 1), prop('rocket', 10, 1), prop('server', 11, 1, 3, 1), prop('screens', 14, 1, 3, 1),
      prop('hologram', 1, 2), prop('robot-arm', 16, 2), prop('screens', 1, 4), prop('screens', 16, 4), prop('server', 1, 6, 2, 1), prop('server', 7, 6, 2, 1), prop('server', 14, 6, 3, 1),
      prop('robot-arm', 1, 9, 3, 1), prop('screens', 8, 9, 2, 1), prop('server', 14, 9, 3, 1), prop('rocket', 1, 11), prop('whiteboard', 16, 11)],
    signs: [{ x: 7, y: 1, quiet: true, text: ['Il telescopio grande, puntato su un punto preciso del cielo. Il post-it adesso dice: «presto».'] }],
    npcs: [keeper('antonio-cupola', 'antonio', 'palamendola', 8, 2), adept('sistemista', 'La sistemista', 155, 14, 2, 'left', ['I laser li ho tarati io: uno ogni quattro passi. Lo sapevi? Ora sì.'])],
    words: { rest: 'Una postazione sicura: se un laser ti prende, riparti da qui.', hit: 'Il laser ti abbaglia: torni all\'ultima postazione.' } }),
  /* Andrea */
  'covo-andrea-2': floor({ id: 'covo-andrea-2', name: 'La Torre delle Probabilità · Le leve', theme: 'andrea', b: ANDREA_2,
    below: { map: 'covo-andrea', x: 6, y: 3 }, above: 'covo-andrea-3',
    objects: [banner(3, 8, 'P(A|B)', '#9be7c4'), prop('chalkboard', 1, 1, 4, 1), prop('dice', 5, 1, 2, 1), prop('abacus', 7, 1), prop('plot', 8, 1, 2, 1), prop('roulette', 10, 1, 2, 1),
      prop('dice', 1, 2, 2, 1), prop('abacus', 3, 2), prop('plot', 4, 2, 3, 1), prop('chalkboard', 7, 2, 3, 1), prop('dice', 10, 2, 2, 1), prop('roulette', 15, 1, 2, 1),
      prop('dice', 1, 8), prop('abacus', 16, 8), prop('plot', 1, 10, 2, 1), prop('dice', 15, 10, 2, 1)],
    signs: [{ x: 4, y: 2, quiet: true, text: ['Una lavagna: «Ogni leva apre una porta e ne chiude un\'altra. Andrea l\'ha chiamato "il paradosso del corridoio"».'] }],
    npcs: [adept('cambiavalute', 'Il cambiavalute', 165, 15, 9, 'left', ['Leva su, leva giù. Il cinquanta per cento della gente si perde qui.'])],
    words: { rest: '', hit: '' } }),
  'covo-andrea-3': floor({ id: 'covo-andrea-3', name: 'La Torre delle Probabilità · Il tavolo dei dadi', theme: 'andrea', b: ANDREA_3,
    below: below('covo-andrea-2', ANDREA_2),
    objects: [banner(4, 10, 'LA CASA VINCE SEMPRE', '#9be7c4'), prop('roulette', 7, 1, 3, 1), prop('dice', 1, 1, 3, 1), prop('chalkboard', 4, 1, 3, 1), prop('plot', 10, 1, 3, 1), prop('abacus', 13, 1), prop('dice', 14, 1, 3, 1),
      prop('dice', 1, 2), prop('abacus', 16, 2), prop('plot', 1, 3), prop('dice', 16, 3), prop('dice', 1, 11, 2, 1), prop('abacus', 15, 11, 2, 1)],
    signs: [{ x: 7, y: 1, quiet: true, text: ['Una roulette con un solo numero: lo zero. Sopra, una targhetta: «Andrea, campione in carica».'] }],
    npcs: [keeper('andrea-torre', 'andrea', 'padel', 8, 2), adept('baro', 'Il baro', 166, 15, 3, 'left', ['Ogni dado qui ti lancia altrove. Io so dove. Tu no.'])] }),
  /* Valentin */
  'covo-valentin-2': floor({ id: 'covo-valentin-2', fill: 'spritz', name: 'Turnul Verde · La pista bagnata', theme: 'valentin', b: VALENTIN_2,
    below: { map: 'covo-valentin', x: 7, y: 3 }, above: 'covo-valentin-3',
    objects: [banner(3, 10, 'WEEE! SPRITZ PER TUTTI', '#59e07a')],
    signs: [],
    npcs: [adept('barista-spritz', 'La barista dello spritz', 174, 12, 10, 'left', ['Ho rovesciato lo spritz su tutta la pista. Scivola, eh? Weee.'])],
    words: { rest: '', hit: '' } }),
  'covo-valentin-3': floor({ id: 'covo-valentin-3', fill: 'speakers', name: 'Turnul Verde · Il palco', theme: 'valentin', b: VALENTIN_3,
    below: below('covo-valentin-2', VALENTIN_2),
    objects: [banner(4, 10, 'STAI INGUAIATOOOO', '#59e07a'), prop('icons', 7, 1, 3, 1), prop('speakers', 1, 1, 3, 1), prop('loom', 4, 1, 3, 1), prop('brazier', 10, 1), prop('speakers', 11, 1, 3, 1), prop('wolf', 14, 1, 3, 1),
      prop('speakers', 1, 2), prop('speakers', 16, 2), prop('mic', 15, 4), prop('speakers', 16, 4), prop('brazier', 15, 6), prop('speakers', 16, 6), prop('wolf', 15, 8), prop('speakers', 16, 8), prop('speakers', 15, 9, 2, 1),
      prop('mic', 1, 4), prop('speakers', 1, 6), prop('wolf', 1, 8), prop('brazier', 1, 9), prop('speakers', 1, 11, 2, 1), prop('speakers', 15, 11, 2, 1)],
    signs: [{ x: 15, y: 9, quiet: true, text: ['Il microfono del freestyle. Sull\'asta, col pennarello: «stai inguaiato» e la data della prima volta.'] }],
    npcs: [keeper('valentin-torre', 'valentin', 'eclipse', 8, 2), adept('buttafuori', 'Il buttafuori', 175, 14, 2, 'left', ['Sul palco si sale solo a tempo. Sei fuori tempo. Si vede.'])],
    words: { rest: 'Il centro del palco: se il basso ti butta giù, riparti da qui.', hit: 'Il basso ti travolge: torni giù.', fall: 'Le assi del palco cedono: giù, sotto il palco. Quando risali, le hanno già rimesse.' } }),
  /* Costanzo */
  'covo-costanzo-2': floor({ id: 'covo-costanzo-2', name: 'Il Palazzo del Popolo · Gli sportelli', theme: 'costanzo', b: COSTANZO_2,
    below: { map: 'covo-costanzo', x: 7, y: 3 }, above: 'covo-costanzo-3',
    objects: [banner(4, 10, 'SPORTELLO CHIUSO', '#ffe45c'), prop('ballot', 1, 3), prop('lectern', 3, 3, 2, 1), prop('bust', 5, 3), prop('flag', 6, 3, 2, 1), prop('megaphone', 9, 3), prop('ballot', 10, 3, 2, 1), prop('lectern', 12, 3, 2, 1), prop('bust', 15, 3),
      prop('flag', 1, 4), prop('bust', 3, 4), prop('ballot', 4, 4, 2, 1), prop('flag', 6, 4, 2, 1), prop('megaphone', 9, 4), prop('ballot', 10, 4, 2, 1), prop('bust', 12, 4, 2, 1), prop('flag', 15, 4),
      prop('ballot', 1, 7), prop('megaphone', 16, 7), prop('bust', 1, 9), prop('flag', 16, 9), prop('lectern', 1, 10, 2, 1), prop('ballot', 15, 10, 2, 1)],
    signs: [{ x: 1, y: 3, quiet: true, text: ['Lo sportello numero uno. Il cartello dice: «Per lo sportello due serve il timbro dello sportello uno. Per lo sportello uno serve il timbro dello sportello due».', 'Qualcuno ha cancellato la seconda frase. Grazie, qualcuno.'] }],
    npcs: [adept('funzionario', 'Il funzionario dello sportello', 186, 15, 8, 'left', ['Ha il modulo B12? No? Allora lotta. È la procedura.'])],
    words: { rest: 'Una sedia della sala d\'attesa: se un timbro ti prende, riparti da qui.', hit: 'TUMP. Il timbro della burocrazia ti rimanda indietro.' } }),
  'covo-costanzo-3': floor({ id: 'covo-costanzo-3', fill: 'flag', name: 'Il Palazzo del Popolo · Il balcone', theme: 'costanzo', b: COSTANZO_3,
    below: below('covo-costanzo-2', COSTANZO_2),
    objects: [banner(4, 10, 'IL POPOLO HA DECISO', '#ffe45c'), prop('lectern', 7, 1, 3, 1), prop('flag', 1, 1, 3, 1), prop('bust', 4, 1), prop('megaphone', 5, 1, 2, 1), prop('ballot', 10, 1, 2, 1), prop('bust', 12, 1), prop('flag', 13, 1, 3, 1),
      prop('flag', 1, 2), prop('flag', 16, 2), prop('bust', 1, 3), prop('megaphone', 16, 3), prop('flag', 1, 5), prop('flag', 16, 5), prop('ballot', 1, 7), prop('ballot', 16, 7), prop('bust', 1, 9), prop('bust', 16, 9), prop('megaphone', 1, 11, 2, 1), prop('ballot', 15, 11, 2, 1)],
    signs: [{ x: 7, y: 1, quiet: true, text: ['Il leggio del balcone. Da qui si vede tutta piazza della Vittoria. E da piazza della Vittoria arrivano pomodori.'] }],
    npcs: [keeper('costanzo-palazzo', 'costanzo', 'piazza', 8, 2), adept('addetto-stampa', 'L\'addetto stampa', 187, 14, 3, 'left', ['Il comunicato è già pronto: «Lo sfidante è stato respinto dal popolo». Manca solo la lotta.'])],
    words: { rest: '', hit: 'Un pomodoro dalla piazza. Splat. Ricominci dalla porta.', fall: 'Le assi del balcone cedono: giù di un piano. Quando risali, le hanno già inchiodate.' } }),
  /* Zendavid */
  'covo-zendavid-2': floor({ id: 'covo-zendavid-2', fill: 'speakers', name: 'Il Tempio del Basso · La sala delle casse', theme: 'zendavid', b: ZENDAVID_2,
    below: { map: 'covo-zendavid', x: 7, y: 3 }, above: 'covo-zendavid-3',
    objects: [banner(3, 10, 'BASS DROP', '#ff8fc1'), prop('speakers', 1, 1, 3, 1), prop('neon', 4, 1), prop('vinyl', 5, 1), prop('neon', 11, 1), prop('speakers', 12, 1, 3, 1), prop('vinyl', 15, 1),
      prop('speakers', 1, 2), prop('speakers', 16, 2), prop('speakers', 1, 4, 2, 1), prop('speakers', 15, 4, 2, 1), prop('speakers', 1, 7, 2, 1), prop('speakers', 15, 7, 2, 1), prop('vinyl', 1, 10), prop('neon', 2, 10), prop('neon', 15, 10), prop('vinyl', 16, 10)],
    signs: [{ x: 1, y: 4, quiet: true, text: ['Una cassa alta due metri. Sopra, col pennarello: «Il basso non si sente. Si subisce».'] }],
    npcs: [adept('tecnico-luci', 'Il tecnico delle luci', 195, 14, 10, 'left', ['Le onde partono dalla consolle e scendono una fila alla volta. Conta.'])],
    words: { rest: 'Tra due casse c\'è silenzio: se un\'onda ti prende, riparti da qui.', hit: 'L\'onda del basso ti solleva e ti rimette giù più indietro.' } }),
  'covo-zendavid-3': floor({ id: 'covo-zendavid-3', fill: 'speakers', name: 'Il Tempio del Basso · La consolle', theme: 'zendavid', b: ZENDAVID_3,
    below: below('covo-zendavid-2', ZENDAVID_2),
    objects: [banner(4, 10, 'BAU · ZEN · BASS', '#ff8fc1'), prop('decks', 7, 1, 3, 1), prop('speakers', 1, 1, 3, 1), prop('neon', 4, 1), prop('vinyl', 5, 1), prop('mic', 6, 1), prop('neon', 10, 1), prop('speakers', 11, 1, 3, 1), prop('vinyl', 14, 1), prop('neon', 15, 1),
      prop('speakers', 1, 2), prop('speakers', 16, 2)],
    signs: [{ x: 7, y: 1, quiet: true, text: ['La consolle grande. Un vinile senza etichetta, una cuffia enorme, e un bonsai.'] }],
    npcs: [keeper('zendavid-tempio', 'zendavid', 'pineta', 8, 2), adept('corista', 'La corista', 196, 14, 3, 'left', ['Sul vinile si scivola. Zendavid dice che è una metafora.'])] }),
  /* Forchetta */
  'circolo-2': floor({ id: 'circolo-2', fill: 'canvases', name: 'Il Tempio della Terra Rossa · Lo studio', theme: 'forchetta', b: FORCHETTA_2,
    below: { map: 'circolo', x: 12, y: 7 }, above: 'circolo-3',
    objects: [banner(3, 10, 'POTEVA ANDARE PEGGIO', '#5fb8ff'), prop('easel', 1, 1), prop('canvases', 2, 1, 2, 1), prop('palette', 4, 1), prop('easel', 5, 1), prop('canvases', 6, 1, 2, 1), prop('microscope', 9, 1), prop('prosthesis', 10, 1), prop('ecg', 11, 1, 2, 1), prop('canvases', 13, 1, 3, 1), prop('easel', 16, 1),
      prop('canvases', 1, 2, 3, 1), prop('palette', 4, 2), prop('easel', 5, 2), prop('canvases', 6, 2, 2, 1), prop('microscope', 9, 2), prop('ecg', 10, 2, 2, 1), prop('canvases', 12, 2, 3, 1), prop('prosthesis', 15, 2),
      prop('easel', 1, 4), prop('easel', 15, 4), prop('palette', 15, 6), prop('canvases', 1, 8), prop('easel', 15, 8, 2, 1), prop('microscope', 1, 11), prop('prosthesis', 2, 11), prop('canvases', 15, 11, 2, 1)],
    signs: [{ x: 3, y: 2, quiet: true, text: ['Un cavalletto. La tela sopra è la stessa del pavimento: il golfo, dipinto con la terra rossa. Ancora fresca.'] }],
    npcs: [adept('restauratrice', 'La restauratrice', 74, 14, 10, 'left', ['Su ogni tela si passa una volta sola. Due, e la strappi. Lo so: le aggiusto io.'])],
    words: { rest: '', hit: '', fall: 'La tela si strappa sotto il piede: giù al piano di sotto. Quando risali, Forchetta l\'ha già ridipinta.' } }),
  'circolo-3': floor({ id: 'circolo-3', fill: 'ballbasket', name: 'Il Tempio della Terra Rossa · Il campo centrale', theme: 'forchetta', b: FORCHETTA_3,
    below: below('circolo-2', FORCHETTA_2),
    objects: [{ kind: 'court', x: 2, y: 5, w: 14, h: 5 }, banner(4, 10, 'CAMPO CENTRALE', '#5fb8ff'), prop('trophy', 7, 1), prop('umpire', 8, 1), prop('trophy', 9, 1), prop('ballmachine', 1, 1, 2, 1), prop('ballbasket', 3, 1), prop('easel', 4, 1),
      prop('palette', 5, 1), prop('canvases', 6, 1), prop('microscope', 10, 1), prop('prosthesis', 11, 1), prop('ecg', 12, 1, 2, 1), prop('ballbasket', 14, 1), prop('ballmachine', 15, 1, 2, 1),
      prop('ballmachine', 1, 2), prop('ballmachine', 16, 2), prop('ballbasket', 1, 3), prop('ballbasket', 16, 3), prop('ballmachine', 1, 5), prop('ballmachine', 16, 5), prop('ballbasket', 1, 7), prop('ballbasket', 16, 7),
      prop('ballmachine', 1, 9), prop('ballmachine', 16, 9), prop('trophy', 1, 11, 2, 1), prop('umpire', 15, 11, 2, 1)],
    signs: [{ x: 1, y: 5, quiet: true, text: ['La macchina lanciapalle. Sul display: «velocità: Forchetta». Non è un numero.'] }],
    npcs: [{ ...keeper('forchetta', 'forchetta', 'circolo', 8, 2), unless: 'forchetta' }, adept('sparring', 'Lo sparring partner', 75, 14, 3, 'left', ['Forchetta non sbaglia mai. Io sì. Per questo mi tiene.'])],
    words: { rest: '', hit: 'Una pallata della macchina: torni alla riga di fondo.' } })
};
