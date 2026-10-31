import type { SpeciesId } from './creatures';

/* People around Formia with creatures of their own. They challenge Antonio with them one after the other: his
   fighter keeps the health it has left from one to the next, and if it goes down he can send in another of his
   team. Beaten the first time, they pay; after that they are always up for a rematch, for the experience.
   They are townspeople already on the map (their npc has `trainer`), from the easy ones near home to the old man
   of Castellone, who keeps the creature of the giants' walls. */
export interface Trainer {
  id: string;
  /** who sends the creatures in, in battle */
  title: string;
  team: { sp: SpeciesId; lv: number }[];
  /** before the challenge, when beaten, when they win, and once beaten */
  intro: string[];
  win: string[];
  lose: string[];
  after: string[];
  /** euro, the first time they are beaten */
  prize: number;
}

export const TRAINERS: Record<string, Trainer> = {
  animatore: {
    id: 'animatore', title: 'L\'animatore dell\'oratorio', prize: 25,
    team: [{ sp: 'olivella', lv: 6 }, { sp: 'cicalina', lv: 7 }],
    intro: ['All\'oratorio alleniamo anche le creature: questa Olivella è nata nell\'uliveto dietro il campo.', 'Facciamo una lotta? Due contro i tuoi.'],
    win: ['Bella lotta! Don Bosco diceva che si impara giocando.', 'Tieni, per la tua squadra.'],
    lose: ['Stavolta abbiamo vinto noi. Torna quando vuoi: l\'oratorio è sempre aperto.'],
    after: ['Le mie creature hanno voglia di rivincita. Ti va?']
  },
  bambino: {
    id: 'bambino', title: 'Il bambino dell\'Eclipse', prize: 15,
    team: [{ sp: 'granchietto', lv: 7 }],
    intro: ['Ho perso il secchiello, però sugli scogli ho trovato un Granchietto!', 'Facciamo una lotta? Se vinco io, mi aiuti a cercare il secchiello.'],
    win: ['Uffa! Il mio Granchietto è stanco.', 'Tieni, sono i soldi del gelato.'],
    lose: ['Ho vinto io! Lo dico a mamma.'],
    after: ['Il mio Granchietto si allena tutti i giorni sugli scogli. Rivincita?']
  },
  studente: {
    id: 'studente', title: 'Lo studente della Vitruvio Pollione', prize: 40,
    team: [{ sp: 'cicalina', lv: 10 }, { sp: 'civettina', lv: 11 }],
    intro: ['Per la tesina ho studiato le creature di Formia: le leggende, i tipi, le mosse.', 'Adesso faccio la prova pratica. Con te.'],
    win: ['Bocciato in pratica… ma la teoria era giusta.', 'Tieni, te li sei meritati.'],
    lose: ['Promosso! La prof ne sarà fiera.'],
    after: ['Ho ripassato tutto. Ricominciamo?']
  },
  guida: {
    id: 'guida', title: 'La guida del museo', prize: 90,
    team: [{ sp: 'riccione', lv: 17 }, { sp: 'granchione', lv: 18 }, { sp: 'civettona', lv: 19 }],
    intro: ['Al museo custodiamo le statue di Formiae; io custodisco anche le creature delle sue leggende.', 'Tre, come le età della storia di Formia: vediamo se le conosci.'],
    win: ['Notevole. Saresti un buon custode anche tu.', 'Prendi: è la ricompensa del museo.'],
    lose: ['La storia non si improvvisa. Torna quando sarai più forte.'],
    after: ['Le mie creature si ricordano di te. Un\'altra lezione?']
  },
  anziano: {
    id: 'anziano', title: 'Il signore di Castellone', prize: 150,
    team: [{ sp: 'ramarrone', lv: 22 }, { sp: 'granchione', lv: 24 }, { sp: 'muraglione', lv: 28 }],
    intro: ['Lo sai chi ha messo le pietre delle mura di Castellone? I giganti, dicono. E io custodisco la loro creatura.', 'Se vuoi vedere il Muraglione, prima devi battere gli altri due.'],
    win: ['Duemila anni di mura… e tu le hai scavalcate.', 'Tieni. E rispetta le pietre di Castellone.'],
    lose: ['Le mura sono ancora in piedi. Ritorna più forte.'],
    after: ['Il Muraglione ti aspetta. Rivincita?']
  }
};
