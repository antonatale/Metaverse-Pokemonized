/* Trims OpenStreetMap downloads of Formia (Overpass "out geom" JSON) to what the map generator uses,
   and writes tools/formia/osm-extract.json. Data © OpenStreetMap contributors, ODbL 1.0.
   Run: node tools/formia/extract.mjs <dir with coast.json, roads.json, areas.json> */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = process.argv[2];
if (!dir) { console.error('usage: node tools/formia/extract.mjs <dir>'); process.exit(1); }
const read = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).elements;
const r5 = (n) => Math.round(n * 1e5) / 1e5;
const line = (g) => (g || []).map((p) => [r5(p.lat), r5(p.lon)]);
const out = { note: 'Formia, from OpenStreetMap. Data © OpenStreetMap contributors, available under the Open Database License (ODbL 1.0).', coast: [], roads: [], rail: [], areas: [] };

for (const e of read('coast.json')) out.coast.push(line(e.geometry));
const ROADS = /^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|pedestrian|living_street)$/;
for (const e of read('roads.json')) {
  const t = e.tags || {};
  if (t.railway === 'rail') { out.rail.push({ tunnel: t.tunnel === 'yes', bridge: t.bridge === 'yes', usage: t.usage || t.service || '', pts: line(e.geometry) }); continue; }
  if (!ROADS.test(t.highway || '')) continue;
  out.roads.push({ hw: t.highway, name: t.name || '', tunnel: t.tunnel === 'yes', bridge: t.bridge === 'yes', pts: line(e.geometry) });
}
for (const e of read('areas.json')) {
  const t = e.tags || {};
  const kind = t.natural || t.leisure || t.landuse || t.man_made || '';
  let rings = [];
  if (e.type === 'way') rings = [line(e.geometry)];
  else if (e.type === 'relation') rings = (e.members || []).filter((m) => m.geometry && m.role !== 'inner').map((m) => line(m.geometry));
  else continue;
  out.areas.push({ kind, sport: t.sport || '', name: t.name || '', rings });
}
const file = path.join(path.dirname(fileURLToPath(import.meta.url)), 'osm-extract.json');
fs.writeFileSync(file, JSON.stringify(out));
console.log('coast', out.coast.length, 'roads', out.roads.length, 'rail', out.rail.length, 'areas', out.areas.length, '→', (fs.statSync(file).size / 1024).toFixed(0) + ' KB');
