import { INGUAIATO } from '../data/mazzarri';
import { sfx } from '../audio';
import { reduced, esc } from './dom';
import { rich } from './gfx';

/* «Stai inguaiatoooo!» (27 November 2026, Antonio: Valentin, when he beats someone, shouts it as in a famous freestyle of
   his). Over whatever is on the screen: the light turns, Valentin comes in from the side with the microphone, the air
   horn and a bar of beat; «STAI» and «INGUAIAT» slam down, the O's keep coming, each a little bigger, and the «!» shakes
   everything. A tap cuts it short. With reduced motion the words are just there for a moment; with Grafica Bassa
   there are no rays. */
const MIC = '<svg class="sh-mic" viewBox="0 0 40 70" aria-hidden="true"><rect x="9" y="2" width="22" height="30" rx="11" fill="#2b2f3a" stroke="#1c2340" stroke-width="3"/>' +
  '<path d="M12 12h16M12 19h16M12 26h16" stroke="#8a93a8" stroke-width="2"/><path d="M15 33h10l-2 34h-6Z" fill="#1c2340"/></svg>';

var live: HTMLElement | null = null;
/** `face`: the picture of who shouts (Valentin, as he looks now); `left`: from which side he comes in */
export function shout(face: string, done?: () => void, o?: { text?: string; right?: boolean }) {
  var text = (o && o.text) || INGUAIATO, then = done || function () { /* nothing after */ };
  if (live) { live.remove(); live = null; }
  var m = /^(\S+)\s+(.*?)(O+)(!?)$/i.exec(text.toUpperCase());
  /* the O's of the shout are a few more than the written ones: they keep coming */
  var a = m ? m[1] : text.toUpperCase(), b = m ? m[2] : '', os = m ? m[3].length + 4 : 0;
  var el = document.createElement('div');
  el.className = 'shout' + (o && o.right ? ' from-right' : '') + (rich() ? '' : ' plain') + (reduced ? ' still' : '');
  el.setAttribute('role', 'alert');
  el.setAttribute('aria-label', 'Valentin: ' + text);
  el.innerHTML = '<div class="sh-rays" aria-hidden="true"></div>' +
    '<div class="sh-man" aria-hidden="true"><span class="sh-face">' + face + '</span>' + MIC + '<i class="sh-wave"></i><i class="sh-wave"></i><i class="sh-wave"></i></div>' +
    '<p class="sh-words" aria-hidden="true"><span class="sh-a">' + esc(a) + '</span><span class="sh-b">' + esc(b) + '<span class="sh-os"></span><span class="sh-bang">!</span></span></p>';
  document.body.appendChild(el);
  live = el;
  var timers: ReturnType<typeof setTimeout>[] = [], over = false;
  var end = function () {
    if (over) return;
    over = true; timers.forEach(clearTimeout); document.removeEventListener('keydown', keys, true);
    el.classList.add('out');
    setTimeout(function () { el.remove(); if (live === el) live = null; then(); }, reduced ? 10 : 260);
  };
  el.addEventListener('pointerdown', function (e) { e.preventDefault(); end(); });
  var keys = function (e: KeyboardEvent) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); document.removeEventListener('keydown', keys, true); end(); } };
  document.addEventListener('keydown', keys, true);
  var later = function (ms: number, f: () => void) { timers.push(setTimeout(f, ms)); };
  var osEl = el.querySelector('.sh-os') as HTMLElement;
  if (reduced) {
    osEl.textContent = 'O'.repeat(os);
    el.classList.add('a-in', 'b-in', 'bang');
    sfx('airhorn');
    later(1500, function () { document.removeEventListener('keydown', keys, true); end(); });
    return;
  }
  sfx('airhorn'); sfx('beat', 0.05);
  later(180, function () { el.classList.add('a-in'); });
  later(420, function () { el.classList.add('b-in'); sfx('scratch'); });
  for (var k = 0; k < os; k++) (function (k) {
    later(640 + k * 105, function () {
      var o2 = document.createElement('span');
      o2.textContent = 'O'; o2.style.setProperty('--k', String(k));
      osEl.appendChild(o2);
    });
  })(k);
  later(700 + os * 105, function () { el.classList.add('bang'); });
  later(2600 + os * 60, function () { document.removeEventListener('keydown', keys, true); end(); });
}
/** a shout under way, ended now (a battle that closes, a sheet that changes) */
export function hush() { if (live) { live.remove(); live = null; } }
