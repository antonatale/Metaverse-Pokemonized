import { describe, expect, it } from 'vitest';
import { STOPS, storyStops } from '../../src/story/goals';
import { HIDINGS } from '../../src/data/encounters';
import { st } from '../../src/save/story-progress';
import { addCreature, drinkCoffee, level, coffeeCap, COFFEE_XP } from '../../src/story/growth';

/* R8 and R10 of REVISIONE.md: the coffee does not buy levels; the tour makes the player catch and build a team. */
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
describe('the coffee', () => {
  it('gives experience only below the cap, and the bond always', () => {
    st.badges = []; st.bag = { caffe: 20 }; st.lv = {}; st.mons = [];
    const uid = addCreature('polpino', 5);
    const g = drinkCoffee(uid, 10)!;
    expect(g.xp).toBe(10 * COFFEE_XP);
    st.lv![uid] = { lv: coffeeCap(), xp: 0 };
    expect(drinkCoffee(uid, 5)!.xp).toBe(0);
    expect(level(uid).lv).toBe(coffeeCap());
  });
});
