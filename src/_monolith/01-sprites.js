/* Sprites v2: six friends drawn from their photos, the Esame di Controlli and the robot.
   Each character is built once into a hidden <svg><defs>; an instance is a stack of <use>. */
(function (G) {
  'use strict';

  /* ================= utils ================= */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function r1(n) { return Math.round(n * 10) / 10; }
  function pt(p) { return r1(p[0]) + ' ' + r1(p[1]); }
  function thru(pts, closed) {
    var n = pts.length, d = 'M' + pt(pts[0]), i;
    var get = function (k) { return closed ? pts[(k + n) % n] : pts[Math.max(0, Math.min(n - 1, k))]; };
    var last = closed ? n : n - 1;
    for (i = 0; i < last; i++) {
      var p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      d += 'C' + pt([p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]) + ' ' +
        pt([p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]) + ' ' + pt(p2);
    }
    return closed ? d + 'Z' : d;
  }
  /* sample a smooth curve through control points */
  function sample(ctrl, n) {
    var out = [], segs = ctrl.length - 1;
    for (var i = 0; i <= n; i++) {
      var u = i / n * segs, k = Math.min(segs - 1, Math.floor(u)), t = u - k;
      var p0 = ctrl[Math.max(0, k - 1)], p1 = ctrl[k], p2 = ctrl[k + 1], p3 = ctrl[Math.min(segs, k + 2)];
      var t2 = t * t, t3 = t2 * t;
      out.push([0, 1].map(function (j) {
        return 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3);
      }));
    }
    return out;
  }
  function coilPts(cx, cy, r, turns, o) {
    o = o || {};
    var dir = o.dir || 1, phase = o.phase || 0, pitch = o.pitch == null ? r * 0.9 : o.pitch;
    var squash = o.squash || 0.86, rot = o.rot || 0, taper = o.taper || 0;
    var steps = Math.max(12, Math.round(turns * 22)), pts = [], cs = Math.cos(rot), sn = Math.sin(rot);
    for (var i = 0; i <= steps; i++) {
      var t = i / steps * turns * Math.PI * 2, rr = r * (1 - taper * i / steps), ph = phase + dir * t;
      var lx = rr * Math.cos(ph), ly = rr * squash * Math.sin(ph);
      var y = ly + (t / (Math.PI * 2)) * pitch;
      var ox = lx * cs - ly * sn, oy = lx * sn + ly * cs, len = Math.hypot(ox, oy) || 1;
      pts.push([cx + lx * cs - y * sn, cy + lx * sn + y * cs, ox / len, oy / len]);
    }
    return pts;
  }
  var LX = -0.55, LY = -0.835;
  function litRuns(pts, thr) {
    var runs = [], cur = [];
    for (var i = 0; i < pts.length; i++) {
      var p = pts[i];
      if (p[2] * LX + p[3] * LY > thr) cur.push(p); else { if (cur.length > 2) runs.push(cur); cur = []; }
    }
    if (cur.length > 2) runs.push(cur);
    return runs.map(function (q) { return thru(q); }).join('');
  }
  function swirl(cx, cy, r, dir, phase) {
    var pts = [], steps = 26, turns = 1.2;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, ang = phase + dir * t * turns * Math.PI * 2, rr = r * (0.12 + 0.88 * t);
      pts.push([cx + rr * Math.cos(ang), cy + rr * 0.9 * Math.sin(ang)]);
    }
    return thru(pts);
  }
  function mirrorG(inner) { return '<g transform="translate(260 0) scale(-1 1)">' + inner + '</g>'; }
  function merge(a, b) { var o = {}, k; for (k in a) o[k] = a[k]; for (k in b || {}) o[k] = b[k]; return o; }

  var EXPRS = ['smirk', 'grin', 'pout', 'worried', 'sleepy', 'cool'];
  var INK = '#1c2340', RED = '#d8392b', BLUE = '#22378f', HAND = 'Patrick Hand, Comic Sans MS, cursive';

  /* ================= shared filters ================= */
  var SHARED =
    '<filter id="fB2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>' +
    '<filter id="fB3" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.6"/></filter>' +
    '<filter id="fB6" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="6"/></filter>' +
    '<filter id="fSoft" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation=".5"/></filter>' +
    '<filter id="fGrain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.05" numOctaves="2" seed="11" result="n"/>' +
    '<feColorMatrix in="n" type="matrix" values="0 0 0 0 .2  0 0 0 0 .15  0 0 0 0 .13  3.4 0 0 0 -1.25" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in"/></filter>' +
    '<filter id="fKnit" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9 .35" numOctaves="2" seed="5" result="n"/>' +
    '<feColorMatrix in="n" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  2.2 0 0 0 -1.1" result="g"/><feComposite in="g" in2="SourceGraphic" operator="in"/></filter>';

  /* ================= faces ================= */
  var FACES = {
    square: ['M79 104C74 126 73 152 78 172C81 186 86 197 96 207C106 216 118 222 130 222.5C142 222 154 216 164 207C174 197 179 186 182 172C187 152 186 126 181 104', 'C177 80 156 66 130 66C104 66 83 80 79 104'],
    oval: ['M80 104C76 128 76 156 82 178C88 196 100 212 116 219C121 221.5 126 222.5 130 222.5C134 222.5 139 221.5 144 219C160 212 172 196 178 178C184 156 184 128 180 104', 'C176 80 156 66 130 66C104 66 84 80 80 104'],
    round: ['M77 106C71 132 73 162 83 186C93 206 110 220 130 221C150 220 167 206 177 186C187 162 189 132 183 106', 'C178 80 156 66 130 66C104 66 82 80 77 106'],
    strong: ['M80 102C75 126 75 156 80 178C84 194 92 206 104 214C114 220 122 223 130 223C138 223 146 220 156 214C168 206 176 194 180 178C185 156 185 126 180 102', 'C176 78 156 64 130 64C104 64 84 78 80 102']
  };
  function faceD(c) { var f = FACES[c.face]; return f[0] + f[1] + 'Z'; }

  /* ================= expressions ================= */
  function brow(c, side, o) {
    var B = c.brow, w = B.w || 1, lift = B.lift || 0;
    var ix = 130 + side * 9, ox = 130 + side * 46, mx = 130 + side * 26;
    var iy = 128.8 - lift - (o.inner || 0), my = 125.4 - lift - (o.mid || 0), oy = 128.6 - lift - (o.outer || 0);
    var pts = [[ox, oy - 1.2 * w], [mx, my - 3.8 * w], [ix + side * 1.4, iy - 4 * w], [ix - side * 0.5, iy - 0.2], [ix + side * 0.6, iy + 3.6 * w], [mx, my + 3.4 * w], [ox - side * 2.2, oy + 1.1 * w]];
    var s = '<path d="' + thru(pts, true) + '" fill="' + B.color + '" filter="url(#fSoft)"/>';
    var h = '';
    for (var k = 0; k < 9; k++) {
      var t = k / 8, x = ix + (ox - ix) * t, y = iy + (oy - iy) * t - Math.sin(t * Math.PI) * (iy - my + 1.5);
      h += '<path d="M' + r1(x - side * 1.4) + ' ' + r1(y + 2.2 * w) + 'l' + r1(side * 4.2) + ' ' + r1(-2.4 * w + t * 0.8) + '"/>';
    }
    return s + '<g stroke="' + B.hi + '" stroke-width=".75" stroke-linecap="round" opacity=".75">' + h + '</g>';
  }

  function eye(c, side, o, id) {
    var S = c.skin, cx = 130 + side * 24, cy = 142.5, w = 12.4, s = '';
    var inner = [cx - side * w, cy + 0.9], outer = [cx + side * w, cy - 0.5];
    /* deep-set socket and under-eye */
    s += '<path d="M' + r1(cx - side * 15) + ' ' + (cy - 3) + 'C' + r1(cx - side * 8) + ' ' + (cy - 15) + ' ' + r1(cx + side * 9) + ' ' + (cy - 15) + ' ' + r1(cx + side * 16) + ' ' + (cy - 4) + 'C' + r1(cx + side * 8) + ' ' + (cy - 8) + ' ' + r1(cx - side * 8) + ' ' + (cy - 8) + ' ' + r1(cx - side * 15) + ' ' + (cy - 3) + 'Z" fill="' + S.shade + '" opacity=".7" filter="url(#fB2)"/>';
    s += '<path d="M' + r1(cx - side * 13) + ' ' + (cy + 4) + 'C' + r1(cx - side * 5) + ' ' + (cy + 12.5) + ' ' + r1(cx + side * 7) + ' ' + (cy + 11.5) + ' ' + r1(cx + side * 13.5) + ' ' + (cy + 3) + 'C' + r1(cx + side * 6) + ' ' + (cy + 7.4) + ' ' + r1(cx - side * 5) + ' ' + (cy + 8.4) + ' ' + r1(cx - side * 13) + ' ' + (cy + 4) + 'Z" fill="' + S.deep + '" opacity="' + (c.underEye || 0.45) + '" filter="url(#fB2)"/>';
    if (o.closed) {
      var dy = o.closed === 'happy' ? -4.4 : 3;
      s += '<path d="M' + pt(inner) + 'C' + pt([cx - side * w * 0.45, cy + dy]) + ' ' + pt([cx + side * w * 0.45, cy + dy]) + ' ' + pt(outer) + '" fill="none" stroke="' + c.brow.color + '" stroke-width="2.3" stroke-linecap="round"/>';
      if (o.closed !== 'happy') s += '<path d="M' + r1(cx + side * 4) + ' ' + r1(cy + 3) + 'l' + side * 1 + ' 2.4M' + r1(cx + side * 8) + ' ' + r1(cy + 2) + 'l' + side * 1.6 + ' 2.2" stroke="' + c.brow.color + '" stroke-width="1.1" stroke-linecap="round"/>';
      s += '<path d="M' + pt([cx - side * 10, cy - 5]) + 'C' + pt([cx - side * 4, cy - 8]) + ' ' + pt([cx + side * 5, cy - 8]) + ' ' + pt([cx + side * 11, cy - 4.6]) + '" fill="none" stroke="' + S.line + '" stroke-width=".9" opacity=".5"/>';
      return s;
    }
    var open = o.open == null ? 1 : o.open, lr = o.lowerRaise || 0;
    var hT = 5.2 * open, hB = 4.3 * (1 - lr * 0.65) * Math.max(0.6, open);
    var top = 'M' + pt(inner) + 'C' + pt([cx - side * w * 0.42, cy - hT * 1.32]) + ' ' + pt([cx + side * w * 0.52, cy - hT * 1.1]) + ' ' + pt(outer);
    var bottom = 'C' + pt([cx + side * w * 0.45, cy + hB * 1.05]) + ' ' + pt([cx - side * w * 0.45, cy + hB * 1.2]) + ' ' + pt(inner) + 'Z';
    var shape = top + bottom, lx = (o.look || [0, 0])[0], ly = (o.look || [0, 0])[1], I = c.iris;
    s += '<clipPath id="' + id + '"><path d="' + shape + '"/></clipPath>';
    s += '<path d="' + shape + '" fill="#ede5dc"/>';
    s += '<g clip-path="url(#' + id + ')">';
    var ix = cx + lx, iy = cy - 0.4 + ly;
    s += '<circle cx="' + r1(ix) + '" cy="' + r1(iy) + '" r="6.4" fill="url(#' + c.P + 'IrisG)"/>';
    s += '<circle cx="' + r1(ix) + '" cy="' + r1(iy) + '" r="6.4" fill="none" stroke="' + I.dark + '" stroke-width="1.1"/>';
    s += '<circle cx="' + r1(ix) + '" cy="' + r1(iy) + '" r="2.6" fill="#111"/>';
    s += '<circle cx="' + r1(ix - 1.9) + '" cy="' + r1(iy - 1.9) + '" r="1.3" fill="#fff"/>';
    s += '<path d="' + top + 'L' + pt([cx + side * w, cy - 14]) + 'L' + pt([cx - side * w, cy - 14]) + 'Z" fill="' + S.deep + '" opacity=".28" transform="translate(0 2.2)"/>';
    s += '</g>';
    if (o.lid) {
      var le = cy + (o.lidAt || -1.6);
      var lid = 'M' + pt([inner[0], inner[1] - 0.6]) + 'C' + pt([cx - side * w * 0.42, cy - 12]) + ' ' + pt([cx + side * w * 0.52, cy - 12]) + ' ' + pt([outer[0], outer[1] - 0.6]) + 'C' + pt([cx + side * w * 0.45, le + 1.4]) + ' ' + pt([cx - side * w * 0.45, le + 1.8]) + ' ' + pt([inner[0], inner[1] - 0.6]) + 'Z';
      s += '<path d="' + lid + '" fill="' + S.base + '"/><path d="' + lid + '" fill="' + S.shade + '" opacity=".35"/>';
      s += '<path d="M' + pt([inner[0], inner[1] - 0.3]) + 'C' + pt([cx - side * w * 0.45, le + 2.1]) + ' ' + pt([cx + side * w * 0.45, le + 1.7]) + ' ' + pt([outer[0] + side * 0.6, outer[1] - 0.2]) + '" fill="none" stroke="' + c.brow.color + '" stroke-width="2" stroke-linecap="round"/>';
      s += '<path d="M' + pt([cx - side * 10, cy - 5.6]) + 'C' + pt([cx - side * 4, cy - 8.4]) + ' ' + pt([cx + side * 5, cy - 8.4]) + ' ' + pt([cx + side * 11, cy - 5.4]) + '" fill="none" stroke="' + S.line + '" stroke-width=".9" opacity=".5"/>';
    } else {
      s += '<path d="' + top + '" fill="none" stroke="' + c.brow.color + '" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round"/>';
      s += '<path d="M' + pt([cx - side * 10.5, cy - hT - 1.8]) + 'C' + pt([cx - side * 4, cy - hT - 5]) + ' ' + pt([cx + side * 6, cy - hT - 4.6]) + ' ' + pt([cx + side * 12.6, cy - hT - 0.4]) + '" fill="none" stroke="' + S.line + '" stroke-width="1.05" opacity=".6"/>';
      s += '<path d="M' + pt(outer) + bottom.slice(0, -1) + '" fill="none" stroke="' + S.line + '" stroke-width=".85" opacity=".45"/>';
    }
    return s;
  }

  function mouths(c) {
    var L = c.lips, D = c.skin.deep, IN = L.inside;
    return {
      smirk:
        '<path d="M108.6 183.2C110.2 188.4 113.2 192 117.4 193.4" fill="none" stroke="' + D + '" stroke-width="1.5" opacity=".6" stroke-linecap="round"/>' +
        '<path d="M115 188.2C120 186 125 185.6 129.4 187C133.6 185.4 140.6 186.2 149.6 190.2C141 191.2 127 190.8 115 188.2Z" fill="' + L.dark + '"/>' +
        '<path d="M115.4 188.8C128 191.4 140.4 191.6 149.2 190.6C146.4 197.8 139.6 201.6 131 201.6C121.4 201.2 116.6 195.4 115.4 188.8Z" fill="' + L.base + '"/>' +
        '<path d="M123 196.2C128 198.2 135.4 198 141 195" fill="none" stroke="' + L.light + '" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>' +
        '<path d="M114.6 188.6C127.6 191.2 140 191.4 150 190.4" fill="none" stroke="' + IN + '" stroke-width="1.3" stroke-linecap="round"/>',
      grin:
        '<path d="M103.6 180C107 184 109.6 186.6 112 188.4M156.4 180C153 184 150.4 186.6 148 188.4" fill="none" stroke="' + D + '" stroke-width="1.5" opacity=".6" stroke-linecap="round"/>' +
        '<path d="M108 185C118 189 142 189 152 185C150 198 142 207 130 207C118 207 110 198 108 185Z" fill="' + IN + '"/>' +
        '<path d="M110.5 186.2C120 189.8 140 189.8 149.5 186.2L148.6 191.6C140 194 120 194 111.4 191.6Z" fill="#f6f1ea"/>' +
        '<path d="M118 193.4L118 189.2M124 194L124 189.7M130 194.2L130 189.9M136 194L136 189.7M142 193.4L142 189.2" stroke="#d8cfc5" stroke-width=".7"/>' +
        '<path d="M116 201C122 204.6 138 204.6 144 201C140 205.6 135 207 130 207C125 207 120 205.6 116 201Z" fill="#b8596a"/>' +
        '<path d="M106 184.5C114 182 122 181 130 182.5C138 181 146 182 154 184.5C146 187.5 114 187.5 106 184.5Z" fill="' + L.dark + '"/>' +
        '<path d="M108 185C110 198 118 208 130 208.5C142 208 150 198 152 185C150 202 141 211.5 130 211.5C119 211.5 110 202 108 185Z" fill="' + L.base + '"/>',
      pout:
        '<path d="M115 190C120 184 125 183.4 130 185.2C135 183.4 140 184 145 190C138 191.6 122 191.6 115 190Z" fill="' + L.dark + '"/>' +
        '<path d="M115.5 190.6C122 192.2 138 192.2 144.5 190.6C145 198.4 139 204.6 130 204.8C121 204.6 115 198.4 115.5 190.6Z" fill="' + L.base + '"/>' +
        '<ellipse cx="131" cy="197.5" rx="7" ry="2.6" fill="' + L.light + '" opacity=".8"/>' +
        '<ellipse cx="128" cy="187.6" rx="4" ry="1.2" fill="' + L.light + '" opacity=".5"/>' +
        '<path d="M115 190.4C122 192 138 192 145 190.4" fill="none" stroke="' + IN + '" stroke-width="1.3" stroke-linecap="round"/>',
      worried:
        '<ellipse cx="130" cy="195.5" rx="7.4" ry="6.8" fill="' + IN + '"/>' +
        '<path d="M122.6 195.5C122.6 189.6 126.4 187.6 130 187.6C133.6 187.6 137.4 189.6 137.4 195.5C137.4 192.4 133.6 190.6 130 190.6C126.4 190.6 122.6 192.4 122.6 195.5Z" fill="' + L.dark + '"/>' +
        '<path d="M122.6 195.5C122.6 201.6 126.4 204.6 130 204.6C133.6 204.6 137.4 201.6 137.4 195.5C137.4 200.2 133.6 202 130 202C126.4 202 122.6 200.2 122.6 195.5Z" fill="' + L.base + '"/>',
      sleepy:
        '<path d="M114 191C120 188 125 187.6 130 188.8C135 187.6 140 188 146 191C138 192.2 122 192.2 114 191Z" fill="' + L.dark + '"/>' +
        '<path d="M114.5 191.4C122 192.8 138 192.8 145.5 191.4C143 198 137.6 200.4 130 200.4C122.4 200.4 117 198 114.5 191.4Z" fill="' + L.base + '"/>' +
        '<path d="M122 196.6C127 198 133 198 138 196.6" fill="none" stroke="' + L.light + '" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>' +
        '<path d="M114 191.2C122 192.6 138 192.6 146 191.2" fill="none" stroke="' + IN + '" stroke-width="1.2" stroke-linecap="round"/>',
      cool:
        '<path d="M148 183.4C151 185.6 152.2 188 152.8 191" fill="none" stroke="' + D + '" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>' +
        '<path d="M113 189.5C120 186.6 125 186 129.5 187.4C134 185.8 141 185.6 149 186.4C140 190.6 127 191.4 113 189.5Z" fill="' + L.dark + '"/>' +
        '<path d="M113.6 190C127 191.6 140 190.6 148.6 186.8C146.6 195.6 139 200.6 130.5 200.8C121 200.6 116 196 113.6 190Z" fill="' + L.base + '"/>' +
        '<path d="M122 195.8C127 197.6 135 197.2 141 193.6" fill="none" stroke="' + L.light + '" stroke-width="1.7" stroke-linecap="round" opacity=".8"/>' +
        '<path d="M113 189.8C127 191.8 140 190.8 149 186.6" fill="none" stroke="' + IN + '" stroke-width="1.3" stroke-linecap="round"/>',
      neutral:
        '<path d="M115 190.6C121 188.6 126 188.2 130 189.4C134 188.2 139 188.6 145 190.6C138 191.8 122 191.8 115 190.6Z" fill="' + L.dark + '"/>' +
        '<path d="M115.4 191C122 192.4 138 192.4 144.6 191C142.4 197.2 137.4 199.8 130 199.8C122.6 199.8 117.6 197.2 115.4 191Z" fill="' + L.base + '"/>' +
        '<path d="M123 196C127.6 197.4 132.4 197.4 137 196" fill="none" stroke="' + L.light + '" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>' +
        '<path d="M115 190.9C122 192.2 138 192.2 145 190.9" fill="none" stroke="' + IN + '" stroke-width="1.25" stroke-linecap="round"/>',
      soft:
        '<path d="M112.6 186.6C114.6 188.6 116.4 189.6 118 190M147.4 186.6C145.4 188.6 143.6 189.6 142 190" fill="none" stroke="' + D + '" stroke-width="1.3" opacity=".5" stroke-linecap="round"/>' +
        '<path d="M114 188.8C120 187.2 125 186.8 130 188C135 186.8 140 187.2 146 188.8C138 191.4 122 191.4 114 188.8Z" fill="' + L.dark + '"/>' +
        '<path d="M114.6 189.4C122 191.8 138 191.8 145.4 189.4C143 196.8 137.4 199.6 130 199.6C122.6 199.6 117 196.8 114.6 189.4Z" fill="' + L.base + '"/>' +
        '<path d="M122.6 195.4C127.4 197 132.6 197 137.4 195.4" fill="none" stroke="' + L.light + '" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>' +
        '<path d="M114 189.2C122 191.6 138 191.6 146 189.2" fill="none" stroke="' + IN + '" stroke-width="1.25" stroke-linecap="round"/>',
      talk:
        '<path d="M113 188C120 185.6 125 185.2 130 186.6C135 185.2 140 185.6 147 188C140 189.6 120 189.6 113 188Z" fill="' + L.dark + '"/>' +
        '<path d="M116 189C122 190.4 138 190.4 144 189C143 194.6 137.6 198.4 130 198.4C122.4 198.4 117 194.6 116 189Z" fill="' + IN + '"/>' +
        '<path d="M118.6 189.6C124 190.8 136 190.8 141.4 189.6L140.8 191.6C135 192.8 125 192.8 119.2 191.6Z" fill="#f6f1ea"/>' +
        '<path d="M116.6 195.6C121 200.6 139 200.6 143.4 195.6C141.4 201.4 136.4 203.6 130 203.6C123.6 203.6 118.6 201.4 116.6 195.6Z" fill="' + L.base + '"/>',
      smug:
        '<path d="M147.6 182.6C150.6 184.6 152 187 152.8 190.4" fill="none" stroke="' + D + '" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>' +
        '<path d="M115 190.6C121 188.6 126 188.2 130 189.2C134 187.6 140 186.6 148 186.8C140 191 124 191.8 115 190.6Z" fill="' + L.dark + '"/>' +
        '<path d="M115.4 191C127 192.6 140 191.2 147.6 187.4C145.4 195.6 138.6 199.6 130.6 199.8C122 199.8 117.4 196.2 115.4 191Z" fill="' + L.base + '"/>' +
        '<path d="M115 190.8C127 192.6 140 191.4 148.4 187" fill="none" stroke="' + IN + '" stroke-width="1.3" stroke-linecap="round"/>'
    };
  }

  var BASE_EX = {
    smirk: { bl: {}, br: { outer: 1, mid: 0.8 }, e: { open: 0.92, look: [2.3, -0.1] }, m: 'soft' },
    grin: { bl: { outer: 1.6, mid: 2, inner: 1.2 }, br: { outer: 1.6, mid: 2, inner: 1.2 }, e: { open: 0.86, lowerRaise: 0.85, look: [1.4, 0] }, m: 'grin', cheeks: true },
    pout: { bl: { outer: 0.8, mid: 0.2, inner: -1.8 }, br: { outer: 0.8, mid: 0.2, inner: -1.8 }, e: { open: 0.86, look: [0.3, -0.3] }, m: 'pout' },
    worried: { bl: { outer: -1.6, mid: 1.8, inner: 4.4 }, br: { outer: -1.6, mid: 1.8, inner: 4.4 }, e: { open: 1.16, look: [-2.3, -0.6] }, m: 'worried' },
    sleepy: { bl: { outer: -1, mid: -0.5, inner: 0.3 }, br: { outer: -1, mid: -0.5, inner: 0.3 }, e: { closed: 'calm' }, m: 'sleepy' },
    cool: { bl: { outer: 1.6, mid: 1.8, inner: 0.6 }, br: { outer: 2.8, mid: 2.4, inner: 0.6 }, e: { open: 0.9, look: [1, 0] }, m: 'cool' }
  };

  function exprGroup(c, name, M) {
    var x = merge(BASE_EX[name], (c.ex || {})[name]), P = c.P, s = '<g id="' + P + 'Ex-' + name + '">';
    if (x.cheeks) {
      s += '<ellipse cx="98" cy="165" rx="13" ry="7" fill="' + c.skin.light + '" opacity=".55" filter="url(#fB3)"/>';
      s += '<ellipse cx="162" cy="165" rx="13" ry="7" fill="' + c.skin.light + '" opacity=".4" filter="url(#fB3)"/>';
    }
    s += eye(c, -1, x.e, P + 'EyL-' + name) + eye(c, 1, x.e, P + 'EyR-' + name);
    s += brow(c, -1, x.bl) + brow(c, 1, x.br);
    s += M[x.m];
    if (x.glasses === 'shades') {
      var lens = function (x0) {
        return 'M' + (x0 + 3) + ' 132L' + (x0 + 30) + ' 131C' + (x0 + 33) + ' 130.9 ' + (x0 + 34) + ' 132.5 ' + (x0 + 33.6) + ' 135L' + (x0 + 31.6) + ' 146.5C' + (x0 + 31) + ' 150 ' + (x0 + 29) + ' 151.5 ' + (x0 + 25.6) + ' 151.5L' + (x0 + 8) + ' 151.5C' + (x0 + 4) + ' 151.5 ' + (x0 + 1.6) + ' 149.5 ' + (x0 + 1) + ' 146.1L' + (x0 - 0.4) + ' 135.5C' + (x0 - 0.8) + ' 133.3 ' + (x0 + 0.6) + ' 132.1 ' + (x0 + 3) + ' 132Z';
      };
      s += '<path d="M80 136.5L88.6 134.9M180 136.5L171.4 134.9" stroke="#0e0f13" stroke-width="3" stroke-linecap="round"/>';
      s += '<path d="' + lens(88) + '" fill="url(#gLensDark)" stroke="#0e0f13" stroke-width="3.2" stroke-linejoin="round"/>';
      s += '<path d="' + lens(138.4) + '" fill="url(#gLensDark)" stroke="#0e0f13" stroke-width="3.2" stroke-linejoin="round"/>';
      s += '<path d="M121.4 136.9C125 134.1 135 134.1 138.6 136.9" fill="none" stroke="#0e0f13" stroke-width="3.2" stroke-linecap="round"/>';
      s += '<path d="M95 148.5L108 133.5M101 150.1L113 136.1M145.4 148.5L158.4 133.5M151.4 150.1L163.4 136.1" stroke="#fff" stroke-width="2.2" opacity=".2" stroke-linecap="round"/>';
    }
    return s + '</g>';
  }

  /* ================= hair ================= */
  function frontY(H, x) {
    var F = H.front;
    for (var i = 0; i < F.length - 1; i++) {
      var a = F[i], b = F[i + 1];
      if (x <= a[0] && x >= b[0]) return a[1] + (b[1] - a[1]) * (a[0] - x) / (a[0] - b[0]);
    }
    return H.frontDefault == null ? 120 : H.frontDefault;
  }
  function inEll(x, y, e) { var dx = (x - e.cx) / e.rx, dy = (y - e.cy) / e.ry; return dx * dx + dy * dy < 1; }
  function inShape(H, x, y, shrink) {
    var p = H.p || 2, dx = Math.abs(x - H.cx) / (H.rx - shrink), dy = Math.abs(y - H.cy) / (H.ry - shrink);
    return Math.pow(dx, p) + Math.pow(dy, p) <= 1;
  }
  function edgePt(H, a, inset) {
    var p = H.p || 2, c = Math.cos(a), sn = Math.sin(a);
    return [H.cx + (H.rx - inset) * (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / p), H.cy + (H.ry - inset) * (sn < 0 ? -1 : 1) * Math.pow(Math.abs(sn), 2 / p)];
  }

  /* curl clusters: Antonio, Forchetta, and Valentin's mane */
  function hairCurls(c) {
    var H = c.hair, P = c.P, R = rng(H.seed), i, a, k, cl = [];
    var CX = H.cx, CY = H.cy, RX = H.rx, RY = H.ry, fills = H.fills;
    var edgeN = H.edgeN || 22;
    for (i = 0; i <= edgeN; i++) {
      a = Math.PI * (H.a0 == null ? 0.95 : H.a0) + Math.PI * (H.aSpan == null ? 1.1 : H.aSpan) * i / edgeN;
      var r = H.rEdge[0] + R() * (H.rEdge[1] - H.rEdge[0]), ep = edgePt(H, a, r * 0.35);
      ep[0] += (R() - 0.5) * 3; ep[1] += (R() - 0.5) * 3;
      if (H.avoid && inEll(ep[0], ep[1], { cx: H.avoid.cx, cy: H.avoid.cy, rx: H.avoid.rx - 4, ry: H.avoid.ry - 4 })) continue;
      cl.push([ep[0], ep[1], r]);
    }
    if (H.sides) H.sides.forEach(function (q) {
      cl.push([q[0], q[1], q[2]]);
      cl.push([260 - q[0] + (R() - 0.5) * 2, q[1] + (R() - 0.5) * 3, q[2] * (0.92 + R() * 0.16)]);
    });
    var tries = 0, minD = H.minD || 8.5;
    while (cl.length < H.count && tries < 12000) {
      tries++;
      var x = CX - RX + R() * RX * 2, y = CY - RY + R() * (RY * 2);
      if (!inShape(H, x, y, 4)) continue;
      if (y > frontY(H, x) - 6) continue;
      if (H.avoid && inEll(x, y, H.avoid)) continue;
      var ok = true;
      for (k = 0; k < cl.length && ok; k++) if (Math.hypot(cl[k][0] - x, cl[k][1] - y) < minD) ok = false;
      if (!ok) continue;
      cl.push([x, y, H.rIn[0] + R() * (H.rIn[1] - H.rIn[0])]);
    }
    for (i = 1; i < H.front.length - 1; i++) cl.push([H.front[i][0] + (R() - 0.5) * 3, H.front[i][1] - 4 + R() * 2, H.rFront[0] + R() * (H.rFront[1] - H.rFront[0])]);
    cl.sort(function (p, q) { return p[1] - q[1]; });

    var g = '';
    cl.forEach(function (q, k) {
      var x = q[0], y = q[1], r = q[2];
      var glow = (H.glow0 || 0.16) + (H.glow1 || 0.42) * Math.max(0, 1 - Math.hypot(x - (CX - 30), y - (CY - RY + 14)) / (RX * 1.8));
      var el = H.elong && Math.hypot(x - 130, y - (H.flowY || 50)) > 18;
      if (el) g += '<g transform="translate(' + r1(x) + ' ' + r1(y) + ') rotate(' + r1(Math.atan2(y - (H.flowY || 50), x - 130) * 180 / Math.PI - 90) + ') scale(1 ' + H.elong + ') translate(' + r1(-x) + ' ' + r1(-y) + ')">';
      g += '<circle cx="' + r1(x) + '" cy="' + r1(y) + '" r="' + r1(r) + '" fill="' + fills[k % fills.length] + '"/>';
      var a0 = -0.2 + (R() - 0.5) * 0.4, a1 = 2.4 + (R() - 0.5) * 0.4, rr = r * 0.8;
      g += '<path d="M' + pt([x + rr * Math.cos(a0), y + rr * Math.sin(a0)]) + 'A' + r1(rr) + ' ' + r1(rr) + ' 0 0 1 ' + pt([x + rr * Math.cos(a1), y + rr * Math.sin(a1)]) + '" fill="none" stroke="' + H.out + '" stroke-width="' + r1(r * 0.34) + '" stroke-linecap="round" opacity=".8"/>';
      if (H.hiStyle === 'wave') {
        var wr = r * 0.62, ang = -0.35 + (R() - 0.5) * 0.7, ca = Math.cos(ang), sa = Math.sin(ang);
        var w0 = [x - wr * ca, y - r * 0.15 - wr * sa], w1 = [x + wr * ca, y - r * 0.15 + wr * sa];
        g += '<path d="M' + pt(w0) + 'C' + pt([w0[0] + wr * 0.8 * ca + wr * 0.5 * sa, w0[1] + wr * 0.8 * sa - wr * 0.5 * ca]) + ' ' + pt([w1[0] - wr * 0.8 * ca - wr * 0.5 * sa, w1[1] - wr * 0.8 * sa + wr * 0.5 * ca]) + ' ' + pt(w1) + '" fill="none" stroke="' + H.hi + '" stroke-width="' + r1(1 + r * 0.05) + '" stroke-linecap="round" opacity="' + r1(glow) + '"/>';
      } else if (R() < 0.68) g += '<path d="' + swirl(x - r * 0.08, y - r * 0.1, r * 0.72, R() < 0.5 ? 1 : -1, R() * 6.28) + '" fill="none" stroke="' + H.hi + '" stroke-width="' + r1(0.85 + r * 0.05) + '" stroke-linecap="round" opacity="' + r1(glow) + '"/>';
      else {
        var b0 = 3.3 + R() * 0.6, b1 = b0 + 1.3 + R() * 0.8, br = r * 0.62;
        g += '<path d="M' + pt([x + br * Math.cos(b0), y + br * Math.sin(b0)]) + 'A' + r1(br) + ' ' + r1(br) + ' 0 0 1 ' + pt([x + br * Math.cos(b1), y + br * Math.sin(b1)]) + '" fill="none" stroke="' + H.hi + '" stroke-width="1.1" stroke-linecap="round" opacity="' + r1(glow * 1.1) + '"/>';
      }
      if (el) g += '</g>';
    });
    var fr = '', nf = H.frizz || 12;
    for (i = 0; i < nf; i++) {
      a = Math.PI * (1.02 + 0.96 * R());
      if (H.mane) a = Math.PI * 2 * R();
      var fx = CX + (RX + 3) * Math.cos(a), fy = CY + (RY + 3) * Math.sin(a);
      if (H.avoid && inEll(fx, fy, { cx: H.avoid.cx, cy: H.avoid.cy, rx: H.avoid.rx + 6, ry: H.avoid.ry + 6 })) continue;
      fr += '<path d="' + thru(coilPts(fx, fy, (H.mane ? 3 : 2.4) + R() * 2.4, 0.5 + R() * 0.7, { phase: R() * 6.28, rot: R() * 6.28, pitch: 1.4 })) + '"/>';
    }
    var s = '';
    var back;
    if (H.p) {
      var bp = [];
      for (i = 0; i < 48; i++) bp.push(edgePt(H, Math.PI * 2 * i / 48, 6));
      back = '<path d="' + thru(bp, true) + '" fill="' + H.out + '"/>';
    } else back = '<ellipse cx="' + CX + '" cy="' + (CY - 2) + '" rx="' + (RX - 4) + '" ry="' + (RY - 5) + '" fill="' + H.out + '"/>';
    if (H.sides) back += '<path d="M60 100C56 118 58 136 64 148L86 148L86 100Z" fill="' + H.out + '"/>' + mirrorG('<path d="M60 100C56 118 58 136 64 148L86 148L86 100Z" fill="' + H.out + '"/>');
    s += '<g id="' + P + 'Back">' + back + '</g>';
    s += '<g id="' + P + 'Top">' + g + '<g fill="none" stroke="' + (H.frizzColor || fills[2]) + '" stroke-width="1.1" stroke-linecap="round" opacity="' + (H.mane ? 0.85 : 1) + '">' + fr + '</g></g>';
    if (H.rings) {
      var fo = '', fb = '', fs = '';
      H.rings.forEach(function (q, k) {
        var Pp = coilPts(q[0], q[1], q[2], q[3], { dir: q[4], phase: -1.6 + k * 1.1, pitch: q[2] * q[6], squash: 0.95, taper: 0.1, rot: q[5] });
        var d = thru(Pp);
        fo += '<path d="' + d + '" stroke="' + H.out + '" stroke-width="4.2"/>';
        fb += '<path d="' + d + '" stroke="' + fills[(k + 2) % fills.length] + '" stroke-width="2.2"/>';
        var lit = litRuns(Pp, 0.42);
        if (lit) fs += '<path d="' + lit + '" stroke="' + H.hi + '" stroke-width="1" opacity=".65"/>';
      });
      s += '<g id="' + P + 'Fringe" fill="none" stroke-linecap="round">' + fo + fb + fs + '</g>';
    }
    if (H.fshadow) s += '<g id="' + P + 'FShadow"><path d="' + H.fshadow + '" fill="' + c.skin.deep + '" opacity=".45" filter="url(#fB3)"/></g>';
    return s;
  }

  /* wavy medium-length locks: Costanzo */
  function hairWavy(c) {
    var H = c.hair, P = c.P, R = rng(H.seed), s = '';
    var back = 'M60 198C48 168 46 128 54 96C64 58 96 32 132 32C168 32 198 58 206 96C214 130 212 170 200 200C192 212 180 214 172 206L88 206C80 214 68 210 60 198Z';
    s += '<g id="' + P + 'Back"><path d="' + back + '" fill="' + H.out + '"/></g>';
    function strand(ctrl, amp, waves, phase) {
      var base = sample(ctrl, 36), pts = [];
      for (var i = 0; i < base.length; i++) {
        var p = base[i], q = base[Math.min(base.length - 1, i + 1)], o = base[Math.max(0, i - 1)];
        var tx = q[0] - o[0], ty = q[1] - o[1], tl = Math.hypot(tx, ty) || 1, nx = -ty / tl, ny = tx / tl;
        var t = i / (base.length - 1), off = amp * Math.sin(phase + t * waves * Math.PI * 2) * (0.25 + 0.75 * t);
        pts.push([p[0] + nx * off, p[1] + ny * off]);
      }
      return pts;
    }
    var locks = [
      /* crown arching over the top */
      [[[88, 64], [108, 40], [140, 35], [170, 46], [190, 70]], 2, 1.2, 9],
      [[[82, 76], [98, 48], [130, 39], [160, 43], [186, 62]], 2, 1.4, 8.5],
      /* left curtain, from the parting down to the jaw */
      [[[104, 40], [76, 52], [58, 84], [55, 122], [58, 162]], 4, 2, 8, 1],
      [[[108, 42], [80, 55], [62, 88], [58, 134], [62, 180]], 4.4, 2.2, 8.6, 1],
      [[[112, 44], [84, 59], [68, 93], [64, 142], [68, 192]], 4.6, 2.3, 8.6, 1],
      [[[116, 46], [92, 63], [76, 99], [72, 147], [76, 199]], 4.4, 2.2, 8, 1],
      [[[120, 48], [100, 68], [85, 106], [83, 152], [87, 202]], 4, 2.1, 7, 1],
      /* right curtain */
      [[[120, 40], [162, 40], [194, 64], [205, 108], [203, 160]], 4, 2, 8, -1],
      [[[122, 42], [160, 46], [188, 72], [197, 122], [193, 178]], 4.4, 2.2, 8.6, -1],
      [[[124, 44], [158, 52], [182, 84], [189, 132], [185, 188]], 4.6, 2.3, 8.6, -1],
      [[[126, 46], [156, 58], [176, 96], [179, 146], [175, 198]], 4.2, 2.2, 7.6, -1],
      /* fringe swept toward the viewer's right */
      [[[120, 44], [134, 62], [156, 80], [180, 92], [192, 106]], 3, 1.6, 8],
      [[[116, 46], [120, 70], [136, 90], [160, 102], [176, 111]], 3.4, 1.7, 8.6],
      [[[112, 48], [112, 72], [124, 94], [146, 106], [161, 114]], 3.4, 1.6, 8.2],
      [[[108, 50], [104, 74], [110, 96], [126, 108], [139, 113]], 3, 1.5, 7.6],
      [[[104, 52], [96, 74], [94, 96], [99, 110]], 2.6, 1.2, 7]
    ];
    var cap = 'M66 114C62 76 92 44 132 44C170 44 198 74 194 116C188 106 178 100 166 98C150 96 136 100 124 98C108 96 90 98 78 106C72 110 68 114 66 114Z';
    var curtL = 'M54 104C48 140 52 176 62 204C70 210 82 210 90 204C86 180 84 148 86 120C84 110 72 102 54 104Z';
    var g = '<path d="' + cap + '" fill="' + H.out + '"/><path d="' + curtL + '" fill="' + H.out + '"/>' + mirrorG('<path d="' + curtL + '" fill="' + H.out + '"/>');
    var o = '', b = '', h = '';
    locks.forEach(function (L, k) {
      var pts = strand(L[0], L[1], L[2], R() * 6.28), w = L[3];
      if (L[4]) {
        var e = pts[pts.length - 1], cp = coilPts(e[0] + L[4] * -3, e[1] - 1, 3.6, 0.8, { dir: L[4], phase: L[4] > 0 ? 0 : Math.PI, pitch: 0.6, squash: 1 });
        pts = pts.concat(cp.map(function (p) { return [p[0], p[1]]; }));
      }
      var d = thru(pts);
      o += '<path d="' + d + '" stroke="' + H.out + '" stroke-width="' + r1(w + 2.4) + '"/>';
      b += '<path d="' + d + '" stroke="' + H.fills[k % H.fills.length] + '" stroke-width="' + r1(w) + '"/>';
      h += '<path d="' + d + '" stroke="' + H.hi + '" stroke-width="1.2" opacity=".5" stroke-dasharray="' + r1(8 + R() * 10) + ' ' + r1(10 + R() * 14) + '" stroke-dashoffset="' + r1(R() * 20) + '" transform="translate(-1 -1)"/>';
    });
    g += '<g fill="none" stroke-linecap="round" stroke-linejoin="round">' + o + b + h + '</g>';
    s += '<g id="' + P + 'Top">' + g + '</g>';
    s += '<g id="' + P + 'FShadow"><path d="M86 106C104 100 132 102 160 108C176 112 186 118 192 124L186 132C170 122 150 116 130 116C112 116 98 118 84 124Z" fill="' + c.skin.deep + '" opacity=".4" filter="url(#fB3)"/></g>';
    return s;
  }

  /* short faded sides, top brushed up and to the side: Andrea */
  function hairQuiff(c) {
    var H = c.hair, P = c.P, R = rng(H.seed), s = '', i;
    s += '<g id="' + P + 'Back"><ellipse cx="130" cy="92" rx="55" ry="46" fill="' + H.out + '"/></g>';
    var sideL = 'M71 106C67 117 67 128 70 137C72 144 76 150 80.6 156L84.6 156C82.8 146 82.2 132 85 119L84 106Z';
    var side = '<path d="' + sideL + '" fill="url(#' + P + 'FadeG)"/><path d="' + sideL + '" fill="#000" filter="url(#fGrain)" opacity=".35"/>';
    var line = [[79, 121], [82, 113], [89, 106], [100, 101], [114, 98], [128, 97], [142, 97], [156, 99], [168, 103], [178, 109], [184, 117], [186, 124]];
    var top = [];
    for (i = 0; i <= 18; i++) {
      var t = i / 18, a = -Math.PI * (0.03 + 0.94 * t);
      var quiff = 7 * Math.exp(-Math.pow((t - 0.36) / 0.2, 2)), tuft = (i % 2 ? 2 + R() * 3 : 0);
      top.push([133 + 58 * Math.cos(a), 112 + (61 + quiff + tuft) * Math.sin(a)]);
    }
    var mass = thru(line.concat(top), true);
    var g = side + mirrorG(side) + '<path d="' + mass + '" fill="' + H.out + '"/>';
    function topY(x) {
      var best = top[0], d = 1e9;
      top.forEach(function (p) { var dd = Math.abs(p[0] - x); if (dd < d) { d = dd; best = p; } });
      return best[1];
    }
    var str = '', hi = '';
    for (i = 0; i <= 34; i++) {
      var u = i / 34, k = Math.min(line.length - 2, Math.floor(u * (line.length - 1))), f = u * (line.length - 1) - k;
      var x0 = line[k][0] + (line[k + 1][0] - line[k][0]) * f, y0 = line[k][1] + (line[k + 1][1] - line[k][1]) * f - 1.5;
      var x1 = x0 + (122 - x0) * 0.3 - 6 + (R() - 0.5) * 8, y1 = topY(x1) + 4 + R() * 5;
      var cx = (x0 + x1) / 2 + (x0 < 128 ? -7 : 5), cy = (y0 + y1) / 2 - 4;
      var d = 'M' + r1(x0) + ' ' + r1(y0) + 'Q' + r1(cx) + ' ' + r1(cy) + ' ' + r1(x1) + ' ' + r1(y1);
      str += '<path d="' + d + '" stroke="' + H.body[i % H.body.length] + '" stroke-width="' + r1(2.4 + R() * 1.4) + '"/>';
      if (R() < 0.6) hi += '<path d="' + d + '" stroke="' + H.hi + '" stroke-width=".9" opacity="' + r1(0.3 + R() * 0.35) + '" stroke-dasharray="0 ' + r1(10 + R() * 8) + ' ' + r1(8 + R() * 8) + ' 60"/>';
    }
    /* a few strands falling forward on the forehead (photo in the car) */
    var locks = '';
    [[148, 99, 7, 13], [157, 101, 5, 12], [139, 98, 6, 9], [166, 104, 4, 10]].forEach(function (q) {
      var x = q[0], y = q[1], dx = q[2], dy = q[3];
      locks += '<path d="M' + (x - 3) + ' ' + y + 'Q' + r1(x + dx * 0.2) + ' ' + r1(y + dy * 0.7) + ' ' + (x + dx) + ' ' + (y + dy) + 'Q' + r1(x + dx * 0.15 + 2) + ' ' + r1(y + dy * 0.45) + ' ' + (x + 4) + ' ' + (y - 1) + 'Z" fill="' + H.out + '"/>';
      locks += '<path d="M' + (x - 0.5) + ' ' + y + 'Q' + r1(x + dx * 0.25) + ' ' + r1(y + dy * 0.6) + ' ' + r1(x + dx * 0.85) + ' ' + r1(y + dy * 0.85) + '" fill="none" stroke="' + H.body[1] + '" stroke-width="1.1"/>';
    });
    g += '<g fill="none" stroke-linecap="round">' + str + hi + '</g>' + locks;
    g += '<path d="M96 66C108 56 122 52 136 52" fill="none" stroke="' + H.hi + '" stroke-width="5" opacity=".14" filter="url(#fB3)"/>';
    s += '<g id="' + P + 'Top">' + g + '</g>';
    s += '<g id="' + P + 'FShadow"><path d="M86 112C100 104 116 101 130 101C148 101 164 104 178 112L176 118C164 111 150 108 130 108C112 108 98 111 86 118Z" fill="' + c.skin.deep + '" opacity=".22" filter="url(#fB3)"/></g>';
    return s;
  }

  /* buzz cut: Zendavid */
  function hairBuzz(c) {
    var H = c.hair, P = c.P, S = c.skin, s = '';
    s += '<g id="' + P + 'Back"><ellipse cx="130" cy="100" rx="54" ry="52" fill="url(#' + P + 'SkinG)"/>' +
      '<path d="M76.4 106C75 70 100 48 130 48C160 48 185 70 183.6 106" fill="none" stroke="' + S.line + '" stroke-width="1.4"/></g>';
    var buzz = 'M77 132C72 104 80 72 100 58C110 52 120 49 130 49C140 49 150 52 160 58C180 72 188 104 183 132L178 129C178 112 176 98 170 89C162 83 150 80 140 80C134 81 126 81 120 80C108 80 96 83 90 89C84 98 82 112 82 129Z';
    s += '<g id="' + P + 'Top"><path d="' + buzz + '" fill="' + H.base + '" opacity=".5" filter="url(#fSoft)"/>' +
      '<path d="' + buzz + '" fill="#000" filter="url(#fGrain)" opacity=".85"/>' +
      '<path d="M100 60C110 55 120 53 130 53C140 53 150 55 160 60" fill="none" stroke="#fff" stroke-width="6" opacity=".08" filter="url(#fB3)"/></g>';
    return s;
  }

  /* ================= outfits ================= */
  function torsoD(broad, dip) {
    var y0 = broad ? 235 : 239, xl = broad ? 100 : 102, xr = broad ? 160 : 158;
    var cut = dip ? 'C' + (xl + 6) + ' ' + r1(y0 + dip * 0.8) + ' ' + (xl + 18) + ' ' + (y0 + dip) + ' 130 ' + (y0 + dip) + 'C' + (xr - 18) + ' ' + (y0 + dip) + ' ' + (xr - 6) + ' ' + r1(y0 + dip * 0.8) + ' ' + xr + ' ' + y0 : 'L' + xr + ' ' + y0;
    if (broad) return 'M-8 304L-8 277C6 259 36 249 70 244C86 242 96 239 ' + xl + ' ' + y0 + cut + 'C164 239 174 242 190 244C224 249 254 259 268 277L268 304Z';
    return 'M-4 304L-4 283C8 266 38 255 72 250C86 248 96 244 ' + xl + ' ' + y0 + cut + 'C164 244 174 248 188 250C222 255 252 266 264 283L264 304Z';
  }
  var DIP = { hoodie: 0, turtleneck: 0, tee: 14, knit: 11, stripes: 9, jacket: 0 };

  function outfit(c) {
    var O = c.outfit, P = c.P, S = c.skin, s = '', st = O.style;
    var torso = torsoD(O.broad, DIP[st]);
    var nx1 = O.broad ? 97 : 100, nx2 = O.broad ? 163 : 160;
    s += '<linearGradient id="' + P + 'ClothG" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="' + O.light + '"/><stop offset=".55" stop-color="' + O.base + '"/><stop offset="1" stop-color="' + O.dark + '"/></linearGradient>';
    s += '<clipPath id="' + P + 'TorsoClip"><path d="' + torso + '"/></clipPath>';
    var body = '<path d="' + torso + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.6"/>';
    if (st === 'stripes') {
      var y = 236, k = 0, band = '';
      var hs = [7, 6, 9, 5, 8, 6, 7, 5, 9, 6, 7, 8];
      while (y < 304) { var hgt = hs[k % hs.length]; band += '<rect x="-10" y="' + y + '" width="280" height="' + hgt + '" fill="' + O.stripes[k % O.stripes.length] + '"/>'; y += hgt; k++; }
      body = '<g clip-path="url(#' + P + 'TorsoClip)">' + band + '<rect x="-10" y="230" width="280" height="80" fill="#000" filter="url(#fKnit)" opacity=".16"/>' +
        '<path d="M-10 236L270 236" stroke="none"/></g><path d="' + torso + '" fill="none" stroke="' + O.line + '" stroke-width="1.6"/>';
    }
    if (st === 'knit') body += '<g clip-path="url(#' + P + 'TorsoClip)"><rect x="-10" y="230" width="280" height="80" fill="#000" filter="url(#fKnit)" opacity=".22"/></g>';
    body += '<path d="M22 278C38 268 56 262 76 260M238 278C222 268 204 262 184 260M40 302C46 290 52 284 60 280M220 302C214 290 208 284 200 280" fill="none" stroke="' + (O.fold || O.dark) + '" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>';
    if (st === 'jacket') body += '<path d="M104 238C112 254 148 254 156 238L170 304L90 304Z" fill="' + O.tee + '"/>';
    s += '<g id="' + P + 'Body">' + body + '</g>';

    /* neck */
    s += '<linearGradient id="' + P + 'NeckG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.deep + '"/><stop offset=".5" stop-color="' + S.shade + '"/><stop offset="1" stop-color="' + S.base + '"/></linearGradient>';
    var neck = '<path d="M' + nx1 + ' 196C' + (nx1 + 1) + ' 220 ' + nx1 + ' 240 ' + (nx1 - 2) + ' 268L' + (nx2 + 2) + ' 268C' + nx2 + ' 240 ' + (nx2 - 1) + ' 220 ' + nx2 + ' 196Z" fill="url(#' + P + 'NeckG)"/>';
    neck += '<path d="M98 198C108 213 120 219 130 219C140 219 152 213 162 198L162 214C150 225 140 229 130 229C120 229 110 225 98 214Z" fill="' + S.deep + '" opacity=".45" filter="url(#fB3)"/>';
    neck += '<path d="M112 230C115.6 238 117.6 246 118.6 256M148 230C144.4 238 142.4 246 141.4 256" fill="none" stroke="' + S.deep + '" stroke-width="1.1" opacity=".18"/>';
    if (c.chain) {
      neck += '<path d="M105 236.6C111 252 149 252 155 236.6" fill="none" stroke="#8a9099" stroke-width="1.5" opacity=".8"/>';
      neck += '<path d="M105 236C111 251.4 149 251.4 155 236" fill="none" stroke="#e3e6ea" stroke-width="1" stroke-dasharray="1.6 .9"/>';
    }
    s += '<g id="' + P + 'Neck">' + neck + '</g>';

    /* front pieces over the neck */
    var f = '';
    if (st === 'hoodie') {
      s += '<g id="' + P + 'Collar"><path d="M64 260C60 230 92 210 130 210C168 210 200 230 196 260C188 246 162 236 130 236C98 236 72 246 64 260Z" fill="' + O.dark + '" stroke="' + O.line + '" stroke-width="1.4"/>' +
        '<path d="M72 246C80 226 104 216 130 216C156 216 180 226 188 246" fill="none" stroke="' + O.light + '" stroke-width="2.2" opacity=".55" filter="url(#fB2)"/>' +
        '<path d="M84 246C94 232 112 226 130 226C148 226 166 232 176 246" fill="none" stroke="' + O.deep + '" stroke-width="5" opacity=".7" filter="url(#fB2)"/></g>';
      var bandL = 'M99 224C100 243 112 256 134 262L132 277C106 271 86 260 78 245C82 234 90 228 99 224Z';
      var bandR = 'M161 224C160 243 148 256 126 262L128 277C154 271 174 260 182 245C178 234 170 228 161 224Z';
      f += '<path d="' + bandL + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.4"/>';
      f += '<path d="M89 236C94 252 108 264 131 270" fill="none" stroke="' + O.light + '" stroke-width=".9" stroke-dasharray="2.4 2" opacity=".7"/>';
      f += '<path d="' + bandR + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.4"/>';
      f += '<path d="M171 236C166 252 152 264 129 270" fill="none" stroke="' + O.light + '" stroke-width=".9" stroke-dasharray="2.4 2" opacity=".7"/>';
      [['M114 260C111.6 274 114.6 290 111.8 306', 114], ['M146 260C148.4 274 145.4 290 148.2 306', 146]].forEach(function (q) {
        f += '<path d="' + q[0] + '" fill="none" stroke="' + O.deep + '" stroke-width="4" stroke-linecap="round"/>';
        f += '<path d="' + q[0] + '" fill="none" stroke="' + O.light + '" stroke-width="1" stroke-dasharray="1.6 2.2" opacity=".7"/>';
        f += '<circle cx="' + q[1] + '" cy="259.4" r="4.2" fill="url(#gBrass)" stroke="#8b6b3c" stroke-width=".8"/><circle cx="' + q[1] + '" cy="259.4" r="1.9" fill="' + O.deep + '"/>';
      });
    } else if (st === 'turtleneck') {
      var tube = 'M99 204C99 220 97 236 93 248C106 257 154 257 167 248C163 236 161 220 161 204C150 212 110 212 99 204Z';
      f += '<clipPath id="' + P + 'TubeClip"><path d="' + tube + '"/></clipPath>';
      f += '<path d="' + tube + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.4"/>';
      var ribs = '';
      for (var xr = 92; xr < 170; xr += 3.2) ribs += '<path d="M' + r1(xr) + ' 200L' + r1(xr - 2) + ' 258"/>';
      f += '<g clip-path="url(#' + P + 'TubeClip)" stroke="#fff" stroke-width=".7" opacity=".07">' + ribs + '</g>';
      f += '<path d="M99 214C112 221 148 221 161 214M97 228C111 235 149 235 163 228M95 241C110 248 150 248 165 241" fill="none" stroke="' + O.light + '" stroke-width="1.6" opacity=".45"/>';
      f += '<path d="M99 205C110 213 150 213 161 205" fill="none" stroke="' + O.line + '" stroke-width="2"/>';
    } else if (st === 'tee') {
      f += '<path d="M100 235C106 246 118 249 130 249C142 249 154 246 160 235" fill="none" stroke="' + O.light + '" stroke-width="4.4"/>';
      f += '<path d="M100 237.6C106 248.6 118 251.6 130 251.6C142 251.6 154 248.6 160 237.6" fill="none" stroke="' + O.line + '" stroke-width="1.1"/>';
      f += '<path d="M112 238C118 242 124 243 128 242M148 238C142 242 136 243 132 242" fill="none" stroke="' + S.deep + '" stroke-width="1.1" opacity=".35"/>';
    } else if (st === 'jacket') {
      var pl = 'M102 236C96 256 92 280 90 304L112 304C112 280 114 258 120 244C114 242 108 240 102 236Z';
      f += '<path d="' + pl + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.3"/>' + mirrorG('<path d="' + pl + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.3"/>');
      f += '<path d="M118 246C114 264 112 284 112 304" fill="none" stroke="#8a8478" stroke-width="1.6" stroke-dasharray="1.4 1.4"/>';
      var cl = 'M93 240C88 226 92 212 102 204L117 238C109 243 100 244 93 240Z';
      f += '<path d="' + cl + '" fill="' + O.light + '" stroke="' + O.line + '" stroke-width="1.3"/>' + mirrorG('<path d="' + cl + '" fill="' + O.light + '" stroke="' + O.line + '" stroke-width="1.3"/>');
      f += '<path d="M106 238C112 249 148 249 154 238" fill="none" stroke="#2c2c33" stroke-width="3.2"/>';
    } else if (st === 'stripes') {
      var mock = 'M101 224C101 233 100 240 97 248C110 255 150 255 163 248C160 240 159 233 159 224C147 230 113 230 101 224Z';
      f += '<path d="' + mock + '" fill="' + O.collar + '" stroke="' + O.line + '" stroke-width="1.3"/>';
      f += '<path d="M100 232C112 238 148 238 160 232M99 241C111 247 149 247 161 241" fill="none" stroke="#fff" stroke-width="1" opacity=".12"/>';
    } else if (st === 'knit') {
      f += '<path d="M106 236C112 245 148 245 154 236" fill="none" stroke="' + O.tee + '" stroke-width="3.4"/>';
      f += '<path d="M102 240C108 249 120 252 130 252C140 252 152 249 158 240" fill="none" stroke="' + O.dark + '" stroke-width="7"/>';
      f += '<path d="M102 240C108 249 120 252 130 252C140 252 152 249 158 240" fill="none" stroke="' + O.light + '" stroke-width="7" stroke-dasharray=".9 1.8" opacity=".5"/>';
      /* crossbody bag strap (photo at the castle) */
      f += '<path d="M180 247L194 255L78 312L62 304Z" fill="' + O.strap + '"/><path d="M186 251L70 308" stroke="#3b3b42" stroke-width=".9" stroke-dasharray="2 2"/>';
    }
    s += '<g id="' + P + 'Front">' + f + '</g>';
    return s;
  }

  /* ================= ears, face ================= */
  function ears(c) {
    var P = c.P, S = c.skin, dx = c.earDx || 0;
    var earL = 'M81 130C73 122 63 126 63.5 139C64 151 67.5 162 73 168.5C76.6 172.4 80.6 170 81.6 163Z';
    var earLin = 'M77.4 138C72.6 134 68.8 138 69.6 145.4C70.4 151 73.2 156 76.6 158.8';
    var one = '<path d="' + earL + '" fill="url(#' + P + 'EarG)" stroke="' + S.line + '" stroke-width="1.3"/><path d="' + earLin + '" fill="none" stroke="' + S.deep + '" stroke-width="1.5" stroke-linecap="round" opacity=".8"/><path d="M74.4 145.6C72.8 147.6 73.6 151 75.8 152" fill="none" stroke="' + S.deep + '" stroke-width="1.1" opacity=".6"/>';
    var e = '<g transform="translate(' + dx + ' 0)">' + one + '</g>' + '<g transform="translate(' + (260 - dx) + ' 0) scale(-1 1)">' + one + '</g>';
    var R = c.earring;
    if (R) {
      var metal = R.metal === 'gold' ? ['#9c7629', 'url(#gGold)', '#fff6d6'] : ['#7d838c', 'url(#gSilver)', '#ffffff'];
      if (R.stud) e += '<circle cx="' + R.x + '" cy="' + R.y + '" r="' + R.r + '" fill="' + metal[1] + '" stroke="' + metal[0] + '" stroke-width=".6"/>';
      else {
        e += '<circle cx="' + R.x + '" cy="' + R.y + '" r="' + R.r + '" fill="none" stroke="' + metal[0] + '" stroke-width="2"/>';
        e += '<circle cx="' + R.x + '" cy="' + R.y + '" r="' + R.r + '" fill="none" stroke="' + metal[1] + '" stroke-width="1.25"/>';
        e += '<path d="M' + r1(R.x - R.r * 0.8) + ' ' + r1(R.y - R.r * 0.5) + 'A' + R.r + ' ' + R.r + ' 0 0 1 ' + r1(R.x - R.r * 0.1) + ' ' + r1(R.y - R.r) + '" fill="none" stroke="' + metal[2] + '" stroke-width=".8" stroke-linecap="round"/>';
        if (R.bar) e += '<rect x="' + r1(R.x - 0.9) + '" y="' + r1(R.y + R.r - 0.5) + '" width="1.8" height="14" rx=".9" fill="' + metal[1] + '" stroke="' + metal[0] + '" stroke-width=".5"/>';
      }
    }
    return '<g id="' + P + 'Ears">' + e + '</g>';
  }

  function face(c) {
    var P = c.P, S = c.skin, F = FACES[c.face], FD = faceD(c), f = '';
    f += '<g id="' + P + 'Face"><path d="' + FD + '" fill="url(#' + P + 'SkinG)"/><g clip-path="url(#' + P + 'FaceClip)">';
    f += '<path d="M168 92C186 120 186 170 160 214L196 214L196 92Z" fill="' + S.shade + '" opacity=".55" filter="url(#fB6)"/>';
    f += '<path d="M78 150C80 176 92 200 112 214L72 214Z" fill="' + S.shade + '" opacity=".35" filter="url(#fB6)"/>';
    f += '<path d="M86 168C94 178 104 182 112 182" fill="none" stroke="' + S.shade + '" stroke-width="5" opacity=".35" filter="url(#fB3)"/>';
    f += '<path d="M174 168C166 178 156 182 148 182" fill="none" stroke="' + S.shade + '" stroke-width="5" opacity=".45" filter="url(#fB3)"/>';
    f += '<path d="M116.6 170C112 175 109.6 180 109.4 185M143.4 170C148 175 150.4 180 150.6 185" fill="none" stroke="' + S.shade + '" stroke-width="2.4" opacity=".5" filter="url(#fB2)"/>';
    var blush = S.blush || '#e78c7d', bo = S.blush ? 0.34 : 0.15;
    f += '<ellipse cx="97" cy="163" rx="12" ry="6.6" fill="' + blush + '" opacity="' + bo + '" filter="url(#fB3)"/>';
    f += '<ellipse cx="163" cy="163" rx="12" ry="6.6" fill="' + blush + '" opacity="' + (bo * 0.9) + '" filter="url(#fB3)"/>';
    f += '<ellipse cx="114" cy="104" rx="22" ry="10" fill="' + S.light + '" opacity=".6" filter="url(#fB6)"/>';
    if (c.beard) {
      var beard = 'M79 126C77 150 79 172 87 190C97 208 113 219 130 220C147 219 163 208 173 190C181 172 183 150 181 126L176.4 126C176 145 172 159 164 167C158 172 152 174 148.4 180C146 191 140 197.6 130 197.6C120 197.6 114 191 111.6 180C108 174 102 172 96 167C88 159 84 145 83.6 126Z';
      var mous = 'M110 182.6C116 176.4 124 175.4 130 177.4C136 175.4 144 176.4 150 182.6C145 184.6 140 182.4 130 183.4C120 182.4 115 184.6 110 182.6Z';
      var jaw = 'M82 172C86 189 96 204 111 213C119 218.6 141 218.6 149 213C164 204 174 189 178 172C174 187 166 196 155 201C149 209 141 212.4 130 212.4C119 212.4 111 209 105 201C94 196 86 187 82 172Z';
      f += '<path d="' + beard + '" fill="' + c.beard.color + '" opacity=".26" filter="url(#fB2)"/><path d="' + beard + '" fill="#000" filter="url(#fGrain)" opacity=".34"/>';
      f += '<path d="' + jaw + '" fill="' + c.beard.color + '" opacity=".34" filter="url(#fB2)"/><path d="' + jaw + '" fill="#000" filter="url(#fGrain)" opacity=".3"/>';
      f += '<path d="' + mous + '" fill="' + c.beard.color + '" opacity=".46" filter="url(#fSoft)"/><path d="' + mous + '" fill="#000" filter="url(#fGrain)" opacity=".36"/>';
      f += '<path d="M123 204C126 210 134 210 137 204Z" fill="' + c.beard.color + '" opacity=".35" filter="url(#fSoft)"/>';
    }
    f += '</g><path d="' + F[0] + '" fill="none" stroke="' + S.line + '" stroke-width="1.4"/>';
    var strong = c.nose === 'strong';
    f += '<path d="M135.6 129C137.8 141 139.2 151 141.6 162L137.2 164C135.6 152 134.4 142 133.2 130Z" fill="' + S.shade + '" opacity="' + (strong ? 0.85 : 0.7) + '" filter="url(#fB2)"/>';
    f += '<path d="M125 131C124.4 143 122.6 153 120.8 161" fill="none" stroke="' + S.line + '" stroke-width="1" opacity="' + (strong ? 0.4 : 0.26) + '"/>';
    f += '<path d="M128.6 132C128.8 146 128.8 156 129.8 164" fill="none" stroke="' + S.light + '" stroke-width="3" opacity=".8" stroke-linecap="round" filter="url(#fB2)"/>';
    f += '<ellipse cx="121.6" cy="170.2" rx="4.4" ry="3.6" fill="' + S.shade + '" opacity=".38"/>';
    f += '<ellipse cx="139.4" cy="170.2" rx="4.4" ry="3.6" fill="' + S.shade + '" opacity=".55"/>';
    f += '<ellipse cx="130.6" cy="' + (strong ? 167 : 166) + '" rx="' + (strong ? 5.4 : 4.8) + '" ry="3.4" fill="' + S.light + '" opacity=".75"/>';
    f += '<path d="M123.6 170.6C126.6 173.4 134.6 173.4 137.6 170.6" fill="none" stroke="' + S.shade + '" stroke-width="2.2" opacity=".5" filter="url(#fB2)"/>';
    f += '<path d="M118.4 167.6C117.6 171.4 119.8 174 123.4 174.6M142.6 167.6C143.4 171.4 141.2 174 137.6 174.6" fill="none" stroke="' + S.line + '" stroke-width="1" stroke-linecap="round" opacity=".6"/>';
    f += '<ellipse cx="125.2" cy="173.6" rx="2.5" ry="1.2" fill="' + S.deep + '" opacity=".9" transform="rotate(12 125.2 173.6)"/>';
    f += '<ellipse cx="135.8" cy="173.6" rx="2.5" ry="1.2" fill="' + S.deep + '" opacity=".9" transform="rotate(-12 135.8 173.6)"/>';
    f += '<path d="M127.4 175Q130.5 176.8 133.6 175" fill="none" stroke="' + S.line + '" stroke-width="1" opacity=".55"/>';
    f += '<path d="M126.6 178.8C127.6 181.6 128.6 183.2 130.4 183.4C132.2 183.2 133.2 181.6 134.2 178.8" fill="' + S.shade + '" opacity=".35"/></g>';
    return f;
  }

  /* ================= glasses & props ================= */
  function glasses(c) {
    var G0 = c.glasses, P = c.P;
    if (!G0) return '';
    var g = '';
    if (G0.style === 'round') {
      g += '<path d="M92.6 139.6L79 136.4M167.4 139.6L181 136.4" stroke="#141416" stroke-width="3" stroke-linecap="round"/>';
      g += '<circle cx="106" cy="142" r="13.6" fill="#ffffff" fill-opacity=".07" stroke="#141416" stroke-width="3.6"/>';
      g += '<circle cx="154" cy="142" r="13.6" fill="#ffffff" fill-opacity=".07" stroke="#141416" stroke-width="3.6"/>';
      g += '<path d="M119.6 139.8C124 136.6 136 136.6 140.4 139.8" fill="none" stroke="#141416" stroke-width="3" stroke-linecap="round"/>';
      g += '<path d="M97 134.6A11 11 0 0 1 104 131.6M145 134.6A11 11 0 0 1 152 131.6" fill="none" stroke="#fff" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>';
    } else if (G0.style === 'shadesGreen') {
      var lens = function (x0) { return '<rect x="' + x0 + '" y="129" width="36" height="22" rx="8" fill="url(#gLensDark)" stroke="#57c968" stroke-width="5.4"/>'; };
      g += '<path d="M84 136L76 134M176 136L184 134" stroke="#57c968" stroke-width="5" stroke-linecap="round"/>';
      g += lens(86) + lens(138);
      g += '<rect x="121" y="135" width="18" height="6" rx="3" fill="#57c968"/>';
      g += '<rect x="86" y="129" width="36" height="22" rx="8" fill="none" stroke="#2f8f3e" stroke-width="1" transform="translate(-2.7 -2.7) scale(1.0)" opacity=".0"/>';
      g += '<path d="M84.6 126.6L123.4 126.6M136.6 126.6L175.4 126.6" stroke="#9af0a4" stroke-width="1.2" opacity=".55" stroke-linecap="round"/>';
      g += '<path d="M93 146L104 133M99 148L110 135M145 146L156 133M151 148L162 135" stroke="#fff" stroke-width="2" opacity=".18" stroke-linecap="round"/>';
    } else if (G0.style === 'politico') {
      var pl = function (x0) { return '<rect x="' + x0 + '" y="134.5" width="31" height="15" rx="3" fill="#ffffff" fill-opacity=".08" stroke="#9aa1aa" stroke-width="1"/><path d="M' + x0 + ' 137C' + x0 + ' 134.5 ' + (x0 + 1.5) + ' 134.5 ' + (x0 + 3) + ' 134.5L' + (x0 + 28) + ' 134.5C' + (x0 + 30) + ' 134.5 ' + (x0 + 31) + ' 135 ' + (x0 + 31) + ' 137.5" fill="none" stroke="#202227" stroke-width="3" stroke-linecap="round"/>'; };
      g += '<path d="M90.4 137L80 135M169.6 137L180 135" stroke="#3a3d44" stroke-width="1.8" stroke-linecap="round"/>';
      g += pl(90.4) + pl(138.6);
      g += '<path d="M121.4 138C125 135.6 135 135.6 138.6 138" fill="none" stroke="#3a3d44" stroke-width="1.8"/>';
      g += '<path d="M95 147L103 137.4M143 147L151 137.4" stroke="#fff" stroke-width="1.4" opacity=".3" stroke-linecap="round"/>';
    }
    var s = '<g id="' + P + 'Gl">' + g + '</g>';
    if (G0.koTilt) s += '<g id="' + P + 'GlKo"><g transform="translate(0 6) rotate(-9 130 142)">' + g + '</g></g>';
    return s;
  }
  function props(c) {
    var P = c.P, s = '';
    if (c.props && c.props.phones) {
      var cup = function (x) { return '<rect x="' + (x - 13) + '" y="128" width="26" height="44" rx="12" fill="#1e1e23" stroke="#0b0b0e" stroke-width="2"/><rect x="' + (x - 8) + '" y="134" width="16" height="32" rx="8" fill="#2d2d34"/><circle cx="' + x + '" cy="150" r="2.4" fill="#c9ccd2"/>'; };
      s += '<g id="' + P + 'PhOn"><path d="M68 140C60 80 92 38 130 38C168 38 200 80 192 140" fill="none" stroke="#0b0b0e" stroke-width="11" stroke-linecap="round"/>' +
        '<path d="M68 140C60 80 92 38 130 38C168 38 200 80 192 140" fill="none" stroke="#2a2a31" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M86 70C98 52 112 46 128 45" fill="none" stroke="#5a5a64" stroke-width="2" stroke-linecap="round"/>' + cup(68) + cup(192) + '</g>';
      var ncup = function (x, rot) {
        return '<g transform="rotate(' + rot + ' ' + x + ' 246)"><rect x="' + (x - 11) + '" y="229" width="22" height="32" rx="10" fill="#1e1e23" stroke="#0b0b0e" stroke-width="2"/>' +
          '<rect x="' + (x - 6.5) + '" y="234" width="13" height="22" rx="6.5" fill="#34343c"/><circle cx="' + x + '" cy="245" r="2" fill="#9ea3ab"/></g>';
      };
      s += '<g id="' + P + 'PhNeck"><path d="M95 236C96 226 98 218 101 212M165 236C164 226 162 218 159 212" fill="none" stroke="#0b0b0e" stroke-width="6" stroke-linecap="round"/>' +
        '<path d="M95 236C96 226 98 218 101 212M165 236C164 226 162 218 159 212" fill="none" stroke="#2a2a31" stroke-width="3.4" stroke-linecap="round"/>' + ncup(92, -34) + ncup(168, 34) + '</g>';
    }
    return s;
  }
  function hood(c) {
    if (c.ko !== 'hood') return '';
    var P = c.P, O = c.outfit, s = '';
    var open = 'M72 124C70 82 98 54 130 54C162 54 190 82 188 124C188 168 180 206 166 240L94 240C80 206 72 168 72 124Z';
    var rim = 'M94 240C80 206 72 168 72 124C70 82 98 54 130 54C162 54 190 82 188 124C188 168 180 206 166 240';
    s += '<clipPath id="' + P + 'HoodOpen"><path d="' + open + '"/></clipPath>';
    s += '<g id="' + P + 'HoodBack"><path d="M38 304C28 250 32 150 48 98C64 50 98 26 130 26C162 26 196 50 212 98C228 150 232 250 222 304Z" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.6"/><path d="' + open + '" fill="' + O.deep + '"/></g>';
    s += '<g id="' + P + 'HairHood" clip-path="url(#' + P + 'HoodOpen)"><use href="#' + P + 'Top"/></g>';
    s += '<g id="' + P + 'HoodFront"><path d="' + rim + '" fill="none" stroke="url(#' + P + 'ClothG)" stroke-width="15" stroke-linecap="round"/>' +
      '<path d="' + rim + '" fill="none" stroke="' + O.line + '" stroke-width="1.3" opacity=".55" transform="translate(130 148) scale(.92 .94) translate(-130 -148)"/>' +
      '<path d="M48 300C44 240 50 160 64 112M212 300C216 240 210 160 196 112" fill="none" stroke="' + O.dark + '" stroke-width="1.6" opacity=".55"/></g>';
    return s;
  }

  /* ================= the six friends ================= */
  var CH = {
    antonio: {
      P: 'an', name: 'Antonio', face: 'square', thumb: '44 16 172 172',
      skin: { base: '#ddae93', light: '#f1cfb6', shade: '#c1937b', deep: '#9b6b59', line: '#6e4638' },
      lips: { base: '#b8716d', dark: '#8c4b4c', light: '#d39690', inside: '#55222a' },
      iris: { base: '#6c776f', dark: '#29302b', light: '#a1ab9c' },
      brow: { color: '#2b201a', hi: '#5a483e', w: 1 },
      hair: {
        style: 'curls', seed: 4242, cx: 130, cy: 94, rx: 66, ry: 63, out: '#130e0c', fills: ['#1d1512', '#251b16', '#2c211b', '#19120f'], hi: '#9a8a7c',
        front: [[193, 112], [189, 121], [181, 125], [171, 123], [160, 120], [149, 116], [138, 112], [127, 108], [116, 106], [105, 106], [95, 108], [86, 111], [78, 114], [70, 110]],
        rEdge: [8.5, 12], rIn: [7, 10], rFront: [6.2, 8.4], count: 96,
        sides: [[63, 114, 8], [59, 125, 7.6], [61, 136, 7], [66, 146, 6.2], [72, 120, 7.2], [70, 131, 6.6]],
        rings: [[102, 109, 6.6, 1.12, 1, 0.1, 0.55], [115, 108, 4.6, 1.15, -1, 0, 0.7], [166, 117, 6, 1.35, -1, -0.25, 1.05], [180, 121, 5.2, 1.2, 1, -0.35, 1]],
        fshadow: 'M78 114C94 106 112 106 130 108C150 108 170 112 190 122L186 132C168 124 150 120 130 121C110 120 94 121 76 128Z'
      },
      outfit: { style: 'hoodie', base: '#414c72', dark: '#2a3252', deep: '#1a2040', light: '#5d6a96', line: '#151a33' },
      chain: true, earring: { x: 72.6, y: 173, r: 4.5, metal: 'gold' }, ko: 'hood',
      ex: {
        smirk: { bl: { inner: -0.6 }, br: { outer: 5, mid: 4, inner: 1.2 }, e: { open: 0.92, look: [2.3, -0.1] }, m: 'smirk' },
        sleepy: { e: { open: 0.9, lid: true, lidAt: -1.4, look: [0, 1.5] } },
        cool: { glasses: 'shades' }
      }
    },
    costanzo: {
      P: 'co', name: 'Costanzo', face: 'oval', earDx: 1, thumb: '30 10 200 200',
      skin: { base: '#e6bea5', light: '#f6d9c6', shade: '#ca9e86', deep: '#a5755f', line: '#764a3b' },
      lips: { base: '#c47c78', dark: '#965256', light: '#e0a29d', inside: '#5a2329' },
      iris: { base: '#6a4a33', dark: '#2c1d14', light: '#9b7654' },
      brow: { color: '#2a1d16', hi: '#5a4335', w: 0.88 },
      hair: {
        style: 'curls', p: 2.9, hiStyle: 'wave', elong: 1.55, flowY: 60, seed: 777, cx: 130, cy: 124, rx: 73, ry: 78, out: '#120c09', fills: ['#2a1d16', '#33241b', '#251912', '#3a291f'], hi: '#9a7c68',
        front: [[184, 118], [174, 112], [162, 108], [150, 106], [138, 106], [126, 108], [114, 111], [103, 115], [94, 120], [86, 126]], frontDefault: 999,
        rEdge: [8.5, 11], rIn: [7.5, 10], rFront: [7, 9], count: 140, minD: 9, avoid: { cx: 130, cy: 168, rx: 51, ry: 63 },
        frizz: 16, frizzColor: '#3a291f', glow0: 0.2, glow1: 0.45, a0: 0.56, aSpan: 1.88, edgeN: 34,
        fshadow: 'M84 118C100 108 116 106 132 108C150 108 168 112 186 122L182 132C166 122 150 118 132 119C114 119 100 122 84 130Z'
      },
      outfit: { style: 'turtleneck', base: '#25272f', dark: '#14151a', light: '#3d404b', line: '#07080b' },
      glasses: { style: 'politico', when: 'always', koTilt: true }, ko: 'eyes',
      ex: {
        smirk: { m: 'talk', bl: { outer: 0.6, mid: 0.8 }, br: { outer: 1.4, mid: 1.6 }, e: { open: 0.95, look: [2.4, -0.2] } },
        cool: { m: 'smug' }
      }
    },
    andrea: {
      P: 'av', name: 'Andrea', face: 'strong', earDx: 1, nose: 'strong', thumb: '44 16 172 172',
      skin: { base: '#e3b99d', light: '#f4d4be', shade: '#c69a81', deep: '#9f705b', line: '#714637' },
      lips: { base: '#c27773', dark: '#924f52', light: '#dea09a', inside: '#58222a' },
      iris: { base: '#7c8a7f', dark: '#36413a', light: '#b7c2b4' },
      brow: { color: '#18110e', hi: '#42342c', w: 1.18 },
      hair: { style: 'quiff', seed: 99, out: '#140f0d', body: ['#2b201b', '#33271f', '#251c17'], hi: '#7a6b60' },
      outfit: { style: 'tee', broad: true, base: '#25262c', dark: '#121317', light: '#3a3c45', line: '#060709' },
      ko: 'eyes',
      ex: {
        smirk: { m: 'neutral', bl: {}, br: {}, e: { open: 0.9, look: [2.4, 0] } },
        cool: { m: 'smug', br: { outer: 4, mid: 3.4, inner: 1 } }
      }
    },
    valentin: {
      P: 'va', name: 'Valentin', face: 'round', earDx: -2, thumb: '20 4 220 220', underEye: 0.3,
      skin: { base: '#edc4ab', light: '#f9dfcf', shade: '#d4a18a', deep: '#af7864', line: '#7c4b3d', blush: '#ea877b' },
      lips: { base: '#c9787a', dark: '#9c5058', light: '#e5a5a2', inside: '#5c2229' },
      iris: { base: '#6b4b35', dark: '#2b1c13', light: '#9a7656' },
      brow: { color: '#6a4530', hi: '#9a6c4f', w: 0.82, lift: 4 },
      hair: {
        style: 'curls', mane: true, seed: 31337, cx: 130, cy: 114, rx: 100, ry: 96, out: '#4a2b1c', fills: ['#7b4d33', '#8a5a3c', '#6d432d', '#965f3f'], hi: '#e6b98c',
        front: [[178, 114], [168, 106], [156, 101], [143, 98], [130, 97], [117, 98], [104, 101], [92, 106], [82, 114]], frontDefault: 999,
        rEdge: [12, 17], rIn: [10, 14], rFront: [7.4, 9.6], count: 150, minD: 11.5, avoid: { cx: 130, cy: 164, rx: 50, ry: 66 },
        frizz: 90, frizzColor: '#a8754f', glow0: 0.22, glow1: 0.5, a0: 0.62, aSpan: 1.76, edgeN: 30
      },
      outfit: { style: 'jacket', base: '#ddd6c6', dark: '#b6ad99', light: '#efebe2', line: '#6b6252', tee: '#1c1c21', fold: '#a39a85' },
      glasses: { style: 'shadesGreen', when: 'always', koTilt: true },
      earring: { x: 189.4, y: 173, r: 4.4, metal: 'silver', bar: true }, ko: 'eyes',
      ex: { smirk: { m: 'talk' }, cool: { m: 'grin', cheeks: true } }
    },
    forchetta: {
      P: 'fo', name: 'Forchetta', face: 'oval', earDx: 1, thumb: '38 12 184 184',
      skin: { base: '#e4bca1', light: '#f4d6c1', shade: '#c79c84', deep: '#a0715d', line: '#724739' },
      lips: { base: '#c07672', dark: '#924d51', light: '#dc9e98', inside: '#572229' },
      iris: { base: '#6e5038', dark: '#2d1e15', light: '#a07c5b' },
      brow: { color: '#4a3324', hi: '#7a5a43', w: 0.86 },
      hair: {
        style: 'curls', p: 2.3, seed: 2024, cx: 130, cy: 106, rx: 75, ry: 77, out: '#26170e', fills: ['#4f3423', '#5b3d29', '#45301f', '#664632'], hi: '#c29670',
        front: [[186, 120], [176, 115], [164, 112], [152, 110], [140, 109], [128, 109], [116, 110], [104, 112], [94, 115], [86, 120]], frontDefault: 999,
        rEdge: [10, 13.5], rIn: [8.5, 11.5], rFront: [7, 9.4], count: 122, minD: 10, avoid: { cx: 130, cy: 168, rx: 50, ry: 62 },
        frizz: 26, frizzColor: '#6e4d34', a0: 0.62, aSpan: 1.76, edgeN: 30,
        fshadow: 'M82 118C98 110 114 110 130 112C150 112 168 116 188 124L184 134C168 126 150 122 130 123C110 122 96 124 80 130Z'
      },
      outfit: { style: 'stripes', base: '#5d5a3e', dark: '#3a3828', light: '#7a7650', line: '#14161f', collar: '#20263a', stripes: ['#283046', '#d6c9a8', '#6e6c43', '#5d4331', '#8b8f93', '#a59a6b', '#283046', '#d6c9a8', '#4b5160'] },
      earring: { x: 186.6, y: 170.6, r: 1.9, metal: 'silver', stud: true }, ko: 'eyes',
      ex: {
        smirk: { m: 'neutral', e: { open: 1, lid: true, lidAt: -3.4, look: [1.6, 1.6] }, bl: { inner: 0.4 }, br: { inner: 0.4 } },
        cool: { m: 'soft', e: { closed: 'happy' } }
      }
    },
    zendavid: {
      P: 'zd', name: 'Zendavid', face: 'oval', earDx: 1, thumb: '40 14 180 180',
      skin: { base: '#deb294', light: '#efcdb5', shade: '#c09177', deep: '#986751', line: '#6c4334' },
      lips: { base: '#b87170', dark: '#8b4a4e', light: '#d69791', inside: '#552127' },
      iris: { base: '#5a3e2b', dark: '#24170f', light: '#8a684c' },
      brow: { color: '#231915', hi: '#4f3d33', w: 0.98, lift: 1 },
      hair: { style: 'buzz', base: '#2a201b' },
      beard: { color: '#2a1f1a' },
      outfit: { style: 'knit', base: '#837c74', dark: '#5f5953', light: '#9a938b', line: '#3a3530', tee: '#d1cdc6', strap: '#19191d' },
      glasses: { style: 'round', when: 'always', koTilt: true },
      earring: { x: 187.6, y: 172, r: 3.4, metal: 'silver' }, props: { phones: true }, ko: 'eyes',
      ex: { smirk: { m: 'soft' }, cool: { m: 'soft', e: { closed: 'happy' } } }
    }
  };

  function buildChar(c) {
    var P = c.P, S = c.skin, I = c.iris, s = '';
    s += '<radialGradient id="' + P + 'SkinG" cx="44%" cy="38%" r="70%"><stop offset="0" stop-color="' + S.light + '"/><stop offset=".5" stop-color="' + S.base + '"/><stop offset="1" stop-color="' + S.shade + '"/></radialGradient>';
    s += '<linearGradient id="' + P + 'EarG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="' + S.shade + '"/><stop offset="1" stop-color="' + S.base + '"/></linearGradient>';
    s += '<radialGradient id="' + P + 'IrisG" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="' + I.light + '"/><stop offset=".55" stop-color="' + I.base + '"/><stop offset="1" stop-color="' + I.dark + '"/></radialGradient>';
    if (c.hair.style === 'quiff') s += '<linearGradient id="' + P + 'FadeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c.hair.out + '"/><stop offset=".4" stop-color="' + c.hair.body[0] + '" stop-opacity=".95"/><stop offset=".78" stop-color="' + c.hair.body[0] + '" stop-opacity=".4"/><stop offset="1" stop-color="' + c.hair.body[0] + '" stop-opacity="0"/></linearGradient>';
    s += '<clipPath id="' + P + 'FaceClip"><path d="' + faceD(c) + '"/></clipPath>';
    var st = c.hair.style;
    s += st === 'wavy' ? hairWavy(c) : st === 'quiff' ? hairQuiff(c) : st === 'buzz' ? hairBuzz(c) : hairCurls(c);
    s += outfit(c) + ears(c) + face(c) + glasses(c) + props(c) + hood(c);
    var M = mouths(c);
    EXPRS.forEach(function (x) { s += exprGroup(c, x, M); });
    return s;
  }

  function draw(id, expr, cls, vb) {
    var c = CH[id], P = c.P, H = c.hair, hoodKo = c.ko === 'hood';
    var s = '<svg class="spr spr-p spr-' + id + ' ' + (cls || '') + '" viewBox="' + (vb || '0 0 260 300') + '" data-expr="' + (expr || 'smirk') + '" data-ph="off" role="img" aria-label="' + c.name + '">';
    if (hoodKo) s += '<use class="hood" href="#' + P + 'HoodBack"/>';
    s += '<use class="' + (hoodKo ? 'nohood' : '') + '" href="#' + P + 'Back"/>';
    if (c.outfit.style === 'hoodie') s += '<use href="#' + P + 'Body"/><use class="nohood" href="#' + P + 'Collar"/><use href="#' + P + 'Neck"/>';
    else s += '<use href="#' + P + 'Neck"/><use href="#' + P + 'Body"/>';
    s += '<use href="#' + P + 'Front"/>';
    if (c.props && c.props.phones) s += '<use class="ph-neck" href="#' + P + 'PhNeck"/>';
    s += '<use class="' + (hoodKo ? 'nohood' : '') + '" href="#' + P + 'Ears"/><use href="#' + P + 'Face"/>';
    EXPRS.forEach(function (x) { s += '<use class="ex ex-' + x + '" href="#' + P + 'Ex-' + x + '"/>'; });
    if (H.fshadow || H.style === 'wavy' || H.style === 'quiff') s += '<use href="#' + P + 'FShadow"/>';
    s += '<use class="' + (hoodKo ? 'nohood' : '') + '" href="#' + P + 'Top"/>';
    if (hoodKo) s += '<use class="hood" href="#' + P + 'HairHood"/>';
    if (H.rings) s += '<use href="#' + P + 'Fringe"/>';
    if (c.glasses) {
      if (c.glasses.when === 'always') {
        s += '<use class="' + (c.glasses.koTilt ? 'gl-norm' : '') + '" href="#' + P + 'Gl"/>';
        if (c.glasses.koTilt) s += '<use class="gl-ko" href="#' + P + 'GlKo"/>';
      } else s += '<use class="cond ' + c.glasses.when.map(function (w) { return 'on-' + w; }).join(' ') + '" href="#' + P + 'Gl"/>';
    }
    if (hoodKo) s += '<use class="hood" href="#' + P + 'HoodFront"/>';
    if (c.props && c.props.phones) s += '<use class="ph-on" href="#' + P + 'PhOn"/>';
    return s + '</svg>';
  }

  /* ================= Esame di Controlli ================= */
  function esameParts() {
    var s = '';
    s += '<linearGradient id="eShadeG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#e9e5d6"/></linearGradient>';
    s += '<clipPath id="eSheetClip"><path d="M44 22L142 16L162 36L166 176L50 182Z"/></clipPath>';
    var g = '<g id="eBody">';
    g += '<path d="M48 120C34 124 26 112 22 100" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>';
    g += '<circle cx="21" cy="98" r="4.6" fill="#fffdf6" stroke="' + INK + '" stroke-width="2.4"/>';
    g += '<path d="M164 110C178 106 184 92 186 80" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>';
    g += '<g transform="rotate(28 186 74)"><rect x="181.5" y="40" width="9" height="40" rx="2" fill="' + RED + '" stroke="' + INK + '" stroke-width="2"/><path d="M181.5 80L186 90L190.5 80Z" fill="#f4e3c8" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/><path d="M184.6 87L186 90L187.4 87Z" fill="' + RED + '"/><rect x="181.5" y="40" width="9" height="7" fill="' + INK + '"/></g>';
    g += '<circle cx="186" cy="80" r="5" fill="#fffdf6" stroke="' + INK + '" stroke-width="2.4"/>';
    g += '<path d="M44 22L142 16L162 36L166 176L50 182Z" fill="url(#eShadeG)"/>';
    g += '<g clip-path="url(#eSheetClip)" stroke="#8fb1d8" stroke-width=".7" opacity=".7">';
    for (var x = 46; x < 170; x += 7) g += '<path d="M' + x + ' 10L' + (x + 4) + ' 190"/>';
    for (var y = 22; y < 190; y += 7) g += '<path d="M40 ' + y + 'L170 ' + (y - 2) + '"/>';
    g += '</g>';
    g += '<path d="M62 21L67 181" stroke="#e0574a" stroke-width="1.2" opacity=".8"/>';
    g += '<path d="M142 16L144 36L162 36" fill="#ddd7c4" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>';
    g += '<path d="M44 22L142 16L162 36L166 176L50 182Z" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>';
    g += '<text x="72" y="37" font-family="' + HAND + '" font-size="11.5" fill="' + BLUE + '" transform="rotate(-3.4 72 37)">CONTROLLI</text>';
    g += '<text x="73" y="49" font-family="' + HAND + '" font-size="8.4" fill="' + BLUE + '" transform="rotate(-3.4 73 49)">Appello · 2 ore</text>';
    g += '<g transform="rotate(-3 110 140)"><path d="M76 128L76 168L154 168" fill="none" stroke="' + INK + '" stroke-width="1.6"/>';
    g += '<path d="M78 136L104 136C112 136 114 124 118 124C122 124 124 142 132 150L152 164" fill="none" stroke="' + BLUE + '" stroke-width="2"/>';
    g += '<path d="M78 146L108 146C116 146 120 158 130 160L152 162" fill="none" stroke="' + RED + '" stroke-width="1.6" stroke-dasharray="3 2.4"/>';
    g += '<text x="80" y="126" font-family="' + HAND + '" font-size="7.6" fill="' + INK + '">|G(jω)|</text></g>';
    g += '<ellipse cx="146" cy="128" rx="10" ry="12" fill="none" stroke="' + RED + '" stroke-width="2" transform="rotate(-12 146 128)"/>';
    g += '<text x="141" y="133" font-family="' + HAND + '" font-size="15" fill="' + RED + '">?</text>';
    g += '<text x="56" y="172" font-family="' + HAND + '" font-size="12" fill="' + RED + '" transform="rotate(-8 56 172)">−3</text>';
    g += '</g>';
    s += g;
    var eyes = function (look) {
      return '<ellipse cx="88" cy="82" rx="12" ry="13" fill="#fff" stroke="' + INK + '" stroke-width="2.4"/><ellipse cx="124" cy="80" rx="12" ry="13" fill="#fff" stroke="' + INK + '" stroke-width="2.4"/>' +
        '<circle cx="' + (84 + look) + '" cy="86" r="5.2" fill="' + INK + '"/><circle cx="' + (120 + look) + '" cy="84" r="5.2" fill="' + INK + '"/>' +
        '<circle cx="' + (82.6 + look) + '" cy="84.4" r="1.5" fill="#fff"/><circle cx="' + (118.6 + look) + '" cy="82.4" r="1.5" fill="#fff"/>';
    };
    s += '<g id="eFace-idle">' + eyes(0) + '<path d="M72 66L100 74M140 62L112 72" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>' +
      '<path d="M80 106L88 100L96 107L104 100L112 106L120 99L128 105L134 101" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></g>';
    s += '<g id="eFace-angry">' + eyes(-2) + '<path d="M70 62L102 76M142 58L110 74" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M76 102C90 96 120 94 136 100C128 114 88 116 76 102Z" fill="#7a1d25" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
      '<path d="M80 102L86 108L92 100L98 108L104 99L110 107L116 98L122 106L128 99L133 103" fill="#fff" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/></g>';
    s += '<g id="eFace-hurt"><path d="M78 78L96 86M78 90L96 82M114 76L132 84M114 88L132 80" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
      '<path d="M74 68L98 72M140 64L116 70" stroke="' + INK + '" stroke-width="4.4" stroke-linecap="round"/><path d="M86 108C94 102 112 100 124 106" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/></g>';
    s += '<g id="eFace-ko"><path d="M80 78L94 90M94 78L80 90M116 76L130 88M130 76L116 88" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/>' +
      '<path d="M84 106C92 110 100 102 108 106C116 110 122 102 128 106" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/></g>';
    return s;
  }
  function robotParts() {
    return '<g id="rBot"><path d="M30 6L30 14" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/><circle cx="30" cy="5" r="3.4" fill="#e0574a" stroke="' + INK + '" stroke-width="2"/>' +
      '<rect x="14" y="14" width="32" height="24" rx="9" fill="#eef1f4" stroke="' + INK + '" stroke-width="2.6"/><rect x="19" y="20" width="22" height="11" rx="5.5" fill="' + INK + '"/><circle cx="25.5" cy="25.5" r="2.4" fill="#7fe3ff"/><circle cx="34.5" cy="25.5" r="2.4" fill="#7fe3ff"/>' +
      '<rect x="16" y="41" width="28" height="22" rx="6" fill="#eef1f4" stroke="' + INK + '" stroke-width="2.6"/><rect x="24" y="47" width="12" height="7" rx="2" fill="#7c5cff" stroke="' + INK + '" stroke-width="1.6"/>' +
      '<path d="M16 46L7 56M44 46L53 56" stroke="' + INK + '" stroke-width="4.6" stroke-linecap="round"/><path d="M16 46L7 56M44 46L53 56" stroke="#eef1f4" stroke-width="2" stroke-linecap="round"/>' +
      '<path d="M23 63L21 76M37 63L39 76" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M23 63L21 76M37 63L39 76" stroke="#eef1f4" stroke-width="2.2" stroke-linecap="round"/>' +
      '<path d="M15 77L26 77M34 77L45 77" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/></g>';
  }

  var installed = false;
  function install(doc) {
    doc = doc || document;
    if (installed || doc.getElementById('spr-defs')) { installed = true; return; }
    var defs = SHARED +
      '<linearGradient id="gBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d9a3"/><stop offset=".5" stop-color="#caa56a"/><stop offset="1" stop-color="#8b6b3c"/></linearGradient>' +
      '<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbe7a8"/><stop offset=".5" stop-color="#e3bf6a"/><stop offset="1" stop-color="#9c7629"/></linearGradient>' +
      '<linearGradient id="gSilver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#c9ced6"/><stop offset="1" stop-color="#7d838c"/></linearGradient>' +
      '<linearGradient id="gLensDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f3646"/><stop offset="1" stop-color="#0d0f15"/></linearGradient>';
    for (var id in CH) defs += buildChar(CH[id]);
    defs += esameParts() + robotParts();
    var holder = doc.createElement('div');
    holder.innerHTML = '<svg id="spr-defs" xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true" focusable="false"><defs>' + defs + '</defs></svg>';
    doc.body.insertBefore(holder.firstChild, doc.body.firstChild);
    installed = true;
  }
  function esame(face, cls) {
    return '<svg class="spr spr-e ' + (cls || '') + '" viewBox="0 0 200 200" data-expr="smirk" data-face="' + (face || 'idle') + '" role="img" aria-label="Esame di Controlli">' +
      '<use href="#eBody"/><use class="ef ef-idle" href="#eFace-idle"/><use class="ef ef-angry" href="#eFace-angry"/><use class="ef ef-hurt" href="#eFace-hurt"/><use class="ef ef-ko" href="#eFace-ko"/></svg>';
  }
  function robot(cls) { return '<svg class="spr spr-r ' + (cls || '') + '" viewBox="0 0 60 82" aria-hidden="true"><use href="#rBot"/></svg>'; }

  var CSS = '.spr-p .ex,.spr-p .hood,.spr-p .cond,.spr-p .gl-ko,.spr-p .ph-on{display:none}' +
    EXPRS.map(function (x) { return '.spr-p[data-expr="' + x + '"] .ex-' + x + ',.spr-p[data-expr="' + x + '"] .on-' + x; }).join(',') + '{display:inline}' +
    '.spr-p[data-expr="sleepy"] .hood,.spr-p[data-expr="sleepy"] .gl-ko{display:inline}.spr-p[data-expr="sleepy"] .nohood,.spr-p[data-expr="sleepy"] .gl-norm{display:none}' +
    '.spr-p[data-ph="on"] .ph-on,.spr-p[data-expr="cool"] .ph-on{display:inline}.spr-p[data-ph="on"] .ph-neck,.spr-p[data-expr="cool"] .ph-neck{display:none}' +
    '.spr-e .ef{display:none}.spr-e[data-face="idle"] .ef-idle,.spr-e[data-face="angry"] .ef-angry,.spr-e[data-face="hurt"] .ef-hurt,.spr-e[data-face="ko"] .ef-ko{display:inline}';

  G.SPR = {
    install: install, person: draw, esame: esame, robot: robot, CSS: CSS, EXPRS: EXPRS,
    CHARS: Object.keys(CH), thumb: function (id) { return CH[id] ? CH[id].thumb : '0 0 200 200'; },
    antonio: function (expr, cls, vb) { return draw('antonio', expr, cls, vb); }
  };
})(typeof window !== 'undefined' ? window : globalThis);

