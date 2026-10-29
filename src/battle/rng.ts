import type { BattleState } from './types';

/** mulberry32 on a state field, so a battle can be saved and resumed */
export function rand(s: BattleState): number {
  s.rng = (s.rng + 0x6D2B79F5) >>> 0;
  let t = s.rng;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
export function pick<T>(s: BattleState, arr: T[]): T { return arr[Math.floor(rand(s) * arr.length) % arr.length]; }
