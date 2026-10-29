import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import golden from '../fixtures/engine-golden.json';
import { scenarios, digest, transcript, staticFacts } from '../golden/scenarios.mjs';
import { legacyEngine } from '../golden/legacy.mjs';
import { E } from '../golden/engine';

/* The engine must say exactly what the original said, battle by battle (see tools/golden.mjs). */
describe('battle engine, against the original', () => {
  it('has the same data and pure helpers', () => {
    expect(createHash('sha256').update(JSON.stringify(staticFacts(E))).digest('hex').slice(0, 24)).toBe(golden.facts);
  });
  it('plays every golden battle the same way', () => {
    const battles = golden.battles as Record<string, string>;
    const list = scenarios();
    expect(list.length).toBe(Object.keys(battles).length);
    const bad = list.filter((sc) => digest(E, sc) !== battles[sc.key]);
    if (bad.length) {
      /* while the original is still around, show where the first broken battle goes its own way */
      const L = legacyEngine();
      if (L) {
        const a = JSON.stringify(transcript(L, bad[0])), b = JSON.stringify(transcript(E, bad[0]));
        let k = 0; while (k < a.length && a[k] === b[k]) k++;
        console.log(bad[0].key + '\n  original: …' + a.slice(Math.max(0, k - 160), k + 160) + '\n  current:  …' + b.slice(Math.max(0, k - 160), k + 160));
      }
    }
    expect(bad.map((sc) => sc.key)).toEqual([]);
  });
});
