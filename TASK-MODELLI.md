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
| S1 | Togliere «Un giorno a Formia» | Sonnet 5.5 | high | da fare |
| S2 | Mosse in quadrato, con un design più bello | Sonnet 5.5 | high | da fare |
| S3 | Schermata per imparare una mossa | Sonnet 5.5 | high | da fare |
| S4 | Comprare più cose e usarle dal menu | Sonnet 5.5 | high | da fare |
| S5 | La musica tra un quartiere e l'altro | Sonnet 5.5 | xhigh | da fare |
| S6 | Negozi veri, ognuno diverso | Sonnet 5.5 | xhigh | da fare |
| S7 | Il Lido Oriente | Sonnet 5.5 | high | da fare |
| S8 | Animazioni: tutte le altre mosse | Sonnet 5.5 | xhigh | da fare |
| H1 | Il nome nuovo del gioco | Haiku 5.5 | high | da fare |

**Perché così.** Opus dove un errore è silenzioso o tocca il motore, i salvataggi e il bilanciamento. Sonnet dove il compito è definito e il giudizio finale è di Antonio, a vista o a orecchio. Haiku solo per lavoro meccanico verificato dai test.

## Opus 5.5, max

O2 e O3 sono finite il 5 novembre: Opus non ha altre task. S8 può partire.

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

### S8. Animazioni: tutte le altre mosse (xhigh)

Antonio: «le animazioni di ogni mossa sono comunque ognuna molto simile all'altra, penso a idropompa, surf e cascata in pokemon che avevano ognuno un'animazione molto diversa nonostante fossero mosse dello stesso tipo».

**Il modello è Corrente.** Leggi «La scena di ogni mossa» in `CLAUDE.md`, poi guarda i fogli di `mareggiata morsomurena morsa tentacolata fischio aculei urtica` (`npx tsx tools/move-sheet.ts …`, con `npm run dev` acceso): sono sette attacchi dello stesso tipo e non se ne confondono due. Ogni tipo va fatto così.

**Come si lavora, un tipo alla volta:**
1. Dai a ogni attacco del tipo la sua scena in `MOVE_FX`, secondo la tabella qui sotto. Una scena nuova è una funzione in `ui/move-stages.ts` e una voce in `STAGES` (con `foe`, ed eventualmente `quick`, `n`, `impact`), più il nome in `Stage` in `data/move-fx.ts`.
2. Una scena prende colore e pezzi dal tipo (`x.mc`, `bit`), si risolve sull'impatto (il numero e la barra atterrano lì) e può continuare dopo. Se disegna il suo impatto, chiama `tint(x)` e dichiara `impact: true`. Copia la struttura di quelle che ci sono.
3. Un pezzo che parte più tardi va creato quando parte, dentro la `sleep`: creato prima, resta un attimo fermo in alto a sinistra (è successo con l'onda, i delfini e i tentacoli).
4. Guarda il foglio di ogni mossa, anche con `--foe` e `--miss`. Il giudizio finale è di Antonio: digli quali guardare.
5. Aggiungi il tipo a `DONE` in `tests/unit/move-fx.test.ts`: da lì il test controlla che ogni attacco abbia una scena e che nessuna sia uguale a un'altra dello stesso tipo.

**Le regole delle animazioni** valgono anche qui: niente `Math.random` (`wob()` di `effects.ts` se serve il caso), niente animazione con il movimento ridotto (`castSpell` già lo fa), lo schermo intero lampeggia al massimo un paio di volte al secondo, le scie (`filter`) solo sui pezzi grandi.

**La scena di ogni altra mossa.** Tra parentesi la scena di oggi; *nuova* vuol dire una scena da scrivere. Le mosse delle leggende con uno spettacolo loro (`EPIC`: portatempo, tempestelmo, masso) lo tengono come mossa speciale: la voce serve quando non lo sono.

| Tipo | Mossa → scena |
|---|---|
| Calma (10) | coda `slash` · morso `jaws` · marmo `lob` · spinata `rain` · risacca `tide` (l'onda che torna indietro) · fascio `beam` (il faro) · tempesta `fall` (una colonna di luna) · lunargento `orbit` (lune d'argento intorno) · ombra *nuova* `shade` (l'ombra di chi lancia si allunga per terra fino al bersaglio e si alza alle sue spalle) · profezia *nuova* `omen` (rune e occhi si aprono in cerchio intorno al bersaglio e colpiscono insieme) |
| Calore (5) | canicola *nuova* `haze` (l'aria trema, onde di calore attraversano il bersaglio) · fuocoelmo `rain` · lucciole `orbit` (lucciole che girano e si chiudono) · primaluce `beam` · tempestelmo `fall` |
| Caos (11) | carica `ram` · chela `slash` · pinza `clamp` · presa `grasp` (lo scoglio afferra) · burrasca `orbit` · ira `tide` · pellegrina `dive` · alberomaestro `fall` (l'albero della nave cade) · banco `volley` (pesci lanciati) · furto *nuova* `snatch` (scatta, arraffa, torna indietro di corsa) · furia *nuova* `quake` (la terra si solleva a onda da chi lancia fino al bersaglio) |
| Cervello (6) | spruzzo `jet` · abbraccio `grasp` (le braccia degli abissi) · malocchio `beam` · notturno `dive` · pennino `slash` · stellata `lob` |
| Chiacchiera (3) | catilinaria `beam` · concerto `rain` · graffio `slash` |
| Cielo (7) | picchiata `dive` · planata `ram` · aurora `orbit` · libeccio `tide` (un muro di vento) · raffica `volley` (piume a ventaglio) · polline `lob` · vele `beam` |
| Corazza (6) | frana `fall` · masso `lob` · naufragio `rain` · passogigante `quake` · torre `ram` · zanne `jaws` |
| Crepuscolo (5) | agguato `ram` · ala `slash` · duevolti `orbit` · lucina `beam` · portatempo `fall` |
| Cuore (6) | cuorepietra `fall` · desiderio `orbit` · mappaceleste `rain` · maregiallo `tide` (un mare giallo di ginestre) · nocciolo `lob` · nostalgia `beam` |

Le scene nuove sono cinque: `shade`, `omen`, `haze`, `snatch` e `quake`, che serve a Caos e a Corazza. Se a vista una scelta della tabella non funziona, cambiala, purché nel tipo restino tutte diverse, e dillo ad Antonio.

**Fatto quando:** `DONE` ha tutti e dieci i tipi e i test passano, e Antonio ha guardato i fogli.

## Haiku 5.5

Solo con i test che verificano il risultato. Niente motore, salvataggi o bilanciamento.

### H1. Il nome nuovo del gioco (high)

Antonio: «cambia il nome di lotte tra amici in qualcosa di più figo».

- **Il nome è deciso:** **Telepilo**, con il sottotitolo **Creature di Formia** (`BRIEFING-IDEE.md` §6). Non sceglierne un altro: se Antonio ne vuole uno diverso, lo dirà.
- **Come:** una costante sola (`GAME_NAME` in `src/data/growth.ts`, come `COIN`), usata da titolo della pagina, home e README.
- **Da non toccare:** le chiavi `lotte-tra-amici:*`, il trailer, il nome del repo su GitHub. La modalità «Lotte libere» nella home resta così.
- **Fatto quando:** `Lotte tra Amici` compare solo nella storia dei documenti, e i test passano.
