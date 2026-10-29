import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import golden from '../fixtures/engine-golden.json';
import { scenarios, digest, staticFacts } from '../golden/scenarios.mjs';
import { E } from '../golden/engine';

/* The engine must say exactly what the original said, battle by battle (see tools/golden.mjs). */
describe('battle engine, against the golden file', () => {
  it('has the same data and pure helpers', () => {
    expect(createHash('sha256').update(JSON.stringify(staticFacts(E))).digest('hex').slice(0, 24)).toBe(golden.facts);
  });
  it('plays every golden battle the same way', () => {
    const battles = golden.battles as Record<string, string>;
    const list = scenarios();
    expect(list.length).toBe(Object.keys(battles).length);
    const bad = list.filter((sc) => digest(E, sc) !== battles[sc.key]);
    expect(bad.map((sc) => sc.key)).toEqual([]);
  });
});
