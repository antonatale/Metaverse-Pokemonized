import type { Character, Move, Stats } from './characters';
import type { TypeName } from './types';
import { ABILITIES } from './passives';

/* The creatures of Formia: animals and plants of the town with a magic of their own, this game's own. The legend they
   come from is the town's: Formia was said to be the city of the giant Laestrygonians of the Odyssey and of their
   king Lamus, where Ulysses' ships landed (Cicero called it "the Telepylos of the Laestrygonians"); when the giants
   left, their magic stayed in the stones, the sea and the olive trees, and the creatures were born of it. The octopus
   of the gulf, the green lizard of the giants' walls, the gull of the winds, the cicadas of the pineta, the olives of
   the groves, the urchins and crabs of the rocks, the little owl of the Aurunci: each carries the magic of its type.
   Antonio picks one of three to start with (from the guardaparco of Gianola), catches the others with a net, and they
   grow with him: a level each so many battles, new moves at some levels, and a new form at others. Every new form is
   a new creature, not the old one bigger, with a move of its own; the last forms take a second type, as in the
   Pokémon games, and their moves can be of either. */

export type SpeciesId =
  | 'polpino' | 'polpetto' | 'polpastro'
  | 'ramarrino' | 'ramarrone' | 'muraglione'
  | 'gabbi' | 'gabbianotto' | 'gabbiammiraglio'
  | 'cicalina' | 'cicalona' | 'olivella' | 'olivastro' | 'riccetto' | 'riccione'
  | 'granchietto' | 'granchione' | 'civettina' | 'civettona'
  | 'medusella' | 'medusaurora' | 'stellina' | 'astromarina' | 'murenaccia' | 'delfi' | 'delfaro' | 'cefalino' | 'cefaldrago'
  | 'lucciolina' | 'lanternella' | 'pipistrillo' | 'pipistrega' | 'cinghialetto' | 'zannaferro' | 'falchetto' | 'pellegrino'
  | 'ginestrella' | 'ginestrona' | 'lumacotta' | 'torrelumaca' | 'micetto' | 'gattomola'
  | 'lamo' | 'giano' | 'fuocelmo';

/** how a creature is drawn (render/svg/creatures.ts): its body, its colours, and what grows on it with each form */
export type Body = 'octo' | 'lizard' | 'bird' | 'cicada' | 'olive' | 'urchin' | 'crab' | 'owl' | 'giant'
  | 'jelly' | 'star' | 'eel' | 'dolphin' | 'fish' | 'firefly' | 'bat' | 'boar' | 'falcon' | 'flower' | 'snail' | 'cat' | 'janus' | 'flame';
export interface CreatureArt { body: Body; main: string; dark: string; belly: string; accent: string; size: number }

export interface Species {
  id: SpeciesId;
  name: string;
  /** how the wild one is announced */
  wild: string;
  type: TypeName;
  /** the second type of a last form */
  type2?: TypeName;
  stage: 1 | 2 | 3;
  /** at level 5, like the friends' (data/growth.ts makes them grow) */
  stats: Stats;
  /** the moves it learns, by level: it fights with the last four it has learned */
  learn: [number, string][];
  /** the next form, from a level; the last forms of the first creatures also need Antonio's bond (0–100) */
  evolve?: { at: number; into: SpeciesId; bond?: number };
  /** its own move, learned as soon as it takes this form */
  sig?: string;
  /** what it says coming on, winning, going down */
  cry: { entry: string; win: string; ko: string };
  /** a page of the creature diary, and where it lives */
  text: string;
  where: string;
  art: CreatureArt;
  /** one of the legends: drawn bigger, with a grand show for its own move */
  legend?: boolean;
  /** the legendary one: harder to catch with a net (1 for everyone else). A legend stands alone against a whole team in
      one battle, with its two heals: it has more than twice the health of what its numbers would say (tools/sim-legend.ts) */
  catchRate?: number;
  /** what it is good at without doing anything (data/passives.ts): one, two for a last form */
  abil?: string[];
}

/* ---------- the moves of the creatures: plain numbers, done by battle/moves.ts (genericMove) ---------- */
const atk = (id: string, name: string, power: number, text: string, o: Partial<Move> = {}): Move => ({ id, name, kind: 'atk', power, text, ...o });
export const CMOVES: Record<string, Move> = {
  botta: atk('botta', 'Scintilla', 55, 'Un colpo con una scintilla di magia, senza tipo: va bene contro tutti.', { plain: true }),
  beccata: atk('beccata', 'Beccata', 45, 'Colpisce per prima. Senza tipo: va bene contro tutti.', { priority: 1, plain: true }),
  spruzzo: atk('spruzzo', 'Inchiostro arcano', 50, 'Danno basso, e l\'Attacco avversario cala per 5 turni.', { fx: { foe: 'atkDown' } }),
  tentacolata: atk('tentacolata', 'Tentacoli di marea', 70, 'Otto braccia e la forza della marea. Danno medio.', { mtype: 'Corrente' }),
  mimetismo: { id: 'mimetismo', name: 'Velo di scogliera', kind: 'buff', text: 'Si avvolge in un velo incantato del colore degli scogli: Difesa +25% per 5 turni.', fx: { self: 'defUp' } },
  abbraccio: atk('abbraccio', 'Abbraccio degli abissi', 90, 'Danno alto, ma va a segno 85 volte su 100, e una volta su tre lo tiene stretto: non può più cambiare.', { acc: 0.85, fx: { status: 'rete', odds: 0.33 } }),
  mareggiata: atk('mareggiata', 'Mareggiata incantata', 100, 'Chiama il mare del golfo: danno altissimo, va a segno 8 volte su 10.', { acc: 0.8, mtype: 'Corrente' }),
  genio: { id: 'genio', name: 'Lampo di genio', kind: 'buff', text: 'Una magia gli attraversa la testa: Attacco +30% per 5 turni.', fx: { self: 'atkUp' } },
  sole: { id: 'sole', name: 'Bagno di sole', kind: 'heal', uses: 2, text: 'Si scalda su un muro di Castellone: recupera il 35% dei PS.', fx: { heal: 0.35 } },
  coda: atk('coda', 'Coda runica', 60, 'Critico più facile (20%).', { crit: 0.2 }),
  scaglie: { id: 'scaglie', name: 'Scaglie di pietra viva', kind: 'buff', text: 'Difesa +25% per 5 turni.', fx: { self: 'defUp' } },
  morso: atk('morso', 'Morso di runa', 75, 'Danno medio-alto.'),
  frana: atk('frana', 'Frana dei giganti', 95, 'La furia dei Lestrigoni: danno alto, va a segno 85 volte su 100.', { acc: 0.85, mtype: 'Corazza' }),
  muraglia: { id: 'muraglia', name: 'Muraglia dei giganti', kind: 'heal', uses: 2, text: 'Alza le mura poligonali dei Lestrigoni: recupera il 25% dei PS e la Difesa sale per 5 turni.', fx: { heal: 0.25, self: 'defUp' } },
  strillo: { id: 'strillo', name: 'Strillo del vento', kind: 'status', text: 'Uno strillo che porta il vento: l\'Attacco avversario cala per 5 turni.', fx: { foe: 'atkDown' } },
  furto: atk('furto', 'Furto di panino', 60, 'Ruba il panino: si riprende metà del danno.', { drain: 0.5 }),
  picchiata: atk('picchiata', 'Picchiata di tempesta', 80, 'Danno alto.', { mtype: 'Cielo' }),
  raffica: atk('raffica', 'Raffica di maestrale', 65, 'Danno medio, e una volta su quattro confonde.', { fx: { conf: 0.25 }, mtype: 'Cielo' }),
  libeccio: atk('libeccio', 'Libeccio', 100, 'Il vento del golfo: danno altissimo, va a segno 8 volte su 10.', { acc: 0.8, mtype: 'Cielo' }),
  frinire: { id: 'frinire', name: 'Frinire incantato', kind: 'status', text: 'Un canto che fa girare la testa: confonde per 2 turni.', fx: { conf: 1 } },
  concerto: atk('concerto', 'Concerto d\'agosto', 75, 'Danno medio-alto.'),
  olio: { id: 'olio', name: 'Olio della vita', kind: 'heal', uses: 2, text: 'L\'olio nuovo, che guarisce: recupera il 30% dei PS.', fx: { heal: 0.3 } },
  nocciolo: atk('nocciolo', 'Sputo di nocciolo', 65, 'Danno medio.'),
  radici: { id: 'radici', name: 'Radici millenarie', kind: 'buff', text: 'Difesa +25% per 5 turni.', fx: { self: 'defUp' } },
  aculei: atk('aculei', 'Aculei di luna', 55, 'Danno basso, e una volta su cinque confonde.', { fx: { conf: 0.2 } }),
  guscio: { id: 'guscio', name: 'Guscio di madreperla', kind: 'buff', text: 'Difesa +25% per 5 turni.', fx: { self: 'defUp' } },
  spinata: atk('spinata', 'Pioggia di spine', 80, 'Spine di luna dal cielo: danno alto.', { mtype: 'Calma' }),
  chela: atk('chela', 'Chela di bronzo', 65, 'Critico più facile (25%).', { crit: 0.25 }),
  pinza: atk('pinza', 'Pinza dei giganti', 85, 'Danno alto, va a segno 85 volte su 100.', { acc: 0.85 }),
  occhiata: { id: 'occhiata', name: 'Occhio del futuro', kind: 'status', text: 'Vede il colpo prima che arrivi, e il punto debole: la Difesa avversaria cala per 4 turni.', fx: { foe: 'defDown' } },
  notturno: atk('notturno', 'Volo notturno', 75, 'Danno medio-alto.'),
  saggezza: { id: 'saggezza', name: 'Saggezza antica', kind: 'buff', text: 'Attacco +30% per 5 turni.', fx: { self: 'atkUp' } },
  /* the moves of the new forms, each its own */
  pennino: atk('pennino', 'Pennino stellato', 80, 'Scrive nell\'aria una stella d\'inchiostro: danno alto, e critico più facile (20%).', { crit: 0.2 }),
  catilinaria: atk('catilinaria', 'Catilinaria', 90, '«Fino a quando abuserai della nostra pazienza?»: l\'orazione più famosa di Cicerone. Danno alto, va a segno 9 volte su 10.', { acc: 0.9, mtype: 'Chiacchiera' }),
  marmo: atk('marmo', 'Marmo lunare', 80, 'Una lastra delle mura che brilla di luna: danno alto, e la Difesa sale per 5 turni.', { fx: { self: 'defUp' } }),
  cuorepietra: atk('cuorepietra', 'Cuore di pietra', 90, 'Le mura difendono chi ama Formia: danno alto, va a segno 9 volte su 10, e si riprende un quarto del danno.', { acc: 0.9, drain: 0.25, mtype: 'Cuore' }),
  burrasca: atk('burrasca', 'Burrasca', 80, 'Una burrasca improvvisa sul golfo: danno alto, e una volta su cinque confonde.', { fx: { conf: 0.2 } }),
  desiderio: atk('desiderio', 'Desiderio del mare', 85, 'Porta al mare i desideri sussurrati sul lungomare: danno alto, e si riprende un quarto del danno.', { drain: 0.25, mtype: 'Cuore' }),
  tempesta: atk('tempesta', 'Tempesta di luna', 90, 'La luna piena alza il mare e i fulmini lo spaccano: danno alto, va a segno 85 volte su 100, e a volte confonde.', { acc: 0.85, mtype: 'Calma', fx: { conf: 0.2 } }),
  canicola: atk('canicola', 'Canicola', 85, 'Il caldo d\'agosto che fa impazzire anche le pietre: danno alto, e una volta su tre dà un colpo di sole.', { mtype: 'Calore', fx: { status: 'sole', odds: 0.33 } }),
  arsura: { id: 'arsura', name: 'Arsura', kind: 'status', uses: 2, acc: 0.85, mtype: 'Calore', text: 'Il frinire porta il caldo di agosto: colpo di sole, va a segno 85 volte su 100.', fx: { status: 'sole' } },
  ninna: { id: 'ninna', name: 'Ninna nanna di Maranola', kind: 'status', uses: 2, acc: 0.7, text: 'Un canto antico dai vicoli di Maranola: siesta, va a segno 7 volte su 10.', fx: { status: 'siesta' } },
  presa: atk('presa', 'Presa di scoglio', 55, 'Stringe e non lascia più: chi la subisce non può cambiare, e rallenta.', { fx: { status: 'rete' } }),
  ombra: atk('ombra', 'Ombra millenaria', 80, 'All\'ombra degli ulivi più antichi: danno alto, e la Difesa sale per 5 turni.', { mtype: 'Calma', fx: { self: 'defUp' } }),
  nostalgia: atk('nostalgia', 'Nostalgia', 80, 'Chi la sfiora rivede Formia com\'era, e resta lì a guardarla: danno alto, e una volta su cinque confonde.', { mtype: 'Cuore', fx: { conf: 0.2 } }),
  morsa: atk('morsa', 'Morsa di marea', 85, 'Chele che stringono come la marea e non lasciano più: danno alto, va a segno 9 volte su 10.', { mtype: 'Corrente', acc: 0.9 }),
  profezia: atk('profezia', 'Profezia', 80, 'Vede il colpo nel futuro e lo dà dove fa male: danno alto, e critico più facile (25%).', { mtype: 'Calma', crit: 0.25 }),
  /* the king of the giants */
  masso: atk('masso', 'Masso dei giganti', 110, 'Scaglia un masso, come contro le navi di Ulisse: va a segno 8 volte su 10.', { acc: 0.8 }),
  furia: atk('furia', 'Furia dei Lestrigoni', 80, 'Danno alto, e una volta su tre confonde.', { fx: { conf: 0.3 }, mtype: 'Caos' }),
  ruggito: { id: 'ruggito', name: 'Ruggito di Lamo', kind: 'status', text: 'Un ruggito che scuote il golfo: l\'Attacco avversario cala per 5 turni.', fx: { foe: 'atkDown' } },
  naufragio: atk('naufragio', 'Massi sulle navi', 150, 'Un turno per sollevare il masso, e il turno dopo lo scaglia, come contro le navi di Ulisse: si vede arrivare, ma fa malissimo.', { twoTurn: true, windup: '{n} solleva il masso sopra la testa: al prossimo turno lo scaglia!', mtype: 'Corazza' }),
  telepilo: { id: 'telepilo', name: 'Porte di Telepilo', kind: 'heal', uses: 2, text: 'Chiude le porte della sua città: recupera il 25% dei PS e la Difesa sale.', fx: { heal: 0.25, self: 'defUp' } },
  /* ---------- the creatures found later: the sea, the night, the hills, the town ---------- */
  urtica: atk('urtica', 'Tocco urticante', 55, 'Brucia appena, come le meduse d\'estate: danno basso, e una volta su quattro confonde.', { fx: { conf: 0.25 } }),
  risacca: atk('risacca', 'Risacca', 70, 'L\'onda che torna indietro e si porta via tutto: danno medio.', { mtype: 'Calma' }),
  aurora: atk('aurora', 'Velo d\'aurora', 85, 'Nel golfo, di notte, si accendono luci come un\'aurora: danno alto, e la Difesa sale per 5 turni.', { mtype: 'Cielo', fx: { self: 'defUp' } }),
  stellata: atk('stellata', 'Raggio stellato', 60, 'Una punta che si accende come una stella: danno medio, critico più facile (20%).', { crit: 0.2 }),
  rigenera: { id: 'rigenera', name: 'Rigenerazione', kind: 'heal', uses: 2, text: 'Le stelle marine rifanno le punte che perdono: recupera il 35% dei PS.', fx: { heal: 0.35 } },
  mappaceleste: atk('mappaceleste', 'Mappa celeste', 85, 'Disegna le costellazioni che guidavano le navi dei Romani: danno alto, critico più facile (20%).', { crit: 0.2, mtype: 'Cuore' }),
  agguato: atk('agguato', 'Agguato dalla tana', 65, 'Esce dalla tana prima che te ne accorgi: attacca per primo.', { priority: 1, mtype: 'Crepuscolo' }),
  tana: { id: 'tana', name: 'Nella tana', kind: 'buff', text: 'Si ritira tra gli scogli e aspetta: Difesa +25% per 5 turni.', fx: { self: 'defUp' } },
  morsomurena: atk('morsomurena', 'Morso di murena', 90, 'Non molla più: danno alto, va a segno 85 volte su 100, critico più facile (20%).', { acc: 0.85, crit: 0.2 }),
  fischio: atk('fischio', 'Fischio del branco', 60, 'Un fischio che solo i delfini capiscono: danno medio.'),
  eco: { id: 'eco', name: 'Eco del golfo', kind: 'status', text: 'Chiama il branco da lontano: l\'Attacco avversario cala per 5 turni.', fx: { foe: 'atkDown' } },
  fascio: atk('fascio', 'Fascio del faro', 90, 'La luce che riporta in porto i pescatori di Mola: danno alto, va a segno 9 volte su 10.', { acc: 0.9, mtype: 'Calma' }),
  saltello: { id: 'saltello', name: 'Saltello', kind: 'status', text: 'Salta fuori dall\'acqua e ricade giù. Non succede niente.' },
  ira: atk('ira', 'Ira del golfo', 105, 'Il mare che si alza contro chi lo prendeva in giro: danno altissimo, va a segno 8 volte su 10.', { acc: 0.8, mtype: 'Caos' }),
  lucina: atk('lucina', 'Lucina', 55, 'Una luce gentile che incanta: danno basso, e l\'Attacco avversario cala per 5 turni.', { fx: { foe: 'atkDown' } }),
  lucciole: atk('lucciole', 'Lucciole di San Giovanni', 85, 'A giugno, nelle notti calde, si accendono tutte insieme: danno alto, e si riprende un quarto del danno.', { mtype: 'Calore', drain: 0.25 }),
  ultrasuoni: { id: 'ultrasuoni', name: 'Ultrasuoni', kind: 'status', text: 'Un grido che non si sente ma fa girare la testa: confonde per 2 turni.', fx: { conf: 1 } },
  ala: atk('ala', 'Ala di velluto', 65, 'Un colpo d\'ala nel buio: danno medio.'),
  malocchio: atk('malocchio', 'Malocchio', 85, 'Le janare, si racconta, facevano il malocchio dalle grotte: danno alto, e una volta su cinque confonde.', { mtype: 'Cervello', fx: { conf: 0.2 } }),
  carica: atk('carica', 'Carica nel bosco', 70, 'Giù per il bosco a testa bassa: danno medio.'),
  grufolata: { id: 'grufolata', name: 'Grufolata', kind: 'status', text: 'Rovista nella terra e scopre il punto debole: la Difesa avversaria cala per 4 turni.', fx: { foe: 'defDown' } },
  zanne: atk('zanne', 'Zanne di ferro', 90, 'Zanne lucide come il ferro: danno alto, va a segno 9 volte su 10.', { acc: 0.9, mtype: 'Corazza' }),
  planata: atk('planata', 'Planata', 55, 'Scende dal cielo prima che tu lo veda: attacca per primo.', { priority: 1 }),
  pellegrina: atk('pellegrina', 'Picchiata del pellegrino', 90, 'In picchiata dalle rupi dei monti, più veloce di qualunque cosa voli: danno alto, critico più facile (25%).', { crit: 0.25, mtype: 'Caos' }),
  polline: atk('polline', 'Nuvola di polline', 55, 'Una nuvola gialla che fa starnutire: danno basso, e una volta su quattro confonde.', { fx: { conf: 0.25 }, mtype: 'Cielo' }),
  profumo: { id: 'profumo', name: 'Profumo di ginestra', kind: 'heal', uses: 2, text: 'Il profumo dei monti a maggio: recupera il 30% dei PS.', fx: { heal: 0.3 } },
  maregiallo: atk('maregiallo', 'Mare giallo', 85, 'In primavera i monti si coprono di ginestre, un mare giallo che travolge: danno alto.', { mtype: 'Cuore' }),
  scia: { id: 'scia', name: 'Scia d\'argento', kind: 'status', text: 'Lascia una scia che brilla di luna: la Difesa avversaria cala per 4 turni.', fx: { foe: 'defDown' } },
  torre: atk('torre', 'Torre angioina', 85, 'Si chiude nella torre di Mola e la fa crollare addosso: danno alto, e la Difesa sale per 5 turni.', { mtype: 'Corazza', fx: { self: 'defUp' } }),
  miagolio: { id: 'miagolio', name: 'Miagolio', kind: 'status', text: 'Occhi dolci e un miagolio: l\'Attacco avversario cala per 5 turni.', fx: { foe: 'atkDown' } },
  graffio: atk('graffio', 'Graffio', 60, 'Unghie piccole ma svelte: danno medio, critico più facile (20%).', { crit: 0.2 }),
  banco: atk('banco', 'Furto al banco del pesce', 85, 'Ruba il pesce più bello del banco di Mola: danno alto, e si riprende il 40% del danno.', { drain: 0.4, mtype: 'Caos' }),
  /* the two that are legends of their own */
  duevolti: atk('duevolti', 'Due volti', 100, 'Un volto guarda il passato, l\'altro il futuro: colpisce dove non guardi. Danno altissimo, va a segno 9 volte su 10, critico più facile (25%).', { acc: 0.9, crit: 0.25 }),
  passato: { id: 'passato', name: 'Sguardo al passato', kind: 'status', text: 'Ti fa rivedere tutti i tuoi errori: la Difesa avversaria cala per 4 turni.', fx: { foe: 'defDown' } },
  futuro: { id: 'futuro', name: 'Sguardo al futuro', kind: 'buff', text: 'Vede già come finisce: Attacco +30% per 5 turni.', fx: { self: 'atkUp' } },
  soglia: { id: 'soglia', name: 'Soglia', kind: 'heal', uses: 2, text: 'Chiude la porta tra il giorno e la notte: recupera il 25% dei PS e la Difesa sale.', fx: { heal: 0.25, self: 'defUp' } },
  fuocoelmo: atk('fuocoelmo', 'Fuoco di Sant\'Elmo', 100, 'Il fuoco azzurro che compare sugli alberi delle navi nei temporali: danno altissimo, va a segno 85 volte su 100.', { acc: 0.85 }),
  alberomaestro: atk('alberomaestro', 'Albero maestro', 80, 'Il fulmine scende lungo l\'albero della nave: danno alto, e una volta su quattro confonde.', { mtype: 'Caos', fx: { conf: 0.25 } }),
  scintille: { id: 'scintille', name: 'Scintille azzurre', kind: 'status', text: 'Fiammelle che ballano sulle onde: confonde per 2 turni.', fx: { conf: 1 } },
  bonaccia: { id: 'bonaccia', name: 'Bonaccia', kind: 'heal', uses: 2, text: 'Dopo la tempesta torna la calma: recupera il 30% dei PS.', fx: { heal: 0.3 } },
  /* the grand moves of the legends, each its own */
  portatempo: atk('portatempo', 'Porta del tempo', 120, 'Apre la porta tra il giorno e la notte, e il tempo si ferma per tutti tranne che per lui: danno enorme, va a segno 9 volte su 10.', { acc: 0.9, mtype: 'Crepuscolo' }),
  lunargento: atk('lunargento', 'Luna d\'argento', 90, 'Il volto che guarda a occidente vede la notte prima di tutti: danno alto.', { mtype: 'Calma' }),
  primaluce: atk('primaluce', 'Prima luce', 85, 'Il volto che guarda a oriente vede l\'alba prima di tutti: danno alto, critico più facile (20%).', { crit: 0.2, mtype: 'Calore' }),
  tempestelmo: atk('tempestelmo', 'Tempesta di Sant\'Elmo', 120, 'Il cielo si rompe in fulmini e ogni onda prende fuoco d\'azzurro: danno enorme, va a segno 85 volte su 100, e una volta su cinque confonde.', { acc: 0.85, mtype: 'Calore', fx: { conf: 0.2 } }),
  vele: atk('vele', 'Vele di fuoco', 85, 'Spiega le ali come le vele di una nave e ci passa il vento della tempesta: danno alto.', { mtype: 'Cielo' }),
  passogigante: atk('passogigante', 'Passo del gigante', 90, 'Un passo, e trema tutta Formia, dalle mura al mare: danno alto, e la Difesa sale per 5 turni.', { mtype: 'Corazza', fx: { self: 'defUp' } })
};

/* ---------- the species ---------- */
const S = (o: Species) => o;
export const SPECIES: Record<SpeciesId, Species> = {
  /* the three to start with: from the sea, the old walls and the sky over the port */
  polpino: S({
    id: 'polpino', abil: ['ventose'], name: 'Polpino', wild: 'Un Polpino selvatico', type: 'Cervello', stage: 1,
    stats: { hp: 98, atk: 100, def: 92, spe: 98 },
    learn: [[1, 'botta'], [1, 'spruzzo'], [6, 'tentacolata'], [12, 'mimetismo'], [18, 'abbraccio'], [26, 'mareggiata'], [34, 'genio']],
    evolve: { at: 14, into: 'polpetto' },
    cry: { entry: 'Pol-pì!', win: 'Pol-pì pol-pì!', ko: 'Pooolp…' },
    text: 'Un polpetto magico del golfo. Si dice che sia nato dall\'inchiostro di una lettera di Cicerone caduta in mare: con il suo scrive incantesimi sugli scogli.',
    where: 'Gli scogli del golfo', art: { body: 'octo', main: '#e9765f', dark: '#b8473a', belly: '#ffc2a8', accent: '#fff3e8', size: 0.78 }
  }),
  polpetto: S({
    id: 'polpetto', abil: ['ventose'], name: 'Calamastro', wild: 'Un Calamastro selvatico', type: 'Cervello', type2: 'Corrente', stage: 2, sig: 'pennino',
    stats: { hp: 110, atk: 112, def: 104, spe: 110 },
    learn: [[1, 'botta'], [1, 'spruzzo'], [6, 'tentacolata'], [12, 'mimetismo'], [14, 'pennino'], [18, 'abbraccio'], [26, 'mareggiata'], [34, 'genio']],
    evolve: { at: 26, into: 'polpastro', bond: 60 },
    cry: { entry: 'Calamà! Calamà!', win: 'Firmato: Calamastro.', ko: 'Si è seccato l\'inchiostro…' },
    text: 'Porta in testa il calamaio da cui è nato e con il tentacolo più lungo scrive stelle d\'inchiostro nell\'aria: nelle notti senza luna i pescatori di Mola le seguono per tornare in porto.',
    where: 'Gli scogli del golfo', art: { body: 'octo', main: '#5a6fd6', dark: '#33429a', belly: '#b9c4ff', accent: '#ffd166', size: 0.9 }
  }),
  polpastro: S({
    id: 'polpastro', abil: ['ventose', 'oratoria'], name: 'Ciceropode', wild: 'Un Ciceropode selvatico', type: 'Cervello', type2: 'Chiacchiera', stage: 3, sig: 'catilinaria',
    stats: { hp: 122, atk: 126, def: 114, spe: 120 },
    learn: [[1, 'botta'], [1, 'spruzzo'], [6, 'tentacolata'], [12, 'mimetismo'], [14, 'pennino'], [18, 'abbraccio'], [26, 'mareggiata'], [26, 'catilinaria'], [34, 'genio']],
    cry: { entry: 'Quo usque tandem!', win: 'Ho detto.', ko: 'O tempora, o mores…' },
    text: 'Ha letto tutte le lettere di Cicerone finite in mare, e ora parla come lui: fluttua sopra gli scogli con la toga e il rotolo, e quando arringa il golfo persino le onde stanno zitte.',
    where: 'Gli scogli del golfo', art: { body: 'octo', main: '#8a3fb8', dark: '#55207a', belly: '#e3b8ff', accent: '#ffd166', size: 1 }
  }),
  ramarrino: S({
    id: 'ramarrino', abil: ['coda'], name: 'Ramarrino', wild: 'Un Ramarrino selvatico', type: 'Calma', stage: 1,
    stats: { hp: 100, atk: 94, def: 100, spe: 82 },
    learn: [[1, 'botta'], [1, 'sole'], [6, 'coda'], [12, 'scaglie'], [18, 'morso'], [26, 'frana'], [34, 'muraglia']],
    evolve: { at: 14, into: 'ramarrone' },
    cry: { entry: 'Rrr-ramà!', win: 'Rrr… al chiaro di luna.', ko: 'Ramà…' },
    text: 'Uno spirito verde delle mura di Castellone, con una falce di luna sulla testa. Si racconta che quelle pietre le abbiano messe i giganti Lestrigoni: lui ne custodisce la forza, al sole di giorno e alla luna di notte.',
    where: 'Le mura di Castellone', art: { body: 'lizard', main: '#3fcf8e', dark: '#1f8a5c', belly: '#e9f7b0', accent: '#fff2b3', size: 0.8 }
  }),
  ramarrone: S({
    id: 'ramarrone', abil: ['coda'], name: 'Ramarmo', wild: 'Un Ramarmo selvatico', type: 'Calma', type2: 'Corazza', stage: 2, sig: 'marmo',
    stats: { hp: 112, atk: 106, def: 112, spe: 92 },
    learn: [[1, 'botta'], [1, 'sole'], [6, 'coda'], [12, 'scaglie'], [14, 'marmo'], [18, 'morso'], [26, 'frana'], [34, 'muraglia']],
    evolve: { at: 26, into: 'muraglione', bond: 60 },
    cry: { entry: 'Ramàrmo!', win: 'Duro come le mura.', ko: 'Torno sul mio muro…' },
    text: 'Si è coperto delle pietre poligonali delle mura: lastre lucide come marmo, tenute insieme da crepe che brillano di luna. Ha una coda così pesante che quando passa tremano i vicoli.',
    where: 'Le mura di Castellone', art: { body: 'lizard', main: '#2fae7a', dark: '#18704c', belly: '#d9efa0', accent: '#e9e2cf', size: 0.92 }
  }),
  muraglione: S({
    id: 'muraglione', abil: ['coda', 'mura'], name: 'Dracastello', wild: 'Un Dracastello selvatico', type: 'Calma', type2: 'Cuore', stage: 3, sig: 'cuorepietra',
    stats: { hp: 126, atk: 118, def: 128, spe: 98 },
    learn: [[1, 'botta'], [1, 'sole'], [6, 'coda'], [12, 'scaglie'], [14, 'marmo'], [18, 'morso'], [26, 'frana'], [26, 'cuorepietra'], [34, 'muraglia']],
    cry: { entry: 'DRACASTELLO!', win: 'Duemila anni, e ancora in piedi.', ko: 'Crollo… ma con calma.' },
    text: 'Il drago delle mura dei giganti: sulla schiena ha i merli di Castellone, in testa la torre ottagonale come una corona, e in petto un cuore di pietra che batte per Formia. Da duemila anni nessuno l\'ha mai smosso.',
    where: 'Le mura di Castellone', art: { body: 'lizard', main: '#21966b', dark: '#105c40', belly: '#cfe89a', accent: '#d8cfb8', size: 1 }
  }),
  gabbi: S({
    id: 'gabbi', abil: ['ladro'], name: 'Gabbì', wild: 'Un Gabbì selvatico', type: 'Caos', stage: 1,
    stats: { hp: 94, atk: 104, def: 84, spe: 110 },
    learn: [[1, 'beccata'], [1, 'furto'], [6, 'strillo'], [10, 'picchiata'], [18, 'raffica'], [26, 'libeccio'], [34, 'genio']],
    evolve: { at: 14, into: 'gabbianotto' },
    cry: { entry: 'Gab-bì! Gab-bì!', win: 'Gab-bì-bì-bì!', ko: 'Gab…' },
    text: 'Un pulcino del vento del golfo, con una nuvoletta di temporale in testa e il fazzoletto rosso dei marinai. Sul lungomare ruba i panini, e i desideri che la gente sussurra al mare.',
    where: 'Il porto e il lungomare', art: { body: 'bird', main: '#f6f7f4', dark: '#8d98a8', belly: '#ffffff', accent: '#ffcf3f', size: 0.78 }
  }),
  gabbianotto: S({
    id: 'gabbianotto', abil: ['ladro'], name: 'Burrasco', wild: 'Un Burrasco selvatico', type: 'Caos', type2: 'Cielo', stage: 2, sig: 'burrasca',
    stats: { hp: 104, atk: 116, def: 94, spe: 122 },
    learn: [[1, 'beccata'], [1, 'furto'], [6, 'strillo'], [10, 'picchiata'], [14, 'burrasca'], [18, 'raffica'], [26, 'libeccio'], [34, 'genio']],
    evolve: { at: 26, into: 'gabbiammiraglio', bond: 60 },
    cry: { entry: 'Burrascooo!', win: 'Il panino è mio!', ko: 'Volo via…' },
    text: 'Plana sui traghetti per Ponza e Ventotene in mezzo alla burrasca, con il berretto da marinaio storto: dove passa lui, il mare si increspa e il vento cambia.',
    where: 'Il porto e il lungomare', art: { body: 'bird', main: '#e9edf2', dark: '#5f6f86', belly: '#ffffff', accent: '#ffcf3f', size: 0.92 }
  }),
  gabbiammiraglio: S({
    id: 'gabbiammiraglio', abil: ['ladro', 'poppa'], name: 'Procellario', wild: 'Un Procellario selvatico', type: 'Caos', type2: 'Calma', stage: 3, sig: 'tempesta',
    stats: { hp: 116, atk: 130, def: 104, spe: 134 },
    learn: [[1, 'beccata'], [1, 'furto'], [6, 'strillo'], [10, 'picchiata'], [14, 'burrasca'], [18, 'raffica'], [26, 'libeccio'], [26, 'tempesta'], [28, 'desiderio'], [34, 'genio']],
    cry: { entry: 'Tutti a bordo!', win: 'Il golfo è sotto il mio comando.', ko: 'Abbandonate la nave…' },
    text: 'Il signore delle tempeste del golfo: comanda i venti dal faro del molo, con il cappello d\'ammiraglio e ali grandi come vele, e nelle notti di luna piena alza il mare. Ascolta ancora i desideri sussurrati alle onde, e qualcuno lo esaudisce.',
    where: 'Il porto e il lungomare', art: { body: 'bird', main: '#3c4a66', dark: '#1e2740', belly: '#f2f4f8', accent: '#ffcf3f', size: 1 }
  }),
  /* the wild ones, around town */
  cicalina: S({
    id: 'cicalina', abil: ['frinire'], name: 'Cicalina', wild: 'Una Cicalina selvatica', type: 'Chiacchiera', stage: 1,
    stats: { hp: 88, atk: 94, def: 80, spe: 104 },
    learn: [[1, 'botta'], [1, 'frinire'], [8, 'concerto'], [12, 'arsura'], [14, 'strillo'], [20, 'raffica']],
    evolve: { at: 18, into: 'cicalona' },
    cry: { entry: 'Cri-cri-cri-cri!', win: 'Cri-cri-cri-cri-cri!', ko: 'Cri…' },
    text: 'Canta l\'incantesimo dell\'estate sui pini di Vindicio: si dice che finché canta lei, l\'estate non finisce.',
    where: 'Pineta di Vindicio', art: { body: 'cicada', main: '#8a9a5b', dark: '#55613a', belly: '#c9d39b', accent: '#bfe3ff', size: 0.72 }
  }),
  cicalona: S({
    id: 'cicalona', abil: ['frinire'], name: 'Solleone', wild: 'Un Solleone selvatico', type: 'Chiacchiera', type2: 'Calore', stage: 2, sig: 'canicola',
    stats: { hp: 102, atk: 110, def: 92, spe: 118 },
    learn: [[1, 'botta'], [1, 'frinire'], [8, 'concerto'], [12, 'arsura'], [14, 'strillo'], [18, 'canicola'], [20, 'raffica']],
    cry: { entry: 'CRI-CRI-CRIII!', win: 'Bis! Bis!', ko: 'Fine del concerto…' },
    text: 'Canta solo nei giorni più caldi d\'agosto, con le ali dorate come raggi di sole: il suo canto fa impazzire il caldo, e chi lo ascolta si dimentica che arriva settembre.',
    where: 'Pineta di Vindicio', art: { body: 'cicada', main: '#d9a21b', dark: '#8a5e08', belly: '#ffe08a', accent: '#fff2b0', size: 0.95 }
  }),
  olivella: S({
    id: 'olivella', abil: ['radici'], name: 'Olivella', wild: 'Un\'Olivella selvatica', type: 'Cuore', stage: 1,
    stats: { hp: 85, atk: 92, def: 88, spe: 76 },
    learn: [[1, 'botta'], [1, 'olio'], [8, 'nocciolo'], [14, 'radici'], [20, 'spinata']],
    evolve: { at: 18, into: 'olivastro' },
    cry: { entry: 'Oli-oli!', win: 'Oli-oliva!', ko: 'Oli…' },
    text: 'Un\'oliva incantata degli uliveti tra Formia e Itri: dove cade, in una notte nasce un ulivo.',
    where: 'Gli uliveti di campagna', art: { body: 'olive', main: '#6b3f6e', dark: '#3f2141', belly: '#9b6aa0', accent: '#7fb069', size: 0.72 }
  }),
  olivastro: S({
    id: 'olivastro', abil: ['radici'], name: 'Olivastro', wild: 'Un Olivastro selvatico', type: 'Cuore', type2: 'Calma', stage: 2, sig: 'ombra',
    stats: { hp: 100, atk: 106, def: 102, spe: 86 },
    learn: [[1, 'botta'], [1, 'olio'], [8, 'nocciolo'], [14, 'radici'], [18, 'ombra'], [20, 'spinata']],
    cry: { entry: 'Olivastro è qui.', win: 'Mille anni di radici.', ko: 'Torno nell\'uliveto…' },
    text: 'Lo spirito degli ulivi più antichi, con radici che arrivano fino ai Romani. Le olive che porta in testa le regala a chi è gentile, e alla sua ombra si riposa chiunque.',
    where: 'Gli uliveti di campagna', art: { body: 'olive', main: '#8a6a45', dark: '#4f3a24', belly: '#b8946a', accent: '#6fa35a', size: 0.95 }
  }),
  riccetto: S({
    id: 'riccetto', abil: ['aculei'], name: 'Riccetto', wild: 'Un Riccetto selvatico', type: 'Corrente', stage: 1,
    stats: { hp: 92, atk: 90, def: 98, spe: 70 },
    learn: [[1, 'botta'], [1, 'aculei'], [8, 'guscio'], [14, 'spinata'], [20, 'frana']],
    evolve: { at: 18, into: 'riccione' },
    cry: { entry: 'Ric-ric!', win: 'Ric-ric-ric!', ko: 'Ric…' },
    text: 'Nasce dove la luna tocca il mare di Gianola, vicino al porticciolo romano: di notte i suoi aculei brillano.',
    where: 'Parco di Gianola', art: { body: 'urchin', main: '#5b3b7a', dark: '#2e1d42', belly: '#8f6ab3', accent: '#ffd166', size: 0.7 }
  }),
  riccione: S({
    id: 'riccione', abil: ['aculei'], name: 'Lunaspina', wild: 'Una Lunaspina selvatica', type: 'Corrente', type2: 'Calma', stage: 2, sig: 'nostalgia',
    stats: { hp: 106, atk: 104, def: 114, spe: 80 },
    learn: [[1, 'botta'], [1, 'aculei'], [8, 'guscio'], [14, 'spinata'], [18, 'nostalgia'], [20, 'frana']],
    cry: { entry: 'Lunaspina! Non toccare.', win: 'Te l\'avevo detto.', ko: 'Mi ritiro tra gli scogli…' },
    text: 'I suoi aculei sono fatti di luna: chi la sfiora rivede per un attimo Formia com\'era, la villa di Mamurra intera e le navi nel porticciolo romano.',
    where: 'Parco di Gianola', art: { body: 'urchin', main: '#2f3f8f', dark: '#17205a', belly: '#8f9ee8', accent: '#fff2b3', size: 0.92 }
  }),
  granchietto: S({
    id: 'granchietto', abil: ['corazza'], name: 'Granchietto', wild: 'Un Granchietto selvatico', type: 'Caos', stage: 1,
    stats: { hp: 90, atk: 98, def: 92, spe: 76 },
    learn: [[1, 'botta'], [4, 'chela'], [8, 'guscio'], [12, 'presa'], [14, 'pinza'], [20, 'morso']],
    evolve: { at: 18, into: 'granchione' },
    cry: { entry: 'Clic-clac!', win: 'Clic-clac-clic!', ko: 'Clac…' },
    text: 'Corre di lato sugli scogli verso Gaeta e custodisce le grotte dove i marinai di Ulisse persero le loro monete.',
    where: 'Gli scogli della Scogliera', art: { body: 'crab', main: '#e8603c', dark: '#a8381f', belly: '#ffb08a', accent: '#ffffff', size: 0.72 }
  }),
  granchione: S({
    id: 'granchione', abil: ['corazza'], name: 'Tenaglione', wild: 'Un Tenaglione selvatico', type: 'Caos', type2: 'Corazza', stage: 2, sig: 'morsa',
    stats: { hp: 104, atk: 114, def: 106, spe: 86 },
    learn: [[1, 'botta'], [4, 'chela'], [8, 'guscio'], [12, 'presa'], [14, 'pinza'], [18, 'morsa'], [20, 'morso']],
    cry: { entry: 'CLAC!', win: 'Chi tocca la scogliera, trova me.', ko: 'Clac… clac…' },
    text: 'Si dice che le sue chele siano di bronzo antico, forgiate per i giganti di re Lamo: stringono come la marea, e non lasciano più.',
    where: 'Gli scogli della Scogliera', art: { body: 'crab', main: '#b8642a', dark: '#6e3410', belly: '#f2b07a', accent: '#ffd166', size: 0.95 }
  }),
  civettina: S({
    id: 'civettina', abil: ['occhi'], name: 'Civettina', wild: 'Una Civettina selvatica', type: 'Cervello', stage: 1,
    stats: { hp: 90, atk: 96, def: 84, spe: 100 },
    learn: [[1, 'botta'], [1, 'occhiata'], [8, 'notturno'], [12, 'ninna'], [14, 'saggezza'], [20, 'picchiata']],
    evolve: { at: 18, into: 'civettona' },
    cry: { entry: 'Chiù! Chiù!', win: 'Chiù-chiù!', ko: 'Chiù…' },
    text: 'La piccola indovina dei Monti Aurunci: di notte, sopra Maranola, legge il futuro nelle luci della città.',
    where: 'Monti Aurunci', art: { body: 'owl', main: '#a87a52', dark: '#6b4a2e', belly: '#e8d2b0', accent: '#ffd166', size: 0.72 }
  }),
  civettona: S({
    id: 'civettona', abil: ['occhi'], name: 'Sibilla', wild: 'Una Sibilla selvatica', type: 'Cervello', type2: 'Calma', stage: 2, sig: 'profezia',
    stats: { hp: 104, atk: 112, def: 96, spe: 114 },
    learn: [[1, 'botta'], [1, 'occhiata'], [8, 'notturno'], [12, 'ninna'], [14, 'saggezza'], [18, 'profezia'], [20, 'picchiata']],
    cry: { entry: 'Chiù. So già tutto.', win: 'Come previsto.', ko: 'Torno sui monti…' },
    text: 'Si dice che abbia imparato a leggere il futuro dalla Sibilla di Cuma, giù lungo la costa: di notte, sopra Maranola, vede le cose prima che accadano, e conosce tutti i sentieri degli Aurunci.',
    where: 'Monti Aurunci', art: { body: 'owl', main: '#4a3f7a', dark: '#2a2250', belly: '#d8d0f2', accent: '#ffd166', size: 0.95 }
  }),
  /* ---------- the creatures of the sea: in the shallow water, in the rock pools, now and then out at sea ---------- */
  medusella: S({
    id: 'medusella', abil: ['filamenti'], name: 'Medusella', wild: 'Una Medusella selvatica', type: 'Corrente', stage: 1,
    stats: { hp: 96, atk: 86, def: 90, spe: 80 },
    learn: [[1, 'botta'], [1, 'urtica'], [8, 'risacca'], [14, 'guscio'], [26, 'mareggiata']],
    evolve: { at: 20, into: 'medusaurora' },
    cry: { entry: 'Bluu-bluu!', win: 'Bluu-bluu-bluu!', ko: 'Bluu…' },
    text: 'Arriva con le correnti d\'estate e si lascia portare dalle onde verso Vindicio. Di notte il suo ombrello si accende piano, come una lanterna sott\'acqua.',
    where: 'Il mare di Formia', art: { body: 'jelly', main: '#9fd6f5', dark: '#4f8fc2', belly: '#e6f6ff', accent: '#c3a0ff', size: 0.74 }
  }),
  medusaurora: S({
    id: 'medusaurora', abil: ['filamenti'], name: 'Medusaurora', wild: 'Una Medusaurora selvatica', type: 'Corrente', type2: 'Cielo', stage: 2, sig: 'aurora',
    stats: { hp: 112, atk: 108, def: 104, spe: 100 },
    learn: [[1, 'botta'], [1, 'urtica'], [8, 'risacca'], [14, 'guscio'], [20, 'aurora'], [26, 'mareggiata']],
    cry: { entry: 'Bluuu-uuu…', win: 'Che luce, eh?', ko: 'Si spegne…' },
    text: 'Le sue lunghe frange fanno luce di tutti i colori: nelle notti calme, al largo di Gianola, il mare sembra un cielo del nord. I pescatori dicono che chi la vede ritrova la strada.',
    where: 'Il mare di Formia, di notte', art: { body: 'jelly', main: '#7a8ff0', dark: '#3f4fb0', belly: '#dde4ff', accent: '#7fe0c4', size: 0.95 }
  }),
  stellina: S({
    id: 'stellina', abil: ['punte'], name: 'Stellina', wild: 'Una Stellina selvatica', type: 'Cervello', stage: 1,
    stats: { hp: 88, atk: 90, def: 96, spe: 86 },
    learn: [[1, 'botta'], [1, 'stellata'], [8, 'rigenera'], [14, 'occhiata'], [24, 'genio']],
    evolve: { at: 20, into: 'astromarina' },
    cry: { entry: 'Stì-stì!', win: 'Stì-stì-stì!', ko: 'Stì…' },
    text: 'Una stella marina caduta dal cielo, si racconta, in una notte di stelle cadenti sopra Gianola: per questo ogni notte di agosto guarda in su.',
    where: 'Le pozze di Gianola', art: { body: 'star', main: '#f08a4b', dark: '#b4531f', belly: '#ffd2a8', accent: '#ffe45c', size: 0.72 }
  }),
  astromarina: S({
    id: 'astromarina', abil: ['punte'], name: 'Astromarina', wild: 'Un\'Astromarina selvatica', type: 'Cervello', type2: 'Corrente', stage: 2, sig: 'mappaceleste',
    stats: { hp: 104, atk: 112, def: 108, spe: 102 },
    learn: [[1, 'botta'], [1, 'stellata'], [8, 'rigenera'], [14, 'occhiata'], [20, 'mappaceleste'], [24, 'genio']],
    cry: { entry: 'Seguimi, ti porto io.', win: 'Le stelle non sbagliano.', ko: 'Torno nel cielo…' },
    text: 'Porta sul dorso una mappa del cielo: le cinque punte segnano le stelle che guidavano le navi romane verso il porto di Formiae. Chi la segue non si perde mai in mare.',
    where: 'Le pozze di Gianola', art: { body: 'star', main: '#3f4ca8', dark: '#232a6e', belly: '#c9d0ff', accent: '#ffd84d', size: 0.92 }
  }),
  murenaccia: S({
    id: 'murenaccia', abil: ['tana'], name: 'Murenaccia', wild: 'Una Murenaccia selvatica', type: 'Corrente', type2: 'Crepuscolo', stage: 1,
    stats: { hp: 104, atk: 118, def: 96, spe: 100 },
    learn: [[1, 'botta'], [1, 'agguato'], [10, 'tana'], [16, 'morso'], [22, 'morsomurena']],
    cry: { entry: 'Ssssh-AH!', win: 'Torna quando vuoi. Anzi no.', ko: 'Ssss…' },
    text: 'Vive nelle tane tra gli scogli della Scogliera e non ne esce che per mordere. Si dice che le murene dei Romani, allevate nelle peschiere di Caposele, fossero le sue nonne.',
    where: 'Gli scogli della Scogliera', art: { body: 'eel', main: '#6f7a3a', dark: '#3d4419', belly: '#d8d27a', accent: '#f4efe6', size: 0.92 }
  }),
  delfi: S({
    id: 'delfi', abil: ['salto'], name: 'Delfì', wild: 'Un Delfì selvatico', type: 'Corrente', stage: 1, catchRate: 0.8,
    stats: { hp: 96, atk: 94, def: 88, spe: 102 },
    learn: [[1, 'botta'], [1, 'fischio'], [8, 'eco'], [14, 'risacca'], [28, 'libeccio']],
    evolve: { at: 24, into: 'delfaro' },
    cry: { entry: 'Kiii-kiki!', win: 'Kikiki-kiii!', ko: 'Kiii…' },
    text: 'I delfini del golfo di Gaeta nuotano accanto ai traghetti per Ponza; questo parla con loro a fischi, e di rado si fa avvicinare.',
    where: 'Il mare di Formia', art: { body: 'dolphin', main: '#7aa6c9', dark: '#3f6a8f', belly: '#e9f3fa', accent: '#ffd166', size: 0.74 }
  }),
  delfaro: S({
    id: 'delfaro', abil: ['salto'], name: 'Delfaro', wild: 'Un Delfaro selvatico', type: 'Corrente', type2: 'Chiacchiera', stage: 2, sig: 'fascio', catchRate: 0.8,
    stats: { hp: 114, atk: 110, def: 100, spe: 116 },
    learn: [[1, 'botta'], [1, 'fischio'], [8, 'eco'], [14, 'risacca'], [24, 'fascio'], [28, 'libeccio']],
    cry: { entry: 'KIII! Tutti in porto!', win: 'Rotta giusta.', ko: 'Si spegne la luce…' },
    text: 'Ha in testa la luce del faro del molo e la accende nelle notti di burrasca: le barche di Mola lo seguono fino in porto.',
    where: 'Il mare di Formia', art: { body: 'dolphin', main: '#4f7fb3', dark: '#24486e', belly: '#dceaf6', accent: '#ffe45c', size: 0.95 }
  }),
  cefalino: S({
    id: 'cefalino', abil: ['ira'], name: 'Cefalino', wild: 'Un Cefalino selvatico', type: 'Corrente', stage: 1,
    stats: { hp: 70, atk: 60, def: 80, spe: 80 },
    learn: [[1, 'saltello'], [15, 'botta'], [17, 'risacca']],
    evolve: { at: 20, into: 'cefaldrago' },
    cry: { entry: 'Blop.', win: 'Blop blop!', ko: 'Blop…' },
    text: 'Il cefalo del porto, quello che salta fuori dall\'acqua davanti ai pescatori del molo. Non sa fare niente, e tutti lo prendono in giro. Per ora.',
    where: 'Il mare di Formia', art: { body: 'fish', main: '#a9b4bf', dark: '#5e6b78', belly: '#eef2f5', accent: '#ffd166', size: 0.7 }
  }),
  cefaldrago: S({
    id: 'cefaldrago', abil: ['ira'], name: 'Cefaldrago', wild: 'Un Cefaldrago selvatico', type: 'Corrente', type2: 'Caos', stage: 2, sig: 'ira',
    stats: { hp: 124, atk: 126, def: 104, spe: 100 },
    learn: [[1, 'saltello'], [15, 'botta'], [17, 'risacca'], [20, 'ira'], [24, 'morso'], [30, 'mareggiata']],
    cry: { entry: 'GRRROOOAAAH!', win: 'Chi è che rideva?', ko: 'Grrr… blop.' },
    text: 'Quando un Cefalino non ne può più di essere preso in giro, il golfo si arrabbia con lui: diventa un drago di mare lungo come un peschereccio, e al porto nessuno ride più.',
    where: 'Il mare di Formia', art: { body: 'fish', main: '#3f6f9a', dark: '#1f3c5c', belly: '#bfe0f0', accent: '#ff8a5c', size: 1 }
  }),
  /* ---------- the night: fireflies in the pineta, bats out of the caves ---------- */
  lucciolina: S({
    id: 'lucciolina', abil: ['luce'], name: 'Lucciolina', wild: 'Una Lucciolina selvatica', type: 'Crepuscolo', stage: 1,
    stats: { hp: 84, atk: 88, def: 86, spe: 104 },
    learn: [[1, 'botta'], [1, 'lucina'], [8, 'notturno'], [14, 'genio'], [24, 'morso']],
    evolve: { at: 18, into: 'lanternella' },
    cry: { entry: 'Tin-tin!', win: 'Tin-tin-tiiin!', ko: 'Tin…' },
    text: 'Si accende solo per chi le sta simpatico. A giugno, nella pineta di Vindicio, ce ne sono tante che sembra di camminare tra le stelle.',
    where: 'La pineta e i parchi, di notte', art: { body: 'firefly', main: '#4f5a3a', dark: '#2a301c', belly: '#d9f27a', accent: '#fff6a8', size: 0.7 }
  }),
  lanternella: S({
    id: 'lanternella', abil: ['luce'], name: 'Lanternella', wild: 'Una Lanternella selvatica', type: 'Crepuscolo', type2: 'Calore', stage: 2, sig: 'lucciole',
    stats: { hp: 102, atk: 106, def: 100, spe: 116 },
    learn: [[1, 'botta'], [1, 'lucina'], [8, 'notturno'], [14, 'genio'], [18, 'lucciole'], [24, 'morso']],
    cry: { entry: 'Ti faccio luce io.', win: 'Tutti a casa, è tardi.', ko: 'Si spegne…' },
    text: 'Porta una lanterna di carta come quelle delle feste d\'estate, e accompagna a casa chi si è perso nella pineta di notte.',
    where: 'La pineta di Vindicio, di notte', art: { body: 'firefly', main: '#7a3f5a', dark: '#45203a', belly: '#ffb35c', accent: '#fff2b0', size: 0.92 }
  }),
  pipistrillo: S({
    id: 'pipistrillo', abil: ['buio'], name: 'Pipistrillo', wild: 'Un Pipistrillo selvatico', type: 'Crepuscolo', stage: 1,
    stats: { hp: 86, atk: 94, def: 82, spe: 110 },
    learn: [[1, 'beccata'], [1, 'ultrasuoni'], [8, 'ala'], [14, 'morso'], [24, 'picchiata']],
    evolve: { at: 20, into: 'pipistrega' },
    cry: { entry: 'Iiik-iiik!', win: 'Iiik-iik-iik!', ko: 'Iik…' },
    text: 'Esce dalle grotte quando fa buio e caccia le zanzare sopra le mura di Castellone. Dorme a testa in giù, e sogna a testa in giù.',
    where: 'Le mura e i monti, di notte', art: { body: 'bat', main: '#5a4a6e', dark: '#30263f', belly: '#b9a6cf', accent: '#ffd166', size: 0.72 }
  }),
  pipistrega: S({
    id: 'pipistrega', abil: ['buio'], name: 'Pipistrega', wild: 'Una Pipistrega selvatica', type: 'Crepuscolo', type2: 'Caos', stage: 2, sig: 'malocchio',
    stats: { hp: 100, atk: 114, def: 94, spe: 120 },
    learn: [[1, 'beccata'], [1, 'ultrasuoni'], [8, 'ala'], [14, 'morso'], [20, 'malocchio'], [24, 'picchiata']],
    cry: { entry: 'Iiih-ih-ih-ih!', win: 'Hai visto chi c\'era?', ko: 'Torno nella grotta…' },
    text: 'Si racconta che nelle grotte vivessero le janare, le streghe delle storie dei nonni: lei ne ha preso il cappello e il brutto carattere. Esce solo con la luna.',
    where: 'I Monti Aurunci, di notte', art: { body: 'bat', main: '#3f2f5a', dark: '#1f1733', belly: '#9a86c2', accent: '#7fe0a0', size: 0.95 }
  }),
  /* ---------- the hills: boars in the woods, falcons on the cliffs, the broom in flower ---------- */
  cinghialetto: S({
    id: 'cinghialetto', abil: ['bassa'], name: 'Cinghialetto', wild: 'Un Cinghialetto selvatico', type: 'Caos', stage: 1,
    stats: { hp: 100, atk: 100, def: 90, spe: 78 },
    learn: [[1, 'botta'], [1, 'grufolata'], [8, 'carica'], [14, 'scaglie'], [24, 'frana']],
    evolve: { at: 20, into: 'zannaferro' },
    cry: { entry: 'Grunf-grunf!', win: 'Grunf-grunf-grunf!', ko: 'Grunf…' },
    text: 'Da piccoli i cinghiali hanno le strisce, come questo: gira per i boschi degli Aurunci col naso per terra, e trova sempre qualcosa da mangiare.',
    where: 'I Monti Aurunci', art: { body: 'boar', main: '#9a6a44', dark: '#5c3a20', belly: '#e0bf8f', accent: '#f4efe6', size: 0.72 }
  }),
  zannaferro: S({
    id: 'zannaferro', abil: ['bassa'], name: 'Zannaferro', wild: 'Uno Zannaferro selvatico', type: 'Caos', type2: 'Corazza', stage: 2, sig: 'zanne',
    stats: { hp: 120, atk: 122, def: 108, spe: 76 },
    learn: [[1, 'botta'], [1, 'grufolata'], [8, 'carica'], [14, 'scaglie'], [20, 'zanne'], [24, 'frana']],
    cry: { entry: 'GRUUUNF!', win: 'Il bosco è mio.', ko: 'Grunf… grunf…' },
    text: 'Il capo dei cinghiali dei monti, con le zanne lucide come il ferro e la cresta dritta sulla schiena. Quando passa lui, nel bosco si fa silenzio.',
    where: 'I Monti Aurunci', art: { body: 'boar', main: '#5a4636', dark: '#2e231a', belly: '#a68a6c', accent: '#c9d2e3', size: 0.95 }
  }),
  falchetto: S({
    id: 'falchetto', abil: ['falco'], name: 'Falchetto', wild: 'Un Falchetto selvatico', type: 'Cielo', stage: 1,
    stats: { hp: 84, atk: 100, def: 80, spe: 116 },
    learn: [[1, 'planata'], [1, 'occhiata'], [8, 'ala'], [14, 'saggezza'], [24, 'notturno']],
    evolve: { at: 22, into: 'pellegrino' },
    cry: { entry: 'Kek-kek!', win: 'Kek-kek-kek!', ko: 'Kek…' },
    text: 'Fa il nido sulle rupi dei monti e da lassù vede tutto: il porto, le isole, il topolino nell\'erba. Si fa vedere poco, e sempre di giorno.',
    where: 'I Monti Aurunci, di giorno', art: { body: 'falcon', main: '#6b7a8f', dark: '#3a4558', belly: '#f2ead8', accent: '#ffd166', size: 0.72 }
  }),
  pellegrino: S({
    id: 'pellegrino', abil: ['falco'], name: 'Pellegrino', wild: 'Un Pellegrino selvatico', type: 'Cielo', type2: 'Cervello', stage: 2, sig: 'pellegrina',
    stats: { hp: 98, atk: 116, def: 90, spe: 128 },
    learn: [[1, 'planata'], [1, 'occhiata'], [8, 'ala'], [14, 'saggezza'], [22, 'pellegrina'], [24, 'notturno']],
    cry: { entry: 'KEEE-KEK!', win: 'Troppo lento.', ko: 'Kek… torno sulle rupi.' },
    text: 'Il falco pellegrino è l\'animale più veloce del mondo: in picchiata supera i trecento all\'ora. Questo, dalle rupi degli Aurunci, si butta giù sul golfo come un sasso.',
    where: 'I Monti Aurunci, di giorno', art: { body: 'falcon', main: '#46546e', dark: '#232c3f', belly: '#efe6d2', accent: '#ffd166', size: 0.95 }
  }),
  ginestrella: S({
    id: 'ginestrella', abil: ['maggio'], name: 'Ginestrella', wild: 'Una Ginestrella selvatica', type: 'Calore', stage: 1,
    stats: { hp: 92, atk: 90, def: 90, spe: 86 },
    learn: [[1, 'botta'], [1, 'polline'], [8, 'profumo'], [14, 'concerto'], [24, 'spinata']],
    evolve: { at: 18, into: 'ginestrona' },
    cry: { entry: 'Fiù-fiù!', win: 'Fiù-fiù-fiù!', ko: 'Fiù…' },
    text: 'Un ciuffo di ginestra che chiacchiera con il vento. Cresce dove gli altri fiori non ce la fanno, tra le pietre dei monti, e profuma di miele.',
    where: 'I Monti Aurunci e gli uliveti', art: { body: 'flower', main: '#5f9a3c', dark: '#35602a', belly: '#a8d27a', accent: '#ffd23c', size: 0.72 }
  }),
  ginestrona: S({
    id: 'ginestrona', abil: ['maggio'], name: 'Ginestrona', wild: 'Una Ginestrona selvatica', type: 'Calore', type2: 'Cuore', stage: 2, sig: 'maregiallo',
    stats: { hp: 112, atk: 104, def: 106, spe: 100 },
    learn: [[1, 'botta'], [1, 'polline'], [8, 'profumo'], [14, 'concerto'], [18, 'maregiallo'], [24, 'spinata']],
    cry: { entry: 'Fiùùù! Senti che profumo?', win: 'Fiorisco sempre io.', ko: 'Sfiorisco…' },
    text: 'In primavera copre i fianchi degli Aurunci di giallo, e da Formia sembra che sui monti sia sceso il sole. Chi ci passa in mezzo torna a casa contento, e non sa perché.',
    where: 'I Monti Aurunci', art: { body: 'flower', main: '#4f8a36', dark: '#2c5520', belly: '#96c46a', accent: '#ffc21a', size: 0.95 }
  }),
  /* ---------- the town: snails on the old walls after the rain, the cats of the harbour ---------- */
  lumacotta: S({
    id: 'lumacotta', abil: ['casa'], name: 'Lumacotta', wild: 'Una Lumacotta selvatica', type: 'Calma', stage: 1,
    stats: { hp: 100, atk: 80, def: 112, spe: 60 },
    learn: [[1, 'botta'], [1, 'scia'], [8, 'guscio'], [14, 'risacca'], [24, 'radici']],
    evolve: { at: 20, into: 'torrelumaca' },
    cry: { entry: 'Slurp.', win: 'Slurp-slurp.', ko: 'Slu…' },
    text: 'Dopo la pioggia sale piano piano sui muretti a secco e sugli ulivi. Non ha mai fretta: tanto, la casa se la porta dietro.',
    where: 'Gli uliveti e le mura', art: { body: 'snail', main: '#c9a87a', dark: '#8a6a45', belly: '#f2e2c4', accent: '#e8a0b8', size: 0.72 }
  }),
  torrelumaca: S({
    id: 'torrelumaca', abil: ['casa'], name: 'Torrelumaca', wild: 'Una Torrelumaca selvatica', type: 'Calma', type2: 'Corazza', stage: 2, sig: 'torre',
    stats: { hp: 122, atk: 96, def: 134, spe: 66 },
    learn: [[1, 'botta'], [1, 'scia'], [8, 'guscio'], [14, 'risacca'], [20, 'torre'], [24, 'radici']],
    cry: { entry: 'Sluuurp. Chi bussa?', win: 'Dentro la torre non entra nessuno.', ko: 'Chiudo il portone…' },
    text: 'Al posto del guscio ha una torre tonda di pietra, con i merli e le finestrelle, come la torre angioina di Mola. Dentro, dicono, tiene un archivio di tutto quello che ha visto.',
    where: 'Le mura di Castellone', art: { body: 'snail', main: '#b89470', dark: '#6e5236', belly: '#e8d6b4', accent: '#d9c9a8', size: 0.95 }
  }),
  micetto: S({
    id: 'micetto', abil: ['occhi'], name: 'Micetto', wild: 'Un Micetto selvatico', type: 'Chiacchiera', stage: 1,
    stats: { hp: 88, atk: 96, def: 84, spe: 104 },
    learn: [[1, 'botta'], [1, 'miagolio'], [8, 'graffio'], [14, 'genio'], [24, 'morso']],
    evolve: { at: 18, into: 'gattomola' },
    cry: { entry: 'Miao!', win: 'Miao-miao!', ko: 'Miao…' },
    text: 'Uno dei gatti del borgo: dorme al sole sulle mura e scende al porto quando tornano le barche. Ti guarda come se sapesse qualcosa che tu non sai.',
    where: 'Le mura di Castellone', art: { body: 'cat', main: '#f2a45c', dark: '#b8662a', belly: '#fff0dc', accent: '#7fd08a', size: 0.72 }
  }),
  gattomola: S({
    id: 'gattomola', abil: ['occhi'], name: 'Gattomola', wild: 'Un Gattomola selvatico', type: 'Chiacchiera', type2: 'Crepuscolo', stage: 2, sig: 'banco',
    stats: { hp: 104, atk: 112, def: 96, spe: 116 },
    learn: [[1, 'botta'], [1, 'miagolio'], [8, 'graffio'], [14, 'genio'], [18, 'banco'], [24, 'morso']],
    cry: { entry: 'MIAAAO. Il pesce è mio.', win: 'Ho vinto, e mangio.', ko: 'Miao… me ne vado al sole.' },
    text: 'Il re dei gatti di Mola: cappello da pescatore, baffi lunghi e un pesce sempre in bocca. Tutti i pescatori lo conoscono, e nessuno l\'ha mai visto pagare.',
    where: 'Le mura di Castellone', art: { body: 'cat', main: '#8a6a52', dark: '#4a3424', belly: '#e8d2b8', accent: '#2f5fa8', size: 0.95 }
  }),
  /* the legend itself: Lamus, king of the Laestrygonians, the giant who threw boulders at Ulysses' ships. He
     comes out only at night on the polygonal walls of Castellone (the giants' walls, they say), once Antonio has
     both pins of Formia, and a net holds him only rarely */
  lamo: S({
    id: 'lamo', abil: ['gigante'], name: 'Lamo', wild: 'Lamo, il re dei Lestrigoni,', type: 'Corazza', type2: 'Caos', stage: 3, catchRate: 0.35, legend: true, sig: 'masso',
    stats: { hp: 306, atk: 140, def: 130, spe: 100 },
    learn: [[1, 'naufragio'], [1, 'ruggito'], [1, 'telepilo'], [1, 'furia'], [1, 'passogigante'], [1, 'masso']],
    cry: { entry: 'CHI OSA SVEGLIARE IL RE DI TELEPILO?', win: 'Formia era mia, e lo è ancora.', ko: 'Torno… nella leggenda…' },
    text: 'Il re dei giganti Lestrigoni, quello che scagliava massi contro le navi di Ulisse. Si racconta che le mura poligonali di Castellone le abbia alzate lui, pietra su pietra, che dorma lì sotto e che esca solo di notte, davanti a chi ha salvato Formia, con un masso sopra la testa.',
    where: 'Le mura di Castellone, di notte', art: { body: 'giant', main: '#9a8f7c', dark: '#5e5546', belly: '#c9bfa8', accent: '#e0b44c', size: 1 }
  }),
  /* two more legends, each in its place and at its hour. Janus, who gave his name to Gianola (the octagon of the villa
     was called his temple): the god of doors and of every passing, with two faces, out only at sunset by the ruins,
     once the three stones are found. And the fire of Sant'Elmo, the blue light on the masts in a storm (the name comes
     from Sant'Erasmo, the patron of Formia and of sailors): on the mole by the lighthouse, at night, once Mamurra's
     diver has been beaten */
  giano: S({
    id: 'giano', abil: ['leggenda'], name: 'Giano', wild: 'Giano, il signore delle soglie,', type: 'Crepuscolo', type2: 'Cervello', stage: 3, catchRate: 0.3, legend: true, sig: 'portatempo',
    stats: { hp: 300, atk: 134, def: 134, spe: 114 },
    learn: [[1, 'lunargento'], [1, 'passato'], [1, 'futuro'], [1, 'duevolti'], [1, 'soglia'], [1, 'primaluce'], [1, 'portatempo']],
    cry: { entry: 'IL TEMPO SI FERMA. CHI OSA PASSARE LA SOGLIA?', win: 'Lo sapevo da prima. E lo saprò dopo.', ko: 'Si chiude una porta… se ne apre un\'altra.' },
    text: 'Il dio delle porte e di ogni passaggio, con due teste: una d\'oro che guarda l\'alba e il passato, una d\'argento che guarda la notte e il futuro. Dietro di lui gira la ruota delle ore, e le sue ali sono le porte di un tempio. Si dice che Gianola porti il suo nome, e si racconta che al tramonto, quando il giorno passa alla notte, torni tra le rovine della villa.',
    where: 'Le rovine di Gianola, al tramonto', art: { body: 'janus', main: '#e8c662', dark: '#9a7424', belly: '#fff1c2', accent: '#b9c6e8', size: 1 }
  }),
  fuocelmo: S({
    id: 'fuocelmo', abil: ['leggenda'], name: 'Fuocelmo', wild: 'Fuocelmo, il drago di Sant\'Elmo,', type: 'Calore', type2: 'Caos', stage: 3, catchRate: 0.4, legend: true, sig: 'tempestelmo',
    stats: { hp: 270, atk: 148, def: 112, spe: 138 },
    learn: [[1, 'scintille'], [1, 'bonaccia'], [1, 'alberomaestro'], [1, 'vele'], [1, 'fuocoelmo'], [1, 'tempestelmo']],
    cry: { entry: 'FSSSHHH… KRRRAAAK! IL MARE BRUCIA!', win: 'La tempesta passa. Io resto.', ko: 'Torno sulle onde…' },
    text: 'La fiamma azzurra che i marinai vedono sugli alberi delle navi nei temporali, il fuoco di Sant\'Elmo. Si racconta che sia un drago di fuoco e di fulmini, con le ali come vele, che dorme nelle nuvole sopra il golfo: porta fortuna a chi lo vede e lo lascia andare, e una tempesta a chi lo vuole tenere.',
    where: 'Il molo del faro, di notte', art: { body: 'flame', main: '#5fb6ff', dark: '#2a4fb8', belly: '#e8f6ff', accent: '#ffe45c', size: 1 }
  })
};
/** the three to start with, in the order they are offered */
export const STARTERS: SpeciesId[] = ['polpino', 'ramarrino', 'gabbi'];
export function isSpecies(id: string): id is SpeciesId { return Object.prototype.hasOwnProperty.call(SPECIES, id); }

/** the moves a creature knows at a level: the last four it has learned */
export function knownAt(sp: SpeciesId, lv: number): string[] {
  const got = SPECIES[sp].learn.filter((l) => l[0] <= lv).map((l) => l[1]);
  return got.slice(-4);
}
/** the moves it learns exactly at a level (to tell the player) */
export function learnedAt(sp: SpeciesId, lv: number): string[] { return SPECIES[sp].learn.filter((l) => l[0] === lv).map((l) => l[1]); }

/** a creature as a fighter for the battle engine: every move it can learn (the side says which it knows) */
const asChar: Partial<Record<SpeciesId, Character>> = {};
export function creatureChar(id: SpeciesId): Character {
  const sp = SPECIES[id];
  return asChar[id] || (asChar[id] = {
    id, name: sp.name, full: sp.name, nick: sp.where, type: sp.type, type2: sp.type2, tagline: sp.where, stats: sp.stats,
    passive: sp.abil ? { name: sp.abil.map((a) => ABILITIES[a].name).join(' · '), text: sp.abil.map((a) => ABILITIES[a].text).join(' ') } : { name: 'Creatura di Formia', text: sp.text },
    weakness: null,
    moves: sp.learn.map((l) => CMOVES[l[1]]).filter((m, k, all) => all.indexOf(m) === k),
    lines: sp.cry
  });
}
