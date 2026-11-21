/* The wind over the gulf (Antonio, 21 November 2026: the windsurf with more to it). It changes every few minutes of the
   real clock, the same for everyone at the same moment, among the winds that have a name on this coast: most often the
   libeccio and the ponente from the sea, sometimes the maestrale, the scirocco, the tramontana. Over it, now and then, a
   gust. From the wind and the way the board goes, the point of sail: running before it, a broad reach (the fastest), a
   beam reach, close-hauled, and straight into it, where a board barely moves and one has to tack.
   Only arithmetic of the clock: story/movement.ts sails with it, ui/sea.ts shows it, render/world-view.ts draws it. */
import type { Dir } from '../data/maps/types';

export interface Wind {
  /** its Italian name, and where it blows from, in degrees from north */
  name: string; from: number;
  /** where it blows to, on the map (x east, y south), one tile long */
  to: [number, number];
  /** 0.35 (a breeze) to 1 (a stiff wind), and the gust over it now (0–1) */
  strength: number; gust: number;
}
const NAMES: { name: string; from: number; w: number }[] = [
  { name: 'Libeccio', from: 225, w: 28 }, { name: 'Ponente', from: 270, w: 18 }, { name: 'Maestrale', from: 315, w: 14 },
  { name: 'Scirocco', from: 135, w: 14 }, { name: 'Tramontana', from: 0, w: 10 }, { name: 'Grecale', from: 45, w: 6 },
  { name: 'Levante', from: 90, w: 5 }, { name: 'Ostro', from: 180, w: 5 }
];
/** how long a wind lasts, in ms */
export const WIND_SPELL = 5 * 60 * 1000;
function hash(n: number, k: number) { var h = Math.imul(n | 0, 374761393) + Math.imul(k, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function windAt(ms: number): Wind {
  var spell = Math.floor(ms / WIND_SPELL), total = 0, k;
  for (k = 0; k < NAMES.length; k++) total += NAMES[k].w;
  var pick = hash(spell, 1) * total, n = NAMES[0];
  for (k = 0; k < NAMES.length; k++) { pick -= NAMES[k].w; if (pick < 0) { n = NAMES[k]; break; } }
  var to = (n.from + 180) * Math.PI / 180, strength = 0.35 + hash(spell, 2) * 0.65;
  /* a gust every nine seconds or so, a couple of seconds long; stronger winds gust harder */
  var t = ms / 1000, gust = Math.pow(Math.max(0, Math.sin(t * 0.68 + hash(spell, 3) * 6.28)), 14) * (0.5 + strength * 0.5);
  return { name: n.name, from: n.from, to: [Math.sin(to), -Math.cos(to)], strength: strength, gust: gust };
}
export type PointOfSail = 'poppa' | 'lasco' | 'traverso' | 'bolina' | 'controvento';
const DV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
/** the angle between the way the board goes and the way the wind blows: 0 running before it, 180 straight into it */
export function windAngle(d: Dir, w: Wind): number {
  var v = DV[d], c = v[0] * w.to[0] + v[1] * w.to[1];
  return Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI;
}
export function pointOfSail(d: Dir, w: Wind): PointOfSail { return sailOf(windAngle(d, w)); }
/** the same for any heading, not only the four of the keys: a zig-zag up and left sails north-west */
export function headingSail(v: [number, number], w: Wind): PointOfSail {
  var n = Math.hypot(v[0], v[1]) || 1, c = (v[0] * w.to[0] + v[1] * w.to[1]) / n;
  return sailOf(Math.acos(Math.max(-1, Math.min(1, c))) * 180 / Math.PI);
}
function sailOf(a: number): PointOfSail {
  return a <= 30 ? 'poppa' : a <= 75 ? 'lasco' : a <= 110 ? 'traverso' : a <= 150 ? 'bolina' : 'controvento';
}
/** how long a tile takes on the windsurf in each gear, before the point of sail and the strength of the wind */
export const BOARD = [150, 118, 94, 76, 62, 54];
/** the top gear on a point of sail of `gears`, in a wind of `strength` (the racing sail of Nicola: one more) */
export function boardTop(gears: number, strength: number, race: number): number { return Math.min(BOARD.length - 1, Math.round((gears - 1) * (0.55 + 0.45 * strength)) + race); }
/** a new heading close enough to the last that the board keeps its speed: a tack, a curve, not a turn */
export function steadyHeading(a: [number, number], b: [number, number]): boolean { return a[0] * b[0] + a[1] * b[1] >= 0.64 * Math.hypot(a[0], a[1]) * Math.hypot(b[0], b[1]); }
/** how fast a board goes on each point of sail, and how many gears it can pick up there (of the six of WIND) */
export const SAIL: Record<PointOfSail, { speed: number; gears: number; label: string }> = {
  poppa: { speed: 0.85, gears: 4, label: 'in poppa' },
  lasco: { speed: 1.15, gears: 6, label: 'al lasco' },
  traverso: { speed: 1.05, gears: 5, label: 'al traverso' },
  bolina: { speed: 0.7, gears: 3, label: 'di bolina' },
  controvento: { speed: 0.32, gears: 1, label: 'controvento' }
};
