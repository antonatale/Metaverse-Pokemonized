# Briefing: rendere il gioco più divertente

4 novembre 2026, in due parti. **Parte 1 (§1–§4):** studio su giochi Pokémon e affini, due misure fatte sul motore di lotta, idee su lotte, mappa, progressione, avvenimenti e amici. **Parte 2 (§5):** il carattere del mondo: luoghi misteriosi, animazioni, versi, musica, scelte, leggendari, palestre. Poi il nome (§6), le priorità di tutto (§7), cosa non rompere (§8) e chi fa cosa tra Opus, Sonnet e Haiku (§9). Il nome di «Lotte tra amici» si vuole cambiare. Nessun codice del gioco è stato toccato: questo file è l'unica novità. Per riprendere il lavoro leggi anche `CLAUDE.md` e `PROSSIMI-PASSI.md`.

## In breve

- **Le lotte si decidono quasi tutte prima del primo turno.** A pari livello chi ha il vantaggio di tipo vince il 90–99%, e dentro il turno le scelte sono poche: «attacca sempre col colpo migliore» pareggia con l'IA in 11 specie su 18. In più, il cambio di creatura in lotta non esiste. È il buco più grosso, e si può riempire senza toccare i moltiplicatori di tipo (alzarli non serve: vedi §3).
- **La parte più originale del gioco è sotto-usata.** Gli amici hanno ognuno una meccanica sua (Antonio che perde gli oggetti, Costanzo che non lascia parlare, Andrea che calcola, Valentin che cambia idea…). Le creature, al confronto, sono numeri. Tre degli amici (Andrea, Valentin, Zendavid) fanno già attività ma non hanno un covo: portarli a cinque covi è il guadagno più economico.
- **Formia è già viva nello spazio (mappa vera), non ancora nel tempo.** L'ora del giorno è vera; manca il calendario vero (San Giovanni, Sant'Erasmo, il presepe di Maranola) e le stagioni. Nessun altro gioco può farlo.
- **Manca un motivo per rigiocare** e uno per giocare con gli amici fuori dalla stessa stanza. Soluzioni senza server: la sfida del giorno (seme = data) e il codice squadra da incollare.
- **Il secondo atto (Torino, Chicago) può essere il «gimmick» di ogni capitolo**, come Mega, Z, Dynamax e Tera nei Pokémon: una regola nuova per città.
- **Seconda parte (§5): il carattere del mondo.** Livelli che seguono la squadra (fasce e scala morbida, non alla Oblivion), luoghi misteriosi *dentro* (il Cisternone per primo), animazioni per *mossa* e non solo per tipo, versi per specie ed evento, musica per luogo e situazione, tre scelte che cambiano il finale, leggendari come eventi con enigma e dilemma, palestre-labirinto con gli amici. Quasi tutto poggia su due cose: le lotte che pensano (A1–A4) e un motore dei luoghi (puzzle, buio, validatore). Le priorità e chi fa cosa (Opus, Sonnet, Haiku) sono in §7 e §9.

## 1. Come ho lavorato

- Letto `CLAUDE.md`, `PROSSIMI-PASSI.md` e il codice che conta: `src/battle/` (turno, IA, mosse, danni), `src/data/creatures.ts`, `src/data/tuning.ts`, `src/data/encounters.ts`, `src/data/covi.ts`, e `fightOn`/`fightAfter` in `src/ui/story-screen.ts`.
- Ricerche sul web su: Legends Z-A, Legends Arceus, Scarlet/Violet, Sword/Shield, Champions, Cassette Beasts, Temtem, Coromon, Monster Sanctuary, Palworld, PokéRogue, Nuzlocke, Shin Megami Tensei, Octopath Traveler, e il gioco competitivo (Smogon). Le fonti sono recensioni, articoli e forum, non studi: dove ho solo una sintesi lo dico, e i punti che vengono dalla mia conoscenza dei giochi e non da una ricerca sono segnati *(mia conoscenza)*.
- Due esperimenti sul motore, con script scritti fuori dal repo (non committati). Metodo e limiti in §3. Promuoverli a `tools/sim-fun.ts` è il primo passo utile, perché sono il test oggettivo delle idee di §4.
- Seconda tornata, lo stesso giorno: lettura di `data/maps/`, `story/movement.ts`, `story/plot.ts`, `audio/`, `ui/spells.ts` e `data/encounters.ts`, e ricerche su livelli, palestre, grotte, versi, animazioni, musica adattiva, narrativa ramificata, leggendari e Formia. Le ricerche non hanno confermato la Grotta della Janara.

## 2. Cosa rende divertenti questi giochi

1. **La lotta si vince leggendo l'avversario, non facendo conti.** Pokémon: tipo più cambio, cioè prevedere cosa manderà l'altro *(mia conoscenza)*. Shin Megami Tensei, Press Turn: colpire il punto debole dà un turno in più, e vale anche per il nemico, quindi rischio e premio da entrambe le parti. Octopath: Break e Boost, spendere ora o risparmiare. Lezione: una decisione che torna a ogni turno e ha un costo.
2. **Complessità a strati.** I primi trenta minuti sono semplici; nature, abilità, oggetti ed effetti di campo arrivano dopo e si possono ignorare. La profondità competitiva nasce dagli strati che si moltiplicano: Velocità, oggetti, abilità, campo (Smogon).
3. **Catturare è un gioco, non una probabilità.** Legends Arceus: catturare nel mondo, di nascosto, pianificando le rare: secondo una recensione, si ricorda più del classico «indebolisci e cattura». Cassette Beasts: i nemici si vedono e si sceglie quali combattere; gli sviluppatori dicono di aver evitato gli incontri casuali ripetitivi. Coromon: i Titani non si catturano e sono boss veri.
4. **L'affetto nasce dalla posta in gioco.** Nuzlocke: scarsità, soprannomi, perdite che contano, storie che nascono da sole. Coromon ha difficoltà in cui la creatura KO se ne va. Lezione: legame più rischio *facoltativo*.
5. **Un'idea nuova per capitolo.** Ogni generazione Pokémon aggiunge un gimmick (Mega, Z, Dynamax, Tera) *(mia conoscenza)*: dà il «quando lo uso?» e lo spettacolo. Attenzione a due cose dalle recensioni: Z-A in tempo reale è fluido ma perde tensione ed è troppo facile all'inizio; e un articolo di Game Rant sostiene che in Scarlet/Violet le palestre usano Tera sempre allo stesso modo (Sudowoodo si teratallizza sempre in Erba), e questo le rende più facili. Un gimmick usato dall'IA sempre allo stesso modo si spegne.
6. **Un mondo denso batte un mondo grande.** Scarlet/Violet: il mondo aperto è lodato come direzione, ma città tutte uguali, nessuna scalatura dei livelli e zone chiuse da muri di livello. Z-A: una sola città condensata «perde parte della magia» e il ciclo giorno/notte è scomodo. Per Formia: più cose per casella, non più mappa.
7. **Troppo facile annoia.** Sword/Shield con la condivisione dell'esperienza automatica: diversi giocatori e commentatori lo dicono troppo facile, anche se le fonti che ho trovato sono recensioni di utenti e forum, e c'è chi non è d'accordo. Z-A è giudicato facile all'inizio. Servono modi per alzare la sfida: difficoltà, Nuzlocke, regole particolari.
8. **Catturare serve a qualcos'altro.** Palworld: le creature catturate lavorano alla base, e cattura e automazione si rinforzano. Monster Sanctuary: i mostri sono anche attrezzi per esplorare. Il gioco lo fa già (nuoto, scalata, vista dall'alto, cose trovate): è la direzione giusta.
9. **Run brevi e rigiocabili.** PokéRogue, fatto da un fan, ha superato il milione di giocatori: biomi, scelte casuali, permadeath, ricompense migliori con le dorate.
10. **È un gioco sociale.** Tajiri voleva il cavo link per *condividere*, non per sfidarsi; le versioni con creature esclusive rendevano lo scambio necessario per completare il Pokédex (resoconti di seconda mano, ma concordi). Per un gioco «tra amici» è la leva più naturale.
11. **L'antagonista ha delle ragioni.** Black/White: N, «frainteso» più che cattivo, è citato da molti fan (nei forum) come il personaggio più interessante che la serie abbia introdotto. Tullio e Mamurra possono avere questo.
12. **Poche regole nuove, usate con parsimonia.** Cassette Beasts: la fusione si usa di rado, e per questo sembra speciale.

Un avvertimento sulla lentezza: una recensione di Cassette Beasts nota che anche le lotte contro nemici molto più deboli durano più turni del necessario. Lotte più profonde non devono voler dire lotte lente: le facili devono chiudersi in fretta.

## 3. Dove siamo oggi

**I numeri** (dal codice): 20 specie (9 delle tre iniziali, 10 selvatiche, 1 leggenda), 5 tipi in ciclo, circa 48 mosse delle creature, 4 mosse per creatura, uno stato alterato (la confusione) più quattro variazioni di Attacco/Difesa, nessuna abilità, nessun oggetto tenuto, nessun cambio in lotta, 8 zone d'incontro (1 passo su 9), 2 covi (Costanzo, Forchetta), 5 allenatori fissi più 3 lotte col rivale, 7 passi di trama. Una lotta tra creature è una catena di duelli 1 contro 1: chi vince resta in campo (`fightOn(key)`), e la scelta di chi mandare (`pickFighter`) c'è solo all'inizio e dopo un KO.

**Esperimento 1: quanto pesa il tipo.** Stessa coppia, stesso livello e stessa forma, 300 duelli IA contro IA per cella, cambiando solo `MAGIC_TUNE` (vantaggio/svantaggio). Percentuale di vittorie di A:

| coppia (A ha il vantaggio di tipo, salvo le ultime due righe) | senza tipi | **oggi 1,12 / 0,9** | 1,5 / 0,67 | 2 / 0,5 |
|---|---|---|---|---|
| Gabbì 10 contro Polpino 10 | 93 | **99** | 100 | 93 |
| Ramarrino 10 contro Gabbì 10 | 50 | **93** | 100 | 100 |
| Burrasco 20 contro Calamastro 20 | 56 | **95** | 88 | 96 |
| Ramarmo 20 contro Burrasco 20 | 77 | **90** | 100 | 100 |
| Polpino 10 contro Ramarrino 10 (nessun vantaggio) | 46 | 46 | 46 | 46 |
| Calamastro 20 contro Ramarmo 20 (nessun vantaggio) | 33 | 33 | 33 | 33 |

I valori di oggi portano già chi ha il vantaggio al 90–99%, e oltre non si guadagna niente (il rumore è di circa ±3 punti, e qualche cella non è monotona perché l'IA cambia mossa). **Non alzare i moltiplicatori.** Se mai, con le idee di §4 conviene *abbassarli un po'*, perché ora un matchup sbagliato è una sconfitta quasi certa e non ci sono strumenti per rimediare.

**Esperimento 2: quanta profondità hanno le scelte nel turno.** 18 specie, duelli speculari (stessa specie, stesso livello: 10, 20 o 30), 300 per riga. Il lato A gioca una regola semplice, il lato B l'IA del gioco (`E.ai`). Regola «greedy»: tra le mosse d'attacco disponibili, quella con potenza × precisione × efficacia più alta (da `moveLabel`); mai cure né potenziamenti.

| media sulle 18 specie | |
|---|---|
| IA contro IA | 51% |
| **greedy contro IA** | **43%** |
| mossa qualsiasi contro IA | 12% |
| turni medi per duello | 5,6 |
| quanto spesso l'IA sceglie la stessa mossa di greedy | 72% |

Greedy fa come l'IA o meglio (47% o più) in **11 specie su 18**. Crolla solo dove l'IA usa bene una cura o una difesa: Ramarrino 10 (2%), Olivella 10 (5%), Olivastro 20 (21%), Riccetto 10 (31%). Cioè: oltre a «colpisci col colpo più forte», l'unica scelta che conta oggi è *quando curarsi* (2 usi). I numeri di questa tabella sono quelli di `tools/sim-fun.ts` (`npm run sim:fun`), che li rifà in due secondi: i primi che avevo scritto, con uno script provvisorio, erano scostati di 1–3 punti perché consumava numeri casuali a vuoto; le conclusioni non cambiano. Limiti: sono policy del computer su duelli speculari, non giocatori umani, e l'IA non è un giocatore ottimo; ma nessuna regola del gioco premia un gioco più profondo.

**Cosa vuol dire, in sintesi:** il tipo è già decisivo, il turno ha poche scelte, il cambio non c'è. Manca il «gioco di mezzo» tra scegliere la creatura e colpire.

**Quello che funziona e va protetto:** la mappa vera di Formia; gli amici con meccaniche proprie; la presentazione della lotta (magie, scene, suoni, numeri grandi); legame, caratteri, dorate; il rivale e gli allenatori che ti vedono; i poteri sulla mappa; l'ora del giorno vera; la trama delle Pietre di Telepilo.

## 4. Le idee

Costo: **S** poche ore, **M** una sessione, **L** più sessioni. Tutto ciò che riguarda le creature è solo nella storia, quindi i 2040 golden delle lotte tra amici non cambiano (campi facoltativi, come già fatto per `stats`, `known`, `endure`).

### A. Lotte

**A1. Il cambio di creatura** *(M, la più importante)*. Oggi la creatura che vince resta dentro anche contro una avversaria che la batte di tipo. Passi: (1) quando l'allenatore manda la creatura dopo, chiedere «Cambi?» con `pickFighter`, come i Pokémon; (2) in lotta il pulsante «Cambia»: costa il turno, l'avversario colpisce quella che entra; il duello finisce con un `result` nuovo e la catena riparte con i PS già salvati in `f.hp` e `f.foeHp`; (3) più avanti, la squadra dentro lo stato (`Side.team`). Gli allenatori cambiano quando sono in svantaggio e ne hanno una migliore (vedi A8). È l'idea che dà il gioco di previsione: «cambierà? allora entro con quella che batte la sua riserva».

**A2. Stati alterati con un rimedio** *(M)*. Tre nuovi, nel carattere di Formia: **Colpo di sole** (−1/12 dei PS massimi a fine turno e Attacco −25%; da Canicola e simili), **Siesta** (salta 1–3 turni, si sveglia se colpita), **Rete** (non può cambiare e Velocità −20% per 3 turni; da granchi e polpi). Solo uno alla volta, più la confusione che c'è già. Ogni stato ha un rimedio (tiella, un'abilità, una mossa), senno è solo fastidio. Aggancio: `Side.status`, e il fine turno in `turn.ts` dove oggi c'è la cura di Valentin.

**A3. Abilità** *(M)*. Una per specie, due per le ultime forme, passive e nel tema della creatura: Cicalina «Frinire d'agosto» (entrando abbassa l'Attacco avversario), Civettina «Occhi di notte» (di notte più veloce), Granchietto «Corazza» (il primo colpo subito fa −30%), Olivella «Radici» (cura 1/16 dei PS a turno), Riccetto «Aculei» (chi lo colpisce perde il 6% dei PS), Gabbì «Ladro di panini» (se colpisce per primo, si riprende un po'). Il campo è `abil` su `Species`, i ganci sono pochi (entrata, colpo dato, colpo subito, fine turno).

**A4. Oggetti tenuti** *(M)*. Uno a creatura: Fetta di tiella (la mangia sotto il 25% dei PS e cura il 30%), Ciambella all'anice (+10% Velocità), Oliva di Gaeta (una volta, −25% di danno dal tipo che batte il suo), Cozza (blocca il primo stato alterato), Corno di mare (la prima mossa di un tipo +20%). Si trovano dove oggi si trovano le tielle e i retini: la creatura che ti segue (`sniff`), i negozi, i premi dei covi e del diario. Il `mons[]` salvato prende un campo `item` facoltativo. Insieme ad A3 e alle mosse, con 20 specie fa già un vero costruire la squadra.

**A5. Slancio e Risonanza** *(L, da progettare con il simulatore)*. Il gimmick di Formia. Lo **Slancio** sale (0–3) quando metti a segno un colpo superefficace o un critico, o ne subisci uno superefficace (così chi è in svantaggio si rifà). Con tre punti e almeno tre cuori di legame, una volta a lotta si può fare la **Risonanza**: la creatura prende come secondo tipo quello della magia del luogo (A6) per tutta la lotta, la mossa dopo fa ×1,5 e si cura del 20%, con una scena grande (le magie in `ui/spells.ts` sono già la base). Lega due cose che oggi non si parlano, il legame e il campo, e dà il «quando la uso?». Attenzione a quello che dicono le recensioni di Tera: l'IA che lo usa sempre allo stesso modo lo rovina.

**A6. Luoghi di potere e ora del giorno** *(S–M)*. Ogni zona ha una magia che rinforza un tipo del 15%, e si legge in lotta («Magia di Castellone: Calma +15%»). Le cinque zone coincidono già con i cinque tipi: le mura di Castellone con Calma (Ramarrino), gli scogli del golfo con Cervello (Polpino), il porto e i venti con Caos (Gabbì), la pineta con Chiacchiera (le cicale), gli uliveti con Cuore (le olive). Di notte, la luna rinforza Calma. Ci sono già `StoryTag.scene` e il `night` della lotta. Dà un motivo per scegliere *dove* e *quando* combattere.

**A7. L'ordine dei turni a vista** *(S)*. Come in Legends Arceus: una striscia con chi agisce per primo e l'effetto atteso di ogni mossa. Una recensione lamenta che in quel gioco l'ordine cambia di continuo e confonde; qui no, perché ognuno sceglie una mossa sola per turno. Solo interfaccia, ma attenzione: `orderOf` in `turn.ts` estrae un numero casuale per lato a ogni turno (`tie`). La striscia deve calcolare l'ordine da priorità e Velocità *senza* toccare il generatore (nei pareggi mostra «pari»), altrimenti ogni lotta successiva cambia e i golden saltano.

**A8. Boss con regole proprie, allenatori con personalità** *(M)*. Mamurra con uno scudo «Ricchezza» di 3 punti che si rompe colpendo i punti deboli (Octopath): rotto, lui salta un turno e subisce di più. Lamo in tre fasi (PS al 100, 60, 30%) con mosse nuove, e il retino regge solo nell'ultima. Tullio, nella terza lotta, cambia creatura una volta per batterti di tipo. Gli allenatori hanno una frase prima («il signore di Castellone ama le sue mura») che dice di che tipo sono, così si prepara la squadra. Ogni lotta importante dovrebbe far pensare in modo diverso.

**A9. Lotte in due: Antonio con la sua creatura** *(L, grande scommessa)*. Temtem ha le lotte doppie come base e la sinergia tra i due compagni è il suo pezzo migliore. Qui c'è una cosa che nessuno ha: la *persona* che lotta *insieme* alla creatura. Cambia il motore (2 contro 2): è il gimmick giusto per il secondo atto (§4 C7), non per adesso.

Da **non** fare: il tempo reale di Z-A (il motore è a eventi e puro, e le recensioni dicono che perde tensione); la fusione stile Cassette Beasts (ogni creatura qui è un SVG intero, non un modello a pezzi: costerebbe troppo disegno).

### B. Mappa e mondo

**B1. Incontri che si vedono e si scelgono** *(M)*. Accanto all'erba alta (1 passo su 9, uguale in tutte le zone), creature che passeggiano e si vedono, a seconda di zona e ora: un gabbiano sul porto all'alba, una lucertola sul muro. Se ti avvicini da dietro (il Passo felpato c'è già) parti con un colpo di vantaggio. L'erba che si muove dice se c'è una rara. Meno incontri casuali ripetitivi (Cassette Beasts), più pianificazione (Legends Arceus). C'è già un modello: la leggenda Lamo è un `Npc` con `wild`.

**B2. Il calendario vero di Formia** *(M, il più «nostro»)*. Eventi legati alla data: Sant'Erasmo (2 giugno), San Giovanni a Mola (24 giugno), Ferragosto sulla spiaggia, il presepe vivente di Maranola a Natale, il carnevale. Più le stagioni: spiagge piene d'estate e vuote d'inverno, la pesca che cambia. Ognuno porta una creatura a tempo, una piccola attività e un premio. L'ora vera c'è già (`story/daytime.ts`); la data è la stessa idea. Dà un motivo per tornare, senza server.

**B3. La cucina formiana** *(M)*. Gli ingredienti (cozze, vongole, canocchie, olive di Gaeta, mozzarella di bufala, anice) si trovano, si pescano (c'è la pesca) e si comprano; a casa o da Morgana si cucinano la tiella, gli spaghetti alla formiana, le ciambelle all'anice. Il piatto dà per venti minuti un vantaggio: più esperienza, più rare di un tipo, Slancio a inizio lotta. Lega pesca, negozi, oggetti trovati e la cultura vera (i fatti sono già in `CLAUDE.md`, «Cucina»). I picnic e i panini di Scarlet/Violet sono tra le cose più amate di quel gioco *(mia conoscenza)*.

**B4. Segreti e poteri** *(M)*. Altri poteri (quello della Grotta della Janara: la creatura che fa luce) e scorciatoie che si aprono con i poteri e fanno ritornare la mappa su se stessa. Monster Sanctuary è lodato proprio per questo: la squadra come attrezzo per esplorare. Le cose perse viste dall'alto (tasto V) possono diventare segreti veri. È già il punto 9 di `PROSSIMI-PASSI.md`.

**B5. Compiti nel diario** *(S–M)*. Come la ricerca di Legends Arceus: tre compiti per specie («usa Mareggiata 5 volte», «battila di notte», «falla evolvere»), con retini, oggetti o sesterzi di premio. Insegna il gioco e dà obiettivi piccoli. Una critica a Legends Arceus: arrivare al livello massimo di ricerca di ogni specie vuol dire rivedere le stesse animazioni decine di volte. Quindi pochi compiti per specie, non dieci livelli.

### C. Dinamiche e progressione

**C1. Cinque covi con gli amici** *(M)*. Oggi i covi sono due (Costanzo 6, Forchetta 9), mentre Andrea, Valentin e Zendavid hanno le attività (padel, beach volley, corsetta) ma non una sfida con spilla. Con loro la scala diventa di cinque, e **ogni covo ha già la sua meccanica nel motore** perché le lotte tra amici esistono: è contenuto, non motore. Poi la Lega: il Torneo degli amici (già c'è) come finale. I covi restano dei cinque amici: non servono persone vere fuori dalla compagnia.

**C2. Il rivale e il cattivo con delle ragioni** *(M)*. Tullio ha tre lotte e uno schema da sbruffone; dargli un obiettivo (vuole dimostrare qualcosa allo zio, trova una pietra prima di Antonio, alla fine collabora) lo rende un N. Mamurra vuole «la città dei Mamurra», cioè la gloria perduta: una scelta finale (sigillare o usare le pietre) cambia come esce Lamo. È anche il punto 10 di `PROSSIMI-PASSI.md`. Il ritratto di Tullio nel gioco (punto 15) ci sta.

**C3. Tre modi di giocare** *(S–M)*. Tranquillo (nessuna creatura si perde), Classico (come oggi), Coraggioso (una creatura KO senza cuori se ne va; con cuori resta a casa ferita). Soprannomi e legame ci sono già: l'affetto è fatto. Come Coromon e Nuzlocke, *facoltativo* (a una nuova partita).

**C4. «Un giorno a Formia» e la sfida del giorno** *(L)*. *Fatta e poi tolta il 5 novembre 2026: Antonio non la voleva.* Una corsa breve (circa 15 minuti): tre creature a caso al livello 10, otto lotte nelle scene di Formia, tra una e l'altra la scelta di una tra tre ricompense (abilità, oggetto, cura, una creatura), il boss alla fine. La **sfida del giorno** usa la data come seme: tutti gli amici fanno la stessa corsa e confrontano il punteggio, copiando una riga di testo. Riusa motore, dati e scene; PokéRogue mostra che l'appetito c'è. Dipende da A1–A4: con lotte povere la corsa è noiosa.

**C5. L'Arena delle regole al Palamendola** *(M)*. Lotte con regole fisse, come la Battle Frontier *(mia conoscenza)*: solo tre creature, solo un tipo, livello livellato a 50, niente oggetti. Il Palamendola c'è sulla mappa. Regole particolari rendono nuove lotte che hai già fatto.

**C6. Più specie, a poco prezzo** *(M)*. 20 specie sono poche per una guida da completare. Dieci specie nuove, di cui una parte come **varianti** (stessa forma, colori e tipo diversi, tipo la «forma notturna» o «di Mola»: costa un cambio di palette in `art`, non un disegno nuovo). Le due selvatiche del punto 9 (meduse e ricci, pipistrello) sono già in lista.

**C7. Un gimmick per città nel secondo atto** *(L)*. Come ogni regione Pokémon: Torino aggiunge le lotte in due (A9), Chicago un'altra regola (per esempio le fusioni, ma solo come evento di storia, mai di routine). Così il gioco cambia sotto le mani invece di ripetersi. Aggancio: `data/gates.ts`, il treno per Torino.

### D. Avvenimenti

**D1. Piccoli eventi a tempo sulla mappa** *(M)*: un gabbiano ti ruba il panino e lo rincorri; il cane dell'oratorio si è perso; un temporale chiude il lungomare e c'è da fare un'altra strada; una barca ha perso un'anfora; la festa di quartiere chiede tre tielle. Uno o due minuti, una scelta, un premio, innescati da ora, data, luogo. Riusano la struttura di `ui/activities.ts`.

**D2. La storia di ogni amico** *(M)*: una piccola missione per amico, nel suo carattere (il comizio di Costanzo, il «poteva andare peggio» di Forchetta, la musica di Zendavid, la festa di Valentin, i conti di Andrea). Portano il tono dei vostri scherzi e una ragione per tornare da loro dopo il covo.

### E. Amici

**E1. Codice squadra** *(S–M)*: la squadra (specie, livelli, mosse, soprannomi, cuori) diventa una riga di testo da incollare; un amico la importa come avversario «fantasma» contro cui lottare. Anche **scambio** con un codice. Niente server, quindi funziona con il file singolo e con la CSP degli Artifact. È il cavo link di Tajiri, in versione WhatsApp.

**E2. Creature contro creature sullo stesso schermo** *(M, dopo A1)*: il passa-telefono dei sei amici c'è già per le persone; con cambio e squadre di sei diventa il «PvP» vero, quello che regge i Pokémon competitivi.

**E3. La classifica degli amici** *(S)*: il libretto (vittorie, sconfitte, voti) può mostrare il confronto con ogni amico, e la sfida del giorno aggiunge un punteggio da confrontare. Champions ha una scala a stagioni; qui una stagione è un mese e non serve un server.

### La graduatoria

| # | idea | impatto | costo | dipende da |
|---|---|---|---|---|
| 1 | A1 cambio di creatura | molto alto | M | |
| 2 | A3 + A4 abilità e oggetti | alto | M | |
| 3 | A2 stati alterati | alto | M | |
| 4 | C1 cinque covi con gli amici | alto | M | |
| 5 | A6 luoghi di potere e ora | medio, economico | S–M | |
| 6 | A5 Slancio e Risonanza | molto alto | L | A1, A6 |
| 7 | B2 calendario vero | alto, unico | M | |
| 8 | C4 corsa e sfida del giorno | alto | L | A1–A4 |
| 9 | B3 cucina | medio–alto | M | A4 |
| 10 | B1 incontri visibili | medio | M | |
| 11 | E1 codice squadra | medio–alto | S–M | |
| 12 | C2 rivale e Mamurra | alto | M | |

### Obiettivi di bilanciamento da verificare con il simulatore

Proposti, da tarare:

- turni medi per duello: **8–10** (oggi 5,6);
- «greedy» contro IA: **≤ 35%** per ogni specie (oggi 43% in media, ≥ 47% in 11 specie su 18);
- vantaggio di tipo a pari livello: **70–85%** (oggi 90–99%), per lasciare spazio a cambio, abilità e oggetti;
- nessuna specie sopra il 60% o sotto il 40% in un girone a pari livello e forma (negli amici l'obiettivo era 45–55%);
- le lotte facili (livello molto più alto) si chiudono in **≤ 4 turni**.

## 5. Il carattere del mondo (seconda parte dello studio)

Antonio ha chiesto un'opinione su altre cose che i Pokémon facevano bene: luoghi misteriosi con creature d'ambiente e livelli giusti, animazioni diverse per ogni mossa, i versi, la musica che cambia con il posto e la situazione, le scelte che cambiano la storia, i leggendari, le palestre con labirinti e prove di movimento. Per ognuno: l'opinione, cosa ho trovato, come farlo nel modo più economico. Gli ID (F1…) servono alla graduatoria di §7. Fatti su Formia che aggiungo qui e non sono già in `CLAUDE.md` sono segnati *(da verificare)*: la regola del progetto è controllarli prima di scriverli nel gioco.

### F1. Livelli che seguono la squadra

**Opinione.** Hai ragione, e oggi è proprio come dici: la tabella di una zona ha livelli fissi (`lv: [min, max]` in `data/encounters.ts`, tirati a caso in `meet()` di `ui/story-screen.ts`), quindi più la squadra cresce e più le zone vecchie diventano banali, e un posto «pericoloso» lo è solo finché non ti alleni. Ma scalare *tutto* è una trappola nota. L'ex progettista di Oblivion ha ammesso che il sistema di scalatura «fu un errore», corretto solo in Skyrim: il mondo smette di essere credibile (briganti sulla strada forti come te) e il progresso non si sente. Il contrario costa lo stesso: GamesRadar criticò Scarlet/Violet perché la sfida delle palestre, che si può fare in qualsiasi ordine, non scala. E il giro di Formia si può fare «in qualsiasi ordine» (`story/goals.ts`): un po' di scalatura serve.

**Proposta: fasce, progresso e scala morbida solo dove serve.**

- Ogni zona tiene la sua **fascia**, il senso del posto: il Parco Gramsci è dolce, i Monti Aurunci no.
- **Progresso, come le strade dei Pokémon:** la fascia sale con la trama, usando flag che già esistono (pietre trovate, covi battuti). Per esempio +2 dopo la prima pietra, +4 dopo la seconda.
- **Scala morbida solo nei luoghi pensati come sfida** (monti, mare, mura, ogni dungeon): `livello = clamp(riferimento + scarto, fascia.min, fascia.max + progresso)`, con riferimento = media dei tre livelli più alti della squadra e scarto da −1 a +3 secondo il posto. Il luogo resta pericoloso senza diventare né un muro né una passeggiata.
- **Rare ed evolute** (Olivastro, Civettona, Granchione…): restano nella loro fascia alta. Avevo pensato a +4 sopra la squadra, ma il simulatore lo smentisce: contro l'Olivastro l'esito oscilla in modo erratico col livello (Calamastro 18 vince l'1% a livello 18 e il 35% a 20) e +4 è un muro.
- **Fissi:** covi, rivale, boss, leggende. Cicerone dice già se sei pronto (`advice` in `story/mentor.ts`).
- La difficoltà scelta (C3) sposta tutto di ±2.
- Si verifica con `tools/sim-story.ts`: una squadra tipica deve battere una selvatica di quella zona il 70–90% delle volte.

**Costo e modello.** S–M, quasi tutto in `meet()` e `encounters.ts`. Sonnet xhigh, con il simulatore come controllo.

### F2. Luoghi misteriosi con creature d'ambiente

**Opinione.** È la cosa che più manca. Tutto il gioco è all'aperto e le 8 tabelle d'incontro sono macchie d'erba o di scoglio: mancano i luoghi *dentro*. Formia ne ha di veri, e il gioco li nomina già senza farli visitare.

**Cosa ho trovato.** Una discussione di Smogon su cosa rende memorabile una grotta confronta Petalburg Woods (va bene) con Rock Tunnel (un fastidio): contano tante lotte, una ragione di trama per andarci, e un buio *leggibile*. In Rock Tunnel, senza Flash, non si vede niente, e in Emerald un raggio di luce troppo stretto rende Dewford Cave e Victory Road confuse. Secondo Bulbapedia le grotte sono quasi sempre labirinti in cui ci si perde, Victory Road è la prova con gli allenatori forti prima della Lega, e le rare vivono spesso nelle grotte. Lezione: buio e labirinto vanno bene se si leggono (raggio largo, una mappa che si ricorda), e un dungeon vuole un motivo, una fatica proporzionata e un premio.

**Candidati veri o già nel gioco** (i fatti sono in `CLAUDE.md`):

1. **Il Cisternone** (Castellone, I sec. a.C., 1200 m², già nella trama con l'uomo con la torcia). Il primo, e il modello.
2. **Le peschiere di Caposele** (già nella trama): acqua, quindi il nuoto.
3. **La cripta di Sant'Erasmo** (necropoli romana e cripta carolingia, scavi 1970–76).
4. **Le terme sotto la Torre di Mola** (la torre angioina è costruita sopra le terme romane).
5. **La villa di Mamurra** a Gianola (l'ottagono, il «Tempio di Giano»), per il finale.
6. **La Grotta della Janara** a Gianola (è nel punto 10 di `PROSSIMI-PASSI.md`; non l'ho trovata nelle fonti che ho cercato) *(da verificare)*.

**Cosa c'è già nel codice:** mappe `inside: true` con porte e `warps` (anche verso un'altra parte della *stessa* mappa: lo dice il commento di `travel` in `story/movement.ts`), allenatori con linea di vista, luci notturne (`drawNight` in `render/world-view.ts`), i poteri (nuoto, scalata, vista dall'alto).

**Cosa manca:** un flag `dark` per le mappe interne (oggi `m.inside` esce subito dal buio: dentro le luci sono sempre accese) con un raggio di luce e le lampade come fonti; tabelle d'incontro dentro (oggi le zone sono macchie esterne `HIDINGS` con `on: 'erba' | 'scogli' | 'acqua' | 'mura'`: serve `on: 'grotta'` e un carattere di mappa); scene di battaglia nuove in `render/svg/scenes.ts`; le specie d'ambiente.

**Creature d'ambiente:** 2–3 specie per dungeon che vivono solo lì, più una forma rara. Nomi provvisori: Nottola (pipistrello di grotta, Caos), Lume (fuoco fatuo della cripta, Cuore o Calma), Goccia (dall'acqua del Cisternone, Cervello), Vaporino (dalle terme, Chiacchiera). Il costo vero è **un corpo nuovo** (pipistrello, pesce, fuoco fatuo: tre funzioni SVG in `render/svg/creatures.ts`); poi ogni specie è dati più una palette. Quelle su un corpo che c'è già (`owl`, `crab`…) costano poco.

**Il modo economico:** un **dungeon-modello** fatto bene (il Cisternone: 2 piani, 1 enigma, 1 mini-boss, tabella d'incontri a scala morbida, musica e scena sue), poi gli altri sono dati, una mappa ASCII e una variazione del puzzle.

**Costo e modello.** M il primo, S–M ciascuno dopo. Opus max per il buio e per il motore dei luoghi (F8); Sonnet xhigh per mappe, tabelle, specie e scene.

### F3. Animazioni diverse per ogni mossa

**Opinione.** Sì, e oggi il gioco fa metà del lavoro: le magie sono belle e grandi, ma cambiano per **tipo**, non per **mossa**. `castSpell` in `ui/spells.ts` sceglie `FLY` e `HIT` dal tipo (cinque coppie), scalate da `grand()` (potenza, mossa speciale, critico). L'id della mossa arriva già alla UI (l'evento `anim` porta `move`), quindi basta usarlo.

**Come, in modo efficiente: separare il gesto dal motivo.** Oggi il tipo decide *come si muove* (la luna vola, il fulmine cade dalla nuvola) e *cosa si vede* (la luna, il fulmine). Se si separano, 48 mosse diventano diverse con poco:

- **Gesti** (come si muove), circa 12: lancio dritto, arco, raggio, pioggia dall'alto, taglio a croce, onda che spazza, orbita, stretta (i tentacoli), colonna su di sé, vortice intorno al bersaglio, meteora, scatto con la scia.
- **Motivi** (cosa si vede), i cinque che ci sono: luna, fulmine, stella, nota, cuore.
- Per mossa una riga di dati: `{ gesto, motivo?, n, durata, scossa }` (il motivo di default è quello del tipo). Sono 60 combinazioni e ogni mossa ha la sua.
- Più **circa 10 scene firma** a mano per le mosse speciali (`sig`) e le più forti: Mareggiata incantata, Catilinaria, Tempesta di luna, Libeccio, Cuore di pietra…
- **Il suono segue il gesto**, con il timbro del motivo (in `audio/sfx.ts`).
- **Un tasto «Veloce»**: le recensioni dei Raid di Sword/Shield dicono che le animazioni lente fanno trascinare le lotte. Più le animazioni sono belle, più serve poterle accelerare.

È solo interfaccia: niente motore, niente golden. Gli e2e giocano le lotte e devono arrivare in fondo senza errori.

**Costo e modello.** M–L. Sonnet xhigh; la prima scena firma conviene guardarla insieme.

### F4. I versi di ogni creatura, all'entrata e alla sconfitta

**Opinione.** Sì. Oggi ci sono 8 versi, uno per *corpo* (`cry-octo`, `cry-lizard`… in `audio/sfx.ts`), e suonano a ogni battuta della creatura in lotta (`sfx('cry-' + corpo)` sull'evento `line` in `ui/battle-screen.ts`), uguali per l'entrata, la vittoria e il KO. Tutte le creature dello stesso corpo suonano uguali, e tutte le forme di una linea pure. Il corpo `giant`, quello di Lamo, non ha nessun verso: il leggendario è muto.

**Cosa ho trovato.** I Pokémon della prima generazione hanno 151 versi fatti partendo da circa **37–38 versi base** modificati in tono e durata (Hackaday, The Cutting Room Floor; le fonti non concordano sul numero esatto). Lo stesso trucco funziona qui, e il sintetizzatore c'è già.

**Come:** una funzione `voice(specie, evento)` che parte dal modello del corpo e lo modula con quello che la specie già ha:

- **Altezza** dalla dimensione (`art.size`): più grande, più grave.
- **Forma:** più avanzata, più armoniche, più lenta, più lunga.
- **Tipo, per il timbro:** Calma sinusoide o triangolo con vibrato lento; Caos onda quadra con un po' di rumore; Cervello arpeggio chiaro; Chiacchiera **sillabe con formanti** (come il coro del trailer in `tools/promo/music.ts`: il Ciceropode può «parlare» davvero); Cuore un sospiro a due note, caldo.
- **Evento:** entrata (il modello), vittoria (più acuta, ripetuta), KO (scivola verso il basso mentre il filtro si chiude).
- **Dorata:** un'armonica scintillante in più.

Venti specie per tre eventi fanno 60 suoni da 9 modelli (gli 8 di adesso più uno per il gigante) e pochi numeri. Deterministico (niente `Math.random` nell'audio: c'è `wobble()` in `synth.ts`) e provato dall'`audio.spec.ts` offline. I leggendari hanno un verso tutto loro, scritto a mano.

**Costo e modello.** S–M. Sonnet xhigh.

### F5. La musica che cambia con il posto e la situazione

**Opinione.** Sì, è metà dell'atmosfera. Oggi `music('world')` è un solo brano per tutta la mappa (`music()` si chiama solo da 5 punti: home, world, battle/boss, victory/defeat). Il collo di bottiglia non è il codice: sono le composizioni e il tuo orecchio, perché i test controllano solo che non sia muto e non distorca.

**Cosa ho trovato.** Le tecniche standard sono tre: il **layering verticale** (strati sovrapposti che si accendono o spengono, per esempio le percussioni in lotta), il **riordino orizzontale** (sezioni intercambiabili) e gli **stinger** (colpi brevi legati a eventi). Una guida pratica consiglia di partire dal layering verticale, aggiungere effetti guidati da parametri (filtro, riverbero) e usare il riordino solo se il budget lo regge; gli stinger vanno suonati sopra la musica, senza interromperla (Audiokinetic, guide di audio per il web).

**Come, a gradini:**

1. **Un tema per luogo** (6–8): centro e Castellone antichi, Mola e il porto, Vindicio con spiaggia e pineta, Gianola con le rovine, i Monti Aurunci, gli interni (casa, Morgana, circolo), il dungeon. Si sceglie con l'area (`areas` delle mappe) usando le dissolvenze che già ci sono (`music.ts`). Meglio nella stessa famiglia di tonalità, così il passaggio suona naturale.
2. **La notte come variante, non come brano nuovo:** tempo −10%, lead più morbido, filtro. Parametri sullo stesso `Track`.
3. **Le situazioni:** brani di lotta diversi per selvatica, allenatore, covo, rivale, boss e leggenda; stinger per il «!» dell'allenatore (c'è già l'effetto `spot`), il livello, l'evoluzione, la cattura, una pietra trovata, i PS bassi; uno **strato d'intensità** in lotta (batteria e arpeggio quando qualcuno scende sotto il 30%).
4. **Un motivo per ogni amico**, due battute che tornano nel tema del suo covo e nella sua lotta (il «GIÀ LO SAI» di Costanzo…).

Un brano è testo (16 passi per battuta): una ventina di brani sono 300–400 righe in `tracks.ts` (oggi sono 146 per 6 brani). Le varianti si ricavano con parametri (`transpose`, `bpm`, sostituzione di voci), non si scrivono da capo. Conviene lavorare a lotti di tre brani e farli ascoltare a te.

**Costo e modello.** M per il motore (strati, stinger), M–L per le composizioni. Sonnet xhigh; Haiku no.

### F6. Le scelte che cambiano la storia

**Opinione.** Sì, e sarebbe un vantaggio sui Pokémon: nei giochi principali la vera ramificazione è rara (quasi tutto è estetico: la creatura iniziale, il fossile, qualche battuta; *mia conoscenza*). Ma la ramificazione costa molto, e va fatta con una struttura che regga.

**Cosa ho trovato.** La struttura standard è **branch-and-bottleneck**: i percorsi si aprono e poi si richiudono su momenti fissi della trama. Le guide delle comunità di narrativa interattiva (non di RPG) contano il rischio: 5 scelte binarie sono 32 percorsi, 10 sono 1024. Le regole che tornano: usare le scelte presto per cambiare *lo stato* e più tardi per ramificare; far cambiare ai flag i contenuti successivi più che il percorso; dare a ogni scelta una conseguenza proporzionata al suo peso; i colli di bottiglia troppo bruschi tolgono significato alle scelte.

**Cosa c'è già:** flag (`st.seen`, `st.beaten`, `flag(id)` in `story/plot.ts`), personaggi che compaiono con `when { after, until }`, scelte nei dialoghi (`say(righe, chi, [{ label, fn }], dopo)` è già usato nelle lotte), e `with`/`unless` per far parlare gli amici diversamente a seconda di chi è in squadra.

**Proposta: tre decisioni grandi e tante piccole reazioni**, sempre dentro i sette passi di trama (i colli di bottiglia):

1. **Le pietre.** Con Mamurra: sigillare la città o usare le pietre. Cambia il finale e chi è Lamo (un guardiano che ti aiuta, o un re da affrontare).
2. **Tullio.** Nei tre incontri lo aiuti o lo prendi in giro, e un flag `tullio-legame` cresce. Alleato (nel finale combatte con te, ti regala qualcosa) o rivale amaro (finale più duro, altro premio).
3. **Lamo.** Catturarlo, liberarlo o stringere un patto con una piccola missione. Decide quale leggendario ti segue.
4. **Reazioni piccole:** gli eventi di quartiere (D1) danno una *reputazione* per quartiere che sblocca sconti e persone; i dialoghi citano le tue scelte; chi c'è in squadra cambia le battute.
5. **L'epilogo:** una schermata che racconta le tue scelte. Costa poco e fa un effetto enorme.

**Costo e modello.** Opus max per l'architettura: convenzione dei flag (`sc-…`), una funzione `lines()` con varianti condizionate, l'assemblatore dell'epilogo, la compatibilità dei salvataggi e un test che ogni ramo sia raggiungibile. Sonnet xhigh per scrivere i rami.

### F7. I leggendari

**Opinione.** Sì. Oggi c'è un solo leggendario (Lamo): esce di notte dopo la trama, ci cammini incontro e lotti. Un leggendario dovrebbe essere un *evento*, non uno spawn.

**Cosa ho trovato.** Secondo le fonti, un leggendario sembra speciale per quattro motivi: rarità, una lotta a più fasi (la lotta con Zygarde in Z-A è in tre parti), una storia, e un accesso che si guadagna (in Brilliant Diamond/Shining Pearl solo dopo la Lega). In Legends Arceus i **Nobili** sono boss in cui *schivi* a piedi e lanci balsami, e i critici li hanno trovati una bella novità (con i controlli a volte imprecisi, e la possibilità di ripartire senza perdere progressi che toglie il dispiacere). L'enigma del Regi (le iscrizioni in Braille da decifrare prima di entrare nei templi) è un esempio di luogo più enigma più leggendario *(mia conoscenza; le guide che ho trovato non concordano sui dettagli)*.

**Leggende di Formia a cui attingere:**

- **Lamo**, già nel gioco: nell'Odissea Telepilo è «la rocca di Lamo».
- **Antifate**: nel libro X dell'Odissea è lui il re dei Lestrigoni, e scatena l'attacco contro le navi di Ulisse (ne scampa una sola). Nel gioco si può farne un secondo gigante, diverso da Lamo: la guerra contro la pace (è un'invenzione del gioco, come le pietre). Si presta a una lotta in mare, in tempesta.
- **Elmo**, dal fuoco di Sant'Elmo: Erasmo è il patrono dei marinai e a Formia morì il 2 giugno 303 (già in `CLAUDE.md`). Compare sul faro durante un temporale, come evento; Caos e Calma.
- **La Janara** nella grotta *(da verificare)*.
- *Cornice:* i Lestrigoni sono tornati di attualità con il film *The Odyssey* di Nolan (luglio 2026), a quanto si legge nei titoli di Il Post e BestMovie; può servire a spiegare il nome «Telepilo». La Fonte Artacia compare nell'Odissea, ma dove stia è discusso (c'è chi la mette a Capo d'Orso, in Sardegna): nel gioco si dice «si racconta».

**La struttura di ogni leggenda:** luogo e condizioni → **enigma** → **prova di movimento** → **lotta a fasi** → **dilemma** → **segno**.

- *Condizioni:* flag, ora, tempo (temporale), pietre.
- *Enigma, stile Regi:* per Lamo, mettere le tre pietre in tre nicchie nell'ordine dei loro segni (mura, onda, voce).
- *Prova di movimento, stile Nobili:* una breve fase a piedi, con le piastrelle a pericolo del motore dei luoghi (F8), prima del duello.
- *Lotta a fasi:* PS al 100, 60 e 30%; a ogni fase mosse nuove, un altro verso e un'altra musica; il retino regge solo nell'ultima.
- *Dilemma:* catturarlo, liberarlo, stringere un patto (F6).
- *Segno:* musica, magia, verso, pagina del diario e creatura che ti segue, tutti suoi.

**Il modo economico:** un `LegendDef` in `data/` (condizioni, mappa, enigma, fasi, dilemma, risorse) e un solo esecutore. Lamo è il primo (si migra quello che c'è); Antifate ed Elmo sono dati più un po' d'arte (Antifate riusa il corpo `giant` con un'altra palette; Elmo vuole il corpo del fuoco fatuo, lo stesso di F2).

**Costo e modello.** L il framework, S–M ogni leggenda dopo. Opus max per il framework; Sonnet xhigh per le leggende come dati, arte e frasi.

### F8. Le palestre-labirinto con gli scagnozzi

**Opinione.** Sì: è la cosa più «Pokémon» che resta da fare. Oggi un covo è un amico fermo in un posto (Forchetta dietro la rete, Costanzo in piazza). Dovrebbe essere un'esperienza: ingresso → scagnozzi → prova → boss.

**Cosa ho trovato.** I tipi di puzzle delle palestre classiche sono noti: teletrasporti (Sabrina), interruttori (Surge)… Ma c'è anche il rovescio: le classifiche delle «palestre da urlo» mettono in cima quella di Sabrina, perché le palestre psico ricorrono spesso a puzzle che *nascondono* la soluzione, e quella di Surge, un gioco a indovinare (i bidoni). Per i fan, Sunyshore è una sfida per chi *ragiona*, non per chi è sfortunato. Le palestre di oggi (le Prove di Scarlet/Violet) sono diverse per ogni città e insegnano le usanze del posto, con riuscita mista: «non tutte le prove sono uguali». Sulla costruzione dei puzzle, l'analisi dei dungeon di Zelda e i manuali di puzzle design ripetono la stessa regola (non è una formula ufficiale di Nintendo): **introduci, rovescia, combina**. Una meccanica nuova alla volta, in una stanza semplice e controllata (il Dragon Roost di Wind Waker), poi si intreccia con le altre; e una meccanica introdotta e poi abbandonata è un difetto.

**Cosa c'è già:**

| serve | c'è già? |
|---|---|
| pad di teletrasporto (Sabrina) | **sì**: un `warp` verso un'altra parte della stessa mappa |
| scagnozzi con linea di vista | sì: `seesAntonio`, `approach`, `walkPath` (ma fermi, senza pattuglia) |
| porte con domanda | quasi: il quiz di Morgana (`ui/activities.ts`) |
| prove a tempo e di movimento | sì: la corsetta in pineta, la pesca, il windsurf |
| condizioni sulla storia | sì: `when { after, until }` |
| controllo di raggiungibilità | sì: `tests/unit/maps.test.ts` (ma non per puzzle con stati) |

**Cosa manca (il motore dei luoghi):** caselle solide che si aprono con un interruttore (serve un gancio sulla solidità in `story/maps.ts`), interruttori, caselle che fanno scivolare (stile Rocket), pattuglie, pericoli a tempo, caselle a ritmo, punti di ripartenza e un **validatore** (un BFS nello spazio posizione × interruttori) che *dimostra* che ogni palestra è risolvibile. I blocchi da spingere (Sokoban) li lascerei per dopo: costano molto e non servono per cominciare.

**Idee per ogni covo (provvisorie):**

- **Costanzo, Piazza della Vittoria («GIÀ LO SAI»):** la folla del comizio. I sostenitori ti sbarrano la strada finché non rispondi a una domanda (porte con quiz). Scagnozzi: i galoppini.
- **Forchetta, Circolo Tennis («Poteva andare peggio»):** i lanciapalle sparano lungo file e colonne a ritmo; si attraversa a tempo (pericoli a tempo). Scagnozzi: i raccattapalle.
- **Andrea, padel («calcolo»):** un tappeto di frecce che scivolano come una pallina sul vetro; si pianifica il percorso (caselle che spingono). Scagnozzi: i giocatori che guardano.
- **Valentin, Eclipse e beach volley («Animale anomalo»):** un labirinto di ombrelloni con pad che portano da un'altra parte *in ordine*, non a caso (a caso sarebbe ingiusto).
- **Zendavid, pineta e cuffie:** si cammina a tempo con la musica del covo; le caselle sicure pulsano. Con un aiuto visivo, e una modalità senza.

**Regole per non fare «palestre da urlo»:** una meccanica nuova per stanza, e le successive la riprendono; la soluzione si *vede* (indizi sul pavimento o un cartello); niente indovinare; una ripartenza vicina; dopo la prima vittoria la scorciatoia resta aperta. Cicerone (`advice`) può dare un indizio se si resta fermi (come già fa con il giro).

**Costo e modello.** L il motore e il validatore, M ogni covo. Opus max per il motore e il validatore; Sonnet xhigh per ciascun covo (mappa, scagnozzi, frasi, spilla).

### G. Oltre: altre idee per rendere il gioco più bello

Ricerca più debole qui (aneddoti di fan, non studi), ma le richieste tornano: Contests, Snap, Amie, basi segrete, Battle Frontier.

- **G1. Concorsi di Formia** *(M)*. I Concorsi dei Pokémon sono tra le cose più rimpiante: una gara di *eleganza* in cui scegli le mosse per la giuria. Qui mette in mostra proprio ciò che ti piace (animazioni, versi, musica) senza una barra dei PS. Premi: fiocchi.
- **G2. Foto-safari** *(M)*. Come Pokémon Snap: una modalità macchina fotografica nel mondo, dove si fotografano creature che dormono, mangiano, giocano; punteggio e voce nel diario. Più la vita ambientale (le creature *fanno* cose).
- **G3. Album delle figurine** *(S–M)*. Un album da completare con le creature, gli amici e i posti; i doppioni si scambiano con un codice («ce l'ho, mi manca»). È l'idea di Tajiri dello scambio, in versione italiana.
- **G4. L'orto di Parco la Fontana** *(S–M)*. Come le bacche dei Pokémon: si piantano olive, anice, erbe nel giardino di casa e crescono in tempo reale; il raccolto va in cucina (B3) e negli oggetti (A4).
- **G5. Coccole e cura delle creature** *(S–M)*. Come Amie e Refresh (i fan ne sentono la mancanza): spazzolare, dar da mangiare, giocare a palla nell'appartamento, per alzare il legame. Il legame esiste già (cuori); qui diventa un gesto.
- **G6. Meteo e stagioni** *(M)*. Pioggia, temporale, nebbia, vento, deterministici dalla data (niente rete): immagine, suono, creature, e un effetto di luogo in lotta. Il temporale al faro è l'occasione per Elmo.
- **G7. Gli orari delle persone** *(S–M)*. I negozi aprono e chiudono, Morgana la sera è piena, la gente si sposta. Formia è già viva nello spazio; così lo è nel tempo.
- **G8. La casa personalizzabile** *(S)*. Le basi segrete di Ruby/Sapphire sono tra le richieste dei fan: mobili e decorazioni trovati o comprati, per dare un uso ai sesterzi.
- **G9. Qualità della vita** *(S)*. Tasto «Veloce» per le animazioni, salto dei testi già letti, ripetere l'ultima mossa. Più il gioco diventa bello da guardare, più serve poterlo accelerare.

## 6. Il nome

Il nome attuale è nei testi, nel titolo, nella home, nel trailer, in `package.json`, nel repo e nelle chiavi del salvataggio.

Proposte, con il perché:

1. **Telepilo** (sottotitolo: «Creature di Formia»). Breve, misterioso, legato alla trama (Cicerone: «la Telepilo dei Lestrigoni») e unico da cercare. Perde la parola «amici».
2. **Amici e Lestrigoni**. Tiene gli amici e il mito dei giganti; gioca sull'allitterazione.
3. **Formiae**. Il nome latino: elegante, ma più freddo.
4. **Lamo** (il re dei Lestrigoni): cortissimo, ma suona come il titolo di un solo personaggio.
5. **Le Pietre di Telepilo**: già il titolo del primo atto. Meglio come sottotitolo del capitolo 1.

Il mio voto: **Telepilo** come nome, «Le Pietre di Telepilo» come primo capitolo, e il resto del gioco che continua a dire «amici» nelle schermate. Evitare nomi che suonino come Pokémon: niente «-mon», «Poké», «Legends».

**Cosa cambiare e cosa no:**

- Una costante sola per il nome (come `COIN` in `data/growth.ts`), usata da home, titolo della pagina, README, `CLAUDE.md`.
- **Non rinominare le chiavi del salvataggio** (`lotte-tra-amici:storia:v1`, `…:libretto:v2`, `…:audio:v1`, `…:ora:v1`): chi ha una partita la perderebbe. Restano così, con una nota in `CLAUDE.md`.
- Il trailer resta fermo finché Antonio non lo chiede: il nome lì si cambia alla prossima edizione.
- Il repo pubblico si chiama «Metaverse-Pokemonized»: «Pokémon» è un marchio. Se il gioco si fa vedere in giro, conviene rinominarlo su GitHub (c'è il reindirizzamento dal vecchio nome).

## 7. Le priorità, tutte insieme

Unisce le idee di §4 (A–E) e di §5 (F, G). L'ordine tiene conto di tre cose: quanto cambia il divertimento, quanto lo hai chiesto tu, e da cosa dipende il resto. Due cose sostengono quasi tutto e vanno per prime: **le lotte che pensano** (A1–A4, il buco che ho misurato) e **un motore dei luoghi** (puzzle, buio, validatore: serve a palestre, dungeon e leggende).

| # | cosa | perché è qui | chi la fa |
|---|---|---|---|
| 1 | **Lotte che pensano**: cambio di creatura, abilità, oggetti tenuti, stati alterati (A1–A4) | il buco misurato; la corsa, i boss, i leggendari e il PvP si appoggiano qui | Opus max |
| 2 | **Motore dei luoghi**: caselle interattive, pattuglie, buio, validatore (F8, F2) | sblocca palestre, dungeon e leggende con un'unica base | Opus max |
| 3 | **Livelli che seguono la squadra** (F1) | l'hai chiesto; piccolo; si vede subito | Sonnet xhigh |
| 4 | **Suono**: versi per specie ed evento (F4), poi musica per luogo e situazione (F5) | grande atmosfera, rischio basso | Sonnet xhigh |
| 5 | **Cinque covi-labirinto con gli amici** (F8, C1) | la cosa più «Pokémon» che resta; usa le meccaniche degli amici che esistono già | motore Opus, covi Sonnet |
| 6 | **Il Cisternone**, primo dungeon, con creature d'ambiente (F2) | il modello degli altri; è già nella trama | Sonnet |
| 7 | **Animazioni per mossa** (F3) e tasto «Veloce» | metà del lavoro è fatta; solo interfaccia | Sonnet xhigh |
| 8 | **Leggendari come eventi**: framework, Lamo rifatto, poi Antifate ed Elmo (F7) | usa i puzzle (#2) e le lotte a fasi (#10) | framework Opus, resto Sonnet |
| 9 | **Scelte che cambiano la storia**, Tullio e Mamurra con delle ragioni (F6, C2) | un salto di qualità della storia | architettura Opus, rami Sonnet |
| 10 | **Slancio e Risonanza**, boss con regole proprie (A5, A8) | il gimmick di Formia; va tarato con il simulatore | Opus max |
| 11 | **Formia nel tempo**: calendario vero, eventi brevi, cucina, orto (B2, D1, B3, G4) | rende vivo il mondo e dà motivo di tornare | Sonnet |
| 12 | **Rigiocabilità e amici**: corsa e sfida del giorno, codice squadra, figurine (C4, E1, G3) | senza server; solo dopo #1 | corsa Opus, resto Sonnet |
| 13 | **Più specie e varianti, compiti nel diario, incontri visibili** (C6, B5, B1) | ampliare quello che c'è | Sonnet |
| 14 | **Concorsi, foto-safari, coccole, meteo, orari, casa** (G1, G2, G5, G6, G7, G8) | la parte «oltre»: charme, non base | Sonnet |
| 15 | **Lotte in due** (Antonio con la creatura) e il gimmick di ogni città del secondo atto (A9, C7) | il cambio di motore più grosso: per ultimo | Opus max |

**Due tracce in parallelo.** Le cose di Opus (#1, #2, #8, #9, #10) toccano `src/battle/`, `story/maps.ts`, `story/movement.ts`, `render/world-view.ts` e i salvataggi. Quelle di Sonnet (#3, #4, #6, #7, #11) toccano `audio/`, `ui/spells.ts`, `data/encounters.ts`, `data/maps/` e `render/svg/`. Si sovrappongono poco: un branch per traccia, un commit per idea. L'unico punto d'incontro è `ui/story-screen.ts`.

**Cosa farei per primo.** Dal lato Sonnet: i livelli (#3) e i versi (#4), che sono piccoli e si sentono subito. Dal lato Opus: l'idea #1, partendo da `tools/sim-fun.ts` per avere il metro (turni, «greedy contro IA», vantaggio di tipo) prima di cambiare il motore. Poi il Cisternone come banco di prova del motore dei luoghi.

## 8. Cosa non rompere

- I golden dei 2040 duelli tra amici: tutto ciò che riguarda le creature sono campi facoltativi, attivi solo con `s.story`.
- Il motore resta puro: niente `Math.random`, `Date` né DOM. Occhio **all'ordine in cui si consuma il generatore casuale**: aggiungere un tiro a metà turno cambia ogni lotta successiva.
- La UI non conosce le regole: riproduce eventi (`say`, `hp`, `anim`, `sync`…). Nuovi stati e abilità vogliono nuovi eventi o campi in `snap`/`chips`, non logica in `ui/battle-screen.ts`.
- Salvataggi: `lotte-tra-amici:storia:v1` con campi facoltativi (`item`, `abil`, la modalità), compatibili all'indietro.
- Creature originali, testi in italiano, commenti in inglese, commit in italiano, solo PC, trailer fermo.
- Ogni creatura è un SVG intero: una specie nuova costa il disegno. Le varianti (C6) sono la strada economica.
- Il motore dei luoghi: ogni palestra e ogni dungeon con puzzle ha un validatore nei test che dimostra che si può finire. Niente indovinare, niente caselle che si chiudono alle spalle senza una ripartenza.
- L'audio resta senza `Math.random`; le animazioni nuove sono solo interfaccia (nessun effetto sul motore) e hanno il tasto «Veloce».
- Fatti su Formia aggiunti per i luoghi e i leggendari: si verificano come tutti gli altri (vedi «Fonti dei fatti di Formia» in `CLAUDE.md`).

## 9. Chi fa cosa: Opus, Sonnet, Haiku

È un giudizio, non una misura: non ho confrontato i modelli su questo repo, e la scelta giusta dipende anche da quanto vuoi spendere. Il criterio che uso:

- **Opus 5.5 max** quando una cosa tocca il motore deterministico o l'ordine in cui si consuma il generatore casuale; quando è un'architettura che userà tutto il resto; quando un errore è *silenzioso* (un salvataggio che non si apre, un golden che cambia, una palestra impossibile da finire); quando c'è da progettare e bilanciare, non solo da scrivere.
- **Sonnet 5.5 xhigh** quando la funzione è ben definita e si appoggia a un modello già scritto; quando è contenuto con un test o il simulatore che lo controllano; quando il giudizio finale è visivo o sonoro, cioè tuo.
- **Haiku 5.5** solo per lavori meccanici, su modello e verificati da test.
- **Il modo più economico di usarli insieme:** Opus scrive il framework, un esempio completo e i test; Sonnet lo ripete per tutti i contenuti; Haiku riempie le tabelle. Dopo ogni cosa di Opus, `/code-review high` prima di unire.

### Lista 1: Opus 5.5, max (in ordine di priorità)

*Stato al 5 novembre 2026: fatti i punti da 1 a 8 (vedi «Le lotte di squadra», «Stati, abilità e oggetti», «I luoghi con un enigma», «Le scelte», «La magia del luogo, lo Slancio e la Risonanza», «Le leggende come eventi» e «Un giorno a Formia» in `CLAUDE.md`). Fatta anche la magia del luogo (A6), che il punto 7 richiede. Le decisioni di trama di §5 F6 Antonio le ha lasciate al giocatore. Il punto 9 è fermo per scelta di Antonio: serve il secondo atto. Due correzioni a questo briefing, misurate: i moltiplicatori di tipo non vanno alzati, ma per un motivo diverso da quello di §3 (rompono l'inizio della storia); e l'obiettivo «8–10 turni» non conviene inseguirlo abbassando i danni (le rigenerazioni diventano muri), mentre gli altri obiettivi si raggiungono senza.*

1. **Cambio di creatura e squadra nello stato di lotta, e l'IA che cambia (A1).** Riscrive la catena di duelli in uno stato di squadra senza spostare l'ordine del generatore casuale né i golden: è il cuore del motore.
2. **Ganci per stati alterati, abilità e oggetti tenuti (A2–A4).** Decidere dove si innestano (entrata, colpo dato, colpo subito, fine turno), quali eventi mandano alla UI e come si bilanciano. Il contenuto (le singole abilità) è poi di Sonnet.
3. **Motore dei luoghi (F8).** Caselle solide che si aprono, interruttori, scivoli, pattuglie, pericoli a tempo, caselle a ritmo, ripartenze, stato salvato e il **validatore** nei test che dimostra che ogni palestra si può finire. Se sbagliato, una palestra è impossibile e non lo sa nessuno.
4. **Buio e raggio di luce nei luoghi chiusi (F2)**, senza rompere i golden del canvas.
5. **Framework dei leggendari `LegendDef` e Lamo rifatto (F7).** Condizioni, enigma, lotta a fasi, dilemma, salvataggio.
6. **Scelte che cambiano la storia (F6).** Convenzione dei flag, `lines()` con varianti, epilogo, compatibilità dei salvataggi, test che ogni ramo sia raggiungibile.
7. **Slancio e Risonanza, boss con regole proprie (A5, A8).** Progettazione e bilanciamento con il simulatore.
8. **Il motore di «Un giorno a Formia» e della sfida del giorno (C4).** Semi, scelta delle creature, ricompense: deve essere riproducibile.
9. **Lotte in due e il gimmick del secondo atto (A9, C7).** Il cambio di motore più grande.

Se devi risparmiare: per i punti 6–8 basta `xhigh`; il `max` serve davvero ai punti 1–5.

### Lista 2: Sonnet 5.5, xhigh (in ordine di priorità)

1. **Livelli che seguono la squadra (F1)**, con il simulatore.
2. **Versi per specie ed evento (F4).**
3. **`tools/sim-fun.ts`**: promuovere i due esperimenti a strumento e aggiungere le metriche di §4. Serve presto, prima del punto 1 di Opus.
4. **Musica (F5):** prima la parte tecnica (strati, stinger, dissolvenze per luogo), poi i temi a lotti di tre, con il tuo ascolto.
5. **Animazioni per mossa (F3):** gesti, motivi, circa 10 scene firma, tasto «Veloce».
6. **Il Cisternone come dungeon-modello (F2):** mappa, tabella d'incontri, specie d'ambiente (con i corpi nuovi), scena di battaglia, musica. Dopo il motore dei luoghi.
7. **Un covo alla volta (F8, C1):** Forchetta, Costanzo, Andrea, Valentin, Zendavid. Mappa ASCII, scagnozzi, frasi, spilla.
8. **Contenuto di abilità e oggetti (A3, A4):** le singole abilità, le tabelle, i testi.
9. **Leggende come dati (F7):** Antifate, Elmo, la Janara; arte e frasi.
10. **Rami delle scelte (F6) e Tullio e Mamurra (C2).** Scrittura.
11. **Calendario vero e stagioni (B2), eventi brevi (D1), storie degli amici (D2).**
12. **Cucina (B3) e orto (G4).**
13. **Incontri visibili (B1) e compiti nel diario (B5).**
14. **Altri dungeon** (peschiere, cripta, terme) **e più specie con varianti (C6).**
15. **Codice squadra e scambio (E1), classifica degli amici (E3), figurine (G3).**
16. **Il resto di «oltre»:** concorsi (G1), foto-safari (G2), coccole (G5), meteo (G6), orari (G7), casa (G8), tre modalità di gioco (C3), arena delle regole (C5).

### Lista 3: Haiku 5.5 (in ordine di priorità)

Solo con test che verificano il risultato.

1. **Il nome (§6):** una costante sola e le sostituzioni nei testi, *senza* toccare le chiavi `lotte-tra-amici:*`.
2. **Documenti:** aggiornare `CLAUDE.md` e `PROSSIMI-PASSI.md` dopo ogni fase, partendo dai diff.
3. **Righe di dati su modello:** nuove voci in `encounters.ts`, prezzi dei negozi, ricette, oggetti.
4. **Frasi brevi** di persone di quartiere nello stile che c'è, poi riviste da te o da Sonnet.
5. **Varianti di colore delle specie** (palette), poi le guardi tu.
6. **Test unitari sui dati** (tabelle coerenti, id che esistono).
7. **Controllo dell'italiano** nei testi del gioco.

Mai Haiku su: motore di lotta, salvataggi, numeri di bilanciamento, golden da rigenerare, fatti su Formia (vanno verificati), arte SVG nuova.

### Cosa lascerei a te

Il nome; ascoltare le musiche e i versi; guardare le animazioni; le decisioni di trama (cosa succede con le pietre, con Tullio, con Lamo); i fatti su Formia e su persone vere (riservatezza); provare a mano ogni covo.

## 10. Fonti

Recensioni e articoli, non studi; la qualità è varia.

- Legends Z-A: [Nintendo Life, la raccolta delle recensioni](https://www.nintendolife.com/news/2025/10/round-up-the-reviews-are-in-for-pokemon-legends-z-a), [TechRadar](https://www.techradar.com/gaming/pokemon-legends-za-preview-gamescom-2025), [Gamepressure](https://www.gamepressure.com/editorials/reviews/pokemon-legends-z-a-review-evolution-without-exploration/zd7a5).
- Legends Arceus: [Shacknews](https://shacknews.com/article/128488/pokemon-legends-arceus-review-when-pokemon-ruled-the-earth), [Looper](https://www.looper.com/747762/what-the-critics-are-saying-about-pokemon-legends-arceus), [Screen Rant](https://screenrant.com/pokemon-sword-shield-legends-arceus-open-world-bad/).
- Scarlet/Violet: [Den of Geek](https://www.denofgeek.com/games/pokemon-just-isnt-better-as-an-open-world-game/), [Engadget](https://www.engadget.com/pokemon-scarlet-and-violet-review-growth-and-growing-pains-140048933.html), [Game Rant su Tera nelle palestre](https://gamerant.com/pokemon-scarlet-violet-gym-battles-terastal-brassius-sudowoodo-type-advantage/).
- Sword/Shield: [TV Tropes (opinioni)](https://www.tvtropes.org/pmwiki/pmwiki.php/YMMV/PokemonSwordAndShield), [PokéCommunity](https://daily.pokecommunity.com/2020/02/18/pokemon-sword-and-shield-review-the-new-gameplay-features).
- Champions: [VGC](https://www.videogameschronicle.com/news/pokemon-champions-new-details-revealed-for-switch-and-mobile-battling-game), [Lords of Gaming](https://lordsofgaming.net/2026/04/pokemon-champions-review-the-future-of-vgc-starts-here/), [EOG](https://eog.gg/games/pokemon-champions/guides/review/).
- Cassette Beasts: [Nintendo Life, intervista agli sviluppatori](https://www.nintendolife.com/features/cassette-beasts-dev-on-doing-what-pokemon-doesnt-in-a-zelda-inspired-overworld), [Game Developer](https://gamedeveloper.com/design/cassette-beasts-is-a-fun-rpg-that-turns-monster-into-mixtapes), [RPGamer](https://rpgamer.com/review/cassette-beasts-review/).
- Temtem: [PC Gamer](https://www.pcgamer.com/uk/temtem-is-even-better-than-pokemon-on-pc), [TheGamer, sinergia](https://www.thegamer.com/temtem-combat-guide-tips-tricks-synergy/), [Game Informer](https://www.gameinformer.com/review/temtem/competitive-evolution).
- Coromon e Monster Sanctuary: [Pro Game Guides](https://progameguides.com/coromon/coromon-vs-pokemon-similarities-and-differences/), [Everyeye](https://www.everyeye.it/articoli/recensione-coromon-clone-pokemon-56960.html).
- Palworld: [GamesRadar](https://gamesradar.com/we-need-to-stop-calling-palworld-pokemon-with-guns-because-its-actually-a-bizarre-mashup-of-survival-and-a-very-particular-kind-of-management-game), [Final Boss](https://finalboss.io/palworlds-creature-labor-is-the-point-and-it-should-feel-wrong).
- PokéRogue: [VideoGamer](https://www.videogamer.com/news/fan-made-roguelike-that-reinvents-pokemon-has-over-a-million-players-now), [Dot Esports](https://dotesports.com/pokemon/news/pokerogue-popularity-shows-pokemon-needs-to-broaden-its-horizons).
- Nuzlocke: [Smogon](https://www.smogon.com/articles/introduction-nuzlockes), [Bulbapedia](https://m.bulbapedia.bulbagarden.net/wiki/Nuzlocke), [Dexerto](https://www.dexerto.com/pokemon/what-is-the-pokemon-nuzlocke-challenge-1736809/).
- Shin Megami Tensei: [Megaten Wiki, Press Turn](https://megatenwiki.com/wiki/Press_Turn_System). Octopath: [Twinfinite](https://twinfinite.net/2018/07/5-things-i-wish-i-knew-before-playing-octopath-traveler/2/), [Turn Based Lovers](https://turnbasedlovers.com/review/the-power-of-eight-octopath-traveler-tbl).
- Gioco competitivo: [Smogon, livelli di Velocità](https://www.smogon.com/resources/competitive/bw/ouspeed_tiers), [Nugget Bridge](https://nuggetbridge.com/articles/speed-tiers/).
- Black/White e N: [PokéCommunity](https://www.pokecommunity.com/threads/ns-x-factor.333394), [Fanlore](https://next.fanlore.org/wiki/BW). Origini di Pokémon: [Wikipedia, Satoshi Tajiri](https://en.wikipedia.org/wiki/Satoshi_Tajiri), [TechRaptor](https://techraptor.net/content/game-changers-pokemon).

Seconda parte (§5):

- Livelli: [GamesRadar, l'ex progettista di Oblivion](https://www.gamesradar.com/games/the-elder-scrolls/as-oblivion-remastered-introduces-new-fans-to-bethesdas-iconic-2006-rpg-ex-elder-scrolls-dev-admits-the-level-scaling-system-was-a-mistake-eventually-fixed-in-skyrim), [GamesRadar su Scarlet/Violet senza scalatura](https://gamesradar.com/pokemon-scarlet-and-violets-open-gym-challenge-wont-include-level-scaling-and-that-sucks), [Giant Bomb, Level Scaling](https://giantbomb.com/wiki/Concepts/Level_Scaling).
- Grotte: [Smogon, dungeon memorabili](https://www.smogon.com/forums/goto/post?id=6795375), [Bulbapedia, Caves](https://bulbapedia.bulbagarden.net/wiki/Caves), [PokéCommunity, le grotte](https://www.pokecommunity.com/threads/caves-from-familiarization-to-true-complexity.307809).
- Palestre e puzzle: [PokéBase, tipi di puzzle](https://pokemondb.net/pokebase/404954/what-are-all-of-the-various-gym-puzzle-types-to-solve-the-games), [TheGamer, palestre pessime](https://www.thegamer.com/pokemon-15-awful-gyms-that-make-you-want-to-scream/), [Pro Game Guides, Prove di Scarlet/Violet](https://progameguides.com/pokemon-scarlet-and-violet/what-are-gym-tests-in-pokemon-scarlet-and-violet/), [Zelda Dungeon, Dragon Roost](https://www.zeldadungeon.net/?p=10933), [Crit Points, Nuzzles](https://critpoints.net/2020/04/15/nuzzles-not-a-puzzle/).
- Versi: [Hackaday, i versi dei Pokémon](https://hackaday.com/2019/01/04/pokemon-cries-and-how-they-work), [The Cutting Room Floor, Red e Blue](https://tcrf.net/Notes:Pok%C3%A9mon_Red_and_Blue), [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_cry).
- Musica: [Audiokinetic, musica interattiva](https://www.audiokinetic.com/en/blog/how-to-use-interactive-music-to-score-gameplay/), [Abratabia, musica dinamica per il web](https://abratabia.com/web-game-audio/dynamic-game-music.php).
- Narrativa ramificata (guide di comunità di narrativa interattiva, non di RPG): [IFWiki, schemi delle storie a scelta](https://www.ifwiki.org/Standard_Patterns_in_Choice-Based_Games), [TV Tropes, branch-and-bottleneck](https://tvtropes.org/pmwiki/pmwiki.php/Main/BranchAndBottleneckPlotStructure).
- Leggendari: [Game Rant, lotte con i leggendari](https://gamerant.com/pokemon-legendary-battle-improvement-ideas/), [VGC, i leggendari di Z-A](https://www.videogameschronicle.com/guide/pokemon-legends-z-a-legendary-pokemon-all-legendary-pokemon-in-legends-z-a), [Game Informer, Legends Arceus](https://gameinformer.com/review/pokemon-legends-arceus/pokemon-legends-arceus-review-learning-some-new-moves), [Digital Trends, i Nobili](https://digitaltrends.com/gaming/pokmon-legends-arceus-noble-pokmo), [National Dex, enigma dei Regi](https://nationaldex.io/guide/pokemon-ruby-sapphire-emerald/regi-puzzle) (guide poco concordi).
- Oltre: [Smogon, Amie e minigiochi](https://www.smogon.com/forums/goto/post?id=8925629), [GamesRadar, funzioni da riavere](https://www.gamesradar.com/pokemon-x-y-8-classic-features-we-want-return-3ds/), [Bulbagarden, Amie](https://bulbagarden.net/threads/pokemon-amie-new-bonding-feature.152023/post-4780627).
- Lestrigoni e Odissea: [Odissea, libro X](https://it.wikisource.org/wiki/Odissea/Libro_X), [Ministero della Cultura, nuove ipotesi sui Lestrigoni](https://cultura.gov.it/comunicato/nuove-ipotesi-sul-mito-dei-giganti-i-ciclopi-i-lestrigoni), [Il Post, Odissea di Nolan e i Lestrigoni](https://www.ilpost.it/2026/07/19/nolan-odissea-lestrigoni/), [BestMovie, i Lestrigoni e il film](https://www.bestmovie.it/news/the-odyssey-chi-sono-lestrigoni-giganti-antropofagi-film-christopher-nolan/968849/).
