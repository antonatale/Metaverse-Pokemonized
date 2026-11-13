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
const door = (id: string): [number, number] => at(id).door!;
const specOf = (id: string) => PLACES.find((p) => p.id === id)!;
const kindOf = (id: string) => specOf(id).kind;
function building(id: string, o: Partial<Building>): Building {
  const p = at(id), sp = specOf(id);
  return { id, kind: sp.kind, x: p.x, y: p.y, w: p.w, h: p.h, door: door(id), up: sp.up, look: sp.look, ...o };
}
function object(id: string, o: Partial<MapObject> = {}): MapObject {
  const p = at(id);
  return { kind: kindOf(id), x: p.x, y: p.y, w: p.w, h: p.h, ...o };
}
function sign(id: string, text: string[]): Sign { const [x, y] = spot(id); return { x, y, text }; }
function npc(id: string, o: Omit<Npc, 'id' | 'x' | 'y'>): Npc { const [x, y] = spot(id); return { id, x, y, ...o }; }
function label(x: number, y: number, t: string, size: number, alpha?: number): GroundObject { return { kind: 'text', x, y, text: t, size, alpha }; }
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
/* the shops under the palazzi of the cortine that have no counter in the game */
const SHUT = [
  ['La serranda è abbassata a metà. Dentro qualcuno conta la cassa.'],
  ['In vetrina, cose che non ti servono. Per ora.'],
  ['«Torno subito». Il cartello non dice quando.'],
  ['Chiuso per pausa pranzo. A Formia la pausa pranzo è lunga.']
];
const ROOFS = ['#ff9a8b', '#9ec5ff', '#ffd166', '#c3a6ff', '#ff9a8b', '#ffd166'];
/* the shops of the town: a few places, each one its own (its face in render/canvas/objects.ts, what it sells in SHOPS of
   data/growth.ts), at the shop fronts the generator leaves along the streets; the other shop fronts are homes. No shop
   bears the name of a private person: the names are of the places (Largo Paone, Mola) or of what they are */
const SHOPS: { at: [number, number]; kind: string; label: string; shop: string; msg: string[] }[] = [
  { at: [129, 61], kind: 'pharmacy', label: 'FARMACIA', shop: 'farmacia', msg: ['Farmacia S. Anna, in piazza Tommaso Testa. La croce verde è accesa.'] },
  { at: [116, 64], kind: 'bookshop', label: 'LIBRERIA', shop: 'libreria', msg: ['La libreria. In vetrina, un libro su Cicerone e uno su Mennea.'] },
  { at: [138, 67], kind: 'fishmonger', label: 'PESCHERIA', shop: 'pescheria', msg: ['La pescheria di Mola, accanto a Morgana: il pesce arriva la mattina dalle barche del borgo.'] },
  { at: [93, 74], kind: 'newsstand', label: 'EDICOLA', shop: 'edicola', msg: ['L\'edicola. Il giornale di oggi è appeso davanti.'] }
];
/** each shop takes the shop front the generator left nearest to its place (a house of the shops, or a palazzo of a
    cortina with a shop below); no two take the same one */
const SHOP_AT: Record<number, typeof SHOPS[number]> = {};
for (const sh of SHOPS) {
  let best = -1, bd = 1e9;
  FORMIA_HOUSES.forEach((h, k) => {
    const d = Math.abs(h.x - sh.at[0]) + Math.abs(h.y - sh.at[1]);
    if ((h.kind === 'shop' || h.look === 'bottega') && !SHOP_AT[k] && d < bd) { bd = d; best = k; }
  });
  if (best < 0) throw new Error('Formia: no shop front left for ' + sh.shop);
  SHOP_AT[best] = sh;
}
const houses: Building[] = FORMIA_HOUSES.map((h, k): Building => {
  const base = { id: 'casa-' + k, kind: h.kind, x: h.x, y: h.y, w: h.w, h: h.h, door: h.door, roof: ROOFS[h.v % ROOFS.length], v: h.v, up: h.up, look: h.look };
  const sh = SHOP_AT[k];
  /* a shop in a palazzo of a cortina keeps the palazzo, with that shop on its ground floor */
  if (sh && h.kind === 'cortina') return { ...base, look: sh.kind, label: sh.label, shop: sh.shop, msg: sh.msg };
  if (sh) return { ...base, kind: sh.kind, label: sh.label, shop: sh.shop, msg: sh.msg };
  /* a shop of a cortina with nobody behind the counter today */
  if (h.look === 'bottega') return { ...base, msg: SHUT[h.v % SHUT.length] };
  return { ...base, kind: h.kind === 'shop' ? 'house' : h.kind, msg: DOORS[h.v % DOORS.length] };
});

const buildings: Building[] = [
  building('casa', { label: 'CASA DI ANTONIO', to: 'casa', tx: 5, ty: 6, tdir: 'up', v: 11 }),
  /* the homes of the others: each one's story begins at his door (MapDef.starts) */
  building('casa-valentin', { label: 'CASA DI VALENTIN', v: 23, to: 'casa-valentin', tx: 5, ty: 6, tdir: 'up' }),
  building('casa-costanzo', { label: 'CASA DI COSTANZO', v: 41, to: 'casa-costanzo', tx: 5, ty: 6, tdir: 'up' }),
  building('casa-forchetta', { label: 'CASA DI FORCHETTA', v: 7, to: 'casa-forchetta', tx: 5, ty: 6, tdir: 'up' }),
  building('casa-claudia', { label: 'CASA DI CLAUDIA', v: 12, to: 'casa-claudia', tx: 5, ty: 6, tdir: 'up' }),
  /* across via Palazzo from Claudia's: the Mattej school, and the little park with the swings in front of it */
  building('scuola-mattej', { label: 'SCUOLA MATTEJ', msg: ['Scuola Mattej, in via Palazzo: le elementari e le medie dell\'Istituto comprensivo «Pasquale Mattej».', 'Davanti, il parchetto con gli alberi e le altalene. Di fronte abita Claudia.'] }),
  building('casa-zendavid', { label: 'CASA DI ZENDAVID', v: 33, to: 'casa-zendavid', tx: 5, ty: 6, tdir: 'up' }),
  building('stazione-scauri', { label: 'MINTURNO-SCAURI', msg: ['Stazione di Minturno-Scauri, sulla linea Roma–Napoli che passa per Formia.', 'Da qui a Formia è una fermata.'] }),
  building('casa-andrea', { label: 'CASA DI ANDREA', v: 58, to: 'casa-andrea', tx: 5, ty: 6, tdir: 'up' }),
  /* the other palazzine of Parco la Fontana */
  ...['A', 'B', 'C', 'D', 'E', 'F'].map((l, k) => building('palazzina-' + (k + 1), { v: 11 + k * 7, msg: ['Parco la Fontana, palazzina ' + l + '.', DOORS[(k + 2) % DOORS.length][0]] })),
  /* what Antonio asked for on 11 November 2026 (docs/fonti-formia.md) */
  building('altieri', { label: 'TABACCHI', v: 1, to: 'altieri', tx: 4, ty: 6, tdir: 'up' }),
  building('telaro', { label: 'TELARO', v: 4, msg: ['Enoteca Telaro, a due passi da Largo Paone.', 'In vetrina, i vini del basso Lazio e della Campania: il confine è a pochi chilometri.'] }),
  building('barber-may', { label: 'BARBER MAY', v: 2, to: 'barber-may', tx: 4, ty: 5, tdir: 'up' }),
  building('zanzibar', { label: 'ZANZIBAR', v: 2, msg: ['Zanzibar, il bar di piazza Tommaso Testa, davanti al parcheggio di Largo Paone.', 'Fuori i tavolini, dentro il bancone: a Formia ci si dà appuntamento qui.'] }),
  building('mercato', { label: 'MERCATO', shop: 'mercato', msg: ['Il mercato di Largo Paone: il sabato il parcheggio si riempie di bancarelle, dal porto fino a piazza Tommaso Testa.'] }),
  building('castello-mura', { label: 'CASTELLO DI MOLA', msg: ['Il castello di Mola: le mura, il portale di pietra e, dietro, la torre.', 'Il cortile è chiuso. Dentro c\'è l\'Archivio storico: ci lavora l\'archivista.'] }),
  building('scuola-deamicis', { label: 'DE AMICIS', msg: ['Istituto comprensivo «Edmondo De Amicis», su via Emanuele Filiberto, sopra piazza Risorgimento.', 'Dalle finestre si sente una classe che ripete le tabelline.'] }),
  building('bar-porto', { label: 'BAR DEL PORTO', msg: ['Il bar del porto, accanto all\'imbarco dei traghetti.', 'Caffè al volo prima dell\'aliscafo per Ponza.'] }),
  building('zianna', { label: 'ZI\' ANNA MARE', msg: ['Ristorante sul porto, «Largo Paone lato mare».', 'Dalla cucina arriva odore di frittura di paranza.'] }),
  building('palazzo-alto', { v: 1, msg: ['Il palazzo alto di Largo Paone, all\'angolo della rotonda.', 'Dai piani di sopra si vede tutto il golfo, fino a Gaeta.'] }),
  building('ospedale', { label: 'OSPEDALE DONO SVIZZERO', msg: ['Ospedale «Dono Svizzero», in via Appia Lato Napoli: il presidio ospedaliero sud della ASL di Latina.', '«Dono svizzero» si chiamavano gli aiuti che la Svizzera mandò alle vittime della guerra.', 'Il pronto soccorso è aperto. Per fortuna, oggi non ti serve.'] }),
  building('san-michele', { msg: ['L\'eremo di San Michele Arcangelo, dentro una cavità della roccia: è ricordato già nell\'830.', 'La facciata con il rosone e il portale a sesto acuto è del 1895.', 'Una tradizione dice che la statua del santo stesse prima in una grotta di Gianola, giù al mare.'] }),
  building('castello-miramare', { label: 'CASTELLO MIRAMARE', v: 34, msg: ['Il Castello Miramare, sulla collina sopra la stazione.', 'Sembra un castello, con le torrette: è un albergo, e dalla terrazza si vede tutto il golfo.'] }),
  building('villa-rubino', { label: 'VILLA RUBINO', v: 52, msg: ['Villa Rubino, a Caposele: fu la residenza d\'estate di Ferdinando II di Borbone.', 'Sotto ci sono i resti di una villa romana sul mare: la tradizione dice che fosse di Cicerone.', 'Il cancello è chiuso: è una casa privata.'] }),
  building('palamendola', { label: 'PALAMENDOLA', msg: ['Il Palamendola, il palazzetto dello sport di via Amendola.', 'Dentro si sentono i palloni rimbalzare.'] }),
  building('zauli', { label: 'CENTRO OLIMPICO', msg: ['Centro di Preparazione Olimpica «Bruno Zauli»: più di venti sport, all\'aperto e al coperto.', 'Si entra solo con il tesserino.'] }),
  building('tennis', { label: 'TENNIS COPERTI', to: 'circolo', tx: 5, ty: 11, tdir: 'up' }),
  building('morgana', { label: 'MORGANA', v: 3, to: 'morgana', tx: 5, ty: 7, tdir: 'up' }),
  building('chiesa-mola', { label: 'SAN GIOVANNI BATTISTA', msg: ['Chiesa dei Santi Lorenzo e Giovanni Battista, in piazza San Giovanni, nel borgo di Mola: è citata già nell\'841.', 'Fino all\'Ottocento erano due chiese divise da un muro. La guerra l\'ha quasi distrutta, poi è stata ricostruita.', 'Dentro c\'è una tavola di Antoniazzo Romano, dipinta verso il 1490.'] }),
  building('scuola', { label: 'VITRUVIO POLLIONE', msg: ['Istituto comprensivo «Vitruvio Pollione»: la scuola media di Mola, in via Emanuele Filiberto.', 'Dalle finestre aperte si sente la ricreazione.'] }),
  building('donbosco', { label: 'DON BOSCO', msg: ['Villaggio Don Bosco: la parrocchia del Cuore Immacolato di Maria, su via Appia Lato Napoli.', 'Quasi di fronte a casa di Antonio, dall\'altra parte dell\'Appia. La chiesa è aperta: dentro c\'è silenzio.'] }),
  building('oratorio', { label: 'ORATORIO', msg: ['L\'oratorio del Villaggio Don Bosco.', 'Da dentro arrivano voci di ragazzi e il rumore di una partita a biliardino.'] }),
  building('gelati', { label: 'LAVEZZI', msg: ['Gelateria Lavezzi, in piazza Marconi dal 1870.', 'Amalio Lavezzi cominciò con un chiosco: solo limone e caffè, fatti con la neve del Vesuvio. Oggi c\'è la quarta generazione.'] }),
  building('bar', { label: 'BAR', v: 5, msg: ['Il bar è pieno: c\'è la partita.', 'Al banco però il caffè lo fanno lo stesso.'], shop: 'bar' }),
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
  object('fontana'), object('torre-mola'), object('cannelle'), object('torre-castellone'), object('tomba'), object('mamurra'), object('cisternone'), object('acquedotto'),
  object('traghetto', { bob: true }),
  /* a train standing at the station, the monument in Piazza della Vittoria, the lighthouse at the end of the mole */
  { kind: 'train', x: at('stazione').x + 1, y: at('stazione').y - 1, w: 7, h: 1 },
  { kind: 'monument', x: at('piazza').x + 8, y: at('piazza').y + 5, w: 1, h: 1 },
  object('faro'), object('torre-maranola'), object('tribuna'),
  /* the swings of the little park in front of the Mattej school, and a slide */
  { kind: 'swings', x: at('parchetto-mattej').x + 1, y: at('parchetto-mattej').y + 1, w: 2, h: 1 },
  { kind: 'slide', x: at('parchetto-mattej').x + 3, y: at('parchetto-mattej').y + 2, w: 1, h: 1 }
].concat(FORMIA_TUNNELS.map(([x, y]): MapObject => ({ kind: 'tunnel', x, y, w: 1, h: 2 })));

const pz = at('piazza'), cam = at('campo-amendola'), track = at('pista');
const groundObjects: GroundObject[] = [
  { kind: 'banner', x: pz.x + 2, y: pz.y + 1, w: 6, text: 'COMIZIO' },
  { kind: 'court', x: cam.x, y: cam.y, w: cam.w, h: cam.h },
  { kind: 'track', x: track.x, y: track.y, w: track.w, h: track.h },
  /* the cavea of the Roman theatre, south of Sant'Erasmo; Maranola up in the Aurunci */
  { kind: 'cavea', x: at('erasmo').x - 1, y: at('erasmo').y + 4, w: 8, h: 2 },
  label(134, 19, 'Maranola', 15, 0.7),
  label(40, 40, 'Monti Aurunci', 22),
  label(215, 12, 'Monti Aurunci', 19, 0.7),
  text(41.24857, 13.58073, 'Vindicio', 20, 0.6),
  text(41.2470, 13.6050, 'Golfo di Gaeta', 26, 0.5),
  label(72, 66, 'Castellone', 17, 0.7),
  label(138, 71, 'Mola', 18, 0.7),
  label(268, 88, 'Gianola', 18, 0.7),
  label(306, 100, 'Scauri', 18, 0.6),
  /* where the roads lead, past the edges of the map */
  text(41.24347, 13.5734, 'verso Gaeta', 15, 0.6),
  text(41.25469, 13.5685, 'verso Itri e Roma', 15, 0.6),
  label(308, 76, 'verso Napoli', 15, 0.6)
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
  sign('sign-mola', ['Torre di Mola, del castello angioino: fu costruita dopo il sacco del 1289, sopra le terme romane.', 'È rotonda e merlata, alta 27 metri e larga 15: guarda il porticciolo di Mola. Oggi ospita l\'Archivio storico di Formia.', 'Ai suoi piedi la piazzetta con l\'ancora, dove i ragazzini si arrampicano.']),
  sign('sign-darsena', ['Il porticciolo di Mola, sotto la torre: i gozzi dei pescatori stanno legati lungo le due banchine.', 'Il lungomare gli passa sopra, sul ponticello. Al tramonto le barche rientrano e la torre diventa arancione.', '↑ La Torre di Mola, via Abate Tosti · ← Il porto, i traghetti per Ponza']),
  /* the buoys out at sea: the 300 metres of the bathing waters, the shoals, the middle of the gulf */
  { ...sign('boa-300', ['Boa bianca dei 300 metri: qui finiscono le acque dei bagnanti.', 'Oltre, il mare è delle barche, dei windsurf di Nicola e delle creature del largo.', 'Attenzione ai motoscafi: nuota vicino alle boe.']), buoy: true },
  { ...sign('boa-secche', ['Boa gialla: le secche di Mola.', 'Sotto, a una ventina di metri, posidonia, cocci di anfore romane e le tane delle murene.', 'I pescatori la chiamano così da sempre: ci si fermava a calare le reti.']), buoy: true },
  { ...sign('boa-golfo', ['Il golfo di Gaeta, nel mezzo.', 'Da qui si vedono insieme il promontorio di Gaeta con la sua montagna spaccata, Formia stesa ai piedi degli Aurunci, e Gianola col suo monte.', 'Nelle giornate limpide, laggiù in fondo, Ponza e Ventotene.']), buoy: true, view: { id: 'golfo', name: 'Il golfo dal largo' } },
  sign('sign-morgana', ['Birreria Morgana, via Abate Tosti 105, nel borgo di Mola: l\'ingresso è qui, sulla Pinetina.', 'La sera ci si vede qui.', '↑ Via Abate Tosti: la pescheria, il bar, la Torre di Mola, l\'ancora · ← Largo Paone']),
  sign('sign-porto', ['Porto di Formia: l\'imbarco dei traghetti per le isole pontine.', 'Traghetti e aliscafi Laziomar per Ponza e Ventotene, tutto l\'anno: un\'ora circa con l\'aliscafo, più di due con il traghetto.']),
  sign('sign-tomba', ['Tomba di Cicerone, sull\'Appia verso Itri.', 'La tradizione dice che qui riposa Marco Tullio Cicerone, ucciso vicino alla sua villa di Formia il 7 dicembre del 43 a.C.']),
  sign('sign-vindicio', ['Spiaggia di Vindicio: più di un chilometro di sabbia, dal porto fino a Gaeta. Bandiera Blu.', 'D\'estate qui c\'è tutta Formia.', '← La Scogliera, la Tomba di Cicerone · → La pineta, il centro, Mola']),
  sign('sign-pineta', ['Pineta di Vindicio, accanto al Lido Frungillo, all\'inizio di via Tito Scipione.', 'Pini domestici, ombra e tavoli per il picnic, a due passi dalla spiaggia.']),
  sign('sign-zauli', ['Centro di Preparazione Olimpica «Bruno Zauli», via Appia Lato Napoli.', 'Nato nel 1955 da un\'idea di Bruno Zauli, presidente della federazione di atletica. Qui il professor Carlo Vittori allenava Pietro Mennea.', '← Mola, il centro · → Via Amendola, casa']),
  sign('sign-gianola', ['Parco regionale di Gianola e del Monte di Scauri, nato nel 1987.', 'Sul promontorio la villa di Mamurra, con l\'edificio ottagonale detto «Tempio di Giano». Sotto, il porticciolo romano.']),
  sign('sign-caposele', ['Porticciolo di Caposele.', 'Da qui parte la spiaggia di Vindicio, verso Gaeta.']),
  sign('sign-porticciolo', ['Il porticciolo romano di Gianola.', 'Le banchine che si vedono sono del 1930 circa: stanno sopra le vasche di una peschiera romana, quella della villa di Mamurra.', 'Oggi è area marina protetta.']),
  sign('sign-sangiovanni', ['Piazza San Giovanni, nel borgo di Mola.', 'La chiesa dei Santi Lorenzo e Giovanni Battista; a destra sale via Solaro e c\'è la scuola Vitruvio Pollione. Sopra, i resti dell\'acquedotto romano, il Castellum Aquae.', '← Largo Paone · → La scuola De Amicis, piazza Risorgimento, l\'ospedale']),
  /* the three trails of the relief (VISIONE.md, V3 and V4): what they pass, and the belvederi at their ends */
  sign('sign-statua', ['Da qui si sale a piedi verso Maranola e gli Aurunci.', 'Più su, la Strada della Statua porta alla Cima del Redentore, a 1252 metri: fu fatta per portarci la statua di ghisa, alzata il 31 luglio 1901.', '↑ Gli uliveti a terrazze · il belvedere']),
  sign('sign-eremo', ['Sotto la Cima del Redentore, dentro la roccia, c\'è l\'eremo di San Michele Arcangelo: è ricordato già nell\'830.', 'L\'ultima domenica di giugno i devoti di Maranola portano lassù a spalla la statua del santo. Il 29 settembre la riportano in paese.']),
  { ...sign('vista-redentore', ['Il belvedere degli Aurunci.', 'Dalla Cima del Redentore, nelle giornate limpide, si vedono Ponza, Ventotene, Ischia e il Vesuvio. Da qui, intanto, tutta Formia.']), view: { id: 'aurunci', name: 'Formia dagli Aurunci' } },
  sign('sign-fontana', ['Sull\'Appia, verso Itri, c\'è la Fontana di San Remigio: una fontana romana a parete, di età tardo-repubblicana.', 'L\'acqua usciva da due mascheroni, il sole e la luna. Ha dato da bere a chi passava fino agli anni Sessanta.']),
  sign('sign-tulliola', ['La Tomba di Tulliola, sul pendio dell\'Acervara, un centinaio di metri sopra la Tomba di Cicerone.', 'La tradizione la dice della figlia di Cicerone. Lui voleva dedicarle un santuario, e ne scrisse all\'amico Attico.']),
  { ...sign('vista-acervara', ['Il belvedere dell\'Acervara.', 'Laggiù, lungo l\'Appia, spunta la Tomba di Cicerone, alta 24 metri. Oltre, il golfo fino a Gaeta.']), view: { id: 'acervara', name: 'Il golfo dall\'Acervara' } },
  sign('sign-cisterna', ['La Cisterna delle 36 colonne.', 'Dava l\'acqua alla villa di Mamurra, che scendeva verso il mare su tre terrazze. Nel parco ce n\'è un\'altra, la Cisterna maggiore.']),
  sign('sign-janara', ['La Grotta della Janara.', 'Non è una grotta: è la scala coperta, a volta, che univa due livelli della villa. Le janare, da queste parti, sono le streghe.', '↓ La punta di Gianola']),
  { ...sign('vista-gianola', ['Il belvedere della punta di Gianola.', 'La villa fu costruita intorno al 50 a.C. Da qui si guarda tutto il golfo di Gaeta.']), view: { id: 'gianola', name: 'Il golfo dalla punta di Gianola' } },
  sign('sign-bivio-gianola', ['↓ Via Gianola: il parco, la villa di Mamurra, il Lido Oriente.', '→ Scauri · ← Via Amendola, Mola, il centro']),
  sign('sign-scauri', ['→ Scauri e la stazione di Minturno-Scauri.', '← Gianola, Formia']),
  sign('sign-largo-paone', ['Largo Paone.', 'Il parcheggio grande tra piazza Tommaso Testa e il porto: il sabato c\'è il mercato. Oltre i pini, i traghetti e Gaeta.', '← Via Vitruvio, il Comune · ↑ Via Emanuele Filiberto · → Via Tullia, via Abate Tosti, la Torre di Mola · ↓ il porto']),
  sign('sign-risorgimento', ['Piazza Risorgimento, in cima a Mola: di fronte la scuola De Amicis.', '↑ Via Ferrucci: l\'ospedale Dono Svizzero, e più su la Rotabile per Maranola · → Lo Zauli, via Amendola · ← Via Emanuele Filiberto: San Giovanni, Largo Paone · ↓ Il lungomare, la Torre di Mola']),
  sign('sign-maranola', ['Maranola, borgo di Formia sui primi Aurunci.', 'La torre è dei Caetani. A Natale tutto il paese diventa un presepe vivente.', '← La Strada della Statua: l\'eremo di San Michele, il belvedere']),
  sign('sign-mattej', ['Piazza Mattej.', 'Qui sotto c\'era il Foro di Formiae: le statue del museo le hanno trovate scavando qui.', '↑ Castellone · → Via Vitruvio, il Comune']),
  sign('sign-rotabile', ['Via Rotabile: sale a Maranola con due tornanti.', 'In motorino è un attimo. A piedi, meno.']),
  { ...sign('vista-rotabile', ['Il tornante della Rotabile.', 'Da quassù si vedono Mola, il porto e, in fondo al golfo, il promontorio di Gaeta.']), view: { id: 'rotabile', name: 'Formia dal tornante della Rotabile' } },
  sign('sign-molo', ['Molo Vespucci.', 'Di qua il capolinea dei pullman, di là la biglietteria dei traghetti. In fondo al molo, il faro.']),
  sign('sign-ingresso-gianola', ['Parco regionale di Gianola e del Monte di Scauri: l\'ingresso.', '↓ La villa di Mamurra, il porticciolo romano · → Il sentiero della punta', 'In motorino si arriva fin qui. Dentro si va a piedi.']),
  sign('sign-sassolini', ['La spiaggia dei Sassolini, sotto il Monte di Scauri.', 'Niente sabbia: ciottoli lisci, e l\'acqua più chiara del golfo.']),
  sign('sign-scauri-nome', ['Scauri, frazione di Minturno.', 'Il nome viene da Marco Emilio Scauro, console romano nel 115 a.C.: da queste parti aveva una villa.']),
  sign('sign-donbosco', ['Villaggio Don Bosco, parrocchia del Cuore Immacolato di Maria.', 'La chiesa, l\'oratorio e il campo: il pomeriggio è pieno di ragazzi.', '↑ Via Amendola, Parco la Fontana · ← Mola, il centro'])
]
  /* the monument in Piazza della Vittoria: read it by walking up to it */
  .concat([{ x: at('piazza').x + 8, y: at('piazza').y + 5, quiet: true, text: ['Il monumento ai caduti, del 1926: una Vittoria accanto all\'epigrafe per i caduti di Formia.'] }])
  /* the street-name plates, with a word on each street */
  .concat(([
    ['targa-vitruvio', 'Via Vitruvio', 'La strada dei negozi e del Comune. Porta il nome di Vitruvio, l\'architetto romano del «De architectura».'],
    ['targa-abate-tosti', 'Via Abate Tosti', 'Il vicolo di Mola: comincia dove finisce via Tullia e va fino alla torre, lastricato, stretto tra due file di palazzi. La sera è il cuore della movida.'],
    ['targa-appia', 'Via Appia', 'La regina delle strade: da Roma passa per Formia e va verso Capua. Qui, verso Itri, c\'è la Tomba di Cicerone.'],
    ['targa-vindicio', 'Via Vindicio', 'La strada della spiaggia: lidi da una parte, case dall\'altra, fino a Gaeta.'],
    ['targa-tito-scipione', 'Via Tito Scipione', 'Il lungomare dei lidi: al 3 il Lido Frungillo e la pineta, al 58 l\'Eclipse.'],
    ['targa-amendola', 'Via Giovanni Amendola', 'Al numero 1 c\'è Parco la Fontana: casa di Antonio. Più giù, il Palamendola.'],
    ['targa-appia-napoli', 'Via Appia Lato Napoli', 'L\'Appia verso Napoli, lungo la baia: al 175 il centro Bruno Zauli.'],
    ['targa-gianola', 'Via Gianola', 'Scende verso il parco di Gianola e il lungomare di Formia che porta il nome di Ferrara, con il Lido Oriente.'],
    ['targa-sgb', 'Via San Giovanni Bosco', 'Dall\'Appia scende al Villaggio Don Bosco, quasi di fronte a Parco la Fontana.'],
    ['targa-palazzo', 'Via Palazzo', 'San Giulio: la scuola Mattej, il parchetto con le altalene e, di fronte, la casa di Claudia.'],
    ['targa-ferrucci', 'Via Adalgiso Ferrucci', 'Da piazza Risorgimento sale verso l\'ospedale Dono Svizzero. Qui abita Valentin.'],
    ['targa-solaro', 'Via Solaro', 'Sale a destra di San Giovanni e poi gira a sinistra. Qui abita Costanzo.'],
    ['targa-mattei', 'Piazza Pasquale Mattei', 'A Castellone. Andrea abita a due passi da qui.']
  ] as [string, string, string][]).map(([id, street, note]): Sign => ({ ...sign(id, [street + '.', note]), plate: true })));

const npcs: Npc[] = [
  /* the covi on the street: each friend in theirs, with a challenge (data/covi.ts); Forchetta's and Claudia's are
     indoors (circolo.ts, morgana.ts); whoever is played does not meet themself */
  npc('costanzo', { person: 'costanzo', dir: 'down', covo: 'piazza', unless: 'costanzo' }),
  npc('antonio-covo', { person: 'antonio', name: 'antonio', dir: 'down', covo: 'palamendola' }),
  /* a friend once beaten comes out of his covo now and then, where the others hang out */
  npc('forchetta-eclipse', { person: 'forchetta', name: 'forchetta', dir: 'left', beaten: 'circolo', lines: ['Poteva andare peggio: sole, mare, Eclipse.', 'Dopo la spiaggia, una partita alla Play da te?'] }),
  npc('folla1', { name: 'Dalla folla', seed: 11, dir: 'up', lines: ['Comizio alle sei. Anzi alle sette. Insomma, quando arriva lui.'] }),
  npc('folla2', { name: 'Dalla folla', seed: 12, dir: 'up', lines: ['Daje!'] }),
  npc('folla3', { name: 'Dalla folla', seed: 13, dir: 'up', lines: ['Ho provato a interromperlo un\'ora fa. Sta ancora parlando.'] }),
  npc('folla4', { name: 'Dalla folla', seed: 14, dir: 'right', lines: ['Io sono venuto solo per la difesa del bidet.'] }),
  npc('nicola', { name: 'Nicola Spadea', look: 'nicola', dir: 'up', activity: 'windsurf', lines: ['{hero}! Oggi a Vindicio c\'è la termica giusta, mare piatto e vento costante.', 'Ho cominciato qui, nel golfo, nell\'estate del 1999: Vindicio è il mio spot di casa.', 'Mi piacciono le onde e il freestyle. Quando non sono in acqua, cammino in montagna.', 'Ti va una lezione di windsurf? Ti insegno a planare.'] }),
  /* Faro, Nicola's Delfaro: it leaps in front of the Eclipse; on stormy nights it lights the lamp on its head */
  npc('faro-nicola', { name: 'Faro', mon: 'delfaro', dir: 'left', lines: ['Faro, il Delfaro di Nicola, salta fuori dall\'acqua e ti schizza tutto. «KIII! Tutti in porto!»', 'Le notti di burrasca accende la luce che ha in testa: le barche di Mola lo seguono fino al porto.'] }),
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
  npc('infermiere', { name: 'Infermiere', seed: 95, dir: 'down', lines: ['Turno di notte finito. Adesso un caffè a piazza Risorgimento e poi a dormire.', 'Via Ferrucci la faccio a piedi tutti i giorni: l\'ospedale è a due passi da Mola.'] }),
  npc('vecchio-paone', { name: 'Signore di Largo Paone', seed: 96, dir: 'down', hint: true, lines: ['«Ci vediamo a Largo Paone»: a Formia si dice così da sempre.', 'Poi uno arriva tardi, ma il posto è questo.'] }),
  npc('maranolese', { name: 'Signora di Maranola', seed: 97, dir: 'down', lines: ['A Natale qui si fa il presepe vivente: le botteghe, i mestieri, tutto il paese.', 'L\'ultima domenica di giugno portiamo San Michele su all\'eremo, a spalla. Il 29 settembre lo riportiamo giù.'] }),
  npc('pellegrino', { name: 'Pellegrino', seed: 98, dir: 'down', lines: ['Dentro la grotta c\'è una sorgente. E un silenzio che giù in città te lo sogni.', 'Più su c\'è il Redentore: la statua è lassù dal 1901.'] }),
  npc('allenatore', { name: 'Allenatore', seed: 99, dir: 'right', lines: ['Sei corsie. Sul rettilineo d\'arrivo, otto.', 'Entra pure in pista: il tartan è fatto per essere calpestato. Di corsa, possibilmente.'] }),
  npc('mamma-rodari', { name: 'Mamma al parco', seed: 101, dir: 'down', lines: ['Il parco porta il nome di Gianni Rodari, quello delle «Favole al telefono».', 'I bambini lo sanno: qui si viene per l\'altalena.'] }),
  npc('postino', { name: 'Postino', seed: 102, dir: 'down', hint: true, lines: ['Sopra la stazione le vie salgono tutte. Io le faccio in motorino, sennò finisco a mezzanotte.'] }),
  npc('pescatore-canna', { name: 'Pescatore con la canna', seed: 103, dir: 'down', lines: ['Dagli scogli, la sera, viene su la spigola. Se hai pazienza.', 'Tra i sassi, con la bassa marea, si nasconde di tutto. Anche le creature.'] }),
  npc('ragazza-scogli', { name: 'Ragazza sugli scogli', seed: 112, dir: 'down', lines: ['Da qui si vede Gaeta, dall\'altra parte del golfo.', 'La sera le luci del lungomare arrivano fino a qua.'] }),
  npc('bagnante-santojanni', { name: 'Bagnante', seed: 104, dir: 'down', lines: ['Santo Janni: sabbia, scogli e le barriere che tengono fermo il mare.', 'Da qui il lungomare scende fino a Gianola.'] }),
  npc('contadina', { name: 'Contadina', seed: 105, dir: 'left', lines: ['Tra Formia e Scauri è tutto uliveto.', 'D\'inverno stendiamo le reti sotto gli alberi e aspettiamo che le olive cadano.'] }),
  npc('pensionato', { name: 'Pensionato', seed: 106, dir: 'down', lines: ['Qui sotto passa la ferrovia: entra in galleria e sbuca alla stazione.', 'Quando passa il merci tremano i bicchieri nella credenza.'] }),
  npc('pittore', { name: 'Pittore', seed: 107, dir: 'down', lines: ['Dipingo il golfo da trent\'anni.', 'Non viene mai uguale: cambia la luce, cambio io.'] }),
  npc('pescatore-molo', { name: 'Pescatore del molo', seed: 108, dir: 'down', lines: ['Le barche escono di notte e rientrano all\'alba.', 'Il faro lo vedi da tutto il golfo: quando lo vedi, sei a casa.'] }),
  npc('bagnina-scauri', { name: 'Bagnina di Scauri', seed: 109, dir: 'down', lines: ['Benvenuto a Scauri! La spiaggia è lunga: comincia sotto il Monte di Scauri e non finisce più.', 'Il parco di Gianola, da questa parte, comincia dove finisce la sabbia.'] }),
  npc('pescatore-scauri', { name: 'Ragazzo con il retino', seed: 110, dir: 'left', lines: ['Tra questi scogli ne ho viste di strane. Non pesci: creature.'] }),
  npc('signora-vindicio', { name: 'Signora di Vindicio', seed: 111, dir: 'down', lines: ['D\'inverno a Vindicio ci siamo solo noi e i gabbiani.', 'È il periodo che preferisco.'] }),
  npc('tennista', { name: 'Tennista', seed: 26, dir: 'down', lines: ['Forchetta? È dentro, nel campo coperto. Fuori non gioca mai.'] }),
  npc('cestista', { name: 'Cestista', seed: 62, dir: 'down', lines: ['Stasera al Palamendola c\'è la partita. Vieni?'] }),
  npc('bagnino-oriente', { name: 'Bagnino del Lido Oriente', seed: 61, dir: 'down', activity: 'canoa', lines: ['Benvenuto al Lido Oriente! Siamo a Formia, sul lungomare Città di Ferrara: Gianola è a due passi.', 'Ti va un giro in canoa? Fino alla boa e ritorno: vediamo quanto ci metti.'] }),
  npc('bagnino', { reacts: [{ after: 'pietra-mare', say: ['L\'acqua è più calma da qualche giorno. Io non faccio domande.'] }], name: 'Bagnino', seed: 43, dir: 'down', hint: true, lines: ['Bandiera verde: si può fare il bagno.', 'Vindicio è Bandiera Blu. E con la termica del pomeriggio è il posto del windsurf e del kite.'] }),
  npc('bambino', { trainer: 'bambino', name: 'Bambino', seed: 42, dir: 'left', lines: ['Ho perso il secchiello.', 'Pure tu perdi sempre le cose?'] }),
  npc('guardaparco', { reacts: [{ after: 'sc-tullio1-sfotto', keep: true, say: ['{rv} è passat{rv-a} di qui con la faccia lunga. Che è successo tra voi?'] }, { after: 'sc-tullio1-amico', keep: true, say: ['{rv} è passat{rv-a} di qui tutt{rv-a} content{rv-a}. Non lo ammetterà mai, ma ne è stat{rv-a} felice.'] }, { after: 'sc-tullio2-sfotto', keep: true, say: ['{rv} non passa più di qui. Gira da sol{rv-a}, dalle parti delle rovine della villa. Con chi si sarà messo?'] }, { after: 'sc-tullio2-amico', keep: true, say: ['{rv} si allena con te? Non me l\'ha detto. Ma così non l\'avevo mai vist{rv-a}.'] }], name: 'Guardaparco', look: 'guardaparco', dir: 'right', starter: true, lines: ['La villa era di Mamurra, un cavaliere di Formia: il prefetto del genio di Giulio Cesare.', 'Il porticciolo romano, qui sotto, forse era una peschiera. Oggi è area marina protetta: niente pesca e niente motori.', 'I vecchi dicono che al tramonto, tra le rovine, cammini qualcuno con due facce. Io non l\'ho mai visto.'] }),
  /* the net maker, by the guardaparco: every kind of net there is */
  npc('retaio', { name: 'Retaio', seed: 46, dir: 'down', shop: 'reti', lines: ['Reti e retini li faccio io, a mano, come si faceva a Mola.', 'Una creatura stanca si prende meglio: prima la fai lottare, poi le lanci il retino. Più il retino è buono, meno scappa.', 'La nassa è per le creature di mare. La rete della lampara è quella della pesca di notte: col buio vale il triplo.'] }),
  /* people of the sea: on a paddle board, diving on the shoals, in a gozzo with the nets */
  npc('mare-sup', { trainer: 'sup', name: 'La ragazza col SUP', seed: 91, dir: 'left', float: 'sup', lines: ['Al largo di Vindicio la mattina è tutto piatto: è il momento migliore.'] }),
  npc('mare-sub', { trainer: 'sub', name: 'Il sub delle secche', seed: 92, dir: 'down', float: 'swim', lines: ['Sotto ci sono le secche: è il posto più bello del golfo.'] }),
  npc('mare-gozzo', { trainer: 'pescatoreLargo', name: 'Il pescatore del gozzo', seed: 93, dir: 'left', float: 'boat', lines: ['Il golfo lo conosco come le mie tasche.'] }),
  npc('pescatore', { name: 'Pescatore', seed: 31, dir: 'down', shop: 'pesca', lines: ['Mola è il borgo dei pescatori: la torre, il porto, le barche.', 'Il 24 giugno è San Giovanni: a Mola si fa festa fino a tardi.', 'Ti serve un retino? Con quello si prendono pure le creature.'] }),
  /* who walks the three trails of the relief (VISIONE.md, V3): each with creatures of the place (data/trainers.ts) */
  npc('tr-bagnante', { trainer: 'bagnante', name: 'Bagnante', seed: 77, dir: 'left', lines: ['Tra gli scogli di Gianola, con la bassa marea, si trova di tutto.'] }),
  npc('nonna-penitro', { name: 'Signora sul muretto', seed: 78, dir: 'down', lines: ['Da ragazza scendevo a Formia a piedi, per la mulattiera.', 'Adesso mi fermo al primo muretto e guardo il mare da lì.'] }),
  npc('ragazzo-salti', { name: 'Ragazzo con lo zaino', seed: 79, dir: 'up', lines: ['Dai gradoni si scende saltando, dove il bordo si abbassa e ci sono le freccette.', 'A risalire no: tocca fare il giro dalle scale.'] }),
  npc('corridore', { name: 'Corridore', seed: 80, dir: 'left', hint: true, lines: ['Faccio il giro sopra la stazione tutte le sere, prima di cena.'] }),
  npc('giardiniere', { name: 'Giardiniere', seed: 81, dir: 'left', lines: ['Tengo in ordine i giardini delle villette, fino al parco.', 'Dopo la casa della guardaparco il sentiero va sulla punta: da lì si vede tutto il golfo.'] }),
  npc('pendolare', { name: 'Pendolare', seed: 82, dir: 'left', lines: ['Scauri è a una fermata di treno da Formia.', 'A piedi, invece, ci vuole pazienza.'] }),
  npc('tr-archeologa', { trainer: 'archeologa', name: 'Archeologa', seed: 71, dir: 'left', lines: ['La villa di Mamurra scendeva al mare su tre terrazze. Io le misuro una per una.'] }),
  npc('tr-polparo', { trainer: 'polparo', name: 'Pescatore di polpi', seed: 72, dir: 'left', lines: ['Dalla punta si vede il fondo. E chi ci vive.'] }),
  npc('tr-ciclista', { trainer: 'ciclista', name: 'Ciclista', seed: 73, dir: 'down', lines: ['L\'Appia verso Itri è tutta in salita. Per questo mi piace.'] }),
  npc('tr-contadino', { trainer: 'contadino', name: 'Contadino', seed: 74, dir: 'left', lines: ['Sono olive itrane. Mature e messe in salamoia, diventano le olive di Gaeta.'] }),
  npc('tr-pastore', { trainer: 'pastore', name: 'Pastore', seed: 75, dir: 'right', lines: ['Le macere tengono su la terra degli uliveti: muretti a secco, pietra su pietra.'] }),
  npc('tr-escursionista', { trainer: 'escursionista', name: 'Escursionista', seed: 76, dir: 'down', lines: ['La cima più alta degli Aurunci è il Petrella. Ma la più bella è quella del Redentore.'] }),
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
  /* the rival (story/rival.ts, story/rival-who.ts: one of the friends, or Tullio, the guardaparco's grandson, in a story
     that met him): at the park as soon as both have a creature, on the Appia on the way to Cicero's tomb, and at the
     park again once Mamurra is beaten. Who it is, and how it looks, comes in story/maps.ts */
  npc('tullio', { trainer: 'rivale-1', look: 'tullio', name: 'Tullio', dir: 'right',
    lines: ['La nonna dice che le creature nascono dalla magia dei giganti. Io dico che nascono per lottare!'] }),
  npc('tullio-appia', { trainer: 'rivale-2', look: 'tullio', name: 'Tullio', dir: 'right',
    lines: ['Da quassù si vede tutto il golfo, fino a Gaeta. Vengo ad allenarmi qui, vicino alla tomba di Cicerone.'] }),
  { ...npc('tullio', { trainer: 'rivale-3', look: 'tullio', name: 'Tullio', dir: 'right',
    lines: ['La nonna mi ha raccontato tutto: le pietre, il sigillo, Mamurra.'] }), id: 'tullio-campione' }
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
  near('Lido Oriente', 'oriente', 5, 'Lo stabilimento del lungomare Città di Ferrara, a Formia, verso Gianola: canoe, pedalò, beach volley e beach soccer.'),
  near('Eclipse beach', 'eclipse-spiaggia', 2, 'Il lido di via Tito Scipione: ombrelloni, beach volley e il windsurf di Nicola Spadea.'),
  near('Pineta di Vindicio', 'pineta', 1, 'Pini domestici e ombra accanto al Lido Frungillo, a due passi dalla spiaggia.'),
  clip('Via Abate Tosti', 132, 65, 140, 65, 'Il vicolo di Mola tra due file di palazzi, da via Tullia alla torre: la sera, la movida.'),
  clip('Via Tullia', 132, 59, 132, 64, 'Corta, tra via Emanuele Filiberto e via Abate Tosti: sull\'angolo l\'enoteca Telaro.'),
  near('Torre di Mola', 'ancora-piazzetta', 0, 'La torre del castello angioino e la piazzetta con l\'ancora, sul porticciolo di Mola.'),
  near('Torre di Mola', 'castello-mura', 1, 'Il castello di Mola sul porticciolo: la torre, le mura, il portale.'),
  near('Pinetina di via Abate Tosti', 'pinetina', 0, 'Pini e macchine parcheggiate tra via Abate Tosti e il lungomare.'),
  near('Piazza Tommaso Testa', 'piazza-testa', 1, 'Il marciapiede largo davanti al tabacchi, a Zanzibar e alla farmacia, con la Fontana delle Cinque Cannelle.'),
  near('Birreria Morgana', 'morgana', 2, 'Via Abate Tosti 105, nel borgo di Mola: la sera ci si ritrova qui.'),
  near('Piazza della Vittoria', 'piazza', 2, 'Il cuore di Formia, con il monumento ai caduti del 1926.'),
  near('Stazione', 'stazione', 3, 'Formia-Gaeta, sulla linea Roma–Napoli.'),
  near('Tomba di Cicerone', 'tomba', 3, 'Sull\'Appia verso Itri: la tradizione dice che qui riposa Cicerone.'),
  near('Parco Gramsci', 'parco-gramsci', 1),
  near('Gelateria Lavezzi', 'gelati', 1, 'In piazza Marconi dal 1870: quattro generazioni di gelatai.'),
  near('Piazza San Giovanni', 'piazza-sangiovanni', 1, 'Il cuore di Mola: la chiesa dei Santi Lorenzo e Giovanni Battista e, di fronte, la scuola Vitruvio Pollione.'),
  near('Villaggio Don Bosco', 'sagrato', 5, 'La parrocchia del Cuore Immacolato di Maria, l\'oratorio e il campo: dall\'altra parte dell\'Appia, quasi di fronte a casa.'),
  near('Largo Paone', 'largo-paone', 1, 'Il parcheggio enorme tra piazza Tommaso Testa e il porto: il sabato c\'è il mercato.'),
  near('Piazza Risorgimento', 'risorgimento', 1, 'In cima a Mola: da qui via Ferrucci sale all\'ospedale e ai monti.'),
  near('Ospedale Dono Svizzero', 'ospedale', 1, 'L\'ospedale di Formia, su via Adalgiso Ferrucci.'),
  near('Piazza Mattej', 'mattej', 1, 'Ai piedi di Castellone: qui era il Foro della città romana.'),
  near('Maranola', 'torre-maranola', 6, 'Il borgo sopra Formia, con la torre dei Caetani: a Natale ci si fa il presepe vivente.'),
  /* the trails of the relief */
  clip('Strada della Statua', 95, 0, 129, 13, 'La mulattiera che da Maranola sale all\'eremo di San Michele e alla Cima del Redentore, tra gli uliveti a terrazze.'),
  clip('Acervara', 0, 71, 20, 83, 'Il pendio sopra l\'Appia: la Tomba di Tulliola, gli ulivi, il golfo davanti.'),
  clip('Punta di Gianola', 266, 98, 284, 127, 'Le terrazze della villa di Mamurra, nel parco di Gianola.'),
  /* the neighbourhoods */
  clip('Porto', 112, 70, 140, 96, 'Il porto di Formia: traghetti e aliscafi per Ponza e Ventotene, le barche dei pescatori, il faro sul molo.'),
  clip('Castellone', 84, 61, 97, 76, 'Il borgo alto, nato contro i Saraceni sull\'acropoli romana: la torre ottagonale dei Caetani, Sant\'Erasmo, il teatro romano con le case dentro.'),
  clip('Mola', 126, 44, 152, 70, 'Il borgo marinaro: la torre del castello angioino, la chiesa di San Giovanni Battista, le barche dei pescatori.'),
  clip('Centro', 84, 61, 131, 92, 'Via Vitruvio, i negozi, il Comune con il Museo archeologico nazionale.'),
  clip('Caposele', 62, 90, 92, 104, 'Il porticciolo di Caposele, dove comincia la spiaggia di Vindicio.'),
  clip('Vindicio', 20, 84, 68, 127, 'Più di un chilometro di spiaggia, dal porto fino a Gaeta: i lidi, il lungomare, la Bandiera Blu.'),
  clip('Sopra la stazione', 84, 44, 122, 59, 'Le case sopra la ferrovia, sulla collina di Santa Maria la Noce.'),
  clip('San Giulio', 153, 30, 169, 45, 'Via Palazzo e via San Giulio: la scuola Mattej, il parchetto con le altalene, le palazzine.'),
  clip('Via Rotabile', 142, 13, 172, 35, 'La strada dei tornanti: da via Ferrucci sale a Maranola.'),
  clip('Monti Aurunci', 0, 0, 319, 29, 'Le montagne dietro Formia. Lassù c\'è Maranola, il borgo del presepe vivente.'),
  clip('Rio Fresco', 120, 30, 176, 46, 'Tra Mola e lo Zauli, sopra l\'Appia: le case lungo via Palazzo.'),
  clip('Bruno Zauli', 176, 31, 197, 46, 'Il centro di preparazione olimpica, nato nel 1955: la pista dove correva Mennea.'),
  clip('Via Amendola', 197, 31, 244, 46, 'Le palazzine di via Amendola, il Palamendola, Parco la Fontana.'),
  clip('Acqualonga', 158, 46, 236, 62, 'Lungo l\'Appia verso Napoli, tra la strada e il mare.'),
  clip('Scauri', 286, 30, 319, 127, 'Scauri, frazione di Minturno, subito dopo il Monte di Scauri: la stazione di Minturno-Scauri, sulla linea per Napoli.'),
  clip('Gianola', 244, 62, 286, 127, 'Il parco regionale, dal 1987: la villa di Mamurra, il porticciolo romano, la spiaggia dei Sassolini.'),
  clip('Santo Janni', 236, 30, 286, 62, 'Le ultime case di Formia, verso Gianola e Scauri.'),
  clip('Campagna', 0, 30, 84, 96, 'Gli uliveti a ovest della città, verso Itri: qui la ferrovia entra in galleria.')
];

/* the gates of Parco la Fontana: locked ('+' on the ground, tools/formia/network.ts) */
FORMIA_ROWS.forEach((r, y) => [...r].forEach((ch, x) => {
  if (ch === '+') signs.push({ x, y, quiet: true, text: ['Il cancello di Parco la Fontana è chiuso.', 'Si apre con le chiavi dei condòmini. Antonio entra da casa sua, dalla porta sul retro.'] });
}));
/* Antonio's back door, on the walk of the park: into his flat (casa.ts has the way back) */
const back = spot('porta-parco');
const warps = [{ x: back[0], y: back[1], to: 'casa', tx: 10, ty: 4, tdir: 'left' as Dir }];

/* the bottles adrift in the gulf, each with a message: picked up swimming over them (story-screen.ts, treasure) */
export interface Bottle { id: string; x: number; y: number; text: string[]; prize: number }
export const BOTTLES: Bottle[] = [
  { id: 'bottiglia-1', prize: 30, text: ['Dentro la bottiglia c\'è un biglietto, scritto a matita:', '«Estate del \'99. Oggi sono andato al largo col windsurf per la prima volta. Da qui Formia sembra un presepe. — N.»'] },
  { id: 'bottiglia-2', prize: 30, text: ['Un biglietto arrotolato, la carta è gialla di sale:', '«Chi trova questa bottiglia porti i saluti al Bar del Porto. Il caffè lo pago io la prossima volta. — un pescatore di Mola»'] },
  { id: 'bottiglia-3', prize: 40, text: ['Una bottiglia verde, chiusa con la cera:', '«Le Pietre di Telepilo dormono dove Formia è più antica: tra le mura, sotto il mare, dentro una voce.»', 'Chissà chi l\'ha scritta.'] },
  { id: 'bottiglia-4', prize: 40, text: ['Dentro c\'è una cartolina di Gianola, di tanti anni fa:', '«Dalla villa di Mamurra si vede tutto il golfo. Ma Mamurra guardava solo il suo oro.»'] },
  { id: 'bottiglia-5', prize: 50, text: ['Un biglietto scritto in fretta:', '«Se leggi qui, sei arrivato lontano. Il Delfaro più grosso del golfo dorme sotto la boa gialla, ma solo quando si fa sera.»'] },
  { id: 'bottiglia-6', prize: 60, text: ['L\'ultima bottiglia del golfo. Dentro, un disegno: la Torre di Mola, il porto, il Cisternone, Gianola, uniti da una linea.', 'Sotto, una frase: «Formia si vede intera solo dal mare.»', 'Hai trovato tutte le bottiglie del golfo!'] }
].map(function (b) { const [x, y] = spot(b.id); return { ...b, x, y }; });

const st = spot('start');
export const formia: MapDef = {
  name: 'Formia',
  rows: FORMIA_ROWS,
  buildings, objects, groundObjects, signs, npcs, items, areas, warps,
  /* the lights strung across via Abate Tosti, between Telaro and the bar on one side, Morgana and the pescheria on the other */
  festoons: [{ x0: 134, x1: 139, y: 65 }],
  start: [st[0], st[1], 'down'],
  starts: (['valentin', 'costanzo', 'forchetta', 'andrea', 'zendavid', 'claudia'] as const).reduce(function (o, id) { const p = spot('start-' + id); o[id] = [p[0], p[1], 'down']; return o; }, {} as Record<string, [number, number, Dir]>)
};
