import fs from 'node:fs';
import { launch, noHmr, GAME } from './game';
/* Renders views of the 3D Formia (city3d.ts) into promo/work/check3d, to choose the cameras of a shot:
     npx tsx tools/promo/city-views.ts '[["porto", "night", "92,6,86", "88,3,42", 42, 5]]'
   each view is [name, day|dusk|night, camera x,y,z, looking at x,y,z, field of view, time in seconds]. */
const VIEWS: [string, string, string, string, number, number][] = JSON.parse(process.argv[2]);
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('pageerror', (e) => console.error('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error(m.type() + ': ' + m.text().slice(0, 200)); });
await page.addInitScript({ content: 'window.__name = function (f) { return f; };' });
await noHmr(page);
fs.mkdirSync('promo/work/check3d', { recursive: true });
for (const [name, mode, pos, look, fov, t] of VIEWS) {
  await page.goto(GAME + 'tools/promo/city-test.html?mode=' + mode + '&pos=' + pos + '&look=' + look + '&fov=' + fov + '&t=' + t);
  await page.waitForFunction(() => (window as unknown as { done?: boolean }).done === true, null, { timeout: 120000 });
  console.log(name, JSON.stringify(await page.evaluate(() => (window as unknown as { times: unknown }).times)));
  fs.writeFileSync('promo/work/check3d/' + name + '.jpg', await page.screenshot({ type: 'jpeg', quality: 85 }));
}
await browser.close();
