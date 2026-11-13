import type { FriendId } from './characters';

/* «il caminetto», the group chat of the friends: at the turns of the story the phone buzzes and the friends say
   theirs, so that all of them are in it, wherever the player is and whoever is played (ui/chat.ts, a phone on the
   screen). A line of whoever is played is left out (they do not text themselves); {hero} is the one played, {rv} the
   rival of this story. Each chat comes once, the first time its moment has come: `after` is a flag of the story
   (story/plot.ts flag), `badges` a number of pins; one without either is played by the story itself (the first, at
   home, before Nicola comes). `label` names the moment in the history of the chat; `replies` are what the player can
   answer, at the end. */

export const GROUP = 'il caminetto';
export interface Chat { id: string; label: string; after?: string; badges?: number; replies?: string[]; lines: [FriendId | 'rival', string][] }
export const CHATS: Chat[] = [
  { id: 'inizio', label: 'Il giorno delle creature', replies: ['Ci vediamo là!', 'Arrivo 🔥', '😂😂😂'], lines: [
    ['valentin', 'Weee! Avete sentito? Oggi la guardaparco di Gianola affida le creature appena nate!'],
    ['andrea', 'Confermo. Ho letto l\'avviso del parco. Due volte.'],
    ['costanzo', 'GIÀ LO SAPEVO. La mia sarà la più forte, l\'ho detto anche in piazza.'],
    ['claudia', 'Costanzo, sei ancora in pigiama.'],
    ['antonio', 'Arrivo dopo: sto facendo girare una simulazione.'],
    ['forchetta', 'ok…'],
    ['zendavid', 'Bau. (Vengo anch\'io.)'] ] },
  { id: 'starter', label: 'La prima creatura', after: 'starter', replies: ['Si chiama… ve lo dico stasera 😏', 'È fortissima 💪', 'Grazie ragazzi!'], lines: [
    ['valentin', 'Weee! {hero} ha una creatura! Stasera si festeggia all\'Eclipse.'],
    ['andrea', 'Statisticamente la prima creatura è quella a cui ti affezioni di più. Non darle un nome stupido.'],
    ['costanzo', 'GIÀ LO SAI: la mia sarà più forte. L\'ho detto anche in piazza.'],
    ['claudia', 'Uno alla volta, ragazzi. {hero}, com\'è?'],
    ['zendavid', 'Bau.'] ] },
  { id: 'rivale-1', label: 'La prima sfida', after: 'tr-rivale-1', replies: ['Rivincita quando vuoi 😏', 'Bella lotta!', '🔥'], lines: [
    ['rival', 'Ok, ok, al parco hai vinto tu. Ma è solo l\'inizio, {hero}.'],
    ['forchetta', 'Poteva andare peggio, {rv}. Potevi perdere contro di me.'],
    ['valentin', 'Weee, la rivalità! Io faccio il tifo per tutti e due. Più per chi offre.'] ] },
  { id: 'spilla-1', label: 'La prima spilla', badges: 1, replies: ['La prossima è tua, Costanzo 😂', 'Una alla volta!', '🏅'], lines: [
    ['antonio', 'Prima spilla. Stato dell\'arte, {hero}.'],
    ['claudia', 'Il Padre approva. Il Figlio pure. Lo Spirito sta ancora leggendo.'],
    ['costanzo', 'Mozione: la prossima spilla la prendo io. Chi è d\'accordo?'],
    ['andrea', 'Nessuno, Costanzo.'] ] },
  { id: 'pietra-mura', label: 'Il Cisternone', after: 'pietra-mura', replies: ['Era buio pesto 😱', 'Tutto sotto controllo', '👻'], lines: [
    ['andrea', 'Siete scesi nel Cisternone? Al buio? Ho calcolato le probabilità di uscirne e non ve le dico.'],
    ['zendavid', 'Là sotto c\'è un\'eco pazzesca. Ci vorrei registrare un pezzo. Bau.'],
    ['forchetta', 'ok…'] ] },
  { id: 'spilla-3', label: 'Tre spille', badges: 3, replies: ['Festa all\'Eclipse, offro io!', 'Ancora tre 💪', '😎'], lines: [
    ['valentin', 'Tre spille! {hero}, a questo punto la festa la offri tu.'],
    ['costanzo', 'In piazza si parla solo di te. E un po\' di me.'],
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
  { id: 'ultima-spilla', label: 'Tutte le spille', badges: 6, replies: ['Mi mancherete 🥲', 'Torino, arrivo!', '🚂'], lines: [
    ['rival', 'Va bene: sei il più forte di Formia, {hero}. L\'ho detto. Non lo ripeto.'],
    ['antonio', 'Tutte le spille di Formia. Adesso il treno: Torino, e un giorno Chicago.'],
    ['andrea', 'Il treno parte in orario. Ho controllato. Due volte.'],
    ['valentin', 'Weee! Prima di partire, l\'ultima festa.'] ] }
];
