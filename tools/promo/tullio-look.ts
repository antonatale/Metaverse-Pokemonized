import fs from 'node:fs';
import { launch } from './game';
import { SHARED, GRADIENTS } from '../../src/render/svg/palette';
import { person, defsOf, CSS } from '../../src/render/svg';
import { TULLIO } from './tullio';
/* a look at Tullio's portrait next to Antonio's, to tune it: promo/work/check/tullio.png */
const html = '<style>body{margin:0;background:#2f8f5b;display:flex;gap:20px;padding:20px;font:24px sans-serif;color:#fff}' + CSS + ' .spr{width:420px;height:485px;background:#e9f5ec;border-radius:20px;display:block}</style>' +
  '<svg width="0" height="0" style="position:absolute"><defs>' + SHARED + GRADIENTS + defsOf(TULLIO) + '</defs></svg>' +
  ['smirk', 'grin', 'cool', 'worried'].map((x) => '<div>' + x + person('tullio', x, '', undefined, TULLIO) + '</div>').join('');
const b = await launch();
const p = await b.newPage({ viewport: { width: 1840, height: 530 } });
await p.setContent(html);
fs.mkdirSync('promo/work/check', { recursive: true });
fs.writeFileSync('promo/work/check/tullio.png', await p.screenshot());
await b.close();
