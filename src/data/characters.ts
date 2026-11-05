import type { TypeName } from './types';
import type { StatusId } from './passives';
import type { SpeciesId } from './creatures';

/* The six friends and the boss. Stats, moves and `uses` were tuned with thousands of simulated
   CPU-vs-CPU battles (npm run sim): every character should win 45–55% overall. Change them only with the sim. */

export type FriendId = 'antonio' | 'costanzo' | 'andrea' | 'valentin' | 'forchetta' | 'zendavid';
export type CharId = FriendId | 'esame';
/** anyone who can fight: the friends, the Esame, and the creatures of Formia (data/creatures.ts) */
export type FighterId = CharId | SpeciesId;
export type MoveKind = 'atk' | 'heal' | 'buff' | 'status';

export interface Move {
  id: string;
  name: string;
  kind: MoveKind;
  text: string;
  power?: number;
  /** power at each stage of Antonio's trip */
  powers?: number[];
  /** how many times it can be used in one battle */
  uses?: number;
  /** chance that the move fails (Sim-to-Real) */
  risk?: number;
  /** chance to hit, 1 when missing */
  acc?: number;
  /** critical hit chance, CRIT when missing */
  crit?: number;
  priority?: number;
  /** charges this turn, hits the next one */
  twoTurn?: boolean;
  /** the creatures' moves: what the battle says as it gets ready for a blow that lands the next turn; {n} is who */
  windup?: string;
  /** share of the damage healed back */
  drain?: number;
  /** chance that the move works at all (Battuta) */
  chance?: number;
  /** the creatures' moves: the type of their magic, when it is not the creature's own */
  mtype?: TypeName;
  /** a creature's plain move, of no type: the same against everyone */
  plain?: boolean;
  /** the creatures' moves: what they do besides the damage (battle/moves.ts, genericMove) */
  fx?: MoveFx;
}
export interface MoveFx {
  /** raises its own Attack (+30%) or Defence (+25%) for 5 turns */
  self?: 'atkUp' | 'defUp';
  /** lowers the foe's Attack (−25%, 5 turns) or Defence (−20%, 4 turns) */
  foe?: 'atkDown' | 'defDown';
  /** chance to confuse the foe for 2 turns */
  conf?: number;
  /** share of its full health it gets back */
  heal?: number;
  /** a state put on the foe (data/passives.ts), every time or with the chance in `odds` */
  status?: StatusId;
  odds?: number;
}
export interface Stats { hp: number; atk: number; def: number; spe: number }
export interface Trait { name: string; text: string }
/** what a character says: entry, win and ko always, the rest only where the engine looks for them */
export interface Lines { entry: string; win: string; ko: string; [key: string]: string | undefined }
export interface Character {
  id: FighterId;
  name: string;
  full: string;
  nick: string;
  type: TypeName;
  /** a second type: only some creatures of Formia, from their last forms */
  type2?: TypeName;
  tagline: string;
  boss?: boolean;
  stats: Stats;
  passive: Trait;
  weakness: Trait | null;
  moves: Move[];
  lines: Lines;
}

export const CHARS: Record<CharId, Character> = {
  antonio: {
    id: 'antonio', name: 'Antonio', full: 'Antonio', nick: 'Crazy shit', type: 'Cervello', tagline: 'Formia → Torino → Chicago',
    stats: { hp: 104, atk: 118, def: 76, spe: 110 },
    passive: { name: 'Prompt Engineer', text: 'A inizio turno, 25% di probabilità che l\'IA gli suggerisca un\'idea: la mossa successiva fa il 50% in più.' },
    weakness: { name: 'Dove l\'ho messo?', text: 'A inizio turno, 15% di probabilità di perdere un oggetto. La mossa collegata resta bloccata per 2 turni, finché non lo ritrova.' },
    moves: [
      { id: 'diagnosi', name: 'Diagnosi Energetica', kind: 'atk', power: 45, text: 'Danno basso. Trova le inefficienze: la Difesa dell\'avversario cala per 2 turni e i suoi numeri diventano visibili. Contro il computer prevede anche la sua prossima mossa.' },
      { id: 'certificati', name: 'Certificati Bianchi', kind: 'heal', uses: 3, text: 'Recupera 20 PS, più 12 per ogni certificato messo da parte. Ne mette da parte uno in ogni turno in cui non attacca (massimo 3).' },
      { id: 'simtoreal', name: 'Sim-to-Real', kind: 'atk', power: 78, risk: 0.3, text: 'Danno altissimo. Nel 30% dei casi il robot cade: nessun danno, e il turno dopo Antonio lo rimette in piedi.' },
      { id: 'america', name: 'Formia → Torino → AMERICA', kind: 'atk', powers: [24, 46, 76], text: 'Ogni uso avanza di una tappa: Formia fa poco danno, Torino di più, AMERICA è devastante e resta al massimo.' }
    ],
    lines: {
      entry: 'Ho già letto il paper di questa settimana.', crit: 'Crazy shit!', win: 'Crazy shit… stato dell\'arte.', ko: '…mi servono più basi di controlli.',
      lost: 'Ma dove l\'ho messo?!', ai: 'Ok, questa idea è forte.', robotFail: 'In simulazione funzionava…', america: 'Crazy shit!', time: 'Aspetti, manca solo l\'ultimo punto!'
    }
  },
  costanzo: {
    id: 'costanzo', name: 'Costanzo', full: 'Costanzo', nick: 'Er Politico', type: 'Chiacchiera', tagline: 'Comizi tutto il giorno',
    stats: { hp: 105, atk: 100, def: 86, spe: 95 },
    passive: { name: 'Non ti fa parlare', text: 'Quando colpisce, 20% di probabilità che l\'avversario non riesca a dire una parola e perda il turno.' },
    weakness: { name: 'La fissa', text: 'Se cambia attacco rispetto all\'ultimo che ha usato, perde il filo e fa il 20% in meno. Se insiste con lo stesso attacco, ogni terza volta è un colpo critico sicuro.' },
    moves: [
      { id: 'comizio', name: 'Comizio', kind: 'atk', power: 50, text: 'Sale sul palco e parte il comizio. Danno medio.' },
      { id: 'personaggismo', name: 'Personaggismo', kind: 'buff', text: 'Inforca gli occhiali di destra ed entra nel personaggio: per 3 turni diventa del tipo che batte l\'avversario.' },
      { id: 'bidet', name: 'Difesa del Bidet', kind: 'heal', uses: 3, text: 'Comizio in difesa del bidet: recupera 25 PS ed elimina gli effetti negativi.' },
      { id: 'daje', name: 'Daje Roma Daje', kind: 'atk', power: 70, acc: 0.8, text: 'Coro da curva: danno alto, ma va a segno 8 volte su 10.' }
    ],
    lines: { entry: 'GIÀ LO SAI.', crit: 'Daje Roma daje!', win: 'GIÀ LO SAI. Daje Roma daje!', ko: 'Mi appello al popolo…', fissa: 'GIÀ LO SAI!', persona: 'Adesso parlo da statista.' }
  },
  andrea: {
    id: 'andrea', name: 'Andrea', full: 'Andrea Albino Vento', nick: 'Volpino Alato', type: 'Cervello', tagline: 'Furbo, scaltro, calcolatore',
    stats: { hp: 100, atk: 98, def: 85, spe: 100 },
    passive: { name: 'Calcolatore', text: 'Registra ogni colpo: la seconda volta che subisce la stessa mossa, prende il 30% di danno in meno.' },
    weakness: { name: 'Senza sentimenti', text: 'Macchina razionale: non ha mosse per curarsi, e i colpi critici lo colpiscono dove fa male: fanno il doppio invece del 50% in più.' },
    moves: [
      { id: 'analisi', name: 'Analisi Statistica', kind: 'atk', power: 45, crit: 0.25, text: 'Colpo calcolato: non sbaglia mai e fa critico il 25% delle volte.' },
      { id: 'volpino', name: 'Volpino Alato', kind: 'atk', power: 58, priority: 1, text: 'Spicca il volo e colpisce dall\'alto: danno alto, e attacca sempre per primo.' },
      { id: 'palestra', name: 'Palestra e Padel', kind: 'buff', text: 'Allenamento doppio: l\'Attacco sale del 30% per 3 turni.' },
      { id: 'cucinato', name: 'Sono Cucinato', kind: 'atk', text: 'Più è cotto, più picchia: la potenza sale man mano che perde PS.' }
    ],
    lines: { entry: 'Ho calcolato tutto.', crit: 'Statisticamente inevitabile.', win: 'Come previsto. Al 94%.', ko: 'Sono cucinato.', cucinato: 'Sono cucinato… ma tu di più.', calc: 'Dati già raccolti.' }
  },
  valentin: {
    id: 'valentin', name: 'Valentin', full: 'Valentin', nick: 'L\'Animale Anomalo', type: 'Caos', tagline: 'L\'anima della festa',
    stats: { hp: 104, atk: 95, def: 80, spe: 105 },
    passive: { name: 'Anima della festa', text: 'La festa non finisce mai: recupera 5 PS alla fine di ogni turno.' },
    weakness: { name: 'Animale anomalo', text: 'Imprevedibile: nel 15% dei casi cambia idea e usa un\'altra mossa a caso.' },
    moves: [
      { id: 'weee', name: 'Weee!', kind: 'atk', power: 55, text: 'Trascina tutti nella festa: danno medio e 20% di confondere l\'avversario.' },
      { id: 'manipolazione', name: 'Manipolazione a Fin di Bene', kind: 'status', uses: 3, text: 'Lo convince che è per il suo bene: per 2 turni l\'avversario deve ripetere la sua ultima mossa. Valentin recupera 10 PS.' },
      { id: 'copenhagen', name: 'Volo per Copenhagen', kind: 'atk', power: 84, twoTurn: true, text: 'Vola da Christiana a Copenhagen: per il resto del turno è irraggiungibile, al turno dopo torna e colpisce fortissimo.' },
      { id: 'king', name: 'Il King del Verde', kind: 'buff', uses: 3, text: 'Inforca gli occhiali verdi, relax totale: per 3 turni subisce il 30% di danno in meno e recupera 10 PS.' }
    ],
    lines: { entry: 'Weee!', crit: 'WEEEEE!', win: 'Weee! Si fa festa da me.', ko: 'Weee… ok, mi siedo un attimo.', anomalo: 'Cambio di programma!', back: 'Saluti da Copenhagen!' }
  },
  forchetta: {
    id: 'forchetta', name: 'Forchetta', full: 'Antonio Forcina', nick: 'Forchetta', type: 'Calma', tagline: 'Il più formiano di tutti',
    stats: { hp: 108, atk: 96, def: 92, spe: 75 },
    passive: { name: 'Poteva andare peggio', text: 'La prima volta che un colpo lo manderebbe KO, resta in piedi con 1 PS.' },
    weakness: { name: 'Criptico', text: 'Risponde quando vuole lui: agisce sempre per ultimo, anche se è più veloce.' },
    moves: [
      { id: 'servizio', name: 'Servizio Vincente', kind: 'atk', power: 55, crit: 0.25, text: 'Ace al primo servizio: danno medio e 25% di colpo critico.' },
      { id: 'pitstop', name: 'Pit Stop', kind: 'heal', uses: 3, text: 'Cambio gomme in due secondi: recupera 20 PS e la Difesa sale del 25% per 3 turni.' },
      { id: 'criptico', name: 'Messaggio Criptico', kind: 'status', text: 'Manda un messaggio che nessuno capisce: l\'avversario resta confuso per 2 turni.' },
      { id: 'formia', name: 'Forza Formia', kind: 'atk', power: 55, drain: 0.4, text: 'Il più formiano di tutti: danno medio e recupera il 40% del danno inflitto.' }
    ],
    lines: { entry: 'Poteva andare peggio.', crit: 'Ace.', win: 'Poteva andare peggio. Per te.', ko: 'Poteva andare peggio… forse no.', sturdy: 'Poteva andare peggio.' }
  },
  zendavid: {
    id: 'zendavid', name: 'Zendavid', full: 'Davide Borrelli', nick: 'Zendavid', type: 'Cuore', tagline: 'Cuffie grosse, sempre',
    stats: { hp: 108, atk: 100, def: 86, spe: 90 },
    passive: { name: 'Creativo', text: 'Non gli piace ripetersi: la prima volta che usa ogni mossa, fa il 25% in più.' },
    weakness: { name: 'Ansia', text: 'Ogni colpo subito gli mette ansia: ogni livello (massimo 3) abbassa il suo Attacco del 6%. La Modalità Zen la azzera.' },
    moves: [
      { id: 'abbaia', name: 'Abbaia', kind: 'atk', power: 30, text: 'Bau! L\'avversario si spaventa: danno basso e il suo Attacco cala del 25% per 3 turni.' },
      { id: 'battuta', name: 'Battuta', kind: 'atk', power: 120, chance: 0.45, text: 'Più della metà delle volte non fa ridere nessuno. Nel 45% dei casi fa crollare tutti: danno enorme.' },
      { id: 'zen', name: 'Modalità Zen', kind: 'buff', uses: 3, text: 'Mette le cuffie: per 3 turni non sente niente (niente turni persi né manipolazioni), recupera 20 PS e azzera l\'ansia.' },
      { id: 'stronger', name: 'Stronger', kind: 'atk', power: 70, text: 'Kanye a tutto volume: danno alto, +20% se ha le cuffie in testa.' }
    ],
    lines: { entry: 'Bau.', crit: 'BAU!', win: 'Bau bau. Questa era bella, ammettilo.', ko: 'Ansia… metto le cuffie.', zen: 'Ok. Respira.', jokeFail: '…nessuno ride.', jokeWin: 'Stavolta ridono tutti!' }
  },
  esame: {
    id: 'esame', name: 'Esame di Controlli', full: 'Esame di Controlli', nick: 'Il boss', type: 'Cervello', tagline: 'Appello · 2 ore', boss: true,
    stats: { hp: 180, atk: 92, def: 85, spe: 70 },
    passive: { name: 'Tempo limite', text: 'L\'esame dura 2 ore e ogni turno passano 10 minuti. Allo scadere il compito viene ritirato, e conta come bocciatura.' },
    weakness: null,
    moves: [
      { id: 'bode', name: 'Diagramma di Bode', kind: 'atk', power: 40, acc: 0.95, text: 'Danno medio.' },
      { id: 'trabocchetto', name: 'Domanda a Trabocchetto', kind: 'atk', power: 35, acc: 0.9, text: 'Danno medio-basso, a volte sbaglia.' },
      { id: 'radici', name: 'Luogo delle Radici', kind: 'atk', power: 25, text: 'Danno basso, abbassa l\'Attacco per 2 turni.' },
      { id: 'bocciatura', name: 'Bocciatura', kind: 'atk', power: 75, acc: 0.7, text: 'Danno enorme, ma va a segno solo 7 volte su 10.' },
      { id: 'orale', name: 'Orale Integrativo', kind: 'heal', uses: 1, text: 'Recupera 30 PS, una sola volta.' }
    ],
    lines: { entry: 'Avete due ore. Niente appunti.', win: 'Ci vediamo al prossimo appello.', ko: 'Accetta il voto?', time: 'Consegnate.' }
  }
};
export const ROSTER: FriendId[] = ['antonio', 'costanzo', 'andrea', 'valentin', 'forchetta', 'zendavid'];
/** what two friends say to each other when they meet, by their ids sorted and joined with | */
export const PAIRS: Record<string, Partial<Record<CharId, string>>> = {
  'andrea|antonio': { antonio: 'Dopo questa, padel?', andrea: 'Ho già calcolato il risultato. Anche quello del padel.' },
  'antonio|forchetta': { antonio: 'Chi perde paga la prossima partita alla Play.', forchetta: 'Poteva andare peggio. Per te.' }
};

/** Zendavid's Battuta */
export const JOKES: string[] = [
  'Qual è il colmo per un giardiniere? Piantare la fidanzata.',
  'Qual è il colmo per un elettricista? Restare folgorato da una ragazza.',
  'Sai perché gli scheletri non litigano mai? Non hanno fegato.',
  'Qual è il colmo per un idraulico? Non capire un tubo.'
];
