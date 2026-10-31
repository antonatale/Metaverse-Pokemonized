import { SPECIES, type SpeciesId, type Species } from '../../data/creatures';
import type { TypeName } from '../../data/types';

/* The creatures of Formia, drawn whole in one SVG each: no shared <defs>, so the same picture works in battle
   (expressions switch with data-expr, like the friends') and, as an image, on the map. Sticker style: flat colours
   with a dark outline, big eyes, a blush. Each body grows with its form: spots and a crown for the octopus, stone
   plates for the lizard of the walls, the admiral's hat for the gull. */

const INK = '#1c2340', BLUSH = '#ff8fa3';
const EXPRS = ['smirk', 'grin', 'pout', 'worried', 'sleepy', 'cool'];
interface Face { eyes: [number, number][]; r: number; mouth: [number, number] | null; w: number; iris?: string; lid: string; rune: [number, number] }

function ell(cx: number, cy: number, rx: number, ry: number, fill: string, sw = 4, extra = '') {
  return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '"' : '') + extra + '/>';
}
function path(d: string, fill: string, sw = 4, extra = '') {
  return '<path d="' + d + '" fill="' + fill + '"' + (sw ? ' stroke="' + INK + '" stroke-width="' + sw + '" stroke-linejoin="round" stroke-linecap="round"' : '') + extra + '/>';
}
/* a thick curved limb (tentacle, tail): an outline stroke, then the colour on top */
function limb(d: string, col: string, w: number) {
  return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (w + 8) + '" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round"/>';
}
function star(cx: number, cy: number, r: number, fill: string) {
  var pts: string[] = [];
  for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; pts.push((cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1)); }
  return path('M' + pts.join(' L') + 'Z', fill, 2.5);
}

/* ---------- the faces: one group per expression ---------- */
function eye(x: number, y: number, r: number, f: Face, look = 0) {
  return ell(x, y, r, r * 1.08, '#ffffff', 3) + (f.iris ? ell(x, y + 1, r * 0.72, r * 0.76, f.iris, 0) : '') +
    ell(x + look, y + 1.5, r * 0.46, r * 0.52, INK, 0) + ell(x + look - r * 0.2, y - r * 0.25, r * 0.17, r * 0.17, '#ffffff', 0);
}
function faceGroup(f: Face, x: string): string {
  var s = '', r = f.r, m = f.mouth, w = f.w;
  var blush = f.eyes.map(function (e, k) { return ell(e[0] + (k ? r * 0.9 : -r * 0.9), e[1] + r * 1.25, r * 0.55, r * 0.32, BLUSH, 0, ' opacity=".55"'); }).join('');
  if (x === 'grin') {
    s += f.eyes.map(function (e) { return path('M' + (e[0] - r) + ' ' + (e[1] + 2) + ' Q' + e[0] + ' ' + (e[1] - r * 1.2) + ' ' + (e[0] + r) + ' ' + (e[1] + 2), 'none', 4); }).join('');
    if (m) s += path('M' + (m[0] - w / 2) + ' ' + m[1] + ' Q' + m[0] + ' ' + (m[1] + w * 0.9) + ' ' + (m[0] + w / 2) + ' ' + m[1] + 'Z', '#7a2a35', 3) + ell(m[0], m[1] + w * 0.32, w * 0.22, w * 0.13, '#ff8fa3', 0);
  } else if (x === 'sleepy') {
    s += f.eyes.map(function (e) { return path('M' + (e[0] - r) + ' ' + e[1] + ' Q' + e[0] + ' ' + (e[1] + r * 0.8) + ' ' + (e[0] + r) + ' ' + e[1], 'none', 4); }).join('');
    if (m) s += ell(m[0], m[1] + 2, w * 0.14, w * 0.18, '#7a2a35', 2.5);
    s += path('M150 52 L162 52 L150 64 L162 64', 'none', 3) + path('M166 34 L174 34 L166 42 L174 42', 'none', 2.5);
  } else if (x === 'cool') {
    s += f.eyes.map(function (e) { return eye(e[0], e[1], r, f, 1) + path('M' + (e[0] - r - 1) + ' ' + (e[1] - r * 1.15) + ' L' + (e[0] + r + 1) + ' ' + (e[1] - r * 1.15) + ' L' + (e[0] + r + 1) + ' ' + (e[1] - r * 0.15) + ' L' + (e[0] - r - 1) + ' ' + (e[1] - r * 0.15) + 'Z', f.lid, 3); }).join('');
    if (m) s += path('M' + (m[0] - w / 2) + ' ' + (m[1] + 2) + ' Q' + (m[0] + w * 0.1) + ' ' + (m[1] + w * 0.45) + ' ' + (m[0] + w / 2) + ' ' + (m[1] - 3), 'none', 3.5);
  } else {
    var look = x === 'pout' ? 0 : x === 'worried' ? -1.5 : 1.5;
    s += f.eyes.map(function (e) { return eye(e[0], e[1] + (x === 'pout' ? 1 : 0), r, f, look); }).join('');
    if (x === 'worried') {
      s += f.eyes.map(function (e, k) { var d = k ? -1 : 1; return path('M' + (e[0] - r * d) + ' ' + (e[1] - r * 1.25) + ' L' + (e[0] + r * 0.7 * d) + ' ' + (e[1] - r * 1.75), 'none', 3.5); }).join('');
      s += path('M158 60 Q166 74 158 80 Q150 74 158 60Z', '#bfe3ff', 2.5);
    }
    if (m) {
      if (x === 'pout') s += path('M' + (m[0] - w / 2) + ' ' + (m[1] + 5) + ' Q' + m[0] + ' ' + (m[1] - 5) + ' ' + (m[0] + w / 2) + ' ' + (m[1] + 5), 'none', 3.5);
      else if (x === 'worried') s += path('M' + (m[0] - w / 2) + ' ' + (m[1] + 2) + ' q' + (w / 4) + ' -6 ' + (w / 2) + ' 0 t' + (w / 2) + ' 0', 'none', 3);
      else s += path('M' + (m[0] - w / 2) + ' ' + m[1] + ' Q' + m[0] + ' ' + (m[1] + w * 0.5) + ' ' + (m[0] + w / 2) + ' ' + m[1], 'none', 3.5);
    }
  }
  return blush + s;
}

/* ---------- the bodies: [picture, face] for a species ---------- */
function octo(sp: Species): [string, Face] {
  var a = sp.art, s = '', st = sp.stage;
  [[-46, 160, -70, 186], [-26, 172, -40, 194], [-6, 176, -10, 196], [14, 176, 22, 196], [34, 172, 48, 192], [50, 160, 74, 182]].forEach(function (t, k) {
    var x0 = 100 + (k - 2.5) * 13, d = 'M' + x0 + ' 128 Q' + (100 + t[0]) + ' ' + t[1] + ' ' + (100 + t[2]) + ' ' + t[3] + ' q' + (k < 3 ? -10 : 10) + ' -4 ' + (k < 3 ? -6 : 6) + ' -14';
    s += limb(d, a.main, 14);
    if (st === 3) s += star(100 + t[2] * 0.82, t[3] - 8, 6, a.accent);
  });
  s += ell(100, 100, 52, 48, a.main) + ell(84, 82, 20, 13, a.belly, 0, ' opacity=".7"');
  if (st >= 2) [[66, 104, 5], [136, 98, 6], [122, 66, 4], [76, 66, 4.5]].forEach(function (p) { s += ell(p[0], p[1], p[2], p[2], a.dark, 0, ' opacity=".55"'); });
  if (st === 3) s += path('M72 58 L78 34 L90 50 L100 28 L110 50 L122 34 L128 58 Z', a.accent, 3.5) + ell(100, 44, 4, 4, '#e8473a', 2);
  return [s, { eyes: [[83, 102], [117, 102]], r: 12, mouth: [100, 126], w: 18, lid: a.main, rune: [100, 76] }];
}
function lizard(sp: Species): [string, Face] {
  var a = sp.art, s = '', st = sp.stage;
  s += limb('M126 166 Q170 170 172 140 Q174 116 156 118', a.main, 16);
  s += ell(76, 182, 14, 8, a.dark, 3) + ell(124, 182, 14, 8, a.dark, 3);
  s += ell(100, 146, 40, 38, a.main) + ell(100, 152, 26, 26, a.belly, 0);
  if (st === 3) [[64, 128, 74, 112, 88, 118, 84, 134], [116, 118, 128, 110, 138, 126, 124, 136], [92, 112, 104, 104, 112, 116, 98, 124]].forEach(function (q) {
    s += path('M' + q[0] + ' ' + q[1] + ' L' + q[2] + ' ' + q[3] + ' L' + q[4] + ' ' + q[5] + ' L' + q[6] + ' ' + q[7] + 'Z', a.accent, 3);
  });
  var n = st === 1 ? 3 : 5;
  for (var k = 0; k < n; k++) { var cx = 100 + (k - (n - 1) / 2) * 14; s += path('M' + (cx - 7) + ' ' + (58 - (st - 1) * 2) + ' L' + cx + ' ' + (40 - st * 4) + ' L' + (cx + 7) + ' ' + (58 - (st - 1) * 2) + 'Z', a.dark, 3); }
  s += ell(100, 86, 46, 34, a.main);
  if (st >= 2) s += path('M74 108 Q100 128 126 108 Q100 116 74 108Z', a.accent, 3);
  if (st === 3) s += path('M62 66 Q52 46 64 40 Q64 56 72 62Z', '#f4ecd8', 3) + path('M138 66 Q148 46 136 40 Q136 56 128 62Z', '#f4ecd8', 3);
  s += ell(100, 98, 22, 7, a.dark, 0, ' opacity=".25"');
  return [s, { eyes: [[83, 82], [117, 82]], r: 11, mouth: [100, 102], w: 20, lid: a.main, rune: [100, 150] }];
}
function bird(sp: Species): [string, Face] {
  var a = sp.art, s = '', st = sp.stage;
  s += path('M84 176 l-6 10 M84 176 l0 11 M84 176 l6 10 M116 176 l-6 10 M116 176 l0 11 M116 176 l6 10', 'none', 4) + path('M84 176 l-6 10 M84 176 l0 11 M84 176 l6 10 M116 176 l-6 10 M116 176 l0 11 M116 176 l6 10', 'none', 0, ' stroke="' + a.accent + '" stroke-width="2"');
  s += path('M58 120 Q30 150 52 170 Q66 160 70 140Z', a.dark, 4) + path('M142 120 Q170 150 148 170 Q134 160 130 140Z', a.dark, 4);
  if (st >= 2) s += path('M40 160 Q46 170 52 170 Q48 162 50 156Z', INK, 0) + path('M160 160 Q154 170 148 170 Q152 162 150 156Z', INK, 0);
  s += ell(100, 140, 44, 40, a.main) + ell(100, 148, 28, 26, a.belly, 0);
  if (st === 1) s += path('M78 60 q8 -14 14 -2 q6 -14 12 0 q8 -12 12 2', a.main, 3);
  s += ell(100, 86, 38, 34, a.main);
  s += path('M90 98 Q100 92 110 98 L104 118 Q100 122 96 118 Z', a.accent, 3);
  if (st >= 2) s += ell(103, 112, 3, 3, '#e8473a', 0);
  if (st === 3) s += path('M52 66 Q100 20 148 66 Q100 52 52 66Z', '#1f2b5c', 4) + path('M60 63 Q100 50 140 63', 'none', 0, ' stroke="#ffcf3f" stroke-width="3"') + path('M96 40 v12 M90 46 h12 M92 52 q4 4 8 0', 'none', 0, ' stroke="#ffcf3f" stroke-width="2.6"');
  return [s, { eyes: [[86, 84], [114, 84]], r: 9, mouth: null, w: 0, lid: a.main, rune: [100, 146] }];
}
function cicada(sp: Species): [string, Face] {
  var a = sp.art, s = '', st = sp.stage, wl = st === 1 ? 56 : 70;
  [-1, 1].forEach(function (d) {
    s += path('M' + (100 + d * 14) + ' 112 Q' + (100 + d * (wl + 10)) + ' 104 ' + (100 + d * wl) + ' 170 Q' + (100 + d * 30) + ' 160 ' + (100 + d * 14) + ' 112Z', a.accent, 3.5, ' opacity=".85"');
    s += path('M' + (100 + d * 18) + ' 118 Q' + (100 + d * 44) + ' 128 ' + (100 + d * (wl - 6)) + ' 160 M' + (100 + d * 22) + ' 130 Q' + (100 + d * 36) + ' 150 ' + (100 + d * 40) + ' 162', 'none', 0, ' stroke="' + INK + '" stroke-width="1.6" opacity=".6"');
  });
  s += path('M78 168 l-8 12 M122 168 l8 12 M80 150 l-12 6 M120 150 l12 6', 'none', 4);
  s += ell(100, 136, 30, 44, a.main);
  [120, 138, 156].forEach(function (y) { s += path('M' + (76 + (y - 120) * 0.1) + ' ' + y + ' Q100 ' + (y + 7) + ' ' + (124 - (y - 120) * 0.1) + ' ' + y, 'none', 0, ' stroke="' + a.dark + '" stroke-width="3"'); });
  if (st === 2) s += path('M88 70 Q78 44 64 40 M112 70 Q122 44 136 40', 'none', 3.5);
  s += ell(100, 84, 44, 24, a.main);
  return [s, { eyes: [[74, 82], [126, 82]], r: 12, mouth: [100, 96], w: 14, iris: '#a8402e', lid: a.main, rune: [100, 118] }];
}
function olive(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  if (sp.stage === 1) {
    s += path('M100 76 Q104 60 110 50', 'none', 4);
    s += path('M108 56 Q130 40 146 50 Q128 64 108 56Z', a.accent, 3) + path('M106 60 Q84 42 66 50 Q84 66 106 60Z', a.accent, 3);
    s += ell(100, 130, 42, 54, a.main) + ell(84, 106, 10, 18, a.belly, 0, ' opacity=".6" transform="rotate(-20 84 106)"');
    s += ell(76, 182, 12, 6, a.dark, 3) + ell(124, 182, 12, 6, a.dark, 3);
    return [s, { eyes: [[85, 128], [115, 128]], r: 10, mouth: [100, 150], w: 16, lid: a.main, rune: [100, 102] }];
  }
  s += path('M80 186 Q72 150 86 120 Q74 110 70 96 L130 96 Q126 110 114 120 Q128 150 120 186 Q110 178 100 186 Q90 178 80 186Z', a.main, 4);
  s += path('M90 140 Q96 150 92 162 M110 130 Q104 146 112 158', 'none', 0, ' stroke="' + a.dark + '" stroke-width="3"');
  [[100, 62, 40, 26], [66, 78, 24, 18], [134, 78, 24, 18], [100, 40, 26, 16]].forEach(function (b) { s += ell(b[0], b[1], b[2], b[3], a.accent); });
  [[74, 92], [128, 90], [110, 70], [86, 64]].forEach(function (o) { s += ell(o[0], o[1], 6, 8, '#4a2c4d', 2.5); });
  return [s, { eyes: [[88, 124], [112, 124]], r: 9, mouth: [100, 146], w: 14, lid: a.main, rune: [100, 166] }];
}
function urchin(sp: Species): [string, Face] {
  var a = sp.art, s = '', n = sp.stage === 1 ? 18 : 26, r0 = 42, r1 = sp.stage === 1 ? 64 : 76;
  for (var k = 0; k < n; k++) {
    var t = k / n * Math.PI * 2, x0 = 100 + Math.cos(t) * r0, y0 = 134 + Math.sin(t) * r0 * 0.92, x1 = 100 + Math.cos(t) * r1, y1 = 134 + Math.sin(t) * r1 * 0.88;
    if (y1 > 186) continue;
    s += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" stroke="' + a.dark + '" stroke-width="3.5" stroke-linecap="round"/>';
  }
  s += ell(100, 134, 44, 40, a.main) + ell(86, 118, 14, 9, a.belly, 0, ' opacity=".6"');
  if (sp.stage === 2) [[78, 150], [122, 150], [100, 160]].forEach(function (p) { s += ell(p[0], p[1], 3, 3, a.accent, 0); });
  return [s, { eyes: [[86, 132], [114, 132]], r: 10, mouth: [100, 152], w: 16, lid: a.main, rune: [100, 110] }];
}
function crab(sp: Species): [string, Face] {
  var a = sp.art, s = '', st = sp.stage, cr = st === 1 ? 18 : 25;
  [-1, 1].forEach(function (d) {
    s += path('M' + (100 + d * 40) + ' 160 l' + (d * 22) + ' 14 M' + (100 + d * 44) + ' 150 l' + (d * 26) + ' 6 M' + (100 + d * 42) + ' 168 l' + (d * 14) + ' 16', 'none', 5);
    s += limb('M' + (100 + d * 44) + ' 132 Q' + (100 + d * 62) + ' 118 ' + (100 + d * 64) + ' 96', a.main, 10);
    var cx = 100 + d * 64, cy = 84 - (st - 1) * 6;
    s += path('M' + (cx - cr * 0.8) + ' ' + (cy + 6) + ' Q' + (cx - cr) + ' ' + (cy - cr) + ' ' + cx + ' ' + (cy - cr) + ' Q' + (cx + cr) + ' ' + (cy - cr * 0.9) + ' ' + (cx + cr * 0.7) + ' ' + (cy + 2) + ' L' + cx + ' ' + (cy - 2) + 'Z', a.main, 4);
  });
  s += path('M86 108 L82 82 M114 108 L118 82', 'none', 5);
  s += ell(100, 144, 56, 34, a.main) + ell(100, 150, 36, 18, a.belly, 0, ' opacity=".8"');
  return [s, { eyes: [[82, 80], [118, 80]], r: 10, mouth: [100, 140], w: 18, lid: a.main, rune: [100, 160] }];
}
function owl(sp: Species): [string, Face] {
  var a = sp.art, s = '', st = sp.stage;
  s += path('M84 182 l-6 6 M84 182 l0 7 M84 182 l6 6 M116 182 l-6 6 M116 182 l0 7 M116 182 l6 6', 'none', 4);
  s += path('M56 116 Q40 150 60 176 Q72 160 74 134Z', a.dark, 4) + path('M144 116 Q160 150 140 176 Q128 160 126 134Z', a.dark, 4);
  var tuft = st === 1 ? 14 : 22;
  s += path('M64 72 L58 ' + (54 - tuft) + ' L84 64Z', a.dark, 3.5) + path('M136 72 L142 ' + (54 - tuft) + ' L116 64Z', a.dark, 3.5);
  s += ell(100, 128, 48, 58, a.main) + ell(100, 146, 30, 34, a.belly, 0);
  [[90, 140], [110, 140], [100, 154], [90, 166], [110, 166]].forEach(function (v) { s += path('M' + (v[0] - 4) + ' ' + v[1] + ' l4 5 l4 -5', 'none', 0, ' stroke="' + a.dark + '" stroke-width="2.4"'); });
  s += ell(84, 104, 19, 18, a.belly, 0) + ell(116, 104, 19, 18, a.belly, 0);
  s += path('M94 116 L100 128 L106 116Z', '#e8a33c', 3);
  if (st === 2) s += '<circle cx="116" cy="104" r="17" fill="none" stroke="#e0b44c" stroke-width="3.5"/><path d="M132 110 Q140 130 132 146" fill="none" stroke="#e0b44c" stroke-width="2"/>';
  return [s, { eyes: [[84, 104], [116, 104]], r: 13, mouth: null, w: 0, iris: a.accent, lid: a.main, rune: [100, 158] }];
}
/* the king of the giants: a body of polygonal stones like the walls of Castellone, a beard of moss, a gold crown */
function giant(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += path('M70 150 L66 188 L92 188 L94 150Z', a.dark, 4) + path('M106 150 L108 188 L134 188 L130 150Z', a.dark, 4);
  s += path('M40 80 Q26 110 30 142 L46 146 Q50 118 58 100Z', a.main, 4) + path('M160 80 Q174 110 170 142 L154 146 Q150 118 142 100Z', a.main, 4);
  s += ell(36, 148, 13, 11, a.dark) + ell(164, 148, 13, 11, a.dark);
  s += path('M48 76 L152 76 L140 156 L60 156Z', a.main, 4);
  [[58, 82, 82, 80, 86, 104, 62, 108], [86, 80, 114, 80, 112, 102, 90, 104], [118, 80, 142, 82, 138, 108, 116, 104], [64, 112, 92, 108, 96, 132, 68, 136],
   [100, 108, 134, 112, 132, 136, 104, 134], [70, 140, 100, 138, 102, 154, 72, 154], [106, 140, 134, 140, 130, 154, 108, 154]].forEach(function (q) {
    s += path('M' + q[0] + ' ' + q[1] + ' L' + q[2] + ' ' + q[3] + ' L' + q[4] + ' ' + q[5] + ' L' + q[6] + ' ' + q[7] + 'Z', a.belly, 2.4, ' opacity=".9"');
  });
  s += path('M72 46 Q72 20 100 18 Q128 20 128 46 L126 76 Q100 86 74 76Z', a.main, 4);
  s += path('M74 72 Q78 104 100 110 Q122 104 126 72 Q112 84 100 84 Q88 84 74 72Z', '#6f9a54', 3.5);
  s += path('M74 28 L80 6 L90 20 L100 2 L110 20 L120 6 L126 28Z', a.accent, 3.5) + ell(100, 16, 4, 4, '#e8473a', 2) + ell(84, 20, 3, 3, '#3f7ccf', 1.8) + ell(116, 20, 3, 3, '#3f7ccf', 1.8);
  s += path('M80 54 L94 58 M120 54 L106 58', 'none', 4);
  return [s, { eyes: [[87, 64], [113, 64]], r: 8, mouth: [100, 80], w: 14, iris: a.accent, lid: a.main, rune: [100, 124] }];
}
const BODIES = { octo: octo, lizard: lizard, bird: bird, cicada: cicada, olive: olive, urchin: urchin, crab: crab, owl: owl, giant: giant };

/* ---------- magic: each type has its own, the creatures carry it ----------
   An aura behind them, a rune on the forehead or the chest, motes of light in the air; from the second form a magic
   circle under the feet, doubled in the third. Calma is the moon, Caos the lightning, Cervello the star, Chiacchiera
   the song, Cuore the heart. */
export const MAGIC: Record<TypeName, { col: string; name: string }> = {
  Calma: { col: '#8fd0f6', name: 'luna' }, Caos: { col: '#ffa04a', name: 'fulmine' }, Cervello: { col: '#c3a0ff', name: 'stella' },
  Chiacchiera: { col: '#ffd84d', name: 'canto' }, Cuore: { col: '#ff8fc1', name: 'cuore' }
};
function glyph(t: TypeName, x: number, y: number, r: number): string {
  if (t === 'Calma') return 'M' + (x + r * 0.25) + ' ' + (y - r) + ' A' + r + ' ' + r + ' 0 1 0 ' + (x + r * 0.25) + ' ' + (y + r) + ' A' + (r * 0.72) + ' ' + (r * 0.72) + ' 0 1 1 ' + (x + r * 0.25) + ' ' + (y - r) + 'Z';
  if (t === 'Caos') return 'M' + (x + r * 0.25) + ' ' + (y - r) + ' L' + (x - r * 0.55) + ' ' + (y + r * 0.12) + ' L' + (x - r * 0.02) + ' ' + (y + r * 0.12) + ' L' + (x - r * 0.25) + ' ' + (y + r) + ' L' + (x + r * 0.6) + ' ' + (y - r * 0.2) + ' L' + (x + r * 0.06) + ' ' + (y - r * 0.2) + 'Z';
  if (t === 'Cervello') return 'M' + x + ' ' + (y - r) + ' L' + (x + r * 0.28) + ' ' + (y - r * 0.28) + ' L' + (x + r) + ' ' + y + ' L' + (x + r * 0.28) + ' ' + (y + r * 0.28) + ' L' + x + ' ' + (y + r) + ' L' + (x - r * 0.28) + ' ' + (y + r * 0.28) + ' L' + (x - r) + ' ' + y + ' L' + (x - r * 0.28) + ' ' + (y - r * 0.28) + 'Z';
  if (t === 'Chiacchiera') return 'M' + (x + r * 0.3) + ' ' + (y - r) + ' L' + (x + r * 0.3) + ' ' + (y + r * 0.45) + ' A' + (r * 0.42) + ' ' + (r * 0.34) + ' 0 1 1 ' + (x - r * 0.05) + ' ' + (y + r * 0.2) + ' L' + (x - r * 0.05) + ' ' + (y - r * 0.85) + ' Q' + (x + r * 0.9) + ' ' + (y - r * 0.7) + ' ' + (x + r * 0.75) + ' ' + (y - r * 0.15) + ' Q' + (x + r * 0.55) + ' ' + (y - r * 0.55) + ' ' + (x + r * 0.3) + ' ' + (y - r * 0.55) + 'Z';
  return 'M' + x + ' ' + (y + r * 0.9) + ' C' + (x - r * 1.3) + ' ' + (y + r * 0.1) + ' ' + (x - r * 0.9) + ' ' + (y - r * 1.05) + ' ' + x + ' ' + (y - r * 0.4) + ' C' + (x + r * 0.9) + ' ' + (y - r * 1.05) + ' ' + (x + r * 1.3) + ' ' + (y + r * 0.1) + ' ' + x + ' ' + (y + r * 0.9) + 'Z';
}
/** a rune of a type on its own, for the spells in battle */
export function runeIcon(t: TypeName, size: number): string {
  var c = MAGIC[t].col;
  return '<svg viewBox="0 0 40 40" width="' + size + '" height="' + size + '" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="' + c + '" opacity=".4"/>' +
    '<path d="' + glyph(t, 20, 20, 12) + '" fill="' + c + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/></svg>';
}
function magic(sp: Species, rune: [number, number]): { back: string; rune: string; front: string } {
  var m = MAGIC[sp.type], c = m.col, st = sp.stage, r = 9 + st * 1.5, gid = 'au-' + sp.type;
  var back = '<defs><radialGradient id="' + gid + '"><stop offset="0" stop-color="' + c + '" stop-opacity=".7"/><stop offset=".6" stop-color="' + c + '" stop-opacity=".25"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse class="aura" cx="100" cy="122" rx="' + (70 + st * 8) + '" ry="' + (64 + st * 7) + '" fill="url(#' + gid + ')"/>';
  if (st >= 2) {
    back += '<ellipse cx="100" cy="184" rx="' + (60 + st * 6) + '" ry="' + (11 + st) + '" fill="none" stroke="' + c + '" stroke-width="2.5" stroke-dasharray="7 5" opacity=".85"/>';
    if (st === 3) back += '<ellipse cx="100" cy="184" rx="' + (52 + st * 6) + '" ry="' + (8 + st) + '" fill="none" stroke="' + c + '" stroke-width="1.6" opacity=".7"/>' +
      [-1, 1].map(function (d) { return '<path d="' + glyph(sp.type, 100 + d * 66, 184, 5) + '" fill="' + c + '" stroke="' + INK + '" stroke-width="1.4"/>'; }).join('');
  }
  var runeSvg = '<circle cx="' + rune[0] + '" cy="' + rune[1] + '" r="' + (r + 4) + '" fill="' + c + '" opacity=".35"/>' +
    '<path d="' + glyph(sp.type, rune[0], rune[1], r) + '" fill="' + c + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<circle cx="' + (rune[0] - r * 0.25) + '" cy="' + (rune[1] - r * 0.3) + '" r="' + (r * 0.18) + '" fill="#ffffff" opacity=".9"/>';
  var motes = [[28, 74], [172, 62], [158, 134], [40, 128], [100, 18], [20, 168]].slice(0, 2 + st).map(function (p, k) {
    return '<path class="mg mg' + k + '" d="' + glyph(k % 2 ? sp.type : 'Cervello', p[0], p[1], 5.5 + (k % 3)) + '" fill="' + c + '" stroke="' + INK + '" stroke-width="1.3" opacity=".9"/>';
  }).join('');
  return { back: back, rune: runeSvg, front: motes };
}
/* a golden one: the same creature in the colours of gold, very rare in the wild */
const GOLD = { main: '#f2c94c', dark: '#b8860b', belly: '#fff1b8' };
function goldOf(sp: Species): Species { return Object.assign({}, sp, { art: Object.assign({}, sp.art, GOLD) }); }
const SPARKS = [[34, 60, 7], [168, 84, 6], [150, 30, 5], [46, 150, 5]].map(function (p) { return '<path d="M' + p[0] + ' ' + (p[1] - p[2]) + ' L' + (p[0] + p[2] * 0.3) + ' ' + (p[1] - p[2] * 0.3) + ' L' + (p[0] + p[2]) + ' ' + p[1] + ' L' + (p[0] + p[2] * 0.3) + ' ' + (p[1] + p[2] * 0.3) + ' L' + p[0] + ' ' + (p[1] + p[2]) + ' L' + (p[0] - p[2] * 0.3) + ' ' + (p[1] + p[2] * 0.3) + ' L' + (p[0] - p[2]) + ' ' + p[1] + ' L' + (p[0] - p[2] * 0.3) + ' ' + (p[1] - p[2] * 0.3) + 'Z" fill="#fff6c8" stroke="' + INK + '" stroke-width="1.6"/>'; }).join('');
/** a creature as an SVG: in battle with every expression (data-expr picks one), or, with only, a still picture; gold for a golden one */
export function creature(id: SpeciesId, expr?: string, cls?: string, vb?: string, only?: string, gold?: boolean): string {
  var sp = gold ? goldOf(SPECIES[id]) : SPECIES[id], bf = BODIES[sp.art.body](sp), k = sp.art.size, mg = magic(sp, bf[1].rune);
  var faces = only ? '<g>' + faceGroup(bf[1], only) + '</g>' : EXPRS.map(function (x) { return '<g class="ex ex-' + x + '">' + faceGroup(bf[1], x) + '</g>'; }).join('');
  return '<svg xmlns="http://www.w3.org/2000/svg" class="spr spr-c spr-' + id + ' ' + (cls || '') + '" viewBox="' + (vb || '0 0 200 200') + '" data-expr="' + (expr || 'smirk') + '" role="img" aria-label="' + sp.name + '">' +
    mg.back + '<ellipse cx="100" cy="190" rx="' + (54 * k) + '" ry="7" fill="' + INK + '" opacity=".14"/>' +
    '<g transform="translate(100 190) scale(' + k + ') translate(-100 -190)">' + bf[0] + mg.rune + faces + '</g>' + mg.front + (gold ? SPARKS : '') + '</svg>';
}
/** the rules that show one expression at a time (also in styles/sprites.css) */
export const CREATURE_CSS = '.spr-c .ex{display:none}' + EXPRS.map(function (x) { return '.spr-c[data-expr="' + x + '"] .ex-' + x; }).join(',') + '{display:inline}';
/** the magic moving: motes rising and fading, the aura breathing (also in styles/sprites.css) */
export const MAGIC_CSS = '.spr-c .mg{animation:mote 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
  '.spr-c .mg1{animation-delay:-.8s}.spr-c .mg2{animation-delay:-1.6s}.spr-c .mg3{animation-delay:-2.4s}.spr-c .mg4{animation-delay:-1.2s}' +
  '.spr-c .aura{animation:aura 3.6s ease-in-out infinite;transform-box:fill-box;transform-origin:center}' +
  '@keyframes mote{0%,100%{transform:translateY(0) scale(1);opacity:.9}50%{transform:translateY(-7px) scale(.75);opacity:.45}}' +
  '@keyframes aura{50%{opacity:.6;transform:scale(1.05)}}' +
  '@media (prefers-reduced-motion:reduce){.spr-c .mg,.spr-c .aura{animation:none}}';
