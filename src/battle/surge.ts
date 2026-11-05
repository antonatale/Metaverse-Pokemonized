import type { BattleEvent, BattleState } from './types';
import { FIELD_TUNE } from '../data/tuning';
import { SPECIES, isSpecies } from '../data/creatures';
import { rand } from './rng';
import { say, anim, expr } from './events';
import { addMod, ch } from './state';
import { heal, expected } from './damage';
import { cureStatus } from './passives';
import { snap } from './labels';

/* What a place gives to who fights in it (data/scenes.ts PLACE_MAGIC). Slancio goes up when a blow lands where it hurts, on
   both sides: who is at a disadvantage takes more of them and gets its own back. With three points, and a bond strong
   enough, once in a battle a creature can answer to the magic of the place: Risonanza. It takes the type of the place as
   its second one for the rest of the battle, gets its health back a little and its next blow does half as much again.
   It ties together two things that did not speak to each other, the bond and the place, and it asks when.
   All of this needs a place, and only the battles of creatures have one: the free battles stay exactly as they were. */

const RES = 'res:';
/** a choice that carries Risonanza with a move: `res:<move>` */
export function isResonance(id: string | null | undefined): boolean { return !!id && id.indexOf(RES) === 0; }
export function moveOf(id: string): string { return isResonance(id) ? id.slice(RES.length) : id; }
/** the choice of a move with Risonanza */
export function withResonance(id: string): string { return RES + id; }

/** a blow has landed: Slancio for who gave it, if it was a critical or super effective; for who took it, if it was super
    effective, so that who is at a disadvantage gets its own back */
export function surgeOn(s: BattleState, i: number, crit: boolean, eff: number, ev: BattleEvent[]) {
  if (!s.surge) return;
  const strong = eff > 1.02;
  if (crit || strong) bump(s, i, ev);
  if (strong) bump(s, 1 - i, ev);
}
function bump(s: BattleState, i: number, ev: BattleEvent[]) {
  if (s.surge![i] >= FIELD_TUNE.max) return;
  s.surge![i]++;
  if (s.surge![i] === FIELD_TUNE.max && i === 0 && canResonate(s, i)) ev.push(say(ch(s.sides[i]).name + ' sente la magia ' + s.field!.name + ': può fare la Risonanza!'));
}
export function canResonate(s: BattleState, i: number): boolean {
  const x = s.sides[i];
  return !!s.surge && s.surge[i] >= FIELD_TUNE.max && !s.resonated![i] && !!x.resonate && isSpecies(x.id) && x.hp > 0;
}
/** the computer does it too, when it counts and not always in the same way: low on health, or to finish the foe off */
export function wantsResonance(s: BattleState, i: number): boolean {
  if (!canResonate(s, i)) return false;
  const me = s.sides[i], foe = s.sides[1 - i], low = me.hp / me.max < 0.5, plan = s.plan[i], blow = plan ? expected(s, i, plan) : 0;
  const finish = blow < foe.hp && blow * 1.5 >= foe.hp;
  return (low || finish) && rand(s) < 0.7;
}
/** a creature answers to the magic of the place */
export function resonate(s: BattleState, i: number, ev: BattleEvent[]) {
  const x = s.sides[i], f = s.field!, sp = SPECIES[x.id as keyof typeof SPECIES];
  s.surge![i] = 0; s.resonated![i] = true;
  /* the type of the place takes the place of its second one; one that has it already stays as it is */
  if (sp.type !== f.type && sp.type2 !== f.type) x.types = [sp.type, f.type];
  x.boost = true;
  ev.push(anim(i, 'resonance', { style: f.type, text: 'Risonanza!' }));
  ev.push(say(ch(x).name + ' risuona con la magia ' + f.name + ': ora è anche di tipo ' + f.type + '!'));
  if (x.hp < x.max) heal(s, i, x.max * FIELD_TUNE.heal, ev, ch(x).name + ' si sente rinascere.');
  cureStatus(s, i, ev);
  ev.push(snap(s));
}

/* ---------- a boss's magic: a shield that only the right blows crack ---------- */
/** a blow on the boss's side: super effective, it cracks the shield. When the last point goes who is on the field loses
    its next turn and takes more for a while: a boss is beaten by looking for its weak spots, not by hitting harder */
export function shieldHit(s: BattleState, i: number, eff: number, ev: BattleEvent[]) {
  const sh = s.shield, foe = s.sides[1 - i];
  if (!sh || i !== 0 || !sh.left || eff <= 1.02) return;
  sh.left--;
  if (sh.left) { ev.push(say('La ' + sh.name + ' si incrina (' + sh.left + '/' + sh.max + ').')); return; }
  ev.push(anim(1, 'broken', { text: sh.name + ' rotta!' }));
  ev.push(say('La ' + sh.name + ' va in pezzi!'));
  if (foe.hp <= 0) return;
  ev.push(expr(1, 'worried'));
  foe.skip = { why: 'broken' };
  addMod(foe, 'guard', FIELD_TUNE.broken, s.turn + FIELD_TUNE.open, 'broken');
}
