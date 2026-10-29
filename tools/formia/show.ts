/* Prints a piece of the generated ground with coordinates: npx tsx tools/formia/show.ts x0 x1 y0 y1 */
import { FORMIA_ROWS } from '../../src/data/maps/formia-ground';
const [x0, x1, y0, y1] = process.argv.slice(2).map(Number);
let h = '    ', u = '    ';
for (let x = x0; x < x1; x++) { h += x % 10 === 0 ? String(Math.floor(x / 10) % 10) : ' '; u += x % 10; }
console.log(h); console.log(u);
for (let y = y0; y < y1; y++) console.log(String(y).padStart(3) + ' ' + FORMIA_ROWS[y].slice(x0, x1));
