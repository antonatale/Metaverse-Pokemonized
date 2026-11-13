import { test, expect, type Page } from '@playwright/test';
import { play, until, toPrompt, battleOver, walk, goStory, type Run } from './harness';

/* Whole games played to the end: the title and its stories, the story, its battles, saves.
   Each must finish without errors; the saves they leave are checked where it matters. */

declare global {
  interface Window {
    WORLD: { _debug: { spot(k: string, id: string): { x: number; y: number; dir: string } | null;
        way(): string[]; moto(): { at: { map: string; x: number; y: number; dir: string }; sella: boolean }; travel(to: string, x: number, y: number, dir?: string): void; route(x: number, y: number): string[] | null; pos(): { dialog: boolean; opts: boolean; text: string; map: string; x: number; y: number }; area(): string; meet(id: string): void; wild(sp: string, lv: number): void; xp(key: string, n: number): void; overview(id: string, s: number): string; who(id: string): { x: number; y: number; dir: string } | null; spotting(on: boolean): void }; state(): unknown };
    UI: { _debug: { suggest(): string | null } };
  }
}

async function saves(r: Run, name: string) {
  r.keep(name, await r.page.evaluate(() => ({
    storia: localStorage.getItem('lotte-tra-amici:storia:v1')
  })));
}
/** plays a battle to the end, choosing what the computer would choose, with a screenshot of the first turns */
async function fight(r: Run, label: string, shots = 4) {
  const p = r.page;
  for (let turn = 0; turn < 40; turn++) {
    await toPrompt(p);
    if (await battleOver(p)) break;
    if (await p.evaluate(() => { const o = document.getElementById('overlay')!; return !o.hidden && o.classList.contains('pass'); })) {
      if (turn < shots) await r.shot(label + '-pass' + turn);
      await p.click('#ps-go');
      continue;
    }
    /* a team battle: someone is down, or the foe's next is coming. The first who can come in, or stay as we are */
    if (await p.evaluate(() => { const o = document.getElementById('overlay')!; return !o.hidden && o.classList.contains('bench'); })) {
      if (turn < shots) await r.shot(label + '-bench' + turn);
      /* a touch on the dark around the sheet must not close it: this question has to be answered */
      await p.evaluate(() => document.getElementById('overlay')!.click());
      expect(await p.locator('#overlay.bench').count()).toBe(1);
      const pick = p.locator('.bench-pick:not([disabled])');
      if (await p.locator('#overlay h2', { hasText: 'sta per mandare' }).count()) await p.click('#bn-no');
      else await pick.first().click({ timeout: 10_000 });
      continue;
    }
    if (turn < shots) await r.shot(label + '-turn' + turn);
    /* the computer's choice; if it has no button right now, the first move that can be used */
    const id = await p.evaluate(() => window.UI._debug.suggest());
    const btn = p.locator('#pad .mv[data-id="' + id + '"]:not([disabled])');
    if (id && await btn.count()) await btn.click({ timeout: 10_000 });
    else await p.locator('#pad .mv:not([disabled]):not([hidden])').first().click({ timeout: 10_000 });
  }
  await p.clock.runFor(600);
  await r.shot(label + '-result');
}
async function overview(r: Run, id: string) {
  const url = await r.page.evaluate((m) => window.WORLD._debug.overview(m, 1), id);
  r.shots.push({ name: 'overview-' + id, png: Buffer.from(url.split(',')[1], 'base64') });
}
async function goTo(p: Page, kind: string, id: string) {
  const s = await p.evaluate(([k, i]) => window.WORLD._debug.spot(k, i), [kind, id]);
  if (!s) throw new Error('no spot for ' + kind + ' ' + id);
  const route = await p.evaluate(([x, y]) => window.WORLD._debug.route(x, y), [s.x, s.y]);
  await walk(p, route || []);
  await walk(p, []);
  /* face the target: a tap toward it only turns, it is blocked */
  const KEY: Record<string, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  await p.keyboard.down(KEY[s.dir]); await p.keyboard.up(KEY[s.dir]);
  await p.clock.runFor(200);
}
async function talkThrough(p: Page, max = 12) {
  for (let k = 0; k < max; k++) {
    const d = await p.evaluate(() => window.WORLD._debug.pos());
    if (!d.dialog || d.opts) return;
    await p.keyboard.press('Enter');
    await p.clock.runFor(200);
  }
}

/* the title: the intro (asked for with ?intro=1: the playtests skip it), the name, the way in and the three stories */
const SAVED = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: ['gialosai'], squad: ['antonio', 'costanzo'], beaten: {}, found: {}, seen: { intro: true, starter: true },
  mons: [{ uid: 'c1', sp: 'cicalina' }], lv: { antonio: { lv: 9, xp: 0 } }, money: 40, bag: {} };
/* a story taken away as a code and brought back into another slot (save/transfer.ts); a bad code says why */
test('a story exported and imported', async ({ browser }) => {
  const r = await play(browser, 'transfer', { reduced: false, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(SAVED) } }, async (r) => {
    const p = r.page;
    await p.click('#go-slots'); await p.clock.runFor(300);
    await p.click('[data-out="1"]'); await p.clock.runFor(300);
    await r.shot('export');
    const code = await p.locator('#ti-code').inputValue();
    r.keep('code', code.slice(0, 10));
    await p.click('[data-in="3"]'); await p.clock.runFor(300);
    await p.fill('#ti-code', 'non è un codice'); await p.click('#ti-load'); await p.clock.runFor(100);
    r.keep('bad', await p.locator('#ti-xmsg').innerText());
    await p.fill('#ti-code', code); await p.click('#ti-load'); await p.clock.runFor(300);
    await r.shot('imported');
    r.keep('slot3', await p.locator('.ti-slot[data-slot="3"]').innerText());
    r.keep('stored', await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('lotte-tra-amici:storia:v1:3') || 'null'); return s && { badges: s.badges, money: s.money, x: s.x }; }));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('code')).toBe('TELEPILO1:');
  expect(String(get('bad'))).toMatch(/Non è un codice di Telepilo/);
  expect(String(get('slot3'))).toMatch(/Gioca/);
  expect(get('stored')).toEqual({ badges: ['gialosai'], money: 40, x: 215 });
});

for (const dark of [false, true]) {
  test('title ' + (dark ? 'dark' : 'light'), async ({ browser }) => {
    await play(browser, 'title-' + (dark ? 'dark' : 'light'), { dark, viewport: { width: 1280, height: 800 }, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(SAVED) } }, async (r) => {
      const p = r.page;
      await r.shot('title');
      r.keep('go', await p.locator('#go-story').innerText());
      await p.click('#go-slots'); await p.clock.runFor(300);
      await r.shot('slots');
      r.keep('slots', await p.locator('.ti-slot').allInnerTexts());
    });
  });
}
test('the intro, and three stories at once', async ({ browser }) => {
  const r = await play(browser, 'stories', { viewport: { width: 1280, height: 800 }, reduced: false, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(SAVED) }, url: '?intro=1' }, async (r) => {
    const p = r.page;
    /* the intro: lines one after the other, then the name; any key skips it */
    await p.clock.runFor(1500);
    await r.shot('intro');
    r.keep('intro', await p.locator('#ti-intro').isVisible());
    await p.keyboard.press('Space'); await p.clock.runFor(1600);
    await r.shot('after-intro');
    r.keep('title', await p.locator('#ti-main').isVisible());
    /* a new story in the second slot: it starts from the beginning, with Cicero */
    await p.click('#go-slots'); await p.clock.runFor(300);
    /* «chi sei?»: the second story is Andrea's, from his home in Castellone */
    await p.click('[data-play="2"]'); await p.clock.runFor(300);
    await r.shot('who');
    await p.click('[data-hero="andrea"]'); await p.clock.runFor(1500);
    await until(p, () => window.WORLD._debug.pos().dialog);
    r.keep('second', await p.evaluate(() => { const s = window.WORLD.state() as { badges: string[]; mons: unknown[]; money: number; squad: string[]; first?: string }; return { badges: s.badges.length, mons: s.mons.length, money: s.money, squad: s.squad, first: s.first }; }));
    await talkThrough(p, 20);
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await p.click('[data-tab="mappa"]'); await p.click('#wm-home'); await p.clock.runFor(500);
    /* back on the title: the way in goes on with the second; the first is still there as it was */
    r.keep('go', await p.locator('#go-story').innerText());
    await p.click('#go-slots'); await p.clock.runFor(300);
    await r.shot('two-stories');
    await p.click('[data-play="1"]'); await p.clock.runFor(1500);
    r.keep('first', await p.evaluate(() => { const s = window.WORLD.state() as { badges: string[]; x: number; y: number; money: number }; return { badges: s.badges.length, x: s.x, y: s.y, money: s.money }; }));
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await p.click('[data-tab="mappa"]'); await p.click('#wm-home'); await p.clock.runFor(500);
    /* the second one goes, with a touch to be sure */
    await p.click('#go-slots'); await p.clock.runFor(300);
    await p.click('[data-del="2"]'); await p.click('[data-del="2"]'); await p.clock.runFor(300);
    r.keep('after-delete', await p.locator('.ti-slot.empty').count());
    r.keep('keys', await p.evaluate(() => [localStorage.getItem('lotte-tra-amici:storia:v1') !== null, localStorage.getItem('lotte-tra-amici:storia:v1:2'), localStorage.getItem('lotte-tra-amici:slot:v1')]));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('intro')).toBe(true);
  expect(get('title')).toBe(true);
  expect(get('second'), 'a new story, from nothing, Andrea alone in his company').toEqual({ badges: 0, mons: 0, money: 0, squad: ['andrea'], first: 'andrea' });
  expect(String(get('go'))).toContain('Storia 2');
  expect(get('first')).toMatchObject({ badges: 1, x: 215, y: 42, money: 40 });
  expect(get('after-delete')).toBe(2);
  expect(get('keys')).toEqual([true, null, '1']);
});

test('story', async ({ browser }) => {
  await play(browser, 'story', { seed: 3, gfx: 'bassa' }, async (r) => {
    const p = r.page;
    await goStory(p);
    await until(p, () => window.WORLD._debug.pos().dialog);
    await r.shot('intro');
    await talkThrough(p);
    await r.shot('start');
    await goTo(p, 'item', 'passaporto');
    await p.keyboard.press('Enter'); await p.clock.runFor(200);
    await r.shot('item');
    await talkThrough(p);
    await goTo(p, 'sign', 'Tomba di Cicerone');
    await p.keyboard.press('Enter'); await p.clock.runFor(200);
    await r.shot('sign');
    await talkThrough(p);
    /* a covo is fought with creatures: one, as from the park keeper */
    await p.evaluate(() => (window.WORLD._debug as unknown as { adopt(sp: string, lv: number): string }).adopt('ramarrino', 8));
    await goTo(p, 'npc', 'costanzo');
    await p.keyboard.press('Enter'); await p.clock.runFor(200);
    await r.shot('costanzo');
    await talkThrough(p);
    await r.shot('challenge');
    await p.click('#wopts .btn.primary');
    await fight(r, 'covo', 2);
    await p.click('#st-go, #st-retry');
    await p.clock.runFor(800);
    await r.shot('back');
    await talkThrough(p);
    await p.clock.runFor(300);
    await r.shot('after');
    await saves(r, 'saves');
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
});
test('story: circolo and menu', async ({ browser }) => {
  await play(browser, 'circolo', { seed: 4, dark: true, viewport: { width: 1280, height: 800 } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await until(p, () => window.WORLD._debug.pos().dialog);
    await talkThrough(p);
    await goTo(p, 'door', 'tennis');
    await walk(p, ['up']);
    await p.clock.runFor(600);
    await r.shot('inside');
    await goTo(p, 'npc', 'forchetta');
    await p.keyboard.press('Enter'); await p.clock.runFor(200);
    await r.shot('forchetta');
    await talkThrough(p);
    await p.click('#wopts .btn:not(.primary)');
    await p.clock.runFor(200);
    await p.keyboard.press('m'); await p.clock.runFor(200);
    await r.shot('menu');
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
});
test('story on a phone with the touch pad', async ({ browser }) => {
  await play(browser, 'touch', { seed: 5, touch: true }, async (r) => {
    await goStory(r.page);
    await until(r.page, () => window.WORLD._debug.pos().dialog);
    await r.shot('pad');
  });
});

for (const dark of [false, true]) {
  test('maps overview ' + (dark ? 'dark' : 'light'), async ({ browser }) => {
    await play(browser, 'maps-' + (dark ? 'dark' : 'light'), { dark }, async (r) => { await overview(r, 'formia'); await overview(r, 'circolo'); });
  });
}

/* the claude.ai artifact's hot reload: an open battle survives an update of the page */
test('hot reload keeps an open battle', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, found: {}, seen: { intro: true, starter: true, 'cic-wild': true },
    mons: [{ uid: 'c1', sp: 'polpastro', moves: ['spruzzo', 'catilinaria'] }], lv: { c1: { lv: 30, xp: 0 } }, money: 0, bag: {} };
  await play(browser, 'hot', { seed: 21, hot: true, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    await p.evaluate(() => window.WORLD._debug.meet('gianola')); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Lotta!'); await p.clock.runFor(800);
    for (let k = 0; k < 1; k++) {
      await toPrompt(p);
      const id = await p.evaluate(() => window.UI._debug.suggest());
      await p.click('#pad .mv[data-id="' + id + '"]');
    }
    await toPrompt(p);
    await r.shot('before');
    await p.evaluate(() => sessionStorage.setItem('__hot', JSON.stringify((window as unknown as { __snap(): unknown }).__snap())));
    await p.reload();
    await p.clock.runFor(1000);
    await toPrompt(p);
    await r.shot('after');
    await fight(r, 'rest', 1);
  });
});

/* saves in the format of the old single-file game still load */
const OLD_SAVE = {
  'lotte-tra-amici:storia:v1': JSON.stringify({ v: 1, map: 'formia', x: 30, y: 25, dir: 'left', badges: ['gialosai'], squad: ['antonio', 'costanzo'], beaten: { piazza: true }, seen: { intro: true, formia2: true }, found: { appunti: true, caricabatterie: true } }),
  /* the record of the friends' battles, which are no more: it stays in the browser, unread */
  'lotte-tra-amici:libretto:v2': JSON.stringify({ v: 2, chars: { antonio: { w: 3, l: 1 }, valentin: { w: 0, l: 2 } }, exam: { antonio: { p: 1, f: 2, best: 27, lode: false } } })
};
const PRE_FORMIA2 = { 'lotte-tra-amici:storia:v1': JSON.stringify({ v: 1, map: 'formia', x: 3, y: 3, dir: 'up', badges: [], squad: ['antonio'], beaten: {}, seen: { intro: true }, found: {} }) };
test('old saves', async ({ browser }) => {
  await play(browser, 'saves', { storage: OLD_SAVE }, async (r) => {
    await r.shot('home', { fullPage: true });
    await goStory(r.page);
    await r.page.clock.runFor(1500);
    await r.shot('world');
    await saves(r, 'saves');
  });
  await play(browser, 'saves-migration', { storage: PRE_FORMIA2 }, async (r) => {
    await goStory(r.page);
    await r.page.clock.runFor(1500);
    await r.shot('world');
    await saves(r, 'saves');
  });
});

/* the Lido Oriente is a place: its name on arriving, its beach, its bagnino, and a canoe out to the buoy and back */
test('a canoe at the Lido Oriente', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, found: {}, seen: { intro: true, starter: true },
    mons: [{ uid: 'c1', sp: 'cicalina' }], lv: { c1: { lv: 5, xp: 0 } }, money: 0, bag: {} };
  const r = await play(browser, 'oriente', { seed: 6, viewport: { width: 1280, height: 800 }, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    await talkTo(p, 'bagnino-oriente');
    r.keep('area', await p.evaluate(() => window.WORLD._debug.area()));
    await r.shot('lido');
    await choose(p, 'Prendi una canoa');
    /* left, right, left, right…: a stroke every 0.35 s, in turn */
    for (let k = 0; k < 160 && !(await p.locator('#mg-s', { hasText: /Fine|scaduto/ }).count()); k++) {
      await p.keyboard.press(k % 2 ? 'ArrowRight' : 'ArrowLeft'); await p.clock.runFor(350);
      if (k === 12) await r.shot('canoe');
    }
    r.keep('canoe', await p.textContent('#mg-s'));
    await r.shot('canoe-end');
    await p.click('#mg-x'); await p.clock.runFor(300);
    await talkThrough(p);
    await afterwards(p);
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('area')).toBe('Lido Oriente');
  expect(String(get('canoe'))).toMatch(/Fine: \d+,\d s/);
  const st = get('state') as { done: Record<string, number>; best: Record<string, number> };
  expect(st.done.canoa).toBe(1);
  expect(st.best.canoa).toBeGreaterThan(5);
});

/* the shops of the town, each its own: the pharmacy's balm, the fishmonger's alici, a manual of the bookshop, the
   newspaper read at the newsstand, the market of Largo Paone; then from the menu the alici to a creature and the manual */
test('the shops of the town', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, found: {}, seen: { intro: true, starter: true },
    mons: [{ uid: 'c1', sp: 'cicalina', bond: 10 }], lv: { c1: { lv: 5, xp: 0 } }, money: 300, bag: {} };
  type St = { bag: Record<string, number>; money: number; books?: number; mons: { bond?: number }[] };
  const r = await play(browser, 'shops', { seed: 3, viewport: { width: 1280, height: 800 }, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    const shop = async (id: string) => { await p.evaluate((i) => (window.WORLD._debug as unknown as { shop(id: string): void }).shop(i), id); await p.clock.runFor(300); };
    const buy = async (it: string, n = 1) => { for (let k = 1; k < n; k++) await p.click('[data-qty="' + it + '"] [data-up]'); await p.click('[data-it="' + it + '"]'); await p.clock.runFor(200); };
    await goStory(p); await p.clock.runFor(1500);
    /* the shops on the map */
    for (const [name, x, y] of [['pharmacy', 72, 28], ['market', 66, 37], ['fish', 95, 29], ['news', 83, 42], ['bakery', 62, 37]] as [string, number, number][]) {
      await p.evaluate(([x0, y0]) => window.WORLD._debug.travel('formia', x0, y0), [x, y]); await p.clock.runFor(600);
      await r.shot('map-' + name);
    }
    await shop('farmacia'); await buy('balsamo'); await r.shot('farmacia'); await p.click('#shop-x');
    await shop('pescheria'); await buy('alici', 2); await r.shot('pescheria'); await p.click('#shop-x');
    await shop('libreria'); await buy('manuale'); await r.shot('libreria'); await p.click('#shop-x');
    await shop('mercato'); r.keep('market', await p.locator('.wares li').count()); await r.shot('mercato'); await p.click('#shop-x');
    await shop('edicola'); await buy('giornale'); await p.clock.runFor(1500);
    r.keep('news', await p.evaluate(() => window.WORLD._debug.pos().text));
    await r.shot('giornale');
    await talkThrough(p); await p.clock.runFor(300);
    if (await p.locator('#shop-x').count()) await p.click('#shop-x');
    r.keep('bought', await p.evaluate(() => window.WORLD.state()));
    /* from the menu: the alici to the Cicalina, then the manual */
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await p.click('[data-use="alici"]'); await p.clock.runFor(300);
    await p.click('[data-qty="alici"] [data-up]'); await p.click('#us-go'); await p.clock.runFor(300);
    await talkThrough(p);
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await p.click('[data-use="manuale"]'); await p.clock.runFor(300);
    await talkThrough(p);
    r.keep('after', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect([2, 5]).toContain(get('market'));
  expect(String(get('news'))).toContain('Avvistamenti');
  const bought = get('bought') as St, after = get('after') as St;
  expect(bought.bag).toMatchObject({ balsamo: 1, alici: 2, manuale: 1 });
  expect(bought.money).toBe(300 - 8 - 10 - 60 - 1);
  expect(after.bag.alici).toBe(0);
  expect(after.bag.manuale).toBe(0);
  expect(after.books).toBe(1);
  expect(after.mons[0].bond).toBeGreaterThan(10);
});

/* Andrea, with the pins of the other five, takes his train: Milano Centrale, the hall closed by the clouds, and back */
test('Andrea takes the train to Milano', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: ['gialosai', 'peggio', 'weee', 'bau', 'statoarte'], squad: ['andrea'], first: 'andrea',
    beaten: { piazza: true, circolo: true, eclipse: true, pineta: true, palamendola: true }, found: {}, seen: { intro: true, starter: true, protagonisti: true }, mons: [], lv: {}, money: 0, bag: {} };
  const r = await play(browser, 'train', { seed: 2, viewport: { width: 1280, height: 800 }, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    await talkTo(p, 'capotreno');
    r.keep('offer', await p.locator('#wopts button').allInnerTexts());
    await choose(p, 'Sali sul treno'); await p.clock.runFor(1500);
    r.keep('there', await p.evaluate(() => window.WORLD._debug.pos().map));
    await r.shot('milano');
    await talkTo(p, 'capotreno-milano');
    await choose(p, 'Torna a Formia'); await p.clock.runFor(1500);
    r.keep('back', await p.evaluate(() => window.WORLD._debug.pos().map));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('offer')).toContain('Sali sul treno');
  expect(get('there')).toBe('milano');
  expect(get('back')).toBe('formia');
});

/* the bar of Mola: three coffees in one go, into the bag; from the menu, «Usa» asks whom once, and how many */
test('three coffees, given from the bag', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, found: {}, seen: { intro: true, starter: true },
    mons: [{ uid: 'c1', sp: 'cicalina' }], lv: { c1: { lv: 5, xp: 0 } }, money: 20, bag: {} };
  const r = await play(browser, 'coffee', { seed: 4, viewport: { width: 1280, height: 800 }, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    await p.evaluate(() => (window.WORLD._debug as unknown as { shop(id: string): void }).shop('bar')); await p.clock.runFor(300);
    for (let k = 0; k < 2; k++) await p.click('[data-qty="caffe"] [data-up]');
    await r.shot('shop');
    r.keep('price', await p.locator('[data-it="caffe"]').innerText());
    await p.click('[data-it="caffe"]'); await p.clock.runFor(200);
    r.keep('bought', await p.evaluate(() => (window.WORLD.state() as { bag: Record<string, number>; money: number })));
    await p.click('#shop-x'); await p.clock.runFor(200);
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await p.locator('[data-use="caffe"]').scrollIntoViewIfNeeded();
    await r.shot('bag');
    await p.click('[data-use="caffe"]'); await p.clock.runFor(300);
    await p.click('.pick[data-key="c1"]'); await p.clock.runFor(300);
    for (let k = 0; k < 2; k++) await p.click('[data-qty="caffe"] [data-up]');
    await r.shot('give');
    await p.click('#us-go'); await p.clock.runFor(300);
    await talkThrough(p, 20);
    r.keep('after', await p.evaluate(() => (window.WORLD.state() as { bag: Record<string, number>; lv: Record<string, { lv: number }> })));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value as { bag: Record<string, number>; money: number; lv: Record<string, { lv: number }> };
  expect(String(get('price'))).toContain('9');
  expect(get('bought')).toMatchObject({ bag: { caffe: 3 }, money: 11 });
  expect(get('after').bag.caffe).toBe(0);
  expect(get('after').lv.c1.lv).toBeGreaterThan(5);
});

/* the things to do around Formia, each in its real place */
async function choose(p: Page, label: string) {
  await p.locator('#wopts button', { hasText: label }).first().click({ timeout: 5000 });
  await p.clock.runFor(300);
}
/** what an activity brought, told once its own sheet and words are over (a level, a friend who comes along): what was said */
async function afterwards(p: Page): Promise<string[]> {
  const said: string[] = [];
  await p.clock.runFor(400);
  for (let k = 0; k < 16; k++) {
    const d = await p.evaluate(() => window.WORLD._debug.pos());
    if (!d.dialog) {
      /* a person changing its clothes, between two lines */
      if (await p.locator('#overlay:not([hidden]) .award .btn.primary').count()) { await p.locator('#overlay .award .btn.primary').first().click(); await p.clock.runFor(400); continue; }
      break;
    }
    await p.clock.runFor(1500);
    said.push((await p.evaluate(() => window.WORLD._debug.pos().text)) || '');
    if (d.opts) await p.locator('#wopts button').first().click(); else await p.keyboard.press('Enter');
    await p.clock.runFor(400);
  }
  return said;
}
async function talkTo(p: Page, id: string) {
  await goTo(p, 'npc', id);
  await p.keyboard.press('Enter'); await p.clock.runFor(200);
  await talkThrough(p);
}
test('activities around Formia', async ({ browser }) => {
  /* the longest game: minutes of fake clock (a minute of run in the pineta alone). On Bassa, without a graphics card,
     it still takes about four minutes, most of them Playwright's own: three times the time of the others (C1) */
  test.slow();
  const r = await play(browser, 'activities', { seed: 9, gfx: 'bassa' }, async (r) => {
    const p = r.page;
    await goStory(p);
    await until(p, () => window.WORLD._debug.pos().dialog);
    await talkThrough(p);
    /* the pineta: a run with Zendavid, left to time out */
    await talkTo(p, 'zendavid');
    await choose(p, 'Corri tra i pini');
    await talkThrough(p);
    await until(p, () => !document.getElementById('wrun')!.hidden);
    await r.shot('run');
    await p.clock.runFor(61_000);
    await until(p, () => window.WORLD._debug.pos().dialog);
    r.keep('run', await p.evaluate(() => window.WORLD._debug.pos().text));
    await talkThrough(p);
    const told: string[] = await afterwards(p);
    /* the Eclipse: beach volley with Valentin, one good hit, then the ball drops */
    await talkTo(p, 'valentin');
    await choose(p, 'Gioca a beach volley');
    /* the ball starts on Valentin's side: after about 1.3 s it is in the green zone (choose() already let 0.3 s go) */
    await p.clock.runFor(1000);
    await p.keyboard.press(' ');
    await p.clock.runFor(100);
    r.keep('volley', await p.textContent('#mg-s'));
    await r.shot('volley');
    await p.clock.runFor(6000);
    r.keep('volley end', await p.textContent('#mg-s'));
    await p.click('#mg-x');
    await p.clock.runFor(300);
    await talkThrough(p);
    told.push(...await afterwards(p));
    /* a windsurf lesson with Nicola Spadea: no pulling on the sail, so the wind soon catapults Antonio in */
    await talkTo(p, 'nicola');
    await choose(p, 'Prendi una lezione');
    await p.clock.runFor(300);
    await p.keyboard.press(' ');
    await p.clock.runFor(5000);
    r.keep('windsurf', await p.textContent('#mg-s'));
    await r.shot('windsurf');
    await p.click('#mg-x');
    await p.clock.runFor(300);
    await talkThrough(p);
    told.push(...await afterwards(p));
    /* a lettino from the bar of the lido */
    await talkTo(p, 'barista');
    await choose(p, 'Prendi un lettino');
    await talkThrough(p);
    await talkThrough(p);
    told.push(...await afterwards(p));
    /* Morgana: in through the door, a drink at the counter and the quiz, always the first answer */
    await goTo(p, 'door', 'morgana');
    await walk(p, ['up']);
    await p.clock.runFor(600);
    r.keep('inside morgana', await p.evaluate(() => window.WORLD._debug.pos().map));
    await r.shot('morgana');
    await talkTo(p, 'oste');
    await choose(p, 'Siediti al tavolo');
    await choose(p, 'Una rossa');
    await talkThrough(p);
    for (let q = 0; q < 5; q++) { await choose(p, ''); await talkThrough(p); }
    told.push(...await afterwards(p));
    /* and out again into via Abate Tosti */
    await walk(p, (await p.evaluate(() => window.WORLD._debug.route(5, 7))) || []);
    await walk(p, ['down']);
    await p.clock.runFor(600);
    /* a gelato from Lavezzi, in piazza Marconi */
    await talkTo(p, 'gelataio');
    await choose(p, 'Prendi un gelato');
    await choose(p, '');
    await choose(p, '');
    await talkThrough(p);
    told.push(...await afterwards(p));
    r.keep('told', told);
    await p.keyboard.press('m'); await p.clock.runFor(200);
    await r.shot('diary');
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const d = r.data, get = (n: string) => d.find((x) => x.name === n)!.value as string;
  expect(get('run')).toContain('Tempo scaduto');
  expect(get('volley')).toContain('Scambi: 1');
  expect(get('volley end')).toContain('Fine: 1 scambio');
  const st = get('state') as unknown as { done: Record<string, number>; best: Record<string, number> };
  expect(get('windsurf')).toMatch(/Fine: \d+ m di planata/);
  expect(get('inside morgana')).toBe('morgana');
  expect(st.done).toEqual({ corsa: 1, volley: 1, windsurf: 1, lettino: 1, quiz: 1, gelato: 1 });
  expect(st.best.volley).toBe(1);
  /* nobody joins the company any more (each friend has his covo): what is told after is the level, not a friend */
  const told = get('told') as unknown as string[];
  expect(told.join(' ')).not.toContain('Adesso anche');
  expect((st as unknown as { squad: string[] }).squad).toEqual(['antonio']);
  expect(st.best.quiz).toBeGreaterThanOrEqual(0);
});

/* Antonio's flat in Parco la Fontana, and the scooter he rides around town */
test('home and the scooter', async ({ browser }) => {
  const r = await play(browser, 'home', { seed: 10 }, async (r) => {
    const p = r.page;
    await goStory(p);
    await until(p, () => window.WORLD._debug.pos().dialog);
    await talkThrough(p);
    await goTo(p, 'door', 'casa');
    await walk(p, ['up']);
    await p.clock.runFor(600);
    r.keep('inside', await p.evaluate(() => window.WORLD._debug.pos().map));
    await r.shot('casa');
    await goTo(p, 'sign', 'portatile');
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    r.keep('desk', await p.evaluate(() => window.WORLD._debug.pos().text));
    await talkThrough(p);
    /* the bed: at eleven in the morning, a nap until the evening, and the night comes */
    await goTo(p, 'sign', 'Il letto');
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Pisolino fino a stasera');
    await talkThrough(p);
    r.keep('slept', await p.evaluate(() => localStorage.getItem('lotte-tra-amici:ora:v1')));
    await goTo(p, 'sign', 'Il letto');
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Dormo fino a domattina');
    await talkThrough(p);
    r.keep('woke', await p.evaluate(() => localStorage.getItem('lotte-tra-amici:ora:v1')));
    /* to the door mat, and out */
    await walk(p, (await p.evaluate(() => window.WORLD._debug.route(5, 6))) || []);
    await walk(p, ['down']);
    await p.clock.runFor(600);
    r.keep('out', await p.evaluate(() => window.WORLD._debug.pos().map));
    /* the scooter is parked by the gate: up on it, the creature behind; along the Appia it picks up speed */
    const parked = await p.evaluate(() => window.WORLD._debug.moto());
    await walk(p, (await p.evaluate(([x, y]) => window.WORLD._debug.route(x + 1, y), [parked.at.x, parked.at.y])) || []);
    await p.keyboard.down('ArrowLeft'); await p.keyboard.up('ArrowLeft'); await p.clock.runFor(200);
    await p.keyboard.press('Enter'); await p.clock.runFor(500);
    await talkThrough(p);
    r.keep('mounted', await p.evaluate(() => window.WORLD._debug.moto().sella));
    await r.shot('in-sella');
    await p.keyboard.down('ArrowDown'); await p.clock.runFor(700); await p.keyboard.up('ArrowDown'); await p.clock.runFor(300);
    const from = await p.evaluate(() => window.WORLD._debug.pos());
    await p.keyboard.down('ArrowLeft'); await p.clock.runFor(1500); await p.keyboard.up('ArrowLeft'); await p.clock.runFor(300);
    const to = await p.evaluate(() => window.WORLD._debug.pos());
    r.keep('rode', from.x - to.x);
    await r.shot('appia');
    /* Enter with nothing in front of him: off it, and it stays there */
    await p.keyboard.press('Enter'); await p.clock.runFor(500);
    r.keep('parked', await p.evaluate(() => { const m = window.WORLD._debug.moto(), q = window.WORLD._debug.pos(); return { sella: m.sella, far: Math.abs(m.at.x - q.x) + Math.abs(m.at.y - q.y) }; }));
    /* and after a reload it is still where he left it */
    await p.reload(); await goStory(p); await p.clock.runFor(1200);
    r.keep('kept', await p.evaluate(() => window.WORLD._debug.moto().at.x));
    r.keep('left at', to.x);
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('inside')).toBe('casa');
  expect(get('desk')).toContain('paper');
  expect(get('slept')).toBe('notte');
  expect(get('woke')).toBe('giorno');
  expect(get('out')).toBe('formia');
  expect(get('mounted')).toBe(true);
  /* a second and a half on a straight: at a walk it would be nine tiles */
  expect(get('rode') as number).toBeGreaterThan(13);
  expect(get('parked')).toEqual({ sella: false, far: 1 });
  expect(get('kept')).toBe(get('left at'));
});

/* the tour of Formia: the next stop is always in the corner, with an arrow, and in the menu */
test('the tour of Formia', async ({ browser }) => {
  const story = (extra: object) => ({ 'lotte-tra-amici:storia:v1': JSON.stringify({ v: 1, map: 'formia', x: 0, y: 0, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, seen: { intro: true }, found: {}, ...extra }) });
  const goal = async (r: Run) => {
    await goStory(r.page);
    await r.page.clock.runFor(1500);
    return (await r.page.locator('#wgoal').innerText()).replace(/\s+/g, ' ');
  };
  const first = await play(browser, 'tour-start', {}, async (r) => {
    await goStory(r.page);
    await until(r.page, () => window.WORLD._debug.pos().dialog);
    await talkThrough(r.page);
    r.keep('goal', (await r.page.locator('#wgoal').innerText()).replace(/\s+/g, ' '));
    /* the neighbour knows where to go next */
    await goTo(r.page, 'npc', 'vicina');
    await r.page.keyboard.press('Enter'); await r.page.clock.runFor(200);
    const said: string[] = [];
    for (let k = 0; k < 6 && await r.page.evaluate(() => window.WORLD._debug.pos().dialog); k++) {
      await r.page.clock.runFor(400);
      said.push(await r.page.evaluate(() => window.WORLD._debug.pos().text));
      await r.page.keyboard.press('Enter'); await r.page.clock.runFor(200);
    }
    r.keep('tip', said.join(' | '));
    await r.page.click('#wgoal'); await r.page.clock.runFor(300);
    r.keep('menu', await r.page.locator('.tour').innerText());
    await r.shot('menu', { fullPage: true });
  });
  const later = await play(browser, 'tour-later', { storage: story({ done: { padel: 1 }, beaten: { circolo: true, padel: true }, badges: ['peggio', 'calcolato'], squad: ['antonio'], seen: { intro: true, starter: true }, mons: [{ uid: 'c1', sp: 'ramarrino' }, { uid: 'c2', sp: 'riccetto' }] }) }, async (r) => {
    r.keep('goal', await goal(r));
    await r.page.keyboard.press('m'); await r.page.clock.runFor(300);
    r.keep('title', await r.page.locator('.pickrow h3', { hasText: 'Giro di Formia' }).innerText());
  });
  const get = (run: { data: { name: string; value: unknown }[] }, n: string) => String(run.data.find((x) => x.name === n)!.value);
  expect(get(first, 'goal')).toContain('La tua prima creatura');
  expect(get(first, 'tip')).toContain('guardaparco di Gianola');
  expect(get(first, 'menu')).toContain('La tua prima creatura');
  expect(get(first, 'menu')).toContain('???');
  expect(get(first, 'menu')).not.toContain('Sfida Forchetta');
  expect(get(later, 'goal')).toContain('Chi scava tra le rovine di Gianola?');
  /* the second creature is a stop too (R10), done with two */
  expect(get(later, 'title').toLowerCase()).toContain('4 su 24');
});

/* the creatures of Formia: the first one from the guardaparco, a wild one out of the rock pools fought, the team in
   the menu; then money spent on nets at Mola and one out of the tall grass caught */
test('creatures of Formia', async ({ browser }) => {
  const first = await play(browser, 'creatures', { seed: 5, gfx: 'bassa' }, async (r) => {
    const p = r.page;
    await goStory(p);
    await until(p, () => window.WORLD._debug.pos().dialog);
    await talkThrough(p);
    await talkTo(p, 'guardaparco');
    await choose(p, 'Fammeli vedere');
    await r.shot('starters');
    await p.click('.starter[data-sp="polpino"]'); await p.clock.runFor(300);
    await talkThrough(p);
    /* the guardaparco's grandson has taken the one that beats it: a "!" over his head, and he runs up to challenge */
    await p.clock.runFor(300);
    await r.shot('rival-spotted');
    await until(p, () => !!window.WORLD._debug.pos().dialog);
    await talkThrough(p);
    r.keep('rival', await p.locator('#wtxt').innerText());
    await r.shot('rival-talk');
    await choose(p, 'Sfida!');
    await p.clock.runFor(800);
    await fight(r, 'rival', 2);
    r.keep('rival-stamp', await p.evaluate(() => document.querySelector('.stamp')!.textContent));
    await p.click('#st-go'); await p.clock.runFor(800);
    await talkThrough(p, 20);
    /* beaten, he walks away */
    await p.clock.runFor(3000);
    r.keep('rival-gone', await p.evaluate(() => (window.WORLD.state() as { beaten: Record<string, boolean> }).beaten));
    await r.shot('rival-gone');
    /* a Riccetto jumps out of the rock pools of Gianola: with one creature, it goes straight in */
    await p.evaluate(() => window.WORLD._debug.meet('gianola')); await p.clock.runFor(300);
    await talkThrough(p);
    await r.shot('meet');
    await choose(p, 'Lotta!');
    await p.clock.runFor(800);
    await fight(r, 'wild', 2);
    r.keep('stamp', await p.evaluate(() => document.querySelector('.stamp')!.textContent));
    await p.click('#st-go'); await p.clock.runFor(800);
    await talkThrough(p, 20);
    /* a wild battle can go either way: lost, Antonio slips away */
    if (await p.locator('#wopts button', { hasText: 'Scappa' }).count()) { await choose(p, 'Scappa'); await talkThrough(p, 20); }
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await p.locator('.teams').scrollIntoViewIfNeeded();
    await r.shot('team');
    r.keep('team', await p.locator('.teams').innerText());
  });
  const sf = first.data.find((x) => x.name === 'state')!.value as { mons: { uid: string; sp: string }[]; lv: Record<string, { lv: number; xp: number }>; money: number };
  expect(sf.mons[0]).toMatchObject({ uid: 'c1', sp: 'polpino' });
  expect((sf.mons[0] as { bond?: number }).bond).toBeGreaterThan(40);
  expect(sf.lv.c1.lv > 5 || sf.lv.c1.xp > 0).toBe(true);
  expect(String(first.data.find((x) => x.name === 'team')!.value)).toContain('Polpino');
  /* the rival took the one that beats Polpino, said why, and lost to it */
  expect(String(first.data.find((x) => x.name === 'rival')!.value)).toContain('Gabbì');
  expect(first.data.find((x) => x.name === 'rival-stamp')!.value).toBe('Vince Polpino');
  expect(first.data.find((x) => x.name === 'rival-gone')!.value).toMatchObject({ 'tr-rivale-1': true });

  const save = { v: 1, map: 'formia', x: 0, y: 0, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, seen: { intro: true, starter: true }, found: {},
    mons: [{ uid: 'c1', sp: 'gabbi' }], lv: { c1: { lv: 12, xp: 0 } }, money: 120, bag: {} };
  const second = await play(browser, 'catch', { seed: 8, gfx: 'bassa', storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkTo(p, 'pescatore');
    await choose(p, 'Compra');
    for (let k = 0; k < 3; k++) { await p.click('[data-it="retino2"]'); await p.clock.runFor(200); }
    await r.shot('shop');
    await p.click('#shop-x'); await p.clock.runFor(200);
    await p.evaluate(() => window.WORLD._debug.meet('gramsci')); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Lotta!');
    await p.clock.runFor(800);
    for (let turn = 0; turn < 12; turn++) {
      await toPrompt(p);
      if (await battleOver(p)) break;
      /* Gabbì is down and only Antonio is left: he slips away */
      if (await p.locator('#overlay.bench').count()) { await p.click('#bn-no'); await p.clock.runFor(300); continue; }
      const net = p.locator('#pad .mv[data-id="retino2"]:not([disabled])');
      if (await net.count()) await net.click(); else await p.click('#pad .mv[data-id="' + await p.evaluate(() => window.UI._debug.suggest()) + '"]');
    }
    await p.clock.runFor(600);
    await r.shot('caught');
    r.keep('stamp', await p.evaluate(() => document.querySelector('.stamp')!.textContent));
    await p.click('#st-go'); await p.clock.runFor(800);
    await talkThrough(p, 20);
    /* the one caught walks behind Antonio from now on */
    await p.keyboard.press('m'); await p.clock.runFor(300);
    if (await p.locator('[data-cr="c2"]').count()) {
      await p.click('[data-cr="c2"]'); await p.clock.runFor(300);
      await r.shot('creature');
      await p.fill('#cr-nick', 'Cri'); await p.click('#cr-f .btn'); await p.clock.runFor(300);
      await p.click('#cr-lead'); await p.clock.runFor(300);
    }
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const sc = second.data.find((x) => x.name === 'state')!.value as { mons: { uid: string; sp: string }[]; money: number; bag: Record<string, number>; lead?: string };
  expect(sc.money).toBeLessThan(120);
  expect(sc.bag.retino2).toBeLessThan(3);
  if (second.data.find((x) => x.name === 'stamp')!.value === 'Preso!') { expect(sc.mons[0].sp).toBe('gabbi'); expect(sc.mons[1].sp).toMatch(/^(cicalina|olivella)$/); expect(sc.lead).toBe('c2'); expect((sc.mons[1] as { nick?: string }).nick).toBe('Cri'); }
  else expect(sc.mons.length).toBe(1);
});

/* a trainer: the animatore of the oratorio sends in his two creatures one after the other */
test('a trainer of Formia', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 0, y: 0, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, seen: { intro: true, starter: true }, found: {},
    mons: [{ uid: 'c1', sp: 'polpastro' }], lv: { c1: { lv: 30, xp: 0 } }, money: 0, bag: {} };
  const r = await play(browser, 'trainer', { seed: 12, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkTo(p, 'animatore');
    await choose(p, 'Sfida!');
    await p.clock.runFor(800);
    /* his two creatures, in one battle */
    await fight(r, 'duel', 1);
    await p.click('#st-go'); await p.clock.runFor(800);
    await talkThrough(p, 20);
    await p.clock.runFor(800);
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const st = r.data.find((x) => x.name === 'state')!.value as { beaten: Record<string, boolean>; money: number };
  expect(st.beaten['tr-animatore']).toBe(true);
  expect(st.money).toBe(25);
});

/* a change: Polpino comes off for Ramarrino, by the button on the pad; when the trainer's second creature is coming the
   player may change again; both creatures get their share, and the trainer pays once */
test('changing creature in a battle', async ({ browser }) => {
  const r = await play(browser, 'change', { seed: 11, reduced: false, storage: inTown({ mons: [{ uid: 'c1', sp: 'polpino' }, { uid: 'c2', sp: 'ramarrino' }], lv: { c1: { lv: 11, xp: 0 }, c2: { lv: 11, xp: 0 } }, money: 0 }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    await talkTo(p, 'animatore');
    await choose(p, 'Sfida!');
    await p.clock.runFor(300);
    await p.locator('.pick[data-key="c1"]').click({ timeout: 5000 });
    await p.clock.runFor(800);
    await toPrompt(p);
    await r.shot('pad');
    r.keep('dots', await p.locator('#dots-0 i').count());
    /* a look at the bench, and back to the pad: nothing has happened */
    await p.click('#sw-btn');
    await r.shot('bench');
    r.keep('sheet', await p.locator('#overlay .sheet').innerText());
    await p.click('#bn-no');
    expect(await p.locator('#overlay').isHidden()).toBe(true);
    await p.click('#sw-btn');
    await p.locator('.bench-pick:not([disabled])').first().click();
    await p.clock.runFor(100);
    await toPrompt(p);
    await r.shot('changed');
    r.keep('box', await p.locator('#box-0 .box-h b').innerText());
    r.keep('art', await p.evaluate(() => !!document.querySelector('#m-0 .bob svg')));
    /* the first of his goes down: "he is about to send in…", and a change is on offer before it comes in */
    await fight(r, 'on', 0);
    r.keep('stamp', await p.evaluate(() => document.querySelector('.stamp')!.textContent));
    await p.click('#st-go'); await p.clock.runFor(800);
    await talkThrough(p, 30);
    await p.clock.runFor(800);
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('dots')).toBe(2);
  expect(String(get('sheet'))).toContain('Ramarrino');
  expect(String(get('sheet'))).toContain('costa il turno');
  expect(String(get('box'))).toContain('Ramarrino');
  expect(get('art')).toBe(true);
  const st = get('state') as { beaten: Record<string, boolean>; money: number; lv: Record<string, { lv: number; xp: number }>; dex: Record<string, number> };
  expect(st.beaten['tr-animatore']).toBe(true);
  expect(st.money).toBe(25);                                                /* paid once, by the trainer */
  expect(st.lv.c1.lv > 11 || st.lv.c1.xp > 0).toBe(true);                    /* Polpino fought too */
  expect(st.lv.c2.lv > 11 || st.lv.c2.xp > 0).toBe(true);
  expect(st.dex.olivella).toBeGreaterThan(0);                               /* every creature of his has been seen */
  expect(st.dex.cicalina).toBeGreaterThan(0);
});

/* the passives through the screen: an ability says its name as a Cicalina comes on, a thing goes from the bag to a
   creature in its sheet, and a whole battle against the guide of the museum, whose creatures bring states, runs clean */
test('abilities, states and things to carry', async ({ browser }) => {
  const r = await play(browser, 'passives', { seed: 21, reduced: false, storage: inTown({ mons: [{ uid: 'c1', sp: 'polpastro' }, { uid: 'c2', sp: 'muraglione' }], lv: { c1: { lv: 40, xp: 0 }, c2: { lv: 40, xp: 0 } }, bag: { cozza: 1 }, money: 0 }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    /* the sheet says the ability, and takes the thing */
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await p.click('[data-cr="c1"]'); await p.clock.runFor(300);
    await p.locator('[data-held="cozza"]').scrollIntoViewIfNeeded();
    await r.shot('sheet');
    r.keep('sheet', await p.locator('#overlay .sheet').innerText());
    await p.click('[data-held="cozza"]'); await p.clock.runFor(300);
    r.keep('given', await p.evaluate(() => window.WORLD.state()));
    await p.click('#cr-x'); await p.clock.runFor(300);
    await p.keyboard.press('Escape'); await p.clock.runFor(300);
    /* a Cicalina out of the grass: Frinire d'agosto, by its side, as it comes on */
    await p.evaluate(() => window.WORLD._debug.meet('gramsci')); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Lotta!');
    await p.clock.runFor(300);
    await p.locator('.pick[data-key="c1"]').click({ timeout: 5000 });
    await until(p, () => !!document.querySelector('.abil-pop'), 60_000, 50);
    r.keep('pop', await p.evaluate(() => document.querySelector('.abil-pop')!.textContent));
    await p.clock.runFor(300);
    r.shots.push({ name: 'ability', png: await p.screenshot() });          /* mid-show: r.shot would finish the animation */
    await p.click('#quit'); await p.click('#quit'); await p.clock.runFor(800);
    await talkThrough(p);
    await talkTo(p, 'guida');
    await choose(p, 'Sfida!');
    await p.clock.runFor(300);
    await p.locator('.pick[data-key="c1"]').click({ timeout: 5000 });
    await p.clock.runFor(800);
    await fight(r, 'guide', 2);
    r.keep('stamp', await p.evaluate(() => document.querySelector('.stamp')!.textContent));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('pop')).toBe('Frinire d\'agosto');
  expect(String(get('sheet'))).toContain('Ventose');
  expect(String(get('sheet'))).toContain('Oratoria');
  expect(String(get('sheet'))).toContain('Cozza');
  const st = get('given') as { mons: { item?: string }[]; bag: Record<string, number> };
  expect(st.mons[0].item).toBe('cozza');
  expect(st.bag.cozza).toBe(0);
  expect(String(get('stamp'))).toContain('Vince');
});

/* a trainer not beaten yet sees Antonio step in front of him: a "!", he walks up, challenges him with no saying
   later, and once beaten walks back to his place */
test('a trainer who sees Antonio', async ({ browser }) => {
  const r = await play(browser, 'spotted', { seed: 14, reduced: false, spot: true, storage: inTown({ x: 131, y: 58, dir: 'up', mons: [{ uid: 'c1', sp: 'polpastro' }], lv: { c1: { lv: 30, xp: 0 } },
    seen: { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, formia7: true, formia8: true, 'cic-trainer': true, 'cap-trama-scavi': true } }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    r.keep('before', await p.evaluate(() => window.WORLD._debug.who('studente')));
    /* one step up the street, into the student's sight */
    await p.keyboard.down('ArrowUp'); await p.keyboard.up('ArrowUp'); await p.clock.runFor(400);
    await r.shot('alert');
    await until(p, () => !!window.WORLD._debug.pos().dialog);
    r.keep('came', await p.evaluate(() => window.WORLD._debug.who('studente')));
    await talkThrough(p);
    await r.shot('challenge');
    r.keep('opts', await p.locator('#wopts button').allInnerTexts());
    await choose(p, 'Sfida!');
    await p.clock.runFor(800);
    await fight(r, 'duel', 0);
    await p.click('#st-go'); await p.clock.runFor(800);
    await talkThrough(p, 20);
    await p.clock.runFor(3300);
    r.keep('after', await p.evaluate(() => window.WORLD._debug.who('studente')));
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const at = (n: string) => r.data.find((x) => x.name === n)!.value as { x: number; y: number; dir: string };
  const st = r.data.find((x) => x.name === 'state')!.value as { beaten: Record<string, boolean>; x: number; y: number };
  /* he came down the street to the tile in front of Antonio, and went back */
  expect(at('came')).toMatchObject({ x: at('before').x, y: st.y - 1, dir: 'down' });
  expect(at('after')).toEqual(at('before'));
  expect(r.data.find((x) => x.name === 'opts')!.value).toEqual(['Sfida!']);
  expect(st.beaten['tr-studente']).toBe(true);
});

/* a trainer far stronger than the player's team only looks at him: no challenge on sight, a word from Cicero instead,
   and the challenge is still there talking to him. In the battle, the sheet lists the moves the creature knows */
test('a trainer too strong to challenge on sight', async ({ browser }) => {
  const r = await play(browser, 'not-spotted', { seed: 14, reduced: false, spot: true, storage: inTown({ x: 131, y: 58, dir: 'up', mons: [{ uid: 'c1', sp: 'polpetto' }], lv: { c1: { lv: 6, xp: 0 } },
    seen: { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, formia7: true, formia8: true, 'cic-trainer': true, 'cap-trama-scavi': true, 'cap-starter': true, 'cap-seconda-creatura': true, 'cic-power': true } }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    r.keep('before', await p.evaluate(() => window.WORLD._debug.who('studente')));
    await p.keyboard.down('ArrowUp'); await p.keyboard.up('ArrowUp'); await p.clock.runFor(2500);
    r.keep('dialog', await p.evaluate(() => !!window.WORLD._debug.pos().dialog));
    r.keep('said', await p.locator('#wcic-say').innerText());
    r.keep('stayed', await p.evaluate(() => window.WORLD._debug.who('studente')));
    /* talking to him, the challenge is there */
    const him = r.data.find((x) => x.name === 'before')!.value as { y: number };
    for (let k = 0; k < 6 && (await p.evaluate(() => window.WORLD._debug.pos().y)) > him.y + 1; k++) { await p.keyboard.down('ArrowUp'); await p.keyboard.up('ArrowUp'); await p.clock.runFor(400); }
    await p.keyboard.press('Enter'); await p.clock.runFor(400);
    await talkThrough(p);
    await choose(p, 'Sfida!');
    await p.clock.runFor(800);
    await toPrompt(p);
    r.keep('pad', await p.locator('#pad .mv[data-k]:not([hidden])').count());
    await p.click('#info'); await p.clock.runFor(300);
    r.keep('sheet', await p.locator('#overlay .card').first().locator('.moves-list li').count());
  });
  const v = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(v('dialog')).toBe(false);
  expect(v('said')).toMatch(/ha lasciato perdere/);
  expect(v('stayed')).toEqual(v('before'));
  expect(v('sheet')).toBe(v('pad'));
  expect(v('pad') as number).toBeLessThanOrEqual(4);
});

/* the speed of a battle (ui/speed.ts): in Veloce a turn, from the move to the next choice, stays under 2.5 seconds of
   the game's clock, with the animations on; the same turn at Normale takes longer */
for (const vel of ['normale', 'veloce'] as const) {
  test('a turn at speed ' + vel, async ({ browser }) => {
    const r = await play(browser, 'speed-' + vel, { seed: 21, reduced: false, storage: { ...inTown({ x: 131, y: 58, dir: 'up', mons: [{ uid: 'c1', sp: 'polpetto' }], lv: { c1: { lv: 12, xp: 0 } },
      seen: { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, formia7: true, formia8: true, 'cic-wild': true, 'cic-power': true, 'cap-trama-scavi': true } }), 'lotte-tra-amici:velocita:v1': vel } }, async (r) => {
      const p = r.page;
      await goStory(p); await p.clock.runFor(1500);
      await p.evaluate(() => window.WORLD._debug.wild('cicalina', 9)); await p.clock.runFor(300);
      await talkThrough(p);
      await choose(p, 'Lotta!');
      await p.clock.runFor(300);
      if (await p.locator('.pick[data-key="c1"]').count()) await p.locator('.pick[data-key="c1"]').click();
      await toPrompt(p);
      r.keep('button', await p.locator('.spd').innerText());
      const turns: number[] = [];
      for (let t = 0; t < 2; t++) {
        const id = await p.evaluate(() => window.UI._debug.suggest());
        await p.locator('#pad .mv[data-id="' + id + '"]').click();
        let ms = 0;
        const seen: string[] = [];
        for (; ms < 20000; ms += 50) {
          await p.clock.runFor(50);
          const tx = await p.evaluate(() => (document.querySelector('#battle .dialog') as HTMLElement | null)?.innerText || '');
          if (process.env.SPEEDLOG && seen[seen.length - 1] !== tx) { seen.push(tx); console.log(vel, t, ms, tx.slice(0, 70).replace(/\n/g, ' ')); }
          if (await p.evaluate(() => { const ov = document.getElementById('overlay')!; return !ov.hidden || !document.getElementById('pad')!.classList.contains('off'); })) break;
        }
        turns.push(ms);
        if (await battleOver(p)) break;
      }
      r.keep('turns', turns);
    });
    const turns = r.data.find((x) => x.name === 'turns')!.value as number[];
    expect(r.data.find((x) => x.name === 'button')!.value).toBe(vel === 'veloce' ? 'Veloce' : 'Normale');
    /* the first turn is two moves and a line: under 2.5 s in Veloce, more than twice that at Normale */
    if (vel === 'veloce') expect(turns[0]).toBeLessThan(2500);
    else expect(turns[0]).toBeGreaterThan(5000);
  });
}

/* R17: a click on the map walks there; a click on someone walks next to him and talks */
/* he starts beside the student's column, out of his sight: the student is a trainer and would walk up to him */
test('walking with a click', async ({ browser }) => {
  const r = await play(browser, 'click', { seed: 3, reduced: false, storage: inTown({ x: 134, y: 56, dir: 'down', mons: [{ uid: 'c1', sp: 'polpetto' }], lv: { c1: { lv: 12, xp: 0 } },
    seen: { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, formia7: true, formia8: true, 'cic-power': true, 'cap-trama-scavi': true } }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    type W = { WORLD: { _debug: { route(x: number, y: number): string[] | null; screenOf(x: number, y: number): [number, number]; pos(): { x: number; y: number; dialog: boolean } } } };
    const to = await p.evaluate(() => {
      const d = (window as unknown as W).WORLD._debug;
      for (const [dx, dy] of [[3, 0], [-3, 0], [0, 3], [0, -3], [2, 2], [-2, 2]]) { const x = 134 + dx, y = 56 + dy, rt = d.route(x, y); if (rt && rt.length >= 3 && rt.length <= 6) return { x, y }; }
      return null;
    });
    r.keep('to', to);
    const at = await p.evaluate(([x, y]) => (window as unknown as W).WORLD._debug.screenOf(x, y), [to!.x, to!.y]);
    await p.mouse.click(at[0], at[1]);
    await p.clock.runFor(4000);
    r.keep('walked', await p.evaluate(() => { const q = (window as unknown as W).WORLD._debug.pos(); return { x: q.x, y: q.y }; }));
    const him = await p.evaluate(() => window.WORLD._debug.who('studente'));
    const there = await p.evaluate(([x, y]) => (window as unknown as W).WORLD._debug.screenOf(x, y), [him!.x, him!.y]);
    await p.mouse.click(there[0], there[1]);
    await p.clock.runFor(8000);
    r.keep('talking', await p.evaluate(() => (window as unknown as W).WORLD._debug.pos().dialog));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('walked')).toEqual(get('to'));
  expect(get('talking')).toBe(true);
});

/* the menu: two teams of six, the people and the creatures; Antonio's abilities, a tree of three branches where each
   ability opens with a point in the one before it */
test('the two teams and Antonio\'s abilities', async ({ browser }) => {
  const r = await play(browser, 'teams', { seed: 15, reduced: false, storage: inTown({ squad: ['antonio', 'forchetta'], mons: [{ uid: 'c1', sp: 'polpetto' }, { uid: 'c2', sp: 'cicalina' }],
    lv: { antonio: { lv: 9, xp: 0 }, forchetta: { lv: 8, xp: 0 }, c1: { lv: 15, xp: 0 }, c2: { lv: 9, xp: 0 } }, skills: { svelto: 1 } }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await r.shot('teams');
    r.keep('teams', await p.locator('.teams').innerText());
    r.keep('slots', await p.evaluate(() => Array.from(document.querySelectorAll('.party .slots')).map((s) => [s.querySelectorAll('i.on').length, s.querySelectorAll('i').length])));
    await p.click('[data-skills]'); await p.clock.runFor(300);
    await r.shot('skills');
    /* the ability after Gambe da Mennea is open: a grade of it; the one after Allenatore is still closed */
    await p.click('[data-skn="passo"]'); await p.click('[data-sk="passo"]'); await p.clock.runFor(600);
    await r.shot('skills-took');
    await p.click('[data-skn="mano"]'); await p.clock.runFor(200);
    r.keep('closed', await p.locator('[data-sk="mano"]').evaluate((b) => [(b as HTMLButtonElement).disabled, b.textContent]));
    await r.shot('skills-closed');
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  /* who is played, alone (nobody joins any more), and his creatures in their six places */
  expect(String(get('teams'))).toContain('scende in campo per ultimo');
  expect(String(get('teams'))).not.toContain('Forchetta');
  expect(String(get('teams'))).toContain('Le creature');
  expect(get('slots')).toEqual([[2, 6]]);
  expect(get('closed')).toEqual([true, 'Chiusa']);
  expect((get('state') as { skills: Record<string, number> }).skills).toEqual({ svelto: 1, passo: 1 });
});

/* the plot: the lady of the theatre's riddle gives the stone of the walls, Cicero's three questions at his tomb the
   stone of the voice; then Mamurra is waiting at his villa */
test('the stones of Telepilo', async ({ browser }) => {
  /* long as activities: the riddle, the three questions and two battles, about four minutes on Bassa without a graphics card */
  test.slow();
  const save = { v: 1, map: 'formia', x: 0, y: 0, dir: 'down', badges: [], squad: ['antonio'], beaten: { 'tr-mamurr-scavi': true, 'tr-mamurr-cisterna': true }, found: {},
    seen: { intro: true, starter: true, 'trama-archivio': true, 'pietra-mare': true, 'cap-starter': true }, mons: [{ uid: 'c1', sp: 'ramarrone' }], lv: { c1: { lv: 20, xp: 0 } }, money: 0, bag: {} };
  const r = await play(browser, 'plot', { seed: 14, gfx: 'bassa', storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkTo(p, 'teatro');
    await r.shot('riddle');
    await choose(p, 'Dodici');
    await talkThrough(p);
    /* the word opens the door of the Cisternone: down the stairs, by the sign in front of it */
    r.keep('no-stone-yet', await p.evaluate(() => (window.WORLD.state() as { seen: Record<string, boolean> }).seen['pietra-mura'] || false));
    await goTo(p, 'sign', 'Il Cisternone romano');
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Scendi nel Cisternone');
    await p.clock.runFor(500);
    r.keep('inside', await p.evaluate(() => window.WORLD._debug.pos().map));
    await r.shot('cisterna-in');
    /* the validator's own way through, walked key by key: what it proved is what the game does */
    const way = await p.evaluate(() => window.WORLD._debug.way());
    r.keep('way', way.length);
    for (let k = 0; k < way.length; k++) {
      await walk(p, [way[k]]);
      if (k === Math.floor(way.length / 2)) await r.shot('cisterna-mid');
      /* the bats of the dark: he slips away */
      if ((await p.evaluate(() => window.WORLD._debug.pos())).dialog) { await talkThrough(p); await choose(p, 'Scappa'); await talkThrough(p); }
    }
    await r.shot('cisterna-end');
    r.keep('place', await p.evaluate(() => (window.WORLD.state() as { places: Record<string, { flags: Record<string, boolean> }> }).places.cisterna.flags));
    await goTo(p, 'sign', 'Pietra delle Mura');
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    r.keep('stone', await p.locator('.award h2').innerText());
    await p.click('#st-ok'); await p.clock.runFor(300);
    await talkThrough(p);
    /* the tomb is at the far west of the big map: start from the Appia below it, not from home */
    await p.evaluate(() => window.WORLD._debug.travel('formia', 30, 92, 'left')); await p.clock.runFor(500);
    await goTo(p, 'sign', 'Tomba di Cicerone');
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    await talkThrough(p);
    for (const a of ['Nel 43 avanti Cristo', 'Mola e Castellone', 'Sant\'Erasmo']) { await choose(p, a); await talkThrough(p); }
    await p.clock.runFor(300);
    await r.shot('voice');
    await p.click('#st-ok'); await p.clock.runFor(300);
    await talkThrough(p);
    await p.keyboard.press('m'); await p.clock.runFor(300);
    r.keep('menu', await p.locator('.pickrow', { hasText: 'Pietre di Telepilo' }).innerText());
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('no-stone-yet')).toBe(false);
  expect(get('inside')).toBe('cisterna');
  expect(get('way')).toBeGreaterThan(20);
  expect(get('place')).toEqual({ a: true, b: true, c: true });
  expect(String(get('stone'))).toContain('Pietra delle Mura');
  expect(String(get('menu')).toLowerCase()).toContain('3 su 3');
  const st = get('state') as { seen: Record<string, boolean> };
  expect(st.seen['pietra-mura']).toBe(true);
  expect(st.seen['pietra-voce']).toBe(true);
});

/* a legend: the riddle of the niches, the walk under the walls with the validator's own way, the fight in three parts, and
   the net that holds only at the end */
test('Lamo, in three parts', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 89, y: 63, dir: 'up', badges: [], squad: ['antonio'], beaten: { 'tr-mamurra': true }, found: {},
    seen: { intro: true, starter: true, 'cap-starter': true, 'trama-archivio': true, 'pietra-mura': true, 'pietra-mare': true, 'pietra-voce': true, 'cic-lamo': true, 'sc-pietre-sigillo': true },
    mons: [{ uid: 'c1', sp: 'gabbiammiraglio' }, { uid: 'c2', sp: 'muraglione' }], lv: { c1: { lv: 60, xp: 0 }, c2: { lv: 60, xp: 0 } }, money: 0, bag: { oro: 6 } };
  const r = await play(browser, 'legend', { seed: 21, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save), 'lotte-tra-amici:ora:v1': 'notte' } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkThrough(p);
    await r.shot('niches');
    await talkTo(p, 'selv-lamo');
    /* a wrong stone falls back out, and nothing is lost */
    await choose(p, 'Pietra della Voce');
    r.keep('wrong', await p.evaluate(() => window.WORLD._debug.pos().text));
    await talkThrough(p);
    await choose(p, 'Pietra delle Mura');
    await choose(p, 'Pietra del Mare');
    await talkThrough(p);
    await r.shot('opens');
    await choose(p, 'Scendi');
    await p.clock.runFor(500);
    r.keep('inside', await p.evaluate(() => window.WORLD._debug.pos().map));
    await r.shot('walk-in');
    const way = await p.evaluate(() => window.WORLD._debug.way());
    r.keep('way', way.length);
    for (let k = 0; k < way.length; k++) { await walk(p, [way[k]]); if (k === 8) await r.shot('walk-mid'); }
    r.keep('walked', await p.evaluate(() => window.WORLD._debug.pos()));
    await r.shot('walk-end');
    await p.keyboard.press('Enter'); await p.clock.runFor(200);
    await talkThrough(p);
    await r.shot('meet');
    await choose(p, 'Lotta!');
    await p.locator('.pick[data-key="c1"]').click({ timeout: 5000 });
    const parts: string[] = [], nets: boolean[] = [];
    for (let turn = 0; turn < 80; turn++) {
      await toPrompt(p);
      if (await battleOver(p)) break;
      if (await p.evaluate(() => !document.getElementById('overlay')!.hidden)) { await p.locator('.bench-pick:not([disabled])').first().click({ timeout: 5000 }); continue; }
      const part = await p.locator('#chips-1 .chip', { hasText: 'Parte' }).innerText(), net = p.locator('#pad .mv.bag[data-id="oro"]');
      if (parts.indexOf(part) < 0) { parts.push(part); nets.push(await net.isDisabled()); await r.shot('part-' + parts.length); }
      if (!await net.isDisabled()) { await net.click(); continue; }
      const id = await p.evaluate(() => window.UI._debug.suggest());
      await p.locator('#pad .mv[data-id="' + id + '"]:not([disabled])').click({ timeout: 5000 });
    }
    r.keep('parts', parts); r.keep('nets', nets);
    await r.shot('end');
    await p.click('#st-go'); await p.clock.runFor(500);
    await talkThrough(p);
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(String(get('wrong'))).toContain('scivola fuori');
  expect(get('inside')).toBe('telepilo');
  expect(get('way')).toBeGreaterThan(14);
  expect((get('walked') as { map: string; y: number }).y, 'next to him, no boulder in the way').toBe(2);
  expect(get('parts')).toEqual(['Parte 1 di 3', 'Parte 2 di 3', 'Parte 3 di 3']);
  expect(get('nets'), 'the net waits for the last part').toEqual([true, true, false]);
  const st = get('state') as { seen: Record<string, boolean>; dex: Record<string, number>; mons: { sp: string }[] };
  expect(st.seen['enigma-lamo']).toBe(true);
  expect(st.dex.lamo).toBe(2);
  expect(st.mons.map((m) => m.sp)).toContain('lamo');
});

/* the magic of a place, and what a creature with a bond can do with it: the dots, the button, the choice taken back, the
   show, and a creature that has taken the type of the place */
test('the magic of a place, and Risonanza', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, found: {}, seen: { intro: true, starter: true, 'cap-starter': true, 'dono-retini': true },
    mons: [{ uid: 'c1', sp: 'ramarrino', bond: 70 }, { uid: 'c2', sp: 'polpino', bond: 20 }], lv: { c1: { lv: 12, xp: 0 }, c2: { lv: 12, xp: 0 } }, money: 0, bag: {} };
  const r = await play(browser, 'surge', { seed: 31, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkThrough(p);
    await p.evaluate(() => window.WORLD._debug.wild('cicalina', 12)); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Lotta!');
    await p.locator('.pick[data-key="c1"]').click({ timeout: 5000 });
    await toPrompt(p);
    r.keep('turn', await p.locator('#turn-t').innerText());
    r.keep('dots', await p.locator('#sg-0 i').count());
    r.keep('no-button', await p.locator('#res-btn').count());
    await p.evaluate(() => (window.UI._debug as unknown as { surge(n: number): void }).surge(3));
    r.keep('full', await p.locator('#sg-0 i.on').count());
    await r.shot('ready');
    /* pressed and taken back: nothing happens */
    await p.click('#res-btn');
    r.keep('armed', await p.locator('#res-btn').getAttribute('aria-pressed'));
    await p.click('#res-btn');
    r.keep('back', await p.locator('#res-btn').getAttribute('aria-pressed'));
    await p.keyboard.press('r');
    await r.shot('armed');
    await p.locator('#pad .mv[data-k]:not([disabled]):not([hidden])').first().click({ timeout: 5000 });
    await toPrompt(p);
    r.keep('types', await p.locator('#ty-0 .type').allInnerTexts());
    r.keep('gone', await p.locator('#res-btn').count());
    await r.shot('after');
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(String(get('turn'))).toMatch(/^Turno 1 · \w+ \+10%$/);
  expect(get('dots')).toBe(3);
  expect(get('no-button')).toBe(0);
  expect(get('full')).toBe(3);
  expect(get('armed')).toBe('true');
  expect(get('back')).toBe('false');
  expect((get('types') as string[]).length, 'it has taken the type of the place').toBe(2);
  expect(get('gone'), 'once in a battle').toBe(0);
});

/* the choices of the story, in the game: the stones after Mamurra, and what they do from there on */
test('keeping the stones', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, found: {},
    seen: { 'cic-change': true,  intro: true, starter: true, 'cap-starter': true, 'dono-retini': true, 'trama-archivio': true, 'pietra-mura': true, 'pietra-mare': true, 'pietra-voce': true, 'sc-tullio1-amico': true, 'sc-tullio2-amico': true },
    mons: [{ uid: 'c1', sp: 'gabbiammiraglio', bond: 70 }, { uid: 'c2', sp: 'muraglione', bond: 70 }], lv: { c1: { lv: 60, xp: 0 }, c2: { lv: 60, xp: 0 } }, money: 0, bag: {} };
  const r = await play(browser, 'stones-kept', { seed: 12, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkThrough(p);
    const m = await p.evaluate(() => window.WORLD._debug.who('mamurra'));
    await p.evaluate(([x, y]) => window.WORLD._debug.travel('formia', x, y, 'up'), [m!.x, m!.y + 1]); await p.clock.runFor(500);
    await talkTo(p, 'mamurra');
    r.keep('column', await p.evaluate(() => window.WORLD._debug.pos().text));
    await choose(p, 'Sfida!');
    await p.locator('.pick[data-key="c1"]').click({ timeout: 5000 });
    await toPrompt(p);
    r.keep('ricchezza', await p.locator('#chips-1 .chip', { hasText: 'Ricchezza' }).innerText());
    await fight(r, 'mamurra', 0);
    for (let k = 0; k < 6 && !await battleOver(p); k++) await fight(r, 'mamurra', 0);
    await p.click('#st-go'); await p.clock.runFor(500);
    await talkThrough(p, 40);
    await r.shot('stones');
    r.keep('asked', await p.evaluate(() => window.WORLD._debug.pos().text));
    await choose(p, 'Le tengo io');
    await talkThrough(p);
    /* from now on they warm the bag: a point of Slancio to start with */
    await p.evaluate(() => window.WORLD._debug.wild('cicalina', 12)); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Lotta!');
    await p.locator('.pick[data-key="c1"]').click({ timeout: 5000 });
    await toPrompt(p);
    r.keep('slancio', await p.locator('#sg-0 i.on').count());
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(String(get('ricchezza')), 'Tullio, a friend, has cracked it').toContain('2/2');
  expect(String(get('asked'))).toContain('l\'esame');
  expect(get('slancio')).toBe(1);
  const st = get('state') as { seen: Record<string, boolean> };
  expect(st.seen['sc-pietre-tenute']).toBe(true);
});

/* a legend on its knees: what becomes of it is up to the player. Here the most ridiculous of the ways: three tielle */
test('Lamo on his knees: a pact for three tielle', async ({ browser }) => {
  const save = { v: 1, map: 'telepilo', x: 9, y: 2, dir: 'up', badges: [], squad: ['antonio'], beaten: { 'tr-mamurra': true }, found: {},
    seen: { intro: true, starter: true, 'cap-starter': true, 'dono-retini': true, 'pietra-mura': true, 'pietra-mare': true, 'pietra-voce': true, 'cic-lamo': true, 'cic-legend': true, 'sc-pietre-sigillo': true, 'enigma-lamo': true },
    mons: [{ uid: 'c1', sp: 'gabbiammiraglio' }, { uid: 'c2', sp: 'muraglione' }], lv: { c1: { lv: 70, xp: 0 }, c2: { lv: 70, xp: 0 } }, money: 0, bag: { tiella: 2 } };
  const r = await play(browser, 'pact', { seed: 13, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save), 'lotte-tra-amici:ora:v1': 'notte' } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkThrough(p);
    await p.keyboard.press('Enter'); await p.clock.runFor(200);
    await talkThrough(p);
    await choose(p, 'Lotta!');
    await p.locator('.pick[data-key="c1"]').click({ timeout: 5000 });
    for (let t = 0; t < 80; t++) {
      await toPrompt(p);
      if (await battleOver(p)) break;
      if (await p.evaluate(() => !document.getElementById('overlay')!.hidden)) { await p.locator('.bench-pick:not([disabled])').first().click({ timeout: 5000 }); continue; }
      /* the moves only: the tielle in the bag are for him */
      const id = await p.evaluate(() => window.UI._debug.suggest()), move = p.locator('#pad .mv[data-k][data-id="' + id + '"]:not([disabled])');
      if (await move.count()) await move.click({ timeout: 5000 }); else await p.locator('#pad .mv.atk[data-k]:not([disabled])').first().click({ timeout: 5000 });
    }
    await p.click('#st-go'); await p.clock.runFor(500);
    for (let k = 0; k < 30 && !(await p.evaluate(() => window.WORLD._debug.pos().opts)); k++) { await p.keyboard.press('Enter'); await p.clock.runFor(300); }
    await r.shot('knees');
    r.keep('still-there', await p.evaluate(() => window.WORLD._debug.who('selv-lamo')));
    r.keep('no-net', await p.locator('#wopts button').allInnerTexts());
    await choose(p, 'Facciamo un patto');
    await talkThrough(p);
    /* he stays there, hungry; two tielle are not three */
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    r.keep('hungry', await p.evaluate(() => window.WORLD._debug.pos().text));
    await talkThrough(p);
    /* a third one from the oven of Castellone, and back */
    await p.evaluate(() => { const k = 'lotte-tra-amici:storia:v1', v = JSON.parse(localStorage.getItem(k)!); v.bag.tiella = 3; localStorage.setItem(k, JSON.stringify(v)); });
    await p.reload(); await p.clock.runFor(1500);
    await goStory(p); await p.clock.runFor(1500);
    await talkThrough(p);
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Dagli le tre tielle');
    await talkThrough(p, 20);
    await r.shot('fed');
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('no-net')).toEqual(['Facciamo un patto', 'Torna a dormire']);
  expect(get('still-there'), 'he is there, on his knees, while the player decides').toBeTruthy();
  expect(String(get('hungry'))).toContain('TRE TIELLE');
  const st = get('state') as { seen: Record<string, boolean>; dex: Record<string, number>; bag: Record<string, number>; mons: { sp: string; bond: number }[] };
  expect(st.seen['sc-lamo-amico']).toBe(true);
  expect(st.dex.lamo).toBe(2);
  expect(st.bag.tiella).toBe(0);
  expect(st.mons.filter((m) => m.sp === 'lamo')[0].bond, 'he comes with all his heart').toBe(100);
});

/* a question left without an answer is not lost: Mamurra is gone, but he asks again as soon as the player is back */
test('a question left unanswered', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['antonio'], beaten: { 'tr-mamurra': true }, found: {},
    seen: { intro: true, starter: true, 'cap-starter': true, 'dono-retini': true, 'cic-lamo': true }, mons: [{ uid: 'c1', sp: 'cicalina', bond: 20 }], lv: { c1: { lv: 20, xp: 0 } }, money: 0, bag: {} };
  const r = await play(browser, 'pending', { seed: 15, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkThrough(p, 20);
    r.keep('asked', await p.locator('#wopts button').allInnerTexts());
    await choose(p, 'Le tengo io');
    await talkThrough(p, 20);
    r.keep('after', await p.evaluate(() => window.WORLD._debug.pos()));
    /* with them in the bag, even a creature that hardly knows Antonio can do it */
    await p.evaluate(() => window.WORLD._debug.wild('cicalina', 12)); await p.clock.runFor(300);
    await talkThrough(p);
    await choose(p, 'Lotta!');
    await toPrompt(p);
    r.keep('dots', await p.locator('#sg-0 i').count());
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('asked')).toEqual(['Le rimetto al loro posto', 'Le tengo io']);
  expect((get('after') as { dialog: boolean }).dialog, 'asked once').toBe(false);
  expect(get('dots'), 'the stones make up for the bond').toBe(3);
  expect((get('state') as { seen: Record<string, boolean> }).seen['sc-pietre-tenute']).toBe(true);
});

/* the people grow: Antonio starts with little, changes clothes at level 14, and has to choose what to forget */
test('the people grow', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['antonio', 'costanzo'], beaten: {}, found: {},
    seen: { intro: true, starter: true, 'cap-starter': true, 'dono-retini': true }, mons: [{ uid: 'c1', sp: 'cicalina', bond: 20 }], lv: { c1: { lv: 20, xp: 0 }, antonio: { lv: 13, xp: 0 }, costanzo: { lv: 25, xp: 0 } }, money: 0, bag: {} };
  const r = await play(browser, 'people', { seed: 16, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkThrough(p);
    await r.shot('before');
    await p.evaluate(() => window.WORLD._debug.xp('antonio', 200)); await p.clock.runFor(300);
    await talkThrough(p);
    await r.shot('evolve');
    r.keep('evolve', await p.locator('.award.evolve').innerText());
    await p.click('#ev-ok'); await p.clock.runFor(300);
    await talkThrough(p);
    /* the sheet for learning a move: the new one, and the four known drawn as in a battle */
    await r.shot('learn');
    r.keep('learn', await p.locator('.sheet.learn .ln-new').innerText());
    r.keep('forget', await p.locator('.sheet.learn [data-old]').evaluateAll((bs) => bs.map((b) => b.getAttribute('aria-label'))));
    await p.click('.sheet.learn [data-old="diagnosi"]'); await p.clock.runFor(300);
    await talkThrough(p);
    await p.evaluate(() => window.WORLD._debug.xp('costanzo', 400)); await p.clock.runFor(300);
    await talkThrough(p);
    await r.shot('evolve-2');
    await p.click('#ev-ok'); await p.clock.runFor(300);
    await talkThrough(p);
    /* what Costanzo wants to learn: not this time */
    for (let k = 0; k < 4; k++) {
      if (await p.locator('.sheet.learn').count()) await p.click('#ln-no');
      else if (await p.evaluate(() => window.WORLD._debug.pos().opts)) await p.locator('#wopts button').last().click();
      else break;
      await p.clock.runFor(300); await talkThrough(p);
    }
    await r.shot('after');
    await p.keyboard.press('m'); await p.clock.runFor(300);
    r.keep('menu', await p.locator('#overlay, .world-menu, .menu').first().innerText().catch(() => ''));
    await p.locator('[data-cr="antonio"]').click({ timeout: 5000 }); await p.clock.runFor(300);
    await r.shot('card');
    r.keep('card', await p.locator('.sheet').first().innerText());
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(String(get('evolve'))).toContain('Il Ricercatore');
  expect(get('forget')).toContain('Dimentica Diagnosi Energetica');
  expect(String(get('learn'))).toContain('Paper su arXiv');
  expect(String(get('card'))).toContain('Paper su arXiv');
  expect(String(get('card'))).toContain('Il Ricercatore');
  const st = get('state') as { people: Record<string, { moves: string[] }> };
  expect(st.people.antonio.moves).toContain('paper');
  expect(st.people.antonio.moves).not.toContain('diagnosi');
});

/* everyone is a protagonist: from the menu Antonio becomes Costanzo, with Costanzo's creatures, and a mission waits for him */
/* a story played as Costanzo (chosen at «chi sei?»: here from a save): the menu is his, and so is his mission */
test('playing as a friend', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['costanzo'], first: 'costanzo', beaten: {}, found: {},
    seen: { intro: true, starter: true, protagonisti: true, 'cap-starter': true, 'dono-retini': true }, mons: [{ uid: 'c2', sp: 'cicalina', bond: 40, owner: 'costanzo' }], lv: { c2: { lv: 12, xp: 0 }, costanzo: { lv: 10, xp: 0 } }, money: 0, bag: {} };
  const r = await play(browser, 'friend', { seed: 17, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkThrough(p);
    const t = await p.evaluate(() => window.WORLD._debug.who('tifoso'));
    /* the menu: who is played, alone, with his creatures; nobody else to play */
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await r.shot('menu');
    r.keep('team', await p.locator('.party.mons').innerText());
    r.keep('switch', await p.locator('[data-first]').count());
    await p.keyboard.press('Escape'); await p.clock.runFor(300);
    if (await p.locator('.sheet').count()) { await p.keyboard.press('Escape'); await p.clock.runFor(300); }
    await p.evaluate(([x, y]) => window.WORLD._debug.travel('formia', x, y, 'up'), [t!.x, t!.y + 1]); await p.clock.runFor(500);
    await r.shot('as-costanzo');
    await talkTo(p, 'tifoso'); await p.clock.runFor(300);
    await talkThrough(p);
    r.keep('offer', await p.locator('#wopts button').allInnerTexts());
    await choose(p, 'Ci sto');
    await talkThrough(p);
    await choose(p, 'Mi chiamo Costanzo');
    await talkThrough(p);
    await choose(p, 'GIÀ LO SAI');
    await talkThrough(p);
    await choose(p, 'Daje Roma daje');
    await talkThrough(p);
    await choose(p, 'Il bidet non si tocca');
    await talkThrough(p, 20);
    await r.shot('done');
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(String(get('team'))).toContain('Le creature di Costanzo');
  expect(String(get('team'))).toContain('Cicalina');
  expect(get('switch')).toBe(0);
  expect(get('offer')).toEqual(['Ci sto', 'Più tardi']);
  const st = get('state') as { first: string; seen: Record<string, boolean>; money: number; mons: { uid: string; sp: string; owner?: string }[] };
  expect(st.first).toBe('costanzo');
  expect(st.seen['ms-comizio']).toBe(true);
  expect(st.money).toBe(80);
  expect(st.mons.filter((m) => m.owner === 'costanzo').map((m) => m.sp)).toEqual(['cicalina', 'micetto']);
});

/* the end of the story so far: at the train, the game told back */
test('looking back, before the train', async ({ browser }) => {
  const save = { v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: ['gialosai', 'peggio', 'weee', 'bau', 'calcolato'], squad: ['antonio', 'costanzo', 'forchetta'], beaten: { 'tr-mamurra': true }, found: {},
    seen: { intro: true, starter: true, 'cap-starter': true, 'dono-retini': true, 'cic-lamo': true, 'sc-pietre-sigillo': true }, mons: [{ uid: 'c1', sp: 'ramarrone', nick: 'Pino', bond: 90 }], lv: { c1: { lv: 20, xp: 0 } }, dex: { ramarrino: 2, lamo: 1 }, money: 0, bag: {} };
  const r = await play(browser, 'epilogue', { seed: 8, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkThrough(p);
    await talkTo(p, 'capotreno');
    await choose(p, 'Guarda indietro');
    await r.shot('look-back');
    r.keep('text', await p.locator('.award').innerText());
    await p.click('#ep-ok'); await p.clock.runFor(200);
    r.keep('closed', await p.locator('.award').count());
  });
  const text = String(r.data.find((x) => x.name === 'text')!.value);
  expect(text).toContain('La tua Formia');
  expect(text).toContain('Pino è ancora con te');
  expect(text).toContain('Costanzo e Forchetta');
  expect(text).toContain('Lamo l\'hai guardato in faccia');
  expect(r.data.find((x) => x.name === 'closed')!.value).toBe(0);
});

/* a save already in town, with Formia as it is now (positions kept) */
const inTown = (o: object) => ({ 'lotte-tra-amici:storia:v1': JSON.stringify({ v: 1, map: 'formia', x: 215, y: 42, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, found: {},
  seen: { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, formia7: true, formia8: true }, mons: [{ uid: 'c1', sp: 'polpino' }], ...o }) });

/* fishing off the pier with the fisherman of Mola: three casts, a pull right after each bite */
test('fishing off the pier', async ({ browser }) => {
  const r = await play(browser, 'fishing', { seed: 6, storage: inTown({ x: 142, y: 66, dir: 'right' }) }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkTo(p, 'pescatore');
    await choose(p, 'Pesca dal molo');
    /* the bites come at 2.7, 3.5 and 2.2 s into each cast; choose() let 0.3 s go, and each catch is shown for 1.3 s */
    const waits = [2700 - 300 + 100, 3500 - 200 + 100, 2200 - 200 + 100];
    for (const w of waits) { await p.clock.runFor(w); await p.keyboard.press(' '); await p.clock.runFor(1500); }
    r.keep('score', await p.textContent('#mg-s'));
    await r.shot('fishing');
    await p.click('#mg-x'); await p.clock.runFor(300);
    await talkThrough(p);
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(String(get('score'))).toMatch(/^Fine: \d/);
  const st = get('state') as { done: Record<string, number>; best: Record<string, number> };
  expect(st.done.pesca).toBe(1);
  expect(st.best.pesca).toBeGreaterThan(1500);
});

/* the friends' tournament at the Bruno Zauli: five friends in a row, then the cup, and the next edition is harder */
test('the friends\' tournament', async ({ browser }) => {
  /* five whole battles in a row */
  test.setTimeout(480_000);
  const strong = { lv: 45, xp: 0 };
  const r = await play(browser, 'tourney', { seed: 13, storage: inTown({ badges: ['gialosai', 'peggio', 'weee', 'bau', 'calcolato'], squad: ['antonio', 'forchetta', 'costanzo'], beaten: { circolo: true, piazza: true },
    lv: { antonio: strong, forchetta: strong, costanzo: strong }, money: 0 }) }, async (r) => {
    const p = r.page;
    await goStory(p);
    await p.clock.runFor(1500);
    await talkTo(p, 'velocista');
    await choose(p, 'Iscriviti!');
    for (let round = 0; round < 5; round++) {
      await talkThrough(p, 20);
      /* the company: the first one in the list goes */
      await p.locator('.pick').first().click({ timeout: 5000 });
      await p.clock.runFor(800);
      await fight(r, 'round' + round, round === 0 ? 1 : 0);
      await p.click('#st-go'); await p.clock.runFor(800);
    }
    await talkThrough(p, 20);
    await p.clock.runFor(300);
    r.keep('cup', await p.locator('.award h2').innerText());
    await r.shot('cup');
    await p.click('#cup-ok'); await p.clock.runFor(300);
    await talkThrough(p, 20);
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(String(get('cup'))).toContain('Torneo degli amici');
  const st = get('state') as { done: Record<string, number>; best: Record<string, number>; money: number };
  expect(st.done.coppa).toBe(1);
  expect(st.done.torneo).toBe(1);
  expect(st.best.torneo).toBe(5);
  expect(st.money).toBeGreaterThanOrEqual(120);
});

/* the creatures' powers: a sea creature swims Antonio to the Roman tanks of Gianola (an amphora at the bottom of one),
   a lizard takes him up the walls of Castellone, a gull shows Formia from above */
test('the creatures\' powers', async ({ browser }) => {
  /* three games in a row */
  test.setTimeout(360_000);
  type P = { x: number; y: number; dialog: boolean; text: string; swim: boolean; climb: boolean; sky: boolean };
  const pos = (p: Page) => p.evaluate(() => window.WORLD._debug.pos() as unknown as P);
  const quiet = { 'cic-power': true, 'cic-wild': true, 'cap-trama-scavi': true };
  const swim = await play(browser, 'powers-swim', { seed: 21, storage: inTown({ x: 246, y: 98, dir: 'down', money: 0, seen: { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, formia7: true, formia8: true, ...quiet } }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    await p.keyboard.press('ArrowDown'); await p.clock.runFor(400);
    r.keep('ask', (await pos(p)).text);
    await choose(p, 'Nuota con');
    await p.clock.runFor(600);
    r.keep('in the water', await pos(p));
    await r.shot('amphora');
    await talkThrough(p);
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const get = (run: { data: { name: string; value: unknown }[] }, n: string) => run.data.find((x) => x.name === n)!.value;
  expect(String(get(swim, 'ask'))).toContain('a nuoto');
  expect(get(swim, 'in the water')).toMatchObject({ x: 246, y: 99, swim: true });
  expect(String((get(swim, 'in the water') as P).text)).toContain('vasca romana');
  expect((get(swim, 'state') as { money: number; seen: Record<string, boolean> }).money).toBe(60);

  const climb = await play(browser, 'powers-climb', { seed: 22, storage: inTown({ x: 88, y: 62, dir: 'up', mons: [{ uid: 'c1', sp: 'ramarrino' }], seen: { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, formia7: true, formia8: true, ...quiet } }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    await p.keyboard.press('ArrowUp'); await p.clock.runFor(400);
    r.keep('ask', (await pos(p)).text);
    await choose(p, 'Arrampicati con');
    await p.clock.runFor(600);
    r.keep('on the walls', await pos(p));
    await r.shot('walls');
  });
  expect(String(get(climb, 'ask'))).toContain('mura');
  expect(get(climb, 'on the walls')).toMatchObject({ x: 88, y: 61, climb: true });

  const fly = await play(browser, 'powers-fly', { seed: 23, storage: inTown({ x: 142, y: 66, dir: 'down', mons: [{ uid: 'c1', sp: 'gabbi' }], seen: { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, formia7: true, formia8: true, ...quiet } }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    r.keep('hint', await p.textContent('.whint'));
    await p.keyboard.press('v'); await p.clock.runFor(1200);
    r.keep('up', await pos(p));
    await r.shot('from above');
    /* nobody walks while the gull is up there */
    await p.keyboard.press('ArrowLeft'); await p.clock.runFor(400);
    r.keep('still', await pos(p));
    await p.clock.runFor(4000);
    r.keep('down', await pos(p));
  });
  expect(String(get(fly, 'hint'))).toContain('V per guardare dall\'alto');
  expect(get(fly, 'up')).toMatchObject({ sky: true });
  expect(get(fly, 'still')).toMatchObject({ x: 142, y: 66 });
  expect(get(fly, 'down')).toMatchObject({ sky: false });
});

/* a game saved in the sea (or on the walls) and opened again: whoever is played has no swimmer now, or one. Never stuck */
test('opened again in the sea', async ({ browser }) => {
  type P = { x: number; y: number; swim: boolean };
  const pos = (p: Page) => p.evaluate(() => window.WORLD._debug.pos() as unknown as P);
  const quiet = { 'cic-power': true, 'cic-wild': true, 'cap-trama-scavi': true };
  const seen = { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, formia7: true, formia8: true, ...quiet };
  const open = async (name: string, mons: object[]) => (await play(browser, name, { seed: 24, storage: inTown({ x: 246, y: 99, dir: 'down', mons, seen }) }, async (r) => {
    const p = r.page;
    await goStory(p); await p.clock.runFor(1500);
    r.keep('pos', await pos(p));
    await r.shot('opened');
  })).data.find((x) => x.name === 'pos')!.value as P;
  /* a sea creature in the team: it carries him on, where he was */
  expect(await open('sea-swimmer', [{ uid: 'c1', sp: 'polpino' }])).toMatchObject({ x: 246, y: 99, swim: true });
  /* none: back to the shore, next to where he was */
  const ashore = await open('sea-none', [{ uid: 'c1', sp: 'ramarrino' }]);
  expect(ashore.swim).toBe(false);
  expect(Math.abs(ashore.x - 246) + Math.abs(ashore.y - 99)).toBeGreaterThan(0);
  expect(Math.abs(ashore.x - 246) + Math.abs(ashore.y - 99)).toBeLessThan(6);
});
