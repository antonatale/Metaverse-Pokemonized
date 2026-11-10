# Task per modello

Le richieste di Antonio del 5 novembre 2026, dopo aver provato il gioco a mano. Se sei un modello e ti ha detto di cercare le tue task, sono qui: trova la tua sezione e parti dalla prima non fatta, in ordine.

**Prima di iniziare:** leggi `CLAUDE.md`: architettura, convenzioni e regole sono lì. Le regole che contano di più:

- I 2040 golden delle lotte libere non cambiano. Il motore resta puro: niente `Math.random`, `Date` né DOM. La UI non conosce le regole.
- Salvataggi compatibili: campi facoltativi, le chiavi `lotte-tra-amici:*` non si rinominano.
- Testi in italiano, commenti in inglese, commit in italiano, un commit per idea. Solo PC: niente versione per telefono.
- Il trailer (`tools/promo/`) non si tocca finché Antonio non lo chiede.
- I fatti su Formia si verificano prima di scriverli: niente di inventato.
- Commit e push solo quando Antonio lo chiede.

**Prima di dire che hai finito:** `npx tsc --noEmit`, `npx vitest run`, `npx playwright test`. Se fallisce solo la prova `sound is on by default` di `audio.spec.ts` con «Expected: > 5, Received: 5», di solito è il Mac: vedi «Test» in `CLAUDE.md`. Quando finisci una task, segna «fatto» nella tabella.

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

## I sei protagonisti (richiesta di Antonio dell'8 novembre 2026)

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

| # | Cosa | Stato |
|---|---|---|
| P1 | Aspetto: capelli di Andrea attaccati alla testa, Costanzo senza occhiali, occhi chiari a Forchetta (`render/svg/looks.ts`, `hair.ts`) | fatto (il golden degli sprite va rigenerato con `npm run golden`) |
| P2 | Sei covi (`data/covi.ts`: in più Valentin all'Eclipse, Zendavid in pineta, Andrea al padel del Bruno Zauli, Antonio al Palamendola); il livello sale di `COVO_STEP` per ogni spilla già presa (`covoLevel`); `cityCovi` toglie il covo di chi si gioca; niente `joinFriend`; il giro di Formia (`myStops`) salta il proprio covo e la propria attività; il treno della propria città (`data/gates.ts`) | fatto: `tests/unit/covi.test.ts`, partite aggiornate (`goStory` in `tests/e2e/harness.ts` risponde a «chi sei?») |
| P3 | Scelta del protagonista quando si comincia una storia («chi sei?» in `ui/home.ts`), `startAs`/`blank(first)` in `save/story-progress.ts` che parte da casa sua (`MapDef.starts`), `st.squad = [first]`; il guardaparco dà la prima creatura a chiunque; Cicerone saluta `{hero}`; gli oggetti persi sono solo di Antonio (`only` in `story/goals.ts`); i punti abilità seguono il livello di chi si gioca | fatto |
| P4 | Le case vere: fatte quelle di Valentin (via Ferrucci), Costanzo (via Solaro), Forchetta (via Abate Tosti), Andrea (Castellone) e Zendavid (Scauri), con la partenza davanti a casa (`MapDef.starts`, test in `tests/unit/covi.test.ts`). **Scauri fatta:** la mappa ora è larga 200 (`X_ANCHORS` fino a 13.725), la costa a est di Gianola è cucita in `osm-extract.json` (tre vie OSM 672636933, 672636932, 437456512), ferrovia e Appia arrivano alla stazione di Minturno-Scauri (`stazione-scauri`), zona «Scauri». Gli interni: `data/maps/homes.ts`, la pianta di `casa.ts` con il letto per dormire, la finestra su quello che si vede davvero da casa e le cose di ognuno; le creature a casa aspettano lì | fatto |
| P5 | La storia di ognuno. Fatto senza bisogno di risposte: l'intro di Cicerone dice dove abiti, i cinque covi e la tua città; il giro di Formia mette i covi in ordine di distanza da casa tua (`myStops`); il rivale Tullio sceglie la creatura che batte quella del protagonista (`st.squad[0]` in `story/rival.ts`); in una storia di un protagonista ci sono solo le sue missioni (`myMissions`). Da fare con le informazioni di Antonio: frasi, consigli, posti e mosse pensati per ognuno | in corso |
| P6 | Animazioni delle mosse delle persone (`ui/person-scenes.ts`): ogni segnale delle persone ha la sua scena (comizio, Daje, volpe, robot, palla, coriandoli, Forza Formia, abbaio, battuta, Stronger, diagnosi), le mosse imparate crescendo sono riconosciute dalla scritta del banner (CHICAGO!, MATCH POINT!, SI VOTA!), e quelle su di sé hanno le scene di `ui/self-scenes.ts` (Personaggismo velo, King del Verde bagno di sole, Zen calma, Palestra scaglie). Da rifinire a vista con Antonio | fatto |
| P7 | Le stazioni: `ui/train.ts` (l'Italia disegnata da ~40 punti veri, il treno da Formia per Roma, Firenze, Bologna, Milano e Torino, le città che si accendono, «Salta» o un tasto), `data/maps/stations.ts` (atrio di Torino Porta Nuova e di Milano Centrale, binari, panchine, nuvole `Z` oltre l'atrio con l'avviso del prossimo aggiornamento, il capotreno per tornare a Formia), `gateTalk` con «Sali sul treno» e «Torna a Formia» | fatto |
| P8 | Partite, documenti, controlli: la sezione «I sei protagonisti» in `CLAUDE.md`, la partita `Andrea takes the train to Milano`; controlli verdi (372 test unitari, 38 partite, golden delle lotte invariato) | fatto |

**Stato all'ultimo controllo (8 novembre, notte):** controllo dei tipi pulito, 373 test unitari, 38 partite; golden di sprite e disegno della mappa rigenerati (quello delle lotte non cambia). Niente commit. Resta solo P5, che aspetta le risposte di Antonio sui personaggi; poi rifinire a vista scene e case con lui.

**Domande fatte ad Antonio** (le risposte vanno in P5 e P6, e nell'aspetto in `render/svg/looks.ts`): per ognuno, cosa fa e perché va a Torino o a Milano; due o tre posti di Formia dove va davvero e con chi; frasi tipiche e fissazioni; com'è fatto (capelli, occhi, barba, vestiti, accessori) e come lo vede nelle due forme; due o tre cose da trasformare in mosse; se i covi stanno bene dove sono (Valentin all'Eclipse, Zendavid in pineta, Andrea al padel del Bruno Zauli, Antonio al Palamendola).

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
