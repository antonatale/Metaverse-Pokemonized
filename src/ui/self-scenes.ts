import type { TypeName } from '../data/types';
import type { SelfStage } from '../data/move-fx';
import { sleep } from './common';
import { animate, anchor, ring, sparks, flashAt, pulse } from './effects';
import { sfx } from '../audio';
import { PROPS } from './move-props';
import { INK, type P, lerp, mid, tr, gone, body, piece, layer, beam, fade, mv, drop, stormCloud } from './spell-kit';

/* The scenes of the moves a creature casts on itself (data/move-fx.ts, SELF_FX): a shell that closes on it, walls that
   rise round it, the sun on its back, flowers, a calm sea, a veil, a light bulb, an old book, a starfish growing its arms
   back, rocks over its den, an hourglass, the door between day and night, the gates of Telepilo, roots, a drop of oil.
   Each resolves when the number goes up or the life comes back. Only drawing, and never Math.random. */

export interface SelfCtx { i: number; t: TypeName; mc: string; k: number }
const T0 = (p: P) => 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px)';
const foot = (p: P, w: number, h: number) => T0([p[0] - w / 2, p[1] - h]);
function big(html: string, cls: string, w: number, h: number, origin?: string): HTMLElement {
  const el = piece(html, 'sp-big ' + cls);
  el.style.width = w.toFixed(0) + 'px'; el.style.height = h.toFixed(0) + 'px';
  if (origin) el.style.transformOrigin = origin;
  return el;
}
/** the caster: its middle, its feet, the top of its head */
const at = (x: SelfCtx) => ({ c: body(x.i, 0.5, 0.5), f: anchor(x.i, 0.5, 0.95), top: body(x.i, 0.5, 0) });
/** the caster shines, and little lights climb it: what every scene ends with */
function shine(x: SelfCtx, col: string) {
  const a = at(x), m = mv(x.i);
  if (m) pulse(m, 'glow', 800);
  flashAt(a.c[0], a.c[1], col, 300 * x.k, 420);
  ring(a.f[0], a.f[1], col, 260 * x.k, 640, true);
  for (let q = 0; q < 6; q++) {
    const el = piece(PROPS.wish(q % 2 ? '#ffffff' : col, 16 + (q % 3) * 4), 'sp-star'), px = a.c[0] + (q - 2.5) * 22 * x.k;
    animate(el, [{ transform: tr([px, a.f[1] - 10]) + ' scale(.5)', opacity: 0 }, { transform: tr([px, lerp(a.f[1], a.top[1], 0.5)]) + ' scale(1)', opacity: 1, offset: 0.4 }, { transform: tr([px, a.top[1] - 20]) + ' scale(.6)', opacity: 0 }],
      { duration: 700, delay: q * 50, easing: 'ease-out', fill: 'both' }).then(gone(el));
  }
}

/* ---------- a shell of mother-of-pearl ---------- */
function valveSvg(mc: string): string {
  let ribs = '';
  for (let q = 1; q < 8; q++) { const a = Math.PI + q / 8 * Math.PI, x1 = 60 + Math.cos(a) * 56, y1 = 62 + Math.sin(a) * 56; ribs += '<path d="M60 62L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" stroke="' + INK + '" stroke-width="1.6" opacity=".35"/>'; }
  return '<svg viewBox="0 0 120 66" aria-hidden="true" stroke-linejoin="round"><path d="M4 62A56 56 0 0 1 116 62Z" fill="#f6eefc" stroke="' + INK + '" stroke-width="3.5"/><path d="M14 62A46 46 0 0 1 106 62Z" fill="' + mc + '" opacity=".35"/>' + ribs +
    '<path d="M22 40Q40 16 64 12" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity=".9"/><rect x="48" y="58" width="24" height="8" rx="3" fill="#f6eefc" stroke="' + INK + '" stroke-width="2.5"/></svg>';
}
/** two valves of mother-of-pearl close on the caster, shine, and open again */
function shell(x: SelfCtx): Promise<void> {
  const k = x.k, c = at(x).c, w = 190 * k, h = w * 66 / 120, D = 1300;
  sfx('door');
  /* the top valve shuts down onto the middle of the caster, the bottom one (the same, upside down) up onto it */
  [-1, 1].forEach(function (side) {
    const el = big(valveSvg(x.mc), 'sp-valve', w, h), rest = side < 0 ? c[1] - h : c[1], flip = side > 0 ? ' scaleY(-1)' : '', to = (y: number) => T0([c[0] - w / 2, y]) + flip;
    animate(el, [{ transform: to(rest + side * 120 * k), opacity: 0 }, { transform: to(rest), opacity: 1, offset: 0.3 }, { transform: to(rest) + ' scale(1.04)', opacity: 1, offset: 0.62 }, { transform: to(rest + side * 70 * k), opacity: 0 }],
      { duration: D, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  });
  return sleep(D * 0.32).then(function () {
    sfx('shimmer');
    flashAt(c[0], c[1], '#ffffff', 260 * k, 360);
    sparks(c[0], c[1], 8, function (q) { return PROPS.wish(q % 2 ? '#ffffff' : x.mc, 18); }, 110 * k, 700);
    return sleep(D * 0.3).then(function () { shine(x, x.mc); });
  });
}

/* ---------- walls ---------- */
/** blocks of the polygonal walls rise out of the ground in front of the caster, two rows, shine and sink */
function walls(x: SelfCtx): Promise<void> {
  const k = x.k, f = at(x).f, d = x.i === 0 ? 1 : -1, s = 66 * k;
  sfx('rustle');
  const spots: P[] = [];
  for (let q = 0; q < 4; q++) spots.push([f[0] + d * 60 * k + (q - 1.5) * s * 0.86, f[1] + 6]);
  for (let q = 0; q < 3; q++) spots.push([f[0] + d * 60 * k + (q - 1) * s * 0.86, f[1] + 6 - s * 0.78]);
  spots.forEach(function (p, q) {
    sleep(q * 70).then(function () {
      const el = piece(PROPS.slab(q % 3 ? '#d6cab4' : x.mc, Math.round(s)), 'sp-star sp-block'), from: P = [p[0], p[1] + 60 * k];
      animate(el, [{ transform: tr(from) + ' rotate(' + ((q * 23) % 30 - 15) + 'deg) scale(.6)', opacity: 0 }, { transform: tr([p[0], p[1] - s * 0.45]) + ' rotate(' + ((q * 17) % 10 - 5) + 'deg)', opacity: 1, offset: 0.25 },
        { transform: tr([p[0], p[1] - s * 0.45]) + ' rotate(' + ((q * 17) % 10 - 5) + 'deg)', opacity: 1, offset: 0.8 }, { transform: tr(from) + ' scale(.8)', opacity: 0 }], { duration: 1400 - q * 70, easing: 'ease-out', fill: 'both' }).then(gone(el));
      sparks(p[0], p[1], 2, function () { return '<i class="sp-dust"></i>'; }, 40, 360);
    });
  });
  return sleep(7 * 70 + 260).then(function () { sfx('shake'); shine(x, x.mc); });
}

/* ---------- scales of stone ---------- */
/** scales of stone fly onto the caster from all round and stick on it in rows, then shine */
function scales(x: SelfCtx): Promise<void> {
  const k = x.k, c = at(x).c, n = 10;
  sfx('shimmer');
  for (let q = 0; q < n; q++) {
    const row = Math.floor(q / 4), col = q % 4, p: P = [c[0] + (col - 1.5) * 26 * k + (row % 2 ? 13 * k : 0), c[1] + (row - 1) * 26 * k], a = q / n * Math.PI * 2, from: P = [c[0] + Math.cos(a) * 200 * k, c[1] + Math.sin(a) * 140 * k];
    const el = piece(PROPS.rune(q % 2 ? x.mc : '#ffffff', Math.round(26 * k)), 'sp-star');
    animate(el, [{ transform: tr(from) + ' rotate(180deg) scale(.4)', opacity: 0 }, { transform: tr(p) + ' rotate(0deg) scale(1.1)', opacity: 1, offset: 0.35 }, { transform: tr(p) + ' scale(1)', opacity: 1, offset: 0.75 }, { transform: tr(p) + ' scale(1.3)', opacity: 0 }],
      { duration: 1250, delay: q * 45, easing: 'ease-out', fill: 'both' }).then(gone(el));
  }
  return sleep(1250 * 0.35 + n * 45).then(function () { sfx('shake'); shine(x, x.mc); });
}

/* ---------- the sun ---------- */
/** the sun comes out over the caster and its warm rays fall on it */
function sunbath(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), sp: P = [a.c[0] - 40 * k, Math.max(50 * k, a.top[1] - 110 * k)], col = '#ffd24a';
  const sun = piece(PROPS.sun(col, Math.round(110 * k)), 'sp-star sp-glow');
  sun.style.setProperty('--mc', col);
  animate(sun, [{ transform: tr([sp[0], sp[1] + 40]) + ' scale(.4) rotate(0deg)', opacity: 0 }, { transform: tr(sp) + ' scale(1) rotate(30deg)', opacity: 1, offset: 0.3 }, { transform: tr(sp) + ' scale(1.06) rotate(90deg)', opacity: 1, offset: 0.8 }, { transform: tr(sp) + ' rotate(110deg)', opacity: 0 }],
    { duration: 1600, easing: 'ease-out', fill: 'both' }).then(gone(sun));
  sfx('shimmer');
  return sleep(480).then(function () {
    let rays = '';
    for (let q = -2; q <= 2; q++) rays += beam('M' + sp[0].toFixed(1) + ' ' + sp[1].toFixed(1) + ' L' + (a.c[0] + q * 26 * k).toFixed(1) + ' ' + (a.f[1] - 8).toFixed(1), col, 4 * k);
    const L = layer(rays);
    L.style.opacity = '.75';
    animate(L, [{ opacity: 0 }, { opacity: 0.8, offset: 0.3 }, { opacity: 0.6, offset: 0.7 }, { opacity: 0 }], { duration: 900, fill: 'both' }).then(gone(L));
    return sleep(360).then(function () { shine(x, col); });
  });
}

/* ---------- flowers ---------- */
/** broom flowers bloom on the ground round the caster and their scent goes up it in curls */
function bloom(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), col = '#ffd84d', n = 8;
  sfx('rustle');
  for (let q = 0; q < n; q++) {
    const ang = q / n * Math.PI * 2, p: P = [a.f[0] + Math.cos(ang) * 90 * k, a.f[1] - 6 + Math.sin(ang) * 22 * k], el = piece(PROPS.flower(col, Math.round(30 * k)), 'sp-star');
    animate(el, [{ transform: tr(p) + ' scale(0) rotate(-90deg)', opacity: 0 }, { transform: tr(p) + ' scale(1.2) rotate(10deg)', opacity: 1, offset: 0.25 }, { transform: tr(p) + ' scale(1) rotate(0deg)', opacity: 1, offset: 0.75 }, { transform: tr([p[0], p[1] - 20]) + ' scale(.6)', opacity: 0 }],
      { duration: 1400, delay: q * 60, easing: 'ease-out', fill: 'both' }).then(gone(el));
  }
  for (let q = 0; q < 3; q++) sleep(400 + q * 120).then(function () {
    const x0 = a.c[0] + (q - 1) * 34 * k, dd = 'M' + x0.toFixed(1) + ' ' + a.f[1].toFixed(1) + ' C' + (x0 + 30 * k).toFixed(1) + ' ' + lerp(a.f[1], a.top[1], 0.3).toFixed(1) + ' ' + (x0 - 30 * k).toFixed(1) + ' ' + lerp(a.f[1], a.top[1], 0.7).toFixed(1) + ' ' + x0.toFixed(1) + ' ' + (a.top[1] - 20).toFixed(1);
    const L = layer(beam(dd, col, 3 * k));
    L.querySelectorAll('path').forEach(function (s0) { (s0 as SVGPathElement).style.strokeDasharray = '1 1'; animate(s0, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 520, easing: 'ease-out', fill: 'both' }); });
    fade(L, 400, 420);
  });
  return sleep(900).then(function () { shine(x, col); });
}

/* ---------- the calm after the storm ---------- */
/** a storm cloud over the caster rains on it, then breaks up, and a rainbow comes out behind it (Bonaccia) */
function calm(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), cw = 200 * k, cy = Math.max(cw * 0.22, a.top[1] - 50 * k), cl = piece(stormCloud(), 'sp-cloud', cw);
  cl.style.height = (cw / 2).toFixed(0) + 'px';
  animate(cl, [{ transform: tr([a.c[0], cy - 30]) + ' scale(.6)', opacity: 0 }, { transform: tr([a.c[0], cy]) + ' scale(1)', opacity: 1, offset: 0.2 }, { transform: tr([a.c[0], cy]) + ' scale(1)', opacity: 1, offset: 0.45 },
    { transform: tr([a.c[0], cy - 20]) + ' scale(1.4)', opacity: 0, filter: 'brightness(2.2)' }], { duration: 1200, easing: 'ease-out', fill: 'both' }).then(gone(cl));
  sfx('rustle');
  for (let q = 0; q < 10; q++) sleep(160 + q * 45).then(function () {
    const px = a.c[0] + ((q * 37) % 9 - 4) * 18 * k, el = piece(drop('#8fd8ff', Math.round(12 * k)), 'sp-star');
    animate(el, [{ transform: tr([px, cy + 20 * k]), opacity: 1 }, { transform: tr([px - 10, a.c[1]]), opacity: 0 }], { duration: 360, easing: 'ease-in', fill: 'both' }).then(gone(el));
  });
  return sleep(700).then(function () {
    sfx('shimmer');
    const r = 120 * k, cx = a.c[0], by = a.f[1] - 10;
    let arcs = '';
    ['#ff8a7a', '#ffd84d', '#8fe08a', '#8fd8ff'].forEach(function (col, q) { const rr = r - q * 9 * k; arcs += '<path d="M' + (cx - rr).toFixed(1) + ' ' + by.toFixed(1) + ' A' + rr.toFixed(1) + ' ' + rr.toFixed(1) + ' 0 0 1 ' + (cx + rr).toFixed(1) + ' ' + by.toFixed(1) + '" pathLength="1" stroke="' + col + '" stroke-width="' + (9 * k).toFixed(1) + '" opacity=".85"/>'; });
    const L = layer(arcs, 'sp-rainbow');
    L.querySelectorAll('path').forEach(function (s0) { (s0 as SVGPathElement).style.strokeDasharray = '1 1'; animate(s0, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 520, easing: 'ease-out', fill: 'both' }); });
    fade(L, 500, 900);
    return sleep(300).then(function () { shine(x, '#8fd8ff'); });
  });
}

/* ---------- a veil ---------- */
/** a veil the colour of the rocks comes down over the caster, which fades into the cliff for a moment */
function veil(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), w = 170 * k, h = (a.f[1] - a.top[1]) + 60 * k, el = big('', 'sp-cloth', w, h, '50% 0');
  el.style.setProperty('--mc', x.mc);
  const p = T0([a.c[0] - w / 2, a.top[1] - 40 * k]);
  animate(el, [{ transform: p + ' scaleY(0) skewX(0deg)', opacity: 0 }, { transform: p + ' scaleY(1) skewX(6deg)', opacity: 0.9, offset: 0.3 }, { transform: p + ' scaleY(1) skewX(-5deg)', opacity: 0.85, offset: 0.5 }, { transform: p + ' scaleY(1) skewX(3deg)', opacity: 0.6, offset: 0.7 }, { transform: p + ' scaleY(1.05)', opacity: 0 }],
    { duration: 1400, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  sfx('rustle');
  const m = mv(x.i);
  if (m) animate(m, [{ opacity: 1 }, { opacity: 1, offset: 0.25 }, { opacity: 0.35, offset: 0.45 }, { opacity: 0.4, offset: 0.75 }, { opacity: 1 }], { duration: 1400, fill: 'both' });
  return sleep(800).then(function () { shine(x, x.mc); });
}

/* ---------- an idea ---------- */
function bulbSvg(mc: string): string {
  return '<svg viewBox="0 0 40 56" aria-hidden="true" stroke-linejoin="round"><path d="M20 2A17 17 0 0 1 31 32C28 35 27 38 27 42H13C13 38 12 35 9 32A17 17 0 0 1 20 2Z" fill="#fff7c2" stroke="' + INK + '" stroke-width="3"/>' +
    '<path d="M15 30L20 20L25 30" fill="none" stroke="' + mc + '" stroke-width="2.6"/><rect x="13" y="42" width="14" height="10" rx="2" fill="#b8bccc" stroke="' + INK + '" stroke-width="2.6"/><path d="M13 47H27" stroke="' + INK + '" stroke-width="1.6"/><path d="M11 12A11 11 0 0 1 18 6" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>';
}
/** a light bulb flickers over the caster's head, lights up with a burst of rays, and its light goes into the head */
function idea(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), p: P = [a.top[0], Math.max(60 * k, a.top[1] - 64 * k)], w = 70 * k, el = big(bulbSvg(x.mc), 'sp-bulb', w, w * 56 / 40);
  animate(el, [{ transform: tr(p) + ' scale(0)', opacity: 0, filter: 'brightness(.6)' }, { transform: tr(p) + ' scale(1.1)', opacity: 1, filter: 'brightness(.6)', offset: 0.2 }, { transform: tr(p), opacity: 1, filter: 'brightness(1.6)', offset: 0.3 },
    { transform: tr(p), opacity: 1, filter: 'brightness(.6)', offset: 0.36 }, { transform: tr(p) + ' scale(1.15)', opacity: 1, filter: 'brightness(2)', offset: 0.46 }, { transform: tr(p) + ' scale(1)', opacity: 1, filter: 'brightness(1.6)', offset: 0.8 }, { transform: tr([p[0], p[1] + 30 * k]) + ' scale(.4)', opacity: 0, filter: 'brightness(1.6)' }],
    { duration: 1300, easing: 'ease-out', fill: 'both' }).then(gone(el));
  return sleep(1300 * 0.46).then(function () {
    sfx('magicUp');
    const rays = piece('', 'sp-rays', 220 * k);
    rays.style.setProperty('--mc', x.mc);
    animate(rays, [{ transform: tr(p) + ' scale(.3) rotate(0deg)', opacity: 0.9 }, { transform: tr(p) + ' scale(1.1) rotate(45deg)', opacity: 0 }], { duration: 700, easing: 'ease-out', fill: 'both' }).then(gone(rays));
    flashAt(p[0], p[1], '#fff7c2', 200 * k, 300);
    return sleep(300).then(function () { shine(x, x.mc); });
  });
}

/* ---------- an old book ---------- */
function tomeSvg(mc: string): string {
  return '<svg viewBox="0 0 100 60" aria-hidden="true" stroke-linejoin="round"><path d="M50 10Q30 0 4 6V54Q30 48 50 58Q70 48 96 54V6Q70 0 50 10Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="3"/>' +
    '<path d="M50 12Q32 4 10 8V50Q32 45 50 53Q68 45 90 50V8Q68 4 50 12Z" fill="#fbf3dc" stroke="' + INK + '" stroke-width="2"/><path d="M50 12V53" stroke="' + INK + '" stroke-width="2"/>' +
    '<path d="M16 18H42M16 25H40M16 32H42M16 39H36M58 18H84M58 25H82M58 32H84M58 39H78" stroke="#8a6a4a" stroke-width="2" opacity=".6"/></svg>';
}
/** an old book opens over the caster, and its letters fly out of the pages into it */
function tome(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), p: P = [a.c[0], Math.max(40 * k, a.top[1] - 50 * k)], w = 120 * k, el = big(tomeSvg(x.mc), 'sp-tome', w, w * 0.6);
  animate(el, [{ transform: tr([p[0], p[1] + 30]) + ' scale(.1,.6)', opacity: 0 }, { transform: tr(p) + ' scale(.15,1)', opacity: 1, offset: 0.2 }, { transform: tr(p) + ' scale(1)', opacity: 1, offset: 0.4 }, { transform: tr(p) + ' scale(1)', opacity: 1, offset: 0.82 }, { transform: tr(p) + ' scale(.1,1)', opacity: 0 }],
    { duration: 1500, easing: 'ease-out', fill: 'both' }).then(gone(el));
  sfx('door');
  const glyphs = ['α', 'Ω', '∑', 'π', 'ψ', '★', 'λ', 'Φ'];
  for (let q = 0; q < glyphs.length; q++) sleep(620 + q * 60).then(function () {
    const g0 = piece('<b class="sp-glyph" style="--mc:' + x.mc + '">' + glyphs[q] + '</b>', 'sp-wordp'), from: P = [p[0] + (q - 3.5) * 10 * k, p[1] - 6 * k], to: P = [a.c[0] + (q - 3.5) * 8 * k, a.c[1]];
    animate(g0, [{ transform: tr(from) + ' scale(.4)', opacity: 0 }, { transform: tr(mid(from, [from[0] + (q - 3.5) * 14 * k, from[1] - 40 * k], 1)) + ' scale(1.1)', opacity: 1, offset: 0.4 }, { transform: tr(to) + ' scale(.5)', opacity: 0 }],
      { duration: 640, easing: 'ease-in-out', fill: 'both' }).then(gone(g0));
  });
  return sleep(620 + 8 * 60 + 400).then(function () { sfx('shimmer'); shine(x, x.mc); });
}

/* ---------- a starfish ---------- */
/** a starfish's outline is drawn round the caster, then its five arms fill in one after another */
function regrow(x: SelfCtx): Promise<void> {
  const k = x.k, c = at(x).c, R = 96 * k, r = 34 * k, pts: P[] = [];
  for (let q = 0; q < 10; q++) { const ang = -Math.PI / 2 + q * Math.PI / 5, rr = q % 2 ? r : R; pts.push([c[0] + Math.cos(ang) * rr, c[1] + Math.sin(ang) * rr]); }
  const dd = 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L') + 'Z';
  const L = layer(beam(dd, x.mc, 4 * k));
  L.querySelectorAll('path').forEach(function (s0) { (s0 as SVGPathElement).style.strokeDasharray = '1 1'; animate(s0, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 600, easing: 'linear', fill: 'both' }); });
  sfx('shimmer');
  for (let j = 0; j < 5; j++) sleep(600 + j * 110).then(function () {
    const tip = pts[j * 2], arm = layer('<path d="M' + pts[(j * 2 + 9) % 10][0].toFixed(1) + ' ' + pts[(j * 2 + 9) % 10][1].toFixed(1) + ' L' + tip[0].toFixed(1) + ' ' + tip[1].toFixed(1) + ' L' + pts[j * 2 + 1][0].toFixed(1) + ' ' + pts[j * 2 + 1][1].toFixed(1) + ' L' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + 'Z" fill="' + x.mc + '" opacity=".55" stroke="none"/>');
    arm.style.transformOrigin = c[0].toFixed(1) + 'px ' + c[1].toFixed(1) + 'px';
    animate(arm, [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.08)', opacity: 1, offset: 0.4 }, { transform: 'scale(1)', opacity: 1, offset: 0.7 }, { transform: 'scale(1)', opacity: 0 }], { duration: 900, easing: 'ease-out', fill: 'both' }).then(gone(arm));
    flashAt(tip[0], tip[1], '#ffffff', 80 * k, 240);
    sfx('blip');
  });
  fade(L, 400, 1300);
  return sleep(600 + 5 * 110 + 200).then(function () { shine(x, x.mc); });
}

/* ---------- a den ---------- */
/** rocks tumble down round the caster into a den, and it settles in it */
function burrow(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), n = 9, m = mv(x.i);
  sfx('rustle');
  for (let q = 0; q < n; q++) {
    const ang = Math.PI + q / (n - 1) * Math.PI, p: P = [a.c[0] + Math.cos(ang) * 92 * k, a.f[1] + Math.sin(ang) * 100 * k * 0.9 + 10], s = Math.round((34 + (q % 3) * 8) * k);
    const el = piece(PROPS.rock(q % 3 ? '#b9a48a' : x.mc, s), 'sp-star');
    animate(el, [{ transform: tr([p[0], p[1] - 160 * k]) + ' rotate(' + q * 40 + 'deg)', opacity: 0 }, { transform: tr(p) + ' rotate(' + q * 12 + 'deg)', opacity: 1, offset: 0.3 }, { transform: tr([p[0], p[1] - 4]) + ' rotate(' + q * 12 + 'deg)', opacity: 1, offset: 0.36 },
      { transform: tr(p) + ' rotate(' + q * 12 + 'deg)', opacity: 1, offset: 0.8 }, { transform: tr(p) + ' rotate(' + q * 12 + 'deg) scale(.9)', opacity: 0 }], { duration: 1500, delay: q * 50, easing: 'ease-in', fill: 'both' }).then(gone(el));
  }
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(0,10px) scale(1.04,.92)', offset: 0.4, transformOrigin: '50% 100%' }, { transform: 'translate(0,10px) scale(1.04,.92)', offset: 0.75, transformOrigin: '50% 100%' }, { transform: 'none' }], { duration: 1500, easing: 'ease-in-out' });
  return sleep(1500 * 0.3 + n * 50).then(function () { sfx('shake'); shine(x, x.mc); });
}

/* ---------- an hourglass ---------- */
function glassSvg(mc: string): string {
  return '<svg viewBox="0 0 50 80" aria-hidden="true" stroke-linejoin="round"><rect x="3" y="2" width="44" height="7" rx="2" fill="#a06a42" stroke="' + INK + '" stroke-width="2.6"/><rect x="3" y="71" width="44" height="7" rx="2" fill="#a06a42" stroke="' + INK + '" stroke-width="2.6"/>' +
    '<path d="M9 9C9 28 22 34 22 40C22 46 9 52 9 71H41C41 52 28 46 28 40C28 34 41 28 41 9Z" fill="#eef4ff" fill-opacity=".7" stroke="' + INK + '" stroke-width="2.6"/>' +
    '<path class="sp-sand-top" d="M13 18H37C35 28 26 33 25 38C24 33 15 28 13 18Z" fill="' + mc + '"/><path class="sp-sand-low" d="M12 70C14 60 22 56 25 56C28 56 36 60 38 70Z" fill="' + mc + '"/><path d="M25 38V58" stroke="' + mc + '" stroke-width="2"/></svg>';
}
/** an hourglass turns over by the caster, its sand runs down, and the caster sees how it will end */
function hourglass(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), d = x.i === 0 ? 1 : -1, p: P = [a.c[0] + d * 110 * k, a.c[1] - 10 * k], w = 62 * k, el = big(glassSvg(x.mc), 'sp-glass', w, w * 80 / 50);
  animate(el, [{ transform: tr(p) + ' rotate(180deg) scale(.4)', opacity: 0 }, { transform: tr(p) + ' rotate(0deg) scale(1)', opacity: 1, offset: 0.3 }, { transform: tr(p) + ' rotate(0deg)', opacity: 1, offset: 0.85 }, { transform: tr(p) + ' scale(1.2)', opacity: 0 }],
    { duration: 1500, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  const top = el.querySelector('.sp-sand-top') as SVGElement | null, low = el.querySelector('.sp-sand-low') as SVGElement | null;
  if (top) { top.style.transformOrigin = '25px 38px'; animate(top, [{ transform: 'scale(1)' }, { transform: 'scale(1)', offset: 0.3 }, { transform: 'scale(.2)' }], { duration: 1400, fill: 'both' }); }
  if (low) { low.style.transformOrigin = '25px 70px'; animate(low, [{ transform: 'scale(.2)' }, { transform: 'scale(.2)', offset: 0.3 }, { transform: 'scale(1)' }], { duration: 1400, fill: 'both' }); }
  sfx('shimmer');
  return sleep(1000).then(function () {
    const eye = piece(PROPS.eye(x.mc, Math.round(56 * k)), 'sp-star sp-glow');
    eye.style.setProperty('--mc', x.mc);
    const ep: P = [a.top[0], a.top[1] - 26 * k];
    animate(eye, [{ transform: tr(ep) + ' scale(1,.05)', opacity: 0 }, { transform: tr(ep) + ' scale(1.2)', opacity: 1, offset: 0.4 }, { transform: tr(ep) + ' scale(1)', opacity: 0 }], { duration: 700, fill: 'both' }).then(gone(eye));
    shine(x, x.mc);
  });
}

/* ---------- the door between day and night ---------- */
function doorSvg(mc: string): string {
  return '<svg viewBox="0 0 80 120" aria-hidden="true" stroke-linejoin="round"><path d="M4 118V40A36 36 0 0 1 76 40V118Z" fill="#2a2450" stroke="' + INK + '" stroke-width="4"/>' +
    '<path d="M10 118V40A30 30 0 0 1 40 10V118Z" fill="#ffd27a"/><path d="M40 10A30 30 0 0 1 70 40V118H40Z" fill="' + mc + '"/>' +
    '<circle cx="25" cy="44" r="9" fill="#fff4c2" stroke="' + INK + '" stroke-width="2"/><path d="M58 36A9 9 0 1 0 62 52A7 7 0 0 1 58 36Z" fill="#f4f7ff" stroke="' + INK + '" stroke-width="2"/>' +
    '<path d="M40 10V118" stroke="' + INK + '" stroke-width="3"/><circle cx="34" cy="80" r="3" fill="' + INK + '"/><circle cx="46" cy="80" r="3" fill="' + INK + '"/></svg>';
}
/** a door half day and half night stands in front of the caster and shuts with a click; light seals its edges */
function door(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), d = x.i === 0 ? 1 : -1, w = 120 * k, h = w * 1.5, base: P = [a.f[0] + d * 64 * k, a.f[1] + 4], p = foot(base, w, h), el = big(doorSvg(x.mc), 'sp-door', w, h, '50% 100%');
  animate(el, [{ transform: p + ' scaleX(0)', opacity: 0 }, { transform: p + ' scaleX(.3)', opacity: 1, offset: 0.2 }, { transform: p + ' scaleX(1.05)', opacity: 1, offset: 0.45 }, { transform: p + ' scaleX(1)', opacity: 1, offset: 0.52 }, { transform: p + ' scaleX(1)', opacity: 1, offset: 0.85 }, { transform: p + ' scaleX(1)', opacity: 0 }],
    { duration: 1500, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  sfx('door');
  return sleep(1500 * 0.45).then(function () {
    sfx('shake');
    flashAt(base[0], base[1] - h / 2, '#ffffff', 220 * k, 300);
    shine(x, x.mc);
  });
}

/* ---------- the gates of the city ---------- */
function gateSvg(): string {
  let studs = '';
  for (let r = 0; r < 4; r++) for (let c = 0; c < 2; c++) studs += '<circle cx="' + (12 + c * 16) + '" cy="' + (26 + r * 24) + '" r="2.4" fill="#3a3f66"/>';
  return '<svg viewBox="0 0 40 120" aria-hidden="true" stroke-linejoin="round"><rect x="2" y="6" width="36" height="112" rx="3" fill="#a06a42" stroke="' + INK + '" stroke-width="3.5"/><path d="M14 8V116M26 8V116" stroke="' + INK + '" stroke-width="1.4" opacity=".4"/>' +
    '<rect x="2" y="30" width="36" height="6" fill="#5d6394"/><rect x="2" y="86" width="36" height="6" fill="#5d6394"/>' + studs + '</svg>';
}
/** the two wings of a city gate swing shut in front of the caster, under an arch of stone; then they open */
function gates(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), d = x.i === 0 ? 1 : -1, cx = a.f[0] + d * 30 * k, h = 190 * k, w = h * 0.42, D = 1600;
  sfx('door');
  const arch = layer('<path d="M' + (cx - w * 1.25).toFixed(1) + ' ' + (a.f[1] + 4).toFixed(1) + ' V' + (a.f[1] - h * 0.8).toFixed(1) + ' A' + (w * 1.25).toFixed(1) + ' ' + (w * 1.25).toFixed(1) + ' 0 0 1 ' + (cx + w * 1.25).toFixed(1) + ' ' + (a.f[1] - h * 0.8).toFixed(1) + ' V' + (a.f[1] + 4).toFixed(1) + '" stroke="' + INK + '" stroke-width="' + (22 * k).toFixed(1) + '" opacity=".5"/>' +
    '<path d="M' + (cx - w * 1.25).toFixed(1) + ' ' + (a.f[1] + 4).toFixed(1) + ' V' + (a.f[1] - h * 0.8).toFixed(1) + ' A' + (w * 1.25).toFixed(1) + ' ' + (w * 1.25).toFixed(1) + ' 0 0 1 ' + (cx + w * 1.25).toFixed(1) + ' ' + (a.f[1] - h * 0.8).toFixed(1) + ' V' + (a.f[1] + 4).toFixed(1) + '" stroke="' + x.mc + '" stroke-width="' + (16 * k).toFixed(1) + '"/>');
  animate(arch, [{ opacity: 0 }, { opacity: 1, offset: 0.15 }, { opacity: 1, offset: 0.85 }, { opacity: 0 }], { duration: D, fill: 'both' }).then(gone(arch));
  [-1, 1].forEach(function (side) {
    const el = big(gateSvg(), 'sp-gate', w, h * 0.92, side < 0 ? '0 50%' : '100% 50%'), x0 = side < 0 ? cx - w : cx, p = T0([x0, a.f[1] + 4 - h * 0.92]);
    animate(el, [{ transform: p + ' scaleX(.08)', opacity: 0 }, { transform: p + ' scaleX(.08)', opacity: 1, offset: 0.15 }, { transform: p + ' scaleX(1.04)', opacity: 1, offset: 0.4 }, { transform: p + ' scaleX(1)', opacity: 1, offset: 0.46 },
      { transform: p + ' scaleX(1)', opacity: 1, offset: 0.75 }, { transform: p + ' scaleX(.08)', opacity: 0 }], { duration: D, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  });
  return sleep(D * 0.4).then(function () { sfx('shake'); flashAt(cx, a.f[1] - h / 2, '#ffffff', 200 * k, 300); shine(x, x.mc); });
}

/* ---------- roots ---------- */
/** roots grow out of the caster's feet and go deep into the ground, branching */
function roots(x: SelfCtx): Promise<void> {
  const k = x.k, f = at(x).f, col = '#8a5a3a';
  sfx('rustle');
  let ls = '';
  for (let q = 0; q < 6; q++) {
    const s0 = q - 2.5, x1 = f[0] + s0 * 46 * k, y1 = f[1] + (30 + (q % 2) * 18) * k, cx = f[0] + s0 * 14 * k;
    const dd = 'M' + (f[0] + s0 * 8 * k).toFixed(1) + ' ' + (f[1] - 6).toFixed(1) + ' Q' + cx.toFixed(1) + ' ' + (f[1] + 20 * k).toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + (x1 + s0 * 10 * k).toFixed(1) + ' ' + (y1 + 16 * k).toFixed(1);
    ls += '<path d="' + dd + '" pathLength="1" stroke="' + INK + '" stroke-width="' + (9 * k).toFixed(1) + '"/><path d="' + dd + '" pathLength="1" stroke="' + col + '" stroke-width="' + (5.5 * k).toFixed(1) + '"/><path d="' + dd + '" pathLength="1" stroke="' + x.mc + '" stroke-width="' + (1.6 * k).toFixed(1) + '" opacity=".8"/>';
  }
  const L = layer(ls);
  L.querySelectorAll('path').forEach(function (s0) { (s0 as SVGPathElement).style.strokeDasharray = '1 1'; animate(s0, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 760, easing: 'ease-out', fill: 'both' }); });
  fade(L, 500, 1000);
  for (let q = 0; q < 4; q++) sleep(300 + q * 120).then(function () { const p: P = [f[0] + (q - 1.5) * 50 * k, f[1] + 10 * k]; sparks(p[0], p[1], 2, function () { return PROPS.flower(x.mc, 14); }, 30, 500); });
  return sleep(800).then(function () { sfx('shake'); shine(x, x.mc); });
}

/* ---------- a drop of oil ---------- */
/** a big golden drop of new oil falls on the caster, and its gold spreads over it */
function oil(x: SelfCtx): Promise<void> {
  const k = x.k, a = at(x), col = '#d8c23a', s = Math.round(50 * k), from: P = [a.top[0], -40], land: P = [a.top[0], a.top[1] + 10];
  const drop = piece('<svg viewBox="0 0 20 26" width="' + s + '" height="' + Math.round(s * 1.3) + '" aria-hidden="true"><path d="M10 2C13 8 17 12 17 17A7 7 0 0 1 3 17C3 12 7 8 10 2Z" fill="' + col + '" stroke="' + INK + '" stroke-width="1.6"/><path d="M7 16A3 3 0 0 0 9 20" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round"/></svg>', 'sp-star sp-glow');
  drop.style.setProperty('--mc', col);
  sfx('whoosh');
  return animate(drop, [{ transform: tr(from) + ' scale(.8,1)', opacity: 1 }, { transform: tr([land[0], land[1] - 30 * k]) + ' scale(.85,1.15)', opacity: 1, offset: 0.85 }, { transform: tr(land) + ' scale(1.5,.4)', opacity: 0 }], { duration: 640, easing: 'ease-in', fill: 'both' }).then(function () {
    drop.remove();
    sfx('heal');
    sparks(land[0], land[1], 10, function (q) { return '<i class="sp-goldbit' + (q % 2 ? ' b' : '') + '"></i>'; }, 90 * k, 600);
    const m = mv(x.i);
    if (m) pulse(m, 'gilded', 1000);
    shine(x, col);
  }) as Promise<void>;
}

export const SELF: Record<SelfStage, (x: SelfCtx) => Promise<void>> = {
  shell: shell, walls: walls, scales: scales, sunbath: sunbath, bloom: bloom, calm: calm, veil: veil, idea: idea, tome: tome, regrow: regrow,
  burrow: burrow, hourglass: hourglass, door: door, gates: gates, roots: roots, oil: oil
};
