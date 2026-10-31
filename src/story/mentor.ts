import { st } from '../save/story-progress';
import { COVI } from '../data/covi';
import { CHARS as C } from '../data/characters';
import { STOPS, nextStop, type Stop } from './goals';
import { team, level } from './growth';

/* Antonio's guide: the ghost of Marcus Tullius Cicero, who died at Formia in 43 BC and has his tomb on the Appia
   (and in Italian a guide is still a "cicerone"). He opens the story explaining how things work, then stays in the
   background: at every chapter of the journey (the stops of story/goals.ts) he presents the next challenge and how
   hard it is, and the first time something happens (a defeat, a level, the night…) he explains it, once. Asked
   (the C key, or his picture), he says where Antonio is in the story and whether the team is ready. */
export const CICERO = 'Cicerone';

/** the opening of the story, when it starts from nothing */
export const OPENING: string[] = [
  'Salve, Antonio! Non spaventarti: sono un fantasma, ma di quelli simpatici. Marco Tullio Cicerone, piacere.',
  'Sì, proprio quello. Qui a Formia avevo la villa, qui sono morto nel 43 avanti Cristo, e sull\'Appia c\'è la mia tomba. Da allora faccio il cicerone: la guida, appunto.',
  'Il tuo sogno lo conosco: Formia, poi Torino, poi Chicago. Per prendere il treno per Torino ti servono le due spille di Formia: Forchetta e Costanzo le difendono nei loro covi.',
  'Ma a Formia c\'è una magia antica. Si racconta che qui vivessero i giganti Lestrigoni: la loro magia è rimasta nelle pietre, nel mare e negli ulivi, e ne nascono creature. Una lotterà con te.',
  'Come si gioca: frecce o WASD per camminare, Invio per parlare con la gente, M per il menu. Nel menu trovi la squadra, la borsa, il diario e la mappa.',
  'Le lotte sono a turni: scegli una mossa alla volta. I tipi girano in cerchio (Calma batte Caos, Caos batte Cervello, Cervello batte Chiacchiera, Chiacchiera batte Cuore, Cuore batte Calma) e chi ha il vantaggio fa più danno.',
  'Lottando si sale di livello e si guadagnano euro: con gli euro compri retini, tielle e caffè nei negozi della città.',
  'In alto a sinistra c\'è sempre la prossima tappa, con la freccia. Io resto qui in basso: quando hai un dubbio premi C, o tocca il mio ritratto. Prima tappa: Gianola, dal guardaparco. Andiamo!'
];

/** each chapter of the journey: what Cicero says when it becomes the next one, and when it is done */
export const CHAPTERS: Record<string, { title: string; intro: string[]; done: string[] }> = {
  starter: { title: 'La prima creatura',
    intro: ['Prima regola del viaggio: non si parte mai da soli.', 'Al Parco di Gianola, sotto la villa del mio vecchio conoscente Mamurra, il guardaparco custodisce tre creature appena nate. Vai a sceglierne una: segui la freccia, verso est.'],
    done: ['Ottima scelta! Una creatura cresce con te: ogni lotta le dà esperienza, a certi livelli impara mosse nuove e poi cambia forma.', 'Le selvatiche le trovi a Gianola, al Parco Gramsci, in pineta, sugli scogli, negli uliveti e sui monti: battile per allenarti, o catturale con un retino.'] },
  padel: { title: 'Una partita al Bruno Zauli',
    intro: ['Ora un po\' di sport: Andrea ti aspetta al Bruno Zauli per il padel.', 'Le attività non si perdono: danno esperienza ad Antonio e qualche euro.'],
    done: ['Ben giocato. Ogni livello di Antonio vale un punto abilità: spendilo nel menu, alla voce Squadra.'] },
  'covo-circolo': { title: 'Il primo covo: Forchetta',
    intro: ['Ed eccoci alla prima vera sfida: Forchetta, nei campi coperti del Bruno Zauli.', 'È di tipo Calma e di livello 9: la Calma perde contro il Cuore e batte il Caos. Pensa bene a chi mandare in campo.'],
    done: ['Prima spilla! Forchetta ora è con te: anche lui può scendere in campo.', 'Ne manca una sola per il treno di Torino.'] },
  quiz: { title: 'Una sera da Morgana',
    intro: ['Stasera da Morgana, a Mola, c\'è il quiz su Formia. Domande sulla mia città: le so tutte, ma non ti suggerisco. Quasi.'],
    done: ['Ora sai qualcosa in più di Formia. Io ci ho passato le estati migliori, nella mia villa.'] },
  gelato: { title: 'Un gelato da Lavezzi',
    intro: ['Un gelato da Lavezzi, in piazza Marconi: c\'è dal 1870. Ai miei tempi il gelato non esisteva. Che tristezza.'],
    done: ['Le pause servono. Anche Cesare ne faceva, per quanto ne so.'] },
  'covo-piazza': { title: 'Il secondo covo: Costanzo',
    intro: ['In piazza della Vittoria Costanzo tiene il suo comizio. Di comizi me ne intendo: le Catilinarie le ho scritte io.', 'È di tipo Chiacchiera e di livello 6: il Cervello lo batte, e Antonio è Cervello. Approfittane.'],
    done: ['Hai zittito un oratore! Con due spille il treno per Torino ti aspetta.', 'Ma prima finisci il giro: ci sono ancora cose tue sparse per Formia.'] },
  'item-caricabatterie': { title: 'Il caricabatterie perduto',
    intro: ['Antonio, perdi le cose come io perdevo la pazienza con Catilina.', 'Il caricabatterie del robot è dalle parti della stazione. Ritrovalo e nelle lotte della storia non lo perderai più.'],
    done: ['Uno in meno. Sim-to-Real non resterà più bloccata.'] },
  'item-appunti': { title: 'Gli appunti di Castellone',
    intro: ['Gli appunti di Diagnosi Energetica sono sui gradini di Sant\'Erasmo, a Castellone. Il borgo è antico: guarda bene tra i vicoli.'],
    done: ['Appunti ritrovati. Io i miei li facevo copiare da Tirone, il mio segretario: ti servirebbe.'] },
  windsurf: { title: 'Vento a Vindicio',
    intro: ['A Vindicio c\'è vento: Nicola Spadea, il campione, ti aspetta all\'Eclipse per una lezione di windsurf.', 'Tieni la vela nelle raffiche: è come tenere un discorso, ci vuole equilibrio.'],
    done: ['Hai planato! Ai miei tempi sul golfo c\'erano solo le triremi.'] },
  volley: { title: 'Beach volley all\'Eclipse',
    intro: ['All\'Eclipse Valentin cerca gente per il beach volley. Una partita, e si riparte.'],
    done: ['Bene. Un corpo allenato aiuta la mente: lo scrivevo anch\'io.'] },
  'item-portafoglio': { title: 'Il portafoglio sotto l\'ombrellone',
    intro: ['Il portafoglio è sotto un ombrellone dell\'Eclipse. Senza soldi niente retini e niente tielle.'],
    done: ['Portafoglio al sicuro. Gli euro ti servono nei negozi.'] },
  corsa: { title: 'Una corsa in pineta',
    intro: ['Zendavid corre in pineta, a Vindicio. Una corsetta tra i pini, prima dell\'ultima tappa.'],
    done: ['Fiato e gambe: sei pronto per l\'ultima tappa.'] },
  'item-passaporto': { title: 'Il passaporto alla mia tomba',
    intro: ['L\'ultima cosa: il passaporto. È ai piedi della mia tomba, sull\'Appia verso Itri.', 'Sì, la mia tomba. Passa a salutarmi: lì mi sento a casa.'],
    done: ['Passaporto ritrovato. Senza quello, altro che Chicago.'] },
  torino: { title: 'Il treno per Torino',
    intro: ['Hai fatto tutto il giro di Formia! In stazione il capotreno ti dirà del treno per Torino.', 'Io resto a Formia, è la mia città da duemila anni. Ma ti seguirò da lontano. O tempora, o mores… o treni!'],
    done: [] }
};

/** the first time something happens, Cicero explains it (once) */
export const TIPS: Record<string, string[]> = {
  loss: ['Hai perso? Capita anche ai consoli. Guarda i tipi: chi ha il vantaggio fa più danno.', 'E alza il livello: lotta con le creature selvatiche, fai le attività, o bevi un caffè.'],
  level: ['Antonio è salito di livello: hai un punto abilità. Menu, Squadra, Abilità: Muscoli, Pelle dura, Scatto, Memoria, Prompt engineer o Contrattare.'],
  money: ['I primi euro! Il pescatore di Mola vende i retini, il forno di Castellone la tiella, il bar di Mola il caffè.'],
  night: ['È scesa la notte. Si accendono i lampioni e le creature brillano: al Parco Gramsci e in pineta escono le civette.', 'Se vuoi il giorno, dormi nel letto di casa.'],
  wild: ['Una creatura selvatica! Battila per l\'esperienza, oppure lanciale un retino quando è stanca: più è stanca, più è facile.'],
  trainer: ['Un allenatore: manda le sue creature una dopo l\'altra. La tua tiene i PS che le restano; se cade, puoi mandarne un\'altra della squadra.'],
  evolve: ['Hai visto? È la magia dei Lestrigoni: a un certo livello una creatura cambia forma, e diventa più forte.'],
  catch: ['Presa! Le creature catturate entrano nella squadra: nel menu puoi darle un nome e scegliere chi ti segue.'],
  lamo: ['Ora che hai conquistato Formia ti dico un segreto. Si racconta che di notte, sotto le mura di Castellone, si svegli Lamo, il re dei Lestrigoni.',
    'È fortissimo e non si fa prendere facilmente: portaci la squadra migliore e tanti retini da pesca. Se è giorno, dormi a casa fino a sera.']
};
/** a tip, the first time only: null after */
export function tipOnce(id: string): string[] | null {
  if (!TIPS[id] || st.seen['cic-' + id]) return null;
  st.seen['cic-' + id] = true;
  return TIPS[id];
}

/** the strongest of Antonio's team, to compare with a challenge */
function best(): number { return Math.max.apply(null, team().map(function (k) { return level(k).lv; })); }
/** a covo's level, when the stop is a covo */
function covoOf(s: Stop): number | null { var id = s.id.indexOf('covo-') === 0 ? s.id.slice(5) : null; return id && COVI[id] ? COVI[id].level : null; }
/** what Cicero says when asked: the chapter, the challenge, and whether the team is ready */
export function advice(): string[] {
  var s = nextStop(), ch = CHAPTERS[s.id], done = STOPS.filter(function (x) { return x.done(); }).length;
  var out = ['Capitolo ' + (done + 1) + ' di ' + STOPS.length + ': ' + (ch ? ch.title : s.text) + '.'].concat(ch ? ch.intro : [s.tip]);
  var lv = covoOf(s);
  if (lv) {
    var b = best(), who = C[COVI[s.id.slice(5)].leader].name;
    out.push(b >= lv ? 'La tua squadra arriva al livello ' + b + ' e ' + who + ' è al ' + lv + ': sei pronto.' : 'La tua squadra arriva al livello ' + b + ', ' + who + ' è al ' + lv + ': allenati ancora un po\' con le creature selvatiche, poi sfidalo.');
  }
  if (!st.seen.starter && s.id !== 'starter') out.push('E non dimenticare: al Parco di Gianola il guardaparco ha una creatura per te.');
  return out;
}
/** the chapter the story has just moved to, with a word on the one just finished (for the bubble in the corner), once */
export function chapterNow(): { title: string; text: string; done: string | null } | null {
  var s = nextStop();
  if (st.seen['cap-' + s.id]) return null;
  st.seen['cap-' + s.id] = true;
  var fin = STOPS.filter(function (x) { return x.done() && !st.seen['fin-' + x.id]; });
  fin.forEach(function (x) { st.seen['fin-' + x.id] = true; });
  var last = fin.length ? CHAPTERS[fin[fin.length - 1].id] : null, ch = CHAPTERS[s.id];
  return ch ? { title: ch.title, text: ch.intro[0], done: last && last.done.length ? last.done[0] : null } : null;
}
