import { st } from '../save/story-progress';
import { SPECIES } from '../data/creatures';
import { CHARS } from '../data/characters';
import { LEGENDS } from '../data/legends';
import { flag } from './plot';
import { allItems, foundItems } from './maps';
import { dexHad, firstHuman, monsOf, nameOf } from './growth';
import { chosen, endFlag, pactOpen, stonesKept, tullioMood } from './choices';

/* The story told back to the player, before leaving Formia: every line comes from what has really happened, and from what
   the player has decided (data/choices.ts), so that two games have two different stories. */
const list = (a: string[]) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];

export function epilogue(): string[] {
  const out: string[] = [], mons = st.mons || [], dex = st.dex || {}, kinds = Object.keys(SPECIES).length;
  const seen = Object.keys(dex).filter(function (k) { return dex[k] >= 1; }).length, had = dexHad();
  const given = monsOf('antonio')[0];
  if (given) out.push('Al Parco di Gianola il guardaparco ti ha affidato una creatura: ' + nameOf(given.uid) + ' è ancora con te.');
  if (flag('tr-mamurra')) out.push('Hai trovato le tre Pietre di Telepilo prima del fantasma di Mamurra, e l\'hai fermato alla sua villa.');
  const stones = chosen('pietre');
  if (stones === 'sigillo') out.push(flag('enigma-lamo') ? 'Hai rimesso le pietre nelle nicchie: il sigillo di Telepilo è chiuso, e a Formia si dorme tranquilli.' : 'Hai promesso di rimettere le pietre al loro posto. Le nicchie sotto le mura di Castellone le aspettano ancora.');
  else if (stones === 'tenute') out.push(stonesKept() ? 'Le Pietre di Telepilo sono ancora nella tua borsa, insieme alle tielle. Cicerone fa finta di niente.' : 'Le pietre le avevi tenute tu. Le hai rese a Lamo, e hai fatto bene.');
  const mood = tullioMood();
  if (mood === 'ally') out.push(flag('tr-rivale-3') ? 'Tullio è venuto a salutarti alla stazione, con una tiella per il viaggio. Non l\'ha fatta lui, ma conta il pensiero.' : 'Tullio si allena ancora con te. Non dirlo al nonno.');
  else if (mood === 'bitter') out.push('Tullio non ti saluta più. Al parco, da lontano, qualcuno ti guarda partire.');
  else if (flag('tr-rivale-3')) out.push('Tullio voleva essere il più forte di Formia. Ha dovuto dire che lo sei tu.');
  const friends = st.squad.filter(function (f) { return f !== firstHuman(); }).map(function (f) { return CHARS[f].name; });
  if (friends.length) out.push('Nella tua compagnia sono entrati ' + list(friends) + '.');
  const found = foundItems().length, all = allItems().length;
  if (found) out.push(found === all ? 'Hai ritrovato tutto quello che avevi perso in giro per Formia: un record.' : 'Di quello che avevi perso in giro hai ritrovato ' + found + ' cose su ' + all + '. Le altre sono ancora là.');
  out.push('Nel diario ' + (seen === 1 ? 'c\'è una creatura' : 'ci sono ' + seen + ' creature') + ' su ' + kinds + (had === 1 ? ', e una è stata con te.' : had ? ', e ' + had + ' sono state con te.' : '.'));
  const close = mons.filter(function (m) { return (m.bond || 0) >= 80; })[0];
  if (close) out.push('Con ' + nameOf(close.uid) + ' ormai vi capite senza parlare.');
  Object.keys(LEGENDS).forEach(function (id) {
    const L = LEGENDS[id], sp = SPECIES[L.sp];
    if (flag(endFlag(L, 'amico'))) out.push(sp.name + ' è con te: per conquistarlo sono bastate tre tielle.');
    else if (flag(endFlag(L, 'libero'))) out.push(id === 'lamo' ? 'Lamo dorme sotto le mura. Di notte, a Castellone, si sente russare.' : sp.name + ' l\'hai lasciato andare, e ogni tanto si fa vedere da lontano.');
    else if (pactOpen(L)) out.push(sp.name + ' aspetta ancora quello che gli hai promesso. E ha fame.');
    else if (dex[sp.id] === 2) out.push(sp.name + ' è con te: non ci avrebbe creduto nessuno.');
    else if (dex[sp.id]) out.push(sp.name + ' l\'hai guardato in faccia, ed è ancora là fuori.');
  });
  return out;
}
