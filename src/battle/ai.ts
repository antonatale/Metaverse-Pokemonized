import { TUNE } from '../data/tuning';
import type { BattleState } from './types';
import { rand } from './rng';
import { ch, mv, eff, available, hasMod, personaOn, zenOn } from './state';
import { expected } from './damage';

/* ---------- the computer's choice ---------- */
export function ai(s: BattleState, i: number): string {
  const me = s.sides[i], foe = s.sides[1 - i], opts = available(s, i);
  if (!opts.length) return ch(me).moves[0].id;
  if (me.id === 'esame') return planEsame(s, i, opts);
  let best: string | null = null, bestSc = -1e9;
  const hpF = me.hp / me.max, foeHp = foe.hp;
  opts.forEach(function (id) {
    const m = mv(me, id)!;
    let sc = 0;
    if (m.kind === 'atk') {
      sc = expected(s, i, id);
      if (expected(s, i, id) * (m.twoTurn ? 1.8 : 1) >= foeHp * 0.95 && !m.twoTurn) sc += 30;
      if (m.risk) sc -= 6;
      if (id === 'america' && me.lv < 2) sc += 6;
      if (id === 'diagnosi' && !hasMod(s, foe, 'defDown')) sc += 5;
      if (id === 'abbaia' && !hasMod(s, foe, 'atkDown')) sc += 8;
      if (id === 'weee') sc += foe.conf ? 0 : 2;
      if (m.fx && m.fx.foe && !hasMod(s, foe, m.fx.foe)) sc += 5;
      if (m.fx && m.fx.conf && !foe.conf) sc += 6 * m.fx.conf;
    } else if (id === 'tiella') sc = Math.min(40, me.max - me.hp) * (hpF < 0.45 ? 1.25 : 0.3);
    else if (id === 'retino' || id === 'retino2') sc = 0;
    else if (m.fx) {
      /* a creature: heal when low, raise or drop once, confuse when it is not */
      const missing = me.max - me.hp, fx = m.fx;
      if (fx.heal) sc = Math.min(me.max * fx.heal, missing) * (hpF < 0.45 ? 1.25 : 0.35);
      if (fx.self) sc += hasMod(s, me, fx.self) ? -10 : fx.self === 'atkUp' ? (foeHp > 45 && hpF > 0.4 ? 18 : 4) : (hpF > 0.4 ? 12 : 4);
      if (fx.foe) sc += hasMod(s, foe, fx.foe) ? -10 : (foeHp > 35 ? 14 : 5);
      if (fx.conf) sc += foe.conf ? -10 : (foeHp > 35 ? 16 : 6);
    } else {
      const missing = me.max - me.hp;
      if (id === 'certificati') sc = Math.min(TUNE.healBase + TUNE.healPer * me.tee, missing) * (hpF < 0.45 ? 1.25 : 0.35) + (me.tee >= 2 && hpF < 0.6 ? 6 : 0);
      else if (id === 'bidet') sc = Math.min(25, missing) * (hpF < 0.45 ? 1.2 : 0.35) + ((me.conf || me.encore || me.mods.some(function (x) { return x.mult < 1 && x.until >= s.turn; })) ? 12 : 0);
      else if (id === 'pitstop') sc = Math.min(20, missing) * (hpF < 0.5 ? 1.2 : 0.35) + (hasMod(s, me, 'defUp') ? 0 : 6);
      else if (id === 'zen') sc = Math.min(20, missing) * (hpF < 0.5 ? 1 : 0.3) + me.anx * 6 + (zenOn(s, me) ? -20 : 4);
      else if (id === 'personaggismo') sc = personaOn(s, me) ? -10 : (eff(ch(me).type, ch(foe).type) < 1 ? 24 : eff(ch(me).type, ch(foe).type) > 1 ? 2 : 12) * (foeHp > 40 ? 1 : 0.3);
      else if (id === 'palestra') sc = hasMod(s, me, 'atkUp') ? -10 : (foeHp > 45 && hpF > 0.4 ? 20 : 4);
      else if (id === 'king') sc = hasMod(s, me, 'guard') ? -10 : (hpF < 0.7 ? 16 : 9);
      else if (id === 'criptico') sc = foe.conf ? -10 : (foeHp > 35 ? 18 : 6);
      else if (id === 'manipolazione') {
        const lm = foe.lastMove, lmMove = lm ? mv(foe, lm) : null;
        sc = (!lm || zenOn(s, foe) || foe.encore) ? 2 : (lmMove!.kind !== 'atk' ? 22 : 10);
        sc += Math.min(10, missing) * 0.4;
      } else if (id === 'orale') sc = hpF < 0.45 ? 30 : 0;
    }
    sc *= 0.85 + rand(s) * 0.3;
    if (sc > bestSc) { bestSc = sc; best = id; }
  });
  return best!;
}
function planEsame(s: BattleState, i: number, opts: string[]): string {
  const e = s.sides[i], p = s.sides[1 - i];
  function ok(id: string) { return opts.indexOf(id) >= 0; }
  if (e.hp < e.max * 0.45 && ok('orale') && rand(s) < 0.75) return 'orale';
  const r = rand(s);
  if (p.hp <= 40) return r < 0.45 ? 'bocciatura' : r < 0.8 ? 'trabocchetto' : 'bode';
  let list: [string, number][] = hasMod(s, p, 'atkDown') ? [['bode', 40], ['trabocchetto', 40], ['bocciatura', 20]] : [['bode', 35], ['trabocchetto', 30], ['radici', 25], ['bocciatura', 10]];
  list = list.filter(function (x) { return ok(x[0]); });
  if (!list.length) return opts[0];
  let tot = 0, k;
  for (k = 0; k < list.length; k++) tot += list[k][1];
  let xx = r * tot;
  for (k = 0; k < list.length; k++) { xx -= list[k][1]; if (xx < 0) return list[k][0]; }
  return list[0][0];
}
