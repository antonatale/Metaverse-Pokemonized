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
    ['forchetta', 'palleggio.'], ['forchetta', 'non riesco a smettere. poteva andare peggio.'],
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
  { id: 'spilla-1', label: 'La prima spilla', badges: 1, replies: ['Lo scopriremo insieme', 'Una alla volta!', '🏅'], lines: [
    ['last', 'Ragazzi… sono tornato me stesso. Grazie a {hero}.'],
    ['last', 'Non ricordo quasi niente. Solo una voce, dalle pietre, che mi chiamava «custode». E una luce, la notte del boato.'],
    ['last', 'Se è successo a me, può essere successo anche ad altri. Guardate se qualcuno nel gruppo scrive cose strane.'] ] },
  { id: 'pietra-mura', label: 'Il Cisternone', after: 'pietra-mura', replies: ['Era buio pesto 😱', 'Tutto sotto controllo', '👻'], lines: [
    ['andrea', 'Siete scesi nel Cisternone? Al buio? Ho calcolato le probabilità di uscirne e non ve le dico.'],
    ['zendavid', 'Là sotto c\'è un\'eco pazzesca. Ci vorrei registrare un pezzo. Bau.'],
    ['forchetta', 'ok…'] ] },
  { id: 'spilla-3', label: 'Tre spille', badges: 3, replies: ['Festa quando siamo tutti liberi', 'Ancora poche 💪', '😎'], lines: [
    ['last', 'Tre sigilli, {hero}. Ogni volta che uno di noi si sveglia, l\'eco si fa più debole: si sente.'],
    ['rival', 'Tre? Io ne ho di più. Più o meno. Ci vediamo in giro, {hero}.'] ] },
  { id: 'pietra-mare', label: 'La pietra del mare', after: 'pietra-mare', replies: ['😂😂😂', 'Claudia ha ragione', '🌊'], lines: [
    ['zendavid', 'Un sub alle peschiere di Caposele? Pazzesco. Io in acqua ci vado solo con le cuffie impermeabili.'],
    ['claudia', 'Le pietre sono due. Come i tavoli quando parla Costanzo.'],
    ['costanzo', 'Non è vero.'],
    ['claudia', 'Appunto.'] ] },
  { id: 'pietra-voce', label: 'Le tre pietre', after: 'pietra-voce', replies: ['Che venga pure', 'Occhi aperti 👀', '🔥'], lines: [
    ['antonio', 'Cicerone in persona vi ha interrogati? Io gli chiederei del suo paper sulle Catilinarie.'],
    ['andrea', 'Tutte e tre le pietre. Mamurra adesso viene a cercarvi: fate attenzione.'],
    ['valentin', 'Se viene Mamurra, gli facciamo una festa che non si scorda più. Weee!'] ] },
  { id: 'mamurra', label: 'Mamurra sconfitto', after: 'tr-mamurra', replies: ['Festa all\'Eclipse! 🎉', 'Formia è salva', 'BAU'], lines: [
    ['costanzo', 'GIÀ LO SAPEVO. Formia è salva! Discorso stasera in piazza della Vittoria.'],
    ['forchetta', 'Poteva andare peggio. Tipo, poteva vincere lui.'],
    ['claudia', 'Il Padre ha ascoltato tutti. Il verdetto è: {hero}.'],
    ['zendavid', 'BAU! (Questo è un bau di festa.)'],
    ['valentin', 'Festa all\'Eclipse, subito! Tutti, anche {rv}!'] ] },
  { id: 'ultima-spilla', label: 'Tutte le spille', badges: 6, replies: ['Mi mancherete 🥲', 'Binario, arrivo!', '🚂'], lines: [
    ['rival', 'Va bene: sei il più forte di Formia, {hero}. L\'ho detto. Non lo ripeto.'],
    ['antonio', 'Tutte le spille di Formia. Adesso il treno: Torino, e un giorno Chicago.'],
    ['andrea', 'Il treno parte in orario. Ho controllato. Due volte.'],
    ['valentin', 'Weee! Prima di partire, l\'ultima festa.'] ] }
];
