/* The buildings of the 12 November 2026 revision (Antonio's photos of via Abate Tosti and of Largo Paone):
   the palazzi of the cortine, wall to wall along the streets of the centre and of Mola; the Torre di Mola, the
   massive round tower of the Angevin castle over the little harbour; the anchor in the square at its foot.
   Same pen-and-highlighter style as objects.ts; drawn from the top of the footprint (y = 0) down to its bottom (h),
   and up to `up` px above it. */
import type { Palette } from './palette';
import { T, rr, hash, fillStroke, circle, ell, poly, blobs, plaque, type Ctx } from './draw';
import type { ObjOpts } from './objects';

/* the plaster of the borgo: salmon pink, ochre, warm yellow, peach, terracotta, cream (the photo of via Abate Tosti) */
var WALLS = ['wall-f', 'wall-g', 'wall-b', 'wall-c', 'wall-h', 'wall-d'];
var GLASS = '#bfe3ff', DARK_GLASS = '#a8c4dc', DARK = '#20263a';
/** what a shop on a ground floor looks like: the colour of its awning, and its own sign when it has one */
var SHOP_AWNING: Record<string, string> = {
  bottega: '#e9765f', pharmacy: '#2c9a55', bookshop: '#3f7ccf', fishmonger: '#3f9fc4', newsstand: '#2c9a55', market: '#ffd166',
  bar: '#ff8fc1', tobacconist: '#3d5a80', winebar: '#7a2e3e', barber: '#e63946', pub: '#7a4a2c', bakery: '#ffd166', trattoria: '#2d6fb3'
};

/* a french window with its shutters, its stone frame and, below it, a balcony with an iron railing (or a sill) */
function window1(c: Ctx, P: Palette, cx: number, y: number, o: { shutter: string; open: number; balcony: boolean; lit: boolean; flowers: number; laundry: number; v: number }) {
  var ww = 10, wh = 15, x = cx - ww / 2;
  /* the frame, a little lighter than the wall */
  rr(c, x - 2, y - 2, ww + 4, wh + 3, 1.5); fillStroke(c, P.wall, P.ink, 1);
  rr(c, x, y, ww, wh, 1); fillStroke(c, o.lit ? GLASS : DARK_GLASS, P.ink, 1.1);
  c.strokeStyle = P.ink; c.lineWidth = 0.8; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y + wh); c.stroke();
  /* the shutters: open against the wall, half closed, or closed (louvres) */
  if (o.open === 2) {
    rr(c, x, y, ww, wh, 1); fillStroke(c, o.shutter, P.ink, 1.1);
    c.strokeStyle = P.ink; c.globalAlpha = 0.35; c.lineWidth = 0.7;
    for (var k = 2; k < wh - 1; k += 2.5) { c.beginPath(); c.moveTo(x + 1, y + k); c.lineTo(x + ww - 1, y + k); c.stroke(); }
    c.globalAlpha = 1; c.beginPath(); c.moveTo(cx, y); c.lineTo(cx, y + wh); c.strokeStyle = P.ink; c.lineWidth = 0.8; c.stroke();
  } else {
    [x - 5, x + ww + 1].forEach(function (sx, i) {
      if (o.open === 1 && i === 1) { rr(c, cx, y, ww / 2, wh, 0.8); fillStroke(c, o.shutter, P.ink, 0.9); return; }
      rr(c, sx, y, 4, wh, 0.8); fillStroke(c, o.shutter, P.ink, 0.9);
    });
  }
  if (o.balcony) {
    /* the slab, the railing (posts and the hand rail), flowers or the washing hung out to dry */
    rr(c, cx - 10, y + wh + 1, 20, 3, 1); fillStroke(c, P.wall, P.ink, 1);
    c.strokeStyle = P.ink; c.lineWidth = 1.1;
    c.beginPath(); c.moveTo(cx - 9.5, y + wh - 5); c.lineTo(cx + 9.5, y + wh - 5); c.stroke();
    c.lineWidth = 0.8; c.beginPath();
    for (var px = cx - 9; px <= cx + 9.5; px += 3) { c.moveTo(px, y + wh - 5); c.lineTo(px, y + wh + 1); }
    c.stroke();
    if (o.flowers) {
      blobs(c, [[cx - 7, y + wh - 6, 2.4], [cx - 3.5, y + wh - 7, 2.2]], P.leaf, P.ink, 0.9);
      c.fillStyle = o.flowers === 1 ? P['flower-a'] : '#e63946'; circle(c, cx - 6, y + wh - 7.5, 1.2); c.fill(); circle(c, cx - 3, y + wh - 8, 1); c.fill();
    }
    if (o.laundry) {
      /* a line across, under the slab, and three pieces of washing */
      c.strokeStyle = P.ink; c.lineWidth = 0.7; c.beginPath(); c.moveTo(cx - 10, y + wh + 5); c.lineTo(cx + 10, y + wh + 5); c.stroke();
      var cols = ['#ffffff', P['tent-a'], P['tent-b'], P['flower-a'], '#ffd166'];
      for (var j = 0; j < 3; j++) { rr(c, cx - 9 + j * 6.5, y + wh + 5, 5, 5 + (j % 2) * 2, 0.8); fillStroke(c, cols[(o.v + j) % cols.length], P.ink, 0.7); }
    }
  } else {
    rr(c, x - 2, y + wh, ww + 4, 2.5, 1); fillStroke(c, P.wall, P.ink, 0.9);
  }
}
/* an arch of the ground floor, framed in stone: what is inside is drawn by `fill` */
function arch(c: Ctx, P: Palette, x: number, bot: number, aw: number, ah: number, fill: string) {
  var r = aw / 2;
  c.beginPath(); c.moveTo(x, bot); c.lineTo(x, bot - ah + r); c.arc(x + r, bot - ah + r, r, Math.PI, 0); c.lineTo(x + aw, bot); c.closePath();
  fillStroke(c, fill, P.ink, 1.4);
  c.beginPath(); c.arc(x + r, bot - ah + r, r + 2.4, Math.PI, 0); c.strokeStyle = P.stone2; c.lineWidth = 2.6; c.stroke();
  c.beginPath(); c.arc(x + r, bot - ah + r, r + 3.8, Math.PI, 0); c.strokeStyle = P.ink; c.lineWidth = 0.8; c.stroke();
}
/* an awning with stripes, over a shop window */
function awning(c: Ctx, P: Palette, x: number, y: number, aw: number, col: string) {
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + aw, y); c.lineTo(x + aw + 2, y + 7); c.lineTo(x - 2, y + 7); c.closePath();
  fillStroke(c, col, P.ink, 1.2);
  c.fillStyle = '#ffffff'; c.globalAlpha = 0.85;
  for (var k = 0; k < 4; k++) c.fillRect(x + 2 + k * aw / 4, y + 1, aw / 8, 5.5);
  c.globalAlpha = 1;
  c.strokeStyle = P.ink; c.lineWidth = 0.9; c.beginPath();
  for (k = 0; k <= 5; k++) { var sx = x - 2 + k * (aw + 4) / 5; c.moveTo(sx, y + 7); c.arc(sx + (aw + 4) / 10, y + 7, (aw + 4) / 10, Math.PI, 0, true); }
  c.stroke();
}
/* the ground floor of a palazzo: column by column, the door of the palazzo (or of its shop) and the arches beside it */
function groundFloor(c: Ctx, P: Palette, w: number, h: number, gt: number, dx: number, look: string, o: ObjOpts, v: number) {
  var bot = h - 6, cols = Math.round(w / T), shop = look !== 'home', aw = SHOP_AWNING[look] || SHOP_AWNING.bottega;
  /* the stone base along the street */
  c.fillStyle = P.stone2; c.fillRect(3, h - 8, w - 6, 6);
  c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(3, h - 8); c.lineTo(w - 3, h - 8); c.stroke();
  if (look === 'pub') {
    /* Morgana: a dark wooden front across the ground floor, warm windows, the string of lights, the mug */
    rr(c, 4, gt + 3, w - 8, bot - gt - 1, 2); fillStroke(c, P.wood2, P.ink, 1.5);
    c.strokeStyle = P.wood; c.lineWidth = 1; for (var y = gt + 8; y < bot - 2; y += 6) { c.beginPath(); c.moveTo(6, y); c.lineTo(w - 6, y); c.stroke(); }
    c.strokeStyle = P.ink; c.lineWidth = 0.9; c.beginPath(); c.moveTo(4, gt + 4);
    for (var k = 0; k <= 6; k++) c.quadraticCurveTo(4 + (k - 0.5) * (w - 8) / 6, gt + 9, 4 + k * (w - 8) / 6, gt + 4);
    c.stroke();
    for (k = 0; k < 6; k++) { circle(c, 4 + (k + 0.5) * (w - 8) / 6, gt + 6.5, 1.6); c.fillStyle = k % 2 ? '#ffe9a8' : '#ffb36b'; c.fill(); }
  }
  for (var i = 0; i < cols; i++) {
    var x0 = i * T, door = x0 === dx;
    if (door) {
      if (look === 'home' || look === 'alto') {
        /* the portone: wood, arched, studded, in its stone frame */
        arch(c, P, x0 + 8, bot, T - 16, 23, v % 2 ? P.wood2 : P['shutter-a']);
        c.strokeStyle = P.ink; c.lineWidth = 0.8; c.beginPath(); c.moveTo(x0 + T / 2, bot - 17); c.lineTo(x0 + T / 2, bot); c.stroke();
        circle(c, x0 + T / 2 - 2.5, bot - 8, 1); c.fillStyle = P.ink; c.fill(); circle(c, x0 + T / 2 + 2.5, bot - 8, 1); c.fill();
      } else {
        /* the shop door: glass in a wooden frame, under the awning */
        arch(c, P, x0 + 7, bot, T - 14, 23, look === 'pub' || look === 'trattoria' ? '#ffd98a' : GLASS);
        c.strokeStyle = P.ink; c.lineWidth = 0.9; c.beginPath(); c.moveTo(x0 + 7, bot - 12); c.lineTo(x0 + T - 7, bot - 12); c.stroke();
        circle(c, x0 + T - 11, bot - 6, 1.2); c.fillStyle = P.ink; c.fill();
        if (look !== 'pub') awning(c, P, x0 + 6, gt + 2, T - 12, aw);
      }
      continue;
    }
    if (shop) {
      /* a shop window under an arch */
      arch(c, P, x0 + 5, bot, T - 10, 21, look === 'pub' || look === 'trattoria' ? '#ffd98a' : look === 'winebar' ? '#ffe2a8' : GLASS);
      if (look === 'winebar') for (k = 0; k < 3; k++) { var bx = x0 + 9 + k * 5, bc = ['#5d2a3a', '#2f5a3a', '#c9a23a'][k]; rr(c, bx, bot - 11, 3.5, 9, 1); fillStroke(c, bc, P.ink, 0.7); rr(c, bx + 1, bot - 14, 1.5, 4, 0.6); fillStroke(c, bc, P.ink, 0.6); }
      else if (look === 'tobacconist' || look === 'newsstand' || look === 'bookshop') for (k = 0; k < 3; k++) { rr(c, x0 + 9 + k * 5, bot - 10 - (k % 2) * 4, 4, 5, 0.8); fillStroke(c, ['#ffd166', '#ff9a8b', '#9ec5ff'][k], P.ink, 0.7); }
      else if (look === 'fishmonger' || look === 'market') { rr(c, x0 + 7, bot - 6, T - 14, 4, 1); fillStroke(c, '#ffffff', P.ink, 0.8); ell(c, x0 + 13, bot - 8, 3.5, 1.6); fillStroke(c, P.sea2, P.ink, 0.7); ell(c, x0 + 20, bot - 8, 3.5, 1.6); fillStroke(c, P['flower-b'], P.ink, 0.7); }
      else if (look === 'pharmacy') { c.fillStyle = '#2c9a55'; c.fillRect(x0 + T / 2 - 1.5, bot - 15, 3, 9); c.fillRect(x0 + T / 2 - 4.5, bot - 12, 9, 3); }
      else if (look === 'trattoria' && i % 2 === (dx / T + 1) % 2) {
        /* a table out on the quay: the checked cloth, two chairs, a carafe of wine */
        rr(c, x0 + 6, bot - 9, T - 12, 6, 1.5); fillStroke(c, '#fffdf6', P.ink, 1);
        c.fillStyle = '#d14b3a'; for (k = 0; k < 5; k++) c.fillRect(x0 + 7 + k * 4, bot - 8.5 + (k % 2) * 2.5, 2, 2);
        rr(c, x0 + 2, bot - 8, 4, 8, 1); fillStroke(c, P.wood, P.ink, 0.9); rr(c, x0 + T - 6, bot - 8, 4, 8, 1); fillStroke(c, P.wood, P.ink, 0.9);
        rr(c, x0 + T / 2 - 1.5, bot - 14, 3, 5, 1); fillStroke(c, '#7a2e3e', P.ink, 0.7);
      }
      if (look !== 'pub') awning(c, P, x0 + 5, gt + 2, T - 10, aw);
    } else if ((v + i) % 3 === 0) {
      /* a garage or a closed shop: the rolling shutter down */
      arch(c, P, x0 + 5, bot, T - 10, 21, P.chrome);
      c.strokeStyle = P.ink; c.globalAlpha = 0.35; c.lineWidth = 0.8;
      for (k = bot - 14; k < bot; k += 2.5) { c.beginPath(); c.moveTo(x0 + 6, k); c.lineTo(x0 + T - 6, k); c.stroke(); }
      c.globalAlpha = 1;
    } else {
      /* a window with its iron grate, and a big pot of plants under it */
      rr(c, x0 + 10, gt + 7, 12, 12, 1); fillStroke(c, DARK_GLASS, P.ink, 1.1);
      c.strokeStyle = P.ink; c.lineWidth = 0.8; c.beginPath();
      for (k = 1; k < 4; k++) { c.moveTo(x0 + 10 + k * 3, gt + 7); c.lineTo(x0 + 10 + k * 3, gt + 19); }
      c.moveTo(x0 + 10, gt + 13); c.lineTo(x0 + 22, gt + 13); c.stroke();
      rr(c, x0 + 9, bot - 9, 14, 9, 1.5); fillStroke(c, '#5b6170', P.ink, 1.1);
      blobs(c, [[x0 + 12, bot - 12, 3.4], [x0 + 16, bot - 14, 3.8], [x0 + 20, bot - 12, 3.2]], P.leaf2, P.ink, 1);
    }
  }
  /* the shop's own sign by its door */
  var cx = dx + T / 2, side = dx + T + 2 > w - 4 ? dx - 7 : dx + T + 1;
  if (look === 'tobacconist') {
    var tx = side + 2, ty = gt + 4;
    rr(c, tx - 6, ty, 12, 14, 1.5); fillStroke(c, DARK, P.ink, 1.1);
    c.fillStyle = '#ffffff'; c.fillRect(tx - 4, ty + 3, 8, 2.4); c.fillRect(tx - 1.2, ty + 3, 2.4, 8.5);
  } else if (look === 'barber') {
    var px = side, py = gt + 6;
    c.save(); rr(c, px, py, 5, 18, 2.5); c.clip();
    c.fillStyle = '#ffffff'; c.fillRect(px, py, 5, 18);
    for (k = -1; k < 5; k++) { c.fillStyle = k % 2 ? '#3d5a80' : '#e63946'; c.beginPath(); c.moveTo(px, py + k * 5); c.lineTo(px + 5, py + k * 5 - 3.5); c.lineTo(px + 5, py + k * 5 - 1); c.lineTo(px, py + k * 5 + 2.5); c.closePath(); c.fill(); }
    c.restore(); rr(c, px, py, 5, 18, 2.5); c.strokeStyle = P.ink; c.lineWidth = 1; c.stroke();
  } else if (look === 'pub') {
    var mx = side + 3, my = gt + 8;
    rr(c, mx - 5, my - 5, 10, 11, 2); fillStroke(c, '#ffd166', P.ink, 1.1);
    rr(c, mx - 6, my - 7, 12, 3.5, 1.5); fillStroke(c, '#fffdf6', P.ink, 1);
    c.beginPath(); c.arc(mx + 5, my + 0.5, 3, -Math.PI / 2, Math.PI / 2); c.strokeStyle = P.ink; c.lineWidth = 1.1; c.stroke();
  } else if (look === 'trattoria') {
    /* the blackboard of the day: frittura di paranza, spaghetti alle vongole */
    rr(c, side - 1, bot - 19, 9, 13, 1); fillStroke(c, '#2f3a34', P.wood, 1.4);
    c.strokeStyle = '#fffdf6'; c.lineWidth = 0.7; for (k = 0; k < 3; k++) { c.beginPath(); c.moveTo(side + 1, bot - 16 + k * 3.5); c.lineTo(side + 6 - (k % 2) * 1.5, bot - 16 + k * 3.5); c.stroke(); }
    c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(side, bot - 6); c.lineTo(side - 1, bot); c.moveTo(side + 7, bot - 6); c.lineTo(side + 8, bot); c.stroke();
  } else if (look === 'winebar') {
    ell(c, side + 3, bot - 6, 4.5, 6); fillStroke(c, P.wood, P.ink, 1.1);
    c.strokeStyle = P.ink; c.lineWidth = 0.8; [-3, 3].forEach(function (d) { c.beginPath(); c.moveTo(side - 1.5, bot - 6 + d); c.lineTo(side + 7.5, bot - 6 + d); c.stroke(); });
  }
  if (o.label) plaque(c, P, o.label, Math.max(26, Math.min(w - 26, cx)), gt - 2, Math.max(48, w - 6), 11);
}
/* a lamp on its iron arm, out of the wall (its glass lights up at night with the windows) */
function wallLamp(c: Ctx, P: Palette, x: number, y: number, dir: number) {
  c.strokeStyle = P.ink; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(x, y); c.lineTo(x + dir * 8, y); c.quadraticCurveTo(x + dir * 10, y, x + dir * 10, y + 2); c.stroke();
  c.beginPath(); c.moveTo(x, y + 4); c.lineTo(x + dir * 5, y); c.stroke();
  poly(c, [[x + dir * 10 - 3.5, y + 2], [x + dir * 10 + 3.5, y + 2], [x + dir * 10 + 2.5, y + 9], [x + dir * 10 - 2.5, y + 9]]);
  fillStroke(c, '#e8f5ff', P.ink, 1);
  poly(c, [[x + dir * 10 - 4.5, y + 2], [x + dir * 10, y - 1.5], [x + dir * 10 + 4.5, y + 2]]); fillStroke(c, DARK, P.ink, 0.9);
}

/** a palazzo of a cortina (data/maps/formia-places.ts and the ROWS of tools/formia/network.ts) */
export function cortina(c: Ctx, w: number, h: number, P: Palette, o: ObjOpts) {
  var v = o.v || 0, up = o.up == null ? T : o.up, look = o.look || 'home', alto = look === 'alto';
  var dx = o.doorX != null && o.x != null ? (o.doorX - o.x) * T : Math.floor(w / T / 2) * T;
  var GROUND = 31, FLOOR = alto ? 21 : 24, CORNICE = 7;
  var wall = alto ? (v % 2 ? P.wall : P['wall-e']) : P[WALLS[v % WALLS.length]] || P.wall;
  var shutter = alto ? P.chrome : Math.floor(v / 6) % 3 === 0 ? P['shutter-b'] : P['shutter-a'];
  /* the skyline is not straight: each palazzo has its own height */
  var stagger = alto ? 0 : (Math.floor(v / 3) % 3) * 4, top = -up + stagger;
  var groundTop = h - 2 - GROUND;
  var n = Math.max(1, Math.min(alto ? 13 : 5, Math.floor((groundTop - CORNICE - top - 10) / FLOOR)));
  var floorsTop = groundTop - n * FLOOR, corniceTop = floorsTop - CORNICE;
  ell(c, w / 2, h - 1, w / 2, 5); c.fillStyle = P.shadow; c.fill();

  /* the roof, seen from above: a flat terrace with its parapet, or tiles */
  var rb = corniceTop - top, tiles = !alto && v % 4 === 1;
  if (rb > 3) {
    rr(c, 2, top, w - 4, rb + 3, 2); fillStroke(c, tiles ? (o.roof || P['roof-a']) : P.stone, P.ink, 1.6);
    if (tiles) {
      c.strokeStyle = P.ink; c.globalAlpha = 0.3; c.lineWidth = 1;
      for (var y = top + 4; y < corniceTop; y += 4) { c.beginPath(); c.moveTo(5, y); c.lineTo(w - 5, y); c.stroke(); }
      for (var x = 7; x < w - 4; x += 5) { c.beginPath(); c.moveTo(x, top + 2); c.lineTo(x, corniceTop); c.stroke(); }
      c.globalAlpha = 1;
    } else {
      rr(c, 5, top + 3, w - 10, rb - 3, 1.5); c.strokeStyle = P.stone2; c.lineWidth = 1.2; c.stroke();
      if (rb > 12) {
        /* what is up there: the water tank, the aerial, the little house of the stairs, the washing, the plants */
        var tx = 8 + hash(v, 1, 300) * (w - 30);
        rr(c, tx, top + 4, 11, 8, 3); fillStroke(c, P.stone2, P.ink, 1.1);
        c.strokeStyle = P.ink; c.lineWidth = 1; var ax = w - 10 - hash(v, 2, 301) * 10;
        c.beginPath(); c.moveTo(ax, corniceTop - 2); c.lineTo(ax, top + 1); c.moveTo(ax - 4, top + 4); c.lineTo(ax + 4, top + 4); c.moveTo(ax - 3, top + 7); c.lineTo(ax + 3, top + 7); c.stroke();
        if (rb > 24 && w >= T * 2) { var hx = w / 2 - 8 + (hash(v, 3, 302) - 0.5) * 14; rr(c, hx, top + rb - 18, 16, 14, 1.5); fillStroke(c, wall, P.ink, 1.2); rr(c, hx + 5, top + rb - 13, 6, 9, 1); fillStroke(c, P.wood2, P.ink, 0.9); }
        if (v % 5 === 0 && rb > 18) {
          c.strokeStyle = P.ink; c.lineWidth = 0.7; c.beginPath(); c.moveTo(7, top + rb - 9); c.lineTo(w - 7, top + rb - 11); c.stroke();
          for (var j = 0; j * 7 + 9 < w - 8; j += 2) { rr(c, 9 + j * 7, top + rb - 10 - j * 0.1, 5, 6, 0.8); fillStroke(c, ['#ffffff', P['tent-a'], P['tent-b'], P['flower-b']][j % 4], P.ink, 0.6); }
        } else if (v % 5 === 2) blobs(c, [[w - 16, top + rb - 6, 3.4], [w - 11, top + rb - 7, 3]], P.leaf, P.ink, 1);
      }
    }
  }

  /* the front: plaster, the cornice on top, the string course over the shops */
  rr(c, 2, corniceTop + 2, w - 4, h - 4 - corniceTop, 1.5); fillStroke(c, wall, P.ink, 1.8);
  if (!alto) {
    /* the pilasters at the corners, where one palazzo meets the next */
    c.fillStyle = P.wall; c.globalAlpha = 0.55; c.fillRect(3, corniceTop + 3, 3, groundTop - corniceTop - 3); c.fillRect(w - 6, corniceTop + 3, 3, groundTop - corniceTop - 3); c.globalAlpha = 1;
  }
  rr(c, 0, corniceTop, w, CORNICE, 1.5); fillStroke(c, P.wall, P.ink, 1.4);
  c.strokeStyle = P.ink; c.lineWidth = 0.7; c.globalAlpha = 0.5;
  for (x = 4; x < w - 2; x += 4) { c.beginPath(); c.moveTo(x, corniceTop + CORNICE); c.lineTo(x, corniceTop + CORNICE + 2); c.stroke(); }
  c.globalAlpha = 1;

  /* the floors */
  var cols = Math.round(w / T);
  for (var f = 0; f < n; f++) {
    var fy = floorsTop + f * FLOOR;
    if (alto) {
      /* the tall one of Largo Paone: a balcony all along every floor, wide windows */
      for (var k = 0; k < cols; k++) {
        var wx = k * T + 6;
        rr(c, wx, fy + 3, T - 12, 10, 1); fillStroke(c, hash(v, f * 7 + k, 310) < 0.75 ? GLASS : DARK_GLASS, P.ink, 1);
        c.strokeStyle = P.ink; c.lineWidth = 0.7; c.beginPath(); c.moveTo(wx + (T - 12) / 2, fy + 3); c.lineTo(wx + (T - 12) / 2, fy + 13); c.stroke();
        if (hash(v, f * 5 + k, 311) < 0.3) { rr(c, wx, fy + 3, T - 12, 5, 1); fillStroke(c, P['tent-b'], P.ink, 0.8); }
      }
      rr(c, 3, fy + 14, w - 6, 3, 1); fillStroke(c, P.wall, P.ink, 1);
      c.strokeStyle = P.ink; c.lineWidth = 1; c.beginPath(); c.moveTo(4, fy + 10); c.lineTo(w - 4, fy + 10); c.stroke();
      c.lineWidth = 0.6; c.beginPath(); for (x = 5; x < w - 4; x += 3) { c.moveTo(x, fy + 10); c.lineTo(x, fy + 14); } c.stroke();
      continue;
    }
    for (k = 0; k < cols; k++) {
      var s1 = hash(v, f * 11 + k, 320), s2 = hash(v, f * 13 + k, 321);
      window1(c, P, k * T + T / 2, fy + 4, {
        shutter: shutter, open: s1 < 0.6 ? 0 : s1 < 0.82 ? 1 : 2, balcony: f < n - 1 ? s2 < 0.8 : s2 < 0.35, lit: s1 < 0.7,
        flowers: s2 < 0.3 ? 1 : s2 > 0.9 ? 2 : 0, laundry: f < n - 1 && hash(v, f + k, 322) < 0.18 ? 1 : 0, v: v + f + k
      });
    }
  }
  /* a drainpipe down one corner */
  if (!alto && v % 3 !== 1) { var gx = v % 2 ? w - 8 : 7; c.strokeStyle = P.clay; c.lineWidth = 2; c.beginPath(); c.moveTo(gx, corniceTop + CORNICE); c.lineTo(gx, groundTop); c.stroke(); }
  rr(c, 1, groundTop - 3, w - 2, 4, 1); fillStroke(c, P.wall, P.ink, 1);
  groundFloor(c, P, w, h, groundTop, dx, look === 'bottega' ? 'bottega' : look, o, v);
  /* a lamp on the wall, now and then */
  if (!alto && v % 3 === 0) wallLamp(c, P, dx > w / 2 ? 4 : w - 4, groundTop - 12, dx > w / 2 ? 1 : -1);
}

/** the Torre di Mola: the round keep of the Angevin castle (after 1289), 27 metres high and 15 across, crenellated on
    a crown of corbels; the stone portal at its foot and a piece of the castle wall with its merlons */
export function castello(c: Ctx, w: number, h: number, P: Palette, o: ObjOpts) {
  var up = o.up == null ? T * 5 : o.up, cx = w / 2 + 6, rx = w * 0.36, x0 = cx - rx, x1 = cx + rx, bot = h - 8, ry = 9;
  var crown = -up + 22, body = crown + 16;
  ell(c, cx, bot + 4, rx + 14, 9); c.fillStyle = P.shadow; c.fill();
  /* the castle wall on the left, lower, with its merlons and a walk on top */
  var wt = h - T * 1.35;
  rr(c, 2, wt, x0 + 4, bot - wt + 4, 1.5); fillStroke(c, P.rock, P.ink, 1.6);
  for (var k = 0; k < 3; k++) { rr(c, 3 + k * ((x0 - 2) / 3), wt - 7, (x0 - 2) / 3 - 3, 8, 1); fillStroke(c, P.rock, P.ink, 1.2); }
  c.strokeStyle = P.rock2; c.lineWidth = 1;
  for (var y = wt + 7; y < bot; y += 7) { c.beginPath(); c.moveTo(4, y); c.lineTo(x0 + 3, y); c.stroke(); }
  /* the tower: a battered foot (the scarp), then the drum */
  c.beginPath(); c.moveTo(x0 - 7, bot); c.lineTo(x0, bot - 22); c.lineTo(x1, bot - 22); c.lineTo(x1 + 7, bot);
  c.ellipse(cx, bot, rx + 7, ry + 1, 0, 0, Math.PI); c.closePath();
  var gr = c.createLinearGradient(x0 - 7, 0, x1 + 7, 0);
  gr.addColorStop(0, P.rock2); gr.addColorStop(0.42, P.rock); gr.addColorStop(1, P.rock2);
  c.fillStyle = gr; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
  c.beginPath(); c.moveTo(x0, body); c.lineTo(x0, bot - 22); c.ellipse(cx, bot - 22, rx, ry, 0, Math.PI, 0, true); c.lineTo(x1, body); c.closePath();
  gr = c.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, P.stone2); gr.addColorStop(0.4, P.stone); gr.addColorStop(1, P.stone2);
  c.fillStyle = gr; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
  c.beginPath(); c.ellipse(cx, bot - 22, rx, ry, 0, 0.05, Math.PI - 0.05); c.strokeStyle = P.ink; c.lineWidth = 1.4; c.stroke();
  /* courses of squared stone, the joints staggered */
  c.strokeStyle = P.stone2; c.lineWidth = 1;
  for (y = body + 9, k = 0; y < bot - 26; y += 8, k++) {
    c.beginPath(); c.ellipse(cx, y, rx - 1, ry * 0.85, 0, 0.12, Math.PI - 0.12); c.stroke();
    for (var j = 0; j < 6; j++) {
      var a = 0.35 + (j + (k % 2) * 0.5) * (Math.PI - 0.7) / 6, jx = cx + Math.cos(a) * (rx - 1);
      c.beginPath(); c.moveTo(jx, y + Math.sin(a) * ry * 0.85); c.lineTo(jx, y + 8 + Math.sin(a) * ry * 0.85); c.stroke();
    }
  }
  /* the crown: corbels, the parapet standing out over them, the merlons */
  var pr = rx + 5;
  for (k = 0; k < 9; k++) {
    var b = 0.2 + k * (Math.PI - 0.4) / 8, bx = cx + Math.cos(b) * (rx - 1), by = body + Math.sin(b) * ry;
    poly(c, [[bx - 3.5, by - 4], [bx + 3.5, by - 4], [bx + 2, by + 6], [bx - 2, by + 6]]); fillStroke(c, P.stone, P.ink, 1.1);
  }
  c.beginPath(); c.moveTo(cx - pr, crown); c.lineTo(cx - pr, body - 4); c.ellipse(cx, body - 4, pr, ry + 2, 0, Math.PI, 0, true); c.lineTo(cx + pr, crown); c.closePath();
  fillStroke(c, P.stone, P.ink, 1.7);
  c.beginPath(); c.ellipse(cx, body - 4, pr, ry + 2, 0, 0.1, Math.PI - 0.1); c.strokeStyle = P.stone2; c.lineWidth = 1.2; c.stroke();
  /* the platform on top, seen a little from above, the merlons of the back row, then the front row */
  ell(c, cx, crown, pr, ry + 2); fillStroke(c, P.stone2, P.ink, 1.5);
  for (k = 0; k < 7; k++) {
    var a1 = Math.PI + (k + 0.5) * Math.PI / 7;
    rr(c, cx + Math.cos(a1) * (pr - 3) - 4.5, crown + Math.sin(a1) * (ry + 1) - 10, 9, 11, 1); fillStroke(c, P.stone2, P.ink, 1.2);
  }
  for (k = 0; k < 7; k++) {
    var a2 = (k + 0.5) * Math.PI / 7;
    rr(c, cx + Math.cos(a2) * (pr - 2) - 5, crown + Math.sin(a2) * (ry + 2) - 11, 10, 13, 1); fillStroke(c, P.stone, P.ink, 1.3);
  }
  /* loopholes, a window with its stone frame halfway up, the arms of the castle in marble */
  c.fillStyle = DARK;
  rr(c, cx - 2, body + 22, 4, 14, 2); c.fill(); rr(c, cx - rx * 0.62, body + 52, 4, 12, 2); c.fill(); rr(c, cx + rx * 0.55, body + 40, 4, 12, 2); c.fill();
  var mwy = body + (bot - 22 - body) * 0.55;
  rr(c, cx + rx * 0.12, mwy, 14, 20, 7); fillStroke(c, P.stone, P.ink, 1.3); rr(c, cx + rx * 0.12 + 3, mwy + 3, 8, 15, 4); fillStroke(c, DARK, P.ink, 1);
  rr(c, cx - rx * 0.45, mwy - 16, 12, 14, 2); fillStroke(c, '#fffdf6', P.ink, 1.1);
  c.fillStyle = '#d14b3a'; c.fillRect(cx - rx * 0.45 + 3, mwy - 13, 6, 3); c.fillStyle = '#ffd166'; c.fillRect(cx - rx * 0.45 + 3, mwy - 9, 6, 3);
  /* the stone portal at the foot, a round arch of voussoirs, the door of the Archive in it */
  var px = cx - 11, pw = 22, pt = bot - 30;
  c.beginPath(); c.moveTo(px, bot - 2); c.lineTo(px, pt + pw / 2); c.arc(px + pw / 2, pt + pw / 2, pw / 2, Math.PI, 0); c.lineTo(px + pw, bot - 2); c.closePath();
  fillStroke(c, P.wood2, P.ink, 1.5);
  for (k = 0; k <= 6; k++) {
    var va = Math.PI + k * Math.PI / 6;
    c.beginPath(); c.moveTo(px + pw / 2 + Math.cos(va) * (pw / 2 + 1), pt + pw / 2 + Math.sin(va) * (pw / 2 + 1)); c.lineTo(px + pw / 2 + Math.cos(va) * (pw / 2 + 6), pt + pw / 2 + Math.sin(va) * (pw / 2 + 6));
    c.strokeStyle = P.ink; c.lineWidth = 1; c.stroke();
  }
  c.beginPath(); c.arc(px + pw / 2, pt + pw / 2, pw / 2 + 6, Math.PI, 0); c.strokeStyle = P.ink; c.lineWidth = 1.2; c.stroke();
  c.strokeStyle = P.ink; c.lineWidth = 0.8; c.beginPath(); c.moveTo(px + pw / 2, pt + 4); c.lineTo(px + pw / 2, bot - 2); c.stroke();
  /* ivy up the side of the scarp */
  blobs(c, [[x1 + 2, bot - 8, 4], [x1 - 2, bot - 16, 3.5], [x1 + 1, bot - 24, 3], [x1 - 3, bot - 30, 2.6]], P.leaf2, P.ink, 1);
}

/** l'Ancora: a big ship's anchor on a stone plinth, in the square under the Torre di Mola */
export function anchor(c: Ctx, w: number, h: number, P: Palette) {
  var cx = w / 2;
  ell(c, cx, h - 3, 13, 4); c.fillStyle = P.shadow; c.fill();
  rr(c, cx - 11, h - 13, 22, 10, 2); fillStroke(c, P.stone, P.ink, 1.5);
  rr(c, cx - 8, h - 17, 16, 5, 1.5); fillStroke(c, P.stone2, P.ink, 1.2);
  var iron = '#3c4658', top = h - 50;
  /* the shank, the stock across it, the ring, the arms and their flukes */
  c.strokeStyle = P.ink; c.lineWidth = 6; c.beginPath(); c.moveTo(cx, top + 6); c.lineTo(cx, h - 19); c.stroke();
  c.strokeStyle = iron; c.lineWidth = 3.6; c.stroke();
  rr(c, cx - 11, top + 9, 22, 4.5, 2); fillStroke(c, iron, P.ink, 1.2);
  circle(c, cx, top + 3, 4); c.strokeStyle = P.ink; c.lineWidth = 3.6; c.stroke(); c.strokeStyle = iron; c.lineWidth = 1.8; c.stroke();
  c.beginPath(); c.moveTo(cx - 13, h - 30); c.quadraticCurveTo(cx - 12, h - 19, cx, h - 19); c.quadraticCurveTo(cx + 12, h - 19, cx + 13, h - 30);
  c.strokeStyle = P.ink; c.lineWidth = 6; c.stroke(); c.strokeStyle = iron; c.lineWidth = 3.6; c.stroke();
  [-1, 1].forEach(function (s) { poly(c, [[cx + s * 13, h - 36], [cx + s * 17, h - 27], [cx + s * 9, h - 28]]); fillStroke(c, iron, P.ink, 1.2); });
  /* a rope tied round the shank */
  c.strokeStyle = P.wood; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx - 3, top + 18); c.quadraticCurveTo(cx + 8, top + 24, cx + 2, top + 30); c.quadraticCurveTo(cx - 6, top + 34, cx + 3, h - 22); c.stroke();
}

/** the walls of the castle of Mola, round the foot of the tower: a curtain of rough stone with its merlons and the
    walk behind them, the round-arched portal of voussoirs with the arms over it and the lantern, two arrow slits,
    the corner buttress, ivy; behind the walls, the court with an olive tree */
export function castlewall(c: Ctx, w: number, h: number, P: Palette, o: ObjOpts) {
  var up = o.up == null ? T * 0.6 : o.up, top = -up, face = h - T * 1.75, bot = h - 3, k, y;
  var dx = o.doorX != null && o.x != null ? (o.doorX - o.x) * T : T, cx = dx + T / 2;
  ell(c, w / 2, h - 1, w / 2, 6); c.fillStyle = P.shadow; c.fill();
  /* the court, behind: grass, the paved way from the portal to the tower, the olive, the well */
  rr(c, 4, top, w - 8, face - top + 4, 2); fillStroke(c, P.grass, P.ink, 1.4);
  c.fillStyle = P.stone; c.fillRect(cx - 9, top + 1, 18, face - top);
  c.strokeStyle = P.stone2; c.lineWidth = 0.9;
  for (y = top + 5; y < face; y += 6) { c.beginPath(); c.moveTo(cx - 9, y); c.lineTo(cx + 9, y); c.stroke(); var jx = cx - 9 + ((y - top) % 12 ? 6 : 12); c.beginPath(); c.moveTo(jx, y - 6); c.lineTo(jx, y); c.stroke(); }
  c.strokeStyle = P.leaf2; c.lineWidth = 1; c.globalAlpha = 0.6;
  for (k = 0; k < 14; k++) { var gx = 16 + hash(k, 1, 333) * (w - 32), gy = top + 4 + hash(k, 2, 334) * (face - top - 8); if (Math.abs(gx - cx) < 12) continue; c.beginPath(); c.moveTo(gx - 2, gy + 2); c.lineTo(gx, gy - 2); c.lineTo(gx + 2, gy + 2); c.stroke(); }
  c.globalAlpha = 1;
  var wx = cx > w / 2 ? 26 : w - 26;
  ell(c, wx, face - 14, 7, 4); fillStroke(c, P.stone, P.ink, 1.2); ell(c, wx, face - 15, 4.5, 2.4); fillStroke(c, P.sea2, P.ink, 0.9);
  var ox = cx > w / 2 ? w - 30 : 30;
  c.strokeStyle = P.wood2; c.lineWidth = 2.4; c.beginPath(); c.moveTo(ox, face - 4); c.quadraticCurveTo(ox - 2, face - 18, ox + 4, face - 26); c.stroke();
  blobs(c, [[ox - 4, face - 30, 8], [ox + 7, face - 33, 7.5], [ox + 2, face - 40, 6.5], [ox + 12, face - 26, 5.5]], P['leaf2'], P.ink, 1.2);
  /* the side walls running back to the tower, seen from above: thick, with their merlons */
  [3, w - 13].forEach(function (sx) {
    rr(c, sx, top, 10, face - top, 1.5); fillStroke(c, P.rock, P.ink, 1.4);
    for (y = top + 3; y < face - 6; y += 11) { rr(c, sx + 1, y, 8, 6, 1); fillStroke(c, P.rock2, P.ink, 1); }
  });
  /* the walk on top of the front wall, and its merlons */
  rr(c, 1, face - 9, w - 2, 11, 1.5); fillStroke(c, P.rock2, P.ink, 1.5);
  var n = Math.max(4, Math.round(w / 18)), mw = (w - 4) / n;
  for (k = 0; k < n; k++) { rr(c, 2 + k * mw + 1.5, face - 17, mw - 6, 10, 1); fillStroke(c, P.rock, P.ink, 1.3); }
  /* the front: rough stone in courses, the scarp at its foot */
  rr(c, 1, face, w - 2, bot - face, 1.5); fillStroke(c, P.rock, P.ink, 1.8);
  c.save(); c.beginPath(); c.rect(2, face + 1, w - 4, bot - face - 2); c.clip();
  c.strokeStyle = P.rock2; c.lineWidth = 1;
  for (y = face + 7, k = 0; y < bot; y += 7, k++) {
    c.beginPath(); c.moveTo(2, y); c.lineTo(w - 2, y); c.stroke();
    for (var x = 4 + (k % 2) * 7 + hash(k, 3, 330) * 5; x < w - 2; x += 13 + hash(x, k, 331) * 6) { c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x, y); c.stroke(); }
  }
  c.restore();
  poly(c, [[1, bot - 12], [w - 1, bot - 12], [w + 2, bot], [-2, bot]]); fillStroke(c, P.rock2, P.ink, 1.4);
  /* the corner buttress, on the side away from the portal */
  var bx = cx > w / 2 ? 2 : w - 16;
  poly(c, [[bx, face - 2], [bx + 14, face - 2], [bx + 16, bot], [bx - 2, bot]]); fillStroke(c, P.stone2, P.ink, 1.5);
  c.strokeStyle = P.ink; c.lineWidth = 0.8; c.globalAlpha = 0.4; for (y = face + 8; y < bot - 2; y += 9) { c.beginPath(); c.moveTo(bx, y); c.lineTo(bx + 14, y); c.stroke(); } c.globalAlpha = 1;
  /* two arrow slits */
  c.fillStyle = DARK;
  [cx > w / 2 ? cx - 34 : cx + 30, cx > w / 2 ? cx - 52 : cx + 48].forEach(function (sx, i) { if (sx < 18 || sx > w - 20) return; rr(c, sx, face + 8 + i * 5, 3.5, 17, 1.7); c.fill(); });
  /* the portal: a round arch of voussoirs in pale stone, the wooden door ajar, the dark of the passage */
  var pw = 24, pt = bot - 36, pl = cx - pw / 2;
  c.beginPath(); c.moveTo(pl - 7, bot); c.lineTo(pl - 7, pt + pw / 2); c.arc(cx, pt + pw / 2, pw / 2 + 7, Math.PI, 0); c.lineTo(pl + pw + 7, bot); c.closePath(); fillStroke(c, P.stone, P.ink, 1.6);
  c.beginPath(); c.moveTo(pl, bot); c.lineTo(pl, pt + pw / 2); c.arc(cx, pt + pw / 2, pw / 2, Math.PI, 0); c.lineTo(pl + pw, bot); c.closePath(); fillStroke(c, DARK, P.ink, 1.4);
  for (k = 0; k <= 8; k++) {
    var va = Math.PI + k * Math.PI / 8;
    c.beginPath(); c.moveTo(cx + Math.cos(va) * pw / 2, pt + pw / 2 + Math.sin(va) * pw / 2); c.lineTo(cx + Math.cos(va) * (pw / 2 + 7), pt + pw / 2 + Math.sin(va) * (pw / 2 + 7));
    c.strokeStyle = P.ink; c.lineWidth = 0.9; c.stroke();
  }
  poly(c, [[pl + 1, bot], [pl + 1, pt + pw / 2], [pl + 9, pt + pw / 2 + 3], [pl + 9, bot]]); fillStroke(c, P.wood2, P.ink, 1.2);
  c.strokeStyle = P.ink; c.lineWidth = 0.7; for (k = 0; k < 3; k++) { c.beginPath(); c.moveTo(pl + 1, pt + pw / 2 + 6 + k * 7); c.lineTo(pl + 9, pt + pw / 2 + 8 + k * 7); c.stroke(); }
  rr(c, pl - 9, bot - 3, pw + 18, 4, 1); fillStroke(c, P.stone2, P.ink, 1);
  /* the arms of the Anjou over the portal, the lantern beside it */
  rr(c, cx - 7, pt - 19, 14, 15, 2); fillStroke(c, '#fffdf6', P.ink, 1.2);
  c.fillStyle = '#2d4fb3'; c.fillRect(cx - 5, pt - 17, 10, 11);
  c.fillStyle = '#ffd166'; for (k = 0; k < 4; k++) { circle(c, cx - 2.5 + (k % 2) * 5, pt - 14.5 + Math.floor(k / 2) * 5, 1.2); c.fill(); }
  var lx = cx + (cx > w / 2 ? -pw / 2 - 13 : pw / 2 + 13);
  c.strokeStyle = P.ink; c.lineWidth = 1.2; c.beginPath(); c.moveTo(lx, pt - 2); c.lineTo(lx, pt + 4); c.stroke();
  poly(c, [[lx - 3, pt + 4], [lx + 3, pt + 4], [lx + 2.2, pt + 11], [lx - 2.2, pt + 11]]); fillStroke(c, '#e8f5ff', P.ink, 0.9);
  poly(c, [[lx - 4, pt + 4], [lx, pt + 1], [lx + 4, pt + 4]]); fillStroke(c, DARK, P.ink, 0.8);
  /* ivy down the wall, a caper plant in a crack */
  var iv = cx > w / 2 ? w - 22 : 20;
  blobs(c, [[iv, face + 4, 5], [iv + 4, face + 12, 4.5], [iv - 2, face + 20, 4], [iv + 3, face + 28, 3.5], [iv - 1, face + 36, 3]], P.leaf2, P.ink, 1);
  blobs(c, [[cx + (cx > w / 2 ? -40 : 44), face + 30, 3.4]], P.leaf, P.ink, 1);
  if (o.label) plaque(c, P, o.label, Math.max(40, Math.min(w - 40, w / 2)), face - 22, Math.min(w - 10, 112), 11);
}

/** the Fontana delle Cinque Cannelle: a fountain against a wall of grey stone, its cornice and its tablet, five bronze
    spouts pouring into a long basin; the women of Mola came here for water */
export function cannelle(c: Ctx, w: number, h: number, P: Palette, o: ObjOpts) {
  var up = o.up == null ? T * 0.7 : o.up, top = -up, bot = h - 4, k;
  ell(c, w / 2, h - 2, w / 2, 4); c.fillStyle = P.shadow; c.fill();
  /* the wall: a panel between two pilasters, the cornice, a little pediment */
  var wt = top + 10, wb = h - 22;
  poly(c, [[6, wt], [w / 2, top], [w - 6, wt]]); fillStroke(c, P.stone2, P.ink, 1.4);
  rr(c, 4, wt, w - 8, wb - wt, 1.5); fillStroke(c, P.stone, P.ink, 1.7);
  rr(c, 2, wt - 2, w - 4, 5, 1); fillStroke(c, P.stone2, P.ink, 1.2);
  [4, w - 11].forEach(function (px) { rr(c, px, wt + 3, 7, wb - wt - 3, 1); fillStroke(c, P.stone2, P.ink, 1.1); });
  rr(c, w / 2 - 15, wt + 7, 30, 10, 1.5); fillStroke(c, '#fffdf6', P.ink, 1.1);
  c.strokeStyle = P.ink; c.lineWidth = 0.7; c.globalAlpha = 0.6;
  for (k = 0; k < 2; k++) { c.beginPath(); c.moveTo(w / 2 - 11, wt + 10.5 + k * 3.5); c.lineTo(w / 2 + 11 - k * 4, wt + 10.5 + k * 3.5); c.stroke(); }
  c.globalAlpha = 1;
  /* the basin, long and low, the water in it */
  rr(c, 3, wb - 2, w - 6, bot - wb + 2, 3); fillStroke(c, P.stone, P.ink, 1.7);
  rr(c, 7, wb + 1, w - 14, bot - wb - 7, 2); fillStroke(c, P.sea, P.ink, 1.1);
  c.strokeStyle = P.foam; c.lineWidth = 1;
  for (k = 0; k < 5; k++) { var sx = 13 + k * (w - 26) / 4; c.beginPath(); c.ellipse(sx, wb + 5, 3.5, 1.4, 0, 0, Math.PI * 2); c.stroke(); }
  /* the five spouts, and the water falling from them */
  for (k = 0; k < 5; k++) {
    var px = 13 + k * (w - 26) / 4, py = wb - 10;
    circle(c, px, py, 2.6); fillStroke(c, '#b08a3e', P.ink, 1);
    rr(c, px - 1.2, py, 2.4, 4, 1); fillStroke(c, '#b08a3e', P.ink, 0.8);
    c.strokeStyle = P.sea2; c.lineWidth = 1.6; c.beginPath(); c.moveTo(px, py + 4); c.quadraticCurveTo(px + 0.6, wb, px + 0.3, wb + 4); c.stroke();
  }
}
