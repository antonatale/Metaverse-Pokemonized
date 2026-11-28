import { describe, expect, it } from 'vitest';
import { EXCUSES, RUNGS, SCALA_PAY } from '../../src/data/mazzarri';
import { ROSTER } from '../../src/data/characters';
import { newMemory, pick, fits, fill, inPlace, verdict, tally, title, heard, type ScalaCtx } from '../../src/story/mazzarri';

/* The Scala Mazzarri (27 November 2026, Antonio): every friend has his excuses, each with Costanzo's rung; they come
   round without repeating, and the closer the vote, the more it pays. */
describe('the Scala Mazzarri', () => {
  it('has excuses for each of the seven, on every part of the scale, with unique ids and rungs from 1 to 10', () => {
    expect(RUNGS).toHaveLength(10);
    const ids = new Set<string>();
    for (const who of ROSTER) {
      const all = EXCUSES[who];
      expect(all.length, who).toBeGreaterThanOrEqual(18);
      const plain = all.filter((e) => !e.when);
      expect(plain.length, who + ' plain').toBeGreaterThanOrEqual(12);
      /* honest ones, absurd ones, and at least one Mazzarri puro */
      expect(all.some((e) => e.r <= 2), who).toBe(true);
      expect(all.some((e) => e.r >= 8), who).toBe(true);
      expect(plain.some((e) => e.r === 10), who).toBe(true);
      for (const e of all) {
        expect(Number.isInteger(e.r) && e.r >= 1 && e.r <= 10, e.id).toBe(true);
        expect(ids.has(e.id), e.id).toBe(false);
        ids.add(e.id);
        /* a placeholder only where the battle can fill it */
        if (/\{gap\}/.test(e.text)) expect(['lvUp', 'lvDown']).toContain(e.when);
        if (/\{foe\}/.test(e.text)) expect(e.when).toBe('wild');
        if (/\{turns\}/.test(e.text)) expect(['long', 'short']).toContain(e.when);
        if (/\{inplace\}/.test(e.text)) expect(e.when).toBe('place');
      }
    }
  });

  it('says only what is true of the battle: an honest excuse about levels only when the winner was above', () => {
    const up = EXCUSES.andrea.find((e) => e.when === 'lvUp')!;
    expect(fits(up, { loser: 'andrea', gap: 4 })).toBe(true);
    expect(fits(up, { loser: 'andrea', gap: 1 })).toBe(false);
    const own = EXCUSES.costanzo.find((e) => e.when === 'own')!;
    expect(fits(own, { loser: 'costanzo' })).toBe(false);
    expect(fits(own, { loser: 'costanzo', own: true })).toBe(true);
    expect(fill(up.text, { loser: 'andrea', gap: 4 })).toContain('4 livelli');
  });

  it('does not repeat: every excuse of a friend comes once before any comes again', () => {
    const mem = newMemory(), ctx: ScalaCtx = { loser: 'valentin' };
    const plain = EXCUSES.valentin.filter((e) => fits(e, ctx)).length;
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const said: string[] = [];
    for (let k = 0; k < plain; k++) said.push(pick(ctx, mem, rnd)!.e.id);
    expect(new Set(said).size).toBe(plain);
    /* the next one is the one heard longest ago */
    expect(pick(ctx, mem, rnd)!.e.id).toBe(said[0]);
    expect(heard(mem, 'valentin').got).toBe(plain);
  });

  it('prefers an excuse that fits this battle, while it is new', () => {
    const mem = newMemory(), ctx: ScalaCtx = { loser: 'zendavid', night: true };
    expect(pick(ctx, mem, () => 0)!.e.when).toBe('night');
  });

  it('pays by how close the vote is, the 10 voted 10 more, and half for the excuse of who is played', () => {
    expect(verdict(7, 7).pay).toBe(SCALA_PAY.exact);
    expect(verdict(6, 7)).toMatchObject({ tier: 'one', pay: SCALA_PAY.one, under: true });
    expect(verdict(9, 7)).toMatchObject({ tier: 'two', pay: SCALA_PAY.two, under: false });
    expect(verdict(2, 7).pay).toBe(0);
    expect(verdict(10, 10)).toMatchObject({ puro: true, pay: SCALA_PAY.exact + SCALA_PAY.puro });
    expect(verdict(7, 7, true).pay).toBe(Math.round(SCALA_PAY.exact / 2));
  });

  it('remembers the votes, and after a few gives a title by how close they were', () => {
    const mem = newMemory();
    [verdict(5, 5), verdict(5, 5), verdict(4, 5)].forEach((v) => tally(mem, v));
    expect(title(mem)).toBeNull();
    tally(mem, verdict(5, 5));
    expect(mem).toMatchObject({ n: 4, exact: 3, near: 1, best: 2, streak: 1 });
    expect(title(mem)!.name).toBe('Commissario della Scala');
  });

  it('says where in good Italian', () => {
    expect(inPlace('Scauri')).toBe('a Scauri');
    expect(inPlace('Il Palazzo del Popolo')).toBe('al Palazzo del Popolo');
    expect(inPlace('La Torre Verde')).toBe('alla Torre Verde');
    expect(inPlace('Via Vitruvio')).toBe('in via Vitruvio');
    expect(inPlace('Lungomare di Vindicio')).toBe('sul lungomare di Vindicio');
    expect(inPlace("L'Eclipse")).toBe("all'Eclipse");
    expect(inPlace('Stazione')).toBe('alla stazione');
    expect(inPlace('Acqualonga')).toBe('ad Acqualonga');
    expect(inPlace('Bruno Zauli')).toBe('al Bruno Zauli');
    expect(inPlace('Casa di Valentin')).toBe('a casa di Valentin');
    expect(inPlace('Monti Aurunci')).toBe('sui Monti Aurunci');
  });
});
