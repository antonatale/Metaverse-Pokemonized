import { describe, expect, it } from 'vitest';
import { STOPS, storyStops } from '../../src/story/goals';
import { HIDINGS } from '../../src/data/encounters';
import { st } from '../../src/save/story-progress';
import { addCreature, giveAmbrosia, level, has } from '../../src/story/growth';
import { levelMult } from '../../src/data/tuning';

/* R10 of REVISIONE.md: the tour makes the player catch and build a team. The ambrosia (24 November 2026, in the place of
   the coffee) buys a level at any level, on purpose: Antonio asked for it, and it is dear. */
describe('the tour teaches the game', () => {
  it('asks for a second creature right after the first and three before the Cisternone, before the group finale', () => {
    const ids = STOPS.map((s) => s.id);
    expect(ids.indexOf('seconda-creatura')).toBe(ids.indexOf('starter') + 1);
    expect(ids.indexOf('trama-scavi')).toBe(ids.indexOf('seconda-creatura') + 1);
    expect(ids.indexOf('squadra-cisterna')).toBeLessThan(ids.indexOf('trama-cisterna'));
    expect(ids).not.toContain('squadra-mamurra');
    expect(ids.slice(ids.indexOf('trama-mamurra'), -1)).toEqual(['trama-mamurra', 'finale-discesa', 'finale-ponte']);
  });
  it('keeps activities and lost objects out of the main itinerary', () => {
    const side = STOPS.filter(stop => stop.optional).map(stop => stop.id);
    expect(side).toContain('gelato');
    expect(side).toContain('item-passaporto');
    expect(storyStops().some(stop => side.includes(stop.id))).toBe(false);
  });
  it('keeps the strong one of the Cisternone for after the first stone', () => {
    const strong = HIDINGS.cisterna.day.filter((m) => m.lv[0] >= 20);
    expect(strong.length).toBeGreaterThan(0);
    strong.forEach((m) => expect(m.after).toBe('pietra-mura'));
  });
});
describe('the ambrosia', () => {
  it('takes whoever drinks it up exactly one level each, keeping the way to the next, at any level', () => {
    st.badges = []; st.bag = { ambrosia: 5 }; st.lv = {}; st.mons = [];
    const uid = addCreature('polpino', 5);
    st.lv![uid] = { lv: 12, xp: 40 };
    const g = giveAmbrosia(uid, 2)!;
    expect([g.from, g.to]).toEqual([12, 14]);
    expect(level(uid)).toEqual({ lv: 14, xp: 40 });
    st.lv![uid] = { lv: 60, xp: 0 };
    expect(giveAmbrosia(uid, 1)!.to).toBe(61);
    expect(has('ambrosia')).toBe(2);
    expect(giveAmbrosia(uid, 9)!.to).toBe(63);
    expect(giveAmbrosia(uid, 1)).toBeNull();
  });
});
describe('the levels in battle', () => {
  it('make a blow stronger for each level above, weaker below, within bounds, and nothing in the free mode', () => {
    expect(levelMult(10, 10)).toBe(1);
    expect(levelMult(14, 10)).toBeCloseTo(1.2);
    expect(levelMult(10, 14)).toBeCloseTo(0.8);
    expect(levelMult(60, 10)).toBe(1.8);
    expect(levelMult(10, 60)).toBe(0.6);
    expect(levelMult(undefined, 10)).toBe(1);
  });
});
