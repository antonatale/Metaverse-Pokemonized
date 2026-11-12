import { magicBeats } from '../data/types';
import { crewAt } from '../story/covo-crew';
import { speedChoice } from './speed';
import { gfxChoice } from './gfx';
import { CHARS as C, type CharId, type FriendId } from '../data/characters';
import { ITEMS } from '../data/items';
import { MAPS } from '../data/maps';
import type { Building, Dir, LostItem, Npc } from '../data/maps/types';
import { COVI, type Covo } from '../data/covi';
import { gateFor } from '../data/gates';
import { trainTrip } from './train';
import { SPR } from '../render/svg';
import { badgeSVG, itemSVG } from '../render/svg/badges';
import { st, save, resetProgress, onSaveFail } from '../save/story-progress';
import { M, setMap, DV, OPP, key, itemAt, allItems, foundItems, areaName, currentArea, personAt, blocked, cityCovi, covoLevel, covoPins, hasBadge, route, moveMode, treasureAt, present, walkPath, walkAway, isShallow, isWall, motoAt, moto, type Person } from '../story/maps';
import { press, release, update, halt, mover, busy, travel, setPace, onEdge, onPlace, stepNow, lock, STEP, walkAlong, walkingAlong, mount, dismount, onRideStop } from '../story/movement';
import { placeProof } from '../story/place-run';
import { teamOf, trainerLine, trainerNow, shieldNow } from '../story/rival';
import type { Sign } from '../data/maps/types';
import { resize, invalidate, drawWorld, preview, overview, townMap, followerAt, tileAt, screenOf } from '../render/world-view';
import { reduced, esc, each, $ } from './dom';
import { setScreen } from './common';
import { offerActivity, startActivity } from './activities';
import { checkRun, cancelRun } from './run';
import { ACTIVITIES, activity, timesDone, bestOf, record } from '../story/activities';
import { TOURNEY, roundsOf } from '../data/tourney';
import { myStops, nextStop, stopsDone, heading } from '../story/goals';
import { run } from '../story/run';
import { DAY_MODES, dayMode, setDayMode, sunTimes, darkness, type DayMode } from '../story/daytime';
import { SPECIES, isSpecies, type SpeciesId } from '../data/creatures';
import { HIDINGS, RATE, CALM, pickMeet, wildLevel, type Hiding } from '../data/encounters';
import { SHOPS, WARES, HELD_IDS, meetChance, luck, lastStand, coins, moneyFor } from '../data/growth';
import { TRAINERS } from '../data/trainers';
import { sceneFor, PLACE_MAGIC } from '../data/scenes';
import { CICERO, OPENING, advice, chapterNow, tipOnce } from '../story/mentor';
import { cicero, mamurra } from '../render/svg/cicero';
import { plotTalk, plotSign, plotAfter, plotBefore, stonesHtml, missionsHtml, legendWay, legendEnd, legendPact, askPending } from './plot';
import { JOIN, LIVES } from '../data/people';
import { endFlag, legendOf, legendOver, pactOpen, stagesNow, stonesKept } from '../story/choices';
import { epilogue } from '../story/epilogue';
import { LEGENDS, type LegendStage } from '../data/legends';
import { MAMURRA, storyStage, flag, linesNow } from '../story/plot';
import { idOf, sideOf, formNow, gainXp, heroText, foeSide, fightPay, battleBag, keepBag, addCreature, teamRef, hasStarter, money, leadCreature, creatureOf, nameOf, level, see, earn, hearts, addBond, teamMons, firstHuman, progress, powerOf, dexPrizesDue, nextDexPrize, takeDexPrize, prizeText, dexHad } from '../story/growth';
import { coin } from './icons';
import { chooseStarter, pickFighter, rewards, rewardsAll, openShop, teamHtml, wireTeam, dexHtml, openHome, portrait, tcOf, growthSay } from './team';
import { onReward } from '../story/activities';
import type { Growth } from '../story/growth';
import type { Bout, Member, StoryTag } from '../battle';
import { wildGone, wildNow, hidingAt } from '../story/maps';
import { soundButton } from './sound';
import { music, worldMusic, settle, sfx, typeBlip, type TuneWait } from '../audio';
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
    '<div class="wframe" aria-hidden="true"></div>' +
    '<div class="whud"><span class="wplace" id="wplace"></span><span class="wrun" id="wrun" hidden></span><button class="wgoal" type="button" id="wgoal" hidden></button><p class="wtoast" id="wtoast" hidden aria-live="polite"></p><span class="wmoney" id="wmoney" title="I sesterzi di Antonio"></span><span class="wbadges" id="wbadges"></span>' + soundButton() + '<button class="tb-btn" type="button" id="wmenu">Menu</button></div>' +
    '<div class="wbars" id="wbars" role="group" aria-label="Livelli"></div>' +
    '<button class="wcic" type="button" id="wcic" hidden aria-label="Chiedi a Cicerone (tasto C)" title="Chiedi a Cicerone (C)">' + cicero() + '</button><p class="wcic-say" id="wcic-say" hidden aria-live="polite"></p>' +
    '<div class="dialog wdialog" id="wdialog" hidden role="status" aria-live="polite"><span class="wghost" id="wghost" hidden>' + cicero('', 'talk') + '</span><span class="who" id="wwho" hidden></span><span class="txt" id="wtxt"></span><div class="wopts" id="wopts" hidden></div><span class="caret" aria-hidden="true"></span></div>' +
    '<div class="wpad" id="wpad"><div class="dpad" id="dpad" role="group" aria-label="Direzioni">' +
    (['up', 'left', 'right', 'down'] as Dir[]).map(function (d) {
      return '<button type="button" data-d="' + d + '" aria-label="' + DLABEL[d] + '"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ARROW[d] + '"/></svg></button>';
    }).join('') +
    '</div><button class="abtn" type="button" id="wa" aria-label="Parla, leggi o conferma">A</button></div>' +
    '<p class="whint">Frecce, WASD o un clic per camminare · Invio per parlare · M menu · C Cicerone · F schermo intero</p>';
  cv = $('wcv') as HTMLCanvasElement; ctx = cv.getContext('2d')!;
  cv.addEventListener('click', clickMap);
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
  $('wmenu').addEventListener('click', function () { openMenu(); });
  $('wcic').addEventListener('click', function () { mentorTalk(); });
  $('wgoal').addEventListener('click', function () { openMenu('viaggio'); });
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
/* what an activity brought Antonio, in the same corner, for a few seconds */
/** the guardaparco has something for whoever has filled the diary some more */
export function dexNotice() { if (dexPrizesDue().length) notify('Il guardaparco di Gianola ha un premio per il tuo <b>diario delle creature</b>'); }
/* saving can fail (a private window, a full memory): the player is told once, and how not to lose the story */
onSaveFail(function () {
  if (root && !root.hidden) notify('<b>La storia non si salva</b> su questo dispositivo (finestra privata o memoria piena). Dal titolo, in Salvataggi, puoi copiarla con «Esporta».');
});
function notify(html: string) {
  var el = $('wtoast');
  el.innerHTML = html;
  el.hidden = false; el.classList.remove('out');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.add('out'); toastTimer = setTimeout(function () { el.hidden = true; }, 600); }, 4200);
}
/** what an activity brought that has to be told: a level (with its moves, its form, a move to choose) and a friend who
    comes along. The activity still has its sheet open, or its own words to say, so it waits and is told from the frame */
var told: { g: Growth; joined: FriendId | null }[] = [];
onReward(function (g, cash, joined) {
  notify('<b>' + esc(nameOf(g.key)) + '</b> +' + g.xp + ' esperienza' + (cash ? ' · +' + coins(cash) : '') + (g.to > g.from ? ' · sale al livello ' + g.to + '!' : ''));
  if (built) renderHud();
  if (g.to > g.from || joined) told.push({ g: g, joined: joined });
});
/** nothing else is going on: no talk, no sheet, no trainer coming, no fight */
function quiet(): boolean { return running && !dialog && !between && !!st.seen.intro && !overlayOpen() && !meeting && !fight; }
function tellRewards() {
  if (!told.length || !quiet()) return;
  var r = told.shift()!, joined = r.joined;
  var join = function () { if (joined) friendJoins(joined, JOIN[joined as keyof typeof JOIN].say || []); };
  if (r.g.to <= r.g.from) { join(); return; }
  if (r.g.key === firstHuman()) mentorTip('level');
  growthSay(r.g, [], join);
}
/** a friend comes along: from now on it can be played, with its own creatures */
function friendJoins(id: FriendId, lines: string[]) {
  mentorTip('hero');
  say(lines.concat(['Adesso anche ' + C[id].name + ' è dei tuoi, con la sua squadra: nel menu, alla voce Squadra, puoi giocare con lui.']), id);
}
/* the next stop of the tour, with an arrow that points to it (or to the door that leads to it) */
var lastGoal = '', goalFlash: ReturnType<typeof setTimeout> | undefined;
const GOAL_ARROW = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12h13M12 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const GOAL_HERE = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor"/><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
/** a new chapter of the story: Cicero says so from the corner, once nothing else is going on (no talk, no sheet, no
    trainer coming to challenge Antonio, no fight); from the frame, so that it never slips in between two steps of one
    moment, such as the guardaparco's words and his grandson's challenge */
function chapterTip() {
  if (!quiet()) return;
  var cn = chapterNow();
  if (cn) { save(); bubble((cn.done ? esc(cn.done) + ' ' : '') + 'Nuovo capitolo: <b>' + esc(cn.title) + '</b>. ' + esc(cn.text) + ' <small>(C per i dettagli)</small>'); }
}
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
/* ---------- the bars in the corner: the first of the company and the creature at his side, always on the way to the next level ---------- */
var barKeys = '', barAt = 0, barShown: Record<string, { lv: number; pct: number }> = {};
function renderBars() {
  var el = $('wbars');
  if (!el) return;
  var keys = [firstHuman()], lead = leadCreature();
  if (lead) keys.push(lead);
  if (keys.join() !== barKeys) {
    barKeys = keys.join(); barShown = {};
    el.innerHTML = keys.map(function (k) {
      return '<div class="wbar" data-k="' + k + '" style="--tc:' + tcOf(k) + '"><span class="face">' + portrait(k) + '</span><span class="wbar-t"><b></b><small></small><span class="xpbar"><i></i></span></span></div>';
    }).join('');
  }
  keys.forEach(function (k) {
    var row = el.querySelector('[data-k="' + k + '"]') as HTMLElement, l = level(k), pct = Math.round(progress(k) * 1000) / 10, was = barShown[k];
    var bar = row.querySelector('.xpbar i') as HTMLElement;
    (row.querySelector('b') as HTMLElement).textContent = nameOf(k);
    (row.querySelector('small') as HTMLElement).textContent = 'Lv ' + l.lv;
    row.setAttribute('aria-label', nameOf(k) + ', livello ' + l.lv + ', ' + Math.round(pct) + '% verso il prossimo');
    if (was && l.lv > was.lv) {
      /* a level up: the bar fills to the end, flashes, and starts again */
      bar.style.width = '100%';
      row.classList.remove('lvup'); void row.offsetWidth; row.classList.add('lvup');
      setTimeout(function () { bar.style.transition = 'none'; bar.style.width = '0%'; void bar.offsetWidth; bar.style.transition = ''; bar.style.width = pct + '%'; }, 650);
    } else if (!was || was.pct !== pct) bar.style.width = pct + '%';
    barShown[k] = { lv: l.lv, pct: pct };
  });
}
export function renderHud() {
  lastPlace = ''; renderPlace(); lastGoal = ''; renderGoal(); renderBars();
  var hint = root.querySelector('.whint');
  if (hint) hint.textContent = st.sella ? 'In sella: frecce o WASD per guidare · Invio per suonare, da fermo per scendere · M menu'
    : 'Frecce, WASD o un clic per camminare · Invio per parlare · M menu · C Cicerone · F schermo intero' + (powerOf('volo') ? ' · V per guardare dall\'alto' : '');
  $('wmoney').innerHTML = coin() + '<b>' + money() + '</b>';
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
    else if (e.key === 'c' || e.key === 'C') { e.preventDefault(); e.stopImmediatePropagation(); mentorTalk(); }
    else if (e.key === 'v' || e.key === 'V') { e.preventDefault(); e.stopImmediatePropagation(); flyUp(); }
    else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); e.stopImmediatePropagation(); fullScreen(); }
  });
  document.addEventListener('keyup', function (e) { var d = KEYMAP[e.key]; if (d) release(d); });
}

/** F: the whole screen, and F (or Esc) again to come back */
export function fullScreen() {
  try {
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) void document.documentElement.requestFullscreen().catch(function () { /* refused: nothing to do */ });
  } catch (e) { /* a frame that does not allow it */ }
}

/* ---------- a click on the map (R17): walk there; on someone, a sign or a thing, walk next to it and use it ---------- */
var clickTo: { x: number; y: number; dir: Dir } | null = null;
function clickMap(e: MouseEvent) {
  if (!running || dialog || busy || overlayOpen() || e.button !== 0) return;
  var t = tileAt(e.clientX, e.clientY);
  if (!t) return;
  var tx = t[0], ty = t[1], used = !!personAt(M, tx, ty) || !!M.at[key(tx, ty)] || !!itemAt(M, tx, ty);
  clickTo = null;
  if (!used && !blocked(M, tx, ty)) { var r = route(tx, ty); if (r && r.length) walkAlong(r); return; }
  if (!used) return;
  /* the nearest free tile next to it, and which way to face from there */
  var best: { x: number; y: number; dir: Dir; path: Dir[] } | null = null;
  (['up', 'down', 'left', 'right'] as Dir[]).forEach(function (d) {
    var sx = tx - DV[d][0], sy = ty - DV[d][1], here = sx === st.x && sy === st.y;
    if (!here && blocked(M, sx, sy)) return;
    var p = here ? [] : route(sx, sy);
    if (p && (!best || p.length < best.path.length)) best = { x: sx, y: sy, dir: d, path: p };
  });
  if (!best) return;
  var b = best as { x: number; y: number; dir: Dir; path: Dir[] };
  clickTo = { x: b.x, y: b.y, dir: b.dir };
  if (b.path.length) walkAlong(b.path); else arriveClick();
}
/** at the end of a click's walk: face what was clicked and use it */
function arriveClick() {
  var c = clickTo;
  if (!c || mover || walkingAlong() || dialog || busy) return;
  clickTo = null;
  if (st.x !== c.x || st.y !== c.y) return;
  st.dir = c.dir;
  interact();
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
  var d = dialog!, line = heroText(d.lines[d.i]);
  dlg.hidden = false;
  var ghost = d.who === CICERO || d.who === MAMURRA;
  dlg.classList.toggle('mentor', ghost); $('wghost').hidden = !ghost;
  if (ghost) $('wghost').innerHTML = d.who === CICERO ? cicero('', 'talk') : mamurra();
  if (d.who === CICERO) cicAppear(Infinity);
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
  if (d && d.who === CICERO) cicPresence.until = performance.now();
  var fn = next || (d && d.done);
  if (fn) { between = true; setTimeout(function () { between = false; fn!(); }, 30); }
}
/** a dialogue has just closed and what follows it is about to start (Cicero waits for it) */
var between = false;
function interact() {
  if (dialog) { advance(); return; }
  if (!running || busy) return;
  /* on the scooter, under way: the horn */
  if (mover) { if (st.sella) sfx('horn'); return; }
  var v = DV[st.dir], x = st.x + v[0], y = st.y + v[1];
  if (motoAt(M, x, y)) { rideOn(); return; }
  var p = personAt(M, x, y);
  if (!p && M.cell(x, y).reach) p = personAt(M, x + v[0], y + v[1]);   /* across a net or a counter */
  if (p && (p.path || p.mv)) return;   /* someone walking by */
  if (p) { talkTo(p); return; }
  var it = itemAt(M, x, y);
  if (it) { pickUp(it); return; }
  var a = M.at[key(x, y)];
  if (a && a.kind === 'sign') { if (a.s.sleep) sleep(a.s); else if (a.s.view) lookOut(a.s); else if (!plotSign(a.s)) say(a.s.text); }
  else if (a && a.kind === 'door') { if (st.sella && a.b.to) rideOff(); else useDoor(a.b); }
  else if (st.sella) rideOff();
  else { var fp = followerAt(); if (fp && fp[0] === x && fp[1] === y) followerTalk(); }
}
/* Antonio turns to his creature: it says its cry, and how it is doing */
var patted = 0;
function followerTalk() {
  var key = leadCreature()!, mon = creatureOf(key)!, sp = SPECIES[mon.sp], name = nameOf(key), lv = level(key).lv, area = areaName(), h = hearts(key);
  /* a word to it, now and then, brings it closer */
  if (Date.now() - patted > 120000) { patted = Date.now(); addBond(key, 1); save(); }
  var moods = h >= 3 ? [name + ' ti salta in braccio.', name + ' ti segue come un\'ombra: non ti lascerebbe mai.', name + ' fa le fusa, a modo suo.', name + ' ti guarda come se sapesse già dove andate.']
    : h >= 1 ? [name + ' ti guarda contento.', name + ' saltella sul posto.', name + ' annusa l\'aria di ' + (area || 'Formia') + '.', name + ' segue con gli occhi un gabbiano.']
    : [name + ' ti osserva, ancora un po\' diffidente.', name + ' si gira dall\'altra parte, ma resta vicino.', name + ' annusa l\'aria di ' + (area || 'Formia') + '.'];
  if (darkness(new Date()) > 0.5) moods.push(name + ' sbadiglia: si è fatto tardi.');
  if (M.inside) moods.push(name + ' si guarda intorno: qui dentro è tutto nuovo.');
  var soon = sp.evolve && sp.evolve.at - lv <= 2 ? name + ' sembra irrequieto: tra poco cambierà forma.' : null;
  say(['«' + sp.cry.entry + '»', soon || moods[Math.floor(Math.random() * moods.length)]], name);
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
/* ---------- the scooter: a blue Liberty with its top case, parked where he left it ---------- */
/** up on it: the creature jumps on behind */
function rideOn() {
  if (!mount()) return;
  var first = !st.seen.sella;
  st.seen.sella = true; save(); renderHud();
  if (first) notify('In sella! Sui rettilinei prende velocità. Invio per suonare, o per scendere quando sei fermo.');
}
/** off it, if there is room to stand */
function rideOff() {
  if (dismount()) { save(); renderHud(); }
  else notify('Qui non c\'è posto per scendere.');
}
/** why the scooter did not go on: said once in a while, not at every bump */
var rideSaid = 0;
onRideStop(function (x, y) {
  var c = M.cell(x, y), a = M.at[key(x, y)], now = performance.now();
  var why = a && a.kind === 'door' ? 'Prima parcheggia: premi Invio per scendere dal motorino.'
    : c.g === 'steps' ? 'Le scale no: il motorino resta giù.'
    : c.g === 'sand' ? 'Sulla sabbia il motorino si pianta. Lascialo sul lungomare.'
    : c.deco === 'tall' || c.deco === 'pools' ? 'Lì dentro col motorino non si passa.'
    : c.deco === 'ledge' ? 'Dal gradone si salta a piedi, non in motorino.' : '';
  if (why && now - rideSaid > 4000) { rideSaid = now; notify(why); }
});
function pickUp(it: LostItem) {
  sfx('pickup');
  st.found[it.id] = true; save();
  var left = allItems().length - foundItems().length;
  say(['Hai ritrovato ' + ITEMS[it.move].name + '!', it.text,
    left ? 'Nelle lotte della Storia Antonio non ' + it.pron + ' perde più. ' + (left === 1 ? 'Ne manca ancora uno.' : 'Ne mancano ancora ' + left + '.')
      : 'Hai ritrovato tutto: nelle lotte della Storia Antonio non perde più niente.']);
}
/** talking to someone: the plot first, unless it has just had its say (past), and then what that one always does */
function talkTo(p: Person, past?: boolean) {
  p.dir = OPP[st.dir];
  var n = p.n;
  if (n.pet != null) { openHome(); return; }
  if (!past && plotTalk(n, function () { talkTo(p, true); })) return;
  if (n.covo) leaderTalk(n.covo, n);
  else if (n.tourney) tourneyTalk(n.name || '', n.lines || []);
  else if (n.wild) wildTalk(p);
  else if (n.trainer) trainerTalk(n.trainer, n.name || '', n.lines || []);
  /* whoever is played gets his first creature here: each of the six begins his own story (title, «chi sei?») */
  else if (n.starter && !hasStarter()) starterTalk(n.name || '');
  else if (n.starter && !st.seen['dono-retini']) netsGift(n.name || '');
  else if (n.starter && dexPrizesDue().length) dexPrizeTalk(n.name || '');
  else if (n.shop) {
    /* the fisherman of Mola also takes you fishing off the pier */
    var shopOpts: { label: string; fn: (() => void) | null }[] = [{ label: 'Compra', fn: function () { openShop(n.shop!); } }];
    if (n.shop === 'pesca') shopOpts.push({ label: 'Pesca dal molo', fn: function () { startActivity('pesca', n); } });
    shopOpts.push({ label: 'No, grazie', fn: null });
    say(n.lines || [SHOPS[n.shop].hello], n.name, shopOpts);
  }
  else if (n.gate) gateTalk(n.gate, n.name);
  else if (n.activity) offerActivity(n);
  else if (n.hint) say(linesNow(n).concat(nextStop().tip), n.name);
  else { var now = linesNow(n); say(now.length ? now : ['…'], n.name); }
}
export function useDoor(b: Building) {
  if (b.gate) gateTalk(b.gate);
  else if (b.shop) say(b.msg || [SHOPS[b.shop].hello], null, [{ label: 'Compra', fn: function () { openShop(b.shop!); } }, { label: 'No, grazie', fn: null }]);
  else if (b.msg) say(b.msg);
}
function gateTalk(g: string, who?: string) {
  var G0 = gateFor(g, firstHuman() as FriendId), need = cityCovi(G0.city), have = need.filter(hasBadge).length, city = MAPS[G0.city].name;
  if (have < need.length) { say([G0.label + ' parte quando hai tutte le spille di ' + city + '.', 'Ne hai ' + have + ' su ' + need.length + '.'], who); return; }
  /* the train across Italy (ui/train.ts), and the arrival: the station hall of the city, or Formia's station */
  var go = function () {
    hide();
    trainTrip(G0, function () {
      open(true);
      if (G0.to === 'formia') { var c0 = (MAPS.formia.npcs || []).filter(function (q) { return q.gate === 'torino'; })[0]; travel('formia', c0.x, c0.y + 1, 'down'); }
      else { var m0 = MAPS[G0.to]; travel(G0.to, m0.start[0], m0.start[1], m0.start[2]); }
    });
  };
  if (G0.city !== 'formia') { say([G0.label + ' è sul binario.'], who, [{ label: 'Torna a Formia', fn: go }, { label: 'Resto qui', fn: null }]); return; }
  var opts: { label: string; fn: (() => void) | null }[] = [{ label: 'Sali sul treno', fn: go }];
  if (flag('tr-mamurra')) opts.push({ label: 'Guarda indietro', fn: lookBack });
  say(['Hai tutte le spille di ' + city + '!', G0.label + ' è sul binario: si parte per ' + G0.station + '.'], who, opts.concat([{ label: 'Aspetto', fn: null }]));
}
/** before leaving: the story of this game, told back */
function lookBack() {
  sheet('<div class="award" role="dialog" aria-modal="true" aria-labelledby="ep-t"><h2 id="ep-t">La tua Formia</h2>' + epilogue().map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
    '<button class="btn primary" type="button" id="ep-ok">Continua</button></div>', 'result');
  $('ep-ok').addEventListener('click', closeSheet);
  setTimeout(function () { var b = $('ep-ok'); if (b) b.focus(); }, 30);
}

/* ---------- covi ---------- */
/** a friend in his covo: the challenge, and what he always does besides (Valentin's beach volley, Andrea's padel…) */
function leaderTalk(id: string, n?: Npc) {
  var cv0 = COVI[id], act = n && n.activity ? activity(n.activity) : null;
  var doIt: { label: string; fn: (() => void) | null }[] = act ? [{ label: act.verb, fn: function () { startActivity(act!.id, n!); } }] : [];
  if (st.beaten[id]) { say(cv0.after, cv0.leader, doIt.length ? doIt.concat([{ label: 'Più tardi', fn: null }]) : null); return; }
  var opts: { label: string; fn: (() => void) | null }[] = [{ label: 'Sfida!', fn: function () { challenge(id); } }];
  /* the catchphrase, then what he has to say to this one in particular (or the plain intro) */
  var mine = cv0.vs[firstHuman() as FriendId];
  say(mine ? [cv0.intro[0]].concat(mine) : cv0.intro, cv0.leader, opts.concat(doIt).concat([{ label: 'Più tardi', fn: null }]));
}
/* ---------- the creatures' powers: swimming, climbing the walls, the view from above ---------- */
const MEET_LINE: Record<string, string> = { grotta: 'Qualcosa si muove nel buio…', erba: 'Qualcosa si muove nell\'erba alta…', scogli: 'Qualcosa si muove tra gli scogli…', acqua: 'Qualcosa nuota sotto di te…', mura: 'Qualcosa si muove tra le pietre delle mura…' };
/* walking into the shallow sea, or against the walls of Castellone, with a creature that can help: it offers */
/* a place with a puzzle says what its floor has done, the first time at least */
onPlace(function (a) {
  if (a.plate) { sfx('click'); notify(a.plate.on ? 'La lastra cede sotto il piede: da qualche parte si muove qualcosa.' : 'La lastra torna su.'); }
  var w = M.place && M.place.words;
  if (a.rested) { sfx('pickup'); notify(w ? w.rest : 'Da qui si riparte.'); }
  if (a.hit) { sfx('weak'); notify(w ? w.hit : 'Si torna indietro.'); }
});
onEdge(function (kind, d) {
  var who = powerOf(kind === 'swim' ? 'nuoto' : 'scalata');
  if (!who || dialog || busy || run) return false;
  var name = nameOf(who);
  say([kind === 'swim' ? name + ' guarda il mare e ti fa segno: può portarti a nuoto.' : name + ' si arrampica sulle pietre delle mura e ti fa segno di seguirlo.'], null, [
    { label: kind === 'swim' ? 'Nuota con ' + name : 'Arrampicati con ' + name, fn: function () { moveMode[kind] = true; stepNow(d); } },
    { label: 'No', fn: null }
  ]);
  return true;
});
/** standing in the sea or on the walls with no creature carrying him: after the page was opened again there (how he
    got there is not saved), or with someone else played, or with the swimmer sent home. A creature of the team that
    can do it carries him on; with none, he goes back to the nearest place he can stand, instead of staying stuck */
function standOn() {
  if (mover || busy || st.x < 0 || st.y < 0 || st.x >= M.w || st.y >= M.h || M.solid[st.y * M.w + st.x] !== 1) return;
  var sea = isShallow(M, st.x, st.y), wall = isWall(M, st.x, st.y);
  if ((sea && moveMode.swim) || (wall && moveMode.climb)) return;
  if (sea && powerOf('nuoto')) { moveMode.swim = true; return; }
  if (wall && powerOf('scalata')) { moveMode.climb = true; return; }
  moveMode.swim = false; moveMode.climb = false;
  var q: [number, number][] = [[st.x, st.y]], seen: Record<string, number> = {};
  seen[key(st.x, st.y)] = 1;
  while (q.length) {
    var p = q.shift()!;
    if (!blocked(M, p[0], p[1])) {
      st.x = p[0]; st.y = p[1]; save();
      notify(sea ? 'Senza una creatura che nuota non si resta in mare: torni a riva.' : wall ? 'Senza una creatura che si arrampica non si resta sulle mura: torni giù.' : 'Torni dove si può camminare.');
      return;
    }
    for (var d = 0; d < 4; d++) {
      var v = [[1, 0], [-1, 0], [0, 1], [0, -1]][d], nx = p[0] + v[0], ny = p[1] + v[1], k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= M.w || ny >= M.h || seen[k]) continue;
      seen[k] = 1; q.push([nx, ny]);
    }
  }
}
/** swimming over one of the Roman tanks of Gianola: an amphora at the bottom, once */
function treasure(): boolean {
  var t = moveMode.swim ? treasureAt(M) : null;
  if (!t || st.x !== t[0] || st.y !== t[1] || st.seen.anfora) return false;
  st.seen.anfora = true; earn(60); save(); renderHud();
  sfx('found'); halt();
  say(['Sul fondo della vasca romana c\'è qualcosa che luccica…', 'Un\'anfora! Intera, dopo duemila anni nel porticciolo di Gianola.', 'Il museo archeologico la compra per 60 sesterzi: un pezzo di Formiae torna a casa.']);
  return true;
}
/** the view from above: a creature with wings flies up and, for a few seconds, Formia is seen from high up */
export const SKY_MS = 4300;
export let skyFrom = 0, skyWho = '';
function flyUp() {
  if (!running || M.inside || dialog || busy || run || skyFrom) return;
  var who = powerOf('volo');
  if (!who) { bubble('Per vedere Formia dall\'alto serve una creatura con le ali: un gabbiano, una civetta…'); return; }
  halt();
  skyWho = who; skyFrom = performance.now();
  sfx('whoosh');
}
/** a belvedere (VISIONE.md, V4): what it says, then Formia from above, as with a winged creature but with one's own
    eyes. The first time, the view goes in the diary (st.seen['veduta-…']) */
function lookOut(s: Sign) {
  var v = s.view!, k = 'veduta-' + v.id;
  say(s.text, null, null, function () {
    if (!running || M.inside || busy || run || skyFrom) return;
    halt();
    skyWho = ''; skyFrom = performance.now();
    sfx('whoosh');
    if (!st.seen[k]) { st.seen[k] = true; save(); sfx('found'); notify('<b>Una veduta nuova nel Diario:</b> ' + esc(v.name) + '.'); }
  });
}
/** the belvederi of the town where the story is, for the diary */
function views(): { id: string; name: string }[] {
  return (MAPS[M.city].signs || []).filter(function (s) { return !!s.view; }).map(function (s) { return s.view!; });
}
/* ---------- the friends' tournament at the Bruno Zauli (data/tourney.ts): five friends in a row, then a cup ---------- */
var tour: { round: number; edition: number; wins: number; host: string } | null = null;
const CUP = '<svg viewBox="0 0 100 100" width="104" height="104" aria-hidden="true"><path d="M30 18h40v14c0 14-8 24-20 26-12-2-20-12-20-26Z" fill="#ffd166" stroke="#1c2340" stroke-width="4" stroke-linejoin="round"/>' +
  '<path d="M30 24H18c0 12 6 18 14 18M70 24h12c0 12-6 18-14 18" fill="none" stroke="#1c2340" stroke-width="4"/><path d="M44 58h12v12H44Z" fill="#ffd166" stroke="#1c2340" stroke-width="4"/>' +
  '<path d="M32 70h36v10H32Z" fill="#e8916a" stroke="#1c2340" stroke-width="4" stroke-linejoin="round"/><path d="M38 26l4 10" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></svg>';
function tourneyTalk(host: string, lines: string[]) {
  if (!cityCovi('formia').every(hasBadge)) { say(lines.concat(['Il torneo è per chi ha vinto i due covi di Formia: torna con le spille di Forchetta e di Costanzo.']), host); return; }
  var ed = (st.done && st.done.coppa) || 0;
  say([ed ? 'Il ' + TOURNEY.name + ' ricomincia, edizione numero ' + (ed + 1) + ': stavolta tutti hanno ' + ed * TOURNEY.step + ' livelli in più.'
    : 'Il ' + TOURNEY.name + ': cinque amici, uno dopo l\'altro, sulla pista del Bruno Zauli. Anche Costanzo e Forchetta vogliono la rivincita.',
    'Chi li batte tutti vince la coppa e ' + coins(TOURNEY.prize) + '. Ti iscrivi?'], host,
    [{ label: 'Iscriviti!', fn: function () { tour = { round: 0, edition: ed, wins: 0, host: host }; tourneyRound(); } }, { label: 'Più tardi', fn: null }]);
}
function tourneyRound() {
  var t = tour!, r = roundsOf(t.edition)[t.round], L = C[r.who];
  say(['Turno ' + (t.round + 1) + ' di ' + TOURNEY.rounds.length + ': ' + L.name + ', livello ' + r.lv + '.'], t.host, null, function () {
    say([r.line], r.who, null, function () {
      var first = firstHuman(), keys = (st.squad as string[]).filter(function (k) { return k !== r.who; }).sort(function (a, b) { return a === first ? -1 : b === first ? 1 : 0; });
      pickFighter('Chi mandi contro ' + L.name + '?', L.type, keys, function (key) {
        hide();
        startBattle({ a: idOf(key), b: r.who, mode: 'cpu', story: { tourney: t.round, key: key, foeLv: r.lv, scene: sceneFor(M.id, areaName()) }, safe: safeMoves(),
          sideA: sideOf(key), sideB: foeSide(r.who, r.lv), bag: battleBag() });
      });
    });
  });
}
function tourneyAfter(won: boolean, key: string) {
  var t = tour!, r = roundsOf(t.edition)[t.round], L = C[r.who];
  if (!won) {
    tour = null;
    rewards(key, r.lv, false, true, function () { say([L.name + ' ti ha battuto al turno ' + (t.round + 1) + '. Fuori dal torneo, per stavolta: puoi riprovare quando vuoi.'], t.host, null, function () { record('torneo', t.wins); }); }, true);
    return;
  }
  t.wins++;
  rewards(key, r.lv, true, true, function () {
    if (t.round + 1 < TOURNEY.rounds.length) { t.round++; say([L.name + ' è fuori! Avanti il prossimo.'], t.host, null, tourneyRound); return; }
    tour = null;
    st.done = st.done || {}; st.done.coppa = (st.done.coppa || 0) + 1; earn(TOURNEY.prize); save(); renderHud();
    sfx('badge');
    sheet('<div class="award" role="dialog" aria-modal="true" aria-labelledby="cup-t" style="--tc:var(--t-chiacchiera)"><div class="award-badge">' + CUP + '</div>' +
      '<h2 id="cup-t">Hai vinto il ' + esc(TOURNEY.name) + '!</h2><p>La coppa del Bruno Zauli' + (t.edition ? ', edizione numero ' + (t.edition + 1) : '') + ', e ' + coins(TOURNEY.prize) + '. ' +
      'Al prossimo torneo tutti saranno ' + TOURNEY.step + ' livelli più forti.</p><button class="btn primary" type="button" id="cup-ok">Continua</button></div>', 'result');
    $('cup-ok').addEventListener('click', function () { closeSheet(); record('torneo', t.wins); });
    setTimeout(function () { var bt = $('cup-ok'); if (bt) bt.focus(); }, 30);
  }, true);
}
/* A covo is fought with creatures (D1, 10 November 2026): the leader sends his crew, of his type, and steps in last
   himself, as a person; the player has his team, and himself last on the bench, as against a trainer. Indoors: no
   magic of the place. */
function challenge(id: string) {
  var cv0 = COVI[id], left = teamMons().map(function (m) { return m.uid; });
  if (!left.length) { say(['Senza una creatura non si entra in un covo: qui si lotta con la propria squadra.', 'Il guardaparco di Gianola te ne affida una.'], cv0.leader); return; }
  var lv = covoLevel(id), crew = crewAt(id, lv, covoPins(id)), leader = Object.assign({ id: cv0.leader, last: true }, foeSide(cv0.leader, lv)) as Member;
  var foes = crew.map(function (c) { return foeMember({ sp: c.sp, lv: c.lv }); }).concat([leader]);
  mentorTip('covo');
  pickFighter('Chi mandi contro ' + SPECIES[crew[0].sp].name + ' di ' + C[cv0.leader].name + '?', SPECIES[crew[0].sp].type, left, function (k) {
    hide();
    crew.forEach(function (c) { see(c.sp); }); save();
    startBattle({ a: idOf(k), b: crew[0].sp, mode: 'cpu', story: { covo: id, key: k, foeLv: lv, scene: sceneFor(M.id, areaName()) }, safe: safeMoves(),
      sideA: memberOf(k), sideB: foes[0], benchA: left.concat([firstHuman()]).filter(function (x) { return x !== k; }).map(memberOf), benchB: foes.slice(1),
      smart: [0, 1], bag: battleBag(), trainer: C[cv0.leader].name, surgeStart: stonesKept() ? 1 : 0, hero: nameOf(firstHuman()) });
  }, SPECIES[crew[0].sp].type2);
}
/** Antonio's moves whose thing he has found around town: in story battles he can't lose it any more */
function safeMoves() { return foundItems().map(function (it) { return it.move; }); }

/* ---------- creatures fight creatures: the wild ones, and the trainers' ---------- */
/* One battle, with the two teams inside it (battle/turn.ts): Antonio's creatures wait on the bench, a trainer's come
   one after the other, a wild one is a single foe that can be caught. Antonio himself is the last on the bench: he
   steps in only when all his creatures are down. What the battle brings is paid at the end, from who fought whom. */
interface Foe { sp: SpeciesId; lv: number; gold?: boolean; moves?: string[]; stages?: LegendStage[]; resonate?: boolean }
interface Fight { kind: 'wild' | 'trainer'; id: string; who: string; foes: Foe[] }
var fight: Fight | null = null;
/** someone of Antonio's team, for the bench */
function memberOf(k: string): Member {
  var a = Object.assign({ id: idOf(k), key: k }, sideOf(k)) as Member;
  /* who is being played steps in when its creatures are down */
  if (k === firstHuman()) { a.stats = lastStand(a.stats!, st.skills || {}); a.last = true; }
  return a;
}
/** one of the foes: its numbers at its level, with the moves it has been given */
function foeMember(foe: Foe): Member {
  var b = Object.assign({ id: foe.sp }, foeSide(foe.sp, foe.lv)) as Member;
  if (foe.gold) b.gold = true;
  if (foe.moves) b.known = foe.moves.slice();
  if (foe.stages) b.stages = foe.stages;
  if (foe.resonate) b.resonate = true;
  return b;
}
/** the battle of a fight: Antonio picks who goes in first, the rest wait on the bench */
function fightOn() {
  var f = fight!, foe = f.foes[0], sp = SPECIES[foe.sp], left = teamMons().map(function (m) { return m.uid; });
  var go = function (k: string) {
    /* R10: the first time the one sent in is at a disadvantage of type and there is someone else, Cicero says how to
       change, before the battle (a bubble would be hidden by it) */
    var mine = creatureOf(k), ft = (foe.stages && foe.stages[0].types) || [sp.type].concat(sp.type2 ? [sp.type2] : []);
    if (mine && !foe.stages && left.length > 1 && !st.seen['cic-change']) {
      var ms = SPECIES[mine.sp], bad = ft.some(function (t) { return magicBeats(t, ms.type); });
      if (bad) {
        var t = tipOnce('change');
        if (t) { save(); say(t.map(function (l) { return l.replace('{mine}', nameOf(k)).replace('{foe}', sp.name); }), CICERO, null, function () { go2(k); }); return; }
      }
    }
    go2(k);
  };
  var go2 = function (k: string) {
    hide();
    see(foe.sp); save();
    var place = sceneFor(M.id, areaName());
    startBattle({ a: idOf(k), b: foe.sp, mode: 'cpu', safe: safeMoves(), sideA: memberOf(k), sideB: foeMember(foe), bag: battleBag(),
      benchA: left.concat([firstHuman()]).filter(function (x) { return x !== k; }).map(memberOf), benchB: f.foes.slice(1).map(foeMember),
      smart: [0, f.kind === 'trainer' ? TRAINERS[f.id].smart || 0 : 0], field: PLACE_MAGIC[place], shield: f.kind === 'trainer' ? shieldNow(f.id) : undefined, surgeStart: stonesKept() ? 1 : 0, hero: nameOf(firstHuman()),
      story: f.kind === 'wild' ? { wild: f.id, sp: foe.sp, key: k, foeLv: foe.lv, gold: foe.gold, scene: place } : { trainer: f.id, sp: foe.sp, key: k, foeLv: foe.lv, scene: place },
      wild: f.kind === 'wild', trainer: f.kind === 'trainer' ? TRAINERS[f.id].title : undefined, dark: !!M.dark });
  };
  /* a legend may start with other types than those of its kind */
  var ty = foe.stages && foe.stages[0].types;
  pickFighter('Chi mandi contro ' + sp.name + '?', ty ? ty[0] : sp.type, left, go, ty ? ty[1] : sp.type2);
}
/** a fight is over: a caught creature, a beaten trainer, or Antonio who has lost; each fighter gets what it earned */
function fightAfter(res: { won: boolean; caught?: boolean; bouts?: Bout[] }) {
  var f = fight!, foe = f.foes[0], sp = SPECIES[foe.sp], wild = f.kind === 'wild', tr = wild ? null : TRAINERS[f.id], bouts = res.bouts || [];
  bouts.forEach(function (b) { see(b.foe as SpeciesId); });
  if (teamMons().length > 1) mentorTip('bench');
  if (stonesKept() || teamMons().some(function (m) { return hearts(m.uid) >= 3; })) mentorTip('surge');
  var pay = fightPay(bouts, !wild);
  var legend = foe.stages ? legendOf(foe.sp) : null;
  if (res.caught) {
    fight = null; wildGone[f.id] = Date.now();
    if (legend) st.seen[endFlag(legend, 'preso')] = true;
    var caught = creatureOf(addCreature(foe.sp, foe.lv, foe.gold)); save();
    sfx('badge');
    say(caught && caught.home ? [sp.name + (foe.gold ? ' dorata' : '') + ' è tua, al livello ' + foe.lv + '!', 'La squadra è al completo: ti aspetta a casa, nel tuo appartamento. Lì puoi cambiare chi porti con te.']
      : [sp.name + (foe.gold ? ' dorata' : '') + ' entra nella tua squadra, al livello ' + foe.lv + '!', 'Lo trovi nel menu, alla voce Squadra.'], null, null, function () { rewardsAll(pay, moneyFor(foe.lv, false), legend && legend.end ? function () { say(legend!.end!.net.cicero, CICERO); } : undefined); });
    return;
  }
  if (res.won) {
    /* a legend does not just go away: what becomes of it is up to the player */
    if (wild) {
      var ending = legend && legend.end ? legend : null;
      fight = null;
      /* it stays where it is, on its knees, until the player has decided */
      if (ending) { rewardsAll(pay, moneyFor(foe.lv, false), function () { legendEnd(ending!, foe.lv); }); return; }
      wildGone[f.id] = Date.now(); rewardsAll(pay, moneyFor(foe.lv, false)); return;
    }
    rewardsAll(pay, 0, function () {
      var first = !st.beaten['tr-' + f.id], now = trainerNow(f.id), gift = first ? now.gift : undefined;
      st.beaten['tr-' + f.id] = true;
      if (first) earn(now.prize);
      if (gift) { st.bag = st.bag || {}; for (var g in gift.items) st.bag[g] = (st.bag[g] || 0) + gift.items[g]; }
      save(); renderHud(); fight = null;
      sfx('badge');
      say(lines(now.win, f.id).concat(gift ? [gift.say] : [], first ? ['{hero} vince ' + coins(now.prize) + '.'] : []), f.who, null, function () { plotAfter(f.id, f.who); });
    });
    return;
  }
  rewardsAll(pay, 0, function () {
    fight = null;
    if (tr) say(lines(trainerNow(f.id).lose, f.id), f.who); else say([sp.name + ' torna a nascondersi. {hero} e le sue creature vanno a riposare.']);
  });
}
/* ---------- wild creatures: hidden in the tall grass and in the rock pools ---------- */
var calm = 0;
/** a step has just ended: in a hiding place a wild creature may jump out (true: the step stops there) */
var walked = 0, sniffed = 0;
export function stepped(): boolean {
  if (treasure()) return true;
  if (!teamMons().length) return false;
  if (spotted()) return true;
  /* walking together brings Antonio and his creature closer */
  if (++walked >= 40) { walked = 0; var lead = leadCreature(); if (lead) addBond(lead, 1); }
  /* and now and then, out in town, it finds something on the ground: the closer they are, the more often */
  if (++sniffed >= 60 && M.id === 'formia') { sniffed = 0; var fl = leadCreature(); if (fl && Math.random() < 0.15 + 0.05 * hearts(fl)) sniff(fl); }
  var h = hidingAt(st.x, st.y);
  if (!h) return false;
  if (calm > 0) { calm--; return false; }
  if (Math.random() >= meetChance(RATE, st.skills || {})) return false;
  calm = CALM;
  meet(h);
  return true;
}
/** what Antonio's creature digs up: a few sesterzi, a slice of tiella, a net someone lost */
function sniff(key: string) {
  var r = Math.random(), name = nameOf(key), what: string;
  if (r < 0.5) { var n = 3 + Math.floor(Math.random() * 10); earn(n); what = coins(n) + ' caduti a qualcuno'; }
  else if (r < 0.75) { st.bag = st.bag || {}; st.bag.tiella = (st.bag.tiella || 0) + 1; what = 'una fetta di tiella ancora incartata'; }
  /* now and then something for a creature to carry */
  else if (r < 0.85) { var it = HELD_IDS[Math.floor(Math.random() * HELD_IDS.length)]; st.bag = st.bag || {}; st.bag[it] = (st.bag[it] || 0) + 1; what = WARES[it].name.toLowerCase(); }
  else { st.bag = st.bag || {}; st.bag.retino = (st.bag.retino || 0) + 1; what = 'un retino dimenticato'; }
  save(); renderHud(); sfx('pickup');
  notify('<b>' + esc(name) + '</b> annusa per terra e trova ' + esc(what) + '!');
}
/** a creature of that hiding place jumps out: by day or by night, now and then a golden one */
function meet(h: Hiding) {
  /* Antonio's eye for the rare ones: the creatures of weight 1 come out more often, the golden ones too */
  var night = darkness(new Date()) > 0.5, lk = luck(st.skills || {});
  /* the strong ones of a place come out only once the story has got there (R10: no Pipistrega at 20 on the way in) */
  var m = pickMeet(((night && h.night) || h.day).filter(function (x) { return !x.after || flag(x.after); }).map(function (x) { return x.w <= 1 ? { sp: x.sp, lv: x.lv, w: x.w * lk.rare } : x; }), Math.random());
  var lv = wildLevel(m, h, teamRef(), storyStage(), Math.random()), gold = Math.random() < lk.gold / 48;
  halt();
  sfx('meet');
  if (!reduced) { root.classList.remove('meet'); void root.offsetWidth; root.classList.add('meet'); setTimeout(function () { root.classList.remove('meet'); }, 900); }
  wildMeet(h.id, MEET_LINE[h.on], { sp: m.sp, lv: lv, gold: gold });
}
/** who a trainer sends in, in one line */
export function foesLine(id: string): string { return 'Creature: ' + teamOf(id).map(function (t) { return SPECIES[t.sp].name + ' (Lv ' + t.lv + ')'; }).join(', ') + '.'; }
/** a battle with a trainer, with the creatures of who is being played (one of the missions of the friends is one too) */
export function trainerFight(id: string, who: string) { fight = { kind: 'trainer', id: id, who: who, foes: teamOf(id).slice() }; fightOn(); }
/** a wild creature in front of Antonio: fight it (with his creatures), or slip away */
function wildMeet(id: string, first: string, foe: Foe) {
  mentorTip(foe.stages ? 'legend' : 'wild');
  var sp = SPECIES[foe.sp];
  see(foe.sp); save();
  say([first, sp.wild.replace(/,$/, '') + ', livello ' + foe.lv + '!'].concat(foe.gold ? ['Ma è dorata! Una creatura così si vede una volta nella vita.'] : []), null, [
    { label: 'Lotta!', fn: function () { fight = { kind: 'wild', id: id, who: '', foes: [foe] }; fightOn(); } },
    { label: 'Scappa', fn: function () { say(['{hero} si allontana in punta di piedi.']); } }
  ]);
}
/* the legends are the only wild creatures in sight (data/legends.ts): one with a place of its own is reached through it */
function wildTalk(p: Person) {
  var w = wildNow(p.n)!, lv = w.lv[0] + Math.floor(Math.random() * (w.lv[1] - w.lv[0] + 1)), L = p.n.legend ? LEGENDS[p.n.legend] : null;
  if (!teamMons().length) { say(['Una creatura così non si sveglia a mani vuote. Senza una creatura con te, meglio lasciarla stare.']); return; }
  if (L && pactOpen(L)) { legendPact(L, lv + legendOver(L)); return; }
  if (L && L.trial && M.id !== L.trial.to) { legendWay(L); return; }
  wildMeet(p.n.id, SPECIES[w.sp].text, { sp: w.sp, lv: lv + (L ? legendOver(L) : 0), stages: L ? stagesNow(L) : undefined });
}
/* ---------- the trainers of Formia: their creatures one after the other ---------- */
/** a trainer's lines, with the rival's creature and Antonio's in them */
function lines(t: string[], id: string): string[] { return t.map(function (l) { return trainerLine(l, id); }); }
/** a trainer challenges Antonio (`came`: he has walked up to him, and there is no saying later) */
function trainerTalk(id: string, who: string, talk: string[], came?: boolean) {
  mentorTip('trainer');
  var tr = trainerNow(id), beaten = !!st.beaten['tr-' + id];
  if (!teamMons().length) { say(talk.concat(['Le creature si sfidano con le creature: senza una tua non si lotta.', 'Al Parco di Gianola il guardaparco ne affida una a chi se lo merita.']), who); return; }
  var opts: DialogOpt[] = [{ label: beaten ? 'Rivincita!' : 'Sfida!', fn: function () { trainerFight(id, who); } }];
  if (!came) opts.push({ label: 'Più tardi', fn: null });
  say((came ? [] : talk).concat(lines(beaten ? tr.after : tr.intro, id)).concat(plotBefore(id)).concat([foesLine(id)]), who, opts);
}

/* ---------- trainers who see Antonio: a "!" over their head, and they come to challenge him ---------- */
/* As in the games: a trainer not beaten yet looks ahead the way he faces, a few tiles; when Antonio steps into his
   sight a "!" pops up over his head, he walks up to Antonio and challenges him, with no saying later. Tullio, the
   rival, calls him from anywhere near. Once the talk or the fight is over the trainer walks back to his place (a
   beaten rival walks away, and is gone), and leaves Antonio alone for a while. */
const SIGHT = 4, RIVAL_NEAR = 5, ALERT_MS = 750, LEAVE_ALONE = 180000;
var noticed: Record<string, number> = {}, meeting: Person | null = null, away: { p: Person; map: string; done?: () => void }[] = [];
function seesAntonio(p: Person): boolean {
  var id = p.n.trainer;
  if (!id || p.n.ghost || p.path || !present(p) || st.beaten['tr-' + id] || Date.now() - (noticed[id] || 0) < LEAVE_ALONE) return false;
  var dx = st.x - p.x, dy = st.y - p.y;
  if (TRAINERS[id].rival) return Math.abs(dx) + Math.abs(dy) <= RIVAL_NEAR && !!walkPath(p.x, p.y, st.x, st.y, true);
  var v = DV[p.dir], d = v[0] ? dx * v[0] : dy * v[1];
  if ((v[0] ? dy : dx) !== 0 || d < 1 || d > SIGHT) return false;
  for (var k = 1; k < d; k++) if (blocked(M, p.x + v[0] * k, p.y + v[1] * k)) return false;
  return true;
}
/** a step has just ended: does a trainer see Antonio? then he comes to challenge him */
var spotting = true;
/** how many levels a trainer's weakest creature may be above the strongest of the player's, and still challenge him
    on sight: beyond that he only looks and lets it go (the challenge stays, talking to him) */
const SIGHT_GAP = 3;
function tooStrong(id: string): boolean {
  if (TRAINERS[id].rival || !teamMons().length) return false;
  var mine = Math.max.apply(null, teamMons().map(function (m) { return level(m.uid).lv; }));
  return Math.min.apply(null, teamOf(id).map(function (t) { return t.lv; })) - mine > SIGHT_GAP;
}
function spotted(): boolean {
  var p = spotting ? M.people.find(seesAntonio) : null;
  if (!p) return false;
  var n = p.n;
  if (tooStrong(n.trainer!)) {
    noticed[n.trainer!] = Date.now();
    bubble(esc(trainerNow(n.trainer!).title + ' ti ha visto, ti ha squadrato… e ha lasciato perdere. Le sue creature sono molto più forti delle tue: se vuoi sfidarlo lo stesso, parlagli.'));
    return false;
  }
  approach(p, function () { trainerTalk(n.trainer!, n.name || '', [], true); });
  return true;
}
function faceTo(x: number, y: number, tx: number, ty: number): Dir { return Math.abs(tx - x) > Math.abs(ty - y) ? (tx > x ? 'right' : 'left') : (ty > y ? 'down' : 'up'); }
/** the "!", the walk up to Antonio (who stands still meanwhile), and the two face each other: then `then` */
function approach(p: Person, then: () => void) {
  noticed[p.n.trainer!] = Date.now();
  halt(); lock(true); meeting = p;
  p.alert = performance.now(); p.dir = faceTo(p.x, p.y, st.x, st.y);
  sfx('spot');
  setTimeout(function () {
    walk(p, walkPath(p.x, p.y, st.x, st.y, true) || [], function () {
      p.alert = undefined;
      p.dir = faceTo(p.x, p.y, st.x, st.y); st.dir = OPP[p.dir];
      lock(false);
      then();
    });
  }, reduced ? 0 : ALERT_MS);
}
/** someone walks along the tiles, one per step at Antonio's pace (frame, below), then `done` */
function walk(p: Person, path: [number, number][], done?: () => void) {
  p.path = path;
  if (!away.some(function (a) { return a.p === p; })) away.push({ p: p, map: M.id });
  away.forEach(function (a) { if (a.p === p) a.done = done; });
}
function walkPeople(now: number) {
  away.slice().forEach(function (a) {
    var p = a.p;
    /* Antonio has gone elsewhere: everyone is back in place */
    if (a.map !== M.id) { home(a); return; }
    if (p.mv && now - p.mv.t0 >= STEP) p.mv = undefined;
    if (p.mv) return;
    if (p.path && p.path.length) {
      var nx = p.path[0][0], ny = p.path[0][1];
      if ((nx === st.x && ny === st.y) || (mover && nx === mover.tx && ny === mover.ty) || personAt(M, nx, ny)) return;   /* in the way: he waits */
      p.path.shift();
      p.dir = faceTo(p.x, p.y, nx, ny);
      p.mv = { fx: p.x, fy: p.y, t0: now }; p.x = nx; p.y = ny;
      return;
    }
    if (p.path) { p.path = undefined; var cb = a.done; a.done = undefined; if (cb) { cb(); return; } }
    /* the meeting is over: back to his place, or (beaten, and not there any more) away for good */
    if (meeting === p && (dialog || fight || overlayOpen() || busy)) return;
    if (meeting === p) meeting = null;
    if (p.leaving) { home(a); return; }
    if (!present(p)) { p.leaving = true; walk(p, walkAway(p.x, p.y, 6), function () { home(a); }); return; }
    if (p.x === p.n.x && p.y === p.n.y) { home(a); return; }
    walk(p, walkPath(p.x, p.y, p.n.x, p.n.y, false) || [], function () { home(a); });
  });
}
/** back on his own tile, facing his own way */
function home(a: { p: Person }) {
  var p = a.p;
  p.x = p.n.x; p.y = p.n.y; p.dir = p.n.dir || 'down'; p.mv = p.path = p.alert = undefined; p.leaving = false;
  away = away.filter(function (b) { return b.p !== p; });
  if (meeting === p) meeting = null;
}
/* the nets: the guardaparco gives the first ones and says how to catch; the net maker beside him sells the rest */
const GIFT_NETS = 5;
const NETS_TALK = ['Tieni anche questi: ' + GIFT_NETS + ' retini, per cominciare.',
  'Per catturare una creatura selvatica, prima la fai lottare con la tua e la stanchi. Poi nella lotta, in basso, c\'è la tua Borsa: tocca un retino e lancialo.',
  'Più la creatura è stanca, più è facile. Il retino trema un po\', e se regge è tua.',
  'Altri retini, anche più buoni, li vende il retaio qui accanto.'];
function giveNets() { st.bag = st.bag || {}; st.bag.retino = (st.bag.retino || 0) + GIFT_NETS; st.seen['dono-retini'] = true; save(); renderHud(); }
/** a save from before the gift: the guardaparco gives the nets the next time */
function netsGift(who: string) { giveNets(); sfx('pickup'); say(['Ah, {hero}! Come sta la tua creatura?'].concat(NETS_TALK), who); }
/** the guardaparco's prizes for the creature diary: all the ones reached, at once, and the next one */
function dexPrizeTalk(who: string) {
  var due = dexPrizesDue(), lines = ['Fammi vedere il tuo diario delle creature… ' + dexHad() + ' creature! Bravo, {hero}.'];
  due.forEach(function (p) { takeDexPrize(p); lines.push('Questo è per te: ' + prizeText(p) + '.'); });
  var nx = nextDexPrize();
  lines.push(nx ? (nx.p.all ? 'Se le prendi tutte, ti do il premio più grande: ' : 'Quando ne avrai ' + nx.at + ', ti do ' ) + prizeText(nx.p) + '.' : 'Le hai prese tutte. A Formia non l\'aveva mai fatto nessuno.');
  save(); renderHud(); sfx('badge');
  say(lines, who);
}
function starterTalk(who: string) {
  say(['Ciao {hero}! Lo sai cosa si racconta a Formia? Che era la città dei giganti Lestrigoni e del loro re Lamo, dove approdarono le navi di Ulisse.',
    'Quando i giganti se ne andarono, la loro magia restò nelle pietre, nel mare e negli ulivi. Da quella magia nascono le creature di Formia.',
    'Al parco ne sono nate tre. Una la affiderei a te: cresce con te, lotta con te, e un giorno cambia forma.'], who, [
    { label: 'Fammeli vedere', fn: function () {
      chooseStarter(function (uid) {
        var sp = SPECIES[idOf(uid) as keyof typeof SPECIES];
        giveNets();
        say(['Ottima scelta: ' + sp.name + ' è tuo!', 'Le creature selvatiche si nascondono nell\'erba alta e nelle pozze tra gli scogli: passaci in mezzo e salteranno fuori.'].concat(NETS_TALK), who, null, function () {
          /* and his grandson, who has just picked the one that beats it, wants to try it straight away */
          var r = M.people.find(function (q) { return q.n.trainer === 'rivale-1' && present(q); });
          if (r) { var n = r.n; approach(r, function () { trainerTalk('rivale-1', n.name || '', [], true); }); }
        });
      });
    } },
    { label: 'Più tardi', fn: null }
  ]);
}
export function sheet(html: string, cls?: string) {
  var o = $('overlay');
  o.className = 'overlay' + (cls ? ' ' + cls : ''); o.innerHTML = html; o.hidden = false;
  halt();
  return o;
}
export function closeSheet() { var o = $('overlay'); o.hidden = true; o.innerHTML = ''; o.className = 'overlay'; }
function face(id: string) { return SPR.personIn(id, formNow(id), 'smirk', '', SPR.thumb(id)); }
/** called by the battle screen when a story battle ends: the covo or the creature reacts, the team grows */
export function afterBattle(res: { tag: StoryTag; won: boolean; quit: boolean; caught?: boolean; bag?: Record<string, number>; bouts?: Bout[] }) {
  open(true);
  var tag = res.tag, key = tag.key || 'antonio';
  keepBag(res.bag); save(); renderHud();
  if (res.quit) { (res.bouts || []).forEach(function (b) { see(b.foe as SpeciesId); }); fight = null; save(); say(['Hai lasciato la lotta a metà. Puoi riprovare quando vuoi.']); return; }
  if (!res.won && !res.caught) mentorTip('loss');
  if (res.caught) { mentorTip('catch'); dexNotice(); }
  if ((tag.trainer || tag.wild) && fight) { fightAfter(res); return; }
  if (tag.tourney != null && tour) { tourneyAfter(res.won, key); return; }
  var cv0 = tag.covo ? COVI[tag.covo] : null;
  if (!cv0) return;
  var lv = tag.foeLv || cv0.level, bouts = res.bouts || [];
  bouts.forEach(function (b) { if (isSpecies(b.foe)) see(b.foe as SpeciesId); });
  /* each one who fought gets what he earned, as against a trainer; the covo pays a win */
  var pay = bouts.length ? fightPay(bouts, true) : [{ key: key, xp: 0, won: res.won }], cash = res.won ? moneyFor(lv, true) : 0;
  if (!bouts.length) return rewards(key, lv, res.won, true);
  if (res.won && !st.beaten[tag.covo!]) {
    st.beaten[tag.covo!] = true;
    if (!hasBadge(cv0)) st.badges.push(cv0.badge.id);
    save(); renderHud();
    say(cv0.win, cv0.leader, null, function () { award(cv0!, function () { rewardsAll(pay, cash, trainNews); }); });
  } else if (res.won) say(cv0.after, cv0.leader, null, function () { rewardsAll(pay, cash); });
  else say(cv0.lose, cv0.leader, null, function () { rewardsAll(pay, 0); });
}
/** after a pin: how many are left before the train, or that the train is waiting */
function pinsLeft(city: string, who: string): string {
  var need = cityCovi(city), left = need.filter(function (c) { return !hasBadge(c); }).length, G0 = gateFor('torino', firstHuman() as FriendId);
  return 'Hai battuto ' + who + '. ' + (left ? (left === 1 ? 'Ti manca una spilla' : 'Ti mancano ' + left + ' spille') + ' per ' + G0.label.charAt(0).toLowerCase() + G0.label.slice(1) + '.' : 'Hai tutte le spille: ' + G0.label.charAt(0).toLowerCase() + G0.label.slice(1) + ' ti aspetta in stazione.');
}
/** the last pin of Formia: the train is waiting (said once) */
function trainNews() {
  if (!cityCovi('formia').every(hasBadge) || st.seen['treno-pronto']) return;
  st.seen['treno-pronto'] = true; save();
  var G0 = gateFor('torino', firstHuman() as FriendId);
  say(['Hai tutte le spille di Formia!', 'In stazione, ' + G0.label.charAt(0).toLowerCase() + G0.label.slice(1) + ' ti aspetta: chiedi al capotreno.']);
}
function award(cv0: Covo, then?: () => void) {
  sfx('badge');
  var b = cv0.badge, L = C[cv0.leader];
  sheet('<div class="award" role="dialog" aria-modal="true" aria-labelledby="aw-t" style="--tc:' + tc(cv0.leader) + '">' +
    '<div class="award-badge">' + badgeSVG({ color: b.color, mark: b.mark }, 104) + '</div>' +
    '<h2 id="aw-t">Hai conquistato la ' + esc(b.name) + '</h2>' +
    '<div class="award-face">' + face(cv0.leader) + '</div>' +
    '<p>' + esc(pinsLeft(cv0.city, L.name)) + '</p>' +
    '<button class="btn primary" type="button" id="aw-ok">Continua</button></div>', 'result');
  $('aw-ok').addEventListener('click', function () {
    closeSheet();
    if (then) then(); else trainNews();
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
/* the menu in four tabs: the team (and who leads it), the journey (the tour, the stones, the badges), the diary
   (things done, things found, the creatures met), the map (and the hour); it opens on the last one used */
const TABS: { id: string; label: string }[] = [{ id: 'squadra', label: 'Squadra' }, { id: 'viaggio', label: 'Viaggio' }, { id: 'diario', label: 'Diario' }, { id: 'mappa', label: 'Mappa' }];
var menuTab = 'squadra';
function openMenu(tab?: string) {
  if (!running || dialog || busy) return;
  if (typeof tab === 'string') menuTab = tab;
  var city = M.city;
  var badges = cityCovi(city).map(function (cv0) {
    var b = cv0.badge, got = hasBadge(cv0);
    return '<li class="' + (got ? 'got' : '') + '">' + badgeSVG({ color: b.color, mark: b.mark, earned: got }, 40) +
      '<span><b>' + esc(b.name) + '</b><small>' + esc(cv0.name) + ' · ' + esc(C[cv0.leader].name) + (got ? '' : ' · da conquistare') + '</small></span></li>';
  }).join('');
  var panes: Record<string, string> = {
    squadra: teamHtml(),
    viaggio: '<div class="pickrow"><h3>Giro di Formia · ' + stopsDone() + ' su ' + (myStops().length - 1) + '</h3><ul class="wbadge-list diary tour">' + myStops().map(function (s0) {
      /* the stops still ahead stay a mystery: only the ones done and the next one are told */
      var done = s0.done(), next = s0 === nextStop();
      return '<li class="' + (done ? 'got' : next ? 'next' : 'secret') + '"><span class="diary-n" aria-hidden="true">' + (done ? '✓' : next ? '➜' : '?') + '</span><span><b>' + esc(done || next ? s0.text : '???') + '</b><small>' +
        esc(done ? s0.where + ' · fatto' : next ? s0.where + ' · prossima tappa' : 'da scoprire') + '</small></span></li>';
    }).join('') + '</ul></div>' + stonesHtml() + missionsHtml() +
      '<div class="pickrow"><h3>Spille</h3><ul class="wbadge-list">' + badges + '</ul></div>',
    diario: '<div class="pickrow"><h3>Diario di Formia</h3><ul class="wbadge-list diary">' + ACTIVITIES.map(function (a) {
      var n = timesDone(a.id), b = bestOf(a.id);
      return '<li class="' + (n ? 'got' : '') + '"><span class="diary-n" aria-hidden="true">' + (n ? n + '×' : '·') + '</span><span><b>' + esc(a.name) + '</b><small>' +
        esc(a.where + (n ? ' · fatto ' + (n === 1 ? 'una volta' : n + ' volte') + (b != null && a.score ? ' · record ' + a.score(b) : '') : ' · ancora da fare')) + '</small></span></li>';
    }).join('') + '</ul></div>' +
      '<div class="pickrow"><h3>Vedute · ' + views().filter(function (v) { return st.seen['veduta-' + v.id]; }).length + ' su ' + views().length + '</h3><ul class="wbadge-list diary">' + views().map(function (v) {
        var got = !!st.seen['veduta-' + v.id];
        return '<li class="' + (got ? 'got' : '') + '"><span class="diary-n" aria-hidden="true">' + (got ? '✓' : '·') + '</span><span><b>' + esc(got ? v.name : '???') + '</b><small>' +
          esc(got ? 'Vista da un belvedere.' : 'Un belvedere da trovare, in alto.') + '</small></span></li>';
      }).join('') + '</ul></div>' +
      '<div class="pickrow"><h3>Oggetti ritrovati · ' + foundItems().length + ' su ' + allItems().length + '</h3><ul class="wbadge-list">' + allItems().map(function (it) {
        var got = !!st.found[it.id], nm = ITEMS[it.move].name;
        return '<li class="' + (got ? 'got' : '') + '">' + itemSVG(ITEMS[it.move].icon, got, 40) + '<span><b>' + esc(nm.charAt(0).toUpperCase() + nm.slice(1)) + '</b><small>' +
          esc(got ? it.text + ' Nelle lotte della Storia non si perde più.' : 'Perso da qualche parte in città.') + '</small></span></li>';
      }).join('') + '</ul></div>' + dexHtml(),
    mappa: '<div class="pickrow"><h3>Formia</h3><div class="townmap" id="wm-map"></div></div>' +
      '<div class="pickrow"><h3>Ora del giorno</h3><div class="seg seg4" role="group" aria-label="Ora del giorno">' + DAY_MODES.map(function (m) {
        return '<button type="button" data-ora="' + m.id + '" aria-pressed="' + (m.id === dayMode) + '">' + esc(m.label) + '</button>';
      }).join('') + '</div><p class="hint" id="wm-ora">' + esc(hourHint()) + '</p></div>' +
      '<div class="pickrow"><h3>Velocità delle lotte</h3>' + speedChoice() + '<p class="hint">Quanto corrono le parole in lotta. Tenendo premuto Invio vanno avanti da sole.</p></div>' +
      '<div class="pickrow"><h3>Grafica della mappa</h3>' + gfxChoice() + '<p class="hint">Alta: le ombre che girano con il sole, le nuvole, il vento tra gli alberi, il mare che luccica, piccioni, farfalle e lucciole. Bassa: la mappa semplice, se il computer fatica.</p></div>' +
      '<p class="hint">La storia si salva da sola, su questo dispositivo. Dal titolo puoi giocarne un\'altra: ce ne sono tre.</p>' +
      '<div class="menu-actions"><button class="btn" type="button" id="wm-home">Torna al titolo</button>' +
      '<button class="btn" type="button" id="wm-reset">Ricomincia la storia</button></div>'
  };
  sheet('<div class="sheet menu" role="dialog" aria-modal="true" aria-labelledby="wm-t"><div class="sheet-h"><h2 id="wm-t">Storia · ' + esc(MAPS[city].name) + '</h2><button class="tb-btn" type="button" id="wm-x">Chiudi</button></div>' +
    '<div class="tabs" role="tablist">' + TABS.map(function (t) {
      return '<button type="button" role="tab" id="tab-' + t.id + '" data-tab="' + t.id + '" aria-controls="pane-' + t.id + '" aria-selected="' + (t.id === menuTab) + '">' + esc(t.label) + '</button>';
    }).join('') + '</div>' +
    TABS.map(function (t) { return '<div class="tabpane" role="tabpanel" id="pane-' + t.id + '" aria-labelledby="tab-' + t.id + '"' + (t.id === menuTab ? '' : ' hidden') + '>' + panes[t.id] + '</div>'; }).join('') + '</div>');
  var drawn = false;
  var show = function (id: string) {
    menuTab = id;
    each(document.querySelectorAll('[data-tab]'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-tab') === id)); });
    each(document.querySelectorAll('.tabpane'), function (pn) { (pn as HTMLElement).hidden = pn.id !== 'pane-' + id; });
    /* the town map is drawn when its tab is open, at the width it has there */
    if (id === 'mappa' && !drawn) { drawn = true; townMap($('wm-map')); }
  };
  each(document.querySelectorAll('[data-tab]'), function (b) { b.addEventListener('click', function () { sfx('click'); show(b.getAttribute('data-tab')!); }); });
  show(menuTab);
  wireTeam(openMenu);
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
  setTimeout(function () { var b = document.querySelector<HTMLElement>('[data-tab][aria-selected="true"]') || $('wm-x'); if (b) b.focus(); }, 30);
}


/* ---------- loop ---------- */
/** the tune of the place Antonio is in, by day or night: asked often, it changes only when the place or the light does
    (audio/zones.ts); open() forgets the last one, because a battle has played its own in between */
let lastTune = '', tuneWait: TuneWait = { now: '', next: '', since: 0 };
function tune() {
  const asked = worldMusic(M.id, areaName(), darkness(new Date()) > 0.5);
  /* the first tune after open() comes in at once; then a change waits a moment (settle), and crosses over */
  if (!lastTune) { tuneWait = { now: asked, next: '', since: 0 }; lastTune = asked; music(asked); return; }
  const t = settle(tuneWait, asked, performance.now());
  if (t !== lastTune) { lastTune = t; music(t, { fade: 2.6 }); }
}
export let running = false;
let raf = 0;
function frame(now: number) {
  if (!running) return;
  if (!M.inside && st.seen.intro && !st.seen['cic-night'] && darkness(new Date()) > 0.6) mentorTip('night');
  nudge(now);
  raf = requestAnimationFrame(frame);
  update(now);
  if (clickTo) arriveClick();
  walkPeople(now);
  checkRun(now);
  renderGoal();
  if (now - barAt > 300) {
    barAt = now; standOn(); renderBars(); tellRewards(); chapterTip(); tune();
    /* the first time a creature can do something on the map, Cicero says what */
    if (st.seen.intro && !st.seen['cic-power'] && !M.inside && !dialog && !between && !meeting && (powerOf('nuoto') || powerOf('scalata') || powerOf('volo'))) mentorTip('power');
  }
  if (skyFrom && now - skyFrom > SKY_MS) skyFrom = 0;
  drawWorld(now);
}
function start() { if (running) return; running = true; raf = requestAnimationFrame(frame); }
function stop() { running = false; cancelAnimationFrame(raf); halt(); }
function hide() { stop(); cancelRun(); if (dialog) closeDialog(function () {}); if (root) { root.hidden = true; $('wtoast').hidden = true; } document.body.classList.remove('in-world'); }

/* the story starts: the ghost of Cicero appears and explains the journey, how to play, and the first step */
function intro() {
  st.seen.intro = true; st.seen['cap-starter'] = true; save();
  /* the story of whoever is played: where he lives, the five covi of the others, and where his train goes */
  var me = firstHuman() as FriendId, G0 = gateFor('torino', me), lines = OPENING.slice();
  lines.splice(2, 0, LIVES[me] + ' A Formia ci sono sei covi, uno per ognuno di voi amici: batti gli altri cinque, e poi il treno ti porterà a ' + G0.station + '.');
  say(lines, CICERO);
}
/* ---------- Cicero, when he is needed ---------- */
/* He is not always there: he appears (on the map, beside Antonio, and in the corner) when he has something to say,
   a new chapter, the first time of something, a word when Antonio seems lost, or when called with C; then he fades. */
/** when the ghost is on screen, in performance.now() time: from when he appeared, until when he stays */
export const cicPresence = { from: -1e9, until: -1e9 };
const CIC_IN = 400, CIC_OUT = 900;
function cicAppear(ms: number) {
  var now = performance.now();
  if (now > cicPresence.until + CIC_OUT) cicPresence.from = now;
  cicPresence.until = Math.max(cicPresence.until, now + ms);
  helpAt = now;
}
/** how visible the ghost is now, 0 to 1: fading in when he appears, out when he has finished */
export function ciceroShown(now: number): number {
  if (now > cicPresence.until + CIC_OUT) return 0;
  return Math.max(0, Math.min(1, (now - cicPresence.from) / CIC_IN, (cicPresence.until + CIC_OUT - now) / CIC_OUT));
}
/** asked: where Antonio is in the story, the challenge ahead, whether the team is ready */
function mentorTalk() {
  if (!running || dialog || busy || overlayOpen()) return;
  say(advice(), CICERO);
}
/* a word from the corner, without stopping the game: one at a time, each for a few seconds */
var bubbleQ: string[] = [], bubbleT: ReturnType<typeof setTimeout> | undefined;
function bubble(html: string) {
  if (!built) return;
  var el = $('wcic-say'), corner = $('wcic');
  if (!el.hidden) { bubbleQ.push(html); return; }
  var long = Math.min(14000, 4500 + html.length * 45);
  el.innerHTML = '<b>Cicerone</b> ' + heroText(html);
  el.hidden = false; el.classList.remove('out');
  corner.hidden = false; corner.classList.remove('out'); corner.classList.add('talking');
  cicAppear(long);
  clearTimeout(bubbleT);
  bubbleT = setTimeout(function () {
    el.classList.add('out');
    bubbleT = setTimeout(function () {
      el.hidden = true; corner.classList.remove('talking');
      var n = bubbleQ.shift();
      if (n) { bubble(n); return; }
      corner.classList.add('out');
      bubbleT = setTimeout(function () { corner.hidden = true; corner.classList.remove('out'); }, 500);
    }, 500);
  }, long);
}
/* when Antonio seems lost (a few minutes without a step forward on the tour, and without a word from him), Cicero
   appears with the next stop */
var helpAt = 0, helpDone = -1;
function nudge(now: number) {
  var d = stopsDone();
  if (d !== helpDone || !helpAt) { helpDone = d; helpAt = now; return; }
  if (now - helpAt < 240000 || dialog || overlayOpen() || busy || !st.seen.intro || M.inside || run) return;
  helpAt = now;
  bubble('Ti vedo un po\' perso. ' + esc(nextStop().tip) + ' <small>(C per i dettagli)</small>');
}
/** the first time something happens, Cicero explains it from the corner */
export function mentorTip(id: string) { var t = tipOnce(id); if (t) { save(); bubble(esc(t.join(' '))); } }

function open(quiet?: boolean) {
  build();
  ['home', 'battle'].forEach(function (id) { var el = $(id); if (el) el.hidden = true; });
  document.body.classList.remove('in-battle'); document.body.classList.add('in-world');
  root.hidden = false;
  window.scrollTo(0, 0);
  setScreen('world');
  setMap(st.map); setPace();
  resize(); renderHud();
  lastTune = ''; tune();
  var go = function () {
    invalidate(); start();
    if (!quiet && !st.seen.intro) intro();
    else if (!quiet) askPending();
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
    screenOf: screenOf,
    /* the automatic player (tools/playtest): the next stop, the tour, what the story has; skip an activity */
    goal: function () { var h = heading(M.id); return h ? { x: h.x, y: h.y, exact: h.exact, id: h.stop.id, text: h.stop.text } : null; },
    stops: function () { return myStops().map(function (q) { return [q.id, q.done()]; }); },
    lv: function () { return JSON.parse(JSON.stringify({ lv: st.lv, money: st.money, badges: st.badges, mons: (st.mons || []).map(function (m) { return { uid: m.uid, sp: m.sp, home: !!m.home }; }), bag: st.bag })); },
    skipStop: function () { var q = nextStop(); st.done = st.done || {}; st.done[q.id] = (st.done[q.id] || 0) + 1; save(); renderHud(); return q.id; },
    hiding: function () { var h = hidingAt(st.x, st.y); return h ? h.id : null; },
    /* a creature for who is played, as the park keeper gives it (playtests that go to a covo) */
    adopt: function (sp: SpeciesId, lv: number) { var uid = addCreature(sp, lv); st.seen.starter = true; save(); renderHud(); return uid; },
    /* trainers who see Antonio and come to challenge him: off in the playtests that walk past them */
    spotting: function (on: boolean) { spotting = on; },
    who: function (id: string) { var q = M.people.find(function (o) { return o.n.id === id; }); return q ? { x: q.x, y: q.y, dir: q.dir } : null; },
    /* the way through a place, from its entry, as the validator found it; and straight to another map (playtests) */
    way: function () { return M.place ? placeProof(M).way : []; },
    travel: travel,
    /* experience for someone, as after a battle: what it learns and the form it takes (playtests) */
    xp: function (key: string, n: number) { var g = gainXp(key, n); save(); renderHud(); growthSay(g, [nameOf(key) + ' guadagna ' + n + ' punti esperienza.']); },
    /* a wild creature of a hiding place jumps out, as if Antonio had just stepped into it (playtests) */
    meet: function (id: string) { if (HIDINGS[id]) meet(HIDINGS[id]); },
    /* a shop, as from its counter */
    shop: function (id: string) { if (SHOPS[id]) openShop(id); },
    /* one creature of a kind, at a level, jumps out of the rocks of Gianola (to look at the shows of any of them) */
    wild: function (sp: SpeciesId, lv: number) { var m = [{ sp: sp, lv: [lv, lv] as [number, number], w: 1 }]; meet({ id: 'gianola', name: 'Gianola', on: 'scogli', day: m, night: m }); },
    overview: overview,
    moto: function () { return { at: moto(), sella: !!st.sella }; },
    pos: function () { return { map: st.map, x: st.x, y: st.y, dir: st.dir, running: running, moving: !!mover, busy: busy, dialog: !!dialog, opts: !!(dialog && dialog.showingOpts), text: dialog ? dlgTxt.textContent : '', swim: moveMode.swim, climb: moveMode.climb, sky: !!skyFrom }; }
  }
};
