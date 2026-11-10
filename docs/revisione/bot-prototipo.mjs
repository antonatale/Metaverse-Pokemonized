/* PROTOTIPO, non uno strumento finito: il giocatore automatico usato per la revisione del 10 novembre 2026
   (vedi REVISIONE.md, task R5, che lo trasforma in tools/playtest/).

   Cosa fa: comincia una storia nuova, segue la freccia della prossima tappa, parla, lotta lasciando scegliere la mossa
   all'IA del gioco, e scrive tappa per tappa livelli, soldi, squadra, lotte vinte e perse. Salta i minigiochi.
   Fin dove arriva: fino al Cisternone (dopo una sconfitta dentro un luogo con enigma non sa ripartire).

   Per farlo girare servono quattro ganci che nel gioco NON ci sono ancora:
     in src/ui/story-screen.ts, dentro WORLD._debug:
       goal: function () { var h = heading(M.id); return h ? { x: h.x, y: h.y, exact: h.exact, id: h.stop.id, text: h.stop.text } : null; },
       stops: function () { return myStops().map(function (q) { return [q.id, q.done()]; }); },
       lv: function () { return JSON.parse(JSON.stringify({ lv: st.lv, money: st.money, badges: st.badges, mons: (st.mons || []).map(function (m) { return m.sp; }), bag: st.bag })); },
       skipStop: function () { var q = nextStop(); st.done = st.done || {}; st.done[q.id] = (st.done[q.id] || 0) + 1; save(); renderHud(); return q.id; },
     in src/ui/battle-screen.ts, dentro UI._debug:
       pick: function (id: string) { onMove(id); },
       info: function () { return S ? { turn: S.turn, phase: S.phase, result: S.result, winner: S.winner, a: S.sides[0].id, b: S.sides[1].id, alv: S.sides[0].lvl, blv: S.sides[1].lvl, story: S.story } : null; },

   Uso: npm run build, poi  node docs/revisione/bot-prototipo.mjs antonio polpino
   (GAME_URL per un altro indirizzo; di base apre dist/index.html da disco). */
import { createRequire } from 'node:module';
import fs from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('@playwright/test');
const URL = process.env.GAME_URL || new globalThis.URL('../../dist/index.html', import.meta.url).href;
const KEY = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
const DV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
export async function runBot({ who = 'antonio', starter = 'polpino', seed = 7, maxIter = 6000, maxLoss = 4, coffee = false, log = () => {} } = {}) {
  const browser = await chromium.launch();
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
    return { ov: !ov.hidden ? ov.className : null, ovText: !ov.hidden ? ov.innerText.slice(0, 160).replace(/\n+/g, ' | ') : '', battle: !b.hidden, pad: !!pad && !pad.classList.contains('off'), P, goal: b.hidden ? window.WORLD._debug.goal() : null, info: !b.hidden ? window.UI._debug.info() : null };
  });
  const stats = { who, starter, steps: 0, pages: 0, battles: [], stops: [], wall: null, errors, iters: 0 };
  let lastGoal = null, lossAt = {}, stuck = 0, lastKey = '', curBattle = null, ovSeen = {}, optSeen = {}, wayUsed = {};
  for (let it = 0; it < maxIter; it++) {
    stats.iters = it;
    const S = await st();
    if (S.battle) {
      if (!curBattle && S.info) curBattle = { goal: lastGoal, a: S.info.a, b: S.info.b, alv: S.info.alv, blv: S.info.blv, covo: S.info.story && S.info.story.covo, wild: !!(S.info.story && S.info.story.wild), trainer: S.info.story && S.info.story.trainer };
      if (S.ov && /result/.test(S.ov)) {
        const inf = S.info || {}; const won = inf.result === 'catch' || (inf.result === 'win' && inf.winner === 0);
        if (curBattle) { curBattle.won = won; curBattle.turns = inf.turn; stats.battles.push(curBattle); if (!won) { const k = curBattle.goal + '|' + curBattle.b; lossAt[k] = (lossAt[k] || 0) + 1; if (lossAt[k] >= maxLoss) { stats.wall = { goal: curBattle.goal, vs: curBattle.b, blv: curBattle.blv, alv: curBattle.alv, losses: lossAt[k] }; } } log((won ? 'WIN ' : 'LOSS ') + JSON.stringify(curBattle)); curBattle = null; }
        for (let k = 0; k < 6; k++) { const btn = await page.$('#overlay button'); if (!btn) break; await btn.click().catch(() => {}); await page.clock.runFor(400); if (!(await st()).battle) break; }
        if (stats.wall) break;
        continue;
      }
      if (S.ov) { const btn = await page.$('#overlay button:not([disabled]):not(#ov-close)'); if (btn) await btn.click().catch(() => {}); else await page.keyboard.press('Escape'); await page.clock.runFor(300); continue; }
      if (S.pad) { const ok = await page.evaluate(() => { const id = window.UI._debug.suggest(); if (id) { window.UI._debug.pick(id); return id; } return null; }); if (!ok) { const mv = await page.$('#pad .mv[data-k]:not([disabled])'); if (mv) await mv.click(); } await page.clock.runFor(200); continue; }
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
    const G = S.goal; if (!G) { stats.end = 'no goal'; break; }
    if (['quiz', 'gelato', 'windsurf', 'volley', 'corsa', 'padel', 'lettino', 'canoa', 'pesca'].includes(G.id)) { const id = await page.evaluate(() => window.WORLD._debug.skipStop()); stats.skipped = (stats.skipped || []).concat(id); log('SKIP activity ' + id); await page.clock.runFor(300); continue; }
    if (G.id !== lastGoal) { const snap = await page.evaluate(() => window.WORLD._debug.lv()); stats.stops.push({ id: G.id, text: G.text, it, lv: snap.lv, money: snap.money, badges: snap.badges.length, mons: snap.mons }); log('STOP ' + G.id + ' :: ' + G.text + ' :: ' + JSON.stringify(snap)); lastGoal = G.id; if (G.id === 'torino' && stats.stops.length > 3) { /* the last stop: try the gate once */ } }
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
    if (!plan && !wayUsed[S.P.map]) {
      const way = await page.evaluate(() => window.WORLD._debug.way());
      if (way && way.length) { wayUsed[S.P.map] = 1; log('WAY of ' + S.P.map + ': ' + way.length + ' steps');
        for (const d of way) { const p0 = await page.evaluate(() => window.WORLD._debug.pos()); if (p0.dialog) { await page.keyboard.press('Enter'); await page.clock.runFor(300); }
          if (p0.dir !== d) { await page.keyboard.down(KEY[d]); await page.keyboard.up(KEY[d]); } await page.keyboard.down(KEY[d]); await page.keyboard.up(KEY[d]);
          for (let q = 0; q < 60; q++) { await page.clock.runFor(25); const p = await page.evaluate(() => { const P = window.WORLD._debug.pos(); return { m: P.moving, b: P.busy, bt: !document.getElementById('battle').hidden }; }); if (p.bt) { stats.wayBroken = (stats.wayBroken || 0) + 1; q = 99; break; } if (!p.m && !p.b) break; }
          stats.steps++; if (!(await page.evaluate(() => document.getElementById('battle').hidden))) break; }
        continue; }
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
  stats.final = await page.evaluate(() => ({ lv: window.WORLD._debug.lv(), stops: window.WORLD._debug.stops() })).catch(() => null);
  await browser.close();
  return stats;
}
if (process.argv[1].endsWith('bot-prototipo.mjs')) {
  const who = process.argv[2] || 'antonio', starter = process.argv[3] || 'polpino';
  const r = await runBot({ who, starter, log: (l) => console.log(l) });
  fs.writeFileSync(`bot-${who}-${starter}.json`, JSON.stringify(r, null, 1));
  console.log('END', r.end, 'WALL', JSON.stringify(r.wall), 'steps', r.steps, 'pages', r.pages, 'battles', r.battles.length, 'iters', r.iters, 'errors', r.errors.slice(0, 5));
}
