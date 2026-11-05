import { SPECIES, type SpeciesId, type Species, type Body } from '../../data/creatures';
import { isPersonType, type TypeName } from '../../data/types';
import { fit } from './type-shapes';

/* The creatures of Formia, drawn whole in one SVG each: no shared <defs>, so the same picture works in battle
   (expressions switch with data-expr, like the friends') and, as an image, on the map. Sticker style: flat colours
   with a dark outline, big eyes, a blush. Every form is drawn on its own, a new creature and not the old one bigger:
   the octopus with the inkwell, then the orator in a toga; the lizard of the moon, then armoured in marble, then the
   dragon of the walls with the octagonal tower for a crown; the gull of the storm, the sailor, the admiral. */

const INK = '#1c2340', BLUSH = '#ff8fa3';
const EXPRS = ['smirk', 'grin', 'pout', 'worried', 'sleepy', 'cool'];
interface Face {
  eyes: [number, number][]; r: number; mouth: [number, number] | null; w: number; iris?: string; lid: string; rune: [number, number];
  /** a legend's heavy brows, one tilt per eye (1: lower toward +x, −1: toward −x): no blush, a stern look */
  brows?: number[];
}

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
  var blush = f.brows ? '' : f.eyes.map(function (e, k) { return ell(e[0] + (k ? r * 0.9 : -r * 0.9), e[1] + r * 1.25, r * 0.55, r * 0.32, BLUSH, 0, ' opacity=".55"'); }).join('');
  if (f.brows && x !== 'grin' && x !== 'sleepy') blush = f.eyes.map(function (e, k) {
    var d = f.brows![k] || 1, x0 = e[0] - d * r * 1.3, x1 = e[0] + d * r * 1.2, y0 = e[1] - r * (x === 'worried' ? 1.1 : 1.7), y1 = e[1] - r * (x === 'worried' ? 1.7 : 0.85);
    return '<path d="M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' L' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' L' + (x1 - d * r * 0.2).toFixed(1) + ' ' + (y1 - r * 0.6).toFixed(1) + ' L' + x0.toFixed(1) + ' ' + (y0 - r * 0.5).toFixed(1) + 'Z" fill="' + INK + '"/>';
  }).join('');
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
  return f.brows ? s + blush : blush + s;
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
function giant(sp: Species): [string, Face] {
  /* the king of the giants, titanic: a boulder held over his head with both arms (the ones he threw at Ulysses'
     ships), a body of polygonal stone like the walls of Castellone, the magic glowing in the cracks, the crown */
  var a = sp.art, s = '', LAVA = '#ffb03a', MOSS = '#6f9a54';
  /* the arms, up; the boulder over the head, with its cracks of fire; the hands gripping it */
  s += limb('M54 92 Q36 66 56 36', a.main, 22) + limb('M146 92 Q164 66 144 36', a.main, 22);
  s += poly([52, 34, 62, 10, 92, 0, 122, 2, 146, 14, 152, 36, 138, 54, 104, 60, 66, 56], '#8c8270', 4);
  s += poly([64, 12, 92, 3, 120, 5, 106, 22, 78, 24], '#b3a891', 0) + line('M84 16 L98 32 L90 50 M98 32 L122 40 L134 30', LAVA, 3.2);
  s += cloud([[62, 48, 6], [74, 54, 5], [140, 46, 5]], MOSS, 2);
  s += ell(54, 34, 13, 12, a.dark) + ell(146, 34, 13, 12, a.dark) + line('M48 28 L58 26 M142 26 L152 28', INK, 2.4);
  /* the legs like two towers, the feet cracking the ground */
  s += path('M66 150 L60 188 L94 188 L94 150Z', a.dark, 4) + path('M106 150 L106 188 L140 188 L134 150Z', a.dark, 4);
  s += line('M44 192 L58 186 L66 194 M136 194 L146 186 L160 192', LAVA, 3);
  /* the body of the giants' walls: big polygonal blocks, fire between them */
  s += path('M40 86 L160 86 L144 160 L56 160Z', a.main, 4);
  [[50, 92, 80, 90, 84, 112, 54, 116], [84, 90, 116, 90, 112, 110, 88, 112], [120, 90, 150, 92, 146, 116, 116, 112], [58, 120, 90, 116, 94, 138, 62, 142],
   [98, 116, 142, 120, 138, 142, 100, 140], [66, 146, 98, 144, 100, 158, 68, 158], [104, 146, 136, 146, 132, 158, 106, 158]].forEach(function (q) {
    s += path('M' + q[0] + ' ' + q[1] + ' L' + q[2] + ' ' + q[3] + ' L' + q[4] + ' ' + q[5] + ' L' + q[6] + ' ' + q[7] + 'Z', a.belly, 2.4, ' opacity=".92"');
  });
  s += line('M84 112 L86 116 L94 116 M112 110 L116 114 L98 116 M94 138 L98 142 L100 140', LAVA, 2.6);
  /* the shoulders of stone, as big as boulders */
  s += poly([30, 84, 44, 70, 66, 74, 70, 96, 50, 104, 32, 98], a.dark, 4) + poly([170, 84, 156, 70, 134, 74, 130, 96, 150, 104, 168, 98], a.dark, 4);
  s += line('M40 84 L52 88 L58 80 M160 84 L148 88 L142 80', LAVA, 2.4);
  /* the head, the beard of ivy, the crown */
  s += path('M78 60 Q78 44 100 42 Q122 44 122 60 L120 88 Q100 98 80 88Z', a.main, 4);
  s += path('M80 84 Q84 110 100 116 Q116 110 120 84 Q110 94 100 94 Q90 94 80 84Z', MOSS, 3.5);
  s += path('M78 50 L84 30 L92 42 L100 26 L108 42 L116 30 L122 50Z', a.accent, 3.5) + ell(100, 38, 4, 4, '#e8473a', 2) + ell(87, 42, 3, 3, '#3f7ccf', 1.8) + ell(113, 42, 3, 3, '#3f7ccf', 1.8);
  /* pebbles that float round him, lifted by his magic */
  s += poly([18, 120, 26, 114, 30, 124, 22, 128], '#9a8f7c', 2.5) + poly([176, 128, 184, 120, 190, 130, 180, 134], '#9a8f7c', 2.5) + poly([24, 160, 30, 156, 34, 164, 26, 166], '#9a8f7c', 2);
  return [s, { eyes: [[90, 70], [110, 70]], r: 6.5, mouth: null, w: 14, iris: LAVA, lid: a.main, rune: [100, 128], brows: [1, -1] }];
}
/* ---------- the creatures found later: the sea, the night, the hills, the town, and two more legends ---------- */
/* the jellyfish of the summer currents: a bell like a lantern, tentacles in two colours */
function jelly(sp: Species): [string, Face] {
  if (sp.stage === 2) return medusaurora(sp);
  var a = sp.art, s = '';
  [[62, 0], [80, 1], [100, 0], [120, 1], [138, 0]].forEach(function (t, k) {
    var x = t[0], w = k % 2 ? -10 : 10;
    s += limb('M' + x + ' 122 Q' + (x + w) + ' 142 ' + x + ' 160 Q' + (x - w) + ' 172 ' + (x + w * 0.4) + ' 184', t[1] ? a.accent : a.dark, 5);
  });
  s += path('M48 124 Q46 62 100 58 Q154 62 152 124 Q140 132 128 124 Q114 132 100 124 Q86 132 72 124 Q60 132 48 124Z', a.main, 4);
  s += ell(78, 84, 16, 10, a.belly, 0, ' opacity=".75"') + ell(128, 100, 5, 5, a.belly, 0, ' opacity=".7"') + ell(66, 106, 4, 4, a.belly, 0, ' opacity=".7"');
  return [s, { eyes: [[84, 100], [116, 100]], r: 9.5, mouth: [100, 114], w: 12, lid: a.main, rune: [100, 74] }];
}
/* its last form: a taller bell with a frilled rim, and long ribbons of light like the lights of the north */
function medusaurora(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  [[56, a.accent, 26], [84, '#ffb3e6', 34], [116, a.belly, 30], [144, a.accent, 22]].forEach(function (r, k) {
    var x = r[0] as number, c = r[1] as string, w = r[2] as number, d = k % 2 ? -1 : 1;
    s += path('M' + (x - 7) + ' 112 Q' + (x + d * w) + ' 140 ' + (x - 6) + ' 162 Q' + (x - d * w * 0.6) + ' 176 ' + (x + 2) + ' 188 L' + (x + 10) + ' 186 Q' + (x - d * w * 0.4) + ' 172 ' + (x + 8) + ' 160 Q' + (x + d * w + 10) + ' 138 ' + (x + 7) + ' 112Z', c, 3, ' opacity=".9"');
  });
  s += path('M40 116 Q36 44 100 40 Q164 44 160 116 Q150 128 138 118 Q126 130 114 118 Q100 130 86 118 Q74 130 62 118 Q50 128 40 116Z', a.main, 4);
  s += path('M52 110 Q100 128 148 110', 'none', 0, ' stroke="' + a.belly + '" stroke-width="4" opacity=".7"');
  s += ell(74, 70, 18, 11, a.belly, 0, ' opacity=".75"');
  s += star4(100, 26, 7, a.accent) + star4(76, 32, 4.5, '#ffffff') + star4(124, 32, 4.5, '#ffffff');
  return [s, { eyes: [[84, 90], [116, 90]], r: 11, mouth: [100, 106], w: 14, lid: a.main, rune: [100, 60] }];
}
/* a five-pointed star of the rock pools, with dots along its arms */
function starPts(cx: number, cy: number, R: number, r: number): number[] {
  var pts: number[] = [];
  for (var k = 0; k < 10; k++) { var t = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? r : R; pts.push(+(cx + Math.cos(t) * q).toFixed(1), +(cy + Math.sin(t) * q).toFixed(1)); }
  return pts;
}
function star(sp: Species): [string, Face] {
  if (sp.stage === 2) return astromarina(sp);
  var a = sp.art, s = '';
  s += poly(starPts(100, 126, 64, 30), a.main, 4, ' stroke-linejoin="round"');
  for (var k = 0; k < 5; k++) {
    var t = -Math.PI / 2 + k * Math.PI * 2 / 5;
    [0.62, 0.8].forEach(function (f) { s += ell(+(100 + Math.cos(t) * 64 * f).toFixed(1), +(126 + Math.sin(t) * 64 * f).toFixed(1), 3.4, 3.4, a.belly, 0); });
  }
  s += star4(150, 70, 6, a.accent);
  return [s, { eyes: [[88, 122], [112, 122]], r: 8.5, mouth: [100, 138], w: 12, lid: a.main, rune: [100, 84] }];
}
/* its last form: a star of the night sky, standing, the constellations drawn on it and a halo of small stars */
function astromarina(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += ell(100, 112, 70, 66, a.dark, 0, ' opacity=".35"');
  [[40, 64], [158, 58], [30, 120], [170, 118], [62, 34], [140, 30]].forEach(function (p, k) { s += star4(p[0], p[1], k % 2 ? 4 : 5.5, k % 3 ? '#ffffff' : a.accent); });
  s += poly(starPts(100, 118, 76, 34), a.main, 4, ' stroke-linejoin="round"');
  s += line('M100 58 L112 92 L148 104 M112 92 L124 140 M88 92 L52 104 M88 92 L76 140', a.accent, 1.8, ' opacity=".9"');
  [[100, 58], [148, 104], [52, 104], [124, 140], [76, 140], [112, 92], [88, 92]].forEach(function (p) { s += star4(p[0], p[1], 4, a.accent, 1.2); });
  return [s, { eyes: [[88, 114], [112, 114]], r: 9, mouth: [100, 130], w: 13, iris: a.accent, lid: a.main, rune: [100, 78] }];
}
/* the moray of the rock dens: the head out of a hole in the rocks, the mouth always a little open */
function eel(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += cloud([[56, 172, 26], [100, 178, 30], [146, 172, 24], [78, 158, 20], [124, 160, 20]], '#8f95a3') + ell(104, 156, 24, 12, '#2a2f3a', 3);
  s += limb('M104 156 Q76 124 100 100 Q120 82 112 70', a.main, 28);
  s += path('M118 96 Q140 86 132 70 Q146 78 138 98Z', a.dark, 3) + path('M92 140 Q76 128 80 112 Q70 128 80 142Z', a.dark, 3);
  [[96, 128], [104, 108], [88, 116], [110, 92], [98, 146]].forEach(function (p) { s += ell(p[0], p[1], 3.5, 2.6, a.belly, 0); });
  s += path('M84 66 Q86 40 112 38 Q140 40 142 62 Q142 84 120 88 Q96 90 84 66Z', a.main, 4);
  s += path('M88 74 Q112 92 138 76 Q132 90 112 92 Q94 90 88 74Z', a.belly, 3);
  s += path('M98 82 l3 6 l3 -6 M112 86 l3 6 l3 -6 M124 82 l3 6 l3 -5', '#ffffff', 1.6);
  s += line('M96 46 L110 52 M134 44 L122 50', INK, 3.5);
  return [s, { eyes: [[104, 58], [126, 56]], r: 7.5, mouth: [114, 74], w: 16, iris: a.belly, lid: a.main, rune: [100, 120] }];
}
/* the dolphin of the gulf: out of a wave, the tail up behind, a curious face */
function dolphinBody(a: Species['art'], big: boolean): string {
  var s = '', k = big ? 1.08 : 1;
  s += path('M138 112 Q164 86 160 58 Q176 66 180 54 Q178 80 164 90 Q170 104 146 122Z', a.main, 4);
  s += path('M' + (52 / k) + ' 160 Q44 100 98 ' + (90 / k) + ' Q150 86 152 130 Q152 162 120 170 Q86 178 52 160Z', a.main, 4);
  s += path('M104 94 Q112 66 130 62 Q122 82 124 96Z', a.dark, 3.5);
  s += ell(98, 148, 36, 18, a.belly, 0);
  s += path('M60 128 Q34 130 30 142 Q48 150 70 142Z', a.main, 4) + path('M38 142 Q50 146 66 140', 'none', 0, ' stroke="' + INK + '" stroke-width="2.5" stroke-linecap="round"');
  s += path('M72 156 Q58 172 70 178 Q80 168 86 160Z', a.dark, 3) + path('M126 158 Q142 172 132 180 Q122 170 116 162Z', a.dark, 3);
  s += path('M24 180 Q46 168 68 180 Q90 192 112 180 Q134 168 156 180 Q170 188 182 180 L182 192 L24 192Z', '#8fd0f6', 3);
  return s;
}
function dolphin(sp: Species): [string, Face] {
  if (sp.stage === 2) return delfaro(sp);
  var a = sp.art;
  return [dolphinBody(a, false), { eyes: [[80, 114], [106, 110]], r: 8, mouth: [56, 140], w: 14, lid: a.main, rune: [118, 132] }];
}
/* its last form: the light of the lighthouse on its head, in red and white bands, the beams round it */
function delfaro(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += path('M92 44 L58 20 M108 44 L142 20 M100 40 L100 10', 'none', 0, ' stroke="' + a.accent + '" stroke-width="7" stroke-linecap="round" opacity=".55"');
  s += dolphinBody(a, true);
  s += path('M84 92 L88 66 L112 66 L116 92Z', '#ffffff', 3.5) + path('M85 84 L115 84 L113 74 L87 74Z', '#e8473a', 0);
  s += path('M86 66 L114 66 L112 52 L88 52Z', a.accent, 3.5) + path('M84 52 L116 52 L100 40Z', '#e8473a', 3.5);
  s += line('M80 106 Q98 114 120 104', '#e8473a', 4);
  return [s, { eyes: [[80, 116], [108, 112]], r: 8.5, mouth: [56, 140], w: 15, lid: a.main, rune: [122, 134] }];
}
/* the mullet of the harbour: wide eyes, mouth open, flapping; it does nothing at all */
function fish(sp: Species): [string, Face] {
  if (sp.stage === 2) return cefaldrago(sp);
  var a = sp.art, s = '';
  s += path('M146 132 L182 104 L176 132 L182 160Z', a.main, 4);
  s += path('M84 102 Q104 84 126 102Z', a.dark, 3.5) + path('M96 160 Q110 176 124 160Z', a.dark, 3.5);
  s += ell(98, 132, 58, 34, a.main) + path('M44 140 Q98 172 154 138 Q140 160 98 164 Q58 162 44 140Z', a.belly, 0);
  [[110, 120], [126, 126], [118, 136], [134, 116]].forEach(function (p) { s += path('M' + (p[0] - 5) + ' ' + p[1] + ' Q' + p[0] + ' ' + (p[1] - 6) + ' ' + (p[0] + 5) + ' ' + p[1], 'none', 0, ' stroke="' + a.dark + '" stroke-width="2.2" opacity=".7"'); });
  s += path('M40 128 Q24 132 28 146 Q38 148 48 142', 'none', 0, ' stroke="' + INK + '" stroke-width="3.5" stroke-linecap="round"');
  s += path('M108 186 Q112 176 120 178 Q114 168 104 176', 'none', 0, ' stroke="#8fd0f6" stroke-width="3" stroke-linecap="round"') + ell(150, 182, 4, 3, '#8fd0f6', 2);
  return [s, { eyes: [[62, 120], [84, 116]], r: 10, mouth: [44, 138], w: 12, lid: a.main, rune: [112, 140] }];
}
/* its last form: the dragon of the gulf, coiled, a frill along the neck, horns and long whiskers */
function cefaldrago(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += limb('M30 182 Q22 140 64 136 Q112 134 116 168 Q120 188 160 178', a.main, 26);
  s += limb('M30 182 Q22 140 64 136 Q112 134 116 168 Q120 188 160 178', a.belly, 8);
  s += path('M150 170 L182 150 L178 176 L188 192 L160 184Z', a.dark, 3.5);
  s += limb('M128 172 Q166 134 132 96', a.main, 30);
  s += path('M150 160 L170 148 L162 136 L178 126 L166 116 L174 104 L156 100Z', a.accent, 3.5);
  s += path('M90 62 Q98 34 128 36 Q156 40 158 70 Q156 96 128 100 Q98 100 90 82Z', a.main, 4);
  s += path('M84 82 Q110 108 146 92 Q136 112 110 112 Q88 108 84 82Z', a.belly, 3.5) + path('M96 94 l4 7 l4 -7 M112 100 l4 7 l4 -6 M128 98 l3 7 l4 -7', '#ffffff', 1.8);
  s += path('M112 40 Q102 14 84 10 Q100 24 102 44Z', a.accent, 3.5) + path('M140 44 Q150 18 170 16 Q156 30 150 50Z', a.accent, 3.5);
  s += line('M90 86 Q64 92 52 120 M92 92 Q76 108 78 128', a.dark, 3);
  s += line('M100 52 L114 58 M150 54 L136 58', INK, 4);
  return [s, { eyes: [[110, 66], [134, 66]], r: 8, mouth: [116, 92], w: 18, iris: a.accent, lid: a.main, rune: [72, 150] }];
}
/* the firefly: a little dark body, wings like glass, and the light behind that it turns on for its friends */
function firefly(sp: Species): [string, Face] {
  if (sp.stage === 2) return lanternella(sp);
  var a = sp.art, s = '';
  s += ell(100, 150, 46, 44, a.accent, 0, ' opacity=".45"');
  s += ell(70, 116, 30, 14, '#eaf4ff', 3, ' opacity=".8" transform="rotate(-30 70 116)"') + ell(130, 116, 30, 14, '#eaf4ff', 3, ' opacity=".8" transform="rotate(30 130 116)"');
  s += path('M84 176 l-8 10 M100 180 l0 10 M116 176 l8 10', 'none', 4);
  s += ell(100, 150, 30, 32, a.belly) + line('M74 146 Q100 154 126 146 M76 160 Q100 168 124 160', a.dark, 2, ' opacity=".5"');
  s += ell(100, 112, 24, 14, a.main) + ell(100, 94, 24, 22, a.main);
  s += line('M90 74 Q82 54 70 50 M110 74 Q118 54 130 50', INK, 3) + ell(70, 50, 5, 5, a.accent, 2.5) + ell(130, 50, 5, 5, a.accent, 2.5);
  return [s, { eyes: [[91, 92], [109, 92]], r: 7.5, mouth: [100, 104], w: 9, lid: a.main, rune: [100, 152] }];
}
/* its last form: the light is a paper lantern now, ribbed and capped, with a little flame inside */
function lanternella(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += ell(100, 146, 62, 56, a.accent, 0, ' opacity=".4"');
  s += ell(62, 98, 36, 16, '#eaf4ff', 3, ' opacity=".8" transform="rotate(-35 62 98)"') + ell(138, 98, 36, 16, '#eaf4ff', 3, ' opacity=".8" transform="rotate(35 138 98)"');
  s += path('M72 118 L128 118 L124 110 L76 110Z', a.dark, 3) + path('M76 178 L124 178 L120 186 L80 186Z', a.dark, 3);
  s += ell(100, 148, 34, 32, a.belly);
  s += line('M84 120 Q76 148 84 176 M100 118 L100 178 M116 120 Q124 148 116 176', a.dark, 2, ' opacity=".55"');
  s += path('M100 136 Q92 150 100 160 Q108 150 100 136Z', '#fff6a8', 2);
  s += ell(100, 78, 28, 26, a.main);
  s += line('M88 56 Q80 36 66 32 M112 56 Q120 36 134 32', INK, 3) + ell(66, 32, 5.5, 5.5, a.accent, 2.5) + ell(134, 32, 5.5, 5.5, a.accent, 2.5);
  [[40, 150], [160, 140], [54, 180], [150, 176]].forEach(function (p) { s += star4(p[0], p[1], 4, '#fff6a8'); });
  return [s, { eyes: [[88, 76], [112, 76]], r: 9, mouth: [100, 90], w: 11, lid: a.main, rune: [100, 168] }];
}
/* the bat of the caves: big ears, scalloped wings, two little fangs */
function batWing(c: string): string { return path('M70 112 Q42 84 14 102 Q24 118 18 136 Q34 126 42 142 Q50 128 64 140Z', c, 4); }
function bat(sp: Species): [string, Face] {
  if (sp.stage === 2) return pipistrega(sp);
  var a = sp.art, s = '';
  s += batWing(a.dark) + mirror(batWing(a.dark));
  s += path('M74 98 L62 56 L94 86Z', a.main, 4) + path('M126 98 L138 56 L106 86Z', a.main, 4) + path('M76 90 L68 66 L88 84Z', a.belly, 0) + path('M124 90 L132 66 L112 84Z', a.belly, 0);
  s += path('M88 160 l-4 16 M112 160 l4 16', 'none', 4);
  s += ell(100, 126, 36, 38, a.main) + ell(100, 140, 22, 20, a.belly, 0);
  s += path('M93 134 l3 6 l3 -6Z M101 134 l3 6 l3 -6Z', '#ffffff', 1.6);
  return [s, { eyes: [[88, 116], [112, 116]], r: 9, mouth: [100, 130], w: 12, lid: a.main, rune: [100, 152] }];
}
/* its last form: the witch of the caves, with a pointed hat, a cloak of wings and the moon behind */
function pipistrega(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += crescent(150, 60, 22, '#fff2b3', -30, 3);
  s += path('M66 110 Q30 72 4 96 Q18 116 8 140 Q28 128 34 150 Q46 132 58 148 Q62 130 70 134Z', a.dark, 4) + mirror(path('M66 110 Q30 72 4 96 Q18 116 8 140 Q28 128 34 150 Q46 132 58 148 Q62 130 70 134Z', a.dark, 4));
  s += path('M86 164 l-4 18 M114 164 l4 18', 'none', 4);
  s += ell(100, 130, 40, 42, a.main) + ell(100, 146, 24, 22, a.belly, 0);
  s += path('M93 140 l3 7 l3 -7Z M101 140 l3 7 l3 -7Z', '#ffffff', 1.6);
  s += path('M58 96 Q100 108 142 96 Q138 86 100 84 Q62 86 58 96Z', a.dark, 3.5);
  s += path('M74 90 L104 14 Q112 10 114 20 L124 90Z', a.dark, 3.5) + path('M76 84 L124 84 L122 76 L78 76Z', a.accent, 0);
  return [s, { eyes: [[87, 118], [113, 118]], r: 9.5, mouth: [100, 134], w: 12, iris: a.accent, lid: a.main, rune: [100, 160] }];
}
/* the young boar: striped like all wild piglets, the snout in the ground */
function boar(sp: Species): [string, Face] {
  if (sp.stage === 2) return zannaferro(sp);
  var a = sp.art, s = '';
  s += path('M74 168 l-2 18 M90 172 l0 16 M110 172 l0 16 M126 168 l2 18', 'none', 7) + path('M74 168 l-2 18 M90 172 l0 16 M110 172 l0 16 M126 168 l2 18', 'none', 0, ' stroke="' + a.dark + '" stroke-width="4" stroke-linecap="round"');
  s += ell(100, 146, 48, 34, a.main);
  [76, 92, 108, 124].forEach(function (x) { s += path('M' + x + ' 118 Q' + (x + 4) + ' 146 ' + x + ' 174', 'none', 0, ' stroke="' + a.belly + '" stroke-width="5" stroke-linecap="round" opacity=".8"'); });
  s += path('M70 86 L62 62 L86 78Z', a.dark, 3.5) + path('M130 86 L138 62 L114 78Z', a.dark, 3.5);
  s += ell(100, 102, 36, 30, a.main);
  s += ell(100, 118, 16, 11, a.belly, 3.5) + ell(94, 118, 2.6, 3.6, INK, 0) + ell(106, 118, 2.6, 3.6, INK, 0);
  s += path('M84 124 Q80 116 78 112 M116 124 Q120 116 122 112', 'none', 0, ' stroke="#ffffff" stroke-width="3" stroke-linecap="round"');
  return [s, { eyes: [[86, 96], [114, 96]], r: 8, mouth: [100, 131], w: 10, lid: a.main, rune: [100, 158] }];
}
/* its last form: the boar who leads the woods, with a bristling crest and iron tusks */
function zannaferro(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += path('M66 170 l-4 18 M88 176 l0 14 M112 176 l0 14 M134 170 l4 18', 'none', 9);
  s += poly([44, 120, 52, 92, 62, 106, 70, 78, 82, 98, 92, 70, 102, 94, 114, 72, 122, 98, 136, 82, 140, 108, 156, 100, 156, 130], a.dark, 3.5);
  s += ell(100, 144, 58, 40, a.main);
  s += path('M64 84 L54 56 L84 74Z', a.dark, 3.5) + path('M136 84 L146 56 L116 74Z', a.dark, 3.5);
  s += ell(100, 104, 40, 32, a.main);
  s += path('M78 126 Q60 120 58 96 Q68 112 84 116Z', a.accent, 3.5) + path('M122 126 Q140 120 142 96 Q132 112 116 116Z', a.accent, 3.5);
  s += ell(100, 120, 18, 12, a.belly, 3.5) + ell(93, 120, 3, 4, INK, 0) + ell(107, 120, 3, 4, INK, 0);
  s += line('M70 82 L80 90 M130 82 L120 90', INK, 4) + line('M112 84 l10 -10 M116 88 l8 -6', '#e8d2b8', 2.2);
  return [s, { eyes: [[84, 96], [116, 96]], r: 8, mouth: [100, 134], w: 12, iris: '#ff6b4a', lid: a.main, rune: [100, 160] }];
}
/* the falcon of the cliffs: a dark hood with the "moustache", a hooked beak, a barred chest */
function falconHead(a: Species['art'], y: number, k: number): string {
  var s = ell(100, y, 30 * k, 27 * k, a.main);
  s += path('M' + (100 - 30 * k) + ' ' + (y - 2) + ' Q100 ' + (y - 34 * k) + ' ' + (100 + 30 * k) + ' ' + (y - 2) + ' Q' + (100 + 20 * k) + ' ' + (y - 14 * k) + ' 100 ' + (y - 14 * k) + ' Q' + (100 - 20 * k) + ' ' + (y - 14 * k) + ' ' + (100 - 30 * k) + ' ' + (y - 2) + 'Z', a.dark, 0);
  s += path('M84 ' + (y + 6) + ' Q80 ' + (y + 18) + ' 86 ' + (y + 22) + ' Q90 ' + (y + 14) + ' 88 ' + (y + 6) + 'Z', a.dark, 0) + path('M116 ' + (y + 6) + ' Q120 ' + (y + 18) + ' 114 ' + (y + 22) + ' Q110 ' + (y + 14) + ' 112 ' + (y + 6) + 'Z', a.dark, 0);
  s += path('M92 ' + (y + 10) + ' Q100 ' + (y + 4) + ' 108 ' + (y + 10) + ' Q104 ' + (y + 22) + ' 100 ' + (y + 26) + ' Q98 ' + (y + 18) + ' 92 ' + (y + 10) + 'Z', '#f2c94c', 3);
  return s;
}
function falcon(sp: Species): [string, Face] {
  if (sp.stage === 2) return pellegrino(sp);
  var a = sp.art, s = '';
  s += path('M88 176 l-6 10 M88 176 l0 11 M88 176 l6 10 M112 176 l-6 10 M112 176 l0 11 M112 176 l6 10', 'none', 0, ' stroke="#e8a33c" stroke-width="4" stroke-linecap="round"');
  s += path('M64 118 Q50 150 68 178 Q80 158 80 132Z', a.dark, 4) + path('M136 118 Q150 150 132 178 Q120 158 120 132Z', a.dark, 4);
  s += ell(100, 140, 36, 40, a.main) + ell(100, 150, 24, 28, a.belly, 0);
  [[92, 140], [108, 140], [100, 152], [92, 164], [108, 164]].forEach(function (p) { s += line('M' + (p[0] - 4) + ' ' + p[1] + ' l8 0', a.dark, 2.4); });
  s += falconHead(a, 94, 1);
  return [s, { eyes: [[88, 92], [112, 92]], r: 8.5, mouth: null, w: 0, lid: a.main, rune: [100, 176] }];
}
/* its last form: the peregrine in its dive, wings swept back and the wind round it */
function pellegrino(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += line('M20 60 L50 70 M14 90 L44 96 M156 66 L186 56 M160 94 L190 88', '#ffffff', 3, ' opacity=".8"');
  var wing = path('M76 110 Q44 70 6 66 Q20 82 18 92 Q30 92 32 102 Q44 100 46 112 Q58 108 60 122 Q70 120 78 132Z', a.dark, 4) + line('M18 92 Q40 96 60 116 M32 102 Q50 106 66 124', a.main, 2.4);
  s += wing + mirror(wing);
  s += path('M92 168 L100 190 L108 168Z', a.dark, 3.5);
  s += ell(100, 136, 34, 42, a.main) + ell(100, 146, 22, 30, a.belly, 0);
  [[92, 136], [108, 136], [100, 148], [92, 160], [108, 160]].forEach(function (p) { s += line('M' + (p[0] - 4) + ' ' + p[1] + ' l8 0', a.dark, 2.4); });
  s += falconHead(a, 88, 1.08);
  return [s, { eyes: [[87, 86], [113, 86]], r: 9, mouth: null, w: 0, iris: a.accent, lid: a.main, rune: [100, 170] }];
}
/* the broom of the hills: a green bud with leafy arms and a crown of yellow flowers */
function flowerCrown(cx: number, cy: number, w: number, a: Species['art'], n: number): string {
  var list: number[][] = [];
  for (var k = 0; k < n; k++) { var t = Math.PI * (1.05 + 0.9 * k / (n - 1)); list.push([+(cx + Math.cos(t) * w).toFixed(1), +(cy + Math.sin(t) * w * 0.7).toFixed(1), 11 + (k % 2) * 3]); }
  list.push([cx, cy - w * 0.25, 14]);
  var s = cloud(list, a.accent, 3);
  list.forEach(function (b) { s += ell(b[0], b[1] + 2, 3, 2.4, '#e88a1a', 0); });
  return s;
}
function flower(sp: Species): [string, Face] {
  if (sp.stage === 2) return ginestrona(sp);
  var a = sp.art, s = '';
  s += path('M86 176 Q80 186 70 186 M100 178 L100 190 M114 176 Q120 186 130 186', 'none', 0, ' stroke="' + a.dark + '" stroke-width="5" stroke-linecap="round"');
  s += path('M66 138 Q40 130 34 110 Q56 112 70 128Z', a.dark, 3.5) + path('M134 138 Q160 130 166 110 Q144 112 130 128Z', a.dark, 3.5);
  s += ell(100, 144, 34, 36, a.main) + ell(100, 154, 20, 20, a.belly, 0, ' opacity=".7"');
  s += flowerCrown(100, 104, 34, a, 6);
  return [s, { eyes: [[88, 136], [112, 136]], r: 8.5, mouth: [100, 152], w: 12, lid: a.main, rune: [100, 172] }];
}
/* its last form: a bush in flower, a sea of yellow, with two bees busy about it */
function ginestrona(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += path('M78 180 Q70 190 56 190 M100 182 L100 192 M122 180 Q130 190 144 190', 'none', 0, ' stroke="' + a.dark + '" stroke-width="6" stroke-linecap="round"');
  s += path('M62 140 Q30 136 20 110 Q48 110 66 128Z', a.dark, 3.5) + path('M138 140 Q170 136 180 110 Q152 110 134 128Z', a.dark, 3.5);
  s += ell(100, 146, 42, 40, a.main) + ell(100, 158, 26, 22, a.belly, 0, ' opacity=".7"');
  s += flowerCrown(100, 104, 50, a, 8) + flowerCrown(100, 82, 26, a, 4);
  [[34, 70], [168, 84]].forEach(function (b) { s += ell(b[0], b[1], 9, 7, '#ffd23c', 2.5) + line('M' + (b[0] - 3) + ' ' + (b[1] - 6) + ' l0 12 M' + (b[0] + 3) + ' ' + (b[1] - 6) + ' l0 12', INK, 2) + ell(b[0], b[1] - 9, 6, 4, '#ffffff', 2, ' opacity=".85"'); });
  return [s, { eyes: [[86, 138], [114, 138]], r: 9.5, mouth: [100, 156], w: 13, lid: a.main, rune: [100, 176] }];
}
/* the snail of the dry-stone walls: the shell with its spiral, the eyes up on their stalks */
function snailFoot(a: Species['art'], k: number): string {
  return path('M30 186 Q28 150 52 ' + (142 - 6 * k) + ' Q70 ' + (136 - 6 * k) + ' 76 152 L156 176 Q170 186 150 190 L36 190Z', a.main, 4) + path('M40 182 L150 182', 'none', 0, ' stroke="' + a.belly + '" stroke-width="5" stroke-linecap="round" opacity=".7"');
}
function snail(sp: Species): [string, Face] {
  if (sp.stage === 2) return torrelumaca(sp);
  var a = sp.art, s = '';
  s += line('M52 140 L44 104 M64 138 L68 100', INK, 4);
  s += snailFoot(a, 0);
  s += ell(114, 132, 42, 40, a.belly) + path('M114 132 m-30 0 a30 28 0 1 1 30 28 a22 20 0 1 1 -18 -26 a13 12 0 1 1 14 10', 'none', 0, ' stroke="' + a.accent + '" stroke-width="4" stroke-linecap="round"');
  return [s, { eyes: [[44, 100], [68, 96]], r: 8, mouth: [52, 160], w: 10, lid: a.main, rune: [118, 128] }];
}
/* its last form: the shell is a round stone tower with battlements, like the Angevin tower of Mola */
function torrelumaca(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += line('M48 136 L38 96 M62 132 L66 92', INK, 4);
  s += snailFoot(a, 1);
  s += path('M80 168 L80 74 Q116 66 152 74 L152 168 Q116 176 80 168Z', a.belly, 4);
  [80, 96, 112, 128, 144].forEach(function (x) { s += path('M' + x + ' 74 L' + x + ' 60 L' + (x + 9) + ' 60 L' + (x + 9) + ' 72Z', a.belly, 3); });
  s += line('M80 98 Q116 92 152 98 M80 124 Q116 118 152 124 M80 148 Q116 142 152 148', a.dark, 2, ' opacity=".55"');
  s += path('M106 112 L106 100 Q112 92 118 100 L118 112Z', INK, 0) + path('M128 140 L128 130 Q133 124 138 130 L138 140Z', INK, 0) + path('M92 140 L92 130 Q97 124 102 130 L102 140Z', INK, 0);
  s += line('M148 60 L148 38', INK, 3) + path('M148 38 L166 44 L148 50Z', '#e8473a', 2.5);
  return [s, { eyes: [[38, 92], [66, 88]], r: 8.5, mouth: [50, 156], w: 11, lid: a.main, rune: [116, 158] }];
}
/* the cat of the old town: sitting up, tail round its feet, ears up */
function catHead(a: Species['art'], y: number, k: number): string {
  var s = path('M' + (100 - 36 * k) + ' ' + (y - 6) + ' L' + (100 - 40 * k) + ' ' + (y - 46 * k) + ' L' + (100 - 10 * k) + ' ' + (y - 26 * k) + 'Z', a.main, 4) + path('M' + (100 + 36 * k) + ' ' + (y - 6) + ' L' + (100 + 40 * k) + ' ' + (y - 46 * k) + ' L' + (100 + 10 * k) + ' ' + (y - 26 * k) + 'Z', a.main, 4);
  s += path('M' + (100 - 32 * k) + ' ' + (y - 12) + ' L' + (100 - 34 * k) + ' ' + (y - 36 * k) + ' L' + (100 - 16 * k) + ' ' + (y - 24 * k) + 'Z', '#ffb3c1', 0) + path('M' + (100 + 32 * k) + ' ' + (y - 12) + ' L' + (100 + 34 * k) + ' ' + (y - 36 * k) + ' L' + (100 + 16 * k) + ' ' + (y - 24 * k) + 'Z', '#ffb3c1', 0);
  s += ell(100, y, 40 * k, 34 * k, a.main);
  s += line('M92 ' + (y - 30 * k) + ' l2 10 M100 ' + (y - 33 * k) + ' l0 11 M108 ' + (y - 30 * k) + ' l-2 10', a.dark, 3);
  s += ell(100, y + 14 * k, 6, 4, '#ff8fa3', 2.5);
  s += line('M84 ' + (y + 14 * k) + ' l-26 -4 M84 ' + (y + 19 * k) + ' l-26 4 M116 ' + (y + 14 * k) + ' l26 -4 M116 ' + (y + 19 * k) + ' l26 4', INK, 2);
  return s;
}
function cat(sp: Species): [string, Face] {
  if (sp.stage === 2) return gattomola(sp);
  var a = sp.art, s = '';
  s += limb('M130 176 Q170 176 164 140 Q160 120 172 108', a.main, 12) + line('M160 150 l8 -2 M166 132 l8 2', a.dark, 3);
  s += ell(100, 150, 38, 34, a.main) + ell(100, 156, 22, 24, a.belly, 0);
  s += ell(84, 182, 12, 7, a.belly, 3.5) + ell(116, 182, 12, 7, a.belly, 3.5);
  s += catHead(a, 106, 1);
  return [s, { eyes: [[86, 104], [114, 104]], r: 9.5, mouth: [100, 126], w: 10, iris: a.accent, lid: a.main, rune: [100, 158] }];
}
/* its last form: the king of the cats of Mola, a fisherman's cap and a fish he will never pay for */
function gattomola(sp: Species): [string, Face] {
  var a = sp.art, s = '';
  s += limb('M136 178 Q182 176 174 136 Q168 112 182 98', a.main, 15) + line('M168 152 l9 -2 M174 128 l9 3', a.dark, 3.5);
  s += ell(100, 150, 46, 38, a.main) + ell(100, 158, 28, 26, a.belly, 0);
  [[72, 140], [128, 140], [70, 160], [130, 160]].forEach(function (p) { s += line('M' + p[0] + ' ' + (p[1] - 8) + ' Q' + (p[0] + (p[0] < 100 ? 6 : -6)) + ' ' + p[1] + ' ' + p[0] + ' ' + (p[1] + 8), a.dark, 3.5); });
  s += ell(82, 184, 13, 7, a.belly, 3.5) + ell(118, 184, 13, 7, a.belly, 3.5);
  s += catHead(a, 100, 1.08);
  s += path('M62 70 Q66 44 100 42 Q134 44 138 70 Q100 62 62 70Z', a.accent, 3.5) + path('M60 72 Q100 60 140 72 L140 80 Q100 70 60 80Z', a.accent, 3.5) + ell(100, 42, 6, 5, '#e8473a', 2.5);
  s += path('M126 124 Q150 114 166 124 Q150 134 126 124Z', '#a9b4bf', 3) + path('M166 124 L178 116 L176 132Z', '#a9b4bf', 3) + ell(134, 122, 2, 2, INK, 0);
  return [s, { eyes: [[86, 98], [114, 98]], r: 10, mouth: [100, 122], w: 12, iris: '#ffd166', lid: a.main, rune: [100, 164] }];
}
function janus(sp: Species): [string, Face] {
  /* the lord of thresholds, a titan of the ages: behind him the wheel of the hours, half gold (the day) and half silver
     (the night); his wings are the two doors of a temple, open; he stands on four legs like columns, with the door of
     light on his chest; two heads on two necks, one of gold that looks to the dawn and the past, with the sun for a
     crest, one of silver that looks to the night and the future, with the moon */
  var a = sp.art, s = '', SIL = a.accent, SILD = '#6f7ea8', GLOW = '#fff6c8';
  /* the wheel of the hours */
  s += '<circle cx="100" cy="84" r="80" fill="none" stroke="' + INK + '" stroke-width="15"/>' +
    '<path d="M100 4A80 80 0 0 0 100 164" fill="none" stroke="' + a.main + '" stroke-width="9"/><path d="M100 4A80 80 0 0 1 100 164" fill="none" stroke="' + SIL + '" stroke-width="9"/>';
  for (var k = 0; k < 12; k++) {
    var t = k / 12 * Math.PI * 2, cx = 100 + Math.sin(t) * 80, cy = 84 - Math.cos(t) * 80;
    s += k % 3 ? ell(Math.round(cx), Math.round(cy), 3.5, 3.5, k < 6 ? SIL : a.main, 2) : star4(Math.round(cx), Math.round(cy), 8, GLOW, 2);
  }
  /* the doors, open like wings: studded panels, gold on the side of the day, silver on the side of the night */
  var door = function (main: string, dark: string) {
    return poly([62, 104, 14, 50, 8, 138, 56, 146], main, 4) + line('M38 76 L34 142 M60 104 L10 92', dark, 3) +
      [[26, 74], [48, 92], [22, 112], [44, 120], [20, 130], [42, 136]].map(function (q) { return ell(q[0], q[1], 2.8, 2.8, dark, 1.5); }).join('') +
      ell(52, 118, 4, 4, GLOW, 2);
  };
  s += door(a.main, a.dark) + mirror(door(SIL, SILD));
  /* the four legs, columns with their capitals and claws */
  var leg = function (x: number, main: string, dark: string) {
    return path('M' + x + ' 142 L' + (x + 4) + ' 182 L' + (x + 22) + ' 182 L' + (x + 26) + ' 142Z', main, 4) + line('M' + (x + 9) + ' 148 L' + (x + 10) + ' 180 M' + (x + 17) + ' 148 L' + (x + 16) + ' 180', dark, 2) +
      path('M' + (x - 4) + ' 182 L' + (x + 30) + ' 182 L' + (x + 30) + ' 190 L' + (x - 4) + ' 190Z', dark, 3.5) +
      poly([x - 2, 190, x + 2, 196, x + 6, 190], '#ffffff', 1.8) + poly([x + 11, 190, x + 13, 197, x + 17, 190], '#ffffff', 1.8) + poly([x + 22, 190, x + 26, 196, x + 30, 190], '#ffffff', 1.8);
  };
  s += leg(48, a.dark, INK) + leg(126, SILD, INK) + leg(64, a.main, a.dark) + leg(110, SIL, SILD);
  /* the body, half and half, with plates; the door of light on the chest */
  s += ell(100, 124, 52, 32, a.main) + '<path d="M100 92A52 32 0 0 1 100 156Z" fill="' + SIL + '"/>' + ell(100, 124, 52, 32, 'none');
  s += line('M60 112 Q70 104 82 106 M60 132 Q72 140 84 138 M140 112 Q130 104 118 106 M140 132 Q128 140 116 138', INK, 2.4, ' opacity=".5"');
  s += path('M86 150 L86 122 Q100 102 114 122 L114 150Z', GLOW, 4) + line('M100 112 L100 150', '#f2c94c', 2.5) + path('M90 150 L90 124 Q100 110 110 124 L110 150', 'none', 0, ' stroke="#ffd84d" stroke-width="2" opacity=".8"');
  /* one neck and one head; the other is the same, mirrored, in silver */
  var head = function (main: string, dark: string, crest: string) {
    return limb('M80 106 Q58 100 56 72', main, 22) + crest +
      path('M72 62 Q70 38 48 38 Q30 40 16 52 L4 62 L16 70 Q30 82 50 80 Q70 78 72 62Z', main, 4) +
      line('M8 64 L30 70 L46 68', INK, 2.6) + poly([14, 64, 17, 70, 20, 65], '#ffffff', 1.6) + poly([24, 67, 27, 73, 30, 68], '#ffffff', 1.6) +
      ell(12, 56, 2, 2, INK, 0) + path('M40 42 Q52 36 64 46', 'none', 0, ' stroke="' + dark + '" stroke-width="3" stroke-linecap="round"');
  };
  var sun = '';
  for (var q = 0; q < 6; q++) { var u = (-160 + q * 26) * Math.PI / 180; sun += poly([56 + Math.cos(u - 0.16) * 20, 42 + Math.sin(u - 0.16) * 20, 56 + Math.cos(u) * 38, 42 + Math.sin(u) * 38, 56 + Math.cos(u + 0.16) * 20, 42 + Math.sin(u + 0.16) * 20].map(function (v) { return Math.round(v); }), '#ffd84d', 2.5); }
  sun += ell(56, 42, 16, 16, '#ffd84d', 3);
  var moon = crescent(58, 30, 20, '#e8f0ff', -30, 3) + star4(80, 18, 5, '#ffffff') + star4(36, 20, 4, '#ffffff');
  s += head(a.main, a.dark, sun) + mirror(head(SIL, SILD, moon));
  return [s, { eyes: [[44, 56], [156, 56]], r: 6, mouth: null, w: 12, iris: '#ff9a3c', lid: a.main, rune: [100, 134], brows: [-1, 1] }];
}
function flame(sp: Species): [string, Face] {
  /* the dragon of Sant'Elmo: a long body of blue fire coiled in the storm, wings like the sails of a ship with the
     fire on the yards, a mane of flame, horns, fangs and lightning all round */
  var a = sp.art, s = '', HOT = '#9fe0ff';
  var tongue = function (x: number, y: number, h: number, rot: number, col: string) {
    return path('M' + x + ' ' + y + ' q' + (-h * 0.35) + ' ' + (-h * 0.45) + ' 0 ' + (-h) + ' q' + (h * 0.35) + ' ' + (h * 0.55) + ' 0 ' + h + 'Z', col, 2.4, ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"');
  };
  /* the storm behind, and its lightning */
  s += cloud([[30, 22, 16], [52, 14, 14], [150, 14, 14], [172, 24, 16]], '#4a4f7a', 3);
  s += bolt(24, 30, 40, a.accent) + bolt(170, 34, 36, a.accent);
  /* the wings: two lateen sails with their ribs, fire running along the edges and on the tips of the yards */
  var sail = function () {
    return path('M78 84 L10 18 Q2 70 22 128 Q44 96 78 100Z', '#eaf4ff', 4) + line('M78 86 L10 18', '#8a6a3c', 5) +
      line('M70 90 Q40 70 18 48 M72 96 Q40 92 16 92 M74 100 Q48 110 22 126', a.dark, 2.2, ' opacity=".55"') +
      tongue(10, 20, 22, -30, a.main) + tongue(10, 20, 14, -30, HOT) + tongue(22, 128, 18, -150, a.main) + tongue(4, 74, 14, -90, a.main);
  };
  s += sail() + mirror(sail());
  /* the body: a coil of blue fire down to a tail that ends in a bolt */
  var d = 'M100 96 C148 100 172 128 148 150 C122 172 58 146 46 168 C38 182 64 192 96 186 C130 180 158 186 176 176';
  s += limb(d, a.main, 30) + line(d, a.belly, 10, ' stroke-dasharray="11 7" opacity=".9"');
  [[150, 104, 30], [170, 134, 70], [132, 166, 160], [78, 152, 200], [44, 178, 230], [120, 182, 175]].forEach(function (f) { s += tongue(f[0], f[1], 18, f[2], HOT); });
  s += bolt(176, 160, 34, a.accent);
  /* the mane of flame all round the head */
  for (var m = 0; m < 9; m++) { var u = (-170 + m * 20) * Math.PI / 180, mx = Math.round(100 + Math.cos(u) * 30), my = Math.round(58 + Math.sin(u) * 30); s += tongue(mx, my, 30, Math.round(u * 180 / Math.PI) + 90, m % 2 ? a.dark : a.main); }
  [-150, -90, -30].forEach(function (r) { var u = r * Math.PI / 180; s += tongue(Math.round(100 + Math.cos(u) * 30), Math.round(58 + Math.sin(u) * 30), 18, r + 90, HOT); });
  /* the horns, swept back, burning at the tips */
  s += path('M80 40 Q60 24 52 4 Q72 12 90 32Z', a.belly, 3.5) + path('M120 40 Q140 24 148 4 Q128 12 110 32Z', a.belly, 3.5);
  s += tongue(52, 6, 14, -20, HOT) + tongue(148, 6, 14, 20, HOT);
  /* the head: a dragon's, front on, with brow ridges, a long muzzle, nostrils smoking sparks, the fangs */
  s += path('M68 56 L76 34 Q100 22 124 34 L132 56 Q130 72 120 80 L114 98 Q100 106 86 98 L80 80 Q70 72 68 56Z', a.main, 4);
  s += path('M72 48 L92 52 M128 48 L108 52', 'none', 0, ' stroke="' + a.dark + '" stroke-width="3.5" stroke-linecap="round"');
  s += path('M84 78 Q100 70 116 78 L112 96 Q100 102 88 96Z', a.belly, 3.5) + ell(94, 82, 2.2, 3, INK, 0) + ell(106, 82, 2.2, 3, INK, 0);
  s += line('M88 94 Q100 99 112 94', INK, 3) + poly([89, 94, 92, 102, 95, 95], '#ffffff', 1.8) + poly([105, 95, 108, 102, 111, 94], '#ffffff', 1.8);
  s += star4(112, 70, 3, '#ffffff') + star4(88, 70, 3, '#ffffff');
  s += star4(36, 150, 6, '#ffffff') + star4(164, 92, 5, '#ffffff') + star4(26, 98, 5, a.accent);
  return [s, { eyes: [[86, 60], [114, 60]], r: 6.5, mouth: null, w: 12, iris: a.accent, lid: a.main, rune: [100, 124], brows: [1, -1] }];
}
const BODIES: Record<Body, (sp: Species) => [string, Face]> = { octo: octo, lizard: lizard, bird: bird, cicada: cicada, olive: olive, urchin: urchin, crab: crab, owl: owl, giant: giant,
  jelly: jelly, star: star, eel: eel, dolphin: dolphin, fish: fish, firefly: firefly, bat: bat, boar: boar, falcon: falcon, flower: flower, snail: snail, cat: cat, janus: janus, flame: flame };

/* ---------- magic: each type has its own, the creatures carry it ----------
   An aura behind them, a rune on the forehead or the chest, motes of light in the air; from the second form a magic
   circle under the feet, doubled in the third. Calma is the moon, Caos the lightning, Cervello the star, Chiacchiera
   the song, Cuore the heart; the creatures' own types are the wave (Corrente), the flame (Calore), the feather
   (Cielo), the stone (Corazza) and the setting sun (Crepuscolo). */
export const MAGIC: Record<TypeName, { col: string; name: string }> = {
  Calma: { col: '#8fd0f6', name: 'luna' }, Caos: { col: '#ffa04a', name: 'fulmine' }, Cervello: { col: '#c3a0ff', name: 'stella' },
  Chiacchiera: { col: '#ffd84d', name: 'canto' }, Cuore: { col: '#ff8fc1', name: 'cuore' },
  Corrente: { col: '#4fd8c8', name: 'onda' }, Calore: { col: '#ff6a4a', name: 'fiamma' }, Cielo: { col: '#b0f08a', name: 'piuma' },
  Corazza: { col: '#d9ad7c', name: 'pietra' }, Crepuscolo: { col: '#8f8cf0', name: 'tramonto' }
};
function glyph(t: TypeName, x: number, y: number, r: number): string {
  if (!isPersonType(t)) return fit(t, x, y, r * 1.1);
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
/** behind a legend: a burst of rays in the colours of its two types, turning slowly (sprites.css, .lrays) */
function legendRays(c: string, c2: string): string {
  var d1 = '', d2 = '';
  for (var k = 0; k < 16; k++) {
    var t = k / 16 * Math.PI * 2, w = 0.09, seg = 'M100 100 L' + (100 + Math.cos(t - w) * 110).toFixed(1) + ' ' + (100 + Math.sin(t - w) * 110).toFixed(1) + ' L' + (100 + Math.cos(t + w) * 110).toFixed(1) + ' ' + (100 + Math.sin(t + w) * 110).toFixed(1) + 'Z ';
    if (k % 2) d2 += seg; else d1 += seg;
  }
  return '<g class="lrays" opacity=".42"><path d="' + d1 + '" fill="' + c + '"/><path d="' + d2 + '" fill="' + c2 + '"/></g>';
}
function magic(sp: Species, rune: [number, number]): { back: string; rune: string; front: string } {
  /* with two types the aura goes from one colour to the other, and the motes are of both */
  var m = MAGIC[sp.type], c = m.col, c2 = sp.type2 ? MAGIC[sp.type2].col : c, st = sp.stage, r = 9 + st * 1.5, gid = 'au-' + sp.type + (sp.type2 || '');
  var back = (sp.legend ? legendRays(c, c2) : '') + '<defs><radialGradient id="' + gid + '"><stop offset="0" stop-color="' + c + '" stop-opacity=".7"/><stop offset=".6" stop-color="' + c2 + '" stop-opacity=".25"/><stop offset="1" stop-color="' + c2 + '" stop-opacity="0"/></radialGradient></defs>' +
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
  return '<svg xmlns="http://www.w3.org/2000/svg" class="spr spr-c spr-' + id + (sp.legend ? ' spr-legend' : '') + ' ' + (cls || '') + '" viewBox="' + (vb || '0 0 200 200') + '" data-expr="' + (expr || 'smirk') + '" role="img" aria-label="' + sp.name + '">' +
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
  '.spr-legend .lrays{animation:lrays 24s linear infinite;transform-origin:100px 100px}@keyframes lrays{to{transform:rotate(360deg)}}' +
  '@media (prefers-reduced-motion:reduce){.spr-c .mg,.spr-c .aura,.spr-legend .lrays{animation:none}}';
