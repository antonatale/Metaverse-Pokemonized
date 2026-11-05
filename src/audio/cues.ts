import type { BattleEvent } from '../battle';
import { sfx } from './sfx';

/* Which sound goes with what the battle engine says. Like the rest of the UI, sound knows no rules:
   it only hears the events being played back. */
const ANIM: Record<string, string> = {
  lunge: 'lunge', dodge: 'dodge', enter: 'enter', faint: 'faint',
  robot: 'robot', robotFail: 'robotFail', robotFix: 'robotFix', lost: 'lost', found: 'found', ai: 'ai', reveal: 'reveal',
  banner: 'banner', speech: 'speech', glint: 'shimmer', fox: 'whoosh', pump: 'shimmer', confetti: 'party',
  flyAway: 'plane', flyBack: 'planeBack', glowGreen: 'shimmer', ball: 'ball', cryptic: 'confused',
  bark: 'bark', laugh: 'laugh', cricket: 'cricket', confused: 'confused', phOn: 'headphones', phOff: 'click', notes: 'notes',
  magic: 'magic', magicUp: 'magicUp', net: 'net', caught: 'caught', recall: 'whoosh', abil: 'shimmer', status: 'confused', stage: 'banner', resonance: 'banner', broken: 'crit'
};
export function cueBattle(ev: BattleEvent) {
  if (ev.k === 'anim') { const n = ANIM[ev.a]; if (n) sfx(n); }
  else if (ev.k === 'hp') {
    if (ev.dmg) {
      sfx(ev.crit ? 'crit' : 'hit');
      if (ev.eff && ev.eff > 1) sfx('superEff', 0.08);
      else if (ev.eff && ev.eff < 1) sfx('weak', 0.05);
    } else if (ev.heal) sfx(ev.quiet ? 'regen' : 'heal');
  }
}
export const CUE_NAMES = Object.values(ANIM).concat(['hit', 'crit', 'superEff', 'weak', 'heal', 'regen']);

let lastBlip = 0;
/** the typewriter: a soft blip every few letters, a different one when someone speaks */
export function typeBlip(voice: boolean) {
  const now = performance.now();
  if (now - lastBlip < 55) return;
  lastBlip = now;
  sfx(voice ? 'blipVoice' : 'blip');
}
