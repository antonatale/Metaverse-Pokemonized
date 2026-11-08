import { describe, expect, it } from 'vitest';
import { TRACKS, NIGHT_OF } from '../../src/audio/tracks';
import { worldMusic, settle, TUNE_WAIT, type TuneWait } from '../../src/audio/zones';
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

describe('the music of the places', () => {
  it('gives a night version of every tune of the map, slower and softer', () => {
    for (const n of NIGHT_OF) {
      const day = TRACKS[n], night = TRACKS[n + ':night'];
      expect(night, n).toBeTruthy();
      expect(night.bpm).toBeLessThan(day.bpm);
      expect(night.voices.length).toBe(day.voices.length);
      expect(night.voices[0].gain).toBeLessThan(day.voices[0].gain);
      expect(parse(night).steps).toBe(parse(day).steps);
    }
  });
  it('follows the neighbourhood, by the same table as the battle scenes, and always names a track that exists', () => {
    const at = (area: string, night = false, map = 'formia') => worldMusic(map, area, night);
    expect(at('Castellone')).toBe('castellone');
    expect(at('Mola')).toBe('mola');
    expect(at('Porto')).toBe('mola');
    expect(at('Caposele')).toBe('mola');
    expect(at('Vindicio')).toBe('vindicio');
    expect(at('Pineta di Vindicio')).toBe('vindicio');
    expect(at('Castellone', true)).toBe('castellone:night');
    /* a place with no tune of its own, out in the open, and indoors: the plain one */
    expect(at('Centro')).toBe('world');
    expect(at('Gianola', true)).toBe('world:night');
    expect(at('')).toBe('world');
    expect(at('Birreria Morgana', false, 'morgana')).toBe('world');
    for (const area of ['Castellone', 'Mola', 'Porto', 'Vindicio', 'Centro', 'Gianola', '', 'Monti Aurunci']) for (const night of [false, true]) expect(TRACKS[at(area, night)], area).toBeTruthy();
  });
});


describe('the music between two neighbourhoods', () => {
  const walk = (asked: [number, string][]) => {
    const w: TuneWait = { now: '', next: '', since: 0 };
    return asked.map(([t, a]) => settle(w, a, t));
  };
  it('does not change while Antonio walks along the edge, back and forth', () => {
    /* asked every 300 ms, as the map does, one side and then the other */
    const steps: [number, string][] = [];
    for (let k = 0; k < 30; k++) steps.push([k * 300, k % 4 < 2 ? 'mola' : 'castellone']);
    expect(new Set(walk(steps))).toEqual(new Set(['mola']));
  });
  it('changes once he has stayed in the new one for a moment, and only then', () => {
    const steps: [number, string][] = [[0, 'mola']];
    for (let t = 300; t <= 3000; t += 300) steps.push([t, 'castellone']);
    const got = walk(steps), when = steps[got.indexOf('castellone')][0];
    expect(when - 300).toBeGreaterThanOrEqual(TUNE_WAIT);
    expect(when - 300).toBeLessThan(TUNE_WAIT + 300);
    expect(got[got.length - 1]).toBe('castellone');
  });
  it('waits for the night the same way, and the first tune comes at once', () => {
    expect(walk([[0, 'world'], [300, 'world:night']])).toEqual(['world', 'world']);
    expect(walk([[0, 'world'], [300, 'world:night'], [300 + TUNE_WAIT, 'world:night']])).toEqual(['world', 'world', 'world:night']);
  });
});
