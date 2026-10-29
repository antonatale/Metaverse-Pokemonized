import { live, musicBus, onReady, isOn } from './context';
import { tone, hz, kick, snare, hat } from './synth';
import { TRACKS, type Track } from './tracks';

/* The music player: notes are scheduled a little ahead on the audio clock, so timers can be late
   without the beat stumbling. One track at a time, crossfaded when the scene changes. */

interface Note { step: number; len: number; freq: number }
interface Parsed { steps: number; voices: Note[][]; drums: string[] }

/** a track's bars as notes; throws on a bar that is not 16 steps or on a bad note name */
export function parse(t: Track): Parsed {
  const steps = (t.voices[0] ? t.voices[0].bars.length : 1) * 16;
  const voices = t.voices.map(function (v, vi) {
    const toks = v.bars.flatMap(function (b, bi) {
      const x = b.trim().split(/\s+/);
      if (x.length !== 16) throw new Error('voice ' + vi + ', bar ' + (bi + 1) + ' has ' + x.length + ' steps');
      return x;
    });
    if (toks.length !== steps) throw new Error('voice ' + vi + ' is ' + toks.length + ' steps long, not ' + steps);
    const notes: Note[] = [];
    toks.forEach(function (tk, i) {
      if (tk === '-') { if (notes.length && notes[notes.length - 1].step + notes[notes.length - 1].len === i) notes[notes.length - 1].len++; return; }
      if (tk === '.') return;
      notes.push({ step: i, len: 1, freq: hz(tk) });
    });
    return notes;
  });
  const drums = t.drums ? t.drums.bars.flatMap(function (b, bi) {
    const x = b.trim().split(/\s+/);
    if (x.length !== 16 || x.some(function (d) { return !/^(\.|[ksh]+)$/.test(d); })) throw new Error('drum bar ' + (bi + 1) + ' is not 16 steps of k, s, h or .');
    return x;
  }) : [];
  if (drums.length && drums.length !== steps) throw new Error('drums are ' + drums.length + ' steps long, not ' + steps);
  return { steps, voices, drums };
}

interface Playing { name: string; track: Track; p: Parsed; out: GainNode; next: number; step: number; byStep: { v: number; n: Note }[][] }
let cur: Playing | null = null, wanted: string | null = null, timer = 0;
const parsed: Record<string, Parsed> = {};

function start(name: string) {
  const c = live();
  if (!c) return;
  const track = TRACKS[name], p = parsed[name] || (parsed[name] = parse(track));
  const byStep = stepsOf(p);
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, c.currentTime);
  out.gain.exponentialRampToValueAtTime(1, c.currentTime + 0.25);
  out.connect(musicBus);
  cur = { name, track, p, out, next: c.currentTime + 0.08, step: 0, byStep };
  if (!timer) timer = window.setInterval(tick, 25);
  tick();
}
function fadeOut() {
  const c = live();
  if (cur) {
    const out = cur.out;
    if (c) { out.gain.cancelScheduledValues(c.currentTime); out.gain.setTargetAtTime(0.0001, c.currentTime, 0.12); setTimeout(function () { out.disconnect(); }, 900); }
    else out.disconnect();
  }
  cur = null;
  if (timer) { clearInterval(timer); timer = 0; }
}
function tick() {
  const c = live();
  if (!c || !cur) { fadeOut(); return; }
  const P = cur, dt = 60 / P.track.bpm / 4;
  while (P.next < c.currentTime + 0.15) {
    playStep(c, P.out, P.track, P.p, P.byStep, P.step, P.next, dt);
    P.next += dt;
    P.step++;
    if (P.step >= P.p.steps) {
      if (!P.track.loop) { wanted = null; const last = P; setTimeout(function () { if (cur === last) fadeOut(); }, 1500); return; }
      P.step = 0;
    }
  }
}

function stepsOf(p: Parsed) {
  const byStep: { v: number; n: Note }[][] = Array.from({ length: p.steps }, () => []);
  p.voices.forEach(function (notes, v) { notes.forEach(function (n) { byStep[n.step].push({ v, n }); }); });
  return byStep;
}
/** every note and drum hit that starts on one step */
function playStep(c: BaseAudioContext, out: AudioNode, track: Track, p: Parsed, byStep: { v: number; n: Note }[][], step: number, t: number, dt: number) {
  byStep[step].forEach(function (e) {
    const v = track.voices[e.v];
    tone(c, out, e.n.freq, t, e.n.len * dt * 0.95, { type: v.type, gain: v.gain, cutoff: v.cutoff, decay: v.decay, sustain: v.sustain, release: v.release, vibrato: v.vibrato });
  });
  const d = p.drums[step];
  if (d && d !== '.' && track.drums) {
    const g = track.drums.gain;
    if (d.indexOf('k') >= 0) kick(c, out, t, 0.5 * g);
    if (d.indexOf('s') >= 0) snare(c, out, t, 0.2 * g);
    if (d.indexOf('h') >= 0) hat(c, out, t, 0.06 * g);
  }
}
/** a whole track, once, on any context and output (the audio test renders it offline); returns its length in seconds */
export function renderTrack(c: BaseAudioContext, out: AudioNode, name: string, t0: number): number {
  const track = TRACKS[name], p = parsed[name] || (parsed[name] = parse(track)), byStep = stepsOf(p), dt = 60 / track.bpm / 4;
  for (let k = 0; k < p.steps; k++) playStep(c, out, track, p, byStep, k, t0 + k * dt, dt);
  return p.steps * dt;
}

/** the music for a scene (a track name, or null for silence); it starts as soon as sound is possible */
export function music(name: string | null) {
  wanted = name;
  if (cur && cur.name === name && (cur.track.loop || cur.step > 0)) return;
  fadeOut();
  if (name && isOn()) start(name);
}
onReady(function () {
  if (!isOn()) { fadeOut(); return; }
  if (wanted && (!cur || cur.name !== wanted)) { fadeOut(); start(wanted); }
});
