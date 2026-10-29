/* The audio graph: one AudioContext, created on the first tap or key press (browsers only let sound start
   after a gesture), a music bus and an effects bus into a master gain and a compressor.
   On or off is remembered on this device; it starts on. */

export const KEY = 'lotte-tra-amici:audio:v1';
interface Saved { v: 1; on: boolean }

function loadOn(): boolean {
  try {
    const v = JSON.parse(window.localStorage.getItem(KEY) || 'null') as Saved | null;
    if (v && v.v === 1 && typeof v.on === 'boolean') return v.on;
  } catch (e) { /* storage unavailable */ }
  return true;
}
function saveOn() { try { window.localStorage.setItem(KEY, JSON.stringify({ v: 1, on: on })); } catch (e) { /* ignore */ } }

let on = loadOn();
export let ctx: AudioContext | null = null;
export let musicBus: GainNode, sfxBus: GainNode;
let master: GainNode;
const listeners: (() => void)[] = [];

/** the context, once a gesture has created it and it is running; null before that */
export function live(): AudioContext | null { return ctx && ctx.state === 'running' && on ? ctx : null; }
export function isOn(): boolean { return on; }

function create(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch (e) { return null; }
  master = ctx.createGain();
  master.gain.value = on ? 1 : 0;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  master.connect(comp); comp.connect(ctx.destination);
  musicBus = ctx.createGain(); musicBus.gain.value = 0.42; musicBus.connect(master);
  sfxBus = ctx.createGain(); sfxBus.gain.value = 0.7; sfxBus.connect(master);
  return ctx;
}
/** called on every tap and key press: the first one creates the context, later ones wake it if needed */
function unlock() {
  if (!on) return;
  const c = create();
  if (!c) return;
  if (c.state === 'suspended' && !document.hidden) c.resume().then(notify, function () { /* not allowed yet */ });
  else if (!ready) notify();
}
/* tell the listeners only when something changed: a click must not repaint the button being clicked */
let ready = false;
function notify() { ready = !!live(); listeners.forEach(function (fn) { fn(); }); }
/** fn runs whenever sound becomes possible (unlocked, switched on, page visible again) */
export function onReady(fn: () => void) { listeners.push(fn); }

export function setOn(v: boolean) {
  on = v; saveOn();
  if (v) unlock();
  if (ctx && master) master.gain.setTargetAtTime(v ? 1 : 0, ctx.currentTime, 0.03);
  notify();
}

export function installUnlock() {
  document.addEventListener('pointerdown', unlock, true);
  document.addEventListener('keydown', unlock, true);
  /* no sound in a background tab */
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(function () { /* ignore */ });
    else if (on) ctx.resume().then(notify, function () { /* ignore */ });
  });
}
