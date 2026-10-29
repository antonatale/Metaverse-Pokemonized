/* World art: everything on the map is drawn in code with canvas 2D, once, then reused.
   Style: a map drawn in ballpoint on squared paper, coloured with highlighters.
   Map colours come from CSS tokens (--m-*), so the map follows light and dark mode;
   characters are fixed-colour "stickers" with a dark outline. */
(function (G) {
  'use strict';
  var T = 32;                       /* tile size in CSS px */
  var STICKER_INK = '#1c2340';

  function mk(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  /* rounded rectangle; keep = add to the current path instead of starting a new one */
  function rr(c, x, y, w, h, r, keep) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!keep) c.beginPath();
    c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
  }
  function hash(x, y, k) {
    var h = (x * 374761393 + y * 668265263 + (k || 0) * 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function fillStroke(c, fill, ink, lw) { if (fill) { c.fillStyle = fill; c.fill(); } if (ink) { c.strokeStyle = ink; c.lineWidth = lw || 1.6; c.stroke(); } }
  function circle(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
  function ell(c, x, y, rx, ry) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
  function poly(c, pts) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
  /* soft shapes made of circles: stroked wide first, then filled, so only the outer outline shows */
  function blobs(c, list, fill, ink, lw) {
    c.beginPath();
    list.forEach(function (b) { c.moveTo(b[0] + b[2], b[1]); c.arc(b[0], b[1], b[2], 0, Math.PI * 2); });
    if (ink) { c.strokeStyle = ink; c.lineWidth = (lw || 1.6) * 2; c.stroke(); }
    c.fillStyle = fill; c.fill();
  }
  /* a cream plaque with a name on it, as on the buildings */
  function plaque(c, P, txt, x, y, maxW, size) {
    size = size || 15;
    c.font = size + 'px "Lilita One", "Arial Rounded MT Bold", sans-serif';
    var tw = Math.min(maxW, c.measureText(txt).width + 14), hh = size + 3;
    rr(c, x - tw / 2, y - hh / 2, tw, hh, 3); fillStroke(c, '#fffdf6', P.ink, 1.5);
    c.fillStyle = '#1b1f2e'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y + 0.5, tw - 8);
  }
  /* a cylinder seen from the front, for towers and the tomb */
  function cylinder(c, P, x0, x1, top, bot, ry) {
    var cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
    c.beginPath(); c.moveTo(x0, top); c.lineTo(x0, bot); c.ellipse(cx, bot, rx, ry, 0, Math.PI, 0, true); c.lineTo(x1, top); c.closePath();
    var gr = c.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, P.stone2); gr.addColorStop(0.42, P.stone); gr.addColorStop(1, P.stone2);
    c.fillStyle = gr; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
    c.strokeStyle = P.stone2; c.lineWidth = 1;
    for (var y = top + 12; y < bot - 4; y += 10) { c.beginPath(); c.ellipse(cx, y, rx - 1, ry * 0.8, 0, 0.18, Math.PI - 0.18); c.stroke(); }
  }

  var KEYS = ['paper', 'grid', 'ink', 'grass', 'grass2', 'path', 'path2', 'road', 'road2', 'sand', 'sand2', 'sea', 'sea2', 'foam', 'wood', 'wood2', 'stone', 'stone2',
    'roof-a', 'roof-b', 'roof-c', 'roof-d', 'wall', 'leaf', 'leaf2', 'trunk', 'clay', 'line', 'hedge', 'flower-a', 'flower-b', 'shadow', 'label',
    'hill', 'hill2', 'rock', 'rock2', 'olive', 'track', 'far', 'far2'];
  function palette() {
    var cs = getComputedStyle(document.documentElement), P = {};
    KEYS.forEach(function (k) { P[k] = (cs.getPropertyValue('--m-' + k) || '').trim() || '#ff00ff'; });
    return P;
  }

  /* ---------- ground: what each map character is made of ---------- */
  var LEGEND = {
    '.': { g: 'grass' }, 'f': { g: 'grass', deco: 'flowers' }, ',': { g: 'path' }, '=': { g: 'road' }, ':': { g: 'sand' },
    '~': { g: 'sea', solid: true }, 'w': { g: 'pier' }, '_': { g: 'stone' }, 'c': { g: 'clay' }, 'F': { g: 'floor' }, 'D': { g: 'floor', deco: 'mat' },
    'x': { g: 'wall', solid: true }, 'r': { g: 'rail', solid: true },
    'T': { g: 'grass', obj: 'tree', solid: true }, 'p': { g: 'path', obj: 'palm', solid: true }, 'P': { g: 'sand', obj: 'palm', solid: true },
    '#': { g: 'grass', deco: 'hedge', solid: true }, 'b': { g: 'path', deco: 'bench', solid: true }, 'l': { g: 'path', obj: 'lamp', solid: true },
    'u': { g: 'sand', obj: 'umbrella', solid: true }, 'o': { g: 'sea', obj: 'boat', solid: true }, 'q': { g: 'path', deco: 'railing', solid: true },
    's': { g: 'stone', deco: 'stage', solid: true }, 'm': { g: 'stone', deco: 'stage', obj: 'mic', solid: true },
    'n': { g: 'clay', deco: 'net', solid: true, reach: true }, 'k': { g: 'floor', deco: 'counter', solid: true, reach: true },
    /* Formia, second edition: mountains, olive trees, cypresses, steps, cobbles, the old polygonal walls, rocks in the sea */
    'M': { g: 'hill', solid: true }, 'O': { g: 'grass', obj: 'olive', solid: true }, 'C': { g: 'grass', obj: 'cypress', solid: true },
    'H': { g: 'steps' }, 'v': { g: 'paving' }, 'W': { g: 'mura', solid: true }, 'R': { g: 'sea', deco: 'rocks', solid: true },
    'z': { g: 'road', deco: 'zebra' }, 'G': { g: 'far', solid: true }, 'B': { g: 'stone', deco: 'bench', solid: true },
    'L': { g: 'stone', obj: 'lamp', solid: true }, 'Y': { g: 'paving', obj: 'lamp', solid: true },
    'Q': { g: 'hill', obj: 'tree', solid: true }, 'J': { g: 'hill', obj: 'cypress', solid: true }
  };
  var GROUP = { grass: 'g', path: 'p', road: 'r', sand: 's', sea: 'w', pier: 'd', stone: 'st', steps: 'st', clay: 'c', floor: 'f', wall: 'x', rail: 'rl',
    hill: 'h', paving: 'pv', mura: 'mu', far: 'fr' };

  function groundFill(P, g) {
    return { grass: P.grass, path: P.path, road: P.road, sand: P.sand, sea: P.sea, pier: P.wood, stone: P.stone, steps: P.stone, clay: P.clay, floor: P.wood,
      wall: P.wall, rail: P.path2, hill: P.hill, paving: P.stone, mura: P.rock, far: P.far }[g] || P.paper;
  }

  /* one tile of ground with its texture */
  function tile(c, map, P, x, y) {
    var L = map.cell(x, y), X = x * T, Y = y * T, r = hash(x, y, 1), k;
    c.fillStyle = groundFill(P, L.g); c.fillRect(X, Y, T, T);
    if (L.g === 'grass') {
      c.strokeStyle = P.grass2; c.lineWidth = 1.4;
      for (k = 0; k < 3; k++) {
        var gx = X + 5 + hash(x, y, 10 + k) * 22, gy = Y + 8 + hash(x, y, 20 + k) * 18;
        c.beginPath(); c.moveTo(gx - 3, gy + 2); c.lineTo(gx - 1, gy - 2); c.moveTo(gx, gy + 2); c.lineTo(gx + 1, gy - 3); c.moveTo(gx + 3, gy + 2); c.lineTo(gx + 3.5, gy - 1.5); c.stroke();
      }
    } else if (L.g === 'path') {
      c.strokeStyle = P.path2; c.lineWidth = 1.2;
      for (k = 0; k < 3; k++) { var px = X + 4 + hash(x, y, 30 + k) * 22, py = Y + 4 + hash(x, y, 40 + k) * 22; rr(c, px, py, 6 + r * 3, 4 + r * 2, 2); c.stroke(); }
    } else if (L.g === 'road') {
      c.strokeStyle = P.road2; c.lineWidth = 1;
      c.beginPath(); c.moveTo(X + 4 + r * 10, Y + 9); c.lineTo(X + 9 + r * 10, Y + 9); c.moveTo(X + 16, Y + 22 + r * 4); c.lineTo(X + 23, Y + 22 + r * 4); c.stroke();
    } else if (L.g === 'sand') {
      c.fillStyle = P.sand2;
      for (k = 0; k < 6; k++) { circle(c, X + 3 + hash(x, y, 50 + k) * 26, Y + 3 + hash(x, y, 60 + k) * 26, 0.9); c.fill(); }
    } else if (L.g === 'stone') {
      c.strokeStyle = P.stone2; c.lineWidth = 1;
      c.strokeRect(X + 0.5, Y + 0.5, T - 1, T - 1);
      c.beginPath(); c.moveTo(X + 16, Y); c.lineTo(X + 16, Y + 16); c.moveTo(X, Y + 16); c.lineTo(X + T, Y + 16); c.stroke();
    } else if (L.g === 'pier' || L.g === 'floor') {
      c.strokeStyle = P.wood2; c.lineWidth = 1.2;
      for (k = 1; k < 4; k++) { c.beginPath(); c.moveTo(X, Y + k * 8); c.lineTo(X + T, Y + k * 8); c.stroke(); }
      c.beginPath(); c.moveTo(X + 6 + r * 18, Y + 8); c.lineTo(X + 6 + r * 18, Y + 16); c.moveTo(X + 20 - r * 12, Y + 16); c.lineTo(X + 20 - r * 12, Y + 24); c.stroke();
    } else if (L.g === 'wall') {
      c.fillStyle = P.stone; c.fillRect(X, Y + T - 8, T, 8);
      c.strokeStyle = P.stone2; c.lineWidth = 1;
      c.beginPath(); c.moveTo(X, Y + T - 8); c.lineTo(X + T, Y + T - 8); c.stroke();
    } else if (L.g === 'rail') {
      c.fillStyle = P.path; c.fillRect(X, Y, T, T);
      c.strokeStyle = P.wood2; c.lineWidth = 3;
      for (k = 0; k < 4; k++) { c.beginPath(); c.moveTo(X + 4 + k * 8, Y + 6); c.lineTo(X + 4 + k * 8, Y + 26); c.stroke(); }
      c.strokeStyle = P.ink; c.lineWidth = 2;
      c.beginPath(); c.moveTo(X, Y + 11); c.lineTo(X + T, Y + 11); c.moveTo(X, Y + 21); c.lineTo(X + T, Y + 21); c.stroke();
    } else if (L.g === 'sea') {
      c.fillStyle = P.sea2;
      if (r < 0.5) { ell(c, X + 8 + r * 16, Y + 20, 7, 1.6); c.fill(); }
    } else if (L.g === 'clay') {
      c.fillStyle = P.sand2;
      for (k = 0; k < 4; k++) { circle(c, X + 3 + hash(x, y, 70 + k) * 26, Y + 3 + hash(x, y, 80 + k) * 26, 0.7); c.fill(); }
    } else if (L.g === 'hill') {
      /* little "∧" marks, as a mountain is drawn on a hand-made map */
      c.strokeStyle = P.hill2; c.lineWidth = 1.4;
      for (k = 0; k < 2; k++) {
        var hx = X + 7 + hash(x, y, 110 + k) * 18, hy = Y + 9 + hash(x, y, 120 + k) * 15;
        c.beginPath(); c.moveTo(hx - 5, hy + 3); c.lineTo(hx, hy - 3); c.lineTo(hx + 5, hy + 3); c.stroke();
      }
      if (r < 0.2) { ell(c, X + 8 + r * 70, Y + 24, 3.6, 2.4); fillStroke(c, P.rock, P.ink, 1.1); }
    } else if (L.g === 'steps') {
      c.fillStyle = P.shadow;
      for (k = 1; k < 4; k++) c.fillRect(X + 1, Y + k * 8, T - 2, 2.5);
      c.strokeStyle = P.stone2; c.lineWidth = 1.2;
      for (k = 1; k < 4; k++) { c.beginPath(); c.moveTo(X + 1, Y + k * 8); c.lineTo(X + T - 1, Y + k * 8); c.stroke(); }
    } else if (L.g === 'paving') {
      /* sampietrini: rows of small square cobbles */
      c.strokeStyle = P.stone2; c.lineWidth = 0.9;
      for (var ry = 0; ry < 4; ry++) for (var rx = 0; rx < 5; rx++) c.strokeRect(X + rx * 8 - (ry % 2) * 4 + 1, Y + ry * 8 + 1, 6, 6);
    } else if (L.g === 'mura') {
      /* polygonal blocks, like the walls of ancient Formia */
      var j = function (a) { return (hash(x, y, a) - 0.5) * 6; };
      var m1 = [X + 15 + j(1), Y + 1], m2 = [X + 13 + j(2), Y + 15 + j(3)], m3 = [X + T - 1, Y + 17 + j(4)], m4 = [X + 18 + j(5), Y + T - 1];
      c.strokeStyle = P.rock2; c.lineWidth = 1.3;
      [[[X + 1, Y + 2], m1, m2, [X + 1, Y + 13]], [m1, [X + T - 1, Y + 3], m3, m2], [[X + 1, Y + 13], m2, m4, [X + 1, Y + T - 1]], [m2, m3, [X + T - 1, Y + T - 1], m4]]
        .forEach(function (pts) { poly(c, pts); c.stroke(); });
    }
    /* the squared paper shows through */
    c.strokeStyle = P.grid; c.lineWidth = 0.6; c.globalAlpha = 0.5;
    c.strokeRect(X + 0.3, Y + 0.3, T - 0.6, T - 0.6);
    c.globalAlpha = 1;
  }

  /* paints the static ground of a map, or of the part of it in rect (in tiles): ground, borders, low decorations.
     Tiles one step outside rect are painted too, so strokes that cross the edge of a piece match its neighbour. */
  function paintGround(map, P, s, rect) {
    var R = rect || { x: 0, y: 0, w: map.w, h: map.h };
    var cv = mk(R.w * T * s, R.h * T * s), c = cv.getContext('2d');
    c.scale(s, s); c.translate(-R.x * T, -R.y * T);
    c.lineCap = 'round'; c.lineJoin = 'round';
    c.fillStyle = P.paper; c.fillRect(R.x * T, R.y * T, R.w * T, R.h * T);
    var x0 = Math.max(0, R.x - 1), y0 = Math.max(0, R.y - 1), x1 = Math.min(map.w - 1, R.x + R.w), y1 = Math.min(map.h - 1, R.y + R.h), x, y, L;
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) tile(c, map, P, x, y);
    /* ballpoint outline wherever two kinds of ground meet (softer around faraway land) */
    c.lineWidth = 1.8;
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      var here = map.cell(x, y).g, g = GROUP[here], X2 = x * T, Y2 = y * T;
      if (x + 1 < map.w) {
        var right = map.cell(x + 1, y).g;
        if (GROUP[right] !== g) { c.strokeStyle = here === 'far' || right === 'far' ? P.far2 : P.ink; c.beginPath(); c.moveTo(X2 + T, Y2); c.lineTo(X2 + T, Y2 + T); c.stroke(); }
      }
      if (y + 1 < map.h) {
        var below = map.cell(x, y + 1).g;
        if (GROUP[below] !== g) {
          c.strokeStyle = here === 'far' || below === 'far' ? P.far2 : P.ink;
          c.beginPath(); c.moveTo(X2, Y2 + T); c.lineTo(X2 + T, Y2 + T); c.stroke();
          if (g === 's' && GROUP[below] === 'w') { /* foam on the shoreline */
            c.strokeStyle = P.foam; c.lineWidth = 2.4;
            c.beginPath(); c.moveTo(X2 + 2, Y2 + T + 4); c.quadraticCurveTo(X2 + 10, Y2 + T + 1, X2 + 16, Y2 + T + 4); c.quadraticCurveTo(X2 + 24, Y2 + T + 7, X2 + 30, Y2 + T + 4); c.stroke();
            c.lineWidth = 1.8;
          }
        }
      }
    }
    /* low decorations, drawn flat into the ground */
    for (y = y0; y <= y1; y++) for (x = x0; x <= x1; x++) {
      L = map.cell(x, y);
      if (L.deco) DECO[L.deco](c, x * T, y * T, P, x, y, map);
    }
    (map.groundObjects || []).forEach(function (o) {
      if (!GROUND_OBJ[o.kind]) return;
      if (o.w && o.h && (o.x > R.x + R.w + 1 || o.x + o.w < R.x - 1 || o.y > R.y + R.h + 1 || o.y + o.h < R.y - 1)) return;
      c.save(); GROUND_OBJ[o.kind](c, o, P); c.restore();
    });
    return cv;
  }

  var DECO = {
    flowers: function (c, X, Y, P, x, y) {
      for (var k = 0; k < 3; k++) {
        var fx = X + 6 + hash(x, y, 90 + k) * 20, fy = Y + 6 + hash(x, y, 95 + k) * 20, col = k % 2 ? P['flower-a'] : P['flower-b'];
        for (var a = 0; a < 5; a++) { circle(c, fx + Math.cos(a * 1.256) * 2.4, fy + Math.sin(a * 1.256) * 2.4, 1.7); c.fillStyle = col; c.fill(); }
        circle(c, fx, fy, 1.2); c.fillStyle = '#fff3a0'; c.fill();
      }
    },
    hedge: function (c, X, Y, P) {
      rr(c, X + 1, Y + 3, T - 2, T - 5, 9); fillStroke(c, P.hedge, P.ink, 1.6);
      c.fillStyle = P.leaf2;
      for (var k = 0; k < 3; k++) { circle(c, X + 8 + k * 8, Y + 12 + (k % 2) * 6, 2.6); c.fill(); }
    },
    bench: function (c, X, Y, P) {
      rr(c, X + 3, Y + 10, T - 6, 8, 2); fillStroke(c, P.wood, P.ink, 1.6);
      rr(c, X + 3, Y + 20, T - 6, 4, 1.5); fillStroke(c, P.wood2, P.ink, 1.4);
      c.strokeStyle = P.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(X + 6, Y + 24); c.lineTo(X + 6, Y + 29); c.moveTo(X + T - 6, Y + 24); c.lineTo(X + T - 6, Y + 29); c.stroke();
    },
    railing: function (c, X, Y, P) {
      c.strokeStyle = P.ink; c.lineWidth = 1.8;
      c.beginPath(); c.moveTo(X, Y + 12); c.lineTo(X + T, Y + 12); c.moveTo(X, Y + 20); c.lineTo(X + T, Y + 20); c.stroke();
      c.lineWidth = 2.4;
      c.beginPath(); c.moveTo(X + 6, Y + 8); c.lineTo(X + 6, Y + 24); c.moveTo(X + 22, Y + 8); c.lineTo(X + 22, Y + 24); c.stroke();
    },
    stage: function (c, X, Y, P) {
      c.fillStyle = P.wood; c.fillRect(X, Y + 4, T, T - 4);
      c.strokeStyle = P.wood2; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(X, Y + 14); c.lineTo(X + T, Y + 14); c.moveTo(X, Y + 22); c.lineTo(X + T, Y + 22); c.stroke();
      c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(X, Y + 4); c.lineTo(X + T, Y + 4); c.moveTo(X, Y + T); c.lineTo(X + T, Y + T); c.stroke();
    },
    net: function (c, X, Y, P) {
      c.fillStyle = 'rgba(28,35,64,.18)'; c.fillRect(X, Y + 14, T, 4);
      c.strokeStyle = P.ink; c.lineWidth = 1;
      for (var k = 0; k <= T; k += 4) { c.beginPath(); c.moveTo(X + k, Y + 6); c.lineTo(X + k, Y + 16); c.stroke(); }
      c.beginPath(); c.moveTo(X, Y + 11); c.lineTo(X + T, Y + 11); c.stroke();
      c.strokeStyle = '#ffffff'; c.lineWidth = 3; c.beginPath(); c.moveTo(X, Y + 6); c.lineTo(X + T, Y + 6); c.stroke();
      c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(X, Y + 4.5); c.lineTo(X + T, Y + 4.5); c.stroke();
    },
    counter: function (c, X, Y, P) {
      rr(c, X, Y + 6, T, T - 8, 2); fillStroke(c, P.wood, P.ink, 1.6);
      c.fillStyle = P.wood2; c.fillRect(X + 2, Y + 8, T - 4, 4);
    },
    mat: function (c, X, Y, P) {
      rr(c, X + 4, Y + 10, T - 8, 14, 3); fillStroke(c, P['roof-a'], P.ink, 1.4);
    },
    rocks: function (c, X, Y, P, x, y) {
      var n = 2 + Math.floor(hash(x, y, 130) * 2);
      for (var k = 0; k < n; k++) {
        var rx = X + 7 + hash(x, y, 131 + k) * 18, ry = Y + 10 + hash(x, y, 141 + k) * 14, s1 = 4 + hash(x, y, 151 + k) * 4;
        c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.arc(rx, ry + 1, s1 + 3, 0.25, Math.PI - 0.25); c.stroke();
        c.beginPath(); c.moveTo(rx - s1, ry + 2); c.quadraticCurveTo(rx - s1, ry - s1, rx, ry - s1); c.quadraticCurveTo(rx + s1 + 1, ry - s1 + 1, rx + s1, ry + 2); c.closePath();
        fillStroke(c, P.rock, P.ink, 1.4);
        c.strokeStyle = P.rock2; c.lineWidth = 1; c.beginPath(); c.moveTo(rx - s1 * 0.3, ry - s1 * 0.6); c.lineTo(rx + s1 * 0.2, ry); c.stroke();
      }
    },
    zebra: function (c, X, Y, P) {
      c.fillStyle = P.line;
      for (var k = 0; k < 3; k++) { rr(c, X + 4, Y + 3 + k * 10, T - 8, 5, 1); c.fill(); }
    }
  };

  /* flat things drawn into the ground: court lines, banners, the mountains, the running track, names written on the map */
  var GROUND_OBJ = {
    court: function (c, o, P) {
      var X = o.x * T + 6, Y = o.y * T + 6, W = o.w * T - 12, H = o.h * T - 12;
      c.strokeStyle = P.line; c.lineWidth = 2.6;
      c.strokeRect(X, Y, W, H);
      c.beginPath(); c.moveTo(X + W * 0.12, Y); c.lineTo(X + W * 0.12, Y + H); c.moveTo(X + W * 0.88, Y); c.lineTo(X + W * 0.88, Y + H); c.stroke();
      c.beginPath(); c.moveTo(X + W * 0.12, Y + H * 0.24); c.lineTo(X + W * 0.88, Y + H * 0.24); c.moveTo(X + W * 0.12, Y + H * 0.76); c.lineTo(X + W * 0.88, Y + H * 0.76);
      c.moveTo(X + W / 2, Y + H * 0.24); c.lineTo(X + W / 2, Y + H * 0.76); c.stroke();
    },
    scoreboard: function (c, o, P) {
      var X = o.x * T + 4, Y = o.y * T + 4, W = o.w * T - 8, H = T - 10;
      rr(c, X, Y, W, H, 3); fillStroke(c, '#20263a', P.ink, 1.6);
      c.fillStyle = '#ffd166'; c.font = '700 13px ui-monospace, Menlo, monospace'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(o.text || '15 – 0', X + W / 2, Y + H / 2 + 1);
    },
    banner: function (c, o, P) {
      var X = o.x * T + 2, Y = o.y * T + 2, W = o.w * T - 4, H = T - 12;
      c.beginPath(); c.moveTo(X, Y); c.lineTo(X + W, Y); c.lineTo(X + W, Y + H); c.lineTo(X + W / 2, Y + H + 4); c.lineTo(X, Y + H); c.closePath();
      fillStroke(c, o.color || P['roof-c'], P.ink, 1.6);
      c.fillStyle = '#1b1f2e'; c.font = '16px "Lilita One", "Arial Rounded MT Bold", sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(o.text, X + W / 2, Y + H / 2 + 1);
    },
    rug: function (c, o, P) {
      rr(c, o.x * T + 4, o.y * T + 4, o.w * T - 8, o.h * T - 8, 6); fillStroke(c, o.color || P['roof-b'], P.ink, 1.6);
    },
    /* a range of mountains (the Aurunci behind Formia), two rows of peaks */
    peaks: function (c, o, P) {
      var X = o.x * T, Y = o.y * T, W = o.w * T, H = o.h * T, base = Y + H - 3;
      c.beginPath(); c.rect(X, Y, W, H); c.clip();
      var n = Math.max(1, Math.round(o.w / 3.4)), step = W / n;
      for (var pass = 0; pass < 2; pass++) {
        for (var i = -1; i <= n; i++) {
          var cx = X + (i + (pass ? 0.5 : 0)) * step, ph = H * (pass ? 0.8 : 0.98) * (0.8 + hash(o.x * 7 + i, o.y, 160 + pass) * 0.2);
          var bw = step * (pass ? 0.72 : 0.62), top = base - ph;
          c.beginPath(); c.moveTo(cx - bw, base + 2); c.quadraticCurveTo(cx - bw * 0.3, top + ph * 0.22, cx - 3, top + 2); c.quadraticCurveTo(cx, top - 1.5, cx + 3, top + 2);
          c.quadraticCurveTo(cx + bw * 0.3, top + ph * 0.22, cx + bw, base + 2); c.closePath();
          c.fillStyle = pass ? P.hill : P.hill2; c.fill();
          c.save(); c.clip();
          c.fillStyle = pass ? P.hill2 : P.ink; c.globalAlpha = pass ? 0.75 : 0.08; c.fillRect(cx + 1, top - 2, bw + 2, ph + 6);
          c.restore();
          c.strokeStyle = P.ink; c.lineWidth = 1.7; c.stroke();
          if (pass) {
            c.lineWidth = 1; c.globalAlpha = 0.45;
            for (var k = 1; k < 4; k++) { c.beginPath(); c.moveTo(cx + 3 + k * 6, top + 6 + k * ph * 0.17); c.lineTo(cx + k * 6, top + 12 + k * ph * 0.17); c.stroke(); }
            c.globalAlpha = 1;
            /* scrub at the foot */
            c.fillStyle = P.leaf2;
            for (k = 0; k < 3; k++) { circle(c, cx - bw * 0.6 + k * bw * 0.55 + hash(i, k, 165) * 6, base - 5 - hash(i, k, 166) * 6, 2.4); c.fill(); }
          }
        }
      }
      if (o.village) { /* a hill village (Maranola) */
        var vx = X + o.village[0] * T, vy = Y + o.village[1] * T;
        for (var h = 0; h < 6; h++) {
          var hx = vx + (h % 3) * 11 - 4, hy = vy + Math.floor(h / 3) * 9 - (h % 3 === 1 ? 4 : 0);
          rr(c, hx, hy, 10, 8, 1); fillStroke(c, P.wall, P.ink, 1.1);
          poly(c, [[hx - 1, hy + 1], [hx + 5, hy - 4], [hx + 11, hy + 1]]); fillStroke(c, P['roof-a'], P.ink, 1.1);
        }
        rr(c, vx + 9, vy - 18, 5, 14, 1); fillStroke(c, P.wall, P.ink, 1.1);   /* bell tower */
        poly(c, [[vx + 8, vy - 17], [vx + 11.5, vy - 23], [vx + 15, vy - 17]]); fillStroke(c, P['roof-a'], P.ink, 1.1);
      }
    },
    /* the athletics track of the Olympic training centre */
    track: function (c, o, P) {
      var X = o.x * T + 4, Y = o.y * T + 4, W = o.w * T - 8, H = o.h * T - 8, rad = H / 2, lane = 13;
      rr(c, X, Y, W, H, rad); rr(c, X + lane * 2, Y + lane * 2, W - lane * 4, H - lane * 4, rad - lane * 2, true);
      c.fillStyle = P.track; c.fill('evenodd');
      c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
      c.strokeStyle = P.line; c.lineWidth = 1.2; c.globalAlpha = 0.9;
      rr(c, X + lane, Y + lane, W - lane * 2, H - lane * 2, rad - lane); c.stroke();
      c.globalAlpha = 1; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(X + W / 2, Y + 2); c.lineTo(X + W / 2, Y + lane * 2 - 2); c.stroke();
      c.fillStyle = P.ink; c.font = '12px "Patrick Hand", "Comic Sans MS", cursive'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.globalAlpha = 0.55; c.fillText('100 m', X + W / 2, Y + H - lane); c.globalAlpha = 1;
    },
    /* a name written on the map in ballpoint */
    text: function (c, o, P) {
      c.font = (o.size || 17) + 'px "Patrick Hand", "Chalkboard SE", "Comic Sans MS", cursive';
      c.fillStyle = P.ink; c.globalAlpha = o.alpha || 0.62; c.textAlign = o.align || 'left'; c.textBaseline = 'middle';
      c.translate(o.x * T, o.y * T + T / 2); if (o.rot) c.rotate(o.rot);
      c.fillText(o.text, 0, 0);
    },
    /* Gaeta across the gulf: soft colours, no hard outlines, it is far away */
    gaeta: function (c, o, P) {
      var X = o.x * T, Y = o.y * T, W = o.w * T, H = o.h * T;
      c.beginPath(); c.rect(X, Y, W, H); c.clip();
      blobs(c, [[X + W * 0.24, Y + H * 0.62, H * 0.5], [X + W * 0.08, Y + H * 0.8, H * 0.42], [X + W * 0.42, Y + H * 0.9, H * 0.34]], P.far2, null);
      c.fillStyle = P.leaf2; c.globalAlpha = 0.35;
      for (var k = 0; k < 7; k++) { circle(c, X + W * 0.1 + k * 14, Y + H * 0.42 + hash(k, 1, 171) * 22, 4); c.fill(); }
      c.globalAlpha = 1;
      for (k = 0; k < 10; k++) {
        var hx = X + W * 0.46 + (k % 5) * 15, hy = Y + 14 + Math.floor(k / 5) * 13 + hash(k, 2, 172) * 5;
        rr(c, hx, hy, 12, 10, 1); fillStroke(c, P.wall, P.far2, 1);
        c.fillStyle = P['roof-a']; c.globalAlpha = 0.7; c.fillRect(hx, hy, 12, 3); c.globalAlpha = 1;
      }
      rr(c, X + W * 0.8, Y + 8, 30, 18, 1); fillStroke(c, P.stone, P.far2, 1.2);   /* the castle */
      for (k = 0; k < 4; k++) { c.fillStyle = P.stone; c.fillRect(X + W * 0.8 + 1 + k * 8, Y + 4, 5, 5); c.strokeStyle = P.far2; c.strokeRect(X + W * 0.8 + 1 + k * 8, Y + 4, 5, 5); }
      rr(c, X + W * 0.72, Y - 2, 7, 28, 1); fillStroke(c, P.wall, P.far2, 1.1);   /* a bell tower */
      poly(c, [[X + W * 0.72 - 1, Y - 1], [X + W * 0.72 + 3.5, Y - 9], [X + W * 0.72 + 8, Y - 1]]); fillStroke(c, P.stone2, P.far2, 1.1);
      c.font = '20px "Patrick Hand", "Chalkboard SE", "Comic Sans MS", cursive'; c.fillStyle = P.ink; c.globalAlpha = 0.6; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('Gaeta', X + 14, Y + H - 22);
    }
  };

  /* ---------- tall objects: drawn sorted by their bottom edge, so people walk behind them ---------- */
  function paintObject(kind, P, s, opt) {
    opt = opt || {};
    var w = (opt.w || 1) * T, h = (opt.h || 1) * T, up = opt.up == null ? T : opt.up;
    var cv = mk(w * s, (h + up) * s), c = cv.getContext('2d');
    c.scale(s, s); c.translate(0, up); c.lineCap = 'round'; c.lineJoin = 'round';
    (OBJ[kind] || OBJ.box)(c, w, h, P, opt);
    return { cv: cv, w: w, h: h + up, up: up };
  }
  var OBJ = {
    tree: function (c, w, h, P) {
      ell(c, 16, 28, 11, 3.6); c.fillStyle = P.shadow; c.fill();
      rr(c, 13, 14, 6, 15, 2); fillStroke(c, P.trunk, P.ink, 1.6);
      blobs(c, [[9, 4, 9], [23, 4, 9], [16, -6, 11]], P.leaf, P.ink, 1.7);
      c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(6, 11); c.quadraticCurveTo(16, 15, 26, 11); c.stroke();
      c.fillStyle = P.leaf2; circle(c, 12, 0, 2.2); c.fill(); circle(c, 21, 5, 2.4); c.fill(); circle(c, 16, -9, 2); c.fill();
    },
    olive: function (c, w, h, P) {
      ell(c, 16, 28, 10, 3.4); c.fillStyle = P.shadow; c.fill();
      c.beginPath(); c.moveTo(13, 29); c.quadraticCurveTo(10, 21, 14.5, 13); c.lineTo(18.5, 13); c.quadraticCurveTo(15.5, 20, 20, 29); c.closePath();
      fillStroke(c, P.trunk, P.ink, 1.5);
      blobs(c, [[8, 7, 7.5], [16, 1, 9], [24.5, 6, 7.5], [16, 10, 7]], P.olive, P.ink, 1.6);
      c.fillStyle = P.leaf2; c.globalAlpha = 0.55;
      [[10, 4], [19, -2], [23, 8], [14, 10], [21, 4]].forEach(function (d) { ell(c, d[0], d[1], 2, 1.2); c.fill(); });
      c.fillStyle = '#ffffff'; c.globalAlpha = 0.35;
      [[12, 0], [21, 1], [8, 8]].forEach(function (d) { ell(c, d[0], d[1], 1.8, 1); c.fill(); });
      c.globalAlpha = 1;
    },
    cypress: function (c, w, h, P) {
      ell(c, 16, 29, 7.5, 2.6); c.fillStyle = P.shadow; c.fill();
      rr(c, 14.5, 21, 3, 8, 1); fillStroke(c, P.trunk, P.ink, 1.3);
      c.beginPath(); c.moveTo(16, -T * 1.42); c.bezierCurveTo(23, -T * 0.9, 25, 6, 16, 24); c.bezierCurveTo(7, 6, 9, -T * 0.9, 16, -T * 1.42); c.closePath();
      fillStroke(c, P.leaf2, P.ink, 1.6);
      c.strokeStyle = P.leaf; c.lineWidth = 1.1; c.globalAlpha = 0.85;
      for (var k = 0; k < 6; k++) { var yy = -T * 1.1 + k * 9, ww = 2.5 + Math.min(k, 6 - k) * 1.1; c.beginPath(); c.moveTo(16 - ww, yy + 3); c.quadraticCurveTo(16, yy, 16 + ww, yy + 3); c.stroke(); }
      c.globalAlpha = 1;
    },
    palm: function (c, w, h, P) {
      ell(c, 16, 28, 9, 3); c.fillStyle = P.shadow; c.fill();
      c.beginPath(); c.moveTo(14, 28); c.quadraticCurveTo(11, 10, 16, -6); c.lineTo(19, -6); c.quadraticCurveTo(15, 10, 19, 28); c.closePath();
      fillStroke(c, P.trunk, P.ink, 1.6);
      c.strokeStyle = P.ink; c.lineWidth = 1; for (var k = 0; k < 5; k++) { c.beginPath(); c.moveTo(13 + k * 0.5, 22 - k * 6); c.lineTo(18.5 - k * 0.2, 21 - k * 6); c.stroke(); }
      var fronds = [[-14, -2], [-10, -14], [2, -20], [16, -14], [18, -2], [4, 2]];
      fronds.forEach(function (f) {
        c.beginPath(); c.moveTo(17, -8); c.quadraticCurveTo(17 + f[0] * 0.5, -8 + f[1] * 0.9 - 6, 17 + f[0], -8 + f[1]);
        c.quadraticCurveTo(17 + f[0] * 0.55, -8 + f[1] * 0.5, 17, -6); c.closePath();
        fillStroke(c, P.leaf, P.ink, 1.4);
      });
      c.fillStyle = P.trunk; circle(c, 17, -7, 2.4); c.fill();
    },
    lamp: function (c, w, h, P) {
      ell(c, 16, 28, 6, 2); c.fillStyle = P.shadow; c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(16, 28); c.lineTo(16, -6); c.stroke();
      c.lineWidth = 1.6; c.beginPath(); c.moveTo(16, -6); c.quadraticCurveTo(16, -12, 22, -12); c.stroke();
      rr(c, 19, -12, 8, 7, 2); fillStroke(c, '#ffe9a8', P.ink, 1.6);
    },
    umbrella: function (c, w, h, P, o) {
      ell(c, 16, 26, 12, 4); c.fillStyle = P.shadow; c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(16, 26); c.lineTo(16, 0); c.stroke();
      c.beginPath(); c.moveTo(1, 4); c.quadraticCurveTo(16, -16, 31, 4); c.closePath();
      fillStroke(c, o.color || P['roof-a'], P.ink, 1.6);
      c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(11, 4); c.quadraticCurveTo(16, -12, 21, 4); c.closePath(); c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(11, 4); c.quadraticCurveTo(16, -12, 21, 4); c.stroke();
    },
    boat: function (c, w, h, P, o) {
      c.strokeStyle = P.foam; c.lineWidth = 2; c.beginPath(); c.moveTo(0, 22); c.quadraticCurveTo(16, 31, 32, 22); c.stroke();
      c.beginPath(); c.moveTo(2, 14); c.lineTo(30, 14); c.quadraticCurveTo(28, 26, 16, 27); c.quadraticCurveTo(4, 26, 2, 14); c.closePath();
      fillStroke(c, o.color || '#ffffff', P.ink, 1.7);
      c.fillStyle = P['roof-b']; c.fillRect(4, 16, 24, 3);
      c.strokeStyle = P.ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(16, 14); c.lineTo(16, -6); c.stroke();
      c.beginPath(); c.moveTo(17, -5); c.lineTo(27, 10); c.lineTo(17, 10); c.closePath(); fillStroke(c, '#fffaf0', P.ink, 1.4);
    },
    mic: function (c, w, h, P) {
      c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.moveTo(16, 24); c.lineTo(16, 4); c.moveTo(11, 26); c.lineTo(16, 24); c.lineTo(21, 26); c.stroke();
      rr(c, 13, -4, 6, 9, 3); fillStroke(c, '#30323a', P.ink, 1.4);
    },
    box: function (c, w, h, P) { rr(c, 2, 2, w - 4, h - 4, 3); fillStroke(c, P.stone, P.ink, 1.6); },
    sign: function (c, w, h, P) {
      ell(c, 16, 29, 7, 2.4); c.fillStyle = P.shadow; c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(16, 29); c.lineTo(16, 12); c.stroke();
      rr(c, 4, -2, 24, 16, 2.5); fillStroke(c, P.wood, P.ink, 1.7);
      c.strokeStyle = P.wood2; c.lineWidth = 1.4;
      c.beginPath(); c.moveTo(8, 3); c.lineTo(24, 3); c.moveTo(8, 8); c.lineTo(20, 8); c.stroke();
    },
    /* the ferry to Ponza and Ventotene, moored at the pier */
    ferry: function (c, w, h, P) {
      rr(c, 0, 36, w, 56, 26); c.strokeStyle = P.foam; c.lineWidth = 3; c.stroke();
      c.beginPath(); c.moveTo(4, 40); c.lineTo(w - 30, 40); c.quadraticCurveTo(w - 2, 44, w - 3, 62); c.quadraticCurveTo(w - 5, 84, w - 32, 88); c.lineTo(8, 88); c.quadraticCurveTo(1, 64, 4, 40); c.closePath();
      c.fillStyle = '#fbfbf7'; c.fill();
      c.save(); c.clip(); c.fillStyle = P['roof-b']; c.fillRect(0, 68, w, 9); c.fillStyle = '#d14b3a'; c.fillRect(0, 77, w, 12); c.restore();
      c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
      c.fillStyle = '#ffffff'; c.font = '700 9px ui-monospace, Menlo, monospace'; c.textAlign = 'left'; c.textBaseline = 'middle';
      c.fillText('FORMIA · PONZA · VENTOTENE', 14, 73);
      rr(c, 12, 46, w - 52, 19, 4); fillStroke(c, '#e7ebf0', P.ink, 1.3);
      rr(c, 26, 50, 20, 8, 3); fillStroke(c, '#ff9a3c', P.ink, 1.2);
      rr(c, 60, 50, 20, 8, 3); fillStroke(c, '#ff9a3c', P.ink, 1.2);
      rr(c, 22, 10, 78, 38, 5); fillStroke(c, '#ffffff', P.ink, 1.6);
      for (var k = 0; k < 6; k++) { rr(c, 28 + k * 12, 18, 8, 7, 2); fillStroke(c, '#bfe3ff', P.ink, 1); }
      c.fillStyle = P['roof-b']; c.fillRect(28, 32, 66, 3);
      rr(c, 86, -4, 30, 24, 4); fillStroke(c, '#ffffff', P.ink, 1.6);
      rr(c, 90, 2, 22, 7, 2); fillStroke(c, '#20263a', P.ink, 1);
      rr(c, 46, -16, 16, 28, 3); fillStroke(c, '#ffd166', P.ink, 1.5);
      c.fillStyle = '#20263a'; c.fillRect(46.8, -15.2, 14.4, 5);
      c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(w - 40, 40); c.lineTo(w - 40, 24); c.stroke();
      poly(c, [[w - 40, 24], [w - 28, 27], [w - 40, 31]]); fillStroke(c, '#57c968', P.ink, 1);
    },
    /* Torre di Castellone: octagonal, 14th century */
    octagon: function (c, w, h, P) {
      var top = -T * 1.9, bot = h - 6, xl = 8, xr = w - 8, f = 11;
      ell(c, w / 2, bot, w / 2 - 2, 6); c.fillStyle = P.shadow; c.fill();
      poly(c, [[xl, top + 12], [xl + f, top + 8], [xr - f, top + 8], [xr, top + 12], [xr, bot], [xr - f, bot + 4], [xl + f, bot + 4], [xl, bot]]);
      fillStroke(c, P.stone, P.ink, 1.8);
      c.fillStyle = P.stone2; poly(c, [[xl, top + 12], [xl + f, top + 8], [xl + f, bot + 4], [xl, bot]]); c.fill();
      c.globalAlpha = 0.6; poly(c, [[xr - f, top + 8], [xr, top + 12], [xr, bot], [xr - f, bot + 4]]); c.fill(); c.globalAlpha = 1;
      c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(xl + f, top + 8); c.lineTo(xl + f, bot + 4); c.moveTo(xr - f, top + 8); c.lineTo(xr - f, bot + 4); c.stroke();
      c.strokeStyle = P.stone2; c.lineWidth = 1;
      for (var y = top + 20; y < bot - 4; y += 9) { c.beginPath(); c.moveTo(xl + f + 2, y + 1); c.lineTo(xr - f - 2, y + 1); c.stroke(); }
      var mw = (xr - xl - 4) / 5;
      for (var k = 0; k < 5; k++) { rr(c, xl + 2 + k * mw, top - 2, mw - 3, 11, 1); fillStroke(c, P.stone, P.ink, 1.4); }
      c.fillStyle = '#20263a'; rr(c, w / 2 - 2, top + 22, 4, 12, 2); c.fill(); rr(c, w / 2 - 2, top + 44, 4, 10, 2); c.fill();
      rr(c, w / 2 - 6, bot - 16, 12, 18, 6); fillStroke(c, P.wood, P.ink, 1.4);
    },
    /* Porta degli Spagnoli with the Torre dell'Orologio: the arch is cut out, so people show through it */
    clocktower: function (c, w, h, P) {
      var gateTop = h - 46, ax = w / 2, aw = 28, atop = h - 34;
      ell(c, w / 2, h - 2, w / 2, 5); c.fillStyle = P.shadow; c.fill();
      c.beginPath(); c.rect(0, gateTop, w, h - gateTop - 1);
      c.moveTo(ax - aw / 2, h - 1); c.lineTo(ax - aw / 2, atop + aw / 2); c.arc(ax, atop + aw / 2, aw / 2, Math.PI, 0); c.lineTo(ax + aw / 2, h - 1); c.closePath();
      c.fillStyle = P.rock; c.fill('evenodd'); c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
      c.strokeStyle = P.rock2; c.lineWidth = 1.1;
      [[4, gateTop + 14, 26, gateTop + 12], [8, gateTop + 30, 30, gateTop + 28], [w - 28, gateTop + 12, w - 4, gateTop + 15], [w - 30, gateTop + 29, w - 6, gateTop + 31]]
        .forEach(function (l) { c.beginPath(); c.moveTo(l[0], l[1]); c.lineTo(l[2], l[3]); c.stroke(); });
      var tx0 = 26, tx1 = w - 26, ttop = -T * 1.7;
      rr(c, tx0, ttop, tx1 - tx0, gateTop - ttop + 2, 2); fillStroke(c, P.stone, P.ink, 1.8);
      for (var k = 0; k < 4; k++) { rr(c, tx0 + 1 + k * 11, ttop - 8, 8, 10, 1); fillStroke(c, P.stone, P.ink, 1.3); }
      var cx = w / 2, cy = ttop + 20;
      circle(c, cx, cy, 12); fillStroke(c, '#3f7ccf', P.ink, 1.5);
      circle(c, cx, cy, 8.5); fillStroke(c, '#fffdf6', P.ink, 1);
      c.fillStyle = '#ffd166'; for (var a = 0; a < 12; a++) { circle(c, cx + Math.cos(a * Math.PI / 6) * 10.3, cy + Math.sin(a * Math.PI / 6) * 10.3, 1.2); c.fill(); }
      c.strokeStyle = '#1c2340'; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx, cy - 6); c.moveTo(cx, cy); c.lineTo(cx + 4.5, cy + 1); c.stroke();
      rr(c, cx - 4, ttop + 38, 8, 11, 4); c.fillStyle = '#20263a'; c.fill();
    },
    church: function (c, w, h, P, o) {
      var wallTop = T * 0.55, dx = (o.doorX - o.x) * T, bx = w - 30, btop = -T * 1.5, nw = bx + 2;
      ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
      rr(c, bx, btop + 10, 24, h - btop - 12, 2); fillStroke(c, P.wall, P.ink, 1.7);
      rr(c, bx + 6, btop + 18, 12, 15, 6); fillStroke(c, '#20263a', P.ink, 1.2);
      circle(c, bx + 12, btop + 29, 3.2); c.fillStyle = '#ffd166'; c.fill();
      poly(c, [[bx - 2, btop + 11], [bx + 12, btop - 6], [bx + 26, btop + 11]]); fillStroke(c, P['roof-a'], P.ink, 1.6);
      c.strokeStyle = P.ink; c.lineWidth = 1.7; c.beginPath(); c.moveTo(bx + 12, btop - 6); c.lineTo(bx + 12, btop - 17); c.moveTo(bx + 8, btop - 13); c.lineTo(bx + 16, btop - 13); c.stroke();
      rr(c, 3, wallTop, nw - 3, h - wallTop - 2, 2); fillStroke(c, P.wall, P.ink, 1.8);
      poly(c, [[0, wallTop + 4], [nw / 2 + 1, -T * 0.6], [nw + 2, wallTop + 4]]); fillStroke(c, P['roof-a'], P.ink, 1.8);
      poly(c, [[10, wallTop + 1], [nw / 2 + 1, -T * 0.3], [nw - 8, wallTop + 1]]); fillStroke(c, P.wall, P.ink, 1.2);
      var rx = nw / 2 + 1, ry = wallTop + 13;
      circle(c, rx, ry, 8); fillStroke(c, '#bfe3ff', P.ink, 1.4);
      c.strokeStyle = P.ink; c.lineWidth = 0.9;
      for (var k = 0; k < 8; k++) { c.beginPath(); c.moveTo(rx, ry); c.lineTo(rx + Math.cos(k * Math.PI / 4) * 8, ry + Math.sin(k * Math.PI / 4) * 8); c.stroke(); }
      [10, nw - 20].forEach(function (sx) { if (Math.abs(sx + 5 - (dx + T / 2)) > 18) { rr(c, sx, h - T - 4, 10, 18, 5); fillStroke(c, '#bfe3ff', P.ink, 1.2); } });
      rr(c, dx + 8, h - T + 1, T - 16, T - 4, 7); fillStroke(c, P.wood, P.ink, 1.5);
      rr(c, dx + 3, h - 5, T - 6, 4, 1); fillStroke(c, P.stone, P.ink, 1);
    },
    /* the town hall, with the archaeological museum in one wing */
    palazzo: function (c, w, h, P, o) {
      var wallTop = T * 0.25, dx = (o.doorX - o.x) * T;
      ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
      rr(c, 2, wallTop, w - 4, h - wallTop - 2, 2); fillStroke(c, P.wall, P.ink, 1.8);
      poly(c, [[-2, wallTop + 4], [8, -T * 0.75], [w - 8, -T * 0.75], [w + 2, wallTop + 4]]); fillStroke(c, P['roof-a'], P.ink, 1.8);
      c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.35;
      for (var y = -T * 0.75 + 7; y < wallTop; y += 7) { c.beginPath(); c.moveTo(6, y); c.lineTo(w - 6, y); c.stroke(); }
      c.globalAlpha = 1;
      rr(c, -1, wallTop - 1, w + 2, 6, 1); fillStroke(c, P.stone, P.ink, 1.3);
      var n = Math.max(3, Math.round(w / 34));
      for (var k = 0; k < n; k++) {
        var wx = 12 + k * ((w - 24 - 14) / (n - 1));
        if (Math.abs(wx + 7 - (dx + T / 2)) < 24) continue;
        rr(c, wx, wallTop + 14, 14, 22, 2); fillStroke(c, '#bfe3ff', P.ink, 1.3);
        c.fillStyle = '#6fb387'; c.fillRect(wx - 4.5, wallTop + 14, 4, 22); c.fillRect(wx + 14.5, wallTop + 14, 4, 22);
        c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(wx - 4.5, wallTop + 14, 4, 22); c.strokeRect(wx + 14.5, wallTop + 14, 4, 22);
      }
      rr(c, dx + 3, h - T - 8, T - 6, T + 6, 13); fillStroke(c, P.wood, P.ink, 1.6);
      c.strokeStyle = P.wood2; c.lineWidth = 1.2; c.beginPath(); c.moveTo(dx + T / 2, h - T + 4); c.lineTo(dx + T / 2, h - 3); c.stroke();
      rr(c, dx - 8, h - T - 16, T + 16, 6, 2); fillStroke(c, P.stone, P.ink, 1.3);
      c.strokeStyle = P.ink; c.lineWidth = 1.5; c.beginPath(); c.moveTo(dx + T + 6, h - T - 14); c.lineTo(dx + T + 6, h - T - 40); c.stroke();
      ['#2c9a55', '#ffffff', '#d14b3a'].forEach(function (col, i) { c.fillStyle = col; c.fillRect(dx + T + 6.5 + i * 5, h - T - 40, 5, 10); });
      c.strokeStyle = P.ink; c.lineWidth = 1; c.strokeRect(dx + T + 6.5, h - T - 40, 15, 10);
      if (o.label) plaque(c, P, o.label, w / 2, wallTop + 4, w - 20, 15);
    },
    /* the Olympic training centre: low and modern */
    coni: function (c, w, h, P, o) {
      var wallTop = T * 0.4;
      ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
      rr(c, 2, wallTop, w - 4, h - wallTop - 2, 2); fillStroke(c, P.wall, P.ink, 1.8);
      rr(c, -2, wallTop - 14, w + 4, 16, 2); fillStroke(c, P.stone2, P.ink, 1.7);
      rr(c, 10, wallTop + 10, w - 20, 22, 2); fillStroke(c, '#bfe3ff', P.ink, 1.4);
      c.strokeStyle = P.ink; c.lineWidth = 1;
      for (var x = 28; x < w - 12; x += 18) { c.beginPath(); c.moveTo(x, wallTop + 10); c.lineTo(x, wallTop + 32); c.stroke(); }
      ['#3f7ccf', '#ffd166', '#2c9a55'].forEach(function (col, i) { c.fillStyle = col; c.fillRect(6, h - 16 + i * 4, w - 12, 3); });
      var dx = (o.doorX - o.x) * T;
      rr(c, dx + 6, h - T + 3, T - 12, T - 5, 2); fillStroke(c, '#bfe3ff', P.ink, 1.4);
      if (o.label) plaque(c, P, o.label, w / 2, wallTop - 6, w - 12, 13);
    },
    lido: function (c, w, h, P, o) {
      ell(c, w / 2, h - 1, w / 2, 4); c.fillStyle = P.shadow; c.fill();
      rr(c, 6, 10, w - 12, h - 12, 2); fillStroke(c, P.wood, P.ink, 1.7);
      c.strokeStyle = P.wood2; c.lineWidth = 1.1;
      for (var x = 14; x < w - 8; x += 8) { c.beginPath(); c.moveTo(x, 12); c.lineTo(x, h - 3); c.stroke(); }
      rr(c, 18, 24, w - 36, 13, 2); fillStroke(c, '#20263a', P.ink, 1.2);
      rr(c, 14, 36, w - 28, 5, 1); fillStroke(c, P.wood2, P.ink, 1.1);
      poly(c, [[0, 14], [10, -18], [w - 10, -18], [w, 14]]);
      c.save(); c.clip();
      for (var k = 0; k * 12 < w; k++) { c.fillStyle = k % 2 ? '#ffffff' : P['roof-a']; c.fillRect(k * 12, -20, 12, 36); }
      c.restore();
      c.strokeStyle = P.ink; c.lineWidth = 1.7; c.stroke();
      c.fillStyle = P['roof-a'];
      for (k = 0; k * 12 < w; k++) { c.beginPath(); c.arc(k * 12 + 6, 14, 6, 0, Math.PI); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.2; c.stroke(); }
      if (o.label) plaque(c, P, o.label, w / 2, -6, w - 30, 13);
    },
    kiosk: function (c, w, h, P, o) {
      ell(c, w / 2, h - 2, w / 2 - 2, 4); c.fillStyle = P.shadow; c.fill();
      rr(c, 6, 12, w - 12, h - 14, 3); fillStroke(c, P.wall, P.ink, 1.7);
      poly(c, [[1, 16], [8, -10], [w - 8, -10], [w - 1, 16]]); fillStroke(c, P['roof-b'], P.ink, 1.7);
      rr(c, 12, 22, w - 24, 15, 2); fillStroke(c, '#bfe3ff', P.ink, 1.2);
      rr(c, 9, 37, w - 18, 4, 1); fillStroke(c, P.wood, P.ink, 1);
      if (o.label) plaque(c, P, o.label, w / 2, 3, w + 18, 11);
    },
    fountain: function (c, w, h, P) {
      ell(c, w / 2, h / 2 + 6, w / 2 - 2, h / 2 - 10); fillStroke(c, P.stone, P.ink, 1.8);
      ell(c, w / 2, h / 2 + 6, w / 2 - 9, h / 2 - 16); fillStroke(c, P.sea, P.ink, 1.3);
      c.strokeStyle = P.foam; c.lineWidth = 1.4;
      c.beginPath(); c.ellipse(w / 2, h / 2 + 8, 14, 5, 0, 0.3, Math.PI - 0.3); c.stroke();
      rr(c, w / 2 - 4, h / 2 - 16, 8, 22, 3); fillStroke(c, P.stone, P.ink, 1.4);
      ell(c, w / 2, h / 2 - 17, 11, 4); fillStroke(c, P.stone, P.ink, 1.4);
      c.strokeStyle = P.sea2; c.lineWidth = 2;
      c.beginPath(); c.moveTo(w / 2 - 8, h / 2 - 15); c.quadraticCurveTo(w / 2 - 15, h / 2 - 8, w / 2 - 15, h / 2 + 2);
      c.moveTo(w / 2 + 8, h / 2 - 15); c.quadraticCurveTo(w / 2 + 15, h / 2 - 8, w / 2 + 15, h / 2 + 2); c.stroke();
      c.strokeStyle = P.foam; c.lineWidth = 1.6; c.beginPath(); c.moveTo(w / 2, h / 2 - 21); c.lineTo(w / 2, h / 2 - 28); c.stroke();
    },
    car: function (c, w, h, P, o) {
      var col = o.color || '#e86a5c';
      ell(c, w / 2, h - 3, w / 2 - 4, 4); c.fillStyle = P.shadow; c.fill();
      c.fillStyle = '#20263a';
      [[10, 2], [w - 18, 2], [10, h - 8], [w - 18, h - 8]].forEach(function (p) { rr(c, p[0], p[1], 8, 6, 2); c.fill(); });
      rr(c, 3, 4, w - 6, h - 8, 9); fillStroke(c, col, P.ink, 1.7);
      rr(c, 18, 6, 26, h - 12, 6); fillStroke(c, '#bfe3ff', P.ink, 1.3);
      rr(c, 23, 8, 15, h - 16, 4); c.fillStyle = col; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1; c.stroke();
      c.fillStyle = '#fff3a0'; rr(c, w - 8, 7, 3, 5, 1); c.fill(); rr(c, w - 8, h - 12, 3, 5, 1); c.fill();
    },
    lifeguard: function (c, w, h, P) {
      ell(c, 16, 28, 9, 3); c.fillStyle = P.shadow; c.fill();
      c.strokeStyle = P.ink; c.lineWidth = 2.2;
      c.beginPath(); c.moveTo(6, 28); c.lineTo(11, -8); c.moveTo(26, 28); c.lineTo(21, -8); c.moveTo(8, 14); c.lineTo(24, 14); c.stroke();
      rr(c, 7, -14, 18, 7, 2); fillStroke(c, P.wood, P.ink, 1.5);
      rr(c, 9, -26, 14, 12, 2); fillStroke(c, P.wood, P.ink, 1.5);
      c.strokeStyle = P.ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(27, -8); c.lineTo(27, -40); c.stroke();
      poly(c, [[27, -40], [38, -35], [27, -30]]); fillStroke(c, '#57c968', P.ink, 1.2);
    },
    /* the Roman villa of Mamurra, in the park of Gianola */
    ruins: function (c, w, h, P) {
      ell(c, w / 2, h - 4, w / 2 - 2, 5); c.fillStyle = P.shadow; c.fill();
      rr(c, 4, h - 18, w - 8, 14, 2); fillStroke(c, P.stone, P.ink, 1.6);
      c.strokeStyle = P.stone2; c.lineWidth = 1; c.beginPath(); c.moveTo(20, h - 18); c.lineTo(20, h - 4); c.moveTo(42, h - 18); c.lineTo(42, h - 4); c.stroke();
      [[13, 30], [31, 46], [49, 20]].forEach(function (p) {
        var cx = p[0], ch = p[1], top = h - 18 - ch;
        c.beginPath(); c.moveTo(cx - 5, h - 18); c.lineTo(cx - 5, top + 3); c.lineTo(cx - 2, top); c.lineTo(cx + 1, top + 4); c.lineTo(cx + 5, top + 1); c.lineTo(cx + 5, h - 18); c.closePath();
        fillStroke(c, P.stone, P.ink, 1.5);
        c.strokeStyle = P.stone2; c.lineWidth = 0.9; c.beginPath(); c.moveTo(cx - 1.5, h - 19); c.lineTo(cx - 1.5, top + 5); c.moveTo(cx + 2, h - 19); c.lineTo(cx + 2, top + 5); c.stroke();
      });
      ell(c, 22, h - 22, 4, 2.5); fillStroke(c, P.stone, P.ink, 1.2);
      c.fillStyle = P.leaf; [[9, h - 20], [28, h - 50], [52, h - 26], [40, h - 19]].forEach(function (p) { circle(c, p[0], p[1], 3); c.fill(); });
    },
    /* where the railway goes into the hill */
    tunnel: function (c, w, h, P) {
      blobs(c, [[4, 10, 13], [26, 8, 13], [16, -4, 12], [6, 40, 12], [28, 40, 12]], P.rock, P.ink, 1.6);
      c.beginPath(); c.moveTo(2, h - 14); c.lineTo(2, 44); c.quadraticCurveTo(2, 32, 14, 32); c.quadraticCurveTo(26, 32, 26, 44); c.lineTo(26, h - 14); c.closePath();
      fillStroke(c, '#20263a', P.ink, 1.6);
    },
    /* one of the things Antonio lost around town */
    item: function (c, w, h, P, o) {
      ell(c, 16, 27, 8, 2.6); c.fillStyle = P.shadow; c.fill();
      circle(c, 16, 15, 12); c.fillStyle = 'rgba(255,253,246,.75)'; c.fill();
      var ink = STICKER_INK;
      if (o.item === 'notes') {
        rr(c, 9, 4, 15, 19, 2); fillStroke(c, '#fffdf6', ink, 1.5);
        c.strokeStyle = '#8fd0f6'; c.lineWidth = 1; for (var k = 0; k < 4; k++) { c.beginPath(); c.moveTo(12, 9 + k * 4); c.lineTo(22, 9 + k * 4); c.stroke(); }
        c.strokeStyle = '#d14b3a'; c.beginPath(); c.moveTo(12, 5); c.lineTo(12, 22); c.stroke();
      } else if (o.item === 'wallet') {
        rr(c, 7, 8, 18, 13, 3); fillStroke(c, '#8a5a3c', ink, 1.5);
        rr(c, 15, 11, 11, 7, 2); fillStroke(c, '#6b4429', ink, 1.2);
        circle(c, 22, 14.5, 1.4); c.fillStyle = '#ffd166'; c.fill();
      } else if (o.item === 'charger') {
        c.strokeStyle = ink; c.lineWidth = 1.8; c.beginPath(); c.moveTo(13, 7); c.lineTo(13, 3); c.moveTo(19, 7); c.lineTo(19, 3); c.stroke();
        rr(c, 9, 7, 14, 11, 3); fillStroke(c, '#f3f3f3', ink, 1.5);
        c.strokeStyle = ink; c.lineWidth = 1.6; c.beginPath(); c.moveTo(16, 18); c.quadraticCurveTo(16, 25, 22, 24); c.quadraticCurveTo(27, 23, 26, 18); c.stroke();
      } else {
        rr(c, 9, 4, 15, 20, 2); fillStroke(c, '#7a1f2b', ink, 1.5);
        circle(c, 16.5, 12, 3.6); c.strokeStyle = '#ffd166'; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = '#ffd166'; c.fillRect(12, 18, 9, 1.4);
      }
    },
    house: function (c, w, h, P, o) { building(c, w, h, P, o, { roof: o.roof || P['roof-a'], windows: 2 }); },
    shop: function (c, w, h, P, o) { building(c, w, h, P, o, { roof: o.roof || P['roof-c'], windows: 1, awning: o.awning || '#ff8fc1' }); },
    station: function (c, w, h, P, o) {
      building(c, w, h, P, o, { roof: P['roof-b'], windows: 4, sign: 'STAZIONE' });
      var cx = w / 2; circle(c, cx, -2, 7); fillStroke(c, '#fffaf0', P.ink, 1.6);
      c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(cx, -2); c.lineTo(cx, -7); c.moveTo(cx, -2); c.lineTo(cx + 4, -1); c.stroke();
    },
    circolo: function (c, w, h, P, o) {
      building(c, w, h, P, o, { roof: '#7fc796', windows: 2, sign: 'CIRCOLO TENNIS', awning: '#e08a5e' });
      c.save(); c.translate(w - 26, 4); c.rotate(-0.6);
      ell(c, 0, -8, 6, 8); fillStroke(c, '#fffaf0', P.ink, 1.6);
      c.strokeStyle = P.ink; c.lineWidth = 0.8; for (var k = -4; k <= 4; k += 2) { c.beginPath(); c.moveTo(k, -15); c.lineTo(k, -1); c.stroke(); }
      c.lineWidth = 2.4; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 9); c.stroke(); c.restore();
    },
    bar: function (c, w, h, P, o) { building(c, w, h, P, o, { roof: P['roof-c'], windows: 1, sign: 'BAR', awning: '#ff8fc1' }); },
    /* Torre di Mola: the round tower of the Angevin castle, 13th century */
    tower: function (c, w, h, P) {
      var top = -T * 2.05, bot = h - 7, x0 = 7, x1 = w - 7, cx = w / 2, rx = (x1 - x0) / 2;
      ell(c, cx, bot + 3, rx + 5, 6); c.fillStyle = P.shadow; c.fill();
      cylinder(c, P, x0, x1, top + 12, bot, 6);
      for (var k = 0; k < 6; k++) {   /* merlons, back row then front row */
        var a = Math.PI + (k + 0.5) * Math.PI / 6;
        rr(c, cx + Math.cos(a) * (rx - 3) - 3.5, top + 12 + Math.sin(a) * 5 - 9, 7, 9, 1); fillStroke(c, P.stone2, P.ink, 1.2);
      }
      ell(c, cx, top + 12, rx, 6); fillStroke(c, P.stone, P.ink, 1.6);
      for (k = 0; k < 6; k++) {
        var b = (k + 0.5) * Math.PI / 6;
        rr(c, cx + Math.cos(b) * (rx - 2) - 3.5, top + 12 + Math.sin(b) * 6 - 8, 7, 10, 1); fillStroke(c, P.stone, P.ink, 1.3);
      }
      c.fillStyle = '#20263a'; rr(c, cx - 2, top + 34, 4, 13, 2); c.fill(); rr(c, cx - 13, top + 58, 4, 10, 2); c.fill();
      rr(c, cx - 7, bot - 20, 14, 22, 7); fillStroke(c, P.wood, P.ink, 1.6);
    },
    /* the Tomb of Cicero on the Appia: a square base and a round drum, overgrown on top */
    tomb: function (c, w, h, P) {
      ell(c, w / 2, h - 4, w / 2 - 2, 6); c.fillStyle = P.shadow; c.fill();
      rr(c, 6, h - 40, w - 12, 36, 3); fillStroke(c, P.stone, P.ink, 1.8);
      c.strokeStyle = P.stone2; c.lineWidth = 1;
      [h - 28, h - 16].forEach(function (y) { c.beginPath(); c.moveTo(7, y); c.lineTo(w - 7, y); c.stroke(); });
      [20, 44, 68].forEach(function (x, i) { c.beginPath(); c.moveTo(x + (i % 2) * 8, h - 40); c.lineTo(x + (i % 2) * 8, h - 28); c.moveTo(x + 10, h - 28); c.lineTo(x + 10, h - 16); c.stroke(); });
      var x0 = 18, x1 = w - 18, top = -T * 1.45, bot = h - 40, cx = w / 2;
      cylinder(c, P, x0, x1, top + 8, bot, 5);
      c.beginPath(); c.moveTo(x0 - 1, top + 9);
      for (var k = 0; k <= 8; k++) c.lineTo(x0 + k * (x1 - x0) / 8, top + 9 - (k % 2 ? 6 : 1) - hash(k, 9, 175) * 3);
      c.lineTo(x1 + 1, top + 9); c.closePath(); fillStroke(c, P.stone2, P.ink, 1.4);
      blobs(c, [[x0 + 8, top + 2, 6], [cx, top - 2, 7], [x1 - 9, top + 3, 5.5]], P.leaf, P.ink, 1.3);
      c.strokeStyle = P.leaf2; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0 + 6, top + 8); c.quadraticCurveTo(x0 + 3, top + 22, x0 + 6, top + 34); c.stroke();
      rr(c, cx - 7, h - 27, 14, 23, 2); fillStroke(c, '#20263a', P.ink, 1.4);
    }
  };
  function building(c, w, h, P, o, d) {
    var wallTop = T * 0.9, roofTop = -T * 0.55;
    ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();
    rr(c, 3, wallTop, w - 6, h - wallTop - 2, 3); fillStroke(c, P.wall, P.ink, 1.8);
    c.beginPath(); c.moveTo(-2, wallTop + 4); c.lineTo(10, roofTop); c.lineTo(w - 10, roofTop); c.lineTo(w + 2, wallTop + 4); c.closePath();
    fillStroke(c, d.roof, P.ink, 1.8);
    c.strokeStyle = P.ink; c.lineWidth = 1; c.globalAlpha = 0.35;
    for (var y = roofTop + 8; y < wallTop; y += 8) { c.beginPath(); c.moveTo(4, y); c.lineTo(w - 4, y); c.stroke(); }
    c.globalAlpha = 1;
    var dx = (o.doorX - o.x) * T, wy = wallTop + 10, n = d.windows;
    var slots = [];
    for (var k = 0; k < n + 1; k++) slots.push(10 + k * ((w - 20 - 18) / Math.max(1, n)));
    slots.forEach(function (sx) {
      if (Math.abs(sx + 9 - (dx + T / 2)) < 20) return;
      rr(c, sx, wy, 18, 14, 2); fillStroke(c, '#bfe3ff', P.ink, 1.5);
      c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(sx + 9, wy); c.lineTo(sx + 9, wy + 14); c.stroke();
    });
    if (d.awning) {
      var aw = Math.min(T * 1.6, w - 8), ax = dx + T / 2 - aw / 2;
      c.beginPath(); c.moveTo(ax, wallTop + 2); c.lineTo(ax + aw, wallTop + 2); c.lineTo(ax + aw - 4, wallTop + 14); c.lineTo(ax + 4, wallTop + 14); c.closePath();
      fillStroke(c, d.awning, P.ink, 1.5);
      c.fillStyle = '#ffffff'; for (var a = 0; a < 4; a++) c.fillRect(ax + 6 + a * (aw - 12) / 4, wallTop + 3, (aw - 12) / 8, 10);
    }
    rr(c, dx + 7, h - T + 4, T - 14, T - 6, 3); fillStroke(c, P.wood, P.ink, 1.6);
    circle(c, dx + T - 11, h - T / 2 + 2, 1.4); c.fillStyle = P.ink; c.fill();
    if (d.sign || o.label) plaque(c, P, o.label || d.sign, w / 2, wallTop - 3, w - 12, 15);
  }

  /* ---------- people seen from above ---------- */
  var DIRS = ['down', 'left', 'right', 'up'];
  function walker(spec, s) {
    var out = {};
    DIRS.forEach(function (d) {
      out[d] = [0, 1, 2].map(function (f) {
        var cv = mk(T * s, 44 * s), c = cv.getContext('2d');
        c.scale(s, s); c.lineCap = 'round'; c.lineJoin = 'round';
        if (d === 'right') { c.translate(T, 0); c.scale(-1, 1); }
        drawWalker(c, spec, d === 'right' ? 'left' : d, f);
        return cv;
      });
    });
    return out;
  }
  function drawWalker(c, S, d, f) {
    var ink = STICKER_INK, bob = f ? -1 : 0, side = d === 'left', back = d === 'up';
    c.translate(0, 4);
    ell(c, 16, 38, 9, 3); c.fillStyle = 'rgba(20,24,40,.22)'; c.fill();
    /* legs */
    var lA = f === 1 ? -3 : 0, lB = f === 2 ? -3 : 0;
    if (side) {
      var fwd = f === 1 ? 3 : f === 2 ? -3 : 0;
      rr(c, 13 - fwd, 29, 5, 8, 2); fillStroke(c, S.pants, ink, 1.4);
      rr(c, 15 + fwd, 29, 5, 8, 2); fillStroke(c, S.pants, ink, 1.4);
      ell(c, 14.5 - fwd, 37, 3.4, 1.8); fillStroke(c, S.shoes, ink, 1.2);
      ell(c, 16.5 + fwd, 37, 3.4, 1.8); fillStroke(c, S.shoes, ink, 1.2);
    } else {
      rr(c, 11, 29 + lA, 5, 8 - lA * 0.3, 2); fillStroke(c, S.pants, ink, 1.4);
      rr(c, 16, 29 + lB, 5, 8 - lB * 0.3, 2); fillStroke(c, S.pants, ink, 1.4);
      ell(c, 13.5, 37 + lA * 0.6, 3.2, 1.8); fillStroke(c, S.shoes, ink, 1.2);
      ell(c, 18.5, 37 + lB * 0.6, 3.2, 1.8); fillStroke(c, S.shoes, ink, 1.2);
    }
    c.translate(0, bob);
    /* mane-style hair sits behind the body */
    if (S.hair.style === 'mane') { hairBack(c, S, d); }
    /* body */
    var bx = side ? 10.5 : 8.5, bw = side ? 11 : 15;
    rr(c, bx, 19, bw, 12.5, 4.5); fillStroke(c, S.top, ink, 1.6);
    torsoDetail(c, S, d, bx, bw);
    /* arms */
    var sw = f === 1 ? 1.5 : f === 2 ? -1.5 : 0;
    if (side) { rr(c, 14 + sw, 21, 4.5, 9, 2.2); fillStroke(c, S.sleeve || S.top, ink, 1.4); circle(c, 16.2 + sw, 30.5, 2); fillStroke(c, S.skin, ink, 1.2); }
    else {
      rr(c, 5.2, 20.5 + sw, 4.4, 9, 2.2); fillStroke(c, S.sleeve || S.top, ink, 1.4);
      rr(c, 22.4, 20.5 - sw, 4.4, 9, 2.2); fillStroke(c, S.sleeve || S.top, ink, 1.4);
      circle(c, 7.4, 30 + sw, 1.9); fillStroke(c, S.skin, ink, 1.2); circle(c, 24.6, 30 - sw, 1.9); fillStroke(c, S.skin, ink, 1.2);
    }
    if (S.phones) neckPhones(c, d);
    /* head */
    circle(c, 16, 12, 9.6); fillStroke(c, S.skin, ink, 1.6);
    if (S.beard && !back) { c.save(); circle(c, 16, 12, 9.6); c.clip(); c.fillStyle = S.beard; c.globalAlpha = 0.42; c.beginPath(); c.ellipse(side ? 12 : 16, 19, side ? 6 : 8.5, 5.2, 0, 0, Math.PI * 2); c.fill(); c.restore(); c.globalAlpha = 1; }
    hairFront(c, S, d);
    if (!back) face(c, S, d);
  }
  function torsoDetail(c, S, d, bx, bw) {
    var ink = STICKER_INK;
    var st = S.style;
    if (st === 'stripes') {
      c.save(); rr(c, bx, 19, bw, 12.5, 4.5); c.clip();
      for (var k = 0; k < 6; k++) { c.fillStyle = S.stripes[k % S.stripes.length]; c.fillRect(bx, 20 + k * 2.2, bw, 1.2); }
      c.restore(); rr(c, bx, 19, bw, 12.5, 4.5); c.strokeStyle = ink; c.lineWidth = 1.6; c.stroke();
    }
    if (d === 'up') { if (st === 'hoodie') { c.beginPath(); c.moveTo(10, 20); c.quadraticCurveTo(16, 27, 22, 20); fillStroke(c, S.top2, ink, 1.3); } return; }
    if (d === 'left') return;
    if (st === 'hoodie') { c.strokeStyle = '#d7dcef'; c.lineWidth = 1; c.beginPath(); c.moveTo(14, 21); c.lineTo(13.5, 26); c.moveTo(18, 21); c.lineTo(18.5, 26); c.stroke(); }
    else if (st === 'turtleneck') { rr(c, 12, 18, 8, 3.4, 1.5); fillStroke(c, S.top2, ink, 1.2); }
    else if (st === 'tee') { c.strokeStyle = S.top2; c.lineWidth = 1.2; c.beginPath(); c.moveTo(13, 19.5); c.quadraticCurveTo(16, 22, 19, 19.5); c.stroke(); }
    else if (st === 'jacket') { c.fillStyle = S.top2; c.beginPath(); c.moveTo(14, 19.5); c.lineTo(18, 19.5); c.lineTo(17.4, 31); c.lineTo(14.6, 31); c.closePath(); c.fill(); }
    else if (st === 'knit') { c.strokeStyle = S.top2; c.lineWidth = 2.2; c.beginPath(); c.moveTo(22, 20); c.lineTo(10, 31); c.stroke(); }
  }
  function neckPhones(c, d) {
    var ink = STICKER_INK;
    if (d === 'up') { c.strokeStyle = '#2a2a31'; c.lineWidth = 2; c.beginPath(); c.moveTo(10, 20); c.quadraticCurveTo(16, 23, 22, 20); c.stroke(); return; }
    rr(c, 8.5, 18.5, 4.4, 5.4, 2); fillStroke(c, '#22222a', ink, 1.1);
    if (d !== 'left') { rr(c, 19.1, 18.5, 4.4, 5.4, 2); fillStroke(c, '#22222a', ink, 1.1); }
  }
  function bumps(c, cx, cy, r, n, br, a0, a1, color) {
    c.fillStyle = color;
    for (var k = 0; k <= n; k++) {
      var a = a0 + (a1 - a0) * k / n;
      circle(c, cx + Math.cos(a) * r, cy + Math.sin(a) * r, br); c.fill();
    }
  }
  function hairBack(c, S, d) {
    var H = S.hair, ink = STICKER_INK;
    circle(c, 16, 12, 15); fillStroke(c, H.color, ink, 1.6);
    bumps(c, 16, 12, 14, 16, 3.4, 0, Math.PI * 2, H.color);
    c.strokeStyle = H.hi; c.lineWidth = 0.9;
    for (var k = 0; k < 9; k++) { var a = k / 9 * Math.PI * 2; c.beginPath(); c.arc(16 + Math.cos(a) * 11, 12 + Math.sin(a) * 11, 2, 0, 4.2); c.stroke(); }
  }
  function hairFront(c, S, d) {
    var H = S.hair, ink = STICKER_INK, back = d === 'up', side = d === 'left', st = H.style;
    c.save();
    if (st === 'buzz') {
      c.beginPath(); c.arc(16, 12, 9.6, Math.PI * 1.05, Math.PI * 1.95); if (back) { c.arc(16, 12, 9.6, 0, Math.PI); }
      c.closePath(); c.fillStyle = H.color; c.globalAlpha = back ? 0.85 : 0.75; c.fill(); c.globalAlpha = 1;
      c.restore(); return;
    }
    if (st === 'mane') {
      if (back) { circle(c, 16, 11, 12.5); c.fillStyle = H.color; c.fill(); bumps(c, 16, 11, 11.5, 12, 3.2, 0, Math.PI * 2, H.color); }
      else { bumps(c, 16, 6, 8, 10, 3.6, Math.PI * 0.95, Math.PI * 2.05, H.color); if (side) bumps(c, 21, 11, 5, 5, 3.6, -1.2, 1.6, H.color); }
      c.strokeStyle = H.hi; c.lineWidth = 0.9; for (var k = 0; k < 4; k++) { c.beginPath(); c.arc(9 + k * 4.5, 3 + (k % 2) * 2, 1.6, 0, 4.4); c.stroke(); }
      c.restore(); return;
    }
    if (back) {
      circle(c, 16, 11.4, 9.9); c.fillStyle = H.color; c.fill(); c.strokeStyle = ink; c.lineWidth = 1.6; c.stroke();
      if (st === 'curls' || st === 'longcurls') bumps(c, 16, 11, 9.6, 14, 2.6, Math.PI * 0.9, Math.PI * 2.1, H.color);
      if (st === 'longcurls' || st === 'wavy') { rr(c, 7.5, 12, 17, 9, 4); c.fillStyle = H.color; c.fill(); }
      hiSwirls(c, H, 16, 8);
      c.restore(); return;
    }
    if (side) {
      c.beginPath(); c.arc(16, 12, 10.2, Math.PI * 0.75, Math.PI * 2.02); c.closePath(); c.fillStyle = H.color; c.fill();
      c.beginPath(); c.moveTo(15, 3); c.quadraticCurveTo(26, 4, 25.6, 16); c.lineTo(18, 14); c.closePath(); c.fill();
      if (st === 'curls' || st === 'longcurls') { bumps(c, 16, 11, 10, 10, 2.5, Math.PI * 0.95, Math.PI * 2.05, H.color); bumps(c, 23, 12, 3.4, 3, 2.4, -1.2, 1.3, H.color); }
      if (st === 'longcurls' || st === 'wavy') { rr(c, 17, 11, 9, 11, 4); c.fill(); }
      if (st === 'quiff') { c.beginPath(); c.moveTo(7, 6); c.quadraticCurveTo(9, -1, 18, 1); c.lineTo(16, 6); c.closePath(); c.fill(); }
      c.beginPath(); c.arc(16, 12, 10.2, Math.PI * 0.95, Math.PI * 1.9); c.strokeStyle = ink; c.lineWidth = 1.4; c.stroke();
      hiSwirls(c, H, 17, 6);
      c.restore(); return;
    }
    /* front */
    c.beginPath(); c.arc(16, 12, 10.1, Math.PI * 1.0, Math.PI * 2.0);
    var fy = st === 'quiff' ? 7 : st === 'wavy' ? 9 : 8;
    c.lineTo(25.8, 13); c.quadraticCurveTo(21, fy, 16, fy + 0.6); c.quadraticCurveTo(11, fy, 6.2, 13); c.closePath();
    c.fillStyle = H.color; c.fill();
    if (st === 'curls' || st === 'longcurls') bumps(c, 16, 10.5, 9.4, 12, 2.5, Math.PI * 0.95, Math.PI * 2.05, H.color);
    if (st === 'curls') { bumps(c, 9.5, 9, 0.1, 0, 2.4, 0, 0, H.color); bumps(c, 14, 8.6, 0.1, 0, 2.3, 0, 0, H.color); bumps(c, 19, 8.8, 0.1, 0, 2.3, 0, 0, H.color); }
    if (st === 'longcurls') { rr(c, 4.8, 9, 4.6, 12, 2.3); c.fill(); rr(c, 22.6, 9, 4.6, 12, 2.3); c.fill(); bumps(c, 16, 8.4, 4, 4, 2.4, 0.4, 2.7, H.color); }
    if (st === 'wavy') { rr(c, 4.6, 8, 5, 13, 2.5); c.fill(); rr(c, 22.4, 8, 5, 13, 2.5); c.fill(); c.beginPath(); c.moveTo(9, 6); c.quadraticCurveTo(17, 4, 24, 11); c.quadraticCurveTo(17, 8, 9, 10); c.closePath(); c.fill(); }
    if (st === 'quiff') { c.beginPath(); c.moveTo(8, 6); c.quadraticCurveTo(12, -2, 22, 0); c.quadraticCurveTo(25, 3, 24, 7); c.closePath(); c.fill(); }
    c.beginPath(); c.arc(16, 12, 10.1, Math.PI * 1.0, Math.PI * 2.0); c.strokeStyle = ink; c.lineWidth = 1.4; c.stroke();
    hiSwirls(c, H, 16, 5);
    c.restore();
  }
  function hiSwirls(c, H, cx, cy) {
    if (!H.hi) return;
    c.strokeStyle = H.hi; c.lineWidth = 0.9; c.globalAlpha = 0.8;
    for (var k = 0; k < 3; k++) { c.beginPath(); c.arc(cx - 5 + k * 5, cy - 1 + (k % 2) * 2, 1.4, 0, 4.4); c.stroke(); }
    c.globalAlpha = 1;
  }
  function face(c, S, d) {
    var ink = STICKER_INK;
    if (d === 'left') {
      circle(c, 9.4, 14.2, 1.3); c.fillStyle = ink; c.fill();
      c.beginPath(); c.moveTo(6.6, 14.6); c.quadraticCurveTo(5, 16.4, 6.8, 17.2); c.strokeStyle = ink; c.lineWidth = 1.1; c.stroke();
      circle(c, 11.6, 17.4, 1.8); c.fillStyle = 'rgba(234,120,110,.35)'; c.fill();
      glasses(c, S, d);
      return;
    }
    circle(c, 12.4, 14.4, 1.35); c.fillStyle = ink; c.fill();
    circle(c, 19.6, 14.4, 1.35); c.fill();
    circle(c, 10.2, 17.4, 1.9); c.fillStyle = 'rgba(234,120,110,.35)'; c.fill();
    circle(c, 21.8, 17.4, 1.9); c.fill();
    c.beginPath(); c.moveTo(14.6, 18.6); c.quadraticCurveTo(16, 19.6, 17.4, 18.6); c.strokeStyle = ink; c.lineWidth = 1.1; c.stroke();
    glasses(c, S, d);
  }
  function glasses(c, S, d) {
    var g = S.glasses, ink = STICKER_INK;
    if (!g) return;
    if (d === 'left') {
      if (g === 'round') { circle(c, 9.6, 14.2, 2.8); c.strokeStyle = '#141416'; c.lineWidth = 1.3; c.stroke(); c.beginPath(); c.moveTo(12.4, 13.8); c.lineTo(18, 13); c.stroke(); }
      else if (g === 'green') { rr(c, 6, 12.2, 7, 4.2, 1.6); fillStroke(c, '#20242e', '#57c968', 1.6); c.strokeStyle = '#57c968'; c.beginPath(); c.moveTo(13, 13.6); c.lineTo(18, 13); c.stroke(); }
      else if (g === 'thin') { c.strokeStyle = '#202227'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(6.5, 13.2); c.lineTo(12.5, 13.2); c.lineTo(18, 12.8); c.stroke(); }
      return;
    }
    if (g === 'round') {
      c.strokeStyle = '#141416'; c.lineWidth = 1.3;
      circle(c, 12.4, 14.3, 2.9); c.stroke(); circle(c, 19.6, 14.3, 2.9); c.stroke();
      c.beginPath(); c.moveTo(15.2, 14); c.lineTo(16.8, 14); c.stroke();
    } else if (g === 'green') {
      rr(c, 8.6, 12.4, 6.6, 4.2, 1.6); fillStroke(c, '#20242e', '#57c968', 1.7);
      rr(c, 16.8, 12.4, 6.6, 4.2, 1.6); fillStroke(c, '#20242e', '#57c968', 1.7);
      c.strokeStyle = '#57c968'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(15.2, 13.6); c.lineTo(16.8, 13.6); c.stroke();
    } else if (g === 'thin') {
      c.strokeStyle = '#202227'; c.lineWidth = 1.2;
      c.beginPath(); c.moveTo(9.2, 12.8); c.lineTo(15, 12.8); c.moveTo(17, 12.8); c.lineTo(22.8, 12.8); c.moveTo(15, 13); c.lineTo(17, 13); c.stroke();
      c.lineWidth = 0.7; c.strokeStyle = '#8f96a0'; c.strokeRect(9.2, 12.8, 5.8, 3.4); c.strokeRect(17, 12.8, 5.8, 3.4);
    }
  }

  /* the six friends, matching their portraits */
  var PEOPLE = {
    antonio: { skin: '#ddae93', hair: { style: 'curls', color: '#1d1512', hi: '#9a8a7c' }, top: '#414c72', top2: '#2a3252', style: 'hoodie', pants: '#2b2f3a', shoes: '#f3f3f3' },
    costanzo: { skin: '#e6bea5', hair: { style: 'wavy', color: '#2a1d16', hi: '#9a7c68' }, top: '#25272f', top2: '#14151a', style: 'turtleneck', pants: '#1c1d22', shoes: '#f0f0f0', glasses: 'thin' },
    andrea: { skin: '#e3b99d', hair: { style: 'quiff', color: '#1d1613', hi: '#7a6b60' }, top: '#25262c', top2: '#3a3c45', style: 'tee', pants: '#26324a', shoes: '#e9e9e9' },
    valentin: { skin: '#edc4ab', hair: { style: 'mane', color: '#7b4d33', hi: '#e6b98c' }, top: '#ddd6c6', top2: '#1c1c21', style: 'jacket', pants: '#3b3f4b', shoes: '#f3f3f3', glasses: 'green' },
    forchetta: { skin: '#e4bca1', hair: { style: 'longcurls', color: '#4f3423', hi: '#c29670' }, top: '#5d5a3e', top2: '#20263a', style: 'stripes', stripes: ['#283046', '#d6c9a8', '#6e6c43', '#8b8f93'], pants: '#22252d', shoes: '#efefef' },
    zendavid: { skin: '#deb294', hair: { style: 'buzz', color: '#2a201b' }, top: '#837c74', top2: '#19191d', style: 'knit', pants: '#56627a', shoes: '#e9e9e9', glasses: 'round', beard: '#2a1f1a', phones: true }
  };
  /* generic townsfolk, varied by a seed */
  function townsperson(seed) {
    var R = function (k) { return hash(seed, k, 7); };
    var skins = ['#f1cdb4', '#ddae93', '#c99577', '#a8775c', '#e9c2a6'], hairs = ['#1d1512', '#4f3423', '#8a5a3c', '#c9a46a', '#6b6b6b', '#2a201b'];
    var tops = ['#e86a5c', '#5b8fd9', '#f2c14e', '#62b38a', '#b07cd8', '#f08fb6', '#4bbad2', '#f5f0e6'];
    var styles = ['curls', 'quiff', 'buzz', 'wavy', 'longcurls'];
    return {
      skin: skins[Math.floor(R(1) * skins.length)], hair: { style: styles[Math.floor(R(2) * styles.length)], color: hairs[Math.floor(R(3) * hairs.length)] },
      top: tops[Math.floor(R(4) * tops.length)], top2: '#1c2340', style: R(5) < 0.5 ? 'tee' : 'hoodie', pants: ['#2b2f3a', '#56627a', '#7a5a3c', '#3b3f4b'][Math.floor(R(6) * 4)], shoes: '#efefef',
      glasses: R(8) < 0.2 ? 'round' : null
    };
  }

  /* a small badge drawn for the HUD and the reward screen */
  function badgeSVG(b, size) {
    size = size || 40;
    var earned = b.earned !== false;
    return '<svg viewBox="0 0 40 40" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      '<circle cx="20" cy="20" r="17" fill="' + (earned ? b.color : 'none') + '" stroke="currentColor" stroke-width="2.4"' + (earned ? '' : ' stroke-dasharray="3 3"') + '/>' +
      (earned ? '<circle cx="20" cy="20" r="11" fill="#fffdf6" stroke="#1c2340" stroke-width="1.6"/><text x="20" y="24.5" text-anchor="middle" font-family="Lilita One, sans-serif" font-size="12" fill="#1c2340">' + b.mark + '</text>' +
        '<path d="M11 9A13 13 0 0 1 22 6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>' : '') + '</svg>';
  }

  /* the things Antonio lost around town, for the menu */
  function itemSVG(kind, found, size) {
    size = size || 32;
    var body = {
      notes: '<rect x="9" y="5" width="14" height="19" rx="2" fill="#fffdf6"/><path d="M12 10h8M12 14h8M12 18h6" stroke="#8fd0f6"/><path d="M12 5v19" stroke="#d14b3a"/>',
      wallet: '<rect x="6" y="9" width="20" height="14" rx="3" fill="#8a5a3c"/><rect x="15" y="12" width="12" height="8" rx="2" fill="#6b4429"/><circle cx="22.5" cy="16" r="1.4" fill="#ffd166" stroke="none"/>',
      charger: '<path d="M13 8V4M19 8V4"/><rect x="9" y="8" width="14" height="11" rx="3" fill="#f3f3f3"/><path d="M16 19c0 6 9 6 9 0" fill="none"/>',
      passport: '<rect x="9" y="4" width="14" height="21" rx="2" fill="#7a1f2b"/><circle cx="16" cy="12" r="3.6" fill="none" stroke="#ffd166"/>'
    }[kind] || '';
    return '<svg viewBox="0 0 32 32" width="' + size + '" height="' + size + '" aria-hidden="true">' +
      (found ? '' : '<circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-dasharray="3 3"/>') +
      '<g stroke="#1c2340" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="' + (found ? 1 : 0.3) + '">' + body + '</g></svg>';
  }

  G.WORLD_ART = {
    T: T, LEGEND: LEGEND, palette: palette, paintGround: paintGround, paintObject: paintObject, walker: walker,
    PEOPLE: PEOPLE, townsperson: townsperson, badgeSVG: badgeSVG, itemSVG: itemSVG, hash: hash
  };
})(typeof window !== 'undefined' ? window : globalThis);

