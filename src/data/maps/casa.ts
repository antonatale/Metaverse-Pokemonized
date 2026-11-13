import type { MapDef } from './types';
import { FORMIA_AT, FORMIA_SPOT } from './formia-ground';

/* back out in the courtyard of Parco la Fontana; or, through the back door, on the walk of the closed park */
const out = FORMIA_AT.casa.door!, park = FORMIA_SPOT['porta-parco'];

/* Antonio's flat in Parco la Fontana: his room on the left (bed, desk, the robot on the shelf),
   the living room and the kitchen on the right, the window on the gulf. */
export const casa: MapDef = {
  name: 'Casa',
  city: 'formia',
  inside: true,
  rows: [
    'xxxxxxxxxxxx',
    'x5F2x6FFkkkx',
    'x1FFxFFFFFFx',
    'xFFFxFFFFFFx',
    'xFFFFFFFF4FD',
    'x6FFFFFF3FFx',
    'xFFFFFFFFFFx',
    'xxxxxDDxxxxx'
  ],
  signs: [
    { x: 1, y: 1, quiet: true, text: ['Il robot di Sim-to-Real, in carica sullo scaffale.', 'In simulazione funziona sempre.'] },
    { x: 3, y: 1, quiet: true, text: ['Il portatile è aperto su un paper di robotica.', 'Già letto. Due volte.'] },
    { x: 1, y: 2, quiet: true, sleep: true, text: ['Il letto.', 'A Parco la Fontana si dorme bene: di notte si sente solo il treno per Napoli.'] },
    { x: 6, y: 0, quiet: true, text: ['Dalla finestra, al piano terra, si vede il giardino dietro il cancello.', 'Chissà dove porta la strada. Ma si parte da qui.'] },
    { x: 9, y: 1, quiet: true, text: ['In frigo: mozzarella di bufala, olive di Gaeta e una tiella avanzata.'] },
    { x: 8, y: 5, quiet: true, text: ['La PlayStation.', 'Forchetta vuole sempre la rivincita.'] },
    { x: 9, y: 4, quiet: true, text: ['Il divano. Ci si sta in quattro, se nessuno si muove.'] }
  ],
  /* the front door to the garden and the gate on via Amendola; the back door to the park, where the fountain is */
  warps: [{ x: 5, y: 7, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' }, { x: 6, y: 7, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' },
    { x: 11, y: 4, to: 'formia', tx: park[0], ty: park[1] + 1, tdir: 'down' }],
  start: [5, 6, 'up']
};
