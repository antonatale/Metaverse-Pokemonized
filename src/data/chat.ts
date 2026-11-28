import type { FriendId } from './characters';

/* «il caminetto», the group chat of the friends: at the turns of the story the phone buzzes and the friends say
   theirs, so that all of them are in it, wherever the player is and whoever is played (ui/chat.ts, a phone on the
   screen). A line of whoever is played is left out (they do not text themselves); {hero} is the one played, {rv} the
   rival of this story. Each chat comes once, the first time its moment has come: `after` is a flag of the story
   (story/plot.ts flag), `badges` a number of pins; one without either is played by the story itself (the first, at
   home, before Nicola comes). `label` names the moment in the history of the chat; `replies` are what the player can
   answer, at the end. */

export const GROUP = 'il caminetto';
/** who writes a line: a friend; the rival of this story; the friend who has the keys of the scooter ('keys', written only in
    the chat of his own covo); the friend freed last ('last') */
export type Speaker = FriendId | 'rival' | 'keys' | 'last';
export interface Chat { id: string; label: string; after?: string; badges?: number; replies?: string[]; lines: [Speaker, string][]; loss?: [Speaker, string][];
  freeOnly?: true;
  /** a chat of one covo (13 November 2026): it comes when the invitation to that covo is the next stop of the tour, and
      is written by its keeper only, one covo at a time, nothing told before its time */
  covo?: string }
export const CHATS: Chat[] = [
  /* the morning after the night of the boom: something has happened, nobody knows what (13 November 2026: a mystery,
     no spoilers) */
  { id: 'inizio', label: 'Il mattino dopo', replies: ['L\'ho sentito anch\'io 😳', 'Vado a Gianola a vedere', '👀'], lines: [
    ['valentin', 'Weee… qualcuno ha sentito il boato stanotte? Mi è caduto il bicchiere.'],
    ['andrea', 'Alle 3:12. E un minuto senza corrente in tutta Formia. Ho controllato. Due volte.'],
    ['claudia', 'Io dalla finestra ho visto una luce. Rossa. Poi più niente.'],
    ['costanzo', 'GIÀ LO SAPEVO. Cioè, no. Però lo sapevo.'],
    ['antonio', 'Veniva da Gianola, dalle rovine. Sto facendo girare una simulazione.'],
    ['forchetta', 'dormivo.'],
    ['zendavid', 'Bau. (Avevo le cuffie. Non ho sentito niente. Ansia.)'],
    ['valentin', 'E stamattina la guardaparco di Gianola ha scritto: nel parco ci sono delle creature appena nate, e cerca qualcuno a cui affidarle. Weee!'] ] },
  { id: 'starter', label: 'La prima creatura', after: 'starter', replies: ['Si chiama… ve lo dico stasera 😏', 'È fortissima 💪', 'Grazie ragazzi!'], lines: [
    ['valentin', 'Weee! {hero} ha una creatura! Stasera si festeggia all\'Eclipse.'],
    ['andrea', 'Statisticamente la prima creatura è quella a cui ti affezioni di più. Non darle un nome stupido.'],
    ['costanzo', 'GIÀ LO SAI: la mia sarà più forte. L\'ho detto anche in piazza.'],
    ['claudia', 'Uno alla volta, ragazzi. {hero}, com\'è?'],
    ['zendavid', 'Bau.'] ] },
  /* one covo at a time: when its invitation is the next stop, its keeper writes, not quite himself; the one who took the
     keys of the scooter home says so (story/lairs.ts) */
  { id: 'eco-palamendola', covo: 'palamendola', label: 'Antonio non risponde', replies: ['Antonio?? Tutto ok?', 'Vengo a vedere', '🤖'], lines: [
    ['antonio', 'Sto facendo girare una simulazione. Non entrate nel parco.'], ['antonio', 'La fontana è viola. È normale. È tutto nel modello.'],
    ['keys', 'Ah, {hero}: le chiavi del tuo Liberty le ho io. Le avevi lasciate sul tavolo. Vieni a prenderle. Se passi i test.'] ] },
  { id: 'eco-padel', covo: 'padel', label: 'Andrea ha ricalcolato', replies: ['Andrea, che dici?', 'Vengo su', '🎲'], lines: [
    ['andrea', 'Ho ricalcolato Formia. Casa mia adesso è una torre.'], ['andrea', 'Probabilità che io esca: zero. Al 94%.'],
    ['keys', 'Le chiavi del Liberty le ho io, {hero}. Probabilità che te le ridia: dipende da te.'] ] },
  { id: 'eco-circolo', covo: 'circolo', label: 'Forchetta palleggia', replies: ['Forchetta??', 'Arrivo al Zauli', '🎾'], lines: [
    ['forchetta', 'palleggio.'], ['forchetta', 'non riesco a smettere. poteva andare peggio.'], ['forchetta', 'tra un colpo e l\'altro ho finito un quadro e stampato una protesi.'],
    ['keys', 'le chiavi del liberty le ho io. vieni al campo.'] ] },
  { id: 'eco-eclipse', covo: 'eclipse', label: 'Valentin nella nebbia', replies: ['Valentin, esci da lì!', 'Arrivo', '🌫️'], lines: [
    ['valentin', 'Weee… c\'è nebbia verde in salotto. E musica romena.'], ['valentin', 'Sto benissimo. Ballo. Non riesco a smettere. Weee.'],
    ['keys', 'Weee, {hero}! Le chiavi del Liberty sono qui, nella nebbia. Vieni a ballare e te le ridò.'] ] },
  { id: 'eco-morgana', covo: 'morgana', label: 'Il castello del Padre', replies: ['Claudia, che succede?', 'Vado da Morgana', '🦇'], lines: [
    ['claudia', 'Il Padre è nel suo castello.'], ['claudia', 'Chi vuole sedersi al mio tavolo: l\'invito sta al bancone di Morgana. Uno alla volta.'],
    ['keys', 'E le chiavi del tuo Liberty sono sul mio tavolo, {hero}. Uno alla volta.'] ] },
  { id: 'eco-piazza', covo: 'piazza', label: 'La Repubblica di Costanzo', replies: ['Costanzo, scendi!', 'Arrivo in piazza', '🏛️'], lines: [
    ['costanzo', 'PROCLAMO LA REPUBBLICA DI PIAZZA DELLA VITTORIA.'], ['costanzo', 'GIÀ LO SAI. (Non so come scendere dal balcone.)'],
    ['keys', 'Le chiavi del Liberty sono state nazionalizzate, {hero}. Vieni a discuterne.'] ] },
  { id: 'eco-pineta', covo: 'pineta', label: 'Il basso della pineta', replies: ['Zendavid, abbassa!', 'Arrivo in pineta', '🔊'], lines: [
    ['zendavid', 'Bau. Non sento niente, c\'è Ye a palla.'], ['zendavid', 'Il volume non scende. Ok. Respira. Bau bau.'],
    ['keys', 'Le chiavi del Liberty le ho io. Le tengo al ritmo. Bau.'] ] },
  { id: 'rivale-1', label: 'La prima sfida', after: 'sfida-rivale-1', replies: ['Rivincita quando vuoi 😏', 'Bella lotta!', '🔥'], loss: [
    ['rival', 'Prima sfida vinta! Te l\'avevo detto, {hero}: la mia creatura è fortissima.'],
    ['claudia', 'Era la prima lotta, ragazzi. {hero}, prenditi cura della tua creatura: la prossima andrà meglio.'],
    ['forchetta', 'poteva andare peggio.'],
    ['valentin', 'Weee, adesso vogliamo la rivincita!'] ], lines: [
    ['rival', 'Ok, ok, al parco hai vinto tu. Ma è solo l\'inizio, {hero}.'],
    ['forchetta', 'Poteva andare peggio, {rv}. Potevi perdere contro di me.'],
    ['valentin', 'Weee, la rivalità! Io faccio il tifo per tutti e due. Più per chi offre.'] ] },
  { id: 'spilla-1', label: 'Il primo sigillo', badges: 1, replies: ['Proviamo con gli altri', 'Ti porto qualcosa da mangiare', 'Ho segnato l’ora'], lines: [
    ['last', 'Ragazzi, la spilla se n’è andata e la luce si è spenta. Da dentro sembrava che fossero passati cinque minuti.'],
    ['last', 'La cosa strana è che l’impulso è tornato anche dopo. Sempre allo stesso intervallo. Viene da più lontano.'] ] },
  { id: 'pietra-mura', label: 'I segni nel Cisternone', after: 'pietra-mura', freeOnly: true, replies: ['Segno tutto', 'Adesso Caposele', 'Ci vediamo fuori'], lines: [
    ['claudia', 'I graffi freschi erano solo fuori dalla porta. Dentro, i tre segni sulla pietra erano tutti consumati. Erano lì da molto prima degli scavi.'],
    ['forchetta', 'tre segni anche sul frammento del campo. ho fatto un disegno.'],
    ['andrea', 'La Pietra ha pulsato nello stesso istante della torre. Ce l’ho negli appunti.'] ] },
  { id: 'spilla-3', label: 'Lo stesso impulso', badges: 3, replies: ['Portiamo le prove a Mola', 'Il segno è lo stesso', 'Continuo a seguire l’eco'], lines: [
    ['last', 'Ho messo vicino gli appunti di noi tre. La luce cambiava colore da un covo all’altro, ma il ritmo era sempre lo stesso.'],
    ['last', 'Se trovi un posto che pulsa così, fermati ad ascoltare. Potrebbe esserci un’altra Pietra.'] ] },
  { id: 'pietra-mare', label: 'La registrazione di Caposele', after: 'pietra-mare', freeOnly: true, replies: ['La faccio sentire a Cicerone', 'La riascolto', 'Salvala'], lines: [
    ['zendavid', 'La registrazione dura undici secondi. Sotto l’acqua, verso la fine, si sentono parole. Alza il volume solo lì.'],
    ['costanzo', 'Ho richiamato quello che ha visto il sub. L’ultima volta aveva con sé una moneta, la stringeva anche quando è entrato in acqua.'] ] },
  { id: 'pietra-voce', label: 'Le tre Pietre', after: 'pietra-voce', freeOnly: true, replies: ['Riuniamoci', 'Occhi aperti', 'Le tengo al sicuro'], lines: [
    ['antonio', 'Mura, Mare e Voce hanno tre suoni diversi. Ma quando le metti vicine rispondono tutte insieme.'],
    ['andrea', 'Ho spento il Visore e la luce ha continuato. Se lo vediamo noi, può vederlo anche Mamurra.'] ] },
  { id: 'rapimento', label: 'Dopo Gianola', lines: [
    ['claudia', 'Ho avvisato chi era a casa. Se torna anche una sola creatura ci scrivono subito.'],
    ['antonio', 'Ho salvato il tracciato del Visore. L’ultimo punto è sotto le mura di Castellone, alle tre nicchie.'],
    ['forchetta', 'porto il frammento. se la pietra vibra anche là, almeno sappiamo cosa cercare.'],
    ['valentin', 'Appello da adesso. Siamo in sette e restiamo in sette.'] ] },
  { id: 'mamurra', label: 'Le creature a casa', after: 'finale-riunione', lines: [
    ['claudia', 'Ho fatto il giro. Sono tornate anche quelle che aspettavano a casa.'],
    ['valentin', 'La mia ha svuotato la ciotola. Poi si è addormentata con la testa dentro. Weee, piano però.'],
    ['forchetta', 'stasera tengo il telefono acceso. nel dubbio.'],
    ['zendavid', 'Bau. Stavolta vi ho sentiti tutti.'] ] },
  /* the Scala Mazzarri (27 November 2026): after the second excuse put on it, Costanzo makes it official */
  { id: 'scala', label: 'La Scala Mazzarri', after: 'scala-2', replies: ['Io dico 7 😂', 'Costanzo, sei fissato', 'Rivoto tutto'], lines: [
    ['costanzo', 'Comunicazione ufficiale: da oggi ogni scusa dopo una sconfitta passa dalla Scala Mazzarri. Da 1 a 10. Senza eccezioni.'],
    ['andrea', 'Propongo una scala logaritmica. Certe vostre scuse sotto il 10 non ci stanno.'],
    ['valentin', 'Weee, la mia di ieri era almeno un 11'],
    ['zendavid', 'Bau. Io voto 7 a tutto, così non sbaglio mai di tanto.'],
    ['forchetta', 'poteva andare peggio. poteva esserci una scala anche per i messaggi criptici.'],
    ['claudia', 'Ho capito il tuo punto, Costanzo. Ma le tue scuse chi le giudica?'],
    ['costanzo', 'Le mie sono tutte da 1. GIÀ LO SAI.'],
    ['antonio', 'Crazy shit, ci faccio un modello che le predice. Il dataset ce l\'ho già: le vostre scuse.'] ] },
  /* Valentin's «Stai inguaiatoooo!», the first time he shouts it (ui/shout.ts) */
  { id: 'inguaiato', label: 'Stai inguaiato', after: 'inguaiato-1', replies: ['STAI INGUAIATOOOO', '🔥🎤', 'Rifallo'], lines: [
    ['valentin', 'STAI INGUAIATOOOOOOO 🎤'],
    ['zendavid', 'Ci ho già messo il beat sotto. Bau.'],
    ['costanzo', 'Questa sulla Scala Mazzarri non si vota: è un classico.'],
    ['andrea', 'Ho contato le O: otto. Statisticamente, la prossima volta nove.'],
    ['claudia', 'Lo Spirito ha parlato.'],
    ['forchetta', 'poteva andare peggio. per lui.'],
    ['antonio', 'Crazy shit. Diventa la mia suoneria.'] ] },
  { id: 'ultima-spilla', label: 'Il caminetto si ritrova', badges: 6, replies: ['Ci vediamo alla villa', 'Io porto le Pietre', 'Restiamo in contatto'], lines: [
    ['rival', 'Mamurra vuole vedere tutte le Pietre insieme. Alla villa possiamo farlo uscire allo scoperto.'],
    ['claudia', 'Ci andiamo tutti. Se uno si ferma, ci fermiamo tutti.'],
    ['valentin', 'Weee. Stavolta faccio l’appello io prima di entrare.'] ] },
  { id: 'saluti', label: 'Dalla stazione', lines: [
    ['valentin', 'Buon viaggio, {hero}. Foto appena arrivi.'],
    ['claudia', 'Tu manda un messaggio. Le foto dopo.'],
    ['forchetta', 'porta qualcosa da mangiare sul treno.'] ] }
];
