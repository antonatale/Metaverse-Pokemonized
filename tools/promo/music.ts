import { renderSfx } from '../../src/audio/sfx';
import { hz } from '../../src/audio/synth';
import { BEAT, BAR, BARS, at, LENGTH, CUES } from './timeline';

/* The trailer's music, rendered offline in the browser (Web Audio, like the game's own): an original piece at
   120 bpm in A minor, mysterious and then glorious, that follows the parts of timeline.ts:
     intro      bars 0–4    night wind, a music box, a distant choir, the heartbeat of the timpani
     logo       5–6         the hit, and a brass fanfare
     friends    7–14        the hero's theme on the horns: taiko, cellos, choir (the last two bars over Formia from above)
     world      15–20       lighter: a harp, a celesta, the theme again on the strings; then evening, the music box
     build      21–23       tremolo, a timpani roll, the choir rising; silence before the drop
     creatures  24–33       everything: taiko, brass, choir, strings, the theme in full; then the shadow of a giant
     plot       34–37       the music box again, a low choir, the heartbeat
     dream      38–39       wonder: a harp and bells climbing
     finale     40–45       the theme an octave up, the chiptune of the game inside it, climbing
     outro      46–49       a glorious A major, the theme's first notes echoing away
   Nothing is sampled: every sound is an oscillator or noise, and the game's own effects come from src/audio/sfx. */

const S16 = BEAT / 4;
const CHORD: Record<string, string[]> = {
  Am: ['A3', 'C4', 'E4', 'A4'], F: ['F3', 'A3', 'C4', 'F4'], G: ['G3', 'B3', 'D4', 'G4'], E: ['E3', 'G#3', 'B3', 'E4'],
  Dm: ['D3', 'F3', 'A3', 'D4'], C: ['C4', 'E4', 'G4', 'C5'], A: ['A3', 'C#4', 'E4', 'A4']
};
const ROOT: Record<string, string> = { Am: 'A1', F: 'F1', G: 'G1', E: 'E1', Dm: 'D2', C: 'C2', A: 'A1' };
/** arpeggio tones, two octaves up */
const ARP: Record<string, string[]> = {
  Am: ['A4', 'C5', 'E5', 'A5', 'C6', 'E6'], F: ['F4', 'A4', 'C5', 'F5', 'A5', 'C6'], G: ['G4', 'B4', 'D5', 'G5', 'B5', 'D6'],
  E: ['E4', 'G#4', 'B4', 'E5', 'G#5', 'B5'], Dm: ['D4', 'F4', 'A4', 'D5', 'F5', 'A5'], C: ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'],
  A: ['A4', 'C#5', 'E5', 'A5', 'C#6', 'E6']
};
/** the way the harp and the chiptune walk through them */
const ARP_STEPS = [0, 1, 2, 3, 4, 5, 4, 3, 2, 3, 4, 5, 4, 3, 2, 1];
/** the cellos' sixteenths: which note of the chord, an octave down */
const OST = [0, 0, 2, 0, 3, 0, 2, 0, 0, 0, 2, 0, 3, 0, 2, 1];
/** the heroic progression */
const CYCLE = ['Am', 'F', 'C', 'G'];
/* the hero's theme (original), Am F C G, eight bars */
const HERO = [
  'A4 - - - - - - - E5 - - - A5 - - -',
  'G5 - - - F5 - - - E5 - - - C5 - - -',
  'E5 - - - - - - - G5 - - - C6 - - -',
  'B5 - - - A5 - - - G5 - - - D5 - - -',
  'A5 - - - - - - - E5 - - - A5 - C6 -',
  'C6 - - - A5 - - - F5 - - - A5 - - -',
  'G5 - - - E5 - - - G5 - - - C6 - - -',
  'D6 - - - - - - - B5 - - - - - - -'
];
const FANFARE = ['A4 - - - E5 - - - A5 - - - - - - -', 'G#5 - - - B5 - - - E6 - - - - - - -'];
const CLIMB = ['F5 - - - A5 - - - C6 - - - F6 - - -', 'G5 - - - B5 - - - D6 - - - G6 - - -'];
/* the mystery, on a music box: Am F Dm E */
const BELL = [
  'E5 - - - A5 - - - C6 - - - B5 - A5 -',
  'A5 - - - G5 - - - F5 - - - E5 - - -',
  'D5 - - - F5 - - - A5 - - - G5 - F5 -',
  'E5 - - - G#5 - - - B5 - - - . . . .'
];
const FAR = ['A4 - - - E5 - - - A5 - - - - - - -', 'C#6 - - - - - - - - - - - - - - -'];
/** the choir's vowels: formants, [Hz, gain] */
const VOWEL: Record<string, number[][]> = {
  a: [[800, 1], [1150, 0.5], [2900, 0.12]],
  o: [[450, 1], [800, 0.5], [2830, 0.06]],
  u: [[325, 1], [700, 0.25], [2530, 0.04]]
};

interface N { step: number; len: number; note: string }
function parse(bars: string[]): N[] {
  const out: N[] = [];
  const toks = bars.flatMap(function (b, i) {
    const x = b.trim().split(/\s+/);
    if (x.length !== 16) throw new Error('bar ' + i + ' has ' + x.length + ' steps: ' + b);
    return x;
  });
  toks.forEach(function (tk, i) {
    if (tk === '-') { const l = out[out.length - 1]; if (l && l.step + l.len === i) l.len++; return; }
    if (tk !== '.') out.push({ step: i, len: 1, note: tk });
  });
  return out;
}

/** a little deterministic randomness, for humanising */
let seed = 99;
function rnd() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }

export async function renderMusic(rate = 48000): Promise<{ wav: string; peak: number; reduction: number; rms: number[] }> {
  const c = new OfflineAudioContext(2, Math.ceil(LENGTH * rate), rate);

  /* ---------- the mixer ---------- */
  /* the master runs a little cool, so the saturator only rounds the peaks and the limiter at the end does the rest */
  const master = c.createGain(), MASTER = 0.55; master.gain.value = MASTER;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 2.5; comp.attack.value = 0.006; comp.release.value = 0.2;
  const sat = c.createWaveShaper(); sat.curve = curve(1.25); sat.oversample = '4x';
  master.connect(comp); comp.connect(sat); sat.connect(c.destination);
  master.gain.setValueAtTime(MASTER, LENGTH - 2.2); master.gain.linearRampToValueAtTime(0.0001, LENGTH - 0.05);

  /* a room for the drums and the leads, and a long hall for the orchestra and the choir */
  const verb = c.createConvolver(); verb.buffer = impulse(3.2, 3.2);
  const verbIn = c.createGain(), verbOut = c.createGain(); verbOut.gain.value = 0.32;
  const verbLp = c.createBiquadFilter(); verbLp.type = 'lowpass'; verbLp.frequency.value = 5200;
  verbIn.connect(verb); verb.connect(verbLp); verbLp.connect(verbOut); verbOut.connect(master);
  const hall = c.createConvolver(); hall.buffer = impulse(5.5, 2.4);
  const hallIn = c.createGain(), hallOut = c.createGain(); hallOut.gain.value = 0.3;
  const hallLp = c.createBiquadFilter(); hallLp.type = 'lowpass'; hallLp.frequency.value = 4200;
  hallIn.connect(hall); hall.connect(hallLp); hallLp.connect(hallOut); hallOut.connect(master);
  /* a ping-pong delay, a dotted eighth */
  const dIn = c.createGain(), dl = c.createDelay(2), dr = c.createDelay(2), fb = c.createGain(), dOut = c.createGain(), mrg = c.createChannelMerger(2), dLp = c.createBiquadFilter();
  dl.delayTime.value = BEAT * 0.75; dr.delayTime.value = BEAT * 0.75; fb.gain.value = 0.4; dOut.gain.value = 0.32;
  dLp.type = 'lowpass'; dLp.frequency.value = 3800;
  dIn.connect(dl); dl.connect(mrg, 0, 0); dl.connect(dr); dr.connect(mrg, 0, 1); dr.connect(fb); fb.connect(dl);
  mrg.connect(dLp); dLp.connect(dOut); dOut.connect(master); dOut.connect(verbIn);

  const drums = c.createGain(); drums.gain.value = 0.7; drums.connect(master);
  const kickBus = c.createGain(); const kickSat = c.createWaveShaper(); kickSat.curve = curve(2.2);
  kickBus.connect(kickSat); kickSat.connect(drums);
  /* the orchestra dips a little under each kick, the sub more */
  const orch = c.createGain(), orchDuck = c.createGain(); orch.connect(orchDuck); orchDuck.connect(master);
  const strBus = c.createGain(), brassBus = c.createGain(), choirBus = c.createGain();
  strBus.gain.value = 2; brassBus.gain.value = 1.75; choirBus.gain.value = 2.5;
  [strBus, brassBus, choirBus].forEach(function (b) { b.connect(orch); });
  const lows = c.createGain(), lowsDuck = c.createGain(); lows.gain.value = 0.4; lows.connect(lowsDuck); lowsDuck.connect(master);
  const lead = c.createGain(); lead.gain.value = 1.9; lead.connect(master);
  const fx = c.createGain(); fx.connect(master);
  const sfxBus = c.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
  const send = function (from: AudioNode, to: AudioNode, g: number) { const s = c.createGain(); s.gain.value = g; from.connect(s); s.connect(to); };
  send(strBus, hallIn, 0.3); send(brassBus, hallIn, 0.25); send(brassBus, verbIn, 0.1); send(choirBus, hallIn, 0.6);
  send(lead, verbIn, 0.22); send(lead, dIn, 0.28); send(lead, hallIn, 0.15); send(fx, verbIn, 0.45); send(sfxBus, verbIn, 0.2);

  const ducks: { t: number; depth: number; rel: number }[] = [];
  const noiseBuf = noise(2.5);
  const pulse25 = pulseWave(0.25), pulse125 = pulseWave(0.125);

  /* ---------- instruments ---------- */
  function env(g: GainNode, t: number, peak: number, a: number, hold: number, rel: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    if (hold > a) g.gain.setValueAtTime(peak, t + hold);
    g.gain.setTargetAtTime(0.0001, t + Math.max(a, hold), rel / 3);
  }
  function noiseSrc(t: number, dur: number): AudioBufferSourceNode {
    const s = c.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
    s.start(t, rnd() * 2); s.stop(t + dur + 0.05);
    return s;
  }
  function filt(type: BiquadFilterType, f: number, q = 0.7): BiquadFilterNode { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; }

  function kick(t: number, g = 0.9, duck = 0.25, rel = 0.22) {
    const o = c.createOscillator(), e = c.createGain();
    o.frequency.setValueAtTime(200, t); o.frequency.exponentialRampToValueAtTime(55, t + 0.06); o.frequency.exponentialRampToValueAtTime(42, t + 0.4);
    e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(g * 0.6, t + 0.003); e.gain.setTargetAtTime(0.0001, t + 0.08, 0.08);
    o.connect(e); e.connect(kickBus); o.start(t); o.stop(t + 0.8);
    const n = noiseSrc(t, 0.02), hp = filt('highpass', 3000), ne = c.createGain();
    ne.gain.setValueAtTime(g * 0.6, t); ne.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    n.connect(hp); hp.connect(ne); ne.connect(drums);
    if (duck < 1) ducks.push({ t, depth: duck, rel });
  }
  /** a taiko: the skin falls from 118 Hz, with the thud of the stick (pitch > 1 for the smaller drums) */
  function taiko(t: number, g = 0.8, pitch = 1) {
    const o = c.createOscillator(), e = c.createGain();
    o.frequency.setValueAtTime(118 * pitch, t); o.frequency.exponentialRampToValueAtTime(54 * pitch, t + 0.08); o.frequency.exponentialRampToValueAtTime(42 * pitch, t + 0.5);
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g * 0.6, t + 0.004); e.gain.setTargetAtTime(0.0001, t + 0.04, 0.14 / Math.sqrt(pitch));
    o.connect(e); e.connect(kickBus); send(e, hallIn, 0.18); o.start(t); o.stop(t + 1.2);
    const n = noiseSrc(t, 0.3), lp = filt('lowpass', 700 * pitch, 0.9), ne = c.createGain();
    ne.gain.setValueAtTime(0.0001, t); ne.gain.linearRampToValueAtTime(g * 0.9, t + 0.002); ne.gain.setTargetAtTime(0.0001, t + 0.008, 0.05);
    n.connect(lp); lp.connect(ne); ne.connect(drums); send(ne, hallIn, 0.35);
  }
  /** a timpani: the note and its inharmonic partials, a little high at the stroke */
  function timp(t: number, note: string, g = 0.4, dec = 1) {
    const f = hz(note);
    [[1, 1, 1], [1.5, 0.5, 0.6], [1.98, 0.35, 0.5], [2.44, 0.18, 0.35]].forEach(function (p) {
      const o = c.createOscillator(), e = c.createGain();
      o.frequency.setValueAtTime(f * p[0] * 1.025, t); o.frequency.exponentialRampToValueAtTime(f * p[0], t + 0.07);
      e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g * p[1], t + 0.006); e.gain.setTargetAtTime(0.0001, t + 0.02, dec * p[2] * 0.4);
      o.connect(e); e.connect(drums); send(e, hallIn, 0.4); o.start(t); o.stop(t + dec * 2.5 + 0.3);
    });
    const n = noiseSrc(t, 0.1), bp = filt('bandpass', 500, 0.8), ne = c.createGain();
    ne.gain.setValueAtTime(0.0001, t); ne.gain.linearRampToValueAtTime(g * 0.5, t + 0.002); ne.gain.setTargetAtTime(0.0001, t + 0.004, 0.025);
    n.connect(bp); bp.connect(ne); ne.connect(drums);
  }
  /** a timpani roll: sixteen strokes a second, growing from g0 to g1 */
  function roll(t: number, dur: number, note: string, g0: number, g1: number) {
    const n = Math.round(dur * 16);
    for (let k = 0; k < n; k++) { const p = k / n; timp(t + k / 16 + rnd() * 0.006, note, (g0 + (g1 - g0) * p * p) * (0.85 + rnd() * 0.3), 0.45); }
  }
  function snare(t: number, g = 0.45, pitch = 210) {
    const o = c.createOscillator(), e = c.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(pitch, t); o.frequency.exponentialRampToValueAtTime(pitch * 0.72, t + 0.07);
    env(e, t, g * 0.7, 0.002, 0.01, 0.1); o.connect(e); e.connect(drums); o.start(t); o.stop(t + 0.3);
    const n = noiseSrc(t, 0.3), bp = filt('bandpass', 2400, 0.6), ne = c.createGain();
    env(ne, t, g, 0.002, 0.01, 0.17); n.connect(bp); bp.connect(ne); ne.connect(drums); send(ne, verbIn, 0.2); send(ne, hallIn, 0.15);
  }
  function clap(t: number, g = 0.5) {
    for (let k = 0; k < 3; k++) {
      const n = noiseSrc(t + k * 0.011, 0.02), bp = filt('bandpass', 1500, 1.1), e = c.createGain();
      e.gain.setValueAtTime(g, t + k * 0.011); e.gain.exponentialRampToValueAtTime(0.0001, t + k * 0.011 + 0.012);
      n.connect(bp); bp.connect(e); e.connect(drums);
    }
    const n = noiseSrc(t + 0.033, 0.4), bp = filt('bandpass', 1300, 0.9), e = c.createGain();
    env(e, t + 0.033, g * 0.9, 0.001, 0.005, 0.2); n.connect(bp); bp.connect(e); e.connect(drums); send(e, verbIn, 0.35);
  }
  function hat(t: number, g = 0.12, open = false) {
    const n = noiseSrc(t, open ? 0.4 : 0.08), hp = filt('highpass', open ? 6500 : 7800), e = c.createGain(), p = c.createStereoPanner();
    p.pan.value = 0.18;
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g * 1.8, t + 0.001); e.gain.setTargetAtTime(0.0001, t + 0.002, open ? 0.08 : 0.014);
    n.connect(hp); hp.connect(e); e.connect(p); p.connect(drums);
  }
  function crash(t: number, g = 0.22) {
    const n = noiseSrc(t, 3), hp = filt('highpass', 4200), e = c.createGain();
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + 0.003); e.gain.setTargetAtTime(0.0001, t + 0.01, 0.55);
    n.connect(hp); hp.connect(e); e.connect(drums); send(e, verbIn, 0.4);
  }
  function tick(t: number, g = 0.05, hi = true) {
    const o = c.createOscillator(), e = c.createGain(); o.type = 'sine'; o.frequency.value = hi ? 3150 : 2350;
    e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
    o.connect(e); e.connect(drums); send(e, dIn, 0.3); o.start(t); o.stop(t + 0.05);
  }
  /** the sub: a clean sine under the roots, with a little octave so small speakers hear it */
  function sub(t: number, dur: number, note: string, g = 0.3) {
    [[1, 1], [2, 0.22]].forEach(function (p) {
      const o = c.createOscillator(), e = c.createGain(); o.frequency.value = hz(note) * p[0];
      env(e, t, g * p[1], 0.03, dur, 0.3); o.connect(e); e.connect(lows); o.start(t); o.stop(t + dur + 1);
    });
  }
  /** strings, bowed: four detuned saws a note spread in stereo, a soft bow, vibrato, a warm filter; trem bows them fast */
  function strings(t: number, dur: number, notes: string[], g: number, o: { a?: number; rel?: number; cut?: number; trem?: boolean } = {}) {
    const a = o.a == null ? 0.25 : o.a, rel = o.rel == null ? 0.5 : o.rel, end = t + dur + rel * 2 + 0.2;
    const f = filt('lowpass', o.cut || 3200, 0.6), e = c.createGain();
    env(e, t, g, a, dur, rel);
    f.connect(e);
    if (o.trem) {
      const am = c.createGain(), lfo = c.createOscillator(), ld = c.createGain();
      am.gain.value = 0.55; lfo.type = 'triangle'; lfo.frequency.value = 13; ld.gain.value = 0.45;
      lfo.connect(ld); ld.connect(am.gain); lfo.start(t); lfo.stop(end);
      e.connect(am); am.connect(strBus);
    } else e.connect(strBus);
    const vib = c.createOscillator(), vd = c.createGain(); vib.frequency.value = 5.5; vd.gain.value = 6;
    vib.connect(vd); vib.start(t); vib.stop(end);
    notes.forEach(function (nt) {
      [-11, -4, 4, 11].forEach(function (d, k) {
        const s = c.createOscillator(), p = c.createStereoPanner();
        s.type = 'sawtooth'; s.frequency.value = hz(nt); s.detune.value = d + (rnd() - 0.5) * 5;
        p.pan.value = (k / 3 - 0.5) * 1.2;
        vd.connect(s.detune); s.connect(p); p.connect(f); s.start(t + rnd() * 0.012); s.stop(end);
      });
    });
  }
  /** strings, spiccato: one short stroke of the bow */
  function spic(t: number, note: string, g: number, cut = 2400) {
    const f = filt('lowpass', cut, 0.9), e = c.createGain();
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + 0.006); e.gain.setTargetAtTime(0.0001, t + 0.04, 0.035);
    f.connect(e); e.connect(strBus);
    [-7, 6].forEach(function (d) {
      const s = c.createOscillator(); s.type = 'sawtooth'; s.frequency.value = hz(note); s.detune.value = d + (rnd() - 0.5) * 4;
      s.connect(f); s.start(t); s.stop(t + 0.3);
    });
  }
  /** brass: three detuned saws a note, scooping up to the pitch, through a filter that opens with the breath */
  function brass(t: number, dur: number, notes: string[], g: number, o: { open?: number; a?: number; rel?: number; vib?: number } = {}) {
    const open = o.open || 2400, a = o.a || 0.04, rel = o.rel || 0.2, end = t + dur + rel * 2 + 0.15;
    const f = filt('lowpass', 300, 1.3), e = c.createGain();
    f.frequency.setValueAtTime(300, t); f.frequency.linearRampToValueAtTime(open, t + a + 0.05);
    f.frequency.setTargetAtTime(open * 0.6, t + a + 0.06, 0.3); f.frequency.setTargetAtTime(300, t + dur, rel / 2);
    env(e, t, g, a, dur, rel);
    f.connect(e); e.connect(brassBus);
    const lfo = c.createOscillator(), depth = c.createGain(), vs = t + Math.min(0.3, dur * 0.5);
    lfo.frequency.value = 5.3;
    depth.gain.setValueAtTime(0, t); depth.gain.setValueAtTime(0, vs); depth.gain.linearRampToValueAtTime(o.vib == null ? 10 : o.vib, vs + 0.4);
    lfo.connect(depth); lfo.start(t); lfo.stop(end);
    notes.forEach(function (nt) {
      [-9, 0, 8].forEach(function (d) {
        const s = c.createOscillator(); s.type = 'sawtooth';
        s.frequency.setValueAtTime(hz(nt) * 0.985, t); s.frequency.exponentialRampToValueAtTime(hz(nt), t + 0.05);
        s.detune.value = d + (rnd() - 0.5) * 4;
        depth.connect(s.detune); s.connect(f); s.start(t); s.stop(end);
      });
    });
  }
  /** a choir: three singers a note (detuned saws, vibrato) through the formants of a vowel, slow to swell */
  function choir(t: number, dur: number, notes: string[], g: number, o: { v?: string; a?: number; rel?: number } = {}) {
    const a = o.a == null ? 0.6 : o.a, rel = o.rel == null ? 1 : o.rel, end = t + dur + rel * 2 + 0.2;
    const sum = c.createGain(), e = c.createGain();
    sum.gain.value = 1 / Math.sqrt(notes.length * 3);
    VOWEL[o.v || 'a'].forEach(function (fm) {
      const bp = filt('bandpass', fm[0], 3.5), fg = c.createGain(); fg.gain.value = fm[1] * 3;
      sum.connect(bp); bp.connect(fg); fg.connect(e);
    });
    env(e, t, g, a, dur, rel);
    e.connect(choirBus);
    const lfo = c.createOscillator(), depth = c.createGain();
    lfo.frequency.value = 4.6 + rnd() * 0.8; depth.gain.value = 10;
    lfo.connect(depth); lfo.start(t); lfo.stop(end);
    notes.forEach(function (nt) {
      [-12, 0, 11].forEach(function (d) {
        const s = c.createOscillator(); s.type = 'sawtooth';
        s.frequency.value = hz(nt); s.detune.value = d + (rnd() - 0.5) * 6;
        depth.connect(s.detune); s.connect(sum); s.start(t); s.stop(end);
      });
    });
  }
  /** a harp: a plucked triangle with its octave */
  function harp(t: number, note: string, g = 0.05) {
    const e = c.createGain(), fq = hz(note);
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + 0.003); e.gain.setTargetAtTime(0.0001, t + 0.01, 0.3);
    e.connect(lead); send(e, hallIn, 0.3);
    ([['triangle', 1, 1], ['sine', 2, 0.35]] as [OscillatorType, number, number][]).forEach(function (v) {
      const s = c.createOscillator(), vg = c.createGain(); s.type = v[0]; s.frequency.value = fq * v[1]; vg.gain.value = v[2];
      s.connect(vg); vg.connect(e); s.start(t); s.stop(t + 1.6);
    });
  }
  /** the chiptune lead: a 25% pulse with an octave above, vibrato, and a saw underneath for weight */
  function chip(t: number, dur: number, note: string, g = 0.09, o: { cut?: number; cutTo?: number; saw?: number; vib?: number; oct?: boolean } = {}) {
    const f = filt('lowpass', o.cut || 4200, 1.2), e = c.createGain(), fq = hz(note);
    if (o.cutTo) f.frequency.exponentialRampToValueAtTime(o.cutTo, t + dur);
    env(e, t, g, 0.004, Math.max(0.03, dur * 0.92), 0.07);
    f.connect(e); e.connect(lead);
    const lfo = c.createOscillator(), depth = c.createGain(); lfo.frequency.value = 5.6;
    depth.gain.setValueAtTime(0, t); depth.gain.linearRampToValueAtTime(o.vib == null ? 14 : o.vib, t + Math.min(0.3, dur));
    lfo.connect(depth); lfo.start(t); lfo.stop(t + dur + 0.3);
    const voices: [PeriodicWave | OscillatorType, number, number][] = [[pulse25, 1, 1]];
    if (o.oct !== false) voices.push([pulse125, 2, 0.3]);
    if (o.saw) voices.push(['sawtooth', 0.5, o.saw]);
    voices.forEach(function (v) {
      const s = c.createOscillator(), vg = c.createGain();
      const wave = v[0];
      /* PeriodicWave is an empty interface, so typeof alone does not narrow it away */
      if (typeof wave === 'string') s.type = wave as OscillatorType; else s.setPeriodicWave(wave);
      s.frequency.value = fq * v[1]; vg.gain.value = v[2];
      depth.connect(s.detune); s.connect(vg); vg.connect(f); s.start(t); s.stop(t + dur + 0.25);
    });
  }
  function pluck(t: number, note: string, g = 0.05, cut = 3600) {
    const s = c.createOscillator(), f = filt('lowpass', cut, 5), e = c.createGain();
    s.setPeriodicWave(pulse125); s.frequency.value = hz(note);
    f.frequency.setValueAtTime(cut, t); f.frequency.exponentialRampToValueAtTime(Math.max(300, cut * 0.15), t + 0.14);
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + 0.003); e.gain.setTargetAtTime(0.0001, t + 0.01, 0.06);
    s.connect(f); f.connect(e); e.connect(lead); send(e, dIn, 0.35);
    s.start(t); s.stop(t + 0.5);
  }
  function bell(t: number, dur: number, note: string, g = 0.12) {
    const fq = hz(note);
    [[1, 1, 1.4], [2.76, 0.32, 0.5], [5.4, 0.12, 0.25], [2, 0.2, 0.9]].forEach(function (p) {
      const s = c.createOscillator(), e = c.createGain(); s.type = 'sine'; s.frequency.value = fq * p[0];
      e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g * p[1], t + 0.004); e.gain.setTargetAtTime(0.0001, t + 0.01, Math.max(0.15, dur) * p[2] * 0.45);
      s.connect(e); e.connect(lead); s.start(t); s.stop(t + dur * 3 + 1);
    });
  }
  /** the night wind: two noises through slow, wandering bandpasses, one each side */
  function wind(t: number, dur: number, g = 0.05) {
    [[1, -0.5, 0.13, 480], [0.83, 0.5, 0.09, 700]].forEach(function (v) {
      const n = noiseSrc(t, dur), bp = filt('bandpass', v[3], 2.4), e = c.createGain(), p = c.createStereoPanner();
      const lfo = c.createOscillator(), ld = c.createGain(), fade = Math.min(2, dur / 3);
      n.playbackRate.value = v[0]; p.pan.value = v[1];
      lfo.frequency.value = v[2]; ld.gain.value = v[3] * 0.6; lfo.connect(ld); ld.connect(bp.frequency); lfo.start(t); lfo.stop(t + dur + 0.1);
      e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + fade);
      e.gain.setValueAtTime(g, t + dur - fade); e.gain.linearRampToValueAtTime(0.0001, t + dur);
      n.connect(bp); bp.connect(e); e.connect(p); p.connect(fx);
    });
  }
  function riser(t: number, dur: number, g = 0.16, pitch = true) {
    const n = noiseSrc(t, dur), bp = filt('bandpass', 300, 1.6), e = c.createGain();
    bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + dur);
    e.gain.setValueAtTime(0.0001, t); e.gain.exponentialRampToValueAtTime(g, t + dur);
    n.connect(bp); bp.connect(e); e.connect(fx);
    if (!pitch) return;
    [0, 9].forEach(function (d) {
      const s = c.createOscillator(), lp = filt('lowpass', 5000), se = c.createGain();
      s.type = 'sawtooth'; s.detune.value = d;
      s.frequency.setValueAtTime(110, t); s.frequency.exponentialRampToValueAtTime(1320, t + dur);
      se.gain.setValueAtTime(0.0001, t); se.gain.exponentialRampToValueAtTime(g * 0.22, t + dur);
      s.connect(lp); lp.connect(se); se.connect(fx); s.start(t); s.stop(t + dur + 0.02);
    });
  }
  function reverseCrash(end: number, dur: number, g = 0.2) {
    const t = end - dur, n = noiseSrc(t, dur), hp = filt('highpass', 3500), e = c.createGain();
    e.gain.setValueAtTime(0.0005, t); e.gain.exponentialRampToValueAtTime(g, end - 0.01); e.gain.linearRampToValueAtTime(0.0001, end);
    n.connect(hp); hp.connect(e); e.connect(fx);
  }
  function impact(t: number, g = 0.75) {
    const o = c.createOscillator(), e = c.createGain();
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(28, t + 1.4);
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g * 0.6, t + 0.004); e.gain.setTargetAtTime(0.0001, t + 0.05, 0.5);
    o.connect(e); e.connect(fx); o.start(t); o.stop(t + 3);
    const n = noiseSrc(t, 1.5), lp = filt('lowpass', 1600), ne = c.createGain();
    ne.gain.setValueAtTime(0.0001, t); ne.gain.linearRampToValueAtTime(g * 0.5, t + 0.003); ne.gain.setTargetAtTime(0.0001, t + 0.02, 0.25);
    n.connect(lp); lp.connect(ne); ne.connect(fx);
    crash(t, 0.26);
    ducks.push({ t, depth: 0.15, rel: 0.6 });
  }
  function downer(t: number, dur: number, g = 0.12) {
    const n = noiseSrc(t, dur), bp = filt('bandpass', 6000, 1.4), e = c.createGain();
    bp.frequency.setValueAtTime(6000, t); bp.frequency.exponentialRampToValueAtTime(200, t + dur);
    e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp); bp.connect(e); e.connect(fx);
  }
  function whoosh(t: number, g = 0.14) {
    const n = noiseSrc(t, 0.6), bp = filt('bandpass', 400, 1.2), e = c.createGain();
    bp.frequency.setValueAtTime(400, t); bp.frequency.exponentialRampToValueAtTime(3600, t + 0.3); bp.frequency.exponentialRampToValueAtTime(700, t + 0.55);
    e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + 0.25); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.58);
    n.connect(bp); bp.connect(e); e.connect(fx);
  }
  /** play tracker bars (16 steps each) from bar b with one of the voices */
  function melody(b: number, bars: string[], play: (t: number, dur: number, note: string) => void) {
    parse(bars).forEach(function (n) { play(at(b) + n.step * S16, n.len * S16, n.note); });
  }
  const step = function (b: number, s: number) { return at(b) + s * S16; };

  /* the drums of each part */
  /** heroic: taiko on one and three, small drums between, the snare when it is full */
  function heroDrums(b: number, full: boolean) {
    taiko(at(b), 0.9); taiko(step(b, 8), 0.75); taiko(step(b, 10), 0.5);
    [3, 6, 11, 14].forEach(function (s) { taiko(step(b, s), 0.32, 1.9); });
    if (!full) return;
    snare(step(b, 4), 0.26, 190); snare(step(b, 12), 0.32, 190);
    for (let s = 0; s < 16; s += 2) hat(step(b, s), s % 4 === 0 ? 0.045 : 0.03);
  }
  /** epic: taiko with a kick inside, the big snare, sixteenths on the hats, a fill at the end of a phrase */
  function epicDrums(b: number, fill: boolean) {
    kick(at(b), 0.8, 0.5, 0.2); kick(step(b, 8), 0.7, 0.5, 0.2);
    [0, 3, 6, 8, 10].forEach(function (s) { taiko(step(b, s), s % 8 === 0 ? 0.95 : 0.6); });
    snare(step(b, 4), 0.38, 190); snare(step(b, 12), 0.44, 190);
    for (let s = 0; s < 16; s++) hat(step(b, s), s % 4 === 0 ? 0.055 : s % 2 ? 0.022 : 0.036);
    if (fill) [12, 13, 14, 15].forEach(function (s, i) { taiko(step(b, s), 0.42 + i * 0.12, 1.7 - i * 0.18); });
    else taiko(step(b, 14), 0.45, 1.8);
  }
  /** the finale: four on the floor under the taiko */
  function finaleDrums(b: number) {
    for (let k = 0; k < 4; k++) kick(at(b, k), 0.85, 0.45, 0.22);
    taiko(at(b), 0.95); taiko(step(b, 6), 0.5); taiko(step(b, 8), 0.8); taiko(step(b, 11), 0.45, 1.6); taiko(step(b, 14), 0.5, 1.4);
    snare(step(b, 4), 0.4, 195); clap(step(b, 4), 0.28); snare(step(b, 12), 0.44, 195); clap(step(b, 12), 0.3);
    for (let s = 0; s < 16; s++) hat(step(b, s), s % 4 === 2 ? 0.07 : 0.028, s % 4 === 2);
  }

  /* ---------- the arrangement ---------- */
  const up = function (n: string, k: number) { return n.replace(/\d/, function (o) { return String(+o + k); }); };
  const chordAt = function (b: number): string {
    if (b < 7) return ['Am', 'F', 'Dm', 'E', 'E', 'Am', 'E'][b];
    if (b < 21) return CYCLE[(b - 7) % 4];
    if (b < 24) return 'E';
    if (b < 34) return CYCLE[(b - 24) % 4];
    if (b < 38) return ['Am', 'F', 'Dm', 'E'][b - 34];
    if (b < 40) return b === 38 ? 'F' : 'G';
    if (b < 46) return ['Am', 'F', 'C', 'G', 'F', 'G'][b - 40];
    return 'A';
  };
  /** the chord an octave down, for the cellos and the low choir */
  const low = function (ch: string) { return CHORD[ch].map(function (n) { return up(n, -1); }); };
  /** the chord with its third an octave up, for the big choir */
  const wide = function (ch: string) { return CHORD[ch].concat([up(CHORD[ch][1], 1)]); };
  /** root, fifth and octave, for the low brass */
  const power = function (ch: string) { return [up(ROOT[ch], 1), up(CHORD[ch][2], -1), CHORD[ch][0]]; };
  const stab = function (t: number, ch: string, g: number, open = 1600) { brass(t, BEAT * 1.5, power(ch), g, { open: open, a: 0.03, rel: 0.25 }); };
  const ostinato = function (b: number, g: number, cut: number) {
    const n = low(chordAt(b));
    for (let s = 0; s < 16; s++) spic(step(b, s), n[OST[s]], s % 4 === 0 ? g : g * 0.72, cut);
  };

  /* intro: the night wind, a music box, a distant choir, a heartbeat */
  wind(0, at(5) + 1.5, 0.07);
  for (let b = 0; b < 4; b++) {
    const ch = chordAt(b), beat = ch === 'E' ? 'E2' : 'A2';
    choir(at(b), BAR, CHORD[ch].slice(0, 3), 0.045 + b * 0.012, { v: 'u', a: b ? 0.7 : 2.4, rel: 1.4 });
    strings(at(b), BAR, [up(ROOT[ch], 1), up(ROOT[ch], 2)], 0.012 + b * 0.004, { a: b ? 0.5 : 2.4, cut: 900, rel: 0.9 });
    if (!b) continue;
    sub(at(b), BAR - 0.05, ROOT[ch], 0.1 + b * 0.03);
    timp(at(b), beat, 0.14 + b * 0.05); timp(at(b, 0.4), beat, 0.09 + b * 0.03);
    if (b >= 2) { timp(at(b, 2), beat, 0.12 + b * 0.04); timp(at(b, 2.4), beat, 0.08 + b * 0.03); }
  }
  melody(0, BELL, function (t, d, n) { bell(t, d, n, 0.13); bell(t, d, up(n, -1), 0.04); });

  /* «Formia»: the dominant swells and the drums gather */
  timp(at(4), 'E2', 0.5); sub(at(4), BAR, 'E1', 0.3); crash(at(4), 0.12);
  choir(at(4), BAR - 0.05, ['E3', 'G#3', 'B3', 'E4'], 0.12, { a: BAR - 0.1, rel: 0.12 });
  strings(at(4), BAR - 0.05, ['E2', 'E3', 'B3', 'E4', 'G#4'], 0.032, { a: BAR - 0.1, rel: 0.12, trem: true, cut: 2600 });
  brass(at(4), BAR - 0.05, ['E2', 'B2', 'E3'], 0.04, { a: BAR - 0.2, open: 1200, rel: 0.12 });
  [0, 1, 2, 2.5, 3, 3.25, 3.5, 3.75].forEach(function (k, i) { taiko(at(4, k), 0.3 + i * 0.08, i > 4 ? 1.3 : 1); });
  roll(at(4, 2), BEAT * 2, 'E2', 0.06, 0.34);
  riser(at(3), BAR * 2, 0.12);
  reverseCrash(at(5), BEAT * 2, 0.2);

  /* the logo: the hit, and the fanfare */
  impact(at(5), 0.85); taiko(at(5), 1); timp(at(5), 'A2', 0.6);
  for (let b = 5; b < 7; b++) {
    const ch = chordAt(b);
    brass(at(b), BAR - 0.1, power(ch), 0.05, { open: 1700, rel: 0.35 });
    choir(at(b), BAR, wide(ch), 0.12, { a: 0.15 });
    strings(at(b), BAR, CHORD[ch].map(function (n) { return up(n, 1); }), 0.026, { a: 0.1, cut: 4200 });
    sub(at(b), BAR - 0.05, ROOT[ch], 0.34);
  }
  melody(5, FANFARE, function (t, d, n) { brass(t, d, [n], 0.065, { open: 3400 }); brass(t, d, [up(n, -1)], 0.045, { open: 2200 }); });
  taiko(at(6), 0.8); taiko(at(6, 2), 0.6);
  [3, 3.25, 3.5, 3.75].forEach(function (k, i) { taiko(at(6, k), 0.4 + i * 0.12, 1.5 - i * 0.1); });
  roll(at(6, 2), BEAT * 2, 'E2', 0.08, 0.36);
  reverseCrash(at(7), BEAT, 0.16);

  /* the friends, then the first flight over Formia: the hero's theme on the horns */
  for (let b = 7; b < 15; b++) {
    const ch = chordAt(b), p = (b - 7) / 7;
    ostinato(b, 0.045 + p * 0.015, 1800 + p * 1000);
    choir(at(b), BAR, CHORD[ch], 0.075 + p * 0.035, { a: 0.3 });
    strings(at(b), BAR, [up(ROOT[ch], 1), up(ROOT[ch], 2)], 0.024, { a: 0.1, cut: 1400 });
    sub(at(b), BAR - 0.05, ROOT[ch], 0.3);
    timp(at(b), up(ROOT[ch], 1), 0.3);
    stab(at(b), ch, 0.035 + p * 0.015);
    heroDrums(b, b >= 9);
  }
  melody(7, HERO, function (t, d, n) { brass(t, d, [up(n, -1)], 0.07, { open: 2300 }); strings(t, d, [n], 0.02, { a: 0.05, rel: 0.25, cut: 4500 }); });
  /* the Exam */
  stab(at(12), 'F', 0.07, 1300); taiko(at(12), 1); crash(at(12), 0.14);
  [12, 13, 14, 15].forEach(function (s, i) { taiko(step(12, s), 0.4 + i * 0.12, 1.7 - i * 0.15); });
  reverseCrash(at(13), BEAT * 1.5, 0.16);
  /* Formia from above */
  impact(at(13), 0.4);
  for (let b = 13; b < 15; b++) strings(at(b), BAR, CHORD[chordAt(b)].map(function (n) { return up(n, 1); }), 0.02, { a: 0.2, cut: 5000 });
  whoosh(at(14, 3), 0.12);

  /* Formia by day: lighter, the theme on the strings, a harp and a celesta */
  for (let b = 15; b < 19; b++) {
    const ch = chordAt(b);
    for (let s = 0; s < 16; s++) harp(step(b, s), ARP[ch][ARP_STEPS[s]], s % 4 === 0 ? 0.068 : 0.046);
    for (let s = 2; s < 16; s += 4) bell(step(b, s), BEAT, ARP[ch][3 + (s >> 2) % 3], 0.04);
    choir(at(b), BAR, CHORD[ch].slice(0, 3), 0.05, { v: 'o', a: 0.5 });
    strings(at(b), BAR, [up(ROOT[ch], 1), CHORD[ch][0]], 0.024, { a: 0.25, cut: 1300 });
    sub(at(b), BAR - 0.05, ROOT[ch], 0.26);
    taiko(at(b), 0.6); taiko(step(b, 8), 0.35, 1.2); taiko(step(b, 10), 0.36, 1.4);
    for (let s = 0; s < 16; s++) hat(step(b, s), s % 2 ? 0.018 : 0.03);
  }
  melody(15, HERO.slice(0, 4), function (t, d, n) { strings(t, d, [n, up(n, -1)], 0.034, { a: 0.08, rel: 0.35, cut: 4400 }); });

  /* evening: the port, the square at night; the music box remembers */
  for (let b = 19; b < 21; b++) {
    const ch = chordAt(b);
    choir(at(b), BAR, CHORD[ch].slice(0, 3), 0.065, { v: 'o', a: 0.6 });
    strings(at(b), BAR, [up(ROOT[ch], 1), CHORD[ch][0], CHORD[ch][2]], 0.022, { a: 0.4, cut: 1200 });
    sub(at(b), BAR - 0.05, ROOT[ch], 0.2);
    timp(at(b), 'A2', 0.16); timp(at(b, 0.4), 'A2', 0.1);
    for (let s = 0; s < 16; s += 2) tick(step(b, s), s % 4 === 0 ? 0.03 : 0.018, s % 4 === 0);
  }
  melody(19, BELL.slice(0, 2), function (t, d, n) { bell(t, d, n, 0.11); });
  whoosh(at(20, 3), 0.12);

  /* the tall grass: tremolo, the timpani, the choir rising… and then nothing */
  const cut = at(23, 2), long = cut - at(21);
  strings(at(21), long, ['E2', 'E3', 'B3', 'E4', 'G#4'], 0.05, { a: long, rel: 0.06, trem: true, cut: 3200 });
  choir(at(21), long, ['E3', 'B3', 'E4', 'G#4'], 0.15, { a: long, rel: 0.08 });
  sub(at(21), long, 'E1', 0.3);
  roll(at(22), cut - at(22), 'E2', 0.05, 0.42);
  [['E3', 'E4'], ['F3', 'F4'], ['G#3', 'G#4']].forEach(function (nn, i) {
    brass(at(21 + i), i < 2 ? BAR : BEAT * 2, nn, 0.03 + i * 0.02, { a: i < 2 ? BAR * 0.7 : BEAT, open: 1500 + i * 600, rel: 0.08 });
  });
  for (let k = 0; k < 8; k++) taiko(at(21, k), 0.3 + k * 0.03, 1.2);
  for (let k = 0; k < 4; k++) taiko(at(23, k * 0.5), 0.55 + k * 0.08);
  riser(at(21), long, 0.15);
  reverseCrash(at(24), BEAT * 2, 0.24);

  /* the creatures: everything, the theme in full */
  impact(at(24), 0.9);
  for (let b = 24; b < 32; b++) {
    const ch = chordAt(b);
    ostinato(b, 0.06, 2600);
    choir(at(b), BAR, b >= 28 ? wide(ch) : CHORD[ch], 0.12, { a: 0.12 });
    strings(at(b), BAR, [up(ROOT[ch], 1), up(ROOT[ch], 2)], 0.03, { a: 0.05, cut: 1600 });
    stab(at(b), ch, 0.045, 1800); stab(at(b, 2), ch, 0.035, 1600);
    sub(at(b), BAR - 0.05, ROOT[ch], 0.34);
    timp(at(b), up(ROOT[ch], 1), 0.42); timp(at(b, 2), up(ROOT[ch], 1), 0.26);
    epicDrums(b, b === 27 || b === 31);
  }
  melody(24, HERO, function (t, d, n) {
    brass(t, d, [n], 0.07, { open: 3400 }); brass(t, d, [up(n, -1)], 0.05, { open: 2000 });
    strings(t, d, [n], 0.024, { a: 0.04, rel: 0.3, cut: 5000 });
  });
  melody(28, HERO.slice(4), function (t, d, n) { strings(t, d, [up(n, 1)], 0.014, { a: 0.04, rel: 0.3, cut: 6000 }); });
  /* the spells seen from the creature: the critical hit lands on the and of three */
  crash(at(26, 2.5), 0.2); taiko(at(26, 2.5), 1);

  /* a flight over Formia… and the shadow of something big */
  ostinato(32, 0.05, 2400);
  choir(at(32), BAR, wide('Am'), 0.12, { a: 0.3 });
  strings(at(32), BAR, ['A4', 'C5', 'E5', 'A5'], 0.026, { a: 0.3, trem: true, cut: 5200 });
  melody(32, [FANFARE[0]], function (t, d, n) { brass(t, d, [n], 0.065, { open: 3200 }); brass(t, d, [up(n, -1)], 0.045); });
  sub(at(32), BAR - 0.05, 'A1', 0.3); timp(at(32), 'A2', 0.4); taiko(at(32), 0.85); taiko(step(32, 8), 0.6);
  for (let s = 0; s < 16; s += 2) hat(step(32, s), 0.03);
  impact(at(33), 0.8); taiko(at(33), 1); timp(at(33), 'F2', 0.55);
  brass(at(33), BAR * 0.85, ['F1', 'C2', 'F2', 'C3'], 0.085, { open: 950, a: 0.02, rel: 0.9, vib: 0 });
  choir(at(33), BAR, ['F2', 'C3', 'F3'], 0.1, { v: 'o', a: 0.1, rel: 1.2 });
  strings(at(33), BAR, ['F2', 'C3', 'F3'], 0.03, { a: 0.05, rel: 1, cut: 1200, trem: true });
  sub(at(33), BAR, 'F1', 0.4);
  downer(at(33, 2), BEAT * 2, 0.12);

  /* the mystery: the music box again, a low choir, the heartbeat */
  wind(at(34) - 0.5, BAR * 4 + 0.5, 0.045);
  for (let b = 34; b < 38; b++) {
    const ch = chordAt(b), beat = ch === 'E' ? 'E2' : 'A2';
    choir(at(b), BAR, low(ch).slice(0, 3), 0.055, { v: 'u', a: 0.6, rel: 1.1 });
    strings(at(b), BAR, [up(ROOT[ch], 1)], 0.018, { a: 0.5, cut: 700 });
    sub(at(b), BAR - 0.05, ROOT[ch], 0.15);
    timp(at(b), beat, 0.22); timp(at(b, 0.4), beat, 0.14);
    if (b < 36) continue;
    timp(at(b, 2), beat, 0.2); timp(at(b, 2.4), beat, 0.13);
    for (let s = 0; s < 16; s += 2) tick(step(b, s), s % 4 === 0 ? 0.03 : 0.02, s % 4 === 0);
  }
  melody(34, BELL, function (t, d, n) { bell(t, d, n, 0.13); bell(t, d, up(n, -1), 0.04); });
  riser(at(37), BAR, 0.1, false);

  /* created by imagination: wonder, and up */
  for (let b = 38; b < 40; b++) {
    const ch = chordAt(b), p = b - 38;
    for (let s = 0; s < 16; s++) harp(step(b, s), ARP[ch][s % 6], 0.036 + s * 0.0015 + p * 0.01);
    choir(at(b), BAR, CHORD[ch], 0.07 + p * 0.04, { a: BAR * 0.8 });
    strings(at(b), BAR, [up(ROOT[ch], 1), CHORD[ch][0], CHORD[ch][2]], 0.022 + p * 0.01, { a: 0.5 });
    sub(at(b), BAR - 0.05, ROOT[ch], 0.24);
  }
  melody(38, CLIMB, function (t, d, n) { bell(t, d, n, 0.1); strings(t, d, [n], 0.018, { a: 0.1, cut: 5000 }); });
  roll(at(39), BAR, 'G2', 0.06, 0.42);
  for (let k = 0; k < 4; k++) taiko(at(39, k), 0.35 + k * 0.1);
  [3.25, 3.5, 3.75].forEach(function (k, i) { taiko(at(39, k), 0.6 + i * 0.12, 1.4 - i * 0.1); });
  riser(at(38), BAR * 2, 0.14);
  reverseCrash(at(40), BEAT * 2, 0.22);

  /* the finale: the theme an octave up, and the game's chiptune inside it */
  impact(at(40), 0.85);
  for (let b = 40; b < 46; b++) {
    const ch = chordAt(b);
    ostinato(b, 0.062, 2800);
    for (let s = 0; s < 16; s++) pluck(step(b, s), ARP[ch][ARP_STEPS[s]], 0.02, 4200);
    choir(at(b), BAR, wide(ch), b >= 44 ? 0.14 : 0.12, { a: 0.12 });
    strings(at(b), BAR, [up(ROOT[ch], 1), up(ROOT[ch], 2)], 0.032, { a: 0.05, cut: 1700 });
    stab(at(b), ch, 0.045, 1900); stab(at(b, 2), ch, 0.036, 1700);
    sub(at(b), BAR - 0.05, ROOT[ch], 0.36);
    timp(at(b), up(ROOT[ch], 1), 0.45);
    if (b < 45) finaleDrums(b);
  }
  melody(40, HERO.slice(0, 4), function (t, d, n) {
    brass(t, d, [n], 0.07, { open: 3600 }); brass(t, d, [up(n, -1)], 0.05, { open: 2100 });
    strings(t, d, [up(n, 1)], 0.016, { a: 0.04, rel: 0.3, cut: 6500 });
    chip(t, d, n, 0.034, { saw: 0.2 });
  });
  melody(44, CLIMB, function (t, d, n) {
    brass(t, d, [n], 0.075, { open: 3800 }); brass(t, d, [up(n, -1)], 0.05, { open: 2200 });
    strings(t, d, [n], 0.02, { a: 0.04, cut: 6000 }); chip(t, d, n, 0.034, { saw: 0.2 });
  });
  /* the last bar climbs: the snare doubles, the timpani roll */
  for (let k = 0; k < 4; k++) kick(at(45, k), 0.85, 0.45, 0.22);
  taiko(at(45), 0.95); taiko(at(45, 2), 0.8);
  for (let s = 0; s < 16; s++) snare(step(45, s), 0.1 + s * 0.022, 190 + s * 9);
  for (let s = 12; s < 16; s += 0.5) taiko(step(45, s), 0.5 + (s - 12) * 0.08, 1.6);
  roll(at(45), BAR, 'G2', 0.1, 0.45);
  riser(at(44), BAR * 2, 0.15);
  reverseCrash(at(46), BEAT * 2, 0.24);

  /* the outro: a glorious A major, the theme's first notes echoing away */
  impact(at(46), 0.95); taiko(at(46), 1); timp(at(46), 'A2', 0.7); crash(at(46), 0.25);
  brass(at(46), BAR * 2, ['A2', 'E3', 'A3', 'C#4', 'E4'], 0.055, { open: 2400, a: 0.03, rel: 2.2 });
  brass(at(46), BAR, ['A4', 'C#5', 'E5'], 0.045, { open: 3600, a: 0.03, rel: 1.6 });
  choir(at(46), BAR * 3, ['A3', 'C#4', 'E4', 'A4', 'C#5'], 0.13, { a: 0.12, rel: 2.6 });
  strings(at(46), BAR * 3.5, ['A2', 'E3', 'A3', 'C#4', 'E4', 'A4', 'C#5'], 0.022, { a: 0.1, rel: 2.6, cut: 4500 });
  sub(at(46), BAR * 2, 'A1', 0.36);
  bell(at(46), BAR, 'A5', 0.1); bell(at(46), BAR, 'E6', 0.05);
  melody(47, FAR, function (t, d, n) { brass(t, d, [n], 0.035, { open: 1800, rel: 0.9 }); bell(t, d, n, 0.06); });
  timp(at(48), 'A2', 0.2);

  /* the game's own sounds */
  CUES.forEach(function (q) {
    const g = c.createGain(); g.gain.value = q[3]; g.connect(sfxBus);
    renderSfx(c, g, q[2], at(q[0], q[1]));
  });

  /* the sidechain: the orchestra dips a little under each kick and impact, the sub more */
  ducks.sort(function (a, b) { return a.t - b.t; });
  [orchDuck, lowsDuck].forEach(function (g, gi) {
    g.gain.setValueAtTime(1, 0);
    ducks.forEach(function (d, i) {
      const next = i + 1 < ducks.length ? ducks[i + 1].t : Infinity;
      if (next - d.t < 0.02) return;
      const depth = gi === 1 ? d.depth : Math.max(0.8, d.depth);
      g.gain.setTargetAtTime(depth, d.t, 0.003);
      g.gain.setTargetAtTime(1, d.t + 0.02, Math.min(d.rel, next - d.t) / 3);
    });
  });

  const buf = await c.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  /* loudness: the epic parts at about −11 dBFS rms, then a look-ahead limiter at −0.6 dBFS; the quiet parts stay quiet */
  let sum = 0, cnt = 0;
  [[24, 32], [40, 46]].forEach(function (p) {
    for (let i = Math.floor(at(p[0]) * rate); i < Math.floor(at(p[1]) * rate); i++) { sum += L[i] * L[i] + R[i] * R[i]; cnt += 2; }
  });
  const pre = Math.pow(10, -11 / 20) / Math.sqrt(sum / cnt);
  for (let i = 0; i < L.length; i++) { L[i] *= pre; R[i] *= pre; }
  const least = limit(L, R, rate, 0.93);
  let pk = 0; const rms: number[] = [];
  for (let b = 0; b < BARS + 1; b++) {
    let s = 0, n = 0;
    for (let i = Math.floor(at(b) * rate); i < Math.min(L.length, Math.floor(at(b + 1) * rate)); i++) { s += L[i] * L[i] + R[i] * R[i]; n += 2; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
    rms.push(n ? +(20 * Math.log10(Math.sqrt(s / n) + 1e-9)).toFixed(1) : -99);
  }
  return { wav: wavBase64(L, R, rate), peak: pk, reduction: +(20 * Math.log10(least)).toFixed(1), rms };

  /* ---------- helpers ---------- */
  function curve(drive: number): Float32Array<ArrayBuffer> {
    const n = 2048, out = new Float32Array(n), k = Math.tanh(drive);
    for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; out[i] = Math.tanh(x * drive) / k; }
    return out;
  }
  function impulse(sec: number, decay: number): AudioBuffer {
    const len = Math.floor(rate * sec), b = c.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let s = 4242 + ch * 977 + Math.round(sec * 100), lp = 0;
      for (let i = 0; i < len; i++) {
        s = (s * 1103515245 + 12345) >>> 0;
        const x = (s / 4294967296) * 2 - 1, k = i / len;
        lp += (x - lp) * (0.9 - k * 0.75);
        d[i] = (i < rate * 0.018 ? 0 : 1) * lp * Math.pow(1 - k, decay);
      }
    }
    return b;
  }
  function noise(sec: number): AudioBuffer {
    const len = Math.floor(rate * sec), b = c.createBuffer(1, len, rate), d = b.getChannelData(0);
    let s = 777;
    for (let i = 0; i < len; i++) { s = (s * 1103515245 + 12345) >>> 0; d[i] = (s / 4294967296) * 2 - 1; }
    return b;
  }
  function pulseWave(duty: number): PeriodicWave {
    const n = 64, re = new Float32Array(n), im = new Float32Array(n);
    for (let k = 1; k < n; k++) { re[k] = Math.sin(2 * Math.PI * k * duty) / (k * Math.PI); im[k] = (1 - Math.cos(2 * Math.PI * k * duty)) / (k * Math.PI); }
    return c.createPeriodicWave(re, im);
  }
}

/** a look-ahead peak limiter: the gain falls before a peak arrives and comes back slowly; returns the lowest gain used */
function limit(L: Float32Array, R: Float32Array, rate: number, ceiling: number): number {
  const n = L.length, look = Math.round(rate * 0.004), relK = 1 - Math.exp(-1 / (rate * 0.09));
  const want = new Float32Array(n);
  for (let i = 0; i < n; i++) { const p = Math.max(Math.abs(L[i]), Math.abs(R[i])); want[i] = p > ceiling ? ceiling / p : 1; }
  /* the smallest gain needed in the next `look` samples (a sliding minimum) */
  const minA = new Float32Array(n), dq = new Int32Array(n); let h = 0, t = 0;
  for (let i = n - 1; i >= 0; i--) {
    while (t > h && want[dq[t - 1]] >= want[i]) t--;
    dq[t++] = i;
    while (dq[h] > i + look) h++;
    minA[i] = want[dq[h]];
  }
  /* the gain follows at once (it is already early) and is averaged over the look-ahead, so it never clicks */
  let g = 1, acc = look, least = 1;
  const ring = new Float32Array(look).fill(1);
  for (let i = 0; i < n; i++) {
    const m = minA[i];
    g = m < g ? m : g + (m - g) * relK;
    acc += g - ring[i % look]; ring[i % look] = g;
    const sm = acc / look;
    least = Math.min(least, sm);
    L[i] *= sm; R[i] *= sm;
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    if (p > ceiling) { const k = ceiling / p; L[i] *= k; R[i] *= k; }
  }
  return least;
}
function wavBase64(L: Float32Array, R: Float32Array, rate: number): string {
  const n = L.length, bytes = new Uint8Array(44 + n * 4), v = new DataView(bytes.buffer);
  const w = function (o: number, s: string) { for (let i = 0; i < s.length; i++) bytes[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 4, Math.max(-32767, Math.min(32767, Math.round(L[i] * 32767))), true);
    v.setInt16(46 + i * 4, Math.max(-32767, Math.min(32767, Math.round(R[i] * 32767))), true);
  }
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  return btoa(s);
}
