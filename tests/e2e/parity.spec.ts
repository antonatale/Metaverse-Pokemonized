import { test, type Page } from '@playwright/test';
import { twin, until, toPrompt, battleOver, walk, type Run } from './twin';

/* the old and the new game must look and behave the same: same screens, same battles, same saves */

declare global {
  interface Window {
    WORLD: { _debug: { spot(k: string, id: string): { x: number; y: number; dir: string } | null; route(x: number, y: number): string[] | null; pos(): { dialog: boolean; opts: boolean }; overview(id: string, s: number): string }; state(): unknown };
    UI: { _debug: { suggest(): string | null } };
  }
}

async function saves(r: Run, name: string) {
  r.keep(name, await r.page.evaluate(() => ({
    storia: localStorage.getItem('lotte-tra-amici:storia:v1'),
    libretto: localStorage.getItem('lotte-tra-amici:libretto:v2')
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
    if (turn < shots) await r.shot(label + '-turn' + turn);
    const id = await p.evaluate(() => window.UI._debug.suggest());
    await p.click('#pad .mv[data-id="' + id + '"]');
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

for (const dark of [false, true]) {
  test('home ' + (dark ? 'dark' : 'light'), async ({ browser }) => {
    await twin(browser, 'home-' + (dark ? 'dark' : 'light'), { dark }, async (r) => {
      await r.shot('full', { fullPage: true });
      await r.page.click('.slot[data-id="valentin"]');
      await r.page.click('#card .expr[data-x="cool"]');
      await r.shot('card-valentin', { selector: '#card' });
      await r.page.click('.slot[data-id="zendavid"]');
      await r.page.click('#card .expr[data-x="sleepy"]');
      await r.shot('card-zendavid', { selector: '#card' });
      await r.page.click('#go');
      await r.shot('setup-cpu');
      await r.page.click('.seg button[data-m="pvp"]');
      await r.shot('setup-pvp');
    });
  });
}
test('home desktop', async ({ browser }) => {
  await twin(browser, 'home-desktop', { viewport: { width: 1280, height: 900 } }, async (r) => { await r.shot('full', { fullPage: true }); });
});

const MATCHES: [string, string, number][] = [['antonio', 'costanzo', 11], ['andrea', 'valentin', 23], ['forchetta', 'zendavid', 5], ['valentin', 'antonio', 99], ['costanzo', 'forchetta', 3]];
for (const [a, b, seed] of MATCHES) {
  test('battle ' + a + ' vs ' + b, async ({ browser }) => {
    await twin(browser, 'battle-' + a + '-' + b, { seed }, async (r) => {
      const p = r.page;
      await p.click('.slot[data-id="' + a + '"]');
      await p.click('#go');
      await p.click('.pick[data-k="p2"][data-id="' + b + '"]');
      await p.click('#su-go');
      await fight(r, 'cpu');
      await p.click('#back');
      await r.shot('home-after', { selector: '#libretto' });
      await saves(r, 'saves');
    });
  });
}
test('boss', async ({ browser }) => {
  await twin(browser, 'boss', { seed: 42, dark: true }, async (r) => {
    await r.page.click('.slot[data-id="antonio"]');
    await r.page.click('#go-exam');
    await toPrompt(r.page);
    await r.page.click('#info');
    await r.shot('sheet');
    await r.page.keyboard.press('Escape');
    await fight(r, 'exam', 3);
    await r.page.click('#back');
    await saves(r, 'saves');
  });
});
test('two players', async ({ browser }) => {
  await twin(browser, 'pvp', { seed: 8 }, async (r) => {
    await r.page.click('#go');
    await r.page.click('.seg button[data-m="pvp"]');
    await r.page.click('.pick[data-k="p2"][data-id="andrea"]');
    await r.page.click('#su-go');
    await fight(r, 'pvp', 4);
  });
});

test('story', async ({ browser }) => {
  await twin(browser, 'story', { seed: 3 }, async (r) => {
    const p = r.page;
    await p.click('#go-story');
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
  await twin(browser, 'circolo', { seed: 4, dark: true, viewport: { width: 1280, height: 800 } }, async (r) => {
    const p = r.page;
    await p.click('#go-story');
    await until(p, () => window.WORLD._debug.pos().dialog);
    await talkThrough(p);
    await goTo(p, 'door', 'circolo');
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
  await twin(browser, 'touch', { seed: 5, touch: true }, async (r) => {
    await r.page.click('#go-story');
    await until(r.page, () => window.WORLD._debug.pos().dialog);
    await r.shot('pad');
  });
});

for (const dark of [false, true]) {
  test('maps overview ' + (dark ? 'dark' : 'light'), async ({ browser }) => {
    await twin(browser, 'maps-' + (dark ? 'dark' : 'light'), { dark }, async (r) => { await overview(r, 'formia'); await overview(r, 'circolo'); });
  });
}

/* the claude.ai artifact's hot reload: an open battle survives an update of the page */
test('hot reload keeps an open battle', async ({ browser }) => {
  await twin(browser, 'hot', { seed: 21, hot: true }, async (r) => {
    const p = r.page;
    await p.click('.slot[data-id="forchetta"]');
    await p.click('#go');
    await p.click('#su-go');
    for (let k = 0; k < 2; k++) {
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

/* saves written by the old game load the same way in the new one */
const OLD_SAVE = {
  'lotte-tra-amici:storia:v1': JSON.stringify({ v: 1, map: 'formia', x: 30, y: 25, dir: 'left', badges: ['gialosai'], squad: ['antonio', 'costanzo'], beaten: { piazza: true }, seen: { intro: true, formia2: true }, found: { appunti: true, caricabatterie: true } }),
  'lotte-tra-amici:libretto:v2': JSON.stringify({ v: 2, chars: { antonio: { w: 3, l: 1 }, valentin: { w: 0, l: 2 } }, exam: { antonio: { p: 1, f: 2, best: 27, lode: false } } })
};
const PRE_FORMIA2 = { 'lotte-tra-amici:storia:v1': JSON.stringify({ v: 1, map: 'formia', x: 3, y: 3, dir: 'up', badges: [], squad: ['antonio'], beaten: {}, seen: { intro: true }, found: {} }) };
test('old saves', async ({ browser }) => {
  await twin(browser, 'saves', { storage: OLD_SAVE }, async (r) => {
    await r.shot('home', { fullPage: true });
    await r.page.click('#go-story');
    await r.page.clock.runFor(1500);
    await r.shot('world');
    await saves(r, 'saves');
  });
  await twin(browser, 'saves-migration', { storage: PRE_FORMIA2 }, async (r) => {
    await r.page.click('#go-story');
    await r.page.clock.runFor(1500);
    await r.shot('world');
    await saves(r, 'saves');
  });
});
