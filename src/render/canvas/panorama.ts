/* What one sees from a belvedere (Antonio, 21 November 2026): computed from the land as it is (data/panorama.ts), not
   drawn by hand. The land and the sea are laid on two grids of heights (a fine one over the gulf, a coarse one out to
   the islands and the Vesuvius); from the eye of the belvedere a ray goes out along every column of the picture and
   meets the ground, nearer things hiding farther ones, the haze growing with the distance and the earth curving away.
   On it, in the style of the map: the edges inked like a pen drawing (stronger near, fading far), the shore picked out
   in foam, the towns in little pastel houses, the trees near by, the towers and the castles one knows, the sun and the
   clouds of the hour, and the names. Only drawing: ui/panorama.ts shows it. */
import { MAINLAND, ISLES, HEIGHTS, TOWNS, MARKS, NAMES, VIEWPOINTS, type LL, type Viewpoint } from '../../data/panorama';

export type PanoLight = 'day' | 'dusk' | 'night';
/** a name, and the point it names (the end of its little line) */
export interface PanoLabel { text: string; x: number; y: number; ax: number; ay: number }
const KM_LAT = 111.2, KM_LON = 111.2 * Math.cos(41.25 * Math.PI / 180), EARTH = 6371000;

/* ---------- the grids ---------- */
interface Grid { lat0: number; lon0: number; dlat: number; dlon: number; nr: number; nc: number; e: Float32Array; town: Float32Array }
function hash(a: number, b: number, k: number) {
  var h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(k | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** a smooth noise over the ground, 0–1, on cells of `s` km */
function noise(lat: number, lon: number, s: number, k: number) {
  var u = lon * KM_LON / s, v = lat * KM_LAT / s, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j;
  fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv);
  var a = hash(i, j, k), b = hash(i + 1, j, k), c = hash(i, j + 1, k), d = hash(i + 1, j + 1, k);
  return (a + (b - a) * fu) * (1 - fv) + (c + (d - c) * fu) * fv;
}
function smooth(t: number) { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
function build(lat0: number, lat1: number, lon0: number, lon1: number, dlat: number, dlon: number): Grid {
  var nr = Math.ceil((lat1 - lat0) / dlat) + 1, nc = Math.ceil((lon1 - lon0) / dlon) + 1, land = new Uint8Array(nr * nc), r: number, c: number;
  /* the mainland, row by row (even-odd), then the islands */
  for (r = 0; r < nr; r++) {
    var lat = lat0 + r * dlat, xs: number[] = [];
    for (var i = 0, j = MAINLAND.length - 1; i < MAINLAND.length; j = i++) {
      var a = MAINLAND[i], b = MAINLAND[j];
      if ((a[0] <= lat && b[0] > lat) || (b[0] <= lat && a[0] > lat)) xs.push(a[1] + (lat - a[0]) / (b[0] - a[0]) * (b[1] - a[1]));
    }
    xs.sort(function (p, q) { return p - q; });
    for (var k = 0; k + 1 < xs.length; k += 2) for (c = Math.max(0, Math.ceil((xs[k] - lon0) / dlon)); c < nc && lon0 + c * dlon <= xs[k + 1]; c++) land[r * nc + c] = 1;
  }
  ISLES.forEach(function (s) {
    var ca = Math.cos(s.rot * Math.PI / 180), sa = Math.sin(s.rot * Math.PI / 180), ext = s.a / KM_LAT + 0.01;
    for (r = Math.max(0, Math.floor((s.at[0] - ext - lat0) / dlat)); r < nr && lat0 + r * dlat < s.at[0] + ext; r++)
      for (c = Math.max(0, Math.floor((s.at[1] - ext * 1.4 - lon0) / dlon)); c < nc && lon0 + c * dlon < s.at[1] + ext * 1.4; c++) {
        var n = (lat0 + r * dlat - s.at[0]) * KM_LAT, e = (lon0 + c * dlon - s.at[1]) * KM_LON, al = n * ca + e * sa, ac = -n * sa + e * ca;
        /* a ragged outline: the coast of an island is never an ellipse */
        var edge = 1 + (noise(lat0 + r * dlat, lon0 + c * dlon, 0.35, 91) - 0.5) * 0.5;
        if ((al / s.a) * (al / s.a) + (ac / s.b) * (ac / s.b) < edge) land[r * nc + c] = 1;
      }
  });
  /* how far from the sea, in km (two passes of a chamfer): the land comes down to the water along the shore */
  var far = new Float32Array(nr * nc), sx = dlon * KM_LON, sy = dlat * KM_LAT, sd = Math.hypot(sx, sy);
  for (i = 0; i < nr * nc; i++) far[i] = land[i] ? 1e9 : 0;
  for (r = 0; r < nr; r++) for (c = 0; c < nc; c++) {
    i = r * nc + c; if (!land[i]) continue;
    if (c > 0) far[i] = Math.min(far[i], far[i - 1] + sx);
    if (r > 0) { far[i] = Math.min(far[i], far[i - nc] + sy); if (c > 0) far[i] = Math.min(far[i], far[i - nc - 1] + sd); if (c < nc - 1) far[i] = Math.min(far[i], far[i - nc + 1] + sd); }
  }
  for (r = nr - 1; r >= 0; r--) for (c = nc - 1; c >= 0; c--) {
    i = r * nc + c; if (!land[i]) continue;
    if (c < nc - 1) far[i] = Math.min(far[i], far[i + 1] + sx);
    if (r < nr - 1) { far[i] = Math.min(far[i], far[i + nc] + sy); if (c < nc - 1) far[i] = Math.min(far[i], far[i + nc + 1] + sd); if (c > 0) far[i] = Math.min(far[i], far[i + nc - 1] + sd); }
  }
  /* the heights that reach this grid at all */
  var hs = HEIGHTS.filter(function (h) { var m = h.r / KM_LAT + 0.02; return h.at[0] > lat0 - m && h.at[0] < lat1 + m && h.at[1] > lon0 - m * 1.4 && h.at[1] < lon1 + m * 1.4; });
  var ts = TOWNS.filter(function (t) { return t.at[0] > lat0 - 0.05 && t.at[0] < lat1 + 0.05 && t.at[1] > lon0 - 0.07 && t.at[1] < lon1 + 0.07; });
  var E: Float32Array = new Float32Array(nr * nc), TW = new Float32Array(nr * nc);
  for (r = 0; r < nr; r++) for (c = 0; c < nc; c++) {
    i = r * nc + c;
    var la = lat0 + r * dlat, lo = lon0 + c * dlon;
    if (!land[i]) { E[i] = -12; continue; }
    var top = 0;
    for (k = 0; k < hs.length; k++) {
      var H = hs[k], dn = (la - H.at[0]) * KM_LAT, de = (lo - H.at[1]) * KM_LON, d = Math.sqrt(dn * dn + de * de);
      if (d < H.r) { var t1 = d / H.r, v = H.h * Math.pow(1 - t1, 1.7); if (v > top) top = v; }
    }
    /* ridges and gullies, more on the mountain than on the plain; down to the shore over the last few hundred metres */
    var rough = (noise(la, lo, 0.5, 11) - 0.5) * (6 + top * 0.1) + (noise(la, lo, 1.6, 12) - 0.5) * (8 + top * 0.14) + (noise(la, lo, 0.18, 13) - 0.5) * (3 + top * 0.03);
    E[i] = Math.max(1.5, (top + rough + 4) * smooth(far[i] / 0.7 + 0.08));
    var tw = 0;
    for (k = 0; k < ts.length; k++) {
      var T0 = ts[k], tn = (la - T0.at[0]) * KM_LAT, te = (lo - T0.at[1]) * KM_LON, td = Math.sqrt(tn * tn + te * te);
      if (td < T0.r) tw = Math.max(tw, T0.k * smooth(1.25 - td / T0.r * 1.25));
    }
    TW[i] = tw;
  }
  /* smoothed twice over the land, so that the shore and the slopes have no steps in them */
  for (var pass = 0; pass < 2; pass++) {
    var B = new Float32Array(E);
    for (r = 1; r < nr - 1; r++) for (c = 1; c < nc - 1; c++) {
      i = r * nc + c; if (!land[i]) continue;
      var sum = 0, n = 0;
      for (var a2 = -1; a2 <= 1; a2++) for (var b2 = -1; b2 <= 1; b2++) { var j2 = i + a2 * nc + b2; if (land[j2]) { sum += E[j2]; n++; } }
      B[i] = sum / n;
    }
    E = B;
  }
  return { lat0: lat0, lon0: lon0, dlat: dlat, dlon: dlon, nr: nr, nc: nc, e: E, town: TW };
}
var grids: { fine: Grid; coarse: Grid } | null = null;
function world() {
  if (!grids) grids = { coarse: build(40.45, 41.95, 12.80, 14.90, 0.004, 0.005), fine: build(41.180, 41.340, 13.500, 13.800, 0.0003, 0.0004) };
  return grids;
}
/** the height of the ground (negative: the sea) and how much of a town is there, at a point */
function at(lat: number, lon: number, out: { e: number; t: number }) {
  var W = world(), g = W.fine;
  if (lat < g.lat0 || lon < g.lon0 || lat >= g.lat0 + (g.nr - 1) * g.dlat || lon >= g.lon0 + (g.nc - 1) * g.dlon) g = W.coarse;
  var u = (lon - g.lon0) / g.dlon, v = (lat - g.lat0) / g.dlat;
  if (u < 0 || v < 0 || u >= g.nc - 1 || v >= g.nr - 1) { out.e = -12; out.t = 0; return; }
  var c = Math.floor(u), r = Math.floor(v), fu = u - c, fv = v - r, i = r * g.nc + c;
  out.e = (g.e[i] * (1 - fu) + g.e[i + 1] * fu) * (1 - fv) + (g.e[i + g.nc] * (1 - fu) + g.e[i + g.nc + 1] * fu) * fv;
  out.t = (g.town[i] * (1 - fu) + g.town[i + 1] * fu) * (1 - fv) + (g.town[i + g.nc] * (1 - fu) + g.town[i + g.nc + 1] * fu) * fv;
}

/* ---------- the colours of the hour ---------- */
type RGB = [number, number, number];
interface Tone { skyTop: RGB; skyLow: RGB; haze: RGB; hazeKm: number; sea: RGB; seaNear: RGB; low: RGB; wood: RGB; high: RGB; rock: RGB; ink: RGB; foam: RGB; walls: RGB[]; roof: RGB; lit: boolean; sun: { az: number; el: number; moon?: boolean } ; amb: number }
const TONES: Record<PanoLight, Tone> = {
  day: { skyTop: [118, 182, 232], skyLow: [222, 238, 246], haze: [205, 222, 236], hazeKm: 26, sea: [66, 140, 196], seaNear: [86, 168, 210], low: [150, 182, 110], wood: [96, 138, 84], high: [150, 158, 124], rock: [196, 190, 176],
    ink: [28, 35, 64], foam: [255, 255, 255], walls: [[255, 250, 240], [251, 232, 184], [247, 205, 185], [244, 222, 198], [219, 231, 239], [240, 214, 160]], roof: [214, 120, 86], lit: false, sun: { az: 215, el: 38 }, amb: 0.62 },
  dusk: { skyTop: [96, 112, 182], skyLow: [255, 196, 150], haze: [236, 178, 150], hazeKm: 18, sea: [72, 104, 160], seaNear: [94, 120, 170], low: [128, 142, 98], wood: [86, 104, 76], high: [150, 132, 120], rock: [196, 168, 150],
    ink: [36, 30, 60], foam: [255, 226, 190], walls: [[255, 222, 190], [250, 205, 160], [244, 186, 160], [238, 200, 176], [214, 200, 214], [246, 196, 140]], roof: [196, 104, 82], lit: true, sun: { az: 258, el: 4 }, amb: 0.5 },
  night: { skyTop: [12, 18, 48], skyLow: [40, 52, 96], haze: [40, 52, 96], hazeKm: 14, sea: [22, 34, 70], seaNear: [30, 46, 86], low: [34, 50, 52], wood: [26, 40, 42], high: [44, 52, 70], rock: [62, 64, 82],
    ink: [6, 8, 22], foam: [150, 170, 210], walls: [[70, 74, 98], [80, 76, 96], [66, 70, 92], [76, 72, 92], [64, 74, 100], [80, 74, 88]], roof: [70, 56, 70], lit: true, sun: { az: 140, el: 28, moon: true }, amb: 0.85 }
};
function mix(a: RGB, b: RGB, t: number): RGB { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function css(c: RGB, a = 1) { return 'rgba(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ',' + a + ')'; }

/* ---------- the picture ---------- */
export interface Panorama { canvas: HTMLCanvasElement; labels: PanoLabel[]; w: number; h: number }
/** px per degree of the view, at scale 1 */
export const PX_DEG = 26;
export function panorama(id: string, light: PanoLight, scale = 1): Panorama {
  var V: Viewpoint = VIEWPOINTS[id] || VIEWPOINTS.golfo, L = TONES[light];
  var W = Math.round(V.fov * PX_DEG * scale), H = Math.round(720 * scale), f = W / (V.fov * Math.PI / 180);
  var cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  var c = cv.getContext('2d')!;
  var p0 = { e: 0, t: 0 };
  at(V.at[0], V.at[1], p0);
  var eye = Math.max(0, p0.e) + V.eye;
  /* where the horizon falls: higher in the picture the higher one stands, so that the land below has room */
  var hz = Math.round(H * (eye > 600 ? 0.17 : eye > 60 ? 0.33 : 0.47));
  var az0 = V.heading - V.fov / 2;
  var colAz = function (x: number) { return az0 + (x + 0.5) / W * V.fov; };
  var xOf = function (az: number) { return (((az - az0) % 360) + 360) % 360 / V.fov * W; };
  var project = function (lat: number, lon: number, h: number) {
    var dn = (lat - V.at[0]) * KM_LAT * 1000, de = (lon - V.at[1]) * KM_LON * 1000, d = Math.hypot(dn, de);
    var az = Math.atan2(de, dn) * 180 / Math.PI, x = xOf(az);
    var a = Math.atan2(h - eye, d) - d * 0.87 / (2 * EARTH);
    return { x: x, y: hz - a * f, d: d };
  };

  /* the sky, the sun or the moon, the clouds */
  var g = c.createLinearGradient(0, 0, 0, hz + 20);
  g.addColorStop(0, css(L.skyTop)); g.addColorStop(1, css(L.skyLow));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  var sx = xOf(L.sun.az), sy = hz - L.sun.el * Math.PI / 180 * f;
  if (sx > -80 && sx < W + 80) {
    var glow = c.createRadialGradient(sx, sy, 4, sx, sy, light === 'night' ? 90 : 260);
    glow.addColorStop(0, light === 'night' ? 'rgba(255,246,214,.35)' : light === 'dusk' ? 'rgba(255,190,110,.75)' : 'rgba(255,250,220,.7)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = glow; c.fillRect(0, 0, W, H);
    c.beginPath(); c.arc(sx, sy, L.sun.moon ? 18 * scale : 26 * scale, 0, Math.PI * 2); c.fillStyle = L.sun.moon ? '#fff6d6' : light === 'dusk' ? '#ffcf7a' : '#fff6d6'; c.fill();
    c.lineWidth = 2; c.strokeStyle = css(L.ink, 0.8); c.stroke();
  }
  if (light === 'night') for (var k = 0; k < 220; k++) { c.fillStyle = 'rgba(255,251,230,' + (0.3 + hash(k, 1, 7) * 0.7) + ')'; c.fillRect(hash(k, 2, 7) * W, hash(k, 3, 7) * hz * 0.95, 1.6, 1.6); }
  else for (k = 0; k < Math.round(W / 420); k++) cloud(c, (k + hash(k, 4, 8) * 0.8) * 420, 40 * scale + hash(k, 5, 8) * hz * 0.45, (26 + hash(k, 6, 8) * 26) * scale, light === 'dusk' ? '#ffe2cc' : '#ffffff', css(L.ink, 0.7));

  /* the land and the sea, column by column */
  var img = c.getImageData(0, 0, W, H), px = img.data, depth = new Float32Array(W * H).fill(Infinity), kind = new Uint8Array(W * H);
  /* on land the ground right under one's feet is not traced: the near edge of the view is the parapet, the wall, the
     rocks drawn in front (`front`); at sea the water starts at the buoy */
  var from = V.near === 'sea' ? 4 : V.eye > 12 ? (eye > 600 ? 420 : 160) : 70;
  var sun = L.sun, sel = sun.el * Math.PI / 180, saz = sun.az * Math.PI / 180, lx = Math.sin(saz) * Math.cos(sel), ly = Math.cos(saz) * Math.cos(sel), lz = Math.sin(Math.max(0.25, sel));
  var q = { e: 0, t: 0 }, qx = { e: 0, t: 0 }, qy = { e: 0, t: 0 };
  var put = function (i: number, col: RGB, a: number) { var o = i * 4; px[o] = px[o] + (col[0] - px[o]) * a; px[o + 1] = px[o + 1] + (col[1] - px[o + 1]) * a; px[o + 2] = px[o + 2] + (col[2] - px[o + 2]) * a; };
  for (var x = 0; x < W; x++) {
    var az = colAz(x) * Math.PI / 180, dN = Math.cos(az), dE = Math.sin(az), ytop = H, lastD = 0, lastLand = false, lastCol: RGB = L.low;
    var glint = Math.abs(((colAz(x) - sun.az) % 360 + 540) % 360 - 180);
    for (var d = from; d < 140000; d += Math.max(2.5, d * 0.004)) {
      var la = V.at[0] + dN * d / 1000 / KM_LAT, lo = V.at[1] + dE * d / 1000 / KM_LON;
      at(la, lo, q);
      var land = q.e > 0.5, z = land ? q.e : 0;
      var y = hz - (Math.atan2(z - eye, d) - d * 0.87 / (2 * EARTH)) * f;
      if (y >= ytop) continue;
      var yi = Math.max(0, Math.floor(y)), haze = 1 - Math.exp(-d / 1000 / L.hazeKm), col: RGB;
      if (land) {
        /* the slope toward the sun lit, the other side in shade */
        var st = Math.max(30, d * 0.004) / 1000;
        at(la, lo + st / KM_LON, qx); at(la + st / KM_LAT, lo, qy);
        var gx = (qx.e - q.e) / (st * 1000), gy = (qy.e - q.e) / (st * 1000), nl = Math.sqrt(gx * gx + gy * gy + 1);
        var lit = Math.max(0, (-gx * lx - gy * ly + lz) / nl), shade = L.amb + (1 - L.amb) * lit * 1.25, steep = Math.min(1, Math.sqrt(gx * gx + gy * gy) * 1.6);
        var qx2 = Math.floor(lo * 7800), qy2 = Math.floor(la * 10400), cell = hash(qx2, qy2, 21);
        if (q.t > 0.12 && cell < 0.35 + q.t * 0.6 && q.e < 700) {
          /* a house, seen from far: a dab of plaster, a red roof now and then, a lit window at night */
          col = L.walls[Math.floor(hash(qx2, qy2, 22) * L.walls.length)];
          if (hash(qx2, qy2, 23) < 0.25) col = L.roof;
          if (L.lit && hash(qx2 * 2, qy2 * 2, 24) < (light === 'night' ? 0.45 : 0.18)) col = [255, 210, 110];
          shade = 0.75 + shade * 0.3;
        } else {
          var veg = mix(L.low, L.wood, smooth((q.e - 60) / 500) * (0.6 + noise(la, lo, 0.4, 31) * 0.4));
          col = mix(mix(veg, L.high, smooth((q.e - 850) / 500)), L.rock, Math.max(smooth((steep - 0.35) / 0.6) * 0.4, smooth((q.e - 1150) / 300) * 0.6));
          /* patches of macchia and clearings, near and far: never one flat green */
          var alb = 0.82 + noise(la, lo, 0.09, 33) * 0.26 + (d < 6000 ? (noise(la, lo, 0.022, 34) - 0.5) * 0.22 : 0);
          col = [col[0] * alb, col[1] * alb, col[2] * alb];
          /* the trees of the macchia, dark dots near by */
          if (d < 3500 && noise(la, lo, 0.03, 32) > 0.62) col = mix(col, L.wood, 0.55);
        }
        col = mix([col[0] * shade, col[1] * shade, col[2] * shade], L.haze, haze * 0.9);
      } else col = L.sea;
      if (land) {
        /* near by a span covers many rows: shaded from this sample down to the colour of the one before */
        var span = ytop - yi, foot: RGB = [col[0] * 0.72, col[1] * 0.78, col[2] * 0.72];
        for (var yy = yi; yy < ytop; yy++) {
          /* the first span of a column, or land rising from the sea, has nothing below to blend to: it darkens toward
             its foot, with a grain so that the columns do not show */
          var i0 = yy * W + x, tt = span > 2 ? (yy - yi) / span : 0, cl = lastLand ? mix(col, lastCol, tt) : mix(col, foot, Math.min(1, tt * 1.4));
          if (span > 6) { var gr = 0.94 + hash(x, yy, 61) * 0.12; cl = [cl[0] * gr, cl[1] * gr, cl[2] * gr]; }
          put(i0, cl, 1); depth[i0] = d; kind[i0] = 1;
        }
      } else for (yy = yi; yy < ytop; yy++) {
        /* the sea, row by row: how far each row of it is, and the water there (the waves are laid on the ground, so they
           shrink with the distance by themselves); lighter near, the haze far, the path of the sun */
        var ang = (hz - yy - 0.5) / f, ds = ang < -0.0004 ? Math.min(d, eye / Math.tan(-ang)) : d;
        var la3 = V.at[0] + dN * ds / 1000 / KM_LAT, lo3 = V.at[1] + dE * ds / 1000 / KM_LON, hz3 = 1 - Math.exp(-ds / 1000 / L.hazeKm);
        var sc = mix(mix(L.seaNear, L.sea, smooth(ds / 2500)), L.haze, hz3 * 0.8);
        /* little waves: long thin crests, darker troughs */
        var near3 = 1 - smooth(ds / 4000), ws = 0.004 + ds * 0.000004, wvn = noise(la3 * 9, lo3 * 1.6, ws * 2.5, 41) * 0.55 + noise(la3 * 5, lo3, ws, 42) * 0.45;
        if (wvn > 0.66) sc = mix(sc, L.foam, Math.min(0.75, (wvn - 0.66) * 4) * near3);
        else if (wvn < 0.34) sc = mix(sc, [sc[0] * 0.78, sc[1] * 0.85, sc[2] * 0.92], Math.min(1, (0.34 - wvn) * 4) * near3 * 0.8);
        if (glint < 12 && sel < 0.9) { var gl = noise(la3 * 8, lo3, 0.02, 43); if (gl > 0.55 - (1 - glint / 12) * 0.25) sc = mix(sc, light === 'night' ? [255, 240, 200] : [255, 252, 235], Math.min(0.9, (gl - 0.4) * 2) * (1 - glint / 12)); }
        var i1 = yy * W + x; put(i1, sc, 1); depth[i1] = ds; kind[i1] = 2;
      }
      lastCol = col;
      /* the pen: an edge where the land in front hides something much farther; foam where the land meets the sea */
      if (ytop < H) {
        var below = ytop * W + x;
        if (lastLand && d > lastD * 1.25 + 40) { var ink = Math.max(0.18, 0.85 - (1 - Math.exp(-lastD / 9000)) * 0.75); put(below, L.ink, ink); if (lastD < 2500 && ytop + 1 < H) put(below + W, L.ink, ink * 0.5); }
        if (land && !lastLand) put((ytop - 1) * W + x, L.foam, 0.8 * (1 - haze));
      }
      ytop = yi; lastD = d; lastLand = land;
      if (ytop <= 0) break;
    }
    /* the skyline, inked */
    if (ytop > 0 && ytop < H && kind[ytop * W + x] === 1) put(ytop * W + x, L.ink, Math.max(0.15, 0.8 - (1 - Math.exp(-depth[ytop * W + x] / 9000)) * 0.65));
  }
  c.putImageData(img, 0, 0);
  /* a thing at distance d standing at (x, y) is drawn only if nothing nearer is drawn where it stands */
  var seen = function (x: number, y: number, d: number) { var xi = Math.round(x), yi2 = Math.min(H - 1, Math.round(y) - 1); return xi >= 0 && xi < W && yi2 >= 0 && depth[yi2 * W + xi] > d * 0.94; };

  /* the houses near by, one by one, and the trees: from the farthest to the nearest */
  var things: { d: number; draw: () => void }[] = [];
  var G = world().fine;
  for (var r = 0; r < G.nr; r++) for (var cc = 0; cc < G.nc; cc++) {
    var ii = r * G.nc + cc, e0 = G.e[ii];
    if (e0 <= 0.5) continue;
    var la2 = G.lat0 + r * G.dlat, lo2 = G.lon0 + cc * G.dlon, tw = G.town[ii], h0 = hash(r, cc, 51);
    var P = project(la2, lo2, e0);
    if (P.d < from || P.d > (tw > 0.1 ? 5200 : 2400) || P.x < -20 || P.x > W + 20) continue;
    /* fewer the farther: a sprite every cell near, then every other, every fourth */
    var thin = P.d < 600 ? 3 : P.d < 1500 ? 2 : P.d < 2500 ? 4 : 9;
    if ((r * 7 + cc * 13) % thin) continue;
    if (!seen(P.x, P.y, P.d)) continue;
    if (tw > 0.1 && h0 < tw * 0.55) things.push({ d: P.d, draw: house.bind(null, c, P, h0, f, L, light) });
    else if (tw <= 0.1 && h0 < 0.3 && e0 < 900 && noise(la2, lo2, 0.12, 35) > 0.42) things.push({ d: P.d, draw: tree.bind(null, c, P, h0, f, L) });
  }
  MARKS.forEach(function (m) {
    var g0 = { e: 0, t: 0 }; at(m.at[0], m.at[1], g0);
    var P = project(m.at[0], m.at[1], Math.max(0, g0.e));
    if (P.x > -40 && P.x < W + 40 && P.d > 50 && seen(P.x, P.y, P.d)) things.push({ d: P.d - 1, draw: mark.bind(null, c, P, m.kind, m.h, f, L, light) });
  });
  things.sort(function (a, b) { return b.d - a.d; });
  things.forEach(function (t) { t.draw(); });

  /* what is in front of the eyes at this belvedere */
  front(c, V.near, W, H, scale, L, light);

  /* the names: over what they name, when it is in sight; one above the other when they would touch */
  var labels: PanoLabel[] = [], used: [number, number, number][] = [];
  NAMES.forEach(function (n) {
    var g0 = { e: 0, t: 0 }; at(n.at[0], n.at[1], g0);
    var P = project(n.at[0], n.at[1], Math.max(0, g0.e) + n.up);
    if (P.x < 30 || P.x > W - 30 || P.d < 200 || P.d > 130000 || P.y > H - 60) return;
    /* hidden behind a nearer hill */
    var yi3 = Math.max(0, Math.min(H - 1, Math.round(P.y) + 2)), dep = depth[yi3 * W + Math.round(P.x)];
    if (dep < P.d * 0.85 && P.y > 0) return;
    var w = n.text.length * 8.6 + 18, y = P.y - 34;
    for (var tries = 0; tries < 6 && used.some(function (u) { return Math.abs(u[0] - P.x) < (u[2] + w) / 2 + 6 && Math.abs(u[1] - y) < 26; }); tries++) y -= 28;
    used.push([P.x, y, w]);
    labels.push({ text: n.text, x: P.x, y: y, ax: P.x, ay: P.y });
  });
  return { canvas: cv, labels: labels, w: W, h: H };
}

/* ---------- the things drawn on it ---------- */
function cloud(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, ink: string) {
  c.beginPath();
  c.moveTo(x - r * 2.2, y);
  c.quadraticCurveTo(x - r * 2, y - r, x - r, y - r * 0.8); c.quadraticCurveTo(x - r * 0.4, y - r * 1.7, x + r * 0.6, y - r * 1.1);
  c.quadraticCurveTo(x + r * 1.7, y - r * 1.3, x + r * 2, y - r * 0.3); c.quadraticCurveTo(x + r * 2.6, y, x + r * 2.2, y); c.closePath();
  c.fillStyle = fill; c.globalAlpha = 0.88; c.fill(); c.globalAlpha = 1; c.lineWidth = 1.3; c.strokeStyle = ink; c.globalAlpha = 0.45; c.stroke(); c.globalAlpha = 1;
}
function house(c: CanvasRenderingContext2D, P: { x: number; y: number; d: number }, h0: number, f: number, L: Tone, light: PanoLight) {
  var w = (10 + h0 * 16) / P.d * f, h = (7 + hash(Math.round(P.x), Math.round(P.y), 52) * 11) / P.d * f;
  if (w < 1.6) return;
  var x = P.x - w / 2, y = P.y + Math.min(2, w * 0.15), wall = L.walls[Math.floor(hash(Math.round(P.x), 3, 53) * L.walls.length)];
  c.fillStyle = css(wall); c.fillRect(x, y - h, w, h);
  c.fillStyle = css(L.ink, 0.18); c.fillRect(x + w * 0.68, y - h, w * 0.32, h);
  if (h0 < 0.45) { c.fillStyle = css(L.roof); c.fillRect(x - w * 0.04, y - h - Math.max(1, h * 0.16), w * 1.08, Math.max(1, h * 0.2)); }
  if (w > 7) {
    for (var wy = y - h + h * 0.22; wy < y - h * 0.2; wy += h * 0.32) for (var wx = x + w * 0.12; wx < x + w * 0.62; wx += w * 0.24) {
      var on = L.lit && hash(Math.round(wx), Math.round(wy), 54) < (light === 'night' ? 0.55 : 0.25);
      c.fillStyle = on ? '#ffd27a' : css(L.ink, 0.35); c.fillRect(wx, wy, Math.max(1, w * 0.1), Math.max(1, h * 0.12));
    }
    c.strokeStyle = css(L.ink, 0.55); c.lineWidth = 1; c.strokeRect(x, y - h, w, h);
  }
}
function tree(c: CanvasRenderingContext2D, P: { x: number; y: number; d: number }, h0: number, f: number, L: Tone) {
  var s = Math.min(24, (5 + h0 * 18) / P.d * f);
  if (s < 2) return;
  if (h0 >= 0.08 && s > 6) {
    /* a bush of the macchia, or a holm oak: a few round clumps, darker below */
    var col0 = mix(L.wood, L.low, h0 * 1.6), dk = mix(col0, [20, 40, 30], 0.3);
    [[-0.35, -0.35, 0.42], [0.3, -0.4, 0.4], [0, -0.75, 0.42]].forEach(function (b, i) {
      c.beginPath(); c.arc(P.x + b[0] * s, P.y + b[1] * s, b[2] * s, 0, Math.PI * 2); c.fillStyle = css(i < 2 ? dk : col0); c.fill();
      c.strokeStyle = css(L.ink, 0.45); c.lineWidth = 1; c.stroke();
    });
    return;
  }
  var pine = h0 < 0.08, col = mix(L.wood, L.low, h0 * 2);
  c.strokeStyle = css(L.ink, 0.6); c.lineWidth = s > 10 ? 1.4 : 0.8;
  if (pine) {
    c.beginPath(); c.moveTo(P.x, P.y); c.lineTo(P.x, P.y - s * 1.2); c.strokeStyle = '#6b4f3a'; c.lineWidth = Math.max(1, s * 0.12); c.stroke();
    c.beginPath(); c.ellipse(P.x, P.y - s * 1.3, s * 1.1, s * 0.4, 0, 0, Math.PI * 2); c.fillStyle = css(col); c.fill(); c.strokeStyle = css(L.ink, 0.6); c.lineWidth = 1; c.stroke();
  } else { c.beginPath(); c.arc(P.x, P.y - s * 0.5, s * 0.55, 0, Math.PI * 2); c.fillStyle = css(col); c.fill(); if (s > 5) c.stroke(); }
}
function mark(c: CanvasRenderingContext2D, P: { x: number; y: number; d: number }, kind: string, hm: number, f: number, L: Tone, light: PanoLight) {
  /* a little bigger than true, or they would be lost: the eye picks them out */
  var h = Math.max(6, hm / P.d * f * 1.4), w = h * (kind === 'bell' ? 0.22 : kind === 'castle' ? 1.6 : kind === 'drum' ? 1.3 : kind === 'tomb' ? 0.7 : kind === 'church' ? 0.9 : 0.42);
  var x = P.x - w / 2, y = P.y, stone = L.rock, ink = css(L.ink, 0.8), lw = Math.max(1, Math.min(2.2, h / 20));
  c.lineWidth = lw; c.strokeStyle = ink;
  var box = function (bx: number, by: number, bw: number, bh: number, col: RGB) { c.fillStyle = css(col); c.fillRect(bx, by, bw, bh); c.strokeRect(bx, by, bw, bh); };
  if (kind === 'tower' || kind === 'octagon') {
    box(x, y - h, w, h, stone);
    for (var k = 0; k < 4; k++) box(x + k * w / 3.6, y - h - h * 0.08, w / 6, h * 0.08, stone);
    if (L.lit) { c.fillStyle = '#ffd27a'; c.fillRect(x + w * 0.4, y - h * 0.6, w * 0.2, h * 0.1); }
  } else if (kind === 'tomb') {
    box(P.x - w * 0.7, y - h * 0.28, w * 1.4, h * 0.28, stone); box(x, y - h, w, h * 0.74, stone);
    c.beginPath(); c.arc(P.x, y - h - h * 0.06, w * 0.28, 0, Math.PI * 2); c.fillStyle = css(L.wood); c.fill();
  } else if (kind === 'drum') {
    box(x, y - h, w, h, stone);
  } else if (kind === 'bell') {
    box(x, y - h, w, h, L.walls[3]);
    c.beginPath(); c.moveTo(x - 1, y - h); c.lineTo(P.x, y - h - w * 1.4); c.lineTo(x + w + 1, y - h); c.closePath(); c.fillStyle = css(L.roof); c.fill(); c.stroke();
  } else if (kind === 'castle') {
    box(x, y - h * 0.7, w, h * 0.7, stone); box(x + w * 0.72, y - h, w * 0.28, h, stone);
    for (k = 0; k < 6; k++) box(x + k * w / 6.5, y - h * 0.78, w / 13, h * 0.08, stone);
  } else if (kind === 'church') {
    box(x, y - h * 0.7, w, h * 0.7, L.walls[0]);
    c.beginPath(); c.moveTo(x - 1, y - h * 0.7); c.lineTo(P.x, y - h); c.lineTo(x + w + 1, y - h * 0.7); c.closePath(); c.fillStyle = css(L.roof); c.fill(); c.stroke();
  }
  void light;
}
/** what is in front of the eyes: the rocks of the summit, the dry-stone wall, the ruins, the guardrail, the buoy */
function front(c: CanvasRenderingContext2D, near: Viewpoint['near'], W: number, H: number, s: number, L: Tone, light: PanoLight) {
  var ink = css(L.ink, 0.95), k: number;
  c.lineJoin = 'round'; c.lineCap = 'round';
  var shape = function (pts: number[][], fill: string, lw = 3) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = fill; c.fill(); c.lineWidth = lw * s; c.strokeStyle = ink; c.stroke(); };
  var dark = function (col: RGB, k0: number) { return css([col[0] * k0, col[1] * k0, col[2] * k0]); };
  var rail = function (y: number) {
    c.strokeStyle = '#3b4258'; c.lineWidth = 5 * s; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    c.lineWidth = 3 * s; c.beginPath(); c.moveTo(0, y + 14 * s); c.lineTo(W, y + 14 * s); c.stroke();
    for (k = 40 * s; k < W; k += 220 * s) { c.lineWidth = 6 * s; c.beginPath(); c.moveTo(k, y - 4 * s); c.lineTo(k, H); c.stroke(); }
  };
  var scope = function (x: number) {
    c.fillStyle = '#3f7a5a'; c.strokeStyle = ink; c.lineWidth = 3 * s;
    c.fillRect(x - 8 * s, H - 170 * s, 16 * s, 170 * s); c.strokeRect(x - 8 * s, H - 170 * s, 16 * s, 170 * s);
    c.save(); c.translate(x, H - 200 * s); c.rotate(-0.12);
    c.fillRect(-54 * s, -30 * s, 108 * s, 58 * s); c.strokeRect(-54 * s, -30 * s, 108 * s, 58 * s);
    c.fillStyle = '#2f5f46'; c.fillRect(-70 * s, -20 * s, 20 * s, 40 * s); c.strokeRect(-70 * s, -20 * s, 20 * s, 40 * s);
    c.beginPath(); c.ellipse(-72 * s, 0, 5 * s, 16 * s, 0, 0, Math.PI * 2); c.fillStyle = light === 'night' ? '#30406a' : '#9fd0ef'; c.fill(); c.stroke();
    c.restore();
  };
  if (near === 'rocks') {
    shape([[0, H], [0, H - 70 * s], [70 * s, H - 92 * s], [150 * s, H - 64 * s], [210 * s, H - 30 * s], [260 * s, H]], dark(L.rock, 0.95));
    shape([[W, H], [W, H - 80 * s], [W - 100 * s, H - 104 * s], [W - 210 * s, H - 70 * s], [W - 300 * s, H]], dark(L.rock, 0.9));
    rail(H - 46 * s); scope(W - 200 * s);
  } else if (near === 'terrace') {
    /* the macera at one's feet: a dry-stone wall, its stones one by one, and a branch of olive leaning in */
    for (k = 0; k < W / (16 * s) + 2; k++) { c.beginPath(); c.ellipse(k * 16 * s, H - 22 * s - (k % 2) * 7 * s, 10 * s, 6 * s, 0, 0, Math.PI * 2); c.fillStyle = k % 3 ? dark(L.rock, 0.95) : dark(L.rock, 0.8); c.fill(); c.lineWidth = 1.6 * s; c.strokeStyle = ink; c.stroke(); }
    branch(c, W - 10 * s, 0, s, L, ink, -1); scope(W - 260 * s);
  } else if (near === 'ruins') {
    /* the top of a wall of the villa in opus reticulatum, broken, along the bottom; the macchia at the sides */
    var wy0 = H - 46 * s;
    c.beginPath(); c.moveTo(0, H); c.lineTo(0, wy0);
    for (k = 0; k <= W; k += 40 * s) c.lineTo(k, wy0 - (hash(k, 1, 77) - 0.5) * 16 * s);
    c.lineTo(W, H); c.closePath(); c.fillStyle = dark(L.rock, 0.92); c.fill(); c.lineWidth = 2.5 * s; c.strokeStyle = ink; c.stroke();
    c.save(); c.clip(); c.strokeStyle = css(L.ink, 0.3); c.lineWidth = 1 * s;
    for (var yy = wy0 - 6 * s; yy < H; yy += 11 * s) for (var xx = ((yy / (11 * s)) % 2) * 5.5 * s; xx < W; xx += 11 * s) { c.beginPath(); c.moveTo(xx - 5 * s, yy); c.lineTo(xx, yy - 5 * s); c.lineTo(xx + 5 * s, yy); c.lineTo(xx, yy + 5 * s); c.closePath(); c.stroke(); }
    c.restore();
    branch(c, 10 * s, 0, s, L, ink, 1); scope(W - 220 * s);
  } else if (near === 'road') {
    c.fillStyle = dark([150, 148, 140], light === 'night' ? 0.45 : 1); c.beginPath(); c.moveTo(0, H - 60 * s); c.quadraticCurveTo(W / 2, H - 100 * s, W, H - 64 * s); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); c.fill();
    c.strokeStyle = '#ffffff'; c.lineWidth = 3 * s; c.setLineDash([30 * s, 26 * s]); c.beginPath(); c.moveTo(0, H - 20 * s); c.quadraticCurveTo(W / 2, H - 50 * s, W, H - 24 * s); c.stroke(); c.setLineDash([]);
    c.strokeStyle = '#d9dce2'; c.lineWidth = 7 * s; c.beginPath(); c.moveTo(0, H - 84 * s); c.quadraticCurveTo(W / 2, H - 124 * s, W, H - 88 * s); c.stroke();
    c.strokeStyle = ink; c.lineWidth = 2 * s; c.stroke();
    for (k = 30 * s; k < W; k += 130 * s) { var py = H - 84 * s - Math.sin(k / W * Math.PI) * 36 * s; c.fillStyle = '#c9ccd4'; c.fillRect(k - 3 * s, py, 6 * s, 30 * s); c.strokeRect(k - 3 * s, py, 6 * s, 30 * s); }
  } else if (near === 'sea') {
    var bx = W * 0.5;
    c.beginPath(); c.ellipse(bx, H - 26 * s, 70 * s, 20 * s, 0, 0, Math.PI * 2); c.fillStyle = '#e9765f'; c.fill(); c.lineWidth = 3 * s; c.strokeStyle = ink; c.stroke();
    c.fillStyle = '#e9765f'; c.fillRect(bx - 15 * s, H - 140 * s, 30 * s, 112 * s); c.strokeRect(bx - 15 * s, H - 140 * s, 30 * s, 112 * s);
    c.fillStyle = '#ffffff'; c.fillRect(bx - 22 * s, H - 152 * s, 44 * s, 14 * s); c.strokeRect(bx - 22 * s, H - 152 * s, 44 * s, 14 * s);
    c.strokeStyle = css(L.foam, 0.8); c.lineWidth = 3 * s; c.beginPath(); c.ellipse(bx, H - 18 * s, 100 * s, 18 * s, 0, 0, Math.PI); c.stroke();
  }
}
/** a branch hanging into the view from the top corner: twigs and little leaves, in pen */
function branch(c: CanvasRenderingContext2D, x: number, y: number, s: number, L: Tone, ink: string, dir: number) {
  c.strokeStyle = '#5d4535'; c.lineWidth = 7 * s; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + dir * 120 * s, y + 40 * s, x + dir * 260 * s, y + 70 * s); c.stroke();
  c.lineWidth = 3 * s; c.beginPath(); c.moveTo(x + dir * 120 * s, y + 38 * s); c.quadraticCurveTo(x + dir * 150 * s, y + 90 * s, x + dir * 200 * s, y + 120 * s); c.stroke();
  for (var k = 0; k < 46; k++) {
    var t = hash(k, 1, 81), bx = x + dir * (40 + t * 230) * s, by = y + (20 + t * 60 + (hash(k, 2, 81) - 0.5) * 70) * s, a = (hash(k, 3, 81) - 0.5) * 2.4;
    c.save(); c.translate(bx, by); c.rotate(a); c.beginPath(); c.ellipse(0, 0, 11 * s, 4 * s, 0, 0, Math.PI * 2);
    c.fillStyle = css(k % 3 ? mix(L.low, [150, 170, 140], 0.4) : L.wood); c.fill(); c.lineWidth = 1 * s; c.strokeStyle = ink; c.stroke(); c.restore();
  }
}
/** the names of the views there are, for the diary */
export function hasView(id: string): boolean { return !!VIEWPOINTS[id]; }
export type { LL };
/** the height of the land at a point, in metres (negative: the sea), as the panoramas see it (and the tests) */
export function heightAt(lat: number, lon: number): number { var o = { e: 0, t: 0 }; at(lat, lon, o); return o.e; }
