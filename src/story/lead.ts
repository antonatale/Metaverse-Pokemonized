import type { Dir } from '../data/maps/types';

/* Nicola on the water ahead of the player, at the start of a story: he sails a way round the gulf to Gianola
   (data/nicola.ts, WS_ROUTE), a point at a time, and the player follows him. When the player falls behind he stops
   and waits, turned towards him; when the player is close he goes on, faster the closer the player is. At the end he
   waits off the beach; once the player has landed he sails back alone and fades out at sea. And Faro's hydro pump at
   the Eclipse, the moment Nicola shows how strong his creature is. Only the state and its arithmetic: what is said
   is in ui/nicola.ts, the drawing in render/world-view.ts. */

export interface Lead {
  /** the way, in tiles; and how far along it each point is */
  pts: [number, number][]; cum: number[];
  /** how far he has gone, in tiles; where that is, and which way he faces */
  s: number; x: number; y: number; dir: Dir;
  /** waiting for the player; the last point of the way whose word has been said */
  wait: boolean; said: number;
  /** sailing back alone, from `t0`: he fades out at the end of the way */
  back: boolean; alpha: number;
}
export const lead: { now: Lead | null } = { now: null };

function along(pts: [number, number][]): number[] {
  var cum = [0];
  for (var i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return cum;
}
function place(L: Lead) {
  var i = 1;
  while (i < L.pts.length - 1 && L.cum[i] < L.s) i++;
  var a = L.pts[i - 1], b = L.pts[i], seg = L.cum[i] - L.cum[i - 1] || 1, u = Math.max(0, Math.min(1, (L.s - L.cum[i - 1]) / seg));
  L.x = a[0] + (b[0] - a[0]) * u; L.y = a[1] + (b[1] - a[1]) * u;
  var dx = b[0] - a[0], dy = b[1] - a[1];
  if (!L.wait) L.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'down' : 'up');
}
/** Nicola sets off along the way, from a point of it (the nearest to the player, when a story is opened halfway) */
export function startLead(pts: [number, number][], from?: [number, number]) {
  var L: Lead = { pts: pts, cum: along(pts), s: 0, x: pts[0][0], y: pts[0][1], dir: 'right', wait: false, said: -1, back: false, alpha: 1 };
  if (from) {
    var best = 0, bd = Infinity;
    pts.forEach(function (p, i) { var d = Math.hypot(p[0] - from[0], p[1] - from[1]); if (d < bd) { bd = d; best = i; } });
    L.s = L.cum[best]; L.said = best;
  }
  place(L);
  lead.now = L;
  return L;
}
export function stopLead() { lead.now = null; }
/** the share of the way where he is: the index of the last point passed */
export function passed(L: Lead): number { var i = 0; while (i + 1 < L.cum.length && L.cum[i + 1] <= L.s + 0.01) i++; return i; }
export function atEnd(L: Lead): boolean { return L.s >= L.cum[L.cum.length - 1] - 0.01; }

/** how far ahead he stays: he waits beyond FAR, and goes on again under NEAR */
export const FAR = 8, NEAR = 5;
/** a frame: `dt` seconds, the player at `px`,`py`. Says whether he has just stopped to wait */
export function stepLead(dt: number, px: number, py: number): { stopped: boolean } {
  var L = lead.now;
  if (!L) return { stopped: false };
  var d = Math.hypot(px - L.x, py - L.y), was = L.wait;
  if (L.back) {
    L.s += 7 * dt;
    var end = L.cum[L.cum.length - 1];
    L.alpha = Math.max(0, Math.min(1, (end - L.s) / 6));
    place(L);
    if (L.s >= end) lead.now = null;
    return { stopped: false };
  }
  if (d > FAR) L.wait = true;
  else if (d < NEAR) L.wait = false;
  if (L.wait || atEnd(L)) {
    /* waiting: turned towards the player */
    var dx = px - L.x, dy = py - L.y;
    L.dir = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'down' : 'up');
    return { stopped: L.wait && !was };
  }
  /* faster when the player is right behind him: about as fast as a windsurf that has got going */
  var v = d < 2.5 ? 10 : d < 4 ? 8 : 6;
  L.s = Math.min(L.cum[L.cum.length - 1], L.s + v * dt);
  place(L);
  return { stopped: false };
}
/** at the end, the way back: out to sea and away */
export function sailBack(pts: [number, number][]) {
  var L = lead.now;
  if (!L) return;
  var from: [number, number] = [L.x, L.y];
  L.pts = [from].concat(pts); L.cum = along(L.pts); L.s = 0; L.back = true; L.wait = false;
  place(L);
}

/* ---------- Faro's hydro pump ---------- */
/** the old board in the water in front of the Eclipse, Faro's jet at it, and the board flying off: from `t0` (ms,
    performance.now()), Faro at `from`, the board at `to`, landing at `land` (tiles) */
export interface Pump { t0: number; from: [number, number]; to: [number, number]; land: [number, number] }
export const pump: { now: Pump | null } = { now: null };
/** the moments of it, in ms from the start */
export const PUMP = { charge: 450, jet: 1150, fly: 2300, end: 3100 };
