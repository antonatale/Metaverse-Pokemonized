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
| O2 | Tutti protagonisti: ogni amico con la sua squadra e le sue missioni | Opus 5.5 | max | funziona, restano 10 correzioni |
| O3 | Animazioni davvero diverse: il sistema e le prime scene | Opus 5.5 | max | progettata, codice non iniziato |
| S1 | Togliere «Un giorno a Formia» | Sonnet 5.5 | high | da fare |
| S2 | Mosse in quadrato, con un design più bello | Sonnet 5.5 | high | da fare |
| S3 | Schermata per imparare una mossa | Sonnet 5.5 | high | da fare |
| S4 | Comprare più cose e usarle dal menu | Sonnet 5.5 | high | da fare |
| S5 | La musica tra un quartiere e l'altro | Sonnet 5.5 | xhigh | da fare |
| S6 | Negozi veri, ognuno diverso | Sonnet 5.5 | xhigh | da fare |
| S7 | Il Lido Oriente | Sonnet 5.5 | high | da fare |
| S8 | Animazioni: tutte le altre mosse | Sonnet 5.5 | xhigh | dopo O3 |
| H1 | Il nome nuovo del gioco | Haiku 5.5 | high | da fare |

**Perché così.** Opus dove un errore è silenzioso o tocca il motore, i salvataggi e il bilanciamento. Sonnet dove il compito è definito e il giudizio finale è di Antonio, a vista o a orecchio. Haiku solo per lavoro meccanico verificato dai test.

## Opus 5.5, max

Opus si è fermato il 5 novembre per il limite settimanale: nessuno ci sta lavorando. O2 e O3 vanno finite, in quest'ordine, prima di S8.

### O1. Le persone crescono

Fatto: vedi «Le persone crescono» in `CLAUDE.md`.

### O2. Tutti protagonisti: le correzioni che restano

Il codice è in `main` e documentato in «Tutti protagonisti» in `CLAUDE.md`. `/code-review high` ha trovato questi 10 punti, non ancora corretti. Le decisioni sono già prese. Alla fine lancia tutte le partite: l'ultima prova completa (39 passate) è di prima delle ultime correzioni; dopo sono state rilanciate solo 4 partite.

1. **Il dialogo di chi si unisce non si legge** (`friendJoins`, da `onReward`): `record()` gira con il foglio dell'attività aperto e subito dopo un altro `say()` lo sovrascrive. Vale per Andrea, Valentin e Zendavid. Metti chi si unisce in una coda e fallo parlare dal frame, con la stessa guardia di `chapterTip`.
2. **Una persona che sale di livello con un'attività perde la mossa** (`onReward` ignora `g.pending` e `g.grew`, e `learn()` gira solo quando si passa il livello): stessa coda, con `growthSay(g, [], poi)`.
3. **`setFirst`:** chiama `firstCreature` prima di scrivere `st.first`, altrimenti `teamRef()` guarda la squadra vuota del nuovo eroe e la creatura non tiene il passo.
4. **`heroText` cambia anche quello che non deve:** oggi «Marco Antonio» diventa «Marco Costanzo» (`formia.ts:169`), il motorino di Antonio diventa di un altro, e `growthSay` attribuisce i livelli di Antonio a chi si sta giocando. Passa al contrario: un segnaposto `{hero}` solo nelle frasi rivolte a chi si gioca, e togli `{Antonio}`. Righe da convertire: `formia.ts` 162, 164, 167; `trainers.ts` 115, 122, 123, 128, 136; `choices.ts` 18, 20, 25, 29; `tourney.ts` 16; `story-screen.ts` 590, 596, 652, 764, 767; `plot.ts` 96; `activities.ts` 245; `team.ts` 156; `mentor.ts` 52, 58, 73, 107, 109. Attenzione a «ad Antonio» (`mentor.ts:58`): riscrivi la frase. Aggiorna anche `CLAUDE.md`.
5. **`battle/damage.ts:132`:** «non vuole deludere Antonio» deve usare `s.hero || 'Antonio'`, come `moves.ts:233`.
6. **Un amico si unisce anche se l'attività va male** (`record`): chiedi un punteggio vero, maggiore di zero. `run.ts:59` registra senza tempo, e al padel si può chiudere con 0 scambi.
7. **Per chi è giusto la missione blocca il resto** (`missionTalk`): «Più tardi» deve andare avanti come sempre, con il negozio o l'attività. Fai `talkTo(p, past)` che salta `plotTalk`.
8. **`missionDoneNow`** dice soldi e creatura ma non gli oggetti: usa lo stile di `prizeText`.
9. **`st.lead` è uno solo per tutti:** chi segue va salvato per persona (`st.leads?`, facoltativo; `st.lead` resta di Antonio).
10. **Pulizia:** `plotAfter(f.id, f.who)` e via `npcName`; una funzione sola per la lotta di `missionFight` e `trainerTalk`; `mine()` in `rival.ts` ripete `monsOf('antonio')`, se non crea un ciclo di import.

### O3. Animazioni davvero diverse

Antonio: «le animazioni di ogni mossa sono comunque ognuna molto simile all'altra, penso a idropompa, surf e cascata in pokemon che avevano ognuno un'animazione molto diversa nonostante fossero mosse dello stesso tipo».

**Perché oggi si somigliano** (`castSpell` in `ui/spells.ts`): tutte aprono allo stesso modo (buio, cerchio, fascia); finiscono con lo stesso `HIT[t]` del tipo; chi le subisce reagisce sempre uguale; le mosse hanno solo 5 gesti (47 su 66 attacchi con tipo) e le altre volano come il loro tipo.

**Il progetto:**
- **Dati:** `MOVE_FX` diventa `Record<string, Scene>` con `{ stage, charge?: 'none' | 'full', foe?, n? }`. I 5 gesti diventano `stage`, così la tabella resta una.
- **Codice:** gli aiuti generici (`tr`, `lerp`, `mid`, `body`, `size`, `beyond`, `curve`, `along`, `piece`, `layer`, `beam`, `trace`, `fade`, `glyph`, `flash`, `veilOn`) vanno in `ui/spell-kit.ts`, le scene in `ui/move-stages.ts`. Una scena è generica: prende colore e pezzi dal tipo (acqua, fiamme, piume), e si risolve sull'impatto, perché numero e barra atterrino lì; può continuare dopo.
- **L'apertura cambia:** `charge: 'none'` toglie buio e cerchio e lascia il nome, per i colpi rapidi. Una scena può disegnare il suo impatto invece di `HIT[t]`.
- **Chi subisce:** `takes(to, come)` con `recoil`, `lift`, `squash`, `spin`, `shake`, `sink`, animando `m-<i>`.
- **Spazio:** `.arena` ha `overflow: hidden` (`battle.css:11`). Quello che riempie lo schermo nelle lotte con la scena va messo su `battle`, come fanno `darken` e `flash`.

**Prime scene.** Corrente: `mareggiata` `tide` (come Surf: un muro d'acqua attraversa tutta l'arena con chi lancia sulla cresta), `morsomurena` `jaws` (due morsi, senza carica), `morsa` `clamp` (due chele dai lati stringono), `tentacolata` `grasp` (tentacoli dal suolo intorno al bersaglio), `fischio` `pod` (anelli di suono e tre delfini che saltano), `aculei` `volley` (un ventaglio che si conficca e scoppia), `urtica` `sting` (si avvicina, i filamenti toccano, il bersaglio trema). Esempi di altri tipi: `spruzzo` `jet` (come Idropompa, un getto che spinge indietro), `carica` `ram` (corre lei stessa), `picchiata` `dive` (sale fuori schermo, cade dall'alto), più una `fall` (come Cascata: una colonna che cade sul bersaglio).

**Test:** nessuna coppia di attacchi dello stesso tipo ha la stessa `stage`, per un elenco di tipi finiti (all'inizio solo Corrente) che S8 allarga. Il resto si controlla a vista. Finita O3, scrivi qui sotto in S8 il modello da seguire e la scena di ogni altra mossa.

**Lo strumento:** `tools/move-sheet.ts` fa un foglio di provini di una mossa in `test-results/moves/`. **Non funziona ancora:** la lotta parte ma resta nell'introduzione (`#pad` resta `.off`, con 12 animazioni vive) sotto i passi di `Clip.run`; da capire. Usa il server su 5173.

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

### S8. Animazioni: tutte le altre mosse (xhigh, dopo O3)

Le istruzioni arrivano quando O3 è finita: qui ci sarà il modello da seguire.

## Haiku 5.5

Solo con i test che verificano il risultato. Niente motore, salvataggi o bilanciamento.

### H1. Il nome nuovo del gioco (high)

Antonio: «cambia il nome di lotte tra amici in qualcosa di più figo».

- **Il nome è deciso:** **Telepilo**, con il sottotitolo **Creature di Formia** (`BRIEFING-IDEE.md` §6). Non sceglierne un altro: se Antonio ne vuole uno diverso, lo dirà.
- **Come:** una costante sola (`GAME_NAME` in `src/data/growth.ts`, come `COIN`), usata da titolo della pagina, home e README.
- **Da non toccare:** le chiavi `lotte-tra-amici:*`, il trailer, il nome del repo su GitHub. La modalità «Lotte libere» nella home resta così.
- **Fatto quando:** `Lotte tra Amici` compare solo nella storia dei documenti, e i test passano.
