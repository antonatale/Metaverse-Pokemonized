import { st } from '../save/story-progress';
import { CHARS, ROSTER, type FriendId } from '../data/characters';

/* Who the rival is. As in the games there is one, from the first creature to the title of the strongest in Formia: it
   is one of the friends, picked at random when a story begins (never whoever is played), so every story has its own.
   A story that had already met Tullio, the guardaparco's grandson who was the rival before, keeps him. */

/** the one whose story it is (Antonio in a save from before the title asked) */
const hero = (): FriendId => (st.first || (st.squad[0] as FriendId) || 'antonio');
/** a friend at random, not the one played */
export function pickRival(first: FriendId): FriendId {
  const others = ROSTER.filter(function (f) { return f !== first; });
  return others[Math.floor(Math.random() * others.length) % others.length];
}
/** the rival of this story: a friend, or Tullio in a story that met him before */
export function rivalWho(): FriendId | 'tullio' {
  if (st.rivalFriend && st.rivalFriend !== hero()) return st.rivalFriend;
  if (st.beaten['tr-rivale-1'] || st.seen['tr-rivale-1']) return 'tullio';
  st.rivalFriend = pickRival(hero());
  return st.rivalFriend;
}
/** a friend as rival, or null for Tullio */
export function rivalFriend(): FriendId | null { const w = rivalWho(); return w === 'tullio' ? null : w; }
/** the rival's name, for the lines */
export function rivalName(): string { const f = rivalFriend(); return f ? CHARS[f].name : 'Tullio'; }
/** who speaks, for the dialog: a friend's id (the name in the friend's colour), or Tullio's name */
export function rivalSpeaker(): string { return rivalFriend() || 'Tullio'; }
/** the ending of a word that agrees with the rival: «passato», «passata» */
export function rivalA(): string { const f = rivalFriend(); return f && CHARS[f].fem ? 'a' : 'o'; }
