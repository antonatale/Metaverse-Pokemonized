import { reduced } from './dom';

/* The dawn after the night of 3:12 (27 November 2026, Antonio: from the tale of the prologue to the world «voglio che
   sia smoother… più tempo e più cose che succedono per fare in modo che l'atmosfera si sciolga»). When the last line of
   the prologue has been read, the words go, and behind them Formia comes out of the dark: the gulf, Castellone on its
   hill with the tower, the Aurunci behind, Gaeta across the water. A clock in the corner runs from 3:12 to the morning;
   the stars go out, the sky goes from ink to violet to pink to gold; the sun comes up behind the mountains; the
   coloured lights of the night, the creatures, drift down and go to ground among the houses, in the olives, in the sea;
   the first gulls cross; the lights of the houses go off one by one. The music of the mystery melts into the music of
   the dawn (audio/tracks.ts `alba`). It is all drawn here, flat colours and the ink line of the rest of the game. */

/** how long the dawn takes, from the first light to the morning (ms) */
export const DAWN_MS = 9000;
const W = 800, H = 450;
const n = (v: number) => Math.round(v * 10) / 10;
function ridge(pts: number[][], base: number, fill: string, cls: string, extra = ''): string {
  return '<path class="' + cls + '" d="M0 ' + base + ' L' + pts.map(function (p) { return n(p[0]) + ' ' + n(p[1]); }).join(' L') + ' L' + W + ' ' + base + ' Z" fill="' + fill + '"' + extra + '/>';
}
/** the picture: every part that changes colour carries a class (styles/story.css moves them) */
function picture(): string {
  var s = '<svg class="dawn-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true">';
  /* the sky: four skies laid over one another, each fading in after the last */
  s += '<defs>' +
    '<linearGradient id="dw-s1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05060d"/><stop offset="1" stop-color="#1a2350"/></linearGradient>' +
    '<linearGradient id="dw-s2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1747"/><stop offset=".7" stop-color="#5b3a7a"/><stop offset="1" stop-color="#b0567a"/></linearGradient>' +
    '<linearGradient id="dw-s3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a6fb0"/><stop offset=".6" stop-color="#f19a8a"/><stop offset="1" stop-color="#ffc977"/></linearGradient>' +
    '<linearGradient id="dw-s4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc1ef"/><stop offset=".7" stop-color="#bfe3f7"/><stop offset="1" stop-color="#fff0c9"/></linearGradient>' +
    '<radialGradient id="dw-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c9"/><stop offset=".45" stop-color="#ffd166"/><stop offset="1" stop-color="#ffd166" stop-opacity="0"/></radialGradient>' +
    '<linearGradient id="dw-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a5d8f"/><stop offset="1" stop-color="#173a5e"/></linearGradient>' +
    '</defs>';
  ['s1', 's2', 's3', 's4'].forEach(function (k) { s += '<rect class="dw-sky dw-' + k + '" width="' + W + '" height="' + H + '" fill="url(#dw-' + k + ')"/>'; });
  /* the stars, going out */
  var stars = '';
  for (var i = 0; i < 46; i++) {
    var x = (i * 173.3) % W, y = (i * 61.7) % 190 + 8, r = i % 7 === 0 ? 1.9 : i % 3 === 0 ? 1.3 : 0.9;
    stars += '<circle cx="' + n(x) + '" cy="' + n(y) + '" r="' + r + '" fill="#e9ecff" style="--tw:' + (i % 5) * 0.4 + 's"/>';
  }
  s += '<g class="dw-stars">' + stars + '</g>';
  /* the sun, behind the mountains to the east, and its glow */
  s += '<g class="dw-sun"><circle cx="640" cy="250" r="120" fill="url(#dw-sun)"/><circle cx="640" cy="250" r="34" fill="#fff1b8" stroke="#1c2340" stroke-width="3"/></g>';
  /* the Aurunci, far; Castellone's hill nearer, with its houses and the tower; Gaeta across the gulf, to the west */
  s += ridge([[0, 232], [60, 210], [130, 222], [200, 186], [270, 200], [340, 168], [420, 190], [500, 150], [580, 176], [640, 158], [700, 182], [760, 170], [800, 186]], 290, '#3a3f6b', 'dw-far');
  s += ridge([[0, 278], [40, 270], [90, 276], [120, 262], [150, 270]], 300, '#2b3058', 'dw-gaeta');
  s += ridge([[230, 300], [270, 262], [320, 246], [380, 238], [440, 244], [500, 262], [540, 282], [580, 300]], 310, '#262a4d', 'dw-hill');
  /* the houses of Castellone, their windows lit, going off one by one */
  var houses = '';
  [[300, 252, 22, 18], [326, 244, 18, 16], [350, 238, 24, 18], [378, 232, 20, 16], [402, 236, 22, 18], [430, 240, 18, 16], [454, 248, 24, 18], [482, 256, 20, 16], [312, 270, 20, 14], [344, 262, 22, 16], [374, 256, 24, 16], [404, 258, 20, 16], [432, 262, 22, 16], [462, 270, 20, 14]].forEach(function (h, k) {
    houses += '<rect class="dw-house" x="' + h[0] + '" y="' + h[1] + '" width="' + h[2] + '" height="' + h[3] + '" fill="#2f335c" stroke="#1c2340" stroke-width="1.5"/>' +
      '<rect class="dw-win" style="--off:' + (3.2 + (k * 0.37) % 4) + 's" x="' + (h[0] + h[2] / 2 - 2.5) + '" y="' + (h[1] + 5) + '" width="5" height="5" fill="#ffd166"/>';
  });
  /* the tower of Castellone (the old castle, at the top of the hill) */
  houses += '<path class="dw-house" d="M386 232 L386 196 L382 196 L382 188 L388 188 L388 192 L393 192 L393 188 L398 188 L398 192 L403 192 L403 188 L409 188 L409 196 L405 196 L405 232 Z" fill="#2f335c" stroke="#1c2340" stroke-width="2"/>';
  s += '<g class="dw-town">' + houses + '</g>';
  /* the shore and the sea, with the sun's road on it once it is up */
  s += '<rect x="0" y="300" width="' + W + '" height="150" fill="url(#dw-sea)"/><rect class="dw-sea" x="0" y="300" width="' + W + '" height="150" fill="#3d8fd0"/>';
  s += '<g class="dw-glint">' + [0, 1, 2, 3, 4, 5].map(function (k) { return '<rect x="' + (618 - k * 4) + '" y="' + (310 + k * 16) + '" width="' + (44 + k * 10) + '" height="3" rx="1.5" fill="#fff1b8"/>'; }).join('') + '</g>';
  s += '<path d="M0 300 Q200 294 400 300 T800 300" fill="none" stroke="#1c2340" stroke-width="2.5"/>';
  /* the lights of the night, the creatures: coloured, drifting down to the houses, the olives, the sea, and gone */
  var lights = [['#6fd3ff', 140, 120, 320, 300], ['#ff7ad9', 260, 90, 360, 250], ['#ffd166', 420, 70, 410, 236], ['#59e07a', 520, 110, 470, 262], ['#c3a0ff', 600, 80, 560, 300], ['#ff9f1c', 700, 130, 700, 320], ['#7fe0ff', 60, 150, 90, 330]];
  s += '<g class="dw-lights">' + lights.map(function (l, k) {
    return '<circle class="dw-light" style="--dx:' + (+l[3] - +l[1]) + 'px;--dy:' + (+l[4] - +l[2]) + 'px;--ld:' + (k * 0.35) + 's" cx="' + l[1] + '" cy="' + l[2] + '" r="6" fill="' + l[0] + '"/>';
  }).join('') + '</g>';
  /* the first gulls */
  s += '<g class="dw-gulls">' + [[0, 0], [26, 10], [52, -6]].map(function (g) { return '<path d="M' + g[0] + ' ' + g[1] + ' q6 -7 12 0 q6 -7 12 0" fill="none" stroke="#1c2340" stroke-width="2.6" stroke-linecap="round"/>'; }).join('') + '</g>';
  return s + '</svg>';
}
/** the dawn, ready to start: the picture and the clock; `at` is when (ms after the sheet opens) the light comes */
export function dawnHtml(at: number): string {
  return '<div class="dawn" style="--da:' + at + 'ms;--dl:' + DAWN_MS + 'ms" aria-hidden="true">' + picture() +
    '<div class="dawn-clock"><b>03:12</b><small>Formia</small></div></div>';
}
/** the clock runs from 3:12 to 7:48 while the dawn plays; `then` when the sun is up */
export function dawnRun(root: HTMLElement, at: number, then: () => void): () => void {
  var clock = root.querySelector('.dawn-clock b') as HTMLElement | null, t0 = 0, raf = 0, done = false, told = false, timer: ReturnType<typeof setTimeout>;
  var from = 3 * 60 + 12, to = 7 * 60 + 48;
  function show(m: number) { if (clock) clock.textContent = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.floor(m % 60)).padStart(2, '0'); }
  function tick(now: number) {
    if (!t0) t0 = now;
    var k = Math.min(1, (now - t0) / (DAWN_MS * 0.86));
    /* slow at first, the hours of the dark; quick through the dawn */
    show(from + (to - from) * (k * k * (3 - 2 * k)));
    if (k < 1 && !done) raf = requestAnimationFrame(tick);
  }
  if (reduced) { show(to); timer = setTimeout(function () { if (!told) { told = true; then(); } }, 30); }
  else timer = setTimeout(function () {
    raf = requestAnimationFrame(tick);
    /* the hand of the night goes with the dark */
    var hand = root.querySelector('.prologo-lamo') as HTMLElement | null;
    if (hand && hand.animate) hand.animate([{ opacity: getComputedStyle(hand).opacity }, { opacity: 0 }], { duration: 1200, fill: 'forwards' });
    /* the light comes: the music of the dawn starts melting in now, and is whole when the sun is up */
    if (!told) { told = true; then(); }
  }, at);
  return function () { done = true; clearTimeout(timer); cancelAnimationFrame(raf); };
}
