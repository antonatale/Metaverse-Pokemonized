import type { Palette } from './palette';
import type { PersonLook } from './walkers';
import type { Dir } from '../../data/maps/types';
import { STICKER_INK, mk, rr, fillStroke, circle, ell, type Ctx } from './draw';

/* The scooter: a blue Liberty with big wheels, a flat footboard and a top case behind the seat. Parked it is seen
   from the side, on its stand. Ridden, it is put together again at every frame: the scooter, whoever is played from
   the waist up (his own walking picture, cut at the hips), a leg on the footboard, the hands on the grips, and his
   creature on the seat behind him, in front of the top case.
   Everything is drawn in a box of 48 × 64 px whose bottom is the ground under the wheels; the scooter itself is
   designed in 44 × 42 px (OX, OY). No brand on it: it is a drawing of that kind of scooter, not of that one. */
export const MOTO_W = 48, MOTO_H = 64;
const OX = 2, OY = 21;
const ink = STICKER_INK;

function wheel(c: Ctx, P: Palette, x: number, y: number) {
  circle(c, x, y, 6.3); fillStroke(c, P.tyre, ink, 1.4);
  circle(c, x, y, 2.7); fillStroke(c, P.chrome, ink, 0.9);
}
function stroke(c: Ctx, color: string, w: number, pts: number[][]) {
  c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
  for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
  c.strokeStyle = color; c.lineWidth = w; c.stroke();
}
/** a limb: a thick line with its outline */
function limb(c: Ctx, color: string, w: number, pts: number[][]) { stroke(c, ink, w + 2.4, pts); stroke(c, color, w, pts); }
function topCase(c: Ctx, P: Palette, x: number, y: number, w: number, h: number) {
  rr(c, x, y, w, h, 2.6); fillStroke(c, P.case, ink, 1.4);
  stroke(c, P.case2, 1.2, [[x + 1.5, y + h * 0.36], [x + w - 1.5, y + h * 0.36]]);
}
/** from the side, heading left */
function side(c: Ctx, P: Palette, stand: boolean) {
  ell(c, 22, 40.6, 19, 3); c.fillStyle = 'rgba(20,24,40,.2)'; c.fill();
  /* exhaust, wheels, the mudguard and the fork of the front one */
  rr(c, 28, 33.6, 12.5, 3, 1.5); fillStroke(c, P.chrome, ink, 1.1);
  wheel(c, P, 8, 34.5); wheel(c, P, 35, 34.5);
  c.beginPath(); c.arc(8, 34.5, 8, Math.PI * 1.04, Math.PI * 1.96); c.arc(8, 34.5, 6.2, Math.PI * 1.96, Math.PI * 1.04, true); c.closePath(); fillStroke(c, P.moto, ink, 1.1);
  stroke(c, ink, 2.4, [[10.6, 27.5], [12.6, 17]]);
  if (stand) stroke(c, ink, 1.7, [[23, 33], [20.4, 40]]);
  /* the body under the seat, with its tail */
  c.beginPath(); c.moveTo(21.5, 31.6); c.lineTo(21, 23.4); c.quadraticCurveTo(21.4, 21.6, 23.6, 21.6); c.lineTo(39, 20.6); c.quadraticCurveTo(42.8, 21, 42.2, 25);
  c.lineTo(40.6, 29); c.quadraticCurveTo(36, 33.2, 30, 32.6); c.closePath(); fillStroke(c, P.moto, ink, 1.5);
  stroke(c, P.moto2, 1.3, [[24.5, 24.8], [38.6, 23.8]]);
  stroke(c, P.moto3, 1.1, [[25, 29.2], [37, 28.4]]);
  rr(c, 40.4, 22.4, 2.3, 2.7, 1); fillStroke(c, P.tail, ink, 0.8);
  /* the flat footboard, the leg shield with the headlight in it */
  rr(c, 14.5, 30, 10.5, 3, 1.2); fillStroke(c, P.case, ink, 1.1);
  c.beginPath(); c.moveTo(12, 13); c.quadraticCurveTo(9.4, 14, 9.4, 18); c.lineTo(10.8, 27); c.quadraticCurveTo(11.8, 31.4, 16, 32.2); c.lineTo(18.6, 32.2); c.lineTo(17.6, 15);
  c.quadraticCurveTo(17, 12.4, 14.5, 12.4); c.closePath(); fillStroke(c, P.moto, ink, 1.5);
  stroke(c, P.moto2, 1.3, [[12.6, 17], [13.8, 27.4]]);
  ell(c, 10.1, 16.6, 1.9, 2.7); fillStroke(c, P.beam, ink, 1);
  /* the seat; the rack with the top case, a reflector on its back */
  rr(c, 20.5, 18.4, 16, 4.2, 2); fillStroke(c, P.tyre, ink, 1.2);
  stroke(c, ink, 1.4, [[36.2, 17.6], [36.2, 20.4]]); stroke(c, ink, 1.4, [[41.2, 17.6], [41.2, 20.8]]);
  topCase(c, P, 34.2, 7.2, 9.4, 10.8);
  rr(c, 41.5, 12.6, 1.6, 3.2, 0.6); c.fillStyle = P.tail; c.fill();
  /* handlebar, grip, mirror */
  ell(c, 12.8, 12.4, 3.2, 2); fillStroke(c, P.moto, ink, 1.1);
  stroke(c, ink, 2, [[11, 11], [16.4, 10]]); stroke(c, P.tyre, 3, [[15.2, 10.2], [17.6, 9.8]]);
  stroke(c, ink, 1.2, [[13.5, 10.4], [13, 5.6]]); circle(c, 13, 4.6, 1.9); fillStroke(c, P.chrome, ink, 1);
}
/** the handlebar and the mirrors, seen from in front or from behind */
function bars(c: Ctx, P: Palette) {
  [[12, 10, 4.6], [32, 34, 4.6]].forEach(function (m) { stroke(c, ink, 1.2, [[m[0], 11], [m[1], 5.6]]); circle(c, m[1], m[2], 2.1); fillStroke(c, P.chrome, ink, 1); });
  stroke(c, ink, 2.4, [[11, 11.5], [33, 11.5]]);
  stroke(c, P.tyre, 3.2, [[9.5, 11.5], [13, 11.5]]); stroke(c, P.tyre, 3.2, [[31, 11.5], [34.5, 11.5]]);
}
/** coming toward the viewer: what is in front of the rider's legs */
function front(c: Ctx, P: Palette) {
  ell(c, 22, 40.6, 12, 3); c.fillStyle = 'rgba(20,24,40,.2)'; c.fill();
  rr(c, 19.2, 29, 5.6, 12.4, 2.6); fillStroke(c, P.tyre, ink, 1.3);
  [10.5, 30.5].forEach(function (x) { rr(c, x, 28.6, 3, 4.4, 1); fillStroke(c, P.case, ink, 1); });
  c.beginPath(); c.moveTo(16.6, 31.4); c.quadraticCurveTo(22, 24.4, 27.4, 31.4); c.lineTo(26.2, 32.8); c.quadraticCurveTo(22, 28, 17.8, 32.8); c.closePath(); fillStroke(c, P.moto, ink, 1.1);
  c.beginPath(); c.moveTo(14, 14); c.quadraticCurveTo(22, 10.4, 30, 14); c.lineTo(32, 28.6); c.quadraticCurveTo(22, 33.4, 12, 28.6); c.closePath(); fillStroke(c, P.moto, ink, 1.6);
  c.beginPath(); c.moveTo(19.8, 13); c.lineTo(24.2, 13); c.lineTo(25.4, 30.4); c.lineTo(18.6, 30.4); c.closePath(); c.fillStyle = P.moto2; c.globalAlpha = 0.5; c.fill(); c.globalAlpha = 1;
  ell(c, 22, 17.6, 4.2, 3); fillStroke(c, P.beam, ink, 1.1);
  [15.6, 28.4].forEach(function (x) { ell(c, x, 19.6, 1.5, 2); fillStroke(c, P.blinker, ink, 0.8); });
  bars(c, P);
}
/** going away from the viewer: the tail and the top case, in front of the rider's back */
function back(c: Ctx, P: Palette) {
  ell(c, 22, 40.6, 12, 3); c.fillStyle = 'rgba(20,24,40,.2)'; c.fill();
  rr(c, 19.2, 29.4, 5.6, 12, 2.6); fillStroke(c, P.tyre, ink, 1.3);
  c.beginPath(); c.moveTo(13.4, 22); c.quadraticCurveTo(22, 19, 30.6, 22); c.lineTo(31, 30); c.quadraticCurveTo(22, 34.6, 13, 30); c.closePath(); fillStroke(c, P.moto, ink, 1.6);
  rr(c, 18.2, 24, 7.6, 3, 1.2); fillStroke(c, P.tail, ink, 0.9);
  [14.9, 29.1].forEach(function (x) { ell(c, x, 25.2, 1.4, 1.9); fillStroke(c, P.blinker, ink, 0.8); });
  rr(c, 19, 28.6, 6, 3.6, 0.8); fillStroke(c, P.glint, ink, 0.8);
  rr(c, 15, 17.6, 14, 4.6, 2); fillStroke(c, P.tyre, ink, 1.1);
  topCase(c, P, 13.4, 6.4, 17.2, 12.4);
  rr(c, 16.6, 14.4, 10.8, 2, 1); c.fillStyle = P.tail; c.fill();
}
/** the scooter parked, on its stand: from the side, facing left or right */
export function motoParked(P: Palette, s: number, dir: Dir): HTMLCanvasElement {
  var cv = mk(MOTO_W * s, MOTO_H * s), c = cv.getContext('2d')!;
  c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  if (dir === 'right') { c.translate(MOTO_W, 0); c.scale(-1, 1); }
  c.translate(OX, OY); side(c, P, true);
  return cv;
}
export interface Ride {
  /** whoever is played: his walking pictures (standing), and his colours for the leg and the arm */
  walker: Record<Dir, HTMLCanvasElement[]>; look: PersonLook;
  /** his creature's picture, if he has one with him */
  pet: HTMLImageElement | null;
  /** a few px up and down with the engine, and how far it leans into a bend (radians) */
  bob: number; lean: number;
}
/** the scooter with its rider, painted on `cv` (MOTO_W × MOTO_H at scale s) */
export function motoRider(cv: HTMLCanvasElement, P: Palette, s: number, dir: Dir, r: Ride) {
  var c = cv.getContext('2d')!;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);
  c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
  if (r.lean) { c.translate(MOTO_W / 2, MOTO_H - 2); c.rotate(r.lean); c.translate(-MOTO_W / 2, -(MOTO_H - 2)); }
  var S = r.look, sleeve = S.sleeve || S.top;
  /* a walker's picture is 32 px wide, its hips 34 px down: his top half, seated with the hips at (x, y) */
  var torso = function (d: Dir, x: number, y: number) { var img = r.walker[d][0]; c.drawImage(img, 0, 0, 32 * s, 34.5 * s, x - 16, y - 34 + r.bob, 32, 34.5); };
  var pet = function (x: number, y: number, z: number) { if (r.pet) c.drawImage(r.pet, x - z / 2, y - z + r.bob, z, z); };
  if (dir === 'left' || dir === 'right') {
    if (dir === 'right') { c.translate(MOTO_W, 0); c.scale(-1, 1); }
    c.translate(OX, OY + r.bob * 0.5);
    side(c, P, false);
    pet(32.6, 20.6, 21);
    torso('left', 24.6, 20);
    limb(c, S.pants, 4.6, [[23.4, 20], [17.6, 22.6], [17.4, 28.6]]);
    ell(c, 16.4, 30, 3.3, 1.9); fillStroke(c, S.shoes, ink, 1.2);
    limb(c, sleeve, 3.6, [[23.4, 12], [17.4, 10.6]]);
    circle(c, 16.6, 10.2, 1.9); fillStroke(c, S.skin, ink, 1.1);
  } else if (dir === 'down') {
    c.translate(OX, OY + r.bob * 0.5);
    pet(31, 9, 20);
    torso('down', 22, 19);
    front(c, P);
    [[13.6, 13.4, 11.6], [30.4, 13.4, 32.4]].forEach(function (a) {
      limb(c, sleeve, 3.4, [[a[0], a[1]], [a[2], 11.8]]);
      circle(c, a[2], 11.5, 1.9); fillStroke(c, S.skin, ink, 1.1);
    });
  } else {
    c.translate(OX, OY + r.bob * 0.5);
    rr(c, 16, 9, 12, 4, 2); fillStroke(c, P.moto, ink, 1.2);
    bars(c, P);
    [11.6, 32.4].forEach(function (x) { circle(c, x, 11.5, 1.9); fillStroke(c, S.skin, ink, 1.1); });
    torso('up', 22, 19);
    [[14, 12.6, 11.8], [30, 12.6, 32.2]].forEach(function (a) { limb(c, sleeve, 3.4, [[a[0], a[1]], [a[2], 11.8]]); });
    pet(31.5, 12, 18);
    back(c, P);
  }
}
