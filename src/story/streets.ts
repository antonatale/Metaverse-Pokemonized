import { FORMIA_STREETS } from '../data/maps/formia-ground';
import { M } from './maps';

/* The real names of the streets of Formia, tile by tile, for the navigator in the corner (ui/navigator.ts): which
   street Antonio is walking along, which one the way to the next stop turns into. The lines come from the generator
   (tools/formia/network.ts, written into formia-ground.ts by build.ts), drawn the same way it draws them: a straight
   run from corner to corner, `w` tiles wide. Where two streets cross, the corner belongs to the first one listed (the
   streets before the stairs, the stairs before the footpaths). Only in Formia outdoors: the other maps have no names. */
var grid: Uint16Array | null = null, names: string[] = [];
function lay(): Uint16Array {
  var w = 350, h = 152;
  var g = new Uint16Array(w * h), idx: Record<string, number> = {};
  names = [''];
  FORMIA_STREETS.forEach(function (l) {
    /* the two spellings of the apostrophe in Viale Unità d'Italia are one street */
    var n = l.n.replace(/[’‘]/g, "'"), k = idx[n];
    if (k == null) { k = idx[n] = names.length; names.push(n); }
    for (var i = 0; i + 1 < l.pts.length; i++) {
      var x0 = l.pts[i][0], y0 = l.pts[i][1], x1 = l.pts[i + 1][0], y1 = l.pts[i + 1][1];
      if (x0 !== x1 && y0 !== y1) continue;
      var sx = Math.sign(x1 - x0), sy = Math.sign(y1 - y0);
      for (var x = x0, y = y0; ; x += sx, y += sy) {
        for (var dy = 0; dy < l.w; dy++) for (var dx = 0; dx < l.w; dx++) {
          var tx = x + dx, ty = y + dy;
          if (tx >= 0 && ty >= 0 && tx < w && ty < h && !g[ty * w + tx]) g[ty * w + tx] = k;
        }
        if (x === x1 && y === y1) break;
      }
    }
  });
  return g;
}
/** the name of the street at a tile of Formia ('' off the streets, or on another map) */
export function streetAt(x: number, y: number): string {
  if (M.id !== 'formia') return '';
  if (!grid) grid = lay();
  if (x < 0 || y < 0 || x >= 350 || y >= 152) return '';
  return names[grid[y * 350 + x]] || '';
}
/** the street at a tile or, just off it (on the pavement, at a door), the nearest one within a step or two */
export function streetNear(x: number, y: number): string {
  var s = streetAt(x, y);
  if (s || M.id !== 'formia') return s;
  for (var r = 1; r <= 2; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
    if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
    s = streetAt(x + dx, y + dy);
    if (s) return s;
  }
  return '';
}
