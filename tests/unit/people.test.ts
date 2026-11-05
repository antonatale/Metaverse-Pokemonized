import { beforeEach, describe, expect, it } from 'vitest';
import { ENGINE as E, type BattleEvent, type BattleState } from '../../src/battle';
import { CHARS, ROSTER, type FriendId } from '../../src/data/characters';
import { CMOVES } from '../../src/data/creatures';
import { FORM_STATS, PATHS, formAt, grownChar, isFriend, personKnows, personLearns, personMove, withForm } from '../../src/data/people';
import { atLevel } from '../../src/data/growth';
import { st } from '../../src/save/story-progress';
import { anyMove, foeSide, formNow, gainXp, movesOf, sideOf, swapMove } from '../../src/story/growth';
import { FORMS, lookOf } from '../../src/render/svg/forms';
import { defsOf } from '../../src/render/svg';
import { PEOPLE_FORMS } from '../../src/render/canvas/walkers';

/* The people grow in the story, and nowhere else. */
const side = (id: FriendId, lv: number) => foeSide(id, lv);
function duel(a: FriendId, la: number, b: FriendId, lb: number, seed = 5): BattleState {
  const s = E.newBattle({ a, b, seed, sideA: side(a, la), sideB: side(b, lb) });
  E.intro(s); E.beginTurn(s);
  return s;
}
const says = (ev: BattleEvent[]) => ev.filter((e) => e.k === 'say').map((e) => (e as { text: string }).text).join(' | ');
beforeEach(() => { st.seen = {}; st.lv = {}; st.people = undefined; st.mons = []; st.squad = ['antonio']; st.skills = {}; });

describe('the free battles', () => {
  it('stay as they were: all the moves from the first turn, none of the new ones', () => {
    for (const id of ROSTER) {
      const s = E.newBattle({ a: id, b: 'esame', seed: 1 });
      expect('grown' in s.sides[0], id).toBe(false);
      expect(E.available(s, 0).sort(), id).toEqual(CHARS[id].moves.map((m) => m.id).sort());
      for (const m of PATHS[id].moves) expect(CHARS[id].moves.map((x) => x.id), id + ' in the free battles').not.toContain(m.id);
    }
  });
});

describe('the paths', () => {
  for (const id of ROSTER) {
    it(id + ' starts with two moves, has its four by level 10, and goes on', () => {
      expect(personKnows(id, 5)).toHaveLength(2);
      expect(personKnows(id, 10)).toEqual(expect.arrayContaining(CHARS[id].moves.map((m) => m.id)));
      expect(personKnows(id, 26)).toEqual(expect.arrayContaining(PATHS[id].moves.map((m) => m.id)));
    });
    it(id + ' learns only moves that exist, all of them, one thing at a time', () => {
      const all = grownChar(id).moves.map((m) => m.id);
      expect(PATHS[id].learn.map((l) => l[1]).sort()).toEqual(all.slice().sort());
      expect(PATHS[id].learn[0][0]).toBe(5);
    });
    it(id + ' is never left with nothing to do, whatever it has used up and whatever Antonio has lost', () => {
      for (let lv = 5; lv <= 40; lv++) {
        const free = personKnows(id, lv).filter((m) => !grownChar(id).moves.filter((x) => x.id === m)[0].uses);
        expect(free.length, id + ' at ' + lv).toBeGreaterThanOrEqual(id === 'antonio' ? 2 : 1);
      }
    });
    it(id + ' has a drawing for each form, on the screen and on the map', () => {
      expect(FORMS[id]).toHaveLength(PATHS[id].forms.length);
      expect(PEOPLE_FORMS[id]).toHaveLength(PATHS[id].forms.length);
      expect(lookOf(id, 0)).toBeUndefined();
      for (const f of [1, 2]) {
        const look = lookOf(id, f)!;
        expect(look.P).not.toBe(lookOf(id, 3 - f)!.P);
        expect(defsOf(look)).toContain(look.P + 'Body');
      }
    });
  }
  it('no new move has the id of a move of someone else: a move is found by its id', () => {
    const seen = new Set<string>();
    for (const id of ROSTER) for (const m of PATHS[id].moves) {
      expect(CMOVES[m.id], m.id).toBeUndefined();
      expect(seen.has(m.id), m.id).toBe(false);
      seen.add(m.id);
      for (const c of Object.values(CHARS)) expect(c.moves.map((x) => x.id), m.id).not.toContain(m.id);
    }
  });
  it('the forms come at the same levels, with more numbers', () => {
    expect(formAt('antonio', 13)).toBe(0);
    expect(formAt('antonio', 14)).toBe(1);
    expect(formAt('antonio', 26)).toBe(2);
    const s = atLevel(CHARS.antonio.stats, 26);
    expect(withForm(s, 2).atk).toBe(Math.round(s.atk * FORM_STATS[2]));
    expect(isFriend('esame')).toBe(false);
  });
});

describe('in a battle', () => {
  it('a person fights with what it knows, and the rest stays out of reach', () => {
    const s = duel('antonio', 5, 'costanzo', 6);
    expect(E.available(s, 0).sort()).toEqual(['diagnosi', 'simtoreal']);
    const pad = E.charOf(s, 0).moves.filter((m) => !s.sides[0].known || s.sides[0].known.indexOf(m.id) >= 0);
    expect(pad.map((m) => m.id).sort()).toEqual(['diagnosi', 'simtoreal']);
  });
  it('Antonio cannot lose the thing of a move he does not know yet', () => {
    for (let seed = 1; seed < 200; seed++) {
      const s = duel('antonio', 5, 'costanzo', 6, seed);
      for (let k = 0; k < 8 && s.phase !== 'over'; k++) {
        if (s.phase === 'begin') E.beginTurn(s);
        if (s.sides[0].lock) expect(['diagnosi', 'simtoreal']).toContain(s.sides[0].lock.move);
        if (s.phase === 'select') E.playTurn(s, { 0: E.available(s, 0)[0] });
      }
    }
  });
  it('every new move does what its numbers say, and leaves every number a number', () => {
    for (const id of ROSTER) for (const m of PATHS[id].moves) {
      const s = E.newBattle({ a: id, b: 'costanzo', seed: 41, sideA: { ...side(id, 30), known: [m.id] }, sideB: side('costanzo', 30) });
      s.sides[0].hp -= 30; s.sides[0].stats = { ...s.sides[0].stats!, spe: 999 };
      E.intro(s); E.beginTurn(s);
      const ev = E.playTurn(s, { 0: m.id });
      expect(says(ev), m.id).toContain(m.name);
      for (const x of s.sides) expect(Number.isFinite(x.hp), id + ' ' + m.id).toBe(true);
    }
  });
  it('a blow seen coming works for a person too, and says what it is', () => {
    /* a foe that only talks to itself: Costanzo's blows could keep Antonio from speaking */
    const s = E.newBattle({ a: 'antonio', b: 'costanzo', seed: 7, sideA: { ...side('antonio', 30), known: ['chicago', 'paper'] }, sideB: { ...side('costanzo', 30), known: ['personaggismo'] } });
    E.intro(s); E.beginTurn(s);
    const hp = s.sides[1].hp, first = E.playTurn(s, { 0: 'chicago' });
    expect(says(first)).toContain('fa il check-in');
    expect(E.snap(s).chips[0].some((c) => c.t === 'Sta per colpire')).toBe(true);
    expect(s.sides[1].hp).toBe(hp);
    E.beginTurn(s);
    expect(E.needs(s)).not.toContain(0);
    const land = E.playTurn(s);
    expect(land.some((e) => e.k === 'anim' && e.a === 'banner' && e.text === 'CHICAGO!')).toBe(true);
  });
  it('the buttons tell what the new moves do', () => {
    const s = E.newBattle({ a: 'antonio', b: 'costanzo', seed: 7, sideA: { ...side('antonio', 30), known: ['paper', 'gradiente', 'chicago'] }, sideB: side('costanzo', 30) });
    E.intro(s); E.beginTurn(s);
    expect(E.moveLabel(s, 0, 'paper').sub).toContain('Potenza 75');
    expect(E.moveLabel(s, 0, 'gradiente').sub).toContain('Attacco +30%');
    expect(E.moveLabel(s, 0, 'chicago').sub).toContain('Un turno per caricare');
    expect(E.moveLabel(s, 0, 'paper').eff, 'the magic of the types is for the creatures').toBeUndefined();
  });
  it('a change of form goes with who comes in', () => {
    const me = { id: 'cicalina' as const, key: 'c1', stats: atLevel(CHARS.antonio.stats, 20), lvl: 20, known: ['botta'] };
    const s = E.newBattle({ a: me.id, b: 'cicalina', seed: 3, sideA: me, benchA: [{ id: 'antonio', key: 'antonio', last: true, ...side('antonio', 30) }], sideB: { stats: atLevel(CHARS.antonio.stats, 40), lvl: 40, known: ['botta'] } });
    expect(s.bench![0][0].form).toBe(2);
    expect(s.bench![0][0].grown).toBe(true);
    s.sides[0].hp = 1;
    E.intro(s); E.beginTurn(s);
    E.playTurn(s, { 0: 'botta' });
    const ev = E.sendIn(s, { 0: 0 });
    expect(ev.filter((e) => e.k === 'swap').map((e) => (e as { form?: number }).form)).toEqual([2]);
  });
  it('a foe at a level has the form and the moves of that level', () => {
    expect(foeSide('forchetta', 9).form).toBe(0);
    expect(foeSide('forchetta', 9).known).toEqual(personKnows('forchetta', 9));
    expect(foeSide('forchetta', 20).form).toBe(1);
    expect(foeSide('esame', 9).grown).toBeUndefined();
  });
});

describe('growing up', () => {
  it('an old save knows what its level says, and nothing is lost', () => {
    st.lv = { antonio: { lv: 12, xp: 0 } };
    expect(movesOf('antonio').sort()).toEqual(personKnows('antonio', 12).sort());
    expect(sideOf('antonio').known).toEqual(movesOf('antonio'));
    expect(sideOf('antonio').grown).toBe(true);
    expect(st.people).toBeUndefined();
  });
  it('going up it learns, with room straight away', () => {
    st.lv = { antonio: { lv: 6, xp: 0 } };
    const g = gainXp('antonio', 5000);
    expect(g.to).toBeGreaterThan(9);
    expect(g.learned).toContain('certificati');
    expect(movesOf('antonio')).toContain('america');
  });
  it('with four it asks, and a swap stays', () => {
    st.lv = { antonio: { lv: 13, xp: 0 } };
    const g = gainXp('antonio', 200);
    expect(g.to).toBeGreaterThanOrEqual(14);
    expect(g.pending).toEqual(['paper']);
    expect(g.grew).toEqual({ id: 'antonio', from: 0, to: 1 });
    swapMove('antonio', 'diagnosi', 'paper');
    expect(movesOf('antonio')).toContain('paper');
    expect(movesOf('antonio')).not.toContain('diagnosi');
    expect(JSON.parse(JSON.stringify(st.people)).antonio.moves).toEqual(movesOf('antonio'));
  });
  it('the form follows the level', () => {
    st.lv = { costanzo: { lv: 26, xp: 0 } };
    expect(formNow('costanzo')).toBe(2);
    expect(sideOf('costanzo').form).toBe(2);
    expect(formNow('c1')).toBe(0);
  });
  it('a creature goes on as it did', () => {
    st.mons = [{ uid: 'c1', sp: 'cicalina', moves: ['botta'], bond: 20 }] as typeof st.mons;
    st.lv = { c1: { lv: 5, xp: 0 } };
    expect(gainXp('c1', 10).grew).toBeUndefined();
    expect(movesOf('c1')).toContain('botta');
    expect(st.people).toBeUndefined();
  });
  it('a move is found from its id, of a creature or of a person', () => {
    expect(anyMove('botta').name).toBe(CMOVES.botta.name);
    expect(anyMove('paper').name).toBe('Paper su arXiv');
    expect(anyMove('diagnosi').name).toBe('Diagnosi Energetica');
    expect(personMove('nope')).toBeNull();
    expect(personLearns('antonio', 14)).toEqual(['paper']);
  });
});
