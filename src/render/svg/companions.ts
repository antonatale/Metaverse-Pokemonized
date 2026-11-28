import type { Species } from '../../data/creatures';

/* The creatures of the seven (data/companions.ts), drawn like the others of render/svg/creatures.ts: one SVG, 200 by
   200, the feet on y 190, flat colours with the dark outline, the face (eyes, mouth, blush) added on top by
   creatures.ts for each expression. Every form is a creature of its own: the first is a little animal, the second
   wears what its friend wears, the third is something more than an animal. The parts that move (an ear tuft that
   twitches, a lantern that flickers, a blade that glows, a record that spins) carry a `cg-` class: styles/companions.css
   moves them, and they keep still with reduced motion. `over`: what goes in front of the face (a helmet's glass). */

const INK = '#1c2340';
export interface Face {
  eyes: [number, number][]; r: number; mouth: [number, number] | null; w: number; iris?: string; lid: string; rune: [number, number];
  brows?: number[];
  /** drawn over the face, every expression (a helmet's glass, a visor) */
  over?: string;
  line?: string;
}
type Draw = (sp: Species) => [string, Face];

/* ---------- the pen ---------- */
const n = (v: number) => (Math.round(v * 10) / 10).toString();
function E(cx: number, cy: number, rx: number, ry: number, fill: string, sw = 4, extra = '') {
  return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + n(rx) + '" ry="' + n(ry) + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : '') + extra + '/>';
}
function C(cx: number, cy: number, r: number, fill: string, sw = 4, extra = '') { return E(cx, cy, r, r, fill, sw, extra); }
function P(d: string, fill: string, sw = 4, extra = '') {
  return '<path d="' + d + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round" stroke-linecap="round"' : '') + extra + '/>';
}
/** a thick curved limb or tail: the outline, then the colour on top */
function L(d: string, col: string, w: number, extra = '') {
  return '<g' + extra + '><path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (w + 8) + '" stroke-linecap="round" stroke-linejoin="round"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/></g>';
}
/** a plain stroke */
function S(d: string, col: string, w: number, extra = '') { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + extra + '/>'; }
function poly(pts: number[], fill: string, sw = 3, extra = '') {
  var d = 'M' + pts[0] + ' ' + pts[1];
  for (var i = 2; i < pts.length; i += 2) d += ' L' + pts[i] + ' ' + pts[i + 1];
  return P(d + 'Z', fill, sw, extra);
}
function star4(cx: number, cy: number, r: number, fill: string, sw = 1.6, extra = '') {
  var k = r * 0.28;
  return P('M' + cx + ' ' + (cy - r) + ' L' + (cx + k) + ' ' + (cy - k) + ' L' + (cx + r) + ' ' + cy + ' L' + (cx + k) + ' ' + (cy + k) + ' L' + cx + ' ' + (cy + r) + ' L' + (cx - k) + ' ' + (cy + k) + ' L' + (cx - r) + ' ' + cy + ' L' + (cx - k) + ' ' + (cy - k) + 'Z', fill, sw, extra);
}
function bolt(x: number, y: number, s: number, fill: string, sw = 2.2, extra = '') {
  var k = s / 30;
  return P('M' + n(x + 6 * k) + ' ' + y + ' L' + n(x - 6 * k) + ' ' + n(y + 16 * k) + ' L' + n(x + 1 * k) + ' ' + n(y + 16 * k) + ' L' + n(x - 4 * k) + ' ' + n(y + 30 * k) + ' L' + n(x + 10 * k) + ' ' + n(y + 11 * k) + ' L' + n(x + 3 * k) + ' ' + n(y + 11 * k) + ' L' + n(x + 8 * k) + ' ' + y + 'Z', fill, sw, extra);
}
/** the same drawing mirrored, left to right */
function mirror(svg: string) { return '<g transform="translate(200 0) scale(-1 1)">' + svg + '</g>'; }
/** both sides: a part drawn on the left, and again mirrored on the right */
function both(svg: string) { return svg + mirror(svg); }
const g = (cls: string, inner: string) => '<g class="' + cls + '">' + inner + '</g>';

/* ======================================================================================================== */
/* ---------- Costanzo: the caracal ---------- */
/** a caracal's ear, with the long black tuft: left side, base at (x, y), tip up at (tx, ty) */
function caracalEar(x: number, y: number, tx: number, ty: number, a: Species['art'], tuft: number) {
  var inner = 'M' + (x + 4) + ' ' + (y - 2) + ' Q' + (tx + 4) + ' ' + (ty + 22) + ' ' + (tx + 3) + ' ' + (ty + 12) + ' Q' + (tx + 18) + ' ' + (ty + 26) + ' ' + (x + 24) + ' ' + (y - 6) + 'Z';
  return P('M' + x + ' ' + y + ' Q' + (tx - 8) + ' ' + (ty + 26) + ' ' + tx + ' ' + ty + ' Q' + (tx + 22) + ' ' + (ty + 20) + ' ' + (x + 30) + ' ' + (y - 8) + 'Z', a.accent, 4) +
    P(inner, '#f3cfae', 0) +
    g('cg-tuft', P('M' + (tx - 2) + ' ' + (ty + 4) + ' Q' + (tx - 8) + ' ' + (ty - tuft * 0.6) + ' ' + (tx - 16) + ' ' + (ty - tuft) + ' Q' + (tx + 2) + ' ' + (ty - tuft * 0.5) + ' ' + (tx + 5) + ' ' + (ty + 3) + 'Z', a.accent, 3));
}
/** the face of the caracal: the white muzzle, the black lines from the eyes, the dark nose */
function caracalHead(a: Species['art'], cy: number, k: number, tuft: number) {
  var s = '';
  s += both(caracalEar(100 - 40 * k, cy - 18 * k, 100 - 46 * k, cy - 70 * k, a, tuft));
  s += E(100, cy, 46 * k, 40 * k, a.main);
  /* the dark marks over the eyes and the lines down to the nose */
  s += both(S('M' + n(100 - 22 * k) + ' ' + n(cy - 22 * k) + ' L' + n(100 - 18 * k) + ' ' + n(cy - 30 * k), a.dark, 4) +
    S('M' + n(100 - 9 * k) + ' ' + n(cy + 2 * k) + ' Q' + n(100 - 8 * k) + ' ' + n(cy + 10 * k) + ' ' + n(100 - 4 * k) + ' ' + n(cy + 14 * k), a.accent, 3));
  /* the white muzzle and chin, the whisker pads */
  s += E(100 - 13 * k, cy + 20 * k, 15 * k, 11 * k, a.belly, 0) + E(100 + 13 * k, cy + 20 * k, 15 * k, 11 * k, a.belly, 0) + E(100, cy + 30 * k, 12 * k, 7 * k, a.belly, 0);
  s += both(S('M' + n(100 - 20 * k) + ' ' + n(cy + 20 * k) + ' L' + n(100 - 52 * k) + ' ' + n(cy + 14 * k) + ' M' + n(100 - 20 * k) + ' ' + n(cy + 25 * k) + ' L' + n(100 - 50 * k) + ' ' + n(cy + 28 * k), '#ffffff', 2, ' opacity=".85"'));
  s += P('M' + n(100 - 7 * k) + ' ' + n(cy + 10 * k) + ' L' + n(100 + 7 * k) + ' ' + n(cy + 10 * k) + ' L100 ' + n(cy + 17 * k) + 'Z', '#3a2418', 2.5);
  return s;
}
function caracal(sp: Species): [string, Face] {
  if (sp.stage === 2) return caracalla(sp);
  if (sp.stage === 3) return lincesare(sp);
  var a = sp.art, s = '';
  /* round as a cushion, sitting: the short tail with its black tip */
  s += L('M138 172 Q164 172 166 156', a.main, 13) + C(166, 154, 6, a.accent, 3);
  s += E(100, 150, 50, 38, a.main) + E(100, 158, 30, 26, a.belly, 0);
  s += both(S('M64 142 q6 4 4 12 M68 160 q6 2 6 10', a.dark, 3, ' opacity=".5"'));
  s += E(80, 184, 14, 8, a.belly, 3.5) + E(120, 184, 14, 8, a.belly, 3.5) + both(S('M74 184 v4 M80 184 v4', INK, 2));
  s += caracalHead(a, 104, 1, 28);
  return [s, { eyes: [[83, 102], [117, 102]], r: 10, mouth: [100, 130], w: 12, iris: '#e0a030', lid: a.main, rune: [100, 160] }];
}
/* the emperor of the baths: sitting up straight on a step, a paw raised to speak, the red cloak, the laurel */
function laurel(cx: number, cy: number, w: number) {
  var s = '';
  for (var side = -1; side <= 1; side += 2) for (var i = 0; i < 5; i++) {
    var t = i / 4, x = cx + side * (w * 0.18 + w * 0.32 * t), y = cy - 6 + t * t * 14, rot = side * (20 + i * 14);
    s += E(x, y, 7, 3.6, '#7fb347', 2, ' transform="rotate(' + rot + ' ' + n(x) + ' ' + n(y) + ')"');
  }
  return s + C(cx, cy - 6, 3.5, '#e8c547', 2);
}
function caracalla(sp: Species): [string, Face] {
  var a = sp.art, s = '', RED = '#b8322e', REDD = '#7e1d1d', GOLD = '#e8c547';
  /* the step of marble */
  s += P('M40 180 L160 180 L166 192 L34 192Z', '#eceff4', 3.5) + S('M48 186 H152', '#c9d0dc', 2);
  /* the cloak, falling behind */
  s += P('M62 92 Q36 140 46 184 L154 184 Q164 140 138 92 Q100 108 62 92Z', RED, 4) + S('M58 120 Q54 150 60 178 M142 120 Q146 150 140 178', REDD, 3);
  /* the body, upright; the tail */
  s += L('M128 176 Q150 178 152 164', a.main, 11) + C(152, 162, 5, a.accent, 3);
  s += E(100, 146, 38, 40, a.main) + E(100, 152, 22, 30, a.belly, 0);
  /* the paw raised to speak, the other on the scroll */
  s += L('M126 128 Q148 112 150 88', a.main, 14) + E(150, 84, 10, 9, a.belly, 3.5) + S('M146 80 v-4 M151 79 v-5 M156 81 v-4', INK, 2);
  s += P('M66 160 L92 160 L92 174 L66 174Z', '#f4ead2', 3) + C(66, 167, 7, '#e7d9b8', 3) + C(92, 167, 7, '#e7d9b8', 3) + S('M74 165 H86 M74 169 H84', '#a0896a', 1.5);
  s += E(80, 182, 13, 7, a.belly, 3.5) + E(120, 182, 13, 7, a.belly, 3.5);
  /* the brooch that holds the cloak */
  s += C(100, 116, 7, GOLD, 3) + C(100, 116, 3, RED, 0);
  s += caracalHead(a, 86, 0.92, 40);
  s += laurel(100, 52, 70);
  return [s, { eyes: [[85, 84], [115, 84]], r: 9.5, mouth: [100, 110], w: 11, iris: '#e8a224', lid: a.main, rune: [100, 140] }];
}
/* Lincesare: the caracal become Caesar. The legionary's golden cuirass, the purple cloak that moves without wind, the
   laurel, the tufts long as the plumes of a helmet; behind him the eagle of the legion on its staff */
function lincesare(sp: Species): [string, Face] {
  var a = sp.art, s = '', PUR = '#6b2a8c', PURD = '#45175e', GOLD = '#e8c547', GOLDD = '#b08a1f';
  /* the eagle of the legion, on its staff */
  s += S('M160 188 L160 36', INK, 8) + S('M160 188 L160 36', '#9a6a3a', 4);
  s += P('M160 18 Q146 10 134 20 Q146 22 150 28 Q140 30 132 40 Q148 36 156 34 L164 34 Q172 36 188 40 Q180 30 170 28 Q174 22 186 20 Q174 10 160 18Z', GOLD, 3);
  s += C(160, 22, 5, GOLD, 2.5) + P('M164 22 L170 24 L164 26Z', GOLDD, 1.5);
  s += P('M146 42 H174 V60 H146Z', PUR, 3) + '<text x="160" y="55" text-anchor="middle" font-size="10" font-family="Georgia,serif" font-weight="700" fill="' + GOLD + '">SPQF</text>';
  /* the cloak, wide, moving */
  s += g('cg-cape', P('M60 96 Q14 136 24 190 L176 190 Q186 136 140 96 Q100 116 60 96Z', PUR, 4) + S('M44 130 Q36 160 42 186 M156 130 Q164 160 158 186 M74 120 Q66 150 70 186', PURD, 3));
  /* the body, strong; the hind legs, the tail */
  s += L('M136 178 Q160 180 162 164', a.main, 12) + C(162, 162, 6, a.accent, 3);
  s += E(100, 148, 46, 42, a.main);
  s += L('M70 160 Q66 176 72 186', a.main, 18) + L('M130 160 Q134 176 128 186', a.main, 18);
  s += E(70, 186, 14, 7, a.belly, 3.5) + E(130, 186, 14, 7, a.belly, 3.5);
  /* the cuirass: the muscles cast in gold, the leather straps under it */
  s += P('M66 120 Q100 108 134 120 L130 160 Q100 172 70 160Z', GOLD, 4);
  s += S('M100 118 V164 M82 128 Q90 136 98 132 M118 128 Q110 136 102 132 M84 146 Q92 152 98 148 M116 146 Q108 152 102 148', GOLDD, 2.5);
  for (var i = 0; i < 6; i++) s += P('M' + (72 + i * 10) + ' 160 l10 0 l-1 14 l-8 0Z', '#8a4a2a', 2.5);
  s += C(76, 122, 6, PUR, 2.5) + C(124, 122, 6, PUR, 2.5);
  s += caracalHead(a, 84, 1, 54);
  s += laurel(100, 48, 76);
  return [s, { eyes: [[83, 82], [117, 82]], r: 10, mouth: [100, 110], w: 12, iris: '#ffb020', lid: a.main, rune: [100, 140], brows: [1, -1] }];
}

/* ======================================================================================================== */
/* ---------- Claudia: the black cat ---------- */
/** a fluffy cloud of fur: circles stroked wide, then filled */
function fluff(list: number[][], fill: string, sw = 4) {
  return list.map(function (b) { return '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="' + (sw * 2) + '"/>'; }).join('') +
    list.map(function (b) { return '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="' + fill + '"/>'; }).join('');
}
/** the shine on a black coat, so the fur reads as fur and not as a hole */
const SHEEN = '#7d6e9c';
/** a short arc of shine on the upper left of each tuft of fur */
function sheen(list: number[][]) {
  return list.map(function (b) {
    var r = b[2] - Math.max(3, b[2] * 0.16), a0 = 200 * Math.PI / 180, a1 = 262 * Math.PI / 180;
    return S('M' + n(b[0] + Math.cos(a0) * r) + ' ' + n(b[1] + Math.sin(a0) * r) + ' A' + n(r) + ' ' + n(r) + ' 0 0 1 ' + n(b[0] + Math.cos(a1) * r) + ' ' + n(b[1] + Math.sin(a1) * r), SHEEN, Math.max(2, b[2] * 0.09));
  }).join('');
}
function catEar(x: number, y: number, h: number, col: string, inner: string) {
  return P('M' + (x - 14) + ' ' + y + ' L' + (x - 4) + ' ' + (y - h) + ' L' + (x + 14) + ' ' + (y - 4) + 'Z', col, 4) + P('M' + (x - 8) + ' ' + (y - 2) + ' L' + (x - 3) + ' ' + (y - h + 10) + ' L' + (x + 7) + ' ' + (y - 5) + 'Z', inner, 0);
}
function blackcat(sp: Species): [string, Face] {
  if (sp.stage === 2) return teduabolica(sp);
  if (sp.stage === 3) return teduarca(sp);
  var a = sp.art, s = '';
  /* the tail, a plume that curls up */
  s += g('cg-tail', fluff([[150, 168, 12], [162, 154, 13], [168, 136, 13], [164, 118, 11], [154, 106, 9]], a.main, 3.5));
  s += both(catEar(70, 92, 34, a.main, '#5a3e52'));
  /* a ball of long black fur: only the eyes show */
  s += fluff([[100, 112, 44], [66, 132, 26], [134, 132, 26], [72, 160, 26], [128, 160, 26], [100, 166, 32], [84, 84, 16], [116, 84, 16]], a.main, 4);
  s += sheen([[66, 132, 26], [72, 160, 26], [100, 112, 44], [134, 132, 26], [128, 160, 26], [84, 84, 16], [116, 84, 16]]);
  s += sheen([[162, 154, 13], [168, 136, 13], [164, 118, 11]]);
  s += both(S('M64 118 q-6 6 -2 14 M74 148 q-6 8 0 16 M90 170 q-4 6 0 12', SHEEN, 3));
  s += fluff([[88, 150, 13], [100, 146, 14], [112, 150, 13], [94, 162, 12], [106, 162, 12]], a.belly, 0);
  s += S('M74 96 Q84 80 100 78', SHEEN, 4, ' opacity=".9"') + S('M158 112 q6 -4 8 4 M164 134 q6 -2 6 6', SHEEN, 2.5);
  s += E(84, 184, 11, 6, a.dark, 3) + E(116, 184, 11, 6, a.dark, 3);
  /* the red ribbon on one ear */
  s += P('M126 74 L140 66 L140 82Z', '#d6403a', 2.5) + P('M126 74 L112 66 L112 82Z', '#d6403a', 2.5) + C(126, 74, 3.5, '#a8262a', 2);
  s += P('M96 122 L104 122 L100 127Z', '#ff9db0', 2);
  return [s, { eyes: [[84, 108], [116, 108]], r: 12, mouth: [100, 130], w: 10, iris: a.accent, lid: a.main, rune: [100, 160], line: '#d9ccf2' }];
}
function lantern(x: number, y: number) {
  return S('M' + x + ' ' + (y - 14) + ' V' + (y - 6), INK, 2.5) +
    P('M' + (x - 9) + ' ' + (y - 6) + ' H' + (x + 9) + ' L' + (x + 7) + ' ' + (y + 16) + ' H' + (x - 7) + 'Z', '#3a2a40', 3) +
    g('cg-glow', E(x, y + 5, 5, 8, '#ffd36b', 0) + E(x, y + 6, 12, 14, '#ffd36b', 0, ' opacity=".25"')) +
    P('M' + (x - 11) + ' ' + (y - 8) + ' H' + (x + 11) + ' L' + x + ' ' + (y - 16) + 'Z', '#3a2a40', 2.5);
}
function teduabolica(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  /* the tail: up, then down to the fork, and the lantern hanging from it */
  s += L('M134 170 Q178 166 176 126 Q174 96 154 92', a.main, 11);
  s += P('M150 96 L140 88 L150 84 L152 76 L158 86 L166 82 L160 94Z', '#d6403a', 2.5);
  s += g('cg-swing', lantern(150, 112));
  /* sitting, sleek, the fur long at the chest */
  s += E(100, 150, 40, 38, a.main) + fluff([[86, 132, 14], [100, 128, 15], [114, 132, 14]], a.belly, 0);
  s += E(80, 184, 12, 7, a.main, 3.5) + E(120, 184, 12, 7, a.main, 3.5);
  /* the collar with the triangle of the Trinità */
  s += P('M70 118 Q100 130 130 118 L130 124 Q100 136 70 124Z', '#d6403a', 3) + poly([94, 128, 106, 128, 100, 140], '#ffd34d', 2.5);
  s += both(catEar(70, 76, 34, a.main, '#6a3a4a'));
  s += E(100, 96, 40, 34, a.main) + both(S('M62 96 L56 92 M62 104 L54 106', SHEEN, 3)) + S('M76 74 Q88 64 104 64', SHEEN, 3.5);
  s += S('M74 136 Q70 152 76 168', SHEEN, 3);
  /* the two little horns */
  s += both(P('M80 66 Q72 52 76 40 Q86 52 88 64Z', '#d6403a', 3));
  s += P('M96 108 L104 108 L100 113Z', '#ff9db0', 2);
  return [s, { eyes: [[85, 94], [115, 94]], r: 10.5, mouth: [100, 116], w: 10, iris: a.accent, lid: a.main, rune: [100, 160], line: '#d9ccf2' }];
}
/* Teduarca: a panther of the night with wings of smoke, the black castle of via Palazzo for a crown, three moons over
   her for the three of the Trinità */
function teduarca(sp: Species): [string, Face] {
  var a = sp.art, s = '', SMOKE = '#3b2f52', RED = '#d6403a';
  s += g('cg-wings', both(P('M70 112 Q30 70 6 86 Q20 96 14 112 Q30 108 30 124 Q42 116 52 132 Q56 120 72 132Z', SMOKE, 3.5, ' opacity=".92"') +
    S('M64 116 Q40 96 18 96 M60 124 Q44 112 30 116', '#6e5a94', 2.5)));
  s += g('cg-moons', [[60, 30], [100, 14], [140, 30]].map(function (p) { return C(p[0], p[1], 8, '#efe6ff', 2.5) + C(p[0] + 3, p[1] - 2, 6.4, SMOKE, 0); }).join(''));
  /* the long tail */
  s += L('M140 176 Q186 176 184 140 Q182 112 166 108', a.main, 13);
  /* on four legs, the shoulders up */
  s += E(100, 150, 50, 36, a.main);
  s += L('M68 160 Q64 176 70 186', a.main, 18) + L('M132 160 Q136 176 130 186', a.main, 18);
  s += E(68, 186, 13, 7, a.dark, 3.5) + E(132, 186, 13, 7, a.dark, 3.5);
  s += E(100, 160, 26, 14, a.belly, 0, ' opacity=".6"');
  s += both(S('M58 138 q8 -4 14 2 M60 152 q8 -4 14 2', SHEEN, 3)) + S('M70 124 Q100 112 130 124', SHEEN, 3.5) + S('M164 112 Q180 120 182 138', SHEEN, 2.5);
  s += both(catEar(70, 76, 30, a.main, '#5a3e72'));
  s += E(100, 98, 42, 34, a.main) + S('M74 80 Q86 70 100 70', SHEEN, 3);
  /* the castle crown: three towers with red windows */
  s += P('M66 70 L66 46 L74 46 L74 52 L80 52 L80 46 L88 46 L88 34 L94 34 L94 40 L106 40 L106 34 L112 34 L112 46 L120 46 L120 52 L126 52 L126 46 L134 46 L134 70Z', '#1a1424', 3.5);
  s += P('M97 48 h6 v8 h-6Z', RED, 1.5) + P('M71 56 h4 v6 h-4Z', RED, 1.5) + P('M125 56 h4 v6 h-4Z', RED, 1.5);
  s += P('M96 110 L104 110 L100 115Z', '#c98aa0', 2);
  return [s, { eyes: [[85, 98], [115, 98]], r: 10, mouth: [100, 120], w: 11, iris: a.accent, lid: a.main, rune: [100, 150], brows: [1, -1], line: '#d9ccf2' }];
}

/* ======================================================================================================== */
/* ---------- Valentin: the hairless dog ---------- */
function batEar(x: number, y: number, a: Species['art'], h: number) {
  return P('M' + (x - 6) + ' ' + y + ' Q' + (x - 30) + ' ' + (y - h * 0.6) + ' ' + (x - 18) + ' ' + (y - h) + ' Q' + (x + 6) + ' ' + (y - h * 0.8) + ' ' + (x + 16) + ' ' + (y - 6) + 'Z', a.main, 4) +
    P('M' + (x - 4) + ' ' + (y - 6) + ' Q' + (x - 22) + ' ' + (y - h * 0.6) + ' ' + (x - 15) + ' ' + (y - h + 10) + ' Q' + (x + 2) + ' ' + (y - h * 0.7) + ' ' + (x + 9) + ' ' + (y - 9) + 'Z', '#f3b9b4', 0);
}
/** the head of a hairless dog: wrinkles on the forehead, the dark patches, the tongue */
function xoloHead(a: Species['art'], cy: number, k: number, tuft: string) {
  var s = '';
  s += both('<g class="cg-ear">' + batEar(100 - 30 * k, cy - 14 * k, a, 60 * k) + '</g>');
  s += E(100, cy, 40 * k, 34 * k, a.main);
  s += E(100 + 22 * k, cy - 14 * k, 12 * k, 9 * k, a.dark, 0, ' opacity=".35"');
  s += S('M' + n(100 - 12 * k) + ' ' + n(cy - 22 * k) + ' q12 -5 24 0 M' + n(100 - 8 * k) + ' ' + n(cy - 16 * k) + ' q8 -4 16 0', a.dark, 2.5);
  /* the snout, long; the nose */
  s += E(100, cy + 18 * k, 18 * k, 13 * k, a.belly, 3.5) + E(100, cy + 10 * k, 7 * k, 5 * k, '#3a2a30', 2.5);
  /* the tuft of hair on top, the only one */
  s += g('cg-tuft', P('M' + n(100 - 8 * k) + ' ' + n(cy - 30 * k) + ' Q' + n(100 - 14 * k) + ' ' + n(cy - 58 * k) + ' ' + n(100 - 2 * k) + ' ' + n(cy - 62 * k) + ' Q' + n(100 + 2 * k) + ' ' + n(cy - 46 * k) + ' ' + n(100 + 8 * k) + ' ' + n(cy - 60 * k) + ' Q' + n(100 + 16 * k) + ' ' + n(cy - 44 * k) + ' ' + n(100 + 9 * k) + ' ' + n(cy - 30 * k) + 'Z', tuft, 3));
  return s;
}
function martisor(x: number, y: number) {
  return S('M' + (x - 8) + ' ' + y + ' q8 4 16 0', '#d6403a', 3) + S('M' + (x - 8) + ' ' + (y + 2) + ' q8 4 16 0', '#ffffff', 2) + C(x + 8, y + 7, 3, '#d6403a', 1.5) + C(x + 12, y + 9, 3, '#ffffff', 1.5);
}
function xolo(sp: Species): [string, Face] {
  if (sp.stage === 2) return arumba(sp);
  if (sp.stage === 3) return inguaiatore(sp);
  var a = sp.art, s = '';
  /* a thin tail, wagging */
  s += g('cg-wag', L('M126 160 Q150 150 150 128', a.main, 7));
  /* the skinny body on thin legs */
  s += E(100, 156, 32, 24, a.main) + E(108, 148, 10, 7, a.dark, 0, ' opacity=".35"');
  s += L('M82 166 L80 184', a.main, 9) + L('M118 166 L120 184', a.main, 9) + E(80, 186, 9, 5, a.belly, 3) + E(120, 186, 9, 5, a.belly, 3);
  s += martisor(80, 174);
  s += xoloHead(a, 108, 1, '#f4efe6');
  /* the tongue out */
  s += P('M100 134 Q98 146 104 148 Q110 146 106 134Z', '#ff8fa3', 2.5);
  return [s, { eyes: [[84, 102], [116, 102]], r: 12.5, mouth: [100, 132], w: 14, lid: a.main, rune: [100, 158] }];
}
/* the dog of the party: on its hind legs, a paw up for the «Weee», the green glasses pushed up, the chain, the
   headphones round the neck, the tuft dyed green; confetti */
function arumba(sp: Species): [string, Face] {
  var a = sp.art, s = '', GREEN = a.accent, GOLD = '#e8c547';
  s += g('cg-confetti', [[30, 50, '#ff5fd2'], [168, 44, '#5fd0ff'], [44, 120, '#ffd34d'], [170, 110, '#3fd07a'], [24, 86, '#ff7a2a'], [178, 76, '#ff5fd2']].map(function (c, i) {
    return P('M' + c[0] + ' ' + c[1] + ' l8 -3 l2 6 l-8 3Z', String(c[2]), 1.5, ' transform="rotate(' + (i * 37) + ' ' + c[0] + ' ' + c[1] + ')"');
  }).join(''));
  s += g('cg-wag', L('M124 170 Q152 166 156 140', a.main, 7));
  s += E(100, 152, 30, 32, a.main);
  s += L('M88 176 L84 186', a.main, 10) + L('M112 176 L116 186', a.main, 10) + E(84, 188, 10, 5, a.belly, 3) + E(116, 188, 10, 5, a.belly, 3);
  /* a paw up, the other on the hip */
  s += L('M124 136 Q146 116 150 92', a.main, 9) + E(150, 88, 8, 7, a.belly, 3);
  s += L('M76 138 Q62 150 74 160', a.main, 9);
  s += martisor(146, 104);
  /* the chain with the medal */
  s += S('M80 126 Q100 146 120 126', GOLD, 4) + S('M80 126 Q100 146 120 126', INK, 1, ' stroke-dasharray="2 3"') + C(100, 142, 7, GOLD, 2.5) + '<text x="100" y="146" text-anchor="middle" font-size="9" font-weight="800" fill="' + INK + '">V</text>';
  /* the headphones round the neck */
  s += S('M74 120 Q100 136 126 120', '#2b2f3a', 5) + E(72, 122, 8, 10, GREEN, 3) + E(128, 122, 8, 10, GREEN, 3);
  s += xoloHead(a, 92, 0.92, GREEN);
  /* the green glasses up on the head */
  s += P('M72 66 Q86 60 98 66 L96 76 Q84 80 74 74Z', GREEN, 3, ' opacity=".9"') + P('M102 66 Q114 60 128 66 L126 74 Q116 80 104 76Z', GREEN, 3, ' opacity=".9"') + S('M98 68 H102', INK, 3);
  s += P('M100 118 Q98 128 103 130 Q108 128 105 118Z', '#ff8fa3', 2.5);
  return [s, { eyes: [[85, 88], [115, 88]], r: 11.5, mouth: [100, 116], w: 13, lid: a.main, rune: [100, 160] }];
}
/* the Inguaiatore: a hairless hound big as a wolf, black and shiny as a stone, green lightning running under the skin,
   a crest of green fire down the back, the tail a microphone; the gold collar of the old hairless dogs */
function inguaiatore(sp: Species): [string, Face] {
  var a = sp.art, s = '', ZAP = a.accent, GOLD = '#e8c547';
  s += g('cg-zap', bolt(26, 40, 34, ZAP) + bolt(160, 30, 30, ZAP) + bolt(176, 100, 24, ZAP));
  /* the tail: a microphone */
  s += L('M142 170 Q176 168 178 136', a.main, 9) + P('M170 130 L186 130 L184 140 L172 140Z', '#2b2f3a', 3) + C(178, 120, 12, '#8a93a8', 3.5) + S('M170 116 H186 M168 122 H188 M170 128 H186', INK, 1.5);
  /* the crest of green fire down the back */
  s += g('cg-flame', P('M70 124 Q74 104 84 116 Q88 96 98 112 Q104 92 112 112 Q120 96 124 118 Q134 104 134 128Z', ZAP, 3));
  /* four strong legs, the body long */
  s += E(100, 148, 52, 32, a.main);
  s += L('M64 158 L60 186', a.main, 16) + L('M84 164 L84 186', a.main, 15) + L('M116 164 L116 186', a.main, 15) + L('M136 158 L140 186', a.main, 16);
  [60, 84, 116, 140].forEach(function (x) { s += E(x, 188, 10, 5, a.belly, 3); });
  /* the lightning under the skin */
  s += S('M66 140 L78 148 L74 154 L88 160 M120 138 L132 146 L128 152 L142 156', ZAP, 3, ' class="cg-veins"');
  /* the gold collar */
  s += P('M70 118 Q100 134 130 118 L130 128 Q100 144 70 128Z', GOLD, 3) + [80, 92, 108, 120].map(function (x) { return poly([x - 4, 132, x + 4, 132, x, 141], GOLD, 2); }).join('');
  s += xoloHead(a, 90, 1.08, ZAP);
  return [s, { eyes: [[83, 86], [117, 86]], r: 12, mouth: [100, 118], w: 16, iris: ZAP, lid: a.main, rune: [100, 150], brows: [1, -1] }];
}

/* ======================================================================================================== */
/* ---------- Forchetta: the swordfish ---------- */
function splash(cx: number, cy: number, w: number) {
  return P('M' + (cx - w) + ' ' + cy + ' Q' + (cx - w / 2) + ' ' + (cy - 10) + ' ' + cx + ' ' + cy + ' Q' + (cx + w / 2) + ' ' + (cy - 10) + ' ' + (cx + w) + ' ' + cy + ' Q' + cx + ' ' + (cy + 12) + ' ' + (cx - w) + ' ' + cy + 'Z', '#bfe8ff', 3) +
    C(cx - w * 0.7, cy - 14, 4, '#e6f7ff', 2) + C(cx + w * 0.75, cy - 18, 3, '#e6f7ff', 2);
}
function swordfish(sp: Species): [string, Face] {
  if (sp.stage === 2) return spadaccino(sp);
  if (sp.stage === 3) return gladiomare(sp);
  var a = sp.art, s = '';
  s += splash(100, 182, 46);
  /* the sail on the back, the tail, the sword longer than the rest */
  s += P('M92 104 Q96 52 128 56 Q118 82 122 112Z', a.dark, 4);
  s += P('M146 140 Q172 110 176 96 Q170 130 182 150 Q166 150 148 150Z', a.main, 4);
  s += P('M60 118 L14 74 L20 70 L68 108Z', a.accent, 3.5) + S('M22 74 L62 110', '#ffffff', 2, ' opacity=".8"');
  s += E(102, 132, 50, 34, a.main) + E(104, 146, 36, 18, a.belly, 0);
  s += S('M66 120 Q100 112 140 126', '#ffffff', 2.5, ' opacity=".4"');
  /* a fin like a little arm */
  s += P('M112 154 Q108 172 94 174 Q100 162 104 152Z', a.dark, 3);
  return [s, { eyes: [[82, 124], [110, 122]], r: 10, mouth: [92, 144], w: 10, lid: a.main, rune: [118, 138] }];
}
/* the swordfish who plays: upright on his tail like a player on the baseline, the headband, the sail painted with the
   gulf, a ball in the fin */
function spadaccino(sp: Species): [string, Face] {
  var a = sp.art, s = '', BALL = a.accent;
  s += splash(100, 184, 40);
  /* the sail, painted: stripes of the gulf at sunset */
  s += P('M120 80 Q170 64 172 120 Q150 120 128 140Z', '#f4efe6', 4);
  s += S('M130 92 Q150 84 164 96', '#ff7a2a', 5) + S('M130 104 Q152 96 168 108', '#ffd34d', 5) + S('M130 116 Q150 110 166 120', '#4fa3d8', 5);
  /* the tail fin at the bottom */
  s += P('M82 170 Q70 186 60 190 Q84 192 100 178 Q116 192 140 190 Q130 186 118 170Z', a.main, 4);
  /* the body, upright */
  s += E(100, 128, 34, 48, a.main) + E(102, 138, 20, 34, a.belly, 0);
  /* the sword, up and to the left like a racket ready */
  s += P('M84 88 L46 22 L52 18 L94 82Z', '#e6edf5', 3.5) + S('M50 24 L88 86', '#ffffff', 2, ' opacity=".8"');
  /* the headband, the wristband, the ball */
  s += P('M68 92 Q100 80 132 92 L132 100 Q100 88 68 100Z', '#ffffff', 3) + S('M70 96 Q100 86 130 96', '#d6403a', 2);
  s += L('M72 136 Q54 140 48 128', a.dark, 9) + P('M50 128 h8 v6 h-8Z', '#ffffff', 2);
  s += C(40, 118, 9, BALL, 3) + S('M33 114 Q40 120 47 114', '#ffffff', 2);
  s += L('M128 136 Q144 148 146 162', a.dark, 9);
  return [s, { eyes: [[86, 110], [114, 110]], r: 10, mouth: [100, 130], w: 11, lid: a.main, rune: [100, 160] }];
}
/* Gladiomare: a knight of the deep. The sword a blade of sea light, the sail a cloak of brush strokes, the fins that
   once broke rebuilt to measure, silver and glass, with their joints; bubbles going up */
function gladiomare(sp: Species): [string, Face] {
  var a = sp.art, s = '', LIGHT = a.accent, SILVER = '#d9e2ec';
  s += g('cg-bubbles', C(30, 150, 5, '#e6f7ff', 2) + C(40, 120, 3.5, '#e6f7ff', 2) + C(172, 140, 4, '#e6f7ff', 2) + C(164, 104, 3, '#e6f7ff', 2));
  s += E(100, 190, 62, 8, '#bfe8ff', 3);
  /* the cloak of brush strokes */
  s += g('cg-cape', P('M76 88 Q40 128 50 188 L150 188 Q160 128 124 88Z', '#1f4f8a', 4) +
    S('M58 150 Q68 134 78 156 M122 156 Q132 134 142 150 M60 178 Q72 164 84 180 M116 180 Q128 164 140 178', '#4fa3d8', 6, ' opacity=".9"') +
    S('M62 166 Q70 154 78 168 M122 168 Q130 154 138 166', '#7ff0ff', 4, ' opacity=".7"'));
  /* the body, armoured: plates of silver and glass */
  s += E(100, 128, 36, 52, a.main);
  s += P('M74 110 Q100 96 126 110 L124 160 Q100 172 76 160Z', SILVER, 4);
  s += S('M100 102 V166 M78 128 H122 M80 146 H120', '#9aa8b8', 2.5);
  s += C(100, 118, 7, LIGHT, 2.5, ' class="cg-glow"');
  /* the fins rebuilt to measure: segments, bolts, a joint of glass */
  s += both(P('M74 128 L50 140 L44 160 L56 156 L62 142 L78 140Z', SILVER, 3.5) + C(50, 140, 4, '#7ff0ff', 2) + C(62, 142, 2.5, INK, 0) + S('M46 152 L56 148', '#9aa8b8', 2));
  /* the tail fin */
  s += P('M82 172 Q70 186 58 190 Q86 192 100 180 Q114 192 142 190 Q130 186 118 172Z', a.dark, 4);
  /* the blade of light, up and away */
  s += g('cg-blade', P('M88 82 L40 6 L48 2 L98 76Z', LIGHT, 3.5) + S('M44 8 L92 80', '#ffffff', 3) + E(68, 42, 22, 40, LIGHT, 0, ' opacity=".18" transform="rotate(-32 68 42)"'));
  /* the helm: a crest like a dorsal fin */
  s += P('M84 70 Q100 36 120 40 Q112 56 116 72Z', a.dark, 3.5);
  return [s, { eyes: [[86, 92], [114, 92]], r: 9.5, mouth: [100, 110], w: 11, lid: a.main, rune: [100, 140], brows: [1, -1] }];
}

/* ======================================================================================================== */
/* ---------- Zendavid: the owl ---------- */
/** the two tufts of an eagle owl */
function owlTufts(cy: number, h: number, col: string) {
  return both(P('M70 ' + cy + ' Q56 ' + (cy - h * 0.6) + ' 60 ' + (cy - h) + ' Q72 ' + (cy - h * 0.5) + ' 84 ' + (cy - 4) + 'Z', col, 3.5));
}
/** feathers on the chest: little chevrons */
function chevrons(cx: number, cy: number, rows: number, col: string) {
  var s = '';
  for (var r = 0; r < rows; r++) for (var c = -1; c <= 1; c++) s += S('M' + (cx + c * 12 - 4) + ' ' + (cy + r * 9) + ' l4 4 l4 -4', col, 2);
  return s;
}
function headphones(cy: number, half: number, cup: string, band: string) {
  return S('M' + (100 - half) + ' ' + cy + ' Q100 ' + (cy - half * 1.5) + ' ' + (100 + half) + ' ' + cy, INK, 11) + S('M' + (100 - half) + ' ' + cy + ' Q100 ' + (cy - half * 1.5) + ' ' + (100 + half) + ' ' + cy, band, 6) +
    E(100 - half, cy + 6, 11, 16, cup, 4) + E(100 + half, cy + 6, 11, 16, cup, 4) + E(100 - half - 2, cy + 6, 5, 9, '#2b2f3a', 0) + E(100 + half + 2, cy + 6, 5, 9, '#2b2f3a', 0);
}
function eagleowl(sp: Species): [string, Face] {
  if (sp.stage === 2) return subgufo(sp);
  if (sp.stage === 3) return bubozen(sp);
  var a = sp.art, s = '';
  /* round as a ball, little wings at the sides */
  s += both(P('M60 128 Q44 146 52 170 Q62 160 70 150Z', a.dark, 3.5));
  s += E(100, 138, 46, 48, a.main) + E(100, 152, 30, 30, a.belly, 0) + chevrons(100, 140, 3, a.dark);
  s += owlTufts(100, 34, a.dark);
  /* the facial disc */
  s += E(84, 112, 19, 18, a.belly, 0, ' opacity=".7"') + E(116, 112, 19, 18, a.belly, 0, ' opacity=".7"');
  s += P('M95 122 L105 122 L100 132Z', '#e8a93a', 2.5);
  s += E(86, 186, 9, 5, '#e8a93a', 3) + E(114, 186, 9, 5, '#e8a93a', 3);
  /* headphones far too big */
  s += headphones(100, 50, '#d6403a', '#2b2f3a');
  return [s, { eyes: [[84, 112], [116, 112]], r: 12, mouth: null, w: 10, iris: a.accent, lid: a.main, rune: [100, 166] }];
}
/* the owl with a speaker for a chest; the feathers of the wings are the bars of a mixer */
function subgufo(sp: Species): [string, Face] {
  var a = sp.art, s = '', NEON = a.accent;
  /* the wings, open a little: bars of sound */
  s += both(P('M60 110 Q26 120 22 160 Q40 156 66 150Z', a.dark, 3.5) + [0, 1, 2, 3].map(function (i) { return P('M' + (30 + i * 8) + ' ' + (150 - i * 4) + ' v' + (-10 - (i % 2) * 8) + ' h4 v' + (10 + (i % 2) * 8) + 'Z', NEON, 1.5); }).join(''));
  s += E(100, 136, 42, 52, a.main);
  s += owlTufts(92, 32, a.dark);
  /* the speaker in the chest */
  s += C(100, 148, 26, '#2b2f3a', 4) + g('cg-woof', C(100, 148, 18, '#4a4f5c', 2.5) + C(100, 148, 8, '#1c2028', 2)) + C(100, 148, 30, 'none', 2.5, ' stroke-dasharray="3 5"');
  s += E(84, 102, 18, 17, a.belly, 0, ' opacity=".7"') + E(116, 102, 18, 17, a.belly, 0, ' opacity=".7"');
  s += P('M95 112 L105 112 L100 121Z', '#e8a93a', 2.5);
  /* the headphones round the neck now, and the lights */
  s += S('M68 124 Q100 140 132 124', '#2b2f3a', 6) + E(66, 124, 8, 11, NEON, 3) + E(134, 124, 8, 11, NEON, 3);
  s += E(84, 188, 10, 5, '#e8a93a', 3) + E(116, 188, 10, 5, '#e8a93a', 3);
  return [s, { eyes: [[84, 102], [116, 102]], r: 11.5, mouth: null, w: 10, iris: NEON, lid: a.main, rune: [100, 70] }];
}
/* Bubozen: the great owl become a monk, cross-legged over a record that spins by itself, the wings open like two
   speakers, a circle of ink behind the head */
function bubozen(sp: Species): [string, Face] {
  var a = sp.art, s = '', GOLD = a.accent;
  /* the circle of ink, the ensō, behind */
  s += g('cg-halo', S('M150 30 A80 80 0 1 1 112 24', '#2b2b33', 9, ' opacity=".85"') + S('M118 24 A80 80 0 0 0 46 46', '#2b2b33', 14, ' opacity=".85"') + S('M150 30 Q156 26 158 34', '#2b2b33', 5, ' opacity=".6"'));
  /* the record, spinning */
  s += E(100, 182, 70, 12, '#1c2028', 3) + E(100, 182, 14, 3, GOLD, 2) +
    E(100, 182, 52, 8, 'none', 0, ' class="cg-spin" stroke="#7a8090" stroke-width="1.6" stroke-dasharray="18 10"') + E(100, 182, 36, 5.5, 'none', 0, ' class="cg-spin" stroke="#5a5f6c" stroke-width="1.4" stroke-dasharray="12 8"');
  /* the wings, open: two speakers at their tips */
  s += both(P('M64 100 Q20 90 8 130 Q30 130 34 146 Q50 132 68 136Z', a.dark, 3.5) + C(28, 118, 12, '#2b2f3a', 3) + C(28, 118, 5, '#5a5f6c', 2));
  s += g('cg-float', E(100, 128, 40, 44, a.main) + E(100, 140, 26, 28, a.belly, 0) + chevrons(100, 128, 3, a.dark) +
    /* cross-legged */
    E(80, 166, 22, 9, a.dark, 3.5) + E(120, 166, 22, 9, a.dark, 3.5) + E(66, 168, 7, 4, '#e8a93a', 2.5) + E(134, 168, 7, 4, '#e8a93a', 2.5) +
    owlTufts(84, 34, a.dark) +
    E(84, 96, 18, 17, a.belly, 0, ' opacity=".7"') + E(116, 96, 18, 17, a.belly, 0, ' opacity=".7"') +
    P('M95 106 L105 106 L100 115Z', '#e8a93a', 2.5) +
    /* the beads */
    [70, 78, 86, 94, 102, 110, 118, 126, 134].map(function (x, i) { return C(x, 120 + Math.abs(i - 4) * -1.6 + 6, 3, i === 4 ? GOLD : '#8a5a2b', 1.5); }).join(''));
  s += g('cg-notes', S('M36 56 v-14 l10 -3 v14', INK, 2.5) + C(34, 57, 3.5, INK, 0) + C(44, 54, 3.5, INK, 0) + S('M164 64 v-14', INK, 2.5) + C(162, 65, 3.5, INK, 0));
  return [s, { eyes: [[84, 96], [116, 96]], r: 11, mouth: null, w: 10, iris: GOLD, lid: a.main, rune: [100, 150] }];
}

/* ======================================================================================================== */
/* ---------- Antonio: the lion ---------- */
function lionEars(cy: number, k: number, a: Species['art']) {
  return both(C(100 - 32 * k, cy - 26 * k, 11 * k, a.main, 3.5) + C(100 - 32 * k, cy - 26 * k, 5 * k, a.belly, 0));
}
function lionMuzzle(cy: number, k: number, a: Species['art']) {
  return E(100 - 9 * k, cy + 14 * k, 12 * k, 9 * k, a.belly, 0) + E(100 + 9 * k, cy + 14 * k, 12 * k, 9 * k, a.belly, 0) +
    P('M' + n(100 - 7 * k) + ' ' + n(cy + 6 * k) + ' L' + n(100 + 7 * k) + ' ' + n(cy + 6 * k) + ' L100 ' + n(cy + 13 * k) + 'Z', '#7a3a24', 2.5);
}
function lion(sp: Species): [string, Face] {
  if (sp.stage === 2) return voltaleone(sp);
  if (sp.stage === 3) return leonauta(sp);
  var a = sp.art, s = '';
  s += L('M134 170 Q166 172 166 146', a.main, 8) + g('cg-tuft', P('M160 146 Q166 126 174 140 Q178 130 170 152Z', a.accent, 3));
  s += E(100, 152, 38, 32, a.main) + E(100, 160, 22, 20, a.belly, 0);
  s += E(82, 184, 12, 7, a.main, 3.5) + E(118, 184, 12, 7, a.main, 3.5) + both(S('M76 184 v4 M82 185 v4', INK, 2));
  s += lionEars(104, 1, a);
  s += E(100, 104, 40, 36, a.main);
  /* the beginning of a mane: a tuft that sparks */
  s += g('cg-tuft', P('M82 74 Q84 56 96 66 Q100 50 108 66 Q118 56 120 76 Q100 68 82 74Z', a.accent, 3));
  s += g('cg-zap', bolt(124, 46, 18, '#ffe45c') + bolt(70, 50, 14, '#ffe45c'));
  s += lionMuzzle(104, 1, a);
  return [s, { eyes: [[84, 100], [116, 100]], r: 10.5, mouth: [100, 126], w: 12, iris: '#7a4a18', lid: a.main, rune: [100, 160] }];
}
/* the lion of the lab: the mane is wires, red, black and yellow, sparking at the ends; a visor on the forehead */
function voltaleone(sp: Species): [string, Face] {
  var a = sp.art, s = '', BLUE = a.accent;
  /* the mane of wires, round the head */
  var cols = ['#d6403a', '#2b2f3a', '#ffd34d', '#d6403a', '#2b2f3a', '#ffd34d', '#d6403a', '#2b2f3a', '#ffd34d', '#d6403a', '#2b2f3a', '#ffd34d'];
  var mane = '';
  for (var i = 0; i < 12; i++) {
    var u = (-200 + i * 20) * Math.PI / 180, x0 = 100 + Math.cos(u) * 34, y0 = 96 + Math.sin(u) * 30, x1 = 100 + Math.cos(u) * 62, y1 = 96 + Math.sin(u) * 56, bend = (i % 2 ? 12 : -12);
    mane += L('M' + n(x0) + ' ' + n(y0) + ' Q' + n((x0 + x1) / 2 + bend) + ' ' + n((y0 + y1) / 2 - bend) + ' ' + n(x1) + ' ' + n(y1), cols[i], 5);
    if (i % 3 === 0) mane += star4(x1, y1, 7, '#ffe45c', 1.6);
  }
  s += g('cg-mane', mane);
  s += L('M138 172 Q172 174 172 146', a.main, 9) + P('M166 146 Q170 126 180 138 Q184 128 176 152Z', '#2b2f3a', 3) + bolt(172, 120, 16, BLUE);
  /* standing, the chest out */
  s += E(100, 150, 42, 34, a.main) + E(100, 158, 24, 20, a.belly, 0);
  s += L('M74 162 L72 186', a.main, 15) + L('M126 162 L128 186', a.main, 15) + E(72, 188, 11, 5, a.main, 3) + E(128, 188, 11, 5, a.main, 3);
  /* the circuits on the legs */
  s += S('M68 168 h6 v8 h-4 M132 168 h-6 v8 h4', BLUE, 2.5);
  s += lionEars(96, 0.95, a);
  s += E(100, 96, 38, 34, a.main);
  /* the visor on the forehead */
  s += P('M68 74 Q100 62 132 74 L130 84 Q100 74 70 84Z', BLUE, 3, ' opacity=".85"') + S('M78 76 h10 M112 76 h10', '#ffffff', 2);
  s += lionMuzzle(96, 0.95, a);
  return [s, { eyes: [[85, 96], [115, 96]], r: 10, mouth: [100, 118], w: 12, iris: '#2a7ab8', lid: a.main, rune: [100, 150] }];
}
/* the Leonauta: the astronaut lion. The mane a crown of solar panels, the white suit with the patches of Formia,
   Torino and Chicago, the reactor in the chest, the jets on the back; the helmet's glass in front of the face */
function leonauta(sp: Species): [string, Face] {
  var a = sp.art, s = '', SUIT = '#f2f4f8', SUITD = '#b9c2d0', PANEL = '#2f5fb8', GLOW = '#7fe0ff';
  /* the solar panels, open like a sun round the head */
  var panels = '';
  for (var i = 0; i < 10; i++) {
    var u = (-180 + i * 20) * Math.PI / 180, cx = 100 + Math.cos(u) * 62, cy = 84 + Math.sin(u) * 56, rot = (u * 180 / Math.PI) + 90;
    panels += '<g transform="rotate(' + n(rot) + ' ' + n(cx) + ' ' + n(cy) + ')">' + P('M' + n(cx - 9) + ' ' + n(cy - 16) + ' h18 v32 h-18Z', PANEL, 3) + S('M' + n(cx) + ' ' + n(cy - 16) + ' v32 M' + n(cx - 9) + ' ' + n(cy) + ' h18', '#9cc4ff', 1.5) + '</g>';
  }
  s += g('cg-panels', panels + L('M100 84 L100 84', a.accent, 1));
  /* the jets on the back, with their fire */
  s += both(P('M54 146 h12 v18 h-12Z', SUITD, 3) + g('cg-jet', P('M55 164 L60 182 L65 164Z', '#ff7a2a', 2.5) + P('M57 164 L60 176 L63 164Z', '#ffe45c', 0)));
  /* the suit */
  s += E(100, 148, 42, 38, SUIT);
  s += L('M76 166 L74 186', SUIT, 15) + L('M124 166 L126 186', SUIT, 15) + E(74, 188, 12, 5, SUITD, 3) + E(126, 188, 12, 5, SUITD, 3);
  s += S('M62 160 H138', SUITD, 3);
  /* the arms in the suit: one at the side, one up with the thumb */
  s += L('M66 136 Q52 150 58 166', SUIT, 13) + C(58, 170, 7, SUITD, 3);
  s += L('M134 136 Q154 128 156 108', SUIT, 13) + C(156, 102, 8, SUITD, 3) + S('M156 96 v-7', INK, 4);
  /* the patches: Formia (blue and gold) on the arm, Chicago (a white flag with the red stars) on the other */
  s += P('M144 120 l10 -4 l3 8 l-10 4Z', '#2f5fb8', 2) + P('M145.5 124 l10 -4 l1.5 4 l-10 4Z', '#ffd34d', 0);
  s += P('M56 146 h12 v8 h-12Z', '#ffffff', 2) + [59, 62, 65].map(function (x) { return star4(x, 150, 2.2, '#d6403a', 0.6); }).join('');
  /* the reactor */
  s += C(100, 152, 12, '#1c2340', 3) + g('cg-glow', C(100, 152, 8, GLOW, 0)) + C(100, 152, 12, 'none', 2.5);
  /* the head, with its mane of fire inside the helmet, and the ears */
  s += lionEars(88, 1, a);
  s += E(100, 88, 38, 34, a.main);
  s += P('M70 66 Q80 50 92 60 Q100 46 110 60 Q122 50 130 66 Q100 58 70 66Z', a.accent, 3);
  s += lionMuzzle(88, 1, a);
  /* the ring of the helmet at the neck */
  s += P('M62 118 Q100 132 138 118 L138 126 Q100 140 62 126Z', SUITD, 3);
  var glass = C(100, 86, 47, '#bfeaff', 4, ' fill-opacity=".18"') + S('M70 56 Q84 44 100 42', '#ffffff', 4, ' opacity=".8"') + S('M134 96 Q136 108 130 118', '#ffffff', 3, ' opacity=".6"');
  return [s, { eyes: [[85, 86], [115, 86]], r: 10, mouth: [100, 108], w: 12, iris: '#2a7ab8', lid: a.main, rune: [100, 172], over: glass }];
}

/* ======================================================================================================== */
/* ---------- Andrea: the winged fox ---------- */
function foxEars(cy: number, k: number, a: Species['art']) {
  return both(P('M' + n(100 - 36 * k) + ' ' + n(cy - 8 * k) + ' L' + n(100 - 38 * k) + ' ' + n(cy - 50 * k) + ' L' + n(100 - 10 * k) + ' ' + n(cy - 26 * k) + 'Z', a.main, 4) +
    P('M' + n(100 - 32 * k) + ' ' + n(cy - 12 * k) + ' L' + n(100 - 34 * k) + ' ' + n(cy - 40 * k) + ' L' + n(100 - 16 * k) + ' ' + n(cy - 25 * k) + 'Z', '#3a2418', 0));
}
function foxHead(cy: number, k: number, a: Species['art']) {
  return foxEars(cy, k, a) + E(100, cy, 38 * k, 32 * k, a.main) +
    P('M' + n(100 - 38 * k) + ' ' + n(cy + 2 * k) + ' Q' + n(100 - 20 * k) + ' ' + n(cy + 30 * k) + ' 100 ' + n(cy + 26 * k) + ' Q' + n(100 + 20 * k) + ' ' + n(cy + 30 * k) + ' ' + n(100 + 38 * k) + ' ' + n(cy + 2 * k) + ' Q' + n(100 + 18 * k) + ' ' + n(cy + 14 * k) + ' 100 ' + n(cy + 8 * k) + ' Q' + n(100 - 18 * k) + ' ' + n(cy + 14 * k) + ' ' + n(100 - 38 * k) + ' ' + n(cy + 2 * k) + 'Z', a.belly, 0) +
    E(100, cy + 12 * k, 5 * k, 4 * k, '#2b1d14', 2);
}
/** a feathered wing, from the shoulder (left side) */
function foxWing(x: number, y: number, w: number, h: number, col: string) {
  var s = P('M' + x + ' ' + y + ' Q' + (x - w * 0.6) + ' ' + (y - h) + ' ' + (x - w) + ' ' + (y - h * 0.9) + ' Q' + (x - w * 0.8) + ' ' + (y - h * 0.4) + ' ' + (x - w * 0.95) + ' ' + (y - h * 0.2) + ' Q' + (x - w * 0.7) + ' ' + (y - h * 0.05) + ' ' + (x - w * 0.75) + ' ' + (y + h * 0.15) + ' Q' + (x - w * 0.4) + ' ' + (y + h * 0.05) + ' ' + x + ' ' + (y + h * 0.2) + 'Z', col, 3.5);
  s += S('M' + (x - w * 0.2) + ' ' + (y - h * 0.3) + ' Q' + (x - w * 0.5) + ' ' + (y - h * 0.5) + ' ' + (x - w * 0.8) + ' ' + (y - h * 0.6), '#c9a27a', 2);
  return s;
}
function wingfox(sp: Species): [string, Face] {
  if (sp.stage === 2) return volpadel(sp);
  if (sp.stage === 3) return volpitagora(sp);
  var a = sp.art, s = '';
  s += g('cg-flap', both(foxWing(74, 128, 40, 34, a.accent)));
  /* the bushy tail with the white tip */
  s += P('M128 176 Q176 180 178 140 Q172 116 156 126 Q164 150 128 164Z', a.main, 4) + P('M170 128 Q178 136 176 148 Q166 140 160 130Z', '#ffffff', 0);
  s += E(100, 154, 34, 30, a.main) + E(100, 160, 20, 22, a.belly, 0);
  s += E(84, 184, 11, 6, '#3a2418', 3) + E(116, 184, 11, 6, '#3a2418', 3);
  s += foxHead(108, 1, a);
  return [s, { eyes: [[84, 104], [116, 104]], r: 10.5, mouth: [100, 128], w: 10, iris: '#5a3a18', lid: a.main, rune: [100, 162] }];
}
/* the fox of the padel: in flight, the orange tracksuit with its white stripes, the headband, the tail ending in a ball */
function volpadel(sp: Species): [string, Face] {
  var a = sp.art, s = '', BALL = a.accent;
  s += g('cg-flap', both(foxWing(72, 120, 62, 52, '#fff1d8')));
  /* the tail, long, with the ball at its end */
  s += L('M126 166 Q170 176 176 136', a.main, 16) + C(178, 128, 11, BALL, 3) + S('M169 124 Q178 132 187 124', '#ffffff', 2);
  /* the body, in the tracksuit */
  s += E(100, 148, 34, 34, a.main) + both(S('M70 132 L74 170', '#ffffff', 4));
  s += E(100, 154, 18, 22, a.belly, 0);
  s += L('M84 176 L80 188', a.main, 10) + L('M116 176 L120 188', a.main, 10) + E(80, 190, 9, 4, '#ffffff', 2.5) + E(120, 190, 9, 4, '#ffffff', 2.5);
  s += foxHead(98, 1, a);
  /* the headband */
  s += P('M64 86 Q100 74 136 86 L136 94 Q100 82 64 94Z', '#ffffff', 3) + S('M66 90 Q100 78 134 90', BALL, 2);
  return [s, { eyes: [[84, 96], [116, 96]], r: 10.5, mouth: [100, 118], w: 10, iris: '#5a3a18', lid: a.main, rune: [100, 160] }];
}
/* Volpitagora: six wings with numbers on the feathers, two dice going round, and over the head the figure of the
   theorem, the right triangle with its three squares, made of light */
function die(x: number, y: number, s: number, dots: number[][]) {
  return P('M' + (x - s) + ' ' + (y - s) + ' h' + (2 * s) + ' v' + (2 * s) + ' h' + (-2 * s) + 'Z', '#ffffff', 2.5) + dots.map(function (d) { return C(x + d[0] * s * 0.5, y + d[1] * s * 0.5, s * 0.17, INK, 0); }).join('');
}
function volpitagora(sp: Species): [string, Face] {
  var a = sp.art, s = '', STAR = a.accent;
  /* the figure of the theorem, of light: a right triangle and its three squares */
  /* right angle at C (0 0), legs 24 and 18, the hypotenuse 30: the three squares, 9 + 16 = 25 */
  var th = poly([0, 0, 24, 0, 24, 24, 0, 24], STAR, 2, ' fill-opacity=".45"') + poly([0, 0, 0, -18, -18, -18, -18, 0], STAR, 2, ' fill-opacity=".45"') +
    poly([24, 0, 0, -18, 18, -42, 42, -24], STAR, 2, ' fill-opacity=".3"') + poly([0, 0, 24, 0, 0, -18], '#fff7d6', 2.5) + S('M0 -5 h5 v5', INK, 1.6);
  s += g('cg-halo', '<g transform="translate(91 29) scale(.62)">' + th + '</g>');
  /* six wings, three a side */
  var digits = [[72, 98, 64, 46, '5²'], [70, 126, 58, 40, '4²'], [72, 150, 46, 30, '3²']].map(function (w) {
    var x = +w[0] - +w[2] * 0.6, y = +w[1] - +w[3] * 0.15, fs = n(Math.max(10, +w[3] * 0.28));
    return [x, 200 - x].map(function (tx) { return '<text x="' + n(tx) + '" y="' + n(y) + '" text-anchor="middle" font-size="' + fs + '" font-weight="800" font-family="Georgia,serif" fill="#7a5ab8">' + w[4] + '</text>'; }).join('');
  }).join('');
  s += g('cg-flap', both(foxWing(72, 98, 64, 46, '#fff1d8') + foxWing(70, 126, 58, 40, '#fff1d8') + foxWing(72, 150, 46, 30, '#fff1d8')) + digits);
  /* the two dice going round */
  s += g('cg-orbit', die(30, 70, 10, [[-1, -1], [0, 0], [1, 1]]) + die(170, 64, 10, [[-1, -1], [1, -1], [-1, 1], [1, 1]]));
  s += L('M126 170 Q176 178 182 134 Q184 112 168 104', a.main, 15) + P('M164 100 Q176 96 178 112 Q170 112 166 106Z', '#ffffff', 2.5);
  s += E(100, 146, 34, 38, a.main) + E(100, 154, 18, 26, a.belly, 0);
  s += L('M84 176 L82 188', a.main, 11) + L('M116 176 L118 188', a.main, 11) + E(82, 190, 9, 4, '#3a2418', 2.5) + E(118, 190, 9, 4, '#3a2418', 2.5);
  /* a scarf of stars */
  s += P('M70 116 Q100 130 130 116 L130 124 Q100 138 70 124Z', '#3a2a6e', 3) + star4(86, 124, 4, STAR, 1) + star4(114, 124, 4, STAR, 1) + star4(100, 130, 4, STAR, 1);
  s += foxHead(90, 1, a);
  return [s, { eyes: [[84, 88], [116, 88]], r: 10, mouth: [100, 110], w: 10, iris: '#7a5ab8', lid: a.main, rune: [100, 66] }];
}

/* ======================================================================================================== */
export const COMPANION_BODIES: Record<'caracal' | 'blackcat' | 'xolo' | 'swordfish' | 'eagleowl' | 'lion' | 'wingfox', Draw> = {
  caracal: caracal, blackcat: blackcat, xolo: xolo, swordfish: swordfish, eagleowl: eagleowl, lion: lion, wingfox: wingfox
};
