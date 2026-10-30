import { test, expect, type Page } from '@playwright/test';
import { play, until, toPrompt, battleOver, walk, type Run } from './harness';

/* Whole games played to the end: home, battles against the computer, the exam, two players, the story, saves.
   Each must finish without errors; the saves they leave are checked where it matters. */

declare global {
  interface Window {
    WORLD: { _debug: { spot(k: string, id: string): { x: number; y: number; dir: string } | null; route(x: number, y: number): string[] | null; pos(): { dialog: boolean; opts: boolean; text: string; map: string; x: number; y: number }; area(): string; overview(id: string, s: number): string }; state(): unknown };
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
    await play(browser, 'home-' + (dark ? 'dark' : 'light'), { dark }, async (r) => {
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
  await play(browser, 'home-desktop', { viewport: { width: 1280, height: 900 } }, async (r) => { await r.shot('full', { fullPage: true }); });
});

const MATCHES: [string, string, number][] = [['antonio', 'costanzo', 11], ['andrea', 'valentin', 23], ['forchetta', 'zendavid', 5], ['valentin', 'antonio', 99], ['costanzo', 'forchetta', 3]];
for (const [a, b, seed] of MATCHES) {
  test('battle ' + a + ' vs ' + b, async ({ browser }) => {
    await play(browser, 'battle-' + a + '-' + b, { seed }, async (r) => {
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
  await play(browser, 'boss', { seed: 42, dark: true }, async (r) => {
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
  await play(browser, 'pvp', { seed: 8 }, async (r) => {
    await r.page.click('#go');
    await r.page.click('.seg button[data-m="pvp"]');
    await r.page.click('.pick[data-k="p2"][data-id="andrea"]');
    await r.page.click('#su-go');
    await fight(r, 'pvp', 4);
  });
});

test('story', async ({ browser }) => {
  await play(browser, 'story', { seed: 3 }, async (r) => {
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
  await play(browser, 'circolo', { seed: 4, dark: true, viewport: { width: 1280, height: 800 } }, async (r) => {
    const p = r.page;
    await p.click('#go-story');
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
    await r.page.click('#go-story');
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
  await play(browser, 'hot', { seed: 21, hot: true }, async (r) => {
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

/* saves in the format of the old single-file game still load */
const OLD_SAVE = {
  'lotte-tra-amici:storia:v1': JSON.stringify({ v: 1, map: 'formia', x: 30, y: 25, dir: 'left', badges: ['gialosai'], squad: ['antonio', 'costanzo'], beaten: { piazza: true }, seen: { intro: true, formia2: true }, found: { appunti: true, caricabatterie: true } }),
  'lotte-tra-amici:libretto:v2': JSON.stringify({ v: 2, chars: { antonio: { w: 3, l: 1 }, valentin: { w: 0, l: 2 } }, exam: { antonio: { p: 1, f: 2, best: 27, lode: false } } })
};
const PRE_FORMIA2 = { 'lotte-tra-amici:storia:v1': JSON.stringify({ v: 1, map: 'formia', x: 3, y: 3, dir: 'up', badges: [], squad: ['antonio'], beaten: {}, seen: { intro: true }, found: {} }) };
test('old saves', async ({ browser }) => {
  await play(browser, 'saves', { storage: OLD_SAVE }, async (r) => {
    await r.shot('home', { fullPage: true });
    await r.page.click('#go-story');
    await r.page.clock.runFor(1500);
    await r.shot('world');
    await saves(r, 'saves');
  });
  await play(browser, 'saves-migration', { storage: PRE_FORMIA2 }, async (r) => {
    await r.page.click('#go-story');
    await r.page.clock.runFor(1500);
    await r.shot('world');
    await saves(r, 'saves');
  });
});

/* the things to do around Formia, each in its real place */
async function choose(p: Page, label: string) {
  await p.locator('#wopts button', { hasText: label }).first().click({ timeout: 5000 });
  await p.clock.runFor(300);
}
async function talkTo(p: Page, id: string) {
  await goTo(p, 'npc', id);
  await p.keyboard.press('Enter'); await p.clock.runFor(200);
  await talkThrough(p);
}
test('activities around Formia', async ({ browser }) => {
  const r = await play(browser, 'activities', { seed: 9 }, async (r) => {
    const p = r.page;
    await p.click('#go-story');
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
    /* a lettino from the bar of the lido */
    await talkTo(p, 'barista');
    await choose(p, 'Prendi un lettino');
    await talkThrough(p);
    await talkThrough(p);
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
  expect(st.best.quiz).toBeGreaterThanOrEqual(0);
});

/* Antonio's flat in Parco la Fontana, and the scooter that takes him around town */
test('home and the scooter', async ({ browser }) => {
  const r = await play(browser, 'home', { seed: 10 }, async (r) => {
    const p = r.page;
    await p.click('#go-story');
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
    await goTo(p, 'sign', 'Il motorino di Antonio');
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    await choose(p, 'Eclipse beach');
    await p.clock.runFor(800);
    r.keep('rode to', await p.evaluate(() => window.WORLD._debug.area()));
    await r.shot('eclipse');
    /* he gets off just below the scooter parked here: face it, and ride home */
    await p.keyboard.down('ArrowUp'); await p.keyboard.up('ArrowUp'); await p.clock.runFor(200);
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    await choose(p, 'Casa');
    await p.clock.runFor(800);
    r.keep('back', await p.evaluate(() => window.WORLD._debug.area()));
  });
  const get = (n: string) => r.data.find((x) => x.name === n)!.value;
  expect(get('inside')).toBe('casa');
  expect(get('desk')).toContain('paper');
  expect(get('slept')).toBe('notte');
  expect(get('woke')).toBe('giorno');
  expect(get('out')).toBe('formia');
  expect(get('rode to')).toBe('Eclipse beach');
  expect(get('back')).toBe('Parco la Fontana');
});

/* the tour of Formia: the next stop is always in the corner, with an arrow, and in the menu */
test('the tour of Formia', async ({ browser }) => {
  const story = (extra: object) => ({ 'lotte-tra-amici:storia:v1': JSON.stringify({ v: 1, map: 'formia', x: 0, y: 0, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, seen: { intro: true }, found: {}, ...extra }) });
  const goal = async (r: Run) => {
    await r.page.click('#go-story');
    await r.page.clock.runFor(1500);
    return (await r.page.locator('#wgoal').innerText()).replace(/\s+/g, ' ');
  };
  const first = await play(browser, 'tour-start', {}, async (r) => {
    await r.page.click('#go-story');
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
  const later = await play(browser, 'tour-later', { storage: story({ done: { padel: 1 }, beaten: { circolo: true }, badges: ['forchetta'], squad: ['antonio', 'forchetta'], seen: { intro: true, starter: true }, mons: [{ uid: 'c1', sp: 'ramarrino' }] }) }, async (r) => {
    r.keep('goal', await goal(r));
    await r.page.keyboard.press('m'); await r.page.clock.runFor(300);
    r.keep('title', await r.page.locator('.pickrow h3', { hasText: 'Giro di Formia' }).innerText());
  });
  const get = (run: { data: { name: string; value: unknown }[] }, n: string) => String(run.data.find((x) => x.name === n)!.value);
  expect(get(first, 'goal')).toContain('La tua prima creatura');
  expect(get(first, 'tip')).toContain('guardaparco di Gianola');
  expect(get(first, 'menu')).toContain('Padel con Andrea');
  expect(get(first, 'menu')).toContain('Sfida Forchetta');
  expect(get(later, 'goal')).toContain('Quiz su Formia da Morgana');
  expect(get(later, 'title').toLowerCase()).toContain('3 su 13');
});

/* the creatures of Formia: the first one from the guardaparco, a wild one fought, the team in the menu; then money
   spent on nets at Mola and a wild one caught */
test('creatures of Formia', async ({ browser }) => {
  const first = await play(browser, 'creatures', { seed: 5 }, async (r) => {
    const p = r.page;
    await p.click('#go-story');
    await until(p, () => window.WORLD._debug.pos().dialog);
    await talkThrough(p);
    await talkTo(p, 'guardaparco');
    await choose(p, 'Fammeli vedere');
    await r.shot('starters');
    await p.click('.starter[data-sp="polpino"]'); await p.clock.runFor(300);
    await talkThrough(p);
    await talkTo(p, 'selv-gianola-1');
    await choose(p, 'Lotta!');
    await r.shot('pick');
    await p.click('.pick[data-key="c1"]'); await p.clock.runFor(800);
    await fight(r, 'wild', 2);
    r.keep('stamp', await p.evaluate(() => document.querySelector('.stamp')!.textContent));
    await p.click('#st-go'); await p.clock.runFor(800);
    await talkThrough(p, 20);
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
    await p.keyboard.press('m'); await p.clock.runFor(300);
    await p.locator('.team').scrollIntoViewIfNeeded();
    await r.shot('team');
    r.keep('team', await p.locator('.team').innerText());
  });
  const sf = first.data.find((x) => x.name === 'state')!.value as { mons: { uid: string; sp: string }[]; lv: Record<string, { lv: number; xp: number }>; money: number };
  expect(sf.mons[0]).toEqual({ uid: 'c1', sp: 'polpino' });
  expect(sf.lv.c1.lv > 5 || sf.lv.c1.xp > 0).toBe(true);
  expect(String(first.data.find((x) => x.name === 'team')!.value)).toContain('Polpino');

  const save = { v: 1, map: 'formia', x: 0, y: 0, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, seen: { intro: true, starter: true }, found: {},
    mons: [{ uid: 'c1', sp: 'gabbi' }], lv: { c1: { lv: 12, xp: 0 } }, money: 120, bag: {} };
  const second = await play(browser, 'catch', { seed: 8, storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(save) } }, async (r) => {
    const p = r.page;
    await p.click('#go-story');
    await p.clock.runFor(1500);
    await talkTo(p, 'pescatore');
    await choose(p, 'Compra');
    for (let k = 0; k < 3; k++) { await p.click('[data-it="retino2"]'); await p.clock.runFor(200); }
    await r.shot('shop');
    await p.click('#shop-x'); await p.clock.runFor(200);
    await talkTo(p, 'selv-gramsci');
    await choose(p, 'Lotta!');
    await p.click('.pick[data-key="c1"]'); await p.clock.runFor(800);
    for (let turn = 0; turn < 12; turn++) {
      await toPrompt(p);
      if (await battleOver(p)) break;
      const net = p.locator('#pad .mv[data-id="retino2"]:not([disabled])');
      if (await net.count()) await net.click(); else await p.click('#pad .mv[data-id="' + await p.evaluate(() => window.UI._debug.suggest()) + '"]');
    }
    await p.clock.runFor(600);
    await r.shot('caught');
    r.keep('stamp', await p.evaluate(() => document.querySelector('.stamp')!.textContent));
    await p.click('#st-go'); await p.clock.runFor(800);
    await talkThrough(p, 20);
    r.keep('state', await p.evaluate(() => window.WORLD.state()));
  });
  const sc = second.data.find((x) => x.name === 'state')!.value as { mons: { uid: string; sp: string }[]; money: number; bag: Record<string, number> };
  expect(sc.money).toBeLessThan(120);
  expect(sc.bag.retino2).toBeLessThan(3);
  if (second.data.find((x) => x.name === 'stamp')!.value === 'Preso!') expect(sc.mons.map((m) => m.sp)).toEqual(['gabbi', 'cicalina']);
  else expect(sc.mons.length).toBe(1);
});
