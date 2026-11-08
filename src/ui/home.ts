import { MAPS } from '../data/maps';
import { GAME_NAME } from '../data/growth';
import { fighter } from '../data/fighters';
import { SLOTS, slotNow, useSlot, peekSlot, eraseSlot, type StoryProgress } from '../save/story-progress';
import { reduced, esc, each, $ } from './dom';
import { home, face } from './common';
import { WORLD } from './story-screen';
import { soundButton } from './sound';
import { sfx } from '../audio';

/* The title of the game, full screen: Formia seen from above behind it, a short intro to skip, the name, and the way
   in. «Entra nel mondo» goes on with the story played last; «Salvataggi» shows the three stories of this device
   (save/story-progress.ts), to play another one or start a new one. There is nothing else: the game is the story. */

/** the intro plays once a session; it is left out with reduced motion and for the automated playtests (which can ask
    for it with ?intro=1) */
function introDue(): boolean {
  if (reduced) return false;
  if (/[?&]intro=1/.test(location.search)) return true;
  if (navigator.webdriver) return false;
  try { return !sessionStorage.getItem('telepilo:intro'); } catch (e) { return true; }
}
function introSeen() { try { sessionStorage.setItem('telepilo:intro', '1'); } catch (e) { /* ignore */ } }

/** the lines of the intro, one after the other (the fact about Telepilo: Odyssey X; Cicero, Ad Atticum II 13) */
const INTRO = [
  'Formia, sul golfo di Gaeta.',
  'Dicono che qui sorgesse Telepilo, la città dei Lestrigoni dell\'Odissea.',
  'Ora le sue pietre si sono svegliate. E con loro, le creature.'
];
const LINE_MS = 2600;
let introTimer: ReturnType<typeof setTimeout> | null = null;

/** the whole title, at the start of the game */
export function renderHome() {
  home.innerHTML = '<div class="ti-bg" aria-hidden="true"><div class="ti-map" id="ti-map"></div><div class="ti-shade"></div></div>' +
    '<div class="ti-intro" id="ti-intro" hidden>' + INTRO.map(function (l, k) { return '<p class="ti-line" style="--d:' + (k * LINE_MS) + 'ms">' + esc(l) + '</p>'; }).join('') +
    '<button class="ti-skip" type="button" id="ti-skip">Salta <span aria-hidden="true">›</span></button></div>' +
    '<div class="ti-main" id="ti-main" hidden>' +
      '<div class="ti-top">' + soundButton('ti-snd') + '</div>' +
      '<header class="ti-logo"><span class="ti-eyebrow">Una storia nella Formia vera</span>' +
        '<h1 id="title" aria-label="' + esc(GAME_NAME.name + ', ' + GAME_NAME.sub) + '">' + logo(GAME_NAME.name.toUpperCase()) + '<small aria-hidden="true">' + esc(GAME_NAME.sub) + '</small></h1></header>' +
      '<nav class="ti-menu" id="ti-menu" aria-label="Inizia"></nav>' +
      '<section class="ti-slots" id="ti-slots" aria-labelledby="ti-sl-t" hidden></section>' +
      '<p class="ti-foot">La mappa è la Formia vera, disegnata da OpenStreetMap.</p>' +
    '</div>';
  paintMap();
  if (introDue()) playIntro(); else showTitle(false);
}
/** the name, drawn in SVG so that its outline is clean in every browser (a thick text-stroke breaks into spikes in
    Safari): underneath a dark copy a little lower, for the shadow; on top the outline with the gold of a sunset over the
    gulf; and, unless motion is reduced, a glint that runs across it now and then */
function logo(word: string): string {
  const t = function (cls: string, y: number, more: string) { return '<text class="' + cls + '" x="500" y="' + y + '" text-anchor="middle" textLength="900" lengthAdjust="spacingAndGlyphs"' + more + '>' + esc(word) + '</text>'; };
  return '<svg class="ti-word" viewBox="0 0 1000 250" aria-hidden="true" focusable="false"><defs>' +
    '<linearGradient id="ti-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff7d6"/><stop offset=".4" stop-color="#ffd66b"/><stop offset=".72" stop-color="#ff9d52"/><stop offset="1" stop-color="#ff6f61"/></linearGradient>' +
    (reduced ? '' : '<linearGradient id="ti-glint" x1="-1" y1="0" x2="0" y2="0"><stop offset=".35" stop-color="#ffffff" stop-opacity="0"/><stop offset=".5" stop-color="#ffffff" stop-opacity=".75"/><stop offset=".65" stop-color="#ffffff" stop-opacity="0"/>' +
      '<animate attributeName="x1" values="-1;1.2;1.2" keyTimes="0;.35;1" dur="6s" begin="1.4s" repeatCount="indefinite"/><animate attributeName="x2" values="0;2.2;2.2" keyTimes="0;.35;1" dur="6s" begin="1.4s" repeatCount="indefinite"/></linearGradient>') +
    '</defs>' + t('ti-sh', 214, '') + t('ti-ol', 196, ' fill="url(#ti-gold)"') + (reduced ? '' : t('ti-gl', 196, ' fill="url(#ti-glint)"')) + '</svg>';
}
/** back on the title from the world: no intro, the menu as it is now */
export function renderTitle() {
  if (!$('ti-main')) { renderHome(); return; }
  paintMap();
  showTitle(false);
}

/* ---------- the intro ---------- */
function playIntro() {
  const el = $('ti-intro');
  el.hidden = false;
  home.classList.add('intro');
  const skip = function () { endIntro(); };
  $('ti-skip').addEventListener('click', skip);
  el.addEventListener('click', function (e) { if (e.target !== $('ti-skip')) skip(); });
  document.addEventListener('keydown', onIntroKey);
  setTimeout(function () { var b = $('ti-skip'); if (b) b.focus(); }, 30);
  introTimer = setTimeout(endIntro, INTRO.length * LINE_MS + 200);
}
function onIntroKey(e: KeyboardEvent) { if (e.key !== 'Tab') { e.preventDefault(); endIntro(); } }
function endIntro() {
  if (introTimer) { clearTimeout(introTimer); introTimer = null; }
  document.removeEventListener('keydown', onIntroKey);
  introSeen();
  const el = $('ti-intro');
  if (!el || el.hidden) return;
  el.hidden = true;
  home.classList.remove('intro');
  showTitle(true);
}

/* ---------- the title and its menu ---------- */
function showTitle(reveal: boolean) {
  const main = $('ti-main');
  main.hidden = false;
  home.classList.toggle('reveal', reveal && !reduced);
  menu();
}
/** what a slot holds, in a line: who is played, where, the pins */
function placeOf(s: StoryProgress): string {
  const m = MAPS[s.map];
  if (!m) return 'Formia';
  if (m.inside) return m.name;
  const a = (m.areas || []).filter(function (q) { return s.x >= q.x && s.x < q.x + q.w && s.y >= q.y && s.y < q.y + q.h; })[0];
  return a ? a.name : m.name;
}
function who(s: StoryProgress): string { return s.first || 'antonio'; }
function line(n: number, s: StoryProgress | null): string {
  if (!s || !s.seen.intro) return 'Storia ' + n + ' · nuova';
  return 'Storia ' + n + ' · ' + fighter(who(s)).name + ' a ' + placeOf(s) + ' · ' + s.badges.length + (s.badges.length === 1 ? ' spilla' : ' spille');
}
function menu() {
  const n = slotNow(), s = peekSlot(n), used = count();
  $('ti-slots').hidden = true;
  $('ti-main').classList.remove('at-slots');
  const el = $('ti-menu');
  el.hidden = false;
  el.innerHTML = '<button class="ti-cta" type="button" id="go-story"><b>' + (s && s.seen.intro ? 'Entra nel mondo' : 'Inizia la storia') + '</b><small>' + esc(line(n, s)) + '</small></button>' +
    '<button class="ti-btn" type="button" id="go-slots"><b>Salvataggi</b><small>' + (used ? used + (used === 1 ? ' storia' : ' storie') + ' su ' + SLOTS : SLOTS + ' posti liberi') + '</small></button>';
  $('go-story').addEventListener('click', function () { enter(n); });
  $('go-slots').addEventListener('click', function () { sfx('click'); slots(); });
  setTimeout(function () { var b = $('go-story'); if (b && !$('ti-main').hidden) b.focus(); }, 30);
}
/** how many slots hold a story */
function count(): number { let k = 0; for (let n = 1; n <= SLOTS; n++) if (peekSlot(n)) k++; return k; }
function when(at?: number): string {
  if (!at) return '';
  const d = new Date(at);
  return 'Salvata il ' + d.toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) + ' alle ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}
/** the three stories of this device, each with what it holds */
function slots() {
  $('ti-menu').hidden = true;
  $('ti-main').classList.add('at-slots');
  const el = $('ti-slots'), last = slotNow();
  let h = '<div class="ti-sl-h"><h2 id="ti-sl-t">Scegli la tua storia</h2><button class="ti-btn small" type="button" id="ti-back">Indietro</button></div><div class="ti-slotgrid">';
  for (let n = 1; n <= SLOTS; n++) {
    const s = peekSlot(n);
    h += '<article class="ti-slot' + (s ? '' : ' empty') + (n === last ? ' last' : '') + '" data-slot="' + n + '"><div class="ti-slot-h"><b>Storia ' + n + '</b>' + (n === last && s ? '<i>Ultima giocata</i>' : '') + '</div>';
    if (s) {
      const id = who(s), lv = (s.lv && s.lv[id]) ? s.lv[id].lv : 5, mons = (s.mons || []).length;
      h += '<div class="ti-slot-who"><span class="ti-face">' + face(id) + '</span><div><b>' + esc(fighter(id).name) + '</b><small>Livello ' + lv + '</small></div></div>' +
        '<ul class="ti-slot-facts"><li><span>Dove</span><b>' + esc(placeOf(s)) + '</b></li><li><span>Spille</span><b>' + s.badges.length + '</b></li>' +
        '<li><span>Creature</span><b>' + mons + '</b></li><li><span>Compagnia</span><b>' + s.squad.length + '</b></li></ul>' +
        '<small class="ti-when">' + esc(when(s.at)) + '</small>' +
        '<div class="ti-slot-act"><button class="ti-cta small" type="button" data-play="' + n + '"><b>Gioca</b></button><button class="ti-del" type="button" data-del="' + n + '">Elimina</button></div>';
    } else {
      h += '<div class="ti-slot-new"><span aria-hidden="true">+</span><p>Una storia nuova, da casa a Parco la Fontana.</p></div>' +
        '<div class="ti-slot-act"><button class="ti-cta small" type="button" data-play="' + n + '"><b>Nuova storia</b></button></div>';
    }
    h += '</article>';
  }
  el.innerHTML = h + '</div>';
  el.hidden = false;
  $('ti-back').addEventListener('click', function () { sfx('click'); menu(); });
  each(el.querySelectorAll<HTMLElement>('[data-play]'), function (b) { b.addEventListener('click', function () { enter(Number(b.getAttribute('data-play'))); }); });
  each(el.querySelectorAll<HTMLButtonElement>('[data-del]'), function (b) {
    let armed = false;
    b.addEventListener('click', function () {
      if (!armed) { armed = true; b.textContent = 'Tocca ancora: si perde tutto'; b.classList.add('armed'); return; }
      eraseSlot(Number(b.getAttribute('data-del')));
      sfx('click');
      slots();
    });
  });
  setTimeout(function () { var b = el.querySelector<HTMLElement>('.ti-slot.last [data-play]') || el.querySelector<HTMLElement>('[data-play]'); if (b) b.focus(); }, 30);
}
/** into the world with a story: the one of that slot from now on */
function enter(n: number) {
  if (n !== slotNow() || !peekSlot(n)) useSlot(n);
  sfx('click');
  WORLD.open();
}
/** Formia from above, behind the title: around where the story played last stands */
function paintMap() {
  const el = $('ti-map');
  /* the old town, Centro and Mola, with the port at the bottom: Formia fills the screen, whatever its size */
  if (el && WORLD) WORLD.preview(el, { at: [88, 31], span: 1500 });
}
