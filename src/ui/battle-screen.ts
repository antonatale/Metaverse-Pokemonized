import { CHARS as C, type CharId, type FighterId, type FriendId, type Move } from '../data/characters';
import { fighter } from '../data/fighters';
import { SPECIES, isSpecies } from '../data/creatures';
import { cry, cryEventOf } from '../audio';
import { scene, sceneInfo } from '../render/svg/scenes';
import { darkness } from '../story/daytime';
import { MAGIC_CHART, MAGIC_ORDER, type TypeName } from '../data/types';
import { COVI } from '../data/covi';
import { STATUS, type StatusId } from '../data/passives';
import { ENGINE as E, type BattleEvent, type BattleState, type Bout, type BenchLabel, type Member, type Mode, type Snap, type SideOpts, type StoryTag } from '../battle';
import { SPR } from '../render/svg';
import { record, saveRecord } from '../save/libretto';
import { reduced, esc, each, $ } from './dom';
import { ico } from './icons';
import { TC, tc, typeTag, face, bust, sleep, home, battle, overlay, view, closeOverlay } from './common';
import { charBlocks, renderLibretto, renderStory, renderSetup, storyCity } from './home';
import { pulse, fx, anchor, projectile, popAt, robotFall, robotFix, FOX, BALL, confetti, notes, scan, banner, impact, streaks, ring, dust, healing } from './effects';
import { WORLD } from './story-screen';
import { dayAfter, dayDecided } from './day-screen';
import { castSpell, castSelf, arrive, throwNet, bagIcon, fadeOut, statShow } from './spells';
import { runeIcon } from '../render/svg/creatures';
import { soundButton } from './sound';
import { music, cueBattle, typeBlip } from '../audio';

/* The battle screen. It knows no rules: it asks the engine for events, labels and chips, and plays them back. */

const CANCEL = { cancelled: true };
/** what a battle is started with */
export interface BattleConfig { a: FighterId; b: FighterId; mode: Mode; story?: StoryTag | null; safe?: string[]; sideA?: SideOpts; sideB?: SideOpts; wild?: boolean; bag?: Record<string, number>; trainer?: string; benchA?: Member[]; benchB?: Member[]; smart?: [number, number]; dark?: boolean; seed?: number; night?: boolean; field?: { type: TypeName; name: string }; shield?: { left: number; name: string }; surgeStart?: number; hero?: string }
/** the battle on show; null between battles, and everything that reads it runs during one */
export let S = null as unknown as BattleState;

/* =================== BATTLE SHELL =================== */
export let arena: HTMLElement;
let dialog: HTMLElement, whoEl: HTMLElement, txtEl: HTMLElement, pad: HTMLElement, turnbar: HTMLElement, padSide = 0, padOn = false, pending: Record<number, string> = {}, needQ: number[] = [], resArmed = false;
/** a side's name: the one Antonio gave his creature, or the character's */
function sideName(i: number): string { return S.sides[i].nick || fighter(S.sides[i].id).name; }
function sideLabel(i: number): string { return S.mode === 'pvp' ? 'G' + (i + 1) : (i === 0 ? 'Tu' : 'CPU'); }
function boxHtml(i: number): string {
  var c = fighter(S.sides[i].id), lv = S.sides[i].lvl;
  return '<div class="box ' + (i === 0 ? 'me' : 'opp') + '" id="box-' + i + '"><div class="box-h"><b>' + esc(S.sides[i].nick || c.name) + (lv ? ' <small class="lv">Lv ' + lv + '</small>' : '') + '</b><span class="surge" id="sg-' + i + '"></span><span class="team-dots" id="dots-' + i + '" aria-hidden="true"></span><span class="chip tag">' + sideLabel(i) + '</span></div>' +
    '<div class="hp"><em>PS</em><div class="hpbar" id="hp-' + i + '"><i class="lag"></i><span></span>' + marksHtml(i) + '</div></div>' +
    '<div class="box-f"><span class="types" id="ty-' + i + '">' + typesHtml(i) + '</span><div class="chips" id="chips-' + i + '"></div><span class="hpnum" id="hpn-' + i + '"></span></div></div>';
}
/** on a legend's health, where each part of the fight starts */
function marksHtml(i: number): string { return (S.sides[i].stages || []).slice(1).map(function (p) { return '<i class="hpmark" style="left:' + p.at * 100 + '%"></i>'; }).join(''); }
/** a side's types, one tag each: two for the creatures' last forms */
function typesHtml(i: number, types?: TypeName[]): string { return (types || E.sideTypes(S, i)).map(function (t) { return '<span class="type t-' + t.toLowerCase() + '">' + t + '</span>'; }).join(''); }
/* a story battle happens somewhere in Formia: that part of town, drawn, over the whole screen (by night at night);
   the fighters stand on platforms of its ground */
function sceneHtml(): string {
  var id = S.story && S.story.scene;
  battle.classList.toggle('has-scene', !!id);
  if (!id) { battle.style.removeProperty('--plat'); return ''; }
  /* a battle of «Un giorno a Formia» has its own hour */
  var info = sceneInfo(id), dark = S.story!.day ? !!S.night : darkness(new Date()) > 0.5;
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
    '<div class="spr-wrap opp" id="w-1"><div class="mover" id="m-1"><div class="bob">' + bust(b, b === 'esame' ? 'idle' : 'smirk', '', undefined, S.sides[1].gold, S.sides[1].form) + '</div></div></div>' +
    '<div class="spr-wrap me" id="w-0"><div class="mover" id="m-0"><div class="bob">' + bust(a, 'smirk', '', undefined, S.sides[0].gold, S.sides[0].form) + '</div></div></div>' + boxHtml(0) + '</div>' +
    '<div class="dialog" id="dialog" role="status" aria-live="polite"><span class="who" id="who" hidden></span><span class="txt" id="txt"></span><span class="caret" aria-hidden="true"></span></div>' +
    '<div class="turnbar" id="turnbar" hidden></div>' +
    '<div class="pad off" id="pad">' + [0, 1, 2, 3].map(function (k) { return '<button class="mv" type="button" data-k="' + k + '" disabled></button>'; }).join('') + '<div class="bagrow" id="bagrow" hidden></div></div>';
  arena = $('arena'); dialog = $('dialog'); whoEl = $('who'); txtEl = $('txt'); pad = $('pad'); turnbar = $('turnbar');
  dialog.addEventListener('click', advance);
  arena.addEventListener('click', advance);
  pad.addEventListener('click', function (e) {
    var bt = (e.target as Element).closest ? (e.target as Element).closest('.mv') : null;
    if (bt && bt.id === 'sw-btn') { askChange(); return; }
    if (bt && bt.id === 'res-btn') { arm(); return; }
    if (bt && bt.getAttribute('data-id')) onMove(bt.getAttribute('data-id')!);
  });
  var q = $('quit'), qt: ReturnType<typeof setTimeout> | undefined;
  q.addEventListener('click', function () {
    if (q.getAttribute('data-armed') === '1' || (S && S.phase === 'over')) {
      clearTimeout(qt);
      /* with the battle already decided, while its last blow plays, this is the same as Continua */
      if (S && S.story) { var ended = S.phase === 'over'; backToWorld(S.story, ended && wonNow(), !ended); } else goHome();
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
/** who the box of each side shows right now: during the playback of a turn the state may already be ahead of the screen */
let onField: string[] = ['', ''];
function renderSync(sn: Snap) {
  for (var i = 0; i < 2; i++) {
    if (sn.who && sn.who[i] !== onField[i]) continue;
    shown.revealed[i] = i === 0 || S.mode === 'pvp' || S.sides[i].id !== 'esame' || sn.revealed[i];
    $('chips-' + i).innerHTML = sn.chips[i].map(function (c) { return '<span class="chip ' + c.c + '" title="' + esc(c.d) + '">' + ico(c.i) + esc(c.t) + '</span>'; }).join('');
    if (!counting[i]) hpText(i, uiHp[i]);
    $('ty-' + i).innerHTML = typesHtml(i, sn.types && sn.types[i]);
    /* a team battle: one dot for each of the team, like the balls in the games */
    if (sn.team && sn.team[i].length > 1) $('dots-' + i).innerHTML = sn.team[i].map(function (d) { return '<i class="' + d + '"></i>'; }).join('');
    /* Slancio: three dots, for whoever can do something with them */
    var sg = $('sg-' + i);
    if (sn.surge && S.sides[i].resonate) { sg.setAttribute('role', 'img'); sg.setAttribute('aria-label', 'Slancio ' + sn.surge[i] + ' su 3'); sg.innerHTML = [0, 1, 2].map(function (k) { return '<i class="' + (k < sn.surge![i] ? 'on' : '') + '"></i>'; }).join(''); } else sg.innerHTML = '';
    var svg = battle.querySelector('#w-' + i + ' .spr-p');
    if (svg) svg.setAttribute('data-ph', sn.ph[i] ? 'on' : 'off');
  }
  if (S.boss) {
    var left = (sn.maxTurns - sn.turn + 1) * 10;
    $('clock-t').textContent = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
    $('clock').classList.toggle('low', left <= 30);
    $('turn-t').textContent = 'Turno ' + sn.turn + ' di ' + sn.maxTurns;
  } else $('turn-t').textContent = 'Turno ' + sn.turn + (sn.place ? ' · ' + sn.place : '');
}
/** the moves on a side's pad: the four it knows */
function padMoves(i: number): Move[] {
  var side = S.sides[i], c = E.charOf(S, i);
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
  /* the bag: one button for each kind of net Antonio carries; against a wild creature with no nets, where to buy them.
     In a team battle the change sits beside it */
  var row = $('bagrow'), bag = bagMoves(i), shelf = i === 0 && !!S.bag && (bag.length > 0 || !!S.wild), sw = E.switches(S, i).length, res = E.canResonate(S, i);
  if (!res) resArmed = false;
  row.hidden = !(shelf || sw || res);
  if (row.hidden) { row.innerHTML = ''; return; }
  row.innerHTML = (shelf ? '<span class="bag-h">' + ico('ball') + 'Borsa</span>' + (bag.length ? bag.map(function (m) { return '<button class="mv bag" type="button"></button>'; }).join('') :
    '<span class="bag-none">Nessun retino nella borsa: li vende il retaio di Gianola, accanto al guardaparco.</span>') : '') +
    (sw ? '<button class="mv swap" type="button" id="sw-btn"' + (padOn ? '' : ' disabled') + '><b>Cambia</b><small>' + esc(E.changeText(S, i).button) + '</small></button>' : '') +
    (res ? '<button class="mv swap res' + (resArmed ? ' armed' : '') + '" type="button" id="res-btn" aria-pressed="' + resArmed + '"' + (padOn ? '' : ' disabled') + '><b>Risonanza</b><small>' + esc(resArmed ? E.resonanceText(S).armed : E.resonanceText(S).button) + '</small></button>' : '');
  each(row.querySelectorAll<HTMLButtonElement>('.mv.bag'), function (b, k) { moveButton(b, i, bag[k]); });
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
  var ms = E.charOf(S, i).moves;
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
      return castSpell(i, j, { type: mv && mv.plain ? null : t, id: mv ? mv.id : undefined, name: mv ? mv.name : '', power: (mv && mv.power) || 40, sig: !!mv && isSpecies(sid) && SPECIES[sid].sig === mv.id, outcome: o.outcome, crit: o.crit, lvl: o.lvl,
        drain: !!(mv && mv.drain), quick: !!(mv && mv.priority) });
    }
    case 'magicUp': {
      var mu = moveOf(i, ev.move), su = S.sides[i].id;
      return castSelf(i, ev.style as TypeName, mu ? mu.name : '', !!mu && isSpecies(su) && SPECIES[su].sig === mu.id, mu ? mu.id : undefined);
    }
    case 'stat': return statShow(i, ev.style || 'atkUp');
    case 'caught': if (m.classList.contains('innet')) return sleep(reduced ? 60 : 500); m.classList.add('caught'); return sleep(800);
    case 'recall': return pulse(m, 'recall', 420).then(function () { m.classList.add('gone'); });
    /* an ability at work says its name by the creature, as in the games */
    case 'abil': return popAt(i, '<div class="abil-pop">' + esc(ev.text || '') + '</div>', '', 0.5, 0.02, 1000);
    case 'status': return popAt(i, '<div class="pop">' + ico(STATUS[ev.style as StatusId].icon) + '</div>', '', 0.5, 0, 900);
    /* a creature answers to the magic of the place, with the show of a move of its own */
    case 'resonance': return banner(ev.text || '', 'stage').then(function () { return castSelf(i, ev.style as TypeName, 'Risonanza', true); });
    /* a boss's magic in pieces */
    case 'broken': pulse(arena, 'quake', 420); return banner(ev.text || '', 'stage');
    /* a legend starts another part of its fight: the ground shakes as when it came on, its name goes by, the music turns */
    case 'stage': {
      var tys = E.sideTypes(S, i);
      arrive(i, tys[0], tys[1]);
      music('boss');
      return banner(ev.text || '', 'stage');
    }
    default: return Promise.resolve();
  }
}
/** another fighter takes that side of the arena: the sprite and the box are drawn again, its numbers set at once */
function swapEvent(ev: Extract<BattleEvent, { k: 'swap' }>) {
  var i = ev.who, m = $('m-' + i);
  m.className = 'mover';
  m.innerHTML = '<div class="bob">' + bust(ev.id, 'smirk', '', undefined, ev.gold, ev.form) + '</div>';
  if (counting[i]) { clearTimeout(counting[i]!); counting[i] = null; }
  $('box-' + i).outerHTML = boxHtml(i);
  onField[i] = ev.key || ev.id;
  uiHp[i] = ev.hp;
  setHp(i, ev.hp);
}
function stepEvent(ev: BattleEvent, evs: BattleEvent[], next: number): Promise<unknown> {
  cueBattle(ev);
  /* a creature speaking is its cry: coming on, winning or going down, its own and a golden one glitters (audio/cries.ts) */
  if (ev.k === 'line') { var sid = S.sides[ev.who].id; if (isSpecies(sid)) cry(sid, cryEventOf(sid, ev.text), !!S.sides[ev.who].gold); }
  switch (ev.k) {
    case 'say': return say(ev.text, null, spellNext(evs, next));
    case 'line': return say(ev.text, ev.who);
    case 'expr': setExpr(ev.who, ev.v); return Promise.resolve();
    case 'anim': return animEvent(ev, evs, next);
    case 'hp': return hpEvent(ev);
    case 'sync': renderSync(ev); return Promise.resolve();
    case 'swap': swapEvent(ev); return Promise.resolve();
    default: return Promise.resolve();
  }
}
/** the player has won: the creature is beaten, or in the net */
function wonNow(): boolean { return (S.result === 'win' && S.winner === 0) || S.result === 'catch'; }
/** what is left of each creature of a team, as a share of its health */
function leftNow(): Record<string, number> {
  var left: Record<string, number> = {};
  if (S.bench) [S.sides[0]].concat(S.bench[0]).forEach(function (x) { if (x.key) left[x.key] = x.hp / x.max; });
  return left;
}
function play(evs: BattleEvent[], my: number): Promise<unknown> {
  var n = 0;
  /* a battle of the day counts the moment the engine has decided it, not after the last blow and the result: closing the
     page there must not lose a day already won */
  if (S.phase === 'over' && S.story && S.story.day) dayDecided(wonNow(), leftNow(), S.turn);
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
    if (S.phase === 'send') { setPad(false); return askSend({}, my); }
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
/** Risonanza goes with the next move the player picks: pressed again, it is taken back */
function arm() { if (padOn && E.canResonate(S, padSide)) { resArmed = !resArmed; renderPad(padSide); } }
function onMove(id: string) {
  if (!padOn || !S || S.phase !== 'select' || !needQ.length) return;
  var i = needQ[0];
  if (E.available(S, i).indexOf(id) < 0 && E.switches(S, i).indexOf(id) < 0) return;
  /* it goes with a move of the creature: a change, or something from the bag, leaves it for later */
  pending[i] = resArmed && !E.BAG[id] && E.switches(S, i).indexOf(id) < 0 ? E.withResonance(id) : id;
  resArmed = false;
  needQ.shift();
  setPad(false, i);
  if (needQ.length) { askNext(true); return; }
  turnbar.hidden = true;
  var my = ++flow;
  resolveTurn(my).then(function () { if (my === flow) runFlow(); }).catch(caught);
}
function resolveTurn(my: number) { return play(E.playTurn(S, pending), my); }

/* =================== WHO COMES IN =================== */
/** the bench in a sheet: a card for each of the team, with its health and how it stands against the one it would face */
function benchCard(b: BenchLabel): string {
  var col = 'var(--t-' + b.types[0].toLowerCase() + ')', pct = Math.round(100 * b.hp / b.max), note = b.note;
  return '<button class="pick bench-pick" type="button" data-slot="' + b.slot + '" style="--tc:' + col + '"' + (b.ready ? '' : ' disabled') + '><span class="face">' + face(b.id) + '</span>' +
    '<span>' + esc(b.name) + (b.lvl ? ' <small class="lv">Lv ' + b.lvl + '</small>' : '') + '</span>' +
    '<span class="benchhp" role="img" aria-label="' + b.hp + ' PS su ' + b.max + '"><i style="width:' + pct + '%"></i></span><small class="hpnum">' + b.hp + '/' + b.max + '</small>' +
    (note ? '<small class="adv ' + (note === 'Svantaggio' || note === 'KO' ? 'bad' : '') + '">' + note + '</small>' : '') + '</button>';
}
/** opens the bench; `no` is the button that says no to it (none when the player has to pick) */
function benchSheet(cls: string, title: string, hint: string, i: number, no: string | null, go: (slot: number | null) => void) {
  overlay.className = 'overlay' + cls;
  overlay.innerHTML = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="bn-t"><div class="sheet-h"><h2 id="bn-t">' + esc(title) + '</h2></div>' +
    '<p class="hint">' + esc(hint) + '</p><div class="pickgrid bench">' + E.benchLabels(S, i).filter(function (b) { return !b.last || b.ready; }).map(benchCard).join('') + '</div>' +
    (no ? '<div class="res-actions"><button class="btn wide" type="button" id="bn-no">' + esc(no) + '</button></div>' : '') + '</div>';
  overlay.hidden = false;
  function close(slot: number | null) { closeOverlay(); go(slot); }
  each(overlay.querySelectorAll<HTMLButtonElement>('.bench-pick'), function (b) { b.addEventListener('click', function () { close(+b.getAttribute('data-slot')!); }); });
  if (no) $('bn-no').addEventListener('click', function () { close(null); });
  setTimeout(function () { var b = overlay.querySelector<HTMLElement>('.bench-pick:not([disabled])') || $('bn-no'); if (b) b.focus(); }, 30);
}
/** the player's turn: change instead of moving. It can be taken back, and the pad is still there */
function askChange() {
  if (!padOn || !S || S.phase !== 'select' || !needQ.length) return;
  var i = needQ[0];
  benchSheet('', 'Chi mandi al posto di ' + sideName(i) + '?', E.changeText(S, i).hint, i, 'Resto con ' + sideName(i), function (slot) {
    if (slot != null) onMove('switch:' + slot);
  });
}
/** someone is down: the player says who comes in (or gives up), or, if it is the foe's, whether to change; then they enter */
function askSend(picks: Record<number, number>, my: number): Promise<unknown> {
  var asks = E.sendNeeds(S).filter(function (a) { return picks[a.side] === undefined; });
  if (!asks.length) return play(E.sendIn(S, picks), my).then(function () { if (my === flow) runFlow(); });
  var a = asks[0], i = a.side, f = 1 - i, next = function (slot: number | null) {
    picks[i] = slot == null ? (a.must ? -1 : -2) : slot;
    var mine = ++flow;
    askSend(picks, mine).catch(caught);
  };
  if (a.must) {
    var left = E.benchLabels(S, i).filter(function (b) { return b.ready; }), last = left.length === 1 && left[0].last, foe = S.sides[f].hp > 0 ? sideName(f) : '';
    benchSheet(' bench', last ? 'Le tue creature sono tutte stanche' : sideName(i) + ' non ce la fa più', last ? 'E ' + (foe || 'l\'avversario') + ' è ancora lì. Scendi in campo tu, ' + left[0].name + '?' : foe ? 'Chi mandi contro ' + foe + '?' : 'Chi mandi adesso?', i, S.wild ? 'Scappa' : 'Mi arrendo', next);
    return Promise.resolve();
  }
  var slotN = S.nextIn![f], x = S.bench![f][slotN as number], nm = x.nick || fighter(x.id).name;
  benchSheet(' bench', (S.trainer || sideName(f)) + ' sta per mandare in campo ' + nm, nm + ' è di tipo ' + fighter(x.id).type + '. Cambi ' + sideName(i) + '?', i, 'Resto con ' + sideName(i), next);
  return Promise.resolve();
}

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
  var story = S.story, storyWon = !!story && wonNow();
  if (story && story.covo && COVI[story.covo]) sub = COVI[story.covo].name;
  var expr = r === 'win' || r === 'catch' ? (S.boss && S.winner === 1 ? 'sleepy' : 'cool') : 'worried';
  var gradeHtml = S.boss && S.grade ? '<div class="grade"><span>Voto</span><strong>' + (S.grade.lode ? '30 e lode' : S.grade.g + '/30') + '</strong></div>' : (sub ? '<div class="grade"><span>' + esc(sub) + '</span></div>' : '');
  var me = S.winner != null ? S.sides[S.winner].st : A.st;
  var h = '<div class="res" role="dialog" aria-modal="true" aria-labelledby="res-t" style="--tc:' + tc(star) + '">' +
    '<div class="res-art">' + bust(star, expr, '', '0 0 260 270', (star === A.id && A.gold) || (star === B.id && B.gold), star === A.id ? A.form : B.form) + '<div class="stamp" id="res-t">' + esc(stamp) + '</div>' + gradeHtml + '</div><div class="res-body">';
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
    var c = E.charOf(S, i), lvl = S.sides[i].lvl;
    h += '<div class="card" style="--tc:' + TC[c.type] + '"><div class="block"><h3>' + esc(sideLabel(i) + ' · ' + c.name + (lvl ? ' · Lv ' + lvl : '')) + '</h3>';
    if (c.id === 'esame' && !S.sides[i].revealed) h += '<p class="unknown">Statistiche e mosse ancora sconosciute. Antonio può analizzarlo con Diagnosi Energetica; con gli altri lo scopri giocando.</p></div>';
    else {
      var st = S.sides[i].stats || c.stats;
      h += '<div class="mini-stats"><div><span>Vita</span><strong>' + st.hp + '</strong></div><div><span>Attacco</span><strong>' + st.atk + '</strong></div><div><span>Difesa</span><strong>' + st.def + '</strong></div><div><span>Velocità</span><strong>' + st.spe + '</strong></div></div></div>' + charBlocks(c);
    }
    h += '</div>';
  });
  if (S.field) h += '<div class="card"><div class="block"><h3>La magia del luogo</h3><p>' + esc(E.resonanceText(S).sheet) + '</p></div></div>';
  h += '<div class="card"><div class="block"><h3>Tipi</h3><ul class="cycle-why">';
  if (isSpecies(S.sides[0].id) || isSpecies(S.sides[1].id)) {
    /* between creatures it is the magic that counts: ten types, each beats two */
    MAGIC_ORDER.forEach(function (t) { var m = MAGIC_CHART[t]; h += '<li>' + typeTag(t) + '<span>' + esc(m.what) + ' · batte ' + m.beats.map(function (b, k) { return b + ' (' + m.why[k] + ')'; }).join(' e ') + '.</span></li>'; });
  } else E.TYPE_ORDER.forEach(function (t) { h += '<li>' + typeTag(t) + '<span>batte ' + E.TYPES[t].beats + ': ' + E.TYPES[t].why + '.</span></li>'; });
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
    var seed = cfg!.seed != null ? cfg!.seed : (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
    S = E.newBattle({ a: cfg!.a, b: cfg!.b, mode: cfg!.mode, seed: seed, safe: cfg!.safe, sideA: cfg!.sideA, sideB: cfg!.sideB, wild: cfg!.wild, bag: cfg!.bag, trainer: cfg!.trainer, night: cfg!.night != null ? cfg!.night : (!!cfg!.wild || !!cfg!.trainer) && (!!cfg!.dark || darkness(new Date()) > 0.5), benchA: cfg!.benchA, benchB: cfg!.benchB, smart: cfg!.smart, field: cfg!.field, shield: cfg!.shield, surgeStart: cfg!.surgeStart, hero: cfg!.hero });
    S.story = cfg!.story || null;
  }
  flow++;
  if (stopSay) stopSay();
  if (WORLD) WORLD.close();
  view.screen = 'battle';
  home.hidden = true; battle.hidden = false;
  document.body.classList.add('in-battle');
  window.scrollTo(0, 0);
  onField = [S.sides[0].key || S.sides[0].id, S.sides[1].key || S.sides[1].id];
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
  var caught = !!S && S.result === 'catch', bag = S ? S.bag : undefined, bouts: Bout[] = (S && S.bouts) || [], left = S ? leftNow() : {}, turns = S ? S.turn : 0;
  flow++;
  if (stopSay) stopSay();
  tapHandler = null;
  battle.hidden = true; battle.innerHTML = '';
  document.body.classList.remove('in-battle');
  closeOverlay();
  renderLibretto();
  S = null as unknown as BattleState;
  if (story.day) dayAfter(won, left, turns);
  else if (WORLD) WORLD.afterBattle({ tag: story, won: won, quit: !!quit, caught: caught, bag: bag, bouts: bouts });
  else goHome();
}
/** the battle screen as one object, with the same names the old window.UI had */
export const UI = {
  startBattle: startBattle, goHome: goHome, setScreen: function (s: string) { view.screen = s; },
  /* the computer's choice for the side that has to move, on a copy so the battle's dice stay untouched (playtests) */
  _debug: {
    suggest: function () { return S && S.phase === 'select' && needQ.length ? E.ai(JSON.parse(JSON.stringify(S)), needQ[0]) : null; },
    battle: function () { return S ? { a: S.sides[0].id, b: S.sides[1].id, story: S.story, safe: S.safe } : null; },
    /* Slancio, set by hand: three points take a whole battle to come */
    surge: function (n: number) { if (S && S.surge) { S.surge[0] = n; setPad(padOn, padSide); renderSync(E.snap(S)); } },
    /* a number going up or down, shown on demand */
    stat: function (i: number, what: string) { return S ? statShow(i, what) : null; },
    /* a spell's show on demand, to look at the shows: type (null for a plain move), what happens, who casts */
    cast: function (type: TypeName | null, outcome?: 'hit' | 'miss' | 'none', from?: number, o?: { sig?: boolean; crit?: boolean; lvl?: number; power?: number; name?: string; id?: string; self?: boolean; drain?: boolean; quick?: boolean }) {
      if (!S) return null;
      var i = from || 0, x = o || {};
      if (x.self && type) return castSelf(i, type, x.name || 'Prova', !!x.sig, x.id);
      return castSpell(i, 1 - i, { type: type, id: x.id, name: x.name || 'Prova', power: x.power || 60, sig: !!x.sig, outcome: outcome || 'hit', crit: !!x.crit, lvl: x.lvl || 0, drain: !!x.drain, quick: !!x.quick });
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
    if (e.key === 'Escape' && !overlay.hidden && !overlay.classList.contains('result') && !overlay.classList.contains('pass') && !overlay.classList.contains('bench')) { closeOverlay(); return; }
    if (view.screen !== 'battle' || !overlay.hidden) return;
    if (e.key === ' ' || e.key === 'Enter') { if (tapHandler) { e.preventDefault(); advance(); } return; }
    if (/^[1-9]$/.test(e.key) && padOn) { var m = padMoves(padSide).concat(bagMoves(padSide))[+e.key - 1]; if (m) onMove(m.id); }
    if ((e.key === 'c' || e.key === 'C') && padOn && E.switches(S, padSide).length) askChange();
    if ((e.key === 'r' || e.key === 'R') && padOn) arm();
  });
}
