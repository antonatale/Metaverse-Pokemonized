/* Chiptune instruments built from oscillators and noise. Every sound is a short-lived graph of nodes
   that disconnects itself; nothing is loaded from files. */

const NAMES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
/** 'C#5', 'Bb3' → Hz */
export function hz(note: string): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(note);
  if (!m) throw new Error('bad note ' + note);
  const midi = (+m[3] + 1) * 12 + NAMES[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
  return 440 * Math.pow(2, (midi - 69) / 12);
}

let noiseBuf: AudioBuffer | null = null;
function noise(c: BaseAudioContext): AudioBuffer {
  if (noiseBuf && noiseBuf.sampleRate === c.sampleRate) return noiseBuf;
  const n = Math.floor(c.sampleRate * 1.2), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  let s = 12345;   /* the same hiss every time */
  for (let i = 0; i < n; i++) { s = (s * 1103515245 + 12345) >>> 0; d[i] = (s / 4294967296) * 2 - 1; }
  return (noiseBuf = b);
}

export interface ToneOpts {
  type?: OscillatorType;
  gain?: number;
  attack?: number;
  /** time to fall from the peak to the sustain level */
  decay?: number;
  sustain?: number;
  release?: number;
  /** slide to this frequency over the note */
  to?: number;
  /** lowpass cutoff, Hz */
  cutoff?: number;
  /** the cutoff closes (or opens) to this over the note */
  cutoffTo?: number;
  /** vibrato depth in cents, after a short delay */
  vibrato?: number;
  detune?: number;
}
/** one note: an oscillator through an optional lowpass and an ADSR envelope */
export function tone(c: BaseAudioContext, out: AudioNode, freq: number, t: number, dur: number, o: ToneOpts = {}) {
  const osc = c.createOscillator(), env = c.createGain();
  osc.type = o.type || 'square';
  osc.frequency.setValueAtTime(freq, t);
  if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);
  if (o.detune) osc.detune.value = o.detune;
  let node: AudioNode = osc;
  if (o.cutoff) {
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(o.cutoff, t);
    if (o.cutoffTo) f.frequency.exponentialRampToValueAtTime(Math.max(20, o.cutoffTo), t + dur);
    osc.connect(f); node = f;
  }
  if (o.vibrato) {
    const lfo = c.createOscillator(), depth = c.createGain();
    lfo.frequency.value = 5.5; depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(o.vibrato, t + Math.min(0.25, dur * 0.6));
    lfo.connect(depth); depth.connect(osc.detune); lfo.start(t); lfo.stop(t + dur + 0.3);
  }
  const g = o.gain == null ? 0.2 : o.gain, a = o.attack == null ? 0.005 : o.attack, d = o.decay == null ? 0.08 : o.decay;
  const sus = o.sustain == null ? 0.7 : o.sustain, r = o.release == null ? 0.06 : o.release;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(g, t + a);
  env.gain.linearRampToValueAtTime(g * sus, t + a + d);
  env.gain.setValueAtTime(g * sus, t + Math.max(a + d, dur));
  env.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(a + d, dur) + r);
  node.connect(env); env.connect(out);
  osc.start(t); osc.stop(t + Math.max(a + d, dur) + r + 0.02);
  osc.onended = function () { env.disconnect(); };
}

/* Sound never touches Math.random: the battle's seed comes from it, and a click sound must not change a battle. */
let jit = 7;
/** 0..1, our own sequence */
export function wobble(): number { jit = (jit * 1664525 + 1013904223) >>> 0; return jit / 4294967296; }

export interface NoiseOpts { gain?: number; type?: BiquadFilterType; freq?: number; to?: number; q?: number; attack?: number }
/** a burst of filtered noise: hats, snares, whooshes, crashes */
export function hiss(c: BaseAudioContext, out: AudioNode, t: number, dur: number, o: NoiseOpts = {}) {
  const src = c.createBufferSource(), f = c.createBiquadFilter(), env = c.createGain();
  src.buffer = noise(c);
  f.type = o.type || 'bandpass'; f.Q.value = o.q == null ? 1 : o.q;
  f.frequency.setValueAtTime(o.freq || 2000, t);
  if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + dur);
  const g = o.gain == null ? 0.2 : o.gain, a = o.attack == null ? 0.002 : o.attack;
  env.gain.setValueAtTime(0.0001, t);
  env.gain.linearRampToValueAtTime(g, t + a);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(env); env.connect(out);
  src.start(t, wobble() * 0.5); src.stop(t + dur + 0.02);
  src.onended = function () { env.disconnect(); };
}

/* ---------- drums ---------- */
export function kick(c: BaseAudioContext, out: AudioNode, t: number, gain = 0.55) { tone(c, out, 150, t, 0.16, { type: 'sine', to: 42, gain: gain, decay: 0.12, sustain: 0.2, release: 0.05 }); }
export function snare(c: BaseAudioContext, out: AudioNode, t: number, gain = 0.22) {
  hiss(c, out, t, 0.13, { freq: 1900, q: 0.8, gain: gain });
  tone(c, out, 190, t, 0.05, { type: 'triangle', to: 120, gain: gain * 0.8, decay: 0.04, sustain: 0.1 });
}
export function hat(c: BaseAudioContext, out: AudioNode, t: number, gain = 0.06) { hiss(c, out, t, 0.035, { type: 'highpass', freq: 7000, gain: gain }); }
