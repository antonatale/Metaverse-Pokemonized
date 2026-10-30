import { CHARS as C } from '../data/characters';
import { COVI } from '../data/covi';
import { ITEMS } from '../data/items';
import { MAPS } from '../data/maps';
import { st } from '../save/story-progress';
import { activity, timesDone } from './activities';

/* The thread through the story: one next stop at a time, so Antonio always knows where to go next.
   The stops follow a tour of Formia from home westwards: the Bruno Zauli next door, Mola, the piazza and the
   station, Castellone, Vindicio, the pineta, the Tomba di Cicerone, and the train at the end.
   Everything can still be done in any order: the next stop is just the first one not done yet. */
export interface Stop {
  id: string;
  /** what to do */
  text: string;
  /** where */
  where: string;
  /** what people around town say about it */
  tip: string;
  /** the map and the tile to go to: a person, a lost thing */
  map: string; x: number; y: number;
  done(): boolean;
}
/** where to head on the map Antonio is on: the stop itself, or the door that leads to it */
export interface Heading { stop: Stop; x: number; y: number; exact: boolean }

function npcAt(map: string, id: string): [number, number] {
  const n = (MAPS[map].npcs || []).find((q) => q.id === id);
  if (!n) throw new Error('no ' + id + ' on ' + map);
  return [n.x, n.y];
}
function areaOf(map: string, x: number, y: number): string {
  const a = (MAPS[map].areas || []).find((q) => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h);
  return a ? a.name : MAPS[map].name;
}
const doing = (id: string, who: string, tip: string): Stop => {
  const a = activity(id), [x, y] = npcAt('formia', who);
  return { id, text: a.name, where: a.where, tip, map: 'formia', x, y, done: () => timesDone(id) > 0 };
};
const covo = (id: string, map: string, tip: string): Stop => {
  const cv = COVI[id], [x, y] = npcAt(map, cv.leader);
  return { id: 'covo-' + id, text: 'Sfida ' + C[cv.leader].name, where: cv.name, tip, map, x, y, done: () => !!st.beaten[id] };
};
const lost = (id: string): Stop => {
  const it = (MAPS.formia.items || []).find((q) => q.id === id)!, area = areaOf('formia', it.x, it.y);
  return { id: 'item-' + id, text: 'Ritrova ' + ITEMS[it.move].name, where: 'Dalle parti di: ' + area, tip: 'Ho visto qualcosa di tuo per terra, zona ' + area + '. Mi sa che ' + (it.pron === 'li' ? 'erano ' : 'era ') + ITEMS[it.move].name + '.',
    map: 'formia', x: it.x, y: it.y, done: () => !!st.found[id] };
};
const [tx, ty] = npcAt('formia', 'capotreno');

export const STOPS: Stop[] = [
  doing('padel', 'andrea', 'Andrea ti aspetta al Bruno Zauli: ha calcolato che a padel oggi vince lui.'),
  covo('circolo', 'circolo', 'Forchetta è nei campi coperti del Bruno Zauli. Fuori non gioca mai.'),
  doing('quiz', 'oste', 'Stasera da Morgana, a Mola, c\'è il quiz su Formia.'),
  doing('gelato', 'gelataio', 'A Mola, vicino al porto, il gelataio ha un pistacchio che non ti dico.'),
  covo('piazza', 'formia', 'In piazza della Vittoria Costanzo fa un comizio che non finisce più.'),
  lost('caricabatterie'),
  lost('appunti'),
  doing('lettino', 'nicola', 'All\'Eclipse, a Vindicio, Nicola Spadea ti tiene il lettino in prima fila.'),
  doing('volley', 'valentin', 'All\'Eclipse Valentin cerca gente per il beach volley.'),
  lost('portafoglio'),
  doing('corsa', 'zendavid', 'Zendavid corre in pineta, a Vindicio. Con le cuffie, ovviamente.'),
  lost('passaporto'),
  /* the end of the tour, until the next city exists */
  { id: 'torino', text: 'Il treno per Torino', where: 'Stazione di Formia', tip: 'Hai fatto tutto il giro di Formia! In stazione il capotreno sa qualcosa del treno per Torino.',
    map: 'formia', x: tx, y: ty, done: () => false }
];

export function nextStop(): Stop { return STOPS.find((s) => !s.done())!; }
export function stopsDone(): number { return STOPS.filter((s) => s.done()).length; }

/** where to go from the map Antonio is on: indoors, the way out; outdoors, the door of the place the stop is in */
export function heading(map: string): Heading | null {
  const s = nextStop();
  if (s.map === map) return { stop: s, x: s.x, y: s.y, exact: true };
  const m = MAPS[map];
  if (m.inside) { const w = (m.warps || [])[0]; return w ? { stop: s, x: w.x, y: w.y, exact: false } : null; }
  const b = (m.buildings || []).find((q) => q.to === s.map);
  return b ? { stop: s, x: b.door[0], y: b.door[1], exact: false } : null;
}
