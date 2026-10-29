import { describe, expect, it } from 'vitest';
import { MAPS, LEGEND, type MapDef } from '../../src/data/maps';
import { COVI } from '../../src/data/covi';
import { GATES } from '../../src/data/gates';
import { CHARS } from '../../src/data/characters';
import { ITEMS } from '../../src/data/items';
import { prepare, blocked } from '../../src/story/maps';

/* The map checker (it used to be tools/check-maps.js): rows of the same length, known characters,
   and every person, sign, door and lost thing reachable on foot from the start of the story. */

type Dir = 'up' | 'down' | 'left' | 'right';
const DV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const DIRS = Object.keys(DV) as Dir[];
const W = (m: MapDef) => m.rows[0].length, H = (m: MapDef) => m.rows.length;

/** which tiles block: the story mode's own rules (walls, buildings, objects, signs, people, lost things) */
function solidity(m: MapDef) {
  const id = Object.keys(MAPS).find((k) => MAPS[k] === m)!, pm = prepare(id);
  return (x: number, y: number) => blocked(pm, x, y);
}

/** every tile you can stand on, across maps, walking from the start of Formia through doors and warps */
function reachable() {
  const blocked: Record<string, (x: number, y: number) => boolean> = {};
  for (const id of Object.keys(MAPS)) blocked[id] = solidity(MAPS[id]);
  const seen = new Set<string>(), q: [string, number, number][] = [];
  const visit = (map: string, x: number, y: number) => { const k = map + ':' + x + ',' + y; if (!seen.has(k)) { seen.add(k); q.push([map, x, y]); } };
  const s0 = MAPS.formia.start;
  visit('formia', s0[0], s0[1]);
  while (q.length) {
    const [map, x, y] = q.shift()!, m = MAPS[map];
    const door = (m.buildings || []).find((b) => b.to && b.door[0] === x && b.door[1] === y);
    const warp = (m.warps || []).find((w) => w.x === x && w.y === y);
    const jump = door ? [door.to!, door.tx!, door.ty!] as const : warp ? [warp.to, warp.tx, warp.ty] as const : null;
    if (jump) { visit(jump[0], jump[1], jump[2]); continue; }   /* stepping on a door or warp takes you through */
    for (const d of DIRS) { const nx = x + DV[d][0], ny = y + DV[d][1]; if (!blocked[map](nx, ny)) visit(map, nx, ny); }
  }
  return (map: string, x: number, y: number) => seen.has(map + ':' + x + ',' + y);
}
const canStand = reachable();
/** someone standing on a reachable tile next to (x, y), or across a net or a counter, can talk to it */
function canTalkTo(map: string, x: number, y: number) {
  const m = MAPS[map];
  return DIRS.some((d) => {
    const ax = x - DV[d][0], ay = y - DV[d][1];
    if (canStand(map, ax, ay)) return true;
    const mid = m.rows[ay] && LEGEND[m.rows[ay][ax]];
    return !!(mid && mid.reach && canStand(map, ax - DV[d][0], ay - DV[d][1]));
  });
}

for (const [id, m] of Object.entries(MAPS)) {
  describe('map ' + id, () => {
    const inside = (x: number, y: number) => x >= 0 && y >= 0 && x < W(m) && y < H(m);
    it('has rows of the same length, made of known characters', () => {
      m.rows.forEach((r, y) => expect(r.length, 'row ' + y).toBe(W(m)));
      m.rows.forEach((r, y) => [...r].forEach((ch, x) => expect(LEGEND[ch], 'unknown "' + ch + '" at ' + x + ',' + y).toBeDefined()));
    });
    it('can be reached from the start of the story, and its start tile is free', () => {
      expect(canStand(id, m.start[0], m.start[1]) || id !== 'formia').toBe(true);
      expect(solidity(m)(m.start[0], m.start[1]), 'start on a blocked tile').toBe(false);
      let any = false;
      for (let y = 0; y < H(m) && !any; y++) for (let x = 0; x < W(m) && !any; x++) any = canStand(id, x, y);
      expect(any, 'no way in').toBe(true);
      if (m.inside) expect(MAPS[m.city || ''], 'indoors map without its city').toBeDefined();
    });
    it('has everything inside its bounds', () => {
      const things = [...(m.buildings || []), ...(m.objects || []), ...(m.areas || [])];
      things.forEach((o) => expect(inside(o.x, o.y) && inside(o.x + o.w - 1, o.y + o.h - 1), JSON.stringify(o).slice(0, 60)).toBe(true));
      [...(m.signs || []), ...(m.npcs || []), ...(m.items || []), ...(m.warps || [])].forEach((o) => expect(inside(o.x, o.y), JSON.stringify(o).slice(0, 60)).toBe(true));
    });
    it('lets you talk to every person, read every sign and pick up every lost thing', () => {
      (m.npcs || []).forEach((n) => expect(canTalkTo(id, n.x, n.y), 'person ' + n.id).toBe(true));
      (m.signs || []).forEach((s) => expect(canTalkTo(id, s.x, s.y), 'sign ' + s.text[0]).toBe(true));
      (m.items || []).forEach((it) => expect(canTalkTo(id, it.x, it.y), 'item ' + it.id).toBe(true));
    });
    it('has doors on the front of their buildings, usable from a reachable tile', () => {
      (m.buildings || []).forEach((b) => {
        const [dx, dy] = b.door;
        expect(dx >= b.x && dx < b.x + b.w && dy === b.y + b.h - 1, 'door of ' + b.id + ' is not on its bottom row').toBe(true);
        /* usually from below; the ticket kiosk on the pier is used from the side */
        expect(b.to ? canStand(id, dx, dy) : canTalkTo(id, dx, dy), 'door of ' + b.id + ' cannot be used').toBe(true);
        if (b.to) {
          expect(MAPS[b.to], 'door of ' + b.id + ' leads to a missing map').toBeDefined();
          expect(solidity(MAPS[b.to])(b.tx!, b.ty!), 'door of ' + b.id + ' lands on a blocked tile').toBe(false);
        }
        if (b.gate) expect(GATES[b.gate], 'unknown gate ' + b.gate).toBeDefined();
        expect(!!(b.msg || b.gate || b.to), 'door of ' + b.id + ' does nothing').toBe(true);
      });
      (m.warps || []).forEach((w) => {
        expect(MAPS[w.to], 'warp to a missing map').toBeDefined();
        expect(solidity(MAPS[w.to])(w.tx, w.ty), 'warp lands on a blocked tile').toBe(false);
        expect(canStand(id, w.x, w.y), 'warp at ' + w.x + ',' + w.y + ' cannot be reached').toBe(true);
      });
    });
    it('has people that make sense', () => {
      const ids = new Set<string>();
      (m.npcs || []).forEach((n) => {
        expect(ids.has(n.id), 'two people called ' + n.id).toBe(false); ids.add(n.id);
        if (n.person) expect(CHARS[n.person], n.id).toBeDefined();
        else expect(typeof n.seed === 'number' && !!n.name, n.id + ' needs a name and a seed').toBe(true);
        if (n.covo) expect(COVI[n.covo] && COVI[n.covo].leader === n.person, 'covo of ' + n.id).toBeTruthy();
        if (n.gate) expect(GATES[n.gate], 'gate of ' + n.id).toBeDefined();
        if (!n.person && !n.gate) expect(n.lines && n.lines.length, n.id + ' says nothing').toBeTruthy();
      });
    });
  });
}

describe('story', () => {
  it('has every lost thing once, each blocking one of Antonio\'s moves', () => {
    const all = Object.values(MAPS).flatMap((m) => m.items || []);
    expect(new Set(all.map((it) => it.id)).size).toBe(all.length);
    all.forEach((it) => expect(ITEMS[it.move], it.id).toBeDefined());
    expect(new Set(all.map((it) => it.move)).size).toBe(all.length);
  });
  it('has a leader standing in a map of its city for every covo, and a city for every gate', () => {
    for (const [k, cv] of Object.entries(COVI)) {
      expect(MAPS[cv.city], k).toBeDefined();
      const where = Object.values(MAPS).filter((m) => (m.city || '') === cv.city || m === MAPS[cv.city]);
      expect(where.some((m) => (m.npcs || []).some((n) => n.covo === k && n.person === cv.leader)), 'nobody leads ' + k).toBe(true);
    }
    for (const [k, g] of Object.entries(GATES)) expect(MAPS[g.city], k).toBeDefined();
  });
});
