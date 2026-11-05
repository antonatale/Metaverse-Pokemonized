import type { MapDef, Thing } from './types';
import { FORMIA_SPOT } from './formia-ground';

/* back out under the walls of Castellone */
const out = FORMIA_SPOT['selv-lamo'];

/* A band of the floor where the boulders of Lamo come down: a wave that runs along the rows with Antonio's steps, `way` to
   the right or to the left, `wide` tiles thick. Each row is two steps behind the one before: straight up, the wave catches
   you, so the floor has to be looked at (found with the validator, and kept by tests/unit/place.test.ts) */
function band(ys: number[], every: number, wide: number, way: number): Thing[] {
  const all: Thing[] = [];
  ys.forEach(function (y, r) {
    for (let x = 5; x <= 13; x++) {
      const on: number[] = [];
      for (let k = 0; k < wide; k++) on.push(((way * x - 2 * r + 2 + k) % every + every) % every);
      all.push({ k: 'beat', x: x, y: y, every: every, on: on, look: 'rock' });
    }
  });
  return all;
}

/* Under the polygonal walls of Castellone: the walk to Lamo, a short test on foot before the fight. He throws boulders, as
   he did at the ships of Ulysses. They move with Antonio's steps, not with the clock: nothing falls while he stands and
   looks, and the floor shows where the next one will land. Three stretches, each a little thicker, with a brazier between
   them to start again from. tests/unit/place.test.ts proves it can be finished. */
export const telepilo: MapDef = {
  name: 'La Porta di Telepilo',
  city: 'formia',
  inside: true,
  dark: true,
  rows: [
    'WWWWWWWWWWWWWWWWWWW',
    'WWWWWWWW___WWWWWWWW',
    'WWWWWW_______WWWWWW',
    'WWWWW_________WWWWW',
    'WWWWW_________WWWWW',
    'WWWWW_________WWWWW',
    'WWWWWWWW___WWWWWWWW',
    'WWWWW_________WWWWW',
    'WWWWW_________WWWWW',
    'WWWWWWWW___WWWWWWWW',
    'WWWWW_________WWWWW',
    'WWWWW_________WWWWW',
    'WWWWWWWW___WWWWWWWW',
    'WWWWWWWW___WWWWWWWW',
    'WWWWWWWWDDDWWWWWWWW'
  ],
  signs: [
    { x: 8, y: 12, quiet: true, text: ['Il pavimento è pieno di massi spaccati.', 'Cadono solo quando cammini: se ti fermi, si ferma anche lui. Dove la pietra è segnata, il prossimo masso cade lì.'] }
  ],
  npcs: [{ id: 'selv-lamo', x: 9, y: 1, dir: 'down', wild: { sp: 'lamo', lv: [35, 35] }, legend: 'lamo' }],
  warps: [8, 9, 10].map((x) => ({ x, y: 14, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' as const })),
  start: [9, 13, 'up'],
  place: {
    entry: [9, 13, 'up'],
    goal: [9, 1],
    words: { rest: 'Un braciere acceso: se un masso ti manda indietro, ripartirai da qui.', hit: 'Un masso ti cade davanti: torni indietro.' },
    things: [
      ...band([11, 10], 4, 1, -1),
      { k: 'rest', x: 9, y: 9 },
      ...band([8, 7], 5, 2, 1),
      { k: 'rest', x: 9, y: 6 },
      ...band([5, 4, 3], 5, 2, -1)
    ]
  }
};
