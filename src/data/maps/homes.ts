import type { MapDef, Sign } from './types';
import { FORMIA_AT } from './formia-ground';

/* The homes of the others, inside: the same plan as Antonio's flat (casa.ts), each with its own things. The bed is for
   sleeping (sleep: night to morning, a nap by day), the window looks on what each one sees from home, and the
   creatures that are not travelling wait here (story/maps.ts HOME_SPOTS). */
const ROWS = [
  'xxxxxxxxxxxx',
  'x5F2x6FFkkkx',
  'x1FFxFFFFFFx',
  'xFFFxFFFFFFx',
  'xFFFFFFFF4Fx',
  'x6FFFFFF3FFx',
  'xFFFFFFFFFFx',
  'xxxxxDDxxxxx'
];
/** shelf, desk, bed, window, fridge, the screen, the sofa: in the same places as at Antonio's */
function home(id: string, name: string, t: [string[], string[], string[], string[], string[], string[], string[]]): MapDef {
  const out = FORMIA_AT[id].door!;
  const at: [number, number][] = [[1, 1], [3, 1], [1, 2], [6, 0], [9, 1], [8, 5], [9, 4]];
  const signs: Sign[] = at.map(([x, y], k) => ({ x, y, quiet: true, text: t[k], ...(k === 2 ? { sleep: true } : {}) }));
  return {
    name, city: 'formia', inside: true, rows: ROWS, signs,
    warps: [{ x: 5, y: 7, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' }, { x: 6, y: 7, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' }],
    start: [5, 6, 'up']
  };
}

export const HOME_MAPS: Record<string, MapDef> = {
  'casa-valentin': home('casa-valentin', 'Casa di Valentin', [
    ['Gli occhiali verdi del King del Verde, in prima fila sullo scaffale.'],
    ['Un biglietto aereo per Copenhagen, piegato in quattro.'],
    ['Il letto.', 'Prima della festa, un pisolino.'],
    ['Dalla finestra si vede l\'ospedale Dono Svizzero, e accanto piazza Risorgimento.'],
    ['In frigo: tutto quello che serve per una festa. Weee.'],
    ['La cassa per la musica. Il volume è già al massimo.'],
    ['Il divano. Dopo le feste ci dormono in tre.']
  ]),
  'casa-costanzo': home('casa-costanzo', 'Casa di Costanzo', [
    ['Una pila di giornali, con le pagine della politica sottolineate.'],
    ['Il discorso di domani. Comincia con: GIÀ LO SAI.'],
    ['Il letto.', 'Anche nel sonno, prepara il prossimo comizio.'],
    ['Dalla finestra si vede il campanile di San Giovanni.'],
    ['In frigo: la carbonara di ieri. Alla romana.'],
    ['In tv c\'è la Roma. Daje Roma daje.'],
    ['Il divano, con la sciarpa giallorossa sul bracciolo.']
  ]),
  'casa-forchetta': home('casa-forchetta', 'Casa di Forchetta', [
    ['Le coppe dei tornei di tennis.', 'Poteva andare peggio.'],
    ['Sul telefono, un messaggio a metà. Nessuno lo capirà.'],
    ['Il letto.', 'Si dorme bene, sotto la Torre di Mola.'],
    ['Dalla finestra si vede la Torre di Mola.'],
    ['In frigo: una tiella di scarola. Il più formiano di tutti.'],
    ['La PlayStation, accesa. Vuole sempre la rivincita.'],
    ['Sul divano, la sciarpa biancoazzurra di Forza Formia.']
  ]),
  'casa-andrea': home('casa-andrea', 'Casa di Andrea', [
    ['La racchetta da padel arancione, appesa al muro.'],
    ['Fogli pieni di calcoli: le probabilità della prossima partita.'],
    ['Il letto.', 'La sveglia è già puntata: palestra presto.'],
    ['Dalla finestra si vede piazza Mattei, e sopra la torre di Castellone.'],
    ['In frigo: porzioni pesate, una per giorno.'],
    ['Un manubrio accanto al televisore. Statisticamente lo usa ogni giorno.'],
    ['Il divano. Ci si siede solo dopo l\'allenamento.']
  ]),
  'casa-zendavid': home('casa-zendavid', 'Casa di Zendavid', [
    ['Le cuffie grosse, sul loro supporto. E altre cuffie grosse, accanto.'],
    ['La console da DJ: Stronger è ancora in pausa.'],
    ['Il letto.', 'Prima di dormire: cuffie, e respiro.'],
    ['Dalla finestra si vede la stazione di Scauri: passa il treno per Formia.'],
    ['In frigo: niente ansia, solo cose buone.'],
    ['Le casse. I vicini ormai lo conoscono per nome.'],
    ['Il divano. Modalità Zen.']
  ])
};
