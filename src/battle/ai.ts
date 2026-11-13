import { TUNE, SWITCH_TUNE } from '../data/tuning';
import { isNet } from '../data/nets';
import type { BattleState, Side } from './types';
import { rand } from './rng';
import { ch, mv, eff, available, hasMod, personaOn, zenOn, switches, switchSlot, senders } from './state';
import { expected, plainHit } from './damage';
import { speedIn, immune } from './passives';
import { STATUS, type StatFx, type StatusId } from '../data/passives';

/* ---------- the computer's choice ---------- */
export function ai(s: BattleState, i: number): string {
  const me = s.sides[i], foe = s.sides[1 - i], opts = available(s, i), change = changeOf(s, i);
  if (change) return change;
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
      /* Claudia: the answer is worth more right after a blow (she moves second, or has just been hit); the Trinità is
         three blows of the expected one */
      if (id === 'ascolta' && me.hurtAt === s.turn) sc *= TUNE.ascolta;
      if (id === 'trinita') sc *= 3;
      if (m.fx && m.fx.foe && !hasMod(s, foe, m.fx.foe)) sc += worthOf(s, i, m.fx.foe) * 0.5;
      if (m.fx && m.fx.self && !hasMod(s, me, m.fx.self)) sc += worthOf(s, i, m.fx.self);
      if (m.fx && m.fx.conf && !foe.conf) sc += 6 * m.fx.conf;
      if (m.fx && m.fx.status && !foe.status) sc += statusWorth(s, i, m.fx.status) * (m.fx.odds == null ? 1 : m.fx.odds);
    } else if (id === 'tiella') sc = Math.min(40, me.max - me.hp) * (hpF < 0.45 ? 1.25 : 0.3) + (me.status ? 14 : 0);
    else if (id === 'balsamo') sc = (me.status ? 16 : 0) + (me.conf ? 10 : 0) + (me.mods.some(function (x) { return x.mult < 1 && x.until >= s.turn; }) ? 8 : 0);
    else if (isNet(id)) sc = 0;
    else if (m.fx) {
      /* a creature: heal when low, raise or drop once, confuse when it is not */
      const missing = me.max - me.hp, fx = m.fx;
      if (fx.heal) sc = Math.min(me.max * fx.heal, missing) * (hpF < 0.45 ? 1.25 : 0.35);
      if (fx.self) sc += hasMod(s, me, fx.self) ? -10 : worthOf(s, i, fx.self);
      if (fx.foe) sc += hasMod(s, foe, fx.foe) ? -10 : worthOf(s, i, fx.foe);
      if (fx.conf) sc += foe.conf ? -10 : (foeHp > 35 ? 16 : 6);
      if (fx.status) sc += foe.status ? -10 : statusWorth(s, i, fx.status) * (m.acc || 1);
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
      else if (id === 'tavoli') {
        const lm = foe.lastMove, lmMove = lm ? mv(foe, lm) : null;
        sc = (!lm || lm === 'copenhagenRet' || zenOn(s, foe) || (foe.banned && foe.banned.until >= s.turn)) ? -10 : (lmMove!.kind === 'atk' ? 14 + (lmMove!.power || 50) * 0.1 : 16);
      } else if (id === 'cattiva') sc = (foe.astray && foe.astray >= s.turn) || zenOn(s, foe) ? -10 : (foeHp > 35 ? 17 : 5);
    }
    /* a little doubt, so that the computer does not always do the same thing; less in someone who knows the game */
    sc *= s.smart && s.smart[i] ? 0.95 + rand(s) * 0.1 : 0.85 + rand(s) * 0.3;
    if (sc > bestSc) { bestSc = sc; best = id; }
  });
  return best!;
}

/* ---------- team battles: who should be on the field ---------- */
/** what a number going up or down is worth to a creature: its share of the hits still to come in this duel, as long as
    the number lasts (an attack is scored by its damage, so this is damage too) */
function worthOf(s: BattleState, i: number, fx: StatFx): number {
  const me = s.sides[i], foe = s.sides[1 - i], give = bestHit(s, me, foe), take = bestHit(s, foe, me);
  const hits = Math.min(5, Math.ceil(foe.hp / give) - 1), takes = Math.min(5, Math.ceil(me.hp / take) - 1);
  return fx === 'atkUp' ? give * 0.3 * hits : fx === 'defDown' ? give * 0.25 * hits : fx === 'defUp' ? take * 0.2 * takes : take * 0.25 * takes;
}
/** what a state on the foe is worth, the same way: the health it will cost, the hits it will not give */
function statusWorth(s: BattleState, i: number, st: StatusId): number {
  const foe = s.sides[1 - i], take = bestHit(s, foe, s.sides[i]), def = STATUS[st], turns = def.turns[1];
  if (immune(s, 1 - i, st)) return -10;
  if (def.sleep) return take * 2;
  return (def.burn ? Math.min(foe.hp, foe.max * def.burn * turns) : 0) + (def.atk ? take * (1 - def.atk) * turns : 0) + (def.trap ? take * 0.3 : 0);
}
/** the most `a` can do to `d` in one hit, with what it has left */
function bestHit(s: BattleState, a: Side, d: Side): number {
  let best = 0;
  ch(a).moves.forEach(function (m) {
    if (m.kind !== 'atk' || (a.known && a.known.indexOf(m.id) < 0) || (m.uses && (a.uses[m.id] || 0) >= m.uses)) return;
    best = Math.max(best, plainHit(s, a, d, m));
  });
  return Math.max(1, best);
}
/** one team against the fighter in front, played out with whole hits and no dice: what is left of the team (above 0,
    in fractions of a fighter) or of the foe (below 0). `team` is who fights next, with the health it has */
function outlook(s: BattleState, team: { x: Side; hp: number }[], foe: Side, foeHp: number): number {
  let hf = foeHp;
  for (let k = 0; k < team.length; k++) {
    const me = team[k], dm = bestHit(s, me.x, foe), df = bestHit(s, foe, me.x);
    const need = Math.ceil(hf / dm), lasts = Math.ceil(me.hp / df), first = speedIn(s, me.x, foe) >= speedIn(s, foe, me.x);
    if (first ? need <= lasts : need < lasts) {
      const left = me.hp - (first ? need - 1 : need) * df;
      let v = left / me.x.max;
      for (let r = k + 1; r < team.length; r++) v += team[r].hp / team[r].x.max;
      return v;
    }
    hf -= (first ? lasts : lasts - 1) * dm;
  }
  return -hf / foe.max;
}
/** a computer that plays its team changes when the numbers say the team comes out of it better, even paying the hit
    that greets who comes in. Not every time: a change that always comes is one the player reads */
function changeOf(s: BattleState, i: number): string | null {
  if (!s.bench || !s.swaps || s.swaps[i] <= 0 || s.sides[i].human) return null;
  const opts = switches(s, i), me = s.sides[i], foe = s.sides[1 - i];
  if (!opts.length || foe.hp <= 0) return null;
  const rest = s.bench[i].filter(function (x) { return x.hp > 0 && !x.last; });
  const line = function (first: Side, hp: number) {
    const others = (first === me ? rest : [me].concat(rest.filter(function (x) { return x !== first; }))).map(function (x) { return { x: x, hp: x.hp }; });
    return outlook(s, [{ x: first, hp: hp }].concat(others), foe, foe.hp);
  };
  const stay = line(me, me.hp);
  let best: string | null = null, top = stay + SWITCH_TUNE.margin;
  opts.forEach(function (o) {
    const x = s.bench![i][switchSlot(o)], hp = x.hp - bestHit(s, foe, x) * SWITCH_TUNE.guard;
    if (hp <= 0) return;
    const v = line(x, hp);
    if (v > top) { top = v; best = o; }
  });
  return best && rand(s) < SWITCH_TUNE.chance ? best : null;
}
/** who the computer sends in for one who is down: the next of its team, or, if it plays well, the best against the
    one in front */
export function nextUp(s: BattleState, i: number): number {
  const can = senders(s, i), foe = s.sides[1 - i];
  if (!s.smart || !s.smart[i] || foe.hp <= 0) return can[0];
  let best = can[0], top = -9;
  can.forEach(function (k) {
    const x = s.bench![i][k], v = outlook(s, [{ x: x, hp: x.hp }], foe, foe.hp);
    if (v > top) { top = v; best = k; }
  });
  return best;
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
