/* The backgrounds of the story's battles: Formia drawn, one scene for each part of town, over the whole screen.
   Same sticker style as the creatures and the map: flat colours with a dark outline. Each scene is a landscape with
   a horizon about halfway down and a ground in front (sand, grass, stone, a court, a wooden floor) whose colour
   also makes the platforms the fighters stand on. At night a dark veil comes down, and on top of it the moon, the
   stars and the lights of the scene (windows, lamps, the lighthouse). One SVG, 1600 × 1000, sliced to fill. */

const INK = '#1c2340';
const W = 1600, H = 1000;
type Pt = [number, number];
/** a scene: what is drawn by day, what lights up at night, the colour of its ground */
interface Scene { title: string; ground: string; base: string; lights: string; indoor?: boolean }

/* ---------- small things ---------- */
function stroke(w: number) { return w ? ' stroke="' + INK + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round"' : ''; }
function path(d: string, fill: string, w = 4, extra = '') { return '<path d="' + d + '" fill="' + fill + '"' + stroke(w) + extra + '/>'; }
function rect(x: number, y: number, w: number, h: number, fill: string, sw = 4, rx = 0, extra = '') {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + fill + '"' + stroke(sw) + extra + '/>';
}
function ell(cx: number, cy: number, rx: number, ry: number, fill: string, sw = 4, extra = '') {
  return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + stroke(sw) + extra + '/>';
}
function line(x1: number, y1: number, x2: number, y2: number, col: string, w: number) {
  return '<path d="M' + x1 + ' ' + y1 + 'L' + x2 + ' ' + y2 + '" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" fill="none"/>';
}
/** a closed shape through points, down to the bottom edge (hills, ground) */
function land(pts: Pt[], fill: string, w = 4, bottom = H + 10) {
  return path('M' + pts[0][0] + ' ' + bottom + ' L' + pts.map(function (p) { return p[0] + ' ' + p[1]; }).join(' L') + ' L' + pts[pts.length - 1][0] + ' ' + bottom + 'Z', fill, w);
}
/** a smooth ridge through points (quadratic curves through the midpoints) */
function ridge(pts: Pt[], fill: string, w = 4) {
  var d = 'M' + pts[0][0] + ' ' + (H + 10) + ' L' + pts[0][0] + ' ' + pts[0][1];
  for (var i = 1; i < pts.length - 1; i++) { var mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; d += ' Q' + pts[i][0] + ' ' + pts[i][1] + ' ' + mx + ' ' + my; }
  var e = pts[pts.length - 1];
  return path(d + ' L' + e[0] + ' ' + e[1] + ' L' + e[0] + ' ' + (H + 10) + 'Z', fill, w);
}
/** a pseudo-random number from a seed, for scattering things the same way every time */
function rnd(k: number) { var x = Math.sin(k * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }

/* ---------- sky, sea, sun and moon ---------- */
function sky(top: string, bottom: string) {
  return '<defs><linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + top + '"/><stop offset="1" stop-color="' + bottom + '"/></linearGradient></defs>' +
    '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="url(#sc-sky)"/>';
}
function cloud(x: number, y: number, s: number) {
  return path('M' + x + ' ' + y + ' q' + (-10 * s) + ' ' + (-34 * s) + ' ' + (26 * s) + ' ' + (-38 * s) + ' q' + (14 * s) + ' ' + (-30 * s) + ' ' + (52 * s) + ' ' + (-18 * s) + ' q' + (34 * s) + ' ' + (-14 * s) + ' ' + (48 * s) + ' ' + (18 * s) + ' q' + (34 * s) + ' ' + (4 * s) + ' ' + (20 * s) + ' ' + (38 * s) + 'Z', '#ffffff', 4);
}
/** the scene being drawn is at night: no sun */
var NIGHT = false;
function sun(x: number, y: number) { if (NIGHT) return ''; return ell(x, y, 62, 62, '#fff3b0', 4) + ell(x, y, 84, 84, '#fff3b0', 0, ' opacity=".35"'); }
function sea(y0: number, y1: number, seed: number) {
  var s = rect(-10, y0, W + 20, y1 - y0 + 10, '#4aa8d0', 4);
  for (var k = 0; k < 16; k++) {
    var x = rnd(seed + k) * W, y = y0 + 18 + rnd(seed + k + 40) * (y1 - y0 - 30), l = 26 + rnd(seed + k + 80) * 40;
    s += path('M' + x + ' ' + y + ' q' + l / 4 + ' -8 ' + l / 2 + ' 0 q' + l / 4 + ' 8 ' + l / 2 + ' 0', 'none', 0, ' stroke="#bfe8f7" stroke-width="4" stroke-linecap="round"');
  }
  return s;
}
/** the night: a veil over the day, the moon and the stars on top */
function night(seed: number, indoor?: boolean) {
  if (indoor) return '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#2a1d3a" opacity=".18"/>';
  var s = '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#0b1533" opacity=".58"/>';
  for (var k = 0; k < 46; k++) {
    var x = rnd(seed + k * 3) * W, y = rnd(seed + k * 3 + 1) * 380, r = 1.6 + rnd(seed + k * 3 + 2) * 2.6;
    s += ell(x, y, r, r, '#fff6d8', 0, ' opacity="' + (0.5 + rnd(k) * 0.5).toFixed(2) + '"');
  }
  return s + ell(1240, 150, 58, 58, '#fff6d8', 4) + ell(1262, 136, 48, 48, '#0b1533', 0, ' opacity=".55"') + ell(1240, 150, 92, 92, '#fff6d8', 0, ' opacity=".12"');
}
/** a lit window, a lamp's glow */
function glowWin(x: number, y: number, w: number, h: number) { return rect(x, y, w, h, '#ffd36b', 3, 3) + rect(x - 6, y - 6, w + 12, h + 12, '#ffd36b', 0, 6, ' opacity=".25"'); }
function halo(x: number, y: number, r: number) { return ell(x, y, r, r, '#ffd36b', 0, ' opacity=".22"') + ell(x, y, r * 0.45, r * 0.45, '#ffe9a8', 0, ' opacity=".5"'); }

/* ---------- trees and people's things ---------- */
function palm(x: number, y: number, s: number) {
  var top = y - 260 * s, d = 'M' + x + ' ' + y + ' Q' + (x - 24 * s) + ' ' + (y - 140 * s) + ' ' + (x + 10 * s) + ' ' + top;
  var out = '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + 26 * s + '" stroke-linecap="round"/><path d="' + d + '" fill="none" stroke="#b07a45" stroke-width="' + 16 * s + '" stroke-linecap="round"/>';
  [-150, -105, -60, -20, 20, 60].forEach(function (a) {
    var r = a * Math.PI / 180, ex = x + 10 * s + Math.cos(r) * 130 * s, ey = top + Math.sin(r) * 60 * s + 40 * s;
    out += path('M' + (x + 10 * s) + ' ' + top + ' Q' + ((x + 10 * s + ex) / 2) + ' ' + (top - 50 * s) + ' ' + ex + ' ' + ey + ' Q' + ((x + 10 * s + ex) / 2) + ' ' + (top - 10 * s) + ' ' + (x + 10 * s) + ' ' + top + 'Z', '#5fae58', 4);
  });
  return out;
}
/** an umbrella pine: a tall bare trunk and a wide flat crown */
function pine(x: number, y: number, s: number, top?: number) {
  var ty = top != null ? top : y - 330 * s;
  return path('M' + (x - 14 * s) + ' ' + y + ' Q' + (x - 4 * s) + ' ' + ((y + ty) / 2) + ' ' + (x - 16 * s) + ' ' + (ty + 30) + ' L' + (x + 16 * s) + ' ' + (ty + 30) + ' Q' + (x + 8 * s) + ' ' + ((y + ty) / 2) + ' ' + (x + 14 * s) + ' ' + y + 'Z', '#9a6a3f', 4) +
    path('M' + (x - 190 * s) + ' ' + (ty + 40) + ' Q' + (x - 210 * s) + ' ' + (ty - 10) + ' ' + (x - 120 * s) + ' ' + (ty - 30) + ' Q' + (x - 60 * s) + ' ' + (ty - 80) + ' ' + x + ' ' + (ty - 60) + ' Q' + (x + 80 * s) + ' ' + (ty - 90) + ' ' + (x + 140 * s) + ' ' + (ty - 36) + ' Q' + (x + 220 * s) + ' ' + (ty - 20) + ' ' + (x + 196 * s) + ' ' + (ty + 40) + ' Q' + x + ' ' + (ty + 70) + ' ' + (x - 190 * s) + ' ' + (ty + 40) + 'Z', '#3f7f46', 4) +
    path('M' + (x - 120 * s) + ' ' + (ty + 10) + ' Q' + (x - 40 * s) + ' ' + (ty - 30) + ' ' + (x + 60 * s) + ' ' + (ty - 20), 'none', 0, ' stroke="#5fa35a" stroke-width="' + 10 * s + '" stroke-linecap="round"');
}
function cypress(x: number, y: number, s: number) {
  return path('M' + x + ' ' + (y - 300 * s) + ' Q' + (x + 46 * s) + ' ' + (y - 160 * s) + ' ' + (x + 34 * s) + ' ' + (y - 10 * s) + ' L' + (x - 34 * s) + ' ' + (y - 10 * s) + ' Q' + (x - 46 * s) + ' ' + (y - 160 * s) + ' ' + x + ' ' + (y - 300 * s) + 'Z', '#2f6b45', 4) +
    rect(x - 8 * s, y - 14 * s, 16 * s, 18 * s, '#7a5232', 3);
}
function olive(x: number, y: number, s: number) {
  return path('M' + (x - 10 * s) + ' ' + y + ' Q' + (x - 22 * s) + ' ' + (y - 50 * s) + ' ' + (x - 4 * s) + ' ' + (y - 80 * s) + ' L' + (x + 10 * s) + ' ' + (y - 80 * s) + ' Q' + (x + 4 * s) + ' ' + (y - 40 * s) + ' ' + (x + 14 * s) + ' ' + y + 'Z', '#8a6a45', 4) +
    ell(x - 40 * s, y - 100 * s, 60 * s, 40 * s, '#9fb58a', 4) + ell(x + 40 * s, y - 108 * s, 56 * s, 38 * s, '#9fb58a', 4) + ell(x, y - 132 * s, 58 * s, 40 * s, '#b2c69e', 4);
}
function tuft(x: number, y: number, s: number, col?: string) {
  return path('M' + (x - 22 * s) + ' ' + y + ' Q' + (x - 20 * s) + ' ' + (y - 26 * s) + ' ' + (x - 30 * s) + ' ' + (y - 44 * s) + ' Q' + (x - 8 * s) + ' ' + (y - 26 * s) + ' ' + x + ' ' + (y - 56 * s) +
    ' Q' + (x + 8 * s) + ' ' + (y - 26 * s) + ' ' + (x + 30 * s) + ' ' + (y - 44 * s) + ' Q' + (x + 20 * s) + ' ' + (y - 24 * s) + ' ' + (x + 22 * s) + ' ' + y + 'Z', col || '#4f9a4a', 3.5);
}
function umbrella(x: number, y: number, col: string) {
  return line(x, y - 150, x + 6, y + 40, INK, 8) + line(x, y - 150, x + 6, y + 40, '#f4f1ea', 4) +
    path('M' + (x - 110) + ' ' + (y - 120) + ' Q' + x + ' ' + (y - 220) + ' ' + (x + 110) + ' ' + (y - 120) + ' Q' + (x + 55) + ' ' + (y - 136) + ' ' + x + ' ' + (y - 120) + ' Q' + (x - 55) + ' ' + (y - 136) + ' ' + (x - 110) + ' ' + (y - 120) + 'Z', col, 4) +
    path('M' + (x - 40) + ' ' + (y - 126) + ' Q' + (x - 20) + ' ' + (y - 190) + ' ' + x + ' ' + (y - 196) + ' Q' + (x + 20) + ' ' + (y - 190) + ' ' + (x + 40) + ' ' + (y - 126) + ' Q' + x + ' ' + (y - 132) + ' ' + (x - 40) + ' ' + (y - 126) + 'Z', '#ffffff', 3);
}
function sail(x: number, y: number, col: string, s: number) {
  return path('M' + x + ' ' + (y - 110 * s) + ' L' + (x + 60 * s) + ' ' + (y - 10 * s) + ' L' + (x - 6 * s) + ' ' + (y - 6 * s) + 'Z', col, 3.5) + path('M' + (x - 30 * s) + ' ' + y + ' L' + (x + 60 * s) + ' ' + y, 'none', 0, ' stroke="' + INK + '" stroke-width="' + 6 * s + '" stroke-linecap="round"');
}
function boat(x: number, y: number, col: string, s: number) {
  return path('M' + (x - 80 * s) + ' ' + (y - 30 * s) + ' L' + (x + 80 * s) + ' ' + (y - 30 * s) + ' Q' + (x + 70 * s) + ' ' + y + ' ' + (x + 40 * s) + ' ' + (y + 6 * s) + ' L' + (x - 50 * s) + ' ' + (y + 6 * s) + ' Q' + (x - 72 * s) + ' ' + y + ' ' + (x - 80 * s) + ' ' + (y - 30 * s) + 'Z', col, 4) +
    path('M' + (x - 78 * s) + ' ' + (y - 18 * s) + ' L' + (x + 76 * s) + ' ' + (y - 18 * s), 'none', 0, ' stroke="#3f7ccf" stroke-width="' + 7 * s + '"');
}
/** a house front: wall, roof or terrace, windows with shutters; its windows light up at night */
function house(x: number, y: number, w: number, h: number, wall: string, shut: string, roof: boolean, lit: string[]): string {
  var s = rect(x, y, w, h, wall, 4);
  if (roof) s += path('M' + (x - 14) + ' ' + y + ' L' + (x + w / 2) + ' ' + (y - 46) + ' L' + (x + w + 14) + ' ' + y + 'Z', '#d9734e', 4);
  else s += rect(x - 6, y - 12, w + 12, 14, '#e8e0cf', 4);
  var cols = Math.max(1, Math.floor((w - 20) / 62)), rows = Math.max(1, Math.floor((h - 40) / 90)), gx = (w - cols * 34) / (cols + 1);
  for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
    var wx = x + gx + c * (34 + gx), wy = y + 26 + r * 90;
    s += rect(wx, wy, 34, 46, '#bfe3ff', 3, 2) + rect(wx - 12, wy, 10, 46, shut, 3) + rect(wx + 36, wy, 10, 46, shut, 3);
    if (rnd(x + r * 7 + c) < 0.6) lit.push(glowWin(wx, wy, 34, 46));
  }
  return s;
}
/** a street lamp, with its light at night */
function lamp(x: number, y: number, lit: string[]) {
  lit.push(halo(x + 22, y - 168, 70));
  return line(x, y, x, y - 170, INK, 10) + line(x, y, x, y - 170, '#5b6b8a', 5) + path('M' + x + ' ' + (y - 170) + ' Q' + (x + 4) + ' ' + (y - 186) + ' ' + (x + 22) + ' ' + (y - 182), 'none', 5) + ell(x + 22, y - 168, 13, 10, '#fff3b0', 3);
}

/* ---------- grounds ---------- */
function sand(y: number) {
  var s = ridge([[-10, y + 10], [400, y - 14], [900, y + 8], [1300, y - 10], [1610, y + 6]], '#f2dfa5');
  for (var k = 0; k < 40; k++) s += ell(rnd(k + 300) * W, y + 40 + rnd(k + 340) * (H - y - 40), 3, 2, '#d9bf7f', 0);
  return s;
}
function grass(y: number, col?: string) {
  var s = ridge([[-10, y + 8], [500, y - 12], [1000, y + 10], [1610, y - 6]], col || '#9ad27f');
  for (var k = 0; k < 26; k++) {
    var x = rnd(k + 500) * W, yy = y + 50 + rnd(k + 540) * (H - y - 60);
    s += path('M' + (x - 8) + ' ' + yy + ' l4 -14 M' + x + ' ' + yy + ' l1 -18 M' + (x + 8) + ' ' + yy + ' l-3 -13', 'none', 0, ' stroke="#5fae58" stroke-width="3.5" stroke-linecap="round"');
  }
  return s;
}
function paving(y: number, col: string, line2: string) {
  var s = rect(-10, y, W + 20, H - y + 10, col, 4);
  for (var r = 0; r < 7; r++) {
    var yy = y + 26 + r * r * 9 + r * 18;
    if (yy > H) break;
    s += line(-10, yy, W + 10, yy, line2, 3);
    var n = 10 + r * 2;
    for (var c = 0; c <= n; c++) { var x = (c + (r % 2) * 0.5) * (W / n); s += line(x, yy, x + (x - W / 2) * 0.06, yy + 9 + r * 9, line2, 3); }
  }
  return s;
}

/* ---------- the scenes ---------- */
function vindicio(): Scene {
  var lit: string[] = [];
  var s = sky('#7cc4ef', '#e4f5ff') + sun(1180, 150) + cloud(240, 190, 1.2) + cloud(760, 120, 0.9) +
    /* the Aurunci far away on the left, Gaeta's Monte Orlando on the right, with the round mausoleum on top */
    ridge([[-10, 470], [120, 360], [260, 410], [420, 330], [600, 430], [760, 520]], '#a9bfd2') +
    ridge([[1000, 530], [1180, 430], [1330, 392], [1480, 430], [1610, 470]], '#7fae8a') + rect(1300, 360, 60, 36, '#e8e0cf', 4, 4) +
    sea(510, 700, 11) + sail(840, 600, '#ff8a3c', 1) + sail(1040, 570, '#3f9fc4', 0.8) + sail(640, 585, '#ffd166', 0.7) +
    sand(660) + umbrella(150, 760, '#ff8fc1') + umbrella(380, 720, '#8fd0f6') + umbrella(1300, 720, '#ffd166') + umbrella(1500, 780, '#ff8fc1') +
    rect(1250, 780, 150, 26, '#ffffff', 4, 8) + ell(700, 930, 18, 12, '#ffd1c1', 3) + ell(980, 880, 14, 9, '#fff3e8', 3);
  lit.push(ell(1330, 380, 50, 50, '#ffd36b', 0, ' opacity=".2"'));
  return { title: 'La spiaggia di Vindicio', ground: '#f2dfa5', base: s, lights: lit.join('') + moonPath(510) };
}
/** the moon on the sea, at night */
function moonPath(seaTop: number) {
  var s = '';
  for (var k = 0; k < 6; k++) s += rect(1200 - k * 6, seaTop + 20 + k * 24, 80 + k * 12, 6, '#fff6d8', 0, 3, ' opacity=".5"');
  return s;
}
function pineta(): Scene {
  var lit: string[] = [];
  var s = sky('#8fd0f6', '#e4f5ff') + sun(820, 120) +
    sea(540, 610, 21) + ridge([[-10, 560], [300, 545], [700, 560], [1100, 548], [1610, 560]], '#d8be86', 0) +
    land([[-10, 640], [400, 610], [800, 630], [1200, 612], [1610, 636]], '#d8be86') +
    pine(120, 760, 1.25, 190) + pine(470, 690, 0.9, 250) + pine(1000, 700, 1, 220) + pine(1420, 770, 1.3, 170) + pine(760, 660, 0.75, 300);
  for (var k = 0; k < 40; k++) { var x = rnd(k + 700) * W, y = 700 + rnd(k + 740) * 280; s += line(x, y, x + 14, y - 4, '#a8844e', 3); }
  s += ell(560, 880, 14, 10, '#8a5a2e', 3) + ell(1120, 940, 12, 9, '#8a5a2e', 3) +
    tuft(60, 1000, 2) + tuft(170, 1000, 1.6) + tuft(1480, 1000, 2) + tuft(1580, 990, 1.5);
  /* fireflies at night */
  for (var f = 0; f < 18; f++) lit.push(ell(rnd(f + 900) * W, 520 + rnd(f + 940) * 380, 5, 5, '#f6ff9a', 0) + ell(rnd(f + 900) * W, 520 + rnd(f + 940) * 380, 14, 14, '#f6ff9a', 0, ' opacity=".25"'));
  return { title: 'La pineta di Vindicio', ground: '#d8be86', base: s, lights: lit.join('') };
}
function porto(): Scene {
  var lit: string[] = [];
  var s = sky('#7cc4ef', '#e4f5ff') + cloud(300, 150, 1) + cloud(1100, 110, 0.8) +
    ridge([[-10, 470], [160, 300], [380, 360], [560, 250], [800, 340], [1000, 280], [1240, 370], [1450, 320], [1610, 400]], '#86a9c4') +
    ridge([[-10, 520], [300, 470], [700, 500], [1100, 470], [1610, 510]], '#7fae6e');
  /* the town at the foot of the mountains */
  for (var k = 0; k < 14; k++) {
    var hx = 40 + k * 112, hh = 40 + rnd(k + 60) * 40, col = ['#f6d77b', '#f4a582', '#fff1d6', '#f7c6c7'][k % 4];
    s += rect(hx, 520 - hh, 90, hh, col, 3);
    lit.push(glowWin(hx + 30, 520 - hh + 12, 16, 16));
  }
  s += sea(520, 720, 31) + boat(220, 650, '#ffffff', 0.9) + boat(470, 690, '#ffe9a8', 0.7) +
    /* the ferry */
    path('M780 600 L1300 600 L1270 680 L820 680Z', '#ffffff', 5) + rect(830, 640, 430, 14, '#3f7ccf', 0) + rect(860, 548, 320, 52, '#ffffff', 5) + rect(900, 510, 200, 38, '#ffffff', 5) + rect(1120, 470, 40, 78, '#e8473a', 5);
  for (var w = 0; w < 7; w++) { s += rect(880 + w * 42, 562, 22, 18, '#bfe3ff', 3, 3); lit.push(glowWin(880 + w * 42, 562, 22, 18)); }
  /* the mole with the lighthouse */
  s += rect(1330, 640, 290, 60, '#cfc6b3', 4) + rect(1440, 430, 70, 210, '#ffffff', 5) + rect(1440, 470, 70, 30, '#e8473a', 0) + rect(1428, 400, 94, 34, '#e8473a', 5) + path('M1440 400 L1475 360 L1510 400Z', '#1c2340', 4);
  lit.push(path('M1475 410 L1610 360 L1610 470Z', '#ffe9a8', 0, ' opacity=".35"') + path('M1475 410 L1300 340 L1300 450Z', '#ffe9a8', 0, ' opacity=".25"') + halo(1475, 416, 60));
  s += paving(720, '#d9d2c4', '#b5aa95') + ell(220, 800, 26, 14, INK, 0) + rect(204, 760, 32, 42, '#2d3550', 4, 6) + rect(1360, 790, 32, 42, '#2d3550', 4, 6) +
    path('M560 880 q40 -30 80 0 q-40 30 -80 0', '#c9a66b', 4) + lamp(980, 760, lit);
  return { title: 'Il porto di Formia', ground: '#d9d2c4', base: s, lights: lit.join('') };
}
function mola(): Scene {
  var lit: string[] = [];
  var s = sky('#7cc4ef', '#e4f5ff') + sun(700, 130) + cloud(980, 170, 0.9) +
    sea(470, 640, 41) + ridge([[640, 480], [860, 430], [1000, 470]], '#7fae8a', 3) +
    /* the Torre di Mola: the round tower of the Angevin castle */
    rect(130, 220, 270, 520, '#d8c9a8', 5) + path('M130 220 L130 190 L160 190 L160 220 M190 220 L190 190 L220 190 L220 220 M250 220 L250 190 L280 190 L280 220 M310 220 L310 190 L340 190 L340 220 M370 220 L370 190 L400 190 L400 220', '#d8c9a8', 5) +
    path('M130 300 Q265 330 400 300', 'none', 4) + rect(240, 360, 30, 50, '#1c2340', 3, 14) + rect(240, 520, 30, 50, '#1c2340', 3, 14);
  lit.push(glowWin(240, 360, 30, 50));
  /* the fishermen's houses */
  s += house(900, 330, 200, 360, '#f4a582', '#2f8a45', true, lit) + house(1100, 380, 180, 310, '#f6d77b', '#2f6b45', false, lit) + house(1280, 300, 200, 390, '#f7c6c7', '#7a5232', true, lit) + house(1480, 360, 160, 330, '#fff1d6', '#2f8a45', false, lit) +
    path('M900 470 Q1000 500 1100 470', 'none', 3) + rect(940, 476, 22, 26, '#ff8fc1', 2) + rect(1000, 484, 22, 26, '#8fd0f6', 2) + rect(1056, 478, 22, 26, '#ffd166', 2) +
    paving(690, '#d9d2c4', '#b5aa95') + boat(560, 760, '#ffffff', 1) + path('M300 900 q60 -24 120 0 q-60 24 -120 0', '#9ab', 3) + lamp(800, 740, lit);
  return { title: 'Mola, il borgo dei pescatori', ground: '#d9d2c4', base: s, lights: lit.join('') };
}
function castellone(): Scene {
  var lit: string[] = [];
  var s = sky('#7cc4ef', '#e4f5ff') + sun(1300, 140) + cloud(500, 130, 1) +
    ridge([[-10, 480], [200, 300], [450, 360], [700, 260], [950, 340], [1200, 280], [1450, 360], [1610, 330]], '#86a9c4') +
    ridge([[-10, 560], [400, 500], [800, 540], [1200, 490], [1610, 540]], '#7fae6e');
  /* the octagonal tower of the Caetani, on the old Roman base */
  s += rect(380, 560, 300, 110, '#b5aa95', 5) + rect(420, 170, 220, 400, '#d8c9a8', 5) + rect(380, 190, 40, 380, '#c4b48f', 5) + rect(640, 190, 40, 380, '#c4b48f', 5) +
    path('M380 190 L380 160 L410 160 L410 190 M440 170 L440 140 L470 140 L470 170 M500 170 L500 140 L530 140 L530 170 M560 170 L560 140 L590 140 L590 170 M620 170 L620 140 L650 140 L650 170', '#d8c9a8', 5) +
    rect(515, 290, 30, 54, '#1c2340', 3, 14) + rect(515, 430, 30, 54, '#1c2340', 3, 14);
  lit.push(ell(530, 380, 200, 260, '#ffd36b', 0, ' opacity=".14"'));
  /* Sant'Erasmo, on the saint's grave */
  s += rect(1080, 360, 300, 300, '#efe3c8', 5) + path('M1060 360 L1230 260 L1400 360Z', '#d9734e', 5) + ell(1230, 430, 36, 36, '#bfe3ff', 4) + rect(1200, 540, 60, 120, '#7a5232', 4, 26) + rect(1210, 200, 40, 70, '#efe3c8', 4) + ell(1230, 226, 12, 14, '#c9a66b', 3);
  lit.push(ell(1230, 430, 30, 30, '#ffd36b', 3) + halo(1230, 430, 70));
  s += cypress(880, 680, 1.1) + cypress(960, 690, 0.8) + cypress(1500, 690, 1.2) + cypress(110, 690, 1);
  /* the polygonal walls of the giants */
  var x = -20, wall = '';
  for (var k = 0; x < W; k++) { var w = 90 + rnd(k + 120) * 90, h = 70 + rnd(k + 160) * 40; wall += path('M' + x + ' 760 L' + (x + 10) + ' ' + (760 - h) + ' L' + (x + w * 0.6) + ' ' + (750 - h - 14) + ' L' + (x + w) + ' ' + (760 - h + 10) + ' L' + (x + w - 6) + ' 760Z', k % 2 ? '#c9bfa8' : '#b8ad94', 4); x += w - 6; }
  s += wall + paving(750, '#cfc6b3', '#a99d84') + lamp(760, 820, lit);
  return { title: 'Castellone, le mura e la torre', ground: '#cfc6b3', base: s, lights: lit.join('') };
}
function monti(): Scene {
  var lit: string[] = [];
  var s = sky('#8fd0f6', '#eaf6ff') + sun(300, 150) + cloud(900, 120, 1.1) +
    ridge([[-10, 420], [200, 230], [420, 140], [640, 260], [880, 110], [1120, 230], [1360, 150], [1610, 300]], '#8fa9c8') +
    ridge([[-10, 520], [260, 380], [520, 450], [800, 330], [1060, 420], [1340, 340], [1610, 430]], '#7fae6e');
  /* Maranola on its slope, with its tower */
  for (var k = 0; k < 9; k++) {
    var hx = 1040 + k * 46, hy = 360 + (k % 3) * 22 - k * 4;
    s += rect(hx, hy, 52, 44, ['#fff1d6', '#f6d77b', '#efe3c8'][k % 3], 3) + path('M' + (hx - 4) + ' ' + hy + ' L' + (hx + 26) + ' ' + (hy - 16) + ' L' + (hx + 56) + ' ' + hy + 'Z', '#d9734e', 3);
    lit.push(glowWin(hx + 20, hy + 14, 12, 14));
  }
  s += rect(1170, 250, 50, 110, '#d8c9a8', 4) + path('M1170 250 L1170 236 L1182 236 L1182 250 M1192 250 L1192 236 L1204 236 L1204 250 M1214 250 L1214 236 L1220 236', 'none', 4) +
    /* the gulf, far below */
    rect(-10, 545, 560, 30, '#4aa8d0', 4) +
    ridge([[-10, 640], [400, 600], [800, 630], [1200, 590], [1610, 620]], '#86b86c') +
    olive(200, 690, 1) + olive(1380, 700, 1.1) + olive(1100, 640, 0.6) + olive(520, 640, 0.6) +
    grass(700, '#a8cf7f');
  /* broom in flower and stones */
  [[90, 980], [1520, 960], [700, 990], [400, 860], [1200, 870]].forEach(function (p, i) { s += i % 2 ? tuft(p[0], p[1], 1.2, '#6aa84f') + ell(p[0], p[1] - 50, 10, 10, '#ffd84d', 3) : ell(p[0], p[1] - 14, 40, 22, '#cfc6b3', 4); });
  return { title: 'I Monti Aurunci, sotto Maranola', ground: '#a8cf7f', base: s, lights: lit.join('') };
}
function golfo(): Scene {
  var lit: string[] = [];
  var s = sky('#8fc9ee', '#ffe2b0') + sun(980, 330) + cloud(1300, 140, 0.9) +
    sea(470, 640, 51) + ridge([[1100, 480], [1300, 400], [1450, 410], [1610, 440]], '#7fae8a') + path('M560 470 Q600 450 640 470Z M700 470 Q760 440 820 470Z', '#8fa9c8', 3) +
    /* the yellow palazzina of Parco la Fontana, with the striped awnings */
    house(40, 230, 420, 470, '#f6d77b', '#2f8a45', false, lit);
  for (var k = 0; k < 4; k++) s += path('M' + (70 + k * 98) + ' ' + 380 + ' l80 0 l-12 34 l-56 0Z', k % 2 ? '#ffffff' : '#e8473a', 3);
  s += house(1260, 420, 360, 280, '#fff1d6', '#7a5232', true, lit) +
    /* the hedge of the garden, and the lawn */
    rect(-10, 640, W + 20, 70, '#4f8a4a', 4, 30) + grass(690) + palm(560, 720, 1) + lamp(1180, 760, lit) +
    [[300, 900], [420, 950], [1000, 920], [1300, 980]].map(function (p) { return ell(p[0], p[1], 9, 9, '#ff8fc1', 3) + ell(p[0] + 22, p[1] + 6, 8, 8, '#fff3a0', 3); }).join('');
  return { title: 'Il golfo da via Amendola', ground: '#9ad27f', base: s, lights: lit.join('') };
}
function gianola(): Scene {
  var lit: string[] = [];
  var s = sky('#7cc4ef', '#e4f5ff') + sun(1200, 140) + cloud(400, 160, 1) +
    ridge([[900, 520], [1100, 400], [1300, 330], [1500, 390], [1610, 420]], '#5f9a58') +
    sea(520, 700, 61);
  /* the Roman harbour: blocks in the water, in a ring */
  for (var k = 0; k < 9; k++) { var a = Math.PI * (0.1 + k * 0.1); s += rect(1080 + Math.cos(a) * 240, 640 - Math.sin(a) * 70, 60, 26, '#c9bfa8', 4, 4); }
  /* the octagon of the villa of Mamurra, the "Temple of Janus", in ruins */
  s += rect(160, 330, 520, 330, '#d9b38c', 5) + path('M160 330 L210 300 L300 320 L380 290 L470 316 L560 296 L680 330Z', '#d9b38c', 5);
  for (var r = 0; r < 4; r++) s += path('M' + (200 + r * 120) + ' 660 L' + (200 + r * 120) + ' 470 Q' + (245 + r * 120) + ' 410 ' + (290 + r * 120) + ' 470 L' + (290 + r * 120) + ' 660Z', '#7a5a3e', 4);
  s += tuft(170, 330, 1, '#5fae58') + tuft(640, 334, 0.8, '#5fae58');
  lit.push(ell(420, 500, 280, 200, '#ffd36b', 0, ' opacity=".12"'));
  s += sand(680);
  [[300, 820], [800, 900], [1300, 830], [1100, 960], [520, 980]].forEach(function (p, i) { s += ell(p[0], p[1], 70, 26, '#4aa8d0', 4) + ell(p[0] - 50, p[1] - 22, 26, 18, '#9a917f', 4) + ell(p[0] + 56, p[1] + 8, 20, 14, '#9a917f', 4) + (i % 2 ? ell(p[0], p[1], 10, 10, '#5b3b7a', 3) : ''); });
  return { title: 'Gianola, il porticciolo romano', ground: '#f2dfa5', base: s, lights: lit.join('') + moonPath(520) };
}
function caposele(): Scene {
  var lit: string[] = [];
  var s = sky('#7cc4ef', '#e4f5ff') + sun(400, 140) + cloud(1000, 150, 1) +
    ridge([[1050, 480], [1250, 400], [1400, 410], [1610, 450]], '#7fae8a') + sea(470, 650, 71);
  /* the Roman fishponds, square pools of stone in the sea */
  for (var k = 0; k < 4; k++) s += rect(200 + k * 300, 520, 220, 90, 'none', 0) + rect(200 + k * 300, 520, 220, 90, '#6fc3e0', 6) + line(310 + k * 300, 520, 310 + k * 300, 610, '#c9bfa8', 8);
  /* the railing of the lungomare and its palms */
  s += rect(-10, 640, W + 20, 30, '#f4f1ea', 4);
  for (var p = 0; p < 17; p++) s += rect(p * 100, 610, 12, 40, '#f4f1ea', 3);
  s += paving(670, '#e2dccf', '#bdb3a0') + palm(140, 760, 1.1) + palm(1460, 780, 1.2) + lamp(560, 720, lit) + lamp(1080, 720, lit) +
    rect(760, 760, 180, 26, '#b07a45', 4, 6) + rect(770, 786, 10, 30, INK, 0) + rect(920, 786, 10, 30, INK, 0);
  return { title: 'Le peschiere romane di Caposele', ground: '#e2dccf', base: s, lights: lit.join('') + moonPath(470) };
}
function centro(): Scene {
  var lit: string[] = [];
  var s = sky('#7cc4ef', '#e4f5ff') + cloud(300, 130, 1) + cloud(1300, 100, 0.8) +
    house(-20, 300, 380, 400, '#f7c6c7', '#2f8a45', false, lit) + house(1240, 280, 380, 420, '#f6d77b', '#2f6b45', false, lit) +
    /* the palazzo comunale, with its arches and the clock */
    rect(420, 220, 760, 470, '#fff1d6', 5) + rect(400, 200, 800, 30, '#e8e0cf', 5) + ell(800, 170, 46, 46, '#ffffff', 5) + path('M800 170 L800 140 M800 170 L822 180', 'none', 5);
  for (var a = 0; a < 5; a++) s += path('M' + (470 + a * 140) + ' 690 L' + (470 + a * 140) + ' 560 Q' + (520 + a * 140) + ' 500 ' + (570 + a * 140) + ' 560 L' + (570 + a * 140) + ' 690Z', '#c9a66b', 4);
  for (var w = 0; w < 6; w++) { s += rect(470 + w * 115, 290, 40, 70, '#bfe3ff', 3, 2) + rect(470 + w * 115, 410, 40, 70, '#bfe3ff', 3, 2); lit.push(glowWin(470 + w * 115, 290, 40, 70)); }
  /* the war memorial of 1926 */
  s += rect(220, 600, 160, 110, '#cfc6b3', 5) + rect(260, 330, 80, 270, '#e8e0cf', 5) + path('M270 330 Q300 220 330 330Z', '#5b7a6a', 5) + ell(300, 250, 22, 26, '#5b7a6a', 4);
  lit.push(ell(300, 450, 120, 200, '#ffd36b', 0, ' opacity=".14"'));
  s += paving(700, '#e2dccf', '#bdb3a0') + palm(1280, 790, 1) + palm(110, 800, 0.9) + lamp(980, 780, lit);
  return { title: 'Piazza della Vittoria', ground: '#e2dccf', base: s, lights: lit.join('') };
}
function campo(): Scene {
  var lit: string[] = [];
  /* the covered courts of the Bruno Zauli: an arched roof, the glass walls, the net */
  var s = '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#e9eef5"/>';
  for (var k = 0; k < 7; k++) s += path('M' + (k * 260 - 80) + ' 0 Q' + (k * 260 + 50) + ' 120 ' + (k * 260 + 180) + ' 0', 'none', 6);
  s += rect(-10, 300, W + 20, 340, '#cfe3f4', 4) + line(-10, 330, W + 10, 330, '#9cb8d0', 4);
  for (var p = 0; p < 9; p++) s += rect(p * 200, 300, 10, 340, '#5b6b8a', 3);
  s += rect(320, 200, 360, 70, '#e8473a', 4, 6) + rect(920, 200, 360, 70, '#3f7ccf', 4, 6) +
    '<text x="500" y="248" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="40" fill="#ffffff">BRUNO ZAULI</text><text x="1100" y="248" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="40" fill="#ffffff">PADEL</text>' +
    rect(-10, 640, W + 20, 370, '#3f7fc4', 4) + line(200, 640, 60, 1000, '#ffffff', 6) + line(1400, 640, 1540, 1000, '#ffffff', 6) + line(130, 800, 1470, 800, '#ffffff', 6) + line(800, 640, 800, 1000, '#ffffff', 5) +
    rect(-10, 690, W + 20, 26, '#1c2340', 0, 0, ' opacity=".18"') + rect(-10, 640, W + 20, 6, '#ffffff', 3);
  for (var n = 0; n < 40; n++) s += line(n * 40, 650, n * 40, 700, '#1c2340', 2);
  s += line(-10, 700, W + 10, 700, '#ffffff', 7);
  for (var l = 0; l < 5; l++) lit.push(ell(160 + l * 320, 40, 60, 16, '#fff6d8', 3) + halo(160 + l * 320, 50, 90));
  return { title: 'I campi coperti del Bruno Zauli', ground: '#3f7fc4', base: s + lit.join(''), lights: '', indoor: true };
}
function birreria(): Scene {
  var lit: string[] = [];
  /* inside Morgana: wooden walls, the shelves with the bottles, the taps, the string lights, the little stage */
  var s = '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="#7a4e2e"/>';
  for (var k = 0; k < 20; k++) s += line(k * 84, 0, k * 84, 700, '#5e3a20', 4);
  s += rect(260, 260, 900, 30, '#b07a45', 4) + rect(260, 400, 900, 30, '#b07a45', 4);
  for (var b = 0; b < 22; b++) { var bx = 290 + b * 40, col = ['#2f6b45', '#8a4a1f', '#d9a441', '#3f5f8a'][b % 4]; s += rect(bx, 200, 20, 60, col, 3, 6) + rect(bx + (b % 3) * 4, 344, 20, 56, col, 3, 6); }
  s += rect(200, 560, 1000, 140, '#9a6a3f', 5) + rect(180, 540, 1040, 30, '#c8955a', 5);
  for (var t = 0; t < 4; t++) s += rect(520 + t * 90, 470, 18, 70, '#c0c7d4', 3) + ell(529 + t * 90, 470, 18, 10, '#e8473a', 3);
  /* the stage with the mic */
  s += rect(1260, 560, 360, 140, '#5e3a20', 4) + line(1430, 560, 1430, 420, INK, 6) + ell(1430, 410, 14, 18, '#5b6b8a', 3) +
    path('M-10 90 Q200 150 400 90 Q600 150 800 90 Q1000 150 1200 90 Q1400 150 1610 90', 'none', 4);
  for (var g = 0; g < 26; g++) { var gx = g * 64, gy = 100 + Math.sin(g * 0.9) * 20 + 18; lit.push(ell(gx, gy, 9, 12, ['#ffd36b', '#ff8fc1', '#8fd0f6'][g % 3], 3) + ell(gx, gy, 22, 22, '#ffd36b', 0, ' opacity=".25"')); }
  s += rect(-10, 700, W + 20, 310, '#b07a45', 4);
  for (var f = 0; f < 6; f++) s += line(-10, 740 + f * f * 9 + f * 22, W + 10, 740 + f * f * 9 + f * 22, '#8a5a2e', 3);
  return { title: 'Dentro la Birreria Morgana', ground: '#b07a45', base: s + lit.join(''), lights: '', indoor: true };
}

const SCENES: Record<string, () => Scene> = { vindicio: vindicio, pineta: pineta, porto: porto, mola: mola, castellone: castellone, maranola: monti, castellonorato: golfo, gianola: gianola, caposele: caposele, centro: centro, campo: campo, birreria: birreria };
/** a scene's name and the colour of its ground (for the platforms the fighters stand on) */
export function sceneInfo(id: string): { title: string; ground: string } { NIGHT = false; var sc = (SCENES[id] || porto)(); return { title: sc.title, ground: sc.ground }; }
/** the whole picture, by day or by night */
export function scene(id: string, dark: boolean): string {
  NIGHT = dark;
  var sc = (SCENES[id] || porto)();
  NIGHT = false;
  return '<svg xmlns="http://www.w3.org/2000/svg" class="scene-art" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="xMidYMax slice" aria-hidden="true">' +
    sc.base + (dark ? night(7, sc.indoor) + sc.lights : '') + '</svg>';
}
