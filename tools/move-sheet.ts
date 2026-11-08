import fs from 'node:fs';
import path from 'node:path';
import { Clip, launch, openGame, storySave } from './promo/game';
import { CMOVES, SPECIES, type SpeciesId } from '../src/data/creatures';
import type { TypeName } from '../src/data/types';

/* A move, frame by frame, to look at it the way a player does: one contact sheet each, in test-results/moves/<id>.png.
   The dev server must be running (npm run dev), and the animation is the real one, in a real battle.
     npx tsx tools/move-sheet.ts mareggiata aculei      the first 1.6 seconds of each, twelve frames
     npx tsx tools/move-sheet.ts mareggiata --step 200  a frame every 200 ms instead of 130
     npx tsx tools/move-sheet.ts mareggiata --foe       cast by the creature on the other side
     npx tsx tools/move-sheet.ts mareggiata --miss      a move that misses
     npx tsx tools/move-sheet.ts mareggiata --out dir   somewhere else (a test run empties test-results)
   Same Math.random and same frames every time. */
const arg = (name: string, d: number) => { const k = process.argv.indexOf('--' + name); return k > 0 ? +process.argv[k + 1] : d; };
const step = arg('step', 130), n = arg('frames', 12), outAt = process.argv.indexOf('--out'), OUT = outAt > 0 ? process.argv[outAt + 1] : 'test-results/moves';
const ids = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && !(all[i - 1] || '').startsWith('--'));
const flag = (name: string) => process.argv.includes('--' + name);

/** the creature that has a move, as the battle would know it */
function ownerOf(id: string): SpeciesId | null {
  return (Object.keys(SPECIES) as SpeciesId[]).find((s) => SPECIES[s].learn.some((l) => l[1] === id)) || null;
}
fs.mkdirSync(OUT, { recursive: true });
const browser = await launch();
const save = storySave({ mons: [{ uid: 'c1', sp: 'polpetto', moves: ['spruzzo', 'tentacolata'], bond: 60, nat: 'Sereno' }], lv: { c1: { lv: 14, xp: 0 } } });
for (const id of ids) {
  const m = CMOVES[id], sp = ownerOf(id);
  if (!m || !sp) { console.log(id + ': no such move'); continue; }
  const type: TypeName | null = m.plain ? null : m.mtype || SPECIES[sp].type;
  const g = await openGame(browser, { viewport: { width: 1280, height: 800 }, scale: 1, storage: save });
  const c = new Clip(g.page, path.join(OUT, '.frames'));
  await g.page.click('#go-story');
  await c.run(1500);
  await g.page.evaluate(() => (window as unknown as { WORLD: { _debug: { meet(id: string): void } } }).WORLD._debug.meet('gianola'));
  /* the player says Lotta!, and sends in the first creature */
  const fight = async () => g.page.evaluate(() => {
    const b = [...document.querySelectorAll('#wopts button')].find((x) => /Lotta/.test(x.textContent || '')) as HTMLElement | undefined;
    if (b) { b.click(); return true; }
    const p = document.querySelector('.bench-pick:not([disabled])') as HTMLElement | null;
    if (p) p.click();
    return !!p;
  });
  for (let k = 0; k < 120; k++) { await c.run(50); if (await fight()) break; await g.page.keyboard.press('Enter'); }
  for (let k = 0; k < 150 && !(await g.page.evaluate(() => { const b = document.querySelector('#pad .mv:not([disabled]):not([hidden])'); return !!b && !document.getElementById('battle')!.hidden; })); k++) { await c.run(200); await fight(); }
  await c.run(400);
  /* the cast resolves on the hit, and the hit only comes as the frames move the clock: evaluate must not wait for it */
  await g.page.evaluate((o) => { void (window as unknown as { UI: { _debug: { cast(t: unknown, out: string, from: number, x: unknown): void } } }).UI._debug.cast(o.type, o.out, o.from, o.x); }, {
    type, out: flag('miss') ? 'miss' : m.kind === 'status' ? 'none' : 'hit', from: flag('foe') ? 1 : 0,
    x: { id, name: m.name, power: m.power || 60, sig: SPECIES[sp].sig === id || Object.values(SPECIES).some((s) => s.sig === id), drain: !!m.drain, quick: !!m.priority, self: m.kind === 'heal' || m.kind === 'buff' }
  });
  const cells: string[] = [];
  for (let k = 0; k < n; k++) {
    await c.run(step);
    cells.push('<figure><img src="data:image/jpeg;base64,' + (await g.page.screenshot({ type: 'jpeg', quality: 80 })).toString('base64') + '"><figcaption>' + (k + 1) * step + ' ms</figcaption></figure>');
  }
  await g.close();
  const pg = await browser.newPage({ viewport: { width: 1920, height: 1000 } });
  await pg.setContent('<style>body{margin:0;background:#111;color:#eee;font:15px sans-serif}h1{margin:6px 10px;font-size:18px}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}figure{margin:0;position:relative}img{width:100%;display:block}figcaption{position:absolute;left:6px;top:4px;background:#000a;padding:1px 6px;border-radius:4px}</style><h1>' + m.name + ' (' + id + ') · ' + (type || 'senza tipo') + ' · potenza ' + (m.power || 0) + '</h1><div class="g">' + cells.join('') + '</div>');
  await pg.waitForTimeout(120);
  await pg.screenshot({ path: path.join(OUT, id + '.png'), fullPage: true });
  await pg.close();
  console.log(id + ': ' + path.join(OUT, id + '.png'));
}
fs.rmSync(path.join(OUT, '.frames'), { recursive: true, force: true });
await browser.close();
