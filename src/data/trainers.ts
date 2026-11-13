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
  team: { sp: SpeciesId; lv: number; moves?: string[]; resonate?: boolean }[];
  /** before the challenge, when beaten, when they win, and once beaten */
  intro: string[];
  win: string[];
  lose: string[];
  after: string[];
  /** sesterzi, the first time they are beaten */
  prize: number;
  /** how well they play their team: 0 or nothing, in the order of the team and never changing; 1 they send in the best
      against the one in front, and may change once; 2 twice */
  smart?: number;
  /** what changes when the player has made a friend or an enemy of him (story/choices.ts): other words, another prize, a gift */
  moods?: Partial<Record<'ally' | 'bitter', Partial<Pick<Trainer, 'intro' | 'win' | 'lose' | 'after' | 'prize' | 'gift'>>>>;
  /** what he gives the first time he is beaten, and what he says giving it */
  gift?: { items: Record<string, number>; say: string };
  /** a magic of his own that shields his side until the right blows have cracked it (battle/surge.ts) */
  shield?: { left: number; name: string };
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
    id: 'studente', title: 'Lo studente della Vitruvio Pollione', prize: 40, smart: 1,
    team: [{ sp: 'cicalina', lv: 10 }, { sp: 'civettina', lv: 11 }],
    intro: ['Per la tesina ho studiato le creature di Formia: le leggende, i tipi, le mosse.', 'Adesso faccio la prova pratica. Con te.'],
    win: ['Bocciato in pratica… ma la teoria era giusta.', 'Tieni, te li sei meritati.'],
    lose: ['Promosso! La prof ne sarà fiera.'],
    after: ['Ho ripassato tutto. Ricominciamo?']
  },
  guida: {
    id: 'guida', title: 'La guida del museo', prize: 90, smart: 1,
    team: [{ sp: 'riccione', lv: 17 }, { sp: 'granchione', lv: 18 }, { sp: 'civettona', lv: 19 }],
    intro: ['Al museo custodiamo le statue di Formiae; io custodisco anche le creature delle sue leggende.', 'Tre, come le età della storia di Formia: vediamo se le conosci.'],
    win: ['Notevole. Saresti un buon custode anche tu.', 'Prendi: è la ricompensa del museo.'],
    lose: ['La storia non si improvvisa. Torna quando sarai più forte.'],
    after: ['Le mie creature si ricordano di te. Un\'altra lezione?']
  },
  /* the three trails of the relief (VISIONE.md, V3): two on each, from the promontory of Gianola, where the story
     begins, to the Appia of the Acervara and up the Aurunci, at the levels of the creatures that live there */
  bagnante: {
    id: 'bagnante', title: 'La bagnante di Gianola', prize: 15,
    team: [{ sp: 'riccetto', lv: 4 }],
    intro: ['Torno adesso dagli scogli: guarda che cosa mi è venuto dietro!', 'Tu ce l\'hai una creatura? Facciamo una lotta, una sola.'],
    win: ['Brava la tua! Il mio Riccetto ci è rimasto male.', 'Tieni: sono i soldi del ghiacciolo.'],
    lose: ['Ha vinto il Riccetto! Non ci credo nemmeno io.'],
    after: ['Il Riccetto vuole la rivincita. Io pure.']
  },
  archeologa: {
    id: 'archeologa', title: 'L\'archeologa di Gianola', prize: 30,
    team: [{ sp: 'lumacotta', lv: 5 }, { sp: 'ginestrella', lv: 6 }],
    intro: ['Sto rilevando le terrazze della villa: erano tre, una sotto l\'altra, fino al mare.', 'Le creature della macchia mi fanno compagnia mentre misuro. Le vuoi conoscere?'],
    win: ['Brave, le tue. Lo segno sul taccuino, accanto alle misure.', 'Tieni: è il rimborso della trasferta.'],
    lose: ['Le mie conoscono ogni pietra di questo posto. Torna quando vuoi.'],
    after: ['Ancora qui? Allora un\'altra lotta, tra una misura e l\'altra.']
  },
  polparo: {
    id: 'polparo', title: 'Il pescatore di polpi', prize: 35,
    team: [{ sp: 'riccetto', lv: 7 }, { sp: 'stellina', lv: 7 }],
    intro: ['Sotto la punta, tra gli scogli, ci sono le tane dei polpi. E non solo quelle.', 'Queste due le ho trovate stamattina. Vediamo se le tue sanno nuotare.'],
    win: ['Va bene, hai vinto: oggi il polpo lo offro io.', 'Tieni, sono i soldi del pescato.'],
    lose: ['Il mare insegna la pazienza. Riprova con calma.'],
    after: ['Il mare è piatto e i polpi dormono. Facciamo un\'altra lotta?']
  },
  ciclista: {
    id: 'ciclista', title: 'La ciclista dell\'Appia', prize: 45,
    team: [{ sp: 'cicalina', lv: 9 }, { sp: 'olivella', lv: 10 }],
    intro: ['Da Formia a Itri l\'Appia sale, e io la faccio tutte le mattine.', 'Le mie creature mi vengono dietro in salita. Le tue ce la fanno?'],
    win: ['Mi hai staccata. Succede di rado.', 'Tieni: ci pago il caffè in cima.'],
    lose: ['In salita non si improvvisa. Allenati e torna.'],
    after: ['Sto recuperando il fiato. Un\'altra lotta mentre riparto?']
  },
  contadino: {
    id: 'contadino', title: 'Il contadino dell\'Acervara', prize: 50, smart: 1,
    team: [{ sp: 'olivella', lv: 10 }, { sp: 'ginestrella', lv: 11 }],
    intro: ['Queste terrazze le tengono su le macere, i muretti a secco: pietra su pietra, senza calce.', 'E tra gli ulivi ci vivono loro due. Vuoi vedere come lavorano?'],
    win: ['Hai le mani buone, ragazzo. Con le creature come con la terra.', 'Tieni, per il disturbo.'],
    lose: ['La terra non regala niente. Ritorna dopo la raccolta.'],
    after: ['Ho finito di potare. Una lotta, prima che faccia buio?']
  },
  pastore: {
    id: 'pastore', title: 'Il pastore degli Aurunci', prize: 70, smart: 1,
    team: [{ sp: 'cinghialetto', lv: 13 }, { sp: 'ginestrella', lv: 13 }, { sp: 'falchetto', lv: 14 }],
    intro: ['Quassù si sale da sempre con le bestie. E da sempre ci sono anche le altre, quelle dei giganti.', 'Le mie tengono lontani i cinghiali dal gregge. Vediamo se tengono lontano anche te.'],
    win: ['Piano, piano. Hai vinto.', 'Prendi: è il prezzo di una forma di cacio.'],
    lose: ['La montagna va presa con rispetto. Torna più forte.'],
    after: ['Il gregge è al pascolo e io ho tempo. Rivincita?']
  },
  escursionista: {
    id: 'escursionista', title: 'L\'escursionista del Redentore', prize: 80, smart: 1,
    team: [{ sp: 'civettina', lv: 14 }, { sp: 'falchetto', lv: 15 }, { sp: 'cinghialetto', lv: 15 }],
    intro: ['Vengo dalla cima: lassù il vento porta via il cappello.', 'Mi hanno seguito in tre per tutto il sentiero. Li alleniamo un po\'?'],
    win: ['Che gambe! E che squadra.', 'Tieni: con questi ti compri l\'acqua per la salita.'],
    lose: ['In montagna vince chi ha più fiato. Riposa e riprova.'],
    after: ['Riparto tra poco. Un\'ultima lotta prima della discesa?']
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
    id: 'mamurr-cisterna', title: 'L\'uomo con la torcia', prize: 45, smart: 1,
    team: [{ sp: 'cicalina', lv: 10 }, { sp: 'olivella', lv: 11 }],
    intro: ['La Pietra delle Mura è qui sotto, nel Cisternone: settemila metri cubi d\'acqua e una pietra.', 'Il capo la vuole entro stasera. Togliti di mezzo.'],
    win: ['Quella porta non si apre! Ci ho provato tutta la notte.', 'Dice la vecchia del teatro che ci vuole una parola. Io la parola non la so.'],
    lose: ['Stanotte la porta la sfondo.'],
    after: ['Ancora tu?']
  },
  'mamurr-peschiere': {
    id: 'mamurr-peschiere', title: 'Il sub con la muta', prize: 60, smart: 1,
    team: [{ sp: 'riccetto', lv: 13 }, { sp: 'granchietto', lv: 14 }],
    intro: ['Questa l\'ho tirata su da una peschiera romana: è fredda come il mare d\'inverno, e brilla.', 'La Pietra del Mare. Il capo me la pagherà oro. Prova a prenderla.'],
    win: ['Tienila, tienila! Mi scotta le mani.', 'Il capo dice che la terza la tiene un morto. Uno che parlava tanto.'],
    lose: ['Il mare è mio, ragazzino.'],
    after: ['Ancora tu?']
  },
  mamurra: {
    shield: { left: 3, name: 'Ricchezza' },
    id: 'mamurra', title: 'Il fantasma di Mamurra', prize: 200, smart: 2,
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
    id: 'rivale-1', title: 'Tullio, il nipote della guardaparco', prize: 30, rival: 1, team: [],
    intro: ['Ehi, aspetta! Sono Tullio, il nipote della guardaparco. La nonna mi ha fatto scegliere dopo di te.', 'Ho preso {rival}. {why}', 'Le nostre creature sono appena nate: vediamo subito chi è più forte!'],
    win: ['Cosa?! Avevo scelto quella giusta, eppure…', 'Va bene, stavolta hai vinto tu. Ma mi alleno, e la prossima volta ti batto!'],
    lose: ['Visto? La nonna aveva ragione. Allena il tuo {mine} e riprova quando vuoi: io sto qui.'],
    after: ['Rivincita? Il mio {rival} non vede l\'ora.']
  },
  'rivale-2': {
    id: 'rivale-2', title: 'Tullio, il nipote della guardaparco', prize: 80, smart: 1, rival: 2, team: [],
    intro: ['{hero}! Ti ho visto passare: ho girato tutta Formia per allenarmi, dalla pineta al porto.', 'Guarda il mio {rival}: è cambiato! E ho preso anche un\'altra creatura. Rivincita?'],
    win: ['Di nuovo! Ma come fai?', 'La nonna dice che le creature crescono con chi gli vuole bene. Forse ha ragione lei.', 'Va\' pure da Cicerone. Ma non è finita, eh!'],
    lose: ['Stavolta tocca a me! Le tue creature sono stanche: falle riposare e torna.'],
    after: ['Rivincita? Stavolta vinco io.']
  },
  'rivale-3': {
    id: 'rivale-3', title: 'Tullio, il nipote della guardaparco', prize: 250, smart: 2, rival: 3, team: [],
    intro: ['{hero}. Hai battuto il fantasma di Mamurra: la nonna non parla d\'altro.', 'Però adesso il più forte di Formia chi è? Tu o io?', 'Il mio {rival} ha preso la sua forma più grande. Con tutto quello che abbiamo: niente scuse!'],
    win: ['…Sei tu il più forte di Formia.', 'La nonna aveva visto giusto, il giorno che ti ha dato {mine}. Grazie per le lotte, {hero}.', 'Quando vuoi la rivincita, sono qui al parco.'],
    lose: ['Il più forte di Formia sono io! Per adesso. Torna quando vuoi.'],
    after: ['Rivincita? Vediamo chi è il più forte di Formia, oggi.'],
    moods: {
      ally: {
        intro: ['{hero}! Hai visto come si è crepata la Ricchezza? Un pezzo è merito mio, eh.', 'Però adesso, tra noi due, il più forte di Formia chi è? La nonna guarda, e io non ti regalo niente.'],
        win: ['…Sei tu il più forte di Formia. E mi va bene così.', 'Quando vuoi allenarti, sai dove trovarmi.'],
        lose: ['Ho vinto io! Te l\'avevo detto che mi allenavo. Torna quando vuoi, amico.'],
        after: ['Ci alleniamo? Stavolta ti batto, e te lo dico prima.'],
        gift: { items: { oro: 2 }, say: 'Tieni: i retini d\'oro della nonna. Li userai meglio di me.' }
      },
      bitter: {
        intro: ['Hai salvato Formia, eh? Bravo. La nonna non parla d\'altro.', 'Lo sai chi ha detto a Mamurra come lotti? E lo sai cosa ho imparato io, nel frattempo?', 'Adesso ridi, se ci riesci.'],
        win: ['…', 'La nonna ha sempre saputo scegliere. A me non ha scelto.', 'Vattene, {hero}. Qui sto bene da solo.'],
        lose: ['Tutto qui?', 'Te lo ricordi? L\'hai detto tu.'],
        after: ['Che vuoi ancora?'],
        prize: 500
      }
    }
  },
  /* out at sea, for whoever gets that far (swimming with a sea creature, or on Nicola's board) */
  sup: {
    id: 'sup', title: 'La ragazza col SUP', prize: 70, smart: 1,
    team: [{ sp: 'cefalino', lv: 14 }, { sp: 'medusella', lv: 15 }, { sp: 'delfi', lv: 16 }],
    intro: ['Ehi! Fin qui a nuoto? Rispetto.', 'Io vengo al largo col SUP ogni mattina, prima che si alzi il vento. I miei amici del mare vengono con me.', 'Lotta sull\'acqua: chi cade, paga il cornetto.'],
    win: ['In acqua sei più forte che a terra, eh.', 'Il cornetto te lo offro al bar dell\'Eclipse.'],
    lose: ['Splash! Torna quando hai preso confidenza col mare.'],
    after: ['Guarda laggiù: quando l\'acqua fa così, sotto passano i Delfì.']
  },
  sub: {
    id: 'sub', title: 'Il sub delle secche', prize: 90, smart: 1,
    team: [{ sp: 'murenaccia', lv: 17 }, { sp: 'riccione', lv: 18 }, { sp: 'astromarina', lv: 19 }],
    intro: ['Shhh. Sotto di noi ci sono le secche: venti metri d\'acqua, posidonia e anfore rotte.', 'Ci vengo a vedere le murene. Ma una mi ha seguito su, e adesso lotta con me.', 'Pronto? Trattieni il fiato.'],
    win: ['Bolle… Hai il fiato lungo, tu.', 'La boa gialla segna le secche: lì sotto vive il più grosso dei Delfaro, dicono.'],
    lose: ['Riemergi, riposati, e riprova.'],
    after: ['Sotto la boa delle secche passano i Delfaro, di sera. Io li ho visti due volte.']
  },
  pescatoreLargo: {
    id: 'pescatoreLargo', title: 'Il pescatore del gozzo', prize: 120, smart: 2,
    team: [{ sp: 'granchione', lv: 20 }, { sp: 'cefaldrago', lv: 22 }, { sp: 'delfaro', lv: 23 }],
    intro: ['Uè, guagliò! Tu nuoti fin quaggiù e io col gozzo ci metto mezz\'ora.', 'Sessant\'anni che pesco nel golfo, da Mola a Gianola. Le creature del mare mi conoscono tutte.', 'Facciamo così: se vinci tu, ti do il pesce di oggi. Se vinco io, mi tiri su le reti.'],
    win: ['Mannaggia! Sessant\'anni di mare e un ragazzino mi batte.', 'Tieni, il pesce di oggi lo vendi al porto. E salutami il golfo.'],
    lose: ['Le reti stanno là. Ah, ah!'],
    after: ['Di sera, dal gozzo, si vede Formia tutta accesa: dal porto a Gianola. Non ti stanchi mai di guardarla.']
  },
  /* the missions of the friends (data/missions.ts): they are not on the map as trainers, the one who asks is */
  tennista: {
    id: 'tennista', title: 'Il tennista del circolo', prize: 40, smart: 1,
    team: [{ sp: 'cinghialetto', lv: 13 }, { sp: 'falchetto', lv: 14 }, { sp: 'ginestrella', lv: 15 }],
    intro: [], win: ['Set e partita. Poteva andare peggio, dicono.'], lose: ['Chi perde paga il campo. Torna quando vuoi.'], after: []
  },
  guastafeste: {
    id: 'guastafeste', title: 'Il guastafeste delle dieci', prize: 40, smart: 1,
    team: [{ sp: 'medusella', lv: 13 }, { sp: 'lumacotta', lv: 14 }, { sp: 'civettina', lv: 15 }],
    intro: [], win: ['Va bene, va bene. Un\'ultima canzone. E poi basta.'], lose: ['Alle dieci si dorme! Torna domani.'], after: []
  },
  anziano: {
    id: 'anziano', title: 'Il signore di Castellone', prize: 150, smart: 2,
    team: [{ sp: 'ramarrone', lv: 22 }, { sp: 'granchione', lv: 24 }, { sp: 'muraglione', lv: 28 }],
    intro: ['Lo sai chi ha messo le pietre delle mura di Castellone? I giganti, dicono. E io custodisco la loro creatura.', 'Se vuoi vedere il Dracastello, prima devi battere gli altri due.'],
    win: ['Duemila anni di mura… e tu le hai scavalcate.', 'Tieni. E rispetta le pietre di Castellone.'],
    lose: ['Le mura sono ancora in piedi. Ritorna più forte.'],
    after: ['Il Dracastello ti aspetta. Rivincita?']
  }
};
