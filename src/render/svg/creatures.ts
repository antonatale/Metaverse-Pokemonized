import { SPECIES, type SpeciesId, type Species } from '../../data/creatures';
import type { TypeName } from '../../data/types';

/* The creatures of Formia, drawn whole in one SVG each: no shared <defs>, so the same picture works in battle
   (expressions switch with data-expr, like the friends') and, as an image, on the map. Sticker style: flat colours
   with a dark outline, big eyes, a blush. Every form is drawn on its own, a new creature and not the old one bigger:
   the octopus with the inkwell, then the orator in a toga; the lizard of the moon, then armoured in marble, then the
   dragon of the walls with the octagonal tower for a crown; the gull of the storm, the sailor, the admiral. */

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

/** a crescent moon, horns up, turned by rot degrees */
function crescent(cx: number, cy: number, r: number, fill: string, rot = 0, sw = 3) {
  return path('M' + (cx - r) + ' ' + cy + ' A' + r + ' ' + r + ' 0 0 0 ' + (cx + r) + ' ' + cy + ' A' + r + ' ' + (r * 0.55) + ' 0 0 1 ' + (cx - r) + ' ' + cy + 'Z', fill, sw, rot ? ' transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')"' : '');
}
/** a lightning bolt, s high, its top at x, y */
function bolt(x: number, y: number, s: number, fill: string, sw = 2.5) {
  var k = s / 30;
  return path('M' + (x + 6 * k) + ' ' + y + ' L' + (x - 6 * k) + ' ' + (y + 16 * k) + ' L' + (x + 1 * k) + ' ' + (y + 16 * k) + ' L' + (x - 4 * k) + ' ' + (y + 30 * k) + ' L' + (x + 10 * k) + ' ' + (y + 11 * k) + ' L' + (x + 3 * k) + ' ' + (y + 11 * k) + ' L' + (x + 8 * k) + ' ' + y + 'Z', fill, sw);
}
/** a four-pointed sparkle */
function star4(cx: number, cy: number, r: number, fill: string, sw = 1.6) {
  return path('M' + cx + ' ' + (cy - r) + ' L' + (cx + r * 0.28) + ' ' + (cy - r * 0.28) + ' L' + (cx + r) + ' ' + cy + ' L' + (cx + r * 0.28) + ' ' + (cy + r * 0.28) + ' L' + cx + ' ' + (cy + r) + ' L' + (cx - r * 0.28) + ' ' + (cy + r * 0.28) + ' L' + (cx - r) + ' ' + cy + ' L' + (cx - r * 0.28) + ' ' + (cy - r * 0.28) + 'Z', fill, sw);
}
function heartP(cx: number, cy: number, r: number, fill: string, sw = 3) {
  return path('M' + cx + ' ' + (cy + r * 0.9) + ' C' + (cx - r * 1.3) + ' ' + (cy + r * 0.1) + ' ' + (cx - r * 0.9) + ' ' + (cy - r * 1.05) + ' ' + cx + ' ' + (cy - r * 0.4) + ' C' + (cx + r * 0.9) + ' ' + (cy - r * 1.05) + ' ' + (cx + r * 1.3) + ' ' + (cy + r * 0.1) + ' ' + cx + ' ' + (cy + r * 0.9) + 'Z', fill, sw);
}
/** a cloud of circles with one outline round the outside: every circle stroked wide, then every circle filled */
function cloud(list: number[][], fill: string, sw = 4) {
  return list.map(function (b) { return '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="' + (sw * 2) + '"/>'; }).join('') +
    list.map(function (b) { return '<circle cx="' + b[0] + '" cy="' + b[1] + '" r="' + b[2] + '" fill="' + fill + '"/>'; }).join('');
}
function poly(pts: number[], fill: string, sw = 3, extra = '') {
  var d = 'M' + pts[0] + ' ' + pts[1];
  for (var i = 2; i < pts.length; i += 2) d += ' L' + pts[i] + ' ' + pts[i + 1];
  return path(d + 'Z', fill, sw, extra);
}
/** the same drawing mirrored, left to right */
function mirror(svg: string) { return '<g transform="translate(200 0) scale(-1 1)">' + svg + '</g>'; }
function line(d: string, col: string, w: number, extra = '') { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + extra + '/>'; }

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
  if (sp.stage === 2) return calamastro(sp);
  if (sp.stage === 3) return ciceropode(sp);
  var a = sp.art, s = '';
  [[-46, 160, -70, 186], [-26, 172, -40, 194], [-6, 176, -10, 196], [14, 176, 22, 196], [34, 172, 48, 192], [50, 160, 74, 182]].forEach(function (t, k) {
    var x0 = 100 + (k - 2.5) * 13, d = 'M' + x0 + ' 128 Q' + (100 + t[0]) + ' ' + t[1] + ' ' + (100 + t[2]) + ' ' + t[3] + ' q' + (k < 3 ? -10 : 10) + ' -4 ' + (k < 3 ? -6 : 6) + ' -14';
    s += limb(d, a.main, 14);
  });
  s += ell(100, 100, 52, 48, a.main) + ell(84, 82, 20, 13, a.belly, 0, ' opacity=".7"');
  return [s, { eyes: [[83, 102], [117, 102]], r: 12, mouth: [100, 126], w: 18, lid: a.main, rune: [100, 76] }];
}
/* the octopus with the inkwell: blue, curled arms with suckers, the calamaio on its head, a quill held up like a wand */
function calamastro(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  [[-44, 158, -76, 176, -1], [-26, 172, -48, 192, -1], [-8, 178, -18, 196, -1], [10, 178, 18, 196, 1], [28, 172, 46, 192, 1]].forEach(function (t) {
    var x0 = 100 + t[0] * 0.5, d = 'M' + x0 + ' 128 Q' + (100 + t[0]) + ' ' + t[1] + ' ' + (100 + t[2]) + ' ' + t[3] + ' q' + (t[4] * 12) + ' -2 ' + (t[4] * 10) + ' -12 q' + (-t[4] * 4) + ' -6 ' + (-t[4] * 9) + ' -1';
    s += limb(d, a.main, 14);
    s += ell(100 + t[2] * 0.72, t[3] - 10, 3, 3, a.belly, 1.5) + ell(100 + t[0] * 0.8 + t[2] * 0.2, t[1] + 2, 2.6, 2.6, a.belly, 1.5);
  });
  /* the arm that holds the quill, up on the right, and the quill with a star of ink at its tip */
  s += limb('M130 130 Q164 140 166 112 Q168 96 156 92', a.main, 14);
  s += path('M150 96 Q166 60 190 32 Q180 66 160 100Z', '#fbf8f0', 3.5) + line('M156 92 Q172 62 186 38', '#c9c2b0', 1.6) + path('M150 96 L156 92 L160 100 L154 106Z', INK, 0);
  s += star4(186, 28, 9, a.accent, 2.2) + star4(170, 18, 4.5, a.accent, 1.4);
  s += ell(100, 98, 50, 46, a.main) + ell(82, 80, 18, 11, a.belly, 0, ' opacity=".6"');
  [[66, 106, 5], [134, 102, 5.5], [124, 76, 4], [72, 76, 3.5], [100, 128, 3.5]].forEach(function (p) { s += star4(p[0], p[1], p[2], a.belly, 1.2); });
  /* the calamaio: a glass jar with ink at the bottom and a brass rim */
  s += path('M76 60 Q74 42 82 36 L118 36 Q126 42 124 60 Q100 68 76 60Z', '#d7ecff', 4) + path('M77 52 Q100 58 123 52 Q123 60 100 66 Q77 60 77 52Z', '#1d2a66', 0, ' opacity=".9"') +
    path('M84 30 L116 30 L118 37 L82 37Z', a.accent, 3.5) + ell(90, 46, 3, 6, '#ffffff', 0, ' opacity=".8"');
  return [s, { eyes: [[83, 100], [117, 100]], r: 12, mouth: [100, 124], w: 18, lid: a.main, rune: [100, 78] }];
}
/* the orator: a purple octopus in a toga with a gold border, a laurel wreath, a scroll in one arm and the other raised
   to speak, floating over the rocks with its arms hanging */
function ciceropode(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  [[-30, 166, -40, 180, -1], [-12, 172, -16, 184, -1], [8, 172, 12, 184, 1], [28, 166, 40, 180, 1]].forEach(function (t) {
    var x0 = 100 + t[0] * 0.6, d = 'M' + x0 + ' 140 Q' + (100 + t[0]) + ' ' + t[1] + ' ' + (100 + t[2]) + ' ' + t[3] + ' q' + (t[4] * 8) + ' -1 ' + (t[4] * 7) + ' -9';
    s += limb(d, a.main, 12);
  });
  /* the scroll, held up on the left */
  s += limb('M64 132 Q40 132 34 112', a.main, 12);
  s += path('M8 74 L44 70 L48 112 L12 116Z', '#fff4d6', 3.5) + ell(10, 116, 5, 3, '#e6d2a0', 3) + ell(46, 70, 5, 3, '#e6d2a0', 3);
  [82, 90, 98, 106].forEach(function (y, k) { s += line('M' + (16 + k * 0.4) + ' ' + y + ' L' + (40 + k * 0.4) + ' ' + (y - 3), INK, 1.6, ' opacity=".55"'); });
  /* the raised arm, and the words that come out */
  s += limb('M136 132 Q170 128 172 94 Q172 80 162 74', a.main, 12);
  s += line('M176 60 l-6 6 l6 6 M186 60 l-6 6 l6 6', a.accent, 3) + line('M178 40 q8 4 4 12', a.accent, 2.5);
  s += ell(100, 90, 46, 42, a.main) + ell(84, 70, 16, 10, a.belly, 0, ' opacity=".55"');
  /* the toga: draped over the left shoulder and down across, with the gold border of the senators */
  s += path('M58 114 Q100 130 142 114 Q148 134 144 152 Q122 162 100 158 Q78 162 56 152 Q52 132 58 114Z', '#fbf8f0', 4) + line('M58 150 Q78 160 100 156 Q122 160 144 150', a.accent, 4.5);
  s += path('M54 108 Q74 102 88 118 Q110 136 120 158 L106 160 Q96 136 80 126 Q64 120 54 108Z', '#f1ebdd', 3.5) + line('M62 112 Q84 116 100 136 Q108 146 112 158', a.accent, 3);
  s += line('M70 132 Q76 146 74 154 M128 130 Q124 144 128 152', '#d9d2c2', 2.4);
  /* the laurel wreath */
  [[-0.95, 66], [-0.75, 56], [-0.5, 49], [-0.22, 45], [0.22, 45], [0.5, 49], [0.75, 56], [0.95, 66]].forEach(function (q, k) {
    var x = 100 + q[0] * 46, y = q[1], rot = q[0] * 60 + (k < 4 ? -20 : 20);
    s += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y + '" rx="8" ry="4" fill="' + a.accent + '" stroke="' + INK + '" stroke-width="2.5" transform="rotate(' + rot.toFixed(0) + ' ' + x.toFixed(1) + ' ' + y + ')"/>';
  });
  return [s, { eyes: [[84, 82], [116, 82]], r: 11, mouth: [100, 102], w: 16, lid: a.main, rune: [100, 58] }];
}
/* the lizard of the moon: emerald green, frills like a dragon's, a crescent moon for a crest, a tail that curls into
   a moon too, and moon spots on the shoulders */
function lizard(sp: Species): [string, Face] {
  if (sp.stage === 2) return ramarmo(sp);
  if (sp.stage === 3) return dracastello(sp);
  var a = sp.art, s = '';
  s += limb('M126 166 Q170 176 176 146 Q180 122 160 116', a.main, 16) + crescent(158, 106, 11, a.accent, -40, 3);
  /* the phases of the moon along the tail: new, half, full */
  s += ell(150, 172, 4, 4, a.dark, 2) + path('M168 158 a4 4 0 0 1 0 8Z', a.accent, 0) + ell(168, 162, 4, 4, 'none', 2) + ell(177, 140, 4.2, 4.2, a.accent, 2);
  s += ell(76, 182, 15, 8, a.dark, 3.5) + ell(124, 182, 15, 8, a.dark, 3.5);
  s += ell(100, 148, 38, 36, a.main) + ell(100, 156, 25, 24, a.belly, 0);
  [150, 160, 170].forEach(function (y, k) { s += line('M' + (82 + k * 2) + ' ' + y + ' Q100 ' + (y + 5) + ' ' + (118 - k * 2) + ' ' + y, a.dark, 2.2, ' opacity=".3"'); });
  s += path('M66 140 Q52 150 58 164 Q66 164 72 152Z', a.main, 3.5) + path('M134 140 Q148 150 142 164 Q134 164 128 152Z', a.main, 3.5);
  s += ell(70, 126, 4, 4, a.accent, 2) + ell(130, 126, 4, 4, a.accent, 2) + ell(62, 134, 2.6, 2.6, a.accent, 1.5) + ell(138, 134, 2.6, 2.6, a.accent, 1.5);
  /* the frills behind the head */
  s += path('M60 84 L40 72 L50 88 L36 98 L52 100 L42 112 L62 106Z', a.dark, 3) + mirror(path('M60 84 L40 72 L50 88 L36 98 L52 100 L42 112 L62 106Z', a.dark, 3));
  s += ell(100, 92, 46, 36, a.main) + path('M62 80 Q100 58 138 80 Q100 70 62 80Z', a.dark, 0, ' opacity=".3"');
  s += ell(98, 42, 22, 22, a.accent, 0, ' opacity=".3"') + crescent(98, 42, 20, a.accent, -62, 3.5) + star4(124, 28, 4, a.accent, 1.4) + star4(76, 24, 3, a.accent, 1.2);
  return [s, { eyes: [[82, 92], [118, 92]], r: 12, mouth: [100, 110], w: 20, iris: '#e0b44c', lid: a.main, rune: [100, 158] }];
}
/* armoured in the stones of the walls: low and wide, a shell of polygonal marble plates with moonlight in the cracks,
   stone brows and crest, a tail with a stone club */
function ramarmo(sp: Species): [string, Face] {
  var a = sp.art, s = '', glow = '#fff2b3';
  s += limb('M146 162 Q182 162 184 136', a.main, 18) + poly([170, 138, 176, 118, 192, 114, 198, 130, 188, 142], a.accent, 3.5);
  s += path('M30 154 Q34 86 100 84 Q166 86 170 154Z', glow, 4);
  [[34, 150, 40, 122, 62, 116, 66, 148], [68, 148, 64, 114, 90, 108, 94, 144], [96, 144, 92, 108, 116, 108, 112, 144], [114, 146, 118, 108, 142, 116, 134, 148],
   [136, 148, 144, 118, 162, 124, 166, 150], [46, 116, 58, 96, 84, 90, 86, 106], [90, 104, 88, 88, 112, 88, 110, 104], [114, 106, 116, 90, 142, 96, 152, 116]].forEach(function (q) { s += poly(q, a.accent, 2.6); });
  s += ell(100, 160, 64, 22, a.main);
  s += path('M50 152 L46 186 L68 186 L70 156Z', a.main, 4) + path('M150 152 L154 186 L132 186 L130 156Z', a.main, 4);
  [50, 57, 64, 136, 143, 150].forEach(function (x) { s += path('M' + x + ' 186 l2.5 -6 l2.5 6Z', '#f4ecd8', 2); });
  s += ell(100, 138, 34, 28, a.main) + ell(100, 150, 20, 12, a.belly, 0, ' opacity=".8"');
  s += poly([74, 124, 94, 120, 95, 126, 76, 130], a.accent, 2.4) + poly([126, 124, 106, 120, 105, 126, 124, 130], a.accent, 2.4);
  return [s, { eyes: [[86, 136], [114, 136]], r: 9.5, mouth: [100, 154], w: 18, iris: '#e0b44c', lid: a.main, rune: [100, 98] }];
}
/* the dragon of the walls: upright, with two wings that are pieces of crenellated wall, the octagonal tower of
   Castellone for a crown, horns, and a heart of pink stone in its chest */
function dracastello(sp: Species): [string, Face] {
  var a = sp.art, s = '', wing = 'M72 106 L64 98 L58 104 L50 94 L44 100 L36 88 L30 94 L20 80 L6 132 L30 138 L66 150Z';
  s += path(wing, a.accent, 4) + mirror(path(wing, a.accent, 4));
  [[12, 112, 34, 116, 60, 124], [18, 96, 40, 104, 62, 112], [24, 126, 46, 132]].forEach(function (q) { var d = 'M' + q[0] + ' ' + q[1]; for (var i = 2; i < q.length; i += 2) d += ' L' + q[i] + ' ' + q[i + 1]; s += line(d, '#a89e86', 2) + mirror(line(d, '#a89e86', 2)); });
  s += limb('M124 176 Q170 186 180 162', a.main, 16) + poly([174, 166, 192, 150, 190, 172], a.accent, 3);
  s += path('M74 156 L68 188 L94 188 L96 160Z', a.main, 4) + path('M126 156 L132 188 L106 188 L104 160Z', a.main, 4);
  [70, 78, 86, 106, 114, 122].forEach(function (x) { s += path('M' + x + ' 188 l3 -7 l3 7Z', '#f4ecd8', 2); });
  s += ell(100, 140, 38, 42, a.main) + path('M84 112 Q100 106 116 112 L118 170 Q100 178 82 170Z', a.belly, 3);
  [124, 136, 148, 160].forEach(function (y) { s += line('M' + 84 + ' ' + y + ' Q100 ' + (y + 4) + ' 116 ' + y, a.dark, 2, ' opacity=".35"'); });
  s += ell(100, 138, 20, 18, '#ff8fc1', 0, ' opacity=".35"') + heartP(100, 138, 13, '#ff8fc1', 3) + ell(95, 133, 3, 2, '#ffffff', 0, ' opacity=".8"');
  s += path('M66 118 Q48 136 54 158 Q64 158 70 142Z', a.main, 4) + path('M134 118 Q152 136 146 158 Q136 158 130 142Z', a.main, 4);
  s += path('M70 70 Q54 50 62 36 Q68 54 80 62Z', '#f4ecd8', 3.5) + mirror(path('M70 70 Q54 50 62 36 Q68 54 80 62Z', '#f4ecd8', 3.5));
  s += ell(100, 82, 34, 28, a.main) + ell(100, 98, 24, 14, a.main) + ell(92, 96, 2.5, 2, INK, 0) + ell(108, 96, 2.5, 2, INK, 0);
  /* the crown: the octagonal tower, with its merlons and a window */
  s += path('M84 60 L84 40 L116 40 L116 60 Q100 64 84 60Z', a.accent, 3.5) + line('M95 40 L95 61 M105 40 L105 61', '#a89e86', 2);
  [84, 94, 104].forEach(function (x) { s += path('M' + x + ' 40 L' + x + ' 32 L' + (x + 7) + ' 32 L' + (x + 7) + ' 40Z', a.accent, 3); });
  s += path('M97 58 L97 50 Q100 46 103 50 L103 58Z', INK, 0);
  return [s, { eyes: [[86, 80], [114, 80]], r: 10, mouth: [100, 104], w: 20, iris: '#e0b44c', lid: a.main, rune: [100, 164] }];
}
/* the gull of the storm: a round white chick with a little thundercloud on its head, a bolt sticking out of it, wing
   tips cut like lightning and the red neckerchief of the sailors */
function bird(sp: Species): [string, Face] {
  if (sp.stage === 2) return burrasco(sp);
  if (sp.stage === 3) return procellario(sp);
  var a = sp.art, s = '', feet = '#ff9f43';
  s += line('M88 170 L86 184 M112 170 L114 184', INK, 4) + path('M76 188 L86 182 L96 188Z', feet, 3) + path('M104 188 L114 182 L124 188Z', feet, 3);
  /* tail feathers cut like lightning, behind */
  s += path('M80 168 L66 176 L76 178 L62 188 L86 180 L80 176 L92 172Z', a.dark, 3);
  var wingL = 'M64 116 Q36 132 38 166 L48 156 L50 168 L58 152 L62 162 L70 140Z';
  s += path(wingL, a.dark, 4);
  s += ell(100, 140, 42, 40, a.main) + ell(100, 150, 27, 24, a.belly, 0);
  /* the right wing up, with a sandwich stolen on the lungomare */
  s += path('M136 124 Q164 112 168 84 L158 92 L160 80 L150 94 L148 84 L138 108Z', a.dark, 4);
  s += path('M150 74 Q166 62 182 74 L180 80 L152 80Z', '#e9b26a', 3) + path('M152 80 L180 80 L178 84 L154 84Z', '#7ccf5a', 2.4) + ell(160, 84, 4, 2, '#e8473a', 2) + path('M152 84 L180 84 Q166 94 152 84Z', '#e9b26a', 3);
  s += path('M72 112 Q100 126 128 112 L120 124 Q100 134 80 124Z', '#e8473a', 3.5) + path('M118 120 L136 134 L126 136 L120 126Z', '#e8473a', 3);
  /* the thundercloud on its head, with the bolt */
  s += cloud([[78, 60, 12], [94, 50, 15], [112, 52, 13], [126, 62, 10], [100, 64, 12]], '#8f9bb0', 3.5) + line('M84 56 q6 -4 12 0 M106 50 q6 -4 12 0', '#c8d0dc', 2.4) + bolt(104, 22, 28, a.accent, 2.6) + bolt(128, 48, 16, a.accent, 2);
  s += ell(100, 92, 38, 31, a.main);
  s += path('M86 102 Q100 95 114 102 L105 120 Q100 124 95 120Z', a.accent, 3.5) + ell(104, 112, 3, 3, '#e8473a', 0);
  return [s, { eyes: [[86, 90], [114, 90]], r: 10, mouth: null, w: 0, iris: '#7ab8e8', lid: a.main, rune: [100, 150] }];
}
/* the sailor of the squall: taller, wings open like a cloak with lightning in the feathers, a sailor's cap askew and
   the neckerchief flying in the wind */
function burrasco(sp: Species): [string, Face] {
  var a = sp.art, s = '', feet = '#ff9f43';
  s += line('M90 170 L88 186 M110 170 L112 186', INK, 4) + path('M78 189 L88 183 L98 189Z', feet, 3) + path('M102 189 L112 183 L122 189Z', feet, 3);
  var wingL = 'M72 104 Q40 90 18 100 Q24 126 20 152 L32 144 L34 158 L44 146 L48 160 L56 146 L62 156 L72 138Z';
  s += path(wingL, a.dark, 4) + line('M30 110 L44 118 L38 122 L54 132', '#2b3a66', 3) + mirror(path(wingL, a.dark, 4) + line('M30 110 L44 118 L38 122 L54 132', '#2b3a66', 3));
  s += ell(100, 136, 36, 44, a.main) + ell(100, 148, 22, 26, a.belly, 0);
  s += path('M74 106 Q100 120 126 106 L120 118 Q100 128 80 118Z', '#e8473a', 3.5) + path('M122 112 Q148 108 162 122 Q148 122 140 132 Q136 122 124 120Z', '#e8473a', 3);
  s += ell(100, 80, 32, 28, a.main);
  s += '<g transform="rotate(-10 100 62)">' + path('M72 64 Q100 38 128 64 Q100 56 72 64Z', '#ffffff', 3.5) + path('M72 64 Q100 56 128 64 L128 71 Q100 63 72 71Z', '#2b3a66', 3) + line('M122 70 L136 84 M126 69 L142 78', '#2b3a66', 3) + '</g>';
  s += path('M86 88 Q100 82 114 88 L106 108 Q100 113 94 108Z', a.accent, 3.5) + ell(103, 101, 2.8, 2.8, '#e8473a', 0);
  s += line('M150 48 q8 -8 16 -2 q-6 2 -6 8', '#ffffff', 3) + line('M30 56 q-8 -6 -16 0', '#ffffff', 3);
  return [s, { eyes: [[88, 78], [112, 78]], r: 8.5, mouth: null, w: 0, lid: a.main, rune: [100, 150] }];
}
/* the admiral of the storms: storm-blue wings spread like sails with lightning in them, a white chest and a navy
   coat with gold epaulettes, the bicorne with the crescent moon, a hooked beak, clouds at its feet */
function procellario(sp: Species): [string, Face] {
  var a = sp.art, s = '', gold = '#ffcf3f';
  var wingL = 'M74 104 Q30 66 2 80 Q8 110 6 142 L16 132 L18 148 L30 134 L34 152 L46 136 L50 154 L62 138 L66 152 L76 132Z';
  var inner = 'M72 112 Q42 94 22 100 Q26 118 24 134 L34 128 L38 140 L48 128 L52 142 L62 130 L72 132Z';
  var streak = 'M18 96 L34 106 L28 110 L46 120';
  s += path(wingL, a.main, 4) + path(inner, '#56688f', 0, ' opacity=".9"') + line(streak, gold, 3.2) + mirror(path(wingL, a.main, 4) + path(inner, '#56688f', 0, ' opacity=".9"') + line(streak, gold, 3.2));
  s += cloud([[62, 182, 10], [80, 186, 11], [120, 186, 11], [138, 182, 10]], '#c9d2de', 3.5);
  s += line('M90 168 L88 182 M110 168 L112 182', INK, 4);
  s += ell(100, 136, 36, 44, a.belly);
  s += path('M66 118 Q62 160 80 182 L90 176 Q76 150 80 116Z', a.main, 3.5) + mirror(path('M66 118 Q62 160 80 182 L90 176 Q76 150 80 116Z', a.main, 3.5));
  [132, 146, 160].forEach(function (y) { s += ell(84, y, 2.4, 2.4, gold, 1.5) + ell(116, y, 2.4, 2.4, gold, 1.5); });
  s += cloud([[70, 108, 8], [130, 108, 8]], gold, 3) + line('M64 114 l-2 8 M70 116 l0 8 M76 114 l2 8 M124 114 l-2 8 M130 116 l0 8 M136 114 l2 8', gold, 2.4);
  s += ell(100, 80, 30, 27, a.belly);
  s += path('M56 72 Q100 26 144 72 Q100 58 56 72Z', a.main, 4) + line('M60 70 Q100 56 140 70', gold, 3) + crescent(100, 50, 8, gold, 0, 2.5);
  s += path('M88 88 Q100 80 112 88 Q113 104 100 114 Q104 104 96 100 Q89 96 88 88Z', '#ffb43c', 3.5);
  return [s, { eyes: [[88, 82], [112, 82]], r: 8, mouth: null, w: 0, iris: gold, lid: a.belly, rune: [100, 152] }];
}
function cicada(sp: Species): [string, Face] {
  if (sp.stage === 2) return solleone(sp);
  var a = sp.art, s = '', wl = 56;
  [-1, 1].forEach(function (d) {
    s += path('M' + (100 + d * 14) + ' 112 Q' + (100 + d * (wl + 10)) + ' 104 ' + (100 + d * wl) + ' 170 Q' + (100 + d * 30) + ' 160 ' + (100 + d * 14) + ' 112Z', a.accent, 3.5, ' opacity=".85"');
    s += path('M' + (100 + d * 18) + ' 118 Q' + (100 + d * 44) + ' 128 ' + (100 + d * (wl - 6)) + ' 160 M' + (100 + d * 22) + ' 130 Q' + (100 + d * 36) + ' 150 ' + (100 + d * 40) + ' 162', 'none', 0, ' stroke="' + INK + '" stroke-width="1.6" opacity=".6"');
  });
  s += path('M78 168 l-8 12 M122 168 l8 12 M80 150 l-12 6 M120 150 l12 6', 'none', 4);
  s += ell(100, 136, 30, 44, a.main);
  [120, 138, 156].forEach(function (y) { s += path('M' + (76 + (y - 120) * 0.1) + ' ' + y + ' Q100 ' + (y + 7) + ' ' + (124 - (y - 120) * 0.1) + ' ' + y, 'none', 0, ' stroke="' + a.dark + '" stroke-width="3"'); });
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
  if (sp.stage === 2) return lunaspina(sp);
  var a = sp.art, s = '', n = 18, r0 = 42, r1 = 64;
  for (var k = 0; k < n; k++) {
    var t = k / n * Math.PI * 2, x0 = 100 + Math.cos(t) * r0, y0 = 134 + Math.sin(t) * r0 * 0.92, x1 = 100 + Math.cos(t) * r1, y1 = 134 + Math.sin(t) * r1 * 0.88;
    if (y1 > 186) continue;
    s += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" stroke="' + a.dark + '" stroke-width="3.5" stroke-linecap="round"/>';
  }
  s += ell(100, 134, 44, 40, a.main) + ell(86, 118, 14, 9, a.belly, 0, ' opacity=".6"');
  return [s, { eyes: [[86, 132], [114, 132]], r: 10, mouth: [100, 152], w: 16, lid: a.main, rune: [100, 110] }];
}
function crab(sp: Species): [string, Face] {
  if (sp.stage === 2) return tenaglione(sp);
  var a = sp.art, s = '', cr = 18;
  [-1, 1].forEach(function (d) {
    s += path('M' + (100 + d * 40) + ' 160 l' + (d * 22) + ' 14 M' + (100 + d * 44) + ' 150 l' + (d * 26) + ' 6 M' + (100 + d * 42) + ' 168 l' + (d * 14) + ' 16', 'none', 5);
    s += limb('M' + (100 + d * 44) + ' 132 Q' + (100 + d * 62) + ' 118 ' + (100 + d * 64) + ' 96', a.main, 10);
    var cx = 100 + d * 64, cy = 84;
    s += path('M' + (cx - cr * 0.8) + ' ' + (cy + 6) + ' Q' + (cx - cr) + ' ' + (cy - cr) + ' ' + cx + ' ' + (cy - cr) + ' Q' + (cx + cr) + ' ' + (cy - cr * 0.9) + ' ' + (cx + cr * 0.7) + ' ' + (cy + 2) + ' L' + cx + ' ' + (cy - 2) + 'Z', a.main, 4);
  });
  s += path('M86 108 L82 82 M114 108 L118 82', 'none', 5);
  s += ell(100, 144, 56, 34, a.main) + ell(100, 150, 36, 18, a.belly, 0, ' opacity=".8"');
  return [s, { eyes: [[82, 80], [118, 80]], r: 10, mouth: [100, 140], w: 18, lid: a.main, rune: [100, 160] }];
}
function owl(sp: Species): [string, Face] {
  if (sp.stage === 2) return sibilla(sp);
  var a = sp.art, s = '';
  s += path('M84 182 l-6 6 M84 182 l0 7 M84 182 l6 6 M116 182 l-6 6 M116 182 l0 7 M116 182 l6 6', 'none', 4);
  s += path('M56 116 Q40 150 60 176 Q72 160 74 134Z', a.dark, 4) + path('M144 116 Q160 150 140 176 Q128 160 126 134Z', a.dark, 4);
  var tuft = 14;
  s += path('M64 72 L58 ' + (54 - tuft) + ' L84 64Z', a.dark, 3.5) + path('M136 72 L142 ' + (54 - tuft) + ' L116 64Z', a.dark, 3.5);
  s += ell(100, 128, 48, 58, a.main) + ell(100, 146, 30, 34, a.belly, 0);
  [[90, 140], [110, 140], [100, 154], [90, 166], [110, 166]].forEach(function (v) { s += path('M' + (v[0] - 4) + ' ' + v[1] + ' l4 5 l4 -5', 'none', 0, ' stroke="' + a.dark + '" stroke-width="2.4"'); });
  s += ell(84, 104, 19, 18, a.belly, 0) + ell(116, 104, 19, 18, a.belly, 0);
  s += path('M94 116 L100 128 L106 116Z', '#e8a33c', 3);
  return [s, { eyes: [[84, 104], [116, 104]], r: 13, mouth: null, w: 0, iris: a.accent, lid: a.main, rune: [100, 158] }];
}
/* the cicada of the dog days: gold, with wings like rays of sun and the sun itself behind, singing in waves */
function solleone(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  for (var k = 0; k < 14; k++) {
    var t = k / 14 * Math.PI * 2, x0 = 100 + Math.cos(t) * 50, y0 = 112 + Math.sin(t) * 50, x1 = 100 + Math.cos(t + 0.11) * 86, y1 = 112 + Math.sin(t + 0.11) * 86, x2 = 100 + Math.cos(t - 0.11) * 86, y2 = 112 + Math.sin(t - 0.11) * 86;
    if (y1 > 176 && y2 > 176) continue;
    s += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + x2.toFixed(1) + ' ' + y2.toFixed(1) + 'Z" fill="#ffd166" opacity=".55"/>';
  }
  s += ell(100, 112, 54, 54, '#ffe08a', 0, ' opacity=".5"');
  [-1, 1].forEach(function (d) {
    s += path('M' + (100 + d * 14) + ' 112 Q' + (100 + d * 92) + ' 86 ' + (100 + d * 84) + ' 168 Q' + (100 + d * 34) + ' 160 ' + (100 + d * 14) + ' 112Z', a.accent, 3.5, ' opacity=".9"');
    [0.3, 0.55, 0.8].forEach(function (f) { s += line('M' + (100 + d * 18) + ' 118 L' + (100 + d * (28 + f * 60)) + ' ' + (118 + f * 44), '#e8a33c', 1.8, ' opacity=".8"'); });
  });
  s += path('M78 170 l-8 12 M122 170 l8 12 M80 152 l-12 6 M120 152 l12 6', 'none', 4);
  s += ell(100, 138, 30, 44, a.main);
  [122, 140, 158].forEach(function (y) { s += line('M' + (76 + (y - 122) * 0.1) + ' ' + y + ' Q100 ' + (y + 7) + ' ' + (124 - (y - 122) * 0.1) + ' ' + y, a.dark, 3); });
  s += ell(100, 84, 46, 25, a.main) + path('M74 66 L78 54 L84 64 M100 60 L100 46 M116 64 L122 54 L126 66', 'none', 3);
  s += line('M152 64 q12 12 0 24 M164 56 q18 20 0 40', '#e8a33c', 3) + mirror(line('M152 64 q12 12 0 24 M164 56 q18 20 0 40', '#e8a33c', 3));
  return [s, { eyes: [[74, 84], [126, 84]], r: 12, mouth: [100, 98], w: 14, iris: '#e8473a', lid: a.main, rune: [100, 120] }];
}
/* the urchin of the moon: deep blue, long spines with tips of moonlight, a crescent riding on top, stars inside, and
   two little hearts of the old days */
function lunaspina(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  for (var k = 0; k < 28; k++) {
    var t = k / 28 * Math.PI * 2, long = k % 2 === 0, r1 = long ? 82 : 62, x0 = 100 + Math.cos(t) * 40, y0 = 134 + Math.sin(t) * 37, x1 = 100 + Math.cos(t) * r1, y1 = 134 + Math.sin(t) * r1 * 0.88;
    if (y1 > 186) continue;
    s += '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + '" stroke="' + a.dark + '" stroke-width="3.5" stroke-linecap="round"/>';
    if (long) s += ell(+x1.toFixed(1), +y1.toFixed(1), 3.6, 3.6, a.accent, 1.6);
  }
  s += ell(100, 134, 46, 42, a.main) + ell(84, 116, 15, 9, a.belly, 0, ' opacity=".55"');
  [[74, 146], [126, 142], [112, 158], [86, 160], [132, 124]].forEach(function (p) { s += star4(p[0], p[1], 3.2, '#ffffff', 0); });
  s += crescent(100, 82, 14, a.accent, 0, 3) + heartP(46, 76, 6, '#ff8fc1', 2) + heartP(156, 70, 5, '#ff8fc1', 2);
  return [s, { eyes: [[86, 130], [114, 130]], r: 10, mouth: [100, 150], w: 16, lid: a.main, rune: [100, 108] }];
}
/* the crab of the giants' bronze: a shell like a Greek helmet with a red crest and a key pattern, eyes on stalks, one
   claw much bigger than the other */
function tenaglione(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  [-1, 1].forEach(function (d) { s += path('M' + (100 + d * 42) + ' 160 l' + (d * 24) + ' 16 M' + (100 + d * 46) + ' 150 l' + (d * 28) + ' 6 M' + (100 + d * 42) + ' 168 l' + (d * 14) + ' 18', 'none', 5); });
  /* the small claw, left */
  s += limb('M56 132 Q40 122 38 104', a.main, 10) + path('M24 104 Q22 82 38 80 Q52 82 50 98 L40 96Z', a.main, 4);
  /* the big claw, right */
  s += limb('M144 130 Q166 120 168 100', a.main, 14) + path('M150 96 Q146 54 178 52 Q200 56 196 86 L176 80Z', a.main, 4) + path('M156 100 Q172 112 194 96 L178 88Z', a.main, 4);
  s += line('M162 62 l6 6 M172 58 l4 7', a.accent, 2.4);
  s += line('M86 110 L82 88 M114 110 L118 88', INK, 5);
  s += path('M40 152 Q36 102 100 96 Q164 102 160 152 Q100 170 40 152Z', a.main, 4);
  s += line('M48 132 L56 132 L56 124 L64 124 L64 132 L72 132 L72 124 L80 124 L80 132 L88 132 L88 124 L96 124 L96 132 L104 132 L104 124 L112 124 L112 132 L120 132 L120 124 L128 124 L128 132 L136 132 L136 124 L144 124 L144 132 L152 132', a.accent, 2.6);
  s += path('M70 100 Q100 66 130 100 Q114 88 100 88 Q86 88 70 100Z', '#e8473a', 3.5) + line('M80 92 L84 82 M92 86 L94 76 M106 86 L106 76 M118 92 L116 82', '#b8342a', 2);
  s += ell(100, 154, 36, 12, a.belly, 0, ' opacity=".8"');
  return [s, { eyes: [[82, 82], [118, 82]], r: 10, mouth: [100, 142], w: 18, lid: a.main, rune: [100, 112] }];
}
/* the owl who reads the future: a hooded cloak full of stars, the face of an owl inside it, a crescent on the brow and
   a crystal ball in its wings */
function sibilla(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += path('M48 182 Q40 112 62 80 L66 56 L82 70 Q100 62 118 70 L134 56 L138 80 Q160 112 152 182 Q100 192 48 182Z', a.main, 4);
  [[60, 150], [70, 172], [140, 152], [132, 174], [56, 120], [146, 118], [84, 182], [118, 182]].forEach(function (p, k) { s += star4(p[0], p[1], k % 2 ? 3 : 4.2, k % 3 ? '#ffffff' : a.accent, 0); });
  s += ell(100, 106, 38, 34, a.belly) + path('M66 92 Q100 112 134 92', 'none', 0, ' stroke="' + a.dark + '" stroke-width="2" opacity=".35"');
  s += path('M94 116 L100 128 L106 116Z', '#e8a33c', 3) + crescent(100, 80, 8, a.accent, 0, 2.5);
  s += path('M66 150 Q56 172 80 180 Q86 166 84 150Z', a.dark, 3.5) + mirror(path('M66 150 Q56 172 80 180 Q86 166 84 150Z', a.dark, 3.5));
  s += ell(100, 160, 22, 22, '#bfe3ff', 0, ' opacity=".5"') + ell(100, 160, 16, 16, '#d8f0ff', 3.5) + ell(94, 154, 4, 3, '#ffffff', 0);
  return [s, { eyes: [[84, 102], [116, 102]], r: 13, mouth: null, w: 0, iris: a.accent, lid: a.belly, rune: [100, 160] }];
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
  /* with two types the aura goes from one colour to the other, and the motes are of both */
  var m = MAGIC[sp.type], c = m.col, c2 = sp.type2 ? MAGIC[sp.type2].col : c, st = sp.stage, r = 9 + st * 1.5, gid = 'au-' + sp.type + (sp.type2 || '');
  var back = '<defs><radialGradient id="' + gid + '"><stop offset="0" stop-color="' + c + '" stop-opacity=".7"/><stop offset=".6" stop-color="' + c2 + '" stop-opacity=".25"/><stop offset="1" stop-color="' + c2 + '" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse class="aura" cx="100" cy="122" rx="' + (70 + st * 8) + '" ry="' + (64 + st * 7) + '" fill="url(#' + gid + ')"/>';
  if (st >= 2) {
    back += '<ellipse cx="100" cy="184" rx="' + (60 + st * 6) + '" ry="' + (11 + st) + '" fill="none" stroke="' + c + '" stroke-width="2.5" stroke-dasharray="7 5" opacity=".85"/>';
    if (st === 3) back += '<ellipse cx="100" cy="184" rx="' + (52 + st * 6) + '" ry="' + (8 + st) + '" fill="none" stroke="' + c2 + '" stroke-width="1.6" opacity=".7"/>' +
      [-1, 1].map(function (d) { var t = d > 0 && sp.type2 ? sp.type2 : sp.type; return '<path d="' + glyph(t, 100 + d * 66, 184, 5) + '" fill="' + MAGIC[t].col + '" stroke="' + INK + '" stroke-width="1.4"/>'; }).join('');
  }
  var runeSvg = '<circle cx="' + rune[0] + '" cy="' + rune[1] + '" r="' + (r + 4) + '" fill="' + c + '" opacity=".35"/>' +
    '<path d="' + glyph(sp.type, rune[0], rune[1], r) + '" fill="' + c + '" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>' +
    '<circle cx="' + (rune[0] - r * 0.25) + '" cy="' + (rune[1] - r * 0.3) + '" r="' + (r * 0.18) + '" fill="#ffffff" opacity=".9"/>';
  var motes = [[28, 74], [172, 62], [158, 134], [40, 128], [100, 18], [20, 168]].slice(0, 2 + st).map(function (p, k) {
    var t = k % 2 ? sp.type : sp.type2 || 'Cervello', col = sp.type2 && !(k % 2) ? c2 : c;
    return '<path class="mg mg' + k + '" d="' + glyph(t, p[0], p[1], 5.5 + (k % 3)) + '" fill="' + col + '" stroke="' + INK + '" stroke-width="1.3" opacity=".9"/>';
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
