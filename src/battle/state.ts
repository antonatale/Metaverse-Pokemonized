import { CHARS, type CharId, type Character, type Move } from '../data/characters';
import { TYPES, type TypeName } from '../data/types';
import { TUNE } from '../data/tuning';
import type { BattleState, NewBattle, Side } from './types';

/* ---------- types ---------- */
export function eff(a: TypeName | null, d: TypeName | null): number {
  if (!a || !d || a === d) return 1;
  if (TYPES[a].beats === d) return TUNE.se;
  if (TYPES[d].beats === a) return TUNE.nve;
  return 1;
}
export function beaterOf(t: string): TypeName | null { for (const k in TYPES) if (TYPES[k as TypeName].beats === t) return k as TypeName; return null; }

/* ---------- lookups ---------- */
export function ch(side: Side): Character { return CHARS[side.id]; }
export function move(c: Character, id: string): Move | null { for (let i = 0; i < c.moves.length; i++) if (c.moves[i].id === id) return c.moves[i]; return null; }
export function mv(side: Side, id: string): Move | null { return move(ch(side), id); }

/* ---------- a new battle ---------- */
function newSide(id: CharId, human: boolean): Side {
  const c = CHARS[id];
  return {
    id: id, human: !!human, hp: c.stats.hp, max: c.stats.hp,
    skip: null, conf: 0, mods: [], encore: null, lastMove: null, revealed: false,
    boost: false, tee: 0, lv: 0, lock: null, saidAi: false, seenAmerica: false,
    lastAtk: null, atkStreak: 0, persona: 0,
    seen: {}, away: false, charge: null, saidRegen: false,
    sturdy: false, anx: 0, zen: 0, used: {}, uses: {},
    st: { dmg: 0, crits: 0, lost: 0, fails: 0, heals: 0 }
  };
}
export function newBattle(o: NewBattle): BattleState {
  const a = o.a, b = o.b;
  let mode = o.mode || 'cpu';
  if (b === 'esame') mode = 'cpu';
  const s: BattleState = {
    v: 2, rng: (o.seed >>> 0) || 1, turn: 1, mode: mode, boss: b === 'esame', K: b === 'esame' ? 0.42 : TUNE.K,
    maxTurns: b === 'esame' ? 12 : 30,
    sides: [newSide(a, true), newSide(b, mode === 'pvp')],
    phase: 'intro', plan: [null, null], forced: [null, null], forecast: [false, false], forecastNext: [false, false],
    result: null, winner: null, grade: null, recorded: false,
    safe: (o.safe || []).slice()
  };
  if (mode === 'pvp') { s.sides[0].revealed = true; s.sides[1].revealed = true; }
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
    if (side.lock && side.lock.move === id) return false;
    const mm = move(c, id)!;
    if (mm.uses && (side.uses[id] || 0) >= mm.uses) return false;
    return true;
  });
  if (side.encore && side.encore.until >= s.turn && all.indexOf(side.encore.move) >= 0) return [side.encore.move];
  return all;
}

/** matchups depend on the characters' types; Costanzo's Personaggismo swaps his */
export function sideType(s: BattleState, side: Side, foe: Side): TypeName {
  if (personaOn(s, side)) return beaterOf(ch(foe).type) || ch(side).type;
  return ch(side).type;
}
