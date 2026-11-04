import { renderSfx } from '../../src/audio/sfx';
import { hz } from '../../src/audio/synth';
import { BEAT, at, LENGTH, CUES } from './timeline';

/* The trailer's music, rendered offline in the browser (Web Audio, like the game's own): an original track at
   150 bpm in A minor, on the game's battle theme. It follows the parts of timeline.ts:
     intro   bars 0–3   a ticking clock, a heartbeat, the theme behind a closed filter, a riser
     logo    4–5        the hit: a big chord, a sub drop, then a drum fill
     groove  6–13       half-time beat, 808, chiptune arpeggios; the theme comes in at bar 10
     build   14–17      snare roll, riser, the filter opening; silence before the drop
     drop 1  18–25      trap: heavy 808, pumping supersaws, the battle theme on a pulse lead
     plot    26–29      a music box over pads, Am F Dm E
     code    30–31      typing clicks, a short build
     drop 2  32–37      four on the floor, offbeat bass, the theme an octave up, climbing to the last chord
     outro   38–40      the last hit, the theme's first notes echoing away
   Nothing is sampled: every sound is an oscillator or noise, and the game's own effects come from src/audio/sfx. */

const S16 = BEAT / 4;
const CHORD: Record<string, string[]> = {
  Am: ['A3', 'C4', 'E4', 'A4'], F: ['F3', 'A3', 'C4', 'F4'], G: ['G3', 'B3', 'D4', 'G4'], E: ['E3', 'G#3', 'B3', 'E4'],
  Dm: ['D3', 'F3', 'A3', 'D4'], C: ['C4', 'E4', 'G4', 'C5']
};
const ROOT: Record<string, string> = { Am: 'A1', F: 'F1', G: 'G1', E: 'E1', Dm: 'D2', C: 'C2' };
/** arpeggio tones, two octaves up */
const ARP: Record<string, string[]> = {
  Am: ['A4', 'C5', 'E5', 'A5', 'C6', 'E6'], F: ['F4', 'A4', 'C5', 'F5', 'A5', 'C6'], G: ['G4', 'B4', 'D5', 'G5', 'B5', 'D6'],
  E: ['E4', 'G#4', 'B4', 'E5', 'G#5', 'B5'], Dm: ['D4', 'F4', 'A4', 'D5', 'F5', 'A5'], C: ['C5', 'E5', 'G5', 'C6', 'E6', 'G6']
};
const ARP_STEPS = [0, 2, 1, 3, 2, 4, 3, 5, 0, 2, 1, 3, 2, 4, 3, 1];
/* the game's battle theme (src/audio/tracks.ts), Am F G E */
const THEME = [
  'A4 . C5 . E5 . A5 - G5 . E5 . C5 . E5 .',
  'F5 . E5 . C5 . A4 - C5 . F5 . A5 . G5 .',
  'G5 - D5 . G5 . B5 - A5 . G5 . D5 . B4 .',
  'G#4 . B4 . E5 . G#5 - B5 - - - E5 . G#5 .'
];
const CLIMB = [
  'F5 . A5 . C6 . A5 . F5 . A5 . C6 . F6 .',
  'G5 . B5 . D6 . G6 - D6 . B5 . D6 . G6 .'
];
const BELL = [
  'E5 - - - A5 - - - C6 - - - B5 - A5 -',
  'A5 - - - G5 - - - F5 - - - E5 - - -',
  'D5 - - - F5 - - - A5 - - - G5 - F5 -',
  'E5 - - - G#5 - - - B5 - - - . . . .'
];
const OUTRO = ['A4 . C5 . E5 . A5 - - - . . . . . .', 'E5 . A5 - - - . . . . . . . . . .'];

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

export async function renderMusic(rate = 48000): Promise<{ wav: string; peak: number; rms: number[] }> {
  const c = new OfflineAudioContext(2, Math.ceil(LENGTH * rate), rate);

  /* ---------- the mixer ---------- */
  const master = c.createGain(); master.gain.value = 0.8;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -10; comp.knee.value = 8; comp.ratio.value = 2.5; comp.attack.value = 0.006; comp.release.value = 0.2;
  const sat = c.createWaveShaper(); sat.curve = curve(1.25); sat.oversample = '4x';
  master.connect(comp); comp.connect(sat); sat.connect(c.destination);
  master.gain.setValueAtTime(0.8, LENGTH - 2.2); master.gain.linearRampToValueAtTime(0.0001, LENGTH - 0.05);

  const verb = c.createConvolver(); verb.buffer = impulse(3.2, 3.2);
  const verbIn = c.createGain(), verbOut = c.createGain(); verbOut.gain.value = 0.32;
  const verbLp = c.createBiquadFilter(); verbLp.type = 'lowpass'; verbLp.frequency.value = 5200;
  verbIn.connect(verb); verb.connect(verbLp); verbLp.connect(verbOut); verbOut.connect(master);
  /* a ping-pong delay, a dotted eighth */
  const dIn = c.createGain(), dl = c.createDelay(2), dr = c.createDelay(2), fb = c.createGain(), dOut = c.createGain(), mrg = c.createChannelMerger(2), dLp = c.createBiquadFilter();
  dl.delayTime.value = BEAT * 0.75; dr.delayTime.value = BEAT * 0.75; fb.gain.value = 0.4; dOut.gain.value = 0.32;
  dLp.type = 'lowpass'; dLp.frequency.value = 3800;
  dIn.connect(dl); dl.connect(mrg, 0, 0); dl.connect(dr); dr.connect(mrg, 0, 1); dr.connect(fb); fb.connect(dl);
  mrg.connect(dLp); dLp.connect(dOut); dOut.connect(master); dOut.connect(verbIn);

  const drums = c.createGain(); drums.gain.value = 0.7; drums.connect(master);
  const kickBus = c.createGain(); const kickSat = c.createWaveShaper(); kickSat.curve = curve(2.2);
  kickBus.connect(kickSat); kickSat.connect(drums);
  /* synths and bass duck under the kick */
  const synth = c.createGain(), synthDuck = c.createGain(); synth.gain.value = 2; synth.connect(synthDuck); synthDuck.connect(master);
  const bass = c.createGain(), bassDuck = c.createGain(); bass.gain.value = 0.12; bass.connect(bassDuck); bassDuck.connect(master);
  const lead = c.createGain(); lead.gain.value = 1.9; lead.connect(master);
  const fx = c.createGain(); fx.connect(master);
  const sfxBus = c.createGain(); sfxBus.gain.value = 0.55; sfxBus.connect(master);
  const send = function (from: AudioNode, to: AudioNode, g: number) { const s = c.createGain(); s.gain.value = g; from.connect(s); s.connect(to); };
  send(synth, verbIn, 0.25); send(lead, verbIn, 0.22); send(lead, dIn, 0.28); send(fx, verbIn, 0.45); send(sfxBus, verbIn, 0.2);
  const sub808 = c.createWaveShaper(); sub808.curve = curve(2.6);
  const subLp = c.createBiquadFilter(); subLp.type = 'lowpass'; subLp.frequency.value = 1100;
  sub808.connect(subLp); subLp.connect(bass);

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
  function snare(t: number, g = 0.45, pitch = 210) {
    const o = c.createOscillator(), e = c.createGain(); o.type = 'triangle';
    o.frequency.setValueAtTime(pitch, t); o.frequency.exponentialRampToValueAtTime(pitch * 0.72, t + 0.07);
    env(e, t, g * 0.7, 0.002, 0.01, 0.1); o.connect(e); e.connect(drums); o.start(t); o.stop(t + 0.3);
    const n = noiseSrc(t, 0.3), bp = filt('bandpass', 2400, 0.6), ne = c.createGain();
    env(ne, t, g, 0.002, 0.01, 0.17); n.connect(bp); bp.connect(ne); ne.connect(drums); send(ne, verbIn, 0.2);
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
  function typeClick(t: number, g = 0.08) {
    const n = noiseSrc(t, 0.02), bp = filt('bandpass', 2500 + rnd() * 3000, 2.5), e = c.createGain(), p = c.createStereoPanner();
    p.pan.value = rnd() * 0.8 - 0.4;
    e.gain.setValueAtTime(g, t); e.gain.exponentialRampToValueAtTime(0.0001, t + 0.018);
    n.connect(bp); bp.connect(e); e.connect(p); p.connect(fx);
  }
  /** an 808: a sine with a glide, driven into a shaper */
  function boom(t: number, dur: number, note: string, g = 0.5, from?: string) {
    const o = c.createOscillator(), e = c.createGain(), f = hz(note);
    if (from) { o.frequency.setValueAtTime(hz(from), t); o.frequency.exponentialRampToValueAtTime(f, t + 0.08); } else o.frequency.setValueAtTime(f, t);
    env(e, t, g, 0.004, dur, 0.12);
    o.connect(e); e.connect(sub808); o.start(t); o.stop(t + dur + 0.6);
  }
  /** a supersaw chord: seven detuned saws per note, spread in stereo, through a lowpass */
  function saws(t: number, dur: number, notes: string[], g: number, o: { cut: number; cutTo?: number; a?: number; rel?: number; q?: number; bus?: AudioNode; oct?: number }) {
    const f = filt('lowpass', o.cut, o.q || 0.8), e = c.createGain();
    if (o.cutTo) f.frequency.exponentialRampToValueAtTime(o.cutTo, t + dur);
    env(e, t, g, o.a || 0.006, dur, o.rel || 0.25);
    f.connect(e); e.connect(o.bus || synth);
    const DET = [-21, -12, -5, 0, 5, 12, 21];
    notes.forEach(function (nt) {
      DET.forEach(function (d, i) {
        const s = c.createOscillator(), p = c.createStereoPanner();
        s.type = 'sawtooth'; s.frequency.value = hz(nt) * (o.oct || 1); s.detune.value = d + (rnd() - 0.5) * 4;
        p.pan.value = (i / (DET.length - 1)) * 1.5 - 0.75;
        s.connect(p); p.connect(f);
        const st = t + rnd() * 0.004;
        s.start(st); s.stop(t + dur + (o.rel || 0.25) * 2 + 0.1);
      });
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
    s.connect(f); f.connect(e); e.connect(synth); send(e, dIn, 0.35);
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

  /* ---------- the arrangement ---------- */
  const PROG = ['Am', 'F', 'G', 'E'];
  const chordAt = function (b: number) {
    if (b < 4) return PROG[b];
    if (b < 6) return b === 4 ? 'Am' : 'E';
    if (b >= 26 && b < 30) return ['Am', 'F', 'Dm', 'E'][b - 26];
    if (b === 30) return 'F';
    if (b === 31) return 'G';
    if (b >= 36 && b < 38) return b === 36 ? 'F' : 'G';
    if (b >= 38) return 'Am';
    return PROG[(b - 6 + 400) % 4];
  };

  /* intro: the clock, a heartbeat, a dark pad, the theme behind a closed filter */
  for (let b = 0; b < 4; b++) {
    const ch = chordAt(b);
    saws(at(b), BEAT * 4, CHORD[ch], 0.018, { cut: 380 + b * 160, a: b ? 0.05 : 1.2, rel: 0.4 });
    boom(at(b), BEAT * 3.6, ROOT[ch], 0.12);
    for (let s = 0; s < 16; s += 2) if (!(b === 3 && s >= 14)) tick(step(b, s), s % 4 === 0 ? 0.06 : 0.04, s % 4 === 0);
    if (b >= 1) { kick(at(b), 0.5, 1); kick(at(b, 0.75), 0.32, 1); }
    if (b < 2) for (let s = 0; s < 16; s++) if (rnd() < 0.55) typeClick(step(b, s) + rnd() * 0.04, 0.05);
  }
  melody(2, THEME.slice(2), function (t, d, n) { chip(t, d, n, 0.075, { cut: 500 + (t - at(2)) / (BEAT * 8) * 3800, vib: 10 }); });
  riser(at(2, 2), BEAT * 5.5, 0.15);
  reverseCrash(at(4), BEAT * 2, 0.2);

  /* the logo hit */
  impact(at(4), 0.8);
  saws(at(4), BEAT * 6, CHORD.Am, 0.04, { cut: 6000, cutTo: 900, rel: 1.6 });
  saws(at(4), BEAT * 6, ['A2', 'E3'], 0.03, { cut: 2500, cutTo: 500, rel: 1.6 });
  boom(at(4), BEAT * 5, 'A1', 0.55, 'A2');
  chip(at(4), BEAT * 3, 'A5', 0.06, { vib: 20, saw: 0.3 });
  saws(at(5, 2), BEAT * 2, CHORD.E, 0.022, { cut: 900, cutTo: 4000 });
  for (let s = 8; s < 16; s++) snare(step(5, s), 0.16 + (s - 8) * 0.04, 200 + (s - 8) * 12);
  whoosh(at(5, 3));

  /* the groove: friends and the world */
  for (let b = 6; b < 14; b++) {
    const ch = chordAt(b), odd = b % 2 === 1;
    const kicks = odd ? [0, 7, 10] : [0, 10];
    kicks.forEach(function (s, i) {
      kick(step(b, s), 0.8, 0.5, 0.2);
      const next = i + 1 < kicks.length ? kicks[i + 1] : 16;
      boom(step(b, s), (next - s) * S16 * 0.95, s === 7 ? ROOT[ch].replace('1', '2') : ROOT[ch], 0.42, s === 7 ? ROOT[ch] : undefined);
    });
    clap(step(b, 8), 0.42); snare(step(b, 8), 0.2);
    for (let s = 0; s < 16; s += 2) hat(step(b, s), s % 4 === 0 ? 0.1 : 0.065);
    if (odd) { for (let s = 12; s < 16; s += 0.5) hat(step(b, s), 0.05 + (s - 12) * 0.012); hat(step(b, 14), 0.1, true); }
    saws(at(b), BEAT * 4, CHORD[ch], 0.024, { cut: 1900, rel: 0.3 });
    for (let s = 0; s < 16; s++) pluck(step(b, s), ARP[ch][ARP_STEPS[s]], s % 4 === 0 ? 0.065 : 0.048, 2600 + (b - 6) * 200);
  }
  melody(10, THEME, function (t, d, n) { chip(t, d, n, 0.07, { cut: 2600 }); });
  for (let s = 12; s < 16; s++) snare(step(13, s), 0.2 + (s - 12) * 0.06, 230);
  whoosh(at(13, 3), 0.16);

  /* the build: the tall grass */
  for (let b = 14; b < 18; b++) {
    const ch = chordAt(b), p = (b - 14) / 4;
    const cutA = 700 * Math.pow(10, p), cutB = 700 * Math.pow(10, p + 0.25);
    saws(at(b), BEAT * 4, CHORD[ch], 0.02 + p * 0.012, { cut: cutA, cutTo: cutB, rel: 0.2 });
    boom(at(b), BEAT * 3.8, ROOT[ch], 0.3);
    for (let s = 0; s < 16; s++) pluck(step(b, s), ARP[ch][ARP_STEPS[s]], 0.03 + p * 0.03, 1800 + p * 4000);
    if (b < 16) for (let k = 0; k < 4; k++) kick(at(b, k), 0.75, 0.55, 0.25);
    const every = b === 14 ? 4 : b === 15 ? 2 : 1;
    for (let s = 0; s < 16; s += every) {
      if (b === 17 && s >= 12) break;
      snare(step(b, s), 0.14 + p * 0.3 + (s / 16) * 0.08, 200 + p * 160 + s * 3);
    }
    for (let s = 0; s < 16; s += 2) hat(step(b, s), 0.05 + p * 0.05);
  }
  for (let s = 12; s < 14; s += 0.5) snare(step(17, s), 0.5, 380 + (s - 12) * 40);
  riser(at(14), BEAT * 15.5, 0.17);
  reverseCrash(at(18), BEAT * 3, 0.22);

  /* drop 1: trap */
  for (let b = 18; b < 26; b++) {
    const ch = chordAt(b), odd = b % 2 === 1;
    const kicks = odd ? [0, 3, 10, 13] : [0, 6, 10];
    kicks.forEach(function (s, i) {
      kick(step(b, s), 0.95, 0.25, 0.24);
      const next = i + 1 < kicks.length ? kicks[i + 1] : 16;
      const up = !odd && s === 10;
      boom(step(b, s), (next - s) * S16 * 0.96, up ? ROOT[ch].replace('1', '2') : ROOT[ch], 0.55, up ? ROOT[ch] : undefined);
    });
    clap(step(b, 8), 0.55); snare(step(b, 8), 0.3);
    if (b === 21 || b === 25) { snare(step(b, 14), 0.2); snare(step(b, 15), 0.28); }
    for (let s = 0; s < 16; s++) {
      if (odd && s >= 12) continue;
      hat(step(b, s), s % 4 === 0 ? 0.11 : s % 2 === 0 ? 0.08 : 0.05);
    }
    if (odd) for (let k = 0; k < 6; k++) hat(step(b, 12) + k * (S16 * 4 / 6), 0.06 + k * 0.012);
    hat(step(b, 14), 0.1, true);
    saws(at(b), BEAT * 4, CHORD[ch], 0.036, { cut: 5200, rel: 0.25 });
    saws(at(b), BEAT * 4, [CHORD[ch][0]], 0.02, { cut: 2000, oct: 0.5 });
    for (let s = 0; s < 16; s++) pluck(step(b, s), ARP[ch][ARP_STEPS[s]], 0.022, 5200);
  }
  [18, 22].forEach(function (b) { impact(at(b), 0.55); melody(b, THEME, function (t, d, n) { chip(t, d, n, 0.09, { saw: 0.35 }); }); });
  downer(at(25, 2), BEAT * 2.2, 0.12);

  /* the plot: a music box */
  impact(at(26), 0.4);
  for (let b = 26; b < 30; b++) {
    const ch = chordAt(b);
    saws(at(b), BEAT * 4, CHORD[ch], 0.022, { cut: 900, a: 0.4, rel: 0.6 });
    boom(at(b), BEAT * 4, ROOT[ch], 0.14);
    for (let s = 0; s < 16; s += 2) tick(step(b, s), s % 4 === 0 ? 0.035 : 0.022, s % 4 === 0);
  }
  melody(26, BELL, function (t, d, n) { bell(t, d, n, 0.14); bell(t, d, n.replace(/\d/, function (o) { return String(+o - 1); }), 0.05); });
  riser(at(29), BEAT * 4, 0.12, false);
  for (let s = 8; s < 16; s++) snare(step(29, s), 0.12 + (s - 8) * 0.03, 220);

  /* made by hand: typing, a short build */
  for (let b = 30; b < 32; b++) {
    const ch = chordAt(b), p = b - 30;
    saws(at(b), BEAT * 4, CHORD[ch], 0.032, { cut: 1200 + p * 2500, cutTo: 3000 + p * 4000 });
    boom(at(b), BEAT * 3.8, ROOT[ch], 0.35);
    for (let s = 0; s < 16; s++) {
      pluck(step(b, s), ARP[ch][ARP_STEPS[s]], 0.035 + s * 0.0015, 3000 + s * 150);
      if (rnd() < 0.8) typeClick(step(b, s) + rnd() * 0.03, 0.06);
      hat(step(b, s), s % 2 === 0 ? 0.07 : 0.04);
    }
    if (b === 30) for (let k = 0; k < 4; k++) kick(at(b, k), 0.8, 0.5, 0.25);
    else for (let s = 0; s < 12; s += 2) kick(step(b, s), 0.8, 0.5, 0.15);
    for (let s = 0; s < 16; s += b === 30 ? 2 : 1) { if (b === 31 && s >= 14) break; snare(step(b, s), 0.15 + p * 0.2 + s * 0.01, 220 + p * 120 + s * 6); }
  }
  for (let s = 12; s < 14; s += 0.5) snare(step(31, s), 0.5, 420);
  riser(at(30), BEAT * 7.5, 0.15);
  reverseCrash(at(32), BEAT * 2, 0.22);

  /* drop 2: four on the floor */
  for (let b = 32; b < 38; b++) {
    const ch = chordAt(b);
    for (let k = 0; k < 4; k++) kick(at(b, k), 1, 0.2, 0.3);
    clap(at(b, 1), 0.55); clap(at(b, 3), 0.55);
    for (let s = 0; s < 16; s++) hat(step(b, s), s % 4 === 2 ? 0.13 : 0.045, s % 4 === 2);
    saws(at(b), BEAT * 4, CHORD[ch], 0.04, { cut: 6500, rel: 0.25 });
    for (let s = 2; s < 16; s += 4) saws(step(b, s), S16 * 1.6, [ROOT[ch].replace('1', '2'), ROOT[ch].replace('1', '3')], 0.05, { cut: 1500, rel: 0.05 });
    boom(at(b), BEAT * 3.9, ROOT[ch], 0.4);
  }
  impact(at(32), 0.6); crash(at(36), 0.22);
  melody(32, THEME, function (t, d, n) { const up = n.replace(/\d/, function (o) { return String(+o + 1); }); chip(t, d, up, 0.07, { saw: 0.25 }); chip(t, d, n, 0.045, { oct: false }); });
  melody(36, CLIMB, function (t, d, n) { chip(t, d, n, 0.085, { saw: 0.3 }); });
  for (let s = 8; s < 16; s++) snare(step(37, s), 0.18 + (s - 8) * 0.05, 260 + (s - 8) * 20);
  riser(at(37), BEAT * 4, 0.15);

  /* the outro: the last chord, and the theme's first notes echoing away */
  impact(at(38), 0.85);
  saws(at(38), BEAT * 4, CHORD.Am, 0.045, { cut: 7000, cutTo: 700, rel: 2.4 });
  saws(at(38), BEAT * 4, ['A2', 'E3'], 0.03, { cut: 3000, cutTo: 400, rel: 2.4 });
  boom(at(38), BEAT * 6, 'A1', 0.55, 'A2');
  chip(at(38), BEAT * 3, 'A6', 0.06, { saw: 0.2, vib: 22 });
  bell(at(38), BEAT * 4, 'A5', 0.12);
  melody(39, OUTRO, function (t, d, n) { pluck(t, n, 0.05, 3000); bell(t, d, n, 0.05); });

  /* the game's own sounds */
  CUES.forEach(function (q) {
    const g = c.createGain(); g.gain.value = q[3]; g.connect(sfxBus);
    renderSfx(c, g, q[2], at(q[0], q[1]));
  });

  /* the sidechain: synths and bass dip under each kick */
  ducks.sort(function (a, b) { return a.t - b.t; });
  [synthDuck, bassDuck].forEach(function (g, gi) {
    g.gain.setValueAtTime(1, 0);
    ducks.forEach(function (d, i) {
      const next = i + 1 < ducks.length ? ducks[i + 1].t : Infinity;
      if (next - d.t < 0.02) return;
      const depth = gi === 1 ? Math.min(1, d.depth + 0.25) : d.depth;
      g.gain.setTargetAtTime(depth, d.t, 0.003);
      g.gain.setTargetAtTime(1, d.t + 0.02, Math.min(d.rel, next - d.t) / 3);
    });
  });

  const buf = await c.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1);
  /* loudness: a gain, then a look-ahead limiter at −0.6 dBFS */
  /* the drops at about −10 dBFS rms; the quiet parts stay quiet */
  let sum = 0, cnt = 0;
  [[18, 26], [32, 38]].forEach(function (p) {
    for (let i = Math.floor(at(p[0]) * rate); i < Math.floor(at(p[1]) * rate); i++) { sum += L[i] * L[i] + R[i] * R[i]; cnt += 2; }
  });
  const pre = Math.pow(10, -10 / 20) / Math.sqrt(sum / cnt);
  for (let i = 0; i < L.length; i++) { L[i] *= pre; R[i] *= pre; }
  limit(L, R, rate, 0.93);
  let pk = 0; const rms: number[] = [];
  for (let b = 0; b < 42; b++) {
    let s = 0, n = 0;
    for (let i = Math.floor(at(b) * rate); i < Math.min(L.length, Math.floor(at(b + 1) * rate)); i++) { s += L[i] * L[i] + R[i] * R[i]; n += 2; pk = Math.max(pk, Math.abs(L[i]), Math.abs(R[i])); }
    rms.push(n ? +(20 * Math.log10(Math.sqrt(s / n) + 1e-9)).toFixed(1) : -99);
  }
  return { wav: wavBase64(L, R, rate), peak: pk, rms };

  /* ---------- helpers ---------- */
  function curve(drive: number): Float32Array<ArrayBuffer> {
    const n = 2048, out = new Float32Array(n), k = Math.tanh(drive);
    for (let i = 0; i < n; i++) { const x = i / (n - 1) * 2 - 1; out[i] = Math.tanh(x * drive) / k; }
    return out;
  }
  function impulse(sec: number, decay: number): AudioBuffer {
    const len = Math.floor(rate * sec), b = c.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = b.getChannelData(ch); let s = 4242 + ch * 977, lp = 0;
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

/** a look-ahead peak limiter: the gain falls before a peak arrives and comes back slowly */
function limit(L: Float32Array, R: Float32Array, rate: number, ceiling: number) {
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
  let g = 1, acc = look;
  const ring = new Float32Array(look).fill(1);
  for (let i = 0; i < n; i++) {
    const m = minA[i];
    g = m < g ? m : g + (m - g) * relK;
    acc += g - ring[i % look]; ring[i % look] = g;
    const sm = acc / look;
    L[i] *= sm; R[i] *= sm;
    const p = Math.max(Math.abs(L[i]), Math.abs(R[i]));
    if (p > ceiling) { const k = ceiling / p; L[i] *= k; R[i] *= k; }
  }
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
