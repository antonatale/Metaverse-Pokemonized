import { describe, expect, it } from 'vitest';
import { prove, walk, startOf, type Walker } from '../../src/story/place';
import { FLOOR_PLANS, FLOOR_MAPS } from '../../src/data/maps/covi-floors';
import { MAPS } from '../../src/data/maps';
import type { Dir, PlaceDef } from '../../src/data/maps/types';

/* The floors of the covi (data/maps/covi-floors.ts): tests/unit/place.test.ts proves that from the stairs every state can
   still reach the top; here, that the stairs go where they say, and that from the top, with the floor as the way up left
   it (plates down, bridges fallen), one can still get back to the stairs down. */
const DIRS: Dir[] = ['up', 'down', 'left', 'right'];
describe('the floors of the covi', () => {
  for (const [id, b] of Object.entries(FLOOR_PLANS)) {
    const m = FLOOR_MAPS[id];
    it(id + ': the stairs lead to the floor below, and back', () => {
      const down = (m.warps || []).find((w) => w.x === b.down![0] && w.y === b.down![1])!;
      expect(down, 'stairs down').toBeDefined();
      const below = MAPS[down.to];
      expect(below, 'the floor below').toBeDefined();
      /* the floor below has stairs up that come here, and arrive in front of the stairs down */
      const up = (below.warps || []).find((w) => w.to === id)!;
      expect(up, 'stairs up from ' + down.to).toBeDefined();
      expect([up.tx, up.ty]).toEqual([m.place!.entry[0], m.place!.entry[1]]);
      if (b.up) {
        const w = (m.warps || []).find((q) => q.x === b.up![0] && q.y === b.up![1])!;
        expect(MAPS[w.to], 'the floor above').toBeDefined();
      } else expect(b.keeper, 'the last floor has the keeper').not.toBeNull();
    });
    it(id + ': from the top one can get back down', () => {
      const p: PlaceDef = m.place!;
      const solid = (x: number, y: number) => x < 0 || y < 0 || y >= m.rows.length || x >= m.rows[0].length || m.rows[y][x] === 'x' || m.rows[y][x] === '@' ||
        (m.npcs || []).some((n) => n.x === x && n.y === y);
      const pr = prove(p, solid);
      let w: Walker = startOf(p);
      for (const d of pr.way) { const r = walk(p, solid, w, d); if (r) w = r.w; }
      const key = (v: Walker) => v.x + ',' + v.y + '|' + v.tick % 12 + '|' + Object.keys(v.flags).sort().join('+') + '|' + (v.rest || '');
      const seen = new Set([key(w)]), q = [w];
      let back = false;
      while (q.length && !back) {
        const v = q.shift()!;
        for (const d of DIRS) {
          const r = walk(p, solid, v, d);
          if (!r) continue;
          if (r.w.x === p.entry[0] && r.w.y === p.entry[1]) back = true;
          if (!seen.has(key(r.w))) { seen.add(key(r.w)); q.push(r.w); }
        }
      }
      expect(back).toBe(true);
    });
  }
  it('every covo has its keeper on the last floor', () => {
    const keepers = Object.values(FLOOR_MAPS).flatMap((m) => (m.npcs || []).filter((n) => n.covo));
    expect(keepers.map((n) => n.covo).sort()).toEqual(['circolo', 'eclipse', 'morgana', 'padel', 'palamendola', 'piazza', 'pineta']);
  });
});
