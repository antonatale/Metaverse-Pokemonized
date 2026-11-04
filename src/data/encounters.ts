import type { SpeciesId } from './creatures';

/* Where the wild creatures of Formia hide. They are never in sight: they live in the tall grass (parks, the pineta,
   between the olive rows, the scrub of the Aurunci) and in the rock pools on the beaches (the Scogliera, Gianola).
   Walking through a hiding place, about one step in RATE meets one, from the table of that place, by day or by
   night. The patches are painted on the map by tools/formia/build.ts around the spots of HIDING in formia-places.ts;
   a patch's id is the id of its table here. */
export interface Meet { sp: SpeciesId; lv: [number, number]; w: number }
export interface Hiding { id: string; name: string; on: 'erba' | 'scogli' | 'acqua' | 'mura'; day: Meet[]; night?: Meet[] }

export const HIDINGS: Record<string, Hiding> = {
  gramsci: { id: 'gramsci', name: 'Parco Gramsci', on: 'erba',
    day: [{ sp: 'cicalina', lv: [2, 4], w: 4 }, { sp: 'olivella', lv: [3, 4], w: 1 }],
    night: [{ sp: 'civettina', lv: [3, 5], w: 4 }, { sp: 'olivella', lv: [3, 4], w: 1 }] },
  gianola: { id: 'gianola', name: 'Gianola', on: 'scogli',
    day: [{ sp: 'riccetto', lv: [3, 6], w: 4 }, { sp: 'granchietto', lv: [4, 5], w: 1 }],
    night: [{ sp: 'riccetto', lv: [4, 7], w: 3 }, { sp: 'granchietto', lv: [5, 6], w: 2 }] },
  pineta: { id: 'pineta', name: 'Pineta di Vindicio', on: 'erba',
    day: [{ sp: 'cicalina', lv: [4, 7], w: 5 }, { sp: 'civettina', lv: [5, 6], w: 1 }],
    night: [{ sp: 'civettina', lv: [5, 8], w: 5 }, { sp: 'cicalina', lv: [5, 6], w: 1 }] },
  scogliera: { id: 'scogliera', name: 'La Scogliera', on: 'scogli',
    day: [{ sp: 'granchietto', lv: [6, 9], w: 6 }, { sp: 'riccetto', lv: [6, 7], w: 2 }, { sp: 'granchione', lv: [18, 19], w: 1 }] },
  ulivi: { id: 'ulivi', name: 'Gli uliveti', on: 'erba',
    day: [{ sp: 'olivella', lv: [7, 10], w: 5 }, { sp: 'cicalina', lv: [7, 8], w: 1 }],
    night: [{ sp: 'civettina', lv: [8, 10], w: 3 }, { sp: 'olivella', lv: [7, 9], w: 2 }] },
  monti: { id: 'monti', name: 'Monti Aurunci', on: 'erba',
    day: [{ sp: 'civettina', lv: [10, 13], w: 4 }, { sp: 'olivella', lv: [10, 12], w: 2 }, { sp: 'olivastro', lv: [18, 20], w: 1 }],
    night: [{ sp: 'civettina', lv: [11, 14], w: 4 }, { sp: 'civettona', lv: [18, 21], w: 1 }] },
  /* reached with the creatures' powers (story/growth.ts): swimming in the shallow sea, climbing the walls of Castellone.
     The starters nobody chose live here: a Polpino in the sea, a Ramarrino (and, now and then, a Gabbì) on the walls */
  mare: { id: 'mare', name: 'Il mare di Formia', on: 'acqua',
    day: [{ sp: 'riccetto', lv: [7, 11], w: 4 }, { sp: 'granchietto', lv: [7, 11], w: 3 }, { sp: 'polpino', lv: [6, 9], w: 1 }, { sp: 'riccione', lv: [18, 20], w: 1 }],
    night: [{ sp: 'riccetto', lv: [8, 12], w: 3 }, { sp: 'polpino', lv: [7, 10], w: 2 }, { sp: 'granchione', lv: [18, 20], w: 1 }] },
  mura: { id: 'mura', name: 'Le mura di Castellone', on: 'mura',
    day: [{ sp: 'ramarrino', lv: [7, 10], w: 3 }, { sp: 'cicalina', lv: [6, 9], w: 2 }, { sp: 'gabbi', lv: [7, 10], w: 1 }],
    night: [{ sp: 'civettina', lv: [8, 11], w: 3 }, { sp: 'ramarrino', lv: [8, 10], w: 1 }] }
};
/** about one step in RATE, in a hiding place, meets a creature; never in the CALM steps after a meeting */
export const RATE = 9, CALM = 3;
/** one creature of a table, by weight: r from 0 to 1 */
export function pickMeet(list: Meet[], r: number): Meet {
  var all = list.reduce(function (n, m) { return n + m.w; }, 0), at = r * all;
  for (var i = 0; i < list.length; i++) { at -= list[i].w; if (at < 0) return list[i]; }
  return list[list.length - 1];
}
