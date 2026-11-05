import type { SpeciesId } from './creatures';

/* Where the wild creatures of Formia hide. They are never in sight: they live in the tall grass (parks, the pineta,
   between the olive rows, the scrub of the Aurunci) and in the rock pools on the beaches (the Scogliera, Gianola).
   Walking through a hiding place, about one step in RATE meets one, from the table of that place, by day or by
   night. The patches are painted on the map by tools/formia/build.ts around the spots of HIDING in formia-places.ts;
   a patch's id is the id of its table here. */
export interface Meet { sp: SpeciesId; lv: [number, number]; w: number }
export interface Hiding {
  id: string; name: string; on: 'erba' | 'scogli' | 'acqua' | 'mura' | 'grotta'; day: Meet[]; night?: Meet[];
  /** how many levels each stage of the story (a stone found, Mamurra beaten) lifts the place's band; 1 if missing */
  rise?: number;
  /** a place meant to be a challenge: its levels aim at the team's (see wildLevel) instead of staying in the band */
  follow?: { off: number; slack: number };
}

export const HIDINGS: Record<string, Hiding> = {
  /* how rare a creature is never shows: it is in the weights, in the places and in the hours. A common one is in many
     tables with a big weight, a rare one in one place, at one hour, with a weight of 1 (and an evolved one only where
     the place is a challenge). Nothing in the game says which is which: the diary only says where it was seen */
  /* the first place inside: the bats of the dark, the snails of the damp walls, and one who is seldom met */
  cisterna: { id: 'cisterna', name: 'Il Cisternone', on: 'grotta', follow: { off: 0, slack: 4 },
    day: [{ sp: 'pipistrillo', lv: [8, 11], w: 5 }, { sp: 'lumacotta', lv: [8, 11], w: 3 }, { sp: 'pipistrega', lv: [20, 22], w: 1 }] },
  gramsci: { id: 'gramsci', name: 'Parco Gramsci', on: 'erba',
    day: [{ sp: 'cicalina', lv: [2, 4], w: 4 }, { sp: 'olivella', lv: [3, 4], w: 1 }],
    night: [{ sp: 'civettina', lv: [3, 5], w: 4 }, { sp: 'olivella', lv: [3, 4], w: 1 }, { sp: 'lucciolina', lv: [3, 5], w: 3 }] },
  gianola: { id: 'gianola', name: 'Gianola', on: 'scogli',
    day: [{ sp: 'riccetto', lv: [3, 6], w: 4 }, { sp: 'granchietto', lv: [4, 5], w: 1 }, { sp: 'stellina', lv: [4, 6], w: 3 }],
    night: [{ sp: 'riccetto', lv: [4, 7], w: 3 }, { sp: 'granchietto', lv: [5, 6], w: 2 }, { sp: 'stellina', lv: [5, 7], w: 1 }, { sp: 'medusella', lv: [5, 7], w: 2 }] },
  pineta: { id: 'pineta', name: 'Pineta di Vindicio', on: 'erba',
    day: [{ sp: 'cicalina', lv: [4, 7], w: 5 }, { sp: 'civettina', lv: [5, 6], w: 1 }],
    night: [{ sp: 'civettina', lv: [5, 8], w: 5 }, { sp: 'cicalina', lv: [5, 6], w: 1 }, { sp: 'lucciolina', lv: [5, 8], w: 4 }, { sp: 'lanternella', lv: [18, 20], w: 1 }] },
  scogliera: { id: 'scogliera', name: 'La Scogliera', on: 'scogli',
    day: [{ sp: 'granchietto', lv: [6, 9], w: 6 }, { sp: 'riccetto', lv: [6, 7], w: 2 }, { sp: 'granchione', lv: [18, 19], w: 1 }, { sp: 'murenaccia', lv: [9, 12], w: 2 }],
    night: [{ sp: 'murenaccia', lv: [10, 13], w: 4 }, { sp: 'granchietto', lv: [7, 9], w: 2 }, { sp: 'medusella', lv: [7, 9], w: 2 }] },
  ulivi: { id: 'ulivi', name: 'Gli uliveti', on: 'erba',
    day: [{ sp: 'olivella', lv: [7, 10], w: 5 }, { sp: 'cicalina', lv: [7, 8], w: 1 }, { sp: 'lumacotta', lv: [7, 10], w: 3 }, { sp: 'ginestrella', lv: [7, 9], w: 2 }],
    night: [{ sp: 'civettina', lv: [8, 10], w: 3 }, { sp: 'olivella', lv: [7, 9], w: 2 }, { sp: 'lumacotta', lv: [7, 9], w: 2 }, { sp: 'pipistrillo', lv: [8, 10], w: 2 }] },
  monti: { id: 'monti', name: 'Monti Aurunci', on: 'erba',
    day: [{ sp: 'civettina', lv: [10, 13], w: 4 }, { sp: 'olivella', lv: [10, 12], w: 2 }, { sp: 'olivastro', lv: [18, 20], w: 1 },
      { sp: 'cinghialetto', lv: [10, 13], w: 4 }, { sp: 'ginestrella', lv: [10, 12], w: 3 }, { sp: 'falchetto', lv: [11, 14], w: 1 }, { sp: 'zannaferro', lv: [20, 22], w: 1 }],
    night: [{ sp: 'civettina', lv: [11, 14], w: 4 }, { sp: 'civettona', lv: [18, 21], w: 1 }, { sp: 'pipistrillo', lv: [11, 14], w: 3 }, { sp: 'pipistrega', lv: [20, 22], w: 1 }],
    rise: 2, follow: { off: 0, slack: 5 } },
  /* reached with the creatures' powers (story/growth.ts): swimming in the shallow sea, climbing the walls of Castellone.
     The starters nobody chose live here: a Polpino in the sea, a Ramarrino (and, now and then, a Gabbì) on the walls */
  mare: { id: 'mare', name: 'Il mare di Formia', on: 'acqua',
    day: [{ sp: 'riccetto', lv: [7, 11], w: 4 }, { sp: 'granchietto', lv: [7, 11], w: 3 }, { sp: 'polpino', lv: [6, 9], w: 1 }, { sp: 'riccione', lv: [18, 20], w: 1 },
      { sp: 'medusella', lv: [7, 11], w: 4 }, { sp: 'cefalino', lv: [5, 9], w: 5 }, { sp: 'delfi', lv: [10, 13], w: 1 }],
    night: [{ sp: 'riccetto', lv: [8, 12], w: 3 }, { sp: 'polpino', lv: [7, 10], w: 2 }, { sp: 'granchione', lv: [18, 20], w: 1 },
      { sp: 'medusella', lv: [8, 12], w: 4 }, { sp: 'medusaurora', lv: [20, 22], w: 1 }, { sp: 'cefalino', lv: [6, 10], w: 2 }],
    follow: { off: 0, slack: 4 } },
  mura: { id: 'mura', name: 'Le mura di Castellone', on: 'mura',
    day: [{ sp: 'ramarrino', lv: [7, 10], w: 3 }, { sp: 'cicalina', lv: [6, 9], w: 2 }, { sp: 'gabbi', lv: [7, 10], w: 1 }, { sp: 'micetto', lv: [7, 10], w: 3 }, { sp: 'lumacotta', lv: [7, 9], w: 2 }],
    night: [{ sp: 'civettina', lv: [8, 11], w: 3 }, { sp: 'ramarrino', lv: [8, 10], w: 1 }, { sp: 'pipistrillo', lv: [8, 11], w: 3 }, { sp: 'micetto', lv: [7, 10], w: 1 }],
    follow: { off: 0, slack: 4 } }
};
/** The level of a creature met in a hiding place: `stage` is how far the story has gone (0–4), `ref` the average of
    the three best levels of Antonio's team, `r` a roll from 0 to 1 (one Math.random, so the tests' seed still holds).
    A gentle place keeps its band, lifted by the story. A place with `follow` aims at the team's level, a level below
    or above, but never under its band (the evolved ones have a high band of their own) and never more than `slack`
    above the band as the story has lifted it: a place stays believable, and neither a wall nor a stroll. */
export function wildLevel(m: Meet, h: Hiding, ref: number, stage: number, r: number): number {
  const rise = (h.rise == null ? 1 : h.rise) * stage, lo = m.lv[0] + rise, hi = m.lv[1] + rise;
  if (!h.follow) return lo + Math.min(hi - lo, Math.floor(r * (hi - lo + 1)));
  const aim = Math.round(ref + h.follow.off) + Math.floor(r * 3) - 1;
  return Math.max(lo, Math.min(hi + h.follow.slack, aim));
}
/** about one step in RATE, in a hiding place, meets a creature; never in the CALM steps after a meeting */
export const RATE = 9, CALM = 3;
/** one creature of a table, by weight: r from 0 to 1 */
export function pickMeet(list: Meet[], r: number): Meet {
  var all = list.reduce(function (n, m) { return n + m.w; }, 0), at = r * all;
  for (var i = 0; i < list.length; i++) { at -= list[i].w; if (at < 0) return list[i]; }
  return list[list.length - 1];
}
