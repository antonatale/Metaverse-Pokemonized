import { describe, expect, it } from 'vitest';
import { legacyGlobals, legacyLiteral, legacyScript, LEGACY } from '../engine/legacy.mjs';
import fs from 'node:fs';
import { MAPS, LEGEND } from '../../src/data/maps';
import { COVI } from '../../src/data/covi';
import { GATES } from '../../src/data/gates';
import { CHARS, ROSTER, PAIRS, JOKES } from '../../src/data/characters';
import { TYPES, TYPE_ORDER } from '../../src/data/types';
import { ITEMS, FOUND } from '../../src/data/items';
import { TUNE, K, CRIT } from '../../src/data/tuning';

/* The data moved out of the old scripts must be exactly the old data. Skipped once legacy/index.html is gone:
   from then on the golden battles and the map checks guard it. */
const ENGINE = '/* Battle engine v2', MAPS_JS = '/* Map data.', ART = '/* World art:';
describe.skipIf(!fs.existsSync(LEGACY))('data, against the original', () => {
  it('maps, covi and gates', () => {
    const G = legacyGlobals(MAPS_JS) as Record<string, unknown>;
    expect(MAPS).toEqual(G.WORLD_MAPS);
    expect(Object.keys(MAPS)).toEqual(Object.keys(G.WORLD_MAPS as object));
    expect(COVI).toEqual(G.WORLD_COVI);
    expect(GATES).toEqual(G.WORLD_GATES);
  });
  it('legend', () => {
    expect(LEGEND).toEqual(legacyLiteral(ART, 'LEGEND'));
  });
  it('characters, types, items and numbers', () => {
    const lit = (n: string) => legacyLiteral(ENGINE, n);
    expect(CHARS).toEqual(lit('CHARS'));
    expect(Object.keys(CHARS)).toEqual(Object.keys(lit('CHARS')));
    expect(ROSTER).toEqual(lit('ROSTER'));
    expect(PAIRS).toEqual(lit('PAIRS'));
    expect(JOKES).toEqual(lit('JOKES'));
    expect(TYPES).toEqual(lit('TYPES'));
    expect(TYPE_ORDER).toEqual(lit('TYPE_ORDER'));
    expect(ITEMS).toEqual(lit('ITEMS'));
    expect(FOUND).toEqual(lit('FOUND'));
    expect(TUNE).toEqual(lit('TUNE'));
    expect(legacyScript(ENGINE)).toContain('var K = ' + K + ', CRIT = 1 / ' + 1 / CRIT + ';');
  });
});
