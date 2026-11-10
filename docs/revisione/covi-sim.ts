/* Revisione del 10 novembre 2026 (REVISIONE.md, punto C e task R6): i cinque covi per ognuno dei sei protagonisti.
   Per ogni protagonista sceglie a ogni passo il capo che batte più spesso, al livello che quel covo avrebbe
   (6, 9, 12, 15, 18), e dice da che livello arriverebbe al 60%. IA contro IA, 300 lotte per cella.
   Uso: npx tsx docs/revisione/covi-sim.ts */
import { ENGINE as E, type BattleState } from '../../src/battle';
import { CHARS, type FighterId } from '../../src/data/characters';
import { atLevel, toNext, xpFor } from '../../src/data/growth';
import { formAt, personKnows, withForm } from '../../src/data/people';
const F = ['antonio', 'costanzo', 'andrea', 'valentin', 'forchetta', 'zendavid'];
function side(id: string, lv: number) { const base = atLevel((CHARS as any)[id].stats, lv); const form = formAt(id as any, lv); return { stats: withForm(base, form), lvl: lv, known: personKnows(id as any, lv), grown: true, form }; }
function wr(a: string, la: number, b: string, lb: number, n = 300) {
  let won = 0;
  for (let seed = 1; seed <= n; seed++) {
    const s: BattleState = E.newBattle({ a: a as FighterId, b: b as FighterId, seed: seed * 7919, sideA: side(a, la) as any, sideB: side(b, lb) as any });
    E.intro(s);
    for (let k = 0; k < 120 && s.phase !== 'over'; k++) { E.beginTurn(s); const ch: Record<number, string> = {}; E.needs(s).forEach((i) => { ch[i] = E.ai(s, i); }); E.playTurn(s, ch); }
    if (s.result === 'win' && s.winner === 0) won++;
  }
  return Math.round(100 * won / n);
}
console.log('types:', F.map((f) => f + '=' + (CHARS as any)[f].type).join(' '));
console.log('moves known at 5:', F.map((f) => f + ':' + personKnows(f as any, 5).join('/')).join('  '));
for (const h of F) {
  let lv = 5, xp = 0; const left = F.filter((x) => x !== h); const path: string[] = [];
  for (let k = 0; k < 5; k++) {
    const foeLv = 6 + 3 * k;
    const rates = left.map((f) => [f, wr(h, lv, f, foeLv)] as [string, number]).sort((a, b) => b[1] - a[1]);
    const [f, r] = rates[0];
    // level needed for 60% against the best pick
    let need = lv; while (need < 40 && wr(h, need, f, foeLv, 120) < 60) need++;
    path.push(`${k + 1}) ${f} L${foeLv}: ${r}% a L${lv}` + (need > lv ? ` (60% da L${need})` : '') + ` [altri: ${rates.slice(1).map((x) => x[0].slice(0, 3) + ' ' + x[1]).join(', ')}]`);
    left.splice(left.indexOf(f), 1);
    lv = Math.max(lv, need); xp += xpFor(foeLv, true, true); while (xp >= toNext(lv)) { xp -= toNext(lv); lv++; }
  }
  console.log('\n' + h.toUpperCase() + '\n  ' + path.join('\n  '));
}
