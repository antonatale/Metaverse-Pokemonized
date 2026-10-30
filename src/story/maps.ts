import { MAPS, LEGEND } from '../data/maps';
import type { Area, Building, Dir, Ground, LostItem, MapDef, Npc, Sign, Warp } from '../data/maps/types';
import { COVI, type Covo } from '../data/covi';
import { T, hash } from '../render/canvas/draw';
import { st } from '../save/story-progress';

/* The maps as the story uses them: what blocks, who stands where, what is on each tile. No drawing here. */

export const DV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** something on a tile you can use: a door, a sign, a warp */
export type Spot = { kind: 'door'; b: Building } | { kind: 'sign'; s: Sign } | { kind: 'warp'; w: Warp };
export interface Person { n: Npc; x: number; y: number; dir: Dir }
export interface Gull { x: number; y: number; r: number; sp: number; ph: number }
export interface PreparedMap extends MapDef {
  id: string;
  city: string;
  w: number; h: number;
  cell(x: number, y: number): Ground;
  solid: Uint8Array;
  at: Record<string, Spot>;
  people: Person[];
  items: LostItem[];
  areas: Area[];
  gulls: Gull[];
  _p?: boolean;
}

export function key(x: number, y: number): string { return x + ',' + y; }
export function prepare(id: string): PreparedMap {
  var m = MAPS[id] as PreparedMap;
  if (m._p) return m;
  m.id = id; m.city = m.city || id; m.h = m.rows.length; m.w = m.rows[0].length;
  m.cell = function (x, y) {
    if (x < 0 || y < 0 || x >= m.w || y >= m.h) return LEGEND.x;
    return LEGEND[m.rows[y][x]] || LEGEND['.'];
  };
  m.solid = new Uint8Array(m.w * m.h); m.at = {};
  var x, y;
  for (y = 0; y < m.h; y++) for (x = 0; x < m.w; x++) if (m.cell(x, y).solid) m.solid[y * m.w + x] = 1;
  var fill = function (o: { x: number; y: number; w: number; h: number }) { for (var yy = o.y; yy < o.y + o.h; yy++) for (var xx = o.x; xx < o.x + o.w; xx++) m.solid[yy * m.w + xx] = 1; };
  (m.buildings || []).forEach(function (b) {
    fill(b);
    m.at[key(b.door[0], b.door[1])] = { kind: 'door', b: b };
    if (b.to) m.solid[b.door[1] * m.w + b.door[0]] = 0;
  });
  (m.objects || []).forEach(function (o) {
    fill(o);
    (o.open || []).forEach(function (c0) { m.solid[(o.y + c0[1]) * m.w + o.x + c0[0]] = 0; });   /* an arch you can walk through */
  });
  (m.signs || []).forEach(function (s) { m.solid[s.y * m.w + s.x] = 1; m.at[key(s.x, s.y)] = { kind: 'sign', s: s }; });
  (m.warps || []).forEach(function (w) { m.at[key(w.x, w.y)] = { kind: 'warp', w: w }; });
  m.people = (m.npcs || []).map(function (n) { return { n: n, x: n.x, y: n.y, dir: n.dir || 'down' }; });
  m.items = m.items || []; m.areas = m.areas || [];
  /* a few gulls circle over open sea */
  var sea: number[][] = [];
  for (y = 0; y < m.h; y++) for (x = 0; x < m.w; x++) { var L = m.cell(x, y); if (L.g === 'sea' && !L.deco && !L.obj) sea.push([x, y]); }
  m.gulls = [];
  for (var i = 0; !m.inside && sea.length > 20 && i < 5; i++) {
    var t0 = sea[Math.floor(hash(i, 7, 190) * sea.length)];
    m.gulls.push({ x: (t0[0] + 0.5) * T, y: (t0[1] + 0.5) * T, r: 26 + hash(i, 8, 191) * 40, sp: 0.00032 + hash(i, 9, 192) * 0.00028, ph: hash(i, 10, 193) * 6.28 });
  }
  m._p = true;
  return m;
}
export function itemAt(m: PreparedMap, x: number, y: number): LostItem | null { for (var i = 0; i < m.items.length; i++) { var it = m.items[i]; if (it.x === x && it.y === y && !st.found[it.id]) return it; } return null; }
export function allItems(): LostItem[] { var out: LostItem[] = []; Object.keys(MAPS).forEach(function (k) { (MAPS[k].items || []).forEach(function (it) { out.push(it); }); }); return out; }
export function foundItems(): LostItem[] { return allItems().filter(function (it) { return st.found[it.id]; }); }
/** the neighbourhood Antonio is in (the first area that contains him), if any */
export function currentArea(): Area | null {
  if (M.inside) return null;
  for (var i = 0; i < M.areas.length; i++) { var a = M.areas[i]; if (st.x >= a.x && st.x < a.x + a.w && st.y >= a.y && st.y < a.y + a.h) return a; }
  return null;
}
export function areaName(): string {
  if (M.inside) return M.name;
  var a = currentArea();
  return a ? a.name : '';
}
/** is this person around now? some come and go with Antonio's squad */
export function present(p: Person): boolean { return (!p.n.with || st.squad.indexOf(p.n.with) >= 0) && (!p.n.unless || st.squad.indexOf(p.n.unless) < 0) && (!p.n.wild || wildHere(p.n.id)); }
/** wild creatures beaten or caught leave for a while: two minutes, then another one is there */
export const wildGone: Record<string, number> = {};
export function wildHere(id: string): boolean { var t = wildGone[id]; return !t || Date.now() - t > 120000; }
export function personAt(m: PreparedMap, x: number, y: number): Person | null { for (var i = 0; i < m.people.length; i++) { var p = m.people[i]; if (p.x === x && p.y === y && present(p)) return p; } return null; }
export function blocked(m: PreparedMap, x: number, y: number): boolean { return x < 0 || y < 0 || x >= m.w || y >= m.h || m.solid[y * m.w + x] === 1 || !!personAt(m, x, y) || !!itemAt(m, x, y); }
export function cityCovi(city: string): Covo[] { return Object.keys(COVI).filter(function (k) { return COVI[k].city === city; }).map(function (k) { return COVI[k]; }); }
export function hasBadge(cv0: Covo): boolean { return st.badges.indexOf(cv0.badge.id) >= 0; }

/** the map Antonio is on (set when the story opens, and on every door or warp) */
export let M = null as unknown as PreparedMap;
export function setMap(id: string): PreparedMap { M = prepare(id); return M; }

export function route(tx: number, ty: number): Dir[] | null {
  var prev: Record<string, { k: string; d: Dir }> = {}, q = [[st.x, st.y]], seen: Record<string, number> = {};
  seen[key(st.x, st.y)] = 1;
  while (q.length) {
    var p = q.shift()!;
    if (p[0] === tx && p[1] === ty) {
      var out: Dir[] = [], k = key(tx, ty);
      while (prev[k]) { out.unshift(prev[k].d); k = prev[k].k; }
      return out;
    }
    (['up', 'down', 'left', 'right'] as Dir[]).forEach(function (d) {
      var nx = p[0] + DV[d][0], ny = p[1] + DV[d][1], k2 = key(nx, ny), a = M.at[k2];
      if (seen[k2] || blocked(M, nx, ny)) return;
      if (a && (a.kind === 'warp' || a.kind === 'door') && !(nx === tx && ny === ty)) return;
      seen[k2] = 1; prev[k2] = { k: key(p[0], p[1]), d: d }; q.push([nx, ny]);
    });
  }
  return null;
}
