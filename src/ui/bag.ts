import { st, save } from '../save/story-progress';
import { WARES, SHOPS, MANUALS, marketToday, coins, type ItemId } from '../data/growth';
import { NET_IDS } from '../data/nets';
import { HELD, type HeldId } from '../data/passives';
import { SPECIES } from '../data/creatures';
import { wareSVG } from '../render/svg/wares';
import { coin } from './icons';
import { reduced, esc, each, $ } from './dom';
import { sfx } from '../audio';
import { say, sheet, closeSheet, renderHud, notify } from './story-screen';
import { growthSay, portrait, tcOf, levelLine } from './team';
import { newsOf } from '../story/newspaper';
import { has, money, priceFor, buy, affordable, ambrosiaFor, giveAmbrosia, feedAlici, readManual, manualsLeft, nameOf, level, progress, creatureOf, hearts, heldInBag, giveHeld, teamMons, homeMons, dexOf, firstHuman, USE_ITEMS, type Growth } from '../story/growth';

/* The bag, the shops and what is found or won (24 November 2026, Antonio: «migliora di gran lunga il design e
   l'usabilità del menu … soprattutto degli strumenti che si comprano, e anche la modalità di come si comprano»; «quando
   trovi qualcosa per terra o lo vinci deve essere più chiaro, con una piccola immagine e una piccola animazione»).
   - The bag is a tab of the menu of its own: the things as cards with their picture and how many, in four drawers
     (to give, to catch, for battles, to carry); a touch opens the thing, with what it does, where it is sold and what
     can be done with it.
   - The ambrosia and the alici are given by touching who gets them: the ampolla flies to the card, the level goes up
     there and then, and what a level brings (a move, a new form) is told after.
   - A shop is a counter: the shelf of cards with their price tags, the one chosen on the counter below with how many and
     the total, and the purse that goes down when something is bought.
   - Anything found or won comes with a card: the picture pops in front of the light, with its name and how many. */

/* ---------- the things: drawers, words, sellers ---------- */
export type Drawer = 'give' | 'catch' | 'fight' | 'hold';
export function drawerOf(it: string): Drawer {
  if ((USE_ITEMS as string[]).indexOf(it) >= 0) return 'give';
  if ((NET_IDS as string[]).indexOf(it) >= 0) return 'catch';
  if (it in HELD) return 'hold';
  return 'fight';
}
const DRAWERS: { id: Drawer; title: string; empty: string }[] = [
  { id: 'give', title: 'Da dare', empty: '' },
  { id: 'catch', title: 'Per catturare', empty: 'Nessun retino. Li vende il retaio di Gianola, accanto alla guardaparco; i più semplici anche il pescatore di Mola.' },
  { id: 'fight', title: 'Per le lotte', empty: 'Niente per le lotte. La tiella la fa il forno di Castellone, il balsamo lo vende la farmacia.' },
  { id: 'hold', title: 'Da portare', empty: 'Niente da far portare alle creature. Al forno, al bar, in pescheria e al mercato di Largo Paone ce n\'è.' }
];
/** a thing in two or three words, under its picture */
const BLURB: Record<string, string> = {
  ambrosia: '+1 livello', alici: 'più legame', manuale: '+1 punto abilità', giornale: 'avvistamenti',
  retino: 'cattura', retino2: 'cattura meglio', argento: 'il doppio', oro: 'quasi sicuro', nassa: 'creature di mare', lampara: 'di notte ×3',
  tiella: '+40 PS in lotta', balsamo: 'toglie gli stati',
  fetta: 'si cura da sola', ciambella: 'Velocità +10%', oliva: 'para un colpo', cozza: 'ferma uno stato', corno: 'primo colpo +20%',
  corona: 'danni −15%', chiave: 'Velocità +20%', fiammella: 'danni +15%'
};
/** what a thing is called, with how many: "3 retini", "un'ampolla di ambrosia" */
const ONE: Record<string, string> = { ambrosia: 'un\'ampolla di ambrosia', tiella: 'una tiella', fetta: 'una fetta di tiella', alici: 'un cartoccio di alici', manuale: 'un manuale', balsamo: 'un balsamo', giornale: 'il giornale', retino: 'un retino', retino2: 'un retino da pesca', argento: 'un retino d\'argento', oro: 'un retino d\'oro', nassa: 'una nassa', lampara: 'una rete della lampara', ciambella: 'una ciambella all\'anice', oliva: 'un\'oliva di Gaeta', cozza: 'una cozza', corno: 'un corno di mare', corona: 'la Corona di Lamo', chiave: 'la Chiave di Giano', fiammella: 'la Fiammella di Sant\'Elmo' };
const MANY: Record<string, string> = { ambrosia: 'ampolle di ambrosia', tiella: 'tielle', fetta: 'fette di tiella', alici: 'cartocci di alici', manuale: 'manuali', balsamo: 'balsami', retino: 'retini', retino2: 'retini da pesca', argento: 'retini d\'argento', oro: 'retini d\'oro', nassa: 'nasse', lampara: 'reti della lampara', ciambella: 'ciambelle all\'anice', oliva: 'olive di Gaeta', cozza: 'cozze', corno: 'corni di mare' };
export function thingText(it: string, n: number): string {
  if (it === 'sesterzi') return coins(n);
  var name = WARES[it as ItemId] ? WARES[it as ItemId].name.toLowerCase() : it;
  return n === 1 ? (ONE[it] || name) : n + ' ' + (MANY[it] || name);
}
/** who sells it, in words */
function sellersOf(it: ItemId): string {
  var names = Object.keys(SHOPS).filter(function (k) { return SHOPS[k].sells.indexOf(it) >= 0; }).map(function (k) { return SHOPS[k].name; });
  if (it === 'ambrosia') names.push('e si vince: allenatori, missioni, lavori in mare, il diario delle creature');
  return names.length ? names.join(', ') : 'Non si vende: si trova, o la lascia chi si libera';
}
/** the picture of a thing, size px */
export function art(it: string, size: number): string { return wareSVG(it, size); }

/* ---------- the bag, a tab of the menu ---------- */
function shown(d: Drawer): ItemId[] {
  if (d === 'give') return (USE_ITEMS as ItemId[]).filter(function (it) { return it === 'ambrosia' || has(it) > 0; });
  if (d === 'catch') return (NET_IDS as ItemId[]).filter(function (it) { return has(it) > 0; });
  if (d === 'fight') return (['tiella', 'balsamo'] as ItemId[]).filter(function (it) { return has(it) > 0; });
  return heldInBag() as ItemId[];
}
export function bagHtml(): string {
  var k = 0;
  return '<div class="bagpane"><div class="bag-top"><span class="purse" aria-label="In tasca: ' + coins(money()) + '">' + coin(24) + '<b>' + money() + '</b><small>sesterzi</small></span>' +
    '<p class="hint">Tocca una cosa per vedere cosa fa e usarla.</p></div>' +
    DRAWERS.map(function (d) {
      var list = shown(d.id);
      return '<section class="bag-sec d-' + d.id + '"><h3>' + esc(d.title) + '</h3>' +
        (list.length ? '<div class="bag-grid">' + list.map(function (it) {
          var n = has(it);
          return '<button class="bag-card' + (n ? '' : ' none') + '" type="button" data-item="' + it + '" style="--d:' + (k++ * 35) + 'ms" aria-label="' + esc(WARES[it].name + ', ne hai ' + n) + '">' +
            '<span class="bag-ico">' + art(it, 54) + '</span><span class="bag-n">' + (n ? '×' + n : '0') + '</span>' +
            '<b>' + esc(WARES[it].name) + '</b><small>' + esc(BLURB[it] || '') + '</small></button>';
        }).join('') + '</div>' : '<p class="bag-empty">' + esc(d.empty) + '</p>') + '</section>';
    }).join('') + '</div>';
}
export function wireBag(reopen: () => void) {
  each(document.querySelectorAll('[data-item]'), function (b) {
    b.addEventListener('click', function () { sfx('click'); openItem(b.getAttribute('data-item') as ItemId, reopen); });
  });
}
/** a thing of the bag, open: big, with what it does, where it is sold, and what can be done with it */
export function openItem(it: ItemId, back: () => void) {
  var w = WARES[it], n = has(it), d = drawerOf(it), act = '';
  if (it === 'ambrosia' || it === 'alici') {
    var who = it === 'ambrosia' ? ambrosiaFor() : mine();
    act = n && who.length ? '<button class="btn primary" type="button" id="it-go">' + (it === 'ambrosia' ? 'Scegli chi la beve' : 'Scegli a chi darle') + '</button>'
      : '<p class="hint">' + (n ? 'Le alici sono per le creature, e non ne hai.' : 'Non ne hai. ' + esc(sellersOf(it)) + '.') + '</p>';
  } else if (it === 'manuale') act = n ? '<button class="btn primary" type="button" id="it-go">Leggilo</button>' : '';
  else if (d === 'hold') act = n && mine().length ? '<button class="btn primary" type="button" id="it-go">Dallo a una creatura</button>' : '';
  else act = '<p class="hint">Si usa in lotta: tocca «Borsa», sotto le mosse.</p>';
  sheet('<div class="sheet item-sheet d-' + d + '" role="dialog" aria-modal="true" aria-labelledby="it-t"><div class="sheet-h"><h2 id="it-t">' + esc(w.name) + '</h2><button class="tb-btn" type="button" id="it-x">Indietro</button></div>' +
    '<div class="it-hero"><span class="it-glow" aria-hidden="true"></span><span class="it-art">' + art(it, 124) + '</span><span class="it-count">Ne hai <b>' + n + '</b></span></div>' +
    '<p class="it-text">' + esc(w.text) + '</p>' +
    '<p class="it-where"><b>Dove si trova</b> ' + esc(sellersOf(it)) + (w.price && it !== 'giornale' ? ' · ' + coin(15) + priceFor(it) : '') + '</p>' + act + '</div>');
  $('it-x').addEventListener('click', function () { closeSheet(); back(); });
  var go = document.getElementById('it-go');
  if (go) go.addEventListener('click', function () {
    if (it === 'manuale') { closeSheet(); useManual(function () { openItem(it, back); }); return; }
    if (d === 'hold') { holdSheet(it as HeldId, function () { openItem(it, back); }); return; }
    giveSheet(it, function () { openItem(it, back); });
  });
  setTimeout(function () { var b = $('it-go') || $('it-x'); if (b) b.focus(); }, 30);
}
/** the creatures of who is being played: those travelling with him, then those at home */
function mine(): string[] { return teamMons().concat(homeMons()).map(function (m) { return m.uid; }); }
function useManual(back: () => void) {
  if (!readManual()) return;
  save(); renderHud(); sfx('badge');
  say([nameOf(firstHuman()) + ' legge il manuale da cima a fondo.', 'Un punto abilità in più: si spende nella sua scheda, in «Abilità».'], null, null, back);
}
/** «Usa» from somewhere else (an old button, a test): the same as opening it in the bag */
export function useItem(it: ItemId, back?: () => void) {
  var b = back || function () { /* nothing */ };
  if (it === 'manuale') useManual(b); else giveSheet(it, b);
}

/* ---------- giving: touch who gets it ---------- */
/** whether a growth has more to tell than the level: a move, a form, a form waiting, the points of who is played */
function hasNews(g: Growth): boolean { return !!(g.learned.length || g.pending.length || g.evolved || g.grew || g.waiting || (g.key === firstHuman() && g.to > g.from)); }
function giveCard(key: string, i: number, amb: boolean): string {
  var l = level(key), mon = creatureOf(key), h = hearts(key);
  return '<button class="gv-card" type="button" data-give="' + key + '" style="--tc:' + tcOf(key) + ';--d:' + (i * 45) + 'ms">' +
    '<span class="gv-art">' + portrait(key) + '</span><span class="gv-name">' + esc(nameOf(key)) + '</span>' +
    '<span class="gv-lv"><b>Lv ' + l.lv + '</b>' + (amb ? '<i>→ ' + (l.lv + 1) + '</i>' : '') + '</span>' +
    (amb ? '<span class="gv-xp" aria-hidden="true"><i style="width:' + Math.round(progress(key) * 100) + '%"></i></span>'
      : '<span class="gv-hearts" aria-label="' + h + ' cuori su 5">' + [0, 1, 2, 3, 4].map(function (k) { return '<i class="' + (k < h ? 'on' : '') + '">♥</i>'; }).join('') + '</span>') +
    (mon && mon.home ? '<span class="gv-tag">a casa</span>' : '') + '</button>';
}
export function giveSheet(it: ItemId, back: () => void) {
  var amb = it === 'ambrosia', keys = amb ? ambrosiaFor() : mine();
  if (!has(it) || !keys.length) { back(); return; }
  var o = sheet('<div class="sheet give-sheet" role="dialog" aria-modal="true" aria-labelledby="gv-t"><div class="sheet-h"><h2 id="gv-t">' + (amb ? 'Chi beve l\'ambrosia?' : 'A chi dai le alici?') + '</h2><button class="tb-btn" type="button" id="gv-x">Fatto</button></div>' +
    '<div class="gv-top"><span class="gv-src" id="gv-src">' + art(it, 64) + '</span><span><b id="gv-n">' + countText(it) + '</b><small>' +
    (amb ? 'Tocca chi la beve: sale subito di un livello, a qualunque livello. Si può dare più volte di fila.' : 'Tocca una creatura: le alici le piacciono tanto, e si affeziona a te (un cuore si riempie prima).') + '</small></span></div>' +
    '<div class="gv-grid" id="gv-grid">' + keys.map(function (k, i) { return giveCard(k, i, amb); }).join('') + '</div>' +
    '<p class="gv-say" id="gv-say" aria-live="polite"></p></div>');
  var busy = false;
  $('gv-x').addEventListener('click', function () { closeSheet(); back(); });
  /* one listener for the whole grid: a card drawn again after a gift keeps working */
  $('gv-grid').addEventListener('click', function (e) {
    var card = (e.target as HTMLElement).closest<HTMLElement>('[data-give]');
    if (!card || busy) return;
    var key = card.getAttribute('data-give')!, el = card;
    if (!has(it)) { nudge($('gv-n')); return; }
    busy = true;
    fly($('gv-src'), el, art(it, 46), function () {
      var g: Growth | null = null;
      if (amb) { g = giveAmbrosia(key, 1); sfx('magicUp'); } else { feedAlici(key, 1); sfx('heal'); }
      save(); renderHud();
      var tmp = document.createElement('div');
      tmp.innerHTML = giveCard(key, 0, amb);
      var fresh = tmp.firstChild as HTMLElement;
      el.replaceWith(fresh);
      fresh.classList.add(amb ? 'up' : 'love');
      pop(fresh, amb && g ? 'Lv ' + g.to + '!' : '♥');
      $('gv-say').textContent = amb && g ? levelLine(g) : nameOf(key) + ' divora le alici e ti guarda con affetto.';
      $('gv-n').textContent = countText(it);
      $('gv-n').classList.toggle('out', !has(it));
      fresh.focus();
      busy = false;
      if (g && hasNews(g)) {
        busy = true;
        setTimeout(function () { closeSheet(); growthSay(g!, [nameOf(key) + ' beve l\'ambrosia.'], function () { if (has(it)) giveSheet(it, back); else back(); }); }, reduced ? 250 : 1000);
      }
    });
  });
  setTimeout(function () { var b = o.querySelector<HTMLElement>('[data-give]'); if (b) b.focus(); }, 30);
}
function countText(it: ItemId): string { var n = has(it); return n ? 'Ne hai ' + n : 'Finite'; }
/** a thing for a creature to carry: touch the creature (what it carried goes back in the bag) */
function holdSheet(it: HeldId, back: () => void) {
  var keys = mine();
  var o = sheet('<div class="sheet give-sheet" role="dialog" aria-modal="true" aria-labelledby="hd-t"><div class="sheet-h"><h2 id="hd-t">Chi porta ' + esc(thingText(it, 1)) + '?</h2><button class="tb-btn" type="button" id="hd-x">Indietro</button></div>' +
    '<div class="gv-top"><span class="gv-src" id="hd-src">' + art(it, 64) + '</span><span><b>' + esc(HELD[it].name) + '</b><small>' + esc(HELD[it].text) + ' La creatura lo tiene da una lotta all\'altra; se portava già qualcosa, torna nella borsa.</small></span></div>' +
    '<div class="gv-grid">' + keys.map(function (k, i) {
      var m = creatureOf(k)!, cur = m.item ? HELD[m.item as HeldId] : null;
      return '<button class="gv-card" type="button" data-hold="' + k + '" style="--tc:' + tcOf(k) + ';--d:' + (i * 45) + 'ms"><span class="gv-art">' + portrait(k) + '</span><span class="gv-name">' + esc(nameOf(k)) + '</span>' +
        '<span class="gv-carry">' + (cur ? art(m.item!, 22) + esc(cur.name) : 'non porta niente') + '</span></button>';
    }).join('') + '</div></div>');
  $('hd-x').addEventListener('click', function () { closeSheet(); back(); });
  each(o.querySelectorAll<HTMLElement>('[data-hold]'), function (c) {
    c.addEventListener('click', function () {
      var k = c.getAttribute('data-hold')!;
      fly($('hd-src'), c, art(it, 40), function () {
        giveHeld(k, it); save(); renderHud(); sfx('pickup');
        closeSheet();
        say([nameOf(k) + ' adesso porta: ' + HELD[it].name + '.'], null, null, back);
      });
    });
  });
  setTimeout(function () { var b = o.querySelector<HTMLElement>('[data-hold]'); if (b) b.focus(); }, 30);
}

/* ---------- little animations ---------- */
/** a copy of the picture flies from one element to another, then `done` */
function fly(from: HTMLElement | null, to: HTMLElement, html: string, done: () => void) {
  if (reduced || !from || !to.animate) { done(); return; }
  var a = from.getBoundingClientRect(), b = to.getBoundingClientRect(), el = document.createElement('div');
  el.className = 'flyer'; el.innerHTML = html; document.body.appendChild(el);
  var x0 = a.left + a.width / 2, y0 = a.top + a.height / 2, x1 = b.left + b.width / 2, y1 = b.top + b.height * 0.38, mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 70;
  var at = function (t: number) { var u = 1 - t; return [u * u * x0 + 2 * u * t * mx + t * t * x1, u * u * y0 + 2 * u * t * my + t * t * y1]; };
  var frames: Keyframe[] = [];
  for (var k = 0; k <= 10; k++) { var p = at(k / 10); frames.push({ transform: 'translate(' + (p[0] - 23).toFixed(1) + 'px,' + (p[1] - 23).toFixed(1) + 'px) rotate(' + (k * 24 - 40) + 'deg) scale(' + (1 - 0.35 * k / 10).toFixed(2) + ')' }); }
  sfx('whoosh');
  el.animate(frames, { duration: 520, easing: 'cubic-bezier(.3,.1,.4,1)', fill: 'forwards' }).finished.then(function () { el.remove(); done(); }, function () { el.remove(); done(); });
}
/** a word that pops out of an element and floats up */
function pop(el: HTMLElement, text: string) {
  if (reduced) return;
  var p = document.createElement('span');
  p.className = 'popword'; p.textContent = text; el.appendChild(p);
  setTimeout(function () { p.remove(); }, 1300);
}
/** a no: the element shakes */
function nudge(el: HTMLElement) { sfx('buzz'); if (reduced || !el.animate) return; el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 260 }); }

/* ---------- the shops: a shelf and a counter ---------- */
/** the colour of the awning of each shop */
const AWNING: Record<string, string> = { reti: 'var(--t-calma)', pesca: 'var(--t-calma)', forno: 'var(--t-caos)', bar: 'var(--t-calore)', pescheria: 'var(--t-corrente)', farmacia: 'var(--t-cielo)', libreria: 'var(--t-cervello)', edicola: 'var(--t-chiacchiera)', mercato: 'var(--t-cuore)' };
export function openShop(id: string) {
  var sh = SHOPS[id], today = new Date().getDay();
  /* the market has every stall on Saturday, a couple the other days */
  var sells = id === 'mercato' ? marketToday(today, sh.sells) : sh.sells;
  var hello = id === 'mercato' ? (today === 6 ? 'Oggi è sabato: ci sono tutte le bancarelle.' : 'Oggi ci sono solo due bancarelle: il mercato vero è il sabato.') : sh.hello;
  /* how many can be had: the three manuals of the bookshop, one newspaper at a time */
  var cap = function (it: ItemId) { return it === 'manuale' ? manualsLeft(MANUALS) : it === 'giornale' ? 1 : 99; };
  var pick: ItemId = sells.filter(function (it) { return cap(it) > 0 && affordable(it) > 0; })[0] || sells[0], n = 1, said = hello;
  var render = function (bought?: ItemId, first?: boolean) {
    var left = cap(pick), can = Math.max(1, Math.min(left, affordable(pick))), p = priceFor(pick);
    n = Math.max(1, Math.min(n, can));
    var tot = p * n, short = tot - money();
    var o = sheet('<div class="sheet shop-sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t" style="--aw:' + (AWNING[id] || 'var(--t-calore)') + '">' +
      '<div class="awning" aria-hidden="true"></div>' +
      '<div class="sheet-h"><h2 id="sh-t">' + esc(sh.name) + '</h2><span class="purse" id="sh-purse" aria-label="In tasca: ' + coins(money()) + '">' + coin(22) + '<b>' + money() + '</b></span><button class="tb-btn" type="button" id="shop-x">Chiudi</button></div>' +
      '<p class="shop-say">' + esc(said) + '</p>' +
      '<div class="shelf" role="listbox" aria-label="Sullo scaffale">' + sells.map(function (it, i) {
        var off = cap(it) <= 0, dear = !off && affordable(it) < 1;
        return '<button class="ware' + (it === pick ? ' sel' : '') + (off ? ' off' : '') + (dear ? ' dear' : '') + (bought === it ? ' got' : '') + '" type="button" role="option" aria-selected="' + (it === pick) + '" data-ware="' + it + '" style="--d:' + (i * 40) + 'ms">' +
          '<span class="ware-art">' + art(it, 58) + '</span><b>' + esc(WARES[it].name) + '</b>' +
          (off ? '<span class="tag sold">Finiti</span>' : '<span class="tag">' + coin(14) + priceFor(it) + '</span>') +
          (it === 'giornale' ? '' : '<small>Ne hai ' + has(it) + '</small>') + '</button>';
      }).join('') + '</div>' +
      '<div class="counter"><span class="counter-art">' + art(pick, 72) + '</span><div class="counter-t"><b>' + esc(WARES[pick].name) + '</b><small>' + esc(WARES[pick].text) + '</small></div>' +
      (left > 0 ? '<div class="counter-buy">' + (left > 1 ? '<span class="qty" data-qty="' + pick + '"><button class="qty-b" type="button" data-dn aria-label="Uno in meno"' + (n <= 1 ? ' disabled' : '') + '>−</button><b aria-live="polite">' + n + '</b><button class="qty-b" type="button" data-up aria-label="Uno in più"' + (n >= can ? ' disabled' : '') + '>+</button></span>' : '') +
        '<button class="btn primary buy" type="button" data-it="' + pick + '"' + (short > 0 ? ' disabled' : '') + ' aria-label="Compra ' + esc(thingText(pick, n)) + ' per ' + coins(tot) + '">' + (short > 0 ? 'Ti mancano ' + coin(15) + short : 'Compra · ' + coin(16) + tot) + '</button></div>'
        : '<span class="tag sold">Finiti</span>') + '</div>' +
      (money() < Math.min.apply(null, sells.map(priceFor)) ? '<p class="hint">I sesterzi si guadagnano lottando, con le attività in giro per Formia e con i lavori in mare.</p>' : '') + '</div>');
    $('shop-x').addEventListener('click', closeSheet);
    each(o.querySelectorAll<HTMLElement>('[data-ware]'), function (b) {
      b.addEventListener('click', function () { var it = b.getAttribute('data-ware') as ItemId; if (it !== pick) { pick = it; n = 1; sfx('click'); } render(); focus('[data-ware="' + it + '"]'); });
    });
    var q = o.querySelector('[data-qty]');
    if (q) {
      q.querySelector('[data-dn]')!.addEventListener('click', function () { if (n > 1) { n--; render(); focus('[data-dn]'); } });
      q.querySelector('[data-up]')!.addEventListener('click', function () { n++; render(); focus('[data-up]'); });
    }
    var buyB = o.querySelector<HTMLButtonElement>('[data-it]');
    if (buyB) buyB.addEventListener('click', function () {
      var it = pick, k = n;
      if (k > cap(it) || !buy(it, k)) return;
      sfx('finaleCoin'); save(); renderHud();
      var from = o.querySelector<HTMLElement>('.counter-art'), to = o.querySelector<HTMLElement>('[data-ware="' + it + '"]');
      /* the newspaper is read at the newsstand */
      if (it === 'giornale') { st.bag!.giornale = 0; save(); closeSheet(); readNews(function () { openShop(id); }); return; }
      said = 'Ecco qua: ' + thingText(it, k) + '. ' + (it === 'ambrosia' ? 'Dalla a chi vuoi dalla Borsa, nel menu.' : 'Altro?');
      n = 1;
      var done = function () { render(it); focus('[data-it]'); };
      if (from && to) fly(from, to, art(it, 46), done); else done();
    });
    var focus = function (sel: string) { var b = document.querySelector<HTMLButtonElement>('.shop-sheet ' + sel); if (b && !b.disabled) b.focus(); };
    if (first) focus('[data-it]');
  };
  render(undefined, true);
}
/** the newspaper of the edicola, read there and then: where something seldom met has been seen today */
function readNews(back?: () => void) {
  var nw = newsOf(Math.floor(Date.now() / 86400000)), sp = SPECIES[nw.sp], seen = dexOf(nw.sp) > 0;
  say(['Avvistamenti. ' + nw.place + ', ' + (nw.night ? 'stanotte' : 'oggi') + ': qualcuno giura di aver visto ' + (seen ? (/^[AEIOU]/.test(sp.name) ? 'un\'' : 'un ') + sp.name : 'una creatura mai vista prima, che si vede di rado') + '.',
    nw.night ? 'Di notte, dice il giornale: di giorno non si fa vedere.' : 'Di giorno, dice il giornale.'], 'Il giornale di oggi', null, back);
}

/* ---------- what is found or won: a card with the picture ---------- */
export interface Loot { id: string; n?: number; art?: string; name?: string }
/** the things into the bag, the sesterzi into the pocket (what `loot` shows has already been given unless `give`) */
export function addLoot(list: Loot[]) {
  st.bag = st.bag || {};
  list.forEach(function (l) {
    if (l.id === 'sesterzi') st.money = money() + (l.n || 0);
    else if (WARES[l.id as ItemId]) st.bag![l.id] = (st.bag![l.id] || 0) + (l.n || 1);
  });
}
function lootName(l: Loot): string { return l.name || thingText(l.id, l.n || 1); }
/** the card: `title` over the picture, the list of what came, a line on where it went; `give`: put it in the bag first */
export function loot(title: string, list: Loot[], note?: string | null, then?: () => void, give?: boolean) {
  list = list.filter(function (l) { return l.id !== 'sesterzi' || (l.n || 0) > 0; });
  if (give) addLoot(list);
  if (!list.length) { if (then) then(); return; }
  save(); renderHud();
  var main = list.filter(function (l) { return l.id !== 'sesterzi'; })[0] || list[0];
  var big = main.art || art(main.id, 112);
  var useful = list.some(function (l) { return l.id === 'ambrosia'; }) ? 'L\'ambrosia è nella borsa: dal menu, Borsa, la dai a chi vuoi.' : '';
  sfx('found');
  sheet('<div class="award loot" role="dialog" aria-modal="true" aria-labelledby="lt-t">' +
    '<div class="loot-stage" aria-hidden="true"><span class="loot-rays"></span><span class="loot-main">' + big + '</span><i class="spk s1"></i><i class="spk s2"></i><i class="spk s3"></i><i class="spk s4"></i></div>' +
    '<h2 id="lt-t">' + esc(title) + '</h2>' +
    '<ul class="loot-list">' + list.map(function (l, i) {
      return '<li style="--d:' + (380 + i * 140) + 'ms"><span class="loot-ico">' + (l.art ? l.art.replace(/width="\d+" height="\d+"/, 'width="34" height="34"') : art(l.id, 34)) + '</span><b>' + esc(lootName(l)) + '</b></li>';
    }).join('') + '</ul>' +
    (note || useful ? '<p>' + esc([note || '', useful].filter(Boolean).join(' ')) + '</p>' : '') +
    '<button class="btn primary" type="button" id="lt-ok">Continua</button></div>', 'result loot-ov');
  $('lt-ok').addEventListener('click', function () { closeSheet(); if (then) then(); });
  setTimeout(function () { var b = $('lt-ok'); if (b) b.focus(); }, reduced ? 30 : 500);
}
/** a small find, without stopping the walk: the toast with the picture that pops in */
export function lootToast(id: string, html: string) {
  notify('<span class="toast-art">' + art(id, 34) + '</span><span>' + html + '</span>');
}
