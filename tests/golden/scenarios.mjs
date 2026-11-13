/* Deterministic battles for the golden tests. The engine's state carries its own RNG, so the same seed
   and the same choices must give the same events, the same button labels and the same final state. */
import { createHash } from 'node:crypto';

const ROSTER = ['antonio', 'costanzo', 'andrea', 'valentin', 'forchetta', 'zendavid'];
const SAFE = [[], ['simtoreal', 'diagnosi'], ['diagnosi', 'certificati', 'simtoreal', 'america']];

function mulberry(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** every battle the golden file covers */
/* the six friends of the original game: their 2,040 battles keep their seeds, whoever is added after them */
const FIRST = ['antonio', 'costanzo', 'andrea', 'valentin', 'forchetta', 'zendavid'];
export function scenarios() {
  const out = [];
  let n = 0;
  for (const a of FIRST) for (const b of FIRST.concat(['esame'])) for (let k = 0; k < 40; k++) {
    n++;
    out.push({ key: 'cpu ' + a + ' ' + b + ' ' + k, a, b, mode: 'cpu', seed: (n * 2654435761) >>> 0, chooser: k % 3 === 0 ? 'ai' : 'random', safe: a === 'antonio' ? SAFE[k % 3] : [] });
  }
  for (const a of FIRST) for (const b of FIRST) for (let k = 0; k < 10; k++) {
    n++;
    out.push({ key: 'pvp ' + a + ' ' + b + ' ' + k, a, b, mode: 'pvp', seed: (n * 2654435761) >>> 0, chooser: k % 2 ? 'ai' : 'random', safe: [] });
  }
  /* then the battles of whoever came later (Claudia), with seeds that follow on */
  const later = ROSTER.filter((id) => FIRST.indexOf(id) < 0);
  for (const a of ROSTER) for (const b of ROSTER.concat(['esame'])) for (let k = 0; k < 20; k++) {
    if (later.indexOf(a) < 0 && later.indexOf(b) < 0) continue;
    n++;
    out.push({ key: 'cpu ' + a + ' ' + b + ' ' + k, a, b, mode: 'cpu', seed: (n * 2654435761) >>> 0, chooser: k % 3 === 0 ? 'ai' : 'random', safe: a === 'antonio' ? SAFE[k % 3] : [] });
  }
  return out;
}

/** plays one battle the way ui.js drives the engine, and writes down everything the engine says */
export function transcript(E, sc) {
  const pickR = mulberry(sc.seed ^ 0x9e3779b9);
  const s = E.newBattle({ a: sc.a, b: sc.b, mode: sc.mode, seed: sc.seed, safe: sc.safe });
  const log = [];
  log.push({ phase: 'intro', ev: E.intro(s) });
  for (let guard = 0; s.phase !== 'over' && guard < 400; guard++) {
    if (s.phase === 'begin') { log.push({ phase: 'begin', ev: E.beginTurn(s) }); continue; }
    if (s.phase !== 'select') throw new Error('unexpected phase ' + s.phase);
    const needs = E.needs(s), choices = {};
    const view = {
      snap: E.snap(s), needs, clock: E.clock(s), plan: [E.planName(s, 0), E.planName(s, 1)], types: [E.sideType(s, 0), E.sideType(s, 1)],
      labels: [0, 1].map((i) => E.CHARS[s.sides[i].id].moves.map((m) => E.moveLabel(s, i, m.id))),
      available: [E.available(s, 0), E.available(s, 1)],
      expected: [0, 1].map((i) => E.CHARS[s.sides[i].id].moves.map((m) => E.expected(s, i, m.id)))
    };
    for (const i of needs) {
      const av = E.available(s, i), r = pickR();
      if (r < 0.04) choices[i] = 'not-a-move';                                   /* the engine falls back to the first move */
      else if (sc.chooser === 'ai') choices[i] = E.ai(JSON.parse(JSON.stringify(s)), i);   /* as UI._debug.suggest */
      else choices[i] = av[Math.floor(pickR() * av.length)];
    }
    log.push({ phase: 'select', view, choices, ev: E.playTurn(s, choices) });
  }
  log.push({ phase: 'end', state: JSON.parse(JSON.stringify(s)) });
  return log;
}

export function digest(E, sc) {
  return createHash('sha256').update(JSON.stringify(transcript(E, sc))).digest('hex').slice(0, 24);
}

/** the parts of the engine's API that are plain data or pure functions of their arguments */
export function staticFacts(E) {
  const types = E.TYPE_ORDER;
  return {
    TYPES: E.TYPES, TYPE_ORDER: types, ITEMS: E.ITEMS, CHARS: E.CHARS, ROSTER: E.ROSTER, TUNE: E.TUNE,
    eff: types.map((a) => types.map((d) => E.eff(a, d))).concat([[E.eff(null, 'Calma'), E.eff('Calma', null)]]),
    beaterOf: types.map((t) => E.beaterOf(t)).concat([E.beaterOf('Nessuno')]),
    move: E.move(E.CHARS.antonio, 'america'), noMove: E.move(E.CHARS.antonio, 'nope'),
    same: [E.ANTONIO === E.CHARS.antonio, E.ESAME === E.CHARS.esame]
  };
}
