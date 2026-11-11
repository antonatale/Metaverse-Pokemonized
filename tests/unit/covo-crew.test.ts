import { describe, expect, it } from 'vitest';
import { COVI } from '../../src/data/covi';
import { SPECIES } from '../../src/data/creatures';
import { CHARS } from '../../src/data/characters';
import { crewAt, grownAt } from '../../src/story/covo-crew';
import { covoMedian } from '../../tools/sim-covi';

/* The covi are fought with creatures (D1, R7 of REVISIONE.md): each leader has a crew of his type and steps in last. */
describe('the covi with creatures', () => {
  it('give every leader a crew of his type, two creatures and then three', () => {
    for (const id of Object.keys(COVI)) {
      const cv = COVI[id], type = (CHARS as any)[cv.leader].type;
      expect(cv.crew.length).toBe(3);
      cv.crew.forEach((sp) => expect([SPECIES[sp].type, SPECIES[sp].type2, SPECIES[SPECIES[sp].evolve ? SPECIES[sp].evolve!.into : sp].type2]).toContain(type));
      expect(crewAt(id, 6, 0).length).toBe(2);
      expect(crewAt(id, 12, 2).length).toBe(3);
      expect(cv.crewTune ? cv.crewTune.length : 5).toBe(5);
    }
  });
  it('grows the crew into its forms a little later than a wild creature', () => {
    expect(grownAt('cicalina', 17)).toBe('cicalina');
    expect(grownAt('cicalina', 18)).toBe(SPECIES.cicalina.evolve!.into);
    expect(grownAt('cicalina', 18, 3)).toBe('cicalina');
  });
  /* R6: at the leader's level, the median player (the six protagonists who can challenge it, with each first creature)
     wins every covo at every place in the order at least four times in ten (tools/sim-covi.ts: the measure is there) */
  it('can be won at the leader\'s level', () => {
    const low: string[] = [];
    for (const id of Object.keys(COVI)) for (let p = 0; p < 5; p++) { const m = covoMedian(id, p, 16).med; if (m < 40) low.push(id + ' with ' + p + ' pins: ' + m + '%'); }
    expect(low).toEqual([]);
  }, 120000);
});
