import type { Npc } from '../data/maps/types';
import { activity, record, bestOf, timesDone } from '../story/activities';
import { sfx } from '../audio';
import { say, sheet, closeSheet } from './story-screen';
import { $ } from './dom';
import { startRun } from './run';

/* The things to do around Formia: offered by someone on the map, played here.
   Beach volley is a little timing game over the map; the rest are told through the story's dialogue. */

/** someone offers to do something together */
export function offerActivity(n: Npc) {
  const a = activity(n.activity!);
  say(n.lines || ['…'], n.name, [{ label: a.verb, fn: function () { play(a.id, n); } }, { label: 'Più tardi', fn: null }]);
}
function play(id: string, n: Npc) {
  if (id === 'volley') playRally(n, VOLLEY);
  else if (id === 'padel') playRally(n, PADEL);
  else if (id === 'lettino') lettino(n);
  else if (id === 'gelato') gelato(n);
  else if (id === 'quiz') quiz(n);
  else if (id === 'corsa') startRun(n);
}

/* ---------- rallies: beach volley with Valentin at the Eclipse, padel with Andrea at the Bruno Zauli.
   Hit the ball while it is in the green zone; every exchange is faster. ---------- */
function css(name: string, fallback: string) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback; }
interface Rally { id: string; title: string; text: string; court: string; padel?: boolean; end: (n: number) => string[] }
const VOLLEY: Rally = {
  id: 'volley', title: 'Beach volley all\'Eclipse', court: 'Il campo da beach volley',
  text: 'Rimanda la palla a Valentin: tocca, o premi Spazio, quando è nella zona verde. Ogni scambio è più veloce.',
  end: (r) => r >= 12 ? ['WEEE! Sei un animale anomalo pure tu!', 'Stasera festa, e offri tu.'] : r >= 6 ? ['Weee! Bella partita.', 'Domani rivincita al tramonto.'] : ['Weee… va be\', era il riscaldamento.', 'Riprova quando vuoi, io sto qui.']
};
const PADEL: Rally = {
  id: 'padel', title: 'Padel al Bruno Zauli', court: 'Il campo da padel', padel: true,
  text: 'Rispondi ad Andrea: tocca, o premi Spazio, quando la pallina è nella zona verde. Lui calcola tutto, e accelera.',
  end: (r) => r >= 12 ? ['Statisticamente impossibile.', 'Rifacciamo, devo raccogliere più dati.'] : r >= 6 ? ['Come previsto: partita equilibrata.', 'Al 94% la prossima la vinco io.'] : ['Ho calcolato tutto. Anche questo.', 'Palestra e padel: domani di nuovo.']
};
function playRally(n: Npc, R: Rally) {
  const best0 = bestOf(R.id);
  const o = sheet('<div class="award mg" role="dialog" aria-modal="true" aria-labelledby="mg-t">' +
    '<h2 id="mg-t">' + R.title + '</h2>' +
    '<p>' + R.text + '</p>' +
    '<canvas class="mg-court" id="mg-c" width="320" height="120" aria-label="' + R.court + '"></canvas>' +
    '<p class="mg-score" id="mg-s" aria-live="polite">Scambi: 0' + (best0 ? ' · record ' + best0 : '') + '</p>' +
    '<button class="btn" type="button" id="mg-x">Basta così</button></div>', 'result');
  const cv = $('mg-c') as HTMLCanvasElement, c = cv.getContext('2d')!, scoreEl = $('mg-s');
  const dpr = Math.min(2, window.devicePixelRatio || 1), Wc = 320, Hc = 120;
  cv.width = Wc * dpr; cv.height = Hc * dpr; cv.style.width = '100%'; cv.style.maxWidth = Wc + 'px';
  const col = R.padel
    ? { sand: css('--m-roof-b', '#9ec5ff'), sand2: css('--m-line', '#ffffff'), sea: css('--m-stone2', '#c4bca9'), ink: css('--m-ink', '#1f2c6e'), zone: css('--good', '#2c9a55'), ball: '#e6f04a' }
    : { sand: css('--m-sand', '#f8e9b0'), sand2: css('--m-sand2', '#e2c97a'), sea: css('--m-sea', '#a7d8f2'), ink: css('--m-ink', '#1f2c6e'), zone: css('--good', '#2c9a55'), ball: '#fffdf6' };
  /* x goes from Valentin (0) to Antonio (1) and back; the green zone is on Antonio's side */
  let x = 0.12, dir = 1, speed = 0.55, zone = 0.17, rally = 0, over = false, raf = 0, last = performance.now(), flash = 0;
  const zoneC = 0.86;
  function draw() {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = col.sea; c.fillRect(0, 0, Wc, 26);
    c.fillStyle = col.sand; c.fillRect(0, 26, Wc, Hc - 26);
    if (R.padel) { c.strokeStyle = col.sand2; c.lineWidth = 2; c.strokeRect(6, 30, Wc - 12, Hc - 36); c.beginPath(); c.moveTo(Wc * 0.25, 30); c.lineTo(Wc * 0.25, Hc - 6); c.moveTo(Wc * 0.75, 30); c.lineTo(Wc * 0.75, Hc - 6); c.stroke(); }
    else { c.fillStyle = col.sand2; for (let k = 0; k < 40; k++) c.fillRect((k * 53) % Wc, 30 + (k * 29) % (Hc - 34), 2, 2); }
    c.globalAlpha = 0.35; c.fillStyle = col.zone; c.fillRect((zoneC - zone / 2) * Wc, 30, zone * Wc, Hc - 34); c.globalAlpha = 1;
    c.strokeStyle = col.ink; c.lineWidth = 2; c.strokeRect((zoneC - zone / 2) * Wc, 30, zone * Wc, Hc - 34);
    c.beginPath(); c.moveTo(Wc / 2, 30); c.lineTo(Wc / 2, Hc - 4); c.stroke();
    c.lineWidth = 1; for (let y = 34; y < 70; y += 6) { c.beginPath(); c.moveTo(Wc / 2 - 3, y); c.lineTo(Wc / 2 + 3, y); c.stroke(); }
    /* the ball flies in an arc over the net */
    const t = dir > 0 ? x : 1 - x, h = Math.sin(Math.PI * Math.max(0, Math.min(1, (x - 0.08) / 0.84))) * 52;
    void t;
    const bx = x * Wc, by = Hc - 22 - h;
    c.globalAlpha = 0.25; c.fillStyle = col.ink; c.beginPath(); c.ellipse(bx, Hc - 12, 8, 3, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.beginPath(); c.arc(bx, by, 8, 0, Math.PI * 2); c.fillStyle = flash > 0 ? col.zone : col.ball; c.fill(); c.strokeStyle = col.ink; c.lineWidth = 2; c.stroke();
    c.beginPath(); c.arc(bx, by, 8, -0.6, 1.2); c.strokeStyle = '#ffb36b'; c.lineWidth = 2; c.stroke();
  }
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!over) {
      x += dir * speed * dt;
      if (dir < 0 && x <= 0.08) { x = 0.08; dir = 1; sfx('ball'); }               /* Valentin sends it back */
      if (dir > 0 && x >= 0.99) { lose(); }
    }
    flash = Math.max(0, flash - dt);
    draw();
    if (!over) raf = requestAnimationFrame(frame);
  }
  function hit() {
    if (over) return;
    if (dir > 0 && Math.abs(x - zoneC) <= zone / 2) {
      rally++; dir = -1; speed = Math.min(1.6, speed * 1.09); zone = Math.max(0.07, zone * 0.94); flash = 0.15;
      sfx('ball');
      scoreEl.textContent = 'Scambi: ' + rally + (best0 ? ' · record ' + best0 : '');
    } else lose();
  }
  function lose() {
    over = true; cancelAnimationFrame(raf); draw();
    sfx('dodge');
    const better = record(R.id, rally);
    if (better && rally > 0) sfx('badge');
    scoreEl.textContent = 'Fine: ' + rally + (rally === 1 ? ' scambio' : ' scambi') + (better && rally > 0 ? ' · nuovo record!' : best0 ? ' · record ' + best0 : '');
    const x0 = $('mg-x'); x0.textContent = 'Continua'; x0.focus();
  }
  const key = function (e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
      if (over && e.key === 'Enter') return;
      e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) hit();
    }
  };
  document.addEventListener('keydown', key, true);
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); hit(); });
  $('mg-x').addEventListener('click', function () {
    over = true; cancelAnimationFrame(raf);
    document.removeEventListener('keydown', key, true);
    closeSheet();
    const lines = R.end(rally);
    say(lines, n.name);
  });
  void o;
  draw();
  raf = requestAnimationFrame(frame);
}

/* ---------- a lettino at the Eclipse, from Nicola Spadea ---------- */
function lettino(n: Npc) {
  const k = timesDone('lettino');
  sfx('shimmer');
  say(['Nicola ti sistema il lettino in prima fila, sotto l\'ombrellone.',
    'Il mare è piatto, si sente la musica del lido. Il sole scende dietro Gaeta e tutto diventa arancione.',
    k === 0 ? 'Che pomeriggio. Ci voleva.' : k < 3 ? 'Un altro pomeriggio così. Formia d\'estate.' : 'Ormai il lettino in prima fila è il tuo.'], null, null, function () {
    record('lettino');
    say(k >= 2 ? ['Antonio, ormai sei di casa all\'Eclipse.', 'Il lettino te lo tengo libero.'] : ['Torna quando vuoi.', 'Il lettino è sempre qui.'], n.name);
  });
}

/* ---------- a gelato on the lungomare ---------- */
const FLAVOURS = ['Limone', 'Fragola', 'Nocciola', 'Pistacchio', 'Cioccolato', 'Cocco'];
function gelato(n: Npc) {
  const k = timesDone('gelato'), a = FLAVOURS.slice(k % 2 ? 2 : 0).concat(FLAVOURS.slice(0, k % 2 ? 2 : 0)).slice(0, 4);
  say(['Cono o coppetta? Facciamo cono. Primo gusto?'], n.name, a.map(function (f1) {
    return { label: f1, fn: function () {
      say(['E il secondo?'], n.name, FLAVOURS.filter(function (f) { return f !== f1; }).slice(0, 4).map(function (f2) {
        return { label: f2, fn: function () {
          record('gelato');
          sfx('pickup');
          say(['Ecco: ' + f1.toLowerCase() + ' e ' + f2.toLowerCase() + '.', 'Mangialo sul lungomare, guardando i traghetti per Ponza.'], n.name);
        } };
      }));
    } };
  }));
}

/* ---------- an evening at Morgana: a drink, and a quiz about Formia ---------- */
const QUIZ: [string, string[]][] = [
  ['Secondo la tradizione, chi riposa nella tomba sulla strada per Gaeta?', ['Marco Tullio Cicerone', 'Giulio Cesare', 'Mamurra']],
  ['Com\'è fatta la Torre di Castellone?', ['Ottagonale', 'Rotonda', 'Quadrata']],
  ['Di che secolo è la Torre di Mola, del castello angioino?', ['Del Duecento', 'Dell\'Ottocento', 'Del Novecento']],
  ['Chi è il patrono di Formia?', ['Sant\'Erasmo', 'San Lorenzo', 'San Giovanni']],
  ['Quale campione si allenava al centro Bruno Zauli?', ['Pietro Mennea', 'Alberto Tomba', 'Valentino Rossi']],
  ['Dove vanno i traghetti dal molo Azzurra?', ['Ponza e Ventotene', 'Capri e Ischia', 'In Sardegna']],
  ['Cosa c\'è sotto Largo Sant\'Anna, a Castellone?', ['Il Cisternone romano', 'La galleria del treno', 'Un parcheggio']],
  ['Di chi era la villa romana sul promontorio di Gianola?', ['Mamurra', 'Nerone', 'Cicerone']]
];
function quiz(n: Npc) {
  const k = timesDone('quiz');
  say(['Stasera c\'è il quiz su Formia. Intanto, cosa vi porto?'], n.name, ['Una bionda', 'Una rossa', 'Un analcolico'].map(function (d) {
    return { label: d, fn: function () {
      sfx('found');
      /* five of the eight questions, a different set each evening; the right answer moves around too */
      const qs = [0, 1, 2, 3, 4, 5, 6, 7].map(function (i) { return (i + k * 3) % QUIZ.length; }).slice(0, 5);
      let right = 0;
      const ask = function (q: number) {
        if (q >= qs.length) { finish(); return; }
        const [question, answers] = QUIZ[qs[q]], shift = (q + k) % 3;
        const shown = answers.slice(shift).concat(answers.slice(0, shift));
        say([(q + 1) + '. ' + question], n.name, shown.map(function (ans) {
          return { label: ans, fn: function () {
            const ok = ans === answers[0];
            if (ok) { right++; sfx('superEff'); } else sfx('weak');
            say([ok ? 'Giusto!' : 'No: ' + answers[0] + '.'], n.name, null, function () { ask(q + 1); });
          } };
        }));
      };
      const finish = function () {
        const better = record('quiz', right);
        if (better && right > 0) sfx('badge');
        say([right + ' risposte giuste su 5.', right === 5 ? 'Tutte! Il giro dopo lo offre la casa.' : right >= 3 ? 'Mica male. Si vede che a Formia ci sei cresciuto.' : 'Va be\', la prossima volta studiate prima di venire.'], n.name);
      };
      say(['Ecco la ' + (d === 'Un analcolico' ? 'bibita' : 'birra') + '. Si comincia!'], n.name, null, function () { ask(0); });
    } };
  }));
}
