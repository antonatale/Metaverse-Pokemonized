import { sleep } from './common';
import { animate, anchor, ring, sparks, flashAt, pulse } from './effects';
import { sfx } from '../audio';
import { PROPS } from './move-props';
import { INK, type Ctx, type StageDef, type P, lerp, mid, tr, gone, body, curve, along, piece, layer, beam, mv, way, tint, pc, burst, boom, trace, flash, veilOn } from './spell-kit';

/* The scenes of the moves of the seven's creatures (data/companions.ts, data/move-fx.ts), each out of its friend: a
   roar that shakes the screen (the caracal's hiss, the little dog's bark, the cub's first roar); a serve, ball up,
   racket down, ace (Spadaccino on the court, Volpadel on the padel glass); a blade of sea light cutting the screen in
   two (Gladiomare); a re-entry from orbit, the lion in a ball of fire (Leonauta); three moons that close into the
   triangle of the Trinità (Teduarca); Caesar's triumph, the eagle of the legion and «VENI VIDI VICI» (Lincesare); the
   freestyle, «STAI INGUAIATOOOO» on the beat (the Inguaiatore); an ensō painted round the one hit (Bubozen); a proof
   written on the air, and the theorem falls on the one hit (Volpitagora). Only drawing, and never Math.random. */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function big(html: string, cls: string, w: number, h: number, origin?: string): HTMLElement {
  const el = piece(html, 'sp-big ' + cls);
  el.style.width = w.toFixed(0) + 'px'; el.style.height = h.toFixed(0) + 'px';
  if (origin) el.style.transformOrigin = origin;
  return el;
}
const ground = (x: Ctx): P => [x.end[0], anchor(x.to, 0.5, 0.95)[1]];
const dust = () => '<i class="sp-dust"></i>';
/** a word, thrown */
function word(w: string, mc: string, cls?: string): HTMLElement { return piece('<b class="sp-word ' + (cls || '') + '" style="--mc:' + mc + '">' + esc(w) + '</b>', 'sp-wordp'); }
/** the arena shakes */
function quakeArena(ms: number, amp: number) {
  const a = document.querySelector('.arena') as HTMLElement | null;
  if (!a) return;
  const fr: Keyframe[] = [];
  for (let q = 0; q <= 10; q++) fr.push({ transform: q === 10 ? 'none' : 'translate(' + ((q % 2 ? 1 : -1) * amp * (1 - q / 10)).toFixed(1) + 'px,' + ((q % 3 ? -1 : 1) * amp * 0.5 * (1 - q / 10)).toFixed(1) + 'px)' });
  animate(a, fr, { duration: ms, easing: 'linear' });
}

/* ---------- a roar ---------- */
/** the caster rears up and roars: rings of sound open from its mouth toward the one hit, bigger and bigger, the screen
    shakes, and the one hit is pushed back (a hiss, a bark, a cub's first roar: the colour and the size say which) */
function roar(x: Ctx): Promise<void> {
  const k = x.k, m = mv(x.from), f = body(x.from, x.from === 0 ? 0.62 : 0.38, 0.36), e = x.end, d = way(x), o = '50% 100%', n = x.n;
  sfx('roar');
  if (m) animate(m, [{ transform: 'none', transformOrigin: o }, { transform: 'scale(.94,1.06) rotate(' + -d * 4 + 'deg)', offset: 0.18, transformOrigin: o }, { transform: 'scale(1.12,.94) translate(' + d * 8 + 'px,0)', offset: 0.32, transformOrigin: o },
    { transform: 'scale(1.1,.95) translate(' + d * 6 + 'px,0)', offset: 0.8, transformOrigin: o }, { transform: 'none', transformOrigin: o }], { duration: 300 + n * 150 + 300, easing: 'ease-out' });
  for (let q = 0; q < n; q++) sleep(200 + q * 150).then(function () {
    /* an arc of sound, open toward the one hit, flying and growing */
    const r = 70 * k, svg = '<svg viewBox="-60 -60 120 120" aria-hidden="true" fill="none" stroke-linecap="round"><path d="M-14 -44 Q30 0 -14 44" stroke="' + INK + '" stroke-width="13" opacity=".5"/><path d="M-14 -44 Q30 0 -14 44" stroke="' + x.mc + '" stroke-width="8"/><path d="M-14 -44 Q30 0 -14 44" stroke="#ffffff" stroke-width="2.5"/></svg>';
    const el = big(svg, 'sp-roar', r, r), ang = Math.atan2(e[1] - f[1], e[0] - f[0]) * 180 / Math.PI;
    animate(el, along(function (t) { return mid(f, e, t); }, 8, function (t) { return 'rotate(' + ang.toFixed(0) + 'deg) scale(' + lerp(0.45, 1.5 + q * 0.18, t).toFixed(2) + ')'; }, function (t) { return t > 0.85 ? (1 - t) / 0.15 : 1; }),
      { duration: 420, easing: 'ease-out', fill: 'both' }).then(gone(el));
  });
  return sleep(200 + (n - 1) * 150 + 360).then(function () {
    quakeArena(420, 7 * k);
    if (x.miss) return;
    ring(e[0], e[1], x.mc, 260 * k, 560); ring(e[0], e[1], '#ffffff', 200 * k, 480);
    burst(x, e, 6, 110, 600);
    tint(x);
  });
}

/* ---------- a serve ---------- */
function racketSvg(mc: string, padel: boolean): string {
  /* a tennis racket with its strings, or a padel bat with its holes */
  const head = padel ? '<path d="M30 6 Q54 6 54 36 Q54 64 36 72 L24 72 Q6 64 6 36 Q6 6 30 6Z" fill="' + mc + '" stroke="' + INK + '" stroke-width="4"/>' + [[22, 24], [38, 24], [30, 36], [22, 48], [38, 48], [30, 60]].map(function (h) { return '<circle cx="' + h[0] + '" cy="' + h[1] + '" r="3.4" fill="' + INK + '" opacity=".7"/>'; }).join('')
    : '<ellipse cx="30" cy="36" rx="25" ry="32" fill="#ffffff" fill-opacity=".25" stroke="' + INK + '" stroke-width="5"/><ellipse cx="30" cy="36" rx="25" ry="32" fill="none" stroke="' + mc + '" stroke-width="3"/>' +
      [14, 22, 30, 38, 46].map(function (xx) { return '<path d="M' + xx + ' 8V64" stroke="' + INK + '" stroke-width="1" opacity=".5"/>'; }).join('') + [16, 26, 36, 46, 56].map(function (yy) { return '<path d="M6 ' + yy + 'H54" stroke="' + INK + '" stroke-width="1" opacity=".5"/>'; }).join('');
  return '<svg viewBox="0 0 60 130" aria-hidden="true">' + head + '<rect x="26" y="70" width="8" height="12" fill="' + INK + '"/><rect x="24" y="80" width="12" height="46" rx="5" fill="#3a2f4a" stroke="' + INK + '" stroke-width="3"/><path d="M26 88h8M26 96h8M26 104h8" stroke="#ffffff" stroke-width="1.6" opacity=".5"/></svg>';
}
function ballSvg(col: string): string {
  return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="' + col + '" stroke="' + INK + '" stroke-width="3.5"/><path d="M6 12 Q20 20 6 30 M34 10 Q20 20 34 30" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round"/></svg>';
}
/** the ball goes up over the caster, the racket (or the padel bat) comes down on it, and the ball streaks across to
    the one hit, a white line behind it, «ACE!» where it lands (prop 'feather': the padel, off the glass first) */
function ace(x: Ctx): Promise<void> {
  const k = x.k, f = body(x.from, x.from === 0 ? 0.66 : 0.34, 0.3), e = x.end, d = way(x), padel = x.prop === 'feather', top: P = [f[0] + d * 10 * k, f[1] - 120 * k], toss = 520, swing = 160, fly = padel ? 520 : 300;
  const ball = piece(ballSvg('#d8f04a'), 'sp-ball', 34 * k);
  sfx('whoosh');
  /* up, a hang at the top, then away */
  const glass: P = [lerp(f[0], e[0], 0.6), Math.max(30 * k, e[1] - 150 * k)];
  const path = padel ? function (t: number): P { return t < 0.5 ? mid(top, glass, t * 2) : mid(glass, e, (t - 0.5) * 2); } : function (t: number): P { return mid(top, e, t); };
  animate(ball, ([{ transform: tr(f) + ' scale(.6)', opacity: 0 }, { transform: tr(top) + ' scale(1)', opacity: 1, offset: toss / (toss + swing + fly) * 0.9 }, { transform: tr(top) + ' scale(1)', opacity: 1, offset: (toss + swing) / (toss + swing + fly) }] as Keyframe[])
    .concat(along(path, 8, function (t) { return 'scale(' + lerp(1, 1.3, t).toFixed(2) + ') rotate(' + (t * 720).toFixed(0) + 'deg)'; }, function (t) { return x.miss && t > 0.9 ? 0 : 1; }).slice(1).map(function (q, i) { return Object.assign(q, { offset: (toss + swing + fly * (i + 1) / 8) / (toss + swing + fly) }); })),
    { duration: toss + swing + fly, easing: 'linear', fill: 'both' }).then(gone(ball));
  /* the racket: up behind the caster, down through the ball */
  const rw = 66 * k, rh = rw * 130 / 60, rk = big(racketSvg(padel ? '#ff7a2a' : x.mc, padel), 'sp-racket', rw, rh, '50% 90%'), at: P = [top[0] - d * 6 * k, top[1] + rh * 0.38];
  animate(rk, [{ transform: tr(at) + ' rotate(' + -d * 150 + 'deg)', opacity: 0 }, { transform: tr(at) + ' rotate(' + -d * 150 + 'deg)', opacity: 1, offset: 0.55 }, { transform: tr(at) + ' rotate(' + d * 40 + 'deg)', opacity: 1, offset: 0.78 }, { transform: tr(at) + ' rotate(' + d * 70 + 'deg)', opacity: 0 }],
    { duration: toss + swing + 260, easing: 'ease-in', fill: 'both' }).then(gone(rk));
  return sleep(toss + swing).then(function () {
    sfx('hit'); flashAt(top[0], top[1], '#ffffff', 120 * k, 160);
    /* the white line of the shot */
    const L = layer(padel ? beam('M' + top[0].toFixed(1) + ' ' + top[1].toFixed(1) + ' L' + glass[0].toFixed(1) + ' ' + glass[1].toFixed(1) + ' L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1), '#d8f04a', 5 * k) : beam('M' + top[0].toFixed(1) + ' ' + top[1].toFixed(1) + ' L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1), '#d8f04a', 5 * k));
    trace(L, fly); animate(L, [{ opacity: 1 }, { opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: fly + 260, fill: 'both' }).then(gone(L));
    if (padel) sleep(fly / 2).then(function () { sfx('blip'); flashAt(glass[0], glass[1], '#bfeaff', 130 * k, 200); sparks(glass[0], glass[1], 5, function () { return PROPS.star('#ffffff', 12); }, 50 * k, 360); });
    return sleep(fly);
  }).then(function () {
    if (x.miss) { sparks(ground(x)[0], ground(x)[1], 6, dust, 70 * k, 420); return; }
    sfx('hit');
    const w = word(padel ? 'SMASH!' : 'ACE!', '#d8f04a');
    animate(w, [{ transform: tr([e[0], e[1] - 30 * k]) + ' scale(.3) rotate(-12deg)', opacity: 0 }, { transform: tr([e[0], e[1] - 60 * k]) + ' scale(' + (1.2 * k).toFixed(2) + ') rotate(-6deg)', opacity: 1, offset: 0.25 }, { transform: tr([e[0], e[1] - 70 * k]) + ' scale(' + (1.25 * k).toFixed(2) + ') rotate(-4deg)', opacity: 1, offset: 0.8 }, { transform: tr([e[0], e[1] - 90 * k]) + ' scale(1)', opacity: 0 }],
      { duration: 900, easing: 'ease-out', fill: 'both' }).then(gone(w));
    const s = piece(boom('#d8f04a'), 'sp-burst', 120 * k);
    animate(s, [{ transform: tr(e) + ' scale(.2)', opacity: 1 }, { transform: tr(e) + ' scale(1)', opacity: 1, offset: 0.35 }, { transform: tr(e) + ' scale(1.3)', opacity: 0 }], { duration: 460, easing: 'ease-out', fill: 'both' }).then(gone(s));
    ring(e[0], e[1], x.mc, 240 * k, 520);
    tint(x);
  });
}

/* ---------- a blade of light ---------- */
/** the caster raises its blade, the screen darkens to the deep, and one stroke of sea light cuts across the one hit,
    the cut stays a moment and opens in a wave of foam */
function blade(x: Ctx): Promise<void> {
  const k = x.k, e = x.end, d = way(x), a: P = [e[0] - d * 170 * k, e[1] - 140 * k], b: P = [e[0] + d * 150 * k, e[1] + 120 * k], m = mv(x.from), o = '50% 100%';
  sfx('shimmer');
  if (m) animate(m, [{ transform: 'none', transformOrigin: o }, { transform: 'translate(0,-10px) scale(.96,1.06)', offset: 0.4, transformOrigin: o }, { transform: 'translate(' + d * 14 + 'px,4px) scale(1.06,.95)', offset: 0.7, transformOrigin: o }, { transform: 'none', transformOrigin: o }], { duration: 900, easing: 'ease-in-out' });
  const lift = veilOn(0.5);
  return sleep(520).then(function () {
    sfx('lunge');
    const d0 = 'M' + a[0].toFixed(1) + ' ' + a[1].toFixed(1) + ' L' + b[0].toFixed(1) + ' ' + b[1].toFixed(1);
    const L = layer('<path d="' + d0 + '" pathLength="1" stroke="#7ff0ff" stroke-width="' + (34 * k).toFixed(1) + '" opacity=".22"/>' + beam(d0, '#7ff0ff', 11 * k) + '<path d="' + d0 + '" pathLength="1" stroke="#ffffff" stroke-width="' + (4 * k).toFixed(1) + '"/>');
    trace(L, 140);
    animate(L, [{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], { duration: 620, fill: 'both' }).then(gone(L));
    return sleep(150);
  }).then(function () {
    lift(420);
    if (x.miss) return;
    flashAt(e[0], e[1], '#ffffff', 300 * k, 260);
    quakeArena(300, 6 * k);
    /* the foam the cut opens, either side of it */
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    for (let q = 0; q < 8; q++) {
      const t = (q + 0.5) / 8, p = mid(a, b, lerp(0.3, 0.7, t)), side = q % 2 ? 1 : -1, out: P = [p[0] - Math.sin(ang) * side * 70 * k, p[1] + Math.cos(ang) * side * 70 * k];
      const el = piece(pc(x, q % 3 ? '#7ff0ff' : '#ffffff', 18 * k), 'sp-foam');
      animate(el, [{ transform: tr(p) + ' scale(.4)', opacity: 1 }, { transform: tr(out) + ' scale(1.1)', opacity: 0 }], { duration: 520, easing: 'ease-out', fill: 'both' }).then(gone(el));
    }
    ring(e[0], e[1], '#7ff0ff', 300 * k, 620); ring(e[0], e[1], '#ffffff', 220 * k, 520, true);
    tint(x);
  });
}

/* ---------- a re-entry from orbit ---------- */
/** the caster leaps out of the top of the screen; a moment later it comes back down from the corner of the sky in a
    ball of fire, with its trail and its sparks, onto the one hit; the shock wave goes out along the ground */
function meteor(x: Ctx): Promise<void> {
  const k = x.k, m = mv(x.from), e = x.end, g = ground(x), d = way(x), start: P = [e[0] - d * 360 * k, -60 * k], D = 760, o = '50% 100%';
  sfx('whoosh');
  if (m) animate(m, [{ transform: 'none', transformOrigin: o, opacity: 1 }, { transform: 'translate(0,8px) scale(1.1,.9)', offset: 0.12, transformOrigin: o, opacity: 1 }, { transform: 'translate(0,-420px) scale(.8,1.2)', offset: 0.4, transformOrigin: o, opacity: 1 },
    { transform: 'translate(0,-420px)', offset: 0.85, opacity: 0, transformOrigin: o }, { transform: 'none', opacity: 1, transformOrigin: o }], { duration: 2000, easing: 'ease-in-out' });
  return sleep(700).then(function () {
    sfx('plane');
    /* the fire ball: a glowing core, the outline, the flames behind it */
    const fb = '<svg viewBox="-60 -60 120 120" aria-hidden="true"><path d="M-10 -26 Q-58 -40 -60 -6 Q-44 -12 -40 0 Q-58 10 -54 30 Q-36 16 -26 22 Z" fill="#ff7a2a" stroke="' + INK + '" stroke-width="3" transform="rotate(' + (d > 0 ? 0 : 180) + ')"/>' +
      '<circle r="26" fill="#ffd36b" stroke="' + INK + '" stroke-width="4"/><circle r="17" fill="#ffffff" opacity=".8"/><circle r="30" fill="none" stroke="#ff7a2a" stroke-width="3" opacity=".7"/></svg>';
    const el = big(fb, 'sp-meteor', 110 * k, 110 * k), ang = Math.atan2(e[1] - start[1], e[0] - start[0]) * 180 / Math.PI;
    animate(el, along(function (t) { return mid(start, x.miss ? [e[0] + d * 60 * k, g[1]] : e, t * t); }, 10, function (t) { return 'rotate(' + (ang - (d > 0 ? 0 : 180)).toFixed(0) + 'deg) scale(' + lerp(0.6, 1.25, t).toFixed(2) + ')'; }), { duration: D, easing: 'linear', fill: 'both' }).then(gone(el));
    const L = layer(beam('M' + start[0].toFixed(1) + ' ' + start[1].toFixed(1) + ' L' + e[0].toFixed(1) + ' ' + e[1].toFixed(1), '#ff9f1c', 14 * k));
    L.querySelectorAll('path[pathLength]').forEach(function (q) { (q as SVGPathElement).style.strokeDasharray = '1 1'; animate(q, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: D, easing: 'cubic-bezier(.11,0,.5,0)', fill: 'both' }); });
    animate(L, [{ opacity: 0.9 }, { opacity: 0.9, offset: 0.75 }, { opacity: 0 }], { duration: D + 300, fill: 'both' }).then(gone(L));
    for (let q = 0; q < 6; q++) sleep(D * (0.2 + q * 0.12)).then(function () { const p = mid(start, e, Math.pow(0.2 + q * 0.12, 2)); sparks(p[0], p[1], 2, function () { return PROPS.flame('#ffb347', 16); }, 40 * k, 420); });
    return sleep(D);
  }).then(function () {
    sfx('thunder');
    quakeArena(560, 12 * k);
    flash('#ffd36b', 420, 0.8);
    ring(g[0], g[1], '#ff9f1c', 420 * k, 700, true); sleep(120).then(function () { ring(g[0], g[1], '#ffffff', 340 * k, 600, true); });
    sparks(g[0], g[1] - 8, 10, dust, 160 * k, 640);
    if (x.miss) return;
    const s = piece(boom('#ffd36b'), 'sp-burst', 200 * k);
    animate(s, [{ transform: tr(e) + ' scale(.2)', opacity: 1 }, { transform: tr(e) + ' scale(1)', opacity: 1, offset: 0.3 }, { transform: tr(e) + ' scale(1.4)', opacity: 0 }], { duration: 560, easing: 'ease-out', fill: 'both' }).then(gone(s));
    tint(x);
  });
}

/* ---------- the Trinità ---------- */
/** three moons rise round the one hit, turn, and close on it into a triangle of light: the three of the Trinità */
function triad(x: Ctx): Promise<void> {
  const k = x.k, e = x.end, r = 95 * k, lead = 300, turn = 900;
  sfx('magic');
  const lift = veilOn(0.45);
  sleep(lead + turn + 200).then(function () { lift(500); });
  const at = function (q: number, t: number): P { const a = -Math.PI / 2 + q * Math.PI * 2 / 3 + t * Math.PI * 0.9, rr = r * (1 - 0.82 * Math.pow(Math.max(0, t - 0.55) / 0.45, 2)); return [e[0] + Math.cos(a) * rr, e[1] + Math.sin(a) * rr * 0.8]; };
  const moon = '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="16" fill="#efe6ff" stroke="' + INK + '" stroke-width="3"/><circle cx="26" cy="15" r="13" fill="#3b2f52"/></svg>';
  const moons = [0, 1, 2].map(function (q) {
    const el = piece(moon, 'sp-moonlet', 40 * k);
    animate(el, ([{ transform: tr(at(q, 0)) + ' scale(.2)', opacity: 0 }] as Keyframe[]).concat(along(function (t) { return at(q, t); }, 12, function (t) { return 'scale(' + lerp(1, 0.6, Math.max(0, t - 0.6) / 0.4).toFixed(2) + ') rotate(' + (t * 200).toFixed(0) + 'deg)'; }).map(function (f0, i) { return Object.assign(f0, { offset: (lead + turn * i / 12) / (lead + turn) }); })),
      { duration: lead + turn, easing: 'ease-in', fill: 'both' }).then(gone(el));
    return el;
  });
  void moons;
  /* the triangle traced between them, while they turn */
  return sleep(lead + turn * 0.35).then(function () {
    const tri = [0, 1, 2].map(function (q) { return at(q, 0.4); });
    const d0 = 'M' + tri.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L') + ' Z';
    const L = layer(beam(d0, '#ffd34d', 6 * k));
    trace(L, 360); animate(L, [{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: turn * 0.65 + 200, fill: 'both' }).then(gone(L));
    return sleep(turn * 0.65);
  }).then(function () {
    if (x.miss) return;
    sfx('thunder');
    flashAt(e[0], e[1], '#ffd34d', 300 * k, 300);
    ring(e[0], e[1], '#c9a6ff', 300 * k, 620); ring(e[0], e[1], '#ffd34d', 220 * k, 540);
    burst(x, e, 9, 140, 700);
    const m = mv(x.to); if (m) pulse(m, 'shadowed', 900);
    tint(x);
  });
}

/* ---------- Caesar's triumph ---------- */
function eagleSvg(): string {
  return '<svg viewBox="0 0 120 150" aria-hidden="true"><path d="M60 40 V146" stroke="' + INK + '" stroke-width="8" stroke-linecap="round"/><path d="M60 40 V146" stroke="#9a6a3a" stroke-width="4" stroke-linecap="round"/>' +
    '<path d="M60 18 Q40 4 14 14 Q34 20 40 28 Q22 30 8 44 Q34 40 52 36 L68 36 Q86 40 112 44 Q98 30 80 28 Q86 20 106 14 Q80 4 60 18Z" fill="#e8c547" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>' +
    '<circle cx="60" cy="22" r="7" fill="#e8c547" stroke="' + INK + '" stroke-width="3"/><path d="M65 21 L74 24 L65 27Z" fill="#b08a1f"/>' +
    '<rect x="40" y="48" width="40" height="26" rx="2" fill="#6b2a8c" stroke="' + INK + '" stroke-width="3"/><text x="60" y="66" text-anchor="middle" font-size="13" font-family="Georgia,serif" font-weight="700" fill="#e8c547">SPQF</text></svg>';
}
/** the eagle of the legion rises behind the caster, and the three words go to the one hit one after the other, each a
    blow: VENI, VIDI, VICI; a crown of laurel falls on the caster's head at the end */
function triumph(x: Ctx): Promise<void> {
  const k = x.k, f = body(x.from, x.from === 0 ? 0.6 : 0.4, 0.3), e = x.end, d = way(x), words = x.words && x.words.length ? x.words : ['VENI', 'VIDI', 'VICI'], gap = 340, fly = 360;
  const eh = 170 * k, ew = eh * 120 / 150, base: P = [body(x.from, 0.5, 0.5)[0] - d * 70 * k, anchor(x.from, 0.5, 0.95)[1]], el = big(eagleSvg(), 'sp-eagle', ew, eh, '50% 100%');
  const at = 'translate(' + (base[0] - ew / 2).toFixed(1) + 'px,' + (base[1] - eh).toFixed(1) + 'px)', D = words.length * gap + fly + 600;
  animate(el, [{ transform: at + ' scaleY(0)', opacity: 1 }, { transform: at + ' scaleY(1.06)', opacity: 1, offset: 0.16 }, { transform: at + ' scaleY(1)', opacity: 1, offset: 0.25 }, { transform: at + ' scaleY(1)', opacity: 1, offset: 0.85 }, { transform: at + ' scaleY(1)', opacity: 0 }],
    { duration: D, easing: 'ease-out', fill: 'both' }).then(gone(el));
  sfx('speech');
  words.forEach(function (w0, j) {
    sleep(260 + j * gap).then(function () {
      const sc = (1 + j * 0.35) * k, land: P = [e[0] + (j - 1) * 24 * k, e[1] + (j - 1) * 14 * k], cv = curve(f, land, 60 * k);
      const wel = word(w0, j === words.length - 1 ? '#e8c547' : '#b8322e', 'sp-roman');
      animate(wel, along(cv.at, 10, function (t) { return 'scale(' + lerp(0.4, sc, t).toFixed(2) + ') rotate(' + (-6 + j * 6) + 'deg)'; }, function (t) { return x.miss && t > 0.92 ? 0 : 1; }), { duration: fly, easing: 'ease-in', fill: 'both' }).then(function () {
        if (x.miss) { wel.remove(); return; }
        sfx('hit'); flashAt(land[0], land[1], '#e8c547', 150 * k, 220);
        animate(wel, [{ transform: tr(land) + ' scale(' + sc.toFixed(2) + ')', opacity: 1 }, { transform: tr([land[0], land[1] - 20]) + ' scale(' + (sc * 1.08).toFixed(2) + ')', opacity: 1, offset: 0.5 }, { transform: tr([land[0] + d * 40, land[1] + 50]) + ' scale(' + sc.toFixed(2) + ') rotate(' + d * 30 + 'deg)', opacity: 0 }],
          { duration: 600, easing: 'ease-in', fill: 'both' }).then(gone(wel));
      });
    });
  });
  return sleep(260 + (words.length - 1) * gap + fly).then(function () {
    if (x.miss) return;
    ring(e[0], e[1], '#e8c547', 300 * k, 620);
    burst(x, e, 9, 140, 720);
    tint(x);
    /* the laurel on the caster */
    const h = anchor(x.from, 0.5, 0.08), lw = 70 * k;
    let lf = '<svg viewBox="-40 -20 80 40" aria-hidden="true">';
    for (let side = -1; side <= 1; side += 2) for (let i = 0; i < 5; i++) { const t = i / 4, xx = side * (6 + 26 * t), yy = -4 + t * t * 14; lf += '<ellipse cx="' + xx.toFixed(1) + '" cy="' + yy.toFixed(1) + '" rx="7" ry="3.4" fill="#7fb347" stroke="' + INK + '" stroke-width="1.6" transform="rotate(' + (side * (20 + i * 14)) + ' ' + xx.toFixed(1) + ' ' + yy.toFixed(1) + ')"/>'; }
    const lau = big(lf + '</svg>', 'sp-laurel', lw, lw / 2);
    animate(lau, [{ transform: tr([h[0], h[1] - 80 * k]) + ' scale(.6)', opacity: 0 }, { transform: tr(h) + ' scale(1)', opacity: 1, offset: 0.35 }, { transform: tr(h), opacity: 1, offset: 0.8 }, { transform: tr(h), opacity: 0 }], { duration: 1100, easing: 'ease-out', fill: 'both' }).then(gone(lau));
  });
}

/* ---------- the freestyle ---------- */
/** a microphone rises in front of the caster; on the beat (four thumps, the speakers pumping) the words go out one
    syllable at a time, the last one long, «STAI IN-GUA-IA-TOOOO», and the last lands with the drop */
function freestyle(x: Ctx): Promise<void> {
  const k = x.k, f = body(x.from, x.from === 0 ? 0.68 : 0.32, 0.42), e = x.end, d = way(x), beat = 230, words = x.words && x.words.length ? x.words : ['STAI', 'IN', 'GUA', 'IA', 'TOOOO'];
  const mic = '<svg viewBox="0 0 40 90" aria-hidden="true"><rect x="16" y="34" width="8" height="52" rx="3" fill="#2b2f3a" stroke="' + INK + '" stroke-width="3"/><circle cx="20" cy="20" r="16" fill="#8a93a8" stroke="' + INK + '" stroke-width="4"/>' +
    '<path d="M8 14h24M6 20h28M8 26h24" stroke="' + INK + '" stroke-width="1.6" opacity=".6"/><circle cx="14" cy="14" r="3" fill="#ffffff" opacity=".7"/></svg>';
  const mh = 90 * k, mw = mh * 40 / 90, me = big(mic, 'sp-mic', mw, mh), mp: P = [f[0] + d * 26 * k, f[1] + 6 * k], D = 300 + words.length * beat + 500;
  animate(me, [{ transform: tr([mp[0], mp[1] + 40 * k]) + ' rotate(' + d * 20 + 'deg)', opacity: 0 }, { transform: tr(mp) + ' rotate(' + d * 14 + 'deg)', opacity: 1, offset: 0.15 },
    { transform: tr(mp) + ' rotate(' + d * 8 + 'deg)', opacity: 1, offset: 0.85 }, { transform: tr(mp), opacity: 0 }], { duration: D, easing: 'ease-out', fill: 'both' }).then(gone(me));
  const m = mv(x.from);
  for (let q = 0; q < words.length; q++) sleep(300 + q * beat).then(function () {
    const last = q === words.length - 1;
    sfx(last ? 'airhorn' : 'thump');
    if (m) animate(m, [{ transform: 'none' }, { transform: 'translateY(-6px) scale(1.04)', offset: 0.3 }, { transform: 'none' }], { duration: beat * 0.9, easing: 'ease-out' });
    ring(f[0], f[1], q % 2 ? '#62f07a' : '#ff5fd2', 120 * k, 360);
    const start: P = [mp[0] + d * 10 * k, mp[1] - 20 * k], land: P = last ? e : mid(start, e, 0.25 + q * 0.14), lift: P = [land[0], land[1] - (last ? 0 : 50 * k + (q % 2) * 26 * k)];
    const w = word(words[q], last ? '#62f07a' : q % 2 ? '#ffd34d' : '#ff5fd2', last ? 'sp-long' : '');
    const sc = (last ? 1.5 : 0.85 + q * 0.12) * k;
    animate(w, [{ transform: tr(start) + ' scale(.3) rotate(' + -d * 10 + 'deg)', opacity: 0 }, { transform: tr(lift) + ' scale(' + sc.toFixed(2) + ') rotate(' + (q % 2 ? 8 : -8) + 'deg)', opacity: 1, offset: 0.3 },
      { transform: tr(lift) + ' scale(' + (sc * 1.05).toFixed(2) + ') rotate(' + (q % 2 ? 6 : -6) + 'deg)', opacity: 1, offset: last ? 0.85 : 0.6 }, { transform: tr([lift[0], lift[1] - 30 * k]) + ' scale(' + sc.toFixed(2) + ')', opacity: 0 }],
      { duration: last ? 1100 : 900, easing: 'ease-out', fill: 'both' }).then(gone(w));
  });
  return sleep(300 + (words.length - 1) * beat + 150).then(function () {
    quakeArena(480, 9 * k);
    if (x.miss) return;
    flash('#62f07a', 380, 0.5);
    ring(e[0], e[1], '#62f07a', 320 * k, 620); ring(e[0], e[1], '#ffffff', 240 * k, 520);
    burst(x, e, 10, 150, 720);
    tint(x);
  });
}

/* ---------- an ensō ---------- */
/** a brush paints a circle of ink round the one hit, in one stroke, open where it starts; the circle closes in on it and
    drinks a little of its strength back to the caster (a drain), drops of ink flying */
function enso(x: Ctx): Promise<void> {
  const k = x.k, e = x.end, r = 82 * k, f = body(x.from, 0.5, 0.45);
  sfx('shimmer');
  const a0 = -Math.PI * 0.35, a1 = a0 + Math.PI * 1.85, pt = function (a: number, rr: number) { return [e[0] + Math.cos(a) * rr, e[1] + Math.sin(a) * rr]; };
  const p0 = pt(a0, r), p1 = pt(a1, r), d0 = 'M' + p0[0].toFixed(1) + ' ' + p0[1].toFixed(1) + ' A' + r.toFixed(1) + ' ' + r.toFixed(1) + ' 0 1 1 ' + p1[0].toFixed(1) + ' ' + p1[1].toFixed(1);
  const L = layer('<path d="' + d0 + '" pathLength="1" stroke="' + INK + '" stroke-width="' + (22 * k).toFixed(1) + '" opacity=".85"/><path d="' + d0 + '" pathLength="1" stroke="#3a3a46" stroke-width="' + (14 * k).toFixed(1) + '"/>' +
    '<path d="' + d0 + '" pathLength="1" stroke="#ffd27a" stroke-width="' + (3 * k).toFixed(1) + '" opacity=".8"/>');
  return trace(L, 620).then(function () {
    sparks(p1[0], p1[1], 5, function () { return '<i class="sp-ink"></i>'; }, 60 * k, 420);
    /* it closes in */
    const o = e[0].toFixed(1) + 'px ' + e[1].toFixed(1) + 'px';
    animate(L, [{ transform: 'scale(1)', transformOrigin: o, opacity: 1 }, { transform: 'scale(.55)', transformOrigin: o, opacity: 1, offset: 0.7 }, { transform: 'scale(.4)', transformOrigin: o, opacity: 0 }], { duration: 460, easing: 'ease-in', fill: 'both' }).then(gone(L));
    return sleep(330);
  }).then(function () {
    if (x.miss) return;
    sfx('magic');
    flashAt(e[0], e[1], '#ffd27a', 220 * k, 260);
    ring(e[0], e[1], '#ffd27a', 240 * k, 560);
    /* the strength drunk back to the caster */
    for (let q = 0; q < 6; q++) sleep(q * 60).then(function () {
      const el = piece(pc(x, '#ffd27a', 16 * k), 'sp-drink'), cv = curve(e, f, (q % 2 ? 1 : -1) * 50 * k);
      animate(el, along(cv.at, 10, function (t) { return 'scale(' + lerp(1, 0.5, t).toFixed(2) + ')'; }), { duration: 520, easing: 'ease-in', fill: 'both' }).then(gone(el));
    });
    tint(x);
  });
}

/* ---------- a proof ---------- */
/** the caster writes in the air, over the one hit: a right triangle, its three squares, «a²+b²=c²»; the figure lights
    up when it is finished (Q.E.D.) and falls on the one hit */
function proof(x: Ctx): Promise<void> {
  const k = x.k, e = x.end, s = 2.3 * k, o: P = [e[0] - 12 * s, e[1] - 118 * k + 9 * s], mc = '#c3a0ff';
  sfx('magic');
  const P0 = function (px: number, py: number) { return (o[0] + px * s).toFixed(1) + ' ' + (o[1] + py * s).toFixed(1); };
  /* right angle at (0 0), legs 24 and 18 */
  const fig = beam('M' + P0(0, 0) + ' L' + P0(24, 0) + ' L' + P0(0, -18) + ' Z', '#fff7d6', 3.4 * k) +
    beam('M' + P0(0, 0) + ' L' + P0(24, 0) + ' L' + P0(24, 24) + ' L' + P0(0, 24) + ' Z', mc, 2.6 * k) +
    beam('M' + P0(0, 0) + ' L' + P0(0, -18) + ' L' + P0(-18, -18) + ' L' + P0(-18, 0) + ' Z', mc, 2.6 * k) +
    beam('M' + P0(24, 0) + ' L' + P0(0, -18) + ' L' + P0(18, -42) + ' L' + P0(42, -24) + ' Z', mc, 2.6 * k);
  const L = layer(fig);
  const eq = word('a²+b²=c²', '#c3a0ff', 'sp-math'), eqAt: P = [o[0] + 12 * s, o[1] - 52 * s];
  animate(eq, [{ transform: tr(eqAt) + ' scale(.4)', opacity: 0 }, { transform: tr(eqAt) + ' scale(' + (0.8 * k).toFixed(2) + ')', opacity: 1, offset: 0.3 }, { transform: tr(eqAt) + ' scale(' + (0.8 * k).toFixed(2) + ')', opacity: 1, offset: 0.8 }, { transform: tr(eqAt), opacity: 0 }], { duration: 1500, easing: 'ease-out', fill: 'both' }).then(gone(eq));
  return trace(L, 760).then(function () {
    sfx('blip');
    const qed = word('Q.E.D.', '#ffd34d'), at: P = [o[0] - 22 * s, o[1] + 12 * s];
    animate(qed, [{ transform: tr(at) + ' scale(.3)', opacity: 0 }, { transform: tr(at) + ' scale(' + (0.7 * k).toFixed(2) + ')', opacity: 1, offset: 0.3 }, { transform: tr(at) + ' scale(' + (0.7 * k).toFixed(2) + ')', opacity: 0 }], { duration: 700, fill: 'both' }).then(gone(qed));
    const oo = e[0].toFixed(1) + 'px ' + o[1].toFixed(1) + 'px';
    return animate(L, [{ transform: 'translate(0,0)', transformOrigin: oo, opacity: 1 }, { transform: 'translate(0,-12px) scale(1.05)', transformOrigin: oo, opacity: 1, offset: 0.4 }, { transform: 'translate(0,' + (110 * k).toFixed(0) + 'px) scale(.7)', transformOrigin: oo, opacity: 1, offset: 0.92 }, { transform: 'translate(0,' + (110 * k).toFixed(0) + 'px) scale(.7)', transformOrigin: oo, opacity: 0 }],
      { duration: 620, easing: 'ease-in', fill: 'both' }).then(gone(L));
  }).then(function () {
    if (x.miss) { sparks(ground(x)[0], ground(x)[1], 6, dust, 70 * k, 420); return; }
    sfx('thunder');
    quakeArena(320, 6 * k);
    flashAt(e[0], e[1], '#c3a0ff', 260 * k, 280);
    ring(e[0], e[1], '#c3a0ff', 280 * k, 600); ring(e[0], e[1], '#ffd34d', 200 * k, 520, true);
    burst(x, e, 8, 130, 680);
    tint(x);
  });
}

export const COMPANION_SCENES = {
  roar: { run: roar, foe: 'recoil', n: 3, impact: true },
  ace: { run: ace, foe: 'recoil', impact: true },
  blade: { run: blade, foe: 'shake', impact: true },
  meteor: { run: meteor, foe: 'squash', impact: true },
  triad: { run: triad, foe: 'sink', impact: true },
  triumph: { run: triumph, foe: 'recoil', impact: true },
  freestyle: { run: freestyle, foe: 'shake', impact: true },
  enso: { run: enso, foe: 'sink', impact: true },
  proof: { run: proof, foe: 'squash', impact: true }
} satisfies Record<string, StageDef>;
