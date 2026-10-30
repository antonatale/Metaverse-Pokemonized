/* The playable skeleton of the Formia map, drawn by hand on its tiles (165×82, see formia-projection.ts):
   the railway and the streets. Each line is a list of corners and runs straight, along a row or a column,
   from one corner to the next; a 2-wide line takes the corner's row (or column) and the one after it.
   Lines meet at shared tiles, so the streets are one network and the railway is one line, from a tunnel in the
   western hills to the eastern edge, with a level crossing wherever a street crosses it.
   tools/formia/build.ts draws them on the real coast, then sets every place along a street, door on the street.
   The names are the real streets each line stands for. */
export type XY = [number, number];
export interface Line { name: string; w: 1 | 2; pts: XY[]; ch?: string }

/** the railway Roma–Napoli: out of the hill west of town, past the station, up behind Mola and away east */
export const RAIL: XY[] = [[10, 32], [100, 32], [100, 13], [164, 13]];
/** where the railway goes into a hill: a tunnel mouth is drawn on the tile above */
export const TUNNEL_ENDS: XY[] = [[10, 32]];
/** hills painted by hand, as rectangles of tiles (the one the railway goes into, west of town) */
export const HILLS: { x0: number; y0: number; x1: number; y1: number }[] = [{ x0: 0, y0: 26, x1: 10, y1: 37 }];

export const STREETS: Line[] = [
  /* the spine: the Appia from the west edge along the coast to Mola, Via Vitruvio, the lungomare east to Gianola */
  { name: 'Via Appia', w: 2, pts: [[0, 48], [80, 48], [80, 41], [89, 41], [89, 36]] },
  { name: 'Lungomare di Vindicio', w: 2, pts: [[18, 48], [18, 81]] },
  { name: 'Via Vitruvio', w: 2, pts: [[40, 36], [97, 36], [97, 22]] },
  { name: 'Via Rio Fresco', w: 2, pts: [[40, 48], [40, 22]] },
  { name: 'Lungomare Città di Ferrara', w: 2, pts: [[97, 27], [164, 27]] },
  { name: 'Via Gianola', w: 2, pts: [[160, 27], [160, 53]] },
  /* north of the railway: Rio Fresco, Penitro, the road up to Maranola */
  { name: 'Via Rubino', w: 1, pts: [[40, 22], [97, 22]] },
  { name: 'Via Amendola', w: 1, pts: [[97, 22], [164, 22]] },
  { name: 'Via Penitro', w: 1, pts: [[40, 22], [40, 12], [97, 12], [97, 22]] },
  { name: 'Via per Maranola', w: 1, pts: [[70, 22], [70, 0]] },
  { name: 'Via Sant\'Anna', w: 1, pts: [[56, 22], [56, 36]] },
  { name: 'Via della Stazione', w: 1, pts: [[70, 22], [70, 36]] },
  { name: 'Via Abate Tosti', w: 1, pts: [[84, 22], [84, 36]] },
  /* Castellone and the centre */
  { name: 'Via Castellone', w: 1, pts: [[54, 36], [54, 48]] },
  { name: 'Largo Sant\'Erasmo', w: 1, pts: [[54, 45], [66, 45]] },
  { name: 'Via Lavanga', w: 1, pts: [[66, 36], [66, 48]] },
  /* Vindicio: up from the lungomare, and down to the Eclipse and La Scogliera */
  { name: 'Via Vindicio', w: 1, pts: [[28, 48], [28, 36], [40, 36]] },
  { name: 'Via dell\'Eclipse', w: 1, pts: [[18, 60], [40, 60]] },
  { name: 'Via Scogliera', w: 1, pts: [[18, 72], [23, 72]] },
  /* east: Santo Janni, the Bruno Zauli, Via Amendola, Acqualonga */
  { name: 'Via Santo Janni', w: 1, pts: [[104, 27], [104, 18], [132, 18], [132, 27]] },
  { name: 'Via Acqualonga', w: 1, pts: [[148, 22], [148, 27]] },
  { name: 'Via Gramsci', w: 1, pts: [[118, 22], [118, 27]] }
];
/** footpaths (not streets): through the Pineta di Vindicio, from the Appia down to the beach and across */
export const PATHS: Line[] = [
  { name: 'Sentiero della pineta', w: 1, pts: [[48, 50], [48, 57]] },
  { name: 'Sentiero della pineta', w: 1, pts: [[40, 53], [56, 53]] }
];
