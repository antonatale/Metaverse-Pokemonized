import { COVI } from '../data/covi';
import { SPECIES, type SpeciesId } from '../data/creatures';
import { MINE } from '../data/companions';

/* A covo is fought with creatures (D1 of REVISIONE.md, 10 November 2026): the leader sends his own, of his type, and
   steps in last himself, with his moves as a person. Two creatures for the first two covi, three from the third. They
   are a little below the leader, and grown into the forms their level gives them. Pure: the simulator uses it too.
   27 November 2026 (Antonio: the keeper at the top «deve avere qualche creatura particolare»): the strongest of the crew,
   the last sent in before the leader himself, is the leader's own creature, the one born beside him at 3:12
   (data/companions.ts), in the form its level gives it: Pumbino, Caracalla, Lincesare for Costanzo. */
/** how many levels below the leader each of his creatures is, with a crew of two and of three */
export const CREW_BELOW: Record<number, number[]> = { 2: [1, 0], 3: [2, 1, 0] };
/** a crew's creature takes a new form this many levels after a wild one would: the player's first creature, which
    changes at 14, gets there first, and the covo does not jump the moment its crew changes (measured with sim-covi) */
export const CREW_LATE = 3;
export interface CrewMember { sp: SpeciesId; lv: number }
/** a creature at a level, in the form it would have reached by then (the bond some last forms want is not asked) */
export function grownAt(sp: SpeciesId, lv: number, late = 0): SpeciesId {
  var cur = sp;
  for (var k = 0; k < 4; k++) { var e = SPECIES[cur].evolve; if (!e || lv < e.at + late) break; cur = e.into; }
  return cur;
}
/** the creatures of a covo whose leader is at level `lv`, with `pins` pins of the city already won */
export function crewAt(id: string, lv: number, pins: number, tune?: number): CrewMember[] {
  var cv = COVI[id], n = pins >= 2 ? 3 : 2;
  return cv.crew.slice(0, n).map(function (sp, i) {
    var l = Math.max(3, lv - CREW_BELOW[n][i] + (tune != null ? tune : (cv.crewTune || [])[pins] || 0)), own = i === n - 1 ? MINE[cv.leader][0] : sp;
    return { sp: grownAt(own, l, CREW_LATE), lv: l };
  });
}
