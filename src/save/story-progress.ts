import { MAPS } from '../data/maps';
import type { Dir } from '../data/maps/types';
import type { FriendId } from '../data/characters';
import type { SpeciesId } from '../data/creatures';

/* Saved progress of the story, on this device only. Same key and same format as the old single-file game,
   so old saves keep working; localStorage can be missing or throw (private windows, sandboxed frames). */
export const KEY = 'lotte-tra-amici:storia:v1';
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
  /** euro in his pocket */
  money?: number;
  /** what he carries: nets, tielle, coffees */
  bag?: Record<string, number>;
  /** his creatures, in the order he got them; the first is the one he started with */
  mons?: { uid: string; sp: SpeciesId }[];
  /** the creature that walks behind him on the map (his first one when missing) */
  lead?: string;
}

export function blank(): StoryProgress {
  var m = MAPS.formia;
  return { v: 1, map: 'formia', x: m.start[0], y: m.start[1], dir: m.start[2], badges: [], squad: ['antonio'], beaten: {}, seen: {}, found: {}, lv: {}, skills: {}, money: 0, bag: {}, mons: [] };
}
function load(): StoryProgress {
  try {
    var v = JSON.parse(window.localStorage.getItem(KEY) || 'null');
    if (v && v.v === 1 && MAPS[v.map] && v.squad && v.badges) {
      v.found = v.found || {}; v.done = v.done || {}; v.best = v.best || {};
      v.lv = v.lv || {}; v.skills = v.skills || {}; v.money = v.money || 0; v.bag = v.bag || {}; v.mons = v.mons || [];
      /* Formia was redrawn (formia2), as the real town (formia3), with joined-up streets (formia4), as a game map
         with a hand-drawn network of streets (formia5), with the east of town and the street lamps redrawn (formia6):
         start again from home, keep pins, squad and found things */
      if (v.map === 'formia' && (!v.seen.formia2 || !v.seen.formia3 || !v.seen.formia4 || !v.seen.formia5 || !v.seen.formia6)) {
        var m0 = MAPS.formia; v.x = m0.start[0]; v.y = m0.start[1]; v.dir = m0.start[2];
      }
      v.seen.formia2 = true; v.seen.formia3 = true; v.seen.formia4 = true; v.seen.formia5 = true; v.seen.formia6 = true;
      return v;
    }
  } catch (e) { /* storage unavailable */ }
  return blank();
}
export function save() { try { window.localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ignore */ } }
export let st = load();
/** starts the story again from scratch (the caller saves) */
export function resetProgress() { st = blank(); }
