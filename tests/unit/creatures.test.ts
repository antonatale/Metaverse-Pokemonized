import { describe, expect, it } from 'vitest';
import { SPECIES, CMOVES, STARTERS, knownAt, type SpeciesId } from '../../src/data/creatures';
import { atLevel, toNext, xpFor, SKILLS, lastStand, meetChance, stepTime, trainerXp, luck, perksFor, WARES, SHOPS, START_LEVEL } from '../../src/data/growth';
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
    c.sides[0].hp -= 1;
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
  it('turns abilities into powers', () => {
    expect(lastStand(CHARS.antonio.stats, {})).toEqual(CHARS.antonio.stats);
    expect(lastStand(CHARS.antonio.stats, { ultima: 2 }).atk).toBeGreaterThan(CHARS.antonio.stats.atk);
    expect(meetChance(9, { passo: 2 })).toBeLessThan(meetChance(9, {}));
    expect(stepTime({ svelto: 2 })).toBeLessThan(stepTime({}));
    expect(trainerXp(100, { allenatore: 2 })).toBe(130);
    expect(luck({ fortuna: 1 }).gold).toBe(2);
    expect(perksFor({})).toEqual({ lose: 0.15, idea: 0.25 });
    expect(perksFor({ memoria: 3, prompt: 3 }).lose).toBeLessThan(0.05);
    for (const sk of SKILLS) expect(sk.max).toBeGreaterThan(0);
    /* a tree: each branch starts from one ability, the others open one after the other on the same branch */
    for (const sk of SKILLS) if (sk.after) expect(SKILLS.find((o) => o.id === sk.after)!.branch).toBe(sk.branch);
    expect(new Set(SKILLS.filter((sk) => !sk.after).map((sk) => sk.branch)).size).toBe(SKILLS.filter((sk) => !sk.after).length);
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
    const { teamOf } = await import('../../src/story/rival');
    const { MISSIONS } = await import('../../src/data/missions');
    for (const tr of Object.values(TRAINERS)) {
      /* the battles of the missions start from who asks for them, not from a trainer on the map */
      const n = (MAPS.formia.npcs || []).find((q) => q.trainer === tr.id) || MISSIONS.find((m) => m.trainer === tr.id);
      expect(n, 'nobody is ' + tr.id).toBeDefined();
      const team = teamOf(tr.id);
      expect(team.length).toBeGreaterThan(0);
      for (const t of team) { expect(SPECIES[t.sp]).toBeDefined(); for (const m of t.moves || []) expect(CMOVES[m], m).toBeDefined(); }
      expect(tr.prize).toBeGreaterThan(0);
    }
  });
  it('have a rival who picks the creature that beats Antonio\'s, and comes back with its next forms', async () => {
    const { rivalFor, formAt, teamOf } = await import('../../src/story/rival');
    const { st } = await import('../../src/save/story-progress');
    const { magicBeats } = await import('../../src/data/types');
    expect(rivalFor('polpino')).toBe('gabbi');
    expect(rivalFor('gabbi')).toBe('ramarrino');
    /* none beats Ramarrino's Calma: then not the one it beats */
    expect(rivalFor('ramarrino')).toBe('polpino');
    for (const sp of ['polpino', 'gabbi'] as const) expect(magicBeats(SPECIES[rivalFor(sp)].type, SPECIES[sp].type)).toBe(true);
    expect(formAt('gabbi', 2)).toBe('gabbianotto');
    expect(formAt('gabbiammiraglio', 1)).toBe('gabbi');
    expect(formAt('ramarrino', 3)).toBe('muraglione');
    st.rival = 'gabbi';
    const last = (id: string) => { const t = teamOf(id); return t[t.length - 1].sp; };
    expect([last('rivale-1'), last('rivale-2'), last('rivale-3')]).toEqual(['gabbi', 'gabbianotto', 'gabbiammiraglio']);
    st.rival = undefined;
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

describe('Cicero, the guide', () => {
  it('has a chapter for every stop of the tour, and says something useful when asked', async () => {
    const { CHAPTERS, OPENING, advice } = await import('../../src/story/mentor');
    const { STOPS } = await import('../../src/story/goals');
    for (const s of STOPS) { expect(CHAPTERS[s.id], 'no chapter for ' + s.id).toBeDefined(); expect(CHAPTERS[s.id].intro.length).toBeGreaterThan(0); }
    /* three lines, plus the one about whoever is played: four screens from «chi sei?» to the first step */
    expect(OPENING.length + 1).toBeLessThanOrEqual(4);
    expect(advice()[0]).toMatch(/^Capitolo 1 di \d+/);
  });
  it('says the rest when it is needed: types, levels, sesterzi and covi each have their tip', async () => {
    const { TIPS } = await import('../../src/story/mentor');
    const all = (k: string) => TIPS[k].join(' ');
    expect(all('covo')).toMatch(/Calma batte Caos/);
    expect(all('wild')).toMatch(/Corrente, Calore, Cielo, Corazza e Crepuscolo/);
    expect(all('level')).toMatch(/livello/);
    expect(all('money')).toMatch(/sesterzi/);
  });
  it('tells everyone where he lives, with the capitals right', async () => {
    const { LIVES, HOMES } = await import('../../src/data/people');
    for (const id of Object.keys(HOMES) as (keyof typeof HOMES)[]) {
      expect(LIVES[id]).toMatch(/^Tu abiti (a|in) /);
      expect(LIVES[id]).not.toMatch(/ in (parco|castellone|scauri)/);
      expect(LIVES[id].endsWith('.')).toBe(true);
    }
  });
});

describe('every move of the creatures', () => {
  it('does what its numbers say, even with the id of someone else\'s move', () => {
    const s = E.newBattle({ a: 'olivella', b: 'cicalina', seed: 3, sideA: { stats: atLevel(SPECIES.olivella.stats, 14), lvl: 14, known: ['radici'] }, sideB: { stats: atLevel(SPECIES.cicalina.stats, 14), lvl: 14, known: ['botta'] } });
    E.intro(s); E.beginTurn(s);
    const hp = s.sides[1].hp, ev = E.playTurn(s, { 0: 'radici' });
    expect(s.sides[1].hp, 'a raise does no damage').toBe(hp);
    expect(s.sides[0].mods.some((m) => m.tag === 'defUp')).toBe(true);
    expect(ev.some((e) => e.k === 'hp' && e.who === 1)).toBe(false);
  });
  it('leaves every number a number', () => {
    for (const id of Object.keys(CMOVES)) for (const [a, b] of [['muraglione', 'granchione'], ['lamo', 'polpastro']] as [SpeciesId, SpeciesId][]) {
      const known = SPECIES[a].learn.map((l) => l[1]).concat([id]);
      const s = E.newBattle({ a, b, seed: 41, sideA: { stats: atLevel(SPECIES[a].stats, 30), lvl: 30, known }, sideB: { stats: atLevel(SPECIES[b].stats, 30), lvl: 30, known: knownAt(b, 30) } });
      s.sides[0].hp -= 40;
      E.intro(s); E.beginTurn(s); E.playTurn(s, { 0: id });
      for (const x of s.sides) expect(Number.isFinite(x.hp), id + ': ' + x.id + ' has ' + x.hp).toBe(true);
    }
  });
});

describe('Lamo, the legend', () => {
  it('is caught far less often than the others, and only comes out for whoever has conquered Formia', async () => {
    let lamo = 0, other = 0;
    for (let seed = 1; seed <= 300; seed++) {
      for (const sp of ['lamo', 'granchione'] as const) {
        const s = E.newBattle({ a: 'antonio', b: sp, seed, wild: true, bag: { retino2: 1 }, sideB: { stats: atLevel(SPECIES[sp].stats, 30), lvl: 30, known: knownAt(sp, 30) } });
        E.intro(s); E.beginTurn(s); E.playTurn(s, { 0: 'retino2' });
        if (s.result === 'catch') { if (sp === 'lamo') lamo++; else other++; }
      }
    }
    expect(lamo).toBeLessThan(other * 0.6);
    expect(lamo).toBeGreaterThan(0);
    const { MAPS } = await import('../../src/data/maps');
    const n = (MAPS.formia.npcs || []).find((q) => q.wild && q.wild.sp === 'lamo')!;
    expect(n.legend).toBe('lamo');
  });
});

describe('the hiding places of the wild creatures', () => {
  it('are painted on the map, each with a table of creatures that exist', async () => {
    const { HIDINGS, pickMeet } = await import('../../src/data/encounters');
    const { FORMIA_HIDING, FORMIA_ROWS } = await import('../../src/data/maps/formia-ground');
    expect(FORMIA_HIDING.length).toBeGreaterThan(5);
    for (const h of FORMIA_HIDING) {
      const t = HIDINGS[h.id];
      expect(t, h.id).toBeDefined();
      for (const m of t.day.concat(t.night || [])) { expect(SPECIES[m.sp], h.id).toBeDefined(); expect(m.lv[0]).toBeLessThanOrEqual(m.lv[1]); }
      let n = 0;
      for (let y = h.y - h.r; y <= h.y + h.r; y++) for (let x = h.x - h.r; x <= h.x + h.r; x++) if ((FORMIA_ROWS[y] || '')[x] === (t.on === 'erba' ? 'E' : 'A')) n++;
      expect(n, h.id + ' at ' + h.x + ',' + h.y).toBeGreaterThan(8);
    }
    const two = [{ sp: 'cicalina' as const, lv: [1, 1] as [number, number], w: 1 }, { sp: 'olivella' as const, lv: [1, 1] as [number, number], w: 3 }];
    expect(pickMeet(two, 0.1).sp).toBe('cicalina');
    expect(pickMeet(two, 0.5).sp).toBe('olivella');
  });
});

describe('the bond and the steady hand', () => {
  it('let a creature hold on at 1 HP once, and nets catch more often', () => {
    let held = 0;
    for (let seed = 1; seed <= 40; seed++) {
      const s = E.newBattle({ a: 'cicalina', b: 'muraglione', seed, sideA: { stats: atLevel(SPECIES.cicalina.stats, 3), lvl: 3, known: knownAt('cicalina', 3), endure: 1 },
        sideB: { stats: atLevel(SPECIES.muraglione.stats, 40), lvl: 40, known: knownAt('muraglione', 40) } });
      const ev = playOut(s, (st) => E.ai(st, 0));
      if (s.sides[0].sturdy) held++;
      expect(ev.phase).toBe('over');
    }
    expect(held).toBeGreaterThan(20);
    const caught = (net: number) => {
      let n = 0;
      for (let seed = 1; seed <= 200; seed++) {
        const s = E.newBattle({ a: 'antonio', b: 'granchione', seed, wild: true, bag: { retino: 1 }, sideA: { net }, sideB: { stats: atLevel(SPECIES.granchione.stats, 20), lvl: 20, known: knownAt('granchione', 20) } });
        E.intro(s); E.beginTurn(s); E.playTurn(s, { 0: 'retino' });
        if (s.result === 'catch') n++;
      }
      return n;
    };
    expect(caught(1.4)).toBeGreaterThan(caught(1));
  });
});

describe('growing up with Antonio', () => {
  it('asks which move to forget, and waits for the bond before the last form', async () => {
    const { addCreature, gainXp, creatureOf, movesOf, swapMove, addBond } = await import('../../src/story/growth');
    const uid = addCreature('ramarrone', 25, false, 20);
    expect(movesOf(uid).length).toBe(4);
    const g = gainXp(uid, 400);
    expect(g.to).toBeGreaterThanOrEqual(26);
    expect(g.pending).toContain('frana');
    expect(g.evolved).toBeNull();
    expect(g.waiting).toBe('muraglione');
    swapMove(uid, movesOf(uid)[0], 'frana');
    expect(movesOf(uid)).toContain('frana');
    addBond(uid, 50);
    const h = gainXp(uid, 1);
    expect(h.evolved).toEqual({ from: 'ramarrone', to: 'muraglione' });
    expect(creatureOf(uid)!.sp).toBe('muraglione');
  });
});

describe('the team and the creatures at home', () => {
  it('takes six creatures along, sends the seventh home, and swaps them both ways', async () => {
    const { addCreature, creatureOf, teamMons, homeMons, sendHome, bringAlong, leadCreature, setLead, team, TEAM_MAX, firstHuman, setFirst } = await import('../../src/story/growth');
    const { st } = await import('../../src/save/story-progress');
    st.mons = []; st.squad = ['antonio']; delete st.lead; delete st.first;
    const uids = Array.from({ length: TEAM_MAX + 1 }, () => addCreature('cicalina', 5));
    expect(teamMons().length).toBe(TEAM_MAX);
    expect(creatureOf(uids[TEAM_MAX])!.home).toBe(true);
    expect(team()).not.toContain(uids[TEAM_MAX]);
    /* a full team can't take another one along; one less, and it can */
    expect(bringAlong(uids[TEAM_MAX])).toBe(false);
    setLead(uids[2]);
    expect(sendHome(uids[2])).toBe(true);
    expect(leadCreature()).toBe(uids[0]);
    expect(bringAlong(uids[TEAM_MAX])).toBe(true);
    expect(homeMons().map((m) => m.uid)).toEqual([uids[2]]);
    /* the team never goes empty */
    teamMons().slice(1).forEach((m) => sendHome(m.uid));
    expect(teamMons().length).toBe(1);
    expect(sendHome(teamMons()[0].uid)).toBe(false);
    /* the first of the company is Antonio, unless a friend who joined him is chosen */
    expect(firstHuman()).toBe('antonio');
    setFirst('forchetta');
    expect(firstHuman()).toBe('antonio');
    st.squad = ['antonio', 'forchetta'];
    setFirst('forchetta');
    expect(firstHuman()).toBe('forchetta');
  });
});

describe('the friends\' tournament', () => {
  it('has five friends who exist, getting stronger, and every edition is harder', async () => {
    const { TOURNEY, roundsOf } = await import('../../src/data/tourney');
    expect(TOURNEY.rounds.length).toBe(5);
    TOURNEY.rounds.forEach((r) => expect(CHARS[r.who]).toBeTruthy());
    const a = roundsOf(0), b = roundsOf(2);
    for (let k = 1; k < a.length; k++) expect(a[k].lv).toBeGreaterThan(a[k - 1].lv);
    expect(b[0].lv).toBe(a[0].lv + 2 * TOURNEY.step);
  });
});
