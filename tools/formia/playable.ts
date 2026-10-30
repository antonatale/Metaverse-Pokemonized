/* What makes the Formia map playable, as checks on its rows: the streets are one network with no dead ends
   (a street may end at the edge of the map, on a beach or on a promenade), and the railway is one line that
   only stops at a tunnel or at the edge (across a level crossing it goes on). Used by tools/formia/audit.ts
   and by tests/unit/maps.test.ts. */
export type XY = [number, number];
const N4: XY[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function cut(rows: string[]) {
  const H = rows.length, W = rows[0].length;
  const at = (x: number, y: number) => (x >= 0 && y >= 0 && x < W && y < H ? rows[y][x] : '');
  const street = (x: number, y: number) => /[=vz]/.test(at(x, y));
  const rail = (x: number, y: number) => at(x, y) === 'r';
  const edge = (x: number, y: number) => x === 0 || y === 0 || x === W - 1 || y === H - 1;
  return { W, H, at, street, rail, edge };
}
/** the pieces the streets make, biggest first */
export function streetPieces(rows: string[]): XY[][] {
  const { W, H, street } = cut(rows), seen = new Set<number>(), out: XY[][] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (seen.has(y * W + x) || !street(x, y)) continue;
    const c: XY[] = [], q: XY[] = [[x, y]];
    seen.add(y * W + x);
    while (q.length) {
      const [a, b] = q.pop()!;
      c.push([a, b]);
      for (const [dx, dy] of N4) { const nx = a + dx, ny = b + dy; if (street(nx, ny) && !seen.has(ny * W + nx)) { seen.add(ny * W + nx); q.push([nx, ny]); } }
    }
    out.push(c);
  }
  return out.sort((p, q) => q.length - p.length);
}
/** street tiles where a street just stops */
export function deadEnds(rows: string[]): XY[] {
  const { W, H, at, street, edge } = cut(rows), out: XY[] = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!street(x, y) || edge(x, y)) continue;
    const ways = N4.filter(([a, b]) => street(x + a, y + b)).length;
    const shore = N4.some(([a, b]) => /[:_]/.test(at(x + a, y + b)));
    if (ways <= 1 && !shore) out.push([x, y]);
  }
  return out;
}
/** rail tiles where the line stops in the open: not at a tunnel mouth (the tile below it), not at the edge */
export function railEnds(rows: string[], tunnels: XY[]): XY[] {
  const { W, H, street, rail, edge } = cut(rows), out: XY[] = [];
  const mouth = new Set(tunnels.map(([x, y]) => x + ',' + (y + 1)));
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (!rail(x, y) || edge(x, y) || mouth.has(x + ',' + y)) continue;
    /* across a level crossing the line goes on, past one or two tiles of street */
    const arms = N4.filter(([a, b]) => rail(x + a, y + b) || (street(x + a, y + b) && (rail(x + 2 * a, y + 2 * b) || (street(x + 2 * a, y + 2 * b) && rail(x + 3 * a, y + 3 * b))))).length;
    if (arms <= 1) out.push([x, y]);
  }
  return out;
}
