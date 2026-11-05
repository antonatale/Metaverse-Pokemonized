import type { Dir } from '../data/maps/types';
import { st, save } from '../save/story-progress';
import { stepTime } from '../data/growth';
import { DV, M, key, blocked, setMap, moveMode, isShallow, isWall } from './maps';
import { placeArrived, placeEntered } from './place-run';
import type { Arrival } from './place';
import { reduced } from '../ui/dom';
import { sfx } from '../audio';
import { root, dialog, running, useDoor, renderPlace, renderHud, stepped, skyFrom } from '../ui/story-screen';

/* Walking on the map, one tile at a time: a tap turns, holding walks; doors and warps take you elsewhere. */
export const TURN_HOLD = 110;
/** how long a step takes: quicker with Antonio's legs (setPace, when the story opens and when he trains them) */
export let STEP = 165;
export function setPace() { STEP = stepTime(st.skills || {}); }
export interface Mover { fx: number; fy: number; tx: number; ty: number; t0: number }

let held: Dir | null = null, pressedAt = 0, lastBump = '', walking = false;
/** the step in progress, and which foot */
export let mover: Mover | null = null, parity = 0, busy = false;
/** stop walking: a dialogue, a sheet or leaving the map */
export function halt() { held = null; walking = false; }
/** Antonio stands still (a trainer who has seen him walks up to him), and may walk again */
export function lock(on: boolean) { busy = on; if (on) halt(); }
export function press(d: Dir) {
  /* nobody walks while a winged creature shows Formia from above */
  if (!running || dialog || busy || skyFrom) return;
  held = d; pressedAt = performance.now();
  if (mover) return;
  if (st.dir !== d) st.dir = d; else tryStep(d, pressedAt);
}
export function release(d: Dir) { if (held === d) held = null; walking = false; lastBump = ''; }
/** the story screen hears what the tiles of a place do, to say so */
let placeHook: ((a: Arrival) => void) | null = null;
export function onPlace(f: (a: Arrival) => void) { placeHook = f; }
/** the story screen asks, when Antonio walks into the water or against the walls with a creature that can help */
let edgeHook: ((kind: 'swim' | 'climb', d: Dir) => boolean) | null = null;
export function onEdge(f: (kind: 'swim' | 'climb', d: Dir) => boolean) { edgeHook = f; }
/** one step now, in that direction (after the creature has said yes) */
export function stepNow(d: Dir) { held = null; walking = false; st.dir = d; tryStep(d, performance.now()); }
function tryStep(d: Dir, now: number): boolean {
  var v = DV[d], nx = st.x + v[0], ny = st.y + v[1], k = key(nx, ny);
  if (blocked(M, nx, ny)) {
    var a = M.at[k];
    if (a && a.kind === 'door' && !a.b.to && lastBump !== k) { lastBump = k; held = null; useDoor(a.b); }
    /* the sea, or the walls: maybe one of his creatures can take him there */
    else if (edgeHook && lastBump !== k && !moveMode.swim && isShallow(M, nx, ny) && edgeHook('swim', d)) { lastBump = k; held = null; walking = false; }
    else if (edgeHook && lastBump !== k && !moveMode.climb && isWall(M, nx, ny) && edgeHook('climb', d)) { lastBump = k; held = null; walking = false; }
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
  if (dialog || busy || skyFrom || !held) return;
  if (st.dir !== held) { st.dir = held; pressedAt = now; if (!walking) return; }
  if (!walking && now - pressedAt < TURN_HOLD) return;
  tryStep(held, now);
}
function arrived(): boolean {
  /* back on land, or down from the walls */
  if (moveMode.swim && M.cell(st.x, st.y).g !== 'sea') moveMode.swim = false;
  if (moveMode.climb && !isWall(M, st.x, st.y)) moveMode.climb = false;
  var a = M.at[key(st.x, st.y)];
  if (a && a.kind === 'door' && a.b.to) { warp(a.b.to, a.b.tx!, a.b.ty!, a.b.tdir); return true; }
  if (a && a.kind === 'warp') { warp(a.w.to, a.w.tx, a.w.ty, a.w.tdir); return true; }
  /* a place with a puzzle: the tile does what it does; a floor that carries is one more step, with nobody asking */
  if (M.place) {
    var r = placeArrived(M.place);
    if (placeHook) placeHook(r);
    if (r.hit || r.pad) { warp(M.id, r.w.x, r.w.y, r.pad && r.pad.dir); return true; }
    if (r.slide && !blocked(M, st.x + DV[r.slide][0], st.y + DV[r.slide][1])) {
      st.dir = r.slide;
      mover = { fx: st.x, fy: st.y, tx: st.x + DV[r.slide][0], ty: st.y + DV[r.slide][1], t0: performance.now() };
      return true;
    }
  }
  save(); renderPlace();
  return stepped();
}
/** to another map, or another part of this one, with a fade (doors, warps, the scooter) */
export function travel(to: string, x: number, y: number, dir?: Dir) { warp(to, x, y, dir); }
function warp(to: string, x: number, y: number, dir?: Dir) {
  busy = true; held = null; walking = false;
  root.classList.add('fade');
  sfx('door');
  setTimeout(function () {
    moveMode.swim = false; moveMode.climb = false;
    st.map = to; st.x = x; st.y = y; if (dir) st.dir = dir;
    setMap(to); if (M.place) placeEntered(); save(); renderHud();
    root.classList.remove('fade');
    busy = false;
  }, reduced ? 0 : 190);
}
