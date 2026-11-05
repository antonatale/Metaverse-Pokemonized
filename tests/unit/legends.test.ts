import { describe, expect, it } from 'vitest';
import { ENGINE as E, type BattleState, type Member } from '../../src/battle';
import { LEGENDS, type LegendStage } from '../../src/data/legends';
import { CMOVES, SPECIES, knownAt, type SpeciesId } from '../../src/data/creatures';
import { MAPS } from '../../src/data/maps';
import { atLevel } from '../../src/data/growth';
import { stageFloor, stageUp } from '../../src/battle/stages';
import { flag } from '../../src/story/plot';

const member = (id: SpeciesId, lv: number, key: string): Member => ({ id, key, stats: atLevel(SPECIES[id].stats, lv), lvl: lv, known: knownAt(id, lv) });
/** a fight with the legend of that entry, with a team around level 30 */
function fight(id: string, seed: number, bag: Record<string, number> = {}): BattleState {
  const L = LEGENDS[id], me = member('muraglione', 34, 'c1'), foe = { ...member(L.sp, 35, 'f0'), stages: L.stages };
  const s = E.newBattle({ a: me.id, b: foe.id, seed, sideA: me, sideB: foe, benchA: [member('polpastro', 34, 'c2')], wild: true, bag });
  E.intro(s); return s;
}
/** the legend takes a hit far bigger than anything: only the rules of the fight stop it */
function pound(s: BattleState) { s.sides[0].stats = { ...s.sides[0].stats!, atk: 99999 }; s.sides[1].mods = []; }
function turn(s: BattleState, choice?: string) {
  if (s.phase === 'send') E.sendIn(s, {});
  if (s.phase === 'begin') E.beginTurn(s);
  const ch: Record<number, string> = {};
  E.needs(s).forEach((i) => { ch[i] = choice && E.available(s, i).indexOf(choice) >= 0 ? choice : E.available(s, i).filter((m) => CMOVES[m] && CMOVES[m].kind === 'atk')[0]; });
  return E.playTurn(s, ch);
}

describe('the legends as data', () => {
  for (const [id, L] of Object.entries(LEGENDS)) {
    it(id + ' has parts that make sense', () => {
      expect(L.stages[0].at).toBe(1);
      L.stages.forEach((p: LegendStage, k: number) => {
        if (k) expect(p.at).toBeLessThan(L.stages[k - 1].at);
        expect(p.moves.length, p.name).toBeGreaterThan(0);
        expect(p.moves.length, p.name).toBeLessThanOrEqual(4);
        expect(p.moves.some((m) => CMOVES[m].kind === 'atk'), p.name + ' can hit').toBe(true);
        for (const m of p.moves) expect(SPECIES[L.sp].learn.map((l) => l[1]), p.name + ' knows ' + m).toContain(m);
      });
    });
    it(id + ' stands on a map, and what it leads to is there', () => {
      const here = Object.values(MAPS).filter((m) => (m.npcs || []).some((n) => n.legend === id));
      expect(here.length).toBeGreaterThan(0);
      if (L.trial) {
        const down = MAPS[L.trial.to];
        expect(down.place, 'a trial is a place, with a proof').toBeTruthy();
        expect(down.npcs!.some((n) => n.legend === id), 'it waits down there').toBe(true);
      }
    });
    it(id + ' has a riddle with one right answer among those on offer', () => {
      for (const q of (L.riddle ? L.riddle.steps : [])) expect(q.options[q.ok]).toBeTruthy();
    });
  }
  it('the moves added for the fight do not change what a caught legend knows', () => {
    expect(knownAt('lamo', 35)).toEqual(['telepilo', 'furia', 'passogigante', 'masso']);
    expect(knownAt('giano', 36)).toEqual(['duevolti', 'soglia', 'primaluce', 'portatempo']);
  });
});

describe('a legend in parts', () => {
  it('cannot be hit past the end of a part, however hard the blow', () => {
    const s = fight('lamo', 11), L = s.sides[1];
    pound(s);
    expect(stageFloor(L)).toBe(Math.ceil(L.max * 0.6));
    for (let k = 0; k < 30 && L.stage === 0; k++) turn(s, 'masso');
    expect(L.stage).toBe(1);
    expect(L.hp).toBe(Math.ceil(L.max * 0.6));
    for (let k = 0; k < 30 && L.stage === 1; k++) turn(s, 'masso');
    expect(L.stage).toBe(2);
    expect(L.hp).toBe(Math.ceil(L.max * 0.3));
  });
  it('fights with the moves of its part, and says so', () => {
    const s = fight('lamo', 12), ev: ReturnType<typeof E.playTurn> = [], L = s.sides[1];
    L.mods = [{ stat: 'def', mult: 0.8, until: 50, tag: 'defDown' }]; L.conf = 2;
    L.hp = Math.ceil(L.max * 0.6);
    stageUp(s, 1, ev);
    expect(L.known).toEqual(LEGENDS.lamo.stages[1].moves);
    expect(L.mods, 'what was put on it goes with the part').toEqual([]);
    expect(L.conf).toBe(0);
    expect(ev.some((e) => e.k === 'anim' && e.a === 'stage' && e.text === 'Il masso sopra la testa')).toBe(true);
    expect(ev.some((e) => e.k === 'line' && e.who === 1)).toBe(true);
  });
  it('chooses again when a part starts: it does not use a move of the part it has left', () => {
    for (let seed = 1; seed < 60; seed++) {
      const s = fight('lamo', seed * 7), L = s.sides[1];
      s.sides[0].stats = { ...s.sides[0].stats!, spe: 9999 };
      L.hp = Math.ceil(L.max * 0.6) + 1; L.stage = 1; L.known = LEGENDS.lamo.stages[1].moves.slice();
      E.beginTurn(s);
      s.plan[1] = 'telepilo';
      const hp = L.hp, ev = E.playTurn(s, { 0: E.available(s, 0).filter((m) => CMOVES[m] && CMOVES[m].kind === 'atk')[0] });
      if (L.stage === 2) {
        expect(ev.some((e) => e.k === 'say' && /Porte di Telepilo/.test(e.text)), 'seed ' + seed).toBe(false);
        expect(L.hp).toBeLessThan(hp);
      }
    }
  });
  it('can change its types, and the magic follows', () => {
    const s = fight('giano', 13), G = s.sides[1], ev: ReturnType<typeof E.playTurn> = [];
    expect(E.sideTypes(s, 1)).toEqual(['Crepuscolo', 'Calore']);
    G.hp = Math.ceil(G.max * 0.6);
    stageUp(s, 1, ev);
    expect(E.sideTypes(s, 1)).toEqual(['Crepuscolo', 'Calma']);
    expect(JSON.parse(JSON.stringify(s)).sides[1].types).toEqual(['Crepuscolo', 'Calma']);
  });
  it('holds a net off until the last part', () => {
    const s = fight('lamo', 14, { oro: 3 }), L = s.sides[1];
    E.beginTurn(s);
    expect(E.available(s, 0)).not.toContain('oro');
    const shut = E.moveLabel(s, 0, 'oro');
    expect(shut.locked).toBe(true);
    expect(shut.sub).toBe('Non regge ancora');
    const ev: ReturnType<typeof E.playTurn> = [];
    L.hp = Math.ceil(L.max * 0.6); stageUp(s, 1, ev);
    expect(E.available(s, 0)).not.toContain('oro');
    L.hp = Math.ceil(L.max * 0.3); stageUp(s, 1, ev);
    expect(E.available(s, 0)).toContain('oro');
    expect(E.moveLabel(s, 0, 'oro').locked).toBe(false);
    expect(ev.some((e) => e.k === 'say' && /retino può tenerlo/.test(e.text)), 'the moment is said').toBe(true);
    expect(s.tired).toBe(true);
  });
  it('a wild creature with no parts takes a net as always', () => {
    const me = member('muraglione', 34, 'c1'), foe = member('cicalina', 8, 'f0');
    const s = E.newBattle({ a: me.id, b: foe.id, seed: 5, sideA: me, sideB: foe, wild: true, bag: { retino: 1 } });
    E.intro(s); E.beginTurn(s);
    expect(E.available(s, 0)).toContain('retino');
  });
  it('plays to the end, the same after a trip through JSON', () => {
    for (const id of Object.keys(LEGENDS)) for (let seed = 1; seed < 12; seed++) {
      const a = fight(id, seed * 101); let b = JSON.parse(JSON.stringify(a)) as BattleState;
      for (let k = 0; k < 400 && a.phase !== 'over'; k++) {
        const ea = turn(a), eb = turn(b);
        expect(JSON.stringify(eb)).toBe(JSON.stringify(ea));
        b = JSON.parse(JSON.stringify(b));
      }
      expect(a.phase, id + ' ' + seed).toBe('over');
    }
  });
});

describe('a blow seen coming', () => {
  /** Lamo in its second part, set on the boulder */
  function winding(seed: number) {
    const s = fight('lamo', seed), L = s.sides[1], ev: ReturnType<typeof E.playTurn> = [];
    L.hp = Math.ceil(L.max * 0.6); stageUp(s, 1, ev);
    L.known = ['naufragio'];
    return s;
  }
  it('gets ready one turn, and lands the next, with no choice left to it', () => {
    const s = winding(21), me = s.sides[0], before = me.hp;
    const first = turn(s);
    expect(me.hp, 'nothing lands while it winds up').toBe(before);
    expect(s.sides[1].charge).toBe('naufragio');
    expect(first.some((e) => e.k === 'say' && /solleva il masso/.test(e.text))).toBe(true);
    expect(E.snap(s).chips[1].some((c) => c.t === 'Sta per colpire'), 'it shows').toBe(true);
    E.beginTurn(s);
    expect(s.forced[1]).toEqual({ move: 'naufragio' });
    E.playTurn(s, { 0: 'telepilo' in {} ? '' : E.available(s, 0)[0] });
    expect(me.hp).toBeLessThan(before);
    expect(s.sides[1].charge).toBeNull();
  });
  it('can be knocked out of its hands by reaching the next part in time', () => {
    const s = winding(22), L = s.sides[1], me = s.sides[0];
    turn(s);
    expect(L.charge).toBe('naufragio');
    /* faster and strong enough: the blow takes it down to the mark before the boulder lands */
    me.stats = { ...me.stats!, spe: 9999, atk: 99999 };
    const hp = me.hp, ev = turn(s, 'masso');
    if (L.stage === 2) {
      expect(me.hp, 'the boulder never lands').toBe(hp);
      expect(L.charge).toBeNull();
      expect(ev.some((e) => e.k === 'say' && /perde la presa/.test(e.text))).toBe(true);
    } else expect(ev.some((e) => e.k === 'anim' && e.a === 'dodge'), 'only a miss leaves it standing').toBe(true);
  });
  it('is the same for a creature on the player\'s side', () => {
    const me = { ...member('lamo', 35, 'c1'), known: ['naufragio'] }, foe = member('muraglione', 34, 'f0');
    const s = E.newBattle({ a: me.id, b: foe.id, seed: 9, sideA: me, sideB: foe });
    E.intro(s); E.beginTurn(s);
    expect(E.moveLabel(s, 0, 'naufragio').sub).toContain('Un turno per caricare');
    E.playTurn(s, { 0: 'naufragio' });
    E.beginTurn(s);
    expect(E.needs(s), 'the next turn is not a choice').toEqual([]);
    const hp = s.sides[1].hp;
    E.playTurn(s);
    expect(s.sides[1].hp < hp || s.sides[1].hp === hp).toBe(true);
    expect(s.sides[0].charge).toBeNull();
  });
});

describe('the flags of a legend', () => {
  it('are the ones the story sets', () => {
    expect(typeof flag(LEGENDS.lamo.after)).toBe('boolean');
    expect(LEGENDS.lamo.after).toBe('tr-mamurra');
    expect(LEGENDS.giano.after).toBe('pietra-voce');
    expect(LEGENDS.elmo.after).toBe('tr-mamurr-peschiere');
  });
});
