import { describe, expect, it } from 'vitest';
import { COVO_PLACES } from '../../src/data/covo-places';
import { magicFor, PLACE_MAGIC, sceneFor } from '../../src/data/scenes';

describe('battle locations', () => {
  for (const p of Object.values(COVO_PLACES)) it(p.title + ' keeps every defender inside, with a separate keeper chamber', () => {
    expect(sceneFor(p.map, null)).toBe('covo-' + p.leader);
    expect(sceneFor(p.map, 'Porto')).toBe('covo-' + p.leader);
    expect(sceneFor(p.map, null, true)).toBe('covo-' + p.leader + '-boss');
  });
  it('keeps ordinary locations distinct from the covi', () => {
    expect(sceneFor('formia', 'Pineta di Vindicio')).toBe('pineta');
    expect(sceneFor('formia', 'Bruno Zauli')).toBe('castellonorato');
    expect(sceneFor('morgana', 'Mola')).toBe('birreria');
    expect(sceneFor('cisterna', null)).toBe('cisterna');
    expect(sceneFor('formia', 'Mola', true)).toBe('mola');
  });
  it('does not change battle bonuses when replacing an illustration', () => {
    expect(magicFor('circolo', null)).toBeUndefined();
    expect(magicFor('covo-antonio', null)).toBe(PLACE_MAGIC.porto);
    expect(magicFor('formia', 'Mola')).toBe(PLACE_MAGIC.mola);
  });
});
