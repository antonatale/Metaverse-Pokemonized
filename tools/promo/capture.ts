import fs from 'node:fs';
import type { Browser, Page } from '@playwright/test';
import { launch, openGame, storySave, Clip, type Game } from './game';
import { prepare, blocked } from '../../src/story/maps';
import { FORMIA_AT, FORMIA_SPOT } from '../../src/data/maps/formia-ground';

/* The game clips of the trailer, played and recorded frame by frame into promo/work/clips/<name>/0001.jpg…
     npx tsx tools/promo/capture.ts             every clip
     npx tsx tools/promo/capture.ts beach porto  only these
   Each clip starts from a prepared save, so it is the same every time. */

const WORK = 'promo/work/clips';
type Save = Record<string, unknown>;
type Dir = 'up' | 'down' | 'left' | 'right';
const KEY: Record<Dir, string> = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const DV: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

/* Cicero keeps quiet: every chapter and every first time already seen */
const TIPS = ['loss', 'level', 'money', 'night', 'wild', 'trainer', 'evolve', 'catch', 'lamo', 'power'];
const STOPS = ['starter', 'trama-scavi', 'padel', 'covo-circolo', 'trama-archivio', 'quiz', 'gelato', 'covo-piazza', 'trama-cisterna', 'trama-mura',
  'item-caricabatterie', 'item-appunti', 'trama-mare', 'windsurf', 'volley', 'item-portafoglio', 'corsa', 'item-passaporto', 'trama-voce', 'trama-mamurra', 'torino'];
const QUIET: Record<string, boolean> = {};
TIPS.forEach((t) => { QUIET['cic-' + t] = true; });
STOPS.forEach((s) => { QUIET['cap-' + s] = true; });

const MONS = [
  { uid: 'c1', sp: 'polpino', bond: 85, nat: 'coraggioso' },
  { uid: 'c2', sp: 'ramarrino', bond: 55, nat: 'robusto' },
  { uid: 'c3', sp: 'gabbi', bond: 45, nat: 'svelto' },
  { uid: 'c4', sp: 'civettina', bond: 30, nat: 'furbo', gold: true },
  { uid: 'c5', sp: 'cicalina', bond: 25, nat: 'sereno' }
];
const LV = { antonio: { lv: 14, xp: 40 }, c1: { lv: 22, xp: 0 }, c2: { lv: 18, xp: 0 }, c3: { lv: 16, xp: 0 }, c4: { lv: 13, xp: 0 }, c5: { lv: 11, xp: 0 } };
const DEX = { polpino: 2, polpetto: 2, ramarrino: 2, ramarrone: 2, gabbi: 2, gabbianotto: 2, civettina: 2, cicalina: 2, riccetto: 1, granchietto: 1, olivella: 1, granchione: 1, cicalona: 1, riccione: 1 };
/** late in the story: the plot done, both covi beaten, a team of five */
const LATE: Save = {
  badges: ['peggio', 'gialosai'], squad: ['antonio', 'forchetta', 'costanzo'],
  beaten: { circolo: true, piazza: true, 'tr-mamurr-scavi': true, 'tr-mamurr-cisterna': true, 'tr-mamurr-peschiere': true, 'tr-mamurra': true, 'tr-animatore': true, 'tr-bambino': true },
  seen: { ...QUIET, 'trama-archivio': true, 'pietra-mura': true, 'pietra-mare': true, 'pietra-voce': true },
  found: { caricabatterie: true, appunti: true, portafoglio: true, passaporto: true },
  done: { padel: 2, quiz: 1, gelato: 3, windsurf: 1, volley: 2, corsa: 1, lettino: 1 }, best: { volley: 7, quiz: 4, windsurf: 42, corsa: 31 },
  mons: MONS, lv: LV, dex: DEX, lead: 'c1', money: 365, bag: { retino: 2, retino2: 3, tiella: 2 }, skills: { passo: 1, legame: 2, mano: 1 }
};
const late = (o: Save = {}): Save => ({ ...LATE, ...o, seen: { ...(LATE.seen as object), ...((o.seen as object) || {}) } });
/** early in the story: the first creature just chosen */
const early = (o: Save = {}): Save => ({ badges: [], squad: ['antonio'], beaten: { 'tr-mamurr-scavi': true }, found: {}, money: 40, bag: { retino: 1, tiella: 1 },
  mons: [{ uid: 'c1', sp: 'polpino', bond: 70, nat: 'coraggioso' }], lv: { c1: { lv: 13, xp: 0 } }, lead: 'c1',
  ...o, seen: { ...QUIET, ...((o.seen as object) || {}) } });

/* Where the clips start and walk to: a named place of formia-places.ts (its door, or its spot) and an offset in
   tiles, moved to the nearest free tile with the game's own rules. So the clips keep working when the map of Formia
   is generated again and the places move a little. */
function P(id: string, dx = 0, dy = 0): { x: number; y: number } {
  const a = FORMIA_AT[id], sp = FORMIA_SPOT[id];
  const base = a ? (a.door || [a.x, a.y]) : sp;
  if (!base) throw new Error('no place called ' + id);
  const m = prepare('formia'), x0 = base[0] + dx, y0 = base[1] + dy;
  for (let r = 0; r < 8; r++) for (let dy2 = -r; dy2 <= r; dy2++) for (let dx2 = -r; dx2 <= r; dx2++) {
    if (Math.max(Math.abs(dx2), Math.abs(dy2)) !== r) continue;
    const x = x0 + dx2, y = y0 + dy2;
    if (!blocked(m, x, y) && !m.at[x + ',' + y]) return { x, y };
  }
  throw new Error('no free tile near ' + id);
}

/* the HUD, the level bars in the corner, Cicero's corner and the battle's top bar are hidden: the trailer writes its
   own words */
const CLEAN = 'html.promo #world .whud > :not(#wtoast), html.promo #world .wbars, html.promo #world .whint, html.promo #world #wcic, html.promo #world #wcic-say { visibility: hidden !important; }' +
  'html.promo #battle .topbar { visibility: hidden !important; }';

/* ---------- playing ---------- */
async function story(browser: Browser, save: Save, o: { hour?: 'giorno' | 'notte' | 'tramonto'; seed?: number; clean?: boolean } = {}): Promise<Game> {
  const g = await openGame(browser, { seed: o.seed ?? 7, storage: storySave(save, o.hour || 'giorno') });
  await g.page.addStyleTag({ content: CLEAN });
  if (o.clean !== false) await g.page.evaluate(() => document.documentElement.classList.add('promo'));
  await g.page.click('#go-story');
  await g.page.clock.runFor(1500);
  /* the trainers who see Antonio stay where they are: nobody walks into a shot to challenge him */
  await g.page.evaluate(() => (window as unknown as { WORLD: { _debug: { spotting(on: boolean): void } } }).WORLD._debug.spotting(false));
  /* nothing jumps out of the grass while we film, and the creature finds nothing; battles get Math.random back (luck(p, null)) */
  await luck(g.page, 0.999);
  return g;
}
type Pos = { x: number; y: number; dir: string; moving: boolean; busy: boolean; dialog: boolean; opts: boolean; map: string; text: string };
const dbg = (p: Page) => ({
  pos: () => p.evaluate(() => (window as unknown as { WORLD: { _debug: { pos(): Pos } } }).WORLD._debug.pos()),
  route: (x: number, y: number) => p.evaluate(([a, b]) => (window as unknown as { WORLD: { _debug: { route(x: number, y: number): Dir[] | null } } }).WORLD._debug.route(a, b), [x, y]),
  spot: (k: string, id: string) => p.evaluate(([a, b]) => (window as unknown as { WORLD: { _debug: { spot(k: string, id: string): { x: number; y: number; dir: Dir } | null } } }).WORLD._debug.spot(a, b), [k, id]),
  meet: (id: string) => p.evaluate((h) => (window as unknown as { WORLD: { _debug: { meet(id: string): void } } }).WORLD._debug.meet(h), id),
  suggest: () => p.evaluate(() => (window as unknown as { UI: { _debug: { suggest(): string } } }).UI._debug.suggest())
});
/** next frame: recorded, or only played */
async function tick(c: Clip, rec: boolean) { if (rec) await c.frame(); else await c.run(33); }
/** walks a route holding the keys, the way a player does; the next key goes down before a step ends, so turns are smooth */
async function walkRoute(c: Clip, dirs: Dir[], rec = true, max = 900) {
  const D = dbg(c.page), start = await D.pos(), path: [number, number][] = [];
  let x = start.x, y = start.y, k = 0, held: Dir | null = null;
  for (const d of dirs) { x += DV[d][0]; y += DV[d][1]; path.push([x, y]); }
  const hold = async (d: Dir | null) => {
    if (d === held) return;
    if (d) await c.page.keyboard.down(KEY[d]);
    if (held) await c.page.keyboard.up(KEY[held]);
    held = d;
  };
  for (let f = 0; f < max && k < path.length; f++) {
    const q = await D.pos();
    if (q.x === path[k][0] && q.y === path[k][1]) k++;
    if (k >= path.length) break;
    await hold(q.moving ? (k + 1 < dirs.length ? dirs[k + 1] : null) : dirs[k]);
    await tick(c, rec);
  }
  await hold(null);
}
async function walkTo(c: Clip, x: number, y: number, rec = true, max = 900) {
  const r = await dbg(c.page).route(x, y);
  if (!r) throw new Error('no route to ' + x + ',' + y);
  await walkRoute(c, r, rec, max);
}
/** to the person, sign or door, facing it */
async function goTo(c: Clip, kind: string, id: string, rec = false) {
  const s = await dbg(c.page).spot(kind, id);
  if (!s) throw new Error('no spot for ' + kind + ' ' + id);
  await walkTo(c, s.x, s.y, rec);
  await settle(c, rec);
  const q = await dbg(c.page).pos();
  if (q.dir !== s.dir) { await c.page.keyboard.down(KEY[s.dir]); await c.page.keyboard.up(KEY[s.dir]); }
  await frames(c, rec, 4);
}
async function settle(c: Clip, rec: boolean) { for (let k = 0; k < 30; k++) { const q = await dbg(c.page).pos(); if (!q.moving && !q.busy) return; await tick(c, rec); } }
async function frames(c: Clip, rec: boolean, n: number) { for (let i = 0; i < n; i++) await tick(c, rec); }
async function enter(c: Clip, rec: boolean, n = 14) { await c.page.keyboard.press('Enter'); await frames(c, rec, n); }
async function talkThrough(c: Clip, rec = false, per = 16, max = 16) {
  for (let k = 0; k < max; k++) { const d = await dbg(c.page).pos(); if (!d.dialog || d.opts) return; await enter(c, rec, per); }
}
async function choose(c: Clip, label: string, rec = false, n = 10) {
  await c.page.locator('#wopts button', { hasText: label }).first().click({ timeout: 4000 });
  await frames(c, rec, n);
}
async function talkTo(c: Clip, id: string, rec = false) { await goTo(c, 'npc', id, rec); await enter(c, rec, 8); }
/** in a battle: 'pad' when a move is wanted, 'over' at the result, '' while it plays */
async function battleState(p: Page) {
  return p.evaluate(() => {
    const ov = document.getElementById('overlay');
    if (ov && !ov.hidden && (ov.classList.contains('result') || ov.classList.contains('pass'))) return 'over';
    const pad = document.getElementById('pad');
    const bt = document.getElementById('battle');
    return pad && !pad.classList.contains('off') && bt && !bt.hidden ? 'pad' : '';
  });
}
async function toPad(c: Clip, rec: boolean, max = 600) { for (let i = 0; i < max; i++) { const s = await battleState(c.page); if (s) return s; await tick(c, rec); } return ''; }
/* a move, clicked the way the page would get it (a click that waits for the button to be still can hang on a paused clock) */
async function move(c: Clip, id?: string) {
  const m = id || await dbg(c.page).suggest();
  await c.page.evaluate((k) => { const b = document.querySelector('#pad .mv[data-id="' + k + '"]') as HTMLButtonElement | null; if (b && !b.disabled) b.click(); }, m);
}
/** plays the battle to its end, without recording */
async function fightOut(c: Clip) {
  for (let t = 0; t < 120; t++) { const s = await toPad(c, false, 3000); if (s !== 'pad') return s; await move(c); }
  return '';
}
/** patches Math.random in the page: a fixed value, a list of values, or back to the seeded one */
async function luck(p: Page, v: number | number[] | null) {
  await p.evaluate((val) => {
    const W = window as unknown as { __rnd?: () => number };
    if (!W.__rnd) W.__rnd = Math.random;
    if (val === null) { Math.random = W.__rnd; return; }
    const list = Array.isArray(val) ? val.slice() : null;
    Math.random = function () { return list ? (list.length ? list.shift()! : W.__rnd!()) : (val as number); };
  }, v);
}

/* ---------- the clips ---------- */
type Shot = (b: Browser) => Promise<void>;
const CLIPS: Record<string, Shot> = {
  /* Formia: Vindicio's beach and the Eclipse, by day */
  async beach(b) {
    const g = await story(b, late({ ...P('eclipse', -5, 1), dir: 'right' }));
    const c = new Clip(g.page, WORK + '/beach'), to = P('eclipse', 5, 5);
    await frames(c, true, 6); await walkTo(c, to.x, to.y, true); await frames(c, true, 10);
    await g.close();
  },
  async castellone(b) {
    const g = await story(b, late({ ...P('forno', -2, 1), dir: 'down' }));
    const c = new Clip(g.page, WORK + '/castellone'), to = P('torre-castellone', 1, 3);
    await walkTo(c, to.x, to.y, true); await frames(c, true, 8);
    await g.close();
  },
  /* the port at the same moment, by day and by night: the street lamps, the lighthouse */
  async porto(b) {
    for (const hour of ['giorno', 'notte'] as const) {
      const g = await story(b, late({ ...P('traghetto', -3, 9), dir: 'right' }), { hour });
      const c = new Clip(g.page, WORK + '/porto-' + hour), to = P('traghetto', 6, 9);
      await frames(c, true, 4); await walkTo(c, to.x, to.y, true); await frames(c, true, 30);
      await g.close();
    }
  },
  async piazza(b) {
    const g = await story(b, late({ ...P('piazza', -1, 5), dir: 'right' }), { hour: 'notte' });
    const c = new Clip(g.page, WORK + '/piazza-notte'), to = P('piazza', 9, 5);
    await walkTo(c, to.x, to.y, true); await frames(c, true, 10);
    await g.close();
  },
  /* the scooter: from home to the Eclipse */
  async scooter(b) {
    const g = await story(b, late({ ...P('motorino', 0, 1), dir: 'up' }));
    const c = new Clip(g.page, WORK + '/scooter');
    await frames(c, true, 8); await enter(c, true, 16);
    await talkThrough(c, true, 10);
    await choose(c, 'Eclipse', true, 70);
    await g.close();
  },
  /* home: Antonio's flat, and a nap until the evening */
  async casa(b) {
    const g = await story(b, late({ map: 'casa', x: 5, y: 6, dir: 'up' }));
    const c = new Clip(g.page, WORK + '/casa');
    await goTo(c, 'sign', 'Il letto', true);
    await enter(c, true, 12); await talkThrough(c, true, 10);
    await choose(c, 'Pisolino', true, 20); await talkThrough(c, true, 14); await frames(c, true, 40);
    await g.close();
  },
  /* the tall grass of Parco Gramsci, the rock pools of Gianola, the pineta: nothing jumps out while we film */
  async grass(b) {
    for (const [name, from, to] of [['grass', P('selv-gramsci', -4, 0), P('selv-gramsci', 3, 0)], ['pools', P('selv-gianola-1', -3, 0), P('selv-gianola-1', 4, 2)],
      ['pineta', P('selv-pineta-1', -3, 0), P('selv-pineta-2', 0, 0)]] as [string, { x: number; y: number }, { x: number; y: number }][]) {
      const g = await story(b, late({ ...from, dir: 'right' }));
      const c = new Clip(g.page, WORK + '/' + name);
      await walkTo(c, to.x, to.y, true); await frames(c, true, 8);
      await g.close();
    }
  },
  /* something moves among the rocks… then the battle */
  async meet(b) {
    const g = await story(b, early({ ...P('selv-gianola-1', 0, -1), dir: 'down' }), { seed: 5 });
    const p = g.page, D = dbg(p);
    const c = new Clip(p, WORK + '/meet');
    await luck(p, null);
    await frames(c, true, 6); await D.meet('gianola'); await frames(c, true, 40);
    await talkThrough(c, true, 14);
    const b2 = new Clip(p, WORK + '/battle');
    await choose(c, 'Lotta!', false, 2);
    await toPad(b2, true);
    await move(b2, 'tentacolata'); await frames(b2, true, 20); await toPad(b2, true);
    await move(b2, 'spruzzo'); await frames(b2, true, 20); await toPad(b2, true, 200);
    await frames(b2, true, 30);
    await g.close();
  },
  /* the guardaparco's three cubs */
  async starters(b) {
    /* from the path north of him: below him the ruins of the villa and the hill close a pocket */
    const g = await story(b, { badges: [], squad: ['antonio'], beaten: {}, found: {}, seen: { ...QUIET, starter: false }, ...P('guardaparco', 0, -2), dir: 'down', mons: [], lv: {} });
    const c = new Clip(g.page, WORK + '/starters');
    await talkTo(c, 'guardaparco', false); await talkThrough(c, false);
    await frames(c, true, 4);
    await choose(c, 'Fammeli vedere', true, 70);
    await g.close();
  },
  /* a net thrown at a tired creature: the first seed that catches it */
  async catch(b) {
    for (let seed = 8; seed < 30; seed++) {
      const g = await story(b, early({ ...P('selv-gramsci', -2, 0), dir: 'right', mons: [{ uid: 'c1', sp: 'gabbi', bond: 50 }], lv: { c1: { lv: 13, xp: 0 } }, bag: { retino2: 4 } }), { seed });
      const p = g.page, D = dbg(p);
      const c = new Clip(p, WORK + '/catch');
      await luck(p, null);
      await D.meet('gramsci'); await c.run(400); await talkThrough(c, false); await choose(c, 'Lotta!', false, 2);
      let ok = false;
      for (let t = 0; t < 12; t++) {
        const s = await toPad(c, true);
        if (s !== 'pad') break;
        const net = p.locator('#pad .mv[data-id="retino2"]:not([disabled])');
        const hp = await p.evaluate(() => { const b0 = document.querySelector('#hp-1 > *') as HTMLElement | null; return b0 ? parseFloat(b0.style.width) : 100; });
        if (hp < 60 && await net.count()) {
          /* the net flies, the creature struggles, then either the result ("Presa!") or the next turn */
          await net.click(); await frames(c, true, 20);
          const after = await toPad(c, true, 300);
          ok = after === 'over' && await p.evaluate(() => { const s0 = document.querySelector('.stamp'); return !!s0 && /^pres/i.test(s0.textContent || ''); });
          if (after !== 'pad') { if (ok) await frames(c, true, 20); break; }
        }
        else await move(c);
      }
      await g.close();
      console.log('  catch seed ' + seed + (ok ? ': caught' : ': got away'));
      if (ok) return;
    }
  },
  /* the creature's sheet: hearts, nature, moves */
  async sheet(b) {
    const g = await story(b, late({ ...P('pescatore', -3, 0), dir: 'down' }));
    const p = g.page;
    const c = new Clip(p, WORK + '/sheet');
    await p.keyboard.press('m'); await c.run(400);
    await p.click('[data-cr="c1"]'); await frames(c, true, 70);
    await g.close();
  },
  /* Polpino becomes Calamastro */
  async evolve(b) {
    const g = await story(b, early({ ...P('selv-gianola-1', 0, -1), dir: 'down', mons: [{ uid: 'c1', sp: 'polpino', bond: 60, nat: 'coraggioso' }], lv: { c1: { lv: 13, xp: 149 } } }), { seed: 5 });
    const p = g.page, D = dbg(p);
    const c = new Clip(p, WORK + '/evolve');
    await luck(p, null);
    await D.meet('gianola'); await c.run(400); await talkThrough(c, false); await choose(c, 'Lotta!', false, 2);
    await fightOut(c);
    await c.run(600);
    await p.click('#st-go'); await c.run(500);
    for (let k = 0; k < 20; k++) {
      if (await p.locator('.evolve').count()) break;
      const d = await D.pos(); if (!d.dialog) { await c.run(200); continue; }
      await p.keyboard.press('Enter'); await c.run(300);
    }
    await frames(c, true, 110);
    await g.close();
  },
  /* the creature behind Antonio finds a slice of tiella */
  async sniff(b) {
    const g = await story(b, late({ ...P('targa-abate-tosti', 3, -1), dir: 'left' }));
    const p = g.page;
    const c = new Clip(p, WORK + '/sniff'), far = P('eclipse', 0, -3);
    const r = await dbg(p).route(far.x, far.y);
    if (!r || r.length < 62) throw new Error('route too short for the sniff: ' + (r && r.length));
    await walkRoute(c, r.slice(0, 52), false);
    await walkRoute(c, r.slice(52, 59), true);
    await luck(p, [0.01, 0.62]);
    await walkRoute(c, r.slice(59, 64), true);
    await luck(p, 0.999);
    await frames(c, true, 50);
    await g.close();
  },
  /* the diary of the creatures, scrolling */
  async dex(b) {
    const g = await story(b, late({ ...P('pescatore', -3, 0), dir: 'down' }));
    const p = g.page;
    const c = new Clip(p, WORK + '/dex');
    await p.keyboard.press('m'); await c.run(400);
    const top = await p.evaluate(() => { const d = document.querySelector('.dex'); const sc = d && d.closest('.sheet'); if (!d || !sc) return 0; return (d as HTMLElement).offsetTop - 140; });
    for (let i = 0; i < 80; i++) {
      await p.evaluate(([y, k]) => { const d = document.querySelector('.dex'); const sc = d && d.closest('.sheet') as HTMLElement; if (sc) sc.scrollTop = y * Math.min(1, k / 50) ** 0.7; }, [top, i]);
      await c.frame();
    }
    await g.close();
  },
  /* Lamo, the king of the Laestrygonians, under the walls at night */
  async lamo(b) {
    const g = await story(b, late({ ...P('selv-lamo', -6, 2), dir: 'right' }), { hour: 'notte' });
    const c = new Clip(g.page, WORK + '/lamo'), to = P('selv-lamo', -1, 2);
    await frames(c, true, 6); await walkTo(c, to.x, to.y, true); await frames(c, true, 30);
    await g.close();
  },
  /* the ghost of Mamurra, at his villa */
  async mamurra(b) {
    const g = await story(b, late({ ...P('mamurra', -2, 5), dir: 'up', beaten: { ...(LATE.beaten as object), 'tr-mamurra': false } }), { hour: 'notte' });
    const c = new Clip(g.page, WORK + '/mamurra');
    await goTo(c, 'npc', 'mamurra', true);
    await enter(c, true, 40); await enter(c, true, 40);
    await g.close();
  },
  /* the lady of the theatre's riddle, and the stone of the walls */
  async stone(b) {
    const g = await story(b, early({ ...P('teatro', -1, 1), dir: 'right', beaten: { 'tr-mamurr-scavi': true, 'tr-mamurr-cisterna': true }, seen: { 'trama-archivio': true, 'pietra-mare': true }, lv: { c1: { lv: 20, xp: 0 } } }));
    const c = new Clip(g.page, WORK + '/stone');
    await talkTo(c, 'teatro', false); await talkThrough(c, false);
    await choose(c, 'Dodici', false); await talkThrough(c, false, 16);
    await frames(c, true, 75);
    await g.close();
  },
  /* Cicero comes when called, at his tomb, at sunset */
  async cicero(b) {
    const g = await story(b, late({ ...P('tomba', 1, -2), dir: 'down', beaten: { circolo: true, piazza: true, 'tr-mamurr-scavi': true, 'tr-mamurr-cisterna': true, 'tr-mamurr-peschiere': true }, seen: { 'pietra-voce': false } }), { hour: 'tramonto' });
    const c = new Clip(g.page, WORK + '/cicero');
    await frames(c, true, 8); await g.page.keyboard.press('c'); await frames(c, true, 80);
    await g.close();
  },
  /* the tour of Formia: the next stop in the corner, the arrow over the man digging at Gianola */
  async tour(b) {
    const g = await story(b, early({ ...P('mamurr-scavi', -4, -2), dir: 'right', beaten: {}, seen: { starter: true } }), { clean: false });
    const c = new Clip(g.page, WORK + '/tour'), to = P('mamurr-scavi', -1, 1);
    await frames(c, true, 6); await walkTo(c, to.x, to.y, true); await frames(c, true, 20);
    await g.close();
  },
  /* Antonio's skills: three paths */
  async skills(b) {
    const g = await story(b, late({ ...P('pescatore', -3, 0), dir: 'down' }));
    const p = g.page;
    const c = new Clip(p, WORK + '/skills');
    await p.keyboard.press('m'); await c.run(400);
    await p.locator('[data-skills]').first().click(); await frames(c, true, 24);
    const sk = p.locator('[data-sk]:not([disabled])');
    if (await sk.count()) { await sk.nth(Math.min(3, (await sk.count()) - 1)).click(); }
    await frames(c, true, 40);
    await g.close();
  },
  /* things to do: beach volley with Valentin, the quiz at Morgana, a gelato, a run in the pineta, the fishmonger's nets */
  async volley(b) {
    const g = await story(b, late({ ...P('valentin', 2, 0), dir: 'left' }));
    const p = g.page;
    const c = new Clip(p, WORK + '/volley');
    await talkTo(c, 'valentin'); await talkThrough(c);
    await choose(c, 'Gioca a beach volley', true, 30);
    await p.keyboard.press(' '); await frames(c, true, 50);
    await p.keyboard.press(' '); await frames(c, true, 30);
    await g.close();
  },
  async quiz(b) {
    const g = await story(b, late({ map: 'morgana', x: 5, y: 7, dir: 'up' }), { hour: 'notte' });
    const c = new Clip(g.page, WORK + '/quiz');
    /* with friends in the party there are more lines before each choice: always talk through first */
    await talkTo(c, 'oste'); await talkThrough(c); await choose(c, 'Siediti al tavolo'); await talkThrough(c); await choose(c, 'Una rossa'); await talkThrough(c);
    await frames(c, true, 50); await choose(c, '', true, 30);
    await g.close();
  },
  async gelato(b) {
    const g = await story(b, late({ ...P('gelataio', -2, 3), dir: 'up' }));
    const c = new Clip(g.page, WORK + '/gelato');
    await talkTo(c, 'gelataio'); await talkThrough(c);
    await choose(c, 'Prendi un gelato', true, 36); await choose(c, '', true, 30); await choose(c, '', true, 30);
    await g.close();
  },
  async corsa(b) {
    const g = await story(b, late({ ...P('zendavid', -3, 0), dir: 'right' }));
    const p = g.page;
    const c = new Clip(p, WORK + '/corsa');
    await talkTo(c, 'zendavid'); await talkThrough(c); await choose(c, 'Corri tra i pini'); await talkThrough(c);
    await c.run(300);
    const flag = await p.evaluate(() => { const W = window as unknown as { WORLD: { state(): { x: number; y: number } } }; return W.WORLD.state(); });
    await frames(c, true, 6);
    const r = await dbg(p).route(flag.x + 6, flag.y);
    if (r) await walkRoute(c, r, true, 70); else await frames(c, true, 60);
    await g.close();
  },
  async shop(b) {
    const g = await story(b, late({ ...P('pescatore', -3, 0), dir: 'right' }));
    const p = g.page;
    const c = new Clip(p, WORK + '/shop');
    await talkTo(c, 'pescatore'); await talkThrough(c);
    await choose(c, 'Compra', true, 24);
    for (let k = 0; k < 2; k++) { await p.click('[data-it="retino2"]'); await frames(c, true, 16); }
    await frames(c, true, 14);
    await g.close();
  },
  /* a covo: Costanzo's rally in piazza della Vittoria, then his badge */
  async covo(b) {
    const g = await story(b, early({ ...P('costanzo', 1, 3), dir: 'up', lv: { antonio: { lv: 22, xp: 0 }, c1: { lv: 19, xp: 0 } } }), { seed: 3 });
    const p = g.page;
    const c = new Clip(p, WORK + '/covo');
    await luck(p, null);
    await talkTo(c, 'costanzo', false); await talkThrough(c, true, 16, 3); await talkThrough(c, false);
    await p.click('#wopts .btn.primary'); await frames(c, true, 60);
    const res = await fightOut(c);
    if (res === 'over') {
      await c.run(600);
      await p.click('#st-go, #st-retry'); await c.run(400);
      const bc = new Clip(p, WORK + '/badge');
      for (let k = 0; k < 20; k++) {
        if (await p.locator('.award').count()) break;
        const d = await dbg(p).pos(); if (d.dialog) await p.keyboard.press('Enter');
        await bc.run(300);
      }
      await frames(bc, true, 70);
    }
    await g.close();
  },
  /* the exam: the boss of the game */
  async boss(b) {
    const g = await openGame(b, { seed: 42, dark: true });
    const p = g.page;
    await p.addStyleTag({ content: CLEAN }); await p.evaluate(() => document.documentElement.classList.add('promo'));
    /* the Esame is one of the foes in the challenge sheet */
    await p.evaluate(() => { (document.querySelector('.slot[data-id="antonio"]') as HTMLElement).click(); document.getElementById('go')!.click(); });
    await p.clock.runFor(300);
    await p.evaluate(() => { (document.querySelector('.pick[data-k="p2"][data-id="esame"]') as HTMLElement).click(); document.getElementById('su-go')!.click(); });
    const c = new Clip(p, WORK + '/boss');
    await toPad(c, true, 200);
    await move(c); await frames(c, true, 20); await toPad(c, true, 200);
    await move(c); await frames(c, true, 20); await toPad(c, true, 200);
    await g.close();
  },
  /* someone digging at Gianola, at night: the mystery of the story, without telling it */
  async dig(b) {
    const g = await story(b, early({ ...P('mamurr-scavi', -4, -2), dir: 'right', beaten: {}, seen: { starter: true } }), { hour: 'notte' });
    const c = new Clip(g.page, WORK + '/dig'), to = P('mamurr-scavi', -1, 1);
    await frames(c, true, 6); await walkTo(c, to.x, to.y, true); await frames(c, true, 40);
    await g.close();
  },
  /* the creatures waiting at home, in Antonio's flat; talk to one and the team can change */
  async home(b) {
    const mons: Record<string, unknown>[] = [...MONS, { uid: 'c6', sp: 'olivella', bond: 35, nat: 'sereno', home: true }, { uid: 'c7', sp: 'granchietto', bond: 30, nat: 'furbo', home: true },
      { uid: 'c8', sp: 'riccetto', bond: 28, nat: 'svelto', home: true }];
    const g = await story(b, late({ map: 'casa', x: 5, y: 6, dir: 'up', mons, lv: { ...LV, c6: { lv: 12, xp: 0 }, c7: { lv: 11, xp: 0 }, c8: { lv: 10, xp: 0 } } }));
    const c = new Clip(g.page, WORK + '/home');
    await frames(c, true, 16);
    await goTo(c, 'npc', 'pet-0', true);
    await enter(c, true, 50);
    await g.close();
  },
  /* swimming with Polpino along the Roman tanks of Gianola */
  async swim(b) {
    const g = await story(b, late({ ...P('selv-gianola-1', 0, 2), dir: 'left' }));
    const p = g.page, c = new Clip(p, WORK + '/swim');
    await p.keyboard.press('ArrowLeft'); await c.run(400);
    await talkThrough(c);
    await choose(c, 'Nuota con', false, 6);
    await frames(c, true, 4); await walkRoute(c, ['left', 'left', 'left', 'left', 'left', 'left'], true); await frames(c, true, 16);
    await g.close();
  },
  /* a gull shows Formia from above */
  async sky(b) {
    const g = await story(b, late({ ...P('pescatore', -3, 0), dir: 'down' }));
    const p = g.page, c = new Clip(p, WORK + '/sky');
    await frames(c, true, 4); await p.keyboard.press('v'); await frames(c, true, 130);
    await g.close();
  },
  /* fishing off the pier with the fisherman of Mola: the float goes under, a pull, a fish */
  async fishing(b) {
    const g = await story(b, late({ ...P('pescatore', -3, 0), dir: 'right' }));
    const p = g.page, c = new Clip(p, WORK + '/fishing');
    await talkTo(c, 'pescatore'); await talkThrough(c);
    await choose(c, 'Pesca dal molo', true, 70);
    await frames(c, true, 14); await p.keyboard.press(' '); await frames(c, true, 50);
    await g.close();
  },
  /* the friends' tournament: five rounds played quickly, then the cup */
  async tourney(b) {
    const strong = { lv: 45, xp: 0 };
    const g = await story(b, late({ ...P('velocista', -1, 2), dir: 'up', lv: { ...LV, antonio: strong, forchetta: strong, costanzo: strong } }), { seed: 13 });
    const p = g.page, c = new Clip(p, WORK + '/tourney');
    await luck(p, null);
    await talkTo(c, 'velocista'); await talkThrough(c);
    await choose(c, 'Iscriviti!');
    for (let round = 0; round < 5; round++) {
      await talkThrough(c, false, 16, 20);
      await p.locator('.pick').first().click(); await c.run(800);
      if (await fightOut(c) !== 'over') throw new Error('round ' + round + ' did not end');
      await c.run(600); await p.click('#st-go'); await c.run(800);
    }
    for (let k = 0; k < 20 && !(await p.locator('#cup-ok').count()); k++) { await p.keyboard.press('Enter'); await c.run(300); }
    await frames(c, true, 60);
    await g.close();
  },
  /* the whole map of Formia, for the trailer's drone shots */
  async overview(b) {
    const g = await story(b, late({}));
    const url = await g.page.evaluate(() => (window as unknown as { WORLD: { _debug: { overview(id: string, s: number): string } } }).WORLD._debug.overview('formia', 1));
    fs.writeFileSync(WORK + '/overview.png', Buffer.from(url.split(',')[1], 'base64'));
    await g.close();
  },
  /* a friendly battle: Forchetta against Zendavid */
  async friends(b) {
    const g = await openGame(b, { seed: 5 });
    const p = g.page;
    await p.addStyleTag({ content: CLEAN }); await p.evaluate(() => document.documentElement.classList.add('promo'));
    await p.evaluate(() => { (document.querySelector('.slot[data-id="forchetta"]') as HTMLElement).click(); document.getElementById('go')!.click(); });
    await p.clock.runFor(300);
    await p.evaluate(() => { (document.querySelector('.pick[data-k="p2"][data-id="zendavid"]') as HTMLElement).click(); document.getElementById('su-go')!.click(); });
    const c = new Clip(p, WORK + '/friends');
    await toPad(c, true, 200);
    await move(c); await frames(c, true, 20); await toPad(c, true, 200);
    await move(c); await frames(c, true, 20); await toPad(c, true, 160);
    await g.close();
  }
};

const browser = await launch();
const want = process.argv.slice(2);
fs.mkdirSync(WORK, { recursive: true });
for (const [name, shot] of Object.entries(CLIPS)) {
  if (want.length && !want.includes(name)) continue;
  const t0 = Date.now();
  try { await shot(browser); console.log(name + ' ok in ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  catch (e) { console.log(name + ' FAILED: ' + (e as Error).message.split('\n')[0]); }
}
await browser.close();
