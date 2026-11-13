/* The quizzes at the doors of three covi (13 November 2026, Antonio: «per sfidare Andrea devi fare giuste domande di
   probabilità, per Davide domande su Kanye, per Costanzo qualcosa di politico»). Whoever stands at the door asks
   `ask` questions picked from the pool, one at a time, the answers in a new order each time: all right, and he steps
   aside; one wrong, and he fights (he is an adept, data/adepts.ts), and beaten he steps aside too. The first answer of
   each question is the right one (the screen shuffles them). The facts are checked: the dates of the albums, the articles
   of the Constitution; the civic questions ask how things are, never what to think of them. */
export interface Question { q: string; a: [string, string, string]; why: string }
export interface Quiz { id: string; trainer: string; ask: number; pool: Question[]; ok: string[]; wrong: string }

export const QUIZZES: Record<string, Quiz> = {
  /* Andrea's tower, the first door: dice, coins and cards */
  dadi: { id: 'dadi', trainer: 'croupier', ask: 3, wrong: 'Sbagliato. Il banco vince.', ok: ['Tre su tre. Il banco paga. Prego, si sale.'], pool: [
    { q: 'Lanci due dadi. Qual è la probabilità di fare doppio sei?', a: ['1/36', '1/12', '1/6'], why: 'Un sesto per un sesto: 1/36.' },
    { q: 'Lanci una moneta tre volte. Probabilità di tre teste di fila?', a: ['1/8', '1/6', '3/8'], why: 'Un mezzo, tre volte: 1/8.' },
    { q: 'Qual è il valore atteso di un dado a sei facce?', a: ['3,5', '3', '4'], why: '(1+2+3+4+5+6)/6 = 3,5.' },
    { q: 'Lanci due monete. Probabilità di almeno una testa?', a: ['3/4', '1/2', '2/3'], why: 'Uno meno la probabilità di due croci: 1 − 1/4.' },
    { q: 'Peschi una carta da un mazzo di 52. Probabilità che sia un asso?', a: ['1/13', '1/52', '1/4'], why: 'Quattro assi su 52 carte: 1/13.' },
    { q: 'Con due dadi, qual è la somma più probabile?', a: ['7', '6', '12'], why: 'Il 7 esce in sei modi su 36: più di ogni altra somma.' },
    { q: 'Lanci un dado. Probabilità di un numero pari?', a: ['1/2', '1/3', '1/6'], why: 'Tre facce pari su sei.' }
  ] },
  /* Andrea's tower, the second door: the famous traps */
  monty: { id: 'monty', trainer: 'bayesiana', ask: 3, wrong: 'Sbagliato. Aggiorno la stima: in basso.', ok: ['Stima aggiornata: ragioni da statistico. Andrea è di sopra.'], pool: [
    { q: 'Tre porte, dietro una c\'è un\'auto. Scegli la prima; il conduttore apre la terza: una capra. Ti conviene cambiare porta?', a: ['Sì: cambiando vinci 2 volte su 3', 'No: ormai è metà e metà', 'È uguale: 1/3 in ogni caso'], why: 'È il problema di Monty Hall: la porta che resta prende anche la probabilità di quella aperta.' },
    { q: 'Quante persone servono in una stanza perché sia più probabile di no che due compiano gli anni lo stesso giorno?', a: ['23', '183', '50'], why: 'Il paradosso del compleanno: con 23 persone si supera il 50%.' },
    { q: 'Una moneta è uscita testa cinque volte di fila. Al sesto lancio, la probabilità di croce è…', a: ['1/2', 'più di 1/2', '1/64'], why: 'La moneta non ha memoria: è la fallacia del giocatore.' },
    { q: 'Un evento ha probabilità 0,94. Qual è la probabilità che non accada?', a: ['0,06', '0,6', '0,094'], why: '1 − 0,94 = 0,06. Andrea lo sa bene.' },
    { q: 'Lanci un dado sei volte. Probabilità di non fare mai sei?', a: ['(5/6)⁶, circa un terzo', 'zero', '1/6'], why: 'Cinque sesti, sei volte di fila: circa il 33%.' },
    { q: 'Due eventi indipendenti hanno probabilità 1/2 e 1/3. Probabilità che accadano entrambi?', a: ['1/6', '5/6', '1/5'], why: 'Indipendenti: si moltiplicano.' }
  ] },
  /* Zendavid's temple: Ye */
  ye: { id: 'ye', trainer: 'dj-pineta', ask: 3, wrong: 'Nooo. Quella non la sapevi. Battle!', ok: ['Tre su tre. Sei dei nostri. Bau, direbbe lui. Sali.'], pool: [
    { q: 'Come si intitola il primo album di Kanye West, uscito nel 2004?', a: ['The College Dropout', 'Graduation', 'Yeezus'], why: 'The College Dropout, febbraio 2004.' },
    { q: 'In che città è cresciuto Kanye?', a: ['Chicago', 'Atlanta', 'Los Angeles'], why: 'È nato ad Atlanta, ma è cresciuto a Chicago.' },
    { q: 'Quale album ha in copertina l\'orsetto disegnato da Takashi Murakami?', a: ['Graduation', '808s & Heartbreak', 'Donda'], why: 'Graduation, 2007: la copertina è di Murakami.' },
    { q: 'Donda, l\'album del 2021, porta il nome di…', a: ['sua madre', 'sua figlia', 'la sua città'], why: 'Donda West, sua madre.' },
    { q: 'In che anno è uscito My Beautiful Dark Twisted Fantasy?', a: ['2010', '2004', '2016'], why: 'Novembre 2010.' },
    { q: 'Come si chiama la linea di scarpe nata dalla collaborazione di Kanye con Adidas?', a: ['Yeezy', 'Pablo', 'Donda'], why: 'Yeezy.' },
    { q: 'Qual è il secondo album di Kanye, del 2005?', a: ['Late Registration', 'The Life of Pablo', 'Ye'], why: 'Late Registration, 2005.' },
    { q: 'Con chi ha fatto Kanye l\'album Watch the Throne, nel 2011?', a: ['Jay-Z', 'Kid Cudi', 'Drake'], why: 'Con Jay-Z.' },
    { q: 'Quale album del 2008 è cantato quasi tutto con l\'Auto-Tune?', a: ['808s & Heartbreak', 'Yeezus', 'Graduation'], why: '808s & Heartbreak.' },
    { q: 'Che nome si è dato ufficialmente Kanye nel 2021?', a: ['Ye', 'Yeezus', 'Pablo'], why: 'Ye: lo ha cambiato all\'anagrafe.' }
  ] },
  /* Costanzo's palace, the first door: the Constitution */
  costituzione: { id: 'costituzione', trainer: 'presidente-seggio', ask: 3, wrong: 'Risposta errata. Il seggio non può accettarla.', ok: ['Promosso all\'esame. La tessera è valida: si passa.'], pool: [
    { q: 'In che anno è entrata in vigore la Costituzione italiana?', a: ['1948', '1946', '1861'], why: 'Il 1º gennaio 1948.' },
    { q: 'Con il referendum del 2 giugno 1946 gli italiani hanno scelto…', a: ['la Repubblica', 'la Monarchia', 'il voto alle donne'], why: 'La Repubblica. Le donne votavano già quel giorno, per la prima volta in un voto nazionale.' },
    { q: 'Quanti articoli ha la Costituzione, senza le disposizioni finali?', a: ['139', '100', '250'], why: '139 articoli.' },
    { q: 'Come comincia l\'articolo 1 della Costituzione?', a: ['L\'Italia è una Repubblica democratica, fondata sul lavoro', 'Tutti i cittadini hanno pari dignità sociale', 'La sovranità appartiene al Parlamento'], why: 'E continua: la sovranità appartiene al popolo.' },
    { q: 'Quante firme servono per chiedere un referendum abrogativo?', a: ['500.000', '50.000', 'un milione'], why: 'Articolo 75: cinquecentomila elettori, o cinque Consigli regionali.' },
    { q: 'Quante sono le Regioni italiane?', a: ['20', '19', '21'], why: 'Venti, cinque a statuto speciale.' }
  ] },
  /* Costanzo's palace, the second door: how the Republic works */
  repubblica: { id: 'repubblica', trainer: 'costituzionalista', ask: 3, wrong: 'Incostituzionale!', ok: ['Tre su tre: conosci le regole. Ora vai a sentire il comizio.'], pool: [
    { q: 'Quanti anni dura il mandato del Presidente della Repubblica?', a: ['7', '5', '4'], why: 'Sette anni.' },
    { q: 'Chi elegge il Presidente della Repubblica?', a: ['Il Parlamento in seduta comune, con i delegati delle Regioni', 'I cittadini, con il voto diretto', 'Il Governo'], why: 'Articolo 83.' },
    { q: 'Dopo la riforma del 2020, quanti sono i deputati?', a: ['400', '630', '315'], why: 'Da 630 a 400, dalla legislatura del 2022.' },
    { q: 'E quanti sono i senatori elettivi?', a: ['200', '315', '100'], why: 'Da 315 a 200.' },
    { q: 'Chi nomina il Presidente del Consiglio dei ministri?', a: ['Il Presidente della Repubblica', 'Il Parlamento', 'I cittadini con il voto'], why: 'Articolo 92; poi il Governo deve avere la fiducia delle Camere.' },
    { q: 'A che età si vota per la Camera dei deputati?', a: ['18 anni', '21 anni', '25 anni'], why: 'Diciotto anni; dal 2021 anche per il Senato.' }
  ] }
};
/** the quiz of a gatekeeper, from his trainer's id */
export function quizOfTrainer(id: string): Quiz | null {
  for (const k in QUIZZES) if (QUIZZES[k].trainer === id) return QUIZZES[k];
  return null;
}
