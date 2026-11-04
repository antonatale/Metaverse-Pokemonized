import '../../src/styles/tokens.css';
import '../../src/styles/fonts.css';
import '../../src/styles/sprites.css';
import { SPR, person, esame } from '../../src/render/svg';
import { creature, MAGIC_CSS } from '../../src/render/svg/creatures';
import { scene } from '../../src/render/svg/scenes';
import { CHARS, type FriendId } from '../../src/data/characters';
import { COVI } from '../../src/data/covi';
import { badgeSVG } from '../../src/render/svg/badges';
import { SPECIES, type SpeciesId } from '../../src/data/creatures';
import networkSrc from '../formia/network.ts?raw';
import daytimeSrc from '../../src/story/daytime.ts?raw';
import tracksSrc from '../../src/audio/tracks.ts?raw';
import synthSrc from '../../src/audio/synth.ts?raw';
import viewSrc from '../../src/render/world-view.ts?raw';
import buildSrc from '../formia/build.ts?raw';
import { FPS, fr, FRAMES } from './timeline';

/* The trailer's pictures. Every frame is a pure function of its number: renderAt(f) builds or updates the shots
   that are on at f and waits for their pictures, then compose.ts takes a screenshot. The shots are listed below in
   order, on the music's beats (fr(bar, beat) from timeline.ts); the game clips come from capture.ts (/clips/…). */

const W = 1920, H = 1080;
const INK = '#1f2c6e', PAPER = '#f7f6f0', RED = '#e0533d', NAVY = '#0f1430';
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
/** the place card of the game's HUD: FORMIA, and the name of the place */
function placeCard(parent: HTMLElement, name: string, kicker = 'FORMIA') { return div(parent, 'place', '<small>' + esc(kicker) + '</small><b>' + esc(name) + '</b>'); }
function showPlace(el: HTMLElement, f: number, n: number) {
  const t = E.back(span(f, 2, 12)), out = span(f, n - 4, n);
  el.style.transform = 'translateX(' + (mix(-520, 0, t) - out * 40) + 'px) rotate(' + mix(-6, -1.5, t) + 'deg)';
  el.style.opacity = String(1 - out);
}

/* ---------- code ---------- */
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
function codeHtml(toks: { t: string; c: string }[], chars: number, cursor: boolean): string {
  let n = 0, s = '';
  for (const tk of toks) {
    if (n >= chars) break;
    const part = tk.t.slice(0, chars - n); n += part.length;
    s += tk.c ? '<span class="' + tk.c + '">' + esc(part) + '</span>' : esc(part);
  }
  return s + (cursor ? '<span class="cur"></span>' : '');
}
function excerpt(src: string, marker: string, lines: number): string {
  const all = src.split('\n'), i = Math.max(0, all.findIndex(function (l) { return l.indexOf(marker) >= 0; }));
  return all.slice(i, i + lines).map(function (l) { return l.length > 84 ? l.slice(0, 82) + ' …' : l; }).join('\n');
}
interface Editor { el: HTMLDivElement; body: HTMLElement; gutter: HTMLElement; toks: { t: string; c: string }[]; len: number }
function editor(parent: HTMLElement, file: string, code: string, style = ''): Editor {
  const el = div(parent, 'editor', '<div class="bar"><i></i><i></i><i></i><span>' + esc(file) + '</span></div><div class="code"><pre class="gut"></pre><pre class="body"></pre></div>', style);
  const lines = code.split('\n').length;
  (el.querySelector('.gut') as HTMLElement).textContent = Array.from({ length: lines }, function (_, i) { return String(i + 1); }).join('\n');
  return { el, body: el.querySelector('.body') as HTMLElement, gutter: el.querySelector('.gut') as HTMLElement, toks: tokens(code), len: code.length };
}
function typeCode(ed: Editor, chars: number, f: number) { ed.body.innerHTML = codeHtml(ed.toks, Math.floor(chars), Math.floor(f / 8) % 2 === 0 || chars < ed.len); }

/* ---------- drawings of the game ---------- */
function sceneLayer(parent: HTMLElement, id: string, night: boolean) { return div(parent, 'scene', scene(id, night)); }
/** Formia from a drone: the game's whole map, tilted in 3D like a diorama, with sky and haze behind */
function drone(parent: HTMLElement, night = false) {
  const el = div(parent, 'drone' + (night ? ' night' : ''), '<div class="sky"></div><div class="cam"><img class="map" src="/clips/overview.png"></div><div class="haze"></div>');
  const cam = el.querySelector('.cam') as HTMLElement;
  return function (mx: number, my: number, tilt: number, zoom: number, rz = 0) {
    cam.style.transformOrigin = mx + 'px ' + my + 'px';
    cam.style.transform = 'translate3d(' + (W / 2 - mx) + 'px,' + (H * 0.62 - my) + 'px,0) rotateX(' + tilt + 'deg) rotateZ(' + rz + 'deg) scale(' + zoom + ')';
  };
}
const paper = (parent: HTMLElement, tint = PAPER) => div(parent, 'paper', '', 'background-color:' + tint);

/* where the spell leaves the caster, in the battle clip (checked on its contact sheet) */
const BATTLE_AT = 178;

/* ---------- shots ---------- */
interface K { f: number; g: number; n: number; p: number }
interface Shot { from: number; to: number; z: number; build(el: HTMLDivElement): (k: K) => void }
const SHOTS: Shot[] = [];
function shot(from: number, to: number, build: (el: HTMLDivElement) => (k: K) => void, z = 0) { SHOTS.push({ from, to, z, build }); }
/** a game clip, full screen, with an optional caption and place card */
function clipShot(from: number, to: number, name: string, o: ClipO & { cap?: string; capY?: number; capSize?: number; hi?: string; place?: string; kicker?: string; capAt?: number; whip?: boolean } = {}) {
  shot(from, to, function (el) {
    const draw = clip(el, name, o);
    const cap = o.cap ? caption(el, o.cap, { y: o.capY || 930, size: o.capSize || 96, hi: o.hi }) : null;
    const pl = o.place ? placeCard(el, o.place, o.kicker) : null;
    return function (k) {
      let extra = '';
      if (o.whip && k.f < 4) extra = ' translateX(' + (1 - k.f / 4) * 160 + 'px)';
      draw(k, extra);
      if (cap) showCap(cap, k.f, o.capAt || 3);
      if (pl) showPlace(pl, k.f, k.n);
    };
  });
}

/* ===== INTRO: code, notes, a town ===== */
const STREETS0 = excerpt(networkSrc, 'export const STREETS', 9);
const BATTLE = excerpt(tracksSrc, 'a friendly battle', 18);
shot(fr(0), fr(1), function (el) {
  div(el, 'navy');
  const ed = editor(el, 'tools/formia/network.ts', STREETS0, 'left:150px;top:150px;width:1620px');
  const cap = caption(el, 'Tutto è iniziato con del codice…', { y: 930, size: 84 });
  return function (k) {
    ed.el.style.transform = 'scale(' + mix(1, 1.05, k.p) + ')';
    typeCode(ed, k.f * 16, k.f);
    showCap(cap, k.f, 10);
  };
});
shot(fr(1), fr(2), function (el) {
  div(el, 'navy');
  const ed = editor(el, 'src/audio/tracks.ts', BATTLE, 'left:150px;top:60px;width:1620px');
  const cap = caption(el, '…qualche nota…', { y: 960, size: 84 });
  return function (k) {
    ed.el.style.transform = 'translateY(' + mix(0, -120, E.inOut(k.p)) + 'px) scale(' + mix(1.02, 1.07, k.p) + ')';
    typeCode(ed, 300 + k.f * 30, k.f);
    showCap(cap, k.f, 6);
  };
});
shot(fr(2), fr(3, 3), function (el) {
  const cam = drone(el);
  const cap1 = caption(el, '…e una città vera.', { y: 920, size: 92 });
  const big = div(el, 'formia', sticker('FORMIA', 260));
  return function (k) {
    const e = E.inOut(k.p);
    cam(mix(3050, 2250, e), mix(1950, 1330, e), mix(64, 50, e), mix(1.5, 0.92, e), mix(-10, 3, e));
    showCap(cap1, k.f, 4, 44);
    const t = span(k.f, 48, 64);
    big.style.opacity = String(clamp(t * 2));
    big.style.letterSpacing = mix(-20, 40, E.out(t)) + 'px';
    big.style.transform = 'translate(-50%,-50%) scale(' + mix(1.6, 1, E.out(t)) + ')';
  };
});
shot(fr(3, 3), fr(4), function (el) { div(el, 'white'); return function () {}; }, 5);

/* ===== LOGO ===== */
shot(fr(4), fr(6), function (el) {
  const bg = sceneLayer(el, 'vindicio', false);
  div(el, 'shade');
  const logo = div(el, 'logo', '<span class="hl"></span>' + sticker('Lotte tra Amici', 210));
  const hl = logo.querySelector('.hl') as HTMLElement;
  const tag = caption(el, 'Un\'avventura a turni nella Formia vera', { y: 760, size: 64, font: 'Patrick Hand' });
  const bits = div(el, 'bits');
  const cols = Object.values(TYPE);
  for (let i = 0; i < 46; i++) div(bits, 'bit', '', 'background:' + cols[i % cols.length] + ';border-radius:' + (i % 3 === 0 ? '50%' : '4px'));
  return function (k) {
    bg.style.transform = 'scale(' + mix(1.18, 1.06, E.out(k.p)) + ') translateX(' + mix(30, -30, k.p) + 'px)';
    const t = span(k.f, 0, 10), out = span(k.f, 80, 96);
    logo.style.transform = 'translate(-50%,-50%) scale(' + (mix(2.4, 1, E.back(t)) * (1 + E.in(out) * 2.5)) + ') rotate(' + mix(-6, -2, E.out(t)) + 'deg)';
    logo.style.opacity = String(clamp(t * 4) * (1 - out));
    logo.style.filter = out > 0 ? 'blur(' + out * 30 + 'px)' : '';
    hl.style.transform = 'skewX(-10deg) scaleX(' + E.out(span(k.f, 6, 16)) + ')';
    showCap(tag, k.f, 18, 80);
    Array.from(bits.children).forEach(function (b, i) {
      const a = rnd(i) * Math.PI * 2, d = mix(0, 500 + rnd(i + 50) * 700, E.out5(span(k.f, 1, 40))), fall = Math.pow(span(k.f, 1, 96), 2) * 600;
      (b as HTMLElement).style.transform = 'translate(' + (Math.cos(a) * d) + 'px,' + (Math.sin(a) * d * 0.7 + fall) + 'px) rotate(' + (k.f * (rnd(i + 9) * 20 - 10)) + 'deg)';
      (b as HTMLElement).style.opacity = String(clamp(1 - span(k.f, 50, 90)));
    });
  };
});

/* ===== THE FRIENDS ===== */
const FRIENDS: FriendId[] = ['antonio', 'costanzo', 'andrea', 'valentin', 'forchetta', 'zendavid'];
/* Antonio's line in the game says where the story ends: in the trailer, a mystery */
const TAG: Partial<Record<FriendId, string>> = { antonio: 'Formia è casa sua' };
shot(fr(6), fr(6, 2), function (el) {
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
  shot(fr(6, 2 + i), fr(6, 3 + i), function (el) {
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
      tag.style.opacity = String(span(k.f, 3, 7)); tag.style.transform = 'translateY(' + mix(20, 0, E.out(span(k.f, 3, 9))) + 'px)';
    };
  });
});
shot(fr(8), fr(8, 2), function (el) {
  div(el, 'navy');
  const cap = caption(el, 'Ognuno ha il suo tipo.', { y: 140, size: 100 });
  const names = ['Calma', 'Caos', 'Cervello', 'Chiacchiera', 'Cuore'];
  const ring = div(el, 'ring');
  const chips = names.map(function (n) { return div(ring, 'tchip', esc(n.toUpperCase()), 'background:' + TYPE[n]); });
  const note = caption(el, 'chi ha il vantaggio colpisce più forte', { y: 1000, size: 52, font: 'Patrick Hand' });
  return function (k) {
    showCap(cap, k.f, 0);
    chips.forEach(function (c, i) {
      const a = -Math.PI / 2 + i * Math.PI * 2 / 5 + k.p * 0.6, t = E.back(span(k.f, 1 + i * 2, 9 + i * 2));
      c.style.transform = 'translate(-50%,-50%) translate(' + Math.cos(a) * 300 + 'px,' + Math.sin(a) * 250 + 'px) scale(' + t + ')';
    });
    ring.style.setProperty('--spin', (k.p * 0.6 * 57.3) + 'deg');
    showCap(note, k.f, 10);
  };
});
shot(fr(8, 2), fr(9), function (el) {
  div(el, 'boss-bg');
  const pic = div(el, 'esame', esame('angry'));
  const cap = caption(el, '…e un boss:', { x: 960, y: 330, size: 90, align: 'left' });
  const name = caption(el, 'l\'Esame di Controlli', { x: 960, y: 500, size: 96, align: 'left', color: '#ffd2c9' });
  const sub = div(el, 'bsub', 'Appello · 2 ore');
  return function (k) {
    const sh = k.f > 12 && k.f < 18 ? (rnd(k.f) - 0.5) * 18 : 0;
    pic.style.transform = 'translate(' + sh + 'px,' + (mix(80, 0, E.out(span(k.f, 0, 10)))) + 'px) scale(' + mix(0.85, 1.05, E.out(k.p)) + ')';
    showCap(cap, k.f, 0); showCap(name, k.f, 6);
    sub.style.opacity = String(span(k.f, 12, 18));
  };
});

/* ===== FORMIA ===== */
shot(fr(9), fr(10), function (el) {
  const cam = drone(el);
  const cap = caption(el, 'Esplora Formia', { y: 170, size: 130, hi: TYPE.Calma });
  const sub = caption(el, 'la città vera, casella per casella', { y: 300, size: 60, font: 'Patrick Hand' });
  return function (k) {
    const e = E.inOut(k.p);
    cam(mix(1150, 1950, e), mix(2180, 1480, e), mix(56, 48, e), mix(1.5, 1.2, e), mix(12, -2, e));
    showCap(cap, k.f, 0); showCap(sub, k.f, 8);
  };
});
clipShot(fr(10), fr(10, 2), 'beach', { at: 30, zoom: [1.06, 1], place: 'Vindicio', kicker: 'FORMIA · SPIAGGIA' });
clipShot(fr(10, 2), fr(11), 'castellone', { at: 20, zoom: [1, 1.06], place: 'Castellone', kicker: 'FORMIA · BORGO ALTO' });
clipShot(fr(11), fr(11, 2), 'scooter', { at: 24, cap: 'Gira in motorino', hi: TYPE.Caos });
clipShot(fr(11, 2), fr(12), 'casa', { at: 88, zoom: [1.45, 1.55], origin: '50% 60%', cap: 'Dormi, e arriva la notte', capY: 140, hi: TYPE.Cervello });
shot(fr(12), fr(13), function (el) {
  const day = clip(el, 'porto-giorno', { at: 8, zoom: [1.04, 1] });
  const nightEl = div(el, 'layer');
  const night = clip(nightEl, 'porto-notte', { at: 8, zoom: [1.04, 1] });
  const c1 = caption(el, 'Di giorno…', { y: 930, size: 110, hi: TYPE.Chiacchiera });
  const c2 = caption(el, '…e di notte.', { y: 930, size: 110, hi: TYPE.Cervello });
  return function (k) {
    day(k); night(k);
    const w = E.inOut(span(k.f, 20, 28));
    nightEl.style.clipPath = 'circle(' + (w * 130) + '% at 85% 15%)';
    showCap(c1, k.f, 0, 22); showCap(c2, k.f, 24);
  };
});
clipShot(fr(13), fr(14), 'piazza-notte', { at: 4, zoom: [1, 1.08], cap: 'La notte si accende.', hi: TYPE.Chiacchiera });

/* ===== THE TALL GRASS ===== */
clipShot(fr(14), fr(15), 'grass', { at: 4, zoom: [1.12, 1.2], origin: '50% 45%', cap: 'Nell\'erba alta…', hi: '#9ad46a' });
clipShot(fr(15), fr(16), 'pools', { at: 4, zoom: [1.12, 1.22], origin: '50% 45%', cap: '…tra gli scogli…', hi: TYPE.Calma });
clipShot(fr(16), fr(16, 2), 'pineta', { at: 10, zoom: [1.25, 1.35], origin: '50% 45%', cap: '…qualcosa si muove.', hi: '#9ad46a' });
shot(fr(16, 2), fr(17), function (el) {
  div(el, 'white');
  const row = div(el, 'shadows');
  const ids: SpeciesId[] = ['cicalina', 'riccetto', 'civettina', 'granchietto', 'olivella'];
  const sh = ids.map(function (id) { return div(row, 'shadow', creature(id, 'smirk')); });
  return function (k) { sh.forEach(function (s, i) { const t = E.back(span(k.f, i * 2, i * 2 + 8)); s.style.transform = 'translateY(' + mix(200, 0, t) + 'px) scale(' + t + ')'; }); };
});
clipShot(fr(17), fr(17, 2), 'meet', { at: 22, zoom: [1.05, 1.12] });
shot(fr(17, 2), fr(18), function (el) {
  const hold = clip(el, 'meet', { at: 45, zoom: [1.12, 1.12] });
  const bars = div(el, 'stripes');
  const st = Array.from({ length: 12 }, function () { return div(bars, 'stripe'); });
  const bang = div(el, 'bang', sticker('!', 300, '#fff', RED));
  return function (k) {
    hold({ f: 0, g: k.g, n: k.n, p: 0 });
    st.forEach(function (s, i) { const t = E.in(span(k.f, i * 0.6, i * 0.6 + 9)); s.style.transform = 'translateX(' + ((i % 2 ? -1 : 1) * (1 - t) * 105) + '%)'; });
    const b = span(k.f, 13, 18);
    bang.style.opacity = String(b > 0 ? 1 : 0);
    bang.style.transform = 'translate(-50%,-50%) scale(' + mix(3, 1, E.back(b)) + ')';
  };
});

/* ===== CREATURES ===== */
shot(fr(18), fr(19), function (el) {
  const draw = clip(el, 'battle', { at: BATTLE_AT, zoom: [1.1, 1.0] });
  const stamp = div(el, 'stampbig', 'LOTTA!');
  return function (k) {
    draw(k);
    const t = span(k.f, 0, 8), out = span(k.f, 16, 22);
    stamp.style.transform = 'translate(-50%,-50%) rotate(-9deg) scale(' + mix(2.6, 1, E.back(t)) + ')';
    stamp.style.opacity = String(clamp(t * 3) * (1 - out));
  };
});
clipShot(fr(19), fr(20), 'starters', { at: 12, zoom: [1, 1.05], cap: 'Scegli la tua prima creatura', capY: 120, capSize: 84, hi: TYPE.Chiacchiera });
clipShot(fr(20), fr(21), 'catch', { at: -1, zoom: [1.02, 1.1], cap: 'Catturale!', capY: 150, hi: TYPE.Cuore });
shot(fr(21), fr(22), function (el) {
  paper(el);
  const cap = caption(el, '20 creature da scoprire', { y: 110, size: 104, hi: TYPE.Chiacchiera });
  const grid = div(el, 'dexgrid');
  const ids = Object.keys(SPECIES) as SpeciesId[];
  const cells = ids.map(function (id) {
    return div(grid, 'cell secret', creature(id, 'smirk') + '<span>???</span>');
  });
  return function (k) {
    showCap(cap, k.f, 0);
    cells.forEach(function (c, i) { const t = E.back(span(k.f, 1 + i * 1.3, 9 + i * 1.3)); c.style.transform = 'scale(' + t + ') rotate(' + mix(20, 0, t) + 'deg)'; c.style.opacity = String(clamp(t * 2)); });
  };
});
clipShot(fr(22), fr(22, 2), 'sheet', { at: 18, zoom: [1.02, 1.12], origin: '50% 40%', cap: 'Un legame che cresce', hi: TYPE.Cuore });
clipShot(fr(22, 2), fr(23), 'swim', { at: 8, zoom: [1.2, 1.3], origin: '50% 45%', cap: 'Nuota con loro', hi: TYPE.Calma });
/* the evolution, drawn here: the light takes Polpino, and what it becomes stays a secret */
shot(fr(23), fr(24), function (el) {
  div(el, 'navy');
  const rays = div(el, 'evo-rays');
  const mon = div(el, 'evo-mon', creature('polpino', 'worried'));
  const white = div(el, 'white');
  const cap = caption(el, 'Cosa diventerà?', { y: 540, size: 120, hi: TYPE.Cervello });
  return function (k) {
    rays.style.transform = 'translate(-50%,-50%) rotate(' + k.f * 2.5 + 'deg) scale(' + mix(0.6, 1.3, E.out(k.p)) + ')';
    rays.style.opacity = String(span(k.f, 0, 10));
    const glow = E.in(span(k.f, 4, 28));
    mon.style.filter = 'brightness(' + (1 + glow * 4) + ') saturate(' + (1 - glow) + ') drop-shadow(0 0 ' + (20 + glow * 60) + 'px #fff)';
    mon.style.transform = 'translate(-50%,-50%) scale(' + (1 + Math.sin(k.f / 2.5) * 0.04 * (1 + glow * 3)) + ')';
    white.style.opacity = String(E.in(span(k.f, 24, 34)) * (1 - span(k.f, 36, 46) * 0.25));
    showCap(cap, k.f, 32);
  };
});
clipShot(fr(24), fr(24, 2), 'sniff', { at: 50, zoom: [1.2, 1.3], origin: '0% 22%', cap: 'Trova cose per terra', hi: TYPE.Caos });
clipShot(fr(24, 2), fr(25), 'sky', { at: 24, zoom: [1, 1.05], cap: 'Vola sopra Formia', hi: TYPE.Calma });
shot(fr(25), fr(26), function (el) {
  const bg = sceneLayer(el, 'castellone', true);
  div(el, 'shade dark');
  const giant = div(el, 'giant', creature('lamo', 'smirk'));
  const cap = caption(el, 'Di notte, sotto le mura, qualcosa dorme.', { y: 930, size: 80, hi: TYPE.Caos });
  return function (k) {
    bg.style.transform = 'scale(' + mix(1.08, 1.18, k.p) + ')';
    giant.style.transform = 'translate(-50%,0) translateY(' + mix(260, 120, E.out(k.p)) + 'px) scale(' + mix(1, 1.08, k.p) + ')';
    giant.style.opacity = String(span(k.f, 0, 12) * 0.95);
    showCap(cap, k.f, 10);
  };
});

/* ===== THE PLOT ===== */
clipShot(fr(26), fr(27), 'dig', { at: 10, zoom: [1.1, 1.22], origin: '60% 45%', cap: 'Di notte, a Gianola, qualcuno scava…', capSize: 80, capY: 150, hi: '#e6c46a' });
shot(fr(27), fr(28), function (el) {
  const bg = sceneLayer(el, 'castellone', true);
  div(el, 'shade dark');
  const cap = caption(el, 'Formia ha un segreto.', { y: 520, size: 130 });
  const sub = caption(el, 'Chi lo scoprirà per primo?', { y: 680, size: 64, font: 'Patrick Hand' });
  return function (k) {
    bg.style.transform = 'scale(' + mix(1.1, 1.25, k.p) + ')';
    showCap(cap, k.f, 2); showCap(sub, k.f, 22);
  };
});
clipShot(fr(28), fr(29), 'cicero', { at: 30, zoom: [1.04, 1.12], cap: 'Un fantasma ti guida.', capY: 150, hi: '#f4e3a4' });
clipShot(fr(29), fr(30), 'tour', { at: 6, zoom: [1, 1.06], cap: 'Seguilo, tappa dopo tappa', capY: 930, capSize: 84, hi: TYPE.Chiacchiera });

/* ===== MADE BY HAND ===== */
const SNIPS = [
  ['src/audio/synth.ts', excerpt(synthSrc, 'export function kick', 6)],
  ['src/render/world-view.ts', excerpt(viewSrc, 'export function drawWorld', 10)],
  ['tools/formia/build.ts', excerpt(buildSrc, 'import', 10)],
  ['src/story/daytime.ts', excerpt(daytimeSrc, 'export function sunTimes', 9)]
];
shot(fr(30), fr(32), function (el) {
  div(el, 'navy');
  const eds = SNIPS.map(function (s, i) { return editor(el, s[0], s[1], 'width:1100px;left:' + [-80, 900, -40, 880][i] + 'px;top:' + [40, 120, 560, 640][i] + 'px;opacity:.55'); });
  const lines = ['Fatto a mano, da zero.', 'Un solo file HTML.', 'Zero immagini: è tutto codice.', 'Musica sintetizzata, nota per nota.'];
  const caps = lines.map(function (l) { return caption(el, l, { y: 540, size: 110 }); });
  return function (k) {
    eds.forEach(function (ed, i) { typeCode(ed, 200 + k.f * 22, k.f); ed.el.style.transform = 'translateY(' + (-k.f * (i % 2 ? 2 : 3)) + 'px)'; });
    caps.forEach(function (c, i) { showCap(c, k.f, i * 24, i * 24 + 24, 1); });
    const g = span(k.f, 84, 96);
    (document.getElementById('rgb-r') as unknown as SVGFEOffsetElement).setAttribute('dx', String(g * 30));
    (document.getElementById('rgb-b') as unknown as SVGFEOffsetElement).setAttribute('dx', String(-g * 30));
    el.style.filter = g > 0 ? 'url(#rgb)' : '';
  };
});

/* ===== AND MORE ===== */
clipShot(fr(32), fr(33), 'skills', { at: 4, zoom: [1.25, 1.3], origin: '50% 45%', cap: 'Sali di livello. Scegli la tua strada.', capY: 990, capSize: 74, hi: TYPE.Cervello });
clipShot(fr(33), fr(33, 2), 'volley', { at: 30, zoom: [1.35, 1.4], origin: '50% 50%', cap: 'Beach volley', hi: TYPE.Calma });
clipShot(fr(33, 2), fr(34), 'quiz', { at: 10, zoom: [1.4, 1.5], origin: '50% 62%', cap: 'Quiz su Formia', capY: 140, hi: TYPE.Chiacchiera });
clipShot(fr(34), fr(34, 2), 'gelato', { at: 30, zoom: [1.15, 1.2], origin: '50% 70%', cap: 'Gelato', capY: 150, hi: TYPE.Cuore });
clipShot(fr(34, 2), fr(35), 'tourney', { at: 14, zoom: [1.35, 1.45], origin: '50% 48%', cap: 'Torneo degli amici', capY: 140, hi: TYPE.Chiacchiera });
clipShot(fr(35), fr(35, 2), 'fishing', { at: 80, zoom: [1.5, 1.6], origin: '50% 50%', cap: 'Vai a pesca', capY: 980, hi: TYPE.Calma });
clipShot(fr(35, 2), fr(36), 'home', { at: 6, zoom: [1.35, 1.45], origin: '50% 45%', cap: 'Le altre ti aspettano a casa', capY: 140, capSize: 80, hi: TYPE.Cuore });
clipShot(fr(36), fr(36, 2), 'covo', { at: 60, zoom: [1.3, 1.36], origin: '50% 18%', cap: 'Sfida gli amici nei covi', capSize: 84, hi: TYPE.Caos });
shot(fr(36, 2), fr(37), function (el) {
  paper(el);
  const row = div(el, 'badges');
  const items = Object.keys(COVI).map(function (k) { const b = COVI[k].badge; return div(row, 'badge', badgeSVG(b, 330) + '<b>' + esc(b.name.replace(/^Spilla /, '')) + '</b>'); });
  const cap = caption(el, 'Vinci le spille', { y: 150, size: 110, hi: TYPE.Chiacchiera });
  return function (k) {
    showCap(cap, k.f, 0);
    items.forEach(function (it, i) { const t = E.back(span(k.f, 2 + i * 4, 12 + i * 4)); it.style.transform = 'scale(' + t + ') rotate(' + mix(-30, (i ? 6 : -6), t) + 'deg)'; });
  };
});
clipShot(fr(37), fr(37, 3), 'boss', { at: 250, zoom: [1.75, 1.65], origin: '50% 28%', cap: 'Supera l\'Esame!', hi: RED });
shot(fr(37, 3), fr(38), function (el) {
  const picks: [string, number][] = [['battle', BATTLE_AT + 36], ['friends', 240], ['porto-notte', 50], ['boss', 270], ['dig', 60], ['piazza-notte', 40]];
  const img = document.createElement('img'); img.className = 'clip'; el.appendChild(img);
  return function (k) { const q = picks[Math.min(picks.length - 1, Math.floor(k.f / 2))]; const src = clipSrc(q[0], q[1]); if (img.getAttribute('src') !== src) img.src = src; img.style.transform = 'scale(' + (1.1 + (k.f % 2) * 0.05) + ')'; };
});

/* ===== THE END ===== */
shot(fr(38), FRAMES, function (el) {
  const bg = sceneLayer(el, 'porto', true);
  div(el, 'shade');
  const logo = div(el, 'logo end', '<span class="hl"></span>' + sticker('Lotte tra Amici', 190));
  const hl = logo.querySelector('.hl') as HTMLElement;
  const btn = div(el, 'play', 'Gioca gratis nel browser');
  const mons = (['polpino', 'ramarrino', 'gabbi'] as SpeciesId[]).map(function (id, i) { return div(el, 'mon m' + i, creature(id, i === 1 ? 'grin' : 'smirk')); });
  const ant = div(el, 'ant', person('antonio', 'grin'));
  const next = caption(el, 'Formia ti aspetta.', { y: 760, size: 58, font: 'Patrick Hand' });
  const made = div(el, 'made', 'Fatto a mano a Formia');
  return function (k) {
    const f = k.f;
    bg.style.transform = 'scale(' + mix(1.15, 1.05, E.out(k.p)) + ')';
    const t = span(f, 0, 10);
    logo.style.transform = 'translate(-50%,-50%) scale(' + mix(2.2, 1, E.back(t)) + ') rotate(-2deg)';
    logo.style.opacity = String(clamp(t * 4));
    hl.style.transform = 'skewX(-10deg) scaleX(' + E.out(span(f, 6, 16)) + ')';
    const b = E.back(span(f, 22, 32)), press = f >= 84 && f < 90 ? 0.92 : 1;
    btn.style.transform = 'translate(-50%,-50%) scale(' + b * press + ')';
    btn.style.boxShadow = press < 1 ? '0 2px 0 ' + INK : '0 10px 0 ' + INK;
    mons.forEach(function (m, i) { const u = E.back(span(f, 8 + i * 4, 18 + i * 4)); m.style.transform = 'translateY(' + mix(400, Math.sin((f + i * 9) / 7) * 8, u) + 'px)'; });
    ant.style.transform = 'translateY(' + mix(500, 0, E.out(span(f, 4, 16))) + 'px)';
    showCap(next, f, 48);
    made.style.opacity = String(span(f, 96, 110));
  };
});

/* ---------- the whole film, frame by frame ---------- */
const FLASH: [number, number, string][] = [[fr(4), 12, '#fff'], [fr(18), 8, '#fff'], [fr(26), 10, '#000'], [fr(32), 8, '#fff'], [fr(38), 12, '#fff'], [fr(17), 4, '#fff']];
const SHAKE: [number, number, number][] = [[fr(4), 10, 22], [fr(18), 8, 18], [fr(32), 8, 16], [fr(38), 10, 20], [fr(8, 3), 6, 10], [fr(21, 0.5), 4, 6]];
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
  /* flashes, shakes, the letterbox of the plot, the fade at the end */
  let fl = 0, col = '#fff';
  for (const [a, n, c] of FLASH) if (g >= a && g < a + n) { const v = 1 - (g - a) / n; if (v > fl) { fl = v; col = c; } }
  fx.flash.style.opacity = String(fl); fx.flash.style.background = col;
  let sx = 0, sy = 0;
  for (const [a, n, amp] of SHAKE) if (g >= a && g < a + n) { const v = amp * (1 - (g - a) / n); sx += (rnd(g) - 0.5) * 2 * v; sy += (rnd(g + 99) - 0.5) * 2 * v; }
  for (const v of live.values()) v.el.style.translate = sx + 'px ' + sy + 'px';
  const lb = Math.min(span(g, fr(26), fr(26) + 8), 1 - span(g, fr(30) - 6, fr(30)));
  fx.top.style.height = fx.bottom.style.height = (lb * 110) + 'px';
  fx.fade.style.opacity = String(span(g, FRAMES - 40, FRAMES - 4));
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
.white { position: absolute; inset: 0; background: #fff; }
.paper { position: absolute; inset: 0; background-image: linear-gradient(90deg, transparent 158px, #e8a39b 158px, #e8a39b 161px, transparent 161px), linear-gradient(#dfe6f3 2px, transparent 2px), linear-gradient(90deg, #dfe6f3 2px, transparent 2px); background-size: 100% 100%, 48px 48px, 48px 48px; }
.shade { position: absolute; inset: 0; background: radial-gradient(70% 60% at 50% 45%, rgba(15,20,48,.45), rgba(15,20,48,.15) 70%, rgba(15,20,48,.4)); }
.shade.dark { background: radial-gradient(70% 70% at 50% 45%, rgba(10,12,30,.35), rgba(10,12,30,.75)); }
.scene { position: absolute; inset: -40px; }
.scene svg { width: 100%; height: 100%; display: block; }
.stk { position: relative; display: inline-block; line-height: 1.02; white-space: nowrap; }
.stk-b { position: absolute; left: 0; top: 0; }
.stk-f { position: relative; }
.cap { position: absolute; white-space: nowrap; z-index: 3; }
.cap .w { display: inline-block; position: relative; z-index: 1; }
.cap .hi { position: absolute; left: -30px; right: -30px; top: 18%; bottom: 8%; border-radius: 14px; transform-origin: 0 50%; z-index: 0; opacity: .95; }
.place { position: absolute; left: 70px; top: 64px; padding: 16px 30px 18px; background: #fff; border: 5px solid ${INK}; border-radius: 22px; box-shadow: 9px 10px 0 ${INK}; color: ${INK}; z-index: 3; }
.place small { display: block; font: 700 24px 'Atkinson Hyperlegible'; letter-spacing: .14em; opacity: .75; }
.place b { display: block; font: 72px/1 'Lilita One'; margin-top: 4px; }
.editor { position: absolute; background: #151b3d; border: 4px solid #2b3570; border-radius: 22px; box-shadow: 0 30px 80px rgba(0,0,0,.45); overflow: hidden; transform-origin: 50% 0; }
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
.editor .cur { display: inline-block; width: 16px; height: 34px; background: #ffe45c; vertical-align: -6px; margin-left: 2px; }
.drone { position: absolute; inset: 0; perspective: 1100px; perspective-origin: 50% 18%; overflow: hidden; }
.drone .sky { position: absolute; inset: 0; background: linear-gradient(#7cc8f2, #cdeefe 45%, #eaf8ff); }
.drone .cam { position: absolute; left: 0; top: 0; width: 5280px; height: 2624px; transform-style: preserve-3d; }
.drone .map { display: block; width: 5280px; height: 2624px; }
.drone .haze { position: absolute; inset: 0; background: linear-gradient(rgba(234,248,255,1) 0%, rgba(234,248,255,.55) 16%, rgba(234,248,255,0) 36%), radial-gradient(130% 80% at 50% 110%, rgba(15,20,48,.25), transparent 60%); }
.formia { position: absolute; left: 50%; top: 46%; z-index: 3; }
.logo { position: absolute; left: 50%; top: 44%; z-index: 3; white-space: nowrap; }
.logo .hl { position: absolute; left: -26px; width: 600px; top: 26%; bottom: 6%; background: ${TYPE.Cervello}; border-radius: 16px; transform-origin: 0 50%; z-index: 0; }
.logo .stk { z-index: 1; }
.logo.end { top: 30%; }
.bits { position: absolute; left: 50%; top: 44%; z-index: 2; }
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
.ring { position: absolute; left: 50%; top: 560px; }
.tchip { position: absolute; left: 0; top: 0; padding: 18px 34px 14px; border: 6px solid ${INK}; border-radius: 18px; box-shadow: 8px 9px 0 ${INK}; font: 54px 'Lilita One'; color: ${INK}; white-space: nowrap; }
.boss-bg { position: absolute; inset: 0; background: radial-gradient(60% 70% at 32% 55%, #7a1f2e, #200a16 70%); }
.esame { position: absolute; left: 80px; top: 120px; width: 900px; height: 900px; filter: drop-shadow(0 0 60px rgba(255,80,80,.5)); }
.esame svg { width: 100%; height: 100%; }
.bsub { position: absolute; left: 970px; top: 640px; font: 58px 'Patrick Hand'; color: #ffd2c9; }
.shadows { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; gap: 40px; }
.shadow { width: 300px; height: 300px; filter: brightness(0); }
.shadow svg { width: 100%; height: 100%; }
.stripes { position: absolute; inset: 0; display: flex; flex-direction: column; }
.stripe { flex: 1; background: #0b0d1c; }
.bang { position: absolute; left: 50%; top: 50%; }
.stampbig { position: absolute; left: 50%; top: 42%; padding: 26px 60px 18px; border: 14px solid ${RED}; border-radius: 26px; color: ${RED}; background: ${PAPER}; font: 210px/1 'Lilita One'; letter-spacing: .05em; z-index: 3; box-shadow: 14px 16px 0 rgba(31,44,110,.6); }
.dexgrid { position: absolute; left: 150px; right: 150px; top: 215px; display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px 10px; }
.cell { text-align: center; }
.cell svg { width: 215px; height: 215px; }
.cell span { display: block; font: 34px 'Patrick Hand'; color: ${INK}; margin-top: -10px; }
.cell.secret svg { filter: brightness(0); }
.badges { position: absolute; left: 0; right: 0; top: 330px; display: flex; justify-content: center; gap: 160px; }
.badge { text-align: center; filter: drop-shadow(10px 12px 0 rgba(31,44,110,.35)); }
.badge b { display: block; margin-top: 18px; font: 54px 'Lilita One'; color: ${INK}; }
.evo-rays { position: absolute; left: 50%; top: 50%; width: 1800px; height: 1800px; background: repeating-conic-gradient(rgba(255, 255, 255, .22) 0 9deg, transparent 9deg 24deg); border-radius: 50%; -webkit-mask: radial-gradient(circle, #000 20%, transparent 68%); mask: radial-gradient(circle, #000 20%, transparent 68%); }
.evo-mon { position: absolute; left: 50%; top: 50%; width: 560px; height: 560px; }
.evo-mon svg { width: 100%; height: 100%; }
.giant { position: absolute; left: 50%; bottom: 0; width: 760px; height: 760px; filter: brightness(0) drop-shadow(0 0 30px rgba(255, 170, 80, .55)); }
.giant svg { width: 100%; height: 100%; }
.stones { position: absolute; left: 0; right: 0; top: 270px; display: flex; justify-content: center; gap: 120px; }
.stone { text-align: center; filter: drop-shadow(0 0 40px var(--c)); }
.stone b { display: block; font: 48px 'Lilita One'; color: #fff; margin-top: 10px; -webkit-text-stroke: 2px ${INK}; }
.play { position: absolute; left: 50%; top: 56%; padding: 26px 64px 22px; background: ${RED}; color: #fff; border: 7px solid ${INK}; border-radius: 26px; font: 76px 'Lilita One'; white-space: nowrap; z-index: 4; }
.mon { position: absolute; bottom: 40px; width: 300px; height: 300px; z-index: 3; }
.mon svg { width: 100%; height: 100%; }
.m0 { left: 140px; } .m1 { left: 420px; bottom: 10px; } .m2 { right: 140px; }
.ant { position: absolute; right: 420px; bottom: -60px; width: 330px; height: 380px; z-index: 3; }
.ant svg { width: 100%; height: 100%; }
.made { position: absolute; left: 0; right: 0; bottom: 18px; text-align: center; font: 700 26px 'Atkinson Hyperlegible'; color: #fff; letter-spacing: .2em; text-transform: uppercase; opacity: 0; z-index: 4; }
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
