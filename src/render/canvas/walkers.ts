import type { Dir } from '../../data/maps/types';
import type { FriendId } from '../../data/characters';
import { T, STICKER_INK, mk, rr, hash, fillStroke, circle, ell, type Ctx } from './draw';

/** a person seen from above: the friends match their portraits, townsfolk are picked by a seed */
export interface PersonLook {
  skin: string;
  hair: { style: string; color: string; hi?: string };
  top: string; top2: string;
  style: string;
  pants: string; shoes: string;
  sleeve?: string;
  glasses?: string | null;
  beard?: string;
  phones?: boolean;
  stripes?: string[];
  /* the touches that make someone recognisable from above (Antonio's): a gold chain, an earring, thick brows,
     a crooked smile */
  chain?: string;
  earring?: string;
  brows?: string;
  smirk?: boolean;
  /** a moustache (Nicola's, ginger), and a big open laugh */
  mustache?: string;
  laugh?: boolean;
}
type HairLook = PersonLook['hair'];

/* ---------- people seen from above ---------- */
const DIRS: Dir[] = ['down', 'left', 'right', 'up'];
/** four directions × three frames (standing, left foot, right foot) */
export function walker(spec: PersonLook, s: number): Record<Dir, HTMLCanvasElement[]> {
  var out = {} as Record<Dir, HTMLCanvasElement[]>;
  DIRS.forEach(function (d) {
    out[d] = [0, 1, 2].map(function (f) {
      var cv = mk(T * s, 44 * s), c = cv.getContext('2d')!;
      c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
      if (d === 'right') { c.translate(T, 0); c.scale(-1, 1); }
      drawWalker(c, spec, d === 'right' ? 'left' : d, f);
      return cv;
    });
  });
  return out;
}
function drawWalker(c: Ctx, S: PersonLook, d: Dir, f: number) {
  var ink = STICKER_INK, bob = f ? -1 : 0, side = d === 'left', back = d === 'up';
  c.translate(0, 4);
  ell(c, 16, 38, 9, 3); c.fillStyle = 'rgba(20,24,40,.22)'; c.fill();
  /* legs */
  var lA = f === 1 ? -3 : 0, lB = f === 2 ? -3 : 0;
  if (side) {
    var fwd = f === 1 ? 3 : f === 2 ? -3 : 0;
    rr(c, 13 - fwd, 29, 5, 8, 2); fillStroke(c, S.pants, ink, 1.4);
    rr(c, 15 + fwd, 29, 5, 8, 2); fillStroke(c, S.pants, ink, 1.4);
    ell(c, 14.5 - fwd, 37, 3.4, 1.8); fillStroke(c, S.shoes, ink, 1.2);
    ell(c, 16.5 + fwd, 37, 3.4, 1.8); fillStroke(c, S.shoes, ink, 1.2);
  } else {
    rr(c, 11, 29 + lA, 5, 8 - lA * 0.3, 2); fillStroke(c, S.pants, ink, 1.4);
    rr(c, 16, 29 + lB, 5, 8 - lB * 0.3, 2); fillStroke(c, S.pants, ink, 1.4);
    ell(c, 13.5, 37 + lA * 0.6, 3.2, 1.8); fillStroke(c, S.shoes, ink, 1.2);
    ell(c, 18.5, 37 + lB * 0.6, 3.2, 1.8); fillStroke(c, S.shoes, ink, 1.2);
  }
  c.translate(0, bob);
  /* mane-style hair sits behind the body */
  if (S.hair.style === 'mane') { hairBack(c, S, d); }
  /* long hair falls down the back, behind the body */
  if (S.hair.style === 'long') longBack(c, S, d);
  /* body */
  var bx = side ? 10.5 : 8.5, bw = side ? 11 : 15;
  rr(c, bx, 19, bw, 12.5, 4.5); fillStroke(c, S.top, ink, 1.6);
  torsoDetail(c, S, d, bx, bw);
  /* arms */
  var sw = f === 1 ? 1.5 : f === 2 ? -1.5 : 0;
  if (side) { rr(c, 14 + sw, 21, 4.5, 9, 2.2); fillStroke(c, S.sleeve || S.top, ink, 1.4); circle(c, 16.2 + sw, 30.5, 2); fillStroke(c, S.skin, ink, 1.2); }
  else {
    rr(c, 5.2, 20.5 + sw, 4.4, 9, 2.2); fillStroke(c, S.sleeve || S.top, ink, 1.4);
    rr(c, 22.4, 20.5 - sw, 4.4, 9, 2.2); fillStroke(c, S.sleeve || S.top, ink, 1.4);
    circle(c, 7.4, 30 + sw, 1.9); fillStroke(c, S.skin, ink, 1.2); circle(c, 24.6, 30 - sw, 1.9); fillStroke(c, S.skin, ink, 1.2);
  }
  if (S.phones) neckPhones(c, d);
  if (S.chain && !back) { c.strokeStyle = S.chain; c.lineWidth = 1.3; c.beginPath(); if (side) { c.moveTo(11, 19.6); c.quadraticCurveTo(11.8, 22.8, 15.2, 21.6); } else { c.moveTo(11.6, 20.4); c.quadraticCurveTo(16, 25.8, 20.4, 20.4); } c.stroke(); }
  /* head */
  circle(c, 16, 12, 9.6); fillStroke(c, S.skin, ink, 1.6);
  if (S.beard && !back) { c.save(); circle(c, 16, 12, 9.6); c.clip(); c.fillStyle = S.beard; c.globalAlpha = 0.42; c.beginPath(); c.ellipse(side ? 12 : 16, 19, side ? 6 : 8.5, 5.2, 0, 0, Math.PI * 2); c.fill(); c.restore(); c.globalAlpha = 1; }
  hairFront(c, S, d);
  if (!back) face(c, S, d);
}
function torsoDetail(c: Ctx, S: PersonLook, d: Dir, bx: number, bw: number) {
  var ink = STICKER_INK;
  var st = S.style;
  if (st === 'stripes') {
    c.save(); rr(c, bx, 19, bw, 12.5, 4.5); c.clip();
    for (var k = 0; k < 6; k++) { c.fillStyle = S.stripes![k % S.stripes!.length]; c.fillRect(bx, 20 + k * 2.2, bw, 1.2); }
    c.restore(); rr(c, bx, 19, bw, 12.5, 4.5); c.strokeStyle = ink; c.lineWidth = 1.6; c.stroke();
  }
  if (d === 'up') { if (st === 'hoodie') { c.beginPath(); c.moveTo(10, 20); c.quadraticCurveTo(16, 27, 22, 20); fillStroke(c, S.top2, ink, 1.3); } return; }
  if (d === 'left') return;
  if (st === 'hoodie') { c.strokeStyle = '#d7dcef'; c.lineWidth = 1; c.beginPath(); c.moveTo(14, 21); c.lineTo(13.5, 26); c.moveTo(18, 21); c.lineTo(18.5, 26); c.stroke(); }
  else if (st === 'turtleneck') { rr(c, 12, 18, 8, 3.4, 1.5); fillStroke(c, S.top2, ink, 1.2); }
  else if (st === 'tee') { c.strokeStyle = S.top2; c.lineWidth = 1.2; c.beginPath(); c.moveTo(13, 19.5); c.quadraticCurveTo(16, 22, 19, 19.5); c.stroke(); }
  else if (st === 'jacket') { c.fillStyle = S.top2; c.beginPath(); c.moveTo(14, 19.5); c.lineTo(18, 19.5); c.lineTo(17.4, 31); c.lineTo(14.6, 31); c.closePath(); c.fill(); }
  else if (st === 'knit') { c.strokeStyle = S.top2; c.lineWidth = 2.2; c.beginPath(); c.moveTo(22, 20); c.lineTo(10, 31); c.stroke(); }
}
function neckPhones(c: Ctx, d: Dir) {
  var ink = STICKER_INK;
  if (d === 'up') { c.strokeStyle = '#2a2a31'; c.lineWidth = 2; c.beginPath(); c.moveTo(10, 20); c.quadraticCurveTo(16, 23, 22, 20); c.stroke(); return; }
  rr(c, 8.5, 18.5, 4.4, 5.4, 2); fillStroke(c, '#22222a', ink, 1.1);
  if (d !== 'left') { rr(c, 19.1, 18.5, 4.4, 5.4, 2); fillStroke(c, '#22222a', ink, 1.1); }
}
function bumps(c: Ctx, cx: number, cy: number, r: number, n: number, br: number, a0: number, a1: number, color: string) {
  c.fillStyle = color;
  for (var k = 0; k <= n; k++) {
    var a = a0 + (a1 - a0) * k / n;
    circle(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, br); c.fill();
  }
}
/** long hair, the part behind: down to the shoulder blades */
function longBack(c: Ctx, S: PersonLook, d: Dir) {
  var H = S.hair, ink = STICKER_INK;
  c.beginPath();
  if (d === 'up') { c.moveTo(6.5, 12); c.quadraticCurveTo(5.6, 25, 9, 29.5); c.lineTo(23, 29.5); c.quadraticCurveTo(26.4, 25, 25.5, 12); }
  else if (d === 'left') { c.moveTo(17, 10); c.quadraticCurveTo(27, 13, 26, 27); c.quadraticCurveTo(22, 29, 18.5, 27); }
  else { c.moveTo(6.5, 12); c.quadraticCurveTo(5, 21, 7.4, 26.5); c.lineTo(24.6, 26.5); c.quadraticCurveTo(27, 21, 25.5, 12); }
  c.closePath(); fillStroke(c, H.color, ink, 1.5);
  if (H.hi) { c.strokeStyle = H.hi; c.lineWidth = 0.9; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(d === 'left' ? 22 : 10, 15); c.quadraticCurveTo(d === 'left' ? 25 : 9, 21, d === 'left' ? 23 : 10.5, 26); c.stroke(); c.globalAlpha = 1; }
}
function hairBack(c: Ctx, S: PersonLook, _d: Dir) {
  var H = S.hair, ink = STICKER_INK;
  circle(c, 16, 12, 15); fillStroke(c, H.color, ink, 1.6);
  bumps(c, 16, 12, 14, 16, 3.4, 0, Math.PI * 2, H.color);
  c.strokeStyle = H.hi!; c.lineWidth = 0.9;
  for (var k = 0; k < 9; k++) { var a = k / 9 * Math.PI * 2; c.beginPath(); c.arc(16 + Math.cos(a) * 11, 12 + Math.sin(a) * 11, 2, 0, 4.2); c.stroke(); }
}
/** a cloud of curls with one outline around it all: circles [x, y, r] */
function cloud(c: Ctx, pts: number[][], color: string) {
  c.strokeStyle = STICKER_INK; c.lineWidth = 3;
  pts.forEach(function (p) { circle(c, p[0], p[1], p[2]); c.stroke(); });
  c.fillStyle = color;
  pts.forEach(function (p) { circle(c, p[0], p[1], p[2]); c.fill(); });
}
/* big curly hair, a lot of it, like Antonio's: over the top and the sides, a few curls on the forehead */
function bigCurls(c: Ctx, H: HairLook, d: Dir) {
  var pts: number[][] = [], k, a;
  if (d === 'up') {
    for (k = 0; k < 16; k++) { a = k / 16 * Math.PI * 2; pts.push([16 + Math.cos(a) * 10.4, 11 + Math.sin(a) * 10.4, 3.4]); }
    pts.push([16, 11, 10.2]);
  } else if (d === 'left') {
    /* seen from the side: the face is on the left, the curls over the top and down the back of the head */
    for (k = 0; k <= 9; k++) { a = Math.PI * (1.12 + 1.1 * k / 9); pts.push([16.5 + Math.cos(a) * 10, 10.5 + Math.sin(a) * 10, 3.2]); }
    pts.push([24.8, 14.6, 2.9], [23.2, 17.6, 2.4], [10.2, 6.6, 2.3], [13.2, 4.8, 2.5], [19.5, 8, 6.6]);
  } else {
    /* from the front: a crown of curls, the sides down to the ears, a few curls on the forehead, the face free */
    for (k = 0; k <= 10; k++) { a = Math.PI * (0.97 + 1.06 * k / 10); pts.push([16 + Math.cos(a) * 10.2, 11 + Math.sin(a) * 10.2, 3.3]); }
    pts.push([11, 2, 3.1], [16, 1.1, 3.3], [21, 2, 3.1], [11.2, 6.6, 2.3], [14.4, 5.8, 2.4], [17.8, 5.9, 2.4], [20.9, 6.7, 2.3], [16, 4.6, 6.2], [6.6, 12.8, 2.3], [25.4, 12.8, 2.3]);
  }
  cloud(c, pts, H.color);
  if (H.hi) {
    c.strokeStyle = H.hi; c.lineWidth = 0.9; c.globalAlpha = 0.85;
    var sw = d === 'up' ? [[11, 6], [16, 3], [21, 7], [13, 12], [19, 12]] : d === 'left' ? [[13, 3], [19, 4], [22, 9]] : [[10, 4], [16, 2], [22, 4], [14, 7]];
    sw.forEach(function (q) { c.beginPath(); c.arc(q[0], q[1], 1.4, 0, 4.4); c.stroke(); });
    c.globalAlpha = 1;
  }
}
function hairFront(c: Ctx, S: PersonLook, d: Dir) {
  var H = S.hair, ink = STICKER_INK, back = d === 'up', side = d === 'left', st = H.style;
  if (st === 'bigcurls') { bigCurls(c, H, d); return; }
  /* no hair: only the light on the head; or what is left of it, grey, around the ears */
  if (st === 'bald' || st === 'crown') {
    if (st === 'crown') {
      c.save(); circle(c, 16, 12, 9.6); c.clip(); c.fillStyle = H.color;
      if (back) { c.fillRect(5, 12, 22, 12); } else { c.fillRect(5, 9, side ? 0 : 3.4, 9); c.fillRect(side ? 21 : 23.6, 9, 6, 9); }
      c.restore();
    }
    if (!back) { c.strokeStyle = '#ffffff'; c.globalAlpha = 0.7; c.lineWidth = 1.6; c.beginPath(); c.arc(16, 12, 6.6, Math.PI * 1.2, Math.PI * 1.45); c.stroke(); c.globalAlpha = 1; }
    return;
  }
  c.save();
  if (st === 'buzz') {
    c.beginPath(); c.arc(16, 12, 9.6, Math.PI * 1.05, Math.PI * 1.95); if (back) { c.arc(16, 12, 9.6, 0, Math.PI); }
    c.closePath(); c.fillStyle = H.color; c.globalAlpha = back ? 0.85 : 0.75; c.fill(); c.globalAlpha = 1;
    c.restore(); return;
  }
  if (st === 'mane') {
    if (back) { circle(c, 16, 11, 12.5); c.fillStyle = H.color; c.fill(); bumps(c, 16, 11, 11.5, 12, 3.2, 0, Math.PI * 2, H.color); }
    else { bumps(c, 16, 6, 8, 10, 3.6, Math.PI * 0.95, Math.PI * 2.05, H.color); if (side) bumps(c, 21, 11, 5, 5, 3.6, -1.2, 1.6, H.color); }
    c.strokeStyle = H.hi!; c.lineWidth = 0.9; for (var k = 0; k < 4; k++) { c.beginPath(); c.arc(9 + k * 4.5, 3 + (k % 2) * 2, 1.6, 0, 4.4); c.stroke(); }
    c.restore(); return;
  }
  if (back) {
    circle(c, 16, 11.4, 9.9); c.fillStyle = H.color; c.fill(); c.strokeStyle = ink; c.lineWidth = 1.6; c.stroke();
    if (st === 'curls' || st === 'longcurls') bumps(c, 16, 11, 9.6, 14, 2.6, Math.PI * 0.9, Math.PI * 2.1, H.color);
    if (st === 'longcurls' || st === 'wavy' || st === 'long') { rr(c, 7.5, 12, 17, 9, 4); c.fillStyle = H.color; c.fill(); }
    if (st === 'messy') messyTufts(c, H, 0);
    hiSwirls(c, H, 16, 8);
    c.restore(); return;
  }
  if (side) {
    c.beginPath(); c.arc(16, 12, 10.2, Math.PI * 0.75, Math.PI * 2.02); c.closePath(); c.fillStyle = H.color; c.fill();
    c.beginPath(); c.moveTo(15, 3); c.quadraticCurveTo(26, 4, 25.6, 16); c.lineTo(18, 14); c.closePath(); c.fill();
    if (st === 'curls' || st === 'longcurls') { bumps(c, 16, 11, 10, 10, 2.5, Math.PI * 0.95, Math.PI * 2.05, H.color); bumps(c, 23, 12, 3.4, 3, 2.4, -1.2, 1.3, H.color); }
    if (st === 'longcurls' || st === 'wavy' || st === 'long') { rr(c, 17, 11, 9, 11, 4); c.fill(); }
    if (st === 'quiff') { c.beginPath(); c.moveTo(7, 6); c.quadraticCurveTo(9, -1, 18, 1); c.lineTo(16, 6); c.closePath(); c.fill(); }
    if (st === 'messy') messyTufts(c, H, 1);
    c.beginPath(); c.arc(16, 12, 10.2, Math.PI * 0.95, Math.PI * 1.9); c.strokeStyle = ink; c.lineWidth = 1.4; c.stroke();
    hiSwirls(c, H, 17, 6);
    c.restore(); return;
  }
  /* front */
  c.beginPath(); c.arc(16, 12, 10.1, Math.PI * 1.0, Math.PI * 2.0);
  var fy = st === 'quiff' ? 7 : st === 'wavy' || st === 'long' ? 9 : 8;
  c.lineTo(25.8, 13); c.quadraticCurveTo(21, fy, 16, fy + 0.6); c.quadraticCurveTo(11, fy, 6.2, 13); c.closePath();
  c.fillStyle = H.color; c.fill();
  if (st === 'curls' || st === 'longcurls') bumps(c, 16, 10.5, 9.4, 12, 2.5, Math.PI * 0.95, Math.PI * 2.05, H.color);
  if (st === 'curls') { bumps(c, 9.5, 9, 0.1, 0, 2.4, 0, 0, H.color); bumps(c, 14, 8.6, 0.1, 0, 2.3, 0, 0, H.color); bumps(c, 19, 8.8, 0.1, 0, 2.3, 0, 0, H.color); }
  if (st === 'longcurls') { rr(c, 4.8, 9, 4.6, 12, 2.3); c.fill(); rr(c, 22.6, 9, 4.6, 12, 2.3); c.fill(); bumps(c, 16, 8.4, 4, 4, 2.4, 0.4, 2.7, H.color); }
  if (st === 'wavy') { rr(c, 4.6, 8, 5, 13, 2.5); c.fill(); rr(c, 22.4, 8, 5, 13, 2.5); c.fill(); c.beginPath(); c.moveTo(9, 6); c.quadraticCurveTo(17, 4, 24, 11); c.quadraticCurveTo(17, 8, 9, 10); c.closePath(); c.fill(); }
  /* long: parted in the middle, falling either side of the face onto the shoulders */
  if (st === 'long') { rr(c, 4.4, 8, 5, 18, 2.5); c.fill(); rr(c, 22.6, 8, 5, 18, 2.5); c.fill(); c.beginPath(); c.moveTo(16, 3); c.quadraticCurveTo(10, 5, 6.5, 12); c.lineTo(9, 12); c.quadraticCurveTo(12, 7, 16, 6); c.quadraticCurveTo(20, 7, 23, 12); c.lineTo(25.5, 12); c.quadraticCurveTo(22, 5, 16, 3); c.closePath(); c.fill(); }
  if (st === 'quiff') { c.beginPath(); c.moveTo(8, 6); c.quadraticCurveTo(12, -2, 22, 0); c.quadraticCurveTo(25, 3, 24, 7); c.closePath(); c.fill(); }
  /* short and tousled: tufts sticking up every way, a lock on the forehead (Nicola) */
  if (st === 'messy') messyTufts(c, H, 0);
  c.beginPath(); c.arc(16, 12, 10.1, Math.PI * 1.0, Math.PI * 2.0); c.strokeStyle = ink; c.lineWidth = 1.4; c.stroke();
  if (st === 'messy') { c.fillStyle = H.color; c.beginPath(); c.moveTo(13, 7); c.quadraticCurveTo(12, 10.5, 9.6, 11.2); c.quadraticCurveTo(12.6, 10.6, 15.6, 7.6); c.closePath(); c.fill(); }
  hiSwirls(c, H, 16, 5);
  c.restore();
}
/** the tufts of tousled hair, on top of the head: from the front (side 0) or from the side (1) */
function messyTufts(c: Ctx, H: HairLook, side: number) {
  var ink = STICKER_INK, tufts = side ? [[9, 4, -0.5], [13, 1.6, -0.2], [18, 1.2, 0.3], [22.5, 3.4, 0.7]] : [[8.2, 5.4, -0.7], [11.6, 2.4, -0.35], [15.6, 1.2, 0], [19.8, 2.2, 0.35], [23.4, 5, 0.7]];
  tufts.forEach(function (q) {
    c.save(); c.translate(q[0], q[1] + 2.4); c.rotate(q[2]);
    c.beginPath(); c.moveTo(-2.6, 1.6); c.quadraticCurveTo(-1, -2.6, 0.4, -3.8); c.quadraticCurveTo(1, -1.2, 2.6, 1.6); c.closePath();
    c.fillStyle = H.color; c.fill(); c.strokeStyle = ink; c.lineWidth = 0.9; c.beginPath(); c.moveTo(-2.4, 0.4); c.quadraticCurveTo(-1, -2.6, 0.4, -3.8); c.quadraticCurveTo(1, -1.2, 2.4, 0.4); c.stroke();
    c.restore();
  });
}
function hiSwirls(c: Ctx, H: HairLook, cx: number, cy: number) {
  if (!H.hi) return;
  c.strokeStyle = H.hi; c.lineWidth = 0.9; c.globalAlpha = 0.8;
  for (var k = 0; k < 3; k++) { c.beginPath(); c.arc(cx - 5 + k * 5, cy - 1 + (k % 2) * 2, 1.4, 0, 4.4); c.stroke(); }
  c.globalAlpha = 1;
}
function face(c: Ctx, S: PersonLook, d: Dir) {
  var ink = STICKER_INK;
  if (d === 'left') {
    circle(c, 9.4, 14.2, 1.3); c.fillStyle = ink; c.fill();
    c.beginPath(); c.moveTo(6.6, 14.6); c.quadraticCurveTo(5, 16.4, 6.8, 17.2); c.strokeStyle = ink; c.lineWidth = 1.1; c.stroke();
    circle(c, 11.6, 17.4, 1.8); c.fillStyle = 'rgba(234,120,110,.35)'; c.fill();
    if (S.brows) { c.strokeStyle = S.brows; c.lineWidth = 1.5; c.beginPath(); c.moveTo(7.8, 11.8); c.lineTo(11, 11.3); c.stroke(); }
    if (S.laugh) { c.beginPath(); c.moveTo(6.4, 18); c.quadraticCurveTo(7.6, 21.6, 9.8, 18.2); c.closePath(); fillStroke(c, '#7a1e2c', ink, 0.9); }
    else if (S.smirk) { c.strokeStyle = ink; c.lineWidth = 1.1; c.beginPath(); c.moveTo(6.9, 18.6); c.quadraticCurveTo(8.2, 19.2, 9.6, 18.1); c.stroke(); }
    if (S.mustache) { c.beginPath(); c.moveTo(5.6, 17.4); c.quadraticCurveTo(7.6, 15.6, 10.4, 16.8); c.quadraticCurveTo(8, 17.8, 5.6, 17.4); c.closePath(); fillStroke(c, S.mustache, ink, 0.8); }
    glasses(c, S, d);
    return;
  }
  circle(c, 12.4, 14.4, 1.35); c.fillStyle = ink; c.fill();
  circle(c, 19.6, 14.4, 1.35); c.fill();
  circle(c, 10.2, 17.4, 1.9); c.fillStyle = 'rgba(234,120,110,.35)'; c.fill();
  circle(c, 21.8, 17.4, 1.9); c.fill();
  if (S.laugh) {
    /* laughing, mouth open: Nicola */
    c.beginPath(); c.moveTo(12.9, 18.2); c.quadraticCurveTo(16, 23.4, 19.1, 18.2); c.closePath(); fillStroke(c, '#7a1e2c', ink, 1);
    c.fillStyle = '#ffffff'; c.fillRect(13.8, 18.3, 4.4, 1.2);
  } else {
    c.beginPath();
    /* a crooked smile, one side up; or the plain one */
    if (S.smirk) { c.moveTo(14.2, 18.9); c.quadraticCurveTo(16.4, 19.7, 18.5, 18); } else { c.moveTo(14.6, 18.6); c.quadraticCurveTo(16, 19.6, 17.4, 18.6); }
    c.strokeStyle = ink; c.lineWidth = 1.1; c.stroke();
  }
  if (S.mustache) {
    c.beginPath(); c.moveTo(16, 16.5); c.quadraticCurveTo(13.2, 15.6, 11.6, 18.2); c.quadraticCurveTo(13.6, 17.6, 16, 18); c.quadraticCurveTo(18.4, 17.6, 20.4, 18.2); c.quadraticCurveTo(18.8, 15.6, 16, 16.5); c.closePath();
    fillStroke(c, S.mustache, ink, 0.9);
  }
  if (S.brows) { c.strokeStyle = S.brows; c.lineWidth = 1.5; c.beginPath(); c.moveTo(10.7, 11.9); c.lineTo(13.9, 11.5); c.moveTo(18.1, 11.1); c.lineTo(21.3, 11.5); c.stroke(); }
  if (S.earring) { circle(c, 6.9, 16, 1.2); fillStroke(c, S.earring, ink, 0.8); }
  glasses(c, S, d);
}
function glasses(c: Ctx, S: PersonLook, d: Dir) {
  var g = S.glasses;
  if (!g) return;
  if (d === 'left') {
    if (g === 'round') { circle(c, 9.6, 14.2, 2.8); c.strokeStyle = '#141416'; c.lineWidth = 1.3; c.stroke(); c.beginPath(); c.moveTo(12.4, 13.8); c.lineTo(18, 13); c.stroke(); }
    else if (g === 'green' || g === 'sun') { var fr = g === 'sun' ? '#141416' : '#57c968'; rr(c, 6, 12.2, 7, 4.2, 1.6); fillStroke(c, '#20242e', fr, 1.6); c.strokeStyle = fr; c.beginPath(); c.moveTo(13, 13.6); c.lineTo(18, 13); c.stroke(); }
    else if (g === 'thin') { c.strokeStyle = '#202227'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(6.5, 13.2); c.lineTo(12.5, 13.2); c.lineTo(18, 12.8); c.stroke(); }
    return;
  }
  if (g === 'round') {
    c.strokeStyle = '#141416'; c.lineWidth = 1.3;
    circle(c, 12.4, 14.3, 2.9); c.stroke(); circle(c, 19.6, 14.3, 2.9); c.stroke();
    c.beginPath(); c.moveTo(15.2, 14); c.lineTo(16.8, 14); c.stroke();
  } else if (g === 'green' || g === 'sun') {
    var frame = g === 'sun' ? '#141416' : '#57c968';
    rr(c, 8.6, 12.4, 6.6, 4.2, 1.6); fillStroke(c, '#20242e', frame, 1.7);
    rr(c, 16.8, 12.4, 6.6, 4.2, 1.6); fillStroke(c, '#20242e', frame, 1.7);
    c.strokeStyle = frame; c.lineWidth = 1.6; c.beginPath(); c.moveTo(15.2, 13.6); c.lineTo(16.8, 13.6); c.stroke();
  } else if (g === 'thin') {
    c.strokeStyle = '#202227'; c.lineWidth = 1.2;
    c.beginPath(); c.moveTo(9.2, 12.8); c.lineTo(15, 12.8); c.moveTo(17, 12.8); c.lineTo(22.8, 12.8); c.moveTo(15, 13); c.lineTo(17, 13); c.stroke();
    c.lineWidth = 0.7; c.strokeStyle = '#8f96a0'; c.strokeRect(9.2, 12.8, 5.8, 3.4); c.strokeRect(17, 12.8, 5.8, 3.4);
  }
}

/* the six friends, matching their portraits */
export const PEOPLE: Record<FriendId, PersonLook> = {
  antonio: { skin: '#ddae93', hair: { style: 'bigcurls', color: '#1d1512', hi: '#9a8a7c' }, top: '#414c72', top2: '#2a3252', style: 'hoodie', pants: '#2b2f3a', shoes: '#f3f3f3',
    chain: '#e0b44c', earring: '#f2c14e', brows: '#2b201a', smirk: true },
  costanzo: { skin: '#e6bea5', hair: { style: 'wavy', color: '#2a1d16', hi: '#9a7c68' }, top: '#25272f', top2: '#14151a', style: 'turtleneck', pants: '#1c1d22', shoes: '#f0f0f0', glasses: 'thin' },
  andrea: { skin: '#e3b99d', hair: { style: 'quiff', color: '#1d1613', hi: '#7a6b60' }, top: '#25262c', top2: '#3a3c45', style: 'tee', pants: '#26324a', shoes: '#e9e9e9' },
  valentin: { skin: '#edc4ab', hair: { style: 'mane', color: '#7b4d33', hi: '#e6b98c' }, top: '#ddd6c6', top2: '#1c1c21', style: 'jacket', pants: '#3b3f4b', shoes: '#f3f3f3', glasses: 'green' },
  forchetta: { skin: '#e4bca1', hair: { style: 'longcurls', color: '#4f3423', hi: '#c29670' }, top: '#5d5a3e', top2: '#20263a', style: 'stripes', stripes: ['#283046', '#d6c9a8', '#6e6c43', '#8b8f93'], pants: '#22252d', shoes: '#efefef' },
  zendavid: { skin: '#deb294', hair: { style: 'buzz', color: '#2a201b' }, top: '#837c74', top2: '#19191d', style: 'knit', pants: '#56627a', shoes: '#e9e9e9', glasses: 'round', beard: '#2a1f1a', phones: true },
  /* long dark hair down her back, a burgundy top under a black jacket, the little gold earrings */
  /* from her photo: black bob with a fringe, a black top, silver hoops */
  claudia: { skin: '#dca684', hair: { style: 'long', color: '#1b1514', hi: '#5a4845' }, top: '#17161b', top2: '#2e2c35', style: 'tee', pants: '#2c3446', shoes: '#1c1d22', earring: '#cfd4da' }
};
/* what they wear in the story as they grow (data/people.ts): over the look of the first form */
export const PEOPLE_FORMS: Record<FriendId, [Partial<PersonLook>, Partial<PersonLook>]> = {
  antonio: [{ top: '#e9ebee', top2: '#414c72', style: 'jacket' }, { top: '#2a3252', top2: '#f4f1ea', style: 'jacket', pants: '#1a2040' }],
  costanzo: [{ top: '#2f3a56', top2: '#f4f1ea', style: 'jacket' }, { top: '#1d1f26', top2: '#c0392b', style: 'jacket' }],
  andrea: [{ top: '#d0702c', top2: '#9a4f1c' }, { top: '#d0702c', top2: '#25262c', style: 'jacket' }],
  valentin: [{ top: '#c9a25a', top2: '#1c1c21' }, { top: '#2f8f4e', top2: '#f4f1ea' }],
  forchetta: [{ top: '#f2f0ea', top2: '#2f8f4e', style: 'tee', stripes: undefined }, { top: '#1f5fa8', top2: '#1f5fa8', stripes: ['#1f5fa8', '#f4f1ea', '#1f5fa8', '#f4f1ea'] }],
  zendavid: [{ top: '#1f2027', top2: '#e8a33d', style: 'jacket' }, { top: '#efe9db', top2: '#b08a3e', style: 'tee' }],
  claudia: [{ top: '#c0392b', top2: '#1f1d24', style: 'jacket' }, { top: '#f4efe2', top2: '#d9b63a', style: 'jacket' }]
};
/* people of Formia who are not in the squad but are somebody: Nicola Spadea, windsurf champion and instructor
   at Vindicio, tanned, sun-bleached hair, sunglasses, lycra and boardshorts, barefoot on the sand */
export const LOOKS: Record<string, PersonLook> = {
  /* at the tobacconist of Largo Paone: uncle Lele, who is bald, and the grandfather */
  lele: { skin: '#d9a585', hair: { style: 'bald', color: '#2a201b' }, top: '#3d5a80', top2: '#ffffff', style: 'tee', pants: '#2b2f3a', shoes: '#efefef', beard: '#4a3a30' },
  nonno: { skin: '#e3b99d', hair: { style: 'crown', color: '#c9ccd6' }, top: '#8a9a5b', top2: '#ffffff', style: 'jacket', pants: '#56627a', shoes: '#3b2f2a', glasses: 'round' },
  /* Nicola Spadea, from his photo: short brown hair all tousled, a ginger moustache and stubble, a dark tee; board
     shorts and bare feet, because he is always just back from the sea; and he is always laughing */
  nicola: { skin: '#eab99a', hair: { style: 'messy', color: '#6b4a32', hi: '#a8794f' }, top: '#24262e', top2: '#3d4250', style: 'tee', pants: '#1f7fb5', shoes: '#eab99a', beard: '#b8683a', mustache: '#c0703a', laugh: true },
  /* the guardaparco of Gianola: a woman in the green of the regional park, long chestnut hair, khaki trousers, boots */
  guardaparco: { skin: '#e2b391', hair: { style: 'long', color: '#5a3a24', hi: '#a8794f' }, top: '#4f7a3c', top2: '#d9c99a', style: 'jacket', pants: '#9c8458', shoes: '#5a3d2a', earring: '#e0b44c' },
  /* Mamurra's men: grey suits, gold ties, dark glasses, as if Formia were theirs */
  mamurriano: { skin: '#e3b99d', hair: { style: 'quiff', color: '#2a201b', hi: '#6b5a4e' }, top: '#5b6170', top2: '#d9a441', style: 'jacket', pants: '#3b3f4b', shoes: '#1c1d22', glasses: 'sun' },
  /* Tullio, the rival: red hair, the green of his grandfather's park, a cocky smile */
  tullio: { skin: '#f0c8a8', hair: { style: 'quiff', color: '#b5532b', hi: '#ec9a63' }, top: '#2f8f5b', top2: '#f2c14e', style: 'hoodie', pants: '#56627a', shoes: '#f3f3f3', smirk: true }
};
/* generic townsfolk, varied by a seed */
export function townsperson(seed: number): PersonLook {
  var R = function (k: number) { return hash(seed, k, 7); };
  var skins = ['#f1cdb4', '#ddae93', '#c99577', '#a8775c', '#e9c2a6'], hairs = ['#1d1512', '#4f3423', '#8a5a3c', '#c9a46a', '#6b6b6b', '#2a201b'];
  var tops = ['#e86a5c', '#5b8fd9', '#f2c14e', '#62b38a', '#b07cd8', '#f08fb6', '#4bbad2', '#f5f0e6'];
  var styles = ['curls', 'quiff', 'buzz', 'wavy', 'longcurls'];
  return {
    skin: skins[Math.floor(R(1) * skins.length)], hair: { style: styles[Math.floor(R(2) * styles.length)], color: hairs[Math.floor(R(3) * hairs.length)] },
    top: tops[Math.floor(R(4) * tops.length)], top2: '#1c2340', style: R(5) < 0.5 ? 'tee' : 'hoodie', pants: ['#2b2f3a', '#56627a', '#7a5a3c', '#3b3f4b'][Math.floor(R(6) * 4)], shoes: '#efefef',
    glasses: R(8) < 0.2 ? 'round' : null
  };
}

/** the face of a person of Formia from above, big, for the scroll of the dialogue: the head and shoulders of the
    walker facing down, as a picture (kept: one per look) */
var shots: Record<string, string> = {};
export function headShot(key: string): string {
  if (shots[key] != null) return shots[key];
  var L = LOOKS[key];
  if (!L || typeof document === 'undefined') return (shots[key] = '');
  var s = 4, src = walker(L, s).down[0], out = mk(T * s, 30 * s), c = out.getContext('2d')!;
  c.drawImage(src, 0, 0, T * s, 30 * s, 0, 0, T * s, 30 * s);
  try { shots[key] = out.toDataURL(); } catch (e) { shots[key] = ''; }
  return shots[key];
}
