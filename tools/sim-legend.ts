/* A legend against a whole team: Antonio's creatures one after the other, the legend keeping the HP it has left, as in
   the story. How often the legend falls, and how much of it is left when it does not.
   npx tsx tools/sim-legend.ts giano:36 gabbiammiraglio:36,muraglione:34,polpastro:34,granchione:30,civettona:30,riccione:28 */
import { ENGINE as E, type BattleState } from '../src/battle';
import { SPECIES, knownAt, type SpeciesId } from '../src/data/creatures';
import type { FighterId } from '../src/data/characters';
import { atLevel } from '../src/data/growth';
const [foe, flv] = process.argv[2].split(':'), team = process.argv[3].split(',').map((x: string) => x.split(':'));
let falls = 0, left = 0; const n = 200;
for (let seed = 1; seed <= n; seed++) {
  let hp: number | undefined;
  let max = 0;
  for (const [id, lv] of team) {
    const s: BattleState = E.newBattle({ a: id as FighterId, b: foe as FighterId, seed: seed * 7919 + +lv, sideA: { stats: atLevel(SPECIES[id as SpeciesId].stats, +lv), lvl: +lv, known: knownAt(id as SpeciesId, +lv) }, sideB: { stats: atLevel(SPECIES[foe as SpeciesId].stats, +flv), lvl: +flv, known: knownAt(foe as SpeciesId, +flv), hp } });
    E.intro(s);
    for (let k = 0; k < 120 && s.phase !== 'over'; k++) { E.beginTurn(s); const ch: Record<number, string> = {}; E.needs(s).forEach((i) => { ch[i] = E.ai(s, i); }); E.playTurn(s, ch); }
    hp = s.sides[1].hp; max = s.sides[1].max;
    if (hp <= 0) break;
  }
  if ((hp || 0) <= 0) falls++; else left += (hp || 0) / max;
}
console.log(foe + ' Lv' + flv + ': beaten by the team ' + Math.round(100 * falls / n) + '% of the time; when not, ' + Math.round(100 * left / Math.max(1, n - falls)) + '% HP left');
