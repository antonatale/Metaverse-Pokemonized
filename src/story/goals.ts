import { CHARS as C } from '../data/characters';
import { COVI } from '../data/covi';
import { ITEMS } from '../data/items';
import { MAPS } from '../data/maps';
import { st } from '../save/story-progress';
import { activity, timesDone } from './activities';
import { flag } from './plot';

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
const doing = (id: string, who: string, tip: string, map = 'formia'): Stop => {
  const a = activity(id), [x, y] = npcAt(map, who);
  return { id, text: a.name, where: a.where, tip, map, x, y, done: () => timesDone(id) > 0 };
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
/** a step of the plot (story/plot.ts): someone to meet in Formia, done when a flag is set */
const plot = (id: string, text: string, where: string, tip: string, who: string, done: string): Stop => {
  const [x, y] = npcAt('formia', who);
  return { id, text, where, tip, map: 'formia', x, y, done: () => flag(done) };
};
const [tx, ty] = npcAt('formia', 'capotreno');
const tomb = (MAPS.formia.signs || []).find((g) => g.text.join(' ').indexOf('Tomba di Cicerone') >= 0)!;

export const STOPS: Stop[] = [
  (function (): Stop {
    const [x, y] = npcAt('formia', 'guardaparco');
    return { id: 'starter', text: 'La tua prima creatura', where: 'Parco di Gianola', tip: 'Il guardaparco di Gianola cerca qualcuno a cui affidare un cucciolo. Perché non tu?',
      map: 'formia', x, y, done: () => !!st.seen.starter };
  })(),
  plot('trama-scavi', 'Chi scava tra le rovine di Gianola?', 'Parco di Gianola', 'A Gianola, tra le rovine della villa romana, c\'è un tipo in giacca e cravatta che scava con la pala.', 'mamurr-scavi', 'tr-mamurr-scavi'),
  doing('padel', 'andrea', 'Andrea ti aspetta al Bruno Zauli: ha calcolato che a padel oggi vince lui.'),
  covo('circolo', 'circolo', 'Forchetta è nei campi coperti del Bruno Zauli. Fuori non gioca mai.'),
  plot('trama-archivio', 'L\'Archivio della Torre di Mola', 'Torre di Mola', 'Le leggende di Formia le conosce l\'archivista della Torre di Mola: chiedi a lei delle Pietre di Telepilo.', 'archivista', 'trama-archivio'),
  doing('quiz', 'oste', 'Stasera da Morgana, a Mola, c\'è il quiz su Formia.', 'morgana'),
  doing('gelato', 'gelataio', 'Passa da Lavezzi, in piazza Marconi accanto al Comune: fanno il gelato dal 1870.'),
  covo('piazza', 'formia', 'In piazza della Vittoria Costanzo fa un comizio che non finisce più.'),
  plot('trama-cisterna', 'L\'uomo del Cisternone', 'Castellone', 'A Castellone, davanti al Cisternone, c\'è uno con la torcia che cerca di forzare la porta.', 'mamurr-cisterna', 'tr-mamurr-cisterna'),
  plot('trama-mura', 'La Pietra delle Mura', 'Castellone, dalla signora del teatro', 'La signora che abita dentro il teatro romano sa la parola che apre il Cisternone.', 'teatro', 'pietra-mura'),
  lost('caricabatterie'),
  lost('appunti'),
  plot('trama-mare', 'La Pietra del Mare', 'Le peschiere di Caposele', 'Un sub si immerge tra le peschiere romane di Caposele: dicono che abbia tirato su una pietra che brilla.', 'mamurr-peschiere', 'pietra-mare'),
  doing('windsurf', 'nicola', 'All\'Eclipse c\'è Nicola Spadea, il campione di windsurf: oggi c\'è la termica giusta per una lezione.'),
  doing('volley', 'valentin', 'All\'Eclipse Valentin cerca gente per il beach volley.'),
  lost('portafoglio'),
  doing('corsa', 'zendavid', 'Zendavid corre in pineta, a Vindicio. Con le cuffie, ovviamente.'),
  lost('passaporto'),
  { id: 'trama-voce', text: 'La Pietra della Voce', where: 'Tomba di Cicerone', tip: 'Alla Tomba di Cicerone, sull\'Appia, di sera si sente una voce che parla latino.',
    map: 'formia', x: tomb.x, y: tomb.y, done: () => flag('pietra-voce') },
  plot('trama-mamurra', 'Il fantasma di Mamurra', 'Villa di Mamurra, Gianola', 'Tra le rovine della villa di Mamurra, a Gianola, si vede una luce dorata.', 'mamurra', 'tr-mamurra'),
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
