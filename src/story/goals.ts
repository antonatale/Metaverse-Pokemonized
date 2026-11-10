import { CHARS as C, type FriendId } from '../data/characters';
import { GATES, SECOND_CITY } from '../data/gates';
import { firstHuman } from './growth';
import { COVI } from '../data/covi';
import { ITEMS } from '../data/items';
import { MAPS } from '../data/maps';
import type { PlaceDef } from '../data/maps/types';
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
  /** the friend it is about: whoever is played skips his own covo and his own activity */
  who?: FriendId;
  /** a stop for one protagonist only: Antonio's lost things are his */
  only?: FriendId;
}
/** where to head on the map Antonio is on: the stop itself, or the door that leads to it */
export interface Heading { stop: Stop; x: number; y: number; exact: boolean }

export function npcAt(map: string, id: string): [number, number] {
  const n = (MAPS[map].npcs || []).find((q) => q.id === id);
  if (!n) throw new Error('no ' + id + ' on ' + map);
  return [n.x, n.y];
}
function areaOf(map: string, x: number, y: number): string {
  const a = (MAPS[map].areas || []).find((q) => x >= q.x && x < q.x + q.w && y >= q.y && y < q.y + q.h);
  return a ? a.name : MAPS[map].name;
}
const doing = (id: string, who: string, tip: string, map = 'formia'): Stop => {
  const a = activity(id), [x, y] = npcAt(map, who), n = (MAPS[map].npcs || []).find((q) => q.id === who);
  return { id, text: a.name, where: a.where, tip, map, x, y, done: () => timesDone(id) > 0, who: n && n.person ? n.person : undefined };
};
const covo = (id: string, map: string, tip: string): Stop => {
  const cv = COVI[id], n = (MAPS[map].npcs || []).find((q) => q.covo === id);
  if (!n) throw new Error('no leader of ' + id + ' on ' + map);
  return { id: 'covo-' + id, text: 'Sfida ' + C[cv.leader].name, where: cv.name, tip, map, x: n.x, y: n.y, done: () => !!st.beaten[id], who: cv.leader };
};
const lost = (id: string): Stop => {
  const it = (MAPS.formia.items || []).find((q) => q.id === id)!, area = areaOf('formia', it.x, it.y);
  return { id: 'item-' + id, text: 'Ritrova ' + ITEMS[it.move].name, where: 'Dalle parti di: ' + area, tip: 'Ho visto qualcosa di tuo per terra, zona ' + area + '. Mi sa che ' + (it.pron === 'li' ? 'erano ' : 'era ') + ITEMS[it.move].name + '.',
    map: 'formia', x: it.x, y: it.y, done: () => !!st.found[id], only: 'antonio' };
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
  covo('palamendola', 'formia', 'Al Palamendola, accanto a Parco la Fontana, Antonio ti aspetta per una sfida. Ha appena letto un paper.'),
  plot('trama-scavi', 'Chi scava tra le rovine di Gianola?', 'Parco di Gianola', 'A Gianola, tra le rovine della villa romana, c\'è un tipo in giacca e cravatta che scava con la pala.', 'mamurr-scavi', 'tr-mamurr-scavi'),
  covo('padel', 'formia', 'Andrea ti aspetta ai campi da padel del Bruno Zauli: ha calcolato che oggi vince lui.'),
  covo('circolo', 'circolo', 'Forchetta è nei campi coperti del Bruno Zauli. Fuori non gioca mai.'),
  plot('trama-archivio', 'L\'Archivio della Torre di Mola', 'Torre di Mola', 'Le leggende di Formia le conosce l\'archivista della Torre di Mola: chiedi a lei delle Pietre di Telepilo.', 'archivista', 'trama-archivio'),
  doing('quiz', 'oste', 'Stasera da Morgana, a Mola, c\'è il quiz su Formia.', 'morgana'),
  doing('gelato', 'gelataio', 'Passa da Lavezzi, in piazza Marconi accanto al Comune: fanno il gelato dal 1870.'),
  covo('piazza', 'formia', 'In piazza della Vittoria Costanzo fa un comizio che non finisce più.'),
  plot('trama-cisterna', 'L\'uomo del Cisternone', 'Castellone', 'A Castellone, davanti al Cisternone, c\'è uno con la torcia che cerca di forzare la porta.', 'mamurr-cisterna', 'tr-mamurr-cisterna'),
  { ...plot('trama-mura', 'La parola del Cisternone', 'Castellone, dalla signora del teatro', 'La signora che abita dentro il teatro romano sa la parola che apre il Cisternone.', 'teatro', 'porta-cisterna'),
    done: () => flag('porta-cisterna') || flag('pietra-mura') },
  { id: 'trama-dentro', text: 'La Pietra delle Mura', where: 'Il Cisternone', tip: 'La porta del Cisternone è aperta: la Pietra delle Mura sta in fondo, sull\'acqua ferma.',
    map: 'cisterna', x: (MAPS.cisterna.place as PlaceDef).goal[0], y: (MAPS.cisterna.place as PlaceDef).goal[1], done: () => flag('pietra-mura') },
  lost('caricabatterie'),
  lost('appunti'),
  plot('trama-mare', 'La Pietra del Mare', 'Le peschiere di Caposele', 'Un sub si immerge tra le peschiere romane di Caposele: dicono che abbia tirato su una pietra che brilla.', 'mamurr-peschiere', 'pietra-mare'),
  doing('windsurf', 'nicola', 'All\'Eclipse c\'è Nicola Spadea, il campione di windsurf: oggi c\'è la termica giusta per una lezione.'),
  covo('eclipse', 'formia', 'All\'Eclipse Valentin fa festa: chi vuole la sua spilla, prima lo deve battere.'),
  lost('portafoglio'),
  covo('pineta', 'formia', 'Zendavid è in pineta, a Vindicio, con le cuffie: la sua spilla si prende lì.'),
  lost('passaporto'),
  { id: 'trama-voce', text: 'La Pietra della Voce', where: 'Tomba di Cicerone', tip: 'Alla Tomba di Cicerone, sull\'Appia, di sera si sente una voce che parla latino.',
    map: 'formia', x: tomb.x, y: tomb.y, done: () => flag('pietra-voce') },
  plot('trama-mamurra', 'Il fantasma di Mamurra', 'Villa di Mamurra, Gianola', 'Tra le rovine della villa di Mamurra, a Gianola, si vede una luce dorata.', 'mamurra', 'tr-mamurra'),
  /* the end of the tour: the train of whoever is played (data/gates.ts) */
  { id: 'torino', text: 'Il treno per la tua città', where: 'Stazione di Formia', tip: 'Hai fatto tutto il giro di Formia! In stazione il capotreno sa qualcosa del tuo treno.',
    map: 'formia', x: tx, y: ty, done: () => false }
];

/** the stops of whoever is played: not his own covo, not his own activity; the last one named after his train */
export function myStops(): Stop[] {
  const me = firstHuman() as FriendId, G0 = GATES[SECOND_CITY[me] || 'torino'];
  const list = STOPS.filter((s) => s.who !== me && (!s.only || s.only === me)).map((s) => s.id === 'torino' ? { ...s, text: G0.label, tip: 'Hai fatto tutto il giro di Formia! In stazione il capotreno sa qualcosa del treno per ' + G0.station + '.' } : s);
  /* the covi come in order of distance from home (the plot keeps its place): whoever lives in Scauri starts from the
     east, whoever lives in Castellone from the centre */
  const home = (MAPS.formia.starts && MAPS.formia.starts[me]) || MAPS.formia.start;
  const at = (s: Stop): number[] => { if (s.map === 'formia') return [s.x, s.y]; const b = (MAPS.formia.buildings || []).find((q) => q.to === s.map); return b ? b.door : [s.x, s.y]; };
  const far = (s: Stop) => { const p = at(s); return Math.hypot(p[0] - home[0], p[1] - home[1]); };
  const slots = list.map((s, k) => (s.id.indexOf('covo-') === 0 ? k : -1)).filter((k) => k >= 0);
  const covi = slots.map((k) => list[k]).sort((a, b) => far(a) - far(b));
  slots.forEach((k, n) => { list[k] = covi[n]; });
  return list;
}
export function nextStop(): Stop { return myStops().find((s) => !s.done())!; }
export function stopsDone(): number { return myStops().filter((s) => s.done()).length; }

/** where to go from the map Antonio is on: indoors, the way out; outdoors, the door of the place the stop is in */
export function heading(map: string): Heading | null {
  const s = nextStop();
  if (s.map === map) return { stop: s, x: s.x, y: s.y, exact: true };
  const m = MAPS[map];
  if (m.inside) { const w = (m.warps || [])[0]; return w ? { stop: s, x: w.x, y: w.y, exact: false } : null; }
  const b = (m.buildings || []).find((q) => q.to === s.map);
  if (b) return { stop: s, x: b.door[0], y: b.door[1], exact: false };
  const g = (m.signs || []).find((q) => q.enter && q.enter.to === s.map);
  return g ? { stop: s, x: g.x, y: g.y, exact: false } : null;
}
