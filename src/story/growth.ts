import { st } from '../save/story-progress';
import type { FighterId } from '../data/characters';
import { fighter } from '../data/fighters';
import { SPECIES, knownAt, learnedAt, isSpecies, type SpeciesId } from '../data/creatures';
import { START_LEVEL, MAX_LEVEL, toNext, atLevel, perksFor, bond, netHand, withNature, NATURES, SKILLS, priceOf, type ItemId, type SkillId } from '../data/growth';
import type { SideOpts } from '../battle';

/* Growing up in the story: the level and experience of every fighter, Antonio's abilities, his money, his bag,
   his creatures. Rules and state only; the story screen shows them. A fighter is known by a key: 'antonio',
   a friend's id, or a creature's uid ('c1', 'c2', …). */

export type Mon = NonNullable<typeof st.mons>[number];
export function creatureOf(key: string): Mon | null {
  return (st.mons || []).filter(function (m) { return m.uid === key; })[0] || null;
}
/** who fights: Antonio, a friend, or the species of a creature */
export function idOf(key: string): FighterId { var c = creatureOf(key); return c ? c.sp : key as FighterId; }
export function nameOf(key: string): string { var c = creatureOf(key); return (c && c.nick) || fighter(idOf(key)).name; }
/** a name for a creature (empty: its species' name again) */
export function setNick(key: string, nick: string) {
  var c = creatureOf(key);
  if (!c) return;
  var n = nick.replace(/\s+/g, ' ').trim().slice(0, 12);
  if (n && n !== SPECIES[c.sp].name) c.nick = n; else delete c.nick;
}
/* ---------- the creature diary ---------- */
export function dexOf(sp: SpeciesId): number { return (st.dex && st.dex[sp]) || 0; }
/** a species met in battle */
export function see(sp: SpeciesId) { st.dex = st.dex || {}; if (!st.dex[sp]) st.dex[sp] = 1; }
/** a species Antonio has had: caught, chosen, or grown into */
export function own(sp: SpeciesId) { st.dex = st.dex || {}; st.dex[sp] = 2; }
export function level(key: string): { lv: number; xp: number } { return (st.lv && st.lv[key]) || { lv: START_LEVEL, xp: 0 }; }
/** everyone who can fight for Antonio: himself, the friends who joined him, his creatures */
export function team(): string[] { return (st.squad as string[]).concat((st.mons || []).map(function (m) { return m.uid; })); }
export function hasStarter(): boolean { return !!st.seen.starter; }

/** how one of Antonio's fighters comes on in a story battle: its numbers at its level, its moves, his abilities */
export function sideOf(key: string): SideOpts {
  var lv = level(key).lv, mon = creatureOf(key), sk = st.skills || {}, o: SideOpts;
  if (mon) {
    o = { stats: withNature(atLevel(SPECIES[mon.sp].stats, lv), mon.nat), lvl: lv, known: movesOf(key), nick: mon.nick, gold: mon.gold };
    /* it holds on for Antonio: his ability, and the bond between them */
    var e = bond(sk) + hearts(key) * 0.03;
    if (e) o.endure = Math.round(e * 100) / 100;
  } else {
    o = { stats: atLevel(fighter(idOf(key)).stats, lv), lvl: lv };
    if (key === 'antonio') o.perk = perksFor(sk);
  }
  /* whoever is in, the nets are Antonio's */
  if (netHand(sk) > 1) o.net = netHand(sk);
  return o;
}
/** a foe at a level: a covo leader, or a wild creature */
export function foeSide(id: FighterId, lv: number): SideOpts {
  if (isSpecies(id)) return { stats: atLevel(SPECIES[id].stats, lv), lvl: lv, known: knownAt(id, lv) };
  return { stats: atLevel(fighter(id).stats, lv), lvl: lv };
}

export interface Growth {
  key: string; xp: number; from: number; to: number;
  /** moves learned straight away, and the ones that need one of four forgotten (the story screen asks) */
  learned: string[]; pending: string[];
  evolved: { from: SpeciesId; to: SpeciesId } | null;
  /** a form it could take, but its bond with Antonio is not strong enough yet */
  waiting: SpeciesId | null;
}
/* ---------- a creature's moves: the four it knows ---------- */
export function movesOf(key: string): string[] {
  var mon = creatureOf(key);
  if (!mon) return [];
  return mon.moves ? mon.moves.slice() : knownAt(mon.sp, level(key).lv);
}
/** one known move for a new one */
export function swapMove(key: string, old: string, m: string) {
  var mon = creatureOf(key);
  if (!mon) return;
  var ms = movesOf(key), k = ms.indexOf(old);
  if (k >= 0) ms[k] = m; else if (ms.length < 4) ms.push(m);
  mon.moves = ms;
}
/** a new move: learned if there is room, otherwise one to ask about (true) */
function learn(mon: Mon, key: string, m: string, out: Growth) {
  var ms = movesOf(key);
  if (ms.indexOf(m) >= 0) return;
  if (ms.length < 4) { ms.push(m); mon.moves = ms; out.learned.push(m); }
  else out.pending.push(m);
}
/* ---------- the bond between Antonio and a creature: 0 to 100, five hearts ---------- */
export function bondOf(key: string): number { var c = creatureOf(key); return c ? (c.bond != null ? c.bond : 30) : 0; }
export function hearts(key: string): number { return Math.floor(bondOf(key) / 20); }
export function addBond(key: string, n: number) { var c = creatureOf(key); if (c) c.bond = Math.max(0, Math.min(100, bondOf(key) + n)); }
/** experience for a fighter: the levels it goes up, the moves it learns, its new form if it evolves (the last form
    of the first creatures also needs the bond) */
export function gainXp(key: string, xp: number): Growth {
  st.lv = st.lv || {};
  var cur = level(key), from = cur.lv, lv = cur.lv, have = cur.xp + xp;
  while (lv < MAX_LEVEL && have >= toNext(lv)) { have -= toNext(lv); lv++; }
  if (lv >= MAX_LEVEL) have = 0;
  var out: Growth = { key: key, xp: xp, from: from, to: lv, learned: [], pending: [], evolved: null, waiting: null };
  var mon = creatureOf(key);
  /* the moves it knew are the ones of its old level (an old save has none written down) */
  if (mon && !mon.moves) mon.moves = knownAt(mon.sp, from);
  st.lv[key] = { lv: lv, xp: have };
  if (mon) {
    for (var l = from + 1; l <= lv; l++) learnedAt(mon.sp, l).forEach(function (m) { learn(mon!, key, m, out); });
    var sp = mon.sp, first = mon.sp, ev = SPECIES[sp].evolve;
    while (ev && lv >= ev.at) {
      if (ev.bond && bondOf(key) < ev.bond) { out.waiting = ev.into; break; }
      sp = ev.into; ev = SPECIES[sp].evolve;
    }
    if (sp !== first) {
      mon.sp = sp; own(sp); out.evolved = { from: first, to: sp };
      /* a new form brings the next move of its line forward */
      var next = SPECIES[sp].learn.filter(function (x) { return x[0] > lv && movesOf(key).indexOf(x[1]) < 0 && out.pending.indexOf(x[1]) < 0; })[0];
      if (next) learn(mon, key, next[1], out);
    }
  }
  return out;
}
/** a friend who joins: he fights at the level he was beaten at */
export function joinAt(key: string, lv: number) { st.lv = st.lv || {}; if (!st.lv[key]) st.lv[key] = { lv: lv, xp: 0 }; }

/* ---------- Antonio's abilities: a point a level from the start ---------- */
export function grade(id: SkillId): number { return (st.skills || {})[id] || 0; }
export function pointsLeft(): number {
  var used = SKILLS.reduce(function (n, s) { return n + grade(s.id); }, 0);
  return Math.max(0, level('antonio').lv - START_LEVEL - used);
}
export function takeSkill(id: SkillId): boolean {
  var sk = SKILLS.filter(function (s) { return s.id === id; })[0];
  if (!sk || pointsLeft() <= 0 || grade(id) >= sk.max) return false;
  st.skills = st.skills || {}; st.skills[id] = grade(id) + 1;
  return true;
}

/* ---------- money and the bag ---------- */
export function money(): number { return st.money || 0; }
export function earn(n: number) { st.money = money() + Math.round(n); }
export function has(it: ItemId): number { return (st.bag || {})[it] || 0; }
export function priceFor(it: ItemId): number { return priceOf(it, st.skills || {}); }
export function buy(it: ItemId): boolean {
  var p = priceFor(it);
  if (money() < p) return false;
  st.money = money() - p; st.bag = st.bag || {}; st.bag[it] = has(it) + 1;
  return true;
}
/** a coffee for one of the team: experience (and a creature likes it) */
export function drinkCoffee(key: string): Growth | null {
  if (!has('caffe')) return null;
  st.bag!.caffe = has('caffe') - 1;
  addBond(key, 3);
  return gainXp(key, 60);
}
/** what goes into a battle, and what is left of it after */
export function battleBag(): Record<string, number> { return { retino: has('retino'), retino2: has('retino2'), tiella: has('tiella') }; }
export function keepBag(b: Record<string, number> | undefined) {
  if (!b) return;
  st.bag = st.bag || {};
  ['retino', 'retino2', 'tiella'].forEach(function (k) { st.bag![k] = Math.max(0, b[k] || 0); });
}

/** the creature that walks behind Antonio on the map: the one he picked, or his first */
export function leadCreature(): string | null {
  var ms = st.mons || [];
  if (st.lead && ms.some(function (m) { return m.uid === st.lead; })) return st.lead;
  return ms.length ? ms[0].uid : null;
}
export function setLead(uid: string) { st.lead = uid; }
/** a new creature for Antonio, at a level: the one he starts with, or one he has caught */
export function addCreature(sp: SpeciesId, lv: number, gold?: boolean, bond?: number): string {
  st.mons = st.mons || [];
  var n = st.mons.length + 1;
  while (st.mons.some(function (m) { return m.uid === 'c' + n; })) n++;
  var uid = 'c' + n, nats = Object.keys(NATURES);
  /* every creature has its own character; one just caught trusts Antonio a little, the first one more */
  var mon: Mon = { uid: uid, sp: sp, moves: knownAt(sp, lv), bond: bond != null ? bond : 20, nat: nats[Math.floor(Math.random() * nats.length)] };
  if (gold) mon.gold = true;
  st.mons.push(mon);
  own(sp);
  st.lv = st.lv || {}; st.lv[uid] = { lv: lv, xp: 0 };
  return uid;
}
