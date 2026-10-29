(function () {
  'use strict';
  var E = window.ENGINE, SPR = window.SPR, C = E.CHARS, ROSTER = E.ROSTER;
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  var KEY = 'lotte-tra-amici:libretto:v2';
  var CANCEL = { cancelled: true };

  /* ---------- per-viewer record (convenience only) ---------- */
  function blankRecord() { return { v: 2, chars: {}, exam: {} }; }
  function loadRecord() {
    try {
      var v = JSON.parse(window.localStorage.getItem(KEY) || 'null');
      if (v && v.v === 2 && v.chars && v.exam) return v;
    } catch (e) { /* storage unavailable */ }
    return blankRecord();
  }
  function saveRecord() { try { window.localStorage.setItem(KEY, JSON.stringify(record)); } catch (e) { /* ignore */ } }
  var record = loadRecord();

  /* ---------- helpers ---------- */
  var ICONS = {
    notes: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4"/>',
    wallet: '<rect x="3" y="7" width="18" height="12" rx="2.5"/><path d="M15.5 13h3"/><path d="M6 7l8.5-3 1.5 3"/>',
    charger: '<path d="M9 3v4.5M15 3v4.5"/><path d="M6.5 7.5h11V11a5.5 5.5 0 0 1-11 0z"/><path d="M12 16.5V21"/>',
    passport: '<rect x="5" y="3" width="14" height="18" rx="2"/><circle cx="12" cy="10.5" r="3.6"/><path d="M8.4 10.5h7.2M9 17.5h6"/>',
    spark: '<path d="M12 3.5l1.9 5.2 5.3 1.8-5.3 1.8L12 17.5l-1.9-5.2-5.3-1.8 5.3-1.8z"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4.2l2.8 1.8M9.5 2.8h5"/>',
    scan: '<path d="M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16M4 12h16"/>',
    cert: '<rect x="4" y="4" width="16" height="12" rx="1.5"/><path d="M8 8h8M8 11h5"/><circle cx="15.5" cy="17" r="2.5"/>',
    down: '<path d="M12 4v15M6 13l6 6 6-6"/>',
    up: '<path d="M12 20V5M6 11l6-6 6 6"/>',
    robot: '<rect x="6" y="8" width="12" height="9" rx="3"/><path d="M12 4v4M9.5 12.5h.01M14.5 12.5h.01M8 20.5h8"/>',
    plane: '<path d="M3 13.5l18-7-4.3 11.7-3.9-3.9-2.9 2.5v-4.4z"/>',
    eye: '<path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    mute: '<path d="M4 9.5h4l5-4v13l-5-4H4z"/><path d="M17 9.5l4 5M21 9.5l-4 5"/>',
    swirl: '<path d="M12 12a2 2 0 1 1 2-2 4 4 0 1 1-4-4 6 6 0 1 1-6 6"/>',
    loop: '<path d="M17 2.5l3 3-3 3"/><path d="M4 11.5v-1a5 5 0 0 1 5-5h11M7 21.5l-3-3 3-3"/><path d="M20 12.5v1a5 5 0 0 1-5 5H4"/>',
    shield: '<path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.2-7.5 9.5-4.3-1.3-7.5-4.9-7.5-9.5V6z"/>',
    mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>',
    pulse: '<path d="M3 12h4l2.5-6 4 12 2.5-6h5"/>',
    music: '<path d="M9 18V5.5l11-2V16"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>',
    drop: '<path d="M12 3.5s6 6.6 6 10.6a6 6 0 0 1-12 0c0-4 6-10.6 6-10.6z"/>',
    flag: '<path d="M5 21V4M5 4.5h12l-2.5 4 2.5 4H5"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-4M12 16V8M16 16v-6"/>',
    wing: '<path d="M3 15c4-1 7-4 8.5-9 1 3 1 5.5 0 8 2.5-1.2 5.5-1.5 9.5-.5-3.5 2.5-8 4-12 4-2.5 0-4.5-.8-6-2.5z"/>',
    flame: '<path d="M12 21c-3.9 0-6.5-2.7-6.5-6.2 0-3.4 2.6-5.3 3.6-8.3 1.6 1.3 2.4 2.8 2.4 4.6 1.2-.8 2-2.3 2.2-3.8 2.4 2.1 4.8 4.6 4.8 7.6 0 3.5-2.6 6.1-6.5 6.1z"/>',
    ball: '<circle cx="12" cy="12" r="8.5"/><path d="M5.5 6.5c3 2.5 3 8.5 0 11M18.5 6.5c-3 2.5-3 8.5 0 11"/>',
    wrench: '<path d="M14.5 6.5a4 4 0 0 0 5 5l-8.5 8.5a2.1 2.1 0 0 1-3-3L16.5 8.5a4 4 0 0 0-2-2z"/>',
    paw: '<circle cx="7" cy="9.5" r="1.8"/><circle cx="11" cy="6.5" r="1.8"/><circle cx="15.5" cy="7" r="1.8"/><circle cx="18" cy="11" r="1.8"/><path d="M8.5 17.5c0-3 2-5.5 4.5-5.5s4 2 4 4.2c0 2-1.6 3.3-3.8 3.3-1.2 0-2.2-.6-3.2-.6-.9 0-1.5.6-2.2.6-.8 0-1.3-.8-1.3-2z"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    users: '<circle cx="9" cy="8" r="3.4"/><path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"/><circle cx="17" cy="9" r="2.6"/><path d="M15.5 14.4c3 .2 5.5 2.4 5.5 5.6"/>'
  };
  function ico(n) { return '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[n] || '') + '</svg>'; }
  var TC = { Calma: 'var(--t-calma)', Caos: 'var(--t-caos)', Cervello: 'var(--t-cervello)', Chiacchiera: 'var(--t-chiacchiera)', Cuore: 'var(--t-cuore)' };
  function tc(id) { return TC[C[id].type]; }
  function typeTag(t) { return '<span class="type t-' + t.toLowerCase() + '">' + t + '</span>'; }
  function kindTag(m) { return m.kind === 'atk' ? '<span class="type">Attacco</span>' : '<span class="type">Supporto</span>'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function $(id) { return document.getElementById(id); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduced ? Math.min(ms, 60) : ms); }); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function face(id, expr, cls) { return id === 'esame' ? SPR.esame('idle', cls) : SPR.person(id, expr || 'smirk', cls, SPR.thumb(id)); }
  function bust(id, expr, cls, vb) { return id === 'esame' ? SPR.esame(expr || 'idle', cls) : SPR.person(id, expr || 'smirk', cls, vb); }

  var EXPR_LABEL = { smirk: 'Di base', grin: 'Carica', pout: 'Colpito', worried: 'In crisi', sleepy: 'KO', cool: 'Vittoria' };
  var home = $('home'), battle = $('battle'), overlay = $('overlay');
  var view = { screen: 'home', sel: 'antonio', hero: 'smirk', mode: 'cpu', p1: 'antonio', p2: 'costanzo' };
  var S = null;

  /* =================== HOME =================== */
  function renderHome() {
    var h = '';
    h += '<header class="masthead"><div class="eyebrow">6 amici · 1 boss</div>' +
      '<h1 id="title"><span class="hl">Lotte</span> tra Amici</h1>' +
      '<p>Lotta a turni con le persone che contano. Ognuno ha il suo tipo, le sue mosse e i suoi difetti.</p></header>';
    if (window.WORLD) h += '<section aria-labelledby="s-t"><h2 class="sec-title" id="s-t">Storia <small>Prima tappa: Formia</small></h2><div class="card story" id="story"></div></section>';
    h += '<section aria-labelledby="r-t"><h2 class="sec-title" id="r-t">Personaggi <small>Tocca per vedere la scheda</small></h2><div class="roster">';
    ROSTER.forEach(function (id) {
      var c = C[id];
      h += '<button class="slot" type="button" data-id="' + id + '" aria-pressed="' + (id === view.sel) + '" style="--tc:' + tc(id) + '"><span class="face">' + face(id) + '</span><span class="nm">' + esc(c.name) + '</span><span class="nk">' + esc(c.nick !== c.name ? c.nick : c.full) + '</span></button>';
    });
    h += '</div></section>';
    h += '<article class="card" id="card" aria-live="polite"></article>';
    h += '<section aria-labelledby="f-t"><h2 class="sec-title" id="f-t">Il boss</h2><div class="card foe"><div>' + SPR.esame('idle') + '</div>' +
      '<div><b>' + esc(C.esame.name) + '</b> ' + typeTag(C.esame.type) + '<p><strong>' + esc(C.esame.passive.name) + '.</strong> ' + esc(C.esame.passive.text) + '</p>' +
      '<button class="btn" type="button" id="go-exam"></button></div></div></section>';
    h += '<section aria-labelledby="t-t"><h2 class="sec-title" id="t-t">Tipi</h2><div class="cycle" aria-hidden="true">';
    E.TYPE_ORDER.forEach(function (t) { h += typeTag(t) + '<span class="arr">→</span>'; });
    h += typeTag(E.TYPE_ORDER[0]) + '</div>';
    h += '<p class="cycle-note">Ogni tipo batte quello che lo segue: chi ha il vantaggio fa il 12% di danni in più e ne subisce il 10% in meno.</p><ul class="cycle-why">';
    E.TYPE_ORDER.forEach(function (t) {
      var who = ROSTER.filter(function (id) { return C[id].type === t; }).map(function (id) { return C[id].name; });
      if (t === C.esame.type) who.push('l\'Esame');
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
      b.addEventListener('click', function () { select(b.getAttribute('data-id'), true); });
    });
    $('go').addEventListener('click', function () { openSetup(); });
    $('go-exam').addEventListener('click', function () { startBattle({ a: view.sel, b: 'esame', mode: 'cpu' }); });
  }
  function select(id, scroll) {
    view.sel = id; view.hero = 'smirk'; view.p1 = id;
    if (view.p2 === id) view.p2 = ROSTER[(ROSTER.indexOf(id) + 1) % ROSTER.length];
    each(home.querySelectorAll('.slot'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-id') === id)); });
    renderCard();
    if (scroll) { var el = $('card'); if (el && el.getBoundingClientRect().top > window.innerHeight * 0.6) el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }); }
  }
  function charBlocks(c) {
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
      '<div class="hero-id"><h2>' + esc(c.full) + '</h2>' + typeTag(c.type) + (c.nick !== c.name ? '<span class="nick">' + esc(c.nick) + '</span>' : '') + '<span class="from">' + esc(c.tagline) + '</span></div></div>';
    h += '<div class="exprs" role="group" aria-label="Espressioni">';
    SPR.EXPRS.forEach(function (x) { h += '<button class="expr" type="button" data-x="' + x + '" aria-pressed="' + (x === view.hero) + '">' + face(view.sel, x) + '<span>' + EXPR_LABEL[x] + '</span></button>'; });
    h += '</div>';
    var st = c.stats, rows = [['Vita', st.hp], ['Attacco', st.atk], ['Difesa', st.def], ['Velocità', st.spe]];
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
      '<div><b>Forte contro</b><span>' + esc(beats.length ? beats.join(', ') : 'nessuno degli amici') + (E.eff(c.type, C.esame.type) > 1 ? ' e l\'Esame' : '') + '</span></div>' +
      '<div><b>Debole contro</b><span>' + esc(loses.length ? loses.join(', ') : 'nessuno degli amici') + (E.eff(C.esame.type, c.type) > 1 ? ' e l\'Esame' : '') + '</span></div></div></div>';
    el.innerHTML = h;
    each(el.querySelectorAll('.expr'), function (b) {
      b.addEventListener('click', function () {
        view.hero = b.getAttribute('data-x');
        var big = el.querySelector('.hero-art .spr-p'); if (big) big.setAttribute('data-expr', view.hero);
        each(el.querySelectorAll('.expr'), function (o) { o.setAttribute('aria-pressed', String(o === b)); });
      });
    });
    $('go').textContent = 'Sfida con ' + c.name;
    $('go-exam').textContent = 'Affronta l\'esame con ' + c.name;
  }
  /* the story card: a still of Formia, the pins won so far, the way in */
  function renderStory() {
    var el = $('story');
    if (!el || !window.WORLD) return;
    var sm = window.WORLD.summary(), WA = window.WORLD_ART;
    var got = sm.badges.filter(function (b) { return b.earned; }).length;
    el.innerHTML = '<div class="story-map" id="story-map"></div><div class="block">' +
      '<p>Gira Formia vista dall\'alto, ritrova le cose che Antonio ha perso in giro ed entra nei covi degli amici: chi batti ti dà la sua spilla ed entra nella compagnia.</p>' +
      '<div class="story-row"><span class="story-badges" role="img" aria-label="Spille: ' + got + ' su ' + sm.badges.length + '">' +
      sm.badges.map(function (b) { return '<span title="' + esc(b.name) + '">' + WA.badgeSVG(b, 30) + '</span>'; }).join('') + '</span>' +
      (sm.squad.length > 1 ? '<span class="story-squad">Compagnia: ' + esc(sm.squad.map(function (id) { return C[id].name; }).join(', ')) + '</span>' : '') +
      (sm.found ? '<span class="story-squad">Oggetti ritrovati: ' + sm.found + ' su ' + sm.items + '</span>' : '') +
      '<button class="btn primary" type="button" id="go-story">' + (sm.started ? 'Continua la storia' : 'Gioca la storia') + '</button></div></div>';
    $('go-story').addEventListener('click', function () { window.WORLD.open(); });
    window.WORLD.preview($('story-map'));
  }
  function storyCity(story) {
    var cv = window.WORLD_COVI && window.WORLD_COVI[story.covo];
    return cv && window.WORLD_MAPS[cv.city] ? window.WORLD_MAPS[cv.city].name : 'la mappa';
  }
  function examLabel(x) { return !x || x.best == null ? '—' : (x.lode ? '30L' : String(x.best)); }
  function renderLibretto() {
    var el = $('libretto');
    if (!el) return;
    var any = ROSTER.some(function (id) { var r = record.chars[id], x = record.exam[id]; return (r && (r.w || r.l)) || (x && (x.p || x.f)); });
    var h = '<table class="rec"><thead><tr><th>Personaggio</th><th>Vittorie</th><th>Sconfitte</th><th>Voto esame</th></tr></thead><tbody>';
    if (!any) h += '<tr><td class="empty" colspan="4">Ancora nessuna lotta. Le vittorie e i voti compaiono qui.</td></tr>';
    else ROSTER.forEach(function (id) {
      var r = record.chars[id] || { w: 0, l: 0 }, x = record.exam[id];
      h += '<tr><td>' + esc(C[id].name) + '</td><td>' + r.w + '</td><td>' + r.l + '</td><td>' + examLabel(x) + '</td></tr>';
    });
    el.innerHTML = h + '</tbody></table>';
  }

  /* =================== SETUP SHEET =================== */
  function openSetup() {
    view.p1 = view.sel;
    if (view.p2 === view.p1 && view.mode === 'cpu') view.p2 = ROSTER[(ROSTER.indexOf(view.p1) + 1) % ROSTER.length];
    renderSetup();
  }
  function renderSetup() {
    var pvp = view.mode === 'pvp';
    if (pvp && view.p2 === 'esame') view.p2 = ROSTER[(ROSTER.indexOf(view.p1) + 1) % ROSTER.length];
    var grid = function (key, list) {
      return '<div class="pickgrid">' + list.map(function (id) {
        return '<button class="pick" type="button" data-k="' + key + '" data-id="' + id + '" aria-pressed="' + (view[key] === id) + '" style="--tc:' + (id === 'esame' ? 'var(--t-none)' : tc(id)) + '"><span class="face">' + face(id) + '</span><span>' + esc(id === 'esame' ? 'Esame' : C[id].name) + '</span></button>';
      }).join('') + '</div>';
    };
    var h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="su-t"><div class="sheet-h"><h2 id="su-t">Nuova sfida</h2><button class="tb-btn" type="button" id="su-x">Chiudi</button></div>';
    h += '<div class="seg" role="group" aria-label="Modalità"><button type="button" data-m="cpu" aria-pressed="' + !pvp + '">Contro il computer</button><button type="button" data-m="pvp" aria-pressed="' + pvp + '">Due giocatori</button></div>';
    h += '<div class="pickrow"><h3>' + (pvp ? 'Giocatore 1' : 'Tu giochi con') + '</h3>' + grid('p1', ROSTER) + '</div>';
    h += '<div class="pickrow"><h3>' + (pvp ? 'Giocatore 2' : 'Contro') + '</h3>' + grid('p2', pvp ? ROSTER : ROSTER.concat(['esame'])) + '</div>';
    h += '<div class="vsline">' + esc(C[view.p1].name) + ' <i>vs</i> ' + esc(C[view.p2].name) + '</div>';
    h += '<p class="hint">' + (pvp ? 'Stesso telefono: a ogni turno sceglie prima il Giocatore 1, poi passa il telefono al Giocatore 2. Le mosse restano segrete fino alla lotta.' : view.p2 === 'esame' ? 'L\'esame dura 12 turni: se non lo batti in tempo, il compito viene ritirato.' : 'Il computer gioca con ' + C[view.p2].name + '. Puoi scegliere anche lo stesso personaggio.') + '</p>';
    h += '<button class="cta" type="button" id="su-go">Inizia la lotta</button></div>';
    overlay.className = 'overlay';
    overlay.innerHTML = h;
    overlay.hidden = false;
    $('su-x').addEventListener('click', closeOverlay);
    each(overlay.querySelectorAll('.seg button'), function (b) { b.addEventListener('click', function () { view.mode = b.getAttribute('data-m'); renderSetup(); }); });
    each(overlay.querySelectorAll('.pick'), function (b) { b.addEventListener('click', function () { view[b.getAttribute('data-k')] = b.getAttribute('data-id'); renderSetup(); }); });
    $('su-go').addEventListener('click', function () { closeOverlay(); startBattle({ a: view.p1, b: view.p2, mode: view.p2 === 'esame' ? 'cpu' : view.mode }); });
  }

  /* =================== BATTLE SHELL =================== */
  var arena, dialog, whoEl, txtEl, pad, turnbar, padSide = 0, padOn = false, pending = {}, needQ = [];
  function sideName(i) { return C[S.sides[i].id].name; }
  function sideLabel(i) { return S.mode === 'pvp' ? 'G' + (i + 1) : (i === 0 ? 'Tu' : 'CPU'); }
  function boxHtml(i) {
    var c = C[S.sides[i].id];
    return '<div class="box ' + (i === 0 ? 'me' : 'opp') + '" id="box-' + i + '"><div class="box-h"><b>' + esc(c.name) + '</b><span class="chip tag">' + sideLabel(i) + '</span></div>' +
      '<div class="hp"><em>PS</em><div class="hpbar" id="hp-' + i + '"><span></span></div></div>' +
      '<div class="box-f"><span class="type t-' + c.type.toLowerCase() + '" id="ty-' + i + '">' + c.type + '</span><div class="chips" id="chips-' + i + '"></div><span class="hpnum" id="hpn-' + i + '"></span></div></div>';
  }
  function renderShell() {
    var a = S.sides[0].id, b = S.sides[1].id;
    battle.innerHTML =
      '<div class="topbar"><button class="tb-btn" type="button" id="quit">Esci</button>' +
      '<div class="clock" id="clock">' + (S.boss ? ico('clock') + '<span id="clock-t">2:00</span>' : '') + '<span class="turn" id="turn-t">Turno 1</span></div>' +
      '<button class="tb-btn" type="button" id="info">Scheda</button></div>' +
      '<div class="arena" id="arena">' + boxHtml(1) +
      '<div class="spr-wrap opp" id="w-1"><div class="mover" id="m-1"><div class="bob">' + bust(b, b === 'esame' ? 'idle' : 'smirk') + '</div></div></div>' +
      '<div class="spr-wrap me" id="w-0"><div class="mover" id="m-0"><div class="bob">' + bust(a, 'smirk') + '</div></div></div>' + boxHtml(0) + '</div>' +
      '<div class="dialog" id="dialog" role="status" aria-live="polite"><span class="who" id="who" hidden></span><span class="txt" id="txt"></span><span class="caret" aria-hidden="true"></span></div>' +
      '<div class="turnbar" id="turnbar" hidden></div>' +
      '<div class="pad off" id="pad">' + [0, 1, 2, 3].map(function (k) { return '<button class="mv" type="button" data-k="' + k + '" disabled></button>'; }).join('') + '</div>';
    arena = $('arena'); dialog = $('dialog'); whoEl = $('who'); txtEl = $('txt'); pad = $('pad'); turnbar = $('turnbar');
    dialog.addEventListener('click', advance);
    arena.addEventListener('click', advance);
    pad.addEventListener('click', function (e) {
      var bt = e.target.closest ? e.target.closest('.mv') : null;
      if (bt && bt.getAttribute('data-id')) onMove(bt.getAttribute('data-id'));
    });
    var q = $('quit'), qt = null;
    q.addEventListener('click', function () {
      if (q.getAttribute('data-armed') === '1' || (S && S.phase === 'over')) {
        clearTimeout(qt);
        if (S && S.story) backToWorld(S.story, false, true); else goHome();
        return;
      }
      q.setAttribute('data-armed', '1'); q.textContent = 'Esci davvero?';
      qt = setTimeout(function () { q.removeAttribute('data-armed'); q.textContent = 'Esci'; }, 2600);
    });
    $('info').addEventListener('click', openSheet);
  }

  /* ---------- status ---------- */
  var uiHp = [0, 0], shown = { revealed: [true, false] };
  function setHp(i, hp) {
    var max = S.sides[i].max, bar = $('hp-' + i), pct = Math.max(0, Math.min(100, hp / max * 100));
    bar.firstChild.style.width = pct + '%';
    bar.classList.toggle('mid', pct <= 50 && pct > 20);
    bar.classList.toggle('low', pct <= 20);
    $('hpn-' + i).textContent = shown.revealed[i] ? hp + '/' + max : '??';
  }
  function renderSync(sn) {
    for (var i = 0; i < 2; i++) {
      shown.revealed[i] = i === 0 || S.mode === 'pvp' || S.sides[i].id !== 'esame' || sn.revealed[i];
      $('chips-' + i).innerHTML = sn.chips[i].map(function (c) { return '<span class="chip ' + c.c + '" title="' + esc(c.d) + '">' + ico(c.i) + esc(c.t) + '</span>'; }).join('');
      $('hpn-' + i).textContent = shown.revealed[i] ? uiHp[i] + '/' + S.sides[i].max : '??';
      var t = E.sideType(S, i), ty = $('ty-' + i);
      ty.textContent = t; ty.className = 'type t-' + t.toLowerCase();
      var svg = battle.querySelector('#w-' + i + ' .spr-p');
      if (svg) svg.setAttribute('data-ph', sn.ph[i] ? 'on' : 'off');
    }
    if (S.boss) {
      var left = (sn.maxTurns - sn.turn + 1) * 10;
      $('clock-t').textContent = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
      $('clock').classList.toggle('low', left <= 30);
      $('turn-t').textContent = 'Turno ' + sn.turn + ' di ' + sn.maxTurns;
    } else $('turn-t').textContent = 'Turno ' + sn.turn;
  }
  function renderPad(i) {
    padSide = i;
    var c = C[S.sides[i].id];
    each(pad.querySelectorAll('.mv'), function (b, k) {
      var m = c.moves[k];
      if (!m) { b.hidden = true; return; }
      b.hidden = false;
      var L = E.moveLabel(S, i, m.id), sub = '';
      if (L.dots) sub = '<span class="stage">' + L.dots.map(function (on) { return '<i class="' + (on ? 'on' : '') + '"></i>'; }).join('') + '</span>' + esc(L.sub);
      else sub = (L.icon ? ico(L.icon) : '') + esc(L.sub);
      if (L.left != null && !L.locked) sub += '<span class="left">' + L.left + (L.left === 1 ? ' uso' : ' usi') + '</span>';
      b.setAttribute('data-id', m.id);
      b.className = 'mv' + (m.kind === 'atk' ? ' atk' : '') + (L.locked ? ' locked' : '');
      b.style.setProperty('--tc', TC[E.sideType(S, i)]);
      b.innerHTML = '<b>' + esc(m.name) + '</b><small>' + sub + '</small>';
      b.disabled = !padOn || L.locked;
      b.setAttribute('aria-label', m.name + (L.locked ? ', non disponibile' : '') + '. ' + L.sub);
    });
  }
  function setPad(on, i) { padOn = on; pad.classList.toggle('off', !on); renderPad(i == null ? padSide : i); }

  /* ---------- dialogue ---------- */
  var tapHandler = null, stopSay = null;
  function advance() { if (tapHandler) tapHandler(); }
  function say(text, who) {
    return new Promise(function (resolve) {
      var wEl = whoEl, tEl = txtEl, dEl = dialog;
      if (who != null) { wEl.hidden = false; wEl.textContent = sideName(who); wEl.style.setProperty('--tc', TC[C[S.sides[who].id].type]); }
      else wEl.hidden = true;
      var full = who != null ? '«' + text + '»' : text, n = 0, typing = true, tt = null, hold = null, mine;
      dEl.classList.remove('wait');
      tEl.textContent = '';
      function stop() { clearTimeout(tt); clearTimeout(hold); if (tapHandler === mine) tapHandler = null; }
      function done() { stop(); dEl.classList.remove('wait'); resolve(); }
      function finish() {
        typing = false; tEl.textContent = full; dEl.classList.add('wait');
        hold = setTimeout(done, reduced ? 1400 : Math.min(2400, 750 + full.length * 18));
      }
      function step() {
        if (!typing) return;
        n += 2; tEl.textContent = full.slice(0, n);
        if (n >= full.length) finish(); else tt = setTimeout(step, 22);
      }
      mine = function () { if (typing) { clearTimeout(tt); finish(); } else done(); };
      tapHandler = mine; stopSay = stop;
      if (reduced) finish(); else step();
    });
  }
  function showPrompt(i) {
    whoEl.hidden = true;
    var t = 'Cosa fa ' + sideName(i) + '?';
    if (S.mode === 'cpu' && i === 0 && S.forecast[0] && E.planName(S, 1)) t += ' ' + sideName(1) + ' sta per usare ' + E.planName(S, 1) + '.';
    txtEl.textContent = t;
    dialog.classList.remove('wait');
    if (S.mode === 'pvp') {
      turnbar.hidden = false;
      turnbar.style.setProperty('--tc', TC[C[S.sides[i].id].type]);
      turnbar.innerHTML = '<span class="tag">Giocatore ' + (i + 1) + '</span>sceglie per ' + esc(sideName(i));
    } else turnbar.hidden = true;
  }

  /* ---------- effects ---------- */
  function pulse(el, c, ms) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); return sleep(ms).then(function () { el.classList.remove(c); }); }
  function rel(el) { var a = arena.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left - a.left, y: r.top - a.top, w: r.width, h: r.height }; }
  function fx(html, cls, x, y, life) {
    var el = document.createElement('div');
    el.className = 'fx ' + (cls || ''); el.innerHTML = html;
    el.style.left = x + 'px'; el.style.top = y + 'px';
    arena.appendChild(el);
    if (life) setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, life);
    return el;
  }
  function animate(el, frames, opts) {
    if (!el.animate || reduced) return Promise.resolve();
    try { var an = el.animate(frames, opts); return an.finished ? an.finished.catch(function () {}) : sleep(opts.duration); } catch (e) { return Promise.resolve(); }
  }
  function anchor(i, fx0, fy0) { var r = rel($('w-' + i)); return [r.x + r.w * fx0, r.y + r.h * fy0]; }
  function projectile(from, to, html, cls, dur, lift) {
    var a = anchor(from, from === 0 ? 0.6 : 0.3, 0.32), b = anchor(to, to === 0 ? 0.55 : 0.4, 0.38);
    var el = fx(html, cls, 0, 0, 0);
    var mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - (lift == null ? 40 : lift);
    return animate(el, [
      { transform: 'translate(' + a[0] + 'px,' + a[1] + 'px) scale(.5)', opacity: 0 },
      { transform: 'translate(' + mx + 'px,' + my + 'px) scale(1) rotate(-12deg)', opacity: 1, offset: 0.5 },
      { transform: 'translate(' + b[0] + 'px,' + b[1] + 'px) scale(.95) rotate(8deg)', opacity: 1 }
    ], { duration: dur || 620, easing: 'ease-in-out' }).then(function () { el.remove(); });
  }
  function popAt(i, html, cls, fx0, fy0, dur) {
    var p = anchor(i, fx0 == null ? 0.6 : fx0, fy0 == null ? 0.04 : fy0);
    var el = fx(html, cls, p[0], p[1], 0);
    return animate(el, [
      { transform: 'translate(-50%, 10px) scale(.4)', opacity: 0 },
      { transform: 'translate(-50%, -8px) scale(1.12)', opacity: 1, offset: 0.25 },
      { transform: 'translate(-50%, -12px) scale(1)', opacity: 1, offset: 0.75 },
      { transform: 'translate(-50%, -30px) scale(.9)', opacity: 0 }
    ], { duration: reduced ? 1 : (dur || 1100), easing: 'ease-out', fill: 'forwards' }).then(function () { el.remove(); });
  }
  var ROBOT_FALLEN = null;
  function robotFall(i) {
    var a = rel($('w-' + i)), x = a.x + a.w * (i === 0 ? 0.86 : 0.1), y = a.y + a.h * 0.55;
    var el = fx(SPR.robot(), 'robot', x, y, 0);
    ROBOT_FALLEN = el;
    el.style.transformOrigin = '50% 90%';
    el.style.transform = 'rotate(96deg)';
    return animate(el, [{ transform: 'translateY(30px) scale(.4)', opacity: 0 }, { transform: 'translateY(-36px) scale(1) rotate(-12deg)', opacity: 1, offset: 0.4 }, { transform: 'rotate(96deg)' }], { duration: 760, easing: 'ease-in' });
  }
  function robotFix() {
    var el = ROBOT_FALLEN; ROBOT_FALLEN = null;
    if (!el || !el.parentNode) return sleep(200);
    return animate(el, [{ transform: 'rotate(96deg)' }, { transform: 'rotate(0deg) translateY(-18px)', offset: 0.55 }, { transform: 'translate(-60px, 10px) scale(.3)', opacity: 0 }], { duration: 900, easing: 'ease-in-out', fill: 'forwards' }).then(function () { el.remove(); });
  }
  var FOX = '<svg class="proj" viewBox="0 0 64 64" aria-hidden="true"><path d="M6 30C16 20 24 22 30 28C26 16 30 8 38 4C38 14 36 22 34 28Z" fill="#f4efe6" stroke="#1c2340" stroke-width="2.4" stroke-linejoin="round"/><path d="M58 30C48 20 40 22 34 28C38 16 34 8 26 4C26 14 28 22 30 28Z" fill="#f4efe6" stroke="#1c2340" stroke-width="2.4" stroke-linejoin="round" transform="translate(64 0) scale(-1 1) translate(64 0) scale(-1 1)"/>' +
    '<path d="M18 34L24 22L30 30L34 30L40 22L46 34C46 46 40 54 32 56C24 54 18 46 18 34Z" fill="#e8873a" stroke="#1c2340" stroke-width="2.4" stroke-linejoin="round"/><path d="M24 44C28 48 36 48 40 44C38 52 34 54 32 54C30 54 26 52 24 44Z" fill="#fff4e6"/><circle cx="27" cy="38" r="2.2" fill="#1c2340"/><circle cx="37" cy="38" r="2.2" fill="#1c2340"/><circle cx="32" cy="47" r="2" fill="#1c2340"/></svg>';
  var BALL = '<svg class="proj" viewBox="0 0 40 40" aria-hidden="true" style="width:30px;height:30px"><circle cx="20" cy="20" r="15" fill="#d8f04a" stroke="#1c2340" stroke-width="2.4"/><path d="M8 11C14 16 14 24 8 29M32 11C26 16 26 24 32 29" fill="none" stroke="#fff" stroke-width="2.4"/></svg>';
  var NOTE = '<svg viewBox="0 0 24 32" width="22" height="30" aria-hidden="true"><path d="M9 25V5L20 2V9L9 12" fill="none" stroke="#1c2340" stroke-width="2.6" stroke-linejoin="round"/><ellipse cx="5.6" cy="25.4" rx="4.6" ry="3.6" fill="#1c2340"/></svg>';
  function confetti(i) {
    var p = anchor(i, 0.55, 0.3), cols = ['#ff8fc1', '#ffe45c', '#8fd0f6', '#57c968', '#ffa35a', '#bba0ff'], all = [];
    for (var k = 0; k < 16; k++) {
      var el = fx('', 'confetti', p[0], p[1], 0);
      el.style.background = cols[k % cols.length];
      var ang = (i === 0 ? -1.1 : 2.0) + (Math.random() - 0.5) * 2.2, dist = 70 + Math.random() * 90;
      all.push(animate(el, [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + Math.cos(ang) * dist + 'px,' + (Math.sin(ang) * dist + 40) + 'px) rotate(' + (Math.random() * 720) + 'deg)', opacity: 0 }], { duration: 900 + Math.random() * 300, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' }).then((function (e) { return function () { e.remove(); }; })(el)));
    }
    return sleep(700);
  }
  function notes(i) {
    var all = [];
    for (var k = 0; k < 4; k++) {
      (function (k) {
        var p = anchor(i, 0.25 + k * 0.17, 0.12), el = fx(NOTE, 'note', p[0], p[1], 0);
        all.push(sleep(k * 120).then(function () {
          return animate(el, [{ transform: 'translateY(10px) scale(.5)', opacity: 0 }, { transform: 'translateY(-20px) scale(1)', opacity: 1, offset: 0.4 }, { transform: 'translate(' + (k % 2 ? 14 : -14) + 'px,-60px)', opacity: 0 }], { duration: 1000, easing: 'ease-out', fill: 'forwards' });
        }).then(function () { el.remove(); }));
      })(k);
    }
    return sleep(800);
  }
  function scan(i) {
    var w = $('w-' + i), line = document.createElement('div');
    line.className = 'scanline'; line.style.top = '0';
    w.appendChild(line);
    return animate(line, [{ top: '0%', opacity: 1 }, { top: '96%', opacity: 1 }, { top: '96%', opacity: 0 }], { duration: 850, easing: 'ease-in-out' })
      .then(function () { line.remove(); shown.revealed[i] = true; setHp(i, uiHp[i]); });
  }
  function banner(text, style) {
    var el = fx(esc(text), 'banner ' + (style || ''), 0, 0, 1300);
    el.style.left = ''; el.style.top = '';
    return sleep(1050);
  }

  /* ---------- playback ---------- */
  var flow = 0;
  var EX_MAP = { smirk: 'idle', grin: 'angry', cool: 'angry', pout: 'hurt', worried: 'hurt', sleepy: 'ko', ko: 'ko', idle: 'idle', angry: 'angry', hurt: 'hurt' };
  var PX_MAP = { idle: 'smirk', angry: 'grin', hurt: 'pout', ko: 'sleepy' };
  function setExpr(i, v) {
    var id = S.sides[i].id, svg = battle.querySelector('#w-' + i + ' .spr');
    if (!svg) return;
    if (id === 'esame') svg.setAttribute('data-face', EX_MAP[v] || 'idle');
    else svg.setAttribute('data-expr', PX_MAP[v] || v);
  }
  function hpEvent(ev) {
    var i = ev.who, m = $('m-' + i);
    uiHp[i] = ev.hp;
    if (ev.dmg) {
      m.classList.remove('shake', 'flash'); void m.offsetWidth; m.classList.add('shake', 'flash');
      var p = anchor(i, 0.5, i === 0 ? 0.18 : 0.12);
      fx('−' + ev.dmg, 'num ' + (ev.crit ? 'crit' : ''), p[0], p[1], 1150);
      setHp(i, ev.hp);
      return sleep(600).then(function () { m.classList.remove('shake', 'flash'); });
    }
    if (!ev.quiet) m.classList.add('glow');
    var q = anchor(i, 0.5, i === 0 ? 0.18 : 0.12);
    fx('+' + ev.heal, 'num heal', q[0], q[1], 1150);
    setHp(i, ev.hp);
    return sleep(ev.quiet ? 350 : 650).then(function () { m.classList.remove('glow'); });
  }
  function animEvent(ev) {
    var i = ev.who, j = 1 - i, m = $('m-' + i);
    switch (ev.a) {
      case 'lunge': return pulse(m, i === 0 ? 'lunge-me' : 'lunge-opp', 340);
      case 'dodge': return pulse(m, 'dodge', 400);
      case 'enter': return pulse(m, 'enter', 560);
      case 'faint': m.classList.add(i === 0 ? 'faint-me' : 'faint-opp'); return sleep(950);
      case 'heal': return Promise.resolve();
      case 'robot': return projectile(i, j, SPR.robot(), 'robot', 620);
      case 'robotFail': return robotFall(i);
      case 'robotFix': return robotFix();
      case 'lost': return popAt(i, '<div class="pop">' + ico(ev.item) + '<i>?</i></div>', '', 0.62, 0.02);
      case 'found': return popAt(i, '<div class="pop">' + ico(ev.item) + '<i>!</i></div>', '', 0.62, 0.02);
      case 'ai': return popAt(i, '<div class="pop">' + ico('spark') + '</div>', '', 0.68, 0.04, 900);
      case 'reveal': return scan(i);
      case 'banner': return banner(ev.text, ev.style);
      case 'speech': return popAt(i, '<div class="bubble">BLA BLA BLA</div>', '', 0.5, -0.02, 900);
      case 'glint': return pulse(m, 'flash', 420);
      case 'fox': return projectile(i, j, FOX, '', 560, 70);
      case 'pump': return pulse(m, 'glow', 800);
      case 'confetti': confetti(i); return pulse(m, i === 0 ? 'lunge-me' : 'lunge-opp', 340);
      case 'flyAway': m.classList.add('away'); return sleep(700).then(function () { m.classList.remove('away'); m.classList.add('gone'); });
      case 'flyBack': m.classList.remove('gone'); return pulse(m, 'back', 620);
      case 'glowGreen': return pulse(m, 'glowGreen', 1000);
      case 'ball': return projectile(i, j, BALL, '', 460, 24);
      case 'cryptic': return projectile(i, j, '<div class="bubble hand">ok… ?¿</div>', '', 700, 30);
      case 'bark': return popAt(i, '<div class="bubble">BAU!</div>', '', 0.55, 0, 800);
      case 'laugh': return popAt(i, '<div class="bubble">AHAHAH</div>', '', 0.5, 0, 900);
      case 'cricket': return popAt(i, '<div class="bubble hand">cri cri…</div>', '', 0.5, 0, 1000);
      case 'confused': return popAt(i, '<div class="pop">' + ico('swirl') + '</div>', '', 0.5, 0, 900);
      case 'phOn': case 'phOff':
        var svg = battle.querySelector('#w-' + i + ' .spr-p');
        if (svg) svg.setAttribute('data-ph', ev.a === 'phOn' ? 'on' : 'off');
        return pulse(m, 'glow', 500);
      case 'notes': notes(i); return sleep(300).then(function () { return pulse(m, i === 0 ? 'lunge-me' : 'lunge-opp', 340); });
      default: return Promise.resolve();
    }
  }
  function stepEvent(ev) {
    switch (ev.k) {
      case 'say': return say(ev.text);
      case 'line': return say(ev.text, ev.who);
      case 'expr': setExpr(ev.who, ev.v); return Promise.resolve();
      case 'anim': return animEvent(ev);
      case 'hp': return hpEvent(ev);
      case 'sync': renderSync(ev); return Promise.resolve();
      default: return Promise.resolve();
    }
  }
  function play(evs, my) {
    var n = 0;
    function next() {
      if (my !== flow) return Promise.reject(CANCEL);
      if (n >= evs.length) return Promise.resolve();
      return stepEvent(evs[n++]).then(next);
    }
    return next();
  }
  function caught(e) { if (e !== CANCEL) throw e; }
  function runFlow() {
    var my = ++flow;
    function loop() {
      if (my !== flow) return Promise.resolve();
      if (S.phase === 'over') { showResult(); return Promise.resolve(); }
      if (S.phase === 'intro') { setPad(false, 0); return play(E.intro(S), my).then(loop); }
      if (S.phase === 'begin') { setPad(false); turnbar.hidden = true; return play(E.beginTurn(S), my).then(loop); }
      if (S.phase === 'select') {
        renderSync(E.snap(S));
        pending = {}; needQ = E.needs(S);
        if (!needQ.length) { setPad(false); return sleep(250).then(function () { return resolveTurn(my); }).then(loop); }
        askNext(false);
      }
      return Promise.resolve();
    }
    return loop().catch(caught);
  }
  function askNext(handoff) {
    var i = needQ[0];
    if (handoff && S.mode === 'pvp') { setPad(false, i); showPass(i); return; }
    showPrompt(i);
    setPad(true, i);
  }
  function onMove(id) {
    if (!padOn || !S || S.phase !== 'select' || !needQ.length) return;
    var i = needQ[0];
    if (E.available(S, i).indexOf(id) < 0) return;
    pending[i] = id;
    needQ.shift();
    setPad(false, i);
    if (needQ.length) { askNext(true); return; }
    turnbar.hidden = true;
    var my = ++flow;
    resolveTurn(my).then(function () { if (my === flow) runFlow(); }).catch(caught);
  }
  function resolveTurn(my) { return play(E.playTurn(S, pending), my); }

  /* =================== PASS THE PHONE =================== */
  function showPass(i) {
    var id = S.sides[i].id;
    overlay.className = 'overlay pass';
    overlay.innerHTML = '<div class="pass-card" role="dialog" aria-modal="true" aria-labelledby="ps-t" style="--tc:' + tc(id) + '"><div class="face">' + face(id) + '</div>' +
      '<h2 id="ps-t">Passa il telefono al Giocatore ' + (i + 1) + '</h2><p>Tocca a ' + esc(C[id].name) + '. La mossa del Giocatore ' + (2 - i) + ' è già scelta e resta segreta.</p>' +
      '<button class="btn primary" type="button" id="ps-go">Sono il Giocatore ' + (i + 1) + '</button></div>';
    overlay.hidden = false;
    $('ps-go').addEventListener('click', function () { closeOverlay(); showPrompt(i); setPad(true, i); });
    setTimeout(function () { var b = $('ps-go'); if (b) b.focus(); }, 30);
  }

  /* =================== RESULT =================== */
  function bump(id, key) { var r = record.chars[id] || (record.chars[id] = { w: 0, l: 0 }); r[key]++; }
  function showResult() {
    var r = S.result, A = S.sides[0], B = S.sides[1];
    if (!S.recorded) {
      S.recorded = true;
      if (S.boss) {
        var x = record.exam[A.id] || (record.exam[A.id] = { p: 0, f: 0, best: null, lode: false });
        if (r === 'win' && S.winner === 0) {
          x.p++; bump(A.id, 'w');
          var g = S.grade, val = g.lode ? 31 : g.g, bestVal = x.best == null ? -1 : (x.lode ? 31 : x.best);
          if (val > bestVal) { x.best = g.g; x.lode = g.lode; }
        } else { x.f++; bump(A.id, 'l'); }
      } else if (r === 'win') { bump(S.sides[S.winner].id, 'w'); bump(S.sides[1 - S.winner].id, 'l'); }
      saveRecord(); renderLibretto();
    }
    var star, stamp, sub = '', first, second;
    if (S.boss) {
      star = A.id;
      stamp = r === 'win' && S.winner === 0 ? 'Superato' : r === 'time' ? 'Ritirato' : 'Bocciato';
      var won = r === 'win' && S.winner === 0;
      first = won ? [0, C[A.id].lines.win] : r === 'time' ? [1, C.esame.lines.time] : [0, C[A.id].lines.ko];
      second = won ? [1, C.esame.lines.ko] : r === 'time' ? (C[A.id].lines.time ? [0, C[A.id].lines.time] : null) : [1, C.esame.lines.win];
    } else if (r === 'win') {
      var w = S.sides[S.winner], l = S.sides[1 - S.winner];
      star = w.id;
      stamp = 'Vince ' + C[w.id].name;
      if (S.mode === 'pvp') sub = 'Giocatore ' + (S.winner + 1);
      else sub = S.winner === 0 ? 'Hai vinto' : 'Ha vinto il computer';
      first = [S.winner, C[w.id].lines.win]; second = [1 - S.winner, C[l.id].lines.ko];
    } else { star = A.id; stamp = 'Pareggio'; first = null; second = null; }
    var story = S.story, storyWon = !!story && r === 'win' && S.winner === 0;
    if (story && window.WORLD_COVI && window.WORLD_COVI[story.covo]) sub = window.WORLD_COVI[story.covo].name;
    var expr = r === 'win' ? (S.boss && S.winner === 1 ? 'sleepy' : 'cool') : 'worried';
    var gradeHtml = S.boss && S.grade ? '<div class="grade"><span>Voto</span><strong>' + (S.grade.lode ? '30 e lode' : S.grade.g + '/30') + '</strong></div>' : (sub ? '<div class="grade"><span>' + esc(sub) + '</span></div>' : '');
    var me = S.winner != null ? S.sides[S.winner].st : A.st;
    var h = '<div class="res" role="dialog" aria-modal="true" aria-labelledby="res-t" style="--tc:' + tc(star) + '">' +
      '<div class="res-art">' + bust(star, expr, '', '0 0 260 270') + '<div class="stamp" id="res-t">' + esc(stamp) + '</div>' + gradeHtml + '</div><div class="res-body">';
    [first, second].forEach(function (q) { if (q) h += '<p class="say"><small>' + esc(sideName(q[0])) + '</small>«' + esc(q[1]) + '»</p>'; });
    h += '<div class="res-stats"><div><span>Turni</span><strong>' + S.turn + '</strong></div><div><span>Danni</span><strong>' + me.dmg + '</strong></div><div><span>Critici</span><strong>' + me.crits + '</strong></div><div><span>Cure</span><strong>' + me.heals + '</strong></div></div>' +
      '<div class="res-actions">' + (story
        ? (storyWon ? '<button class="btn primary wide" type="button" id="st-go">Continua</button>'
          : '<button class="btn primary" type="button" id="st-retry">Riprova</button><button class="btn" type="button" id="st-go">Torna a ' + esc(storyCity(story)) + '</button>')
        : '<button class="btn primary" type="button" id="again">Rivincita</button><button class="btn" type="button" id="change">Cambia sfida</button><button class="btn wide" type="button" id="back">Torna ai personaggi</button>') +
      '</div></div></div>';
    overlay.className = 'overlay result';
    overlay.innerHTML = h;
    overlay.hidden = false;
    var cfg = { a: A.id, b: B.id, mode: S.mode, story: story, safe: S.safe };
    if (story) {
      $('st-go').addEventListener('click', function () { backToWorld(story, storyWon, false); });
      if ($('st-retry')) $('st-retry').addEventListener('click', function () { closeOverlay(); startBattle(cfg); });
      setTimeout(function () { var b = $('st-retry') || $('st-go'); if (b) b.focus(); }, 50);
      return;
    }
    $('again').addEventListener('click', function () { closeOverlay(); startBattle(cfg); });
    $('change').addEventListener('click', function () { goHome(); view.p1 = cfg.a; view.p2 = cfg.b; view.mode = cfg.mode; renderSetup(); });
    $('back').addEventListener('click', function () { closeOverlay(); goHome(); });
    setTimeout(function () { var b = $('again'); if (b) b.focus(); }, 50);
  }

  /* =================== IN-BATTLE SHEET =================== */
  function openSheet() {
    if (!S) return;
    var h = '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sh-t"><div class="sheet-h"><h2 id="sh-t">Scheda della lotta</h2><button class="tb-btn" type="button" id="sh-x">Chiudi</button></div>';
    [0, 1].forEach(function (i) {
      var c = C[S.sides[i].id];
      h += '<div class="card" style="--tc:' + TC[c.type] + '"><div class="block"><h3>' + esc(sideLabel(i) + ' · ' + c.name) + '</h3>';
      if (c.id === 'esame' && !S.sides[i].revealed) h += '<p class="unknown">Statistiche e mosse ancora sconosciute. Antonio può analizzarlo con Diagnosi Energetica; con gli altri lo scopri giocando.</p></div>';
      else {
        var st = c.stats;
        h += '<div class="mini-stats"><div><span>Vita</span><strong>' + st.hp + '</strong></div><div><span>Attacco</span><strong>' + st.atk + '</strong></div><div><span>Difesa</span><strong>' + st.def + '</strong></div><div><span>Velocità</span><strong>' + st.spe + '</strong></div></div></div>' + charBlocks(c);
      }
      h += '</div>';
    });
    h += '<div class="card"><div class="block"><h3>Tipi</h3><ul class="cycle-why">';
    E.TYPE_ORDER.forEach(function (t) { h += '<li>' + typeTag(t) + '<span>batte ' + E.TYPES[t].beats + ': ' + E.TYPES[t].why + '.</span></li>'; });
    h += '</ul></div></div></div>';
    overlay.className = 'overlay';
    overlay.innerHTML = h;
    overlay.hidden = false;
    $('sh-x').addEventListener('click', closeOverlay);
    setTimeout(function () { var b = $('sh-x'); if (b) b.focus(); }, 30);
  }
  function closeOverlay() { overlay.hidden = true; overlay.innerHTML = ''; overlay.className = 'overlay'; }
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay && !overlay.classList.contains('result') && !overlay.classList.contains('pass')) closeOverlay();
  });

  /* =================== NAVIGATION =================== */
  function startBattle(cfg, restore) {
    if (!restore) {
      var seed = (Date.now() ^ Math.floor(Math.random() * 4294967296)) >>> 0;
      S = E.newBattle({ a: cfg.a, b: cfg.b, mode: cfg.mode, seed: seed, safe: cfg.safe });
      S.story = cfg.story || null;
    }
    flow++;
    if (stopSay) stopSay();
    if (window.WORLD) window.WORLD.close();
    view.screen = 'battle';
    home.hidden = true; battle.hidden = false;
    document.body.classList.add('in-battle');
    window.scrollTo(0, 0);
    renderShell();
    uiHp = [S.sides[0].hp, S.sides[1].hp];
    shown.revealed = [true, S.mode === 'pvp' || S.sides[1].id !== 'esame' || S.sides[1].revealed];
    setHp(0, uiHp[0]); setHp(1, uiHp[1]);
    renderSync(E.snap(S));
    setPad(false, 0);
    runFlow();
  }
  function goHome() {
    flow++;
    if (stopSay) stopSay();
    tapHandler = null;
    view.screen = 'home';
    if (window.WORLD) window.WORLD.close();
    battle.hidden = true; battle.innerHTML = '';
    home.hidden = false;
    document.body.classList.remove('in-battle');
    closeOverlay();
    renderLibretto();
    renderStory();
  }
  /* a story battle is over (or abandoned): back to the map, where the covo reacts */
  function backToWorld(story, won, quit) {
    flow++;
    if (stopSay) stopSay();
    tapHandler = null;
    battle.hidden = true; battle.innerHTML = '';
    document.body.classList.remove('in-battle');
    closeOverlay();
    renderLibretto();
    S = null;
    if (window.WORLD) window.WORLD.afterBattle({ covo: story.covo, won: won, quit: !!quit });
    else goHome();
  }
  window.UI = {
    startBattle: startBattle, goHome: goHome, setScreen: function (s) { view.screen = s; },
    /* the computer's choice for the side that has to move, on a copy so the battle's dice stay untouched (playtests) */
    _debug: {
      suggest: function () { return S && S.phase === 'select' && needQ.length ? E.ai(JSON.parse(JSON.stringify(S)), needQ[0]) : null; },
      battle: function () { return S ? { a: S.sides[0].id, b: S.sides[1].id, story: S.story, safe: S.safe } : null; }
    }
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !overlay.hidden && !overlay.classList.contains('result') && !overlay.classList.contains('pass')) { closeOverlay(); return; }
    if (view.screen !== 'battle' || !overlay.hidden) return;
    if (e.key === ' ' || e.key === 'Enter') { if (tapHandler) { e.preventDefault(); advance(); } return; }
    if (/^[1-4]$/.test(e.key) && padOn) { var m = C[S.sides[padSide].id].moves[+e.key - 1]; if (m) onMove(m.id); }
  });

  /* =================== BOOT (keeps an open battle across updates) =================== */
  var hot = window.claude && window.claude.hot;
  if (hot && hot.snapshot) {
    hot.snapshot(function () {
      return { v: 2, view: view, battle: view.screen === 'battle' && S && S.phase !== 'over' ? JSON.parse(JSON.stringify(S)) : null };
    });
  }
  function start(data) {
    data = data || {};
    if (data.v === 2 && data.view) {
      ['sel', 'hero', 'mode', 'p1', 'p2'].forEach(function (k) { if (data.view[k]) view[k] = data.view[k]; });
      if (ROSTER.indexOf(view.sel) < 0) view.sel = 'antonio';
    }
    SPR.install();
    renderHome();
    if (data.v === 2 && data.view && data.view.screen === 'battle' && data.battle && data.battle.v === 2) {
      S = data.battle;
      if (S.phase === 'busy') S.phase = 'begin';
      startBattle(null, true);
    } else if (data.v === 2 && data.view && data.view.screen === 'world' && window.WORLD) window.WORLD.open(true);
  }
  if (hot && hot.ready) hot.ready(start); else start(hot && hot.data ? hot.data : {});
})();

