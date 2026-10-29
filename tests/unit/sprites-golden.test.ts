import { describe, expect, it } from 'vitest';
import golden from '../fixtures/sprites-golden.json';
import { spriteDigests, spriteFacts } from '../golden/sprites.mjs';
import { legacyGlobals } from '../golden/legacy.mjs';
import { SPR } from '../golden/sprites-current';

/* The portraits are SVG built by code: the new module must hand out the very same strings as the original. */
describe('portraits, against the original', () => {
  it('draws the same <defs>, portraits, exam and robot', () => {
    const want = golden.strings as Record<string, string>, got = spriteDigests(SPR) as Record<string, string>;
    const bad = Object.keys(want).filter((k) => got[k] !== want[k]);
    if (bad.length) {
      const L = legacyGlobals('/* Sprites v2') as { SPR: unknown } | null;
      if (L) {
        const a = String((spriteFacts(L.SPR) as Record<string, unknown>)[bad[0]]), b = String((spriteFacts(SPR) as Record<string, unknown>)[bad[0]]);
        let k = 0; while (k < a.length && a[k] === b[k]) k++;
        console.log(bad[0] + ' differs at ' + k + '\n  original: …' + a.slice(Math.max(0, k - 120), k + 120) + '\n  current:  …' + b.slice(Math.max(0, k - 120), k + 120));
      }
    }
    expect(bad).toEqual([]);
    expect(Object.keys(got).sort()).toEqual(Object.keys(want).sort());
  });
});
