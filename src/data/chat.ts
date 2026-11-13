import type { FriendId } from './characters';

/* The group chat of the friends: at the turns of the story the phone buzzes and the friends say theirs, so that
   all of them are in it, wherever the player is and whoever is played (ui/chat.ts). A line of whoever is played is
   left out (they do not text themselves); {hero} is the one played, {rv} the rival of this story. Each chat comes
   once, the first time its moment has come: `after` is a flag of the story (story/plot.ts flag), or `badges` a
   number of pins. */

export interface Chat { id: string; after?: string; badges?: number; lines: [FriendId | 'rival', string][] }
export const CHATS: Chat[] = [
  { id: 'starter', after: 'starter', lines: [
    ['valentin', 'Weee! {hero} ha una creatura! Stasera si festeggia all\'Eclipse.'],
    ['andrea', 'Statisticamente la prima creatura è quella a cui ti affezioni di più. Non darle un nome stupido.'],
    ['costanzo', 'GIÀ LO SAI: la mia sarà più forte. L\'ho detto anche in piazza.'],
    ['claudia', 'Uno alla volta, ragazzi. {hero}, com\'è?'],
    ['zendavid', 'Bau.'] ] },
  { id: 'rivale-1', after: 'tr-rivale-1', lines: [
    ['rival', 'Ok, ok, al parco hai vinto tu. Ma è solo l\'inizio, {hero}.'],
    ['forchetta', 'Poteva andare peggio, {rv}. Potevi perdere contro di me.'],
    ['valentin', 'Weee, la rivalità! Io faccio il tifo per tutti e due. Più per chi offre.'] ] },
  { id: 'spilla-1', badges: 1, lines: [
    ['antonio', 'Prima spilla. Stato dell\'arte, {hero}.'],
    ['claudia', 'Il Padre approva. Il Figlio pure. Lo Spirito sta ancora leggendo.'],
    ['costanzo', 'Mozione: la prossima spilla la prendo io. Chi è d\'accordo?'],
    ['andrea', 'Nessuno, Costanzo.'] ] },
  { id: 'pietra-mura', after: 'pietra-mura', lines: [
    ['andrea', 'Siete scesi nel Cisternone? Al buio? Ho calcolato le probabilità di uscirne e non ve le dico.'],
    ['zendavid', 'Là sotto c\'è un\'eco pazzesca. Ci vorrei registrare un pezzo. Bau.'],
    ['forchetta', 'ok…'] ] },
  { id: 'spilla-3', badges: 3, lines: [
    ['valentin', 'Tre spille! {hero}, a questo punto la festa la offri tu.'],
    ['costanzo', 'In piazza si parla solo di te. E un po\' di me.'],
    ['rival', 'Tre? Io ne ho di più. Più o meno. Ci vediamo in giro, {hero}.'] ] },
  { id: 'pietra-mare', after: 'pietra-mare', lines: [
    ['zendavid', 'Un sub alle peschiere di Caposele? Pazzesco. Io in acqua ci vado solo con le cuffie impermeabili.'],
    ['claudia', 'Le pietre sono due. Come i tavoli quando parla Costanzo.'],
    ['costanzo', 'Non è vero.'],
    ['claudia', 'Appunto.'] ] },
  { id: 'pietra-voce', after: 'pietra-voce', lines: [
    ['antonio', 'Cicerone in persona vi ha interrogati? Io gli chiederei del suo paper sulle Catilinarie.'],
    ['andrea', 'Tutte e tre le pietre. Mamurra adesso viene a cercarvi: fate attenzione.'],
    ['valentin', 'Se viene Mamurra, gli facciamo una festa che non si scorda più. Weee!'] ] },
  { id: 'mamurra', after: 'tr-mamurra', lines: [
    ['costanzo', 'GIÀ LO SAPEVO. Formia è salva! Discorso stasera in piazza della Vittoria.'],
    ['forchetta', 'Poteva andare peggio. Tipo, poteva vincere lui.'],
    ['claudia', 'Il Padre ha ascoltato tutti. Il verdetto è: {hero}.'],
    ['zendavid', 'BAU! (Questo è un bau di festa.)'],
    ['valentin', 'Festa all\'Eclipse, subito! Tutti, anche {rv}!'] ] },
  { id: 'ultima-spilla', badges: 6, lines: [
    ['rival', 'Va bene: sei il più forte di Formia, {hero}. L\'ho detto. Non lo ripeto.'],
    ['antonio', 'Tutte le spille di Formia. Adesso il treno: Torino, e un giorno Chicago.'],
    ['andrea', 'Il treno parte in orario. Ho controllato. Due volte.'],
    ['valentin', 'Weee! Prima di partire, l\'ultima festa.'] ] }
];
