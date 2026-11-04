import { CHARS as C, type CharId, type FighterId, type FriendId, type Move } from '../data/characters';
import { fighter } from '../data/fighters';
import { SPECIES, isSpecies } from '../data/creatures';
import { sfx } from '../audio';
import { scene, sceneInfo } from '../render/svg/scenes';
import { darkness } from '../story/daytime';
import type { TypeName } from '../data/types';
import { COVI } from '../data/covi';
import { ENGINE as E, type BattleEvent, type BattleState, type Mode, type Snap, type SideOpts, type StoryTag } from '../battle';
import { SPR } from '../render/svg';
import { record, saveRecord } from '../save/libretto';
import { reduced, esc, each, $ } from './dom';
import { ico } from './icons';
import { TC, tc, typeTag, face, bust, sleep, home, battle, overlay, view, closeOverlay } from './common';
import { charBlocks, renderLibretto, renderStory, renderSetup, storyCity } from './home';
import { pulse, fx, anchor, projectile, popAt, robotFall, robotFix, FOX, BALL, confetti, notes, scan, banner, impact, streaks, ring, dust, healing } from './effects';
import { WORLD } from './story-screen';
import { castSpell, castSelf, arrive, throwNet, bagIcon, fadeOut } from './spells';
import { runeIcon } from '../render/svg/creatures';
import { soundButton } from './sound';
import { music, cueBattle, typeBlip } from '../audio';

/* The battle screen. It knows no rules: it asks the engine for events, labels and chips, and plays them back. */

const CANCEL = { cancelled: true };
/** what a battle is started with */
export interface BattleConfig { a: FighterId; b: FighterId; mode: Mode; story?: StoryTag | null; safe?: string[]; sideA?: SideOpts; sideB?: SideOpts; wild?: boolean; bag?: Record<string, number>; trainer?: string }
/** the battle on show; null between battles, and everything that reads it runs during one */
export let S = null as unknown as BattleState;

/* =================== BATTLE SHELL =================== */
export let arena: HTMLElement;
let dialog: HTMLElement, whoEl: HTMLElement, txtEl: HTMLElement, pad: HTMLElement, turnbar: HTMLElement, padSide = 0, padOn = false, pending: Record<number, string> = {}, needQ: number[] = [];
/** a side's name: the one Antonio gave his creature, or the character's */
function sideName(i: number): string { return S.sides[i].nick || fighter(S.sides[i].id).name; }
function sideLabel(i: number): string { return S.mode === 'pvp' ? 'G' + (i + 1) : (i === 0 ? 'Tu' : 'CPU'); }
function boxHtml(i: number): string {
  var c = fighter(S.sides[i].id), lv = S.sides[i].lvl;
  return '<div class="box ' + (i === 0 ? 'me' : 'opp') + '" id="box-' + i + '"><div class="box-h"><b>' + esc(S.sides[i].nick || c.name) + (lv ? ' <small class="lv">Lv ' + lv + '</small>' : '') + '</b><span class="chip tag">' + sideLabel(i) + '</span></div>' +
    '<div class="hp"><em>PS</em><div class="hpbar" id="hp-' + i + '"><i class="lag"></i><span></span></div></div>' +
    '<div class="box-f"><span class="type t-' + c.type.toLowerCase() + '" id="ty-' + i + '">' + c.type + '</span><div class="chips" id="chips-' + i + '"></div><span class="hpnum" id="hpn-' + i + '"></span></div></div>';
}
/* a story battle happens somewhere in Formia: that part of town, drawn, over the whole screen (by night at night);
   the fighters stand on platforms of its ground */
function sceneHtml(): string {
  var id = S.story && S.story.scene;
  battle.classList.toggle('has-scene', !!id);
  if (!id) { battle.style.removeProperty('--plat'); return ''; }
  var info = sceneInfo(id), dark = darkness(new Date()) > 0.5;
  battle.style.setProperty('--plat', info.ground);
  battle.classList.toggle('night', dark);
  return '<div class="scene" role="img" aria-label="' + esc(info.title) + '">' + scene(id, dark) + '</div>';
}
function renderShell() {
  var a = S.sides[0].id, b = S.sides[1].id;
  battle.innerHTML = sceneHtml() +
    '<div class="topbar"><button class="tb-btn" type="button" id="quit">Esci</button>' +
    '<div class="clock" id="clock">' + (S.boss ? ico('clock') + '<span id="clock-t">2:00</span>' : '') + '<span class="turn" id="turn-t">Turno 1</span></div>' +
    '<div class="tb-right">' + soundButton() + '<button class="tb-btn" type="button" id="info">Scheda</button></div></div>' +
    '<div class="arena" id="arena">' + boxHtml(1) +
    '<div class="spr-wrap opp" id="w-1"><div class="mover" id="m-1"><div class="bob">' + bust(b, b === 'esame' ? 'idle' : 'smirk', '', undefined, S.sides[1].gold) + '</div></div></div>' +
    '<div class="spr-wrap me" id="w-0"><div class="mover" id="m-0"><div class="bob">' + bust(a, 'smirk', '', undefined, S.sides[0].gold) + '</div></div></div>' + boxHtml(0) + '</div>' +
    '<div class="dialog" id="dialog" role="status" aria-live="polite"><span class="who" id="who" hidden></span><span class="txt" id="txt"></span><span class="caret" aria-hidden="true"></span></div>' +
    '<div class="turnbar" id="turnbar" hidden></div>' +
    '<div class="pad off" id="pad">' + [0, 1, 2, 3].map(function (k) { return '<button class="mv" type="button" data-k="' + k + '" disabled></button>'; }).join('') + '<div class="bagrow" id="bagrow" hidden></div></div>';
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
const counting: (ReturnType<typeof setTimeout> | null)[] = [null, null];
function hpText(i: number, hp: number) { $('hpn-' + i).textContent = shown.revealed[i] ? hp + '/' + S.sides[i].max : '??'; }
/** the HP bar. On a hit the colour drops at once and a pale band shows what was lost, then follows it down; on a heal
    the pale band jumps ahead and the colour fills up to it. With no `how`, all at once */
export function setHp(i: number, hp: number, how?: 'hit' | 'heal') {
  var max = S.sides[i].max, bar = $('hp-' + i), pct = Math.max(0, Math.min(100, hp / max * 100));
  var fill = bar.querySelector('span') as HTMLElement, lag = bar.querySelector('.lag') as HTMLElement | null;
  fill.style.width = pct + '%';
  if (lag) { lag.style.transition = how === 'hit' && !reduced ? 'width .75s cubic-bezier(.4, 0, .2, 1) .45s' : 'none'; lag.style.width = pct + '%'; }
  bar.classList.toggle('mid', pct <= 50 && pct > 20);
  bar.classList.toggle('low', pct <= 20);
  if (!counting[i]) hpText(i, hp);
}
/** the HP number runs down (or up) to the new value, as the bar moves */
function countHp(i: number, from: number, to: number) {
  if (counting[i]) clearTimeout(counting[i]!);
  counting[i] = null;
  if (reduced || from === to) { hpText(i, to); return; }
  var t0 = Date.now(), ms = 700;
  function tick() {
    var u = Math.min(1, (Date.now() - t0) / ms);
    hpText(i, Math.round(from + (to - from) * (1 - (1 - u) * (1 - u))));
    counting[i] = u < 1 ? setTimeout(tick, 30) : null;
  }
  tick();
}
function renderSync(sn: Snap) {
  for (var i = 0; i < 2; i++) {
    shown.revealed[i] = i === 0 || S.mode === 'pvp' || S.sides[i].id !== 'esame' || sn.revealed[i];
    $('chips-' + i).innerHTML = sn.chips[i].map(function (c) { return '<span class="chip ' + c.c + '" title="' + esc(c.d) + '">' + ico(c.i) + esc(c.t) + '</span>'; }).join('');
    if (!counting[i]) hpText(i, uiHp[i]);
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
/** the moves on a side's pad: the four it knows */
function padMoves(i: number): Move[] {
  var side = S.sides[i], c = fighter(side.id);
  return c.moves.filter(function (m) { return !side.known || side.known.indexOf(m.id) >= 0; }).slice(0, 4);
}
/** what is in the bag in a story battle: the nets Antonio has (only against a wild creature) and the tiella */
function bagMoves(i: number): Move[] {
  if (i !== 0 || !S.bag) return [];
  return E.BAG_IDS.filter(function (id) { return (S.bag![id] || 0) > 0 && (id === 'tiella' || S.wild); }).map(function (id) { return E.BAG[id]; });
}
/* the words for how well a creature's spell works on the one in front (the engine's effLevel) */
const EFF_WORD: Record<string, string> = { '2': 'Doppio vantaggio', '1': 'Superefficace', '-1': 'Poco efficace', '-2': 'Per niente efficace' };
function moveButton(b: HTMLButtonElement, i: number, m: Move) {
  var L = E.moveLabel(S, i, m.id), sub = '', creatureSide = isSpecies(S.sides[i].id), bag = !!E.BAG[m.id];
  if (L.dots) sub = '<span class="stage">' + L.dots.map(function (on) { return '<i class="' + (on ? 'on' : '') + '"></i>'; }).join('') + '</span>' + esc(L.sub);
  else sub = (L.icon && !(creatureSide && !bag) ? ico(L.icon) : '') + esc(L.sub);
  if (L.left != null && !L.locked) sub += '<span class="left">' + L.left + (L.left === 1 ? ' uso' : ' usi') + '</span>';
  /* a creature's move wears the colour and the rune of its magic, and says how it does against the one in front */
  var lvl = L.eff != null ? E.effLevel(L.eff) : 0, tag = lvl ? '<i class="eff ' + (lvl > 0 ? 'up' : 'down') + '">' + EFF_WORD[lvl] + '</i>' : '';
  var rune = creatureSide && !bag ? '<span class="mv-rune">' + (L.mtype ? runeIcon(L.mtype, 34) : ico('spark')) + '</span>' : bag ? '<span class="mv-rune">' + bagIcon(m.id) + (L.count != null ? '<i class="cnt">' + L.count + '</i>' : '') + '</span>' : '';
  if (bag) sub = esc(L.sub);
  b.setAttribute('data-id', m.id);
  b.className = 'mv' + (m.kind === 'atk' ? ' atk' : '') + (L.locked ? ' locked' : '') + (bag ? ' bag' : '') + (rune ? ' cr' : '') + (creatureSide && !bag && !L.mtype ? ' plain' : '') +
    /* a net likely to hold now glows: the moment to throw it */
    (bag && L.chance != null && L.chance >= 0.5 ? ' ready' : '');
  b.style.setProperty('--tc', creatureSide && !bag ? (L.mtype ? TC[L.mtype] : 'var(--t-none)') : TC[E.sideType(S, i)]);
  b.innerHTML = rune + '<b>' + esc(m.name) + tag + '</b><small>' + sub + '</small>';
  b.disabled = !padOn || L.locked;
  b.setAttribute('aria-label', m.name + (L.locked ? ', non disponibile' : '') + '. ' + (lvl ? EFF_WORD[lvl] + '. ' : '') + L.sub);
}
function renderPad(i: number) {
  padSide = i;
  var ms = padMoves(i);
  each(pad.querySelectorAll<HTMLButtonElement>('.mv[data-k]'), function (b, k) {
    var m = ms[k];
    if (!m) { b.hidden = true; return; }
    b.hidden = false;
    moveButton(b, i, m);
  });
  /* the bag: one button for each kind of net Antonio carries; against a wild creature with no nets, where to buy them */
  var row = $('bagrow'), bag = bagMoves(i);
  row.hidden = !(i === 0 && S.bag && (bag.length || S.wild));
  if (row.hidden) { row.innerHTML = ''; return; }
  row.innerHTML = '<span class="bag-h">' + ico('ball') + 'Borsa</span>' + (bag.length ? bag.map(function (m) { return '<button class="mv bag" type="button"></button>'; }).join('') :
    '<span class="bag-none">Nessun retino nella borsa: li vende il retaio di Gianola, accanto al guardaparco.</span>');
  each(row.querySelectorAll<HTMLButtonElement>('.mv'), function (b, k) { moveButton(b, i, bag[k]); });
}
function setPad(on: boolean, i?: number | null) { padOn = on; pad.classList.toggle('off', !on); renderPad(i == null ? padSide : i); }

/* ---------- dialogue ---------- */
let tapHandler: (() => void) | null = null, stopSay: (() => void) | null = null;
function advance() { if (tapHandler) tapHandler(); }
/** a line in the dialog, typed out; `quick` when a spell follows, which starts as soon as the line is written
    (the line stays up during the show) */
function say(text: string, who?: number | null, quick?: boolean): Promise<void> {
  return new Promise<void>(function (resolve) {
    var wEl = whoEl, tEl = txtEl, dEl = dialog;
    if (who != null) { wEl.hidden = false; wEl.textContent = sideName(who); wEl.style.setProperty('--tc', TC[fighter(S.sides[who].id).type]); }
    else wEl.hidden = true;
    var full = who != null ? '«' + text + '»' : text, n = 0, typing = true, tt: ReturnType<typeof setTimeout> | undefined, hold: ReturnType<typeof setTimeout> | undefined, mine: () => void;
    dEl.classList.remove('wait');
    tEl.textContent = '';
    function stop() { clearTimeout(tt); clearTimeout(hold); if (tapHandler === mine) tapHandler = null; }
    function done() { stop(); dEl.classList.remove('wait'); resolve(); }
    function finish() {
      typing = false; tEl.textContent = full; dEl.classList.add('wait');
      hold = setTimeout(done, reduced ? 1400 : quick ? 320 : Math.min(2400, 750 + full.length * 18));
    }
    function step() {
      if (!typing) return;
      n += 2; tEl.textContent = full.slice(0, n); typeBlip(who != null);
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
    turnbar.style.setProperty('--tc', TC[fighter(S.sides[i].id).type]);
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
/* the words over a damage number: how well the hit worked (the engine's effLevel) */
const EFF_TAG: Record<string, string> = { '2': 'Doppio vantaggio!', '1': 'Superefficace!', '-1': 'Poco efficace', '-2': 'Per niente efficace' };
function hpEvent(ev: Extract<BattleEvent, { k: 'hp' }>) {
  var i = ev.who, m = $('m-' + i), before = uiHp[i];
  uiHp[i] = ev.hp;
  if (ev.dmg) {
    m.classList.remove('shake', 'flash'); void m.offsetWidth; m.classList.add('shake', 'flash');
    impact(i, ev.crit);
    var lvl = E.effLevel(ev.eff == null ? 1 : ev.eff), cls = ev.crit ? ' crit' : '', tags = '';
    if (ev.crit) tags += '<em>Critico!</em>';
    if (lvl) { tags += '<em>' + EFF_TAG[lvl] + '</em>'; cls += lvl > 1 ? ' super2' : lvl > 0 ? ' super' : ' weak'; }
    var p = anchor(i, 0.5, i === 0 ? 0.14 : 0.08);
    fx(tags + '<b>−' + ev.dmg + '</b>', 'num' + cls, p[0], p[1], 1500);
    setHp(i, ev.hp, 'hit'); countHp(i, before, ev.hp);
    return sleep(600).then(function () { m.classList.remove('shake', 'flash'); });
  }
  if (!ev.quiet) { m.classList.add('glow'); healing(i); }
  var q = anchor(i, 0.5, i === 0 ? 0.14 : 0.08);
  fx('<b>+' + ev.heal + '</b>', 'num heal', q[0], q[1], 1400);
  setHp(i, ev.hp, 'heal'); countHp(i, before, ev.hp);
  return sleep(ev.quiet ? 350 : 650).then(function () { m.classList.remove('glow'); });
}
/** a move of the side's own, by id */
function moveOf(i: number, id?: string): Move | null {
  if (!id) return null;
  var ms = fighter(S.sides[i].id).moves;
  for (var k = 0; k < ms.length; k++) if (ms[k].id === id) return ms[k];
  return null;
}
/** what the engine's next events say about a spell: it hits (how hard), it misses, or it does no damage */
function outcomeOf(evs: BattleEvent[], n: number, to: number): { outcome: 'hit' | 'miss' | 'none'; crit: boolean; lvl: number } {
  for (var k = n; k < evs.length && k < n + 8; k++) {
    var e = evs[k];
    if (e.k === 'hp' && e.who === to && e.dmg) return { outcome: 'hit', crit: !!e.crit, lvl: E.effLevel(e.eff == null ? 1 : e.eff) };
    if (e.k === 'anim' && e.a === 'dodge' && e.who === to) return { outcome: 'miss', crit: false, lvl: 0 };
    if (e.k === 'sync' || (e.k === 'anim' && (e.a === 'magic' || e.a === 'magicUp'))) break;
  }
  return { outcome: 'none', crit: false, lvl: 0 };
}
/** after a net: does the engine say the creature is caught? */
function outcomeHeld(evs: BattleEvent[], n: number): boolean {
  for (var k = n; k < evs.length && k < n + 4; k++) { var e = evs[k]; if (e.k === 'anim' && e.a === 'caught') return true; if (e.k === 'say') return false; }
  return false;
}
/** a spell comes right after this line (an expression in between does not count) */
function spellNext(evs: BattleEvent[], n: number): boolean {
  for (var k = n; k < evs.length && k < n + 3; k++) { var e = evs[k]; if (e.k === 'expr') continue; return e.k === 'anim' && (e.a === 'magic' || e.a === 'magicUp'); }
  return false;
}
/** the side that has just cast a spell: its lunge after a miss is already in the show */
let lastSpell = -1;
function animEvent(ev: Extract<BattleEvent, { k: 'anim' }>, evs: BattleEvent[], next: number): Promise<unknown> {
  var i = ev.who, j = 1 - i, m = $('m-' + i), spelled = lastSpell === i;
  lastSpell = ev.a === 'magic' ? i : -1;
  switch (ev.a) {
    case 'lunge': if (spelled) return Promise.resolve(); streaks(i); return pulse(m, i === 0 ? 'lunge-me' : 'lunge-opp', 340);
    case 'dodge': return pulse(m, 'dodge', 400);
    case 'enter': {
      /* a creature comes on in a burst of its magic; a person just walks in */
      var eid = S.sides[i].id;
      if (isSpecies(eid)) arrive(i, SPECIES[eid].type, SPECIES[eid].type2);
      else sleep(380).then(function () { var e = anchor(i, 0.5, 0.86); ring(e[0], e[1], '#ffffff', 180, 520, true); });
      return pulse(m, 'enter', 560);
    }
    case 'faint': {
      m.classList.add(i === 0 ? 'faint-me' : 'faint-opp'); sleep(500).then(function () { dust(i); });
      var fid = S.sides[i].id;
      if (isSpecies(fid)) fadeOut(i, SPECIES[fid].type, SPECIES[fid].type2);
      return sleep(950);
    }
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
    case 'net': return throwNet(i, j, ev.item || 'retino', ev.shakes || 0, outcomeHeld(evs, next));
    /* the creatures' magic, as a show of its type (ui/spells.ts): it resolves on the hit, so the damage lands on it */
    case 'magic': {
      var t = ev.style as TypeName, mv = moveOf(i, ev.move), o = outcomeOf(evs, next, j), sid = S.sides[i].id;
      return castSpell(i, j, { type: mv && mv.plain ? null : t, name: mv ? mv.name : '', power: (mv && mv.power) || 40, sig: !!mv && isSpecies(sid) && SPECIES[sid].sig === mv.id, outcome: o.outcome, crit: o.crit, lvl: o.lvl,
        drain: !!(mv && mv.drain), quick: !!(mv && mv.priority) });
    }
    case 'magicUp': {
      var mu = moveOf(i, ev.move), su = S.sides[i].id;
      return castSelf(i, ev.style as TypeName, mu ? mu.name : '', !!mu && isSpecies(su) && SPECIES[su].sig === mu.id);
    }
    case 'caught': if (m.classList.contains('innet')) return sleep(reduced ? 60 : 500); m.classList.add('caught'); return sleep(800);
    default: return Promise.resolve();
  }
}
function stepEvent(ev: BattleEvent, evs: BattleEvent[], next: number): Promise<unknown> {
  cueBattle(ev);
  /* a creature speaking is its cry */
  if (ev.k === 'line') { var sid = S.sides[ev.who].id; if (isSpecies(sid)) sfx('cry-' + SPECIES[sid].art.body); }
  switch (ev.k) {
    case 'say': return say(ev.text, null, spellNext(evs, next));
    case 'line': return say(ev.text, ev.who);
    case 'expr': setExpr(ev.who, ev.v); return Promise.resolve();
    case 'anim': return animEvent(ev, evs, next);
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
    var ev = evs[n++];
    if (ev.k !== 'anim') lastSpell = ev.k === 'say' || ev.k === 'expr' ? lastSpell : -1;
    return stepEvent(ev, evs, n).then(next);
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
    '<h2 id="ps-t">Passa il telefono al Giocatore ' + (i + 1) + '</h2><p>Tocca a ' + esc(fighter(id).name) + '. La mossa del Giocatore ' + (2 - i) + ' è già scelta e resta segreta.</p>' +
    '<button class="btn primary" type="button" id="ps-go">Sono il Giocatore ' + (i + 1) + '</button></div>';
  overlay.hidden = false;
  $('ps-go').addEventListener('click', function () { closeOverlay(); showPrompt(i); setPad(true, i); });
  setTimeout(function () { var b = $('ps-go'); if (b) b.focus(); }, 30);
}

/* =================== RESULT =================== */
/* the libretto counts the friends' battles; the creatures of the story are not in it */
function bump(id: string, key: 'w' | 'l') { if (!(id in C)) return; var r = record.chars[id] || (record.chars[id] = { w: 0, l: 0 }); r[key]++; }
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
  music(r === 'win' && (S.winner === 0 || S.mode === 'pvp') ? 'victory' : 'defeat');
  var star: string, stamp: string, sub = '', first: [number, string | undefined] | null, second: [number, string | undefined] | null;
  if (S.boss) {
    star = A.id;
    stamp = r === 'win' && S.winner === 0 ? 'Superato' : r === 'time' ? 'Ritirato' : 'Bocciato';
    var won = r === 'win' && S.winner === 0;
    var fa = fighter(A.id);
    first = won ? [0, fa.lines.win] : r === 'time' ? [1, C.esame.lines.time] : [0, fa.lines.ko];
    second = won ? [1, C.esame.lines.ko] : r === 'time' ? (fa.lines.time ? [0, fa.lines.time] : null) : [1, C.esame.lines.win];
  } else if (r === 'catch') {
    star = B.id; stamp = 'Preso!'; sub = fighter(B.id).name + ' è con te';
    first = [1, fighter(B.id).lines.win]; second = null;
  } else if (r === 'win') {
    var w = S.sides[S.winner!], l = S.sides[1 - S.winner!];
    star = w.id;
    stamp = 'Vince ' + sideName(S.winner!);
    if (S.mode === 'pvp') sub = 'Giocatore ' + (S.winner! + 1);
    else sub = S.winner === 0 ? 'Hai vinto' : 'Ha vinto il computer';
    first = [S.winner!, fighter(w.id).lines.win]; second = [1 - S.winner!, fighter(l.id).lines.ko];
  } else { star = A.id; stamp = 'Pareggio'; first = null; second = null; }
  var story = S.story, storyWon = !!story && ((r === 'win' && S.winner === 0) || r === 'catch');
  if (story && story.covo && COVI[story.covo]) sub = COVI[story.covo].name;
  var expr = r === 'win' || r === 'catch' ? (S.boss && S.winner === 1 ? 'sleepy' : 'cool') : 'worried';
  var gradeHtml = S.boss && S.grade ? '<div class="grade"><span>Voto</span><strong>' + (S.grade.lode ? '30 e lode' : S.grade.g + '/30') + '</strong></div>' : (sub ? '<div class="grade"><span>' + esc(sub) + '</span></div>' : '');
  var me = S.winner != null ? S.sides[S.winner].st : A.st;
  var h = '<div class="res" role="dialog" aria-modal="true" aria-labelledby="res-t" style="--tc:' + tc(star) + '">' +
    '<div class="res-art">' + bust(star, expr, '', '0 0 260 270', (star === A.id && A.gold) || (star === B.id && B.gold)) + '<div class="stamp" id="res-t">' + esc(stamp) + '</div>' + gradeHtml + '</div><div class="res-body">';
  [first, second].forEach(function (q) { if (q) h += '<p class="say"><small>' + esc(sideName(q[0])) + '</small>«' + esc(q[1]) + '»</p>'; });
  h += '<div class="res-stats"><div><span>Turni</span><strong>' + S.turn + '</strong></div><div><span>Danni</span><strong>' + me.dmg + '</strong></div><div><span>Critici</span><strong>' + me.crits + '</strong></div><div><span>Cure</span><strong>' + me.heals + '</strong></div></div>' +
    '<div class="res-actions">' + (story
      /* a lost battle with creatures goes on on the map (another creature, or Antonio himself): no retry here */
      ? (storyWon || !story.covo ? '<button class="btn primary wide" type="button" id="st-go">Continua</button>'
        : '<button class="btn primary" type="button" id="st-retry">Riprova</button><button class="btn" type="button" id="st-go">Torna a ' + esc(storyCity(story)) + '</button>')
      : '<button class="btn primary" type="button" id="again">Rivincita</button><button class="btn" type="button" id="change">Cambia sfida</button><button class="btn wide" type="button" id="back">Torna ai personaggi</button>') +
    '</div></div></div>';
  overlay.className = 'overlay result';
  overlay.innerHTML = h;
  overlay.hidden = false;
  var cfg: BattleConfig = { a: A.id, b: B.id, mode: S.mode, story: story, safe: S.safe, sideA: { stats: A.stats, lvl: A.lvl, known: A.known, nick: A.nick, gold: A.gold, perk: A.perk },
    sideB: { stats: B.stats, lvl: B.lvl, known: B.known, nick: B.nick, gold: B.gold, perk: B.perk }, wild: S.wild, bag: S.bag, trainer: S.trainer };
  if (story) {
    $('st-go').addEventListener('click', function () { backToWorld(story!, storyWon, false); });
    if ($('st-retry')) $('st-retry').addEventListener('click', function () { closeOverlay(); startBattle(cfg); });
    setTimeout(function () { var b = $('st-retry') || $('st-go'); if (b) b.focus(); }, 50);
    return;
  }
  $('again').addEventListener('click', function () { closeOverlay(); startBattle(cfg); });
  $('change').addEventListener('click', function () { goHome(); view.p1 = cfg.a as FriendId; view.p2 = cfg.b as CharId; view.mode = cfg.mode; renderSetup(); });
  $('back').addEventListener('click', function () { closeOverlay(); goHome(); });
  setTimeout(function () { var b = $('again'); if (b) b.focus(); }, 50);
}

/* =================== IN-BATTLE SHEET =================== */
function openSheet() {
  if (!S) return;
  var h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t"><div class="sheet-h"><h2 id="sh-t">Scheda della lotta</h2><button class="tb-btn" type="button" id="sh-x">Chiudi</button></div>';
  [0, 1].forEach(function (i) {
    var c = fighter(S.sides[i].id), lvl = S.sides[i].lvl;
    h += '<div class="card" style="--tc:' + TC[c.type] + '"><div class="block"><h3>' + esc(sideLabel(i) + ' · ' + c.name + (lvl ? ' · Lv ' + lvl : '')) + '</h3>';
    if (c.id === 'esame' && !S.sides[i].revealed) h += '<p class="unknown">Statistiche e mosse ancora sconosciute. Antonio può analizzarlo con Diagnosi Energetica; con gli altri lo scopri giocando.</p></div>';
    else {
      var st = S.sides[i].stats || c.stats;
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
/** a battle with creatures opens as in the Pokémon games: a flash, then bars over the screen slide away one after the
    other (dark for a wild one, red for a trainer) */
function curtain(trainer: boolean) {
  if (reduced) return;
  var el = document.createElement('div');
  el.className = 'curtain' + (trainer ? ' trainer' : '');
  el.setAttribute('aria-hidden', 'true');
  for (var k = 0; k < 8; k++) el.appendChild(document.createElement('i'));
  document.body.appendChild(el);
  each(el.querySelectorAll<HTMLElement>('i'), function (bar, k) {
    if (bar.animate) bar.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(' + (k % 2 ? 104 : -104) + '%)' }], { duration: 460, delay: 160 + k * 50, easing: 'cubic-bezier(.6, 0, .4, 1)', fill: 'both' });
  });
  setTimeout(function () { el.remove(); }, 1300);
}
export function startBattle(cfg: BattleConfig | null, restore?: boolean) {
  if (!restore) {
    var seed = (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
    S = E.newBattle({ a: cfg!.a, b: cfg!.b, mode: cfg!.mode, seed: seed, safe: cfg!.safe, sideA: cfg!.sideA, sideB: cfg!.sideB, wild: cfg!.wild, bag: cfg!.bag, trainer: cfg!.trainer, night: !!cfg!.wild && darkness(new Date()) > 0.5 });
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
  if (!restore && cfg && cfg.story && (cfg.wild || cfg.trainer)) curtain(!!cfg.trainer);
  music(S.boss ? 'boss' : 'battle');
  uiHp = [S.sides[0].hp, S.sides[1].hp];
  shown.revealed = [true, S.mode === 'pvp' || S.sides[1].id !== 'esame' || S.sides[1].revealed];
  setHp(0, uiHp[0]); setHp(1, uiHp[1]);
  renderSync(E.snap(S));
  setPad(false, 0);
  runFlow();
}
export function goHome() {
  music('home');
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
/* a story battle is over (or abandoned): back to the map, where the covo or the creature reacts and Antonio's team grows */
function backToWorld(story: StoryTag, won: boolean, quit: boolean) {
  var caught = !!S && S.result === 'catch', bag = S ? S.bag : undefined, hp: [number, number] = S ? [S.sides[0].hp, S.sides[1].hp] : [0, 0];
  flow++;
  if (stopSay) stopSay();
  tapHandler = null;
  battle.hidden = true; battle.innerHTML = '';
  document.body.classList.remove('in-battle');
  closeOverlay();
  renderLibretto();
  S = null as unknown as BattleState;
  if (WORLD) WORLD.afterBattle({ tag: story, won: won, quit: !!quit, caught: caught, bag: bag, hp: hp });
  else goHome();
}
/** the battle screen as one object, with the same names the old window.UI had */
export const UI = {
  startBattle: startBattle, goHome: goHome, setScreen: function (s: string) { view.screen = s; },
  /* the computer's choice for the side that has to move, on a copy so the battle's dice stay untouched (playtests) */
  _debug: {
    suggest: function () { return S && S.phase === 'select' && needQ.length ? E.ai(JSON.parse(JSON.stringify(S)), needQ[0]) : null; },
    battle: function () { return S ? { a: S.sides[0].id, b: S.sides[1].id, story: S.story, safe: S.safe } : null; },
    /* a spell's show on demand, to look at the shows: type (null for a plain move), what happens, who casts */
    cast: function (type: TypeName | null, outcome?: 'hit' | 'miss' | 'none', from?: number, o?: { sig?: boolean; crit?: boolean; lvl?: number; power?: number; name?: string; self?: boolean; drain?: boolean; quick?: boolean }) {
      if (!S) return null;
      var i = from || 0, x = o || {};
      if (x.self && type) return castSelf(i, type, x.name || 'Prova', !!x.sig);
      return castSpell(i, 1 - i, { type: type, name: x.name || 'Prova', power: x.power || 60, sig: !!x.sig, outcome: outcome || 'hit', crit: !!x.crit, lvl: x.lvl || 0, drain: !!x.drain, quick: !!x.quick });
    }
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
    if (/^[1-9]$/.test(e.key) && padOn) { var m = padMoves(padSide).concat(bagMoves(padSide))[+e.key - 1]; if (m) onMove(m.id); }
  });
}
