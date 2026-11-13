import type { Palette } from './palette';
import { T, rr, fillStroke, circle, ell, poly, plaque, hash, type Ctx } from './draw';

/* The covi of the friends (13 November 2026, data/covo-places.ts): their buildings on the map of Formia, the things in
   them, the aura that rises from them and the mood inside. A covo is a home of Formia turned into something out of a
   fantasy by the echo of Telepilo, in the shape of its keeper: a black castle for Claudia, a green wooden tower of the
   Carpathians for Valentin, a tower of dice for Andrea, a glass dome with a telescope for Antonio, a palace of the
   people for Costanzo, a temple of speakers for Zendavid, a dome like a tennis ball for Forchetta.

   States (story/lairs.ts covoState): `waiting` and `next` are lit (the aura says which one is next); `beaten`: the
   windows dark, the colours washed out, a white flag on top: the keeper is free; `mine`: the keeper is the one played
   (his home is drawn as a home by objects.ts). Pen and highlighters, like the rest of the map. */

export interface CovoOpts { w?: number; h?: number; up?: number; x?: number; doorX?: number; label?: string; look?: string; state?: string }
const INK = '#1c2340';
/** the colour of each keeper's covo: the aura, the lights */
export const AURA: Record<string, string> = { claudia: '#ff3d3d', valentin: '#59e07a', andrea: '#4fd1a5', antonio: '#b98cff', costanzo: '#ffd23f', zendavid: '#ff7ad9', forchetta: '#5fb8ff' };

function door(c: Ctx, x: number, y: number, w: number, h: number, fill: string, lit: string | null) {
  c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath();
  fillStroke(c, fill, INK, 1.6);
  if (lit) { c.fillStyle = lit; c.globalAlpha = 0.35; c.fill(); c.globalAlpha = 1; }
}
function win(c: Ctx, x: number, y: number, w: number, h: number, lit: string | null, arch?: boolean) {
  if (arch) { c.beginPath(); c.moveTo(x, y + h); c.lineTo(x, y + w / 2); c.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); c.lineTo(x + w, y + h); c.closePath(); }
  else rr(c, x, y, w, h, 1.5);
  fillStroke(c, lit || '#2c3046', INK, 1.2);
}
/** a white flag on a pole: the keeper is free */
function whiteFlag(c: Ctx, x: number, y: number) {
  c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - 22); c.stroke();
  c.beginPath(); c.moveTo(x, y - 22); c.quadraticCurveTo(x + 8, y - 25, x + 15, y - 21); c.quadraticCurveTo(x + 9, y - 17, x + 15, y - 13); c.quadraticCurveTo(x + 8, y - 16, x, y - 13); c.closePath();
  fillStroke(c, '#fffdf6', INK, 1.2);
}
/** the plaque over the door with the covo's name */
function sign(c: Ctx, P: Palette, o: CovoOpts, w: number, y: number) { if (o.label) plaque(c, P, o.label, w / 2, y, w - 8, 12); }

/* ---------- Claudia: the black castle ---------- */
function claudia(c: Ctx, w: number, h: number, P: Palette, o: CovoOpts, free: boolean) {
  var up = o.up || T * 5, base = h - 4, lit = free ? null : '#ff3d3d', stone = free ? '#5b5566' : '#2e2638', stone2 = free ? '#4a4555' : '#1f1928', roof = free ? '#3a3542' : '#140f1c';
  ell(c, w / 2, base + 2, w / 2 + 6, 8); c.fillStyle = P.shadow; c.fill();
  /* the curtain wall with its merlons */
  rr(c, 4, h - T * 1.9, w - 8, T * 1.9 - 4, 2); fillStroke(c, stone, INK, 2);
  for (var k = 0; k < 7; k++) { rr(c, 6 + k * (w - 16) / 7, h - T * 1.9 - 7, (w - 16) / 7 - 4, 8, 1); fillStroke(c, stone, INK, 1.2); }
  c.strokeStyle = stone2; c.lineWidth = 1; for (var y = h - T * 1.9 + 8; y < base; y += 8) { c.beginPath(); c.moveTo(6, y); c.lineTo(w - 6, y); c.stroke(); }
  /* two side towers, each with a witch's hat, and the keep in the middle, taller, with its spire */
  var tower = function (cx: number, tw: number, top: number, spire: number) {
    rr(c, cx - tw / 2, top, tw, base - top, 2); fillStroke(c, stone, INK, 2);
    c.strokeStyle = stone2; c.lineWidth = 1; for (var yy = top + 10; yy < base - 4; yy += 9) { c.beginPath(); c.moveTo(cx - tw / 2 + 2, yy); c.lineTo(cx + tw / 2 - 2, yy); c.stroke(); }
    poly(c, [[cx - tw / 2 - 5, top + 2], [cx + tw / 2 + 5, top + 2], [cx + 2, top - spire], [cx - 1, top - spire - 2]]); fillStroke(c, roof, INK, 1.8);
    c.strokeStyle = free ? '#6a6475' : '#5a2a3a'; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - tw / 4, top); c.lineTo(cx + 1, top - spire + 6); c.stroke();
    for (var j = 0; j < 3; j++) win(c, cx - 3, top + 12 + j * 22, 6, 11, lit, true);
  };
  tower(16, 22, -up * 0.35, 34);
  tower(w - 16, 22, -up * 0.3, 30);
  tower(w / 2, 40, -up * 0.62, 52);
  /* a rose window on the keep, red like the eyes of the castle */
  circle(c, w / 2, -up * 0.62 + 34, 9); fillStroke(c, lit || '#3a3542', INK, 1.6);
  c.strokeStyle = INK; c.lineWidth = 1; for (k = 0; k < 4; k++) { var a = k * Math.PI / 4; c.beginPath(); c.moveTo(w / 2 - Math.cos(a) * 9, -up * 0.62 + 34 - Math.sin(a) * 9); c.lineTo(w / 2 + Math.cos(a) * 9, -up * 0.62 + 34 + Math.sin(a) * 9); c.stroke(); }
  /* the gate, with its knocker shaped like horns */
  var dx = ((o.doorX || 0) - (o.x || 0)) * T + T / 2;
  door(c, dx - 11, base - 30, 22, 30, free ? '#4a3a30' : '#2a1410', lit);
  c.strokeStyle = free ? '#9a9a9a' : '#d6b25a'; c.lineWidth = 1.6; c.beginPath(); c.arc(dx, base - 15, 3.5, 0, Math.PI * 2); c.stroke();
  c.beginPath(); c.moveTo(dx - 5, base - 20); c.quadraticCurveTo(dx - 7, base - 26, dx - 3, base - 27); c.moveTo(dx + 5, base - 20); c.quadraticCurveTo(dx + 7, base - 26, dx + 3, base - 27); c.stroke();
  /* two red banners down the curtain wall, a pair of horns on each, and the iron fence with its spikes in front */
  [w * 0.3, w * 0.7].forEach(function (bx) {
    poly(c, [[bx - 7, h - T * 1.9 + 4], [bx + 7, h - T * 1.9 + 4], [bx + 7, h - T * 0.9], [bx, h - T * 0.9 + 6], [bx - 7, h - T * 0.9]]); fillStroke(c, free ? '#8a7a7a' : '#9a1424', INK, 1.3);
    c.strokeStyle = free ? '#c9c0c0' : '#ffd166'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(bx - 4, h - T * 1.5); c.quadraticCurveTo(bx - 6, h - T * 1.5 - 7, bx - 2, h - T * 1.5 - 8); c.moveTo(bx + 4, h - T * 1.5); c.quadraticCurveTo(bx + 6, h - T * 1.5 - 7, bx + 2, h - T * 1.5 - 8); c.stroke();
  });
  c.strokeStyle = INK; c.lineWidth = 1.5; c.beginPath(); c.moveTo(2, base - 3); c.lineTo(w - 2, base - 3); c.stroke();
  for (var sp = 4; sp < w - 2; sp += 6) { var gx = ((o.doorX || 0) - (o.x || 0)) * T + T / 2; if (Math.abs(sp - gx) < 14) continue; c.beginPath(); c.moveTo(sp, base); c.lineTo(sp, base - 10); c.stroke(); poly(c, [[sp - 2, base - 10], [sp + 2, base - 10], [sp, base - 14]]); c.fillStyle = INK; c.fill(); }
  /* bats on the spire, while the echo holds */
  if (!free) [[w / 2 + 14, -up * 0.62 - 20], [w / 2 - 22, -up * 0.62 - 6], [w - 30, -up * 0.3 - 18]].forEach(function (b) { bat(c, b[0], b[1], 0.8); });
  if (free) whiteFlag(c, w / 2, -up * 0.62 - 52);
  sign(c, P, o, w, base - 40);
}
function bat(c: Ctx, x: number, y: number, s: number) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-5, -6, -12, -3); c.quadraticCurveTo(-8, -1, -9, 3); c.quadraticCurveTo(-4, 0, 0, 3); c.quadraticCurveTo(4, 0, 9, 3); c.quadraticCurveTo(8, -1, 12, -3); c.quadraticCurveTo(5, -6, 0, 0); c.closePath();
  fillStroke(c, '#140f1c', INK, 1); c.restore();
}

/* ---------- Valentin: the green tower of the Carpathians ---------- */
function valentin(c: Ctx, w: number, h: number, P: Palette, o: CovoOpts, free: boolean) {
  var up = o.up || T * 4, base = h - 4, green = free ? '#7fa08a' : '#2f8f4e', green2 = free ? '#6a8a75' : '#22703b', wood = '#5a3a22', wood2 = '#3e2716', lit = free ? null : '#b6ffc8';
  ell(c, w / 2, base + 2, w / 2 + 4, 7); c.fillStyle = P.shadow; c.fill();
  /* the hall: walls painted green with frescoes, as the monasteries of Bucovina */
  rr(c, 6, h - T * 1.7, w - 12, T * 1.7 - 4, 2); fillStroke(c, green, INK, 2);
  c.fillStyle = green2; for (var k = 0; k < 6; k++) { var fx = 12 + k * (w - 24) / 6; rr(c, fx, h - T * 1.45, (w - 24) / 6 - 5, 18, 3); c.fill(); }
  c.fillStyle = free ? '#d8d0b0' : '#ffd166'; for (k = 0; k < 6; k++) { fx = 12 + k * (w - 24) / 6 + ((w - 24) / 6 - 5) / 2; circle(c, fx, h - T * 1.45 + 5, 2.6); c.fill(); }
  /* the steep shingled roof, and the slender spire of the wooden churches of Maramureș, with four little spires at its foot */
  var rt = h - T * 1.7;
  poly(c, [[0, rt + 4], [w, rt + 4], [w / 2 + 10, rt - 26], [w / 2 - 10, rt - 26]]); fillStroke(c, wood, INK, 2);
  c.strokeStyle = wood2; c.lineWidth = 1; for (var y = rt - 20; y < rt + 2; y += 6) { c.beginPath(); c.moveTo(w / 2 - 10 - (y - rt + 26) * 0.9, y); c.lineTo(w / 2 + 10 + (y - rt + 26) * 0.9, y); c.stroke(); }
  rr(c, w / 2 - 9, rt - 52, 18, 28, 1); fillStroke(c, wood, INK, 1.8);
  win(c, w / 2 - 4, rt - 46, 8, 12, lit, true);
  [-11, 11].forEach(function (d) { poly(c, [[w / 2 + d - 3, rt - 50], [w / 2 + d + 3, rt - 50], [w / 2 + d, rt - 64]]); fillStroke(c, wood2, INK, 1.2); });
  poly(c, [[w / 2 - 12, rt - 50], [w / 2 + 12, rt - 50], [w / 2, -up]]); fillStroke(c, wood2, INK, 1.8);
  circle(c, w / 2, -up - 4, 3.6); fillStroke(c, free ? '#cfcfcf' : '#ffd166', INK, 1.2);
  /* the door and the windows, glowing green */
  var dx = ((o.doorX || 0) - (o.x || 0)) * T + T / 2;
  door(c, dx - 10, base - 24, 20, 24, wood, lit);
  [16, w - 26].forEach(function (x) { win(c, x, h - T * 1.3, 10, 13, lit, true); });
  /* a red and white cord round the post by the door: the mărțișor */
  c.strokeStyle = '#e8473a'; c.lineWidth = 2; c.beginPath(); c.moveTo(dx + 14, base - 8); c.lineTo(dx + 14, base - 26); c.stroke();
  c.strokeStyle = '#fffdf6'; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(dx + 14, base - 8); c.lineTo(dx + 14, base - 26); c.stroke(); c.setLineDash([]);
  /* two lanterns on chains under the eaves, burning green */
  [10, w - 10].forEach(function (lx) {
    c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(lx, rt + 2); c.lineTo(lx, rt + 10); c.stroke();
    rr(c, lx - 3.5, rt + 10, 7, 9, 2); fillStroke(c, free ? '#b9c0b6' : '#9dffb8', INK, 1.1);
  });
  /* while the echo holds, the green mist at its foot */
  if (!free) { c.fillStyle = 'rgba(157,255,184,0.35)'; [[w * 0.2, base], [w * 0.5, base + 2], [w * 0.8, base]].forEach(function (m) { ell(c, m[0], m[1], w * 0.24, 6); c.fill(); }); }
  if (free) whiteFlag(c, w / 2, -up - 8);
  sign(c, P, o, w, base - 34);
}

/* ---------- Andrea: the tower of dice ---------- */
function die(c: Ctx, x: number, y: number, s: number, n: number, rot: number, face: string, pip: string) {
  c.save(); c.translate(x, y); c.rotate(rot);
  rr(c, -s / 2, -s / 2, s, s, s * 0.16); fillStroke(c, face, INK, 2);
  /* the top face, seen from a little above */
  c.beginPath(); c.moveTo(-s / 2 + 2, -s / 2); c.lineTo(-s / 2 + 10, -s / 2 - 8); c.lineTo(s / 2 + 8, -s / 2 - 8); c.lineTo(s / 2, -s / 2); c.closePath(); fillStroke(c, '#e8ece6', INK, 1.4);
  c.beginPath(); c.moveTo(s / 2, -s / 2); c.lineTo(s / 2 + 8, -s / 2 - 8); c.lineTo(s / 2 + 8, s / 2 - 8); c.lineTo(s / 2, s / 2); c.closePath(); fillStroke(c, '#cfd6cf', INK, 1.4);
  var q = s / 4, at: Record<number, number[][]> = { 1: [[0, 0]], 2: [[-q, -q], [q, q]], 3: [[-q, -q], [0, 0], [q, q]], 4: [[-q, -q], [q, -q], [-q, q], [q, q]], 5: [[-q, -q], [q, -q], [0, 0], [-q, q], [q, q]], 6: [[-q, -q], [q, -q], [-q, 0], [q, 0], [-q, q], [q, q]] };
  c.fillStyle = pip; at[n].forEach(function (p) { circle(c, p[0], p[1], s * 0.08); c.fill(); });
  c.restore();
}
function andrea(c: Ctx, w: number, h: number, P: Palette, o: CovoOpts, free: boolean) {
  var up = o.up || T * 4.4, base = h - 4, pip = free ? '#7a8a85' : '#1f8f6a', face = free ? '#e6e6df' : '#fbfbf5';
  ell(c, w / 2, base + 2, w / 2 + 4, 7); c.fillStyle = P.shadow; c.fill();
  /* the stone foot of the old house of Castellone */
  rr(c, 4, h - T * 1.2, w - 8, T * 1.2 - 4, 2); fillStroke(c, free ? '#b9b2a2' : '#c9c0aa', INK, 2);
  var dx = ((o.doorX || 0) - (o.x || 0)) * T + T / 2;
  door(c, dx - 10, base - 24, 20, 24, '#6b4a2e', free ? null : '#4fd1a5');
  /* three dice piled one on the other, each a little askew */
  var s = Math.min(w - 26, 52);
  die(c, w / 2 - 4, h - T * 1.2 - s / 2 + 4, s, 6, -0.03, face, pip);
  die(c, w / 2 + 2, h - T * 1.2 - s * 1.45 + 6, s * 0.86, 4, 0.06, face, pip);
  die(c, w / 2 - 2, h - T * 1.2 - s * 2.25 + 8, s * 0.72, 1, -0.08, face, pip);
  /* on top, the bell of Gauss, as a sign */
  var ty = -up + 10;
  c.strokeStyle = free ? '#8a9a95' : '#4fd1a5'; c.lineWidth = 3; c.beginPath();
  for (var k = 0; k <= 24; k++) { var u = (k - 12) / 4, x = w / 2 + u * 9, y = ty + 16 - 22 * Math.exp(-u * u / 2); if (!k) c.moveTo(x, y); else c.lineTo(x, y); }
  c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.2; c.beginPath(); c.moveTo(w / 2 - 30, ty + 17); c.lineTo(w / 2 + 30, ty + 17); c.stroke();
  if (!free) { c.fillStyle = '#4fd1a5'; c.font = '700 11px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; ['94%', '1/6', 'σ', 'p'].forEach(function (t, i) { c.fillText(t, w / 2 + (i % 2 ? 1 : -1) * (22 + i * 4), ty - 8 - i * 9); }); }
  /* a plaque with the percentage that Andrea always gives, on the stone foot */
  rr(c, 8, h - T * 1.1, 26, 12, 2); fillStroke(c, free ? '#e6e6df' : '#1f5a4a', INK, 1.2);
  c.fillStyle = free ? '#7a8a85' : '#9be7c4'; c.font = '700 9px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('94%', 21, h - T * 1.1 + 6.5);
  if (free) whiteFlag(c, w / 2 + 26, ty + 17);
  sign(c, P, o, w, base - 34);
}

/* ---------- Antonio: the glass dome by the fountain ---------- */
function antonio(c: Ctx, w: number, h: number, P: Palette, o: CovoOpts, free: boolean) {
  /* all of glass (13 November 2026, Antonio: «la cupola interamente di vetro»): a geodesic dome from the ground up, its
     thin steel ribs, and through the glass what is inside: the telescope on its pier, the hologram of Formia turning,
     the model of a rocket, the purple light of the simulation */
  var up = o.up || T * 3.6, base = h - 4, cx = w / 2, rx = w / 2 - 3, ry = Math.min(up + h - 10, rx * 1.15), top = base - ry;
  var glow = free ? 'rgba(200,210,230,' : 'rgba(185,140,255,', rib = free ? '#9aa3b2' : '#e6e9f5';
  ell(c, cx, base + 2, rx + 6, 8); c.fillStyle = P.shadow; c.fill();
  /* the plinth: a ring of white stone, and the light coming out at its foot */
  ell(c, cx, base - 2, rx + 2, 7); fillStroke(c, free ? '#cfd2da' : '#f4f6fb', INK, 1.8);
  /* the dome, seen through: first what is inside, then the glass over it */
  var dome = function () { c.beginPath(); c.moveTo(cx - rx, base - 3); c.ellipse(cx, base - 3, rx, ry, 0, Math.PI, 0); c.closePath(); };
  c.save(); dome(); c.clip();
  var g = c.createRadialGradient(cx, base - ry * 0.35, 4, cx, base - ry * 0.4, ry);
  g.addColorStop(0, glow + (free ? '0.25)' : '0.55)')); g.addColorStop(1, glow + '0.12)');
  c.fillStyle = g; c.fillRect(cx - rx, top, rx * 2, ry + 4);
  /* inside: the pier and the telescope looking out of the top */
  rr(c, cx - 4, base - 30, 8, 26, 2); fillStroke(c, '#3c4658', INK, 1.2);
  c.save(); c.translate(cx, base - 30); c.rotate(-0.55); rr(c, -5, -30, 10, 32, 3); fillStroke(c, '#f4f6fb', INK, 1.4); rr(c, -6, -33, 12, 6, 2); fillStroke(c, '#2b2f5e', INK, 1.1); c.restore();
  /* the hologram of Formia: a disc of light with the coast drawn on it */
  ell(c, cx + rx * 0.45, base - 14, 13, 4); c.fillStyle = free ? 'rgba(160,170,190,.5)' : 'rgba(201,182,255,.85)'; c.fill();
  if (!free) { c.strokeStyle = '#ffffff'; c.lineWidth = 1; c.globalAlpha = 0.8; c.beginPath(); c.moveTo(cx + rx * 0.45 - 10, base - 13); c.quadraticCurveTo(cx + rx * 0.45, base - 18, cx + rx * 0.45 + 10, base - 13); c.stroke(); c.globalAlpha = 1;
    c.fillStyle = 'rgba(201,182,255,.35)'; poly(c, [[cx + rx * 0.45 - 12, base - 14], [cx + rx * 0.45 + 12, base - 14], [cx + rx * 0.45 + 4, base - 34], [cx + rx * 0.45 - 4, base - 34]]); c.fill(); }
  /* the model rocket, and a desk with its screens */
  var rx0 = cx - rx * 0.55;
  poly(c, [[rx0 - 4, base - 6], [rx0 + 4, base - 6], [rx0 + 4, base - 26], [rx0, base - 34], [rx0 - 4, base - 26]]); fillStroke(c, '#fffdf6', INK, 1.1);
  poly(c, [[rx0 - 4, base - 12], [rx0 - 8, base - 5], [rx0 - 4, base - 6]]); fillStroke(c, '#e8473a', INK, 0.9); poly(c, [[rx0 + 4, base - 12], [rx0 + 8, base - 5], [rx0 + 4, base - 6]]); fillStroke(c, '#e8473a', INK, 0.9);
  rr(c, cx - rx * 0.2 - 12, base - 14, 18, 8, 1); fillStroke(c, '#2b2f5e', INK, 1); c.fillStyle = free ? '#8a93a8' : '#57c968'; c.fillRect(cx - rx * 0.2 - 9, base - 12, 12, 3);
  /* the glass: geodesic triangles, the reflection of the sky on the left */
  c.strokeStyle = rib; c.lineWidth = 1.3;
  var rings = 4;
  for (var k = 1; k <= rings; k++) { var f = k / (rings + 1); c.beginPath(); c.ellipse(cx, base - 3 - ry * f * 0.98, rx * Math.sqrt(1 - f * f), Math.max(2, ry * 0.1 * (1 - f)), 0, 0, Math.PI); c.stroke(); }
  for (k = -3; k <= 3; k++) { c.beginPath(); c.moveTo(cx + k * rx / 3.4, base - 3); c.quadraticCurveTo(cx + k * rx / 4.2, base - 3 - ry * 0.75, cx + k * rx / 12, top + 2); c.stroke(); }
  for (k = -3; k < 3; k++) { c.beginPath(); c.moveTo(cx + k * rx / 3.4, base - 3); c.lineTo(cx + (k + 1) * rx / 4.2, base - 3 - ry * 0.45); c.stroke(); }
  var sh = c.createLinearGradient(cx - rx, top, cx, base);
  sh.addColorStop(0, 'rgba(255,255,255,0.55)'); sh.addColorStop(0.35, 'rgba(255,255,255,0.08)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sh; c.fillRect(cx - rx, top, rx, ry);
  c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.ellipse(cx - rx * 0.5, base - ry * 0.62, 4, 14, 0.55, 0, Math.PI * 2); c.fill();
  c.restore();
  dome(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  /* the lantern on top, with its beacon; the glass doors */
  rr(c, cx - 6, top - 7, 12, 9, 3); fillStroke(c, '#f4f6fb', INK, 1.4);
  circle(c, cx, top - 10, 3.4); fillStroke(c, free ? '#9aa3b2' : '#b98cff', INK, 1.1);
  var dx = ((o.doorX || 0) - (o.x || 0)) * T + T / 2;
  c.beginPath(); c.moveTo(dx - 11, base - 1); c.lineTo(dx - 11, base - 22); c.quadraticCurveTo(dx, base - 30, dx + 11, base - 22); c.lineTo(dx + 11, base - 1); c.closePath();
  c.fillStyle = free ? 'rgba(220,226,240,.6)' : 'rgba(225,212,255,.75)'; c.fill(); c.strokeStyle = INK; c.lineWidth = 1.6; c.stroke();
  c.beginPath(); c.moveTo(dx, base - 1); c.lineTo(dx, base - 26); c.stroke();
  if (free) whiteFlag(c, cx, top - 12);
  sign(c, P, o, w, base + 1);
}

/* ---------- Costanzo: the palace of the people ---------- */
function costanzo(c: Ctx, w: number, h: number, P: Palette, o: CovoOpts, free: boolean) {
  var up = o.up || T * 2.8, base = h - 4, marble = free ? '#d9d6cc' : '#f6f0de', marble2 = free ? '#c2beb2' : '#e2d8bb', gold = free ? '#bdb7a0' : '#ffd23f';
  ell(c, w / 2, base + 2, w / 2 + 6, 7); c.fillStyle = P.shadow; c.fill();
  /* three steps across the front */
  for (var k = 0; k < 3; k++) { rr(c, 2 + k * 4, base - 4 - k * 4, w - 4 - k * 8, 5, 1); fillStroke(c, marble2, INK, 1.4); }
  /* the body, the columns, the pediment with its motto */
  var top = h - T * 2.2;
  rr(c, 10, top, w - 20, base - 12 - top, 1); fillStroke(c, marble, INK, 2);
  var n = 6, cw = (w - 36) / n;
  for (k = 0; k < n; k++) { var cx = 18 + k * cw + cw / 2; rr(c, cx - 4, top + 6, 8, base - 18 - top - 6, 2); fillStroke(c, '#fffdf6', INK, 1.3); c.strokeStyle = marble2; c.lineWidth = 1; c.beginPath(); c.moveTo(cx - 1.5, top + 9); c.lineTo(cx - 1.5, base - 16); c.moveTo(cx + 1.5, top + 9); c.lineTo(cx + 1.5, base - 16); c.stroke(); }
  rr(c, 6, top - 6, w - 12, 8, 1); fillStroke(c, marble2, INK, 1.6);
  poly(c, [[6, top - 6], [w - 6, top - 6], [w / 2, -up + 10]]); fillStroke(c, marble, INK, 2);
  c.fillStyle = INK; c.font = '10px "Lilita One", "Arial Rounded MT Bold", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('GIÀ LO SAI', w / 2, top - 15);
  /* the balcony with the microphone, the flags on poles */
  rr(c, w / 2 - 18, top + 14, 36, 6, 1); fillStroke(c, marble2, INK, 1.3);
  c.strokeStyle = INK; c.lineWidth = 1.4; c.beginPath(); c.moveTo(w / 2, top + 14); c.lineTo(w / 2, top + 2); c.stroke(); circle(c, w / 2, top + 1, 2.4); fillStroke(c, '#3c4658', INK, 1);
  [16, w - 16].forEach(function (x, i) {
    c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x, top - 6); c.lineTo(x, -up - 4); c.stroke();
    if (free && i) return;
    poly(c, [[x, -up - 4], [x + (i ? -18 : 18), -up], [x, -up + 6]]); fillStroke(c, free ? '#fffdf6' : gold, INK, 1.2);
  });
  var dx = ((o.doorX || 0) - (o.x || 0)) * T + T / 2;
  /* the red carpet down the steps, and two banners of the rally between the columns */
  poly(c, [[dx - 8, base - 12], [dx + 8, base - 12], [dx + 11, base], [dx - 11, base]]); fillStroke(c, free ? '#a08a8a' : '#b3202f', INK, 1.1);
  [w * 0.22, w * 0.78].forEach(function (bx) { poly(c, [[bx - 6, top + 8], [bx + 6, top + 8], [bx + 6, top + 30], [bx, top + 26], [bx - 6, top + 30]]); fillStroke(c, free ? '#e6e2d6' : gold, INK, 1.1); c.fillStyle = INK; c.font = '8px "Lilita One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('C', bx, top + 17); });
  door(c, dx - 9, base - 30, 18, 20, '#6b4a2e', free ? null : '#ffd23f');
  sign(c, P, o, w, base - 40);
}

/* ---------- Zendavid: the temple of speakers ---------- */
function speaker(c: Ctx, x: number, y: number, sw: number, sh: number, on: boolean) {
  rr(c, x, y, sw, sh, 3); fillStroke(c, '#1f1b2b', INK, 1.6);
  var r = Math.min(sw, sh) * 0.32;
  circle(c, x + sw / 2, y + sh * 0.62, r); fillStroke(c, '#3a3350', INK, 1.2); circle(c, x + sw / 2, y + sh * 0.62, r * 0.35); fillStroke(c, on ? '#ff7ad9' : '#6a6475', INK, 1);
  circle(c, x + sw / 2, y + sh * 0.2, r * 0.4); fillStroke(c, '#3a3350', INK, 1);
}
/* ---------- Zendavid: the temple of the bass ----------
   Redrawn (13 November 2026, «bruttissimo»): a temple, really. A stage of black stone edged with neon; four columns that
   are towers of speakers; between them the bars of an equaliser; on the architrave the name; in the pediment a great
   woofer like a rose window; on the roof a vinyl record standing on its edge, the tone arm over it */
function zendavid(c: Ctx, w: number, h: number, P: Palette, o: CovoOpts, free: boolean) {
  var up = o.up || T * 3.2, base = h - 4, on = !free, pink = on ? '#ff7ad9' : '#8a8494', cyan = on ? '#5fe1ff' : '#8a96a0';
  ell(c, w / 2, base + 2, w / 2 + 6, 7); c.fillStyle = P.shadow; c.fill();
  /* the stage, three steps, neon on the edges */
  for (var k = 0; k < 3; k++) { rr(c, 2 + k * 3, base - 5 - k * 4, w - 4 - k * 6, 6, 1.5); fillStroke(c, '#241d33', INK, 1.4); c.strokeStyle = k % 2 ? cyan : pink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(4 + k * 3, base - 5 - k * 4); c.lineTo(w - 4 - k * 3, base - 5 - k * 4); c.stroke(); }
  var floor = base - 14, colTop = h - T * 1.9 - up * 0.25, colW = Math.min(14, (w - 20) / 6.5);
  /* the cella behind the columns: dark, with the equaliser glowing */
  rr(c, 10, colTop + 8, w - 20, floor - colTop - 8, 1); fillStroke(c, '#160f22', INK, 1.6);
  var bars = 9;
  for (k = 0; k < bars; k++) {
    var bh = (floor - colTop - 22) * (0.25 + 0.75 * Math.abs(Math.sin(k * 1.7 + 0.6))), bx = 18 + k * (w - 36) / bars;
    for (var j = 0; j < 6; j++) { var yy = floor - 4 - j * 5; if (floor - 4 - yy > bh) break; c.fillStyle = j > 3 ? pink : j > 1 ? '#ffd166' : cyan; c.globalAlpha = on ? 0.95 : 0.4; c.fillRect(bx, yy - 3, (w - 36) / bars - 3, 3.4); }
  }
  c.globalAlpha = 1;
  /* the four columns: towers of speakers, a capital on each */
  [0, 1, 2, 3].forEach(function (i) {
    var cx = 12 + i * (w - 24 - colW) / 3;
    var cells = 3, ch = (floor - colTop - 6) / cells;
    for (var q = 0; q < cells; q++) speaker(c, cx, colTop + 6 + q * ch, colW, ch - 1, on);
    rr(c, cx - 3, colTop, colW + 6, 7, 1.5); fillStroke(c, '#2a1840', INK, 1.3);
  });
  /* the architrave and the pediment with its woofer */
  rr(c, 4, colTop - 12, w - 8, 12, 1.5); fillStroke(c, '#2a1840', INK, 1.8);
  c.strokeStyle = pink; c.lineWidth = 2; c.beginPath(); c.moveTo(7, colTop - 3); c.lineTo(w - 7, colTop - 3); c.stroke();
  var pTop = colTop - 54;
  poly(c, [[2, colTop - 12], [w - 2, colTop - 12], [w / 2, pTop]]); fillStroke(c, '#241d33', INK, 2);
  c.strokeStyle = cyan; c.lineWidth = 1.6; c.beginPath(); c.moveTo(8, colTop - 15); c.lineTo(w / 2, pTop + 5); c.lineTo(w - 8, colTop - 15); c.stroke();
  var wr = Math.min(16, (colTop - 12 - pTop) * 0.36), wy = colTop - 12 - (colTop - 12 - pTop) * 0.38;
  circle(c, w / 2, wy, wr); fillStroke(c, '#141018', INK, 1.6); circle(c, w / 2, wy, wr * 0.62); fillStroke(c, '#3a3350', INK, 1.2); circle(c, w / 2, wy, wr * 0.25); fillStroke(c, pink, INK, 1);
  /* the record on the roof, standing on its edge, and the tone arm */
  var vr = 15, vy = pTop - vr + 4;
  circle(c, w / 2, vy, vr); fillStroke(c, '#0f0c14', INK, 1.8);
  c.strokeStyle = '#2e2838'; c.lineWidth = 1; [6, 9, 12].forEach(function (r) { c.beginPath(); c.arc(w / 2, vy, r, 0, Math.PI * 2); c.stroke(); });
  circle(c, w / 2, vy, 4.5); fillStroke(c, pink, INK, 1); circle(c, w / 2, vy, 1); c.fillStyle = INK; c.fill();
  c.strokeStyle = '#d7dde6'; c.lineWidth = 2; c.beginPath(); c.moveTo(w / 2 + vr + 4, vy - vr + 2); c.lineTo(w / 2 + vr - 2, vy - 2); c.lineTo(w / 2 + 6, vy + 3); c.stroke();
  if (on) {
    /* two stage lights crossing over the roof */
    c.globalAlpha = 0.22; c.fillStyle = pink; poly(c, [[10, colTop - 10], [16, colTop - 10], [w / 2 + 10, -up - 40], [w / 2 - 14, -up - 40]]); c.fill();
    c.fillStyle = cyan; poly(c, [[w - 16, colTop - 10], [w - 10, colTop - 10], [w / 2 + 14, -up - 40], [w / 2 - 10, -up - 40]]); c.fill(); c.globalAlpha = 1;
  }
  var dx = ((o.doorX || 0) - (o.x || 0)) * T + T / 2;
  rr(c, dx - 9, floor - 22, 18, 22, 2); fillStroke(c, '#2a1840', INK, 1.6);
  if (on) { c.fillStyle = pink; c.globalAlpha = 0.45; c.fillRect(dx - 7, floor - 20, 14, 18); c.globalAlpha = 1; }
  if (free) whiteFlag(c, w / 2 + vr + 6, vy);
  sign(c, P, o, w, colTop - 6);
}

/* ---------- Forchetta: the dome like a tennis ball ---------- */
function forchetta(c: Ctx, w: number, h: number, P: Palette, o: CovoOpts, free: boolean) {
  var up = o.up || T * 2.6, base = h - 4, ball = free ? '#c8cf9a' : '#d7f04a', ball2 = free ? '#b0b884' : '#b9d22e';
  ell(c, w / 2, base + 2, w / 2 + 4, 7); c.fillStyle = P.shadow; c.fill();
  rr(c, 4, h - T * 1.3, w - 8, T * 1.3 - 4, 2); fillStroke(c, '#c96a3c', INK, 2);
  c.strokeStyle = '#fffdf6'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(6, h - T * 0.9); c.lineTo(w - 6, h - T * 0.9); c.stroke();
  var cy = h - T * 1.3, r = (w - 12) / 2, ry = Math.min(up + T * 0.2, r);
  c.beginPath(); c.moveTo(6, cy); c.ellipse(w / 2, cy, r, ry, 0, Math.PI, 0); c.closePath();
  var g = c.createLinearGradient(0, cy - ry, 0, cy); g.addColorStop(0, ball); g.addColorStop(1, ball2); c.fillStyle = g; c.fill(); c.strokeStyle = INK; c.lineWidth = 2; c.stroke();
  /* the white seam of the ball */
  c.save(); c.beginPath(); c.moveTo(6, cy); c.ellipse(w / 2, cy, r, ry, 0, Math.PI, 0); c.closePath(); c.clip();
  c.strokeStyle = '#fffdf6'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(w * 0.18, cy); c.bezierCurveTo(w * 0.32, cy - ry * 0.9, w * 0.68, cy - ry * 0.2, w * 0.82, cy - ry * 1.1); c.stroke();
  c.restore();
  /* the net drawn along the base, and a racket as tall as the dome leaning on its side */
  c.strokeStyle = 'rgba(255,253,246,.55)'; c.lineWidth = 0.8;
  for (var nx = 8; nx < w - 6; nx += 5) { c.beginPath(); c.moveTo(nx, h - T * 1.25); c.lineTo(nx, h - T * 0.95); c.stroke(); }
  c.save(); c.translate(w - 14, base - 4); c.rotate(-0.35);
  c.strokeStyle = INK; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -26); c.stroke();
  ell(c, 0, -44, 12, 18); fillStroke(c, free ? '#9ab0c8' : '#5fb8ff', INK, 1.8);
  c.strokeStyle = '#fffdf6'; c.lineWidth = 0.8; for (var q = -2; q <= 2; q++) { c.beginPath(); c.moveTo(q * 4.5, -58); c.lineTo(q * 4.5, -30); c.moveTo(-10, -44 + q * 6); c.lineTo(10, -44 + q * 6); c.stroke(); }
  c.restore();
  var dx = ((o.doorX || 0) - (o.x || 0)) * T + T / 2;
  door(c, dx - 10, base - 22, 20, 22, '#6b4a2e', free ? null : '#5fb8ff');
  if (free) whiteFlag(c, w / 2, cy - ry);
  sign(c, P, o, w, cy + 8);
}

const LOOKS: Record<string, (c: Ctx, w: number, h: number, P: Palette, o: CovoOpts, free: boolean) => void> = { claudia, valentin, andrea, antonio, costanzo, zendavid, forchetta };
/** a covo, as the map shows it (objects.ts OBJ.covo; the home of the one played is drawn as a home there) */
export function covo(c: Ctx, w: number, h: number, P: Palette, o: CovoOpts) {
  var f = LOOKS[o.look || ''] || claudia, free = o.state === 'beaten' || o.state === 'mine';
  f(c, w, h, P, o, free);
  /* once its keeper is free the covo looks tired: its colours fade, as after a party */
  if (o.state === 'beaten') { c.save(); c.globalCompositeOperation = 'source-atop'; c.fillStyle = 'rgba(150,150,160,0.22)'; c.fillRect(-10, -(o.up || T * 5) - 40, w + 20, h + (o.up || T * 5) + 60); c.restore(); }
}

/* ---------- the aura: drawn each frame around the covi that are still to be beaten ---------- */
export interface AuraAt { x: number; y: number; w: number; h: number; up: number; look: string; next: boolean }
/** under the building: a glow on the ground, stronger and pulsing when the covo is the next stop */
export function auraBack(c: Ctx, a: AuraAt, now: number, still: boolean, plain: boolean) {
  var col = AURA[a.look] || '#ffffff', cx = a.x + a.w / 2, cy = a.y + a.h - 6, pulse = still ? 0.6 : 0.5 + 0.5 * Math.sin(now / (a.next ? 420 : 900));
  var R = Math.max(a.w, a.h) * (a.next ? 1.05 : 0.8) + (a.next ? pulse * 14 : 0);
  var g = c.createRadialGradient(cx, cy, 6, cx, cy, R);
  g.addColorStop(0, hexA(col, (a.next ? 0.55 : 0.28) * (plain ? 0.7 : 1)));
  g.addColorStop(1, hexA(col, 0));
  c.fillStyle = g; c.beginPath(); c.ellipse(cx, cy, R, R * 0.55, 0, 0, Math.PI * 2); c.fill();
  if (a.next) {
    /* the ring on the ground, as a magic circle */
    c.strokeStyle = hexA(col, 0.6 + 0.3 * pulse); c.lineWidth = 2.5; c.setLineDash([8, 6]); c.lineDashOffset = still ? 0 : -now / 60;
    c.beginPath(); c.ellipse(cx, cy, a.w / 2 + 16, (a.w / 2 + 16) * 0.4, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
  }
}
/** in front: the motes that rise from it, and the pillar of light over the next one */
export function auraFront(c: Ctx, a: AuraAt, now: number, still: boolean, plain: boolean) {
  var col = AURA[a.look] || '#ffffff', cx = a.x + a.w / 2, top = a.y - a.up;
  if (a.next && !plain) {
    var g = c.createLinearGradient(0, top - 260, 0, top + 30), pulse = still ? 0.7 : 0.55 + 0.45 * Math.sin(now / 500);
    g.addColorStop(0, hexA(col, 0)); g.addColorStop(0.7, hexA(col, 0.22 * pulse)); g.addColorStop(1, hexA(col, 0.4 * pulse));
    c.fillStyle = g; c.fillRect(cx - a.w * 0.22, top - 260, a.w * 0.44, 290);
  }
  if (plain) return;
  var n = a.next ? 22 : 8;
  for (var k = 0; k < n; k++) {
    var sx = hash(k, a.x, 31), sp = 0.5 + hash(k, a.y, 32), t = still ? sx : ((now / (2600 / sp)) + hash(k, 3, 33)) % 1;
    var x = a.x - 8 + sx * (a.w + 16) + Math.sin(t * 6.28 + k) * 6, y = a.y + a.h - t * (a.h + a.up + (a.next ? 70 : 30));
    c.globalAlpha = (1 - t) * (a.next ? 0.95 : 0.6); c.fillStyle = col;
    /* every third mote is something of the keeper's: a note, a bat, a number, a leaf of mist, confetti, a ball, a star */
    if (k % 3 === 0) mote(c, a.look, x, y, t, col);
    else { circle(c, x, y, 1.6 + hash(k, 9, 34) * (a.next ? 2.6 : 1.6)); c.fill(); }
  }
  c.globalAlpha = 1;
}
function mote(c: Ctx, look: string, x: number, y: number, t: number, col: string) {
  c.save(); c.translate(x, y);
  if (look === 'zendavid') { c.font = '15px "Lilita One", sans-serif'; c.textAlign = 'center'; c.fillText(t > 0.5 ? '♪' : '♫', 0, 0); }
  else if (look === 'claudia') { c.globalAlpha *= 0.9; bat(c, 0, 0, 0.55); }
  else if (look === 'andrea') { c.font = '700 11px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.fillText(['6', '%', '1/6', 'σ'][Math.floor(t * 4) % 4], 0, 0); }
  else if (look === 'valentin') { c.globalAlpha *= 0.5; ell(c, 0, 0, 14, 5); c.fill(); }
  else if (look === 'costanzo') { c.rotate(t * 9); c.fillRect(-3, -1.5, 6, 3); }
  else if (look === 'forchetta') { circle(c, 0, 0, 3.2); c.fillStyle = '#d7f04a'; c.fill(); c.strokeStyle = '#fffdf6'; c.lineWidth = 0.8; c.beginPath(); c.arc(-2, 0, 2.6, -0.9, 0.9); c.stroke(); }
  else { c.beginPath(); for (var i = 0; i < 10; i++) { var r = i % 2 ? 1.4 : 3.6, a = -Math.PI / 2 + i * Math.PI / 5; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fillStyle = '#ffffff'; c.fill(); }
  void col;
  c.restore();
}
function hexA(hex: string, a: number): string {
  var n = parseInt(hex.slice(1), 16);
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a.toFixed(3) + ')';
}

/* ---------- inside: the mood of each covo, over the floor and the people ---------- */
export function ambience(c: Ctx, theme: string, view: { x: number; y: number; w: number; h: number }, now: number, still: boolean, plain: boolean) {
  var col = AURA[theme] || '#ffffff', X = view.x, Y = view.y, W = view.w, H = view.h;
  /* a vignette in the keeper's colour */
  var g = c.createRadialGradient(X + W / 2, Y + H / 2, Math.min(W, H) * 0.3, X + W / 2, Y + H / 2, Math.max(W, H) * 0.75);
  var dark = theme === 'claudia' ? 0.38 : theme === 'zendavid' ? 0.22 + (still ? 0 : 0.1 * Math.max(0, Math.sin(now / 625 * Math.PI))) : 0.2;
  g.addColorStop(0, hexA(col, 0)); g.addColorStop(1, hexA(theme === 'claudia' ? '#3a0008' : col, dark));
  c.fillStyle = g; c.fillRect(X, Y, W, H);
  if (plain) return;
  var k, n = 26;
  for (k = 0; k < n; k++) {
    var px = hash(k, 1, 51), sp = 0.4 + hash(k, 2, 52), t = still ? hash(k, 3, 53) : ((now / (5200 / sp)) + hash(k, 4, 54)) % 1;
    var x = X + px * W, y: number;
    c.globalAlpha = 0.65 * Math.sin(t * Math.PI);
    if (theme === 'claudia') { y = Y + H - t * H; c.fillStyle = k % 3 ? '#ff6a3d' : '#ffd166'; circle(c, x + Math.sin(t * 9 + k) * 6, y, 1.6); c.fill(); }
    else if (theme === 'valentin') { y = Y + hash(k, 5, 55) * H; c.fillStyle = '#9dffb8'; c.globalAlpha *= 0.35; ell(c, x + (still ? 0 : (t - 0.5) * 80), y, 34, 12); c.fill(); }
    else if (theme === 'andrea') { y = Y + H - t * H; c.fillStyle = '#4fd1a5'; c.font = '700 12px ui-monospace, Menlo, monospace'; c.fillText(['0', '1', '6', '%', 'σ', '3,5', '1/36'][k % 7], x, y); }
    else if (theme === 'antonio') { y = Y + hash(k, 5, 55) * H; c.fillStyle = '#c9b6ff'; circle(c, x, y + (still ? 0 : Math.sin(now / 700 + k) * 4), 1.4); c.fill(); }
    else if (theme === 'costanzo') { y = Y + t * H; c.fillStyle = ['#ffd23f', '#fffdf6', '#e8473a'][k % 3]; c.save(); c.translate(x + Math.sin(t * 8 + k) * 10, y); c.rotate(t * 6 + k); c.fillRect(-3, -1.5, 6, 3); c.restore(); }
    else if (theme === 'zendavid') { y = Y + H - t * H; c.fillStyle = '#ff7ad9'; c.font = '16px "Lilita One", sans-serif'; c.fillText(k % 2 ? '♪' : '♫', x, y); }
    else { y = Y + H - t * H; c.fillStyle = '#d7f04a'; circle(c, x, y, 2.2); c.fill(); }
  }
  c.globalAlpha = 1;
}

/* ---------- the things inside the covi (ground objects `covo-prop`, on the `@` tiles of data/maps/covi.ts) ---------- */
export function covoProp(c: Ctx, o: { x: number; y: number; w?: number; h?: number; text?: string }, P: Palette) {
  var w = (o.w || 1) * T, h = (o.h || 1) * T, k: number, t = o.text || '';
  c.save(); c.translate(o.x * T + w / 2, o.y * T + h / 2); c.lineCap = 'round'; c.lineJoin = 'round';
  ell(c, 0, h / 2 - 4, Math.min(w, h * 2) / 2 - 4, 3.5); c.fillStyle = P.shadow; c.fill();
  var X = -w / 2, Y = -h / 2;
  switch (t) {
    case 'throne':
      rr(c, -16, Y - 6, 32, h + 2, 4); fillStroke(c, '#7a1020', INK, 1.8);
      poly(c, [[-16, Y - 6], [-22, Y - 16], [-12, Y - 4]]); fillStroke(c, '#140f1c', INK, 1.2); poly(c, [[16, Y - 6], [22, Y - 16], [12, Y - 4]]); fillStroke(c, '#140f1c', INK, 1.2);
      rr(c, -20, 2, 40, 10, 2); fillStroke(c, '#3a1020', INK, 1.5); rr(c, -10, Y + 2, 20, 18, 3); fillStroke(c, '#b02040', INK, 1.2);
      break;
    case 'organ':
      for (k = 0; k < 7; k++) { var ph = 10 + (k % 4) * 5; rr(c, X + 4 + k * (w - 8) / 7, 8 - ph * 1.4, (w - 8) / 7 - 2, ph * 1.4 + 2, 2); fillStroke(c, '#c9b06a', INK, 1); }
      rr(c, X + 2, 8, w - 4, 8, 2); fillStroke(c, '#2e2638', INK, 1.4);
      break;
    case 'candles':
      [[-7, 2, 14], [0, -2, 20], [7, 3, 12]].forEach(function (q) { rr(c, q[0] - 2.5, q[1] - q[2] / 2, 5, q[2], 1); fillStroke(c, '#efe6d2', INK, 1); ell(c, q[0], q[1] - q[2] / 2 - 4, 2, 3.4); c.fillStyle = '#ff9a3d'; c.fill(); });
      rr(c, -11, 8, 22, 4, 1); fillStroke(c, '#c9b06a', INK, 1);
      break;
    case 'gargoyle':
      rr(c, -9, 0, 18, 12, 2); fillStroke(c, '#5b5566', INK, 1.4);
      ell(c, 0, -6, 9, 8); fillStroke(c, '#5b5566', INK, 1.4); poly(c, [[-8, -10], [-12, -18], [-4, -12]]); fillStroke(c, '#5b5566', INK, 1); poly(c, [[8, -10], [12, -18], [4, -12]]); fillStroke(c, '#5b5566', INK, 1);
      c.fillStyle = '#ff3d3d'; circle(c, -3, -7, 1.4); c.fill(); circle(c, 3, -7, 1.4); c.fill();
      break;
    case 'bat': bat(c, 0, -4, 1.3); break;
    case 'cauldron':
      ell(c, 0, 0, 12, 9); fillStroke(c, '#1f1928', INK, 1.6); ell(c, 0, -6, 11, 4); fillStroke(c, '#5f2a6a', INK, 1.2);
      c.fillStyle = '#c9a0ff'; [[-4, -9], [3, -11], [6, -8]].forEach(function (b) { circle(c, b[0], b[1], 1.8); c.fill(); });
      break;
    case 'seat':
      rr(c, -10, -12, 20, 22, 3); fillStroke(c, '#3a1020', INK, 1.4); rr(c, -7, -9, 14, 7, 2); fillStroke(c, '#b02040', INK, 1);
      break;
    case 'telescope':
      c.save(); c.rotate(-0.5); rr(c, -6, -20, 12, 30, 3); fillStroke(c, '#dfe3f0', INK, 1.5); rr(c, -7, -22, 14, 5, 2); fillStroke(c, '#2b2f5e', INK, 1.2); c.restore();
      c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 2); c.lineTo(-9, 13); c.moveTo(0, 2); c.lineTo(9, 13); c.moveTo(0, 2); c.lineTo(0, 13); c.stroke();
      break;
    case 'server':
      for (k = 0; k < Math.max(1, Math.round(w / T)); k++) { var sx = X + 3 + k * T; rr(c, sx, Y - 8, T - 6, h + 4, 2); fillStroke(c, '#2b2f3e', INK, 1.4); for (var j = 0; j < 4; j++) { rr(c, sx + 3, Y - 4 + j * 8, T - 12, 5, 1); fillStroke(c, '#3c4658', INK, 0.8); c.fillStyle = (j + k) % 2 ? '#57c968' : '#b98cff'; circle(c, sx + T - 12, Y - 1.5 + j * 8, 1.2); c.fill(); } }
      break;
    case 'screens':
      rr(c, -12, -12, 24, 16, 2); fillStroke(c, '#2b2f5e', INK, 1.4); c.strokeStyle = '#b98cff'; c.lineWidth = 1; c.beginPath(); for (k = 0; k < 6; k++) c.lineTo(-9 + k * 3.6, -4 - Math.sin(k) * 4); c.stroke();
      rr(c, -3, 4, 6, 6, 1); fillStroke(c, '#3c4658', INK, 1);
      break;
    case 'hologram':
      ell(c, 0, h / 2 - 10, 18, 6); fillStroke(c, '#2b2f5e', INK, 1.4);
      c.strokeStyle = '#c9b6ff'; c.lineWidth = 1.4; c.globalAlpha = 0.85;
      for (k = 0; k < 3; k++) { c.beginPath(); c.ellipse(0, -6, 16, 6 + k * 5, k * 0.6, 0, Math.PI * 2); c.stroke(); }
      circle(c, 0, -6, 6); c.fillStyle = 'rgba(185,140,255,.5)'; c.fill(); c.globalAlpha = 1;
      break;
    case 'robot-arm':
      rr(c, -8, 6, 16, 6, 2); fillStroke(c, '#3c4658', INK, 1.3);
      c.strokeStyle = '#ffb547'; c.lineWidth = 5; c.beginPath(); c.moveTo(0, 6); c.lineTo(-4, -6); c.lineTo(8, -12); c.stroke(); c.strokeStyle = INK; c.lineWidth = 1.2; c.stroke();
      circle(c, -4, -6, 2.6); fillStroke(c, '#3c4658', INK, 1);
      break;
    case 'rocket':
      poly(c, [[-5, 10], [5, 10], [5, -10], [0, -20], [-5, -10]]); fillStroke(c, '#fffdf6', INK, 1.4);
      poly(c, [[-5, 2], [-11, 12], [-5, 10]]); fillStroke(c, '#e8473a', INK, 1); poly(c, [[5, 2], [11, 12], [5, 10]]); fillStroke(c, '#e8473a', INK, 1);
      circle(c, 0, -6, 2.6); fillStroke(c, '#5fb8ff', INK, 1);
      break;
    case 'whiteboard': case 'chalkboard':
      rr(c, X + 3, -14, w - 6, 22, 2); fillStroke(c, t === 'whiteboard' ? '#fbfbf5' : '#1f3b33', INK, 1.6);
      c.strokeStyle = t === 'whiteboard' ? '#5b6cff' : '#fbfbf5'; c.lineWidth = 1.4; c.beginPath();
      if (t === 'chalkboard') { for (k = 0; k <= 30; k++) { var u = (k - 15) / 5, bx = u * (w / 8), by = 4 - 14 * Math.exp(-u * u / 2); if (!k) c.moveTo(bx, by); else c.lineTo(bx, by); } }
      else { c.moveTo(X + 8, -6); c.lineTo(X + 14, -9); c.lineTo(X + 20, -4); c.moveTo(X + 8, 2); c.lineTo(w / 2 - 8, 2); }
      c.stroke();
      break;
    case 'pad':
      break;
    case 'dancefloor':
      /* the lit squares of the dance floor, in the colours of the temple */
      for (var dy = 0; dy < (o.h || 1) * 2; dy++) for (var dx = 0; dx < (o.w || 1) * 2; dx++) {
        c.fillStyle = ['#ff7ad9', '#5fe1ff', '#ffd166', '#7c4dff'][(dx * 3 + dy * 5 + o.x) % 4]; c.globalAlpha = (dx + dy) % 2 ? 0.5 : 0.22;
        c.fillRect(X + dx * T / 2 + 1, Y + dy * T / 2 + 1, T / 2 - 2, T / 2 - 2);
      }
      c.globalAlpha = 1;
      break;
    case 'mic':
      c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(0, 12); c.lineTo(0, -6); c.moveTo(-7, 12); c.lineTo(7, 12); c.stroke();
      rr(c, -3.5, -14, 7, 10, 3.5); fillStroke(c, '#3c4658', INK, 1.2);
      break;
    case 'dice':
      for (k = 0; k < Math.max(1, Math.round(w / T)); k++) die(c, X + T / 2 + k * T, 0, 16, 1 + ((o.x + k * 3 + o.y) % 6), (k ? 0.2 : -0.15), '#fbfbf5', '#1f8f6a');
      break;
    case 'abacus':
      rr(c, -12, -12, 24, 22, 2); fillStroke(c, '#8a5a2e', INK, 1.5);
      for (k = 0; k < 4; k++) { c.strokeStyle = INK; c.lineWidth = 1; c.beginPath(); c.moveTo(-10, -7 + k * 5); c.lineTo(10, -7 + k * 5); c.stroke(); for (var b = 0; b < 3; b++) { circle(c, -7 + b * 3 + (k % 2) * 6, -7 + k * 5, 1.8); c.fillStyle = ['#e8473a', '#4fd1a5', '#ffd166'][b]; c.fill(); } }
      break;
    case 'plot':
      rr(c, -12, -12, 24, 22, 2); fillStroke(c, '#fbfbf5', INK, 1.4);
      [4, 9, 14, 7].forEach(function (v, i) { c.fillStyle = '#4fd1a5'; c.fillRect(-9 + i * 5, 7 - v, 4, v); });
      break;
    case 'roulette':
      ell(c, 0, 0, w / 2 - 6, 11); fillStroke(c, '#2a6b3a', INK, 1.6); ell(c, 0, 0, 10, 7); fillStroke(c, '#7a1020', INK, 1.2);
      for (k = 0; k < 8; k++) { var aa = k * Math.PI / 4; c.strokeStyle = '#ffd166'; c.lineWidth = 1; c.beginPath(); c.moveTo(Math.cos(aa) * 3, Math.sin(aa) * 2); c.lineTo(Math.cos(aa) * 10, Math.sin(aa) * 7); c.stroke(); }
      circle(c, 4, -3, 1.6); c.fillStyle = '#fffdf6'; c.fill();
      break;
    case 'icons':
      rr(c, X + 2, -16, w - 4, 26, 2); fillStroke(c, '#c9a04a', INK, 1.6);
      for (k = 0; k < 3; k++) { var ix = X + 6 + k * (w - 12) / 3; rr(c, ix, -12, (w - 12) / 3 - 4, 18, 2); fillStroke(c, '#2f8f4e', INK, 1); circle(c, ix + ((w - 12) / 3 - 4) / 2, -6, 3); fillStroke(c, '#ffd166', INK, 0.8); }
      break;
    case 'loom':
      rr(c, X + 3, -12, w - 6, 20, 2); fillStroke(c, '#5a3a22', INK, 1.5);
      for (k = 0; k < 4; k++) { c.fillStyle = k % 2 ? '#e8473a' : '#1c2340'; poly(c, [[X + 10 + k * (w - 20) / 4, -2], [X + 10 + k * (w - 20) / 4 + 5, -8], [X + 10 + k * (w - 20) / 4 + 10, -2], [X + 10 + k * (w - 20) / 4 + 5, 4]]); c.fill(); }
      break;
    case 'brazier':
      rr(c, -8, 2, 16, 9, 2); fillStroke(c, '#3e2716', INK, 1.4);
      c.beginPath(); c.moveTo(-6, 2); c.quadraticCurveTo(-8, -10, -1, -18); c.quadraticCurveTo(1, -10, 4, -14); c.quadraticCurveTo(8, -6, 6, 2); c.closePath(); fillStroke(c, '#59e07a', INK, 1.2);
      c.beginPath(); c.moveTo(-2, 2); c.quadraticCurveTo(-3, -6, 0, -10); c.quadraticCurveTo(3, -4, 2, 2); c.closePath(); c.fillStyle = '#d9ffe2'; c.fill();
      break;
    case 'wolf':
      rr(c, -10, 6, 20, 5, 1); fillStroke(c, '#5a3a22', INK, 1.2);
      poly(c, [[-8, 6], [-6, -6], [-2, -10], [-4, -16], [0, -12], [4, -16], [3, -9], [7, -4], [8, 6]]); fillStroke(c, '#8a6a4a', INK, 1.4);
      c.fillStyle = INK; circle(c, -1, -8, 1); c.fill();
      break;
    case 'lectern':
      poly(c, [[-12, -10], [12, -10], [8, 10], [-8, 10]]); fillStroke(c, '#6b4a2e', INK, 1.6);
      rr(c, -14, -14, 28, 6, 1); fillStroke(c, '#8a5a2e', INK, 1.3);
      for (k = -1; k <= 1; k++) { c.strokeStyle = INK; c.lineWidth = 1.3; c.beginPath(); c.moveTo(k * 7, -14); c.lineTo(k * 9, -22); c.stroke(); circle(c, k * 9, -23, 2); fillStroke(c, '#3c4658', INK, 0.9); }
      c.fillStyle = '#ffd23f'; c.font = '9px "Lilita One", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('C', 0, 0);
      break;
    case 'flag':
      for (k = 0; k < Math.max(1, Math.round(w / T)); k++) { var fx = X + 8 + k * T; c.strokeStyle = INK; c.lineWidth = 1.6; c.beginPath(); c.moveTo(fx, 12); c.lineTo(fx, -20); c.stroke(); poly(c, [[fx, -20], [fx + 18, -16], [fx, -8]]); fillStroke(c, k % 2 ? '#fffdf6' : '#ffd23f', INK, 1.1); }
      break;
    case 'bust':
      rr(c, -7, 2, 14, 10, 1); fillStroke(c, '#d9d6cc', INK, 1.3);
      ell(c, 0, -8, 7, 8); fillStroke(c, '#f6f0de', INK, 1.4); poly(c, [[-10, 2], [10, 2], [6, -2], [-6, -2]]); fillStroke(c, '#f6f0de', INK, 1.2);
      break;
    case 'ballot':
      rr(c, -10, -8, 20, 18, 2); fillStroke(c, '#fbfbf5', INK, 1.5); rr(c, -6, -10, 12, 3, 1); fillStroke(c, INK, null);
      c.save(); c.translate(2, -12); c.rotate(0.2); rr(c, -4, -6, 8, 8, 1); fillStroke(c, '#ffd23f', INK, 1); c.restore();
      break;
    case 'megaphone':
      poly(c, [[-10, -3], [6, -10], [6, 8], [-10, 3]]); fillStroke(c, '#e8473a', INK, 1.5); rr(c, -13, -4, 4, 8, 1); fillStroke(c, '#3c4658', INK, 1);
      break;
    case 'decks':
      rr(c, X + 4, -12, w - 8, 22, 3); fillStroke(c, '#2a1840', INK, 1.6);
      [-1, 1].forEach(function (d) { circle(c, d * (w / 2 - 18), -1, 8.5); fillStroke(c, '#141018', INK, 1.2); circle(c, d * (w / 2 - 18), -1, 2.6); fillStroke(c, '#ff7ad9', INK, 0.8); });
      rr(c, -8, -8, 16, 14, 2); fillStroke(c, '#3a3350', INK, 1);
      break;
    case 'speakers':
      for (k = 0; k < Math.max(1, Math.round(w / T)); k++) speaker(c, X + 4 + k * T, Y - 10, T - 8, h + 6, true);
      break;
    case 'neon':
      c.strokeStyle = '#ff7ad9'; c.lineWidth = 3; c.globalAlpha = 0.9; c.beginPath(); c.moveTo(-10, -10); c.lineTo(-10, 8); c.lineTo(0, -4); c.lineTo(10, 8); c.lineTo(10, -10); c.stroke(); c.globalAlpha = 1;
      break;
    case 'vinyl':
      [0, 1, 2].forEach(function (i) { rr(c, -11 + i * 2, -12 + i * 3, 20, 20, 1); fillStroke(c, ['#2a1840', '#ff7ad9', '#fbfbf5'][i], INK, 1.2); });
      circle(c, 3, 3, 6); fillStroke(c, '#141018', INK, 1); circle(c, 3, 3, 1.6); fillStroke(c, '#ffd166', INK, 0.6);
      break;
    case 'ballmachine':
      rr(c, -10, -6, 20, 16, 3); fillStroke(c, '#3c4658', INK, 1.5); circle(c, 0, -8, 7); fillStroke(c, '#c9d6e8', INK, 1.2);
      c.fillStyle = '#d7f04a'; [[-3, -10], [2, -8], [-1, -6], [3, -11]].forEach(function (q) { circle(c, q[0], q[1], 2); c.fill(); });
      break;
    case 'ballbasket':
      rr(c, -10, -8, 20, 18, 2); fillStroke(c, '#9aa3b2', INK, 1.4);
      c.fillStyle = '#d7f04a'; for (k = 0; k < 7; k++) { circle(c, -7 + (k % 4) * 4.5, -9 + Math.floor(k / 4) * 3, 2.3); c.fill(); c.strokeStyle = INK; c.lineWidth = 0.6; c.stroke(); }
      break;
    case 'umpire':
      rr(c, -6, -20, 12, 8, 2); fillStroke(c, '#5fb8ff', INK, 1.3);
      c.strokeStyle = INK; c.lineWidth = 1.8; c.beginPath(); c.moveTo(-6, -12); c.lineTo(-9, 12); c.moveTo(6, -12); c.lineTo(9, 12); c.moveTo(-7, 0); c.lineTo(7, 0); c.stroke();
      break;
    case 'trophy':
      c.beginPath(); c.moveTo(-8, -12); c.lineTo(8, -12); c.quadraticCurveTo(7, 0, 0, 2); c.quadraticCurveTo(-7, 0, -8, -12); c.closePath(); fillStroke(c, '#ffd166', INK, 1.4);
      rr(c, -2, 2, 4, 6, 1); fillStroke(c, '#ffd166', INK, 1); rr(c, -7, 8, 14, 4, 1); fillStroke(c, '#6b4a2e', INK, 1.1);
      break;
    default:
      rr(c, -10, -10, 20, 20, 3); fillStroke(c, P['roof-b'], INK, 1.4);
  }
  c.restore();
}
