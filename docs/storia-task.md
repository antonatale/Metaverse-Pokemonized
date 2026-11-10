# Storia delle task

> Le task fatte, tagliate e incollate senza riscriverle il 10 novembre 2026 (R2 di `REVISIONE.md`): prima da `TASK-MODELLI.md`, poi i «Fatti» di `PROSSIMI-PASSI.md`. I riferimenti a sezioni di `CLAUDE.md` oggi sono in `docs/` (indice in `CLAUDE.md`).

<!-- da TASK-MODELLI.md -->

## Tutte le task

| # | Cosa | Modello | Effort | Stato |
|---|---|---|---|---|
| O1 | Le persone crescono: nuove mosse, nuovo aspetto, forme | Opus 5.5 | max | fatto |
| O2 | Tutti protagonisti: ogni amico con la sua squadra e le sue missioni | Opus 5.5 | max | fatto |
| O3 | Animazioni davvero diverse: il sistema e le prime scene | Opus 5.5 | max | fatto |
| S1 | Togliere «Un giorno a Formia» | Opus 5.5 | high | fatto |
| S2 | Mosse in quadrato, con un design più bello | Opus 5.5 | high | fatto |
| S3 | Schermata per imparare una mossa | Opus 5.5 | high | fatto |
| S4 | Comprare più cose e usarle dal menu | Opus 5.5 | high | fatto |
| S5 | La musica tra un quartiere e l'altro | Opus 5.5 | xhigh | fatto, da ascoltare |
| S6 | Negozi veri, ognuno diverso | Opus 5.5 | xhigh | fatto |
| S7 | Il Lido Oriente | Opus 5.5 | high | fatto |
| S8 | Animazioni: tutte le altre mosse | Opus 5.5 | xhigh | fatto |
| H1 | Il nome nuovo del gioco | Opus 5.5 | high | fatto |
| O4 | Il titolo a schermo intero, l'intro, tre salvataggi; via le lotte libere | Opus 5.5 | max | fatto |

**Perché così.** Opus dove un errore è silenzioso o tocca il motore, i salvataggi e il bilanciamento. Sonnet dove il compito è definito e il giudizio finale è di Antonio, a vista o a orecchio. Haiku solo per lavoro meccanico verificato dai test.


**Se riprendi questo lavoro da un altro account:** leggi questa sezione e `CLAUDE.md`, guarda `git status` (il lavoro in corso è nella cartella, non ancora in un commit) e parti dalla prima riga «da fare» o «in corso». Aggiorna lo stato qui man mano. Commit e push solo quando Antonio lo chiede.

**Dove eravamo (8 novembre 2026, sera):** tutto fatto tranne P5 (in più: il covo di ognuno sulle carte di «chi sei?», chi parte nel viaggio in treno, il benvenuto in stazione, l'albero delle abilità per chiunque si giochi), che aspetta le risposte di Antonio alle domande qui sotto. Ultima verifica: `npx tsc --noEmit` pulito, 373 test unitari, 38 partite Playwright. Nessun commit dopo 3539dcb: il lavoro dei sei protagonisti è tutto nella cartella. Se l'altro account è su un altro computer, prima serve un commit e push (solo se Antonio lo chiede).

Antonio: all'inizio si sceglie chi giocare tra Antonio, Andrea, Costanzo, Zendavid, Forchetta e Valentin; battuti, gli amici non entrano in squadra; ognuno ha il suo covo; ognuno parte da dove vive davvero; la storia di ognuno è pensata per lui; le mosse delle persone con animazioni molto più belle; le stazioni per ultime.

**Decisioni di Antonio:** sei covi a Formia, uno per amico, e chi gioca batte gli altri cinque. La seconda città è Torino per Antonio, Zendavid, Forchetta e Valentin, e Milano per Costanzo e Andrea. Per ora solo l'arrivo in stazione (Torino Porta Nuova, Milano Centrale): oltre la stazione non si va, ci sono nuvole che coprono il resto e un segno che il resto arriva con il prossimo aggiornamento. Prima della stazione, un'animazione del treno che attraversa l'Italia fino alla città.

**Dove vivono (da Antonio):**
- Antonio: Parco la Fontana, via Amendola (c'è già).
- Valentin: via Ferrucci, accanto a piazza Risorgimento, di fronte all'ospedale.
- Forchetta: via Abate Tosti, vicino alla Torre di Mola.
- Costanzo: via Solaro, vicino alla chiesa di San Giovanni (Mola).
- Andrea: Castellone, vicinissimo a piazza Mattej.
- Zendavid (Davide): all'inizio di Scauri, vicino alla stazione. Va aggiunta quella parte di mappa, a est di Gianola.
Niente numeri civici. Le coordinate vanno verificate (OpenStreetMap) prima di metterle in `formia-places.ts`.

| P1 | Aspetto: capelli di Andrea attaccati alla testa, Costanzo senza occhiali, occhi chiari a Forchetta (`render/svg/looks.ts`, `hair.ts`) | fatto (il golden degli sprite va rigenerato con `npm run golden`) |
| P2 | Sei covi (`data/covi.ts`: in più Valentin all'Eclipse, Zendavid in pineta, Andrea al padel del Bruno Zauli, Antonio al Palamendola); il livello sale di `COVO_STEP` per ogni spilla già presa (`covoLevel`); `cityCovi` toglie il covo di chi si gioca; niente `joinFriend`; il giro di Formia (`myStops`) salta il proprio covo e la propria attività; il treno della propria città (`data/gates.ts`) | fatto: `tests/unit/covi.test.ts`, partite aggiornate (`goStory` in `tests/e2e/harness.ts` risponde a «chi sei?») |
| P3 | Scelta del protagonista quando si comincia una storia («chi sei?» in `ui/home.ts`), `startAs`/`blank(first)` in `save/story-progress.ts` che parte da casa sua (`MapDef.starts`), `st.squad = [first]`; il guardaparco dà la prima creatura a chiunque; Cicerone saluta `{hero}`; gli oggetti persi sono solo di Antonio (`only` in `story/goals.ts`); i punti abilità seguono il livello di chi si gioca | fatto |
| P4 | Le case vere: fatte quelle di Valentin (via Ferrucci), Costanzo (via Solaro), Forchetta (via Abate Tosti), Andrea (Castellone) e Zendavid (Scauri), con la partenza davanti a casa (`MapDef.starts`, test in `tests/unit/covi.test.ts`). **Scauri fatta:** la mappa ora è larga 200 (`X_ANCHORS` fino a 13.725), la costa a est di Gianola è cucita in `osm-extract.json` (tre vie OSM 672636933, 672636932, 437456512), ferrovia e Appia arrivano alla stazione di Minturno-Scauri (`stazione-scauri`), zona «Scauri». Gli interni: `data/maps/homes.ts`, la pianta di `casa.ts` con il letto per dormire, la finestra su quello che si vede davvero da casa e le cose di ognuno; le creature a casa aspettano lì | fatto |
| P6 | Animazioni delle mosse delle persone (`ui/person-scenes.ts`): ogni segnale delle persone ha la sua scena (comizio, Daje, volpe, robot, palla, coriandoli, Forza Formia, abbaio, battuta, Stronger, diagnosi), le mosse imparate crescendo sono riconosciute dalla scritta del banner (CHICAGO!, MATCH POINT!, SI VOTA!), e quelle su di sé hanno le scene di `ui/self-scenes.ts` (Personaggismo velo, King del Verde bagno di sole, Zen calma, Palestra scaglie). Da rifinire a vista con Antonio | fatto |
| P7 | Le stazioni: `ui/train.ts` (l'Italia disegnata da ~40 punti veri, il treno da Formia per Roma, Firenze, Bologna, Milano e Torino, le città che si accendono, «Salta» o un tasto), `data/maps/stations.ts` (atrio di Torino Porta Nuova e di Milano Centrale, binari, panchine, nuvole `Z` oltre l'atrio con l'avviso del prossimo aggiornamento, il capotreno per tornare a Formia), `gateTalk` con «Sali sul treno» e «Torna a Formia» | fatto |
| P8 | Partite, documenti, controlli: la sezione «I sei protagonisti» in `CLAUDE.md`, la partita `Andrea takes the train to Milano`; controlli verdi (372 test unitari, 38 partite, golden delle lotte invariato) | fatto |

**Stato all'ultimo controllo (8 novembre, notte):** controllo dei tipi pulito, 373 test unitari, 38 partite; golden di sprite e disegno della mappa rigenerati (quello delle lotte non cambia). Niente commit. Resta solo P5, che aspetta le risposte di Antonio sui personaggi; poi rifinire a vista scene e case con lui.


## Opus 5.5, max

O2 e O3 sono finite il 5 novembre. Anche S8 l'ha fatta Opus, su richiesta di Antonio, lo stesso giorno.

### O1. Le persone crescono

Fatto: vedi «Le persone crescono» in `CLAUDE.md`.

### O2. Tutti protagonisti

Fatto: vedi «Tutti protagonisti» in `CLAUDE.md`. Le 10 correzioni della revisione sono fatte, e tutte le partite passano dopo l'ultima. In breve: chi si unisce con un'attività e chi sale di livello con un'attività parlano dopo, quando il foglio è chiuso (`tellRewards`), e solo con un punteggio vero; nelle frasi `{hero}` è chi si gioca e «Antonio» resta sempre Antonio; ognuno ha la sua creatura che lo segue (`st.leads`); «Più tardi» su una missione fa andare avanti la persona come sempre.

### O3. Animazioni davvero diverse

Fatto: vedi «La scena di ogni mossa» in `CLAUDE.md`. Ogni mossa ha una scena (`MOVE_FX` in `data/move-fx.ts`, disegnata da `ui/move-stages.ts` con gli aiuti di `ui/spell-kit.ts`); le scene rapide non hanno buio né cerchio; chi subisce reagisce in sei modi (`takes`); quello che attraversa lo schermo va su `battle` (`wide()`). Corrente è finita: sette attacchi, sette scene. Ci sono gli esempi `jet`, `ram`, `dive`, `fall` in altri tipi. `tools/move-sheet.ts` funziona: aspettava la magia, che però va avanti solo quando lo strumento muove l'orologio.

## Sonnet 5.5

### S1. Togliere «Un giorno a Formia» (high)

Antonio: «togli 'un giorno a formia'».

- **Da eliminare:** `src/day/`, `src/data/day.ts`, `src/ui/day-screen.ts`, `src/save/day-progress.ts`, `tools/sim-day.ts`, `tests/unit/day.test.ts`, le partite `a day in Formia`, `a battle of the day left in the middle`, `a battle of the day won, and the page closed on the result`.
- **Da ripulire:** la sezione in `ui/home.ts` e `renderDay` in `renderStory`; in `ui/battle-screen.ts` `dayAfter`, `dayDecided`, `leftNow`, `story.day`, `cfg.seed` e `cfg.night` se non li usa nessun altro; `day` in `StoryTag`; `SideOpts.abil`, usato solo dalla corsa; il ramo `s.story.day` di `resonanceText`; gli stili `.day-*` in `sheets.css`.
- **Da tenere:** `wonNow` (lo usa il pulsante Esci) e tutto il resto delle lotte.
- **Documenti:** la sezione in `CLAUDE.md`, il comando `sim-day`, le voci in `PROSSIMI-PASSI.md` e `BRIEFING-IDEE.md`.
- **Fatto quando:** cercando `Un giorno a Formia`, `dayAfter` e `story.day` in `src/` e `tests/` non esce niente, e i test passano. La chiave `lotte-tra-amici:giorno:v1` nei browser resta orfana: è innocua, non serve codice per toglierla.

### S2. Mosse in quadrato, con un design più bello (high)

Antonio: «in battaglia le mosse le voglio a quadrato, cioè 2 file da 2, invece che 1 fila da 4 e anche con un design più figo, come quello di pokemon».

- **Dove:** `.pad` e `.mv` in `src/styles/battle.css`, `moveButton` e `renderPad` in `ui/battle-screen.ts`. La fila da quattro viene da `#battle.has-scene .pad` in `src/styles/team.css`, riga 177: sulle lotte con la scena, che sono quasi tutte. Togli quella regola.
- **Come:** quattro bottoni grandi 2×2 su ogni larghezza, con il colore del tipo pieno, nome grande, tipo, potenza e usi rimasti: si deve leggere a colpo d'occhio cosa fa. La riga sotto (Borsa, Cambia, Risonanza) deve restare chiara. Niente disegni copiati dai Pokémon: stessa idea, stile del gioco.
- **Fatto quando:** le partite passano, e hai guardato le schermate con `SHOTS=1` a 1280×800 e a 1920×1080. Le lotte libere tra amici devono funzionare anche loro: hanno le stesse quattro mosse.

### S3. Schermata per imparare una mossa (high, dopo S2)

Antonio: «quando una creatura vuole imparare una nuova mossa, mi dice solo i nomi di quelle da disimparare mentre vorrei avere la schermata delle mosse come se fossi in battaglia per scegliere».

- **Dove:** `askLearn` in `ui/team.ts`.
- **Come:** un foglio con la mossa nuova in alto e sotto le quattro che conosce, disegnate con gli stessi bottoni della lotta di S2 (tipo, potenza, precisione, effetto). Un tocco sceglie quale dimenticare, più «Non imparare». Estrai il disegno della mossa in una funzione sola, usata da lotta e foglio: non due copie.
- **Fatto quando:** la partita che sale di livello con quattro mosse passa dalla schermata nuova. Vale anche per le persone: `askLearn` è la stessa, e `anyMove` trova la mossa di chiunque.

### S4. Comprare più cose e usarle dal menu (high)

Antonio: «sarebbe molto meglio scegliere quante cose comprare e poi utilizzarle nel menu quando voglio utilizzarle invece che tipo prendere un caffe alla volta e selezionare ogni volta a chi farlo bere».

- **Dove:** `openShop` e `coffee` in `ui/team.ts`, `drinkCoffee` in `story/growth.ts`, la Borsa in `teamHtml`.
- **Come:** nel negozio un selettore della quantità con il totale, che si ferma ai soldi che hai. Il caffè va nella borsa come tutto il resto, e nel menu ogni cosa utilizzabile fuori dalla lotta ha «Usa», che chiede a chi darla una volta sola, anche per usarne più di una di fila.
- **Salvataggi:** il caffè già pagato in un salvataggio vecchio deve restare utilizzabile (oggi si beve al bancone).
- **Fatto quando:** una partita compra tre caffè in un colpo e li dà dal menu.

### S5. La musica tra un quartiere e l'altro (xhigh)

Antonio: «quando passi da un quartiere all'altro lo switch della musica è pessimo».

- **Cosa succede oggi:** `tune()` in `ui/story-screen.ts` chiede il brano ogni 300 ms e lo cambia al primo passo nel quartiere nuovo; `music()` in `audio/music.ts` chiude il vecchio in 0,12 s (`fadeOut`) e fa partire subito il nuovo dall'inizio. Camminando lungo un confine si cambia avanti e indietro.
- **Come:** una vera dissolvenza incrociata di 2–3 secondi, con il nuovo brano che entra sul battere; e un'attesa prima di cambiare, così chi cammina lungo un confine non sente niente. Vale anche tra giorno e notte. La musica della lotta può restare un taglio netto.
- **Attenzione:** il sequencer programma le note in anticipo sull'orologio audio: due brani insieme vogliono due stati. Niente `Math.random` nell'audio.
- **Fatto quando:** l'attesa è provata da un test unitario, `audio.spec.ts` passa, e Antonio ha ascoltato. Scrivigli cosa ascoltare e dove.

### S6. Negozi veri, ognuno diverso (xhigh)

Antonio: «gli alimentari, bar, negozi sono quasi tutti uguali e hanno sia lo stesso aspetto che le stesse interazioni, e non offrono nulla al gioco, oltre a non avere un nome di un posto effettivo di formia».

- **Dove:** i negozi di contorno sono `['FARMACIA', …]`, `['PESCHERIA', …]`, `['ALIMENTARI', …]` in `data/maps/formia.ts`; quelli veri sono `SHOPS` in `data/growth.ts`; il disegno è in `render/canvas/`.
- **I nomi:** devono essere posti veri di Formia, verificati con più fonti (cerca sul web) e scritti in «Fonti dei fatti di Formia» in `CLAUDE.md`. Se non riesci a verificarne uno, non inventarlo: usa un nome generico e dillo ad Antonio. Niente nomi di persone private, niente numeri civici di case.
- **Cosa offrono:** ogni posto deve dare qualcosa di suo al gioco, non la stessa bottega con un'insegna diversa: per esempio la pescheria con le cose del mare, la farmacia che cura gli stati, l'alimentari con le cose che preparano le creature. Pochi posti ricchi, non tanti uguali. Antonio vuole che ogni posto valga la visita: proponigli la lista prima di disegnare.
- **L'aspetto:** ogni posto importante ha un disegno suo. Dopo aver cambiato il disegno, controlla il golden del canvas (`npm run golden` solo se il cambio è voluto).
- **Fatto quando:** nessun negozio importante è una copia di un altro, per aspetto e per funzione, e i nomi hanno una fonte.

### S7. Il Lido Oriente (high)

Antonio: «il lido oriente è fatto male, se ci vai vicino dice città di Ferrara, è da migliorare».

- **Cosa succede:** «Città di Ferrara» non è un errore: è il lungomare dell'indirizzo, in `building('oriente', …)` di `data/maps/formia.ts` e nella targa `targa-gianola`. Ma letto così sembra di essere a Ferrara, e il lido è solo un cartello.
- **Come:** vai a guardarlo nel gioco, verifica l'indirizzo e cosa c'è davvero al lido (fonti), e rendilo un posto: come l'Eclipse, con il suo disegno, una persona, qualcosa da fare. Il testo deve dire che è un lungomare di Formia. Se cambi la mappa, si rigenera con `tools/formia/build.ts`.
- **Fatto quando:** arrivandoci si capisce dove si è, e c'è un motivo per andarci.

### S8. Animazioni: tutte le altre mosse (xhigh) — fatto

Antonio: «le animazioni di ogni mossa sono comunque ognuna molto simile all'altra, penso a idropompa, surf e cascata in pokemon che avevano ognuno un'animazione molto diversa nonostante fossero mosse dello stesso tipo», e poi: «tutte le mosse di tutte le creature devono essere particolari le animazioni come le hai fatte qui».

**Fatto il 5 novembre, da Opus.** Ogni mossa di ogni creatura ha la sua scena, nei dieci tipi: gli attacchi, le due senza tipo (Beccata, Scintilla), le magie che abbassano un numero o confondono, e le mosse su se stessi. Nello stesso tipo non ce ne sono due uguali, e `tests/unit/move-fx.test.ts` lo controlla. Sono venute venti scene nuove per gli attacchi (`ui/move-scenes.ts`: temporale, ombra, segni, faro, canicola, lucciole, fuoco dal suolo, tromba d'aria, furto, terremoto, stella scritta, canto, orazione, graffi, aurora, torre che cade, agguato, vecchia foto, becco, scintilla, più il Saltello), sedici per le mosse su se stessi (`ui/self-scenes.ts`), e di cosa è fatta una mossa quando non sono le forme del tipo (`ui/move-props.ts`). Come sono fatte è in `CLAUDE.md`, «La scena di ogni mossa».

**Da guardare:** il giudizio finale è di Antonio. Le scene si vedono una per una con `npx tsx tools/move-sheet.ts <mossa>` (con `npm run dev` acceso).

## Haiku 5.5

Solo con i test che verificano il risultato. Niente motore, salvataggi o bilanciamento.

### H1. Il nome nuovo del gioco (high)

Antonio: «cambia il nome di lotte tra amici in qualcosa di più figo».

- **Il nome è deciso:** **Telepilo**, con il sottotitolo **Creature di Formia** (`BRIEFING-IDEE.md` §6). Non sceglierne un altro: se Antonio ne vuole uno diverso, lo dirà.
- **Come:** una costante sola (`GAME_NAME` in `src/data/growth.ts`, come `COIN`), usata da titolo della pagina, home e README.
- **Da non toccare:** le chiavi `lotte-tra-amici:*`, il trailer, il nome del repo su GitHub. La modalità «Lotte libere» nella home resta così.
- **Fatto quando:** `Lotte tra Amici` compare solo nella storia dei documenti, e i test passano.


<!-- da PROSSIMI-PASSI.md -->

## Fatti

- **Le scelte della storia** (5 novembre 2026): Antonio ha chiesto la cosa più divertente, e la cosa più divertente è che decida il giocatore. Tullio amico o nemico, secondo come gli si parla; le pietre rimesse a posto o tenute, con un potere vero e Lamo furioso; ogni leggenda battuta si cattura, si lascia andare o, per Lamo, si conquista con tre tielle. L'epilogo al treno racconta tutto (vedi «Le scelte» in `CLAUDE.md`). Da provare a mano: se le frasi fanno ridere, se Tullio nemico è giusto o troppo duro. Da fare (Sonnet): altre reazioni in città, gli altri due dilemmi più ricchi, le frasi di Mamurra e Tullio.

- **La magia del luogo, lo Slancio, la Risonanza e lo scudo di Mamurra** (5 novembre 2026): il gimmick di Formia (vedi la sezione in `CLAUDE.md`). Ogni posto ha un tipo, i colpi critici e superefficaci riempiono tre pallini, e con tre cuori di legame, una volta a lotta, la creatura prende il tipo del posto. Mamurra ha la Ricchezza, uno scudo che si rompe solo con i colpi superefficaci. Da provare a mano: se la Risonanza si capisce, se viene voglia di usarla, se Mamurra si fa pensare. Da fare (Sonnet): una scena grande per la Risonanza (oggi la fascia e la colonna di luce), la frase degli allenatori che dice di che tipo sono, altri boss con regole loro.

- **Un giorno a Formia** (5 novembre 2026): la corsa dalla home e la sfida del giorno. Tolta lo stesso giorno: Antonio non la voleva. La chiave `lotte-tra-amici:giorno:v1` resta orfana nei browser, ed è innocua.
- **Una mossa di Olivella rompeva le lotte** (trovato il 5 novembre 2026 dal simulatore della corsa): Radici millenarie aveva lo stesso id di una mossa dell'Esame e finiva nel suo ramo, un colpo senza potenza: i PS di chi la subiva diventavano NaN e la lotta non finiva più. C'era dal primo commit delle creature. Ora le mosse delle creature passano sempre dai loro numeri, e un test prova ogni mossa.

- **Le leggende come eventi** (5 novembre 2026): `data/legends.ts` e un solo esecutore. La lotta ha tre parti (mosse nuove, tipi che cambiano per Giano, il retino che regge solo alla fine, un colpo non può saltare una parte), e c'è il colpo che si vede arrivare, che dà un motivo vero per cambiare creatura. Per Lamo: le tre nicchie sotto le mura e La Porta di Telepilo, con i massi a onde e il validatore. Da provare a mano: se la camminata è troppo lunga o troppo corta, e le lotte (Lamo 61%, Giano 53%, Fuocelmo 46% a parità di squadra simulata, che non cambia mai). Manca il dilemma dopo la lotta, che è una decisione di trama. Da fare (Sonnet): una musica per le leggende (oggi `battle`, poi `boss` dalla seconda parte), Antifate ed Elmo come voci di `LEGENDS`, un versetto per ogni parte.

- **Il motore dei luoghi, il buio e il Cisternone** (5 novembre 2026): lastre, cancelli, correnti, pericoli a passi, ripartenze, tutto con le stesse regole per il gioco e per il validatore, che dimostra che ogni luogo si finisce da qualunque punto. Il Cisternone è il primo: buio, tre sale, e la Pietra delle Mura in fondo invece che in regalo dalla signora del teatro. Il cartello `enter` è generico per i prossimi dungeon. Da fare (Sonnet): la musica del Cisternone, gli altri dungeon, i covi-labirinto.

- **Stati, abilità e oggetti** (5 novembre 2026): tre stati (Colpo di sole, Siesta, Rete), un'abilità per ogni linea e una in più per le ultime forme, cinque oggetti da far portare alle creature, tutto come dati in `data/passives.ts` (aggiungerne uno non tocca il motore). Il vantaggio di tipo scende dal 94 al 77%, finalmente nell'obiettivo. L'IA ora misura quanto vale una mossa, e i potenziamenti durano abbastanza da ripagare il turno. Da provare a mano: se le lotte contro gli allenatori sono divertenti, e i prezzi degli oggetti. Resta da fare (Sonnet): altre abilità e altri oggetti, i premi dei covi e del diario.

- **Il cambio di creatura** (5 novembre 2026): le lotte con selvatiche e allenatori sono una lotta sola, con le due squadre dentro lo stato (`s.bench`). Pulsante «Cambia» (costa il turno, chi entra è in guardia, chi aspetta riprende fiato), «Cambi?» prima che entri la creatura dopo, gli allenatori più bravi scelgono chi mandare e a volte cambiano (`smart`), l'esperienza si paga una volta a fine lotta. Misurato con `npm run sim:fun team`: giocare la panchina vale 55% contro 49%. Il primo tentativo, senza guardia né panchina, valeva di meno che non giocarla (37%): il cambio costava più di quanto i tipi restituiscano.

- **Venticinque creature nuove, cinque tipi nuovi, tre leggende enormi** (5 novembre 2026): meduse, stelle marine, murene, delfini, cefali (con il Cefaldrago alla Magikarp), lucciole, pipistrelli, cinghiali, falchi, ginestre, lumache, gatti, ognuno con il suo disegno, le mosse, il verso e l'evoluzione; la rarità nascosta nei pesi, nei posti e nelle ore. I tipi delle sole creature (Corrente, Calore, Cielo, Corazza, Crepuscolo), con la tabella dei dieci tipi (`MAGIC_CHART`), i colori, le rune, i versi e una magia per tipo (l'onda, la palla di fuoco, il tornado, i sassi, il sole nero); le creature di prima con i tipi nuovi dove hanno senso (Riccetto e Lunaspina Corrente, Solleone Calore, le forme di mezzo delle iniziali con un secondo tipo…) e le mosse ritipate. Lamo diventa un titano col masso sopra la testa, Giano (al tramonto a Gianola) un titano del tempo con due teste e la ruota delle ore, Fuocelmo (di notte al molo) un drago di fuoco azzurro con le ali a vela; tutti e tre più grandi in lotta, con la raggiera, l'entrata che fa tremare l'arena e una scena tutta loro per la mossa speciale.

- **Il primo giro di cose da Sonnet del briefing** (4 novembre 2026): `tools/sim-fun.ts` (`npm run sim:fun`, le due misure con gli obiettivi); le **selvatiche che seguono la squadra** nei posti di sfida e la trama che alza gli altri (`wildLevel`); **un verso per ogni specie**, in tre versioni (entrata, vittoria, KO), e il gigante di Lamo non è più muto (`audio/cries.ts`); la **musica per luogo** con la sua notte (Castellone, Mola e il porto, Vindicio e la pineta; `audio/zones.ts`); **cinque gesti** per le mosse, 25 mosse con il loro (`data/move-fx.ts`). Restano di questo giro: il tasto «Veloce» per le animazioni, gli altri temi (Gianola, Monti Aurunci, interni, lotte per tipo, stinger, un motivo per ogni amico), le scene firma delle mosse speciali, e tutto quello che aspetta il motore di Opus (Cisternone, covi-labirinto, contenuto di abilità e oggetti, leggende, rami delle scelte).
- **Il trailer rifatto dal gioco di adesso** (4 novembre 2026): tutte le clip registrate di nuovo (il terreno senza griglia, le creature ridisegnate, le magie nuove, l'albero delle abilità), e i tagli delle lotte rimessi a tempo: la magia parte con la sua fascia e colpisce sul battito, il retino vola, trema e regge con le stelle. Al posto dell'Esame c'è il rivale: Tullio presentato dopo i sei amici con il suo «!», lo studente che vede Antonio e gli viene incontro, la lotta con Tullio che si apre con le fasce rosse.

- **Il rivale, gli allenatori che ti vedono, le due squadre, l'albero delle abilità** (4 novembre 2026): Tullio, il nipote del guardaparco, sceglie dopo Antonio l'iniziale che batte la sua e lo sfida tre volte (al parco, sull'Appia, dopo Mamurra); gli allenatori non battuti vedono Antonio davanti a sé, il «!», gli vengono incontro e lo sfidano; nel menu le persone e le creature sono due squadre da sei posti; le abilità sono un albero a tre rami dove ognuna si apre con un punto in quella prima.

- **Le magie delle creature, grandi e diverse per tipo** (4 novembre 2026): il buio intorno, il cerchio magico, il nome della mossa su una fascia; la falce di luna, i fulmini dalla nuvola, la rete di stelle, le onde di canto, il cuore gigante, ognuna col suo suono, e una versione grande per le mosse forti; numeri dei danni grandi con «Superefficace!» e simili, la barra dei PS che scende con la fascia chiara; le mosse delle creature colorate col loro tipo e la runa; l'entrata in lotta con le fasce, come nei Pokémon (`ui/spells.ts`).
- **I retini** (4 novembre 2026): sei retini di pregio diverso (dal Retino al Retino d'oro, più Nassa e Rete della lampara), il retaio accanto al guardaparco che li vende tutti, cinque retini in regalo con la prima creatura e la spiegazione di come si cattura, la Borsa come riga in lotta con la probabilità, il retino che trema prima di reggere (`data/nets.ts`).
- **I premi del diario delle creature** (4 novembre 2026): il guardaparco dà retini sempre migliori (e sesterzi) a 3, 6, 10, 15 creature avute e a tutte.
- **I sesterzi al posto degli euro** (4 novembre 2026): la moneta della Formia romana, con la moneta d'oro nell'HUD; il nome sta in `COIN` (`data/growth.ts`).

- **Cicerone compare solo quando serve** (nuovo capitolo, prima volta di qualcosa, quando Antonio sembra perso da quattro minuti, tasto C), poi svanisce: sulla mappa e nell'angolo.
- **Il caffè si beve al bancone** del bar di Mola, scegliendo subito chi lo beve; niente più caffè nel menu.
- **Umani contro umani, creature contro creature**: con selvatiche e allenatori lottano le creature, una dopo l'altra; Antonio scende in campo solo quando sono tutte KO. Nei covi lottano Antonio e gli amici.
- **Incontri nascosti, come nei Pokémon**: erba alta e pozze tra gli scogli, con creature diverse per zona e per ora del giorno. Idea per dopo: altre specie selvatiche (meduse e ricci in acqua bassa, una lucertola dei muretti a secco, un pipistrello della Grotta della Janara) e un oggetto o un'abilità che tiene lontane le creature.
- **Sfondi delle lotte disegnati, a schermo intero**: dodici scene di Formia in SVG (Vindicio, pineta, porto, Mola, Castellone, monti, golfo, Gianola, Caposele, piazza della Vittoria, circolo, Morgana), di giorno e di notte; le foto sono state tolte.
- **Antonio sulla mappa più simile a lui**, ma stilizzato (come chiesto dopo una prima prova con la testa del ritratto, che risultava tagliata): ricci grandi, felpa blu, catenina e orecchino d'oro, sopracciglia, sorriso storto.
- **Abilità che cambiano il gioco**: tre strade (Esploratore, Allenatore, Formiano doc) con dieci abilità: meno incontri, creature rare e dorate, passo più svelto, esperienza alle creature, retini più sicuri, creature che resistono a 1 PS, Antonio più forte quando lotta da solo, prezzi e attività.
- **Crescita delle creature**: la schermata del livello dice cosa cresce, si sceglie la mossa da dimenticare, l'ultima forma delle iniziali (al 26) vuole il legame; ogni creatura ha un legame con Antonio (cuori, cresce lottando, passeggiando, parlandole) e un carattere.
- **Una trama legata alle radici di Formia**: le Pietre di Telepilo. Il fantasma di Mamurra e i suoi uomini cercano le tre pietre del sigillo della città dei Lestrigoni; Antonio le trova con Cicerone (scavi di Gianola, Archivio della Torre di Mola, Cisternone e l'indovinello della signora del teatro, peschiere di Caposele, tre domande alla Tomba di Cicerone) e affronta Mamurra alla sua villa; poi esce Lamo. Il sogno Torino → Chicago è il finale.
- **La creatura che ti segue trova cose per terra**: euro, tielle, retini, più spesso se il legame è forte.
- **Niente spoiler** (4 novembre 2026): Cicerone all'inizio non anticipa più Torino e Chicago né il nome di Mamurra; nel menu le tappe future sono «???».
- **Barre dell'esperienza sempre sulla mappa** (il Primo della compagnia, che si sceglie, e la creatura che segue), **menu in quattro schede**, **squadra di sei creature con le altre a casa** (si vedono nell'appartamento e lì si cambiano), **effetti delle mosse più belli** (scie, onde, stelle, forme di ogni tipo).
- **I poteri delle creature**: con quelle del mare si nuota (fino alle vasche romane di Gianola, con un'anfora sul fondo), con lucertole e cicale si sale sulle mura di Castellone, con gabbiani e civette si vede Formia dall'alto (tasto V); in acqua e sulle mura vivono altre creature, tra cui le iniziali non scelte.
- **Pesca dal molo e Torneo degli amici**: il pescatore di Mola porta a pescare (tre lanci a tempo, il punteggio in grammi); al Bruno Zauli il velocista organizza un torneo di cinque amici di fila, con le rivincite di Costanzo e Forchetta, che a ogni edizione vinta diventa più duro.
- **Il trailer** (4 novembre 2026): un minuto e quaranta in 1080p, fatto tutto da codice (`npm run promo`, `tools/promo/`): Formia in 3D di notte, al tramonto e di giorno (three.js, con i Monti Aurunci, la luna, il faro e le lucine della magia), scene giocate dal gioco vero (Formia di giorno e di notte, casa, motorino, erba alta, lotte, cattura, nuoto, volo, Cicerone, abilità, attività, covi; dal 4 novembre sera, al posto dell'Esame, il rivale e gli allenatori che ti vedono), due colpi visti dagli occhi della creatura, i sei amici e le 20 creature in ombra, e una musica originale epica e misteriosa (coro, ottoni, archi, taiko). Senza spoiler, e senza dire come è fatto: «Creato dall'immaginazione».
