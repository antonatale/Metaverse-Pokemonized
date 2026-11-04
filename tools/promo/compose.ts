import fs from 'node:fs';
import path from 'node:path';
import { launch, noHmr, GAME } from './game';
import { FRAMES } from './timeline';

/* Renders the trailer's frames: trailer.html from the dev server, frame by frame, into promo/work/frames/00001.jpg…
     npx tsx tools/promo/compose.ts                     the whole film
     npx tsx tools/promo/compose.ts --stills 200,900    single frames, into promo/work/stills, to check a cut
     npx tsx tools/promo/compose.ts --from 860 --to 1250 */
const CLIPS = 'promo/work/clips', OUT = 'promo/work/frames', STILLS = 'promo/work/stills';
const arg = (k: string) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : undefined; };
const stills = arg('--stills') ? arg('--stills')!.split(',').map(Number) : null;
const from = Number(arg('--from') || 0), to = Math.min(FRAMES, Number(arg('--to') || FRAMES));

const manifest: Record<string, number> = {};
for (const d of fs.readdirSync(CLIPS)) {
  const p = path.join(CLIPS, d);
  if (fs.statSync(p).isDirectory()) manifest[d] = fs.readdirSync(p).filter((f) => f.endsWith('.jpg')).length;
}
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console: ' + m.text()); });
await page.addInitScript({ content: 'window.__name = function (f) { return f; };' });
await noHmr(page);
/* the clips are served from disk, not by the dev server */
await page.route('**/clips/**', (route) => {
  const rel = decodeURIComponent(new URL(route.request().url()).pathname.replace(/^\/clips\//, ''));
  if (rel === 'manifest.json') return route.fulfill({ contentType: 'application/json', body: JSON.stringify(manifest) });
  const file = path.join(CLIPS, rel);
  return fs.existsSync(file) ? route.fulfill({ path: file }) : route.fulfill({ status: 404, body: '' });
});
await page.goto(GAME + 'tools/promo/trailer.html?compose');
await page.evaluate(() => (window as unknown as { trailer: { ready: Promise<number> } }).trailer.ready);
const render = (f: number) => page.evaluate((n) => (window as unknown as { trailer: { renderAt(f: number): Promise<void> } }).trailer.renderAt(n), f);

const t0 = Date.now();
if (stills) {
  fs.mkdirSync(STILLS, { recursive: true });
  for (const f of stills) { await render(f); fs.writeFileSync(path.join(STILLS, 'f' + String(f).padStart(5, '0') + '.jpg'), await page.screenshot({ type: 'jpeg', quality: 85 })); }
  console.log(stills.length + ' stills in ' + STILLS);
} else {
  if (from === 0) fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (let f = from; f < to; f++) {
    await render(f);
    fs.writeFileSync(path.join(OUT, String(f + 1).padStart(5, '0') + '.jpg'), await page.screenshot({ type: 'jpeg', quality: 93 }));
    if ((f + 1) % 150 === 0) console.log('  ' + (f + 1) + ' / ' + to + ' frames, ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
  }
  console.log((to - from) + ' frames in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
}
await browser.close();
