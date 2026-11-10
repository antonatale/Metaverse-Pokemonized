import { st, save } from '../save/story-progress';
import type { Npc, Sign } from '../data/maps/types';
import { CICERO } from '../story/mentor';
import { STONES, flag, type Stone } from '../story/plot';
import type { LegendDef } from '../data/legends';
import { CHOICES } from '../data/choices';
import { HELD } from '../data/passives';
import { SPECIES } from '../data/creatures';
import { NET_IDS } from '../data/nets';
import { chosen, decide, endFlag, stonesKept, tullioMood } from '../story/choices';
import { addCreature, creatureOf, has, nameOf, own, prizeText } from '../story/growth';
import type { Mission } from '../data/missions';
import { CHARS } from '../data/characters';
import { canDo, missionDone, missionOf, missionOfTrainer, missionPay, tooEarly, myMissions } from '../story/missions';
import { esc, $ } from './dom';
import { say, sheet, closeSheet, renderHud, dexNotice, trainerFight, foesLine, type DialogOpt } from './story-screen';
import { sfx } from '../audio';
import { travel } from '../story/movement';

/* What the people of the plot say (story/plot.ts): the archivist of the Torre di Mola, the lady of the Roman theatre,
   Cicero at his tomb, and what happens after the battles with Mamurra's men and with Mamurra himself. */

/** someone of the plot has something to say now: true when the plot takes the talk. again goes on with the talk as
    usual, without the plot */
export function plotTalk(n: Npc, again: () => void): boolean {
  if (n.id === 'archivista' && flag('tr-mamurr-scavi') && !flag('trama-archivio')) { archive(n.name || ''); return true; }
  if (n.id === 'teatro' && flag('tr-mamurr-cisterna') && !flag('pietra-mura') && !flag('porta-cisterna')) { riddle(n.name || ''); return true; }
  return missionTalk(n, again);
}
/* ---------- the missions of each friend (data/missions.ts): they ask for one of them, and only that one can do it ---------- */
function missionTalk(n: Npc, again: () => void): boolean {
  var m = missionOf(n.id), who = n.name || '';
  if (!m || tooEarly(m)) return false;
  if (!canDo(m)) {
    /* said once, and then on as usual: it is someone like anyone else, with its shop or its game */
    var told = 'ms-' + m.id + '-detto';
    if (st.seen[told]) return false;
    st.seen[told] = true; save();
    say(m.wait, who, null, again);
    return true;
  }
  var go = m.trainer ? function () { trainerFight(m!.trainer!, who); } : function () { quiz(m!, who); };
  say(m.trainer ? m.ask.concat([foesLine(m.trainer)]) : m.ask, who, [{ label: 'Ci sto', fn: go }, { label: 'Più tardi', fn: again }]);
  return true;
}
function quiz(m: Mission, who: string) {
  var ask = function (k: number) {
    var Q = m.quiz![k];
    if (!Q) { missionDoneNow(m, who); return; }
    say([Q.q], who, Q.a.map(function (t, i) {
      return { label: t, fn: function () { if (i === Q.ok) say([Q.yes], who, null, function () { ask(k + 1); }); else say([Q.no], who, null, function () { ask(k); }); } };
    }));
  };
  ask(0);
}
function missionDoneNow(m: Mission, who: string) {
  say(m.done, who, null, function () {
    var c = creatureOf(missionPay(m)), name = nameOf(c!.uid);
    save(); renderHud(); sfx('badge'); dexNotice();
    say(['Per la missione «' + m.name + '»: ' + prizeText({ n: 0, give: m.pay.items || {}, coins: m.pay.money }) + '.', name + (c && c.home ? ' ti aspetta a casa: la squadra è al completo.' : ' entra nella squadra!')]);
  });
}
/** the missions in the menu: who can do each one, and where */
export function missionsHtml(): string {
  var mine = myMissions(), left = mine.filter(function (m) { return !missionDone(m); }).length;
  return '<div class="pickrow"><h3>Missioni · ' + (mine.length - left) + ' su ' + mine.length + '</h3><ul class="wbadge-list">' + mine.map(function (m) {
    var did = missionDone(m), c = CHARS[m.who];
    return '<li class="' + (did ? 'got' : '') + '"><span><b>' + esc(m.name) + '</b><small>' + esc(did ? 'Fatta' : 'Solo ' + c.name + ' · ' + m.where) + '</small></span></li>';
  }).join('') + '</ul></div>';
}
/** a sign of the plot: Cicero's tomb, once Antonio has the other two stones */
export function plotSign(s: Sign): boolean {
  var t = s.text.join(' ');
  /* a way in that the story has opened */
  if (s.enter && s.enter.after.some(flag)) {
    var e = s.enter;
    say(s.text, null, [{ label: e.label, fn: function () { travel(e.to, e.tx, e.ty, e.tdir); } }, { label: 'Non ora', fn: null }]);
    return true;
  }
  /* the Pietra delle Mura, on the still water at the bottom of the Cisternone */
  if (t.indexOf('Pietra delle Mura') >= 0) {
    if (flag('pietra-mura')) { say(['Sull\'acqua ferma è rimasto solo un cerchio di luce.']); return true; }
    st.seen['pietra-mura'] = true; save();
    award('pietra-mura', function () { say(['La prima pietra! Quella del mare, dicono, sta tra le peschiere romane di Caposele. E là c\'è già qualcuno che si immerge.'], CICERO); });
    return true;
  }
  if (t.indexOf('Tomba di Cicerone') < 0 || !flag('pietra-mura') || !flag('pietra-mare') || flag('pietra-voce')) return false;
  tomb();
  return true;
}
/** what comes before a battle, with someone of the plot: Tullio, at Mamurra's villa, is what the player has made of him */
export function plotBefore(id: string): string[] {
  var m = tullioMood();
  if (id !== 'mamurra' || !m) return [];
  return m === 'ally' ? ['Da dietro una colonna spunta Tullio: «{hero}! Mentre parlava gli ho incrinato la Ricchezza. Il resto tocca a te.»']
    : ['Da dietro una colonna spunta Tullio, con il suo sorrisetto: «Gli ho detto io come lotti. Così impari a prendermi in giro.»', 'La Ricchezza di Mamurra è più spessa del previsto.'];
}
/** a question of the story, once: who speaks speaks, the last one asks, the player answers and the answer stays */
export function askChoice(id: string, then?: () => void) {
  if (chosen(id)) { if (then) then(); return; }
  var c = CHOICES[id], k = 0;
  var next = function () {
    var part = c.ask[k++];
    if (k < c.ask.length) { say(part.say, part.who, null, next); return; }
    say(part.say, part.who, c.options.map(function (o) {
      return { label: o.label, fn: function () { decide(id, o.id); save(); renderHud(); say(o.say, o.who || part.who, null, then); } };
    }));
  };
  next();
}
/** what opens each question: the moment it is asked is gone once the battle is won, so a question left unanswered (a page
    closed in the middle, a save from before there were questions) is asked again as soon as the player comes back */
const ASKED: [string, string][] = [['tr-rivale-1', 'tullio1'], ['tr-rivale-2', 'tullio2'], ['tr-mamurra', 'pietre']];
export function askPending() {
  var w = ASKED.filter(function (a) { return flag(a[0]) && !chosen(a[1]); })[0];
  if (w) askChoice(w[1], askPending);
}
/* ---------- how a legend ends (data/legends.ts): the player decides ---------- */
function joins(L: LegendDef, lv: number, bond: number | undefined, then: () => void) {
  var c = creatureOf(addCreature(L.sp, lv, false, bond)), name = SPECIES[L.sp].name;
  save(); renderHud(); sfx('badge'); dexNotice();
  say(c && c.home ? [name + ' è con te! La squadra è al completo: ti aspetta a casa, nel tuo appartamento.'] : [name + ' entra nella tua squadra!', 'Lo trovi nel menu, alla voce Squadra.'], null, null, then);
}
/** beaten and on its knees: the net, a pact, or letting it go */
export function legendEnd(L: LegendDef, lv: number) {
  var E0 = L.end!, name = SPECIES[L.sp].name, opts: DialogOpt[] = [], net = NET_IDS.filter(function (n) { return has(n) > 0; })[0];
  if (net) opts.push({ label: E0.net.label, fn: function () {
    st.bag![net] = has(net) - 1; st.seen[endFlag(L, 'preso')] = true;
    say(E0.net.say, null, null, function () { joins(L, lv, undefined, function () { say(E0.net.cicero, CICERO); }); });
  } });
  if (E0.pact) { var P = E0.pact; opts.push({ label: P.label, fn: function () { st.seen[endFlag(L, 'patto')] = true; save(); say(P.say, name); } }); }
  /* with the stones still in the bag, letting him go is giving them back */
  var back = E0.back && stonesKept() ? E0.back : null;
  opts.push({ label: back ? back.label : E0.free.label, fn: function () {
    st.seen[endFlag(L, 'libero')] = true;
    own(L.sp);
    st.bag = st.bag || {}; st.bag[E0.free.gift] = has(E0.free.gift) + 1;
    save(); renderHud(); sfx('badge'); dexNotice();
    say(back ? back.say : E0.free.say, name, null, function () { say(['Hai ricevuto: ' + HELD[E0.free.gift].name + '.', 'Si dà a una creatura dalla sua scheda.'], null, null, function () { say(E0.free.cicero, CICERO); }); });
  } });
  say(E0.ask, name, opts);
}
/** back to a legend that has asked for something */
export function legendPact(L: LegendDef, lv: number) {
  var P = L.end!.pact!, name = SPECIES[L.sp].name;
  if (has('tiella') < P.need) { say(P.wait, name); return; }
  say(P.wait, name, [{ label: P.give, fn: function () {
    st.bag!.tiella = has('tiella') - P.need; st.seen[endFlag(L, 'amico')] = true;
    say(P.done, name, null, function () { joins(L, lv, 100, function () { say(P.cicero, CICERO); }); });
  } }, { label: 'Non ora', fn: null }]);
}

/** after a battle won against someone of the plot (a trainer's id), with who stood by for it (who asked for a mission) */
export function plotAfter(id: string, who: string) {
  if (id === 'mamurr-scavi') say(['Mamurra… Lucio Mamurra! Lo conoscevo: cavaliere di Formia, prefetto del genio di Cesare, il più ricco di tutti. La villa qui a Gianola era la sua.',
    'Catullo lo chiamava «lo scialacquatore di Formia». Se il suo fantasma cerca le Pietre di Telepilo, vuole qualcosa di grosso.',
    'All\'Archivio della Torre di Mola sanno tutto delle leggende di Formia. Andiamo a chiedere.'], CICERO);
  else if (id === 'mamurr-cisterna') say(['L\'uomo con la torcia scappa giù per i vicoli di Castellone.', 'Una parola per aprire il Cisternone… La signora che abita dentro il teatro romano saprà qualcosa.']);
  else if (id === 'mamurr-peschiere') { st.seen['pietra-mare'] = true; save(); award('pietra-mare', function () {
    say(['Due pietre su tre. Per la terza, vieni a trovarmi alla mia tomba, sull\'Appia verso Gaeta.', 'Sì: la Pietra della Voce la custodisco io. Da duemila anni.'], CICERO);
  }); }
  else if (id === 'mamurra') { st.seen['cic-lamo'] = true; save(); askChoice('pietre'); }
  /* the first two meetings with Tullio: what the player says to him stays */
  else if (id === 'rivale-1') askChoice('tullio1');
  else if (id === 'rivale-2') askChoice('tullio2');
  else { var m = missionOfTrainer(id); if (m) missionDoneNow(m, who); }
}

/* ---------- the way to a legend (data/legends.ts): a riddle the first time, then down ---------- */
export function legendWay(L: LegendDef) {
  var key = 'enigma-' + L.id, t = L.trial!, R = L.riddle;
  var down = function () { travel(t.to, t.x, t.y, t.dir); };
  var offer = function (text: string[]) { say(text, null, [{ label: 'Scendi', fn: down }, { label: 'Non ora', fn: null }]); };
  if (L.angry && stonesKept()) { offer(L.angry.way); return; }
  if (!R || flag(key)) { offer(t.again); return; }
  var ask = function (k: number) {
    if (k >= R!.steps.length) { st.seen[key] = true; save(); sfx('magic'); offer(R!.solved); return; }
    var q = R!.steps[k];
    say([q.ask], null, q.options.map(function (label, i) {
      return { label: label, fn: function () { if (i === q.ok) ask(k + 1); else say(R!.wrong, null, null, function () { ask(0); }); } };
    }));
  };
  say(R.intro, null, null, function () { ask(0); });
}

/* ---------- the archivist: the legend of the stones ---------- */
function archive(who: string) {
  say(['Le Pietre di Telepilo? Allora l\'hai visto anche tu, quello che scava a Gianola.',
    'Cicerone, in una lettera all\'amico Attico, chiamava Formia «la Telepilo dei Lestrigoni»: la città dei giganti dell\'Odissea e del loro re, Lamo.',
    'La leggenda dice che le porte di Telepilo erano chiuse da un sigillo di tre pietre: una delle mura, una del mare e una della voce. Finché stanno a Formia, i giganti dormono.',
    'Quando l\'antica Formiae fu abbandonata, ai tempi dei Saraceni, sulle sue rovine nacquero due paesi: Castellone in alto e Mola sul mare. Le pietre furono nascoste.',
    'La Pietra delle Mura sta a Castellone, nel Cisternone romano. Quella del mare, dicono, tra le peschiere di Caposele. Della terza si sa solo che la custodisce un oratore.',
    'Castellone e Mola sono stati due paesi per quasi mille anni: nel 1819 li unirono, e il 13 marzo 1862 ripresero il nome antico, Formia. Le pietre, invece, non si sono mai riunite.',
    'Se quegli uomini le trovano prima di te, chissà cosa può succedere. Trovale tu.'], who, null, function () {
    st.seen['trama-archivio'] = true; save(); renderHud();
    say(['Un oratore che custodisce una pietra… Mi viene in mente qualcuno, ma ne parliamo quando avrai le altre due.', 'Prima Castellone: il Cisternone.'], CICERO);
  });
}
/* ---------- the lady of the theatre: the word that opens the Cisternone ---------- */
function riddle(who: string) {
  var ask = function () {
    say(['Quante torri avevano le mura di Castellone?'], who, [
      { label: 'Otto', fn: wrong }, { label: 'Dodici', fn: right }, { label: 'Venti', fn: wrong }
    ]);
  };
  var wrong = function () { say(['No, no. Chiedi al signore di Castellone, vicino alla torre ottagonale: lui le conta da quando è nato.'], who); };
  var right = function () {
    st.seen['porta-cisterna'] = true; save(); renderHud();
    say(['Dodici! Intera ne è rimasta solo una, quella ottagonale: le altre se le è prese la guerra.', 'Ecco: la porta del Cisternone è aperta. Sull\'acqua ferma, in fondo, c\'è una pietra che brilla.', 'Là sotto è buio, e l\'acqua si muove. Guarda bene dove metti i piedi.'], who);
  };
  say(['Hai mandato via quello con la torcia? Bravo: ha svegliato mezzo teatro.', 'La Pietra delle Mura sta nel Cisternone da quando è nato Castellone. La porta si apre solo a chi conosce le mura.'], who, null, ask);
}
/* ---------- Cicero at his tomb: three questions, like an exam ---------- */
const QUESTIONS: { q: string; a: string[]; ok: number; why: string }[] = [
  { q: 'In che anno sono morto, qui vicino alla mia villa di Formia?', a: ['Nel 44 avanti Cristo', 'Nel 43 avanti Cristo', 'Nel 79 dopo Cristo'], ok: 1, why: 'Nel 43 avanti Cristo. Il 44 è l\'anno di Cesare, il 79 quello del Vesuvio.' },
  { q: 'Come si chiamava il comune prima di riprendere il nome di Formia, nel 1862?', a: ['Gianola e Maranola', 'Vindicio e Trivio', 'Mola e Castellone'], ok: 2, why: 'Mola e Castellone: i due paesi nati sulle rovine di Formiae, uniti nel 1819.' },
  { q: 'Chi è il patrono di Formia, il protettore dei marinai?', a: ['Sant\'Erasmo', 'San Giovanni', 'San Lorenzo'], ok: 0, why: 'Sant\'Erasmo, morto a Formia nel 303: il fuoco di Sant\'Elmo porta il suo nome.' }
];
function tomb() {
  sfx('magic');
  var ask = function (k: number) {
    if (k >= QUESTIONS.length) {
      say(['Promosso, e con lode. Tieni: la Pietra della Voce.'], CICERO, null, function () {
        st.seen['pietra-voce'] = true; save();
        award('pietra-voce', function () { say(['Tre pietre. Adesso Mamurra verrà a cercarti: alla sua villa, a Gianola. Lo aspetto da duemila anni anch\'io.'], CICERO); });
      });
      return;
    }
    var Q = QUESTIONS[k];
    say([Q.q], CICERO, Q.a.map(function (t, i) {
      return { label: t, fn: function () {
        if (i === Q.ok) say(['Giusto. ' + Q.why], CICERO, null, function () { ask(k + 1); });
        else say(['No, no, no. Riprova: un oratore non si arrende mai.'], CICERO, null, function () { ask(k); });
      } };
    }));
  };
  say(['Eccoti alla mia tomba. Hai la Pietra delle Mura e la Pietra del Mare: la Pietra della Voce la custodisco io, da duemila anni.', 'Ma non la do a chi non conosce Formia. Tre domande, come all\'esame.'], CICERO, null, function () { ask(0); });
}

/* ---------- a stone found: its picture, and what it is ---------- */
export function stoneSVG(s: Stone, size: number, got = true): string {
  var mark = s.mark === 'wall' ? '<path d="M18 34 L30 30 L42 34 M24 22 L36 24 M30 30 L28 44" fill="none" stroke="#1c2340" stroke-width="2.6" stroke-linecap="round"/>'
    : s.mark === 'wave' ? '<path d="M16 34 Q22 28 28 34 T40 34 T50 32" fill="none" stroke="#1c2340" stroke-width="2.6" stroke-linecap="round"/>'
    : '<path d="M24 26 Q30 22 36 26 M21 32 Q30 26 39 32 M24 38 Q30 34 36 38" fill="none" stroke="#1c2340" stroke-width="2.4" stroke-linecap="round"/>';
  return '<svg class="stone' + (got ? '' : ' off') + '" viewBox="0 0 60 60" width="' + size + '" height="' + size + '" aria-hidden="true">' +
    '<circle cx="30" cy="31" r="27" fill="' + s.color + '" opacity=".25"/>' +
    '<path d="M14 22 L26 10 L44 13 L52 30 L44 48 L24 52 L10 38Z" fill="' + s.color + '" stroke="#1c2340" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M20 20 L27 14" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity=".7"/>' + mark + '</svg>';
}
function award(id: string, then: () => void) {
  var s = STONES.filter(function (x) { return x.id === id; })[0];
  sfx('badge');
  sheet('<div class="award" role="dialog" aria-modal="true" aria-labelledby="st-t" style="--tc:var(--t-cervello)">' +
    '<div class="award-badge">' + stoneSVG(s, 110) + '</div>' +
    '<h2 id="st-t">Hai trovato la ' + esc(s.name) + '</h2>' +
    '<p>' + esc(s.text) + '</p><p class="hint">Pietre di Telepilo: ' + STONES.filter(function (x) { return st.seen[x.id]; }).length + ' su ' + STONES.length + '.</p>' +
    '<button class="btn primary" type="button" id="st-ok">Continua</button></div>', 'result');
  $('st-ok').addEventListener('click', function () { closeSheet(); renderHud(); then(); });
  setTimeout(function () { var b = $('st-ok'); if (b) b.focus(); }, 30);
}
/** the stones in the menu */
export function stonesHtml(): string {
  if (!flag('trama-archivio')) return '';
  return '<div class="pickrow"><h3>Pietre di Telepilo · ' + STONES.filter(function (x) { return st.seen[x.id]; }).length + ' su ' + STONES.length + '</h3><ul class="wbadge-list">' + STONES.map(function (s) {
    var got = !!st.seen[s.id];
    return '<li class="' + (got ? 'got' : '') + '">' + stoneSVG(s, 40, got) + '<span><b>' + esc(s.name) + '</b><small>' + esc(got ? s.text : 'Da trovare: ' + s.where + '.') + '</small></span></li>';
  }).join('') + '</ul></div>';
}
