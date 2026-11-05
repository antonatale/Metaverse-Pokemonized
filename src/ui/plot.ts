import { st, save } from '../save/story-progress';
import type { Npc, Sign } from '../data/maps/types';
import { CICERO } from '../story/mentor';
import { STONES, flag, type Stone } from '../story/plot';
import type { LegendDef } from '../data/legends';
import { esc, $ } from './dom';
import { say, sheet, closeSheet, renderHud } from './story-screen';
import { sfx } from '../audio';
import { travel } from '../story/movement';

/* What the people of the plot say (story/plot.ts): the archivist of the Torre di Mola, the lady of the Roman theatre,
   Cicero at his tomb, and what happens after the battles with Mamurra's men and with Mamurra himself. */

/** someone of the plot has something to say now: true when the plot takes the talk */
export function plotTalk(n: Npc): boolean {
  if (n.id === 'archivista' && flag('tr-mamurr-scavi') && !flag('trama-archivio')) { archive(n.name || ''); return true; }
  if (n.id === 'teatro' && flag('tr-mamurr-cisterna') && !flag('pietra-mura') && !flag('porta-cisterna')) { riddle(n.name || ''); return true; }
  return false;
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
/** after a battle won against someone of the plot (a trainer's id) */
export function plotAfter(id: string) {
  if (id === 'mamurr-scavi') say(['Mamurra… Lucio Mamurra! Lo conoscevo: cavaliere di Formia, prefetto del genio di Cesare, il più ricco di tutti. La villa qui a Gianola era la sua.',
    'Catullo lo chiamava «lo scialacquatore di Formia». Se il suo fantasma cerca le Pietre di Telepilo, vuole qualcosa di grosso.',
    'All\'Archivio della Torre di Mola sanno tutto delle leggende di Formia. Andiamo a chiedere.'], CICERO);
  else if (id === 'mamurr-cisterna') say(['L\'uomo con la torcia scappa giù per i vicoli di Castellone.', 'Una parola per aprire il Cisternone… La signora che abita dentro il teatro romano saprà qualcosa.']);
  else if (id === 'mamurr-peschiere') { st.seen['pietra-mare'] = true; save(); award('pietra-mare', function () {
    say(['Due pietre su tre. Per la terza, vieni a trovarmi alla mia tomba, sull\'Appia verso Gaeta.', 'Sì: la Pietra della Voce la custodisco io. Da duemila anni.'], CICERO);
  }); }
  else if (id === 'mamurra') { st.seen['cic-lamo'] = true; save(); say(['Hai battuto Mamurra! Il sigillo di Telepilo è salvo, e la magia dei Lestrigoni resta a chi la rispetta.',
    'Formia è nata due volte: dalla Formiae dei Romani, e da Castellone e Mola che nel 1862 tornarono a chiamarsi Formia. Oggi l\'hai salvata tu.',
    'E adesso ascolta: di notte, sotto le mura di Castellone, qualcosa si è svegliato. Lamo, il re dei Lestrigoni. Le tre pietre sanno dove tornare: portale là. Ti aspetta, ma non si fa prendere facilmente.',
    'Poi il treno: Torino, e un giorno Chicago. Vai pure lontano, Antonio. Ma ricordati da dove vieni.'], CICERO); }
}

/* ---------- the way to a legend (data/legends.ts): a riddle the first time, then down ---------- */
export function legendWay(L: LegendDef) {
  var key = 'enigma-' + L.id, t = L.trial!, R = L.riddle;
  var down = function () { travel(t.to, t.x, t.y, t.dir); };
  var offer = function (text: string[]) { say(text, null, [{ label: 'Scendi', fn: down }, { label: 'Non ora', fn: null }]); };
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
