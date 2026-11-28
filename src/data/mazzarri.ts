import type { FriendId } from './characters';

/* La Scala Mazzarri (27 November 2026, Antonio: «quando uno di noi perde, la scusa per ognuno … e compare una scala …
   chiamata la scala mazzarri, che si usa per dare un rating a quanto è sulla scala mazzarri, ovvero quanto la scusa è
   assurda … più si avvicina ai rating che hai dato tu a quelle frasi più soldi si prendono … fai che non capitino le
   stesse frasi spesso … questa è una fissazione di Costanzo»). The name is the one of the Italian meme about a coach's
   excuses after a defeat; the game only names the scale, it puts no words in his mouth and does not draw him.
   Whoever of the seven loses says an excuse; the player puts it on a rung, from 1 (an honest excuse) to 10 (Mazzarri
   puro); Costanzo, who keeps the scale, says his rung, the one written here (`r`). The closer, the more the cassa of
   the caminetto pays (story/mazzarri.ts). The excuses are built on what the game already says of each one (their
   moves, lines, covi, missions), nothing made up about the real people. */

/** when an excuse can be said: it has to be true of this battle (an honest one about levels only when they were) */
export type When =
  /** at night, at sea, in his own covo, against a wild creature */
  | 'night' | 'sea' | 'own' | 'wild'
  /** a long battle (20 turns or more), a short one (6 or fewer) */
  | 'long' | 'short'
  /** the winner was nearly down (a quarter of his health or less), or hardly touched (more than four fifths left) */
  | 'close' | 'rout'
  /** the winner was 3 or more levels above, or 2 or more below */
  | 'lvUp' | 'lvDown'
  /** the battle was somewhere with a name ({inplace}: «a Scauri», «al Palazzo del Popolo», «sul lungomare…») */
  | 'place';
/** `text`: {foe} who won, {gap} the levels between them, {turns} how long it took, {inplace} where */
export interface Excuse { id: string; text: string; r: number; when?: When }

export const EXCUSES: Record<FriendId, Excuse[]> = {
  antonio: [
    { id: 'an1', r: 6, text: 'In simulazione vincevo io. È il passaggio al mondo reale che ancora non funziona.' },
    { id: 'an2', r: 6, text: 'L\'IA mi aveva suggerito un\'idea fortissima. Era per un\'altra lotta.' },
    { id: 'an3', r: 5, text: 'Non trovavo più il caricabatterie. Senza, a metà lotta ero al 3%.' },
    { id: 'an4', r: 7, text: 'Ho la testa già a Torino. Qui a Formia il clima mi rallenta i riflessi.' },
    { id: 'an5', r: 9, text: 'Ho fatto la diagnosi energetica della lotta: le inefficienze erano tutte dalla tua parte. Quindi, tecnicamente, hai perso tu.' },
    { id: 'an6', r: 5, text: 'Tra un turno e l\'altro leggevo il paper di questa settimana. Mi hai preso in un momento di studio.' },
    { id: 'an7', r: 7, text: 'Non ho perso: ho raccolto dati per la prossima versione.' },
    { id: 'an8', r: 3, text: 'Mi servono più basi di controlli. Lo dico da mesi.' },
    { id: 'an9', r: 8, text: 'È il fuso orario di Chicago. Con la testa sono già in America, e lì sono le tre di notte.' },
    { id: 'an10', r: 6, text: 'È caduto il robot. Non io: il robot.' },
    { id: 'an11', r: 8, text: 'Il mio modello era addestrato sui tuoi dati di ieri. Oggi eri un\'altra persona.' },
    { id: 'an12', r: 1, text: 'Crazy shit… no, niente scuse. Hai giocato meglio tu.' },
    { id: 'an13', r: 6, text: 'Tenevo da parte i Certificati Bianchi per la prossima lotta. Strategia di lungo periodo.' },
    { id: 'an14', r: 9, text: 'Era una lotta fuori distribuzione. Nessun modello al mondo l\'avrebbe vinta.' },
    { id: 'an15', r: 10, text: 'Ho perso apposta: mi serviva un caso di fallimento per il paper. Ti metto nei ringraziamenti.' },
    { id: 'an16', r: 6, when: 'night', text: 'Di notte il Visore non vede niente. E io senza Visore sono uno qualsiasi.' },
    { id: 'an17', r: 6, when: 'sea', text: 'Il robot non è impermeabile. L\'ho progettato per Torino, mica per il mare.' },
    { id: 'an18', r: 1, when: 'lvUp', text: 'Avevi {gap} livelli più di me. È matematica, non è una scusa.' },
    { id: 'an19', r: 9, when: 'lvDown', text: 'Con {gap} livelli in meno mi hai fatto abbassare la guardia. Strategia sleale.' },
    { id: 'an20', r: 7, when: 'long', text: '{turns} turni. Ho finito il credito dell\'IA a metà lotta.' },
    { id: 'an21', r: 7, when: 'place', text: 'Qui {inplace} il segnale prende male: il mio prompt arrivava in ritardo.' },
    { id: 'an22', r: 7, when: 'wild', text: '{foe} non era nel dataset. Nessuno poteva prevederlo.' }
  ],
  costanzo: [
    { id: 'co1', r: 8, text: 'Il popolo era con me. Era la giuria a essere comprata.' },
    { id: 'co2', r: 6, text: 'Non mi hai fatto finire il comizio. Antidemocratico.' },
    { id: 'co3', r: 7, text: 'Avevo gli occhiali sbagliati. Con quelli di destra vincevo.' },
    { id: 'co4', r: 8, text: 'Questa lotta non la riconosco. Chiedo il riconteggio.' },
    { id: 'co5', r: 5, text: 'Mi mancava la curva. Senza il coro, io non rendo.' },
    { id: 'co6', r: 3, text: 'Ho cambiato attacco e ho perso il filo. È la fissa, lo so. GIÀ LO SAI.' },
    { id: 'co7', r: 9, text: 'È colpa di Claudia. Non so ancora come, ma è colpa sua.' },
    { id: 'co8', r: 6, text: 'Ho perso la lotta, non la battaglia delle idee.' },
    { id: 'co9', r: 8, text: 'Pensavo al bidet. Una questione più grande di noi due.' },
    { id: 'co10', r: 7, text: 'Da lontano si sentiva un coro della Lazio. Mi ha tolto la concentrazione.' },
    { id: 'co11', r: 7, text: 'Ai punti ho vinto io. Ai punti del mio programma.' },
    { id: 'co12', r: 8, text: 'Mi appello al popolo. Il popolo dice che ho vinto io.' },
    { id: 'co13', r: 4, text: 'Hai vinto, va bene. Ma alle prossime elezioni ne riparliamo.' },
    { id: 'co14', r: 9, text: 'Non ho perso: ho concesso. È diverso, chiedi a un costituzionalista.' },
    { id: 'co15', r: 10, text: 'Ho perso apposta. Chi vince oggi perde il consenso domani. È strategia politica, GIÀ LO SAI.' },
    { id: 'co16', r: 8, when: 'own', text: 'Nel mio palazzo c\'è troppa eco: le mie parole tornavano indietro e mi colpivano.' },
    { id: 'co17', r: 1, when: 'lvUp', text: 'Avevi {gap} livelli più di me. Lo dico per correttezza istituzionale.' },
    { id: 'co18', r: 7, when: 'long', text: '{turns} turni e nessuno mi ha dato la parola per un comizio. Così non si può.' },
    { id: 'co19', r: 6, when: 'rout', text: 'Una sconfitta così netta è un messaggio. Lo devo ancora decifrare.' },
    { id: 'co20', r: 5, when: 'night', text: 'Di notte la piazza dorme. E io senza la piazza…' },
    { id: 'co21', r: 6, when: 'place', text: 'Qui {inplace} non ho pubblico. Fuori dalla mia piazza non vale.' },
    { id: 'co22', r: 8, when: 'wild', text: '{foe} non vota. Con chi non vota non si discute.' }
  ],
  andrea: [
    { id: 'and1', r: 4, text: 'Avevo il 94% di probabilità di vincere. Questo era il 6%. Capita.' },
    { id: 'and2', r: 3, text: 'Sono cucinato. Ieri palestra e padel, oggi questa.' },
    { id: 'and3', r: 5, text: 'Ho calcolato tutto. Tranne te.' },
    { id: 'and4', r: 7, text: 'Una lotta sola non è statisticamente significativa. Ne facciamo altre novantanove?' },
    { id: 'and5', r: 9, text: 'Il mio modello prevedeva la tua mossa. Sei tu che hai sbagliato a farne un\'altra.' },
    { id: 'and6', r: 6, text: 'Ho spiccato il volo per primo. Peccato che tu fossi già atterrato.' },
    { id: 'and7', r: 8, text: 'Errore di arrotondamento.' },
    { id: 'and8', r: 9, text: 'Il dado della Torre delle Probabilità era truccato. L\'avevo truccato io, ma per un\'altra lotta.' },
    { id: 'and9', r: 4, text: 'Mi è salita la stanchezza del padel. Il braccio non rispondeva.' },
    { id: 'and10', r: 7, text: 'Hai giocato in modo irrazionale. Contro l\'irrazionalità la statistica non può niente.' },
    { id: 'and11', r: 9, text: 'Avevo il sole negli occhi. Sì, anche al chiuso: riflesso.' },
    { id: 'and12', r: 1, text: 'Hai giocato meglio tu. Lo dicono i numeri, e io ai numeri credo.' },
    { id: 'and13', r: 6, text: 'Non ho perso: ho raccolto dati. La prossima volta, regressione lineare.' },
    { id: 'and14', r: 10, text: 'Statisticamente, in un universo parallelo su due ho vinto io. Io vivo in quello.' },
    { id: 'and15', r: 1, when: 'lvUp', text: '{gap} livelli di differenza: il risultato era atteso. Solo varianza, nessuna scusa.' },
    { id: 'and16', r: 8, when: 'lvDown', text: 'Con {gap} livelli in meno non dovevi vincere. Il problema è nei dati, non in me.' },
    { id: 'and17', r: 7, when: 'short', text: '{turns} turni: troppo pochi perché la mia strategia convergesse.' },
    { id: 'and18', r: 3, when: 'long', text: '{turns} turni. Sono cucinato. Cucinatissimo.' },
    { id: 'and19', r: 5, when: 'own', text: 'Nella mia torre le probabilità le decido io. Oggi ho deciso male.' },
    { id: 'and20', r: 6, when: 'place', text: 'Qui {inplace} non avevo uno storico. Io lotto meglio con uno storico.' },
    { id: 'and21', r: 7, when: 'wild', text: 'La probabilità di trovare {foe} proprio lì era bassissima. Ho perso contro la sfortuna, non contro {foe}.' }
  ],
  valentin: [
    { id: 'va1', r: 7, text: 'Weee… con la testa ero ancora a Copenhagen. Il volo di ritorno era in ritardo.' },
    { id: 'va2', r: 6, text: 'Avevo gli occhiali verdi: vedevo tutto rilassato, anche le tue mosse.' },
    { id: 'va3', r: 8, text: 'Non ho perso: ti ho fatto vincere io. Manipolazione a fin di bene.' },
    { id: 'va4', r: 6, text: 'La musica era troppo bassa. Senza festa io non lotto.' },
    { id: 'va5', r: 3, text: 'A metà mossa ho cambiato idea. Animale anomalo: lo sapevi.' },
    { id: 'va6', r: 5, text: 'Stavo organizzando la festa per dopo. Sei invitato, comunque.' },
    { id: 'va7', r: 6, text: 'Questa non conta: non c\'era nessuno a guardare.' },
    { id: 'va8', r: 7, text: 'Mi è scivolato il mărțișor dal polso. Senza, la fortuna se ne va.' },
    { id: 'va9', r: 9, text: 'C\'era nebbia. Sì, anche qui. Me la porto dietro dalla Torre Verde.' },
    { id: 'va10', r: 7, text: 'Ti voglio troppo bene. Non riuscivo a colpirti forte.' },
    { id: 'va11', r: 8, text: 'Weee! Ho perso? Non me n\'ero accorto, ero in pista.' },
    { id: 'va12', r: 6, text: 'Il DJ ha messo un lento proprio nel momento decisivo.' },
    { id: 'va13', r: 2, text: 'Hai vinto tu. Stasera però offri tu.' },
    { id: 'va14', r: 10, text: 'In Danimarca questa lotta l\'avrei vinta io. Valgono le regole danesi.' },
    { id: 'va15', r: 6, when: 'night', text: 'Di notte io sono alla festa, non a lottare. Mi hai preso in orario di lavoro.' },
    { id: 'va16', r: 6, when: 'sea', text: 'In acqua non si balla. Ho perso il ritmo alla prima onda.' },
    { id: 'va17', r: 4, when: 'own', text: 'Nella mia torre c\'era troppa nebbia. E la nebbia l\'ho messa io: autogol.' },
    { id: 'va18', r: 7, when: 'long', text: '{turns} turni senza una pausa per ballare. Disumano.' },
    { id: 'va19', r: 1, when: 'lvUp', text: 'Avevi {gap} livelli più di me. Weee, ci sta.' },
    { id: 'va20', r: 6, when: 'place', text: 'Qui {inplace} non c\'era una festa nel raggio di un chilometro. Come pretendi?' },
    { id: 'va21', r: 6, when: 'wild', text: '{foe} non era invitato. Si è imbucato e ha pure vinto.' }
  ],
  forchetta: [
    { id: 'fo1', r: 1, text: 'Poteva andare peggio.' },
    { id: 'fo2', r: 6, text: 'Oggi la terra rossa era troppo veloce.' },
    { id: 'fo3', r: 3, text: 'Ho sbagliato la prima di servizio. Poi anche la seconda. Doppio fallo.' },
    { id: 'fo4', r: 7, text: 'Avevo in mano il pennello, non la racchetta. Ho dipinto la lotta invece di farla.' },
    { id: 'fo5', r: 7, text: 'La protesi era su misura. Su misura di un altro.' },
    { id: 'fo6', r: 5, text: 'Agisco sempre per ultimo. Stavolta sono arrivato dopo la fine.' },
    { id: 'fo7', r: 9, text: 'Il vento girava. Sul campo coperto.' },
    { id: 'fo8', r: 8, text: 'Ti avevo spiegato la mia strategia con un messaggio. Non l\'hai capito, quindi non vale.' },
    { id: 'fo9', r: 6, text: 'Ho perso a Formia, ma per Formia. È una vittoria morale.' },
    { id: 'fo10', r: 5, text: 'Le corde della racchetta erano da cambiare. Le cambio a ogni lotta, tranne a questa.' },
    { id: 'fo11', r: 6, text: 'Il quadro però è venuto meglio della lotta. Guardiamo il quadro.' },
    { id: 'fo12', r: 7, text: '…' },
    { id: 'fo13', r: 10, text: 'Ho perso la lotta, ma ho vinto il terzo set. Quale terzo set? Appunto: non l\'abbiamo giocato, quindi vinco io.' },
    { id: 'fo14', r: 4, when: 'own', text: 'A casa mia le palle rimbalzano strane. Le ho comprate io. Male.' },
    { id: 'fo15', r: 6, when: 'close', text: 'Era fuori di un millimetro. Poteva andare peggio: potevo crederci.' },
    { id: 'fo16', r: 2, when: 'lvUp', text: 'Avevi {gap} livelli più di me. Poteva andare peggio: potevi averne di più.' },
    { id: 'fo17', r: 2, when: 'rout', text: 'Poteva andare peggio. …No, in effetti no.' },
    { id: 'fo18', r: 7, when: 'sea', text: 'In mare la palla galleggia. Questo non è tennis.' },
    { id: 'fo19', r: 7, when: 'place', text: 'Qui {inplace}… mi pare che il campo pendesse.' },
    { id: 'fo20', r: 4, when: 'wild', text: 'Contro {foe} poteva andare peggio. Potevo trovarne due.' }
  ],
  zendavid: [
    { id: 'ze1', r: 3, text: 'Ansia. Avevo l\'ansia. Bau.' },
    { id: 'ze2', r: 6, text: 'Non avevo le cuffie. Senza cuffie sento tutto, anche le tue mosse.' },
    { id: 'ze3', r: 6, text: 'La mia battuta era fortissima. È il pubblico che non l\'ha capita.' },
    { id: 'ze4', r: 6, text: 'Il basso era troppo alto: non sentivo il mio ritmo.' },
    { id: 'ze5', r: 4, text: 'Bau.' },
    { id: 'ze6', r: 7, text: 'Mi si è fermata la playlist a metà lotta. Senza Stronger non sono io.' },
    { id: 'ze7', r: 6, text: 'Ero in modalità zen. Troppo zen: mi sono dimenticato di attaccare.' },
    { id: 'ze8', r: 8, text: 'Ho abbaiato, e tu non ti sei spaventato. Non è colpa mia se non hai paura dei cani.' },
    { id: 'ze9', r: 7, text: 'Proprio in quel momento passava il treno dietro casa. Non sentivo niente.' },
    { id: 'ze10', r: 8, text: 'Hai vinto perché non hai riso alla mia battuta. Che logica è?' },
    { id: 'ze11', r: 8, text: 'Kanye non avrebbe perso. Ma Kanye non era disponibile.' },
    { id: 'ze12', r: 7, text: 'Non ho perso. Ho fatto una pausa creativa.' },
    { id: 'ze13', r: 4, text: 'Hai vinto tu. Ma la colonna sonora era mia.' },
    { id: 'ze14', r: 10, text: 'Il beat era in sette ottavi e io lotto solo in quattro quarti. E il beat l\'avevi scelto tu.' },
    { id: 'ze15', r: 5, when: 'night', text: 'Di notte da Morgana c\'è la serata. La mia testa era lì.' },
    { id: 'ze16', r: 3, when: 'own', text: 'Nel mio tempio il basso era troppo forte. L\'ho alzato io. Errore mio.' },
    { id: 'ze17', r: 1, when: 'lvUp', text: '{gap} livelli più di me. Ansia giustificata, bau.' },
    { id: 'ze18', r: 8, when: 'short', text: '{turns} turni? Le cuffie non si erano neanche scaldate.' },
    { id: 'ze19', r: 6, when: 'long', text: '{turns} turni. La playlist è finita prima della lotta.' },
    { id: 'ze20', r: 6, when: 'place', text: 'Qui {inplace} il telefono non prende: niente Stronger.' },
    { id: 'ze21', r: 7, when: 'wild', text: '{foe} non ha riso alla battuta. Gli animali non hanno il senso dell\'umorismo.' }
  ],
  claudia: [
    { id: 'cl1', r: 7, text: 'Ho capito il tuo punto. Ma il mio era migliore, quindi tecnicamente…' },
    { id: 'cl2', r: 6, text: 'Il Figlio e lo Spirito non sono arrivati. La Trinità da sola non funziona.' },
    { id: 'cl3', r: 4, text: 'Ho ascoltato troppo. Mentre ascoltavo, tu attaccavi.' },
    { id: 'cl4', r: 7, text: 'È colpa di Costanzo. Me l\'ha tirata.' },
    { id: 'cl5', r: 3, text: 'Sotto un terzo dei PS perdo la pazienza. È scritto, non è una scusa.' },
    { id: 'cl6', r: 5, text: 'Tavoli separati. Da adesso, anche le lotte.' },
    { id: 'cl7', r: 8, text: 'Non ho perso: ho preso la cattiva strada apposta, per vedere dove portava.' },
    { id: 'cl8', r: 6, text: 'Mi si è spenta la lanterna. Al buio non si lotta.' },
    { id: 'cl9', r: 7, text: 'Puoi sentire anche il mio? No? Ecco perché ho perso: nessuno ascolta.' },
    { id: 'cl10', r: 8, text: 'La lotta era impostata male dall\'inizio. Rifacciamola, col regolamento scritto da me.' },
    { id: 'cl11', r: 2, text: 'Va bene, hai vinto. Ne parliamo con calma, punto per punto.' },
    { id: 'cl12', r: 6, text: 'Ero diabolica, ma solo un po\'. Per vincere devo esserlo tutta.' },
    { id: 'cl13', r: 10, text: 'È stata l\'eco di Telepilo: mi ha fatto perdere nel passato, e adesso ho perso solo per coerenza.' },
    { id: 'cl14', r: 9, when: 'own', text: 'Nel mio castello le regole le scrivo io. Oggi le ho scritte per te, per gentilezza.' },
    { id: 'cl15', r: 1, when: 'lvUp', text: 'Avevi {gap} livelli più di me. Ho capito il tuo punto: era un punto di forza.' },
    { id: 'cl16', r: 7, when: 'night', text: 'Di notte la lanterna fa luce solo davanti. Tu attaccavi di lato.' },
    { id: 'cl17', r: 3, when: 'close', text: 'Mancava pochissimo. L\'hai visto anche tu: pochissimo.' },
    { id: 'cl18', r: 5, when: 'place', text: 'Qui {inplace} non si discute, si urla. E io senza discutere…' },
    { id: 'cl19', r: 6, when: 'wild', text: 'Con {foe} ho cercato il dialogo. {foe} non dialoga.' }
  ]
};

/** the rungs, from the bottom: what each one means (shown beside it) */
export const RUNGS = ['Scusa onesta', 'Ci può stare', 'Mah', 'Tirata', 'Arrampicata', 'Sui vetri', 'Sugli specchi', 'Fantascienza', 'Leggenda', 'Mazzarri puro'];
export const SCALA = 'Scala Mazzarri';
/** what the cassa of the caminetto pays: on the rung, one off, two off; and on top of it for a 10 voted 10 */
export const SCALA_PAY = { exact: 30, one: 15, two: 5, puro: 20 };
/** an excuse of the one being played pays half: the cassa does not pay you for losing */
export const OWN_SHARE = 0.5;

/** who keeps the scale: Costanzo; when Costanzo is the one being played, Claudia gives the rung instead */
export interface JudgeLines { intro: string[]; self?: string; exact: string[]; one: string[]; under: string[]; over: string[]; puro: string; skip: string }
export const JUDGE: Record<'costanzo' | 'claudia', JudgeLines> = {
  costanzo: {
    intro: ['Fermi tutti. Questa scusa va messa sulla Scala Mazzarri.', 'Da uno a dieci: uno è una scusa onesta, dieci è Mazzarri puro, arrampicata sugli specchi.',
      'Tu scegli il gradino, io ho il mio. Più ci vai vicino, più ti paga la cassa del caminetto.'],
    self: 'Questa la devo giudicare io? Sono di parte… ma il regolamento è il regolamento.',
    exact: ['GIÀ LO SAI: è un {r}. Preciso.', 'Un {r} pieno. Sei dei nostri.', 'Voto perfetto. Ti nomino commissario della Scala.', 'Esatto. Daje.'],
    one: ['Quasi: per me è un {r}. Ci sei andato vicino.', 'Un {r}, non un {v}. Ma la direzione è giusta.', 'Mezzo gradino di differenza. Per me è {r}.'],
    under: ['Troppo buono! Questa è da {r}: si arrampicava sugli specchi.', '{v}? Ma l\'hai sentita? Per me è {r}.', 'Gli hai creduto? Io no: {r}.'],
    over: ['Esagerato! È solo un {r}: questa era quasi onesta.', 'Calma: {v} è roba da leggenda. Questa vale {r}.', 'Non è così grave. Un {r}, al massimo.'],
    puro: 'MAZZARRI PURO! Dieci! Si alza in piedi tutta la piazza.',
    skip: 'Non voti? Va bene. Il popolo si astiene, ma il popolo ricorda.'
  },
  claudia: {
    intro: ['Costanzo, la tua Scala Mazzarri. Stavolta il gradino ufficiale lo do io.', 'Uno è una scusa onesta, dieci è Mazzarri puro. Tu voti, io ti dico il mio. Punto per punto.'],
    exact: ['Ho capito il tuo punto: è un {r}. Una volta tanto siamo d\'accordo.', 'Un {r}. Hai ragione, e mi costa dirlo.'],
    one: ['Per me è un {r}. Quasi.', 'Un {r}, non un {v}. Ma ti ascolto.'],
    under: ['{v}? Sei troppo buono. È un {r}.', 'Così la giustifichi. Per me è {r}.'],
    over: ['{v}? Esagerato. Vale {r}.', 'Questa era quasi onesta: {r}.'],
    puro: 'Dieci. Persino io sono senza parole.',
    skip: 'Non voti? Prendo nota.'
  }
};

/** what Costanzo thinks of the one who votes, after a few votes: by the average distance from his rung */
export const TITLES: { upTo: number; name: string; text: string }[] = [
  { upTo: 0.75, name: 'Commissario della Scala', text: 'Costanzo ti lascerebbe la Scala. Quasi.' },
  { upTo: 1.25, name: 'Moviolista', text: 'Rivedi ogni scusa al rallentatore, e quasi sempre ci prendi.' },
  { upTo: 2, name: 'Opinionista da bar', text: 'Ne capisci, ma ogni tanto ti fai convincere.' },
  { upTo: Infinity, name: 'Tifoso di parte', text: 'Credi a tutti, o a nessuno. Costanzo è preoccupato.' }
];
/** votes before Costanzo gives a title */
export const TITLE_AFTER = 4;

/* «Stai inguaiatoooo» (27 November 2026, Antonio): Valentin's line from his freestyle, when he beats someone */
export const INGUAIATO = 'Stai inguaiatoooo!';
