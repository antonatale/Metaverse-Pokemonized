/* How long a frame of the map takes (R20, C1 of VISIONE.md). Put in front of the game by tools/perf/make.mjs, as
   dist/perf.html: open it in a browser (a double click on the Mac is enough) and wait about a minute.
   It enters the map with a story of its own, walks back and forth along via Vitruvio, and times every frame, with the
   graphics on Alta and on Bassa, by day and by night: one page load each, so that every choice is read as the game
   reads it at the start. The player's own story, graphics and hour are put back at the end.
   What it measures: the time of the page's frame callbacks (the game's loop: update and drawWorld), summed per frame,
   and how far apart the frames come (a GPU that cannot keep up shows there, not in the callback).
   Plain script, no module: it runs before the game, so that every requestAnimationFrame goes through it. */
(function () {
  var NAME = 'telepilo-perf:';
  var KEYS = ['lotte-tra-amici:storia:v1', 'lotte-tra-amici:grafica:v1', 'lotte-tra-amici:ora:v1'];
  var RUNS = [['alta', 'giorno'], ['alta', 'notte'], ['bassa', 'giorno'], ['bassa', 'notte']];
  var WARM = 1500, SIDE = 4000;
  /* a story already under way, in the middle of via Vitruvio, facing east: nothing to read, nobody to meet */
  var seen = { intro: true, starter: true };
  ['formia2', 'formia3', 'formia4', 'formia5', 'formia6', 'formia7'].forEach(function (k) { seen[k] = true; });
  ['bench', 'catch', 'covo', 'evolve', 'hero', 'level', 'loss', 'money', 'night', 'power', 'surge', 'trainer'].forEach(function (k) { seen['cic-' + k] = true; });
  var STORY = { v: 1, map: 'formia', x: 60, y: 36, dir: 'right', badges: [], squad: ['antonio'], beaten: {}, found: {}, seen: seen, mons: [{ uid: 'c1', sp: 'polpino' }] };

  /* the state between page loads lives in window.name: it survives a reload, also in a frame without sessionStorage */
  function load() { try { return window.name.indexOf(NAME) === 0 ? JSON.parse(window.name.slice(NAME.length)) : null; } catch (e) { return null; } }
  function keep(s) { window.name = NAME + JSON.stringify(s); }
  function getItem(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function setItem(k, v) { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* no storage */ } }

  var s = load();
  if (!s) {
    var backup = {};
    KEYS.forEach(function (k) { backup[k] = getItem(k); });
    s = { step: 0, backup: backup, results: [] };
    keep(s);
  }
  /* the end: the player's own keys back before the game reads them, and the numbers on the page */
  if (s.step >= RUNS.length) { KEYS.forEach(function (k) { setItem(k, s.backup[k]); }); window.addEventListener('load', function () { show(s); }); return; }
  var run = RUNS[s.step];
  setItem(KEYS[0], JSON.stringify(STORY)); setItem(KEYS[1], run[0]); setItem(KEYS[2], run[1]);

  /* every frame callback timed; those of the same frame share its timestamp */
  var raf = window.requestAnimationFrame.bind(window), rec = null;
  window.requestAnimationFrame = function (cb) {
    return raf(function (ts) {
      var t0 = performance.now();
      try { cb(ts); } finally {
        if (rec) { var last = rec[rec.length - 1]; var dt = performance.now() - t0; if (last && last[0] === ts) last[1] += dt; else rec.push([ts, dt]); }
      }
    });
  };

  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function key(type, k) { document.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true })); }
  function world() { var W = window.WORLD; return W && W._debug ? W._debug.pos() : null; }
  function q(sorted, p) { return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]; }
  function r1(v) { return Math.round(v * 10) / 10; }

  async function go() {
    for (var k = 0; k < 100 && !document.getElementById('go-story'); k++) await wait(100);
    var b = document.getElementById('go-story'); if (b) b.click();
    await wait(300);
    var hero = document.querySelector('[data-hero="antonio"]'); if (hero) hero.click();
    for (k = 0; k < 100; k++) { var p = world(); if (p && p.running) break; await wait(100); }
    for (k = 0; k < 10; k++) { p = world(); if (!p || !p.dialog) break; key('keydown', 'Enter'); key('keyup', 'Enter'); await wait(250); }
    var start = world();
    key('keydown', 'ArrowRight'); await wait(WARM);
    rec = [];
    await wait(SIDE); key('keyup', 'ArrowRight');
    key('keydown', 'ArrowLeft'); await wait(SIDE); key('keyup', 'ArrowLeft');
    var frames = rec; rec = null;
    var end = world();
    var ms = frames.map(function (f) { return f[1]; }).sort(function (a, b) { return a - b; });
    var gaps = [];
    for (k = 1; k < frames.length; k++) gaps.push(frames[k][0] - frames[k - 1][0]);
    gaps.sort(function (a, b) { return a - b; });
    var cv = document.getElementById('wcv');
    s.results.push({
      gfx: run[0], hour: run[1], frames: frames.length,
      median: r1(q(ms, 0.5)), p95: r1(q(ms, 0.95)), max: r1(ms[ms.length - 1] || 0),
      mean: r1(ms.reduce(function (a, b) { return a + b; }, 0) / (ms.length || 1)),
      gap: r1(q(gaps, 0.5)), fps: r1(1000 / (q(gaps, 0.5) || 1000)),
      walked: start && end ? Math.abs(end.x - start.x) + Math.abs(end.y - start.y) + ' (' + start.x + '→' + end.x + ')' : '?',
      view: innerWidth + '×' + innerHeight, dpr: devicePixelRatio, canvas: cv ? cv.width + '×' + cv.height : '?',
      screen: screen.width + '×' + screen.height,
      reduced: matchMedia('(prefers-reduced-motion: reduce)').matches, hidden: document.hidden
    });
    s.step++;
    keep(s);
    location.reload();
  }
  window.addEventListener('load', function () { setTimeout(function () { go().catch(function (e) { s.results.push({ error: String(e) }); s.step++; keep(s); location.reload(); }); }, 500); });

  function show(st) {
    var rows = st.results.map(function (r) {
      return r.error ? '<tr><td colspan="9">' + r.error + '</td></tr>' :
        '<tr><td>' + r.gfx + '</td><td>' + r.hour + '</td><td><b>' + r.median + '</b></td><td>' + r.p95 + '</td><td>' + r.max + '</td><td>' + r.fps + '</td><td>' + r.frames + '</td><td>' + r.walked + '</td></tr>';
    }).join('');
    var r0 = st.results[0] || {};
    var box = document.createElement('div');
    box.id = 'perf-result';
    box.setAttribute('style', 'position:fixed;inset:16px auto auto 16px;z-index:2147483647;background:#fff;color:#111;font:16px/1.4 system-ui,sans-serif;padding:16px 20px;border:3px solid #111;border-radius:10px;max-width:calc(100vw - 32px)');
    box.innerHTML = '<b style="font-size:20px">Telepilo · ms a fotogramma camminando</b><br>finestra ' + r0.view + ' · dpr ' + r0.dpr + ' · canvas ' + r0.canvas +
      ' · schermo ' + r0.screen + (r0.reduced ? ' · riduci il movimento' : '') + (r0.hidden ? ' · <b>pagina nascosta: numeri non validi</b>' : '') +
      '<table style="border-collapse:collapse;margin-top:8px" cellpadding="4"><tr style="text-align:left"><th>grafica</th><th>ora</th><th>mediana ms</th><th>95%</th><th>max</th><th>fps</th><th>fotogrammi</th><th>caselle</th></tr>' + rows + '</table>' +
      '<button type="button" id="perf-again" style="margin-top:10px;font:inherit">Rifai</button>';
    document.body.appendChild(box);
    document.getElementById('perf-again').addEventListener('click', function () { window.name = ''; location.reload(); });
    document.title = 'PERF ' + st.results.map(function (r) { return r.gfx + '/' + r.hour + ' ' + r.median + '/' + r.p95; }).join(' · ');
    window.__perf = st.results;
    window.name = '';
  }
})();
