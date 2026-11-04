import type { BattleEvent } from './types';

/* ---------- events ---------- */
export function say(t: string): BattleEvent { return { k: 'say', text: t }; }
/** a character speaks; t is always one of the lines the character has */
export function line(w: number, t: string | undefined): BattleEvent { return { k: 'line', who: w, text: t as string }; }
export function expr(w: number, v: string): BattleEvent { return { k: 'expr', who: w, v: v }; }
export function anim(w: number, a: string, extra?: { item?: string; text?: string; style?: string; move?: string; shakes?: number }): BattleEvent {
  const o: Record<string, unknown> = { k: 'anim', who: w, a: a };
  if (extra) for (const x in extra) o[x] = extra[x as keyof typeof extra];
  return o as BattleEvent;
}
