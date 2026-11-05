import { st } from '../save/story-progress';
import { CHOICES } from '../data/choices';
import { LEGENDS, type LegendDef, type LegendStage } from '../data/legends';
import { flag } from './plot';

/* What the player has decided (data/choices.ts), and what follows from it. Only flags of st.seen: nothing here is a new
   field of the save, and an old save has simply decided nothing yet. */
export function optionFlag(choice: string, option: string): string { return 'sc-' + choice + '-' + option; }
/** the option taken, if any */
export function chosen(id: string): string | null {
  var o = CHOICES[id].options.filter(function (x) { return st.seen[optionFlag(id, x.id)]; })[0];
  return o ? o.id : null;
}
export function decide(id: string, option: string) { st.seen[optionFlag(id, option)] = true; }

/** where Tullio stands: a friend after two kind words, against Antonio after two jokes, and as he always was otherwise */
export type Mood = 'ally' | 'bitter' | '';
export function tullioMood(): Mood {
  var a = chosen('tullio1'), b = chosen('tullio2');
  return a === 'amico' && b === 'amico' ? 'ally' : a === 'sfotto' && b === 'sfotto' ? 'bitter' : '';
}
/** Antonio still has the stones in his bag */
export function stonesKept(): boolean { return chosen('pietre') === 'tenute' && !flag('sc-lamo-libero'); }

/* ---------- how a legend ends ---------- */
export function legendOf(sp: string): LegendDef | null {
  for (var k in LEGENDS) if (LEGENDS[k].sp === sp) return LEGENDS[k];
  return null;
}
/** what a legend's end has been: `preso` in a net, `libero` let go, `patto` a pact still to be kept, `amico` a pact kept */
export function endFlag(L: LegendDef, end: 'preso' | 'libero' | 'patto' | 'amico'): string { return 'sc-' + L.id + '-' + end; }
/** a pact waits for what the legend has asked for */
export function pactOpen(L: LegendDef): boolean { return flag(endFlag(L, 'patto')) && !flag(endFlag(L, 'amico')); }
/** the fight as it stands now: the same one, but a king robbed of his stones says other things and hits harder */
export function stagesNow(L: LegendDef): LegendStage[] {
  return L.id === 'lamo' && stonesKept() ? L.stages.map(function (s) { return Object.assign({}, s, { line: s.angry || s.line }); }) : L.stages;
}
/** how much stronger it is now, in levels */
export function legendOver(L: LegendDef): number { return L.angry && stonesKept() ? L.angry.more : 0; }
