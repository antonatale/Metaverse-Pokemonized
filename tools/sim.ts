/* Balance simulator: thousands of CPU-vs-CPU battles between every pair of friends, and against the exam.
   Targets: every friend wins 45–55% overall, and no single matchup goes past about 25/75 (unless wanted).

     npm run sim                                   default numbers
     npm run sim -- --n 2000                       battles per ordered pair (default 1000)
     npm run sim -- '{"antonio":{"atk":95}}'       try a change first: stats, moves or TUNE
     npm run sim -- '{"zendavid":{"moves":{"battuta":{"chance":0.4}}},"TUNE":{"regen":4}}'

   Overrides only live in this run; to keep one, change src/data/ and re-run the golden file on purpose. */
import { CHARS, ROSTER, type CharId, type FriendId } from '../src/data/characters';
import { TUNE } from '../src/data/tuning';
import { newBattle, intro, beginTurn, playTurn } from '../src/battle';

type Override = { [k: string]: number | { [m: string]: Record<string, unknown> } };
const args = process.argv.slice(2);
let N = 1000;
const ni = args.indexOf('--n');
if (ni >= 0) { N = +args[ni + 1]; args.splice(ni, 2); }
const json = args.find((a) => a.trim().startsWith('{'));
if (json) {
  const o = JSON.parse(json) as Record<string, Override>;
  for (const [k, v] of Object.entries(o)) {
    if (k === 'TUNE') { Object.assign(TUNE, v); continue; }
    const c = CHARS[k as CharId];
    if (!c) throw new Error('unknown character ' + k);
    for (const [f, val] of Object.entries(v)) {
      if (f === 'moves') for (const [mid, mo] of Object.entries(val as Record<string, Record<string, unknown>>)) {
        const m = c.moves.find((x) => x.id === mid);
        if (!m) throw new Error(k + ' has no move ' + mid);
        Object.assign(m, mo);
      }
      else if (f in c.stats) (c.stats as unknown as Record<string, number>)[f] = val as number;
      else throw new Error('unknown field ' + k + '.' + f + ' (use hp, atk, def, spe or moves)');
    }
  }
  console.log('overrides:', json);
}

/** one battle with the computer on both sides; returns the winning side index, or null for a draw/timeout */
function battle(a: CharId, b: CharId, seed: number): { winner: number | null; turns: number } {
  const s = newBattle({ a, b, mode: 'cpu', seed });
  s.sides[0].human = false;
  intro(s);
  for (let guard = 0; s.phase !== 'over' && guard < 200; guard++) {
    if (s.phase === 'begin') beginTurn(s); else playTurn(s, {});
  }
  return { winner: s.result === 'win' ? s.winner : null, turns: s.turn };
}
const seedOf = (a: string, b: string, k: number) => {
  let h = 2166136261;
  for (const ch of a + '|' + b + '|' + k) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
};

const pct = (x: number) => (x * 100).toFixed(1).padStart(5) + '%';
const names = ROSTER.map((id) => CHARS[id].name);
const wins: Record<string, Record<string, number>> = {};
const total: Record<string, { w: number; n: number }> = {};
let draws = 0, turns = 0, games = 0;
for (const a of ROSTER) { wins[a] = {}; total[a] = { w: 0, n: 0 }; }
for (const a of ROSTER) for (const b of ROSTER) {
  if (a === b) continue;
  for (let k = 0; k < N; k++) {
    const r = battle(a, b, seedOf(a, b, k));
    games++; turns += r.turns;
    if (r.winner == null) { draws++; continue; }
    const w = r.winner === 0 ? a : b;
    wins[w][w === a ? b : a] = (wins[w][w === a ? b : a] || 0) + 1;
  }
}
for (const a of ROSTER) for (const b of ROSTER) if (a !== b) { total[a].w += wins[a][b] || 0; total[a].n += 2 * N; }

console.log('\n' + N + ' battles per ordered pair, ' + games + ' in all, ' + pct(draws / games).trim() + ' draws, ' + (turns / games).toFixed(1) + ' turns on average\n');
console.log('Overall (target 45–55%)');
for (const a of ROSTER) {
  const r = total[a].w / total[a].n;
  console.log('  ' + CHARS[a].name.padEnd(10) + pct(r) + (r < 0.45 || r > 0.55 ? '   ← out of range' : ''));
}
console.log('\nMatchups: row beats column (both seats); ← past 25/75');
console.log('  ' + ''.padEnd(10) + names.map((n) => n.slice(0, 9).padStart(10)).join(''));
const far: string[] = [];
for (const a of ROSTER) {
  let row = '  ' + CHARS[a].name.padEnd(10);
  for (const b of ROSTER) {
    if (a === b) { row += '—'.padStart(10); continue; }
    const r = (wins[a][b] || 0) / (2 * N);
    row += pct(r).padStart(10);
    if (r > 0.75) far.push(CHARS[a].name + ' vs ' + CHARS[b].name + ' ' + pct(r).trim());
  }
  console.log(row);
}
if (far.length) console.log('\n  ← ' + Array.from(new Set(far)).join(', '));

console.log('\nAgainst the exam');
for (const a of ROSTER as FriendId[]) {
  let w = 0, time = 0;
  for (let k = 0; k < N; k++) {
    const s = newBattle({ a, b: 'esame', mode: 'cpu', seed: seedOf(a, 'esame', k) });
    s.sides[0].human = false;
    intro(s);
    for (let guard = 0; s.phase !== 'over' && guard < 200; guard++) { if (s.phase === 'begin') beginTurn(s); else playTurn(s, {}); }
    if (s.result === 'win' && s.winner === 0) w++;
    if (s.result === 'time') time++;
  }
  console.log('  ' + CHARS[a].name.padEnd(10) + pct(w / N) + ' passed,' + pct(time / N) + ' out of time');
}
