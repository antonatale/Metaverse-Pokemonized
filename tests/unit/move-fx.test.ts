import { describe, expect, it } from 'vitest';
import { MOVE_FX, type Stage } from '../../src/data/move-fx';
import { CMOVES, SPECIES, type SpeciesId } from '../../src/data/creatures';
import type { TypeName } from '../../src/data/types';

/* How the moves are shown (ui/move-stages.ts, ui/spells.ts): only the table is checked here, the drawing is looked at
   with tools/move-sheet.ts. */
const GESTURES: Stage[] = ['slash', 'rain', 'orbit', 'beam', 'lob'];
const OWN: Stage[] = ['tide', 'jaws', 'clamp', 'grasp', 'pod', 'volley', 'sting', 'jet', 'ram', 'dive', 'fall'];
/** the types whose attacks all have a scene, each a different one; S8 in TASK-MODELLI.md adds the others */
const DONE: TypeName[] = ['Corrente'];

/** a move's type, as the battle shows it: its own, or the type of the creatures that learn it */
function typeOf(id: string): TypeName | null {
  const m = CMOVES[id];
  if (m.plain) return null;
  if (m.mtype) return m.mtype;
  const sp = (Object.keys(SPECIES) as SpeciesId[]).find((s) => SPECIES[s].learn.some((l) => l[1] === id) || SPECIES[s].sig === id);
  return sp ? SPECIES[sp].type : null;
}
const attacks = Object.keys(CMOVES).filter((id) => CMOVES[id].kind === 'atk' && !CMOVES[id].plain);

describe('the scenes of the moves', () => {
  it('are for creature moves that attack with a type (a plain move has no magic to shape)', () => {
    for (const [id, sc] of Object.entries(MOVE_FX)) {
      const m = CMOVES[id];
      expect(m, id + ' exists').toBeTruthy();
      expect(m.kind, id + ' attacks').toBe('atk');
      expect(m.plain, id + ' is not a plain move').toBeFalsy();
      expect(GESTURES.concat(OWN), id).toContain(sc.stage);
      if (sc.n != null) expect(sc.n, id).toBeGreaterThan(0);
    }
  });
  it('use every gesture for at least three moves, and every scene of its own at least once', () => {
    const count: Record<string, number> = {};
    for (const sc of Object.values(MOVE_FX)) count[sc.stage] = (count[sc.stage] || 0) + 1;
    for (const g of GESTURES) expect(count[g], g).toBeGreaterThanOrEqual(3);
    for (const g of OWN) expect(count[g], g).toBeGreaterThanOrEqual(1);
  });
  it('give a different show to the strongest moves of a line than to its plain ones', () => {
    const strong = attacks.filter((id) => (CMOVES[id].power || 0) >= 80);
    const shaped = strong.filter((id) => MOVE_FX[id]);
    expect(shaped.length / strong.length, 'most of the strong attacks have their own show').toBeGreaterThan(0.6);
  });
  it('in the types already done, every attack has a scene, and no two the same', () => {
    for (const t of DONE) {
      const mine = attacks.filter((id) => typeOf(id) === t);
      expect(mine.length, t).toBeGreaterThan(1);
      const seen: Record<string, string> = {};
      for (const id of mine) {
        expect(MOVE_FX[id], t + ': ' + id + ' has a scene').toBeTruthy();
        const st = MOVE_FX[id].stage;
        expect(seen[st], t + ': ' + id + ' and ' + seen[st] + ' are both ' + st).toBeUndefined();
        seen[st] = id;
      }
    }
  });
});
