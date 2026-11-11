/* The playable skeleton of the Formia map, drawn by hand on its tiles (165×82, see formia-projection.ts):
   the railway and the streets. Each line is a list of corners and runs straight, along a row or a column,
   from one corner to the next; a 2-wide line takes the corner's row (or column) and the one after it.
   Lines meet at shared tiles, so the streets are one network and the railway is one line, from a tunnel in the
   western hills to the eastern edge, with a level crossing wherever a street crosses it.
   tools/formia/build.ts draws them on the real coast, then sets every place along a street, door on the street.
   The names are the real streets each line stands for (matched on their OpenStreetMap positions); the lanes of
   Castellone are cobbled (ch 'v', sampietrini). */
export type XY = [number, number];
export interface Line { name: string; w: 1 | 2; pts: XY[]; ch?: string }

/** the railway Roma–Napoli: out of the hill west of town, past the station, up behind Mola and away east */
export const RAIL: XY[] = [[10, 32], [100, 32], [100, 13], [184, 13], [184, 39], [199, 39]];
/** where the railway goes into a hill: a tunnel mouth is drawn on the tile above */
export const TUNNEL_ENDS: XY[] = [[10, 32]];
/** hills painted by hand, as rectangles of tiles (the one the railway goes into, west of town) */
export const HILLS: { x0: number; y0: number; x1: number; y1: number }[] = [{ x0: 0, y0: 26, x1: 10, y1: 37 }];

export const STREETS: Line[] = [
  /* the spine: the Appia from the west edge along the coast to Mola, Via Vitruvio, the lungomare east to Gianola */
  { name: 'Via Appia', w: 2, pts: [[0, 48], [80, 48], [80, 41], [89, 41], [89, 36]] },
  { name: 'Via Vindicio', w: 2, pts: [[18, 48], [18, 81]] },
  { name: 'Via Vitruvio', w: 2, pts: [[40, 36], [97, 36]] },
  { name: 'Via Abate Tosti', w: 2, pts: [[97, 36], [97, 22]] },
  { name: 'Via Remigio Paone', w: 2, pts: [[40, 48], [40, 22]] },
  /* past Mola the Appia climbs a little away from the bay: between it and the sea, the Villaggio Don Bosco */
  { name: 'Via Appia Lato Napoli', w: 2, pts: [[97, 27], [112, 27], [112, 23], [188, 23], [188, 44], [199, 44]] },
  { name: 'Via Gianola', w: 2, pts: [[160, 23], [160, 53]] },
  /* north of the railway: Rio Fresco, Penitro, the road up to Maranola */
  { name: 'Via Rubino', w: 1, pts: [[40, 22], [97, 22]] },
  { name: 'Via Penitro', w: 1, pts: [[40, 22], [40, 12], [97, 12], [97, 22]] },
  /* the road stops where the mountain begins: from there on it is the mule track (TRAILS) */
  { name: 'Via per Maranola', w: 1, pts: [[70, 22], [70, 12]] },
  { name: 'Via Monte di Mola', w: 1, pts: [[56, 22], [56, 36]] },
  { name: 'Via della Stazione', w: 1, pts: [[70, 22], [70, 36]] },
  { name: 'Via Abate Tosti', w: 1, pts: [[84, 22], [84, 36]] },
  /* Castellone and the centre */
  { name: 'Via Castellone', w: 1, pts: [[54, 36], [54, 48]], ch: 'v' },
  { name: 'Largo Sant\'Erasmo', w: 1, pts: [[54, 45], [66, 45]], ch: 'v' },
  { name: 'Via Lavanga', w: 1, pts: [[66, 36], [66, 48]] },
  /* Vindicio: up from the lungomare, and down to the Eclipse and La Scogliera */
  { name: 'Via Vindicio', w: 1, pts: [[28, 48], [28, 36], [40, 36]] },
  { name: 'Via Tito Scipione', w: 1, pts: [[18, 60], [40, 60]] },
  { name: 'Via Vindicio', w: 1, pts: [[18, 72], [23, 72]] },
  /* east: behind the Appia under the railway, Acqualonga; down to it Via Gramsci, Via Amendola (Antonio's) and Via Santo Janni;
     across the Appia from Antonio's garden, Via San Giovanni Bosco down to the Villaggio Don Bosco */
  { name: 'Via Acqualonga', w: 1, pts: [[97, 15], [188, 15], [188, 23]] },
  { name: 'Via Gramsci', w: 1, pts: [[113, 15], [113, 23]] },
  { name: 'Via Giovanni Amendola', w: 1, pts: [[134, 15], [134, 23]] },
  { name: 'Via Santo Janni', w: 1, pts: [[150, 15], [150, 23]] },
  { name: 'Via San Giovanni Bosco', w: 1, pts: [[128, 25], [128, 28]] }
];
/** footpaths (not streets): through the Pineta di Vindicio, from the Appia down to the beach and across */
export const PATHS: Line[] = [
  { name: 'Sentiero della pineta', w: 1, pts: [[48, 50], [48, 57]] },
  { name: 'Sentiero della pineta', w: 1, pts: [[40, 53], [56, 53]] }
];

/* ---------- Formia on three levels (VISIONE.md, V3 and V4) ----------
   The land rises to the north, from the sea to the Aurunci, so the face of every terrace looks south, at the player.
   A terrace is open ground kept as it is (no houses on it, no wilderness over it); a scarp is the line of its face,
   one tile deep: where a street crosses it the street climbs, where a path or a trail crosses it there are steps;
   a ledge is a tile of a scarp one can jump down from, never up. Everything far from a street, a path or a place,
   inside a WILD zone, is closed: mountain, wooded hill, or olive groves behind their dry-stone walls. */
export interface Rect { x0: number; y0: number; x1: number; y1: number }
/** the mule tracks and footpaths up the terraces */
export const TRAILS: Line[] = [
  /* the Strada della Statua, up the Aurunci from the end of the road to Maranola: two bends, two flights of steps */
  { name: 'Strada della Statua', w: 1, pts: [[70, 11], [70, 6], [58, 6], [58, 3], [68, 3]] },
  /* from the Appia up the slope of the Acervara, where the tomb of Tulliola is */
  { name: 'Sentiero dell\'Acervara', w: 1, pts: [[14, 47], [14, 40], [6, 40]] },
  /* across the promontory of Gianola, through the terraces of the villa and down its covered stairs to the point */
  { name: 'Sentiero di Gianola', w: 1, pts: [[162, 57], [166, 57], [166, 66]] }
];
/** the terraces: both corners included */
export const TERRACES: (Rect & { name: string; olives?: boolean })[] = [
  { name: 'Aurunci, il primo gradone', x0: 46, y0: 5, x1: 94, y1: 7, olives: true },
  { name: 'Aurunci, il secondo gradone', x0: 54, y0: 2, x1: 69, y1: 3 },
  { name: 'Acervara', x0: 0, y0: 38, x1: 26, y1: 42, olives: true },
  { name: 'Gianola, le terrazze della villa', x0: 162, y0: 55, x1: 175, y1: 68 }
];
/** the faces of the terraces: '^' rock, '[' a retaining wall of stone blocks */
export const SCARPS: { name: string; ch: '^' | '['; pts: XY[] }[] = [
  { name: 'Aurunci, il primo gradone', ch: '^', pts: [[45, 8], [95, 8]] },
  { name: 'Aurunci, il secondo gradone', ch: '^', pts: [[53, 4], [70, 4]] },
  { name: 'Acervara', ch: '^', pts: [[0, 43], [27, 43]] },
  { name: 'Il muraglione dell\'Appia', ch: '[', pts: [[0, 50], [56, 50]] },
  { name: 'Gianola, la terrazza bassa', ch: '^', pts: [[162, 62], [170, 62]] }
];
/** dry-stone walls drawn by hand: the one that closes the terrace of the Acervara along Via Vindicio */
export const MACERE: XY[][] = [[[27, 38], [27, 42]]];
/** where one jumps down a scarp: shortcuts on the way back */
export const LEDGES: XY[] = [[56, 8], [64, 4], [20, 43], [30, 50], [168, 62]];
/** the wilderness: inside each zone, the open ground more than `keep` tiles from anything walked on purpose is closed */
export const WILD: (Rect & { kind: 'hill' | 'wood' | 'grove'; keep: number })[] = [
  /* the Aurunci, behind the whole town: down to the railway in the east, to the upper road in the middle */
  { kind: 'hill', x0: 0, y0: 0, x1: 39, y1: 31, keep: 1 },
  { kind: 'hill', x0: 40, y0: 0, x1: 97, y1: 8, keep: 1 },
  { kind: 'hill', x0: 98, y0: 0, x1: 199, y1: 12, keep: 1 },
  /* the slope of the Acervara above its terrace, the woods toward Gaeta */
  { kind: 'hill', x0: 0, y0: 33, x1: 27, y1: 37, keep: 1 },
  { kind: 'wood', x0: 0, y0: 51, x1: 17, y1: 81, keep: 1 },
  /* the olive groves of the east, between the roads and behind the beaches */
  { kind: 'grove', x0: 150, y0: 16, x1: 187, y1: 22, keep: 2 },
  { kind: 'grove', x0: 139, y0: 25, x1: 159, y1: 47, keep: 2 },
  { kind: 'grove', x0: 162, y0: 25, x1: 187, y1: 47, keep: 2 },
  { kind: 'grove', x0: 190, y0: 16, x1: 199, y1: 38, keep: 2 },
  { kind: 'grove', x0: 190, y0: 46, x1: 199, y1: 81, keep: 2 },
  { kind: 'grove', x0: 176, y0: 48, x1: 199, y1: 81, keep: 1 }
];
