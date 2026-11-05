import type { FriendId } from './characters';
import type { SpeciesId } from './creatures';
import type { ItemId } from './growth';

/* Missions that only one of the friends can do. Each one is someone on the map (`npc`) with a problem that fits that friend
   and nobody else: to anyone else it says who it is waiting for, once, and goes on as usual. The way to do it is a battle
   (`trainer`, in data/trainers.ts) or a few questions (`quiz`): a wrong answer costs nothing. `who` must be the one being
   played: the others cannot help. story/missions.ts holds the rules, ui/plot.ts plays them. */
export interface MissionQuestion { q: string; a: string[]; ok: number; yes: string; no: string }
export interface Mission {
  id: string;
  /** the only one who can do it */
  who: FriendId;
  /** who asks, and where it is said in the menu */
  npc: string;
  name: string;
  where: string;
  /** what it says to anyone else, and to the right one */
  wait: string[];
  ask: string[];
  /** a battle or some questions */
  trainer?: string;
  quiz?: MissionQuestion[];
  /** when it is done */
  done: string[];
  /** what it brings: sesterzi, things for the bag, and a creature for the team of who did it */
  pay: { money: number; items?: Partial<Record<ItemId, number>>; mon: SpeciesId };
}
export const MISSIONS: Mission[] = [
  { id: 'router', who: 'antonio', npc: 'vicina', name: 'Il router della vicina', where: 'Parco la Fontana',
    wait: ['Mi si è fermato internet. Mi serve quello che studia queste cose, il ragazzo del piano di sopra. {Antonio}, si chiama.'],
    ask: ['Antonio! Giusto te. Internet non va da stamattina e mia nipote mi chiama sul telefono fisso.', 'Tu che sei ingegnere: ci guardi?'],
    quiz: [
      { q: 'La vicina ti indica una scatola con delle lucine. Sono tutte rosse. Cosa fai?', a: ['La smonti per capire', 'Spegni e riaccendi', 'Scrivi un paper'], ok: 1, yes: 'Le lucine lampeggiano. Sembra che ci stiano pensando.', no: 'La vicina ti guarda come si guarda uno che ha studiato troppo.' },
      { q: 'Una lucina resta rossa. Dietro la scatola un cavo penzola nel vuoto.', a: ['Lo rimetti dov\'era', 'Chiedi all\'IA', 'Dichiari il cavo fuori standard'], ok: 0, yes: 'Tutte verdi. La vicina si fa il segno della croce.', no: 'Il cavo continua a penzolare, indifferente.' }
    ],
    done: ['Sei un genio! Tieni, ho fatto la tiella. Ah, e questa creatura dorme sul mio balcone da mesi: portatela via, ti prego.'],
    pay: { money: 60, items: { tiella: 3 }, mon: 'lumacotta' } },
  { id: 'comizio', who: 'costanzo', npc: 'tifoso', name: 'Il comizio del bar', where: 'Il bar di Mola',
    wait: ['Qui al bar non si ascolta più nessuno: chi vuole la tiella di polpo contro chi la vuole di scarola. Ci vorrebbe uno che sa parlare alla gente. Uno che non si ferma mai.', 'Ma sì: portami Costanzo.'],
    ask: ['Costanzo! Il bar è spaccato in due. Sali sulla sedia e fai qualcosa.'],
    quiz: [
      { q: 'Dal fondo gridano: «E TU CHI SEI?»', a: ['Nessuno, passavo di qua', 'GIÀ LO SAI', 'Mi chiamo Costanzo'], ok: 1, yes: 'Il bar ammutolisce. Lo sanno.', no: 'Qualcuno ride. Male.' },
      { q: 'Dal banco: «Ma ce l\'hai un programma?»', a: ['Daje Roma daje', 'Ci sto lavorando', 'Lo chiedo ad Andrea'], ok: 0, yes: 'Metà del bar si alza in piedi. Non si sa perché.', no: 'Silenzio. Un cucchiaino cade.' },
      { q: 'L\'ultimo, il più cattivo: «E il bidet?»', a: ['Aboliamolo', 'Il bidet non si tocca', 'Quale bidet?'], ok: 1, yes: 'Applausi. Qualcuno piange.', no: 'Fischi. Da quella parte non si passa.' }
    ],
    done: ['Tiella di polpo E di scarola: ha vinto la democrazia. Offre il bar.', 'Questa gatta dorme sul bancone e non ascolta nessuno. A te però ti guarda.'],
    pay: { money: 80, mon: 'micetto' } },
  { id: 'finale', who: 'forchetta', npc: 'tennista', name: 'La finale del circolo', where: 'Il Bruno Zauli',
    wait: ['Sto cercando Forchetta. Gli devo una rivincita da due anni, e non mi risponde ai messaggi. O mi risponde cose che non capisco.'],
    ask: ['Forchetta! Finalmente. Niente racchette, oggi: lottiamo con le creature. Chi perde paga il campo.'],
    trainer: 'tennista',
    done: ['Poteva andare peggio, eh? Per me no.', 'Tieni, questo falco viene sempre a guardare le partite. Tifa per chi vince.'],
    pay: { money: 90, items: { corno: 1 }, mon: 'falchetto' } },
  { id: 'conti', who: 'andrea', npc: 'gelataio', name: 'I conti del gelataio', where: 'Piazza Marconi',
    wait: ['Con questi conti impazzisco. Mi servirebbe uno bravo con i numeri. Andrea, quello del padel, dicono che calcoli tutto.'],
    ask: ['Andrea! Tre righe di conti e ti faccio un cono doppio.'],
    quiz: [
      { q: 'Un cono costa 3 sesterzi. Il sabato ne vendo 40. Quanto incasso?', a: ['120', '90', '140'], ok: 0, yes: 'Centoventi. Lo sapevi prima che finisse la domanda.', no: 'Il gelataio scuote la testa. Il 94% delle volte non sbagli: questa è il 6.' },
      { q: 'Un litro di gelato fa 20 coni. Per 40 coni quanti litri servono?', a: ['1', '2', '4'], ok: 1, yes: 'Due. Statisticamente inevitabile.', no: 'Ricontrolla. Con calma.' },
      { q: 'Se regalo un cono ogni dieci, su 40 coni quanti ne regalo?', a: ['2', '10', '4'], ok: 2, yes: 'Quattro. E consigli di smettere.', no: 'Non è il tuo giorno. Riprova.' }
    ],
    done: ['Avevi ragione: smetto di regalarli. Tieni, questa stella marina è caduta nella vaschetta del pistacchio. Non chiedermi come.'],
    pay: { money: 70, items: { ciambella: 1 }, mon: 'stellina' } },
  { id: 'festa', who: 'valentin', npc: 'barista', name: 'La festa all\'Eclipse', where: 'Eclipse beach, Vindicio',
    wait: ['Stasera qui non si muove nessuno. Ci vorrebbe l\'anima della festa. Valentin, dove sei quando servi?'],
    ask: ['Valentin! Il dj si è fermato, e c\'è uno che dice che bisogna andare a dormire alle dieci. Pensaci tu.'],
    trainer: 'guastafeste',
    done: ['Weee! Sono rimasti tutti fino all\'alba. Anche quello delle dieci.', 'Questa lucciola non se ne vuole andare. Viene con te?'],
    pay: { money: 90, items: { oliva: 1 }, mon: 'lucciolina' } },
  { id: 'serata', who: 'zendavid', npc: 'oste', name: 'La serata a Morgana', where: 'Birreria Morgana',
    wait: ['Stasera il palco è vuoto, e la sala si annoia. Mi serve uno che faccia ridere. Più o meno. Zendavid, per esempio.'],
    ask: ['Zendavid! Sali sul palco. Il pubblico è difficile: finisci le battute, e guarda di farle ridere.'],
    quiz: [
      { q: 'Qual è il colmo per un idraulico?', a: ['Non capire un tubo', 'Avere un rubinetto', 'Prendere l\'acqua'], ok: 0, yes: 'Qualcuno ride. Sul serio.', no: '…nessuno ride. Cri cri.' },
      { q: 'Sai perché gli scheletri non litigano mai?', a: ['Sono morti', 'Non hanno fegato', 'Sono ossa dure'], ok: 1, yes: 'Ride anche l\'oste. Bau.', no: '…nessuno ride. Metti le cuffie, respira, riprova.' },
      { q: 'Qual è il colmo per un elettricista?', a: ['Prendere la scossa', 'Avere le bollette', 'Restare folgorato da una ragazza'], ok: 2, yes: 'Stavolta ridono tutti!', no: '…nessuno ride. Però un cane abbaia.' }
    ],
    done: ['Non ci credo: hanno riso. Tieni, questa ginestra è cresciuta nel vaso del palco. È tua.'],
    pay: { money: 80, items: { fetta: 1 }, mon: 'ginestrella' } }
];
