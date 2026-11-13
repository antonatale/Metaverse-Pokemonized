import { describe, expect, it } from 'vitest';
import { SHOPS, WARES, marketToday, MANUALS } from '../../src/data/growth';
import { allNews, newsOf } from '../../src/story/newspaper';
import { HIDINGS } from '../../src/data/encounters';
import { MAPS } from '../../src/data/maps';

/* The shops of the town (data/growth.ts SHOPS, data/maps/formia.ts SHOP_AT): each one its own, and what they say is true. */
describe('the shops of the town', () => {
  it('are each a different place: no two sell the same things, and each has a face of its own on the map', () => {
    const seen = new Set<string>();
    for (const [id, sh] of Object.entries(SHOPS)) {
      const key = sh.sells.slice().sort().join(',');
      expect(seen.has(key), id + ' sells what another sells').toBe(false);
      seen.add(key);
      for (const it of sh.sells) expect(WARES[it], id + ': ' + it).toBeTruthy();
    }
    const town = (MAPS.formia.buildings || []).filter((b) => b.shop);
    /* a shop in a palazzo of a cortina shows its face on the ground floor (its look) */
    const kinds = town.map((b) => (b.kind === 'cortina' ? 'cortina:' + b.look : b.kind));
    expect(new Set(kinds).size, 'one face each').toBe(kinds.length);
    expect(town.map((b) => b.shop).sort()).toEqual(['bar', 'edicola', 'farmacia', 'forno', 'libreria', 'mercato', 'pescheria']);
    expect((MAPS.formia.buildings || []).filter((b) => b.kind === 'shop'), 'no shop front left without a shop').toEqual([]);
  });
  it('the market: every stall on Saturday, two on the other days, never the same two two days running', () => {
    const all = SHOPS.mercato.sells;
    expect(marketToday(6, all)).toEqual(all);
    for (let d = 0; d < 6; d++) {
      expect(marketToday(d, all)).toHaveLength(2);
      if (d < 5) expect(marketToday(d, all)).not.toEqual(marketToday(d + 1, all));
    }
    expect(MANUALS).toBe(3);
  });
  it('the newspaper says only true things: a creature seldom met, in that place, at that hour', () => {
    const news = allNews();
    expect(news.length).toBeGreaterThan(5);
    for (const n of news) {
      const h = Object.values(HIDINGS).find((x) => x.name === n.place)!;
      const table = n.night ? h.night! : h.day;
      expect(table.find((m) => m.sp === n.sp)!.w, n.place + ' ' + n.sp).toBe(1);
    }
    expect(newsOf(20400)).toEqual(newsOf(20400));
    expect(newsOf(20400)).not.toEqual(newsOf(20401));
  });
});
