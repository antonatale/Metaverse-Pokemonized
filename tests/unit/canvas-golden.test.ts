import { describe, expect, it } from 'vitest';
import golden from '../fixtures/canvas-golden.json';
import { canvasDigests } from '../golden/canvas.mjs';
import { ART } from '../golden/canvas-current';
import { MAPS, LEGEND } from '../../src/data/maps';

/* The map art must make exactly the canvas calls the original made (see tests/golden/canvas.mjs). */
describe('map art, against the original', () => {
  it('paints the same ground, objects, people, lost things, badges and icons', () => {
    const want = golden.calls as Record<string, string>, got = canvasDigests(ART, MAPS, LEGEND) as Record<string, string>;
    expect(Object.keys(want).filter((k) => got[k] !== want[k])).toEqual([]);
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
  });
});
