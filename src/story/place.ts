import type { Dir, PlaceDef, Thing } from '../data/maps/types';

/* The rules of a place with a puzzle, and the proof that it can be finished. Pure: no drawing, no save, no map of the
   game. The game walks with these same functions (story/place-run.ts) and the validator explores with them, so what the
   validator proves is what the player plays; there is no second copy of the rules to go out of step. */

const DV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIRS: Dir[] = ['up', 'down', 'left', 'right'];

/** all that matters about someone in a place: the tile, the steps taken, what is switched on, the last rest */
export interface Walker { x: number; y: number; tick: number; flags: Record<string, boolean>; rest: [number, number] | null }
/** what blocks, apart from the gates: walls, people, things on the map */
export type Solid = (x: number, y: number) => boolean;

export function startOf(p: PlaceDef): Walker { return { x: p.entry[0], y: p.entry[1], tick: 0, flags: {}, rest: null }; }
export function thingsAt(p: PlaceDef, x: number, y: number): Thing[] { return p.things.filter(function (t) { return t.x === x && t.y === y; }); }
/** a gate that stands closed, with these flags */
export function gateShut(t: Extract<Thing, { k: 'gate' }>, flags: Record<string, boolean>): boolean { return t.open ? !!flags[t.flag] : !flags[t.flag]; }
export function shutAt(p: PlaceDef, flags: Record<string, boolean>, x: number, y: number): boolean {
  return thingsAt(p, x, y).some(function (t) { return t.k === 'gate' && gateShut(t, flags); });
}
/** a beat at this step: dangerous or not */
export function beatOn(t: Extract<Thing, { k: 'beat' }>, tick: number): boolean { return t.on.indexOf(tick % t.every) >= 0; }

/** what a tile does to whoever has just stepped on it */
export interface Arrival {
  /** the walker afterwards */
  w: Walker;
  /** something switched: the flag and how it is now */
  plate?: { flag: string; on: boolean };
  /** the flags were cleared */
  reset?: boolean;
  /** a new place to come back to */
  rested?: boolean;
  /** the floor carries it on, this way */
  slide?: Dir;
  /** taken to another tile */
  pad?: { x: number; y: number; dir?: Dir };
  /** caught by a beat: back to the last rest */
  hit?: boolean;
}
export function arrive(p: PlaceDef, w: Walker): Arrival {
  const out: Arrival = { w: w }, things = thingsAt(p, w.x, w.y);
  /* the tile may hold more than one thing: each works on what the one before has left */
  for (const t of things) {
    if (t.k === 'beat' && beatOn(t, w.tick)) {
      const back = w.rest || [p.entry[0], p.entry[1]];
      out.hit = true;
      out.w = { x: back[0], y: back[1], tick: w.tick, flags: w.flags, rest: w.rest };
      return out;
    }
  }
  for (const t of things) {
    if (t.k === 'plate') {
      const now = out.w, on = t.once ? true : !now.flags[t.flag];
      if (on === !!now.flags[t.flag]) continue;
      const flags = Object.assign({}, now.flags);
      if (on) flags[t.flag] = true; else delete flags[t.flag];
      out.w = Object.assign({}, now, { flags: flags });
      out.plate = { flag: t.flag, on: on };
    } else if (t.k === 'reset') {
      if (Object.keys(out.w.flags).length) { out.w = Object.assign({}, out.w, { flags: {} }); out.reset = true; }
    } else if (t.k === 'rest') {
      if (!out.w.rest || out.w.rest[0] !== t.x || out.w.rest[1] !== t.y) { out.w = Object.assign({}, out.w, { rest: [t.x, t.y] }); out.rested = true; }
    } else if (t.k === 'slide') out.slide = t.dir;
    else if (t.k === 'pad') {
      out.pad = { x: t.tx, y: t.ty, dir: t.tdir };
      out.w = Object.assign({}, out.w, { x: t.tx, y: t.ty });
    }
  }
  return out;
}
/** the next tile that way, if it can be walked with these flags */
export function stepTo(p: PlaceDef, solid: Solid, w: Walker, d: Dir): Walker | null {
  const x = w.x + DV[d][0], y = w.y + DV[d][1];
  if (solid(x, y) || shutAt(p, w.flags, x, y)) return null;
  return { x: x, y: y, tick: w.tick + 1, flags: w.flags, rest: w.rest };
}
/** a whole move from where the walker stands: the step, and everything the floor does after it, up to where it stops.
    Null if the way is blocked. `stuck`: a floor that carries round in a circle for ever, which is a mistake in the map */
export function walk(p: PlaceDef, solid: Solid, w: Walker, d: Dir): { w: Walker; stuck?: boolean } | null {
  let cur = stepTo(p, solid, w, d);
  if (!cur) return null;
  for (let guard = 0; guard < 200; guard++) {
    const a = arrive(p, cur);
    cur = a.w;
    if (!a.slide) return { w: cur };
    const next = stepTo(p, solid, cur, a.slide);
    if (!next) return { w: cur };
    cur = next;
  }
  return { w: cur, stuck: true };
}

/* ---------- the validator ---------- */
/** the step counts that repeat: everything about the beats comes round again after this many steps */
function cycle(p: PlaceDef): number {
  const gcd = function (a: number, b: number): number { return b ? gcd(b, a % b) : a; };
  return p.things.reduce(function (l, t) { return t.k === 'beat' ? l * t.every / gcd(l, t.every) : l; }, 1);
}
function nodeKey(w: Walker, loop: number): string { return [w.x, w.y, w.tick % loop, Object.keys(w.flags).sort().join('+'), w.rest ? w.rest.join(',') : ''].join('|'); }
function atGoal(p: PlaceDef, solid: Solid, w: Walker): boolean {
  const dx = Math.abs(w.x - p.goal[0]), dy = Math.abs(w.y - p.goal[1]);
  return dx + dy === 0 || (dx + dy === 1 && solid(p.goal[0], p.goal[1]));
}
export interface Proof {
  /** it can be finished */
  ok: boolean;
  /** states explored */
  states: number;
  /** the shortest way, from the entry, as moves */
  way: Dir[];
  /** states from which the goal can no longer be reached: a player there is stuck for good */
  dead: Walker[];
  /** things nothing ever touches: a plate nobody can step on, a gate that never opens, a floor out of reach */
  unused: Thing[];
  /** a floor that carries round in a circle */
  stuck: Walker[];
}
/** explores every state of a place, walking with the game's own rules, and proves that the goal can be reached from
    the entry and from everywhere the player can get to; a place that fails this must not ship */
export function prove(p: PlaceDef, solid: Solid): Proof {
  const loop = cycle(p), start = startOf(p), seen: Record<string, number> = {}, nodes: Walker[] = [start], from: [number, Dir][] = [[-1, 'up']], back: number[][] = [[]];
  const stuck: Walker[] = [], touched = new Set<Thing>();
  seen[nodeKey(start, loop)] = 0;
  const touch = function (w: Walker) { thingsAt(p, w.x, w.y).forEach(function (t) { touched.add(t); }); };
  touch(start);
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    for (const d of DIRS) {
      const r = walk(p, solid, n, d);
      if (!r) {
        /* a gate met shut still counts as met; whether it ever opens is seen below */
        continue;
      }
      if (r.stuck) { stuck.push(r.w); continue; }
      /* everything on the way counts as touched: tiles of a slide, and the beat that caught it */
      let c = stepTo(p, solid, n, d);
      for (let g = 0; c && g < 200; g++) { touch(c); const a = arrive(p, c); if (!a.slide) break; c = stepTo(p, solid, a.w, a.slide); }
      touch(r.w);
      const k = nodeKey(r.w, loop);
      let at = seen[k];
      if (at === undefined) { at = nodes.length; seen[k] = at; nodes.push(r.w); from.push([i, d]); back.push([]); }
      back[at].push(i);
    }
  }
  /* backwards from every state at the goal: what is not reached cannot get there any more */
  const good = new Array<boolean>(nodes.length).fill(false), q: number[] = [];
  nodes.forEach(function (w, i) { if (atGoal(p, solid, w)) { good[i] = true; q.push(i); } });
  while (q.length) { const i = q.pop()!; back[i].forEach(function (j) { if (!good[j]) { good[j] = true; q.push(j); } }); }
  /* the shortest way: the first state at the goal, found breadth first */
  const way: Dir[] = [], end = nodes.findIndex(function (w) { return atGoal(p, solid, w); });
  for (let i = end; i > 0; i = from[i][0]) way.unshift(from[i][1]);
  const unused = p.things.filter(function (t) {
    if (t.k === 'gate') return !nodes.some(function (w) { return !gateShut(t, w.flags); });
    return !touched.has(t);
  });
  return { ok: end >= 0 && good.every(Boolean) && !stuck.length, states: nodes.length, way: way, dead: nodes.filter(function (w, i) { return !good[i]; }), unused: unused, stuck: stuck };
}
