/* Story balance: how often a fighter at a level beats a foe at a level, both played by the computer.
   npx tsx tools/sim-story.ts                      the usual matchups of the story
   npx tsx tools/sim-story.ts polpino:8 forchetta:9  one matchup (a fighter id or a creature, and its level) */
import { ENGINE as E, type BattleState } from '../src/battle';
import { SPECIES, knownAt, isSpecies } from '../src/data/creatures';
import { CHARS, type FighterId } from '../src/data/characters';
import { atLevel } from '../src/data/growth';

function side(id: string, lv: number) {
  return isSpecies(id) ? { stats: atLevel(SPECIES[id].stats, lv), lvl: lv, known: knownAt(id, lv) } : { stats: atLevel(CHARS[id as keyof typeof CHARS].stats, lv), lvl: lv };
}
export function winRate(a: string, la: number, b: string, lb: number, n = 400): number {
  let won = 0;
  for (let seed = 1; seed <= n; seed++) {
    const s: BattleState = E.newBattle({ a: a as FighterId, b: b as FighterId, seed: seed * 7919, sideA: side(a, la), sideB: side(b, lb) });
    E.intro(s);
    for (let k = 0; k < 120 && s.phase !== 'over'; k++) {
      E.beginTurn(s);
      const ch: Record<number, string> = {};
      E.needs(s).forEach((i) => { ch[i] = E.ai(s, i); });
      E.playTurn(s, ch);
    }
    if (s.result === 'win' && s.winner === 0) won++;
  }
  return Math.round(100 * won / n);
}
const args = process.argv.slice(2);
if (process.argv[1] && process.argv[1].indexOf('sim-story') >= 0 && args.length === 2) {
  const [a, la] = args[0].split(':'), [b, lb] = args[1].split(':');
  console.log(a + ' Lv' + la + ' vs ' + b + ' Lv' + lb + ': ' + winRate(a, +la, b, +lb) + '%');
} else if (process.argv[1] && process.argv[1].indexOf('sim-story') >= 0) {
  const rows: [string, number, string, number][] = [
    ['polpino', 5, 'riccetto', 4], ['ramarrino', 5, 'riccetto', 4], ['gabbi', 5, 'riccetto', 4], ['antonio', 5, 'cicalina', 3],
    ['polpino', 5, 'cicalina', 3], ['gabbi', 6, 'granchietto', 7], ['polpino', 7, 'olivella', 8], ['ramarrino', 9, 'civettina', 11],
    ['antonio', 5, 'costanzo', 6], ['polpino', 6, 'costanzo', 6], ['antonio', 8, 'forchetta', 9], ['polpino', 9, 'forchetta', 9], ['gabbi', 9, 'forchetta', 9], ['ramarrino', 9, 'forchetta', 9],
    ['polpino', 6, 'olivella', 6], ['polpino', 7, 'cicalina', 7], ['polpetto', 15, 'riccione', 17], ['polpetto', 18, 'civettona', 19],
    ['polpastro', 30, 'muraglione', 28], ['muraglione', 30, 'granchione', 24]
  ];
  for (const [a, la, b, lb] of rows) console.log((a + ' Lv' + la).padEnd(16) + ' vs ' + (b + ' Lv' + lb).padEnd(16) + winRate(a, la, b, lb) + '%');
}
