import { describe, expect, it } from 'vitest';
import { MOVE_FX, SELF_FX, type Stage } from '../../src/data/move-fx';
import { CMOVES, SPECIES, type SpeciesId } from '../../src/data/creatures';
import type { TypeName } from '../../src/data/types';

/* How the moves are shown (ui/move-stages.ts, ui/move-scenes.ts, ui/self-scenes.ts, ui/spells.ts): only the tables are
   checked here, the drawing is looked at with tools/move-sheet.ts. */
/** the ten types of the creatures */
const TYPES: TypeName[] = ['Calma', 'Caos', 'Cervello', 'Chiacchiera', 'Cuore', 'Corrente', 'Calore', 'Cielo', 'Corazza', 'Crepuscolo'];
const GESTURES: Stage[] = ['slash', 'rain', 'orbit', 'beam', 'lob'];
const OWN: Stage[] = ['tide', 'jaws', 'clamp', 'grasp', 'pod', 'volley', 'sting', 'jet', 'ram', 'dive', 'fall',
  'bolt', 'shade', 'omen', 'cone', 'haze', 'swarm', 'rise', 'twister', 'snatch', 'quake', 'sign', 'song', 'speech',
  'scratch', 'curtain', 'topple', 'ambush', 'memory', 'peck', 'sparkle', 'hop'];

/** a move's type, as the battle shows it: its own, or the type of the creatures that learn it (a plain move too: it
    belongs to the line that learns it) */
function typeOf(id: string): TypeName | null {
  const m = CMOVES[id];
  if (m.mtype) return m.mtype;
  const sp = (Object.keys(SPECIES) as SpeciesId[]).find((s) => SPECIES[s].learn.some((l) => l[1] === id) || SPECIES[s].sig === id);
  return sp ? SPECIES[sp].type : null;
}
/** the moves cast at the foe (attacks, plain ones too, and the spells that lower a number or confuse), and those on oneself */
const atFoe = Object.keys(CMOVES).filter((id) => CMOVES[id].kind === 'atk' || CMOVES[id].kind === 'status');
const onSelf = Object.keys(CMOVES).filter((id) => CMOVES[id].kind === 'heal' || CMOVES[id].kind === 'buff');

describe('the scenes of the moves', () => {
  it('are for creature moves cast at the foe, each a scene that exists', () => {
    for (const [id, sc] of Object.entries(MOVE_FX)) {
      const m = CMOVES[id];
      expect(m, id + ' exists').toBeTruthy();
      expect(['atk', 'status'], id + ' is cast at the foe').toContain(m.kind);
      expect(GESTURES.concat(OWN), id).toContain(sc.stage);
      if (sc.n != null) expect(sc.n, id).toBeGreaterThan(0);
      if (sc.col != null) expect(sc.col, id).toMatch(/^#[0-9a-f]{6}$/);
      if (sc.stage === 'speech') expect(sc.words && sc.words.length, id + ' has its words').toBeGreaterThan(0);
    }
  });
  it('use every scene at least once', () => {
    const used = new Set(Object.values(MOVE_FX).map((sc) => sc.stage));
    for (const g of GESTURES.concat(OWN)) expect(used.has(g), g).toBe(true);
  });
  it('give every move cast at the foe a scene, in every type, and no two moves of a type the same', () => {
    for (const t of TYPES) {
      const mine = atFoe.filter((id) => typeOf(id) === t);
      expect(mine.length, t).toBeGreaterThan(1);
      const seen: Record<string, string> = {};
      for (const id of mine) {
        expect(MOVE_FX[id], t + ': ' + id + ' has a scene').toBeTruthy();
        const st = MOVE_FX[id].stage;
        expect(seen[st], t + ': ' + id + ' and ' + seen[st] + ' are both ' + st).toBeUndefined();
        seen[st] = id;
      }
    }
  });
  it('give every move on oneself a scene of its own, no two the same', () => {
    const seen: Record<string, string> = {};
    for (const id of onSelf) {
      expect(SELF_FX[id], id + ' has a scene').toBeTruthy();
      expect(seen[SELF_FX[id]], id + ' and ' + seen[SELF_FX[id]] + ' are both ' + SELF_FX[id]).toBeUndefined();
      seen[SELF_FX[id]] = id;
    }
    for (const id of Object.keys(SELF_FX)) expect(onSelf, id + ' is a move on oneself').toContain(id);
  });
});
