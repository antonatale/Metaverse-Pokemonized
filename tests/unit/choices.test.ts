import { beforeEach, describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { CHOICES } from '../../src/data/choices';
import { LEGENDS } from '../../src/data/legends';
import { HELD } from '../../src/data/passives';
import { HELD_IDS } from '../../src/data/growth';
import { TRAINERS } from '../../src/data/trainers';
import { SPECIES } from '../../src/data/creatures';
import { st } from '../../src/save/story-progress';
import { chosen, decide, endFlag, legendOf, legendOver, optionFlag, pactOpen, stagesNow, stonesKept, tullioMood } from '../../src/story/choices';
import { shieldNow, teamOf, trainerNow } from '../../src/story/rival';
import { epilogue } from '../../src/story/epilogue';
import { heldInBag, sideOf } from '../../src/story/growth';
import { ENGINE as E } from '../../src/battle';

/* The choices of the story: what the player decides has to change something, and every ending has to be reachable. */
const Lamo = LEGENDS.lamo;
function sources(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => e.isDirectory() ? sources(path.join(dir, e.name)) : e.name.endsWith('.ts') ? [path.join(dir, e.name)] : []);
}
beforeEach(() => { st.seen = {}; st.beaten = {}; st.dex = {}; st.mons = []; st.squad = ['antonio']; st.found = {}; st.bag = {}; });

describe('a choice', () => {
  it('is remembered as a flag, and no choice is a choice not made', () => {
    expect(chosen('pietre')).toBeNull();
    decide('pietre', 'tenute');
    expect(st.seen['sc-pietre-tenute']).toBe(true);
    expect(chosen('pietre')).toBe('tenute');
  });
  it('survives a trip through the save: only flags, nothing else', () => {
    decide('tullio1', 'amico');
    expect(JSON.parse(JSON.stringify(st.seen))).toEqual({ 'sc-tullio1-amico': true });
  });
  it('every option of every choice changes something: some code or some data reads it', () => {
    const all = sources('src').filter((f) => !f.endsWith('data/choices.ts')).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
    const reads = (id: string, o: string) => all.includes(optionFlag(id, o)) || new RegExp("chosen\\('" + id + "'\\)[^;]*'" + o + "'").test(all) || /chosen\('tullio[12]'\)/.test(all) && id.startsWith('tullio') || (id === 'pietre' && all.includes("=== '" + o + "'"));
    for (const c of Object.values(CHOICES)) for (const o of c.options) expect(reads(c.id, o.id), c.id + ': ' + o.id + ' changes nothing').toBe(true);
  });
  it('asks somebody, and answers', () => {
    for (const c of Object.values(CHOICES)) {
      expect(c.ask.length).toBeGreaterThan(0);
      expect(c.options.length).toBeGreaterThan(1);
      for (const o of c.options) expect(o.say.length, c.id + ' ' + o.id).toBeGreaterThan(0);
    }
  });
});

describe('Tullio is what the player makes of him', () => {
  it('two kind words make a friend, two jokes an enemy, anything else leaves him as he was', () => {
    expect(tullioMood()).toBe('');
    decide('tullio1', 'amico'); expect(tullioMood(), 'one is not enough').toBe('');
    decide('tullio2', 'amico'); expect(tullioMood()).toBe('ally');
    st.seen = {}; decide('tullio1', 'sfotto'); decide('tullio2', 'sfotto'); expect(tullioMood()).toBe('bitter');
    st.seen = {}; decide('tullio1', 'amico'); decide('tullio2', 'sfotto'); expect(tullioMood()).toBe('');
  });
  it('a friend cracks the Ricchezza before the battle, an enemy thickens it', () => {
    expect(shieldNow('mamurra')).toEqual({ left: 3, name: 'Ricchezza' });
    decide('tullio1', 'amico'); decide('tullio2', 'amico');
    expect(shieldNow('mamurra')!.left).toBe(2);
    st.seen = {}; decide('tullio1', 'sfotto'); decide('tullio2', 'sfotto');
    expect(shieldNow('mamurra')!.left).toBe(4);
    expect(shieldNow('guida'), 'nobody else has one').toBeUndefined();
  });
  it('the last battle changes with him: an enemy comes back stronger, with Risonanza, and pays more', () => {
    const plain = teamOf('rivale-3');
    expect(plain.some((t) => t.resonate)).toBe(false);
    decide('tullio1', 'sfotto'); decide('tullio2', 'sfotto');
    const angry = teamOf('rivale-3');
    expect(angry.map((t) => t.lv)).toEqual(plain.map((t) => t.lv + 2));
    expect(angry.every((t) => t.resonate)).toBe(true);
    expect(trainerNow('rivale-3').prize).toBe(500);
    expect(trainerNow('rivale-3').intro.join(' ')).toContain('Mamurra');
  });
  it('a friend says other things and gives something, once: the words of the gift are not in those of every win', () => {
    decide('tullio1', 'amico'); decide('tullio2', 'amico');
    expect(trainerNow('rivale-3').win.join(' ')).not.toContain('retini d\'oro');
    expect(trainerNow('rivale-3').gift!.say).toContain('retini d\'oro');
    expect(trainerNow('rivale-3').gift!.items).toEqual({ oro: 2 });
    expect(trainerNow('rivale-3').prize, 'the prize stays').toBe(250);
    expect(teamOf('rivale-3').some((t) => t.resonate)).toBe(false);
  });
  it('nobody else changes with him', () => { decide('tullio1', 'amico'); decide('tullio2', 'amico'); expect(trainerNow('guida')).toBe(TRAINERS.guida); });
});

describe('the stones', () => {
  it('kept, Lamo wants them back: stronger, angrier, and no riddle', () => {
    expect(legendOver(Lamo)).toBe(0);
    expect(stagesNow(Lamo)).toBe(Lamo.stages);
    decide('pietre', 'tenute');
    expect(stonesKept()).toBe(true);
    expect(legendOver(Lamo)).toBe(Lamo.angry!.more);
    expect(stagesNow(Lamo)[1].line).toContain('LADRO');
    expect(stagesNow(Lamo)[1].moves, 'the same fight').toEqual(Lamo.stages[1].moves);
  });
  it('kept, they give a point of Slancio at the start of a battle', () => {
    const s = E.newBattle({ a: 'ramarrino', b: 'cicalina', seed: 3, field: { type: 'Calma', name: 'di Castellone' }, surgeStart: 1, benchA: [] });
    expect(s.surge).toEqual([1, 0]);
    expect(E.intro(s).some((e) => e.k === 'say' && /punto di Slancio/.test(e.text))).toBe(true);
  });
  it('kept, every creature can do Risonanza, however little it knows Antonio', () => {
    st.mons = [{ uid: 'c1', sp: 'cicalina', moves: ['botta'], bond: 20, nat: 'Sereno' }] as typeof st.mons;
    expect(sideOf('c1').resonate).toBeUndefined();
    decide('pietre', 'tenute');
    expect(sideOf('c1').resonate).toBe(true);
    st.seen[endFlag(Lamo, 'libero')] = true;
    expect(sideOf('c1').resonate, 'given back, the power goes with them').toBeUndefined();
  });
  it('sealed, everything stays as it was', () => { decide('pietre', 'sigillo'); expect(stonesKept()).toBe(false); expect(legendOver(Lamo)).toBe(0); });
  it('given back to Lamo, they are gone', () => { decide('pietre', 'tenute'); st.seen[endFlag(Lamo, 'libero')] = true; expect(stonesKept()).toBe(false); });
});

describe('how a legend ends', () => {
  it('each one has an end, with a thing of its own that no shop sells', () => {
    const gifts = Object.values(LEGENDS).map((L) => L.end!.free.gift);
    expect(new Set(gifts).size).toBe(3);
    for (const g of gifts) { expect(HELD[g], g).toBeTruthy(); expect(HELD_IDS, g + ' is not for sale').not.toContain(g); }
  });
  it('the thing left behind can be given to a creature', () => {
    st.bag = { corona: 1 };
    expect(heldInBag()).toContain('corona');
  });
  it('a pact waits until it is kept', () => {
    expect(pactOpen(Lamo)).toBe(false);
    st.seen[endFlag(Lamo, 'patto')] = true;
    expect(pactOpen(Lamo)).toBe(true);
    st.seen[endFlag(Lamo, 'amico')] = true;
    expect(pactOpen(Lamo)).toBe(false);
  });
  it('finds its legend from the creature', () => { expect(legendOf('fuocelmo')).toBe(LEGENDS.elmo); expect(legendOf('cicalina')).toBeNull(); });
});

describe('the epilogue', () => {
  const stones = [null, 'sigillo', 'tenute'], moods: [string | null, string | null][] = [[null, null], ['amico', 'amico'], ['sfotto', 'sfotto'], ['amico', 'sfotto']], ends = [null, 'preso', 'patto', 'amico', 'libero'] as const;
  it('tells a different story for every way of playing', () => {
    const seen = new Set<string>();
    for (const a of stones) for (const m of moods) for (const e of ends) {
      st.seen = { 'enigma-lamo': true }; st.beaten = { 'tr-mamurra': true, 'tr-rivale-3': true }; st.dex = { lamo: e === 'preso' || e === 'amico' || e === 'libero' ? 2 : 1 };
      if (a) decide('pietre', a);
      if (m[0]) decide('tullio1', m[0]);
      if (m[1]) decide('tullio2', m[1]);
      if (e === 'amico') st.seen[endFlag(Lamo, 'patto')] = true;
      if (e) st.seen[endFlag(Lamo, e)] = true;
      seen.add(epilogue().join(' '));
    }
    /* a mixed Tullio reads like no choice at all, as it should */
    expect(seen.size).toBe(stones.length * 3 * ends.length);
  });
  it('does not say the seal is closed before the stones are in their niches', () => {
    st.beaten = { 'tr-mamurra': true }; decide('pietre', 'sigillo');
    expect(epilogue().join(' ')).toContain('Le nicchie sotto le mura di Castellone le aspettano ancora');
    st.seen['enigma-lamo'] = true;
    expect(epilogue().join(' ')).toContain('il sigillo di Telepilo è chiuso');
  });
  it('says what became of each', () => {
    st.dex = { lamo: 2 }; st.beaten = { 'tr-mamurra': true };
    decide('pietre', 'tenute'); st.seen[endFlag(Lamo, 'libero')] = true;
    const t = epilogue().join(' ');
    expect(t).toContain('Le hai rese a Lamo');
    expect(t).toContain('si sente russare');
    expect(t).not.toContain(SPECIES.lamo.name + ' è con te');
  });
});
