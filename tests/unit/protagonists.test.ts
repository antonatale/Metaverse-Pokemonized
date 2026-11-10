import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CHARS, ROSTER, type FriendId } from '../../src/data/characters';
import { SPECIES, knownAt } from '../../src/data/creatures';
import { HIDINGS } from '../../src/data/encounters';
import { MAPS } from '../../src/data/maps';
import { MISSIONS } from '../../src/data/missions';
import { JOIN } from '../../src/data/people';
import { TRAINERS } from '../../src/data/trainers';
import { WARES } from '../../src/data/growth';
import { st } from '../../src/save/story-progress';
import { record } from '../../src/story/activities';
import { addCreature, firstHuman, heroText, homeMons, joinFriend, leadCreature, level, monsOf, nameOf, sendHome, setFirst, setLead, teamMons, TEAM_MAX } from '../../src/story/growth';
import { canDo, missionDone, missionOf, missionOfTrainer, missionPay, tooEarly } from '../../src/story/missions';
import { epilogue } from '../../src/story/epilogue';
import { rival, rivalFor } from '../../src/story/rival';

/* Everyone in the company is a protagonist: its own creatures, and missions only it can do. */
const mon = (uid: string, owner?: string) => ({ uid, sp: 'cicalina' as const, moves: ['botta'], bond: 20, nat: 'Sereno', ...(owner ? { owner } : {}) });
beforeEach(() => { st.seen = {}; st.beaten = {}; st.lv = {}; st.mons = []; st.squad = ['antonio']; delete st.first; delete st.lead; delete st.leads; st.dex = {}; st.bag = {}; st.done = {}; st.best = {}; st.money = 0; });

describe('who is being played', () => {
  it('is Antonio until the player says otherwise, and in an old save everything is his', () => {
    st.mons = [mon('c1'), mon('c2')];
    expect(firstHuman()).toBe('antonio');
    expect(teamMons().map((m) => m.uid)).toEqual(['c1', 'c2']);
  });
  it('can only be someone of the company', () => {
    setFirst('forchetta');
    expect(firstHuman()).toBe('antonio');
    st.squad = ['antonio', 'forchetta'];
    setFirst('forchetta');
    expect(firstHuman()).toBe('forchetta');
  });
  it('brings its own team: the creatures of the others stay with them', () => {
    st.mons = [mon('c1'), mon('c2', 'costanzo'), mon('c3', 'costanzo')];
    st.squad = ['antonio', 'costanzo'];
    expect(teamMons().map((m) => m.uid)).toEqual(['c1']);
    setFirst('costanzo');
    expect(teamMons().map((m) => m.uid)).toEqual(['c2', 'c3']);
    expect(leadCreature()).toBe('c2');
    setFirst('antonio');
    expect(leadCreature()).toBe('c1');
  });
  it('each one picks the creature that follows it, and Antonio\'s stays where an old save has it', () => {
    st.mons = [mon('c1'), mon('c2'), mon('c3', 'costanzo'), mon('c4', 'costanzo')];
    st.squad = ['antonio', 'costanzo'];
    setLead('c2');
    setFirst('costanzo'); setLead('c4');
    expect(leadCreature()).toBe('c4');
    setFirst('antonio');
    expect(leadCreature()).toBe('c2');
    expect(st.lead).toBe('c2');
    setFirst('costanzo');
    expect(leadCreature()).toBe('c4');
    expect(sendHome('c4')).toBe(true);
    expect(leadCreature(), 'gone home: the first of the team again').toBe('c3');
  });
  it('catches for itself', () => {
    st.squad = ['antonio', 'costanzo']; st.mons = [mon('c1', 'costanzo')];
    setFirst('costanzo');
    const uid = addCreature('riccetto', 9);
    expect(st.mons!.filter((m) => m.uid === uid)[0].owner).toBe('costanzo');
    setFirst('antonio');
    const mine = addCreature('riccetto', 9);
    expect(st.mons!.filter((m) => m.uid === mine)[0].owner, 'Antonio\'s stay as they were in the save').toBeUndefined();
  });
  it('fills its own six places, and home is its own too', () => {
    st.squad = ['antonio', 'costanzo'];
    for (let k = 0; k < TEAM_MAX; k++) addCreature('riccetto', 5);
    setFirst('costanzo');
    /* the first creature comes with the first turn as protagonist; Antonio's six do not take its places */
    expect(teamMons()).toHaveLength(1);
    for (let k = 1; k < TEAM_MAX; k++) addCreature('riccetto', 5);
    expect(teamMons()).toHaveLength(TEAM_MAX);
    addCreature('riccetto', 5);
    expect(homeMons()).toHaveLength(1);
    setFirst('antonio');
    expect(homeMons()).toHaveLength(0);
  });
});

describe('the story, told to who is being played', () => {
  it('says its name where a line speaks to it, and Antonio written anywhere is always Antonio', () => {
    st.squad = ['antonio', 'costanzo']; setFirst('costanzo');
    expect(heroText('Ciao {hero}! {hero}, sei tu?')).toBe('Ciao Costanzo! Costanzo, sei tu?');
    expect(heroText('Il motorino di Antonio. I sicari di Marco Antonio.')).toBe('Il motorino di Antonio. I sicari di Marco Antonio.');
    setFirst('antonio');
    expect(heroText('Ciao {hero}, cerco Antonio.')).toBe('Ciao Antonio, cerco Antonio.');
  });
  it('the old marker is gone: no line says {Antonio} any more', async () => {
    const { TIPS, CHAPTERS } = await import('../../src/story/mentor');
    const { CHOICES } = await import('../../src/data/choices');
    const all = JSON.stringify([MISSIONS, TRAINERS, MAPS, TIPS, CHAPTERS, CHOICES]);
    expect(all).not.toContain('{Antonio}');
    expect(all, 'some lines speak to who is being played').toContain('{hero}');
  });
  it('Tullio and the ending look at Antonio\'s first creature, whoever joined before it', () => {
    st.squad = ['antonio', 'forchetta']; st.mons = [mon('c1', 'forchetta'), { ...mon('c2'), sp: 'polpino' as const }];
    delete st.rival;
    expect(rival()).toBe(rivalFor('polpino'));
    expect(epilogue()[0]).toContain(nameOf('c2'));
  });
  it('the ending names who came along, not who is telling it', () => {
    st.squad = ['antonio', 'forchetta']; st.mons = [mon('c1', 'forchetta')]; setFirst('forchetta');
    const company = epilogue().filter((l) => l.startsWith('Nella tua compagnia'))[0];
    expect(company).toContain('Antonio');
    expect(company).not.toContain('Forchetta');
  });
  it('a save from before starts as Antonio: the first of the company was only who went first in a covo', async () => {
    const old = { v: 1, map: 'formia', x: 1, y: 1, dir: 'down', badges: [], squad: ['antonio', 'costanzo'], first: 'costanzo', beaten: {}, seen: {} };
    const load = async (save: unknown) => {
      vi.resetModules();
      vi.stubGlobal('window', { localStorage: { getItem: () => JSON.stringify(save), setItem() {} } });
      return (await import('../../src/save/story-progress')).st;
    };
    expect((await load(old)).first).toBeUndefined();
    expect((await load({ ...old, seen: { protagonisti: true } })).first, 'chosen now: it stays').toBe('costanzo');
    vi.unstubAllGlobals();
  });
});

describe('a friend who joins', () => {
  it('comes with its first creature, of its own type', () => {
    for (const id of Object.keys(JOIN) as (keyof typeof JOIN)[]) {
      expect(SPECIES[JOIN[id].sp], id).toBeTruthy();
      expect(SPECIES[JOIN[id].sp].type, id).toBe(CHARS[id].type);
      expect(knownAt(JOIN[id].sp, JOIN[id].lv).length, id).toBeGreaterThan(0);
    }
  });
  it('joins once, at its level, with a creature that is its own', () => {
    expect(joinFriend('andrea', 8)).toBe(true);
    expect(joinFriend('andrea', 8)).toBe(false);
    expect(level('andrea').lv).toBe(8);
    expect(monsOf('andrea').map((m) => m.sp)).toEqual([JOIN.andrea.sp]);
    expect(teamMons(), 'nothing changes for Antonio').toEqual([]);
  });
  it('is not left behind if it joins late: its creature keeps up with the team', () => {
    st.mons = [mon('c1'), mon('c2'), mon('c3')];
    st.lv = { c1: { lv: 30, xp: 0 }, c2: { lv: 30, xp: 0 }, c3: { lv: 30, xp: 0 } };
    joinFriend('andrea', 8);
    expect(level(monsOf('andrea')[0].uid).lv).toBe(29);
  });
  it('played for the first time, its creature keeps up with the team of who was being played until then', () => {
    st.squad = ['antonio', 'costanzo'];
    st.mons = [mon('c1'), mon('c2'), mon('c3')];
    st.lv = { c1: { lv: 30, xp: 0 }, c2: { lv: 30, xp: 0 }, c3: { lv: 30, xp: 0 } };
    setFirst('costanzo');
    expect(level(monsOf('costanzo')[0].uid).lv).toBe(29);
  });
  it('someone who joined before there were teams gets its creature the first time it is played', () => {
    st.squad = ['antonio', 'costanzo'];
    expect(monsOf('costanzo')).toEqual([]);
    setFirst('costanzo');
    expect(monsOf('costanzo')).toHaveLength(1);
  });
  it('nobody joins any more by doing something together (each of the six has his covo: data/covi.ts)', () => {
    for (const id of ['andrea', 'valentin', 'zendavid'] as const) {
      st.squad = ['antonio']; st.mons = [];
      record(JOIN[id].activity!, 3);
      expect(st.squad as string[], id).toEqual(['antonio']);
    }
  });
  it('only when it went well: a run out of time, or a game with no score, is not enough', () => {
    record(JOIN.zendavid.activity!);
    record(JOIN.andrea.activity!, 0);
    expect(st.squad).toEqual(['antonio']);
  });
  it('the experience of what is done goes to whoever is being played', () => {
    st.squad = ['antonio', 'costanzo']; setFirst('costanzo');
    st.lv = { costanzo: { lv: 10, xp: 0 } };
    record('gelato');
    expect(level('costanzo').xp).toBeGreaterThan(0);
    expect(level('antonio').xp).toBe(0);
  });
});

describe('the missions', () => {
  it('there is one for each of them, of someone who exists, with what it needs', () => {
    expect(MISSIONS.map((m) => m.who).sort()).toEqual(ROSTER.slice().sort());
    for (const m of MISSIONS) {
      const n = Object.values(MAPS).flatMap((x) => x.npcs || []).find((q) => q.id === m.npc);
      expect(n, m.id + ' asks ' + m.npc).toBeTruthy();
      expect(!!m.trainer !== !!m.quiz, m.id + ': a battle or some questions').toBe(true);
      if (m.trainer) expect(TRAINERS[m.trainer], m.trainer).toBeTruthy();
      for (const q of m.quiz || []) { expect(q.a[q.ok], q.q).toBeTruthy(); expect(new Set(q.a).size).toBe(q.a.length); }
      expect(SPECIES[m.pay.mon], m.pay.mon).toBeTruthy();
      for (const k in m.pay.items || {}) expect(WARES[k as keyof typeof WARES], k).toBeTruthy();
      expect(m.wait.join(' ') + m.ask.join(' '), m.id + ' says who it is for').toContain(CHARS[m.who].name);
    }
  });
  it('no two people ask for the same thing: each mission has its own', () => { expect(new Set(MISSIONS.map((m) => m.npc)).size).toBe(MISSIONS.length); });
  it('only the right one can do it, and the wild creatures of the prize are not legends', () => {
    const m = MISSIONS.filter((x) => x.who === 'forchetta')[0];
    expect(canDo(m)).toBe(false);
    st.squad = ['antonio', 'forchetta']; st.first = 'forchetta'; st.mons = [mon('c1', 'forchetta')];
    expect(canDo(m)).toBe(true);
    for (const x of MISSIONS) expect(SPECIES[x.pay.mon].legend).toBeFalsy();
  });
  it('waits for Antonio to have a creature: at the start of the game the neighbour is just the neighbour', () => {
    const m = MISSIONS.filter((x) => x.who === 'antonio')[0];
    expect(tooEarly(m)).toBe(true);
    st.mons = [mon('c1')];
    expect(tooEarly(m)).toBe(false);
    expect(tooEarly(MISSIONS.filter((x) => x.who === 'forchetta')[0]), 'someone else: it says who it is for').toBe(false);
  });
  it('done, it pays once, and the creature goes to who did it', () => {
    const m = MISSIONS.filter((x) => x.who === 'costanzo')[0];
    st.squad = ['antonio', 'costanzo']; st.first = 'costanzo'; st.mons = [mon('c1', 'costanzo')];
    st.lv = { costanzo: { lv: 12, xp: 0 } };
    expect(missionOf(m.npc)).toBe(m);
    const uid = missionPay(m);
    expect(missionDone(m)).toBe(true);
    expect(missionOf(m.npc)).toBeNull();
    expect(st.money).toBe(m.pay.money);
    expect(monsOf('costanzo').map((x) => x.uid)).toContain(uid);
    expect(level(uid).lv).toBe(10);
  });
  it('a battle of a mission is found from its trainer', () => {
    const m = MISSIONS.filter((x) => x.trainer)[0];
    /* played by the one it is for: a story of one protagonist has only his own missions */
    st.squad = [m.who]; st.first = m.who; st.seen.protagonisti = true;
    expect(missionOfTrainer(m.trainer!)).toBe(m);
    expect(missionOfTrainer('guida')).toBeNull();
    st.squad = [m.who === 'antonio' ? 'costanzo' : 'antonio']; st.first = st.squad[0];
    expect(missionOfTrainer(m.trainer!), 'someone else\'s mission is not there for him').toBeNull();
  });
  it('a mission can be reached: the people who ask are on a map you can walk', () => {
    for (const m of MISSIONS) expect(Object.keys(MAPS).some((k) => (MAPS[k].npcs || []).some((n) => n.id === m.npc)), m.id).toBe(true);
    expect(HIDINGS).toBeTruthy();
  });
});

describe('the friends as people on the map', () => {
  it('each has its own look to walk with', async () => {
    const { PEOPLE } = await import('../../src/render/canvas/walkers');
    for (const id of ROSTER as FriendId[]) expect(PEOPLE[id], id).toBeTruthy();
  });
});
