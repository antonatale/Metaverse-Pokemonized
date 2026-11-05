import { DAY_FLOORS } from '../data/day';
import { SPECIES } from '../data/creatures';
import { PLACE_MAGIC } from '../data/scenes';
import { afterFloor, alive, canTake, dayKey, foeMember, memberOf, needsTarget, newRun, offersNow, offerText, planOf, seedOf, shareLine, takeOffer, type DayRun, type Offer } from '../day/plan';
import { daySave, saveDay } from '../save/day-progress';
import { esc, each, $ } from './dom';
import { face, overlay, closeOverlay } from './common';
import { goHome, startBattle } from './battle-screen';

/* «Un giorno a Formia» on the screen: the card on the home page, and the sheets between one battle and the next. The rules
   are all in src/day/plan.ts: here there is the date, the save and the drawing. */

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
function dateText(key: string): string { var p = key.split('-'); return +p[2] + ' ' + MONTHS[+p[1] - 1]; }
function open(html: string) {
  overlay.className = 'overlay';
  overlay.innerHTML = '<div class="sheet day-sheet" role="dialog" aria-modal="true" aria-labelledby="dy-t">' + html + '</div>';
  overlay.hidden = false;
  setTimeout(function () { var b = overlay.querySelector<HTMLElement>('.btn.primary, .day-offer:not([disabled])'); if (b) b.focus(); }, 30);
}
function teamCard(m: DayRun['team'][number], lead: boolean): string {
  var pct = Math.round(m.hp * 100), col = 'var(--t-' + SPECIES[m.sp].type.toLowerCase() + ')';
  return '<button class="pick bench-pick" type="button" data-key="' + m.key + '" aria-pressed="' + lead + '" style="--tc:' + col + '"' + (m.hp > 0 ? '' : ' disabled') + '><span class="face">' + face(m.sp) + '</span>' +
    '<span>' + esc(SPECIES[m.sp].name) + ' <small class="lv">Lv ' + m.lv + '</small></span><span class="benchhp" role="img" aria-label="' + pct + '% dei PS"><i style="width:' + pct + '%"></i></span>' +
    (m.hp > 0 ? '' : '<small class="adv bad">KO</small>') + '</button>';
}
/* ---------- the card on the home page ---------- */
export function renderDay() {
  var el = document.getElementById('day-card');
  if (!el) return;
  var today = dayKey(new Date()), done = daySave.days[today], run = daySave.run;
  var line = run ? 'Sei a ' + DAY_FLOORS[Math.min(run.floor, DAY_FLOORS.length - 1)].name.toLowerCase() + '.' : done ? 'Oggi: ' + done.floors + ' su ' + DAY_FLOORS.length + ', ' + done.score + ' punti.' : 'La sfida di oggi è uguale per tutti: confronta il punteggio con gli amici.';
  el.innerHTML = '<div class="block"><p>Tre creature a caso, otto lotte dalla mattina alla notte, e dopo ogni lotta una ricompensa da scegliere.</p><p class="hint">' + esc(line) + (daySave.best ? ' Record: ' + daySave.best + ' punti.' : '') + '</p>' +
    '<div class="day-row">' + (run ? '<button class="btn primary" type="button" id="dy-on">Continua la giornata</button>' :
      (done ? '<button class="btn" type="button" id="dy-copy">Copia il risultato</button>' : '<button class="btn primary" type="button" id="dy-today">Sfida del giorno</button>') + '<button class="btn" type="button" id="dy-free">Corsa libera</button>') + '</div></div>';
  if (run) $('dy-on').addEventListener('click', resume);
  else {
    if (done) $('dy-copy').addEventListener('click', function () { copy(done.line, $('dy-copy')); });
    else $('dy-today').addEventListener('click', function () { begin(seedOf(today), today); });
    $('dy-free').addEventListener('click', function () { begin((Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0, ''); });
  }
}
function begin(seed: number, day: string) { daySave.run = newRun(seed, day); saveDay(); renderDay(); floorSheet(); }
function resume() { var r = daySave.run; if (!r) return; if (r.picking) rewardSheet([]); else floorSheet(); }

/* ---------- before a battle: where, against whom, who goes first ---------- */
function floorSheet() {
  var r = daySave.run!, f = planOf(r.seed).floors[r.floor], foes = f.boss ? 'Qualcosa ti aspetta nel buio.' : f.foeList.map(function (x) { return SPECIES[x.sp].name + ' Lv ' + x.lv; }).join(', ');
  var team = r.team.map(function (m, k) { return teamCard(m, k === r.team.findIndex(function (x) { return x.hp > 0; })); }).join('');
  open('<div class="sheet-h"><h2 id="dy-t">' + esc(f.name) + '</h2><span class="hint">' + (r.floor + 1) + ' su ' + DAY_FLOORS.length + '</span></div>' +
    '<p class="hint">' + esc((f.who ? f.who + ': ' : '') + foes) + '</p><p class="hint">Tocca una creatura per mandarla per prima.</p><div class="pickgrid bench">' + team + '</div>' +
    '<div class="res-actions"><button class="btn primary wide" type="button" id="dy-go">Lotta!</button></div>');
  each(overlay.querySelectorAll<HTMLButtonElement>('.bench-pick'), function (b) {
    b.addEventListener('click', function () {
      var k = r.team.findIndex(function (m) { return m.key === b.getAttribute('data-key'); }), m = r.team.splice(k, 1)[0];
      r.team.unshift(m); saveDay(); floorSheet();
    });
  });
  $('dy-go').addEventListener('click', fight);
}
function fight() {
  var r = daySave.run!, f = planOf(r.seed).floors[r.floor], mine = alive(r).map(memberOf), foes = f.foeList.map(function (x) { return foeMember(x, f.stages); });
  closeOverlay();
  startBattle({ a: mine[0].id, b: foes[0].id, mode: 'cpu', seed: f.seed, sideA: mine[0], sideB: foes[0], benchA: mine.slice(1), benchB: foes.slice(1), smart: [0, f.smart || 0],
    wild: foes.length < 2, trainer: f.who, dark: !!f.night, field: PLACE_MAGIC[f.scene], story: { day: true, scene: f.scene, sp: f.foeList[0].sp, foeLv: f.foeList[0].lv } });
}
/** a battle of the day is over: called by the battle screen */
export function dayAfter(won: boolean, left: Record<string, number>, turns: number) {
  goHome();
  var r = daySave.run;
  if (!r) return;
  var said = afterFloor(r, won, left, turns);
  saveDay();
  if (r.over) endSheet(); else rewardSheet(said);
}

/* ---------- after a battle: a reward ---------- */
function rewardSheet(said: string[]) {
  var r = daySave.run!, offers = offersNow(r);
  open('<div class="sheet-h"><h2 id="dy-t">Scegli una ricompensa</h2><span class="hint">' + r.score + ' punti</span></div>' +
    said.map(function (t) { return '<p class="hint">' + esc(t) + '</p>'; }).join('') +
    '<div class="day-offers">' + offers.map(function (o, k) {
      var t = offerText(o), can = canTake(r, o);
      return '<button class="day-offer" type="button" data-k="' + k + '"' + (can ? '' : ' disabled') + '><b>' + esc(t.name) + '</b><small>' + esc(can ? t.text : o.k === 'mon' ? 'La squadra è al completo.' : 'Stanno tutti bene.') + '</small></button>';
    }).join('') + '</div>' +
    (offers.some(function (o) { return canTake(r, o); }) ? '' : '<div class="res-actions"><button class="btn wide" type="button" id="dy-skip">Avanti</button></div>'));
  each(overlay.querySelectorAll<HTMLButtonElement>('.day-offer'), function (b) { b.addEventListener('click', function () { choose(offers[+b.getAttribute('data-k')!]); }); });
  var skip = document.getElementById('dy-skip');
  if (skip) skip.addEventListener('click', function () { done(null); });
}
function choose(o: Offer) {
  if (!needsTarget(o)) { done(o); return; }
  var r = daySave.run!, t = offerText(o);
  open('<div class="sheet-h"><h2 id="dy-t">A chi va?</h2></div><p class="hint">' + esc(t.name + ': ' + t.text) + '</p><div class="pickgrid bench">' + alive(r).map(function (m) { return teamCard(m, false); }).join('') + '</div>' +
    '<div class="res-actions"><button class="btn wide" type="button" id="dy-back">Torna alle ricompense</button></div>');
  each(overlay.querySelectorAll<HTMLButtonElement>('.bench-pick'), function (b) { b.addEventListener('click', function () { done(o, b.getAttribute('data-key')!); }); });
  $('dy-back').addEventListener('click', function () { rewardSheet([]); });
}
function done(o: Offer | null, key?: string) { takeOffer(daySave.run!, o, key); saveDay(); renderDay(); floorSheet(); }

/* ---------- the end of the day: the score, and the line to pass on ---------- */
function endSheet() {
  var r = daySave.run!, won = r.over === 'won', when = r.day ? dateText(r.day) : 'corsa libera', line = shareLine(r, when);
  daySave.best = Math.max(daySave.best, r.score);
  if (r.day) daySave.days[r.day] = { floors: r.log.filter(Boolean).length, score: r.score, line: line };
  daySave.run = null; saveDay(); renderDay();
  open('<div class="sheet-h"><h2 id="dy-t">' + (won ? 'Che giornata!' : 'La giornata finisce qui') + '</h2></div>' +
    '<p class="day-score"><b>' + r.score + '</b> punti</p>' +
    '<label class="hint" for="dy-line">Da mandare agli amici</label><input class="day-line" id="dy-line" type="text" readonly value="' + esc(line) + '">' +
    '<div class="res-actions"><button class="btn primary" type="button" id="dy-copy2">Copia</button><button class="btn" type="button" id="dy-close">Chiudi</button></div>');
  $('dy-copy2').addEventListener('click', function () { copy(line, $('dy-copy2')); });
  $('dy-close').addEventListener('click', closeOverlay);
}
/** the line goes to the clipboard, or, where that is not allowed, it is left selected */
function copy(text: string, btn: HTMLElement) {
  var said = function () { btn.textContent = 'Copiato!'; };
  var by = function () {
    var f = document.getElementById('dy-line') as HTMLInputElement | null;
    if (f) { f.focus(); f.select(); btn.textContent = 'Selezionato: copialo tu'; } else btn.textContent = text;
  };
  try { if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(said, by); return; } } catch (e) { /* not allowed in this frame */ }
  by();
}
