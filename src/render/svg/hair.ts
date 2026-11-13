import type { LongHair, CurlsHair, Look, QuiffHair, WavyHair, BuzzHair } from './types';
import { rng, r1, pt, thru, sample, coilPts, litRuns, swirl, mirrorG } from './util';

/* ================= hair ================= */
function frontY(H: CurlsHair, x: number): number {
  var F = H.front;
  for (var i = 0; i < F.length - 1; i++) {
    var a = F[i], b = F[i + 1];
    if (x <= a[0] && x >= b[0]) return a[1] + (b[1] - a[1]) * (a[0] - x) / (a[0] - b[0]);
  }
  return H.frontDefault == null ? 120 : H.frontDefault;
}
function inEll(x: number, y: number, e: { cx: number; cy: number; rx: number; ry: number }): boolean { var dx = (x - e.cx) / e.rx, dy = (y - e.cy) / e.ry; return dx * dx + dy * dy < 1; }
function inShape(H: CurlsHair, x: number, y: number, shrink: number): boolean {
  var p = H.p || 2, dx = Math.abs(x - H.cx) / (H.rx - shrink), dy = Math.abs(y - H.cy) / (H.ry - shrink);
  return Math.pow(dx, p) + Math.pow(dy, p) <= 1;
}
function edgePt(H: CurlsHair, a: number, inset: number): number[] {
  var p = H.p || 2, c = Math.cos(a), sn = Math.sin(a);
  return [H.cx + (H.rx - inset) * (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / p), H.cy + (H.ry - inset) * (sn < 0 ? -1 : 1) * Math.pow(Math.abs(sn), 2 / p)];
}

/* curl clusters: Antonio, Forchetta, and Valentin's mane */
export function hairCurls(c: Look): string {
  var H = c.hair as CurlsHair, P = c.P, R = rng(H.seed), i, a, k, cl = [];
  var CX = H.cx, CY = H.cy, RX = H.rx, RY = H.ry, fills = H.fills;
  var edgeN = H.edgeN || 22;
  for (i = 0; i <= edgeN; i++) {
    a = Math.PI * (H.a0 == null ? 0.95 : H.a0) + Math.PI * (H.aSpan == null ? 1.1 : H.aSpan) * i / edgeN;
    var r = H.rEdge[0] + R() * (H.rEdge[1] - H.rEdge[0]), ep = edgePt(H, a, r * 0.35);
    ep[0] += (R() - 0.5) * 3; ep[1] += (R() - 0.5) * 3;
    if (H.avoid && inEll(ep[0], ep[1], { cx: H.avoid.cx, cy: H.avoid.cy, rx: H.avoid.rx - 4, ry: H.avoid.ry - 4 })) continue;
    cl.push([ep[0], ep[1], r]);
  }
  if (H.sides) H.sides.forEach(function (q) {
    cl.push([q[0], q[1], q[2]]);
    cl.push([260 - q[0] + (R() - 0.5) * 2, q[1] + (R() - 0.5) * 3, q[2] * (0.92 + R() * 0.16)]);
  });
  var tries = 0, minD = H.minD || 8.5;
  while (cl.length < H.count && tries < 12000) {
    tries++;
    var x = CX - RX + R() * RX * 2, y = CY - RY + R() * (RY * 2);
    if (!inShape(H, x, y, 4)) continue;
    if (y > frontY(H, x) - 6) continue;
    if (H.avoid && inEll(x, y, H.avoid)) continue;
    var ok = true;
    for (k = 0; k < cl.length && ok; k++) if (Math.hypot(cl[k][0] - x, cl[k][1] - y) < minD) ok = false;
    if (!ok) continue;
    cl.push([x, y, H.rIn[0] + R() * (H.rIn[1] - H.rIn[0])]);
  }
  for (i = 1; i < H.front.length - 1; i++) cl.push([H.front[i][0] + (R() - 0.5) * 3, H.front[i][1] - 4 + R() * 2, H.rFront[0] + R() * (H.rFront[1] - H.rFront[0])]);
  cl.sort(function (p, q) { return p[1] - q[1]; });

  var g = '';
  cl.forEach(function (q, k) {
    var x = q[0], y = q[1], r = q[2];
    var glow = (H.glow0 || 0.16) + (H.glow1 || 0.42) * Math.max(0, 1 - Math.hypot(x - (CX - 30), y - (CY - RY + 14)) / (RX * 1.8));
    var el = H.elong && Math.hypot(x - 130, y - (H.flowY || 50)) > 18;
    if (el) g += '<g transform="translate(' + r1(x) + ' ' + r1(y) + ') rotate(' + r1(Math.atan2(y - (H.flowY || 50), x - 130) * 180 / Math.PI - 90) + ') scale(1 ' + H.elong + ') translate(' + r1(-x) + ' ' + r1(-y) + ')">';
    g += '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(r) + '" fill="' + fills[k % fills.length] + '"/>';
    var a0 = -0.2 + (R() - 0.5) * 0.4, a1 = 2.4 + (R() - 0.5) * 0.4, rr = r * 0.8;
    g += '<path d="M' + pt([x + rr * Math.cos(a0), y + rr * Math.sin(a0)]) + 'A' + r1(rr) + ' ' + r1(rr) + ' 0 0 1 ' + pt([x + rr * Math.cos(a1), y + rr * Math.sin(a1)]) + '" fill="none" stroke="' + H.out + '" stroke-width="' + r1(r * 0.34) + '" stroke-linecap="round" opacity=".8"/>';
    if (H.hiStyle === 'wave') {
      var wr = r * 0.62, ang = -0.35 + (R() - 0.5) * 0.7, ca = Math.cos(ang), sa = Math.sin(ang);
      var w0 = [x - wr * ca, y - r * 0.15 - wr * sa], w1 = [x + wr * ca, y - r * 0.15 + wr * sa];
      g += '<path d="M' + pt(w0) + 'C' + pt([w0[0] + wr * 0.8 * ca + wr * 0.5 * sa, w0[1] + wr * 0.8 * sa - wr * 0.5 * ca]) + ' ' + pt([w1[0] - wr * 0.8 * ca - wr * 0.5 * sa, w1[1] - wr * 0.8 * sa + wr * 0.5 * ca]) + ' ' + pt(w1) + '" fill="none" stroke="' + H.hi + '" stroke-width="' + r1(1 + r * 0.05) + '" stroke-linecap="round" opacity="' + r1(glow) + '"/>';
    } else if (R() < 0.68) g += '<path d="' + swirl(x - r * 0.08, y - r * 0.1, r * 0.72, R() < 0.5 ? 1 : -1, R() * 6.28) + '" fill="none" stroke="' + H.hi + '" stroke-width="' + r1(0.85 + r * 0.05) + '" stroke-linecap="round" opacity="' + r1(glow) + '"/>';
    else {
      var b0 = 3.3 + R() * 0.6, b1 = b0 + 1.3 + R() * 0.8, br = r * 0.62;
      g += '<path d="M' + pt([x + br * Math.cos(b0), y + br * Math.sin(b0)]) + 'A' + r1(br) + ' ' + r1(br) + ' 0 0 1 ' + pt([x + br * Math.cos(b1), y + br * Math.sin(b1)]) + '" fill="none" stroke="' + H.hi + '" stroke-width="1.1" stroke-linecap="round" opacity="' + r1(glow * 1.1) + '"/>';
    }
    if (el) g += '</g>';
  });
  var fr = '', nf = H.frizz || 12;
  for (i = 0; i < nf; i++) {
    a = Math.PI * (1.02 + 0.96 * R());
    if (H.mane) a = Math.PI * 2 * R();
    var fx = CX + (RX + 3) * Math.cos(a), fy = CY + (RY + 3) * Math.sin(a);
    if (H.avoid && inEll(fx, fy, { cx: H.avoid.cx, cy: H.avoid.cy, rx: H.avoid.rx + 6, ry: H.avoid.ry + 6 })) continue;
    fr += '<path d="' + thru(coilPts(fx, fy, (H.mane ? 3 : 2.4) + R() * 2.4, 0.5 + R() * 0.7, { phase: R() * 6.28, rot: R() * 6.28, pitch: 1.4 })) + '"/>';
  }
  var s = '';
  var back;
  if (H.p) {
    var bp = [];
    for (i = 0; i < 48; i++) bp.push(edgePt(H, Math.PI * 2 * i / 48, 6));
    back = '<path d="' + thru(bp, true) + '" fill="' + H.out + '"/>';
  } else back = '<ellipse cx="' + CX + '" cy="' + (CY - 2) + '" rx="' + (RX - 4) + '" ry="' + (RY - 5) + '" fill="' + H.out + '"/>';
  if (H.sides) back += '<path d="M60 100C56 118 58 136 64 148L86 148L86 100Z" fill="' + H.out + '"/>' + mirrorG('<path d="M60 100C56 118 58 136 64 148L86 148L86 100Z" fill="' + H.out + '"/>');
  s += '<g id="' + P + 'Back">' + back + '</g>';
  s += '<g id="' + P + 'Top">' + g + '<g fill="none" stroke="' + (H.frizzColor || fills[2]) + '" stroke-width="1.1" stroke-linecap="round" opacity="' + (H.mane ? 0.85 : 1) + '">' + fr + '</g></g>';
  if (H.rings) {
    var fo = '', fb = '', fs = '';
    H.rings.forEach(function (q, k) {
      var Pp = coilPts(q[0], q[1], q[2], q[3], { dir: q[4], phase: -1.6 + k * 1.1, pitch: q[2] * q[6], squash: 0.95, taper: 0.1, rot: q[5] });
      var d = thru(Pp);
      fo += '<path d="' + d + '" stroke="' + H.out + '" stroke-width="4.2"/>';
      fb += '<path d="' + d + '" stroke="' + fills[(k + 2) % fills.length] + '" stroke-width="2.2"/>';
      var lit = litRuns(Pp, 0.42);
      if (lit) fs += '<path d="' + lit + '" stroke="' + H.hi + '" stroke-width="1" opacity=".65"/>';
    });
    s += '<g id="' + P + 'Fringe" fill="none" stroke-linecap="round">' + fo + fb + fs + '</g>';
  }
  if (H.fshadow) s += '<g id="' + P + 'FShadow"><path d="' + H.fshadow + '" fill="' + c.skin.deep + '" opacity=".45" filter="url(#fB3)"/></g>';
  return s;
}

/* wavy medium-length locks: Costanzo */
export function hairWavy(c: Look): string {
  var H = c.hair as WavyHair, P = c.P, R = rng(H.seed), s = '';
  var back = 'M60 198C48 168 46 128 54 96C64 58 96 32 132 32C168 32 198 58 206 96C214 130 212 170 200 200C192 212 180 214 172 206L88 206C80 214 68 210 60 198Z';
  s += '<g id="' + P + 'Back"><path d="' + back + '" fill="' + H.out + '"/></g>';
  function strand(ctrl: number[][], amp: number, waves: number, phase: number) {
    var base = sample(ctrl, 36), pts = [];
    for (var i = 0; i < base.length; i++) {
      var p = base[i], q = base[Math.min(base.length - 1, i + 1)], o = base[Math.max(0, i - 1)];
      var tx = q[0] - o[0], ty = q[1] - o[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
      var t = i / (base.length - 1), off = amp * Math.sin(phase + t * waves * Math.PI * 2) * (0.25 + 0.75 * t);
      pts.push([p[0] + nx * off, p[1] + ny * off]);
    }
    return pts;
  }
  var locks: [number[][], number, number, number, number?][] = [
    /* crown arching over the top */
    [[[88, 64], [108, 40], [140, 35], [170, 46], [190, 70]], 2, 1.2, 9],
    [[[82, 76], [98, 48], [130, 39], [160, 43], [186, 62]], 2, 1.4, 8.5],
    /* left curtain, from the parting down to the jaw */
    [[[104, 40], [76, 52], [58, 84], [55, 122], [58, 162]], 4, 2, 8, 1],
    [[[108, 42], [80, 55], [62, 88], [58, 134], [62, 180]], 4.4, 2.2, 8.6, 1],
    [[[112, 44], [84, 59], [68, 93], [64, 142], [68, 192]], 4.6, 2.3, 8.6, 1],
    [[[116, 46], [92, 63], [76, 99], [72, 147], [76, 199]], 4.4, 2.2, 8, 1],
    [[[120, 48], [100, 68], [85, 106], [83, 152], [87, 202]], 4, 2.1, 7, 1],
    /* right curtain */
    [[[120, 40], [162, 40], [194, 64], [205, 108], [203, 160]], 4, 2, 8, -1],
    [[[122, 42], [160, 46], [188, 72], [197, 122], [193, 178]], 4.4, 2.2, 8.6, -1],
    [[[124, 44], [158, 52], [182, 84], [189, 132], [185, 188]], 4.6, 2.3, 8.6, -1],
    [[[126, 46], [156, 58], [176, 96], [179, 146], [175, 198]], 4.2, 2.2, 7.6, -1],
    /* fringe swept toward the viewer's right */
    [[[120, 44], [134, 62], [156, 80], [180, 92], [192, 106]], 3, 1.6, 8],
    [[[116, 46], [120, 70], [136, 90], [160, 102], [176, 111]], 3.4, 1.7, 8.6],
    [[[112, 48], [112, 72], [124, 94], [146, 106], [161, 114]], 3.4, 1.6, 8.2],
    [[[108, 50], [104, 74], [110, 96], [126, 108], [139, 113]], 3, 1.5, 7.6],
    [[[104, 52], [96, 74], [94, 96], [99, 110]], 2.6, 1.2, 7]
  ];
  var cap = 'M66 114C62 76 92 44 132 44C170 44 198 74 194 116C188 106 178 100 166 98C150 96 136 100 124 98C108 96 90 98 78 106C72 110 68 114 66 114Z';
  var curtL = 'M54 104C48 140 52 176 62 204C70 210 82 210 90 204C86 180 84 148 86 120C84 110 72 102 54 104Z';
  var g = '<path d="' + cap + '" fill="' + H.out + '"/><path d="' + curtL + '" fill="' + H.out + '"/>' + mirrorG('<path d="' + curtL + '" fill="' + H.out + '"/>');
  var o = '', b = '', h = '';
  locks.forEach(function (L, k) {
    var pts = strand(L[0], L[1], L[2], R() * 6.28), w = L[3];
    if (L[4]) {
      var e = pts[pts.length - 1], cp = coilPts(e[0] + L[4] * -3, e[1] - 1, 3.6, 0.8, { dir: L[4], phase: L[4] > 0 ? 0 : Math.PI, pitch: 0.6, squash: 1 });
      pts = pts.concat(cp.map(function (p) { return [p[0], p[1]]; }));
    }
    var d = thru(pts);
    o += '<path d="' + d + '" stroke="' + H.out + '" stroke-width="' + r1(w + 2.4) + '"/>';
    b += '<path d="' + d + '" stroke="' + H.fills[k % H.fills.length] + '" stroke-width="' + r1(w) + '"/>';
    h += '<path d="' + d + '" stroke="' + H.hi + '" stroke-width="1.2" opacity=".5" stroke-dasharray="' + r1(8 + R() * 10) + ' ' + r1(10 + R() * 14) + '" stroke-dashoffset="' + r1(R() * 20) + '" transform="translate(-1 -1)"/>';
  });
  g += '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' + o + b + h + '</g>';
  s += '<g id="' + P + 'Top">' + g + '</g>';
  s += '<g id="' + P + 'FShadow"><path d="M86 106C104 100 132 102 160 108C176 112 186 118 192 124L186 132C170 122 150 116 130 116C112 116 98 118 84 124Z" fill="' + c.skin.deep + '" opacity=".4" filter="url(#fB3)"/></g>';
  return s;
}

/* long hair parted in the middle, soft waves down onto the shoulders: Claudia. The mass behind falls past the shoulders
   (Back, under the clothes); the locks in front frame the face and come down over the collar (Top, over the clothes) */
export function hairLong(c: Look): string {
  var H = c.hair as LongHair, P = c.P, R = rng(H.seed), s = '', bob = !!H.bob;
  /* long down the back, or a bob cut at the shoulders with the ends turned out */
  var back = bob ? 'M58 128C52 90 72 44 130 40C188 44 208 90 202 128C204 160 207 190 214 214C220 226 210 238 196 236C188 240 178 238 172 234L88 234C82 238 72 240 64 236C50 238 40 226 46 214C53 190 56 160 58 128Z'
    : 'M58 128C52 90 72 44 130 40C188 44 208 90 202 128C204 176 210 222 216 266C202 282 178 288 160 282L100 282C82 288 58 282 44 266C50 222 56 176 58 128Z';
  s += '<g id="' + P + 'Back"><path d="' + back + '" fill="' + H.out + '"/><path d="' + back + '" fill="' + H.fills[2] + '" transform="translate(130 160) scale(.95) translate(-130 -160)"/></g>';
  /* the crown, from the parting at 130 out to the temples; the two curtains that frame the face and fall over the
     shoulders: filled masses, outlined once, with fine waving strands inside for the texture */
  var cap = 'M72 112C66 70 96 42 130 42C164 42 194 70 188 112C182 98 172 86 158 78C146 72 136 64 130 56C124 64 114 72 102 78C88 86 78 98 72 112Z';
  var curtL = bob ? 'M78 96C64 104 58 130 58 156C58 182 54 202 44 218C40 228 50 236 62 232C72 236 84 234 94 226C94 212 92 198 89 186C85 172 82 158 80 142C79 124 80 110 84 100Z'
    : 'M78 96C64 104 58 130 58 160C58 196 54 228 46 256C52 266 64 270 74 266C80 268 88 268 96 262C94 244 92 222 90 206C86 190 82 172 80 152C79 132 80 112 84 100Z';
  var curtR = bob ? 'M182 96C196 104 202 130 202 156C202 182 206 202 216 218C220 228 210 236 198 232C188 236 176 234 166 226C166 212 168 198 171 186C175 172 178 158 180 142C181 124 180 110 176 100Z'
    : 'M182 96C196 104 202 130 202 160C202 196 206 228 214 256C208 266 196 270 186 266C180 268 172 268 164 262C166 244 168 222 170 206C174 190 178 172 180 152C181 132 180 112 176 100Z';
  var g = '<clipPath id="' + P + 'LongClip"><path d="' + cap + '"/><path d="' + curtL + '"/><path d="' + curtR + '"/></clipPath>';
  [cap, curtL, curtR].forEach(function (d) { g += '<path d="' + d + '" fill="' + H.fills[0] + '" stroke="' + H.out + '" stroke-width="2.6" stroke-linejoin="round"/>'; });
  var lines = '';
  function wave(ctrl: number[][], amp: number, waves: number, ph: number) {
    var base = sample(ctrl, 30), pts = [];
    for (var i = 0; i < base.length; i++) {
      var p = base[i], q = base[Math.min(base.length - 1, i + 1)], o = base[Math.max(0, i - 1)];
      var tx = q[0] - o[0], ty = q[1] - o[1], tl = Math.hypot(tx, ty) || 1, t = i / (base.length - 1);
      var off = amp * Math.sin(ph + t * waves * Math.PI * 2) * (0.3 + 0.7 * t);
      pts.push([p[0] - ty / tl * off, p[1] + tx / tl * off]);
    }
    return thru(pts);
  }
  for (var k = 0; k < 26; k++) {
    var side = k % 2 ? 1 : -1, f = Math.floor(k / 2) / 12, x0 = 130 + side * (3 + f * 8);
    var ctrl = bob ? [[x0, 46 + f * 6], [130 + side * (26 + f * 28), 62 + f * 8], [130 + side * (44 + f * 14), 104 + f * 6], [130 + side * (48 + f * 22), 154], [130 + side * (46 + f * 30), 196], [130 + side * (56 + f * 30), 230]]
      : [[x0, 46 + f * 6], [130 + side * (26 + f * 28), 62 + f * 8], [130 + side * (44 + f * 14), 104 + f * 6], [130 + side * (48 + f * 22), 160], [130 + side * (44 + f * 34), 214], [130 + side * (42 + f * 42), 262]];
    var d0 = wave(ctrl, 3 + R() * 2.4, 2 + R(), R() * 6.28), col = k % 3 === 0 ? H.hi : H.fills[k % H.fills.length];
    lines += '<path d="' + d0 + '" stroke="' + col + '" stroke-width="' + r1(1.2 + R() * 1.6) + '" opacity="' + (col === H.hi ? '.55' : '.9') + '"/>';
  }
  g += '<g clip-path="url(#' + P + 'LongClip)" fill="none" stroke-linecap="round">' + lines + '</g>';
  /* the shine on the top of the head, and the parting */
  g += '<path d="M100 62C112 54 122 50 127 50M133 50C140 50 150 54 162 62" fill="none" stroke="' + H.hi + '" stroke-width="5" opacity=".3" filter="url(#fB3)"/>';
  if (!H.bangs) g += '<path d="M130 44L130 58" stroke="' + H.out + '" stroke-width="1.6" opacity=".7"/>';
  else {
    /* the fringe: straight across, down to the brows, its edge a row of soft points; fine strands falling in it */
    var edge: number[][] = [], n = 13;
    for (var e = 0; e <= n; e++) { var t = e / n; edge.push([r1(178 - t * 96), r1(112 + Math.sin(t * Math.PI) * 4 + (e % 2 ? 4.2 : 0) + (R() - 0.5) * 1.6)]); }
    var fr = 'M80 112C78 82 100 56 130 54C160 56 182 82 180 112L' + edge.map(function (q) { return q[0] + ' ' + q[1]; }).join('L') + 'Z';
    g += '<clipPath id="' + P + 'FringeClip"><path d="' + fr + '"/></clipPath>';
    g += '<path d="' + fr + '" fill="' + H.fills[1] + '" stroke="' + H.out + '" stroke-width="2.4" stroke-linejoin="round"/>';
    var fl = '';
    for (var q = 0; q < 22; q++) {
      var x = 84 + q * 4.3 + (R() - 0.5) * 2, top = 60 + Math.abs(x - 130) * 0.32;
      fl += '<path d="M' + r1(x + (130 - x) * 0.18) + ' ' + r1(top) + 'Q' + r1(x - 1 + (R() - 0.5) * 3) + ' ' + r1(top + 30) + ' ' + r1(x + (R() - 0.5) * 2) + ' 122" stroke="' + (q % 4 === 0 ? H.hi : H.fills[q % H.fills.length]) + '" stroke-width="' + r1(1.1 + R() * 1.3) + '" opacity="' + (q % 4 === 0 ? '.45' : '.85') + '"/>';
    }
    g += '<g clip-path="url(#' + P + 'FringeClip)" fill="none" stroke-linecap="round">' + fl + '</g>';
    g += '<path d="M98 74C112 64 124 62 134 62" fill="none" stroke="' + H.hi + '" stroke-width="5" opacity=".22" filter="url(#fB3)"/>';
  }
  s += '<g id="' + P + 'Top">' + g + '</g>';
  s += '<g id="' + P + 'FShadow"><path d="' + (H.bangs ? 'M86 116C100 112 116 112 130 114C144 112 160 112 174 116L172 126C158 120 144 120 130 122C116 120 102 120 88 126Z' : 'M88 108C100 96 116 90 130 88C144 90 160 96 172 108L170 118C158 106 144 100 130 100C116 100 102 106 90 118Z') + '" fill="' + c.skin.deep + '" opacity=".3" filter="url(#fB3)"/></g>';
  return s;
}

/* short faded sides, top brushed up and to the side: Andrea */
export function hairQuiff(c: Look): string {
  var H = c.hair as QuiffHair, P = c.P, R = rng(H.seed), s = '', i;
  s += '<g id="' + P + 'Back"><ellipse cx="130" cy="92" rx="55" ry="46" fill="' + H.out + '"/></g>';
  /* the faded sides: they start inside the mass of the top, so nothing shows between them, and their inner edge follows
     the hairline down to the ear instead of a straight cut */
  var sideL = 'M78 98C70 106 66 118 67 130C68 141 73 150 80.6 157L84.6 157C82.8 148 82.2 138 83 128C83.8 120 85.6 112 88.6 105Z';
  var side = '<path d="' + sideL + '" fill="url(#' + P + 'FadeG)"/><path d="' + sideL + '" fill="#000" filter="url(#fGrain)" opacity=".35"/>';
  var line = [[79, 121], [82, 113], [89, 106], [100, 101], [114, 98], [128, 97], [142, 97], [156, 99], [168, 103], [178, 109], [184, 117], [186, 124]];
  var top: number[][] = [];
  for (i = 0; i <= 18; i++) {
    var t = i / 18, a = -Math.PI * (0.03 + 0.94 * t);
    var quiff = 7 * Math.exp(-Math.pow((t - 0.36) / 0.2, 2)), tuft = (i % 2 ? 2 + R() * 3 : 0);
    top.push([133 + 58 * Math.cos(a), 112 + (61 + quiff + tuft) * Math.sin(a)]);
  }
  var mass = thru(line.concat(top), true);
  var g = side + mirrorG(side) + '<path d="' + mass + '" fill="' + H.out + '"/>';
  function topY(x: number) {
    var best = top[0], d = 1e9;
    top.forEach(function (p) { var dd = Math.abs(p[0] - x); if (dd < d) { d = dd; best = p; } });
    return best[1];
  }
  var str = '', hi = '';
  for (i = 0; i <= 34; i++) {
    var u = i / 34, k = Math.min(line.length - 2, Math.floor(u * (line.length - 1))), f = u * (line.length - 1) - k;
    var x0 = line[k][0] + (line[k + 1][0] - line[k][0]) * f, y0 = line[k][1] + (line[k + 1][1] - line[k][1]) * f - 1.5;
    var x1 = x0 + (122 - x0) * 0.3 - 6 + (R() - 0.5) * 8, y1 = topY(x1) + 4 + R() * 5;
    var cx = (x0 + x1) / 2 + (x0 < 128 ? -7 : 5), cy = (y0 + y1) / 2 - 4;
    var d = 'M' + r1(x0) + ' ' + r1(y0) + 'Q' + r1(cx) + ' ' + r1(cy) + ' ' + r1(x1) + ' ' + r1(y1);
    str += '<path d="' + d + '" stroke="' + H.body[i % H.body.length] + '" stroke-width="' + r1(2.4 + R() * 1.4) + '"/>';
    if (R() < 0.6) hi += '<path d="' + d + '" stroke="' + H.hi + '" stroke-width=".9" opacity="' + r1(0.3 + R() * 0.35) + '" stroke-dasharray="0 ' + r1(10 + R() * 8) + ' ' + r1(8 + R() * 8) + ' 60"/>';
  }
  /* a few strands falling forward on the forehead (photo in the car) */
  var locks = '';
  [[148, 99, 6, 10], [157, 101, 4, 9], [139, 98, 5, 7], [166, 104, 3, 8]].forEach(function (q) {
    var x = q[0], y = q[1], dx = q[2], dy = q[3];
    locks += '<path d="M' + (x - 3) + ' ' + y + 'Q' + r1(x + dx * 0.2) + ' ' + r1(y + dy * 0.7) + ' ' + (x + dx) + ' ' + (y + dy) + 'Q' + r1(x + dx * 0.15 + 2) + ' ' + r1(y + dy * 0.45) + ' ' + (x + 4) + ' ' + (y - 1) + 'Z" fill="' + H.out + '"/>';
    locks += '<path d="M' + (x - 0.5) + ' ' + y + 'Q' + r1(x + dx * 0.25) + ' ' + r1(y + dy * 0.6) + ' ' + r1(x + dx * 0.85) + ' ' + r1(y + dy * 0.85) + '" fill="none" stroke="' + H.body[1] + '" stroke-width="1.1"/>';
  });
  g += '<g fill="none" stroke-linecap="round">' + str + hi + '</g>' + locks;
  g += '<path d="M96 66C108 56 122 52 136 52" fill="none" stroke="' + H.hi + '" stroke-width="5" opacity=".14" filter="url(#fB3)"/>';
  s += '<g id="' + P + 'Top">' + g + '</g>';
  s += '<g id="' + P + 'FShadow"><path d="M86 112C100 104 116 101 130 101C148 101 164 104 178 112L176 118C164 111 150 108 130 108C112 108 98 111 86 118Z" fill="' + c.skin.deep + '" opacity=".22" filter="url(#fB3)"/></g>';
  return s;
}

/* buzz cut: Zendavid */
export function hairBuzz(c: Look): string {
  var H = c.hair as BuzzHair, P = c.P, S = c.skin, s = '';
  s += '<g id="' + P + 'Back"><ellipse cx="130" cy="100" rx="54" ry="52" fill="url(#' + P + 'SkinG)"/>' +
    '<path d="M76.4 106C75 70 100 48 130 48C160 48 185 70 183.6 106" fill="none" stroke="' + S.line + '" stroke-width="1.4"/></g>';
  var buzz = 'M77 132C72 104 80 72 100 58C110 52 120 49 130 49C140 49 150 52 160 58C180 72 188 104 183 132L178 129C178 112 176 98 170 89C162 83 150 80 140 80C134 81 126 81 120 80C108 80 96 83 90 89C84 98 82 112 82 129Z';
  s += '<g id="' + P + 'Top"><path d="' + buzz + '" fill="' + H.base + '" opacity=".5" filter="url(#fSoft)"/>' +
    '<path d="' + buzz + '" fill="#000" filter="url(#fGrain)" opacity=".85"/>' +
    '<path d="M100 60C110 55 120 53 130 53C140 53 150 55 160 60" fill="none" stroke="#fff" stroke-width="6" opacity=".08" filter="url(#fB3)"/></g>';
  return s;
}
