import type { Character, Move, Stats } from './characters';
import type { TypeName } from './types';

/* The creatures of Formia: animals and plants of the town with a magic of their own, this game's own. The legend they
   come from is the town's: Formia was said to be the city of the giant Laestrygonians of the Odyssey and of their
   king Lamus, where Ulysses' ships landed (Cicero called it "the Telepylos of the Laestrygonians"); when the giants
   left, their magic stayed in the stones, the sea and the olive trees, and the creatures were born of it. The octopus
   of the gulf, the green lizard of the giants' walls, the gull of the winds, the cicadas of the pineta, the olives of
   the groves, the urchins and crabs of the rocks, the little owl of the Aurunci: each carries the magic of its type.
   Antonio picks one of three to start with (from the guardaparco of Gianola), catches the others with a net, and they
   grow with him: a level each so many battles, new moves at some levels, and a new form at others. */

export type SpeciesId =
  | 'polpino' | 'polpetto' | 'polpastro'
  | 'ramarrino' | 'ramarrone' | 'muraglione'
  | 'gabbi' | 'gabbianotto' | 'gabbiammiraglio'
  | 'cicalina' | 'cicalona' | 'olivella' | 'olivastro' | 'riccetto' | 'riccione'
  | 'granchietto' | 'granchione' | 'civettina' | 'civettona';

/** how a creature is drawn (render/svg/creatures.ts): its body, its colours, and what grows on it with each form */
export type Body = 'octo' | 'lizard' | 'bird' | 'cicada' | 'olive' | 'urchin' | 'crab' | 'owl';
export interface CreatureArt { body: Body; main: string; dark: string; belly: string; accent: string; size: number }

export interface Species {
  id: SpeciesId;
  name: string;
  /** how the wild one is announced */
  wild: string;
  type: TypeName;
  stage: 1 | 2 | 3;
  /** at level 5, like the friends' (data/growth.ts makes them grow) */
  stats: Stats;
  /** the moves it learns, by level: it fights with the last four it has learned */
  learn: [number, string][];
  evolve?: { at: number; into: SpeciesId };
  /** what it says coming on, winning, going down */
  cry: { entry: string; win: string; ko: string };
  /** a page of the creature diary, and where it lives */
  text: string;
  where: string;
  art: CreatureArt;
}

/* ---------- the moves of the creatures: plain numbers, done by battle/moves.ts (genericMove) ---------- */
const atk = (id: string, name: string, power: number, text: string, o: Partial<Move> = {}): Move => ({ id, name, kind: 'atk', power, text, ...o });
export const CMOVES: Record<string, Move> = {
  botta: atk('botta', 'Scintilla', 40, 'Un colpo con una scintilla di magia.'),
  beccata: atk('beccata', 'Beccata', 35, 'Colpisce per prima.', { priority: 1 }),
  spruzzo: atk('spruzzo', 'Inchiostro arcano', 40, 'Danno basso, e l\'Attacco avversario cala per 3 turni.', { fx: { foe: 'atkDown' } }),
  tentacolata: atk('tentacolata', 'Tentacoli di marea', 60, 'Otto braccia e la forza della marea. Danno medio.'),
  mimetismo: { id: 'mimetismo', name: 'Velo di scogliera', kind: 'buff', text: 'Si avvolge in un velo incantato del colore degli scogli: Difesa +25% per 3 turni.', fx: { self: 'defUp' } },
  abbraccio: atk('abbraccio', 'Abbraccio degli abissi', 80, 'Danno alto, ma va a segno 85 volte su 100.', { acc: 0.85 }),
  mareggiata: atk('mareggiata', 'Mareggiata incantata', 95, 'Chiama il mare del golfo: danno altissimo, va a segno 8 volte su 10.', { acc: 0.8 }),
  genio: { id: 'genio', name: 'Lampo di genio', kind: 'buff', text: 'Una magia gli attraversa la testa: Attacco +30% per 3 turni.', fx: { self: 'atkUp' } },
  sole: { id: 'sole', name: 'Bagno di sole', kind: 'heal', text: 'Si scalda su un muro di Castellone: recupera il 35% dei PS.', fx: { heal: 0.35 } },
  coda: atk('coda', 'Coda runica', 50, 'Critico più facile (20%).', { crit: 0.2 }),
  scaglie: { id: 'scaglie', name: 'Scaglie di pietra viva', kind: 'buff', text: 'Difesa +25% per 3 turni.', fx: { self: 'defUp' } },
  morso: atk('morso', 'Morso di runa', 65, 'Danno medio-alto.'),
  frana: atk('frana', 'Frana dei giganti', 85, 'Danno alto, va a segno 85 volte su 100.', { acc: 0.85 }),
  muraglia: { id: 'muraglia', name: 'Muraglia dei giganti', kind: 'heal', text: 'Alza le mura poligonali dei Lestrigoni: recupera il 25% dei PS e la Difesa sale per 3 turni.', fx: { heal: 0.25, self: 'defUp' } },
  strillo: { id: 'strillo', name: 'Strillo del vento', kind: 'status', text: 'Uno strillo che porta il vento: l\'Attacco avversario cala per 3 turni.', fx: { foe: 'atkDown' } },
  furto: atk('furto', 'Furto di panino', 50, 'Ruba il panino: si riprende metà del danno.', { drain: 0.5 }),
  picchiata: atk('picchiata', 'Picchiata di tempesta', 70, 'Danno alto.'),
  raffica: atk('raffica', 'Raffica di maestrale', 55, 'Danno medio, e una volta su quattro confonde.', { fx: { conf: 0.25 } }),
  libeccio: atk('libeccio', 'Libeccio', 95, 'Il vento del golfo: danno altissimo, va a segno 8 volte su 10.', { acc: 0.8 }),
  frinire: { id: 'frinire', name: 'Frinire incantato', kind: 'status', text: 'Un canto che fa girare la testa: confonde per 2 turni.', fx: { conf: 1 } },
  concerto: atk('concerto', 'Concerto d\'agosto', 65, 'Danno medio-alto.'),
  olio: { id: 'olio', name: 'Olio della vita', kind: 'heal', text: 'L\'olio nuovo, che guarisce: recupera il 30% dei PS.', fx: { heal: 0.3 } },
  nocciolo: atk('nocciolo', 'Sputo di nocciolo', 55, 'Danno medio.'),
  radici: { id: 'radici', name: 'Radici millenarie', kind: 'buff', text: 'Difesa +25% per 3 turni.', fx: { self: 'defUp' } },
  aculei: atk('aculei', 'Aculei di luna', 45, 'Danno basso, e una volta su cinque confonde.', { fx: { conf: 0.2 } }),
  guscio: { id: 'guscio', name: 'Guscio di madreperla', kind: 'buff', text: 'Difesa +25% per 3 turni.', fx: { self: 'defUp' } },
  spinata: atk('spinata', 'Pioggia di spine', 70, 'Danno alto.'),
  chela: atk('chela', 'Chela di bronzo', 55, 'Critico più facile (25%).', { crit: 0.25 }),
  pinza: atk('pinza', 'Pinza dei giganti', 75, 'Danno alto, va a segno 85 volte su 100.', { acc: 0.85 }),
  occhiata: { id: 'occhiata', name: 'Occhio del futuro', kind: 'status', text: 'Vede il colpo prima che arrivi, e il punto debole: la Difesa avversaria cala per 2 turni.', fx: { foe: 'defDown' } },
  notturno: atk('notturno', 'Volo notturno', 65, 'Danno medio-alto.'),
  saggezza: { id: 'saggezza', name: 'Saggezza antica', kind: 'buff', text: 'Attacco +30% per 3 turni.', fx: { self: 'atkUp' } }
};

/* ---------- the species ---------- */
const S = (o: Species) => o;
export const SPECIES: Record<SpeciesId, Species> = {
  /* the three to start with: from the sea, the old walls and the sky over the port */
  polpino: S({
    id: 'polpino', name: 'Polpino', wild: 'Un Polpino selvatico', type: 'Cervello', stage: 1,
    stats: { hp: 96, atk: 92, def: 84, spe: 88 },
    learn: [[1, 'botta'], [1, 'spruzzo'], [8, 'tentacolata'], [12, 'mimetismo'], [18, 'abbraccio'], [26, 'mareggiata'], [34, 'genio']],
    evolve: { at: 14, into: 'polpetto' },
    cry: { entry: 'Pol-pì!', win: 'Pol-pì pol-pì!', ko: 'Pooolp…' },
    text: 'Un polpetto magico del golfo. Si dice che sia nato dall\'inchiostro di una lettera di Cicerone caduta in mare: con il suo scrive incantesimi sugli scogli.',
    where: 'Gli scogli del golfo', art: { body: 'octo', main: '#e9765f', dark: '#b8473a', belly: '#ffc2a8', accent: '#fff3e8', size: 0.78 }
  }),
  polpetto: S({
    id: 'polpetto', name: 'Polpetto', wild: 'Un Polpetto selvatico', type: 'Cervello', stage: 2,
    stats: { hp: 108, atk: 106, def: 96, spe: 100 },
    learn: [[1, 'botta'], [1, 'spruzzo'], [8, 'tentacolata'], [12, 'mimetismo'], [18, 'abbraccio'], [26, 'mareggiata'], [34, 'genio']],
    evolve: { at: 30, into: 'polpastro' },
    cry: { entry: 'Polpè! Polpè!', win: 'Otto a zero!', ko: 'Polpè…' },
    text: 'Il suo inchiostro brilla al buio: nelle notti senza luna i pescatori di Mola lo seguono per ritrovare il porto.',
    where: 'Gli scogli del golfo', art: { body: 'octo', main: '#e05b48', dark: '#a8392e', belly: '#ffb59a', accent: '#fff3e8', size: 0.9 }
  }),
  polpastro: S({
    id: 'polpastro', name: 'Polpastro', wild: 'Un Polpastro selvatico', type: 'Cervello', stage: 3,
    stats: { hp: 120, atk: 122, def: 108, spe: 110 },
    learn: [[1, 'botta'], [1, 'spruzzo'], [8, 'tentacolata'], [12, 'mimetismo'], [18, 'abbraccio'], [26, 'mareggiata'], [34, 'genio']],
    cry: { entry: 'Polpastro, re del golfo!', win: 'Il golfo è mio.', ko: 'Torno negli abissi…' },
    text: 'Il re degli scogli del golfo. Le stelle sulle sue braccia sono quelle cadute in mare nelle notti di San Lorenzo.',
    where: 'Gli scogli del golfo', art: { body: 'octo', main: '#c94a6e', dark: '#8e2d4c', belly: '#ffb0c4', accent: '#ffd166', size: 1 }
  }),
  ramarrino: S({
    id: 'ramarrino', name: 'Ramarrino', wild: 'Un Ramarrino selvatico', type: 'Calma', stage: 1,
    stats: { hp: 100, atk: 88, def: 96, spe: 76 },
    learn: [[1, 'botta'], [1, 'sole'], [8, 'coda'], [12, 'scaglie'], [18, 'morso'], [26, 'frana'], [34, 'muraglia']],
    evolve: { at: 14, into: 'ramarrone' },
    cry: { entry: 'Rrr-ramà!', win: 'Rrr… al sole.', ko: 'Ramà…' },
    text: 'Uno spirito verde delle mura di Castellone. Si racconta che quelle pietre le abbiano messe i giganti Lestrigoni: lui ne custodisce la forza, al sole.',
    where: 'Le mura di Castellone', art: { body: 'lizard', main: '#57c968', dark: '#2f8a45', belly: '#e8f5a0', accent: '#5b9be0', size: 0.78 }
  }),
  ramarrone: S({
    id: 'ramarrone', name: 'Ramarrone', wild: 'Un Ramarrone selvatico', type: 'Calma', stage: 2,
    stats: { hp: 114, atk: 100, def: 110, spe: 86 },
    learn: [[1, 'botta'], [1, 'sole'], [8, 'coda'], [12, 'scaglie'], [18, 'morso'], [26, 'frana'], [34, 'muraglia']],
    evolve: { at: 30, into: 'muraglione' },
    cry: { entry: 'Ramarrò!', win: 'Calma e sangue freddo.', ko: 'Torno sul mio muro…' },
    text: 'Ha la gola azzurra dei ramarri adulti. Quando si arrabbia, sulle pietre dell\'acropoli si accendono rune color luna.',
    where: 'Le mura di Castellone', art: { body: 'lizard', main: '#46b85a', dark: '#277a3b', belly: '#dcef8c', accent: '#3f7ccf', size: 0.9 }
  }),
  muraglione: S({
    id: 'muraglione', name: 'Muraglione', wild: 'Un Muraglione selvatico', type: 'Calma', stage: 3,
    stats: { hp: 128, atk: 114, def: 126, spe: 92 },
    learn: [[1, 'botta'], [1, 'sole'], [8, 'coda'], [12, 'scaglie'], [18, 'morso'], [26, 'frana'], [34, 'muraglia']],
    cry: { entry: 'MURAGLIONE!', win: 'Duemila anni e ancora in piedi.', ko: 'Crollo… ma con calma.' },
    text: 'Il custode delle mura dei giganti: ha sulla schiena le loro pietre, che da duemila anni nessuno riesce a smuovere.',
    where: 'Le mura di Castellone', art: { body: 'lizard', main: '#3fa86a', dark: '#22714a', belly: '#d8e9a0', accent: '#c9b98a', size: 1 }
  }),
  gabbi: S({
    id: 'gabbi', name: 'Gabbì', wild: 'Un Gabbì selvatico', type: 'Caos', stage: 1,
    stats: { hp: 86, atk: 96, def: 72, spe: 106 },
    learn: [[1, 'beccata'], [1, 'strillo'], [8, 'furto'], [12, 'picchiata'], [18, 'raffica'], [26, 'libeccio'], [34, 'genio']],
    evolve: { at: 14, into: 'gabbianotto' },
    cry: { entry: 'Gab-bì! Gab-bì!', win: 'Gab-bì-bì-bì!', ko: 'Gab…' },
    text: 'Un pulcino del vento del golfo. Sul lungomare ruba i panini, e i desideri che la gente sussurra al mare.',
    where: 'Il porto e il lungomare', art: { body: 'bird', main: '#f4f4f0', dark: '#9aa3ad', belly: '#ffffff', accent: '#ffcf3f', size: 0.76 }
  }),
  gabbianotto: S({
    id: 'gabbianotto', name: 'Gabbianotto', wild: 'Un Gabbianotto selvatico', type: 'Caos', stage: 2,
    stats: { hp: 98, atk: 110, def: 82, spe: 120 },
    learn: [[1, 'beccata'], [1, 'strillo'], [8, 'furto'], [12, 'picchiata'], [18, 'raffica'], [26, 'libeccio'], [34, 'genio']],
    evolve: { at: 30, into: 'gabbiammiraglio' },
    cry: { entry: 'Gabbianoooo!', win: 'Il panino è mio!', ko: 'Volo via…' },
    text: 'Plana sopra i traghetti per Ponza e Ventotene portando i messaggi dei venti. Ha la macchia rossa sul becco dei gabbiani adulti.',
    where: 'Il porto e il lungomare', art: { body: 'bird', main: '#f6f6f2', dark: '#8a94a0', belly: '#ffffff', accent: '#ffcf3f', size: 0.9 }
  }),
  gabbiammiraglio: S({
    id: 'gabbiammiraglio', name: 'Gabbiammiraglio', wild: 'Un Gabbiammiraglio selvatico', type: 'Caos', stage: 3,
    stats: { hp: 110, atk: 124, def: 94, spe: 132 },
    learn: [[1, 'beccata'], [1, 'strillo'], [8, 'furto'], [12, 'picchiata'], [18, 'raffica'], [26, 'libeccio'], [34, 'genio']],
    cry: { entry: 'Tutti a bordo!', win: 'Il porto è sotto il mio comando.', ko: 'Abbandonate la nave…' },
    text: 'Comanda i venti del golfo dal faro del molo: quando apre le ali, il libeccio obbedisce. Il cappello l\'ha trovato su un traghetto.',
    where: 'Il porto e il lungomare', art: { body: 'bird', main: '#f8f8f4', dark: '#6f7c8a', belly: '#ffffff', accent: '#ffcf3f', size: 1 }
  }),
  /* the wild ones, around town */
  cicalina: S({
    id: 'cicalina', name: 'Cicalina', wild: 'Una Cicalina selvatica', type: 'Chiacchiera', stage: 1,
    stats: { hp: 84, atk: 90, def: 70, spe: 104 },
    learn: [[1, 'botta'], [1, 'frinire'], [10, 'concerto'], [16, 'strillo'], [22, 'raffica']],
    evolve: { at: 18, into: 'cicalona' },
    cry: { entry: 'Cri-cri-cri-cri!', win: 'Cri-cri-cri-cri-cri!', ko: 'Cri…' },
    text: 'Canta l\'incantesimo dell\'estate sui pini di Vindicio: si dice che finché canta lei, l\'estate non finisce.',
    where: 'Pineta di Vindicio', art: { body: 'cicada', main: '#8a9a5b', dark: '#55613a', belly: '#c9d39b', accent: '#bfe3ff', size: 0.72 }
  }),
  cicalona: S({
    id: 'cicalona', name: 'Cicalona', wild: 'Una Cicalona selvatica', type: 'Chiacchiera', stage: 2,
    stats: { hp: 100, atk: 108, def: 84, spe: 118 },
    learn: [[1, 'botta'], [1, 'frinire'], [10, 'concerto'], [16, 'strillo'], [22, 'raffica']],
    cry: { entry: 'CRI-CRI-CRI!', win: 'Bis! Bis!', ko: 'Fine del concerto…' },
    text: 'Il suo canto addormenta tutta la pineta, tranne chi ha il cuore leggero.',
    where: 'Pineta di Vindicio', art: { body: 'cicada', main: '#7a8f4a', dark: '#4a5530', belly: '#c2cd8c', accent: '#bfe3ff', size: 0.92 }
  }),
  olivella: S({
    id: 'olivella', name: 'Olivella', wild: 'Un\'Olivella selvatica', type: 'Cuore', stage: 1,
    stats: { hp: 104, atk: 84, def: 90, spe: 72 },
    learn: [[1, 'botta'], [1, 'olio'], [10, 'nocciolo'], [16, 'radici'], [22, 'spinata']],
    evolve: { at: 18, into: 'olivastro' },
    cry: { entry: 'Oli-oli!', win: 'Oli-oliva!', ko: 'Oli…' },
    text: 'Un\'oliva incantata degli uliveti tra Formia e Itri: dove cade, in una notte nasce un ulivo.',
    where: 'Gli uliveti di campagna', art: { body: 'olive', main: '#6b3f6e', dark: '#3f2141', belly: '#9b6aa0', accent: '#7fb069', size: 0.72 }
  }),
  olivastro: S({
    id: 'olivastro', name: 'Olivastro', wild: 'Un Olivastro selvatico', type: 'Cuore', stage: 2,
    stats: { hp: 122, atk: 100, def: 106, spe: 82 },
    learn: [[1, 'botta'], [1, 'olio'], [10, 'nocciolo'], [16, 'radici'], [22, 'spinata']],
    cry: { entry: 'Olivastro è qui.', win: 'Mille anni di radici.', ko: 'Torno nell\'uliveto…' },
    text: 'Lo spirito degli ulivi più antichi, con radici che arrivano fino ai Romani. Le olive che porta in testa le regala a chi è gentile.',
    where: 'Gli uliveti di campagna', art: { body: 'olive', main: '#8a6a45', dark: '#4f3a24', belly: '#b8946a', accent: '#6fa35a', size: 0.95 }
  }),
  riccetto: S({
    id: 'riccetto', name: 'Riccetto', wild: 'Un Riccetto selvatico', type: 'Calma', stage: 1,
    stats: { hp: 90, atk: 86, def: 104, spe: 66 },
    learn: [[1, 'botta'], [1, 'aculei'], [10, 'guscio'], [16, 'spinata'], [22, 'frana']],
    evolve: { at: 18, into: 'riccione' },
    cry: { entry: 'Ric-ric!', win: 'Ric-ric-ric!', ko: 'Ric…' },
    text: 'Nasce dove la luna tocca il mare di Gianola, vicino al porticciolo romano: di notte i suoi aculei brillano.',
    where: 'Parco di Gianola', art: { body: 'urchin', main: '#5b3b7a', dark: '#2e1d42', belly: '#8f6ab3', accent: '#ffd166', size: 0.7 }
  }),
  riccione: S({
    id: 'riccione', name: 'Riccione', wild: 'Un Riccione selvatico', type: 'Calma', stage: 2,
    stats: { hp: 106, atk: 100, def: 122, spe: 74 },
    learn: [[1, 'botta'], [1, 'aculei'], [10, 'guscio'], [16, 'spinata'], [22, 'frana']],
    cry: { entry: 'Riccione! Non toccare.', win: 'Te l\'avevo detto.', ko: 'Mi ritiro tra gli scogli…' },
    text: 'I suoi aculei sono fatti di luna: chi lo sfiora vede per un attimo la villa di Mamurra com\'era.',
    where: 'Parco di Gianola', art: { body: 'urchin', main: '#4a2f68', dark: '#24163a', belly: '#7d5aa0', accent: '#ffd166', size: 0.9 }
  }),
  granchietto: S({
    id: 'granchietto', name: 'Granchietto', wild: 'Un Granchietto selvatico', type: 'Caos', stage: 1,
    stats: { hp: 88, atk: 100, def: 92, spe: 74 },
    learn: [[1, 'botta'], [1, 'chela'], [10, 'guscio'], [16, 'pinza'], [22, 'morso']],
    evolve: { at: 18, into: 'granchione' },
    cry: { entry: 'Clic-clac!', win: 'Clic-clac-clic!', ko: 'Clac…' },
    text: 'Corre di lato sugli scogli verso Gaeta e custodisce le grotte dove i marinai di Ulisse persero le loro monete.',
    where: 'Gli scogli della Scogliera', art: { body: 'crab', main: '#e8603c', dark: '#a8381f', belly: '#ffb08a', accent: '#ffffff', size: 0.72 }
  }),
  granchione: S({
    id: 'granchione', name: 'Granchione', wild: 'Un Granchione selvatico', type: 'Caos', stage: 2,
    stats: { hp: 104, atk: 118, def: 106, spe: 82 },
    learn: [[1, 'botta'], [1, 'chela'], [10, 'guscio'], [16, 'pinza'], [22, 'morso']],
    cry: { entry: 'CLAC!', win: 'Chi tocca la scogliera, trova me.', ko: 'Clac… clac…' },
    text: 'Si dice che le sue chele siano di bronzo antico, forgiate per i giganti di re Lamo.',
    where: 'Gli scogli della Scogliera', art: { body: 'crab', main: '#d24a2a', dark: '#8e2a14', belly: '#ff9d72', accent: '#ffffff', size: 0.92 }
  }),
  civettina: S({
    id: 'civettina', name: 'Civettina', wild: 'Una Civettina selvatica', type: 'Cervello', stage: 1,
    stats: { hp: 86, atk: 92, def: 78, spe: 98 },
    learn: [[1, 'beccata'], [1, 'occhiata'], [10, 'notturno'], [16, 'saggezza'], [22, 'picchiata']],
    evolve: { at: 18, into: 'civettona' },
    cry: { entry: 'Chiù! Chiù!', win: 'Chiù-chiù!', ko: 'Chiù…' },
    text: 'La piccola indovina dei Monti Aurunci: di notte, sopra Maranola, legge il futuro nelle luci della città.',
    where: 'Monti Aurunci', art: { body: 'owl', main: '#a87a52', dark: '#6b4a2e', belly: '#e8d2b0', accent: '#ffd166', size: 0.72 }
  }),
  civettona: S({
    id: 'civettona', name: 'Civettona', wild: 'Una Civettona selvatica', type: 'Cervello', stage: 2,
    stats: { hp: 100, atk: 108, def: 90, spe: 112 },
    learn: [[1, 'beccata'], [1, 'occhiata'], [10, 'notturno'], [16, 'saggezza'], [22, 'picchiata']],
    cry: { entry: 'Chiù. So già tutto.', win: 'Come previsto.', ko: 'Torno sui monti…' },
    text: 'Conosce tutte le leggende di Formia, anche quelle che nessuno ricorda più. E tutti i sentieri degli Aurunci.',
    where: 'Monti Aurunci', art: { body: 'owl', main: '#946642', dark: '#5a3c22', belly: '#e2c9a2', accent: '#ffd166', size: 0.92 }
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
    id, name: sp.name, full: sp.name, nick: sp.where, type: sp.type, tagline: sp.where, stats: sp.stats,
    passive: { name: 'Creatura di Formia', text: sp.text },
    weakness: null,
    moves: sp.learn.map((l) => CMOVES[l[1]]).filter((m, k, all) => all.indexOf(m) === k),
    lines: sp.cry
  });
}
