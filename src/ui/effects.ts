import { SPR } from '../render/svg';
import { reduced, esc, $ } from './dom';
import { sleep } from './common';
import { arena, shown, uiHp, setHp } from './battle-screen';

/* The battle's little shows: lunges and shakes are CSS classes, the rest are elements thrown over the arena. */

export function pulse(el: HTMLElement, c: string, ms: number) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); return sleep(ms).then(function () { el.classList.remove(c); }); }
function rel(el: HTMLElement) { var a = arena.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height }; }
export function fx(html: string, cls: string, x: number, y: number, life: number): HTMLElement {
  var el = document.createElement('div');
  el.className = 'fx ' + (cls || ''); el.innerHTML = html;
  el.style.left = x + 'px'; el.style.top = y + 'px';
  arena.appendChild(el);
  if (life) setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, life);
  return el;
}
function animate(el: HTMLElement, frames: Keyframe[], opts: KeyframeAnimationOptions & { duration: number }): Promise<unknown> {
  if (!el.animate || reduced) return Promise.resolve();
  try { var an = el.animate(frames, opts); return an.finished ? an.finished.catch(function () {}) : sleep(opts.duration); } catch (e) { return Promise.resolve(); }
}
export function anchor(i: number, fx0: number, fy0: number): number[] { var r = rel($('w-' + i)); return [r.x + r.w * fx0, r.y + r.h * fy0]; }
export function projectile(from: number, to: number, html: string, cls: string, dur?: number, lift?: number) {
  var a = anchor(from, from === 0 ? 0.6 : 0.3, 0.32), b = anchor(to, to === 0 ? 0.55 : 0.4, 0.38);
  var el = fx(html, cls, 0, 0, 0);
  var mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - (lift == null ? 40 : lift);
  return animate(el, [
    { transform: 'translate(' + a[0] + 'px,' + a[1] + 'px) scale(.5)', opacity: 0 },
    { transform: 'translate(' + mx + 'px,' + my + 'px) scale(1) rotate(-12deg)', opacity: 1, offset: 0.5 },
    { transform: 'translate(' + b[0] + 'px,' + b[1] + 'px) scale(.95) rotate(8deg)', opacity: 1 }
  ], { duration: dur || 620, easing: 'ease-in-out' }).then(function () { el.remove(); });
}
export function popAt(i: number, html: string, cls: string, fx0?: number | null, fy0?: number | null, dur?: number) {
  var p = anchor(i, fx0 == null ? 0.6 : fx0, fy0 == null ? 0.04 : fy0);
  var el = fx(html, cls, p[0], p[1], 0);
  return animate(el, [
    { transform: 'translate(-50%, 10px) scale(.4)', opacity: 0 },
    { transform: 'translate(-50%, -8px) scale(1.12)', opacity: 1, offset: 0.25 },
    { transform: 'translate(-50%, -12px) scale(1)', opacity: 1, offset: 0.75 },
    { transform: 'translate(-50%, -30px) scale(.9)', opacity: 0 }
  ], { duration: reduced ? 1 : (dur || 1100), easing: 'ease-out', fill: 'forwards' }).then(function () { el!.remove(); });
}
let ROBOT_FALLEN: HTMLElement | null = null;
export function robotFall(i: number) {
  var a = rel($('w-' + i)), x = a.x + a.w * (i === 0 ? 0.86 : 0.1), y = a.y + a.h * 0.55;
  var el = fx(SPR.robot(), 'robot', x, y, 0);
  ROBOT_FALLEN = el;
  el.style.transformOrigin = '50% 90%';
  el.style.transform = 'rotate(96deg)';
  return animate(el, [{ transform: 'translateY(30px) scale(.4)', opacity: 0 }, { transform: 'translateY(-36px) scale(1) rotate(-12deg)', opacity: 1, offset: 0.4 }, { transform: 'rotate(96deg)' }], { duration: 760, easing: 'ease-in' });
}
export function robotFix() {
  var el = ROBOT_FALLEN; ROBOT_FALLEN = null;
  if (!el || !el.parentNode) return sleep(200);
  return animate(el, [{ transform: 'rotate(96deg)' }, { transform: 'rotate(0deg) translateY(-18px)', offset: 0.55 }, { transform: 'translate(-60px, 10px) scale(.3)', opacity: 0 }], { duration: 900, easing: 'ease-in-out', fill: 'forwards' }).then(function () { el!.remove(); });
}
export const FOX = '<svg class="proj" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 30C16 20 24 22 30 28C26 16 30 8 38 4C38 14 36 22 34 28Z" fill="#f4efe6" stroke="#1c2340" stroke-width="2.4" stroke-linejoin="round"/><path d="M58 30C48 20 40 22 34 28C38 16 34 8 26 4C26 14 28 22 30 28Z" fill="#f4efe6" stroke="#1c2340" stroke-width="2.4" stroke-linejoin="round" transform="translate(64 0) scale(-1 1) translate(64 0) scale(-1 1)"/>' +
  '<path d="M18 34L24 22L30 30L34 30L40 22L46 34C46 46 40 54 32 56C24 54 18 46 18 34Z" fill="#e8873a" stroke="#1c2340" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 44C28 48 36 48 40 44C38 52 34 54 32 54C30 54 26 52 24 44Z" fill="#fff4e6"/><circle cx="27" cy="38" r="2.2" fill="#1c2340"/><circle cx="37" cy="38" r="2.2" fill="#1c2340"/><circle cx="32" cy="47" r="2" fill="#1c2340"/></svg>';
export const BALL = '<svg class="proj" viewBox="0 0 40 40" aria-hidden="true" style="width:30px;height:30px"><circle cx="20" cy="20" r="15" fill="#d8f04a" stroke="#1c2340" stroke-width="2.4"/><path d="M8 11C14 16 14 24 8 29M32 11C26 16 26 24 32 29" fill="none" stroke="#fff" stroke-width="2.4"/></svg>';
const NOTE = '<svg viewBox="0 0 24 32" width="22" height="30" aria-hidden="true"><path d="M9 25V5L20 2V9L9 12" fill="none" stroke="#1c2340" stroke-width="2.6" stroke-linejoin="round"/><ellipse cx="5.6" cy="25.4" rx="4.6" ry="3.6" fill="#1c2340"/></svg>';
export function confetti(i: number) {
  var p = anchor(i, 0.55, 0.3), cols = ['#ff8fc1', '#ffe45c', '#8fd0f6', '#57c968', '#ffa35a', '#bba0ff'], all: Promise<unknown>[] = [];
  for (var k = 0; k < 16; k++) {
    var el = fx('', 'confetti', p[0], p[1], 0);
    el.style.background = cols[k % cols.length];
    var ang = (i === 0 ? -1.1 : 2.0) + (Math.random() - 0.5) * 2.2, dist = 70 + Math.random() * 90;
    all.push(animate(el, [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist + 40) + 'px) rotate(' + (Math.random() * 720) + 'deg)', opacity: 0 }], { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }).then((function (e: HTMLElement) { return function () { e.remove(); }; })(el)));
  }
  return sleep(700);
}
export function notes(i: number) {
  var all: Promise<unknown>[] = [];
  for (var k = 0; k < 4; k++) {
    (function (k: number) {
      var p = anchor(i, 0.25 + k * 0.17, 0.12), el = fx(NOTE, 'note', p[0], p[1], 0);
      all.push(sleep(k * 120).then(function () {
        return animate(el, [{ transform: 'translateY(10px) scale(.5)', opacity: 0 }, { transform: 'translateY(-20px) scale(1)', opacity: 1, offset: 0.4 }, { transform: 'translate(' + (k % 2 ? 14 : -14) + 'px,-60px)', opacity: 0 }], { duration: 1000, easing: 'ease-out', fill: 'forwards' });
      }).then(function () { el.remove(); }));
    })(k);
  }
  return sleep(800);
}
export function scan(i: number) {
  var w = $('w-' + i), line = document.createElement('div');
  line.className = 'scanline'; line.style.top = '0';
  w.appendChild(line);
  return animate(line, [{ top: '0%', opacity: 1 }, { top: '96%', opacity: 1 }, { top: '96%', opacity: 0 }], { duration: 850, easing: 'ease-in-out' })
    .then(function () { line.remove(); shown.revealed[i] = true; setHp(i, uiHp[i]); });
}
export function banner(text: string, style?: string) {
  var el = fx(esc(text), 'banner ' + (style || ''), 0, 0, 1300);
  el.style.left = ''; el.style.top = '';
  return sleep(1050);
}
