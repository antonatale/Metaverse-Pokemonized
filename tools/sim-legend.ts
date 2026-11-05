/* A legend against a whole team, in one battle as in the story: the team on the bench, played by the computer, who sends
   the next one in and never changes (a player can do better). How often the legend falls, and how much of it is left when
   it does not.
   npx tsx tools/sim-legend.ts giano:36 gabbiammiraglio:36,muraglione:34,polpastro:34,granchione:30,civettona:30,riccione:28 */
import { ENGINE as E, type BattleState, type Member } from '../src/battle';
import { SPECIES, knownAt, type SpeciesId } from '../src/data/creatures';
import type { FighterId } from '../src/data/characters';
import { atLevel } from '../src/data/growth';
import { LEGENDS } from '../src/data/legends';
const [foe, flv] = process.argv[2].split(':'), team = process.argv[3].split(',').map((x: string) => x.split(':'));
let falls = 0, left = 0, sent = 0, turns = 0, reached = 0; const n = 200;
const member = (id: string, lv: number, key: string): Member => ({ id: id as FighterId, key, stats: atLevel(SPECIES[id as SpeciesId].stats, lv), lvl: lv, known: knownAt(id as SpeciesId, lv) });
const mine = team.map(([id, lv]: string[], k: number) => member(id, +lv, 'k' + k)), boss: Member = { ...member(foe, +flv, 'f0'), stages: Object.values(LEGENDS).find((l) => l.sp === foe)?.stages };
for (let seed = 1; seed <= n; seed++) {
  const s: BattleState = E.newBattle({ a: mine[0].id, b: boss.id, seed: seed * 7919, sideA: mine[0], sideB: boss, benchA: mine.slice(1), bag: {} });
  E.intro(s);
  for (let k = 0; k < 900 && s.phase !== 'over'; k++) {
    if (s.phase === 'begin') { E.beginTurn(s); continue; }
    if (s.phase === 'send') { const p: Record<number, number> = {}; E.sendNeeds(s).forEach((q) => { if (q.must) { p[q.side] = E.benchLabels(s, q.side).filter((l) => l.ready)[0].slot; sent++; } }); E.sendIn(s, p); continue; }
    const ch: Record<number, string> = {};
    E.needs(s).forEach((i) => { ch[i] = E.ai(s, i); });
    E.playTurn(s, ch);
  }
  turns += s.turn; reached += (s.sides[1].stage || 0) + 1;
  if (s.result === 'win' && s.winner === 0) falls++; else left += s.sides[1].hp / s.sides[1].max;
}
console.log(foe + ' Lv' + flv + ': beaten by the team ' + Math.round(100 * falls / n) + '% of the time; when not, ' + Math.round(100 * left / Math.max(1, n - falls)) + '% of it is left; ' + (sent / n).toFixed(1) + ' of the team fall in a battle, ' + (turns / n).toFixed(0) + ' turns, part ' + (reached / n).toFixed(1) + ' reached');
