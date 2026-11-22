import { describe, expect, it } from 'vitest';
import { heightAt } from '../../src/render/canvas/panorama';
import { VIEWPOINTS } from '../../src/data/panorama';

/* The panoramas of the belvederi are computed from the land (data/panorama.ts): it must be where it is. */
describe('the land of the panoramas', () => {
  it('has Gaeta joined to the mainland, the gulf at sea, the heights where they are', () => {
    expect(heightAt(41.2085, 13.5810), 'the old town of Gaeta').toBeGreaterThan(0);
    expect(heightAt(41.2300, 13.5560), 'between Gaeta and Formia, on land').toBeGreaterThan(0);
    expect(heightAt(41.2400, 13.6100), 'the middle of the gulf').toBeLessThan(0);
    expect(heightAt(40.8000, 13.6000), 'the open sea').toBeLessThan(0);
    expect(heightAt(40.8960, 12.9620), 'Ponza').toBeGreaterThan(50);
    expect(heightAt(41.2970, 13.6125), 'the Redentore').toBeGreaterThan(1000);
    expect(heightAt(41.2565, 13.6070), 'the centre of Formia, low by the sea').toBeLessThan(120);
  }, 30_000);
  it('has every belvedere on land but the one out at sea', () => {
    for (const [id, v] of Object.entries(VIEWPOINTS)) {
      if (v.near === 'sea') expect(heightAt(v.at[0], v.at[1]), id).toBeLessThan(0);
      else expect(heightAt(v.at[0], v.at[1]), id).toBeGreaterThan(0);
    }
  });
});
