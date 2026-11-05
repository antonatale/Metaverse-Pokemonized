import { live, sfxBus } from './context';
import { tone, hiss, hz } from './synth';
import { SPECIES, type Body, type SpeciesId } from '../data/creatures';
import type { TypeName } from '../data/types';

/* The cry of every creature, when it comes on, wins, and goes down. Like the first Pokémon games, which made 151 cries
   from a few dozen basic ones changed in pitch and length, there are a few shapes (one per body, `BODY`) and every
   species bends its own: lower when it is bigger and further along its line, a little different from the others by a
   number taken from its name, and coloured by its types (`TYPE_LAYER`). Everything is made on the spot, with no
   Math.random (a sound must not change a battle): the same species always sounds the same. */

export type CryEvent = 'entry' | 'win' | 'ko';
type Say = (c: BaseAudioContext, out: AudioNode, t: number, p: number, l: number) => void;

/** the shape of each body's cry, at pitch p and length l (1 and 1 for the smallest of the line); `mid` is about where it sits */
const BODY: Record<Body, { mid: number; say: Say }> = {
  octo: { mid: 520, say(c, out, t, p, l) { ['G4', 'C5', 'E5'].forEach(function (n, i) { tone(c, out, hz(n) * p, t + i * 0.07 * l, 0.06 * l, { type: 'sine', to: hz(n) * p * 1.4, gain: 0.22, decay: 0.03, sustain: 0.5 }); }); } },
  lizard: { mid: 390, say(c, out, t, p, l) { tone(c, out, 260 * p, t, 0.18 * l, { type: 'triangle', to: 520 * p, gain: 0.25, decay: 0.06, sustain: 0.6, vibrato: 25 }); } },
  bird: { mid: 1000, say(c, out, t, p, l) { [0, 0.2].forEach(function (d) { tone(c, out, 1300 * p, t + d * l, 0.16 * l, { type: 'square', to: 760 * p, gain: 0.07, cutoff: 3000, decay: 0.05, sustain: 0.6, vibrato: 30 }); }); } },
  cicada: { mid: 3800, say(c, out, t, p, l) { for (let k = 0; k < 8; k++) tone(c, out, 3800 * p, t + k * 0.035 * l, 0.022 * l, { type: 'square', gain: 0.05, cutoff: 7000, decay: 0.01, sustain: 0.5 }); } },
  olive: { mid: 1000, say(c, out, t, p, l) { tone(c, out, 880 * p, t, 0.4 * l, { type: 'sine', gain: 0.16, decay: 0.15, sustain: 0.3, release: 0.2 }); tone(c, out, 1320 * p, t + 0.08 * l, 0.35 * l, { type: 'sine', gain: 0.1, decay: 0.15, sustain: 0.3 }); } },
  urchin: { mid: 3000, say(c, out, t, p, l) { for (let k = 0; k < 4; k++) hiss(c, out, t + k * 0.06 * l, 0.03 * l, { freq: (5000 - k * 600) * p, q: 3, gain: 0.25 }); } },
  crab: { mid: 900, say(c, out, t, p, l) { [0, 0.13].forEach(function (d) { hiss(c, out, t + d * l, 0.04 * l, { freq: 1800 * p, q: 2, gain: 0.45 }); tone(c, out, 700 * p, t + d * l, 0.04 * l, { type: 'square', gain: 0.06, cutoff: 2500 }); }); } },
  owl: { mid: 400, say(c, out, t, p, l) { [0, 0.32].forEach(function (d) { tone(c, out, 420 * p, t + d * l, 0.24 * l, { type: 'sine', to: 380 * p, gain: 0.22, attack: 0.04, sustain: 0.7, release: 0.1 }); }); } },
  /* the creatures found later */
  jelly: { mid: 700, say(c, out, t, p, l) { tone(c, out, 620 * p, t, 0.3 * l, { type: 'sine', to: 900 * p, gain: 0.18, attack: 0.03, sustain: 0.6, release: 0.12, vibrato: 18 }); } },
  star: { mid: 1600, say(c, out, t, p, l) { [0, 0.09, 0.18].forEach(function (d, i) { tone(c, out, (1500 + i * 220) * p, t + d * l, 0.05 * l, { type: 'triangle', gain: 0.16, decay: 0.03, sustain: 0.4 }); }); } },
  eel: { mid: 300, say(c, out, t, p, l) { hiss(c, out, t, 0.28 * l, { freq: 2600 * p, to: 1200 * p, q: 1.2, gain: 0.4 }); tone(c, out, 220 * p, t + 0.2 * l, 0.12 * l, { type: 'sawtooth', to: 140 * p, gain: 0.08, cutoff: 1200, sustain: 0.5 }); } },
  dolphin: { mid: 2200, say(c, out, t, p, l) { [0, 0.12, 0.2].forEach(function (d) { tone(c, out, 1800 * p, t + d * l, 0.08 * l, { type: 'sine', to: 2800 * p, gain: 0.16, decay: 0.03, sustain: 0.6 }); }); } },
  fish: { mid: 300, say(c, out, t, p, l) { tone(c, out, 340 * p, t, 0.09 * l, { type: 'sine', to: 200 * p, gain: 0.3, decay: 0.05, sustain: 0.3 }); } },
  firefly: { mid: 2600, say(c, out, t, p, l) { [0, 0.1].forEach(function (d) { tone(c, out, 2600 * p, t + d * l, 0.05 * l, { type: 'sine', gain: 0.14, decay: 0.03, sustain: 0.5, release: 0.08 }); }); } },
  bat: { mid: 3200, say(c, out, t, p, l) { for (let k = 0; k < 3; k++) tone(c, out, 3400 * p, t + k * 0.06 * l, 0.03 * l, { type: 'square', to: 2400 * p, gain: 0.05, cutoff: 6000, decay: 0.01, sustain: 0.5 }); } },
  boar: { mid: 200, say(c, out, t, p, l) { [0, 0.16].forEach(function (d) { tone(c, out, 190 * p, t + d * l, 0.12 * l, { type: 'sawtooth', to: 150 * p, gain: 0.12, cutoff: 900, decay: 0.05, sustain: 0.5, vibrato: 40 }); }); } },
  falcon: { mid: 1500, say(c, out, t, p, l) { for (let k = 0; k < 3; k++) tone(c, out, 1700 * p, t + k * 0.1 * l, 0.07 * l, { type: 'square', to: 1300 * p, gain: 0.07, cutoff: 3500, decay: 0.03, sustain: 0.5 }); } },
  flower: { mid: 1200, say(c, out, t, p, l) { tone(c, out, 1100 * p, t, 0.22 * l, { type: 'sine', to: 1500 * p, gain: 0.14, attack: 0.02, sustain: 0.5, release: 0.1 }); hiss(c, out, t, 0.2 * l, { freq: 4000, q: 0.8, gain: 0.12 }); } },
  snail: { mid: 250, say(c, out, t, p, l) { hiss(c, out, t, 0.3 * l, { type: 'lowpass', freq: 900 * p, to: 400, gain: 0.35 }); tone(c, out, 260 * p, t, 0.3 * l, { type: 'sine', to: 220 * p, gain: 0.1, sustain: 0.6 }); } },
  cat: { mid: 700, say(c, out, t, p, l) { tone(c, out, 560 * p, t, 0.3 * l, { type: 'sawtooth', to: 760 * p, gain: 0.08, cutoff: 2200, attack: 0.03, decay: 0.1, sustain: 0.6, release: 0.1, vibrato: 12 }); } },
  janus: { mid: 160, say(c, out, t, p, l) { tone(c, out, 165 * p, t, 0.6 * l, { type: 'triangle', gain: 0.18, attack: 0.05, sustain: 0.7, release: 0.2 }); tone(c, out, 247 * p, t + 0.05 * l, 0.6 * l, { type: 'triangle', gain: 0.12, attack: 0.05, sustain: 0.7, release: 0.2 }); } },
  flame: { mid: 400, say(c, out, t, p, l) { hiss(c, out, t, 0.45 * l, { freq: 1200 * p, to: 3200 * p, q: 0.7, gain: 0.35 }); for (let k = 0; k < 4; k++) hiss(c, out, t + 0.1 * l + k * 0.07 * l, 0.02 * l, { freq: 5000, q: 3, gain: 0.3 }); } },
  /* the king of the giants: a low roar, a rumble underneath, and the breath */
  giant: { mid: 90, say(c, out, t, p, l) {
    tone(c, out, 95 * p, t, 0.55 * l, { type: 'sawtooth', to: 55 * p, gain: 0.2, cutoff: 700, decay: 0.15, sustain: 0.6, release: 0.15, vibrato: 30 });
    tone(c, out, 48 * p, t, 0.6 * l, { type: 'sine', to: 34 * p, gain: 0.3, decay: 0.2, sustain: 0.5, release: 0.15 });
    hiss(c, out, t, 0.5 * l, { type: 'lowpass', freq: 500 * p, to: 120, gain: 0.35 });
  } }
};

/** the vowels a creature that talks says: the two formants (Hz) of a, e, i, o, u */
const VOWEL: [number, number][] = [[800, 1200], [450, 1900], [300, 2300], [500, 900], [320, 800]];
/** one syllable: a buzzing voice through two band-pass filters, which is what a vowel is */
function syllable(c: BaseAudioContext, out: AudioNode, t: number, dur: number, f0: number, vowel: number, gain: number) {
  const osc = c.createOscillator(), env = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(f0, t); osc.frequency.linearRampToValueAtTime(f0 * 0.88, t + dur);
  VOWEL[vowel].forEach(function (fc, i) {
    const bp = c.createBiquadFilter(), g = c.createGain();
    bp.type = 'bandpass'; bp.frequency.value = fc; bp.Q.value = 4; g.gain.value = i ? 0.55 : 1;
    osc.connect(bp); bp.connect(g); g.connect(env);
  });
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(gain, t + 0.012);
  env.gain.setValueAtTime(gain * 0.8, t + dur * 0.6);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.03);
  env.connect(out);
  osc.start(t); osc.stop(t + dur + 0.05);
  osc.onended = function () { env.disconnect(); };
}

/** what a type adds to the body's cry: k is 1 for the creature's own type and less for its second one */
type Layer = (c: BaseAudioContext, out: AudioNode, t: number, v: Voice, k: number) => void;
const TYPE_LAYER: Record<TypeName, Layer> = {
  /* the moon: a soft low hum */
  Calma(c, out, t, v, k) { tone(c, out, 220 * v.pitch, t, 0.4 * v.length, { type: 'sine', gain: 0.1 * k, attack: 0.08, sustain: 0.8, release: 0.2, vibrato: 10 }); },
  /* lightning: a crackle and a zap */
  Caos(c, out, t, v, k) {
    hiss(c, out, t, 0.07 * v.length, { freq: 2600 * v.pitch, q: 1.5, gain: 0.16 * k });
    tone(c, out, 900 * v.pitch, t + 0.02, 0.06 * v.length, { type: 'square', to: 300 * v.pitch, gain: 0.06 * k, cutoff: 3000 });
  },
  /* the stars: two bright notes */
  Cervello(c, out, t, v, k) { ['E6', 'B6'].forEach(function (n, i) { tone(c, out, hz(n) * v.pitch, t + 0.05 + i * 0.06 * v.length, 0.07 * v.length, { type: 'sine', gain: 0.07 * k, decay: 0.03, sustain: 0.4 }); }); },
  /* the song: it talks, a syllable more for each form */
  Chiacchiera(c, out, t, v, k) {
    for (let i = 0; i < v.syllables; i++) syllable(c, out, t + 0.02 + i * 0.085 * v.length, 0.07 * v.length, 170 * v.pitch * (1 + i * 0.04), (v.vowel + i) % VOWEL.length, 0.5 * k);
  },
  /* the heart: a warm sigh, two notes a fifth apart */
  Cuore(c, out, t, v, k) { ['C5', 'G5'].forEach(function (n, i) { tone(c, out, hz(n) * v.pitch, t + 0.02 + i * 0.12 * v.length, 0.25 * v.length, { type: 'sine', gain: 0.08 * k, attack: 0.05, sustain: 0.7, release: 0.15, vibrato: 8 }); }); },
  /* the sea: a wave that rises and breaks, and a bubble */
  Corrente(c, out, t, v, k) {
    hiss(c, out, t, 0.32 * v.length, { type: 'lowpass', freq: 500 * v.pitch, to: 1800 * v.pitch, gain: 0.22 * k, attack: 0.1 });
    tone(c, out, 380 * v.pitch, t + 0.2 * v.length, 0.06 * v.length, { type: 'sine', to: 760 * v.pitch, gain: 0.09 * k, decay: 0.03, sustain: 0.4 });
  },
  /* the fire: a roar of flame and its crackle */
  Calore(c, out, t, v, k) {
    hiss(c, out, t, 0.22 * v.length, { freq: 900 * v.pitch, to: 2400 * v.pitch, q: 0.6, gain: 0.18 * k });
    for (let i = 0; i < 3; i++) hiss(c, out, t + 0.04 + i * 0.05 * v.length, 0.015, { freq: 4800, q: 4, gain: 0.22 * k });
  },
  /* the wind: a whistle that climbs */
  Cielo(c, out, t, v, k) { tone(c, out, 900 * v.pitch, t, 0.3 * v.length, { type: 'sine', to: 1500 * v.pitch, gain: 0.06 * k, attack: 0.08, sustain: 0.7, release: 0.12, vibrato: 14 }); },
  /* the stone: two knocks, low and hard */
  Corazza(c, out, t, v, k) { [0, 0.11].forEach(function (d) { tone(c, out, 120 * v.pitch, t + d * v.length, 0.06, { type: 'triangle', to: 70 * v.pitch, gain: 0.22 * k, decay: 0.03, sustain: 0.2 }); hiss(c, out, t + d * v.length, 0.03, { type: 'lowpass', freq: 700, gain: 0.25 * k }); }); },
  /* the dusk: a falling minor third, wavering, like a call in the half-dark */
  Crepuscolo(c, out, t, v, k) { ['E5', 'C#5'].forEach(function (n, i) { tone(c, out, hz(n) * v.pitch * 0.5, t + 0.04 + i * 0.16 * v.length, 0.22 * v.length, { type: 'triangle', gain: 0.08 * k, attack: 0.04, sustain: 0.7, release: 0.18, vibrato: 22 }); }); }
};

/** how one species sounds: the numbers that bend its body's cry */
export interface Voice { body: Body; pitch: number; length: number; types: TypeName[]; syllables: number; vowel: number; deep: boolean }

/** a small number from a name, always the same (FNV-1a) */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
export function voiceOf(sp: SpeciesId): Voice {
  const S = SPECIES[sp], h = hash(sp), tilt = ((h % 1000) / 1000 - 0.5) * 0.12;   /* a few percent either way */
  return {
    body: S.art.body,
    pitch: +(Math.pow(1 / S.art.size, 0.9) * [1, 0.92, 0.82][S.stage - 1] * (1 + tilt)).toFixed(3),
    length: [1, 1.15, 1.3][S.stage - 1],
    types: S.type2 ? [S.type, S.type2] : [S.type],
    syllables: S.stage + 1,
    vowel: h % VOWEL.length,
    deep: S.stage === 3
  };
}

/** which cry a line of the creature is: its coming-on, its winning, or its going down (the lines are in `cry` of the species) */
export function cryEventOf(sp: SpeciesId, text: string): CryEvent {
  const c = SPECIES[sp].cry;
  return text === c.ko ? 'ko' : text === c.win ? 'win' : 'entry';
}

/** a cry on any context and output (the audio test renders them offline) */
export function renderCry(c: BaseAudioContext, out: AudioNode, sp: SpeciesId, ev: CryEvent, t: number, gold = false) {
  const v = voiceOf(sp), body = BODY[v.body];
  const p = v.pitch * (ev === 'win' ? 1.18 : ev === 'ko' ? 0.88 : 1), l = v.length * (ev === 'ko' ? 1.25 : 1);
  body.say(c, out, t, p, l);
  /* winning: said again, a little higher, the way the texts say it twice */
  if (ev === 'win') body.say(c, out, t + 0.3 * l, p * 1.1, l);
  v.types.forEach(function (ty, i) { TYPE_LAYER[ty](c, out, t, { ...v, pitch: p, length: l }, i ? 0.6 : 1); });
  /* the last forms are deeper: an octave under the body */
  if (v.deep) tone(c, out, Math.max(40, body.mid * p * 0.5), t, 0.5 * l, { type: 'sine', gain: 0.1, attack: 0.03, sustain: 0.6, release: 0.2 });
  /* going down: it slides down while the filter closes */
  if (ev === 'ko') tone(c, out, body.mid * p, t + 0.04, 0.55 * l, { type: 'triangle', to: Math.max(40, body.mid * p * 0.3), gain: 0.14, cutoff: Math.max(2400, body.mid * p * 2), cutoffTo: Math.max(200, body.mid * p * 0.4), sustain: 0.6, release: 0.1 });
  /* a golden one, coming on, glitters */
  if (gold && ev === 'entry') ['C7', 'E7', 'G7'].forEach(function (n, i) { tone(c, out, hz(n), t + 0.04 + i * 0.05, 0.12, { type: 'sine', gain: 0.05, decay: 0.05, sustain: 0.4 }); });
}

/** a cry now (and quietly nothing until a gesture has unlocked the sound, or when it is off) */
export function cry(sp: SpeciesId, ev: CryEvent, gold = false) {
  const c = live();
  if (!c) return;
  renderCry(c, sfxBus, sp, ev, c.currentTime + 0.005, gold);
}
