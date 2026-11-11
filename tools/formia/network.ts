/* Geographic street centre lines from the checked-in OSM extract. North is up; urban tiles are 20 m.
   Roads may bend: the generator rasterises each segment as a connected, four-neighbour supercover.
   The short approach to the Redentore is deliberately compressed (see formia-projection.ts). */
import fs from 'node:fs';
import { tile, col, row } from '../../src/data/maps/formia-projection';
export type XY = [number, number];
export interface Line {
  name: string;
  w: 1 | 2;
  pts: XY[];
  ch?: string;
}
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
interface Road {
  hw: string;
  name: string;
  tunnel: boolean;
  pts: [number, number][];
}
const osm = JSON.parse(fs.readFileSync(new URL('./osm-extract.json', import.meta.url), 'utf8')) as {
  roads: Road[];
  rail: { tunnel: boolean; usage: string; pts: [number, number][] }[];
};
const inTown = (p: [number, number]) => p[0] < 41.275 && p[1] >= 13.566 && p[1] <= 13.7258;
const points = (pts: [number, number][]): XY[] => pts.map(([a, b]) => [col(b), row(a)]);
export const STREETS: Line[] = osm.roads
  .filter((r) => r.name && !/footway|path|steps|track|cycleway|proposed/.test(r.hw) && r.pts.some(inTown))
  .map((r) => ({ name: r.name, w: 1, pts: points(r.pts) }));
export const RAIL_LINES: Line[] = osm.rail
  .filter((r) => r.usage === 'main' && !r.tunnel && r.pts.some(inTown))
  .map((r) => ({ name: 'Roma–Napoli', w: 1, pts: points(r.pts) }));
export const RAIL: XY[] = RAIL_LINES.flatMap((r) => r.pts);
export const PATHS: Line[] = osm.roads
  .filter((r) => /footway|path|steps|pedestrian/.test(r.hw) && r.pts.some(inTown))
  .map((r) => ({
    name: r.name || 'Passaggio pedonale',
    w: 1,
    pts: points(r.pts),
    ch: r.hw === 'steps' ? 'H' : ',',
  }));
const p = tile;
export const TRAILS: Line[] = [
  { name: 'Salita a Maranola', w: 1, pts: [p(41.27, 13.62), [270, 40], [270, 28], [285, 28], [285, 22]] },
  {
    name: 'Strada della Statua',
    w: 1,
    pts: [
      [285, 22],
      [285, 19],
      [275, 19],
      [275, 15],
      [290, 15],
      [290, 11],
      [298, 11],
      [298, 8],
      [287, 8],
      [287, 6],
      [300, 6],
      [300, 3],
    ],
  },
  {
    name: 'Sentiero dell’Acervara',
    w: 1,
    pts: [p(41.2522, 13.579), p(41.2534, 13.579), p(41.2534, 13.5763)],
  },
  {
    name: 'Sentiero di Gianola',
    w: 1,
    pts: [p(41.2528, 13.67), p(41.2514, 13.67), p(41.2514, 13.668), p(41.25, 13.668)],
  },
];
export const TERRACES: (Rect & { name: string; olives?: boolean })[] = [
  { name: 'Aurunci, uliveti', x0: 271, y0: 17, x1: 307, y1: 20, olives: true },
  { name: 'Redentore', x0: 284, y0: 3, x1: 303, y1: 8 },
  { name: 'Acervara', x0: 38, y0: 141, x1: 65, y1: 145, olives: true },
  { name: 'Gianola', x0: 420, y0: 151, x1: 440, y1: 164 },
];
export const SCARPS: { name: string; ch: '^' | '['; pts: XY[] }[] = [
  {
    name: 'Aurunci',
    ch: '^',
    pts: [
      [271, 21],
      [307, 21],
    ],
  },
  {
    name: 'Redentore',
    ch: '^',
    pts: [
      [284, 9],
      [303, 9],
    ],
  },
  {
    name: 'Acervara',
    ch: '^',
    pts: [
      [38, 146],
      [65, 146],
    ],
  },
  {
    name: 'Gianola',
    ch: '^',
    pts: [
      [420, 158],
      [438, 158],
    ],
  },
];
export const LEDGES: XY[] = [
  [280, 21],
  [295, 9],
  [60, 146],
  [421, 158],
];
export const MACERE: XY[][] = [];
