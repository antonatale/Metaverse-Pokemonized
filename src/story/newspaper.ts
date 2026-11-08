import { HIDINGS } from '../data/encounters';
import type { SpeciesId } from '../data/creatures';

/* The newspaper of the edicola: every day it says where a creature that is seldom met has been seen, by day or by
   night. Only true things: a creature with a weight of 1 in the table of that place at that hour (data/encounters.ts).
   The same news all day, another one the next day, in a fixed order. */
export interface News { place: string; night: boolean; sp: SpeciesId }

/** every piece of news there can be, in a fixed order */
export function allNews(): News[] {
  const out: News[] = [];
  Object.keys(HIDINGS).sort().forEach(function (id) {
    const h = HIDINGS[id];
    h.day.forEach(function (m) { if (m.w === 1) out.push({ place: h.name, night: false, sp: m.sp }); });
    (h.night || []).forEach(function (m) { if (m.w === 1) out.push({ place: h.name, night: true, sp: m.sp }); });
  });
  return out;
}
/** the news of a day (days since 1970) */
export function newsOf(day: number): News {
  const all = allNews(), k = ((Math.floor(day) % all.length) + all.length) % all.length;
  return all[k];
}
