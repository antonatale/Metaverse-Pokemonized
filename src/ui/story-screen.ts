import { CHARS as C, type CharId, type FriendId } from '../data/characters';
import { ITEMS } from '../data/items';
import { MAPS } from '../data/maps';
import type { Building, Dir, LostItem } from '../data/maps/types';
import { COVI, type Covo } from '../data/covi';
import { GATES } from '../data/gates';
import { beaterOf } from '../battle';
import { SPR } from '../render/svg';
import { badgeSVG, itemSVG } from '../render/svg/badges';
import { st, save, resetProgress } from '../save/story-progress';
import { M, setMap, DV, OPP, key, itemAt, allItems, foundItems, areaName, currentArea, personAt, blocked, cityCovi, hasBadge, route, type Person } from '../story/maps';
import { press, release, update, halt, mover, busy, travel } from '../story/movement';
import { RIDES } from '../data/maps/formia';
import type { Sign } from '../data/maps/types';
import { resize, invalidate, drawWorld, preview, overview, townMap } from '../render/world-view';
import { reduced, esc, each, $ } from './dom';
import { setScreen } from './common';
import { offerActivity } from './activities';
import { checkRun, cancelRun } from './run';
import { ACTIVITIES, timesDone, bestOf } from '../story/activities';
import { STOPS, nextStop, stopsDone, heading } from '../story/goals';
import { run } from '../story/run';
import { DAY_MODES, dayMode, setDayMode, sunTimes, darkness, type DayMode } from '../story/daytime';
import { soundButton } from './sound';
import { music, sfx, typeBlip } from '../audio';
import { startBattle, goHome } from './battle-screen';

/* Story mode, the screen: a tile map seen from above. Antonio walks around, talks to people,
   enters the covi and challenges his friends; battles run on the battle screen. */

export interface DialogOpt { label: string; fn: (() => void) | null }
interface Dialog { lines: string[]; i: number; who?: string | null; opts?: DialogOpt[] | null; done?: () => void; typing: boolean; showingOpts: boolean; finish?: () => void }
function tc(id: string) { return 'var(--t-' + C[id as CharId].type.toLowerCase() + ')'; }

/* ---------- DOM ---------- */
export let root: HTMLElement, cv: HTMLCanvasElement, ctx: CanvasRenderingContext2D;
let dlg: HTMLElement, dlgWho: HTMLElement, dlgTxt: HTMLElement, dlgOpts: HTMLElement, built = false;
const ARROW: Record<Dir, string> = { up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', left: 'M15 6l-6 6 6 6', right: 'M9 6l6 6-6 6' };
const DLABEL: Record<Dir, string> = { up: 'Su', down: 'Giù', left: 'Sinistra', right: 'Destra' };
function build() {
  if (built) return;
  root = $('world');
  root.innerHTML =
    '<canvas id="wcv" role="img" aria-label="Mappa della città vista dall\'alto"></canvas>' +
    '<div class="whud"><span class="wplace" id="wplace"></span><span class="wrun" id="wrun" hidden></span><button class="wgoal" type="button" id="wgoal" hidden></button><p class="wtoast" id="wtoast" hidden aria-live="polite"></p><span class="wbadges" id="wbadges"></span>' + soundButton() + '<button class="tb-btn" type="button" id="wmenu">Menu</button></div>' +
    '<div class="dialog wdialog" id="wdialog" hidden role="status" aria-live="polite"><span class="who" id="wwho" hidden></span><span class="txt" id="wtxt"></span><div class="wopts" id="wopts" hidden></div><span class="caret" aria-hidden="true"></span></div>' +
    '<div class="wpad" id="wpad"><div class="dpad" id="dpad" role="group" aria-label="Direzioni">' +
    (['up', 'left', 'right', 'down'] as Dir[]).map(function (d) {
      return '<button type="button" data-d="' + d + '" aria-label="' + DLABEL[d] + '"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ARROW[d] + '"/></svg></button>';
    }).join('') +
    '</div><button class="abtn" type="button" id="wa" aria-label="Parla, leggi o conferma">A</button></div>' +
    '<p class="whint">Frecce o WASD per camminare · Invio per parlare · M per il menu</p>';
  cv = $('wcv') as HTMLCanvasElement; ctx = cv.getContext('2d')!;
  dlg = $('wdialog'); dlgWho = $('wwho'); dlgTxt = $('wtxt'); dlgOpts = $('wopts');
  /* one pointer on the whole cross: sliding the thumb changes direction */
  var dp = $('dpad'), dpId: number | null = null, cur: Dir | null = null;
  var dirFrom = function (e: PointerEvent): Dir | null {
    var r = dp.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (dx * dx + dy * dy < 81) return cur;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
  };
  var setDir = function (d: Dir | null) {
    if (d === cur) return;
    if (cur) release(cur);
    cur = d;
    each(dp.querySelectorAll('button'), function (b) { b.classList.toggle('on', b.getAttribute('data-d') === d); });
    if (d) press(d);
  };
  dp.addEventListener('pointerdown', function (e) { e.preventDefault(); dpId = e.pointerId; try { dp.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } setDir(dirFrom(e)); });
  dp.addEventListener('pointermove', function (e) { if (e.pointerId === dpId) setDir(dirFrom(e)); });
  var end = function (e: PointerEvent) { if (e.pointerId === dpId) { dpId = null; setDir(null); } };
  dp.addEventListener('pointerup', end); dp.addEventListener('pointercancel', end); dp.addEventListener('lostpointercapture', end);
  /* clicks without a pointer (keyboard, screen readers) take one step */
  each(dp.querySelectorAll('button'), function (b) {
    b.addEventListener('click', function (e) { if (e.detail === 0) { var d = b.getAttribute('data-d') as Dir; press(d); release(d); } });
  });
  var wa = $('wa');
  wa.addEventListener('pointerdown', function (e) { e.preventDefault(); interact(); });
  wa.addEventListener('click', function (e) { if (e.detail === 0) interact(); });
  $('wpad').addEventListener('contextmenu', function (e) { e.preventDefault(); });
  dlg.addEventListener('click', function (e) { if ((e.target as Element).closest && (e.target as Element).closest('.wopts')) return; if (dialog) advance(); });
  cv.addEventListener('click', function () { if (dialog) advance(); });
  $('wmenu').addEventListener('click', openMenu);
  $('wgoal').addEventListener('click', openMenu);
  window.addEventListener('resize', resize);
  built = true;
}

/* ---------- HUD ---------- */
var lastPlace = '';
export function renderPlace() {
  var city = MAPS[M.city].name, a = areaName(), k = city + '|' + a;
  if (k === lastPlace) return;
  var first = lastPlace === '';
  lastPlace = k;
  $('wplace').innerHTML = a ? '<small>' + esc(city) + '</small>' + esc(a) : esc(city);
  var ar = currentArea();
  if (ar && ar.note && !first) neighbourhood(ar.name, ar.note);
}
/* walking into a neighbourhood: what it is, for a few seconds (once in a while, not at every step over the border) */
var toastTimer: ReturnType<typeof setTimeout> | undefined, toastSeen: Record<string, number> = {};
function neighbourhood(name: string, note: string) {
  var now = performance.now();
  if (toastSeen[name] && now - toastSeen[name] < 60000) return;
  toastSeen[name] = now;
  var el = $('wtoast');
  el.innerHTML = '<b>' + esc(name) + '</b> ' + esc(note);
  el.hidden = false; el.classList.remove('out');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.add('out'); toastTimer = setTimeout(function () { el.hidden = true; }, 600); }, 5200);
}
/* the next stop of the tour, with an arrow that points to it (or to the door that leads to it) */
var lastGoal = '', goalFlash: ReturnType<typeof setTimeout> | undefined;
const GOAL_ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h13M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GOAL_HERE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor"/><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
export function renderGoal() {
  var el = $('wgoal'), h = heading(M.id);
  if (!h || run) { if (!el.hidden) { el.hidden = true; lastGoal = ''; } return; }
  var dx = h.x - st.x, dy = h.y - st.y, here = Math.abs(dx) + Math.abs(dy) <= 1;
  var turn = here ? -1 : (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8, k = h.stop.id + '|' + turn;
  if (k === lastGoal) return;
  var fresh = lastGoal !== '' && lastGoal.split('|')[0] !== h.stop.id;
  lastGoal = k; el.hidden = false;
  el.innerHTML = '<span class="wgoal-ic"' + (here ? '' : ' style="transform:rotate(' + turn * 45 + 'deg)"') + '>' + (here ? GOAL_HERE : GOAL_ARROW) + '</span>' +
    '<span class="wgoal-t"><small>Prossima tappa</small>' + esc(h.stop.text) + '</span>';
  el.setAttribute('aria-label', 'Prossima tappa: ' + h.stop.text + ', ' + h.stop.where + (here ? ': sei arrivato' : '') + '. Apri il menu');
  if (fresh && !reduced) { el.classList.remove('new'); void el.offsetWidth; el.classList.add('new'); clearTimeout(goalFlash); goalFlash = setTimeout(function () { el.classList.remove('new'); }, 1600); }
}
export function renderHud() {
  lastPlace = ''; renderPlace(); lastGoal = ''; renderGoal();
  $('wbadges').innerHTML = cityCovi(M.city).map(function (cv0) {
    var b = cv0.badge, got = hasBadge(cv0);
    return '<span title="' + esc(b.name + (got ? '' : ' (da conquistare)')) + '">' + badgeSVG({ color: b.color, mark: b.mark, earned: got }, 28) + '</span>';
  }).join('');
}


const KEYMAP: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
function overlayOpen() { var o = $('overlay'); return !!(o && !o.hidden); }
/** the map's keys: registered before the battle's (main.ts), so stopping here keeps the battle keys out of the map */
export function installStoryKeys() {
  document.addEventListener('keydown', function (e) {
    if (!running || overlayOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
    var d = KEYMAP[e.key];
    if (d) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) press(d); return; }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'z' || e.key === 'Z') {
      if (dialog && dialog.showingOpts) return;          /* the focused option button takes it */
      e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) interact();
    } else if (e.key === 'm' || e.key === 'M' || e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); openMenu(); }
  });
  document.addEventListener('keyup', function (e) { var d = KEYMAP[e.key]; if (d) release(d); });
}

/* ---------- talking ---------- */
export let dialog: Dialog | null = null;
let typeTimer: ReturnType<typeof setTimeout> | undefined;
export function say(lines: string | string[], who?: string | null, opts?: DialogOpt[] | null, done?: () => void) {
  halt();
  dialog = { lines: ([] as string[]).concat(lines), i: 0, who: who, opts: opts, done: done, typing: false, showingOpts: false };
  show();
}
function show() {
  var d = dialog!, line = d.lines[d.i];
  dlg.hidden = false;
  if (d.who) {
    var friend = !!C[d.who as CharId];
    dlgWho.hidden = false;
    dlgWho.textContent = friend ? C[d.who as CharId].name : d.who!;
    dlgWho.style.setProperty('--tc', friend ? tc(d.who!) : 'var(--t-none)');
  } else dlgWho.hidden = true;
  dlgOpts.hidden = true; dlgOpts.innerHTML = ''; d.showingOpts = false;
  dlg.classList.remove('wait');
  var full = d.who ? '«' + line + '»' : line, n = 0;
  clearTimeout(typeTimer);
  d.finish = function () {
    d.typing = false; dlgTxt.textContent = full;
    if (d.i === d.lines.length - 1 && d.opts) {
      d.showingOpts = true; dlgOpts.hidden = false;
      dlgOpts.innerHTML = d.opts.map(function (o, k) { return '<button class="btn' + (k === 0 ? ' primary' : '') + '" type="button" data-k="' + k + '">' + esc(o.label) + '</button>'; }).join('');
      each(dlgOpts.querySelectorAll('button'), function (b) {
        b.addEventListener('click', function () { if (dialog === d) closeDialog(d.opts![+b.getAttribute('data-k')!].fn); });
      });
      var first = dlgOpts.querySelector('button'); if (first) first.focus();
    } else dlg.classList.add('wait');
  };
  if (reduced) { d.finish(); return; }
  d.typing = true; dlgTxt.textContent = '';
  (function step() {
    if (dialog !== d || !d.typing) return;
    n += 2; dlgTxt.textContent = full.slice(0, n); typeBlip(!!d.who);
    if (n >= full.length) d.finish(); else typeTimer = setTimeout(step, 20);
  })();
}
function advance() {
  var d = dialog;
  if (!d) return;
  if (d.typing) { clearTimeout(typeTimer); d.finish!(); return; }
  if (d.showingOpts) return;
  if (d.i < d.lines.length - 1) { d.i++; show(); return; }
  closeDialog();
}
function closeDialog(next?: (() => void) | null) {
  var d = dialog; dialog = null;
  clearTimeout(typeTimer);
  dlg.hidden = true; dlgOpts.hidden = true; dlgOpts.innerHTML = ''; dlg.classList.remove('wait');
  var fn = next || (d && d.done);
  if (fn) setTimeout(fn, 30);
}
function interact() {
  if (dialog) { advance(); return; }
  if (!running || mover || busy) return;
  var v = DV[st.dir], x = st.x + v[0], y = st.y + v[1];
  var p = personAt(M, x, y);
  if (!p && M.cell(x, y).reach) p = personAt(M, x + v[0], y + v[1]);   /* across a net or a counter */
  if (p) { talkTo(p); return; }
  var it = itemAt(M, x, y);
  if (it) { pickUp(it); return; }
  var a = M.at[key(x, y)];
  if (a && a.kind === 'sign') { if (a.s.ride) ride(a.s); else if (a.s.sleep) sleep(a.s); else say(a.s.text); }
  else if (a && a.kind === 'door') useDoor(a.b);
}
/* one of Antonio's lost things: picked up for good */
/* ---------- the bed at home: at night, sleep until the morning; by day, a nap until the evening ---------- */
function sleep(s: Sign) {
  var night = darkness(new Date()) > 0.3;
  say(s.text.concat([night ? 'Si è fatto tardi. Dormi fino a domattina?' : 'Fuori c\'è il sole. Un pisolino fino a stasera?']), null, [
    { label: night ? 'Dormo fino a domattina' : 'Pisolino fino a stasera', fn: function () {
      root.classList.add('sleep');
      say(['Zzz…'], null, null, function () {
        setDayMode(night ? 'giorno' : 'notte');
        root.classList.remove('sleep');
        say(night ? ['Buongiorno! Dalla finestra entra il sole: a Formia è mattina.', 'Fuori i lampioni sono spenti.'] : ['Si è fatta sera.', 'Fuori si accendono i lampioni.']);
      });
    } },
    { label: 'Non ho sonno', fn: null }
  ]);
}
/* ---------- the scooter: from one of its parking spots to another ---------- */
function ride(s: Sign) {
  var here = RIDES.find(function (r) { return r.at[0] === s.x && r.at[1] === s.y; });
  var opts: DialogOpt[] = RIDES.filter(function (r) { return r !== here; }).map(function (r) {
    return { label: r.name, fn: function () {
      /* off next to the scooter where it is parked there */
      var to = ([[0, 1], [1, 0], [-1, 0], [0, -1]] as [number, number][]).map(function (d) { return [r.at[0] + d[0], r.at[1] + d[1]] as [number, number]; })
        .find(function (p) { return !blocked(M, p[0], p[1]) && !M.at[key(p[0], p[1])]; });
      if (!to) return;
      sfx('scooter');
      travel(M.id, to[0], to[1], 'down');
    } };
  });
  opts.push({ label: 'Resto qui', fn: null });
  say(['Il motorino. Dove andiamo?'], null, opts);
}
function pickUp(it: LostItem) {
  sfx('pickup');
  st.found[it.id] = true; save();
  var left = allItems().length - foundItems().length;
  say(['Hai ritrovato ' + ITEMS[it.move].name + '!', it.text,
    left ? 'Nelle lotte della Storia Antonio non ' + it.pron + ' perde più. ' + (left === 1 ? 'Ne manca ancora uno.' : 'Ne mancano ancora ' + left + '.')
      : 'Hai ritrovato tutto: nelle lotte della Storia Antonio non perde più niente.']);
}
function talkTo(p: Person) {
  p.dir = OPP[st.dir];
  var n = p.n;
  if (n.covo) leaderTalk(n.covo);
  else if (n.gate) gateTalk(n.gate, n.name);
  else if (n.activity) offerActivity(n);
  else if (n.hint) say((n.lines || []).concat(nextStop().tip), n.name);
  else say(n.lines || ['…'], n.name);
}
export function useDoor(b: Building) {
  if (b.gate) gateTalk(b.gate);
  else if (b.msg) say(b.msg);
}
function gateTalk(g: string, who?: string) {
  var G0 = GATES[g], need = cityCovi(G0.city), have = need.filter(hasBadge).length, city = MAPS[G0.city].name;
  if (have < need.length) say([G0.label + ' parte quando hai tutte le spille di ' + city + '.', 'Ne hai ' + have + ' su ' + need.length + '.'], who);
  else say(['Hai tutte le spille di ' + city + '!', G0.label + ' arriva con il prossimo aggiornamento del gioco.'], who);
}

/* ---------- covi ---------- */
function leaderTalk(id: string) {
  var cv0 = COVI[id];
  if (st.beaten[id]) { say(cv0.after, cv0.leader); return; }
  say(cv0.intro, cv0.leader, [{ label: 'Sfida!', fn: function () { challenge(id); } }, { label: 'Più tardi', fn: null }]);
}
function challenge(id: string) {
  var cv0 = COVI[id], squad = st.squad.filter(function (x) { return x !== cv0.leader; });
  var safe = foundItems().map(function (it) { return it.move; });
  var go = function (who: FriendId) { hide(); startBattle({ a: who, b: cv0.leader, mode: 'cpu', story: { covo: id }, safe: safe }); };
  if (squad.length <= 1) go(squad[0] || 'antonio'); else pickFighter(squad, cv0, go);
}
export function sheet(html: string, cls?: string) {
  var o = $('overlay');
  o.className = 'overlay' + (cls ? ' ' + cls : ''); o.innerHTML = html; o.hidden = false;
  halt();
  return o;
}
export function closeSheet() { var o = $('overlay'); o.hidden = true; o.innerHTML = ''; o.className = 'overlay'; }
function face(id: string) { return SPR.person(id, 'smirk', '', SPR.thumb(id)); }
function pickFighter(squad: FriendId[], cv0: Covo, go: (who: FriendId) => void) {
  var L = C[cv0.leader], best = beaterOf(L.type);
  var o = sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pf-t"><div class="sheet-h"><h2 id="pf-t">Chi mandi in campo?</h2><button class="tb-btn" type="button" id="pf-x">Annulla</button></div>' +
    '<p class="hint">' + esc(L.name) + ' è di tipo ' + esc(L.type) + ': ha il vantaggio chi è di tipo ' + esc(best) + '.</p><div class="pickgrid">' +
    squad.map(function (id) {
      return '<button class="pick" type="button" data-id="' + id + '" style="--tc:' + tc(id) + '"><span class="face">' + face(id) + '</span><span>' + esc(C[id].name) + '</span>' +
        (C[id].type === best ? '<small class="adv">Vantaggio</small>' : '') + '</button>';
    }).join('') + '</div></div>');
  $('pf-x').addEventListener('click', closeSheet);
  each(o.querySelectorAll('.pick'), function (b) { b.addEventListener('click', function () { closeSheet(); go(b.getAttribute('data-id') as FriendId); }); });
  setTimeout(function () { var b = o.querySelector<HTMLElement>('.pick'); if (b) b.focus(); }, 30);
}
/** called by the battle screen when a story battle ends */
export function afterBattle(res: { covo: string; won: boolean; quit: boolean }) {
  open(true);
  var cv0 = COVI[res.covo];
  if (!cv0) return;
  if (res.quit) { say(['Hai lasciato la lotta a metà. Puoi riprovare quando vuoi.']); return; }
  if (res.won && !st.beaten[res.covo]) {
    st.beaten[res.covo] = true;
    if (!hasBadge(cv0)) st.badges.push(cv0.badge.id);
    if (st.squad.indexOf(cv0.leader) < 0) st.squad.push(cv0.leader);
    save(); renderHud();
    say(cv0.win, cv0.leader, null, function () { award(cv0); });
  } else if (res.won) say(cv0.after, cv0.leader);
  else say(cv0.lose, cv0.leader);
}
function award(cv0: Covo) {
  sfx('badge');
  var b = cv0.badge, L = C[cv0.leader];
  sheet('<div class="award" role="dialog" aria-modal="true" aria-labelledby="aw-t" style="--tc:' + tc(cv0.leader) + '">' +
    '<div class="award-badge">' + badgeSVG({ color: b.color, mark: b.mark }, 104) + '</div>' +
    '<h2 id="aw-t">Hai conquistato la ' + esc(b.name) + '</h2>' +
    '<div class="award-face">' + face(cv0.leader) + '</div>' +
    '<p>' + esc(L.name) + ' entra nella compagnia: da ora puoi mandarlo in campo nelle sfide.</p>' +
    '<button class="btn primary" type="button" id="aw-ok">Continua</button></div>', 'result');
  $('aw-ok').addEventListener('click', function () {
    closeSheet();
    if (cityCovi(cv0.city).every(hasBadge)) say(['Hai tutte le spille di ' + MAPS[cv0.city].name + '!', 'Il treno per Torino arriva con il prossimo aggiornamento del gioco.']);
  });
  setTimeout(function () { var bt = $('aw-ok'); if (bt) bt.focus(); }, 30);
}

/* ---------- menu ---------- */
/** what the hour of Formia follows: the sun of today, or the choice in the menu */
function hourHint() {
  if (dayMode !== 'auto') return 'L\'ora resta questa finché non la cambi qui, o dormendo nel letto di casa. Dentro casa, da Morgana e al circolo le luci sono sempre accese.';
  var t = sunTimes(new Date()), hm = function (h: number) { var m = Math.round(h * 60); return Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0'); };
  return 'Come fuori: oggi a Formia il sole sorge alle ' + hm(t[0]) + ' e tramonta alle ' + hm(t[1]) + '. Di sera si accendono i lampioni.';
}
function openMenu() {
  if (!running || dialog || busy) return;
  var city = M.city;
  var badges = cityCovi(city).map(function (cv0) {
    var b = cv0.badge, got = hasBadge(cv0);
    return '<li class="' + (got ? 'got' : '') + '">' + badgeSVG({ color: b.color, mark: b.mark, earned: got }, 40) +
      '<span><b>' + esc(b.name) + '</b><small>' + esc(cv0.name) + ' · ' + esc(C[cv0.leader].name) + (got ? '' : ' · da conquistare') + '</small></span></li>';
  }).join('');
  sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="wm-t"><div class="sheet-h"><h2 id="wm-t">Storia · ' + esc(MAPS[city].name) + '</h2><button class="tb-btn" type="button" id="wm-x">Chiudi</button></div>' +
    '<div class="pickrow"><h3>Formia</h3><div class="townmap" id="wm-map"></div></div>' +
    '<div class="pickrow"><h3>Ora del giorno</h3><div class="seg seg4" role="group" aria-label="Ora del giorno">' + DAY_MODES.map(function (m) {
      return '<button type="button" data-ora="' + m.id + '" aria-pressed="' + (m.id === dayMode) + '">' + esc(m.label) + '</button>';
    }).join('') + '</div><p class="hint" id="wm-ora">' + esc(hourHint()) + '</p></div>' +
    '<div class="pickrow"><h3>Giro di Formia · ' + stopsDone() + ' su ' + (STOPS.length - 1) + '</h3><ul class="wbadge-list diary tour">' + STOPS.map(function (s0) {
      var done = s0.done(), next = s0 === nextStop();
      return '<li class="' + (done ? 'got' : next ? 'next' : '') + '"><span class="diary-n" aria-hidden="true">' + (done ? '✓' : next ? '➜' : '·') + '</span><span><b>' + esc(s0.text) + '</b><small>' +
        esc(s0.where + (done ? ' · fatto' : next ? ' · prossima tappa' : '')) + '</small></span></li>';
    }).join('') + '</ul></div>' +
      '<div class="pickrow"><h3>Compagnia</h3><div class="pickgrid">' + st.squad.map(function (id) {
      return '<div class="pick" style="--tc:' + tc(id) + '"><span class="face">' + face(id) + '</span><span>' + esc(C[id].name) + '</span></div>';
    }).join('') + '</div></div>' +
    '<div class="pickrow"><h3>Spille</h3><ul class="wbadge-list">' + badges + '</ul></div>' +
    '<div class="pickrow"><h3>Oggetti ritrovati · ' + foundItems().length + ' su ' + allItems().length + '</h3><ul class="wbadge-list">' + allItems().map(function (it) {
      var got = !!st.found[it.id], nm = ITEMS[it.move].name;
      return '<li class="' + (got ? 'got' : '') + '">' + itemSVG(ITEMS[it.move].icon, got, 40) + '<span><b>' + esc(nm.charAt(0).toUpperCase() + nm.slice(1)) + '</b><small>' +
        esc(got ? it.text + ' Nelle lotte della Storia non si perde più.' : 'Perso da qualche parte in città.') + '</small></span></li>';
    }).join('') + '</ul></div>' +
    '<div class="pickrow"><h3>Diario di Formia</h3><ul class="wbadge-list diary">' + ACTIVITIES.map(function (a) {
      var n = timesDone(a.id), b = bestOf(a.id);
      return '<li class="' + (n ? 'got' : '') + '"><span class="diary-n" aria-hidden="true">' + (n ? n + '×' : '·') + '</span><span><b>' + esc(a.name) + '</b><small>' +
        esc(a.where + (n ? ' · fatto ' + (n === 1 ? 'una volta' : n + ' volte') + (b != null && a.score ? ' · record ' + a.score(b) : '') : ' · ancora da fare')) + '</small></span></li>';
    }).join('') + '</ul></div>' +
    '<p class="hint">I progressi della storia restano su questo dispositivo.</p>' +
    '<div class="menu-actions"><button class="btn" type="button" id="wm-home">Torna alla schermata iniziale</button>' +
    '<button class="btn" type="button" id="wm-reset">Ricomincia la storia</button></div></div>');
  townMap($('wm-map'));
  each(document.querySelectorAll('[data-ora]'), function (b) {
    b.addEventListener('click', function () {
      setDayMode(b.getAttribute('data-ora') as DayMode);
      each(document.querySelectorAll('[data-ora]'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      $('wm-ora').textContent = hourHint();
    });
  });
  $('wm-x').addEventListener('click', closeSheet);
  $('wm-home').addEventListener('click', function () { closeSheet(); hide(); goHome(); });
  var r = $('wm-reset'), armed = false;
  r.addEventListener('click', function () {
    if (!armed) { armed = true; r.textContent = 'Tocca ancora: cancella spille, compagnia e oggetti'; r.classList.add('danger'); return; }
    closeSheet();
    resetProgress(); save();
    setMap(st.map); renderHud(); intro();
  });
  setTimeout(function () { var b = $('wm-x'); if (b) b.focus(); }, 30);
}


/* ---------- loop ---------- */
export let running = false;
let raf = 0;
function frame(now: number) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  update(now);
  checkRun(now);
  renderGoal();
  drawWorld(now);
}
function start() { if (running) return; running = true; raf = requestAnimationFrame(frame); }
function stop() { running = false; cancelAnimationFrame(raf); halt(); }
function hide() { stop(); cancelRun(); if (dialog) closeDialog(function () {}); if (root) { root.hidden = true; $('wtoast').hidden = true; } document.body.classList.remove('in-world'); }

function intro() {
  st.seen.intro = true; save();
  say(['Formia, casa: Parco la Fontana, in via Amendola. Da qui parte il viaggio: Formia, poi Torino, poi Chicago.',
    'In città ci sono due covi: Costanzo fa comizi in piazza della Vittoria, Forchetta gioca nei campi coperti del Bruno Zauli.',
    'Sfida gli amici nei loro covi: chi batti ti dà la sua spilla ed entra nella compagnia.',
    'E poi c\'è la Formia di tutti i giorni: l\'Eclipse a Vindicio, la pineta, una serata da Morgana. Il motorino è parcheggiato sotto casa.',
    'E occhio: Antonio ha perso quattro cose in giro per Formia. Ritrovale e nelle lotte non le perderà più.',
    'Se non sai dove andare, in alto c\'è la prossima tappa del giro di Formia: segui la freccia.']);
}

function open(quiet?: boolean) {
  build();
  ['home', 'battle'].forEach(function (id) { var el = $(id); if (el) el.hidden = true; });
  document.body.classList.remove('in-battle'); document.body.classList.add('in-world');
  root.hidden = false;
  window.scrollTo(0, 0);
  setScreen('world');
  setMap(st.map);
  resize(); renderHud();
  music('world');
  var go = function () {
    invalidate(); start();
    if (!quiet && !st.seen.intro) intro();
  };
  if (document.fonts && document.fonts.load) {
    var done = false, t = setTimeout(function () { if (!done) { done = true; go(); } }, 900);
    Promise.all([document.fonts.load('16px "Lilita One"'), document.fonts.load('16px "Patrick Hand"')])
      .catch(function () {}).then(function () { if (!done) { done = true; clearTimeout(t); go(); } });
  } else go();
}


/** the story mode as one object, with the same names the old window.WORLD had */
export const WORLD = {
  open: open, close: hide, afterBattle: afterBattle, preview: preview,
  summary: function () {
    return {
      started: !!(st.seen.intro || st.badges.length), squad: st.squad.slice(), found: foundItems().length, items: allItems().length,
      badges: cityCovi('formia').map(function (cv0) { return { name: cv0.badge.name, color: cv0.badge.color, mark: cv0.badge.mark, earned: hasBadge(cv0) }; })
    };
  },
  state: function () { return JSON.parse(JSON.stringify(st)); },
  _debug: {
    route: route,
    /* where to stand, and which way to face, to talk to a person, read a sign, use a door or pick up a thing */
    spot: function (kind: string, id: string) {
      var t: number[] | null = null, list: { x: number; y: number; door?: number[] }[];
      if (kind === 'npc') { list = M.people.filter(function (q) { return q.n.id === id; }); if (list[0]) t = [list[0].x, list[0].y]; }
      else if (kind === 'item') { list = M.items.filter(function (q) { return q.id === id; }); if (list[0]) t = [list[0].x, list[0].y]; }
      else if (kind === 'door') { list = (M.buildings || []).filter(function (q) { return q.id === id; }); if (list[0]) t = list[0].door!; }
      else if (kind === 'sign') { list = (M.signs || []).filter(function (q) { return q.text.join(' ').indexOf(id) >= 0; }); if (list[0]) t = [list[0].x, list[0].y]; }
      if (!t) return null;
      var best: { x: number; y: number; dir: Dir; len: number } | null = null;
      (['up', 'down', 'left', 'right'] as Dir[]).forEach(function (d) {
        for (var k = 1; k <= 2; k++) {
          var cx = t![0] - DV[d][0] * k, cy = t![1] - DV[d][1] * k;
          if (k === 2 && !M.cell(t![0] - DV[d][0], t![1] - DV[d][1]).reach) break;
          var here = cx === st.x && cy === st.y;
          if (!here && (blocked(M, cx, cy) || M.at[key(cx, cy)])) continue;
          var r = here ? [] : route(cx, cy);
          if (r && (!best || r.length < best.len)) best = { x: cx, y: cy, dir: d, len: r.length };
        }
      });
      return best;
    },
    area: function () { return areaName(); },
    overview: overview,
    pos: function () { return { map: st.map, x: st.x, y: st.y, dir: st.dir, running: running, moving: !!mover, busy: busy, dialog: !!dialog, opts: !!(dialog && dialog.showingOpts), text: dialog ? dlgTxt.textContent : '' }; }
  }
};
