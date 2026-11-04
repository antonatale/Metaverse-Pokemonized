import fs from 'node:fs';
import path from 'node:path';
import { launch } from './game';

/* Contact sheets of the recorded clips, to check them at a glance: promo/work/sheets/<clip>.jpg, 12 frames each.
     npx tsx tools/promo/sheet.ts [clip…] */
const di = process.argv.indexOf('--dir');
const DIR = di > 0 ? path.dirname(process.argv[di + 1]) : 'promo/work/clips', OUT = 'promo/work/sheets';
if (di > 0) process.argv.splice(di, 2, path.basename(process.argv[di + 1]));
fs.mkdirSync(OUT, { recursive: true });
const multi = process.argv.includes('--multi');
const plain = process.argv.slice(2).filter((a, i, all) => !a.startsWith('--') && all[i - 1] !== '--range');
const names = plain.length ? plain : fs.readdirSync(DIR).filter((d) => fs.statSync(path.join(DIR, d)).isDirectory());
const browser = await launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 900 } });
/* --multi: one sheet, four frames of each clip per row */
if (multi) {
  const rows = names.map((n) => {
    const files = fs.readdirSync(path.join(DIR, n)).filter((f) => f.endsWith('.jpg')).sort();
    const pick = [0, 1, 2, 3].map((i) => files[Math.round(i * (files.length - 1) / 3)]).filter(Boolean);
    return '<h1>' + n + ' · ' + files.length + '</h1><div class="g">' + pick.map((f) => '<img src="data:image/jpeg;base64,' + fs.readFileSync(path.join(DIR, n, f)).toString('base64') + '">').join('') + '</div>';
  }).join('');
  await page.setContent('<style>body{margin:0;background:#111;color:#eee;font:13px sans-serif}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:0 4px}img{width:100%;display:block}h1{margin:4px;font-size:13px}</style>' + rows);
  await page.waitForTimeout(150);
  fs.writeFileSync(path.join(OUT, 'multi.jpg'), await page.screenshot({ type: 'jpeg', quality: 78, fullPage: true }));
  console.log('multi: ' + names.length + ' clips');
}
for (const n of multi ? [] : names) {
  const files = fs.readdirSync(path.join(DIR, n)).filter((f) => f.endsWith('.jpg')).sort();
  if (!files.length) { console.log(n + ': empty'); continue; }
  /* --range a,b: twelve frames between a and b only */
  const ri = process.argv.indexOf('--range'), rg = ri > 0 ? process.argv[ri + 1].split(',').map(Number) : [1, files.length];
  const sel = files.slice(rg[0] - 1, rg[1]);
  const pick = Array.from({ length: Math.min(12, sel.length) }, (_, i) => sel[Math.round(i * (sel.length - 1) / Math.max(1, Math.min(12, sel.length) - 1))]);
  const cells = pick.map((f) => '<figure><img src="data:image/jpeg;base64,' + fs.readFileSync(path.join(DIR, n, f)).toString('base64') + '"><figcaption>' + f + '</figcaption></figure>').join('');
  await page.setContent('<style>body{margin:0;background:#111;color:#eee;font:14px sans-serif}.g{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:6px}img{width:100%;display:block}figure{margin:0}h1{margin:6px;font-size:16px}</style><h1>' + n + ' · ' + files.length + ' frames</h1><div class="g">' + cells + '</div>');
  await page.waitForTimeout(100);
  fs.writeFileSync(path.join(OUT, n + '.jpg'), await page.screenshot({ type: 'jpeg', quality: 80, fullPage: true }));
  console.log(n + ': ' + files.length + ' frames');
}
await browser.close();
