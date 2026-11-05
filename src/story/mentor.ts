import { st } from '../save/story-progress';
import { COVI } from '../data/covi';
import { CHARS as C } from '../data/characters';
import { STOPS, nextStop, type Stop } from './goals';
import { team, level } from './growth';
import { TRAINERS } from '../data/trainers';

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
  'Perché un fantasma si fa vedere proprio adesso? Perché a Formia sta per succedere qualcosa, e qualcuno dovrà accorgersene. Mi sa che quel qualcuno sei tu.',
  'A Formia c\'è una magia antica: nelle pietre, nel mare e negli ulivi dormono creature che non trovi in nessun libro. Una lotterà con te.',
  'E non sei l\'unico a cercare. Di notte, tra le rovine di Gianola, qualcuno scava. Cosa cerca? Non lo so ancora. E a me, questo, non piace.',
  'Come si gioca: frecce o WASD per camminare, Invio per parlare con la gente, M per il menu. Nel menu trovi la squadra, la borsa, il diario e la mappa.',
  'Le lotte sono a turni: scegli una mossa alla volta. Le creature lottano con le creature, le persone con le persone. I tipi girano in cerchio (Calma batte Caos, Caos batte Cervello, Cervello batte Chiacchiera, Chiacchiera batte Cuore, Cuore batte Calma) e chi ha il vantaggio fa più danno.',
  'Lottando si sale di livello e si guadagnano sesterzi, le monete della Formia romana: con quelli compri retini, tielle e caffè.',
  'In alto a sinistra c\'è sempre la prossima tappa, con la freccia. Io resto qui in basso: quando hai un dubbio premi C, o tocca il mio ritratto. Prima tappa: Gianola, dal guardaparco. Andiamo!'
];

/** each chapter of the journey: what Cicero says when it becomes the next one, and when it is done */
export const CHAPTERS: Record<string, { title: string; intro: string[]; done: string[] }> = {
  starter: { title: 'La prima creatura',
    intro: ['Prima regola del viaggio: non si parte mai da soli.', 'Al Parco di Gianola, sotto le rovine di una villa romana, il guardaparco custodisce tre creature appena nate. Vai a sceglierne una: segui la freccia, verso est.'],
    done: ['Ottima scelta! Una creatura cresce con te: ogni lotta le dà esperienza, a certi livelli impara mosse nuove e poi cambia forma.', 'Le selvatiche non si vedono: si nascondono nell\'erba alta (Parco Gramsci, pineta, uliveti, monti) e nelle pozze tra gli scogli (Gianola, la Scogliera). Passaci in mezzo e salteranno fuori: battile per allenarti, o catturale con un retino.'] },
  'trama-scavi': { title: 'Gli scavi di Gianola',
    intro: ['A Gianola, tra le rovine della villa romana, qualcuno scava con la pala. Di notte, in giacca e cravatta. Strano, no?', 'Ora hai una creatura: andiamo a vedere chi è. Le creature lottano con le creature.'],
    done: ['Uomini di Mamurra, e cercano le Pietre di Telepilo. Questa storia è più grande di un giro per Formia.'] },
  'trama-archivio': { title: 'Le Pietre di Telepilo',
    intro: ['Nella Torre di Mola c\'è l\'Archivio storico della città: carte, mappe, leggende. Chiedi all\'archivista delle Pietre di Telepilo.'],
    done: ['Tre pietre: delle mura, del mare, della voce. E Mamurra le vuole tutte.'] },
  'trama-cisterna': { title: 'L\'uomo del Cisternone',
    intro: ['A Castellone uno degli uomini di Mamurra cerca di entrare nel Cisternone: una cisterna romana del primo secolo avanti Cristo, sotto le case del borgo. Fermalo.'],
    done: ['La porta non si apre con la forza: ci vuole una parola.'] },
  'trama-mura': { title: 'La parola delle mura',
    intro: ['La signora del teatro abita dentro il teatro romano: chi meglio di lei conosce le pietre di Castellone?'],
    done: ['La porta del Cisternone è aperta. Nessuno ci entra da secoli.'] },
  'trama-dentro': { title: 'Nel Cisternone',
    intro: ['Scendi dal cartello davanti al Cisternone. Là sotto è buio: guarda le lastre del pavimento e le grate, hanno gli stessi colori.'],
    done: ['La Pietra delle Mura è con te. Ne mancano due.'] },
  'trama-mare': { title: 'Le peschiere di Caposele',
    intro: ['A Caposele, lungo il mare, ci sono le peschiere romane: vasche di pietra dove i Romani allevavano i pesci. Un sub di Mamurra ci si immerge da giorni.'],
    done: ['La Pietra del Mare! Ne manca una, e so bene dov\'è.'] },
  'trama-voce': { title: 'La Pietra della Voce',
    intro: ['La terza pietra la custodisce un oratore. Sono io, Antonio. Vieni alla mia tomba, sull\'Appia: ti farò tre domande su Formia.'],
    done: ['Hai tutte e tre le pietre. Ora Mamurra verrà a cercarti.'] },
  'trama-mamurra': { title: 'Il fantasma di Mamurra',
    intro: ['Alla sua villa di Gianola ti aspetta Mamurra in persona, con tre creature evolute. Allenati, porta le tielle, e scegli bene chi mandare.', 'Non è una lotta come le altre: c\'è in gioco Formia.'],
    done: ['Mamurra è caduto. Formia ti deve un favore.'] },
  padel: { title: 'Una partita al Bruno Zauli',
    intro: ['Ora un po\' di sport: Andrea ti aspetta al Bruno Zauli per il padel.', 'Le attività non si perdono: danno esperienza ad Antonio e qualche sesterzio.'],
    done: ['Ben giocato. Ogni livello di Antonio vale un punto abilità: spendilo nel menu, alla voce Squadra.'] },
  'covo-circolo': { title: 'Il primo covo: Forchetta',
    intro: ['Ed eccoci alla prima vera sfida: Forchetta, nei campi coperti del Bruno Zauli.', 'È di tipo Calma e di livello 9: la Calma perde contro il Cuore e batte il Caos. Pensa bene a chi mandare in campo.'],
    done: ['Prima spilla! Forchetta ora è con te: anche lui può scendere in campo.', 'Ne manca una sola. A cosa servono? Lo scoprirai alla stazione.'] },
  quiz: { title: 'Una sera da Morgana',
    intro: ['Stasera da Morgana, a Mola, c\'è il quiz su Formia. Domande sulla mia città: le so tutte, ma non ti suggerisco. Quasi.'],
    done: ['Ora sai qualcosa in più di Formia. Io ci ho passato le estati migliori, nella mia villa.'] },
  gelato: { title: 'Un gelato da Lavezzi',
    intro: ['Un gelato da Lavezzi, in piazza Marconi: c\'è dal 1870. Ai miei tempi il gelato non esisteva. Che tristezza.'],
    done: ['Le pause servono. Anche Cesare ne faceva, per quanto ne so.'] },
  'covo-piazza': { title: 'Il secondo covo: Costanzo',
    intro: ['In piazza della Vittoria Costanzo tiene il suo comizio. Di comizi me ne intendo: le Catilinarie le ho scritte io.', 'È di tipo Chiacchiera e di livello 6: il Cervello lo batte, e Antonio è Cervello. Approfittane.'],
    done: ['Hai zittito un oratore! Con due spille, alla stazione qualcuno ti aspetta.', 'Ma prima finisci il giro: ci sono ancora cose tue sparse per Formia.'] },
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
    done: ['Portafoglio al sicuro: i sesterzi ti servono nei negozi.'] },
  corsa: { title: 'Una corsa in pineta',
    intro: ['Zendavid corre in pineta, a Vindicio. Una corsetta tra i pini, prima dell\'ultima tappa.'],
    done: ['Fiato e gambe: sei pronto per l\'ultima tappa.'] },
  'item-passaporto': { title: 'Il passaporto alla mia tomba',
    intro: ['L\'ultima cosa: il passaporto. È ai piedi della mia tomba, sull\'Appia verso Itri.', 'Sì, la mia tomba. Passa a salutarmi: lì mi sento a casa.'],
    done: ['Passaporto ritrovato. Chissà fin dove ti porterà.'] },
  torino: { title: 'Il treno per Torino',
    intro: ['Hai fatto tutto il giro di Formia! In stazione il capotreno ti dirà del treno per Torino.', 'Io resto a Formia, è la mia città da duemila anni. Ma ti seguirò da lontano. O tempora, o mores… o treni!'],
    done: [] }
};

/** the first time something happens, Cicero explains it (once) */
export const TIPS: Record<string, string[]> = {
  loss: ['Hai perso? Capita anche ai consoli. Guarda i tipi: chi ha il vantaggio fa più danno.', 'E alza il livello: lotta con le creature selvatiche, fai le attività, o bevi un caffè.'],
  level: ['Antonio è salito di livello: hai un punto abilità. Menu, Squadra, Abilità: tre strade, l\'Esploratore di Formia, l\'Allenatore di creature e il Formiano doc.', 'Non sono numeri: ognuna cambia qualcosa del viaggio. Meno incontri nell\'erba, catture più facili, creature che resistono per te…'],
  money: ['I primi sesterzi! Il retaio di Gianola vende i retini, il forno di Castellone la tiella, il bar di Mola il caffè.'],
  power: ['Le creature hanno dei poteri. Quelle del mare ti portano a nuoto, quelle dei muri e degli alberi ti fanno salire sulle mura di Castellone, quelle con le ali ti mostrano Formia dall\'alto (tasto V).', 'Cammina verso il mare o contro le mura: se una tua creatura può aiutarti, te lo dice.'],
  night: ['È scesa la notte. Si accendono i lampioni e le creature brillano: nell\'erba alta del Parco Gramsci e della pineta escono le civette.', 'Se vuoi il giorno, dormi nel letto di casa.'],
  wild: ['Una creatura selvatica! Lottano le tue creature, una dopo l\'altra: tu scendi in campo solo se cadono tutte.', 'Battila per l\'esperienza, oppure catturala: stancala, poi tocca un retino nella Borsa, sotto le mosse. Più è stanca, più è facile.',
    'Tra le creature conta la magia delle mosse. Oltre ai cinque tipi delle persone ne hanno cinque tutti loro: Corrente, Calore, Cielo, Corazza e Crepuscolo. Ogni tipo ne batte due: chi batte chi lo trovi nella Scheda della lotta.'],
  surge: ['Tu e una delle tue creature vi capite, ormai: tre cuori. Vuol dire che può sentire la magia dei luoghi.', 'In lotta, ogni colpo critico o superefficace, dato o preso, porta Slancio: i tre pallini accanto al nome. Pieni, una volta a lotta, c\'è la Risonanza: prende il tipo del posto, si riprende un po\' e il colpo dopo fa male davvero. Scegli bene quando.'],
  legend: ['Una leggenda, Antonio. Questa non è una creatura qualunque: la lotta ha tre parti, e a ogni parte cambia.', 'Il retino regge solo nell\'ultima, e serve tutta la squadra. Se vedi che carica un colpo, hai un turno per decidere chi lo prende.'],
  trainer: ['Un allenatore: manda le sue creature una dopo l\'altra, e tu le tue. Ognuna tiene i PS che le restano; se cadono tutte, puoi scendere in campo tu.'],
  bench: ['Con più creature si lotta meglio: nella lotta c\'è il pulsante Cambia. Costa il turno, ma chi entra è in guardia e prende metà del colpo, e chi aspetta riprende fiato.', 'E quando un allenatore sta per mandare la creatura dopo, ti lascia il tempo di cambiare.'],
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
/** the battles of the plot: whose creatures, and the strongest of them */
const PLOT_FOE: Record<string, string> = { 'trama-scavi': 'mamurr-scavi', 'trama-cisterna': 'mamurr-cisterna', 'trama-mare': 'mamurr-peschiere', 'trama-mamurra': 'mamurra' };
function plotFoe(s: Stop): { who: string; lv: number } | null {
  var tr = PLOT_FOE[s.id] ? TRAINERS[PLOT_FOE[s.id]] : null;
  return tr ? { who: tr.title.replace(/^(L'|Il |La )/, function (m) { return m.toLowerCase(); }), lv: Math.max.apply(null, tr.team.map(function (t) { return t.lv; })) } : null;
}
/** what Cicero says when asked: the chapter, the challenge, and whether the team is ready */
export function advice(): string[] {
  var s = nextStop(), ch = CHAPTERS[s.id], done = STOPS.filter(function (x) { return x.done(); }).length;
  var out = ['Capitolo ' + (done + 1) + ' di ' + STOPS.length + ': ' + (ch ? ch.title : s.text) + '.'].concat(ch ? ch.intro : [s.tip]);
  var lv = covoOf(s);
  if (lv) {
    var b = best(), who = C[COVI[s.id.slice(5)].leader].name;
    out.push(b >= lv ? 'La tua squadra arriva al livello ' + b + ' e ' + who + ' è al ' + lv + ': sei pronto.' : 'La tua squadra arriva al livello ' + b + ', ' + who + ' è al ' + lv + ': allenati ancora un po\' con le creature selvatiche, poi sfidalo.');
  }
  var pf = plotFoe(s);
  if (pf && team().some(function (k) { return k !== 'antonio'; })) {
    var c = Math.max.apply(null, (st.mons || []).map(function (m) { return level(m.uid).lv; }));
    out.push(c >= pf.lv ? 'Le sue creature arrivano al livello ' + pf.lv + ', le tue al ' + c + ': puoi farcela.' : 'Le sue creature arrivano al livello ' + pf.lv + ', le tue al ' + c + ': allenati nell\'erba alta, prima.');
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
