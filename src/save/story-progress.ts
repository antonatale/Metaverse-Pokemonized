import { MAPS } from '../data/maps';
import type { Dir } from '../data/maps/types';
import type { FriendId } from '../data/characters';
import type { SpeciesId } from '../data/creatures';

/* Saved progress of the story, on this device only. Same key and same format as the old single-file game,
   so old saves keep working; localStorage can be missing or throw (private windows, sandboxed frames). */
export const KEY = 'lotte-tra-amici:storia:v1';
/* More than one story on the same device: three slots. The first is the old key, so an old save is the first story;
   the others have keys of their own (KEY + ':2', KEY + ':3'), and SLOT_KEY says which one was played last. Only one is
   loaded at a time, in `st`: the title screen switches with useSlot(). */
export const SLOTS = 3;
const SLOT_KEY = 'lotte-tra-amici:slot:v1';
export function keyOf(n: number): string { return n <= 1 ? KEY : KEY + ':' + n; }
export interface StoryProgress {
  v: 1;
  map: string;
  x: number; y: number; dir: Dir;
  /** pin ids won */
  badges: string[];
  /** friends you can send into battle */
  squad: FriendId[];
  /** covi beaten */
  beaten: Record<string, boolean>;
  /** one-off things already seen: intro, formia2 … formia6 (the save was moved to a redrawn Formia) */
  seen: Record<string, boolean>;
  /** lost things picked up */
  found: Record<string, boolean>;
  /** things done around town (activities.ts): how many times, and the best score */
  done?: Record<string, number>;
  best?: Record<string, number>;
  /* growing up (story/growth.ts); missing in older saves, which start from level 5 with nothing */
  /** level and experience toward the next, by fighter: 'antonio', a friend, or a creature's uid */
  lv?: Record<string, { lv: number; xp: number }>;
  /** Antonio's abilities: the grades taken in each */
  skills?: Record<string, number>;
  /** sesterzi in his pocket */
  money?: number;
  /** what he carries: nets, tielle, coffees */
  bag?: Record<string, number>;
  /** his creatures, in the order he got them (the first is the one he started with), and the names he gave them;
      the four moves each one knows (missing: the last four it learned), its bond with Antonio (0–100), its character,
      and home: true for one that waits at home instead of travelling with him (a team is six at most) */
  /** what has been done in the places with a puzzle: by map, what is switched on, the steps taken, the last rest */
  places?: Record<string, { flags: Record<string, boolean>; tick: number; rest: [number, number] | null }>;
  /** the moves each person knows, once it has started learning (data/people.ts): missing in an old save */
  people?: Record<string, { moves?: string[] }>;
  mons?: { uid: string; sp: SpeciesId; nick?: string; gold?: boolean; moves?: string[]; bond?: number; nat?: string; home?: boolean; item?: string; owner?: string }[];
  /** the creature diary: 1 for a species seen, 2 for one he has had */
  dex?: Record<string, number>;
  /** the creature that walks behind him on the map (his first one when missing) */
  lead?: string;
  /** the creature that follows each of the others of the company, when it is played (Antonio's is lead) */
  leads?: Record<string, string>;
  /** the first of his company: the person shown in the corner of the map and sent in first in a covo (Antonio when missing) */
  first?: FriendId;
  /** the creature his rival Tullio picked after him (story/rival.ts; worked out from Antonio's when missing) */
  rival?: SpeciesId;
}

export function blank(): StoryProgress {
  var m = MAPS.formia;
  return { v: 1, map: 'formia', x: m.start[0], y: m.start[1], dir: m.start[2], badges: [], squad: ['antonio'], beaten: {}, seen: {}, found: {}, lv: {}, skills: {}, money: 0, bag: {}, mons: [] };
}
/** a story as saved in a slot, brought up to date; null for an empty slot (or one that cannot be read) */
export function peekSlot(n: number): StoryProgress | null {
  try { return fix(JSON.parse(window.localStorage.getItem(keyOf(n)) || 'null')); } catch (e) { return null; }
}
function load(n: number): StoryProgress { return peekSlot(n) || blank(); }
function fix(v: StoryProgress | null): StoryProgress | null {
  if (v && v.v === 1 && MAPS[v.map] && v.squad && v.badges) {
    v.found = v.found || {}; v.done = v.done || {}; v.best = v.best || {};
    v.lv = v.lv || {}; v.skills = v.skills || {}; v.money = v.money || 0; v.bag = v.bag || {}; v.mons = v.mons || [];
    /* Formia was redrawn (formia2), as the real town (formia3), with joined-up streets (formia4), as a game map
       with a hand-drawn network of streets (formia5), with the east of town and the street lamps redrawn (formia6):
       start again from home, keep pins, squad and found things */
    if (v.map === 'formia' && (!v.seen.formia2 || !v.seen.formia3 || !v.seen.formia4 || !v.seen.formia5 || !v.seen.formia6)) {
      var m0 = MAPS.formia; v.x = m0.start[0]; v.y = m0.start[1]; v.dir = m0.start[2];
    }
    /* the first of the company used to be only who went first in a covo: now it is who is played, and that is chosen anew */
    if (v.first && !v.seen.protagonisti) delete v.first;
    v.seen.formia2 = true; v.seen.formia3 = true; v.seen.formia4 = true; v.seen.formia5 = true; v.seen.formia6 = true;
    return v;
  }
  return null;
}
/** the slot played last (the first one when none has been chosen yet) */
function lastSlot(): number {
  try { var n = Number(window.localStorage.getItem(SLOT_KEY) || 1); return n >= 1 && n <= SLOTS ? Math.floor(n) : 1; } catch (e) { return 1; }
}
let slot = lastSlot();
export function slotNow(): number { return slot; }
export function save() { try { st.at = Date.now(); window.localStorage.setItem(keyOf(slot), JSON.stringify(st)); } catch (e) { /* ignore */ } }
export let st = load(slot);
/** plays another story from now on: everything reads `st`, so the map, the team and the bag are that slot's */
export function useSlot(n: number) {
  slot = Math.max(1, Math.min(SLOTS, Math.floor(n)));
  st = load(slot);
  try { window.localStorage.setItem(SLOT_KEY, String(slot)); } catch (e) { /* ignore */ }
}
/** empties a slot for good; the one being played starts again from nothing */
export function eraseSlot(n: number) {
  try { window.localStorage.removeItem(keyOf(n)); } catch (e) { /* ignore */ }
  if (n === slot) st = blank();
}
/** starts the story again from scratch (the caller saves) */
export function resetProgress() { st = blank(); }
