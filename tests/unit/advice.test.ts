import { describe, it, expect } from 'vitest';
import { lossAdvice, mainType, whereTypes } from '../../src/story/advice';
import { SPECIES, type SpeciesId } from '../../src/data/creatures';
import { beatersOf } from '../../src/data/types';

describe('what Cicero says after two defeats (story/advice.ts)', () => {
  it('finds the type the foes have most', () => {
    expect(mainType(['Corrente', 'Calore', 'Corrente'])).toBe('Corrente');
  });
  it('names a creature of the right type, in the team or at home, or where to find one', () => {
    const good = beatersOf('Corrente');
    const sp = (Object.keys(SPECIES) as SpeciesId[]).find((k) => good.indexOf(SPECIES[k].type) >= 0)!;
    expect(lossAdvice(['Corrente'], 5, [{ name: 'Pino', sp, lv: 9, home: false }])[0]).toContain('Pino');
    expect(lossAdvice(['Corrente'], 5, [{ name: 'Pino', sp, lv: 9, home: true }])[0]).toContain('a casa');
    expect(whereTypes(good).length).toBeGreaterThan(0);
  });
  it('says when the foes are above the team', () => {
    const said = lossAdvice(['Corrente'], 12, [{ name: 'Pino', sp: 'polpino' as SpeciesId, lv: 8, home: false }]);
    expect(said.join(' ')).toContain('livello 12');
  });
});
