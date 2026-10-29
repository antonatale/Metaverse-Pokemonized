/* Where real places fall on the map: npx tsx tools/formia/where.ts */
import { tile } from '../../src/data/maps/formia-projection';
export const REAL: [string, number, number][] = [
  ['casa: Via Giovanni Amendola', 41.26348, 13.64175], ['Palamendola', 41.2636, 13.6419], ['area cani', 41.2633, 13.6407], ['campo calcio Amendola', 41.2611, 13.6397],
  ['Via Acqualonga sud', 41.2625, 13.6403], ['Spiaggia di Vindicio', 41.2476, 13.5859], ['Lido La Scogliera', 41.2447, 13.5792], ['pineta (forest)', 41.2479, 13.5695],
  ['Vindicio', 41.2492, 13.5871], ['Tomba di Cicerone', 41.2516, 13.5787], ['Caposele', 41.2509, 13.5980], ['Largo Gallinaro', 41.2505, 13.5950],
  ["Sant'Erasmo", 41.25573, 13.59883], ['Torre di Castellone', 41.2563, 13.5999], ['Cisternone', 41.25569, 13.60104], ['Museo / Comune', 41.2556, 13.60574],
  ['Stazione', 41.25875, 13.60613], ['Piazza della Vittoria', 41.2553, 13.6060], ['Villa Comunale', 41.2560, 13.6084], ['Formia Marina', 41.2546, 13.6083],
  ['Molo Azzurra', 41.25613, 13.61102], ['Birreria Morgana', 41.25819, 13.61234], ['Torre di Mola', 41.2589, 13.6140], ['Pineta Ginillat', 41.2593, 13.6135],
  ['Mola', 41.26014, 13.6172], ['Largo Paone', 41.2580, 13.6104], ['Via E. Filiberto', 41.2609, 13.6181], ['Parco Gramsci', 41.2616, 13.6250],
  ['CONI Zauli', 41.2632, 13.6293], ['tennis coperti', 41.2644, 13.6276], ['Santo Janni', 41.25953, 13.65521], ['Gianola', 41.2602, 13.6590],
  ['Lido Oriente', 41.2536, 13.6644], ['Villa di Mamurra', 41.25017, 13.66853], ['Porticciolo Romano', 41.24809, 13.67526]
];
if (process.argv[1] && process.argv[1].endsWith('where.ts')) for (const [n, la, lo] of REAL) console.log(tile(la, lo).join(',').padEnd(8), n);
