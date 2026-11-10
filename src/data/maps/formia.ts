import type { Area, Building, GroundObject, LostItem, MapDef, MapObject, Npc, Sign, Dir } from './types';
import { FORMIA_ROWS, FORMIA_AT, FORMIA_SPOT, FORMIA_TUNNELS, FORMIA_HOUSES } from './formia-ground';
import { PLACES } from './formia-places';
import { tile, W, H } from './formia-projection';

/* Formia as it is, made playable: the coast and the green come from OpenStreetMap, the streets are drawn by hand on the
   real ones (tools/formia), every place is near where it really is (formia-places.ts). Antonio lives here, in Parco la
   Fontana in via Giovanni Amendola: the map is his town, with his friends' hangouts (the Eclipse at Vindicio, the pineta,
   Morgana in Mola) and the town around. Every neighbourhood says what it is, and the signs, the plates and the people
   tell true things about it (sources in docs/fonti-formia.md). */

const at = (id: string) => { const p = FORMIA_AT[id]; if (!p) throw new Error('Formia: ' + id + ' was not placed'); return p; };
const spot = (id: string): [number, number] => { const s = FORMIA_SPOT[id]; if (!s) throw new Error('Formia: spot ' + id + ' was not placed'); return s; };
/** where Antonio's scooter is parked: home, and the places of the tour */
const SCOOTERS = ['motorino', 'motorino-eclipse', 'motorino-morgana', 'motorino-piazza', 'motorino-zauli', 'motorino-pineta'];
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
const ROOFS = ['#ff9a8b', '#9ec5ff', '#ffd166', '#c3a6ff', '#ff9a8b', '#ffd166'];
/* the shops of the town: a few places, each one its own (its face in render/canvas/objects.ts, what it sells in SHOPS of
   data/growth.ts), at the shop fronts the generator leaves along the streets; the other shop fronts are homes. No shop
   bears the name of a private person: the names are of the places (Largo Paone, Mola) or of what they are */
const SHOP_AT: Record<string, { kind: string; label: string; shop: string; msg: string[] }> = {
  '71,23': { kind: 'pharmacy', label: 'FARMACIA', shop: 'farmacia', msg: ['La farmacia. La croce verde è accesa.'] },
  '71,26': { kind: 'bookshop', label: 'LIBRERIA', shop: 'libreria', msg: ['La libreria. In vetrina, un libro su Cicerone e uno su Mennea.'] },
  '94,26': { kind: 'fishmonger', label: 'PESCHERIA', shop: 'pescheria', msg: ['La pescheria di Mola: il pesce arriva la mattina dalle barche del borgo.'] },
  '82,39': { kind: 'newsstand', label: 'EDICOLA', shop: 'edicola', msg: ['L\'edicola. Il giornale di oggi è appeso davanti.'] },
  '65,34': { kind: 'market', label: 'MERCATO', shop: 'mercato', msg: ['Il mercato di Largo Paone, su via Vitruvio: il sabato ci sono tutte le bancarelle.'] }
};
const houses: Building[] = FORMIA_HOUSES.map((h, k): Building => {
  const base = { id: 'casa-' + k, kind: h.kind, x: h.x, y: h.y, w: h.w, h: h.h, door: h.door, roof: ROOFS[h.v % ROOFS.length], v: h.v };
  const sh = h.kind === 'shop' ? SHOP_AT[h.x + ',' + h.y] : undefined;
  if (sh) return { ...base, kind: sh.kind, label: sh.label, shop: sh.shop, msg: sh.msg };
  return { ...base, kind: h.kind === 'shop' ? 'house' : h.kind, msg: DOORS[h.v % DOORS.length] };
});

const buildings: Building[] = [
  building('casa', { label: 'PARCO LA FONTANA', to: 'casa', tx: 5, ty: 6, tdir: 'up', v: 11 }),
  /* the homes of the others: each one's story begins at his door (MapDef.starts) */
  building('casa-valentin', { label: 'VIA FERRUCCI', v: 23, to: 'casa-valentin', tx: 5, ty: 6, tdir: 'up' }),
  building('casa-costanzo', { label: 'VIA SOLARO', v: 41, to: 'casa-costanzo', tx: 5, ty: 6, tdir: 'up' }),
  building('casa-forchetta', { label: 'VIA ABATE TOSTI', v: 7, to: 'casa-forchetta', tx: 5, ty: 6, tdir: 'up' }),
  building('casa-zendavid', { label: 'SCAURI', v: 33, to: 'casa-zendavid', tx: 5, ty: 6, tdir: 'up' }),
  building('stazione-scauri', { label: 'MINTURNO-SCAURI', msg: ['Stazione di Minturno-Scauri, sulla linea Roma–Napoli che passa per Formia.', 'Da qui a Formia è una fermata.'] }),
  building('casa-andrea', { label: 'PIAZZA MATTEI', v: 58, to: 'casa-andrea', tx: 5, ty: 6, tdir: 'up' }),
  building('palamendola', { label: 'PALAMENDOLA', msg: ['Il Palamendola, il palazzetto dello sport di via Amendola.', 'Dentro si sentono i palloni rimbalzare.'] }),
  building('zauli', { label: 'CENTRO OLIMPICO', msg: ['Centro di Preparazione Olimpica «Bruno Zauli»: più di venti sport, all\'aperto e al coperto.', 'Si entra solo con il tesserino.'] }),
  building('tennis', { label: 'TENNIS COPERTI', to: 'circolo', tx: 5, ty: 11, tdir: 'up' }),
  building('morgana', { label: 'MORGANA', to: 'morgana', tx: 5, ty: 7, tdir: 'up' }),
  building('chiesa-mola', { label: 'SAN GIOVANNI BATTISTA', msg: ['Chiesa dei Santi Lorenzo e Giovanni Battista, in piazza San Giovanni, nel borgo di Mola: è citata già nell\'841.', 'Fino all\'Ottocento erano due chiese divise da un muro. La guerra l\'ha quasi distrutta, poi è stata ricostruita.', 'Dentro c\'è una tavola di Antoniazzo Romano, dipinta verso il 1490.'] }),
  building('scuola', { label: 'VITRUVIO POLLIONE', msg: ['Istituto comprensivo «Vitruvio Pollione»: la scuola media di Mola, in via Emanuele Filiberto.', 'Dalle finestre aperte si sente la ricreazione.'] }),
  building('donbosco', { label: 'DON BOSCO', msg: ['Villaggio Don Bosco: la parrocchia del Cuore Immacolato di Maria, su via Appia Lato Napoli.', 'Quasi di fronte a casa di Antonio, dall\'altra parte dell\'Appia. La chiesa è aperta: dentro c\'è silenzio.'] }),
  building('oratorio', { label: 'ORATORIO', msg: ['L\'oratorio del Villaggio Don Bosco.', 'Da dentro arrivano voci di ragazzi e il rumore di una partita a biliardino.'] }),
  building('gelati', { label: 'LAVEZZI', msg: ['Gelateria Lavezzi, in piazza Marconi dal 1870.', 'Amalio Lavezzi cominciò con un chiosco: solo limone e caffè, fatti con la neve del Vesuvio. Oggi c\'è la quarta generazione.'] }),
  building('bar', { msg: ['Il bar è pieno: c\'è la partita.', 'Al banco però il caffè lo fanno lo stesso.'], shop: 'bar' }),
  building('biglietti', { label: 'BIGLIETTI', msg: ['Biglietteria Laziomar: traghetti e aliscafi per Ponza e Ventotene.', 'Per oggi niente gite.'] }),
  building('stazione', { gate: 'torino' }),
  building('comune', { label: 'COMUNE · MUSEO', msg: ['Museo archeologico nazionale di Formia, nell\'ala sud del Palazzo comunale.', 'Due statue togate conservano ancora tracce del loro colore: le statue antiche erano dipinte.', 'Oggi è chiuso.'] }),
  building('forno', { label: 'FORNO', awning: '#ffd166', roof: '#ff9a8b', msg: ['Il forno di Castellone. Profumo di tiella: di polpo, di scarola, di cipolle.'], shop: 'forno' }),
  building('erasmo', { msg: ['Chiesa di Sant\'Erasmo, patrono di Formia e protettore dei marinai, morto qui il 2 giugno del 303.', 'Sotto la chiesa gli scavi hanno trovato una necropoli romana, la sua tomba e una cripta carolingia.'] }),
  building('eclipse', { label: 'ECLIPSE', msg: ['Eclipse beach, via Tito Scipione 58.', 'Ombrelloni, gazebo, lettini, beach volley. E il windsurf con Nicola Spadea.'] }),
  building('scogliera', { label: 'LA SCOGLIERA', msg: ['Lido La Scogliera, in fondo a Vindicio, verso Gaeta.'] }),
  building('oriente', { label: 'LIDO ORIENTE', msg: ['Lido Oriente, sul lungomare di Formia che va verso Gianola: si chiama lungomare Città di Ferrara, al numero 128.', 'Uno stabilimento di famiglia: bar, ristorante con il pesce del giorno, canoe e pedalò, beach volley e beach soccer.'] })
].concat(houses);

const objects: MapObject[] = [
  object('fontana'), object('torre-mola'), object('torre-castellone'), object('tomba'), object('mamurra'), object('cisternone'), object('acquedotto'),
  object('traghetto', { bob: true }),
  /* a train standing at the station, the monument in Piazza della Vittoria, the lighthouse at the end of the mole */
  { kind: 'train', x: at('stazione').x + 1, y: at('stazione').y - 1, w: 7, h: 1 },
  { kind: 'monument', x: at('piazza').x + 8, y: at('piazza').y + 5, w: 1, h: 1 },
  { kind: 'lighthouse', x: 97, y: 50, w: 1, h: 1 }
].concat(FORMIA_TUNNELS.map(([x, y]): MapObject => ({ kind: 'tunnel', x, y, w: 1, h: 2 })))
  .concat(SCOOTERS.map((id): MapObject => { const [x, y] = spot(id); return { kind: 'scooter', x, y, w: 1, h: 1 }; }));

const pz = at('piazza'), cam = at('campo-amendola'), track = at('pista');
const groundObjects: GroundObject[] = [
  { kind: 'banner', x: pz.x + 2, y: pz.y + 1, w: 6, text: 'COMIZIO' },
  { kind: 'court', x: cam.x, y: cam.y, w: cam.w, h: cam.h },
  { kind: 'track', x: track.x, y: track.y, w: track.w, h: track.h },
  /* the cavea of the Roman theatre, south of Sant'Erasmo; Maranola up in the Aurunci */
  { kind: 'cavea', x: at('erasmo').x - 1, y: at('erasmo').y + 4, w: 8, h: 2 },
  { kind: 'village', x: 71, y: 0, w: 9, h: 4 },
  text(41.2700, 13.6070, 'Maranola', 15, 0.7),
  text(41.2700, 13.5740, 'Monti Aurunci', 19),
  text(41.24857, 13.58073, 'Vindicio', 20, 0.6),
  text(41.2470, 13.6050, 'Golfo di Gaeta', 26, 0.5),
  text(41.2604, 13.6000, 'Castellone', 17, 0.7),
  text(41.26047, 13.6115, 'Mola', 18, 0.7),
  text(41.2590, 13.6620, 'Gianola', 18, 0.7),
  /* where the roads lead, past the edges of the map */
  text(41.24347, 13.5734, 'verso Gaeta', 15, 0.6),
  text(41.25469, 13.5685, 'verso Itri e Roma', 15, 0.6),
  text(41.26183, 13.6730, 'verso Scauri', 15, 0.6)
];

const signs: Sign[] = [
  sign('sign-casa', ['Parco la Fontana, via Giovanni Amendola 1.', 'Casa di Antonio.', '← Il Bruno Zauli, Mola, il centro, Vindicio · → Gianola']),
  sign('sign-stazione', ['Stazione di Formia-Gaeta, sulla linea Roma–Napoli.', '↓ Piazza della Vittoria, il porto · → Mola, Morgana']),
  sign('sign-comune', ['Palazzo comunale, via Vitruvio 184.', 'Nell\'ala sud, nelle sale degli «Stalloni dei Borbone», c\'è il Museo archeologico nazionale: statue romane trovate nell\'antico Foro, oggi piazza Mattej.']),
  sign('sign-piazza', ['Piazza della Vittoria, con il monumento ai caduti del 1926.', 'Oggi c\'è il comizio di Costanzo, Er Politico.', '← Castellone, Vindicio, l\'Eclipse · → Mola, il Bruno Zauli, via Amendola']),
  sign('sign-erasmo', ['Chiesa di Sant\'Erasmo, nel cuore di Castellone.', 'Sorge sulla tomba del santo. Dopo le incursioni saracene dell\'842 le reliquie furono portate a Gaeta.']),
  sign('sign-castellone', ['Torre di Castellone: ottagonale, alta 25 metri, merlata.', 'La fece costruire nel 1377 Onorato I Caetani, conte di Fondi, sulla base in opera poligonale dell\'acropoli romana.']),
  { ...sign('sign-cisternone', ['Il Cisternone romano, sotto il borgo di Castellone.', 'Una cisterna del I secolo a.C. grande 1200 metri quadri: conteneva 7000 metri cubi d\'acqua per la città antica.']),
    enter: { to: 'cisterna', tx: 7, ty: 8, tdir: 'up' as const, after: ['porta-cisterna', 'pietra-mura'], label: 'Scendi nel Cisternone' } },
  sign('sign-mola', ['Torre di Mola, del castello angioino: fu costruita dopo il sacco del 1289, sopra le terme romane.', 'Oggi ospita l\'Archivio storico di Formia.']),
  sign('sign-morgana', ['Birreria Morgana, via Abate Tosti 105, nel borgo di Mola.', 'La sera ci si vede qui.', '← Il centro, Vindicio · → Il Bruno Zauli, via Amendola']),
  sign('sign-porto', ['Porto di Formia.', 'Traghetti e aliscafi Laziomar per Ponza e Ventotene, tutto l\'anno: un\'ora circa con l\'aliscafo, più di due con il traghetto.']),
  sign('sign-tomba', ['Tomba di Cicerone, sull\'Appia verso Itri.', 'La tradizione dice che qui riposa Marco Tullio Cicerone, ucciso vicino alla sua villa di Formia il 7 dicembre del 43 a.C.']),
  sign('sign-vindicio', ['Spiaggia di Vindicio: più di un chilometro di sabbia, dal porto fino a Gaeta. Bandiera Blu.', 'D\'estate qui c\'è tutta Formia.', '← La Scogliera, la Tomba di Cicerone · → La pineta, il centro, Mola']),
  sign('sign-pineta', ['Pineta di Vindicio, accanto al Lido Frungillo, all\'inizio di via Tito Scipione.', 'Pini domestici, ombra e tavoli per il picnic, a due passi dalla spiaggia.']),
  sign('sign-zauli', ['Centro di Preparazione Olimpica «Bruno Zauli», via Appia Lato Napoli.', 'Nato nel 1955 da un\'idea di Bruno Zauli, presidente della federazione di atletica. Qui il professor Carlo Vittori allenava Pietro Mennea.', '← Mola, il centro · → Via Amendola, casa']),
  sign('sign-gianola', ['Parco regionale di Gianola e del Monte di Scauri, nato nel 1987.', 'Sul promontorio la villa di Mamurra, con l\'edificio ottagonale detto «Tempio di Giano». Sotto, il porticciolo romano.']),
  sign('sign-caposele', ['Porticciolo di Caposele.', 'Da qui parte la spiaggia di Vindicio, verso Gaeta.']),
  sign('sign-porticciolo', ['Il porticciolo romano di Gianola.', 'Forse era la peschiera della villa di Mamurra: vasche per allevare il pesce. Oggi è area marina protetta.']),
  sign('sign-sangiovanni', ['Piazza San Giovanni, nel borgo di Mola.', 'Di qua la chiesa dei Santi Lorenzo e Giovanni Battista, di là la scuola Vitruvio Pollione. Accanto, i resti dell\'acquedotto romano.', '← Morgana, il porto, il centro · → Il Bruno Zauli, via Amendola']),
  sign('sign-donbosco', ['Villaggio Don Bosco, parrocchia del Cuore Immacolato di Maria.', 'La chiesa, l\'oratorio e il campo: il pomeriggio è pieno di ragazzi.', '↑ Via Amendola, Parco la Fontana · ← Mola, il centro'])
].concat(SCOOTERS.map((id): Sign => ({ ...sign(id, ['Il motorino di Antonio.']), quiet: true, ride: true })))
  /* the monument in Piazza della Vittoria: read it by walking up to it */
  .concat([{ x: at('piazza').x + 8, y: at('piazza').y + 5, quiet: true, text: ['Il monumento ai caduti, del 1926: una Vittoria accanto all\'epigrafe per i caduti di Formia.'] }])
  /* the street-name plates, with a word on each street */
  .concat(([
    ['targa-vitruvio', 'Via Vitruvio', 'La strada dei negozi e del Comune. Porta il nome di Vitruvio, l\'architetto romano del «De architectura».'],
    ['targa-abate-tosti', 'Via Abate Tosti', 'La via di Mola, tra la torre, il porto e Morgana.'],
    ['targa-appia', 'Via Appia', 'La regina delle strade: da Roma passa per Formia e va verso Capua. Qui, verso Itri, c\'è la Tomba di Cicerone.'],
    ['targa-vindicio', 'Via Vindicio', 'La strada della spiaggia: lidi da una parte, case dall\'altra, fino a Gaeta.'],
    ['targa-tito-scipione', 'Via Tito Scipione', 'Il lungomare dei lidi: al 3 il Lido Frungillo e la pineta, al 58 l\'Eclipse.'],
    ['targa-amendola', 'Via Giovanni Amendola', 'Al numero 1 c\'è Parco la Fontana: casa di Antonio. Più giù, il Palamendola.'],
    ['targa-appia-napoli', 'Via Appia Lato Napoli', 'L\'Appia verso Napoli, lungo la baia: al 175 il centro Bruno Zauli.'],
    ['targa-gianola', 'Via Gianola', 'Scende verso il parco di Gianola e il lungomare di Formia che porta il nome di Ferrara, con il Lido Oriente.'],
    ['targa-sgb', 'Via San Giovanni Bosco', 'Dall\'Appia scende al Villaggio Don Bosco, quasi di fronte a Parco la Fontana.']
  ] as [string, string, string][]).map(([id, street, note]): Sign => ({ ...sign(id, [street + '.', note]), plate: true })));

const npcs: Npc[] = [
  /* the six covi: each friend in his, with his challenge (data/covi.ts); whoever is played does not meet himself */
  npc('costanzo', { person: 'costanzo', dir: 'down', covo: 'piazza', unless: 'costanzo' }),
  npc('antonio-covo', { person: 'antonio', name: 'antonio', dir: 'down', covo: 'palamendola' }),
  /* a friend once beaten comes out of his covo now and then, where the others hang out */
  npc('forchetta-eclipse', { person: 'forchetta', name: 'forchetta', dir: 'left', beaten: 'circolo', lines: ['Poteva andare peggio: sole, mare, Eclipse.', 'Dopo la spiaggia, una partita alla Play da te?'] }),
  npc('folla1', { name: 'Dalla folla', seed: 11, dir: 'up', lines: ['Comizio alle sei. Anzi alle sette. Insomma, quando arriva lui.'] }),
  npc('folla2', { name: 'Dalla folla', seed: 12, dir: 'up', lines: ['Daje!'] }),
  npc('folla3', { name: 'Dalla folla', seed: 13, dir: 'up', lines: ['Ho provato a interromperlo un\'ora fa. Sta ancora parlando.'] }),
  npc('folla4', { name: 'Dalla folla', seed: 14, dir: 'right', lines: ['Io sono venuto solo per la difesa del bidet.'] }),
  npc('nicola', { name: 'Nicola Spadea', look: 'nicola', dir: 'up', activity: 'windsurf', lines: ['{hero}! Oggi a Vindicio c\'è la termica giusta, mare piatto e vento costante.', 'Ti va una lezione di windsurf? Ti insegno a planare.'] }),
  npc('barista', { name: 'Bar dell\'Eclipse', seed: 83, dir: 'down', activity: 'lettino', lines: ['Benvenuto all\'Eclipse!', 'Il solito ombrellone in prima fila, con due lettini?'] }),
  npc('valentin', { person: 'valentin', name: 'valentin', dir: 'left', covo: 'eclipse', activity: 'volley', lines: ['Weee! {hero}, stasera si fa festa qui all\'Eclipse!', 'Prima però una partita a beach volley.'] }),
  npc('zendavid', { person: 'zendavid', name: 'zendavid', dir: 'down', covo: 'pineta', activity: 'corsa', lines: ['Bau. Qui in pineta si sente solo la musica in cuffia.', 'Facciamo una corsetta tra i pini?'] }),
  npc('andrea', { person: 'andrea', name: 'andrea', dir: 'down', covo: 'padel', activity: 'padel', lines: ['Ho calcolato tutto: tre giri di pista e poi padel.', 'Statisticamente oggi vinco io.'] }),
  npc('vicina', { reacts: [{ after: 'tr-mamurr-scavi', say: ['Ho sentito che a Gianola scavavano di notte. Tu stai attento, {hero}.'] }, { after: 'tr-mamurra', say: ['Dicono che hai mandato via un fantasma. Un fantasma! Mangia qualcosa, che sei sciupato.'] }, { after: 'sc-lamo-amico', say: ['Quello grosso che ti segue ha mangiato? Ho fatto la tiella.', 'Tre, ne ha mangiate. E ha chiesto il bis.'] }], name: 'Vicina di casa', seed: 15, dir: 'left', hint: true, lines: ['{hero}! Hai preso tutto? Chiavi, portafoglio, caricabatterie?', 'Dicono che in giro per Formia ci sia roba tua. Come sempre.'] }),
  npc('capotreno', { name: 'Capotreno', seed: 21, dir: 'down', gate: 'torino' }),
  npc('turista', { name: 'Turista', seed: 22, dir: 'left', lines: ['Cicerone aveva una villa qui a Formia: è qui che lo raggiunsero i sicari di Marco Antonio, nel 43 a.C.', 'Dicono che parlasse tantissimo. Ho conosciuto uno in piazza che lo batte.'] }),
  npc('anziano', { trainer: 'anziano', name: 'Signore di Castellone', seed: 23, dir: 'down', lines: ['Castellone è nato per difendersi dai Saraceni, sopra l\'acropoli romana.', 'Le mura avevano dodici torri: intera è rimasta solo quella ottagonale. Il resto l\'hanno fatto le bombe del \'43.', 'Io a Castellone ci sono nato. Pure mio nonno.'] }),
  npc('teatro', { reacts: [{ after: 'pietra-mura', say: ['Il Cisternone ha smesso di brontolare. Dormo meglio.'] }], name: 'Signora del teatro', seed: 27, dir: 'down', lines: ['Lo sai che casa mia sta dentro il teatro romano?', 'È di età augustea: sopra la cavea ci hanno costruito le case. Ci abitiamo in trecento.'] }),
  npc('devota', { name: 'Devota di Sant\'Erasmo', seed: 28, dir: 'right', lines: ['Il 2 giugno è la festa di Sant\'Erasmo, il patrono.', 'Protegge i marinai: il «fuoco di Sant\'Elmo» che si vede sugli alberi delle navi porta il suo nome.'] }),
  npc('guida', { trainer: 'guida', name: 'Guida del museo', seed: 29, dir: 'down', lines: ['Al museo ci sono le statue dei notabili di Formiae e della famiglia imperiale, compreso Gaio Cesare, il nipote di Augusto.', 'Le hanno trovate quasi tutte nell\'antico Foro, oggi piazza Mattej.'] }),
  npc('fornaia', { name: 'Fornaia', seed: 24, dir: 'down', shop: 'forno', lines: ['Tiella di polpo o di scarola? Appena sfornata.', 'È la pizza bassa ripiena del golfo, nata tra pescatori e contadini. E ho pure le ciambelle all\'anice.'] }),
  npc('tifoso', { reacts: [{ after: 'pietra-mura', say: ['Al bar non si parla d\'altro: luci strane sotto Castellone.'] }, { after: 'tr-mamurra', say: ['Da quando c\'è questa storia di Mamurra, al bar viene più gente.', 'Dicono che di notte, sotto le mura di Castellone, si muova qualcosa di grosso.'] }, { after: 'sc-pietre-tenute', say: ['Stanotte le mura di Castellone hanno tremato. Mia moglie dice che è colpa tua.', 'Io non so niente, eh. Però di notte, sotto le mura, non ci andrei.'] }, { after: 'sc-lamo-preso', say: ['Hai preso il re dei Lestrigoni con un retino? Al bar non ci crede nessuno.', 'Mia moglie dice che è una stupidaggine. Però lo dice piano.'] }, { after: 'sc-lamo-amico', say: ['Dicono che il re dei Lestrigoni giri per Formia insieme a te. E che mangi.', 'Se passa dal bar, offro io. Ma prima avvisami.'] }, { after: 'sc-lamo-libero', say: ['Di notte a Castellone si sente russare. Dicono che sia il re dei Lestrigoni.', 'Mia moglie dice che è lei. Io non commento.'] }], name: 'Tifoso', seed: 51, dir: 'up', hint: true, lines: ['Il bar è pieno, c\'è la partita. Io guardo da qui.', 'Qui al bar si sa tutto.'] }),
  npc('gelataio', { name: 'Gelataio di Lavezzi', seed: 52, dir: 'down', activity: 'gelato', lines: ['Benvenuto da Lavezzi! Facciamo il gelato qui in piazza Marconi dal 1870.', 'Il bisnonno Amalio aveva un chiosco e solo due gusti, limone e caffè: la neve la prendeva sul Vesuvio.'] }),
  npc('studente', { trainer: 'studente', name: 'Studente della Vitruvio Pollione', seed: 64, dir: 'down', lines: ['Abbiamo la scuola proprio davanti alla chiesa di San Giovanni: a mezzogiorno suonano le campane e sembra la campanella.', 'La scuola porta il nome di Vitruvio Pollione, l\'architetto del «De architectura». Molti dicono che fosse di Formia.'] }),
  npc('animatore', { trainer: 'animatore', name: 'Animatore dell\'oratorio', seed: 63, dir: 'down', lines: ['Il pomeriggio l\'oratorio è pieno: chi gioca a pallone qui al campo, chi fa i compiti dentro.', 'Don Bosco diceva: «Basta che siate giovani perché io vi ami assai».'] }),
  npc('marinaio', { reacts: [{ after: 'tr-mamurr-peschiere', keep: true, say: ['Alle peschiere di Caposele c\'era uno che si immergeva di notte. Non si è più visto, per fortuna.'] }], name: 'Marinaio', seed: 32, dir: 'right', hint: true, lines: ['Questo va a Ponza e a Ventotene, tutto l\'anno.', 'Nelle notti brutte, sul molo del faro, a volte si accende una fiamma azzurra: il fuoco di Sant\'Elmo. Porta fortuna, ma non toccarlo.', 'Tu però prima finisci quello che hai cominciato in città.'] }),
  npc('velocista', { name: 'Velocista', seed: 61, dir: 'down', tourney: true, lines: ['Qui si allenava Pietro Mennea, con il professor Carlo Vittori.', 'Ogni anno qui si corre il Memorial Mennea. E da quest\'anno c\'è anche il Torneo degli amici: lo organizzo io.'] }),
  npc('tennista', { name: 'Tennista', seed: 26, dir: 'down', lines: ['Forchetta? È dentro, nel campo coperto. Fuori non gioca mai.'] }),
  npc('cestista', { name: 'Cestista', seed: 62, dir: 'down', lines: ['Stasera al Palamendola c\'è la partita. Vieni?'] }),
  npc('bagnino-oriente', { name: 'Bagnino del Lido Oriente', seed: 61, dir: 'down', activity: 'canoa', lines: ['Benvenuto al Lido Oriente! Siamo a Formia, sul lungomare Città di Ferrara: Gianola è a due passi.', 'Ti va un giro in canoa? Fino alla boa e ritorno: vediamo quanto ci metti.'] }),
  npc('bagnino', { reacts: [{ after: 'pietra-mare', say: ['L\'acqua è più calma da qualche giorno. Io non faccio domande.'] }], name: 'Bagnino', seed: 43, dir: 'down', hint: true, lines: ['Bandiera verde: si può fare il bagno.', 'Vindicio è Bandiera Blu. E con la termica del pomeriggio è il posto del windsurf e del kite.'] }),
  npc('bambino', { trainer: 'bambino', name: 'Bambino', seed: 42, dir: 'left', lines: ['Ho perso il secchiello.', 'Pure tu perdi sempre le cose?'] }),
  npc('guardaparco', { reacts: [{ after: 'sc-tullio1-sfotto', keep: true, say: ['Tullio è tornato a casa con la faccia lunga. Gli hai detto qualcosa?'] }, { after: 'sc-tullio1-amico', keep: true, say: ['Tullio è tornato a casa contento. Non lo ammetterà mai, ma gli hai fatto piacere.'] }, { after: 'sc-tullio2-sfotto', keep: true, say: ['Tullio non mi parla più. Passa le giornate da solo, sulle rovine della villa. Con chi si è messo?'] }, { after: 'sc-tullio2-amico', keep: true, say: ['Tullio si allena con te? Non me l\'ha detto. Ma non l\'avevo mai visto così.'] }], name: 'Guardaparco', seed: 44, dir: 'right', starter: true, lines: ['La villa era di Mamurra, un cavaliere di Formia: il prefetto del genio di Giulio Cesare.', 'Il porticciolo romano, qui sotto, forse era una peschiera. Oggi è area marina protetta: niente pesca e niente motori.', 'I vecchi dicono che al tramonto, tra le rovine, cammini qualcuno con due facce. Io non l\'ho mai visto.'] }),
  /* the net maker, by the guardaparco: every kind of net there is */
  npc('retaio', { name: 'Retaio', seed: 46, dir: 'down', shop: 'reti', lines: ['Reti e retini li faccio io, a mano, come si faceva a Mola.', 'Una creatura stanca si prende meglio: prima la fai lottare, poi le lanci il retino. Più il retino è buono, meno scappa.', 'La nassa è per le creature di mare. La rete della lampara è quella della pesca di notte: col buio vale il triplo.'] }),
  npc('pescatore', { name: 'Pescatore', seed: 31, dir: 'down', shop: 'pesca', lines: ['Mola è il borgo dei pescatori: la torre, il porto, le barche.', 'Il 24 giugno è San Giovanni: a Mola si fa festa fino a tardi.', 'Ti serve un retino? Con quello si prendono pure le creature.'] }),
  /* the wild creatures of Formia hide in the tall grass and the rock pools (data/encounters.ts); only the legend is in
     sight: Lamo, at night, under the walls of Castellone */
  npc('selv-lamo', { dir: 'down', wild: { sp: 'lamo', lv: [35, 35] }, legend: 'lamo' }),
  npc('selv-giano', { dir: 'left', wild: { sp: 'giano', lv: [36, 36] }, legend: 'giano' }),
  npc('selv-elmo', { dir: 'down', wild: { sp: 'fuocelmo', lv: [32, 32] }, legend: 'elmo' }),
  /* the plot: the stones of Telepilo (story/plot.ts) */
  npc('mamurr-scavi', { trainer: 'mamurr-scavi', look: 'mamurriano', name: 'Uomo con la pala', dir: 'left', when: { after: 'starter', until: 'tr-mamurr-scavi' },
    lines: ['Qui si scava, ragazzino. Scavi privati.'] }),
  npc('archivista', { name: 'Archivista della Torre', seed: 41, dir: 'down',
    lines: ['Questa torre è quello che resta del castello angioino di Mola: fu costruita dopo il sacco del 1289, sopra le terme romane.', 'Oggi dentro c\'è l\'Archivio storico della città. Carte, mappe, leggende: se cerchi qualcosa di Formia, è qui.'] }),
  npc('mamurr-cisterna', { trainer: 'mamurr-cisterna', look: 'mamurriano', name: 'Uomo con la torcia', dir: 'down', when: { after: 'trama-archivio', until: 'tr-mamurr-cisterna' },
    lines: ['Il Cisternone è chiuso. Per te, almeno.'] }),
  npc('mamurr-peschiere', { trainer: 'mamurr-peschiere', look: 'mamurriano', name: 'Sub con la muta', dir: 'down', when: { after: 'trama-archivio', until: 'tr-mamurr-peschiere' },
    lines: ['Mi sono immerso tutta la mattina tra le peschiere romane. E guarda cosa ho trovato.'] }),
  npc('mamurra', { trainer: 'mamurra', ghost: 'mamurra', name: 'Mamurra', dir: 'down', when: { after: 'pietra-voce', until: 'tr-mamurra' },
    lines: ['Ah, il ragazzo di Cicerone. Ti aspettavo.'] }),
  /* Tullio, the guardaparco's grandson and Antonio's rival (story/rival.ts): at the park as soon as they both have a
     creature, on the Appia on the way to Cicero's tomb, and at the park again once Mamurra is beaten */
  npc('tullio', { trainer: 'rivale-1', look: 'tullio', name: 'Tullio', dir: 'right',
    lines: ['Il nonno dice che le creature nascono dalla magia dei giganti. Io dico che nascono per lottare!'] }),
  npc('tullio-appia', { trainer: 'rivale-2', look: 'tullio', name: 'Tullio', dir: 'right',
    lines: ['Da quassù si vede tutto il golfo, fino a Gaeta. Vengo ad allenarmi qui, vicino alla tomba di Cicerone.'] }),
  { ...npc('tullio', { trainer: 'rivale-3', look: 'tullio', name: 'Tullio', dir: 'right',
    lines: ['Il nonno mi ha raccontato tutto: le pietre, il sigillo, Mamurra.'] }), id: 'tullio-campione' }
];

const item = (id: string, move: string, pron: string, t: string): LostItem => { const [x, y] = spot(id); return { id, move, x, y, pron, text: t }; };
const items: LostItem[] = [
  item('caricabatterie', 'simtoreal', 'lo', 'Era su una panchina della stazione.'),
  item('appunti', 'diagnosi', 'li', 'Erano sui gradini di Sant\'Erasmo.'),
  item('passaporto', 'america', 'lo', 'Era ai piedi della Tomba di Cicerone.'),
  item('portafoglio', 'certificati', 'lo', 'Era sotto un ombrellone dell\'Eclipse.')
];

/** neighbourhoods, for the place name in the corner: the first that contains Antonio wins. They lie on the tiles of
    the playable map (the streets of tools/formia/network.ts), and each one says what makes it itself */
const clip = (name: string, x0: number, y0: number, x1: number, y1: number, note?: string): Area => {
  const x = Math.max(0, x0), y = Math.max(0, y0);
  return { name, x, y, w: Math.min(W - 1, x1) - x + 1, h: Math.min(H - 1, y1) - y + 1, note };
};
const near = (name: string, id: string, m: number, note?: string): Area => { const p = at(id); return clip(name, p.x - m, p.y - m, p.x + p.w - 1 + m, p.y + p.h - 1 + m, note); };
const areas: Area[] = [
  /* the places */
  near('Parco la Fontana', 'casa', 3, 'Casa di Antonio, al numero 1 di via Giovanni Amendola.'),
  clip('Lido Oriente', 146, 39, 157, 51, 'Lo stabilimento del lungomare Città di Ferrara, a Formia, verso Gianola: canoe, pedalò, beach volley e beach soccer.'),
  near('Eclipse beach', 'eclipse-spiaggia', 2, 'Il lido di via Tito Scipione: ombrelloni, beach volley e il windsurf di Nicola Spadea.'),
  near('Pineta di Vindicio', 'pineta', 1, 'Pini domestici e ombra accanto al Lido Frungillo, a due passi dalla spiaggia.'),
  near('Birreria Morgana', 'morgana', 2, 'Via Abate Tosti 105, nel borgo di Mola: la sera ci si ritrova qui.'),
  near('Piazza della Vittoria', 'piazza', 2, 'Il cuore di Formia, con il monumento ai caduti del 1926.'),
  near('Stazione', 'stazione', 3, 'Formia-Gaeta, sulla linea Roma–Napoli.'),
  near('Bruno Zauli', 'zauli', 5, 'Il centro di preparazione olimpica, nato nel 1955: la pista dove correva Mennea.'),
  near('Tomba di Cicerone', 'tomba', 3, 'Sull\'Appia verso Itri: la tradizione dice che qui riposa Cicerone.'),
  near('Parco Gramsci', 'parco-gramsci', 1),
  near('Gelateria Lavezzi', 'gelati', 1, 'In piazza Marconi dal 1870: quattro generazioni di gelatai.'),
  near('Piazza San Giovanni', 'piazza-sangiovanni', 1, 'Il cuore di Mola: la chiesa dei Santi Lorenzo e Giovanni Battista e, di fronte, la scuola Vitruvio Pollione.'),
  clip('Villaggio Don Bosco', 119, 25, 139, 30, 'La parrocchia del Cuore Immacolato di Maria, l\'oratorio e il campo: dall\'altra parte dell\'Appia, quasi di fronte a casa.'),
  /* the neighbourhoods */
  clip('Porto', 74, 41, 104, 58, 'Il porto di Formia: traghetti e aliscafi per Ponza e Ventotene, le barche dei pescatori, il faro sul molo.'),
  clip('Largo Paone', 63, 32, 68, 36, 'Su via Vitruvio, accanto a piazza della Vittoria: il sabato c\'è il mercato.'),
  clip('Castellone', 41, 33, 66, 48, 'Il borgo alto, nato contro i Saraceni sull\'acropoli romana: la torre ottagonale dei Caetani, Sant\'Erasmo, il teatro romano con le case dentro.'),
  clip('Centro', 66, 22, 84, 50, 'Via Vitruvio, i negozi, il Comune con il Museo archeologico nazionale.'),
  clip('Mola', 84, 22, 112, 41, 'Il borgo marinaro: la torre del castello angioino, la chiesa di San Giovanni Battista, le barche dei pescatori.'),
  clip('Caposele', 57, 50, 74, 60, 'Il porticciolo di Caposele, dove comincia la spiaggia di Vindicio.'),
  clip('Vindicio', 0, 49, 57, 81, 'Più di un chilometro di spiaggia, dal porto fino a Gaeta: i lidi, il lungomare, la Bandiera Blu.'),
  clip('Monti Aurunci', 0, 0, 164, 4, 'Le montagne dietro Formia. Lassù c\'è Maranola, il borgo del presepe vivente.'),
  clip('Rio Fresco', 40, 5, 99, 33, 'Le case e gli uliveti sopra la ferrovia, verso le colline.'),
  clip('Via Amendola', 126, 5, 150, 30, 'Le palazzine di via Amendola, il Palamendola, Parco la Fontana.'),
  clip('Acqualonga', 99, 5, 126, 30, 'Tra Mola e via Amendola, lungo l\'Appia verso Napoli.'),
  clip('Scauri', 165, 5, 199, 81, 'Scauri, frazione di Minturno, subito dopo il Monte di Scauri: la stazione di Minturno-Scauri, sulla linea per Napoli.'),
  clip('Gianola', 148, 30, 164, 81, 'Il parco regionale, dal 1987: la villa di Mamurra, il porticciolo romano, la spiaggia dei Sassolini.'),
  clip('Santo Janni', 150, 5, 164, 30, 'Le ultime case di Formia, verso Gianola e Scauri.'),
  clip('Campagna', 0, 5, 40, 48, 'Gli uliveti a ovest della città, verso Itri: qui la ferrovia esce dalla galleria.')
];

const st = spot('start');
export const formia: MapDef = {
  name: 'Formia',
  rows: FORMIA_ROWS,
  buildings, objects, groundObjects, signs, npcs, items, areas,
  start: [st[0], st[1], 'down'],
  starts: (['valentin', 'costanzo', 'forchetta', 'andrea', 'zendavid'] as const).reduce(function (o, id) { const p = spot('start-' + id); o[id] = [p[0], p[1], 'down']; return o; }, {} as Record<string, [number, number, Dir]>)
};
/** where Antonio's scooter can take him: it is parked at each of these */
export const RIDES: { name: string; at: [number, number] }[] = [
  { name: 'Casa', at: spot('motorino') }, { name: 'Eclipse beach', at: spot('motorino-eclipse') },
  { name: 'Morgana', at: spot('motorino-morgana') }, { name: 'Piazza della Vittoria', at: spot('motorino-piazza') },
  { name: 'Bruno Zauli', at: spot('motorino-zauli') }, { name: 'Pineta di Vindicio', at: spot('motorino-pineta') }
];
