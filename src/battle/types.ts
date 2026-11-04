import type { FighterId, Stats } from '../data/characters';
import type { TypeName } from '../data/types';

/* The state of a battle is plain JSON, RNG included: same seed and same choices, same battle.
   That is what the golden tests (tests/unit/engine-golden.test.ts) rely on, and what lets a battle be saved. */

export type Mode = 'cpu' | 'pvp';
export type Phase = 'intro' | 'begin' | 'select' | 'busy' | 'over';
export type Result = 'win' | 'time' | 'draw' | 'catch';

export interface Mod { stat: string; mult: number; until: number; tag: string }

export interface Side {
  id: FighterId;
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
  /* story battles only (missing elsewhere, so the free battles stay exactly as they were) */
  /** the fighter's numbers at its level (with Antonio's abilities), and the level */
  stats?: Stats;
  lvl?: number;
  /** a creature: the moves it knows, and the name Antonio gave it */
  known?: string[];
  nick?: string;
  /** a golden one: only its colours change */
  gold?: boolean;
  /** Antonio's abilities: his chance a turn to lose a thing, and to get an idea from the AI */
  perk?: { lose: number; idea: number };
  /** a creature's bond with Antonio: the chance, once a battle, to hold on at 1 HP instead of going down */
  endure?: number;
  /** how much better this side's nets catch (Antonio's steady hand) */
  net?: number;
}
/** how a side of a story battle comes on */
export interface SideOpts { stats?: Stats; lvl?: number; known?: string[]; nick?: string; gold?: boolean; perk?: { lose: number; idea: number }; hp?: number; endure?: number; net?: number }
/** what the story knows about a battle: the covo, or the wild creature (its id on the map), who fights for Antonio, the foe's level */
export interface StoryTag { covo?: string; wild?: string; trainer?: string; tourney?: number; sp?: string; key?: string; foeLv?: number; gold?: boolean; scene?: string }

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
  story?: StoryTag | null;
  /** a wild creature: the player may throw a net at it */
  wild?: boolean;
  /** the player's bag in story battles (nets, tielle), used up as the battle goes */
  bag?: Record<string, number>;
  /** the net held: the battle ends with the creature caught */
  caught?: boolean;
  /** someone who sends creatures in, one after the other (data/trainers.ts) */
  trainer?: string;
}

export interface NewBattle { a: FighterId; b: FighterId; mode?: Mode; seed: number; safe?: string[]; sideA?: SideOpts; sideB?: SideOpts; wild?: boolean; bag?: Record<string, number>; trainer?: string }

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
