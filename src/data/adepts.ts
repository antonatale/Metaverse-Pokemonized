import type { Trainer } from './trainers';

/* The adepts of the covi (13 November 2026): the people the echo has gathered round each keeper, who stand between the
   door and him (data/maps/covi.ts). They fight like the trainers of Formia, but their creatures grow with the covo:
   `covo` says which, and the levels of `team` are how far below the keeper's level each one is (story/rival.ts teamOf;
   the forms follow the level, as the keeper's own crew). A covo is fought later or sooner in each story, and its adepts
   always ask the same of the team that comes in. The two who ask the questions of a quiz (data/quizzes.ts) are adepts
   too: a wrong answer, and they fight. */
const A = (id: string, covo: string, title: string, team: Trainer['team'], intro: string[], win: string[], lose: string[], after: string[], prize = 30): Trainer =>
  ({ id, covo, title, team, intro, win, lose, after, prize, smart: 1 });

export const ADEPTS: Record<string, Trainer> = {
  /* Claudia's castle: the night of Mola */
  diavoletto: A('diavoletto', 'morgana', 'Il Diavoletto del castello', [{ sp: 'pipistrillo', lv: 4 }, { sp: 'lucciolina', lv: 3 }],
    ['Il Padre sta ascoltando l\'eco, nel suo castello. Se qualcuno la interrompe adesso, non smette più di parlare.', 'Per questo qui sotto non passa nessuno. Uno alla volta: comincia da me.'], ['Mi hai spento le candele…', 'Vai pure. Uno alla volta.'], ['Torna fuori, che fa freddo qui.'], ['Il Padre ti aspetta di sopra.']),
  'sentinella-nera': A('sentinella-nera', 'morgana', 'La Sentinella nera', [{ sp: 'lumacotta', lv: 3 }, { sp: 'pipistrillo', lv: 2 }],
    ['Questa è l\'ala ovest: c\'è la sedia del Padre. Chi ci si siede senza aver ascoltato rompe il tavolo, e il castello si chiude per sempre.', 'Il Padre me l\'ha affidata. Se la vuoi, prima ascolti me. Con le creature.'], ['Permesso accordato. Siediti.'], ['La sedia resta vuota.'], ['Siediti pure. Poi vai dall\'altra parte.']),
  confessore: A('confessore', 'morgana', 'Il Confessore', [{ sp: 'riccetto', lv: 3 }, { sp: 'lucciolina', lv: 2 }],
    ['L\'ala est è il confessionale del castello: la seconda sedia. Il Padre vuole che chi arriva fin lassù abbia confessato.', 'Confessa: sei qui per lottare. Bene. Assolto dopo.'], ['Assolto. Vai al tuo tavolo.'], ['Penitenza: torna domani.'], ['Uno alla volta, figlio mio.']),
  /* Antonio's dome: the lab */
  assistente: A('assistente', 'palamendola', 'L\'assistente di laboratorio', [{ sp: 'stellina', lv: 4 }, { sp: 'civettina', lv: 3 }],
    ['Ultimo controllo prima del professore. Hai passato il laser: vuol dire che sai ragionare.', 'Ma Antonio mi ha detto: chi arriva fin qui va misurato. Misuriamoci.'], ['Dato anomalo. Lo segno nel paper.'], ['Come previsto dal modello.'], ['I laser si spengono dalle pedane dall\'altra parte del nucleo.']),
  revisore: A('revisore', 'palamendola', 'Il Revisore 2', [{ sp: 'civettina', lv: 3 }, { sp: 'polpino', lv: 2 }],
    ['Antonio sta finendo la simulazione di Formia: se la interrompi, i dati sono da buttare. Io la proteggo. È il mio lavoro: dire di no.', 'Il tuo approccio non è sufficientemente motivato. Major revision. A meno che tu non mi batta.'], ['…accettato con riserva.'], ['Rigettato. Ripresenta tra sei mesi.'], ['Accettato. Non succede quasi mai.']),
  dottoranda: A('dottoranda', 'palamendola', 'La dottoranda', [{ sp: 'stellina', lv: 3 }, { sp: 'falchetto', lv: 2 }],
    ['Il professore mi ha promesso la tesi se nessuno tocca la pedana fino alla fine della simulazione.', 'Tu sei venuto proprio per toccarla, vero? Allora prima il mio esperimento.'], ['Risultato negativo. Pubblicabile lo stesso.'], ['Risultato positivo! Lo dico al professore.'], ['Il professore è di sopra. Si chiama Antonio.']),
  /* the guards of Parco la Fontana and of Antonio's flat, while he is still to be beaten */
  'robot-parco-1': A('robot-parco-1', 'palamendola', 'Il robot di Sim-to-Real', [{ sp: 'civettina', lv: 5 }],
    ['BIP. Il professore ha dato un ordine: nessun intruso nel parco finché la simulazione gira. Se la interrompi, Formia si resetta.', 'BIP. In simulazione ti avevo già battuto.'], ['ERRORE. La realtà non corrisponde alla simulazione.'], ['BIP BIP. Simulazione confermata.'], ['BIP. Passaggio consentito.'], 20),
  'robot-parco-2': A('robot-parco-2', 'palamendola', 'Il drone di sorveglianza', [{ sp: 'falchetto', lv: 4 }, { sp: 'stellina', lv: 4 }],
    ['Bzzz. Zona sorvegliata: la cupola sta calcolando. Il professore dice che manca poco al risultato.', 'Bzzz. Chi passa di qui lo fa da sconfitto, o non lo fa.'], ['Bzzz… batteria scarica.'], ['Bzzz. Torna da dove sei venuto.'], ['Bzzz. La cupola è oltre le siepi.'], 25),
  'robot-casa': A('robot-casa', 'palamendola', 'L\'aspirapolvere senziente', [{ sp: 'lumacotta', lv: 5 }],
    ['VRRRR. La porta sul retro dà sul parco del professore. Ordine numero uno: nessuno ci passa mentre la simulazione gira.', 'VRRRR. Ordine numero due: pulire il pavimento dagli intrusi.'], ['VRRR… mi ritiro alla base di ricarica.'], ['VRRRR. Pavimento pulito, intruso fuori.'], ['VRRRR. Pulisco intorno a te.'], 15),
  /* Andrea's tower: the numbers */
  croupier: A('croupier', 'padel', 'Il Croupier', [{ sp: 'micetto', lv: 4 }, { sp: 'stellina', lv: 3 }],
    ['Andrea mi ha promesso l\'uno per cento di Formia se tengo chiusa questa porta. L\'uno per cento di Formia è tanto.', 'Risposta sbagliata, dunque. Il banco vince sempre: vediamo.'], ['Il banco… ha perso. Prego, si sale.'], ['Il banco vince. Riprova, se vuoi.'], ['Prego, si sale.']),
  bayesiana: A('bayesiana', 'padel', 'La Bayesiana', [{ sp: 'civettina', lv: 3 }, { sp: 'stellina', lv: 2 }],
    ['Andrea ha calcolato che se qualcuno sale, la torre crolla. Io non ci credo, ma aggiorno le mie idee solo con le prove.', 'Risposta sbagliata. Dammi una prova migliore: lotta.'], ['Stima aggiornata: sei forte.'], ['La mia stima era giusta.'], ['Prego, il piano di sopra.']),
  statistico: A('statistico', 'padel', 'Lo statistico in tirocinio', [{ sp: 'civettina', lv: 3 }, { sp: 'micetto', lv: 2 }],
    ['Andrea è il mio relatore. Mi ha detto: chi sale va campionato. Tu sei il mio campione.', 'Il 100% di quelli che passano di qui lotta con me.'], ['Il campione era troppo piccolo.'], ['Significativo!'], ['p < 0,05: sei forte.']),
  giocatore: A('giocatore', 'padel', 'Il giocatore d\'azzardo', [{ sp: 'granchietto', lv: 3 }, { sp: 'micetto', lv: 3 }],
    ['Ho scommesso con Andrea che nessuno arriva alla seconda porta. Se arrivi, perdo tutto.', 'Quindi non ci arrivi. Tutto sul rosso: cioè, su questa lotta.'], ['Ho perso. Come sempre. Statisticamente.'], ['Ho vinto! La prima volta in vita mia.'], ['La prossima volta punto su di te.']),
  /* Forchetta's courts */
  raccattapalle: A('raccattapalle', 'circolo', 'Il raccattapalle', [{ sp: 'ramarrino', lv: 4 }, { sp: 'riccetto', lv: 3 }],
    ['Forchetta palleggia da dodici ore. Se sbaglia una palla, dicono, l\'eco lo lascia andare. Ma lui non sbaglia mai, e noi raccattiamo.', 'Nessuno disturba il campo: è la regola del circolo. Prima giochi con me.'], ['Palla fuori. La mia.'], ['Quindici a zero.'], ['Occhio alla terra rossa: dove è più scura, scivola.'], 20),
  maestro: A('maestro', 'circolo', 'Il maestro del circolo', [{ sp: 'lumacotta', lv: 3 }, { sp: 'ramarrino', lv: 2 }],
    ['Forchetta è il mio allievo migliore. Questo palleggio è la partita della sua vita: non lo interrompe nessuno.', 'La terra rossa stanotte è diventata ghiaccio. Ma prima: lezione pratica.'], ['Lezione imparata. Da me.'], ['Lezione numero due: riprovare.'], ['Su per la terra asciutta: a sinistra, poi dritto.']),
  giudice: A('giudice', 'circolo', 'Il giudice di sedia', [{ sp: 'riccetto', lv: 3 }, { sp: 'lumacotta', lv: 2 }],
    ['Il match è ancora in corso: finché non finisce, il campo è chiuso. Lo dice il regolamento.', 'Si entra in campo solo battendo l\'arbitro. Silenzio, prego.'], ['Gioco, partita… e incontro a te.'], ['Fallo di piede. Riprova.'], ['Forchetta è dall\'altra parte della rete.']),
  /* Valentin's tower: the Carpathians */
  pastore: A('pastore', 'eclipse', 'Il pastore dei Carpazi', [{ sp: 'cinghialetto', lv: 4 }, { sp: 'pipistrillo', lv: 3 }],
    ['Valentin balla con le Iele nella nebbia. Se smette prima dell\'alba, le Iele si arrabbiano con tutta Formia: io faccio la guardia.', 'Vengo dai Carpazi, la nebbia è casa mia. Per passare, batti il mio cinghiale.'], ['Bravo. Le Iele ti lasceranno passare, forse.'], ['Torna giù in pianura, ragazzo.'], ['Le Iele ballano a file: aspetta che passino e sali con loro.']),
  iela: A('iela', 'eclipse', 'La danzatrice della hora', [{ sp: 'granchietto', lv: 3 }, { sp: 'gabbi', lv: 2 }],
    ['Hora! La danza di Valentin non si interrompe: un cerchio rotto porta sfortuna a tutti.', 'Se vuoi entrare nel cerchio, prima balli con me.'], ['Hai il ritmo. Weee!'], ['Fuori tempo!'], ['Weee! Balla con Valentin, adesso.']),
  vrajitoare: A('vrajitoare', 'eclipse', 'La vrăjitoare', [{ sp: 'pipistrillo', lv: 3 }, { sp: 'cinghialetto', lv: 2 }],
    ['Le foglie del tè dicono: chi interrompe la festa di Valentin porta via la fortuna della torre. Io la proteggo.', 'Vediamo se sei tu, quello delle foglie.'], ['Nelle foglie non c\'era scritto che avresti vinto.'], ['Te l\'avevano detto, le foglie.'], ['Il tuo futuro è di sopra.']),
  /* Costanzo's palace */
  'presidente-seggio': A('presidente-seggio', 'piazza', 'Il Presidente di seggio', [{ sp: 'micetto', lv: 4 }, { sp: 'cicalina', lv: 3 }],
    ['Bocciato all\'esame. La Repubblica di piazza della Vittoria entra in seduta: chi la interrompe la fa decadere.', 'Il regolamento dice: chi non passa l\'esame, lotta. Si vota con le creature.'], ['Il seggio si arrende. Puoi passare.'], ['Respinto. Ripassa l\'educazione civica.'], ['Il seggio è aperto.']),
  costituzionalista: A('costituzionalista', 'piazza', 'La Costituzionalista', [{ sp: 'cicalina', lv: 3 }, { sp: 'micetto', lv: 2 }],
    ['Risposta incostituzionale. Costanzo mi ha nominata garante: nessuno sale al balcone durante il comizio.', 'Ricorso respinto in anticipo. A meno che tu non vinca.'], ['Ricorso accolto. Al balcone.'], ['Ricorso respinto.'], ['Il balcone è di sopra.']),
  usciere: A('usciere', 'piazza', 'L\'usciere', [{ sp: 'micetto', lv: 3 }, { sp: 'cicalina', lv: 3 }],
    ['Silenzio in aula! La seduta è aperta, e il presidente Costanzo sta parlando da dodici ore.', 'Senza il mio permesso non si passa. Il permesso si guadagna: lotta.'], ['L\'aula è tua.'], ['Fuori dall\'aula!'], ['Prego, si accomodi.']),
  portaborse: A('portaborse', 'piazza', 'Il portaborse', [{ sp: 'cicalina', lv: 3 }, { sp: 'micetto', lv: 2 }],
    ['Porto le borse del presidente da dodici ore. Se il comizio si interrompe, perdo il posto.', 'Quindi non si interrompe. Mi sgranchisco con te.'], ['Mi rimetto a portare borse.'], ['Ecco, ora va meglio.'], ['Lui di sopra non ha ancora finito di parlare.']),
  segretaria: A('segretaria', 'piazza', 'La segretaria del comizio', [{ sp: 'micetto', lv: 3 }, { sp: 'olivella', lv: 2 }],
    ['Il comizio è all\'ordine del giorno, punto uno, due e tre. Un intruso non è previsto.', 'Punto quattro: tu. Lotta.'], ['Punto tre: approvato.'], ['Rinviato al prossimo comizio.'], ['Ordine del giorno esaurito.']),
  /* Zendavid's temple */
  'dj-pineta': A('dj-pineta', 'pineta', 'Il DJ della pineta', [{ sp: 'cicalina', lv: 4 }, { sp: 'olivella', lv: 3 }],
    ['Risposta sbagliata. Zendavid ha detto: in consolle sale solo chi conosce Ye. Gli altri, battle.', 'Come le battle di rap, ma con le creature.'], ['Hai il flow. Sali.'], ['Drop! Riprova.'], ['La consolle è di sopra.']),
  fonico: A('fonico', 'pineta', 'Il fonico', [{ sp: 'cicalina', lv: 3 }, { sp: 'ginestrella', lv: 2 }],
    ['Il volume è a 11 e non si tocca: Zendavid ha detto che se scende gli viene l\'ansia, e il tempio crolla.', 'Facciamo un soundcheck. Con le creature.'], ['Feedback! Hai vinto tu.'], ['Suono perfetto.'], ['Il volume è a 11. Non toccarlo.']),
  ballerino: A('ballerino', 'pineta', 'Il ballerino', [{ sp: 'olivella', lv: 3 }, { sp: 'ginestrella', lv: 3 }],
    ['Finché balliamo, il tempio sta in piedi. Se la musica si ferma, crolla tutto. Per questo nessuno entra a spegnerla.', 'Sulla pista si balla. O si lotta.'], ['Hai più ritmo di me.'], ['Fuori tempo!'], ['Ok. Respira. Balla.']),
  fan: A('fan', 'pineta', 'La fan in prima fila', [{ sp: 'ginestrella', lv: 3 }, { sp: 'olivella', lv: 2 }],
    ['Sono qui da ieri sera, in prima fila. Lui suona solo per noi: tu sei venuto a spegnerlo.', 'Non ci penso nemmeno. Prima devi battermi.'], ['Ti cedo la prima fila. Per stasera.'], ['Prima fila confermata.'], ['Bau, dice sempre lui. Bau.'])
};
