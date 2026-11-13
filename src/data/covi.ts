import type { FriendId } from './characters';
import type { SpeciesId } from './creatures';

/* The covi: our gyms. Each of the seven friends has one in Formia, and gives a pin. Since 13 November 2026 they are
   buildings with a story (data/covo-places.ts: where, why one goes, what the keeper gives besides the pin), and each pin
   is a seal of the echo of Telepilo: beating the keeper frees him. Whoever is played beats the other
   six (his own covo is not there for him: story/maps.ts cityCovi) and the train for his second city leaves. Nobody
   joins the company: a beaten friend stays where he is, and says so. */
export interface Badge { id: string; name: string; mark: string; color: string }
export interface Covo {
  name: string;
  city: string;
  leader: FriendId;
  /** the leader's level for the first covo one beats; each pin of the city already won adds COVO_STEP (story/maps.ts
      covoLevel), so the order is free and the last one is the hardest */
  level: number;
  badge: Badge;
  /** the leader's creatures, of his type, in the order he sends them (the first forms: they grow with the level,
      story/covo-crew.ts); he steps in last, as a person (`last` on the bench), like the player does */
  crew: SpeciesId[];
  /** levels added to (or taken from) the crew, by how many pins of the city are already won (0 to 4): tuned with
      `npx tsx tools/sim-covi.ts --tune`, so that the median player wins about seven times in ten at the leader's level */
  crewTune?: number[];
  /** what the leader says before the challenge, after winning, after losing, and once beaten */
  intro: string[];
  win: string[];
  lose: string[];
  after: string[];
  /** what the leader says to each one who can challenge him, after the first line of `intro` and instead of the rest: built only on what the game already says
      of them (their lines, moves, types and second city), nothing made up about the real people */
  vs: Partial<Record<FriendId, string[]>>;
}
/** how much stronger a covo is for every pin of its city already won */
export const COVO_STEP = 3;

export const COVI: Record<string, Covo> = {
  piazza: {
    name: 'Il Palazzo del Popolo', city: 'formia', leader: 'costanzo', level: 6, crew: ['micetto', 'cicalina', 'micetto'], crewTune: [2, 1, 1, 2, -1],
    badge: { id: 'gialosai', name: 'Spilla «Già lo sai»', mark: 'C', color: '#ffe45c' },
    intro: ['GIÀ LO SAI.', 'Questo è il mio palazzo, e questa è la mia repubblica. Se vuoi parlare, prima devi battermi.'],
    win: ['Daje Roma daje… va bene, hai vinto tu.', '…aspetta. Che ci faccio su un balcone? Da quanto sto parlando? Ah. L\'eco.', 'La spilla è tua: è il mio sigillo. Il comizio però resta mio: GIÀ LO SAI.'],
    lose: ['Il popolo ha deciso. Ripassa quando vuoi.'],
    after: ['Il prossimo comizio lo dedico a te. GIÀ LO SAI.'],
    vs: {
      antonio: ['Antonio, tu hai i paper. Io ho la piazza.', 'Vediamo chi convince di più. GIÀ LO SAI.'],
      andrea: ['Andrea! Anche tu a Milano, eh? Lì facciamo squadra.', 'Qui però no: i tuoi calcoli contro il mio comizio.'],
      valentin: ['Valentin, qui non si fa festa: si fa politica.', 'Vinci, e stasera ti lascio il palco per un Weee.'],
      forchetta: ['Forchetta, il più formiano di tutti. Il voto di Mola è tuo, lo so.', 'Ma piazza della Vittoria è mia.'],
      zendavid: ['Zendavid, togli le cuffie: il comizio si ascolta.', 'Le battute le lascio a te. Le parole a me.'],
      claudia: ['Claudia. Diabolica. Ora ti spiego perché hai portato tutti sulla cattiva strada.', 'Prima però si lotta. Poi il dibattito: tre ore, minimo.']
    }
  },
  circolo: {
    name: 'Il Tempio della Terra Rossa', city: 'formia', leader: 'forchetta', level: 6, crew: ['lumacotta', 'ramarrino', 'lumacotta'], crewTune: [0, 1, 0, 1, 0],
    badge: { id: 'peggio', name: 'Spilla «Poteva andare peggio»', mark: 'F', color: '#8fd0f6' },
    intro: ['Poteva andare peggio.', 'Palleggio da dodici ore e non ho sbagliato una palla. Palleggiamo? Chi perde paga il campo.'],
    win: ['Poteva andare peggio. Per me.', '…dodici ore? Ho fame. L\'eco mi aveva fatto dimenticare di mangiare.', 'Tieni la spilla. Il campo però lo paghi tu lo stesso.'],
    lose: ['Ace. Riprova quando vuoi.'],
    after: ['Dopo la lotta, una partita alla Play?'],
    vs: {
      antonio: ['Antonio. Hai perso qualcosa anche oggi?', 'Poteva andare peggio: la racchetta te la presto io.'],
      costanzo: ['Costanzo. Qui non si fanno comizi.', 'Si gioca e basta. Dopo, se vuoi, parli tu.'],
      andrea: ['Andrea. Tu fai i calcoli, io tiro.', 'A tennis i dati non bastano. Poteva andare peggio.'],
      valentin: ['Valentin. Prima il set, poi la festa.', 'Contro di te sto calmo. È il mio vantaggio.'],
      zendavid: ['Zendavid. Lo so, il tuo Cuore con me va forte.', 'Poteva andare peggio. Giochiamo lo stesso.'],
      claudia: ['Claudia. Il Padre della Trinità sotto i coperti del Zauli.', 'Poteva andare peggio: almeno tu ascolti prima di colpire.']
    }
  },
  eclipse: {
    name: 'La Torre Verde', city: 'formia', leader: 'valentin', level: 6, crew: ['granchietto', 'cinghialetto', 'gabbi'], crewTune: [1, 2, -2, 0, 0],
    badge: { id: 'weee', name: 'Spilla «Weee!»', mark: 'W', color: '#ffa04a' },
    intro: ['Weee! Benvenuto nella mia torre. La nebbia? Effetti speciali.', 'Vuoi la spilla? Prima balli con me. Cioè, lotti.'],
    win: ['Weee… cambio di programma: hai vinto tu.', 'La nebbia se ne va… che sogno strano. Ero nei Carpazi, ballavo con le Iele…', 'La spilla è tua. Stasera festa all\'Eclipse: sei invitato.'],
    lose: ['WEEEEE! Si fa festa nella nebbia. Torna quando vuoi.'],
    after: ['Weee! Stasera all\'Eclipse c\'è posto anche per te.'],
    vs: {
      antonio: ['Antonio! Il cervellone nella mia torre!', 'Qui le formule non valgono: il caos batte il cervello. Weee!'],
      costanzo: ['Costanzo! Un comizio nella nebbia? Weee!', 'Se vinci, il microfono stasera è tuo.'],
      andrea: ['Andrea! I tuoi calcoli col caos non tornano mai.', 'Cambio di programma: si lotta!'],
      forchetta: ['Forchetta… tu sei troppo calmo per me.', 'Proviamo lo stesso: magari stavolta vince la festa.'],
      zendavid: ['Zendavid! Tu metti la musica, io la festa.', 'Prima però si lotta: chi vince sceglie la canzone.'],
      claudia: ['Il Padre! Weee! Lo Spirito ti saluta.', 'Stasera però la festa la decido io: lotta!']
    }
  },
  pineta: {
    name: 'Il Tempio del Basso', city: 'formia', leader: 'zendavid', level: 6, crew: ['olivella', 'ginestrella', 'olivella'], crewTune: [5, 2, 2, 3, 0],
    badge: { id: 'bau', name: 'Spilla «Bau»', mark: 'Z', color: '#ff8fc1' },
    intro: ['Bau.', 'Nel tempio la musica la scelgo io: Ye, a ripetizione. Se vinci, la spilla è tua.'],
    win: ['Ansia… va bene, hai vinto. Bau.', '…perché ho costruito un tempio di casse in pineta? Ok. Respira. Era l\'eco.', 'Tieni la spilla. Io rimetto le cuffie. A volume normale.'],
    lose: ['Bau bau. Questa era bella, ammettilo.'],
    after: ['Ok. Respira. Bella lotta, comunque.'],
    vs: {
      antonio: ['Antonio. Ho una battuta sui paper.', '…no, niente. Lottiamo. Bau.'],
      costanzo: ['Costanzo… lo so, con te parto svantaggiato.', 'Ok. Respira. Metto Stronger e ci provo.'],
      andrea: ['Andrea. Quante probabilità ci sono che tu rida a una mia battuta?', 'Basse, lo so. Bau.'],
      valentin: ['Valentin. Tu la festa, io la musica.', 'Stavolta però si balla al mio ritmo.'],
      forchetta: ['Forchetta. Tu sei calmo, io sono Zen.', 'Vediamo chi resiste di più. Bau.'],
      claudia: ['Claudia. Lo so, il Cuore batte la Calma. Bau.', 'Facciamo una lotta tranquilla. Cioè, io sono tranquillo.']
    }
  },
  padel: {
    name: 'La Torre delle Probabilità', city: 'formia', leader: 'andrea', level: 6, crew: ['stellina', 'civettina', 'stellina'], crewTune: [5, 3, -2, 4, 1],
    badge: { id: 'calcolato', name: 'Spilla «Ho calcolato tutto»', mark: 'V', color: '#9be7c4' },
    intro: ['Ho calcolato tutto.', 'Dalla cima di questa torre vedo tutte le probabilità di Formia. Statisticamente vinco io. Vuoi provare lo stesso?'],
    win: ['Sono cucinato.', 'Aspetta… la torre si abbassa. Ero chiuso dentro la mia distribuzione. Che figura.', 'Non era nei dati. La spilla è tua: complimenti, davvero.'],
    lose: ['Come previsto. Al 94%.'],
    after: ['Ho rifatto i calcoli: la prossima volta ti batto. Al 94%.'],
    vs: {
      antonio: ['Antonio. Cervello contro cervello.', 'Ho calcolato anche te: 94%.'],
      costanzo: ['Costanzo. Ci vediamo a Milano, poi.', 'Qui però le parole non bastano: io ho i numeri.'],
      valentin: ['Valentin. Sei l\'unica variabile che non riesco a calcolare.', 'Sono già mezzo cucinato. Giochiamo.'],
      forchetta: ['Forchetta. Tennis contro statistica: vediamo chi sbaglia meno.', 'Ho calcolato tutto.'],
      zendavid: ['Zendavid. Togli le cuffie: ti spiego la strategia.', 'Scherzo, non te la spiego. Al 94%.'],
      claudia: ['Claudia, ho calcolato anche le tue risposte punto per punto.', 'Tre colpi della Trinità? Li ho già messi in tabella.']
    }
  },
  palamendola: {
    name: 'La Cupola', city: 'formia', leader: 'antonio', level: 6, crew: ['civettina', 'polpino', 'stellina'], crewTune: [0, 0, -1, 0, -2],
    badge: { id: 'statoarte', name: 'Spilla «Stato dell\'arte»', mark: 'A', color: '#c3a0ff' },
    intro: ['Ho già letto il paper di questa settimana.', 'Nella cupola gira la simulazione di Formia, e tu sei una variabile che non avevo previsto. Sfida?'],
    win: ['…mi servono più basi di controlli.', 'Che ore sono? Da quanto gira la simulazione? Crazy shit: era l\'eco.', 'La spilla è tua: stato dell\'arte.'],
    lose: ['Crazy shit… stato dell\'arte.'],
    after: ['Bella lotta. La metto nel prossimo paper.'],
    vs: {
      costanzo: ['Costanzo. Ho letto un paper sui comizi.', 'Spoiler: il cervello batte la chiacchiera.'],
      andrea: ['Andrea. Due cervelli, una sola cupola.', 'Vediamo chi ha il modello migliore.'],
      valentin: ['Valentin. Il caos è l\'unica cosa che i miei modelli non prevedono.', 'Crazy shit. Proviamo lo stesso.'],
      forchetta: ['Forchetta, prima di cominciare: hai visto le mie chiavi?', '…lasciamo stare. Sfida.'],
      zendavid: ['Zendavid, da Scauri fin qui? Allora sei venuto per lottare.', 'Stato dell\'arte contro Stronger. Sfida.'],
      claudia: ['Il Padre al Palamendola! Crazy shit.', 'Il Figlio ha letto un paper nuovo. Vediamo se basta.']
    }
  },
  /* Claudia's covo: her home in via Palazzo turned black castle (the invitation is won at Morgana). Her crew is the night of Mola: an urchin of the rocks under
     the tower, a snail of the old walls, an owl of the lane; they grow into creatures of the Calma, as she is */
  morgana: {
    name: 'Il Castello del Padre', city: 'formia', leader: 'claudia', level: 6, crew: ['riccetto', 'lumacotta', 'civettina'], crewTune: [2, 1, 0, 1, 0],
    badge: { id: 'tavoli', name: 'Spilla «Tavoli separati»', mark: 'D', color: '#d6403a' },
    intro: ['Ho capito il tuo punto. Ora senti il mio.', 'Ti sei seduto su tutte e due le sedie, uno alla volta. Bravo. Adesso si lotta.'],
    win: ['Va bene. Ho ascoltato, e hai ragione tu.', '…un trono? Un castello? Avevo bisogno di spazio, ma così è troppo. Era l\'eco.', 'La spilla è tua. Costanzo direbbe che ti ho portato sulla cattiva strada: tienila lo stesso.'],
    lose: ['Puoi sentire anche il mio? Adesso sì. Ripassa quando vuoi.'],
    after: ['Stasera torno da Morgana, al mio tavolo. Siediti, se vuoi.'],
    vs: {
      antonio: ['Figlio mio. Il Padre ti aspettava.', 'Niente sconti di famiglia: lotta.'],
      costanzo: ['Costanzo. Lo so cosa pensi di me. Lo dici a tutta Mola.', 'Facciamo così: prima lottiamo, poi parli. Uno alla volta.'],
      andrea: ['Andrea, so che hai già calcolato tutto.', 'Ma quello che dico io, nei tuoi fogli, non c\'è.'],
      valentin: ['Lo Spirito! Tu parli poco e dici tanto.', 'Oggi però parliamo con le creature.'],
      forchetta: ['Forchetta. Il più formiano di tutti, nel mio castello.', 'Calma contro calma: vince chi ascolta meglio.'],
      zendavid: ['Zendavid, togli un attimo le cuffie: ti conviene sentirmi.', 'Il tuo Cuore con me va forte, lo so. Proviamo lo stesso.']
    }
  }
};
