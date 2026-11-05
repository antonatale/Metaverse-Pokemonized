import type { TypeName } from '../data/types';
import type { Stage, Take } from '../data/move-fx';
import { $ } from './dom';
import { sleep } from './common';
import { animate, anchor, ring, sparks, flashAt, shape, pulse, streaks } from './effects';
import { sfx } from '../audio';
import { INK, type Cast, type P, lerp, mid, tr, gone, size, body, beyond, curve, along, piece, pieceIn, layer, beam, trace, fade, wide, bit } from './spell-kit';

/* The scenes of the moves (data/move-fx.ts): what happens, whatever the move is made of. A scene takes its colour and its
   pieces from the type (water is drops, the others their shapes), and resolves on the impact, so the damage number and
   the HP bar land on it; it can go on after that (a wave runs off the arena, quills burst). A scene of its own draws its
   impact too (`impact`); the five gestures every type can make end with their type's hit (HIT in ui/spells.ts).
   Only drawing, and never Math.random. */

export interface Ctx {
  from: number; to: number;
  /** where it lands: the body of the one hit, or past it for a miss */
  end: P;
  /** the body of the one hit */
  b: P;
  c: Cast; t: TypeName; mc: string;
  /** how grand: 1 for a small move, up to about 1.8 */
  k: number;
  /** how many (bites, dolphins, quills, tentacles) */
  n: number;
  miss: boolean;
}
export interface StageDef {
  run(x: Ctx): Promise<void>;
  /** how the one hit takes it */
  foe: Take;
  /** a quick blow: no dark and no magic circle before it, only the name */
  quick?: boolean;
  n?: number;
  /** the scene draws its own impact: no type's hit after it */
  impact?: boolean;
}
const mv = (i: number) => $('m-' + i);
/** which way the move goes on the screen: 1 to the right */
const way = (x: Ctx) => (x.b[0] >= body(x.from, 0.5, 0.5)[0] ? 1 : -1);
/** the one hit takes the colour of the magic for a moment, as after every type's hit */
const TINT: Record<TypeName, string> = { Calma: 'chill', Caos: 'zapped', Cervello: 'dazed', Chiacchiera: 'dazed', Cuore: 'smitten', Corrente: 'soaked', Calore: 'scorched', Cielo: 'gusted', Corazza: 'stoned', Crepuscolo: 'shadowed' };
function tint(x: Ctx) { const m = mv(x.to); if (m && !x.miss) pulse(m, TINT[x.t], 760); }
/** bits of the move flung out from a point */
function burst(x: Ctx, p: P, n: number, spread: number, ms: number) {
  sparks(p[0], p[1], n, function (q) { return bit(x.t, q % 3 ? x.mc : '#ffffff', 16 + (q % 3) * 6); }, spread * x.k, ms);
}

/* ---------- the gestures every type can make ---------- */
/** a cut across the foe: the caster dashes in, two strokes of the move's colour cross, the type's shape bursts at the middle */
function slash(x: Ctx): Promise<void> {
  const a = body(x.from, 0.5, 0.5), m = mv(x.from), end = x.end, k = x.k;
  sfx('lunge');
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + ((end[0] - a[0]) * 0.3).toFixed(0) + 'px,' + ((end[1] - a[1]) * 0.3).toFixed(0) + 'px) scale(1.06)', offset: 0.45 }, { transform: 'none' }], { duration: 440, easing: 'ease-in-out' });
  return sleep(240).then(function () {
    if (x.miss) return;
    const r = 62 * k, px = end[0], py = end[1];
    const L = layer(beam('M' + (px + r).toFixed(1) + ' ' + (py - r).toFixed(1) + ' L' + (px - r).toFixed(1) + ' ' + (py + r).toFixed(1), x.mc, 9 * k) + beam('M' + (px - r).toFixed(1) + ' ' + (py - r * 0.8).toFixed(1) + ' L' + (px + r).toFixed(1) + ' ' + (py + r * 0.8).toFixed(1), x.mc, 9 * k));
    trace(L, 150).then(function () { fade(L, 280, 60); });
    const s = piece(shape(x.t, '#ffffff', Math.round(44 * k)), 'sp-star');
    animate(s, [{ transform: tr(end) + ' scale(.3) rotate(-25deg)', opacity: 1 }, { transform: tr(end) + ' scale(1.5) rotate(25deg)', opacity: 0 }], { duration: 380, delay: 90, easing: 'ease-out', fill: 'both' }).then(gone(s));
  });
}
/** a rain from above: the type's shapes fall on the foe one after another */
function rain(x: Ctx): Promise<void> {
  const n = 7, end = x.end, k = x.k;
  sfx('whoosh');
  for (let q = 0; q < n; q++) {
    const x0 = end[0] + (q - 3) * 40 * k + 120 * k, x1 = end[0] + (q - 3) * 24 * k, el = piece(shape(x.t, q % 2 ? '#ffffff' : x.mc, Math.round(28 * k)), 'sp-star');
    animate(el, [{ transform: tr([x0, -30]) + ' scale(.6) rotate(0deg)', opacity: 0 }, { transform: tr([lerp(x0, x1, 0.3), lerp(-30, end[1], 0.3)]) + ' scale(1) rotate(120deg)', opacity: 1, offset: 0.3 },
      { transform: tr([x1, end[1]]) + ' scale(1.1) rotate(300deg)', opacity: 1 }], { duration: 340, delay: q * 55, easing: 'ease-in', fill: 'both' }).then(function () {
      el.remove(); if (!x.miss) flashAt(x1, end[1], x.mc, 110 * k, 200);
    });
  }
  return sleep(340 + (n - 1) * 55);
}
/** a ring that turns around the caster and then closes in on the foe */
function orbit(x: Ctx): Promise<void> {
  const f = body(x.from, 0.5, 0.4), n = 7, els: HTMLElement[] = [], k = x.k;
  const pos = (s: number, q: number): P => { const a = s / n * Math.PI * 2 + q * Math.PI * 2 * 1.4; return [f[0] + Math.cos(a) * 70 * k, f[1] + Math.sin(a) * 34 * k]; };
  for (let s = 0; s < n; s++) {
    const el = piece(shape(x.t, s % 2 ? '#ffffff' : x.mc, Math.round(26 * k)), 'sp-star'), fr: Keyframe[] = [];
    for (let q = 0; q <= 10; q++) fr.push({ transform: tr(pos(s, q / 10)) + ' scale(' + lerp(0.4, 1, q / 10).toFixed(2) + ')', opacity: Math.min(1, q / 3) });
    animate(el, fr, { duration: 480, easing: 'linear', fill: 'both' });
    els.push(el);
  }
  sfx('shimmer');
  return sleep(480).then(function () {
    els.forEach(function (el, s) {
      animate(el, along(curve(pos(s, 1), x.end, 60 * k + s * 6).at, 8, function (u) { return 'scale(' + lerp(1, 1.2, u).toFixed(2) + ') rotate(' + (u * 260).toFixed(0) + 'deg)'; }, function (u) { return x.miss && u > 0.9 ? 0 : 1; }),
        { duration: 340, delay: s * 28, easing: 'ease-in', fill: 'both' }).then(gone(el));
    });
    return sleep(340 + n * 28);
  });
}
/** a ray from the caster to the foe, drawn in one stroke, with the type's shape flashing where it lands */
function ray(x: Ctx): Promise<void> {
  const f = body(x.from, 0.5, 0.45), cv = curve(f, x.end, 40 * x.k), L = layer(beam(cv.d, x.mc, 12 * x.k));
  sfx('magic');
  return trace(L, 260).then(function () {
    if (!x.miss) {
      const s = piece(shape(x.t, '#ffffff', Math.round(54 * x.k)), 'sp-star');
      animate(s, [{ transform: tr(x.end) + ' scale(.4)', opacity: 1 }, { transform: tr(x.end) + ' scale(1.6)', opacity: 0 }], { duration: 320, easing: 'ease-out', fill: 'both' }).then(gone(s));
    }
    fade(L, 300, 60);
  });
}
/** a lob: one big shape thrown high over the arena, turning as it goes */
function lob(x: Ctx): Promise<void> {
  const f = body(x.from, 0.5, 0.4), cv = curve(f, x.end, 150 * x.k), el = piece(shape(x.t, x.mc, Math.round(46 * x.k)), 'sp-star');
  sfx('whoosh');
  return animate(el, along(cv.at, 12, function (s) { return 'scale(' + lerp(0.7, 1.25, Math.sin(s * Math.PI)).toFixed(2) + ') rotate(' + (s * 540).toFixed(0) + 'deg)'; }, function (s) { return x.miss && s > 0.94 ? 0 : 1; }),
    { duration: 560, easing: 'ease-in', fill: 'both' }).then(gone(el)) as Promise<void>;
}

/* ---------- the scenes of their own ---------- */
/** a wall of the move rises behind the caster and crosses the whole arena, with the caster riding its crest (Surf) */
function wallSvg(mc: string): string {
  const ns = ' vector-effect="non-scaling-stroke"';
  return '<svg viewBox="0 0 100 200" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true" stroke-linejoin="round">' +
    '<path d="M0 200L0 112C10 84 30 58 56 42C72 32 90 28 98 40C102 50 94 60 86 54C80 50 84 42 90 44C84 76 82 130 92 200Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="4"' + ns + '/>' +
    '<path d="M8 200L8 124C22 96 40 74 62 62C70 56 78 54 84 58C80 92 78 140 84 200Z" fill="#ffffff" opacity=".2"/>' +
    '<path d="M4 150C20 140 34 146 50 138M10 176C26 168 42 174 60 166" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".45"' + ns + '/>' +
    '<path d="M30 120C38 92 52 66 70 50" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" opacity=".7"' + ns + '/>' +
    '<path d="M60 42C72 30 88 28 96 40" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round"' + ns + '/></svg>';
}
function tide(x: Ctx): Promise<void> {
  const z = size(), room = wide(), d = way(x), k = x.k, H = z.h * 1.08, W = Math.min(z.w * 0.5, H * 0.8);
  const a = body(x.from, 0.5, 0.5), g = anchor(x.from, 0.5, 0.92), y = z.h + 4 - H / 2;
  const x0 = d > 0 ? -W * 0.55 : z.w + W * 0.55, x1 = d > 0 ? z.w + W * 0.75 : -W * 0.75, D = 1200;
  /* the time the crest (a little behind the front) reaches a point */
  const when = function (px: number) { return Math.max(0, Math.min(1, (px - d * W * 0.2 - x0) / (x1 - x0))) * D; };
  /* the sea rises at the caster's feet first */
  for (let q = 0; q < 3; q++) sleep(q * 110).then(function () { ring(g[0], g[1], q % 2 ? '#ffffff' : x.mc, 220 * k, 640, true); });
  sparks(g[0], g[1] - 10, 8, function (q) { return bit(x.t, q % 3 ? x.mc : '#ffffff', 14 + (q % 3) * 4); }, 90 * k, 600);
  const flip = d < 0 ? ' scaleX(-1)' : '', fr: Keyframe[] = [];
  for (let q = 0; q <= 12; q++) { const t = q / 12; fr.push({ transform: tr([lerp(x0, x1, t), y + Math.sin(t * Math.PI * 3) * 6]) + flip, opacity: t < 0.06 ? t / 0.06 : t > 0.92 ? (1 - t) / 0.08 : 1 }); }
  sleep(260).then(function () {
    sfx('whoosh');
    const wall = pieceIn(room.host, wallSvg(x.mc), 'sp-tide');
    wall.style.width = W.toFixed(0) + 'px'; wall.style.height = H.toFixed(0) + 'px';
    animate(wall, fr, { duration: D, easing: 'linear', fill: 'both' }).then(function () { wall.remove(); room.done(); });
    /* spray off the front as it runs */
    for (let q = 1; q <= 10; q++) sleep(q * D / 11).then(function () { const px = lerp(x0, x1, q / 11) + d * W * 0.45; if (px > -20 && px < z.w + 20) burst(x, [px, z.h * 0.42 + (q % 3) * 40], 3, 60, 520); });
    /* the caster is lifted by it and rides the crest for a while */
    const m = mv(x.from), t0 = when(a[0]) / D, t1 = Math.min(0.95, when(x.b[0]) / D);
    if (m) animate(m, [{ transform: 'none', offset: 0 }, { transform: 'none', offset: Math.max(0.01, t0 - 0.06) }, { transform: 'translate(0,' + (-0.32 * H).toFixed(0) + 'px) rotate(' + d * 6 + 'deg)', offset: Math.min(t1 - 0.02, t0 + 0.12) },
      { transform: 'translate(' + (d * Math.abs(x.b[0] - a[0]) * 0.35).toFixed(0) + 'px,' + (-0.36 * H).toFixed(0) + 'px) rotate(' + d * 10 + 'deg)', offset: t1 }, { transform: 'none' }], { duration: D, easing: 'ease-in-out' });
  });
  return sleep(260 + when(x.end[0])).then(function () {
    if (x.miss) return;
    /* it crashes on the one hit: spray up, foam on the ground */
    const f = anchor(x.to, 0.5, 0.92);
    burst(x, x.b, 16, 190, 1000);
    ring(f[0], f[1], '#ffffff', 300 * k, 700, true); ring(x.b[0], x.b[1], x.mc, 260 * k, 600);
    flashAt(x.b[0], x.b[1], '#e6fffb', 380 * k, 360);
    tint(x);
  });
}
/** a jaw of the move's colour, teeth down (the lower one is the same, upside down) */
function jawSvg(mc: string): string {
  let teeth = '';
  for (let q = 0; q < 7; q++) { const tx = 10 + q * 15.4; teeth += '<path d="M' + tx.toFixed(1) + ' 22L' + (tx + 7).toFixed(1) + ' ' + (q % 2 ? 40 : 46) + 'L' + (tx + 14).toFixed(1) + ' 22Z" fill="#ffffff" stroke="' + INK + '" stroke-width="2.5"/>'; }
  return '<svg viewBox="0 0 124 50" aria-hidden="true" stroke-linejoin="round">' + teeth +
    '<path d="M2 14Q62 -8 122 14L122 26Q62 10 2 26Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="4"/><path d="M16 12Q62 -2 108 12" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".7"/></svg>';
}
/** two jaws close on the one hit, n times, quick (a bite: no charge) */
function jaws(x: Ctx): Promise<void> {
  const k = x.k, w = 150 * k, p = x.end, open = 78 * k, shut = 16 * k, step = 300, lead = 120, T = lead + x.n * step + 260;
  const a = body(x.from, 0.5, 0.5), m = mv(x.from);
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + ((p[0] - a[0]) * 0.18).toFixed(0) + 'px,' + ((p[1] - a[1]) * 0.18).toFixed(0) + 'px) scale(1.05)', offset: 0.3 }, { transform: 'none' }], { duration: 520, easing: 'ease-out' });
  const jaw = function (up: boolean) {
    const el = piece(jawSvg(x.mc), 'sp-jaw', w), s = up ? '' : ' scaleY(-1)', at = function (gap: number) { return tr([p[0], p[1] + (up ? -gap : gap)]) + s; };
    el.style.setProperty('--mc', x.mc);
    el.style.height = (w * 50 / 124).toFixed(0) + 'px';
    const fr: Keyframe[] = [{ transform: at(open * 1.3), opacity: 0, offset: 0 }, { transform: at(open), opacity: 1, offset: lead / T }];
    for (let q = 0; q < x.n; q++) {
      fr.push({ transform: at(x.miss ? shut * 0.4 : shut), opacity: 1, offset: (lead + q * step + 130) / T });
      fr.push({ transform: at(q === x.n - 1 ? open * 0.7 : open), opacity: 1, offset: (lead + q * step + 250) / T });
    }
    fr.push({ transform: at(open * 1.1), opacity: 0, offset: 1 });
    animate(el, fr, { duration: T, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  };
  jaw(true); jaw(false);
  for (let q = 0; q < x.n; q++) sleep(lead + q * step + 120).then(function () {
    sfx('lunge');
    if (!x.miss) { flashAt(p[0], p[1], '#ffffff', 170 * k, 220); burst(x, p, 4, 70, 420); }
  });
  return sleep(lead + (x.n - 1) * step + 130).then(function () {
    if (x.miss) return;
    sparks(p[0], p[1], 8, function (q) { return shape(x.t, q % 2 ? '#ffffff' : x.mc, 20); }, 130 * k, 640);
    tint(x);
  });
}
/** a claw of the move's colour, open, pointing right */
function clawSvg(mc: string): string {
  return '<svg viewBox="0 0 130 90" aria-hidden="true" stroke-linejoin="round">' +
    '<path d="M10 40Q28 4 80 3Q114 3 128 18Q106 18 86 24Q58 32 34 46Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="4"/>' +
    '<path d="M10 50Q34 86 84 87Q112 87 124 73Q102 72 82 66Q56 58 34 46Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="4"/>' +
    '<path d="M98 22L104 30L110 20M90 70L96 62L102 72" fill="#ffffff" stroke="' + INK + '" stroke-width="2"/>' +
    '<path d="M30 20Q56 8 92 10" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" opacity=".75"/>' +
    '<circle cx="16" cy="45" r="16" fill="' + mc + '" stroke="' + INK + '" stroke-width="4"/><circle cx="12" cy="40" r="5" fill="#ffffff" opacity=".6"/></svg>';
}
/** two claws come in from the sides and squeeze the one hit between them */
function clamp(x: Ctx): Promise<void> {
  const k = x.k, w = 160 * k, p = x.end, far = 260 * k, near = 104 * k, tight = 74 * k, T = 1200;
  sfx('whoosh');
  [-1, 1].forEach(function (side) {
    const el = piece(clawSvg(x.mc), 'sp-claw', w), s = side > 0 ? ' scaleX(-1)' : '', at = function (dx: number, sy: number) { return tr([p[0] + side * dx, p[1]]) + s + ' scaleY(' + sy + ')'; };
    el.style.setProperty('--mc', x.mc);
    el.style.height = (w * 90 / 130).toFixed(0) + 'px';
    animate(el, [{ transform: at(far, 1.1), opacity: 0 }, { transform: at(near, 1.2), opacity: 1, offset: 0.3 }, { transform: at(x.miss ? near * 0.8 : tight, 0.62), opacity: 1, offset: 0.38 },
      { transform: at(tight + 5, 0.68), opacity: 1, offset: 0.5 }, { transform: at(tight, 0.6), opacity: 1, offset: 0.6 }, { transform: at(near, 1.15), opacity: 1, offset: 0.78 }, { transform: at(far * 0.8, 1), opacity: 0 }],
      { duration: T, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  });
  return sleep(T * 0.38).then(function () {
    sfx('shake');
    if (x.miss) return;
    [-1, 1].forEach(function (side) { const q: P = [p[0] + side * 30 * k, p[1]]; flashAt(q[0], q[1], '#ffffff', 140 * k, 260); burst(x, q, 5, 80, 520); });
    ring(p[0], p[1], x.mc, 220 * k, 520);
    tint(x);
  });
}
/** tentacles of the move's colour out of the ground round the one hit: they wrap it and squeeze */
function grasp(x: Ctx): Promise<void> {
  const k = x.k, p = x.end, gy = anchor(x.to, 0.5, 0.96)[1], n = x.n, layers: HTMLElement[] = [];
  ring(p[0], gy, x.mc, 260 * k, 700, true);
  sparks(p[0], gy, 8, function () { return '<i class="sp-dust"></i>'; }, 110 * k, 560);
  sfx('rustle');
  for (let j = 0; j < n; j++) {
    const side = j % 2 ? 1 : -1, sp = j - (n - 1) / 2, gx = p[0] + sp * 52 * k, ex = p[0] + side * (22 + j * 4) * k, ey = p[1] - (12 + j * 10) * k;
    const c1: P = [gx + side * 40 * k, gy - 70 * k], c2: P = [p[0] + side * 96 * k, p[1] - 30 * k];
    const at = function (t: number): P { const u = 1 - t; return [u * u * u * gx + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * ex, u * u * u * gy + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * ey]; };
    const dd = 'M' + gx.toFixed(1) + ' ' + gy.toFixed(1) + ' C' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
    let cups = '';
    [0.35, 0.55, 0.72, 0.86].forEach(function (t, q) { const c = at(t); cups += '<circle cx="' + c[0].toFixed(1) + '" cy="' + c[1].toFixed(1) + '" r="' + ((4.6 - q * 0.6) * k).toFixed(1) + '" fill="#ffffff" stroke="' + INK + '" stroke-width="1.6" class="sp-cup"/>'; });
    sleep(j * 70).then(function () {
      const L = layer('<path d="' + dd + '" pathLength="1" stroke="' + INK + '" stroke-width="' + (21 * k).toFixed(1) + '"/><path d="' + dd + '" pathLength="1" stroke="' + x.mc + '" stroke-width="' + (15 * k).toFixed(1) + '"/>' +
        '<path d="' + dd + '" pathLength="1" stroke="#ffffff" stroke-width="' + (3.4 * k).toFixed(1) + '" opacity=".55"/>' + cups);
      L.style.transformOrigin = p[0].toFixed(0) + 'px ' + p[1].toFixed(0) + 'px';
      L.querySelectorAll('.sp-cup').forEach(function (c0) { (c0 as SVGElement).style.opacity = '0'; });
      layers.push(L);
      trace(L, 380).then(function () { L.querySelectorAll('.sp-cup').forEach(function (c0) { animate(c0, [{ opacity: 0 }, { opacity: 1 }], { duration: 120, fill: 'both' }); }); });
    });
  }
  const at = 380 + (n - 1) * 70;
  sleep(at).then(function () {
    layers.forEach(function (L) {
      animate(L, [{ transform: 'scale(1)' }, { transform: 'scale(.9)', offset: 0.2 }, { transform: 'scale(.97)', offset: 0.45 }, { transform: 'scale(.9)', offset: 0.65 }, { transform: 'scale(1)' }], { duration: 640, easing: 'ease-in-out' })
        .then(function () { fade(L, 260); });
    });
  });
  return sleep(at + 120).then(function () {
    sfx('shake');
    if (x.miss) return;
    flashAt(p[0], p[1], x.mc, 260 * k, 360);
    tint(x);
  });
}
/** a dolphin of the move's colour, leaping to the right */
function dolphinSvg(mc: string): string {
  return '<svg viewBox="0 0 100 50" aria-hidden="true" stroke-linejoin="round">' +
    '<path d="M48 15L56 2L64 17Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="3"/><path d="M12 30L1 17L7 30L0 43Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="3"/>' +
    '<path d="M6 30Q30 6 70 13Q90 17 99 26Q90 31 77 31Q60 41 32 39Q18 38 6 30Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="3.5"/>' +
    '<path d="M24 34Q48 40 74 31" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/><circle cx="83" cy="22" r="3" fill="' + INK + '"/></svg>';
}
/** rings of sound from the caster, then dolphins leap over the one hit, one after another, and dive past it */
function pod(x: Ctx): Promise<void> {
  const k = x.k, f = body(x.from, x.from === 0 ? 0.7 : 0.3, 0.4), d = way(x), p = x.end, gy = anchor(x.to, 0.5, 0.95)[1] + 30 * k, w = 92 * k, dur = 640, lag = 170, lead = 380;
  sfx('notes');
  for (let q = 0; q < 3; q++) sleep(q * 110).then(function () { ring(f[0], f[1], q % 2 ? '#ffffff' : x.mc, (200 + q * 50) * k, 560); });
  for (let j = 0; j < x.n; j++) {
    const off = (j - (x.n - 1) / 2) * 28 * k, a0: P = [p[0] - d * 150 * k + off, gy], a1: P = [p[0] + d * 150 * k + off, gy], peak = p[1] - (90 + (j % 2) * 26) * k;
    const cv = function (t: number): P { const u = 1 - t, cy = 2 * peak - (a0[1] + a1[1]) / 2; return [lerp(a0[0], a1[0], t), u * u * a0[1] + 2 * u * t * cy + t * t * a1[1]]; };
    const turn = function (t: number) { const q0 = cv(Math.max(0, t - 0.02)), q1 = cv(Math.min(1, t + 0.02)), ang = Math.atan2(q1[1] - q0[1], (q1[0] - q0[0]) * d) * 180 / Math.PI; return 'rotate(' + (d * ang).toFixed(0) + 'deg)' + (d < 0 ? ' scaleX(-1)' : ''); };
    sleep(lead + j * lag).then(function () {
      const el = piece(dolphinSvg(x.mc), 'sp-dolphin', w);
      el.style.height = (w / 2).toFixed(0) + 'px';
      burst(x, a0, 4, 50, 500);
      animate(el, along(cv, 14, turn, function (t) { return t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1; }), { duration: dur, easing: 'linear', fill: 'both' }).then(function () { el.remove(); burst(x, a1, 5, 60, 520); });
    });
  }
  return sleep(lead + Math.floor(x.n / 2) * lag + dur * 0.5).then(function () {
    if (x.miss) return;
    ring(x.b[0], x.b[1], x.mc, 260 * k, 560); ring(x.b[0], x.b[1], '#ffffff', 200 * k, 480);
    burst(x, x.b, 10, 130, 800);
    tint(x);
  });
}
/** a quill of the move's colour, pointing right */
function quillSvg(mc: string): string {
  return '<svg viewBox="0 0 64 14" aria-hidden="true" stroke-linejoin="round"><path d="M0 7L42 1L64 7L42 13Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="2.6"/><path d="M8 7L54 6" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/></svg>';
}
/** the quills rise in a fan round the caster, fly, stick in the one hit and burst */
function volley(x: Ctx): Promise<void> {
  const k = x.k, f = body(x.from, 0.5, 0.42), n = x.n, w = 84 * k, base = Math.atan2(x.end[1] - f[1], x.end[0] - f[0]), fly = 260, lag = 45, lead = 320;
  const ang = function (a: number) { return 'rotate(' + (a * 180 / Math.PI).toFixed(0) + 'deg)'; };
  sfx('shimmer');
  for (let j = 0; j < n; j++) {
    const s0 = (j / (n - 1) - 0.5), fan = base + s0 * 1.6, f1: P = [f[0] + Math.cos(fan) * 58 * k, f[1] + Math.sin(fan) * 58 * k];
    const hit: P = [x.end[0] + Math.cos(base + Math.PI / 2) * s0 * 90 * k - Math.cos(base) * 10 * k, x.end[1] + Math.sin(base + Math.PI / 2) * s0 * 90 * k + (j % 2 ? 8 : -8) * k];
    const goal = x.miss ? beyond(f1, hit) : hit, aim = Math.atan2(goal[1] - f1[1], goal[0] - f1[0]);
    const el = piece(quillSvg(x.mc), 'sp-quill', w);
    el.style.height = (w * 14 / 64).toFixed(0) + 'px';
    animate(el, [{ transform: tr(f) + ' ' + ang(fan) + ' scale(.2)', opacity: 0 }, { transform: tr(f1) + ' ' + ang(fan) + ' scale(1)', opacity: 1 }], { duration: 220, delay: j * 20, easing: 'cubic-bezier(.2,.9,.3,1.3)', fill: 'both' });
    sleep(lead + j * lag).then(function () {
      animate(el, [{ transform: tr(f1) + ' ' + ang(fan), opacity: 1 }, { transform: tr(f1) + ' ' + ang(aim), opacity: 1, offset: 0.15 }, { transform: tr(goal) + ' ' + ang(aim), opacity: x.miss ? 0 : 1 }],
        { duration: fly, easing: 'ease-in', fill: 'both' }).then(function () {
        if (x.miss) { el.remove(); return; }
        /* stuck in it, quivering, then it bursts */
        animate(el, [0, 1, 2, 3, 4].map(function (q) { return { transform: tr(goal) + ' ' + ang(aim + (q % 2 ? 0.08 : -0.08) * (1 - q / 5)) }; }), { duration: 240 + (n - j) * lag, fill: 'both' }).then(function () {
          el.remove(); flashAt(goal[0], goal[1], x.mc, 90 * k, 220); burst(x, goal, 3, 40, 380);
        });
      });
    });
  }
  return sleep(lead + (n - 1) * lag + fly).then(function () { if (!x.miss) { sfx('shake'); tint(x); } });
}
/** the caster comes close, its stinging threads touch the one hit, which trembles (a touch: no charge) */
function sting(x: Ctx): Promise<void> {
  const k = x.k, a = body(x.from, 0.5, 0.55), m = mv(x.from), T = 1050, go = 0.42, near: P = mid(a, x.end, go);
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + (near[0] - a[0]).toFixed(0) + 'px,' + (near[1] - a[1]).toFixed(0) + 'px)', offset: 0.28 },
    { transform: 'translate(' + (near[0] - a[0]).toFixed(0) + 'px,' + (near[1] - a[1] - 4).toFixed(0) + 'px)', offset: 0.7 }, { transform: 'none' }], { duration: T, easing: 'ease-in-out' });
  sfx('whoosh');
  return sleep(T * 0.28).then(function () {
    let ls = '';
    for (let j = 0; j < 5; j++) {
      const s0 = j - 2, from0: P = [near[0] + s0 * 9 * k, near[1] + 26 * k], to0: P = [x.end[0] + s0 * 14 * k, x.end[1] + (Math.abs(s0) * 8 - 6) * k];
      const c1: P = [lerp(from0[0], to0[0], 0.35), from0[1] + 46 * k], c2: P = [lerp(from0[0], to0[0], 0.7), to0[1] - 26 * k * (j % 2 ? 1 : -1)];
      const dd = 'M' + from0[0].toFixed(1) + ' ' + from0[1].toFixed(1) + ' C' + c1[0].toFixed(1) + ' ' + c1[1].toFixed(1) + ' ' + c2[0].toFixed(1) + ' ' + c2[1].toFixed(1) + ' ' + to0[0].toFixed(1) + ' ' + to0[1].toFixed(1);
      ls += '<path d="' + dd + '" pathLength="1" stroke="' + x.mc + '" stroke-width="' + (14 * k).toFixed(1) + '" opacity=".25"/><path d="' + dd + '" pathLength="1" stroke="' + INK + '" stroke-width="' + (8 * k).toFixed(1) + '" opacity=".6"/>' +
        '<path d="' + dd + '" pathLength="1" stroke="' + x.mc + '" stroke-width="' + (5 * k).toFixed(1) + '"/><path d="' + dd + '" pathLength="1" stroke="#ffffff" stroke-width="' + (1.6 * k).toFixed(1) + '"/>';
    }
    const L = layer(ls);
    return trace(L, 170).then(function () {
      sleep(T * 0.22).then(function () { fade(L, 200); });
      if (x.miss) return;
      /* the sting: little sparks all over the one hit, three times */
      for (let q = 0; q < 3; q++) sleep(q * 110).then(function () {
        const s: P = [x.b[0] + (q - 1) * 26 * k, x.b[1] + (q % 2 ? -18 : 14) * k];
        flashAt(s[0], s[1], x.mc, 110 * k, 200);
        sparks(s[0], s[1], 4, function (r) { return shape(x.t, r % 2 ? '#ffffff' : x.mc, 14); }, 50 * k, 360);
      });
      sfx('shake');
      tint(x);
    });
  });
}
/** a jet from the caster's mouth straight into the one hit, flowing, that pushes it back (Hydro Pump) */
function jet(x: Ctx): Promise<void> {
  const k = x.k, f = body(x.from, x.from === 0 ? 0.68 : 0.32, 0.38), e = x.end, dd = 'M' + f[0].toFixed(1) + ' ' + f[1].toFixed(1) + ' L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1), hold = 520;
  sfx('whoosh');
  const L = layer('<path d="' + dd + '" pathLength="1" stroke="' + x.mc + '" stroke-width="' + (34 * k).toFixed(1) + '" opacity=".25"/>' + beam(dd, x.mc, 17 * k));
  /* what it is made of runs along it */
  for (let q = 0; q < 9; q++) sleep(q * 60).then(function () {
    const el = piece(bit(x.t, q % 2 ? '#ffffff' : x.mc, Math.round(18 * k)), 'sp-star');
    animate(el, [{ transform: tr(f) + ' scale(.6)', opacity: 0.9 }, { transform: tr(e) + ' scale(1.1)', opacity: x.miss ? 0 : 1 }], { duration: 200, easing: 'linear', fill: 'both' }).then(gone(el));
  });
  return trace(L, 150).then(function () {
    animate(L, [{ opacity: 1 }, { opacity: 0.75 }, { opacity: 1 }, { opacity: 0.8 }, { opacity: 1 }], { duration: hold, fill: 'both' }).then(function () { fade(L, 240); });
    if (x.miss) return;
    /* it breaks on the one hit for as long as it runs */
    for (let q = 0; q < 5; q++) sleep(q * 100).then(function () { burst(x, e, 4, 70, 460); });
    flashAt(e[0], e[1], '#ffffff', 220 * k, 300);
    ring(e[0], e[1], x.mc, 200 * k, 480);
    tint(x);
  });
}
/** a starburst, for a blow that lands */
function boom(mc: string): string {
  let d0 = '';
  for (let q = 0; q < 14; q++) { const a = q / 14 * Math.PI * 2, r = q % 2 ? 40 : 96; d0 += (q ? ' L' : 'M') + (100 + Math.cos(a) * r).toFixed(1) + ' ' + (100 + Math.sin(a) * r).toFixed(1); }
  return '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="' + d0 + 'Z" fill="#ffffff" stroke="' + INK + '" stroke-width="6" stroke-linejoin="round"/><path d="' + d0 + 'Z" fill="' + mc + '" transform="translate(100 100) scale(.55) translate(-100 -100)"/></svg>';
}
/** the caster runs at the one hit itself and bounces off (a charge: no circle, it just goes) */
function ram(x: Ctx): Promise<void> {
  const k = x.k, a = body(x.from, 0.5, 0.5), m = mv(x.from), d = way(x), T = 780, hit = 0.52, g = anchor(x.from, 0.5, 0.92);
  const dx = (x.end[0] - a[0]) * (x.miss ? 0.95 : 0.7), dy = (x.end[1] - a[1]) * (x.miss ? 0.95 : 0.7);
  sfx('lunge');
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + -d * 16 + 'px,4px) scale(1.04,.94)', offset: 0.22 },
    { transform: 'translate(' + dx.toFixed(0) + 'px,' + dy.toFixed(0) + 'px) scale(1.08)', offset: hit }, { transform: 'translate(' + (dx * 0.6).toFixed(0) + 'px,' + (dy * 0.6 - 18).toFixed(0) + 'px)', offset: 0.7 }, { transform: 'none' }],
  { duration: T, easing: 'ease-in-out' });
  sleep(T * 0.22).then(function () { streaks(x.from); sparks(g[0], g[1], 6, function () { return '<i class="sp-dust"></i>'; }, 60, 480); });
  return sleep(T * hit).then(function () {
    if (x.miss) return;
    const c: P = [x.b[0] - d * 26 * k, x.b[1]], s = piece(boom(x.mc), 'sp-burst', 150 * k);
    animate(s, [{ transform: tr(c) + ' scale(.2) rotate(-20deg)', opacity: 1 }, { transform: tr(c) + ' scale(1) rotate(10deg)', opacity: 1, offset: 0.35 }, { transform: tr(c) + ' scale(1.3) rotate(20deg)', opacity: 0 }], { duration: 460, easing: 'ease-out', fill: 'both' }).then(gone(s));
    flashAt(c[0], c[1], '#ffffff', 240 * k, 260);
    burst(x, c, 8, 120, 640);
    tint(x);
  });
}
/** the caster flies up off the screen and falls on the one hit from above, its shadow growing first (a dive: no circle) */
function dive(x: Ctx): Promise<void> {
  const k = x.k, a = body(x.from, 0.5, 0.5), m = mv(x.from), T = 1150, hit = 0.7, up = a[1] + 240, dx = x.end[0] - a[0], dy = x.end[1] - a[1] - 16 * k, g = anchor(x.to, 0.5, 0.94);
  sfx('plane');
  if (m) animate(m, [{ transform: 'none', opacity: 1 }, { transform: 'translate(0,' + (-up).toFixed(0) + 'px) scale(.85)', opacity: 1, offset: 0.26 }, { transform: 'translate(' + dx.toFixed(0) + 'px,' + (-up).toFixed(0) + 'px) scale(.85)', opacity: 0, offset: 0.27 },
    { transform: 'translate(' + dx.toFixed(0) + 'px,' + (-up).toFixed(0) + 'px) scale(1.1)', opacity: 1, offset: 0.52 }, { transform: 'translate(' + dx.toFixed(0) + 'px,' + dy.toFixed(0) + 'px) scale(1.1,.9)', opacity: 1, offset: hit },
    { transform: 'translate(' + (dx * 0.9).toFixed(0) + 'px,' + (dy - 50).toFixed(0) + 'px)', opacity: 1, offset: 0.8 }, { transform: 'translate(' + (dx * 0.9).toFixed(0) + 'px,' + (dy - 60).toFixed(0) + 'px)', opacity: 0, offset: 0.86 },
    { transform: 'none', opacity: 0, offset: 0.87 }, { transform: 'none', opacity: 1 }], { duration: T, easing: 'ease-in' });
  /* the shadow on the ground, where it will fall */
  const sh = piece('', 'sp-shadow', 120 * k);
  animate(sh, [{ transform: tr(g) + ' scaleY(.3) scale(.1)', opacity: 0 }, { transform: tr(g) + ' scaleY(.3) scale(.4)', opacity: 0.5, offset: 0.4 }, { transform: tr(g) + ' scaleY(.3) scale(1)', opacity: 0.8, offset: hit }, { transform: tr(g) + ' scaleY(.3) scale(1.2)', opacity: 0 }],
    { duration: T, fill: 'both' }).then(gone(sh));
  sleep(T * 0.5).then(function () { sfx('whoosh'); });
  return sleep(T * hit).then(function () {
    if (x.miss) { sparks(g[0], g[1], 8, function () { return '<i class="sp-dust"></i>'; }, 90 * k, 500); return; }
    ring(g[0], g[1], '#ffffff', 320 * k, 620, true); ring(g[0], g[1], x.mc, 260 * k, 560, true);
    sparks(g[0], g[1], 10, function () { return '<i class="sp-dust"></i>'; }, 130 * k, 600);
    flashAt(x.b[0], x.b[1], '#ffffff', 260 * k, 280);
    burst(x, x.b, 8, 140, 760);
    tint(x);
  });
}
/** a column of the move falls from the top of the arena on the one hit, and breaks on it (Waterfall) */
function fall(x: Ctx): Promise<void> {
  const k = x.k, p = x.end, w = 140 * k, top = -30, bottom = p[1] + 34 * k, h = bottom - top, grow = 280, hold = 480;
  /* it gathers up there first */
  flashAt(p[0], 0, x.mc, 260 * k, 360);
  sfx('whoosh');
  const col = piece('', 'sp-column');
  col.style.setProperty('--mc', x.mc);
  col.style.width = w.toFixed(0) + 'px'; col.style.height = h.toFixed(0) + 'px';
  const at = 'translate(' + (p[0] - w / 2).toFixed(1) + 'px,' + top + 'px)';
  animate(col, [{ transform: at + ' scaleY(0)', opacity: 0.9 }, { transform: at + ' scaleY(1)', opacity: 1, offset: grow / (grow + hold + 300) }, { transform: at + ' scaleY(1) scaleX(1.06)', opacity: 1, offset: (grow + hold) / (grow + hold + 300) }, { transform: at + ' scaleY(1) scaleX(.1)', opacity: 0 }],
    { duration: grow + hold + 300, delay: 160, easing: 'ease-in', fill: 'both' }).then(gone(col));
  /* what it is made of pours down inside it */
  for (let q = 0; q < 10; q++) sleep(160 + q * 55).then(function () {
    const px = p[0] + ((q * 37) % 7 - 3) * w * 0.1, el = piece(bit(x.t, q % 2 ? '#ffffff' : x.mc, Math.round(20 * k)), 'sp-star');
    animate(el, [{ transform: tr([px, top]) + ' scale(.8)', opacity: 1 }, { transform: tr([px, bottom - 10]) + ' scale(1.1)', opacity: 0.2 }], { duration: 260, easing: 'ease-in', fill: 'both' }).then(gone(el));
  });
  return sleep(160 + grow).then(function () {
    if (x.miss) return;
    const g = anchor(x.to, 0.5, 0.94);
    for (let q = 0; q < 4; q++) sleep(q * 110).then(function () { burst(x, [p[0], bottom - 20 * k], 5, 110, 560); });
    ring(g[0], g[1], x.mc, 300 * k, 640, true); ring(g[0], g[1], '#ffffff', 240 * k, 560, true);
    flashAt(p[0], p[1], '#ffffff', 280 * k, 320);
    tint(x);
  });
}

export const STAGES: Record<Stage, StageDef> = {
  slash: { run: slash, foe: 'recoil' }, rain: { run: rain, foe: 'sink' }, orbit: { run: orbit, foe: 'spin' }, beam: { run: ray, foe: 'recoil' }, lob: { run: lob, foe: 'squash' },
  tide: { run: tide, foe: 'lift', impact: true },
  jaws: { run: jaws, foe: 'recoil', quick: true, n: 2, impact: true },
  clamp: { run: clamp, foe: 'squash', impact: true },
  grasp: { run: grasp, foe: 'lift', n: 4, impact: true },
  pod: { run: pod, foe: 'spin', n: 3, impact: true },
  volley: { run: volley, foe: 'shake', n: 7, impact: true },
  sting: { run: sting, foe: 'shake', quick: true, impact: true },
  jet: { run: jet, foe: 'recoil', impact: true },
  ram: { run: ram, foe: 'recoil', quick: true, impact: true },
  dive: { run: dive, foe: 'squash', quick: true, impact: true },
  fall: { run: fall, foe: 'sink', impact: true }
};
