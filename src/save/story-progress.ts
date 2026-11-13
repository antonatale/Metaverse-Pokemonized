import { MAPS } from '../data/maps';
import type { Dir } from '../data/maps/types';
import { LEGEND } from '../data/maps/legend';
import { ROSTER, type FriendId } from '../data/characters';
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
  /** one-off things already seen: intro, formia2 … formia8 (the save was moved to a redrawn Formia) */
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
  /** the scooter (story/maps.ts, moto): where it stands when it is not where the story first leaves it, and
      whether he is on it */
  moto?: { map: string; x: number; y: number; dir: Dir };
  sella?: boolean;
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
  /** the creature the rival picked after him (story/rival.ts; worked out from the player's when missing) */
  rival?: SpeciesId;
  /** Nicola's van, where it is parked (story/van.ts); and who walks with the player besides the creature (Nicola) */
  van?: { map: string; x: number; y: number; dir: Dir };
  companion?: 'nicola';
  /** the rival of this story: one of the friends, picked when it begins (story/rival-who.ts); Tullio when missing in a
      story that had met him */
  rivalFriend?: FriendId;
  /** the chats of «il caminetto» (data/chat.ts): when each came, and what the player answered */
  chats?: Record<string, { at: number; reply?: string }>;
  /** how many manuals from the bookshop Antonio has read: a point for his abilities each */
  books?: number;
  /** when it was last saved (ms since 1970), for the title screen: missing in an old save */
  at?: number;
}

/** a story from nothing: Antonio's, or the one of whoever is chosen on the title, from his home; he is alone in his
    company, and nobody joins it (data/covi.ts) */
export function blank(first?: FriendId): StoryProgress {
  var m = MAPS.formia, at = (first && m.starts && m.starts[first]) || m.start;
  var s: StoryProgress = { v: 1, map: 'formia', x: at[0], y: at[1], dir: at[2], badges: [], squad: [first || 'antonio'], beaten: {}, seen: {}, found: {}, lv: {}, skills: {}, money: 0, bag: {}, mons: [] };
  if (first && first !== 'antonio') { s.first = first; s.seen.protagonisti = true; }
  /* a story begun today has nothing to be brought up to date */
  MIGRATIONS.forEach(function (m) { s.seen[m.id] = true; });
  return s;
}
/** a story as saved in a slot, brought up to date; null for an empty slot (or one that cannot be read) */
export function peekSlot(n: number): StoryProgress | null {
  try { return fix(JSON.parse(window.localStorage.getItem(keyOf(n)) || 'null')); } catch (e) { return null; }
}
/** a slot that has something in it the game cannot read: before anything is written over it, the old text goes to
    the slot's `:backup` key (once: an older backup is not lost), and the title says so */
export function backupOf(n: number): string { return keyOf(n) + ':backup'; }
export const trouble: { unreadable: number[]; saveFailed: boolean } = { unreadable: [], saveFailed: false };
function load(n: number): StoryProgress {
  var s = peekSlot(n);
  if (s) return s;
  try {
    var raw = window.localStorage.getItem(keyOf(n));
    if (raw && raw !== 'null') {
      if (!window.localStorage.getItem(backupOf(n))) window.localStorage.setItem(backupOf(n), raw);
      if (trouble.unreadable.indexOf(n) < 0) trouble.unreadable.push(n);
    }
  } catch (e) { /* no storage: nothing to keep */ }
  return blank();
}
/** the redrawings of Formia: whoever was on the old map starts again from home (his own: the six protagonists),
    keeping pins, team and found things */
function backHome(v: StoryProgress) {
  if (v.map !== 'formia') return;
  var m0 = MAPS.formia, at = (v.first && m0.starts && m0.starts[v.first]) || m0.start;
  v.x = at[0]; v.y = at[1]; v.dir = at[2];
}
export const MIGRATIONS: { id: string; what: string; run: (v: StoryProgress) => void }[] = [
  { id: 'formia2', what: 'Formia ridisegnata', run: backHome },
  { id: 'formia3', what: 'Formia vera, da OpenStreetMap', run: backHome },
  { id: 'formia4', what: 'le strade unite', run: backHome },
  { id: 'formia5', what: 'la rete di strade disegnata a mano', run: backHome },
  { id: 'formia6', what: 'l\'est della città e i lampioni', run: backHome },
  /* the first of the company used to be only who went first in a covo: now it is who is played, chosen anew */
  { id: 'protagonisti', what: 'chi si gioca', run: function (v) { if (v.first) delete v.first; } },
  /* Formia on three levels (VISIONE.md, V3 and V4): the terraces, the trails, the countryside closed behind its walls */
  { id: 'formia7', what: 'Formia a tre piani', run: backHome },
  /* the big Formia (VISIONE.md, 11 November 2026): two and a half times the tiles, every street somewhere else */
  { id: 'formia8', what: 'Formia grande', run: function (v) { backHome(v); delete v.moto; delete v.sella; } },
  /* the cortine of Largo Paone and Mola, the new Torre di Mola, the closed park (12 November 2026): whoever stood where
     a palazzo stands now goes home; everyone else stays where he was */
  { id: 'formia9', what: 'le cortine di Mola e Largo Paone', run: function (v) { if (walled(v.x, v.y)) { backHome(v); delete v.moto; delete v.sella; } } },
  /* Largo Paone and Mola as they are (the second revision of 12 November 2026): the parking with its cars, the inner
     harbour under the tower with its boats, Telaro on via Tullia, piazza Risorgimento; the same rule as formia9, and a
     scooter parked where a palazzo or a car stands now goes back to its place */
  { id: 'formia10', what: 'Largo Paone, Mola e piazza Risorgimento', run: function (v) {
    if (walled(v.x, v.y, /[-9|+8BiT]/)) { backHome(v); delete v.moto; delete v.sella; }
    else if (v.moto && v.moto.map === 'formia' && walled(v.moto.x, v.moto.y, /[-9|+8BiT]/)) delete v.moto;
  } }
];
/** a tile of Formia where nobody can stand since this revision: under a building or an object, or on a railing, a
    gate, a tree, the anchor or a bench (the sea and the walls are not: the game already knows what to do there) */
function walled(x: number, y: number, solid?: RegExp): boolean {
  var m = MAPS.formia, row = m.rows[y], ch = row ? row[x] : undefined;
  if (ch == null) return true;
  if ((solid || /[|+8BiT]/).test(ch) && (LEGEND[ch] || LEGEND['.']).solid) return true;
  var on = function (b: { x: number; y: number; w: number; h: number }) { return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h; };
  return (m.buildings || []).some(on) || (m.objects || []).some(on);
}
function fix(v: StoryProgress | null): StoryProgress | null {
  if (v && v.v === 1 && MAPS[v.map] && v.squad && v.badges) {
    v.found = v.found || {}; v.done = v.done || {}; v.best = v.best || {};
    v.lv = v.lv || {}; v.skills = v.skills || {}; v.money = v.money || 0; v.bag = v.bag || {}; v.mons = v.mons || [];
    /* the steps from one version of the save to the next, in order (R18): each has a flag in `seen`, set once it is
       done, so a save takes the steps it has not taken yet and nothing more. A new step is one more line at the end */
    MIGRATIONS.forEach(function (m) { if (!v.seen[m.id]) { m.run(v); v.seen[m.id] = true; } });
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
/** whoever wants to know when saving fails (the story shows it once): the game goes on, but the player must know */
const failed: (() => void)[] = [];
export function onSaveFail(f: () => void) { failed.push(f); }
export function save(): boolean {
  try { st.at = Date.now(); window.localStorage.setItem(keyOf(slot), JSON.stringify(st)); trouble.saveFailed = false; return true; }
  catch (e) {
    var first = !trouble.saveFailed;
    trouble.saveFailed = true;
    if (first) failed.forEach(function (f) { f(); });
    return false;
  }
}
/** a story from outside (save/transfer.ts, already cleaned) into a slot: what was there goes to the slot's backup
    first; if it is the slot being played, it is played from now on */
export function putSlot(n: number, s: StoryProgress): boolean {
  var v = fix(s);
  if (!v) return false;
  try {
    var old = window.localStorage.getItem(keyOf(n));
    if (old) window.localStorage.setItem(backupOf(n), old);
    window.localStorage.setItem(keyOf(n), JSON.stringify(v));
  } catch (e) { return false; }
  if (n === slot) st = v;
  return true;
}
export let st = load(slot);
/** plays another story from now on: everything reads `st`, so the map, the team and the bag are that slot's */
export function useSlot(n: number) {
  slot = Math.max(1, Math.min(SLOTS, Math.floor(n)));
  st = load(slot);
  try { window.localStorage.setItem(SLOT_KEY, String(slot)); } catch (e) { /* ignore */ }
}
/** a new story in a slot, as whoever is chosen: it is played from now on, and saved at once */
export function startAs(n: number, first: FriendId) {
  slot = Math.max(1, Math.min(SLOTS, Math.floor(n)));
  st = blank(first);
  /* the rival of this story: one of the others, at random */
  const others = ROSTER.filter(function (f) { return f !== first; });
  st.rivalFriend = others[Math.floor(Math.random() * others.length) % others.length];
  try { window.localStorage.setItem(SLOT_KEY, String(slot)); } catch (e) { /* ignore */ }
  save();
}
/** empties a slot for good; the one being played starts again from nothing */
export function eraseSlot(n: number) {
  try { window.localStorage.removeItem(keyOf(n)); } catch (e) { /* ignore */ }
  if (n === slot) st = blank();
}
/** starts the story again from scratch (the caller saves) */
export function resetProgress() { st = blank(st && st.first ? st.first : undefined); }
