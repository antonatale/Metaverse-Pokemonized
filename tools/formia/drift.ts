/* How far each place ended up from where it really is, in tiles: npx tsx tools/formia/drift.ts */
import { PLACES } from '../../src/data/maps/formia-places';
import { FORMIA_AT } from '../../src/data/maps/formia-ground';
import { col, row } from '../../src/data/maps/formia-projection';
for (const p of PLACES) {
  const a = FORMIA_AT[p.id]; if (!a) { console.log(p.id, 'MISSING'); continue; }
  const x0 = Math.round(col(p.at[1]) - p.w / 2), y0 = Math.round(row(p.at[0]) - p.h / 2);
  console.log(p.id.padEnd(18), 'want', x0 + ',' + y0, 'got', a.x + ',' + a.y, 'off', Math.max(Math.abs(a.x - x0), Math.abs(a.y - y0)));
}
