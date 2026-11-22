import { describe, it, expect } from 'vitest';
import { raceTime } from '../../src/story/regatta';
import type { Wind } from '../../src/story/wind';

/* a wind from `from` degrees (0 north, 90 east), blowing the other way */
const wind = (from: number, strength = 0.7): Wind => { const to = (from + 180) * Math.PI / 180; return { name: 'x', from, to: [Math.sin(to), -Math.cos(to)], strength, gust: 0 }; };

describe('the races at sea, sailed well (story/regatta.ts)', () => {
  it('goes faster before the wind than into it, and faster in a strong wind', () => {
    const east = raceTime([0, 0], [[30, 0]], wind(270)), west = raceTime([0, 0], [[30, 0]], wind(90));
    expect(east).toBeLessThan(west);
    expect(raceTime([0, 0], [[30, 0]], wind(270, 1))).toBeLessThan(raceTime([0, 0], [[30, 0]], wind(270, 0.35)));
  });
  it('beats up into the wind in two tacks rather than straight', () => {
    /* straight into a west wind the board crawls; the model finds the zig-zag */
    const t = raceTime([0, 0], [[-30, 0]], wind(270));
    expect(t).toBeGreaterThan(0);
    expect(t).toBeLessThan(30 * 0.47 / (0.32 * 1.01) * 0.8);
  });
});
