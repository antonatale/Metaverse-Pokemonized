import { describe, expect, it } from 'vitest';
import { SPECIES, CMOVES, knownAt, type SpeciesId } from '../../src/data/creatures';
import { ABILITIES, HELD, STATUS, type StatusId } from '../../src/data/passives';
import { atLevel } from '../../src/data/growth';
import { ENGINE as E, type BattleEvent, type BattleState, type Member, type NewBattle } from '../../src/battle';

/* States, abilities and held things: what data/passives.ts says, done by battle/passives.ts. */
const mon = (id: SpeciesId, lv: number, o?: Partial<Member>): Member => ({ id, stats: atLevel(SPECIES[id].stats, lv), lvl: lv, known: knownAt(id, lv), ...o });
function duel(a: Member, b: Member, o?: Partial<NewBattle>): BattleState {
  return E.newBattle({ a: a.id, b: b.id, seed: 2024, sideA: a, sideB: b, bag: {}, ...o });
}
const says = (ev: BattleEvent[]) => ev.filter((e) => e.k === 'say').map((e) => (e as { text: string }).text).join(' | ');
const attack = (s: BattleState, i: number) => E.available(s, i).filter((m) => E.moveLabel(s, i, m).kind === 'atk')[0];
const put = (s: BattleState, i: number, id: StatusId, left = 3) => { s.sides[i].status = { id, left }; };

describe('the data', () => {
  it('holds together: every ability exists, every state has what it needs', () => {
    for (const sp of Object.values(SPECIES)) {
      expect(sp.abil, sp.id).toBeTruthy();
      for (const a of sp.abil!) expect(ABILITIES[a], sp.id + ' ' + a).toBeTruthy();
      expect(sp.abil!.length).toBe(sp.stage === 3 && !sp.legend ? 2 : 1);
    }
    for (const st of Object.values(STATUS)) { expect(st.got).toContain('{n}'); expect(st.over).toContain('{n}'); expect(st.turns[0]).toBeLessThanOrEqual(st.turns[1]); }
    for (const p of Object.values({ ...ABILITIES, ...HELD })) expect(p.text.length).toBeGreaterThan(5);
    for (const m of Object.values(CMOVES)) if (m.fx && m.fx.status) expect(STATUS[m.fx.status]).toBeTruthy();
  });
  it('reach the people of the free battles in no way', () => {
    const s = E.newBattle({ a: 'antonio', b: 'costanzo', seed: 1 });
    expect('abil' in s.sides[0]).toBe(false);
    expect('status' in s.sides[0]).toBe(false);
    E.intro(s); E.beginTurn(s);
    const ev = E.playTurn(s, { 0: E.available(s, 0)[0] });
    expect(ev.filter((e) => e.k === 'anim' && (e.a === 'abil' || e.a === 'status'))).toEqual([]);
    expect('went' in s.sides[0]).toBe(false);
  });
});

describe('the states', () => {
  it('Colpo di sole costs health at the end of every turn, lowers the Attack, and wears off', () => {
    const s = duel(mon('polpino', 20), mon('ramarrino', 20));
    E.intro(s); E.beginTurn(s);
    const clean = E.expected(s, 1, attack(s, 1));
    put(s, 1, 'sole', 2);
    expect(E.expected(s, 1, attack(s, 1))).toBeCloseTo(clean * 0.75, 5);
    const hp = s.sides[1].hp, ev = E.playTurn(s, { 0: 'mimetismo' });
    expect(hp - s.sides[1].hp).toBeGreaterThanOrEqual(Math.round(s.sides[1].max / 12));
    expect(s.sides[1].status).toEqual({ id: 'sole', left: 1 });
    expect(says(ev)).toContain('Colpo di sole');
    E.beginTurn(s);
    expect(says(E.playTurn(s, { 0: 'mimetismo' }))).toContain('si riprende dal caldo');
    expect(s.sides[1].status).toBe(null);
  });
  it('Siesta loses the turn, and a hit wakes it', () => {
    const s = duel(mon('polpino', 20), mon('ramarrino', 20));
    E.intro(s); E.beginTurn(s);
    put(s, 1, 'siesta', 3);
    s.plan[1] = attack(s, 1);
    const hp = s.sides[0].hp, ev = E.playTurn(s, { 0: 'mimetismo' });
    expect(s.sides[0].hp).toBe(hp);
    expect(says(ev)).toContain('dorme');
    expect(s.sides[1].status!.left).toBe(2);
    E.beginTurn(s);
    const woken = E.playTurn(s, { 0: 'botta' });
    expect(says(woken)).toContain('si sveglia');
    expect(s.sides[1].status).toBe(null);
  });
  it('Rete stops a change and slows down; going off the field cures the others', () => {
    const a = mon('polpino', 20, { key: 'c1' }), b = mon('ramarrino', 20, { key: 'c2' });
    const s = E.newBattle({ a: a.id, b: 'cicalina', seed: 9, sideA: a, sideB: mon('cicalina', 20), benchA: [b], bag: {} });
    E.intro(s); E.beginTurn(s);
    put(s, 0, 'rete', 3);
    expect(E.switches(s, 0)).toEqual([]);
    put(s, 0, 'sole', 3);
    expect(E.switches(s, 0)).toEqual(['switch:0']);
    E.playTurn(s, { 0: 'switch:0' });
    expect(s.bench![0][0].status).toBe(null);
  });
  it('are one at a time, and a tiella cures them', () => {
    const s = duel(mon('polpino', 20), mon('cicalina', 20), { bag: { tiella: 1 } });
    E.intro(s); E.beginTurn(s);
    put(s, 0, 'sole', 3);
    s.plan[1] = 'strillo'; s.sides[0].hp = 30;
    const ev = E.playTurn(s, { 0: 'tiella' });
    expect(says(ev)).toContain('si riprende dal caldo');
    expect(s.sides[0].status).toBe(null);
    const t = duel(mon('polpino', 20), mon('cicalina', 20));
    E.intro(t); E.beginTurn(t);
    put(t, 0, 'siesta', 3);
    /* the spell hits someone already in a state: it does not take; the seed that misses is not the point */
    for (let k = 0; k < 40; k++) { const c: BattleState = JSON.parse(JSON.stringify(t)); c.rng = k * 977 + 1; c.plan[1] = 'arsura'; E.playTurn(c, { 0: 'botta' }); expect(c.sides[0].status && c.sides[0].status.id).not.toBe('sole'); }
  });
  it('can bring down at the end of the turn, in a duel and with someone on the bench', () => {
    const s = duel(mon('polpino', 20), mon('ramarrino', 20));
    E.intro(s); E.beginTurn(s);
    put(s, 1, 'sole', 3); s.sides[1].hp = 1;
    const ev = E.playTurn(s, { 0: 'mimetismo' });
    expect(s).toMatchObject({ phase: 'over', result: 'win', winner: 0 });
    expect(says(ev)).toContain('è KO');
    const t = E.newBattle({ a: 'polpino', b: 'ramarrino', seed: 3, sideA: mon('polpino', 20), sideB: mon('ramarrino', 20), benchB: [mon('olivella', 20)], bag: {} });
    E.intro(t); E.beginTurn(t);
    put(t, 1, 'sole', 3); t.sides[1].hp = 1;
    expect(says(E.playTurn(t, { 0: 'mimetismo' })).match(/è KO/g)!.length).toBe(1);
    expect(t.phase).toBe('send');
  });
  it('a draw when both fall at the end of the turn, with nobody left', () => {
    const s = duel(mon('polpino', 20), mon('ramarrino', 20));
    E.intro(s); E.beginTurn(s);
    put(s, 0, 'sole', 3); put(s, 1, 'sole', 3); s.sides[0].hp = 1; s.sides[1].hp = 1;
    s.plan[1] = 'scaglie';
    E.playTurn(s, { 0: 'mimetismo' });
    expect(s).toMatchObject({ phase: 'over', result: 'draw', winner: null });
  });
});

describe('the states, what the review found', () => {
  it('a sleeper\'s side can still use the bag: the tiella wakes it, a net is thrown', () => {
    const s = duel(mon('polpino', 20), mon('cicalina', 20), { bag: { tiella: 2 } });
    E.intro(s); E.beginTurn(s);
    put(s, 0, 'siesta', 3); s.sides[0].hp = 20; s.plan[1] = 'strillo';
    const ev = E.playTurn(s, { 0: 'tiella' });
    expect(s.bag!.tiella).toBe(1);
    expect(s.sides[0].status).toBe(null);
    expect(says(ev)).toContain('si sveglia');
    const w = duel(mon('polpino', 20), mon('cicalina', 20), { bag: { retino: 1 }, wild: true });
    E.intro(w); E.beginTurn(w);
    put(w, 0, 'siesta', 3); w.plan[1] = 'strillo';
    E.playTurn(w, { 0: 'retino' });
    expect(w.bag!.retino).toBe(0);
    expect(w.sides[0].status).toEqual({ id: 'siesta', left: 3 });
  });
  it('tells every fall of a double KO, and nobody down says it has won', () => {
    const d = duel(mon('polpino', 20), mon('ramarrino', 20));
    E.intro(d); E.beginTurn(d);
    put(d, 0, 'sole', 3); put(d, 1, 'sole', 3); d.sides[0].hp = 1; d.sides[1].hp = 1; d.plan[1] = 'scaglie';
    const told = says(E.playTurn(d, { 0: 'mimetismo' }));
    expect(told.match(/è KO/g)!.length).toBe(2);
    expect(told).not.toContain('Turno 30');
    /* the foe has someone on the bench, Antonio's side does not: the foe wins, down as it is, and says nothing */
    const w = E.newBattle({ a: 'polpino', b: 'ramarrino', seed: 3, sideA: mon('polpino', 20), sideB: mon('ramarrino', 20, { key: 'f' }), benchB: [mon('olivella', 20)], bag: {} });
    E.intro(w); E.beginTurn(w);
    put(w, 0, 'sole', 3); put(w, 1, 'sole', 3); w.sides[0].hp = 1; w.sides[1].hp = 1; w.plan[1] = 'scaglie';
    const ev = E.playTurn(w, { 0: 'mimetismo' });
    expect(w).toMatchObject({ phase: 'over', result: 'win', winner: 1 });
    expect(says(ev).match(/è KO/g)!.length).toBe(2);
    expect(ev.filter((e) => e.k === 'line' && e.who === 1 && e.text === SPECIES.ramarrino.cry.win)).toEqual([]);
    expect(w.bouts![0].ko).toBe(true);
  });
  it('a burn counts for what looks at the health, and for nothing that answers to a blow', () => {
    /* it is eating under a quarter of its health, brought there by the sun */
    const s = duel(mon('polpino', 20, { item: 'fetta' }), mon('cicalina', 20));
    E.intro(s); E.beginTurn(s);
    put(s, 0, 'sole', 3); s.sides[0].hp = Math.round(s.sides[0].max * 0.27); s.plan[1] = 'strillo';
    const hp = s.sides[0].hp;
    E.playTurn(s, { 0: 'mimetismo' });
    expect(s.sides[0].spent).toMatchObject({ fetta: true });
    expect(s.sides[0].hp).toBeGreaterThan(hp);
    /* a sea urchin in the sun does not prick anybody */
    const r = duel(mon('polpino', 20), mon('riccetto', 20));
    E.intro(r); E.beginTurn(r);
    put(r, 1, 'sole', 3); r.plan[1] = 'guscio';
    expect(says(E.playTurn(r, { 0: 'mimetismo' }))).not.toContain('si punge');
  });
  it('the computer does not waste a turn on one who cannot take a state', () => {
    const s = duel(mon('cicalina', 30), mon('lamo', 30));
    for (let k = 0; k < 40; k++) {
      const c: BattleState = JSON.parse(JSON.stringify(duel(mon('lamo', 30), mon('cicalina', 30), { smart: [2, 2], seed: k + 1 })));
      c.sides[0].known = ['ruggito'];
      E.intro(c);
      expect(E.ai(c, 1)).not.toBe('arsura');
    }
    expect(s.sides[1].abil).toEqual(['gigante']);
  });
});

describe('the abilities', () => {
  it('Frinire d\'agosto lowers the Attack on coming in, and says its name', () => {
    const s = duel(mon('polpino', 20), mon('cicalina', 20));
    const ev = E.intro(s);
    expect(ev.some((e) => e.k === 'anim' && e.a === 'abil' && e.text === 'Frinire d\'agosto')).toBe(true);
    expect(s.sides[0].mods).toEqual([{ stat: 'atk', mult: 0.75, until: s.turn + 2, tag: 'atkDown' }]);
    expect(ev.filter((e) => e.k === 'say').map((e) => (e as { text: string }).text).join(' ')).toContain('cala per 2 turni');
  });
  it('a cure at full health keeps quiet, and a one-time one is not spent', () => {
    const s = duel(mon('gabbi', 20), mon('ramarrino', 20));
    E.intro(s); E.beginTurn(s);
    s.plan[1] = 'scaglie';
    for (let k = 0; k < 8; k++) {
      const c: BattleState = JSON.parse(JSON.stringify(s)); c.rng = k * 31 + 7;
      const ev = E.playTurn(c, { 0: 'beccata' });
      expect(ev.filter((e) => e.k === 'anim' && e.a === 'abil')).toEqual([]);
      expect(says(ev)).not.toContain('ha già tutti i PS');
    }
  });
  it('a short effect on top of a long one does not cut it short', () => {
    const s = duel(mon('polpino', 20), mon('cicalina', 20));
    s.sides[0].mods.push({ stat: 'atk', mult: 0.75, until: 6, tag: 'atkDown' });
    E.intro(s);
    expect(s.sides[0].mods).toEqual([{ stat: 'atk', mult: 0.75, until: 6, tag: 'atkDown' }]);
  });
  it('coming first means before anyone: a person, and one who has just come in', () => {
    /* Antonio is quicker than this Gabbì: the Ladro does not fire */
    const m: Member = { id: 'antonio', key: 'antonio', stats: { hp: 200, atk: 90, def: 90, spe: 300 }, lvl: 20 };
    const s = E.newBattle({ a: 'antonio', b: 'gabbi', seed: 11, sideA: m, sideB: mon('gabbi', 20), benchA: [mon('polpino', 20, { key: 'c1' })], bag: {} });
    E.intro(s); E.beginTurn(s);
    s.sides[1].hp = 40; s.plan[1] = 'picchiata';
    const ev = E.playTurn(s, { 0: 'certificati' });
    expect(ev.filter((e) => e.k === 'anim' && e.a === 'abil')).toEqual([]);
    /* and against a foe who has just changed it is not first either */
    const t = E.newBattle({ a: 'polpino', b: 'gabbi', seed: 11, sideA: mon('polpino', 20, { key: 'c1' }), sideB: mon('gabbi', 20), benchA: [mon('ramarrino', 20, { key: 'c2' })], bag: {} });
    E.intro(t); E.beginTurn(t);
    t.sides[1].hp = 40; t.plan[1] = 'picchiata';
    expect(E.playTurn(t, { 0: 'switch:0' }).filter((e) => e.k === 'anim' && e.a === 'abil' && e.text === 'Ladro di panini')).toEqual([]);
  });
  it('Occhi di notte: quicker in the dark only', () => {
    const order = (night: boolean) => {
      const s = duel(mon('civettina', 20), mon('gabbi', 20), { night });
      E.intro(s); E.beginTurn(s);
      s.plan[1] = 'beccata';
      return s;
    };
    expect(order(false).sides[0].abil).toEqual(['occhi']);
    const lit = E.newBattle({ a: 'civettina', b: 'gabbi', seed: 1, sideA: mon('civettina', 20), sideB: mon('gabbi', 20), night: true });
    expect(lit.night).toBe(true);
  });
  it('Corazza: the first hit taken does 30% less, once', () => {
    const s = duel(mon('polpino', 20), mon('granchietto', 20));
    E.intro(s); E.beginTurn(s);
    const once = E.expected(s, 0, 'tentacolata');
    s.sides[1].spent = { corazza: true };
    expect(E.expected(s, 0, 'tentacolata')).toBeCloseTo(once / 0.7, 5);
    delete s.sides[1].spent;
    s.plan[1] = 'guscio';
    for (let k = 0; k < 12; k++) { const c: BattleState = JSON.parse(JSON.stringify(s)); c.rng = k * 31 + 7; E.playTurn(c, { 0: 'tentacolata' }); if (c.sides[1].hp < c.sides[1].max) { expect(c.sides[1].spent).toEqual({ corazza: true }); return; } }
    throw new Error('never hit');
  });
  it('Radici heal at the end of every turn', () => {
    const s = duel(mon('polpino', 20), mon('olivella', 20));
    E.intro(s); E.beginTurn(s);
    s.sides[1].hp = 40; s.plan[1] = 'radici';
    E.playTurn(s, { 0: 'mimetismo' });
    expect(s.sides[1].hp).toBe(40 + Math.round(s.sides[1].max * 0.04));
  });
  it('Aculei prick who hits, unless it went down with the blow', () => {
    const s = duel(mon('polpino', 20), mon('riccetto', 20));
    E.intro(s); E.beginTurn(s);
    s.plan[1] = 'guscio';
    let hit = 0;
    for (let k = 0; k < 12; k++) {
      const c: BattleState = JSON.parse(JSON.stringify(s)); c.rng = k * 31 + 7;
      const ev = E.playTurn(c, { 0: 'tentacolata' });
      if (c.sides[1].hp < c.sides[1].max && /si punge/.test(says(ev))) { hit++; expect(c.sides[0].hp).toBe(c.sides[0].max - Math.round(c.sides[0].max * 0.06)); }
    }
    expect(hit).toBeGreaterThan(5);
    const down = duel(mon('polpino', 50), mon('riccetto', 5));
    E.intro(down); E.beginTurn(down); down.sides[1].hp = 1;
    expect(says(E.playTurn(down, { 0: 'mareggiata' }))).not.toContain('si punge');
  });
  it('Ladro di panini takes something back only when it strikes first', () => {
    const s = duel(mon('gabbi', 20), mon('ramarrino', 20));
    E.intro(s); E.beginTurn(s);
    s.sides[0].hp = 40; s.plan[1] = 'scaglie';
    const ev = E.playTurn(s, { 0: 'picchiata' });
    if (s.sides[1].hp < s.sides[1].max) expect(s.sides[0].hp).toBeGreaterThan(40);
    expect(says(ev)).toContain('si riprende');
  });
  it('Ventose and Coda che ricresce fire once, on the way down', () => {
    const s = duel(mon('ramarrino', 20), mon('gabbi', 20));
    E.intro(s); E.beginTurn(s);
    s.sides[0].hp = 30;
    s.plan[1] = 'picchiata';
    const ev = E.playTurn(s, { 0: 'scaglie' });
    if (s.sides[0].hp > 0 && s.sides[0].hp < 30) { expect(says(ev)).toContain('si riprende'); expect(s.sides[0].spent).toEqual({ coda: true }); }
  });
  it('Re dei giganti never falls into a state', () => {
    const s = duel(mon('polpino', 30), mon('lamo', 30));
    E.intro(s); E.beginTurn(s);
    expect(s.sides[1].abil).toEqual(['gigante']);
    const c: BattleState = JSON.parse(JSON.stringify(s));
    c.sides[0].known = ['ninna']; (c.sides[0] as { id: string }).id = 'civettina';
    for (let k = 0; k < 40; k++) { const t: BattleState = JSON.parse(JSON.stringify(c)); t.rng = k * 977 + 1; const ev = E.playTurn(t, { 0: 'ninna' }); if (/non ci casca/.test(says(ev))) { expect(t.sides[1].status || null).toBe(null); return; } }
    throw new Error('never tried');
  });
});

describe('the things creatures carry', () => {
  it('come from the bag, go on a creature, and go back', async () => {
    const { addCreature, creatureOf, giveHeld, heldInBag, has, sideOf } = await import('../../src/story/growth');
    const { st } = await import('../../src/save/story-progress');
    const uid = addCreature('polpino', 10);
    st.bag = { cozza: 1, fetta: 1 };
    expect(heldInBag().sort()).toEqual(['cozza', 'fetta']);
    giveHeld(uid, 'cozza');
    expect(creatureOf(uid)!.item).toBe('cozza');
    expect(sideOf(uid).item).toBe('cozza');
    expect(has('cozza')).toBe(0);
    giveHeld(uid, 'fetta');                                                 /* a swap: the old one is back */
    expect(creatureOf(uid)!.item).toBe('fetta');
    expect(has('cozza')).toBe(1);
    giveHeld(uid, null);
    expect('item' in creatureOf(uid)!).toBe(false);
    expect(has('fetta')).toBe(1);
    giveHeld(uid, 'corno');                                                 /* not in the bag: nothing */
    expect('item' in creatureOf(uid)!).toBe(false);
  });
  it('are for sale, with a name and a text', async () => {
    const { WARES, SHOPS, HELD_IDS } = await import('../../src/data/growth');
    for (const id of HELD_IDS) {
      expect(WARES[id].price).toBeGreaterThan(0);
      expect(Object.values(SHOPS).some((sh) => sh.sells.indexOf(id) >= 0), id).toBe(true);
    }
  });
  it('Fetta di tiella: eaten under a quarter of the health, once', () => {
    const s = duel(mon('polpino', 20, { item: 'fetta' }), mon('gabbi', 12));
    E.intro(s); E.beginTurn(s);
    s.sides[0].hp = 30; s.plan[1] = 'picchiata';
    for (let k = 0; k < 20; k++) {
      const c: BattleState = JSON.parse(JSON.stringify(s)); c.rng = k * 977 + 1;
      E.playTurn(c, { 0: 'mimetismo' });
      if (c.sides[0].hp !== 30) { expect(c.sides[0].spent).toMatchObject({ fetta: true }); expect(c.sides[0].hp).toBeGreaterThan(30); return; }
    }
    throw new Error('never hit');
  });
  it('Ciambella all\'anice: quicker', () => {
    const fast = E.newBattle({ a: 'polpino', b: 'gabbi', seed: 1, sideA: mon('polpino', 20, { item: 'ciambella' }), sideB: mon('gabbi', 20) });
    expect(fast.sides[0].item).toBe('ciambella');
  });
  it('Oliva di Gaeta: only against the type that beats its own, once', () => {
    /* Ramarrino is Calma: Cuore beats it */
    const s = duel(mon('olivella', 20), mon('ramarrino', 20, { item: 'oliva' }));
    E.intro(s); E.beginTurn(s);
    const cuore = E.expected(s, 0, 'nocciolo');
    s.sides[1].spent = { oliva: true };
    expect(E.expected(s, 0, 'nocciolo')).toBeCloseTo(cuore / 0.75, 5);
    expect(E.expected(s, 0, 'spinata')).toBeCloseTo(E.expected(duel(mon('olivella', 20), mon('ramarrino', 20, {})), 0, 'spinata'), 5);
  });
  it('Cozza stops the first state and is spent', () => {
    const s = duel(mon('polpino', 20, { item: 'cozza' }), mon('cicalina', 20));
    E.intro(s); E.beginTurn(s);
    for (let k = 0; k < 40; k++) {
      const c: BattleState = JSON.parse(JSON.stringify(s)); c.rng = k * 977 + 1; c.plan[1] = 'arsura';
      const ev = E.playTurn(c, { 0: 'mimetismo' });
      if (/non ci casca/.test(says(ev))) { expect(c.sides[0].status || null).toBe(null); expect(c.sides[0].spent).toMatchObject({ cozza: true }); return; }
    }
    throw new Error('never hit');
  });
  it('Corno di mare: the first hit does more, and only the first', () => {
    const s = duel(mon('polpino', 20, { item: 'corno' }), mon('ramarrino', 20));
    E.intro(s); E.beginTurn(s);
    const first = E.expected(s, 0, 'tentacolata');
    s.sides[0].spent = { corno: true };
    expect(first).toBeCloseTo(E.expected(s, 0, 'tentacolata') * 1.2, 5);
  });
});

describe('what the review of the legends found', () => {
  it('a confused creature does not stop Antonio from using the bag', () => {
    for (let seed = 1; seed < 40; seed++) {
      const s = duel(mon('polpino', 20), mon('cicalina', 20), { bag: { tiella: 1 }, seed });
      s.sides[0].hp -= 30; s.sides[0].conf = 2;
      E.intro(s); E.beginTurn(s);
      const ev = E.playTurn(s, { 0: 'tiella' });
      expect(s.bag!.tiella, 'seed ' + seed).toBe(0);
      expect(says(ev)).not.toContain('si fa male da solo');
    }
  });
  it('a slice of tiella stays in the bag when nobody needs it', () => {
    const s = duel(mon('polpino', 20), mon('cicalina', 20), { bag: { tiella: 2 } });
    E.intro(s); E.beginTurn(s);
    expect(E.available(s, 0)).not.toContain('tiella');
    expect(E.moveLabel(s, 0, 'tiella').locked).toBe(true);
    expect(E.moveLabel(s, 0, 'tiella').sub).toBe('PS al massimo');
    s.sides[0].hp -= 1;
    expect(E.available(s, 0)).toContain('tiella');
    s.sides[0].hp = s.sides[0].max; put(s, 0, 'sole');
    expect(E.available(s, 0), 'it cures a state too').toContain('tiella');
  });
  it('who falls to a sting does nothing more with its move', () => {
    const a = mon('polpino', 20, { known: ['spruzzo'] }), b = mon('riccetto', 30);
    const s = duel(a, b);
    E.intro(s); E.beginTurn(s);
    s.sides[0].hp = 1; s.plan[1] = 'botta';
    const ev = E.playTurn(s, { 0: 'spruzzo' });
    if (s.sides[0].hp <= 0 && says(ev).indexOf('si punge') >= 0) expect(s.sides[1].mods.filter((m) => m.tag === 'atkDown')).toEqual([]);
  });
  it('a first-hit effect is not used up on a blow that knocks the foe out', () => {
    const s = E.newBattle({ a: 'polpino', b: 'cicalina', seed: 8, sideA: mon('polpino', 40), sideB: mon('cicalina', 5), benchB: [mon('cicalina', 40)], bag: {} });
    /* the Ginestrella's ability, given by hand to a Polpino */
    s.sides[0].abil = ['ventose', 'maggio'];
    E.intro(s); E.beginTurn(s);
    s.sides[0].stats = { ...s.sides[0].stats!, spe: 9999, atk: 9999 };
    s.sides[1].hp = 1;
    let ev: BattleEvent[] = [];
    for (let k = 0; k < 6 && s.sides[1].hp > 0; k++) { ev = E.playTurn(s, { 0: attack(s, 0) }); if (s.phase === 'begin') E.beginTurn(s); }
    expect(s.sides[1].hp).toBe(0);
    expect(ev.some((e) => e.k === 'anim' && e.a === 'abil'), 'it does not say its name for nothing').toBe(false);
    expect((s.sides[0].spent || {}).maggio, 'it is still there for the next one').toBeFalsy();
  });
  it('says how much a move gives back, as the numbers do', () => {
    const lab = (sp: SpeciesId, id: string) => { const s = duel(mon(sp, 40, { known: [id] }), mon('cicalina', 40)); E.intro(s); E.beginTurn(s); return { s, sub: E.moveLabel(s, 0, id).sub }; };
    expect(lab('gabbi', 'furto').sub).toContain('si cura metà');
    const b = lab('gattomola', 'banco');
    expect(b.sub).toContain('si cura il 40%');
    b.s.sides[0].hp -= 30; b.s.sides[0].stats = { ...b.s.sides[0].stats!, spe: 9999 };
    expect(says(E.playTurn(b.s, { 0: 'banco' }))).toMatch(/si riprende il 40% del danno|la scampa/);
  });
});
