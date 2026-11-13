import { FORMIA_AT, FORMIA_SPOT } from './maps/formia-ground';

/* Nicola Spadea, the windsurf champion of Vindicio, the friend with the van (ui/nicola.ts). He laughs a lot and talks a
   bit Neapolitan: «uagliò». At the start of every story he comes up the player's street in his van and takes them to
   the Eclipse; from there he walks with them, knows every beach and every stretch of sea, and when asked he drives
   them across Formia. His words are here. */

/** the start of a story: the van comes up the street; Nicola takes the player to the Eclipse, where his windsurfs
    are, because Gianola is reached by sea; on the way he tells what Formia is */
export const PICKUP = {
  come: ['In fondo alla strada spunta un furgone bianco, con una tavola da windsurf legata sul tetto. Rallenta, e suona il clacson.'],
  cheer: ['UAGLIÒ! Ma perché hai *’sto muso lungo*? *Su con la vita!* Oggi si va al mare, ahahah!'],
  hello: ['La guardaparco di Gianola m\'ha chiamato stamattina: oggi affida le creature ai ragazzi di Formia, e ha detto di portarti da lei.',
    'Per strada? Ma quale strada! A Gianola ci si arriva dal *mare*. Ti porto all\'Eclipse: lì ho i windsurf, e il vento oggi è quello giusto. Sali!'],
  board: 'Sali sul furgone',
  arrive: ['Eccoci, uagliò: l\'Eclipse! Ahahah, hai visto che guida? Manco una buca.', 'Vieni giù in riva, che ti presento un amico.'],
  /* his creature, in the water in front of the Eclipse */
  faro: ['FAROOO!', 'Questo è Faro, il mio Delfaro. Le notti di burrasca accende la luce che ha in testa, e le barche di Mola lo seguono fino in porto.',
    'Me l\'ha fatto conoscere il mare, a Vindicio, un\'estate. Da allora usciamo insieme. Ahahah, è più bravo di me col vento.'],
  /* and how strong he is: the old board in the water, gone */
  show: ['Vuoi vedere quanto è forte? Vedi quella tavola vecchia che galleggia là? Tanto è da buttare.', 'Faro… *IDROPOMPA*!'],
  shown: ['AHAHAHAH! Hai visto?! L\'ha mandata fino a Gaeta!', 'Ecco cosa diventa una creatura, se ci cresci insieme. Pure tu, da oggi, ne avrai una tua. Vedrai.'],
  lend: ['Ecco il windsurf: è tuo finché ti serve. Gianola è a est, dall\'altra parte del golfo.',
    'Stammi dietro e segui la *vela rossa*: in rettilineo vai sempre più forte, se giri rallenti. Se resti indietro ti aspetto. Ahahah, andiamo!'],
  go: 'Prendi il windsurf',
  /* landing at Gianola, and landing anywhere else on the way */
  landed: ['Gianola, uagliò! Ahahah, sei nato per il windsurf.', 'La guardaparco ci ha visti arrivare: eccola che scende dal parco.',
    'Io torno all\'Eclipse, che il vento gira. Il windsurf tienilo tu: con quello giri tutto il golfo. Quando ti serve un passaggio col furgone, mi trovi là!'],
  early: 'Gianola sta più a est, uagliò: rimettiti in acqua e seguimi!'
};
/** the way to Gianola on the windsurf, behind Nicola: past the buoys of Vindicio, along the port, up to Mola, along the
    coast of Acqualonga and down to the beach of the Sassolini; what he shouts at some of the points */
export const WS_ROUTE: { at: [number, number]; say?: string }[] = [
  { at: [50, 114], say: 'Stammi dietro, uagliò! Facciamo il giro largo: Formia dal mare non l\'hai mai vista così. Ahahah!' },
  { at: [64, 114] }, { at: [74, 109], say: 'Tra le boe, uagliò! Destra, sinistra… così!' },
  { at: [86, 107], say: 'Qua sotto ci sono le peschiere romane di Caposele: le vasche dove i Romani tenevano i pesci.' },
  { at: [100, 104] }, { at: [128, 101], say: 'Il porto! Traghetti e aliscafi per Ponza e Ventotene. Occhio alle barche!' },
  { at: [148, 93] }, { at: [158, 86], say: 'Mola, il borgo dei pescatori. La vedi la torre? Era il castello. La sera, sulla banchina, odore di polpo. Ahahah!' },
  { at: [160, 74] }, { at: [170, 60], say: 'Adesso giù il boma e dritti verso est: qua il vento entra pulito!' },
  { at: [200, 58], say: 'Acqualonga: tra l\'Appia e il mare ci stanno calette che conoscono in pochi. Io sì. Ahahah.' },
  { at: [228, 72] }, { at: [238, 92], say: 'Lo vedi il promontorio? È Gianola: lassù ci stanno le rovine della villa di Mamurra.' },
  { at: [242, 106] }, { at: [254, 109], say: 'La spiaggia dei Sassolini! Vai a riva, uagliò: io ti guardo da qua.' }
];
/** the way back, alone, once the player has landed */
export const WS_BACK: [number, number][] = [[244, 112], [226, 114]];
/** when the player falls behind, one of these, in turn */
export const WS_WAIT = ['Uagliò! Di qua! Ti aspetto, ahahah.', 'Oh, stai dietro? Il vento non aspetta, io sì. Ahahah!', 'Segui la vela rossa, uagliò!'];
/** what he tells on the way to the Eclipse, in the van: Formia, the story, and what is about to happen. Each line
    comes at a point of the drive (the share of the way gone) */
export const RIDE_TALK: [number, string][] = [
  [0.02, 'Allacciati, uagliò. Lo sai che Formia è vecchia di tremila anni? Ahahah, più vecchia di me.'],
  [0.16, 'Nell\'Odissea Ulisse arriva alla città dei Lestrigoni, i giganti di re Lamo: Telepilo, la chiamavano. I Romani dicevano che era Formia.'],
  [0.32, 'I Lestrigoni tiravano i massi alle navi di Ulisse. Ancora oggi, al porto, ogni tanto i pescatori trovano pietre che non si sa da dove vengono.'],
  [0.48, 'Poi vennero i Romani, con le ville al mare. Mamurra era di qua: l\'ingegnere di Giulio Cesare, ricco da far schifo. La sua villa sta a Gianola, ci passi oggi.'],
  [0.64, 'E adesso, nelle pietre e nel mare di Formia, ci stanno le *creature*. La guardaparco dice che si sono svegliate tutte insieme. Strano, no?'],
  [0.8, 'Senti il vento? Libeccio leggero. Oggi a Vindicio è giornata. Ahahah!']
];
/** what he says on the way, walking into a part of Formia with him (once in a while) */
export const ON_THE_WAY: Record<string, string> = {
  'Vindicio': 'Vindicio, uagliò: più di un chilometro di sabbia. La mattina il mare è uno specchio, il pomeriggio entra la termica. Ahahah!',
  'Caposele': 'Le peschiere romane di Caposele: sott\'acqua ci sono ancora le vasche dove i Romani tenevano i pesci.',
  'Porto': 'Dal porto partono i traghetti per Ponza e Ventotene. Ponza, uagliò! Un giorno ti ci porto. Ahahah.',
  'Mola': 'Mola è il borgo dei pescatori: la sera, sulla banchina, si sente l\'odore del polpo. Ahahah, mi è venuta fame.',
  'Centro': 'Quando c\'è libeccio le onde arrivano fin sul lungomare. Il furgone l\'ho lavato tre volte. Ahahah!',
  'Gianola': 'A Gianola c\'è la spiaggia dei Sassolini: acqua trasparente, e sotto la villa di Mamurra le grotte. Il mare più bello di Formia, dico io.',
  'Scauri': 'Scauri, uagliò: spiaggia lunga, e quando gira il vento da sud-ovest si esce con la tavola.',
  'Acqualonga': 'Qua sotto, tra la strada e il mare, ci stanno calette che conoscono in pochi. Io sì. Ahahah.',
  'Il golfo di Gaeta': 'Al largo, uagliò! Qua il vento gira pulito. Se cadi, ti fai una nuotata. Ahahah!',
  'Castellone': 'Da quassù si vede tutto il golfo, fino a Gaeta. Il mare da qua sopra sembra fermo. Non lo è mai. Ahahah.'
};
/** asked about beaches and the sea: one at a time, in turn (some only once something has happened) */
export const SEA_TIPS: { say: string[]; after?: string }[] = [
  { say: ['Il mare di Formia ha tre facce, uagliò: la sabbia di Vindicio, gli scogli di Gianola, e il largo.', 'Tra gli scogli, nelle pozze, si nascondono le creature. Passaci in mezzo e vedi. Ahahah.'] },
  { say: ['Una creatura che nuota ti porta in acqua: vicino a riva ci stanno le creature del bagnasciuga, al largo quelle grosse.', 'Al largo, quelle grosse escono quando hai già visto un po\' di mare.'] },
  { say: ['Col windsurf giri tutto il golfo: in rettilineo prendi velocità, se cambi direzione la perdi. All\'Eclipse ti faccio pure la lezione vera. Ahahah!'] },
  { after: 'tavola', say: ['Col windsurf vai dove vuoi: le boe rosse segnano le secche, e da quella in mezzo al golfo si vede Formia intera.', 'E guarda bene l\'acqua: le correnti portano bottiglie con dei messaggi dentro. Qualcuno ci mette pure qualcosa di buono.'] },
  { say: ['Al largo trovi pure gente: chi fa SUP, un sub che cerca tesori, un pescatore sul gozzo. Ognuno vuole la sua sfida. Ahahah!'] },
  { say: ['Faro, il mio Delfaro, sta sempre davanti all\'Eclipse. Se lo saluti, ti schizza. E hai visto la sua idropompa… Ahahah!'] },
  { say: ['Gianola, la spiaggia dei Sassolini, la mattina presto: acqua che sembra vetro. Ricordatelo, uagliò.'] }
];
/** where the van goes, across Formia: a name for the button, and the tile to get close to */
export interface Ride { id: string; label: string; at: [number, number] }
const door = (id: string): [number, number] => { const a = FORMIA_AT[id]; return a.door || [a.x + Math.floor(a.w / 2), a.y + a.h]; };
export const RIDES: Ride[] = [
  { id: 'eclipse', label: 'Vindicio, all\'Eclipse', at: door('eclipse') },
  { id: 'gianola', label: 'Gianola, al parco', at: FORMIA_SPOT.guardaparco },
  { id: 'mola', label: 'Mola, Largo Paone', at: [125, 72] },
  { id: 'centro', label: 'Piazza della Vittoria', at: FORMIA_SPOT.costanzo },
  { id: 'stazione', label: 'La stazione', at: door('stazione') },
  { id: 'zauli', label: 'Il Bruno Zauli', at: door('zauli') },
  { id: 'scauri', label: 'Scauri', at: FORMIA_SPOT['start-zendavid'] }
];
export const RIDE = {
  ask: ['Dove andiamo, uagliò? Ahahah, allacciati la cintura.'],
  far: ['Il furgone sta parcheggiato più in là. Aspetta qua, che lo vado a prendere. Ahahah!'],
  here: ['Eccoci! Ahahah. Quando ti serve, il furgone sta qua.'],
  none: ['Uagliò, da qua col furgone non ci arrivo: siamo troppo lontani dalla strada.'],
  skip: 'Salta il viaggio'
};
/** walking with him: what he says when talked to, and when he goes back to the beach */
export const WALK = {
  hi: ['Uagliò! Che si fa? Ahahah.', 'Dimmi tutto, uagliò.', 'Ahahah! Sto qua, sto qua.'],
  bye: ['Va bene, uagliò: io torno all\'Eclipse, che c\'è vento. Quando mi vuoi, sto là. Ahahah!'],
  join: ['Vengo con te, uagliò! Ahahah, andiamo.'],
  lesson: 'Lezione di windsurf',
  sea: 'Spiagge e mare',
  ride: 'Passaggio col furgone',
  leave: 'Ci vediamo dopo',
  come: 'Vieni con me'
};
