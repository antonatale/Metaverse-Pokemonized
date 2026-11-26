/* The sea (Antonio, 21 November 2026): the races on the windsurf, the missions out on the gulf, the wind on the screen.
   Data in data/sea.ts, state in story/sea.ts, the sailing itself in story/movement.ts and story/wind.ts. */
import type { Npc } from '../data/maps/types';
import { loot, type Loot } from './bag';
import { FORMIA_SPOT } from '../data/maps/formia-ground';
import { COURSES, SEA_JOBS, type Course, type SeaJob } from '../data/sea';
import { WS_ROUTE, WS_BACK } from '../data/nicola';
import { st, save } from '../save/story-progress';
import { M, moveMode, isSea } from '../story/maps';
import { halt } from '../story/movement';
import { sailing } from '../story/movement';
import { windAt, pointOfSail, SAIL } from '../story/wind';
import { raceTime, wayLength } from '../story/regatta';
import { GOOD } from '../data/sea';
import { sea, jobOf, jobStarted, jobDone, jobFlag, thingFound, foundCount, openJobs, type SeaMark } from '../story/sea';
import { record, bestOf } from '../story/activities';
import { earn, powerOf } from '../story/growth';
import { lead, startLead, sailBack, atEnd, passed } from '../story/lead';
import { sfx } from '../audio';
import { say, notify, renderHud, root, dialog } from './story-screen';
import { esc, $, reduced } from './dom';
import { coins } from '../data/growth';

/** the regatta goes round these points of the way of the start (data/nicola.ts, WS_ROUTE) */
const REGATTA_MARKS = [2, 4, 5, 7, 9, 10, 12, 14];
const clock = (s: number) => Math.floor(s / 60) + ':' + ('0' + Math.floor(s % 60)).slice(-2) + ',' + Math.floor((s * 10) % 10);
const spot = (id: string): [number, number] | null => FORMIA_SPOT[id] || null;

/* ---------- the races ---------- */
export function courseOf(id: string): Course | undefined { return COURSES.filter(function (c) { return c.id === id; })[0]; }
/** the marks of a race, on the map */
function marksOf(c: Course): [number, number][] {
  if (c.id === 'regata') return REGATTA_MARKS.map(function (k) { return WS_ROUTE[k].at; });
  return c.marks.map(spot).filter(function (p): p is [number, number] { return !!p; });
}
/** someone offers a race: what it is, the best time, and off to the start */
export function offerCourse(id: string, n: Npc) {
  var c = courseOf(id);
  if (!c) return;
  if (c.rival && !st.seen['ws-landed']) { say(['Prima arriviamo a Gianola insieme, uagliò. Poi ti sfido.'], 'Nicola'); return; }
  if (!st.seen.tavola) { say(['Per questa ti serve un windsurf. Nicola, all\'Eclipse, ne presta uno a chi ha voglia di imparare.'], n.name); return; }
  var best = bestOf(c.id);
  say(c.ask.concat(best != null ? ['Il tuo record: ' + clock(best) + '.'] : []), n.id === 'nicola' ? 'Nicola' : n.name, [
    { label: 'Al via!', fn: function () { startCourse(c!); } }, { label: 'Più tardi', fn: null }
  ]);
}
function startCourse(c: Course) {
  var at = spot(c.start);
  if (!at || M.id !== 'formia') return;
  halt();
  root.classList.add('fade');
  setTimeout(function () {
    st.x = at![0]; st.y = at![1]; st.dir = 'right';
    moveMode.swim = true; moveMode.board = true; delete st.sella;
    save(); renderHud();
    root.classList.remove('fade');
    var w = windAt(Date.now()), marks = marksOf(c), ideal = raceTime(at!, marks, w), par = Math.round(ideal * GOOD);
    say(['Vento di oggi: ' + w.name.toLowerCase() + (w.strength > 0.75 ? ', forte' : w.strength < 0.5 ? ', leggero' : '') + '. Con questo vento un buon tempo è ' + clock(par).replace(/,\d$/, '') + '.', 'Pronti… via!'], null, null, function () {
      sea.race = { id: c.id, marks: marks, got: 0, t: 0, last: performance.now(), rival: !!c.rival, par: par };
      if (c.rival) { var way = WS_ROUTE.map(function (p) { return p.at; }), L = startLead(way); L.race = wayLength(way) / (ideal * c.rival); }
      sfx('whoosh');
    });
  }, reduced ? 0 : 200);
}
function endRace(won: boolean | null, secs: number) {
  var r = sea.race, c = r ? courseOf(r.id) : null;
  sea.race = null;
  if (lead.now && lead.now.race) { lead.now.race = undefined; sailBack(WS_BACK); }
  if (!c) return;
  if (won === null) { notify('<b>' + esc(c.name) + '</b>: gara annullata, sei sceso a terra.'); return; }
  var par = r ? r.par : 0, good = !!won && secs <= par;
  var better = won ? record(c.id, Math.round(secs * 10) / 10) : (record(c.id), false);
  if (good) { earn(c.rival ? 12 : 6); renderHud(); }
  sfx(won ? (better ? 'badge' : 'found') : 'lost');
  var who = c.npc === 'nicola' ? 'Nicola' : null;
  var head = won ? 'Arrivo! ' + clock(secs) + (better ? ' · nuovo record' : '') + (good ? ' · sotto il tempo buono, premio di ' + coins(c.rival ? 12 : 6) : '') : (c.rival ? 'Nicola è arrivato prima di te.' : 'Gara finita.');
  say([head].concat(won && (good || c.rival) ? c.win : c.lose), who);
}

/* ---------- the missions at sea ---------- */
/** talking to someone who has a mission at sea: offered, then how it goes, then done. `then` is what that one
    always does (a shop, a canoe), offered beside it */
export function seaTalk(n: Npc, then: () => void): boolean {
  var j = jobOf(n.id);
  if (!j) return false;
  var who = n.id === 'nicola' ? 'Nicola' : n.name;
  if (!jobStarted(j) && !st.seen.tavola && !powerOf('nuoto')) {
    say(j.ask.concat(['…Ma tu come ci vai, al largo? Ti serve un windsurf, o una creatura che sa nuotare.']), who, [{ label: 'Va bene', fn: then }]);
    return true;
  }
  if (!jobStarted(j) || (j.adrift && !sea.kid)) {
    say(j.ask, who, [{ label: 'Ci penso io', fn: function () { startJob(j!); } }, { label: 'Dopo', fn: then }]);
    return true;
  }
  if (foundCount(j) >= j.things.length) { finishJob(j, who); return true; }
  say(j.again.concat(j.things.length > 1 ? ['Ne hai trovati ' + foundCount(j) + ' su ' + j.things.length + '.'] : []), who, [{ label: 'Vado', fn: null }, { label: 'Altro', fn: then }]);
  return true;
}
function startJob(j: SeaJob) {
  st.seen[jobFlag(j)] = true; save();
  sfx('found');
  notify('<b>Missione in mare:</b> ' + esc(j.name) + '.');
  if (j.adrift) {
    var at = spot(j.things[0]);
    if (at) sea.kid = { x: at[0], y: at[1], t: 0, last: performance.now(), limit: j.adrift * 1000, next: 1500 };
  }
}
function finishJob(j: SeaJob, who?: string) {
  st.seen['ms-sea-' + j.id] = true;
  earn(j.pay.money);
  st.bag = st.bag || {};
  var items = j.pay.items || {};
  for (var k in items) st.bag[k] = (st.bag[k] || 0) + (items as Record<string, number>)[k];
  if (j.pay.sail) st.seen['vela-regata'] = true;
  save(); renderHud();
  sfx('badge');
  var got: Loot[] = [{ id: 'sesterzi', n: j.pay.money }].concat(Object.keys(items).map(function (k) { return { id: k, n: (items as Record<string, number>)[k] }; }));
  say(j.done, who || null, null, function () {
    loot('Missione in mare compiuta!', got, j.pay.sail ? 'E la vela da regata di Nicola: sul windsurf prendi una marcia in più.' : null);
  });
}

/** the missions at sea in the menu: the ones heard of, how far they are, who to ask for the others */
export function seaJobsHtml(): string {
  var done = SEA_JOBS.filter(jobDone).length;
  return '<div class="pickrow"><h3>In mare · ' + done + ' su ' + SEA_JOBS.length + '</h3><ul class="wbadge-list">' + SEA_JOBS.map(function (j) {
    var did = jobDone(j), on = jobStarted(j) && !did;
    var note = did ? 'Fatta' : on ? (j.adrift ? 'Presto! ' + j.where : 'Trovati ' + foundCount(j) + ' su ' + j.things.length + ' · ' + j.where) : j.where;
    return '<li class="' + (did ? 'got' : '') + '"><span><b>' + esc(did || on ? j.name : '???') + '</b><small>' + esc(note) + '</small></span></li>';
  }).join('') + '</ul></div>';
}

/* ---------- every frame ---------- */
/** the time of the swimmer adrift goes on only while nobody talks and no window is open */
function tick(k: { t: number; last: number }, now: number) { if (!dialog && $('overlay').hidden) k.t += Math.min(100, now - k.last); k.last = now; return k.t; }
var shownWind = '', raceLine = '';
export function seaFrame(now: number) {
  var out = M.id !== 'formia' || M.inside;
  var hudW = $('wwind');
  /* the wind, when at sea */
  var atSea = !out && moveMode.swim;
  if (hudW) {
    if (!atSea) { if (!hudW.hidden) { hudW.hidden = true; shownWind = ''; } }
    else {
      var w = windAt(Date.now()), pos = moveMode.board ? sailing.pos || pointOfSail(st.dir, w) : null, falling = sailing.fallUntil > now;
      var arrow = Math.round(((w.from + 180) % 360) / 45) % 8, ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];
      var text = '<b>' + ARROWS[arrow] + '</b> ' + w.name + ' ' + '●'.repeat(1 + Math.round(w.strength * 2)) + '○'.repeat(2 - Math.round(w.strength * 2)) +
        (falling ? ' · <em>in acqua!</em>' : pos ? ' · ' + SAIL[pos].label + (sailing.gust && w.gust > 0.55 ? ' · <em>raffica!</em>' : '') : '');
      /* in a race, its clock under the wind (worked out below, the frame before) */
      if (raceLine) text += '<span class="wclock">' + raceLine + '</span>';
      if (text !== shownWind) { hudW.innerHTML = text; hudW.hidden = false; shownWind = text; }
      /* straight into the wind, once in a while: how to get out of it */
      if (pos === 'controvento' && now - sailing.said > 15000 && moveMode.board) { sailing.said = now; notify('Controvento la tavola non va: <b>bordeggia</b>. Alterna due direzioni, a zig-zag, e risali il vento di bolina.'); }
    }
  }
  /* the race */
  var r = sea.race;
  if (r) {
    if (out || !moveMode.swim) endRace(null, 0);
    else {
      if (!dialog && $('overlay').hidden) r.t += Math.min(0.1, (now - r.last) / 1000);
      r.last = now;
      var secs = r.t, m = r.marks[r.got];
      if (m && Math.max(Math.abs(m[0] - st.x), Math.abs(m[1] - st.y)) <= 1) { r.got++; sfx('pickup'); }
      if (r.got >= r.marks.length) endRace(true, secs);
      else if (r.rival && lead.now && atEnd(lead.now)) endRace(false, secs);
      /* racing Nicola: how many marks he has rounded (the marks are points of his way, REGATTA_MARKS) */
      var his = r.rival && lead.now ? REGATTA_MARKS.filter(function (k) { return k <= passed(lead.now!); }).length : -1;
      var rt = r && sea.race ? 'Boa ' + Math.min(r.got + 1, r.marks.length) + '/' + r.marks.length + ' · ' + clock(secs) + (his >= 0 ? ' · Nicola ' + his + '/' + r.marks.length : '') : '';
      raceLine = esc(rt);
    }
  } else raceLine = '';
  /* the things the missions ask for, found by coming alongside them */
  var marks: SeaMark[] = [];
  if (!out) {
    if (sea.race) sea.race.marks.forEach(function (p, k) { if (k >= sea.race!.got) marks.push({ x: p[0], y: p[1], kind: k === sea.race!.got ? 'next' : 'mark', n: k + 1 }); });
    openJobs().forEach(function (j) {
      if (j.adrift) return;
      j.things.forEach(function (id, k) {
        if (thingFound(j, k)) return;
        var p = spot(id);
        if (!p) return;
        if (moveMode.swim && Math.max(Math.abs(p[0] - st.x), Math.abs(p[1] - st.y)) <= 1) {
          st.seen[jobFlag(j) + '-' + k] = true; save(); sfx('pickup');
          notify('<b>' + esc(j.name) + '</b>: ' + (j.things.length > 1 ? foundCount(j) + ' su ' + j.things.length + '.' : 'trovata!') + (foundCount(j) >= j.things.length ? ' Torna da chi te l\'ha chiesto.' : ''));
          return;
        }
        marks.push({ x: p[0], y: p[1], kind: j.thing as SeaMark['kind'] });
      });
    });
    /* the swimmer adrift: the wind carries him a tile at a time; reached, he is safe; too late, he is out of sight */
    var kid = sea.kid;
    if (kid) {
      var j0 = openJobs().filter(function (q) { return !!q.adrift; })[0];
      if (!j0) sea.kid = null;
      else if (tick(kid, now) > kid.limit) { sea.kid = null; delete st.seen[jobFlag(j0)]; save(); sfx('lost'); notify('Il ragazzo col materassino è troppo lontano: l\'ha recuperato la barca dei bagnini. Riparla con la bagnina per riprovare.'); }
      else {
        if (kid.t > kid.next) {
          var w2 = windAt(Date.now()), dx = Math.abs(w2.to[0]) > Math.abs(w2.to[1]) ? Math.sign(w2.to[0]) : 0, dy = dx ? 0 : Math.sign(w2.to[1]);
          if (isSea(M, kid.x + dx, kid.y + dy)) { kid.x += dx; kid.y += dy; }
          kid.next = kid.t + 1500;
        }
        if (moveMode.swim && Math.max(Math.abs(kid.x - st.x), Math.abs(kid.y - st.y)) <= 1) {
          st.seen[jobFlag(j0) + '-0'] = true; sea.kid = null;
          finishJob(j0, 'Bagnina di Scauri');
        } else marks.push({ x: kid.x, y: kid.y, kind: 'ragazzo', n: Math.ceil((kid.limit - kid.t) / 1000) });
      }
    }
  }
  sea.marks = marks;
}
/** a story left, or the map: no race goes on */
export function seaStop() { if (sea.race) { sea.race = null; if (lead.now && lead.now.race) { lead.now.race = undefined; sailBack(WS_BACK); } } sea.kid = null; }
