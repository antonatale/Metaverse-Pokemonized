import { st } from '../save/story-progress';
import type { FighterId } from '../data/characters';
import { fighter } from '../data/fighters';
import { SPECIES, knownAt, learnedAt, isSpecies, type SpeciesId } from '../data/creatures';
import { START_LEVEL, MAX_LEVEL, toNext, atLevel, perksFor, bond, netHand, withNature, NATURES, SKILLS, priceOf, DEX_PRIZES, WARES, HELD_IDS, coins, type DexPrize, type ItemId, type SkillId, xpFor } from '../data/growth';
import type { Bout, SideOpts } from '../battle';
import { NET_IDS } from '../data/nets';
import type { HeldId } from '../data/passives';

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
/** everyone who can fight for Antonio: himself, the friends who joined him, the creatures travelling with him */
export function team(): string[] { return (st.squad as string[]).concat(teamMons().map(function (m) { return m.uid; })); }
/* ---------- the team and the creatures at home ---------- */
/** at most this many creatures travel with Antonio; the others wait at home, in his flat, until he swaps them */
export const TEAM_MAX = 6;
export function teamMons(): Mon[] { return (st.mons || []).filter(function (m) { return !m.home; }); }
/** the average level of the three best creatures of the team (0 with none): what a place that follows the team aims at */
export function teamRef(): number {
  var top = teamMons().map(function (m) { return level(m.uid).lv; }).sort(function (a, b) { return b - a; }).slice(0, 3);
  return top.length ? top.reduce(function (n, x) { return n + x; }, 0) / top.length : 0;
}
export function homeMons(): Mon[] { return (st.mons || []).filter(function (m) { return !!m.home; }); }
/** home and back: the team keeps at least one creature and never more than TEAM_MAX */
export function sendHome(uid: string): boolean {
  var m = creatureOf(uid);
  if (!m || m.home || teamMons().length <= 1) return false;
  m.home = true;
  if (st.lead === uid) delete st.lead;
  return true;
}
export function bringAlong(uid: string): boolean {
  var m = creatureOf(uid);
  if (!m || !m.home || teamMons().length >= TEAM_MAX) return false;
  delete m.home;
  return true;
}
/* ---------- the creatures' powers on the map ---------- */
/** what a creature can do for Antonio, by the shape of its body: the sea ones swim, the ones of the walls and the trees
    climb, the ones with wings fly up and show Formia from above */
export type Power = 'nuoto' | 'scalata' | 'volo';
const POWER_OF: Record<string, Power> = { octo: 'nuoto', urchin: 'nuoto', crab: 'nuoto', jelly: 'nuoto', star: 'nuoto', eel: 'nuoto', dolphin: 'nuoto', fish: 'nuoto',
  lizard: 'scalata', cicada: 'scalata', snail: 'scalata', cat: 'scalata', bird: 'volo', owl: 'volo', bat: 'volo', falcon: 'volo', firefly: 'volo' };
export function powerOfSpecies(sp: SpeciesId): Power | null { return POWER_OF[SPECIES[sp].art.body] || null; }
/** the creature of the team that has a power (the one at his side first), or null */
export function powerOf(p: Power): string | null {
  var lead = leadCreature(), ms = teamMons();
  if (lead && powerOfSpecies(creatureOf(lead)!.sp) === p) return lead;
  var m = ms.filter(function (c) { return powerOfSpecies(c.sp) === p; })[0];
  return m ? m.uid : null;
}
/** the first of the company: shown in the corner of the map, sent in first in a covo */
export function firstHuman(): string { return st.first && st.squad.indexOf(st.first) >= 0 ? st.first : 'antonio'; }
export function setFirst(id: string) { if ((st.squad as string[]).indexOf(id) >= 0) st.first = id as typeof st.first; }
/** where a fighter is on its way to the next level, 0–1 */
export function progress(key: string): number { var l = level(key); return l.lv >= MAX_LEVEL ? 1 : Math.min(1, l.xp / toNext(l.lv)); }
export function hasStarter(): boolean { return !!st.seen.starter; }

/** how one of Antonio's fighters comes on in a story battle: its numbers at its level, its moves, his abilities */
export function sideOf(key: string): SideOpts {
  var lv = level(key).lv, mon = creatureOf(key), sk = st.skills || {}, o: SideOpts;
  if (mon) {
    o = { stats: withNature(atLevel(SPECIES[mon.sp].stats, lv), mon.nat), lvl: lv, known: movesOf(key), nick: mon.nick, gold: mon.gold };
    /* it holds on for Antonio: his ability, and the bond between them */
    var e = bond(sk) + hearts(key) * 0.03;
    if (e) o.endure = Math.round(e * 100) / 100;
    if (mon.item) o.item = mon.item;
    /* three hearts: it can answer to the magic of a place */
    if (hearts(key) >= RESONANCE_HEARTS) o.resonate = true;
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

/** what each fighter earned in a team battle: all the experience of a foe to who brought it down, a third to whoever
    else fought it, or to everyone who fought it if it was left standing. In the order they took the field */
export function fightPay(bouts: Bout[], covo: boolean): { key: string; xp: number; won: boolean }[] {
  var out: { key: string; xp: number; won: boolean }[] = [];
  bouts.forEach(function (b) {
    b.who.forEach(function (k) {
      var won = b.ko && b.by === k, x = out.filter(function (o) { return o.key === k; })[0];
      if (!x) { x = { key: k, xp: 0, won: false }; out.push(x); }
      x.xp += xpFor(b.lv, won, covo);
      x.won = x.won || won;
    });
  });
  return out;
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
const RESONANCE_HEARTS = 3;
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
      /* a new form brings its own move (or else the next move of its line) */
      var sig = SPECIES[sp].sig, next = sig && movesOf(key).indexOf(sig) < 0 && out.pending.indexOf(sig) < 0 ? sig : null;
      if (!next) { var nx = SPECIES[sp].learn.filter(function (x) { return x[0] > lv && movesOf(key).indexOf(x[1]) < 0 && out.pending.indexOf(x[1]) < 0; })[0]; if (nx) next = nx[1]; }
      if (next) learn(mon, key, next, out);
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
/** an ability opens with a point in the one before it on its branch */
export function skillOpen(id: SkillId): boolean {
  var sk = SKILLS.filter(function (s) { return s.id === id; })[0];
  return !!sk && (!sk.after || grade(sk.after) > 0 || grade(id) > 0);
}
export function takeSkill(id: SkillId): boolean {
  var sk = SKILLS.filter(function (s) { return s.id === id; })[0];
  if (!sk || pointsLeft() <= 0 || grade(id) >= sk.max || !skillOpen(id)) return false;
  st.skills = st.skills || {}; st.skills[id] = grade(id) + 1;
  return true;
}

/* ---------- money and the bag ---------- */
export function money(): number { return st.money || 0; }
export function earn(n: number) { st.money = money() + Math.round(n); }
export function has(it: ItemId): number { return (st.bag || {})[it] || 0; }
/** what Antonio has in the bag for his creatures to carry */
export function heldInBag(): HeldId[] { return HELD_IDS.filter(function (it) { return has(it) > 0; }); }
/** a creature carries this now (or nothing): what it had goes back in the bag */
export function giveHeld(key: string, it: HeldId | null) {
  var mon = creatureOf(key);
  if (!mon) return;
  st.bag = st.bag || {};
  if (mon.item) { st.bag[mon.item] = (st.bag[mon.item] || 0) + 1; delete mon.item; }
  if (it && has(it) > 0) { st.bag[it] = has(it) - 1; mon.item = it; }
}
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
/** what can go into a battle: the nets (data/nets.ts) and the tiella */
export const BAG_ITEMS: ItemId[] = (NET_IDS as ItemId[]).concat(['tiella']);
export function battleBag(): Record<string, number> { var b: Record<string, number> = {}; BAG_ITEMS.forEach(function (k) { b[k] = has(k); }); return b; }
export function keepBag(b: Record<string, number> | undefined) {
  if (!b) return;
  st.bag = st.bag || {};
  BAG_ITEMS.forEach(function (k) { st.bag![k] = Math.max(0, b[k] || 0); });
}
/* ---------- the creature diary and the guardaparco's prizes ---------- */
/** how many species have been Antonio's (caught, chosen, grown into) */
export function dexHad(): number { return (Object.keys(SPECIES) as SpeciesId[]).filter(function (id) { return dexOf(id) === 2; }).length; }
function prizeAt(p: DexPrize): number { return p.all ? Object.keys(SPECIES).length : p.n; }
function prizeKey(p: DexPrize): string { return 'premio-diario-' + (p.all ? 'tutte' : p.n); }
/** the prizes reached and not given yet */
export function dexPrizesDue(): DexPrize[] { var had = dexHad(); return DEX_PRIZES.filter(function (p) { return had >= prizeAt(p) && !st.seen[prizeKey(p)]; }); }
/** the next prize to reach, and how many species it wants */
export function nextDexPrize(): { p: DexPrize; at: number } | null {
  var had = dexHad();
  for (var k = 0; k < DEX_PRIZES.length; k++) { var p = DEX_PRIZES[k]; if (had < prizeAt(p) && !st.seen[prizeKey(p)]) return { p: p, at: prizeAt(p) }; }
  return null;
}
/** a prize given: the nets in the bag, the sesterzi in the pocket */
export function takeDexPrize(p: DexPrize) {
  st.bag = st.bag || {};
  (Object.keys(p.give) as ItemId[]).forEach(function (it) { st.bag![it] = has(it) + (p.give[it] || 0); });
  if (p.coins) earn(p.coins);
  st.seen[prizeKey(p)] = true;
}
/** a prize in words: "3 retini da pesca e 100 sesterzi" */
export function prizeText(p: DexPrize): string {
  var bits = (Object.keys(p.give) as ItemId[]).map(function (it) { var n = p.give[it] || 0; return n + ' ' + (n === 1 ? WARES[it].name.toLowerCase() : PLURAL[it] || WARES[it].name.toLowerCase()); });
  if (p.coins) bits.push(coins(p.coins));
  return bits.join(' e ');
}
const PLURAL: Partial<Record<ItemId, string>> = { retino: 'retini', retino2: 'retini da pesca', argento: 'retini d\'argento', oro: 'retini d\'oro', nassa: 'nasse', lampara: 'reti della lampara', tiella: 'fette di tiella' };
/** the nets Antonio has, all kinds together */
export function netsLeft(): number { return NET_IDS.reduce(function (n, k) { return n + has(k); }, 0); }

/** the creature that walks behind Antonio on the map: the one he picked, or his first */
export function leadCreature(): string | null {
  var ms = teamMons();
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
  /* a full team: the new one goes home and waits there */
  if (teamMons().length >= TEAM_MAX) mon.home = true;
  st.mons.push(mon);
  own(sp);
  st.lv = st.lv || {}; st.lv[uid] = { lv: lv, xp: 0 };
  return uid;
}
