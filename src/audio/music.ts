import { live, musicBus, onReady, isOn } from './context';
import { tone, hz, kick, snare, hat } from './synth';
import { TRACKS, type Track } from './tracks';

/* The music player: notes are scheduled a little ahead on the audio clock, so timers can be late
   without the beat stumbling. One track at a time; on the map, the old one keeps playing as it fades out under the new
   one (each with its own place in its bars), so a change of neighbourhood is a crossfade, not a cut. */

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

interface Playing { name: string; track: Track; p: Parsed; out: GainNode; next: number; step: number; byStep: { v: number; n: Note }[][]; until?: number }
/** the track playing, and the ones still sounding as they fade out under it (a crossfade) */
let cur: Playing | null = null, fading: Playing[] = [], wanted: string | null = null, timer = 0;
const parsed: Record<string, Parsed> = {};

/** an equal-power curve, so a crossfade has no dip in the middle: rising (sin) or falling (cos) */
function curve(up: boolean): Float32Array {
  const n = 32, a = new Float32Array(n);
  for (let k = 0; k < n; k++) { const x = k / (n - 1) * Math.PI / 2; a[k] = Math.max(0.0001, up ? Math.sin(x) : Math.cos(x)); }
  return a;
}
/** starts a track at `at` (now by default), in a quarter of a second, or over `fade` seconds for a crossfade */
function start(name: string, at?: number, fade?: number) {
  const c = live();
  if (!c) return;
  const track = TRACKS[name], p = parsed[name] || (parsed[name] = parse(track));
  const byStep = stepsOf(p), t0 = Math.max(c.currentTime + 0.02, at || 0);
  const out = c.createGain();
  out.gain.setValueAtTime(0.0001, c.currentTime);
  if (fade) out.gain.setValueCurveAtTime(curve(true), t0, fade);
  else { out.gain.setValueAtTime(0.0001, t0); out.gain.exponentialRampToValueAtTime(1, t0 + 0.25); }
  out.connect(musicBus);
  cur = { name, track, p, out, next: at ? t0 : c.currentTime + 0.08, step: 0, byStep };
  if (!timer) timer = window.setInterval(tick, 25);
  tick();
}
/** the track playing goes quiet: at once (a battle cuts in), or over `fade` seconds while the next one comes up */
function fadeOut(fade?: number, from?: number) {
  const c = live();
  if (cur) {
    const P = cur, out = P.out;
    if (c && fade) {
      const t0 = Math.max(c.currentTime + 0.01, from || 0), g = out.gain as AudioParam & { cancelAndHoldAtTime?(t: number): AudioParam };
      /* a curve may not overlap another one still running (its own fade in, if it has just come): then a plain glide */
      try {
        if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(c.currentTime); else g.cancelScheduledValues(c.currentTime);
        g.setValueCurveAtTime(curve(false), t0, fade);
      } catch (e) { g.cancelScheduledValues(c.currentTime); g.setTargetAtTime(0.0001, t0, fade / 4); }
      P.until = t0 + fade;
      fading.push(P);
    } else if (c) { out.gain.cancelScheduledValues(c.currentTime); out.gain.setTargetAtTime(0.0001, c.currentTime, 0.12); setTimeout(function () { out.disconnect(); }, 900); }
    else out.disconnect();
  }
  cur = null;
  if (!fade) { stopFading(); if (timer) { clearInterval(timer); timer = 0; } }
}
function stopFading() { fading.forEach(function (P) { P.out.disconnect(); }); fading = []; }
/** schedules the next notes of a track, a little ahead on the audio clock; false once a jingle is over */
function ahead(c: AudioContext, P: Playing): boolean {
  const dt = 60 / P.track.bpm / 4;
  while (P.next < c.currentTime + 0.15 && (P.until == null || P.next < P.until)) {
    playStep(c, P.out, P.track, P.p, P.byStep, P.step, P.next, dt);
    P.next += dt;
    P.step++;
    if (P.step >= P.p.steps) {
      if (!P.track.loop) return false;
      P.step = 0;
    }
  }
  return true;
}
function tick() {
  const c = live();
  if (!c || (!cur && !fading.length)) { fadeOut(); return; }
  /* the ones fading out keep playing until they are silent */
  fading = fading.filter(function (P) {
    if (c.currentTime > P.until! + 0.2) { P.out.disconnect(); return false; }
    ahead(c, P);
    return true;
  });
  if (cur && !ahead(c, cur)) { wanted = null; const last = cur; setTimeout(function () { if (cur === last) fadeOut(); }, 1500); }
}
/** when the next beat of the track playing falls (the new one comes in on it), on the audio clock */
function nextBeat(c: AudioContext): number {
  if (!cur) return c.currentTime;
  const dt = 60 / cur.track.bpm / 4;
  let t = cur.next, step = cur.step;
  while (step % 4 !== 0 || t < c.currentTime + 0.05) { t += dt; step++; }
  return t;
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

/** the music for a scene (a track name, or null for silence); it starts as soon as sound is possible. With `fade`
    (the map, from one neighbourhood to the next, from day to night) the two cross over that many seconds, the new one
    coming in on a beat of the old; without it (a battle, a result) the old one stops at once */
export function music(name: string | null, o?: { fade?: number }) {
  wanted = name;
  if (cur && cur.name === name && (cur.track.loop || cur.step > 0)) return;
  const c = live(), fade = o && o.fade && c && cur && name ? o.fade : 0;
  if (fade) {
    const at = nextBeat(c!);
    fadeOut(fade, at);
    if (isOn()) start(name!, at, fade);
    return;
  }
  fadeOut();
  if (name && isOn()) start(name);
}
onReady(function () {
  if (!isOn()) { fadeOut(); return; }
  if (wanted && (!cur || cur.name !== wanted)) { fadeOut(); start(wanted); }
});
