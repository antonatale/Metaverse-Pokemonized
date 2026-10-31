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
}
type HairLook = PersonLook['hair'];

/* ---------- people seen from above ---------- */
const DIRS: Dir[] = ['down', 'left', 'right', 'up'];
/** four directions × three frames (standing, left foot, right foot); with a head (a friend's portrait, as an image)
    the face seen from the front and the sides is the one of the battles */
export function walker(spec: PersonLook, s: number, head?: CanvasImageSource): Record<Dir, HTMLCanvasElement[]> {
  var out = {} as Record<Dir, HTMLCanvasElement[]>;
  DIRS.forEach(function (d) {
    out[d] = [0, 1, 2].map(function (f) {
      var cv = mk(T * s, 44 * s), c = cv.getContext('2d')!;
      c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
      if (d === 'right') { c.translate(T, 0); c.scale(-1, 1); }
      drawWalker(c, spec, d === 'right' ? 'left' : d, f, head);
      return cv;
    });
  });
  return out;
}
function drawWalker(c: Ctx, S: PersonLook, d: Dir, f: number, head?: CanvasImageSource) {
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
  /* the portrait's head, a little big, as a sticker: from the front, and turned a bit to the side */
  if (head && !back) {
    var hs = 30, hx = side ? 1.5 : 1, hy = -6;
    c.save();
    if (side) { c.translate(16, 0); c.scale(0.92, 1); c.translate(-16, 0); }
    c.drawImage(head, hx, hy, hs, hs);
    c.restore();
    return;
  }
  /* head (from behind, as big as the portrait's) */
  if (head) { c.save(); c.translate(16, 11); c.scale(1.25, 1.25); c.translate(-16, -11); }
  circle(c, 16, 12, 9.6); fillStroke(c, S.skin, ink, 1.6);
  if (S.beard && !back) { c.save(); circle(c, 16, 12, 9.6); c.clip(); c.fillStyle = S.beard; c.globalAlpha = 0.42; c.beginPath(); c.ellipse(side ? 12 : 16, 19, side ? 6 : 8.5, 5.2, 0, 0, Math.PI * 2); c.fill(); c.restore(); c.globalAlpha = 1; }
  hairFront(c, S, d);
  if (!back) face(c, S, d);
  if (head) c.restore();
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
function hairBack(c: Ctx, S: PersonLook, _d: Dir) {
  var H = S.hair, ink = STICKER_INK;
  circle(c, 16, 12, 15); fillStroke(c, H.color, ink, 1.6);
  bumps(c, 16, 12, 14, 16, 3.4, 0, Math.PI * 2, H.color);
  c.strokeStyle = H.hi!; c.lineWidth = 0.9;
  for (var k = 0; k < 9; k++) { var a = k / 9 * Math.PI * 2; c.beginPath(); c.arc(16 + Math.cos(a) * 11, 12 + Math.sin(a) * 11, 2, 0, 4.2); c.stroke(); }
}
function hairFront(c: Ctx, S: PersonLook, d: Dir) {
  var H = S.hair, ink = STICKER_INK, back = d === 'up', side = d === 'left', st = H.style;
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
    if (st === 'longcurls' || st === 'wavy') { rr(c, 7.5, 12, 17, 9, 4); c.fillStyle = H.color; c.fill(); }
    hiSwirls(c, H, 16, 8);
    c.restore(); return;
  }
  if (side) {
    c.beginPath(); c.arc(16, 12, 10.2, Math.PI * 0.75, Math.PI * 2.02); c.closePath(); c.fillStyle = H.color; c.fill();
    c.beginPath(); c.moveTo(15, 3); c.quadraticCurveTo(26, 4, 25.6, 16); c.lineTo(18, 14); c.closePath(); c.fill();
    if (st === 'curls' || st === 'longcurls') { bumps(c, 16, 11, 10, 10, 2.5, Math.PI * 0.95, Math.PI * 2.05, H.color); bumps(c, 23, 12, 3.4, 3, 2.4, -1.2, 1.3, H.color); }
    if (st === 'longcurls' || st === 'wavy') { rr(c, 17, 11, 9, 11, 4); c.fill(); }
    if (st === 'quiff') { c.beginPath(); c.moveTo(7, 6); c.quadraticCurveTo(9, -1, 18, 1); c.lineTo(16, 6); c.closePath(); c.fill(); }
    c.beginPath(); c.arc(16, 12, 10.2, Math.PI * 0.95, Math.PI * 1.9); c.strokeStyle = ink; c.lineWidth = 1.4; c.stroke();
    hiSwirls(c, H, 17, 6);
    c.restore(); return;
  }
  /* front */
  c.beginPath(); c.arc(16, 12, 10.1, Math.PI * 1.0, Math.PI * 2.0);
  var fy = st === 'quiff' ? 7 : st === 'wavy' ? 9 : 8;
  c.lineTo(25.8, 13); c.quadraticCurveTo(21, fy, 16, fy + 0.6); c.quadraticCurveTo(11, fy, 6.2, 13); c.closePath();
  c.fillStyle = H.color; c.fill();
  if (st === 'curls' || st === 'longcurls') bumps(c, 16, 10.5, 9.4, 12, 2.5, Math.PI * 0.95, Math.PI * 2.05, H.color);
  if (st === 'curls') { bumps(c, 9.5, 9, 0.1, 0, 2.4, 0, 0, H.color); bumps(c, 14, 8.6, 0.1, 0, 2.3, 0, 0, H.color); bumps(c, 19, 8.8, 0.1, 0, 2.3, 0, 0, H.color); }
  if (st === 'longcurls') { rr(c, 4.8, 9, 4.6, 12, 2.3); c.fill(); rr(c, 22.6, 9, 4.6, 12, 2.3); c.fill(); bumps(c, 16, 8.4, 4, 4, 2.4, 0.4, 2.7, H.color); }
  if (st === 'wavy') { rr(c, 4.6, 8, 5, 13, 2.5); c.fill(); rr(c, 22.4, 8, 5, 13, 2.5); c.fill(); c.beginPath(); c.moveTo(9, 6); c.quadraticCurveTo(17, 4, 24, 11); c.quadraticCurveTo(17, 8, 9, 10); c.closePath(); c.fill(); }
  if (st === 'quiff') { c.beginPath(); c.moveTo(8, 6); c.quadraticCurveTo(12, -2, 22, 0); c.quadraticCurveTo(25, 3, 24, 7); c.closePath(); c.fill(); }
  c.beginPath(); c.arc(16, 12, 10.1, Math.PI * 1.0, Math.PI * 2.0); c.strokeStyle = ink; c.lineWidth = 1.4; c.stroke();
  hiSwirls(c, H, 16, 5);
  c.restore();
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
    glasses(c, S, d);
    return;
  }
  circle(c, 12.4, 14.4, 1.35); c.fillStyle = ink; c.fill();
  circle(c, 19.6, 14.4, 1.35); c.fill();
  circle(c, 10.2, 17.4, 1.9); c.fillStyle = 'rgba(234,120,110,.35)'; c.fill();
  circle(c, 21.8, 17.4, 1.9); c.fill();
  c.beginPath(); c.moveTo(14.6, 18.6); c.quadraticCurveTo(16, 19.6, 17.4, 18.6); c.strokeStyle = ink; c.lineWidth = 1.1; c.stroke();
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
  antonio: { skin: '#ddae93', hair: { style: 'curls', color: '#1d1512', hi: '#9a8a7c' }, top: '#414c72', top2: '#2a3252', style: 'hoodie', pants: '#2b2f3a', shoes: '#f3f3f3' },
  costanzo: { skin: '#e6bea5', hair: { style: 'wavy', color: '#2a1d16', hi: '#9a7c68' }, top: '#25272f', top2: '#14151a', style: 'turtleneck', pants: '#1c1d22', shoes: '#f0f0f0', glasses: 'thin' },
  andrea: { skin: '#e3b99d', hair: { style: 'quiff', color: '#1d1613', hi: '#7a6b60' }, top: '#25262c', top2: '#3a3c45', style: 'tee', pants: '#26324a', shoes: '#e9e9e9' },
  valentin: { skin: '#edc4ab', hair: { style: 'mane', color: '#7b4d33', hi: '#e6b98c' }, top: '#ddd6c6', top2: '#1c1c21', style: 'jacket', pants: '#3b3f4b', shoes: '#f3f3f3', glasses: 'green' },
  forchetta: { skin: '#e4bca1', hair: { style: 'longcurls', color: '#4f3423', hi: '#c29670' }, top: '#5d5a3e', top2: '#20263a', style: 'stripes', stripes: ['#283046', '#d6c9a8', '#6e6c43', '#8b8f93'], pants: '#22252d', shoes: '#efefef' },
  zendavid: { skin: '#deb294', hair: { style: 'buzz', color: '#2a201b' }, top: '#837c74', top2: '#19191d', style: 'knit', pants: '#56627a', shoes: '#e9e9e9', glasses: 'round', beard: '#2a1f1a', phones: true }
};
/* people of Formia who are not in the squad but are somebody: Nicola Spadea, windsurf champion and instructor
   at Vindicio, tanned, sun-bleached hair, sunglasses, lycra and boardshorts, barefoot on the sand */
export const LOOKS: Record<string, PersonLook> = {
  nicola: { skin: '#c48f6c', hair: { style: 'quiff', color: '#3a2a20', hi: '#d9b17a' }, top: '#1fa3b5', top2: '#ffffff', style: 'tee', pants: '#ff8a3c', shoes: '#c48f6c', glasses: 'sun' }
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
