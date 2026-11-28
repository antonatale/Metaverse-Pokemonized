import { REPLY_FX, FLOOR_GUARD, type ReplyFx } from '../data/replies';
import { CHATS } from '../data/chat';
import { COVI } from '../data/covi';
import type { FriendId } from '../data/characters';
import { st } from '../save/story-progress';
import { firstHuman, teamMons, addBond } from './growth';
import { rivalFriend } from './rival-who';

/* What an answer in the group chat does in the game (data/replies.ts). Pure rules: which consequence an answer has, who
   writes back, how a keeper reached after a chat is (fired up, softened), and putting the consequence into the save. */

/** the consequence of answer `k` of chat `id` (none for a chat without them) */
export function replyFx(id: string, k: number): ReplyFx | null { return (REPLY_FX[id] || [])[k] || null; }
/** who writes back: the keeper of the chat's covo, the rival, the friend freed last; never whoever is played */
export function backFrom(id: string, fx: ReplyFx, last?: FriendId | null): FriendId | null {
  if (!fx.back) return null;
  const c = CHATS.find((x) => x.id === id), me = firstHuman();
  const w = fx.back[0], who = w === 'keeper' ? (c && c.covo ? COVI[c.covo].leader : null) : w === 'rival' ? rivalFriend() : w === 'last' ? (last || null) : w;
  if (!who) return null;
  if (who !== me) return who as FriendId;
  /* whoever is played does not write to himself: a friend answers in his place */
  return me === 'valentin' ? 'andrea' : 'valentin';
}
/** the covo a consequence is about: its own, or the chat's */
function covoOf(id: string, fx: ReplyFx): string | null {
  if (fx.covo) return fx.covo;
  const c = CHATS.find((x) => x.id === id);
  return c && c.covo ? c.covo : null;
}
/** the answer chosen, into the save: the gift in the bag, the money, the bond of the creature that leads, the mood of a
    keeper, the guard who will step aside */
export function applyReply(id: string, k: number) {
  const fx = replyFx(id, k);
  if (!fx) return;
  st.chats = st.chats || {};
  const rec = st.chats[id] || (st.chats[id] = { at: Date.now() });
  rec.fx = k;
  if (fx.gift) { st.bag = st.bag || {}; st.bag[fx.gift.item] = (st.bag[fx.gift.item] || 0) + fx.gift.n; }
  if (fx.money) st.money = (st.money || 0) + fx.money;
  if (fx.bond) { const lead = teamMons()[0]; if (lead) addBond(lead.uid, fx.bond); }
  const cv = covoOf(id, fx);
  if (cv && fx.mood) { st.moods = st.moods || {}; st.moods[cv] = fx.mood; }
  if (cv && fx.pass && FLOOR_GUARD[cv]) st.beaten[FLOOR_GUARD[cv]] = true;
}
/** how the keeper of a covo is, after what the player wrote him: fired up, softened, or as ever */
export function moodOf(covo: string): 'carico' | 'tenero' | null { return (st.moods && st.moods[covo]) || null; }
/** the levels his creatures go up or down for it */
export function moodLevels(covo: string): number { const m = moodOf(covo); return m === 'carico' ? 1 : m === 'tenero' ? -1 : 0; }
/** the prize of the battle, for it */
export function moodPrize(covo: string): number { return moodOf(covo) === 'carico' ? 1.5 : 1; }
/** what he says about it, when reached */
export function moodLine(covo: string): string | null {
  const m = moodOf(covo);
  return m === 'carico' ? 'Ho letto il tuo messaggio. Volevi venire? Eccoti. Ma adesso non mi trattengo.' : m === 'tenero' ? 'Ho letto il tuo messaggio, sai. Mi ha fatto bene. Ma la lotta è la lotta.' : null;
}
