/* Battle engine: any two characters, against the computer or two players on one device.
   Pure state + seeded RNG, no DOM: every call returns a list of events for the UI to play back. */
import { CHARS, ROSTER } from '../data/characters';
import { TYPES, TYPE_ORDER, type TypeName } from '../data/types';
import { ITEMS } from '../data/items';
import { TUNE } from '../data/tuning';
import type { BattleState } from './types';
import { eff, beaterOf, move, mv, newBattle, available, sideType as typeOf, switches, isSwitch, BAG, BAG_IDS } from './state';
import { expected, typesOf, effLevel } from './damage';
import { snap, moveLabel, benchLabels, changeText } from './labels';
import { ai } from './ai';
import { intro, beginTurn, needs, playTurn, sendNeeds, sendIn } from './turn';

export * from './types';
export { eff, beaterOf, move, newBattle, available, switches, expected, effLevel, snap, moveLabel, benchLabels, ai, intro, beginTurn, needs, playTurn, sendNeeds, sendIn };

/** time left in the exam, as h:mm (10 minutes a turn) */
export function clock(s: BattleState): string { const m = (s.maxTurns - s.turn + 1) * 10; return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
/** the name of the move the computer has chosen for this turn */
export function planName(s: BattleState, i: number): string | null { const p = s.plan[i]; return p && !isSwitch(p) ? mv(s.sides[i], p)!.name : null; }
/** a side's type right now (Costanzo's Personaggismo changes it) */
export function sideType(s: BattleState, i: number): TypeName { return typeOf(s, s.sides[i], s.sides[1 - i]); }
/** all of a side's types: two for some creatures */
export function sideTypes(s: BattleState, i: number): TypeName[] { return typesOf(s, s.sides[i], s.sides[1 - i]); }

/** the whole engine as one object, with the same names the old window.ENGINE had */
export const ENGINE = {
  TYPES, TYPE_ORDER, eff, beaterOf, ITEMS, CHARS, ROSTER, TUNE,
  move, newBattle, intro, beginTurn, needs, playTurn, sendNeeds, sendIn,
  available, switches, moveLabel, benchLabels, changeText, snap, ai, expected, BAG, BAG_IDS,
  ANTONIO: CHARS.antonio, ESAME: CHARS.esame,
  clock, planName, sideType, sideTypes, effLevel
};
