import type { Character, FighterId, Move, Stats } from '../data/characters';
import { fighter } from '../data/fighters';
import { TYPES, type TypeName } from '../data/types';
import { TUNE } from '../data/tuning';
import type { BattleState, NewBattle, Side, SideOpts } from './types';

/* ---------- types ---------- */
export function eff(a: TypeName | null, d: TypeName | null): number {
  if (!a || !d || a === d) return 1;
  if (TYPES[a].beats === d) return TUNE.se;
  if (TYPES[d].beats === a) return TUNE.nve;
  return 1;
}
export function beaterOf(t: string): TypeName | null { for (const k in TYPES) if (TYPES[k as TypeName].beats === t) return k as TypeName; return null; }

/* ---------- lookups ---------- */
export function ch(side: Side): Character { return side.nick ? nicked(fighter(side.id), side.nick) : fighter(side.id); }
/* a creature with the name Antonio gave it: the same character, under another name */
const named: Record<string, Character> = {};
function nicked(c: Character, nick: string): Character { const k = c.id + '|' + nick; return named[k] || (named[k] = Object.assign({}, c, { name: nick })); }
/** a side's numbers: its own in story battles (level, abilities), the character's otherwise */
export function statsOf(side: Side): Stats { return side.stats || ch(side).stats; }
export function move(c: Character, id: string): Move | null { for (let i = 0; i < c.moves.length; i++) if (c.moves[i].id === id) return c.moves[i]; return null; }
export function mv(side: Side, id: string): Move | null { return move(ch(side), id) || BAG[id] || null; }
/** the bag of story battles: nets for a wild creature, a slice of tiella. They go before any move */
export const BAG: Record<string, Move> = {
  retino: { id: 'retino', name: 'Retino', kind: 'status', priority: 6, text: 'Prova a catturare la creatura: più è stanca, più è facile.' },
  retino2: { id: 'retino2', name: 'Retino da pesca', kind: 'status', priority: 6, text: 'Il retino dei pescatori di Mola: cattura molto più facilmente.' },
  tiella: { id: 'tiella', name: 'Tiella', kind: 'heal', priority: 6, text: 'Una fetta di tiella: recupera 40 PS.' }
};
export const BAG_IDS = ['retino', 'retino2', 'tiella'];

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
  return s;
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
  if (i === 0 && s.bag) BAG_IDS.forEach(function (b) { if ((s.bag![b] || 0) > 0 && (b === 'tiella' || s.wild)) all.push(b); });
  return all;
}

/** matchups depend on the characters' types; Costanzo's Personaggismo swaps his */
export function sideType(s: BattleState, side: Side, foe: Side): TypeName {
  if (personaOn(s, side)) return beaterOf(ch(foe).type) || ch(side).type;
  return ch(side).type;
}
