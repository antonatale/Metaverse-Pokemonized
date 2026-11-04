import { describe, expect, it } from 'vitest';
import { HIDINGS, wildLevel } from '../../src/data/encounters';
import { SPECIES } from '../../src/data/creatures';
import { st, resetProgress } from '../../src/save/story-progress';
import { teamRef } from '../../src/story/growth';
import { storyStage } from '../../src/story/plot';

/* The levels of the wild creatures: a gentle place keeps its band (lifted a little by the story), a place meant as a
   challenge aims at Antonio's team, and neither ever leaves its limits. */
const rolls = Array.from({ length: 100 }, (_, i) => i / 100);

describe('wild levels', () => {
  const gram = HIDINGS.gramsci, monti = HIDINGS.monti;
  const civ = monti.day[0], oli = monti.day[2];   /* a Civettina (10–13) and a rare Olivastro (18–20) */

  it('stay in the band of a gentle place, whatever the team is', () => {
    const m = gram.day[0];
    for (const ref of [0, 5, 12, 40]) for (const r of rolls) {
      const lv = wildLevel(m, gram, ref, 0, r);
      expect(lv).toBeGreaterThanOrEqual(m.lv[0]);
      expect(lv).toBeLessThanOrEqual(m.lv[1]);
    }
  });
  it('are exactly what they always were at the start of the story (the tests and the old saves)', () => {
    const m = gram.day[0];
    for (const r of rolls) expect(wildLevel(m, gram, 7, 0, r)).toBe(m.lv[0] + Math.floor(r * (m.lv[1] - m.lv[0] + 1)));
  });
  it('rise with the story, a place by its own rise', () => {
    const m = gram.day[0];
    expect(Math.min(...rolls.map((r) => wildLevel(m, gram, 0, 3, r)))).toBe(m.lv[0] + 3);
    expect(Math.max(...rolls.map((r) => wildLevel(m, gram, 0, 3, r)))).toBe(m.lv[1] + 3);
    expect(Math.min(...rolls.map((r) => wildLevel(civ, monti, 20, 2, r)))).toBeGreaterThanOrEqual(civ.lv[0] + 4);   /* the Aurunci rise by 2 a stage */
  });
  it('follow the team in a place that follows, a level around it', () => {
    const at = (ref: number) => rolls.map((r) => wildLevel(civ, monti, ref, 0, r));
    expect(new Set(at(14))).toEqual(new Set([13, 14, 15]));
    expect(Math.min(...at(11))).toBeGreaterThanOrEqual(civ.lv[0]);
  });
  it('never go under the band nor more than the slack over it', () => {
    const f = monti.follow!;
    for (const stage of [0, 2, 4]) for (const ref of [0, 8, 20, 99]) for (const r of rolls) {
      const lv = wildLevel(civ, monti, ref, stage, r), rise = (monti.rise || 1) * stage;
      expect(lv).toBeGreaterThanOrEqual(civ.lv[0] + rise);
      expect(lv).toBeLessThanOrEqual(civ.lv[1] + rise + f.slack);
    }
  });
  it('grow with the team and never shrink', () => {
    for (const r of [0, 0.4, 0.9]) {
      let last = 0;
      for (let ref = 0; ref <= 40; ref++) { const lv = wildLevel(civ, monti, ref, 1, r); expect(lv).toBeGreaterThanOrEqual(last); last = lv; }
    }
  });
  it('keep the evolved ones in their own, higher band: never under it, held at its cap', () => {
    expect(SPECIES[oli.sp].stage).toBeGreaterThanOrEqual(2);
    expect(wildLevel(oli, monti, 12, 0, 0.5)).toBe(oli.lv[0]);   /* a young team: the band's floor, not the team's level */
    expect(wildLevel(oli, monti, 30, 0, 0.5)).toBe(oli.lv[1] + 5);   /* a strong team: held at the cap */
    expect(wildLevel(civ, monti, 18, 0, 0.5)).toBe(18);   /* a plain creature against the same team: at the cap of 13 + 5 */
  });
  it('have good tables: every band is in order, every species exists, every follow has a slack', () => {
    for (const h of Object.values(HIDINGS)) {
      for (const m of h.day.concat(h.night || [])) { expect(SPECIES[m.sp], h.id + ' ' + m.sp).toBeTruthy(); expect(m.lv[0]).toBeLessThanOrEqual(m.lv[1]); expect(m.w).toBeGreaterThan(0); }
      if (h.follow) expect(h.follow.slack).toBeGreaterThan(0);
    }
  });
});

describe('the team and the story, as the levels see them', () => {
  it('count the three best creatures, and the stones and Mamurra', () => {
    resetProgress();
    expect(teamRef()).toBe(0);
    expect(storyStage()).toBe(0);
    st.mons = [{ uid: 'c1', sp: 'polpino' }, { uid: 'c2', sp: 'gabbi' }, { uid: 'c3', sp: 'ramarrino' }, { uid: 'c4', sp: 'riccetto' }, { uid: 'c5', sp: 'cicalina', home: true }];
    st.lv = { c1: { lv: 20, xp: 0 }, c2: { lv: 10, xp: 0 }, c3: { lv: 12, xp: 0 }, c4: { lv: 2, xp: 0 }, c5: { lv: 40, xp: 0 } };
    expect(teamRef()).toBeCloseTo((20 + 12 + 10) / 3, 6);   /* the one at home does not count */
    st.seen['pietra-mura'] = true; st.seen['pietra-mare'] = true;
    expect(storyStage()).toBe(2);
    st.beaten['tr-mamurra'] = true;
    expect(storyStage()).toBe(3);
    resetProgress();
  });
});
