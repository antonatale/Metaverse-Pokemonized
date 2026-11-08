import { describe, expect, it } from 'vitest';
import { ENGINE as E, type BattleEvent, type BattleState, type Member, type NewBattle } from '../../src/battle';
import { SPECIES, knownAt, type SpeciesId } from '../../src/data/creatures';
import { atLevel } from '../../src/data/growth';
import { PLACE_MAGIC, sceneFor } from '../../src/data/scenes';
import { FIELD_TUNE } from '../../src/data/tuning';
import { TRAINERS } from '../../src/data/trainers';
import { wantsResonance } from '../../src/battle/surge';
import { MAGIC_ORDER } from '../../src/data/types';

/* The magic of a place, Slancio and Risonanza, a boss's shield: only with a place, so never between friends. */
const mon = (id: SpeciesId, lv: number, o?: Partial<Member>): Member => ({ id, key: id, stats: atLevel(SPECIES[id].stats, lv), lvl: lv, known: knownAt(id, lv), ...o });
const CALMA = PLACE_MAGIC.castellone, CAOS = PLACE_MAGIC.porto;
function fight(a: Member[], b: Member[], o?: Partial<NewBattle>): BattleState {
  const s = E.newBattle({ a: a[0].id, b: b[0].id, seed: 77, sideA: a[0], sideB: b[0], benchA: a.slice(1), benchB: b.slice(1), bag: {}, field: CALMA, ...o });
  E.intro(s); E.beginTurn(s);
  return s;
}
const says = (ev: BattleEvent[]) => ev.filter((e) => e.k === 'say').map((e) => (e as { text: string }).text).join(' | ');
/** how much a move does to the foe, with no dice in the way */
function hit(field: typeof CALMA | undefined, id: string) {
  const s = E.newBattle({ a: 'ramarrino', b: 'cicalina', seed: 3, sideA: mon('ramarrino', 20, { known: [id] }), sideB: mon('cicalina', 20), field });
  return E.expected(s, 0, id);
}

describe('the magic of a place', () => {
  it('every scene with creatures has one, and it is a type', () => {
    for (const id of ['vindicio', 'pineta', 'porto', 'mola', 'castellone', 'maranola', 'castellonorato', 'gianola', 'caposele', 'centro', 'cisterna']) {
      expect(PLACE_MAGIC[id], id).toBeTruthy();
      expect(MAGIC_ORDER).toContain(PLACE_MAGIC[id].type);
    }
    expect(PLACE_MAGIC[sceneFor('circolo', null)], 'the friends fight indoors, with none').toBeUndefined();
    expect(PLACE_MAGIC[sceneFor('morgana', null)]).toBeUndefined();
  });
  it('makes the moves of its type stronger, and those only', () => {
    expect(hit(CALMA, 'coda') / hit(undefined, 'coda')).toBeCloseTo(FIELD_TUNE.boost, 5);
    expect(hit(CAOS, 'coda') / hit(undefined, 'coda')).toBeCloseTo(1, 5);
    expect(hit(CALMA, 'botta') / hit(undefined, 'botta'), 'a plain move has no type').toBeCloseTo(1, 5);
  });
  it('is said when the battle opens, and on the button of the moves', () => {
    const s = E.newBattle({ a: 'ramarrino', b: 'cicalina', seed: 3, sideA: mon('ramarrino', 20), sideB: mon('cicalina', 20), field: CALMA, benchA: [] });
    expect(says(E.intro(s))).toContain('La magia di Castellone');
    E.beginTurn(s);
    expect(E.moveLabel(s, 0, 'coda').sub).toContain('+10% qui');
    expect(E.snap(s).place).toBe('Calma +10%');
  });
  it('does not reach a battle without a place, nor the people', () => {
    const s = E.newBattle({ a: 'antonio', b: 'costanzo', seed: 1 });
    expect('field' in s).toBe(false);
    expect('surge' in s).toBe(false);
  });
});

describe('Slancio', () => {
  /** Gabbì hits a Polpino on the wrong foot: Caos on Cervello */
  const pair = () => fight([mon('polpino', 20, { resonate: true, known: ['botta'] })], [mon('gabbi', 20, { known: ['coda'] })], { field: CAOS });
  it('goes up for who lands a super effective blow, and for who takes it', () => {
    /* Gabbì is Caos and Polpino Cervello: the Furto di panino is super effective, and Polpino's Scintilla plain */
    for (let seed = 1; seed < 30; seed++) {
      const s = fight([mon('gabbi', 20, { known: ['furto'] })], [mon('polpino', 20, { known: ['botta'] })], { field: CAOS, seed });
      s.sides[1].skip = { why: 'talk' };
      s.forced[1] = { skip: true };
      const ev = E.playTurn(s, { 0: 'furto' }), landed = ev.some((e) => e.k === 'hp' && e.who === 1 && !!e.dmg);
      expect(s.surge![1], 'seed ' + seed).toBe(landed ? 1 : 0);
      expect(s.surge![0]).toBe(landed ? 1 : 0);
    }
  });
  it('a plain blow gives none, unless it is a critical', () => {
    for (let seed = 1; seed < 30; seed++) {
      const s = fight([mon('gabbi', 20, { known: ['beccata'] })], [mon('polpino', 20, { known: ['botta'] })], { field: CAOS, seed });
      s.sides[1].skip = { why: 'talk' };
      s.forced[1] = { skip: true };
      const ev = E.playTurn(s, { 0: 'beccata' }), crit = ev.some((e) => e.k === 'hp' && e.who === 1 && e.crit);
      expect(s.surge![1], 'the one who takes it').toBe(0);
      expect(s.surge![0]).toBe(crit ? 1 : 0);
    }
  });
  it('stops at three', () => {
    const s = pair(); s.surge = [3, 3];
    for (let k = 0; k < 6 && s.phase !== 'over'; k++) { if (s.phase === 'begin') E.beginTurn(s); if (s.phase === 'select') E.playTurn(s, { 0: 'botta' }); }
    expect(Math.max(...s.surge!)).toBeLessThanOrEqual(FIELD_TUNE.max);
  });
});

describe('Risonanza', () => {
  const ready = (o?: Partial<Member>) => { const s = fight([mon('ramarrino', 20, { resonate: true, ...o }), mon('polpino', 19)], [mon('cicalina', 20)], { field: CAOS }); s.surge = [3, 0]; return s; };
  it('wants three points and a bond strong enough, once in a battle', () => {
    const s = ready();
    expect(E.canResonate(s, 0)).toBe(true);
    s.surge = [2, 0];
    expect(E.canResonate(s, 0), 'two points').toBe(false);
    const n = ready({ resonate: undefined });
    expect(E.canResonate(n, 0), 'no bond').toBe(false);
  });
  it('gives the type of the place for the whole battle, some health, and a blow half as strong again', () => {
    const s = ready(), x = s.sides[0], m = s.sides[0].known![0];
    x.hp = x.max - 50; x.stats = { ...x.stats!, spe: 999 };
    const id = E.available(s, 0).filter((q) => E.moveLabel(s, 0, q).kind === 'atk')[0];
    const ev = E.playTurn(s, { 0: 'res:' + id });
    expect(typeof m).toBe('string');
    expect(ev.some((e) => e.k === 'anim' && e.a === 'resonance')).toBe(true);
    expect(s.resonated).toEqual([true, false]);
    expect(s.surge![0]).toBe(0);
    expect(E.sideTypes(s, 0)).toEqual(['Calma', 'Caos']);
    expect(x.hp).toBeGreaterThan(x.max - 50);
    expect(E.canResonate(s, 0), 'once').toBe(false);
  });
  it('keeps the types of a creature that already has the one of the place', () => {
    const s = fight([mon('gabbi', 20, { resonate: true })], [mon('cicalina', 20)], { field: CAOS });
    s.surge = [3, 0];
    E.playTurn(s, { 0: 'res:' + E.available(s, 0)[0] });
    expect(s.sides[0].types).toBeUndefined();
    expect(s.resonated![0]).toBe(true);
  });
  it('cures a state, as a thing done with a creature that has come back to itself', () => {
    const s = ready(); s.sides[0].status = { id: 'siesta', left: 3 };
    const ev = E.playTurn(s, { 0: 'res:' + E.available(s, 0)[0] });
    expect(says(ev)).toContain('si sveglia');
  });
  it('asked for when it cannot be done, the move goes on alone', () => {
    const s = ready(); s.surge = [1, 0];
    const ev = E.playTurn(s, { 0: 'res:' + E.available(s, 0)[0] });
    expect(ev.some((e) => e.k === 'anim' && e.a === 'resonance')).toBe(false);
    expect(s.resonated).toEqual([false, false]);
  });
  it('the type stays through a change, and the blow does not', () => {
    const s = ready(); s.sides[0].stats = { ...s.sides[0].stats!, spe: 999 };
    s.sides[1].stats = { ...s.sides[1].stats!, def: 9999 };
    E.playTurn(s, { 0: 'res:' + E.available(s, 0).filter((q) => E.moveLabel(s, 0, q).kind !== 'atk')[0] });
    expect(s.sides[0].boost, 'it waits for a blow').toBe(true);
    if (s.phase === 'begin') E.beginTurn(s);
    E.playTurn(s, { 0: 'switch:0' });
    expect(s.bench![0][0].types).toEqual(['Calma', 'Caos']);
    expect(s.bench![0][0].boost).toBe(false);
  });
  it('the computer does not always do it at the same moment', () => {
    let yes = 0, no = 0;
    for (let seed = 1; seed < 200; seed++) {
      const s = fight([mon('polpino', 20)], [mon('ramarrino', 20, { resonate: true })], { field: CAOS, seed, smart: [0, 2] });
      s.surge = [0, 3]; s.sides[1].hp = Math.round(s.sides[1].max * 0.4);
      if (wantsResonance(s, 1)) yes++; else no++;
    }
    expect(yes).toBeGreaterThan(no);
    expect(no).toBeGreaterThan(20);
  });
  it('plays to the end, the same after a trip through JSON', () => {
    for (let seed = 1; seed < 20; seed++) {
      const a = fight([mon('ramarrino', 22, { resonate: true }), mon('polpino', 21, { resonate: true })], [mon('granchione', 22), mon('riccione', 22)], { seed: seed * 31, field: CAOS, smart: [0, 2] });
      let b = JSON.parse(JSON.stringify(a)) as BattleState;
      const step = (s: BattleState) => {
        if (s.phase === 'begin') return E.beginTurn(s);
        if (s.phase === 'send') { const p: Record<number, number> = {}; E.sendNeeds(s).forEach((q) => { if (q.must) p[q.side] = E.benchLabels(s, q.side).filter((l) => l.ready)[0].slot; }); return E.sendIn(s, p); }
        const ch: Record<number, string> = {}, c = E.canResonate(s, 0);
        E.needs(s).forEach((i) => { const m = E.ai(JSON.parse(JSON.stringify(s)), i); ch[i] = c ? 'res:' + m : m; });
        return E.playTurn(s, ch);
      };
      for (let k = 0; k < 800 && a.phase !== 'over'; k++) {
        expect(JSON.stringify(step(b))).toBe(JSON.stringify(step(a)));
        b = JSON.parse(JSON.stringify(b));
      }
      expect(a.phase).toBe('over');
    }
  });
});

describe('the Ricchezza of Mamurra', () => {
  /* Gabbì's Caos beats Cervello, and against Polpino every blow of his cracks the shield */
  const boss = (left = 3) => fight([mon('gabbi', 20, { known: ['beccata', 'furto'] })], [mon('polpino', 20, { known: ['botta'] }), mon('polpino', 20, { known: ['botta'] })], { field: CAOS, shield: { left, name: 'Ricchezza' }, trainer: 'Il fantasma di Mamurra' });
  it('is the rule of his battle, and says so', () => {
    expect(TRAINERS.mamurra.shield).toEqual({ left: 3, name: 'Ricchezza' });
    const s = E.newBattle({ a: 'gabbi', b: 'polpino', seed: 3, sideA: mon('gabbi', 20), sideB: mon('polpino', 20), shield: { left: 3, name: 'Ricchezza' }, trainer: 'Il fantasma di Mamurra', benchA: [] });
    expect(says(E.intro(s))).toContain('Ricchezza protegge Il fantasma di Mamurra');
    E.beginTurn(s);
    expect(E.snap(s).chips[1].some((c) => c.t === 'Ricchezza 3/3')).toBe(true);
  });
  it('takes something off every blow while it stands, and nothing once it is gone', () => {
    const s = boss(), on = E.expected(s, 0, 'furto');
    s.shield!.left = 0;
    expect(on / E.expected(s, 0, 'furto')).toBeCloseTo(FIELD_TUNE.shield, 5);
  });
  it('is cracked only by the blows that hurt, and broken it leaves the boss open', () => {
    const s = boss(1), x = s.sides[1];
    s.sides[0].stats = { ...s.sides[0].stats!, spe: 999 };
    /* a plain blow does not touch it */
    let ev = E.playTurn(s, { 0: 'beccata' });
    expect(s.shield!.left).toBe(1);
    for (let k = 0; k < 12 && s.shield!.left; k++) { if (s.phase === 'begin') E.beginTurn(s); s.sides[1].hp = s.sides[1].max; ev = E.playTurn(s, { 0: 'furto' }); }
    expect(s.shield!.left).toBe(0);
    expect(ev.some((e) => e.k === 'anim' && e.a === 'broken')).toBe(true);
    expect(says(ev)).toContain('va in pezzi');
    expect(says(ev), 'slower than the blow, it loses this very turn').toContain('non riesce a reagire');
    expect(x.skip).toBeNull();
    expect(E.snap(s).chips[1].some((c) => c.t === 'Esposto')).toBe(true);
  });
});

describe('what the review of Slancio found', () => {
  it('the names of the places read as Italian', () => {
    for (const [id, m] of Object.entries(PLACE_MAGIC)) expect(m.name, id).toMatch(/^(di|del|della|degli|dei) /);
    const s = E.newBattle({ a: 'ramarrino', b: 'cicalina', seed: 3, sideA: mon('ramarrino', 20), sideB: mon('cicalina', 20), field: PLACE_MAGIC.porto, benchA: [] });
    expect(says(E.intro(s))).toContain('La magia del porto:');
  });
  it('a creature with its blow ready shows that, and not the idea from the AI, which is Antonio\'s', () => {
    const s = fight([mon('ramarrino', 20, { resonate: true })], [mon('cicalina', 20)], { field: CAOS });
    s.sides[0].boost = true;
    const chips = E.snap(s).chips[0].map((c) => c.t);
    expect(chips).toContain('Risonanza');
    expect(chips).not.toContain('IA +50%');
  });
  it('the words come from the engine, with its numbers', () => {
    const s = fight([mon('ramarrino', 20, { resonate: true })], [mon('cicalina', 20)], { field: CAOS }), t = E.resonanceText(s);
    expect(t.sheet).toContain('la magia del porto'.replace('la', 'La'));
    expect(t.sheet).toContain(Math.round(FIELD_TUNE.heal * 100) + '% dei PS');
    expect(t.sheet).toContain('tre cuori');
    expect(E.withResonance('coda')).toBe('res:coda');
  });
});

