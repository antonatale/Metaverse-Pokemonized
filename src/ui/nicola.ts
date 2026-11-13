import { st, save } from '../save/story-progress';
import { M, moveMode } from '../story/maps';
import { vanGo, vanStop, vanSkip, van, walkAlong, walkingAlong } from '../story/movement';
import { roadPath, nearRoad, backAlong, outOf, dirOf, type Tile } from '../story/van';
import { PICKUP, RIDE_TALK, ON_THE_WAY, SEA_TIPS, RIDES, RIDE, WALK, type Ride } from '../data/nicola';
import { FORMIA_SPOT } from '../data/maps/formia-ground';
import { notify } from './story-screen';
import { MAPS } from '../data/maps';
import type { Npc } from '../data/maps/types';
import { FORMIA_AT } from '../data/maps/formia-ground';
import { say, renderHud, renderPlace, root, type DialogOpt } from './story-screen';
import { startActivity } from './activities';
import { activity } from '../story/activities';
import { areaName, route } from '../story/maps';
import { sfx } from '../audio';
import { esc } from './dom';

/* Nicola Spadea and his van (data/nicola.ts). At the start of every story he comes up the player's street: the
   guardaparco of Gianola is waiting, and Gianola is reached by sea, so he drives them to the Eclipse, where his
   windsurfs are, telling what Formia is on the way; there he shows Faro, his Delfaro, lends the windsurf, and sails
   with them to Gianola. After that: Nicola walking with the player when asked (render/world-view.ts companion), what
   he says on the way, and a lift in the van across Formia, along the streets, whenever the player wants one. */

export const NICOLA = 'Nicola Spadea';
/** his place on the map, at the Eclipse, for the windsurf lesson */
const npcOf = (): Npc => (MAPS.formia.npcs || []).find(function (n) { return n.id === 'nicola'; })!;
/** how long a tile takes: a long drive goes quicker, so that no drive lasts more than about nine seconds */
const pace = (n: number) => Math.max(26, Math.min(70, 9000 / Math.max(1, n)));

/* ---------- the button that skips a drive ---------- */
var skipBtn: HTMLButtonElement | null = null;
function skipOn() {
  skipOff();
  skipBtn = document.createElement('button');
  skipBtn.type = 'button'; skipBtn.className = 'btn small van-skip'; skipBtn.textContent = RIDE.skip;
  skipBtn.addEventListener('click', function () { sfx('click'); vanSkip(); });
  root.appendChild(skipBtn);
}
function skipOff() { if (skipBtn) { skipBtn.remove(); skipBtn = null; } }
window.addEventListener('keydown', function (e) { if (van && van.carry && (e.key === 'Escape' || e.key === ' ')) { e.preventDefault(); vanSkip(); } });

/** the van comes up the street to the tile `at` (from where it is parked, if it is near, or from further down the
    road), and stops; then `then` */
function comeTo(at: Tile, then: () => void) {
  var v = st.van, from: Tile = v && v.map === M.id && Math.abs(v.x - at[0]) + Math.abs(v.y - at[1]) < 30 ? [v.x, v.y] : backAlong(M, at, 14);
  st.van = undefined;
  var path = roadPath(M, from, at);
  if (!path || !path.length) { then(); return; }
  vanGo(from, path, false, 70, function () { vanStop(); sfx('horn'); then(); });
}
/* ---------- what Nicola says while he drives: a line at a time, under the van, as the way goes by ---------- */
var talkEl: HTMLElement | null = null, talkT = 0;
function talkOn(lines: [number, string][]) {
  talkOff();
  talkEl = document.createElement('div'); talkEl.className = 'van-talk'; talkEl.hidden = true;
  root.appendChild(talkEl);
  var next = 0;
  talkT = window.setInterval(function () {
    if (!van || !talkEl) return;
    var gone = van.path.length ? van.i / van.path.length : 1;
    if (next < lines.length && gone >= lines[next][0]) {
      talkEl.innerHTML = '<b>' + esc(NICOLA) + '</b><span>«' + esc(lines[next][1]) + '»</span>';
      talkEl.hidden = false; talkEl.classList.remove('in'); void talkEl.offsetWidth; talkEl.classList.add('in');
      next++;
    }
  }, 150);
}
function talkOff() { if (talkT) { clearInterval(talkT); talkT = 0; } if (talkEl) { talkEl.remove(); talkEl = null; } }
/** the player gets in at `at` and is driven to `to`; out on the side of `toward`. With `talk`, Nicola tells things
    on the way, and the van goes slowly enough for them to be read */
function driveTo(at: Tile, to: Tile, toward: Tile, then: () => void, talk?: [number, string][]) {
  var path = roadPath(M, at, to);
  if (!path) { park(at, 'left'); say(RIDE.none, NICOLA, null, then); return; }
  sfx('door');
  skipOn();
  /* a talk of N lines wants about six seconds a line; no drive is slower than a tile in 240 ms */
  var base = talk ? Math.max(95, Math.min(240, talk.length * 6200 / path.length)) : pace(path.length);
  if (talk) talkOn(talk);
  vanGo(at, path, true, base, function () {
    var last = van!.dir;
    vanStop(); skipOff(); talkOff();
    park(to, last);
    var out = outOf(M, to, toward) || to;
    var dx = toward[0] - out[0], dy = toward[1] - out[1];
    st.x = out[0]; st.y = out[1]; st.dir = Math.abs(dx) >= Math.abs(dy) ? dirOf(dx, 0) : dirOf(0, dy);
    st.companion = 'nicola';
    save(); renderHud(); renderPlace();
    sfx('door');
    then();
  });
}
function park(t: Tile, dir: 'left' | 'right' | 'up' | 'down') { st.van = { map: M.id, x: t[0], y: t[1], dir: dir }; save(); }

/** the start of a story: the van comes up the player's street, Nicola calls and drives them to the Eclipse, telling
    Formia on the way; there he shows Faro and lends the windsurf, and they sail together to Gianola */
export function vanStart(then?: () => void) {
  var done = then || function () { /* nothing */ };
  if (M.id !== 'formia' || M.inside) { done(); return; }
  var at = nearRoad(M, st.x, st.y, 12, true), ec = FORMIA_AT.eclipse.door!, end = nearRoad(M, ec[0], ec[1], 16);
  if (!at || !end) { done(); return; }
  say(PICKUP.come, null, null, function () {
    comeTo(at!, function () {
      park(at!, 'left');
      say(PICKUP.hello, NICOLA, [{ label: PICKUP.board, fn: function () {
        st.van = undefined;
        driveTo(at!, end!, [ec[0], ec[1] + 2], function () {
          say(PICKUP.arrive, NICOLA, null, function () {
            /* down to the water, where Faro is playing */
            walkTo(FORMIA_SPOT['riva-eclipse'], function () {
              st.dir = 'down'; renderPlace();
              say(PICKUP.faro, NICOLA, null, function () {
                say(PICKUP.lend, NICOLA, [{ label: PICKUP.go, fn: function () { windsurfStart(); done(); } }]);
              });
            });
          });
        }, RIDE_TALK);
      } }]);
    });
  });
}
/** the player walks by themselves to a tile (Nicola behind), then `then`; straight on if there is no way */
function walkTo(t: Tile, then: () => void) {
  window.setTimeout(function () {
    var r = route(t[0], t[1]);
    if (!r || !r.length) { then(); return; }
    walkAlong(r);
    var waited = 0, k = window.setInterval(function () {
      waited += 100;
      if (walkingAlong() && waited < 9000) return;
      clearInterval(k); then();
    }, 100);
  }, 60);
}
/** the windsurf goes in the water in front of the Eclipse, and the player on it; Nicola on his own, beside */
function windsurfStart() {
  var t = FORMIA_SPOT['start-windsurf'];
  st.seen.tavola = true; st.seen['ws-start'] = true; st.companion = 'nicola';
  st.x = t[0]; st.y = t[1]; st.dir = 'right';
  moveMode.swim = true; moveMode.board = true;
  sfx('whoosh');
  save(); renderHud(); renderPlace();
}
/** back on land after the windsurf of the start: at Gianola Nicola says goodbye and sails back to the Eclipse;
    anywhere else, he says Gianola is further on. Called at every step (story-screen) */
var lastEarly = '';
export function windsurfLanded() {
  if (!st.seen['ws-start'] || st.seen['ws-landed'] || moveMode.swim || M.id !== 'formia' || M.inside) return;
  if (areaName() === 'Gianola') {
    st.seen['ws-landed'] = true; save();
    say(PICKUP.landed, NICOLA, null, function () { st.companion = undefined; save(); });
    return;
  }
  if (st.companion === 'nicola' && lastEarly !== areaName()) { lastEarly = areaName(); notify('<b>Nicola</b> «' + esc(PICKUP.early) + '»'); }
}
/** a lift in the van to one of the places of RIDES */
function ride(r: Ride) {
  if (M.id !== 'formia' || M.inside || moveMode.swim || st.sella) { say(RIDE.none, NICOLA); return; }
  var at = nearRoad(M, st.x, st.y, 10, true), to = nearRoad(M, r.at[0], r.at[1], 20);
  if (!at || !to) { say(RIDE.none, NICOLA); return; }
  var v = st.van;
  /* the van parked a few steps away: they walk to it */
  if (v && v.map === M.id && Math.abs(v.x - st.x) + Math.abs(v.y - st.y) <= 5) at = [v.x, v.y];
  var go = function () { st.van = undefined; driveTo(at!, to!, r.at, function () { say(RIDE.here, NICOLA); }); };
  if (v && v.map === M.id && v.x === at[0] && v.y === at[1]) { go(); return; }
  say(RIDE.far, NICOLA, null, function () { comeTo(at!, function () { park(at!, 'left'); go(); }); });
}
function rideMenu() {
  var here = areaName();
  var opts: DialogOpt[] = RIDES.filter(function (r) { return r.id !== 'eclipse' || here !== 'Vindicio'; }).map(function (r) { return { label: r.label, fn: function () { ride(r); } }; });
  say(RIDE.ask, NICOLA, opts.concat([{ label: 'Niente, grazie', fn: null }]));
}
/** the beaches and the sea, one tip at a time, in turn */
var tipK = 0;
function seaTip() {
  var ok = SEA_TIPS.filter(function (t) { return !t.after || st.seen[t.after]; });
  say(ok[tipK++ % ok.length].say, NICOLA);
}
/** talking to him while he walks with the player */
export function companionTalk() {
  var hi = WALK.hi[Math.floor(Date.now() / 7000) % WALK.hi.length], opts: DialogOpt[] = [{ label: WALK.ride, fn: rideMenu }, { label: WALK.sea, fn: seaTip }];
  if (areaName() === 'Vindicio') opts.unshift({ label: WALK.lesson, fn: function () { startActivity('windsurf', npcOf()); } });
  opts.push({ label: WALK.leave, fn: function () { st.companion = undefined; save(); say(WALK.bye, NICOLA); } });
  opts.push({ label: 'Niente', fn: null });
  say([hi], NICOLA, opts);
}
/** talking to him at the Eclipse, when he is not walking with the player */
export function nicolaTalk(n: Npc) {
  var a = activity(n.activity || 'windsurf');
  say(n.lines || ['…'], NICOLA, [
    { label: a.verb, fn: function () { startActivity(a.id, n); } },
    { label: WALK.come, fn: function () { st.companion = 'nicola'; save(); say(WALK.join, NICOLA); } },
    { label: WALK.ride, fn: function () { st.companion = 'nicola'; save(); rideMenu(); } },
    { label: 'Più tardi', fn: null }
  ]);
}
/** walking into a part of Formia with him: what he knows of it, now and then */
var told: Record<string, number> = {};
export function onTheWay(area: string): string | null {
  if (st.companion !== 'nicola' || !ON_THE_WAY[area]) return null;
  var now = Date.now();
  if (told[area] && now - told[area] < 600000) return null;
  told[area] = now;
  return '<b>Nicola</b> «' + esc(ON_THE_WAY[area]) + '»';
}
