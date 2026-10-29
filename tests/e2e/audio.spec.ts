import { test, expect } from '@playwright/test';

/* Sound can't be listened to in a test, so: every track and effect is rendered offline in the browser and
   measured (not silent, not clipping), and the live switch is checked (on by default, off remembered). */

test('every track and every effect renders: audible, never clipping', async ({ page }) => {
  await page.goto('/');
  const levels = await page.evaluate(async () => {
    /* the dev server serves the modules as they are */
    const load = (p: string) => import(/* @vite-ignore */ p);
    const { TRACKS } = await load('/src/audio/tracks.ts');
    const { renderTrack } = await load('/src/audio/music.ts');
    const { renderSfx, SFX_NAMES } = await load('/src/audio/sfx.ts');
    const measure = async (len: number, draw: (c: OfflineAudioContext, out: AudioNode) => void) => {
      const c = new OfflineAudioContext(1, Math.ceil(44100 * len), 44100);
      /* the same gains the live graph has: music 0.42 or effects 0.7 into a compressor */
      const out = c.createGain(), comp = c.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      out.connect(comp); comp.connect(c.destination);
      draw(c, out);
      const d = (await c.startRendering()).getChannelData(0);
      let peak = 0, sum = 0;
      for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > peak) peak = v; sum += d[i] * d[i]; }
      return { peak: +peak.toFixed(3), rms: +Math.sqrt(sum / d.length).toFixed(4) };
    };
    const out: Record<string, { peak: number; rms: number }> = {};
    for (const name of Object.keys(TRACKS)) {
      out['track ' + name] = await measure(12, (c, o) => { const g = c.createGain(); g.gain.value = 0.42; g.connect(o); renderTrack(c, g, name, 0.05); });
    }
    for (const name of SFX_NAMES as string[]) {
      out['sfx ' + name] = await measure(1.6, (c, o) => { const g = c.createGain(); g.gain.value = 0.7; g.connect(o); renderSfx(c, g, name, 0.02); });
    }
    return out;
  });
  console.log(Object.entries(levels).map(([k, v]) => k.padEnd(22) + ' peak ' + v.peak + '  rms ' + v.rms).join('\n'));
  for (const [k, v] of Object.entries(levels)) {
    expect(v.peak, k + ' clips').toBeLessThan(0.99);
    expect(v.peak, k + ' is silent').toBeGreaterThan(k.startsWith('track') ? 0.05 : 0.004);
  }
});

test('sound is on by default, starts with the first tap, and switching it off is remembered', async ({ page }) => {
  /* count the oscillators the game starts */
  await page.addInitScript(() => {
    const W = window as unknown as { __osc: number };
    W.__osc = 0;
    const orig = AudioContext.prototype.createOscillator;
    AudioContext.prototype.createOscillator = function () { W.__osc++; return orig.call(this); };
  });
  const osc = () => page.evaluate(() => (window as unknown as { __osc: number }).__osc);
  await page.goto('/');
  const sw = page.locator('#home .snd');
  await expect(sw).toHaveAttribute('aria-pressed', 'true');
  expect(await osc()).toBe(0);                                  /* nothing before a gesture */
  await page.click('.slot[data-id="valentin"]');
  await page.waitForTimeout(800);
  const playing = await osc();
  expect(playing, 'the home music started').toBeGreaterThan(5);
  await sw.click();
  await expect(sw).toHaveAttribute('aria-pressed', 'false');
  expect(await page.evaluate(() => localStorage.getItem('lotte-tra-amici:audio:v1'))).toBe('{"v":1,"on":false}');
  await page.waitForTimeout(400);
  const after = await osc();
  await page.waitForTimeout(800);
  expect(await osc(), 'silence once switched off').toBe(after);
  await page.reload();
  await expect(page.locator('#home .snd')).toHaveAttribute('aria-pressed', 'false');
  await page.click('.slot[data-id="andrea"]');
  await page.click('#go');
  await page.click('#su-go');
  await page.waitForTimeout(1500);
  expect(await osc(), 'still silent after a reload').toBe(0);
  /* back on from the battle's top bar: the battle music plays */
  await page.click('#battle .snd');
  await page.waitForTimeout(800);
  expect(await osc()).toBeGreaterThan(5);
  expect(await page.evaluate(() => localStorage.getItem('lotte-tra-amici:audio:v1'))).toBe('{"v":1,"on":true}');
});
