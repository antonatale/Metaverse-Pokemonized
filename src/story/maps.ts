import { MAPS, LEGEND } from '../data/maps';
import type { Area, Building, Dir, Ground, LostItem, MapDef, Npc, Sign, Warp } from '../data/maps/types';
import { COVI, COVO_STEP, type Covo } from '../data/covi';
import { T, hash } from '../render/canvas/draw';
import { st } from '../save/story-progress';
import { darkness, sunset } from './daytime';
import { flag } from './plot';
import type { SpeciesId } from '../data/creatures';
import { HIDINGS, type Hiding } from '../data/encounters';
import { FORMIA_HIDING, FORMIA_SPOT } from '../data/maps/formia-ground';
import { TRAINERS } from '../data/trainers';
import { rivalHere } from './rival';
import { rivalFriend, rivalSpeaker } from './rival-who';
import { shutAt } from './place';
import { LEGENDS } from '../data/legends';
import { firstHuman, homeMons } from './growth';

/* The maps as the story uses them: what blocks, who stands where, what is on each tile. No drawing here. */

export const DV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export const OPP: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

/** something on a tile you can use: a door, a sign, a warp */
export type Spot = { kind: 'door'; b: Building } | { kind: 'sign'; s: Sign } | { kind: 'warp'; w: Warp };
/** someone on the map: on a tile, facing somewhere; a trainer who has seen Antonio has a "!" over his head (since
    `alert`) and walks to him, one tile after the other (`mv`: the step in progress, from that tile) */
export interface Person { n: Npc; x: number; y: number; dir: Dir; alert?: number; mv?: { fx: number; fy: number; t0: number }; path?: [number, number][]; leaving?: boolean }
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
  /** sea tiles near the coast, where a sea creature lets Antonio swim (1), outdoors only */
  shallow?: Uint8Array;
  _p?: boolean;
}

export function key(x: number, y: number): string { return x + ',' + y; }
/** the rival on the map is whoever the rival of this story is (story/rival-who.ts): a friend, drawn and named as such,
    or Tullio with his own look */
function rivalNpc(n: Npc): Npc {
  var o = Object.assign({}, n);
  Object.defineProperties(o, {
    person: { get: function () { return rivalFriend() || undefined; }, enumerable: true, configurable: true },
    look: { get: function () { return rivalFriend() ? undefined : n.look; }, enumerable: true, configurable: true },
    name: { get: function () { return rivalSpeaker(); }, enumerable: true, configurable: true }
  });
  return o;
}
/** where the creatures at home stand in Antonio's flat, clear of the furniture and of the way to the door */
const HOME_SPOTS: [number, number, Dir][] = [[6, 2, 'down'], [8, 2, 'down'], [10, 2, 'left'], [7, 3, 'right'], [10, 5, 'left'], [3, 4, 'down']];
/** the creature waiting at home on a spot, if any */
export function petAt(i: number) { return homeMons()[i] || null; }
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
  m.people = (m.npcs || []).map(function (n) { var r = n.trainer && TRAINERS[n.trainer] && TRAINERS[n.trainer].rival ? rivalNpc(n) : n; return { n: r, x: n.x, y: n.y, dir: n.dir || 'down' }; });
  /* Antonio's flat keeps the creatures that are not travelling with him: one on each of these tiles, if there */
  if (id === 'casa' || id.indexOf('casa-') === 0) (m.homeSpots || HOME_SPOTS).forEach(function (c, i) {
    m.people.push({ n: { id: 'pet-' + i, x: c[0], y: c[1], pet: i, dir: c[2] }, x: c[0], y: c[1], dir: c[2] });
  });
  m.items = m.items || []; m.areas = m.areas || [];
  /* shallow water: the sea up to two tiles from anything that is not sea (rocks in the water excepted) */
  if (!m.inside) {
    m.shallow = new Uint8Array(m.w * m.h);
    var isSea = function (xx: number, yy: number) { var c0 = m.cell(xx, yy); return c0.g === 'sea'; };
    for (y = 0; y < m.h; y++) for (x = 0; x < m.w; x++) {
      var c1 = m.cell(x, y);
      if (c1.g !== 'sea' || c1.deco) continue;
      near: for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) {
        var xx = x + dx, yy = y + dy;
        if (xx >= 0 && yy >= 0 && xx < m.w && yy < m.h && !isSea(xx, yy)) { m.shallow[y * m.w + x] = 1; break near; }
      }
    }
  }
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
/* out in the open gulf, past the shallow water, the corner names the sea */
const GULF: Area = { name: 'Il golfo di Gaeta', x: 0, y: 0, w: 0, h: 0, note: 'Il largo: da qui Formia si vede intera, dal porto a Gianola, sotto gli Aurunci.' };
export function currentArea(): Area | null {
  if (M.inside) return null;
  if (M.id === 'formia' && M.cell(st.x, st.y).g === 'sea' && !isShallow(M, st.x, st.y)) return GULF;
  for (var i = 0; i < M.areas.length; i++) { var a = M.areas[i]; if (st.x >= a.x && st.x < a.x + a.w && st.y >= a.y && st.y < a.y + a.h) return a; }
  return null;
}
export function areaName(): string {
  if (M.inside) return M.name;
  var a = currentArea();
  return a ? a.name : '';
}
/** is this person around now? some come and go with Antonio's squad */
export function present(p: Person): boolean {
  var w = p.n.when;
  if (p.leaving) return true;   /* a beaten rival, walking away */
  if (p.n.pet != null) return !!petAt(p.n.pet);
  if (p.n.person && p.n.person === firstHuman()) return false;
  /* Nicola walking with the player is not at the Eclipse */
  if (p.n.id === 'nicola' && st.companion === 'nicola') return false;
  return (!p.n.with || st.squad.indexOf(p.n.with) >= 0) && (!p.n.unless || st.squad.indexOf(p.n.unless) < 0) && (!p.n.beaten || !!st.beaten[p.n.beaten]) && (!p.n.wild || wildHere(p.n.id)) && (!p.n.legend || legendHere(p.n)) &&
    (!p.n.trainer || !TRAINERS[p.n.trainer] || !TRAINERS[p.n.trainer].rival || rivalHere(p.n.trainer)) &&
    (!w || ((!w.after || flag(w.after)) && (!w.until || !flag(w.until))));
}
/** a legend comes out at its hour, once the story has got that far, until it is caught (data/legends.ts). Sunset is also
    dawn, the hour between day and night. Down in a place of its own it waits for Antonio at any hour */
function legendHere(n: Npc): boolean {
  var L = LEGENDS[n.legend!];
  if (st.dex && st.dex[L.sp] === 2) return false;
  if (L.trial && M && M.id === L.trial.to) return true;
  return flag(L.after) && (L.hour === 'sunset' ? sunset(new Date()) > 0.3 : darkness(new Date()) > 0.5);
}
/** the wild creature on a spot right now: some come out only at night (the little owls), when the cicadas sleep */
export function wildNow(n: Npc): { sp: SpeciesId; lv: [number, number] } | null {
  if (!n.wild) return null;
  return n.wild.night && darkness(new Date()) > 0.5 ? n.wild.night : n.wild;
}
/** the hiding place of wild creatures Antonio is standing in (tall grass, rock pools), with its table, or null */
export function hidingAt(x: number, y: number): Hiding | null {
  /* a place with its own creatures: anywhere inside */
  if (M.meet) return HIDINGS[M.meet] || null;
  if (M.id !== 'formia') return null;
  /* in the water, and up on the walls, other creatures live */
  if (moveMode.swim && M.cell(x, y).g === 'sea') return (isShallow(M, x, y) ? HIDINGS.mare : HIDINGS.largo) || null;
  if (moveMode.climb && isWall(M, x, y)) return HIDINGS.mura || null;
  var d = M.cell(x, y).deco;
  if (d !== 'tall' && d !== 'pools') return null;
  var best: Hiding | null = null, bd = Infinity;
  FORMIA_HIDING.forEach(function (h) {
    var k = Math.hypot(h.x - x, h.y - y);
    if (k <= h.r + 2 && k < bd && HIDINGS[h.id]) { bd = k; best = HIDINGS[h.id]; }
  });
  return best;
}
/** wild creatures beaten or caught leave for a while: two minutes, then another one is there */
export const wildGone: Record<string, number> = {};
export function wildHere(id: string): boolean { var t = wildGone[id]; return !t || Date.now() - t > 120000; }
export function personAt(m: PreparedMap, x: number, y: number): Person | null { for (var i = 0; i < m.people.length; i++) { var p = m.people[i]; if (p.x === x && p.y === y && present(p)) return p; } return null; }
/* ---------- the scooter (a blue Liberty with its top case): one, and it stays where it is left ----------
   Until it is ridden for the first time it stands by the home of whoever is played. Parked, it is in the way like
   anything else; ridden, it goes wherever a wheel goes: not up steps, not on sand, not through tall grass or rock
   pools, not down a ledge, not through a door. */
export interface Moto { map: string; x: number; y: number; dir: Dir }
export function moto(): Moto {
  if (st.moto) return st.moto;
  var s = FORMIA_SPOT['motorino-' + firstHuman()] || FORMIA_SPOT.motorino;
  return { map: 'formia', x: s[0], y: s[1], dir: 'left' };
}
/** the scooter is parked on this tile */
export function motoAt(m: PreparedMap, x: number, y: number): boolean {
  if (st.sella || m.inside) return false;
  var p = moto();
  return p.map === m.id && p.x === x && p.y === y;
}
/** Nicola's van, parked on this map (story/van.ts): three tiles along it seen from the side, two from in front or behind */
export function vanAt(m: PreparedMap, x: number, y: number): boolean {
  var v = st.van;
  if (!v || v.map !== m.id || m.inside) return false;
  return v.dir === 'left' || v.dir === 'right' ? y === v.y && Math.abs(x - v.x) <= 1 : x === v.x && (y === v.y || y === v.y - 1);
}
/** a tile the scooter can go on (it must be free too: see blocked) */
export function rideable(m: PreparedMap, x: number, y: number): boolean {
  var c = m.cell(x, y), a = m.at[key(x, y)];
  if (c.g === 'steps' || c.g === 'sand' || c.g === 'sea' || c.g === 'mura' || c.g === 'pier') return false;
  if (c.deco === 'tall' || c.deco === 'pools' || c.deco === 'ledge' || c.deco === 'ford') return false;
  return !(a && (a.kind === 'door' || a.kind === 'warp'));
}
/** swimming with a sea creature, or climbing the walls with one of the walls: then water, or walls, can be walked */
export const moveMode = { swim: false, climb: false, board: false };
export function isShallow(m: PreparedMap, x: number, y: number): boolean { return !!m.shallow && x >= 0 && y >= 0 && x < m.w && y < m.h && m.shallow[y * m.w + x] === 1; }
/** open water out in town, near the shore or far out: swimming, the whole gulf can be crossed (not the rocks, the
    boats at their moorings, the buoys) */
export function isSea(m: PreparedMap, x: number, y: number): boolean {
  if (m.inside || x < 0 || y < 0 || x >= m.w || y >= m.h) return false;
  var c = m.cell(x, y);
  return c.g === 'sea' && !c.deco && !c.obj && !m.at[key(x, y)];
}
/** walls that can be climbed: out in town only, like the water. Indoors a wall is a wall, or a place could be walked around */
export function isWall(m: PreparedMap, x: number, y: number): boolean { return !m.inside && m.cell(x, y).g === 'mura'; }
export function blocked(m: PreparedMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= m.w || y >= m.h) return true;
  if (m.solid[y * m.w + x] === 1 && !(moveMode.swim && isSea(m, x, y)) && !(moveMode.climb && isWall(m, x, y))) return true;
  if (motoAt(m, x, y) || vanAt(m, x, y)) return true;
  if (m.place && shutAt(m.place, (st.places && st.places[m.id] && st.places[m.id].flags) || {}, x, y)) return true;
  return !!personAt(m, x, y) || !!itemAt(m, x, y);
}
/** at the bottom of one of the Roman fish tanks of Gianola, an amphora: found swimming there */
export function treasureAt(m: PreparedMap): [number, number] | null {
  var s0 = m.id === 'formia' ? FORMIA_SPOT['sign-porticciolo'] : null;
  if (!s0) return null;
  for (var r = 0; r < 4; r++) for (var dy = -r; dy <= r; dy++) for (var dx = -r; dx <= r; dx++) {
    var x = s0[0] - 2 + dx, y = s0[1] + 1 + dy;
    if (isShallow(m, x, y)) return [x, y];
  }
  return null;
}
/** the covi of a city for whoever is played: his own is not there for him */
export function cityCovi(city: string): Covo[] {
  var me = firstHuman();
  return Object.keys(COVI).filter(function (k) { return COVI[k].city === city && COVI[k].leader !== me; }).map(function (k) { return COVI[k]; });
}
/** a covo's level now: its base, and COVO_STEP more for every other pin of its city already won */
export function covoLevel(id: string): number { return COVI[id].level + COVO_STEP * covoPins(id); }
/** how many pins of its city are already won, besides its own: it says the covo's level and how many creatures */
export function covoPins(id: string): number {
  var cv0 = COVI[id];
  return cityCovi(cv0.city).filter(function (c) { return c !== cv0 && hasBadge(c); }).length;
}
export function hasBadge(cv0: Covo): boolean { return st.badges.indexOf(cv0.badge.id) >= 0; }

/** the map Antonio is on (set when the story opens, and on every door or warp) */
export let M = null as unknown as PreparedMap;
export function setMap(id: string): PreparedMap { M = prepare(id); return M; }

/** the tiles someone walks from a tile, to one next to a target (`beside`) or onto it: the shortest way, not
    through doors or warps, within a few tiles; null when there is none */
export function walkPath(fx: number, fy: number, tx: number, ty: number, beside: boolean): [number, number][] | null {
  var prev: Record<string, string> = {}, q: [number, number][] = [[fx, fy]], seen: Record<string, number> = {};
  seen[key(fx, fy)] = 1;
  while (q.length) {
    var p = q.shift()!, d0 = Math.abs(p[0] - tx) + Math.abs(p[1] - ty);
    if (beside ? d0 === 1 : d0 === 0) {
      var out: [number, number][] = [], k = key(p[0], p[1]);
      while (prev[k]) { var c = k.split(','); out.unshift([+c[0], +c[1]]); k = prev[k]; }
      return out;
    }
    if (Math.abs(p[0] - fx) + Math.abs(p[1] - fy) > 14) continue;
    (['up', 'down', 'left', 'right'] as Dir[]).forEach(function (d) {
      var nx = p[0] + DV[d][0], ny = p[1] + DV[d][1], k2 = key(nx, ny), a = M.at[k2];
      if (seen[k2] || (nx === st.x && ny === st.y) || a || blocked(M, nx, ny)) return;
      seen[k2] = 1; prev[k2] = key(p[0], p[1]); q.push([nx, ny]);
    });
  }
  return null;
}
/** the way away from Antonio: up to a few steps, to the reachable tile farthest from him */
export function walkAway(fx: number, fy: number, steps: number): [number, number][] {
  var prev: Record<string, string> = {}, q: [number, number, number][] = [[fx, fy, 0]], seen: Record<string, number> = {}, best = key(fx, fy), bd = -1;
  seen[best] = 1;
  while (q.length) {
    var p = q.shift()!, d0 = Math.abs(p[0] - st.x) + Math.abs(p[1] - st.y);
    if (d0 > bd) { bd = d0; best = key(p[0], p[1]); }
    if (p[2] >= steps) continue;
    (['up', 'down', 'left', 'right'] as Dir[]).forEach(function (d) {
      var nx = p[0] + DV[d][0], ny = p[1] + DV[d][1], k2 = key(nx, ny);
      if (seen[k2] || (nx === st.x && ny === st.y) || M.at[k2] || blocked(M, nx, ny)) return;
      seen[k2] = 1; prev[k2] = key(p[0], p[1]); q.push([nx, ny, p[2] + 1]);
    });
  }
  var out: [number, number][] = [], k = best;
  while (prev[k]) { var c = k.split(','); out.unshift([+c[0], +c[1]]); k = prev[k]; }
  return out;
}
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
      var nx = p[0] + DV[d][0], ny = p[1] + DV[d][1];
      /* down a terrace where one can jump: one step, two tiles (story/movement.ts) */
      if (d === 'down' && M.cell(nx, ny).deco === 'ledge') ny++;
      var k2 = key(nx, ny), a = M.at[k2];
      if (seen[k2] || blocked(M, nx, ny)) return;
      if (a && (a.kind === 'warp' || a.kind === 'door') && !(nx === tx && ny === ty)) return;
      seen[k2] = 1; prev[k2] = { k: key(p[0], p[1]), d: d }; q.push([nx, ny]);
    });
  }
  return null;
}
