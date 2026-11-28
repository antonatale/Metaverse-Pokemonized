import type { Move } from './characters';
import type { FriendId } from './characters';
import type { Species } from './creatures';

/* The creatures of the seven (27 November 2026, Antonio: «crea una creatura da zero per ognuno dei personaggi, fai in
   modo che siano fighe … nelle evoluzioni successive voglio che diventino decisamente più fighi e complessi, non solo
   degli animaletti»). The night of the 3:12, when the echo of the stones of Telepilo woke the creatures of Formia, one
   was born next to each of the seven friends of the caminetto, out of what each has in his head: it is nobody else's,
   it is never met in the tall grass. The one of whoever is played has been looking for him since that night, round
   Gianola (story/goals.ts, «La tua creatura»); the others stay with their friend, and the keeper of a covo sends his
   out last, grown, at the top of his tower (story/covo-crew.ts).
   - Costanzo: a caracal like the famous one of the internet, round, ear tufts down to the shoulders, who hisses and
     screams when he is left alone; then Caracalla, the emperor of the baths and of the edict; then Lincesare.
   - Claudia: Tedua, a long-haired black cat; then Teduabolica, with the horns and the lantern; then Teduarca, the
     patriarch of the Trinità, a panther of night with the castle on its head.
   - Valentin: Aru, a little hairless dog who will not leave your ankles alone; then Arumba, the dog of the party; then
     the Inguaiatore, the hound of the lightning who shouts the freestyle.
   - Forchetta: Spadino, a swordfish of the gulf; then the Spadaccino, who plays tennis with his sword; then Gladiomare,
     a knight of the deep with fins rebuilt like a prosthesis.
   - Zendavid: Gufobau, an owlet who barks, in headphones too big for him; then the Subgufo, with a speaker in its
     chest; then Bubozen, the great owl who floats cross-legged in a ring of vinyl.
   - Antonio: Leoncello, a lion cub with a mane of sparks; then the Voltaleone, wired like a lab; then the Leonauta, an
     astronaut lion, the mane a crown of solar panels.
   - Andrea: Volpalina, the winged little fox; then Volpadel, in the orange of the padel; then Volpitagora, the fox of
     the theorem, six wings and dice round it.
   Each line: a move of its own from the start, the second form's signature, the third's; drawn in
   render/svg/companions.ts, shown in ui/sig-scenes.ts. Their numbers sit a little over the three to start with. */

export type CompanionId =
  | 'pumbino' | 'caracalla' | 'lincesare'
  | 'tedua' | 'teduabolica' | 'teduarca'
  | 'aru' | 'arumba' | 'inguaiatore'
  | 'spadino' | 'spadaccino' | 'gladiomare'
  | 'gufobau' | 'subgufo' | 'bubozen'
  | 'leoncello' | 'voltaleone' | 'leonauta'
  | 'volpalina' | 'volpadel' | 'volpitagora';

/** each friend's line, from the first form to the last */
export const MINE: Record<FriendId, [CompanionId, CompanionId, CompanionId]> = {
  costanzo: ['pumbino', 'caracalla', 'lincesare'],
  claudia: ['tedua', 'teduabolica', 'teduarca'],
  valentin: ['aru', 'arumba', 'inguaiatore'],
  forchetta: ['spadino', 'spadaccino', 'gladiomare'],
  zendavid: ['gufobau', 'subgufo', 'bubozen'],
  antonio: ['leoncello', 'voltaleone', 'leonauta'],
  andrea: ['volpalina', 'volpadel', 'volpitagora']
};

const atk = (id: string, name: string, power: number, text: string, o: Partial<Move> = {}): Move => ({ id, name, kind: 'atk', power, text, ...o });
export const COMPANION_MOVES: Record<string, Move> = {
  /* Costanzo's caracal */
  soffio: { id: 'soffio', name: 'Shhh!', kind: 'status', text: 'Le orecchie all\'indietro, i denti fuori, e un soffio lungo: l\'Attacco avversario cala per 5 turni.', fx: { foe: 'atkDown' } },
  balzo: atk('balzo', 'Balzo del caracal', 55, 'Salta in alto come per prendere un uccello al volo, e ricade addosso: colpisce per primo.', { priority: 1 }),
  fusa: { id: 'fusa', name: 'Fusa da divano', kind: 'heal', uses: 2, text: 'Si butta a pancia in su sul divano e fa le fusa finché qualcuno non lo coccola: recupera il 30% dei PS.', fx: { heal: 0.3 } },
  editto: atk('editto', 'Editto di Caracalla', 85, 'Nel 212 Caracalla diede la cittadinanza romana agli uomini liberi di tutto l\'impero: lui la dà anche ai tuoi punti deboli. Danno alto, e la Difesa avversaria cala per 4 turni.', { fx: { foe: 'defDown' } }),
  arringa: atk('arringa', 'Arringa dal balcone', 90, 'Sale sul primo muretto che trova e parla alla piazza finché non gli danno ragione: danno alto, e l\'Attacco avversario cala per 5 turni.', { fx: { foe: 'atkDown' } }),
  urlocesare: atk('urlocesare', 'Urlo del Cesare', 100, 'L\'urlo di chi è rimasto solo sul divano, con la voce di un imperatore: danno altissimo, va a segno 9 volte su 10, e a volte confonde.', { acc: 0.9, fx: { conf: 0.3 } }),
  /* Claudia's black cat */
  pelonero: { id: 'pelonero', name: 'Pelo di notte', kind: 'buff', text: 'Gonfia il pelo nero fino a sembrare il doppio: Difesa +25% per 5 turni.', fx: { self: 'defUp' } },
  gattonero: atk('gattonero', 'Gatto nero', 70, 'Ti taglia la strada da sinistra a destra: danno medio, e la sfortuna a volte confonde.', { fx: { conf: 0.3 }, mtype: 'Crepuscolo' }),
  trinitaria: atk('trinitaria', 'Notte della Trinità', 100, 'Il Padre, il Figlio e lo Spirito: tre ombre di gatto saltano insieme. Danno altissimo, va a segno 9 volte su 10, critico più facile.', { acc: 0.9, crit: 0.2 }),
  /* Valentin's hairless dog */
  abbaio: { id: 'abbaio', name: 'Abbaio pestifero', kind: 'status', text: 'Abbaia, abbaia, abbaia e non smette più: confonde per 2 turni.', fx: { conf: 1 } },
  caviglie: atk('caviglie', 'Morso alle caviglie', 50, 'Piccolo e pestifero: arriva basso e morde le caviglie prima di tutti.', { priority: 1 }),
  weeefesta: atk('weeefesta', 'Weee della festa', 75, 'Parte la festa: danno medio, l\'Attacco gli sale per 5 turni e chi gli sta davanti a volte si confonde in pista.', { fx: { self: 'atkUp', conf: 0.25 }, mtype: 'Cuore' }),
  inguaia: atk('inguaia', 'Stai inguaiato', 105, 'Il freestyle che a Formia conoscono tutti, gridato in faccia: danno enorme, va a segno 85 volte su 100.', { acc: 0.85, mtype: 'Chiacchiera' }),
  /* Forchetta's swordfish */
  stoccata: atk('stoccata', 'Stoccata', 55, 'Il becco come una spada: un affondo velocissimo, che colpisce per primo.', { priority: 1 }),
  acquerello: { id: 'acquerello', name: 'Acquerello marino', kind: 'status', text: 'Dipinge l\'avversario del blu del golfo, una pennellata dopo l\'altra: la Difesa avversaria cala per 4 turni.', fx: { foe: 'defDown' } },
  servizioace: atk('servizioace', 'Servizio vincente', 85, 'Lancia la palla con la pinna, salta fuori dall\'acqua e la colpisce con la spada: un ace. Danno alto, critico più facile.', { acc: 0.9, crit: 0.2 }),
  fendente: atk('fendente', 'Fendente dell\'abisso', 100, 'La spada si accende della luce degli abissi e taglia il golfo in due: danno altissimo, va a segno 9 volte su 10.', { acc: 0.9, mtype: 'Corrente' }),
  /* Zendavid's owl */
  baugufo: { id: 'baugufo', name: 'Bau!', kind: 'status', text: 'Un gufo che abbaia: nessuno se lo aspetta. L\'Attacco avversario cala per 5 turni.', fx: { foe: 'atkDown' } },
  cuffione: { id: 'cuffione', name: 'Cuffie grosse', kind: 'buff', text: 'Si mette le cuffie e il mondo fuori sparisce: Difesa +25% per 5 turni.', fx: { self: 'defUp' } },
  dropbasso: atk('dropbasso', 'Drop del basso', 85, 'Il basso scende di colpo: le casse tremano, e l\'avversario con loro. Danno alto.', { mtype: 'Chiacchiera' }),
  enso: atk('enso', 'Cerchio zen', 95, 'Con la punta di un\'ala disegna un cerchio perfetto, come un monaco: danno alto, e recupera un terzo del danno fatto.', { drain: 0.33 }),
  /* Antonio's lion */
  ruggitino: { id: 'ruggitino', name: 'Ruggitino', kind: 'status', text: 'Un ruggito piccolo piccolo, ma convinto: l\'Attacco avversario cala per 5 turni.', fx: { foe: 'atkDown' } },
  criniera: atk('criniera', 'Criniera elettrica', 85, 'La criniera scarica come un trasformatore: danno alto, e a volte confonde.', { fx: { conf: 0.2 }, mtype: 'Caos' }),
  rientro: atk('rientro', 'Rientro atmosferico', 120, 'Un turno sale in orbita; il turno dopo rientra come una meteora: danno enorme.', { twoTurn: true, windup: '{n} sale in orbita…', mtype: 'Cielo' }),
  /* Andrea's winged fox */
  calcolo: atk('calcolo', 'Calcolo rapido', 50, 'Calcola l\'angolo giusto in un attimo: critico il 30% delle volte.', { crit: 0.3 }),
  novanta: atk('novanta', 'Al 94%', 80, 'Ha calcolato tutto: va a segno 94 volte su 100. Danno alto.', { acc: 0.94 }),
  smashpadel: atk('smashpadel', 'Smash di padel', 85, 'Smash dall\'alto: la palla sbatte sul vetro e torna indietro addosso. Danno alto.', { mtype: 'Cielo' }),
  teorema: atk('teorema', 'Teorema di Volpitagora', 100, 'Il quadrato costruito sull\'ipotenusa è uguale alla somma dei quadrati costruiti sui cateti: un colpo dimostrato, che non sbaglia mai. Danno altissimo.')
};

const S = (o: Species) => o;
export const COMPANIONS: Record<CompanionId, Species> = {
  /* ---------- Costanzo ---------- */
  pumbino: S({
    id: 'pumbino', owner: 'costanzo', abil: ['pennelli'], name: 'Pumbino', wild: 'Pumbino', type: 'Chiacchiera', stage: 1,
    stats: { hp: 96, atk: 104, def: 88, spe: 104 },
    learn: [[1, 'botta'], [1, 'soffio'], [6, 'balzo'], [12, 'fusa'], [18, 'morso'], [26, 'arringa'], [34, 'genio']],
    evolve: { at: 14, into: 'caracalla' },
    cry: { entry: 'Shhhh… mrrrAAAO!', win: 'Mrrr. Divano.', ko: 'Non lasciatemi solo…' },
    text: 'Un caracal tondo come un cuscino, con due ciuffi neri sulle orecchie lunghi fino alle spalle: somiglia al caracal più famoso di internet, quello che guarda la televisione e urla quando resta solo. È nato la notte delle 3:12 accanto a Costanzo, in piazza della Vittoria, e da allora soffia a chiunque gli si avvicini. Tranne a chi gli gratta la pancia.',
    where: 'Accanto a Costanzo', art: { body: 'caracal', main: '#d9a066', dark: '#8a5a2b', belly: '#fff1dc', accent: '#2b1d14', size: 0.8 }
  }),
  caracalla: S({
    id: 'caracalla', owner: 'costanzo', abil: ['pennelli'], name: 'Caracalla', wild: 'Caracalla', type: 'Chiacchiera', type2: 'Calore', stage: 2, sig: 'editto',
    stats: { hp: 108, atk: 118, def: 98, spe: 116 },
    learn: [[1, 'botta'], [1, 'soffio'], [6, 'balzo'], [12, 'fusa'], [14, 'editto'], [18, 'morso'], [26, 'arringa'], [34, 'genio']],
    evolve: { at: 26, into: 'lincesare', bond: 60 },
    cry: { entry: 'Cives! Shhhh!', win: 'Alle terme, adesso.', ko: 'Anche gli imperatori cadono…' },
    text: 'Ha preso il nome dell\'imperatore delle terme di Roma e dell\'editto del 212, e ne ha preso anche il carattere: la corona d\'alloro sulle orecchie, il mantello rosso, la zampa alzata quando parla. Sale sui muretti come su un balcone, e da lì arringa la piazza finché qualcuno non gli dà ragione.',
    where: 'Accanto a Costanzo', art: { body: 'caracal', main: '#d19456', dark: '#7d4a22', belly: '#fff1dc', accent: '#2b1d14', size: 0.92 }
  }),
  lincesare: S({
    id: 'lincesare', owner: 'costanzo', abil: ['pennelli', 'oratoria'], name: 'Lincesare', wild: 'Lincesare', type: 'Chiacchiera', type2: 'Calore', stage: 3, sig: 'urlocesare',
    stats: { hp: 118, atk: 132, def: 108, spe: 132 },
    learn: [[1, 'botta'], [1, 'soffio'], [6, 'balzo'], [12, 'fusa'], [14, 'editto'], [18, 'morso'], [26, 'arringa'], [26, 'urlocesare'], [34, 'genio']],
    cry: { entry: 'VENI, VIDI… SHHHH!', win: 'GIÀ LO SAI.', ko: 'Et tu, divano…' },
    text: 'Il caracal diventato Cesare: alto come un leone, la corazza d\'oro dei legionari sul petto, il mantello di porpora che si muove anche senza vento, e i ciuffi delle orecchie lunghi come due pennacchi. Quando resta solo urla, e il suo urlo ferma il traffico in piazza della Vittoria. Si dice che riconosca un solo padrone, e che abbia la voce di Costanzo.',
    where: 'In cima al Palazzo del Popolo', art: { body: 'caracal', main: '#c98a4a', dark: '#6e3f1c', belly: '#fff3e0', accent: '#2b1d14', size: 1 }
  }),
  /* ---------- Claudia ---------- */
  tedua: S({
    id: 'tedua', owner: 'claudia', abil: ['occhi'], name: 'Tedua', wild: 'Tedua', type: 'Calma', stage: 1,
    stats: { hp: 98, atk: 96, def: 98, spe: 100 },
    learn: [[1, 'botta'], [1, 'pelonero'], [6, 'graffio'], [12, 'gattonero'], [18, 'morso'], [26, 'notturno'], [34, 'saggezza']],
    evolve: { at: 14, into: 'teduabolica' },
    cry: { entry: 'Mrrrr.', win: 'Mrr. Ho capito il tuo punto.', ko: 'Miaaau…' },
    text: 'Un gatto nero dal pelo lunghissimo, tanto che quando si arrotola non si capisce dov\'è la testa: si vedono solo due occhi d\'oro. È nato la notte delle 3:12 accanto a Claudia, in via Palazzo, e la segue a un passo di distanza. Mai di più, mai di meno.',
    where: 'Accanto a Claudia', art: { body: 'blackcat', main: '#2e2838', dark: '#14111a', belly: '#4d4560', accent: '#ffd34d', size: 0.78 }
  }),
  teduabolica: S({
    id: 'teduabolica', owner: 'claudia', abil: ['settevite'], name: 'Teduabolica', wild: 'Teduabolica', type: 'Calma', type2: 'Crepuscolo', stage: 2, sig: 'gattonero',
    stats: { hp: 110, atk: 110, def: 108, spe: 112 },
    learn: [[1, 'botta'], [1, 'pelonero'], [6, 'graffio'], [12, 'gattonero'], [14, 'lucciole'], [18, 'morso'], [26, 'notturno'], [34, 'saggezza']],
    evolve: { at: 26, into: 'teduarca', bond: 60 },
    cry: { entry: 'Mrrraaah. Uno alla volta.', win: 'Tavoli separati.', ko: 'La lanterna… si spegne…' },
    text: 'Le sono spuntate due corna piccole e la coda è finita a punta di forcone: Teduabolica, la gatta diabolica. Porta appesa alla coda una lanterna che non si spegne mai, e di notte nei vicoli di San Giulio la si vede passare da un tetto all\'altro. Chi la incontra, da sinistra, cambia strada.',
    where: 'Accanto a Claudia', art: { body: 'blackcat', main: '#2a2236', dark: '#120d1a', belly: '#4b3a63', accent: '#ff5a5a', size: 0.9 }
  }),
  teduarca: S({
    id: 'teduarca', owner: 'claudia', abil: ['settevite', 'buio'], name: 'Teduarca', wild: 'Teduarca', type: 'Calma', type2: 'Crepuscolo', stage: 3, sig: 'trinitaria',
    stats: { hp: 122, atk: 124, def: 118, spe: 126 },
    learn: [[1, 'botta'], [1, 'pelonero'], [6, 'graffio'], [12, 'gattonero'], [14, 'lucciole'], [18, 'morso'], [26, 'notturno'], [26, 'trinitaria'], [34, 'saggezza']],
    cry: { entry: 'Il Padre è arrivato.', win: 'Puoi sentire anche il mio, adesso.', ko: 'Ne parliamo… con calma…' },
    text: 'La patriarca della Trinità: una pantera di notte con le ali di fumo, il castello nero di via Palazzo sulla testa come una corona, e tre occhi di luna, uno per il Padre, uno per il Figlio, uno per lo Spirito. Non salta mai: aspetta. E quando ti sei stancato di aspettare, è già dietro di te.',
    where: 'In cima al Castello del Padre', art: { body: 'blackcat', main: '#221b2e', dark: '#0e0a14', belly: '#3f3354', accent: '#c9a6ff', size: 1 }
  }),
  /* ---------- Valentin ---------- */
  aru: S({
    id: 'aru', owner: 'valentin', abil: ['freestyle'], name: 'Aru', wild: 'Aru', type: 'Caos', stage: 1,
    stats: { hp: 90, atk: 108, def: 84, spe: 110 },
    learn: [[1, 'beccata'], [1, 'abbaio'], [6, 'caviglie'], [12, 'graffio'], [18, 'morso'], [26, 'ira'], [34, 'genio']],
    evolve: { at: 14, into: 'arumba' },
    cry: { entry: 'ARU! ARU! ARU!', win: 'Arù! Weee!', ko: 'Uuuuh…' },
    text: 'Un cagnolino senza un pelo, tranne un ciuffo dritto in testa: la pelle rosa e grigia piena di pieghe, due orecchie da pipistrello e gli occhi che escono dalla testa. È nato la notte delle 3:12 accanto a Valentin, e da quella notte non ha smesso un attimo di abbaiare. Al polso, cioè alla zampa, porta un mărțișor.',
    where: 'Accanto a Valentin', art: { body: 'xolo', main: '#c9a3a0', dark: '#8a6a69', belly: '#efd3cf', accent: '#d6403a', size: 0.74 }
  }),
  arumba: S({
    id: 'arumba', owner: 'valentin', abil: ['freestyle'], name: 'Arumba', wild: 'Arumba', type: 'Caos', type2: 'Cuore', stage: 2, sig: 'weeefesta',
    stats: { hp: 100, atk: 122, def: 94, spe: 124 },
    learn: [[1, 'beccata'], [1, 'abbaio'], [6, 'caviglie'], [12, 'graffio'], [14, 'weeefesta'], [18, 'morso'], [26, 'ira'], [34, 'genio']],
    evolve: { at: 26, into: 'inguaiatore', bond: 60 },
    cry: { entry: 'Weee! Arù!', win: 'Si fa festa da me!', ko: 'La musica… si è fermata…' },
    text: 'Il cane della festa: gli occhiali verdi in testa, la catena d\'oro, le cuffie al collo e il ciuffo tinto di verde. Arriva prima della musica e se ne va dopo le luci: all\'Eclipse lo conoscono tutti, perché balla sul bancone e nessuno ha il coraggio di farlo scendere.',
    where: 'Accanto a Valentin', art: { body: 'xolo', main: '#b88f8c', dark: '#7a5856', belly: '#ebc9c4', accent: '#3fd07a', size: 0.88 }
  }),
  inguaiatore: S({
    id: 'inguaiatore', owner: 'valentin', abil: ['freestyle', 'bassa'], name: 'Inguaiatore', wild: 'L\'Inguaiatore', type: 'Caos', type2: 'Chiacchiera', stage: 3, sig: 'inguaia',
    stats: { hp: 110, atk: 138, def: 104, spe: 138 },
    learn: [[1, 'beccata'], [1, 'abbaio'], [6, 'caviglie'], [12, 'graffio'], [14, 'weeefesta'], [18, 'morso'], [26, 'ira'], [26, 'inguaia'], [34, 'genio']],
    cry: { entry: 'STAI INGUAIATOOOO!', win: 'Stai inguaiato, e lo sai.', ko: 'Il microfono… è spento…' },
    text: 'Un cane nudo grande come un lupo, nero e lucido come una pietra, con le scariche verdi che gli corrono sulla pelle e la coda a forma di microfono. Dicono che sia la forma antica dei cani senza pelo, quelli che accompagnavano i fulmini. Quando apre la bocca non abbaia: fa freestyle. E chi lo sente sa di essere inguaiato.',
    where: 'In cima alla Torre Verde', art: { body: 'xolo', main: '#5d4f5c', dark: '#2f2530', belly: '#9a8798', accent: '#62f07a', size: 1 }
  }),
  /* ---------- Forchetta ---------- */
  spadino: S({
    id: 'spadino', owner: 'forchetta', abil: ['affondo'], name: 'Spadino', wild: 'Spadino', type: 'Calma', stage: 1,
    stats: { hp: 92, atk: 106, def: 90, spe: 104 },
    learn: [[1, 'botta'], [1, 'acquerello'], [6, 'stoccata'], [12, 'bonaccia'], [18, 'risacca'], [26, 'mareggiata'], [34, 'genio']],
    evolve: { at: 14, into: 'spadaccino' },
    cry: { entry: 'Fsss! Spà!', win: 'Poteva andare peggio. Per te.', ko: 'Glub…' },
    text: 'Un pesce spada piccolo come una matita, con la spada più lunga di tutto il resto. È nato la notte delle 3:12 nel mare davanti al Zauli, dove Forchetta palleggiava, e da allora salta fuori dall\'acqua ogni volta che sente il rumore di una pallina.',
    where: 'Accanto a Forchetta', art: { body: 'swordfish', main: '#4f86c6', dark: '#2c4f86', belly: '#e6f2ff', accent: '#c9d6e6', size: 0.78 }
  }),
  spadaccino: S({
    id: 'spadaccino', owner: 'forchetta', abil: ['affondo'], name: 'Spadaccino', wild: 'Spadaccino', type: 'Calma', type2: 'Corrente', stage: 2, sig: 'servizioace',
    stats: { hp: 102, atk: 122, def: 100, spe: 116 },
    learn: [[1, 'botta'], [1, 'acquerello'], [6, 'stoccata'], [12, 'bonaccia'], [14, 'servizioace'], [18, 'risacca'], [26, 'mareggiata'], [34, 'genio']],
    evolve: { at: 26, into: 'gladiomare', bond: 60 },
    cry: { entry: 'En garde! Spà!', win: 'Game, set, Spadaccino.', ko: 'Doppio fallo…' },
    text: 'Sta dritto sulla coda come un tennista sulla linea di fondo, la fascia in testa e la spada che usa come una racchetta. La pinna sulla schiena è diventata una vela dipinta: ogni giorno ci dipinge sopra il golfo, e ogni giorno con un colore diverso.',
    where: 'Accanto a Forchetta', art: { body: 'swordfish', main: '#3e6fb5', dark: '#22457d', belly: '#e1eeff', accent: '#d8f04a', size: 0.9 }
  }),
  gladiomare: S({
    id: 'gladiomare', owner: 'forchetta', abil: ['affondo', 'poppa'], name: 'Gladiomare', wild: 'Gladiomare', type: 'Calma', type2: 'Corrente', stage: 3, sig: 'fendente',
    stats: { hp: 114, atk: 136, def: 112, spe: 128 },
    learn: [[1, 'botta'], [1, 'acquerello'], [6, 'stoccata'], [12, 'bonaccia'], [14, 'servizioace'], [18, 'risacca'], [26, 'mareggiata'], [26, 'fendente'], [34, 'genio']],
    cry: { entry: 'Dal fondo del golfo… GLADIOMARE!', win: 'Forza Formia.', ko: 'Torno negli abissi…' },
    text: 'Un cavaliere degli abissi: la spada è una lama di luce marina, la vela un mantello di pennellate, e le pinne, che un giorno si erano rotte, sono rifatte su misura come una protesi, d\'argento e di vetro. Nuota sotto il molo del Zauli nelle notti di mare calmo, e allora il golfo si accende di una riga azzurra.',
    where: 'In cima al Tempio della Terra Rossa', art: { body: 'swordfish', main: '#2e5aa0', dark: '#183463', belly: '#d8e8ff', accent: '#7ff0ff', size: 1 }
  }),
  /* ---------- Zendavid ---------- */
  gufobau: S({
    id: 'gufobau', owner: 'zendavid', abil: ['occhi'], name: 'Gufobau', wild: 'Gufobau', type: 'Cuore', stage: 1,
    stats: { hp: 104, atk: 92, def: 104, spe: 92 },
    learn: [[1, 'beccata'], [1, 'baugufo'], [6, 'ala'], [12, 'cuffione'], [18, 'malocchio'], [26, 'picchiata'], [34, 'genio']],
    evolve: { at: 14, into: 'subgufo' },
    cry: { entry: 'Uh-uh… BAU!', win: 'Bau. Bau bau.', ko: 'Uhhh…' },
    text: 'Un gufetto rotondo con due ciuffi dritti sulla testa e un paio di cuffie che sono più grandi di lui. È nato la notte delle 3:12 accanto a Zendavid, a Scauri, mentre passava il treno, e il primo verso che ha sentito era un cane che abbaiava: da allora fa «bau».',
    where: 'Accanto a Zendavid', art: { body: 'eagleowl', main: '#9c7a55', dark: '#5f4630', belly: '#f1e2c8', accent: '#ff8a3d', size: 0.78 }
  }),
  subgufo: S({
    id: 'subgufo', owner: 'zendavid', abil: ['bassi'], name: 'Subgufo', wild: 'Subgufo', type: 'Cuore', type2: 'Chiacchiera', stage: 2, sig: 'dropbasso',
    stats: { hp: 118, atk: 106, def: 116, spe: 100 },
    learn: [[1, 'beccata'], [1, 'baugufo'], [6, 'ala'], [12, 'cuffione'], [14, 'dropbasso'], [18, 'malocchio'], [26, 'picchiata'], [34, 'genio']],
    evolve: { at: 26, into: 'bubozen', bond: 60 },
    cry: { entry: 'Uh… UH… UUUH… DROP!', win: 'Stronger. Bau.', ko: 'Fine del set…' },
    text: 'Nel petto gli è cresciuta una cassa, una di quelle grosse da serata: quando respira, il pavimento trema. Le penne delle ali sono diventate onde, come quelle che si vedono sugli schermi dei mixer, e ha imparato a mettere il basso sotto a ogni verso.',
    where: 'Accanto a Zendavid', art: { body: 'eagleowl', main: '#7a6450', dark: '#46362a', belly: '#eadbc2', accent: '#ff5fd2', size: 0.9 }
  }),
  bubozen: S({
    id: 'bubozen', owner: 'zendavid', abil: ['bassi', 'luce'], name: 'Bubozen', wild: 'Bubozen', type: 'Cuore', type2: 'Cielo', stage: 3, sig: 'enso',
    stats: { hp: 132, atk: 118, def: 130, spe: 110 },
    learn: [[1, 'beccata'], [1, 'baugufo'], [6, 'ala'], [12, 'cuffione'], [14, 'dropbasso'], [18, 'malocchio'], [26, 'picchiata'], [26, 'enso'], [34, 'genio']],
    cry: { entry: 'Ommm… bau.', win: 'Tutto è musica.', ko: 'Il silenzio… è musica anche lui…' },
    text: 'Il gufo reale diventato monaco: galleggia a gambe incrociate sopra un disco di vinile che gira da solo, le ali aperte come due casse, gli occhi chiusi in un cerchio perfetto. Non ha più bisogno delle cuffie: la musica la sente da dentro. Ogni tanto, per ricordarsi chi è, fa «bau».',
    where: 'In cima al Tempio del Basso', art: { body: 'eagleowl', main: '#6f5c48', dark: '#3e3226', belly: '#efe3cf', accent: '#ffd27a', size: 1 }
  }),
  /* ---------- Antonio ---------- */
  leoncello: S({
    id: 'leoncello', owner: 'antonio', abil: ['bassa'], name: 'Leoncello', wild: 'Leoncello', type: 'Cervello', stage: 1,
    stats: { hp: 100, atk: 102, def: 96, spe: 94 },
    learn: [[1, 'botta'], [1, 'ruggitino'], [6, 'morso'], [12, 'genio'], [18, 'graffio'], [26, 'frana'], [34, 'saggezza']],
    evolve: { at: 14, into: 'voltaleone' },
    cry: { entry: 'Rrrraw!', win: 'Crazy shit… rrraw!', ko: 'Rrr… reset…' },
    text: 'Un leoncino con la criniera che non è ancora una criniera, solo un ciuffo che fa scintille quando si arrabbia. È nato alle 3:12 in punto accanto ad Antonio, in via Vitruvio, e il primo suono che ha sentito era una ventola di computer: da allora ruggisce allo stesso ritmo.',
    where: 'Accanto ad Antonio', art: { body: 'lion', main: '#f0b54a', dark: '#b9792a', belly: '#fff1cf', accent: '#e0742a', size: 0.78 }
  }),
  voltaleone: S({
    id: 'voltaleone', owner: 'antonio', abil: ['scudo'], name: 'Voltaleone', wild: 'Voltaleone', type: 'Cervello', type2: 'Caos', stage: 2, sig: 'criniera',
    stats: { hp: 112, atk: 118, def: 106, spe: 104 },
    learn: [[1, 'botta'], [1, 'ruggitino'], [6, 'morso'], [12, 'genio'], [14, 'criniera'], [18, 'graffio'], [26, 'frana'], [34, 'saggezza']],
    evolve: { at: 26, into: 'leonauta', bond: 60 },
    cry: { entry: 'RRRAW! Bzzzt!', win: 'Simulazione riuscita.', ko: 'Corto circuito…' },
    text: 'La criniera gli è cresciuta tutta insieme, ed è fatta di fili: rossi, neri, gialli, con le scintille in punta come un laboratorio di elettrotecnica a mezzanotte. Sulla fronte ha un visore che mostra numeri che nessuno capisce, tranne Antonio.',
    where: 'Accanto ad Antonio', art: { body: 'lion', main: '#e9a83c', dark: '#a9671e', belly: '#fff0c8', accent: '#5fd0ff', size: 0.9 }
  }),
  leonauta: S({
    id: 'leonauta', owner: 'antonio', abil: ['scudo', 'bassa'], name: 'Leonauta', wild: 'Leonauta', type: 'Cervello', type2: 'Cielo', stage: 3, sig: 'rientro',
    stats: { hp: 124, atk: 132, def: 118, spe: 116 },
    learn: [[1, 'botta'], [1, 'ruggitino'], [6, 'morso'], [12, 'genio'], [14, 'criniera'], [18, 'graffio'], [26, 'frana'], [26, 'rientro'], [34, 'saggezza']],
    cry: { entry: 'Formia, Torino, Chicago… ORBITA!', win: 'Missione compiuta.', ko: 'Houston… rrr…' },
    text: 'Il leone astronauta: la criniera è una corona di pannelli solari che si aprono al sole, la tuta bianca ha le toppe di Formia, di Torino e di Chicago, e sul petto batte un reattore azzurro. Nelle notti limpide lo si vede sul tetto della cupola di Parco la Fontana, a guardare le stelle come se ci dovesse tornare.',
    where: 'In cima alla Cupola', art: { body: 'lion', main: '#e2a240', dark: '#9a5d1a', belly: '#fff1cf', accent: '#ff7a2a', size: 1 }
  }),
  /* ---------- Andrea ---------- */
  volpalina: S({
    id: 'volpalina', owner: 'andrea', abil: ['poppa'], name: 'Volpalina', wild: 'Volpalina', type: 'Cervello', stage: 1,
    stats: { hp: 94, atk: 98, def: 90, spe: 110 },
    learn: [[1, 'beccata'], [1, 'calcolo'], [6, 'ala'], [12, 'occhiata'], [18, 'novanta'], [26, 'picchiata'], [34, 'genio']],
    evolve: { at: 14, into: 'volpadel' },
    cry: { entry: 'Yip! Calcolato.', win: 'Yip yip. Al 94%.', ko: 'Yiiip… cucinata…' },
    text: 'Una volpina con due ali piccole così, che non bastano a volare ma bastano a cadere piano. È nata la notte delle 3:12 accanto ad Andrea, a Castellone, e prima ancora di aprire gli occhi stava già contando le stelle.',
    where: 'Accanto ad Andrea', art: { body: 'wingfox', main: '#f08a3a', dark: '#b85a1c', belly: '#fff4e6', accent: '#ffe0a8', size: 0.76 }
  }),
  volpadel: S({
    id: 'volpadel', owner: 'andrea', abil: ['probabile'], name: 'Volpadel', wild: 'Volpadel', type: 'Cervello', type2: 'Cielo', stage: 2, sig: 'smashpadel',
    stats: { hp: 104, atk: 112, def: 100, spe: 124 },
    learn: [[1, 'beccata'], [1, 'calcolo'], [6, 'ala'], [12, 'occhiata'], [14, 'smashpadel'], [18, 'novanta'], [26, 'picchiata'], [34, 'genio']],
    evolve: { at: 26, into: 'volpitagora', bond: 60 },
    cry: { entry: 'Yip! Vetro e smash!', win: 'Come previsto.', ko: 'Sono cucinata…' },
    text: 'L\'arancione di una tuta da padel dalla punta delle orecchie alla coda, una fascia sulla fronte e la coda che finisce in una pallina gialla. Ora le ali la tengono su davvero: vola sopra i campi di Castellone e calcola dove cadrà la palla prima che la colpiscano.',
    where: 'Accanto ad Andrea', art: { body: 'wingfox', main: '#ff7a2a', dark: '#b8501a', belly: '#fff4e6', accent: '#d8f04a', size: 0.88 }
  }),
  volpitagora: S({
    id: 'volpitagora', owner: 'andrea', abil: ['probabile', 'poppa'], name: 'Volpitagora', wild: 'Volpitagora', type: 'Cervello', type2: 'Cielo', stage: 3, sig: 'teorema',
    stats: { hp: 116, atk: 128, def: 110, spe: 136 },
    learn: [[1, 'beccata'], [1, 'calcolo'], [6, 'ala'], [12, 'occhiata'], [14, 'smashpadel'], [18, 'novanta'], [26, 'picchiata'], [26, 'teorema'], [34, 'genio']],
    cry: { entry: 'Quod erat demonstrandum.', win: 'Dimostrato.', ko: 'Errore… di arrotondamento…' },
    text: 'La volpe del teorema: sei ali come un angelo dei libri vecchi, ognuna con un numero scritto sulle penne, due dadi che le girano intorno e un triangolo rettangolo di luce sopra la testa. Non sbaglia un colpo, perché prima di colpire lo dimostra. Vive in cima alla Torre delle Probabilità, e da lì vede ogni lancio prima che cada.',
    where: 'In cima alla Torre delle Probabilità', art: { body: 'wingfox', main: '#e8742e', dark: '#9a3f12', belly: '#fff4e6', accent: '#c3a0ff', size: 1 }
  })
};
