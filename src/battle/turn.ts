import { CHARS, PAIRS } from '../data/characters';
import { NETS, isNet } from '../data/nets';
import { ITEMS, FOUND } from '../data/items';
import { TUNE, K } from '../data/tuning';
import type { BattleEvent, BattleState, Grade, Result } from './types';
import { rand, pick } from './rng';
import { say, line, expr, anim } from './events';
import { ch, mv, available, statsOf } from './state';
import { SPECIES, isSpecies } from '../data/creatures';
import { snap } from './labels';
import { useMove } from './moves';
import { ai } from './ai';

/* The flow of a battle: intro → begin (start of turn) → select (players choose) → busy → begin … → over.
   Each call returns the events for the UI to play back. */

/* ---------- intro ---------- */
export function intro(s: BattleState): BattleEvent[] {
  const ev: BattleEvent[] = [], A = s.sides[0], B = s.sides[1], ca = ch(A), cb = ch(B);
  const key = [A.id, B.id].sort().join('|'), pair = PAIRS[key] as Record<string, string> | undefined;
  ev.push(say(s.boss ? 'L\'Esame di Controlli sfida ' + ca.name + '!' : s.wild && isSpecies(B.id) ? SPECIES[B.id].wild + ' salta fuori!' : s.trainer ? s.trainer + ' manda in campo ' + cb.name + '!' : cb.name + ' sfida ' + ca.name + '!'));
  ev.push(expr(1, s.boss ? 'angry' : 'grin'));
  ev.push(line(1, pair && A.id !== B.id ? pair[B.id] : cb.lines.entry));
  ev.push(expr(1, s.boss ? 'idle' : 'smirk'));
  ev.push(anim(0, 'enter'));
  ev.push(line(0, pair && A.id !== B.id ? pair[A.id] : ca.lines.entry));
  s.phase = 'begin';
  return ev;
}

/* ---------- start of turn ---------- */
export function beginTurn(s: BattleState): BattleEvent[] {
  const ev: BattleEvent[] = [];
  for (let i = 0; i < 2; i++) {
    const x = s.sides[i];
    if (x.id === 'antonio') {
      if (x.lock && s.turn > x.lock.until) {
        const it = ITEMS[x.lock.move];
        ev.push(anim(i, 'found', { item: it.icon }));
        ev.push(expr(i, 'grin'));
        ev.push(say('Antonio ritrova ' + it.name + ': era ' + pick(s, FOUND) + '.'));
        x.lock = null;
        ev.push(snap(s));
      }
      const losable = ['diagnosi', 'certificati', 'simtoreal', 'america'].filter(function (m) { return i !== 0 || !s.safe || s.safe.indexOf(m) < 0; });
      if (!x.lock && !x.charge && losable.length && rand(s) < (x.perk ? x.perk.lose : 0.15)) {
        const id = pick(s, losable), item = ITEMS[id];
        x.lock = { move: id, until: s.turn + 1 };
        x.st.lost++;
        ev.push(expr(i, 'worried'));
        ev.push(anim(i, 'lost', { item: item.icon }));
        ev.push(say('Antonio ha perso ' + item.name + '!'));
        ev.push(line(i, CHARS.antonio.lines.lost));
        ev.push(snap(s));
        ev.push(say(CHARS.antonio.moves.filter(function (m) { return m.id === id; })[0].name + ' è bloccata per 2 turni.'));
      }
      if (!x.boost && rand(s) < (x.perk ? x.perk.idea : 0.25)) {
        x.boost = true;
        ev.push(anim(i, 'ai'));
        ev.push(expr(i, 'grin'));
        ev.push(say('L\'IA suggerisce un\'idea ad Antonio: la sua prossima mossa farà il 50% in più.'));
        if (!x.saidAi) { x.saidAi = true; ev.push(line(i, CHARS.antonio.lines.ai)); }
        ev.push(snap(s));
      }
    }
    if (x.encore && x.encore.until < s.turn) x.encore = null;
  }
  for (let k = 0; k < 2; k++) {
    const y = s.sides[k];
    ev.push(expr(k, y.id === 'esame' ? 'idle' : 'smirk'));
    s.forced[k] = y.charge ? { move: y.charge } : y.skip ? { skip: true } : null;
    s.plan[k] = (!y.human && !s.forced[k]) ? ai(s, k) : null;
  }
  s.phase = 'select';
  ev.push(snap(s));
  return ev;
}
/** sides whose player must choose a move this turn */
export function needs(s: BattleState): number[] {
  const out: number[] = [];
  for (let i = 0; i < 2; i++) if (s.sides[i].human && !s.forced[i]) out.push(i);
  return out;
}

/* ---------- one side acts: lost turns, confusion, Valentin changing his mind ---------- */
function act(s: BattleState, i: number, choice: string | null, ev: BattleEvent[]): boolean {
  const me = s.sides[i], cm = ch(me);
  if (me.skip) {
    const why = me.skip.why; me.skip = null;
    if (why === 'robot') { ev.push(expr(i, 'worried')); ev.push(anim(i, 'robotFix')); ev.push(say('Antonio sta rimettendo in piedi il robot…')); }
    else { ev.push(expr(i, 'worried')); ev.push(say(cm.name + ' non riesce a dire una parola.')); }
    return false;
  }
  let id = choice as string;
  if (me.conf > 0 && id !== 'copenhagenRet') {
    me.conf--;
    ev.push(anim(i, 'confused'));
    ev.push(say(cm.name + ' è confuso…'));
    if (rand(s) < 0.33) {
      let self = Math.max(1, Math.round(30 * statsOf(me).atk / statsOf(me).def * (s.K || K) * (0.88 + rand(s) * 0.12)));
      if (me.id === 'forchetta' && !me.sturdy && self >= me.hp && me.hp > 1) { self = me.hp - 1; me.sturdy = true; }
      me.hp = Math.max(0, me.hp - self);
      ev.push({ k: 'hp', who: i, hp: me.hp, dmg: self });
      ev.push(expr(i, me.hp > 0 ? 'pout' : 'sleepy'));
      ev.push(say('Non capisce più niente e si fa male da solo!'));
      return false;
    }
    if (me.conf === 0) ev.push(say(cm.name + ' torna lucido.'));
  }
  if (me.id === 'valentin' && id !== 'copenhagenRet' && rand(s) < 0.15) {
    const others = available(s, i).filter(function (x) { return x !== id; });
    if (others.length) {
      id = pick(s, others);
      ev.push(expr(i, 'grin'));
      ev.push(line(i, cm.lines.anomalo));
      ev.push(say('Animale anomalo: Valentin cambia idea.'));
    }
  }
  return useMove(s, i, id, ev);
}

/* ---------- resolution ---------- */
function orderOf(s: BattleState, choice: (string | null)[]): number[] {
  const keys = [0, 1].map(function (i) {
    const side = s.sides[i], id = choice[i], m = id && id !== 'skip' ? (mv(side, id === 'copenhagenRet' ? 'copenhagen' : id)) : null;
    let pr = m && m.priority ? m.priority : 0;
    if (side.id === 'forchetta' && pr < 6) pr = -5;
    return { i: i, pr: pr, spe: statsOf(side).spe, tie: rand(s) };
  });
  keys.sort(function (a, b) { return b.pr - a.pr || b.spe - a.spe || a.tie - b.tie; });
  return keys.map(function (k) { return k.i; });
}

/** the exam's mark: health left and time left */
function grade(s: BattleState): Grade {
  const p = s.sides[0], hpFrac = p.hp / p.max, timeFrac = (s.maxTurns - s.turn) / (s.maxTurns - 1);
  const score = Math.min(1, (0.6 * hpFrac + 0.4 * timeFrac) / 0.8);
  const g = Math.max(18, Math.min(30, 18 + Math.round(12 * score)));
  return { g: g, lode: g === 30 && hpFrac >= 0.6 };
}
function finish(s: BattleState, result: Result, winner: number | null, ev: BattleEvent[]) {
  s.phase = 'over'; s.result = result; s.winner = winner;
  if (result === 'catch') {
    ev.push(anim(1, 'caught'));
    ev.push(say('Preso! ' + ch(s.sides[1]).name + ' è ' + (s.caughtWith && isNet(s.caughtWith) ? NETS[s.caughtWith].into : 'nel retino') + '.'));
    ev.push(expr(0, 'cool'));
  } else if (result === 'win') {
    const wi = winner as number, w = s.sides[wi], l = s.sides[1 - wi];
    if (s.boss && wi === 0) s.grade = grade(s);
    ev.push(expr(1 - wi, l.id === 'esame' ? 'ko' : 'sleepy'));
    ev.push(anim(1 - wi, 'faint'));
    ev.push(say(ch(l).name + ' è KO!'));
    ev.push(line(1 - wi, ch(l).lines.ko));
    ev.push(expr(wi, w.id === 'esame' ? 'angry' : 'cool'));
    ev.push(line(wi, ch(w).lines.win));
  } else if (result === 'time') {
    ev.push(say('Tempo scaduto! Il compito viene ritirato.'));
    ev.push(expr(1, 'angry'));
    ev.push(line(1, CHARS.esame.lines.time));
    ev.push(expr(0, 'worried'));
    if (ch(s.sides[0]).lines.time) ev.push(line(0, ch(s.sides[0]).lines.time));
  } else {
    ev.push(say('Turno ' + s.maxTurns + ': nessuno cede. Pareggio!'));
    ev.push(expr(0, 'worried')); ev.push(expr(1, 'worried'));
  }
  ev.push({ k: 'end', result: result, winner: winner, grade: s.grade });
}

/** plays a whole turn with the players' choices (by side index); the computer and forced moves fill in the rest */
export function playTurn(s: BattleState, choices?: Record<number, string>): BattleEvent[] {
  choices = choices || {};
  const ev: BattleEvent[] = [], choice: (string | null)[] = [null, null], attacked = [false, false];
  for (let i = 0; i < 2; i++) {
    const f = s.forced[i], side = s.sides[i];
    if (f && f.skip) choice[i] = 'skip';
    else if (f && f.move) choice[i] = f.move;
    else if (!side.human) choice[i] = s.plan[i] || ai(s, i);
    else {
      const av = available(s, i);
      choice[i] = av.indexOf(choices[i]) >= 0 ? choices[i] : av[0];
    }
  }
  s.phase = 'busy';
  const order = orderOf(s, choice);
  for (let n = 0; n < 2; n++) {
    const k = order[n];
    if (s.sides[k].hp <= 0) continue;
    attacked[k] = act(s, k, choice[k] === 'skip' ? null : choice[k], ev);
    ev.push(snap(s));
    if (s.caught) { finish(s, 'catch', 0, ev); return ev; }
    const dead = s.sides[0].hp <= 0 ? 0 : s.sides[1].hp <= 0 ? 1 : -1;
    if (dead >= 0) { finish(s, 'win', 1 - dead, ev); return ev; }
  }
  /* end of turn */
  for (let e = 0; e < 2; e++) {
    const x = s.sides[e];
    x.away = false;
    if (x.id === 'valentin' && x.hp > 0 && x.hp < x.max) {
      const amt = Math.min(TUNE.regen, x.max - x.hp);
      x.hp += amt;
      ev.push({ k: 'hp', who: e, hp: x.hp, heal: amt, quiet: true });
      if (!x.saidRegen) { x.saidRegen = true; ev.push(say('La festa continua: Valentin recupera ' + TUNE.regen + ' PS a ogni turno.')); }
    }
    if (x.id === 'antonio' && !attacked[e] && x.tee < 3 && choice[e] !== 'certificati') {
      x.tee++;
      ev.push(say('Antonio mette da parte un certificato bianco (' + x.tee + '/3).'));
    }
    if (x.id === 'zendavid' && x.zen && x.zen === s.turn) { ev.push(anim(e, 'phOff')); ev.push(say('Zendavid si toglie le cuffie.')); }
  }
  s.turn++;
  if (s.turn > s.maxTurns) { s.turn = s.maxTurns; finish(s, s.boss ? 'time' : 'draw', s.boss ? 1 : null, ev); return ev; }
  if (s.boss) {
    const left = s.maxTurns - s.turn + 1;
    if (left === 3) ev.push(say('Mancano 30 minuti alla consegna.'));
    if (left === 1) ev.push(say('Ultimi 10 minuti!'));
  }
  s.forecast = [s.forecastNext[0], s.forecastNext[1]]; s.forecastNext = [false, false];
  s.phase = 'begin';
  ev.push(snap(s));
  return ev;
}
