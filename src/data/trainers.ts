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
  /** their creatures, at a level, with the moves they know when not the ones of that level */
  team: { sp: SpeciesId; lv: number; moves?: string[] }[];
  /** before the challenge, when beaten, when they win, and once beaten */
  intro: string[];
  win: string[];
  lose: string[];
  after: string[];
  /** sesterzi, the first time they are beaten */
  prize: number;
  /** Antonio's rival, Tullio, at his first, second or third meeting with him: his team is not here but follows
      Antonio's choice and the story (story/rival.ts); in his lines {rival} is his creature, {mine} Antonio's, {why}
      why his has the better of Antonio's */
  rival?: 1 | 2 | 3;
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
  /* the plot (story/plot.ts): Mamurra's men, who look for the stones of Telepilo, and Mamurra himself */
  'mamurr-scavi': {
    id: 'mamurr-scavi', title: 'L\'uomo con la pala', prize: 30,
    team: [{ sp: 'riccetto', lv: 6 }, { sp: 'granchietto', lv: 7 }],
    intro: ['Il capo ci paga per cercare le Pietre di Telepilo, nella sua vecchia villa. E tu qui non ci devi stare.', 'Vuoi lottare? Queste le ho prese tra gli scogli, qui sotto.'],
    win: ['Va bene, va bene! Me ne vado.', 'Ma il capo non è uno che si arrende. È qui da duemila anni.'],
    lose: ['Te l\'avevo detto. Torna a casa, ragazzino.'],
    after: ['Ancora tu?']
  },
  'mamurr-cisterna': {
    id: 'mamurr-cisterna', title: 'L\'uomo con la torcia', prize: 45,
    team: [{ sp: 'cicalina', lv: 10 }, { sp: 'olivella', lv: 11 }],
    intro: ['La Pietra delle Mura è qui sotto, nel Cisternone: settemila metri cubi d\'acqua e una pietra.', 'Il capo la vuole entro stasera. Togliti di mezzo.'],
    win: ['Quella porta non si apre! Ci ho provato tutta la notte.', 'Dice la vecchia del teatro che ci vuole una parola. Io la parola non la so.'],
    lose: ['Stanotte la porta la sfondo.'],
    after: ['Ancora tu?']
  },
  'mamurr-peschiere': {
    id: 'mamurr-peschiere', title: 'Il sub con la muta', prize: 60,
    team: [{ sp: 'riccetto', lv: 13 }, { sp: 'granchietto', lv: 14 }],
    intro: ['Questa l\'ho tirata su da una peschiera romana: è fredda come il mare d\'inverno, e brilla.', 'La Pietra del Mare. Il capo me la pagherà oro. Prova a prenderla.'],
    win: ['Tienila, tienila! Mi scotta le mani.', 'Il capo dice che la terza la tiene un morto. Uno che parlava tanto.'],
    lose: ['Il mare è mio, ragazzino.'],
    after: ['Ancora tu?']
  },
  mamurra: {
    id: 'mamurra', title: 'Il fantasma di Mamurra', prize: 200,
    team: [{ sp: 'granchione', lv: 21 }, { sp: 'olivastro', lv: 19 }, { sp: 'civettona', lv: 23 }],
    intro: ['Lucio Mamurra, cavaliere di Formia, prefetto del genio di Gaio Giulio Cesare. Questa era la mia villa.', 'Catullo mi chiamava «lo scialacquatore di Formia», e Orazio chiamava Formia «la città dei Mamurra». Avevano ragione: Formia era mia.',
      'Con le tre pietre sveglierò Lamo, e i giganti costruiranno per me: ville, moli, cemento fino al mare.', 'Dammi le pietre. O devo prenderle con le mie creature?'],
    win: ['Impossibile… battuto da un ragazzo con la felpa.', 'Le pietre restano a Formia. Ma ogni volta che passerai davanti alle rovine della mia villa, ricordati di me.'],
    lose: ['Le pietre saranno mie. Torna quando avrai il coraggio.'],
    after: ['…']
  },
  /* the rival: Tullio, the guardaparco's grandson. He picks his creature after Antonio, the one that beats his, and
     meets him three times: at the park, on the Appia, and after Mamurra, for the title of the strongest in Formia */
  'rivale-1': {
    id: 'rivale-1', title: 'Tullio, il nipote del guardaparco', prize: 30, rival: 1, team: [],
    intro: ['Ehi, aspetta! Sono Tullio, il nipote del guardaparco. Il nonno mi ha fatto scegliere dopo di te.', 'Ho preso {rival}. {why}', 'Le nostre creature sono appena nate: vediamo subito chi è più forte!'],
    win: ['Cosa?! Avevo scelto quella giusta, eppure…', 'Va bene, stavolta hai vinto tu. Ma mi alleno, e la prossima volta ti batto!'],
    lose: ['Visto? Il nonno aveva ragione. Allena il tuo {mine} e riprova quando vuoi: io sto qui.'],
    after: ['Rivincita? Il mio {rival} non vede l\'ora.']
  },
  'rivale-2': {
    id: 'rivale-2', title: 'Tullio, il nipote del guardaparco', prize: 80, rival: 2, team: [],
    intro: ['Antonio! Ti ho visto passare: ho girato tutta Formia per allenarmi, dalla pineta al porto.', 'Guarda il mio {rival}: è cambiato! E ho preso anche un\'altra creatura. Rivincita?'],
    win: ['Di nuovo! Ma come fai?', 'Il nonno dice che le creature crescono con chi gli vuole bene. Forse ha ragione lui.', 'Va\' pure da Cicerone. Ma non è finita, eh!'],
    lose: ['Stavolta tocca a me! Le tue creature sono stanche: falle riposare e torna.'],
    after: ['Rivincita? Stavolta vinco io.']
  },
  'rivale-3': {
    id: 'rivale-3', title: 'Tullio, il nipote del guardaparco', prize: 250, rival: 3, team: [],
    intro: ['Antonio. Hai battuto il fantasma di Mamurra: il nonno non parla d\'altro.', 'Però adesso il più forte di Formia chi è? Tu o io?', 'Il mio {rival} ha preso la sua forma più grande. Con tutto quello che abbiamo: niente scuse!'],
    win: ['…Sei tu il più forte di Formia.', 'Il nonno aveva visto giusto, il giorno che ti ha dato {mine}. Grazie per le lotte, Antonio.', 'Quando vuoi la rivincita, sono qui al parco.'],
    lose: ['Il più forte di Formia sono io! Per adesso. Torna quando vuoi.'],
    after: ['Rivincita? Vediamo chi è il più forte di Formia, oggi.']
  },
  anziano: {
    id: 'anziano', title: 'Il signore di Castellone', prize: 150,
    team: [{ sp: 'ramarrone', lv: 22 }, { sp: 'granchione', lv: 24 }, { sp: 'muraglione', lv: 28 }],
    intro: ['Lo sai chi ha messo le pietre delle mura di Castellone? I giganti, dicono. E io custodisco la loro creatura.', 'Se vuoi vedere il Dracastello, prima devi battere gli altri due.'],
    win: ['Duemila anni di mura… e tu le hai scavalcate.', 'Tieni. E rispetta le pietre di Castellone.'],
    lose: ['Le mura sono ancora in piedi. Ritorna più forte.'],
    after: ['Il Dracastello ti aspetta. Rivincita?']
  }
};
