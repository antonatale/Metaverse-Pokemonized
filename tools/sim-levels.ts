/* How much a level counts (data/tuning.ts, LEVEL_TUNE): the covi with creatures, the player's team some levels above or
   below the covo (as in tools/sim-covi.ts), with the level factor at a few strengths. For each: the share of battles won
   and how many turns a battle lasts, over the six protagonists and the three first creatures.
   Use: npx tsx tools/sim-levels.ts [battles per cell, default 20] [per values, default 0,0.04,0.05,0.06] */
import { ENGINE as E, type BattleState } from '../src/battle';
import { COVI } from '../src/data/covi';
import { CHARS, type FighterId, type FriendId } from '../src/data/characters';
import { SPECIES, STARTERS, knownAt, type SpeciesId } from '../src/data/creatures';
import { atLevel } from '../src/data/growth';
import { formAt, personKnows, withForm } from '../src/data/people';
import { LEVEL_TUNE } from '../src/data/tuning';
import { crewAt, grownAt } from '../src/story/covo-crew';
import { HEROES, MATES } from './sim-covi';

function creature(sp: SpeciesId, lv: number) { const g = grownAt(sp, lv); return { id: g, stats: atLevel(SPECIES[g].stats, lv), lvl: lv, known: knownAt(g, lv) }; }
function person(id: FriendId, lv: number) {
  const form = formAt(id, lv);
  return { id: id, stats: withForm(atLevel((CHARS as any)[id].stats, lv), form), lvl: lv, known: personKnows(id, lv), grown: true, form: form, last: true };
}
/** one battle: won, and its turns */
function covoBattle(hero: FriendId, starter: SpeciesId, covo: string, pins: number, gap: number, seed: number): { won: boolean; turns: number } {
  const lv = COVI[covo].level + 3 * pins, me = Math.max(5, lv + gap);
  const mine = [creature(starter, me), creature(MATES[0], Math.max(3, me - 2))].concat(pins >= 2 ? [creature(MATES[1], Math.max(3, me - 2))] : []);
  const crew = crewAt(covo, lv, pins).map(function (c) { return creature(c.sp, c.lv); });
  const s: BattleState = E.newBattle({
    a: mine[0].id as FighterId, b: crew[0].id as FighterId, seed: seed, sideA: mine[0] as any, sideB: crew[0] as any,
    benchA: (mine.slice(1) as any[]).concat([person(hero, me)]), benchB: (crew.slice(1) as any[]).concat([person(COVI[covo].leader as FriendId, lv)]), smart: [1, 1]
  } as any);
  E.intro(s);
  for (let k = 0; k < 300 && s.phase !== 'over'; k++) {
    if (s.phase === 'send') { E.sendIn(s); continue; }
    E.beginTurn(s);
    if ((s.phase as string) === 'over') break;
    const ch: Record<number, string> = {};
    E.needs(s).forEach(function (i) { ch[i] = E.ai(s, i); });
    E.playTurn(s, ch);
  }
  return { won: s.result === 'win' && s.winner === 0, turns: s.turn };
}
/** a wild creature of the grass at a level, against the first creature alone */
function wildBattle(starter: SpeciesId, wild: SpeciesId, lv: number, gap: number, seed: number): { won: boolean; turns: number } {
  const a = creature(starter, lv + gap), b = creature(wild, lv);
  const s: BattleState = E.newBattle({ a: a.id as FighterId, b: b.id as FighterId, seed: seed, sideA: a as any, sideB: b as any, smart: [1, 0] } as any);
  E.intro(s);
  for (let k = 0; k < 200 && s.phase !== 'over'; k++) {
    if (s.phase === 'send') { E.sendIn(s); continue; }
    E.beginTurn(s);
    if ((s.phase as string) === 'over') break;
    const ch: Record<number, string> = {};
    E.needs(s).forEach(function (i) { ch[i] = E.ai(s, i); });
    E.playTurn(s, ch);
  }
  return { won: s.result === 'win' && s.winner === 0, turns: s.turn };
}

const N = +(process.argv[2] || 20);
const PERS = (process.argv[3] || '0,0.04,0.05,0.06').split(',').map(Number);
const GAPS = [-6, -3, 0, 3, 6, 10];
const CASES: [string, number][] = [['piazza', 0], ['eclipse', 1], ['circolo', 2], ['pineta', 3]];
const covi = CASES.filter(function (c) { return COVI[c[0]]; });
console.log('covi:', covi.map(function (c) { return c[0] + '+' + c[1]; }).join(', '), '· battles per cell', N);
for (const per of PERS) {
  LEVEL_TUNE.per = per;
  const row: string[] = [];
  for (const gap of GAPS) {
    let won = 0, turns = 0, n = 0;
    for (const [cv, pins] of covi) for (const h of HEROES) if (COVI[cv].leader !== h) for (const sp of STARTERS) for (let k = 1; k <= N; k++) {
      const r = covoBattle(h, sp, cv, pins, gap, k * 7919 + pins * 31 + gap * 101);
      won += r.won ? 1 : 0; turns += r.turns; n++;
    }
    row.push((gap > 0 ? '+' : '') + gap + ': ' + Math.round(100 * won / n) + '% ' + (turns / n).toFixed(1) + 't');
  }
  const wild: string[] = [];
  for (const gap of [-3, 0, 3, 6, 10]) {
    let won = 0, turns = 0, n = 0;
    for (const sp of STARTERS) for (const w of ['riccetto', 'cicalina', 'granchietto', 'olivella'] as SpeciesId[]) if (SPECIES[w]) for (let k = 1; k <= N; k++) {
      const r = wildBattle(sp, w, 10, gap, k * 131 + gap * 7); won += r.won ? 1 : 0; turns += r.turns; n++;
    }
    wild.push((gap > 0 ? '+' : '') + gap + ': ' + Math.round(100 * won / n) + '% ' + (turns / n).toFixed(1) + 't');
  }
  console.log('per ' + per.toFixed(2) + ' · covi  ' + row.join('  ·  '));
  console.log('          · wild  ' + wild.join('  ·  '));
}
