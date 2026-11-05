import type { TypeName } from '../data/types';
import { MOVE_FX, type Gesture } from '../data/move-fx';
import { MAGIC, runeIcon } from '../render/svg/creatures';
import { reduced, esc, $ } from './dom';
import { sleep, battle } from './common';
import { arena } from './battle-screen';
import { fx, animate, anchor, ring, sparks, flashAt, shape, wob, pulse, streaks, SHAPE } from './effects';
import { netSVG, netBall } from '../render/svg/nets';
import { sfx } from '../audio';
import { HELD } from '../data/passives';
import { ico } from './icons';

/* The creatures' moves, as shows: every type of magic has its own, big and clear.
   - The charge: the arena goes dark around the caster, a magic circle opens at its feet, the move's name crosses the
     arena on a band of its colour.
   - The spell: a moon blade (Calma), lightning out of a storm cloud (Caos), a constellation that closes on the foe
     (Cervello), waves of song (Chiacchiera), a giant beating heart (Cuore). A plain move is a dash and a slash.
   - The hit: light, shockwaves and the type's shapes everywhere; bigger for a critical or super-effective hit, a hex of
     shapes for a spell that does no damage, nothing for a miss.
   Only drawing: they change nothing in the battle, never touch Math.random (wob() of effects.ts), and with reduced
   motion they are not there. castSpell resolves on the hit, so the damage number and the HP bar land on it. */

const INK = '#1c2340';

export interface Cast {
  /** the spell's type; null for a plain move */
  type: TypeName | null;
  /** the move's id: how it travels is in data/move-fx.ts (missing: as its type does) */
  id?: string;
  /** the move's name, for the band */
  name: string;
  power: number;
  /** the form's own move: the grandest show */
  sig: boolean;
  /** what the engine's next events say: a hit, a miss, or no damage (a hex on the foe) */
  outcome: 'hit' | 'miss' | 'none';
  crit: boolean;
  /** how well it works, from the engine (effLevel): 2 double advantage, 1 super effective, 0, −1, −2 */
  lvl: number;
  /** it gives back to the caster part of the damage: life flows back */
  drain?: boolean;
  /** it strikes first: a flash-step before the spell */
  quick?: boolean;
  /** set by castSpell: a big move (power 75 and up) or the form's own, which has the grand version of its show */
  big?: boolean;
}
type P = number[];
const colOf = (t: TypeName | null): string => (t ? MAGIC[t].col : '#ffffff');
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const mid = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const tr = (p: P): string => 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px) translate(-50%,-50%)';
const gone = (el: Element) => function () { el.remove(); };
/** how grand a move's show is: 1 for a small move, up to about 1.8 for a form's own big one */
function grand(c: Cast): number { return (1 + Math.max(0, Math.min(0.45, (c.power - 40) / 100)) + (c.sig ? 0.3 : 0)) * (c.crit ? 1.1 : 1); }
function size(): { w: number; h: number } { const r = arena.getBoundingClientRect(); return { w: r.width, h: r.height }; }
/** a point on a fighter's body (a creature's drawing, not its square frame), as fractions of it, on the arena */
function body(i: number, fx0: number, fy0: number): P {
  const g = document.querySelector('#w-' + i + ' .spr-c > g[transform]');
  if (!g) return anchor(i, fx0, fy0);
  const a = arena.getBoundingClientRect(), r = g.getBoundingClientRect();
  return [r.left - a.left + r.width * fx0, r.top - a.top + r.height * fy0];
}
/** a point past the target, for a spell that misses */
function beyond(a: P, b: P): P { return [b[0] + (b[0] - a[0]) * 0.45, b[1] + (b[1] - a[1]) * 0.45]; }
/** a curve from a to b, lifted in the middle */
function curve(a: P, b: P, lift: number) {
  const cx = (a[0] + b[0]) / 2, cy = Math.min(a[1], b[1]) - lift;
  return {
    at: function (t: number): P { return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]]; },
    d: 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1)
  };
}
/** keyframes that carry an element along a curve, with more transform and an opacity for each moment */
function along(at: (t: number) => P, n: number, more?: (t: number) => string, op?: (t: number) => number): Keyframe[] {
  const out: Keyframe[] = [];
  for (let k = 0; k <= n; k++) { const t = k / n; out.push({ transform: tr(at(t)) + ' ' + (more ? more(t) : ''), opacity: op ? op(t) : 1 }); }
  return out;
}
/** an element on the arena, placed by its transform */
function piece(html: string, cls: string, w?: number): HTMLElement {
  const el = fx(html, 'sp ' + cls, 0, 0, 0);
  el.style.left = '0'; el.style.top = '0';
  if (w) { el.style.width = w + 'px'; el.style.height = w + 'px'; }
  return el;
}
/** an SVG as big as the arena, for the lines that cross it */
function layer(inner: string, cls?: string): HTMLElement {
  const z = size();
  return piece('<svg viewBox="0 0 ' + Math.round(z.w) + ' ' + Math.round(z.h) + '" width="' + Math.round(z.w) + '" height="' + Math.round(z.h) + '" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>', 'sp-layer ' + (cls || ''));
}
/** a line in the type's colour with a white core: drawn from one end to the other (pathLength 1) */
function beam(d: string, mc: string, w: number): string {
  return '<path d="' + d + '" pathLength="1" stroke="' + mc + '" stroke-width="' + (w * 3.2 + 8).toFixed(1) + '" opacity=".22"/>' +
    '<path d="' + d + '" pathLength="1" stroke="' + INK + '" stroke-width="' + (w + 5).toFixed(1) + '" opacity=".55"/>' +
    '<path d="' + d + '" pathLength="1" stroke="' + mc + '" stroke-width="' + w.toFixed(1) + '"/>' +
    '<path d="' + d + '" pathLength="1" stroke="#ffffff" stroke-width="' + Math.max(1.5, w * 0.34).toFixed(1) + '"/>';
}
function trace(el: HTMLElement, ms: number): Promise<unknown> {
  const all: Promise<unknown>[] = [];
  el.querySelectorAll('path[pathLength]').forEach(function (p) {
    (p as SVGPathElement).style.strokeDasharray = '1 1';
    all.push(animate(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: ms, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'both' }));
  });
  return Promise.all(all);
}
function fade(el: HTMLElement, ms: number, delay?: number) {
  return animate(el, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, delay: delay || 0, easing: 'ease-in', fill: 'both' }).then(gone(el));
}
/** a type's shape as SVG path, for drawings made of them */
function glyph(t: TypeName, x: number, y: number, s: number, rot: number, fill: string): string {
  return '<path transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + rot.toFixed(0) + ') scale(' + s.toFixed(2) + ') translate(-12 -12)" d="' + SHAPE[t] + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + (2.2 / s).toFixed(2) + '"/>';
}

/* ---------- what every spell has: the dark, the circle, the band with the name, the glow ---------- */
/** the arena goes dark around the caster, lit by the colour of its magic; off() brings the light back */
function darken(from: number, mc: string, amount: number) {
  const el = document.createElement('div'), c = anchor(from, 0.5, 0.45), scene = battle.classList.contains('has-scene');
  el.className = 'spell-dim';
  el.style.setProperty('--mc', mc);
  if (scene) {
    /* the drawn scene of Formia fills the screen: the dark covers it all, under the fighters */
    const r = arena.getBoundingClientRect();
    el.style.setProperty('--cx', (r.left + c[0]).toFixed(0) + 'px'); el.style.setProperty('--cy', (r.top + c[1]).toFixed(0) + 'px');
    battle.appendChild(el);
  } else {
    el.style.setProperty('--cx', c[0].toFixed(0) + 'px'); el.style.setProperty('--cy', c[1].toFixed(0) + 'px');
    arena.insertBefore(el, arena.firstChild);
  }
  animate(el, [{ opacity: 0 }, { opacity: amount }], { duration: 260, easing: 'ease-out', fill: 'both' });
  return { off: function (ms: number) { return animate(el, [{ opacity: amount }, { opacity: 0 }], { duration: ms, easing: 'ease-in', fill: 'both' }).then(gone(el)); } };
}
/** a flash over the whole arena */
function flash(col: string, ms: number, peak: number) {
  let el: HTMLElement;
  if (battle.classList.contains('has-scene')) { el = document.createElement('div'); el.className = 'spell-flash'; battle.appendChild(el); }
  else el = piece('', 'sp-flash');
  el.style.setProperty('--mc', col);
  return animate(el, [{ opacity: 0 }, { opacity: peak, offset: 0.18 }, { opacity: 0 }], { duration: ms, easing: 'ease-out', fill: 'both' }).then(gone(el));
}
function circleSvg(t: TypeName | null, mc: string): string {
  let s = '<svg viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke-linejoin="round">' +
    '<circle cx="100" cy="100" r="92" stroke="' + INK + '" stroke-width="10"/><circle cx="100" cy="100" r="92" stroke="' + mc + '" stroke-width="6"/>' +
    '<circle cx="100" cy="100" r="68" stroke="' + mc + '" stroke-width="3" stroke-dasharray="9 7"/><circle cx="100" cy="100" r="22" stroke="#ffffff" stroke-width="3"/>';
  const pts: string[] = [];
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 - Math.PI / 2; pts.push((100 + Math.cos(a) * 68).toFixed(1) + ' ' + (100 + Math.sin(a) * 68).toFixed(1)); }
  s += '<path d="M' + [0, 3, 6, 1, 4, 7, 2, 5].map(function (k) { return pts[k]; }).join(' L') + 'Z" stroke="' + mc + '" stroke-width="2.6"/>';
  if (t) for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2; s += glyph(t, 100 + Math.cos(a) * 80, 100 + Math.sin(a) * 80, 0.5, k * 45 + 90, mc); }
  return s + '</svg>';
}
/** the magic circle at a fighter's feet: it opens, turns and fades */
function magicCircle(i: number, t: TypeName | null, mc: string, w: number, ms: number) {
  const g = anchor(i, 0.5, 0.88), el = piece(circleSvg(t, mc), 'sp-circle', w);
  el.style.setProperty('--mc', mc);
  const at = tr(g) + ' scaleY(.34)';
  return animate(el, [
    { transform: at + ' scale(.15) rotate(0deg)', opacity: 0 },
    { transform: at + ' scale(1) rotate(80deg)', opacity: 1, offset: 0.25 },
    { transform: at + ' scale(1.04) rotate(170deg)', opacity: 1, offset: 0.8 },
    { transform: at + ' scale(1.35) rotate(210deg)', opacity: 0 }
  ], { duration: ms, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'both' }).then(gone(el));
}
/** the move's name on a band across the arena, coming in from the caster's side */
function band(i: number, name: string, t: TypeName | null, sig: boolean, mc: string) {
  const el = fx('<div class="sp-band-in">' + (sig ? '<small>Mossa speciale</small>' : '') + '<span>' + (t ? runeIcon(t, 46) : '') + '<b>' + esc(name) + '</b></span></div>', 'sp sp-band' + (sig ? ' sig' : ''), 0, 0, 0);
  el.style.left = ''; el.style.top = '';
  el.style.setProperty('--mc', mc);
  const dir = i === 0 ? -1 : 1, inner = el.firstChild as HTMLElement;
  animate(el, [{ transform: 'translateY(-50%) scaleY(0)', opacity: 0 }, { transform: 'translateY(-50%) scaleY(1)', opacity: 1, offset: 0.14 }, { transform: 'translateY(-50%) scaleY(1)', opacity: 1, offset: 0.82 }, { transform: 'translateY(-50%) scaleY(0)', opacity: 0 }],
    { duration: 820, easing: 'ease-out', fill: 'both' }).then(gone(el));
  animate(inner, [{ transform: 'translateX(' + dir * 40 + '%) skewX(-10deg)', opacity: 0 }, { transform: 'translateX(0) skewX(-10deg)', opacity: 1, offset: 0.2 }, { transform: 'translateX(' + -dir * 4 + '%) skewX(-10deg)', opacity: 1, offset: 0.82 }, { transform: 'translateX(' + -dir * 30 + '%) skewX(-10deg)', opacity: 0 }],
    { duration: 820, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' });
}
/** the caster glows with its magic and grows a little */
function glow(i: number, mc: string, ms: number) {
  const m = $('m-' + i);
  if (!m) return;
  m.style.setProperty('--mc', mc);
  pulse(m, 'charge', ms);
}

/* ---------- Calma: the moon ---------- */
function crescent(mc: string): string {
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M64 6A46 46 0 1 0 64 94A36 36 0 1 1 64 6Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M60 16A36 36 0 0 0 52 84" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".85"/></svg>';
}
function moonFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const a = body(from, from === 0 ? 0.62 : 0.38, 0.1), up: P = [a[0], a[1] - 46 * k], w = 118 * k;
  const moon = piece(crescent(mc), 'sp-moon', w);
  animate(moon, [{ transform: tr(a) + ' scale(.1) rotate(-120deg)', opacity: 0 }, { transform: tr(up) + ' scale(1) rotate(-25deg)', opacity: 1 }], { duration: 440, easing: 'cubic-bezier(.2,.9,.3,1.25)', fill: 'both' });
  const f = anchor(from, 0.5, 0.9);
  for (let n = 0; n < 3; n++) sleep(n * 140).then(function () { ring(f[0], f[1], mc, 250 * k, 800, true); });
  return sleep(480).then(function () {
    sfx('whoosh');
    const cv = curve(up, end, 80 * k), dur = 470;
    const L = layer('<path d="' + cv.d + '" pathLength="1" stroke="' + mc + '" stroke-width="' + (22 * k).toFixed(1) + '" opacity=".45"/><path d="' + cv.d + '" pathLength="1" stroke="#ffffff" stroke-width="' + (6 * k).toFixed(1) + '"/>');
    trace(L, dur).then(function () { fade(L, 360); });
    const fr = along(cv.at, 12, function (t) { return 'rotate(' + (-25 + t * 1080).toFixed(0) + 'deg) scale(' + lerp(1, 0.9, t).toFixed(2) + ')'; });
    animate(moon, fr, { duration: dur, easing: 'cubic-bezier(.5,0,.8,1)', fill: 'both' }).then(function () { fade(moon, c.outcome === 'miss' ? 200 : 90); });
    if (c.big) {
      /* the grand one: two more blades, higher and lower, crossing the arena with the first */
      [36, 150].forEach(function (lift, q) {
        const cv2 = curve([up[0], up[1] + (q ? -30 : 30) * k], end, lift * k), extra = piece(crescent(mc), 'sp-moon', w * 0.75);
        animate(extra, along(cv2.at, 12, function (t) { return 'rotate(' + (40 + t * (q ? -900 : 900)).toFixed(0) + 'deg) scale(' + lerp(0.6, 0.85, t).toFixed(2) + ')'; }, function (t) { return t < 0.1 ? t * 10 : 1; }),
          { duration: dur * (q ? 1.08 : 0.92), delay: 40 + q * 50, easing: 'cubic-bezier(.5,0,.8,1)', fill: 'both' }).then(function () { fade(extra, 120); });
      });
    }
    for (let n = 1; n <= 3; n++) {
      const ghost = piece(crescent(mc), 'sp-moon ghost', w);
      ghost.style.opacity = '0';
      animate(ghost, fr.map(function (f0) { return Object.assign({}, f0, { opacity: 0.5 / n }); }), { duration: dur, delay: n * 45, easing: 'cubic-bezier(.5,0,.8,1)', fill: 'both' }).then(gone(ghost));
    }
    return sleep(dur);
  });
}
function moonHit(b: P, to: number, c: Cast, mc: string, k: number) {
  const r = 70 * k;
  const d1 = 'M' + (b[0] - r) + ' ' + (b[1] - r * 0.8) + ' Q' + (b[0] + r * 0.2) + ' ' + (b[1] - r * 0.1) + ' ' + (b[0] + r) + ' ' + (b[1] + r * 0.8);
  const d2 = 'M' + (b[0] + r) + ' ' + (b[1] - r * 0.7) + ' Q' + (b[0] - r * 0.1) + ' ' + (b[1] + r * 0.05) + ' ' + (b[0] - r * 0.9) + ' ' + (b[1] + r * 0.85);
  /* a big move cuts three times */
  const d3 = 'M' + (b[0] - r * 1.05) + ' ' + (b[1] + r * 0.1) + ' Q' + b[0] + ' ' + (b[1] - r * 0.35) + ' ' + (b[0] + r * 1.05) + ' ' + (b[1] + r * 0.15);
  const L = layer(beam(d1, mc, 9 * k) + beam(d2, mc, 9 * k) + (c.big ? beam(d3, mc, 8 * k) : ''));
  trace(L, 150).then(function () { fade(L, 420, 120); });
  flashAt(b[0], b[1], '#e8f7ff', 460 * k, 420);
  ring(b[0], b[1], mc, 320 * k, 640);
  sparks(b[0], b[1], 14, function (n) { return n % 3 ? '<i class="sp-dust"></i>' : shape('Calma', mc, 22); }, 160 * k, 1000);
  const m = $('m-' + to); if (m) pulse(m, 'chill', 700);
}

/* ---------- Caos: lightning ---------- */
function boltPath(x1: number, y1: number, x2: number, y2: number, n: number, jag: number): string {
  let d = 'M' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  for (let s = 1; s < n; s++) {
    const t = s / n, off = (wob() - 0.5) * jag * (1 - Math.abs(0.5 - t));
    d += ' L' + (lerp(x1, x2, t) + off).toFixed(1) + ' ' + lerp(y1, y2, t).toFixed(1);
  }
  return d + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1);
}
function stormCloud(): string {
  return '<svg viewBox="0 0 220 110" aria-hidden="true"><g fill="#4a4f7a" stroke="' + INK + '" stroke-width="5">' +
    '<circle cx="62" cy="62" r="34"/><circle cx="108" cy="44" r="40"/><circle cx="156" cy="60" r="34"/><rect x="40" y="58" width="140" height="38" rx="19"/></g>' +
    '<g fill="#5d6394"><circle cx="62" cy="62" r="30"/><circle cx="108" cy="44" r="36"/><circle cx="156" cy="60" r="30"/><rect x="44" y="60" width="132" height="32" rx="16"/></g>' +
    '<path d="M70 40Q86 22 108 26" fill="none" stroke="#8d93c4" stroke-width="6" stroke-linecap="round"/></svg>';
}
function zig(mc: string): string {
  return '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M13 2L5 14h6l-2 8 9-13h-6l3-7Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
}
function boltFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const f = body(from, 0.5, 0.45);
  /* sparks crackle around the caster */
  for (let n = 0; n < 6; n++) sleep(n * 70).then(function () { sparks(f[0] + (wob() - 0.5) * 90, f[1] + (wob() - 0.5) * 80, 2, function () { return zig(mc); }, 40, 360); });
  /* a storm cloud over the foe, flickering */
  const cw = 230 * k, cy = Math.max(cw * 0.25, end[1] - 170 * k), cloud = piece(stormCloud(), 'sp-cloud', cw);
  cloud.style.height = (cw / 2).toFixed(0) + 'px';
  animate(cloud, [{ transform: tr([end[0], cy - 30]) + ' scale(.6)', opacity: 0 }, { transform: tr([end[0], cy]) + ' scale(1)', opacity: 1, offset: 0.3 },
    { transform: tr([end[0], cy]) + ' scale(1.02)', opacity: 1, filter: 'brightness(1.8)', offset: 0.5 }, { transform: tr([end[0], cy]) + ' scale(1)', opacity: 1, filter: 'brightness(1)', offset: 0.6 },
    { transform: tr([end[0], cy]) + ' scale(1)', opacity: 1 }], { duration: 1150, easing: 'ease-out', fill: 'both' }).then(function () { fade(cloud, 380); });
  return sleep(470).then(function () {
    const strikes = c.outcome === 'miss' ? 2 : c.big ? 5 : 3;
    let chain: Promise<unknown> = Promise.resolve();
    for (let n = 0; n < strikes; n++) {
      chain = chain.then(function () {
        const last = n === strikes - 1, side = [-1, 1, -2, 2][n] || 0, x = end[0] + (last ? 0 : side * 34 * k), y2 = end[1] + (last ? 6 : 26 * k);
        const d = boltPath(x + (wob() - 0.5) * 40 * k, cy + 18, x, y2, 9, 46 * k);
        const L = layer(beam(d, mc, 11 * k) + '<path d="' + boltPath(x, cy + 30, x + (wob() - 0.5) * 120 * k, lerp(cy, y2, 0.6), 5, 30 * k) + '" stroke="#ffffff" stroke-width="' + (3 * k).toFixed(1) + '" opacity=".8"/>', 'sp-bolt');
        L.style.setProperty('--mc', mc);
        animate(L, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 0.25, offset: 0.3 }, { opacity: 1, offset: 0.42 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 340, fill: 'both' }).then(gone(L));
        /* the whole screen flashes only on the last strike (never more than a couple of flashes a second); the
           others light up where they land */
        if (last) flash('#ffffff', 220, 0.5); else flashAt(x, y2, '#ffffff', 160 * k, 200);
        if (n === 0 || last) sfx('thunder');
        sparks(x, y2, 5, function () { return zig(mc); }, 70 * k, 420);
        if (last && c.outcome !== 'miss') pulse(arena, 'quake', 420);
        return sleep(last ? 90 : 130);
      });
    }
    return chain.then(function () { /* resolved on the last strike */ });
  });
}
function boltHit(b: P, to: number, c: Cast, mc: string, k: number) {
  if (c.big) {
    /* the ground cracks under the one hit */
    const g = anchor(to, 0.5, 0.9), w0 = 120 * k;
    const L = layer(beam(boltPath(g[0] - w0, g[1] + 4, g[0] + w0, g[1] - 4, 10, 18 * k), mc, 5 * k), 'sp-bolt');
    trace(L, 160).then(function () { fade(L, 500, 200); });
  }
  flashAt(b[0], b[1], mc, 440 * k, 360);
  ring(b[0], b[1], mc, 300 * k, 560);
  sparks(b[0], b[1], 16, function () { return zig(mc); }, 150 * k, 700);
  const m = $('m-' + to); if (m) pulse(m, 'zapped', 620);
}

/* ---------- Cervello: the stars ---------- */
function starburst(mc: string): string {
  let d = '';
  for (let s = 0; s < 16; s++) { const a = s / 16 * Math.PI * 2 - Math.PI / 2, r = s % 2 ? 34 : (s % 4 ? 70 : 96); d += (s ? ' L' : 'M') + (100 + Math.cos(a) * r).toFixed(1) + ' ' + (100 + Math.sin(a) * r).toFixed(1); }
  return '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="' + d + 'Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="' + d + 'Z" fill="#ffffff" transform="translate(100 100) scale(.55) translate(-100 -100)"/></svg>';
}
function starFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const f = body(from, 0.5, 0.4), n = 6, stars: HTMLElement[] = [], miss = c.outcome === 'miss';
  /* stars appear and turn around the caster */
  for (let s = 0; s < n; s++) {
    const el = piece(shape('Cervello', s % 2 ? '#ffffff' : mc, Math.round(30 * k)), 'sp-star');
    stars.push(el);
    const a0 = s / n * Math.PI * 2, orbit: Keyframe[] = [];
    for (let q = 0; q <= 10; q++) { const a = a0 + q / 10 * Math.PI * 2.2; orbit.push({ transform: tr([f[0] + Math.cos(a) * 66 * k, f[1] + Math.sin(a) * 30 * k]) + ' scale(' + (0.3 + q / 10 * 0.8).toFixed(2) + ') rotate(' + q * 30 + 'deg)', opacity: Math.min(1, q / 3) }); }
    animate(el, orbit, { duration: 540, easing: 'linear', fill: 'both' });
  }
  const R = 84 * k, spots: P[] = [];
  for (let s = 0; s < n; s++) { const a = -Math.PI / 2 + s / n * Math.PI * 2; spots.push([end[0] + Math.cos(a) * R, end[1] + Math.sin(a) * R * 0.82]); }
  return sleep(540).then(function () {
    /* they fly to the foe and take their places around it */
    stars.forEach(function (el, s) {
      const a = s / n * Math.PI * 2 + Math.PI * 2.2, from0: P = [f[0] + Math.cos(a) * 66 * k, f[1] + Math.sin(a) * 30 * k];
      animate(el, along(curve(from0, spots[s], 50 * k).at, 8, function (t) { return 'scale(' + lerp(1.1, 1.3, t).toFixed(2) + ') rotate(' + (t * 200).toFixed(0) + 'deg)'; }), { duration: 360, delay: s * 25, easing: 'cubic-bezier(.3,.7,.4,1)', fill: 'both' });
    });
    return sleep(420);
  }).then(function () {
    /* the lines of the constellation: a ring of stars, and a ray from each one to the foe, a net of light closing */
    const p = spots.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }), e = end[0].toFixed(1) + ' ' + end[1].toFixed(1);
    const L = layer(beam('M' + p.join(' L') + 'Z', mc, 5 * k) + p.map(function (q) { return beam('M' + q + ' L' + e, mc, 2.6 * k); }).join(''));
    sfx('shimmer');
    return trace(L, 260).then(function () {
      fade(L, miss ? 400 : 240);
      /* the stars fall into the middle */
      stars.forEach(function (el, s) {
        animate(el, [{ transform: tr(spots[s]) + ' scale(1.3) rotate(200deg)', opacity: 1 }, { transform: tr(miss ? beyond(spots[s], end) : end) + ' scale(.4) rotate(320deg)', opacity: miss ? 0 : 0.6 }], { duration: 170, easing: 'ease-in', fill: 'both' }).then(gone(el));
      });
      return sleep(160);
    });
  }).then(function () { /* on the collapse */ });
}
function meteors(b: P, mc: string, k: number) {
  for (let n = 0; n < 7; n++) {
    const x0 = b[0] + (n - 3) * 46 * k + 160 * k, x1 = b[0] + (n - 3) * 22 * k, el = piece(shape('Cervello', n % 2 ? '#ffffff' : mc, Math.round(26 * k)), 'sp-star');
    animate(el, [{ transform: tr([x0, -30]) + ' scale(.6) rotate(0deg)', opacity: 0 }, { transform: tr([lerp(x0, x1, 0.3), lerp(-30, b[1], 0.3)]) + ' scale(1) rotate(120deg)', opacity: 1, offset: 0.3 },
      { transform: tr([x1, b[1]]) + ' scale(1.1) rotate(300deg)', opacity: 1 }], { duration: 320, delay: n * 55, easing: 'ease-in', fill: 'both' }).then(function () {
      el.remove(); flashAt(x1, b[1], mc, 120 * k, 220);
    });
  }
}
function starHit(b: P, to: number, c: Cast, mc: string, k: number) {
  if (c.big) meteors(b, mc, k);
  const w = 240 * k, burst = piece(starburst(mc), 'sp-burst', w), rays = piece('', 'sp-rays', w * 1.6);
  rays.style.setProperty('--mc', mc);
  animate(burst, [{ transform: tr(b) + ' scale(.15) rotate(0deg)', opacity: 1 }, { transform: tr(b) + ' scale(1.1) rotate(25deg)', opacity: 1, offset: 0.35 }, { transform: tr(b) + ' scale(1.5) rotate(45deg)', opacity: 0 }], { duration: 640, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'both' }).then(gone(burst));
  animate(rays, [{ transform: tr(b) + ' scale(.3) rotate(0deg)', opacity: 0.9 }, { transform: tr(b) + ' scale(1.2) rotate(70deg)', opacity: 0 }], { duration: 760, easing: 'ease-out', fill: 'both' }).then(gone(rays));
  flashAt(b[0], b[1], mc, 520 * k, 380);
  sparks(b[0], b[1], 16, function (n) { return shape('Cervello', n % 2 ? '#ffffff' : mc, 20 + (n % 3) * 6); }, 170 * k, 900);
  const m = $('m-' + to); if (m) pulse(m, 'dazed', 700);
}

/* ---------- Chiacchiera: the song ---------- */
function waveSvg(mc: string, k: number): string {
  const w = 58 * k, h = 124 * k;
  return '<svg viewBox="-30 -64 64 128" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" aria-hidden="true" fill="none" stroke-linecap="round">' +
    '<path d="M0 -54A64 64 0 0 1 0 54" stroke="' + INK + '" stroke-width="15"/><path d="M0 -54A64 64 0 0 1 0 54" stroke="' + mc + '" stroke-width="9"/><path d="M4 -40A50 50 0 0 1 8 0" stroke="#ffffff" stroke-width="3.5"/></svg>';
}
function songFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const a = body(from, from === 0 ? 0.7 : 0.3, 0.4), ang = Math.atan2(end[1] - a[1], end[0] - a[0]) * 180 / Math.PI;
  /* the caster draws breath: notes pop out of it */
  sparks(a[0], a[1], 6, function (n) { return shape('Chiacchiera', n % 2 ? '#ffffff' : mc, 24); }, 80 * k, 700);
  const bob = document.querySelector('#m-' + from + ' .bob');
  if (bob) animate(bob, [{ transform: 'scale(1)' }, { transform: 'scale(1.08,.94)', offset: 0.6 }, { transform: 'scale(.96,1.06)', offset: 0.85 }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-in-out' });
  return sleep(400).then(function () {
    sfx('notes');
    const waves = c.big ? 8 : 5, dur = 560;
    for (let n = 0; n < waves; n++) {
      sleep(n * 80).then(function () {
        const el = piece(waveSvg(mc, k), 'sp-wave');
        animate(el, [{ transform: tr(a) + ' rotate(' + ang.toFixed(0) + 'deg) scale(.3)', opacity: 0 }, { transform: tr(mid(a, end, 0.5)) + ' rotate(' + ang.toFixed(0) + 'deg) scale(1)', opacity: 1, offset: 0.45 },
          { transform: tr(end) + ' rotate(' + ang.toFixed(0) + 'deg) scale(1.55)', opacity: c.outcome === 'miss' ? 0 : 0.9, offset: 0.92 }, { transform: tr(end) + ' rotate(' + ang.toFixed(0) + 'deg) scale(1.7)', opacity: 0 }], { duration: dur, easing: 'linear', fill: 'both' }).then(gone(el));
      });
    }
    /* notes ride the waves, bouncing */
    for (let n = 0; n < 4; n++) {
      sleep(60 + n * 110).then(function () {
        const el = piece(shape('Chiacchiera', n % 2 ? mc : '#ffffff', Math.round(30 * k)), 'sp-note');
        const lift = (n % 2 ? 1 : -1) * 40 * k;
        animate(el, along(function (t) { const p = mid(a, end, t); return [p[0], p[1] + Math.sin(t * Math.PI * 3) * lift]; }, 12, function (t) { return 'rotate(' + Math.sin(t * Math.PI * 4) * 25 + 'deg)'; }, function (t) { return t < 0.85 ? 1 : (1 - t) / 0.15; }),
          { duration: 520, easing: 'linear', fill: 'both' }).then(gone(el));
      });
    }
    return sleep(dur * 0.7 + 160);
  });
}
function songHit(b: P, to: number, c: Cast, mc: string, k: number) {
  if (c.big) { ring(b[0], b[1], '#ffffff', 520 * k, 760); ring(b[0], b[1], mc, 640 * k, 900); }
  const bob = document.querySelector('#m-' + to + ' .bob');
  if (bob) animate(bob, [{ transform: 'skewX(0) scale(1)' }, { transform: 'skewX(12deg) scale(1.08,.92)', offset: 0.15 }, { transform: 'skewX(-10deg) scale(.94,1.06)', offset: 0.35 }, { transform: 'skewX(7deg) scale(1.04,.96)', offset: 0.55 }, { transform: 'skewX(-4deg)', offset: 0.75 }, { transform: 'skewX(0) scale(1)' }], { duration: 640, easing: 'ease-out' });
  for (let n = 0; n < 3; n++) sleep(n * 110).then(function () { ring(b[0], b[1], mc, (220 + n * 70) * k, 520); });
  flashAt(b[0], b[1], mc, 420 * k, 320);
  sparks(b[0], b[1], 14, function (n) { return shape('Chiacchiera', n % 2 ? '#ffffff' : mc, 22 + (n % 3) * 5); }, 160 * k, 900);
}

/* ---------- Cuore: the heart ---------- */
function bigHeart(mc: string): string {
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 90C20 70 6 52 6 34A22 22 0 0 1 50 26A22 22 0 0 1 94 34C94 52 80 70 50 90Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
    '<path d="M24 26Q14 30 15 42" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/></svg>';
}
function heartFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const f = body(from, 0.5, 0.42);
  /* little hearts spiral into the caster, which beats */
  for (let n = 0; n < 8; n++) {
    const el = piece(shape('Cuore', n % 2 ? '#ffffff' : mc, 22), 'sp-heart'), a0 = n / 8 * Math.PI * 2, fr: Keyframe[] = [];
    for (let q = 0; q <= 8; q++) { const t = q / 8, a = a0 + t * Math.PI * 1.5, r = lerp(110, 8, t) * k; fr.push({ transform: tr([f[0] + Math.cos(a) * r, f[1] + Math.sin(a) * r * 0.7]) + ' scale(' + lerp(0.6, 1.1, t).toFixed(2) + ')', opacity: t < 0.15 ? t / 0.15 : t > 0.85 ? (1 - t) / 0.15 : 1 }); }
    animate(el, fr, { duration: 480, delay: n * 20, easing: 'ease-in', fill: 'both' }).then(gone(el));
  }
  sfx('heartbeat');
  const bob = document.querySelector('#m-' + from + ' .bob');
  if (bob) animate(bob, [{ transform: 'scale(1)' }, { transform: 'scale(1.09)', offset: 0.2 }, { transform: 'scale(1)', offset: 0.4 }, { transform: 'scale(1.12)', offset: 0.6 }, { transform: 'scale(1)' }], { duration: 520 });
  return sleep(500).then(function () {
    const w = 112 * k, start: P = [f[0], f[1] - 36 * k], cv = curve(start, end, 100 * k), dur = 560;
    const H = piece(bigHeart(mc), 'sp-bigheart', w);
    animate(H, along(cv.at, 16, function (t) { return 'scale(' + ((0.35 + 0.65 * Math.min(1, t * 3)) * (1 + 0.16 * Math.abs(Math.sin(t * Math.PI * 4)))).toFixed(2) + ') rotate(' + (Math.sin(t * Math.PI * 2) * 12).toFixed(0) + 'deg)'; }),
      { duration: dur, easing: 'cubic-bezier(.4,0,.7,1)', fill: 'both' }).then(function () {
      if (c.outcome === 'miss') { fade(H, 200); return; }
      animate(H, [{ transform: tr(end) + ' scale(1)', opacity: 1 }, { transform: tr(end) + ' scale(1.9)', opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'both' }).then(gone(H));
    });
    /* a trail of little hearts behind it */
    for (let n = 1; n <= 6; n++) {
      sleep(n * 70).then(function () {
        const p = cv.at(Math.min(1, n * 70 / dur)), el = piece(shape('Cuore', n % 2 ? mc : '#ffffff', 18), 'sp-heart');
        animate(el, [{ transform: tr(p) + ' scale(1)', opacity: 0.9 }, { transform: tr([p[0], p[1] + 30]) + ' scale(.4)', opacity: 0 }], { duration: 600, easing: 'ease-out', fill: 'both' }).then(gone(el));
      });
    }
    return sleep(dur);
  });
}
function heartHit(b: P, to: number, c: Cast, mc: string, k: number) {
  if (c.big) {
    /* the grand one: hearts rain on the one hit */
    for (let n = 0; n < 12; n++) {
      const x = b[0] + ((n * 37) % 11 - 5) * 22 * k, el = piece(shape('Cuore', n % 3 ? mc : '#ffffff', 18 + (n % 3) * 6), 'sp-heart');
      animate(el, [{ transform: tr([x, -20]) + ' rotate(' + (n % 2 ? -20 : 20) + 'deg)', opacity: 0 }, { transform: tr([x, lerp(-20, b[1], 0.2)]) + ' rotate(0deg)', opacity: 1, offset: 0.2 },
        { transform: tr([x + (n % 2 ? 14 : -14), b[1] + 40]) + ' rotate(' + (n % 2 ? 25 : -25) + 'deg)', opacity: 0 }], { duration: 900, delay: 120 + n * 60, easing: 'ease-in', fill: 'both' }).then(gone(el));
    }
  }
  for (let n = 0; n < 2; n++) sleep(n * 140).then(function () { ring(b[0], b[1], mc, (260 + n * 90) * k, 600); });
  flashAt(b[0], b[1], mc, 480 * k, 380);
  sparks(b[0], b[1], 18, function (n) { return shape('Cuore', n % 3 ? mc : '#ffffff', 18 + (n % 3) * 7); }, 180 * k, 1000);
  const m = $('m-' + to); if (m) pulse(m, 'smitten', 760);
}

/* ---------- a plain move: a dash and a slash ---------- */
function plainHit(from: number, to: number, c: Cast, k: number): Promise<void> {
  const m = $('m-' + from), a = body(from, 0.5, 0.5), b = body(to, 0.5, 0.5);
  streaks(from);
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + ((b[0] - a[0]) * 0.3).toFixed(0) + 'px,' + ((b[1] - a[1]) * 0.3).toFixed(0) + 'px) scale(1.06)', offset: 0.45 }, { transform: 'none' }], { duration: 440, easing: 'cubic-bezier(.3,.6,.3,1)' });
  return sleep(210).then(function () {
    if (c.outcome === 'miss') return;
    const r = 52 * k;
    let lines = '';
    for (let n = -1; n <= 1; n++) {
      const x0 = b[0] + r * 0.9 + n * 22 * k, y0 = b[1] - r + n * 6 * k, x1 = b[0] - r * 0.9 + n * 22 * k, y1 = b[1] + r + n * 6 * k;
      const d = 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' Q' + (b[0] + n * 22 * k + 14).toFixed(1) + ' ' + (b[1] + n * 6 * k).toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
      lines += '<path d="' + d + '" pathLength="1" stroke="' + INK + '" stroke-width="' + (10 * k).toFixed(1) + '" opacity=".55"/><path d="' + d + '" pathLength="1" stroke="#ffffff" stroke-width="' + (5.5 * k).toFixed(1) + '"/>';
    }
    const L = layer(lines);
    trace(L, 120).then(function () { fade(L, 300, 80); });
    flash('#ffffff', 140, 0.3);
  });
}

/* ---------- Corrente: the sea ---------- */
function waveBig(mc: string): string {
  return '<svg viewBox="0 0 200 130" aria-hidden="true" stroke-linejoin="round">' +
    '<path d="M4 126C10 70 50 18 116 10C164 4 196 34 188 64C182 88 150 92 140 74C134 62 144 48 158 52C146 34 112 36 90 58C70 78 62 104 60 126Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="6"/>' +
    '<path d="M30 112C40 76 70 42 112 30" fill="none" stroke="#ffffff" stroke-width="7" stroke-linecap="round" opacity=".8"/>' +
    '<path d="M120 16C150 12 178 26 182 50" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"/>' +
    '<circle cx="186" cy="30" r="7" fill="#ffffff" stroke="' + INK + '" stroke-width="3"/><circle cx="170" cy="14" r="5" fill="#ffffff" stroke="' + INK + '" stroke-width="2.5"/></svg>';
}
function drop(mc: string, s: number): string {
  return '<svg viewBox="0 0 20 26" width="' + s + '" height="' + Math.round(s * 1.3) + '" aria-hidden="true"><path d="M10 2C13 8 17 12 17 17A7 7 0 0 1 3 17C3 12 7 8 10 2Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="2"/><path d="M7 16A3 3 0 0 0 9 20" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>';
}
function waveFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const g = anchor(from, 0.5, 0.92), f = body(from, 0.5, 0.5), dir = end[0] > f[0] ? 1 : -1, w = 210 * k;
  /* the water rises around the caster's feet */
  for (let n = 0; n < 3; n++) sleep(n * 120).then(function () { ring(g[0], g[1], n % 2 ? '#ffffff' : mc, 240 * k, 700, true); });
  sparks(g[0], g[1] - 10, 10, function (n) { return drop(n % 3 ? mc : '#ffffff', 14 + (n % 3) * 4); }, 110 * k, 700);
  const wave = piece(waveBig(mc), 'sp-wave-big', w);
  wave.style.height = (w * 0.65).toFixed(0) + 'px';
  const flip = dir < 0 ? ' scaleX(-1)' : '', start: P = [g[0] - dir * 40 * k, g[1] - 50 * k];
  animate(wave, [{ transform: tr(start) + flip + ' scale(.2,.05)', opacity: 0 }, { transform: tr([start[0], start[1] - 40 * k]) + flip + ' scale(1)', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'both' });
  return sleep(500).then(function () {
    sfx('whoosh');
    const dur = 520, to: P = [end[0], end[1] - 20 * k];
    animate(wave, along(function (t) { return mid([start[0], start[1] - 40 * k], to, t); }, 10, function (t) { return flip + ' scale(' + lerp(1, 1.25, t).toFixed(2) + ') rotate(' + (dir * t * 18).toFixed(0) + 'deg)'; }, function (t) { return t > 0.85 ? (1 - t) / 0.15 : 1; }),
      { duration: dur, easing: 'cubic-bezier(.5,0,.8,1)', fill: 'both' }).then(gone(wave));
    /* spray behind it */
    for (let n = 1; n <= 5; n++) sleep(n * 80).then(function () { const p = mid(start, to, n / 6); sparks(p[0], p[1] + 30 * k, 3, function () { return drop('#ffffff', 12); }, 50 * k, 500); });
    if (c.big) {
      /* the grand one: a whirlpool opens under the foe as the wave comes */
      const wf = anchor(1 - from, 0.5, 0.9), wp = piece('<svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke-linecap="round"><path d="M50 50m-6 0a6 6 0 1 1 12 0a12 12 0 1 1-24 0a18 18 0 1 1 36 0a24 24 0 1 1-48 0a30 30 0 1 1 60 0a36 36 0 1 1-72 0" stroke="' + INK + '" stroke-width="7"/><path d="M50 50m-6 0a6 6 0 1 1 12 0a12 12 0 1 1-24 0a18 18 0 1 1 36 0a24 24 0 1 1-48 0a30 30 0 1 1 60 0a36 36 0 1 1-72 0" stroke="' + mc + '" stroke-width="4"/></svg>', 'sp-whirl', 260 * k);
      const at = tr(wf) + ' scaleY(.32)';
      animate(wp, [{ transform: at + ' scale(.2) rotate(0deg)', opacity: 0 }, { transform: at + ' scale(1) rotate(-360deg)', opacity: 1, offset: 0.4 }, { transform: at + ' scale(1.1) rotate(-900deg)', opacity: 0 }], { duration: 1300, easing: 'linear', fill: 'both' }).then(gone(wp));
    }
    return sleep(dur * 0.85);
  });
}
function waveHit(b: P, to: number, c: Cast, mc: string, k: number) {
  /* a splash: a column of water, foam rings, drops everywhere */
  const col = piece('', 'sp-splash', 150 * k);
  col.style.setProperty('--mc', mc);
  animate(col, [{ transform: tr([b[0], b[1] + 30 * k]) + ' scale(.3,.1)', opacity: 0.9 }, { transform: tr([b[0], b[1] - 20 * k]) + ' scale(1,1.4)', opacity: 0.9, offset: 0.4 }, { transform: tr([b[0], b[1] - 40 * k]) + ' scale(1.3,1.6)', opacity: 0 }], { duration: 700, easing: 'ease-out', fill: 'both' }).then(gone(col));
  for (let n = 0; n < 2; n++) sleep(n * 130).then(function () { ring(b[0], b[1], n ? '#ffffff' : mc, (280 + n * 80) * k, 620); });
  flashAt(b[0], b[1], '#e6fffb', 420 * k, 360);
  sparks(b[0], b[1], 18, function (n) { return n % 4 ? drop(n % 2 ? mc : '#ffffff', 14 + (n % 3) * 5) : shape('Corrente', mc, 24); }, 180 * k, 950);
  const m = $('m-' + to); if (m) pulse(m, 'soaked', 760);
}

/* ---------- Calore: the sun and the fire ---------- */
function fireball(mc: string): string {
  return '<svg viewBox="0 0 100 100" aria-hidden="true" stroke-linejoin="round">' +
    '<path d="M50 4C58 18 74 18 80 30C90 32 96 44 92 56C96 74 82 94 56 96C30 98 6 84 8 58C4 44 12 34 22 32C26 18 40 20 50 4Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="5"/>' +
    '<path d="M50 24C56 34 68 36 70 48C76 58 70 78 50 80C32 80 24 66 28 54C30 42 42 38 50 24Z" fill="#ffd24a"/><circle cx="50" cy="58" r="14" fill="#fff6c8"/></svg>';
}
function sunDisc(mc: string): string {
  let rays = '';
  for (let s = 0; s < 12; s++) { const a = s / 12 * Math.PI * 2; rays += '<path d="M' + (100 + Math.cos(a - 0.12) * 62).toFixed(1) + ' ' + (100 + Math.sin(a - 0.12) * 62).toFixed(1) + ' L' + (100 + Math.cos(a) * 96).toFixed(1) + ' ' + (100 + Math.sin(a) * 96).toFixed(1) + ' L' + (100 + Math.cos(a + 0.12) * 62).toFixed(1) + ' ' + (100 + Math.sin(a + 0.12) * 62).toFixed(1) + 'Z"/>'; }
  return '<svg viewBox="0 0 200 200" aria-hidden="true"><g fill="' + mc + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round">' + rays + '</g>' +
    '<circle cx="100" cy="100" r="60" fill="#ffd24a" stroke="' + INK + '" stroke-width="6"/><circle cx="100" cy="100" r="42" fill="#fff3b0"/></svg>';
}
function fireFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const f = body(from, from === 0 ? 0.66 : 0.34, 0.3), w = 96 * k, ball = piece(fireball(mc), 'sp-fire', w);
  /* embers spiral into the caster's mouth, the ball of fire grows there */
  for (let n = 0; n < 10; n++) {
    const el = piece(shape('Calore', n % 2 ? '#ffd24a' : mc, 18), 'sp-ember'), a0 = n / 10 * Math.PI * 2, fr: Keyframe[] = [];
    for (let q = 0; q <= 8; q++) { const t = q / 8, a = a0 + t * Math.PI * 1.6, r = lerp(120, 6, t) * k; fr.push({ transform: tr([f[0] + Math.cos(a) * r, f[1] + Math.sin(a) * r * 0.7]) + ' scale(' + lerp(0.6, 1.1, t).toFixed(2) + ')', opacity: t < 0.15 ? t / 0.15 : 1 - Math.max(0, t - 0.8) * 5 }); }
    animate(el, fr, { duration: 520, delay: n * 22, easing: 'ease-in', fill: 'both' }).then(gone(el));
  }
  animate(ball, [{ transform: tr(f) + ' scale(.1)', opacity: 0 }, { transform: tr(f) + ' scale(1.15)', opacity: 1, offset: 0.8 }, { transform: tr(f) + ' scale(1)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'both' });
  sfx('lunge');
  let sun: HTMLElement | null = null;
  if (c.big) {
    /* the grand one: a sun rises over the arena, and the fire falls from it */
    sun = piece(sunDisc(mc), 'sp-sun', 200 * k);
    const top: P = [lerp(f[0], end[0], 0.5), Math.max(80 * k, end[1] - 230 * k)];
    animate(sun, [{ transform: tr([top[0], top[1] + 60]) + ' scale(.3) rotate(0deg)', opacity: 0 }, { transform: tr(top) + ' scale(1) rotate(60deg)', opacity: 1, offset: 0.5 }, { transform: tr(top) + ' scale(1.05) rotate(120deg)', opacity: 1 }], { duration: 900, easing: 'ease-out', fill: 'both' });
  }
  return sleep(600).then(function () {
    sfx('whoosh');
    const cv = curve(f, end, 70 * k), dur = 430;
    animate(ball, along(cv.at, 12, function (t) { return 'scale(' + lerp(1, 1.3, t).toFixed(2) + ') rotate(' + (t * 260).toFixed(0) + 'deg)'; }), { duration: dur, easing: 'cubic-bezier(.5,0,.8,1)', fill: 'both' }).then(function () { fade(ball, c.outcome === 'miss' ? 200 : 60); });
    /* a trail of fire */
    for (let n = 1; n <= 7; n++) sleep(n * 50).then(function () {
      const p = cv.at(Math.min(1, n * 50 / dur)), el = piece(shape('Calore', n % 2 ? mc : '#ffd24a', Math.round(26 * k)), 'sp-ember');
      animate(el, [{ transform: tr(p) + ' scale(1)', opacity: 0.95 }, { transform: tr([p[0], p[1] - 40]) + ' scale(.3)', opacity: 0 }], { duration: 520, easing: 'ease-out', fill: 'both' }).then(gone(el));
    });
    if (sun) { const s0 = sun; sleep(dur).then(function () { fade(s0, 500); }); }
    return sleep(dur);
  });
}
function fireHit(b: P, to: number, c: Cast, mc: string, k: number) {
  /* an explosion of flame: a ball that swells, tongues of fire all round, the heat ring */
  const boom = piece(fireball(mc), 'sp-fire', 150 * k);
  animate(boom, [{ transform: tr(b) + ' scale(.4)', opacity: 1 }, { transform: tr(b) + ' scale(1.6)', opacity: 0.9, offset: 0.4 }, { transform: tr([b[0], b[1] - 30]) + ' scale(2.1)', opacity: 0 }], { duration: 640, easing: 'ease-out', fill: 'both' }).then(gone(boom));
  if (c.big) for (let n = 0; n < 8; n++) {
    const x = b[0] + (n - 3.5) * 30 * k, el = piece(fireball(mc), 'sp-fire', 46 * k);
    animate(el, [{ transform: tr([x + 90 * k, -40]) + ' scale(.7)', opacity: 0 }, { transform: tr([x + 30 * k, lerp(-40, b[1], 0.6)]) + ' scale(1)', opacity: 1, offset: 0.6 }, { transform: tr([x, b[1] + 20]) + ' scale(1.2)', opacity: 0 }], { duration: 520, delay: 80 + n * 60, easing: 'ease-in', fill: 'both' }).then(gone(el));
  }
  ring(b[0], b[1], mc, 340 * k, 600);
  flashAt(b[0], b[1], '#fff1c4', 480 * k, 400);
  sparks(b[0], b[1], 18, function (n) { return shape('Calore', n % 3 ? mc : '#ffd24a', 18 + (n % 3) * 7); }, 170 * k, 950);
  const m = $('m-' + to); if (m) pulse(m, 'scorched', 760);
}

/* ---------- Cielo: the wind ---------- */
function tornado(mc: string): string {
  let s = '<svg viewBox="0 0 120 200" aria-hidden="true" fill="none" stroke-linecap="round">';
  for (let q = 0; q < 7; q++) {
    const y = 20 + q * 26, rx = lerp(54, 10, q / 6), ry = lerp(12, 4, q / 6), dx = Math.sin(q * 1.3) * 6;
    s += '<ellipse cx="' + (60 + dx).toFixed(1) + '" cy="' + y + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '" stroke="' + INK + '" stroke-width="7"/>' +
      '<ellipse cx="' + (60 + dx).toFixed(1) + '" cy="' + y + '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) + '" stroke="' + (q % 2 ? '#ffffff' : mc) + '" stroke-width="4"/>';
  }
  return s + '</svg>';
}
function windFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const g = anchor(from, 0.5, 0.92), f = body(from, 0.5, 0.45), w = 120 * k;
  /* the caster beats its wings: feathers and gusts around it */
  sparks(f[0], f[1], 10, function (n) { return shape('Cielo', n % 2 ? '#ffffff' : mc, 22 + (n % 3) * 4); }, 120 * k, 800);
  const tw = piece(tornado(mc), 'sp-tornado', w);
  tw.style.height = (w * 1.66).toFixed(0) + 'px';
  const base: P = [g[0], g[1] - w * 0.8];
  animate(tw, [{ transform: tr(base) + ' scale(.2,.05)', opacity: 0 }, { transform: tr(base) + ' scale(1)', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'both' });
  sfx('plane');
  return sleep(440).then(function () {
    sfx('whoosh');
    const dur = 620, endB = anchor(1 - from, 0.5, 0.92), to: P = [end[0], endB[1] - w * 0.8];
    const fr: Keyframe[] = [];
    for (let q = 0; q <= 14; q++) { const t = q / 14, p = mid(base, to, t); fr.push({ transform: tr([p[0] + Math.sin(t * Math.PI * 4) * 16 * k, p[1] - Math.sin(t * Math.PI) * 30 * k]) + ' scale(' + (q % 2 ? -1 : 1) * lerp(1, 1.25, t) + ',' + lerp(1, 1.25, t).toFixed(2) + ')', opacity: t > 0.9 ? (1 - t) * 10 : 1 }); }
    animate(tw, fr, { duration: dur, easing: 'ease-in-out', fill: 'both' }).then(gone(tw));
    /* feathers riding the twister */
    for (let n = 0; n < 6; n++) {
      const el = piece(shape('Cielo', n % 2 ? mc : '#ffffff', Math.round(24 * k)), 'sp-feather');
      animate(el, along(function (t) { const p = mid(base, to, t), a = t * Math.PI * 6 + n; return [p[0] + Math.cos(a) * 60 * k, p[1] + (n - 2.5) * 24 * k + Math.sin(a) * 10]; }, 14, function (t) { return 'rotate(' + (t * 720 + n * 40).toFixed(0) + 'deg)'; }, function (t) { return t > 0.85 ? (1 - t) / 0.15 : 1; }),
        { duration: dur, delay: n * 20, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
    }
    if (c.big) {
      /* the grand one: the whole arena swept by the gale */
      for (let n = 0; n < 9; n++) {
        const el = piece('', 'sp-gust'), y = (n + 0.5) / 9 * size().h, x0 = from === 0 ? -80 : size().w + 80, x1 = from === 0 ? size().w + 80 : -80;
        el.style.setProperty('--mc', n % 2 ? '#ffffff' : mc);
        animate(el, [{ transform: 'translate(' + x0 + 'px,' + y.toFixed(0) + 'px) scaleX(.4)', opacity: 0 }, { transform: 'translate(' + lerp(x0, x1, 0.5).toFixed(0) + 'px,' + y.toFixed(0) + 'px) scaleX(1.4)', opacity: 0.9, offset: 0.5 }, { transform: 'translate(' + x1 + 'px,' + y.toFixed(0) + 'px) scaleX(.4)', opacity: 0 }],
          { duration: 520, delay: 60 + n * 40, easing: 'linear', fill: 'both' }).then(gone(el));
      }
    }
    return sleep(dur * 0.9);
  });
}
function windHit(b: P, to: number, c: Cast, mc: string, k: number) {
  /* a gust: the foe is thrown sideways, feathers burst out, wind rings */
  const bob = document.querySelector('#m-' + to + ' .bob');
  if (bob) animate(bob, [{ transform: 'rotate(0) translateX(0)' }, { transform: 'rotate(' + (to === 1 ? 14 : -14) + 'deg) translateX(' + (to === 1 ? 18 : -18) + 'px)', offset: 0.25 }, { transform: 'rotate(' + (to === 1 ? -6 : 6) + 'deg)', offset: 0.6 }, { transform: 'rotate(0) translateX(0)' }], { duration: 640, easing: 'ease-out' });
  for (let n = 0; n < 3; n++) sleep(n * 90).then(function () { ring(b[0], b[1], n % 2 ? '#ffffff' : mc, (230 + n * 60) * k, 520); });
  flashAt(b[0], b[1], '#f2ffe8', 400 * k, 320);
  sparks(b[0], b[1], 16, function (n) { return shape('Cielo', n % 3 ? mc : '#ffffff', 20 + (n % 3) * 6); }, 200 * k, 1100);
  const m = $('m-' + to); if (m) pulse(m, 'gusted', 640);
}

/* ---------- Corazza: the stone ---------- */
function rock(mc: string, v: number): string {
  const pts = [[50, 4], [86, 20], [96, 58], [74, 92], [30, 96], [6, 62], [14, 24]].map(function (p, i) { return [p[0] + ((v * 7 + i * 13) % 9) - 4, p[1] + ((v * 5 + i * 11) % 9) - 4]; });
  return '<svg viewBox="0 0 100 100" aria-hidden="true" stroke-linejoin="round"><path d="M' + pts.map(function (p) { return p.join(' '); }).join(' L') + 'Z" fill="#9a8a78" stroke="' + INK + '" stroke-width="6"/>' +
    '<path d="M' + pts[0].join(' ') + ' L' + pts[1].join(' ') + ' L58 46 L' + pts[6].join(' ') + 'Z" fill="' + mc + '"/>' +
    '<path d="M58 46 L52 70 L64 82M52 70L36 76" fill="none" stroke="' + INK + '" stroke-width="3.5" stroke-linecap="round"/></svg>';
}
function stoneFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const g = anchor(from, 0.5, 0.92), f = body(from, 0.5, 0.4), n = c.big ? 7 : 5, rocks: HTMLElement[] = [], spots: P[] = [];
  /* the ground cracks at the caster's feet and stones rise out of it, floating around it */
  const L = layer(beam(boltPath(g[0] - 110 * k, g[1] + 2, g[0] + 110 * k, g[1] - 2, 8, 14 * k), mc, 4 * k));
  trace(L, 200).then(function () { fade(L, 600, 300); });
  sfx('shake');
  for (let s = 0; s < n; s++) {
    const el = piece(rock(mc, s), 'sp-rock', Math.round((34 + (s % 3) * 10) * k)), a = Math.PI + (s + 0.5) / n * Math.PI, p: P = [f[0] + Math.cos(a) * 95 * k, f[1] + Math.sin(a) * 60 * k];
    spots.push(p); rocks.push(el);
    animate(el, [{ transform: tr([p[0], g[1]]) + ' scale(.3) rotate(0deg)', opacity: 0 }, { transform: tr(p) + ' scale(1) rotate(' + (s * 50) + 'deg)', opacity: 1 }], { duration: 420, delay: s * 50, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'both' });
  }
  return sleep(460 + n * 50).then(function () {
    sfx('whoosh');
    rocks.forEach(function (el, s) {
      animate(el, along(curve(spots[s], c.outcome === 'miss' ? beyond(spots[s], end) : [end[0] + (s - n / 2) * 10, end[1] + (s % 2) * 12], 30 * k).at, 8, function (t) { return 'scale(' + lerp(1, 1.15, t).toFixed(2) + ') rotate(' + (s * 50 + t * 400).toFixed(0) + 'deg)'; }),
        { duration: 300, delay: s * 45, easing: 'ease-in', fill: 'both' }).then(function () { el.remove(); if (c.outcome !== 'miss') flashAt(end[0], end[1], mc, 120 * k, 160); });
    });
    if (c.big) {
      /* the grand one: a boulder as big as a house falls on the foe */
      const big = piece(rock(mc, 9), 'sp-rock', Math.round(170 * k));
      animate(big, [{ transform: tr([end[0], -160]) + ' rotate(-30deg)', opacity: 1 }, { transform: tr([end[0], end[1] - 10]) + ' rotate(20deg)', opacity: 1 }], { duration: 420, delay: n * 45 + 80, easing: 'cubic-bezier(.6,0,1,1)', fill: 'both' }).then(function () { fade(big, 260); });
      return sleep(n * 45 + 500);
    }
    return sleep(300 + n * 45);
  });
}
function stoneHit(b: P, to: number, c: Cast, mc: string, k: number) {
  const g = anchor(to, 0.5, 0.9);
  const L = layer(beam(boltPath(g[0] - 130 * k, g[1] + 4, g[0] + 130 * k, g[1] - 4, 10, 20 * k), mc, 5 * k));
  trace(L, 160).then(function () { fade(L, 500, 200); });
  ring(b[0], b[1], mc, 300 * k, 560);
  flashAt(b[0], b[1], '#fff2de', 380 * k, 320);
  sparks(b[0], b[1], 16, function (n) { return n % 3 ? rock(mc, n).replace('<svg ', '<svg width="' + (16 + (n % 3) * 6) + '" height="' + (16 + (n % 3) * 6) + '" ') : shape('Corazza', mc, 22); }, 170 * k, 900);
  sfx('shake');
  pulse(arena, 'quake', 420);
  const m = $('m-' + to); if (m) pulse(m, 'stoned', 700);
}

/* ---------- Crepuscolo: the dusk ---------- */
function blackSun(mc: string): string {
  let rays = '';
  for (let s = 0; s < 16; s++) { const a = s / 16 * Math.PI * 2, r = s % 2 ? 78 : 96; rays += (s ? ' L' : 'M') + (100 + Math.cos(a) * r).toFixed(1) + ' ' + (100 + Math.sin(a) * r).toFixed(1) + ' L' + (100 + Math.cos(a + Math.PI / 16) * 62).toFixed(1) + ' ' + (100 + Math.sin(a + Math.PI / 16) * 62).toFixed(1); }
  return '<svg viewBox="0 0 200 200" aria-hidden="true" stroke-linejoin="round"><path d="' + rays + 'Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="5"/>' +
    '<circle cx="100" cy="100" r="60" fill="#ffb36b" stroke="' + INK + '" stroke-width="5"/><circle cx="100" cy="100" r="54" fill="#1a1530"/>' +
    '<path d="M68 82Q100 60 132 82" fill="none" stroke="' + mc + '" stroke-width="5" stroke-linecap="round"/><circle cx="84" cy="98" r="7" fill="' + mc + '"/><circle cx="116" cy="98" r="7" fill="' + mc + '"/></svg>';
}
function duskFly(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const f = body(from, 0.5, 0.4), top: P = [f[0], Math.max(70 * k, f[1] - 150 * k)], sun = piece(blackSun(mc), 'sp-blacksun', 150 * k);
  /* the dark grows: a black sun with eyes rises over the caster, with its ring of dusk */
  const veil = piece('', 'sp-veil');
  const z = size(); veil.style.width = z.w + 'px'; veil.style.height = z.h + 'px';
  animate(veil, [{ opacity: 0 }, { opacity: 0.55 }], { duration: 400, fill: 'both' });
  animate(sun, [{ transform: tr([top[0], top[1] + 80]) + ' scale(.2) rotate(-90deg)', opacity: 0 }, { transform: tr(top) + ' scale(1) rotate(0deg)', opacity: 1 }], { duration: 560, easing: 'cubic-bezier(.2,.8,.3,1.2)', fill: 'both' });
  sfx('reveal');
  return sleep(600).then(function () {
    /* shadow hands reach from the sun to the foe, one after the other */
    const n = c.big ? 5 : 3, paths: string[] = [];
    for (let s = 0; s < n; s++) {
      const off = (s - (n - 1) / 2) * 40 * k, cx = lerp(top[0], end[0], 0.5) + off, cy = lerp(top[1], end[1], 0.5) - 60 * k + Math.abs(off);
      paths.push('M' + top[0].toFixed(1) + ' ' + top[1].toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + (end[0] + off * 0.3).toFixed(1) + ' ' + (end[1] + off * 0.2).toFixed(1));
    }
    const L = layer(paths.map(function (d) { return '<path d="' + d + '" pathLength="1" stroke="' + mc + '" stroke-width="' + (26 * k).toFixed(1) + '" opacity=".3"/><path d="' + d + '" pathLength="1" stroke="#1a1530" stroke-width="' + (12 * k).toFixed(1) + '"/><path d="' + d + '" pathLength="1" stroke="' + mc + '" stroke-width="' + (3 * k).toFixed(1) + '"/>'; }).join(''));
    sfx('whoosh');
    return trace(L, 380).then(function () {
      fade(L, 380, 60);
      animate(sun, [{ transform: tr(top) + ' scale(1)', opacity: 1 }, { transform: tr(top) + ' scale(.2) rotate(180deg)', opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'both' }).then(gone(sun));
      animate(veil, [{ opacity: 0.55 }, { opacity: 0 }], { duration: 500, delay: 100, fill: 'both' }).then(gone(veil));
    });
  });
}
function duskHit(b: P, to: number, c: Cast, mc: string, k: number) {
  /* the shadow closes in on the one hit and then bursts: an inward ring, a dark burst, the dusk's shapes */
  const imp = piece('', 'sp-implode', 360 * k);
  imp.style.setProperty('--mc', mc);
  animate(imp, [{ transform: tr(b) + ' scale(1.2)', opacity: 0 }, { transform: tr(b) + ' scale(.6)', opacity: 1, offset: 0.5 }, { transform: tr(b) + ' scale(.1)', opacity: 0 }], { duration: 420, easing: 'ease-in', fill: 'both' }).then(function () {
    imp.remove();
    ring(b[0], b[1], mc, 320 * k, 600);
    flashAt(b[0], b[1], mc, 440 * k, 360);
    sparks(b[0], b[1], 16, function (n) { return shape('Crepuscolo', n % 3 ? mc : '#ffb36b', 20 + (n % 3) * 6); }, 170 * k, 950);
  });
  if (c.big) for (let n = 0; n < 6; n++) {
    const el = piece('<i class="sp-eye"></i>', 'sp-star'), a = n / 6 * Math.PI * 2;
    animate(el, [{ transform: tr([b[0] + Math.cos(a) * 120 * k, b[1] + Math.sin(a) * 80 * k]) + ' scale(0)', opacity: 0 }, { transform: tr([b[0] + Math.cos(a) * 120 * k, b[1] + Math.sin(a) * 80 * k]) + ' scale(1)', opacity: 1, offset: 0.4 }, { transform: tr(b) + ' scale(.2)', opacity: 0 }],
      { duration: 700, delay: n * 50, easing: 'ease-in', fill: 'both' }).then(gone(el));
  }
  const m = $('m-' + to); if (m) pulse(m, 'shadowed', 800);
}

const FLY: Record<TypeName, (from: number, end: P, c: Cast, mc: string, k: number) => Promise<void>> = { Calma: moonFly, Caos: boltFly, Cervello: starFly, Chiacchiera: songFly, Cuore: heartFly,
  Corrente: waveFly, Calore: fireFly, Cielo: windFly, Corazza: stoneFly, Crepuscolo: duskFly };
const HIT: Record<TypeName, (b: P, to: number, c: Cast, mc: string, k: number) => void> = { Calma: moonHit, Caos: boltHit, Cervello: starHit, Chiacchiera: songHit, Cuore: heartHit,
  Corrente: waveHit, Calore: fireHit, Cielo: windHit, Corazza: stoneHit, Crepuscolo: duskHit };

/* ---------- the legends' own moves: a show of their own, as big as the arena ---------- */
type Epic = (from: number, end: P, c: Cast, mc: string, k: number) => Promise<void>;
/** a veil over the whole arena, darker than the charge */
function veilOn(op: number) {
  const v = piece('', 'sp-veil'), z = size();
  v.style.width = z.w + 'px'; v.style.height = z.h + 'px';
  animate(v, [{ opacity: 0 }, { opacity: op }], { duration: 380, fill: 'both' });
  return function (ms: number) { animate(v, [{ opacity: op }, { opacity: 0 }], { duration: ms, fill: 'both' }).then(gone(v)); };
}
/** Giano's Porta del tempo: the wheel of the hours fills the arena, its hands run backwards, time stops, and the door
    in the middle opens on a blast of light */
function timeGate(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const z = size(), mid0: P = [z.w / 2, z.h * 0.46], w = Math.min(z.w * 0.92, z.h * 1.05), off = veilOn(0.7), GOLD = '#f2c94c', SIL = '#c9d3ea';
  let dial = '<svg viewBox="0 0 200 200" aria-hidden="true" fill="none" stroke-linecap="round">' +
    '<circle cx="100" cy="100" r="92" stroke="' + INK + '" stroke-width="12"/><path d="M100 8A92 92 0 0 0 100 192" stroke="' + GOLD + '" stroke-width="7"/><path d="M100 8A92 92 0 0 1 100 192" stroke="' + SIL + '" stroke-width="7"/>' +
    '<circle cx="100" cy="100" r="74" stroke="' + mc + '" stroke-width="2.5" stroke-dasharray="4 6"/>';
  const ROMAN = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let h = 0; h < 12; h++) {
    const a = h / 12 * Math.PI * 2, x = 100 + Math.sin(a) * 82, y = 100 - Math.cos(a) * 82;
    dial += '<text x="' + x.toFixed(1) + '" y="' + (y + 4).toFixed(1) + '" font-size="11" font-weight="700" text-anchor="middle" fill="#ffffff" stroke="' + INK + '" stroke-width="3" paint-order="stroke" font-family="serif">' + ROMAN[h] + '</text>';
  }
  dial += '</svg>';
  const D = piece(dial, 'sp-dial', w);
  animate(D, [{ transform: tr(mid0) + ' scale(.2) rotate(-90deg)', opacity: 0 }, { transform: tr(mid0) + ' scale(1) rotate(0deg)', opacity: 1, offset: 0.5 }, { transform: tr(mid0) + ' scale(1.02) rotate(4deg)', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.2,.8,.3,1.1)', fill: 'both' });
  sfx('reveal');
  /* the two hands, running backwards faster and faster */
  const hands = ['<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M100 100 L100 30" stroke="' + INK + '" stroke-width="11" stroke-linecap="round"/><path d="M100 100 L100 30" stroke="' + GOLD + '" stroke-width="6" stroke-linecap="round"/></svg>',
    '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M100 100 L100 52" stroke="' + INK + '" stroke-width="13" stroke-linecap="round"/><path d="M100 100 L100 52" stroke="' + SIL + '" stroke-width="7" stroke-linecap="round"/><circle cx="100" cy="100" r="9" fill="' + mc + '" stroke="' + INK + '" stroke-width="4"/></svg>'];
  const H = hands.map(function (hh, q) {
    const el = piece(hh, 'sp-dial', w);
    animate(el, [{ transform: tr(mid0) + ' rotate(0deg)', opacity: 0 }, { transform: tr(mid0) + ' rotate(' + (q ? -200 : -900) + 'deg)', opacity: 1, offset: 0.6 }, { transform: tr(mid0) + ' rotate(' + (q ? -260 : -1300) + 'deg)', opacity: 1 }], { duration: 1500, delay: 300, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both' });
    return el;
  });
  /* time stops on the foe */
  const foe = $('m-' + (1 - from)); if (foe) sleep(500).then(function () { pulse(foe, 'hexed', 1200); });
  return sleep(1500).then(function () {
    /* the door in the middle of the wheel opens on the light */
    const leaf = function (dir: number) { return '<svg viewBox="0 0 60 120" aria-hidden="true"><rect x="2" y="2" width="56" height="116" rx="4" fill="' + (dir < 0 ? GOLD : SIL) + '" stroke="' + INK + '" stroke-width="4"/><path d="M14 14H46V54H14ZM14 66H46V106H14Z" fill="none" stroke="' + INK + '" stroke-width="2.5" opacity=".6"/></svg>'; };
    const dw = w * 0.22, light = piece('', 'sp-halo', w * 0.7);
    light.style.setProperty('--mc', '#fff6c8');
    animate(light, [{ transform: tr(mid0) + ' scale(.1)', opacity: 0 }, { transform: tr(mid0) + ' scale(1)', opacity: 1, offset: 0.4 }, { transform: tr(mid0) + ' scale(1.3)', opacity: 0 }], { duration: 900, easing: 'ease-out', fill: 'both' }).then(gone(light));
    [-1, 1].forEach(function (dir) {
      const el = piece(leaf(dir), 'sp-dial', dw);
      el.style.height = (dw * 2).toFixed(0) + 'px';
      animate(el, [{ transform: tr([mid0[0] + dir * dw * 0.5, mid0[1]]) + ' scaleX(1)', opacity: 1 }, { transform: tr([mid0[0] + dir * dw * 1.3, mid0[1]]) + ' scaleX(.2)', opacity: 0 }], { duration: 520, easing: 'ease-in', fill: 'both' }).then(gone(el));
    });
    sfx('magic');
    const L = layer(beam('M' + mid0[0].toFixed(1) + ' ' + mid0[1].toFixed(1) + ' L' + end[0].toFixed(1) + ' ' + end[1].toFixed(1), mc, 30 * k) + beam('M' + mid0[0].toFixed(1) + ' ' + mid0[1].toFixed(1) + ' L' + end[0].toFixed(1) + ' ' + end[1].toFixed(1), '#fff6c8', 12 * k));
    return trace(L, 240).then(function () {
      fade(L, 500, 80);
      [D].concat(H).forEach(function (el) { animate(el, [{ opacity: 1 }, { opacity: 0, transform: tr(mid0) + ' scale(1.25)' }], { duration: 500, easing: 'ease-in', fill: 'both' }).then(gone(el)); });
      off(700);
    });
  });
}
/** Fuocelmo's Tempesta di Sant'Elmo: the sky breaks, lightning falls all over the arena, a serpent of blue fire
    crosses it, and blue fire rains on the foe */
function elmoStorm(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const z = size(), off = veilOn(0.62), BLUE = '#5fb6ff', HOT = '#9fe0ff';
  /* storm clouds over the arena */
  for (let q = 0; q < 3; q++) {
    const cw = z.w * 0.4, cl = piece(stormCloud(), 'sp-cloud', cw), at: P = [z.w * (0.18 + q * 0.32), cw * 0.08];
    cl.style.height = (cw / 2).toFixed(0) + 'px';
    animate(cl, [{ transform: tr([at[0], at[1] - 40]) + ' scale(.7)', opacity: 0 }, { transform: tr(at) + ' scale(1)', opacity: 1, offset: 0.2 }, { transform: tr(at) + ' scale(1)', opacity: 1, offset: 0.85 }, { transform: tr(at) + ' scale(1.05)', opacity: 0 }], { duration: 2300, delay: q * 80, fill: 'both' }).then(gone(cl));
  }
  sfx('thunder');
  /* lightning all over the arena, one at a time (lit where it lands: never more than a flash or two a second) */
  let chain: Promise<unknown> = sleep(350);
  [0.12, 0.88, 0.35, 0.66].forEach(function (fx0, n) {
    chain = chain.then(function () {
      const x = z.w * fx0, y2 = z.h * (0.55 + (n % 2) * 0.25), L = layer(beam(boltPath(x + (wob() - 0.5) * 30, z.h * 0.12, x, y2, 9, 50 * k), HOT, 8 * k), 'sp-bolt');
      animate(L, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0.3, offset: 0.4 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 300, fill: 'both' }).then(gone(L));
      flashAt(x, y2, HOT, 200 * k, 260);
      sparks(x, y2, 6, function () { return shape('Calore', BLUE, 20); }, 80 * k, 600);
      if (n === 2) sfx('thunder');
      return sleep(170);
    });
  });
  return chain.then(function () {
    /* the serpent of blue fire, from the caster to the foe, winding */
    const a = body(from, 0.5, 0.4);
    let d = 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1);
    for (let q = 1; q <= 12; q++) { const t = q / 12, p = mid(a, end, t); d += ' L' + p[0].toFixed(1) + ' ' + (p[1] + Math.sin(t * Math.PI * 3) * 50 * k * (1 - t * 0.6) - Math.sin(t * Math.PI) * 60 * k).toFixed(1); }
    const L = layer(beam(d, BLUE, 26 * k) + beam(d, HOT, 8 * k));
    sfx('whoosh');
    return trace(L, 420).then(function () {
      fade(L, 420, 60);
      /* and the blue fire rains down */
      for (let q = 0; q < 9; q++) {
        const x = end[0] + (q - 4) * 26 * k, el = piece(fireball(BLUE), 'sp-fire', Math.round(40 * k));
        animate(el, [{ transform: tr([x + 70 * k, -40]) + ' scale(.6)', opacity: 0 }, { transform: tr([x + 20 * k, lerp(-40, end[1], 0.6)]) + ' scale(1)', opacity: 1, offset: 0.6 }, { transform: tr([x, end[1] + 10]) + ' scale(1.2)', opacity: 0 }], { duration: 420, delay: q * 40, easing: 'ease-in', fill: 'both' }).then(gone(el));
      }
      /* the last bolt on the foe: the one flash of the whole screen */
      return sleep(380).then(function () {
        const B = layer(beam(boltPath(end[0], 0, end[0], end[1], 10, 40 * k), HOT, 13 * k), 'sp-bolt');
        animate(B, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0 }], { duration: 320, fill: 'both' }).then(gone(B));
        flash('#ffffff', 240, 0.5); sfx('thunder'); pulse(arena, 'quake', 420);
        off(800);
      });
    });
  });
}
/** Lamo's Masso dei giganti: a boulder as big as a house rises behind the king, the ground shaking, and falls on the foe */
function boulder(from: number, end: P, c: Cast, mc: string, k: number): Promise<void> {
  const g = anchor(from, 0.5, 0.9), f = body(from, 0.5, 0.2), w = 230 * k, R = piece(rock(mc, 4), 'sp-rock', w), off = veilOn(0.45);
  const up: P = [f[0], Math.max(w * 0.4, f[1] - 120 * k)];
  /* the ground cracks, pebbles jump, the rock rises slowly out of it */
  const L = layer(beam(boltPath(g[0] - 160 * k, g[1] + 3, g[0] + 160 * k, g[1] - 3, 12, 22 * k), mc, 6 * k));
  trace(L, 300).then(function () { fade(L, 900, 400); });
  pulse(arena, 'quake', 420); sfx('shake');
  sleep(450).then(function () { pulse(arena, 'quake', 420); sfx('shake'); });
  for (let q = 0; q < 8; q++) sparks(g[0] + (q - 3.5) * 30 * k, g[1], 2, function (n) { return rock(mc, n + q).replace('<svg ', '<svg width="16" height="16" '); }, 60 * k, 700);
  animate(R, [{ transform: tr([g[0], g[1] + 40]) + ' scale(.5) rotate(0deg)', opacity: 0 }, { transform: tr(up) + ' scale(1) rotate(-12deg)', opacity: 1, offset: 0.8 }, { transform: tr([up[0], up[1] - 10]) + ' scale(1.02) rotate(-14deg)', opacity: 1 }],
    { duration: 1000, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' });
  return sleep(1050).then(function () {
    sfx('whoosh');
    const cv = curve(up, c.outcome === 'miss' ? beyond(up, end) : [end[0], end[1] - 10], 140 * k);
    return animate(R, along(cv.at, 12, function (t) { return 'scale(' + lerp(1, 0.8, t).toFixed(2) + ') rotate(' + (-14 + t * 200).toFixed(0) + 'deg)'; }), { duration: 520, easing: 'cubic-bezier(.5,0,.9,.9)', fill: 'both' }).then(function () {
      fade(R, 300);
      if (c.outcome !== 'miss') {
        pulse(arena, 'quake', 420);
        for (let q = 0; q < 3; q++) sleep(q * 110).then(function () { ring(end[0], end[1] + 20, '#c9b8a0', (300 + q * 120) * k, 700, true); });
      }
      off(700);
    });
  });
}
const EPIC: Record<string, Epic> = { portatempo: timeGate, tempestelmo: elmoStorm, masso: boulder };

/* ---------- the gestures: how a move travels, whatever it is made of (data/move-fx.ts) ---------- */
type Flight = (from: number, end: P, c: Cast, mc: string, k: number, t: TypeName) => Promise<void>;
/** a cut across the foe: the caster dashes in, two strokes of the move's colour cross, the type's shape bursts at the middle */
function slashFly(from: number, end: P, c: Cast, mc: string, k: number, t: TypeName): Promise<void> {
  const a = body(from, 0.5, 0.5), m = $('m-' + from);
  sfx('lunge');
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + ((end[0] - a[0]) * 0.3).toFixed(0) + 'px,' + ((end[1] - a[1]) * 0.3).toFixed(0) + 'px) scale(1.06)', offset: 0.45 }, { transform: 'none' }], { duration: 440, easing: 'ease-in-out' });
  return sleep(240).then(function () {
    if (c.outcome === 'miss') return;
    const r = 62 * k, x = end[0], y = end[1];
    const L = layer(beam('M' + (x + r).toFixed(1) + ' ' + (y - r).toFixed(1) + ' L' + (x - r).toFixed(1) + ' ' + (y + r).toFixed(1), mc, 9 * k) + beam('M' + (x - r).toFixed(1) + ' ' + (y - r * 0.8).toFixed(1) + ' L' + (x + r).toFixed(1) + ' ' + (y + r * 0.8).toFixed(1), mc, 9 * k));
    trace(L, 150).then(function () { fade(L, 280, 60); });
    const s = piece(shape(t, '#ffffff', Math.round(44 * k)), 'sp-star');
    animate(s, [{ transform: tr(end) + ' scale(.3) rotate(-25deg)', opacity: 1 }, { transform: tr(end) + ' scale(1.5) rotate(25deg)', opacity: 0 }], { duration: 380, delay: 90, easing: 'ease-out', fill: 'both' }).then(gone(s));
  });
}
/** a rain from above: the type's shapes fall on the foe one after another */
function rainFly(from: number, end: P, c: Cast, mc: string, k: number, t: TypeName): Promise<void> {
  const n = 7;
  sfx('whoosh');
  for (let q = 0; q < n; q++) {
    const x0 = end[0] + (q - 3) * 40 * k + 120 * k, x1 = end[0] + (q - 3) * 24 * k, el = piece(shape(t, q % 2 ? '#ffffff' : mc, Math.round(28 * k)), 'sp-star');
    animate(el, [{ transform: tr([x0, -30]) + ' scale(.6) rotate(0deg)', opacity: 0 }, { transform: tr([lerp(x0, x1, 0.3), lerp(-30, end[1], 0.3)]) + ' scale(1) rotate(120deg)', opacity: 1, offset: 0.3 },
      { transform: tr([x1, end[1]]) + ' scale(1.1) rotate(300deg)', opacity: 1 }], { duration: 340, delay: q * 55, easing: 'ease-in', fill: 'both' }).then(function () {
      el.remove(); if (c.outcome !== 'miss') flashAt(x1, end[1], mc, 110 * k, 200);
    });
  }
  return sleep(340 + (n - 1) * 55);
}
/** a ring that turns around the caster and then closes in on the foe */
function orbitFly(from: number, end: P, c: Cast, mc: string, k: number, t: TypeName): Promise<void> {
  const f = body(from, 0.5, 0.4), n = 7, els: HTMLElement[] = [];
  const pos = (s: number, q: number): P => { const a = s / n * Math.PI * 2 + q * Math.PI * 2 * 1.4; return [f[0] + Math.cos(a) * 70 * k, f[1] + Math.sin(a) * 34 * k]; };
  for (let s = 0; s < n; s++) {
    const el = piece(shape(t, s % 2 ? '#ffffff' : mc, Math.round(26 * k)), 'sp-star'), fr: Keyframe[] = [];
    for (let q = 0; q <= 10; q++) fr.push({ transform: tr(pos(s, q / 10)) + ' scale(' + lerp(0.4, 1, q / 10).toFixed(2) + ')', opacity: Math.min(1, q / 3) });
    animate(el, fr, { duration: 480, easing: 'linear', fill: 'both' });
    els.push(el);
  }
  sfx('shimmer');
  return sleep(480).then(function () {
    els.forEach(function (el, s) {
      animate(el, along(curve(pos(s, 1), end, 60 * k + s * 6).at, 8, function (u) { return 'scale(' + lerp(1, 1.2, u).toFixed(2) + ') rotate(' + (u * 260).toFixed(0) + 'deg)'; }, function (u) { return c.outcome === 'miss' && u > 0.9 ? 0 : 1; }),
        { duration: 340, delay: s * 28, easing: 'ease-in', fill: 'both' }).then(gone(el));
    });
    return sleep(340 + n * 28);
  });
}
/** a ray from the caster to the foe, drawn in one stroke, with the type's shape flashing where it lands */
function beamFly(from: number, end: P, c: Cast, mc: string, k: number, t: TypeName): Promise<void> {
  const f = body(from, 0.5, 0.45), cv = curve(f, end, 40 * k), L = layer(beam(cv.d, mc, 12 * k));
  sfx('magic');
  return trace(L, 260).then(function () {
    if (c.outcome !== 'miss') {
      const s = piece(shape(t, '#ffffff', Math.round(54 * k)), 'sp-star');
      animate(s, [{ transform: tr(end) + ' scale(.4)', opacity: 1 }, { transform: tr(end) + ' scale(1.6)', opacity: 0 }], { duration: 320, easing: 'ease-out', fill: 'both' }).then(gone(s));
    }
    fade(L, 300, 60);
  });
}
/** a lob: one big shape thrown high over the arena, turning as it goes */
function lobFly(from: number, end: P, c: Cast, mc: string, k: number, t: TypeName): Promise<void> {
  const f = body(from, 0.5, 0.4), cv = curve(f, end, 150 * k), el = piece(shape(t, mc, Math.round(46 * k)), 'sp-star');
  sfx('whoosh');
  return animate(el, along(cv.at, 12, function (s) { return 'scale(' + lerp(0.7, 1.25, Math.sin(s * Math.PI)).toFixed(2) + ') rotate(' + (s * 540).toFixed(0) + 'deg)'; }, function (s) { return c.outcome === 'miss' && s > 0.94 ? 0 : 1; }),
    { duration: 560, easing: 'ease-in', fill: 'both' }).then(gone(el));
}
const FLIGHT: Record<Gesture, Flight> = { slash: slashFly, rain: rainFly, orbit: orbitFly, beam: beamFly, lob: lobFly };

/** a spell that does no damage (it lowers a number, it confuses): the type's shapes turn around the foe and sink */
function hex(to: number, t: TypeName, mc: string, k: number) {
  const b = body(to, 0.5, 0.45), f = anchor(to, 0.5, 0.88);
  for (let n = 0; n < 8; n++) {
    const el = piece(shape(t, n % 2 ? '#ffffff' : mc, 22), 'sp-star'), a0 = n / 8 * Math.PI * 2, fr: Keyframe[] = [];
    for (let q = 0; q <= 10; q++) { const s = q / 10, a = a0 + s * Math.PI * 2; fr.push({ transform: tr([b[0] + Math.cos(a) * 80 * k, lerp(b[1] - 30, f[1], s) + Math.sin(a) * 20 * k]) + ' scale(' + lerp(1, 0.5, s).toFixed(2) + ')', opacity: s < 0.1 ? s * 10 : s > 0.8 ? (1 - s) * 5 : 1 }); }
    animate(el, fr, { duration: 820, delay: n * 30, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  }
  ring(f[0], f[1], mc, 240 * k, 820, true);
  const m = $('m-' + to); if (m) pulse(m, 'hexed', 820);
}

/** a draining move: motes of light flow from the one hit back to the caster */
function lifeBack(from: number, to: number, mc: string) {
  const a = body(to, 0.5, 0.5), b = body(from, 0.5, 0.5);
  for (let n = 0; n < 8; n++) {
    const cv = curve(a, b, (n % 2 ? 40 : 110) + n * 6), el = piece('<i class="sp-mote"></i>', 'sp-star');
    el.style.setProperty('--mc', mc);
    animate(el, along(cv.at, 10, function (t) { return 'scale(' + (1 - Math.abs(0.5 - t)).toFixed(2) + ')'; }, function (t) { return t < 0.15 ? t / 0.15 : t > 0.9 ? (1 - t) * 10 : 1; }),
      { duration: 620, delay: 120 + n * 55, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  }
}
/** a creature's spell, from the caster to the foe; resolves on the hit */
export function castSpell(from: number, to: number, c: Cast): Promise<void> {
  if (reduced || !arena) return Promise.resolve();
  const t = c.type, mc = colOf(t), k = grand(c);
  c.big = c.sig || c.power >= 75;
  if (c.quick) {
    /* it strikes first: a flash-step, quicker than the eye */
    const q = body(from, 0.5, 0.5);
    streaks(from); flashAt(q[0], q[1], '#ffffff', 240, 240); sfx('whoosh');
  }
  if (!t) return plainHit(from, to, c, k);
  const dark = darken(from, mc, c.sig ? 0.88 : 0.74), b = body(to, 0.5, 0.5);
  band(from, c.name, t, c.sig, mc);
  glow(from, mc, 900);
  magicCircle(from, t, mc, 200 * k, 1200);
  const end = c.outcome === 'miss' ? beyond(body(from, 0.5, 0.45), b) : b;
  const gesture = c.id ? MOVE_FX[c.id] : undefined, epic = c.sig && c.id ? EPIC[c.id] : undefined;
  return (epic ? epic(from, end, c, mc, k) : gesture ? FLIGHT[gesture](from, end, c, mc, k, t) : FLY[t](from, end, c, mc, k)).then(function () {
    if (c.outcome === 'hit') {
      HIT[t](b, to, c, mc, k);
      if (c.drain) lifeBack(from, to, mc);
      /* the grand hits: a second shockwave, the whole arena lit */
      if (c.crit || c.lvl > 0 || c.sig) { ring(b[0], b[1], '#ffffff', 420 * k, 700); if (t !== 'Caos') flash(c.lvl > 0 ? mc : '#ffffff', 420, c.lvl > 1 || c.crit ? 0.5 : 0.35); }
      if (c.crit || c.lvl > 1) pulse(arena, 'quake', 420);
      dark.off(560);
      /* a moment of stillness on the hit */
      return sleep(80);
    }
    if (c.outcome === 'none') hex(to, t, mc, k);
    dark.off(c.outcome === 'none' ? 700 : 380);
    return undefined;
  });
}

/** a spell on itself (it raises a number, it heals): a pillar of light out of the circle at its feet */
export function castSelf(i: number, t: TypeName, name: string, sig: boolean): Promise<void> {
  if (reduced || !arena) return Promise.resolve();
  const mc = colOf(t), k = sig ? 1.3 : 1.1, dark = darken(i, mc, 0.6), f = anchor(i, 0.5, 0.9), c = anchor(i, 0.5, 0.45), top = anchor(i, 0.5, 0)[1];
  band(i, name, t, sig, mc);
  glow(i, mc, 1000);
  sfx('shimmer');
  magicCircle(i, t, mc, 240 * k, 1400);
  const p = piece('', 'sp-pillar');
  p.style.setProperty('--mc', mc);
  const w = 150 * k, h = f[1] - Math.max(0, top - 40);
  p.style.width = w + 'px'; p.style.height = h + 'px';
  animate(p, [{ transform: 'translate(' + (f[0] - w / 2).toFixed(0) + 'px,' + (f[1] - h).toFixed(0) + 'px) scaleX(.1)', opacity: 0, transformOrigin: '50% 100%' },
    { transform: 'translate(' + (f[0] - w / 2).toFixed(0) + 'px,' + (f[1] - h).toFixed(0) + 'px) scaleX(1)', opacity: 1, offset: 0.3, transformOrigin: '50% 100%' },
    { transform: 'translate(' + (f[0] - w / 2).toFixed(0) + 'px,' + (f[1] - h).toFixed(0) + 'px) scaleX(.6)', opacity: 0, transformOrigin: '50% 100%' }], { duration: 1150, easing: 'ease-out', fill: 'both' }).then(gone(p));
  /* the type's shapes climb around it in a spiral */
  for (let n = 0; n < 10; n++) {
    const el = piece(shape(t, n % 2 ? '#ffffff' : mc, 20 + (n % 3) * 5), 'sp-star'), a0 = n / 10 * Math.PI * 2, fr: Keyframe[] = [];
    for (let q = 0; q <= 10; q++) { const s = q / 10, a = a0 + s * Math.PI * 2.5; fr.push({ transform: tr([c[0] + Math.cos(a) * 70 * k, lerp(f[1], top + 10, s)]) + ' scale(' + (0.5 + Math.sin(a) * 0.25 + 0.4).toFixed(2) + ')', opacity: s < 0.1 ? s * 10 : s > 0.75 ? (1 - s) * 4 : 1 }); }
    animate(el, fr, { duration: 1000, delay: n * 45, easing: 'ease-out', fill: 'both' }).then(gone(el));
  }
  /* a glow behind the caster, and rings of its colour climbing it from the feet to over the head */
  const bx = body(i, 0.5, 0.5), halo = piece('', 'sp-halo', 300 * k);
  halo.style.setProperty('--mc', mc);
  animate(halo, [{ transform: tr(bx) + ' scale(.3)', opacity: 0 }, { transform: tr(bx) + ' scale(1)', opacity: 1, offset: 0.3 }, { transform: tr(bx) + ' scale(1.08)', opacity: 0.9, offset: 0.7 }, { transform: tr(bx) + ' scale(1.25)', opacity: 0 }],
    { duration: 1250, easing: 'ease-out', fill: 'both' }).then(gone(halo));
  for (let n = 0; n < 3; n++) {
    const el = piece('', 'sp-climb', 190 * k);
    el.style.setProperty('--mc', mc);
    animate(el, [{ transform: tr(f) + ' scaleY(.3) scale(.7)', opacity: 0 }, { transform: tr([f[0], lerp(f[1], top, 0.3)]) + ' scaleY(.3) scale(1)', opacity: 1, offset: 0.3 },
      { transform: tr([f[0], top + 10]) + ' scaleY(.3) scale(.8)', opacity: 0 }], { duration: 760, delay: 120 + n * 180, easing: 'cubic-bezier(.3,.6,.4,1)', fill: 'both' }).then(gone(el));
  }
  /* streaks of light climbing over the caster, as a number goes up */
  for (let n = 0; n < 9; n++) {
    const el = piece('', 'sp-streak'), x = bx[0] + (n - 4) * 17 * k, y0 = f[1] - 10, y1 = Math.max(0, top - 20);
    el.style.setProperty('--mc', mc);
    animate(el, [{ transform: 'translate(' + x.toFixed(0) + 'px,' + y0.toFixed(0) + 'px) scaleY(.2)', opacity: 0 }, { transform: 'translate(' + x.toFixed(0) + 'px,' + lerp(y0, y1, 0.5).toFixed(0) + 'px) scaleY(1)', opacity: 1, offset: 0.4 },
      { transform: 'translate(' + x.toFixed(0) + 'px,' + y1.toFixed(0) + 'px) scaleY(.6)', opacity: 0 }], { duration: 620, delay: 260 + (n % 3) * 90 + n * 20, easing: 'ease-out', fill: 'both' }).then(gone(el));
  }
  return sleep(880).then(function () {
    ring(f[0], f[1], mc, 300 * k, 640, true);
    flashAt(c[0], c[1], mc, 360 * k, 360);
    dark.off(420);
  });
}

/** a creature coming on: its magic circle opens under it, a flash of its colours, its shapes burst out */
export function arrive(i: number, t: TypeName, t2?: TypeName) {
  if (reduced || !arena) return;
  const mc = colOf(t), mc2 = t2 ? colOf(t2) : mc;
  sleep(300).then(function () {
    const f = anchor(i, 0.5, 0.88), c = body(i, 0.5, 0.5);
    magicCircle(i, t, mc, 230, 1000);
    ring(f[0], f[1], mc2, 260, 700, true);
    flashAt(c[0], c[1], mc, 360, 420);
    sparks(c[0], c[1], 12, function (n) { return shape(n % 2 && t2 ? t2 : t, n % 3 ? (n % 2 ? mc2 : mc) : '#ffffff', 18 + (n % 3) * 5); }, 130, 800);
    if (document.querySelector('#m-' + i + ' .spr-legend')) {
      /* a legend comes on: the ground shakes, rays of its two colours, rings that go all over the arena */
      pulse(arena, 'quake', 420);
      const rays = piece('', 'sp-rays', 520);
      rays.style.setProperty('--mc', mc);
      animate(rays, [{ transform: tr(c) + ' scale(.2) rotate(0deg)', opacity: 0.95 }, { transform: tr(c) + ' scale(1.3) rotate(90deg)', opacity: 0 }], { duration: 1400, easing: 'ease-out', fill: 'both' }).then(gone(rays));
      for (let n = 0; n < 3; n++) sleep(n * 200).then(function () { ring(c[0], c[1], n % 2 ? mc2 : mc, 520 + n * 160, 900); });
      sparks(c[0], c[1], 20, function (n) { return shape(n % 2 && t2 ? t2 : t, n % 2 ? mc2 : mc, 26 + (n % 3) * 6); }, 260, 1300);
    }
  });
}

/* ---------- the nets ---------- */
/** what a thing in the bag looks like on its button: a net, or a slice of tiella */
export function bagIcon(id: string): string {
  if (id === 'tiella') return '<svg viewBox="0 0 64 64" width="34" height="34" aria-hidden="true" stroke-linejoin="round"><path d="M8 48L56 48L32 12Z" fill="#e8b86a" stroke="' + INK + '" stroke-width="3.5"/>' +
    '<path d="M14 46L50 46L32 19Z" fill="#7a9a3a"/><circle cx="27" cy="38" r="3" fill="#d96a4a"/><circle cx="37" cy="40" r="2.6" fill="#d96a4a"/><circle cx="32" cy="30" r="2.4" fill="#f4efe6"/></svg>';
  if (id in HELD) return ico(id === 'cozza' ? 'shield' : id === 'corno' ? 'music' : id === 'oliva' ? 'drop' : id === 'ciambella' ? 'wing' : 'heart');
  return netSVG(id, 34);
}
/** a net thrown at a wild creature: it flies, closes on it, falls to the ground and shakes; then it holds (stars, and
    the creature stays in it) or it bursts and the creature jumps out. Resolves when it is decided */
export function throwNet(from: number, to: number, id: string, shakes: number, held: boolean): Promise<void> {
  const m = $('m-' + to);
  if (reduced || !arena) { if (held && m) m.classList.add('innet'); return Promise.resolve(); }
  const a = anchor(from, from === 0 ? 0.78 : 0.22, 0.3), b = body(to, 0.5, 0.5), g = anchor(to, 0.5, 0.8), w = 100;
  const net = piece(netSVG(id, w), 'sp-net', w), cv = curve(a, b, 150);
  let shrink: Animation | null = null;
  return animate(net, along(cv.at, 12, function (t) { return 'rotate(' + (t * 600 - 40).toFixed(0) + 'deg) scale(' + lerp(0.55, 1.15, t).toFixed(2) + ')'; }), { duration: 540, easing: 'cubic-bezier(.3,.2,.5,1)', fill: 'both' }).then(function () {
    /* it closes: a flash, the creature shrinks into it */
    flashAt(b[0], b[1], '#ffffff', 320, 320);
    sparks(b[0], b[1], 8, function () { return '<i class="sp-dust"></i>'; }, 70, 420);
    if (m && m.animate) shrink = m.animate([{ transform: 'scale(1)', opacity: 1, filter: 'brightness(1)' }, { transform: 'scale(.12)', opacity: 0, filter: 'brightness(3)' }], { duration: 300, easing: 'ease-in', fill: 'forwards' });
    net.innerHTML = netBall(id);
    return animate(net, [{ transform: tr(b) + ' scale(1.15)' }, { transform: tr(g) + ' scale(1.1,.8)', offset: 0.7 }, { transform: tr(g) + ' scale(.95,1.06)', offset: 0.85 }, { transform: tr(g) + ' scale(1)' }], { duration: 420, easing: 'ease-in', fill: 'both' });
  }).then(function () {
    /* the shakes, one after the other */
    let chain: Promise<unknown> = sleep(300);
    for (let n = 0; n < shakes; n++) {
      chain = chain.then(function () {
        sfx('shake');
        return animate(net, [{ transform: tr(g) + ' rotate(0deg)' }, { transform: tr(g) + ' rotate(-24deg)', offset: 0.25 }, { transform: tr(g) + ' rotate(18deg)', offset: 0.6 }, { transform: tr(g) + ' rotate(0deg)' }],
          { duration: 440, easing: 'ease-in-out', fill: 'both' }).then(function () { return sleep(260); });
      });
    }
    return chain;
  }).then(function () {
    if (held) {
      /* it holds: a click of light and stars; the creature stays in the net */
      if (m) m.classList.add('innet');
      flashAt(g[0], g[1], '#fffbe6', 300, 380);
      sparks(g[0], g[1] - 20, 10, function (n) { return shape('Cervello', n % 2 ? '#ffe45c' : '#ffffff', 18 + (n % 3) * 4); }, 110, 900);
      animate(net, [{ transform: tr(g) + ' scale(1)' }, { transform: tr(g) + ' scale(1.12)', filter: 'brightness(1.4)', offset: 0.4 }, { transform: tr(g) + ' scale(1)', filter: 'brightness(1)' }], { duration: 420, fill: 'both' });
      return sleep(420);
    }
    /* it bursts open, and the creature jumps out */
    sfx('dodge');
    animate(net, [{ transform: tr(g) + ' scale(1)', opacity: 1 }, { transform: tr(g) + ' scale(1.9) rotate(30deg)', opacity: 0 }], { duration: 320, easing: 'ease-out', fill: 'both' }).then(gone(net));
    sparks(g[0], g[1], 10, function () { return '<i class="sp-dust"></i>'; }, 120, 520);
    if (shrink) shrink.cancel();
    if (m && m.animate) m.animate([{ transform: 'scale(.12)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: 0.6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 440, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
    return sleep(460);
  }).then(function () { /* decided */ });
}

/** a creature down: the light of its magic leaves it, rising */
export function fadeOut(i: number, t: TypeName, t2?: TypeName) {
  if (reduced || !arena) return;
  const c = body(i, 0.5, 0.6);
  for (let n = 0; n < 12; n++) {
    const el = piece('<i class="sp-mote"></i>', 'sp-star'), x = c[0] + ((n * 29) % 13 - 6) * 9;
    el.style.setProperty('--mc', colOf(n % 2 && t2 ? t2 : t));
    animate(el, [{ transform: tr([x, c[1]]) + ' scale(.4)', opacity: 0 }, { transform: tr([x + (n % 2 ? 8 : -8), c[1] - 50]) + ' scale(1)', opacity: 1, offset: 0.3 },
      { transform: tr([x + (n % 2 ? -10 : 10), c[1] - 150]) + ' scale(.5)', opacity: 0 }], { duration: 1100, delay: 200 + n * 50, easing: 'ease-out', fill: 'both' }).then(gone(el));
  }
}

/** a number going up or down, as in the Pokémon games: arrows of light rising over the creature (red for Attack,
    blue for Defence), or falling and grey */
export function statShow(i: number, what: string): Promise<void> {
  if (reduced || !arena) return Promise.resolve();
  const up = /Up$/.test(what), atk = /^atk/.test(what), col = up ? (atk ? '#ff6b4a' : '#5aa9ff') : '#9aa3b8', c = body(i, 0.5, 0.5);
  const m = $('m-' + i);
  if (m) { m.style.setProperty('--mc', col); pulse(m, up ? 'statup' : 'statdown', 760); }
  sfx(up ? 'shimmer' : 'weak');
  for (let n = 0; n < 9; n++) {
    const x = c[0] + (n - 4) * 30, el = piece('<svg viewBox="0 0 24 32" width="36" height="48" aria-hidden="true"><path d="' + (up ? 'M12 2L22 14H16V30H8V14H2Z' : 'M12 30L22 18H16V2H8V18H2Z') + '" fill="' + col + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/></svg>', 'sp-star');
    const y0 = up ? c[1] + 60 : c[1] - 90, y1 = up ? c[1] - 120 : c[1] + 60;
    animate(el, [{ transform: tr([x, y0]) + ' scale(.6)', opacity: 0 }, { transform: tr([x, lerp(y0, y1, 0.4)]) + ' scale(1)', opacity: 1, offset: 0.3 }, { transform: tr([x, y1]) + ' scale(.8)', opacity: 0 }],
      { duration: 760, delay: (n % 3) * 90 + (n % 2) * 40, easing: up ? 'ease-out' : 'ease-in', fill: 'both' }).then(gone(el));
  }
  return sleep(640);
}
