/* After losing twice to the same trainer or covo, Cicero says something the player can act on (ui/story-screen.ts):
   which type beats the foe's, who of the player's creatures has it (in the team, or at home), or where such creatures
   live; and whether the foe is above the team's level. Only words: nothing changes in the battle. */
import { SPECIES, type SpeciesId } from '../data/creatures';
import { HIDINGS } from '../data/encounters';
import { beatersOf, type TypeName } from '../data/types';

export interface Mine { name: string; sp: SpeciesId; lv: number; home: boolean }

/** the type the foes have most, counting each creature's types (a keeper's own type counts once more) */
export function mainType(types: TypeName[]): TypeName | null {
  var n: Partial<Record<TypeName, number>> = {}, best: TypeName | null = null;
  types.forEach(function (t) { n[t] = (n[t] || 0) + 1; if (!best || n[t]! > n[best]!) best = t; });
  return best;
}
function typesOf(sp: SpeciesId): TypeName[] { var s = SPECIES[sp]; return [s.type].concat(s.type2 ? [s.type2] : []) as TypeName[]; }
/** the hiding places where a creature of one of these types can be met, by name */
export function whereTypes(types: TypeName[]): string[] {
  var out: string[] = [];
  Object.keys(HIDINGS).forEach(function (id) {
    var h = HIDINGS[id], all = h.day.concat(h.night || []);
    if (all.some(function (m) { return typesOf(m.sp).some(function (t) { return types.indexOf(t) >= 0; }); }) && out.indexOf(h.name) < 0) out.push(h.name);
  });
  return out;
}
/** what Cicero says: the type to bring, who has it, and the levels */
export function lossAdvice(foeTypes: TypeName[], foeLv: number, mine: Mine[]): string[] {
  var main = mainType(foeTypes), out: string[] = [];
  if (main) {
    var good = beatersOf(main), list = good.join(' o ');
    var have = mine.filter(function (m) { return typesOf(m.sp).some(function (t) { return good.indexOf(t) >= 0; }); }).sort(function (a, b) { return b.lv - a.lv; });
    var out1 = 'Qui le creature sono soprattutto ' + main + ': le batte la magia ' + list + '.';
    if (have.length && !have[0].home) out.push(out1 + ' Tu hai ' + have[0].name + ': mandala in campo per prima, quando ti chiedono chi mandi.');
    else if (have.length) out.push(out1 + ' ' + have[0].name + ' ce l\'hai a casa: passa a prenderla nel tuo appartamento.');
    else {
      var where = whereTypes(good).slice(0, 3);
      out.push(out1 + (where.length ? ' Creature così si trovano qui: ' + where.join(', ') + '.' : ''));
    }
  }
  var top = mine.filter(function (m) { return !m.home; }).reduce(function (a, m) { return Math.max(a, m.lv); }, 0);
  if (top && top < foeLv) out.push('E sono al livello ' + foeLv + ', le tue al massimo al ' + top + ': qualche lotta nell\'erba alta prima di riprovare.');
  return out;
}
