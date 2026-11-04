import { live, sfxBus } from './context';
import { tone, hiss, hz, wobble } from './synth';

/* Sound effects, all made on the spot from oscillators and noise. Each takes the start time on the audio clock. */
type Fx = (c: BaseAudioContext, out: AudioNode, t: number) => void;
const arp = (c: BaseAudioContext, out: AudioNode, t: number, notes: string[], step: number, o: Parameters<typeof tone>[5] = {}) =>
  notes.forEach(function (n, i) { tone(c, out, hz(n), t + i * step, step * 1.4, o); });

const FX: Record<string, Fx> = {
  /* ---------- interface ---------- */
  click(c, out, t) { tone(c, out, 1320, t, 0.018, { type: 'square', gain: 0.13, cutoff: 3000, decay: 0.01, sustain: 0.2, release: 0.02 }); },
  blip(c, out, t) { tone(c, out, 640 + wobble() * 120, t, 0.02, { type: 'square', gain: 0.08, cutoff: 1800, decay: 0.01, sustain: 0.3, release: 0.015 }); },
  blipVoice(c, out, t) { tone(c, out, 420 + wobble() * 90, t, 0.024, { type: 'triangle', gain: 0.14, decay: 0.01, sustain: 0.4, release: 0.02 }); },

  /* ---------- battle ---------- */
  lunge(c, out, t) { hiss(c, out, t, 0.14, { freq: 500, to: 1800, q: 0.8, gain: 0.9 }); },
  hit(c, out, t) {
    hiss(c, out, t, 0.12, { type: 'lowpass', freq: 3200, to: 300, gain: 0.75 });
    tone(c, out, 300, t, 0.1, { type: 'square', to: 110, gain: 0.3, cutoff: 1400, decay: 0.05, sustain: 0.4 });
  },
  crit(c, out, t) {
    FX.hit(c, out, t);
    tone(c, out, 1760, t + 0.03, 0.08, { type: 'square', gain: 0.12, cutoff: 5000, decay: 0.03, sustain: 0.5 });
    tone(c, out, 2637, t + 0.08, 0.12, { type: 'square', gain: 0.1, cutoff: 6000, decay: 0.04, sustain: 0.4 });
  },
  superEff(c, out, t) { arp(c, out, t + 0.05, ['E6', 'B6'], 0.07, { type: 'square', gain: 0.1, cutoff: 5000, decay: 0.03, sustain: 0.5 }); },
  weak(c, out, t) { tone(c, out, 140, t, 0.12, { type: 'triangle', to: 90, gain: 0.45, decay: 0.06, sustain: 0.3 }); },
  dodge(c, out, t) { hiss(c, out, t, 0.24, { freq: 2200, to: 500, q: 1, gain: 0.7 }); },
  heal(c, out, t) { arp(c, out, t, ['C5', 'E5', 'G5', 'C6', 'E6'], 0.055, { type: 'triangle', gain: 0.16, decay: 0.05, sustain: 0.6, vibrato: 10 }); },
  regen(c, out, t) { arp(c, out, t, ['G5', 'C6'], 0.06, { type: 'triangle', gain: 0.08, decay: 0.04, sustain: 0.5 }); },
  faint(c, out, t) {
    tone(c, out, 620, t, 0.7, { type: 'square', to: 70, gain: 0.1, cutoff: 1600, decay: 0.2, sustain: 0.7, release: 0.2 });
    hiss(c, out, t + 0.55, 0.3, { type: 'lowpass', freq: 600, to: 120, gain: 0.25 });
  },
  enter(c, out, t) { hiss(c, out, t, 0.3, { freq: 300, to: 2400, q: 0.8, gain: 0.55 }); tone(c, out, hz('C5'), t + 0.22, 0.08, { type: 'square', gain: 0.05, cutoff: 3000 }); },
  banner(c, out, t) {
    arp(c, out, t, ['G4', 'C5', 'E5', 'G5'], 0.07, { type: 'square', gain: 0.07, cutoff: 3200, decay: 0.04, sustain: 0.7 });
    tone(c, out, hz('C6'), t + 0.28, 0.5, { type: 'square', gain: 0.08, cutoff: 3400, vibrato: 18, sustain: 0.8, release: 0.2 });
    hiss(c, out, t + 0.28, 0.5, { type: 'highpass', freq: 5000, gain: 0.05 });
  },
  party(c, out, t) { for (let k = 0; k < 7; k++) tone(c, out, 1200 + wobble() * 1600, t + k * 0.045, 0.04, { type: 'square', gain: 0.07, cutoff: 6000, decay: 0.02, sustain: 0.3 }); },
  bark(c, out, t) {
    [0, 0.17].forEach(function (d) {
      tone(c, out, 520, t + d, 0.09, { type: 'square', to: 300, gain: 0.1, cutoff: 1500, decay: 0.03, sustain: 0.6 });
      hiss(c, out, t + d, 0.08, { freq: 900, q: 2, gain: 0.08 });
    });
  },
  laugh(c, out, t) { for (let k = 0; k < 5; k++) tone(c, out, 520 - k * 20, t + k * 0.11, 0.07, { type: 'triangle', gain: 0.12, decay: 0.02, sustain: 0.7, vibrato: 40 }); },
  cricket(c, out, t) { for (let k = 0; k < 6; k++) tone(c, out, 4200, t + k * 0.06 + (k > 2 ? 0.25 : 0), 0.025, { type: 'square', gain: 0.06, cutoff: 8000, decay: 0.01, sustain: 0.5 }); },
  speech(c, out, t) { for (let k = 0; k < 9; k++) tone(c, out, 260 + wobble() * 260, t + k * 0.07, 0.05, { type: 'square', gain: 0.09, cutoff: 1400, decay: 0.02, sustain: 0.6 }); },
  robot(c, out, t) {
    arp(c, out, t, ['A5', 'E5', 'A5', 'C6'], 0.06, { type: 'square', gain: 0.05, cutoff: 2600, decay: 0.02, sustain: 0.6 });
    hiss(c, out, t + 0.25, 0.3, { freq: 600, to: 2400, q: 1.5, gain: 0.08 });
  },
  robotFail(c, out, t) {
    arp(c, out, t, ['E5', 'C5', 'G4'], 0.08, { type: 'square', gain: 0.05, cutoff: 2000 });
    hiss(c, out, t + 0.3, 0.35, { type: 'lowpass', freq: 2000, to: 200, gain: 0.3 });
    tone(c, out, 120, t + 0.3, 0.15, { type: 'sine', to: 50, gain: 0.3 });
  },
  robotFix(c, out, t) { for (let k = 0; k < 6; k++) hiss(c, out, t + k * 0.09, 0.03, { freq: 3000, q: 1.5, gain: 0.3 }); },
  lost(c, out, t) { arp(c, out, t, ['A4', 'E4'], 0.16, { type: 'triangle', gain: 0.16, decay: 0.06, sustain: 0.7, vibrato: 20 }); },
  found(c, out, t) { arp(c, out, t, ['C5', 'E5', 'G5'], 0.08, { type: 'triangle', gain: 0.15, decay: 0.05, sustain: 0.6 }); },
  ai(c, out, t) { arp(c, out, t, ['E6', 'G6', 'B6', 'E7'], 0.05, { type: 'sine', gain: 0.12, decay: 0.04, sustain: 0.4 }); },
  reveal(c, out, t) { tone(c, out, 300, t, 0.8, { type: 'sine', to: 1600, gain: 0.12, decay: 0.1, sustain: 0.8, release: 0.1 }); },
  confused(c, out, t) { tone(c, out, 700, t, 0.4, { type: 'triangle', to: 350, gain: 0.1, vibrato: 60, sustain: 0.8 }); },
  shimmer(c, out, t) { arp(c, out, t, ['C6', 'G6', 'E6', 'C7'], 0.05, { type: 'triangle', gain: 0.11, decay: 0.03, sustain: 0.5 }); },
  ball(c, out, t) { tone(c, out, 820, t, 0.04, { type: 'sine', gain: 0.3, decay: 0.02, sustain: 0.2 }); hiss(c, out, t, 0.03, { freq: 2500, q: 1.5, gain: 0.2 }); },
  whoosh(c, out, t) { hiss(c, out, t, 0.3, { freq: 400, to: 2600, q: 0.7, gain: 0.9 }); },
  plane(c, out, t) { hiss(c, out, t, 0.7, { freq: 2400, to: 300, q: 0.6, gain: 0.3, attack: 0.15 }); },
  planeBack(c, out, t) { hiss(c, out, t, 0.6, { freq: 300, to: 2400, q: 0.6, gain: 0.35, attack: 0.1 }); },
  headphones(c, out, t) { tone(c, out, 90, t, 0.25, { type: 'sine', gain: 0.18, sustain: 0.6, release: 0.15 }); FX.shimmer(c, out, t + 0.05); },
  notes(c, out, t) { arp(c, out, t, ['G5', 'B5', 'D6', 'G6'], 0.09, { type: 'square', gain: 0.05, cutoff: 3000, decay: 0.03, sustain: 0.6 }); },

  /* ---------- the creatures of Formia: their magic, the net, and a cry for each kind of body ---------- */
  magic(c, out, t) {
    arp(c, out, t, ['C6', 'E6', 'G6', 'B6', 'D7'], 0.04, { type: 'sine', gain: 0.12, decay: 0.03, sustain: 0.6, vibrato: 12 });
    hiss(c, out, t + 0.05, 0.25, { type: 'highpass', freq: 6000, gain: 0.08 });
  },
  magicUp(c, out, t) { ['C5', 'E5', 'G5', 'C6'].forEach(function (n, i) { tone(c, out, hz(n), t + i * 0.03, 0.5, { type: 'triangle', gain: 0.07, attack: 0.12, sustain: 0.7, release: 0.25, vibrato: 8 }); }); },
  net(c, out, t) { hiss(c, out, t, 0.3, { freq: 900, to: 3200, q: 0.9, gain: 0.5 }); tone(c, out, 500, t + 0.25, 0.06, { type: 'triangle', gain: 0.12 }); },
  /* the creatures' spells (ui/spells.ts): thunder for the lightning, a heartbeat for the giant heart */
  thunder(c, out, t) { hiss(c, out, t, 0.55, { type: 'lowpass', freq: 1400, to: 160, gain: 0.85 }); tone(c, out, 80, t, 0.4, { type: 'sawtooth', to: 38, gain: 0.1, cutoff: 500, decay: 0.12, sustain: 0.4 }); },
  heartbeat(c, out, t) { tone(c, out, 74, t, 0.13, { type: 'sine', to: 48, gain: 0.55, decay: 0.08, sustain: 0.25 }); tone(c, out, 66, t + 0.21, 0.13, { type: 'sine', to: 44, gain: 0.45, decay: 0.08, sustain: 0.25 }); },
  /* the net on the ground, shaking with the creature in it */
  shake(c, out, t) { tone(c, out, 260, t, 0.07, { type: 'triangle', to: 200, gain: 0.3, decay: 0.04, sustain: 0.3 }); hiss(c, out, t, 0.09, { freq: 1600, to: 900, q: 1.1, gain: 0.35 }); },
  caught(c, out, t) { arp(c, out, t, ['G5', 'C6', 'E6', 'G6'], 0.09, { type: 'square', gain: 0.06, cutoff: 5000, decay: 0.03, sustain: 0.7 }); FX.magic(c, out, t + 0.36); },
  'cry-octo'(c, out, t) { ['G4', 'C5', 'E5'].forEach(function (n, i) { tone(c, out, hz(n), t + i * 0.07, 0.06, { type: 'sine', to: hz(n) * 1.4, gain: 0.22, decay: 0.03, sustain: 0.5 }); }); },
  'cry-lizard'(c, out, t) { tone(c, out, 260, t, 0.18, { type: 'triangle', to: 520, gain: 0.25, decay: 0.06, sustain: 0.6, vibrato: 25 }); },
  'cry-bird'(c, out, t) { [0, 0.2].forEach(function (d) { tone(c, out, 1300, t + d, 0.16, { type: 'square', to: 760, gain: 0.07, cutoff: 3000, decay: 0.05, sustain: 0.6, vibrato: 30 }); }); },
  'cry-cicada'(c, out, t) { for (let k = 0; k < 8; k++) tone(c, out, 3800, t + k * 0.035, 0.022, { type: 'square', gain: 0.05, cutoff: 7000, decay: 0.01, sustain: 0.5 }); },
  'cry-olive'(c, out, t) { tone(c, out, 880, t, 0.4, { type: 'sine', gain: 0.16, decay: 0.15, sustain: 0.3, release: 0.2 }); tone(c, out, 1320, t + 0.08, 0.35, { type: 'sine', gain: 0.1, decay: 0.15, sustain: 0.3 }); },
  'cry-urchin'(c, out, t) { for (let k = 0; k < 4; k++) hiss(c, out, t + k * 0.06, 0.03, { freq: 5000 - k * 600, q: 3, gain: 0.25 }); },
  'cry-crab'(c, out, t) { [0, 0.13].forEach(function (d) { hiss(c, out, t + d, 0.04, { freq: 1800, q: 2, gain: 0.45 }); tone(c, out, 700, t + d, 0.04, { type: 'square', gain: 0.06, cutoff: 2500 }); }); },
  'cry-owl'(c, out, t) { [0, 0.32].forEach(function (d) { tone(c, out, 420, t + d, 0.24, { type: 'sine', to: 380, gain: 0.22, attack: 0.04, sustain: 0.7, release: 0.1 }); }); },

  /* ---------- story ---------- */
  /* a wild creature jumps out of its hiding place: a rustle, then a rising alarm */
  rustle(c, out, t) { hiss(c, out, t, 0.18, { freq: 3000, to: 1200, q: 0.7, gain: 0.5 }); hiss(c, out, t + 0.12, 0.16, { freq: 2600, to: 900, q: 0.7, gain: 0.45 }); },
  meet(c, out, t) { FX.rustle(c, out, t); arp(c, out, t + 0.28, ['E5', 'A5', 'E6'], 0.07, { type: 'square', gain: 0.12, cutoff: 4200, decay: 0.03, sustain: 0.5 }); },
  /* a trainer has seen Antonio: the "!" over his head, a sharp sting */
  spot(c, out, t) { tone(c, out, hz('E6'), t, 0.06, { type: 'square', gain: 0.1, cutoff: 5000, decay: 0.02, sustain: 0.5 }); tone(c, out, hz('B6'), t + 0.07, 0.16, { type: 'square', gain: 0.1, cutoff: 5000, decay: 0.03, sustain: 0.6 }); },
  scooter(c, out, t) { tone(c, out, 70, t, 0.9, { type: 'sawtooth', to: 150, gain: 0.09, cutoff: 900, attack: 0.05, sustain: 0.8, release: 0.2, vibrato: 30 }); hiss(c, out, t, 0.8, { type: 'lowpass', freq: 600, gain: 0.2, attack: 0.1 }); },
  step(c, out, t) { hiss(c, out, t, 0.05, { type: 'lowpass', freq: 900 + wobble() * 300, gain: 0.5 }); },
  door(c, out, t) { hiss(c, out, t, 0.25, { freq: 350, to: 1400, q: 0.7, gain: 0.3 }); tone(c, out, 200, t + 0.05, 0.08, { type: 'triangle', gain: 0.1 }); },
  pickup(c, out, t) { arp(c, out, t, ['E6', 'G6', 'C7'], 0.07, { type: 'square', gain: 0.06, cutoff: 6000, decay: 0.03, sustain: 0.6 }); },
  badge(c, out, t) {
    arp(c, out, t, ['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], 0.07, { type: 'square', gain: 0.07, cutoff: 4000, decay: 0.03, sustain: 0.7 });
    tone(c, out, hz('C7'), t + 0.45, 0.5, { type: 'triangle', gain: 0.08, vibrato: 15, release: 0.3 });
  }
};

/** plays an effect now (and quietly does nothing until a gesture has unlocked the sound, or when it is off) */
export function sfx(name: string, delay = 0) {
  const c = live(), f = FX[name];
  if (!c || !f) return;
  f(c, sfxBus, c.currentTime + 0.005 + delay);
}
export const SFX_NAMES = Object.keys(FX);
/** an effect on any context and output (the audio test renders them offline) */
export function renderSfx(c: BaseAudioContext, out: AudioNode, name: string, t: number) { FX[name](c, out, t); }
