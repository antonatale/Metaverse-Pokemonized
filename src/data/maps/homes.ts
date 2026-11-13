import type { MapDef, Sign, GroundObject, Dir } from './types';
import { FORMIA_AT } from './formia-ground';

/* The homes of the others, inside. Each has its own plan and its own things, so that one look tells whose home it is
   (asked by Antonio, 11 November 2026; the plans come from the work Codex did for him): Valentin's speakers and green
   glasses, Costanzo's lectern and the Roma scarf, Forchetta's cups and racket, Andrea's weights, Zendavid's decks.
   They are made up around what the story already says of each friend: nobody's real home has been looked at.
   In each: the bed is for sleeping (sleep: night to morning, a nap by day), the window looks on what he sees from
   home, and the creatures that are not travelling wait at `pets` (story/maps.ts). */
interface Home {
  id: string; name: string; rows: string[];
  /** shelf, desk, bed, window, fridge, the screen, the sofa: where each is in this plan */
  at: [number, number][];
  text: [string[], string[], string[], string[], string[], string[], string[]];
  /** the rug, and his things on the floor: each is in the way, and says what it is */
  art: (GroundObject & { say?: string[] })[];
  pets: [number, number, Dir][];
}
const rug = (x: number, y: number, w: number, h: number, color: string): GroundObject => ({ kind: 'rug', x, y, w, h, color });
const prop = (text: string, say: string, x: number, y: number, w = 1, h = 1) => ({ kind: 'home-prop', x, y, w, h, text, say: [say] });
function home(s: Home): MapDef {
  const out = FORMIA_AT[s.id].door!, bottom = s.rows.length - 1;
  const signs: Sign[] = s.at.map(([x, y], k) => ({ x, y, quiet: true, text: s.text[k], ...(k === 2 ? { sleep: true } : {}) }));
  for (const a of s.art) if (a.say) for (let y = a.y; y < a.y + (a.h || 1); y++) for (let x = a.x; x < a.x + (a.w || 1); x++) signs.push({ x, y, quiet: true, text: a.say });
  return {
    name: s.name, city: 'formia', inside: true, rows: s.rows, signs, groundObjects: s.art.map(({ say: _say, ...o }) => o), homeSpots: s.pets,
    warps: [5, 6].map((x) => ({ x, y: bottom, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' as const })),
    start: [5, bottom - 1, 'up']
  };
}

export const HOME_MAPS: Record<string, MapDef> = {
  /* the bedroom in a corner, and a big room for the parties */
  'casa-valentin': home({
    id: 'casa-valentin', name: 'Casa di Valentin',
    rows: [
      'xxxxxxxxxxxxxx',
      'x1FFFFxFFkkkFx',
      'xFFFFFxFFFFFFx',
      'xFFFFFxFFFFFFx',
      'xxxFxxxFFFFFFx',
      'xFFFFFFF4FFFFx',
      'xFFFFFFFFFFFFx',
      'x5FF2FFFF3FFFx',
      'xFFFFFFFFFFFFx',
      'xxxxxDDxxxxxxx'
    ],
    at: [[1, 7], [4, 7], [1, 1], [8, 0], [10, 1], [9, 7], [8, 5]],
    text: [
      ['Gli occhiali verdi del King del Verde, in prima fila sullo scaffale.'],
      ['Un biglietto aereo per Copenhagen, piegato in quattro.'],
      ['Il letto.', 'Prima della festa, un pisolino.'],
      ['Dalla finestra si vede l\'ospedale Dono Svizzero, e accanto piazza Risorgimento.'],
      ['In frigo: tutto quello che serve per una festa. Weee.'],
      ['La cassa per la musica. Il volume è già al massimo.'],
      ['Il divano. Dopo le feste ci dormono in tre.']
    ],
    art: [rug(7, 2, 5, 3, 'shutter-a'), prop('glasses', 'Occhiali verdi di riserva. Non si sa mai.', 2, 7), prop('speaker', 'Una cassa alta quanto te.', 10, 7), prop('speaker', 'L\'altra cassa. In due fanno tremare piazza Risorgimento.', 12, 7)],
    pets: [[2, 2, 'down'], [4, 2, 'left'], [7, 2, 'down'], [11, 4, 'left'], [3, 6, 'down'], [10, 8, 'up']]
  }),
  /* a long study down the left side, the lectern at its head */
  'casa-costanzo': home({
    id: 'casa-costanzo', name: 'Casa di Costanzo',
    rows: [
      'xxxxxxxxxxxxxx',
      'x5FF2FFFFkkkFx',
      'xFFFFFxxFFFFFx',
      'xFFFFFxxFFFFFx',
      'x1FFFFxxFFFFFx',
      'xFFFFFxxFFFFFx',
      'xFFFFFFFFFFFFx',
      'xFFFFFFF4F3FFx',
      'xFFFFFFFFFFFFx',
      'xxxxxDDxxxxxxx'
    ],
    at: [[1, 1], [4, 1], [1, 4], [3, 0], [10, 1], [10, 7], [8, 7]],
    text: [
      ['Una pila di giornali, con le pagine della politica sottolineate.'],
      ['Il discorso di domani. Comincia con: GIÀ LO SAI.'],
      ['Il letto.', 'Anche nel sonno, prepara il prossimo comizio.'],
      ['Dalla finestra si vede il campanile di San Giovanni, giù dalla salita.'],
      ['In frigo: la carbonara di ieri. Alla romana.'],
      ['In tv c\'è la Roma. Daje Roma daje.'],
      ['Il divano, con la sciarpa giallorossa sul bracciolo.']
    ],
    art: [rug(8, 3, 4, 3, 'wall-c'), prop('roma', 'La bandiera della Roma, stesa come una reliquia.', 9, 5, 2, 1), prop('papers', 'I volantini del prossimo comizio. Già lo sai.', 2, 2), prop('papers', 'Appunti per un discorso. Tre pagine solo di saluti.', 3, 6)],
    pets: [[2, 3, 'down'], [4, 3, 'left'], [8, 2, 'down'], [11, 3, 'left'], [2, 7, 'down'], [11, 8, 'up']]
  }),
  /* a small house of the borgo: one room around a pillar */
  'casa-forchetta': home({
    id: 'casa-forchetta', name: 'Casa di Forchetta',
    rows: [
      'xxxxxxxxxxxx',
      'x5FFFF2FFFFx',
      'xFFFFFFFkkkx',
      'x1FFFFFFFFFx',
      'xFFFxxFFFFFx',
      'xFFFxxFF4FFx',
      'xFFFFFFFFFFx',
      'x3FFFFFFFFFx',
      'xxxxxDDxxxxx'
    ],
    at: [[1, 1], [6, 1], [1, 3], [8, 0], [9, 2], [1, 7], [8, 5]],
    text: [
      ['Le coppe dei tornei di tennis.', 'Poteva andare peggio.'],
      ['Sul telefono, un messaggio a metà. Nessuno lo capirà.'],
      ['Il letto.', 'Si dorme bene, sotto la Torre di Mola.'],
      ['Dalla finestra si vede via Abate Tosti e, più in là, la Torre di Mola.'],
      ['In frigo: una tiella di scarola. Il più formiano di tutti.'],
      ['La PlayStation, accesa. Vuole sempre la rivincita.'],
      ['Sul divano, la sciarpa biancoazzurra di Forza Formia.']
    ],
    art: [rug(6, 4, 4, 3, 'far2'), prop('trophies', 'Altre coppe. Lo scaffale non bastava.', 2, 1, 2, 1), prop('racket', 'La racchetta da tennis, con il grip appena rifatto.', 2, 5, 1, 2)],
    pets: [[2, 2, 'down'], [4, 2, 'left'], [7, 3, 'down'], [9, 4, 'left'], [3, 6, 'down'], [9, 7, 'up']]
  }),
  /* the big table in the middle, where everybody talks (one at a time) */
  'casa-claudia': home({
    id: 'casa-claudia', name: 'Casa di Claudia',
    rows: [
      'xxxxxxxxxxxx',
      'x5FFFF2FFFFx',
      'xFFFFFFFkkkx',
      'x1FFFFFFFFFx',
      'xFFFxxFFFFFx',
      'xFFFxxFF4FFx',
      'xFFFFFFFFFFx',
      'x3FFFFFFFFFx',
      'xxxxxDDxxxxx'
    ],
    at: [[1, 1], [6, 1], [1, 3], [8, 0], [9, 2], [1, 7], [8, 5]],
    text: [
      ['Libri, tanti. Un segnalibro a metà di ognuno: li legge tutti insieme.'],
      ['Sul tavolo, un foglio con tre nomi: «Padre, Figlio, Spirito».', 'Sotto, a matita: «Il Figlio deve ancora rispondere al vocale dello Spirito».'],
      ['Il letto.', 'Un pisolino prima di Morgana.'],
      ['Dalla finestra si vede la scuola Mattej, dall\'altra parte di via Palazzo, e il parchetto con gli alberi e le altalene.', 'All\'uscita della scuola, qui sotto, è tutto un vociare.'],
      ['In frigo: una tiella di polpo da dividere. Qui si divide sempre.'],
      ['Il giradischi, con un vinile ancora sul piatto.'],
      ['Il divano, con due cuscini: uno per parte. Tavoli separati anche qui.']
    ],
    art: [rug(6, 4, 4, 3, 'shutter-b'), prop('table', 'Il tavolo grande. Ci si siede in sei, e si parla uno alla volta.', 6, 5, 2, 1), prop('plant', 'Una pianta che cresce storta verso la finestra. Nessuno la raddrizza.', 10, 7)],
    pets: [[2, 2, 'down'], [4, 2, 'left'], [7, 3, 'down'], [9, 4, 'left'], [3, 6, 'down'], [9, 7, 'up']]
  }),
  /* half of it is a gym */
  'casa-andrea': home({
    id: 'casa-andrea', name: 'Casa di Andrea',
    rows: [
      'xxxxxxxxxxxxxx',
      'x1FFFxFFFkkkFx',
      'xFFFFxFFFFFFFx',
      'xFFFFxFFFFFFFx',
      'xxxFxxFFFFFFFx',
      'xFFFFFF2FFFFFx',
      'xFFFFFFFFFFFFx',
      'x5FFFFFFF4F3Fx',
      'xFFFFFFFFFFFFx',
      'xxxxxDDxxxxxxx'
    ],
    at: [[1, 7], [7, 5], [1, 1], [7, 0], [10, 1], [11, 7], [9, 7]],
    text: [
      ['Lo scaffale: palline, grip di ricambio, le scarpe da padel in fila.'],
      ['Fogli pieni di calcoli: le probabilità della prossima partita.'],
      ['Il letto.', 'La sveglia è già puntata: palestra presto.'],
      ['Dalla finestra si vede piazza Mattej, e sopra la torre di Castellone.'],
      ['In frigo: porzioni pesate, una per giorno.'],
      ['Un manubrio accanto al televisore. Statisticamente lo usa ogni giorno.'],
      ['Il divano. Ci si siede solo dopo l\'allenamento.']
    ],
    art: [rug(7, 2, 5, 2, 'clay'), prop('weights', 'Manubri, in ordine di peso.', 8, 2, 2, 1), prop('weights', 'Il bilanciere. Il carico di oggi è scritto su un foglio.', 10, 3, 2, 1), prop('racket', 'La racchetta da padel arancione.', 2, 5, 1, 2)],
    pets: [[2, 2, 'down'], [4, 2, 'left'], [7, 4, 'down'], [12, 4, 'left'], [3, 6, 'down'], [10, 8, 'up']]
  }),
  /* the studio takes the big room; the bed is behind a wall, away from the speakers */
  'casa-zendavid': home({
    id: 'casa-zendavid', name: 'Casa di Zendavid',
    rows: [
      'xxxxxxxxxxxxxx',
      'x5FFFF2FFFFFFx',
      'xFFFFFFFx1FFFx',
      'xFFFFFFFxFFFFx',
      'xFFFFFFFxFFFFx',
      'x3FFFFFFxxxFxx',
      'xFFFFFFFFFFFFx',
      'xkkkFFF4FFFFFx',
      'xFFFFFFFFFFFFx',
      'xxxxxDDxxxxxxx'
    ],
    at: [[1, 1], [6, 1], [9, 2], [11, 0], [2, 7], [1, 5], [7, 7]],
    text: [
      ['Le cuffie grosse, sul loro supporto. E altre cuffie grosse, accanto.'],
      ['La console da DJ: Stronger è ancora in pausa.'],
      ['Il letto.', 'Prima di dormire: cuffie, e respiro.'],
      ['Dalla finestra si vede la stazione di Scauri: passa il treno per Formia.'],
      ['In frigo: niente ansia, solo cose buone.'],
      ['Le casse. I vicini ormai lo conoscono per nome.'],
      ['Il divano. Modalità Zen.']
    ],
    art: [rug(2, 2, 5, 3, 'far2'), prop('decks', 'I piatti e il mixer. Le manopole non si toccano.', 2, 3, 3, 1), prop('speaker', 'Una cassa da studio.', 1, 3), prop('speaker', 'L\'altra cassa da studio.', 6, 3)],
    pets: [[2, 2, 'down'], [5, 2, 'left'], [10, 3, 'down'], [11, 4, 'left'], [3, 6, 'down'], [10, 8, 'up']]
  })
};
