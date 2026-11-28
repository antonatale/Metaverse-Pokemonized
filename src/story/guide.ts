import { M, isSea, isWall, moveMode } from './maps';

/* The way to the next stop, for the arrow that guides the player (24 November 2026, Antonio: the arrow «è brutta,
   piccola e non mi piace come animazione»). The arrow no longer points as the crow flies, into a wall: it points along
   the streets, to where the way to the stop goes. A field of distances is laid out from the stop, once for each stop
   (and again when the player starts or stops swimming or climbing): from any tile, the way is down the field. People
   are not counted (they move); a stop that cannot be reached by the streets leaves the arrow as the crow flies. */
interface Field { id: string; w: number; h: number; d: Int32Array }
var field: Field | null = null;
const FAR = 0x7fffffff;
/** whether a tile can be walked for the field: the map's own walls and water, as the player is moving now */
function open(x: number, y: number): boolean {
  var m = M;
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
  if (m.solid[y * m.w + x] !== 1) return true;
  return (moveMode.swim && isSea(m, x, y)) || (moveMode.climb && isWall(m, x, y));
}
function lay(tx: number, ty: number): Field {
  var m = M, w = m.w, h = m.h, d = new Int32Array(w * h).fill(FAR), q = new Int32Array(w * h), head = 0, tail = 0;
  /* from the stop and from the tiles around it: a stop is often a person, a door, a sign, which stand on solid tiles */
  for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) {
    var x = tx + ox, y = ty + oy;
    if (x < 0 || y < 0 || x >= w || y >= h) continue;
    if ((ox || oy) && !open(x, y)) continue;
    var k = y * w + x, c = Math.abs(ox) + Math.abs(oy);
    if (d[k] <= c) continue;
    d[k] = c; q[tail++] = k;
  }
  while (head < tail) {
    var cur = q[head++], cx = cur % w, cy = (cur - cx) / w, nd = d[cur] + 1;
    if (cx > 0 && d[cur - 1] > nd && open(cx - 1, cy)) { d[cur - 1] = nd; q[tail++] = cur - 1; }
    if (cx < w - 1 && d[cur + 1] > nd && open(cx + 1, cy)) { d[cur + 1] = nd; q[tail++] = cur + 1; }
    if (cy > 0 && d[cur - w] > nd && open(cx, cy - 1)) { d[cur - w] = nd; q[tail++] = cur - w; }
    if (cy < h - 1 && d[cur + w] > nd && open(cx, cy + 1)) { d[cur + w] = nd; q[tail++] = cur + w; }
  }
  return { id: '', w: w, h: h, d: d };
}
/** where the way from (x, y) to the stop (tx, ty) goes: a tile up to `ahead` steps along it, and how many steps are
    left; null when the streets do not lead there (then the arrow points straight) */
export function guide(x: number, y: number, tx: number, ty: number, ahead?: number): { x: number; y: number; left: number } | null {
  var id = M.id + ':' + tx + ',' + ty + (moveMode.swim ? ':s' : '') + (moveMode.climb ? ':c' : '');
  if (!field || field.id !== id) { field = lay(tx, ty); field.id = id; }
  var f = field, w = f.w;
  if (x < 0 || y < 0 || x >= f.w || y >= f.h) return null;
  var k = y * w + x, left = f.d[k];
  if (left === FAR) return null;
  var cx = x, cy = y, n = ahead || 5;
  for (var s = 0; s < n; s++) {
    var best = -1, bd = f.d[cy * w + cx];
    if (bd === 0) break;
    var cand = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
    for (var i = 0; i < 4; i++) {
      var nx = cand[i][0], ny = cand[i][1];
      if (nx < 0 || ny < 0 || nx >= f.w || ny >= f.h) continue;
      var v = f.d[ny * w + nx];
      if (v < bd) { bd = v; best = i; }
    }
    if (best < 0) break;
    cx = cand[best][0]; cy = cand[best][1];
  }
  return { x: cx, y: cy, left: left };
}
/** the way itself, tile by tile, from (x, y) toward the stop, at most `max` steps (the navigator draws it on its
    little map); null when the streets do not lead there */
export function pathTo(x: number, y: number, tx: number, ty: number, max: number): [number, number][] | null {
  if (!guide(x, y, tx, ty, 0)) return null;
  var f = field!, w = f.w, out: [number, number][] = [[x, y]], cx = x, cy = y;
  for (var s = 0; s < max; s++) {
    var bd = f.d[cy * w + cx], best = -1;
    if (bd === 0) break;
    var cand = [[cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]];
    /* straight on first, so the line keeps to the streets instead of zigzagging across a square */
    if (out.length > 1) {
      var px = out[out.length - 2][0], py = out[out.length - 2][1], k = cand.findIndex(function (c) { return c[0] - cx === cx - px && c[1] - cy === cy - py; });
      if (k > 0) cand.unshift(cand.splice(k, 1)[0]);
    }
    for (var i = 0; i < 4; i++) {
      var nx = cand[i][0], ny = cand[i][1];
      if (nx < 0 || ny < 0 || nx >= f.w || ny >= f.h) continue;
      var v = f.d[ny * w + nx];
      if (v < bd) { bd = v; best = i; }
    }
    if (best < 0) break;
    cx = cand[best][0]; cy = cand[best][1];
    out.push([cx, cy]);
  }
  return out;
}
/** forget the field (a map changed under it: a door opened, a wall fell) */
export function forgetGuide() { field = null; }
