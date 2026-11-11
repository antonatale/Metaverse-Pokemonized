import { T, hash, type Palette, type Sprite } from './canvas';
import type { Sun } from '../story/daytime';

/* The light and the life of the map (VISIONE.md, V1): what makes Formia a place and not a plan of it.
   - light:  the shadows everything casts, turning with the sun, and those of the clouds passing over the town; a
             sunlit top and a shaded foot on whatever stands (the darker frame around the picture is CSS: .wframe);
   - sea:    the waves that come up the beach and go back, the glitter of the sun on the water;
   - wind:   how much a tree leans, gust after gust;
   - life:   the pigeons of the squares, who fly off when someone walks into them and come back later; butterflies
             over the grass by day, fireflies by night.
   Everything here only draws: it reads the map and the clock, never the story, and nothing in the story reads it.
   No Math.random: where a thing is, and when it moves, comes from `hash` and from the time of the frame, so a frame
   can be drawn again the same. With `still` (prefers-reduced-motion) nothing moves. world-view.ts decides the order
   of the layers and skips them all when the graphics are set to Bassa (ui/gfx.ts). */

export interface View { x: number; y: number; w: number; h: number }
/** something that casts a shadow: a flat picture standing on its bottom edge (a tree, a lamp, a person), or a block
    (a building: its footprint in map px and how high it stands) */
export interface Caster { x: number; yb: number; w: number; h: number; img?: CanvasImageSource; box?: { x: number; y: number; w: number; h: number; up: number };
  /** a flat picture: how many px of it lie under its foot (yb is the foot); how much it leans in the wind */
  foot?: number; lean?: number }
/** what the layers need to know about a tile, without knowing the map: its ground, its decoration, whether someone
    can stand on it */
export interface Tiles { w: number; h: number; ground(x: number, y: number): string; deco(x: number, y: number): string | undefined; free(x: number, y: number): boolean }

function rgba(hex: string, a: number) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
function layer(cv: HTMLCanvasElement | null, w: number, h: number): HTMLCanvasElement {
  if (!cv) cv = document.createElement('canvas');
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  return cv;
}

/* ---------- light ---------- */
/** how strong a cast shadow is at full sun, how strong the shadow of a cloud is beside it, and at which fraction of the
    screen's resolution the sheet of the shadows is drawn (a shadow has soft edges: a third is plenty, and it is the
    one big picture this file lays over the map at every frame) */
const SHADOW_A = 0.24, CLOUD_A = 0.42, SHADOW_Q = 3;
var shadowCv: HTMLCanvasElement | null = null;
/** The shade of the day, on the ground and under everyone: the shadows of everything in view, turning with the sun,
    and the shadows of the clouds passing over the town. They are drawn all together on a sheet of their own and laid
    down once, so two shadows that cross are not darker than one. `vs`: canvas px per map px; `cam`: the view, in map
    px; `still`: the clouds do not move. */
export function shade(ctx: CanvasRenderingContext2D, W: number, H: number, vs: number, cam: View, casters: Caster[], sun: Sun, now: number, still: boolean, P: Palette) {
  if (sun.k < 0.03) return;
  var q = SHADOW_Q, lw = Math.ceil(W / q), lh = Math.ceil(H / q), s = vs / q, reach = T * 4;
  shadowCv = layer(shadowCv, lw, lh);
  var lc = shadowCv.getContext('2d')!;
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = 1; lc.clearRect(0, 0, lw, lh);
  lc.fillStyle = '#000000';
  casters.forEach(function (c0) {
    if (c0.x + c0.w + reach < cam.x || c0.x - reach > cam.x + cam.w || c0.yb + reach < cam.y || c0.yb - c0.h - reach > cam.y + cam.h) return;
    lc.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
    if (c0.box) {
      /* a block: its footprint, the same moved by the shadow of its top, and what lies between the two */
      var b = c0.box, dx = sun.x * b.up, dy = sun.y * b.up;
      lc.beginPath();
      if (dx >= 0) { lc.moveTo(b.x, b.y); lc.lineTo(b.x + b.w, b.y); lc.lineTo(b.x + b.w + dx, b.y + dy); lc.lineTo(b.x + b.w + dx, b.y + b.h + dy); lc.lineTo(b.x + dx, b.y + b.h + dy); lc.lineTo(b.x, b.y + b.h); }
      else { lc.moveTo(b.x, b.y); lc.lineTo(b.x + b.w, b.y); lc.lineTo(b.x + b.w, b.y + b.h); lc.lineTo(b.x + b.w + dx, b.y + b.h + dy); lc.lineTo(b.x + dx, b.y + b.h + dy); lc.lineTo(b.x + dx, b.y + dy); }
      lc.closePath(); lc.fill();
    } else if (c0.img) {
      /* a flat picture: laid on the ground from its foot, a point h px up falls (sun.x, sun.y) × h away */
      var sx = sun.x + (c0.lean || 0);
      lc.transform(1, 0, -sx, -sun.y, sx * c0.yb, c0.yb * (1 + sun.y));
      lc.drawImage(c0.img, c0.x, c0.yb - c0.h + (c0.foot || 0), c0.w, c0.h);
    }
  });
  lc.setTransform(1, 0, 0, 1, 0, 0); lc.globalCompositeOperation = 'source-in';
  lc.fillStyle = P.shade; lc.fillRect(0, 0, lw, lh);
  /* the clouds, on the same sheet: where a cloud passes the ground is darker, and the shadows in it are no deeper */
  var sheet = cloudSheet(P), t = still ? 0 : now, ox = (t * 0.011) % CLOUD, oy = (t * 0.004) % CLOUD;
  lc.globalCompositeOperation = 'source-over'; lc.globalAlpha = CLOUD_A; lc.imageSmoothingEnabled = true;
  lc.setTransform(s, 0, 0, s, -cam.x * s, -cam.y * s);
  for (var y = Math.floor((cam.y - oy) / CLOUD); y * CLOUD + oy < cam.y + cam.h; y++) for (var x = Math.floor((cam.x - ox) / CLOUD); x * CLOUD + ox < cam.x + cam.w; x++) {
    lc.drawImage(sheet, x * CLOUD + ox, y * CLOUD + oy, CLOUD, CLOUD);
  }
  lc.globalAlpha = 1;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = SHADOW_A * sun.k; ctx.imageSmoothingEnabled = true;
  ctx.drawImage(shadowCv, 0, 0, lw * q, lh * q);
  ctx.restore();
}

/** The light on a picture of something that stands (a building, a tree): a little sun on its top, a little shade at
    its foot, painted once over what is already drawn. Flat colours become volumes. */
export function volume(spr: Sprite, P: Palette): Sprite {
  var c = spr.cv.getContext('2d')!, w = spr.cv.width, h = spr.cv.height;
  c.save();
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-atop';
  var g = c.createLinearGradient(0, 0, w * 0.3, h);
  g.addColorStop(0, rgba(P.sunlit, 0.34)); g.addColorStop(0.42, rgba(P.sunlit, 0)); g.addColorStop(0.62, rgba(P.shade, 0)); g.addColorStop(1, rgba(P.shade, 0.17));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.restore();
  return spr;
}

/* the shadows of the clouds: one square sheet of soft blots that repeats, moving slowly over the map (see shade) */
const CLOUD = 896, CLOUD_PX = 224;
var cloudCv: HTMLCanvasElement | null = null, cloudKey = '';
function cloudSheet(P: Palette): HTMLCanvasElement {
  if (cloudCv && cloudKey === P.shade) return cloudCv;
  cloudCv = layer(cloudCv, CLOUD_PX, CLOUD_PX); cloudKey = P.shade;
  var c = cloudCv.getContext('2d')!, k = CLOUD_PX / CLOUD;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, CLOUD_PX, CLOUD_PX);
  for (var n = 0; n < 7; n++) {
    var cx = hash(n, 1, 31) * CLOUD, cy = hash(n, 2, 31) * CLOUD, rx = 130 + hash(n, 3, 31) * 150, ry = rx * (0.45 + hash(n, 4, 31) * 0.2);
    /* each blot is drawn nine times, so the sheet joins with itself on every side */
    for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) {
      c.setTransform(k, 0, 0, k * ry / rx, (cx + ox * CLOUD) * k, (cy + oy * CLOUD) * k);
      var g = c.createRadialGradient(0, 0, 0, 0, 0, rx);
      g.addColorStop(0, rgba(P.shade, 0.5)); g.addColorStop(0.55, rgba(P.shade, 0.32)); g.addColorStop(1, rgba(P.shade, 0));
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, rx, 0, Math.PI * 2); c.fill();
    }
  }
  return cloudCv;
}
/* ---------- wind ---------- */
/** how much each kind of tree gives to the wind: the lean of its top, in px per px of height */
export const SWAY: Record<string, number> = { tree: 0.03, olive: 0.024, pine: 0.03, palm: 0.05, cypress: 0.018 };
/** the wind at a point of the map, from −1 to 1: long gusts that cross the town from the sea, and a quicker tremble */
export function wind(x: number, y: number, now: number): number {
  return Math.sin(now / 1500 + x * 0.006 + y * 0.003) * 0.7 + Math.sin(now / 420 + x * 0.019 - y * 0.011) * 0.3;
}

/* ---------- sea ---------- */
const SIDES: [number, number][] = [[0, -1], [1, 0], [0, 1], [-1, 0]];
/** The sea in view: the waves that run up each beach and go back, and the sun glittering here and there (the moon,
    more rarely, at night). `ctx` is in map units; x0…y1 are the tiles in view. */
export function seaLife(ctx: CanvasRenderingContext2D, m: Tiles, x0: number, x1: number, y0: number, y1: number, now: number, still: boolean, day: number, P: Palette) {
  var t = still ? 0 : now;
  ctx.save(); ctx.lineCap = 'round';
  for (var y = y0; y <= y1; y++) for (var x = x0; x <= x1; x++) {
    if (m.ground(x, y) !== 'sea') continue;
    var px = x * T, py = y * T;
    for (var k = 0; k < 4; k++) {
      var nx = x + SIDES[k][0], ny = y + SIDES[k][1];
      if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h || m.ground(nx, ny) !== 'sand') continue;
      /* one wave after the other along the shore: it comes in bright and thin, it goes back wide and faint */
      var u = 0.5 + 0.5 * Math.sin(t / 1300 - (x * SIDES[k][1] - y * SIDES[k][0]) * 0.55 + hash(x, y, 13) * 0.8), off = 3 + 7 * (1 - u), bow = 2.5 * (hash(x, y, 14) - 0.5);
      var ax = k === 1 ? px + T - off : k === 3 ? px + off : px, ay = k === 0 ? py + off : k === 2 ? py + T - off : py;
      var bx = k % 2 ? ax : px + T, by = k % 2 ? py + T : ay, vert = k % 2 === 1;
      ctx.globalAlpha = 0.25 + 0.6 * u; ctx.strokeStyle = P.foam; ctx.lineWidth = 1.2 + 1.6 * u;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(vert ? ax + bow : (ax + bx) / 2, vert ? (ay + by) / 2 : ay + bow, bx, by); ctx.stroke();
    }
    var h = hash(x, y, 17);
    if (h < 0.09 && day > 0.05) {
      var a = Math.sin(t / 560 + h * 700); a = a > 0 ? a * a * a * day : 0;
      if (a > 0.04) {
        var gx = px + 5 + hash(x, y, 18) * 22, gy = py + 5 + hash(x, y, 19) * 22, r = 1.2 + 3.2 * a;
        ctx.globalAlpha = a; ctx.fillStyle = P.glint;
        ctx.beginPath(); ctx.moveTo(gx, gy - r * 1.7); ctx.lineTo(gx + r * 0.38, gy - r * 0.38); ctx.lineTo(gx + r * 1.7, gy); ctx.lineTo(gx + r * 0.38, gy + r * 0.38);
        ctx.lineTo(gx, gy + r * 1.7); ctx.lineTo(gx - r * 0.38, gy + r * 0.38); ctx.lineTo(gx - r * 1.7, gy); ctx.lineTo(gx - r * 0.38, gy - r * 0.38); ctx.closePath(); ctx.fill();
      }
    }
  }
  ctx.restore();
}

/* ---------- life ---------- */
const INK = '#1c2340', PIGEON = ['#9aa3b8', '#b9bfd0', '#7f8aa3'];
/** a few pigeons on a tile of a square: `up` is when they flew off (0: they are down), `down` when they came back */
interface Flock { x: number; y: number; n: number; up: number; down: number }
var flocks: { key: string; list: Flock[] } = { key: '', list: [] };
/** how long they take to fly off and to land, how long they stay away at least, how close is too close (tiles) */
const TAKEOFF = 1300, LANDING = 800, AWAY = 9000, NEAR = 1.7, FAR = 5;
function flocksOf(m: Tiles, key: string): Flock[] {
  if (flocks.key === key) return flocks.list;
  var list: Flock[] = [];
  for (var y = 1; y < m.h - 1; y++) for (var x = 1; x < m.w - 1; x++) {
    var g = m.ground(x, y), odds = g === 'paving' ? 0.05 : g === 'stone' ? 0.012 : 0;
    if (odds && hash(x, y, 41) < odds && m.free(x, y) && !m.deco(x, y)) list.push({ x: x, y: y, n: 2 + Math.floor(hash(x, y, 42) * 3), up: 0, down: 0 });
  }
  flocks = { key: key, list: list };
  return list;
}
function pigeon(c: CanvasRenderingContext2D, x: number, y: number, left: boolean, tone: string, peck: number) {
  c.save(); c.translate(x, y); if (left) c.scale(-1, 1);
  c.lineWidth = 1; c.strokeStyle = INK; c.lineJoin = 'round';
  c.beginPath(); c.ellipse(0, 0, 4.2, 2.9, -0.15, 0, Math.PI * 2); c.fillStyle = tone; c.fill(); c.stroke();
  c.beginPath(); c.moveTo(-3.6, -0.6); c.lineTo(-6.8, 0.8); c.lineTo(-3.4, 1.4); c.closePath(); c.fill(); c.stroke();
  var hx = 3.4 + peck * 1.2, hy = -2.6 + peck * 3.4;
  c.beginPath(); c.arc(hx, hy, 2, 0, Math.PI * 2); c.fill(); c.stroke();
  c.beginPath(); c.moveTo(hx + 1.7, hy - 0.3); c.lineTo(hx + 3.6, hy + 0.5 + peck); c.lineTo(hx + 1.5, hy + 0.9); c.closePath(); c.fillStyle = '#f2a03d'; c.fill();
  c.fillStyle = INK; c.beginPath(); c.arc(hx + 0.6, hy - 0.4, 0.5, 0, Math.PI * 2); c.fill();
  c.restore();
}
function flying(c: CanvasRenderingContext2D, x: number, y: number, tone: string, flap: number, a: number) {
  var wy = 1.5 + flap * 5;
  c.save(); c.globalAlpha = a; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - 7, y - wy); c.quadraticCurveTo(x - 3, y - wy - 2.5, x, y); c.quadraticCurveTo(x + 3, y - wy - 2.5, x + 7, y - wy);
  c.strokeStyle = INK; c.lineWidth = 3.4; c.stroke(); c.strokeStyle = tone; c.lineWidth = 1.8; c.stroke();
  c.beginPath(); c.ellipse(x, y + 0.6, 2.4, 1.7, 0, 0, Math.PI * 2); c.fillStyle = tone; c.fill(); c.strokeStyle = INK; c.lineWidth = 0.9; c.stroke();
  c.restore();
}
/** The pigeons of the squares. `over` false: the ones on the ground, before people are drawn; true: the ones in the
    air, over everything. (px, py): the player in map px; the flocks he walks into fly off, and come back when he has
    gone. `day`: they sleep at night. */
export function pigeons(ctx: CanvasRenderingContext2D, m: Tiles, key: string, cam: View, now: number, still: boolean, px: number, py: number, day: number, over: boolean) {
  if (day < 0.4) return;
  flocksOf(m, key).forEach(function (f) {
    var cx = f.x * T + T / 2, cy = f.y * T + T / 2, d = Math.hypot(px + T / 2 - cx, py + T / 2 - cy) / T;
    if (!over && !still) {
      if (!f.up && d < NEAR && now - f.down > LANDING) f.up = now;
      else if (f.up && now - f.up > AWAY && d > FAR) { f.up = 0; f.down = now; }
    }
    if (cx < cam.x - T * 4 || cx > cam.x + cam.w + T * 4 || cy < cam.y - T * 6 || cy > cam.y + cam.h + T * 2) return;
    for (var k = 0; k < f.n; k++) {
      var ox = (hash(f.x + k, f.y, 43) - 0.5) * 22, oy = (hash(f.x, f.y + k, 44) - 0.5) * 16, left = hash(f.x, f.y, 45 + k) < 0.5, tone = PIGEON[(f.x + f.y + k) % 3];
      if (f.up) {
        /* off they go, each its own way, up and out of sight */
        var t = (now - f.up) / TAKEOFF;
        if (!over || t >= 1) continue;
        var dirx = (left ? -1 : 1) * (0.6 + hash(f.x, k, 46)), e = t * (2 - t);
        flying(ctx, cx + ox + dirx * e * T * 2.6, cy + oy - e * T * 3.4 - Math.sin(t * 9 + k) * 2, tone, 0.5 + 0.5 * Math.sin(now / 45 + k * 2), t < 0.6 ? 1 : (1 - t) / 0.4);
      } else if (now - f.down < LANDING && !still) {
        /* coming back: down from above, wings open, one a little after the other */
        var u = Math.max(0, Math.min(1, (now - f.down) / LANDING * 1.3 - k * 0.12));
        if (over && u < 1) flying(ctx, cx + ox, cy + oy - (1 - u) * (1 - u) * T * 2.4, tone, 0.5 + 0.5 * Math.sin(now / 55 + k), Math.min(1, u * 3));
        else if (!over && u >= 1) pigeon(ctx, cx + ox, cy + oy, left, tone, 0);
      } else if (!over) {
        /* at peace: now and then one pecks at the ground, now and then one takes two steps */
        var ph = still ? 0 : now / 1000 + hash(f.x, f.y, 47 + k) * 20, beat = ph % 3.4, peck = beat < 0.5 ? Math.sin(beat / 0.5 * Math.PI * 2) * 0.5 + 0.5 : 0;
        pigeon(ctx, cx + ox + (still ? 0 : Math.sin(ph * 0.35) * 2.5), cy + oy, left, tone, peck);
      }
    }
  });
}

/** Butterflies over the grass by day. `ctx` in map units; drawn over people (they fly at head height). */
export function butterflies(ctx: CanvasRenderingContext2D, m: Tiles, x0: number, x1: number, y0: number, y1: number, now: number, still: boolean, day: number, P: Palette) {
  if (day < 0.6) return;
  var t = still ? 0 : now, tones = [P['flower-a'], P['flower-b'], P.glint];
  for (var y = y0 - 1; y <= y1 + 1; y++) for (var x = x0 - 1; x <= x1 + 1; x++) {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h || hash(x, y, 23) > 0.016 || m.ground(x, y) !== 'grass') continue;
    var p = hash(x, y, 24) * 40, bx = x * T + 16 + Math.sin(t / 1900 + p) * 26 + Math.sin(t / 430 + p * 2) * 5, by = y * T + 6 + Math.cos(t / 1500 + p) * 14 + Math.sin(t / 310 + p) * 3;
    var open = still ? 0.8 : 0.25 + 0.75 * Math.abs(Math.sin(t / 85 + p));
    ctx.save(); ctx.translate(bx, by); ctx.rotate(Math.sin(t / 700 + p) * 0.5);
    ctx.fillStyle = tones[Math.floor(hash(x, y, 25) * 3)]; ctx.strokeStyle = INK; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.ellipse(-2.4 * open, -1, 2.6 * open, 2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(2.4 * open, -1, 2.6 * open, 2.4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -2.6); ctx.lineTo(0, 1.8); ctx.lineWidth = 1.3; ctx.stroke();
    ctx.restore();
  }
}

/** Fireflies over the grass, in the pine wood and in the tall grass, once it is dark: drawn over the night.
    `night`: how dark it is, 0…1. */
export function fireflies(ctx: CanvasRenderingContext2D, m: Tiles, x0: number, x1: number, y0: number, y1: number, now: number, still: boolean, night: number, P: Palette) {
  if (night < 0.5) return;
  var t = still ? 0 : now;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (var y = y0 - 1; y <= y1 + 1; y++) for (var x = x0 - 1; x <= x1 + 1; x++) {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) continue;
    var odds = m.deco(x, y) === 'tall' ? 0.3 : m.ground(x, y) === 'grass' ? 0.05 : 0;
    if (!odds || hash(x, y, 29) > odds) continue;
    var p = hash(x, y, 30) * 60, a = Math.sin(t / 900 + p); a = a > 0 ? a * a * (night - 0.5) * 2 : 0;
    if (a < 0.03) continue;
    var fx = x * T + 16 + Math.sin(t / 2600 + p) * 18, fy = y * T + 10 + Math.cos(t / 2100 + p * 1.3) * 11, r = 7;
    var g = ctx.createRadialGradient(fx, fy, 0, fx, fy, r);
    g.addColorStop(0, rgba(P.firefly, 0.95 * a)); g.addColorStop(0.25, rgba(P.firefly, 0.45 * a)); g.addColorStop(1, rgba(P.firefly, 0));
    ctx.fillStyle = g; ctx.fillRect(fx - r, fy - r, r * 2, r * 2);
  }
  ctx.restore();
}

/* ---------- the mountain ---------- */
/** where the hawks of a map soar: a few points over its mountains, found once */
var hawkAt: { key: string; list: [number, number][] } = { key: '', list: [] };
function hawksOf(m: Tiles, key: string): [number, number][] {
  if (hawkAt.key === key) return hawkAt.list;
  var hills: [number, number][] = [], list: [number, number][] = [];
  for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) if (m.ground(x, y) === 'hill' && hash(x, y, 51) < 0.05) hills.push([x, y]);
  for (var i = 0; i < 6 && hills.length; i++) list.push(hills[Math.floor(hash(i, 3, 52) * hills.length)]);
  hawkAt = { key: key, list: list };
  return list;
}
/** Hawks over the Aurunci, by day: wide slow circles on still wings, a beat now and then. `ctx` in map units, over
    everything. */
export function hawks(ctx: CanvasRenderingContext2D, m: Tiles, key: string, cam: View, now: number, still: boolean, day: number) {
  if (day < 0.5) return;
  hawksOf(m, key).forEach(function (h, k) {
    var t = still ? k * 1.7 : now / 5200 + k * 1.7, r = T * (2.2 + hash(k, 5, 53) * 1.6), turn = k % 2 ? -1 : 1;
    var x = h[0] * T + Math.cos(t * turn) * r, y = h[1] * T + Math.sin(t * turn) * r * 0.5;
    if (x < cam.x - 30 || x > cam.x + cam.w + 30 || y < cam.y - 30 || y > cam.y + cam.h + 30) return;
    /* it looks where it flies; the wings dip a little into the turn, and beat once in a while */
    var a = Math.atan2(Math.cos(t * turn) * 0.5 * turn, -Math.sin(t * turn) * turn), beat = still ? 0 : Math.max(0, Math.sin(now / 160 + k * 2)) * (Math.sin(now / 2300 + k) > 0.8 ? 3 : 0);
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-1, -13); ctx.quadraticCurveTo(-4 - beat, -6, 0, 0); ctx.quadraticCurveTo(-4 - beat, 6, -1, 13);
    ctx.strokeStyle = INK; ctx.lineWidth = 4.6; ctx.stroke(); ctx.strokeStyle = '#8a6a4f'; ctx.lineWidth = 2.6; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-6, 0); ctx.lineTo(4, 0); ctx.strokeStyle = INK; ctx.lineWidth = 3.4; ctx.stroke(); ctx.strokeStyle = '#8a6a4f'; ctx.lineWidth = 1.6; ctx.stroke();
    ctx.restore();
  });
}
/** the dust of a landing, after a jump down a terrace: three puffs that open and fade (age: 0…1) */
export function landing(ctx: CanvasRenderingContext2D, x: number, y: number, age: number, P: Palette) {
  if (age < 0 || age >= 1) return;
  ctx.save(); ctx.globalAlpha = (1 - age) * 0.8; ctx.fillStyle = P.path; ctx.strokeStyle = INK; ctx.lineWidth = 1;
  for (var k = -1; k <= 1; k++) { ctx.beginPath(); ctx.arc(x + k * (7 + age * 9), y - Math.abs(k) * 1 - age * 4, 3 + age * 3 - Math.abs(k), 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
