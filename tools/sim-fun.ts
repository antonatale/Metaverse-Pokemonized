/* How fun are the creature duels? Two measures, computer against computer, same species and level on both sides
   (BRIEFING-IDEE.md §3 explains them; §4 has the targets printed at the end).
     npx tsx tools/sim-fun.ts              both reports
     npx tsx tools/sim-fun.ts types        how much the type edge decides a duel (MAGIC_TUNE swept, then put back)
     npx tsx tools/sim-fun.ts depth        how deep the choices inside a turn are
     npx tsx tools/sim-fun.ts team         teams of three: what playing the bench is worth
     npx tsx tools/sim-fun.ts all 500      all of them, with 500 duels per cell (300 by default; the noise is about ±3 points) */
import { ENGINE as E, type BattleState, type Member } from '../src/battle';
import { SPECIES, knownAt, type SpeciesId } from '../src/data/creatures';
import { atLevel } from '../src/data/growth';
import { MAGIC_TUNE } from '../src/data/tuning';

function side(id: SpeciesId, lv: number) {
  return { stats: atLevel(SPECIES[id].stats, lv), lvl: lv, known: knownAt(id, lv) };
}
/** what one side plays this turn */
type Policy = (s: BattleState, i: number) => string;
const ai: Policy = (s, i) => E.ai(s, i);
/** the attack with the best power × accuracy × type effect; never heals or buffs */
const greedy: Policy = (s, i) => {
  let best = '', top = -1;
  for (const id of E.available(s, i)) {
    const l = E.moveLabel(s, i, id);
    if (l.kind !== 'atk' || l.power == null) continue;
    const sc = l.power * (l.acc || 1) * (l.eff || 1);
    if (sc > top) { top = sc; best = id; }
  }
  return best || E.ai(s, i);
};
/** any available move, picked from the battle's own seed so it is repeatable */
const anything: Policy = (s, i) => { const av = E.available(s, i); return av[(s.rng * 9301 + s.turn * 49297 + i * 233) % av.length | 0] || av[0]; };

interface Duel { win: number; turns: number; same: number }
/** n seeded duels of a (side 0, played by pa) against b (side 1, the game's AI); `same` is how often that AI picks what greedy would */
function duel(a: SpeciesId, la: number, b: SpeciesId, lb: number, pa: Policy, pb: Policy, n: number): Duel {
  let won = 0, turns = 0, same = 0, picks = 0;
  for (let seed = 1; seed <= n; seed++) {
    const s: BattleState = E.newBattle({ a, b, seed: seed * 7919, sideA: side(a, la), sideB: side(b, lb), smart: [2, 2] });
    E.intro(s);
    for (let k = 0; k < 120 && s.phase !== 'over'; k++) {
      E.beginTurn(s);
      /* only the sides the engine asks about choose: side 1 plays the plan the game's own AI made in beginTurn (as in sim-story.ts) */
      const ch: Record<number, string> = {};
      E.needs(s).forEach((i) => { ch[i] = (i === 0 ? pa : pb)(s, i); });
      if (pb === ai && s.plan[1]) {
        /* looking must not change the battle: greedy asks, then the seed is put back */
        const seed0 = s.rng, g = greedy(s, 1);
        s.rng = seed0;
        picks++; if (s.plan[1] === g) same++;
      }
      E.playTurn(s, ch);
      turns++;
    }
    if (s.result === 'win' && s.winner === 0) won++;
  }
  return { win: Math.round(100 * won / n), turns: +(turns / n).toFixed(1), same: picks ? Math.round(100 * same / picks) : 0 };
}

/* ---------- 1. the type edge ---------- */
/** [A, B, level]: A has the type edge, except the neutral pairs at the end */
const EDGES: [SpeciesId, SpeciesId, number][] = [
  ['gabbi', 'polpino', 10], ['olivella', 'ramarrino', 10], ['gabbianotto', 'polpetto', 20], ['ramarrone', 'gabbianotto', 20]
];
const NEUTRAL: [SpeciesId, SpeciesId, number][] = [['polpino', 'ramarrino', 10], ['olivella', 'civettina', 10]];
const TUNES: [number, number][] = [[1, 1], [MAGIC_TUNE.se, MAGIC_TUNE.nve], [1.3, 0.77], [1.5, 0.67], [2, 0.5]];

export function typeReport(n = 300): number {
  const keep = { se: MAGIC_TUNE.se, nve: MAGIC_TUNE.nve };
  const cell = (a: SpeciesId, b: SpeciesId, lv: number, t: [number, number]) => { MAGIC_TUNE.se = t[0]; MAGIC_TUNE.nve = t[1]; return duel(a, lv, b, lv, ai, ai, n).win; };
  let edgeNow = 0;
  try {
    console.log('Vittorie di A (%), IA contro IA, ' + n + ' duelli per cella. Colonne: moltiplicatore di tipo (vantaggio / svantaggio); «senza» = 1 / 1.');
    console.log('coppia'.padEnd(36) + TUNES.map(([se, nve]) => (se === 1 ? 'senza' : se + '/' + nve) + (se === keep.se && nve === keep.nve ? '*' : '')).map((x) => x.padStart(10)).join(''));
    for (const [a, b, lv] of EDGES.concat(NEUTRAL)) {
      const row = TUNES.map((t) => cell(a, b, lv, t));
      if (EDGES.some((e) => e[0] === a && e[1] === b)) edgeNow += row[TUNES.findIndex((t) => t[0] === keep.se && t[1] === keep.nve)];
      console.log((SPECIES[a].name + ' ' + lv + ' contro ' + SPECIES[b].name + ' ' + lv + (NEUTRAL.some((e) => e[0] === a) ? ' (pari)' : '')).padEnd(36) + row.map((x) => String(x).padStart(10)).join(''));
    }
  } finally { MAGIC_TUNE.se = keep.se; MAGIC_TUNE.nve = keep.nve; }
  return Math.round(edgeNow / EDGES.length);
}

/* ---------- 2. the depth of a turn ---------- */
const LIST: [SpeciesId, number][] = [
  ['polpino', 10], ['ramarrino', 10], ['gabbi', 10], ['cicalina', 10], ['olivella', 10], ['riccetto', 10], ['granchietto', 10], ['civettina', 10],
  ['polpetto', 20], ['ramarrone', 20], ['gabbianotto', 20], ['olivastro', 20], ['riccione', 20], ['granchione', 20], ['civettona', 20],
  ['polpastro', 30], ['muraglione', 30], ['gabbiammiraglio', 30]
];
export function depthReport(n = 300): { greedy: number; turns: number; same: number } {
  console.log('Duelli speculari (stessa specie e livello), ' + n + ' per riga. A gioca la regola indicata, B è l\'IA del gioco.');
  console.log('specie'.padEnd(22) + 'IA-IA'.padStart(8) + 'greedy'.padStart(9) + 'a caso'.padStart(9) + 'IA=greedy'.padStart(11) + 'turni'.padStart(8));
  let sg = 0, st = 0, ss = 0, sb = 0, sr = 0, wide = 0;
  for (const [id, lv] of LIST) {
    const base = duel(id, lv, id, lv, ai, ai, n), g = duel(id, lv, id, lv, greedy, ai, n), r = duel(id, lv, id, lv, anything, ai, n);
    sb += base.win; sg += g.win; sr += r.win; ss += g.same; st += g.turns;
    if (g.win >= 47) wide++;
    console.log((SPECIES[id].name + ' ' + lv).padEnd(22) + (base.win + '%').padStart(8) + (g.win + '%').padStart(9) + (r.win + '%').padStart(9) + (g.same + '%').padStart(11) + String(g.turns).padStart(8));
  }
  const k = LIST.length;
  console.log('MEDIA'.padEnd(22) + (Math.round(sb / k) + '%').padStart(8) + (Math.round(sg / k) + '%').padStart(9) + (Math.round(sr / k) + '%').padStart(9) + (Math.round(ss / k) + '%').padStart(11) + (st / k).toFixed(1).padStart(8));
  console.log('«greedy» regge l\'IA (47% o più) in ' + wide + ' specie su ' + k + '.');
  return { greedy: Math.round(sg / k), turns: +(st / k).toFixed(1), same: Math.round(ss / k) };
}

/* ---------- 3. what a bench is worth ---------- */
const POOLS: [number, SpeciesId[]][] = [
  [10, ['polpino', 'ramarrino', 'gabbi', 'cicalina', 'olivella', 'riccetto', 'granchietto', 'civettina']],
  [20, ['polpetto', 'ramarrone', 'gabbianotto', 'cicalona', 'olivastro', 'riccione', 'granchione', 'civettona']],
  [30, ['polpastro', 'muraglione', 'gabbiammiraglio', 'cicalona', 'olivastro', 'riccione', 'granchione', 'civettona']]
];
/** three different creatures, from a little seeded dice of its own */
function threeOf(pool: SpeciesId[], lv: number, n: number): Member[] {
  const left = pool.slice(), out: Member[] = [];
  let x = (n * 2654435761) >>> 0;
  for (let k = 0; k < 3; k++) {
    x = (x * 1664525 + 1013904223) >>> 0;
    const id = left.splice((x >>> 8) % left.length, 1)[0];
    out.push({ id, key: 'k' + k, ...side(id, lv) });
  }
  return out;
}
/** a whole team battle, computer against computer, each playing as well as `smart` says */
function teamBattle(a: Member[], b: Member[], smart: [number, number], budget: number, seed: number): { won: boolean; turns: number; changes: number } {
  const s: BattleState = E.newBattle({ a: a[0].id, b: b[0].id, seed, sideA: a[0], sideB: b[0], benchA: a.slice(1), benchB: b.slice(1), smart });
  s.sides[0].human = false; s.bench![0].forEach((x) => { x.human = false; });
  s.swaps = [budget, smart[1]];
  E.intro(s);
  for (let k = 0; k < 800 && s.phase !== 'over'; k++) {
    if (s.phase === 'begin') E.beginTurn(s);
    else if (s.phase === 'send') E.sendIn(s);
    else E.playTurn(s, {});
  }
  return { won: s.result === 'win' && s.winner === 0, turns: s.turn, changes: budget - s.swaps[0] };
}
/** how often a side that plays its bench (`good`, with `budget` changes) beats one that sends its team in order and never
    changes: each pair of teams both ways round */
function worth(good: number, budget: number, n: number) {
  let won = 0, played = 0, turns = 0, changes = 0;
  for (const [lv, pool] of POOLS) for (let k = 1; k <= n; k++) {
    const t1 = threeOf(pool, lv, k * 2 + lv), t2 = threeOf(pool, lv, k * 2 + 1 + lv);
    for (const [x, y] of [[t1, t2], [t2, t1]]) {
      const r = teamBattle(x, y, [good, 0], budget, (k * 7919 + lv) >>> 0);
      played++; if (r.won) won++;
      turns += r.turns; changes += r.changes;
    }
  }
  return { win: Math.round(100 * won / played), turns: +(turns / played).toFixed(1), changes: +(changes / played).toFixed(1) };
}
export function teamReport(n = 300): number {
  const m = Math.ceil(n / 3);
  console.log('Squadre di tre a caso, livelli 10, 20 e 30, ogni coppia giocata nei due sensi. A gioca come dice la riga, B segue l\'ordine della squadra e non cambia mai.');
  console.log('A'.padEnd(46) + 'vince'.padStart(8) + 'turni'.padStart(8) + 'cambi'.padStart(8));
  const row = (name: string, r: { win: number; turns: number; changes: number }) => { console.log(name.padEnd(46) + (r.win + '%').padStart(8) + String(r.turns).padStart(8) + String(r.changes).padStart(8)); return r.win; };
  row('come B', worth(0, 0, m));
  row('sceglie chi mandare dopo un KO', worth(1, 0, m));
  row('e cambia una volta (smart 1)', worth(1, 1, m));
  row('e cambia due volte (smart 2)', worth(2, 2, m));
  return row('e cambia quando conviene', worth(2, 9, m));
}

/* ---------- the targets of BRIEFING-IDEE.md §4 ---------- */
function targets(edge: number | null, d: { greedy: number; turns: number } | null, bench: number | null) {
  const mark = (ok: boolean) => (ok ? '  ok ' : '  da fare ');
  console.log('\nObiettivi del briefing (§4):');
  if (d) {
    console.log(mark(d.turns >= 8 && d.turns <= 10) + 'turni medi per duello 8–10: oggi ' + d.turns);
    console.log(mark(d.greedy <= 35) + '«greedy» contro IA al massimo 35%: oggi ' + d.greedy + '%');
  }
  if (edge != null) console.log(mark(edge >= 70 && edge <= 85) + 'vantaggio di tipo a pari livello 70–85%: oggi ' + edge + '%');
  if (bench != null) console.log(mark(bench >= 55) + 'giocare la panchina deve pagare, almeno 55% contro chi non la gioca: oggi ' + bench + '%');
}

if (process.argv[1] && process.argv[1].indexOf('sim-fun') >= 0) {
  const args = process.argv.slice(2), which = /^\d+$/.test(args[0] || '') ? 'all' : args[0] || 'all';
  const n = +(args.find((x) => /^\d+$/.test(x)) || 300);
  if (which !== 'all' && which !== 'types' && which !== 'depth' && which !== 'team') { console.log('uso: tools/sim-fun.ts [types|depth|team|all] [duelli per cella]'); process.exit(1); }
  const edge = which === 'all' || which === 'types' ? typeReport(n) : null;
  if (which === 'all') console.log('');
  const d = which === 'all' || which === 'depth' ? depthReport(n) : null;
  if (which === 'all') console.log('');
  const bench = which === 'all' || which === 'team' ? teamReport(n) : null;
  targets(edge, d, bench);
}
