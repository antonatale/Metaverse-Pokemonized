# Lotte tra Amici

Gioco di lotte a turni in stile Pokémon con sei amici e un boss (l'Esame di Controlli), più una modalità storia su una mappa di Formia vista dall'alto. Vite + TypeScript strict, niente framework: DOM e SVG per home e lotta, canvas 2D per la mappa. La build è un unico file HTML autonomo.

Il gioco nasce come pagina singola (un Artifact di claude.ai) ed è stato migrato a moduli **senza cambiare nulla**: stesse meccaniche, numeri, testi, animazioni e salvataggi. Il prossimo passo previsto è spostare gradualmente il rendering su Phaser (vedi in fondo).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm install` | dipendenze (Node 22 o più recente) |
| `npm run dev` | server di sviluppo su http://localhost:5173 |
| `npm run build` | typecheck + `dist/index.html`: un solo file con script, stili e font incorporati |
| `npm run build:google-fonts` | come sopra, ma con i font da Google Fonts (`dist-google-fonts/index.html`), per la cornice degli Artifact se i font `data:` non si caricano |
| `npm run preview` | serve `dist/` |
| `npm run typecheck` | solo `tsc --noEmit` |
| `npm test` | Vitest: golden di motore, ritratti e mappa, dati, controllo delle mappe |
| `npm run test:e2e` | Playwright: partite intere giocate fino in fondo, senza errori, e l'audio |
| `npm run test:e2e:dist` | le stesse partite sul file singolo di `dist/` aperto da disco |
| `npm run test:all` | Vitest + Playwright |
| `npm run sim` | simulatore di bilanciamento (vedi sotto) |
| `npm run golden` | rigenera i golden dal codice attuale, dopo un cambio voluto |

## Dove si trova ogni parte

```
index.html                 guscio della pagina: le quattro sezioni (home, battle, world, overlay)
src/
  main.ts                  avvio: listener della tastiera (prima la mappa, poi la lotta), window.WORLD/UI per i
                           playtest, gancio window.claude.hot per l'aggiornamento a caldo dell'Artifact
  data/                    solo dati, niente logica
    characters.ts          i sei amici e l'Esame: statistiche, mosse, passive, difetti, frasi; ROSTER, PAIRS, JOKES
    types.ts               i cinque tipi in ciclo (TYPES, TYPE_ORDER)
    tuning.ts              numeri di bilanciamento (TUNE, K, CRIT)
    items.ts               le cose che Antonio perde (ITEMS) e dove le ritrova (FOUND)
    maps/                  le mappe (index.ts: MAPS) e legend.ts (cosa significa ogni carattere)
      formia.ts            Formia vera: persone, cartelli, oggetti persi, quartieri, motorino (RIDES)
      formia-places.ts     i luoghi con le coordinate reali e i testi (casa, Eclipse, Morgana, stazione…)
      formia-ground.ts     GENERATO da tools/formia/build.ts: terreno, posizioni risolte, case di contorno
      formia-projection.ts dalle coordinate reali alle caselle
      casa.ts, circolo.ts  interni: l'appartamento di Antonio, i campi coperti del Bruno Zauli
    covi.ts, gates.ts      i covi (palestre) con spille e frasi; le uscite dalle città
  battle/                  motore di lotta: puro, senza DOM, stato JSON con l'RNG dentro
    index.ts               API (ENGINE): newBattle, intro, beginTurn, playTurn, needs, available, moveLabel, snap, ai…
    turn.ts                flusso del turno, ordine di azione, fine lotta, voto dell'esame
    moves.ts               cosa fa ogni mossa, personaggio per personaggio
    damage.ts              danni, critici, cure, confusione
    ai.ts                  scelta del computer (e piano dell'Esame)
    labels.ts              etichette dei pulsanti (moveLabel) e bollini (snap/chips)
    state.ts, rng.ts, events.ts, types.ts
  story/                   logica della modalità storia, senza disegno
    maps.ts                mappe preparate, collisioni, oggetti persi, quartieri, covi, percorso più breve
    movement.ts            passi, rotazioni, porte, warp e viaggi (travel)
    activities.ts          le attività per Formia: elenco, volte fatte, record
    goals.ts               il giro di Formia: le tappe in ordine, la prossima, dove puntare la freccia
    run.ts                 lo stato della corsetta in pineta
  save/
    story-progress.ts      salvataggio della storia  (chiave lotte-tra-amici:storia:v1)
    libretto.ts            vittorie, sconfitte, voti (chiave lotte-tra-amici:libretto:v2)
  render/
    svg/                   ritratti generati da parametri (looks.ts), espressioni, capelli, vestiti, Esame, robot;
                           badges.ts: spille e icone degli oggetti
    canvas/                arte della mappa: terreno, edifici e oggetti, omini visti dall'alto, palette dai token --m-*
    world-view.ts          camera, cache dei pezzi di terreno, disegno ordinato, anteprima della home, mappa intera
  audio/                   musica ed effetti sintetizzati con la Web Audio API (nessun file audio)
    context.ts             AudioContext creato al primo tocco o tasto, bus musica/effetti, acceso/spento
                           (chiave lotte-tra-amici:audio:v1), pausa quando la scheda non è visibile
    tracks.ts              i brani in notazione da tracker: home, world, battle, boss, victory, defeat
    music.ts               sequencer: programma le note in anticipo sull'orologio audio, dissolvenze tra brani
    sfx.ts                 gli effetti (colpi, cure, KO, striscioni, passi, spille, clic…)
    cues.ts                quale suono va con quale evento del motore; blip della macchina da scrivere
    synth.ts               strumenti: oscillatori con inviluppo, rumore filtrato, batteria
  ui/
    sound.ts               l'interruttore audio (home, barra della lotta, HUD della storia) e il clic dei pulsanti
    common.ts              colori dei tipi, ritratti, le sezioni della pagina, scelte del giocatore (view)
    home.ts                home (scheda del personaggio, boss, tipi, libretto) e foglio "Nuova sfida"
    battle-screen.ts       schermo di lotta: riproduce gli eventi del motore, passaggio del telefono, risultato, scheda
    effects.ts             effetti della lotta (affondi, proiettili, coriandoli, striscioni…)
    story-screen.ts        schermo della storia: HUD, croce, tastiera, dialoghi, covi, premi, menu (con il Diario
                           di Formia), motorino, ciclo dei frame
    activities.ts          le attività: beach volley, lettino, gelato, quiz da Morgana
    run.ts                 la corsetta in pineta: bandierine, cronometro nell'HUD
    icons.ts, dom.ts
  styles/                  CSS diviso per sezione; index.css = font + app.css; l'ordine degli @import è la cascata
  assets/fonts/            Atkinson Hyperlegible, Lilita One, Patrick Hand (woff2, OFL)
tests/
  unit/                    Vitest
  golden/                  scenari e registratori usati dai golden (lotte deterministiche, finto canvas, finto document)
  fixtures/                i golden: impronte di 2040 lotte, 168 stringhe SVG, le sequenze di disegno del canvas
  e2e/                     Playwright: harness.ts (orologio finto, seme), playthrough.spec.ts (partite intere,
                           storia, attività, casa e motorino), audio.spec.ts
tools/
  sim.ts                   simulatore di bilanciamento
  golden.mjs               genera i golden
  formia/                  la mappa di Formia da OpenStreetMap: extract.mjs, build.ts, paint.ts, show.ts, where.ts, drift.ts
```

## La mappa di Formia

- **È Formia vera:** costa, strade, ferrovia (con la galleria sotto Castellone), spiagge, pinete e parchi vengono da OpenStreetMap; i luoghi stanno dove sono davvero. Antonio è il protagonista: si parte da casa sua, Parco la Fontana in via Giovanni Amendola 1, e i posti dove va con gli amici (l'Eclipse beach di Nicola Spadea a Vindicio, la pineta di Vindicio, la Birreria Morgana a Mola) hanno persone e attività. Il resto della città fa da contorno.
- **Come è fatta:** `tools/formia/build.ts` legge `tools/formia/osm-extract.json` (© OpenStreetMap contributors, ODbL) e, tramite `formia-projection.ts`, disegna il terreno, in quest'ordine:
  1. mare (con la costa lisciata), colline, verde, spiagge e rive: banchine di pietra in città, scogli e calette, sabbia a Vindicio e Gianola;
  2. ferrovia;
  3. i luoghi di `formia-places.ts`, ciascuno sulla casella libera più vicina alla sua posizione reale. Vanno **prima** delle strade, così restano dove sono davvero e sono le strade a girargli attorno;
  4. strade: principali, con nome e le vie più lunghe dei quartieri;
  5. un vialetto da ogni porta fino alla strada;
  6. le persone e le cose ("spot"): mai su un edificio, su un vialetto o subito dietro un tetto;
  7. le case di contorno, allineate lungo le vie;
  8. i marciapiedi del centro e gli uliveti in campagna.

  Tutto finisce in `formia-ground.ts`.
- **Strade e ferrovia ad angolo retto:** come su una mappa da gioco, ogni tratto diventa una scala di gradini larghi (`zline`), non una diagonale a scalini di una casella. Le carreggiate doppie e il secondo binario si scartano (`thin`); i pezzi rimasti staccati si uniscono alla rete con il percorso più corto e i moncherini si tolgono. Così si va ovunque a piedi per strada.
- **Per cambiarla:** modifica `formia-places.ts` (luoghi e "spot" di una casella: persone, cartelli, oggetti, motorini), `tools/formia/paint.ts` (ritocchi a mano sul terreno) o il generatore, poi `npx tsx tools/formia/build.ts`. Se un luogo non trova posto lo stampa come `NOT PLACED`. `npx tsx tools/formia/show.ts x0 x1 y0 y1` mostra un pezzo di mappa con le coordinate; `npx tsx tools/formia/where.ts` dove cadono i luoghi reali; `npx tsx tools/formia/drift.ts` di quante caselle ogni luogo si è spostato dalla sua posizione vera. Dopo, `npm test` (il controllo delle mappe dice se qualcuno è finito irraggiungibile) e `npm run golden`, perché il disegno della mappa cambia.
- **Scala:** circa 33 m per casella in centro, di più nei tratti in mezzo; le spiagge di Vindicio e Gianola sono allargate di qualche casella verso il mare, sennò a questa scala sarebbero strisce.
- **Salvataggi:** chi aveva una partita sulle mappe di prima riparte da casa (`seen.formia4`, l'ultima volta che le caselle sono cambiate), con spille, compagnia e oggetti ritrovati. Se rigeneri la mappa e le posizioni cambiano molto, aggiungi un nuovo `formiaN` in `save/story-progress.ts`.

## Il giro di Formia

- **Cos'è:** il filo che tiene insieme la storia. `story/goals.ts` mette in fila le tappe (`STOPS`): padel con Andrea, Forchetta, Morgana, il gelato, Costanzo, gli oggetti persi, l'Eclipse, la pineta, la Tomba di Cicerone e, alla fine, il treno per Torino. Il percorso va da casa verso ovest.
- **Prossima tappa:** è la prima non ancora fatta; si può comunque fare tutto in qualsiasi ordine. Si vede in tre posti:
  - nell'HUD, sotto il nome del posto, con una freccia che punta verso la tappa (`renderGoal` in `ui/story-screen.ts`);
  - sulla mappa, come una freccia gialla che rimbalza sopra la persona, la cosa o la porta (`drawWorld`);
  - sulla pianta del menu, come una stella; il menu elenca anche tutto il giro.
- **Dentro casa o al circolo**, la freccia punta all'uscita; fuori, alla porta del posto dove sta la tappa (`heading`).
- **Aggiungere una tappa:** una voce in `STOPS`, nell'ordine del giro. Il test `the tour of Formia` controlla la prima tappa e il conteggio.

## Attività, casa e motorino

- **Attività** (`story/activities.ts`): beach volley con Valentin e lettino da Nicola all'Eclipse, corsetta in pineta con Zendavid, quiz da Morgana, gelato sul lungomare. Le propone una persona sulla mappa (`activity` sull'Npc); `ui/activities.ts` e `ui/run.ts` le fanno giocare; volte e record si salvano nella storia (`done`, `best`, campi facoltativi) e si vedono nel "Diario di Formia" del menu.
- **Aggiungerne una:** una voce in `ACTIVITIES`, un caso in `play()` di `ui/activities.ts`, `activity: 'id'` su chi la propone in `formia.ts`, e un pezzo nel test `activities around Formia`.
- **Casa:** il portone di Parco la Fontana porta in `casa.ts`. Mobili e finestra sono cartelli `quiet` (si usano, ma non si disegna il cartello di legno).
- **Motorino:** parcheggiato sotto casa, all'Eclipse, da Morgana e in piazza della Vittoria (`RIDES` in `formia.ts`, cartelli `ride`): si sale e si sceglie dove andare.

## Come gira

- **Lotta:** `ui/battle-screen.ts` chiede al motore gli eventi (`say`, `line`, `expr`, `anim`, `hp`, `sync`, `end`) e li riproduce uno dopo l'altro con una catena di Promise. Il contatore `flow` annulla le riproduzioni vecchie. Le fasi sono `intro → begin → select → busy → begin … → over`. Non c'è un game loop.
- **Storia:** ha un ciclo `requestAnimationFrame` in `ui/story-screen.ts`: `update(now)` (movimento) e poi `drawWorld(now)` (disegno). Il disegno legge soltanto lo stato della storia.
- **Comunicazione tra i moduli:** import diretti. Le variabili condivise vivono nel modulo che le modifica e gli altri le leggono come binding live; dove serve modificarle da fuori ci sono dei setter (`setMap`, `resetProgress`, `halt`, `invalidate`).

## Audio

- **Tutto sintetizzato:** musica ed effetti nascono da oscillatori e rumore, quindi il file singolo resta leggero.
- **Accensione:** l'audio parte acceso, ma il browser lo lascia partire solo dopo il primo tocco o tasto. L'interruttore lo spegne, e la scelta resta in `lotte-tra-amici:audio:v1`; i salvataggi del gioco non si toccano.
- **Musica per schermata:** `home` (avvio, ritorno alla home), `world` (apertura della storia), `battle`/`boss` (inizio lotta), `victory`/`defeat` (risultato, una volta sola).
- **Effetti della lotta:** escono da `cueBattle(ev)`, chiamato per ogni evento riprodotto in `ui/battle-screen.ts`. Il motore non sa niente del suono.
- **Mai `Math.random` nell'audio:** il seme delle lotte nasce da `Math.random`, e un suono non deve cambiare una lotta. Per le piccole variazioni c'è `wobble()` in `synth.ts`.
- **Nuovo brano:** aggiungilo in `tracks.ts`, con battute da 16 passi (il test unitario le controlla). `tests/e2e/audio.spec.ts` lo renderizza offline e controlla che non sia muto e non distorca.

## Convenzioni

- **Lingue:** testi del gioco in italiano, commenti del codice in inglese, messaggi di commit in italiano.
- **Colori:** solo token CSS, definiti per il tema chiaro e per quello scuro (`styles/tokens.css`). La mappa usa i token `--m-*`. I personaggi sono "adesivi" a colori fissi con contorno scuro.
- **Ritratti:** nessuna foto nella repo. Sono generati da parametri: pelle, labbra, occhi, sopracciglia, capelli `curls`/`wavy`/`quiff`/`buzz`, vestiti, occhiali, orecchini.
  - Espressioni con `data-expr`: smirk, grin, pout, worried, sleepy, cool.
  - Cuffie di Zendavid con `data-ph`.
- **La UI non conosce le regole:** riproduce gli eventi del motore. Etichette dei pulsanti e bollini arrivano dal motore (`moveLabel`, `chips` dentro `snap`). Questa separazione va mantenuta: è quella che rende possibile Phaser.
- **Stato della lotta:** JSON puro con l'RNG dentro. A parità di seme e di mosse la lotta è identica: su questo si reggono i golden. Nel motore niente `Math.random`, `Date` o DOM.
- **Salvataggi:**
  - chiavi e formati restano quelli di prima (`lotte-tra-amici:storia:v1`, `lotte-tra-amici:libretto:v2`);
  - `localStorage` sempre in `try/catch`, perché nella cornice dell'Artifact può mancare o lanciare errori.
- **Gancio `window.claude.hot`** in `main.ts`: serve all'aggiornamento a caldo dell'Artifact (una lotta aperta sopravvive). Va tenuto.
- **TypeScript strict**, `noUnusedLocals`.
  - Il codice migrato è stato tradotto istruzione per istruzione (molti `var` e `function` sono rimasti): un refactor di stile va fatto a parte, con i golden verdi.
  - `allowJs` resta attivo solo per gli aiuti `.mjs` dei test.

## Bilanciamento

- I valori di `TUNE`, le statistiche in `CHARS` e gli `uses` delle mosse sono tarati con migliaia di lotte simulate, computer contro computer.
- **Obiettivo:** ogni personaggio vince tra il 45% e il 55% in totale, e nessuno scontro singolo supera circa 25/75, salvo rivalità volute. Oggi Costanzo contro Zendavid (84%) e Zendavid contro Forchetta (83%) superano la soglia: sono vantaggi di tipo.
- **Vantaggio di tipo:** conta il tipo del **personaggio**, non quello della mossa. Ciclo Calma → Caos → Cervello → Chiacchiera → Cuore → Calma. Chi ha il vantaggio fa ×1,12 (`TUNE.se`) e subisce ×0,9 (`TUNE.nve`).
- **Mosse con `uses` limitati:** servono a evitare lotte infinite a colpi di cure. Non vanno tolti.
- **Battuta:** l'etichetta dice "40% di far ridere", ma la probabilità è 0,45 e il bilanciamento è stato simulato con 0,45. Se si corregge, va corretta l'etichetta (`battle/labels.ts`), non la probabilità.
- **Prima di cambiare un numero**, prova con `npm run sim -- '{"antonio":{"atk":95}}'`. Gli override riguardano statistiche, mosse (`{"zendavid":{"moves":{"battuta":{"chance":0.4}}}}`) e `TUNE`. Poi modifica `src/data/`, controlla, e rigenera i golden apposta con `npm run golden`.

## Test

- **Golden** (`npm test`):
  - il motore deve produrre, lotta per lotta, gli stessi eventi, le stesse etichette e lo stesso stato finale;
  - i ritratti, le stesse stringhe SVG;
  - l'arte della mappa, le stesse chiamate al canvas (registrate da un finto contesto 2D).

  Se fallisce un golden e non volevi cambiare nulla, hai cambiato il comportamento.
- **Mappe** (`tests/unit/maps.test.ts`): controlla righe tutte della stessa lunghezza, caratteri noti, persone, cartelli, oggetti e porte raggiungibili, warp e porte su caselle libere, covi e cancelli coerenti.
- **Partite intere** (`npm run test:e2e`): home, lotte contro il computer, Esame, due giocatori, storia (oggetti, covo, circolo, menu), croce touch, salvataggi nel vecchio formato, aggiornamento a caldo.
  - Girano con orologio finto di Playwright, `Math.random` con seme e movimento ridotto, e devono arrivare in fondo senza un errore.
  - Con `SHOTS=1` salvano le schermate in `test-results/shots`.
  - Fino alla conferma della migrazione gli stessi scenari erano confrontati pixel per pixel con il vecchio gioco in un file (`legacy/index.html`, ora eliminato; resta nella storia di git).

## Aggiungere una città

- **Mappa:** un file in `src/data/maps/` con righe tutte della stessa lunghezza, registrato in `maps/index.ts`.
- **Collegamento:** con una porta (`to`, `tx`, `ty`, `tdir` su un edificio) oppure con un `warp`. Gli interni hanno `inside: true` e la `city` di appartenenza.
- **Covo:** l'amico va messo nella mappa con `person` e `covo`. In `data/covi.ts` serve la voce con la spilla e le frasi (`intro`, `win`, `lose`, `after`).
- **Uscite** (`data/gates.ts`): si aprono con tutte le spille della città. Il cancello del treno per Torino è il punto di aggancio della prossima città, che non esiste ancora.
- **Verifica:** `npm test` controlla tutto.

## Se il build torna a essere un Artifact di claude.ai

- **CSP della cornice:** script esterni solo da cdnjs, jsdelivr o unpkg; fogli di stile solo da Google Fonts; niente immagini esterne. Il resto deve essere inline o generato in codice, e Phaser va benissimo incorporato nel bundle singlefile.
- **Font:** dopo la prima pubblicazione va verificato che i font incorporati (`@font-face` con URL `data:`) si carichino davvero nella cornice. Se no, pubblica `dist-google-fonts/index.html`.
- **Limite della pagina:** 16 MB. Oggi il file è di circa 430 KB.
- **Origine nuova:** un nuovo Artifact è una nuova origine, quindi salvataggi e libretto ripartono vuoti.

## Verso Phaser

Le parti che una scena Phaser può sostituire senza toccare il resto:
- `render/world-view.ts` (legge `st`, `M`, `mover`, `parity`) con l'arte di `render/canvas/`;
- poi `ui/battle-screen.ts` ed `effects.ts` per la lotta, continuando a riprodurre gli stessi eventi del motore.

Motore, dati, logica della storia e salvataggi restano come sono.
