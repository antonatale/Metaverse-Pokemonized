import type { Character, FighterId, FriendId, Move, Stats } from '../data/characters';
import { NETS, NET_IDS } from '../data/nets';
import { fighter } from '../data/fighters';
import { grownChar } from '../data/people';
import { SPECIES, isSpecies } from '../data/creatures';
import { STATUS } from '../data/passives';
import { TYPES, isPersonType, type PersonType, type TypeName } from '../data/types';
import { TUNE } from '../data/tuning';
import type { BattleState, NewBattle, Side, SideOpts } from './types';

/* ---------- types ---------- */
export function eff(a: TypeName | null, d: TypeName | null): number {
  if (!a || !d || a === d) return 1;
  /* the people's cycle: a creature's own types (Antonio against a creature of the sea) count for nothing */
  if (!isPersonType(a) || !isPersonType(d)) return 1;
  if (TYPES[a].beats === d) return TUNE.se;
  if (TYPES[d].beats === a) return TUNE.nve;
  return 1;
}
export function beaterOf(t: string): PersonType | null { for (const k in TYPES) if (TYPES[k as PersonType].beats === t) return k as PersonType; return null; }

/* ---------- lookups ---------- */
export function ch(side: Side): Character { return side.nick ? nicked(fighter(side.id), side.nick) : side.grown ? grownChar(side.id as FriendId) : fighter(side.id); }
/* a creature with the name Antonio gave it: the same character, under another name */
const named: Record<string, Character> = {};
function nicked(c: Character, nick: string): Character { const k = c.id + '|' + nick; return named[k] || (named[k] = Object.assign({}, c, { name: nick })); }
/** a side's numbers: its own in story battles (level, abilities), the character's otherwise */
export function statsOf(side: Side): Stats { return side.stats || ch(side).stats; }
export function move(c: Character, id: string): Move | null { for (let i = 0; i < c.moves.length; i++) if (c.moves[i].id === id) return c.moves[i]; return null; }
export function mv(side: Side, id: string): Move | null { return move(ch(side), id) || BAG[id] || null; }
/** the bag of story battles: the nets for a wild creature (data/nets.ts), a slice of tiella. They go before any move */
export const BAG: Record<string, Move> = {};
NET_IDS.forEach(function (id) { BAG[id] = { id: id, name: NETS[id].name, kind: 'status', priority: 6, text: NETS[id].text }; });
BAG.tiella = { id: 'tiella', name: 'Tiella', kind: 'heal', priority: 6, text: 'Una fetta di tiella: recupera 40 PS.' };
export const BAG_IDS: string[] = (NET_IDS as string[]).concat(['tiella']);

/* ---------- a new battle ---------- */
function newSide(id: FighterId, human: boolean, o?: SideOpts): Side {
  const c = fighter(id), hp = o && o.stats ? o.stats.hp : c.stats.hp;
  const side: Side = {
    id: id, human: !!human, hp: hp, max: hp,
    skip: null, conf: 0, mods: [], encore: null, lastMove: null, revealed: false,
    boost: false, tee: 0, lv: 0, lock: null, saidAi: false, seenAmerica: false,
    lastAtk: null, atkStreak: 0, persona: 0,
    seen: {}, away: false, charge: null, saidRegen: false,
    sturdy: false, anx: 0, zen: 0, used: {}, uses: {},
    st: { dmg: 0, crits: 0, lost: 0, fails: 0, heals: 0 }
  };
  if (o && o.stats) side.stats = { hp: o.stats.hp, atk: o.stats.atk, def: o.stats.def, spe: o.stats.spe };
  if (o && o.lvl) side.lvl = o.lvl;
  if (o && o.known) side.known = o.known.slice();
  if (o && o.nick) side.nick = o.nick;
  if (o && o.gold) side.gold = true;
  if (o && o.hp != null) side.hp = Math.max(1, Math.min(side.max, Math.round(o.hp)));
  if (o && o.perk) side.perk = { lose: o.perk.lose, idea: o.perk.idea };
  if (o && o.endure) side.endure = o.endure;
  if (o && o.net) side.net = o.net;
  if (o && o.key) side.key = o.key;
  if (o && o.last) side.last = true;
  if (o && o.item) side.item = o.item;
  if (o && o.resonate) side.resonate = true;
  if (o && o.grown) side.grown = true;
  if (o && o.form) side.form = o.form;
  if (o && o.stages) { side.stages = o.stages; side.stage = 0; side.known = o.stages[0].moves.slice(); if (o.stages[0].types) side.types = o.stages[0].types.slice(); }
  /* a creature's ability comes with its kind */
  if (isSpecies(id) && SPECIES[id].abil) side.abil = SPECIES[id].abil!.slice();
  return side;
}
export function newBattle(o: NewBattle): BattleState {
  const a = o.a, b = o.b;
  let mode = o.mode || 'cpu';
  if (b === 'esame') mode = 'cpu';
  const s: BattleState = {
    v: 2, rng: (o.seed >>> 0) || 1, turn: 1, mode: mode, boss: b === 'esame', K: b === 'esame' ? 0.42 : TUNE.K,
    maxTurns: b === 'esame' ? 12 : 30,
    sides: [newSide(a, true, o.sideA), newSide(b, mode === 'pvp', o.sideB)],
    phase: 'intro', plan: [null, null], forced: [null, null], forecast: [false, false], forecastNext: [false, false],
    result: null, winner: null, grade: null, recorded: false,
    safe: (o.safe || []).slice()
  };
  if (mode === 'pvp') { s.sides[0].revealed = true; s.sides[1].revealed = true; }
  if (o.wild) s.wild = true;
  if (o.trainer) s.trainer = o.trainer;
  if (o.bag) s.bag = Object.assign({}, o.bag);
  if (o.night) s.night = true;
  if (o.smart) s.smart = [o.smart[0], o.smart[1]];
  if (o.field) { s.field = { type: o.field.type, name: o.field.name }; s.surge = [o.surgeStart || 0, 0]; s.resonated = [false, false]; }
  if (o.shield) s.shield = { left: o.shield.left, max: o.shield.left, name: o.shield.name };
  if (o.hero) s.hero = o.hero;
  if (o.benchA || o.benchB) {
    const ba = o.benchA || [], bb = o.benchB || [];
    s.bench = [ba.map(function (m) { return newSide(m.id, true, m); }), bb.map(function (m) { return newSide(m.id, mode === 'pvp', m); })];
    s.sides[0].key = s.sides[0].key || 'antonio';
    [s.sides[1]].concat(s.bench[1]).forEach(function (x, n) { x.key = 'f' + n; });
    s.maxTurns = 30 * (1 + Math.max(ba.length, bb.length));
    s.nextIn = [null, null];
    s.swaps = o.smart ? [o.smart[0], o.smart[1]] : [0, 0];
    s.bouts = [];
    tally(s);
  }
  return s;
}

/* ---------- team battles ---------- */
/** the two on the field have met: the story pays by who fought whom */
export function tally(s: BattleState) {
  if (!s.bouts) return;
  const me = s.sides[0], foe = s.sides[1];
  if (me.hp <= 0 || foe.hp <= 0) return;
  let b = s.bouts.filter(function (x) { return x.key === foe.key; })[0];
  if (!b) { b = { key: foe.key!, foe: foe.id, lv: foe.lvl || 0, who: [], ko: false, by: null }; s.bouts.push(b); }
  if (me.key && b.who.indexOf(me.key) < 0) b.who.push(me.key);
}
const SWITCH = 'switch:';
/** a choice that is not a move: that place on the bench comes in, and it costs the turn */
export function isSwitch(id: string | null | undefined): boolean { return !!id && id.indexOf(SWITCH) === 0; }
export function switchSlot(id: string): number { return +id.slice(SWITCH.length); }
/** the changes a side may make this turn, as choices (none if it is forced to do something else) */
export function switches(s: BattleState, i: number): string[] {
  if (!s.bench || s.forced[i]) return [];
  const st = s.sides[i].status;
  if (st && STATUS[st.id].trap) return [];
  const out: string[] = [];
  s.bench[i].forEach(function (x, k) { if (x.hp > 0 && !x.last) out.push(SWITCH + k); });
  return out;
}
/** the places on the bench that can come in for one who is down: the last resort only when nobody else is left */
export function senders(s: BattleState, i: number): number[] {
  const out: number[] = [], rest: number[] = [];
  if (s.bench) s.bench[i].forEach(function (x, k) { if (x.hp > 0) (x.last ? rest : out).push(k); });
  return out.length ? out : rest;
}

/* ---------- modifiers ---------- */
export function addMod(side: Side, stat: string, mult: number, until: number, tag: string) {
  side.mods = side.mods.filter(function (m) { return m.tag !== tag; });
  side.mods.push({ stat: stat, mult: mult, until: until, tag: tag });
}
export function modMult(s: BattleState, side: Side, stat: string): number {
  let m = 1;
  side.mods.forEach(function (x) { if (x.stat === stat && x.until >= s.turn) m *= x.mult; });
  return m;
}
export function hasMod(s: BattleState, side: Side, tag: string): boolean { return side.mods.some(function (x) { return x.tag === tag && x.until >= s.turn; }); }
export function zenOn(s: BattleState, side: Side): boolean { return side.id === 'zendavid' && side.zen >= s.turn; }
export function personaOn(s: BattleState, side: Side): boolean { return side.id === 'costanzo' && side.persona >= s.turn; }

/* ---------- what a side may choose ---------- */
export function available(s: BattleState, i: number): string[] {
  const side = s.sides[i], c = ch(side);
  const all = c.moves.map(function (m) { return m.id; }).filter(function (id) {
    if (side.known && side.known.indexOf(id) < 0) return false;
    if (side.lock && side.lock.move === id) return false;
    const mm = move(c, id)!;
    if (mm.uses && (side.uses[id] || 0) >= mm.uses) return false;
    return true;
  });
  if (side.encore && side.encore.until >= s.turn && all.indexOf(side.encore.move) >= 0) return [side.encore.move];
  /* the player's bag, in story battles: the nets only against a wild creature */
  if (i === 0 && s.bag) BAG_IDS.forEach(function (b) { if ((s.bag![b] || 0) > 0 && (b === 'tiella' ? side.hp < side.max || !!side.status : s.wild && !netShut(s))) all.push(b); });
  return all;
}

/** a legend's fight: a net holds only in its last part */
export function netShut(s: BattleState): boolean { const x = s.sides[1]; return !!x.stages && x.stage! < x.stages.length - 1; }

/** matchups depend on the characters' types; Costanzo's Personaggismo swaps his */
export function sideType(s: BattleState, side: Side, foe: Side): TypeName {
  if (personaOn(s, side)) return beaterOf(ch(foe).type) || ch(side).type;
  return ch(side).type;
}
