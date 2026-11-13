import type { Building, Dir, Npc } from '../data/maps/types';
import { COVI } from '../data/covi';
import { CHARS } from '../data/characters';
import { COVO_PLACES, covoOfBuilding } from '../data/covo-places';
import { QUIZZES, type Question } from '../data/quizzes';
import { MAPS } from '../data/maps';
import { st, save } from '../save/story-progress';
import { invited, mine, hasGift, gifts, keysCovo, hasKeys, charmOn } from '../story/lairs';
import { M, DV, blocked, key, rideable, quizPassed, type Person } from '../story/maps';
import { firstHuman, teamMons } from '../story/growth';
import { myStops } from '../story/goals';
import { linesNow } from '../story/plot';
import { startActivity } from './activities';
import { say, notify, renderHud, trainerFight, closeSheet, stepAside } from './story-screen';
import { esc } from './dom';
import { sfx } from '../audio';

/* The covi on the screen (data/covo-places.ts, story/lairs.ts): who sends the player to them, the doors that open with
   the invitation, the questions at the doors of three of them, the gifts of the keepers, and the keys of the scooter. */

/* ---------- the invitation ---------- */
/** someone who sends the player to a covo: what has happened, and the invitation. True when they have had their say
    (whatever else they do, a shop, the quiz, comes after) */
export function hookTalk(n: Npc): boolean {
  var id = n.hook!, P = COVO_PLACES[id];
  if (!P || mine(id)) return false;
  var h = P.hook;
  if (st.beaten[id]) {
    if (st.seen['grazie-' + id]) return false;
    st.seen['grazie-' + id] = true; save();
    say(h.after, n.name);
    return true;
  }
  /* Claudia's invitation is won at the quiz of Morgana (three right answers out of five) */
  if (id === 'morgana') {
    if (invited(id)) {
      if (st.seen['invito-' + id]) return false;
      st.seen['invito-' + id] = true; save(); renderHud();
      say(['Tre risposte giuste! Ecco l\'invito al tavolo del Padre, scritto in rosso.', h.wait[0]], n.name, null, function () { notify('Hai l\'<b>invito</b> per ' + esc(COVI[id].name) + '.'); });
      return true;
    }
    var opts = [{ label: 'Siediti al tavolo', fn: function () { startActivity('quiz', n); } }, { label: 'Più tardi', fn: null }];
    if (st.seen['hook-' + id]) say(['Allora, il quiz? Ne servono almeno tre giuste su cinque, per l\'invito di Claudia.'], n.name, opts);
    else { st.seen['hook-' + id] = true; save(); say(h.say, n.name, opts); }
    return true;
  }
  if (!st.seen['invito-' + id]) {
    say(h.say, n.name, null, function () {
      st.seen['invito-' + id] = true; save(); renderHud();
      sfx('pickup');
      notify('Hai l\'<b>invito</b> per ' + esc(COVI[id].name) + '.');
    });
    return true;
  }
  /* invited, not beaten yet: a word on the way, unless they have something else to do */
  if (n.shop || n.activity || n.trainer) return false;
  say(h.wait, n.name);
  return true;
}

/* ---------- the doors of the covi ---------- */
/** Antonio's flat: closed to the others until the neighbour gives the keys, while he is still in his dome */
function flatShut(): boolean { return firstHuman() !== 'antonio' && !invited('palamendola'); }
/** a door that does not open now: it says why (unless `again`, the same bump) */
export function doorShut(b: Building, again: boolean): boolean {
  if (b.id === 'casa' && flatShut()) {
    if (!again) say(['La porta di casa di Antonio è chiusa a chiave. Dal citofono, solo un ronzio.', 'La vicina, qui in via Amendola, ha le chiavi.']);
    return true;
  }
  var P = covoOfBuilding(b.id);
  if (!P) return false;
  var id = P.covo, me = mine(id);
  /* the keeper's own home, when he is the one played; the covi that are not homes stay shut to him: nothing to beat */
  if (me && P.home) return false;
  if (me) { if (!again) say([P.quiet[0]]); return true; }
  if (invited(id)) return false;
  if (!again) say(P.sealed.concat(['Qualcuno in città sa cosa è successo: ' + P.hook.where + '.']));
  return true;
}
/** where a door leads: the keeper's home, for the keeper (null: where it says) */
export function doorRoute(b: Building): { to: string; x: number; y: number; dir?: Dir } | null {
  var P = covoOfBuilding(b.id);
  if (!P || !P.home || !mine(P.covo)) return null;
  var m = MAPS[P.home];
  return { to: P.home, x: m.start[0], y: m.start[1], dir: m.start[2] };
}

/* ---------- the quizzes at the doors ---------- */
function shuffled<T>(a: T[]): T[] { var o = a.slice(); for (var i = o.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = o[i]; o[i] = o[j]; o[j] = t; } return o; }
export function quizTalk(p: Person) {
  var n = p.n, q = QUIZZES[n.quiz!];
  if (!q || quizPassed(q.id)) return;
  var who = n.name || '', picks = shuffled(q.pool).slice(0, q.ask);
  var ask = function (i: number) {
    var Q: Question = picks[i], right = Q.a[0];
    var opts = shuffled(Q.a.slice()).map(function (ans) {
      return { label: ans, fn: function () { ans === right ? good(i) : bad(Q); } };
    });
    say(['Domanda ' + (i + 1) + ' di ' + q.ask + '. ' + Q.q], who, opts);
  };
  var good = function (i: number) {
    sfx('pickup');
    if (i + 1 < q.ask) { say(['Giusto. ' + picks[i].why], who, null, function () { ask(i + 1); }); return; }
    st.seen['quiz-' + q.id] = true; save(); renderHud();
    say(['Giusto. ' + picks[i].why].concat(q.ok), who, null, function () { notify('<b>' + esc(who) + '</b> si fa da parte.'); stepAside(); });
  };
  var bad = function (Q: Question) {
    sfx('weak');
    var then = teamMons().length ? [{ label: 'Lotta!', fn: function () { trainerFight(q.trainer, who); } }] : null;
    say([q.wrong, 'La risposta giusta era: ' + Q.a[0] + '. ' + Q.why].concat(teamMons().length ? ['Adesso, o mi batti, o torni a studiare.'] : ['Torna con una creatura, e si lotta. Oppure ripassa e riprova.']), who, then);
  };
  say(linesNow(n).concat(['Tre domande. Tutte giuste, e passi. Una sbagliata, e si lotta.']), who, [{ label: 'Rispondo', fn: function () { ask(0); } }]);
}

/* ---------- the gift of a keeper, and the keys of the scooter ---------- */
/** after the pin: what the keeper gives besides it (and the keys of the scooter, if he had them) */
export function keeperGifts(id: string, then: () => void) {
  var P = COVO_PLACES[id], leader = COVI[id].leader, lines: string[] = [];
  if (!P) { then(); return; }
  if (keysCovo() === id && !st.seen['chiavi-liberty']) {
    st.seen['chiavi-liberty'] = true;
    lines.push('Ah, e queste sono tue: le chiavi del Liberty. Le avevi lasciate sul tavolo del caminetto, e l\'eco me le aveva fatte nascondere. Scusa.');
  }
  lines.push(P.gift.say);
  /* one at a time: the freed keeper heard, in the echo, the voice of the next one (story/goals.ts, the tour) */
  var nx = myStops().find(function (q) { return q.id.indexOf('covo-') === 0 && q.id !== 'covo-' + id && !q.done(); });
  var np = nx ? COVO_PLACES[nx.id.slice(5)] : null;
  if (np) {
    var f = CHARS[np.leader];
    lines.push('Un\'ultima cosa. Nell\'eco, prima di svegliarmi, sentivo un\'altra voce. Era ' + f.name + '.', 'Se è successo anche a ' + (f.fem ? 'lei' : 'lui') + '… vai a sentire: ' + np.hook.where + '. Qualcuno là saprà dirti di più.');
  } else lines.push('Mi sa che ero ' + (CHARS[leader].fem ? 'l\'ultima' : 'l\'ultimo') + ', nell\'eco. Adesso il treno dovrebbe ripartire.');
  save();
  say(lines, leader, null, function () {
    sfx('badge');
    notify('Hai ricevuto: <b>' + esc(P.gift.name) + '</b>. ' + esc(P.gift.text) + (st.seen['chiavi-liberty'] && lines.length > 1 ? ' E le chiavi del Liberty!' : ''));
    then();
  });
}
/** the scooter cannot be ridden without its keys: who has them */
export function noKeys(): boolean {
  if (hasKeys()) return false;
  var c = keysCovo(), f = c ? COVI[c].leader : null;
  say(['Il Liberty è lì, ma le chiavi non ce le hai.', f ? 'Ieri sera al caminetto le hai lasciate sul tavolo, e le ha prese ' + CHARS[f].name + '. Adesso è chiuso nel suo covo.' : 'Chissà dove sono finite.']);
  return true;
}

/* ---------- the gifts in the menu (Mappa) ---------- */
export function giftsPane(): string {
  var g = gifts();
  if (!g.length && hasKeys()) return '';
  var rows = g.map(function (x) {
    var act = '';
    if (x.id === 'fischio') act = '<button class="btn" type="button" id="gift-fischio">Fischia</button>';
    if (x.id === 'martisor') act = '<button class="btn" type="button" id="gift-martisor" aria-pressed="' + charmOn() + '">' + (charmOn() ? 'Toglilo' : 'Indossalo') + '</button>';
    if (x.id === 'cuffie') act = '<select id="gift-cuffie" aria-label="Musica">' + RADIO.map(function (r) { return '<option value="' + r[0] + '"' + ((st.radio || '') === r[0] ? ' selected' : '') + '>' + esc(r[1]) + '</option>'; }).join('') + '</select>';
    return '<li class="got"><span class="diary-n" aria-hidden="true">✦</span><span><b>' + esc(x.name) + '</b><small>' + esc(x.text) + '</small></span>' + act + '</li>';
  });
  var keys = hasKeys() ? '' : '<li><span class="diary-n" aria-hidden="true">·</span><span><b>Le chiavi del Liberty</b><small>' + esc(keysLine()) + '</small></span></li>';
  return '<div class="pickrow"><h3>I doni dei covi</h3><ul class="wbadge-list diary gifts">' + rows.join('') + keys + '</ul></div>';
}
function keysLine(): string { var c = keysCovo(); return c ? 'Le ha ' + CHARS[COVI[c].leader].name + ', chiuso nel suo covo.' : 'Chissà dove sono.'; }
/** what the headphones of Zendavid can play: the tunes of Formia (audio/tracks.ts), or the one of the place */
export const RADIO: [string, string][] = [['', 'Quella del posto'], ['world', 'Formia'], ['mola', 'Mola'], ['castellone', 'Castellone'], ['vindicio', 'Vindicio'], ['covo', 'I covi'], ['home', 'Il titolo']];
export function wireGifts(reopen: () => void) {
  var f = document.getElementById('gift-fischio');
  if (f) f.addEventListener('click', function () { closeSheet(); whistle(); });
  var m = document.getElementById('gift-martisor');
  if (m) m.addEventListener('click', function () {
    st.martisor = !st.martisor; save(); sfx('click');
    notify(st.martisor ? 'Il mărțișor al polso: le creature selvatiche ti lasciano in pace.' : 'Il mărțișor in tasca: le creature selvatiche tornano a farsi vedere.');
    reopen();
  });
  var c = document.getElementById('gift-cuffie') as HTMLSelectElement | null;
  if (c) c.addEventListener('change', function () { st.radio = c!.value || undefined; save(); sfx('click'); radioHook(); });
}
let radioHook: () => void = function () { /* set by the story screen */ };
export function onRadio(f: () => void) { radioHook = f; }

/** Forchetta's whistle: the scooter comes to a free tile next to the player, out in Formia */
export function whistle() {
  if (!hasGift('fischio')) return;
  if (!hasKeys()) { noKeys(); return; }
  if (M.inside || M.id !== 'formia' || st.sella) { say(['Il fischio di Forchetta si sente solo all\'aperto, a Formia.']); return; }
  var spots: [number, number][] = [];
  (['left', 'right', 'down', 'up'] as Dir[]).forEach(function (d) { var x = st.x + DV[d][0], y = st.y + DV[d][1]; if (!blocked(M, x, y) && rideable(M, x, y) && !M.at[key(x, y)]) spots.push([x, y]); });
  if (!spots.length) { say(['Fischi… ma qui intorno il Liberty non ha dove fermarsi. Prova su una strada.']); return; }
  st.moto = { map: 'formia', x: spots[0][0], y: spots[0][1], dir: spots[0][0] < st.x ? 'right' : 'left' };
  save(); sfx('scooter');
  notify('Fischio alla Forchetta: il Liberty arriva da solo e si ferma accanto a te.');
}
