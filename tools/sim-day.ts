/* «Un giorno a Formia» played by the computer, over many seeds: how far a run gets, how long it is. The computer plays each
   turn with the same AI as the foes, sends in the next one and never changes: a player does better. For the rewards it
   takes the heal when the team is hurt, a new creature while the team is small, otherwise what comes first.
   npx tsx tools/sim-day.ts [runs] */
import { ENGINE as E, type BattleState } from '../src/battle';
import { alive, afterFloor, canTake, foeMember, memberOf, needsTarget, newRun, offersNow, planOf, takeOffer, type DayRun, type Offer } from '../src/day/plan';
import { DAY_FLOORS } from '../src/data/day';
import { PLACE_MAGIC } from '../src/data/scenes';

/** one floor to the end: what is left of the team, and the turns */
export function playFloor(r: DayRun): { won: boolean; left: Record<string, number>; turns: number } {
  const f = planOf(r.seed).floors[r.floor], mine = alive(r).map(memberOf), foes = f.foeList.map((x) => foeMember(x, f.stages));
  const s: BattleState = E.newBattle({ a: mine[0].id, b: foes[0].id, seed: f.seed, sideA: mine[0], sideB: foes[0], benchA: mine.slice(1), benchB: foes.slice(1), wild: f.foeList.length < 2, trainer: f.who, smart: [0, f.smart || 0], night: !!f.night, field: PLACE_MAGIC[f.scene] });
  E.intro(s);
  for (let k = 0; k < 2000 && s.phase !== 'over'; k++) {
    if (s.phase === 'begin') { E.beginTurn(s); continue; }
    if (s.phase === 'send') { const p: Record<number, number> = {}; E.sendNeeds(s).forEach((q) => { if (q.must) p[q.side] = E.benchLabels(s, q.side).filter((l) => l.ready)[0].slot; }); E.sendIn(s, p); continue; }
    const ch: Record<number, string> = {};
    E.needs(s).forEach((i) => { ch[i] = E.ai(s, i); });
    E.playTurn(s, ch);
  }
  const left: Record<string, number> = {};
  [s.sides[0]].concat(s.bench![0]).forEach((x) => { if (x.key) left[x.key] = x.hp / x.max; });
  return { won: s.result === 'win' && s.winner === 0, left, turns: s.turn };
}
export function choose(r: DayRun): { o: Offer | null; key?: string } {
  const offers = offersNow(r).filter((o) => canTake(r, o)), hurt = r.team.reduce((a, m) => a + m.hp, 0) / r.team.length < 0.6;
  const o = (hurt && offers.find((x) => x.k === 'heal')) || (r.team.length < 4 && offers.find((x) => x.k === 'mon')) || offers[0] || null;
  if (!o) return { o: null };
  return { o, key: needsTarget(o) ? alive(r).sort((a, b) => b.lv - a.lv)[0].key : undefined };
}
export function playRun(seed: number): DayRun {
  const r = newRun(seed, '');
  while (!r.over) {
    const f = playFloor(r);
    afterFloor(r, f.won, f.left, f.turns);
    if (r.picking) { const c = choose(r); takeOffer(r, c.o, c.key); }
  }
  return r;
}
if (process.argv[1] && process.argv[1].indexOf('sim-day') >= 0) {
  const n = +(process.argv[2] || 300), reached = new Array(DAY_FLOORS.length + 1).fill(0);
  let won = 0, score = 0, t0 = Date.now();
  for (let k = 1; k <= n; k++) { const r = playRun(k * 7919); reached[r.floor]++; if (r.over === 'won') won++; score += r.score; }
  console.log('Finita: ' + Math.round(100 * won / n) + '% · punti medi ' + Math.round(score / n) + ' · ' + (Date.now() - t0) + ' ms');
  console.log('Si ferma al piano: ' + reached.map((c, i) => i + ':' + Math.round(100 * c / n) + '%').join('  '));
}
