/* From real coordinates to tiles of the Formia map. North is up. Rows are 0.00022° of latitude (about 24 m).
   Columns are piecewise: the centre has the most room (about 23 m a tile), Vindicio, Rio Fresco and Via Amendola
   a little less, the coast toward Gianola and Scauri is squeezed. tools/formia/build.ts draws the ground through
   it, and src/data/maps/formia.ts places people, signs and things through it.
   The map of 11 November 2026 (VISIONE.md, the scooter): 320×128 tiles, two and a half times the one before; 152 rows
   with the coast toward Gaeta (17 November), 350 columns with Castellone and the centre drawn at twice the scale
   (17 November, docs/mappa.md «Castellone e il centro»). */

/** longitude → column, by anchors */
export const X_ANCHORS: [number, number][] = [
  [13.566, 0],      // the Appia toward Itri, the woods toward Gaeta
  [13.593, 60],     // Vindicio: the beach, the pineta, the Tomba di Cicerone (about 37 m a tile)
  [13.59905, 82],   // the foot of Castellone, toward Caposele (about 23 m a tile up to here)
  [13.6073, 142],   // Castellone and the centre, from Sant'Erasmo to Via Lavanga: twice as many tiles (about 11.5 m a tile)
  [13.6205, 190],   // the port, Largo Paone, Mola (about 23 m a tile)
  [13.634, 226],    // Rio Fresco, Parco Gramsci, the Bruno Zauli centre (about 31 m a tile)
  [13.648, 262],    // Via Amendola, Parco la Fontana, the Villaggio Don Bosco (about 32 m a tile)
  [13.678, 302],    // Santo Janni, Gianola, the villa of Mamurra (about 63 m a tile)
  [13.700, 322],    // past Gianola, along the coast road (about 92 m a tile)
  [13.725, 349]     // Scauri and its station, where Zendavid lives (about 77 m a tile)
];
export const LAT_TOP = 41.2722, LAT_STEP = 0.00022;
export const W = 350, H = 152;

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
