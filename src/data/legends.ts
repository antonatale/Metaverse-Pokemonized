import type { SpeciesId } from './creatures';
import type { Dir } from './maps/types';
import type { StatFx } from './passives';
import type { TypeName } from './types';

/* The legends of Formia: a legend is an event, not a creature that happens to stand there. Each one is data here, and one
   runner does them all: when it is out, what opens the way to it, the fight in parts. story/maps.ts reads when it is out,
   ui/plot.ts does the way there, battle/stages.ts the fight. Another legend is one more entry, with some art.
   What happens after the fight is not here yet: catching it, freeing it or making a pact is a choice of the story. */

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
      { at: 0.6, name: 'Il masso sopra la testa', line: 'LE NAVI DI ULISSE NON SONO ARRIVATE A CASA. NEMMENO TU.', moves: ['naufragio', 'furia', 'passogigante', 'telepilo'] },
      { at: 0.3, name: 'L\'ira dei Lestrigoni', line: 'BASTA! TREMATE TUTTI, DALLE MURA AL MARE!', moves: ['naufragio', 'furia', 'masso', 'ruggito'], self: ['atkUp'] }
    ]
  },
  giano: {
    id: 'giano', sp: 'giano', after: 'pietra-voce', hour: 'sunset',
    stages: [
      { at: 1, name: 'Il volto d\'oro', line: 'GUARDO IL PASSATO. LO CONOSCO GIÀ, IL TUO.', moves: ['primaluce', 'passato', 'soglia', 'duevolti'], types: ['Crepuscolo', 'Calore'] },
      { at: 0.6, name: 'Il volto d\'argento', line: 'ORA GUARDO IL FUTURO. E TU NON CI SEI.', moves: ['lunargento', 'futuro', 'soglia', 'duevolti'], types: ['Crepuscolo', 'Calma'] },
      { at: 0.3, name: 'La porta aperta', line: 'IL GIORNO E LA NOTTE SONO LA STESSA PORTA.', moves: ['portatempo', 'duevolti', 'lunargento', 'primaluce'], types: ['Crepuscolo', 'Cervello'], self: ['atkUp'] }
    ]
  },
  elmo: {
    id: 'elmo', sp: 'fuocelmo', after: 'tr-mamurr-peschiere', hour: 'night',
    stages: [
      { at: 1, name: 'La bonaccia', line: 'FSSSHHH… IL MARE È CALMO. PER ORA.', moves: ['scintille', 'bonaccia', 'vele', 'alberomaestro'] },
      { at: 0.6, name: 'Il temporale', line: 'KRRRAAAK! SI ROMPE IL CIELO!', moves: ['fuocoelmo', 'alberomaestro', 'vele', 'bonaccia'] },
      { at: 0.3, name: 'Il fuoco sugli alberi', line: 'OGNI ONDA PRENDE FUOCO!', moves: ['tempestelmo', 'fuocoelmo', 'alberomaestro', 'scintille'], self: ['atkUp'] }
    ]
  }
};
