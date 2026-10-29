import { CHARS as C, type CharId, type FriendId } from '../data/characters';
import { COVI } from '../data/covi';
import { ENGINE as E, type BattleEvent, type BattleState, type Mode, type Snap } from '../battle';
import { SPR } from '../render/svg';
import { record, saveRecord } from '../save/libretto';
import { reduced, esc, each, $ } from './dom';
import { ico } from './icons';
import { TC, tc, typeTag, face, bust, sleep, home, battle, overlay, view, closeOverlay } from './common';
import { charBlocks, renderLibretto, renderStory, renderSetup, storyCity } from './home';
import { pulse, fx, anchor, projectile, popAt, robotFall, robotFix, FOX, BALL, confetti, notes, scan, banner } from './effects';
import { WORLD } from './story-screen';

/* The battle screen. It knows no rules: it asks the engine for events, labels and chips, and plays them back. */

const CANCEL = { cancelled: true };
/** what a battle is started with */
export interface BattleConfig { a: CharId; b: CharId; mode: Mode; story?: { covo: string } | null; safe?: string[] }
/** the battle on show; null between battles, and everything that reads it runs during one */
export let S = null as unknown as BattleState;

/* =================== BATTLE SHELL =================== */
export let arena: HTMLElement;
let dialog: HTMLElement, whoEl: HTMLElement, txtEl: HTMLElement, pad: HTMLElement, turnbar: HTMLElement, padSide = 0, padOn = false, pending: Record<number, string> = {}, needQ: number[] = [];
function sideName(i: number): string { return C[S.sides[i].id].name; }
function sideLabel(i: number): string { return S.mode === 'pvp' ? 'G' + (i + 1) : (i === 0 ? 'Tu' : 'CPU'); }
function boxHtml(i: number): string {
  var c = C[S.sides[i].id];
  return '<div class="box ' + (i === 0 ? 'me' : 'opp') + '" id="box-' + i + '"><div class="box-h"><b>' + esc(c.name) + '</b><span class="chip tag">' + sideLabel(i) + '</span></div>' +
    '<div class="hp"><em>PS</em><div class="hpbar" id="hp-' + i + '"><span></span></div></div>' +
    '<div class="box-f"><span class="type t-' + c.type.toLowerCase() + '" id="ty-' + i + '">' + c.type + '</span><div class="chips" id="chips-' + i + '"></div><span class="hpnum" id="hpn-' + i + '"></span></div></div>';
}
function renderShell() {
  var a = S.sides[0].id, b = S.sides[1].id;
  battle.innerHTML =
    '<div class="topbar"><button class="tb-btn" type="button" id="quit">Esci</button>' +
    '<div class="clock" id="clock">' + (S.boss ? ico('clock') + '<span id="clock-t">2:00</span>' : '') + '<span class="turn" id="turn-t">Turno 1</span></div>' +
    '<button class="tb-btn" type="button" id="info">Scheda</button></div>' +
    '<div class="arena" id="arena">' + boxHtml(1) +
    '<div class="spr-wrap opp" id="w-1"><div class="mover" id="m-1"><div class="bob">' + bust(b, b === 'esame' ? 'idle' : 'smirk') + '</div></div></div>' +
    '<div class="spr-wrap me" id="w-0"><div class="mover" id="m-0"><div class="bob">' + bust(a, 'smirk') + '</div></div></div>' + boxHtml(0) + '</div>' +
    '<div class="dialog" id="dialog" role="status" aria-live="polite"><span class="who" id="who" hidden></span><span class="txt" id="txt"></span><span class="caret" aria-hidden="true"></span></div>' +
    '<div class="turnbar" id="turnbar" hidden></div>' +
    '<div class="pad off" id="pad">' + [0, 1, 2, 3].map(function (k) { return '<button class="mv" type="button" data-k="' + k + '" disabled></button>'; }).join('') + '</div>';
  arena = $('arena'); dialog = $('dialog'); whoEl = $('who'); txtEl = $('txt'); pad = $('pad'); turnbar = $('turnbar');
  dialog.addEventListener('click', advance);
  arena.addEventListener('click', advance);
  pad.addEventListener('click', function (e) {
    var bt = (e.target as Element).closest ? (e.target as Element).closest('.mv') : null;
    if (bt && bt.getAttribute('data-id')) onMove(bt.getAttribute('data-id')!);
  });
  var q = $('quit'), qt: ReturnType<typeof setTimeout> | undefined;
  q.addEventListener('click', function () {
    if (q.getAttribute('data-armed') === '1' || (S && S.phase === 'over')) {
      clearTimeout(qt);
      if (S && S.story) backToWorld(S.story, false, true); else goHome();
      return;
    }
    q.setAttribute('data-armed', '1'); q.textContent = 'Esci davvero?';
    qt = setTimeout(function () { q.removeAttribute('data-armed'); q.textContent = 'Esci'; }, 2600);
  });
  $('info').addEventListener('click', openSheet);
}

/* ---------- status ---------- */
export let uiHp = [0, 0];
export const shown = { revealed: [true, false] };
export function setHp(i: number, hp: number) {
  var max = S.sides[i].max, bar = $('hp-' + i), pct = Math.max(0, Math.min(100, hp / max * 100));
  (bar.firstChild as HTMLElement).style.width = pct + '%';
  bar.classList.toggle('mid', pct <= 50 && pct > 20);
  bar.classList.toggle('low', pct <= 20);
  $('hpn-' + i).textContent = shown.revealed[i] ? hp + '/' + max : '??';
}
function renderSync(sn: Snap) {
  for (var i = 0; i < 2; i++) {
    shown.revealed[i] = i === 0 || S.mode === 'pvp' || S.sides[i].id !== 'esame' || sn.revealed[i];
    $('chips-' + i).innerHTML = sn.chips[i].map(function (c) { return '<span class="chip ' + c.c + '" title="' + esc(c.d) + '">' + ico(c.i) + esc(c.t) + '</span>'; }).join('');
    $('hpn-' + i).textContent = shown.revealed[i] ? uiHp[i] + '/' + S.sides[i].max : '??';
    var t = E.sideType(S, i), ty = $('ty-' + i);
    ty.textContent = t; ty.className = 'type t-' + t.toLowerCase();
    var svg = battle.querySelector('#w-' + i + ' .spr-p');
    if (svg) svg.setAttribute('data-ph', sn.ph[i] ? 'on' : 'off');
  }
  if (S.boss) {
    var left = (sn.maxTurns - sn.turn + 1) * 10;
    $('clock-t').textContent = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
    $('clock').classList.toggle('low', left <= 30);
    $('turn-t').textContent = 'Turno ' + sn.turn + ' di ' + sn.maxTurns;
  } else $('turn-t').textContent = 'Turno ' + sn.turn;
}
function renderPad(i: number) {
  padSide = i;
  var c = C[S.sides[i].id];
  each(pad.querySelectorAll<HTMLButtonElement>('.mv'), function (b, k) {
    var m = c.moves[k];
    if (!m) { b.hidden = true; return; }
    b.hidden = false;
    var L = E.moveLabel(S, i, m.id), sub = '';
    if (L.dots) sub = '<span class="stage">' + L.dots.map(function (on) { return '<i class="' + (on ? 'on' : '') + '"></i>'; }).join('') + '</span>' + esc(L.sub);
    else sub = (L.icon ? ico(L.icon) : '') + esc(L.sub);
    if (L.left != null && !L.locked) sub += '<span class="left">' + L.left + (L.left === 1 ? ' uso' : ' usi') + '</span>';
    b.setAttribute('data-id', m.id);
    b.className = 'mv' + (m.kind === 'atk' ? ' atk' : '') + (L.locked ? ' locked' : '');
    b.style.setProperty('--tc', TC[E.sideType(S, i)]);
    b.innerHTML = '<b>' + esc(m.name) + '</b><small>' + sub + '</small>';
    b.disabled = !padOn || L.locked;
    b.setAttribute('aria-label', m.name + (L.locked ? ', non disponibile' : '') + '. ' + L.sub);
  });
}
function setPad(on: boolean, i?: number | null) { padOn = on; pad.classList.toggle('off', !on); renderPad(i == null ? padSide : i); }

/* ---------- dialogue ---------- */
let tapHandler: (() => void) | null = null, stopSay: (() => void) | null = null;
function advance() { if (tapHandler) tapHandler(); }
function say(text: string, who?: number | null): Promise<void> {
  return new Promise<void>(function (resolve) {
    var wEl = whoEl, tEl = txtEl, dEl = dialog;
    if (who != null) { wEl.hidden = false; wEl.textContent = sideName(who); wEl.style.setProperty('--tc', TC[C[S.sides[who].id].type]); }
    else wEl.hidden = true;
    var full = who != null ? '«' + text + '»' : text, n = 0, typing = true, tt: ReturnType<typeof setTimeout> | undefined, hold: ReturnType<typeof setTimeout> | undefined, mine: () => void;
    dEl.classList.remove('wait');
    tEl.textContent = '';
    function stop() { clearTimeout(tt); clearTimeout(hold); if (tapHandler === mine) tapHandler = null; }
    function done() { stop(); dEl.classList.remove('wait'); resolve(); }
    function finish() {
      typing = false; tEl.textContent = full; dEl.classList.add('wait');
      hold = setTimeout(done, reduced ? 1400 : Math.min(2400, 750 + full.length * 18));
    }
    function step() {
      if (!typing) return;
      n += 2; tEl.textContent = full.slice(0, n);
      if (n >= full.length) finish(); else tt = setTimeout(step, 22);
    }
    mine = function () { if (typing) { clearTimeout(tt); finish(); } else done(); };
    tapHandler = mine; stopSay = stop;
    if (reduced) finish(); else step();
  });
}
function showPrompt(i: number) {
  whoEl.hidden = true;
  var t = 'Cosa fa ' + sideName(i) + '?';
  if (S.mode === 'cpu' && i === 0 && S.forecast[0] && E.planName(S, 1)) t += ' ' + sideName(1) + ' sta per usare ' + E.planName(S, 1) + '.';
  txtEl.textContent = t;
  dialog.classList.remove('wait');
  if (S.mode === 'pvp') {
    turnbar.hidden = false;
    turnbar.style.setProperty('--tc', TC[C[S.sides[i].id].type]);
    turnbar.innerHTML = '<span class="tag">Giocatore ' + (i + 1) + '</span>sceglie per ' + esc(sideName(i));
  } else turnbar.hidden = true;
}


/* ---------- playback ---------- */
let flow = 0;
const EX_MAP: Record<string, string> = { smirk: 'idle', grin: 'angry', cool: 'angry', pout: 'hurt', worried: 'hurt', sleepy: 'ko', ko: 'ko', idle: 'idle', angry: 'angry', hurt: 'hurt' };
const PX_MAP: Record<string, string> = { idle: 'smirk', angry: 'grin', hurt: 'pout', ko: 'sleepy' };
function setExpr(i: number, v: string) {
  var id = S.sides[i].id, svg = battle.querySelector('#w-' + i + ' .spr');
  if (!svg) return;
  if (id === 'esame') svg.setAttribute('data-face', EX_MAP[v] || 'idle');
  else svg.setAttribute('data-expr', PX_MAP[v] || v);
}
function hpEvent(ev: Extract<BattleEvent, { k: 'hp' }>) {
  var i = ev.who, m = $('m-' + i);
  uiHp[i] = ev.hp;
  if (ev.dmg) {
    m.classList.remove('shake', 'flash'); void m.offsetWidth; m.classList.add('shake', 'flash');
    var p = anchor(i, 0.5, i === 0 ? 0.18 : 0.12);
    fx('−' + ev.dmg, 'num ' + (ev.crit ? 'crit' : ''), p[0], p[1], 1150);
    setHp(i, ev.hp);
    return sleep(600).then(function () { m.classList.remove('shake', 'flash'); });
  }
  if (!ev.quiet) m.classList.add('glow');
  var q = anchor(i, 0.5, i === 0 ? 0.18 : 0.12);
  fx('+' + ev.heal, 'num heal', q[0], q[1], 1150);
  setHp(i, ev.hp);
  return sleep(ev.quiet ? 350 : 650).then(function () { m.classList.remove('glow'); });
}
function animEvent(ev: Extract<BattleEvent, { k: 'anim' }>): Promise<unknown> {
  var i = ev.who, j = 1 - i, m = $('m-' + i);
  switch (ev.a) {
    case 'lunge': return pulse(m, i === 0 ? 'lunge-me' : 'lunge-opp', 340);
    case 'dodge': return pulse(m, 'dodge', 400);
    case 'enter': return pulse(m, 'enter', 560);
    case 'faint': m.classList.add(i === 0 ? 'faint-me' : 'faint-opp'); return sleep(950);
    case 'heal': return Promise.resolve();
    case 'robot': return projectile(i, j, SPR.robot(), 'robot', 620);
    case 'robotFail': return robotFall(i);
    case 'robotFix': return robotFix();
    case 'lost': return popAt(i, '<div class="pop">' + ico(ev.item!) + '<i>?</i></div>', '', 0.62, 0.02);
    case 'found': return popAt(i, '<div class="pop">' + ico(ev.item!) + '<i>!</i></div>', '', 0.62, 0.02);
    case 'ai': return popAt(i, '<div class="pop">' + ico('spark') + '</div>', '', 0.68, 0.04, 900);
    case 'reveal': return scan(i);
    case 'banner': return banner(ev.text!, ev.style);
    case 'speech': return popAt(i, '<div class="bubble">BLA BLA BLA</div>', '', 0.5, -0.02, 900);
    case 'glint': return pulse(m, 'flash', 420);
    case 'fox': return projectile(i, j, FOX, '', 560, 70);
    case 'pump': return pulse(m, 'glow', 800);
    case 'confetti': confetti(i); return pulse(m, i === 0 ? 'lunge-me' : 'lunge-opp', 340);
    case 'flyAway': m.classList.add('away'); return sleep(700).then(function () { m.classList.remove('away'); m.classList.add('gone'); });
    case 'flyBack': m.classList.remove('gone'); return pulse(m, 'back', 620);
    case 'glowGreen': return pulse(m, 'glowGreen', 1000);
    case 'ball': return projectile(i, j, BALL, '', 460, 24);
    case 'cryptic': return projectile(i, j, '<div class="bubble hand">ok… ?¿</div>', '', 700, 30);
    case 'bark': return popAt(i, '<div class="bubble">BAU!</div>', '', 0.55, 0, 800);
    case 'laugh': return popAt(i, '<div class="bubble">AHAHAH</div>', '', 0.5, 0, 900);
    case 'cricket': return popAt(i, '<div class="bubble hand">cri cri…</div>', '', 0.5, 0, 1000);
    case 'confused': return popAt(i, '<div class="pop">' + ico('swirl') + '</div>', '', 0.5, 0, 900);
    case 'phOn': case 'phOff':
      var svg = battle.querySelector('#w-' + i + ' .spr-p');
      if (svg) svg.setAttribute('data-ph', ev.a === 'phOn' ? 'on' : 'off');
      return pulse(m, 'glow', 500);
    case 'notes': notes(i); return sleep(300).then(function () { return pulse(m, i === 0 ? 'lunge-me' : 'lunge-opp', 340); });
    default: return Promise.resolve();
  }
}
function stepEvent(ev: BattleEvent): Promise<unknown> {
  switch (ev.k) {
    case 'say': return say(ev.text);
    case 'line': return say(ev.text, ev.who);
    case 'expr': setExpr(ev.who, ev.v); return Promise.resolve();
    case 'anim': return animEvent(ev);
    case 'hp': return hpEvent(ev);
    case 'sync': renderSync(ev); return Promise.resolve();
    default: return Promise.resolve();
  }
}
function play(evs: BattleEvent[], my: number): Promise<unknown> {
  var n = 0;
  function next(): Promise<unknown> {
    if (my !== flow) return Promise.reject(CANCEL);
    if (n >= evs.length) return Promise.resolve();
    return stepEvent(evs[n++]).then(next);
  }
  return next();
}
function caught(e: unknown) { if (e !== CANCEL) throw e; }
function runFlow() {
  var my = ++flow;
  function loop(): Promise<unknown> {
    if (my !== flow) return Promise.resolve();
    if (S.phase === 'over') { showResult(); return Promise.resolve(); }
    if (S.phase === 'intro') { setPad(false, 0); return play(E.intro(S), my).then(loop); }
    if (S.phase === 'begin') { setPad(false); turnbar.hidden = true; return play(E.beginTurn(S), my).then(loop); }
    if (S.phase === 'select') {
      renderSync(E.snap(S));
      pending = {}; needQ = E.needs(S);
      if (!needQ.length) { setPad(false); return sleep(250).then(function () { return resolveTurn(my); }).then(loop); }
      askNext(false);
    }
    return Promise.resolve();
  }
  return loop().catch(caught);
}
function askNext(handoff: boolean) {
  var i = needQ[0];
  if (handoff && S.mode === 'pvp') { setPad(false, i); showPass(i); return; }
  showPrompt(i);
  setPad(true, i);
}
function onMove(id: string) {
  if (!padOn || !S || S.phase !== 'select' || !needQ.length) return;
  var i = needQ[0];
  if (E.available(S, i).indexOf(id) < 0) return;
  pending[i] = id;
  needQ.shift();
  setPad(false, i);
  if (needQ.length) { askNext(true); return; }
  turnbar.hidden = true;
  var my = ++flow;
  resolveTurn(my).then(function () { if (my === flow) runFlow(); }).catch(caught);
}
function resolveTurn(my: number) { return play(E.playTurn(S, pending), my); }

/* =================== PASS THE PHONE =================== */
function showPass(i: number) {
  var id = S.sides[i].id;
  overlay.className = 'overlay pass';
  overlay.innerHTML = '<div class="pass-card" role="dialog" aria-modal="true" aria-labelledby="ps-t" style="--tc:' + tc(id) + '"><div class="face">' + face(id) + '</div>' +
    '<h2 id="ps-t">Passa il telefono al Giocatore ' + (i + 1) + '</h2><p>Tocca a ' + esc(C[id].name) + '. La mossa del Giocatore ' + (2 - i) + ' è già scelta e resta segreta.</p>' +
    '<button class="btn primary" type="button" id="ps-go">Sono il Giocatore ' + (i + 1) + '</button></div>';
  overlay.hidden = false;
  $('ps-go').addEventListener('click', function () { closeOverlay(); showPrompt(i); setPad(true, i); });
  setTimeout(function () { var b = $('ps-go'); if (b) b.focus(); }, 30);
}

/* =================== RESULT =================== */
function bump(id: string, key: 'w' | 'l') { var r = record.chars[id] || (record.chars[id] = { w: 0, l: 0 }); r[key]++; }
function showResult() {
  var r = S.result, A = S.sides[0], B = S.sides[1];
  if (!S.recorded) {
    S.recorded = true;
    if (S.boss) {
      var x = record.exam[A.id] || (record.exam[A.id] = { p: 0, f: 0, best: null, lode: false });
      if (r === 'win' && S.winner === 0) {
        x.p++; bump(A.id, 'w');
        var g = S.grade!, val = g.lode ? 31 : g.g, bestVal = x.best == null ? -1 : (x.lode ? 31 : x.best);
        if (val > bestVal) { x.best = g.g; x.lode = g.lode; }
      } else { x.f++; bump(A.id, 'l'); }
    } else if (r === 'win') { bump(S.sides[S.winner!].id, 'w'); bump(S.sides[1 - S.winner!].id, 'l'); }
    saveRecord(); renderLibretto();
  }
  var star: string, stamp: string, sub = '', first: [number, string | undefined] | null, second: [number, string | undefined] | null;
  if (S.boss) {
    star = A.id;
    stamp = r === 'win' && S.winner === 0 ? 'Superato' : r === 'time' ? 'Ritirato' : 'Bocciato';
    var won = r === 'win' && S.winner === 0;
    first = won ? [0, C[A.id].lines.win] : r === 'time' ? [1, C.esame.lines.time] : [0, C[A.id].lines.ko];
    second = won ? [1, C.esame.lines.ko] : r === 'time' ? (C[A.id].lines.time ? [0, C[A.id].lines.time] : null) : [1, C.esame.lines.win];
  } else if (r === 'win') {
    var w = S.sides[S.winner!], l = S.sides[1 - S.winner!];
    star = w.id;
    stamp = 'Vince ' + C[w.id].name;
    if (S.mode === 'pvp') sub = 'Giocatore ' + (S.winner! + 1);
    else sub = S.winner === 0 ? 'Hai vinto' : 'Ha vinto il computer';
    first = [S.winner!, C[w.id].lines.win]; second = [1 - S.winner!, C[l.id].lines.ko];
  } else { star = A.id; stamp = 'Pareggio'; first = null; second = null; }
  var story = S.story, storyWon = !!story && r === 'win' && S.winner === 0;
  if (story && COVI && COVI[story.covo]) sub = COVI[story.covo].name;
  var expr = r === 'win' ? (S.boss && S.winner === 1 ? 'sleepy' : 'cool') : 'worried';
  var gradeHtml = S.boss && S.grade ? '<div class="grade"><span>Voto</span><strong>' + (S.grade.lode ? '30 e lode' : S.grade.g + '/30') + '</strong></div>' : (sub ? '<div class="grade"><span>' + esc(sub) + '</span></div>' : '');
  var me = S.winner != null ? S.sides[S.winner].st : A.st;
  var h = '<div class="res" role="dialog" aria-modal="true" aria-labelledby="res-t" style="--tc:' + tc(star) + '">' +
    '<div class="res-art">' + bust(star, expr, '', '0 0 260 270') + '<div class="stamp" id="res-t">' + esc(stamp) + '</div>' + gradeHtml + '</div><div class="res-body">';
  [first, second].forEach(function (q) { if (q) h += '<p class="say"><small>' + esc(sideName(q[0])) + '</small>«' + esc(q[1]) + '»</p>'; });
  h += '<div class="res-stats"><div><span>Turni</span><strong>' + S.turn + '</strong></div><div><span>Danni</span><strong>' + me.dmg + '</strong></div><div><span>Critici</span><strong>' + me.crits + '</strong></div><div><span>Cure</span><strong>' + me.heals + '</strong></div></div>' +
    '<div class="res-actions">' + (story
      ? (storyWon ? '<button class="btn primary wide" type="button" id="st-go">Continua</button>'
        : '<button class="btn primary" type="button" id="st-retry">Riprova</button><button class="btn" type="button" id="st-go">Torna a ' + esc(storyCity(story)) + '</button>')
      : '<button class="btn primary" type="button" id="again">Rivincita</button><button class="btn" type="button" id="change">Cambia sfida</button><button class="btn wide" type="button" id="back">Torna ai personaggi</button>') +
    '</div></div></div>';
  overlay.className = 'overlay result';
  overlay.innerHTML = h;
  overlay.hidden = false;
  var cfg: BattleConfig = { a: A.id, b: B.id, mode: S.mode, story: story, safe: S.safe };
  if (story) {
    $('st-go').addEventListener('click', function () { backToWorld(story!, storyWon, false); });
    if ($('st-retry')) $('st-retry').addEventListener('click', function () { closeOverlay(); startBattle(cfg); });
    setTimeout(function () { var b = $('st-retry') || $('st-go'); if (b) b.focus(); }, 50);
    return;
  }
  $('again').addEventListener('click', function () { closeOverlay(); startBattle(cfg); });
  $('change').addEventListener('click', function () { goHome(); view.p1 = cfg.a as FriendId; view.p2 = cfg.b; view.mode = cfg.mode; renderSetup(); });
  $('back').addEventListener('click', function () { closeOverlay(); goHome(); });
  setTimeout(function () { var b = $('again'); if (b) b.focus(); }, 50);
}

/* =================== IN-BATTLE SHEET =================== */
function openSheet() {
  if (!S) return;
  var h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t"><div class="sheet-h"><h2 id="sh-t">Scheda della lotta</h2><button class="tb-btn" type="button" id="sh-x">Chiudi</button></div>';
  [0, 1].forEach(function (i) {
    var c = C[S.sides[i].id];
    h += '<div class="card" style="--tc:' + TC[c.type] + '"><div class="block"><h3>' + esc(sideLabel(i) + ' · ' + c.name) + '</h3>';
    if (c.id === 'esame' && !S.sides[i].revealed) h += '<p class="unknown">Statistiche e mosse ancora sconosciute. Antonio può analizzarlo con Diagnosi Energetica; con gli altri lo scopri giocando.</p></div>';
    else {
      var st = c.stats;
      h += '<div class="mini-stats"><div><span>Vita</span><strong>' + st.hp + '</strong></div><div><span>Attacco</span><strong>' + st.atk + '</strong></div><div><span>Difesa</span><strong>' + st.def + '</strong></div><div><span>Velocità</span><strong>' + st.spe + '</strong></div></div></div>' + charBlocks(c);
    }
    h += '</div>';
  });
  h += '<div class="card"><div class="block"><h3>Tipi</h3><ul class="cycle-why">';
  E.TYPE_ORDER.forEach(function (t) { h += '<li>' + typeTag(t) + '<span>batte ' + E.TYPES[t].beats + ': ' + E.TYPES[t].why + '.</span></li>'; });
  h += '</ul></div></div></div>';
  overlay.className = 'overlay';
  overlay.innerHTML = h;
  overlay.hidden = false;
  $('sh-x').addEventListener('click', closeOverlay);
  setTimeout(function () { var b = $('sh-x'); if (b) b.focus(); }, 30);
}

/* =================== NAVIGATION =================== */
export function startBattle(cfg: BattleConfig | null, restore?: boolean) {
  if (!restore) {
    var seed = (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
    S = E.newBattle({ a: cfg!.a, b: cfg!.b, mode: cfg!.mode, seed: seed, safe: cfg!.safe });
    S.story = cfg!.story || null;
  }
  flow++;
  if (stopSay) stopSay();
  if (WORLD) WORLD.close();
  view.screen = 'battle';
  home.hidden = true; battle.hidden = false;
  document.body.classList.add('in-battle');
  window.scrollTo(0, 0);
  renderShell();
  uiHp = [S.sides[0].hp, S.sides[1].hp];
  shown.revealed = [true, S.mode === 'pvp' || S.sides[1].id !== 'esame' || S.sides[1].revealed];
  setHp(0, uiHp[0]); setHp(1, uiHp[1]);
  renderSync(E.snap(S));
  setPad(false, 0);
  runFlow();
}
export function goHome() {
  flow++;
  if (stopSay) stopSay();
  tapHandler = null;
  view.screen = 'home';
  if (WORLD) WORLD.close();
  battle.hidden = true; battle.innerHTML = '';
  home.hidden = false;
  document.body.classList.remove('in-battle');
  closeOverlay();
  renderLibretto();
  renderStory();
}
/* a story battle is over (or abandoned): back to the map, where the covo reacts */
function backToWorld(story: { covo: string }, won: boolean, quit: boolean) {
  flow++;
  if (stopSay) stopSay();
  tapHandler = null;
  battle.hidden = true; battle.innerHTML = '';
  document.body.classList.remove('in-battle');
  closeOverlay();
  renderLibretto();
  S = null as unknown as BattleState;
  if (WORLD) WORLD.afterBattle({ covo: story.covo, won: won, quit: !!quit });
  else goHome();
}
/** the battle screen as one object, with the same names the old window.UI had */
export const UI = {
  startBattle: startBattle, goHome: goHome, setScreen: function (s: string) { view.screen = s; },
  /* the computer's choice for the side that has to move, on a copy so the battle's dice stay untouched (playtests) */
  _debug: {
    suggest: function () { return S && S.phase === 'select' && needQ.length ? E.ai(JSON.parse(JSON.stringify(S)), needQ[0]) : null; },
    battle: function () { return S ? { a: S.sides[0].id, b: S.sides[1].id, story: S.story, safe: S.safe } : null; }
  }
};

/** a battle saved by the artifact's hot reload: pick it up where it was */
export function resumeBattle(b: BattleState) {
  S = b;
  if (S.phase === 'busy') S.phase = 'begin';
  startBattle(null, true);
}

/** the battle's keys; registered after the story's, which stop the keys that belong to the map */
export function installBattleKeys() {
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden && !overlay.classList.contains('result') && !overlay.classList.contains('pass')) { closeOverlay(); return; }
    if (view.screen !== 'battle' || !overlay.hidden) return;
    if (e.key === ' ' || e.key === 'Enter') { if (tapHandler) { e.preventDefault(); advance(); } return; }
    if (/^[1-4]$/.test(e.key) && padOn) { var m = C[S.sides[padSide].id].moves[+e.key - 1]; if (m) onMove(m.id); }
  });
}
