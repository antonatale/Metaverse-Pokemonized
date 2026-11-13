import type { FriendId } from './characters';

/* Where the covi are, and why one goes there (13 November 2026, Antonio: «ognuno di noi deve avere un covo vero e
   proprio, e ci deve essere un motivo per sfidarci»).

   The night the creatures woke up, the echo of the stones of Telepilo ran through Formia and looked for keepers: it
   found the seven friends of «il caminetto». The homes of six of them turned into covi, each shaped by what its keeper
   has in his head (a black castle, a tower of dice, a temple of sound…), and the keepers stayed inside, not quite
   themselves. The one who is played is the seventh: the echo left him free, because someone has to bring the seals
   back together. Each pin is a seal: beating a keeper frees him (his covo goes quiet, seen from the street too) and
   the railway, closed since that night by a boulder of the Laestrygonians, opens again once all the seals are back.

   Each covo has: the building on the map of Formia (its place in formia-places.ts, drawn by render/canvas/covo.ts with
   its aura), the map inside it (data/maps/covi.ts), the home it still is when its keeper is the one played, someone in
   town who sends the player there and why (the invitation: until then the door does not open), and a gift its keeper
   gives besides the pin, something the player can use from then on (story/gifts.ts). */

export interface CovoHook {
  /** who it is, on which map: the person who says what has happened and sends the player there */
  npc: string; map: string;
  /** the stop of the tour (story/goals.ts) */
  text: string; where: string; tip: string;
  /** what they say the first time; the invitation is given at the end */
  say: string[];
  /** what they say afterwards, until the covo is beaten, and once it is */
  wait: string[];
  after: string[];
}
export interface CovoGift { id: string; name: string; text: string; say: string }
export interface CovoPlace {
  covo: string;
  leader: FriendId;
  /** the building on the map of Formia (formia-places.ts) and the map inside */
  building: string;
  map: string;
  /** the home the door leads to when the keeper is the one played, and the kind it is drawn as then */
  home?: string;
  base?: string;
  /** the colour of its aura, and of its seal */
  aura: string;
  /** what it is called now, on the plaque over its door */
  title: string;
  /** at the door, before the invitation; and once its keeper is free */
  sealed: string[];
  quiet: string[];
  hook: CovoHook;
  gift: CovoGift;
}

export const COVO_PLACES: Record<string, CovoPlace> = {
  /* Antonio: in Parco la Fontana, beside the fountain; the park is entered only through his flat */
  palamendola: {
    covo: 'palamendola', leader: 'antonio', building: 'covo-antonio', map: 'covo-antonio', aura: '#b98cff',
    title: 'LA CUPOLA', base: 'observatory',
    sealed: ['Una cupola di vetro e acciaio, accanto alla fontana. Ronza come una sala server.', 'Sulla porta, un display: «ACCESSO NEGATO. Simulazione in corso».'],
    quiet: ['La cupola è spenta. Dentro, un portatile che si carica e un paper aperto a pagina tre.'],
    hook: { npc: 'vicina', map: 'formia', text: 'La vicina di Antonio', where: 'Via Amendola, Parco la Fontana',
      tip: 'La vicina di Antonio, in via Amendola, ha visto qualcosa di strano nel parco stanotte.',
      say: ['Meno male che sei passato. Stanotte la fontana del parco si è accesa di viola, e accanto è spuntata una cupola di vetro.',
        'Antonio si è chiuso lì dentro. Al citofono dice solo «sto facendo girare una simulazione». Da ieri sera!',
        'Il parco è chiuso, lo sai: si entra solo da casa sua, dalla porta sul retro. Mi aveva lasciato le chiavi per le piante.',
        'Tieni, le chiavi di casa di Antonio. Vai a riportarlo nel mondo reale. Ma attento: ha messo i robot di guardia.'],
      wait: ['Le chiavi le hai tu. La porta sul retro dà sul parco: la cupola è accanto alla fontana.'],
      after: ['Antonio è uscito dalla cupola! Ha detto «grazie» e «stato dell\'arte». Credo sia un complimento.'] },
    gift: { id: 'visore', name: 'Il Visore di Antonio', text: 'Nella pianta di Formia (menu, Mappa) si vedono le tane delle creature selvatiche e le cose perse.',
      say: 'E tieni il mio Visore: l\'ho tarato su Formia. Nella pianta della città ti fa vedere dove si nascondono le creature, e le cose che uno perde. Lo so io, quante cose si perdono.' }
  },
  /* Andrea: his home in Castellone, by piazza Pasquale Mattei, now a tower of dice */
  padel: {
    covo: 'padel', leader: 'andrea', building: 'casa-andrea', map: 'covo-andrea', home: 'casa-andrea', base: 'borgo', aura: '#4fd1a5',
    title: 'TORRE DELLE PROBABILITÀ',
    sealed: ['Una torre fatta di dadi giganti, uno sopra l\'altro. Dalle finestre escono numeri che si spengono nell\'aria.', 'Sulla porta: «Ingresso consentito con probabilità 0. Riprovare con un invito».'],
    quiet: ['La torre è tornata una casa di Castellone. Sul davanzale, un dado solo. Fa sempre sei.'],
    hook: { npc: 'fornaia', map: 'formia', text: 'Le tielle bruciate di Castellone', where: 'Il forno di Castellone',
      tip: 'Al forno di Castellone succede una cosa strana con le tielle. La fornaia è disperata.',
      say: ['Da stamattina una tiella su tre mi esce bruciata. Una su tre, precisa. Quarant\'anni che faccio tielle, mai successo.',
        'Il ragazzo di piazza Mattei, Andrea: casa sua stanotte è diventata una torre di dadi. Dice che il mio forno «è dentro la sua distribuzione».',
        'Io la distribuzione non so cos\'è, ma la tiella sì. Vai su e fallo smettere: questo è l\'invito, gliel\'ho scritto io sul retro di uno scontrino.',
        'Attento però: alla porta ci sono quelli dei numeri. Fanno domande. E chi sbaglia… lo calcolano.'],
      wait: ['La torre di Andrea è dietro piazza Mattei. Una tiella su tre, figlio mio. Una su tre!'],
      after: ['Le tielle escono buone tutte! Andrea è passato a scusarsi: ne ha comprate tre. Una l\'ha bruciata lui, per statistica.'] },
    gift: { id: 'quaderno', name: 'Il Quaderno delle probabilità', text: 'Quando salta fuori una creatura selvatica, sai quanto è probabile incontrarla lì.',
      say: 'Prendi il mio quaderno. Ci sono tutte le creature di Formia, posto per posto, con la loro probabilità. Quando ne incontri una, sai quanto sei stato fortunato. Al 94%.' }
  },
  /* Forchetta: the covered courts of the Zauli, now a temple of red clay */
  circolo: {
    covo: 'circolo', leader: 'forchetta', building: 'tennis', map: 'circolo', base: 'circolo', aura: '#5fb8ff',
    title: 'TEMPIO DELLA TERRA ROSSA',
    sealed: ['I tennis coperti sono diventati una cupola a spicchi, come una pallina gigante. Dentro, il rumore di un palleggio che non finisce mai.', 'La porta è chiusa. Un cartello: «Si entra solo su invito del circolo».'],
    quiet: ['La cupola è ferma. Dentro, i raccattapalle giocano a carte.'],
    hook: { npc: 'tennista', map: 'formia', text: 'Il palleggio infinito', where: 'Davanti ai tennis coperti del Zauli',
      tip: 'Davanti ai tennis coperti del Zauli c\'è una tennista che non riesce più a entrare in campo.',
      say: ['Stanotte i coperti sono diventati una cupola che brilla. Dentro Forchetta palleggia da solo da dodici ore. Non sbaglia mai. Mai!',
        'I raccattapalle sono rimasti chiusi dentro, e io sabato ho il torneo.',
        'Questo è il mio tesserino del circolo: con questo la porta si apre. Entra e fallo smettere.',
        'Un consiglio: là dentro la terra rossa scivola come il ghiaccio. Guarda dove metti i piedi.'],
      wait: ['Col mio tesserino la porta si apre. Occhio alla terra rossa: scivola.'],
      after: ['Il campo è libero! Forchetta mi ha pure lasciato il servizio. Poteva andare peggio.'] },
    gift: { id: 'fischio', name: 'Il fischio di Forchetta', text: 'Dal menu (Mappa) si richiama il Liberty: arriva dove sei, se lì può stare.',
      say: 'E impara il fischio. Quello di Mola, con due dita. Lo fai, e il Liberty ti raggiunge da solo: a Formia i motorini lo conoscono. Poteva andare peggio, no?' }
  },
  /* Valentin: his home in via Ferrucci, opposite the hospital, now a green tower of the Carpathians */
  eclipse: {
    covo: 'eclipse', leader: 'valentin', building: 'casa-valentin', map: 'covo-valentin', home: 'casa-valentin', base: 'house', aura: '#59e07a',
    title: 'TURNUL VERDE',
    sealed: ['Una torre di legno scuro, il tetto a punta altissimo come le chiese del Maramureș, i muri dipinti di verde come i monasteri della Bucovina.', 'Dalle fessure esce una nebbia verde. La porta non si apre: «Doar cu invitație». Solo con invito.'],
    quiet: ['La nebbia è sparita. La torre verde è tornata la casa di Valentin; dalla finestra, musica e una risata: «Weee!»'],
    hook: { npc: 'infermiere', map: 'formia', text: 'La nebbia verde di via Ferrucci', where: 'Davanti all\'ospedale Dono Svizzero',
      tip: 'Davanti all\'ospedale Dono Svizzero, un infermiere guarda preoccupato la casa di fronte.',
      say: ['Lo vedi? La casa di fronte all\'ospedale. Stanotte è diventata una torre di legno verde, con il tetto a punta. Da lì esce una nebbia verde.',
        'Un paziente romeno dice che sono le Iele, le fate dei Carpazi: ballano nella nebbia, e chi ci entra gira in tondo finché non è l\'alba.',
        'Ci abita quel ragazzo, Valentin. Ogni ora grida «Weee!» dalla finestra. I pazienti non dormono.',
        'Prendi questo: è un nastrino bianco e rosso che mi ha dato il paziente. Dice che è l\'unico invito che la torre accetta.'],
      wait: ['Nella nebbia segui la luce delle candele: dove ci sono, le Iele non ballano. Così dice il paziente.'],
      after: ['La nebbia è sparita! I pazienti dormono. Valentin ha portato le paste a tutto il reparto. Weee, dice l\'infermiera capo.'] },
    gift: { id: 'martisor', name: 'Il Mărțișor di Valentin', text: 'Dal menu (Mappa) lo indossi o lo togli: con il cordino bianco e rosso al polso le creature selvatiche ti lasciano in pace.',
      say: 'Weee! Tieni il mio mărțișor: il cordino bianco e rosso che in Romania si regala a marzo. Al polso porta fortuna e tiene lontano quello che non vuoi. Le creature selvatiche, per esempio. Lo metti e lo togli quando vuoi.' }
  },
  /* Claudia: her home in via Palazzo, San Giulio, now a black castle; the invitation is at her table at Morgana */
  morgana: {
    covo: 'morgana', leader: 'claudia', building: 'casa-claudia', map: 'covo-claudia', home: 'casa-claudia', base: 'condo', aura: '#ff3d3d',
    title: 'IL CASTELLO DEL PADRE',
    sealed: ['Un castello nero, alto e storto, con le torri a punta e le finestre rosse. Sul portone un battacchio a forma di corna.', 'Inciso nel legno: «Uno alla volta. Si entra con l\'invito del tavolo: chiedere a Morgana».'],
    quiet: ['Il castello è spento: le finestre sono tornate finestre. Sul portone, un biglietto: «Ho ascoltato. Torno da Morgana».'],
    hook: { npc: 'oste', map: 'morgana', text: 'L\'invito del Padre', where: 'Birreria Morgana, a Mola',
      tip: 'Claudia ha lasciato l\'invito per il suo castello al bancone di Morgana, a Mola: si vince al quiz su Formia.',
      say: ['Claudia ieri sera non è venuta al suo tavolo. In tre anni non l\'ha mai saltata una sera.',
        'Dicono che a San Giulio, in via Palazzo, casa sua sia diventata un castello nero alto fino alle nuvole. E di notte suonano le campane.',
        'Stamattina è arrivato un biglietto, scritto con l\'inchiostro rosso: «L\'invito al tavolo del Padre va a chi vince il quiz di Morgana. Uno alla volta».',
        'Tipico di lei. Allora: giochi al quiz? Se vinci, l\'invito è tuo.'],
      wait: ['L\'invito è tuo: il castello di Claudia è in via Palazzo, di fronte alla scuola Mattej. Uno alla volta, mi raccomando.'],
      after: ['Claudia è tornata al suo tavolo! Ha detto che stasera ascolta tutti. Uno alla volta.'] },
    gift: { id: 'lanterna', name: 'La Lanterna del Padre', text: 'Nei posti bui (il Cisternone) la tua luce arriva molto più lontano.',
      say: 'Tieni la lanterna del castello. Dove è buio, ti fa vedere lontano. Il Padre vede tutto, sai. Ma poi ascolta.' }
  },
  /* Costanzo: a palace of the people in the middle of Piazza della Vittoria */
  piazza: {
    covo: 'piazza', leader: 'costanzo', building: 'covo-costanzo', map: 'covo-costanzo', aura: '#ffd23f',
    title: 'PALAZZO DEL POPOLO', base: 'palace',
    sealed: ['In mezzo a piazza della Vittoria, un palazzo che ieri non c\'era: colonne, bandiere, un balcone con il microfono. Dal balcone, una voce: «GIÀ LO SAI».', 'Due uscieri sbarrano il portone: «Si entra con la tessera. Senza tessera, niente comizio».'],
    quiet: ['Il balcone è vuoto, le bandiere sono ammainate. Sul portone: «Comizio rinviato. Dibattito aperto a tutti».'],
    hook: { npc: 'vigile', map: 'formia', text: 'La Repubblica di piazza della Vittoria', where: 'Piazza della Vittoria',
      tip: 'In piazza della Vittoria il vigile non sa più come far passare le macchine.',
      say: ['Guarda: un palazzo in mezzo alla piazza. Con le colonne, le bandiere, il balcone. Ieri non c\'era.',
        'Costanzo ci si è chiuso dentro e parla dal balcone da dodici ore: ha proclamato la Repubblica di piazza della Vittoria. Il traffico è bloccato fino a Mola!',
        'Per entrare ci vuole la tessera elettorale della sua repubblica. Te la faccio io, in via eccezionale: ecco, timbrata.',
        'Ma dentro fanno l\'esame di educazione civica, e non regalano niente. Preparati.'],
      wait: ['Con la tessera entri. Dentro fanno domande sulla Costituzione: ripassa, che non regalano niente.'],
      after: ['Il palazzo si è spento e il traffico è ripartito. Costanzo mi ha stretto la mano e ha detto «Già lo sai». Io non lo sapevo.'] },
    gift: { id: 'tessera', name: 'La Tessera del comizio', text: 'Nei negozi di Formia tutto costa un quinto in meno.',
      say: 'Tieni la tessera, quella vera: membro onorario del comizio. In tutti i negozi di Formia ti fanno lo sconto, perché ci conoscono. GIÀ LO SAI.' }
  },
  /* Zendavid: a temple of sound in the Pineta di Vindicio */
  pineta: {
    covo: 'pineta', leader: 'zendavid', building: 'covo-zendavid', map: 'covo-zendavid', aura: '#ff7ad9',
    title: 'IL TEMPIO DEL BASSO', base: 'stage',
    sealed: ['In mezzo alla pineta, un tempio fatto di casse acustiche, alto come i pini. Il basso fa cadere le pigne.', 'Sulla porta, scritto col pennarello: «Entra solo chi conosce Ye. Con invito».'],
    quiet: ['Le casse tacciono. Si sentono solo le cicale, e da lontano qualcuno che fischietta.'],
    hook: { npc: 'vicino-pineta', map: 'formia', text: 'Il basso della pineta', where: 'Pineta di Vindicio',
      tip: 'Al bordo della pineta di Vindicio, un signore non sopporta più il basso che viene da là dentro.',
      say: ['Da stanotte in mezzo alla pineta c\'è un tempio di casse acustiche. Il basso fa tremare la sabbia fino all\'Eclipse.',
        'Suona sempre lo stesso artista, a ripetizione: Kanye. Dentro c\'è il ragazzo con le cuffie, Zendavid. Dice «bau» e alza il volume.',
        'Alla porta c\'è scritto: «Entra solo chi conosce Ye». Io conosco solo Modugno.',
        'Prendi, è il pass che mi hanno lasciato nella cassetta della posta: io non ci vado. Vai tu, e fagli abbassare.'],
      wait: ['Il tempio è in mezzo alla pineta. Ripassa Kanye, che lì dentro fanno le domande.'],
      after: ['Silenzio! Si sentono di nuovo le cicale. Il ragazzo mi ha lasciato un disco in regalo. Non so che farci, ma è stato gentile.'] },
    gift: { id: 'cuffie', name: 'Le cuffie di Zendavid', text: 'Dal menu (Mappa) scegli la musica che senti in giro per Formia.',
      say: 'Bau. Tieni le mie cuffie, quelle di riserva. Così la musica la scegli tu, ovunque vai. Ok. Respira. È un regalo, non piangere.' }
  }
};
/** the covo place of a building of Formia, if it is one */
export function covoOfBuilding(id: string): CovoPlace | null {
  for (const k in COVO_PLACES) if (COVO_PLACES[k].building === id) return COVO_PLACES[k];
  return null;
}
/** the covo place whose keeper is this friend */
export function covoOfLeader(f: string): CovoPlace | null {
  for (const k in COVO_PLACES) if (COVO_PLACES[k].leader === f) return COVO_PLACES[k];
  return null;
}
