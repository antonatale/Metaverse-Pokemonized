import { describe, expect, it } from 'vitest';
import golden from '../fixtures/canvas-golden.json';
import { canvasDigests } from '../golden/canvas.mjs';
import { ART } from '../golden/canvas-current';
import { MAPS, LEGEND } from '../../src/data/maps';

/* The map art must make exactly the canvas calls in the golden file (see tests/golden/canvas.mjs). */
describe('map art, against the golden file', () => {
  it('paints the same ground, objects, people, lost things, badges and icons', () => {
    const want = golden.calls as Record<string, string>, got = canvasDigests(ART, MAPS, LEGEND) as Record<string, string>;
    expect(Object.keys(want).filter((k) => got[k] !== want[k])).toEqual([]);
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
    /* it paints every map twice: about 5 s on a slow machine, over vitest's default */
  }, 20_000);
});
