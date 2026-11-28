import { MINE, type CompanionId } from '../data/companions';
import type { FriendId } from '../data/characters';
import { st } from '../save/story-progress';
import { firstHuman, monsOf, level } from './growth';

/* The creature that is the player's own (27 November 2026, Antonio: «la seconda creatura è quella che ti appartiene»).
   The night of 3:12, beside each of the seven, a creature was born (data/companions.ts): Leoncello beside Antonio,
   Pumbino beside Costanzo, Tedua beside Claudia… It has followed him to the Parco di Gianola, but it is frightened:
   after the first creature, the guardaparco's, the next stop of the tour is to calm it (a battle: caught or beaten, it
   comes along, it was his anyway). Whoever is played has his own; the friends who join bring theirs. Pure rules. */

/** who is played */
function hero(): FriendId { return firstHuman() as FriendId; }
/** the creature born beside whoever is played */
export function mineOf(): CompanionId { return MINE[hero()][0]; }
/** whether whoever is played has his own creature with him (or at home), in any of its forms */
export function hasMine(): boolean {
  var line = MINE[hero()] as string[];
  return monsOf(hero()).some(function (m) { return line.indexOf(m.sp) >= 0; });
}
/** the level it is met at: a little below the first creature, so the battle is a calming and not a slaughter */
export function mineLevel(): number {
  var top = monsOf(hero()).reduce(function (a, m) { return Math.max(a, level(m.uid).lv); }, 0);
  return Math.max(3, top - 1);
}
/** in the menu's diary and in the words: how it is called, for whoever is played */
export function mineSeen(): boolean { return !!st.seen['mia-creatura']; }
