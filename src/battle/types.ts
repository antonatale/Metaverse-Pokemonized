import type { FighterId, Stats } from '../data/characters';
import type { TypeName } from '../data/types';
import type { StatusId } from '../data/passives';
import type { LegendStage } from '../data/legends';

/* The state of a battle is plain JSON, RNG included: same seed and same choices, same battle.
   That is what the golden tests (tests/unit/engine-golden.test.ts) rely on, and what lets a battle be saved. */

export type Mode = 'cpu' | 'pvp';
export type Phase = 'intro' | 'begin' | 'select' | 'busy' | 'send' | 'over';
export type Result = 'win' | 'time' | 'draw' | 'catch';

export interface Mod { stat: string; mult: number; until: number; tag: string }

export interface Side {
  id: FighterId;
  human: boolean;
  hp: number;
  max: number;
  /** loses the next turn: the robot fell, or Costanzo did not let him speak */
  skip: { why: 'robot' | 'talk' | 'broken' } | null;
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
  /** who this fighter is for the story in a team battle: its key in Antonio's team ('c1', 'antonio'), f0, f1… for the foes */
  key?: string;
  /** the last resort of a team: it comes in only when nobody else is left (Antonio himself) */
  last?: boolean;
  /** it has just come in by choice: on guard until the turn ends */
  fresh?: boolean;
  /* a creature's passives (data/passives.ts; battle/passives.ts does them) */
  /** its ability, two for a last form */
  abil?: string[];
  /** the thing it carries */
  item?: string;
  /** the abilities and things with a one-time effect that have had it */
  spent?: Record<string, boolean>;
  /** the state it is in, and the turns it has left */
  status?: { id: StatusId; left: number } | null;
  /** it has already acted this turn */
  went?: boolean;
  /** a legend's fight, in parts (data/legends.ts), and the part it has reached */
  stages?: LegendStage[];
  stage?: number;
  /** its types of the moment, when they are not those of its kind */
  types?: TypeName[];
  /** it can do Risonanza: its bond with Antonio is strong enough */
  resonate?: boolean;
}
/** how a side of a story battle comes on */
export interface SideOpts { stats?: Stats; lvl?: number; known?: string[]; nick?: string; gold?: boolean; perk?: { lose: number; idea: number }; hp?: number; endure?: number; net?: number; key?: string; last?: boolean; item?: string; stages?: LegendStage[]; abil?: string[]; resonate?: boolean }
/** someone on the bench when a team battle starts */
export interface Member extends SideOpts { id: FighterId }
/** one foe of a team battle: who fought it, and who brought it down. The story pays out from these */
export interface Bout { key: string; foe: FighterId; lv: number; who: string[]; ko: boolean; by: string | null }
/** what the story knows about a battle: the covo, or the wild creature (its id on the map), who fights for Antonio, the foe's level */
export interface StoryTag { covo?: string; wild?: string; trainer?: string; tourney?: number; sp?: string; key?: string; foeLv?: number; gold?: boolean; scene?: string; day?: boolean }

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
  /** the net that held it */
  caughtWith?: string;
  /** a story battle in the dark (some nets catch better then) */
  night?: boolean;
  /** the wild creature has been said to be worn out (the moment for a net) */
  tired?: boolean;
  /** someone who sends creatures in, one after the other (data/trainers.ts) */
  trainer?: string;
  /* the team battles of the story (missing elsewhere: the free battles stay exactly as they were) */
  /** who waits on each side, with all they came in with; `sides` are the two on the field */
  bench?: [Side[], Side[]];
  /** the place on the bench of who the computer sends next, said out loud so the player may change before it comes in */
  nextIn?: [number | null, number | null];
  /** how well each side's computer plays a team: 0 in the order of the team, never changing by choice; 1 and up the
      best one against the one in front */
  smart?: [number, number];
  /** how many times each side's computer may still change by choice */
  swaps?: [number, number];
  /** who fought whom, foe by foe */
  bouts?: Bout[];
  /* the magic of a place (missing elsewhere, as above) */
  /** the type that is stronger here */
  field?: { type: TypeName; name: string };
  /** each side's Slancio, and whether it has done its Risonanza */
  surge?: [number, number];
  resonated?: [boolean, boolean];
  /** a boss's magic on the second side: what is left of it (data/trainers.ts) */
  shield?: { left: number; max: number; name: string };
}

export interface NewBattle { a: FighterId; b: FighterId; mode?: Mode; seed: number; safe?: string[]; sideA?: SideOpts; sideB?: SideOpts; wild?: boolean; bag?: Record<string, number>; trainer?: string; night?: boolean; benchA?: Member[]; benchB?: Member[]; smart?: [number, number]; field?: { type: TypeName; name: string }; shield?: { left: number; name: string } }

/* ---------- what the engine tells the UI ---------- */
export interface Chip { c: string; i: string; t: string; d: string }
export interface Snap { k: 'sync'; turn: number; maxTurns: number; boss: boolean; chips: [Chip[], Chip[]]; revealed: [boolean, boolean]; ph: [boolean, boolean]; team?: [string[], string[]]; types?: [TypeName[], TypeName[]]; who?: [string, string]; surge?: [number, number]; place?: string }
export type BattleEvent =
  | { k: 'say'; text: string }
  | { k: 'line'; who: number; text: string }
  | { k: 'expr'; who: number; v: string }
  | { k: 'anim'; who: number; a: string; item?: string; text?: string; style?: string; move?: string; shakes?: number }
  | { k: 'hp'; who: number; hp: number; dmg?: number; crit?: boolean; eff?: number; heal?: number; quiet?: boolean }
  /** another fighter on the field: the UI redraws that side with what it says */
  | { k: 'swap'; who: number; id: FighterId; key?: string; gold?: boolean; hp: number }
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
  /** a net: the chance it holds right now */
  chance?: number;
  /** a thing in the bag: how many are left */
  count?: number;
  /** the creatures' moves: the type of the spell, how well it works on the foe in front (1 even), power and aim */
  mtype?: TypeName | null;
  eff?: number;
  power?: number;
  acc?: number;
}

/** someone on a side's bench, for the screen that picks who comes in */
export interface BenchLabel {
  /** its place on the bench (the choice is `switch:<slot>`) */
  slot: number;
  id: FighterId;
  name: string;
  lvl?: number;
  gold?: boolean;
  hp: number;
  max: number;
  types: TypeName[];
  last: boolean;
  /** it can come in now */
  ready: boolean;
  /** against the foe in front (or the one coming in): the best it can do (effLevel), and how the foe's magic does on it */
  hits: number;
  takes: number;
  /** what the card says about it */
  note: string;
}

export type { TypeName };
