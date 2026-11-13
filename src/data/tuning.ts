/* Balance numbers, tuned with simulated battles (npm run sim). Change them only with the sim. */
export interface Tune {
  /** Stronger with the headphones on */
  zenBoost: number;
  /** Certificati Bianchi: base heal, and extra per certificate set aside */
  healBase: number;
  healPer: number;
  /** damage scale of friendly battles */
  K: number;
  /** type advantage: damage dealt (se) and taken (nve) */
  se: number;
  nve: number;
  /** Valentin's heal at the end of every turn */
  regen: number;
  /** Andrea's damage taken from a move he has already seen */
  calc: number;
  /** chance that Costanzo's hit makes the foe lose the turn */
  talk: number;
  /** critical hit multiplier against Andrea */
  critAndrea: number;
  /** Claudia: the first blow she takes (Il Padre), what she gives and takes under a third of her health (Diabolica),
      her answer in the same turn (Puoi Sentire Anche il Mio?) */
  padre: number;
  diabolica: number;
  ascolta: number;
}
export const TUNE: Tune = { zenBoost: 1.2, healBase: 20, healPer: 12, K: 0.3, se: 1.12, nve: 0.9, regen: 5, calc: 0.8, talk: 0.25, critAndrea: 2, padre: 0.5, diabolica: 1.2, ascolta: 1.5 };

/** damage scale of the exam, and the fallback when a battle has none */
export const K = 0.42;
/** base critical hit chance */
export const CRIT = 1 / 16;

/** the creatures' magic (story battles): the type of a move against each type of the one it hits, stronger than the
    friends' advantage (×se when it beats it, ×nve when it is beaten, multiplied for two types). Plain moves have no
    type. Tuned with tools/sim-story.ts. */
export const MAGIC_TUNE = { se: 1.12, nve: 0.9 };
/* A change in a team battle costs the turn and greets who comes in with the foe's hit: at ×1,12 / ×0,9 that is as much as
   the type gives back, and raising the type's numbers breaks the story's early battles (`tools/sim-fun.ts team` measures
   it). So a change costs less instead: `guard` is how much of a hit reaches who has just come in, `rest` how much of its
   health who waits on the bench gets back each turn. The computer changes if the numbers say the team ends up `margin`
   fighters better off, with this `chance` (a change that always comes is one the player reads). */
/** the magic of a place, and what a creature can do with it (battle/surge.ts). `boost`: the moves of the place's type do
    this much more. Slancio goes up to `max`; Risonanza gives back `heal` of the health. `shield`: what a boss's magic takes
    off a blow until it is broken, and how much more it takes for `open` turns once it is */
export const FIELD_TUNE = { boost: 1.1, max: 3, heal: 0.15, shield: 0.8, broken: 1.3, open: 2 };
export const SWITCH_TUNE = { guard: 0.5, rest: 0.05, margin: 0.15, chance: 0.75 };
