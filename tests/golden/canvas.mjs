/* Everything the map art draws, as the exact list of canvas calls it makes: ground, buildings, objects,
   people, lost things. A fake 2D context records every call and every property set; the same code must
   make the very same calls with the very same numbers. Badges and item icons are SVG strings. */
import { createHash } from 'node:crypto';

/** puts a fake document/getComputedStyle on globalThis; returns the call log and a reset */
export function fakeCanvasEnv(tokens) {
  const log = [];
  let n = 0;
  const id = (v) => (v && typeof v === 'object' && v.__id) ? v.__id : v;
  const grad = (kind, args) => {
    const g = { __id: kind + (n++) };
    g.addColorStop = (o, c) => { log.push([g.__id, 'stop', o, c]); };
    log.push(['new', kind, ...args, g.__id]);
    return g;
  };
  function makeCanvas() {
    const cid = 'cv' + (n++), props = { width: 300, height: 150 };
    let ctx = null;
    const cv = new Proxy({}, {
      get(t, k) {
        if (k === '__id') return cid;
        if (k === 'getContext') return () => ctx || (ctx = makeContext(cid));
        if (k === 'setAttribute' || k === 'toDataURL') return (...a) => { log.push([cid, k, ...a]); return ''; };
        return props[k];
      },
      set(t, k, v) { props[k] = v; log.push([cid, '=', k, v]); return true; }
    });
    log.push(['new', 'canvas', cid]);
    return cv;
  }
  function makeContext(cid) {
    const state = { font: '10px sans-serif', globalAlpha: 1 };
    return new Proxy({}, {
      get(t, k) {
        if (k in state) return state[k];
        if (k === 'measureText') return (s) => { log.push([cid, 'measureText', s]); return { width: String(s).length * 7.25 }; };
        if (k === 'createLinearGradient' || k === 'createRadialGradient') return (...a) => grad(k, a);
        return (...a) => { log.push([cid, k, ...a.map(id)]); };
      },
      set(t, k, v) { state[k] = v; log.push([cid, '=', k, id(v)]); return true; }
    });
  }
  globalThis.document = {
    createElement: (tag) => { if (tag !== 'canvas') throw new Error('unexpected element ' + tag); return makeCanvas(); },
    documentElement: {}
  };
  globalThis.getComputedStyle = () => ({ getPropertyValue: (p) => tokens[p] || '' });
  return { log, reset() { log.length = 0; } };
}

/** what the story mode adds to a map before drawing it (see the story module's prepare) */
function prep(def, LEGEND) {
  const m = Object.assign({}, def);
  m.h = m.rows.length; m.w = m.rows[0].length;
  m.cell = (x, y) => (x < 0 || y < 0 || x >= m.w || y >= m.h) ? LEGEND.x : (LEGEND[m.rows[y][x]] || LEGEND['.']);
  return m;
}

const T = 32;
/** how far above its footprint each kind of thing is drawn, as in the story module */
const UP = { tower: T * 2.4, tomb: T * 1.9, house: T * 0.75, station: T * 0.75, circolo: T * 0.9, bar: T * 0.75, shop: T * 0.75, palazzo: T * 1.1,
  church: T * 2.15, octagon: T * 2.1, clocktower: T * 2.05, coni: T * 0.75, lido: T * 0.9, kiosk: T * 0.6, ferry: T * 0.75, cypress: T * 1.6,
  lifeguard: T * 1.4, ruins: T * 0.9, tunnel: T * 0.5, fountain: T * 0.5, car: T * 0.2, item: T * 0.4 };
const UMBRELLAS = ['#ff8fc1', '#8fd0f6', '#ffd166'], BOATS = ['#ffffff', '#ffe9a8'];

export function canvasDigests(ART, MAPS, LEGEND) {
  const KEYS = ['paper', 'grid', 'ink', 'grass', 'grass2', 'path', 'path2', 'road', 'road2', 'sand', 'sand2', 'sea', 'sea2', 'foam', 'wood', 'wood2', 'stone', 'stone2',
    'roof-a', 'roof-b', 'roof-c', 'roof-d', 'wall', 'leaf', 'leaf2', 'trunk', 'clay', 'line', 'hedge', 'flower-a', 'flower-b', 'shadow', 'label',
    'hill', 'hill2', 'rock', 'rock2', 'olive', 'track', 'far', 'far2'];
  const tokens = {};
  KEYS.forEach((k, i) => { if (i % 7) tokens['--m-' + k] = ' #' + (100000 + i * 1234).toString(16).slice(0, 6) + ' '; });   /* some missing on purpose */
  const env = fakeCanvasEnv(tokens);
  const out = {};
  const record = (name, fn) => {
    env.reset();
    const r = fn();
    out[name] = createHash('sha256').update(JSON.stringify([env.log, r === undefined ? null : (typeof r === 'object' ? Object.keys(r).map((k) => [k, typeof r[k] === 'object' && r[k] && r[k].__id ? 'cv' : r[k]]) : r)])).digest('hex').slice(0, 24) + ' ' + env.log.length;
  };
  record('palette', () => JSON.stringify(ART.palette()));
  const P = ART.palette();
  record('T', () => ART.T);
  record('LEGEND', () => JSON.stringify(ART.LEGEND));
  record('hash', () => JSON.stringify([0, 1, 7, 33, -4].map((x) => [0, 3, 40].map((y) => [0, 1, 190].map((k) => ART.hash(x, y, k))))));
  for (const s of [1, 2]) {
    for (const mid of Object.keys(MAPS)) {
      const m = prep(MAPS[mid], LEGEND);
      record('ground ' + mid + ' @' + s, () => ART.paintGround(m, P, s));
      for (const rect of [{ x: 0, y: 0, w: 12, h: 12 }, { x: 12, y: 24, w: 12, h: 12 }, { x: 36, y: 36, w: 12, h: 4 }, { x: 0, y: 0, w: 12, h: 13 }]) {
        if (rect.x >= m.w || rect.y >= m.h) continue;
        record('ground ' + mid + ' ' + JSON.stringify(rect) + ' @' + s, () => ART.paintGround(m, P, s, { x: rect.x, y: rect.y, w: Math.min(rect.w, m.w - rect.x), h: Math.min(rect.h, m.h - rect.y) }));
      }
      const seen = {};
      for (let y = 0; y < m.h; y++) for (let x = 0; x < m.w; x++) {
        const L = m.cell(x, y);
        if (!L.obj) continue;
        const color = L.obj === 'umbrella' ? UMBRELLAS[(x + y) % 3] : L.obj === 'boat' ? BOATS[(x + y) % 2] : null, k = L.obj + (color || '');
        if (seen[k]) continue;
        seen[k] = 1;
        record('obj ' + k + ' @' + s, () => ART.paintObject(L.obj, P, s, { color: color, up: UP[L.obj] }));
      }
      (m.buildings || []).forEach((b) => record('building ' + mid + ' ' + b.id + ' @' + s, () => ART.paintObject(b.kind, P, s, { w: b.w, h: b.h, up: UP[b.kind] || T, x: b.x, doorX: b.door[0], label: b.label, roof: b.roof, awning: b.awning })));
      (m.objects || []).forEach((o, i) => record('object ' + mid + ' ' + i + ' ' + o.kind + ' @' + s, () => ART.paintObject(o.kind, P, s, { w: o.w, h: o.h, up: UP[o.kind] || T, color: o.color })));
    }
    record('sign @' + s, () => ART.paintObject('sign', P, s, {}));
    record('unknown kind @' + s, () => ART.paintObject('nope', P, s, { w: 2, h: 1 }));
    for (const it of ['notes', 'wallet', 'charger', 'passport']) record('item ' + it + ' @' + s, () => ART.paintObject('item', P, s, { item: it, up: UP.item }));
    for (const p of Object.keys(ART.PEOPLE)) record('walker ' + p + ' @' + s, () => ART.walker(ART.PEOPLE[p], s));
    for (const seed of [11, 12, 13, 14, 15, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32, 41, 42, 43, 44, 51, 61, 71, 72, 1, 2, 3, 99]) {
      record('townsperson ' + seed + ' @' + s, () => ART.walker(ART.townsperson(seed), s));
    }
  }
  record('people', () => JSON.stringify(ART.PEOPLE));
  record('townsfolk', () => JSON.stringify([1, 2, 3, 11, 12, 42, 99].map((x) => ART.townsperson(x))));
  record('badges', () => [{ color: '#ffe45c', mark: 'C' }, { color: '#8fd0f6', mark: 'F', earned: false }, { color: '#fff', mark: 'X', earned: true }]
    .map((b) => [ART.badgeSVG(b), ART.badgeSVG(b, 28), ART.badgeSVG(b, 104)].join('|')).join('||'));
  record('item icons', () => ['notes', 'wallet', 'charger', 'passport', 'nope'].map((k) => [ART.itemSVG(k, true), ART.itemSVG(k, false, 40), ART.itemSVG(k)].join('|')).join('||'));
  return out;
}
