import { st, save } from '../save/story-progress';
import { CHARS as C, type FriendId } from '../data/characters';
import { RUNGS, SCALA, JUDGE } from '../data/mazzarri';
import { newMemory, pick, verdict, tally, type ScalaCtx, type Verdict } from '../story/mazzarri';
import { earn, firstHuman, formNow } from '../story/growth';
import { SPR } from '../render/svg';
import { sfx } from '../audio';
import { coins } from '../data/growth';
import { reduced, esc, $ } from './dom';
import { sheet, closeSheet, renderHud } from './story-screen';

/* The Scala Mazzarri on the screen (data/mazzarri.ts, story/mazzarri.ts). One of the seven has lost: his face and his
   excuse, typed out; beside it the scale is a ladder (a scala) leaning on a mirror, because an absurd excuse climbs
   on the mirrors, with ten rungs from «Scusa onesta» to «Mazzarri puro». Costanzo holds it at the bottom: he keeps
   the scale, it is his fixation. The player taps a rung (or a number on the keyboard): «Tu» climbs to it; then, with
   a drum roll, Costanzo's badge climbs to his rung; the closer, the more the cassa of the caminetto pays, and Costanzo
   says what he thinks. When Costanzo is the one being played, Claudia holds the ladder. */

function faceOf(id: string, expr: string): string { return SPR.personIn(id, formNow(id), expr, '', SPR.thumb(id)); }
function tcOf(id: string): string { return 'var(--t-' + C[id as FriendId].type.toLowerCase() + ')'; }
function one(list: string[]): string { return list[Math.floor(Math.random() * list.length)]; }

/** the excuse of the one who has lost, on the scale; `then` once the player has voted (or not) and gone on */
export function excuse(ctx: ScalaCtx, then?: () => void) {
  var mem = st.scala || (st.scala = newMemory()), said = pick(ctx, mem, Math.random), go = then || function () { /* nothing after */ };
  if (!said) { go(); return; }
  save();
  var me = firstHuman(), judge: 'costanzo' | 'claudia' = me === 'costanzo' ? 'claudia' : 'costanzo';
  var own = ctx.loser === me, first = !st.seen['scala-1'], r = said.e.r;
  open(ctx.loser, said.text, r, own, judge, first, function (v) {
    if (v) { tally(mem, v); if (v.pay) earn(v.pay); }
    st.seen['scala-1'] = true;
    /* from the second excuse on, the caminetto talks about it (data/chat.ts): not right after the first one */
    if (mem.k >= 2) st.seen['scala-2'] = true;
    if (v && v.puro) st.seen['scala-puro'] = true;
    save(); renderHud();
  }, go);
}

/* the rungs' colours, from the honest green to the red of Mazzarri puro */
const RUNG_TONE = ['--t-cielo', '--t-cielo', '--t-corrente', '--t-calma', '--t-chiacchiera', '--t-chiacchiera', '--t-caos', '--t-calore', '--t-calore', '--red'];
const MIRROR = '<svg class="sm-mirror" viewBox="0 0 120 70" aria-hidden="true"><rect x="6" y="6" width="108" height="58" rx="10" fill="#dff2ff" stroke="#1f2c6e" stroke-width="4"/>' +
  '<path d="M24 52 54 16M40 54 70 18M86 50l16-20" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/><path d="M60 64v6" stroke="#1f2c6e" stroke-width="4"/></svg>';

/* a button out of play is hidden and disabled both: whoever looks for the first button to press finds the right one */
function hideBtn(id: string) { var b = $(id) as HTMLButtonElement; b.hidden = true; b.disabled = true; }
function showBtn(id: string): HTMLButtonElement { var b = $(id) as HTMLButtonElement; b.hidden = false; b.disabled = false; return b; }
function open(loser: FriendId, text: string, r: number, own: boolean, judge: 'costanzo' | 'claudia', first: boolean, voted: (v: Verdict | null) => void, done: () => void) {
  var J = JUDGE[judge], L = C[loser], JN = C[judge].name, self = loser === judge;
  var rungs = '';
  for (var v = 10; v >= 1; v--) {
    rungs += '<button class="sm-rung" type="button" data-v="' + v + '" style="--rc:var(' + RUNG_TONE[v - 1] + ')" aria-label="' + v + ', ' + esc(RUNGS[v - 1]) + '">' +
      '<b>' + v + '</b><span>' + esc(RUNGS[v - 1]) + '</span></button>';
  }
  var intro = first ? J.intro.join(' ') : self && J.self ? J.self : '';
  var o = sheet('<div class="scala" role="dialog" aria-modal="true" aria-labelledby="sm-t" style="--tc:' + tcOf(loser) + ';--jc:' + tcOf(judge) + '">' +
    '<header class="sm-head"><span class="sm-plaque" id="sm-t">' + esc(SCALA) + '</span><small>' + (own ? 'La tua scusa' : 'La scusa di ' + esc(L.name)) + '</small></header>' +
    '<div class="sm-body">' +
      '<div class="sm-said">' +
        '<div class="sm-who"><span class="sm-face">' + faceOf(loser, 'pout') + '</span><b>' + esc(L.name) + '</b></div>' +
        '<blockquote class="sm-bubble"><p id="sm-text" aria-live="polite"></p></blockquote>' +
        '<p class="sm-ask" id="sm-ask">Quanto è sulla ' + esc(SCALA) + '? Scegli un gradino.</p>' +
        '<div class="sm-out" id="sm-out" hidden></div>' +
        '<div class="sm-judge" id="sm-judge"' + (intro ? '' : ' hidden') + '><span class="sm-jface">' + faceOf(judge, 'smirk') + '</span><p id="sm-word">' + esc(intro) + '</p></div>' +
      '</div>' +
      '<div class="sm-ladder" id="sm-ladder">' + MIRROR +
        '<div class="sm-rails" role="group" aria-label="I gradini della ' + esc(SCALA) + '">' + rungs +
          '<i class="sm-mark sm-you" id="sm-you" aria-hidden="true">Tu</i>' +
          '<i class="sm-mark sm-cost" id="sm-cost" aria-hidden="true">' + faceOf(judge, 'smirk') + '</i>' +
        '</div>' +
        '<div class="sm-holder"><span>' + faceOf(judge, 'smirk') + '</span><small>' + esc(JN) + ' tiene la scala</small></div>' +
      '</div>' +
    '</div>' +
    '<footer class="sm-foot"><button class="btn" type="button" id="sm-skip">Non voto</button><button class="btn primary" type="button" id="sm-ok" hidden disabled>Continua</button></footer>' +
  '</div>', 'result scala-ov');
  sfx('scroll');
  var box = o.querySelector('.scala') as HTMLElement, tEl = $('sm-text'), state: 'typing' | 'ready' | 'climb' | 'over' = 'typing';
  /* the excuse, typed out (all at once with reduced motion; a tap or a vote finishes it) */
  var shown = 0, typer: ReturnType<typeof setInterval> | undefined;
  var finish = function () { if (typer) clearInterval(typer); typer = undefined; tEl.textContent = '«' + text + '»'; if (state === 'typing') state = 'ready'; };
  if (reduced) finish();
  else {
    tEl.textContent = '«';
    typer = setInterval(function () {
      shown += 2; tEl.textContent = '«' + text.slice(0, shown) + (shown >= text.length ? '»' : '');
      if (shown % 8 === 0) sfx('typing');
      if (shown >= text.length) finish();
    }, 24);
  }
  var buttons = Array.prototype.slice.call(box.querySelectorAll('.sm-rung')) as HTMLButtonElement[];
  var at = function (el: HTMLElement, v: number) { el.style.setProperty('--at', String(v)); };
  var climb = function (el: HTMLElement, to: number, step: number, sound: boolean): Promise<void> {
    return new Promise(function (res) {
      el.classList.add('on');
      if (reduced) { at(el, to); res(); return; }
      var k = 0;
      var next = function () { k++; at(el, k); if (sound) sfx('rung'); if (k >= to) { setTimeout(res, 160); return; } setTimeout(next, step); };
      next();
    });
  };
  var vote = function (v: number) {
    if (state === 'climb' || state === 'over') return;
    finish(); state = 'climb';
    buttons.forEach(function (b) { b.disabled = true; b.classList.toggle('mine', +b.dataset.v! === v); });
    hideBtn('sm-skip'); $('sm-ask').textContent = 'Hai detto ' + v + ': ' + RUNGS[v - 1].toLowerCase() + '. E ' + JN + '?';
    var res = verdict(v, r, own);
    climb($('sm-you'), v, 70, true).then(function () {
      sfx('drumroll');
      return climb($('sm-cost'), r, Math.max(40, Math.round(660 / r)), false);
    }).then(function () {
      state = 'over';
      voted(res);
      buttons.forEach(function (b) { b.classList.toggle('official', +b.dataset.v! === r); });
      box.classList.add('done', 'tier-' + res.tier);
      if (res.puro) box.classList.add('puro');
      var word = res.puro ? J.puro : res.tier === 'exact' ? one(J.exact) : res.tier === 'one' ? one(J.one) : res.under ? one(J.under) : one(J.over);
      var jf = box.querySelector('.sm-jface') as HTMLElement;
      jf.innerHTML = faceOf(judge, res.tier === 'exact' ? 'grin' : res.tier === 'one' ? 'smirk' : 'pout');
      $('sm-word').textContent = word.replace(/\{r\}/g, String(r)).replace(/\{v\}/g, String(v));
      $('sm-judge').hidden = false;
      var out = $('sm-out');
      out.innerHTML = '<span class="sm-pair"><i>Tu</i><b>' + v + '</b></span><span class="sm-pair sm-pj"><i>' + esc(JN) + '</i><b>' + r + '</b></span>' +
        '<span class="sm-pay' + (res.pay ? '' : ' none') + '">' + (res.pay ? '+' + esc(coins(res.pay)) : 'Niente, stavolta') + (own && res.pay ? '<small>metà: la scusa era tua</small>' : '') + '</span>';
      out.hidden = false;
      $('sm-ask').textContent = res.tier === 'exact' ? (res.puro ? 'MAZZARRI PURO!' : 'Preciso!') : res.tier === 'one' ? 'Per un gradino.' : res.tier === 'two' ? 'Per due gradini.' : 'Lontano.';
      sfx(res.pay ? (res.tier === 'exact' ? 'badge' : 'found') : 'weak');
      var ok = showBtn('sm-ok'); setTimeout(function () { ok.focus(); }, 30);
    });
  };
  buttons.forEach(function (b) {
    b.addEventListener('click', function () { vote(+b.dataset.v!); });
    b.addEventListener('mouseenter', function () { if (state !== 'climb' && state !== 'over') sfx('blip'); });
  });
  tEl.addEventListener('click', finish);
  var close = function () { document.removeEventListener('keydown', keys, true); closeSheet(); done(); };
  $('sm-skip').addEventListener('click', function () {
    if (state === 'climb') return;
    finish(); state = 'over'; voted(null);
    var w = $('sm-word'); w.textContent = J.skip; $('sm-judge').hidden = false;
    (box.querySelector('.sm-jface') as HTMLElement).innerHTML = faceOf(judge, 'pout');
    hideBtn('sm-skip'); buttons.forEach(function (b) { b.disabled = true; });
    showBtn('sm-ok').focus();
  });
  $('sm-ok').addEventListener('click', close);
  /* the keyboard: a number is a rung (0 is the 10th), the arrows go up and down the ladder */
  var keys = function (e: KeyboardEvent) {
    if (!document.body.contains(box)) { document.removeEventListener('keydown', keys, true); return; }
    if (state === 'over' || state === 'climb') return;
    if (/^[0-9]$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); vote(e.key === '0' ? 10 : +e.key); return; }
    var i = buttons.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault(); e.stopPropagation();
      var j = i < 0 ? 5 : Math.max(0, Math.min(9, i + (e.key === 'ArrowUp' ? -1 : 1)));
      buttons[j].focus();
    }
  };
  document.addEventListener('keydown', keys, true);
  setTimeout(function () { var b = buttons[5]; if (b && state !== 'over') b.focus({ preventScroll: true }); }, reduced ? 30 : 400);
}
