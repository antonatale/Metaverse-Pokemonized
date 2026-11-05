import { st } from '../save/story-progress';
import { MISSIONS, type Mission } from '../data/missions';
import { addCreature, earn, firstHuman, level, teamMons } from './growth';
import { flag } from './plot';

/* The missions of each friend (data/missions.ts): what is done is a flag of st.seen, so an old save has done none. */
export function missionFlag(m: Mission): string { return 'ms-' + m.id; }
export function missionDone(m: Mission): boolean { return flag(missionFlag(m)); }
/** the mission of someone on the map, still to do */
export function missionOf(npc: string): Mission | null { return MISSIONS.filter(function (m) { return m.npc === npc && !missionDone(m); })[0] || null; }
export function missionOfTrainer(id: string): Mission | null { return MISSIONS.filter(function (m) { return m.trainer === id && !missionDone(m); })[0] || null; }
/** only the friend it is for can do it */
export function canDo(m: Mission): boolean { return firstHuman() === m.who; }
/** the right one, but with no creature yet: at the start of the game the neighbour is just the neighbour */
export function tooEarly(m: Mission): boolean { return canDo(m) && !teamMons().length; }
/** a mission done: it pays, and the creature joins the team of who has done it */
export function missionPay(m: Mission): string {
  st.seen[missionFlag(m)] = true;
  earn(m.pay.money);
  st.bag = st.bag || {};
  const b = st.bag, items = m.pay.items || {};
  for (const k in items) b[k] = (b[k] || 0) + (items as Record<string, number>)[k];
  return addCreature(m.pay.mon, Math.max(8, level(m.who).lv - 2));
}
