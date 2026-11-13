import type { TypeName } from '../data/types';
import type { Take } from '../data/move-fx';
import { sleep } from './common';
import { animate, ring, sparks, flashAt, streaks, pulse, FOX } from './effects';
import { sfx } from '../audio';
import { SPR } from '../render/svg';
import { INK, type P, lerp, tr, gone, body, curve, along, piece, layer, beam, trace, fade, flash, takes, boom, boltPath } from './spell-kit';
import { darken, magicCircle, band, glow, lifeBack } from './spells';
import { arena } from './battle-screen';
import * as A from './friend-props';

/* The friends' moves, each with a scene of its own: Costanzo's podium and the GIÀ LO SAI that fly at the foe, Antonio's
   plane from Formia to Torino to AMERICA, Andrea's fox diving from the sky, Valentin's disco ball, Forchetta's ace,
   Zendavid's speakers, Claudia's Trinità. The engine says which move it is (an «act» sign after «X usa Y!»); the scene
   reads what comes next in the battle (a hit, a miss, the robot falling, a joke nobody laughs at) and resolves on the
   impact, so the damage lands on it. Only drawing: the battle and its golden files do not change with it. */

export interface Act {
  from: number; to: number;
  /** the move */
  id: string; name: string; kind: string;
  /** its power now (Sono Cucinato grows), 0 for a move with none */
  power: number;
  /** the person's type of the moment, and its colour */
  t: TypeName; col: string;
  /** what the engine's next events say: a hit, a miss, or no damage */
  outcome: 'hit' | 'miss' | 'none'; crit: boolean; lvl: number;
  /** the signs and the words that follow, up to the next move */
  signs: string[]; texts: string[];
}
interface F extends Act {
  /** the caster's body, the top of its head, its eyes, its feet (or the bottom of the arena, for a bust); the foe's */
  a: P; head: P; eyes: P; feet: P; b: P; foeHead: P; foeFeet: P;
  /** how many pixels a unit of the caster's portrait is (the portraits are 260 × 300): for what goes on a face */
  u: number;
  /** which way the foe is on the screen (1: to the right) */
  dir: number;
  /** how grand it is: 1 for a small move, up to about 1.6 */
  k: number;
  /** hit, miss, none */
  hit: boolean; miss: boolean;
  /** the arena */
  w: number; h: number;
}
/** what a scene may leave behind: something to do before each blow lands (La Trinità hits three times) */
export interface Shown { done: Promise<void>; beforeHit?: (n: number) => Promise<void> }
type Scene = (f: F) => Promise<void> | Shown;

/* ---------- the kit: pieces, how they come and go ---------- */
const ANY = 'sp-star fm';
/** a piece at a point (its centre) */
function put(html: string, p: P, cls?: string): HTMLElement {
  const el = piece(html, ANY + (cls ? ' ' + cls : ''));
  el.style.transform = tr(p);
  return el;
}
/** it comes in: from small, with a little overshoot */
function pop(el: HTMLElement, p: P, ms: number, o?: { s0?: number; s1?: number; r0?: number; r1?: number; delay?: number }): Promise<unknown> {
  const s0 = o && o.s0 != null ? o.s0 : 0.2, s1 = o && o.s1 != null ? o.s1 : 1, r0 = (o && o.r0) || 0, r1 = (o && o.r1) || 0;
  return animate(el, [{ transform: tr(p) + ' scale(' + s0 + ') rotate(' + r0 + 'deg)', opacity: 0 }, { transform: tr(p) + ' scale(' + (s1 * 1.12).toFixed(2) + ') rotate(' + r1 + 'deg)', opacity: 1, offset: 0.6 },
    { transform: tr(p) + ' scale(' + s1 + ') rotate(' + r1 + 'deg)', opacity: 1 }], { duration: ms, delay: (o && o.delay) || 0, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'both' });
}
/** it flies from a to b, lifted in the middle, turning and growing as asked */
function fly(el: HTMLElement, a: P, b: P, ms: number, o?: { lift?: number; spin?: number; s0?: number; s1?: number; ease?: string; delay?: number; fadeEnd?: boolean }): Promise<unknown> {
  const cv = curve(a, b, (o && o.lift) || 0), spin = (o && o.spin) || 0, s0 = o && o.s0 != null ? o.s0 : 1, s1 = o && o.s1 != null ? o.s1 : 1;
  return animate(el, along(cv.at, 14, function (t) { return 'scale(' + lerp(s0, s1, t).toFixed(2) + ') rotate(' + (spin * t).toFixed(0) + 'deg)'; }, function (t) { return o && o.fadeEnd && t > 0.85 ? (1 - t) / 0.15 : 1; }),
    { duration: ms, delay: (o && o.delay) || 0, easing: (o && o.ease) || 'cubic-bezier(.4,0,.7,1)', fill: 'both' });
}
/** it falls from above onto p, and squashes there */
function land(el: HTMLElement, p: P, ms: number, hgt: number, delay?: number): Promise<unknown> {
  return animate(el, [{ transform: tr([p[0], p[1] - hgt]) + ' scale(1,1.1)', opacity: 0 }, { transform: tr([p[0], p[1] - hgt * 0.5]) + ' scale(1,1.1)', opacity: 1, offset: 0.3 },
    { transform: tr(p) + ' scale(1.18,.82)', opacity: 1, offset: 0.78 }, { transform: tr(p) + ' scale(1)', opacity: 1 }], { duration: ms, delay: delay || 0, easing: 'cubic-bezier(.5,0,.8,1)', fill: 'both' });
}
/** it rises out of the floor at p */
function rise(el: HTMLElement, p: P, ms: number, delay?: number): Promise<unknown> {
  return animate(el, [{ transform: tr([p[0], p[1] + 40]) + ' scale(1,.2)', opacity: 0 }, { transform: tr([p[0], p[1] - 8]) + ' scale(1,1.08)', opacity: 1, offset: 0.65 }, { transform: tr(p) + ' scale(1)', opacity: 1 }],
    { duration: ms, delay: delay || 0, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'both' });
}
/** it goes: fades, a little bigger, and is taken away */
function bye(el: HTMLElement, ms: number, delay?: number, p?: P): Promise<unknown> {
  const t = p ? tr(p) + ' ' : '';
  return animate(el, [{ opacity: 1 }, { opacity: 0, transform: t + 'scale(1.15)' }], { duration: ms, delay: delay || 0, easing: 'ease-in', fill: 'both' }).then(gone(el));
}
/** it wobbles where it is */
function wiggle(el: HTMLElement, p: P, ms: number, deg: number, n?: number): Promise<unknown> {
  const fr: Keyframe[] = [], q = n || 6;
  for (let k = 0; k <= q; k++) fr.push({ transform: tr(p) + ' rotate(' + (k === q ? 0 : (k % 2 ? deg : -deg) * (1 - k / q)).toFixed(1) + 'deg)' });
  return animate(el, fr, { duration: ms, easing: 'ease-in-out', fill: 'both' });
}
/** a word in comic letters that bursts out at p and goes up */
function shout(text: string, col: string, p: P, px: number, ms?: number, delay?: number): Promise<unknown> {
  /* never above the top of the arena, where it would be cut */
  p = [p[0], Math.max(p[1], px * 0.75 + 6)];
  const el = put(A.word(text, col, px), p, 'fm-txt'), d = ms || 900;
  return animate(el, [{ transform: tr(p) + ' scale(.2) rotate(-12deg)', opacity: 0 }, { transform: tr(p) + ' scale(1.25) rotate(4deg)', opacity: 1, offset: 0.22 }, { transform: tr([p[0], p[1] - 10]) + ' scale(1) rotate(-2deg)', opacity: 1, offset: 0.7 },
    { transform: tr([p[0], p[1] - 34]) + ' scale(.92)', opacity: 0 }], { duration: d, delay: delay || 0, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' }).then(gone(el));
}
/** pieces flung out from a point */
function burstOf(p: P, n: number, html: (q: number) => string, spread: number, ms: number) { sparks(p[0], p[1], n, html, spread, ms); }
/** confetti of the given colours */
const CONF = ['#ff5a7a', '#ffd84d', '#57c968', '#5ab0ff', '#c3a0ff', '#ff8a3c'];
function confetti(p: P, n: number, spread: number, ms: number) { burstOf(p, n, function (q) { return A.confetto(CONF[q % CONF.length], 16 + (q % 3) * 4, q); }, spread, ms); }
/** the caster takes a step toward the foe and back */
function step(f: F, frac: number, ms: number) {
  const m = document.getElementById('m-' + f.from);
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + ((f.b[0] - f.a[0]) * frac).toFixed(0) + 'px,' + ((f.b[1] - f.a[1]) * frac).toFixed(0) + 'px) scale(1.05)', offset: 0.45 }, { transform: 'none' }], { duration: ms, easing: 'ease-in-out' });
}
/** a ray from a to b, drawn in one stroke */
function zap(a: P, b: P, col: string, w: number, ms: number, lift?: number): Promise<unknown> {
  const L = layer(beam(curve(a, b, lift || 0).d, col, w));
  return trace(L, ms).then(function () { fade(L, 260, 40); });
}
/** a lightning bolt from a to b */
function bolt(a: P, b: P, col: string, w: number) {
  const L = layer(beam(boltPath(a[0], a[1], b[0], b[1], 7, 60), col, w));
  return trace(L, 120).then(function () { fade(L, 300, 60); });
}
/** the blow lands on the foe: a starburst, a ring, the foe takes it its own way; a miss whizzes past */
function strike(f: F, take: Take, col?: string, k?: number): Promise<void> {
  const c = col || f.col, kk = k || f.k;
  if (f.miss) { sfx('dodge'); return sleep(60); }
  if (!f.hit) return Promise.resolve();
  const s = put(boom(c), f.b, 'fm-boom'), w = 150 * kk;
  s.style.width = w + 'px'; s.style.height = w + 'px';
  animate(s, [{ transform: tr(f.b) + ' scale(.2) rotate(-20deg)', opacity: 1 }, { transform: tr(f.b) + ' scale(1.1) rotate(10deg)', opacity: 1, offset: 0.4 }, { transform: tr(f.b) + ' scale(1.35) rotate(18deg)', opacity: 0 }],
    { duration: 420, easing: 'ease-out', fill: 'both' }).then(gone(s));
  ring(f.b[0], f.b[1], c, 260 * kk, 560);
  takes(f.to, take, kk);
  const m = document.getElementById('m-' + f.to); if (m) pulse(m, 'flash', 360);
  if (f.crit || f.lvl > 0) { ring(f.b[0], f.b[1], '#ffffff', 420 * kk, 700); flash(f.lvl > 0 ? c : '#ffffff', 420, f.lvl > 1 || f.crit ? 0.5 : 0.35); }
  if (f.crit || f.lvl > 1 || kk >= 1.45) pulse(arena, 'quake', 420);
  return sleep(70);
}
/** a hex on the foe, when the move does no damage: its pieces turn round it and fade */
function around(f: F, html: (q: number) => string, n: number, ms: number) {
  const c = f.foeHead;
  for (let q = 0; q < n; q++) {
    const el = put(html(q), c), a0 = q / n * Math.PI * 2, fr: Keyframe[] = [];
    for (let s = 0; s <= 12; s++) { const t = s / 12, a = a0 + t * Math.PI * 2.2; fr.push({ transform: tr([c[0] + Math.cos(a) * 70, c[1] + 10 + Math.sin(a) * 22]) + ' scale(' + (0.6 + Math.sin(t * Math.PI) * 0.5).toFixed(2) + ')', opacity: t < 0.1 ? t * 10 : t > 0.85 ? (1 - t) / 0.15 : 1 }); }
    animate(el, fr, { duration: ms, delay: q * 40, easing: 'linear', fill: 'both' }).then(gone(el));
  }
}
/** the healing light on the caster: motes going up, a ring at the feet */
function mend(f: F, col: string) {
  ring(f.feet[0], f.feet[1], col, 240, 820, true);
  for (let q = 0; q < 9; q++) {
    const x = f.a[0] + (q - 4) * 14, el = put('<i class="sp-mote"></i>', [x, f.feet[1]]);
    el.style.setProperty('--mc', col);
    animate(el, [{ transform: tr([x, f.feet[1] - 10]) + ' scale(.5)', opacity: 0 }, { transform: tr([x + (q % 2 ? 6 : -6), lerp(f.feet[1], f.head[1], 0.5)]) + ' scale(1.2)', opacity: 1, offset: 0.5 },
      { transform: tr([x, f.head[1] - 20]) + ' scale(.6)', opacity: 0 }], { duration: 900, delay: q * 60, easing: 'ease-out', fill: 'both' }).then(gone(el));
  }
}
const has = (f: F, a: string) => f.signs.indexOf(a) >= 0;
const said = (f: F, w: string) => f.texts.some(function (t) { return t.indexOf(w) >= 0; });
/** a point between the two, at t, lifted */
const between = (f: F, t: number, up: number): P => [lerp(f.a[0], f.b[0], t), lerp(f.a[1], f.b[1], t) - up];

/* ---------- the scenes, friend by friend ---------- */
const SCENES: Record<string, Scene> = {
  /* --- Antonio --- */
  /* a thermal camera frames the foe: the scan line goes down, the hot spots light up, a ray from his glasses */
  diagnosi: function (f) {
    const s = 170 * f.k, vf = put(A.viewfinder(f.col, s, 'DIF −20%'), f.b);
    sfx('reveal');
    pop(vf, f.b, 320, { s0: 1.8, s1: 1 });
    const heat = put('<i class="fm-heat"></i>', f.b); heat.style.setProperty('--mc', f.col);
    animate(heat, [{ opacity: 0, transform: tr(f.b) + ' scale(.6)' }, { opacity: 0.85, transform: tr(f.b) + ' scale(1)' }, { opacity: 0, transform: tr(f.b) + ' scale(1.1)' }], { duration: 1100, fill: 'both' }).then(gone(heat));
    const ln = put('<i class="fm-scan"></i>', [f.b[0], f.b[1] - s * 0.45]); ln.style.setProperty('--mc', f.col);
    animate(ln, [{ transform: tr([f.b[0], f.b[1] - s * 0.45]), opacity: 0 }, { transform: tr([f.b[0], f.b[1] - s * 0.3]), opacity: 1, offset: 0.15 }, { transform: tr([f.b[0], f.b[1] + s * 0.42]), opacity: 1, offset: 0.9 }, { transform: tr([f.b[0], f.b[1] + s * 0.45]), opacity: 0 }],
      { duration: 640, delay: 200, easing: 'ease-in-out', fill: 'both' }).then(gone(ln));
    [[-0.22, -0.18], [0.2, 0.05], [-0.05, 0.25]].forEach(function (d, q) {
      const p: P = [f.b[0] + d[0] * s, f.b[1] + d[1] * s], el = put(A.glyphDot('!', '#e23a4f', 26), p);
      pop(el, p, 260, { delay: 420 + q * 120 }).then(function () { bye(el, 300, 380); });
    });
    return sleep(900).then(function () { bye(vf, 300); return zap(f.eyes, f.b, f.col, 7, 160); }).then(function () { return strike(f, 'shake'); });
  },
  /* the white certificates come down one after another and are stamped; then the green light */
  certificati: function (f) {
    const many = f.texts.join(' ').match(/(\d) certificati/), n = said(f, 'già tutti i PS') ? 1 : Math.min(4, 1 + (many ? +many[1] : said(f, 'un certificato') ? 1 : 0));
    const els: HTMLElement[] = [];
    for (let q = 0; q < n; q++) {
      const p: P = [f.a[0] + (q - (n - 1) / 2) * 46, f.head[1] - 30 - q * 6], el = put(A.certificate(78), p);
      els.push(el);
      land(el, p, 420, 160, q * 170).then(function () { sfx('click'); flashAt(p[0], p[1], '#5bb36a', 70, 220); });
    }
    return sleep(420 + n * 170).then(function () {
      if (said(f, 'già tutti i PS')) { els.forEach(function (el) { bye(el, 300); }); return sleep(200); }
      sfx('heal');
      els.forEach(function (el, q) { fly(el, [f.a[0] + (q - (n - 1) / 2) * 46, f.head[1] - 30 - q * 6], f.a, 380, { s1: 0.2, delay: q * 60, fadeEnd: true }).then(gone(el)); });
      mend(f, '#5bb36a');
      glow(f.from, '#5bb36a', 800);
      return sleep(560);
    });
  },
  /* a simulation's grid on the floor, the robot drawn in it and made real; it runs at the foe. Or it wobbles: the fall
     comes right after, as it always did */
  simtoreal: function (f) {
    const g = put(A.simGrid(f.col, 240 * f.k), f.feet, 'fm-flat'), fail = has(f, 'robotFail');
    sfx('robot');
    rise(g, f.feet, 380);
    const r0: P = [f.a[0] + f.dir * 70, f.feet[1] - 40], bot = put(SPR.robot(), r0, 'fm-robot');
    bot.style.width = '64px';
    animate(bot, [{ transform: tr(r0) + ' scale(.4)', opacity: 0, filter: 'brightness(3) saturate(0)' }, { transform: tr(r0) + ' scale(1.1)', opacity: 0.6, filter: 'brightness(2) saturate(0)', offset: 0.5 }, { transform: tr(r0) + ' scale(1)', opacity: 1, filter: 'none' }],
      { duration: 520, delay: 220, fill: 'both' });
    for (let q = 0; q < 3; q++) sleep(260 + q * 110).then(function () { flashAt(r0[0] + (q - 1) * 18, r0[1] - 14, f.col, 60, 200); });
    return sleep(780).then(function () {
      bye(g, 400);
      if (fail) { return wiggle(bot, r0, 520, 16).then(function () { bot.remove(); }); }
      streaks(f.from); sfx('whoosh');
      const end: P = f.miss ? [f.b[0] + f.dir * 160, f.b[1] + 20] : [f.b[0] - f.dir * 20, f.b[1] + 10];
      return animate(bot, along(curve(r0, end, 30).at, 10, function (t) { return 'rotate(' + (f.dir * 8 * Math.sin(t * 20)).toFixed(1) + 'deg)'; }), { duration: 340, easing: 'ease-in', fill: 'both' }).then(function () {
        if (!f.miss) burstOf(f.b, 10, function (q) { return A.star(q % 2 ? '#ffffff' : f.col, 18); }, 110, 520);
        bye(bot, 220);
        return strike(f, 'recoil');
      });
    });
  },
  /* the route on the map: Formia, Torino, the United States. The plane goes as far as he has got */
  america: function (f) {
    const lv = said(f, 'AMERICA') ? 2 : said(f, 'Torino') ? 1 : 0;
    const low = (p: P): P => [p[0], Math.max(64, p[1])], P0: P = low([f.a[0], f.head[1] - 10]), P1: P = low(between(f, 0.5, 120)), P2: P = low([f.b[0], f.foeHead[1] - 40]);
    const pins = [put(A.pin('#3b8fd9', 64, 'FORMIA'), P0), put(A.pin('#c3a0ff', 64, 'TORINO'), P1), put(A.pin('#e23a4f', 64, 'USA'), P2)];
    pins.forEach(function (el, q) { pop(el, [P0, P1, P2][q], 320, { delay: q * 120 }); });
    const route = layer('<path d="' + curve(P0, P1, 30).d + '" stroke="' + INK + '" stroke-width="5" stroke-dasharray="2 12" opacity=".7"/><path d="' + curve(P1, P2, 30).d + '" stroke="' + INK + '" stroke-width="5" stroke-dasharray="2 12" opacity=".7"/>');
    const pl = put(A.plane(f.col, 70), P0);
    sfx('plane');
    return sleep(420).then(function () {
      return fly(pl, P0, lv === 0 ? between(f, 0.3, 60) : P1, 520, { lift: 40, s0: 0.6, s1: 1 });
    }).then(function () {
      if (lv === 2) {
        const fl = put(A.usa(160 * f.k), [f.b[0], f.b[1] - 10], 'fm-back');
        pop(fl, [f.b[0], f.b[1] - 10], 420, { s0: 0.3, r0: -10 }).then(function () { wiggle(fl, [f.b[0], f.b[1] - 10], 600, 3); });
        shout('AMERICA!', '#e23a4f', [f.b[0], f.foeHead[1] - 70], 46 * f.k, 1200);
        for (let q = 0; q < 6; q++) sleep(q * 70).then(function () { burstOf([f.b[0] + (q - 3) * 30, f.foeHead[1] - 40], 3, function () { return A.star(q % 2 ? '#ffffff' : '#ffd84d', 20); }, 80, 600); });
        bye(fl, 500, 900);
      }
      const from = lv === 0 ? between(f, 0.3, 60) : P1;
      return fly(pl, from, f.b, lv === 2 ? 420 : 360, { lift: lv === 2 ? 120 : 20, spin: 0, s1: lv === 2 ? 1.5 : 1.1, ease: 'ease-in', delay: lv === 2 ? 260 : 0 });
    }).then(function () {
      pl.remove(); fade(route, 300); pins.forEach(function (el) { bye(el, 300); });
      return strike(f, lv === 2 ? 'squash' : 'recoil', lv === 2 ? '#e23a4f' : undefined, f.k * (1 + lv * 0.2));
    });
  },
  /* the paper written by night: it flies, it lands, it is stamped */
  paper: function (f) {
    const p0: P = [f.a[0] + f.dir * 40, f.head[1] - 10], pp = put(A.paper(80 * f.k, 'arXiv', '', f.col), p0);
    sfx('rustle');
    pop(pp, p0, 360, { r0: -20, r1: -6 });
    return sleep(420).then(function () { sfx('whoosh'); return fly(pp, p0, f.b, 440, { lift: 80, spin: f.dir * 360 }); }).then(function () {
      pp.remove();
      if (f.hit) {
        const st = put(A.paper(96 * f.k, 'arXiv', 'PUBLISHED', '#e23a4f'), f.b);
        land(st, f.b, 260, 60).then(function () { bye(st, 360, 360); });
        burstOf(f.b, 8, function (q) { return A.paper(26, '', '', f.col).replace('width="26"', 'width="' + (18 + q % 3 * 6) + '"'); }, 120, 700);
      }
      return strike(f, 'recoil');
    });
  },
  /* the descent of the gradient: a ball goes down the curve, step by step, to the bottom; then he is stronger */
  gradiente: function (f) {
    const p: P = [f.a[0], f.head[1] - 40], g = put(A.gradient(f.col, 170), p), pts = [[-70, -42], [-50, -14], [-34, 16], [-16, 36], [0, 42]];
    pop(g, p, 360);
    const dot = put(A.glyphDot('∇', '#ffd84d', 28), [p[0] + pts[0][0], p[1] + pts[0][1]]);
    const fr: Keyframe[] = pts.map(function (d) { return { transform: tr([p[0] + d[0] * 1.2, p[1] + d[1] * 0.85]) }; });
    sfx('shimmer');
    return animate(dot, fr, { duration: 720, delay: 320, easing: 'steps(5, end)', fill: 'both' }).then(function () {
      flashAt(p[0], p[1] + 36, '#ffd84d', 120, 300); shout('OTTIMO', f.col, [p[0], p[1] - 40], 30, 800);
      glow(f.from, f.col, 700); bye(dot, 300); bye(g, 400, 200);
      return sleep(420);
    });
  },
  /* the check-in, the turn before; then the plane comes down on the foe over the skyline of Chicago */
  chicago: function (f) {
    if (!f.hit && !f.miss) {
      const p: P = [f.a[0], f.head[1] - 30], bp = put(A.boarding(150, 'ORD'), p);
      sfx('plane');
      pop(bp, p, 380, { r0: -8, r1: -4 });
      shout('CHECK-IN', f.col, [p[0], p[1] - 50], 30, 1000, 300);
      return sleep(1000).then(function () { return bye(bp, 300); }).then(function () { return undefined; });
    }
    const sk = put(A.skyline('#3a4466', 300 * f.k), [f.b[0], f.foeFeet[1] - 40], 'fm-back');
    rise(sk, [f.b[0], f.foeFeet[1] - 40], 500);
    const top: P = [f.b[0] + f.dir * 260, -60], pl = put(A.plane(f.col, 110 * f.k), top);
    pl.style.transform = tr(top) + ' rotate(' + (f.dir > 0 ? 150 : 30) + 'deg)';
    shout('CHICAGO!', f.col, [f.b[0], f.foeHead[1] - 70], 48 * f.k, 1300, 300);
    sfx('plane');
    return sleep(420).then(function () {
      return animate(pl, [{ transform: tr(top) + ' rotate(' + (f.dir > 0 ? 145 : 35) + 'deg) scale(.6)' }, { transform: tr(f.b) + ' rotate(' + (f.dir > 0 ? 145 : 35) + 'deg) scale(1.4)' }], { duration: 460, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'both' });
    }).then(function () {
      pl.remove(); bye(sk, 500, 300);
      if (f.hit) for (let q = 0; q < 3; q++) sleep(q * 90).then(function () { ring(f.b[0], f.b[1], q % 2 ? '#ffffff' : f.col, 300 + q * 120, 600); });
      return strike(f, 'squash');
    });
  },

  /* --- Costanzo --- */
  /* the podium rises, the microphones whistle, and GIÀ, LO, SAI! fly at the foe one after another */
  comizio: function (f) {
    const p: P = [f.a[0] + f.dir * 50, f.feet[1] - 50], pd = put(A.podium(f.col, 110), p);
    rise(pd, p, 420);
    sfx('speech');
    for (let q = 0; q < 3; q++) sleep(300 + q * 90).then(function () { ring(p[0], p[1] - 50, f.col, 160 + q * 50, 500); });
    const words = ['GIÀ', 'LO', 'SAI!'];
    let chain: Promise<unknown> = sleep(480);
    words.forEach(function (w, q) {
      chain = chain.then(function () {
        const s: P = [p[0], p[1] - 70], el = put(A.bubble(w, f.col, 22 + q * 6), s);
        return fly(el, s, [f.b[0] - f.dir * 10, f.b[1] - 20 + q * 14], 300, { lift: 50 - q * 20, s0: 0.5, s1: 1.15 }).then(function () {
          bye(el, 160); if (q < 2 && f.hit) { takes(f.to, 'shake', 0.5); flashAt(f.b[0], f.b[1], '#ffffff', 80, 160); }
        });
      });
    });
    return chain.then(function () { bye(pd, 400, 200); return strike(f, 'recoil'); });
  },
  /* the spotlight, and the glasses of the right come down on his nose: he is someone else now */
  personaggismo: function (f) {
    const c = put(A.cone('#ffe680', 200), [f.a[0], f.a[1] - 40], 'fm-back');
    animate(c, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1500, fill: 'both' }).then(gone(c));
    const ey = at(f.from, 130, 140), g = put(A.glasses('#5ab0ff', 128 * f.u), ey);
    sfx('shimmer');
    land(g, ey, 520, 200, 200);
    return sleep(720).then(function () {
      flash('#ffffff', 260, 0.4); glow(f.from, f.col, 700);
      const m = said(f, 'di tipo ') ? f.texts.join(' ').split('di tipo ')[1].split(/[.\s]/)[0] : '';
      shout(m ? m.toUpperCase() + '!' : 'PERSONAGGIO!', f.col, [f.head[0], f.head[1] - 30], 32, 1000);
      bye(g, 400, 500);
      return sleep(700);
    });
  },
  /* the bidet, and its jet of water washes everything bad away */
  bidet: function (f) {
    const p: P = [f.a[0] + f.dir * 70, f.feet[1] - 40], bd = put(A.bidet(90), p);
    rise(bd, p, 380);
    sfx('shimmer');
    return sleep(380).then(function () {
      for (let q = 0; q < 14; q++) {
        const d = put(A.glyphDot('', '#7cc8f2', 12 + q % 3 * 4), [p[0], p[1] - 40]);
        fly(d, [p[0], p[1] - 40], [f.a[0] + (q % 5 - 2) * 20, f.head[1] + q % 4 * 20], 420, { lift: 80 + q % 3 * 20, delay: q * 30, fadeEnd: true }).then(gone(d));
      }
      return sleep(560);
    }).then(function () {
      for (let q = 0; q < 6; q++) { const b: P = [f.a[0] + (q - 3) * 18, f.feet[1] - 20], el = put('<i class="fm-bubble-o"></i>', b); animate(el, [{ transform: tr(b) + ' scale(.4)', opacity: 0 }, { transform: tr([b[0], f.head[1]]) + ' scale(1.2)', opacity: 0 }], { duration: 900, delay: q * 80, easing: 'ease-out', fill: 'both' }).then(gone(el)); }
      mend(f, '#7cc8f2'); shout('PULITO!', '#5ab0ff', [f.head[0], f.head[1] - 30], 30, 900);
      bye(bd, 400, 400);
      return sleep(600);
    });
  },
  /* the curva rises: flags and scarves in yellow and red, DAJE ROMA DAJE, and the big flag sweeps over the foe */
  daje: function (f) {
    const y = f.feet[1] - 10, flags: HTMLElement[] = [];
    for (let q = 0; q < 4; q++) {
      const p: P = [lerp(f.a[0] - 60 * f.dir, f.a[0] + 140 * f.dir, q / 3), y - (q % 2) * 20], el = put(q % 2 ? A.scarf('#8e1f2f', '#f0bc42', 110) : A.flag('#8e1f2f', '#f0bc42', 90), p);
      flags.push(el);
      rise(el, p, 380, q * 90).then(function () { wiggle(el, p, 700, 8); });
    }
    sfx('party');
    ['DAJE!', 'ROMA!', 'DAJE!'].forEach(function (w, q) { shout(w, q === 1 ? '#f0bc42' : '#e23a4f', [f.a[0] + f.dir * (40 + q * 50), f.head[1] - 20 - q * 16], 34, 700, 300 + q * 220); });
    return sleep(1000).then(function () {
      flags.forEach(function (el) { bye(el, 300); });
      const s: P = [f.a[0] + f.dir * 40, f.head[1]], big = put(A.flag('#8e1f2f', '#f0bc42', 150 * f.k, 'ROMA'), s);
      sfx('whoosh');
      return fly(big, s, f.miss ? [f.b[0] + f.dir * 200, f.b[1]] : f.b, 380, { lift: 60, spin: f.dir * 30, s1: 1.2 }).then(function () { bye(big, 240); return strike(f, 'recoil', '#f0bc42'); });
    });
  },
  /* the gavel comes down, and the motion of no confidence flies at the foe, stamped */
  mozione: function (f) {
    const p: P = [f.a[0] + f.dir * 60, f.head[1] + 10], gv = put(A.gavel(90), p);
    land(gv, p, 380, 90).then(function () { sfx('hit'); ring(p[0], p[1] + 30, f.col, 200, 400, true); });
    const doc = put(A.paper(76 * f.k, 'MOZIONE', 'SFIDUCIA', '#e23a4f'), [p[0], p[1] - 40]);
    pop(doc, [p[0], p[1] - 40], 300, { delay: 420, r1: -8 });
    return sleep(820).then(function () { bye(gv, 300); sfx('whoosh'); return fly(doc, [p[0], p[1] - 40], f.b, 360, { lift: 60, spin: f.dir * 200 }); }).then(function () { bye(doc, 200); return strike(f, 'shake'); });
  },
  /* the decree: no debate, it comes across in a flash */
  decreto: function (f) {
    streaks(f.from); sfx('whoosh');
    const s: P = [f.a[0] + f.dir * 30, f.a[1] - 20], doc = put(A.paper(70, 'DECRETO', 'URGENTE', '#e23a4f'), s);
    pop(doc, s, 200);
    return sleep(200).then(function () { step(f, 0.2, 320); return fly(doc, s, f.b, 220, { ease: 'ease-in', s1: 1.2 }); }).then(function () {
      if (f.hit) for (let q = 0; q < 4; q++) { const l = put('<i class="fm-speed"></i>', [f.b[0] - f.dir * (30 + q * 20), f.b[1] - 30 + q * 20]); l.style.setProperty('--mc', f.col); bye(l, 300, q * 30); }
      bye(doc, 200); return strike(f, 'recoil');
    });
  },
  /* the ballot box drops in front of the foe and it rains ballots: SI VOTA! */
  elezioni: function (f) {
    const p: P = [f.b[0], f.foeFeet[1] - 40], bx = put(A.ballotBox(f.col, 100 * f.k), p);
    land(bx, p, 420, 260).then(function () { sfx('hit'); ring(p[0], p[1] + 30, f.col, 260, 500, true); });
    shout('SI VOTA!', f.col, [f.b[0], f.foeHead[1] - 70], 46 * f.k, 1300, 300);
    for (let q = 0; q < 12; q++) {
      const x = f.b[0] + ((q * 37) % 160 - 80), el = put(A.ballot(f.col, 40), [x, -40]);
      animate(el, [{ transform: tr([x, -40]) + ' rotate(0deg)', opacity: 0 }, { transform: tr([x + 20, f.b[1] - 60]) + ' rotate(' + (q % 2 ? 160 : -160) + 'deg)', opacity: 1, offset: 0.7 }, { transform: tr([x, f.b[1] + 10]) + ' rotate(' + (q % 2 ? 300 : -300) + 'deg)', opacity: 0 }],
        { duration: 700, delay: 300 + q * 50, easing: 'ease-in', fill: 'both' }).then(gone(el));
    }
    return sleep(1100).then(function () { bye(bx, 300, 200); return strike(f, 'squash'); });
  },

  /* --- Andrea --- */
  /* the chart, the bell curve over the foe, the crosshair locks on: a thin, exact ray */
  analisi: function (f) {
    const c0: P = [f.a[0] + f.dir * 60, f.head[1]], ch = put(A.chart(f.col, 100), c0);
    pop(ch, c0, 340);
    const bl = put(A.bell(f.col, 130), [f.b[0], f.foeHead[1] - 20]);
    pop(bl, [f.b[0], f.foeHead[1] - 20], 340, { delay: 200 });
    const x = put(A.crosshair('#e23a4f', 90), f.b);
    sfx('ai');
    animate(x, [{ transform: tr(f.b) + ' scale(2.4) rotate(-90deg)', opacity: 0 }, { transform: tr(f.b) + ' scale(1) rotate(0deg)', opacity: 1 }], { duration: 520, delay: 380, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
    return sleep(960).then(function () {
      bye(bl, 300); bye(ch, 300, 100);
      return zap([c0[0], c0[1] - 20], f.b, '#e23a4f', 4, 140);
    }).then(function () { bye(x, 200); if (f.crit) shout('σ!', '#e23a4f', [f.b[0], f.foeHead[1] - 40], 40, 700); return strike(f, 'shake'); });
  },
  /* the winged fox takes off, out of sight; it falls from above on the foe in a storm of feathers */
  volpino: function (f) {
    const s: P = [f.a[0], f.head[1]], fox = put(FOX, s, 'fm-fox');
    fox.style.width = (70 * f.k) + 'px';
    sfx('whoosh');
    return animate(fox, [{ transform: tr(s) + ' scale(.5)', opacity: 0 }, { transform: tr([s[0], s[1] - 40]) + ' scale(1)', opacity: 1, offset: 0.3 }, { transform: tr([s[0] + f.dir * 60, -80]) + ' scale(.7) rotate(' + f.dir * 30 + 'deg)', opacity: 1 }],
      { duration: 480, easing: 'ease-in', fill: 'both' }).then(function () {
      const top: P = [f.b[0] - f.dir * 40, -80], end = f.miss ? [f.b[0] + f.dir * 120, f.b[1] + 40] as P : f.b;
      return animate(fox, [{ transform: tr(top) + ' scale(.9) rotate(' + f.dir * 160 + 'deg)' }, { transform: tr(end) + ' scale(1.3) rotate(' + f.dir * 170 + 'deg)' }], { duration: 300, delay: 120, easing: 'cubic-bezier(.6,0,.9,.7)', fill: 'both' });
    }).then(function () {
      fox.remove();
      if (f.hit) burstOf(f.b, 10, function () { return '<svg viewBox="0 0 20 40" width="14" height="28"><path d="M10 2C16 12 16 28 10 38C4 28 4 12 10 2Z" fill="#f4efe6" stroke="' + INK + '" stroke-width="2"/></svg>'; }, 130, 700);
      return strike(f, 'squash', '#ff8a3c');
    });
  },
  /* the gym and padel: the dumbbell goes up twice, the racket turns, +30% */
  palestra: function (f) {
    const p: P = [f.a[0] - f.dir * 50, f.a[1]], db = put(A.dumbbell(110), p), q0: P = [f.a[0] + f.dir * 60, f.a[1] - 10], rk = put(A.racket('#5ab0ff', 54), q0);
    sfx('shake');
    animate(db, [{ transform: tr(p), opacity: 0 }, { transform: tr([p[0], p[1] - 50]), opacity: 1, offset: 0.25 }, { transform: tr(p), offset: 0.5 }, { transform: tr([p[0], p[1] - 50]), offset: 0.75 }, { transform: tr(p), opacity: 1 }], { duration: 1000, easing: 'ease-in-out', fill: 'both' });
    animate(rk, [{ transform: tr(q0) + ' rotate(0deg) scale(.4)', opacity: 0 }, { transform: tr(q0) + ' rotate(' + f.dir * 360 + 'deg) scale(1)', opacity: 1 }], { duration: 700, delay: 200, easing: 'ease-out', fill: 'both' });
    return sleep(1000).then(function () {
      glow(f.from, '#ff8a3c', 700); shout('+30%', '#ff8a3c', [f.head[0], f.head[1] - 30], 36, 900);
      bye(db, 300); bye(rk, 300);
      return sleep(500);
    });
  },
  /* the more cooked he is, the bigger the fire: the pan, the sweat, and a fireball as big as his trouble */
  cucinato: function (f) {
    const hot = Math.max(0.6, Math.min(1.8, f.power / 70)), p: P = [f.a[0] + f.dir * 50, f.feet[1] - 30], pn = put(A.pan(110), p);
    rise(pn, p, 320);
    for (let q = 0; q < 3; q++) { const d = put(A.glyphDot('', '#7cc8f2', 12), [f.head[0] + (q - 1) * 22, f.head[1] + 10]); fly(d, [f.head[0] + (q - 1) * 22, f.head[1] + 10], [f.head[0] + (q - 1) * 34, f.head[1] + 50], 500, { delay: q * 90, fadeEnd: true }).then(gone(d)); }
    const fl = put(A.flame('#ff6a3c', 50 * hot), [p[0], p[1] - 30]);
    pop(fl, [p[0], p[1] - 30], 360, { delay: 260, s0: 0.2 });
    sfx('magic');
    return sleep(700).then(function () {
      bye(pn, 300);
      return fly(fl, [p[0], p[1] - 30], f.b, 360, { lift: 70, s1: 1.3, spin: f.dir * 40 });
    }).then(function () {
      fl.remove();
      if (f.hit) burstOf(f.b, Math.round(6 + hot * 5), function (q) { return A.flame(q % 2 ? '#ffb300' : '#ff6a3c', 22); }, 110 * hot, 600);
      return strike(f, 'recoil', '#ff6a3c', f.k * (0.8 + hot * 0.3));
    });
  },
  /* everything in the spreadsheet, weak points included: the red cell, and the cells fly at it */
  foglio: function (f) {
    const p: P = [lerp(f.a[0], f.b[0], 0.55), f.foeHead[1] - 30], sh = put(A.sheet(f.col, 130), p);
    pop(sh, p, 360);
    sfx('ai');
    const red: P = [p[0] + 14, p[1] + 20];
    for (let q = 0; q < 3; q++) sleep(380 + q * 160).then(function () { flashAt(red[0], red[1], '#e23a4f', 70, 140); });
    return sleep(900).then(function () {
      bye(sh, 300);
      for (let q = 0; q < 8; q++) { const c = put('<i class="fm-cell"></i>', [p[0] + (q % 4 - 1.5) * 30, p[1] + Math.floor(q / 4) * 18]); c.style.setProperty('--mc', q % 3 ? '#cfe8d2' : '#e23a4f'); fly(c, [p[0] + (q % 4 - 1.5) * 30, p[1] + Math.floor(q / 4) * 18], f.b, 300, { delay: q * 30, spin: 180, fadeEnd: true }).then(gone(c)); }
      return sleep(330 + 8 * 30);
    }).then(function () { return strike(f, 'shake'); });
  },
  /* over the net, at full strength: the ball goes up, the racket comes down, the ball goes through the foe */
  smash: function (f) {
    const top: P = [f.a[0] + f.dir * 30, f.head[1] - 90], b = put(A.ball(28), [f.a[0] + f.dir * 30, f.a[1]]), rk = put(A.racket('#5ab0ff', 60), [f.a[0] + f.dir * 10, f.head[1] - 40]);
    pop(rk, [f.a[0] + f.dir * 10, f.head[1] - 40], 260, { r1: -f.dir * 40 });
    fly(b, [f.a[0] + f.dir * 30, f.a[1]], top, 420, { ease: 'ease-out' });
    sfx('ball');
    return sleep(460).then(function () {
      animate(rk, [{ transform: tr([f.a[0] + f.dir * 10, f.head[1] - 40]) + ' rotate(' + -f.dir * 40 + 'deg)' }, { transform: tr([f.a[0] + f.dir * 30, f.head[1] - 60]) + ' rotate(' + f.dir * 70 + 'deg)' }], { duration: 160, easing: 'ease-in', fill: 'both' }).then(function () { bye(rk, 240); });
      flashAt(top[0], top[1], '#ffffff', 90, 160); sfx('whoosh');
      const L = layer(beam('M' + top[0].toFixed(1) + ' ' + top[1].toFixed(1) + ' L' + f.b[0].toFixed(1) + ' ' + f.b[1].toFixed(1), '#d8f04a', 6));
      trace(L, 180).then(function () { fade(L, 260); });
      return fly(b, top, f.miss ? [f.b[0] + f.dir * 140, f.b[1] + 60] : f.b, 180, { ease: 'ease-in', s1: 1.4 });
    }).then(function () { bye(b, 160); return strike(f, 'squash', '#d8f04a'); });
  },
  /* the big dive of the fox, wings open */
  picchiata2: function (f) {
    const top: P = [f.b[0] - f.dir * 80, -100], fox = put(FOX, top, 'fm-fox');
    fox.style.width = (130 * f.k) + 'px';
    const c = put(A.cone('#ffd8a0', 220), [f.b[0], f.b[1] - 60], 'fm-back');
    animate(c, [{ opacity: 0 }, { opacity: 1, offset: 0.4 }, { opacity: 0 }], { duration: 1200, fill: 'both' }).then(gone(c));
    sfx('whoosh');
    for (let q = 0; q < 10; q++) { const x = f.b[0] + (q - 5) * 30, fe = put('<svg viewBox="0 0 20 40" width="14" height="28"><path d="M10 2C16 12 16 28 10 38C4 28 4 12 10 2Z" fill="#f4efe6" stroke="' + INK + '" stroke-width="2"/></svg>', [x, -30]); animate(fe, [{ transform: tr([x, -30]) + ' rotate(0deg)', opacity: 0 }, { transform: tr([x + 30, f.b[1]]) + ' rotate(' + (q % 2 ? 260 : -260) + 'deg)', opacity: 1 }], { duration: 800, delay: q * 40, easing: 'ease-in', fill: 'both' }).then(gone(fe)); }
    return sleep(500).then(function () {
      return animate(fox, [{ transform: tr(top) + ' scale(.7) rotate(' + f.dir * 150 + 'deg)', opacity: 1 }, { transform: tr(f.b) + ' scale(1.4) rotate(' + f.dir * 170 + 'deg)', opacity: 1 }], { duration: 340, easing: 'cubic-bezier(.6,0,.9,.6)', fill: 'both' });
    }).then(function () { fox.remove(); return strike(f, 'sink', '#ff8a3c'); });
  },

  /* --- Valentin --- */
  /* the disco ball comes down, the lights sweep, confetti everywhere: WEEE! */
  weee: function (f) {
    const c: P = [lerp(f.a[0], f.b[0], 0.5), Math.max(50, Math.min(f.head[1], f.foeHead[1]) - 70)], db = put(A.disco(80), c);
    land(db, c, 500, 140);
    sfx('party');
    const L = layer([0, 1, 2, 3].map(function (q) { const a = 0.5 + q * 0.7; return '<path d="M' + c[0].toFixed(0) + ' ' + c[1].toFixed(0) + 'L' + (c[0] + Math.cos(a) * 400).toFixed(0) + ' ' + (c[1] + Math.sin(a) * 400).toFixed(0) + '" stroke="' + CONF[q] + '" stroke-width="16" opacity=".35"/>'; }).join(''), 'fm-rays');
    animate(L, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 0 }], { duration: 1200, delay: 300, fill: 'both' }).then(gone(L));
    return sleep(620).then(function () {
      shout('WEEE!', '#ffa04a', [f.a[0] + f.dir * 30, f.head[1] - 20], 44, 900);
      confetti(f.a, 14, 160, 800);
      for (let q = 0; q < 10; q++) { const el = put(A.confetto(CONF[q % 6], 18, q), f.a); fly(el, f.a, [f.b[0] + (q % 5 - 2) * 16, f.b[1] + (q % 3 - 1) * 20], 380, { delay: q * 25, lift: 40 + q * 6, spin: 400, fadeEnd: true }).then(gone(el)); }
      return sleep(420);
    }).then(function () { bye(db, 400, 200); if (f.hit) confetti(f.b, 14, 150, 800); return strike(f, 'spin', '#ffa04a'); });
  },
  /* for your own good: the spiral turns before the foe's eyes, the arrow goes round, and round */
  manipolazione: function (f) {
    const sp = put(A.spiral(f.col, 110), f.b), lp = put(A.loop(f.col, 70), [f.b[0], f.foeHead[1] - 30]);
    const bb = put(A.bubble('è per il tuo bene', f.col, 16), [f.a[0] + f.dir * 40, f.head[1] - 20]);
    pop(bb, [f.a[0] + f.dir * 40, f.head[1] - 20], 300).then(function () { bye(bb, 300, 700); });
    sfx('confused');
    animate(sp, [{ transform: tr(f.b) + ' scale(.2) rotate(0deg)', opacity: 0 }, { transform: tr(f.b) + ' scale(1) rotate(360deg)', opacity: 0.9, offset: 0.3 }, { transform: tr(f.b) + ' scale(1) rotate(1080deg)', opacity: 0.9, offset: 0.85 }, { transform: tr(f.b) + ' scale(1.3) rotate(1260deg)', opacity: 0 }],
      { duration: 1500, easing: 'linear', fill: 'both' }).then(gone(sp));
    animate(lp, [{ transform: tr([f.b[0], f.foeHead[1] - 30]) + ' rotate(0deg)', opacity: 0 }, { transform: tr([f.b[0], f.foeHead[1] - 30]) + ' rotate(-720deg)', opacity: 1, offset: 0.8 }, { transform: tr([f.b[0], f.foeHead[1] - 30]) + ' rotate(-800deg)', opacity: 0 }], { duration: 1400, delay: 200, easing: 'ease-in-out', fill: 'both' }).then(gone(lp));
    if (!f.miss) sleep(900).then(function () { mend(f, '#57c968'); });
    return sleep(1300);
  },
  /* the boarding pass for Copenhagen, and up he goes */
  copenhagen: function (f) {
    const p: P = [f.a[0], f.head[1] - 30], bp = put(A.boarding(140, 'CPH'), p);
    pop(bp, p, 320, { r0: -8, r1: -4 });
    const pl = put(A.plane('#d8324a', 90), [f.a[0] - f.dir * 60, f.feet[1] - 20]);
    pl.style.transform = tr([f.a[0] - f.dir * 60, f.feet[1] - 20]) + (f.dir < 0 ? ' scale(-1,1)' : '');
    sfx('plane');
    return sleep(600).then(function () {
      bye(bp, 260);
      return animate(pl, [{ transform: tr([f.a[0] - f.dir * 60, f.feet[1] - 20]) + (f.dir < 0 ? ' scale(-1,1)' : '') + ' rotate(0deg)', opacity: 0 }, { transform: tr([f.a[0], f.feet[1] - 40]) + (f.dir < 0 ? ' scale(-1,1)' : '') + ' rotate(-10deg)', opacity: 1, offset: 0.3 },
        { transform: tr([f.a[0] + f.dir * 260, -80]) + (f.dir < 0 ? ' scale(-1,1)' : '') + ' rotate(-30deg) scale(.6)', opacity: 1 }], { duration: 700, easing: 'ease-in', fill: 'both' });
    }).then(function () { pl.remove(); });
  },
  /* the green sunglasses, the crown of leaves, the sun: relax, nothing gets through */
  king: function (f) {
    const sun = put('<i class="sp-rays fm-sun"></i>', [f.a[0], f.a[1] - 20], 'fm-back');
    sun.style.setProperty('--mc', '#ffd84d');
    animate(sun, [{ transform: tr([f.a[0], f.a[1] - 20]) + ' scale(.3) rotate(0deg)', opacity: 0 }, { transform: tr([f.a[0], f.a[1] - 20]) + ' scale(1) rotate(60deg)', opacity: 0.8, offset: 0.4 }, { transform: tr([f.a[0], f.a[1] - 20]) + ' scale(1.1) rotate(120deg)', opacity: 0 }], { duration: 1600, fill: 'both' }).then(gone(sun));
    const ey = at(f.from, 130, 144), cw = at(f.from, 130, 46), sh = put(A.shades(128 * f.u), ey), cr = put(A.leafCrown(150 * f.u), cw);
    land(sh, ey, 480, 180, 200);
    pop(cr, cw, 420, { delay: 600 });
    sfx('shimmer');
    return sleep(1000).then(function () {
      ring(f.a[0], f.a[1], '#57c968', 260, 700); glow(f.from, '#57c968', 800);
      shout('RELAX', '#2e8f4e', [f.head[0], f.head[1] - 50], 32, 900);
      bye(sh, 400, 500); bye(cr, 400, 500);
      return sleep(700);
    });
  },
  /* everyone in line behind him: the conga runs into the foe */
  trenino: function (f) {
    sfx('party');
    const n = 5, els: HTMLElement[] = [];
    for (let q = 0; q < n; q++) {
      const s: P = [f.a[0] - f.dir * (40 + q * 46), f.feet[1] - 40], el = put(A.conga(CONF[q % 6], 46), s);
      els.push(el);
      const end: P = f.miss ? [f.b[0] + f.dir * (200 - q * 30), f.foeFeet[1] - 40] : [f.b[0] - f.dir * (q * 30), f.foeFeet[1] - 40], fr: Keyframe[] = [];
      for (let t = 0; t <= 12; t++) { const u = t / 12; fr.push({ transform: tr([lerp(s[0], end[0], u), lerp(s[1], end[1], u) - Math.abs(Math.sin(u * Math.PI * 4)) * 16]) + ' rotate(' + (t % 2 ? 8 : -8) + 'deg)', opacity: u > 0.92 && !f.miss && q === 0 ? 0.6 : 1 }); }
      animate(el, fr, { duration: 900, delay: q * 60, easing: 'linear', fill: 'both' });
    }
    shout('TRENINO!', '#ffa04a', [lerp(f.a[0], f.b[0], 0.5), Math.min(f.head[1], f.foeHead[1]) - 30], 36, 1000, 200);
    return sleep(900).then(function () { els.forEach(function (el, q) { bye(el, 300, q * 40); }); return strike(f, 'spin', '#ffa04a'); });
  },
  /* the party goes on at his place: cocktails, soft lights */
  afterparty: function (f) {
    for (let q = 0; q < 3; q++) { const p: P = [f.a[0] + (q - 1) * 60, f.head[1] - 10 + (q % 2) * 24], el = put(A.cocktail(CONF[q + 1], 50), p); pop(el, p, 360, { delay: q * 140, r1: (q - 1) * 10 }).then(function () { bye(el, 400, 500); }); }
    const db = put(A.disco(60), [f.a[0], f.head[1] - 70]);
    land(db, [f.a[0], f.head[1] - 70], 420, 100);
    sfx('party');
    return sleep(700).then(function () { mend(f, '#ffa04a'); glow(f.from, '#ffa04a', 700); bye(db, 400, 300); return sleep(600); });
  },
  /* the party of the year: speakers at the sides, the disco ball, fireworks, and the whole party on the foe */
  festona: function (f) {
    const sl: P = [f.a[0] - f.dir * 50, f.feet[1] - 60], sr: P = [f.b[0] + f.dir * 70, f.foeFeet[1] - 60], s1 = put(A.speaker(70), sl), s2 = put(A.speaker(70), sr);
    land(s1, sl, 420, 200); land(s2, sr, 420, 200, 100);
    const c: P = [lerp(f.a[0], f.b[0], 0.5), 70], db = put(A.disco(90), c);
    land(db, c, 500, 140, 150);
    sfx('party');
    for (let q = 0; q < 5; q++) sleep(500 + q * 160).then(function () { const p: P = [lerp(f.a[0], f.b[0], (q + 0.5) / 5), 60 + (q % 2) * 40]; burstOf(p, 10, function (k) { return A.star(CONF[(q + k) % 6], 14); }, 90, 700); sfx('ball'); });
    for (let q = 0; q < 3; q++) sleep(400 + q * 300).then(function () { ring(sl[0], sl[1], '#ffa04a', 200, 500); ring(sr[0], sr[1], '#ffa04a', 200, 500); });
    shout('LA FESTA DELL\'ANNO', '#ffa04a', [c[0], c[1] + 60], 34 * f.k, 1400, 300);
    return sleep(1300).then(function () {
      for (let q = 0; q < 16; q++) { const el = put(A.confetto(CONF[q % 6], 20, q), f.a); fly(el, f.a, [f.b[0] + (q % 5 - 2) * 20, f.b[1] + (q % 3 - 1) * 24], 420, { delay: q * 20, lift: 60 + q * 5, spin: 500, fadeEnd: true }).then(gone(el)); }
      return sleep(460);
    }).then(function () {
      [s1, s2, db].forEach(function (el) { bye(el, 400, 200); });
      if (f.hit) { confetti(f.b, 20, 180, 900); sleep(300).then(function () { lifeBack(f.from, f.to, '#ffa04a'); }); }
      return strike(f, 'lift', '#ffa04a');
    });
  },

  /* --- Forchetta --- */
  /* the toss, the racket, the ace */
  servizio: function (f) {
    const s: P = [f.a[0] + f.dir * 30, f.a[1]], top: P = [s[0], f.head[1] - 80], b = put(A.ball(26), s), rk = put(A.racket('#3b8fd9', 56), [f.a[0] + f.dir * 40, f.head[1]]);
    pop(rk, [f.a[0] + f.dir * 40, f.head[1]], 260, { r1: -f.dir * 60 });
    fly(b, s, top, 380, { ease: 'ease-out' });
    sfx('ball');
    return sleep(400).then(function () {
      animate(rk, [{ transform: tr([f.a[0] + f.dir * 40, f.head[1]]) + ' rotate(' + -f.dir * 60 + 'deg)' }, { transform: tr([f.a[0] + f.dir * 40, f.head[1] - 30]) + ' rotate(' + f.dir * 80 + 'deg)' }], { duration: 150, easing: 'ease-in', fill: 'both' }).then(function () { bye(rk, 200); });
      flashAt(top[0], top[1], '#ffffff', 80, 160);
      const L = layer(beam(curve(top, f.b, 10).d, '#d8f04a', 5));
      trace(L, 160).then(function () { fade(L, 260); });
      return fly(b, top, f.miss ? [f.b[0] + f.dir * 160, f.b[1] + 40] : f.b, 170, { ease: 'ease-in', s1: 1.3 });
    }).then(function () { bye(b, 140); if (f.hit) shout('ACE!', '#d8f04a', [f.b[0], f.foeHead[1] - 40], 40, 800); return strike(f, 'recoil', '#d8f04a'); });
  },
  /* the pit stop: the tyres roll in and spin, the wrench sparks, two seconds on the clock */
  pitstop: function (f) {
    const l: P = [f.a[0] - 70, f.feet[1] - 30], r: P = [f.a[0] + 70, f.feet[1] - 30], t1 = put(A.tyre(60), l), t2 = put(A.tyre(60), r);
    animate(t1, [{ transform: tr([l[0] - 160, l[1]]) + ' rotate(-720deg)', opacity: 0 }, { transform: tr(l) + ' rotate(0deg)', opacity: 1 }], { duration: 500, easing: 'ease-out', fill: 'both' });
    animate(t2, [{ transform: tr([r[0] + 160, r[1]]) + ' rotate(720deg)', opacity: 0 }, { transform: tr(r) + ' rotate(0deg)', opacity: 1 }], { duration: 500, easing: 'ease-out', fill: 'both' });
    const wr = put(A.wrench(80), [f.a[0], f.a[1] + 10]);
    pop(wr, [f.a[0], f.a[1] + 10], 260, { delay: 400 }).then(function () { wiggle(wr, [f.a[0], f.a[1] + 10], 400, 30, 4); for (let q = 0; q < 3; q++) sleep(q * 120).then(function () { burstOf([f.a[0] + 30, f.a[1] + 10], 4, function () { return A.star('#ffd84d', 12); }, 50, 300); }); });
    const tm = put(A.timer('#e23a4f', 60, '2.0s'), [f.head[0] + f.dir * 70, f.head[1] - 20]);
    pop(tm, [f.head[0] + f.dir * 70, f.head[1] - 20], 300, { delay: 500 });
    sfx('robotFix');
    return sleep(1100).then(function () {
      [t1, t2, wr, tm].forEach(function (el) { bye(el, 300); });
      mend(f, '#3b8fd9'); ring(f.a[0], f.a[1], '#3b8fd9', 260, 700);
      return sleep(500);
    });
  },
  /* the cryptic message: the phone, and question marks all round the foe's head */
  criptico: function (f) {
    const p: P = [f.a[0] + f.dir * 50, f.head[1] + 10], ph = put(A.phone('#8fd0f6', 60, 'ok…'), p);
    pop(ph, p, 300, { r1: f.dir * 8 });
    sfx('blip');
    const marks = ['?', '¿', '…', 'ok', '?!'];
    return sleep(420).then(function () {
      for (let q = 0; q < 5; q++) { const el = put(A.bubble(marks[q], '#3b8fd9', 18), [p[0], p[1] - 30]); fly(el, [p[0], p[1] - 30], [f.b[0] + (q - 2) * 20, f.foeHead[1] + (q % 2) * 20], 420, { delay: q * 70, lift: 60, fadeEnd: true }).then(gone(el)); }
      return sleep(560);
    }).then(function () {
      bye(ph, 300);
      if (!f.miss) around(f, function (q) { return A.glyphDot(marks[q % 5].slice(0, 1), '#8fd0f6', 28); }, 6, 1100);
      return sleep(900);
    });
  },
  /* the most Formian of all: the sea of Formia rises under the foe and comes down on it */
  formia: function (f) {
    const p: P = [f.b[0], f.foeFeet[1] - 30], wv = put(A.wave(220 * f.k), [p[0], p[1] + 60]);
    sfx('whoosh');
    shout('FORZA FORMIA!', '#3b8fd9', [lerp(f.a[0], f.b[0], 0.4), Math.min(f.head[1], f.foeHead[1]) - 30], 34, 1100);
    return animate(wv, [{ transform: tr([p[0] - f.dir * 120, p[1] + 60]) + ' scale(.5,.3)', opacity: 0 }, { transform: tr([p[0] - f.dir * 40, p[1] - 30]) + ' scale(1,1.1)', opacity: 1, offset: 0.6 }, { transform: tr([p[0], p[1] - 10]) + ' scale(1.05,.9)', opacity: 1 }],
      { duration: 700, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'both' }).then(function () {
      if (f.hit) for (let q = 0; q < 10; q++) { const d = put(A.glyphDot('', q % 2 ? '#ffffff' : '#7cc8f2', 14), f.b); fly(d, f.b, [f.b[0] + (q - 5) * 22, f.b[1] - 70 - q % 3 * 20], 420, { lift: 30, fadeEnd: true }).then(gone(d)); }
      bye(wv, 400, 100);
      if (f.hit) sleep(300).then(function () { lifeBack(f.from, f.to, '#3b8fd9'); });
      return strike(f, 'lift', '#3b8fd9');
    });
  },
  /* at the net, before you know it */
  volee: function (f) {
    const nt = put(A.net(130), [lerp(f.a[0], f.b[0], 0.5), Math.max(f.feet[1], f.foeFeet[1]) - 40]);
    rise(nt, [lerp(f.a[0], f.b[0], 0.5), Math.max(f.feet[1], f.foeFeet[1]) - 40], 260);
    streaks(f.from); sfx('ball');
    const b = put(A.ball(26), [f.a[0] + f.dir * 40, f.a[1] - 10]);
    return fly(b, [f.a[0] + f.dir * 40, f.a[1] - 10], f.miss ? [f.b[0] + f.dir * 160, f.b[1]] : f.b, 200, { lift: 20, ease: 'ease-in', s1: 1.3 }).then(function () { bye(b, 140); bye(nt, 300, 200); return strike(f, 'recoil', '#d8f04a'); });
  },
  /* a game on the Play: the pad, PLAYER 2, and the foe has no more fight in it */
  play: function (f) {
    const p: P = [lerp(f.a[0], f.b[0], 0.5), Math.min(f.head[1], f.foeHead[1]) - 10], gp = put(A.gamepad('#3b8fd9', 110), p);
    pop(gp, p, 340, { r0: -20 });
    sfx('blip');
    shout('PLAYER 2', '#3b8fd9', [p[0], p[1] - 50], 28, 1000, 200);
    return sleep(700).then(function () {
      wiggle(gp, p, 400, 10, 4);
      if (!f.miss) around(f, function (q) { return A.glyphDot(q % 2 ? '▼' : '✕', q % 2 ? '#e23a4f' : '#3b8fd9', 26); }, 5, 1000);
      bye(gp, 300, 400);
      return sleep(900);
    });
  },
  /* the point that ends it all: the scoreboard, the ball high up, lightning */
  matchpoint: function (f) {
    const sc: P = [lerp(f.a[0], f.b[0], 0.5), 60], sb = put(A.scoreboard(160, '40 – 0'), sc);
    land(sb, sc, 420, 80);
    shout('MATCH POINT!', '#d8f04a', [sc[0], sc[1] + 60], 40 * f.k, 1200, 300);
    const s: P = [f.a[0] + f.dir * 30, f.a[1]], top: P = [lerp(f.a[0], f.b[0], 0.3), 40], b = put(A.ball(30), s);
    sfx('ball');
    return fly(b, s, top, 600, { lift: 40, ease: 'ease-out', delay: 300 }).then(function () {
      flash('#ffffff', 200, 0.4); sfx('thunder');
      bolt(top, f.b, '#d8f04a', 10);
      return fly(b, top, f.miss ? [f.b[0] + f.dir * 140, f.b[1] + 60] : f.b, 160, { ease: 'ease-in', s1: 1.5 });
    }).then(function () { bye(b, 140); bye(sb, 400, 300); return strike(f, 'squash', '#d8f04a'); });
  },

  /* --- Zendavid --- */
  /* BAU! the dog's face, and the bark goes at the foe in rings */
  abbaia: function (f) {
    const p: P = [f.a[0] + f.dir * 60, f.head[1] + 20], dg = put(A.dog('#c9a06a', 80), p);
    pop(dg, p, 280, { r1: f.dir * 6 });
    sfx('bark');
    shout('BAU!', '#ff8fc1', [p[0] + f.dir * 30, p[1] - 50], 40, 800, 120);
    for (let q = 0; q < 4; q++) sleep(200 + q * 90).then(function () { const L = layer('<path d="' + 'M' + (p[0] + f.dir * (40 + q * 40)).toFixed(0) + ' ' + (p[1] - 30).toFixed(0) + 'Q' + (p[0] + f.dir * (60 + q * 40)).toFixed(0) + ' ' + p[1].toFixed(0) + ' ' + (p[0] + f.dir * (40 + q * 40)).toFixed(0) + ' ' + (p[1] + 30).toFixed(0) + '" stroke="#ff8fc1" stroke-width="6"/>'); fade(L, 300, 120); });
    return sleep(560).then(function () { bye(dg, 300); return strike(f, 'shake', '#ff8fc1'); });
  },
  /* the microphone, the spotlight. And then: everyone laughs (the AHAHAH that follows) or the crickets */
  battuta: function (f) {
    const p: P = [f.a[0] + f.dir * 50, f.feet[1] - 60], mc = put(A.micStand(56), p);
    rise(mc, p, 380);
    const c = put(A.cone('#ffe680', 190), [f.a[0], f.a[1] - 50], 'fm-back');
    animate(c, [{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: 1500, fill: 'both' }).then(gone(c));
    const bb = put(A.bubble('…e quindi', '#ff8fc1', 18), [p[0], p[1] - 90]);
    pop(bb, [p[0], p[1] - 90], 300, { delay: 300 });
    return sleep(1000).then(function () {
      bye(bb, 200); bye(mc, 400, 300);
      if (has(f, 'cricket') || !f.hit) {
        for (let q = 0; q < 2; q++) { const cp: P = [f.b[0] + (q ? 50 : -50), f.foeFeet[1] - 20], cr = put(A.cricket(50), cp); rise(cr, cp, 300, q * 150).then(function () { wiggle(cr, cp, 600, 6); bye(cr, 300, 600); }); }
        return sleep(600);
      }
      for (let q = 0; q < 4; q++) shout(['AH', 'AHAH', 'AHAHAH', 'AH'][q], '#ffd84d', [f.b[0] + (q - 1.5) * 40, f.foeHead[1] - 30 - (q % 2) * 20], 26 + q * 4, 800, q * 90);
      return sleep(300).then(function () { return strike(f, 'spin', '#ffd84d'); });
    });
  },
  /* the headphones come down on his ears: the world goes quiet, in soft rings */
  zen: function (f) {
    const hc = at(f.from, 130, 118), hp = put(A.headphones('#ff8fc1', 180 * f.u), hc);
    land(hp, hc, 480, 180);
    sfx('headphones');
    for (let q = 0; q < 4; q++) sleep(400 + q * 220).then(function () { ring(f.a[0], f.a[1], '#ffd2e6', 200 + q * 30, 900); });
    for (let q = 0; q < 4; q++) { const el = put(A.note('#ff8fc1', 22), [f.a[0] + (q - 1.5) * 30, f.head[1]]); animate(el, [{ transform: tr([f.a[0] + (q - 1.5) * 30, f.head[1]]), opacity: 0 }, { transform: tr([f.a[0] + (q - 1.5) * 40, f.head[1] - 70]), opacity: 1, offset: 0.5 }, { transform: tr([f.a[0] + (q - 1.5) * 46, f.head[1] - 120]), opacity: 0 }], { duration: 1000, delay: 400 + q * 120, fill: 'both' }).then(gone(el)); }
    return sleep(1100).then(function () { shout('ZEN', '#ff8fc1', [f.head[0], f.head[1] - 40], 34, 800); bye(hp, 400, 400); mend(f, '#ff8fc1'); return sleep(600); });
  },
  /* Kanye at full volume: two speakers rise, the bass shakes, the notes blow the foe away */
  stronger: function (f) {
    const l: P = [f.a[0] - 70, f.feet[1] - 60], r: P = [f.a[0] + 70, f.feet[1] - 60], s1 = put(A.speaker(64), l), s2 = put(A.speaker(64), r);
    rise(s1, l, 380); rise(s2, r, 380, 80);
    sfx('notes');
    for (let q = 0; q < 3; q++) sleep(400 + q * 180).then(function () { ring(l[0], l[1], '#ff8fc1', 180, 400); ring(r[0], r[1], '#ff8fc1', 180, 400); pulse(arena, 'quake', 200); });
    return sleep(900).then(function () {
      for (let q = 0; q < 8; q++) { const el = put(A.note(q % 2 ? '#ffffff' : '#ff8fc1', 26), f.a); fly(el, f.a, [f.b[0], f.b[1] + (q % 3 - 1) * 24], 360, { delay: q * 40, lift: 40 + (q % 4) * 20, spin: f.dir * 30, fadeEnd: true }).then(gone(el)); }
      return sleep(360 + 8 * 40);
    }).then(function () { bye(s1, 300); bye(s2, 300); return strike(f, 'recoil', '#ff8fc1'); });
  },
  /* he takes a piece of your move: the sampler cuts it out of the foe, and plays it back louder */
  campione: function (f) {
    const p: P = [f.b[0], f.foeHead[1] - 40], wf = put(A.waveform('#ff8fc1', 150), p);
    pop(wf, p, 320);
    sfx('blip');
    return sleep(600).then(function () {
      const cut = put('<i class="fm-cell big"></i>', p); cut.style.setProperty('--mc', '#ffd84d');
      return fly(cut, p, [f.a[0], f.head[1] - 20], 360, { lift: 50 }).then(function () {
        cut.remove(); bye(wf, 300); flashAt(f.a[0], f.head[1] - 20, '#ffd84d', 80, 200);
        for (let q = 0; q < 6; q++) { const el = put(A.note('#ffd84d', 26), f.a); fly(el, f.a, f.b, 300, { delay: q * 40, lift: 30 + q * 10, fadeEnd: true }).then(gone(el)); }
        return sleep(300 + 6 * 40);
      });
    }).then(function () { return strike(f, 'shake', '#ff8fc1'); });
  },
  /* the remix: a record spins, scratches back and forth */
  remix: function (f) {
    const p: P = [f.a[0] + f.dir * 60, f.a[1]], vn = put(A.vinyl('#ff8fc1', 90), p);
    pop(vn, p, 300);
    sfx('notes');
    animate(vn, [{ transform: tr(p) + ' rotate(0deg)' }, { transform: tr(p) + ' rotate(540deg)', offset: 0.4 }, { transform: tr(p) + ' rotate(380deg)', offset: 0.55 }, { transform: tr(p) + ' rotate(560deg)', offset: 0.7 }, { transform: tr(p) + ' rotate(900deg)' }], { duration: 1100, delay: 300, easing: 'ease-in-out', fill: 'both' });
    return sleep(1300).then(function () { shout('REMIX', '#ff8fc1', [f.head[0], f.head[1] - 40], 32, 800); glow(f.from, '#ff8fc1', 700); bye(vn, 300); return sleep(500); });
  },
  /* the drop: the turn before, the meter climbs; then everything comes down */
  drop: function (f) {
    if (!f.hit && !f.miss) {
      const p: P = [f.a[0], f.head[1] - 40];
      let el = put(A.meter('#57c968', 120, 1), p);
      pop(el, p, 300);
      sfx('notes');
      let chain: Promise<unknown> = sleep(300);
      for (let q = 2; q <= 10; q += 2) chain = chain.then(function () { const nx = put(A.meter('#57c968', 120, q), p); nx.style.transform = tr(p); el.remove(); el = nx; return sleep(130); });
      return chain.then(function () { shout('3… 2… 1…', '#ff8fc1', [p[0], p[1] - 50], 30, 900); return sleep(700); }).then(function () { bye(el, 300); });
    }
    const l: P = [f.a[0] - 80, f.feet[1] - 60], r: P = [f.b[0] + 80, f.foeFeet[1] - 60], s1 = put(A.speaker(80), l), s2 = put(A.speaker(80), r);
    land(s1, l, 360, 220); land(s2, r, 360, 220, 60);
    shout('DROP!', '#ff8fc1', [lerp(f.a[0], f.b[0], 0.5), 80], 56 * f.k, 1100, 300);
    return sleep(420).then(function () {
      flash('#ff8fc1', 300, 0.5); sfx('thunder'); pulse(arena, 'quake', 500);
      for (let q = 0; q < 4; q++) sleep(q * 90).then(function () { ring(f.a[0], f.a[1], q % 2 ? '#ffffff' : '#ff8fc1', 300 + q * 140, 700); });
      return sleep(300);
    }).then(function () { bye(s1, 400, 300); bye(s2, 400, 300); return strike(f, 'sink', '#ff8fc1'); });
  },

  /* --- Claudia --- */
  /* she listens: the foe's words come in to her ear, and go back louder, point by point */
  ascolta: function (f) {
    const p: P = at(f.from, 130 + f.dir * 78, 150), er = put(A.ear(f.col, 50), p), back = said(f, 'risponde punto per punto');
    pop(er, p, 300);
    sfx('shimmer');
    for (let q = 0; q < 3; q++) { const el = put(A.bubble('…', '#9aa1b8', 16), f.b); fly(el, f.b, p, 360, { delay: 200 + q * 90, lift: 30, s1: 0.5, fadeEnd: true }).then(gone(el)); }
    return sleep(700).then(function () {
      wiggle(er, p, 300, 8, 4);
      const pts = ['1.', '2.', '3.'];
      for (let q = 0; q < 3; q++) { const el = put(A.bubble(pts[q], f.col, back ? 26 : 20), p); fly(el, p, [f.b[0], f.b[1] - 20 + q * 18], 300, { delay: q * 80, lift: 40 - q * 10, s0: 0.6, s1: back ? 1.4 : 1.1 }).then(function () { bye(el, 120); }); }
      if (back) shout('+50%', f.col, [f.head[0], f.head[1] - 40], 34, 800);
      return sleep(300 + 3 * 80);
    }).then(function () { bye(er, 300); return strike(f, 'recoil'); });
  },
  /* separate tables: two tables slide apart, and a line is drawn between them */
  tavoli: function (f) {
    const m: P = [lerp(f.a[0], f.b[0], 0.5), lerp(f.feet[1], f.foeFeet[1], 0.5) - 40], t1 = put(A.tableTop(f.col, 90), m), t2 = put(A.tableTop(f.col, 90), m);
    sfx('door');
    animate(t1, [{ transform: tr(m) + ' scale(.5)', opacity: 0 }, { transform: tr(m) + ' scale(1)', opacity: 1, offset: 0.3 }, { transform: tr([m[0] - 80, m[1] + 10]) + ' scale(1)', opacity: 1 }], { duration: 700, easing: 'ease-in-out', fill: 'both' });
    animate(t2, [{ transform: tr(m) + ' scale(.5)', opacity: 0 }, { transform: tr(m) + ' scale(1)', opacity: 1, offset: 0.3 }, { transform: tr([m[0] + 80, m[1] - 10]) + ' scale(1)', opacity: 1 }], { duration: 700, easing: 'ease-in-out', fill: 'both' });
    return sleep(600).then(function () {
      const L = layer('<path d="M' + m[0].toFixed(0) + ' ' + (m[1] + 80).toFixed(0) + 'V' + (m[1] - 160).toFixed(0) + '" pathLength="1" stroke="' + INK + '" stroke-width="9" stroke-dasharray=".06 .04"/><path d="M' + m[0].toFixed(0) + ' ' + (m[1] + 80).toFixed(0) + 'V' + (m[1] - 160).toFixed(0) + '" pathLength="1" stroke="' + f.col + '" stroke-width="5" stroke-dasharray=".06 .04"/>');
      trace(L, 300);
      shout('TAVOLI SEPARATI', f.col, [m[0], m[1] - 120], 28, 1100);
      if (!f.miss && !said(f, 'non ha ancora fatto niente') && !said(f, 'non arriva niente')) around(f, function () { return A.glyphDot('✕', '#e23a4f', 26); }, 3, 900);
      return sleep(1000).then(function () { fade(L, 300); bye(t1, 300); bye(t2, 300); });
    });
  },
  /* the Trinità: the triangle lights up over her; the Padre, the Figlio and the Spirito strike one after another */
  trinita: function (f) {
    const p: P = [f.a[0] + f.dir * 30, Math.max(80, f.head[1] - 40)], tg = put(A.trinity(f.col, 110), p);
    sfx('magicUp');
    animate(tg, [{ transform: tr(p) + ' scale(.2) rotate(-120deg)', opacity: 0 }, { transform: tr(p) + ' scale(1) rotate(0deg)', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'both' });
    const names = ['PADRE', 'FIGLIO', 'SPIRITO'], corners: P[] = [[p[0], p[1] - 38], [p[0] + 44, p[1] + 38], [p[0] - 44, p[1] + 38]];
    const done = sleep(620);
    let hits = 0;
    return {
      done: done,
      beforeHit: function () {
        const q = hits++;
        if (q > 2) return Promise.resolve();
        const orb = put('<i class="sp-mote fm-orb"></i>', corners[q]); orb.style.setProperty('--mc', q === 1 ? '#ffffff' : f.col);
        shout(names[q], f.col, [f.b[0], f.foeHead[1] - 30 - q * 20], 24, 600);
        sfx('whoosh');
        return fly(orb, corners[q], f.b, 220, { lift: 30, s1: 1.6 }).then(function () {
          orb.remove(); flashAt(f.b[0], f.b[1], q === 1 ? '#ffffff' : f.col, 110, 220); takes(f.to, 'shake', 0.6 + q * 0.2);
          if (q === 2) { bye(tg, 400); ring(f.b[0], f.b[1], f.col, 300, 600); }
        });
      }
    };
  },
  /* the wrong road: a road sign that points everywhere but where you want to go */
  cattiva: function (f) {
    const p: P = [f.b[0] + f.dir * 70, f.foeFeet[1] - 70], sg = put(A.roadSign(f.col, 110, 'CATTIVA STRADA'), p);
    rise(sg, p, 380);
    const bb = put(A.bubble('così dice Costanzo', '#ffd84d', 15), [f.a[0] + f.dir * 30, f.head[1] - 20]);
    pop(bb, [f.a[0] + f.dir * 30, f.head[1] - 20], 300, { delay: 200 }).then(function () { bye(bb, 300, 800); });
    sfx('confused');
    return sleep(500).then(function () {
      wiggle(sg, p, 600, 10);
      if (!f.miss) around(f, function (q) { return A.glyphDot(['←', '↗', '↓', '→'][q % 4], f.col, 26); }, 4, 1100);
      return sleep(1000).then(function () { bye(sg, 300); });
    });
  },
  /* the Padre's sermon: soft words that go slowly to the foe, a halo over her */
  predica: function (f) {
    const hp0 = at(f.from, 130, 22), hl = put(A.halo('#ffd84d', 120 * f.u), hp0);
    pop(hl, hp0, 400);
    sfx('shimmer');
    const w = ['piano…', 'ascolta.', 'punto.'];
    for (let q = 0; q < 3; q++) { const el = put(A.bubble(w[q], f.col, 16), [f.a[0] + f.dir * 40, f.head[1] + 10]); fly(el, [f.a[0] + f.dir * 40, f.head[1] + 10], [f.b[0], f.b[1] - 20 + q * 16], 700, { delay: 300 + q * 200, lift: 40, ease: 'ease-in-out', fadeEnd: true }).then(gone(el)); }
    return sleep(1300).then(function () { bye(hl, 400); return strike(f, 'sink'); });
  },
  /* the blessing of the table: candles, warm light */
  benedizione: function (f) {
    const p: P = [f.a[0], f.feet[1] - 40], tb = put(A.tableTop(f.col, 100), p);
    rise(tb, p, 360);
    for (let q = 0; q < 3; q++) { const c: P = [p[0] + (q - 1) * 40, p[1] - 40], el = put(A.candle(22), c); pop(el, c, 300, { delay: 300 + q * 140 }).then(function () { bye(el, 400, 600); }); }
    const hp0 = at(f.from, 130, 22), hl = put(A.halo('#ffd84d', 120 * f.u), hp0);
    pop(hl, hp0, 400, { delay: 400 });
    sfx('heal');
    return sleep(900).then(function () { mend(f, '#ffd84d'); glow(f.from, '#ffd84d', 800); bye(tb, 400, 300); bye(hl, 400, 400); return sleep(700); });
  },
  /* the verdict: after hearing everyone, she decides. The triangle comes down on the foe, in a beam of light */
  verdetto: function (f) {
    const c = put(A.cone('#fff2b0', 230), [f.b[0], f.b[1] - 80], 'fm-back');
    animate(c, [{ opacity: 0 }, { opacity: 1, offset: 0.3 }, { opacity: 1, offset: 0.8 }, { opacity: 0 }], { duration: 1600, fill: 'both' }).then(gone(c));
    const top: P = [f.b[0], Math.max(90, f.foeHead[1] - 70)], tg = put(A.trinity(f.col, 130 * f.k), top);
    pop(tg, top, 500, { r0: -180 });
    const gv = put(A.gavel(90), [f.a[0] + f.dir * 60, f.head[1]]);
    pop(gv, [f.a[0] + f.dir * 60, f.head[1]], 300, { delay: 300 });
    shout('TRINITÀ!', f.col, [f.b[0], top[1] - 60], 46 * f.k, 1300, 400);
    sfx('magicUp');
    return sleep(900).then(function () {
      wiggle(gv, [f.a[0] + f.dir * 60, f.head[1]], 200, 30, 2); sfx('hit'); bye(gv, 300, 200);
      return animate(tg, [{ transform: tr(top) + ' scale(1)' }, { transform: tr(f.b) + ' scale(1.4)' }], { duration: 220, easing: 'ease-in', fill: 'both' });
    }).then(function () { bye(tg, 300); return strike(f, 'squash'); });
  }
};

/** a point of a fighter's portrait (260 × 300: the eyes at 142, the top of the hair about 40), on the arena; a creature
    has no portrait, and its body's box stands in for it */
function at(i: number, px: number, py: number): P {
  const svg = document.querySelector('#w-' + i + ' svg.spr-p') as SVGSVGElement | null, m = svg && svg.getScreenCTM();
  if (!svg || !m) return body(i, px / 260, py / 300);
  const r = arena.getBoundingClientRect();
  return [m.a * px + m.c * py + m.e - r.left, m.b * px + m.d * py + m.f - r.top];
}
/** the friends' moves with a scene of their own */
export function hasFriendScene(id: string): boolean { return !!SCENES[id]; }
/** the scene of a friend's move, from the one who does it to the one in front; it resolves on the impact */
export function friendScene(a: Act): Shown {
  const big = a.power >= 85, k = Math.min(1.6, 1 + Math.max(0, (a.power - 40) / 160) + (big ? 0.15 : 0));
  const r = arena.getBoundingClientRect(), b = at(a.to, 130, 165), aa = at(a.from, 130, 165), floor = (p: P): P => [p[0], Math.min(p[1], r.height - 34)];
  const e0 = at(a.from, 106, 142), e1 = at(a.from, 154, 142);
  const f: F = Object.assign({}, a, {
    a: aa, head: at(a.from, 130, 40), eyes: at(a.from, 130, 142), feet: floor(at(a.from, 130, 292)), b: b, foeHead: at(a.to, 130, 40), foeFeet: floor(at(a.to, 130, 292)),
    u: Math.max(0.4, Math.hypot(e1[0] - e0[0], e1[1] - e0[1]) / 48),
    dir: b[0] >= aa[0] ? 1 : -1, k: k, hit: a.outcome === 'hit', miss: a.outcome === 'miss', w: r.width, h: r.height
  });
  /* what every move has: the band with its name; the dark and the circle for the grand ones and for those on oneself */
  const charge = a.kind === 'atk' && !f.hit && !f.miss;
  band(a.from, a.name, a.t, big, a.col);
  const dark = big || a.kind !== 'atk' ? darken(a.from, a.col, big ? 0.8 : 0.55) : null;
  if (big || charge) magicCircle(a.from, a.t, a.col, 200 * k, 1200);
  const out = SCENES[a.id](f), shown: Shown = out instanceof Promise ? { done: out } : out;
  return { done: shown.done.then(function () { if (dark) dark.off(500); }), beforeHit: shown.beforeHit };
}
