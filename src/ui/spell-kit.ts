import type { TypeName } from '../data/types';
import type { Take } from '../data/move-fx';
import { MAGIC } from '../render/svg/creatures';
import { $ } from './dom';
import { battle } from './common';
import { arena } from './battle-screen';
import { fx, animate, anchor, shape, SHAPE } from './effects';

/* What every move's show is drawn with (ui/spells.ts the shows of the types, ui/move-stages.ts the scenes of the moves):
   points on the arena and on the fighters' bodies, curves, pieces placed by their transform, lines drawn in one
   stroke, the type's shapes, and how the one hit takes a blow. Only drawing, and never Math.random. */

export const INK = '#1c2340';

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
export type P = number[];
export const colOf = (t: TypeName | null): string => (t ? MAGIC[t].col : '#ffffff');
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const mid = (a: P, b: P, t: number): P => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
export const tr = (p: P): string => 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px) translate(-50%,-50%)';
export const gone = (el: Element) => function () { el.remove(); };

export function size(): { w: number; h: number } { const r = arena.getBoundingClientRect(); return { w: r.width, h: r.height }; }
/** a point on a fighter's body (a creature's drawing, not its square frame), as fractions of it, on the arena */
export function body(i: number, fx0: number, fy0: number): P {
  const g = document.querySelector('#w-' + i + ' .spr-c > g[transform]');
  if (!g) return anchor(i, fx0, fy0);
  const a = arena.getBoundingClientRect(), r = g.getBoundingClientRect();
  return [r.left - a.left + r.width * fx0, r.top - a.top + r.height * fy0];
}
/** a point past the target, for a spell that misses */
export function beyond(a: P, b: P): P { return [b[0] + (b[0] - a[0]) * 0.45, b[1] + (b[1] - a[1]) * 0.45]; }
/** a curve from a to b, lifted in the middle */
export function curve(a: P, b: P, lift: number) {
  const cx = (a[0] + b[0]) / 2, cy = Math.min(a[1], b[1]) - lift;
  return {
    at: function (t: number): P { return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * cx + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * cy + t * t * b[1]]; },
    d: 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ' ' + b[0].toFixed(1) + ' ' + b[1].toFixed(1)
  };
}
/** keyframes that carry an element along a curve, with more transform and an opacity for each moment */
export function along(at: (t: number) => P, n: number, more?: (t: number) => string, op?: (t: number) => number): Keyframe[] {
  const out: Keyframe[] = [];
  for (let k = 0; k <= n; k++) { const t = k / n; out.push({ transform: tr(at(t)) + ' ' + (more ? more(t) : ''), opacity: op ? op(t) : 1 }); }
  return out;
}
/** an element on the arena, placed by its transform */
export function piece(html: string, cls: string, w?: number): HTMLElement {
  const el = fx(html, 'sp ' + cls, 0, 0, 0);
  el.style.left = '0'; el.style.top = '0';
  if (w) { el.style.width = w + 'px'; el.style.height = w + 'px'; }
  return el;
}
/** an SVG as big as the arena, for the lines that cross it */
export function layer(inner: string, cls?: string): HTMLElement {
  const z = size();
  return piece('<svg viewBox="0 0 ' + Math.round(z.w) + ' ' + Math.round(z.h) + '" width="' + Math.round(z.w) + '" height="' + Math.round(z.h) + '" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>', 'sp-layer ' + (cls || ''));
}
/** a line in the type's colour with a white core: drawn from one end to the other (pathLength 1) */
export function beam(d: string, mc: string, w: number): string {
  return '<path d="' + d + '" pathLength="1" stroke="' + mc + '" stroke-width="' + (w * 3.2 + 8).toFixed(1) + '" opacity=".22"/>' +
    '<path d="' + d + '" pathLength="1" stroke="' + INK + '" stroke-width="' + (w + 5).toFixed(1) + '" opacity=".55"/>' +
    '<path d="' + d + '" pathLength="1" stroke="' + mc + '" stroke-width="' + w.toFixed(1) + '"/>' +
    '<path d="' + d + '" pathLength="1" stroke="#ffffff" stroke-width="' + Math.max(1.5, w * 0.34).toFixed(1) + '"/>';
}
export function trace(el: HTMLElement, ms: number): Promise<unknown> {
  const all: Promise<unknown>[] = [];
  el.querySelectorAll('path[pathLength]').forEach(function (p) {
    (p as SVGPathElement).style.strokeDasharray = '1 1';
    all.push(animate(p, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: ms, easing: 'cubic-bezier(.3,.6,.3,1)', fill: 'both' }));
  });
  return Promise.all(all);
}
export function fade(el: HTMLElement, ms: number, delay?: number) {
  return animate(el, [{ opacity: 1 }, { opacity: 0 }], { duration: ms, delay: delay || 0, easing: 'ease-in', fill: 'both' }).then(gone(el));
}
/** a type's shape as SVG path, for drawings made of them */
export function glyph(t: TypeName, x: number, y: number, s: number, rot: number, fill: string): string {
  return '<path transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + rot.toFixed(0) + ') scale(' + s.toFixed(2) + ') translate(-12 -12)" d="' + SHAPE[t] + '" fill="' + fill + '" stroke="' + INK + '" stroke-width="' + (2.2 / s).toFixed(2) + '"/>';
}

/** a flash over the whole arena */
export function flash(col: string, ms: number, peak: number) {
  let el: HTMLElement;
  if (battle.classList.contains('has-scene')) { el = document.createElement('div'); el.className = 'spell-flash'; battle.appendChild(el); }
  else el = piece('', 'sp-flash');
  el.style.setProperty('--mc', col);
  return animate(el, [{ opacity: 0 }, { opacity: peak, offset: 0.18 }, { opacity: 0 }], { duration: ms, easing: 'ease-out', fill: 'both' }).then(gone(el));
}

export function drop(mc: string, s: number): string {
  return '<svg viewBox="0 0 20 26" width="' + s + '" height="' + Math.round(s * 1.3) + '" aria-hidden="true"><path d="M10 2C13 8 17 12 17 17A7 7 0 0 1 3 17C3 12 7 8 10 2Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="2"/><path d="M7 16A3 3 0 0 0 9 20" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>';
}

/** a veil over the whole arena, darker than the charge */
export function veilOn(op: number) {
  const v = piece('', 'sp-veil'), z = size();
  v.style.width = z.w + 'px'; v.style.height = z.h + 'px';
  animate(v, [{ opacity: 0 }, { opacity: op }], { duration: 380, fill: 'both' });
  return function (ms: number) { animate(v, [{ opacity: op }, { opacity: 0 }], { duration: ms, fill: 'both' }).then(gone(v)); };
}

/* ---------- room past the arena, and what a move is made of ---------- */
/** where a show that crosses the whole screen is drawn: the arena clips what goes past it, so in the battles with a
    scene of Formia behind them it goes on the battle, over the arena and in its coordinates. done() takes it away */
export function wide(): { host: HTMLElement; done(): void } {
  if (!battle.classList.contains('has-scene')) return { host: arena, done: function () { /* the arena stays */ } };
  const r = arena.getBoundingClientRect(), el = document.createElement('div');
  el.className = 'sp-wide';
  el.style.left = r.left.toFixed(1) + 'px'; el.style.top = r.top.toFixed(1) + 'px';
  battle.appendChild(el);
  return { host: el, done: function () { el.remove(); } };
}
/** a piece placed in a host (the arena, or the room past it of wide()) */
export function pieceIn(host: HTMLElement, html: string, cls: string, w?: number): HTMLElement {
  const el = piece(html, cls, w);
  if (host !== arena) host.appendChild(el);
  return el;
}
/** a bit of what a type's magic is made of, for a scene that throws it about: water is drops, the others their shapes */
export function bit(t: TypeName, col: string, s: number): string { return t === 'Corrente' ? drop(col, s) : shape(t, col, s); }

/* ---------- how the one hit takes a blow ---------- */
/** the one hit (side `to`) takes the blow; k is how grand the move is. Its whole body moves (m-<i>), on top of the
    shake the battle gives every hit */
export function takes(to: number, come: Take, k: number): Promise<unknown> {
  const m = $('m-' + to);
  if (!m) return Promise.resolve();
  /* away from the one that cast it: the foe stands on the right */
  const d = to === 1 ? 1 : -1, s = Math.min(1.5, k);
  const T = (x: number, y: number, more?: string) => 'translate(' + (x * s).toFixed(1) + 'px,' + (y * s).toFixed(1) + 'px)' + (more ? ' ' + more : '');
  const F: Record<Take, [Keyframe[], number]> = {
    recoil: [[{ transform: 'none' }, { transform: T(d * 34, -6, 'rotate(' + d * 7 + 'deg)'), offset: 0.18 }, { transform: T(d * 14, 0, 'rotate(' + d * 2 + 'deg)'), offset: 0.55 }, { transform: 'none' }], 560],
    lift: [[{ transform: 'none' }, { transform: T(d * 6, -54, 'rotate(' + -d * 9 + 'deg)'), offset: 0.32 }, { transform: T(d * 8, -46, 'rotate(' + -d * 6 + 'deg)'), offset: 0.5 },
      { transform: T(0, 6, 'scale(1.1,.86)'), offset: 0.76, transformOrigin: '50% 100%' }, { transform: 'none' }], 820],
    squash: [[{ transform: 'none', transformOrigin: '50% 100%' }, { transform: T(0, 6, 'scale(1.28,.62)'), offset: 0.2, transformOrigin: '50% 100%' }, { transform: 'scale(.9,1.14)', offset: 0.48, transformOrigin: '50% 100%' },
      { transform: 'scale(1.05,.95)', offset: 0.74, transformOrigin: '50% 100%' }, { transform: 'none', transformOrigin: '50% 100%' }], 660],
    spin: [[{ transform: 'rotate(0deg)' }, { transform: T(0, -14, 'rotate(' + d * 200 + 'deg)'), offset: 0.45 }, { transform: T(0, -4, 'rotate(' + d * 340 + 'deg)'), offset: 0.8 }, { transform: 'rotate(' + d * 360 + 'deg)' }], 760],
    shake: [[0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (q) { return { transform: q === 8 ? 'none' : T((q % 2 ? 6 : -6) * (1 - q / 9), q % 3 ? 1 : -1) }; }), 640],
    sink: [[{ transform: 'none' }, { transform: T(0, 26, 'scale(1.06,.88)'), offset: 0.3, transformOrigin: '50% 100%' }, { transform: T(0, 18), offset: 0.62 }, { transform: 'none' }], 780]
  };
  const f = F[come];
  return animate(m, f[0], { duration: f[1], easing: 'ease-out' });
}
