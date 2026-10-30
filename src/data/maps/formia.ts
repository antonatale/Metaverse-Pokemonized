import type { Area, Building, GroundObject, LostItem, MapDef, MapObject, Npc, Sign } from './types';
import { FORMIA_ROWS, FORMIA_AT, FORMIA_SPOT, FORMIA_TUNNELS, FORMIA_HOUSES } from './formia-ground';
import { PLACES } from './formia-places';
import { tile, W, H } from './formia-projection';

/* Formia as it is: the ground comes from OpenStreetMap (tools/formia/build.ts), every place is where it really is
   (formia-places.ts). Antonio lives here, in Parco la Fontana in via Giovanni Amendola: the map is his town,
   with his friends' hangouts (the Eclipse at Vindicio, the pineta, Morgana in Mola) and the town around. */

const at = (id: string) => { const p = FORMIA_AT[id]; if (!p) throw new Error('Formia: ' + id + ' was not placed'); return p; };
const spot = (id: string): [number, number] => { const s = FORMIA_SPOT[id]; if (!s) throw new Error('Formia: spot ' + id + ' was not placed'); return s; };
const door = (id: string): [number, number] => at(id).door!;
const kindOf = (id: string) => PLACES.find((p) => p.id === id)!.kind;
function building(id: string, o: Partial<Building>): Building {
  const p = at(id);
  return { id, kind: kindOf(id), x: p.x, y: p.y, w: p.w, h: p.h, door: door(id), ...o };
}
function object(id: string, o: Partial<MapObject> = {}): MapObject {
  const p = at(id);
  return { kind: kindOf(id), x: p.x, y: p.y, w: p.w, h: p.h, ...o };
}
function sign(id: string, text: string[]): Sign { const [x, y] = spot(id); return { x, y, text }; }
function npc(id: string, o: Omit<Npc, 'id' | 'x' | 'y'>): Npc { const [x, y] = spot(id); return { id, x, y, ...o }; }
function text(lat: number, lon: number, t: string, size: number, alpha?: number): GroundObject {
  const [x, y] = tile(lat, lon);
  return { kind: 'text', x, y, text: t, size, alpha };
}

/* ---------- the town around: what you hear at a closed door ---------- */
const DOORS = [
  ['Il portone è chiuso.'],
  ['Dalla finestra arriva profumo di sugo. È domenica, da qualche parte.'],
  ['Sul citofono c\'è scritto solo «Bussare forte».'],
  ['Si sente la radio: danno la partita del Formia.'],
  ['Qualcuno sta guardando le qualifiche di Formula 1.'],
  ['Ci sono i panni stesi ad asciugare.'],
  ['Un cane abbaia da dietro il cancello.'],
  ['Il portone è chiuso. Dal balcone qualcuno annaffia i gerani.']
];
const SHOPS: [string, string[]][] = [
  ['TABACCHI', ['Tabacchi. Gratta e vinci in vetrina.']],
  ['FARMACIA', ['Farmacia. La croce verde lampeggia.']],
  ['PESCHERIA', ['Pescheria. Alici, calamari, e una spigola enorme.']],
  ['ALIMENTARI', ['Alimentari. Mozzarella di bufala e olive di Gaeta.']],
  ['EDICOLA', ['Edicola. Il giornale di oggi parla del porto.']],
  ['PIZZERIA', ['Pizzeria. Il forno a legna è già acceso.']]
];
const ROOFS = ['#ff9a8b', '#9ec5ff', '#ffd166', '#c3a6ff', '#ff9a8b', '#ffd166'];
const AWNINGS = ['#ff8fc1', '#8fd0f6', '#ffd166', '#57c968'];
const houses: Building[] = FORMIA_HOUSES.map((h, k): Building => {
  const base = { id: 'casa-' + k, kind: h.kind, x: h.x, y: h.y, w: h.w, h: h.h, door: h.door, roof: ROOFS[h.v % ROOFS.length] };
  if (h.kind === 'shop') { const s = SHOPS[h.v % SHOPS.length]; return { ...base, label: s[0], awning: AWNINGS[h.v % AWNINGS.length], msg: s[1] }; }
  return { ...base, msg: DOORS[h.v % DOORS.length] };
});

const buildings: Building[] = [
  building('casa', { label: 'PARCO LA FONTANA', to: 'casa', tx: 5, ty: 6, tdir: 'up' }),
  building('palamendola', { label: 'PALAMENDOLA', msg: ['Il Palamendola, il palazzetto dello sport di via Amendola.', 'Dentro si sentono i palloni rimbalzare.'] }),
  building('zauli', { label: 'CENTRO OLIMPICO', msg: ['Centro di Preparazione Olimpica «Bruno Zauli».', 'Dentro si allenano i velocisti. Si entra solo con il tesserino.'] }),
  building('tennis', { label: 'TENNIS COPERTI', to: 'circolo', tx: 5, ty: 11, tdir: 'up' }),
  building('morgana', { label: 'MORGANA', msg: ['Birreria Morgana, in via Tullia.', 'La sera è qui che ci si ritrova.'] }),
  building('chiesa-mola', { msg: ['Chiesa dei Santi Lorenzo e Giovanni Battista, nel borgo di Mola.'] }),
  building('gelati', { label: 'GELATI', awning: '#8fd0f6', roof: '#c3a6ff', msg: ['Gelateria. Due gusti? Limone e fragola, il classico.'] }),
  building('bar', { msg: ['Il bar è pieno: c\'è la partita.'] }),
  building('biglietti', { label: 'BIGLIETTI', msg: ['Biglietti per Ponza e Ventotene: traghetti e aliscafi.', 'Per oggi niente gite.'] }),
  building('stazione', { gate: 'torino' }),
  building('comune', { label: 'COMUNE · MUSEO', msg: ['Comune di Formia. In un\'ala c\'è il Museo archeologico nazionale, con le statue romane trovate in città.', 'Oggi è chiuso.'] }),
  building('forno', { label: 'FORNO', awning: '#ffd166', roof: '#ff9a8b', msg: ['Profumo di tiella: di polpo, di scarola, di cipolle.'] }),
  building('erasmo', { msg: ['Chiesa di Sant\'Erasmo, il patrono di Formia.', 'Dentro è fresco e silenzioso.'] }),
  building('eclipse', { label: 'ECLIPSE', msg: ['Eclipse beach, il lido di Nicola Spadea.', 'Lettini, ombrelloni e musica fino al tramonto.'] }),
  building('scogliera', { label: 'LA SCOGLIERA', msg: ['Lido La Scogliera, in fondo a Vindicio.'] }),
  building('oriente', { label: 'ORIENTE', msg: ['Lido Oriente, sulla spiaggia di Gianola.'] })
].concat(houses);

const objects: MapObject[] = [
  object('fontana'), object('torre-mola'), object('torre-castellone'), object('tomba'), object('mamurra'),
  object('traghetto', { bob: true })
].concat(FORMIA_TUNNELS.map(([x, y]): MapObject => ({ kind: 'tunnel', x, y, w: 1, h: 2 })))
  .concat(['motorino', 'motorino-eclipse', 'motorino-morgana', 'motorino-piazza'].map((id): MapObject => { const [x, y] = spot(id); return { kind: 'scooter', x, y, w: 1, h: 1 }; }));

const pz = at('piazza'), cam = at('campo-amendola');
const groundObjects: GroundObject[] = [
  { kind: 'banner', x: pz.x + 2, y: pz.y + 1, w: 6, text: 'COMIZIO' },
  { kind: 'court', x: cam.x, y: cam.y, w: cam.w, h: cam.h },
  text(41.2700, 13.5740, 'Monti Aurunci', 19),
  text(41.2462, 13.5700, 'Pineta di Vindicio', 17, 0.7),
  text(41.2470, 13.5905, 'Vindicio', 20, 0.6),
  text(41.2470, 13.6050, 'Golfo di Gaeta', 26, 0.5),
  text(41.2604, 13.6000, 'Castellone', 17, 0.7),
  text(41.2610, 13.6150, 'Mola', 18, 0.7),
  text(41.2651, 13.6420, 'via Amendola', 15, 0.7),
  text(41.2590, 13.6620, 'Gianola', 18, 0.7),
  text(41.2533, 13.5780, 'verso Gaeta', 15, 0.6)
];

const signs: Sign[] = [
  sign('sign-casa', ['Parco la Fontana, via Giovanni Amendola 1.', 'Casa di Antonio.']),
  sign('sign-stazione', ['Stazione di Formia-Gaeta. Treni per Roma e per Napoli.']),
  sign('sign-comune', ['Palazzo comunale, in via Vitruvio. Nell\'ala del museo ci sono le statue romane trovate a Formia.']),
  sign('sign-piazza', ['Piazza della Vittoria.', 'Oggi c\'è il comizio di Costanzo, Er Politico.']),
  sign('sign-erasmo', ['Chiesa di Sant\'Erasmo, a Castellone.']),
  sign('sign-castellone', ['Torre di Castellone: ottagonale, del Trecento.', 'Castellone è il borgo alto, nato sopra l\'antica città romana.']),
  sign('sign-cisternone', ['Largo Sant\'Anna. Qui sotto c\'è il Cisternone romano, una cisterna enorme di epoca imperiale.']),
  sign('sign-mola', ['Torre di Mola: la torre rotonda del castello angioino, del Duecento.']),
  sign('sign-morgana', ['Birreria Morgana, via Tullia.', 'La sera ci si vede qui.']),
  sign('sign-porto', ['Porto di Formia, molo Azzurra. Traghetti e aliscafi per Ponza e Ventotene.']),
  sign('sign-tomba', ['Tomba di Cicerone.', 'Secondo la tradizione qui riposa Marco Tullio Cicerone, ucciso a Formia nel 43 avanti Cristo.']),
  sign('sign-vindicio', ['Lungomare di Vindicio.', 'D\'estate qui c\'è tutta Formia.']),
  sign('sign-pineta', ['Pineta di Vindicio.', 'Pini domestici e ombra, anche ad agosto.']),
  sign('sign-zauli', ['Centro di Preparazione Olimpica «Bruno Zauli».', 'Qui si allenava Pietro Mennea.']),
  sign('sign-gianola', ['Parco di Gianola.', 'Sul promontorio ci sono i resti della villa romana di Mamurra.']),
  sign('sign-caposele', ['Porticciolo di Caposele.'])
].concat(['motorino', 'motorino-eclipse', 'motorino-morgana', 'motorino-piazza'].map((id): Sign => ({ ...sign(id, ['Il motorino di Antonio.']), quiet: true, ride: true })));

const npcs: Npc[] = [
  npc('costanzo', { person: 'costanzo', dir: 'down', covo: 'piazza', unless: 'costanzo' }),
  /* friends who joined the squad leave their covo and turn up where Antonio and the others hang out */
  npc('costanzo-morgana', { person: 'costanzo', name: 'costanzo', dir: 'down', with: 'costanzo', lines: ['GIÀ LO SAI: stasera qui da Morgana offro io.', 'Anzi no. Facciamo alla romana.'] }),
  npc('forchetta-eclipse', { person: 'forchetta', name: 'forchetta', dir: 'left', with: 'forchetta', lines: ['Poteva andare peggio: sole, mare, Eclipse.', 'Dopo la spiaggia, una partita alla Play da te?'] }),
  npc('folla1', { name: 'Dalla folla', seed: 11, dir: 'up', lines: ['Comizio alle sei. Anzi alle sette. Insomma, quando arriva lui.'] }),
  npc('folla2', { name: 'Dalla folla', seed: 12, dir: 'up', lines: ['Daje!'] }),
  npc('folla3', { name: 'Dalla folla', seed: 13, dir: 'up', lines: ['Ho provato a interromperlo un\'ora fa. Sta ancora parlando.'] }),
  npc('folla4', { name: 'Dalla folla', seed: 14, dir: 'right', lines: ['Io sono venuto solo per la difesa del bidet.'] }),
  npc('nicola', { name: 'Nicola Spadea', seed: 81, dir: 'down', activity: 'lettino', lines: ['Benvenuti all\'Eclipse!', 'Antonio, il solito lettino in prima fila?'] }),
  npc('valentin', { person: 'valentin', name: 'valentin', dir: 'left', activity: 'volley', lines: ['Weee! Antonio, stasera si fa festa qui all\'Eclipse!', 'Prima però una partita a beach volley.'] }),
  npc('zendavid', { person: 'zendavid', name: 'zendavid', dir: 'down', activity: 'corsa', lines: ['Bau. Qui in pineta si sente solo la musica in cuffia.', 'Facciamo una corsetta tra i pini?'] }),
  npc('andrea', { person: 'andrea', name: 'andrea', dir: 'down', activity: 'padel', lines: ['Ho calcolato tutto: tre giri di pista e poi padel.', 'Statisticamente oggi vinco io.'] }),
  npc('oste', { name: 'Al bancone', seed: 82, dir: 'down', activity: 'quiz', lines: ['Benvenuti da Morgana!', 'Avete un tavolo? Stasera c\'è il quiz.'] }),
  npc('vicina', { name: 'Vicina di casa', seed: 15, dir: 'left', lines: ['Antonio! Hai preso tutto? Chiavi, portafoglio, caricabatterie?', 'Dicono che in giro per Formia ci sia roba tua. Come sempre.'] }),
  npc('capotreno', { name: 'Capotreno', seed: 21, dir: 'down', gate: 'torino' }),
  npc('turista', { name: 'Turista', seed: 22, dir: 'left', lines: ['Dicono che Cicerone parlasse tantissimo.', 'Ho conosciuto uno in piazza che lo batte.'] }),
  npc('anziano', { name: 'Signore di Castellone', seed: 23, dir: 'down', lines: ['Da quassù si vede tutto il golfo, fino a Gaeta.', 'Io a Castellone ci sono nato. Pure mio nonno.'] }),
  npc('fornaia', { name: 'Fornaia', seed: 24, dir: 'down', lines: ['Tiella di polpo o di scarola? Appena sfornata.', 'La facciamo come a Gaeta. Anzi, meglio. Ma non diteglielo.'] }),
  npc('tifoso', { name: 'Tifoso', seed: 51, dir: 'up', lines: ['Il bar è pieno, c\'è la partita. Io guardo da qui.'] }),
  npc('gelataio', { name: 'Gelataio', seed: 52, dir: 'down', activity: 'gelato', lines: ['Limone, fragola, nocciola, pistacchio.', 'A luglio il cono si scioglie in un attimo.'] }),
  npc('marinaio', { name: 'Marinaio', seed: 32, dir: 'right', lines: ['Questo va a Ponza e a Ventotene.', 'Tu però prima finisci quello che hai cominciato in città.'] }),
  npc('velocista', { name: 'Velocista', seed: 61, dir: 'down', lines: ['Qui si allenava Pietro Mennea.', 'Io intanto faccio dieci giri. Poi vediamo.'] }),
  npc('tennista', { name: 'Tennista', seed: 26, dir: 'down', lines: ['Forchetta? È dentro, nel campo coperto. Fuori non gioca mai.'] }),
  npc('cestista', { name: 'Cestista', seed: 62, dir: 'down', lines: ['Stasera al Palamendola c\'è la partita. Vieni?'] }),
  npc('bagnino', { name: 'Bagnino', seed: 43, dir: 'down', lines: ['Bandiera verde: si può fare il bagno.'] }),
  npc('bambino', { name: 'Bambino', seed: 42, dir: 'left', lines: ['Ho perso il secchiello.', 'Pure tu perdi sempre le cose?'] }),
  npc('guardaparco', { name: 'Guardaparco', seed: 44, dir: 'right', lines: ['Nel parco di Gianola c\'è anche un porticciolo romano.', 'Sott\'acqua è bellissimo.'] }),
  npc('pescatore', { name: 'Pescatore', seed: 31, dir: 'down', lines: ['Oggi il mare è calmo.', 'Giornata buona per Ponza. O per una lotta.'] })
];

const item = (id: string, move: string, pron: string, t: string): LostItem => { const [x, y] = spot(id); return { id, move, x, y, pron, text: t }; };
const items: LostItem[] = [
  item('caricabatterie', 'simtoreal', 'lo', 'Era su una panchina della stazione.'),
  item('appunti', 'diagnosi', 'li', 'Erano sui gradini di Sant\'Erasmo.'),
  item('passaporto', 'america', 'lo', 'Era ai piedi della Tomba di Cicerone.'),
  item('portafoglio', 'certificati', 'lo', 'Era sotto un ombrellone dell\'Eclipse.')
];

/** neighbourhoods, for the place name in the corner: the first that contains Antonio wins */
const clip = (name: string, x0: number, y0: number, x1: number, y1: number): Area => {
  const x = Math.max(0, x0), y = Math.max(0, y0);
  return { name, x, y, w: Math.min(W - 1, x1) - x + 1, h: Math.min(H - 1, y1) - y + 1 };
};
const box = (name: string, la0: number, lo0: number, la1: number, lo1: number): Area => {
  const [x0, y0] = tile(la0, lo0), [x1, y1] = tile(la1, lo1);
  return clip(name, Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1));
};
const near = (name: string, id: string, m: number): Area => { const p = at(id); return clip(name, p.x - m, p.y - m, p.x + p.w - 1 + m, p.y + p.h - 1 + m); };
const areas: Area[] = [
  near('Parco la Fontana', 'casa', 3), near('Eclipse beach', 'eclipse-spiaggia', 2), near('Birreria Morgana', 'morgana', 2),
  near('Piazza della Vittoria', 'piazza', 2), near('Stazione', 'stazione', 3), near('Bruno Zauli', 'zauli', 5),
  box('Pineta di Vindicio', 41.2515, 13.5660, 41.2420, 13.5790),
  box('Tomba di Cicerone', 41.2535, 13.5730, 41.2500, 13.5820),
  box('Vindicio', 41.2520, 13.5790, 41.2420, 13.5960),
  box('Caposele', 41.2530, 13.5940, 41.2480, 13.6010),
  box('Castellone', 41.2600, 13.5950, 41.2530, 13.6040),
  box('Centro', 41.2600, 13.6030, 41.2520, 13.6100),
  box('Mola', 41.2640, 13.6100, 41.2540, 13.6205),
  box('Parco Gramsci', 41.2650, 13.6205, 41.2580, 13.6270),
  box('Via Amendola', 41.2660, 13.6340, 41.2580, 13.6480),
  box('Gianola', 41.2680, 13.6480, 41.2420, 13.6800),
  box('Acqualonga', 41.2705, 13.6205, 41.2640, 13.6340)
];

const st = spot('start');
export const formia: MapDef = {
  name: 'Formia',
  rows: FORMIA_ROWS,
  buildings, objects, groundObjects, signs, npcs, items, areas,
  start: [st[0], st[1], 'down']
};
/** where Antonio's scooter can take him: it is parked at each of these */
export const RIDES: { name: string; at: [number, number] }[] = [
  { name: 'Casa', at: spot('motorino') }, { name: 'Eclipse beach', at: spot('motorino-eclipse') },
  { name: 'Morgana', at: spot('motorino-morgana') }, { name: 'Piazza della Vittoria', at: spot('motorino-piazza') }
];
