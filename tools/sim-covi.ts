/* The covi with creatures (R6 and R7 of REVISIONE.md): for each of the six protagonists, with each of the three first
   creatures, how often he wins each of the other five covi, at every place in the order (0 to 4 pins already won).
   The player's team: his first creature at the leader's level, a second one two levels below (from the third covo, a
   third one), and himself last on the bench; the leader's: his crew (story/covo-crew.ts) and himself last. Computer
   against computer, both playing the bench (smart 1): a real player does a little better.
   Use: npx tsx tools/sim-covi.ts [battles per cell, default 120] [--gap N: the player N levels below the leader] */
import { ENGINE as E, type BattleState } from '../src/battle';
import { COVI } from '../src/data/covi';
import { CHARS, type FighterId } from '../src/data/characters';
import { SPECIES, STARTERS, type SpeciesId } from '../src/data/creatures';
import { atLevel } from '../src/data/growth';
import { formAt, personKnows, withForm } from '../src/data/people';
import type { FriendId } from '../src/data/characters';
import { knownAt } from '../src/data/creatures';
import { crewAt, grownAt } from '../src/story/covo-crew';

export const HEROES: FriendId[] = ['antonio', 'costanzo', 'andrea', 'valentin', 'forchetta', 'zendavid'];
/** the second and third creature of the player's team: common ones of the first places, of three different types */
export const MATES: SpeciesId[] = ['riccetto', 'cicalina'];

function creature(sp: SpeciesId, lv: number) { const g = grownAt(sp, lv); return { id: g, stats: atLevel(SPECIES[g].stats, lv), lvl: lv, known: knownAt(g, lv) }; }
function person(id: FriendId, lv: number, last: boolean) {
  const form = formAt(id, lv);
  return { id: id, stats: withForm(atLevel((CHARS as any)[id].stats, lv), form), lvl: lv, known: personKnows(id, lv), grown: true, form: form, last: last };
}
/** one covo: the share of battles the player wins */
export function covoRate(hero: FriendId, starter: SpeciesId, covo: string, pins: number, n: number, gap = 0, tune?: number): number {
  const lv = COVI[covo].level + 3 * pins, me = lv - gap;
  const mine = [creature(starter, me), creature(MATES[0], Math.max(3, me - 2))].concat(pins >= 2 ? [creature(MATES[1], Math.max(3, me - 2))] : []);
  const crew = crewAt(covo, lv, pins, tune).map(function (c) { return creature(c.sp, c.lv); });
  const leader = COVI[covo].leader;
  let won = 0;
  for (let seed = 1; seed <= n; seed++) {
    const a = mine.map(function (x) { return Object.assign({}, x); }), b = crew.map(function (x) { return Object.assign({}, x); });
    const s: BattleState = E.newBattle({
      a: a[0].id as FighterId, b: b[0].id as FighterId, seed: seed * 7919 + pins * 31, sideA: a[0] as any, sideB: b[0] as any,
      benchA: (a.slice(1) as any[]).concat([person(hero, me, true)]), benchB: (b.slice(1) as any[]).concat([person(leader, lv, true)]), smart: [1, 1]
    } as any);
    E.intro(s);
    for (let k = 0; k < 200 && s.phase !== 'over'; k++) {
      if (s.phase === 'send') { E.sendIn(s); continue; }
      E.beginTurn(s);
      if ((s.phase as string) === 'over') break;
      const ch: Record<number, string> = {};
      E.needs(s).forEach(function (i) { ch[i] = E.ai(s, i); });
      E.playTurn(s, ch);
    }
    if (s.result === 'win' && s.winner === 0) won++;
  }
  return Math.round(100 * won / n);
}

/** the median over the protagonists who can challenge it and the three first creatures */
export function covoMedian(covo: string, pins: number, n: number, tune?: number): { med: number; min: number } {
  const r: number[] = [];
  for (const h of HEROES) if (COVI[covo].leader !== h) for (const s of STARTERS) r.push(covoRate(h, s, covo, pins, n, 0, tune));
  r.sort(function (a, b) { return a - b; });
  return { med: r[Math.floor(r.length / 2)], min: r[0] };
}
/** the crew's level change, for each covo and number of pins, whose median is nearest to TARGET */
export const TARGET = 70;
function tune(n: number) {
  const out: Record<string, number[]> = {};
  for (const c of Object.keys(COVI)) {
    out[c] = [];
    for (let p = 0; p < 5; p++) {
      let t = 0, m = covoMedian(c, p, n, t).med, bestT = t, bestD = Math.abs(m - TARGET);
      const dir = m > TARGET ? 1 : -1;
      for (let k = 0; k < 6; k++) {
        t += dir; m = covoMedian(c, p, n, t).med;
        const d = Math.abs(m - TARGET);
        if (d < bestD) { bestD = d; bestT = t; }
        if ((dir > 0 && m <= TARGET) || (dir < 0 && m >= TARGET)) break;
      }
      out[c].push(bestT);
    }
    console.log(c, JSON.stringify(out[c]));
  }
  return out;
}

const isMain = typeof process !== 'undefined' && process.argv[1] && /sim-covi/.test(process.argv[1]);
if (isMain) {
  const n = Number(process.argv.slice(2).find(function (x) { return /^\d+$/.test(x); }) || 120);
  const gi = process.argv.indexOf('--gap'), gap = gi > 0 ? Number(process.argv[gi + 1]) : 0;
  if (process.argv.indexOf('--tune') > 0) { tune(n); process.exit(0); }
  let worst = 101, best = -1, sum = 0, cells = 0;
  for (const h of HEROES) {
    console.log('\n' + h.toUpperCase() + ' (' + (CHARS as any)[h].type + ')');
    for (const st of STARTERS) {
      const row: string[] = [];
      for (const c of Object.keys(COVI)) {
        if (COVI[c].leader === h) continue;
        const r = [0, 1, 2, 3, 4].map(function (p) { return covoRate(h, st, c, p, n, gap); });
        r.forEach(function (x) { worst = Math.min(worst, x); best = Math.max(best, x); sum += x; cells++; });
        row.push(COVI[c].leader.slice(0, 4) + ' ' + r.join('/'));
      }
      console.log('  ' + st.padEnd(9) + row.join('  '));
    }
  }
  console.log('\nfrom 0 to 4 pins; worst ' + worst + '%, best ' + best + '%, mean ' + Math.round(sum / cells) + '%' + (gap ? ' (player ' + gap + ' levels below)' : ''));
}
