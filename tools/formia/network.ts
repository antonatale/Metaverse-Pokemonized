/* The playable skeleton of the Formia map, drawn by hand on its tiles (320×128, see formia-projection.ts) over the
   real streets of OpenStreetMap: the railway and the streets. Each line is a list of corners and runs straight,
   along a row or a column, from one corner to the next; a 2-wide line takes the corner's row (or column) and the
   one after it. Lines meet at shared tiles, so the streets are one network and the railway is one line, in a
   tunnel under the hill of Castellone, with a level crossing wherever a street crosses it.
   Real Formia runs from south-west to north-east: here every diagonal is a flight of long steps, so the town
   climbs from Vindicio (bottom left) to Mola and Via Amendola (top right) as it does on a map.
   tools/formia/build.ts draws the lines on the real coast, then sets every place along a street, door on the street.
   The names are the real streets each line stands for (matched on their OpenStreetMap positions); the lanes of
   Castellone and of Maranola are cobbled (ch 'v', sampietrini).
   Nothing else in the generator has a coordinate in it: every zone it works by is at the bottom of this file. */
export type XY = [number, number];
export interface Line { name: string; w: 1 | 2 | 3; pts: XY[]; ch?: string }
export interface Rect { x0: number; y0: number; x1: number; y1: number }

/** Nicola's main route: one extra lane, on the landward side, with room to turn. The houses and verge decorations
    keep clear of it; the narrow streets of the old town remain footpaths for a van this size. */
export const VAN_ROADS: Line[] = [
  { name: 'Via Appia Lato Napoli', w: 3, pts: [[159, 45], [214, 45]] },
  { name: 'Via Appia Lato Napoli', w: 3, pts: [[159, 45], [159, 54]] },
  { name: 'Via Emanuele Filiberto', w: 3, pts: [[151, 53], [159, 53]] },
  { name: 'Lungomare della Repubblica', w: 3, pts: [[151, 54], [151, 80]] },
  { name: 'Lungomare della Repubblica', w: 3, pts: [[116, 79], [151, 79]] },
  { name: 'Lungomare della Repubblica', w: 3, pts: [[116, 80], [116, 84]] },
  { name: 'Viale Unità d’Italia', w: 3, pts: [[92, 83], [116, 83]] },
  { name: 'Viale Unità d’Italia', w: 3, pts: [[92, 84], [92, 92]] },
  { name: 'Viale Unità d’Italia', w: 3, pts: [[62, 91], [92, 91]] },
  { name: 'Viale Unità d’Italia', w: 3, pts: [[62, 92], [62, 103]] },
  { name: 'Via Tito Scipione', w: 3, pts: [[44, 102], [62, 102]] }
];

/** the railway Roma–Napoli, in two pieces: from the west edge into the hill, and out of it past the station, up behind
    Mola, along the foot of the Aurunci and down to Scauri */
export const RAILS: XY[][] = [
  [[0, 70], [20, 70], [20, 78], [61, 78]],
  [[84, 60], [119, 60], [119, 40], [146, 40], [146, 30], [244, 30], [244, 42], [250, 42], [250, 34], [278, 34], [278, 46], [294, 46], [294, 58], [310, 58], [310, 66], [319, 66]]
];
/** where the railway goes into a hill: a tunnel mouth is drawn on the tile above */
export const TUNNEL_ENDS: XY[] = [[61, 78], [84, 60]];
/** hills painted by hand, as rectangles of tiles: the one the railway goes under, between Vindicio and Castellone
    (Santa Maria la Noce, Monte di Mola) */
export const HILLS: Rect[] = [{ x0: 62, y0: 46, x1: 83, y1: 80 }];

export const STREETS: Line[] = [
  /* ---------- the spine, west to east ---------- */
  /* the Appia from Itri, past the Tomba di Cicerone, to the fork of Vindicio */
  { name: 'Via Appia', w: 2, pts: [[0, 84], [24, 84], [24, 92], [50, 92]] },
  /* the old road into town, up to Piazza Mattej */
  { name: 'Via Giuseppe Paone', w: 2, pts: [[50, 92], [50, 86], [84, 86]] },
  /* the main street: Piazza Mattej, the Comune and Piazza della Vittoria, up to the roundabout of Largo Paone */
  { name: 'Via Vitruvio', w: 2, pts: [[84, 86], [84, 76], [110, 76], [110, 66], [115, 66]] },
  /* the roundabout of Largo Paone, by Piazza Tommaso Testa: a ring round a flower bed (BEDS), four ways out */
  { name: 'Largo Domenico Paone', w: 1, pts: [[116, 66], [119, 66], [119, 69], [116, 69], [116, 66]] },
  /* from the roundabout down the west side of the car park to the lungomare and the port */
  { name: 'Via Vitruvio', w: 2, pts: [[116, 70], [116, 80]] },
  /* in front of the tobacconist's row, along the car park, to via Tullia and via Abate Tosti */
  { name: 'Largo Domenico Paone', w: 2, pts: [[120, 66], [131, 66]] },
  /* from the roundabout up behind the row of Piazza Tommaso Testa, then along the top of Mola: San Giovanni, the
     Vitruvio Pollione and De Amicis schools, Piazza Risorgimento, the roundabout of the Appia */
  { name: 'Via Emanuele Filiberto', w: 2, pts: [[120, 66], [120, 57], [142, 57], [142, 54], [159, 54]] },
  /* east along the bay: Rio Fresco, the Zauli, Via Amendola, Santo Janni */
  { name: 'Via Appia Lato Napoli', w: 2, pts: [[159, 54], [159, 46], [252, 46], [252, 38], [272, 38]] },
  /* and on to Scauri, the railway on its left all the way */
  { name: 'Via Appia', w: 2, pts: [[272, 38], [272, 50], [288, 50], [288, 62], [304, 62], [304, 72], [319, 72]] },

  /* ---------- the coast road ---------- */
  /* from Gaeta along Vindicio, past Caposele, to the roundabout of the port */
  { name: 'Viale Unità d\'Italia', w: 2, pts: [[26, 127], [26, 108], [44, 108], [44, 96], [62, 96], [62, 92], [92, 92], [92, 84], [110, 84]] },
  { name: 'Via Vindicio', w: 2, pts: [[44, 92], [44, 96]] },
  { name: 'Largo Aldo Moro', w: 2, pts: [[110, 76], [110, 84]] },
  /* along the port, under the pines of Largo Paone and of the Pinetina, over the mouth of the little harbour of the
     Torre di Mola, then up along the sea to Piazza Risorgimento */
  { name: 'Lungomare della Repubblica', w: 2, pts: [[110, 84], [116, 84], [116, 80], [151, 80], [151, 55]] },
  /* the lungomare of Vindicio, between the pineta and the sand */
  { name: 'Via Tito Scipione', w: 1, pts: [[46, 103], [62, 103], [62, 98]] },
  { name: 'Via Vindicio', w: 1, pts: [[28, 120], [33, 120]] },

  /* ---------- Castellone (cobbled) and the centre ---------- */
  { name: 'Via della Torre', w: 1, pts: [[86, 64], [96, 64]], ch: 'v' },
  { name: 'Via Castellone', w: 1, pts: [[86, 64], [86, 76]], ch: 'v' },
  { name: 'Largo Sant\'Erasmo', w: 1, pts: [[86, 70], [96, 70]], ch: 'v' },
  { name: 'Via XXIV Maggio', w: 1, pts: [[96, 56], [96, 76]] },
  { name: 'Piazza IV Novembre', w: 2, pts: [[96, 64], [110, 64]] },
  { name: 'Via Ferdinando Lavanga', w: 1, pts: [[97, 70], [110, 70]] },
  /* below Via Vitruvio: Piazza Mattej, Via Rubino */
  { name: 'Via Angelo Rubino', w: 1, pts: [[86, 82], [98, 82]] },
  { name: 'Via Mamurra', w: 1, pts: [[98, 78], [98, 84]] },
  /* north of the station */
  { name: 'Via Pasquale Testa', w: 1, pts: [[88, 56], [120, 56]] },
  { name: 'Via Santa Maria la Noce', w: 1, pts: [[88, 56], [88, 46], [104, 46]] },
  { name: 'Via Cassio', w: 1, pts: [[104, 56], [104, 46]] },
  { name: 'Via Sant\'Antonio', w: 1, pts: [[120, 56], [120, 36]] },
  { name: 'Via delle Fosse', w: 1, pts: [[120, 36], [150, 36]] },

  /* ---------- Mola (OpenStreetMap, the satellite view and Street View, 12 November 2026) ---------- */
  /* via Tullia, short, from via Emanuele Filiberto down to where via Abate Tosti begins: the enoteca Telaro on its corner */
  { name: 'Via Tullia', w: 1, pts: [[132, 59], [132, 65]] },
  /* the lane of the borgo, paved with basalt: from Largo Paone, between two walls of palazzi, to the square of the
     anchor under the Torre di Mola; from there a passage climbs to via Emanuele Filiberto */
  { name: 'Via Abate Tosti', w: 1, pts: [[132, 65], [140, 65]], ch: 'v' },
  { name: 'Via Abate Tosti', w: 1, pts: [[142, 59], [142, 60]], ch: 'v' },
  { name: 'Via della Conca', w: 1, pts: [[124, 46], [124, 56]] },
  /* to the right of San Giovanni the street climbs, then turns left: Via Solaro */
  { name: 'Via Solaro', w: 1, pts: [[132, 56], [132, 46], [124, 46]] },
  /* from Piazza Risorgimento up past the Dono Svizzero, on its left */
  { name: 'Via Adalgiso Ferrucci', w: 2, pts: [[151, 54], [151, 36]] },

  /* ---------- up to Maranola: two hairpins ---------- */
  { name: 'Via Rotabile', w: 2, pts: [[151, 36], [151, 23], [168, 23], [168, 15], [142, 15]] },

  /* ---------- Rio Fresco, the Zauli, Via Amendola: the streets between the Appia and Via Palazzo ---------- */
  { name: 'Via Palazzo', w: 1, pts: [[152, 36], [176, 36]] },
  { name: 'Via San Giulio', w: 1, pts: [[164, 36], [164, 46]] },
  { name: 'Via Giuseppe Verdi', w: 1, pts: [[170, 36], [170, 46]] },
  /* around the Bruno Zauli centre */
  { name: 'Via Gioacchino Rossini', w: 1, pts: [[176, 32], [176, 46]] },
  { name: 'Via Andrea Ciardo', w: 1, pts: [[176, 32], [196, 32]] },
  { name: 'Via Bruno Zauli', w: 1, pts: [[196, 32], [196, 46]] },
  { name: 'Via Palazzo', w: 1, pts: [[196, 36], [212, 36]] },
  { name: 'Via San Pietro', w: 1, pts: [[201, 36], [201, 46]] },
  { name: 'Via don Luigi Sturzo', w: 1, pts: [[206, 36], [206, 46]] },
  /* Antonio's: the left turn off the Appia, Parco la Fontana on its right */
  { name: 'Via Giovanni Amendola', w: 1, pts: [[212, 36], [212, 46]] },
  /* across the Appia from Antonio's garden, down to the Villaggio Don Bosco */
  { name: 'Via San Giovanni Bosco', w: 1, pts: [[208, 48], [208, 51]] },
  /* the villas with streets named after flowers, between the Appia and the sea */
  { name: 'Viale delle Rose', w: 1, pts: [[228, 48], [228, 58], [240, 58]] },

  /* ---------- Santo Janni and Gianola ---------- */
  { name: 'Via Santo Janni', w: 1, pts: [[240, 48], [240, 62]] },
  { name: 'Via Gianola', w: 2, pts: [[246, 48], [246, 70]] },
  /* the lungomare of Gianola: down the beach in three steps, the lidi in the corners */
  { name: 'Lungomare Città di Ferrara', w: 2, pts: [[238, 62], [244, 62], [244, 70], [250, 70], [250, 78], [258, 78], [258, 88]] },
  { name: 'Via del Porticciolo Romano', w: 1, pts: [[258, 90], [258, 96], [264, 96]] },

  /* ---------- Scauri ---------- */
  { name: 'Via Olivella', w: 1, pts: [[300, 64], [300, 80]] },
  { name: 'Lungomare Nazario Sauro', w: 1, pts: [[296, 82], [296, 80], [304, 80], [304, 88], [312, 88], [312, 94], [308, 94]] },
  { name: 'Via Marconi', w: 1, pts: [[312, 74], [312, 88]] }
];
/** footpaths (not streets): through the Pineta di Vindicio, between the two roads */
export const PATHS: Line[] = [
  /* the walks of Parco la Fontana: in from Via Amendola behind Antonio's building, between the palazzine, out on
     Via Stendhal and down to the Appia */
  { name: 'Viale del parco', w: 1, pts: [[219, 38], [219, 40], [220, 40], [220, 44], [238, 44], [238, 38]] },
  { name: 'Viale del parco', w: 1, pts: [[238, 40], [240, 40]] },
  { name: 'Viale del parco', w: 1, pts: [[224, 44], [224, 45]] },
  { name: 'Sentiero della pineta', w: 1, pts: [[54, 98], [54, 102]] },
  { name: 'Sentiero della pineta', w: 1, pts: [[47, 100], [61, 100]] }
];

/* ---------- Formia on three levels (VISIONE.md, V3 and V4) ----------
   The land rises to the north, from the sea to the Aurunci, so the face of every terrace looks south, at the player.
   A terrace is open ground kept as it is (no houses on it, no wilderness over it); a scarp is the line of its face,
   one tile deep: where a street crosses it the street climbs, where a path or a trail crosses it there are steps;
   a ledge is a tile of a scarp one can jump down from, never up. Everything far from a street, a path or a place,
   inside a WILD zone, is closed: mountain, wooded hill, or olive groves behind their dry-stone walls. */
/** the mule tracks and footpaths up the terraces */
export const TRAILS: Line[] = [
  /* the Strada della Statua, from the square of Maranola up the Aurunci: two bends, two flights of steps, the
     hermitage of San Michele in the rock and the belvedere of the Redentore at the top */
  { name: 'Strada della Statua', w: 1, pts: [[129, 16], [120, 16], [120, 10], [104, 10], [104, 5], [118, 5]] },
  /* from the Appia up the slope of the Acervara, where the tomb of Tulliola is */
  { name: 'Sentiero dell\'Acervara', w: 1, pts: [[12, 83], [12, 76], [4, 76]] },
  /* across the promontory of Gianola, through the terraces of the villa and down its covered stairs to the point */
  { name: 'Sentiero di Gianola', w: 1, pts: [[267, 96], [272, 96], [272, 104], [278, 104], [278, 121]] }
];
/** the terraces: both corners included */
export const TERRACES: (Rect & { name: string; olives?: boolean })[] = [
  { name: 'Aurunci, il primo gradone', x0: 96, y0: 9, x1: 128, y1: 11, olives: true },
  { name: 'Aurunci, il secondo gradone', x0: 100, y0: 4, x1: 120, y1: 6 },
  { name: 'Acervara', x0: 0, y0: 73, x1: 18, y1: 79, olives: true },
  { name: 'Gianola, le terrazze della villa', x0: 268, y0: 100, x1: 282, y1: 122 }
];
/** the faces of the terraces: '^' rock, '[' a retaining wall of stone blocks */
export const SCARPS: { name: string; ch: '^' | '['; pts: XY[] }[] = [
  { name: 'Aurunci, il primo gradone', ch: '^', pts: [[95, 12], [128, 12]] },
  { name: 'Aurunci, il secondo gradone', ch: '^', pts: [[99, 7], [121, 7]] },
  { name: 'Acervara', ch: '^', pts: [[0, 80], [19, 80]] },
  { name: 'Il muraglione dell\'Appia', ch: '[', pts: [[26, 94], [43, 94]] },
  { name: 'La salita di Via Solaro', ch: '[', pts: [[125, 48], [137, 48]] },
  { name: 'Gianola, la terrazza bassa', ch: '^', pts: [[268, 110], [282, 110]] }
];
/** dry-stone walls drawn by hand: the one that closes the terrace of the Acervara on its east side */
export const MACERE: XY[][] = [[[19, 73], [19, 79]]];
/** where one jumps down a scarp: shortcuts on the way back */
export const LEDGES: XY[] = [[124, 12], [112, 7], [7, 80], [34, 94], [276, 110]];
/** the wilderness: inside each zone, the open ground more than `keep` tiles from anything walked on purpose is closed */
export const WILD: (Rect & { kind: 'hill' | 'wood' | 'grove'; keep: number })[] = [
  /* the Aurunci, behind the whole town: down to the railway everywhere */
  { kind: 'hill', x0: 0, y0: 0, x1: 61, y1: 77, keep: 1 },
  { kind: 'hill', x0: 62, y0: 0, x1: 121, y1: 45, keep: 1 },
  { kind: 'hill', x0: 122, y0: 0, x1: 145, y1: 37, keep: 1 },
  { kind: 'hill', x0: 146, y0: 0, x1: 319, y1: 29, keep: 1 },
  { kind: 'hill', x0: 245, y0: 30, x1: 277, y1: 37, keep: 1 },
  /* the olive groves north of the Appia, behind the Tomba di Cicerone */
  { kind: 'grove', x0: 26, y0: 79, x1: 49, y1: 87, keep: 2 },
  /* the woods toward Gaeta, the Monte di Scauri */
  { kind: 'wood', x0: 0, y0: 86, x1: 25, y1: 127, keep: 1 },
  { kind: 'wood', x0: 283, y0: 64, x1: 296, y1: 127, keep: 1 },
  /* the olive groves of the east, between the roads and behind the beaches */
  { kind: 'grove', x0: 254, y0: 40, x1: 271, y1: 77, keep: 2 },
  { kind: 'grove', x0: 262, y0: 78, x1: 284, y1: 94, keep: 2 },
  { kind: 'grove', x0: 274, y0: 35, x1: 319, y1: 63, keep: 2 },
  { kind: 'grove', x0: 290, y0: 64, x1: 319, y1: 71, keep: 2 }
];

/* ---------- the shore ---------- */
/** the beaches of Vindicio and Gianola are widened into the sea, or at this scale they would be two tiles deep */
export const WIDEN: { x0: number; x1: number; by: number }[] = [{ x0: 20, x1: 68, by: 4 }, { x0: 236, x1: 320, by: 3 }];
/** west to east: Vindicio's long beach, the quays of the town, rocks and coves, beaches again from Santo Janni on */
export const SHORE: { x0: number; x1: number; kind: 'beach' | 'town' | 'rocky' }[] = [
  { x0: 0, x1: 68, kind: 'beach' }, { x0: 68, x1: 162, kind: 'town' }, { x0: 162, x1: 236, kind: 'rocky' }, { x0: 236, x1: 320, kind: 'beach' }
];
/** stone quays where the smoothed coast took the real moles away: Molo Vespucci, the ferry quay, the embankment
    under Mola. Only sea becomes stone */
export const QUAYS: Rect[] = [
  { x0: 112, y0: 74, x1: 123, y1: 87 },
  { x0: 120, y0: 70, x1: 138, y1: 77 }
];
/** land where the smoothed coast left sea (cut in step 1, before anything else): the quays of the port of Formia below
    Largo Paone, and Mola along the sea, from the Torre di Mola up to the roundabout of the Appia */
export const LAND: Rect[] = [{ x0: 116, y0: 52, x1: 154, y1: 84 }, { x0: 155, y0: 50, x1: 161, y1: 56 }];
/** the little harbour inside the lungomare, under the Torre di Mola: its water, boats moored in it; the lungomare
    crosses its mouth on a bridge (the street over it is kept), the open sea beyond */
export const DARSENA: Rect[] = [{ x0: 148, y0: 59, x1: 150, y1: 79 }, { x0: 148, y0: 82, x1: 150, y1: 82 }];
/** a beach squared to the road behind it: under the road a row of promenade, then sand down to the sea */
export const BEACHFRONT: { x0: number; x1: number; y: number }[] = [
  { x0: 46, x1: 66, y: 104 }
];
/** the same along a road that runs down the map: the promenade is the column west of it */
export const BEACHSIDE: { x: number; y0: number; y1: number }[] = [];
/** the Porticciolo romano of Gianola: the top-left tile of its tanks in the sea */
export const POND: XY = [245, 98];
/** where the sea is: the middle of the gulf, and the bay of Scauri beyond the promontory (lat, lon) */
export const SEAS: XY[] = [[41.2445, 13.620], [41.2469, 13.7093]];
/** the line of buoys off the beach of Vindicio */
export const BUOYS: Rect = { x0: 30, y0: 104, x1: 76, y1: 127 };
/** boats are moored along the quays inside it; nets dry on the quay of Mola */
export const HARBOUR: Rect = { x0: 100, y0: 56, x1: 152, y1: 96 };
export const NETS: Rect = { x0: 128, y0: 58, x1: 152, y1: 74 };

/* ---------- the town ---------- */
/** each neighbourhood has its own houses: the old stone houses of the borghi (Castellone, Mola, Maranola), the villas
    of Vindicio and Gianola, the palazzine of the east, shops along Via Vitruvio */
export const TOWN: (Rect & { name: string; kinds: string[]; every: number; far?: boolean })[] = [
  { name: 'Castellone', x0: 85, y0: 62, x1: 97, y1: 76, kinds: ['borgo', 'borgo', 'borgo', 'shop'], every: 0.95 },
  { name: 'Maranola', x0: 126, y0: 10, x1: 146, y1: 22, kinds: ['borgo'], every: 0.9 },
  { name: 'Mola', x0: 126, y0: 44, x1: 150, y1: 70, kinds: ['borgo', 'borgo', 'shop', 'borgo'], every: 0.9 },
  { name: 'Vindicio', x0: 26, y0: 84, x1: 62, y1: 127, kinds: ['villa', 'villa', 'house'], every: 0.6, far: true },
  { name: 'Sotto il colle', x0: 50, y0: 80, x1: 84, y1: 96, kinds: ['house', 'villa', 'condo'], every: 0.6, far: true },
  { name: 'Sopra la stazione', x0: 86, y0: 44, x1: 122, y1: 60, kinds: ['house', 'condo', 'house'], every: 0.7, far: true },
  { name: 'Centro', x0: 84, y0: 62, x1: 134, y1: 92, kinds: ['house', 'condo', 'shop', 'shop'], every: 0.9 },
  { name: 'Rio Fresco', x0: 120, y0: 30, x1: 160, y1: 46, kinds: ['house', 'condo', 'house'], every: 0.7, far: true },
  { name: 'Acqualonga e via Amendola', x0: 152, y0: 30, x1: 252, y1: 46, kinds: ['condo', 'house', 'condo'], every: 0.7, far: true },
  { name: 'Lungo l\'Appia', x0: 160, y0: 48, x1: 240, y1: 60, kinds: ['villa', 'house'], every: 0.6, far: true },
  { name: 'Santo Janni e Gianola', x0: 236, y0: 46, x1: 262, y1: 92, kinds: ['villa', 'house', 'villa'], every: 0.55, far: true },
  { name: 'Scauri', x0: 296, y0: 60, x1: 320, y1: 90, kinds: ['house', 'villa', 'condo'], every: 0.6, far: true }
];
/** the cortine of the centre and of Mola: palazzi wall to wall, four or five floors over a row of shops and
    portoni, that make the street a corridor (Antonio's photos of via Abate Tosti and of Largo Paone). Each rectangle
    is a row of footprints, the fronts on its bottom side; the generator cuts it into palazzi 2 to 4 tiles wide, around
    the places already standing in it (Morgana, the barber, the tobacconist…). `up`: how far, in tiles, each palazzo
    rises over its footprint (a deep footprint is mostly roof seen from above); `shops`: how many have a shop below.
    A row whose fronts look away from a lane keeps `up` small, so that the lane behind it is not hidden */
export const ROWS: (Rect & { name: string; up: number; shops: number })[] = [
  /* via Vitruvio before the roundabout: shops under the palazzi */
  { name: 'Via Vitruvio', x0: 112, y0: 61, x1: 118, y1: 65, up: 0.7, shops: 0.75 },
  /* Piazza Tommaso Testa, the row in front of the car park: Zanzibar and the tobacconist are places of their own
     (formia-places.ts), the rest is the pharmacy and the shops */
  { name: 'Piazza Tommaso Testa', x0: 122, y0: 60, x1: 131, y1: 63, up: 0.7, shops: 1 },
  /* via Abate Tosti: the side toward the mountain, its fronts on the lane (Telaro, the bar, the barber and Forchetta's
     home are places)… */
  { name: 'Via Abate Tosti, lato monte', x0: 133, y0: 60, x1: 140, y1: 64, up: 0.55, shops: 0.5 },
  /* …and the side toward the sea, next to Morgana: its front on the Pinetina, its roof on the lane */
  { name: 'Via Abate Tosti, lato mare', x0: 137, y0: 66, x1: 139, y1: 69, up: 0.1, shops: 1 }
];
/** no house of the town here: the pavement south of the castle, the one down via Vitruvio, the passage into the Pinetina */
export const KEEP_OPEN: Rect[] = [{ x0: 220, y0: 31, x1: 240, y1: 45 }, { x0: 144, y0: 67, x1: 147, y1: 69 }, { x0: 118, y0: 70, x1: 119, y1: 78 }, { x0: 133, y0: 66, x1: 133, y1: 69 }];
/** umbrella pines planted by hand: along the lungomare between the car park of Largo Paone and the port, and down
    the pavement of via Vitruvio */
export const PINES: XY[] = [[118, 79], [120, 79], [122, 79], [124, 79], [126, 79], [128, 79], [130, 79], [118, 71], [118, 74], [118, 77]];
/** flower beds: the island in the middle of the roundabout of Largo Paone */
export const BEDS: Rect[] = [{ x0: 117, y0: 67, x1: 118, y1: 68 }, { x0: 126, y0: 54, x1: 127, y1: 55 }, { x0: 130, y0: 54, x1: 131, y1: 55 }];
/** l'Ancora: the anchor on its plinth in the square under the Torre di Mola, and two benches by it */
export const ANCHOR: XY = [142, 64];
export const BENCHES: XY[] = [[141, 67], [143, 67]];
/** scooters parked at the kerb of the wide pavement of Largo Paone, in front of the tabacchi (Street View) */
export const SCOOTERS: XY[] = [[125, 65], [126, 65], [129, 65]];
/** Parco la Fontana is closed: a railing all around (the palazzine are part of the wall), the gates locked. Antonio
    gets in from his own flat, through the back door (the spot `porta-parco` of formia-places.ts) */
export const FENCES: XY[][] = [
  [[220, 31], [240, 31]], [[220, 31], [220, 36]], [[219, 37], [220, 37]],
  [[240, 31], [240, 45]], [[220, 45], [240, 45]]
];
export const GATES: XY[] = [[240, 40], [224, 45]];
/** inside a closed fence nothing has to be reached on foot from home */
export const CLOSED: Rect[] = [{ x0: 221, y0: 32, x1: 239, y1: 44 }, { x0: 219, y0: 38, x1: 220, y1: 44 }];
/** the hedges of Parco la Fontana (13 November 2026): from Antonio's back door the round garden and the covo are not
    reached straight across; the walk goes down along his palazzina, all the way along the south railing past his
    robots, and back up at the far end to the door of the covo */
export const HEDGES: XY[][] = [[[224, 35], [224, 40]], [[225, 42], [236, 42]], [[236, 39], [236, 41]], [[225, 43], [229, 43]], [[231, 43], [236, 43]]];
/** the shops of Via Vitruvio: the houses whose door opens on these rows of it are all shops */
export const HIGH_STREET: Rect[] = [{ x0: 86, y0: 76, x1: 110, y1: 76 }, { x0: 112, y0: 66, x1: 130, y1: 66 }];
/** tree-lined roads: the Appia out of town, the coast road of Vindicio, the Appia along the bay, the road to Gianola */
export const AVENUES: (Rect & { every: number })[] = [
  { x0: 0, y0: 83, x1: 50, y1: 95, every: 3 }, { x0: 24, y0: 107, x1: 62, y1: 111, every: 3 }, { x0: 42, y0: 95, x1: 64, y1: 99, every: 3 },
  { x0: 158, y0: 45, x1: 252, y1: 49, every: 3 }, { x0: 244, y0: 48, x1: 250, y1: 70, every: 3 }
];
/** zebra crossings: where the side streets meet Via Vitruvio and the lungomare */
export const ZEBRAS: Rect[] = [
  { x0: 88, y0: 76, x1: 88, y1: 77 }, { x0: 99, y0: 76, x1: 99, y1: 77 }, { x0: 108, y0: 76, x1: 108, y1: 77 },
  { x0: 110, y0: 72, x1: 111, y1: 72 }, { x0: 121, y0: 66, x1: 121, y1: 67 }, { x0: 128, y0: 66, x1: 128, y1: 67 },
  { x0: 130, y0: 62, x1: 131, y1: 62 }, { x0: 139, y0: 54, x1: 139, y1: 55 }, { x0: 148, y0: 54, x1: 148, y1: 55 },
  { x0: 104, y0: 84, x1: 104, y1: 85 }, { x0: 124, y0: 72, x1: 124, y1: 73 }, { x0: 211, y0: 46, x1: 211, y1: 47 },
  /* Largo Paone: in front of the tobacconist, across the lungomare to the port; via Emanuele Filiberto at San Giovanni */
  { x0: 127, y0: 66, x1: 127, y1: 67 }, { x0: 123, y0: 80, x1: 123, y1: 81 }, { x0: 129, y0: 57, x1: 129, y1: 58 }, { x0: 146, y0: 54, x1: 146, y1: 55 }
];
/** the centre is paved: pavements along its streets, no scraps of grass between them */
export const URBAN: Rect[] = [{ x0: 84, y0: 61, x1: 156, y1: 92 }, { x0: 120, y0: 44, x1: 160, y1: 60 }];
/** Castellone, the old borgo: stone everywhere between its houses; and the polygonal walls along its edge */
export const BORGO: Rect = { x0: 85, y0: 62, x1: 96, y1: 76 };
export const WALLS: XY[][] = [[[85, 61], [95, 61]], [[85, 65], [85, 69]]];
/** the cobbled lanes inside these have street lamps too */
export const LAMPLIT: Rect[] = [{ x0: 85, y0: 62, x1: 97, y1: 76 }, { x0: 126, y0: 10, x1: 146, y1: 22 }];
/** Maranola, up in the Aurunci: its square (the generator paves it and clears the trees around) */
export const MARANOLA: Rect = { x0: 130, y0: 14, x1: 141, y1: 17 };
