import type { MapDef } from './types';
import { FORMIA_SPOT } from './formia-ground';

/* back out in front of the Cisternone, at Castellone */
const out = FORMIA_SPOT['sign-cisternone'];

/* Inside the Cisternone, under Castellone: dark, and full of still water. The first place of the game with a puzzle, and
   the model for the others. Three halls in a row, one idea each:
   - the first hall teaches the plate: it stands in plain sight and opens the gate of its colour;
   - the second one is cut in two by the water: a current carries you across above, another one carries you back below,
     and the plate on the far side opens a niche in the first hall, whose plate opens the way on. There and back again;
   - in the last hall the water comes up every third step: you look, and cross when the floor is dry.
   tests/unit/maps.test.ts proves it can be finished, from wherever a player can get to. */
export const cisterna: MapDef = {
  name: 'Il Cisternone',
  city: 'formia',
  inside: true,
  dark: true,
  meet: 'cisterna',
  rows: [
    'xxxxxxxxxxxxxxxxxxxxxxxx',
    'x________x~~~~~~~x_____x',
    'x________x~~~~~~~x_____x',
    'x________x%%%%%%~x_____x',
    'x________x_~~~~__x_____x',
    'x___________~~~________x',
    'x________x_~~~~__x_____x',
    'x________x%%%%%%~x_____x',
    'x________x~~~~~~~x_____x',
    'xxx_xxxDDxxxxxxxxxxxxxxx',
    'xx___xxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxx'
  ],
  signs: [
    { x: 22, y: 1, quiet: true, text: ['Sull\'acqua ferma, una pietra che brilla: è la Pietra delle Mura.'] },
    { x: 7, y: 1, quiet: true, text: ['Il Cisternone romano, del I secolo a.C.: 7000 metri cubi d\'acqua, sotto le case di Castellone.', 'Una lastra del pavimento è diversa dalle altre, e una grata chiude il passaggio.'] }
  ],
  warps: [{ x: 7, y: 9, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' }, { x: 8, y: 9, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' }],
  start: [7, 8, 'up'],
  place: {
    entry: [7, 8, 'up'],
    goal: [22, 1],
    words: { rest: 'Un braciere acceso: se l\'acqua ti porta via, ripartirai da qui.', hit: 'L\'acqua si alza e ti porta indietro.' },
    things: [
      /* the first hall */
      { k: 'plate', x: 4, y: 3, flag: 'a' },
      { k: 'gate', x: 9, y: 5, flag: 'a' },
      /* the currents: across above, back below */
      ...[10, 11, 12, 13, 14].map((x) => ({ k: 'slide' as const, x, y: 3, dir: 'right' as const })),
      { k: 'slide', x: 15, y: 3, dir: 'down' },
      ...[15, 14, 13, 12, 11].map((x) => ({ k: 'slide' as const, x, y: 7, dir: 'left' as const })),
      { k: 'slide', x: 10, y: 7, dir: 'up' },
      /* on the far side, the plate that opens the niche of the first hall; in the niche, the plate that opens the way on */
      { k: 'plate', x: 16, y: 6, flag: 'b' },
      { k: 'gate', x: 3, y: 9, flag: 'b' },
      { k: 'plate', x: 3, y: 10, flag: 'c' },
      { k: 'gate', x: 17, y: 5, flag: 'c' },
      /* the last hall: a brazier to come back to, and the water that rises every third step */
      { k: 'rest', x: 18, y: 5 },
      ...[1, 2, 3, 4, 5, 6, 7, 8].map((y) => ({ k: 'beat' as const, x: 20, y, every: 3, on: [0] }))
    ]
  }
};
