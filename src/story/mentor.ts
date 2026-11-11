import { st } from '../save/story-progress';
import { COVI } from '../data/covi';
import { CHARS as C } from '../data/characters';
import { myStops, nextStop, npcAt, type Stop } from './goals';
import { MAPS } from '../data/maps';
import { level, team, teamMons } from './growth';
import { TRAINERS } from '../data/trainers';
import { covoLevel } from './maps';
import { firstHuman } from './growth';
import { GATES, SECOND_CITY } from '../data/gates';
import { TYPES, isPersonType } from '../data/types';
import type { FriendId } from '../data/characters';

/* Antonio's guide: the ghost of Marcus Tullius Cicero, who died at Formia in 43 BC and has his tomb on the Appia
   (and in Italian a guide is still a "cicerone"). He opens the story explaining how things work, then stays in the
   background: at every chapter of the journey (the stops of story/goals.ts) he presents the next challenge and how
   hard it is, and the first time something happens (a defeat, a level, the night…) he explains it, once. Asked
   (the C key, or his picture), he says where Antonio is in the story and whether the team is ready. */
export const CICERO = 'Cicerone';

/** the opening of the story, when it starts from nothing */
/* Four screens at most, then the first step: who he is, that something is happening, where to go. Everything else
   (types, levels, sesterzi, covi, the bench) comes in TIPS, the first time it is needed. Line 2 is where the story
   of whoever is played goes (where he lives, his covi and his train: intro() in ui/story-screen.ts). */
export const OPENING: string[] = [
  'Salve, {hero}! Non spaventarti: sono un fantasma, ma di quelli simpatici. Marco Tullio Cicerone, la tua guida: a Formia avevo la villa, e sull\'Appia c\'è la mia tomba.',
  'Mi faccio vedere perché a Formia sta per succedere qualcosa. Nelle pietre, nel mare e negli ulivi dormono creature che non trovi in nessun libro. E di notte, tra le rovine di Gianola, qualcuno scava.',
  'Frecce o WASD per camminare, o un clic dove vuoi andare; Invio per parlare, M per il menu, C per chiamare me, F per lo schermo intero. In alto c\'è sempre la prossima tappa, con la freccia. La prima: Gianola, dal guardaparco. Andiamo!'
];

/** each chapter of the journey: what Cicero says when it becomes the next one, and when it is done */
type Chapter = { title: string; intro: string[]; done: string[] };
export const CHAPTERS: Record<string, Chapter> = {
  starter: { title: 'La prima creatura',
    intro: ['Prima regola del viaggio: non si parte mai da soli.', 'Al Parco di Gianola, sotto le rovine di una villa romana, il guardaparco custodisce tre creature appena nate. Vai a sceglierne una: segui la freccia, verso est.'],
    done: ['Ottima scelta! Una creatura cresce con te: ogni lotta le dà esperienza, a certi livelli impara mosse nuove e poi cambia forma.', 'Le selvatiche non si vedono: si nascondono nell\'erba alta (Parco Gramsci, pineta, uliveti, monti) e nelle pozze tra gli scogli (Gianola, la Scogliera). Passaci in mezzo e salteranno fuori: battile per allenarti, o catturale con un retino.'] },
  'seconda-creatura': { title: 'La seconda creatura',
    intro: ['Una creatura sola non basta: quando è a terra, tocca a te. Cammina nell\'erba alta o tra gli scogli di Gianola, indebolisci una selvatica e lancia uno dei retini del guardaparco.', 'In lotta, con due creature, puoi cambiare: chi entra prende il colpo, ma è in guardia.'],
    done: ['Due creature! Mandale contro chi ha il tipo che battono: una batte, l\'altra regge.'] },
  'squadra-cisterna': { title: 'Una squadra per il buio',
    intro: ['Nel Cisternone si scende al buio, e là sotto vive gente strana. Non con meno di tre creature: catturane un\'altra.'],
    done: ['Tre creature: ora il Cisternone non fa più paura.'] },
  'squadra-mamurra': { title: 'Una squadra per Mamurra',
    intro: ['Mamurra ha tre creature evolute e la Ricchezza, che si rompe solo con i colpi superefficaci. Ti servono quattro creature che battano tipi diversi.'],
    done: ['Quattro creature, e di tipi diversi. Mamurra ha i soldi; tu hai una squadra.'] },
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
    intro: ['La terza pietra la custodisce un oratore. Sono io, {hero}. Vieni alla mia tomba, sull\'Appia: ti farò tre domande su Formia.'],
    done: ['Hai tutte e tre le pietre. Ora Mamurra verrà a cercarti.'] },
  'trama-mamurra': { title: 'Il fantasma di Mamurra',
    intro: ['Alla sua villa di Gianola ti aspetta Mamurra in persona, con tre creature evolute. Allenati, porta le tielle, e scegli bene chi mandare.', 'Non è una lotta come le altre: c\'è in gioco Formia.'],
    done: ['Mamurra è caduto. Formia ti deve un favore.'] },
  /* the six covi (data/covi.ts): whoever is played meets the other five, in any order; each pin makes the next one harder */
  'covo-palamendola': { title: 'Il covo di Antonio',
    intro: ['Al Palamendola, accanto a Parco la Fontana, Antonio ti aspetta: ha appena letto il paper della settimana.', 'È di tipo Cervello: il Caos gli manda all\'aria i piani.'],
    done: ['Stato dell\'arte. Ogni spilla rende più forti i covi che restano: allenati.'] },
  'covo-padel': { title: 'Il covo di Andrea',
    intro: ['Andrea ti aspetta ai campi da padel del Bruno Zauli: dice che ha calcolato tutto.', 'È di tipo Cervello: il Caos lo batte. E i colpi critici gli fanno il doppio.'],
    done: ['Non era nei dati, dice lui. Lo era nei miei.'] },
  'covo-circolo': { title: 'Il covo di Forchetta',
    intro: ['Forchetta ti aspetta nei campi coperti del Bruno Zauli. Fuori non gioca mai.', 'È di tipo Calma: la Calma perde contro il Cuore e batte il Caos. Pensa bene a chi mandare in campo.'],
    done: ['Spilla «Poteva andare peggio». Ogni spilla rende più forti i covi che restano.'] },
  quiz: { title: 'Una sera da Morgana',
    intro: ['Stasera da Morgana, a Mola, c\'è il quiz su Formia. Domande sulla mia città: le so tutte, ma non ti suggerisco. Quasi.'],
    done: ['Ora sai qualcosa in più di Formia. Io ci ho passato le estati migliori, nella mia villa.'] },
  gelato: { title: 'Un gelato da Lavezzi',
    intro: ['Un gelato da Lavezzi, in piazza Marconi: c\'è dal 1870. Ai miei tempi il gelato non esisteva. Che tristezza.'],
    done: ['Le pause servono. Anche Cesare ne faceva, per quanto ne so.'] },
  'covo-piazza': { title: 'Il covo di Costanzo',
    intro: ['In piazza della Vittoria Costanzo tiene il suo comizio. Di comizi me ne intendo: le Catilinarie le ho scritte io.', 'È di tipo Chiacchiera: il Cervello lo batte.'],
    done: ['Hai zittito un oratore! Ogni spilla rende più forti i covi che restano.'] },
  'item-caricabatterie': { title: 'Il caricabatterie perduto',
    intro: ['{hero}, perdi le cose come io perdevo la pazienza con Catilina.', 'Il caricabatterie del robot è dalle parti della stazione. Ritrovalo e nelle lotte della storia non lo perderai più.'],
    done: ['Uno in meno. Sim-to-Real non resterà più bloccata.'] },
  'item-appunti': { title: 'Gli appunti di Castellone',
    intro: ['Gli appunti di Diagnosi Energetica sono sui gradini di Sant\'Erasmo, a Castellone. Il borgo è antico: guarda bene tra i vicoli.'],
    done: ['Appunti ritrovati. Io i miei li facevo copiare da Tirone, il mio segretario: ti servirebbe.'] },
  windsurf: { title: 'Vento a Vindicio',
    intro: ['A Vindicio c\'è vento: Nicola Spadea, il campione, ti aspetta all\'Eclipse per una lezione di windsurf.', 'Tieni la vela nelle raffiche: è come tenere un discorso, ci vuole equilibrio.'],
    done: ['Hai planato! Ai miei tempi sul golfo c\'erano solo le triremi.'] },
  'covo-eclipse': { title: 'Il covo di Valentin',
    intro: ['All\'Eclipse Valentin fa festa, e la festa è sua.', 'È di tipo Caos: la Calma lo spegne. E recupera un po\' di PS a ogni turno: non farla durare.'],
    done: ['Weee! Anche la festa di Valentin ha una fine.'] },
  'item-portafoglio': { title: 'Il portafoglio sotto l\'ombrellone',
    intro: ['Il portafoglio è sotto un ombrellone dell\'Eclipse. Senza soldi niente retini e niente tielle.'],
    done: ['Portafoglio al sicuro: i sesterzi ti servono nei negozi.'] },
  'covo-pineta': { title: 'Il covo di Zendavid',
    intro: ['Zendavid è in pineta, a Vindicio, con le cuffie in testa.', 'È di tipo Cuore: la Chiacchiera lo convince di tutto. E ogni colpo che prende gli mette ansia.'],
    done: ['Bau. Anche Zendavid ha dovuto togliersi le cuffie.'] },
  'item-passaporto': { title: 'Il passaporto alla mia tomba',
    intro: ['L\'ultima cosa: il passaporto. È ai piedi della mia tomba, sull\'Appia verso Itri.', 'Sì, la mia tomba. Passa a salutarmi: lì mi sento a casa.'],
    done: ['Passaporto ritrovato. Chissà fin dove ti porterà.'] },
  torino: { title: 'Il treno per Torino',
    intro: ['Hai fatto tutto il giro di Formia! In stazione il capotreno ti dirà del treno per Torino.', 'Io resto a Formia, è la mia città da duemila anni. Ma ti seguirò da lontano. O tempora, o mores… o treni!'],
    done: [] }
};

/** the first time something happens, Cicero explains it (once) */
export const TIPS: Record<string, string[]> = {
  change: ['Attento: {mine} è di un tipo che {foe} batte. In lotta puoi cambiare creatura con «Cambia» (o il tasto C): chi entra prende il colpo, ma è in guardia e ne prende metà. Manda chi ha il tipo giusto.'],
  covo: ['Un covo: il capo manda le sue creature, tutte del suo tipo, e alla fine scende in campo lui, come farai tu quando le tue saranno a terra. Porta creature che battono il suo tipo.', 'Anche le persone hanno un tipo, e i cinque girano in cerchio: Calma batte Caos, Caos batte Cervello, Cervello batte Chiacchiera, Chiacchiera batte Cuore, Cuore batte Calma. Ogni covo vinto è una spilla, e il covo dopo sarà più forte: dal terzo, le creature del capo sono tre.'],
  loss: ['Hai perso? Capita anche ai consoli. Guarda i tipi: chi ha il vantaggio fa più danno.', 'E alza il livello: lotta con le creature selvatiche, fai le attività, o bevi un caffè.'],
  level: ['{hero} è salito di livello: lottando si diventa più forti, e ogni livello è un punto abilità. Menu, Squadra, Abilità: tre strade, l\'Esploratore di Formia, l\'Allenatore di creature e il Formiano doc.', 'Non sono numeri: ognuna cambia qualcosa del viaggio. Meno incontri nell\'erba, catture più facili, creature che resistono per te…'],
  money: ['I primi sesterzi, le monete della Formia romana! Il retaio di Gianola vende i retini, il forno di Castellone la tiella, il bar di Mola il caffè.'],
  power: ['Le creature hanno dei poteri. Quelle del mare ti portano a nuoto, quelle dei muri e degli alberi ti fanno salire sulle mura di Castellone, quelle con le ali ti mostrano Formia dall\'alto (tasto V).', 'Cammina verso il mare o contro le mura: se una tua creatura può aiutarti, te lo dice.'],
  night: ['È scesa la notte. Si accendono i lampioni e le creature brillano: nell\'erba alta del Parco Gramsci e della pineta escono le civette.', 'Se vuoi il giorno, dormi nel letto di casa.'],
  wild: ['Una creatura selvatica! Lottano le tue creature, una dopo l\'altra: tu scendi in campo solo se cadono tutte.', 'Battila per l\'esperienza, oppure catturala: stancala, poi tocca un retino nella Borsa, sotto le mosse. Più è stanca, più è facile.',
    'Tra le creature conta la magia delle mosse. Oltre ai cinque tipi delle persone ne hanno cinque tutti loro: Corrente, Calore, Cielo, Corazza e Crepuscolo. Ogni tipo ne batte due: chi batte chi lo trovi nella Scheda della lotta.'],
  hero: ['Un amico in più, {hero}. E ognuno di voi ha la sua strada: nel menu, alla voce Squadra, puoi passare a lui e giocare con le sue creature.', 'Qualcuno in città chiederà proprio di lui: certe cose le sa fare solo una persona. Guarda le Missioni, nel Viaggio.'],
  surge: ['Tu e una delle tue creature vi capite, ormai: tre cuori. Vuol dire che può sentire la magia dei luoghi.', 'In lotta, ogni colpo critico o superefficace, dato o preso, porta Slancio: i tre pallini accanto al nome. Pieni, una volta a lotta, c\'è la Risonanza: prende il tipo del posto, si riprende un po\' e il colpo dopo fa male davvero. Scegli bene quando.'],
  legend: ['Una leggenda, {hero}. Questa non è una creatura qualunque: la lotta ha tre parti, e a ogni parte cambia.', 'Il retino regge solo nell\'ultima, e serve tutta la squadra. Se vedi che carica un colpo, hai un turno per decidere chi lo prende.'],
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
/** the chapter of a stop, for whoever is played: the train is the one of his city (Torino or Milano) */
export function chapterOf(id: string): Chapter | undefined {
  var ch = CHAPTERS[id];
  /* the park is east of most homes, but west of Zendavid's, in Scauri */
  if (id === 'starter' && ch) {
    var m = MAPS.formia, home = (m.starts && m.starts[firstHuman()]) || m.start, park = npcAt('formia', 'guardaparco');
    return home[0] > park[0] ? { title: ch.title, intro: ch.intro.map(function (l) { return l.replace('verso est', 'verso ovest'); }), done: ch.done } : ch;
  }
  if (id !== 'torino' || !ch) return ch;
  var G0 = GATES[SECOND_CITY[firstHuman() as FriendId] || 'torino'], city = G0.station.replace(/ (Porta Nuova|Centrale)$/, '');
  return { title: G0.label, intro: ['Hai fatto tutto il giro di Formia! In stazione il capotreno ti dirà del treno per ' + G0.station + '.', 'Io resto a Formia, è la mia città da duemila anni. Ma ti seguirò fino a ' + city + ', da lontano. O tempora, o mores… o treni!'], done: ch.done };
}
/** what the type of whoever is played means against a covo leader, if anything: he fights last, after his creatures */
export function typeWord(leader: FriendId): string | null {
  var me = C[firstHuman() as FriendId], him = C[leader];
  if (!me || !him || !isPersonType(me.type) || !isPersonType(him.type)) return null;
  if (me.type === him.type) return 'Siete tutti e due di tipo ' + me.type + ': qui decidono le creature.';
  if (TYPES[me.type].beats === him.type) return '{hero}, tu sei di tipo ' + me.type + ': se resti l\'ultimo in campo, contro di lui parti avvantaggiato.';
  if (TYPES[him.type].beats === me.type) return 'Attento, {hero}: il suo tipo batte il tuo. Fai lottare le creature e tieniti per ultimo.';
  return null;
}
function covoOf(s: Stop): number | null { var id = s.id.indexOf('covo-') === 0 ? s.id.slice(5) : null; return id && COVI[id] ? covoLevel(id) : null; }
/** the battles of the plot: whose creatures, and the strongest of them */
const PLOT_FOE: Record<string, string> = { 'trama-scavi': 'mamurr-scavi', 'trama-cisterna': 'mamurr-cisterna', 'trama-mare': 'mamurr-peschiere', 'trama-mamurra': 'mamurra' };
function plotFoe(s: Stop): { who: string; lv: number } | null {
  var tr = PLOT_FOE[s.id] ? TRAINERS[PLOT_FOE[s.id]] : null;
  return tr ? { who: tr.title.replace(/^(L'|Il |La )/, function (m) { return m.toLowerCase(); }), lv: Math.max.apply(null, tr.team.map(function (t) { return t.lv; })) } : null;
}
/** what Cicero says when asked: the chapter, the challenge, and whether the team is ready */
export function advice(): string[] {
  var all = myStops(), s = nextStop(), ch = chapterOf(s.id), done = all.filter(function (x) { return x.done(); }).length;
  var out = ['Capitolo ' + (done + 1) + ' di ' + all.length + ': ' + (ch ? ch.title : s.text) + '.'].concat(ch ? ch.intro : [s.tip]);
  var lv = covoOf(s);
  if (lv) {
    var b = best(), who = C[COVI[s.id.slice(5)].leader].name, tw = typeWord(COVI[s.id.slice(5)].leader);
    if (tw) out.push(tw);
    out.push(b >= lv ? 'La tua squadra arriva al livello ' + b + ' e ' + who + ' è al ' + lv + ': sei pronto.' : 'La tua squadra arriva al livello ' + b + ', ' + who + ' è al ' + lv + ': allenati ancora un po\' con le creature selvatiche, poi sfidalo.');
  }
  var pf = plotFoe(s);
  if (pf && teamMons().length) {
    var c = Math.max.apply(null, teamMons().map(function (m) { return level(m.uid).lv; }));
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
  var fin = myStops().filter(function (x) { return x.done() && !st.seen['fin-' + x.id]; });
  fin.forEach(function (x) { st.seen['fin-' + x.id] = true; });
  var last = fin.length ? chapterOf(fin[fin.length - 1].id) : null, ch = chapterOf(s.id);
  return ch ? { title: ch.title, text: ch.intro[0], done: last && last.done.length ? last.done[0] : null } : null;
}
