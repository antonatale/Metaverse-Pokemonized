import type { Dir } from '../data/maps/types';
import { st, save } from '../save/story-progress';
import { DV, M, key, blocked, setMap } from './maps';
import { reduced } from '../ui/dom';
import { sfx } from '../audio';
import { root, dialog, running, useDoor, renderPlace, renderHud } from '../ui/story-screen';

/* Walking on the map, one tile at a time: a tap turns, holding walks; doors and warps take you elsewhere. */
export const STEP = 165, TURN_HOLD = 110;
export interface Mover { fx: number; fy: number; tx: number; ty: number; t0: number }

let held: Dir | null = null, pressedAt = 0, lastBump = '', walking = false;
/** the step in progress, and which foot */
export let mover: Mover | null = null, parity = 0, busy = false;
/** stop walking: a dialogue, a sheet or leaving the map */
export function halt() { held = null; walking = false; }
export function press(d: Dir) {
  if (!running || dialog || busy) return;
  held = d; pressedAt = performance.now();
  if (mover) return;
  if (st.dir !== d) st.dir = d; else tryStep(d, pressedAt);
}
export function release(d: Dir) { if (held === d) held = null; walking = false; lastBump = ''; }
function tryStep(d: Dir, now: number): boolean {
  var v = DV[d], nx = st.x + v[0], ny = st.y + v[1], k = key(nx, ny);
  if (blocked(M, nx, ny)) {
    var a = M.at[k];
    if (a && a.kind === 'door' && !a.b.to && lastBump !== k) { lastBump = k; held = null; useDoor(a.b); }
    return false;
  }
  lastBump = '';
  mover = { fx: st.x, fy: st.y, tx: nx, ty: ny, t0: now };
  sfx('step');
  parity ^= 1;
  return true;
}
export function update(now: number) {
  if (mover) {
    if (now - mover.t0 < STEP) return;
    st.x = mover.tx; st.y = mover.ty; mover = null;
    walking = !!held;
    if (arrived()) return;
  }
  if (dialog || busy || !held) return;
  if (st.dir !== held) { st.dir = held; pressedAt = now; if (!walking) return; }
  if (!walking && now - pressedAt < TURN_HOLD) return;
  tryStep(held, now);
}
function arrived(): boolean {
  var a = M.at[key(st.x, st.y)];
  if (a && a.kind === 'door' && a.b.to) { warp(a.b.to, a.b.tx!, a.b.ty!, a.b.tdir); return true; }
  if (a && a.kind === 'warp') { warp(a.w.to, a.w.tx, a.w.ty, a.w.tdir); return true; }
  save(); renderPlace();
  return false;
}
/** to another map, or another part of this one, with a fade (doors, warps, the scooter) */
export function travel(to: string, x: number, y: number, dir?: Dir) { warp(to, x, y, dir); }
function warp(to: string, x: number, y: number, dir?: Dir) {
  busy = true; held = null; walking = false;
  root.classList.add('fade');
  sfx('door');
  setTimeout(function () {
    st.map = to; st.x = x; st.y = y; if (dir) st.dir = dir;
    setMap(to); save(); renderHud();
    root.classList.remove('fade');
    busy = false;
  }, reduced ? 0 : 190);
}
