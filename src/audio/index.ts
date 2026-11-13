/* Background music and sound effects, all synthesized with the Web Audio API: nothing to load, nothing to
   inline, so the single-file build stays small. Sound starts after the first tap or key press, as browsers
   require, and can be switched off (remembered on this device under its own key). */
export { installUnlock as installAudio, isOn, setOn, onReady } from './context';
export { music } from './music';
export { worldMusic, settle, TUNE_WAIT, type TuneWait } from './zones';
export { sfx, voiceBlip } from './sfx';
export { cry, cryEventOf } from './cries';
export { cueBattle, typeBlip } from './cues';
