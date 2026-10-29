/* From real coordinates to tiles of the Formia map. North is up. Rows are 0.00034° of latitude (about 38 m).
   Columns are piecewise: the places that matter to Antonio get room (Vindicio, the centre, Via Amendola),
   the stretches in between are squeezed. tools/formia/build.ts draws the ground through it, and
   src/data/maps/formia.ts places people, signs and things through it. */

/** longitude → column, by anchors */
export const X_ANCHORS: [number, number][] = [
  [13.566, 0],     // west of the Pineta di Vindicio
  [13.593, 44],    // Vindicio: the beach, the pineta, the Tomba di Cicerone (about 51 m a tile)
  [13.6205, 114],  // Castellone, the centre, Mola: the most room (about 33 m a tile)
  [13.634, 126],   // squeezed: Parco Gramsci, the Bruno Zauli centre
  [13.648, 146],   // Via Amendola, Parco la Fontana, Palamendola (about 59 m a tile)
  [13.678, 164]    // Gianola, squeezed: Santo Janni, the park, the villa of Mamurra
];
export const LAT_TOP = 41.2705, LAT_STEP = 0.00034;
export const W = 165, H = 82;

export function col(lon: number): number {
  const A = X_ANCHORS;
  let k = 0;
  while (k < A.length - 2 && lon > A[k + 1][0]) k++;
  const [l0, x0] = A[k], [l1, x1] = A[k + 1];
  return x0 + (lon - l0) / (l1 - l0) * (x1 - x0);
}
export function row(lat: number): number { return (LAT_TOP - lat) / LAT_STEP; }
/** the tile a real place falls on */
export function tile(lat: number, lon: number): [number, number] { return [Math.floor(col(lon)), Math.floor(row(lat))]; }
