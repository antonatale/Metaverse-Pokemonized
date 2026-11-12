import type { Dir } from '../data/maps/types';
import { st, save } from '../save/story-progress';
import { stepTime } from '../data/growth';
import { DV, M, key, blocked, setMap, moveMode, isShallow, isWall, moto, motoAt, rideable } from './maps';
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
/** a step, or a jump down a terrace: two tiles in one go, a little longer than a step (`dur`), in an arc (`jump`) */
export interface Mover { fx: number; fy: number; tx: number; ty: number; t0: number; dur?: number; jump?: boolean }
/** how long a jump down a terrace takes */
export const JUMP = 340;
/** the spot of a terrace one jumps down from (the legend's 'j'), walking south: never the other way */
export function ledgeAt(x: number, y: number): boolean { return M.cell(x, y).deco === 'ledge'; }

/* ---------- on the scooter ----------
   It picks up speed along a straight: each step in the same direction is a gear up, a bend takes two off, a stop
   starts again from the first. The top gear is about two and a half times a walk. */
export const GEARS = [150, 120, 98, 82, 68];
/** the gear he is riding in (0 on foot, and when the scooter has just set off) */
export let gear = 0;
let rideDir: Dir | null = null, lastEnd = 0;
/** the story screen says why the scooter does not go there (a door, the steps, the sand) */
let rideHook: ((x: number, y: number) => void) | null = null;
export function onRideStop(f: (x: number, y: number) => void) { rideHook = f; }
/** onto the scooter parked on the tile in front of him */
export function mount(): boolean {
  var v = DV[st.dir], x = st.x + v[0], y = st.y + v[1];
  if (st.sella || mover || !motoAt(M, x, y)) return false;
  st.dir = moto().dir; st.sella = true; gear = 0; rideDir = null;
  mover = { fx: st.x, fy: st.y, tx: x, ty: y, t0: performance.now(), dur: 200 };
  sfx('scooter');
  return true;
}
/** off the scooter, which stays where it is: he steps onto the free tile in front of him, or beside, or behind */
export function dismount(): boolean {
  if (!st.sella || mover) return false;
  var order: Dir[] = st.dir === 'up' || st.dir === 'down' ? [st.dir, 'left', 'right', st.dir === 'up' ? 'down' : 'up'] : [st.dir, 'down', 'up', st.dir === 'left' ? 'right' : 'left'];
  var d = order.filter(function (o) { var w = DV[o], c = M.cell(st.x + w[0], st.y + w[1]); return !blocked(M, st.x + w[0], st.y + w[1]) && c.deco !== 'ledge' && !M.at[key(st.x + w[0], st.y + w[1])]; })[0];
  if (!d) return false;
  st.moto = { map: M.id, x: st.x, y: st.y, dir: st.dir === 'right' ? 'right' : st.dir === 'left' ? 'left' : st.moto ? st.moto.dir : 'left' };
  st.sella = false; gear = 0;
  mover = { fx: st.x, fy: st.y, tx: st.x + DV[d][0], ty: st.y + DV[d][1], t0: performance.now() };
  st.dir = d;
  sfx('step');
  return true;
}

let held: Dir | null = null, pressedAt = 0, lastBump = '', walking = false;
/** the step in progress, and which foot */
export let mover: Mover | null = null, parity = 0, busy = false;
/** stop walking: a dialogue, a sheet or leaving the map */
export function halt() { held = null; walking = false; auto = []; }
/* a walk along a path (a click on the map): one step after the other, stopped by anything that stops a step */
let auto: Dir[] = [];
export function walkAlong(path: Dir[]) { if (!running || dialog || busy || skyFrom) return; held = null; auto = path.slice(); }
export function walkingAlong(): boolean { return auto.length > 0; }
/** Antonio stands still (a trainer who has seen him walks up to him), and may walk again */
export function lock(on: boolean) { busy = on; if (on) halt(); }
export function press(d: Dir) {
  /* nobody walks while a winged creature shows Formia from above */
  if (!running || dialog || busy || skyFrom) return;
  held = d; pressedAt = performance.now(); auto = [];
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
  /* down from a terrace: over its edge and onto the ground below, in one jump */
  if (d === 'down' && ledgeAt(nx, ny) && !st.sella && !moveMode.swim && !moveMode.climb && !blocked(M, nx, ny + 1)) {
    lastBump = '';
    mover = { fx: st.x, fy: st.y, tx: nx, ty: ny + 1, t0: now, dur: JUMP, jump: true };
    sfx('whoosh');
    parity ^= 1;
    return true;
  }
  if (st.sella && (blocked(M, nx, ny) || !rideable(M, nx, ny))) {
    /* the scooter stops: something in the way, or ground it cannot take */
    gear = 0;
    if (lastBump !== k) { lastBump = k; if (rideHook && !personAtBump(nx, ny)) { held = null; walking = false; rideHook(nx, ny); } }
    return false;
  }
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
  if (st.sella) {
    var rolling = now - lastEnd < 90;
    gear = !rolling ? 0 : d === rideDir ? Math.min(GEARS.length - 1, gear + 1) : Math.max(0, gear - 2);
    rideDir = d; mover.dur = GEARS[gear];
    sfx('moto' + gear);
  } else sfx('step');
  parity ^= 1;
  return true;
}
/** someone stands there: the scooter just waits (no word about where it cannot go) */
function personAtBump(x: number, y: number): boolean { return M.people.some(function (p) { return p.x === x && p.y === y; }); }
export function update(now: number) {
  if (mover) {
    if (now - mover.t0 < (mover.dur || STEP)) return;
    if (mover.jump) sfx('step');
    st.x = mover.tx; st.y = mover.ty; mover = null; lastEnd = now;
    walking = !!held;
    if (arrived()) return;
  }
  if (!held && auto.length && !dialog && !busy && !skyFrom) {
    var d = auto.shift()!;
    st.dir = d;
    if (!tryStep(d, now)) auto = [];
    return;
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
  auto = [];
  busy = true; held = null; walking = false;
  root.classList.add('fade');
  sfx('door');
  /* the scooter does not follow him to another map: it stays parked where he was */
  if (st.sella && to !== M.id) { st.moto = { map: M.id, x: st.x, y: st.y, dir: st.dir === 'right' ? 'right' : 'left' }; st.sella = false; }
  gear = 0;
  setTimeout(function () {
    moveMode.swim = false; moveMode.climb = false;
    st.map = to; st.x = x; st.y = y; if (dir) st.dir = dir;
    setMap(to); if (M.place) placeEntered(); save(); renderHud();
    root.classList.remove('fade');
    busy = false;
  }, reduced ? 0 : 190);
}
