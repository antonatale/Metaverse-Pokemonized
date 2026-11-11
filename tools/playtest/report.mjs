/* The report of the automatic player (R5 of REVISIONE.md): plays the games asked for, a few at a time, and writes
   test-results/playtest/report.md. For each game, stop by stop: the three best levels of the team, how many creatures,
   the money, the battles won and lost on the way there; at the end the wall (if any) and what the game never made it
   use (catches, changes, nets, items, Resonance, shops).
   Use: npm run build, then
     node tools/playtest/report.mjs                          the 18 games: 6 protagonists × 3 first creatures, freccia
     node tools/playtest/report.mjs antonio,zendavid gabbi prudente
   Two at a time by default (PLAYTEST_JOBS to change it); PW_CHROME for a Chrome to use instead of Playwright's. */
import fs from 'node:fs';
import { runBot } from './bot.mjs';

const HEROES = ['antonio', 'costanzo', 'andrea', 'valentin', 'forchetta', 'zendavid'];
const STARTERS = ['polpino', 'ramarrino', 'gabbi'];
const arg = (k, all) => (process.argv[k] ? process.argv[k].split(',') : all);
const heroes = arg(2, HEROES), starters = arg(3, STARTERS), modes = arg(4, ['freccia']);
const jobs = Number(process.env.PLAYTEST_JOBS || 2);

const games = [];
for (const mode of modes) for (const who of heroes) for (const starter of starters) games.push({ who, starter, mode });
const out = [];
let next = 0;
async function worker() {
  while (next < games.length) {
    const g = games[next++];
    const t0 = Date.now();
    console.log('start', g.who, g.starter, g.mode);
    const r = await runBot({ ...g, seed: 7 }).catch((e) => ({ ...g, end: 'CRASH ' + e.message, stops: [], battles: [], errors: [] }));
    r.minutes = Math.round((Date.now() - t0) / 6000) / 10;
    out.push(r);
    console.log('done', g.who, g.starter, g.mode, r.wall ? 'wall at ' + r.wall.goal : r.end || 'train');
  }
}
await Promise.all(Array.from({ length: jobs }, worker));

const best3 = (lv) => Object.keys(lv || {}).filter((k) => /^c\d/.test(k)).map((k) => lv[k].lv).sort((a, b) => b - a).slice(0, 3);
let md = '# Il giocatore automatico\n\n' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' · ' + out.length + ' partite · `node tools/playtest/report.mjs`\n\n';
md += '| Chi | Iniziale | Modo | Dove finisce | Tappe | Lotte (perse) | Catture | Cambi | Retini | Allenamenti | Minuti |\n|---|---|---|---|---|---|---|---|---|---|---|\n';
for (const r of out) {
  const lost = r.battles.filter((b) => !b.won).length;
  const train = r.end === 'no goal' && r.stops.length && r.stops[r.stops.length - 1].id === 'torino';
  const where = r.wall ? 'muro: ' + r.wall.goal + ' (' + r.wall.vs + ' Lv ' + r.wall.blv + ')' : train ? 'il treno ✓' : (r.end || '?').slice(0, 80);
  md += `| ${r.who} | ${r.starter} | ${r.mode} | ${where} | ${r.stops.length} | ${r.battles.length} (${lost}) | ${r.catches || 0} | ${r.switches || 0} | ${r.nets || 0} | ${r.trained || 0} | ${r.minutes} |\n`;
}
for (const r of out) {
  md += `\n## ${r.who} con ${r.starter}, ${r.mode}\n\n| Tappa | Squadra (3 migliori) | Creature | Sesterzi | Lotte fin qui (perse) |\n|---|---|---|---|---|\n`;
  r.stops.forEach((s) => {
    const before = r.battles.filter((b, i) => i < r.battles.length && b.goal && r.stops.findIndex((q) => q.id === b.goal) <= r.stops.indexOf(s));
    md += `| ${s.text} | ${best3(s.lv).join(', ') || '—'} | ${(s.mons || []).filter((m) => !m.home).length} | ${s.money || 0} | ${before.length} (${before.filter((b) => !b.won).length}) |\n`;
  });
  const never = [];
  if (!r.catches) never.push('catture'); if (!r.switches) never.push('cambi in lotta'); if (!r.nets) never.push('retini');
  never.push('oggetti da portare', 'Risonanza', 'negozi');   /* the bot does not use them: what a player who follows the arrow is not asked to use */
  md += `\nMai usati: ${never.join(', ')}.` + (r.errors && r.errors.length ? ` Errori: ${r.errors.slice(0, 3).join(' · ')}` : '') + '\n';
}
fs.mkdirSync('test-results/playtest', { recursive: true });
fs.writeFileSync('test-results/playtest/report.md', md);
fs.writeFileSync('test-results/playtest/report.json', JSON.stringify(out, null, 1));
console.log('test-results/playtest/report.md');
