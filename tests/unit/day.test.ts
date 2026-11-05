import { describe, expect, it } from 'vitest';
import { afterFloor, alive, canTake, dayKey, foeMember, formAt, levelAt, memberOf, needsTarget, newRun, offersNow, offerText, planOf, seedOf, shareLine, takeOffer, type DayRun, type Offer } from '../../src/day/plan';
import { DAY_ABILITIES, DAY_FLOORS, DAY_TUNE } from '../../src/data/day';
import { CMOVES, SPECIES, knownAt, type SpeciesId } from '../../src/data/creatures';
import { HIDINGS } from '../../src/data/encounters';
import { ABILITIES } from '../../src/data/passives';
import { sceneInfo } from '../../src/render/svg/scenes';
import { playRun } from '../../tools/sim-day';

const SEEDS = [1, 7, 99, 12345, seedOf('2026-11-05'), seedOf('2027-01-01')];
/** every creature of the team comes out of the floor as it went in, or with this share */
const keepAll = (r: DayRun, share = 0.8) => Object.fromEntries(r.team.map((m) => [m.key, m.hp > 0 ? share : 0]));

describe('a day is the same for everyone', () => {
  it('a date always gives the same seed: the friends must get the same day, on any computer and any version', () => {
    expect(seedOf('2026-11-05')).toBe(1830689584);
    expect(dayKey(new Date(2026, 10, 5, 23, 59))).toBe('2026-11-05');
    expect(dayKey(new Date(2027, 0, 9))).toBe('2027-01-09');
  });
  it('the same seed gives the same day, and another seed another one', () => {
    for (const s of SEEDS) expect(JSON.stringify(planOf(s))).toBe(JSON.stringify(planOf(s)));
    expect(JSON.stringify(planOf(1))).not.toBe(JSON.stringify(planOf(2)));
  });
  it('what the player does changes nothing of what comes next', () => {
    const a = newRun(777, ''), b = newRun(777, '');
    for (let n = 0; n < DAY_FLOORS.length - 1; n++) {
      afterFloor(a, true, keepAll(a, 1), 5);
      afterFloor(b, true, keepAll(b, 0.1), 28);
      expect(offersNow(a)).toEqual(offersNow(b));
      const oa = offersNow(a).filter((o) => o.k === 'mon')[0];
      takeOffer(a, oa || null, a.team[0].key); takeOffer(b, null);
      expect(a.floor).toBe(b.floor);
    }
    expect(planOf(a.seed)).toEqual(planOf(b.seed));
  });
  it('played the same way it ends the same way, seeds of the battles included', () => {
    for (const s of [11, 22]) expect(playRun(s)).toEqual(playRun(s));
  });
});

describe('what a day holds', () => {
  for (const s of SEEDS) it('seed ' + s + ' makes sense', () => {
    const p = planOf(s);
    expect(p.team).toHaveLength(3);
    expect(new Set(p.team.map((x) => SPECIES[x].type)).size, 'three different types').toBe(3);
    for (const sp of p.team) {
      expect(SPECIES[sp].stage).toBe(1);
      expect(SPECIES[sp].legend).toBeFalsy();
      expect(knownAt(sp, DAY_TUNE.start).filter((m) => CMOVES[m].kind === 'atk').length, sp + ' can fight').toBeGreaterThanOrEqual(2);
    }
    expect(p.floors).toHaveLength(DAY_FLOORS.length);
    p.floors.forEach((f, n) => {
      if (f.scene !== 'porto') expect(sceneInfo(f.scene).title, f.scene + ' is a scene of its own').not.toBe(sceneInfo('porto').title);
      expect(f.foeList.length, f.name).toBe(f.foes);
      for (const x of f.foeList) { expect(SPECIES[x.sp], x.sp).toBeTruthy(); expect(x.lv).toBe(levelAt(n) - DAY_TUNE.under); }
      expect(f.offers).toHaveLength(3);
      expect(new Set(f.offers.map((o) => o.k)).size, 'three different rewards').toBe(3);
      if (f.foes > 1) expect(f.who, 'someone sends them in').toBeTruthy();
      if (!f.boss) expect(HIDINGS[f.table], f.table).toBeTruthy();
    });
    const last = p.floors[p.floors.length - 1];
    expect(last.boss).toBe(true);
    expect(last.stages!.length).toBeGreaterThan(1);
  });
  it('offers only abilities that exist', () => { for (const a of DAY_ABILITIES) expect(ABILITIES[a], a).toBeTruthy(); });
  it('over many days the fish that only jumps never starts, and no legend does', () => {
    for (let s = 1; s < 300; s++) expect(planOf(s).team).not.toContain('cefalino');
  });
  it('a creature comes in the form it has at that level, with no bond needed', () => {
    expect(formAt('polpino', 13)).toBe('polpino');
    expect(formAt('polpino', 14)).toBe(SPECIES.polpino.evolve!.into);
    expect(formAt('polpino', 30)).toBe('polpastro');
  });
  it('the legend at the end has its parts and a share of its health', () => {
    const f = { sp: 'lamo' as SpeciesId, lv: 20 }, p = planOf(5).floors[7], m = foeMember(f, p.stages);
    expect(m.stages).toBeTruthy();
    expect(m.stats!.hp).toBe(Math.round(foeMember(f).stats!.hp * DAY_TUNE.bossHp));
  });
});

describe('a run', () => {
  it('starts with three at the first level, all healthy', () => {
    const r = newRun(9, '2026-11-05');
    expect(r.team.map((m) => [m.lv, m.hp])).toEqual([[10, 1], [10, 1], [10, 1]]);
    expect(r.day).toBe('2026-11-05');
  });
  it('a creature keeps its health from one floor to the next, with a little rest', () => {
    const r = newRun(9, ''), k = r.team[0].key;
    afterFloor(r, true, { [k]: 0.4 }, 5);
    expect(r.team[0].hp).toBeCloseTo(0.4 + DAY_TUNE.rest);
    expect(memberOf(r.team[0]).hp).toBeCloseTo(r.team[0].hp * memberOf(r.team[0]).stats!.hp);
  });
  it('who is down stays down, until a heal', () => {
    const r = newRun(9, ''), k = r.team[0].key;
    afterFloor(r, true, { [k]: 0 }, 5);
    expect(r.team[0].hp).toBe(0);
    expect(alive(r)).toHaveLength(2);
    expect(r.log, 'someone fell').toEqual([1]);
    takeOffer(r, { k: 'heal' });
    expect(r.team[0].hp).toBe(DAY_TUNE.heal);
  });
  it('the team grows, and changes form on the way', () => {
    const r = newRun(9, ''); r.team[0].sp = 'polpino'; r.team[0].lv = 12;
    const said = afterFloor(r, true, {}, 5);
    expect(r.team[0].lv).toBe(14);
    expect(r.team[0].sp).toBe(SPECIES.polpino.evolve!.into);
    expect(said[0]).toContain('diventa');
  });
  it('each reward does what it says', () => {
    const r = newRun(9, ''), k = r.team[1].key;
    afterFloor(r, true, {}, 5);
    takeOffer(r, { k: 'held', id: 'cozza' }, k);
    expect(r.team[1].item).toBe('cozza');
    takeOffer(r, { k: 'abil', id: 'aculei' }, k);
    expect(memberOf(r.team[1]).abil).toEqual(['aculei']);
    const lv = r.team[1].lv;
    takeOffer(r, { k: 'levels' }, k);
    expect(r.team[1].lv).toBe(lv + DAY_TUNE.levels);
    takeOffer(r, { k: 'mon', sp: 'cicalina' });
    expect(r.team).toHaveLength(4);
    expect(r.team[3].lv).toBe(levelAt(r.floor));
    expect(new Set(r.team.map((m) => m.key)).size, 'each has its own key').toBe(4);
  });
  it('a reward for one creature waits until it knows which', () => {
    const r = newRun(9, ''); afterFloor(r, true, {}, 5);
    takeOffer(r, { k: 'levels' });
    expect(r.picking).toBe(true);
    for (const o of [{ k: 'levels' }, { k: 'held', id: 'oliva' }, { k: 'abil', id: 'coda' }] as Offer[]) expect(needsTarget(o)).toBe(true);
    for (const o of [{ k: 'heal' }, { k: 'mon', sp: 'cicalina' }] as Offer[]) expect(needsTarget(o)).toBe(false);
  });
  it('the team has a limit, and a heal with nobody hurt is not on offer', () => {
    const r = newRun(9, '');
    expect(canTake(r, { k: 'heal' })).toBe(false);
    for (let k = 0; k < 3; k++) r.team.push({ key: 'x' + k, sp: 'cicalina', lv: 10, hp: 1 });
    expect(canTake(r, { k: 'mon', sp: 'gabbi' })).toBe(false);
    takeOffer(r, { k: 'mon', sp: 'gabbi' });
    expect(r.team).toHaveLength(6);
  });
  it('a lost floor ends it, a floor won pays, the last one ends it well', () => {
    const lost = newRun(9, '');
    afterFloor(lost, false, keepAll(lost, 0), 12);
    expect(lost.over).toBe('lost'); expect(lost.score).toBe(0); expect(lost.log).toEqual([0]);
    const r = newRun(9, '');
    afterFloor(r, true, keepAll(r, 1), 10);
    expect(r.score).toBe(DAY_TUNE.floor + DAY_TUNE.health + 10 * DAY_TUNE.turn);
    for (let n = 1; n < DAY_FLOORS.length; n++) { takeOffer(r, null); afterFloor(r, true, keepAll(r, 0.5), 30); }
    expect(r.over).toBe('won');
    expect(r.picking).toBe(false);
    expect(r.log).toHaveLength(DAY_FLOORS.length);
  });
  it('survives a trip through JSON, which is how it is saved', () => {
    const r = newRun(31, '2026-11-05');
    afterFloor(r, true, keepAll(r, 0.7), 8);
    expect(JSON.parse(JSON.stringify(r))).toEqual(r);
  });
  it('tells each reward in words', () => {
    for (const o of planOf(4).floors.flatMap((f) => f.offers)) { const t = offerText(o); expect(t.name).toBeTruthy(); expect(t.text).toBeTruthy(); }
  });
});

describe('the line for the friends', () => {
  it('says how it went, with a square for each floor', () => {
    const r = newRun(9, '2026-11-05'), k = r.team[0].key;
    afterFloor(r, true, keepAll(r, 1), 10);
    afterFloor(r, true, { ...keepAll(r, 1), [k]: 0 }, 10);
    takeOffer(r, null);
    afterFloor(r, false, keepAll(r, 0), 10);
    const line = shareLine(r, '5 novembre');
    expect(line).toContain('Un giorno a Formia, 5 novembre: 2 su 8');
    expect(line).toContain('🟩🟨🟥⬜⬜⬜⬜⬜');
    expect(line).toContain(r.score + ' punti');
    expect(line).toContain(SPECIES[r.team[0].sp].name);
  });
});
