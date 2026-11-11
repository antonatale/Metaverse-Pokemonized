/* North is up. The urban map uses the same 20 m scale in both directions, from Vindicio to Scauri.
   Only the mountain approach north of 41.275° is compressed: it keeps the Redentore walk on this map.
   Source coordinates remain in formia-places.ts; buildings can move a few tiles to keep their doors usable. */
export const METRES_PER_TILE = 20;
export const WEST = 13.566;
export const X_ANCHORS: [number, number][] = [[WEST, 0], [13.7255, 668]];
export const LAT_TOP = 41.310, LAT_STEP = METRES_PER_TILE / 111320;
export const W = 670, H = 210;
export function col(lon: number): number { return (lon - WEST) * 83760 / METRES_PER_TILE; }
export function row(lat: number): number {
  return lat > 41.275 ? (LAT_TOP - lat) / (LAT_TOP - 41.275) * 24 : 24 + (41.275 - lat) / LAT_STEP;
}
export function tile(lat: number, lon: number): [number, number] { return [Math.floor(col(lon)), Math.floor(row(lat))]; }
/** Compatibility for the few story spots authored on the former schematic map. New places use coordinates. */
export function legacyTile(x: number, y: number): [number, number] {
  const a = [[13.566, 0], [13.593, 44], [13.6205, 114], [13.634, 126], [13.648, 146], [13.678, 164], [13.700, 178], [13.725, 198]];
  let k = 0; while (k < a.length - 2 && x > a[k + 1][1]) k++;
  return tile(41.2705 - y * 0.00034, a[k][0] + (x - a[k][1]) / (a[k + 1][1] - a[k][1]) * (a[k + 1][0] - a[k][0]));
}
