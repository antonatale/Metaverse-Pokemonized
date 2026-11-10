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

/* ---------- the bigger shows: sparks, shockwaves, the magic of each type ---------- */
/* None of these change the battle: they are drawn over the arena while the engine's events play, and they never
   touch Math.random (a little sequence of their own), so a battle replayed with the same seed is the same battle. */
let seq = 17;
function wob(): number { seq = (seq * 1664525 + 1013904223) >>> 0; return seq / 4294967296; }
/** the little shapes each type's magic is made of (24×24): moons, bolts, stars, notes, hearts */
const SHAPE: Record<string, string> = {
  Calma: 'M15 3a9 9 0 1 0 6 15A10 10 0 0 1 15 3Z',
  Caos: 'M13 2L5 14h6l-2 8 9-13h-6l3-7Z',
  Cervello: 'M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z',
  Chiacchiera: 'M10 18V5l10-2v12M10 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3ZM20 15a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z',
  Cuore: 'M12 21C5 16 2 12 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-3 8-10 13Z'
};
function shape(type: string, col: string, size: number): string {
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path d="' + (SHAPE[type] || SHAPE.Cervello) + '" fill="' + col + '" stroke="#1c2340" stroke-width="1.6" stroke-linejoin="round"/></svg>';
}
/** pieces flying out from a point, each on its own path, fading */
export function sparks(x: number, y: number, n: number, html: (k: number) => string, spread: number, dur: number, cls?: string) {
  if (reduced) return;
  for (var k = 0; k < n; k++) {
    var el = fx(html(k), 'part ' + (cls || ''), x, y, 0), a = (k / n) * Math.PI * 2 + wob() * 0.7, d = spread * (0.55 + wob() * 0.6), spin = (wob() - 0.5) * 540;
    animate(el, [
      { transform: 'translate(-50%,-50%) scale(.3) rotate(0deg)', opacity: 1 },
      { transform: 'translate(-50%,-50%) translate(' + Math.cos(a) * d * 0.7 + 'px,' + Math.sin(a) * d * 0.7 + 'px) scale(1.1) rotate(' + spin * 0.6 + 'deg)', opacity: 1, offset: 0.55 },
      { transform: 'translate(-50%,-50%) translate(' + Math.cos(a) * d + 'px,' + (Math.sin(a) * d + 18) + 'px) scale(.7) rotate(' + spin + 'deg)', opacity: 0 }
    ], { duration: dur * (0.8 + wob() * 0.4), easing: 'cubic-bezier(.15,.8,.3,1)', fill: 'forwards' }).then((function (e: HTMLElement) { return function () { e.remove(); }; })(el));
  }
}
/** a ring that opens out from a point: the shockwave of a spell, the ground under a fighter */
export function ring(x: number, y: number, col: string, size: number, dur: number, flat?: boolean) {
  if (reduced) return Promise.resolve();
  var el = fx('', 'ring' + (flat ? ' flat' : ''), x, y, 0);
  el.style.setProperty('--mc', col);
  return animate(el, [
    { transform: 'translate(-50%,-50%) scale(.15)', opacity: 1 },
    { transform: 'translate(-50%,-50%) scale(' + size / 100 + ')', opacity: 0 }
  ], { duration: dur, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'forwards' }).then(function () { el.remove(); });
}
/** a hit: a comic-book star on the target and sparks; a critical one shakes the whole arena */
export function impact(i: number, crit?: boolean) {
  if (reduced) return;
  var p = anchor(i, 0.5, i === 0 ? 0.42 : 0.4), big = crit ? 1.35 : 1;
  var el = fx('<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4l9 25 26-10-12 24 25 9-25 9 12 24-26-10-9 25-9-25-26 10 12-24-25-9 25-9-12-24 26 10Z" fill="#fffbe6" stroke="#1c2340" stroke-width="4" stroke-linejoin="round"/></svg>', 'pow', p[0], p[1], 0);
  animate(el, [
    { transform: 'translate(-50%,-50%) scale(.2) rotate(-20deg)', opacity: 1 },
    { transform: 'translate(-50%,-50%) scale(' + 1.15 * big + ') rotate(6deg)', opacity: 1, offset: 0.3 },
    { transform: 'translate(-50%,-50%) scale(' + 1.3 * big + ') rotate(10deg)', opacity: 0 }
  ], { duration: 380, easing: 'ease-out', fill: 'forwards' }).then(function () { el.remove(); });
  sparks(p[0], p[1], crit ? 12 : 8, function () { return '<i class="spark"></i>'; }, crit ? 120 : 85, 480);
  if (crit) { pulse(arena, 'quake', 420); flashAt(p[0], p[1], '#ffffff', 520, 300); }
}
/** speed lines behind a fighter that lunges */
export function streaks(i: number) {
  if (reduced) return;
  for (var k = 0; k < 4; k++) {
    var p = anchor(i, i === 0 ? 0.2 : 0.8, 0.25 + k * 0.15), el = fx('', 'streak', p[0], p[1], 0), dir = i === 0 ? -1 : 1;
    animate(el, [
      { transform: 'translate(-50%,-50%) scaleX(.2)', opacity: 0 },
      { transform: 'translate(' + (-50 + dir * 30) + '%,-50%) scaleX(1)', opacity: 0.9, offset: 0.35 },
      { transform: 'translate(' + (-50 + dir * 90) + '%,-50%) scaleX(.4)', opacity: 0 }
    ], { duration: 320 + k * 40, easing: 'ease-out', fill: 'forwards' }).then((function (e: HTMLElement) { return function () { e.remove(); }; })(el));
  }
}
/** a glow of light around a point, for a moment (a critical hit: a bigger, white one) */
export function flashAt(x: number, y: number, col: string, size: number, ms: number) {
  if (reduced) return;
  var el = fx('', 'glowat', x, y, 0);
  el.style.setProperty('--mc', col); el.style.width = el.style.height = size + 'px';
  animate(el, [{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0.9 }, { transform: 'translate(-50%,-50%) scale(1.15)', opacity: 0 }], { duration: ms, easing: 'ease-out', fill: 'forwards' }).then(function () { el.remove(); });
}
/** a spell: the caster charges, the rune flies with a trail of its type's shapes, a shockwave where it lands */
export function spell(from: number, to: number, type: string, col: string, orb: string): Promise<unknown> {
  var c = anchor(from, 0.5, 0.82), t = anchor(to, 0.5, 0.42);
  ring(c[0], c[1], col, 230, 520, true);
  sparks(anchor(from, 0.5, 0.45)[0], anchor(from, 0.5, 0.45)[1], 6, function () { return shape(type, col, 18); }, 70, 520);
  var trail = reduced ? Promise.resolve() : sleep(140).then(function () {
    for (var k = 0; k < 5; k++) {
      (function (k: number) {
        sleep(k * 55).then(function () { return projectile(from, to, '<div class="trail" style="--mc:' + col + ';opacity:' + (0.8 - k * 0.13) + '">' + shape(type, col, 22 - k * 2) + '</div>', '', 520, 34); });
      })(k);
    }
  });
  return Promise.all([trail, sleep(reduced ? 0 : 140).then(function () { return projectile(from, to, orb, '', 520, 34); })]).then(function () {
    ring(t[0], t[1], col, 260, 560);
    sparks(t[0], t[1], 10, function () { return shape(type, col, 22); }, 120, 640);
    flashAt(t[0], t[1], col, 380, 320);
  });
}
/** a spell on itself: a circle on the ground and its shapes rising */
export function rise(i: number, type: string, col: string) {
  if (reduced) return;
  var g = anchor(i, 0.5, 0.86);
  ring(g[0], g[1], col, 200, 800, true);
  for (var k = 0; k < 7; k++) {
    (function (k: number) {
      var p = anchor(i, 0.2 + wob() * 0.6, 0.75), el = fx(shape(type, col, 16 + Math.round(wob() * 8)), 'part', p[0], p[1], 0);
      sleep(k * 70).then(function () {
        return animate(el, [{ transform: 'translate(-50%,0) scale(.4)', opacity: 0 }, { transform: 'translate(-50%,-40px) scale(1)', opacity: 1, offset: 0.35 }, { transform: 'translate(-50%,-130px) scale(.6)', opacity: 0 }],
          { duration: 900, easing: 'ease-out', fill: 'forwards' });
      }).then(function () { el.remove(); });
    })(k);
  }
}
/** a puff of dust where a fighter falls */
export function dust(i: number) {
  if (reduced) return;
  var p = anchor(i, 0.5, 0.92);
  sparks(p[0], p[1], 7, function () { return '<i class="puff"></i>'; }, 70, 700);
}
/** a heal: green crosses rising */
export function healing(i: number) {
  if (reduced) return;
  for (var k = 0; k < 6; k++) {
    (function (k: number) {
      var p = anchor(i, 0.25 + wob() * 0.5, 0.7), el = fx('<i class="plus">+</i>', 'part', p[0], p[1], 0);
      sleep(k * 90).then(function () {
        return animate(el, [{ transform: 'translate(-50%,0) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-30px) scale(1.1)', opacity: 1, offset: 0.4 }, { transform: 'translate(-50%,-90px) scale(.8)', opacity: 0 }],
          { duration: 850, easing: 'ease-out', fill: 'forwards' });
      }).then(function () { el.remove(); });
    })(k);
  }
}

/* ---------- every magic its own way of flying ----------
   Calma throws a crescent like a boomerang, high, and a column of moonlight comes down where it lands; Caos does not
   fly at all: a bolt falls from the sky onto the one in front, twice; Cervello shoots a spinning star that bursts into
   rays; Chiacchiera sends rings of sound with notes in them; Cuore a wave of hearts. A plain move is a rush and a
   shockwave. The big ones (power 90 and more) charge first, with the arena going dark. */
function ends(from: number, to: number): number[][] { return [anchor(from, 0.5, 0.45), anchor(to, 0.5, 0.42)]; }
/** the caster gathers its magic: a ring at its feet, the arena dims, its shapes rise */
function charge(from: number, type: string | null, col: string) {
  if (reduced) return Promise.resolve();
  var dim = fx('', 'dim', 0, 0, 0), g = anchor(from, 0.5, 0.86);
  ring(g[0], g[1], col, 320, 640, true);
  if (type) rise(from, type, col);
  return animate(dim, [{ opacity: 0 }, { opacity: 1, offset: 0.35 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 720, easing: 'ease-in-out', fill: 'forwards' })
    .then(function () { dim.remove(); });
}
function trailOf(a: number[], b: number[], mid: number[], html: (k: number) => string, n: number, gap: number, dur: number, spin: number) {
  for (var k = 0; k < n; k++) {
    (function (k: number) {
      var el = fx(html(k), 'part trail', 0, 0, 0);
      el.style.opacity = '0';
      sleep(k * gap).then(function () {
        return animate(el, [
          { transform: 'translate(' + a[0] + 'px,' + a[1] + 'px) translate(-50%,-50%) scale(.4)', opacity: 0 },
          { transform: 'translate(' + mid[0] + 'px,' + mid[1] + 'px) translate(-50%,-50%) rotate(' + spin / 2 + 'deg) scale(' + (0.9 - k * 0.08) + ')', opacity: 0.8 - k * 0.1, offset: 0.5 },
          { transform: 'translate(' + b[0] + 'px,' + b[1] + 'px) translate(-50%,-50%) rotate(' + spin + 'deg) scale(' + (0.7 - k * 0.06) + ')', opacity: 0 }
        ], { duration: dur, easing: 'ease-in-out', fill: 'forwards' });
      }).then(function () { el.remove(); });
    })(k);
  }
}
/** a column of light coming down on a point */
function pillar(x: number, y: number, col: string, big: boolean) {
  if (reduced) return;
  var el = fx('', 'pillar', x, y, 0);
  el.style.setProperty('--mc', col);
  animate(el, [{ transform: 'translate(-50%,-100%) scaleY(0) scaleX(' + (big ? 1.5 : 1) + ')', opacity: 0.2 }, { transform: 'translate(-50%,-100%) scaleY(1) scaleX(' + (big ? 1.5 : 1) + ')', opacity: 1, offset: 0.3 }, { transform: 'translate(-50%,-100%) scaleY(1) scaleX(.2)', opacity: 0 }],
    { duration: 620, easing: 'ease-out', fill: 'forwards' }).then(function () { el.remove(); });
}
function crescentArc(from: number, to: number, col: string, big: boolean): Promise<unknown> {
  var e = ends(from, to), a = e[0], b = e[1], s = big ? 1.6 : 1.15, mid = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - (big ? 150 : 110)];
  var el = fx(shape('Calma', col, 46), 'part moonfx', 0, 0, 0);
  trailOf(a, b, mid, function (k) { return shape('Calma', col, 26 - k * 3); }, 5, 50, 640, 540);
  return animate(el, [
    { transform: 'translate(' + a[0] + 'px,' + a[1] + 'px) translate(-50%,-50%) rotate(0deg) scale(.5)', opacity: 0 },
    { transform: 'translate(' + mid[0] + 'px,' + mid[1] + 'px) translate(-50%,-50%) rotate(360deg) scale(' + s + ')', opacity: 1, offset: 0.5 },
    { transform: 'translate(' + b[0] + 'px,' + b[1] + 'px) translate(-50%,-50%) rotate(720deg) scale(' + s * 0.9 + ')', opacity: 1 }
  ], { duration: 640, easing: 'ease-in-out' }).then(function () { el.remove(); pillar(b[0], b[1] + 40, col, big); ring(b[0], b[1], col, big ? 340 : 240, 560); });
}
function lightningStrike(from: number, to: number, col: string, big: boolean): Promise<unknown> {
  var b = anchor(to, 0.5, 0.42), c = anchor(from, 0.5, 0.45);
  sparks(c[0], c[1], 5, function () { return shape('Caos', col, 18); }, 60, 420);
  if (reduced) return Promise.resolve();
  var bolt = function (k: number) {
    var x = b[0] + (wob() - 0.5) * 40, y = -10, d = 'M' + x.toFixed(0) + ' ' + y;
    for (var s = 1; s <= 7; s++) { x = x + (b[0] - x) * (s / 7) + (wob() - 0.5) * 34 * (1 - s / 7); y = -10 + (b[1] + 10) * (s / 7); d += ' L' + x.toFixed(0) + ' ' + y.toFixed(0); }
    var w = arena.clientWidth, h = arena.clientHeight;
    var el = fx('<svg width="' + w + '" height="' + h + '" viewBox="0 0 ' + w + ' ' + h + '" aria-hidden="true"><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (big ? 22 : 15) + '" stroke-linejoin="round" opacity=".5"/>' +
      '<path d="' + d + '" fill="none" stroke="#fffbe6" stroke-width="' + (big ? 7 : 5) + '" stroke-linejoin="round"/></svg>', 'boltfx', 0, 0, 0);
    return sleep(k ? 140 : 90).then(function () { el.remove(); });
  };
  return sleep(120).then(function () { flashAt(b[0], b[1], col, big ? 520 : 380, 260); return bolt(0); }).then(function () { return sleep(60); })
    .then(function () { flashAt(b[0], b[1], '#ffffff', big ? 600 : 420, 300); if (big) pulse(arena, 'quake', 420); return bolt(1); })
    .then(function () { sparks(b[0], b[1], big ? 12 : 8, function () { return shape('Caos', col, 22); }, big ? 140 : 100, 560); });
}
function starShot(from: number, to: number, col: string, big: boolean): Promise<unknown> {
  var e = ends(from, to), a = e[0], b = e[1], mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 20];
  var el = fx(shape('Cervello', col, big ? 64 : 46), 'part starfx', 0, 0, 0);
  trailOf(a, b, mid, function (k) { return shape('Cervello', k % 2 ? '#ffffff' : col, 22 - k * 2); }, 6, 35, 420, 720);
  return animate(el, [
    { transform: 'translate(' + a[0] + 'px,' + a[1] + 'px) translate(-50%,-50%) rotate(0deg) scale(.4)', opacity: 0 },
    { transform: 'translate(' + b[0] + 'px,' + b[1] + 'px) translate(-50%,-50%) rotate(900deg) scale(1.1)', opacity: 1 }
  ], { duration: 420, easing: 'cubic-bezier(.5,0,.8,.6)' }).then(function () {
    el.remove();
    var r = fx('', 'rays', b[0], b[1], 0); r.style.setProperty('--mc', col);
    animate(r, [{ transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(' + (big ? 1.8 : 1.3) + ') rotate(40deg)', opacity: 0 }], { duration: 520, easing: 'ease-out', fill: 'forwards' }).then(function () { r.remove(); });
    sparks(b[0], b[1], big ? 12 : 8, function () { return shape('Cervello', col, 20); }, big ? 130 : 95, 560);
  });
}
function soundWaves(from: number, to: number, col: string, big: boolean): Promise<unknown> {
  var e = ends(from, to), a = e[0], b = e[1], n = big ? 5 : 3, dir = b[0] > a[0] ? 1 : -1, all: Promise<unknown>[] = [];
  for (var k = 0; k < n; k++) {
    (function (k: number) {
      var el = fx('', 'wave', 0, 0, 0);
      el.style.setProperty('--mc', col); el.style.opacity = '0';
      if (dir < 0) el.classList.add('back');
      all.push(sleep(k * 110).then(function () {
        return animate(el, [
          { transform: 'translate(' + a[0] + 'px,' + a[1] + 'px) translate(-50%,-50%) scale(.4)', opacity: 0 },
          { transform: 'translate(' + ((a[0] + b[0]) / 2) + 'px,' + ((a[1] + b[1]) / 2) + 'px) translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.5 },
          { transform: 'translate(' + b[0] + 'px,' + b[1] + 'px) translate(-50%,-50%) scale(' + (big ? 1.7 : 1.3) + ')', opacity: 0.2 }
        ], { duration: 520, easing: 'ease-in', fill: 'forwards' });
      }).then(function () { el.remove(); }));
    })(k);
  }
  trailOf(a, b, [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 50], function (k) { return shape('Chiacchiera', col, 24 - k * 2); }, 4, 90, 620, 60);
  return Promise.all(all).then(function () { var m = $('m-' + to); if (m) pulse(m, 'dizzy', 520); sparks(b[0], b[1], 8, function () { return shape('Chiacchiera', col, 20); }, 100, 600); });
}
function heartStream(from: number, to: number, col: string, big: boolean): Promise<unknown> {
  var e = ends(from, to), a = e[0], b = e[1], n = big ? 9 : 6, all: Promise<unknown>[] = [];
  for (var k = 0; k < n; k++) {
    (function (k: number) {
      var el = fx(shape('Cuore', col, big ? 34 : 26), 'part heartfx', 0, 0, 0), side = k % 2 ? 1 : -1;
      el.style.opacity = '0';
      all.push(sleep(k * 60).then(function () {
        return animate(el, [
          { transform: 'translate(' + a[0] + 'px,' + a[1] + 'px) translate(-50%,-50%) scale(.3)', opacity: 0 },
          { transform: 'translate(' + ((a[0] + b[0]) / 2) + 'px,' + ((a[1] + b[1]) / 2 + side * 34) + 'px) translate(-50%,-50%) scale(1.1) rotate(' + side * 18 + 'deg)', opacity: 1, offset: 0.5 },
          { transform: 'translate(' + b[0] + 'px,' + b[1] + 'px) translate(-50%,-50%) scale(.8)', opacity: 0.4 }
        ], { duration: 560, easing: 'ease-in-out', fill: 'forwards' });
      }).then(function () { el.remove(); }));
    })(k);
  }
  return Promise.all(all).then(function () { flashAt(b[0], b[1], col, big ? 480 : 360, 320); sparks(b[0], b[1], big ? 12 : 8, function () { return shape('Cuore', col, 20); }, big ? 130 : 95, 600); });
}
function plainStrike(from: number, to: number, big: boolean): Promise<unknown> {
  var b = anchor(to, 0.5, 0.42);
  streaks(from);
  var m = $('m-' + from);
  return Promise.all([m ? pulse(m, from === 0 ? 'lunge-me' : 'lunge-opp', 340) : null, sleep(200).then(function () { ring(b[0], b[1], '#ffffff', big ? 300 : 220, 420); })]);
}
/** a creature's spell: its type decides how it flies (null for a plain move), big for the strongest moves */
export function castSpell(from: number, to: number, type: string | null, col: string, big: boolean): Promise<unknown> {
  var go = function (): Promise<unknown> {
    if (!type) return plainStrike(from, to, big);
    if (reduced) return Promise.resolve();
    if (type === 'Calma') return crescentArc(from, to, col, big);
    if (type === 'Caos') return lightningStrike(from, to, col, big);
    if (type === 'Cervello') return starShot(from, to, col, big);
    if (type === 'Chiacchiera') return soundWaves(from, to, col, big);
    return heartStream(from, to, col, big);
  };
  return big ? charge(from, type, col).then(go) : go();
}
