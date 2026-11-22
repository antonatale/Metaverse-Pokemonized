import { st, save } from '../save/story-progress';
import type { Npc, Sign } from '../data/maps/types';
import { FORMIA_SPOT } from '../data/maps/formia-ground';
import { cisterna } from '../data/maps/cisterna';
import { CICERO } from '../story/mentor';
import { STONES, flag, type Stone } from '../story/plot';
import type { LegendDef } from '../data/legends';
import { CHOICES, STONES_AFTER_RESCUE } from '../data/choices';
import { HELD } from '../data/passives';
import { SPECIES } from '../data/creatures';
import { NET_IDS } from '../data/nets';
import { chosen, decide, endFlag, stonesKept, tullioMood } from '../story/choices';
import { rivalSpeaker } from '../story/rival-who';
import { addCreature, creatureOf, firstHuman, has, monsOf, nameOf, own, prizeText, heroText } from '../story/growth';
import type { Mission } from '../data/missions';
import { CHARS } from '../data/characters';
import { COVI } from '../data/covi';
import { COVO_NOTES } from '../data/finale';
import { canDo, missionDone, missionOf, missionOfTrainer, missionPay, tooEarly, myMissions } from '../story/missions';
import { esc, $ } from './dom';
import { say, sheet, closeSheet, renderHud, dexNotice, trainerFight, foesLine, type DialogOpt } from './story-screen';
import { sfx } from '../audio';
import { travel } from '../story/movement';
import { archiveScene, cisternScene, seaStoneScene, voiceStoneScene, recordedVoice, stonesReturnedScene } from './finale';
import { REUNION, friendFreed } from '../story/finale';

/* What the people of the plot say (story/plot.ts): the archivist of the Torre di Mola, the lady of the Roman theatre,
   Cicero at his tomb, and what happens after the battles with Mamurra's men and with Mamurra himself. */

const ARCHIVE_CORRECTED = 'archivio-lamo';

/** someone of the plot has something to say now: true when the plot takes the talk. again goes on with the talk as
    usual, without the plot */
export function plotTalk(n: Npc, again: () => void): boolean {
  if (n.id === 'guardaparco' && flag(REUNION) && !st.seen['saluto-guardaparco']) {
    const first = monsOf(firstHuman())[0];
    const greeting = first ? 'Mi ricordo di ' + nameOf(first.uid) + '. Quando vi siete incontrati qui, dopo il boato, avevate paura tutti e due.' : 'Stamattina ho riaperto il sentiero.';
    say([greeting, 'Da quando siete tornati, si sentono di nuovo i versi dalle tane. Mi ero dimenticata di quanto casino fanno prima dell’alba.'], n.name, null, () => {
      st.seen['saluto-guardaparco'] = true; save();
    });
    return true;
  }
  if (n.id === 'archivista' && flag(REUNION)) {
    if (flag(ARCHIVE_CORRECTED)) say('Ho rimesso il disegno al suo posto, con la tua testimonianza. Chi lo chiederà potrà leggere entrambe le versioni.', n.name);
    else say(['Mi hanno detto che hai raggiunto la Porta. Nel disegno la mano di Lamo sembra sollevare la lastra. Da secoli leggiamo così questa storia.',
      'L’hai vista davvero quella mano?'], n.name, [
      { label: 'Lamo teneva chiuso il passaggio', fn: () => {
        st.seen[ARCHIVE_CORRECTED] = true; save();
        say(['E quelle creature che si vedono tra le pietre si erano rifugiate lì. Aspetta, prendo un foglio nuovo.',
          'Ci scrivo quello che hai visto e lo conservo con il disegno. Così chi verrà dopo potrà capire cosa stava facendo Lamo.'], n.name);
      } }, { label: 'Te lo racconto più tardi', fn: null }
    ]);
    return true;
  }
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
  /* a way in that the story has opened */
  if (s.enter && s.enter.after.some(flag)) {
    var e = s.enter;
    const enter = () => travel(e.to, e.tx, e.ty, e.tdir);
    say(s.text, null, [{ label: e.label, fn: () => e.to === 'cisterna' ? cisternScene([s.x, s.y], enter) : enter() }, { label: 'Non ora', fn: null }]);
    return true;
  }
  /* the Pietra delle Mura, on the still water at the bottom of the Cisternone */
  const [wallX, wallY] = cisterna.place!.goal;
  if (st.map === 'cisterna' && s.x === wallX && s.y === wallY) {
    if (flag('pietra-mura')) { say(['Sull\'acqua ferma è rimasto solo un cerchio di luce.']); return true; }
    st.seen['pietra-mura'] = true; save();
    sfx('finaleEcho');
    award('pietra-mura', () => {
      if (flag('pietra-mare')) say(['Accosti le Pietre delle Mura e del Mare. Nel silenzio del Cisternone si sente lo stesso suono registrato a Caposele, e in mezzo c’è una voce.'], null, null, hearStoneVoice);
      else say(['Ascolta. La Pietra fa lo stesso rumore del boato, però dura meno.', 'Portala alle peschiere di Caposele. Se il sub ha trovato quella del Mare, vediamo come rispondono messe insieme.'], CICERO);
    });
    return true;
  }
  const [tombX, tombY] = FORMIA_SPOT['sign-tomba'];
  if (st.map !== 'formia' || s.x !== tombX || s.y !== tombY || !flag('pietra-mura') || !flag('pietra-mare') || flag('pietra-voce')) return false;
  tomb();
  return true;
}
/** what comes before a battle, with someone of the plot: the rival, at Mamurra's villa, is what the player has made of them */
export function plotBefore(id: string): string[] {
  var m = tullioMood();
  if (id !== 'mamurra' || !m) return [];
  return m === 'ally' ? ['Da dietro una colonna spunta {rv}: «{hero}! Mentre parlava gli ho incrinato la Ricchezza. Il resto tocca a te.»']
    : ['Da dietro una colonna spunta {rv}, con un sorrisetto: «Gli ho detto io come lotti. Così impari a prendermi in giro.»', 'La Ricchezza di Mamurra è più spessa del previsto.'];
}
/** a question of the story, once: who speaks speaks, the last one asks, the player answers and the answer stays */
export function askChoice(id: string, then?: () => void) {
  if (chosen(id)) { if (then) then(); return; }
  var c = id === 'pietre' && flag(REUNION) ? STONES_AFTER_RESCUE : CHOICES[id], k = 0;
  var next = function () {
    var part = c.ask[k++], who = part.who === '{rv}' ? rivalSpeaker() : part.who;
    if (k < c.ask.length) { say(part.say, who, null, next); return; }
    say(part.say, who, c.options.map(function (o) {
      return { label: heroText(o.label), fn: function () { decide(id, o.id); save(); renderHud(); say(o.say, o.who || who, null, then); } };
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
export function plotAfter(id: string, who: string, then?: () => void) {
  if (id === 'mamurr-scavi') {
    sfx('finaleCoin');
    say(['Ho sentito la moneta anche io. Quando ha vibrato, le due creature si sono voltate nello stesso istante.',
      'Il suo capo dev’essere Lucio Mamurra. Lo conoscevo. La villa qui a Gianola era la sua e adesso cerca le Pietre nascoste a Formia.',
      'Gli scavi hanno fatto tremare il golfo. Ora pulsa una luce in città. Apri il caminetto appena squilla.'], CICERO);
  }
  else if (id === 'mamurr-cisterna') say(['L\'uomo con la torcia scappa giù per i vicoli di Castellone.', 'Una parola per aprire il Cisternone… La signora che abita dentro il teatro romano saprà qualcosa.']);
  else if (id === 'mamurr-peschiere') collectSeaStone();
  else if (id === 'mamurra') { st.seen['cic-lamo'] = true; save(); askChoice('pietre'); }
  /* the first two meetings with Tullio: what the player says to him stays */
  else if (id === 'rivale-1') askChoice('tullio1', then);
  else if (id === 'rivale-2') askChoice('tullio2');
  else { var m = missionOfTrainer(id); if (m) missionDoneNow(m, who); }
}

/** The diver's defeat is saved before the dialogue, so the award must survive closing the game there. */
export function resumePlot(): boolean {
  if (!flag('tr-mamurr-peschiere') || flag('pietra-mare')) return false;
  collectSeaStone();
  return true;
}

function collectSeaStone() {
  st.seen['pietra-mare'] = true; save();
  seaStoneScene(() => award('pietra-mare', () => {
    if (flag('pietra-mura')) hearStoneVoice();
    else say('Salva la registrazione. Dal rumore coperto dall’acqua capisco poco. Quando avrai la Pietra delle Mura, accostale: vediamo come si rispondono.', CICERO);
  }));
}

function hearStoneVoice() {
  const voice = recordedVoice();
  say(voice.line, voice.speaker, null, () => say('Quella voce è la mia. Per la Pietra della Voce, vieni alla mia tomba, sull’Appia verso Itri.', CICERO));
}

/* ---------- the way to a legend (data/legends.ts): a riddle the first time, then down ---------- */
export function legendWay(L: LegendDef) {
  var key = 'enigma-' + L.id, t = L.trial!, R = L.riddle;
  const afterRescue = L.id === 'lamo' && flag(REUNION);
  var down = function () { travel(t.to, t.x, t.y, t.dir); };
  var offer = function (text: string[]) { say(text, null, [{ label: 'Scendi', fn: down }, { label: 'Non ora', fn: null }]); };
  if (L.angry && stonesKept()) { offer(L.angry.way); return; }
  if (!R || flag(key)) { offer(t.again); return; }
  var ask = function (k: number) {
    if (k >= R!.steps.length) {
      st.seen[key] = true; save(); renderHud();
      if (afterRescue) stonesReturnedScene(() => offer(t.again));
      else { sfx('magic'); offer(R!.solved); }
      return;
    }
    var q = R!.steps[k];
    say([q.ask], null, q.options.map(function (label, i) {
      return { label: label, fn: function () { if (i === q.ok) ask(k + 1); else say(R!.wrong, null, null, function () { ask(0); }); } };
    }));
  };
  const intro = afterRescue ? ['HO CHIUSO LA PORTA CON LA MIA MANO. FINCHÉ LE NICCHIE RESTANO VUOTE, NON POSSO TOGLIERLA.', R.intro[R.intro.length - 1]] : R.intro;
  say(intro, null, null, function () { ask(0); });
}

/* ---------- the archivist: the legend of the stones ---------- */
function archive(who: string) {
  const fragment = firstHuman() === 'forchetta'
    ? 'Dici che al Zauli hai visto le stesse tre tacche vicino alla rete? Allora quel segno dev’essere finito anche nei covi.'
    : friendFreed('forchetta') ? 'Avvicina il frammento del campo al disegno. Le tre tacche combaciano con le sedi del sigillo.'
      : 'Le tre tacche sul margine segnano le sedi del sigillo.';
  say(['Le Pietre di Telepilo? Allora l\'hai visto anche tu, quello che scava a Gianola.',
    'Cicerone, in una lettera all\'amico Attico, chiamava Formia «la Telepilo dei Lestrigoni»: la città dei giganti dell\'Odissea e del loro re, Lamo.',
    'Qui si vede come tenevano chiusa la Porta. Guarda il disegno sul margine.'], who, null, () => archiveScene(who, () => {
    say([fragment,
      'Quando Formiae fu abbandonata, nacquero due paesi sulle sue rovine. La Pietra delle Mura finì nel Cisternone a Castellone, quella del Mare tra le peschiere di Caposele.',
      'Della Pietra della Voce sappiamo solo che la affidavano a un oratore. Nel 1862 i due paesi tornarono a chiamarsi Formia. Le Pietre restarono separate.'], who, null, () => {
      st.seen['trama-archivio'] = true; save(); renderHud();
      say(['Un oratore che custodisce una pietra… Mi viene in mente qualcuno, ma ne parliamo quando avrai le altre due.', 'Prima Castellone: il Cisternone.'], CICERO);
    });
  }));
}

export function cluesHtml(): string {
  const clues = st.badges.flatMap(badge => {
    const covo = Object.values(COVI).find(c => c.badge.id === badge);
    if (!covo || covo.leader === firstHuman()) return [];
    const [title, description] = COVO_NOTES[covo.leader];
    return ['<li class="got"><span><b>' + esc(title) + '</b><small>' + esc(CHARS[covo.leader].name + ' · ' + description) + '</small></span></li>'];
  });
  if (flag(ARCHIVE_CORRECTED)) clues.push('<li class="got"><span><b>La mano sulla Porta</b><small>La tua testimonianza è conservata alla Torre di Mola accanto al disegno. Lamo chiudeva il passaggio per proteggere le creature.</small></span></li>');
  else if (flag('trama-archivio')) clues.push('<li class="got"><span><b>Il disegno della Torre di Mola</b><small>Sul margine una mano tocca la Porta. Sei luci sono dentro il sigillo, una resta fuori.</small></span></li>');
  return clues.length ? '<div class="pickrow"><h3>Indizi sull’eco</h3><ul class="wbadge-list diary">' + clues.join('') + '</ul></div>' : '';
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
  say(['Hai mandato via quello con la torcia? Ha battuto una moneta contro la porta. Per un attimo ho sentito rispondere qualcosa dal fondo.', 'Chi ha custodito la Pietra mi ha insegnato la parola per aprire. Te la dico se sai contare le vecchie torri di Castellone.'], who, null, ask);
}
/* Cicero opens the Stone of the Voice with three memories of Formia. */
const QUESTIONS: { q: string; a: string[]; ok: number; why: string; hint: string }[] = [
  { q: 'In che anno sono morto, qui vicino alla mia villa di Formia?', a: ['Nel 44 avanti Cristo', 'Nel 43 avanti Cristo', 'Nel 79 dopo Cristo'], ok: 1,
    why: 'Nel 43 avanti Cristo. Il 44 è l’anno di Cesare, il 79 quello del Vesuvio.', hint: 'La Pietra rimane fredda. Ricordi? Cesare era già morto da un anno.' },
  { q: 'Come si chiamava il comune prima di riprendere il nome di Formia, nel 1862?', a: ['Gianola e Maranola', 'Vindicio e Trivio', 'Mola e Castellone'], ok: 2,
    why: 'Mola e Castellone. I due paesi nati sulle rovine di Formiae si unirono nel 1819.', hint: 'Si sente appena un filo di voce. Pensa ai due paesi nominati dall’archivista della Torre.' },
  { q: 'Chi è il patrono di Formia, il protettore dei marinai?', a: ['Sant\'Erasmo', 'San Giovanni', 'San Lorenzo'], ok: 0,
    why: 'Sant’Erasmo. Il fuoco di Sant’Elmo porta il suo nome.', hint: 'La luce si ferma. Il nome che cerchi è sopra la chiesa vicino alla torre di Castellone.' }
];
function tomb() {
  sfx('magic');
  var ask = function (k: number) {
    if (k >= QUESTIONS.length) {
      say(['Promosso, e con lode. Tieni: la Pietra della Voce.'], CICERO, null, function () {
        st.seen['pietra-voce'] = true; save();
        voiceStoneScene(() => award('pietra-voce', () => say(['Le tre Pietre rispondono allo stesso impulso. A Gianola Mamurra avrà visto la luce. Quando tutto il caminetto sarà libero, ritrovatevi alla villa.'], CICERO)));
      });
      return;
    }
    var Q = QUESTIONS[k];
    say([Q.q], CICERO, Q.a.map(function (t, i) {
      return { label: t, fn: function () {
        if (i === Q.ok) say(['Giusto. ' + Q.why], CICERO, null, function () { ask(k + 1); });
        else say([Q.hint], CICERO, null, function () { ask(k); });
      } };
    }));
  };
  say(['Mamurra ha imparato a ripetere la mia voce con le sue monete. La Pietra della Voce però risponde ai ricordi di questa città.',
    'Ti faccio tre domande su Formia. Rispondi ad alta voce e tieni vicine le altre due Pietre.'], CICERO, null, function () { ask(0); });
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
