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
  /** for 'area': the ground it is paved or planted with (a field is plain grass, for a track drawn on it; a yard is a
      lawn closed by a hedge, with a gate on its west side) */
  fill?: 'piazza' | 'garden' | 'beach' | 'pines' | 'field' | 'yard' | 'track' | 'court' | 'round' | 'parking' | 'pinetina';
  /* kind 'covo': the lair of a friend (data/covi.ts), drawn as `look` (the leader) in render/canvas/covo.ts */
  /** tiles kept free of houses and trees around it */
  room?: number;
  /** how far it may move from where it really is, in tiles */
  reach?: number;
  /** it stands on sand (the lidi) or in the water (boats) */
  on?: 'sand' | 'sea';
  /** a top-left tile picked by hand on the playable map, instead of the free spot nearest to `at`:
      the centre, where the buildings, the square and the streets are composed together (see tools/formia/network.ts) */
  tile?: [number, number];
  /** a palazzo of a cortina (kind 'cortina'): what its ground floor is (pub, barber, tobacconist, winebar, bar, alto
      for the tall one of Largo Paone; a home when missing), and how far it rises over its footprint, in tiles */
  look?: string;
  up?: number;
}
/** something on one tile: a sign, a person, a lost thing, a scooter; at a real place or next to one */
export interface SpotSpec {
  id: string; at?: LatLon; near?: { place: string; dx: number; dy: number }; on?: 'sand' | 'sea' | 'any';
  /** a tile picked by hand (the countryside and the mountains have no place to be near) */
  tile?: [number, number];
  /** nobody stands here, Antonio just starts here: it may be on a footpath */
  walk?: boolean;
}

/** Extent of the road and building changes in the formia14 save migration (inclusive). */
export const VINDICIO_REVISION = { x0: 13, y0: 79, x1: 65, y1: 127 };

/** North-west corners of the three-tile coast road. Shared by the ground generator,
    lane markings and district names so the road in the game is the road on the map. */
export const LITORANEA: { name: string; w: 3; pts: [number, number][] }[] = [
  { name: 'Lungomare Giovanni Caboto', w: 3, pts: [[12, 151], [12, 147], [16, 147], [16, 141], [20, 141], [20, 134], [24, 134], [24, 127], [26, 127], [26, 123]] },
  { name: 'Viale Unità d’Italia', w: 3, pts: [[26, 123], [26, 114], [29, 114], [29, 106], [30, 106], [30, 99], [39, 99], [39, 98], [49, 98], [49, 96], [62, 96], [62, 91], [102, 91]] }
];

/** The old southern edge gained three open-water tiles when the coastline was extended. */
export const LITORANEA_FLOODED: [number, number][] = [[36, 127], [301, 127], [310, 127]];
export const LITORANEA_REVISION = [
  { x0: 0, y0: 79, x1: 111, y1: 127 },
  { x0: 300, y0: 120, x1: 311, y1: 127 }
];

export const PINETA_REVISION = { x0: 28, y0: 98, x1: 54, y1: 118 };

export const PINETA_COSTIERA = { x0: 63, y0: 94, x1: 81, y1: 104 };
export const PINETA_COSTIERA_REVISION = { x0: 27, y0: 92, x1: 99, y1: 124 };

export const PLACES: PlaceSpec[] = [
  /* ---------- home: Parco la Fontana, Via Giovanni Amendola 1: the building, its garden closed by a hedge on the Via
     Appia, the fountain in the garden. Across the Appia, a little toward the centre, the Villaggio Don Bosco ---------- */
  { id: 'casa', kind: 'condo', w: 5, h: 4, at: [41.2633, 13.6430], door: true, tile: [244, 38] },
  { id: 'giardino', kind: 'area', fill: 'yard', w: 7, h: 4, at: [41.2626, 13.6430], tile: [243, 42] },
  { id: 'palamendola', kind: 'arena', w: 6, h: 2, at: [41.2616, 13.6419], door: true, tile: [244, 33] },
  { id: 'donbosco', kind: 'parish', w: 5, h: 3, at: [41.2614, 13.6391], door: true, tile: [240, 48] },
  { id: 'oratorio', kind: 'coni', w: 4, h: 2, at: [41.2612, 13.6400], door: true, tile: [233, 49] },
  { id: 'sagrato', kind: 'area', fill: 'piazza', w: 5, h: 2, at: [41.2612, 13.6391], tile: [236, 52] },
  { id: 'campo-amendola', kind: 'area', fill: 'garden', w: 7, h: 4, at: [41.2611, 13.6380], tile: [242, 52] },
  /* the other palazzine of Parco la Fontana (seven of the eight shapes of OpenStreetMap, Antonio's included), along
     its walks; in the middle the round common garden, the fountain at its centre */
  /* 13 November 2026 (Antonio): the park is bigger, up to the railway; the round garden with the fountain is its
     centre, and beside it, on the east, Antonio's covo. The palazzine stand along the north side and in the corner */
  { id: 'palazzina-1', kind: 'condo', w: 4, h: 3, at: [41.2633, 13.6412], door: true, tile: [251, 32] },
  { id: 'palazzina-2', kind: 'condo', w: 4, h: 3, at: [41.2633, 13.6417], door: true, tile: [256, 32] },
  { id: 'palazzina-3', kind: 'condo', w: 4, h: 3, at: [41.2632, 13.6421], door: true, tile: [261, 32] },
  { id: 'palazzina-4', kind: 'condo', w: 4, h: 3, at: [41.2622, 13.6412], door: true, tile: [251, 41] },
  { id: 'parco-giardino', kind: 'area', fill: 'round', w: 10, h: 7, at: [41.2627, 13.6417], tile: [255, 35] },
  { id: 'covo-antonio', kind: 'covo', look: 'antonio', up: 0.8, w: 5, h: 4, at: [41.2628, 13.6424], door: true, doorAt: 2, tile: [265, 34] },
  /* ---------- the Bruno Zauli olympic centre, and its covered tennis courts (Forchetta's covo) ---------- */
  { id: 'zauli', kind: 'coni', w: 7, h: 3, at: [41.2632, 13.6293], door: true, tile: [219, 42] },
  { id: 'tennis', kind: 'covo', look: 'forchetta', up: 2.6, w: 6, h: 3, at: [41.2644, 13.6276], door: true, tile: [219, 33] },
  /* the athletics track where Mennea trained, behind the centre */
  { id: 'pista', kind: 'area', fill: 'track', w: 7, h: 13, at: [41.2655, 13.6300], tile: [209, 33] },
  { id: 'parco-gramsci', kind: 'area', fill: 'garden', w: 5, h: 3, at: [41.2616, 13.6250], tile: [195, 41] },
  /* ---------- Mola ---------- */
  /* the Torre di Mola: round, crenellated, 27 metres high and 15 across, over the little harbour; at its foot the
     square with the anchor, where the children climb (the lane of via Abate Tosti ends here) */
  { id: 'torre-mola', kind: 'castello', w: 4, h: 3, at: [41.2589, 13.6140], tile: [174, 60] },
  /* the castle round it, on the little harbour inside the lungomare: its walls and the stone portal (Street View, via
     Abate Tosti 37); in front of it the square of the anchor */
  { id: 'castello-mura', kind: 'castlewall', w: 4, h: 4, at: [41.2587, 13.6140], door: true, doorAt: 1, tile: [174, 63] },
  { id: 'ancora-piazzetta', kind: 'area', fill: 'piazza', w: 3, h: 6, at: [41.2589, 13.6137], tile: [171, 61] },
  /* via Abate Tosti: Morgana at the end toward Largo Paone (number 105), Forchetta's home, the barber toward the
     tower; across the lane the bar by the tower. All of them palazzi of the cortina, the shop on the ground floor */
  { id: 'morgana', kind: 'cortina', look: 'pub', up: 0.1, w: 3, h: 4, at: [41.25819, 13.61234], door: true, tile: [164, 66] },
  /* Piazza San Giovanni: the collegiate church of Saints Lorenzo and Giovanni Battista, and across the square the
     Vitruvio Pollione school; by them the remains of the Roman aqueduct */
  { id: 'chiesa-mola', kind: 'collegiata', w: 6, h: 3, at: [41.2596, 13.6123], door: true, tile: [156, 51] },
  { id: 'piazza-sangiovanni', kind: 'area', fill: 'piazza', w: 6, h: 3, at: [41.2592, 13.6124], tile: [156, 54] },
  { id: 'scuola', kind: 'school', w: 6, h: 3, at: [41.2596, 13.6134], door: true, tile: [164, 53] },
  { id: 'acquedotto', kind: 'aqueduct', w: 3, h: 2, at: [41.2599, 13.6129], tile: [164, 50] },
  /* up via Emanuele Filiberto, the other school of Mola, the Edmondo De Amicis, across from Piazza Risorgimento */
  { id: 'scuola-deamicis', kind: 'school', look: 'deamicis', w: 6, h: 3, at: [41.26105, 13.61432], door: true, tile: [174, 50] },
  /* the Gelateria Lavezzi, in Piazza Marconi by the Comune: gelato since 1870 */
  { id: 'gelati', kind: 'gelateria', w: 4, h: 3, at: [41.25581, 13.60496], door: true, tile: [116, 67] },
  { id: 'bar', kind: 'cortina', look: 'bar', up: 0.55, w: 2, h: 5, at: [41.2584, 13.6110], door: true, tile: [165, 60] },
  /* the port below Largo Paone: the ticket office, the bar of the port, Zi' Anna on the side of the sea (Largo Paone lato
     mare); the ferry for Ponza and Ventotene at its quay */
  { id: 'biglietti', kind: 'kiosk', w: 2, h: 2, at: [41.2565, 13.6106], door: true, tile: [154, 82] },
  { id: 'bar-porto', kind: 'kiosk', w: 3, h: 2, at: [41.25646, 13.61107], door: true, tile: [157, 82] },
  { id: 'zianna', kind: 'cortina', look: 'trattoria', up: 0.3, w: 4, h: 2, at: [41.2568, 13.6121], door: true, tile: [161, 82] },
  { id: 'traghetto', kind: 'ferry', w: 5, h: 3, at: [41.2554, 13.6118], on: 'sea', reach: 10 },
  /* ---------- the centre: station, town hall, Piazza della Vittoria ---------- */
  { id: 'stazione', kind: 'station', w: 12, h: 3, at: [41.25875, 13.60613], door: true, tile: [124, 60] },
  { id: 'piazza', kind: 'area', fill: 'piazza', w: 10, h: 6, at: [41.2551, 13.6062], tile: [124, 77] },
  { id: 'comune', kind: 'palazzo', w: 12, h: 4, at: [41.2562, 13.6050], door: true, tile: [128, 71] },
  /* Largo Caduti Formiani: the strip of garden between Via Vitruvio and the lungomare, east of Piazza della Vittoria */
  { id: 'caduti-formiani', kind: 'area', fill: 'garden', w: 12, h: 2, at: [41.2541, 13.6066], tile: [134, 77] },
  { id: 'forno', kind: 'bakery', w: 4, h: 4, at: [41.2567, 13.6070], door: true, tile: [94, 67] },
  /* the squares of the centre, drawn again on 17 November 2026: Piazza Marconi in front of Lavezzi and Santa Teresa,
     Piazza Aldo Moro by the post office, Piazza IV Novembre in front of the station */
  { id: 'marconi', kind: 'area', fill: 'piazza', w: 7, h: 8, at: [41.2558, 13.6050], tile: [114, 70] },
  { id: 'aldo-moro', kind: 'area', fill: 'piazza', w: 8, h: 3, at: [41.2549, 13.6054], tile: [116, 80] },
  { id: 'iv-novembre', kind: 'area', fill: 'piazza', w: 19, h: 2, at: [41.2584, 13.6062], tile: [121, 63] },
  /* the church of Santa Teresa, by the Comune (the old convent of the Carmelitani) */
  { id: 'santa-teresa', kind: 'church', look: 'teresa', w: 5, h: 4, at: [41.2560, 13.6053], door: true, tile: [123, 71] },
  /* ---------- Castellone ---------- */
  { id: 'erasmo', kind: 'church', w: 6, h: 4, at: [41.25573, 13.59883], door: true, tile: [78, 67] },
  { id: 'torre-castellone', kind: 'octagon', w: 3, h: 3, at: [41.2563, 13.5999], tile: [90, 67] },
  /* the way down into the Cisternone romano, by Largo Sant'Anna */
  { id: 'cisternone', kind: 'cistern', w: 1, h: 1, at: [41.25569, 13.60104], tile: [99, 72] },
  /* Piazza Sant'Erasmo, at the top of the borgo, with the tower; Largo Sant'Anna over the Cisternone; Piazza del
     Castello and Piazza della Porta, where the gates of the walls were; the Roman theatre with the houses in its
     cavea, and the little square in front of it (Piazzetta don Antonio Forcina) */
  { id: 'piazza-erasmo', kind: 'area', fill: 'piazza', w: 6, h: 4, at: [41.2563, 13.5995], tile: [84, 66] },
  { id: 'largo-santanna', kind: 'area', fill: 'piazza', w: 3, h: 2, at: [41.25575, 13.60104], tile: [96, 72] },
  { id: 'piazza-castello', kind: 'area', fill: 'piazza', w: 3, h: 2, at: [41.25565, 13.6022], tile: [106, 72] },
  { id: 'piazza-porta', kind: 'area', fill: 'piazza', w: 4, h: 3, at: [41.25525, 13.6013], tile: [95, 77] },
  { id: 'teatro-romano', kind: 'teatro', w: 9, h: 3, at: [41.2549, 13.6003], tile: [83, 77] },
  { id: 'piazzetta-forcina', kind: 'area', fill: 'piazza', w: 7, h: 2, at: [41.2547, 13.6003], tile: [84, 80] },
  /* ---------- Vindicio: the Tomba di Cicerone, the beach, the Eclipse, the pineta ---------- */
  { id: 'convento-irlanda', kind: 'convento', w: 6, h: 3, at: [41.2447, 13.5762], door: true, doorAt: 2, tile: [17, 123] },
  { id: 'piscina-irlanda', kind: 'piscina', w: 3, h: 2, at: [41.2445, 13.5771], tile: [21, 126] },
  { id: 'semaforo-vindicio', kind: 'semaforo', w: 1, h: 1, at: [41.2493, 13.5858], tile: [46, 97], room: 0 },
  { id: 'tomba', kind: 'tomb', w: 3, h: 3, at: [41.2516, 13.5787], tile: [27, 88] },
  /* The shore park between Caposele and Via Tito Scipione. Its clearing holds the Tempio del Basso. */
  { id: 'pineta', kind: 'area', w: 1, h: 1, at: [41.2505, 13.5945], tile: [69, 100], room: 0 },
  { id: 'bodeguita', kind: 'chiosco', w: 3, h: 1, at: [41.2505, 13.5945], tile: [74, 97], door: true, room: 0 },
  { id: 'bodeguita-ombra-1', kind: 'tavoloPaglia', w: 1, h: 1, at: [41.2505, 13.5945], tile: [75, 99], room: 0 },
  { id: 'bodeguita-ombra-2', kind: 'tavoloPaglia', w: 1, h: 1, at: [41.2505, 13.5945], tile: [77, 99], room: 0 },
  { id: 'bodeguita-ombra-3', kind: 'tavoloPaglia', w: 1, h: 1, at: [41.2505, 13.5945], tile: [76, 101], room: 0 },
  { id: 'bodeguita-tavolo', kind: 'tavoloBar', w: 1, h: 1, at: [41.2505, 13.5945], tile: [78, 100], room: 0 },
  /* the first lidi after the pineta, coming from Caposele: the Frungillo at via Tito Scipione 3, the Bandiera
     at number 7 (spiagge.it) */
  { id: 'frungillo', kind: 'lido', w: 4, h: 2, at: [41.25045, 13.5930], door: true, on: 'sand', tile: [60, 104] },
  { id: 'bandiera', kind: 'lido', w: 4, h: 2, at: [41.2501, 13.5916], door: true, on: 'sand', tile: [56, 104] },
  /* the Eclipse beach, Nicola Spadea's lido on the lungomare of Vindicio: the lido at the back, the beach in front */
  { id: 'eclipse', kind: 'lido', w: 6, h: 2, at: [41.2492, 13.5874], door: true, on: 'sand', reach: 8, room: 0, tile: [47, 109] },
  { id: 'eclipse-spiaggia', kind: 'area', fill: 'beach', w: 12, h: 6, at: [41.2484, 13.5880], on: 'sand', reach: 8, room: 0 },
  { id: 'scogliera', kind: 'lido', w: 4, h: 2, at: [41.2449, 13.5790], door: true, on: 'sand', reach: 6 },
  /* ---------- Gianola ---------- */
  { id: 'oriente', kind: 'lido', w: 4, h: 2, at: [41.2536, 13.6644], door: true, on: 'sand', reach: 6 },
  { id: 'mamurra', kind: 'ruins', w: 2, h: 2, at: [41.25017, 13.66853], tile: [304, 100] },
  /* the homes of the others (Antonio told where; the streets checked on OpenStreetMap, no house numbers): Valentin in
     via Adalgiso Ferrucci, by piazza Risorgimento and opposite the Dono Svizzero hospital; Costanzo in via Solaro and
     Forchetta in via Abate Tosti, in Mola; Andrea in Castellone, by piazza Pasquale Mattei */
  /* where the friends live, their homes turned covi by the echo of Telepilo (data/covi.ts): drawn as the covo, or as the
     home when the friend is the one played (render/canvas/covo.ts) */
  { id: 'casa-valentin', kind: 'covo', look: 'valentin', up: 4.2, w: 4, h: 3, at: [41.2613, 13.6172], door: true, doorAt: 2, tile: [175, 41] },
  { id: 'casa-costanzo', kind: 'condo', w: 4, h: 3, at: [41.2600, 13.6121], door: true, tile: [162, 43] },
  { id: 'casa-forchetta', kind: 'cortina', up: 0.55, w: 2, h: 5, at: [41.2592, 13.6146], door: true, tile: [169, 60] },
  /* Claudia: San Giulio, in via Palazzo, across from the Mattej school and the little park with the swings in front of
     it; between the Zauli and piazza Risorgimento, on the street inside, not on the Appia (Antonio, 13 November) */
  { id: 'casa-claudia', kind: 'covo', look: 'claudia', up: 5.2, w: 5, h: 4, at: [41.2641, 13.6213], door: true, doorAt: 2, tile: [188, 37] },
  { id: 'scuola-mattej', kind: 'school', w: 6, h: 3, at: [41.2652, 13.6191], door: true, tile: [185, 32] },
  { id: 'parchetto-mattej', kind: 'area', fill: 'garden', w: 5, h: 4, at: [41.2641, 13.6198], tile: [183, 37] },
  { id: 'casa-andrea', kind: 'covo', look: 'andrea', up: 4.4, w: 4, h: 3, at: [41.2541, 13.6016], door: true, doorAt: 1, tile: [89, 88] },
  /* Costanzo's covo: a palace of the people in the middle of Piazza della Vittoria, where he holds his rally */
  { id: 'covo-costanzo', kind: 'covo', look: 'costanzo', up: 2.8, w: 6, h: 3, at: [41.2551, 13.6062], door: true, doorAt: 2, tile: [126, 78] },
  /* Zendavid's covo: the temple of sound in the Pineta di Vindicio, on the crossing of its footpaths */
  { id: 'covo-zendavid', kind: 'covo', look: 'zendavid', up: 3.2, w: 5, h: 3, at: [41.2505, 13.5945], door: true, doorAt: 2, tile: [67, 97], room: 0 },
  /* Scauri, east of Gianola: the station of Minturno-Scauri (OpenStreetMap: 41.25785, 13.72077), and Zendavid's home at
     the beginning of the village, near it */
  /* the fountain of the common garden */
  { id: 'fontana', kind: 'fountain', w: 2, h: 2, at: [41.2626, 13.6446], tile: [259, 37] },
  /* ---------- the revision of 11 November 2026: what Antonio asked for (sources in docs/fonti-formia.md) ---------- */
  /* Largo Paone, where everyone meets: the square between Via Vitruvio and the lungomare, the tobacconist on it */
  /* Largo Paone (OpenStreetMap, the satellite view, Street View and Antonio's photo from above the tobacconist): the
     roundabout by Piazza Tommaso Testa; the tall palazzo on the left, by via Vitruvio; the row of Piazza Tommaso Testa
     with Zanzibar and the tobacconist, the wide pavement in front with the Fontana delle Cinque Cannelle; then the huge
     car park where the Saturday market is, the pines of the lungomare, the port with the ferries */
  { id: 'palazzo-alto', kind: 'cortina', look: 'alto', up: 6.6, w: 4, h: 4, at: [41.2575, 13.6100], door: true, tile: [142, 68] },
  { id: 'zanzibar', kind: 'cortina', look: 'bar', up: 0.7, w: 3, h: 4, at: [41.25826, 13.61033], door: true, doorAt: 2, tile: [152, 60] },
  { id: 'altieri', kind: 'cortina', look: 'tobacconist', up: 0.7, w: 3, h: 4, at: [41.25798, 13.61060], door: true, tile: [155, 60] },
  { id: 'cannelle', kind: 'cannelle', w: 2, h: 2, at: [41.25810, 13.61013], tile: [152, 64] },
  { id: 'piazza-testa', kind: 'area', fill: 'piazza', w: 8, h: 2, at: [41.2582, 13.6110], tile: [154, 64] },
  { id: 'mercato', kind: 'market', w: 3, h: 1, at: [41.2578, 13.6105], door: true, tile: [151, 68] },
  { id: 'largo-paone', kind: 'area', fill: 'parking', w: 12, h: 10, at: [41.25764, 13.61074], tile: [150, 69] },
  /* via Tullia and via Abate Tosti: Telaro on the corner, then the bar, the barber and Forchetta's home toward the
     tower; across the lane Morgana and the fishmonger, their fronts on the Pinetina, its pines and its cars */
  { id: 'telaro', kind: 'cortina', look: 'winebar', up: 0.55, w: 2, h: 5, at: [41.25825, 13.61203], door: true, tile: [163, 60] },
  { id: 'barber-may', kind: 'cortina', look: 'barber', up: 0.55, w: 2, h: 5, at: [41.2590165, 13.6134919], door: true, tile: [167, 60] },
  { id: 'pinetina', kind: 'area', fill: 'pinetina', w: 16, h: 10, at: [41.2582, 13.6126], tile: [162, 70] },
  /* Piazza Risorgimento, where Via Ferrucci leaves for the hospital and the mountains */
  { id: 'risorgimento', kind: 'area', fill: 'piazza', w: 7, h: 3, at: [41.26052, 13.61599], tile: [174, 56] },
  /* the Dono Svizzero: via Ferrucci climbs along its left side */
  { id: 'ospedale', kind: 'hospital', w: 6, h: 4, at: [41.26181, 13.61810], door: true, tile: [183, 47] },
  /* Piazza Mattej, at the foot of Castellone */
  { id: 'mattej', kind: 'area', fill: 'piazza', w: 6, h: 4, at: [41.25348, 13.60090], tile: [96, 86] },
  /* the gate of the park of Gianola, where the road ends */
  { id: 'ingresso-gianola', kind: 'area', fill: 'piazza', w: 3, h: 3, at: [41.2511, 13.6725], tile: [295, 95] },
  /* more of the town that is there (OpenStreetMap): the park of Rio Fresco, the castle-shaped villa on the hill of Santa
     Maria la Noce, the villa of Caposele */
  { id: 'parco-rodari', kind: 'area', fill: 'garden', w: 5, h: 3, at: [41.2643, 13.6243], tile: [195, 32] },
  { id: 'castello-miramare', kind: 'villa', w: 4, h: 3, at: [41.2597, 13.5992], door: true, tile: [104, 43] },
  { id: 'villa-rubino', kind: 'villa', w: 4, h: 3, at: [41.2522, 13.5970], door: true, tile: [70, 88] },
  /* the lighthouse at the end of the mole */
  { id: 'faro', kind: 'lighthouse', w: 1, h: 1, at: [41.2538, 13.6126], tile: [152, 87] },
  /* the Zauli: the stand on the home straight, the clay courts */
  { id: 'tribuna', kind: 'grandstand', w: 2, h: 5, at: [41.26302, 13.62784], tile: [207, 37] },
  { id: 'zauli-tennis', kind: 'area', fill: 'court', w: 6, h: 3, at: [41.26236, 13.63013], tile: [219, 38] },
  /* up the mountain: the hermitage of San Michele Arcangelo, set in the rock (the climb is squeezed: it is a walk of hours) */
  { id: 'san-michele', kind: 'hermitage', w: 4, h: 2, at: [41.30694, 13.63556], door: true, tile: [134, 2] },
  /* Maranola: the Caetani tower on its square */
  { id: 'torre-maranola', kind: 'tower', w: 2, h: 3, at: [41.2850, 13.6280], tile: [167, 11] },
  { id: 'stazione-scauri', kind: 'station', w: 6, h: 3, at: [41.25785, 13.72077], door: true },
  { id: 'casa-zendavid', kind: 'house', w: 3, h: 2, at: [41.2588, 13.7180], door: true }
];

export const SPOTS: SpotSpec[] = [
  /* home */
  /* the revision of 11 November 2026 */
  { id: 'vista-rotabile', tile: [200, 18] }, { id: 'selv-monti-3', tile: [190, 19] }, { id: 'selv-ulivi-3', tile: [161, 33] },
  { id: 'mamma-rodari', near: { place: 'parco-rodari', dx: 2, dy: 3 } },
  { id: 'postino', tile: [102, 55] }, { id: 'selv-ulivi-4', tile: [106, 51] },
  { id: 'pescatore-canna', tile: [198, 51] }, { id: 'ragazza-scogli', tile: [218, 50] },
  { id: 'selv-macchia-2', tile: [254, 55] }, { id: 'bagnante-santojanni', tile: [264, 62] },
  { id: 'selv-ulivi-5', tile: [306, 54] }, { id: 'contadina', tile: [314, 53] },
  { id: 'selv-ulivi-6', tile: [56, 82] }, { id: 'pensionato', tile: [68, 83] }, { id: 'pittore', tile: [54, 91] },
  { id: 'pescatore-molo', tile: [144, 88] }, { id: 'sign-molo', tile: [146, 82] },
  { id: 'sign-ingresso-gianola', tile: [294, 94] }, { id: 'selv-macchia-3', tile: [294, 80] },
  { id: 'sign-sassolini', tile: [318, 94] }, { id: 'sign-scauri-nome', tile: [336, 74] }, { id: 'bagnina-scauri', tile: [339, 90] },
  { id: 'selv-scogli-scauri', tile: [336, 100], on: 'sand' }, { id: 'pescatore-scauri', tile: [346, 110], on: 'sand' }, { id: 'selv-macchia-4', tile: [324, 76] },
  { id: 'signora-vindicio', tile: [34, 112] }, { id: 'selv-ulivi-7', tile: [296, 68] },
  { id: 'sign-largo-paone', near: { place: 'largo-paone', dx: -1, dy: 1 } },
  { id: 'vecchio-paone', near: { place: 'largo-paone', dx: 4, dy: 2 } },
  { id: 'sign-risorgimento', near: { place: 'risorgimento', dx: -1, dy: 1 } },
  { id: 'infermiere', near: { place: 'ospedale', dx: 2, dy: 4 } },
  { id: 'sign-maranola', near: { place: 'torre-maranola', dx: -3, dy: 4 } },
  { id: 'maranolese', near: { place: 'torre-maranola', dx: 3, dy: 4 } },
  { id: 'sign-mattej', near: { place: 'mattej', dx: 6, dy: 1 } },
  { id: 'sign-rotabile', tile: [182, 31] },
  { id: 'pellegrino', near: { place: 'san-michele', dx: 4, dy: 2 } },
  { id: 'allenatore', near: { place: 'tribuna', dx: 0, dy: 6 } },
  { id: 'start', near: { place: 'casa', dx: 2, dy: 4 }, walk: true },
  { id: 'start-valentin', near: { place: 'casa-valentin', dx: 2, dy: 3 }, walk: true },
  { id: 'start-costanzo', near: { place: 'casa-costanzo', dx: 1, dy: 2 }, walk: true },
  { id: 'start-forchetta', near: { place: 'casa-forchetta', dx: 0, dy: 5 }, walk: true },
  { id: 'start-claudia', near: { place: 'casa-claudia', dx: 2, dy: 4 }, walk: true },
  { id: 'start-andrea', near: { place: 'casa-andrea', dx: 1, dy: 3 }, walk: true },
  { id: 'start-zendavid', near: { place: 'casa-zendavid', dx: 1, dy: 2 }, walk: true },
  /* the scooter, before its first ride: by the home of whoever is played (story/maps.ts, moto) */
  { id: 'motorino', near: { place: 'casa', dx: -3, dy: 5 } },
  { id: 'motorino-valentin', near: { place: 'casa-valentin', dx: 4, dy: 3 } },
  { id: 'motorino-costanzo', near: { place: 'casa-costanzo', dx: 5, dy: 3 } },
  /* not in the lane: at its mouth, on the paving by Largo Paone */
  { id: 'motorino-forchetta', tile: [170, 68] },
  { id: 'motorino-claudia', near: { place: 'casa-claudia', dx: 5, dy: 5 } },
  { id: 'motorino-andrea', near: { place: 'casa-andrea', dx: 3, dy: 3 } },
  { id: 'motorino-zendavid', near: { place: 'casa-zendavid', dx: 3, dy: 2 } },
  { id: 'sign-casa', near: { place: 'casa', dx: -2, dy: 3 } },
  /* the friends and the townsfolk */
  /* the crowd in front of Costanzo's palace; Costanzo himself, out of it once beaten */
  { id: 'costanzo', near: { place: 'piazza', dx: 8, dy: 5 } },
  { id: 'folla1', near: { place: 'piazza', dx: 1, dy: 4 } }, { id: 'folla2', near: { place: 'piazza', dx: 6, dy: 4 } },
  { id: 'folla3', near: { place: 'piazza', dx: 8, dy: 4 } }, { id: 'folla4', near: { place: 'piazza', dx: 0, dy: 3 } },
  /* Nicola Spadea, windsurf champion, by his boards on the shore; the bar of the lido gives out the sunbeds */
  { id: 'nicola', near: { place: 'eclipse-spiaggia', dx: 2, dy: 5 }, on: 'sand' },
  /* Nicola's Delfaro, in the water in front of the Eclipse, and where the windsurf is put in the sea at the start */
  /* the start of the story at the water's edge in front of the Eclipse (14 November 2026: down to the very edge of the
     water, so that Faro is seen beside the player and not behind the dialog; the windsurfs go in from there).
     build.ts checks that the riva has the sea right below it */
  { id: 'faro-nicola', tile: [51, 117], on: 'sea' },
  { id: 'riva-eclipse', tile: [50, 116], on: 'sand' },
  { id: 'tavola-vecchia', tile: [54, 118], on: 'sea' },
  { id: 'start-windsurf', tile: [49, 117], on: 'sea' },
  /* the bagnino of the Lido Oriente, on the sand in front of it, by the canoes */
  { id: 'bagnino-oriente', near: { place: 'oriente', dx: 0, dy: -1 }, on: 'sand' },
  { id: 'barista', near: { place: 'eclipse', dx: 7, dy: 1 }, on: 'any' },
  { id: 'valentin', near: { place: 'eclipse-spiaggia', dx: 9, dy: 4 }, on: 'sand' },
  { id: 'zendavid', near: { place: 'pineta', dx: -3, dy: 1 } },
  { id: 'andrea', near: { place: 'zauli', dx: 7, dy: 2 } },
  /* Antonio, out of his covo once beaten: at the door of the Palamendola, next to his home */
  { id: 'antonio-covo', near: { place: 'palamendola', dx: 4, dy: 2 } },
  /* the guards of Parco la Fontana while Antonio is still to be beaten: his robots on the walks to the covo */
  { id: 'robot-parco-1', tile: [250, 42] }, { id: 'robot-parco-2', tile: [260, 44] },
  /* who sends the player to Costanzo's palace and to Zendavid's temple */
  { id: 'vigile', near: { place: 'piazza', dx: -2, dy: 2 } },
  { id: 'vicino-pineta', near: { place: 'pineta', dx: 3, dy: -4 } },
  { id: 'forchetta-eclipse', near: { place: 'eclipse-spiaggia', dx: 4, dy: 5 }, on: 'sand' },
  { id: 'vicina', near: { place: 'casa', dx: -1, dy: 3 } },
  /* the back door of Antonio's flat, on the walk of Parco la Fontana: the only way into the closed park */
  { id: 'porta-parco', tile: [249, 39], walk: true },
  { id: 'capotreno', near: { place: 'stazione', dx: 9, dy: 2 } },
  { id: 'turista', near: { place: 'tomba', dx: 4, dy: 2 } },
  { id: 'anziano', near: { place: 'torre-castellone', dx: -2, dy: 2 } },
  { id: 'fornaia', near: { place: 'forno', dx: 1, dy: 4 } },
  { id: 'tifoso', near: { place: 'ancora-piazzetta', dx: 2, dy: 4 } },
  { id: 'gelataio', near: { place: 'gelati', dx: 1, dy: 3 } },
  { id: 'marinaio', near: { place: 'biglietti', dx: 3, dy: 1 } },
  { id: 'velocista', near: { place: 'pista', dx: 6, dy: 2 } },
  { id: 'tennista', near: { place: 'tennis', dx: 5, dy: 3 } },
  { id: 'cestista', near: { place: 'palamendola', dx: 1, dy: 2 } },
  { id: 'bagnino', near: { place: 'eclipse-spiaggia', dx: 9, dy: 0 }, on: 'sand' },
  { id: 'bambino', near: { place: 'eclipse-spiaggia', dx: 6, dy: 5 }, on: 'sand' },
  { id: 'guardaparco', near: { place: 'mamurra', dx: 3, dy: 1 } },
  /* the net seller, by the park: the first creature comes from the guardaparco, the nets from him */
  { id: 'retaio', near: { place: 'mamurra', dx: 1, dy: 1 } },
  { id: 'pescatore', tile: [176, 82] },
  /* signs */
  { id: 'sign-stazione', near: { place: 'stazione', dx: -2, dy: 3 } },
  { id: 'sign-comune', near: { place: 'comune', dx: 9, dy: 2 } },
  { id: 'sign-piazza', near: { place: 'piazza', dx: -1, dy: 5 } },
  { id: 'sign-erasmo', near: { place: 'erasmo', dx: 1, dy: 4 } },
  { id: 'sign-castellone', near: { place: 'torre-castellone', dx: -3, dy: 1 } },
  { id: 'sign-cisternone', near: { place: 'cisternone', dx: -1, dy: 1 } },   /* 41.25569, 13.60104: the way out comes up below it */
  { id: 'sign-mola', near: { place: 'ancora-piazzetta', dx: 0, dy: 5 } },
  /* at the mouth of the lane, on the side of Largo Paone */
  { id: 'sign-morgana', tile: [162, 70] },
  /* on the quay, at the mouth of the little harbour under the tower */
  { id: 'sign-darsena', tile: [178, 84] },
  { id: 'sign-porto', near: { place: 'biglietti', dx: -1, dy: 2 } },
  { id: 'sign-tomba', near: { place: 'tomba', dx: -1, dy: 3 } },
  { id: 'sign-vindicio', near: { place: 'eclipse-spiaggia', dx: -1, dy: 0 }, on: 'any' },
  { id: 'sign-pineta', near: { place: 'pineta', dx: 11, dy: -5 } },
  { id: 'sign-zauli', near: { place: 'zauli', dx: -1, dy: 3 } },
  { id: 'sign-gianola', near: { place: 'mamurra', dx: -2, dy: 2 } },
  { id: 'sign-caposele', tile: [84, 96] },
  { id: 'vista-pineta-mare', tile: [72, 102] },
  { id: 'indicazioni-vindicio', tile: [34, 104] },
  { id: 'sign-porticciolo', tile: [278, 98] },
  /* out at sea (reached swimming with a sea creature, or on Nicola's board): buoys to read, bottles adrift with a message,
     people of the sea who challenge Antonio */
  { id: 'boa-300', tile: [90, 104], on: 'sea' },
  { id: 'boa-secche', tile: [226, 74], on: 'sea' },
  { id: 'boa-golfo', tile: [180, 116], on: 'sea' },
  { id: 'bottiglia-1', tile: [114, 114], on: 'sea' },
  { id: 'bottiglia-2', tile: [164, 104], on: 'sea' },
  { id: 'bottiglia-3', tile: [206, 92], on: 'sea' },
  { id: 'bottiglia-4', tile: [242, 84], on: 'sea' },
  { id: 'bottiglia-5', tile: [266, 108], on: 'sea' },
  { id: 'bottiglia-6', tile: [150, 124], on: 'sea' },
  { id: 'mare-sup', tile: [142, 100], on: 'sea' },
  { id: 'mare-sub', tile: [218, 82], on: 'sea' },
  { id: 'mare-gozzo', tile: [252, 98], on: 'sea' },
  /* Castellone: who lives inside the Roman theatre, a devotee of Sant'Erasmo; in the centre, the guide of the museum */
  { id: 'teatro', near: { place: 'teatro-romano', dx: 4, dy: 3 } },
  { id: 'devota', near: { place: 'erasmo', dx: 3, dy: 4 } },
  { id: 'signora-porta', near: { place: 'piazza-porta', dx: 1, dy: 1 } },
  { id: 'ragazzo-mamurra', near: { place: 'piazza-castello', dx: 2, dy: 2 } },
  { id: 'cameriere', near: { place: 'piazza-castello', dx: 0, dy: 0 } },
  { id: 'studentessa', near: { place: 'marconi', dx: 3, dy: 5 } },
  { id: 'tassista', near: { place: 'iv-novembre', dx: 14, dy: 1 } },
  { id: 'negoziante', near: { place: 'mattej', dx: 7, dy: -2 } },
  { id: 'pescatore-viale', near: { place: 'piazza', dx: 4, dy: 9 } },
  { id: 'signore-noce', tile: [93, 50] },
  { id: 'ciclista-santantonio', tile: [152, 42] },
  { id: 'sign-noce', tile: [97, 45] },
  { id: 'sign-teatro', near: { place: 'teatro-romano', dx: 1, dy: 3 } },
  { id: 'guida', near: { place: 'comune', dx: 3, dy: 4 } },
  /* street-name plates at the corners of the real streets the map's streets stand for */
  { id: 'targa-vitruvio', near: { place: 'piazza', dx: 2, dy: 0 } },
  { id: 'targa-abate-tosti', tile: [161, 64] },
  { id: 'targa-canzatora', tile: [19, 96] },
  { id: 'targa-sem-benelli', tile: [38, 95] },
  { id: 'targa-acervara', tile: [43, 85] },
  { id: 'targa-appia', tile: [30, 91] },   /* on the upper side of the Appia: below it runs the retaining wall */
  { id: 'targa-vindicio', tile: [46, 95] },
  { id: 'targa-flacca', tile: [47, 97] },
  { id: 'confine-gaeta', tile: [25, 123] },
  { id: 'ingresso-irlanda', tile: [23, 128] },
  { id: 'fermata-irlanda', tile: [23, 132] },
  { id: 'passeggiatrice-arcella', tile: [18, 138] },
  { id: 'pescatore-arcella', tile: [21, 145], on: 'sand' },
  { id: 'targa-caboto', tile: [15, 148] },
  { id: 'targa-tito-scipione', near: { place: 'frungillo', dx: -2, dy: -2 } },
  { id: 'targa-amendola', near: { place: 'casa', dx: -3, dy: 2 } },
  /* on the Appia, across from the gate of Parco la Fontana (the park itself is closed) */
  { id: 'targa-appia-napoli', tile: [249, 48] },
  { id: 'targa-gianola', near: { place: 'oriente', dx: 6, dy: -10 }, on: 'any' },
  /* the Villaggio Don Bosco, the school and the church of Mola, Lavezzi */
  { id: 'sign-donbosco', near: { place: 'donbosco', dx: -2, dy: 2 } },
  { id: 'animatore', near: { place: 'campo-amendola', dx: 3, dy: 1 } },
  { id: 'sign-sangiovanni', near: { place: 'piazza-sangiovanni', dx: 1, dy: 1 } },
  { id: 'studente', near: { place: 'piazza-sangiovanni', dx: 1, dy: 3 } },
  { id: 'targa-sgb', near: { place: 'donbosco', dx: -2, dy: 0 } },
  /* the plates of the friends' streets: the name of the street on a plate at the corner, «Casa di …» on the house */
  { id: 'targa-palazzo', tile: [196, 35] },
  { id: 'targa-ferrucci', near: { place: 'casa-valentin', dx: 3, dy: -1 } },
  { id: 'targa-solaro', near: { place: 'casa-costanzo', dx: -1, dy: 3 } },
  { id: 'targa-mattei', near: { place: 'casa-andrea', dx: -1, dy: 2 } },
  /* Antonio's lost things */
  { id: 'caricabatterie', near: { place: 'stazione', dx: 6, dy: 4 } },
  { id: 'appunti', near: { place: 'erasmo', dx: 3, dy: 3 } },
  { id: 'passaporto', near: { place: 'tomba', dx: 1, dy: 4 } },
  { id: 'portafoglio', near: { place: 'eclipse-spiaggia', dx: 10, dy: 2 }, on: 'sand' },
  /* where the wild creatures of Formia live (the hiding places of HIDING): the easy ones near home, the strong ones
     up in the Aurunci */
  { id: 'selv-gramsci', near: { place: 'parco-gramsci', dx: 2, dy: 1 } },
  { id: 'selv-gianola-1', tile: [289, 92], on: 'sand' },
  { id: 'selv-gianola-2', tile: [291, 102], on: 'sand' },
  { id: 'selv-pineta-1', tile: [65, 99] },
  { id: 'selv-pineta-3', tile: [71, 102] }, { id: 'selv-pineta-4', tile: [78, 96] },
  /* more tall grass (13 November 2026): in the green between the streets, where the map had none */
  { id: 'selv-erba-stazione', tile: [118, 43] }, { id: 'selv-erba-appia', tile: [206, 50] }, { id: 'selv-erba-acqualonga', tile: [242, 55] },
  { id: 'selv-erba-colle', tile: [60, 86] }, { id: 'selv-erba-janni', tile: [280, 58] }, { id: 'selv-erba-scauri', tile: [336, 70] },
  { id: 'selv-erba-rotabile', tile: [190, 26] },
  { id: 'selv-scogli-1', near: { place: 'scogliera', dx: -2, dy: 3 }, on: 'sand' },
  { id: 'selv-scogli-2', near: { place: 'scogliera', dx: 5, dy: 4 }, on: 'sand' },
  { id: 'selv-ulivi-1', tile: [8, 75] },
  { id: 'selv-ulivi-2', tile: [18, 88] },
  /* up on the first terrace of the Aurunci, east of the mule track */
  { id: 'selv-monti-1', tile: [154, 10] },
  { id: 'selv-monti-2', tile: [118, 10] },
  /* the scrub of the promontory of Gianola, between the terraces of the villa; a third patch of rock pools in the cove */
  { id: 'selv-macchia', tile: [310, 106] },
  { id: 'selv-gianola-3', tile: [316, 105], on: 'sand' },
  /* the three trails of the relief (VISIONE.md, V3 and V4): their signs, their belvederi, who walks them */
  { id: 'sign-statua', tile: [158, 17] },
  { id: 'tr-pastore', tile: [144, 9] },
  { id: 'sign-eremo', tile: [132, 4] },
  { id: 'tr-escursionista', tile: [144, 4] },
  { id: 'vista-redentore', tile: [149, 5] },
  { id: 'sign-fontana', tile: [22, 83] },
  { id: 'tr-ciclista', tile: [36, 91] },
  { id: 'tr-contadino', tile: [14, 75] },
  { id: 'sign-tulliola', tile: [8, 74] },
  { id: 'vista-acervara', tile: [3, 77] },
  { id: 'tr-archeologa', tile: [305, 103] },
  { id: 'sign-cisterna', tile: [310, 102] },
  { id: 'sign-janara', tile: [307, 109] },
  { id: 'tr-polparo', tile: [310, 116] },
  { id: 'vista-gianola', tile: [308, 122] },
  /* along the roads that were only roads: who lives there, where they lead, a first easy challenge */
  { id: 'nonna-penitro', tile: [173, 12] },
  { id: 'ragazzo-salti', tile: [173, 17] },
  { id: 'corridore', tile: [138, 55] },
  { id: 'sign-bivio-gianola', tile: [275, 45] },
  { id: 'giardiniere', tile: [260, 54] },
  { id: 'tr-bagnante', tile: [278, 57] },
  { id: 'sign-scauri', tile: [304, 37] },
  { id: 'pendolare', tile: [320, 61] },
  /* Lamo, king of the giants, under the polygonal walls of Castellone */
  { id: 'selv-lamo', tile: [96, 65] },
  /* the other legends: Janus by the ruins of Gianola, the fire of Sant'Elmo on the mole by the lighthouse */
  { id: 'selv-giano', tile: [301, 101] },
  { id: 'selv-elmo', tile: [151, 86] },
  /* the plot (story/plot.ts): Mamurra's men where the stones of Telepilo are, the archivist in the Torre di Mola,
     the ghost of Mamurra at his villa */
  { id: 'mamurr-scavi', near: { place: 'mamurra', dx: -1, dy: 3 } },
  { id: 'archivista', near: { place: 'ancora-piazzetta', dx: 2, dy: 0 } },
  { id: 'mamurr-cisterna', near: { place: 'cisternone', dx: 1, dy: 2 } },
  { id: 'mamurr-peschiere', at: [41.2510, 13.5981] },
  { id: 'mamurra', near: { place: 'mamurra', dx: 0, dy: 3 } },
  /* Tullio, the rival: by his grandfather at the park, and on the Appia, on the way to Cicero's tomb */
  { id: 'tullio', tile: [298, 97] },
  { id: 'tullio-appia', tile: [38, 91] }
];
/* where the wild creatures hide, out of sight (data/encounters.ts says which ones, by the id): the generator paints
   tall grass on the grass ('E') and rock pools on the sand ('A') out to about r tiles around each spot */
export const HIDING: { id: string; spot: string; r: number; on: 'grass' | 'sand' }[] = [
  { id: 'gramsci', spot: 'selv-gramsci', r: 4, on: 'grass' },
  { id: 'gianola', spot: 'selv-gianola-1', r: 3, on: 'sand' },
  { id: 'gianola', spot: 'selv-gianola-2', r: 3, on: 'sand' },
  { id: 'pineta', spot: 'selv-pineta-1', r: 5, on: 'grass' },
  /* Tall grass in the groves around the clearing and the kiosk. */
  { id: 'pineta', spot: 'selv-pineta-3', r: 5, on: 'grass' }, { id: 'pineta', spot: 'selv-pineta-4', r: 4, on: 'grass' },
  { id: 'gramsci', spot: 'selv-erba-stazione', r: 3, on: 'grass' }, { id: 'gramsci', spot: 'selv-erba-appia', r: 3, on: 'grass' },
  { id: 'gramsci', spot: 'selv-erba-acqualonga', r: 3, on: 'grass' }, { id: 'ulivi', spot: 'selv-erba-colle', r: 3, on: 'grass' },
  { id: 'ulivi', spot: 'selv-erba-janni', r: 3, on: 'grass' }, { id: 'macchia', spot: 'selv-erba-scauri', r: 3, on: 'grass' },
  { id: 'monti', spot: 'selv-erba-rotabile', r: 3, on: 'grass' },
  { id: 'scogliera', spot: 'selv-scogli-1', r: 4, on: 'sand' },
  { id: 'scogliera', spot: 'selv-scogli-2', r: 3, on: 'sand' },
  { id: 'ulivi', spot: 'selv-ulivi-1', r: 4, on: 'grass' },
  { id: 'ulivi', spot: 'selv-ulivi-2', r: 3, on: 'grass' },
  { id: 'monti', spot: 'selv-monti-1', r: 4, on: 'grass' },
  { id: 'monti', spot: 'selv-monti-2', r: 4, on: 'grass' },
  { id: 'macchia', spot: 'selv-macchia', r: 3, on: 'grass' },
  { id: 'gianola', spot: 'selv-gianola-3', r: 3, on: 'sand' },
  /* the big Formia: more of the same kinds of places, where the map has room for them */
  { id: 'monti', spot: 'selv-monti-3', r: 3, on: 'grass' },
  { id: 'ulivi', spot: 'selv-ulivi-3', r: 3, on: 'grass' }, { id: 'ulivi', spot: 'selv-ulivi-4', r: 3, on: 'grass' },
  { id: 'ulivi', spot: 'selv-ulivi-5', r: 3, on: 'grass' }, { id: 'ulivi', spot: 'selv-ulivi-7', r: 3, on: 'grass' }, { id: 'ulivi', spot: 'selv-ulivi-6', r: 3, on: 'grass' },
  { id: 'scogliera', spot: 'selv-scogli-scauri', r: 3, on: 'sand' },
  { id: 'macchia', spot: 'selv-macchia-2', r: 3, on: 'grass' }, { id: 'macchia', spot: 'selv-macchia-3', r: 3, on: 'grass' }, { id: 'macchia', spot: 'selv-macchia-4', r: 3, on: 'grass' }
];
