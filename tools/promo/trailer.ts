import '../../src/styles/tokens.css';
import '../../src/styles/fonts.css';
import '../../src/styles/sprites.css';
import { SPR, person, esame } from '../../src/render/svg';
import { creature, runeIcon, MAGIC, MAGIC_CSS } from '../../src/render/svg/creatures';
import { scene, sceneInfo } from '../../src/render/svg/scenes';
import { CHARS, type FriendId } from '../../src/data/characters';
import { COVI } from '../../src/data/covi';
import { badgeSVG } from '../../src/render/svg/badges';
import { SPECIES, type SpeciesId } from '../../src/data/creatures';
import type { TypeName } from '../../src/data/types';
import networkSrc from '../formia/network.ts?raw';
import daytimeSrc from '../../src/story/daytime.ts?raw';
import viewSrc from '../../src/render/world-view.ts?raw';
import buildSrc from '../formia/build.ts?raw';
import { city, glide, type Cam, type Light } from './city3d';
import { FPS, fr, FRAMES } from './timeline';

/* The trailer's pictures. Every frame is a pure function of its number: renderAt(f) builds or updates the shots
   that are on at f and waits for their pictures, then compose.ts takes a screenshot. The shots are listed below in
   order, on the music's beats (fr(bar, beat) from timeline.ts); the game clips come from capture.ts (/clips/…), the
   flights over Formia from city3d.ts. A caption stays a bar at least, so there is time to read it. */

const W = 1920, H = 1080;
const INK = '#1f2c6e', PAPER = '#f7f6f0', RED = '#e0533d', NAVY = '#0f1430', LINE = '#1c2340';
const TYPE: Record<string, string> = { Calma: '#8fd0f6', Caos: '#ffa35a', Cervello: '#bba0ff', Chiacchiera: '#ffe45c', Cuore: '#ff8fc1' };
const stage = document.getElementById('stage') as HTMLDivElement;

/* ---------- motion ---------- */
const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const span = (f: number, a: number, b: number) => clamp((f - a) / Math.max(1, b - a));
const E = {
  out: (t: number) => 1 - Math.pow(1 - t, 3),
  out5: (t: number) => 1 - Math.pow(1 - t, 5),
  in: (t: number) => t * t * t,
  inOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  sine: (t: number) => 0.5 - 0.5 * Math.cos(Math.PI * t),
  back: (t: number) => { const c1 = 1.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
};
/** a repeatable random number for i */
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function div(parent: HTMLElement, cls: string, html = '', style = ''): HTMLDivElement {
  const d = document.createElement('div'); d.className = cls; if (html) d.innerHTML = html; if (style) d.style.cssText = style; parent.appendChild(d); return d;
}

/* ---------- the game's clips ---------- */
let MAN: Record<string, number> = {};
function clipSrc(name: string, i: number) { const n = MAN[name] || 1; return '/clips/' + name + '/' + String(Math.max(1, Math.min(n, Math.round(i)))).padStart(4, '0') + '.jpg'; }
interface ClipO { at?: number; speed?: number; zoom?: [number, number]; x?: [number, number]; y?: [number, number]; origin?: string; filter?: string }
function clip(el: HTMLElement, name: string, o: ClipO = {}) {
  const img = document.createElement('img'); img.className = 'clip'; el.appendChild(img);
  if (o.origin) img.style.transformOrigin = o.origin;
  return function (k: K, extra = '') {
    const sp = o.speed == null ? 1 : o.speed, at = o.at == null ? 1 : o.at;
    /* a negative start counts from the clip's end, so the shot ends on its last frame */
    const src = clipSrc(name, (at < 0 ? (MAN[name] || 1) + 1 + at - k.n * sp : at) + k.f * sp);
    if (img.getAttribute('src') !== src) img.src = src;
    const e = E.inOut(k.p), z = o.zoom ? mix(o.zoom[0], o.zoom[1], e) : 1;
    const x = o.x ? mix(o.x[0], o.x[1], e) : 0, y = o.y ? mix(o.y[0], o.y[1], e) : 0;
    img.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + z + ')' + extra;
    if (o.filter) img.style.filter = o.filter;
  };
}

/* ---------- words ---------- */
/** a word as a sticker: white letters, a thick ink outline and a hard shadow, like the game's buttons */
function sticker(text: string, size: number, color = '#fff', ink = INK, font = 'Lilita One'): string {
  const w = Math.max(3, Math.round(size * 0.085));
  return '<span class="stk" style="font-size:' + size + 'px;font-family:\'' + font + '\'">' +
    '<span class="stk-b" style="-webkit-text-stroke:' + (w * 2) + 'px ' + ink + ';color:' + ink + ';text-shadow:' + Math.round(w * 0.8) + 'px ' + Math.round(w * 1.1) + 'px 0 ' + ink + '">' + esc(text) + '</span>' +
    '<span class="stk-f" style="color:' + color + '">' + esc(text) + '</span></span>';
}
interface Cap { el: HTMLDivElement; words: HTMLElement[]; hi: HTMLElement | null }
/** a caption: words that pop up one after the other over a highlighter stroke */
function caption(parent: HTMLElement, text: string, o: { x?: number; y?: number; size?: number; hi?: string; align?: 'left' | 'center' | 'right'; color?: string; font?: string; width?: number } = {}): Cap {
  const el = div(parent, 'cap'), size = o.size || 92;
  el.style.fontSize = size + 'px';
  el.style.left = (o.x == null ? W / 2 : o.x) + 'px'; el.style.top = (o.y == null ? 900 : o.y) + 'px';
  el.style.textAlign = o.align || 'center';
  el.style.transform = o.align === 'left' ? 'translate(0,-50%)' : o.align === 'right' ? 'translate(-100%,-50%)' : 'translate(-50%,-50%)';
  if (o.width) el.style.width = o.width + 'px';
  const hi = o.hi ? div(el, 'hi', '', 'background:' + o.hi) : null;
  const words = text.split(' ').map(function (w) { const s = document.createElement('span'); s.className = 'w'; s.innerHTML = sticker(w, size, o.color, INK, o.font); el.appendChild(s); el.appendChild(document.createTextNode(' ')); return s; });
  return { el, words, hi };
}
/** shows a caption from local frame a, word by word; it leaves at frame b (if given) */
function showCap(c: Cap, f: number, a = 0, b?: number, step = 2) {
  c.words.forEach(function (w, i) {
    const t = span(f, a + i * step, a + i * step + 9), out = b == null ? 0 : span(f, b - 4, b);
    const s = mix(0.4, 1, E.back(t));
    w.style.opacity = String(clamp(t * 3) * (1 - out));
    w.style.transform = 'translateY(' + (mix(60, 0, E.out(t)) - out * 40) + 'px) scale(' + s + ') rotate(' + mix(-8 + rnd(i) * 16, 0, E.out(t)) + 'deg)';
  });
  if (c.hi) {
    const t = span(f, a, a + 7), out = b == null ? 0 : span(f, b - 4, b);
    c.hi.style.transform = 'skewX(-12deg) scaleX(' + E.out(t) * (1 - out) + ')';
  }
}
/** a whisper: white handwritten words that come out of the dark letter by letter, and go back into it */
function whisper(parent: HTMLElement, text: string, y = 880, size = 80) {
  const el = div(parent, 'wh', '', 'top:' + y + 'px;font-size:' + size + 'px');
  const letters = Array.from(text).map(function (ch) { const s = document.createElement('span'); s.textContent = ch; el.appendChild(s); return s; });
  return function (f: number, a: number, b: number) {
    letters.forEach(function (s, i) {
      const t = E.out(span(f, a + i * 0.9, a + i * 0.9 + 16)), out = span(f, b - 12, b);
      s.style.opacity = String(t * (1 - out));
      s.style.filter = 'blur(' + ((1 - t) * 9 + out * 7) + 'px)';
      s.style.transform = 'translateY(' + ((1 - t) * 16 - out * 12) + 'px)';
    });
  };
}
/** the place card of the game's HUD: FORMIA, and the name of the place */
function placeCard(parent: HTMLElement, name: string, kicker = 'FORMIA') { return div(parent, 'place', '<small>' + esc(kicker) + '</small><b>' + esc(name) + '</b>'); }
function showPlace(el: HTMLElement, f: number, n: number) {
  const t = E.back(span(f, 2, 12)), out = span(f, n - 4, n);
  el.style.transform = 'translateX(' + (mix(-520, 0, t) - out * 40) + 'px) rotate(' + mix(-6, -1.5, t) + 'deg)';
  el.style.opacity = String(1 - out);
}

/* ---------- code, in the background of the dream ---------- */
const KW = /^(const|let|var|function|return|if|else|for|while|export|import|from|type|interface|new|true|false|null|of|in|as)$/;
function tokens(src: string): { t: string; c: string }[] {
  const out: { t: string; c: string }[] = [], re = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*")|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)(?=\s*:)|([A-Za-z_$][\w$]*)|(\s+)|([\s\S])/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    const c = m[1] ? 'cm' : m[2] ? 'st' : m[3] ? 'nu' : m[4] ? 'pr' : m[5] ? (KW.test(m[5]) ? 'kw' : 'id') : m[6] ? '' : 'pu';
    out.push({ t: m[0], c });
  }
  return out;
}
function codeHtml(toks: { t: string; c: string }[], chars: number): string {
  let n = 0, s = '';
  for (const tk of toks) {
    if (n >= chars) break;
    const part = tk.t.slice(0, chars - n); n += part.length;
    s += tk.c ? '<span class="' + tk.c + '">' + esc(part) + '</span>' : esc(part);
  }
  return s;
}
function excerpt(src: string, marker: string, lines: number): string {
  const all = src.split('\n'), i = Math.max(0, all.findIndex(function (l) { return l.indexOf(marker) >= 0; }));
  return all.slice(i, i + lines).map(function (l) { return l.length > 84 ? l.slice(0, 82) + ' …' : l; }).join('\n');
}
interface Editor { el: HTMLDivElement; body: HTMLElement; toks: { t: string; c: string }[] }
function editor(parent: HTMLElement, file: string, code: string, style = ''): Editor {
  const el = div(parent, 'editor', '<div class="bar"><i></i><i></i><i></i><span>' + esc(file) + '</span></div><div class="code"><pre class="gut"></pre><pre class="body"></pre></div>', style);
  (el.querySelector('.gut') as HTMLElement).textContent = Array.from({ length: code.split('\n').length }, function (_, i) { return String(i + 1); }).join('\n');
  return { el, body: el.querySelector('.body') as HTMLElement, toks: tokens(code) };
}

/* ---------- drawings ---------- */
function sceneLayer(parent: HTMLElement, id: string, night: boolean) { return div(parent, 'scene', scene(id, night)); }
const paper = (parent: HTMLElement, tint = PAPER) => div(parent, 'paper', '', 'background-color:' + tint);
/** the little shapes each type's magic is made of, as in the game's battles: moons, bolts, stars, notes, hearts */
const SHAPE: Record<string, string> = {
  Calma: 'M15 3a9 9 0 1 0 6 15A10 10 0 0 1 15 3Z',
  Caos: 'M13 2L5 14h6l-2 8 9-13h-6l3-7Z',
  Cervello: 'M12 2l2.6 7.4L22 12l-7.4 2.6L12 22l-2.6-7.4L2 12l7.4-2.6Z',
  Chiacchiera: 'M10 18V5l10-2v12M10 18a3 3 0 1 1-3-3 3 3 0 0 1 3 3ZM20 15a3 3 0 1 1-3-3 3 3 0 0 1 3 3Z',
  Cuore: 'M12 21C5 16 2 12 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-3 8-10 13Z'
};
function shape(type: string, col: string, size: number): string {
  return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" aria-hidden="true"><path d="' + SHAPE[type] + '" fill="' + col + '" stroke="' + LINE + '" stroke-width="1.6" stroke-linejoin="round"/></svg>';
}
/** the comic-book star of a hit, as in the game */
const POW = '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4l9 25 26-10-12 24 25 9-25 9 12 24-26-10-9 25-9-25-26 10 12-24-25-9 25-9-12-24 26 10Z" fill="#fffbe6" stroke="' + LINE + '" stroke-width="4" stroke-linejoin="round"/></svg>';
/** what the creature sees of itself when it casts: an octopus its tentacles, a gull its wings (drawn here, in the game's style) */
function limb(id: SpeciesId): string {
  const a = SPECIES[id].art;
  if (a.body === 'bird') {
    return '<svg viewBox="0 0 520 760" aria-hidden="true"><path d="M-10 770C30 600 150 450 360 350C420 322 470 318 486 338C456 350 436 360 462 378C416 390 396 400 420 418C366 430 346 442 366 464C306 474 286 494 306 516C238 534 206 580 214 770Z" fill="' + a.main + '" stroke="' + LINE + '" stroke-width="10" stroke-linejoin="round"/>' +
      '<path d="M372 362C410 352 446 350 470 358M352 416C380 410 400 408 414 412M300 470C326 466 344 466 358 468" fill="none" stroke="' + a.dark + '" stroke-width="9" stroke-linecap="round"/></svg>';
  }
  /* an octopus: a tentacle along a curve, wide at the bottom and thin at the tip, with its suckers */
  const P = [[150, 800], [70, 480], [440, 470], [330, 170]];
  const at = function (t: number, d: number) {
    const u = 1 - t;
    if (!d) return [0, 1].map(function (c) { return u * u * u * P[0][c] + 3 * u * u * t * P[1][c] + 3 * u * t * t * P[2][c] + t * t * t * P[3][c]; });
    return [0, 1].map(function (c) { return 3 * u * u * (P[1][c] - P[0][c]) + 6 * u * t * (P[2][c] - P[1][c]) + 3 * t * t * (P[3][c] - P[2][c]); });
  };
  const left: string[] = [], right: string[] = [], cups: string[] = [];
  for (let i = 0; i <= 28; i++) {
    const t = i / 28, p = at(t, 0), q = at(t, 1), l = Math.hypot(q[0], q[1]), nx = -q[1] / l, ny = q[0] / l, w = 96 * Math.pow(1 - t, 0.85) + 12;
    left.push((p[0] + nx * w / 2).toFixed(1) + ' ' + (p[1] + ny * w / 2).toFixed(1));
    right.unshift((p[0] - nx * w / 2).toFixed(1) + ' ' + (p[1] - ny * w / 2).toFixed(1));
    if (i % 3 === 2 && t < 0.88) cups.push('<ellipse cx="' + (p[0] - nx * w * 0.2).toFixed(1) + '" cy="' + (p[1] - ny * w * 0.2).toFixed(1) + '" rx="' + (w * 0.2).toFixed(1) + '" ry="' + (w * 0.16).toFixed(1) + '" fill="' + a.belly + '" stroke="' + LINE + '" stroke-width="5"/>');
  }
  return '<svg viewBox="0 0 520 760" aria-hidden="true"><path d="M' + left.join(' L') + ' L' + right.join(' L') + 'Z" fill="' + a.main + '" stroke="' + LINE + '" stroke-width="10" stroke-linejoin="round"/>' + cups.join('') + '</svg>';
}
/** a fighter's card, like the game's: name, level, the bar of the PS */
function hud(parent: HTMLElement, id: SpeciesId, lv: number, side: 'me' | 'foe') {
  const sp = SPECIES[id];
  const el = div(parent, 'hud ' + side, '<div class="top"><b>' + esc(sp.name) + '</b><small>Lv ' + lv + '</small></div><span class="ty" style="background:' + TYPE[sp.type] + '">' + esc(sp.type.toUpperCase()) + '</span><div class="hp"><i></i></div>');
  const bar = el.querySelector('.hp i') as HTMLElement;
  return { el, set: function (v: number) { bar.style.width = (v * 100) + '%'; bar.style.background = v > 0.5 ? '#57c968' : v > 0.2 ? '#ffd166' : RED; } };
}

/* the spell in the battle clip (checked on its contact sheet): from BATTLE_AT the arena darkens and the move's name
   crosses it on its banner; the moon leaves Polpino 19 frames later and lands on the Riccetto at BATTLE_HIT, two
   beats into the shot, with the number of the damage four frames after */
const BATTLE_AT = 147, BATTLE_HIT = BATTLE_AT + 30;

/* ---------- shots ---------- */
interface K { f: number; g: number; n: number; p: number }
interface Shot { from: number; to: number; z: number; build(el: HTMLDivElement): (k: K) => void }
const SHOTS: Shot[] = [];
function shot(from: number, to: number, build: (el: HTMLDivElement) => (k: K) => void, z = 0) { SHOTS.push({ from, to, z, build }); }
/** a game clip, full screen, with an optional caption and place card */
function clipShot(from: number, to: number, name: string, o: ClipO & { cap?: string; capY?: number; capSize?: number; hi?: string; place?: string; kicker?: string; capAt?: number } = {}) {
  shot(from, to, function (el) {
    const draw = clip(el, name, o);
    const cap = o.cap ? caption(el, o.cap, { y: o.capY || 930, size: o.capSize || 96, hi: o.hi }) : null;
    const pl = o.place ? placeCard(el, o.place, o.kicker) : null;
    return function (k) {
      draw(k);
      if (cap) showCap(cap, k.f, o.capAt == null ? 2 : o.capAt);
      if (pl) showPlace(pl, k.f, k.n);
    };
  });
}
/** Formia in 3D, from a camera gliding through the keys; more can be drawn over it */
function cityShot(from: number, to: number, mode: Light, keys: Cam[], over?: (el: HTMLDivElement) => (k: K) => void, ease = E.sine) {
  shot(from, to, function (el) {
    const draw = city(div(el, 'layer'), mode);
    const top = over ? over(el) : null;
    return function (k) {
      draw(glide(keys, ease(k.p)), k.g / FPS);
      if (top) top(k);
    };
  });
}

/* ===== INTRO: Formia at night, from the sea ===== */
cityShot(fr(0), fr(5), 'night', [
  { pos: [97, 1.4, 136], look: [94, 4, 60], fov: 36, magic: 0.8 },
  { pos: [95, 3.5, 104], look: [90, 4, 50], fov: 40, magic: 1 },
  { pos: [92, 8, 82], look: [84, 3, 42], fov: 44, magic: 2 },
  { pos: [86, 16, 66], look: [76, 1, 38], fov: 46, magic: 2.4 }
], function (el) {
  div(el, 'shade night');
  const w1 = whisper(el, 'C\'è una città sul mare…'), w2 = whisper(el, '…che nasconde un segreto.');
  const big = div(el, 'formia', sticker('FORMIA', 250));
  return function (k) {
    w1(k.f, fr(0, 2), fr(2)); w2(k.f, fr(2, 2), fr(4));
    const t = span(k.f, fr(4), fr(4) + 16);
    big.style.opacity = String(clamp(t * 2));
    big.style.letterSpacing = mix(70, 26, E.out(t)) + 'px';
    big.style.transform = 'translate(-50%,-50%) scale(' + mix(1.25, 1, E.out(t)) * (1 + span(k.f, fr(4) + 16, fr(5)) * 0.06) + ')';
    big.style.filter = 'drop-shadow(0 0 ' + (30 + 20 * Math.sin(k.f / 5)) + 'px rgba(255,214,140,.55))';
  };
});

/* ===== LOGO: over the gulf at dusk ===== */
cityShot(fr(5), fr(7), 'dusk', [
  { pos: [70, 24, 118], look: [88, 2, 46], fov: 42 },
  { pos: [112, 22, 116], look: [94, 2, 44], fov: 42 }
], function (el) {
  div(el, 'shade');
  const logo = div(el, 'logo', '<span class="hl"></span>' + sticker('Lotte tra Amici', 210));
  const hl = logo.querySelector('.hl') as HTMLElement;
  const tag = caption(el, 'Un\'avventura a turni nella Formia vera', { y: 760, size: 66, font: 'Patrick Hand' });
  const bits = div(el, 'bits');
  const cols = Object.values(TYPE);
  for (let i = 0; i < 46; i++) div(bits, 'bit', '', 'background:' + cols[i % cols.length] + ';border-radius:' + (i % 3 === 0 ? '50%' : '4px'));
  return function (k) {
    const t = span(k.f, 0, 10), out = span(k.f, 104, 120);
    logo.style.transform = 'translate(-50%,-50%) scale(' + (mix(2.4, 1, E.back(t)) * (1 + E.in(out) * 2.5)) + ') rotate(' + mix(-6, -2, E.out(t)) + 'deg)';
    logo.style.opacity = String(clamp(t * 4) * (1 - out));
    logo.style.filter = out > 0 ? 'blur(' + out * 30 + 'px)' : '';
    hl.style.transform = 'skewX(-10deg) scaleX(' + E.out(span(k.f, 6, 16)) + ')';
    showCap(tag, k.f, 20, 104);
    Array.from(bits.children).forEach(function (b, i) {
      const a = rnd(i) * Math.PI * 2, d = mix(0, 500 + rnd(i + 50) * 700, E.out5(span(k.f, 1, 44))), fall = Math.pow(span(k.f, 1, 120), 2) * 700;
      (b as HTMLElement).style.transform = 'translate(' + (Math.cos(a) * d) + 'px,' + (Math.sin(a) * d * 0.7 + fall) + 'px) rotate(' + (k.f * (rnd(i + 9) * 20 - 10)) + 'deg)';
      (b as HTMLElement).style.opacity = String(clamp(1 - span(k.f, 60, 110)));
    });
  };
}, E.inOut);

/* ===== THE FRIENDS ===== */
const FRIENDS: FriendId[] = ['antonio', 'costanzo', 'andrea', 'valentin', 'forchetta', 'zendavid'];
/* Antonio's line in the game says where the story ends: in the trailer, a mystery */
const TAG: Partial<Record<FriendId, string>> = { antonio: 'Formia è casa sua' };
shot(fr(7), fr(7, 2), function (el) {
  paper(el);
  const cap = caption(el, 'Sei amici.', { y: 170, size: 120, hi: TYPE.Chiacchiera });
  const row = div(el, 'row');
  const cards = FRIENDS.map(function (id) { return div(row, 'card', person(id, 'smirk'), 'background:' + TYPE[CHARS[id].type]); });
  return function (k) {
    showCap(cap, k.f, 0);
    cards.forEach(function (c, i) { const t = span(k.f, 2 + i * 2, 12 + i * 2); c.style.transform = 'translateY(' + mix(500, 0, E.back(t)) + 'px) rotate(' + mix(10 - i * 4, (i - 2.5) * 1.5, E.out(t)) + 'deg)'; });
  };
});
FRIENDS.forEach(function (id, i) {
  const c = CHARS[id];
  shot(fr(7, 2 + i * 3), fr(7, 5 + i * 3), function (el) {
    div(el, 'tbg', '', 'background-color:' + TYPE[c.type]);
    const pic = div(el, 'pic', person(id, i % 2 ? 'grin' : 'smirk'));
    const name = div(el, 'fname', sticker(c.name, 190));
    const chip = div(el, 'chip', esc(c.type.toUpperCase()), 'background:' + INK + ';color:' + TYPE[c.type]);
    const tag = div(el, 'ftag', esc(TAG[id] || c.tagline));
    return function (k) {
      const t = E.out(span(k.f, 0, 8));
      pic.style.transform = 'translate(' + mix(-120, 0, t) + 'px,0) scale(' + mix(1.12, 1.02, k.p) + ')';
      name.style.transform = 'translateX(' + mix(300, 0, E.back(span(k.f, 0, 7))) + 'px)';
      chip.style.transform = 'scale(' + E.back(span(k.f, 2, 8)) + ') rotate(-3deg)';
      tag.style.opacity = String(span(k.f, 4, 9)); tag.style.transform = 'translateY(' + mix(20, 0, E.out(span(k.f, 4, 11))) + 'px)';
    };
  });
});
shot(fr(12), fr(13), function (el) {
  div(el, 'boss-bg');
  const pic = div(el, 'esame', esame('angry'));
  const cap = caption(el, '…e un boss:', { x: 960, y: 330, size: 90, align: 'left' });
  const name = caption(el, 'l\'Esame di Controlli', { x: 960, y: 500, size: 96, align: 'left', color: '#ffd2c9' });
  const sub = div(el, 'bsub', 'Appello · 2 ore');
  return function (k) {
    const sh = k.f < 8 ? (rnd(k.f) - 0.5) * 22 * (1 - k.f / 8) : 0;
    pic.style.transform = 'translate(' + sh + 'px,' + (mix(80, 0, E.out(span(k.f, 0, 10)))) + 'px) scale(' + mix(0.85, 1.05, E.out(k.p)) + ')';
    showCap(cap, k.f, 0); showCap(name, k.f, 8);
    sub.style.opacity = String(span(k.f, 18, 26));
  };
});

/* ===== FORMIA ===== */
cityShot(fr(13), fr(15), 'day', [
  { pos: [18, 5, 88], look: [38, 1, 64], fov: 44 },
  { pos: [46, 8, 84], look: [60, 1, 56], fov: 44 },
  { pos: [80, 13, 80], look: [86, 1, 46], fov: 44 }
], function (el) {
  const cap = caption(el, 'Esplora Formia', { y: 170, size: 130, hi: TYPE.Calma });
  const sub = caption(el, 'la città vera, casella per casella', { y: 300, size: 62, font: 'Patrick Hand' });
  return function (k) { showCap(cap, k.f, 2); showCap(sub, k.f, 14); };
});
clipShot(fr(15), fr(16), 'beach', { at: 30, zoom: [1.06, 1], place: 'Vindicio', kicker: 'FORMIA · SPIAGGIA' });
clipShot(fr(16), fr(17), 'castellone', { at: 10, zoom: [1, 1.06], place: 'Castellone', kicker: 'FORMIA · BORGO ALTO' });
clipShot(fr(17), fr(18), 'scooter', { at: 24, cap: 'Gira in motorino', hi: TYPE.Caos });
clipShot(fr(18), fr(19), 'casa', { at: 88, zoom: [1.45, 1.55], origin: '50% 60%', cap: 'Dormi, e arriva la notte', capY: 140, hi: TYPE.Cervello });
shot(fr(19), fr(20), function (el) {
  const day = clip(el, 'porto-giorno', { at: 8, zoom: [1.04, 1] });
  const nightEl = div(el, 'layer');
  const night = clip(nightEl, 'porto-notte', { at: 8, zoom: [1.04, 1] });
  const c1 = caption(el, 'Di giorno…', { y: 930, size: 110, hi: TYPE.Chiacchiera });
  const c2 = caption(el, '…e di notte.', { y: 930, size: 110, hi: TYPE.Cervello });
  return function (k) {
    day(k); night(k);
    const w = E.inOut(span(k.f, 26, 36));
    nightEl.style.clipPath = 'circle(' + (w * 130) + '% at 85% 15%)';
    showCap(c1, k.f, 0, 28); showCap(c2, k.f, 30);
  };
});
clipShot(fr(20), fr(21), 'piazza-notte', { at: 4, zoom: [1, 1.08], cap: 'La notte si accende.', hi: TYPE.Chiacchiera });

/* ===== THE TALL GRASS ===== */
clipShot(fr(21), fr(21, 3), 'grass', { at: 1, zoom: [1.12, 1.2], origin: '50% 45%', cap: 'Nell\'erba alta…', hi: '#9ad46a' });
clipShot(fr(21, 3), fr(22, 2), 'pools', { at: 4, zoom: [1.12, 1.22], origin: '50% 45%', cap: '…tra gli scogli…', hi: TYPE.Calma });
clipShot(fr(22, 2), fr(23, 2), 'pineta', { at: 10, zoom: [1.25, 1.4], origin: '50% 45%', cap: '…qualcosa si muove.', hi: '#9ad46a' });
shot(fr(23, 2), fr(24), function (el) {
  const hold = clip(el, 'meet', { at: 22, zoom: [1.05, 1.12] });
  const bars = div(el, 'stripes');
  const st = Array.from({ length: 12 }, function () { return div(bars, 'stripe'); });
  const bang = div(el, 'bang', sticker('!', 300, '#fff', RED));
  return function (k) {
    hold(k);
    st.forEach(function (s, i) { const t = E.in(span(k.f, 8 + i * 0.6, 8 + i * 0.6 + 12)); s.style.transform = 'translateX(' + ((i % 2 ? -1 : 1) * (1 - t) * 105) + '%)'; });
    const b = span(k.f, 0, 7), out = span(k.f, 22, 30);
    bang.style.opacity = String((b > 0 ? 1 : 0) * (1 - out));
    bang.style.transform = 'translate(-50%,-50%) scale(' + mix(3, 1, E.back(b)) + ')';
  };
});

/* ===== CREATURES ===== */
shot(fr(24), fr(25), function (el) {
  /* the banner of the move at the shot's start, then the moon from Polpino to the Riccetto, on the right */
  const draw = clip(el, 'battle', { at: BATTLE_AT, zoom: [1, 1.22], origin: '76% 40%' });
  const stamp = div(el, 'stampbig', 'LOTTA!');
  return function (k) {
    draw(k);
    /* below the banner of the move, and gone before the moon leaves */
    const t = span(k.f, 0, 8), out = span(k.f, 12, 19);
    stamp.style.transform = 'translate(-50%,-50%) rotate(-9deg) scale(' + mix(2.6, 1, E.back(t)) + ')';
    stamp.style.opacity = String(clamp(t * 3) * (1 - out));
  };
});
/* the spells, seen through the creature's eyes: it charges (its own tentacles or wings in the corners), the rune
   flies at the one in front, and lands on the and of three (T_HIT); a critical one stops time for a moment */
const T_CHARGE = 4, T_LAUNCH = 22, T_HIT = 37;
interface Pov { me: SpeciesId; foe: SpeciesId; scene: string; night: boolean; lv: [number, number]; hp: [number, number]; crit: boolean; cap?: string }
function povShot(from: number, to: number, o: Pov) {
  shot(from, to, function (el) {
    const type = SPECIES[o.me].type as TypeName, col = MAGIC[type].col;
    const world = div(el, 'layer pov-world');
    const bg = sceneLayer(world, o.scene, o.night); bg.classList.add('pov-bg');
    div(world, 'pov-plat', '', 'background:' + sceneInfo(o.scene).ground);
    const foe = div(world, 'pov-foe', creature(o.foe, 'smirk'));
    const foeSvg = foe.querySelector('svg') as SVGElement;
    const wave = div(world, 'pov-wave', '', '--mc:' + col);
    const glow = div(world, 'pov-glow', '', '--mc:' + col);
    const pow = div(world, 'pov-pow', POW);
    const parts = Array.from({ length: o.crit ? 18 : 12 }, function () { return div(world, 'pov-part', shape(type, col, 60)); });
    const zoom = div(el, 'pov-zoom', '', '--mc:' + col);
    const base = div(el, 'pov-base', '<svg viewBox="0 0 1500 300" aria-hidden="true"><ellipse cx="750" cy="150" rx="735" ry="138" fill="none" stroke="' + col + '" stroke-width="14" stroke-dasharray="46 28"/><ellipse cx="750" cy="150" rx="620" ry="104" fill="none" stroke="' + col + '" stroke-width="6" opacity=".8"/></svg>', '--mc:' + col);
    const dash = base.querySelector('ellipse') as SVGEllipseElement;
    const motes = Array.from({ length: 12 }, function () { return div(el, 'pov-mote', shape(type, col, 96)); });
    const hands = [div(el, 'pov-limb left', limb(o.me)), div(el, 'pov-limb right', limb(o.me))];
    const trail = Array.from({ length: 8 }, function (_, i) { return div(el, 'pov-trail', shape(type, col, 86 - i * 7)); });
    const orb = div(el, 'pov-orb', runeIcon(type, 230), '--mc:' + col);
    const bolts = type === 'Caos' ? div(el, 'pov-bolts') : null;
    const hf = hud(el, o.foe, o.lv[1], 'foe'), hm = hud(el, o.me, o.lv[0], 'me');
    hm.set(1);
    const ban = o.crit ? div(el, 'pov-banner', esc('COLPO CRITICO!')) : null;
    const cap = o.cap ? caption(el, o.cap, { y: 300, size: 92, hi: col }) : null;
    const FOE: [number, number] = [1180, 500], ORB: [number, number] = [960, 860];
    return function (k) {
      const f = k.f, hit = f >= T_HIT, since = f - T_HIT;
      /* a critical hit freezes the picture for three frames */
      const g = o.crit && since >= 0 && since < 3 ? T_HIT : f;
      const kick = since >= 0 ? Math.exp(-since / (o.crit ? 7 : 5)) : 0, push = E.inOut(span(g, T_LAUNCH - 4, T_HIT));
      world.style.transform = 'translate(' + (Math.sin(g / 7) * 6 + (since >= 0 ? (rnd(f) - 0.5) * (o.crit ? 46 : 26) * kick : 0)) + 'px,' + (Math.cos(g / 6) * 4 + (since >= 0 ? (rnd(f + 5) - 0.5) * 18 * kick : 0)) + 'px) scale(' + (1 + push * 0.07) + ')';
      bg.style.filter = 'blur(3px) brightness(' + (1 - span(g, T_CHARGE, T_LAUNCH) * 0.25 + (hit ? 0.25 * span(g, T_HIT + 2, T_HIT + 14) : 0)) + ')';
      /* the charge: the circle opens around the caster, the shapes rise past the eyes and gather into the rune */
      const ch = span(g, T_CHARGE, T_LAUNCH), gone = span(g, T_LAUNCH, T_LAUNCH + 6);
      base.style.opacity = String(E.out(ch) * (1 - span(g, T_HIT, T_HIT + 12)));
      base.style.transform = 'translate(-50%,-50%) scale(' + mix(0.3, 1, E.out(ch)) + ')';
      dash.setAttribute('stroke-dashoffset', String(-g * 9));
      motes.forEach(function (m, i) {
        const a = span(g, T_CHARGE + i, T_CHARGE + i + 14), x0 = 120 + rnd(i * 3 + 1) * 1680, y0 = 1180 + rnd(i * 3 + 2) * 120;
        const x = mix(x0, ORB[0], E.in(a)), y = mix(y0, ORB[1], E.in(a)) - Math.sin(a * Math.PI) * 140;
        m.style.opacity = String(a > 0 && a < 1 ? 1 : 0);
        m.style.transform = 'translate(' + (x - 48) + 'px,' + (y - 48) + 'px) scale(' + mix(2.1, 0.4, a) + ') rotate(' + (g * 9 + i * 40) + 'deg)';
        m.style.filter = 'blur(' + mix(5, 0, a) + 'px) drop-shadow(0 0 14px ' + col + ')';
      });
      hands.forEach(function (h, i) {
        const up = E.out(span(g, 0, 12)), thrust = Math.sin(clamp(span(g, T_LAUNCH - 3, T_LAUNCH + 9)) * Math.PI), down = span(g, T_HIT + 4, T_HIT + 20);
        const sway = Math.sin(g / 5 + i * 2) * 3;
        h.style.transform = 'translateY(' + (mix(520, 0, up) + down * 120 - thrust * 40) + 'px) rotate(' + ((i ? -1 : 1) * (sway - thrust * 7)) + 'deg) scaleX(' + (i ? -1 : 1) + ')';
        h.style.filter = 'drop-shadow(0 0 ' + (10 + 40 * ch * (1 - gone * 0.6)) + 'px ' + col + ')';
      });
      /* the rune, gathered, then flying away from the eyes to the one in front, its trail behind */
      const fly = E.in(span(g, T_LAUNCH, T_HIT)), born = E.back(span(g, T_CHARGE + 6, T_LAUNCH));
      const where = function (t: number): [number, number, number] { return [mix(ORB[0], FOE[0], t), mix(ORB[1], FOE[1], t) - Math.sin(t * Math.PI) * 90, mix(1.25, 0.42, t)]; };
      const op = where(fly), pulse = 1 + Math.sin(g * 1.3) * 0.08 * (1 - fly);
      orb.style.opacity = String(born > 0 && !hit ? 1 : 0);
      orb.style.transform = 'translate(' + (op[0] - 115) + 'px,' + (op[1] - 115) + 'px) scale(' + op[2] * born * pulse + ') rotate(' + g * 6 + 'deg)';
      trail.forEach(function (tr, i) {
        const t = E.in(span(g - (i + 1) * 1.2, T_LAUNCH, T_HIT)), p = where(t);
        tr.style.opacity = String(g > T_LAUNCH + i * 1.2 && !hit ? 0.85 - i * 0.09 : 0);
        tr.style.transform = 'translate(' + (p[0] - 43) + 'px,' + (p[1] - 43) + 'px) scale(' + p[2] * 1.1 + ') rotate(' + (g * 12 + i * 30) + 'deg)';
      });
      zoom.style.opacity = String(Math.sin(clamp(span(g, T_LAUNCH, T_HIT + 4)) * Math.PI) * 0.9);
      zoom.style.transform = 'scale(' + mix(1.4, 1, span(g, T_LAUNCH, T_HIT)) + ')';
      if (bolts) {
        bolts.style.opacity = String(ch > 0 && !hit ? 0.9 * (1 - gone * 0.5) : 0);
        if (Math.floor(g) % 2 === 0) bolts.innerHTML = boltsSvg(Math.floor(g), col);
      }
      /* the hit: a flash of the type's colour, a shockwave, the star, the shapes flying out; the one in front flinches */
      const s1 = span(g, T_HIT, T_HIT + 12), s2 = span(g, T_HIT, T_HIT + 22);
      glow.style.opacity = String(hit ? 1 - s1 : 0); glow.style.transform = 'translate(-50%,-50%) scale(' + mix(0.4, o.crit ? 3.2 : 2.2, E.out(s1)) + ')';
      wave.style.opacity = String(hit ? 1 - s2 : 0); wave.style.transform = 'translate(-50%,-50%) scale(' + mix(0.2, o.crit ? 4.2 : 3, E.out(s2)) + ')';
      pow.style.opacity = String(hit ? 1 - span(g, T_HIT + 6, T_HIT + 14) : 0);
      pow.style.transform = 'translate(-50%,-50%) scale(' + (o.crit ? 1.8 : 1.2) * mix(0.3, 1, E.back(span(g, T_HIT, T_HIT + 6))) + ') rotate(' + mix(-20, 8, s1) + 'deg)';
      parts.forEach(function (p, i) {
        const a = (i / parts.length) * Math.PI * 2 + rnd(i) * 0.6, d = (o.crit ? 520 : 380) * (0.55 + rnd(i + 20) * 0.6) * E.out(s2);
        p.style.opacity = String(hit ? 1 - span(g, T_HIT + 10, T_HIT + 22) : 0);
        p.style.transform = 'translate(' + (FOE[0] - 30 + Math.cos(a) * d) + 'px,' + (FOE[1] - 30 + Math.sin(a) * d * 0.8 + s2 * s2 * 120) + 'px) rotate(' + (g * 14 + i * 50) + 'deg) scale(' + mix(1.4, 0.7, s2) + ')';
      });
      foeSvg.setAttribute('data-expr', since >= 0 ? 'worried' : 'smirk');
      const flinch = since >= 0 && since < 10 ? (Math.sin(since * 2.6) * 22 * (1 - since / 10)) : 0;
      foe.style.transform = 'translateX(' + flinch + 'px) scale(' + (1 + (since >= 0 && since < 4 ? 0.06 : 0)) + ')';
      foe.style.filter = since >= 0 && since < 5 ? 'brightness(2.6) saturate(.3)' : '';
      hf.set(mix(o.hp[0], o.hp[1], E.out(span(g, T_HIT + 2, T_HIT + 16))));
      if (ban) {
        const b = span(f, T_HIT + 2, T_HIT + 9);
        ban.style.opacity = String(b > 0 ? 1 : 0);
        ban.style.transform = 'translate(-50%,-50%) rotate(' + mix(-14, -5, E.out(b)) + 'deg) scale(' + mix(2.6, 1, E.back(b)) + ')';
        const ab = since >= 0 && since < 10 ? (1 - since / 10) * 26 : 0;
        (document.getElementById('rgb-r') as unknown as SVGFEOffsetElement).setAttribute('dx', String(ab));
        (document.getElementById('rgb-b') as unknown as SVGFEOffsetElement).setAttribute('dx', String(-ab));
        el.style.filter = ab > 0 ? 'url(#rgb)' : '';
      }
      if (cap) showCap(cap, f, 3);
    };
  });
}
/** lightning crackling around the caster, different at every frame (but the same every time it is drawn) */
function boltsSvg(seed: number, col: string): string {
  let s = '<svg viewBox="0 0 1920 1080" width="1920" height="1080" aria-hidden="true">';
  for (let b = 0; b < 4; b++) {
    let x = 960 + (rnd(seed * 7 + b) - 0.5) * 1300, y = 1080, d = 'M' + x.toFixed(0) + ' ' + y;
    const tx = 960 + (rnd(seed * 11 + b) - 0.5) * 160, ty = 860;
    for (let i = 1; i <= 7; i++) { x = mix(x, tx, i / 7) + (rnd(seed * 13 + b * 7 + i) - 0.5) * 90; y = mix(1080, ty, i / 7); d += ' L' + x.toFixed(0) + ' ' + y.toFixed(0); }
    s += '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="16" stroke-linejoin="round" opacity=".45"/><path d="' + d + '" fill="none" stroke="#fffbe6" stroke-width="5" stroke-linejoin="round"/>';
  }
  return s + '</svg>';
}
povShot(fr(25), fr(26), { me: 'polpino', foe: 'riccetto', scene: 'gianola', night: false, lv: [7, 6], hp: [1, 0.52], crit: false, cap: 'Ogni mossa è una magia' });
povShot(fr(26), fr(27), { me: 'gabbi', foe: 'cicalina', scene: 'pineta', night: true, lv: [9, 8], hp: [0.8, 0.08], crit: true });
clipShot(fr(27), fr(28), 'starters', { at: 12, zoom: [1, 1.05], cap: 'Scegli la tua prima creatura', capY: 120, capSize: 84, hi: TYPE.Chiacchiera });
/* the net flies, closes on the Cicalina, shakes on the ground and holds, with its stars (at twice the speed: from
   the throw to the stars is over three seconds of the clip) */
clipShot(fr(28), fr(29), 'catch', { at: 454, speed: 2, zoom: [1.02, 1.1], cap: 'Catturale!', capY: 150, hi: TYPE.Cuore });
shot(fr(29), fr(30), function (el) {
  paper(el);
  const cap = caption(el, '20 creature da scoprire', { y: 110, size: 104, hi: TYPE.Chiacchiera });
  const grid = div(el, 'dexgrid');
  const cells = (Object.keys(SPECIES) as SpeciesId[]).map(function (id) { return div(grid, 'cell secret', creature(id, 'smirk') + '<span>???</span>'); });
  return function (k) {
    showCap(cap, k.f, 0);
    cells.forEach(function (c, i) { const t = E.back(span(k.f, 1 + i * 1.2, 9 + i * 1.2)); c.style.transform = 'scale(' + t + ') rotate(' + mix(20, 0, t) + 'deg)'; c.style.opacity = String(clamp(t * 2)); });
  };
});
/* framed on the hearts: the row of the forms, at the bottom of the card, stays out */
clipShot(fr(30), fr(30, 2), 'sheet', { at: 18, zoom: [1.25, 1.35], origin: '50% 30%', cap: 'Un legame che cresce', hi: TYPE.Cuore, capAt: 0 });
clipShot(fr(30, 2), fr(31), 'swim', { at: 8, zoom: [1.2, 1.3], origin: '50% 45%', cap: 'Nuota con loro', hi: TYPE.Calma, capAt: 0 });
/* the evolution, drawn here: the light takes Polpino, and what it becomes stays a secret */
shot(fr(31), fr(32), function (el) {
  div(el, 'navy');
  const rays = div(el, 'evo-rays');
  const mon = div(el, 'evo-mon', creature('polpino', 'worried'));
  const white = div(el, 'white');
  const cap = caption(el, 'Cosa diventerà?', { y: 540, size: 120, hi: TYPE.Cervello });
  return function (k) {
    rays.style.transform = 'translate(-50%,-50%) rotate(' + k.f * 2.5 + 'deg) scale(' + mix(0.6, 1.3, E.out(k.p)) + ')';
    rays.style.opacity = String(span(k.f, 0, 10));
    const glow = E.in(span(k.f, 4, 30));
    mon.style.filter = 'brightness(' + (1 + glow * 4) + ') saturate(' + (1 - glow) + ') drop-shadow(0 0 ' + (20 + glow * 60) + 'px #fff)';
    mon.style.transform = 'translate(-50%,-50%) scale(' + (1 + Math.sin(k.f / 2.5) * 0.04 * (1 + glow * 3)) + ')';
    white.style.opacity = String(E.in(span(k.f, 26, 36)) * (1 - span(k.f, 38, 48) * 0.25));
    showCap(cap, k.f, 32);
  };
});
clipShot(fr(32), fr(33), 'sky', { at: 24, zoom: [1, 1.05], cap: 'Vola sopra Formia', hi: TYPE.Calma });
shot(fr(33), fr(34), function (el) {
  const bg = sceneLayer(el, 'castellone', true);
  div(el, 'shade dark');
  const giant = div(el, 'giant', creature('lamo', 'smirk'));
  const cap = caption(el, 'Di notte, sotto le mura, qualcosa dorme.', { y: 930, size: 80, hi: TYPE.Caos });
  return function (k) {
    bg.style.transform = 'scale(' + mix(1.08, 1.18, k.p) + ')';
    giant.style.transform = 'translate(-50%,0) translateY(' + mix(260, 120, E.out(k.p)) + 'px) scale(' + mix(1, 1.08, k.p) + ')';
    giant.style.opacity = String(span(k.f, 0, 10) * 0.95);
    showCap(cap, k.f, 6);
  };
});

/* ===== THE PLOT ===== */
clipShot(fr(34), fr(35), 'dig', { at: 10, zoom: [1.1, 1.22], origin: '60% 45%', cap: 'Di notte, a Gianola, qualcuno scava…', capSize: 80, capY: 190, hi: '#e6c46a' });
cityShot(fr(35), fr(36), 'night', [
  { pos: [76, 9, 58], look: [62, 3, 42], fov: 42, magic: 3 },
  { pos: [64, 11, 62], look: [61, 3, 42], fov: 42, magic: 3.5 }
], function (el) {
  div(el, 'shade dark');
  const cap = caption(el, 'Formia ha un segreto.', { y: 500, size: 124 });
  const sub = caption(el, 'Chi lo scoprirà per primo?', { y: 650, size: 64, font: 'Patrick Hand' });
  return function (k) { showCap(cap, k.f, 0); showCap(sub, k.f, 22); };
}, E.inOut);
/* framed on the ghost: the dialogue under it names the chapter and a stone, and the plot is not told here */
clipShot(fr(36), fr(37), 'cicero', { at: 26, zoom: [1.55, 1.65], origin: '44% 22%', cap: 'Un fantasma ti guida.', capY: 190, hi: '#f4e3a4' });
clipShot(fr(37), fr(38), 'tour', { at: 1, zoom: [1, 1.06], cap: 'Seguilo, tappa dopo tappa', capY: 890, capSize: 84, hi: TYPE.Chiacchiera });

/* ===== CREATED BY IMAGINATION ===== */
const SNIPS = [
  ['tools/formia/network.ts', excerpt(networkSrc, 'export const STREETS', 9)],
  ['src/render/world-view.ts', excerpt(viewSrc, 'export function drawWorld', 10)],
  ['tools/formia/build.ts', excerpt(buildSrc, 'import', 10)],
  ['src/story/daytime.ts', excerpt(daytimeSrc, 'export function sunTimes', 9)]
];
shot(fr(38), fr(40), function (el) {
  div(el, 'navy');
  const eds = SNIPS.map(function (s, i) { return editor(el, s[0], s[1], 'width:1100px;left:' + [-120, 940, -60, 900][i] + 'px;top:' + [30, 90, 600, 660][i] + 'px'); });
  const rays = div(el, 'evo-rays dream');
  /* what the dream is made of, floating around the words: the creatures, the friends, the spills, the runes */
  const things = [
    creature('polpino', 'grin'), person('antonio', 'grin'), runeIcon('Calma', 150), creature('gabbi', 'smirk'), badgeSVG(COVI[Object.keys(COVI)[0]].badge, 170),
    person('zendavid', 'smirk'), runeIcon('Cuore', 150), creature('ramarrino', 'grin'), person('costanzo', 'grin'), runeIcon('Caos', 150), creature('cicalina', 'smirk'), runeIcon('Chiacchiera', 150)
  ].map(function (h) { return div(el, 'dreamt', h); });
  const cap = caption(el, 'Creato dall\'immaginazione.', { y: 540, size: 124, hi: TYPE.Cervello });
  return function (k) {
    const rush = E.in(span(k.f, 96, 120));
    eds.forEach(function (ed, i) {
      ed.body.innerHTML = codeHtml(ed.toks, 120 + k.f * 9);
      ed.el.style.opacity = String(0.22 * (1 - rush));
      ed.el.style.transform = 'translateY(' + (-k.f * (i % 2 ? 1.2 : 1.8)) + 'px) scale(' + (0.96 + k.p * 0.04) + ')';
    });
    rays.style.opacity = String(0.5 * span(k.f, 0, 20));
    rays.style.transform = 'translate(-50%,-50%) rotate(' + k.f * 0.8 + 'deg) scale(' + (1.1 + rush * 1.5) + ')';
    things.forEach(function (t, i) {
      const a = (i / things.length) * Math.PI * 2 + k.f * 0.012, r = 560 + (i % 3) * 70, pop = E.back(span(k.f, 4 + i * 3, 16 + i * 3));
      const x = W / 2 + Math.cos(a) * r * (1 + rush * 1.6), y = H / 2 + Math.sin(a) * r * 0.62 * (1 + rush * 1.6) + Math.sin(k.f / 9 + i) * 12;
      t.style.transform = 'translate(' + (x - 110) + 'px,' + (y - 110) + 'px) scale(' + pop * (0.8 + (i % 3) * 0.12) * (1 + rush * 1.2) + ') rotate(' + Math.sin(k.f / 14 + i) * 8 + 'deg)';
      t.style.opacity = String(clamp(pop * 2) * (1 - rush));
    });
    showCap(cap, k.f, 8);
    cap.el.style.filter = 'drop-shadow(0 0 ' + (24 + Math.sin(k.f / 6) * 10) + 'px rgba(187,160,255,.8))';
    cap.el.style.opacity = String(1 - rush);
  };
});

/* ===== AND MORE ===== */
clipShot(fr(40), fr(41), 'skills', { at: 2, zoom: [1.25, 1.3], origin: '50% 45%', cap: 'Sali di livello. Scegli la tua strada.', capY: 990, capSize: 74, hi: TYPE.Cervello });
clipShot(fr(41), fr(41, 2), 'volley', { at: 30, zoom: [1.35, 1.4], origin: '50% 50%', cap: 'Beach volley', hi: TYPE.Calma, capAt: 0 });
clipShot(fr(41, 2), fr(42), 'quiz', { at: 10, zoom: [1.4, 1.5], origin: '50% 62%', cap: 'Quiz su Formia', capY: 140, hi: TYPE.Chiacchiera, capAt: 0 });
clipShot(fr(42), fr(42, 2), 'tourney', { at: 14, zoom: [1.35, 1.45], origin: '50% 48%', cap: 'Torneo degli amici', capY: 140, hi: TYPE.Chiacchiera, capAt: 0 });
clipShot(fr(42, 2), fr(43), 'fishing', { at: 80, zoom: [1.5, 1.6], origin: '50% 50%', cap: 'Vai a pesca', capY: 980, hi: TYPE.Calma, capAt: 0 });
clipShot(fr(43), fr(43, 2), 'home', { at: 6, zoom: [1.35, 1.45], origin: '50% 45%', cap: 'Le tue creature, a casa', capY: 140, capSize: 84, hi: TYPE.Cuore, capAt: 0 });
clipShot(fr(43, 2), fr(44), 'covo', { at: 60, zoom: [1.3, 1.36], origin: '50% 18%', cap: 'Conquista i covi', hi: TYPE.Caos, capAt: 0 });
shot(fr(44), fr(44, 2), function (el) {
  paper(el);
  const row = div(el, 'badges');
  const items = Object.keys(COVI).map(function (k) { const b = COVI[k].badge; return div(row, 'badge', badgeSVG(b, 330) + '<b>' + esc(b.name.replace(/^Spilla /, '')) + '</b>'); });
  const cap = caption(el, 'Vinci le spille', { y: 150, size: 110, hi: TYPE.Chiacchiera });
  return function (k) {
    showCap(cap, k.f, 0);
    items.forEach(function (it, i) { const t = E.back(span(k.f, 2 + i * 4, 12 + i * 4)); it.style.transform = 'scale(' + t + ') rotate(' + mix(-30, (i ? 6 : -6), t) + 'deg)'; });
  };
});
/* Antonio's Diagnosi Energetica hits the exam a quarter of a beat in */
clipShot(fr(44, 2), fr(45), 'boss', { at: 236, zoom: [1.75, 1.65], origin: '50% 28%', cap: 'Supera l\'Esame!', hi: RED, capAt: 0 });
shot(fr(45), fr(46), function (el) {
  const picks: [string, number][] = [['battle', BATTLE_HIT + 4], ['friends', 240], ['porto-notte', 50], ['tourney', 40], ['sky', 90], ['catch', 552], ['volley', 60], ['piazza-notte', 40], ['boss', 245], ['beach', 70], ['covo', 80], ['battle', BATTLE_HIT + 6]];
  const img = document.createElement('img'); img.className = 'clip'; el.appendChild(img);
  const white = div(el, 'white');
  return function (k) {
    const q = picks[Math.min(picks.length - 1, Math.floor(k.f / 4))], src = clipSrc(q[0], q[1] + (k.f % 4));
    if (img.getAttribute('src') !== src) img.src = src;
    img.style.transform = 'scale(' + (1.1 + (k.f % 4) * 0.03) + ')';
    white.style.opacity = String(E.in(span(k.f, 44, 60)));
  };
});

/* ===== THE END: Formia by night ===== */
cityShot(fr(46), FRAMES, 'night', [
  { pos: [96, 5, 70], look: [90, 5, 44], fov: 44, magic: 1.4 },
  { pos: [102, 13, 98], look: [88, 8, 40], fov: 44, magic: 1.6 }
], function (el) {
  div(el, 'shade end');
  const logo = div(el, 'logo end', '<span class="hl"></span>' + sticker('Lotte tra Amici', 190));
  const hl = logo.querySelector('.hl') as HTMLElement;
  const btn = div(el, 'play', 'Gioca gratis nel browser');
  const mons = (['polpino', 'ramarrino', 'gabbi'] as SpeciesId[]).map(function (id, i) { return div(el, 'mon m' + i, creature(id, i === 1 ? 'grin' : 'smirk')); });
  const ant = div(el, 'ant', person('antonio', 'grin'));
  const next = caption(el, 'Formia ti aspetta.', { y: 770, size: 62, font: 'Patrick Hand' });
  const PRESS = fr(48, 3) - fr(46);
  return function (k) {
    const f = k.f;
    const t = span(f, 0, 10);
    logo.style.transform = 'translate(-50%,-50%) scale(' + mix(2.2, 1, E.back(t)) + ') rotate(-2deg)';
    logo.style.opacity = String(clamp(t * 4));
    hl.style.transform = 'skewX(-10deg) scaleX(' + E.out(span(f, 6, 16)) + ')';
    const b = E.back(span(f, 22, 32)), press = f >= PRESS && f < PRESS + 6 ? 0.92 : 1;
    btn.style.transform = 'translate(-50%,-50%) scale(' + b * press + ')';
    btn.style.boxShadow = press < 1 ? '0 2px 0 ' + INK : '0 10px 0 ' + INK;
    mons.forEach(function (m, i) { const u = E.back(span(f, 8 + i * 4, 18 + i * 4)); m.style.transform = 'translateY(' + mix(400, Math.sin((f + i * 9) / 7) * 8, u) + 'px)'; });
    ant.style.transform = 'translateY(' + mix(500, 0, E.out(span(f, 4, 16))) + 'px)';
    showCap(next, f, 50);
  };
}, E.out);

/* ---------- the whole film, frame by frame ---------- */
const FLASH: [number, number, string][] = [
  [fr(5), 12, '#fff'], [fr(12), 5, '#fff'], [fr(13), 8, '#fff'], [fr(23, 2), 4, '#fff'], [fr(24), 10, '#fff'], [fr(25, 2.5), 4, '#fff'], [fr(26, 2.5), 9, '#fff'],
  [fr(33), 10, '#000'], [fr(34), 8, '#000'], [fr(40), 10, '#fff'], [fr(46), 14, '#fff']
];
const SHAKE: [number, number, number][] = [[fr(5), 10, 22], [fr(12), 6, 10], [fr(24), 8, 18], [fr(26, 2.5), 10, 14], [fr(33), 12, 18], [fr(40), 8, 16], [fr(46), 10, 20]];
const fx = { flash: div(stage, 'fx-flash'), top: div(stage, 'fx-bar top'), bottom: div(stage, 'fx-bar bottom'), vig: div(stage, 'fx-vig'), fade: div(stage, 'fx-fade') };
const live = new Map<Shot, { el: HTMLDivElement; draw: (k: K) => void }>();
async function renderAt(g: number) {
  for (const [s, v] of live) if (g < s.from || g >= s.to) { v.el.remove(); live.delete(s); }
  for (const s of SHOTS) {
    if (g < s.from || g >= s.to) continue;
    let v = live.get(s);
    if (!v) { const el = div(stage, 'shot', '', 'z-index:' + (s.z + 1)); v = { el, draw: s.build(el) }; live.set(s, v); }
    v.draw({ f: g - s.from, g, n: s.to - s.from, p: (g - s.from) / (s.to - s.from) });
  }
  /* flashes, shakes, the letterbox of the plot, the fade in and out */
  let fl = 0, col = '#fff';
  for (const [a, n, c] of FLASH) if (g >= a && g < a + n) { const v = 1 - (g - a) / n; if (v > fl) { fl = v; col = c; } }
  fx.flash.style.opacity = String(fl); fx.flash.style.background = col;
  let sx = 0, sy = 0;
  for (const [a, n, amp] of SHAKE) if (g >= a && g < a + n) { const v = amp * (1 - (g - a) / n); sx += (rnd(g) - 0.5) * 2 * v; sy += (rnd(g + 99) - 0.5) * 2 * v; }
  for (const v of live.values()) v.el.style.translate = sx + 'px ' + sy + 'px';
  const lb = Math.min(span(g, fr(34), fr(34) + 8), 1 - span(g, fr(38) - 6, fr(38)));
  fx.top.style.height = fx.bottom.style.height = (lb * 110) + 'px';
  fx.fade.style.opacity = String(Math.max(1 - span(g, 0, 45), span(g, FRAMES - 40, FRAMES - 4)));
  /* the SVGs' own animations (the creatures' magic motes) follow the film's clock */
  for (const a of document.getAnimations()) { a.pause(); a.currentTime = g * 1000 / FPS; }
  await document.fonts.ready;
  await Promise.all(Array.from(stage.querySelectorAll('img')).map(function (im) { return im.complete && im.naturalWidth ? null : im.decode().catch(function () {}); }));
}

/* ---------- styles ---------- */
const css = document.createElement('style');
css.textContent = MAGIC_CSS + `
.shot { position: absolute; inset: 0; overflow: hidden; }
.clip { position: absolute; left: 0; top: 0; width: ${W}px; height: ${H}px; transform-origin: 50% 50%; }
.layer { position: absolute; inset: 0; }
.navy { position: absolute; inset: 0; background: radial-gradient(120% 90% at 50% 40%, #1c2558, ${NAVY} 70%); }
.white { position: absolute; inset: 0; background: #fff; opacity: 0; }
.paper { position: absolute; inset: 0; background-image: linear-gradient(90deg, transparent 158px, #e8a39b 158px, #e8a39b 161px, transparent 161px), linear-gradient(#dfe6f3 2px, transparent 2px), linear-gradient(90deg, #dfe6f3 2px, transparent 2px); background-size: 100% 100%, 48px 48px, 48px 48px; }
.shade { position: absolute; inset: 0; background: radial-gradient(70% 60% at 50% 45%, rgba(15,20,48,.35), rgba(15,20,48,.08) 70%, rgba(15,20,48,.35)); }
.shade.night { background: linear-gradient(rgba(5,8,25,0) 55%, rgba(5,8,25,.55)); }
.shade.dark { background: radial-gradient(70% 70% at 50% 45%, rgba(10,12,30,.3), rgba(10,12,30,.7)); }
.shade.end { background: radial-gradient(80% 70% at 50% 40%, rgba(10,12,30,.15), rgba(10,12,30,.55)); }
.scene { position: absolute; inset: -40px; }
.scene svg { width: 100%; height: 100%; display: block; }
.stk { position: relative; display: inline-block; line-height: 1.02; white-space: nowrap; }
.stk-b { position: absolute; left: 0; top: 0; }
.stk-f { position: relative; }
.cap { position: absolute; white-space: nowrap; z-index: 3; }
.cap .w { display: inline-block; position: relative; z-index: 1; }
.cap .hi { position: absolute; left: -30px; right: -30px; top: 18%; bottom: 8%; border-radius: 14px; transform-origin: 0 50%; z-index: 0; opacity: .95; }
.wh { position: absolute; left: 0; right: 0; text-align: center; font-family: 'Patrick Hand'; color: #fff; white-space: pre; z-index: 3; text-shadow: 0 0 26px rgba(5,8,25,.95), 0 0 8px rgba(5,8,25,.8), 0 3px 0 rgba(5,8,25,.5); transform: translateY(-50%); }
.wh span { display: inline-block; }
.place { position: absolute; left: 70px; top: 64px; padding: 16px 30px 18px; background: #fff; border: 5px solid ${INK}; border-radius: 22px; box-shadow: 9px 10px 0 ${INK}; color: ${INK}; z-index: 3; }
.place small { display: block; font: 700 24px 'Atkinson Hyperlegible'; letter-spacing: .14em; opacity: .75; }
.place b { display: block; font: 72px/1 'Lilita One'; margin-top: 4px; }
.editor { position: absolute; background: #151b3d; border: 4px solid #2b3570; border-radius: 22px; box-shadow: 0 30px 80px rgba(0,0,0,.45); overflow: hidden; transform-origin: 50% 0; filter: blur(1.5px); }
.editor .bar { height: 58px; background: #1f2750; display: flex; align-items: center; gap: 12px; padding: 0 22px; }
.editor .bar i { width: 18px; height: 18px; border-radius: 50%; background: #ff6b6b; }
.editor .bar i:nth-child(2) { background: #ffd166; } .editor .bar i:nth-child(3) { background: #57c968; }
.editor .bar span { margin-left: 18px; font: 26px Menlo, monospace; color: #aeb8ea; }
.editor .code { display: flex; padding: 22px 26px 30px; font: 30px/1.42 Menlo, Monaco, monospace; }
.editor pre { margin: 0; font: inherit; white-space: pre; }
.editor .gut { color: #4f5a92; text-align: right; padding-right: 26px; user-select: none; }
.editor .body { color: #e8ecff; }
.editor .kw { color: #ff8fc1; } .editor .st { color: #ffe45c; } .editor .nu { color: #ffa35a; } .editor .cm { color: #7f8bc4; font-style: italic; }
.editor .pr { color: #8fd0f6; } .editor .pu { color: #bba0ff; }
.formia { position: absolute; left: 50%; top: 44%; z-index: 3; }
.logo { position: absolute; left: 50%; top: 42%; z-index: 3; white-space: nowrap; }
.logo .hl { position: absolute; left: -26px; width: 600px; top: 26%; bottom: 6%; background: ${TYPE.Cervello}; border-radius: 16px; transform-origin: 0 50%; z-index: 0; }
.logo .stk { z-index: 1; }
.logo.end { top: 28%; }
.bits { position: absolute; left: 50%; top: 42%; z-index: 2; }
.bit { position: absolute; width: 26px; height: 26px; margin: -13px; border: 4px solid ${INK}; }
.row { position: absolute; left: 0; right: 0; top: 330px; display: flex; justify-content: center; gap: 34px; }
.card { width: 250px; height: 290px; border: 6px solid ${INK}; border-radius: 26px; box-shadow: 10px 12px 0 ${INK}; overflow: hidden; }
.card svg { width: 100%; height: 100%; }
.tbg { position: absolute; inset: 0; background-image: repeating-linear-gradient(-35deg, rgba(255,255,255,.22) 0 40px, transparent 40px 80px); }
.pic { position: absolute; left: 60px; bottom: -40px; width: 900px; height: 1040px; transform-origin: 50% 100%; }
.pic svg { width: 100%; height: 100%; }
.fname { position: absolute; left: 980px; top: 330px; }
.chip { position: absolute; left: 990px; top: 230px; padding: 12px 26px 10px; border-radius: 14px; font: 46px 'Lilita One'; letter-spacing: .06em; transform-origin: 0 50%; }
.ftag { position: absolute; left: 990px; top: 590px; font: 64px 'Patrick Hand'; color: ${INK}; }
.boss-bg { position: absolute; inset: 0; background: radial-gradient(60% 70% at 32% 55%, #7a1f2e, #200a16 70%); }
.esame { position: absolute; left: 80px; top: 120px; width: 900px; height: 900px; filter: drop-shadow(0 0 60px rgba(255,80,80,.5)); }
.esame svg { width: 100%; height: 100%; }
.bsub { position: absolute; left: 970px; top: 640px; font: 58px 'Patrick Hand'; color: #ffd2c9; }
.stripes { position: absolute; inset: 0; display: flex; flex-direction: column; }
.stripe { flex: 1; background: #0b0d1c; }
.bang { position: absolute; left: 50%; top: 50%; z-index: 3; }
.stampbig { position: absolute; left: 50%; top: 66%; padding: 26px 60px 18px; border: 14px solid ${RED}; border-radius: 26px; color: ${RED}; background: ${PAPER}; font: 210px/1 'Lilita One'; letter-spacing: .05em; z-index: 3; box-shadow: 14px 16px 0 rgba(31,44,110,.6); }
.pov-world { transform-origin: 61% 46%; }
.pov-bg { transform: scale(1.2); transform-origin: 60% 70%; }
.pov-plat { position: absolute; left: 900px; top: 640px; width: 560px; height: 120px; border-radius: 50%; border: 6px solid ${LINE}; box-shadow: inset 0 -14px 0 rgba(0,0,0,.18); }
.pov-foe { position: absolute; left: 930px; top: 220px; width: 500px; height: 500px; transform-origin: 50% 90%; }
.pov-foe svg { width: 100%; height: 100%; }
.pov-wave { position: absolute; left: 1180px; top: 500px; width: 200px; height: 200px; border-radius: 50%; border: 12px solid var(--mc); box-shadow: 0 0 40px var(--mc), inset 0 0 30px var(--mc); }
.pov-glow { position: absolute; left: 1180px; top: 500px; width: 420px; height: 420px; border-radius: 50%; background: radial-gradient(circle, #fff 0, var(--mc) 30%, transparent 70%); mix-blend-mode: screen; }
.pov-pow { position: absolute; left: 1180px; top: 480px; width: 260px; height: 260px; }
.pov-pow svg { width: 100%; height: 100%; }
.pov-part { position: absolute; left: 0; top: 0; width: 60px; height: 60px; }
.pov-zoom { position: absolute; inset: -10%; background: repeating-conic-gradient(from 0deg at 61% 46%, rgba(255,255,255,.5) 0 1.2deg, transparent 1.2deg 9deg); -webkit-mask: radial-gradient(circle at 61% 46%, transparent 18%, #000 60%); mask: radial-gradient(circle at 61% 46%, transparent 18%, #000 60%); opacity: 0; z-index: 2; }
.pov-base { position: absolute; left: 960px; top: 1010px; width: 1500px; height: 300px; z-index: 2; opacity: 0; filter: drop-shadow(0 0 22px var(--mc)) drop-shadow(0 0 8px #fff); }
.pov-base svg { width: 100%; height: 100%; overflow: visible; }
.pov-mote { position: absolute; left: 0; top: 0; width: 96px; height: 96px; z-index: 3; opacity: 0; }
.pov-limb { position: absolute; bottom: -60px; width: 520px; height: 760px; z-index: 4; }
.pov-limb svg { width: 100%; height: 100%; }
.pov-limb.left { left: -60px; transform-origin: 30% 100%; }
.pov-limb.right { right: -60px; transform-origin: 70% 100%; }
.pov-trail { position: absolute; left: 0; top: 0; width: 86px; height: 86px; z-index: 4; opacity: 0; filter: drop-shadow(0 0 16px #fff); }
.pov-orb { position: absolute; left: 0; top: 0; width: 230px; height: 230px; z-index: 5; filter: drop-shadow(0 0 30px var(--mc)) drop-shadow(0 0 12px #fff); opacity: 0; }
.pov-bolts { position: absolute; inset: 0; z-index: 3; filter: drop-shadow(0 0 18px #ffa04a); }
.hud { position: absolute; width: 430px; padding: 14px 20px 18px; background: #fff; border: 5px solid ${LINE}; border-radius: 18px; box-shadow: 8px 9px 0 rgba(28,35,64,.55); z-index: 6; color: ${LINE}; }
.hud .top { display: flex; justify-content: space-between; align-items: baseline; }
.hud b { font: 42px 'Lilita One'; } .hud small { font: 700 28px 'Atkinson Hyperlegible'; }
.hud .ty { display: inline-block; margin: 4px 0 10px; padding: 3px 14px 2px; border: 3px solid ${LINE}; border-radius: 10px; font: 22px 'Lilita One'; letter-spacing: .06em; }
.hud .hp { height: 22px; border: 4px solid ${LINE}; border-radius: 12px; background: #e7e9f2; overflow: hidden; }
.hud .hp i { display: block; height: 100%; width: 100%; }
.hud.foe { left: 90px; top: 90px; } .hud.me { right: 90px; bottom: 80px; }
.pov-banner { position: absolute; left: 50%; top: 36%; padding: 18px 54px 12px; border: 7px solid ${LINE}; border-radius: 14px; background: linear-gradient(90deg, #e0533d 0 50%, #f0bc42 50%); font: 130px/1 'Lilita One'; color: #fff; -webkit-text-stroke: 5px ${LINE}; paint-order: stroke; white-space: nowrap; z-index: 7; box-shadow: 14px 16px 0 rgba(28,35,64,.6); opacity: 0; }
.dexgrid { position: absolute; left: 150px; right: 150px; top: 215px; display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px 10px; }
.cell { text-align: center; }
.cell svg { width: 215px; height: 215px; }
.cell span { display: block; font: 34px 'Patrick Hand'; color: ${INK}; margin-top: -10px; }
.cell.secret svg { filter: brightness(0); }
.badges { position: absolute; left: 0; right: 0; top: 330px; display: flex; justify-content: center; gap: 160px; }
.badge { text-align: center; filter: drop-shadow(10px 12px 0 rgba(31,44,110,.35)); }
.badge b { display: block; margin-top: 18px; font: 54px 'Lilita One'; color: ${INK}; }
.evo-rays { position: absolute; left: 50%; top: 50%; width: 1800px; height: 1800px; background: repeating-conic-gradient(rgba(255, 255, 255, .22) 0 9deg, transparent 9deg 24deg); border-radius: 50%; -webkit-mask: radial-gradient(circle, #000 20%, transparent 68%); mask: radial-gradient(circle, #000 20%, transparent 68%); }
.evo-rays.dream { background: repeating-conic-gradient(rgba(187, 160, 255, .2) 0 6deg, transparent 6deg 18deg); }
.evo-mon { position: absolute; left: 50%; top: 50%; width: 560px; height: 560px; }
.evo-mon svg { width: 100%; height: 100%; }
.dreamt { position: absolute; left: 0; top: 0; width: 220px; height: 220px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 0 22px rgba(187,160,255,.7)); z-index: 2; }
.dreamt > svg { width: 100%; height: 100%; }
.giant { position: absolute; left: 50%; bottom: 0; width: 760px; height: 760px; filter: brightness(0) drop-shadow(0 0 30px rgba(255, 170, 80, .55)); }
.giant svg { width: 100%; height: 100%; }
.play { position: absolute; left: 50%; top: 55%; padding: 26px 64px 22px; background: ${RED}; color: #fff; border: 7px solid ${INK}; border-radius: 26px; font: 76px 'Lilita One'; white-space: nowrap; z-index: 4; }
.mon { position: absolute; bottom: 40px; width: 300px; height: 300px; z-index: 3; }
.mon svg { width: 100%; height: 100%; }
.m0 { left: 140px; } .m1 { left: 420px; bottom: 10px; } .m2 { right: 140px; }
.ant { position: absolute; right: 420px; bottom: -60px; width: 330px; height: 380px; z-index: 3; }
.ant svg { width: 100%; height: 100%; }
.fx-flash { position: absolute; inset: 0; z-index: 50; opacity: 0; pointer-events: none; }
.fx-bar { position: absolute; left: 0; right: 0; height: 0; background: #000; z-index: 40; }
.fx-bar.top { top: 0; } .fx-bar.bottom { bottom: 0; }
.fx-vig { position: absolute; inset: 0; z-index: 39; pointer-events: none; background: radial-gradient(120% 100% at 50% 50%, transparent 60%, rgba(8,10,30,.35)); }
.fx-fade { position: absolute; inset: 0; z-index: 60; background: #000; opacity: 0; }
`;
document.head.appendChild(css);

/* ---------- ready ---------- */
SPR.install();
const ready = (async function () {
  MAN = await (await fetch('/clips/manifest.json')).json();
  await document.fonts.ready;
  await Promise.all(['Lilita One', 'Patrick Hand', 'Atkinson Hyperlegible'].map(function (f) { return document.fonts.load('40px "' + f + '"'); }));
  await document.fonts.load('700 40px "Atkinson Hyperlegible"');
  return FRAMES;
})();
const T = window as unknown as { trailer: { ready: Promise<number>; renderAt(f: number): Promise<void>; shots(): { from: number; to: number }[] } };
T.trailer = { ready, renderAt, shots: function () { return SHOTS.map(function (s) { return { from: s.from, to: s.to }; }); } };
/* opened by hand (not by compose.ts): play it, more or less in time */
if (!new URLSearchParams(location.search).has('compose')) {
  ready.then(function () {
    let f = 0;
    const go = async function () { await renderAt(f); f = (f + 1) % FRAMES; setTimeout(go, 1000 / FPS); };
    go();
  });
}
