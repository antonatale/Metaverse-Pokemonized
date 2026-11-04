import type { Character, Move, Stats } from './characters';
import type { TypeName } from './types';

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
  | 'lamo';

/** how a creature is drawn (render/svg/creatures.ts): its body, its colours, and what grows on it with each form */
export type Body = 'octo' | 'lizard' | 'bird' | 'cicada' | 'olive' | 'urchin' | 'crab' | 'owl' | 'giant';
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
  /** the legendary one: harder to catch with a net (1 for everyone else) */
  catchRate?: number;
}

/* ---------- the moves of the creatures: plain numbers, done by battle/moves.ts (genericMove) ---------- */
const atk = (id: string, name: string, power: number, text: string, o: Partial<Move> = {}): Move => ({ id, name, kind: 'atk', power, text, ...o });
export const CMOVES: Record<string, Move> = {
  botta: atk('botta', 'Scintilla', 55, 'Un colpo con una scintilla di magia, senza tipo: va bene contro tutti.', { plain: true }),
  beccata: atk('beccata', 'Beccata', 45, 'Colpisce per prima. Senza tipo: va bene contro tutti.', { priority: 1, plain: true }),
  spruzzo: atk('spruzzo', 'Inchiostro arcano', 50, 'Danno basso, e l\'Attacco avversario cala per 3 turni.', { fx: { foe: 'atkDown' } }),
  tentacolata: atk('tentacolata', 'Tentacoli di marea', 70, 'Otto braccia e la forza della marea. Danno medio.', { mtype: 'Calma' }),
  mimetismo: { id: 'mimetismo', name: 'Velo di scogliera', kind: 'buff', text: 'Si avvolge in un velo incantato del colore degli scogli: Difesa +25% per 3 turni.', fx: { self: 'defUp' } },
  abbraccio: atk('abbraccio', 'Abbraccio degli abissi', 90, 'Danno alto, ma va a segno 85 volte su 100.', { acc: 0.85 }),
  mareggiata: atk('mareggiata', 'Mareggiata incantata', 100, 'Chiama il mare del golfo: danno altissimo, va a segno 8 volte su 10.', { acc: 0.8, mtype: 'Calma' }),
  genio: { id: 'genio', name: 'Lampo di genio', kind: 'buff', text: 'Una magia gli attraversa la testa: Attacco +30% per 3 turni.', fx: { self: 'atkUp' } },
  sole: { id: 'sole', name: 'Bagno di sole', kind: 'heal', uses: 2, text: 'Si scalda su un muro di Castellone: recupera il 35% dei PS.', fx: { heal: 0.35 } },
  coda: atk('coda', 'Coda runica', 60, 'Critico più facile (20%).', { crit: 0.2 }),
  scaglie: { id: 'scaglie', name: 'Scaglie di pietra viva', kind: 'buff', text: 'Difesa +25% per 3 turni.', fx: { self: 'defUp' } },
  morso: atk('morso', 'Morso di runa', 75, 'Danno medio-alto.'),
  frana: atk('frana', 'Frana dei giganti', 95, 'La furia dei Lestrigoni: danno alto, va a segno 85 volte su 100.', { acc: 0.85, mtype: 'Caos' }),
  muraglia: { id: 'muraglia', name: 'Muraglia dei giganti', kind: 'heal', uses: 2, text: 'Alza le mura poligonali dei Lestrigoni: recupera il 25% dei PS e la Difesa sale per 3 turni.', fx: { heal: 0.25, self: 'defUp' } },
  strillo: { id: 'strillo', name: 'Strillo del vento', kind: 'status', text: 'Uno strillo che porta il vento: l\'Attacco avversario cala per 3 turni.', fx: { foe: 'atkDown' } },
  furto: atk('furto', 'Furto di panino', 60, 'Ruba il panino: si riprende metà del danno.', { drain: 0.5 }),
  picchiata: atk('picchiata', 'Picchiata di tempesta', 80, 'Danno alto.', { mtype: 'Caos' }),
  raffica: atk('raffica', 'Raffica di maestrale', 65, 'Danno medio, e una volta su quattro confonde.', { fx: { conf: 0.25 }, mtype: 'Caos' }),
  libeccio: atk('libeccio', 'Libeccio', 100, 'Il vento del golfo: danno altissimo, va a segno 8 volte su 10.', { acc: 0.8 }),
  frinire: { id: 'frinire', name: 'Frinire incantato', kind: 'status', text: 'Un canto che fa girare la testa: confonde per 2 turni.', fx: { conf: 1 } },
  concerto: atk('concerto', 'Concerto d\'agosto', 75, 'Danno medio-alto.'),
  olio: { id: 'olio', name: 'Olio della vita', kind: 'heal', uses: 2, text: 'L\'olio nuovo, che guarisce: recupera il 30% dei PS.', fx: { heal: 0.3 } },
  nocciolo: atk('nocciolo', 'Sputo di nocciolo', 65, 'Danno medio.'),
  radici: { id: 'radici', name: 'Radici millenarie', kind: 'buff', text: 'Difesa +25% per 3 turni.', fx: { self: 'defUp' } },
  aculei: atk('aculei', 'Aculei di luna', 55, 'Danno basso, e una volta su cinque confonde.', { fx: { conf: 0.2 } }),
  guscio: { id: 'guscio', name: 'Guscio di madreperla', kind: 'buff', text: 'Difesa +25% per 3 turni.', fx: { self: 'defUp' } },
  spinata: atk('spinata', 'Pioggia di spine', 80, 'Spine di luna dal cielo: danno alto.', { mtype: 'Calma' }),
  chela: atk('chela', 'Chela di bronzo', 65, 'Critico più facile (25%).', { crit: 0.25 }),
  pinza: atk('pinza', 'Pinza dei giganti', 85, 'Danno alto, va a segno 85 volte su 100.', { acc: 0.85 }),
  occhiata: { id: 'occhiata', name: 'Occhio del futuro', kind: 'status', text: 'Vede il colpo prima che arrivi, e il punto debole: la Difesa avversaria cala per 2 turni.', fx: { foe: 'defDown' } },
  notturno: atk('notturno', 'Volo notturno', 75, 'Danno medio-alto.'),
  saggezza: { id: 'saggezza', name: 'Saggezza antica', kind: 'buff', text: 'Attacco +30% per 3 turni.', fx: { self: 'atkUp' } },
  /* the moves of the new forms, each its own */
  pennino: atk('pennino', 'Pennino stellato', 80, 'Scrive nell\'aria una stella d\'inchiostro: danno alto, e critico più facile (20%).', { crit: 0.2 }),
  catilinaria: atk('catilinaria', 'Catilinaria', 90, '«Fino a quando abuserai della nostra pazienza?»: l\'orazione più famosa di Cicerone. Danno alto, va a segno 9 volte su 10.', { acc: 0.9, mtype: 'Chiacchiera' }),
  marmo: atk('marmo', 'Marmo lunare', 80, 'Una lastra delle mura che brilla di luna: danno alto, e la Difesa sale per 3 turni.', { fx: { self: 'defUp' } }),
  cuorepietra: atk('cuorepietra', 'Cuore di pietra', 90, 'Le mura difendono chi ama Formia: danno alto, va a segno 9 volte su 10, e si riprende un quarto del danno.', { acc: 0.9, drain: 0.25, mtype: 'Cuore' }),
  burrasca: atk('burrasca', 'Burrasca', 80, 'Una burrasca improvvisa sul golfo: danno alto, e una volta su cinque confonde.', { fx: { conf: 0.2 } }),
  desiderio: atk('desiderio', 'Desiderio del mare', 85, 'Porta al mare i desideri sussurrati sul lungomare: danno alto, e si riprende un quarto del danno.', { drain: 0.25, mtype: 'Cuore' }),
  tempesta: atk('tempesta', 'Tempesta di luna', 90, 'La luna piena alza il mare e i fulmini lo spaccano: danno alto, va a segno 85 volte su 100, e a volte confonde.', { acc: 0.85, mtype: 'Calma', fx: { conf: 0.2 } }),
  canicola: atk('canicola', 'Canicola', 85, 'Il caldo d\'agosto che fa impazzire anche le pietre: danno alto.', { mtype: 'Caos' }),
  ombra: atk('ombra', 'Ombra millenaria', 80, 'All\'ombra degli ulivi più antichi: danno alto, e la Difesa sale per 3 turni.', { mtype: 'Calma', fx: { self: 'defUp' } }),
  nostalgia: atk('nostalgia', 'Nostalgia', 80, 'Chi la sfiora rivede Formia com\'era, e resta lì a guardarla: danno alto, e una volta su cinque confonde.', { mtype: 'Cuore', fx: { conf: 0.2 } }),
  morsa: atk('morsa', 'Morsa di marea', 85, 'Chele che stringono come la marea e non lasciano più: danno alto, va a segno 9 volte su 10.', { mtype: 'Calma', acc: 0.9 }),
  profezia: atk('profezia', 'Profezia', 80, 'Vede il colpo nel futuro e lo dà dove fa male: danno alto, e critico più facile (25%).', { mtype: 'Calma', crit: 0.25 }),
  /* the king of the giants */
  masso: atk('masso', 'Masso dei giganti', 110, 'Scaglia un masso, come contro le navi di Ulisse: va a segno 8 volte su 10.', { acc: 0.8 }),
  furia: atk('furia', 'Furia dei Lestrigoni', 80, 'Danno alto, e una volta su tre confonde.', { fx: { conf: 0.3 } }),
  ruggito: { id: 'ruggito', name: 'Ruggito di Lamo', kind: 'status', text: 'Un ruggito che scuote il golfo: l\'Attacco avversario cala per 3 turni.', fx: { foe: 'atkDown' } },
  telepilo: { id: 'telepilo', name: 'Porte di Telepilo', kind: 'heal', uses: 2, text: 'Chiude le porte della sua città: recupera il 25% dei PS e la Difesa sale.', fx: { heal: 0.25, self: 'defUp' } }
};

/* ---------- the species ---------- */
const S = (o: Species) => o;
export const SPECIES: Record<SpeciesId, Species> = {
  /* the three to start with: from the sea, the old walls and the sky over the port */
  polpino: S({
    id: 'polpino', name: 'Polpino', wild: 'Un Polpino selvatico', type: 'Cervello', stage: 1,
    stats: { hp: 98, atk: 100, def: 92, spe: 98 },
    learn: [[1, 'botta'], [1, 'spruzzo'], [6, 'tentacolata'], [12, 'mimetismo'], [18, 'abbraccio'], [26, 'mareggiata'], [34, 'genio']],
    evolve: { at: 14, into: 'polpetto' },
    cry: { entry: 'Pol-pì!', win: 'Pol-pì pol-pì!', ko: 'Pooolp…' },
    text: 'Un polpetto magico del golfo. Si dice che sia nato dall\'inchiostro di una lettera di Cicerone caduta in mare: con il suo scrive incantesimi sugli scogli.',
    where: 'Gli scogli del golfo', art: { body: 'octo', main: '#e9765f', dark: '#b8473a', belly: '#ffc2a8', accent: '#fff3e8', size: 0.78 }
  }),
  polpetto: S({
    id: 'polpetto', name: 'Calamastro', wild: 'Un Calamastro selvatico', type: 'Cervello', stage: 2, sig: 'pennino',
    stats: { hp: 110, atk: 112, def: 104, spe: 110 },
    learn: [[1, 'botta'], [1, 'spruzzo'], [6, 'tentacolata'], [12, 'mimetismo'], [14, 'pennino'], [18, 'abbraccio'], [26, 'mareggiata'], [34, 'genio']],
    evolve: { at: 26, into: 'polpastro', bond: 60 },
    cry: { entry: 'Calamà! Calamà!', win: 'Firmato: Calamastro.', ko: 'Si è seccato l\'inchiostro…' },
    text: 'Porta in testa il calamaio da cui è nato e con il tentacolo più lungo scrive stelle d\'inchiostro nell\'aria: nelle notti senza luna i pescatori di Mola le seguono per tornare in porto.',
    where: 'Gli scogli del golfo', art: { body: 'octo', main: '#5a6fd6', dark: '#33429a', belly: '#b9c4ff', accent: '#ffd166', size: 0.9 }
  }),
  polpastro: S({
    id: 'polpastro', name: 'Ciceropode', wild: 'Un Ciceropode selvatico', type: 'Cervello', type2: 'Chiacchiera', stage: 3, sig: 'catilinaria',
    stats: { hp: 122, atk: 126, def: 114, spe: 120 },
    learn: [[1, 'botta'], [1, 'spruzzo'], [6, 'tentacolata'], [12, 'mimetismo'], [14, 'pennino'], [18, 'abbraccio'], [26, 'mareggiata'], [26, 'catilinaria'], [34, 'genio']],
    cry: { entry: 'Quo usque tandem!', win: 'Ho detto.', ko: 'O tempora, o mores…' },
    text: 'Ha letto tutte le lettere di Cicerone finite in mare, e ora parla come lui: fluttua sopra gli scogli con la toga e il rotolo, e quando arringa il golfo persino le onde stanno zitte.',
    where: 'Gli scogli del golfo', art: { body: 'octo', main: '#8a3fb8', dark: '#55207a', belly: '#e3b8ff', accent: '#ffd166', size: 1 }
  }),
  ramarrino: S({
    id: 'ramarrino', name: 'Ramarrino', wild: 'Un Ramarrino selvatico', type: 'Calma', stage: 1,
    stats: { hp: 100, atk: 94, def: 100, spe: 82 },
    learn: [[1, 'botta'], [1, 'sole'], [6, 'coda'], [12, 'scaglie'], [18, 'morso'], [26, 'frana'], [34, 'muraglia']],
    evolve: { at: 14, into: 'ramarrone' },
    cry: { entry: 'Rrr-ramà!', win: 'Rrr… al chiaro di luna.', ko: 'Ramà…' },
    text: 'Uno spirito verde delle mura di Castellone, con una falce di luna sulla testa. Si racconta che quelle pietre le abbiano messe i giganti Lestrigoni: lui ne custodisce la forza, al sole di giorno e alla luna di notte.',
    where: 'Le mura di Castellone', art: { body: 'lizard', main: '#3fcf8e', dark: '#1f8a5c', belly: '#e9f7b0', accent: '#fff2b3', size: 0.8 }
  }),
  ramarrone: S({
    id: 'ramarrone', name: 'Ramarmo', wild: 'Un Ramarmo selvatico', type: 'Calma', stage: 2, sig: 'marmo',
    stats: { hp: 112, atk: 106, def: 112, spe: 92 },
    learn: [[1, 'botta'], [1, 'sole'], [6, 'coda'], [12, 'scaglie'], [14, 'marmo'], [18, 'morso'], [26, 'frana'], [34, 'muraglia']],
    evolve: { at: 26, into: 'muraglione', bond: 60 },
    cry: { entry: 'Ramàrmo!', win: 'Duro come le mura.', ko: 'Torno sul mio muro…' },
    text: 'Si è coperto delle pietre poligonali delle mura: lastre lucide come marmo, tenute insieme da crepe che brillano di luna. Ha una coda così pesante che quando passa tremano i vicoli.',
    where: 'Le mura di Castellone', art: { body: 'lizard', main: '#2fae7a', dark: '#18704c', belly: '#d9efa0', accent: '#e9e2cf', size: 0.92 }
  }),
  muraglione: S({
    id: 'muraglione', name: 'Dracastello', wild: 'Un Dracastello selvatico', type: 'Calma', type2: 'Cuore', stage: 3, sig: 'cuorepietra',
    stats: { hp: 126, atk: 118, def: 128, spe: 98 },
    learn: [[1, 'botta'], [1, 'sole'], [6, 'coda'], [12, 'scaglie'], [14, 'marmo'], [18, 'morso'], [26, 'frana'], [26, 'cuorepietra'], [34, 'muraglia']],
    cry: { entry: 'DRACASTELLO!', win: 'Duemila anni, e ancora in piedi.', ko: 'Crollo… ma con calma.' },
    text: 'Il drago delle mura dei giganti: sulla schiena ha i merli di Castellone, in testa la torre ottagonale come una corona, e in petto un cuore di pietra che batte per Formia. Da duemila anni nessuno l\'ha mai smosso.',
    where: 'Le mura di Castellone', art: { body: 'lizard', main: '#21966b', dark: '#105c40', belly: '#cfe89a', accent: '#d8cfb8', size: 1 }
  }),
  gabbi: S({
    id: 'gabbi', name: 'Gabbì', wild: 'Un Gabbì selvatico', type: 'Caos', stage: 1,
    stats: { hp: 94, atk: 104, def: 84, spe: 110 },
    learn: [[1, 'beccata'], [1, 'furto'], [6, 'strillo'], [10, 'picchiata'], [18, 'raffica'], [26, 'libeccio'], [34, 'genio']],
    evolve: { at: 14, into: 'gabbianotto' },
    cry: { entry: 'Gab-bì! Gab-bì!', win: 'Gab-bì-bì-bì!', ko: 'Gab…' },
    text: 'Un pulcino del vento del golfo, con una nuvoletta di temporale in testa e il fazzoletto rosso dei marinai. Sul lungomare ruba i panini, e i desideri che la gente sussurra al mare.',
    where: 'Il porto e il lungomare', art: { body: 'bird', main: '#f6f7f4', dark: '#8d98a8', belly: '#ffffff', accent: '#ffcf3f', size: 0.78 }
  }),
  gabbianotto: S({
    id: 'gabbianotto', name: 'Burrasco', wild: 'Un Burrasco selvatico', type: 'Caos', stage: 2, sig: 'burrasca',
    stats: { hp: 104, atk: 116, def: 94, spe: 122 },
    learn: [[1, 'beccata'], [1, 'furto'], [6, 'strillo'], [10, 'picchiata'], [14, 'burrasca'], [18, 'raffica'], [26, 'libeccio'], [34, 'genio']],
    evolve: { at: 26, into: 'gabbiammiraglio', bond: 60 },
    cry: { entry: 'Burrascooo!', win: 'Il panino è mio!', ko: 'Volo via…' },
    text: 'Plana sui traghetti per Ponza e Ventotene in mezzo alla burrasca, con il berretto da marinaio storto: dove passa lui, il mare si increspa e il vento cambia.',
    where: 'Il porto e il lungomare', art: { body: 'bird', main: '#e9edf2', dark: '#5f6f86', belly: '#ffffff', accent: '#ffcf3f', size: 0.92 }
  }),
  gabbiammiraglio: S({
    id: 'gabbiammiraglio', name: 'Procellario', wild: 'Un Procellario selvatico', type: 'Caos', type2: 'Calma', stage: 3, sig: 'tempesta',
    stats: { hp: 116, atk: 130, def: 104, spe: 134 },
    learn: [[1, 'beccata'], [1, 'furto'], [6, 'strillo'], [10, 'picchiata'], [14, 'burrasca'], [18, 'raffica'], [26, 'libeccio'], [26, 'tempesta'], [28, 'desiderio'], [34, 'genio']],
    cry: { entry: 'Tutti a bordo!', win: 'Il golfo è sotto il mio comando.', ko: 'Abbandonate la nave…' },
    text: 'Il signore delle tempeste del golfo: comanda i venti dal faro del molo, con il cappello d\'ammiraglio e ali grandi come vele, e nelle notti di luna piena alza il mare. Ascolta ancora i desideri sussurrati alle onde, e qualcuno lo esaudisce.',
    where: 'Il porto e il lungomare', art: { body: 'bird', main: '#3c4a66', dark: '#1e2740', belly: '#f2f4f8', accent: '#ffcf3f', size: 1 }
  }),
  /* the wild ones, around town */
  cicalina: S({
    id: 'cicalina', name: 'Cicalina', wild: 'Una Cicalina selvatica', type: 'Chiacchiera', stage: 1,
    stats: { hp: 88, atk: 94, def: 80, spe: 104 },
    learn: [[1, 'botta'], [1, 'frinire'], [8, 'concerto'], [14, 'strillo'], [20, 'raffica']],
    evolve: { at: 18, into: 'cicalona' },
    cry: { entry: 'Cri-cri-cri-cri!', win: 'Cri-cri-cri-cri-cri!', ko: 'Cri…' },
    text: 'Canta l\'incantesimo dell\'estate sui pini di Vindicio: si dice che finché canta lei, l\'estate non finisce.',
    where: 'Pineta di Vindicio', art: { body: 'cicada', main: '#8a9a5b', dark: '#55613a', belly: '#c9d39b', accent: '#bfe3ff', size: 0.72 }
  }),
  cicalona: S({
    id: 'cicalona', name: 'Solleone', wild: 'Un Solleone selvatico', type: 'Chiacchiera', type2: 'Caos', stage: 2, sig: 'canicola',
    stats: { hp: 102, atk: 110, def: 92, spe: 118 },
    learn: [[1, 'botta'], [1, 'frinire'], [8, 'concerto'], [14, 'strillo'], [18, 'canicola'], [20, 'raffica']],
    cry: { entry: 'CRI-CRI-CRIII!', win: 'Bis! Bis!', ko: 'Fine del concerto…' },
    text: 'Canta solo nei giorni più caldi d\'agosto, con le ali dorate come raggi di sole: il suo canto fa impazzire il caldo, e chi lo ascolta si dimentica che arriva settembre.',
    where: 'Pineta di Vindicio', art: { body: 'cicada', main: '#d9a21b', dark: '#8a5e08', belly: '#ffe08a', accent: '#fff2b0', size: 0.95 }
  }),
  olivella: S({
    id: 'olivella', name: 'Olivella', wild: 'Un\'Olivella selvatica', type: 'Cuore', stage: 1,
    stats: { hp: 100, atk: 92, def: 88, spe: 76 },
    learn: [[1, 'botta'], [1, 'olio'], [8, 'nocciolo'], [14, 'radici'], [20, 'spinata']],
    evolve: { at: 18, into: 'olivastro' },
    cry: { entry: 'Oli-oli!', win: 'Oli-oliva!', ko: 'Oli…' },
    text: 'Un\'oliva incantata degli uliveti tra Formia e Itri: dove cade, in una notte nasce un ulivo.',
    where: 'Gli uliveti di campagna', art: { body: 'olive', main: '#6b3f6e', dark: '#3f2141', belly: '#9b6aa0', accent: '#7fb069', size: 0.72 }
  }),
  olivastro: S({
    id: 'olivastro', name: 'Olivastro', wild: 'Un Olivastro selvatico', type: 'Cuore', type2: 'Calma', stage: 2, sig: 'ombra',
    stats: { hp: 118, atk: 106, def: 102, spe: 86 },
    learn: [[1, 'botta'], [1, 'olio'], [8, 'nocciolo'], [14, 'radici'], [18, 'ombra'], [20, 'spinata']],
    cry: { entry: 'Olivastro è qui.', win: 'Mille anni di radici.', ko: 'Torno nell\'uliveto…' },
    text: 'Lo spirito degli ulivi più antichi, con radici che arrivano fino ai Romani. Le olive che porta in testa le regala a chi è gentile, e alla sua ombra si riposa chiunque.',
    where: 'Gli uliveti di campagna', art: { body: 'olive', main: '#8a6a45', dark: '#4f3a24', belly: '#b8946a', accent: '#6fa35a', size: 0.95 }
  }),
  riccetto: S({
    id: 'riccetto', name: 'Riccetto', wild: 'Un Riccetto selvatico', type: 'Calma', stage: 1,
    stats: { hp: 92, atk: 90, def: 98, spe: 70 },
    learn: [[1, 'botta'], [1, 'aculei'], [8, 'guscio'], [14, 'spinata'], [20, 'frana']],
    evolve: { at: 18, into: 'riccione' },
    cry: { entry: 'Ric-ric!', win: 'Ric-ric-ric!', ko: 'Ric…' },
    text: 'Nasce dove la luna tocca il mare di Gianola, vicino al porticciolo romano: di notte i suoi aculei brillano.',
    where: 'Parco di Gianola', art: { body: 'urchin', main: '#5b3b7a', dark: '#2e1d42', belly: '#8f6ab3', accent: '#ffd166', size: 0.7 }
  }),
  riccione: S({
    id: 'riccione', name: 'Lunaspina', wild: 'Una Lunaspina selvatica', type: 'Calma', type2: 'Cuore', stage: 2, sig: 'nostalgia',
    stats: { hp: 106, atk: 104, def: 114, spe: 80 },
    learn: [[1, 'botta'], [1, 'aculei'], [8, 'guscio'], [14, 'spinata'], [18, 'nostalgia'], [20, 'frana']],
    cry: { entry: 'Lunaspina! Non toccare.', win: 'Te l\'avevo detto.', ko: 'Mi ritiro tra gli scogli…' },
    text: 'I suoi aculei sono fatti di luna: chi la sfiora rivede per un attimo Formia com\'era, la villa di Mamurra intera e le navi nel porticciolo romano.',
    where: 'Parco di Gianola', art: { body: 'urchin', main: '#2f3f8f', dark: '#17205a', belly: '#8f9ee8', accent: '#fff2b3', size: 0.92 }
  }),
  granchietto: S({
    id: 'granchietto', name: 'Granchietto', wild: 'Un Granchietto selvatico', type: 'Caos', stage: 1,
    stats: { hp: 90, atk: 98, def: 92, spe: 76 },
    learn: [[1, 'botta'], [4, 'chela'], [8, 'guscio'], [14, 'pinza'], [20, 'morso']],
    evolve: { at: 18, into: 'granchione' },
    cry: { entry: 'Clic-clac!', win: 'Clic-clac-clic!', ko: 'Clac…' },
    text: 'Corre di lato sugli scogli verso Gaeta e custodisce le grotte dove i marinai di Ulisse persero le loro monete.',
    where: 'Gli scogli della Scogliera', art: { body: 'crab', main: '#e8603c', dark: '#a8381f', belly: '#ffb08a', accent: '#ffffff', size: 0.72 }
  }),
  granchione: S({
    id: 'granchione', name: 'Tenaglione', wild: 'Un Tenaglione selvatico', type: 'Caos', type2: 'Calma', stage: 2, sig: 'morsa',
    stats: { hp: 104, atk: 114, def: 106, spe: 86 },
    learn: [[1, 'botta'], [4, 'chela'], [8, 'guscio'], [14, 'pinza'], [18, 'morsa'], [20, 'morso']],
    cry: { entry: 'CLAC!', win: 'Chi tocca la scogliera, trova me.', ko: 'Clac… clac…' },
    text: 'Si dice che le sue chele siano di bronzo antico, forgiate per i giganti di re Lamo: stringono come la marea, e non lasciano più.',
    where: 'Gli scogli della Scogliera', art: { body: 'crab', main: '#b8642a', dark: '#6e3410', belly: '#f2b07a', accent: '#ffd166', size: 0.95 }
  }),
  civettina: S({
    id: 'civettina', name: 'Civettina', wild: 'Una Civettina selvatica', type: 'Cervello', stage: 1,
    stats: { hp: 90, atk: 96, def: 84, spe: 100 },
    learn: [[1, 'botta'], [1, 'occhiata'], [8, 'notturno'], [14, 'saggezza'], [20, 'picchiata']],
    evolve: { at: 18, into: 'civettona' },
    cry: { entry: 'Chiù! Chiù!', win: 'Chiù-chiù!', ko: 'Chiù…' },
    text: 'La piccola indovina dei Monti Aurunci: di notte, sopra Maranola, legge il futuro nelle luci della città.',
    where: 'Monti Aurunci', art: { body: 'owl', main: '#a87a52', dark: '#6b4a2e', belly: '#e8d2b0', accent: '#ffd166', size: 0.72 }
  }),
  civettona: S({
    id: 'civettona', name: 'Sibilla', wild: 'Una Sibilla selvatica', type: 'Cervello', type2: 'Calma', stage: 2, sig: 'profezia',
    stats: { hp: 104, atk: 112, def: 96, spe: 114 },
    learn: [[1, 'botta'], [1, 'occhiata'], [8, 'notturno'], [14, 'saggezza'], [18, 'profezia'], [20, 'picchiata']],
    cry: { entry: 'Chiù. So già tutto.', win: 'Come previsto.', ko: 'Torno sui monti…' },
    text: 'Si dice che abbia imparato a leggere il futuro dalla Sibilla di Cuma, giù lungo la costa: di notte, sopra Maranola, vede le cose prima che accadano, e conosce tutti i sentieri degli Aurunci.',
    where: 'Monti Aurunci', art: { body: 'owl', main: '#4a3f7a', dark: '#2a2250', belly: '#d8d0f2', accent: '#ffd166', size: 0.95 }
  }),
  /* the legend itself: Lamus, king of the Laestrygonians, the giant who threw boulders at Ulysses' ships. He
     comes out only at night on the polygonal walls of Castellone (the giants' walls, they say), once Antonio has
     both pins of Formia, and a net holds him only rarely */
  lamo: S({
    id: 'lamo', name: 'Lamo', wild: 'Lamo, il re dei Lestrigoni,', type: 'Caos', stage: 3, catchRate: 0.35,
    stats: { hp: 150, atk: 138, def: 128, spe: 100 },
    learn: [[1, 'furia'], [1, 'ruggito'], [1, 'masso'], [1, 'telepilo']],
    cry: { entry: 'CHI OSA SVEGLIARE IL RE DI TELEPILO?', win: 'Formia era mia, e lo è ancora.', ko: 'Torno… nella leggenda…' },
    text: 'Il re dei giganti Lestrigoni, quello che scagliava massi contro le navi di Ulisse. Si racconta che dorma sotto le mura di Castellone e che esca solo di notte, davanti a chi ha conquistato Formia.',
    where: 'Le mura di Castellone, di notte', art: { body: 'giant', main: '#9a8f7c', dark: '#5e5546', belly: '#c9bfa8', accent: '#e0b44c', size: 1 }
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
    passive: { name: 'Creatura di Formia', text: sp.text },
    weakness: null,
    moves: sp.learn.map((l) => CMOVES[l[1]]).filter((m, k, all) => all.indexOf(m) === k),
    lines: sp.cry
  });
}
