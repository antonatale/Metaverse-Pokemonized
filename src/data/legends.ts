import type { SpeciesId } from './creatures';
import type { Dir } from './maps/types';
import type { HeldId, StatFx } from './passives';
import type { TypeName } from './types';

/* The legends of Formia: a legend is an event, not a creature that happens to stand there. Each one is data here, and one
   runner does them all: when it is out, what opens the way to it, the fight in parts. story/maps.ts reads when it is out,
   ui/plot.ts does the way there and the end, battle/stages.ts the fight. Another legend is one more entry, with some art.
   Beaten, it does not simply go away: the player decides what becomes of it (`end`), and a net thrown in the last part of
   the fight is already a decision. */

/** one part of a legend's fight */
export interface LegendStage {
  /** this part starts when the health falls to this share of the full one (1 for the first) */
  at: number;
  /** its name, on the banner */
  name: string;
  /** what the legend says as it starts */
  line: string;
  /** the moves it fights with: all of them must be in its `learn` */
  moves: string[];
  /** its types in this part, if they change: who was right for the last part may not be right for this one */
  types?: TypeName[];
  /** numbers that stay up until the next part */
  self?: StatFx[];
  /** what it says instead if Antonio has kept its stones */
  angry?: string;
}
/** the legend is on its knees: what becomes of it. The flags are `sc-<id>-preso`, `-libero`, `-patto`, `-amico` */
export interface LegendEnd {
  /** what it says, beaten, before the player decides */
  ask: string[];
  /** a net: down as it is, it holds */
  net: { label: string; say: string[]; cicero: string[] };
  /** letting it go: it leaves something behind, and the diary counts it as met for good */
  free: { label: string; say: string[]; cicero: string[]; gift: HeldId };
  /** with the stones still in Antonio's bag, letting Lamo go means giving them back */
  back?: { label: string; say: string[] };
  /** a pact: it wants something, and when it gets it, it comes with all its heart */
  pact?: { label: string; say: string[]; need: number; wait: string[]; give: string; done: string[]; cicero: string[] };
}
/** a sequence of answers, each with one right one: a mistake starts it over, and nothing is lost */
export interface LegendRiddle {
  /** what is there, the first time */
  intro: string[];
  steps: { ask: string; options: string[]; ok: number }[];
  wrong: string[];
  /** when it opens */
  solved: string[];
}
export interface LegendDef {
  id: string;
  sp: SpeciesId;
  /** the thing that has to have happened (a flag of story/plot.ts), and the hour it comes out */
  after: string;
  hour: 'night' | 'sunset';
  /** what opens the way down, the first time */
  riddle?: LegendRiddle;
  /** the walk to it: a place of its own, proved like every place, where it waits at any hour */
  trial?: { to: string; x: number; y: number; dir: Dir; again: string[] };
  stages: LegendStage[];
  /** what becomes of it, once beaten */
  end?: LegendEnd;
  /** a king who wants his stones back: no riddle, the way is already broken open, and he is this many levels stronger */
  angry?: { more: number; way: string[] };
}

export const LEGENDS: Record<string, LegendDef> = {
  lamo: {
    id: 'lamo', sp: 'lamo', after: 'tr-mamurra', hour: 'night',
    riddle: {
      intro: ['Il gigante non si muove. Ai suoi piedi, nella pietra delle mura, si aprono tre nicchie vuote.', 'Le Pietre di Telepilo, nella borsa, si scaldano.',
        'Sulla pietra c\'è scritto: «Prima chi regge, poi chi scorre, ultima chi parla».'],
      steps: [
        { ask: 'Quale pietra metti nella prima nicchia?', options: ['Pietra della Voce', 'Pietra delle Mura', 'Pietra del Mare'], ok: 1 },
        { ask: 'E nella seconda?', options: ['Pietra del Mare', 'Pietra della Voce'], ok: 0 }
      ],
      wrong: ['La pietra scivola fuori dalla nicchia e ti torna in mano.'],
      solved: ['L\'ultima pietra entra da sola. Le tre nicchie si accendono, e sotto le mura si apre una scala che scende.', 'Dal fondo arriva un rumore di massi che cadono.']
    },
    trial: { to: 'telepilo', x: 9, y: 13, dir: 'up', again: ['Le tre nicchie brillano. La scala sotto le mura scende nel buio.'] },
    stages: [
      { at: 1, name: 'Il re di pietra', line: 'CHI OSA SVEGLIARE IL RE DI TELEPILO?', moves: ['ruggito', 'passogigante', 'telepilo', 'masso'] },
      { at: 0.6, name: 'Il masso sopra la testa', line: 'LE NAVI DI ULISSE NON SONO ARRIVATE A CASA. NEMMENO TU.', angry: 'SENTO LE MIE PIETRE NELLA TUA BORSA, LADRO.', moves: ['naufragio', 'furia', 'passogigante', 'telepilo'] },
      { at: 0.3, name: 'L\'ira dei Lestrigoni', line: 'BASTA! TREMATE TUTTI, DALLE MURA AL MARE!', angry: 'RIDAMMELE! TREMATE TUTTI, DALLE MURA AL MARE!', moves: ['naufragio', 'furia', 'masso', 'ruggito'], self: ['atkUp'] }
    ],
    angry: { more: 2, way: ['Le nicchie sono vuote, e la pietra intorno è spaccata: qualcuno l\'ha presa a pugni da dentro.', 'Sotto le mura si apre una scala che scende. Dal fondo arriva un ruggito, e le pietre nella tua borsa scottano.'] },
    end: {
      ask: ['NESSUNO MI AVEVA MAI BATTUTO. NEMMENO ULISSE: LUI È SCAPPATO.', 'E ADESSO?'],
      net: { label: 'Lancia un retino', say: ['Il re dei Lestrigoni si lascia chiudere in un retino. Non ci crede nemmeno lui.'], cicero: ['Tremila anni di leggenda, in un retino da pesca. Non lo dirò a Omero.'] },
      pact: { label: 'Facciamo un patto', say: ['UN PATTO. …', 'HO FAME. DA TREMILA ANNI NON MANGIO.', 'PORTAMI TRE TIELLE, E SONO CON TE.'], need: 3,
        wait: ['TRE TIELLE. NON DUE. HO DORMITO TREMILA ANNI, NON SONO SCEMO.'], give: 'Dagli le tre tielle',
        done: ['…', 'QUESTA È LA COSA PIÙ BUONA CHE ABBIA MAI MANGIATO. E HO MANGIATO MARINAI.', 'PATTO FATTO. DOVE VAI TU, VENGO IO.'],
        cicero: ['Il re dei Lestrigoni, conquistato dalla cucina di Gaeta. A Roma non ci crederebbero.'] },
      free: { label: 'Torna a dormire', say: ['NESSUNO MI AVEVA MAI DETTO DI DORMIRE.', '…GRAZIE. TIENI: A ME NON SERVE PIÙ.'], cicero: ['Il re dorme, e Formia con lui. Hai fatto la cosa più difficile: niente.'], gift: 'corona' },
      back: { label: 'Rendigli le pietre', say: ['LE MIE PIETRE.', 'POTEVI TENERLE, E LO SAI. TIENI QUESTA: DA QUI IN POI DORMO IO, E TU NIENTE PIÙ MAGIE.'] }
    }
  },
  giano: {
    id: 'giano', sp: 'giano', after: 'pietra-voce', hour: 'sunset',
    stages: [
      { at: 1, name: 'Il volto d\'oro', line: 'GUARDO IL PASSATO. LO CONOSCO GIÀ, IL TUO.', moves: ['primaluce', 'passato', 'soglia', 'duevolti'], types: ['Crepuscolo', 'Calore'] },
      { at: 0.6, name: 'Il volto d\'argento', line: 'ORA GUARDO IL FUTURO. E TU NON CI SEI.', moves: ['lunargento', 'futuro', 'soglia', 'duevolti'], types: ['Crepuscolo', 'Calma'] },
      { at: 0.3, name: 'La porta aperta', line: 'IL GIORNO E LA NOTTE SONO LA STESSA PORTA.', moves: ['portatempo', 'duevolti', 'lunargento', 'primaluce'], types: ['Crepuscolo', 'Cervello'], self: ['atkUp'] }
    ],
    end: {
      ask: ['SAPEVO CHE SARESTI ARRIVATO FIN QUI. NON SAPEVO COSA AVRESTI FATTO DOPO.'],
      net: { label: 'Lancia un retino', say: ['Giano entra nel retino da solo, e il retino non si chiude: si apre, dall\'altra parte.'], cicero: ['Mi hanno detto che i Romani gli dedicavano il primo mese dell\'anno. Tu gli dedichi un retino.'] },
      free: { label: 'Lascia la porta aperta', say: ['QUESTO LO AVEVO GIÀ VISTO. NON SAPEVO CHE FOSSE COSÌ BELLO.', 'PRENDI. È UNA CHIAVE: NON APRE NIENTE, MA FA ARRIVARE PRIMA.'], cicero: ['Si chiude una porta, se ne apre un\'altra. Lui lo dice da sempre.'], gift: 'chiave' }
    }
  },
  elmo: {
    id: 'elmo', sp: 'fuocelmo', after: 'tr-mamurr-peschiere', hour: 'night',
    stages: [
      { at: 1, name: 'La bonaccia', line: 'FSSSHHH… IL MARE È CALMO. PER ORA.', moves: ['scintille', 'bonaccia', 'vele', 'alberomaestro'] },
      { at: 0.6, name: 'Il temporale', line: 'KRRRAAAK! SI ROMPE IL CIELO!', moves: ['fuocoelmo', 'alberomaestro', 'vele', 'bonaccia'] },
      { at: 0.3, name: 'Il fuoco sugli alberi', line: 'OGNI ONDA PRENDE FUOCO!', moves: ['tempestelmo', 'fuocoelmo', 'alberomaestro', 'scintille'], self: ['atkUp'] }
    ],
    end: {
      ask: ['FSSSHHH…', 'Il fuoco azzurro si abbassa fin quasi a spegnersi. Fuocelmo ti guarda, e la tempesta aspetta.'],
      net: { label: 'Lancia un retino', say: ['Il retino si chiude sul fuoco azzurro, e il cielo sopra il golfo brontola: i marinai dicono che porta tempesta a chi lo vuole tenere.'], cicero: ['Spero che tu sappia nuotare.'] },
      free: { label: 'Lascialo andare', say: ['Fuocelmo sale verso il golfo, e le nuvole si aprono.', 'Sul molo è rimasta una fiammella azzurra: non scotta. I marinai dicono che porta fortuna.'], cicero: ['Porta fortuna a chi lo lascia andare. Sant\'Erasmo sarà contento.'], gift: 'fiammella' }
    }
  }
};
