import { sleep } from './common';
import { arena } from './battle-screen';
import { animate, anchor, ring, sparks, flashAt, pulse, streaks } from './effects';
import { sfx } from '../audio';
import { PROPS } from './move-props';
import { INK, type Ctx, type StageDef, type P, lerp, mid, tr, gone, size, body, curve, along, piece, layer, beam, fade, mv, way, tint, pc, burst, boom, boltPath, stormCloud, tornado } from './spell-kit';

/* More scenes of the moves (data/move-fx.ts), after the gestures and the scenes of Corrente in ui/move-stages.ts: a storm
   with its lightning, a shadow that rises, signs that open round the one hit, a lighthouse's beam, the heat of August,
   fireflies, St Elmo's fire, a whirlwind, a theft, an earthquake, a figure written in the air, a song, an oration, claws,
   the aurora, a tower that falls, an ambush, an old photograph, a beak, a spark. Each takes its colour and its pieces
   from the move (`pc`), resolves on the impact and draws it. Only drawing, and never Math.random. */

const T0 = (p: P) => 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px)';
/** where a piece w×h stands with its feet at p (it turns and grows on its feet: transform-origin 50% 100%) */
const foot = (p: P, w: number, h: number) => T0([p[0] - w / 2, p[1] - h]);
/** a big drawing as a piece of its own size */
function big(html: string, cls: string, w: number, h: number, origin?: string): HTMLElement {
  const el = piece(html, 'sp-big ' + cls);
  el.style.width = w.toFixed(0) + 'px'; el.style.height = h.toFixed(0) + 'px';
  if (origin) el.style.transformOrigin = origin;
  return el;
}
const dust = () => '<i class="sp-dust"></i>';
/** the ground under the one hit, where the move lands (past it, for a miss) */
const ground = (x: Ctx): P => [x.end[0], anchor(x.to, 0.5, 0.95)[1]];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- a storm: lightning out of a dark cloud ---------- */
function fullMoon(mc: string): string {
  return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" fill="#f4f7ff" stroke="' + INK + '" stroke-width="3"/><circle cx="50" cy="50" r="46" fill="' + mc + '" opacity=".3"/>' +
    '<circle cx="34" cy="36" r="9" fill="' + mc + '" opacity=".45"/><circle cx="62" cy="62" r="12" fill="' + mc + '" opacity=".4"/><circle cx="66" cy="30" r="5" fill="' + mc + '" opacity=".45"/><circle cx="30" cy="66" r="4" fill="' + mc + '" opacity=".4"/></svg>';
}
function mastSvg(mc: string): string {
  return '<svg viewBox="0 0 60 200" aria-hidden="true" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M30 8L6 46M30 8L54 46M30 60L10 104M30 60L50 104M30 104L14 196M30 104L46 196" stroke="' + INK + '" stroke-width="1.5" opacity=".55" fill="none"/>' +
    '<rect x="26" y="6" width="8" height="194" rx="3" fill="#a06a42" stroke="' + INK + '" stroke-width="3"/>' +
    '<rect x="4" y="42" width="52" height="7" rx="3" fill="#a06a42" stroke="' + INK + '" stroke-width="3"/><rect x="9" y="100" width="42" height="7" rx="3" fill="#a06a42" stroke="' + INK + '" stroke-width="3"/>' +
    '<path d="M34 8L54 13L34 18Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="2"/><path d="M29 12V196" stroke="#ffffff" stroke-width="2" opacity=".35"/></svg>';
}
/** a dark cloud gathers over the one hit and n bolts strike it, the last the hardest; with the full moon behind
    (Tempesta di luna), down a ship's mast (Albero maestro), or setting it alight with blue flames (St Elmo's fire) */
function bolt(x: Ctx): Promise<void> {
  const k = x.k, p = x.end, g = ground(x), d = way(x), cw = 250 * k, cy = Math.max(cw * 0.2, p[1] - 200 * k), lead = 560, step = 250, D = lead + x.n * step + 520;
  if (x.prop === 'moon') {
    const mo = piece(fullMoon(x.mc), 'sp-big sp-fullmoon', 130 * k), at: P = [p[0] - d * cw * 0.55, Math.max(70 * k, cy + 6 * k)];
    animate(mo, [{ transform: tr([at[0], at[1] + 90 * k]) + ' scale(.6)', opacity: 0 }, { transform: tr(at) + ' scale(1)', opacity: 1, offset: 0.3 }, { transform: tr(at) + ' scale(1.04)', opacity: 1, offset: 0.85 }, { transform: tr(at), opacity: 0 }],
      { duration: D, easing: 'ease-out', fill: 'both' }).then(gone(mo));
  }
  let top: P = [p[0], cy + 30 * k];
  if (x.prop === 'mast') {
    const h = Math.max(130 * k, Math.min(g[1] - 16, 300 * k)), w = h * 60 / 200, base: P = [p[0] + d * 44 * k, g[1] + 4], el = big(mastSvg(x.mc), 'sp-mast', w, h, '50% 100%');
    animate(el, [{ transform: foot(base, w, h) + ' scaleY(0)', opacity: 1 }, { transform: foot(base, w, h) + ' scaleY(1)', opacity: 1, offset: 0.2 }, { transform: foot(base, w, h) + ' scaleY(1)', opacity: 1, offset: 0.85 }, { transform: foot(base, w, h) + ' scaleY(1)', opacity: 0 }],
      { duration: D, easing: 'ease-out', fill: 'both' }).then(gone(el));
    top = [base[0], base[1] - h + 6];
  }
  /* the storm is over the one hit; with a mast, beside it, so the lightning crosses to the mast's top */
  const cx = x.prop === 'mast' ? p[0] - d * cw * 0.55 : p[0], cloud = piece(stormCloud(), 'sp-cloud', cw);
  cloud.style.height = (cw / 2).toFixed(0) + 'px';
  animate(cloud, [{ transform: tr([cx, cy - 40]) + ' scale(.6)', opacity: 0 }, { transform: tr([cx, cy]) + ' scale(1)', opacity: 1, offset: 0.25 }, { transform: tr([cx, cy]) + ' scale(1.03)', opacity: 1, offset: 0.85 }, { transform: tr([cx, cy]), opacity: 0 }],
    { duration: D, easing: 'ease-out', fill: 'both' }).then(gone(cloud));
  sfx('thunder');
  for (let q = 0; q < x.n; q++) sleep(lead + q * step).then(function () {
    const last = q === x.n - 1, side = [-1, 1, -2, 2][q] || 0, aim: P = last ? (x.miss ? g : [x.b[0], x.b[1] + 6]) : [p[0] + side * 46 * k, g[1] - 6];
    let path = '';
    if (x.prop === 'mast') path = beam(boltPath(cx + side * 30, cy + 26, top[0], top[1], 6, 40 * k), x.mc, 9 * k) + (last ? beam('M' + top[0].toFixed(1) + ' ' + top[1].toFixed(1) + ' L' + top[0].toFixed(1) + ' ' + (g[1] - 30 * k).toFixed(1) + ' L' + aim[0].toFixed(1) + ' ' + aim[1].toFixed(1), x.mc, 7 * k) : '');
    else path = beam(boltPath(p[0] + side * 26, cy + 26, aim[0], aim[1], 8, 50 * k), x.mc, (last ? 12 : 8) * k) + '<path d="' + boltPath(p[0], cy + 34, aim[0] - d * 70 * k, lerp(cy, aim[1], 0.6), 4, 28 * k) + '" stroke="#ffffff" stroke-width="' + (2.6 * k).toFixed(1) + '" opacity=".8"/>';
    const L = layer(path);
    animate(L, [{ opacity: 0 }, { opacity: 1, offset: 0.08 }, { opacity: 0.25, offset: 0.3 }, { opacity: 1, offset: 0.42 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 340, fill: 'both' }).then(gone(L));
    flashAt(aim[0], aim[1], '#ffffff', (last ? 260 : 150) * k, 220);
    if (!last) { sparks(aim[0], aim[1], 5, dust, 60 * k, 420); if (x.prop === 'flame') burst(x, aim, 3, 50, 520); }
    if (last) sfx('thunder');
  });
  return sleep(lead + (x.n - 1) * step + 40).then(function () {
    if (x.miss) { sparks(g[0], g[1], 8, dust, 90 * k, 500); return; }
    ring(x.b[0], x.b[1], x.mc, 300 * k, 600); ring(g[0], g[1], '#ffffff', 280 * k, 600, true);
    burst(x, x.b, x.prop === 'flame' ? 14 : 9, 150, 820);
    tint(x);
  });
}

/* ---------- a shadow ---------- */
/** the shadow of an old olive tree, reaching to the left with its branches, two eyes in it */
function shadeSvg(mc: string): string {
  return '<svg viewBox="0 0 120 160" aria-hidden="true" stroke-linejoin="round">' +
    '<path d="M64 160C62 140 66 124 62 108C50 104 34 98 22 86C16 80 10 82 4 78C10 75 16 75 21 77C13 69 10 61 5 56C12 58 18 64 24 71C28 63 26 55 30 47C32 57 32 66 34 75C42 85 52 89 60 89C56 75 46 66 40 52C32 40 36 24 50 16C60 10 72 10 82 16C96 24 100 40 94 54C90 64 82 72 76 80C74 92 74 104 72 116C72 132 76 146 82 160Z" fill="#1a1530" opacity=".9" stroke="' + mc + '" stroke-width="2.5"/>' +
    '<ellipse cx="58" cy="40" rx="5" ry="3" fill="' + mc + '"/><ellipse cx="74" cy="38" rx="5" ry="3" fill="' + mc + '"/><ellipse cx="58" cy="40" rx="2" ry="1.4" fill="#ffffff"/><ellipse cx="74" cy="38" rx="2" ry="1.4" fill="#ffffff"/></svg>';
}
/** the caster's shadow stretches along the ground to the one hit, rises behind it as the shadow of an olive tree a
    thousand years old, and falls on it */
function shade(x: Ctx): Promise<void> {
  const k = x.k, d = way(x), a = anchor(x.from, 0.5, 0.95), g = ground(x), run = 480, D = 1100, hit = 0.62;
  const c: P = [lerp(a[0], g[0], 0.5), Math.max(a[1], g[1]) + 14 * k], dd = 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' Q' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ' ' + g[0].toFixed(1) + ' ' + g[1].toFixed(1);
  const L = layer('<path d="' + dd + '" pathLength="1" stroke="' + x.mc + '" stroke-width="' + (50 * k).toFixed(1) + '" opacity=".22"/><path d="' + dd + '" pathLength="1" stroke="#1a1530" stroke-width="' + (30 * k).toFixed(1) + '" opacity=".78"/>');
  L.querySelectorAll('path').forEach(function (q) { (q as SVGPathElement).style.strokeDasharray = '1 1'; animate(q, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: run, easing: 'ease-in', fill: 'both' }); });
  sfx('hiss');
  sleep(run).then(function () {
    sfx('magic');
    const h = Math.min(210 * k, g[1] - 4), w = h * 120 / 160, base: P = [g[0] + d * 54 * k, g[1] + 6], flip = d < 0 ? ' scaleX(-1)' : '', el = big(shadeSvg(x.mc), 'sp-shade', w, h, '50% 100%'), at = foot(base, w, h);
    animate(el, [{ transform: at + ' rotate(0deg) scaleY(.05)' + flip, opacity: 0 }, { transform: at + ' rotate(0deg) scaleY(1.06)' + flip, opacity: 1, offset: 0.34 }, { transform: at + ' rotate(' + -d * 8 + 'deg) scaleY(1)' + flip, opacity: 1, offset: 0.48 },
      { transform: at + ' rotate(' + -d * 30 + 'deg) scaleY(.92)' + flip, opacity: 1, offset: hit }, { transform: at + ' rotate(' + -d * 40 + 'deg) scaleY(.3)' + flip, opacity: 0 }], { duration: D, easing: 'ease-in', fill: 'both' }).then(gone(el));
    fade(L, 500, D * 0.4);
  });
  return sleep(run + D * hit).then(function () {
    sfx('shake');
    if (x.miss) return;
    ring(g[0], g[1], '#1a1530', 300 * k, 640, true); ring(x.b[0], x.b[1], x.mc, 240 * k, 560);
    flashAt(x.b[0], x.b[1], x.mc, 280 * k, 360);
    burst(x, x.b, 8, 120, 700);
    tint(x);
  });
}

/* ---------- signs round the one hit ---------- */
/** a circle is drawn round the one hit, n signs open on it one after another (runes light up, eyes open), and all
    strike it together */
function omen(x: Ctx): Promise<void> {
  const k = x.k, p = x.end, n = x.n, R = 100 * k, ry = 0.78, s = Math.round(38 * k), lead = 380, gap = 90, open = lead + n * gap + 280;
  const pos = (j: number): P => { const a = -Math.PI / 2 + j / n * Math.PI * 2; return [p[0] + Math.cos(a) * R, p[1] + Math.sin(a) * R * ry]; };
  let dd = '';
  for (let q = 0; q <= 32; q++) { const a = -Math.PI / 2 + q / 32 * Math.PI * 2; dd += (q ? ' L' : 'M') + (p[0] + Math.cos(a) * R).toFixed(1) + ' ' + (p[1] + Math.sin(a) * R * ry).toFixed(1); }
  const C = layer(beam(dd, x.mc, 3.4 * k));
  C.querySelectorAll('path').forEach(function (q) { (q as SVGPathElement).style.strokeDasharray = '1 1'; animate(q, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: lead + n * gap * 0.5, easing: 'linear', fill: 'both' }); });
  sfx('magic');
  const els: HTMLElement[] = [];
  for (let j = 0; j < n; j++) sleep(lead * 0.5 + j * gap).then(function () {
    const el = piece(pc(x, x.mc, s), 'sp-star sp-glow'), at = pos(j);
    el.style.setProperty('--mc', x.mc);
    els[j] = el;
    animate(el, [{ transform: tr(at) + ' scale(1,.05)', opacity: 0 }, { transform: tr(at) + ' scale(1.3)', opacity: 1, offset: 0.6 }, { transform: tr(at) + ' scale(1)', opacity: 1 }], { duration: 280, easing: 'ease-out', fill: 'both' });
    sfx('blip');
  });
  return sleep(open).then(function () {
    let rays = '';
    for (let j = 0; j < n; j++) { const a = pos(j); rays += beam('M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' L' + p[0].toFixed(1) + ' ' + p[1].toFixed(1), x.mc, 5 * k); }
    const L = layer(rays);
    L.querySelectorAll('path').forEach(function (q) { (q as SVGPathElement).style.strokeDasharray = '1 1'; animate(q, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 130, easing: 'ease-in', fill: 'both' }); });
    fade(L, 260, 140); fade(C, 320, 80);
    els.forEach(function (el, j) { animate(el, [{ transform: tr(pos(j)) + ' scale(1.2)', opacity: 1 }, { transform: tr(p) + ' scale(.3)', opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'both' }).then(gone(el)); });
    return sleep(140).then(function () {
      sfx('shake');
      if (x.miss) return;
      flashAt(p[0], p[1], '#ffffff', 320 * k, 360); ring(p[0], p[1], x.mc, 280 * k, 600);
      burst(x, p, 10, 140, 760);
      tint(x);
    });
  });
}

/* ---------- a beam of light that turns ---------- */
function lighthouseSvg(mc: string): string {
  return '<svg viewBox="0 0 60 140" aria-hidden="true" stroke-linejoin="round">' +
    '<path d="M16 140L22 44H38L44 140Z" fill="#f4f1ea" stroke="' + INK + '" stroke-width="3"/>' +
    '<path d="M20.2 72H39.8L40.9 90H19.1Z M18.4 104H41.6L42.6 122H17.4Z" fill="' + mc + '"/>' +
    '<path d="M24 50L20 136" stroke="#ffffff" stroke-width="3" opacity=".7"/>' +
    '<rect x="13" y="38" width="34" height="7" rx="2" fill="#3a3f66" stroke="' + INK + '" stroke-width="2.4"/>' +
    '<rect x="20" y="18" width="20" height="20" rx="2" fill="#fff6c8" stroke="' + INK + '" stroke-width="3"/><path d="M26 18V38M34 18V38" stroke="' + INK + '" stroke-width="1.6"/>' +
    '<path d="M18 18Q30 2 42 18Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="3"/><path d="M27 134V124A3 3 0 0 1 33 124V134Z" fill="' + INK + '"/></svg>';
}
let coneN = 0;
/** the lighthouse of Mola rises behind the caster (or the sun comes up behind it), and a cone of its light turns over
    the arena and stops on the one hit */
function cone(x: Ctx): Promise<void> {
  const k = x.k, d = way(x), g = anchor(x.from, 0.5, 0.95), e = x.end, sun = x.prop === 'sun', rise = 380, sweep = 680, D = rise + sweep + 700;
  const h = 190 * k, w = h * 60 / 140, base: P = [g[0] - d * 74 * k, g[1] + 6];
  const src: P = sun ? [g[0] - d * 50 * k, Math.max(60 * k, g[1] - 270 * k)] : [base[0], base[1] - h * 112 / 140];
  if (sun) {
    const el = piece(PROPS.sun(x.mc, Math.round(120 * k)), 'sp-star sp-glow');
    el.style.setProperty('--mc', x.mc);
    animate(el, [{ transform: tr([src[0], g[1]]) + ' scale(.5) rotate(0deg)', opacity: 0 }, { transform: tr(src) + ' scale(1) rotate(30deg)', opacity: 1, offset: rise / D }, { transform: tr(src) + ' scale(1.08) rotate(80deg)', opacity: 1, offset: 0.85 }, { transform: tr(src) + ' scale(1.1) rotate(90deg)', opacity: 0 }],
      { duration: D, easing: 'ease-out', fill: 'both' }).then(gone(el));
  } else {
    const el = big(lighthouseSvg(x.mc), 'sp-lighthouse', w, h, '50% 100%'), at = foot(base, w, h);
    animate(el, [{ transform: at + ' scaleY(0)', opacity: 1 }, { transform: at + ' scaleY(1.04)', opacity: 1, offset: rise / D * 0.8 }, { transform: at + ' scaleY(1)', opacity: 1, offset: rise / D }, { transform: at + ' scaleY(1)', opacity: 1, offset: 0.85 }, { transform: at + ' scaleY(1)', opacity: 0 }],
      { duration: D, easing: 'ease-out', fill: 'both' }).then(gone(el));
  }
  sfx('shimmer');
  const ang = Math.atan2(e[1] - src[1], e[0] - src[0]) * 180 / Math.PI, len = Math.hypot(e[0] - src[0], e[1] - src[1]) * 1.4, spread = 80 * k, id = 'sp-cone-' + (++coneN);
  return sleep(rise).then(function () {
    sfx('magic');
    const L = layer('<defs><linearGradient id="' + id + '"><stop offset="0" stop-color="#ffffff" stop-opacity=".95"/><stop offset=".55" stop-color="' + x.mc + '" stop-opacity=".55"/><stop offset="1" stop-color="' + x.mc + '" stop-opacity="0"/></linearGradient></defs>' +
      '<path d="M' + src[0].toFixed(1) + ' ' + (src[1] - 6).toFixed(1) + ' L' + (src[0] + len).toFixed(1) + ' ' + (src[1] - spread).toFixed(1) + ' L' + (src[0] + len).toFixed(1) + ' ' + (src[1] + spread).toFixed(1) + ' L' + src[0].toFixed(1) + ' ' + (src[1] + 6).toFixed(1) + 'Z" fill="url(#' + id + ')" stroke="none"/>' +
      '<path d="M' + src[0].toFixed(1) + ' ' + src[1].toFixed(1) + ' L' + (src[0] + len * 0.8).toFixed(1) + ' ' + src[1].toFixed(1) + '" stroke="#ffffff" stroke-width="' + (3 * k).toFixed(1) + '" opacity=".6"/>');
    L.style.transformOrigin = src[0].toFixed(1) + 'px ' + src[1].toFixed(1) + 'px';
    animate(L, [{ transform: 'rotate(' + (ang - d * 80).toFixed(1) + 'deg)', opacity: 0 }, { transform: 'rotate(' + (ang - d * 66).toFixed(1) + 'deg)', opacity: 1, offset: 0.12 }, { transform: 'rotate(' + ang.toFixed(1) + 'deg)', opacity: 1, offset: 0.62 },
      { transform: 'rotate(' + ang.toFixed(1) + 'deg) scale(1.02)', opacity: 1, offset: 0.8 }, { transform: 'rotate(' + ang.toFixed(1) + 'deg)', opacity: 0 }], { duration: sweep / 0.62, easing: 'ease-in-out', fill: 'both' }).then(gone(L));
    return sleep(sweep).then(function () {
      if (x.miss) return;
      flashAt(e[0], e[1], '#ffffff', 340 * k, 420); ring(e[0], e[1], x.mc, 260 * k, 600);
      burst(x, e, 9, 130, 760);
      tint(x);
    });
  });
}

/* ---------- the heat of August ---------- */
function heatSvg(mc: string): string {
  let s = '<svg viewBox="0 0 60 140" aria-hidden="true" fill="none" stroke-linecap="round">';
  for (let q = 0; q < 3; q++) { const x0 = 12 + q * 18, dd = 'M' + x0 + ' 4C' + (x0 + 10) + ' 24 ' + (x0 - 10) + ' 44 ' + x0 + ' 64C' + (x0 + 10) + ' 84 ' + (x0 - 10) + ' 104 ' + x0 + ' 124'; s += '<path d="' + dd + '" stroke="' + mc + '" stroke-width="5" opacity=".75"/><path d="' + dd + '" stroke="#ffffff" stroke-width="1.6" opacity=".8"/>'; }
  return s + '</svg>';
}
/** the August sun blazes over the arena, and waves of heat roll from the caster across the one hit, which wilts */
function haze(x: Ctx): Promise<void> {
  const k = x.k, z = size(), d = way(x), a = body(x.from, 0.5, 0.5), e = x.end, sunAt: P = [z.w * (d > 0 ? 0.44 : 0.56), 74 * k], waves = 5, gap = 120, fly = 640;
  const sun = piece(PROPS.sun(x.mc, Math.round(140 * k)), 'sp-star sp-glow');
  sun.style.setProperty('--mc', x.mc);
  animate(sun, [{ transform: tr([sunAt[0], sunAt[1] - 70]) + ' scale(.5) rotate(0deg)', opacity: 0 }, { transform: tr(sunAt) + ' scale(1) rotate(40deg)', opacity: 1, offset: 0.22 }, { transform: tr(sunAt) + ' scale(1.1) rotate(130deg)', opacity: 1, offset: 0.82 }, { transform: tr(sunAt) + ' scale(1.12) rotate(150deg)', opacity: 0 }],
    { duration: 1800, easing: 'ease-out', fill: 'both' }).then(gone(sun));
  sfx('hiss');
  const past: P = [e[0] + (e[0] - a[0]) * 0.25, e[1]];
  for (let q = 0; q < waves; q++) sleep(260 + q * gap).then(function () {
    const el = big(heatSvg(x.mc), 'sp-heat', 64 * k, 150 * k);
    animate(el, [{ transform: tr(a) + ' scaleX(.6)', opacity: 0 }, { transform: tr(mid(a, e, 0.3)) + ' scaleX(1.15)', opacity: 0.9, offset: 0.25 }, { transform: tr(mid(a, e, 0.75)) + ' scaleX(.85)', opacity: 0.9, offset: 0.62 }, { transform: tr(past) + ' scaleX(1.25)', opacity: 0 }],
      { duration: fly, easing: 'linear', fill: 'both' }).then(gone(el));
  });
  return sleep(260 + 2 * gap + fly * 0.72).then(function () {
    if (x.miss) return;
    const g = anchor(x.to, 0.5, 0.95);
    ring(g[0], g[1], x.mc, 280 * k, 700, true);
    flashAt(x.b[0], x.b[1], x.mc, 320 * k, 420);
    for (let q = 0; q < 3; q++) sleep(q * 120).then(function () { burst(x, [x.b[0] + (q - 1) * 30 * k, x.b[1] + 10 * k], 4, 70, 560); });
    tint(x);
  });
}

/* ---------- lights that come together ---------- */
/** n little lights wander in from the caster, circle the one hit, dim, all light up together and dart into it */
function swarm(x: Ctx): Promise<void> {
  const k = x.k, f = body(x.from, 0.5, 0.4), p = x.end, n = x.n, s = Math.round((n > 4 ? 34 : 44) * k), R = 70 * k, wander = 760, round = 560, light = 170, dart = 170, D = wander + round + light + dart + 120;
  const at = (j: number, t: number): P => { const a = j / n * Math.PI * 2 + t * Math.PI * 1.6; return [p[0] + Math.cos(a) * R, p[1] + Math.sin(a) * R * 0.62]; };
  sfx('shimmer');
  for (let j = 0; j < n; j++) {
    const el = piece(pc(x, x.mc, s), 'sp-star sp-glow'), fr: Keyframe[] = [], o: P = [f[0] + ((j * 37) % 9 - 4) * 9 * k, f[1] + ((j * 53) % 7 - 3) * 9 * k], tgt = at(j, 0);
    el.style.setProperty('--mc', x.mc);
    for (let q = 0; q <= 10; q++) { const t = q / 10, m0 = mid(o, tgt, t); fr.push({ transform: tr([m0[0], m0[1] + Math.sin(t * Math.PI * 3 + j) * 26 * k * (1 - t) - Math.sin(t * Math.PI) * 60 * k]) + ' scale(' + lerp(0.5, 1, t).toFixed(2) + ')', opacity: (q % 3 === 1 ? 0.5 : 1) * Math.min(1, t * 4 + 0.2), offset: t * wander / D }); }
    for (let q = 1; q <= 8; q++) fr.push({ transform: tr(at(j, q / 8)) + ' scale(.85)', opacity: q % 2 ? 0.35 : 0.6, offset: (wander + q / 8 * round) / D });
    fr.push({ transform: tr(at(j, 1)) + ' scale(1.8)', opacity: 1, offset: (wander + round + light) / D });
    fr.push({ transform: tr(p) + ' scale(.4)', opacity: x.miss ? 0 : 1, offset: (wander + round + light + dart) / D });
    fr.push({ transform: tr(p) + ' scale(.2)', opacity: 0, offset: 1 });
    animate(el, fr, { duration: D, easing: 'linear', fill: 'both' }).then(gone(el));
  }
  sleep(wander + round + 40).then(function () { sfx('magic'); for (let j = 0; j < n; j++) { const q = at(j, 1); flashAt(q[0], q[1], x.mc, 90 * k, 260); } });
  return sleep(wander + round + light + dart).then(function () {
    if (x.miss) return;
    flashAt(p[0], p[1], '#ffffff', 320 * k, 380); ring(p[0], p[1], x.mc, 260 * k, 600);
    burst(x, p, 8, 130, 700);
    tint(x);
  });
}

/* ---------- fire out of the ground ---------- */
/** a tall flame of the move's colour, with a white heart */
function pyreSvg(mc: string): string {
  return '<svg viewBox="0 0 100 200" preserveAspectRatio="none" aria-hidden="true" stroke-linejoin="round">' +
    '<path d="M50 2C58 40 92 62 92 124C92 172 74 198 50 198C26 198 8 172 8 124C8 92 22 72 32 56C34 80 40 92 46 98C42 66 44 30 50 2Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="4" vector-effect="non-scaling-stroke"/>' +
    '<path d="M74 70C82 52 80 34 72 22C70 42 66 56 60 66Z M24 110C14 98 14 82 20 70C24 84 28 94 34 100Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="3" vector-effect="non-scaling-stroke"/>' +
    '<path d="M50 80C56 104 72 118 72 150C72 178 62 190 50 190C38 190 28 178 28 150C28 128 38 116 42 104C44 116 47 122 50 126C48 112 48 96 50 80Z" fill="#ffffff" opacity=".85"/></svg>';
}
/** little flames flicker up round the one hit one after another, then a tall flame bursts up from the ground under it
    and takes it (St Elmo's fire) */
function rise(x: Ctx): Promise<void> {
  const k = x.k, p = x.end, g = ground(x), n = 6, w = 150 * k, h = Math.min(280 * k, g[1] + 20), start = 260, lead = 820, D = 1000;
  const spot = (j: number): P => { const a = j / n * Math.PI * 2 + 0.3; return [g[0] + Math.cos(a) * 80 * k, g[1] - 8 * k + Math.sin(a) * 20 * k]; };
  sfx('hiss');
  for (let j = 0; j < n; j++) sleep(start + j * 75).then(function () {
    const el = piece(pc(x, x.mc, Math.round(34 * k)), 'sp-star sp-glow'), q = spot(j), up: P = [q[0], q[1] - 14 * k];
    el.style.setProperty('--mc', x.mc);
    animate(el, [{ transform: tr(q) + ' scale(.2)', opacity: 0 }, { transform: tr(up) + ' scale(1.1)', opacity: 1, offset: 0.15 }, { transform: tr(up) + ' scale(.85,1)', opacity: 1, offset: 0.3 }, { transform: tr(up) + ' scale(1.1,1.2)', opacity: 1, offset: 0.45 },
      { transform: tr(up) + ' scale(.9)', opacity: 1, offset: 0.6 }, { transform: tr(up) + ' scale(1.15)', opacity: 1, offset: 0.75 }, { transform: tr(mid(up, [g[0], g[1] - 40 * k], 0.6)) + ' scale(.6)', opacity: 0 }],
      { duration: lead - start + 200 - j * 75, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  });
  sleep(lead).then(function () {
    sfx('whoosh');
    const el = big(pyreSvg(x.mc), 'sp-pyre', w, h, '50% 100%'), at = foot([p[0], g[1] + 10 * k], w, h);
    animate(el, [{ transform: at + ' scale(.4,0)', opacity: 1 }, { transform: at + ' scale(1.05,1.08)', opacity: 1, offset: 0.22 }, { transform: at + ' scale(.92,1)', opacity: 1, offset: 0.36 }, { transform: at + ' scale(1.06,1.04)', opacity: 1, offset: 0.5 },
      { transform: at + ' scale(.95,.98)', opacity: 1, offset: 0.64 }, { transform: at + ' scale(.6,1.1)', opacity: 0.8, offset: 0.82 }, { transform: at + ' scale(.2,1.2)', opacity: 0 }], { duration: D, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
    for (let q = 0; q < 9; q++) sleep(120 + q * 60).then(function () {
      const px = p[0] + ((q * 37) % 7 - 3) * w * 0.1, el2 = piece(pc(x, q % 2 ? '#ffffff' : x.mc, Math.round(18 * k)), 'sp-star');
      animate(el2, [{ transform: tr([px, g[1] - h * 0.5]) + ' scale(1)', opacity: 1 }, { transform: tr([px + (q % 2 ? 20 : -20), Math.max(0, g[1] - h * 1.2)]) + ' scale(.5)', opacity: 0 }], { duration: 480, easing: 'ease-out', fill: 'both' }).then(gone(el2));
    });
  });
  return sleep(lead + D * 0.2).then(function () {
    if (x.miss) return;
    ring(g[0], g[1], x.mc, 300 * k, 640, true); ring(g[0], g[1], '#ffffff', 240 * k, 560, true);
    flashAt(x.b[0], x.b[1], '#ffffff', 280 * k, 320);
    tint(x);
  });
}

/* ---------- a whirlwind ---------- */
/** a whirlwind rises by the caster, runs over the arena with what it picks up turning round it, holds on the one hit
    and spins it, and goes up */
function twister(x: Ctx): Promise<void> {
  const k = x.k, d = way(x), a = anchor(x.from, 0.5, 0.95), e = ground(x), h = Math.min(233 * k, Math.min(a[1], e[1]) - 6), w = h * 120 / 200, start: P = [a[0] + d * 70 * k, a[1]], D = 1600, grow = 0.2, reach = 0.6;
  const el = big(tornado(x.mc), 'sp-twister', w, h, '50% 100%'), fr: Keyframe[] = [{ transform: foot(start, w, h) + ' scale(.2,.05)', opacity: 0, offset: 0 }, { transform: foot(start, w, h) + ' scale(1)', opacity: 1, offset: grow }];
  for (let q = 1; q <= 8; q++) { const t = q / 8, c = mid(start, e, t); fr.push({ transform: foot([c[0] + Math.sin(t * Math.PI * 3) * 14 * k, c[1]], w, h) + ' skewX(' + (q % 2 ? 8 : -8) + 'deg)', opacity: 1, offset: lerp(grow, reach, t) }); }
  fr.push({ transform: foot(e, w, h) + ' skewX(-7deg) scale(1.08)', opacity: 1, offset: 0.7 }, { transform: foot(e, w, h) + ' skewX(7deg) scale(1.12)', opacity: 1, offset: 0.8 }, { transform: foot([e[0], e[1] - 70 * k], w, h) + ' scale(.8,1.1)', opacity: 0, offset: 1 });
  animate(el, fr, { duration: D, easing: 'linear', fill: 'both' }).then(gone(el));
  sfx('plane'); sleep(D * grow).then(function () { sfx('whoosh'); });
  const centre = (t: number): P => t < grow ? start : t < reach ? mid(start, e, (t - grow) / (reach - grow)) : [e[0], e[1] - (t > 0.8 ? (t - 0.8) / 0.2 * 70 * k : 0)];
  for (let j = 0; j < 7; j++) {
    const pe = piece(pc(x, j % 2 ? '#ffffff' : x.mc, Math.round(22 * k)), 'sp-star');
    animate(pe, along(function (t) { const c = centre(t), r = w * lerp(0.2, 0.5, j / 6); return [c[0] + Math.cos(t * Math.PI * 10 + j) * r, c[1] - h * (0.15 + j / 7 * 0.75)]; }, 32,
      function (t) { return 'rotate(' + (t * 900 + j * 50).toFixed(0) + 'deg)'; }, function (t) { return t < grow ? t / grow : t > 0.85 ? (1 - t) / 0.15 : 1; }), { duration: D, easing: 'linear', fill: 'both' }).then(gone(pe));
  }
  return sleep(D * reach).then(function () {
    if (x.miss) return;
    ring(x.b[0], x.b[1], x.mc, 260 * k, 600);
    burst(x, x.b, 8, 130, 720);
    tint(x);
  });
}

/* ---------- a theft ---------- */
/** the caster dashes in, grabs what the one hit has (the panino), runs back with it and eats it in one bite */
function snatch(x: Ctx): Promise<void> {
  const k = x.k, a = body(x.from, 0.5, 0.5), m = mv(x.from), d = way(x), T = 1050, grab = 0.3, dx = (x.end[0] - a[0]) * 0.8, dy = (x.end[1] - a[1]) * 0.8;
  sfx('lunge');
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + dx.toFixed(0) + 'px,' + dy.toFixed(0) + 'px) scale(1.08)', offset: grab }, { transform: 'translate(' + (dx * 0.9).toFixed(0) + 'px,' + (dy * 0.9 - 12).toFixed(0) + 'px)', offset: grab + 0.07 },
    { transform: 'translate(' + (-d * 14) + 'px,-28px) scale(1.05)', offset: 0.62 }, { transform: 'translate(0,-6px)', offset: 0.8 }, { transform: 'none' }], { duration: T, easing: 'ease-in-out' });
  sleep(T * 0.06).then(function () { streaks(x.from); });
  return sleep(T * grab).then(function () {
    if (x.miss) { sparks(x.end[0], x.end[1], 6, dust, 60 * k, 420); return; }
    const b = x.b, r = 54 * k, sw = 'M' + (b[0] - d * r).toFixed(1) + ' ' + (b[1] - r).toFixed(1) + ' Q' + (b[0] + d * r * 0.6).toFixed(1) + ' ' + b[1].toFixed(1) + ' ' + (b[0] - d * r).toFixed(1) + ' ' + (b[1] + r).toFixed(1);
    const L = layer(beam(sw, x.mc, 7 * k));
    L.querySelectorAll('path').forEach(function (q) { (q as SVGPathElement).style.strokeDasharray = '1 1'; animate(q, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 110, fill: 'both' }); });
    fade(L, 240, 110);
    sfx('pickup');
    flashAt(b[0], b[1], '#ffffff', 200 * k, 240); burst(x, b, 4, 70, 460);
    tint(x);
    const loot = piece(pc(x, x.mc, Math.round(64 * k)), 'sp-star'), top: P = [b[0], b[1] - 90 * k], home = body(x.from, 0.5, 0.35);
    animate(loot, [{ transform: tr(b) + ' scale(.4) rotate(0deg)', opacity: 1 }, { transform: tr(top) + ' scale(1.1) rotate(' + d * 20 + 'deg)', opacity: 1, offset: 0.3 },
      { transform: tr(mid(top, home, 0.7)) + ' scale(1) rotate(' + -d * 10 + 'deg)', opacity: 1, offset: 0.7 }, { transform: tr(home) + ' scale(.9)', opacity: 1, offset: 0.86 }, { transform: tr(home) + ' scale(0)', opacity: 0 }],
      { duration: T * (1 - grab) + 260, easing: 'ease-in-out', fill: 'both' }).then(function () {
      loot.remove(); sfx('blip');
      sparks(home[0], home[1], 7, function (q) { return '<i class="sp-crumb' + (q % 2 ? ' b' : '') + '"></i>'; }, 50, 460);
    });
  });
}

/* ---------- the ground ---------- */
function spikeSvg(mc: string): string {
  return '<svg viewBox="0 0 40 44" aria-hidden="true" stroke-linejoin="round"><path d="M1 44L7 18L13 26L20 1L27 22L33 12L39 44Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="2.6"/><path d="M20 6L17 30M8 24L7 36" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".6"/></svg>';
}
/** a spike of rock out of the ground at p, s wide, up and down again */
function spike(x: Ctx, p: P, s: number, stay: number) {
  const el = big(spikeSvg(x.mc), 'sp-spike', s, s * 1.1, '50% 100%'), at = foot(p, s, s * 1.1);
  animate(el, [{ transform: at + ' scaleY(0)', opacity: 1 }, { transform: at + ' scaleY(1.12)', opacity: 1, offset: 0.25 }, { transform: at + ' scaleY(1)', opacity: 1, offset: 0.4 }, { transform: at + ' scaleY(1)', opacity: 1, offset: 0.75 }, { transform: at + ' scaleY(0)', opacity: 0.6 }],
    { duration: stay, easing: 'ease-out', fill: 'both' }).then(gone(el));
  sparks(p[0], p[1] - 4, 3, dust, 40, 400);
}
/** the caster stamps (or a giant's foot comes down out of the sky beside it) and the ground rises in a wave of rock
    from it to the one hit, breaking out under it */
function quake(x: Ctx): Promise<void> {
  const k = x.k, d = way(x), a = anchor(x.from, 0.5, 0.95), g = ground(x), m = mv(x.from), N = 7, step = 75;
  let stomp = 380;
  if (x.prop === 'foot') {
    const fw = 190 * k, ft = piece(PROPS.foot(x.mc, Math.round(fw)), 'sp-star sp-foot'), at: P = [a[0] + d * 170 * k, a[1] - fw * 0.42], fl = d < 0 ? ' scaleX(-1)' : '';
    animate(ft, [{ transform: tr([at[0], -fw]) + ' rotate(' + -d * 10 + 'deg)' + fl, opacity: 1 }, { transform: tr(at) + ' rotate(0deg)' + fl, opacity: 1, offset: 0.55 }, { transform: tr(at) + ' scale(1.05,.95)' + fl, opacity: 1, offset: 0.7 }, { transform: tr(at) + fl, opacity: 0 }],
      { duration: 920, easing: 'ease-in', fill: 'both' }).then(gone(ft));
    stomp = 510;
  } else if (m) {
    animate(m, [{ transform: 'none', transformOrigin: '50% 100%' }, { transform: 'translate(0,-46px) scale(.95,1.08)', offset: 0.5, transformOrigin: '50% 100%' }, { transform: 'translate(0,4px) scale(1.16,.84)', offset: 0.82, transformOrigin: '50% 100%' }, { transform: 'none', transformOrigin: '50% 100%' }],
      { duration: stomp + 120, easing: 'ease-in' });
  }
  sfx('whoosh');
  sleep(stomp).then(function () {
    sfx('shake'); pulse(arena, 'quake', 420);
    const s0: P = [a[0] + d * (x.prop === 'foot' ? 170 : 40) * k, a[1]];
    ring(s0[0], s0[1], '#ffffff', 280 * k, 600, true);
    sparks(s0[0], s0[1], 9, dust, 110 * k, 560);
    for (let q = 0; q < N; q++) sleep(q * step).then(function () { const t = (q + 1) / (N + 1); spike(x, [lerp(a[0], g[0], t), lerp(a[1], g[1], t)], (30 + q * 5) * k, 560); });
  });
  return sleep(stomp + N * step).then(function () {
    pulse(arena, 'quake', 420);
    if (x.miss) return;
    for (let j = 0; j < 3; j++) sleep(j * 40).then(function () { spike(x, [g[0] + (j - 1) * 44 * k, g[1] + (j === 1 ? 4 : 0)], (j === 1 ? 84 : 60) * k, 700); });
    ring(g[0], g[1], x.mc, 320 * k, 640, true);
    flashAt(x.b[0], x.b[1], '#ffffff', 260 * k, 300);
    burst(x, x.b, 8, 140, 720);
    tint(x);
  });
}

/* ---------- a figure written in the air ---------- */
/** a nib of light writes a star in one stroke over the one hit; with n > 1, a constellation, star by star; then the
    figure flashes and closes on it */
function sign(x: Ctx): Promise<void> {
  const k = x.k, p = x.end, R = 78 * k, c: P = [p[0], p[1] - 8 * k], pieces: { el: HTMLElement; at?: P }[] = [];
  let pts: P[] = [], write = 0;
  sfx('shimmer');
  if (x.n > 1) {
    const SKY = [[-1, -0.3], [-0.6, -0.55], [-0.15, -0.35], [0.25, -0.15], [0.3, 0.38], [0.95, 0.42], [0.9, -0.08], [0.55, -0.7], [-0.7, 0.4]];
    pts = SKY.slice(0, x.n).map(function (q) { return [c[0] + q[0] * R * 1.15, c[1] + q[1] * R * 1.15]; });
    const gap = 120;
    pts.forEach(function (q, j) {
      sleep(j * gap).then(function () {
        const st = piece(PROPS.star(j % 2 ? '#ffffff' : x.mc, Math.round(26 * k)), 'sp-star sp-glow');
        st.style.setProperty('--mc', x.mc);
        pieces.push({ el: st, at: q });
        animate(st, [{ transform: tr(q) + ' scale(0) rotate(-40deg)', opacity: 0 }, { transform: tr(q) + ' scale(1.4) rotate(10deg)', opacity: 1, offset: 0.6 }, { transform: tr(q) + ' scale(1) rotate(0deg)', opacity: 1 }], { duration: 220, fill: 'both' });
        sfx('blip');
        if (j) {
          const pr = pts[j - 1], L = layer(beam('M' + pr[0].toFixed(1) + ' ' + pr[1].toFixed(1) + ' L' + q[0].toFixed(1) + ' ' + q[1].toFixed(1), x.mc, 3 * k));
          L.style.transformOrigin = p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px';
          pieces.push({ el: L });
          L.querySelectorAll('path').forEach(function (s0) { (s0 as SVGPathElement).style.strokeDasharray = '1 1'; animate(s0, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: gap, easing: 'linear', fill: 'both' }); });
        }
      });
    });
    write = pts.length * gap + 60;
  } else {
    for (let q = 0; q <= 5; q++) { const a = -Math.PI / 2 + q * Math.PI * 4 / 5; pts.push([c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R]); }
    write = 720;
    const dd = 'M' + pts.map(function (q) { return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' L'), L = layer(beam(dd, x.mc, 5.5 * k));
    L.style.transformOrigin = p[0].toFixed(1) + 'px ' + p[1].toFixed(1) + 'px';
    pieces.push({ el: L });
    L.querySelectorAll('path').forEach(function (s0) { (s0 as SVGPathElement).style.strokeDasharray = '1 1'; animate(s0, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: write, easing: 'linear', fill: 'both' }); });
    const nib = piece(pc(x, '#ffffff', Math.round(24 * k)), 'sp-star sp-glow');
    nib.style.setProperty('--mc', x.mc);
    animate(nib, pts.map(function (q, j) { return { transform: tr(q) + ' rotate(' + j * 144 + 'deg)', offset: j / 5 }; }), { duration: write, easing: 'linear', fill: 'both' }).then(gone(nib));
  }
  return sleep(write + 160).then(function () {
    flashAt(c[0], c[1], x.mc, 260 * k, 300);
    pieces.forEach(function (q) {
      const el = q.el;
      if (q.at) animate(el, [{ transform: tr(q.at), opacity: 1 }, { transform: tr(p) + ' scale(.3)', opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'both' }).then(gone(el));
      else animate(el, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.2)', opacity: 0 }], { duration: 220, easing: 'ease-in', fill: 'both' }).then(gone(el));
    });
    return sleep(200).then(function () {
      if (x.miss) return;
      sfx('shake');
      flashAt(p[0], p[1], '#ffffff', 300 * k, 340); ring(p[0], p[1], x.mc, 260 * k, 560);
      burst(x, p, 9, 130, 720);
      tint(x);
    });
  });
}

/* ---------- sound ---------- */
function arcSvg(mc: string): string {
  let s0 = '<svg viewBox="0 0 60 80" aria-hidden="true" fill="none" stroke-linecap="round">';
  [[4, 1], [20, 0.8], [36, 0.6]].forEach(function (q) { const x0 = q[0], hh = 36 * q[1], dd = 'M' + x0 + ' ' + (40 - hh) + 'Q' + (x0 + 22 * q[1]) + ' 40 ' + x0 + ' ' + (40 + hh); s0 += '<path d="' + dd + '" stroke="' + INK + '" stroke-width="9" opacity=".5"/><path d="' + dd + '" stroke="' + mc + '" stroke-width="6"/><path d="' + dd + '" stroke="#ffffff" stroke-width="1.8"/>'; });
  return s0 + '</svg>';
}
/** waves of sound from the caster's mouth, opening as they go, and what it sings riding them up and down */
function song(x: Ctx): Promise<void> {
  const k = x.k, f = body(x.from, x.from === 0 ? 0.66 : 0.34, 0.36), e = x.end, ang = Math.atan2(e[1] - f[1], e[0] - f[0]), deg = (ang * 180 / Math.PI).toFixed(1), fly = 640, waves = 6, gap = 110;
  const past: P = [e[0] + (e[0] - f[0]) * 0.2, e[1] + (e[1] - f[1]) * 0.2];
  sfx('notes');
  for (let q = 0; q < waves; q++) sleep(q * gap).then(function () {
    const el = big(arcSvg(x.mc), 'sp-arc', 60 * k, 80 * k);
    animate(el, [{ transform: tr(f) + ' rotate(' + deg + 'deg) scale(.4)', opacity: 0 }, { transform: tr(mid(f, e, 0.2)) + ' rotate(' + deg + 'deg) scale(.8)', opacity: 1, offset: 0.2 },
      { transform: tr(e) + ' rotate(' + deg + 'deg) scale(1.7)', opacity: x.miss ? 0.2 : 0.9, offset: 0.85 }, { transform: tr(past) + ' rotate(' + deg + 'deg) scale(1.9)', opacity: 0 }], { duration: fly, easing: 'ease-out', fill: 'both' }).then(gone(el));
  });
  for (let j = 0; j < 7; j++) sleep(60 + j * 90).then(function () {
    const el = piece(pc(x, j % 2 ? '#ffffff' : x.mc, Math.round(36 * k)), 'sp-star');
    animate(el, along(function (t) { const q = mid(f, e, t), s0 = Math.sin(t * Math.PI * 3 + j) * 30 * k; return [q[0] - Math.sin(ang) * s0, q[1] + Math.cos(ang) * s0]; }, 14,
      function (t) { return 'rotate(' + (Math.sin(t * Math.PI * 4) * 20).toFixed(0) + 'deg) scale(' + lerp(0.7, 1.2, t).toFixed(2) + ')'; }, function (t) { return x.miss && t > 0.9 ? 0 : 1; }), { duration: fly + 80, easing: 'linear', fill: 'both' }).then(gone(el));
  });
  return sleep(2 * gap + fly * 0.85).then(function () {
    if (x.miss) return;
    ring(e[0], e[1], x.mc, 240 * k, 560); sleep(130).then(function () { ring(e[0], e[1], '#ffffff', 200 * k, 480); });
    burst(x, e, 8, 120, 680);
    tint(x);
  });
}
/** the caster's words fly at the one hit one after another, each bigger than the one before, and land on it (an
    oration: «Quo usque tandem…») */
function speech(x: Ctx): Promise<void> {
  const k = x.k, d = way(x), f = body(x.from, x.from === 0 ? 0.66 : 0.34, 0.3), e = x.end, words = x.words && x.words.length ? x.words : ['!'], gap = 300, fly = 400;
  sfx('speech');
  words.forEach(function (word, j) {
    sleep(j * gap).then(function () {
      const sc = (0.9 + j * 0.3) * k, tilt = (j % 2 ? 8 : -8), land: P = [e[0] + (j - (words.length - 1) / 2) * 20 * k, e[1] + (j % 2 ? 16 : -16) * k], cv = curve(f, land, 50 * k + j * 12);
      const el = piece('<b class="sp-word" style="--mc:' + x.mc + '">' + esc(word) + '</b>', 'sp-wordp');
      animate(el, along(cv.at, 10, function (t) { return 'scale(' + lerp(0.4, sc, t).toFixed(2) + ') rotate(' + (tilt * t).toFixed(1) + 'deg)'; }, function (t) { return x.miss && t > 0.92 ? 0 : 1; }), { duration: fly, easing: 'ease-in', fill: 'both' }).then(function () {
        if (x.miss) { el.remove(); return; }
        flashAt(land[0], land[1], x.mc, 140 * k, 220); sfx('hit');
        animate(el, [{ transform: tr(land) + ' scale(' + sc.toFixed(2) + ') rotate(' + tilt + 'deg)', opacity: 1 }, { transform: tr([land[0] + d * 34, land[1] - 34]) + ' scale(' + (sc * 1.1).toFixed(2) + ') rotate(' + (tilt + d * 16) + 'deg)', opacity: 1, offset: 0.3 },
          { transform: tr([land[0] + d * 70, land[1] + 70]) + ' scale(' + sc.toFixed(2) + ') rotate(' + (tilt + d * 50) + 'deg)', opacity: 0 }], { duration: 560, easing: 'ease-in', fill: 'both' }).then(gone(el));
      });
    });
  });
  return sleep((words.length - 1) * gap + fly).then(function () {
    if (x.miss) return;
    ring(e[0], e[1], x.mc, 280 * k, 600);
    burst(x, e, 8, 130, 700);
    tint(x);
  });
}

/* ---------- claws ---------- */
/** the caster lunges and its claws rake the one hit, three marks side by side, n times crossing */
function scratch(x: Ctx): Promise<void> {
  const k = x.k, a = body(x.from, 0.5, 0.5), m = mv(x.from), e = x.end, r = 58 * k, gap = 190, lead = 200;
  sfx('lunge');
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + ((e[0] - a[0]) * 0.32).toFixed(0) + 'px,' + ((e[1] - a[1]) * 0.32).toFixed(0) + 'px) scale(1.06)', offset: 0.4 }, { transform: 'translate(' + ((e[0] - a[0]) * 0.28).toFixed(0) + 'px,' + ((e[1] - a[1]) * 0.28).toFixed(0) + 'px)', offset: 0.7 }, { transform: 'none' }],
    { duration: lead + x.n * gap + 200, easing: 'ease-in-out' });
  for (let q = 0; q < x.n; q++) sleep(lead + q * gap).then(function () {
    if (q) sfx('lunge');
    if (x.miss) return;
    const sx = q % 2 ? -1 : 1;
    let ls = '';
    for (let s0 = -1; s0 <= 1; s0++) {
      const o = s0 * 22 * k, x0 = e[0] + sx * r * 0.8 + o, y0 = e[1] - r + Math.abs(s0) * 8, x1 = e[0] - sx * r * 0.8 + o, y1 = e[1] + r - Math.abs(s0) * 8;
      ls += beam('M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' Q' + (e[0] + o + sx * 12).toFixed(1) + ' ' + e[1].toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1), x.mc, 4.5 * k);
    }
    const L = layer(ls);
    L.querySelectorAll('path').forEach(function (s0) { (s0 as SVGPathElement).style.strokeDasharray = '1 1'; animate(s0, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 90, easing: 'ease-in', fill: 'both' }); });
    fade(L, 260, 120);
    flashAt(e[0], e[1], '#ffffff', 140 * k, 180);
    burst(x, [e[0] - sx * r * 0.7, e[1] + r * 0.8], 3, 50, 380);
  });
  return sleep(lead + (x.n - 1) * gap + 90).then(function () { if (!x.miss) { sfx('hit'); tint(x); } });
}

/* ---------- the aurora ---------- */
/** ribbons of light come down from the top of the arena over the one hit, ripple, and gather on it */
function curtain(x: Ctx): Promise<void> {
  const k = x.k, p = x.end, n = 5, w = 56 * k, h = p[1] + 80 * k, D = 1500, gather = 0.76;
  sfx('shimmer');
  for (let j = 0; j < n; j++) sleep(j * 80).then(function () {
    const el = piece('', 'sp-ribbon'), o = (j - (n - 1) / 2), at = T0([p[0] + o * 42 * k - w / 2, -10]), near = T0([p[0] + o * 10 * k - w / 2, -10]);
    el.style.setProperty('--mc', j % 2 ? '#ffffff' : x.mc);
    el.style.width = w.toFixed(0) + 'px'; el.style.height = h.toFixed(0) + 'px'; el.style.transformOrigin = '50% 0';
    animate(el, [{ transform: at + ' scaleY(0) skewX(0deg)', opacity: 0 }, { transform: at + ' scaleY(1) skewX(' + (j % 2 ? 10 : -10) + 'deg)', opacity: 0.9, offset: 0.24 }, { transform: at + ' scaleY(1) skewX(' + (j % 2 ? -12 : 12) + 'deg)', opacity: 0.8, offset: 0.44 },
      { transform: at + ' scaleY(1.02) skewX(' + (j % 2 ? 9 : -9) + 'deg)', opacity: 0.9, offset: 0.62 }, { transform: near + ' scaleY(1) scaleX(.5) skewX(0deg)', opacity: 1, offset: gather }, { transform: near + ' scaleY(1) scaleX(.1)', opacity: 0 }],
      { duration: D - j * 80, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  });
  return sleep(D * gather).then(function () {
    sfx('magic');
    if (x.miss) return;
    flashAt(p[0], p[1], '#ffffff', 340 * k, 400); ring(p[0], p[1], x.mc, 280 * k, 640);
    burst(x, p, 10, 140, 780);
    tint(x);
  });
}

/* ---------- a tower ---------- */
/** the round tower of Mola, in stone of the move's colour */
function towerSvg(mc: string): string {
  let courses = '';
  for (let q = 0; q < 6; q++) { const y = 46 + q * 22; courses += '<path d="M8 ' + y + 'H62" stroke="' + INK + '" stroke-width="1.4" opacity=".3"/><path d="M' + (q % 2 ? 24 : 36) + ' ' + y + 'V' + (y + 22) + 'M' + (q % 2 ? 48 : 18) + ' ' + y + 'V' + (y + 22) + '" stroke="' + INK + '" stroke-width="1.2" opacity=".22"/>'; }
  return '<svg viewBox="0 0 70 180" aria-hidden="true" stroke-linejoin="round">' +
    '<rect x="8" y="24" width="54" height="156" fill="' + mc + '" stroke="' + INK + '" stroke-width="3.5"/>' + courses +
    '<rect x="46" y="24" width="16" height="156" fill="' + INK + '" opacity=".16"/><rect x="14" y="28" width="5" height="148" fill="#ffffff" opacity=".35"/>' +
    '<path d="M3 26V12H15V20H27V12H43V20H55V12H67V26Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="3"/>' +
    '<rect x="30" y="62" width="10" height="18" rx="5" fill="' + INK + '"/><path d="M26 180V160A9 9 0 0 1 44 160V180Z" fill="' + INK + '"/></svg>';
}
/** the tower rises from the ground on the caster's side of the one hit, sways, and falls on it, breaking into stones */
function topple(x: Ctx): Promise<void> {
  const k = x.k, d = way(x), g = ground(x), H = Math.min(200 * k, g[1] - 12), W = H * 70 / 180, aim = x.miss ? x.end[0] : x.b[0], base: P = [aim - d * H * 0.95, g[1] + 4], at = foot(base, W, H), up = 380, sway = 300, drop = 420, D = up + sway + drop + 380;
  const el = big(towerSvg(x.mc), 'sp-tower', W, H, '50% 100%');
  animate(el, [{ transform: at + ' scaleY(0)', opacity: 1 }, { transform: at + ' scaleY(1.05)', opacity: 1, offset: up / D * 0.8 }, { transform: at + ' scaleY(1)', opacity: 1, offset: up / D }, { transform: at + ' rotate(' + -d * 3 + 'deg)', opacity: 1, offset: (up + sway * 0.45) / D },
    { transform: at + ' rotate(' + d * 4 + 'deg)', opacity: 1, offset: (up + sway) / D, easing: 'cubic-bezier(.55,0,1,.7)' }, { transform: at + ' rotate(' + d * 72 + 'deg)', opacity: 1, offset: (up + sway + drop) / D },
    { transform: at + ' rotate(' + d * 68 + 'deg)', opacity: 1, offset: (up + sway + drop + 110) / D }, { transform: at + ' rotate(' + d * 71 + 'deg) scale(.96,.9)', opacity: 0 }], { duration: D, easing: 'ease-out', fill: 'both' }).then(gone(el));
  sfx('rustle');
  sparks(base[0], base[1], 8, dust, 90 * k, 520);
  return sleep(up + sway + drop).then(function () {
    sfx('shake'); pulse(arena, 'quake', 420);
    if (x.miss) { sparks(x.end[0], g[1], 10, dust, 110 * k, 560); return; }
    sparks(x.b[0], x.b[1], 12, function (q) { return PROPS.rock(q % 3 ? x.mc : '#ffffff', 18 + (q % 3) * 6); }, 170 * k, 900);
    ring(g[0], g[1], x.mc, 320 * k, 640, true);
    flashAt(x.b[0], x.b[1], '#ffffff', 260 * k, 300);
    tint(x);
  });
}

/* ---------- an ambush ---------- */
/** the caster sinks into its own shadow, the shadow slides along the ground behind the one hit, and it comes out there
    and strikes from behind (quick: no circle) */
function ambush(x: Ctx): Promise<void> {
  const k = x.k, d = way(x), ga = anchor(x.from, 0.5, 0.95), gy = anchor(x.to, 0.5, 0.95)[1], m = mv(x.from), T = 1300, strike = 0.62;
  const behind: P = [x.end[0] + d * 92 * k, gy], dx = (behind[0] - ga[0]).toFixed(0), dy = (behind[1] - ga[1]).toFixed(0), o = '50% 100%';
  /* over there it is as big as the one hit: the far side is smaller */
  const tall = (i: number) => anchor(i, 0.5, 1)[1] - anchor(i, 0.5, 0)[1], r = Math.max(0.5, Math.min(1.6, tall(x.to) / Math.max(1, tall(x.from))));
  const at = (sx: number, sy: number, more?: string) => 'translate(' + dx + 'px,' + dy + 'px)' + (more || '') + ' scale(' + (sx * r).toFixed(2) + ',' + (sy * r).toFixed(2) + ')';
  sfx('hiss');
  if (m) animate(m, [{ transform: 'none', opacity: 1, transformOrigin: o }, { transform: 'scale(1.1,.1)', opacity: 0, offset: 0.18, transformOrigin: o }, { transform: at(1.1, 0.1), opacity: 0, offset: 0.45, transformOrigin: o },
    { transform: at(-1, 1.12), opacity: 1, offset: 0.55, transformOrigin: o }, { transform: at(-1.08, 1, ' translate(' + -d * 44 * k + 'px,-10px)'), opacity: 1, offset: strike, transformOrigin: o },
    { transform: at(-1, 1, ' translate(' + -d * 20 * k + 'px,0)'), opacity: 1, offset: 0.78, transformOrigin: o }, { transform: at(-1, 0.1), opacity: 0, offset: 0.87, transformOrigin: o },
    { transform: 'scale(1,.1)', opacity: 0, offset: 0.89, transformOrigin: o }, { transform: 'none', opacity: 1, transformOrigin: o }], { duration: T, easing: 'ease-in-out' });
  const sh = piece('', 'sp-shadow', 150 * k);
  animate(sh, [{ transform: tr(ga) + ' scaleY(.3)', opacity: 0 }, { transform: tr(ga) + ' scaleY(.3)', opacity: 0.95, offset: 0.16 }, { transform: tr(behind) + ' scaleY(.3)', opacity: 0.95, offset: 0.45 }, { transform: tr(behind) + ' scaleY(.3)', opacity: 0.6, offset: 0.6 },
    { transform: tr(behind) + ' scaleY(.3)', opacity: 0, offset: 0.72 }, { transform: tr(behind) + ' scaleY(.3)', opacity: 0 }], { duration: T, fill: 'both' }).then(gone(sh));
  sleep(T * 0.5).then(function () { sfx('whoosh'); });
  return sleep(T * strike).then(function () {
    sfx('lunge');
    if (x.miss) return;
    const p = x.b, r = 56 * k;
    const L = layer(beam('M' + (p[0] + r).toFixed(1) + ' ' + (p[1] - r).toFixed(1) + ' L' + (p[0] - r).toFixed(1) + ' ' + (p[1] + r).toFixed(1), x.mc, 8 * k) + beam('M' + (p[0] - r).toFixed(1) + ' ' + (p[1] - r * 0.8).toFixed(1) + ' L' + (p[0] + r).toFixed(1) + ' ' + (p[1] + r * 0.8).toFixed(1), x.mc, 8 * k));
    L.querySelectorAll('path').forEach(function (s0) { (s0 as SVGPathElement).style.strokeDasharray = '1 1'; animate(s0, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: 110, easing: 'ease-in', fill: 'both' }); });
    fade(L, 280, 100);
    flashAt(p[0], p[1], '#ffffff', 220 * k, 260);
    burst(x, p, 7, 110, 600);
    tint(x);
  });
}

/* ---------- an old photograph ---------- */
/** a photograph of Formia as it was, in sepia: a frame with the old town and the sea, and the place written under it */
function photoSvg(): string {
  return '<svg viewBox="0 0 200 170" aria-hidden="true" stroke-linejoin="round">' +
    '<rect x="14" y="14" width="172" height="120" fill="#a8763e" opacity=".26"/>' +
    '<path d="M14 134V112H28V100H36V112H50V90L58 82L66 90V112H80V102H94V74H98V64H104V74H108V112H120V98H134V112H140" fill="#6b4a2a" opacity=".42"/>' +
    '<path d="M140 116H186M146 124H186M152 130H186" stroke="#6b4a2a" stroke-width="2" opacity=".4"/><path d="M160 104L172 104L168 110H162Z M166 104V92L174 102Z" fill="#6b4a2a" opacity=".4"/>' +
    '<circle cx="158" cy="44" r="12" fill="#f3e6c8" opacity=".5"/>' +
    '<path d="M0 0H200V170H0Z M14 14V134H186V14Z" fill="#f3e6c8" fill-rule="evenodd" stroke="' + INK + '" stroke-width="4"/>' +
    '<text x="100" y="157" font-family="Georgia, serif" font-size="15" font-style="italic" fill="#6b4a2a" text-anchor="middle">Formia</text>' +
    '<circle cx="34" cy="150" r="7" fill="#a8763e" opacity=".18"/><circle cx="176" cy="24" r="9" fill="#a8763e" opacity=".14"/></svg>';
}
/** an old photograph comes down round the one hit, which takes the colour of an old picture; then it tears */
function memory(x: Ctx): Promise<void> {
  const k = x.k, p = x.end, w = 240 * k, h = w * 170 / 200, c: P = [p[0], p[1] + h * 0.1], D = 1500, land = 0.28, tear = 0.72;
  sfx('magic');
  const el = big(photoSvg(), 'sp-photo', w, h);
  animate(el, [{ transform: tr([c[0] + 60 * k, c[1] - 200 * k]) + ' rotate(-16deg) scale(1.2)', opacity: 0 }, { transform: tr(c) + ' rotate(4deg) scale(1)', opacity: 1, offset: land }, { transform: tr(c) + ' rotate(2deg)', opacity: 1, offset: 0.4 },
    { transform: tr(c) + ' rotate(2deg)', opacity: 1, offset: tear - 0.05 }, { transform: tr(c) + ' rotate(-3deg) scale(1.03)', opacity: 1, offset: tear }, { transform: tr(c) + ' rotate(4deg) scale(1.16)', opacity: 0 }],
    { duration: D, easing: 'ease-out', fill: 'both' }).then(gone(el));
  sleep(D * land).then(function () { sfx('rustle'); const m = mv(x.to); if (m && !x.miss) pulse(m, 'sepia', 1100); });
  return sleep(D * tear).then(function () {
    sfx('shake');
    sparks(c[0], c[1], 10, function (q) { return '<i class="sp-scrap' + (q % 2 ? ' b' : '') + '"></i>'; }, 160 * k, 900);
    if (x.miss) return;
    flashAt(p[0], p[1], x.mc, 280 * k, 360);
    burst(x, p, 6, 110, 640);
    tint(x);
  });
}

/* ---------- plain moves: a beak, a spark ---------- */
function beakSvg(): string {
  return '<svg viewBox="0 0 44 26" aria-hidden="true" stroke-linejoin="round"><path d="M2 3L42 12L2 13Z" fill="#ffb84a" stroke="' + INK + '" stroke-width="2.4"/><path d="M2 13L36 13L2 22Z" fill="#f08a2a" stroke="' + INK + '" stroke-width="2.4"/><path d="M6 6L30 11" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity=".7"/></svg>';
}
/** a beak jabs at the one hit n times, quick */
function peck(x: Ctx): Promise<void> {
  const k = x.k, d = way(x), e = x.end, a = body(x.from, 0.5, 0.5), m = mv(x.from), w = 74 * k, n = x.n, step = 170, lead = 120, T = lead + n * step + 140, flip = d < 0 ? ' scaleX(-1)' : '';
  const back = (q: number): P => [e[0] - d * (80 + (q % 2) * 12) * k, e[1] + ((q * 37) % 5 - 2) * 10 * k], hit = (q: number): P => [e[0] - d * 18 * k, e[1] + ((q * 37) % 5 - 2) * 8 * k];
  const el = big(beakSvg(), 'sp-beak', w, w * 26 / 44), fr: Keyframe[] = [{ transform: tr(back(0)) + flip, opacity: 0, offset: 0 }, { transform: tr(back(0)) + flip, opacity: 1, offset: lead / T }];
  for (let q = 0; q < n; q++) { fr.push({ transform: tr(hit(q)) + flip, opacity: 1, offset: (lead + q * step + 60) / T }); fr.push({ transform: tr(back(q + 1)) + flip, opacity: 1, offset: (lead + (q + 1) * step) / T }); }
  fr.push({ transform: tr(back(n)) + flip, opacity: 0, offset: 1 });
  animate(el, fr, { duration: T, easing: 'ease-in-out', fill: 'both' }).then(gone(el));
  if (m) animate(m, [{ transform: 'none' }, { transform: 'translate(' + ((e[0] - a[0]) * 0.12).toFixed(0) + 'px,' + ((e[1] - a[1]) * 0.12).toFixed(0) + 'px)', offset: 0.3 }, { transform: 'none' }], { duration: T, easing: 'ease-in-out' });
  for (let q = 0; q < n; q++) sleep(lead + q * step + 60).then(function () {
    sfx('hit');
    if (x.miss) return;
    const h0 = hit(q);
    flashAt(h0[0], h0[1], '#ffffff', 100 * k, 160);
    sparks(h0[0], h0[1], 3, function () { return PROPS.star('#ffffff', 14); }, 40 * k, 360);
  });
  return sleep(lead + (n - 1) * step + 60).then(function () { if (!x.miss) tint(x); });
}
/** a small spark crackles round the caster, jumps to the one hit in a jagged line and bursts on it */
function sparkle(x: Ctx): Promise<void> {
  const k = x.k, f = body(x.from, x.from === 0 ? 0.66 : 0.34, 0.4), e = x.end;
  sparks(f[0], f[1], 6, function () { return PROPS.spark('#ffffff', 16); }, 50 * k, 380);
  sfx('magic');
  return sleep(240).then(function () {
    const L = layer(beam(boltPath(f[0], f[1], e[0], e[1], 7, 34 * k), '#fff1a8', 5 * k));
    animate(L, [{ opacity: 0 }, { opacity: 1, offset: 0.1 }, { opacity: 0.3, offset: 0.4 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 320, fill: 'both' }).then(gone(L));
    if (x.miss) return;
    const s = piece(boom('#fff1a8'), 'sp-burst', 120 * k);
    animate(s, [{ transform: tr(e) + ' scale(.2) rotate(-20deg)', opacity: 1 }, { transform: tr(e) + ' scale(1) rotate(10deg)', opacity: 1, offset: 0.35 }, { transform: tr(e) + ' scale(1.3) rotate(20deg)', opacity: 0 }], { duration: 440, easing: 'ease-out', fill: 'both' }).then(gone(s));
    flashAt(e[0], e[1], '#ffffff', 200 * k, 240);
    sparks(e[0], e[1], 7, function () { return PROPS.spark('#ffffff', 18); }, 90 * k, 520);
    tint(x);
  });
}

/* ---------- a jump that does nothing ---------- */
/** the caster jumps up out of the water and falls back in with a splash, and that is all (Saltello) */
function hop(x: Ctx): Promise<void> {
  const k = x.k, m = mv(x.from), g = anchor(x.from, 0.5, 0.95), T = 900, o = '50% 100%';
  sfx('whoosh');
  if (m) animate(m, [{ transform: 'none', transformOrigin: o }, { transform: 'translate(0,6px) scale(1.1,.9)', offset: 0.12, transformOrigin: o }, { transform: 'translate(0,-90px) scale(.92,1.1) rotate(-8deg)', offset: 0.45, transformOrigin: o },
    { transform: 'translate(0,-96px) rotate(6deg)', offset: 0.55, transformOrigin: o }, { transform: 'translate(0,4px) scale(1.15,.85)', offset: 0.85, transformOrigin: o }, { transform: 'none', transformOrigin: o }], { duration: T, easing: 'ease-in-out' });
  sparks(g[0], g[1] - 6, 6, function (q) { return pc(x, q % 2 ? '#ffffff' : x.mc, 14); }, 50 * k, 420);
  return sleep(T * 0.85).then(function () {
    sfx('blip');
    ring(g[0], g[1], x.mc, 200 * k, 520, true);
    burst(x, [g[0], g[1] - 10], 8, 70, 560);
  });
}

export const SCENES = {
  bolt: { run: bolt, foe: 'shake', n: 3, impact: true },
  shade: { run: shade, foe: 'sink', impact: true },
  omen: { run: omen, foe: 'shake', n: 6, impact: true },
  cone: { run: cone, foe: 'recoil', impact: true },
  haze: { run: haze, foe: 'sink', impact: true },
  swarm: { run: swarm, foe: 'shake', n: 7, impact: true },
  rise: { run: rise, foe: 'lift', impact: true },
  twister: { run: twister, foe: 'spin', impact: true },
  snatch: { run: snatch, foe: 'spin', quick: true, impact: true },
  quake: { run: quake, foe: 'lift', impact: true },
  sign: { run: sign, foe: 'recoil', impact: true },
  song: { run: song, foe: 'shake', impact: true },
  speech: { run: speech, foe: 'recoil', impact: true },
  scratch: { run: scratch, foe: 'recoil', quick: true, n: 2, impact: true },
  curtain: { run: curtain, foe: 'lift', impact: true },
  topple: { run: topple, foe: 'squash', impact: true },
  ambush: { run: ambush, foe: 'recoil', quick: true, impact: true },
  memory: { run: memory, foe: 'sink', impact: true },
  peck: { run: peck, foe: 'shake', quick: true, n: 3, impact: true },
  sparkle: { run: sparkle, foe: 'recoil', quick: true, impact: true },
  hop: { run: hop, foe: 'shake', quick: true, impact: true, self: true }
} satisfies Record<string, StageDef>;
