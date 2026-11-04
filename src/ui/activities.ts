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
/** an activity started by someone who also does something else (the fisherman of Mola sells nets and takes you fishing) */
export function startActivity(id: string, n: Npc) { play(id, n); }
function play(id: string, n: Npc) {
  if (id === 'pesca') fishing(n);
  else if (id === 'volley') playRally(n, VOLLEY);
  else if (id === 'padel') playRally(n, PADEL);
  else if (id === 'windsurf') windsurf(n);
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

/* ---------- a windsurf lesson with Nicola Spadea at Vindicio: hold the sail in the gusts and plane as far as you can.
   The wind leans you forward; a tap sheets the sail in and pulls you back. Too far forward and the wind catapults
   you in, too far back and you fall in backwards. The gusts are fixed waves, not chance: a lesson is fair. ---------- */
function windsurf(n: Npc) {
  const best0 = bestOf('windsurf'), k0 = timesDone('windsurf');
  sheet('<div class="award mg" role="dialog" aria-modal="true" aria-labelledby="mg-t">' +
    '<h2 id="mg-t">Windsurf con Nicola</h2>' +
    '<p>Il vento ti spinge in avanti: tocca, o premi Spazio, per cazzare la vela e tornare in equilibrio. Troppo poco e il vento ti catapulta in acqua, troppo e cadi all\'indietro. Più resti in piedi, più vai veloce.</p>' +
    '<canvas class="mg-court" id="mg-c" width="320" height="120" aria-label="Il mare di Vindicio, con la tavola e la vela"></canvas>' +
    '<p class="mg-score" id="mg-s" aria-live="polite">Planata: 0 m' + (best0 ? ' · record ' + best0 + ' m' : '') + '</p>' +
    '<button class="btn" type="button" id="mg-x">Basta così</button></div>', 'result');
  const cv = $('mg-c') as HTMLCanvasElement, c = cv.getContext('2d')!, scoreEl = $('mg-s');
  const dpr = Math.min(2, window.devicePixelRatio || 1), Wc = 320, Hc = 120;
  cv.width = Wc * dpr; cv.height = Hc * dpr; cv.style.width = '100%'; cv.style.maxWidth = Wc + 'px';
  const col = { sea: css('--m-sea', '#a7d8f2'), sea2: css('--m-sea2', '#79bde6'), foam: css('--m-foam', '#ffffff'), ink: css('--m-ink', '#1f2c6e'),
    zone: css('--good', '#2c9a55'), warn: css('--red', '#c8372d'), sky: css('--m-paper', '#f7f6f0'), far: css('--m-far2', '#b0bed9') };
  let lean = 0, dist = 0, t = 0, over = false, raf = 0, last = performance.now(), shown = -1, fell = '';
  /* the wind: a steady push that swells and slackens, and a gust every few seconds */
  const gust = (tt: number) => Math.pow(Math.max(0, Math.sin(tt * 1.3 + k0 * 2.1)), 8);
  const wind = (tt: number) => 0.5 + 0.25 * Math.sin(tt * 0.7 + k0) + 0.9 * gust(tt);
  function draw() {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = col.sky; c.fillRect(0, 0, Wc, 30);
    /* Gaeta on the horizon */
    c.fillStyle = col.far; c.beginPath(); c.moveTo(0, 30); c.quadraticCurveTo(40, 14, 90, 24); c.quadraticCurveTo(120, 18, 150, 30); c.closePath(); c.fill();
    c.fillStyle = col.sea; c.fillRect(0, 30, Wc, Hc - 30);
    c.strokeStyle = col.sea2; c.lineWidth = 2;
    const off = (dist * 3) % 40;
    for (let r = 0; r < 4; r++) for (let k = -1; k < 9; k++) { const wx = k * 40 - off + (r % 2) * 20, wy = 42 + r * 20; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 8, wy - 4, wx + 16, wy); c.stroke(); }
    /* a gust coming: dark ripples on the water */
    const g = gust(t + 0.6);
    if (g > 0.05) { c.globalAlpha = Math.min(0.5, g); c.fillStyle = col.sea2; for (let k = 0; k < 14; k++) c.fillRect(((k * 47 + t * 160) % (Wc + 40)) - 40, 36 + (k * 19) % 70, 22, 2); c.globalAlpha = 1; }
    /* the board, the sail leaning with the wind, the sailor */
    const bx = 150, by = 92, a = lean * 0.75;
    c.fillStyle = col.foam; c.globalAlpha = 0.9; c.beginPath(); c.ellipse(bx - 34, by + 6, 26, 3, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
    c.beginPath(); c.moveTo(bx - 34, by); c.quadraticCurveTo(bx, by - 6, bx + 38, by + 1); c.quadraticCurveTo(bx, by + 7, bx - 34, by); c.closePath();
    c.fillStyle = '#fffdf6'; c.fill(); c.strokeStyle = col.ink; c.lineWidth = 2; c.stroke();
    c.save(); c.translate(bx + 4, by - 2); c.rotate(a);
    c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -66); c.strokeStyle = col.ink; c.lineWidth = 2.4; c.stroke();
    c.beginPath(); c.moveTo(0, -66); c.quadraticCurveTo(-34, -30, -4, -4); c.closePath(); c.fillStyle = '#ff8a3c'; c.fill(); c.strokeStyle = col.ink; c.lineWidth = 2; c.stroke();
    c.strokeStyle = '#ffffff'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-6, -50); c.lineTo(-14, -44); c.moveTo(-6, -30); c.lineTo(-16, -26); c.stroke();
    c.restore();
    /* the sailor hangs off the boom, leaning against the sail */
    const hx = bx + 22 + lean * 6, hy = by - 40 + Math.abs(lean) * 6;
    c.strokeStyle = '#1c2340'; c.lineWidth = 4; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx + 14, by - 2); c.lineTo(hx - 2, hy + 20); c.moveTo(bx + 22, by - 2); c.lineTo(hx + 2, hy + 20); c.stroke();
    c.strokeStyle = '#1fa3b5'; c.lineWidth = 7; c.beginPath(); c.moveTo(hx, hy + 20); c.lineTo(hx, hy + 4); c.stroke();
    c.strokeStyle = '#c48f6c'; c.lineWidth = 3; c.beginPath(); c.moveTo(hx, hy + 8); c.lineTo(bx + 4 + Math.sin(a) * 30, by - 2 - Math.cos(a) * 30); c.stroke();
    c.beginPath(); c.arc(hx, hy, 6, 0, Math.PI * 2); c.fillStyle = '#c48f6c'; c.fill(); c.strokeStyle = '#1c2340'; c.lineWidth = 1.6; c.stroke();
    /* the balance meter: green in the middle, red at the ends */
    const mx = 20, mw = Wc - 40, my = 8;
    c.fillStyle = col.warn; c.globalAlpha = 0.35; c.fillRect(mx, my, mw, 8); c.globalAlpha = 0.5; c.fillStyle = col.zone; c.fillRect(mx + mw * 0.3, my, mw * 0.4, 8); c.globalAlpha = 1;
    c.strokeStyle = col.ink; c.lineWidth = 1.5; c.strokeRect(mx, my, mw, 8);
    const nx = mx + mw * (0.5 + lean / 2);
    c.beginPath(); c.moveTo(nx, my - 3); c.lineTo(nx - 5, my - 9); c.lineTo(nx + 5, my - 9); c.closePath(); c.fillStyle = col.ink; c.fill();
    if (fell) {
      c.font = '15px "Lilita One", "Arial Rounded MT Bold", sans-serif'; c.textAlign = 'left'; c.textBaseline = 'middle';
      const tw = c.measureText(fell).width + 16;
      c.fillStyle = col.sky; c.beginPath(); c.roundRect(10, 26, tw, 22, 6); c.fill(); c.strokeStyle = col.ink; c.lineWidth = 1.5; c.stroke();
      c.fillStyle = col.ink; c.fillText(fell, 18, 37.5);
    }
  }
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!over) {
      t += dt;
      lean += wind(t) * dt * 0.95;
      const speed = 2 + Math.min(7, t * 0.45) * (1 - Math.abs(lean) * 0.6);
      dist += speed * dt * 3;
      if (lean >= 1) fall('Catapultato in acqua!');
      else if (lean <= -1) fall('Caduto all\'indietro!');
      const m = Math.floor(dist);
      if (!over && m !== shown) { shown = m; scoreEl.textContent = 'Planata: ' + m + ' m' + (best0 ? ' · record ' + best0 + ' m' : ''); }
    }
    draw();
    if (!over) raf = requestAnimationFrame(frame);
  }
  function pull() {
    if (over) return;
    lean -= 0.3;
    sfx('whoosh');
    if (lean <= -1) fall('Caduto all\'indietro!');
  }
  function fall(why: string) {
    over = true; fell = why; cancelAnimationFrame(raf); draw();
    sfx('dodge');
    const m = Math.floor(dist), better = record('windsurf', m);
    if (better && m > 0) sfx('badge');
    scoreEl.textContent = 'Fine: ' + m + ' m di planata' + (better && m > 0 ? ' · nuovo record!' : best0 ? ' · record ' + best0 + ' m' : '');
    const x0 = $('mg-x'); x0.textContent = 'Continua'; x0.focus();
  }
  const key = function (e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
      if (over && e.key === 'Enter') return;
      e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) pull();
    }
  };
  document.addEventListener('keydown', key, true);
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); pull(); });
  $('mg-x').addEventListener('click', function () {
    const quit = !over, m = Math.floor(dist);
    if (quit) { over = true; cancelAnimationFrame(raf); if (m > 0) record('windsurf', m); }
    document.removeEventListener('keydown', key, true);
    closeSheet();
    say(m >= 200 ? ['Questo è livello campionato!', 'Domani ti porto al largo, fino a Gianola.']
      : m >= 60 ? ['Bella planata! Con la termica di Vindicio si vola.', 'La prossima volta lavoriamo sulla strambata.']
        : ['In acqua! Succede a tutti, anche a me le prime volte.', 'Risali sulla tavola: più tieni la vela, più vai veloce.'], n.name);
  });
  draw();
  raf = requestAnimationFrame(frame);
}

/* ---------- a lettino at the Eclipse, from the bar of the lido ---------- */
function lettino(n: Npc) {
  const k = timesDone('lettino');
  sfx('shimmer');
  say(['Ti sistemano il lettino in prima fila, sotto l\'ombrellone.',
    'Il mare è piatto, si sente la musica del lido. Al largo le vele dei windsurf di Nicola; il sole scende dietro Gaeta e tutto diventa arancione.',
    k === 0 ? 'Che pomeriggio. Ci voleva.' : k < 3 ? 'Un altro pomeriggio così. Formia d\'estate.' : 'Ormai il lettino in prima fila è il tuo.'], null, null, function () {
    record('lettino');
    say(k >= 2 ? ['Antonio, ormai sei di casa all\'Eclipse.', 'Il lettino te lo tengo libero.'] : ['Torna quando vuoi.', 'Il lettino è sempre qui.'], n.name);
  });
}

/* ---------- a gelato from Lavezzi, in piazza Marconi: lemon and coffee were the first two flavours, in 1870 ---------- */
const FLAVOURS = ['Limone', 'Caffè', 'Fragola', 'Nocciola', 'Pistacchio', 'Cioccolato'];
function gelato(n: Npc) {
  const k = timesDone('gelato'), a = FLAVOURS.slice(k % 2 ? 2 : 0).concat(FLAVOURS.slice(0, k % 2 ? 2 : 0)).slice(0, 4);
  say(['Cono o coppetta? Facciamo cono. Primo gusto?'], n.name, a.map(function (f1) {
    return { label: f1, fn: function () {
      say(['E il secondo?'], n.name, FLAVOURS.filter(function (f) { return f !== f1; }).slice(0, 4).map(function (f2) {
        return { label: f2, fn: function () {
          record('gelato');
          sfx('pickup');
          say(['Ecco: ' + f1.toLowerCase() + ' e ' + f2.toLowerCase() + '.', 'Mangialo in piazza, o giù al porto guardando i traghetti per Ponza.'], n.name);
        } };
      }));
    } };
  }));
}

/* ---------- an evening at Morgana: a drink, and a quiz about Formia ---------- */
/* every answer here is true (sources in CLAUDE.md); the first of each list is the right one */
const QUIZ: [string, string[]][] = [
  ['Secondo la tradizione, chi riposa nella tomba sull\'Appia verso Itri?', ['Marco Tullio Cicerone', 'Giulio Cesare', 'Mamurra']],
  ['Chi fece costruire la torre ottagonale di Castellone, nel 1377?', ['Onorato I Caetani', 'Carlo II d\'Angiò', 'Federico II']],
  ['Che cosa c\'è oggi nella Torre di Mola?', ['L\'Archivio storico di Formia', 'Il Municipio', 'Un faro']],
  ['Quando si festeggia Sant\'Erasmo, il patrono di Formia?', ['Il 2 giugno', 'Il 24 giugno', 'Il 15 agosto']],
  ['Chi allenava Pietro Mennea al centro Bruno Zauli?', ['Carlo Vittori', 'Bruno Zauli', 'Nessuno, faceva da solo']],
  ['Dove vanno i traghetti e gli aliscafi dal porto di Formia?', ['Ponza e Ventotene', 'Capri e Ischia', 'In Sardegna']],
  ['Quanta acqua conteneva il Cisternone romano di Castellone?', ['7000 metri cubi', '70 litri', 'Un milione di metri cubi']],
  ['Chi era Mamurra, quello della villa di Gianola?', ['Il prefetto del genio di Giulio Cesare', 'Un imperatore romano', 'Un pescatore di Mola']],
  ['Cosa c\'è di speciale nel teatro romano di Castellone?', ['Ci abitano trecento persone', 'È sott\'acqua', 'È a Gaeta']],
  ['Come erano, in origine, le statue togate del museo di Formia?', ['Dipinte: ne restano tracce di colore', 'Sempre bianche', 'Dorate']],
  ['Quale festa si fa a Mola il 24 giugno?', ['San Giovanni', 'Sant\'Erasmo', 'Ferragosto']],
  ['Da quanto tempo c\'è il centro di preparazione olimpica di Formia?', ['Dal 1955', 'Dal 1999', 'Dal 1860']]
];
function quiz(n: Npc) {
  const k = timesDone('quiz');
  say(['Stasera c\'è il quiz su Formia. Intanto, cosa vi porto?'], n.name, ['Una bionda', 'Una rossa', 'Un analcolico'].map(function (d) {
    return { label: d, fn: function () {
      sfx('found');
      /* five of the questions, a different set each evening; the right answer moves around too */
      const qs = QUIZ.map(function (_q, i) { return (i + k * 5) % QUIZ.length; }).slice(0, 5);
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

/* ---------- fishing off the pier with the fisherman of Mola: three casts, and the float tells you when to pull.
   The fish bite at fixed moments, with nibbles in between that are not bites yet: pull at the nibble and the bait is
   gone, wait too long and the fish has eaten it; the quicker the pull after the float goes under, the bigger the
   fish. No chance in it: a fair game, like the others. ---------- */
interface Cast { nibbles: number[]; bite: number; fish: string; g: [number, number] }
const CASTS: Cast[] = [
  { nibbles: [1.1, 1.9], bite: 2.7, fish: 'un cefalo', g: [600, 1300] },
  { nibbles: [0.8, 1.6, 2.6], bite: 3.5, fish: 'un\'orata', g: [400, 1100] },
  { nibbles: [1.4], bite: 2.2, fish: 'una spigola', g: [800, 1900] }
];
const PULL = 0.55;
function fishing(n: Npc) {
  const best0 = bestOf('pesca');
  sheet('<div class="award mg" role="dialog" aria-modal="true" aria-labelledby="mg-t">' +
    '<h2 id="mg-t">Pesca dal molo</h2>' +
    '<p>Il pescatore ti presta una canna. Guarda il galleggiante: quando va giù, tira (Spazio, o tocca il mare). Se tiri a un assaggio, l\'esca se ne va.</p>' +
    '<canvas class="mg-court" id="mg-c" width="320" height="140" aria-label="Il mare del porto, con il galleggiante"></canvas>' +
    '<p class="mg-score" id="mg-s" aria-live="polite">Lancio 1 di ' + CASTS.length + (best0 ? ' · record ' + activity('pesca').score!(best0) : '') + '</p>' +
    '<button class="btn" type="button" id="mg-x">Basta così</button></div>', 'result');
  const cv = $('mg-c') as HTMLCanvasElement, c = cv.getContext('2d')!, scoreEl = $('mg-s');
  const dpr = Math.min(2, window.devicePixelRatio || 1), Wc = 320, Hc = 140;
  cv.width = Wc * dpr; cv.height = Hc * dpr; cv.style.width = '100%'; cv.style.maxWidth = Wc + 'px';
  const col = { sky: css('--m-sea', '#a7d8f2'), sea: css('--m-sea2', '#79bde6'), foam: css('--m-foam', '#ffffff'), ink: css('--m-ink', '#1f2c6e'), stone: css('--m-stone', '#e4dfd2'), red: css('--red', '#c8372d'), good: css('--good', '#2c9a55') };
  let k = 0, t = 0, total = 0, over = false, raf = 0, last = performance.now(), state: 'wait' | 'bite' | 'shown' = 'wait', shown = 0, msg = '', catches: string[] = [];
  const cast = function () { return CASTS[Math.min(k, CASTS.length - 1)]; };
  /* how far under the float is now: a nibble is a little dip, the bite pulls it right down */
  function dip(): number {
    const C = cast();
    if (state === 'bite') return 14;
    for (const nb of C.nibbles) if (t >= nb && t < nb + 0.22) return 5 * Math.sin((t - nb) / 0.22 * Math.PI);
    return 0;
  }
  function draw() {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = col.sky; c.fillRect(0, 0, Wc, 46);
    c.fillStyle = col.sea; c.fillRect(0, 46, Wc, Hc - 46);
    c.strokeStyle = col.foam; c.lineWidth = 1.5;
    for (let r = 0; r < 4; r++) { c.beginPath(); for (let x = 0; x <= Wc; x += 8) { const y = 58 + r * 20 + Math.sin(x / 22 + t * 2 + r) * 2; if (x) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke(); }
    /* the pier and the rod */
    c.fillStyle = col.stone; c.fillRect(0, Hc - 24, 90, 24); c.strokeStyle = col.ink; c.lineWidth = 2; c.strokeRect(-2, Hc - 24, 92, 26);
    c.beginPath(); c.moveTo(70, Hc - 24); c.lineTo(150, 22); c.stroke();
    const fx0 = 228, fy = 74 + Math.sin(t * 3) * 1.5 + dip();
    c.lineWidth = 1; c.beginPath(); c.moveTo(150, 22); c.quadraticCurveTo(200, 30, fx0, fy - 8); c.stroke();
    if (state !== 'shown') {
      /* the float: red on top, white below the water line */
      c.beginPath(); c.ellipse(fx0, fy, 6, 8, 0, 0, Math.PI * 2); c.fillStyle = col.foam; c.fill(); c.strokeStyle = col.ink; c.lineWidth = 2; c.stroke();
      c.beginPath(); c.ellipse(fx0, fy - 3, 6, 5, 0, Math.PI, Math.PI * 2); c.fillStyle = col.red; c.fill(); c.stroke();
      if (state === 'bite') { c.strokeStyle = col.foam; c.lineWidth = 2; c.beginPath(); c.ellipse(fx0, 82, 14 + (t * 40) % 10, 4, 0, 0, Math.PI * 2); c.stroke(); }
    } else {
      /* what came out of the water */
      const up = Math.min(1, shown * 3), y = 82 - up * 40;
      c.save(); c.translate(fx0, y); c.rotate(Math.sin(shown * 12) * 0.3);
      if (msg) { c.fillStyle = col.good; c.beginPath(); c.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2); c.fill(); c.strokeStyle = col.ink; c.lineWidth = 2; c.stroke(); c.beginPath(); c.moveTo(16, 0); c.lineTo(26, -7); c.lineTo(26, 7); c.closePath(); c.fill(); c.stroke(); c.fillStyle = col.ink; c.beginPath(); c.arc(-10, -2, 1.8, 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
  }
  function next() {
    k++; t = 0; state = 'wait'; shown = 0; msg = '';
    if (k >= CASTS.length) { finish(); return; }
    scoreEl.textContent = 'Lancio ' + (k + 1) + ' di ' + CASTS.length + ' · finora ' + activity('pesca').score!(total);
  }
  function pull() {
    if (over || state === 'shown') return;
    const C = cast();
    if (state === 'bite') {
      const r = Math.max(0, t - C.bite), g = Math.round((C.g[0] + (C.g[1] - C.g[0]) * Math.max(0, 1 - r / PULL)) / 10) * 10;
      total += g; msg = C.fish + ' di ' + activity('pesca').score!(g); catches.push(msg);
      sfx('found');
    } else { msg = ''; sfx('dodge'); catches.push('niente: era solo un assaggio'); }
    state = 'shown'; shown = 0;
    scoreEl.textContent = msg ? 'Preso ' + msg + '!' : 'Troppo presto: l\'esca se n\'è andata.';
  }
  function frame(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!over) {
      t += dt;
      const C = cast();
      if (state === 'wait' && t >= C.bite) { state = 'bite'; sfx('ball'); }
      if (state === 'bite' && t > C.bite + PULL) { state = 'shown'; shown = 0; msg = ''; catches.push('niente: il pesce ha mangiato l\'esca'); sfx('dodge'); scoreEl.textContent = 'Troppo tardi: il pesce ha mangiato l\'esca.'; }
      if (state === 'shown') { shown += dt; if (shown > 1.3) next(); }
    }
    draw();
    if (!over) raf = requestAnimationFrame(frame);
  }
  function finish() {
    over = true; cancelAnimationFrame(raf); draw();
    const better = record('pesca', total);
    if (better && total > 0) sfx('badge');
    scoreEl.textContent = 'Fine: ' + activity('pesca').score!(total) + (better && total > 0 ? ' · nuovo record!' : best0 ? ' · record ' + activity('pesca').score!(best0) : '');
    const x0 = $('mg-x'); x0.textContent = 'Continua'; x0.focus();
  }
  const key = function (e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'a' || e.key === 'A') {
      if (over && e.key === 'Enter') return;
      e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) pull();
    }
  };
  document.addEventListener('keydown', key, true);
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); pull(); });
  $('mg-x').addEventListener('click', function () {
    const quit = !over;
    over = true; cancelAnimationFrame(raf);
    document.removeEventListener('keydown', key, true);
    closeSheet();
    if (quit) { say(['Già stanco? Il mare non scappa.'], n.name); return; }
    say(total ? ['Hai preso: ' + catches.filter(function (x) { return x.indexOf('niente') !== 0; }).join(', ') + '.', total >= 2500 ? 'Mamma mia! Con questi si fa una zuppa per tutta Mola.' : 'Non male. I cefali del porto sono furbi.']
      : ['Oggi i pesci non abboccano. Succede anche ai pescatori di Mola.'], n.name);
  });
  draw();
  raf = requestAnimationFrame(frame);
}
