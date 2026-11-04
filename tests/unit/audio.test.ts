import { describe, expect, it } from 'vitest';
import { TRACKS } from '../../src/audio/tracks';
import { parse } from '../../src/audio/music';
import { hz } from '../../src/audio/synth';
import { SFX_NAMES } from '../../src/audio/sfx';
import { CUE_NAMES } from '../../src/audio/cues';
import { voiceOf, cryEventOf } from '../../src/audio/cries';
import { SPECIES, type SpeciesId } from '../../src/data/creatures';

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

describe('the cries of the creatures', () => {
  const ids = Object.keys(SPECIES) as SpeciesId[];
  it('give every species a voice, with sane numbers, always the same', () => {
    for (const id of ids) {
      const v = voiceOf(id);
      expect(v.pitch, id).toBeGreaterThan(0.5); expect(v.pitch, id).toBeLessThan(1.7);
      expect([1, 1.15, 1.3], id).toContain(v.length);
      expect(v.types.length, id).toBeGreaterThanOrEqual(1);
      expect(v.syllables, id).toBeGreaterThan(1);
      expect(voiceOf(id)).toEqual(v);
    }
  });
  it('are all different, even for species of the same body', () => {
    const seen = new Set(ids.map((id) => JSON.stringify(voiceOf(id))));
    expect(seen.size).toBe(ids.length);
    const pitches = ids.filter((id) => SPECIES[id].art.body === 'octo').map((id) => voiceOf(id).pitch);
    expect(new Set(pitches).size).toBe(pitches.length);
  });
  it('get deeper as the form goes on: each form of a line is lower than the one before', () => {
    for (const id of ids) {
      const next = SPECIES[id].evolve && SPECIES[id].evolve!.into;
      if (next) expect(voiceOf(next).pitch, id + ' → ' + next).toBeLessThan(voiceOf(id).pitch);
    }
  });
  it('tell a creature coming on from winning and from going down by its lines', () => {
    for (const id of ids) {
      const c = SPECIES[id].cry;
      expect(cryEventOf(id, c.entry)).toBe('entry');
      expect(cryEventOf(id, c.win)).toBe('win');
      expect(cryEventOf(id, c.ko)).toBe('ko');
    }
  });
  it('include the giant, which had no cry at all', () => {
    expect(voiceOf('lamo').body).toBe('giant');
    expect(voiceOf('lamo').pitch).toBeLessThan(1);
  });
});
