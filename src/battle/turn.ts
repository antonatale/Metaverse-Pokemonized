import { CHARS, PAIRS } from '../data/characters';
import { NETS, isNet } from '../data/nets';
import { ITEMS, FOUND } from '../data/items';
import { TUNE, K, SWITCH_TUNE, FIELD_TUNE } from '../data/tuning';
import type { BattleEvent, BattleState, Grade, Result, Side } from './types';
import { rand, pick } from './rng';
import { say, line, expr, anim } from './events';
import { ch, mv, available, statsOf, isSwitch, switchSlot, switches, senders, tally, BAG } from './state';
import { SPECIES, isSpecies } from '../data/creatures';
import { snap } from './labels';
import { useMove } from './moves';
import { ai, nextUp } from './ai';
import { fire, turnEnd, sleeping, speedOf } from './passives';
import { stageUp } from './stages';
import { canResonate, isResonance, moveOf, resonate, wantsResonance } from './surge';

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
  if (s.field) ev.push(say('La magia ' + s.field.name + ': qui le mosse di tipo ' + s.field.type + ' fanno il ' + Math.round((FIELD_TUNE.boost - 1) * 100) + '% in più.'));
  if (s.surge && s.surge[0]) ev.push(say('Le Pietre di Telepilo scaldano la borsa: si parte con un punto di Slancio.'));
  if (s.shield) ev.push(say(s.shield.name + ' protegge ' + (s.trainer || ch(B).name) + ': ogni colpo superefficace la incrina.'));
  fire(s, 1, 'enter', ev); fire(s, 0, 'enter', ev);
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
      const losable = ['diagnosi', 'certificati', 'simtoreal', 'america'].filter(function (m) { return (i !== 0 || !s.safe || s.safe.indexOf(m) < 0) && (!x.known || x.known.indexOf(m) >= 0); });
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
  /* asleep it does nothing, but the bag is Antonio's */
  if (!(choice && BAG[choice]) && sleeping(s, i, ev)) return false;
  if (me.skip) {
    const why = me.skip.why; me.skip = null;
    if (why === 'robot') { ev.push(expr(i, 'worried')); ev.push(anim(i, 'robotFix')); ev.push(say('Antonio sta rimettendo in piedi il robot…')); }
    else if (why === 'broken') { ev.push(expr(i, 'worried')); ev.push(say(cm.name + ' resta senza difese e non riesce a reagire.')); }
    else { ev.push(expr(i, 'worried')); ev.push(say(cm.name + ' non riesce a dire una parola.')); }
    return false;
  }
  let id = choice as string;
  if (me.conf > 0 && id !== 'copenhagenRet' && !BAG[id]) {
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
      fire(s, i, 'hurt', ev, { side: true });
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
    const side = s.sides[i], id = choice[i], sw = isSwitch(id), m = id && id !== 'skip' && !sw ? (mv(side, id === 'copenhagenRet' ? 'copenhagen' : id)) : null;
    let pr = sw ? 7 : m && m.priority ? m.priority : 0;
    if (side.id === 'forchetta' && pr < 6) pr = -5;
    return { i: i, pr: pr, spe: speedOf(s, i), tie: rand(s) };
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
/** the foe on the field is out of the fight: whoever is facing it brought it down */
function downed(s: BattleState, k: number) {
  if (!s.bouts || k !== 1) return;
  const foe = s.sides[1], b = s.bouts.filter(function (x) { return x.key === foe.key; })[0];
  if (b) { b.ko = true; b.by = s.sides[0].key || null; }
}
function faint(s: BattleState, k: number, ev: BattleEvent[]) {
  const l = s.sides[k];
  ev.push(expr(k, l.id === 'esame' ? 'ko' : 'sleepy'));
  ev.push(anim(k, 'faint'));
  ev.push(say(ch(l).name + ' è KO!'));
  ev.push(line(k, ch(l).lines.ko));
  downed(s, k);
}
function finish(s: BattleState, result: Result, winner: number | null, ev: BattleEvent[], told?: boolean) {
  s.phase = 'over'; s.result = result; s.winner = winner;
  if (result === 'catch') {
    downed(s, 1);
    ev.push(anim(1, 'caught'));
    ev.push(say('Preso! ' + ch(s.sides[1]).name + ' è ' + (s.caughtWith && isNet(s.caughtWith) ? NETS[s.caughtWith].into : 'nel retino') + '.'));
    ev.push(expr(0, 'cool'));
  } else if (result === 'win') {
    const wi = winner as number, w = s.sides[wi];
    if (s.boss && wi === 0) s.grade = grade(s);
    if (!told) faint(s, 1 - wi, ev);
    /* a state can bring down the winner too, with someone left on its bench */
    if (w.hp > 0) {
      ev.push(expr(wi, w.id === 'esame' ? 'angry' : 'cool'));
      ev.push(line(wi, ch(w).lines.win));
    }
  } else if (result === 'time') {
    ev.push(say('Tempo scaduto! Il compito viene ritirato.'));
    ev.push(expr(1, 'angry'));
    ev.push(line(1, CHARS.esame.lines.time));
    ev.push(expr(0, 'worried'));
    if (ch(s.sides[0]).lines.time) ev.push(line(0, ch(s.sides[0]).lines.time));
  } else {
    ev.push(say(told ? 'Cadono tutti e due: nessuno vince.' : 'Turno ' + s.maxTurns + ': nessuno cede. Pareggio!'));
    ev.push(expr(0, 'worried')); ev.push(expr(1, 'worried'));
  }
  ev.push({ k: 'end', result: result, winner: winner, grade: s.grade });
}

/** plays a whole turn with the players' choices (by side index); the computer and forced moves fill in the rest */
export function playTurn(s: BattleState, choices?: Record<number, string>): BattleEvent[] {
  choices = choices || {};
  const ev: BattleEvent[] = [], choice: (string | null)[] = [null, null], attacked = [false, false], armed = [false, false];
  for (let i = 0; i < 2; i++) {
    const f = s.forced[i], side = s.sides[i];
    if (f && f.skip) choice[i] = 'skip';
    else if (f && f.move) choice[i] = f.move;
    else if (!side.human) { choice[i] = s.plan[i] || ai(s, i); armed[i] = !isSwitch(choice[i]) && wantsResonance(s, i); }
    else {
      const av = available(s, i), want = moveOf(choices[i]);
      armed[i] = isResonance(choices[i]) && canResonate(s, i);
      choice[i] = av.indexOf(want) >= 0 || switches(s, i).indexOf(want) >= 0 ? want : av[0];
    }
  }
  s.phase = 'busy';
  const order = orderOf(s, choice);
  for (let n = 0; n < 2; n++) {
    const k = order[n];
    if (s.sides[k].hp <= 0) continue;
    /* the blow it was getting ready has been knocked out of its hands */
    if (s.forced[k] && s.forced[k]!.move && !s.sides[k].charge) continue;
    if (isSwitch(choice[k])) { change(s, k, switchSlot(choice[k]!), ev); s.sides[k].fresh = true; s.sides[k].went = true; fire(s, k, 'enter', ev); ev.push(snap(s)); continue; }
    if (armed[k]) resonate(s, k, ev);
    attacked[k] = act(s, k, choice[k] === 'skip' ? null : choice[k], ev);
    /* who has acted, for the abilities that care who came first: never written in a battle between friends */
    if (s.bench || isSpecies(s.sides[k].id)) s.sides[k].went = true;
    ev.push(snap(s));
    if (s.caught) { finish(s, 'catch', 0, ev); return ev; }
    /* a legend that starts another part has other moves: what it had chosen is gone with the last one */
    [0, 1].forEach(function (f) { if (stageUp(s, f, ev) && !s.sides[f].human && !s.forced[f]) choice[f] = ai(s, f); });
    const dead = s.sides[0].hp <= 0 ? 0 : s.sides[1].hp <= 0 ? 1 : -1;
    if (dead >= 0) {
      /* with someone left on the bench the battle goes on: nobody hits a fighter who is down, so the turn ends here */
      if (!senders(s, dead).length) { finish(s, 'win', 1 - dead, ev); return ev; }
      faint(s, dead, ev);
      break;
    }
  }
  /* end of turn */
  const down = [s.sides[0].hp <= 0, s.sides[1].hp <= 0];
  for (let e = 0; e < 2; e++) {
    const x = s.sides[e];
    x.away = false;
    if (x.fresh) delete x.fresh;
    if (x.went) delete x.went;
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
    turnEnd(s, e, ev);
    stageUp(s, e, ev);
  }
  /* a state can bring a fighter down here, even both at once: every fall is told, then the battle is decided */
  [0, 1].forEach(function (f) { if (s.sides[f].hp <= 0 && !down[f]) faint(s, f, ev); });
  const out = [0, 1].filter(function (f) { return s.sides[f].hp <= 0 && !senders(s, f).length; });
  if (out.length) { if (out.length === 2) finish(s, 'draw', null, ev, true); else finish(s, 'win', 1 - out[0], ev, true); return ev; }
  /* who waits on the bench gets its breath back */
  if (s.bench) s.bench.forEach(function (b) { b.forEach(function (x) { if (x.hp > 0 && !x.last) x.hp = Math.min(x.max, x.hp + Math.round(x.max * SWITCH_TUNE.rest)); }); });
  s.turn++;
  if (s.turn > s.maxTurns) { s.turn = s.maxTurns; finish(s, s.boss ? 'time' : 'draw', s.boss ? 1 : null, ev); return ev; }
  if (s.boss) {
    const left = s.maxTurns - s.turn + 1;
    if (left === 3) ev.push(say('Mancano 30 minuti alla consegna.'));
    if (left === 1) ev.push(say('Ultimi 10 minuti!'));
  }
  s.forecast = [s.forecastNext[0], s.forecastNext[1]]; s.forecastNext = [false, false];
  s.phase = 'begin';
  if (s.sides[0].hp <= 0 || s.sides[1].hp <= 0) announce(s, ev);
  ev.push(snap(s));
  return ev;
}

/* ---------- team battles: who comes in ---------- */
/** who has been on the field loses what was only of the moment, and keeps its health and the moves it has spent */
function rest(x: Side) {
  x.mods = []; x.conf = 0; x.encore = null; x.skip = null; x.away = false; x.charge = null; x.boost = false; x.lastMove = null;
  x.status = null; delete x.went; delete x.fresh;
}
/** that place on the bench takes the field. The running score of the side goes with it, for the result screen */
function enter(s: BattleState, i: number, slot: number, ev: BattleEvent[]) {
  const out = s.sides[i], inn = s.bench![i][slot];
  rest(out);
  inn.st = Object.assign({}, out.st);
  s.bench![i][slot] = out;
  s.sides[i] = inn;
  s.plan[i] = null; s.forced[i] = null;
  ev.push({ k: 'swap', who: i, id: inn.id, key: inn.key, gold: inn.gold, form: inn.form, hp: inn.hp });
  ev.push(snap(s));
  ev.push(anim(i, 'enter'));
  ev.push(line(i, ch(inn).lines.entry));
  tally(s);
}
/** a change by choice: it costs the turn, and whoever comes in takes what the other side has chosen */
function change(s: BattleState, i: number, slot: number, ev: BattleEvent[]) {
  const x = s.sides[i], inn = s.bench![i][slot];
  if (!x.human && s.swaps) s.swaps[i]--;
  ev.push(say(i === 0 && !s.sides[1].human ? ch(x).name + ', rientra! Tocca a ' + ch(inn).name + '.' : s.trainer && !x.human ? s.trainer + ' richiama ' + ch(x).name + ' e manda in campo ' + ch(inn).name + '!' : ch(x).name + ' lascia il posto a ' + ch(inn).name + '.'));
  ev.push(anim(i, 'recall'));
  enter(s, i, slot, ev);
}
/** someone is down and someone else will take its place: the computer says who, and the player answers in sendNeeds */
function announce(s: BattleState, ev: BattleEvent[]) {
  s.phase = 'send'; s.forced = [null, null];
  for (let i = 0; i < 2; i++) {
    const x = s.sides[i];
    if (x.human || x.hp > 0) continue;
    const slot = nextUp(s, i);
    s.nextIn![i] = slot;
    /* a covo's leader is the last of his bench: he does not send himself, he steps in */
    const nx = s.bench![i][slot];
    ev.push(say(nx.last ? ch(nx).name + ' sta per scendere in campo di persona!' : (s.trainer || ch(x).name) + ' sta per mandare in campo ' + ch(nx).name + '.'));
  }
}
/** the player's say before the next turn: who is down must be replaced; whoever is up may change, knowing who is coming */
export function sendNeeds(s: BattleState): { side: number; must: boolean }[] {
  const out: { side: number; must: boolean }[] = [];
  if (s.phase !== 'send') return out;
  for (let i = 0; i < 2; i++) {
    if (!s.sides[i].human) continue;
    if (s.sides[i].hp <= 0) out.push({ side: i, must: true });
    else if (s.sides[1 - i].hp <= 0 && !s.sides[1 - i].human && switches(s, i).length) out.push({ side: i, must: false });
  }
  return out;
}
/** the new ones take the field. `picks`: a place on the bench for each side the player answered for, -1 to give up
    (nobody has to fight to the last), -2 to stay as it is; the computer's are the ones it announced */
export function sendIn(s: BattleState, picks?: Record<number, number>): BattleEvent[] {
  const ev: BattleEvent[] = [], p = picks || {}, came: number[] = [];
  for (let g = 0; g < 2; g++) if (p[g] === -1) { finish(s, 'win', 1 - g, ev, true); return ev; }
  for (let i = 0; i < 2; i++) {
    const x = s.sides[i], can = senders(s, i);
    if (x.hp > 0) {
      /* a change before the foe's next one comes in: free, and only for a side that may change */
      if (p[i] != null && switches(s, i).indexOf('switch:' + p[i]) >= 0) { change(s, i, p[i], ev); came.push(i); ev.push(snap(s)); }
      continue;
    }
    const slot = x.human ? (can.indexOf(p[i]) >= 0 ? p[i] : can[0]) : s.nextIn![i] as number;
    s.nextIn![i] = null;
    const nx = s.bench![i][slot];
    ev.push(say(x.human ? 'Vai, ' + ch(nx).name + '!' : nx.last ? ch(nx).name + ' scende in campo!' : (s.trainer || ch(x).name) + ' manda in campo ' + ch(nx).name + '!'));
    enter(s, i, slot, ev);
    came.push(i);
    ev.push(snap(s));
  }
  tally(s);
  /* with both on the field: an ability that acts on coming in has someone to act on */
  came.forEach(function (i) { fire(s, i, 'enter', ev); });
  s.phase = 'begin';
  ev.push(snap(s));
  return ev;
}
