/* The places of Formia: real coordinates (from OpenStreetMap, or by hand where OSM has nothing), size in tiles,
   and what they say. tools/formia/build.ts finds each one a free spot near where it really is (no roads, rails or
   sea under it, a walkable tile in front of the door) and writes the result in formia-ground.ts.
   Antonio is the one who lives here: home, his friends' hangouts, the places they go; the rest is the town around. */

export type LatLon = [number, number];
export interface PlaceSpec {
  id: string;
  /** an art kind (house, condo, pub, lido, church…), or 'area' for an open space painted on the ground */
  kind: string;
  w: number; h: number;
  at: LatLon;
  /** a building with a door on its bottom row; objects and areas have none */
  door?: boolean;
  /** column of the door from the left edge, the middle when missing */
  doorAt?: number;
  /** for 'area': the ground it is paved or planted with */
  fill?: 'piazza' | 'garden' | 'beach';
  /** tiles kept free of houses and trees around it */
  room?: number;
  /** how far it may move from where it really is, in tiles */
  reach?: number;
  /** it stands on sand (the lidi) or in the water (boats) */
  on?: 'sand' | 'sea';
}
/** something on one tile: a sign, a person, a lost thing, a scooter; at a real place or next to one */
export interface SpotSpec {
  id: string; at?: LatLon; near?: { place: string; dx: number; dy: number }; on?: 'sand' | 'sea' | 'any';
  /** nobody stands here, Antonio just starts here: it may be on a footpath */
  walk?: boolean;
}

export const PLACES: PlaceSpec[] = [
  /* ---------- home: Parco la Fontana, Via Giovanni Amendola 1, Gianola ---------- */
  { id: 'casa', kind: 'condo', w: 5, h: 4, at: [41.2633, 13.6430], door: true, room: 2 },
  { id: 'fontana', kind: 'fountain', w: 2, h: 2, at: [41.2626, 13.6446], room: 1 },
  { id: 'palamendola', kind: 'coni', w: 6, h: 2, at: [41.2616, 13.6419], door: true },
  { id: 'campo-amendola', kind: 'area', fill: 'garden', w: 6, h: 3, at: [41.2608, 13.6397] },
  /* ---------- the Bruno Zauli olympic centre, and its covered tennis courts (Forchetta's covo) ---------- */
  { id: 'zauli', kind: 'coni', w: 7, h: 3, at: [41.2632, 13.6293], door: true },
  { id: 'tennis', kind: 'circolo', w: 6, h: 3, at: [41.2644, 13.6276], door: true },
  { id: 'parco-gramsci', kind: 'area', fill: 'garden', w: 5, h: 3, at: [41.2616, 13.6250] },
  /* ---------- Mola ---------- */
  { id: 'torre-mola', kind: 'tower', w: 2, h: 3, at: [41.2589, 13.6140], reach: 4 },
  { id: 'morgana', kind: 'pub', w: 5, h: 3, at: [41.25819, 13.61234], door: true, room: 2 },
  { id: 'chiesa-mola', kind: 'church', w: 4, h: 3, at: [41.2598, 13.6162], door: true },
  { id: 'gelati', kind: 'shop', w: 4, h: 3, at: [41.2578, 13.6098], door: true },
  { id: 'bar', kind: 'bar', w: 4, h: 3, at: [41.2584, 13.6110], door: true },
  { id: 'biglietti', kind: 'kiosk', w: 2, h: 2, at: [41.2565, 13.6106], door: true },
  { id: 'traghetto', kind: 'ferry', w: 5, h: 3, at: [41.2554, 13.6118], on: 'sea', reach: 6 },
  /* ---------- the centre: station, town hall, Piazza della Vittoria ---------- */
  { id: 'stazione', kind: 'station', w: 9, h: 3, at: [41.25875, 13.60613], door: true },
  { id: 'comune', kind: 'palazzo', w: 8, h: 3, at: [41.2562, 13.6050], door: true },
  { id: 'piazza', kind: 'area', fill: 'piazza', w: 10, h: 5, at: [41.2551, 13.6062], room: 1 },
  { id: 'villa-comunale', kind: 'area', fill: 'garden', w: 6, h: 4, at: [41.2560, 13.6084] },
  { id: 'forno', kind: 'shop', w: 4, h: 3, at: [41.2567, 13.6070], door: true, reach: 12 },
  /* ---------- Castellone ---------- */
  { id: 'erasmo', kind: 'church', w: 4, h: 3, at: [41.25573, 13.59883], door: true },
  { id: 'torre-castellone', kind: 'octagon', w: 2, h: 2, at: [41.2563, 13.5999], reach: 4 },
  /* ---------- Vindicio: the Tomba di Cicerone, the beach, the Eclipse, the pineta ---------- */
  { id: 'tomba', kind: 'tomb', w: 3, h: 3, at: [41.2516, 13.5787] },
  /* the Eclipse beach, Nicola Spadea's lido on the lungomare of Vindicio: the lido at the back, the beach in front */
  { id: 'eclipse', kind: 'lido', w: 6, h: 2, at: [41.2492, 13.5874], door: true, on: 'sand', reach: 8, room: 0 },
  { id: 'eclipse-spiaggia', kind: 'area', fill: 'beach', w: 12, h: 6, at: [41.2484, 13.5880], on: 'sand', reach: 8, room: 0 },
  { id: 'scogliera', kind: 'lido', w: 4, h: 2, at: [41.2449, 13.5790], door: true, on: 'sand', reach: 6 },
  /* ---------- Gianola ---------- */
  { id: 'oriente', kind: 'lido', w: 4, h: 2, at: [41.2536, 13.6644], door: true, on: 'sand', reach: 6 },
  { id: 'mamurra', kind: 'ruins', w: 2, h: 2, at: [41.25017, 13.66853] }
];

export const SPOTS: SpotSpec[] = [
  /* home */
  { id: 'start', near: { place: 'casa', dx: 2, dy: 4 }, walk: true },
  { id: 'motorino', near: { place: 'casa', dx: 6, dy: 3 } },
  { id: 'motorino-eclipse', near: { place: 'eclipse', dx: -2, dy: 1 }, on: 'any' },
  { id: 'motorino-morgana', near: { place: 'morgana', dx: 6, dy: 2 } },
  { id: 'motorino-piazza', near: { place: 'piazza', dx: 4, dy: -2 } },
  { id: 'motorino-zauli', near: { place: 'zauli', dx: 8, dy: 3 } },
  { id: 'motorino-pineta', at: [41.2492, 13.5770] },
  { id: 'sign-casa', near: { place: 'casa', dx: -1, dy: 4 } },
  /* the friends and the townsfolk */
  { id: 'costanzo', near: { place: 'piazza', dx: 4, dy: 1 } },
  { id: 'folla1', near: { place: 'piazza', dx: 2, dy: 3 } }, { id: 'folla2', near: { place: 'piazza', dx: 5, dy: 3 } },
  { id: 'folla3', near: { place: 'piazza', dx: 7, dy: 3 } }, { id: 'folla4', near: { place: 'piazza', dx: 1, dy: 2 } },
  { id: 'nicola', near: { place: 'eclipse', dx: 3, dy: 3 }, on: 'sand' },
  { id: 'valentin', near: { place: 'eclipse-spiaggia', dx: 9, dy: 4 }, on: 'sand' },
  { id: 'zendavid', at: [41.2482, 13.5730] },
  { id: 'andrea', near: { place: 'zauli', dx: 2, dy: 4 } },
  { id: 'oste', near: { place: 'morgana', dx: 4, dy: 3 } },
  { id: 'costanzo-morgana', near: { place: 'morgana', dx: 1, dy: 4 } },
  { id: 'forchetta-eclipse', near: { place: 'eclipse-spiaggia', dx: 4, dy: 5 }, on: 'sand' },
  { id: 'vicina', near: { place: 'casa', dx: 5, dy: 5 } },
  { id: 'capotreno', near: { place: 'stazione', dx: 2, dy: 3 } },
  { id: 'turista', near: { place: 'tomba', dx: 4, dy: 2 } },
  { id: 'anziano', near: { place: 'torre-castellone', dx: 2, dy: 2 } },
  { id: 'fornaia', near: { place: 'forno', dx: 1, dy: 3 } },
  { id: 'tifoso', near: { place: 'bar', dx: 2, dy: 3 } },
  { id: 'gelataio', near: { place: 'gelati', dx: 1, dy: 3 } },
  { id: 'marinaio', near: { place: 'biglietti', dx: 3, dy: 1 } },
  { id: 'velocista', near: { place: 'zauli', dx: 6, dy: 4 } },
  { id: 'tennista', near: { place: 'tennis', dx: 5, dy: 3 } },
  { id: 'cestista', near: { place: 'palamendola', dx: 1, dy: 2 } },
  { id: 'bagnino', near: { place: 'eclipse-spiaggia', dx: 1, dy: 5 }, on: 'sand' },
  { id: 'bambino', near: { place: 'eclipse-spiaggia', dx: 6, dy: 5 }, on: 'sand' },
  { id: 'guardaparco', near: { place: 'mamurra', dx: 3, dy: 1 } },
  { id: 'pescatore', near: { place: 'torre-mola', dx: -2, dy: 3 } },
  /* signs */
  { id: 'sign-stazione', near: { place: 'stazione', dx: -2, dy: 3 } },
  { id: 'sign-comune', near: { place: 'comune', dx: 9, dy: 2 } },
  { id: 'sign-piazza', near: { place: 'piazza', dx: -1, dy: 5 } },
  { id: 'sign-erasmo', near: { place: 'erasmo', dx: -1, dy: 3 } },
  { id: 'sign-castellone', near: { place: 'torre-castellone', dx: 3, dy: 1 } },
  { id: 'sign-cisternone', at: [41.25569, 13.60104] },
  { id: 'sign-mola', near: { place: 'torre-mola', dx: 3, dy: 2 } },
  { id: 'sign-morgana', near: { place: 'morgana', dx: -1, dy: 3 } },
  { id: 'sign-porto', near: { place: 'biglietti', dx: -1, dy: 2 } },
  { id: 'sign-tomba', near: { place: 'tomba', dx: -1, dy: 3 } },
  { id: 'sign-vindicio', near: { place: 'eclipse-spiaggia', dx: -1, dy: 0 }, on: 'any' },
  { id: 'sign-pineta', at: [41.2490, 13.5752] },
  { id: 'sign-zauli', near: { place: 'zauli', dx: -1, dy: 3 } },
  { id: 'sign-gianola', near: { place: 'mamurra', dx: -2, dy: 2 } },
  { id: 'sign-caposele', at: [41.2512, 13.5975] },
  /* Antonio's lost things */
  { id: 'caricabatterie', near: { place: 'stazione', dx: 6, dy: 4 } },
  { id: 'appunti', near: { place: 'erasmo', dx: 3, dy: 3 } },
  { id: 'passaporto', near: { place: 'tomba', dx: 1, dy: 4 } },
  { id: 'portafoglio', near: { place: 'eclipse-spiaggia', dx: 10, dy: 2 }, on: 'sand' }
];
