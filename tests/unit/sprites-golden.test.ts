import { describe, expect, it } from 'vitest';
import golden from '../fixtures/sprites-golden.json';
import { spriteDigests } from '../golden/sprites.mjs';
import { SPR } from '../golden/sprites-current';

/* The portraits are SVG built by code: they must hand out the very same strings as the golden file. */
describe('portraits, against the golden file', () => {
  it('draws the same <defs>, portraits, exam and robot', () => {
    const want = golden.strings as Record<string, string>, got = spriteDigests(SPR) as Record<string, string>;
    const bad = Object.keys(want).filter((k) => got[k] !== want[k]);
    expect(bad).toEqual([]);
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
  });
});
