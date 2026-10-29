/* The ORIGINAL scripts, read straight out of legacy/index.html (only while that file exists). */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const LEGACY = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../legacy/index.html');

/** the source of the old <script> that starts with this comment */
export function legacyScript(marker) {
  if (!fs.existsSync(LEGACY)) return null;
  const html = fs.readFileSync(LEGACY, 'utf8');
  const start = html.indexOf(marker);
  if (start < 0) throw new Error('no script starting with ' + marker);
  return html.slice(start, html.indexOf('</script>', start));
}

export function legacyEngine() {
  const src = legacyScript('/* Battle engine v2');
  if (!src) return null;
  const mod = { exports: {} };
  new Function('module', 'window', src)(mod, undefined);
  return mod.exports;
}

/** runs an old script that publishes itself on window, against a fresh object, and returns that object */
export function legacyGlobals(marker) {
  const src = legacyScript(marker);
  if (!src) return null;
  const G = {};
  new Function('window', 'globalThis', src)(G, G);
  return G;
}

/** evaluates one `var NAME = …;` literal of an old script */
export function legacyLiteral(marker, name) {
  const src = legacyScript(marker);
  if (!src) return null;
  const m = src.match(new RegExp('var ' + name + ' = ([\\s\\S]*?);\\n'));
  if (!m) throw new Error('no literal ' + name);
  return new Function('return (' + m[1] + ');')();
}
