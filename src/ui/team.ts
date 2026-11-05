import { st, save } from '../save/story-progress';
import { beatersOf, isPersonType, type TypeName } from '../data/types';
import { fighter } from '../data/fighters';
import { ROSTER, type FriendId } from '../data/characters';
import { PATHS, formAt, isFriend, withForm } from '../data/people';
import { SPECIES, STARTERS, CMOVES, isSpecies, type SpeciesId } from '../data/creatures';
import { SKILLS, WARES, SHOPS, toNext, MAX_LEVEL, xpFor, moneyFor, atLevel, trainerXp, withNature, natureText, statGain, coins, type ItemId, type SkillId, type Branch, type Skill } from '../data/growth';
import { beaterOf } from '../battle';
import { team, level, idOf, nameOf, setNick, creatureOf, gainXp, pointsLeft, takeSkill, skillOpen, grade, money, earn, has, priceFor, buy, drinkCoffee, addCreature, leadCreature, setLead, dexOf, movesOf, swapMove, addBond, hearts, teamMons, homeMons, sendHome, bringAlong, firstHuman, setFirst, heldInBag, giveHeld, TEAM_MAX, BAG_ITEMS, dexPrizesDue, nextDexPrize, prizeText, anyMove, formNow, type Growth, type Mon } from '../story/growth';
import { coin, ico } from './icons';
import { bagIcon } from './spells';
import { M } from '../story/maps';
import { SPR } from '../render/svg';
import { creature } from '../render/svg/creatures';
import { esc, each, $ } from './dom';
import { say, sheet, closeSheet, renderHud, mentorTip } from './story-screen';
import { sfx } from '../audio';
import { setPace } from '../story/movement';
import { rivalFor } from '../story/rival';
import { ABILITIES, HELD, type HeldId } from '../data/passives';

/* Antonio's team on the story screen: the first creature, who goes into battle, what a battle brings (experience,
   money, new moves, a new form), the shops, the team and the bag in the menu, Antonio's abilities. */

export function tcOf(key: string) { return 'var(--t-' + fighter(idOf(key)).type.toLowerCase() + ')'; }
/** a fighter's picture: a friend's face, or the creature */
export function portrait(key: string): string {
  var id = idOf(key);
  var mon = creatureOf(key);
  return isSpecies(id) ? creature(id, 'smirk', '', '10 26 180 170', undefined, !!(mon && mon.gold)) : SPR.personIn(id, formNow(key), 'smirk', '', SPR.thumb(id));
}
function xpBar(key: string): string {
  var l = level(key), need = toNext(l.lv), pct = l.lv >= MAX_LEVEL ? 100 : Math.round(100 * l.xp / need);
  return '<span class="xpbar" role="img" aria-label="' + l.xp + ' punti esperienza su ' + need + '"><i style="width:' + pct + '%"></i></span>';
}

/* ---------- the first creature, from the guardaparco of Gianola ---------- */
export function chooseStarter(done: (uid: string) => void) {
  var o = sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sc-t"><div class="sheet-h"><h2 id="sc-t">Scegli la tua prima creatura</h2><button class="tb-btn" type="button" id="sc-x">Ci penso</button></div>' +
    '<p class="hint">Tre creature magiche, nate al Parco di Gianola, cercano casa. Quella che scegli verrà con te: crescerà con te, lotterà con te, e un giorno cambierà forma.</p><div class="starters">' +
    STARTERS.map(function (id) {
      var sp = SPECIES[id];
      return '<button class="starter" type="button" data-sp="' + id + '" style="--tc:var(--t-' + sp.type.toLowerCase() + ')"><span class="art">' + creature(id, 'grin', '', '0 16 200 184') + '</span>' +
        '<b>' + esc(sp.name) + '</b><span class="type t-' + sp.type.toLowerCase() + '">' + sp.type + '</span><small>' + esc(sp.text) + '</small></button>';
    }).join('') + '</div></div>');
  $('sc-x').addEventListener('click', closeSheet);
  each(o.querySelectorAll('.starter'), function (b) {
    b.addEventListener('click', function () {
      var sp = b.getAttribute('data-sp') as SpeciesId;
      closeSheet();
      st.seen.starter = true;
      var uid = addCreature(sp, 5, false, 40);
      /* and the guardaparco's grandson takes the one that beats it */
      st.rival = rivalFor(sp);
      save(); sfx('badge');
      /* the guardaparco talks first: Cicero's new chapter waits for him, and for his grandson */
      done(uid);
      renderHud();
    });
  });
  setTimeout(function () { var b = o.querySelector<HTMLElement>('.starter'); if (b) b.focus(); }, 30);
}

/* ---------- who goes into battle ---------- */
/** one of a few of Antonio's team, from their pictures (with a mark on the ones that have the advantage) */
function pickFrom(title: string, hint: string, keys: string[], go: (key: string) => void, best?: string[] | null) {
  var o = sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pf-t"><div class="sheet-h"><h2 id="pf-t">' + esc(title) + '</h2><button class="tb-btn" type="button" id="pf-x">Annulla</button></div>' +
    '<p class="hint">' + esc(hint) + '</p><div class="pickgrid">' +
    keys.map(function (key) {
      var c = fighter(idOf(key));
      return '<button class="pick" type="button" data-key="' + key + '" style="--tc:' + tcOf(key) + '"><span class="face">' + portrait(key) + '</span><span>' + esc(nameOf(key)) + ' <small class="lv">Lv ' + level(key).lv + '</small></span>' +
        (best && (best.indexOf(c.type) >= 0 || (c.type2 && best.indexOf(c.type2) >= 0)) ? '<small class="adv">Vantaggio</small>' : '') + '</button>';
    }).join('') + '</div></div>');
  $('pf-x').addEventListener('click', closeSheet);
  each(o.querySelectorAll('.pick'), function (b) { b.addEventListener('click', function () { closeSheet(); go(b.getAttribute('data-key')!); }); });
  setTimeout(function () { var b = o.querySelector<HTMLElement>('.pick'); if (b) b.focus(); }, 30);
}
/** one of these to send into battle (the only one goes straight in) */
export function pickFighter(title: string, foeType: TypeName, keys: string[], go: (key: string) => void, foeType2?: TypeName) {
  if (keys.length <= 1) { go(keys[0] || 'antonio'); return; }
  if (isPersonType(foeType) && !foeType2 && !keys.some(function (k) { return isSpecies(idOf(k)); })) {
    var best = beaterOf(foeType);
    pickFrom(title, 'È di tipo ' + foeType + ': ha il vantaggio chi è di tipo ' + (best || '') + '.', keys, go, best ? [best] : null);
    return;
  }
  /* against a creature: the magic that beats each of its types */
  var foes = foeType2 ? [foeType, foeType2] : [foeType], good: TypeName[] = [];
  foes.forEach(function (t) { beatersOf(t).forEach(function (b) { if (good.indexOf(b) < 0 && foes.indexOf(b) < 0) good.push(b); }); });
  pickFrom(title, 'È di tipo ' + foes.join(' e ') + ': ha il vantaggio la magia ' + good.join(', ') + '.', keys, go, good);
}
/* ---------- a coffee at the counter of the bar: drunk there and then, by whoever Antonio picks ---------- */
function coffee() {
  var drink = function (key: string) {
    var g = drinkCoffee(key);
    save(); closeSheet(); renderHud();
    if (g) growthSay(g, [nameOf(key) + ' beve un caffè al bancone: +' + g.xp + ' punti esperienza.']);
  };
  var keys = team();
  if (keys.length <= 1) { drink(keys[0] || 'antonio'); return; }
  pickFrom('Chi beve il caffè?', 'Un caffè al bancone dà subito 60 punti esperienza a chi lo beve.', keys, drink);
}

/* ---------- what a battle brings ---------- */
/** a fighter's numbers at a level (a creature with its character) */
function statsAt(key: string, id: string, lv: number) {
  var mon = creatureOf(key), base = idOf(key);
  if (mon) return withNature(atLevel(SPECIES[id as SpeciesId].stats, lv), mon.nat);
  return isFriend(base) ? withForm(atLevel(fighter(base).stats, lv), formAt(base, lv)) : atLevel(fighter(base).stats, lv);
}
/** says what a fighter got: levels (and what they bring), new moves, ability points; then its new form, if it
    evolves, and the moves it wants to learn in place of one it knows */
export function growthSay(g: Growth, first: string[], then?: () => void) {
  var id = g.evolved ? g.evolved.from : idOf(g.key), who = nameOf(g.key), lines = first.slice();
  if (g.to > g.from) lines.push(who + ' sale al livello ' + g.to + '! ' + statGain(statsAt(g.key, id, g.from), statsAt(g.key, id, g.to)) + '.');
  g.learned.forEach(function (m) { lines.push(who + ' impara ' + anyMove(m).name + '!'); });
  if (g.key === 'antonio' && g.to > g.from) lines.push('Antonio ha ' + pointsLeft() + (pointsLeft() === 1 ? ' punto abilità' : ' punti abilità') + ' da spendere: apri il menu, Squadra.');
  if (g.waiting && g.to > g.from) lines.push(who + ' potrebbe diventare ' + SPECIES[g.waiting].name + ', ma deve fidarsi ancora di più di te: lotta insieme a lui, portalo a spasso, offrigli un caffè.');
  if (g.to > g.from) sfx('badge');
  say(lines, null, null, function () {
    var learn = function () { askLearn(g.key, g.pending, function () { if (then) then(); }); };
    if (g.evolved) evolve(g.evolved.from, g.evolved.to, learn); else if (g.grew) grow(g.grew.id, g.grew.from, g.grew.to, learn); else learn();
  });
}
/** a move to learn when four are known already: which one to forget, or none */
function askLearn(key: string, list: string[], then: () => void) {
  if (!list.length) { then(); return; }
  var m = list[0], rest = list.slice(1), who = nameOf(key), next = function () { askLearn(key, rest, then); };
  var nw = anyMove(m);
  say([who + ' vuole imparare ' + nw.name + '. ' + nw.text, 'Ma conosce già quattro mosse. Ne dimentica una?'], null,
    movesOf(key).map(function (old) {
      return { label: 'Dimentica ' + anyMove(old).name, fn: function () {
        swapMove(key, old, m); save();
        say(['Uno, due e… puf! ' + who + ' ha dimenticato ' + anyMove(old).name + ' e ha imparato ' + nw.name + '!'], null, null, next);
      } };
    }).concat([{ label: 'Non imparare ' + nw.name, fn: function () { say([who + ' non ha imparato ' + nw.name + '.'], null, null, next); } }]));
}
/** after a story battle: experience for who fought (a third when lost), money for a win (not in the middle of a
    trainer's battle: the trainer pays at the end) */
export function rewards(key: string, foeLv: number, won: boolean, covo: boolean, then?: () => void, noMoney?: boolean) {
  pay(key, xpFor(foeLv, won, covo), won, won && !noMoney ? moneyFor(foeLv, covo) : 0, then);
}
/** the end of a fight: one after the other, each with what it earned; the money goes with the first */
export function rewardsAll(list: { key: string; xp: number; won: boolean }[], cash: number, then?: () => void) {
  var n = 0, next = function () { var r = list[n++]; if (r) pay(r.key, r.xp, r.won, n === 1 ? cash : 0, next); else if (then) then(); };
  next();
}
function pay(key: string, xp: number, won: boolean, cash: number, then?: () => void) {
  var name = nameOf(key);
  /* a creature grows faster with a trainer, and every battle fought together brings it closer to Antonio */
  if (creatureOf(key)) { xp = trainerXp(xp, st.skills || {}); addBond(key, won ? 4 : 2); }
  var g = gainXp(key, xp);
  if (cash) earn(cash);
  save(); renderHud();
  if (cash) mentorTip('money');
  if (key === 'antonio' && g.to > g.from) mentorTip('level');
  growthSay(g, [name + ' guadagna ' + xp + ' punti esperienza.' + (cash ? ' Antonio incassa ' + coins(cash) + '.' : '')], then);
}
function evolve(from: SpeciesId, to: SpeciesId, then?: () => void) {
  sfx('badge');
  var a = SPECIES[from], b = SPECIES[to];
  sheet('<div class="award evolve" role="dialog" aria-modal="true" aria-labelledby="ev-t" style="--tc:var(--t-' + b.type.toLowerCase() + ')">' +
    '<h2 id="ev-t">Cosa? Una luce avvolge ' + esc(a.name) + '!</h2>' +
    '<div class="evo"><span>' + creature(from, 'worried', '', '0 16 200 184') + '</span><b aria-hidden="true">→</b><span>' + creature(to, 'cool', '', '0 16 200 184') + '</span></div>' +
    '<p>La magia di Formia l\'ha cambiato: ' + esc(a.name) + ' è diventato <b>' + esc(b.name) + '</b>. ' + esc(b.text) + '</p>' +
    '<button class="btn primary" type="button" id="ev-ok">Continua</button></div>', 'result');
  $('ev-ok').addEventListener('click', function () { closeSheet(); mentorTip('evolve'); if (then) then(); });
  setTimeout(function () { var bt = $('ev-ok'); if (bt) bt.focus(); }, 30);
}

/** a person down to the chest: what changes with a form are the clothes, and the small picture stops at the face */
const BUST = '0 6 260 294';
/** a person changes form: the same light as a creature, and other clothes */
function grow(id: FriendId, from: number, to: number, then?: () => void) {
  sfx('badge');
  var c = fighter(id), f = PATHS[id].forms[to - 1];
  sheet('<div class="award evolve" role="dialog" aria-modal="true" aria-labelledby="ev-t" style="--tc:var(--t-' + c.type.toLowerCase() + ')">' +
    '<h2 id="ev-t">Cosa? Una luce avvolge ' + esc(c.name) + '!</h2>' +
    '<div class="evo"><span>' + SPR.personIn(id, from, 'worried', '', BUST) + '</span><b aria-hidden="true">→</b><span>' + SPR.personIn(id, to, 'grin', '', BUST) + '</span></div>' +
    '<p>' + esc(c.name) + ' è diventato <b>' + esc(f.title) + '</b>. ' + esc(f.text) + '</p>' +
    '<button class="btn primary" type="button" id="ev-ok">Continua</button></div>', 'result');
  $('ev-ok').addEventListener('click', function () { closeSheet(); if (then) then(); });
  setTimeout(function () { var bt = $('ev-ok'); if (bt) bt.focus(); }, 30);
}

/* ---------- the shops of Formia ---------- */
export function openShop(id: string) {
  var sh = SHOPS[id];
  var render = function (bought?: string) {
    var o = sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t"><div class="sheet-h"><h2 id="sh-t">' + esc(sh.name) + '</h2><button class="tb-btn" type="button" id="shop-x">Chiudi</button></div>' +
      '<p class="hint">' + esc(bought ? 'Ecco qua: ' + bought + '. Altro?' : sh.hello) + '</p><p class="wallet">In tasca: <b>' + coin() + coins(money()) + '</b></p><ul class="wares">' +
      sh.sells.map(function (it) {
        var w = WARES[it], p = priceFor(it);
        /* the coffee is drunk at the counter (one already paid for, from an old save, first) */
        if (it === 'caffe') return '<li><span><b>' + esc(w.name) + '</b><small>' + esc(w.text) + '</small></span>' +
          '<button class="btn" type="button" data-it="caffe"' + (money() < p && !has('caffe') ? ' disabled' : '') + '>' + (has('caffe') ? 'Bevi (già pagato)' : 'Bevi · ' + coin(16) + p) + '</button></li>';
        return '<li><span class="ware-ico">' + bagIcon(it) + '</span><span><b>' + esc(w.name) + '</b><small>' + esc(w.text) + ' Ne hai ' + has(it) + '.</small></span>' +
          '<button class="btn" type="button" data-it="' + it + '"' + (money() < p ? ' disabled' : '') + ' aria-label="Compra ' + esc(w.name) + ' per ' + coins(p) + '">' + coin(16) + p + '</button></li>';
      }).join('') + '</ul>' + (money() < Math.min.apply(null, sh.sells.map(priceFor)) && !has('caffe') ? '<p class="hint">Non hai abbastanza soldi: si guadagnano lottando e con le attività in giro per Formia.</p>' : '') + '</div>');
    $('shop-x').addEventListener('click', closeSheet);
    each(o.querySelectorAll('[data-it]'), function (b) {
      b.addEventListener('click', function () {
        var it = b.getAttribute('data-it') as ItemId;
        if (it === 'caffe') { if (!has('caffe') && !buy(it)) return; sfx('pickup'); save(); renderHud(); coffee(); return; }
        if (!buy(it)) return;
        sfx('pickup'); save(); renderHud();
        render(WARES[it].name.toLowerCase());
      });
    });
    setTimeout(function () { var b = o.querySelector<HTMLElement>('[data-it]:not([disabled])') || $('shop-x'); if (b) b.focus(); }, 30);
  };
  render();
}

/* ---------- in the menu: the two teams, the people and the creatures, and the bag ---------- */
/** one of the team, with what can be done with it */
function memberRow(key: string): string {
  var c = fighter(idOf(key)), l = level(key), mon = creatureOf(key), sp = mon ? SPECIES[mon.sp] : null, note: string;
  if (key === 'antonio') note = pointsLeft() ? pointsLeft() + (pointsLeft() === 1 ? ' punto abilità' : ' punti abilità') + ' da spendere' : 'Abilità: ' + (SKILLS.filter(function (s) { return grade(s.id); }).map(function (s) { return s.name + ' ' + grade(s.id); }).join(', ') || 'nessuna');
  else note = sp ? (sp.evolve ? 'Si evolve al livello ' + sp.evolve.at : 'Forma finale') + (leadCreature() === key ? ' · ti segue' : '') : personNote(key);
  var human = !mon, first = human && firstHuman() === key;
  return '<li style="--tc:' + tcOf(key) + '"' + (first ? ' class="first"' : '') + '><span class="face">' + portrait(key) + '</span><span class="tm"><b>' + esc(nameOf(key)) + ' <small class="lv">Lv ' + l.lv + '</small>' + (first ? ' <small class="tag-first">Primo</small>' : '') + '</b>' + xpBar(key) +
    '<small>' + esc((sp ? typesOf(sp) : c.type) + ' · ' + note) + '</small></span>' +
    (human && !first ? '<button class="btn small" type="button" data-first="' + key + '" title="Sulla mappa ci sarà lui, con le sue creature">Gioca con lui</button>' : '') +
    (key === 'antonio' ? '<button class="btn small" type="button" data-skills>Abilità</button>' : '') +
    '<button class="btn small" type="button" data-cr="' + key + '">Scheda</button></li>';
}
function typesOf(sp: { type: string; type2?: string }): string { return sp.type + (sp.type2 ? '/' + sp.type2 : ''); }
/** a team's six places, as in the games: a little face on each one taken, the free ones dashed */
function slotsHtml(keys: string[], max: number): string {
  var out = '';
  for (var k = 0; k < max; k++) out += keys[k] ? '<i class="on" style="--tc:' + tcOf(keys[k]) + '">' + portrait(keys[k]) + '</i>' : '<i></i>';
  return '<span class="slots" aria-hidden="true">' + out + '</span>';
}
export function teamHtml(): string {
  var people = (st.squad as string[]).slice(), mons = teamMons().map(function (m) { return m.uid; }), home = homeMons().length;
  return '<div class="teams">' +
    /* the people: Antonio, and the friends who joined him once beaten in their covo; they fight people */
    '<section class="party people"><div class="party-h">' + ico('users') + '<h3>Le persone</h3><small>' + people.length + ' su ' + ROSTER.length + '</small>' + slotsHtml(people, ROSTER.length) + '</div>' +
    '<ul class="team">' + people.map(memberRow).join('') + '</ul>' +
    (people.length < ROSTER.length ? '<p class="hint">Gli altri amici sono in giro per Formia: batti chi ha un covo, gioca con gli altri, e vengono con te. Ognuno ha la sua squadra, e alcune missioni può farle solo lui.</p>' : '') + '</section>' +
    /* the creatures: up to six travel with him, the others wait at home; they fight creatures */
    '<section class="party mons"><div class="party-h">' + ico('paw') + '<h3>Le creature di ' + esc(nameOf(firstHuman())) + '</h3><small>' + mons.length + ' su ' + TEAM_MAX + '</small>' + slotsHtml(mons, TEAM_MAX) + '</div>' +
    (mons.length ? '<ul class="team">' + mons.map(memberRow).join('') + '</ul>' : '') +
    (st.seen.starter ? '' : '<p class="hint">Al Parco di Gianola il guardaparco cerca qualcuno a cui affidare un cucciolo.</p>') +
    (home || M.id === 'casa' ? '<p class="hint">' + (home ? 'A casa ti aspettano ' + home + (home === 1 ? ' creatura' : ' creature') + '. ' : '') +
      'In viaggio ne porti al massimo ' + TEAM_MAX + ': per cambiarle, parla con loro nel tuo appartamento.</p>' +
      (M.id === 'casa' ? '<button class="btn small" type="button" data-home-open>Cambia squadra</button>' : '') : '') + '</section></div>' +
    '<div class="pickrow"><h3>Borsa · ' + coin() + coins(money()) + '</h3><ul class="wbadge-list diary bag">' + BAG_ITEMS.map(function (it) {
      return '<li class="' + (has(it) ? 'got' : '') + '"><span class="diary-n" aria-hidden="true">' + has(it) + '</span><span class="ware-ico">' + bagIcon(it) + '</span><span><b>' + esc(WARES[it].name) + '</b><small>' + esc(WARES[it].text) + '</small></span></li>';
    }).join('') + '</ul><p class="hint">I retini li vende il retaio di Gianola, accanto al guardaparco; nasse e retini da pesca anche il pescatore di Mola. La tiella la fa il forno di Castellone. Al bar di Mola un caffè al bancone fa crescere subito chi lo beve.</p></div>';
}
export function wireTeam(reopen: () => void) {
  each(document.querySelectorAll('[data-cr]'), function (b) { b.addEventListener('click', function () { openCreature(b.getAttribute('data-cr')!, reopen); }); });
  each(document.querySelectorAll('[data-dex]'), function (b) { b.addEventListener('click', function () { openSpecies(b.getAttribute('data-dex') as SpeciesId, reopen); }); });
  each(document.querySelectorAll('[data-lead]'), function (b) {
    b.addEventListener('click', function () { setLead(b.getAttribute('data-lead')!); save(); closeSheet(); reopen(); });
  });
  each(document.querySelectorAll('[data-skills]'), function (b) { b.addEventListener('click', function () { openSkills(reopen); }); });
  each(document.querySelectorAll('[data-first]'), function (b) {
    b.addEventListener('click', function () { setFirst(b.getAttribute('data-first')!); save(); renderHud(); closeSheet(); reopen(); });
  });
  each(document.querySelectorAll('[data-home-open]'), function (b) { b.addEventListener('click', function () { openHome(reopen); }); });
}

/* ---------- the creatures at home: Antonio's flat keeps the ones not travelling with him ---------- */
export function openHome(back?: () => void) {
  var row = function (m: Mon, home: boolean, blocked: boolean) {
    var key = m.uid, l = level(key);
    return '<li style="--tc:' + tcOf(key) + '"><span class="face">' + portrait(key) + '</span><span class="tm"><b>' + esc(nameOf(key)) + ' <small class="lv">Lv ' + l.lv + '</small></b>' + xpBar(key) +
      '<small>' + esc(SPECIES[m.sp].type + ' · ' + (hearts(key) ? '♥'.repeat(hearts(key)) : 'ancora diffidente') + (leadCreature() === key ? ' · ti segue' : '')) + '</small></span>' +
      '<button class="btn small" type="button" data-' + (home ? 'along' : 'stay') + '="' + key + '"' + (blocked ? ' disabled' : '') + '>' + (home ? 'Portala con te' : 'Lasciala a casa') + '</button></li>';
  };
  var render = function () {
    var tm = teamMons(), hm = homeMons();
    var o = sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="hm-t"><div class="sheet-h"><h2 id="hm-t">Le creature a casa</h2><button class="tb-btn" type="button" id="hm-x">Chiudi</button></div>' +
      '<p class="hint">In viaggio con te ne porti al massimo ' + TEAM_MAX + '. Le altre restano qui nel tuo appartamento e ti aspettano: non crescono, ma non si stancano mai.</p>' +
      '<div class="pickrow"><h3>In viaggio con te · ' + tm.length + ' su ' + TEAM_MAX + '</h3><ul class="team">' + tm.map(function (m) { return row(m, false, tm.length <= 1); }).join('') + '</ul></div>' +
      '<div class="pickrow"><h3>A casa · ' + hm.length + '</h3>' + (hm.length ? '<ul class="team">' + hm.map(function (m) { return row(m, true, tm.length >= TEAM_MAX); }).join('') + '</ul>'
        : '<p class="hint">Per ora nessuna. Lasciane qui una, o catturane altre: quando la squadra è al completo, le nuove vengono a casa da sole.</p>') + '</div></div>');
    each(o.querySelectorAll('[data-stay]'), function (b) { b.addEventListener('click', function () { if (sendHome(b.getAttribute('data-stay')!)) { sfx('pickup'); save(); renderHud(); render(); } }); });
    each(o.querySelectorAll('[data-along]'), function (b) { b.addEventListener('click', function () { if (bringAlong(b.getAttribute('data-along')!)) { sfx('pickup'); save(); renderHud(); render(); } }); });
    $('hm-x').addEventListener('click', function () { closeSheet(); if (back) back(); });
    setTimeout(function () { var b = o.querySelector<HTMLElement>('[data-stay]:not([disabled]), [data-along]:not([disabled])') || $('hm-x'); if (b) b.focus(); }, 30);
  };
  render();
}
/* ---------- Antonio's abilities: a tree of three branches ---------- */
/* Three ways of being Antonio, a branch each: on every branch an ability opens with a point in the one before it.
   A point comes with each of his levels; tap an ability to read it, and +1 to take a grade. */
const BRANCHES: Branch[] = ['Esploratore', 'Allenatore', 'Formiano'];
const BRANCH: Record<Branch, { name: string; col: string; ico: string }> = {
  Esploratore: { name: 'Esploratore di Formia', col: 'var(--t-calma)', ico: 'flag' },
  Allenatore: { name: 'Allenatore di creature', col: 'var(--t-caos)', ico: 'ball' },
  Formiano: { name: 'Formiano doc', col: 'var(--t-cuore)', ico: 'spark' }
};
const SKILL_ICO: Record<SkillId, string> = { svelto: 'bolt', passo: 'paw', fortuna: 'eye', allenatore: 'chart', mano: 'net', legame: 'heart', amici: 'users', memoria: 'notes', prompt: 'robot', ultima: 'shield' };
function skillOf(id: SkillId): Skill { return SKILLS.filter(function (s) { return s.id === id; })[0]; }
function skillPips(s: Skill): string {
  var g = grade(s.id);
  return '<span class="pips" aria-hidden="true">' + Array.from({ length: s.max }, function (_, k) { return '<i class="' + (k < g ? 'on' : '') + '"></i>'; }).join('') + '</span>';
}
var picked: SkillId | null = null;
export function openSkills(back: () => void) {
  var render = function (popped?: SkillId) {
    var left = pointsLeft();
    /* the one shown below the tree: the last tapped, or the first that can grow */
    if (!picked) picked = (SKILLS.filter(function (s) { return skillOpen(s.id) && grade(s.id) < s.max; })[0] || SKILLS[0]).id;
    var node = function (s: Skill) {
      var g = grade(s.id), open = skillOpen(s.id), full = g >= s.max;
      var cls = 'sk-node' + (open ? '' : ' locked') + (g ? ' some' : '') + (full ? ' full' : '') + (open && !full && left ? ' can' : '') + (picked === s.id ? ' sel' : '') + (popped === s.id ? ' took' : '');
      return '<li class="' + cls + '"><button type="button" data-skn="' + s.id + '" aria-pressed="' + (picked === s.id) + '" aria-label="' + esc(s.name + ': grado ' + g + ' su ' + s.max + (open ? '' : ', ancora chiusa')) + '">' +
        '<span class="sk-orb">' + ico(open ? SKILL_ICO[s.id] : 'lock') + (full ? '<span class="sk-star">' + ico('star') + '</span>' : '') + '</span>' +
        skillPips(s) + '<span class="sk-name">' + esc(s.name) + '</span></button></li>';
    };
    var tree = BRANCHES.map(function (br) {
      var b = BRANCH[br];
      return '<div class="sk-branch" style="--bc:' + b.col + '"><h3>' + ico(b.ico) + '<span>' + esc(b.name) + '</span></h3><ol class="sk-path">' +
        SKILLS.filter(function (s) { return s.branch === br; }).map(node).join('') + '</ol></div>';
    }).join('');
    var sk = skillOf(picked), g = grade(sk.id), open = skillOpen(sk.id), full = g >= sk.max, prev = sk.after ? skillOf(sk.after) : null;
    var detail = '<div class="sk-detail" style="--bc:' + BRANCH[sk.branch].col + '" aria-live="polite"><span class="sk-orb">' + ico(open ? SKILL_ICO[sk.id] : 'lock') + '</span>' +
      '<div><b>' + esc(sk.name) + '</b><span class="sk-grade">' + skillPips(sk) + ' grado ' + g + ' su ' + sk.max + '</span><small>' + esc(sk.text) + '</small>' +
      (!open && prev ? '<small class="sk-why">Si apre con un punto in «' + esc(prev.name) + '».</small>' : '') + '</div>' +
      '<button class="btn" type="button" data-sk="' + sk.id + '"' + (!open || full || !left ? ' disabled' : '') + '>' + (full ? 'Al massimo' : !open ? 'Chiusa' : '+1') + '</button></div>';
    var head = '<div class="sk-head"><span class="face">' + portrait('antonio') + '</span><span><b>Antonio <small class="lv">Lv ' + level('antonio').lv + '</small></b>' +
      '<small>' + (left ? 'Scegli dove crescere: tocca un\'abilità e prendi un grado.' : 'Un punto a ogni livello: vinci lotte e fai attività per salire.') + '</small></span>' +
      '<span class="sk-points' + (left ? ' has' : '') + '" aria-label="' + left + (left === 1 ? ' punto' : ' punti') + ' da spendere"><b>' + left + '</b><small>' + (left === 1 ? 'punto' : 'punti') + '</small></span></div>';
    var o = sheet('<div class="sheet sk-sheet" role="dialog" aria-modal="true" aria-labelledby="sk-t"><div class="sheet-h"><h2 id="sk-t">Abilità di Antonio</h2><button class="tb-btn" type="button" id="sk-x">Indietro</button></div>' +
      head + '<div class="sk-tree">' + tree + '</div>' + detail + '</div>');
    $('sk-x').addEventListener('click', function () { closeSheet(); back(); });
    each(o.querySelectorAll('[data-skn]'), function (b) {
      b.addEventListener('click', function () { picked = b.getAttribute('data-skn') as SkillId; sfx('click'); render(); focusNode(); });
    });
    each(o.querySelectorAll('[data-sk]'), function (b) {
      b.addEventListener('click', function () { var id = b.getAttribute('data-sk') as SkillId; if (takeSkill(id)) { sfx('pickup'); save(); setPace(); render(id); focusNode(); } });
    });
    var focusNode = function () { setTimeout(function () { var n = o.querySelector<HTMLElement>('[data-skn="' + picked + '"]'); if (n) n.focus(); }, 0); };
    setTimeout(function () { var b = o.querySelector<HTMLElement>('[data-sk]:not([disabled])') || o.querySelector<HTMLElement>('[data-skn="' + picked + '"]') || $('sk-x'); if (b) b.focus(); }, 30);
  };
  render();
}

/* ---------- a creature's page: its numbers, its moves, its forms, its name ---------- */
/** the forms of a creature, from the first */
function chainOf(id: SpeciesId): SpeciesId[] {
  var first = id, found = true;
  while (found) {
    found = false;
    for (var k in SPECIES) { var o = SPECIES[k as SpeciesId]; if (o.evolve && o.evolve.into === first) { first = o.id; found = true; } }
  }
  var out: SpeciesId[] = [first];
  while (SPECIES[out[out.length - 1]].evolve) out.push(SPECIES[out[out.length - 1]].evolve!.into);
  return out;
}
function chainHtml(id: SpeciesId, lit: (sp: SpeciesId) => boolean): string {
  return '<div class="chain">' + chainOf(id).map(function (sp, k, all) {
    var prev = k ? SPECIES[all[k - 1]].evolve!.at : 0, on = lit(sp);
    return (k ? '<span class="chain-at">Lv ' + prev + ' →</span>' : '') + '<span class="chain-c' + (sp === id ? ' now' : '') + (on ? '' : ' dark') + '"><span class="art">' + creature(sp, 'smirk', '', '0 16 200 184') + '</span><small>' + esc(on ? SPECIES[sp].name : '???') + '</small></span>';
  }).join('') + '</div>';
}
/** what the creature carries, and what else there is in the bag to give it */
function heldRow(mon: Mon): string {
  var cur = mon.item ? HELD[mon.item as HeldId] : null, bag = heldInBag();
  return '<div class="pickrow"><h3>Oggetto</h3><ul class="wares">' +
    (cur ? '<li><span><b>' + esc(cur.name) + '</b><small>' + esc(cur.text) + '</small></span><button class="btn" type="button" data-held="">Togli</button></li>' : '') +
    bag.map(function (it) { return '<li><span><b>' + esc(HELD[it].name) + '</b><small>' + esc(HELD[it].text) + ' Ne hai ' + has(it) + '.</small></span><button class="btn" type="button" data-held="' + it + '">' + (cur ? 'Scambia' : 'Dai') + '</button></li>'; }).join('') +
    '</ul>' + (cur || bag.length ? '' : '<p class="hint">Non porta niente. Le cose che può portare si comprano al forno di Castellone, al bar e dal pescatore di Mola; a volte le trova per terra la creatura che ti segue.</p>') + '</div>';
}
/** a friend, in a word: what it has become, or when it will change */
function personNote(key: string): string {
  if (!isFriend(key)) return 'Amico';
  var f = formNow(key), next = PATHS[key].forms[f];
  return (f ? PATHS[key].forms[f - 1].title : 'Amico') + (next ? ' · cambia al livello ' + next.at : ' · forma finale');
}
/** the card of a person: what it knows, what it will learn, how it will change */
function openPerson(key: string, back: () => void) {
  if (!isFriend(key)) return;
  var c = fighter(key), l = level(key), f = formNow(key), s = statsAt(key, key, l.lv), known = movesOf(key), path = PATHS[key];
  var next = path.learn.filter(function (x) { return x[0] > l.lv && known.indexOf(x[1]) < 0; })[0], form = path.forms[f];
  sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cr-t" style="--tc:var(--t-' + c.type.toLowerCase() + ')"><div class="sheet-h"><h2 id="cr-t">' + esc(c.name) + (f ? ', ' + esc(path.forms[f - 1].title) : '') + '</h2><button class="tb-btn" type="button" id="cr-x">Indietro</button></div>' +
    '<div class="cr-top"><span class="cr-art">' + SPR.personIn(key, f, 'grin', '', BUST) + '</span><div class="cr-info">' +
    '<p><span class="type t-' + c.type.toLowerCase() + '">' + c.type + '</span> · Livello ' + l.lv + '</p>' + xpBar(key) +
    '<div class="mini-stats"><div><span>PS</span><strong>' + s.hp + '</strong></div><div><span>Attacco</span><strong>' + s.atk + '</strong></div><div><span>Difesa</span><strong>' + s.def + '</strong></div><div><span>Velocità</span><strong>' + s.spe + '</strong></div></div></div></div>' +
    '<div class="pickrow"><h3>Mosse</h3><ul class="wares">' + known.map(function (m) { var x = anyMove(m); return '<li><span><b>' + esc(x.name) + '</b><small>' + esc(x.text) + '</small></span></li>'; }).join('') + '</ul>' +
    (next ? '<p class="hint">Al livello ' + next[0] + ' vorrà imparare ' + esc(anyMove(next[1]).name) + (known.length >= 4 ? ': sceglierai tu quale mossa dimenticare' : '') + '.</p>' : '') +
    (form ? '<p class="hint">Al livello ' + form.at + ' cambia forma.</p>' : '<p class="hint">È arrivato alla sua forma finale.</p>') + '</div></div>');
  $('cr-x').addEventListener('click', function () { closeSheet(); back(); });
  setTimeout(function () { var b = $('cr-x'); if (b) b.focus(); }, 30);
}
export function openCreature(key: string, back: () => void) {
  var mon = creatureOf(key);
  if (!mon) { openPerson(key, back); return; }
  var sp = SPECIES[mon.sp], l = level(key), s = withNature(atLevel(sp.stats, l.lv), mon.nat), known = movesOf(key), h = hearts(key);
  var next = sp.learn.filter(function (x) { return x[0] > l.lv && known.indexOf(x[1]) < 0; })[0];
  var o = sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="cr-t" style="--tc:var(--t-' + sp.type.toLowerCase() + ')"><div class="sheet-h"><h2 id="cr-t">' + esc(nameOf(key)) + '</h2><button class="tb-btn" type="button" id="cr-x">Indietro</button></div>' +
    '<div class="cr-top"><span class="cr-art">' + creature(mon.sp, 'grin', '', '0 16 200 184', undefined, !!mon.gold) + '</span><div class="cr-info">' +
    '<p>' + (mon.nick ? esc(sp.name) + (mon.gold ? ' dorata' : '') + ' · ' : mon.gold ? 'Dorata · ' : '') + '<span class="type t-' + sp.type.toLowerCase() + '">' + sp.type + '</span> · Livello ' + l.lv + '</p>' + xpBar(key) +
    '<small>' + (l.lv >= MAX_LEVEL ? 'Livello massimo' : (toNext(l.lv) - l.xp) + ' punti al livello ' + (l.lv + 1)) + (leadCreature() === key ? ' · ti segue' : '') + '</small>' +
    '<div class="mini-stats"><div><span>PS</span><strong>' + s.hp + '</strong></div><div><span>Attacco</span><strong>' + s.atk + '</strong></div><div><span>Difesa</span><strong>' + s.def + '</strong></div><div><span>Velocità</span><strong>' + s.spe + '</strong></div></div></div></div>' +
    '<p class="bondline"><span class="hearts" aria-label="Legame: ' + h + ' cuori su 5">' + [0, 1, 2, 3, 4].map(function (k) { return '<i class="' + (k < h ? 'on' : '') + '">♥</i>'; }).join('') + '</span>' +
      '<small>' + esc(['Ancora diffidente', 'Comincia a fidarsi', 'Ti vuole bene', 'Non ti lascia mai', 'Inseparabili', 'Inseparabili'][h]) + (mon.nat ? ' · ' + esc(natureText(mon.nat)) : '') + '</small></p>' +
    '<p class="hint">' + esc(sp.text) + ' Dove vive: ' + esc(sp.where) + '.' + (sp.evolve && sp.evolve.bond ? ' Per cambiare forma, oltre al livello ' + sp.evolve.at + ', deve fidarsi di te (tre cuori).' : '') + '</p>' +
    '<div class="pickrow"><h3>Mosse</h3><ul class="wares">' + known.map(function (m) { return '<li><span><b>' + esc(CMOVES[m].name) + '</b><small>' + esc(CMOVES[m].text) + '</small></span></li>'; }).join('') + '</ul>' +
    '<div class="pickrow"><h3>Abilità</h3><ul class="wares">' + (sp.abil || []).map(function (a) { return '<li><span><b>' + esc(ABILITIES[a].name) + '</b><small>' + esc(ABILITIES[a].text) + '</small></span></li>'; }).join('') + '</ul></div>' +
    heldRow(mon) +
    (next ? '<p class="hint">Al livello ' + next[0] + ' vorrà imparare ' + esc(CMOVES[next[1]].name) + (known.length >= 4 ? ': sceglierai tu quale mossa dimenticare' : '') + '.</p>' : '') + '</div>' +
    '<div class="pickrow"><h3>Forme</h3>' + chainHtml(mon.sp, function (x) { return dexOf(x) > 0 || x === mon!.sp; }) + '</div>' +
    '<div class="pickrow"><h3>Nome</h3><form class="nick" id="cr-f"><input id="cr-nick" maxlength="12" autocomplete="off" aria-label="Nome di ' + esc(sp.name) + '" placeholder="' + esc(sp.name) + '" value="' + esc(mon.nick || '') + '"><button class="btn" type="submit">Salva</button></form></div>' +
    '<div class="menu-actions">' + (leadCreature() !== key ? '<button class="btn" type="button" id="cr-lead">Dietro di me</button>' : '') + '</div></div>');
  $('cr-x').addEventListener('click', function () { closeSheet(); back(); });
  $('cr-f').addEventListener('submit', function (e) { e.preventDefault(); setNick(key, ($('cr-nick') as HTMLInputElement).value); save(); renderHud(); openCreature(key, back); });
  if ($('cr-lead')) $('cr-lead').addEventListener('click', function () { setLead(key); save(); openCreature(key, back); });
  each(o.querySelectorAll('[data-held]'), function (b) { b.addEventListener('click', function () { var it = b.getAttribute('data-held'); giveHeld(key, (it || null) as HeldId | null); save(); sfx('pickup'); openCreature(key, back); }); });
  setTimeout(function () { var b = o.querySelector<HTMLElement>('#cr-x'); if (b) b.focus(); }, 30);
}

/* ---------- the creature diary: every species, seen or had ---------- */
export function dexHtml(): string {
  var ids = Object.keys(SPECIES) as SpeciesId[], seen = ids.filter(function (id) { return dexOf(id) > 0; }).length, had = ids.filter(function (id) { return dexOf(id) === 2; }).length;
  return '<div class="pickrow"><h3>Diario delle creature · ' + had + ' avute, ' + seen + ' viste su ' + ids.length + '</h3><div class="dex">' + ids.map(function (id) {
    var d = dexOf(id), sp = SPECIES[id];
    return '<button class="dex-c' + (d === 2 ? ' got' : d ? ' seen' : '') + '" type="button" data-dex="' + id + '"' + (d ? '' : ' disabled aria-label="Creatura ancora sconosciuta"') + ' style="--tc:var(--t-' + sp.type.toLowerCase() + ')">' +
      '<span class="art">' + creature(id, 'smirk', '', '0 16 200 184') + '</span><small>' + (d ? esc(sp.name) : '???') + '</small></button>';
  }).join('') + '</div><p class="hint">Le creature si vedono lottandoci contro; quelle catturate o cresciute con te sono a colori.' + prizeHint() + '</p></div>';
}
/** the guardaparco's next prize for the diary, in a line */
function prizeHint(): string {
  if (dexPrizesDue().length) return ' Il guardaparco di Gianola ha un premio per te: vai a trovarlo.';
  var nx = nextDexPrize();
  return nx ? ' Il guardaparco di Gianola premia chi riempie il diario: con ' + (nx.p.all ? 'tutte le creature' : nx.at + ' creature avute') + ' ti dà ' + esc(prizeText(nx.p)) + '.' : '';
}
export function openSpecies(id: SpeciesId, back: () => void) {
  var sp = SPECIES[id], d = dexOf(id), mine = (st.mons || []).filter(function (m) { return m.sp === id; }).length;
  var o = sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sp-t" style="--tc:var(--t-' + sp.type.toLowerCase() + ')"><div class="sheet-h"><h2 id="sp-t">' + esc(sp.name) + '</h2><button class="tb-btn" type="button" id="sp-x">Indietro</button></div>' +
    '<div class="cr-top"><span class="cr-art' + (d === 2 ? '' : ' seen') + '">' + creature(id, 'smirk', '', '0 16 200 184') + '</span><div class="cr-info"><p><span class="type t-' + sp.type.toLowerCase() + '">' + sp.type + '</span> · ' + esc(sp.where) + '</p>' +
    '<small>' + (d === 2 ? (mine ? 'Nella tua squadra: ' + mine : 'L\'hai avuta: ora è cresciuta in un\'altra forma') : 'Vista in lotta, mai presa') + '</small></div></div>' +
    '<p class="hint">' + esc(sp.text) + '</p><div class="pickrow"><h3>Forme</h3>' + chainHtml(id, function (x) { return dexOf(x) > 0; }) + '</div></div>');
  $('sp-x').addEventListener('click', function () { closeSheet(); back(); });
  setTimeout(function () { var b = o.querySelector<HTMLElement>('#sp-x'); if (b) b.focus(); }, 30);
}
