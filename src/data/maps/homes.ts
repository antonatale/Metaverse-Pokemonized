import type { MapDef, Sign, GroundObject, Dir } from './types';
import { FORMIA_AT } from './formia-ground';

/* Authored interiors: the objects describe the friends already established in the story, not surveyed private homes.
   Every plan has its own rooms and furniture; pet positions are chosen against that plan. */
interface HomeSpec {
  id: string;
  name: string;
  rows: string[];
  props: { x: number; y: number; text: string[]; sleep?: boolean }[];
  art: GroundObject[];
  pets: [number, number, Dir][];
}
function home(s: HomeSpec): MapDef {
  const out = FORMIA_AT[s.id].door!,
    bottom = s.rows.length - 1;
  const signs: Sign[] = s.props.map((p) => ({ ...p, quiet: true }));
  return {
    name: s.name,
    city: 'formia',
    inside: true,
    rows: s.rows,
    signs,
    groundObjects: s.art,
    homeSpots: s.pets,
    warps: [5, 6].map((x) => ({
      x,
      y: bottom,
      to: 'formia',
      tx: out[0],
      ty: out[1] + 1,
      tdir: 'down' as const,
    })),
    start: [5, 6, 'up'],
  };
}
const prop = (x: number, y: number, text: string[], sleep = false) => ({ x, y, text, sleep });
const art = (kind: string, x: number, y: number, w = 1, h = 1, text = '', color?: string): GroundObject => ({
  kind,
  x,
  y,
  w,
  h,
  text,
  color,
});
export const HOME_MAPS: Record<string, MapDef> = {
  'casa-valentin': home({
    id: 'casa-valentin',
    name: 'Casa di Valentin',
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
      'xxxxxDDxxxxxxx',
    ],
    props: [
      prop(1, 1, ['Il letto, dopo l’ultima festa.'], true),
      prop(1, 7, ['Gli occhiali verdi del King del Verde.']),
      prop(4, 7, ['Un biglietto per Copenhagen.']),
      prop(9, 7, ['La cassa per la musica, pronta per gli amici.']),
      prop(9, 1, ['Il frigo per la prossima serata.']),
      prop(8, 5, ['Il divano: c’è sempre posto per qualcuno.']),
      prop(10, 0, ['Dalla finestra, l’ospedale e piazza Risorgimento.']),
    ],
    art: [
      art('rug', 7, 3, 5, 3, '', 'shutter-a'),
      art('home-prop', 2, 3, 1, 1, 'glasses', 'shutter-a'),
      art('home-prop', 10, 7, 1, 1, 'speaker'),
      art('nameplate', 7, 1, 3, 1, 'VALENTIN'),
    ],
    pets: [
      [2, 2, 'down'],
      [4, 2, 'left'],
      [7, 2, 'down'],
      [11, 4, 'left'],
      [3, 6, 'down'],
      [10, 8, 'up'],
    ],
  }),
  'casa-costanzo': home({
    id: 'casa-costanzo',
    name: 'Casa di Costanzo',
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
      'xxxxxDDxxxxxxx',
    ],
    props: [
      prop(1, 4, ['Il letto. Anche qui si prepara il prossimo comizio.'], true),
      prop(1, 1, ['Giornali con le pagine della politica sottolineate.']),
      prop(4, 1, ['Sul leggio: «GIÀ LO SAI».']),
      prop(10, 7, ['La partita della Roma. Daje Roma daje.']),
      prop(8, 7, ['La sciarpa giallorossa sul divano.']),
      prop(10, 1, ['La carbonara di ieri.']),
      prop(3, 0, ['Il campanile di San Giovanni si vede sotto la salita.']),
    ],
    art: [
      art('rug', 8, 3, 4, 3, '', 'wall-c'),
      art('home-prop', 9, 3, 2, 1, 'roma'),
      art('home-prop', 2, 6, 1, 1, 'papers'),
      art('nameplate', 7, 1, 3, 1, 'COSTANZO'),
    ],
    pets: [
      [2, 2, 'down'],
      [4, 3, 'left'],
      [8, 2, 'down'],
      [11, 3, 'left'],
      [2, 7, 'down'],
      [11, 8, 'up'],
    ],
  }),
  'casa-forchetta': home({
    id: 'casa-forchetta',
    name: 'Casa di Forchetta',
    rows: [
      'xxxxxxxxxxxx',
      'x5FFFF2FFFFx',
      'xFFFFFFFkkkx',
      'x1FFFFFFFFFx',
      'xFFFxxFFFFFx',
      'xFFFxxFF4FFx',
      'xFFFFFFFFFFx',
      'x3FFFFFFFFFx',
      'xxxxxDDxxxxx',
    ],
    props: [
      prop(1, 3, ['Il letto, nel borgo di Mola.'], true),
      prop(1, 1, ['Le coppe dei tornei di tennis. Poteva andare peggio.']),
      prop(6, 1, ['Un messaggio incomprensibile, lasciato a metà.']),
      prop(1, 7, ['La PlayStation è già accesa per la rivincita.']),
      prop(8, 5, ['La sciarpa biancoazzurra del Formia.']),
      prop(9, 2, ['Una tiella di scarola.']),
      prop(8, 0, ['Via Abate Tosti e, più in là, la Torre di Mola.']),
    ],
    art: [
      art('rug', 6, 4, 4, 3, '', 'far2'),
      art('home-prop', 2, 1, 2, 1, 'trophies'),
      art('home-prop', 2, 5, 1, 2, 'racket'),
      art('nameplate', 7, 1, 3, 1, 'FORCHETTA'),
    ],
    pets: [
      [2, 2, 'down'],
      [4, 2, 'left'],
      [7, 3, 'down'],
      [9, 4, 'left'],
      [2, 6, 'down'],
      [9, 7, 'up'],
    ],
  }),
  'casa-andrea': home({
    id: 'casa-andrea',
    name: 'Casa di Andrea',
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
      'xxxxxDDxxxxxxx',
    ],
    props: [
      prop(1, 1, ['Il letto. Sveglia presto per allenarsi.'], true),
      prop(1, 7, ['Gli attrezzi sono ordinati per peso.']),
      prop(7, 5, ['Calcoli e probabilità della prossima partita.']),
      prop(11, 7, ['Un programma di allenamento sullo schermo.']),
      prop(9, 7, ['Ci si siede dopo la palestra.']),
      prop(10, 1, ['Porzioni pesate, una per giorno.']),
      prop(7, 0, ['I tetti di Castellone e piazza Mattej.']),
    ],
    art: [
      art('rug', 7, 2, 5, 3, '', 'clay'),
      art('home-prop', 8, 3, 2, 1, 'weights'),
      art('home-prop', 2, 5, 1, 2, 'racket'),
      art('home-prop', 10, 5, 2, 1, 'weights'),
      art('nameplate', 6, 1, 3, 1, 'ANDREA'),
    ],
    pets: [
      [2, 2, 'down'],
      [4, 2, 'left'],
      [7, 2, 'down'],
      [11, 4, 'left'],
      [3, 6, 'down'],
      [10, 8, 'up'],
    ],
  }),
  'casa-zendavid': home({
    id: 'casa-zendavid',
    name: 'Casa di Zendavid',
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
      'xxxxxDDxxxxxxx',
    ],
    props: [
      prop(9, 2, ['Il letto. Prima di dormire, cuffie e respiro.'], true),
      prop(1, 1, ['Le cuffie grandi, sul loro supporto.']),
      prop(6, 1, ['La console da DJ: Stronger è in pausa.']),
      prop(1, 5, ['Le casse. I vicini lo riconoscono dalle prime note.']),
      prop(7, 7, ['Il divano. Modalità Zen.']),
      prop(2, 7, ['Niente ansia, solo cose buone.']),
      prop(11, 0, ['La stazione di Scauri e i treni per Formia.']),
    ],
    art: [
      art('rug', 2, 2, 5, 3, '', 'far2'),
      art('home-prop', 2, 3, 3, 1, 'decks'),
      art('home-prop', 1, 3, 1, 1, 'speaker'),
      art('home-prop', 6, 3, 1, 1, 'speaker'),
      art('nameplate', 8, 1, 4, 1, 'ZENDAVID'),
    ],
    pets: [
      [2, 2, 'down'],
      [5, 2, 'left'],
      [10, 3, 'down'],
      [11, 4, 'left'],
      [3, 6, 'down'],
      [10, 8, 'up'],
    ],
  }),
};
