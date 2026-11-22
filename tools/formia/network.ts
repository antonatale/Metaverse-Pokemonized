/* The playable skeleton of the Formia map, drawn by hand on its tiles (320×152, see formia-projection.ts) over the
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
import { H } from '../../src/data/maps/formia-projection';
import { LITORANEA, PINETA_COSTIERA } from '../../src/data/maps/formia-places';

export type XY = [number, number];
export interface Line { name: string; w: 1 | 2 | 3; pts: XY[]; ch?: string }
export interface Rect { x0: number; y0: number; x1: number; y1: number }

/** Nicola's main route: one extra lane, on the landward side, with room to turn. The houses and verge decorations
    keep clear of it; the narrow streets of the old town remain footpaths for a van this size. */
export const VAN_ROADS: Line[] = [
  { name: 'Via Appia Lato Napoli', w: 3, pts: [[189, 45], [244, 45]] },
  { name: 'Via Appia Lato Napoli', w: 3, pts: [[189, 45], [189, 54]] },
  { name: 'Via Emanuele Filiberto', w: 3, pts: [[181, 53], [189, 53]] },
  { name: 'Lungomare della Repubblica', w: 3, pts: [[181, 54], [181, 80]] },
  { name: 'Lungomare della Repubblica', w: 3, pts: [[146, 79], [181, 79]] },
  /* the Viale along the shore below Castellone and the centre, up past Piazza della Vittoria to the lungomare */
  { name: 'Viale Unità d’Italia', w: 3, pts: [[102, 89], [102, 87], [116, 87], [116, 83], [134, 83], [134, 79], [146, 79]] },
  ...LITORANEA,
  /* down through the pineta to the lungomare, at the Eclipse */
  { name: 'Via Vindicio', w: 3, pts: [[43, 98], [43, 107]] }
];

/** the railway Roma–Napoli, in two pieces: from the west edge into the hill, and out of it past the station, up behind
    Mola, along the foot of the Aurunci and down to Scauri */
export const RAILS: XY[][] = [
  [[0, 70], [20, 70], [20, 78], [61, 78]],
  [[86, 63], [110, 63], [110, 61], [118, 61], [118, 59], [149, 59], [149, 40], [176, 40], [176, 30], [274, 30], [274, 42], [280, 42], [280, 34], [308, 34], [308, 46], [324, 46], [324, 58], [340, 58], [340, 66], [349, 66]]
];
/** where the railway goes into a hill: a tunnel mouth is drawn on the tile above */
export const TUNNEL_ENDS: XY[] = [[61, 78], [86, 63]];
/** hills painted by hand, as rectangles of tiles: the one the railway goes under, between Vindicio and Castellone
    (Santa Maria la Noce, Monte di Mola) */
export const HILLS: Rect[] = [{ x0: 62, y0: 46, x1: 85, y1: 63 }, { x0: 62, y0: 64, x1: 75, y1: 80 }];

export const STREETS: Line[] = [
  /* ---------- the spine, west to east ---------- */
  /* the Appia from Itri, past the Tomba di Cicerone, to the fork of Vindicio */
  { name: 'Via Appia', w: 2, pts: [[0, 82], [12, 82], [12, 85], [20, 85], [20, 88], [25, 88], [25, 92], [50, 92]] },
  /* West of Vindicio, Via Canzatora links the Appia to the Flacca at the Gaeta boundary.
     Follow the OSM bends on the inland side of the existing coast road. */
  { name: 'Via Canzatora', w: 1, pts: [[20, 88], [20, 96], [22, 96], [22, 106], [21, 106], [21, 113], [23, 113], [23, 123], [26, 123]] },
  /* Acervara and Taliente climb behind the junction at Via Vindicio; Sem Benelli links the Appia and the Flacca. */
  { name: 'Via Acervara', w: 1, pts: [[44, 92], [44, 84], [40, 84]] },
  { name: 'Via Taliente', w: 1, pts: [[44, 84], [49, 84], [49, 92]] },
  { name: 'Via Sem Benelli', w: 1, pts: [[39, 92], [39, 99]] },
  { name: 'Via Giuseppe Garibaldi', w: 1, pts: [[58, 87], [58, 96]] },
  /* The residential streets above Giuseppe Paone, compressed below the railway hill. */
  { name: 'Via Remigio Paone', w: 1, pts: [[59, 86], [59, 82], [62, 82]] },
  /* the old road into town, up to Piazza Mattej */
  { name: 'Via Giuseppe Paone', w: 2, pts: [[50, 92], [50, 86], [76, 86]] },
  /* the main street (17 November 2026, from OpenStreetMap at twice the scale): along the foot of Castellone and Piazza
     Mattej, up in steps past Piazza Marconi, between the Comune and Piazza della Vittoria, to Largo Paone */
  { name: 'Via Vitruvio', w: 2, pts: [[76, 86], [94, 86], [94, 84], [104, 84], [104, 81], [114, 81], [114, 78], [122, 78], [122, 75], [146, 75]] },
  /* the roundabout of Largo Paone, by Piazza Tommaso Testa: a ring round a flower bed (BEDS), four ways out */
  { name: 'Largo Domenico Paone', w: 1, pts: [[146, 66], [149, 66], [149, 69], [146, 69], [146, 66]] },
  /* from the roundabout down the west side of the car park to the lungomare and the port */
  { name: 'Via Vitruvio', w: 2, pts: [[146, 70], [146, 80]] },
  /* in front of the tobacconist's row, along the car park, to via Tullia and via Abate Tosti */
  { name: 'Largo Domenico Paone', w: 2, pts: [[150, 66], [161, 66]] },
  /* from the roundabout up behind the row of Piazza Tommaso Testa, then along the top of Mola: San Giovanni, the
     Vitruvio Pollione and De Amicis schools, Piazza Risorgimento, the roundabout of the Appia */
  { name: 'Via Emanuele Filiberto', w: 2, pts: [[150, 66], [150, 57], [172, 57], [172, 54], [189, 54]] },
  /* east along the bay: Rio Fresco, the Zauli, Via Amendola, Santo Janni */
  { name: 'Via Appia Lato Napoli', w: 2, pts: [[189, 54], [189, 46], [282, 46], [282, 38], [302, 38]] },
  /* and on to Scauri, the railway on its left all the way */
  { name: 'Via Appia', w: 2, pts: [[302, 38], [302, 50], [318, 50], [318, 62], [334, 62], [334, 72], [349, 72]] },

  /* ---------- the coast road ---------- */
  /* from Gaeta behind Vindicio, along the top of the pineta, past Caposele, to the roundabout of the port */
  ...LITORANEA,
  { name: 'Viale Unità d\'Italia', w: 2, pts: [[103, 90], [103, 88], [117, 88], [117, 84], [135, 84], [135, 80], [146, 80]] },
  /* from the Appia down across the Viale and through the pineta to the sea, where the Eclipse is: the way to the beach */
  { name: 'Via Vindicio', w: 2, pts: [[44, 92], [44, 107]] },
  /* along the port, under the pines of Largo Paone and of the Pinetina, over the mouth of the little harbour of the
     Torre di Mola, then up along the sea to Piazza Risorgimento */
  { name: 'Lungomare della Repubblica', w: 2, pts: [[146, 80], [181, 80], [181, 55]] },
  /* the lungomare of Vindicio is a promenade along the whole beach (LUNGOMARE, below), not a street */

  /* ---------- Castellone and the centre (17 November 2026) ----------
     Drawn again at twice the scale on the streets of OpenStreetMap (docs/mappa.md, «Castellone e il centro»). The borgo
     climbs the hill of the Roman acropolis: its lanes run across the slope, one under the other, the houses between
     them face south over the gulf, and stairs (STAIRS) go down from each lane to the next. Its walls are on the west
     and the north, the railway runs under the hill in a tunnel and comes out above it. The lanes are cobbled. */
  { name: 'Via Pasquale Testa', w: 1, pts: [[76, 65], [112, 65], [112, 64], [120, 64]] },
  { name: 'Via degli Olivetani', w: 1, pts: [[76, 65], [76, 86]] },
  { name: 'Via Gradoni del Duomo', w: 1, pts: [[77, 71], [90, 71]], ch: 'v' },
  { name: 'Via della Torre', w: 1, pts: [[90, 71], [113, 71], [113, 73]], ch: 'v' },
  { name: 'Via Antonio Forcina', w: 1, pts: [[77, 75], [93, 75], [93, 76]], ch: 'v' },
  { name: 'Vico del Teatro', w: 1, pts: [[80, 76], [80, 81]], ch: 'v' },
  { name: 'Via Orticello', w: 1, pts: [[100, 66], [100, 70]], ch: 'v' },
  { name: 'Via Traiano', w: 1, pts: [[108, 66], [108, 70]], ch: 'v' },
  { name: 'Vicolo di Sant\'Anna', w: 1, pts: [[98, 74], [98, 75]], ch: 'v' },
  { name: 'Via del Castello', w: 1, pts: [[101, 77], [101, 79]], ch: 'v' },
  { name: 'Via San Giovanni', w: 1, pts: [[106, 75], [106, 77]], ch: 'v' },
  { name: 'Via delle Mura Ciclopiche', w: 1, pts: [[110, 75], [110, 77]], ch: 'v' },
  { name: 'Via del Pesce', w: 1, pts: [[98, 81], [98, 83]], ch: 'v' },
  { name: 'Via Costanzo Ciano', w: 1, pts: [[108, 79], [108, 80]], ch: 'v' },
  { name: 'Via Tacito', w: 1, pts: [[80, 83], [80, 85]], ch: 'v' },
  { name: 'Vico Antonino Pio', w: 1, pts: [[86, 83], [86, 85]], ch: 'v' },
  /* the two streets under the borgo, one above the other, down to Piazza Marconi */
  { name: 'Via Mamurra', w: 1, pts: [[94, 76], [103, 76], [103, 74], [113, 74]] },
  { name: 'Via Angelo Rubino', w: 1, pts: [[76, 82], [92, 82], [92, 80], [102, 80], [102, 78], [113, 78]] },
  /* the station and the streets round the Comune */
  { name: 'Via XXIV Maggio', w: 1, pts: [[116, 56], [116, 64]] },
  { name: 'Via Divisione Julia', w: 1, pts: [[120, 65], [120, 69]] },
  { name: 'Via Ferdinando Lavanga', w: 1, pts: [[121, 70], [134, 70], [134, 68], [140, 68], [140, 66], [145, 66]] },
  /* up the side of the Comune to the station: the way the cars (and Nicola's van) go to the trains */
  { name: 'Via dei Carmelitani', w: 2, pts: [[140, 63], [140, 74]] },
  /* north of the railway */
  { name: 'Via Salvo D\'Acquisto', w: 1, pts: [[94, 56], [150, 56]] },
  { name: 'Via Santa Maria la Noce', w: 1, pts: [[94, 56], [94, 46], [126, 46]] },
  { name: 'Via Cassio', w: 1, pts: [[126, 56], [126, 46]] },
  { name: 'Via Sant\'Antonio', w: 1, pts: [[150, 56], [150, 36]] },
  { name: 'Via delle Fosse', w: 1, pts: [[150, 36], [180, 36]] },

  /* ---------- Mola (OpenStreetMap, the satellite view and Street View, 12 November 2026) ---------- */
  /* via Tullia, short, from via Emanuele Filiberto down to where via Abate Tosti begins: the enoteca Telaro on its corner */
  { name: 'Via Tullia', w: 1, pts: [[162, 59], [162, 65]] },
  /* the lane of the borgo, paved with basalt: from Largo Paone, between two walls of palazzi, to the square of the
     anchor under the Torre di Mola; from there a passage climbs to via Emanuele Filiberto */
  { name: 'Via Abate Tosti', w: 1, pts: [[162, 65], [170, 65]], ch: 'v' },
  { name: 'Via Abate Tosti', w: 1, pts: [[172, 59], [172, 60]], ch: 'v' },
  { name: 'Via della Conca', w: 1, pts: [[154, 46], [154, 56]] },
  /* to the right of San Giovanni the street climbs, then turns left: Via Solaro */
  { name: 'Via Solaro', w: 1, pts: [[162, 56], [162, 46], [154, 46]] },
  /* from Piazza Risorgimento up past the Dono Svizzero, on its left */
  { name: 'Via Adalgiso Ferrucci', w: 2, pts: [[181, 54], [181, 36]] },

  /* ---------- up to Maranola: two hairpins ---------- */
  { name: 'Via Rotabile', w: 2, pts: [[181, 36], [181, 23], [198, 23], [198, 15], [172, 15]] },

  /* ---------- Rio Fresco, the Zauli, Via Amendola: the streets between the Appia and Via Palazzo ---------- */
  { name: 'Via Palazzo', w: 1, pts: [[182, 36], [206, 36]] },
  { name: 'Via San Giulio', w: 1, pts: [[194, 36], [194, 46]] },
  { name: 'Via Giuseppe Verdi', w: 1, pts: [[200, 36], [200, 46]] },
  /* around the Bruno Zauli centre */
  { name: 'Via Gioacchino Rossini', w: 1, pts: [[206, 32], [206, 46]] },
  { name: 'Via Andrea Ciardo', w: 1, pts: [[206, 32], [226, 32]] },
  { name: 'Via Bruno Zauli', w: 1, pts: [[226, 32], [226, 46]] },
  { name: 'Via Palazzo', w: 1, pts: [[226, 36], [242, 36]] },
  { name: 'Via San Pietro', w: 1, pts: [[231, 36], [231, 46]] },
  { name: 'Via don Luigi Sturzo', w: 1, pts: [[236, 36], [236, 46]] },
  /* Antonio's: the left turn off the Appia, Parco la Fontana on its right */
  { name: 'Via Giovanni Amendola', w: 1, pts: [[242, 36], [242, 46]] },
  /* across the Appia from Antonio's garden, down to the Villaggio Don Bosco */
  { name: 'Via San Giovanni Bosco', w: 1, pts: [[238, 48], [238, 51]] },
  /* the villas with streets named after flowers, between the Appia and the sea */
  { name: 'Viale delle Rose', w: 1, pts: [[258, 48], [258, 58], [270, 58]] },

  /* ---------- Santo Janni and Gianola ---------- */
  { name: 'Via Santo Janni', w: 1, pts: [[270, 48], [270, 62]] },
  { name: 'Via Gianola', w: 2, pts: [[276, 48], [276, 70]] },
  /* the lungomare of Gianola: down the beach in three steps, the lidi in the corners */
  { name: 'Lungomare Città di Ferrara', w: 2, pts: [[268, 62], [274, 62], [274, 70], [280, 70], [280, 78], [288, 78], [288, 88]] },
  { name: 'Via del Porticciolo Romano', w: 1, pts: [[288, 90], [288, 96], [294, 96]] },

  /* ---------- Scauri ---------- */
  { name: 'Via Olivella', w: 1, pts: [[330, 64], [330, 80]] },
  { name: 'Lungomare Nazario Sauro', w: 1, pts: [[326, 82], [326, 80], [334, 80], [334, 88], [342, 88], [342, 94], [338, 94]] },
  { name: 'Via Marconi', w: 1, pts: [[342, 74], [342, 88]] }
];
/** footpaths (not streets): through the Pineta di Vindicio, between the two roads */
export const PATHS: Line[] = [
  /* The entrance to the former Irish College on the Gaeta side of Via Canzatora. */
  { name: 'Villa Irlanda', w: 1, pts: [[19, 126], [19, 129], [24, 129]] },
  /* the walks of Parco la Fontana: in from Via Amendola behind Antonio's building, between the palazzine, out on
     Via Stendhal and down to the Appia */
  { name: 'Viale del parco', w: 1, pts: [[249, 38], [249, 40], [250, 40], [250, 44], [268, 44], [268, 38]] },
  { name: 'Viale del parco', w: 1, pts: [[268, 40], [270, 40]] },
  { name: 'Viale del parco', w: 1, pts: [[254, 44], [254, 45]] },
  /* The shore walk follows Porto Caposele into the pines, then joins the lidos at Via Tito Scipione. */
  { name: 'Passeggiata di Cicerone', w: 1, pts: [[98, 94], [84, 94], [84, 95], [81, 95], [81, 98], [79, 98], [79, 101], [77, 101], [77, 102], [73, 102], [73, 103], [67, 103], [67, 102], [62, 102]] },
  { name: 'Ingresso della pineta', w: 1, pts: [[72, 94], [72, 100], [69, 100], [69, 103]] },
  { name: 'Radura del Tempio del Basso', w: 1, pts: [[66, 102], [66, 100], [69, 100]] },
  { name: 'Dehors del Bodeguita', w: 1, pts: [[72, 100], [75, 100], [75, 98], [79, 98]] }
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
  { name: 'Strada della Statua', w: 1, pts: [[159, 16], [150, 16], [150, 10], [126, 10], [126, 5], [148, 5]] },
  /* from the Appia up the slope of the Acervara, where the tomb of Tulliola is */
  { name: 'Sentiero dell\'Acervara', w: 1, pts: [[12, 83], [12, 76], [4, 76]] },
  /* across the promontory of Gianola, through the terraces of the villa and down its covered stairs to the point */
  { name: 'Sentiero di Gianola', w: 1, pts: [[297, 96], [302, 96], [302, 104], [308, 104], [308, 121]] }
];
/** the terraces: both corners included */
export const TERRACES: (Rect & { name: string; olives?: boolean })[] = [
  { name: 'Aurunci, il primo gradone', x0: 110, y0: 9, x1: 158, y1: 11, olives: true },
  { name: 'Aurunci, il secondo gradone', x0: 118, y0: 4, x1: 150, y1: 6 },
  { name: 'Acervara', x0: 0, y0: 73, x1: 18, y1: 79, olives: true },
  { name: 'Gianola, le terrazze della villa', x0: 298, y0: 100, x1: 312, y1: 122 }
];
/** the faces of the terraces: '^' rock, '[' a retaining wall of stone blocks */
export const SCARPS: { name: string; ch: '^' | '['; pts: XY[] }[] = [
  { name: 'Aurunci, il primo gradone', ch: '^', pts: [[108, 12], [158, 12]] },
  { name: 'Aurunci, il secondo gradone', ch: '^', pts: [[116, 7], [151, 7]] },
  { name: 'Acervara', ch: '^', pts: [[0, 80], [19, 80]] },
  { name: 'Il muraglione dell\'Appia', ch: '[', pts: [[26, 94], [43, 94]] },
  { name: 'La salita di Via Solaro', ch: '[', pts: [[155, 48], [167, 48]] },
  { name: 'Gianola, la terrazza bassa', ch: '^', pts: [[298, 110], [312, 110]] }
];
/** dry-stone walls drawn by hand: the one that closes the terrace of the Acervara on its east side */
export const MACERE: XY[][] = [[[19, 73], [19, 79]]];
/** where one jumps down a scarp: shortcuts on the way back */
export const LEDGES: XY[] = [[154, 12], [142, 7], [7, 80], [34, 94], [306, 110]];
/** the wilderness: inside each zone, the open ground more than `keep` tiles from anything walked on purpose is closed */
export const WILD: (Rect & { kind: 'hill' | 'wood' | 'grove'; keep: number })[] = [
  /* the Aurunci, behind the whole town: down to the railway everywhere */
  { kind: 'hill', x0: 0, y0: 0, x1: 61, y1: 77, keep: 1 },
  { kind: 'hill', x0: 62, y0: 0, x1: 151, y1: 45, keep: 1 },
  { kind: 'hill', x0: 152, y0: 0, x1: 175, y1: 37, keep: 1 },
  { kind: 'hill', x0: 176, y0: 0, x1: 349, y1: 29, keep: 1 },
  { kind: 'hill', x0: 275, y0: 30, x1: 307, y1: 37, keep: 1 },
  /* the olive groves north of the Appia, behind the Tomba di Cicerone */
  { kind: 'grove', x0: 26, y0: 79, x1: 49, y1: 87, keep: 2 },
  /* the woods toward Gaeta, the Monte di Scauri */
  { kind: 'wood', x0: 0, y0: 86, x1: 25, y1: 151, keep: 1 },
  { kind: 'wood', x0: 313, y0: 64, x1: 326, y1: 127, keep: 1 },
  /* the olive groves of the east, between the roads and behind the beaches */
  { kind: 'grove', x0: 284, y0: 40, x1: 301, y1: 77, keep: 2 },
  { kind: 'grove', x0: 292, y0: 78, x1: 314, y1: 94, keep: 2 },
  { kind: 'grove', x0: 304, y0: 35, x1: 349, y1: 63, keep: 2 },
  { kind: 'grove', x0: 320, y0: 64, x1: 349, y1: 71, keep: 2 }
];

/* ---------- the shore ---------- */
/** the beaches of Vindicio and Gianola are widened into the sea, or at this scale they would be two tiles deep */
export const WIDEN: { x0: number; x1: number; by: number }[] = [{ x0: 0, x1: 66, by: 6 }, { x0: 266, x1: 350, by: 3 }];
/** west to east: Vindicio's long beach, the quays of the town, rocks and coves, beaches again from Santo Janni on */
export const SHORE: { x0: number; x1: number; kind: 'beach' | 'town' | 'rocky' }[] = [
  { x0: 0, x1: 68, kind: 'beach' }, { x0: 68, x1: 192, kind: 'town' }, { x0: 192, x1: 266, kind: 'rocky' }, { x0: 266, x1: 350, kind: 'beach' }
];
/** stone quays where the smoothed coast took the real moles away: Molo Vespucci, the ferry quay, the embankment
    under Mola. Only sea becomes stone */
export const QUAYS: Rect[] = [
  { x0: 142, y0: 74, x1: 153, y1: 87 },
  { x0: 150, y0: 70, x1: 168, y1: 77 }
];
/** land where the smoothed coast left sea (cut in step 1, before anything else): the quays of the port of Formia below
    Largo Paone, and Mola along the sea, from the Torre di Mola up to the roundabout of the Appia */
export const LAND: Rect[] = [{ x0: 104, y0: 78, x1: 145, y1: 86 }, { x0: 100, y0: 86, x1: 120, y1: 90 }, { x0: 100, y0: 91, x1: 106, y1: 93 }, { x0: 146, y0: 52, x1: 184, y1: 84 }, { x0: 185, y0: 50, x1: 191, y1: 56 }];
/** the little harbour inside the lungomare, under the Torre di Mola: its water, boats moored in it; the lungomare
    crosses its mouth on a bridge (the street over it is kept), the open sea beyond */
export const DARSENA: Rect[] = [{ x0: 178, y0: 59, x1: 180, y1: 79 }, { x0: 178, y0: 82, x1: 180, y1: 84 }];
/** a beach squared to the road behind it: under the road a row of promenade, then sand down to the sea */
export const BEACHFRONT: { x0: number; x1: number; y: number }[] = [];
/** the lungomare of Vindicio (13 November 2026: longer, from Caposele to La Scogliera, past the Lido Frungillo, the Lido
    Bandiera and the Eclipse): a paved promenade that follows the beach in long steps, the pines on one side and the sand
    on the other. Below it, down to the sea, everything is beach; its lamps stand on the side of the pines */
export const LUNGOMARE: Line[] = [
  { name: 'Lungomare di Vindicio', w: 2, pts: [[62, 102], [57, 102], [57, 103], [51, 103], [51, 105], [48, 105], [48, 107], [45, 107],
    [45, 109], [42, 109], [42, 111], [39, 111], [39, 113], [37, 113], [37, 115], [34, 115], [34, 117], [32, 117], [32, 119], [30, 119], [30, 121], [28, 121]] }
];
/** the Pineta di Vindicio: umbrella pines on all the open ground inside, between the Viale and the lungomare (the
    footpaths, the lungomare, Via Vindicio and the places in it are kept) */
export const PINETA: Rect = PINETA_COSTIERA;
/** This beach uses the hand-drawn promenade for its whole frontage. */
export const VINDICIO_PROMENADE: Rect = { x0: 27, y0: 98, x1: 63, y1: H - 1 };
/** The park's coastal platform, widened just enough for the wooded frontage at map scale. */
export const PINETA_SHORE: Rect[] = [
  { x0: 63, y0: 97, x1: 66, y1: 103 },
  { x0: 67, y0: 95, x1: 72, y1: 104 },
  { x0: 73, y0: 95, x1: 76, y1: 103 },
  { x0: 77, y0: 95, x1: 80, y1: 102 },
  { x0: 81, y0: 95, x1: 81, y1: 100 }
];
/** where a harbour opens on the sea: water, whatever the smoothing of the coast left there. The basin of the ferry
    opens east between its two moles, the little harbour of Mola south under the bridge of the lungomare */
export const MOUTHS: Rect[] = [{ x0: 163, y0: 85, x1: 169, y1: 87 }, { x0: 178, y0: 82, x1: 180, y1: 84 }];
/** the same along a road that runs down the map: the promenade is the column west of it */
export const BEACHSIDE: { x: number; y0: number; y1: number }[] = [];
/** the Porticciolo romano of Gianola: the top-left tile of its tanks in the sea */
export const POND: XY = [275, 98];
/** where the sea is: the middle of the gulf, and the bay of Scauri beyond the promontory (lat, lon) */
export const SEAS: XY[] = [[41.2445, 13.620], [41.2469, 13.7093]];
/** the line of buoys off the beach of Vindicio */
export const BUOYS: Rect = { x0: 30, y0: 104, x1: 76, y1: 127 };
/** boats are moored along the quays inside it; nets dry on the quay of Mola */
export const HARBOUR: Rect = { x0: 118, y0: 56, x1: 182, y1: 96 };
export const NETS: Rect = { x0: 158, y0: 58, x1: 182, y1: 74 };

/* ---------- the town ---------- */
/** each neighbourhood has its own houses: the old stone houses of the borghi (Castellone, Mola, Maranola), the villas
    of Vindicio and Gianola, the palazzine of the east, shops along Via Vitruvio */
export const TOWN: (Rect & { name: string; kinds: string[]; every: number; far?: boolean })[] = [
  /* what the rows of Castellone leave between them: old stone houses */
  { name: 'Castellone', x0: 77, y0: 66, x1: 113, y1: 90, kinds: ['borgo'], every: 0.95 },
  { name: 'Maranola', x0: 156, y0: 10, x1: 176, y1: 22, kinds: ['borgo'], every: 0.9 },
  { name: 'Mola', x0: 156, y0: 44, x1: 180, y1: 70, kinds: ['borgo', 'borgo', 'shop', 'borgo'], every: 0.9 },
  { name: 'Vindicio', x0: 26, y0: 81, x1: 62, y1: 96, kinds: ['villa', 'loggia', 'house', 'condo'], every: 0.84, far: true },
  /* OSM building footprints narrow to a ribbon along Canzatora. Keep the wooded slopes open beyond it. */
  { name: 'Via Canzatora', x0: 15, y0: 88, x1: 24, y1: 119, kinds: ['house', 'villa', 'loggia'], every: 0.72, far: true },
  { name: 'Arcella', x0: 6, y0: 133, x1: 19, y1: 149, kinds: ['villa', 'house', 'loggia'], every: 0.55 },
  { name: 'Sotto il colle', x0: 50, y0: 80, x1: 75, y1: 96, kinds: ['house', 'villa', 'condo'], every: 0.6, far: true },
  { name: 'Sopra la stazione', x0: 86, y0: 44, x1: 152, y1: 62, kinds: ['house', 'condo', 'house'], every: 0.7, far: true },
  { name: 'Centro', x0: 114, y0: 62, x1: 164, y1: 92, kinds: ['house', 'condo', 'shop', 'shop'], every: 0.9 },
  { name: 'Rio Fresco', x0: 150, y0: 30, x1: 190, y1: 46, kinds: ['house', 'condo', 'house'], every: 0.7, far: true },
  { name: 'Acqualonga e via Amendola', x0: 182, y0: 30, x1: 282, y1: 46, kinds: ['condo', 'house', 'condo'], every: 0.7, far: true },
  { name: 'Lungo l\'Appia', x0: 190, y0: 48, x1: 270, y1: 60, kinds: ['villa', 'house'], every: 0.6, far: true },
  { name: 'Santo Janni e Gianola', x0: 266, y0: 46, x1: 292, y1: 92, kinds: ['villa', 'house', 'villa'], every: 0.55, far: true },
  { name: 'Scauri', x0: 326, y0: 60, x1: 350, y1: 90, kinds: ['house', 'villa', 'condo'], every: 0.6, far: true }
];
/** the cortine of the centre and of Mola: palazzi wall to wall, four or five floors over a row of shops and
    portoni, that make the street a corridor (Antonio's photos of via Abate Tosti and of Largo Paone). Each rectangle
    is a row of footprints, the fronts on its bottom side; the generator cuts it into palazzi 2 to 4 tiles wide, around
    the places already standing in it (Morgana, the barber, the tobacconist…). `up`: how far, in tiles, each palazzo
    rises over its footprint (a deep footprint is mostly roof seen from above); `shops`: how many have a shop below.
    A row whose fronts look away from a lane keeps `up` small, so that the lane behind it is not hidden */
export const ROWS: (Rect & { name: string; up: number; shops: number; kind?: string })[] = [
  /* ---------- Castellone (17 November 2026): the houses of the borgo between its lanes, `kind: 'casale'` (stone and
     plaster, two or three floors, arched doors, outside stairs; cortina.ts) ---------- */
  { name: 'Via della Torre', kind: 'casale', x0: 94, y0: 67, x1: 112, y1: 70, up: 0.9, shops: 0.15 },
  { name: 'Via Antonio Forcina', kind: 'casale', x0: 78, y0: 72, x1: 93, y1: 74, up: 0.8, shops: 0.1 },
  { name: 'Via Mamurra, sopra', kind: 'casale', x0: 94, y0: 72, x1: 95, y1: 75, up: 0.8, shops: 0 },
  { name: 'Via Mamurra, sotto Sant\'Anna', kind: 'casale', x0: 96, y0: 74, x1: 97, y1: 75, up: 0.6, shops: 0 },
  { name: 'Via Mamurra, al castello', kind: 'casale', x0: 100, y0: 72, x1: 102, y1: 75, up: 0.8, shops: 0.2 },
  { name: 'Via Mamurra, alta', kind: 'casale', x0: 104, y0: 72, x1: 105, y1: 73, up: 0.7, shops: 0 },
  { name: 'Via Mamurra, alta', kind: 'casale', x0: 109, y0: 72, x1: 112, y1: 73, up: 0.7, shops: 0.3 },
  { name: 'Vico del Teatro', kind: 'casale', x0: 78, y0: 76, x1: 82, y1: 81, up: 0.9, shops: 0 },
  { name: 'Via Angelo Rubino', kind: 'casale', x0: 93, y0: 77, x1: 94, y1: 79, up: 0.7, shops: 0 },
  { name: 'Via Angelo Rubino', kind: 'casale', x0: 99, y0: 77, x1: 100, y1: 79, up: 0.7, shops: 0 },
  { name: 'Via Angelo Rubino', kind: 'casale', x0: 104, y0: 75, x1: 113, y1: 77, up: 0.8, shops: 0.25 },
  /* under the borgo, the palazzi of Via Vitruvio and of Piazza Mattej: shops below */
  { name: 'Via Vitruvio, a Castellone', x0: 103, y0: 79, x1: 113, y1: 80, up: 0.6, shops: 0.7 },
  { name: 'Via Vitruvio, a Castellone', x0: 77, y0: 83, x1: 93, y1: 85, up: 0.7, shops: 0.6 },
  { name: 'Via Vitruvio, a Castellone', x0: 94, y0: 81, x1: 103, y1: 83, up: 0.7, shops: 0.6 },
  { name: 'Viale Unità d\'Italia', x0: 76, y0: 88, x1: 88, y1: 90, up: 0.7, shops: 0.3 },
  { name: 'Viale Unità d\'Italia', x0: 93, y0: 88, x1: 95, y1: 90, up: 0.7, shops: 0.5 },
  { name: 'Viale Unità d\'Italia', x0: 106, y0: 83, x1: 115, y1: 86, up: 0.5, shops: 1 },
  /* the centre: round the station, Piazza Marconi, Via Lavanga, the shops of Via Vitruvio by the Comune */
  { name: 'Piazza IV Novembre', x0: 119, y0: 60, x1: 123, y1: 62, up: 0.6, shops: 0.8 },
  { name: 'Piazza IV Novembre', x0: 136, y0: 60, x1: 141, y1: 62, up: 0.6, shops: 0.8 },
  { name: 'Via Pasquale Testa', x0: 111, y0: 62, x1: 115, y1: 63, up: 0.5, shops: 0.4 },
  { name: 'Via Pasquale Testa', x0: 117, y0: 62, x1: 118, y1: 63, up: 0.5, shops: 0.4 },
  { name: 'Piazza Marconi', x0: 113, y0: 65, x1: 115, y1: 69, up: 0.7, shops: 0.8 },
  { name: 'Via Ferdinando Lavanga', x0: 121, y0: 65, x1: 133, y1: 69, up: 0.8, shops: 0.6 },
  { name: 'Via Ferdinando Lavanga', x0: 134, y0: 65, x1: 136, y1: 67, up: 0.6, shops: 0.5 },
  { name: 'Via Ferdinando Lavanga', x0: 138, y0: 65, x1: 139, y1: 67, up: 0.6, shops: 0.5 },
  { name: 'Via Vitruvio', x0: 141, y0: 72, x1: 145, y1: 74, up: 0.7, shops: 1 },
  /* via Vitruvio before the roundabout: shops under the palazzi */
  { name: 'Via Vitruvio', x0: 142, y0: 61, x1: 148, y1: 65, up: 0.7, shops: 0.75 },
  /* Piazza Tommaso Testa, the row in front of the car park: Zanzibar and the tobacconist are places of their own
     (formia-places.ts), the rest is the pharmacy and the shops */
  { name: 'Piazza Tommaso Testa', x0: 152, y0: 60, x1: 161, y1: 63, up: 0.7, shops: 1 },
  /* via Abate Tosti: the side toward the mountain, its fronts on the lane (Telaro, the bar, the barber and Forchetta's
     home are places)… */
  { name: 'Via Abate Tosti, lato monte', x0: 163, y0: 60, x1: 170, y1: 64, up: 0.55, shops: 0.5 },
  /* …and the side toward the sea, next to Morgana: its front on the Pinetina, its roof on the lane */
  { name: 'Via Abate Tosti, lato mare', x0: 167, y0: 66, x1: 169, y1: 69, up: 0.1, shops: 1 }
];
/** no house of the town here: the pavement south of the castle, the one down via Vitruvio, the passage into the Pinetina */
export const KEEP_OPEN: Rect[] = [{ x0: 250, y0: 31, x1: 270, y1: 45 }, { x0: 174, y0: 67, x1: 177, y1: 69 }, { x0: 148, y0: 70, x1: 149, y1: 78 }, { x0: 163, y0: 66, x1: 163, y1: 69 }];
/** Umbrella pines along the port and Via Vitruvio, and around the clearing and the kiosk in Vindicio. */
export const PINES: XY[] = [
  [148, 79], [150, 79], [152, 79], [154, 79], [156, 79], [158, 79], [160, 79], [148, 71], [148, 74], [148, 77],
  [64, 100], [65, 96], [67, 95], [68, 101], [71, 101], [76, 96], [80, 100]
];
/** flower beds: the island in the middle of the roundabout of Largo Paone */
export const BEDS: Rect[] = [
  { x0: 77, y0: 95, x1: 79, y1: 97 }, { x0: 63, y0: 99, x1: 63, y1: 100 }, { x0: 74, y0: 101, x1: 75, y1: 101 },
  { x0: 16, y0: 126, x1: 18, y1: 128 }, { x0: 20, y0: 130, x1: 22, y1: 132 }, { x0: 147, y0: 67, x1: 148, y1: 68 },
  /* the flower beds of Piazza della Vittoria, on either side of the palace in it */
  { x0: 124, y0: 78, x1: 125, y1: 79 }, { x0: 132, y0: 78, x1: 133, y1: 79 }, { x0: 156, y0: 54, x1: 157, y1: 55 }, { x0: 160, y0: 54, x1: 161, y1: 55 }];
/** l'Ancora: the anchor on its plinth in the square under the Torre di Mola, and two benches by it */
export const ANCHOR: XY = [172, 64];
export const BENCHES: XY[] = [[171, 67], [173, 67], [67, 101], [70, 104], [78, 102]];
/** scooters parked at the kerb of the wide pavement of Largo Paone, in front of the tabacchi (Street View) */
export const SCOOTERS: XY[] = [[155, 65], [156, 65], [159, 65]];
/** Parco la Fontana is closed: a railing all around (the palazzine are part of the wall), the gates locked. Antonio
    gets in from his own flat, through the back door (the spot `porta-parco` of formia-places.ts) */
export const FENCES: XY[][] = [
  [[250, 31], [270, 31]], [[250, 31], [250, 36]], [[249, 37], [250, 37]],
  [[270, 31], [270, 45]], [[250, 45], [270, 45]]
];
export const GATES: XY[] = [[270, 40], [254, 45]];
/** inside a closed fence nothing has to be reached on foot from home */
export const CLOSED: Rect[] = [{ x0: 251, y0: 32, x1: 269, y1: 44 }, { x0: 249, y0: 38, x1: 250, y1: 44 }];
/** the hedges of Parco la Fontana (13 November 2026): from Antonio's back door the round garden and the covo are not
    reached straight across; the walk goes down along his palazzina, all the way along the south railing past his
    robots, and back up at the far end to the door of the covo */
export const HEDGES: XY[][] = [[[254, 35], [254, 40]], [[255, 42], [266, 42]], [[266, 39], [266, 41]], [[255, 43], [259, 43]], [[261, 43], [266, 43]]];
/** the shops of Via Vitruvio: the houses whose door opens on these rows of it are all shops */
export const HIGH_STREET: Rect[] = [{ x0: 76, y0: 86, x1: 95, y1: 86 }, { x0: 94, y0: 84, x1: 105, y1: 84 }, { x0: 104, y0: 81, x1: 115, y1: 81 },
  { x0: 114, y0: 78, x1: 123, y1: 78 }, { x0: 122, y0: 75, x1: 146, y1: 75 }, { x0: 142, y0: 66, x1: 160, y1: 66 }];
/** tree-lined roads: the Appia out of town, the coast road of Vindicio, the Appia along the bay, the road to Gianola */
export const AVENUES: (Rect & { every: number })[] = [
  { x0: 0, y0: 83, x1: 50, y1: 95, every: 3 }, { x0: 24, y0: 95, x1: 64, y1: 95, every: 3 },
  { x0: 188, y0: 45, x1: 282, y1: 49, every: 3 }, { x0: 274, y0: 48, x1: 280, y1: 70, every: 3 }
];
/** zebra crossings: where the side streets meet Via Vitruvio and the lungomare */
export const ZEBRAS: Rect[] = [
  { x0: 46, y0: 98, x1: 46, y1: 100 }, { x0: 26, y0: 118, x1: 28, y1: 118 },
  { x0: 24, y0: 131, x1: 26, y1: 131 }, { x0: 12, y0: 150, x1: 14, y1: 150 },
  { x0: 99, y0: 84, x1: 99, y1: 85 }, { x0: 118, y0: 78, x1: 118, y1: 79 }, { x0: 130, y0: 75, x1: 130, y1: 76 },
  { x0: 128, y0: 83, x1: 128, y1: 85 }, { x0: 151, y0: 66, x1: 151, y1: 67 }, { x0: 158, y0: 66, x1: 158, y1: 67 },
  { x0: 160, y0: 62, x1: 161, y1: 62 }, { x0: 169, y0: 54, x1: 169, y1: 55 }, { x0: 178, y0: 54, x1: 178, y1: 55 },
  { x0: 154, y0: 72, x1: 154, y1: 73 }, { x0: 241, y0: 46, x1: 241, y1: 47 },
  /* Largo Paone: in front of the tobacconist, across the lungomare to the port; via Emanuele Filiberto at San Giovanni */
  { x0: 157, y0: 66, x1: 157, y1: 67 }, { x0: 153, y0: 80, x1: 153, y1: 81 }, { x0: 159, y0: 57, x1: 159, y1: 58 }, { x0: 176, y0: 54, x1: 176, y1: 55 }
];
/** the centre is paved: pavements along its streets, no scraps of grass between them */
export const URBAN: Rect[] = [
  /* Pavements in front of the homes on upper Via Acervara and Via Remigio Paone. */
  { x0: 39, y0: 83, x1: 44, y1: 85 }, { x0: 58, y0: 81, x1: 63, y1: 83 },
  { x0: 76, y0: 61, x1: 186, y1: 92 }, { x0: 150, y0: 44, x1: 190, y1: 60 }];
/** Castellone, the old borgo: stone everywhere between its houses; and the polygonal walls along its edge */
export const BORGO: Rect = { x0: 77, y0: 66, x1: 113, y1: 90 };
export const WALLS: XY[][] = [[[77, 66], [77, 70]], [[77, 72], [77, 74]], [[77, 76], [77, 81]], [[78, 66], [83, 66]], [[94, 66], [99, 66]], [[101, 66], [107, 66]], [[109, 66], [112, 66]]];
/** the stairs of Castellone (17 November 2026): lanes made of steps, from one lane of the borgo down to the next
    («un grande numero di scalini e salite in pietra viva»). They are streets for every rule of the generator, and only
    at the end are drawn as steps */
export const STAIRS: Line[] = [
  { name: 'Via Gradoni del Duomo', w: 1, pts: [[86, 70], [86, 70]] },
  { name: 'Via Gradoni del Duomo', w: 1, pts: [[82, 72], [82, 74]] },
  { name: 'Scalinata della Torre', w: 1, pts: [[88, 72], [88, 74]] },
  { name: 'Vico del Teatro', w: 1, pts: [[80, 77], [80, 79]] },
  { name: 'Vicolo di Sant\'Anna', w: 1, pts: [[98, 74], [98, 75]] },
  { name: 'Via Orticello', w: 1, pts: [[100, 67], [100, 69]] },
  { name: 'Via Traiano', w: 1, pts: [[108, 67], [108, 69]] },
  { name: 'Via del Castello', w: 1, pts: [[101, 77], [101, 79]] },
  { name: 'Via San Giovanni', w: 1, pts: [[106, 75], [106, 77]] },
  { name: 'Via delle Mura Ciclopiche', w: 1, pts: [[110, 75], [110, 77]] },
  { name: 'Via del Pesce', w: 1, pts: [[98, 81], [98, 83]] },
  { name: 'Via Tacito', w: 1, pts: [[80, 83], [80, 85]] },
  { name: 'Vico Antonino Pio', w: 1, pts: [[86, 83], [86, 85]] },
  /* from the station down to Via Lavanga */
  { name: 'Via Orazio', w: 1, pts: [[137, 65], [137, 67]] }
];
/** the cobbled lanes inside these have street lamps too */
export const LAMPLIT: Rect[] = [{ x0: 77, y0: 66, x1: 113, y1: 90 }, { x0: 156, y0: 10, x1: 176, y1: 22 }];
/** Maranola, up in the Aurunci: its square (the generator paves it and clears the trees around) */
export const MARANOLA: Rect = { x0: 160, y0: 14, x1: 171, y1: 17 };
