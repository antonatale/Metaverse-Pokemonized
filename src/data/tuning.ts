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
}
export const TUNE: Tune = { zenBoost: 1.2, healBase: 20, healPer: 12, K: 0.3, se: 1.12, nve: 0.9, regen: 5, calc: 0.8, talk: 0.25, critAndrea: 2 };

/** damage scale of the exam, and the fallback when a battle has none */
export const K = 0.42;
/** base critical hit chance */
export const CRIT = 1 / 16;

/** the creatures' magic (story battles): the type of a move against each type of the one it hits, stronger than the
    friends' advantage (×se when it beats it, ×nve when it is beaten, multiplied for two types). Plain moves have no
    type. Tuned with tools/sim-story.ts. */
export const MAGIC_TUNE = { se: 1.12, nve: 0.9 };
