import { test, expect, type Page } from '@playwright/test';
import { play, goStory, fight } from './harness';
import { FORMIA_SPOT } from '../../src/data/maps/formia-ground';
import { MIGRATIONS } from '../../src/save/story-progress';

test.use({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });

test('Nicola cheers up the opening, then drives a full-size van clear of obstacles to the Eclipse', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(2000);
    localStorage.setItem('lotte-tra-amici:grafica:v1', 'bassa');
    const w = window as unknown as { fades: number[] };
    w.fades = [];
    const curve = AudioParam.prototype.setValueCurveAtTime;
    AudioParam.prototype.setValueCurveAtTime = function (values, start, duration) {
      w.fades.push(duration);
      return curve.call(this, values, start, duration);
    };
  });
  await page.goto('/');
  if (await page.locator('#ti-skip').isVisible()) await page.locator('#ti-skip').click();
  await page.locator('#go-story').click();
  await page.locator('[data-hero="antonio"]').click();
  await expect(page.getByRole('dialog', { name: 'Prologo', exact: true })).toBeVisible();
  const seen = () => page.evaluate(() => (window as unknown as { WORLD: { state(): { seen: Record<string, boolean> } } }).WORLD.state().seen);
  expect((await seen())['nicola-arrived']).not.toBe(true);
  await page.locator('#pr-go').click();
  for (let i = 0; i < 20 && !await page.locator('#ph-x').isVisible(); i++) {
    await expect(page.locator('#wdialog')).toBeVisible();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(60);
  }
  await expect(page.locator('#ph-x')).toBeVisible();
  expect((await seen())['nicola-arrived']).not.toBe(true);
  await page.locator('#ph-x').click();
  if (await page.locator('#ph-away').isVisible()) await page.locator('#ph-away').click();
  await expect(page.locator('#wtxt')).toContainText('In fondo alla strada');

  /* Sample the actual interpolated movement, rather than only the planned path. */
  await page.evaluate(async () => {
    const load = (p: string) => import(/* @vite-ignore */ p);
    /* Vite may timestamp imports after an edit: use the actual running modules, not a second bare instance. */
    const loaded = (p: string) => performance.getEntriesByType('resource').map(e => e.name).reverse().find(url => new URL(url).pathname === p) || p;
    const motion = await load(loaded('/src/story/movement.ts')), maps = await load(loaded('/src/story/maps.ts')), space = await load(loaded('/src/story/vehicle-space.ts'));
    const w = window as unknown as { vanHits: string[]; vanFrames: number; straightY: number[] };
    w.vanHits = []; w.vanFrames = 0; w.straightY = [];
    window.setInterval(() => {
      const v = motion.van;
      if (!v) return;
      w.vanFrames++;
      const f = v.dur ? Math.min(1, (performance.now() - v.t0) / v.dur) : 1;
      const x = v.fx + (v.x - v.fx) * f, y = v.fy + (v.y - v.fy) * f;
      const box = space.vanBody(maps.M, x, y, v.dir);
      if (v.carry && v.dir === 'left' && x >= 164 && x <= 214 && v.y === 46) w.straightY.push(box.bottom);
      for (let y = Math.floor(box.top / 32); y < Math.ceil(box.bottom / 32); y++) for (let x = Math.floor(box.left / 32); x < Math.ceil(box.right / 32); x++) {
        if (maps.M.solid[y * maps.M.w + x] === 1) w.vanHits.push(x + ',' + y);
      }
      const scooter = maps.moto();
      if (scooter.map === maps.M.id && space.overlaps(box, space.motoBody(scooter.x, scooter.y))) w.vanHits.push('motorino');
    }, 20);
  });
  await page.keyboard.press('Enter');
  await expect(page.locator('#wtxt')).toContainText('Su con la vita!', { timeout: 15_000 });
  await expect(page.locator('#wtxt .r-em', { hasText: 'Su con la vita!' })).toBeVisible();
  expect((await seen())['nicola-arrived']).toBe(true);
  expect(await page.evaluate(() => (window as unknown as { fades: number[] }).fades)).toContain(7);
  await page.screenshot({ path: 'output/playwright/nicola-su-con-la-vita.png' });
  await page.keyboard.press('Enter');
  await expect(page.locator('#wtxt')).toContainText('La guardaparco di Gianola');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Sali sul furgone', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sali sul furgone', exact: true }).click();
  await expect(page.locator('#wtxt')).toContainText('Eccoci, uagliò', { timeout: 65_000 });
  const ride = await page.evaluate(() => {
    const w = window as unknown as { vanHits: string[]; vanFrames: number; straightY: number[] };
    return { hits: w.vanHits, frames: w.vanFrames, straightY: w.straightY };
  });
  expect(ride.frames).toBeGreaterThan(50);
  expect(ride.hits).toEqual([]);
  expect(ride.straightY.length).toBeGreaterThan(20);
  expect(Math.max(...ride.straightY) - Math.min(...ride.straightY)).toBeLessThan(0.01);
  expect(errors).toEqual([]);
  await page.screenshot({ path: 'output/playwright/nicola-arrivo-eclipse.png' });
});

async function closeChat(p: Page) {
  await p.locator('#ph-x').click();
  if (await p.locator('#ph-away').isVisible()) await p.locator('#ph-away').click();
  await p.clock.runFor(200);
}
async function dialogueUntil(p: Page, button: string) {
  for (let i = 0; i < 60; i++) {
    if (await p.getByRole('button', { name: button, exact: true }).isVisible()) return;
    if (await p.locator('#wdialog').isVisible()) await p.keyboard.press('Enter');
    await p.clock.runFor(200);
  }
  throw new Error('Dialogue did not reach ' + button);
}

for (const outcome of ['win', 'loss'] as const) test('creature chat before the rival, stationary rival and result chat: ' + outcome, async ({ browser }) => {
  const at = FORMIA_SPOT.guardaparco, hero = 'antonio';
  const saved = { v: 1, map: 'formia', x: at[0], y: at[1] + 1, dir: 'up', first: hero, squad: [hero], rivalFriend: 'costanzo',
    badges: [], beaten: {}, found: {}, mons: [], lv: {}, bag: {},
    seen: { ...Object.fromEntries(MIGRATIONS.map(m => [m.id, true])), intro: true, 'chat-inizio': true, 'cap-starter': true, 'cic-trainer': true, 'cic-night': true } };
  await play(browser, 'first-creature-' + outcome, { gfx: 'bassa', storage: { 'lotte-tra-amici:storia:v1': JSON.stringify(saved), 'lotte-tra-amici:audio:v1': '{"v":1,"on":false}' } }, async r => {
    const p = r.page;
    p.setDefaultTimeout(10_000);
    const state = () => p.evaluate(() => window.WORLD.state() as { beaten: Record<string, boolean>; seen: Record<string, boolean>; chats: Record<string, { at: number; won?: boolean }> });
    const rival = () => p.evaluate(() => window.WORLD._debug.who('tullio') as { x: number; y: number; present: boolean; moving: boolean });
    await goStory(p, hero);
    await p.clock.runFor(1200);
    await p.keyboard.press('Enter'); await p.clock.runFor(300);
    await dialogueUntil(p, 'Fammeli vedere');
    await p.getByRole('button', { name: 'Fammeli vedere', exact: true }).click();
    await p.clock.runFor(200);
    await p.locator('.starter[data-sp="polpino"]').click(); await p.clock.runFor(200);
    await expect(p.locator('#ph-x')).toBeVisible();
    expect((await state()).seen['chat-starter']).toBe(true);
    expect((await state()).beaten['tr-rivale-1']).not.toBe(true);
    await r.shot('first-creature-chat');
    await closeChat(p);
    await expect(p.locator('#wtxt')).toContainText('Ottima scelta');
    if (outcome === 'win') await p.evaluate(() => window.WORLD._debug.xp('c1', 5000, true));
    await dialogueUntil(p, 'Sfida!');
    const waiting = await rival();
    expect(waiting.present).toBe(true);
    await p.clock.runFor(5000);
    expect(await rival()).toEqual(waiting);
    await p.getByRole('button', { name: 'Sfida!', exact: true }).click(); await p.clock.runFor(800);
    if (outcome === 'win') {
      await fight(r, 'rival', 0);
      await p.locator('#st-go').click();
    } else {
      /* Inject the completed defeat at the battle's return boundary: combat itself is covered by the engine tests. */
      await p.evaluate(() => {
        const world = window.WORLD as unknown as { afterBattle(result: Record<string, unknown>): void };
        const finish = world.afterBattle;
        world.afterBattle = result => { world.afterBattle = finish; finish({ ...result, won: false, quit: false }); };
      });
      await p.locator('#quit').click(); await p.locator('#quit').click();
    }
    await p.clock.runFor(800);
    for (let i = 0; i < 60 && !await p.locator('#ph-x').isVisible(); i++) {
      const here = await rival();
      expect([here.x, here.y, here.present, here.moving]).toEqual([waiting.x, waiting.y, true, false]);
      if (await p.locator('#wopts button').first().isVisible()) await p.locator('#wopts button').first().click();
      else if (await p.locator('#wdialog').isVisible()) await p.keyboard.press('Enter');
      await p.clock.runFor(300);
    }
    await expect(p.locator('#ph-x')).toBeVisible();
    await p.locator('#ph-x').click();
    await expect(p.locator('#ph-chat')).toContainText(outcome === 'win' ? 'al parco hai vinto tu' : 'Prima sfida vinta!');
    const result = await state();
    expect(result.chats.starter.at).toBeLessThan(result.chats['rivale-1'].at);
    expect(result.chats['rivale-1'].won).toBe(outcome === 'win');
    expect((await rival()).present).toBe(true);
    await r.shot('result-chat');
    await closeChat(p);
    await p.clock.runFor(1000);
    await expect(p.locator('#ph-x')).toBeHidden();
  });
});
