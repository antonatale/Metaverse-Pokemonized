import type { CharId } from '../data/characters';
import type { TypeName } from '../data/types';

/* The state of a battle is plain JSON, RNG included: same seed and same choices, same battle.
   That is what the golden tests (tests/unit/engine-golden.test.ts) rely on, and what lets a battle be saved. */

export type Mode = 'cpu' | 'pvp';
export type Phase = 'intro' | 'begin' | 'select' | 'busy' | 'over';
export type Result = 'win' | 'time' | 'draw';

export interface Mod { stat: string; mult: number; until: number; tag: string }

export interface Side {
  id: CharId;
  human: boolean;
  hp: number;
  max: number;
  /** loses the next turn: the robot fell, or Costanzo did not let him speak */
  skip: { why: 'robot' | 'talk' } | null;
  /** turns of confusion left */
  conf: number;
  mods: Mod[];
  /** Manipolazione: must repeat this move until that turn */
  encore: { move: string; until: number } | null;
  lastMove: string | null;
  /** stats and moves visible to the other side */
  revealed: boolean;
  /* Antonio */
  boost: boolean;
  /** white certificates set aside */
  tee: number;
  /** stage of the trip: 0 Formia, 1 Torino, 2 AMERICA */
  lv: number;
  /** the lost object and the move it blocks */
  lock: { move: string; until: number } | null;
  saidAi: boolean;
  seenAmerica: boolean;
  /* Costanzo */
  lastAtk: string | null;
  atkStreak: number;
  /** in character until that turn */
  persona: number;
  /* Andrea: moves already taken */
  seen: Record<string, number>;
  /* Valentin */
  away: boolean;
  charge: string | null;
  saidRegen: boolean;
  /* Forchetta */
  sturdy: boolean;
  /* Zendavid */
  anx: number;
  zen: number;
  used: Record<string, boolean>;
  /** times each limited move has been used */
  uses: Record<string, number>;
  st: { dmg: number; crits: number; lost: number; fails: number; heals: number };
}

export interface Forced { move?: string; skip?: boolean }
export interface Grade { g: number; lode: boolean }

export interface BattleState {
  v: 2;
  rng: number;
  turn: number;
  mode: Mode;
  boss: boolean;
  K: number;
  maxTurns: number;
  sides: [Side, Side];
  phase: Phase;
  plan: [string | null, string | null];
  forced: [Forced | null, Forced | null];
  /** the player knows the computer's move this turn (Diagnosi Energetica), and next turn */
  forecast: [boolean, boolean];
  forecastNext: [boolean, boolean];
  result: Result | null;
  winner: number | null;
  grade: Grade | null;
  recorded: boolean;
  /** moves whose object the player's Antonio can't lose (story mode: the things already found around town) */
  safe: string[];
  /** set by the UI for story battles */
  story?: { covo: string } | null;
}

export interface NewBattle { a: CharId; b: CharId; mode?: Mode; seed: number; safe?: string[] }

/* ---------- what the engine tells the UI ---------- */
export interface Chip { c: string; i: string; t: string; d: string }
export interface Snap { k: 'sync'; turn: number; maxTurns: number; boss: boolean; chips: [Chip[], Chip[]]; revealed: [boolean, boolean]; ph: [boolean, boolean] }
export type BattleEvent =
  | { k: 'say'; text: string }
  | { k: 'line'; who: number; text: string }
  | { k: 'expr'; who: number; v: string }
  | { k: 'anim'; who: number; a: string; item?: string; text?: string; style?: string }
  | { k: 'hp'; who: number; hp: number; dmg?: number; crit?: boolean; eff?: number; heal?: number; quiet?: boolean }
  | Snap
  | { k: 'end'; result: Result; winner: number | null; grade: Grade | null };

/** what a move button shows */
export interface MoveLabel {
  id: string;
  name: string;
  kind: string;
  locked: boolean;
  sub: string;
  icon: string | null;
  /** Antonio's trip: one dot per stage reached */
  dots: boolean[] | null;
  /** uses left, for limited moves */
  left?: number;
}

export type { TypeName };
