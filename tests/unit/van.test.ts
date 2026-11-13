import { beforeEach, describe, expect, it } from 'vitest';
import { st, MIGRATIONS } from '../../src/save/story-progress';
import { prepare, vanAt, type PreparedMap } from '../../src/story/maps';
import { roadPath, nearRoad, backAlong, vanFits, vanStepFits, dirOf, type Tile } from '../../src/story/van';
import { roadShift, vanBody, motoBody, overlaps } from '../../src/story/vehicle-space';
import { FORMIA_SPOT, FORMIA_AT } from '../../src/data/maps/formia-ground';
import { LEGEND } from '../../src/data/maps';
import { ROSTER } from '../../src/data/characters';
import { RIDES } from '../../src/data/nicola';

function street(narrow = false): PreparedMap {
  const m = { ...prepare('formia'), id: 'test-road', w: 18, h: 12, at: {}, people: [], buildings: [], objects: [], solid: new Uint8Array(18 * 12) };
  m.cell = (x, y) => x < 0 || y < 0 || x >= m.w || y >= m.h || (narrow && y !== 5) ? LEGEND.x : { g: 'road' };
  if (narrow) for (let y = 0; y < m.h; y++) if (y !== 5) m.solid.fill(1, y * m.w, (y + 1) * m.w);
  return m;
}
beforeEach(() => { st.squad = ['antonio']; st.moto = undefined; st.van = undefined; st.sella = false; });

describe('Nicola’s van', () => {
  it('goes round a parked scooter, accounting for its overhang and every part of each step', () => {
    const m = street(), a: Tile = [3, 5];
    st.moto = { map: m.id, x: 9, y: 5, dir: 'left' };
    expect(vanFits(m, 7, 5, 'right')).toBe(false);
    const path = roadPath(m, a, [14, 5]);
    expect(path).not.toBeNull();
    expect(path!.some(t => t[1] !== 5)).toBe(true);
    let prev = a;
    for (const t of path!) {
      expect(Math.abs(t[0] - prev[0]) + Math.abs(t[1] - prev[1])).toBe(1);
      const dir = dirOf(t[0] - prev[0], t[1] - prev[1]);
      for (let n = 0; n <= 10; n++) expect(overlaps(vanBody(m, prev[0] + (t[0] - prev[0]) * n / 10, prev[1] + (t[1] - prev[1]) * n / 10, dir), motoBody(9, 5))).toBe(false);
      prev = t;
    }
  });
  it('refuses a blocked narrow street instead of driving through the scooter', () => {
    const m = street(true);
    st.moto = { map: m.id, x: 9, y: 5, dir: 'left' };
    expect(roadPath(m, [3, 5], [14, 5])).toBeNull();
  });
  it('goes round a building even when its centre tile is free', () => {
    const m = street();
    m.buildings = [{ id: 'wall', kind: 'house', x: 9, y: 5, w: 2, h: 2, door: [9, 6] }];
    expect(m.solid[5 * m.w + 8]).toBe(0);
    expect(vanFits(m, 8, 5, 'right')).toBe(false);
    const path = roadPath(m, [3, 5], [14, 5]);
    expect(path).not.toBeNull();
    expect(path!.some(t => t[1] < 5 || t[1] > 6)).toBe(true);
  });
  it('uses the same lane offset for parked collisions and smooth movement', () => {
    const m = street();
    m.cell = (x, y) => x === 8 && y === 4 ? LEGEND.x : { g: 'road' };
    const a = roadShift(m, 7, 5, 'right'), b = roadShift(m, 8, 5, 'right'), mid = roadShift(m, 7.5, 5, 'right');
    expect(mid.dy).toBe((a.dy + b.dy) / 2);
    st.van = { map: m.id, x: 7, y: 5, dir: 'right' };
    expect(vanAt(m, 6, 5)).toBe(true);
    expect(vanAt(m, 8, 5)).toBe(true);
    expect(vanAt(m, 9, 5)).toBe(false);
  });
  it('keeps old saves safe when street furniture or a filler house has moved', () => {
    const m = prepare('formia'), house = m.buildings!.find(b => /^casa-\d+$/.test(b.id))!;
    const saved = structuredClone(st);
    saved.map = 'formia'; saved.first = 'antonio'; saved.x = house.x; saved.y = house.y; saved.money = 123;
    saved.moto = { map: 'formia', x: house.x, y: house.y, dir: 'left' };
    saved.van = { ...saved.moto };
    MIGRATIONS.find(m => m.id === 'formia12')!.run(saved);
    expect([saved.x, saved.y]).toEqual(FORMIA_SPOT.start);
    expect(saved.moto).toBeUndefined(); expect(saved.van).toBeUndefined();
    expect(saved.money).toBe(123);
    const safe = structuredClone(saved);
    MIGRATIONS.find(m => m.id === 'formia12')!.run(saved);
    expect(saved).toEqual(safe);
  });
  for (const who of ROSTER) it('can pick up ' + who + ' and reach the Eclipse without crossing the scooter or scenery', () => {
    st.squad = [who];
    const m = prepare('formia'), home = FORMIA_SPOT['start-' + who] || FORMIA_SPOT.start;
    const door = FORMIA_AT.eclipse.door!, end = nearRoad(m, ...door, 16), at = end && nearRoad(m, ...home, 12, true, end);
    expect(at).not.toBeNull(); expect(end).not.toBeNull();
    const from = backAlong(m, at!, 14), arrival = roadPath(m, from, at!), ride = roadPath(m, at!, end!);
    expect(arrival, 'arrival').not.toBeNull(); expect(ride, 'ride').not.toBeNull();
    for (const [start, path] of [[from, arrival!], [at!, ride!]] as [Tile, Tile[]][]) {
      let prev = start;
      for (const t of path) {
        expect(vanStepFits(m, prev, t), prev + ' → ' + t).toBe(true);
        const dir = dirOf(t[0] - prev[0], t[1] - prev[1]);
        for (let f = 0; f <= 1; f += 0.1) {
          const box = vanBody(m, prev[0] + (t[0] - prev[0]) * f, prev[1] + (t[1] - prev[1]) * f, dir);
          for (let y = Math.floor(box.top / 32); y < Math.ceil(box.bottom / 32); y++) for (let x = Math.floor(box.left / 32); x < Math.ceil(box.right / 32); x++) expect(m.solid[y * m.w + x], x + ',' + y).not.toBe(1);
        }
        prev = t;
      }
    }
  });
  for (const ride of RIDES) it('can reach the stop ' + ride.id + ' from the Eclipse', () => {
    const m = prepare('formia'), from = nearRoad(m, ...FORMIA_AT.eclipse.door!, 16), to = nearRoad(m, ...ride.at, 20, false, from!);
    expect(to).not.toBeNull();
    expect(roadPath(m, from!, to!)).not.toBeNull();
  });
  it('keeps the first straight on the Appia centred through every side street', () => {
    const m = prepare('formia'), offsets = [];
    for (let x = 164; x <= 214; x++) offsets.push(roadShift(m, x, 46, 'left').dy);
    expect(new Set(offsets).size).toBe(1);
  });
});
