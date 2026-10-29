/* Battle engine: any two characters, against the computer or two players on one device.
   Pure state + seeded RNG, no DOM: every call returns a list of events for the UI to play back. */
import { CHARS, ROSTER } from '../data/characters';
import { TYPES, TYPE_ORDER, type TypeName } from '../data/types';
import { ITEMS } from '../data/items';
import { TUNE } from '../data/tuning';
import type { BattleState } from './types';
import { eff, beaterOf, move, mv, newBattle, available, sideType as typeOf } from './state';
import { expected } from './damage';
import { snap, moveLabel } from './labels';
import { ai } from './ai';
import { intro, beginTurn, needs, playTurn } from './turn';

export * from './types';
export { eff, beaterOf, move, newBattle, available, expected, snap, moveLabel, ai, intro, beginTurn, needs, playTurn };

/** time left in the exam, as h:mm (10 minutes a turn) */
export function clock(s: BattleState): string { const m = (s.maxTurns - s.turn + 1) * 10; return Math.floor(m / 60) + ':' + ('0' + (m % 60)).slice(-2); }
/** the name of the move the computer has chosen for this turn */
export function planName(s: BattleState, i: number): string | null { const p = s.plan[i]; return p ? mv(s.sides[i], p)!.name : null; }
/** a side's type right now (Costanzo's Personaggismo changes it) */
export function sideType(s: BattleState, i: number): TypeName { return typeOf(s, s.sides[i], s.sides[1 - i]); }

/** the whole engine as one object, with the same names the old window.ENGINE had */
export const ENGINE = {
  TYPES, TYPE_ORDER, eff, beaterOf, ITEMS, CHARS, ROSTER, TUNE,
  move, newBattle, intro, beginTurn, needs, playTurn,
  available, moveLabel, snap, ai, expected,
  ANTONIO: CHARS.antonio, ESAME: CHARS.esame,
  clock, planName, sideType
};
