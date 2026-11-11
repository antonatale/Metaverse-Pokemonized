import { describe, expect, it } from 'vitest';
import { cleanStory, cleanName, toCode, fromCode, CODE_PREFIX } from '../../src/save/transfer';
import { blank } from '../../src/save/story-progress';

/* A story from outside (save/transfer.ts) comes back as it went, and anything of the wrong shape is cleaned away. */
describe('a story to take away and bring back', () => {
  it('comes back the same through a code', () => {
    const s = blank('valentin');
    s.mons = [{ uid: 'c1', sp: 'polpetto', nick: 'Polpo', bond: 60, moves: ['scintilla'] }];
    s.lv = { valentin: { lv: 9, xp: 12 }, c1: { lv: 11, xp: 3 } };
    s.money = 120; s.bag = { retino: 3 }; s.badges = ['pin-costanzo']; s.seen.intro = true; s.lead = 'c1';
    const code = toCode(s);
    expect(code.startsWith(CODE_PREFIX)).toBe(true);
    const back = fromCode(code);
    expect('story' in back && back.story).toEqual(cleanStory(JSON.parse(JSON.stringify(s))));
    expect('story' in back && back.story.mons![0]).toMatchObject({ uid: 'c1', sp: 'polpetto', nick: 'Polpo', bond: 60 });
  });
  it('says why a code is not a story', () => {
    expect(fromCode('ciao')).toHaveProperty('why');
    expect(fromCode(CODE_PREFIX + '%%%')).toHaveProperty('why');
    expect(fromCode(CODE_PREFIX + btoa('{"v":2}'))).toHaveProperty('why');
  });
  it('cleans what comes from outside, field by field', () => {
    const s = cleanStory({
      v: 1, map: 'formia', x: 1e9, y: -4, dir: 'sideways', squad: ['antonio', 'nobody', 7], badges: ['ok', '<script>'],
      seen: { intro: true, bad: 'yes', '<x>': true }, money: -50, bag: { retino: 1e9, 'a b': 2 },
      mons: [{ uid: 'c1', sp: 'polpetto', nick: '<img src=x onerror=alert(1)>Polpino lunghissimo davvero', bond: 999 }, { uid: 'c1', sp: 'polpetto' }, { uid: 'c2', sp: 'pikachu' }],
      lead: 'c9', first: 'hacker', rival: 'gabbianotto', at: 'ieri'
    })!;
    expect(s).not.toBeNull();
    expect(s.x).toBeLessThan(1000); expect(s.y).toBe(0); expect(s.dir).toBe('down');
    expect(s.squad).toEqual(['antonio']); expect(s.badges).toEqual(['ok']);
    expect(s.seen).toEqual({ intro: true }); expect(s.money).toBe(0); expect(s.bag).toEqual({ retino: 9999 });
    expect(s.mons!.length).toBe(1);
    expect(s.mons![0].nick).not.toMatch(/[<>]/); expect(s.mons![0].nick!.length).toBeLessThanOrEqual(16); expect(s.mons![0].bond).toBe(100);
    expect(s.lead).toBeUndefined(); expect(s.first).toBeUndefined(); expect(s.rival).toBe('gabbianotto'); expect(s.at).toBeUndefined();
  });
  it('is not a story without a map the game has', () => {
    expect(cleanStory({ v: 1, map: 'atlantide', x: 1, y: 1 })).toBeNull();
    expect(cleanStory(null)).toBeNull();
    expect(cleanStory([1, 2])).toBeNull();
  });
  it('keeps only plain text in a name', () => {
    expect(cleanName('  Polpo\u0000 "il grande" ')).toBe('Polpo il grande');
    expect(cleanName('<<>>')).toBeUndefined();
    expect(cleanName(42)).toBeUndefined();
  });
});

/* A save that cannot be read is kept aside before anything writes over it; a save that fails says so; a story put in
   a slot keeps the old one as a backup (save/story-progress.ts). */
describe('saves that are not lost', () => {
  const fresh = async (store: Record<string, string>, fail = false) => {
    const { vi } = await import('vitest');
    vi.resetModules();
    vi.stubGlobal('window', { localStorage: {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { if (fail) throw new Error('full'); store[k] = v; },
      removeItem: (k: string) => { delete store[k]; }
    } });
    return import('../../src/save/story-progress');
  };
  it('keeps an unreadable story in its backup, and starts a new one', async () => {
    const store: Record<string, string> = { 'lotte-tra-amici:storia:v1': '{"v":1,"map":"' };
    const P = await fresh(store);
    expect(P.st.badges).toEqual([]);
    expect(store['lotte-tra-amici:storia:v1:backup']).toBe('{"v":1,"map":"');
    expect(P.trouble.unreadable).toEqual([1]);
    P.save();
    expect(store['lotte-tra-amici:storia:v1:backup'], 'the save over it does not touch the backup').toBe('{"v":1,"map":"');
    const { vi } = await import('vitest'); vi.unstubAllGlobals();
  });
  it('says once that saving fails', async () => {
    const P = await fresh({}, true);
    let told = 0;
    P.onSaveFail(() => { told++; });
    expect(P.save()).toBe(false); expect(P.save()).toBe(false);
    expect(told).toBe(1); expect(P.trouble.saveFailed).toBe(true);
    const { vi } = await import('vitest'); vi.unstubAllGlobals();
  });
  it('puts an imported story in a slot, the old one in its backup', async () => {
    const store: Record<string, string> = {};
    const P = await fresh(store);
    P.st.money = 7; P.save();
    const before = store['lotte-tra-amici:storia:v1'];
    const s = P.blank('andrea'); s.money = 300;
    expect(P.putSlot(1, s)).toBe(true);
    expect(store['lotte-tra-amici:storia:v1:backup']).toBe(before);
    expect(P.st.money, 'the slot being played is played from now on').toBe(300);
    const { vi } = await import('vitest'); vi.unstubAllGlobals();
  });
});

/* R18: the steps from one version of a save to the next, in order, each once (save/story-progress.ts MIGRATIONS) */
describe('the versions of a save', () => {
  it('takes the steps it has not taken, and sends whoever is played back to his own home', async () => {
    const { vi } = await import('vitest');
    vi.resetModules();
    const store: Record<string, string> = {};
    vi.stubGlobal('window', { localStorage: { getItem: (k: string) => (k in store ? store[k] : null), setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } } });
    const { MAPS } = await import('../../src/data/maps');
    store['lotte-tra-amici:storia:v1'] = JSON.stringify({ v: 1, map: 'formia', x: 1, y: 1, dir: 'up', badges: [], squad: ['zendavid'], first: 'zendavid', beaten: {}, found: {}, seen: { protagonisti: true, formia2: true } });
    const P = await import('../../src/save/story-progress');
    const home = MAPS.formia.starts!.zendavid;
    expect([P.st.x, P.st.y]).toEqual([home[0], home[1]]);
    expect(P.st.first).toBe('zendavid');
    P.MIGRATIONS.forEach((m) => expect(P.st.seen[m.id], m.id).toBe(true));
    vi.unstubAllGlobals();
  });
});
