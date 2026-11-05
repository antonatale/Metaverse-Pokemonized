import { st } from '../save/story-progress';
import { M, type PreparedMap } from './maps';
import { arrive, prove, type Arrival, type Proof, type Walker } from './place';
import type { PlaceDef } from '../data/maps/types';

/* A place in the game: what Antonio has done there is in the save, and the rules are the same ones the validator proved
   (story/place.ts). */

export interface PlaceSave { flags: Record<string, boolean>; tick: number; rest: [number, number] | null }
function saved(id: string): PlaceSave {
  st.places = st.places || {};
  return st.places[id] || (st.places[id] = { flags: {}, tick: 0, rest: null });
}
export function placeNow(id: string): PlaceSave { return (st.places && st.places[id]) || { flags: {}, tick: 0, rest: null }; }
/** Antonio has finished a step in a place: the step counts, the tile does what it does, the guards turn */
export function placeArrived(p: PlaceDef): Arrival {
  const g = saved(M.id), w: Walker = { x: st.x, y: st.y, tick: g.tick + 1, flags: g.flags, rest: g.rest }, a = arrive(p, w);
  g.tick = a.w.tick; g.flags = a.w.flags; g.rest = a.w.rest;
  M.people.forEach(function (q) { if (q.n.patrol && !q.path) q.dir = q.n.patrol[g.tick % q.n.patrol.length]; });
  return a;
}
/** the proof of a place: the rules of story/place.ts on the map as it is, with its walls. Everyone and everything that can
    stand on a tile counts as standing there, even if the story may take them away: a way must not need them to be gone */
export function placeProof(m: PreparedMap): Proof {
  return prove(m.place!, function (x, y) {
    return x < 0 || y < 0 || x >= m.w || y >= m.h || m.solid[y * m.w + x] === 1 || (m.npcs || []).some(function (n) { return n.x === x && n.y === y; }) || (m.items || []).some(function (it) { return it.x === x && it.y === y; });
  });
}
