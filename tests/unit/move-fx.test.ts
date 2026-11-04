import { describe, expect, it } from 'vitest';
import { MOVE_FX, type Gesture } from '../../src/data/move-fx';
import { CMOVES } from '../../src/data/creatures';

/* How the moves travel (ui/spells.ts): only the table is checked here, the drawing is looked at in the browser. */
describe('the gestures of the moves', () => {
  it('are for creature moves that attack with a type (a plain move has no magic to shape)', () => {
    for (const [id, g] of Object.entries(MOVE_FX)) {
      const m = CMOVES[id];
      expect(m, id + ' exists').toBeTruthy();
      expect(m.kind, id + ' attacks').toBe('atk');
      expect(m.plain, id + ' is not a plain move').toBeFalsy();
      expect(['slash', 'rain', 'orbit', 'beam', 'lob'], id).toContain(g);
    }
  });
  it('use every gesture for at least three moves, so none is a one-off', () => {
    const count: Record<string, number> = {};
    for (const g of Object.values(MOVE_FX)) count[g] = (count[g] || 0) + 1;
    for (const g of ['slash', 'rain', 'orbit', 'beam', 'lob'] as Gesture[]) expect(count[g], g).toBeGreaterThanOrEqual(3);
  });
  it('give a different travel to the strongest moves of a line than to its plain ones', () => {
    const strong = Object.keys(CMOVES).filter((id) => CMOVES[id].kind === 'atk' && (CMOVES[id].power || 0) >= 80);
    const shaped = strong.filter((id) => MOVE_FX[id]);
    expect(shaped.length / strong.length, 'most of the strong attacks have their own gesture').toBeGreaterThan(0.6);
  });
});
