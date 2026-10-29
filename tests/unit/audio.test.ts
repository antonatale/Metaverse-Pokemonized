import { describe, expect, it } from 'vitest';
import { TRACKS } from '../../src/audio/tracks';
import { parse } from '../../src/audio/music';
import { hz } from '../../src/audio/synth';
import { SFX_NAMES } from '../../src/audio/sfx';
import { CUE_NAMES } from '../../src/audio/cues';

describe('soundtrack', () => {
  it('tunes notes to A4 = 440 Hz', () => {
    expect(hz('A4')).toBeCloseTo(440, 6);
    expect(hz('A5')).toBeCloseTo(880, 6);
    expect(hz('C#5')).toBeCloseTo(hz('Db5'), 6);
    expect(() => hz('H2')).toThrow();
  });
  for (const [name, t] of Object.entries(TRACKS)) {
    it(name + ': every bar is 16 steps of valid notes, every voice as long as the others', () => {
      const p = parse(t);
      expect(p.steps % 16).toBe(0);
      p.voices.forEach((v) => expect(v.length).toBeGreaterThan(0));
      p.voices.flat().forEach((n) => { expect(n.freq).toBeGreaterThan(30); expect(n.freq).toBeLessThan(4200); expect(n.step + n.len).toBeLessThanOrEqual(p.steps); });
    });
  }
  it('has a sound for every cue of the battle', () => {
    CUE_NAMES.forEach((n) => expect(SFX_NAMES, n).toContain(n));
    ['click', 'blip', 'blipVoice', 'step', 'door', 'pickup', 'badge'].forEach((n) => expect(SFX_NAMES, n).toContain(n));
  });
});
