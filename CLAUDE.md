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
| `npm run test:parity` | Playwright: confronto pixel per pixel con `legacy/index.html` (finché esiste) |
| `npm run test:parity:dist` | lo stesso confronto sul file singolo di `dist/` aperto da disco |
| `npm run test:all` | Vitest + Playwright |
| `npm run sim` | simulatore di bilanciamento (vedi sotto) |
| `npm run golden` | rigenera i golden dal vecchio file; `-- --from-current` li rigenera dal codice attuale |

## Dove si trova ogni parte

```
index.html                 guscio della pagina: le quattro sezioni (home, battle, world, overlay)
legacy/index.html          il vecchio gioco in un file, solo per confronto; da eliminare dopo la verifica
src/
  main.ts                  avvio: listener della tastiera (prima la mappa, poi la lotta), window.WORLD/UI per i
                           playtest, gancio window.claude.hot per l'aggiornamento a caldo dell'Artifact
  data/                    solo dati, niente logica
    characters.ts          i sei amici e l'Esame: statistiche, mosse, passive, difetti, frasi; ROSTER, PAIRS, JOKES
    types.ts               i cinque tipi in ciclo (TYPES, TYPE_ORDER)
    tuning.ts              numeri di bilanciamento (TUNE, K, CRIT)
    items.ts               le cose che Antonio perde (ITEMS) e dove le ritrova (FOUND)
    maps/                  formia.ts, circolo.ts, legend.ts (cosa significa ogni carattere), types.ts, index.ts (MAPS)
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
    movement.ts            passi, rotazioni, porte e warp
  save/
    story-progress.ts      salvataggio della storia  (chiave lotte-tra-amici:storia:v1)
    libretto.ts            vittorie, sconfitte, voti (chiave lotte-tra-amici:libretto:v2)
  render/
    svg/                   ritratti generati da parametri (looks.ts), espressioni, capelli, vestiti, Esame, robot;
                           badges.ts: spille e icone degli oggetti
    canvas/                arte della mappa: terreno, edifici e oggetti, omini visti dall'alto, palette dai token --m-*
    world-view.ts          camera, cache dei pezzi di terreno, disegno ordinato, anteprima della home, mappa intera
  ui/
    common.ts              colori dei tipi, ritratti, le sezioni della pagina, scelte del giocatore (view)
    home.ts                home (scheda del personaggio, boss, tipi, libretto) e foglio "Nuova sfida"
    battle-screen.ts       schermo di lotta: riproduce gli eventi del motore, passaggio del telefono, risultato, scheda
    effects.ts             effetti della lotta (affondi, proiettili, coriandoli, striscioni…)
    story-screen.ts        schermo della storia: HUD, croce, tastiera, dialoghi, covi, premi, menu, ciclo dei frame
    icons.ts, dom.ts
  styles/                  CSS diviso per sezione; index.css = font + app.css; l'ordine degli @import è la cascata
  assets/fonts/            Atkinson Hyperlegible, Lilita One, Patrick Hand (woff2, OFL)
tests/
  unit/                    Vitest
  golden/                  scenari e registratori usati dai golden (lotte deterministiche, finto canvas, finto document)
  fixtures/                i golden: impronte di 2040 lotte, 168 stringhe SVG, 184 sequenze di disegno
  e2e/                     Playwright: twin.ts gira ogni scenario sul vecchio e sul nuovo e confronta
tools/
  sim.ts                   simulatore di bilanciamento
  golden.mjs               genera i golden
```

## Come gira

- **Lotta:** `ui/battle-screen.ts` chiede al motore gli eventi (`say`, `line`, `expr`, `anim`, `hp`, `sync`, `end`) e li riproduce uno dopo l'altro con una catena di Promise. Il contatore `flow` annulla le riproduzioni vecchie. Le fasi sono `intro → begin → select → busy → begin … → over`. Non c'è un game loop.
- **Storia:** ha un ciclo `requestAnimationFrame` in `ui/story-screen.ts`: `update(now)` (movimento) e poi `drawWorld(now)` (disegno). Il disegno legge soltanto lo stato della storia.
- **Comunicazione tra i moduli:** import diretti. Le variabili condivise vivono nel modulo che le modifica e gli altri le leggono come binding live; dove serve modificarle da fuori ci sono dei setter (`setMap`, `resetProgress`, `halt`, `invalidate`).

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
- **Prima di cambiare un numero**, prova con `npm run sim -- '{"antonio":{"atk":95}}'`. Gli override riguardano statistiche, mosse (`{"zendavid":{"moves":{"battuta":{"chance":0.4}}}}`) e `TUNE`. Poi modifica `src/data/`, controlla, e rigenera i golden apposta con `npm run golden -- --from-current`.

## Test

- **Golden** (`npm test`):
  - il motore deve produrre, lotta per lotta, gli stessi eventi, le stesse etichette e lo stesso stato finale;
  - i ritratti, le stesse stringhe SVG;
  - l'arte della mappa, le stesse chiamate al canvas (registrate da un finto contesto 2D).

  Se fallisce un golden e non volevi cambiare nulla, hai cambiato il comportamento.
- **Mappe** (`tests/unit/maps.test.ts`): controlla righe tutte della stessa lunghezza, caratteri noti, persone, cartelli, oggetti e porte raggiungibili, warp e porte su caselle libere, covi e cancelli coerenti.
- **Parità visiva** (`npm run test:parity`, finché esiste `legacy/index.html`):
  - ogni scenario gira sul vecchio e sul nuovo con orologio finto di Playwright, `Math.random` con seme e movimento ridotto;
  - screenshot, salvataggi ed errori della console devono coincidere;
  - con `PARITY_SAVE=1` salva le schermate in `test-results/shots`; le differenze finiscono in `test-results/parity`.

## Aggiungere una città

- **Mappa:** un file in `src/data/maps/` con righe tutte della stessa lunghezza, registrato in `maps/index.ts`.
- **Collegamento:** con una porta (`to`, `tx`, `ty`, `tdir` su un edificio) oppure con un `warp`. Gli interni hanno `inside: true` e la `city` di appartenenza.
- **Covo:** l'amico va messo nella mappa con `person` e `covo`. In `data/covi.ts` serve la voce con la spilla e le frasi (`intro`, `win`, `lose`, `after`).
- **Uscite** (`data/gates.ts`): si aprono con tutte le spille della città. Il cancello del treno per Torino è il punto di aggancio della prossima città, che non esiste ancora.
- **Verifica:** `npm test` controlla tutto.

## Se il build torna a essere un Artifact di claude.ai

- **CSP della cornice:** script esterni solo da cdnjs, jsdelivr o unpkg; fogli di stile solo da Google Fonts; niente immagini esterne. Il resto deve essere inline o generato in codice, e Phaser va benissimo incorporato nel bundle singlefile.
- **Font:** dopo la prima pubblicazione va verificato che i font incorporati (`@font-face` con URL `data:`) si carichino davvero nella cornice. Se no, pubblica `dist-google-fonts/index.html`.
- **Limite della pagina:** 16 MB. Oggi il file è di circa 410 KB.
- **Origine nuova:** un nuovo Artifact è una nuova origine, quindi salvataggi e libretto ripartono vuoti.

## Verso Phaser

Le parti che una scena Phaser può sostituire senza toccare il resto:
- `render/world-view.ts` (legge `st`, `M`, `mover`, `parity`) con l'arte di `render/canvas/`;
- poi `ui/battle-screen.ts` ed `effects.ts` per la lotta, continuando a riprodurre gli stessi eventi del motore.

Motore, dati, logica della storia e salvataggi restano come sono.
