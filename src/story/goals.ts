import { CHARS as C, type FriendId } from '../data/characters';
import { GATES, SECOND_CITY } from '../data/gates';
import { firstHuman } from './growth';
import { COVI } from '../data/covi';
import { ITEMS } from '../data/items';
import { MAPS } from '../data/maps';
import { FORMIA_SPOT } from '../data/maps/formia-ground';
import type { PlaceDef } from '../data/maps/types';
import { st } from '../save/story-progress';
import { activity, timesDone } from './activities';
import { flag } from './plot';
import { rivalFriend } from './rival-who';
import { COVO_PLACES } from '../data/covo-places';
import { invited, keysFrom } from './lairs';
import { ABDUCTION, MAMURRA_BEATEN, REUNION, creaturesMissing, friendFreed, readyForVilla } from './finale';
import { chosen } from './choices';
import { DV, key, prepare } from './maps';

/* The story starts at Gianola, follows the echo through Formia, then takes the player back to the villa.
   Covi follow the protagonist's route. Activities and lost things stay available as detours. */
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
  optional?: true;
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
  return { id, text: a.name, where: a.where, tip, map, x, y, done: () => timesDone(id) > 0, who: n && n.person ? n.person : undefined, optional: true };
};
/** the invitation to a covo (data/covo-places.ts, hook): someone in town says what has happened and sends the player there */
const hook = (id: string): Stop => {
  const h = COVO_PLACES[id].hook, [x, y] = npcAt(h.map, h.npc);
  return { id: 'invito-' + id, text: h.text, where: h.where, tip: h.tip, map: h.map, x, y, done: () => invited(id), who: COVI[id].leader };
};
const covo = (id: string, map: string, tip: string): Stop => {
  const cv = COVI[id], n = (MAPS[map].npcs || []).find((q) => q.covo === id);
  if (!n) throw new Error('no leader of ' + id + ' on ' + map);
  return { id: 'covo-' + id, text: 'Sfida ' + C[cv.leader].name, where: cv.name, tip, map, x: n.x, y: n.y, done: () => !!st.beaten[id], who: cv.leader };
};
const lost = (id: string): Stop => {
  const it = (MAPS.formia.items || []).find((q) => q.id === id)!, area = areaOf('formia', it.x, it.y);
  return { id: 'item-' + id, text: 'Ritrova ' + ITEMS[it.move].name, where: 'Dalle parti di: ' + area, tip: 'Ho visto qualcosa di tuo per terra, zona ' + area + '. Mi sa che ' + (it.pron === 'li' ? 'erano ' : 'era ') + ITEMS[it.move].name + '.',
    map: 'formia', x: it.x, y: it.y, done: () => !!st.found[id], only: 'antonio', optional: true };
};
/** a step of the plot (story/plot.ts): someone to meet in Formia, done when a flag is set */
const plot = (id: string, text: string, where: string, tip: string, who: string, done: string): Stop => {
  const [x, y] = npcAt('formia', who);
  return { id, text, where, tip, map: 'formia', x, y, done: () => flag(done) };
};
/** a stop done when the team has that many creatures (caught, or at home): it points to the grass of Gianola */
const team = (id: string, n: number, text: string, where: string, tip: string): Stop => {
  const [x, y] = npcAt('formia', 'guardaparco');
  return { id, text, where, tip, map: 'formia', x, y, done: () => (st.mons || []).length >= n };
};
const [tx, ty] = npcAt('formia', 'capotreno');
const [tombX, tombY] = FORMIA_SPOT['sign-tomba'];
const [gateX, gateY] = npcAt('formia', 'selv-lamo');
const [arenaX, arenaY] = npcAt('telepilo', 'selv-lamo');

export const STOPS: Stop[] = [
  (function (): Stop {
    const [x, y] = npcAt('formia', 'guardaparco');
    return { id: 'starter', text: 'La tua prima creatura', where: 'Parco di Gianola', tip: 'La guardaparco di Gianola cerca qualcuno a cui affidare un cucciolo. Perché non tu?',
      map: 'formia', x, y, done: () => !!st.seen.starter };
  })(),
  /* A second creature helps at the ruins, then the player builds a team for the Cisternone. */
  team('seconda-creatura', 2, 'La tua seconda creatura', 'L\'erba alta del Parco di Gianola', 'La guardaparco dice: con i retini che ti ho dato, cammina nell\'erba alta o tra gli scogli di Gianola. Indebolisci una creatura e lancia il retino.'),
  plot('trama-scavi', 'Chi scava tra le rovine di Gianola?', 'Parco di Gianola', 'A Gianola, tra le rovine della villa romana, c\'è un tipo in giacca e cravatta che scava con la pala.', 'mamurr-scavi', 'tr-mamurr-scavi'),
  covo('palamendola', 'covo-antonio', 'Antonio è chiuso nella cupola accanto alla fontana di Parco la Fontana. Nel parco si entra solo da casa sua, dalla porta sul retro.'),
  covo('padel', 'covo-andrea', 'Andrea è in cima alla Torre delle Probabilità, a Castellone, dietro piazza Mattei. Alla porta fanno domande di probabilità.'),
  covo('circolo', 'circolo', 'Forchetta palleggia da dodici ore nel Tempio della Terra Rossa, i tennis coperti del Zauli.'),
  plot('trama-archivio', 'L\'Archivio della Torre di Mola', 'Torre di Mola', 'Le leggende di Formia le conosce l\'archivista della Torre di Mola: chiedi a lei delle Pietre di Telepilo.', 'archivista', 'trama-archivio'),
  covo('morgana', 'covo-claudia', 'Claudia è nel suo castello nero, in via Palazzo, a San Giulio. Il Padre ti aspetta sul trono. Uno alla volta.'),
  doing('gelato', 'gelataio', 'Passa da Lavezzi, in piazza Marconi accanto al Comune: fanno il gelato dal 1870.'),
  covo('piazza', 'covo-costanzo', 'Costanzo parla dal balcone del Palazzo del Popolo, in piazza della Vittoria. Per salire, l\'esame di educazione civica.'),
  team('squadra-cisterna', 3, 'Tre creature per il buio', 'L\'erba alta e gli scogli', 'Nel Cisternone si lotta al buio: Cicerone dice di non scendere con meno di tre creature. Cattura nell\'erba alta o tra gli scogli.'),
  plot('trama-cisterna', 'L\'uomo del Cisternone', 'Castellone', 'A Castellone, davanti al Cisternone, c\'è uno con la torcia che cerca di forzare la porta.', 'mamurr-cisterna', 'tr-mamurr-cisterna'),
  { ...plot('trama-mura', 'La parola del Cisternone', 'Castellone, dalla signora del teatro', 'La signora che abita dentro il teatro romano sa la parola che apre il Cisternone.', 'teatro', 'porta-cisterna'),
    done: () => flag('porta-cisterna') || flag('pietra-mura') },
  { id: 'trama-dentro', text: 'La Pietra delle Mura', where: 'Il Cisternone', tip: 'La porta del Cisternone è aperta: la Pietra delle Mura sta in fondo, sull\'acqua ferma.',
    map: 'cisterna', x: (MAPS.cisterna.place as PlaceDef).goal[0], y: (MAPS.cisterna.place as PlaceDef).goal[1], done: () => flag('pietra-mura') },
  lost('caricabatterie'),
  lost('appunti'),
  plot('trama-mare', 'La Pietra del Mare', 'Le peschiere di Caposele', 'Un sub si immerge tra le peschiere romane di Caposele: dicono che abbia tirato su una pietra che brilla.', 'mamurr-peschiere', 'pietra-mare'),
  doing('windsurf', 'nicola', 'All\'Eclipse c\'è Nicola Spadea, il campione di windsurf: oggi c\'è la termica giusta per una lezione.'),
  covo('eclipse', 'covo-valentin', 'Valentin è in cima alla torre verde di via Ferrucci, di fronte all\'ospedale. Nella nebbia ballano le Iele.'),
  lost('portafoglio'),
  covo('pineta', 'covo-zendavid', 'Zendavid è alla consolle del Tempio del Basso, in mezzo alla pineta di Vindicio. Alla porta, domande su Kanye.'),
  lost('passaporto'),
  { id: 'trama-voce', text: 'La Pietra della Voce', where: 'Tomba di Cicerone', tip: 'Alla Tomba di Cicerone, sull\'Appia, di sera si sente una voce che parla latino.',
    map: 'formia', x: tombX, y: tombY, done: () => flag('pietra-voce') },
  { ...plot('trama-mamurra', 'Ritrova gli amici alla villa', 'Villa di Mamurra, Gianola', 'Con tutti gli amici e le tre Pietre, raggiungi la luce dorata tra le rovine di Gianola.', 'mamurra', ABDUCTION),
    done: () => flag(ABDUCTION) || flag(MAMURRA_BEATEN) },
  { id: 'finale-discesa', text: 'Segui l’eco a Castellone', where: 'Sotto le mura di Castellone', tip: 'L’eco di Mamurra arriva dalle tre nicchie sotto le mura. Da lì si scende a Telepilo.',
    map: 'formia', x: gateX, y: gateY, done: () => st.map === 'telepilo' || flag(MAMURRA_BEATEN) },
  { id: 'finale-ponte', text: 'Affronta Mamurra con gli amici', where: 'La Porta di Telepilo', tip: 'Supera il ponte e avvicinati alle tre nicchie illuminate.',
    map: 'telepilo', x: arenaX, y: arenaY, done: () => flag(MAMURRA_BEATEN) },
  /* the end of the tour: the train of whoever is played (data/gates.ts) */
  { id: 'torino', text: 'Il treno per la tua città', where: 'Stazione di Formia', tip: 'Hai fatto tutto il giro di Formia! In stazione il capotreno sa qualcosa del tuo treno.',
    map: 'formia', x: tx, y: ty, done: () => false }
];

/** the stops of whoever is played: not his own covo, not his own activity; the last one named after his train */
export function myStops(): Stop[] {
  const me = firstHuman() as FriendId, G0 = GATES[SECOND_CITY[me] || 'torino'];
  const list = STOPS.filter((s) => s.who !== me && (!s.only || s.only === me)).map((s) => s.id === 'torino' ? { ...s, text: G0.label, tip: 'Hai fatto tutto il giro di Formia! In stazione il capotreno sa qualcosa del treno per ' + G0.station + '.' } : s);
  /* the covi come in order of distance from home (the plot keeps its place): whoever lives in Scauri starts from the
     east, whoever lives in Castellone from the centre; the rival's comes last */
  const home = (MAPS.formia.starts && MAPS.formia.starts[me]) || MAPS.formia.start;
  const at = (s: Stop): number[] => { if (s.map === 'formia') return [s.x, s.y]; const b = (MAPS.formia.buildings || []).find((q) => q.to === s.map); return b ? b.door : [s.x, s.y]; };
  const far = (s: Stop) => { const p = at(s); return Math.hypot(p[0] - home[0], p[1] - home[1]); };
  const slots = list.map((s, k) => (s.id.indexOf('covo-') === 0 ? k : -1)).filter((k) => k >= 0);
  const covi = slots.map((k) => list[k]).sort((a, b) => far(a) - far(b));
  /* the rival's covo is the last pin of Formia, wherever it is */
  const rv = rivalFriend(), last = covi.findIndex((s) => s.who === rv);
  if (rv && last >= 0) covi.push(covi.splice(last, 1)[0]);
  slots.forEach((k, n) => { list[k] = covi[n]; });
  /* before each covo, whoever sends the player there (data/covo-places.ts): one does not knock on a friend's covo for nothing */
  const out: Stop[] = [];
  list.forEach((s) => { if (s.id.indexOf('covo-') === 0 && COVO_PLACES[s.id.slice(5)]) out.push(hook(s.id.slice(5))); out.push(s); });
  if (flag(REUNION) && chosen('pietre') === 'sigillo') out.push({ ...plot('sigillo-lamo', 'Rimetti le Pietre nelle nicchie', 'Sotto le mura di Castellone, di notte', 'Riporta le Pietre a Lamo di notte.', 'selv-lamo', 'enigma-lamo'), optional: true });
  return out;
}
/* the keys of the scooter are with the keeper of the first covo of the tour, the nearest (story/lairs.ts) */
keysFrom(function () { const c = myStops().find((s) => s.id.indexOf('covo-') === 0); return c ? c.id.slice(5) : null; });
/* Use the actual closed grounds behind the house, even after a redraw of the city. */
const parkDoor = MAPS.formia.warps!.find(w => w.to === 'casa')!;
const parkExit = MAPS.casa.warps!.find(w => w.to === 'formia' && w.tx === parkDoor.x && Math.abs(w.ty - parkDoor.y) <= 1)!;
let parkTiles: Set<string> | undefined;
function inPark(x: number, y: number): boolean {
  if (!parkTiles) {
    const map = prepare('formia');
    const queue = [[parkExit.tx, parkExit.ty]];
    parkTiles = new Set([key(parkExit.tx, parkExit.ty)]);
    for (let i = 0; i < queue.length; i++) {
      const [tx, ty] = queue[i];
      for (const [dx, dy] of Object.values(DV)) {
        const nx = tx + dx, ny = ty + dy, tile = key(nx, ny);
        if (nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || map.solid[ny * map.w + nx] || map.at[tile] || parkTiles.has(tile)) continue;
        parkTiles.add(tile); queue.push([nx, ny]);
      }
    }
  }
  return parkTiles.has(key(x, y));
}
export function storyStops(): Stop[] { return myStops().filter(s => !s.optional); }
export function nextStop(): Stop {
  const stops = storyStops();
  if (flag(MAMURRA_BEATEN)) {
    /* A legacy victory can predate some covi. Finish those before directing the player to the station. */
    const remaining = !flag(REUNION) && stops.find(s => s.who && !s.done() && !friendFreed(s.who));
    return remaining || stops[stops.length - 1];
  }
  if (creaturesMissing()) return stops.find(s => s.id === (st.map === 'telepilo' ? 'finale-ponte' : 'finale-discesa'))!;
  if (readyForVilla(firstHuman() as FriendId)) return stops.find(s => s.id === 'trama-mamurra')!;
  return stops.find(s => !s.done())!;
}
export function stopsDone(): number { return storyStops().filter((s) => s.done()).length; }

/** where to go from the map Antonio is on: indoors, the way out; outdoors, the door of the place the stop is in */
export function heading(map: string): Heading | null {
  const s = nextStop();
  if (s.map === map) return { stop: s, x: s.x, y: s.y, exact: true };
  const m = MAPS[map];
  /* to Antonio's dome: through his flat, and out of the back door into the park */
  if (s.map === 'covo-antonio') {
    if (map === 'casa') return { stop: s, x: parkExit.x, y: parkExit.y, exact: false };
    if (map === 'formia' && (st.map !== 'formia' || !inPark(st.x, st.y))) { const c = (m.buildings || []).find((q) => q.id === 'casa'); if (c) return { stop: s, x: c.door[0], y: c.door[1], exact: false }; }
  }
  if (m.inside) { const w = (m.warps || [])[0]; return w ? { stop: s, x: w.x, y: w.y, exact: false } : null; }
  const b = (m.buildings || []).find((q) => q.to === s.map);
  if (b) return { stop: s, x: b.door[0], y: b.door[1], exact: false };
  const g = (m.signs || []).find((q) => q.enter && q.enter.to === s.map);
  return g ? { stop: s, x: g.x, y: g.y, exact: false } : null;
}
