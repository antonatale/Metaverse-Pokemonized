import { GULF_COAST } from './panorama-coast';

/* The land around the gulf of Gaeta, coarsely, for the panoramas of the belvederi (render/canvas/panorama.ts): what
   one sees from them is computed from it, in perspective, the way it really lies. The coast of the gulf, from the tip
   of Gaeta to the Garigliano, is OpenStreetMap's (panorama-coast.ts); the rest of the coast, the islands and the
   heights are drawn by hand from the geography of the area (positions to a few hundred metres, heights of the
   summits as they are known, the shapes in between smooth). [lat, lon]; heights in metres; sizes in km. */
export type LL = [number, number];

/* ---------- the mainland: one ring ---------- */
/** from the tip of Gaeta round Monte Orlando, Serapo, Sperlonga, the plain of Fondi and Terracina to the Circeo */
const WEST: LL[] = [
  [41.2055, 13.5820], [41.2030, 13.5775], [41.2018, 13.5715], [41.2032, 13.5655], [41.2075, 13.5625], [41.2120, 13.5598],
  [41.2180, 13.5540], [41.2240, 13.5420], [41.2300, 13.5250], [41.2350, 13.5050], [41.2430, 13.4800], [41.2520, 13.4550],
  [41.2590, 13.4330], [41.2650, 13.4100], [41.2800, 13.3700], [41.2900, 13.3300], [41.2850, 13.2500], [41.2600, 13.1500],
  [41.2380, 13.0900], [41.2260, 13.0650], [41.2300, 13.0350], [41.2550, 13.0150], [41.3000, 12.9600], [41.4000, 12.8600]
];
/** past the Garigliano: the beaches to Mondragone and the Volturno, Campi Flegrei, Naples, the Sorrento peninsula */
const EAST: LL[] = [
  [41.2050, 13.7850], [41.1750, 13.8150], [41.1350, 13.8650], [41.1050, 13.8950], [41.0500, 13.9300], [40.9800, 13.9700],
  [40.9300, 14.0100], [40.8700, 14.0300], [40.8000, 14.0600], [40.7800, 14.0900], [40.8200, 14.1700], [40.8350, 14.2400],
  [40.7900, 14.3400], [40.7450, 14.4400], [40.6800, 14.4800], [40.6350, 14.3800], [40.5950, 14.3300], [40.5700, 14.3200],
  [40.5600, 14.5000], [40.4000, 14.7000]
];
/** the inland edge, far beyond what is seen */
const INLAND: LL[] = [[40.4000, 14.9000], [41.9000, 14.9000], [41.9000, 12.8000], [41.4000, 12.8000]];
export const MAINLAND: LL[] = WEST.slice().reverse().concat(GULF_COAST, EAST, INLAND);

/** the islands: ellipses (centre, half-length and half-width in km, the angle of the long side from north) */
export interface Isle { name: string; at: LL; a: number; b: number; rot: number }
export const ISLES: Isle[] = [
  { name: 'Ponza', at: [40.8960, 12.9620], a: 4.2, b: 0.9, rot: 20 },
  { name: 'Palmarola', at: [40.9370, 12.8580], a: 1.6, b: 0.6, rot: 10 },
  { name: 'Zannone', at: [40.9700, 13.0550], a: 0.8, b: 0.6, rot: 0 },
  { name: 'Ventotene', at: [40.7970, 13.4280], a: 1.5, b: 0.45, rot: 60 },
  { name: 'Santo Stefano', at: [40.7870, 13.4560], a: 0.35, b: 0.3, rot: 0 },
  { name: 'Ischia', at: [40.7300, 13.9050], a: 4.6, b: 3.2, rot: 80 },
  { name: 'Procida', at: [40.7620, 14.0200], a: 1.5, b: 0.9, rot: 60 },
  { name: 'Capri', at: [40.5500, 14.2300], a: 3.0, b: 1.3, rot: 75 }
];

/* ---------- the heights: each a smooth cone, `r` the radius of its foot in km; the land is as high as the highest
   cone where it stands, and comes down to the sea along the shore ---------- */
export interface Height { at: LL; h: number; r: number }
export const HEIGHTS: Height[] = [
  /* the Aurunci behind Formia: the massif, the Redentore, Altino, Petrella, Ruazzo, the mountain toward Itri */
  { at: [41.3200, 13.6100], h: 800, r: 7 }, { at: [41.2970, 13.6125], h: 1252, r: 5 }, { at: [41.3050, 13.6480], h: 1373, r: 5.5 },
  { at: [41.3200, 13.6720], h: 1533, r: 6.5 }, { at: [41.3150, 13.5700], h: 1314, r: 5.5 }, { at: [41.3000, 13.5300], h: 900, r: 4.5 },
  /* the slopes over the town: Maranola on its spur, the hill above Mola, the hills over Castellone and Vindicio */
  { at: [41.2875, 13.6360], h: 260, r: 1.6 }, { at: [41.2740, 13.6180], h: 230, r: 1.8 }, { at: [41.2760, 13.5950], h: 330, r: 2.4 },
  { at: [41.2620, 13.5920], h: 70, r: 0.8 }, { at: [41.2830, 13.6700], h: 230, r: 2.0 }, { at: [41.2650, 13.5650], h: 260, r: 2.2 },
  /* toward Itri and Gaeta: Monte Campese, Monte Moneta, Monte Conca; Monte Orlando at the tip */
  { at: [41.2900, 13.5000], h: 520, r: 4.5 }, { at: [41.2320, 13.5300], h: 330, r: 2.4 }, { at: [41.2280, 13.5520], h: 300, r: 1.9 },
  { at: [41.2055, 13.5735], h: 171, r: 1.0 },
  /* Gianola and the Monte di Scauri, Minturno on its hill */
  { at: [41.2490, 13.6720], h: 55, r: 0.8 }, { at: [41.2545, 13.6920], h: 123, r: 1.3 }, { at: [41.2650, 13.7450], h: 230, r: 3 },
  /* further off: the Ausoni over Fondi, the Circeo, Roccamonfina, Monte Massico, the mountains of Campania */
  { at: [41.3700, 13.3800], h: 900, r: 12 }, { at: [41.2370, 13.0650], h: 541, r: 3 }, { at: [41.2900, 13.9800], h: 1005, r: 9 },
  { at: [41.1800, 13.9300], h: 813, r: 7 }, { at: [41.2400, 14.1500], h: 1000, r: 12 }, { at: [40.8300, 14.1500], h: 300, r: 5 },
  /* the Vesuvius and the Somma, the Lattari of the Sorrento peninsula */
  { at: [40.8215, 14.4265], h: 1281, r: 4 }, { at: [40.8350, 14.4400], h: 1132, r: 4.6 }, { at: [40.6600, 14.5000], h: 1400, r: 10 },
  /* the islands: Ponza, Palmarola, Zannone, Ventotene, Santo Stefano, Ischia with the Epomeo, Procida, Capri */
  { at: [40.8960, 12.9620], h: 280, r: 2.4 }, { at: [40.9370, 12.8580], h: 250, r: 1.4 }, { at: [40.9700, 13.0550], h: 190, r: 0.9 },
  { at: [40.7970, 13.4280], h: 140, r: 1.4 }, { at: [40.7870, 13.4560], h: 70, r: 0.5 },
  { at: [40.7310, 13.9020], h: 789, r: 4 }, { at: [40.7620, 14.0200], h: 90, r: 1.6 }, { at: [40.5550, 14.2250], h: 589, r: 2.4 }
];

/* ---------- where the towns are: circles of houses (centre, radius in km, how thick) ---------- */
export interface Town { at: LL; r: number; k: number }
export const TOWNS: Town[] = [
  /* Formia along its shore: Vindicio, Castellone, the centre, Mola, Rio Fresco and via Amendola, Santo Janni */
  { at: [41.2490, 13.5880], r: 0.45, k: 0.6 }, { at: [41.2560, 13.5990], r: 0.45, k: 0.9 }, { at: [41.2565, 13.6070], r: 0.55, k: 1 },
  { at: [41.2595, 13.6140], r: 0.5, k: 1 }, { at: [41.2620, 13.6240], r: 0.55, k: 0.8 }, { at: [41.2630, 13.6380], r: 0.55, k: 0.75 },
  { at: [41.2610, 13.6510], r: 0.45, k: 0.55 }, { at: [41.2575, 13.6610], r: 0.45, k: 0.45 },
  /* Gaeta: the old town on Monte Orlando, the town along the bay, Serapo */
  { at: [41.2085, 13.5810], r: 0.4, k: 1 }, { at: [41.2170, 13.5700], r: 0.6, k: 0.9 }, { at: [41.2270, 13.5640], r: 0.5, k: 0.7 },
  { at: [41.2160, 13.5570], r: 0.35, k: 0.7 },
  /* Scauri, Marina di Minturno, Minturno on its hill, Maranola and Castellonorato, Itri, Sperlonga */
  { at: [41.2560, 13.7050], r: 0.6, k: 0.75 }, { at: [41.2460, 13.7300], r: 0.6, k: 0.7 }, { at: [41.2630, 13.7460], r: 0.35, k: 0.9 },
  { at: [41.2875, 13.6360], r: 0.22, k: 1 }, { at: [41.2820, 13.6680], r: 0.22, k: 0.9 }, { at: [41.2870, 13.5320], r: 0.45, k: 0.8 },
  { at: [41.2590, 13.4330], r: 0.3, k: 0.9 },
  /* far: Mondragone, Ischia Porto, Ponza, Pozzuoli and Naples */
  { at: [41.1150, 13.8850], r: 1.2, k: 0.6 }, { at: [40.7420, 13.9400], r: 0.8, k: 0.7 }, { at: [40.8960, 12.9680], r: 0.3, k: 0.7 },
  { at: [40.8300, 14.2000], r: 3, k: 0.6 }
];

/* ---------- the things one recognises ---------- */
export interface Mark { kind: 'tower' | 'octagon' | 'tomb' | 'drum' | 'bell' | 'castle' | 'church' | 'statue'; at: LL; h: number }
export const MARKS: Mark[] = [
  { kind: 'tower', at: [41.2589, 13.6140], h: 27 },      /* the Torre di Mola */
  { kind: 'octagon', at: [41.2563, 13.5999], h: 25 },    /* the Torre di Castellone */
  { kind: 'tomb', at: [41.2516, 13.5787], h: 24 },       /* the Tomba di Cicerone */
  { kind: 'drum', at: [41.2047, 13.5725], h: 14 },       /* the mausoleum of Munazio Planco on Monte Orlando */
  { kind: 'bell', at: [41.2079, 13.5840], h: 57 },       /* the bell tower of the cathedral of Gaeta */
  { kind: 'castle', at: [41.2098, 13.5788], h: 30 },     /* the castle of Gaeta */
  { kind: 'church', at: [41.2035, 13.5655], h: 18 },     /* the sanctuary of the Montagna Spaccata */
  { kind: 'bell', at: [41.2875, 13.6360], h: 30 }        /* Maranola */
];

/* ---------- the names, where they are (and how high over the ground the line points) ---------- */
export interface Name { text: string; at: LL; up: number }
export const NAMES: Name[] = [
  { text: 'Gaeta', at: [41.2120, 13.5740], up: 60 }, { text: 'Monte Orlando', at: [41.2055, 13.5735], up: 40 },
  { text: 'Montagna Spaccata', at: [41.2035, 13.5660], up: 10 }, { text: 'Serapo', at: [41.2160, 13.5570], up: 10 },
  { text: 'Vindicio', at: [41.2480, 13.5870], up: 5 }, { text: 'Tomba di Cicerone', at: [41.2516, 13.5787], up: 30 },
  { text: 'Castellone', at: [41.2563, 13.5999], up: 30 }, { text: 'Formia', at: [41.2565, 13.6070], up: 25 },
  { text: 'Torre di Mola', at: [41.2589, 13.6140], up: 30 }, { text: 'Gianola', at: [41.2490, 13.6720], up: 40 },
  { text: 'Scauri', at: [41.2560, 13.7050], up: 15 }, { text: 'Minturno', at: [41.2630, 13.7460], up: 30 },
  { text: 'Maranola', at: [41.2875, 13.6360], up: 40 }, { text: 'Monte Redentore', at: [41.2970, 13.6125], up: 0 },
  { text: 'Monte Altino', at: [41.3050, 13.6480], up: 0 }, { text: 'Monte Petrella', at: [41.3200, 13.6720], up: 0 },
  { text: 'Itri', at: [41.2870, 13.5320], up: 20 }, { text: 'Sperlonga', at: [41.2590, 13.4330], up: 20 },
  { text: 'Monte Circeo', at: [41.2370, 13.0650], up: 0 }, { text: 'Ponza', at: [40.8960, 12.9620], up: 0 },
  { text: 'Palmarola', at: [40.9370, 12.8580], up: 0 }, { text: 'Zannone', at: [40.9700, 13.0550], up: 0 },
  { text: 'Ventotene', at: [40.7970, 13.4280], up: 0 }, { text: 'Santo Stefano', at: [40.7870, 13.4560], up: 0 },
  { text: 'Ischia', at: [40.7310, 13.9020], up: 0 }, { text: 'Procida', at: [40.7620, 14.0200], up: 0 },
  { text: 'Capri', at: [40.5550, 14.2250], up: 0 }, { text: 'Vesuvio', at: [40.8215, 14.4265], up: 0 },
  { text: 'Monte Massico', at: [41.1800, 13.9300], up: 0 }, { text: 'Roccamonfina', at: [41.2900, 13.9800], up: 0 }
];

/* ---------- the belvederi: where one stands, how high the eyes are over the ground (or the sea), which way one
   looks and how wide ---------- */
export interface Viewpoint { at: LL; eye: number; heading: number; fov: number; near?: 'rocks' | 'terrace' | 'ruins' | 'road' | 'sea' }
export const VIEWPOINTS: Record<string, Viewpoint> = {
  /* the Cima del Redentore: all the gulf, from the Circeo to the Vesuvius */
  aurunci: { at: [41.2970, 13.6125], eye: 30, heading: 182, fov: 120, near: 'rocks' },
  /* the terraces of the Acervara, by the tomb of Tulliola: the Appia, the Tomba di Cicerone, Vindicio and Gaeta */
  acervara: { at: [41.2640, 13.5640], eye: 22, heading: 160, fov: 100, near: 'terrace' },
  /* the point of Gianola, among the ruins of the villa: the whole gulf to the west */
  gianola: { at: [41.2478, 13.6700], eye: 22, heading: 280, fov: 100, near: 'ruins' },
  /* the hairpin of the Rotabile above Mola: the roofs, the tower, the port, Gaeta at the end of the gulf */
  rotabile: { at: [41.2705, 13.6225], eye: 26, heading: 222, fov: 100, near: 'road' },
  /* out in the gulf, by the buoy: Gaeta, Formia and Gianola all round */
  golfo: { at: [41.2440, 13.6180], eye: 1.6, heading: 330, fov: 190, near: 'sea' }
};
