import { expect, type Browser, type Page } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import fs from 'node:fs';
import path from 'node:path';

/* Runs the same scenario on the old single-file game and on the new one, and compares what they show. */
export const OLD = '/legacy/index.html';
export const NEW = process.env.PARITY_NEW || '/';
const T0 = new Date('2026-03-14T10:00:00Z').getTime();

export interface Run {
  page: Page;
  shots: { name: string; png: Buffer }[];
  data: { name: string; value: unknown }[];
  shot(name: string, opts?: { fullPage?: boolean; selector?: string }): Promise<void>;
  keep(name: string, value: unknown): void;
}
export interface TwinOpts {
  dark?: boolean;
  reduced?: boolean;
  viewport?: { width: number; height: number };
  seed?: number;
  storage?: Record<string, string>;
  touch?: boolean;
  /** a fake window.claude.hot, as in a claude.ai artifact: ready() hands back what was stored in sessionStorage */
  hot?: boolean;
}

async function open(browser: Browser, url: string, o: TwinOpts): Promise<Run> {
  const ctx = await browser.newContext({
    viewport: o.viewport || { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: o.dark ? 'dark' : 'light',
    reducedMotion: o.reduced === false ? 'no-preference' : 'reduce',
    hasTouch: !!o.touch,
    isMobile: !!o.touch,
    baseURL: 'http://localhost:5173'
  });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.g(oogleapis|static)\.com|favicon/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.addInitScript(({ seed, storage }) => {
    let a = seed >>> 0;
    Math.random = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    if (storage && !sessionStorage.getItem('__seeded')) {
      sessionStorage.setItem('__seeded', '1');
      localStorage.clear();
      for (const k of Object.keys(storage)) localStorage.setItem(k, storage[k]);
    }
  }, { seed: o.seed ?? 7, storage: o.storage || null });
  if (o.hot) await page.addInitScript(() => {
    const W = window as unknown as Record<string, unknown>;
    W.claude = { hot: {
      snapshot(fn: () => unknown) { W.__snap = fn; },
      ready(cb: (d?: unknown) => void) { const d = sessionStorage.getItem('__hot'); cb(d ? JSON.parse(d) : undefined); }
    } };
  });
  await page.clock.install({ time: T0 });
  await page.goto(url);
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('16px "Lilita One"'), document.fonts.load('16px "Patrick Hand"'),
      document.fonts.load('16px "Atkinson Hyperlegible"'), document.fonts.load('700 16px "Atkinson Hyperlegible"')
    ]);
    await document.fonts.ready;
  });
  await page.clock.pauseAt(T0 + 5000);
  await page.clock.runFor(1000);
  const run: Run = {
    page, shots: [], data: [],
    async shot(name, so = {}) {
      /* the old page gets its fonts from Google, and a face can still be on its way: wait for every one */
      for (let k = 0; k < 100; k++) {
        const ok = await page.evaluate(() => document.fonts.status === 'loaded' && Array.from(document.fonts).every((f) => f.status !== 'loading'));
        if (ok) break;
        await page.waitForTimeout(50);
      }
      /* Chrome sometimes keeps `ch` lengths measured with the fallback font after a late web font arrives
         (the old page, whose fonts come over the network, under load): restyle everything once fonts are in */
      await page.evaluate(() => {
        const st = document.createElement('style');
        st.textContent = '* { font-family: serif !important; }';
        document.head.appendChild(st);
        void document.documentElement.offsetHeight;
        st.remove();
        void document.documentElement.offsetHeight;
      });
      await page.clock.runFor(50);
      let png: Buffer;
      if (so.selector) png = await page.locator(so.selector).screenshot({ animations: 'disabled' });
      else if (so.fullPage) {
        /* Playwright's fullPage resizes while it captures, and under load it sometimes catches the page mid-resize:
           measure the page, make the window that tall, then take a plain screenshot */
        const vp = page.viewportSize()!;
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width: vp.width, height: h });
        await page.clock.runFor(100);
        const h2 = await page.evaluate(() => document.documentElement.scrollHeight);
        run.keep(name + ' height', h2);
        if (process.env.PARITY_DEBUG) run.keep(name + ' layout', await page.evaluate(() => ({
          blocks: Array.from(document.querySelectorAll('#home > *, #home section > *, #card > *')).map((e) => e.tagName + '.' + e.className + ' ' + (e as HTMLElement).offsetHeight),
          fonts: Array.from(document.fonts).map((f) => f.family + ' ' + f.weight + ' ' + f.status).filter((x) => !x.endsWith('unloaded'))
        })));
        png = await page.screenshot({ animations: 'disabled' });
        await page.setViewportSize(vp);
        await page.clock.runFor(100);
      } else png = await page.screenshot({ animations: 'disabled' });
      run.shots.push({ name, png });
    },
    keep(name, value) { run.data.push({ name, value }); }
  };
  (run as Run & { errors: string[] }).errors = errors;
  return run;
}

function diff(name: string, a: Buffer, b: Buffer): number {
  const A = PNG.sync.read(a), B = PNG.sync.read(b);
  const dir = path.join('test-results', 'parity'), f = name.replace(/[^a-z0-9-]+/gi, '_');
  const keep = () => {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, f + '-old.png'), a);
    fs.writeFileSync(path.join(dir, f + '-new.png'), b);
  };
  if (A.width !== B.width || A.height !== B.height) { keep(); console.log(name + ': old ' + A.width + '×' + A.height + ', new ' + B.width + '×' + B.height); return -1; }
  const D = new PNG({ width: A.width, height: A.height });
  const n = pixelmatch(A.data, B.data, D.data, A.width, A.height, { threshold: 0, includeAA: true });
  if (n > 0) { keep(); fs.writeFileSync(path.join(dir, f + '-diff.png'), PNG.sync.write(D)); }
  return n;
}

export async function twin(browser: Browser, title: string, o: TwinOpts, scenario: (r: Run) => Promise<void>) {
  const runs: Run[] = [];
  for (const url of [OLD, NEW]) {
    const r = await open(browser, url, o);
    await scenario(r);
    r.keep('errors', (r as Run & { errors: string[] }).errors);
    runs.push(r);
    await r.page.context().close();
  }
  const [a, b] = runs;
  expect(b.shots.map(s => s.name), title + ': same checkpoints').toEqual(a.shots.map(s => s.name));
  expect(b.data, title + ': same data').toEqual(a.data);
  if (process.env.PARITY_SAVE) {   /* keep every checkpoint of the new game, to look at */
    const dir = path.join('test-results', 'shots');
    fs.mkdirSync(dir, { recursive: true });
    b.shots.forEach(s => fs.writeFileSync(path.join(dir, (title + '-' + s.name).replace(/[^a-z0-9-]+/gi, '_') + '.png'), s.png));
  }
  const bad: string[] = [];
  a.shots.forEach((s, k) => {
    const n = diff(title + '-' + s.name, s.png, b.shots[k].png);
    if (n !== 0) bad.push(s.name + (n < 0 ? ' (different size)' : ' (' + n + ' px)'));
  });
  expect(bad, title + ': screenshots that differ (see test-results/parity)').toEqual([]);
}

/* ---------- helpers that only use what a player can see, plus the games' own _debug hooks ---------- */

/** advance the fake clock until cond is true in the page */
export async function until(page: Page, cond: () => boolean, maxMs = 120_000, step = 100) {
  for (let t = 0; t < maxMs; t += step) {
    if (await page.evaluate(cond)) return;
    await page.clock.runFor(step);
  }
  throw new Error('timed out waiting for ' + cond.toString());
}
/** tap through the battle dialogue until a player has to choose, or the battle is over */
export async function toPrompt(page: Page) {
  const ready = () => {
    const ov = document.getElementById('overlay')!;
    if (!ov.hidden && (ov.classList.contains('result') || ov.classList.contains('pass'))) return true;
    const pad = document.getElementById('pad');
    return !!pad && !pad.classList.contains('off');
  };
  for (let k = 0; k < 600; k++) {
    if (await page.evaluate(ready)) return;
    await page.clock.runFor(1500);
  }
  throw new Error('battle never reached a prompt');
}
export async function battleOver(page: Page) {
  return page.evaluate(() => { const ov = document.getElementById('overlay')!; return !ov.hidden && ov.classList.contains('result'); });
}
/** walk the player along a list of directions, one tile at a time */
export async function walk(page: Page, dirs: string[]) {
  const KEY: Record<string, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  type Pos = { x: number; y: number; dir: string; moving: boolean; busy: boolean; map: string };
  const pos = () => page.evaluate(() => (window as unknown as { WORLD: { _debug: { pos(): Pos } } }).WORLD._debug.pos());
  /* a quick tap turns the player if he faces elsewhere, a second one takes exactly one step */
  for (const d of dirs) {
    if ((await pos()).dir !== d) { await page.keyboard.down(KEY[d]); await page.keyboard.up(KEY[d]); }
    await page.keyboard.down(KEY[d]); await page.keyboard.up(KEY[d]);
    for (let k = 0; k < 60; k++) { await page.clock.runFor(20); const p = await pos(); if (!p.moving && !p.busy) break; }
  }
  await page.clock.runFor(300);
}
