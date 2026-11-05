import { st } from '../save/story-progress';
import { SPECIES, STARTERS, type SpeciesId } from '../data/creatures';
import { MAGIC_CHART, magicBeats } from '../data/types';
import { TRAINERS, type Trainer } from '../data/trainers';
import { flag } from './plot';
import { tullioMood } from './choices';
import { monsOf } from './growth';

/* The rival, as in the Pokémon games: Tullio, the guardaparco's grandson. He picks his creature right after Antonio,
   the one of the three whose type beats Antonio's (none beats Ramarrino's Calma: he takes Polpino, the cleverest), and
   meets him three times, each time stronger: at the park as soon as they have their creatures, on the Appia on the way
   to Cicero's tomb, and at the park again once Mamurra is beaten, for the title of the strongest in Formia.
   His own creature always comes in last, as his best. */

/** the starter that beats this one; when none does, one this one does not beat */
export function rivalFor(mine: SpeciesId): SpeciesId {
  var t = SPECIES[mine].type, others = STARTERS.filter(function (s) { return s !== mine; });
  return others.filter(function (s) { return magicBeats(SPECIES[s].type, t); })[0] || others.filter(function (s) { return !magicBeats(t, SPECIES[s].type); })[0] || others[0];
}
/** the first form of a line */
function firstForm(sp: SpeciesId): SpeciesId {
  for (var k in SPECIES) { var o = SPECIES[k as SpeciesId]; if (o.evolve && o.evolve.into === sp) return firstForm(o.id); }
  return sp;
}
/** the form of a line at a stage */
export function formAt(sp: SpeciesId, stage: number): SpeciesId {
  var s = firstForm(sp);
  while (SPECIES[s].stage < stage && SPECIES[s].evolve) s = SPECIES[s].evolve!.into;
  return s;
}
/** Antonio's first creature, as he has it now */
function mine(): SpeciesId | null { var m = monsOf('antonio')[0]; return m ? m.sp : null; }
/** Tullio's creature (a save from before him: worked out from Antonio's) */
export function rival(): SpeciesId { var m = mine(); return st.rival || rivalFor(m ? firstForm(m) : 'polpino'); }

/** the meetings, and what opens each one: Tullio is only at the last one reached, until he is beaten there (at the
    last one he stays, for rematches) */
const MEETS: { id: string; after: string }[] = [{ id: 'rivale-1', after: 'starter' }, { id: 'rivale-2', after: 'pietra-mare' }, { id: 'rivale-3', after: 'tr-mamurra' }];
export function rivalHere(id: string): boolean {
  var last = -1, i = MEETS.map(function (m) { return m.id; }).indexOf(id);
  MEETS.forEach(function (m, k) { if (flag(m.after)) last = k; });
  return i >= 0 && i === last && (i === MEETS.length - 1 || !st.beaten['tr-' + id]);
}
/* at the first meeting their creatures have just hatched, and know the first moves only (as Tackle and Growl in the
   games): a fair fight, whoever has the type on his side */
const FIRST_MOVES: Partial<Record<SpeciesId, string[]>> = { polpino: ['botta', 'spruzzo'], ramarrino: ['botta', 'sole'], gabbi: ['beccata', 'strillo'] };
/** the creatures a trainer sends in, one after the other: the rival's follow the story */
export function teamOf(id: string): Trainer['team'] {
  var tr = TRAINERS[id], r = rival();
  if (!tr.rival) return tr.team;
  if (tr.rival === 1) return [{ sp: r, lv: 5, moves: FIRST_MOVES[r] }];
  if (tr.rival === 2) return [{ sp: 'cicalina', lv: 13 }, { sp: formAt(r, 2), lv: 16 }];
  /* made an enemy of him, he comes back stronger, and he has learned what Antonio has */
  var angry = tullioMood() === 'bitter', up = angry ? 2 : 0;
  return [{ sp: 'granchione', lv: 27 + up, resonate: angry }, { sp: 'civettona', lv: 28 + up, resonate: angry }, { sp: formAt(r, 3), lv: 31 + up, resonate: angry }];
}
/** a trainer as he is now: Tullio is what the player has made of him */
export function trainerNow(id: string): Trainer {
  var tr = TRAINERS[id], m = tullioMood(), over = tr.moods && m ? tr.moods[m] : null;
  return over ? Object.assign({}, tr, over) : tr;
}
/** the magic that shields a trainer's side, as it stands: Tullio has cracked it, or has told Mamurra how Antonio fights */
export function shieldNow(id: string): Trainer['shield'] {
  var s = TRAINERS[id].shield, m = tullioMood();
  return s ? { left: s.left + (m === 'ally' ? -1 : m === 'bitter' ? 1 : 0), name: s.name } : undefined;
}
/** a line of a trainer's: the rival's, with his creature and Antonio's in it */
export function trainerLine(t: string, id: string): string {
  if (!TRAINERS[id].rival) return t;
  var team = teamOf(id), r = team[team.length - 1].sp, m = mine();
  var rt = SPECIES[r].type, mt = m ? SPECIES[m].type : null, mn = m ? SPECIES[m].name : 'creatura';
  var why = mt && magicBeats(rt, mt) ? rt + ' contro ' + mt + ': il ' + rt + ' ' + MAGIC_CHART[rt].why[MAGIC_CHART[rt].beats.indexOf(mt)] + '. Contro il tuo ' + mn + ' ho il vantaggio!'
    : 'Nessuna delle tre batte il tuo ' + mn + ', e allora ho preso la più sveglia.';
  return t.replace(/\{rival\}/g, SPECIES[r].name).replace(/\{mine\}/g, mn).replace(/\{why\}/g, why);
}
