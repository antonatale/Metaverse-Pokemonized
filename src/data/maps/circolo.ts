import type { MapDef, Thing } from './types';
import { FORMIA_AT } from './formia-ground';
import { ABOVE } from './covi-floors';

/* back out on the street, in front of the covered courts of the Bruno Zauli */
const out = FORMIA_AT.tennis.door!;

/* Inside the covered courts of the Bruno Zauli, Forchetta's covo: since the night of the echo, the Tempio della Terra
   Rossa (13 November 2026). First the hall where the clay slides like ice and carries whoever steps on it back to the
   door, but for a winding line of good ground; then his court, the net, and Forchetta on the far side, who never misses.
   The terra rossa is the clay of the court and a pigment of his palette: around the court his atelier (the easel, the
   palette, the canvases) and his lab of biomedical engineering (the microscope, a prosthetic leg, the heart monitor) */
const ROWS = [
  'xxxxxxxxxxxxxx',
  'x@FFFFFFFFFF@x',
  'xFccccccccccFx',
  'xFccccccccccFx',
  'xFccccccccccFx',
  'x@nnnnnnnnnn@x',
  'xFccccccccccFx',
  'xFccccccccccFx',
  'x@FFFFFFFFFF@x',
  'xxxxxxFFxxxxxx',
  'xccccccccccccx',
  'xccccccccccccx',
  'xccccccccccccx',
  'xccccccccccccx',
  'x@FFFFFFFFFF@x',
  'xFFFFFFFFFFFFx',
  'xxxxxxDDxxxxxx'
];
/* the good ground across the sliding clay: up from the left, across, and up to the door of the court */
const SAFE = ['2,13', '2,12', '3,12', '4,12', '4,11', '4,10', '5,10', '6,10', '7,10'];
/* the corners nobody can step on (the clay before them carries you off first) stay plain */
const CORNERS = ['1,10', '1,11', '2,10', '9,10', '9,11', '9,12', '10,10', '10,11', '10,12', '11,10', '11,11', '11,12', '12,10', '12,11', '12,12', '12,13'];
const CLAY: Thing[] = [];
for (let y = 10; y <= 13; y++) for (let x = 1; x <= 12; x++) if (SAFE.indexOf(x + ',' + y) < 0 && CORNERS.indexOf(x + ',' + y) < 0) CLAY.push({ k: 'slide', x, y, dir: 'down' });

export const circolo: MapDef = {
  name: 'Il Tempio della Terra Rossa',
  city: 'formia',
  inside: true,
  theme: 'forchetta',
  rows: ROWS,
  groundObjects: [{ kind: 'court', x: 2, y: 2, w: 10, h: 6 }, { kind: 'stairs', x: 12, y: 6, text: 'up' }, { kind: 'scoreboard', x: 5, y: 0, w: 4, text: '15 – 0' },
    { kind: 'covo-prop', x: 1, y: 1, w: 1, h: 1, text: 'trophy' }, { kind: 'covo-prop', x: 12, y: 1, w: 1, h: 1, text: 'ballmachine' },
    { kind: 'covo-prop', x: 1, y: 8, w: 1, h: 1, text: 'easel' }, { kind: 'covo-prop', x: 12, y: 8, w: 1, h: 1, text: 'umpire' },
    { kind: 'covo-prop', x: 1, y: 14, w: 1, h: 1, text: 'canvases' }, { kind: 'covo-prop', x: 12, y: 14, w: 1, h: 1, text: 'microscope' },
    { kind: 'covo-prop', x: 1, y: 5, w: 1, h: 1, text: 'palette' }, { kind: 'covo-prop', x: 12, y: 5, w: 1, h: 1, text: 'prosthesis' }],
  signs: [
    { x: 12, y: 8, quiet: true, text: ['La sedia dell\'arbitro. Sopra, un cartello: «Poteva andare peggio».'] },
    { x: 1, y: 8, quiet: true, text: ['Il cavalletto di Forchetta. Sulla tela, il campo da tennis visto dall\'alto: la terra rossa è dipinta con la terra rossa vera.'] },
    { x: 1, y: 5, quiet: true, text: ['La tavolozza, appoggiata al palo della rete. Tra i colori, la terra rossa del campo: per Forchetta è anche un pigmento.'] },
    { x: 1, y: 14, quiet: true, text: ['Tre tele appoggiate al muro: il golfo da Mola, la Torre al tramonto, un ritratto di Faro il Delfaro.', 'Dietro, in piccolo: «A. Forcina». Il colore è ancora fresco.'] },
    { x: 12, y: 14, quiet: true, text: ['Un microscopio, e sotto un vetrino con scritto «cartilagine, prova 12». Accanto, appunti di ingegneria biomedica fitti fitti.'] },
    { x: 12, y: 5, quiet: true, text: ['Una protesi di gamba stampata in 3D, appena uscita dalla stampante. Il cartellino dice: «Per il raccattapalle. Poteva andare peggio».'] }
  ],
  /* the stairs to the floors above (27 November 2026): Forchetta now waits on the centre court, two floors up */
  warps: [{ x: 6, y: 16, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' }, { x: 7, y: 16, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' },
    { x: 12, y: 6, to: 'circolo-2', tx: ABOVE['circolo-2'][0], ty: ABOVE['circolo-2'][1], tdir: 'up' }],
  npcs: [
    /* his defenders see whoever comes in, crosses the clay or steps in front of the net; Forchetta is two floors up */
    { id: 'raccattapalle', trainer: 'raccattapalle', name: 'Il modello in posa', seed: 71, x: 10, y: 15, dir: 'left', lines: ['Sono in posa da dodici ore. Se mi muovo, ricomincia il ritratto da capo.'] },
    { id: 'maestro', trainer: 'maestro', name: 'La tecnica di laboratorio', seed: 73, x: 2, y: 15, dir: 'up', lines: ['La terra rossa stanotte è diventata ghiaccio. Guarda bene dove è asciutta.'] },
    { id: 'giudice', trainer: 'giudice', name: 'Giudice di sedia', seed: 72, x: 10, y: 6, dir: 'left', lines: ['Silenzio, prego.'] }
  ],
  start: [6, 15, 'up'],
  place: {
    entry: [6, 15, 'up'],
    goal: [12, 6],
    words: { rest: '', hit: '' },
    things: CLAY
  }
};
