import type { GroundObject, MapDef, Npc, Thing } from './types';
import { FORMIA_AT } from './formia-ground';

/* Inside the covi (13 November 2026; data/covo-places.ts says what they are and why one goes in). Each one is a place
   of its keeper, decorated with his things (the `@` tiles are taken by them, drawn by render/canvas/covo.ts), with
   challenges before the keeper: his adepts, who see the player and come to fight (data/adepts.ts, their creatures grow
   with the covo), and a test of his own:
   - Claudia's castle: the «tavoli separati», two thrones in the two wings that must both be sat on (plates) before the
     gates of the hall of the Padre open; one at a time.
   - Antonio's dome: the laser of the lab, switched off from the room on the far side of the core.
   - Andrea's tower: the questions of probability at its two doors (data/quizzes.ts).
   - Valentin's tower: the green mist where the Iele dance, a row at a time; in step with them you cross.
   - Costanzo's palace: the exam of civic education at its two doors.
   - Zendavid's temple: the questions on Kanye at the door of the dance floor.
   - Forchetta's courts (circolo.ts): the red clay that carries you back.
   tests/unit/maps.test.ts walks them, tests/unit/place.test.ts proves the puzzles can be done, and quiz.test.ts the quizzes. */

const prop = (text: string, x: number, y: number, w = 1, h = 1): GroundObject => ({ kind: 'covo-prop', x, y, w, h, text });
const rug = (x: number, y: number, w: number, h: number, color: string): GroundObject => ({ kind: 'rug', x, y, w, h, color });
const banner = (x: number, w: number, text: string, color: string): GroundObject => ({ kind: 'banner', x, y: 0, w, text, color });
function out(building: string, rows: string[]) {
  const d = FORMIA_AT[building].door!, b = rows.length - 1, xs: number[] = [];
  for (let x = 0; x < rows[b].length; x++) if (rows[b][x] === 'D') xs.push(x);
  return xs.map((x) => ({ x, y: b, to: 'formia', tx: d[0], ty: d[1] + 1, tdir: 'down' as const }));
}
/** a defender: he sees the player and comes; standing in a doorway he lets nobody by, and once beaten he steps aside */
const adept = (id: string, name: string, seed: number, x: number, y: number, dir: Npc['dir'], lines: string[], aside?: [number, number]): Npc =>
  ({ id, trainer: id, name, seed, x, y, dir, lines, ...(aside ? { aside } : {}) });
const keeper = (id: string, person: Npc['person'], covo: string, x: number, y: number): Npc => ({ id, person, covo, x, y, dir: 'down' });
const gatekeeper = (id: string, name: string, seed: number, x: number, y: number, quiz: string, lines: string[], aside: [number, number]): Npc =>
  ({ id, trainer: id, quiz, name, seed, x, y, dir: 'down', lines, aside });

/* ---------- Claudia: Il Castello del Padre ---------- */
const CLAUDIA_ROWS = [
  'xxxxxxxxxxxxxxxx',
  'x@@FFF@@@FFF@@@x',
  'x@FFFFFFFFFFFF@x',
  'xFFFFFFFFFFFFFFx',
  'x@FFFFFFFFFFFF@x',
  'xxxxxxxFFxxxxxxx',
  'x@FFFFxFFxFFFF@x',
  'xFFFFFxFFxFFFFFx',
  'xFFFFFFFFFFFFFFx',
  'x@FFFFxFFxFFFF@x',
  'xFFFFFxFFxFFFFFx',
  'xxxxxxxFxxxxxxxx',
  'x@FFFFFFFFFFFF@x',
  'xxxxxxxDDxxxxxxx'
];
export const covoClaudia: MapDef = {
  name: 'Il Castello del Padre', city: 'formia', inside: true, theme: 'claudia',
  rows: CLAUDIA_ROWS,
  groundObjects: [
    banner(3, 3, 'UNO', '#d6403a'), banner(10, 3, 'ALLA VOLTA', '#d6403a'),
    rug(7, 2, 2, 3, '#7a1020'), rug(7, 6, 2, 5, '#7a1020'), rug(6, 12, 4, 1, '#7a1020'),
    prop('throne', 6, 1, 3, 1), prop('organ', 1, 1, 2, 1), prop('organ', 12, 1, 3, 1), prop('candles', 1, 2), prop('candles', 14, 2),
    prop('gargoyle', 1, 4), prop('gargoyle', 14, 4), prop('bat', 1, 6), prop('bat', 14, 6), prop('cauldron', 1, 9), prop('cauldron', 14, 9),
    prop('candles', 1, 12), prop('candles', 14, 12), prop('seat', 2, 7), prop('seat', 13, 7)
  ],
  signs: [
    { x: 6, y: 1, quiet: true, text: ['Il trono del Padre: velluto rosso, braccioli a forma di corna.', 'Sullo schienale, inciso: «Ho capito il tuo punto».'] },
    { x: 2, y: 1, quiet: true, text: ['Un organo che suona da solo, piano. Sempre la stessa nota, finché qualcuno non ascolta.'] },
    { x: 1, y: 9, quiet: true, text: ['Un calderone che bolle. Dentro: tè nero. Profuma di cannella.'] }
  ],
  warps: out('casa-claudia', CLAUDIA_ROWS),
  npcs: [
    keeper('claudia-covo', 'claudia', 'morgana', 7, 2),
    adept('diavoletto', 'Diavoletto del castello', 141, 7, 11, 'down', ['Shh. Qui si parla uno alla volta.'], [5, 12]),
    adept('sentinella-nera', 'Sentinella nera', 142, 6, 8, 'right', ['La sedia dell\'ala ovest è del Padre.'], [5, 6]),
    adept('confessore', 'Il Confessore', 143, 9, 8, 'left', ['Ognuno al suo tavolo. Tavoli separati.'], [10, 6])
  ],
  start: [7, 12, 'up'],
  place: {
    entry: [7, 12, 'up'],
    goal: [7, 2],
    words: { rest: '', hit: '' },
    things: [
      /* the two seats of the wings: sitting on both opens the two gates of the corridor, one after the other */
      { k: 'plate', x: 2, y: 7, flag: 'sinistra', once: true },
      { k: 'plate', x: 13, y: 7, flag: 'destra', once: true },
      { k: 'gate', x: 7, y: 7, flag: 'sinistra' }, { k: 'gate', x: 8, y: 7, flag: 'sinistra' },
      { k: 'gate', x: 7, y: 5, flag: 'destra' }, { k: 'gate', x: 8, y: 5, flag: 'destra' }
    ] as Thing[]
  }
};

/* ---------- Antonio: La Cupola, in Parco la Fontana ---------- */
const ANTONIO_ROWS = [
  'xxxxxxxxxxxxxxxx',
  'x@@FFF@@@FFF@@@x',
  'xFFFFFFFFFFFFFFx',
  'x@FFFFFFFFFFFF@x',
  'xxxFxxxxxxxxxxxx',
  'x@FFFFx@@xFFFF@x',
  'xFFFFFx@@xFFFFFx',
  'xFFFFFx@@xFFFFFx',
  'xxFxxxx@@xxxxFxx',
  'xFFFFFFFFFFFFFFx',
  'x@FFFFFFFFFFFF@x',
  'xxxxxxxDDxxxxxxx'
];
export const covoAntonio: MapDef = {
  name: 'La Cupola', city: 'formia', inside: true, theme: 'antonio',
  rows: ANTONIO_ROWS,
  groundObjects: [
    banner(4, 8, 'STATO DELL\'ARTE', '#c3a0ff'),
    rug(5, 2, 6, 1, '#2b2f5e'), rug(6, 9, 4, 2, '#2b2f5e'),
    prop('telescope', 6, 1, 3, 1), prop('server', 1, 1, 2, 1), prop('server', 12, 1, 3, 1), prop('screens', 1, 3), prop('screens', 14, 3),
    prop('hologram', 7, 5, 2, 4), prop('robot-arm', 1, 5), prop('rocket', 14, 5), prop('server', 1, 10), prop('whiteboard', 14, 10)
  ],
  signs: [
    { x: 6, y: 1, quiet: true, text: ['Un telescopio puntato su Marte. Sulla lente, un post-it: «un giorno».'] },
    { x: 7, y: 8, quiet: true, text: ['Un ologramma di Formia che gira piano. Ogni tanto si blocca: «simulazione in corso».'] },
    { x: 14, y: 10, quiet: true, text: ['Una lavagna piena di formule. In fondo, cerchiato tre volte: «Sim-to-Real».'] }
  ],
  warps: out('covo-antonio', ANTONIO_ROWS),
  npcs: [
    keeper('antonio-cupola', 'antonio', 'palamendola', 7, 2),
    adept('assistente', 'Assistente di laboratorio', 151, 3, 3, 'down', ['Benvenuto nella cupola. Ogni visitatore è un dato.'], [4, 2]),
    adept('revisore', 'Il Revisore 2', 152, 2, 8, 'down', ['Sono il Revisore 2.'], [1, 9]),
    adept('dottoranda', 'Dottoranda', 153, 13, 8, 'down', ['Il laser lo spegne la pedana della mia stanza.'], [14, 9])
  ],
  start: [7, 10, 'up'],
  place: {
    entry: [7, 10, 'up'],
    goal: [7, 2],
    words: { rest: '', hit: '' },
    things: [
      /* the laser over the way up, in the west room, is switched off by the pad of the east room, on the other side of
         the core: each room has its defender in the doorway */
      { k: 'plate', x: 13, y: 6, flag: 'laser', once: true },
      { k: 'gate', x: 3, y: 4, flag: 'laser' }
    ] as Thing[]
  }
};

/* ---------- Andrea: La Torre delle Probabilità ---------- */
const ANDREA_ROWS = [
  'xxxxxxxxxxxxxx',
  'x@@FF@@@@FF@@x',
  'xFFFFFFFFFFFFx',
  'x@FFFFFFFFFF@x',
  'xxxxxxFxxxxxxx',
  'x@FFFFFFFFFF@x',
  'xFFFFFFFFFFFFx',
  'xFF@@FFFF@@FFx',
  'xFFFFFFFFFFFFx',
  'xxxxxxFxxxxxxx',
  'xFFFFFFFFFFFFx',
  'x@FFFFFFFFFF@x',
  'xFFFFFFFFFFFFx',
  'xxxxxxDDxxxxxx'
];
export const covoAndrea: MapDef = {
  name: 'La Torre delle Probabilità', city: 'formia', inside: true, theme: 'andrea',
  rows: ANDREA_ROWS,
  groundObjects: [
    banner(4, 6, 'AL 94%', '#9be7c4'),
    rug(5, 2, 4, 2, '#1f5a4a'), rug(1, 6, 12, 1, '#1f5a4a'),
    prop('chalkboard', 5, 1, 4, 1), prop('dice', 1, 1, 2, 1), prop('dice', 11, 1, 2, 1), prop('abacus', 1, 3), prop('plot', 12, 3),
    prop('roulette', 3, 7, 2, 1), prop('roulette', 9, 7, 2, 1), prop('dice', 1, 5), prop('dice', 12, 5), prop('plot', 1, 11), prop('abacus', 12, 11)
  ],
  signs: [
    { x: 5, y: 1, quiet: true, text: ['Una lavagna con una campana di Gauss disegnata col gesso. In cima, una freccia: «io».'] },
    { x: 3, y: 7, quiet: true, text: ['Una roulette. Esce sempre il 17. Andrea dice che è «un campione piccolo».'] }
  ],
  warps: out('casa-andrea', ANDREA_ROWS),
  npcs: [
    keeper('andrea-torre', 'andrea', 'padel', 6, 2),
    gatekeeper('croupier', 'Il Croupier', 161, 6, 9, 'dadi', ['Benvenuto nella torre. Andrea mi paga per tenere chiusa questa porta: si entra solo calcolando.'], [5, 10]),
    gatekeeper('bayesiana', 'La Bayesiana', 162, 6, 4, 'monty', ['Al piano di sopra c\'è lui. Andrea dice che se qualcuno sale la torre crolla: aggiorniamo le tue convinzioni.'], [5, 3]),
    adept('statistico', 'Statistico in tirocinio', 163, 2, 5, 'right', ['Ho fatto un campione di tutti quelli che entrano.']),
    adept('giocatore', 'Il giocatore d\'azzardo', 164, 10, 8, 'left', ['Ho un sistema infallibile.'])
  ],
  start: [6, 12, 'up']
};

/* ---------- Valentin: Turnul Verde, the green tower ---------- */
const VALENTIN_ROWS = [
  'xxxxxxxxxxxxxxxx',
  'x@@FFF@@@FFF@@@x',
  'xFFFFFFFFFFFFFFx',
  'x@FFFFFFFFFFFF@x',
  'xxxxxxxFxxxxxxxx',
  'xFFFFFFFFFFFFFFx',
  'xFFFFFFFFFFFFFFx',
  'xFFFFFFFFFFFFFFx',
  'xFFFFFFFFFFFFFFx',
  'xFFFFFFFFFFFFFFx',
  'xxxxxxxFxxxxxxxx',
  'x@FFFFFFFFFFFF@x',
  'xFFFFFFFFFFFFFFx',
  'xxxxxxxDDxxxxxxx'
];
const MIST: Thing[] = [];
/* three rows of dancers, each its own step of three: whoever goes up in step with them is never caught */
[[6, 2], [7, 1], [8, 0]].forEach(([y, on]) => { for (let x = 1; x <= 14; x++) MIST.push({ k: 'beat', x, y, every: 3, on: [on], look: 'mist' }); });
export const covoValentin: MapDef = {
  name: 'Turnul Verde', city: 'formia', inside: true, theme: 'valentin',
  rows: VALENTIN_ROWS,
  groundObjects: [
    banner(4, 8, 'WEEE!', '#59e07a'),
    rug(6, 2, 4, 2, '#1e5a30'), rug(6, 11, 4, 2, '#1e5a30'),
    prop('icons', 6, 1, 3, 1), prop('loom', 1, 1, 2, 1), prop('loom', 12, 1, 3, 1), prop('brazier', 1, 3), prop('brazier', 14, 3),
    prop('wolf', 1, 11), prop('wolf', 14, 11)
  ],
  signs: [
    { x: 6, y: 1, quiet: true, text: ['Una parete di icone dipinte, verdi e oro, come nei monasteri della Bucovina.', 'In un angolo, piccolissimo, qualcuno ha disegnato Valentin che balla.'] },
    { x: 1, y: 1, quiet: true, text: ['Un telaio con un tappeto a metà: rombi rossi e neri, come quelli dei villaggi dei Carpazi.'] },
    { x: 1, y: 11, quiet: true, text: ['Un lupo di legno intagliato. Sotto: «Lupul. Non morde, balla».'] }
  ],
  warps: out('casa-valentin', VALENTIN_ROWS),
  npcs: [
    keeper('valentin-torre', 'valentin', 'eclipse', 7, 2),
    adept('pastore', 'Il pastore dei Carpazi', 171, 7, 10, 'down', ['Vengo dalle montagne, dove la nebbia è di casa.'], [6, 11]),
    adept('iela', 'La danzatrice della hora', 172, 3, 9, 'right', ['Hora! Si balla in cerchio, tutti insieme.']),
    adept('vrajitoare', 'La vrăjitoare', 173, 7, 4, 'down', ['Ho letto le foglie del tè: c\'è una lotta nel tuo futuro.'], [6, 3])
  ],
  start: [7, 12, 'up'],
  place: {
    entry: [7, 12, 'up'],
    goal: [7, 2],
    words: { rest: 'Le candele: dove brillano, le Iele non ballano. Se ti prendono, si riparte da qui.', hit: 'Le Iele ti prendono per mano, girano, girano… e ti riportano indietro.' },
    things: [{ k: 'rest', x: 7, y: 9 }, { k: 'rest', x: 8, y: 9 }, { k: 'rest', x: 7, y: 5 }, ...MIST]
  }
};

/* ---------- Costanzo: Il Palazzo del Popolo ---------- */
const COSTANZO_ROWS = [
  'xxxxxxxxxxxxxxxx',
  'x@@FFF@@@FFF@@@x',
  'xFFFFFFFFFFFFFFx',
  'x@FFFFFFFFFFFF@x',
  'xxxxxxxFxxxxxxxx',
  'xFFFFFFFFFFFFFFx',
  'xxtttFFFFFFtttxx',
  'xFFFFFFFFFFFFFFx',
  'xxtttFFFFFFtttxx',
  'xFFFFFFFFFFFFFFx',
  'xxxxxxxFxxxxxxxx',
  'x@FFFFFFFFFFFF@x',
  'xFFFFFFFFFFFFFFx',
  'xxxxxxxDDxxxxxxx'
];
export const covoCostanzo: MapDef = {
  name: 'Il Palazzo del Popolo', city: 'formia', inside: true, theme: 'costanzo',
  rows: COSTANZO_ROWS,
  groundObjects: [
    banner(3, 10, 'GIÀ LO SAI', '#ffe45c'),
    rug(6, 2, 4, 2, '#8a1c2b'), rug(7, 5, 1, 5, '#8a1c2b'), rug(6, 11, 4, 2, '#8a1c2b'),
    prop('lectern', 6, 1, 3, 1), prop('flag', 1, 1, 2, 1), prop('flag', 12, 1, 3, 1), prop('bust', 1, 3), prop('bust', 14, 3),
    prop('ballot', 1, 11), prop('megaphone', 14, 11)
  ],
  signs: [
    { x: 6, y: 1, quiet: true, text: ['Il leggio del comizio, con dodici microfoni. Ne funziona uno, ma basta.'] },
    { x: 1, y: 3, quiet: true, text: ['Un busto di marmo con la toga. Sul piedistallo: «GIÀ LO SAI».'] },
    { x: 1, y: 11, quiet: true, text: ['L\'urna delle votazioni. Dentro, cento schede con scritto «Costanzo».'] }
  ],
  warps: out('covo-costanzo', COSTANZO_ROWS),
  npcs: [
    keeper('costanzo-palazzo', 'costanzo', 'piazza', 7, 2),
    gatekeeper('presidente-seggio', 'Il Presidente di seggio', 181, 7, 10, 'costituzione', ['Documento e tessera. Bene. Nella Repubblica di piazza della Vittoria entra solo chi conosce quella vera: l\'esame di educazione civica.'], [6, 11]),
    gatekeeper('costituzionalista', 'La Costituzionalista', 182, 7, 4, 'repubblica', ['Costanzo mi ha nominata garante del comizio: al balcone si sale solo conoscendo le regole.'], [6, 3]),
    adept('usciere', 'L\'usciere', 183, 3, 11, 'right', ['Silenzio in aula!']),
    adept('portaborse', 'Il portaborse', 184, 12, 7, 'left', ['Porto le borse del presidente da dodici ore.']),
    adept('segretaria', 'La segretaria del comizio', 185, 3, 7, 'right', ['Il comizio è all\'ordine del giorno.'])
  ],
  start: [7, 12, 'up']
};

/* ---------- Zendavid: Il Tempio del Basso ---------- */
const ZENDAVID_ROWS = [
  'xxxxxxxxxxxxxxxx',
  'x@@FFF@@@FFF@@@x',
  'xFFFFFFFFFFFFFFx',
  'x@FFFFFFFFFFFF@x',
  'xxxxxxxFxxxxxxxx',
  'x@@@FFFFFFFF@@@x',
  'x@FFFFFFFFFFFF@x',
  'xFFFFFFFFFFFFFFx',
  'x@FFFFFFFFFFFF@x',
  'x@@@FFFFFFFF@@@x',
  'xxxxxxxFxxxxxxxx',
  'x@FFFFFFFFFFFF@x',
  'xFFFFFFFFFFFFFFx',
  'xxxxxxxDDxxxxxxx'
];
export const covoZendavid: MapDef = {
  name: 'Il Tempio del Basso', city: 'formia', inside: true, theme: 'zendavid',
  rows: ZENDAVID_ROWS,
  groundObjects: [
    banner(4, 8, 'BAU', '#ff8fc1'),
    { kind: 'covo-prop', x: 4, y: 5, w: 8, h: 4, text: 'dancefloor' },
    rug(6, 2, 4, 2, '#2a1840'), rug(6, 11, 4, 2, '#2a1840'),
    prop('decks', 6, 1, 3, 1), prop('speakers', 1, 1, 2, 1), prop('speakers', 12, 1, 3, 1), prop('neon', 1, 3), prop('neon', 14, 3),
    prop('speakers', 1, 5, 3, 1), prop('speakers', 12, 5, 3, 1), prop('speakers', 1, 9, 3, 1), prop('speakers', 12, 9, 3, 1),
    prop('vinyl', 1, 6), prop('vinyl', 14, 6), prop('neon', 1, 8), prop('neon', 14, 8), prop('mic', 1, 11), prop('vinyl', 14, 11)
  ],
  signs: [
    { x: 6, y: 1, quiet: true, text: ['La consolle. Sul piatto gira un vinile senza etichetta. Il volume è al massimo. Il massimo è 11.'] },
    { x: 1, y: 6, quiet: true, text: ['Una pila di vinili. Tutti dello stesso artista. Tutti.'] }
  ],
  warps: out('covo-zendavid', ZENDAVID_ROWS),
  npcs: [
    keeper('zendavid-tempio', 'zendavid', 'pineta', 7, 2),
    gatekeeper('dj-pineta', 'Il DJ della pineta', 191, 7, 4, 'ye', ['Fermo. Per salire in consolle, tre domande su Ye. Niente aiuti da casa.'], [6, 3]),
    adept('ballerino', 'Il ballerino', 193, 7, 10, 'down', ['Sulla pista si balla, mica si passa e basta.'], [6, 11]),
    adept('fonico', 'Il fonico', 192, 4, 5, 'right', ['Check, check. Uno, due.']),
    adept('fan', 'La fan in prima fila', 194, 11, 3, 'left', ['Sono qui da ieri sera. Non mi muovo.'])
  ],
  start: [7, 12, 'up']
};

export const COVI_MAPS: Record<string, MapDef> = {
  'covo-claudia': covoClaudia, 'covo-antonio': covoAntonio, 'covo-andrea': covoAndrea, 'covo-valentin': covoValentin,
  'covo-costanzo': covoCostanzo, 'covo-zendavid': covoZendavid
};
