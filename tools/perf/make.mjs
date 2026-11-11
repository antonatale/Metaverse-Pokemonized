/* dist/perf.html: the built game with tools/perf/bench.js in front of it (R20, C1 of VISIONE.md).
   npm run perf builds the game and writes it; open the file in a browser and wait about a minute.
   node tools/perf/make.mjs <in.html> <out.html> to put the bench in front of another build. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const src = process.argv[2] || path.join(here, '../../dist/index.html');
const out = process.argv[3] || path.join(path.dirname(src), 'perf.html');
const html = fs.readFileSync(src, 'utf8');
const bench = fs.readFileSync(path.join(here, 'bench.js'), 'utf8');
const at = html.indexOf('<head>');
if (at < 0) throw new Error('no <head> in ' + src);
/* first thing in the head: before the game's module, which runs only once the page is parsed */
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html.slice(0, at + 6) + '\n<script>' + bench.replace(/<\/script/gi, '<\\/script') + '</script>' + html.slice(at + 6));
console.log('written ' + out);
