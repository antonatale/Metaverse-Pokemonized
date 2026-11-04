import fs from 'node:fs';
import { launch, noHmr, GAME } from './game';

/* Renders the trailer's music (music.ts) in the browser and saves it as promo/work/music.wav. */
const browser = await launch();
const page = await (await browser.newContext()).newPage();
page.on('pageerror', (e) => console.error('pageerror: ' + e.message));
/* tsx names functions with a __name helper that the page does not have */
await page.addInitScript({ content: 'window.__name = function (f) { return f; };' });
await noHmr(page);
await page.goto(GAME);
const t0 = Date.now();
const res = await page.evaluate(async (path) => {
  const m = await import(/* @vite-ignore */ path);
  return m.renderMusic(48000) as Promise<{ wav: string; peak: number; rms: number[] }>;
}, '/tools/promo/music.ts');
fs.mkdirSync('promo/work', { recursive: true });
fs.writeFileSync('promo/work/music.wav', Buffer.from(res.wav, 'base64'));
console.log('rendered in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s, peak ' + res.peak.toFixed(3));
console.log('dBFS rms per bar: ' + res.rms.map((r, i) => i + ':' + r).join(' '));
await browser.close();
