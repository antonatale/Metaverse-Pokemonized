import { describe, expect, it } from 'vitest';
import { density } from '../../tools/formia/density';
import { sunAt, sunTimes, setDayMode } from '../../src/story/daytime';

/* V3 of VISIONE.md: no screen without something to do. These are the numbers as a ceiling: a change to the map can
   bring them down, never up. When a task brings them down, lower them here. Before Formia on three levels (the morning
   of 11 November 2026) they were 28 screens and 50%. */
describe('how much there is to do in Formia', () => {
  const d = density();
  it('has no more screens to walk with nothing to do than today', () => {
    expect(d.empty.length).toBeLessThanOrEqual(8);
  });
  it('has no more desert than today: walkable tiles far from anything to do', () => {
    expect(d.desert / d.land).toBeLessThanOrEqual(0.18);
  });
});

/* V1 of VISIONE.md: the shadows turn with the sun. */
describe('the sun over Formia', () => {
  const at = (h: number) => { const d = new Date(2026, 5, 21, 0, 0, 0); d.setMinutes(Math.round(h * 60)); return d; };
  it('casts long shadows to the west in the morning, short ones at noon, long ones to the east in the evening', () => {
    setDayMode('auto');
    const t = sunTimes(at(12)), noon = (t[0] + t[1]) / 2;
    const morning = sunAt(at(t[0] + 1)), midday = sunAt(at(noon)), evening = sunAt(at(t[1] - 1));
    expect(morning.x).toBeLessThan(-0.5);
    expect(evening.x).toBeGreaterThan(0.5);
    expect(Math.abs(midday.x)).toBeLessThan(0.05);
    expect(midday.k).toBe(1);
    /* always a little towards the viewer, or a shadow would hide behind what casts it */
    [morning, midday, evening].forEach((s) => expect(s.y).toBeGreaterThan(0.2));
  });
  it('casts nothing at night, and follows the hour chosen in the menu', () => {
    setDayMode('auto');
    expect(sunAt(at(2)).k).toBe(0);
    setDayMode('notte');
    expect(sunAt(at(12)).k).toBe(0);
    setDayMode('tramonto');
    expect(sunAt(at(12)).x).toBeGreaterThan(1);
    setDayMode('auto');
  });
});
