/* Story mode: a tile map seen from above. Antonio walks around, talks to people,
   enters the covi and challenges his friends; battles run on the existing engine (ui.js). */
(function () {
  'use strict';
  var A = window.WORLD_ART, MAPS = window.WORLD_MAPS, COVI = window.WORLD_COVI, GATES = window.WORLD_GATES;
  var E = window.ENGINE, C = E.CHARS, SPR = window.SPR, ITEMS = E.ITEMS;
  var T = A.T, KEY = 'lotte-tra-amici:storia:v1', STEP = 165, TURN_HOLD = 110, CH = 12;   /* CH: tiles per side of a cached piece of ground */
  var DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  var OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
  var reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  function dpr() { return Math.min(2, window.devicePixelRatio || 1); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function each(list, fn) { Array.prototype.forEach.call(list, fn); }
  function $(id) { return document.getElementById(id); }
  function tc(id) { return 'var(--t-' + C[id].type.toLowerCase() + ')'; }

  /* ---------- saved progress (this device only) ---------- */
  function blank() {
    var m = MAPS.formia;
    return { v: 1, map: 'formia', x: m.start[0], y: m.start[1], dir: m.start[2], badges: [], squad: ['antonio'], beaten: {}, seen: {}, found: {} };
  }
  function load() {
    try {
      var v = JSON.parse(window.localStorage.getItem(KEY) || 'null');
      if (v && v.v === 1 && MAPS[v.map] && v.squad && v.badges) {
        v.found = v.found || {};
        if (v.map === 'formia' && !v.seen.formia2) {   /* Formia was redrawn: start again from home, keep pins and squad */
          var m0 = MAPS.formia; v.x = m0.start[0]; v.y = m0.start[1]; v.dir = m0.start[2];
        }
        v.seen.formia2 = true;
        return v;
      }
    } catch (e) { /* storage unavailable */ }
    return blank();
  }
  function save() { try { window.localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ignore */ } }
  var st = load();

  /* ---------- maps ---------- */
  function key(x, y) { return x + ',' + y; }
  function prepare(id) {
    var m = MAPS[id];
    if (m._p) return m;
    m.id = id; m.city = m.city || id; m.h = m.rows.length; m.w = m.rows[0].length;
    m.cell = function (x, y) {
      if (x < 0 || y < 0 || x >= m.w || y >= m.h) return A.LEGEND.x;
      return A.LEGEND[m.rows[y][x]] || A.LEGEND['.'];
    };
    m.solid = new Uint8Array(m.w * m.h); m.at = {};
    var x, y;
    for (y = 0; y < m.h; y++) for (x = 0; x < m.w; x++) if (m.cell(x, y).solid) m.solid[y * m.w + x] = 1;
    var fill = function (o) { for (var yy = o.y; yy < o.y + o.h; yy++) for (var xx = o.x; xx < o.x + o.w; xx++) m.solid[yy * m.w + xx] = 1; };
    (m.buildings || []).forEach(function (b) {
      fill(b);
      m.at[key(b.door[0], b.door[1])] = { kind: 'door', b: b };
      if (b.to) m.solid[b.door[1] * m.w + b.door[0]] = 0;
    });
    (m.objects || []).forEach(function (o) {
      fill(o);
      (o.open || []).forEach(function (c0) { m.solid[(o.y + c0[1]) * m.w + o.x + c0[0]] = 0; });   /* an arch you can walk through */
    });
    (m.signs || []).forEach(function (s) { m.solid[s.y * m.w + s.x] = 1; m.at[key(s.x, s.y)] = { kind: 'sign', s: s }; });
    (m.warps || []).forEach(function (w) { m.at[key(w.x, w.y)] = { kind: 'warp', w: w }; });
    m.people = (m.npcs || []).map(function (n) { return { n: n, x: n.x, y: n.y, dir: n.dir || 'down' }; });
    m.items = m.items || []; m.areas = m.areas || [];
    /* a few gulls circle over open sea */
    var sea = [];
    for (y = 0; y < m.h; y++) for (x = 0; x < m.w; x++) { var L = m.cell(x, y); if (L.g === 'sea' && !L.deco && !L.obj) sea.push([x, y]); }
    m.gulls = [];
    for (var i = 0; !m.inside && sea.length > 20 && i < 5; i++) {
      var t0 = sea[Math.floor(A.hash(i, 7, 190) * sea.length)];
      m.gulls.push({ x: (t0[0] + 0.5) * T, y: (t0[1] + 0.5) * T, r: 26 + A.hash(i, 8, 191) * 40, sp: 0.00032 + A.hash(i, 9, 192) * 0.00028, ph: A.hash(i, 10, 193) * 6.28 });
    }
    m._p = true;
    return m;
  }
  function itemAt(m, x, y) { for (var i = 0; i < m.items.length; i++) { var it = m.items[i]; if (it.x === x && it.y === y && !st.found[it.id]) return it; } return null; }
  function allItems() { var out = []; Object.keys(MAPS).forEach(function (k) { (MAPS[k].items || []).forEach(function (it) { out.push(it); }); }); return out; }
  function foundItems() { return allItems().filter(function (it) { return st.found[it.id]; }); }
  function areaName() {
    if (M.inside) return M.name;
    for (var i = 0; i < M.areas.length; i++) { var a = M.areas[i]; if (st.x >= a.x && st.x < a.x + a.w && st.y >= a.y && st.y < a.y + a.h) return a.name; }
    return '';
  }
  function personAt(m, x, y) { for (var i = 0; i < m.people.length; i++) { var p = m.people[i]; if (p.x === x && p.y === y) return p; } return null; }
  function blocked(m, x, y) { return x < 0 || y < 0 || x >= m.w || y >= m.h || m.solid[y * m.w + x] === 1 || !!personAt(m, x, y) || !!itemAt(m, x, y); }
  function cityCovi(city) { return Object.keys(COVI).filter(function (k) { return COVI[k].city === city; }).map(function (k) { return COVI[k]; }); }
  function hasBadge(cv0) { return st.badges.indexOf(cv0.badge.id) >= 0; }

  /* ---------- drawing ---------- */
  /* DPR: device pixels per CSS pixel. Z: map zoom (big screens see the map larger). VS = DPR × Z: device pixels
     per map pixel on screen. RS: the resolution the cached pictures are painted at, the same as VS so zoomed
     tiles stay sharp, but at most 3 so a big map's ground stays a reasonable size in memory. */
  var DPR = dpr(), Z = 1, VS = DPR, RS = DPR, P = null, cache = { map: null, theme: '', chunks: {}, order: [], items: [] }, walkers = {}, sprites = {}, themeK = '', themeAt = 0, previewEl = null;
  /* how far above its footprint each kind of thing is drawn */
  var UP = { tower: T * 2.4, tomb: T * 1.9, house: T * 0.75, station: T * 0.75, circolo: T * 0.9, bar: T * 0.75, shop: T * 0.75, palazzo: T * 1.1,
    church: T * 2.15, octagon: T * 2.1, clocktower: T * 2.05, coni: T * 0.75, lido: T * 0.9, kiosk: T * 0.6, ferry: T * 0.75, cypress: T * 1.6,
    lifeguard: T * 1.4, ruins: T * 0.9, tunnel: T * 0.5, fountain: T * 0.5, car: T * 0.2, item: T * 0.4 };
  var UMBRELLAS = ['#ff8fc1', '#8fd0f6', '#ffd166'], BOATS = ['#ffffff', '#ffe9a8'];
  function themeKey() { return getComputedStyle(document.documentElement).getPropertyValue('--m-paper').trim() + '|' + RS; }
  /* the tall still things of a map, sorted by their bottom edge (the ground is painted in pieces, see chunk) */
  function sceneItems(m, P0, s) {
    var items = [], spr = {};
    var add = function (x, yb, sp, bob) { items.push({ x: x, yb: yb, spr: sp, bob: !!bob }); };
    for (var y = 0; y < m.h; y++) for (var x = 0; x < m.w; x++) {
      var L = m.cell(x, y);
      if (!L.obj) continue;
      var color = L.obj === 'umbrella' ? UMBRELLAS[(x + y) % 3] : L.obj === 'boat' ? BOATS[(x + y) % 2] : null, k = L.obj + (color || '');
      if (!spr[k]) spr[k] = A.paintObject(L.obj, P0, s, { color: color, up: UP[L.obj] });
      add(x * T, (y + 1) * T, spr[k], L.obj === 'boat');
    }
    (m.buildings || []).forEach(function (b) {
      add(b.x * T, (b.y + b.h) * T, A.paintObject(b.kind, P0, s, { w: b.w, h: b.h, up: UP[b.kind] || T, x: b.x, doorX: b.door[0], label: b.label, roof: b.roof, awning: b.awning }));
    });
    (m.objects || []).forEach(function (o) { add(o.x * T, (o.y + o.h) * T, A.paintObject(o.kind, P0, s, { w: o.w, h: o.h, up: UP[o.kind] || T, color: o.color }), o.bob); });
    if (m.signs && m.signs.length) {
      var sg = A.paintObject('sign', P0, s, {});
      m.signs.forEach(function (g) { add(g.x * T, (g.y + 1) * T, sg); });
    }
    items.sort(function (a, b) { return a.yb - b.yb; });
    return items;
  }
  function ensureCaches(now) {
    if (!themeK || now - themeAt > 500) { themeK = themeKey(); themeAt = now; }
    if (cache.map === M.id && cache.theme === themeK) return;
    P = A.palette();
    cache.items = sceneItems(M, P, RS); cache.chunks = {}; cache.order = []; sprites = {};
    cache.map = M.id; cache.theme = themeK;
  }
  /* the ground is painted in square pieces as they come into view, and the least recently used are dropped */
  function chunk(cx, cy) {
    var k = cx + ',' + cy, c0 = cache.chunks[k], i = cache.order.indexOf(k);
    if (c0) { if (i < cache.order.length - 1) { cache.order.splice(i, 1); cache.order.push(k); } return c0; }
    c0 = A.paintGround(M, P, RS, { x: cx * CH, y: cy * CH, w: Math.min(CH, M.w - cx * CH), h: Math.min(CH, M.h - cy * CH) });
    cache.chunks[k] = c0; cache.order.push(k);
    while (cache.order.length > 12) delete cache.chunks[cache.order.shift()];
    return c0;
  }
  function walkerFor(n, s) {
    var id = (n.person || ('npc' + n.seed)) + '@' + s;
    return walkers[id] || (walkers[id] = A.walker(n.person ? A.PEOPLE[n.person] : A.townsperson(n.seed), s));
  }
  function itemSprite(kind, s) {
    var id = kind + '@' + s;
    return sprites[id] || (sprites[id] = A.paintObject('item', P || A.palette(), s, { item: kind, up: UP.item }));
  }
  /* draws the sorted items and the moving things in one pass, so people walk behind trees and roofs */
  function drawSorted(c, items, people, s, view, now) {
    var k = 0;
    var person = function (e) {
      if (e.spr) { c.drawImage(e.spr.cv, e.x, e.yb - e.spr.h, e.spr.cv.width / s, e.spr.cv.height / s); return; }
      var img = e.w[e.d][e.f || 0]; c.drawImage(img, e.x, e.y - 12, img.width / s, img.height / s);
    };
    for (var n = 0; n < items.length; n++) {
      var it = items[n];
      while (k < people.length && people[k].yb <= it.yb) person(people[k++]);
      if (view && (it.x + it.spr.w < view.x || it.x > view.x + view.w || it.yb < view.y || it.yb - it.spr.h > view.y + view.h)) continue;
      var dy = it.bob && now && !reduced ? Math.sin(now / 650 + it.x * 0.037) * 1.5 : 0;
      c.drawImage(it.spr.cv, it.x, it.yb - it.spr.h + dy, it.spr.cv.width / s, it.spr.cv.height / s);
    }
    while (k < people.length) person(people[k++]);
  }

  /* ---------- DOM ---------- */
  var root, cv, ctx, dlg, dlgWho, dlgTxt, dlgOpts, built = false, M = null;
  var ARROW = { up: 'M6 15l6-6 6 6', down: 'M6 9l6 6 6-6', left: 'M15 6l-6 6 6 6', right: 'M9 6l6 6-6 6' };
  var DLABEL = { up: 'Su', down: 'Giù', left: 'Sinistra', right: 'Destra' };
  function build() {
    if (built) return;
    root = $('world');
    root.innerHTML =
      '<canvas id="wcv" role="img" aria-label="Mappa della città vista dall\'alto"></canvas>' +
      '<div class="whud"><span class="wplace" id="wplace"></span><span class="wbadges" id="wbadges"></span><button class="tb-btn" type="button" id="wmenu">Menu</button></div>' +
      '<div class="dialog wdialog" id="wdialog" hidden role="status" aria-live="polite"><span class="who" id="wwho" hidden></span><span class="txt" id="wtxt"></span><div class="wopts" id="wopts" hidden></div><span class="caret" aria-hidden="true"></span></div>' +
      '<div class="wpad" id="wpad"><div class="dpad" id="dpad" role="group" aria-label="Direzioni">' +
      ['up', 'left', 'right', 'down'].map(function (d) {
        return '<button type="button" data-d="' + d + '" aria-label="' + DLABEL[d] + '"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ARROW[d] + '"/></svg></button>';
      }).join('') +
      '</div><button class="abtn" type="button" id="wa" aria-label="Parla, leggi o conferma">A</button></div>' +
      '<p class="whint">Frecce o WASD per camminare · Invio per parlare · M per il menu</p>';
    cv = $('wcv'); ctx = cv.getContext('2d');
    dlg = $('wdialog'); dlgWho = $('wwho'); dlgTxt = $('wtxt'); dlgOpts = $('wopts');
    /* one pointer on the whole cross: sliding the thumb changes direction */
    var dp = $('dpad'), dpId = null, cur = null;
    var dirFrom = function (e) {
      var r = dp.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      if (dx * dx + dy * dy < 81) return cur;
      return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    };
    var setDir = function (d) {
      if (d === cur) return;
      if (cur) release(cur);
      cur = d;
      each(dp.querySelectorAll('button'), function (b) { b.classList.toggle('on', b.getAttribute('data-d') === d); });
      if (d) press(d);
    };
    dp.addEventListener('pointerdown', function (e) { e.preventDefault(); dpId = e.pointerId; try { dp.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } setDir(dirFrom(e)); });
    dp.addEventListener('pointermove', function (e) { if (e.pointerId === dpId) setDir(dirFrom(e)); });
    var end = function (e) { if (e.pointerId === dpId) { dpId = null; setDir(null); } };
    dp.addEventListener('pointerup', end); dp.addEventListener('pointercancel', end); dp.addEventListener('lostpointercapture', end);
    /* clicks without a pointer (keyboard, screen readers) take one step */
    each(dp.querySelectorAll('button'), function (b) {
      b.addEventListener('click', function (e) { if (e.detail === 0) { var d = b.getAttribute('data-d'); press(d); release(d); } });
    });
    var wa = $('wa');
    wa.addEventListener('pointerdown', function (e) { e.preventDefault(); interact(); });
    wa.addEventListener('click', function (e) { if (e.detail === 0) interact(); });
    $('wpad').addEventListener('contextmenu', function (e) { e.preventDefault(); });
    dlg.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('.wopts')) return; if (dialog) advance(); });
    cv.addEventListener('click', function () { if (dialog) advance(); });
    $('wmenu').addEventListener('click', openMenu);
    window.addEventListener('resize', resize);
    built = true;
  }
  /* light/dark switches and late fonts repaint the map and the home preview */
  (function listen() {
    var retheme = function () { themeAt = 0; if (previewEl && previewEl.isConnected) preview(previewEl); };
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', retheme); else if (mq.addListener) mq.addListener(retheme);
    }
    if (window.MutationObserver) new MutationObserver(retheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', function () { cache.map = null; retheme(); });
  })();
  function resize() {
    if (!root || root.hidden) return;
    DPR = dpr();
    var w = root.clientWidth, h = root.clientHeight;
    /* about 12 tiles on the short side: a phone sees the map at 1×, a laptop at 2× */
    Z = Math.round(Math.max(1, Math.min(2, Math.min(w, h) / (12 * T))) * 4) / 4;
    VS = DPR * Z; RS = Math.min(3, VS);
    cv.width = Math.max(1, Math.round(w * DPR)); cv.height = Math.max(1, Math.round(h * DPR));
    cv.style.width = w + 'px'; cv.style.height = h + 'px';
  }

  /* ---------- HUD ---------- */
  var lastPlace = '';
  function renderPlace() {
    var city = MAPS[M.city].name, a = areaName(), k = city + '|' + a;
    if (k === lastPlace) return;
    lastPlace = k;
    $('wplace').innerHTML = a ? '<small>' + esc(city) + '</small>' + esc(a) : esc(city);
  }
  function renderHud() {
    lastPlace = ''; renderPlace();
    $('wbadges').innerHTML = cityCovi(M.city).map(function (cv0) {
      var b = cv0.badge, got = hasBadge(cv0);
      return '<span title="' + esc(b.name + (got ? '' : ' (da conquistare)')) + '">' + A.badgeSVG({ color: b.color, mark: b.mark, earned: got }, 28) + '</span>';
    }).join('');
  }

  /* ---------- input ---------- */
  var held = null, pressedAt = 0, mover = null, parity = 0, busy = false, lastBump = '', walking = false;
  function press(d) {
    if (!running || dialog || busy) return;
    held = d; pressedAt = performance.now();
    if (mover) return;
    if (st.dir !== d) st.dir = d; else tryStep(d, pressedAt);
  }
  function release(d) { if (held === d) held = null; walking = false; lastBump = ''; }
  var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', W: 'up', S: 'down', A: 'left', D: 'right' };
  function overlayOpen() { var o = $('overlay'); return !!(o && !o.hidden); }
  /* registered before ui.js, so stopping here keeps the battle keys out of the map */
  document.addEventListener('keydown', function (e) {
    if (!running || overlayOpen() || e.ctrlKey || e.metaKey || e.altKey) return;
    var d = KEYMAP[e.key];
    if (d) { e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) press(d); return; }
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E' || e.key === 'z' || e.key === 'Z') {
      if (dialog && dialog.showingOpts) return;          /* the focused option button takes it */
      e.preventDefault(); e.stopImmediatePropagation(); if (!e.repeat) interact();
    } else if (e.key === 'm' || e.key === 'M' || e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); openMenu(); }
  });
  document.addEventListener('keyup', function (e) { var d = KEYMAP[e.key]; if (d) release(d); });

  /* ---------- movement ---------- */
  function tryStep(d, now) {
    var v = DV[d], nx = st.x + v[0], ny = st.y + v[1], k = key(nx, ny);
    if (blocked(M, nx, ny)) {
      var a = M.at[k];
      if (a && a.kind === 'door' && !a.b.to && lastBump !== k) { lastBump = k; held = null; useDoor(a.b); }
      return false;
    }
    lastBump = '';
    mover = { fx: st.x, fy: st.y, tx: nx, ty: ny, t0: now };
    parity ^= 1;
    return true;
  }
  function update(now) {
    if (mover) {
      if (now - mover.t0 < STEP) return;
      st.x = mover.tx; st.y = mover.ty; mover = null;
      walking = !!held;
      if (arrived()) return;
    }
    if (dialog || busy || !held) return;
    if (st.dir !== held) { st.dir = held; pressedAt = now; if (!walking) return; }
    if (!walking && now - pressedAt < TURN_HOLD) return;
    tryStep(held, now);
  }
  function arrived() {
    var a = M.at[key(st.x, st.y)];
    if (a && a.kind === 'door' && a.b.to) { warp(a.b.to, a.b.tx, a.b.ty, a.b.tdir); return true; }
    if (a && a.kind === 'warp') { warp(a.w.to, a.w.tx, a.w.ty, a.w.tdir); return true; }
    save(); renderPlace();
    return false;
  }
  function warp(to, x, y, dir) {
    busy = true; held = null; walking = false;
    root.classList.add('fade');
    setTimeout(function () {
      st.map = to; st.x = x; st.y = y; if (dir) st.dir = dir;
      M = prepare(to); save(); renderHud();
      root.classList.remove('fade');
      busy = false;
    }, reduced ? 0 : 190);
  }

  /* ---------- talking ---------- */
  var dialog = null, typeTimer = null;
  function say(lines, who, opts, done) {
    held = null; walking = false;
    dialog = { lines: [].concat(lines), i: 0, who: who, opts: opts, done: done, typing: false, showingOpts: false };
    show();
  }
  function show() {
    var d = dialog, line = d.lines[d.i];
    dlg.hidden = false;
    if (d.who) {
      var friend = !!C[d.who];
      dlgWho.hidden = false;
      dlgWho.textContent = friend ? C[d.who].name : d.who;
      dlgWho.style.setProperty('--tc', friend ? tc(d.who) : 'var(--t-none)');
    } else dlgWho.hidden = true;
    dlgOpts.hidden = true; dlgOpts.innerHTML = ''; d.showingOpts = false;
    dlg.classList.remove('wait');
    var full = d.who ? '«' + line + '»' : line, n = 0;
    clearTimeout(typeTimer);
    d.finish = function () {
      d.typing = false; dlgTxt.textContent = full;
      if (d.i === d.lines.length - 1 && d.opts) {
        d.showingOpts = true; dlgOpts.hidden = false;
        dlgOpts.innerHTML = d.opts.map(function (o, k) { return '<button class="btn' + (k === 0 ? ' primary' : '') + '" type="button" data-k="' + k + '">' + esc(o.label) + '</button>'; }).join('');
        each(dlgOpts.querySelectorAll('button'), function (b) {
          b.addEventListener('click', function () { if (dialog === d) closeDialog(d.opts[+b.getAttribute('data-k')].fn); });
        });
        var first = dlgOpts.querySelector('button'); if (first) first.focus();
      } else dlg.classList.add('wait');
    };
    if (reduced) { d.finish(); return; }
    d.typing = true; dlgTxt.textContent = '';
    (function step() {
      if (dialog !== d || !d.typing) return;
      n += 2; dlgTxt.textContent = full.slice(0, n);
      if (n >= full.length) d.finish(); else typeTimer = setTimeout(step, 20);
    })();
  }
  function advance() {
    var d = dialog;
    if (!d) return;
    if (d.typing) { clearTimeout(typeTimer); d.finish(); return; }
    if (d.showingOpts) return;
    if (d.i < d.lines.length - 1) { d.i++; show(); return; }
    closeDialog();
  }
  function closeDialog(next) {
    var d = dialog; dialog = null;
    clearTimeout(typeTimer);
    dlg.hidden = true; dlgOpts.hidden = true; dlgOpts.innerHTML = ''; dlg.classList.remove('wait');
    var fn = next || (d && d.done);
    if (fn) setTimeout(fn, 30);
  }
  function interact() {
    if (dialog) { advance(); return; }
    if (!running || mover || busy) return;
    var v = DV[st.dir], x = st.x + v[0], y = st.y + v[1];
    var p = personAt(M, x, y);
    if (!p && M.cell(x, y).reach) p = personAt(M, x + v[0], y + v[1]);   /* across a net or a counter */
    if (p) { talkTo(p); return; }
    var it = itemAt(M, x, y);
    if (it) { pickUp(it); return; }
    var a = M.at[key(x, y)];
    if (a && a.kind === 'sign') say(a.s.text);
    else if (a && a.kind === 'door') useDoor(a.b);
  }
  /* one of Antonio's lost things: picked up for good */
  function pickUp(it) {
    st.found[it.id] = true; save();
    var left = allItems().length - foundItems().length;
    say(['Hai ritrovato ' + ITEMS[it.move].name + '!', it.text,
      left ? 'Nelle lotte della Storia Antonio non ' + it.pron + ' perde più. ' + (left === 1 ? 'Ne manca ancora uno.' : 'Ne mancano ancora ' + left + '.')
        : 'Hai ritrovato tutto: nelle lotte della Storia Antonio non perde più niente.']);
  }
  function talkTo(p) {
    p.dir = OPP[st.dir];
    var n = p.n;
    if (n.covo) leaderTalk(n.covo);
    else if (n.gate) gateTalk(n.gate, n.name);
    else say(n.lines || ['…'], n.name);
  }
  function useDoor(b) {
    if (b.gate) gateTalk(b.gate);
    else if (b.msg) say(b.msg);
  }
  function gateTalk(g, who) {
    var G0 = GATES[g], need = cityCovi(G0.city), have = need.filter(hasBadge).length, city = MAPS[G0.city].name;
    if (have < need.length) say([G0.label + ' parte quando hai tutte le spille di ' + city + '.', 'Ne hai ' + have + ' su ' + need.length + '.'], who);
    else say(['Hai tutte le spille di ' + city + '!', G0.label + ' arriva con il prossimo aggiornamento del gioco.'], who);
  }

  /* ---------- covi ---------- */
  function leaderTalk(id) {
    var cv0 = COVI[id];
    if (st.beaten[id]) { say(cv0.after, cv0.leader); return; }
    say(cv0.intro, cv0.leader, [{ label: 'Sfida!', fn: function () { challenge(id); } }, { label: 'Più tardi', fn: null }]);
  }
  function challenge(id) {
    var cv0 = COVI[id], squad = st.squad.filter(function (x) { return x !== cv0.leader; });
    var safe = foundItems().map(function (it) { return it.move; });
    var go = function (who) { hide(); window.UI.startBattle({ a: who, b: cv0.leader, mode: 'cpu', story: { covo: id }, safe: safe }); };
    if (squad.length <= 1) go(squad[0] || 'antonio'); else pickFighter(squad, cv0, go);
  }
  function sheet(html, cls) {
    var o = $('overlay');
    o.className = 'overlay' + (cls ? ' ' + cls : ''); o.innerHTML = html; o.hidden = false;
    held = null; walking = false;
    return o;
  }
  function closeSheet() { var o = $('overlay'); o.hidden = true; o.innerHTML = ''; o.className = 'overlay'; }
  function face(id) { return SPR.person(id, 'smirk', '', SPR.thumb(id)); }
  function pickFighter(squad, cv0, go) {
    var L = C[cv0.leader], best = E.beaterOf(L.type);
    var o = sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="pf-t"><div class="sheet-h"><h2 id="pf-t">Chi mandi in campo?</h2><button class="tb-btn" type="button" id="pf-x">Annulla</button></div>' +
      '<p class="hint">' + esc(L.name) + ' è di tipo ' + esc(L.type) + ': ha il vantaggio chi è di tipo ' + esc(best) + '.</p><div class="pickgrid">' +
      squad.map(function (id) {
        return '<button class="pick" type="button" data-id="' + id + '" style="--tc:' + tc(id) + '"><span class="face">' + face(id) + '</span><span>' + esc(C[id].name) + '</span>' +
          (C[id].type === best ? '<small class="adv">Vantaggio</small>' : '') + '</button>';
      }).join('') + '</div></div>');
    $('pf-x').addEventListener('click', closeSheet);
    each(o.querySelectorAll('.pick'), function (b) { b.addEventListener('click', function () { closeSheet(); go(b.getAttribute('data-id')); }); });
    setTimeout(function () { var b = o.querySelector('.pick'); if (b) b.focus(); }, 30);
  }
  /* called by ui.js when a story battle ends */
  function afterBattle(res) {
    open(true);
    var cv0 = COVI[res.covo];
    if (!cv0) return;
    if (res.quit) { say(['Hai lasciato la lotta a metà. Puoi riprovare quando vuoi.']); return; }
    if (res.won && !st.beaten[res.covo]) {
      st.beaten[res.covo] = true;
      if (!hasBadge(cv0)) st.badges.push(cv0.badge.id);
      if (st.squad.indexOf(cv0.leader) < 0) st.squad.push(cv0.leader);
      save(); renderHud();
      say(cv0.win, cv0.leader, null, function () { award(cv0); });
    } else if (res.won) say(cv0.after, cv0.leader);
    else say(cv0.lose, cv0.leader);
  }
  function award(cv0) {
    var b = cv0.badge, L = C[cv0.leader];
    sheet('<div class="award" role="dialog" aria-modal="true" aria-labelledby="aw-t" style="--tc:' + tc(cv0.leader) + '">' +
      '<div class="award-badge">' + A.badgeSVG({ color: b.color, mark: b.mark }, 104) + '</div>' +
      '<h2 id="aw-t">Hai conquistato la ' + esc(b.name) + '</h2>' +
      '<div class="award-face">' + face(cv0.leader) + '</div>' +
      '<p>' + esc(L.name) + ' entra nella compagnia: da ora puoi mandarlo in campo nelle sfide.</p>' +
      '<button class="btn primary" type="button" id="aw-ok">Continua</button></div>', 'result');
    $('aw-ok').addEventListener('click', function () {
      closeSheet();
      if (cityCovi(cv0.city).every(hasBadge)) say(['Hai tutte le spille di ' + MAPS[cv0.city].name + '!', 'Il treno per Torino arriva con il prossimo aggiornamento del gioco.']);
    });
    setTimeout(function () { var bt = $('aw-ok'); if (bt) bt.focus(); }, 30);
  }

  /* ---------- menu ---------- */
  function openMenu() {
    if (!running || dialog || busy) return;
    var city = M.city;
    var badges = cityCovi(city).map(function (cv0) {
      var b = cv0.badge, got = hasBadge(cv0);
      return '<li class="' + (got ? 'got' : '') + '">' + A.badgeSVG({ color: b.color, mark: b.mark, earned: got }, 40) +
        '<span><b>' + esc(b.name) + '</b><small>' + esc(cv0.name) + ' · ' + esc(C[cv0.leader].name) + (got ? '' : ' · da conquistare') + '</small></span></li>';
    }).join('');
    sheet('<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="wm-t"><div class="sheet-h"><h2 id="wm-t">Storia · ' + esc(MAPS[city].name) + '</h2><button class="tb-btn" type="button" id="wm-x">Chiudi</button></div>' +
      '<div class="pickrow"><h3>Compagnia</h3><div class="pickgrid">' + st.squad.map(function (id) {
        return '<div class="pick" style="--tc:' + tc(id) + '"><span class="face">' + face(id) + '</span><span>' + esc(C[id].name) + '</span></div>';
      }).join('') + '</div></div>' +
      '<div class="pickrow"><h3>Spille</h3><ul class="wbadge-list">' + badges + '</ul></div>' +
      '<div class="pickrow"><h3>Oggetti ritrovati · ' + foundItems().length + ' su ' + allItems().length + '</h3><ul class="wbadge-list">' + allItems().map(function (it) {
        var got = !!st.found[it.id], nm = ITEMS[it.move].name;
        return '<li class="' + (got ? 'got' : '') + '">' + A.itemSVG(ITEMS[it.move].icon, got, 40) + '<span><b>' + esc(nm.charAt(0).toUpperCase() + nm.slice(1)) + '</b><small>' +
          esc(got ? it.text + ' Nelle lotte della Storia non si perde più.' : 'Perso da qualche parte in città.') + '</small></span></li>';
      }).join('') + '</ul></div>' +
      '<p class="hint">I progressi della storia restano su questo dispositivo.</p>' +
      '<div class="menu-actions"><button class="btn" type="button" id="wm-home">Torna alla schermata iniziale</button>' +
      '<button class="btn" type="button" id="wm-reset">Ricomincia la storia</button></div></div>');
    $('wm-x').addEventListener('click', closeSheet);
    $('wm-home').addEventListener('click', function () { closeSheet(); hide(); window.UI.goHome(); });
    var r = $('wm-reset'), armed = false;
    r.addEventListener('click', function () {
      if (!armed) { armed = true; r.textContent = 'Tocca ancora: cancella spille, compagnia e oggetti'; r.classList.add('danger'); return; }
      closeSheet();
      st = blank(); save();
      M = prepare(st.map); renderHud(); intro();
    });
    setTimeout(function () { var b = $('wm-x'); if (b) b.focus(); }, 30);
  }

  /* ---------- loop ---------- */
  var running = false, raf = 0, ME = { person: 'antonio' };
  function playerPx(now) {
    if (!mover) return { x: st.x * T, y: st.y * T, t: 0 };
    var t = Math.min(1, (now - mover.t0) / STEP);
    return { x: (mover.fx + (mover.tx - mover.fx) * t) * T, y: (mover.fy + (mover.ty - mover.fy) * t) * T, t: t };
  }
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    update(now);
    ensureCaches(now);
    /* everything below is in map units (one tile = T); VS turns them into canvas pixels */
    var W = cv.width, H = cv.height, vw = W / VS, vh = H / VS, mw = M.w * T, mh = M.h * T;
    var pp = playerPx(now), lift = (H / DPR > 600 ? 56 : 28) / Z;   /* the player sits a little above the middle, clear of the pad */
    var camX = mw <= vw ? (mw - vw) / 2 : Math.max(0, Math.min(mw - vw, pp.x + T / 2 - vw / 2));
    var camY = mh <= vh ? (mh - vh) / 2 : Math.max(0, Math.min(mh - vh, pp.y + T / 2 - vh / 2 + lift));
    camX = Math.round(camX * VS) / VS; camY = Math.round(camY * VS) / VS;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = M.inside ? P.stone2 : P.paper; ctx.fillRect(0, 0, W, H);   /* indoors, the outside is just wall */
    ctx.setTransform(VS, 0, 0, VS, -camX * VS, -camY * VS);
    var span = CH * T;
    for (var cy = Math.max(0, Math.floor(camY / span)); cy <= Math.min(Math.ceil(M.h / CH) - 1, Math.floor((camY + vh) / span)); cy++) {
      for (var cx = Math.max(0, Math.floor(camX / span)); cx <= Math.min(Math.ceil(M.w / CH) - 1, Math.floor((camX + vw) / span)); cx++) {
        ctx.drawImage(chunk(cx, cy), cx * span, cy * span, Math.min(CH, M.w - cx * CH) * T, Math.min(CH, M.h - cy * CH) * T);
      }
    }
    /* the sea moves a little */
    var x0 = Math.max(0, Math.floor(camX / T)), x1 = Math.min(M.w - 1, Math.ceil((camX + vw) / T));
    var y0 = Math.max(0, Math.floor(camY / T)), y1 = Math.min(M.h - 1, Math.ceil((camY + vh) / T));
    ctx.strokeStyle = P.foam; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.globalAlpha = 0.7;
    for (var ty = y0; ty <= y1; ty++) for (var tx = x0; tx <= x1; tx++) {
      var Lt = M.cell(tx, ty);
      if (Lt.g !== 'sea' || Lt.deco) continue;
      var ph = A.hash(tx, ty, 3) * 6.28 + (reduced ? 0 : now / 900), ox = Math.sin(ph) * 3, oy = A.hash(tx, ty, 4) * 12;
      ctx.beginPath(); ctx.moveTo(tx * T + 5 + ox, ty * T + 8 + oy); ctx.quadraticCurveTo(tx * T + 10 + ox, ty * T + 5 + oy, tx * T + 15 + ox, ty * T + 8 + oy); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    var people = M.people.map(function (p) {
      var idle = p.n.person ? 0 : ((Math.floor(now / 700 + A.hash(p.x, p.y, 9) * 6) % 7) === 0 ? 1 : 0);
      return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, RS), d: p.dir, f: reduced ? 0 : idle };
    });
    var step = mover && pp.t > 0.12 && pp.t < 0.88 ? (parity ? 1 : 2) : 0;
    people.push({ yb: pp.y + T + 0.5, x: pp.x, y: pp.y, w: walkerFor(ME, RS), d: st.dir, f: step });
    M.items.forEach(function (it) { if (!st.found[it.id]) people.push({ yb: (it.y + 1) * T, x: it.x * T, spr: itemSprite(ITEMS[it.move].icon, RS) }); });
    people.sort(function (a, b) { return a.yb - b.yb; });
    drawSorted(ctx, cache.items, people, RS, { x: camX, y: camY, w: vw, h: vh }, now);
    /* a glint on the lost things, gulls over the water */
    M.items.forEach(function (it) {
      if (st.found[it.id]) return;
      var tw = reduced ? 0.8 : 0.5 + 0.5 * Math.sin(now / 260 + it.x), gx = it.x * T + 25, gy = it.y * T - 4, r = 2 + tw * 3;
      ctx.globalAlpha = 0.4 + tw * 0.6; ctx.fillStyle = '#ffffff'; ctx.strokeStyle = '#1c2340'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(gx, gy - r * 1.8); ctx.lineTo(gx + r * 0.5, gy - r * 0.5); ctx.lineTo(gx + r * 1.8, gy); ctx.lineTo(gx + r * 0.5, gy + r * 0.5);
      ctx.lineTo(gx, gy + r * 1.8); ctx.lineTo(gx - r * 0.5, gy + r * 0.5); ctx.lineTo(gx - r * 1.8, gy); ctx.lineTo(gx - r * 0.5, gy - r * 0.5); ctx.closePath();
      ctx.fill(); ctx.stroke(); ctx.globalAlpha = 1;
    });
    M.gulls.forEach(function (gl) {
      var t1 = reduced ? gl.ph : gl.ph + now * gl.sp, x = gl.x + Math.cos(t1) * gl.r, y = gl.y + Math.sin(t1) * gl.r * 0.55;
      if (x < camX - 20 || x > camX + vw + 20 || y < camY - 20 || y > camY + vh + 20) return;
      var fl = reduced ? 0.5 : 0.5 + 0.5 * Math.sin(now / 140 + gl.ph * 9), wy = 2 + fl * 4;
      ctx.beginPath(); ctx.moveTo(x - 9, y - wy); ctx.quadraticCurveTo(x - 4, y - wy - 3, x, y); ctx.quadraticCurveTo(x + 4, y - wy - 3, x + 9, y - wy);
      ctx.strokeStyle = '#1c2340'; ctx.lineWidth = 3; ctx.stroke(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
    });
  }
  function start() { if (running) return; running = true; raf = requestAnimationFrame(frame); }
  function stop() { running = false; cancelAnimationFrame(raf); held = null; walking = false; }
  function hide() { stop(); if (dialog) closeDialog(function () {}); if (root) root.hidden = true; document.body.classList.remove('in-world'); }

  function intro() {
    st.seen.intro = true; save();
    say(['Formia, casa. Da qui parte il viaggio: Formia, poi Torino, poi Chicago.',
      'In città ci sono due covi: la Piazza del Comizio di Costanzo e il Circolo Tennis di Forchetta.',
      'Sfida gli amici nei loro covi: chi batti ti dà la sua spilla ed entra nella compagnia.',
      'E occhio: Antonio ha perso quattro cose in giro per Formia. Ritrovale e nelle lotte non le perderà più.']);
  }

  function open(quiet) {
    build();
    ['home', 'battle'].forEach(function (id) { var el = $(id); if (el) el.hidden = true; });
    document.body.classList.remove('in-battle'); document.body.classList.add('in-world');
    root.hidden = false;
    window.scrollTo(0, 0);
    if (window.UI && window.UI.setScreen) window.UI.setScreen('world');
    M = prepare(st.map);
    resize(); renderHud();
    var go = function () {
      cache.map = null; start();
      if (!quiet && !st.seen.intro) intro();
    };
    if (document.fonts && document.fonts.load) {
      var done = false, t = setTimeout(function () { if (!done) { done = true; go(); } }, 900);
      Promise.all([document.fonts.load('16px "Lilita One"'), document.fonts.load('16px "Patrick Hand"')])
        .catch(function () {}).then(function () { if (!done) { done = true; clearTimeout(t); go(); } });
    } else go();
  }

  /* a still picture of Formia for the home page: the square, Mola and the seafront */
  function preview(el) {
    if (!el) return;
    previewEl = el;
    var m = prepare('formia'), s = dpr(), P0 = A.palette(), mw = m.w * T, mh = m.h * T;
    var W = Math.max(200, el.clientWidth || 320), H = Math.max(100, el.clientHeight || 160), k = W < 420 ? 0.62 : 0.74;
    var c0 = document.createElement('canvas'), c = c0.getContext('2d');
    c0.width = Math.round(W * s); c0.height = Math.round(H * s);
    c0.setAttribute('aria-hidden', 'true');
    var sw = W / k, sh = H / k, fx = 23 * T, fy = 23.4 * T;
    var sx = Math.max(0, Math.min(mw - sw, fx - sw / 2)), sy = Math.max(0, Math.min(mh - sh, fy - sh / 2));
    var rx = Math.floor(sx / T), ry = Math.floor(sy / T), rect = { x: rx, y: ry, w: Math.min(m.w, Math.ceil((sx + sw) / T)) - rx, h: Math.min(m.h, Math.ceil((sy + sh) / T)) - ry };
    c.setTransform(s * k, 0, 0, s * k, -sx * s * k, -sy * s * k);
    c.drawImage(A.paintGround(m, P0, s, rect), rect.x * T, rect.y * T, rect.w * T, rect.h * T);
    var me = st.map === 'formia' ? st : { x: m.start[0], y: m.start[1], dir: m.start[2] };
    var people = m.people.map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s), d: p.dir }; });
    people.push({ yb: (me.y + 1) * T + 0.5, x: me.x * T, y: me.y * T, w: walkerFor(ME, s), d: me.dir });
    people.sort(function (a, b) { return a.yb - b.yb; });
    drawSorted(c, sceneItems(m, P0, s), people, s, { x: sx, y: sy, w: sw, h: sh }, 0);
    el.innerHTML = ''; el.appendChild(c0);
  }

  /* shortest walk to a tile, as a list of directions (used by the automated playtest) */
  function route(tx, ty) {
    var prev = {}, q = [[st.x, st.y]], seen = {};
    seen[key(st.x, st.y)] = 1;
    while (q.length) {
      var p = q.shift();
      if (p[0] === tx && p[1] === ty) {
        var out = [], k = key(tx, ty);
        while (prev[k]) { out.unshift(prev[k].d); k = prev[k].k; }
        return out;
      }
      ['up', 'down', 'left', 'right'].forEach(function (d) {
        var nx = p[0] + DV[d][0], ny = p[1] + DV[d][1], k2 = key(nx, ny), a = M.at[k2];
        if (seen[k2] || blocked(M, nx, ny)) return;
        if (a && (a.kind === 'warp' || a.kind === 'door') && !(nx === tx && ny === ty)) return;
        seen[k2] = 1; prev[k2] = { k: key(p[0], p[1]), d: d }; q.push([nx, ny]);
      });
    }
    return null;
  }

  window.WORLD = {
    open: open, close: hide, afterBattle: afterBattle, preview: preview,
    summary: function () {
      return {
        started: !!(st.seen.intro || st.badges.length), squad: st.squad.slice(), found: foundItems().length, items: allItems().length,
        badges: cityCovi('formia').map(function (cv0) { return { name: cv0.badge.name, color: cv0.badge.color, mark: cv0.badge.mark, earned: hasBadge(cv0) }; })
      };
    },
    state: function () { return JSON.parse(JSON.stringify(st)); },
    _debug: {
      route: route,
      /* where to stand, and which way to face, to talk to a person, read a sign, use a door or pick up a thing */
      spot: function (kind, id) {
        var t = null, list;
        if (kind === 'npc') { list = M.people.filter(function (q) { return q.n.id === id; }); if (list[0]) t = [list[0].x, list[0].y]; }
        else if (kind === 'item') { list = M.items.filter(function (q) { return q.id === id; }); if (list[0]) t = [list[0].x, list[0].y]; }
        else if (kind === 'door') { list = (M.buildings || []).filter(function (q) { return q.id === id; }); if (list[0]) t = list[0].door; }
        else if (kind === 'sign') { list = (M.signs || []).filter(function (q) { return q.text.join(' ').indexOf(id) >= 0; }); if (list[0]) t = [list[0].x, list[0].y]; }
        if (!t) return null;
        var best = null;
        ['up', 'down', 'left', 'right'].forEach(function (d) {
          for (var k = 1; k <= 2; k++) {
            var cx = t[0] - DV[d][0] * k, cy = t[1] - DV[d][1] * k;
            if (k === 2 && !M.cell(t[0] - DV[d][0], t[1] - DV[d][1]).reach) break;
            var here = cx === st.x && cy === st.y;
            if (!here && (blocked(M, cx, cy) || M.at[key(cx, cy)])) continue;
            var r = here ? [] : route(cx, cy);
            if (r && (!best || r.length < best.len)) best = { x: cx, y: cy, dir: d, len: r.length };
          }
        });
        return best;
      },
      area: function () { return areaName(); },
      /* the whole map as one picture, as a data URL */
      overview: function (id, s) {
        var m = prepare(id || 'formia'), P0 = A.palette(), c0 = document.createElement('canvas'), c = c0.getContext('2d');
        s = s || 1; c0.width = m.w * T * s; c0.height = m.h * T * s;
        c.setTransform(s, 0, 0, s, 0, 0);
        c.drawImage(A.paintGround(m, P0, s), 0, 0, m.w * T, m.h * T);
        var people = m.people.map(function (p) { return { yb: (p.y + 1) * T, x: p.x * T, y: p.y * T, w: walkerFor(p.n, s), d: p.dir }; });
        m.items.forEach(function (it) { if (!st.found[it.id]) people.push({ yb: (it.y + 1) * T, x: it.x * T, spr: A.paintObject('item', P0, s, { item: ITEMS[it.move].icon, up: UP.item }) }); });
        people.sort(function (a, b) { return a.yb - b.yb; });
        drawSorted(c, sceneItems(m, P0, s), people, s, null, 0);
        return c0.toDataURL('image/png');
      },
      pos: function () { return { map: st.map, x: st.x, y: st.y, dir: st.dir, running: running, moving: !!mover, busy: busy, dialog: !!dialog, opts: !!(dialog && dialog.showingOpts), text: dialog ? dlgTxt.textContent : '' }; }
    }
  };
})();

