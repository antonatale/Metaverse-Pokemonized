import { describe, expect, it } from 'vitest';
import { SPECIES, CMOVES, STARTERS, knownAt, type SpeciesId } from '../../src/data/creatures';
import { atLevel, toNext, xpFor, SKILLS, withSkills, perksFor, WARES, SHOPS, START_LEVEL } from '../../src/data/growth';
import { CHARS } from '../../src/data/characters';
import { ENGINE as E, type BattleState } from '../../src/battle';

/* The creatures of Formia and the story's growth: the data hold together, and battles with them get to the end. */
const ids = Object.keys(SPECIES) as SpeciesId[];
function playOut(s: BattleState, pick: (s: BattleState) => string) {
  E.intro(s);
  for (let n = 0; n < 200 && s.phase !== 'over'; n++) {
    E.beginTurn(s);
    const need = E.needs(s);
    const ch: Record<number, string> = {};
    need.forEach((i) => { ch[i] = i === 0 ? pick(s) : E.ai(s, i); });
    E.playTurn(s, ch);
  }
  return s;
}

describe('creatures of Formia', () => {
  it('learn moves that exist, evolve into a later stage, and start with three of stage 1', () => {
    for (const id of ids) {
      const sp = SPECIES[id];
      for (const [lv, m] of sp.learn) { expect(CMOVES[m], id + ' learns ' + m).toBeTruthy(); expect(lv).toBeGreaterThan(0); }
      if (sp.evolve) { expect(SPECIES[sp.evolve.into].stage).toBe(sp.stage + 1); expect(SPECIES[sp.evolve.into].type).toBe(sp.type); }
      expect(knownAt(id, 1).length).toBeGreaterThan(0);
      expect(knownAt(id, 50).length).toBeLessThanOrEqual(4);
      for (const k of ['hp', 'atk', 'def', 'spe'] as const) expect(sp.stats[k]).toBeGreaterThan(0);
    }
    expect(STARTERS.map((id) => SPECIES[id].stage)).toEqual([1, 1, 1]);
    expect(new Set(STARTERS.map((id) => SPECIES[id].type)).size).toBe(3);
  });
  it('fight each other to the end, at any level, with the moves they know', () => {
    let seed = 1;
    for (const a of ids) for (const b of [ids[(ids.indexOf(a) * 7 + 3) % ids.length], 'costanzo' as const]) {
      const la = 3 + (seed % 30), lb = 3 + ((seed * 7) % 30);
      const s = E.newBattle({
        a, b, seed: seed++,
        sideA: { stats: atLevel(SPECIES[a].stats, la), lvl: la, known: knownAt(a, la) },
        sideB: b === 'costanzo' ? { stats: atLevel(CHARS.costanzo.stats, lb), lvl: lb } : { stats: atLevel(SPECIES[b as SpeciesId].stats, lb), lvl: lb, known: knownAt(b as SpeciesId, lb) }
      });
      playOut(s, (st) => E.ai(st, 0));
      expect(s.phase).toBe('over');
      for (const m of E.available(s, 0)) expect(knownAt(a, la)).toContain(m);
    }
  });
  it('can be caught in a net, and the nets run out', () => {
    let caught = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const s = E.newBattle({ a: 'antonio', b: 'cicalina', seed, wild: true, bag: { retino: 3, tiella: 1 },
        sideB: { stats: atLevel(SPECIES.cicalina.stats, 4), lvl: 4, known: knownAt('cicalina', 4) } });
      playOut(s, (st) => E.available(st, 0).indexOf('retino') >= 0 ? 'retino' : E.ai(st, 0));
      expect(s.phase).toBe('over');
      expect(s.bag!.retino).toBeGreaterThanOrEqual(0);
      if (s.result === 'catch') caught++;
    }
    expect(caught).toBeGreaterThan(5);
    /* no nets against a covo leader */
    const c = E.newBattle({ a: 'antonio', b: 'costanzo', seed: 3, bag: { retino: 2, tiella: 1 } });
    E.intro(c); E.beginTurn(c);
    expect(E.available(c, 0)).not.toContain('retino');
    expect(E.available(c, 0)).toContain('tiella');
  });
});

describe('growing up', () => {
  it('keeps the free-battle numbers at the starting level, and grows from there', () => {
    expect(atLevel(CHARS.antonio.stats, START_LEVEL)).toEqual(CHARS.antonio.stats);
    expect(atLevel(CHARS.antonio.stats, 20).atk).toBeGreaterThan(CHARS.antonio.stats.atk);
    expect(toNext(6)).toBeGreaterThan(toNext(5));
    expect(xpFor(10, true, false)).toBeGreaterThan(xpFor(10, false, false));
  });
  it('turns abilities into numbers and chances', () => {
    expect(withSkills(CHARS.antonio.stats, {})).toEqual(CHARS.antonio.stats);
    expect(withSkills(CHARS.antonio.stats, { forza: 3 }).atk).toBeGreaterThan(CHARS.antonio.stats.atk);
    expect(perksFor({})).toEqual({ lose: 0.15, idea: 0.25 });
    expect(perksFor({ memoria: 3, prompt: 3 }).lose).toBeLessThan(0.05);
    for (const sk of SKILLS) expect(sk.max).toBeGreaterThan(0);
    for (const sh of Object.values(SHOPS)) for (const it of sh.sells) expect(WARES[it].price).toBeGreaterThan(0);
  });
});

describe('the magic of the creatures', () => {
  it('grows a creature into its next form, and writes it in the diary', async () => {
    const { addCreature, gainXp, creatureOf, dexOf } = await import('../../src/story/growth');
    const uid = addCreature('polpino', 13);
    const g = gainXp(uid, 200);
    expect(g.to).toBeGreaterThanOrEqual(14);
    expect(g.evolved).toEqual({ from: 'polpino', to: 'polpetto' });
    expect(creatureOf(uid)!.sp).toBe('polpetto');
    expect(dexOf('polpetto')).toBe(2);
  });
  it('has a magic for every type, and every creature carries it', async () => {
    const { MAGIC, creature } = await import('../../src/render/svg/creatures');
    for (const id of ids) {
      expect(MAGIC[SPECIES[id].type].col).toMatch(/^#[0-9a-f]{6}$/);
      const svg = creature(id);
      expect(svg).toContain('class="aura"');
      expect(svg).toContain('class="mg mg0"');
    }
  });
});

describe('the trainers of Formia', () => {
  it('are people on the map, with creatures that exist, and a prize', async () => {
    const { TRAINERS } = await import('../../src/data/trainers');
    const { MAPS } = await import('../../src/data/maps');
    for (const tr of Object.values(TRAINERS)) {
      const n = (MAPS.formia.npcs || []).find((q) => q.trainer === tr.id);
      expect(n, 'nobody is ' + tr.id).toBeDefined();
      expect(tr.team.length).toBeGreaterThan(0);
      for (const t of tr.team) expect(SPECIES[t.sp]).toBeDefined();
      expect(tr.prize).toBeGreaterThan(0);
    }
  });
  it('send their creatures in with the health the last battle left', () => {
    const s = E.newBattle({ a: 'polpino', b: 'olivella', seed: 4, trainer: 'L\'animatore dell\'oratorio',
      sideA: { stats: atLevel(SPECIES.polpino.stats, 8), lvl: 8, known: knownAt('polpino', 8), hp: 30 }, sideB: { stats: atLevel(SPECIES.olivella.stats, 6), lvl: 6, known: knownAt('olivella', 6) } });
    expect(s.sides[0].hp).toBe(30);
    expect(s.sides[0].max).toBeGreaterThan(30);
    const ev = E.intro(s);
    expect(ev.some((e) => e.k === 'say' && e.text.indexOf('manda in campo Olivella') >= 0)).toBe(true);
  });
});
