import type { Palette } from './palette';
import type { PersonLook } from './walkers';
import type { Dir } from '../../data/maps/types';
import { STICKER_INK, mk, rr, fillStroke, circle, ell, type Ctx } from './draw';

/* Nicola Spadea's van: a white panel van with a blue wave down its side, and on the roof rack his windsurf board and
   the rolled sail, as anyone who goes to Vindicio with the wind knows it. Seen from the side going left or right, from
   in front coming down, from behind going up; through the windows, Nicola at the wheel and whoever rides with him.
   Everything is drawn in a box of VAN_W × VAN_H px whose bottom is the ground under the wheels, centred on its tile.
   No brand on it: a drawing of that kind of van. */
export const VAN_W = 104, VAN_H = 84;
const ink = STICKER_INK;
const WHITE = '#f4f6f8', WHITE2 = '#d7dde6', BLUE = '#1f7fb5', GLASS = '#9fc6ef', BOARD = '#ffffff', FIN = '#ff8a3c', SAIL = '#e23a4f';

function line(c: Ctx, col: string, w: number, pts: number[][]) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.strokeStyle = col; c.lineWidth = w; c.stroke();
}
function tyre(c: Ctx, P: Palette, x: number, y: number, r: number) {
  circle(c, x, y, r); fillStroke(c, P.tyre, ink, 1.5);
  circle(c, x, y, r * 0.45); fillStroke(c, P.chrome, ink, 1);
}
/** a head in a window: hair, face, and for Nicola his ginger moustache; a laugh when he laughs */
function head(c: Ctx, L: PersonLook, x: number, y: number, r: number, laugh: boolean, side: boolean) {
  circle(c, x, y, r); fillStroke(c, L.skin, ink, 1.1);
  c.save(); circle(c, x, y, r); c.clip();
  c.fillStyle = L.hair.color; c.beginPath(); c.ellipse(x + (side ? r * 0.2 : 0), y - r * 0.75, r * 1.15, r * 0.7, 0, 0, Math.PI * 2); c.fill();
  if (L.beard) { c.fillStyle = L.beard; c.globalAlpha = 0.85; c.beginPath(); c.ellipse(x - (side ? r * 0.35 : 0), y + r * 0.42, r * (side ? 0.45 : 0.6), r * 0.2, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 0.35; c.beginPath(); c.ellipse(x, y + r * 0.7, r * 0.85, r * 0.45, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; }
  c.restore();
  if (L.mustache) { c.beginPath(); c.ellipse(x - (side ? r * 0.38 : 0), y + r * 0.36, r * (side ? 0.38 : 0.55), r * 0.16, 0, 0, Math.PI * 2); c.fillStyle = L.mustache; c.fill(); }
  c.fillStyle = ink;
  if (side) { circle(c, x - r * 0.45, y - r * 0.08, r * 0.13); c.fill(); }
  else { circle(c, x - r * 0.35, y - r * 0.08, r * 0.12); c.fill(); circle(c, x + r * 0.35, y - r * 0.08, r * 0.12); c.fill(); }
  if (laugh) { c.beginPath(); c.ellipse(x - (side ? r * 0.35 : 0), y + r * 0.6, r * 0.28, r * 0.2, 0, 0, Math.PI); c.fillStyle = '#7a1e2c'; c.fill(); }
}
/** the board and the sail on the roof rack, seen from the side (x0..x1 along the roof at height y) */
function rackSide(c: Ctx, x0: number, x1: number, y: number) {
  line(c, ink, 2, [[x0 + 6, y], [x0 + 6, y - 4]]); line(c, ink, 2, [[x1 - 6, y], [x1 - 6, y - 4]]);
  line(c, ink, 2.2, [[x0 + 2, y - 4], [x1 - 2, y - 4]]);
  c.beginPath(); c.moveTo(x0 - 6, y - 7); c.quadraticCurveTo(x0 - 10, y - 10, x0 - 2, y - 11); c.lineTo(x1 + 2, y - 11); c.quadraticCurveTo(x1 + 8, y - 9, x1 + 2, y - 6.5); c.closePath(); fillStroke(c, BOARD, ink, 1.4);
  line(c, BLUE, 1.6, [[x0, y - 9], [x1, y - 9]]);
  c.beginPath(); c.moveTo(x1 - 4, y - 6.5); c.lineTo(x1 - 1, y - 2.5); c.lineTo(x1 - 8, y - 6.5); c.closePath(); fillStroke(c, FIN, ink, 1);
  rr(c, x0 + 8, y - 16, x1 - x0 - 14, 5, 2.5); fillStroke(c, SAIL, ink, 1.3);
  line(c, '#ffd84d', 1.4, [[x0 + 14, y - 13.5], [x1 - 14, y - 13.5]]);
}
/** from the side, going left (the right is the same, mirrored) */
function side(c: Ctx, P: Palette, driver: PersonLook | null, rider: PersonLook | null, laugh: boolean) {
  ell(c, 52, 81, 46, 4); c.fillStyle = 'rgba(20,24,40,.22)'; c.fill();
  /* the body: a long box with the bonnet in front, low */
  c.beginPath(); c.moveTo(10, 64); c.lineTo(10, 54); c.quadraticCurveTo(10, 48, 16, 47); c.lineTo(24, 45); c.lineTo(32, 30); c.quadraticCurveTo(34, 26, 40, 26);
  c.lineTo(94, 26); c.quadraticCurveTo(99, 26, 99, 31); c.lineTo(99, 70); c.quadraticCurveTo(99, 74, 95, 74); c.lineTo(14, 74); c.quadraticCurveTo(10, 74, 10, 70); c.closePath(); fillStroke(c, WHITE, ink, 2);
  c.beginPath(); c.moveTo(12, 64); c.lineTo(97, 64); c.lineTo(97, 70); c.quadraticCurveTo(97, 72, 95, 72); c.lineTo(14, 72); c.quadraticCurveTo(12, 72, 12, 70); c.closePath(); c.fillStyle = WHITE2; c.fill();
  /* the wave down its side */
  c.beginPath(); c.moveTo(40, 60); c.quadraticCurveTo(52, 48, 64, 54); c.quadraticCurveTo(58, 58, 62, 62); c.quadraticCurveTo(76, 54, 98, 52); c.lineTo(98, 62); c.lineTo(40, 62); c.closePath(); c.fillStyle = BLUE; c.fill();
  line(c, '#ffffff', 1.6, [[52, 55], [58, 53]]);
  /* windscreen and the driver's window, with him at the wheel and whoever rides with him behind */
  c.beginPath(); c.moveTo(27, 45); c.lineTo(34, 31); c.quadraticCurveTo(35, 29.5, 37.5, 29.5); c.lineTo(44, 29.5); c.lineTo(44, 45); c.closePath(); fillStroke(c, GLASS, ink, 1.4);
  rr(c, 47, 29.5, 18, 15, 2.5); fillStroke(c, GLASS, ink, 1.4);
  if (driver) { c.save(); rr(c, 47, 29.5, 18, 15, 2.5); c.clip(); head(c, driver, 55, 38.5, 6.2, laugh, true); c.restore(); }
  if (rider) { rr(c, 68, 29.5, 13, 15, 2.5); fillStroke(c, GLASS, ink, 1.4); c.save(); rr(c, 68, 29.5, 13, 15, 2.5); c.clip(); head(c, rider, 75, 39, 5.6, false, true); c.restore(); }
  line(c, '#ffffff', 1.4, [[36, 33], [33, 39]]);
  /* door lines, the sliding door's rail, the handle, the mirror, the lights */
  line(c, ink, 1.1, [[45.5, 29], [45.5, 70]]); line(c, ink, 1.1, [[66, 29], [66, 70]]); line(c, ink, 1, [[67, 47.5], [97, 47.5]]);
  rr(c, 60, 49, 4, 1.8, 0.8); c.fillStyle = ink; c.fill();
  rr(c, 23, 40, 4, 5, 1); fillStroke(c, '#3a3f55', ink, 1);
  ell(c, 12.6, 56, 2.2, 3); fillStroke(c, P.beam, ink, 1);
  rr(c, 96, 50, 3, 7, 1); fillStroke(c, P.tail, ink, 0.9);
  /* wheels, in their arches */
  [24, 84].forEach(function (x) { c.beginPath(); c.arc(x, 72, 10.5, Math.PI, 0); c.fillStyle = '#2a2f40'; c.fill(); tyre(c, P, x, 74, 8.2); });
  rackSide(c, 44, 94, 26);
}
/** coming down, toward the viewer */
function front(c: Ctx, P: Palette, driver: PersonLook | null, rider: PersonLook | null, laugh: boolean) {
  ell(c, 52, 81, 30, 4); c.fillStyle = 'rgba(20,24,40,.22)'; c.fill();
  [28, 76].forEach(function (x) { rr(c, x - 6, 66, 12, 14, 3); fillStroke(c, P.tyre, ink, 1.4); });
  /* the roof with the board's nose over it, the cab, the bonnet */
  rr(c, 25, 14, 54, 10, 4); fillStroke(c, BOARD, ink, 1.4); line(c, BLUE, 1.6, [[30, 19], [74, 19]]);
  rr(c, 30, 8, 44, 7, 3.5); fillStroke(c, SAIL, ink, 1.3);
  c.beginPath(); c.moveTo(22, 74); c.lineTo(22, 32); c.quadraticCurveTo(22, 24, 30, 24); c.lineTo(74, 24); c.quadraticCurveTo(82, 24, 82, 32); c.lineTo(82, 74); c.closePath(); fillStroke(c, WHITE, ink, 2);
  rr(c, 27, 28, 50, 20, 4); fillStroke(c, GLASS, ink, 1.4);
  c.save(); rr(c, 27, 28, 50, 20, 4); c.clip(); if (driver) head(c, driver, 63, 39, 7, laugh, false); if (rider) head(c, rider, 41, 40, 6.5, false, false); c.restore();
  line(c, '#ffffff', 1.5, [[31, 31], [37, 31]]);
  c.beginPath(); c.moveTo(24, 50); c.lineTo(80, 50); c.lineTo(80, 64); c.quadraticCurveTo(52, 68, 24, 64); c.closePath(); c.fillStyle = WHITE2; c.fill(); c.strokeStyle = ink; c.lineWidth = 1.2; c.stroke();
  rr(c, 40, 54, 24, 7, 2); fillStroke(c, '#3a3f55', ink, 1.1);
  [30, 74].forEach(function (x) { ell(c, x, 57, 4.4, 3); fillStroke(c, P.beam, ink, 1.1); });
  rr(c, 23, 66, 58, 6, 2.5); fillStroke(c, '#5d6394', ink, 1.3);
  [18.5, 85.5].forEach(function (x) { rr(c, x - 3, 34, 6, 7, 1.5); fillStroke(c, '#3a3f55', ink, 1); });
}
/** going up, away from the viewer: the back doors, the board sticking out over them */
function back(c: Ctx, P: Palette) {
  ell(c, 52, 81, 30, 4); c.fillStyle = 'rgba(20,24,40,.22)'; c.fill();
  [28, 76].forEach(function (x) { rr(c, x - 6, 66, 12, 14, 3); fillStroke(c, P.tyre, ink, 1.4); });
  c.beginPath(); c.moveTo(22, 74); c.lineTo(22, 26); c.quadraticCurveTo(22, 20, 28, 20); c.lineTo(76, 20); c.quadraticCurveTo(82, 20, 82, 26); c.lineTo(82, 74); c.closePath(); fillStroke(c, WHITE, ink, 2);
  line(c, ink, 1.2, [[52, 22], [52, 70]]);
  rr(c, 27, 25, 21, 13, 2.5); fillStroke(c, GLASS, ink, 1.3); rr(c, 56, 25, 21, 13, 2.5); fillStroke(c, GLASS, ink, 1.3);
  c.beginPath(); c.moveTo(23, 56); c.quadraticCurveTo(40, 46, 52, 52); c.quadraticCurveTo(66, 58, 81, 50); c.lineTo(81, 62); c.lineTo(23, 62); c.closePath(); c.fillStyle = BLUE; c.fill();
  [25.5, 78.5].forEach(function (x) { rr(c, x - 2.5, 44, 5, 12, 1.5); fillStroke(c, P.tail, ink, 1); });
  rr(c, 23, 66, 58, 6, 2.5); fillStroke(c, '#5d6394', ink, 1.3);
  rr(c, 44, 64, 16, 4, 1); fillStroke(c, '#fbf8ef', ink, 0.9);
  /* the board, its tail and fin over the back */
  c.beginPath(); c.moveTo(36, 22); c.lineTo(36, 6); c.quadraticCurveTo(52, -2, 68, 6); c.lineTo(68, 22); c.closePath(); fillStroke(c, BOARD, ink, 1.4);
  line(c, BLUE, 1.6, [[52, 3], [52, 21]]);
  c.beginPath(); c.moveTo(50, 4); c.lineTo(52, -3); c.lineTo(54, 4); c.closePath(); fillStroke(c, FIN, ink, 1);
}
/** the van, with Nicola driving (laughing, maybe) and whoever rides with him, facing `dir`, at scale s */
export function vanSprite(P: Palette, s: number, dir: Dir, driver: PersonLook | null, rider: PersonLook | null, laugh: boolean, bob: number): HTMLCanvasElement {
  var cv = mk(VAN_W * s, VAN_H * s), c = cv.getContext('2d')!;
  c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  c.translate(0, bob);
  if (dir === 'right') { c.translate(VAN_W, 0); c.scale(-1, 1); }
  if (dir === 'left' || dir === 'right') side(c, P, driver, rider, laugh);
  else if (dir === 'down') front(c, P, driver, rider, laugh);
  else back(c, P);
  return cv;
}
