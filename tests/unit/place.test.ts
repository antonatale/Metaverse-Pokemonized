import { describe, expect, it } from 'vitest';
import { arrive, prove, startOf, stepTo, walk, type Solid, type Walker } from '../../src/story/place';
import type { Dir, PlaceDef, Thing } from '../../src/data/maps/types';
import { MAPS } from '../../src/data/maps';
import { prepare } from '../../src/story/maps';
import { placeProof } from '../../src/story/place-run';

/* The rules of a place, and above all the validator: it is only worth something if it says no to what cannot be done.
   So here it is shown places that are wrong, one for each way a place can be wrong. */
/** a map in characters: x is wall, the rest is floor */
function room(rows: string[]): Solid { return (x, y) => y < 0 || y >= rows.length || x < 0 || x >= rows[0].length || rows[y][x] === 'x'; }
const place = (entry: [number, number], goal: [number, number], things: Thing[]): PlaceDef => ({ entry: [entry[0], entry[1], 'down'], goal, things });
const follow = (p: PlaceDef, solid: Solid, way: Dir[]) => way.reduce((w: Walker, d) => walk(p, solid, w, d)!.w, startOf(p));

describe('the rules of a place', () => {
  const open = room(['.....', '.....', '.....']);
  it('a gate stops you until its plate is on, and the plate turns off again', () => {
    const p = place([0, 1], [4, 1], [{ k: 'plate', x: 1, y: 0, flag: 'a' }, { k: 'gate', x: 2, y: 1, flag: 'a' }]);
    let w = startOf(p);
    w = walk(p, open, w, 'right')!.w;
    expect(stepTo(p, open, w, 'right')).toBe(null);
    w = walk(p, open, w, 'up')!.w;
    expect(w.flags).toEqual({ a: true });
    w = walk(p, open, w, 'down')!.w;
    expect(stepTo(p, open, w, 'right')).not.toBe(null);
    w = walk(p, open, walk(p, open, w, 'up')!.w, 'down')!.w;
    /* on the plate a second time: off again */
    expect(w.flags).toEqual({});
  });
  it('an `open` gate works the other way round, and a `once` plate stays on', () => {
    const p = place([0, 0], [4, 0], [{ k: 'plate', x: 1, y: 0, flag: 'a', once: true }, { k: 'gate', x: 3, y: 0, flag: 'a', open: true }]);
    const w = walk(p, open, walk(p, open, walk(p, open, startOf(p), 'right')!.w, 'left')!.w, 'right')!.w;
    expect(w.flags).toEqual({ a: true });
    expect(stepTo(p, open, walk(p, open, w, 'right')!.w, 'right')).toBe(null);
  });
  it('a floor carries you until something stops it', () => {
    const p = place([0, 1], [4, 1], [{ k: 'slide', x: 1, y: 1, dir: 'right' }, { k: 'slide', x: 2, y: 1, dir: 'right' }, { k: 'slide', x: 3, y: 1, dir: 'up' }]);
    const w = walk(p, open, startOf(p), 'right')!.w;
    expect([w.x, w.y]).toEqual([3, 0]);
    expect(w.tick).toBe(4);
  });
  it('a pad takes you there, and a beat sends you back to the last rest when it is on', () => {
    const p = place([0, 0], [4, 2], [{ k: 'pad', x: 1, y: 0, tx: 4, ty: 0 }, { k: 'rest', x: 0, y: 1 }, { k: 'beat', x: 1, y: 1, every: 2, on: [0] }]);
    expect(walk(p, open, startOf(p), 'right')!.w).toMatchObject({ x: 4, y: 0 });
    const rested = walk(p, open, startOf(p), 'down')!.w;
    expect(rested.rest).toEqual([0, 1]);
    const a = stepTo(p, open, rested, 'right')!;
    expect(a.tick).toBe(2);
    const hit = arrive(p, a);
    expect(hit.hit).toBe(true);
    expect(hit.w).toMatchObject({ x: 0, y: 1 });
    /* at an odd step the same tile is safe */
    expect(arrive(p, { ...a, tick: 3 }).hit).toBeUndefined();
  });
  it('two things on one tile both work', () => {
    const p = place([0, 0], [4, 0], [{ k: 'plate', x: 1, y: 0, flag: 'a' }, { k: 'rest', x: 1, y: 0 }]);
    const w = walk(p, open, startOf(p), 'right')!.w;
    expect(w.flags).toEqual({ a: true });
    expect(w.rest).toEqual([1, 0]);
  });
  it('a reset clears everything', () => {
    const p = place([0, 0], [4, 0], [{ k: 'plate', x: 1, y: 0, flag: 'a', once: true }, { k: 'reset', x: 2, y: 0 }]);
    expect(walk(p, open, walk(p, open, startOf(p), 'right')!.w, 'right')!.w.flags).toEqual({});
  });
});

describe('the Cisternone in the story', () => {
  it('opens to an old save that already has the stone, and keeps the chapter of a save that has seen it', async () => {
    const sign = (MAPS.formia.signs || []).find((g) => g.enter)!;
    expect(sign.enter!.after).toContain('pietra-mura');
    const { STOPS } = await import('../../src/story/goals');
    /* the stop people already went through keeps its id: the new one has a chapter of its own */
    expect(STOPS.map((s) => s.id)).toContain('trama-mura');
    expect(STOPS.map((s) => s.id)).toContain('trama-dentro');
  });
});

describe('the places of the game', () => {
  for (const [id, m] of Object.entries(MAPS)) {
    if (!m.place) continue;
    const pm = prepare(id);
    it(id + ' can be finished, from wherever a player can get to', () => {
      const r = placeProof(pm);
      expect(r.way.length, 'no way to the goal').toBeGreaterThan(0);
      expect(r.dead, 'states with no way out').toEqual([]);
      expect(r.stuck).toEqual([]);
      expect(r.unused, 'things nothing ever touches').toEqual([]);
      expect(r.ok).toBe(true);
    });
    it(id + ' does not put anything on a wall or a door', () => {
      for (const t of m.place!.things) expect(pm.solid[t.y * pm.w + t.x], t.k + ' at ' + t.x + ',' + t.y).toBe(0);
      expect(pm.solid[m.place!.entry[1] * pm.w + m.place!.entry[0]]).toBe(0);
    });
  }
});

describe('the validator', () => {
  const hall = room(['.......', 'xxxxxxx', '.......']);
  it('proves a place that works, and hands back the way', () => {
    const solid = room(['...x...', '...x...', '.......']);
    const p = place([0, 0], [6, 0], [{ k: 'plate', x: 2, y: 0, flag: 'a' }, { k: 'gate', x: 3, y: 2, flag: 'a' }]);
    const r = prove(p, solid);
    expect(r.ok).toBe(true);
    expect(r.dead).toEqual([]);
    expect(r.unused).toEqual([]);
    /* the way really gets there, walked with the rules */
    const end = follow(p, solid, r.way);
    expect([end.x, end.y]).toEqual([6, 0]);
    expect(end.flags).toEqual({ a: true });
  });
  it('says no to a goal behind a wall', () => {
    const r = prove(place([0, 0], [6, 2], []), hall);
    expect(r.ok).toBe(false);
    expect(r.way).toEqual([]);
  });
  it('says no to a gate whose plate is out of reach', () => {
    const r = prove(place([0, 0], [6, 0], [{ k: 'gate', x: 3, y: 0, flag: 'a' }, { k: 'plate', x: 3, y: 2, flag: 'a' }]), hall);
    expect(r.ok).toBe(false);
    expect(r.unused.map((t) => t.k).sort()).toEqual(['gate', 'plate']);
  });
  it('says no to a door that closes behind you: the goal can be reached, but not from everywhere', () => {
    /* step on the plate at the wrong moment and the way to the goal shuts for good */
    const solid = room(['.....', 'xx.xx', 'xx.xx']);
    const r = prove(place([0, 0], [2, 2], [{ k: 'plate', x: 3, y: 0, flag: 'a', once: true }, { k: 'gate', x: 2, y: 1, flag: 'a', open: true }]), solid);
    expect(r.ok).toBe(false);
    expect(r.way.length).toBeGreaterThan(0);                                 /* it can be done… */
    expect(r.dead.length).toBeGreaterThan(0);                                /* …and it can be ruined */
  });
  it('accepts the same door with a reset to get out of it', () => {
    const solid = room(['.....', 'xx.xx', 'xx.xx']);
    const r = prove(place([0, 0], [2, 2], [{ k: 'plate', x: 3, y: 0, flag: 'a', once: true }, { k: 'gate', x: 2, y: 1, flag: 'a', open: true }, { k: 'reset', x: 0, y: 0 }]), solid);
    expect(r.ok).toBe(true);
  });
  it('says no to a floor that throws you into a pit with no way back', () => {
    const solid = room(['.....', 'xx.xx', '.....', 'xxxxx']);
    const r = prove(place([0, 0], [4, 0], [{ k: 'slide', x: 2, y: 1, dir: 'down' }, { k: 'gate', x: 4, y: 0, flag: 'nope' }]), solid);
    expect(r.ok).toBe(false);
  });
  it('says no to a floor that carries round in a circle for ever', () => {
    const solid = room(['...', '...', '...']);
    const r = prove(place([0, 0], [2, 2], [
      { k: 'slide', x: 1, y: 0, dir: 'right' }, { k: 'slide', x: 2, y: 0, dir: 'down' }, { k: 'slide', x: 2, y: 1, dir: 'left' }, { k: 'slide', x: 1, y: 1, dir: 'up' }]), solid);
    expect(r.stuck.length).toBeGreaterThan(0);
    expect(r.ok).toBe(false);
  });
  it('knows a corridor of beats can be crossed only in time, and finds the moment', () => {
    /* two beats out of step: one tile is safe on even steps, the next on odd ones */
    const solid = room(['.....']);
    const p = place([0, 0], [4, 0], [{ k: 'beat', x: 1, y: 0, every: 2, on: [0] }, { k: 'beat', x: 2, y: 0, every: 2, on: [1] }, { k: 'beat', x: 3, y: 0, every: 2, on: [0] }]);
    const r = prove(p, solid);
    expect(r.ok).toBe(true);
    const end = follow(p, solid, r.way);
    expect([end.x, end.y]).toEqual([4, 0]);
  });
  it('says no to beats that can never be crossed', () => {
    const solid = room(['.....']);
    const p = place([0, 0], [4, 0], [{ k: 'beat', x: 1, y: 0, every: 2, on: [0, 1] }]);
    expect(prove(p, solid).ok).toBe(false);
  });
});
