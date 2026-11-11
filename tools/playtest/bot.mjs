/* The automatic player (R5 of REVISIONE.md): it starts a new story, follows the arrow of the next stop, talks, fights
   letting the game's AI choose the move, and writes down, stop after stop, levels, money, team, battles won and lost.
   It skips the minigames (and says so). Two ways of playing:
     freccia  — only the arrow: it catches only when a stop asks for a creature more (R10);
     prudente — catches whenever the team is smaller than the stop needs, and after two losses in a row against the
                same one goes to train in the grass of Gianola until the team has grown three levels.
   It stops at the train, or at a wall: the same foe beaten it four times.
   Use: npm run build, then  node tools/playtest/bot.mjs antonio polpino [freccia|prudente]
   (GAME_URL for another address, PW_CHROME for a Chrome to use instead of Playwright's). The report of many games:
   node tools/playtest/report.mjs (tools/playtest/README.md). */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');
const URL = process.env.GAME_URL || new globalThis.URL('../../dist/index.html', import.meta.url).href;
const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export async function runBot({ who = 'antonio', starter = 'polpino', mode = 'freccia', seed = 7, maxIter = 9000, maxLoss = 4, log = () => {} } = {}) {
  const browser = await chromium.launch(process.env.PW_CHROME ? { executablePath: process.env.PW_CHROME } : {});
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.addInitScript(({ seed }) => { let a = seed >>> 0; Math.random = function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }, { seed });
  const T0 = new Date('2026-03-14T10:00:00Z').getTime();
  await page.clock.install({ time: T0 });
  await page.goto(URL);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.clock.pauseAt(T0 + 5000); await page.clock.runFor(1000);
  await page.evaluate(() => window.WORLD._debug.spotting(true));
  await page.click('#go-story'); await page.clock.runFor(500);
  await page.click(`[data-hero="${who}"]`); await page.clock.runFor(1500);
  const st = () => page.evaluate(() => {
    const ov = document.getElementById('overlay'), b = document.getElementById('battle'), pad = document.getElementById('pad');
    const P = window.WORLD._debug.pos();
    const L = window.WORLD._debug.lv();
    return { mons: L.mons.filter((m) => !m.home).length, ov: !ov.hidden ? ov.className : null, ovText: !ov.hidden ? ov.innerText.slice(0, 160).replace(/\n+/g, ' | ') : '', battle: !b.hidden, pad: !!pad && !pad.classList.contains('off'), P, goal: b.hidden ? window.WORLD._debug.goal() : null, info: !b.hidden ? window.UI._debug.info() : null };
  });
  const stats = { who, starter, mode, steps: 0, catches: 0, switches: 0, trained: 0, pages: 0, battles: [], stops: [], wall: null, errors, iters: 0 };
  /* how many creatures the next stop wants: the team stops say it (R10); the careful player wants one more than the
     ones he has until four, from the second stop */
  const NEED = { 'seconda-creatura': 2, 'squadra-cisterna': 3, 'squadra-mamurra': 4 };
  let need = 1;
  const wantMons = () => (mode === 'prudente' ? Math.max(need, Math.min(4, 1 + Math.floor(stats.stops.length / 4))) : need);
  let training = 0, trainFrom = 0, grassFor = '', grassHere = 0;
  let lastGoal = null, lossAt = {}, stuck = 0, lastKey = '', curBattle = null, ovSeen = {}, optSeen = {}, wayUsed = {};
  for (let it = 0; it < maxIter; it++) {
    stats.iters = it;
    const S = await st();
    if (S.battle) {
      if (!curBattle && S.info) curBattle = { goal: lastGoal, a: S.info.a, b: S.info.b, alv: S.info.alv, blv: S.info.blv, covo: S.info.story && S.info.story.covo, wild: !!(S.info.story && S.info.story.wild), trainer: S.info.story && S.info.story.trainer };
      if (S.ov && /result/.test(S.ov)) {
        const inf = S.info || {}; const won = inf.result === 'catch' || (inf.result === 'win' && inf.winner === 0);
        if (inf.result === 'catch') stats.catches++;
        if (curBattle) { curBattle.won = won; curBattle.turns = inf.turn; stats.battles.push(curBattle); if (!won) { const k = curBattle.goal + '|' + curBattle.b; lossAt[k] = (lossAt[k] || 0) + 1; if (mode === 'prudente' && lossAt[k] === 2 && !training) { training = 1; stats.trained++; trainFrom = 0; page.evaluate(() => window.WORLD._debug.lv()).then((L) => { trainFrom = Object.keys(L.lv || {}).filter((q) => /^c\d/.test(q)).map((q) => L.lv[q].lv).sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0); }); }
        if (lossAt[k] >= maxLoss) { stats.wall = { goal: curBattle.goal, vs: curBattle.b, blv: curBattle.blv, alv: curBattle.alv, losses: lossAt[k] }; } } log((won ? 'WIN ' : 'LOSS ') + JSON.stringify(curBattle)); curBattle = null; }
        for (let k = 0; k < 6; k++) { const btn = await page.$('#overlay button'); if (!btn) break; await btn.click().catch(() => {}); await page.clock.runFor(400); if (!(await st()).battle) break; }
        if (stats.wall) break;
        continue;
      }
      if (S.ov) { const btn = await page.$('#overlay button:not([disabled]):not(#ov-close)'); if (btn) await btn.click().catch(() => {}); else await page.keyboard.press('Escape'); await page.clock.runFor(300); continue; }
      if (S.pad && S.info && S.info.story && S.info.story.wild && wantMons(S) > S.mons && S.info.bhp / S.info.bmax < 0.45) {
        const net = await page.evaluate(() => { const b = window.UI._debug.info().bag || {}; const id = Object.keys(b).find((k) => b[k] > 0 && k !== 'tiella' && k !== 'balsamo'); if (id) { window.UI._debug.pick(id); return id; } return null; });
        if (net) { stats.nets = (stats.nets || 0) + 1; await page.clock.runFor(200); continue; }
      }
      if (S.pad) { const ok = await page.evaluate(() => { const id = window.UI._debug.suggest(); if (id) { if (id.indexOf('switch:') === 0) window.__sw = (window.__sw || 0) + 1; window.UI._debug.pick(id); return id; } return null; }); if (!ok) { const mv = await page.$('#pad .mv[data-k]:not([disabled])'); if (mv) await mv.click(); } await page.clock.runFor(200); continue; }
      await page.keyboard.press('Enter'); await page.clock.runFor(400); continue;
    }
    curBattle = null;
    if (S.ov) {
      const done = await page.evaluate((starter) => {
        const ov = document.getElementById('overlay');
        const q = (s) => ov.querySelector(s);
        let b = q('.starter[data-sp="' + starter + '"]') || q('.btn.primary:not([disabled])');
        if (!b) b = Array.from(ov.querySelectorAll('button:not([disabled])')).find((x) => !/^(Chiudi|Ci penso|Indietro|Annulla|Più tardi|No)\b/.test(x.textContent.trim()));
        if (!b) b = q('button:not([disabled])');
        if (b) { b.click(); return b.textContent.trim().slice(0, 40); }
        return null;
      }, starter);
      ovSeen[S.ovText.slice(0, 50)] = (ovSeen[S.ovText.slice(0, 50)] || 0) + 1;
      if (ovSeen[S.ovText.slice(0, 50)] > 25) { stats.end = 'OVERLAY LOOP: ' + S.ovText + ' -> ' + done; break; }
      await page.clock.runFor(400); stats.pages++; continue;
    }
    if (S.P.dialog) {
      if (S.P.opts) {
        const n = optSeen[S.P.text] = (optSeen[S.P.text] || 0) + 1;
        const picked = await page.evaluate((n) => { const bs = Array.from(document.querySelectorAll('#wopts button')); const good = bs.find((b) => /Dodici|43 a\.C|Mola e Castellone|Sant'Erasmo|Lotta!|Sali sul treno/.test(b.textContent)); const b = n === 1 && good ? good : bs[(n - 1) % bs.length]; const t = bs.map((x) => x.textContent).join(' | '); b.click(); return t + ' => ' + b.textContent; }, n);
        if (n <= 3) log('OPT ' + S.P.text.slice(0, 80) + ' :: ' + picked);
        if (n > 40) { stats.end = 'OPTION LOOP ' + S.P.text; break; }
      } else await page.keyboard.press('Enter');
      stats.pages++; await page.clock.runFor(300); continue;
    }
    if (S.P.busy || S.P.moving) { await page.clock.runFor(200); continue; }
    let G = S.goal; if (!G) { stats.end = 'no goal'; break; }
    if (NEED[G.id]) need = Math.max(need, NEED[G.id]);
    /* to the grass: a team stop, a careful player with too few creatures, or training after two losses */
    const levels = (L) => Object.keys(L.lv || {}).filter((k) => /^c\d/.test(k)).map((k) => L.lv[k].lv).sort((a, b) => b - a).slice(0, 3).reduce((a, b) => a + b, 0);
    if (training && levels(await page.evaluate(() => window.WORLD._debug.lv())) >= trainFrom + 3) { log('TRAINED +3'); training = 0; }
    /* not forever: after 400 steps in the rocks for the same stop, it goes on with what it has (and says so) */
    if (grassFor !== G.id) { grassFor = G.id; grassHere = 0; }
    if (grassHere > 400 && !NEED[G.id]) { if (training || S.mons < wantMons()) log('GRASS enough for ' + G.id); training = 0; need = Math.min(need, S.mons); }
    if (S.P.map === 'formia' && grassHere <= 400 && (NEED[G.id] || (S.mons < wantMons() && stats.stops.length > 1) || training)) {
      const h = await page.evaluate(() => window.WORLD._debug.hiding());
      if (h === 'gianola') {
        /* walk up and down in the rocks until something jumps out */
        const d = (stats.steps % 4 < 2) ? 'left' : 'right';
        await page.keyboard.down(KEY[d]); await page.keyboard.up(KEY[d]);
        for (let q = 0; q < 40; q++) { await page.clock.runFor(25); const p = await page.evaluate(() => { const P = window.WORLD._debug.pos(); return { m: P.moving, b: P.busy, d: P.dialog, bt: !document.getElementById('battle').hidden }; }); if (p.bt || p.d) break; if (!p.m && !p.b) break; }
        stats.steps++; stats.grass = (stats.grass || 0) + 1; grassHere++; await page.clock.runFor(100); continue;
      }
      G = { x: 156, y: 62, exact: false, id: G.id + '·erba', text: 'erba di Gianola' };
    }
    if (['quiz', 'gelato', 'windsurf', 'volley', 'corsa', 'padel', 'lettino', 'canoa', 'pesca'].includes(G.id)) { const id = await page.evaluate(() => window.WORLD._debug.skipStop()); stats.skipped = (stats.skipped || []).concat(id); log('SKIP activity ' + id); await page.clock.runFor(300); continue; }
    if (G.id !== lastGoal && G.id.indexOf('·') < 0) { const snap = await page.evaluate(() => window.WORLD._debug.lv()); stats.stops.push({ id: G.id, text: G.text, it, lv: snap.lv, money: snap.money, badges: snap.badges.length, mons: snap.mons }); log('STOP ' + G.id + ' :: ' + G.text + ' :: ' + JSON.stringify(snap)); lastGoal = G.id; if (G.id === 'torino' && stats.stops.length > 3) { /* the last stop: try the gate once */ } }
    /* optional exploit: spend everything on coffee after each loss */
    // route
    const plan = await page.evaluate((G) => {
      const D = window.WORLD._debug, P = D.pos();
      const cand = [[G.x, G.y, null]]; const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
      for (const d of Object.keys(DV)) cand.push([G.x - DV[d][0], G.y - DV[d][1], d]);
      const far = Object.keys(DV).map((d) => [G.x - 2 * DV[d][0], G.y - 2 * DV[d][1], d]);
      let best = null;
      if (!G.exact) { const r0 = D.route(G.x, G.y); if (r0 && r0.length) return { r: r0, face: null, x: G.x, y: G.y }; }
      for (const [x, y, face] of cand) { const r = (x === P.x && y === P.y) ? [] : D.route(x, y); if (r && (!best || r.length < best.r.length)) best = { r, face, x, y }; }
      if (!best) for (const [x, y, face] of far) { const r = (x === P.x && y === P.y) ? [] : D.route(x, y); if (r && (!best || r.length < best.r.length)) best = { r, face, x, y }; }
      return best;
    }, G);
    /* a place with a puzzle: the validator's way, step by step; after a battle on the way, on from where it stopped */
    if (!plan && (wayUsed[S.P.map] || 0) >= 0) {
      const way = await page.evaluate(() => window.WORLD._debug.way());
      const from = wayUsed[S.P.map] || 0;
      if (way && way.length && from < way.length) {
        log('WAY of ' + S.P.map + ': from ' + from + ' of ' + way.length);
        let k = from;
        for (; k < way.length; k++) {
          const d = way[k];
          const p0 = await page.evaluate(() => window.WORLD._debug.pos()); if (p0.dialog) { await page.keyboard.press('Enter'); await page.clock.runFor(300); }
          if (p0.dir !== d) { await page.keyboard.down(KEY[d]); await page.keyboard.up(KEY[d]); }
          await page.keyboard.down(KEY[d]); await page.keyboard.up(KEY[d]);
          let fought = false;
          for (let q = 0; q < 60; q++) { await page.clock.runFor(25); const p = await page.evaluate(() => { const P = window.WORLD._debug.pos(); return { m: P.moving, b: P.busy, bt: !document.getElementById('battle').hidden, d: P.dialog }; }); if (p.bt || p.d) { fought = true; break; } if (!p.m && !p.b) break; }
          stats.steps++;
          if (fought) { k++; break; }
        }
        wayUsed[S.P.map] = k;
        continue;
      }
    }
    const k = S.P.map + ',' + S.P.x + ',' + S.P.y + ',' + G.id;
    if (k === lastKey) stuck++; else { stuck = 0; lastKey = k; }
    if (!plan || stuck > 12) {
      stats.end = 'STUCK at ' + JSON.stringify({ G, P: S.P, plan: !!plan });
      break;
    }
    if (plan.r.length === 0) {
      if (plan.face && S.P.dir !== plan.face) { await page.keyboard.press(KEY[plan.face]); await page.clock.runFor(200); }
      if (!G.exact && plan.face) { await page.keyboard.down(KEY[plan.face]); await page.clock.runFor(250); await page.keyboard.up(KEY[plan.face]); await page.clock.runFor(400); }
      await page.keyboard.press('Enter'); await page.clock.runFor(500); continue;
    }
    for (const d of plan.r.slice(0, 10)) {
      const p0 = await page.evaluate(() => window.WORLD._debug.pos());
      if (p0.dialog || p0.busy) break;
      if (p0.dir !== d) { await page.keyboard.down(KEY[d]); await page.keyboard.up(KEY[d]); }
      await page.keyboard.down(KEY[d]); await page.keyboard.up(KEY[d]);
      for (let q = 0; q < 40; q++) { await page.clock.runFor(25); const p = await page.evaluate(() => { const P = window.WORLD._debug.pos(); return { m: P.moving, b: P.busy, d: P.dialog, bt: !document.getElementById('battle').hidden, ov: !document.getElementById('overlay').hidden }; }); if (p.bt || p.ov || p.d) { q = 99; break; } if (!p.m && !p.b) break; }
      stats.steps++;
      const s2 = await page.evaluate(() => ({ bt: !document.getElementById('battle').hidden, ov: !document.getElementById('overlay').hidden, d: window.WORLD._debug.pos().dialog }));
      if (s2.bt || s2.ov || s2.d) break;
    }
    await page.clock.runFor(100);
  }
  stats.switches = await page.evaluate(() => window.__sw || 0).catch(() => 0);
  stats.final = await page.evaluate(() => ({ lv: window.WORLD._debug.lv(), stops: window.WORLD._debug.stops() })).catch(() => null);
  await browser.close();
  return stats;
}
if (process.argv[1].endsWith('bot.mjs')) {
  const who = process.argv[2] || 'antonio', starter = process.argv[3] || 'polpino', mode = process.argv[4] || 'freccia';
  const r = await runBot({ who, starter, mode, log: (l) => console.log(l) });
  fs.mkdirSync('test-results/playtest', { recursive: true });
  fs.writeFileSync(`test-results/playtest/${who}-${starter}-${mode}.json`, JSON.stringify(r, null, 1));
  console.log('END', r.end, 'WALL', JSON.stringify(r.wall), 'steps', r.steps, 'battles', r.battles.length, 'catches', r.catches, 'errors', r.errors.slice(0, 5));
}
