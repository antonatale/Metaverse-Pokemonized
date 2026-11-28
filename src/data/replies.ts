import type { FriendId } from './characters';
import type { ItemId } from './growth';

/* What an answer in «il caminetto» does (27 November 2026, Antonio: «fai anche in modo che la risposta che decidi di dare
   al telefono abbia un impatto anche sul gioco e sulla storia»). Each answer of a chat (data/chat.ts `replies`, in the
   same order) has its consequence: a friend answers back, at once, in the chat; and something happens in the game,
   told in the chat under the answer and in the corner when the phone is put away:
   - a gift: a friend leaves something (a tiella in the letterbox, three nets held at the guardaparco's, money «for the
     coffee»);
   - the creature that leads: a word of the player warms it (bond);
   - the keeper of a covo who reads it: a worried word softens him (his creatures a level lower), a «coming for you»
     fires him up (a level higher, but a richer prize), and he says so when he is reached;
   - a joke makes the round of his covo: the guard of its first floor above lets the player by without a battle.
   The tone of each answer is shown on its button (`tone`), the consequence only once it is chosen. */

export type Tone = 'cuore' | 'deciso' | 'scherzo';
export interface ReplyFx {
  tone: Tone;
  /** a friend writes back at once: who ('keeper': the keeper of the chat's covo; 'rival': the rival) and what */
  back?: [FriendId | 'keeper' | 'rival' | 'last', string];
  gift?: { item: ItemId; n: number };
  money?: number;
  /** bond for the creature that leads */
  bond?: number;
  /** the keeper of a covo, when he is reached: `covo` names it when the chat is not a covo's own */
  mood?: 'carico' | 'tenero';
  covo?: string;
  /** the guard of the covo's floor above lets the player by */
  pass?: true;
  /** what happened, in the chat and in the corner */
  note: string;
}
/** the guard of the floor above the ground of each covo (data/maps/covi-floors.ts), whom a joke can make step aside */
export const FLOOR_GUARD: Record<string, string> = {
  morgana: 'custode-cripta', palamendola: 'tecnico-linea', padel: 'cambiavalute', eclipse: 'barista-spritz',
  piazza: 'funzionario', pineta: 'tecnico-luci', circolo: 'restauratrice'
};
/** an answer to a covo's chat: worried, coming, a joke */
const covo = (worried: string, coming: string, joke: string): ReplyFx[] => [
  { tone: 'cuore', back: ['keeper', worried], mood: 'tenero', note: 'Il tuo messaggio ha fatto effetto: al covo le sue creature saranno un livello più basse.' },
  { tone: 'deciso', back: ['keeper', coming], mood: 'carico', note: 'Ti aspetta a viso aperto: le sue creature un livello più alte, ma il premio della lotta è più ricco.' },
  { tone: 'scherzo', back: ['keeper', joke], pass: true, note: 'Il tuo messaggio ha fatto il giro del covo: la guardia del primo piano ti lascerà passare senza lottare.' }
];
export const REPLY_FX: Record<string, ReplyFx[]> = {
  inizio: [
    { tone: 'cuore', back: ['claudia', 'Allora non l\'ho sognato. Stai attento, {hero}: ti ho lasciato una cosa nella cassetta della posta.'], gift: { item: 'tiella', n: 2 }, note: 'Claudia ti ha lasciato due tielle nella cassetta della posta.' },
    { tone: 'deciso', back: ['valentin', 'Weee! Il primo che arriva sceglie per primo! Avviso io la guardaparco.'], gift: { item: 'retino', n: 3 }, note: 'Valentin ha avvisato la guardaparco: ti tiene da parte tre retini.' },
    { tone: 'scherzo', back: ['zendavid', '👀 Bau. Ti giro qualcosa per il caffè.'], money: 30, note: 'Zendavid ti ha girato 30 sesterzi «per il caffè».' }
  ],
  starter: [
    { tone: 'scherzo', back: ['andrea', 'Suspense. Statisticamente funziona.'], bond: 10, note: 'La tua creatura ha visto che la tieni per te: si affeziona di più.' },
    { tone: 'deciso', back: ['costanzo', 'VEDREMO. IN PIAZZA.'], mood: 'carico', covo: 'piazza', note: 'Costanzo se l\'è legata al dito: al Palazzo ti aspetta carico (creature più forti, premio più ricco).' },
    { tone: 'cuore', back: ['valentin', 'Weee! Stasera offro io, e domani pure.'], money: 50, note: 'Valentin ti ha offerto la serata: 50 sesterzi.' }
  ],
  'eco-palamendola': covo('…sto bene. Credo. Non venire.', 'Allora vieni. La simulazione dice che perdi.', '🤖 BEEP. Il tecnico ride ancora.'),
  'eco-padel': covo('Che dico? Grazie. Ma i numeri non tornano.', 'Ho calcolato le tue probabilità. Bassine.', '🎲 Ha fatto sei. Passa pure, dice il mio cambiavalute.'),
  'eco-circolo': covo('Sto palleggiando. È tutto quello che so fare adesso.', 'Ti aspetto a rete.', '🎾 La restauratrice l\'ha stampato e appeso.'),
  'eco-eclipse': covo('Weee… non trovo l\'uscita. Grazie che scrivi.', 'Vieni, allora. Ti faccio ballare io.', '🌫️ Weee! La barista non smette di ridere.'),
  'eco-morgana': covo('Non lo so. Ma grazie di avermelo chiesto.', 'Vieni. Il Padre ti aspetta.', '🦇 La custode della cripta l\'ha trovato divertente. Lei.'),
  'eco-piazza': covo('Il popolo… il popolo ringrazia.', 'Ti aspetto al balcone. Porta i pomodori.', '🏛️ Il funzionario ha timbrato il tuo messaggio. Approvato.'),
  'eco-pineta': covo('…Bau. Grazie. Non riesco ad abbassare.', 'Vieni sotto la cassa, allora.', '🔊 Il tecnico delle luci ha alzato il volume per te.'),
  'rivale-1': [
    { tone: 'deciso', back: ['rival', 'Quando vuoi tu. Ma stavolta non perdo.'], money: 40, note: 'La scommessa è fatta: 40 sesterzi sul piatto, già tuoi.' },
    { tone: 'cuore', back: ['rival', 'Anche tu. Davvero.'], bond: 10, note: 'La tua creatura ha sentito i complimenti: si affeziona di più.' },
    { tone: 'scherzo', back: ['valentin', 'WEEE 🔥🔥'], gift: { item: 'alici', n: 1 }, note: 'Valentin ti ha mandato un cartoccio di alici.' }
  ],
  'spilla-1': [
    { tone: 'deciso', back: ['andrea', 'Concordo. Ho già una lista, in ordine di distanza.'], gift: { item: 'manuale', n: 1 }, note: 'Andrea ti ha passato un manuale.' },
    { tone: 'cuore', back: ['last', 'Grazie. Lo sentivo, il tuo pensiero, là dentro.'], bond: 10, note: 'La tua creatura si affeziona di più.' },
    { tone: 'scherzo', back: ['andrea', 'Bravo. Gli orari sono dati.'], money: 40, note: 'Andrea ti ha girato 40 sesterzi: «rimborso spese».' }
  ],
  'pietra-mura': [
    { tone: 'deciso', back: ['andrea', 'Bene. Ogni segno è un dato.'], gift: { item: 'manuale', n: 1 }, note: 'Andrea ti ha passato un manuale.' },
    { tone: 'deciso', back: ['claudia', 'Caposele. Uno alla volta.'], money: 50, note: 'Claudia ti ha mandato 50 sesterzi per il viaggio.' },
    { tone: 'cuore', back: ['valentin', 'Weee, fuori c\'è il sole.'], bond: 10, note: 'La tua creatura si affeziona di più.' }
  ],
  'spilla-3': [
    { tone: 'deciso', back: ['costanzo', 'Portiamole in piazza. Il popolo deve sapere.'], money: 60, note: 'Costanzo ha fatto una colletta: 60 sesterzi.' },
    { tone: 'deciso', back: ['andrea', 'Lo stesso. Lo stesso impulso.'], gift: { item: 'manuale', n: 1 }, note: 'Andrea ti ha passato un manuale.' },
    { tone: 'cuore', back: ['zendavid', 'Bau. Segui il basso.'], bond: 10, note: 'La tua creatura si affeziona di più.' }
  ],
  'pietra-mare': [
    { tone: 'cuore', back: ['claudia', 'Cicerone saprà cosa dice.'], bond: 10, note: 'La tua creatura si affeziona di più.' },
    { tone: 'deciso', back: ['zendavid', 'Rallentata è ancora meglio. Bau.'], gift: { item: 'alici', n: 2 }, note: 'Zendavid ti ha mandato due cartocci di alici.' },
    { tone: 'scherzo', back: ['antonio', 'Salvata. Tre copie. Una su un hard disk nel frigo.'], money: 40, note: 'Antonio ti ha girato 40 sesterzi «per i backup».' }
  ],
  'pietra-voce': [
    { tone: 'cuore', back: ['valentin', 'Weee, tutti insieme!'], bond: 10, note: 'La tua creatura si affeziona di più.' },
    { tone: 'deciso', back: ['claudia', 'Sempre.'], gift: { item: 'tiella', n: 2 }, note: 'Claudia ti ha lasciato due tielle.' },
    { tone: 'deciso', back: ['andrea', 'Nel posto più sicuro: in tasca tua.'], gift: { item: 'ambrosia', n: 1 }, note: 'Andrea ti ha dato un\'ambrosia «per sicurezza».' }
  ],
  scala: [
    { tone: 'scherzo', back: ['costanzo', 'SETTE?! È un dieci pieno. Ma ti voglio bene uguale.'], money: 30, note: 'Costanzo ti ha mandato 30 sesterzi per «la passione per la Scala».' },
    { tone: 'cuore', back: ['costanzo', 'Fissato è una parola grossa. Diciamo appassionato.'], bond: 10, note: 'La tua creatura si affeziona di più.' },
    { tone: 'deciso', back: ['costanzo', 'Rivotare? Non si può. Però apprezzo.'], gift: { item: 'giornale', n: 1 }, note: 'Costanzo ti ha mandato il giornale di oggi.' }
  ],
  inguaiato: [
    { tone: 'scherzo', back: ['valentin', 'STAI INGUAIATOOOO 🎤🎤🎤'], money: 40, note: 'Valentin ti ha girato 40 sesterzi «per il microfono».' },
    { tone: 'cuore', back: ['valentin', 'Weee 🔥 grazie fra'], bond: 10, note: 'La tua creatura si affeziona di più.' },
    { tone: 'deciso', back: ['valentin', 'Alla prossima lotta. Promesso.'], gift: { item: 'alici', n: 2 }, note: 'Valentin ti ha mandato due cartocci di alici.' }
  ],
  'ultima-spilla': [
    { tone: 'cuore', back: ['claudia', 'Alla villa. Tutti.'], bond: 15, note: 'La tua creatura si affeziona di più.' },
    { tone: 'deciso', back: ['andrea', 'Bene. Le Pietre sono il dato che manca.'], gift: { item: 'ambrosia', n: 1 }, note: 'Andrea ti ha dato un\'ambrosia.' },
    { tone: 'cuore', back: ['valentin', 'Sempre, weee.'], money: 80, note: 'Valentin ha fatto girare il cappello: 80 sesterzi.' }
  ]
};
/** a word for each tone, on the button */
export const TONE: Record<Tone, string> = { cuore: 'affettuoso', deciso: 'deciso', scherzo: 'scherzo' };
