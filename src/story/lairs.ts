import { COVI } from '../data/covi';
import { COVO_PLACES, type CovoPlace } from '../data/covo-places';
import type { FriendId } from '../data/characters';
import { st } from '../save/story-progress';
import { firstHuman } from './growth';
import { bestOf } from './activities';

/* The covi as the story sees them (data/covo-places.ts says what they are): who has been sent there, how each one stands
   (the aura of the map follows this), the gifts the keepers have given, and the keys of the scooter. Pure rules: the
   talk is in ui/story-screen.ts, the pictures in render/canvas/covo.ts. */

/** a covo keeper's covo, from the id of the covo */
export function placeOf(id: string): CovoPlace { return COVO_PLACES[id]; }
/** the covo whose keeper is the one played: his own, there is nothing to beat in it */
export function mine(id: string): boolean { return COVI[id].leader === firstHuman(); }
/** has someone in town given the invitation to this covo (or is it open anyway: beaten, or one's own)? */
export function invited(id: string): boolean {
  if (mine(id) || st.beaten[id] || st.seen['invito-' + id]) return true;
  /* Claudia's invitation is won at the quiz of Morgana: three right answers out of five */
  return id === 'morgana' && (bestOf('quiz') || 0) >= 3;
}
/** how a covo stands, for its picture: the one played lives there; beaten and quiet; the next stop of the tour (its
    aura burns); waiting */
export type CovoState = 'mine' | 'beaten' | 'next' | 'waiting';
export function covoState(id: string, next: string | null): CovoState {
  if (mine(id)) return 'mine';
  if (st.beaten[id]) return 'beaten';
  return next === 'covo-' + id || next === 'invito-' + id ? 'next' : 'waiting';
}
/** what the covi of Formia look like now, as one key: the map is repainted when it changes */
export function lairsKey(next: string | null): string {
  return Object.keys(COVO_PLACES).map(function (k) { return covoState(k, next).charAt(0); }).join('');
}
/* ---------- the gifts ---------- */
/** a keeper's gift, once his covo is beaten (data/covo-places.ts, gift) */
export function hasGift(gift: string): boolean {
  for (const k in COVO_PLACES) if (COVO_PLACES[k].gift.id === gift) return !!st.beaten[k] && !mine(k);
  return false;
}
/** the gifts the player has, in the order of the covi */
export function gifts(): CovoPlace['gift'][] {
  return Object.keys(COVO_PLACES).filter(function (k) { return st.beaten[k] && !mine(k); }).map(function (k) { return COVO_PLACES[k].gift; });
}
/** the Tessera of Costanzo: what a price is in the shops of Formia */
export const DISCOUNT = 0.8;
export function discounted(price: number): number { return hasGift('tessera') ? Math.max(1, Math.round(price * DISCOUNT)) : price; }
/** the Mărțișor of Valentin, worn: no wild creature comes out */
export function charmOn(): boolean { return hasGift('martisor') && !!st.martisor; }

/* ---------- the keys of the scooter ----------
   The night before, at the caminetto, the player left the keys of his Liberty on the table, and the friend of the
   nearest covo took them home with him: then the echo shut him in. They come back with that covo's pin. Old stories
   that have already ridden the scooter keep it. */
let keysOf: ((me: FriendId) => string | null) | null = null;
/** who has the keys: told by the tour (story/goals.ts), which knows the order of the covi */
export function keysFrom(f: (me: FriendId) => string | null) { keysOf = f; }
/** the covo where the keys are, for this story */
export function keysCovo(): string | null { return keysOf ? keysOf(firstHuman() as FriendId) : null; }
export function keysHolder(): FriendId | null { var c = keysCovo(); return c ? COVI[c].leader : null; }
export function hasKeys(): boolean {
  if (st.seen['chiavi-liberty'] || st.moto || st.sella) return true;
  var c = keysCovo();
  return !c || !!st.beaten[c];
}
