/* Geometry helpers for drawing in SVG path strings. Coordinates are rounded to 0.1 so the output stays small. */
export interface CoilOpts { dir?: number; phase?: number; pitch?: number; squash?: number; rot?: number; taper?: number }

export function rng(seed: number): () => number {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function r1(n: number): number { return Math.round(n * 10) / 10; }
export function pt(p: number[]): string { return r1(p[0]) + ' ' + r1(p[1]); }
export function thru(pts: number[][], closed?: boolean): string {
  var n = pts.length, d = 'M' + pt(pts[0]), i;
  var get = function (k: number) { return closed ? pts[(k + n) % n] : pts[Math.max(0, Math.min(n - 1, k))]; };
  var last = closed ? n : n - 1;
  for (i = 0; i < last; i++) {
    var p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    d += 'C' + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' ' +
      pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + pt(p2);
  }
  return closed ? d + 'Z' : d;
}
/* sample a smooth curve through control points */
export function sample(ctrl: number[][], n: number): number[][] {
  var out = [], segs = ctrl.length - 1;
  for (var i = 0; i <= n; i++) {
    var u = i / n * segs, k = Math.min(segs - 1, Math.floor(u)), t = u - k;
    var p0 = ctrl[Math.max(0, k - 1)], p1 = ctrl[k], p2 = ctrl[k + 1], p3 = ctrl[Math.min(segs, k + 2)];
    var t2 = t * t, t3 = t2 * t;
    out.push([0, 1].map(function (j) {
      return 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
    }));
  }
  return out;
}
export function coilPts(cx: number, cy: number, r: number, turns: number, o?: CoilOpts): number[][] {
  o = o || {};
  var dir = o.dir || 1, phase = o.phase || 0, pitch = o.pitch == null ? r * 0.9 : o.pitch;
  var squash = o.squash || 0.86, rot = o.rot || 0, taper = o.taper || 0;
  var steps = Math.max(12, Math.round(turns * 22)), pts = [], cs = Math.cos(rot), sn = Math.sin(rot);
  for (var i = 0; i <= steps; i++) {
    var t = i / steps * turns * Math.PI * 2, rr = r * (1 - taper * i / steps), ph = phase + dir * t;
    var lx = rr * Math.cos(ph), ly = rr * squash * Math.sin(ph);
    var y = ly + (t / (Math.PI * 2)) * pitch;
    var ox = lx * cs - ly * sn, oy = lx * sn + ly * cs, len = Math.hypot(ox, oy) || 1;
    pts.push([cx + lx * cs - y * sn, cy + lx * sn + y * cs, ox / len, oy / len]);
  }
  return pts;
}
const LX = -0.55, LY = -0.835;
export function litRuns(pts: number[][], thr: number): string {
  var runs: number[][][] = [], cur: number[][] = [];
  for (var i = 0; i < pts.length; i++) {
    var p = pts[i];
    if (p[2] * LX + p[3] * LY > thr) cur.push(p); else { if (cur.length > 2) runs.push(cur); cur = []; }
  }
  if (cur.length > 2) runs.push(cur);
  return runs.map(function (q) { return thru(q); }).join('');
}
export function swirl(cx: number, cy: number, r: number, dir: number, phase: number): string {
  var pts = [], steps = 26, turns = 1.2;
  for (var i = 0; i <= steps; i++) {
    var t = i / steps, ang = phase + dir * t * turns * Math.PI * 2, rr = r * (0.12 + 0.88 * t);
    pts.push([cx + rr * Math.cos(ang), cy + rr * 0.9 * Math.sin(ang)]);
  }
  return thru(pts);
}
export function mirrorG(inner: string): string { return '<g transform="translate(260 0) scale(-1 1)">' + inner + '</g>'; }
export function merge<T extends object>(a: T, b?: Partial<T>): T { var o: Record<string, unknown> = {}, k; for (k in a) o[k] = (a as Record<string, unknown>)[k]; for (k in b || {}) o[k] = (b as Record<string, unknown>)[k]; return o as T; }
