import type { FriendId } from './characters';

/* The covi: our gyms. Each of the six friends has one in Formia, and gives a pin. Whoever is played beats the other
   five (his own covo is not there for him: story/maps.ts cityCovi) and the train for his second city leaves. Nobody
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
    name: 'Piazza della Vittoria', city: 'formia', leader: 'costanzo', level: 6,
    badge: { id: 'gialosai', name: 'Spilla «Già lo sai»', mark: 'C', color: '#ffe45c' },
    intro: ['GIÀ LO SAI.', 'Questa è la mia piazza. Se vuoi parlare, prima devi battermi.'],
    win: ['Daje Roma daje… va bene, hai vinto tu.', 'La spilla è tua. Il comizio però resta mio: GIÀ LO SAI.'],
    lose: ['Il popolo ha deciso. Ripassa quando vuoi.'],
    after: ['Il prossimo comizio lo dedico a te. GIÀ LO SAI.'],
    vs: {
      antonio: ['Antonio, tu hai i paper. Io ho la piazza.', 'Vediamo chi convince di più. GIÀ LO SAI.'],
      andrea: ['Andrea! Anche tu a Milano, eh? Lì facciamo squadra.', 'Qui però no: i tuoi calcoli contro il mio comizio.'],
      valentin: ['Valentin, qui non si fa festa: si fa politica.', 'Vinci, e stasera ti lascio il palco per un Weee.'],
      forchetta: ['Forchetta, il più formiano di tutti. Il voto di Mola è tuo, lo so.', 'Ma piazza della Vittoria è mia.'],
      zendavid: ['Zendavid, togli le cuffie: il comizio si ascolta.', 'Le battute le lascio a te. Le parole a me.']
    }
  },
  circolo: {
    name: 'Tennis coperti del Bruno Zauli', city: 'formia', leader: 'forchetta', level: 6,
    badge: { id: 'peggio', name: 'Spilla «Poteva andare peggio»', mark: 'F', color: '#8fd0f6' },
    intro: ['Poteva andare peggio.', 'Palleggiamo? Chi perde paga il campo.'],
    win: ['Poteva andare peggio. Per me.', 'Tieni la spilla. Il campo però lo paghi tu lo stesso.'],
    lose: ['Ace. Riprova quando vuoi.'],
    after: ['Dopo la lotta, una partita alla Play?'],
    vs: {
      antonio: ['Antonio. Hai perso qualcosa anche oggi?', 'Poteva andare peggio: la racchetta te la presto io.'],
      costanzo: ['Costanzo. Qui non si fanno comizi.', 'Si gioca e basta. Dopo, se vuoi, parli tu.'],
      andrea: ['Andrea. Tu fai i calcoli, io tiro.', 'A tennis i dati non bastano. Poteva andare peggio.'],
      valentin: ['Valentin. Prima il set, poi la festa.', 'Contro di te sto calmo. È il mio vantaggio.'],
      zendavid: ['Zendavid. Lo so, il tuo Cuore con me va forte.', 'Poteva andare peggio. Giochiamo lo stesso.']
    }
  },
  eclipse: {
    name: 'Eclipse beach', city: 'formia', leader: 'valentin', level: 6,
    badge: { id: 'weee', name: 'Spilla «Weee!»', mark: 'W', color: '#ffa04a' },
    intro: ['Weee! Qui all\'Eclipse la festa è mia.', 'Vuoi la spilla? Prima balli con me. Cioè, lotti.'],
    win: ['Weee… cambio di programma: hai vinto tu.', 'La spilla è tua. La festa stasera continua lo stesso, sei invitato.'],
    lose: ['WEEEEE! Si fa festa da me. Torna quando vuoi.'],
    after: ['Weee! Stasera all\'Eclipse c\'è posto anche per te.'],
    vs: {
      antonio: ['Antonio! Il cervellone all\'Eclipse!', 'Qui le formule non valgono: il caos batte il cervello. Weee!'],
      costanzo: ['Costanzo! Un comizio in spiaggia? Weee!', 'Se vinci, il microfono stasera è tuo.'],
      andrea: ['Andrea! I tuoi calcoli col caos non tornano mai.', 'Cambio di programma: si lotta!'],
      forchetta: ['Forchetta… tu sei troppo calmo per me.', 'Proviamo lo stesso: magari stavolta vince la festa.'],
      zendavid: ['Zendavid! Tu metti la musica, io la festa.', 'Prima però si lotta: chi vince sceglie la canzone.']
    }
  },
  pineta: {
    name: 'Pineta di Vindicio', city: 'formia', leader: 'zendavid', level: 6,
    badge: { id: 'bau', name: 'Spilla «Bau»', mark: 'Z', color: '#ff8fc1' },
    intro: ['Bau.', 'In pineta la musica la scelgo io. Se vinci, la spilla è tua.'],
    win: ['Ansia… va bene, hai vinto. Bau.', 'Tieni la spilla. Io rimetto le cuffie.'],
    lose: ['Bau bau. Questa era bella, ammettilo.'],
    after: ['Ok. Respira. Bella lotta, comunque.'],
    vs: {
      antonio: ['Antonio. Ho una battuta sui paper.', '…no, niente. Lottiamo. Bau.'],
      costanzo: ['Costanzo… lo so, con te parto svantaggiato.', 'Ok. Respira. Metto Stronger e ci provo.'],
      andrea: ['Andrea. Quante probabilità ci sono che tu rida a una mia battuta?', 'Basse, lo so. Bau.'],
      valentin: ['Valentin. Tu la festa, io la musica.', 'Stavolta però si balla al mio ritmo.'],
      forchetta: ['Forchetta. Tu sei calmo, io sono Zen.', 'Vediamo chi resiste di più. Bau.']
    }
  },
  padel: {
    name: 'Campi da padel del Bruno Zauli', city: 'formia', leader: 'andrea', level: 6,
    badge: { id: 'calcolato', name: 'Spilla «Ho calcolato tutto»', mark: 'V', color: '#9be7c4' },
    intro: ['Ho calcolato tutto.', 'Statisticamente vinco io. Vuoi provare lo stesso?'],
    win: ['Sono cucinato.', 'Non era nei dati. La spilla è tua: complimenti, davvero.'],
    lose: ['Come previsto. Al 94%.'],
    after: ['Ho rifatto i calcoli: la prossima volta ti batto. Al 94%.'],
    vs: {
      antonio: ['Antonio. Cervello contro cervello.', 'Ho calcolato anche te: 94%.'],
      costanzo: ['Costanzo. Ci vediamo a Milano, poi.', 'Qui però le parole non bastano: io ho i numeri.'],
      valentin: ['Valentin. Sei l\'unica variabile che non riesco a calcolare.', 'Sono già mezzo cucinato. Giochiamo.'],
      forchetta: ['Forchetta. Tennis contro padel: vediamo chi ha il campo migliore.', 'Ho calcolato tutto.'],
      zendavid: ['Zendavid. Togli le cuffie: ti spiego la strategia.', 'Scherzo, non te la spiego. Al 94%.']
    }
  },
  palamendola: {
    name: 'Palamendola', city: 'formia', leader: 'antonio', level: 6,
    badge: { id: 'statoarte', name: 'Spilla «Stato dell\'arte»', mark: 'A', color: '#c3a0ff' },
    intro: ['Ho già letto il paper di questa settimana.', 'Al Palamendola si gioca in casa mia. Sfida?'],
    win: ['…mi servono più basi di controlli.', 'Crazy shit. La spilla è tua: stato dell\'arte.'],
    lose: ['Crazy shit… stato dell\'arte.'],
    after: ['Bella lotta. La metto nel prossimo paper.'],
    vs: {
      costanzo: ['Costanzo. Ho letto un paper sui comizi.', 'Spoiler: il cervello batte la chiacchiera.'],
      andrea: ['Andrea. Due cervelli, un solo Palamendola.', 'Vediamo chi ha il modello migliore.'],
      valentin: ['Valentin. Il caos è l\'unica cosa che i miei modelli non prevedono.', 'Crazy shit. Proviamo lo stesso.'],
      forchetta: ['Forchetta, prima di cominciare: hai visto le mie chiavi?', '…lasciamo stare. Sfida.'],
      zendavid: ['Zendavid, da Scauri fin qui? Allora sei venuto per lottare.', 'Stato dell\'arte contro Stronger. Sfida.']
    }
  }
};
