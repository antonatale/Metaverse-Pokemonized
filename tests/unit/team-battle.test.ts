import { describe, expect, it } from 'vitest';
import { SPECIES, knownAt, type SpeciesId } from '../../src/data/creatures';
import { atLevel, xpFor } from '../../src/data/growth';
import { ENGINE as E, type BattleState, type Member, type NewBattle } from '../../src/battle';
import { fightPay } from '../../src/story/growth';

/* A team battle: the two teams live inside one battle state, with a bench on each side. The free battles have none of
   this (the golden test proves it); here, what a bench brings. */
const mon = (id: SpeciesId, lv: number, key?: string): Member => ({ id, key, stats: atLevel(SPECIES[id].stats, lv), lvl: lv, known: knownAt(id, lv) });
function team(a: Member[], b: Member[], o?: Partial<NewBattle>): BattleState {
  return E.newBattle({ a: a[0].id, b: b[0].id, seed: 12345, sideA: a[0], sideB: b[0], benchA: a.slice(1), benchB: b.slice(1), bag: {}, ...o });
}
/** plays on with the player choosing by `pick` (a move or a switch), sending in the first one able */
function playOn(s: BattleState, pick?: (s: BattleState) => string | undefined, send?: (s: BattleState, i: number, must: boolean) => number) {
  for (let n = 0; n < 600 && s.phase !== 'over'; n++) {
    if (s.phase === 'intro') { E.intro(s); continue; }
    if (s.phase === 'begin') { E.beginTurn(s); continue; }
    if (s.phase === 'send') {
      const picks: Record<number, number> = {};
      E.sendNeeds(s).forEach((a) => { const c = send ? send(s, a.side, a.must) : a.must ? E.benchLabels(s, a.side).filter((b) => b.ready)[0].slot : -2; picks[a.side] = c; });
      E.sendIn(s, picks);
      continue;
    }
    const ch: Record<number, string> = {};
    E.needs(s).forEach((i) => { ch[i] = (pick && pick(s)) || E.ai(s, i); });
    E.playTurn(s, ch);
  }
  return s;
}
const up = (s: BattleState, i: number) => [s.sides[i]].concat(s.bench![i]).filter((x) => x.hp > 0).length;

describe('team battles', () => {
  it('go on until a whole side is down, and everyone on it is accounted for', () => {
    let seed = 1;
    for (const a of ['polpino', 'ramarrino', 'gabbi'] as SpeciesId[]) for (const b of ['cicalina', 'riccetto', 'granchietto'] as SpeciesId[]) {
      const s = team([mon(a, 12, 'c1'), mon('olivella', 12, 'c2'), mon('civettina', 11, 'c3')], [mon(b, 12), mon('granchietto', 13), mon('olivella', 12)], { seed: seed++ * 7919 });
      playOn(s);
      expect(s.phase).toBe('over');
      expect(s.result).toBe('win');
      expect(up(s, 1 - s.winner!)).toBe(0);
      expect(up(s, s.winner!)).toBeGreaterThan(0);
    }
  });
  it('are the same battle after going through JSON, turn after turn', () => {
    const make = () => team([mon('polpino', 14, 'c1'), mon('gabbi', 14, 'c2')], [mon('cicalina', 14), mon('riccetto', 14)], { smart: [0, 2], seed: 99 });
    const plain = make(), saved = make();
    for (let k = 0; k < 400 && plain.phase !== 'over'; k++) {
      const step = (x: BattleState) => { if (x.phase === 'intro') return E.intro(x); if (x.phase === 'begin') return E.beginTurn(x); if (x.phase === 'send') return E.sendIn(x, E.sendNeeds(x).some((a) => a.must) ? { 0: E.benchLabels(x, 0).filter((b) => b.ready)[0].slot } : {}); return E.playTurn(x, { 0: E.ai(x, 0) }); };
      const one = step(plain), copy: BattleState = JSON.parse(JSON.stringify(saved));
      const two = step(copy);
      Object.assign(saved, copy);
      expect(two).toEqual(one);
    }
    expect(plain.phase).toBe('over');
    expect(JSON.parse(JSON.stringify(saved))).toEqual(JSON.parse(JSON.stringify(plain)));
  });
  it('let the player change: it costs the turn, and whoever comes in takes the hit', () => {
    const s = team([mon('polpino', 20, 'c1'), mon('ramarrino', 20, 'c2')], [mon('cicalina', 20)], { smart: [0, 0] });
    E.intro(s); E.beginTurn(s);
    const before = s.sides[1].hp, polpinoHp = s.sides[0].hp, sw = E.switches(s, 0);
    expect(sw).toEqual(['switch:0']);
    const ev = E.playTurn(s, { 0: sw[0] });
    expect(s.sides[0].id).toBe('ramarrino');
    expect(s.bench![0][0].id).toBe('polpino');
    expect(s.bench![0][0].hp).toBe(polpinoHp);
    expect(s.sides[1].hp).toBe(before);                                 /* it did not attack */
    expect(ev.findIndex((e) => e.k === 'swap')).toBeLessThan(ev.findIndex((e) => e.k === 'anim' && (e.a === 'magic' || e.a === 'magicUp')));
    const swap = ev.find((e) => e.k === 'swap');
    expect(swap).toMatchObject({ who: 0, id: 'ramarrino' });
  });
  it('wipe what was only of the moment, and keep health and spent moves', () => {
    const s = team([mon('polpino', 20, 'c1'), mon('ramarrino', 20, 'c2')], [mon('cicalina', 20)]);
    E.intro(s); E.beginTurn(s);
    const me = s.sides[0];
    me.mods.push({ stat: 'atk', mult: 1.3, until: 99, tag: 'atkUp' }); me.conf = 2; me.uses.x = 1; me.hp = 11;
    E.playTurn(s, { 0: 'switch:0' });
    expect(s.bench![0][0]).toMatchObject({ mods: [], conf: 0, hp: 11 + Math.round(s.bench![0][0].max * 0.05), uses: { x: 1 } });
  });
  it('refuse a change that is not there, and one onto somebody down', () => {
    const s = team([mon('polpino', 20, 'c1'), mon('ramarrino', 20, 'c2')], [mon('cicalina', 20)]);
    s.bench![0][0].hp = 0;
    E.intro(s); E.beginTurn(s);
    expect(E.switches(s, 0)).toEqual([]);
    E.playTurn(s, { 0: 'switch:0' });
    expect(s.sides[0].id).toBe('polpino');
  });
  it('put who comes in by choice on guard for that turn, and rest who waits on the bench', () => {
    const s = team([mon('polpino', 20, 'c1'), mon('ramarrino', 20, 'c2')], [mon('cicalina', 20)], { seed: 4242 });
    s.sides[0].hp = 50;
    E.intro(s); E.beginTurn(s);
    const ev = E.playTurn(s, { 0: 'switch:0' });
    expect(ev.some((e) => e.k === 'sync' && e.chips[0].some((c) => c.t === 'In guardia'))).toBe(true);
    expect(s.sides[0].fresh).toBeUndefined();                             /* gone with the turn */
    expect(s.bench![0][0].hp).toBe(50 + Math.round(s.bench![0][0].max * 0.05));
    /* the same blow, half of it */
    const blow = (fresh: boolean) => {
      const b = team([mon('ramarrino', 20, 'c2')], [mon('cicalina', 20)], { seed: 77 });
      E.intro(b); E.beginTurn(b);
      if (fresh) b.sides[0].fresh = true;
      return E.expected(b, 1, E.available(b, 1).filter((m) => E.moveLabel(b, 1, m).kind === 'atk')[0]);
    };
    expect(blow(true)).toBeCloseTo(blow(false) / 2, 5);
  });
  it('have nobody hit a fighter who is down: the turn ends there', () => {
    const s = team([mon('polpino', 40, 'c1')], [mon('olivella', 5), mon('cicalina', 5)]);
    E.intro(s); E.beginTurn(s);
    s.sides[1].hp = 1;
    const ev = E.playTurn(s, { 0: E.available(s, 0).filter((m) => E.moveLabel(s, 0, m).kind === 'atk')[0] });
    expect(s.sides[1].hp).toBe(0);
    expect(s.phase).toBe('send');
    expect(s.result).toBe(null);
    expect(ev.filter((e) => e.k === 'end')).toEqual([]);
    expect(ev.filter((e) => e.k === 'say').map((e) => (e as { text: string }).text).join(' ')).toContain('è KO!');
  });
  it('tell who the trainer sends next, and let the player change first, for free', () => {
    const s = team([mon('polpino', 40, 'c1'), mon('ramarrino', 40, 'c2')], [mon('olivella', 5), mon('cicalina', 5)], { trainer: 'L\'animatore' });
    E.intro(s); E.beginTurn(s);
    s.sides[1].hp = 1;
    const ev = E.playTurn(s, { 0: E.available(s, 0).filter((m) => E.moveLabel(s, 0, m).kind === 'atk')[0] });
    expect(ev.filter((e) => e.k === 'say').map((e) => (e as { text: string }).text).join(' ')).toContain('L\'animatore sta per mandare in campo Cicalina');
    expect(E.sendNeeds(s)).toEqual([{ side: 0, must: false }]);
    const hp = s.sides[0].hp, after = E.sendIn(s, { 0: 0 });
    expect(s.sides[0].id).toBe('ramarrino');
    expect(s.sides[1].id).toBe('cicalina');
    expect(s.bench![0][0].hp).toBe(hp);
    expect(s.phase).toBe('begin');
    expect(after.filter((e) => e.k === 'swap').length).toBe(2);
  });
  it('make the player answer when his own is down, or give up', () => {
    const s = team([mon('polpino', 5, 'c1'), mon('ramarrino', 40, 'c2')], [mon('muraglione', 50)]);
    s.sides[0].hp = 1;
    E.intro(s); E.beginTurn(s); E.playTurn(s, { 0: E.available(s, 0)[0] });
    if (s.phase !== 'send') { E.beginTurn(s); E.playTurn(s, { 0: E.available(s, 0)[0] }); }
    expect(s.phase).toBe('send');
    expect(E.sendNeeds(s)).toEqual([{ side: 0, must: true }]);
    expect(E.benchLabels(s, 0).map((b) => b.ready)).toEqual([true]);
    const quit: BattleState = JSON.parse(JSON.stringify(s)), ev = E.sendIn(quit, { 0: -1 });
    expect(quit).toMatchObject({ phase: 'over', result: 'win', winner: 1 });
    expect(ev.filter((e) => e.k === 'say' && /è KO/.test(e.text))).toEqual([]);   /* it was told when it fell */
    E.sendIn(s, { 0: 0 });
    expect(s.sides[0].id).toBe('ramarrino');
  });
  it('keep Antonio for last: he comes in only when all the creatures are down', () => {
    const antonio: Member = { id: 'antonio', key: 'antonio', last: true, stats: atLevel(SPECIES.polpino.stats, 10), lvl: 10 };
    const s = team([mon('polpino', 5, 'c1'), mon('ramarrino', 5, 'c2'), antonio], [mon('muraglione', 50)]);
    E.intro(s); E.beginTurn(s);
    expect(E.switches(s, 0)).toEqual(['switch:0']);
    s.sides[0].hp = 0; s.phase = 'send';
    expect(E.benchLabels(s, 0).filter((b) => b.ready).map((b) => b.id)).toEqual(['ramarrino']);
    E.sendIn(s, { 0: 1 });                                               /* asking for him now gets the creature */
    expect(s.sides[0].id).toBe('ramarrino');
    s.sides[0].hp = 0; s.phase = 'send';
    expect(E.benchLabels(s, 0).filter((b) => b.ready).map((b) => b.id)).toEqual(['antonio']);
    E.sendIn(s, { 0: 1 });
    expect(s.sides[0].id).toBe('antonio');
    expect(E.switches(s, 0)).toEqual([]);
  });
  it('write down who fought whom, and who brought it down', () => {
    const s = team([mon('polpino', 30, 'c1'), mon('ramarrino', 30, 'c2')], [mon('olivella', 6), mon('cicalina', 6)]);
    E.intro(s); E.beginTurn(s);
    E.playTurn(s, { 0: 'switch:0' });                                    /* Polpino has faced it, then Ramarrino */
    playOn(s, (st) => E.available(st, 0).filter((m) => E.moveLabel(st, 0, m).kind === 'atk')[0]);
    expect(s.result).toBe('win');
    expect(s.bouts).toEqual([
      { key: 'f0', foe: 'olivella', lv: 6, who: ['c1', 'c2'], ko: true, by: 'c2' },
      { key: 'f1', foe: 'cicalina', lv: 6, who: ['c2'], ko: true, by: 'c2' }
    ]);
  });
  it('pay a foe once: all to who brought it down, a third to whoever else fought it, a third to all if it stayed up', () => {
    expect(fightPay([{ key: 'f0', foe: 'olivella', lv: 6, who: ['c1', 'c2'], ko: true, by: 'c2' }], true)).toEqual([
      { key: 'c1', xp: xpFor(6, false, true), won: false }, { key: 'c2', xp: xpFor(6, true, true), won: true }]);
    expect(fightPay([{ key: 'f0', foe: 'olivella', lv: 6, who: ['c1'], ko: true, by: 'c1' }, { key: 'f1', foe: 'cicalina', lv: 7, who: ['c1', 'c2'], ko: false, by: null }], true)).toEqual([
      { key: 'c1', xp: xpFor(6, true, true) + xpFor(7, false, true), won: true }, { key: 'c2', xp: xpFor(7, false, true), won: false }]);
  });
  it('leave a turn to a catch: the bout ends with who was on the field', () => {
    const s = team([mon('polpino', 20, 'c1'), mon('gabbi', 20, 'c2')], [mon('cicalina', 3)], { wild: true, bag: { oro: 9 } });
    playOn(s, (st) => (st.sides[1].hp < st.sides[1].max * 0.5 ? 'oro' : undefined));
    expect(s.result === 'catch' || s.result === 'win').toBe(true);
    expect(s.bouts![0]).toMatchObject({ ko: true, by: 'c1' });
  });
  it('show one dot for each of the team, up or down, and not Antonio', () => {
    const antonio: Member = { id: 'antonio', key: 'antonio', last: true };
    const s = team([mon('polpino', 20, 'c1'), mon('ramarrino', 20, 'c2'), antonio], [mon('cicalina', 20)]);
    s.bench![0][0].hp = 0;
    expect(E.snap(s).team).toEqual([['up', 'ko'], ['up']]);
    const free = E.newBattle({ a: 'antonio', b: 'costanzo', seed: 3 });
    expect('team' in E.snap(free)).toBe(false);
    expect('bench' in free).toBe(false);
  });
  it('say how each one on the bench stands against the foe', () => {
    /* Gabbì (Caos) is beaten by Calma; Polpino is Cervello: Caos beats it */
    const s = team([mon('polpino', 20, 'c1'), mon('gabbi', 20, 'c2'), mon('ramarrino', 20, 'c3')], [mon('gabbi', 20)]);
    const [gabbi, ramarrino] = E.benchLabels(s, 0);
    expect(gabbi).toMatchObject({ name: 'Gabbì', ready: true });
    expect(ramarrino.hits).toBeGreaterThan(0);
    expect(ramarrino.types).toEqual(['Calma']);
  });
});

describe('a trainer who plays his team', () => {
  /* against the player's Calamastro (Cervello and Corrente) Solleone stands badly; Burrasco's Caos beats both, and waits behind */
  const losing = (smart: number, seed: number) => {
    const s = team([mon('polpetto', 20, 'c1')], [mon('cicalona', 20), mon('gabbianotto', 20), mon('olivastro', 20)], { smart: [0, smart], seed });
    E.intro(s); E.beginTurn(s);
    return s;
  };
  it('changes now and then when it is losing and has someone better, and never when it plays by the book', () => {
    let changed = 0;
    for (let seed = 1; seed <= 60; seed++) {
      if (/^switch:/.test(losing(2, seed * 31).plan[1] || '')) changed++;
      expect(losing(0, seed * 31).plan[1]).not.toMatch(/^switch:/);
    }
    expect(changed).toBeGreaterThan(20);
    expect(changed).toBeLessThan(60);
  });
  it('stays in when the one in front is no danger', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const s = team([mon('polpino', 8, 'c1')], [mon('ramarrino', 30), mon('gabbi', 30)], { smart: [0, 2], seed: seed * 13 });
      E.intro(s); E.beginTurn(s);
      expect(s.plan[1]).not.toMatch(/^switch:/);
    }
  });
  it('has only so many changes', () => {
    const s = losing(1, 7);
    s.swaps![1] = 0;
    for (let k = 0; k < 20; k++) expect(E.ai(s, 1)).not.toMatch(/^switch:/);
    let n = 0;
    for (let seed = 1; seed < 200 && !n; seed++) {
      const t = losing(1, seed);
      if (/^switch:/.test(t.plan[1] || '')) { E.playTurn(t, { 0: E.available(t, 0)[0] }); expect(t.swaps![1]).toBe(0); n++; }
    }
    expect(n).toBe(1);
  });
  it('sends in the best against the one in front, if it plays well; otherwise the next of its team', () => {
    const make = (smart: number) => {
      const s = team([mon('ramarrone', 25, 'c1')], [mon('olivella', 5), mon('gabbi', 12), mon('polpetto', 25)], { smart: [0, smart], seed: 5 });
      s.swaps![1] = 0;
      E.intro(s); E.beginTurn(s);
      s.sides[1].hp = 1;
      E.playTurn(s, { 0: E.available(s, 0).filter((m) => E.moveLabel(s, 0, m).kind === 'atk')[0] });
      return s;
    };
    expect(make(0).nextIn![1]).toBe(0);
    expect(make(1).nextIn![1]).toBe(1);
  });
  it('lets a plan that is a change have no move name', () => {
    let s = losing(2, 1);
    for (let seed = 1; seed < 80 && !/^switch:/.test(s.plan[1] || ''); seed++) s = losing(2, seed * 977);
    expect(s.plan[1]).toMatch(/^switch:/);
    expect(E.planName(s, 1)).toBe(null);
  });
});
