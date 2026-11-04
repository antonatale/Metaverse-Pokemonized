import { chromium, type Browser, type BrowserContext, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/* The game, driven frame by frame for the trailer: a fake clock moves timers and requestAnimationFrame, and every
   CSS or Web Animation is paused and moved by hand by the same amount, so a clip is the same at any machine speed.
   The dev server must be running (npm run dev). */

export const GAME = process.env.GAME_URL || 'http://localhost:5173/';
/** a summer morning in Formia: 11:00, Italian summer time */
export const SUMMER = new Date('2026-07-18T09:00:00Z').getTime();
export const FPS = 30;

export interface GameOpts {
  /** CSS pixels; the picture is viewport × scale (1280×720 × 1.5 = 1920×1080) */
  viewport?: { width: number; height: number };
  scale?: number;
  seed?: number;
  storage?: Record<string, string>;
  time?: number;
  dark?: boolean;
}

/* The dev server's client, replaced in every page we film: no hot-module socket, so an edit to a file while we
   record (by us or by anyone) never reloads the page in the middle of a clip. Styles are still injected. */
const NO_HMR = 'export function createHotContext() { return { accept() {}, acceptExports() {}, dispose() {}, prune() {}, invalidate() {}, on() {}, off() {}, send() {}, data: {} }; }\n' +
  'export function updateStyle(id, css) { let s = document.querySelector(\'style[data-vite-dev-id="\' + id + \'"]\'); if (!s) { s = document.createElement(\'style\'); s.setAttribute(\'type\', \'text/css\'); s.setAttribute(\'data-vite-dev-id\', id); document.head.appendChild(s); } s.textContent = css; }\n' +
  'export function removeStyle(id) { const s = document.querySelector(\'style[data-vite-dev-id="\' + id + \'"]\'); if (s) s.remove(); }\n' +
  'export function injectQuery(url) { return url; }\nexport class ErrorOverlay {}\n';
export async function noHmr(page: Page) {
  await page.route('**/@vite/client', (route) => route.fulfill({ contentType: 'text/javascript', body: NO_HMR }));
}

export async function launch(): Promise<Browser> {
  return chromium.launch({ args: ['--force-color-profile=srgb', '--hide-scrollbars'] });
}

export interface Game { ctx: BrowserContext; page: Page; close(): Promise<void> }

export async function openGame(browser: Browser, o: GameOpts = {}): Promise<Game> {
  const ctx = await browser.newContext({
    viewport: o.viewport || { width: 1280, height: 720 },
    deviceScaleFactor: o.scale || 1.5,
    colorScheme: o.dark ? 'dark' : 'light',
    reducedMotion: 'no-preference',
    timezoneId: 'Europe/Rome',
    locale: 'it-IT'
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('  pageerror: ' + e.message));
  /* tsx names functions with a __name helper that the page does not have */
  await page.addInitScript({ content: 'window.__name = function (f) { return f; };' });
  await noHmr(page);
  await page.addInitScript(({ seed, storage }) => {
    let a = seed >>> 0;
    Math.random = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    if (!sessionStorage.getItem('__seeded')) {
      sessionStorage.setItem('__seeded', '1');
      localStorage.clear();
      localStorage.setItem('lotte-tra-amici:audio:v1', '{"v":1,"on":false}');
      for (const k of Object.keys(storage)) localStorage.setItem(k, storage[k]);
    }
    /* every animation is paused when first seen and moved by hand; one that reaches its end is finished, so the
       promises the battle waits on resolve */
    const seen = new WeakMap<Animation, number>();
    (window as unknown as { __step(dt: number): void }).__step = function (dt: number) {
      for (const an of document.getAnimations()) {
        if (an.playState === 'finished' || an.playState === 'idle') continue;
        let t = seen.get(an);
        if (t === undefined) { t = 0; an.pause(); } else t += dt * (an.playbackRate || 1);
        seen.set(an, t);
        const end = an.effect ? an.effect.getComputedTiming().endTime as number : Infinity;
        if (isFinite(end) && t >= end) { try { an.finish(); } catch (e) { an.currentTime = end; } }
        else an.currentTime = t;
      }
    };
  }, { seed: o.seed ?? 7, storage: o.storage || {} });
  const t0 = o.time ?? SUMMER;
  await page.clock.install({ time: t0 });
  await page.goto(GAME);
  await page.evaluate(async () => {
    await Promise.all([
      document.fonts.load('16px "Lilita One"'), document.fonts.load('16px "Patrick Hand"'),
      document.fonts.load('16px "Atkinson Hyperlegible"'), document.fonts.load('700 16px "Atkinson Hyperlegible"')
    ]);
    await document.fonts.ready;
  });
  await page.clock.pauseAt(t0 + 5000);
  await page.clock.runFor(1000);
  return { ctx, page, close: () => ctx.close() };
}

/** a story save, already past the start, at a tile of Formia */
export function storySave(o: Record<string, unknown> = {}, hour?: 'notte' | 'giorno' | 'tramonto'): Record<string, string> {
  const seen = { intro: true, starter: true, formia2: true, formia3: true, formia4: true, formia5: true, formia6: true, 'cap-starter': true };
  const s = { v: 1, map: 'formia', x: 137, y: 20, dir: 'down', badges: [], squad: ['antonio'], beaten: {}, found: {}, money: 120, bag: { retino2: 3, tiella: 2 },
    ...o, seen: { ...seen, ...((o.seen as object) || {}) } };
  const out: Record<string, string> = { 'lotte-tra-amici:storia:v1': JSON.stringify(s) };
  if (hour) out['lotte-tra-amici:ora:v1'] = hour;
  return out;
}

/** records one clip: every frame advances the game by 1/30 s and is saved as a JPEG */
export class Clip {
  n = 0;
  private ms = 0;
  constructor(public page: Page, public dir: string) {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
  }
  /** move the game on without recording (whole milliseconds, animations too) */
  async run(ms: number) {
    await this.page.clock.runFor(ms);
    await this.page.evaluate((dt) => (window as unknown as { __step(dt: number): void }).__step(dt), ms);
  }
  async frame() {
    const next = Math.round((this.n + 1) * 1000 / FPS);
    await this.run(next - this.ms);
    this.ms = next;
    const jpg = await this.page.screenshot({ type: 'jpeg', quality: 92 });
    fs.writeFileSync(path.join(this.dir, String(++this.n).padStart(4, '0') + '.jpg'), jpg);
  }
  /** k frames; `at` runs before frame i (key presses, clicks) */
  async frames(k: number, at?: (i: number) => Promise<void> | void) {
    for (let i = 0; i < k; i++) { if (at) await at(i); await this.frame(); }
  }
  /** frames until cond is true in the page (at most max) */
  async until(cond: () => boolean, max = 300) {
    for (let i = 0; i < max; i++) { if (await this.page.evaluate(cond)) return true; await this.frame(); }
    return false;
  }
}
