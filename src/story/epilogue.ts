import { st } from '../save/story-progress';
import { SPECIES } from '../data/creatures';
import { CHARS } from '../data/characters';
import { LEGENDS } from '../data/legends';
import { flag } from './plot';
import { allItems, foundItems } from './maps';
import { dexHad, nameOf } from './growth';

/* The story told back to the player, before leaving Formia: every line comes from what has really happened, so that two
   games have two different stories. It is the place where the choices of the story will be told, when there are some. */
const list = (a: string[]) => a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];

export function epilogue(): string[] {
  const out: string[] = [], mons = st.mons || [], dex = st.dex || {}, kinds = Object.keys(SPECIES).length;
  const seen = Object.keys(dex).filter(function (k) { return dex[k] >= 1; }).length, had = dexHad();
  if (mons[0]) out.push('Al Parco di Gianola il guardaparco ti ha affidato una creatura: ' + nameOf(mons[0].uid) + ' è ancora con te.');
  if (flag('tr-mamurra')) out.push('Hai trovato le tre Pietre di Telepilo prima del fantasma di Mamurra, e l\'hai fermato alla sua villa.');
  if (flag('tr-rivale-3')) out.push('Tullio voleva essere il più forte di Formia. Ha dovuto dire che lo sei tu.');
  const friends = st.squad.filter(function (f) { return f !== 'antonio'; }).map(function (f) { return CHARS[f].name; });
  if (friends.length) out.push('Nella tua compagnia sono entrati ' + list(friends) + '.');
  const found = foundItems().length, all = allItems().length;
  if (found) out.push(found === all ? 'Hai ritrovato tutto quello che avevi perso in giro per Formia: un record.' : 'Di quello che avevi perso in giro hai ritrovato ' + found + ' cose su ' + all + '. Le altre sono ancora là.');
  out.push('Nel diario ' + (seen === 1 ? 'c\'è una creatura' : 'ci sono ' + seen + ' creature') + ' su ' + kinds + (had === 1 ? ', e una è stata con te.' : had ? ', e ' + had + ' sono state con te.' : '.'));
  const close = mons.filter(function (m) { return (m.bond || 0) >= 80; })[0];
  if (close) out.push('Con ' + nameOf(close.uid) + ' ormai vi capite senza parlare.');
  Object.keys(LEGENDS).forEach(function (id) {
    const sp = SPECIES[LEGENDS[id].sp];
    if (dex[sp.id] === 2) out.push(sp.name + ' è con te: non ci avrebbe creduto nessuno.');
    else if (dex[sp.id]) out.push(sp.name + ' l\'hai guardato in faccia, ed è ancora là fuori.');
  });
  return out;
}
