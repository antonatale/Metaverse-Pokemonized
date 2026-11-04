import { CHARS as C, ROSTER, type Character, type CharId, type FriendId } from '../data/characters';
import { COVI } from '../data/covi';
import { MAPS } from '../data/maps';
import type { Mode } from '../battle';
import { ENGINE as E } from '../battle';
import { SPR } from '../render/svg';
import { badgeSVG } from '../render/svg/badges';
import { record, type ExamRecord } from '../save/libretto';
import { reduced, esc, each, $ } from './dom';
import { ico } from './icons';
import { tc, typeTag, kindTag, face, bust, home, overlay, view, closeOverlay } from './common';
import { startBattle } from './battle-screen';
import { WORLD } from './story-screen';
import { soundButton } from './sound';

/* The home page, a page of a squared exercise book: the story first (it is the game), then the free battles between
   friends: the roster, the chosen friend's card, the type cycle, the libretto. And the setup sheet for a new battle,
   where the Esame di Controlli is still there to fight, as the test it was in the beta. */

const EXPR_LABEL: Record<string, string> = { smirk: 'Di base', grin: 'Carica', pout: 'Colpito', worried: 'In crisi', sleepy: 'KO', cool: 'Vittoria' };
/* Antonio's line in the data says where the story ends (the engine's golden file keeps the data as it was):
   on the home page, before the story, it is told differently */
const TAGLINE: Partial<Record<FriendId, string>> = { antonio: 'Formia è casa sua' };

/* =================== HOME =================== */
export function renderHome() {
  var h = '';
  h += '<header class="masthead"><div class="eyebrow">Formia · amici · creature</div>' +
    '<h1 id="title"><span class="hl">Lotte</span> tra Amici</h1>' +
    '<p>Un\'avventura a turni nella Formia vera: esplora la città, cattura le creature, sfida gli amici.</p>' + soundButton('snd-home') + '</header>';
  if (WORLD) h += '<section aria-labelledby="s-t"><h2 class="sec-title" id="s-t">Storia <small>Prima tappa: Formia</small></h2><div class="card story" id="story"></div></section>';
  h += '<section aria-labelledby="r-t"><h2 class="sec-title" id="r-t">Lotte libere <small>Scegli un amico e sfida chi vuoi</small></h2><div class="roster">';
  ROSTER.forEach(function (id) {
    var c = C[id];
    h += '<button class="slot" type="button" data-id="' + id + '" aria-pressed="' + (id === view.sel) + '" style="--tc:' + tc(id) + '"><span class="face">' + face(id) + '</span><span class="nm">' + esc(c.name) + '</span><span class="nk">' + esc(c.nick !== c.name ? c.nick : c.full) + '</span></button>';
  });
  h += '</div></section>';
  h += '<article class="card" id="card" aria-live="polite"></article>';
  h += '<section aria-labelledby="t-t"><h2 class="sec-title" id="t-t">Tipi</h2><div class="cycle" aria-hidden="true">';
  E.TYPE_ORDER.forEach(function (t) { h += typeTag(t) + '<span class="arr">→</span>'; });
  h += typeTag(E.TYPE_ORDER[0]) + '</div>';
  h += '<p class="cycle-note">Ogni tipo batte quello che lo segue: chi ha il vantaggio fa il 12% di danni in più e ne subisce il 10% in meno.</p><ul class="cycle-why">';
  E.TYPE_ORDER.forEach(function (t) {
    var who = ROSTER.filter(function (id) { return C[id].type === t; }).map(function (id) { return C[id].name; });
    h += '<li>' + typeTag(t) + '<span><b>batte ' + E.TYPES[t].beats + '</b>: ' + E.TYPES[t].why + '.</span><span class="who">' + esc(who.join(', ')) + '</span></li>';
  });
  h += '</ul></section>';
  h += '<section aria-labelledby="l-t"><h2 class="sec-title" id="l-t">Libretto <small>su questo dispositivo</small></h2><div class="card" id="libretto"></div></section>';
  h += '<div class="cta-bar"><button class="cta" type="button" id="go"></button></div>';
  home.innerHTML = h;
  renderCard();
  renderLibretto();
  renderStory();
  each(home.querySelectorAll('.slot'), function (b) {
    b.addEventListener('click', function () { select(b.getAttribute('data-id') as FriendId, true); });
  });
  $('go').addEventListener('click', function () { openSetup(); });
}
function select(id: FriendId, scroll?: boolean) {
  view.sel = id; view.hero = 'smirk'; view.p1 = id;
  if (view.p2 === id) view.p2 = ROSTER[(ROSTER.indexOf(id) + 1) % ROSTER.length];
  each(home.querySelectorAll('.slot'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === id)); });
  renderCard();
  if (scroll) { var el = $('card'); if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
}
export function charBlocks(c: Character): string {
  var h = '<div class="block"><div class="trait"><span class="lbl">Passiva</span><b>' + esc(c.passive.name) + '</b><p>' + esc(c.passive.text) + '</p></div>';
  if (c.weakness) h += '<div class="trait"><span class="lbl">Difetto</span><b>' + esc(c.weakness.name) + '</b><p>' + esc(c.weakness.text) + '</p></div>';
  h += '</div><div class="block"><h3>Mosse</h3><ul class="moves-list">';
  c.moves.forEach(function (m) {
    h += '<li><div class="mh"><b>' + esc(m.name) + '</b>' + kindTag(m) + (m.uses ? '<span class="type">' + m.uses + (m.uses === 1 ? ' uso' : ' usi') + '</span>' : '') + '</div><p>' + esc(m.text) + '</p>';
    if (c.id === 'antonio') { var it = E.ITEMS[m.id]; h += '<span class="item">' + ico(it.icon) + 'Si blocca se perde ' + esc(it.name) + '</span>'; }
    h += '</li>';
  });
  return h + '</ul></div>';
}
function renderCard() {
  var c = C[view.sel], el = $('card');
  el.style.setProperty('--tc', tc(view.sel));
  el.setAttribute('aria-label', 'Scheda di ' + c.name);
  var h = '<div class="hero"><div class="hero-art">' + bust(view.sel, view.hero, '', '0 6 260 294') + '</div>' +
    '<div class="hero-id"><h2>' + esc(c.full) + '</h2>' + typeTag(c.type) + (c.nick !== c.name ? '<span class="nick">' + esc(c.nick) + '</span>' : '') + '<span class="from">' + esc(TAGLINE[view.sel] || c.tagline) + '</span></div></div>';
  h += '<div class="exprs" role="group" aria-label="Espressioni">';
  SPR.EXPRS.forEach(function (x) { h += '<button class="expr" type="button" data-x="' + x + '" aria-pressed="' + (x === view.hero) + '">' + face(view.sel, x) + '<span>' + EXPR_LABEL[x] + '</span></button>'; });
  h += '</div>';
  var st = c.stats, rows: [string, number][] = [['Vita', st.hp], ['Attacco', st.atk], ['Difesa', st.def], ['Velocità', st.spe]];
  h += '<div class="block"><h3>Statistiche</h3><div class="stats">';
  rows.forEach(function (r) { h += '<b>' + r[0] + '</b><div class="bar"><span style="width:' + Math.round(r[1] / 130 * 100) + '%"></span></div><i>' + r[1] + '</i>'; });
  h += '</div></div>' + charBlocks(c);
  var L = c.lines;
  h += '<div class="block"><h3>Frasi</h3><dl class="quotes">';
  [['All\'ingresso', L.entry], ['Colpo critico', L.crit], ['Vittoria', L.win], ['KO', L.ko]].forEach(function (q) { if (q[1]) h += '<div><dt>' + q[0] + '</dt><dd>«' + esc(q[1]) + '»</dd></div>'; });
  h += '</dl></div>';
  var beats = ROSTER.filter(function (id) { return E.eff(c.type, C[id].type) > 1; }).map(function (id) { return C[id].name; });
  var loses = ROSTER.filter(function (id) { return E.eff(C[id].type, c.type) > 1; }).map(function (id) { return C[id].name; });
  h += '<div class="block"><h3>Vantaggi di tipo</h3><div class="matchups">' +
    '<div><b>Forte contro</b><span>' + esc(beats.length ? beats.join(', ') : 'nessuno degli amici') + '</span></div>' +
    '<div><b>Debole contro</b><span>' + esc(loses.length ? loses.join(', ') : 'nessuno degli amici') + '</span></div></div></div>';
  el.innerHTML = h;
  each(el.querySelectorAll('.expr'), function (b) {
    b.addEventListener('click', function () {
      view.hero = b.getAttribute('data-x')!;
      var big = el.querySelector('.hero-art .spr-p'); if (big) big.setAttribute('data-expr', view.hero);
      each(el.querySelectorAll('.expr'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
    });
  });
  $('go').textContent = 'Sfida con ' + c.name;
}
/* the story card: a still of Formia, the pins won so far, the way in */
export function renderStory() {
  var el = $('story');
  if (!el || !WORLD) return;
  var sm = WORLD.summary();
  var got = sm.badges.filter(function (b) { return b.earned; }).length;
  el.innerHTML = '<div class="story-map" id="story-map"></div><div class="block">' +
    '<p>La tua Formia vista dall\'alto: da casa, a Parco la Fontana, all\'Eclipse di Vindicio, dalla pineta a Morgana. Ritrova le cose che Antonio ha perso in giro ed entra nei covi degli amici: chi batti ti dà la sua spilla ed entra nella compagnia.</p>' +
    '<div class="story-row"><span class="story-badges" role="img" aria-label="Spille: ' + got + ' su ' + sm.badges.length + '">' +
    sm.badges.map(function (b) { return '<span title="' + esc(b.name) + '">' + badgeSVG(b, 30) + '</span>'; }).join('') + '</span>' +
    (sm.squad.length > 1 ? '<span class="story-squad">Compagnia: ' + esc(sm.squad.map(function (id) { return C[id].name; }).join(', ')) + '</span>' : '') +
    (sm.found ? '<span class="story-squad">Oggetti ritrovati: ' + sm.found + ' su ' + sm.items + '</span>' : '') +
    '<button class="btn primary" type="button" id="go-story">' + (sm.started ? 'Continua la storia' : 'Gioca la storia') + '</button></div></div>';
  $('go-story').addEventListener('click', function () { WORLD.open(); });
  WORLD.preview($('story-map'));
}
export function storyCity(story: { covo?: string }): string {
  var cv = COVI && story.covo ? COVI[story.covo] : null;
  return cv && MAPS[cv.city] ? MAPS[cv.city].name : 'Formia';
}
function examLabel(x: ExamRecord | undefined) { return !x || x.best == null ? '—' : (x.lode ? '30L' : String(x.best)); }
export function renderLibretto() {
  var el = $('libretto');
  if (!el) return;
  var any = ROSTER.some(function (id) { var r = record.chars[id], x = record.exam[id]; return (r && (r.w || r.l)) || (x && (x.p || x.f)); });
  /* the grades of the Esame only for whoever has taken it */
  var exam = ROSTER.some(function (id) { var x = record.exam[id]; return !!x && (x.p > 0 || x.f > 0); });
  var h = '<table class="rec"><thead><tr><th>Personaggio</th><th>Vittorie</th><th>Sconfitte</th>' + (exam ? '<th>Voto esame</th>' : '') + '</tr></thead><tbody>';
  if (!any) h += '<tr><td class="empty" colspan="3">Ancora nessuna lotta libera. Le vittorie compaiono qui.</td></tr>';
  else ROSTER.forEach(function (id) {
    var r = record.chars[id] || { w: 0, l: 0 }, x = record.exam[id];
    h += '<tr><td>' + esc(C[id].name) + '</td><td>' + r.w + '</td><td>' + r.l + '</td>' + (exam ? '<td>' + examLabel(x) + '</td>' : '') + '</tr>';
  });
  el.innerHTML = h + '</tbody></table>';
}


/* =================== SETUP SHEET =================== */
function openSetup() {
  view.p1 = view.sel;
  if (view.p2 === view.p1 && view.mode === 'cpu') view.p2 = ROSTER[(ROSTER.indexOf(view.p1) + 1) % ROSTER.length];
  renderSetup();
}
export function renderSetup() {
  var pvp = view.mode === 'pvp';
  if (pvp && view.p2 === 'esame') view.p2 = ROSTER[(ROSTER.indexOf(view.p1) + 1) % ROSTER.length];
  var grid = function (key: 'p1' | 'p2', list: string[]) {
    return '<div class="pickgrid">' + list.map(function (id) {
      return '<button class="pick" type="button" data-k="' + key + '" data-id="' + id + '" aria-pressed="' + (view[key] === id) + '" style="--tc:' + (id === 'esame' ? 'var(--t-none)' : tc(id)) + '"><span class="face">' + face(id) + '</span><span>' + esc(id === 'esame' ? 'Esame' : C[id as CharId].name) + '</span></button>';
    }).join('') + '</div>';
  };
  var h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="su-t"><div class="sheet-h"><h2 id="su-t">Nuova sfida</h2><button class="tb-btn" type="button" id="su-x">Chiudi</button></div>';
  h += '<div class="seg" role="group" aria-label="Modalità"><button type="button" data-m="cpu" aria-pressed="' + !pvp + '">Contro il computer</button><button type="button" data-m="pvp" aria-pressed="' + pvp + '">Due giocatori</button></div>';
  h += '<div class="pickrow"><h3>' + (pvp ? 'Giocatore 1' : 'Tu giochi con') + '</h3>' + grid('p1', ROSTER) + '</div>';
  h += '<div class="pickrow"><h3>' + (pvp ? 'Giocatore 2' : 'Contro') + '</h3>' + grid('p2', pvp ? ROSTER : (ROSTER as string[]).concat(['esame'])) + '</div>';
  h += '<div class="vsline">' + esc(C[view.p1].name) + ' <i>vs</i> ' + esc(C[view.p2].name) + '</div>';
  h += '<p class="hint">' + (pvp ? 'Stesso telefono: a ogni turno sceglie prima il Giocatore 1, poi passa il telefono al Giocatore 2. Le mosse restano segrete fino alla lotta.' : view.p2 === 'esame' ? 'L\'Esame di Controlli è la prova della prima versione del gioco: dura 12 turni, e se non lo batti in tempo il compito viene ritirato.' : 'Il computer gioca con ' + C[view.p2].name + '. Puoi scegliere anche lo stesso personaggio.') + '</p>';
  h += '<button class="cta" type="button" id="su-go">Inizia la lotta</button></div>';
  overlay.className = 'overlay';
  overlay.innerHTML = h;
  overlay.hidden = false;
  $('su-x').addEventListener('click', closeOverlay);
  each(overlay.querySelectorAll('.seg button'), function (b) { b.addEventListener('click', function () { view.mode = b.getAttribute('data-m') as Mode; renderSetup(); }); });
  each(overlay.querySelectorAll('.pick'), function (b) { b.addEventListener('click', function () { (view as unknown as Record<string, string>)[b.getAttribute('data-k')!] = b.getAttribute('data-id')!; renderSetup(); }); });
  $('su-go').addEventListener('click', function () { closeOverlay(); startBattle({ a: view.p1, b: view.p2, mode: view.p2 === 'esame' ? 'cpu' : view.mode }); });
}
