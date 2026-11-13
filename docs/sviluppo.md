# Sviluppo e verifiche

## Comandi

| Comando | Uso |
|---|---|
| `npm ci` | Installa le dipendenze dal lockfile, Node 22+ |
| `npm run dev` | Server Vite sulla porta 5173 |
| `npm run typecheck` | TypeScript strict |
| `npm run check` | Test, golden, TypeScript e build: lo stesso controllo locale e su GitHub |
| `npm test` | Dati, motore, mappe, ritratti e golden |
| `npm run build` | Verifica i tipi e genera `dist/index.html` autonomo |
| `npm run build:google-fonts` | Variante con font esterni in `dist-google-fonts/` |
| `npm run test:e2e` | Prove complete in Playwright |
| `npm run test:e2e -- tests/e2e/nicola.spec.ts` | Prologo, musica di Nicola, viaggio senza collisioni né sbalzi, chat della prima creatura e del risultato, rivale fermo durante il dialogo |
| `npm run golden` | Rigenera deliberatamente i golden dopo un cambiamento verificato |
| `npm run sim`, `npm run sim:fun` | Duelli fra amici e decisioni fra creature |
| `npx tsx tools/sim-story.ts trainers` | Allenatori contro squadre di riferimento |
| `npx tsx tools/sim-covi.ts` | Covi, protagonisti e iniziali; `--tune` cerca una taratura |
| `npx tsx tools/sim-legend.ts giano:36 <squadra>` | Una leggenda contro una squadra |
| `npm run playtest` | partite automatiche: ogni protagonista per tre iniziali |
| `npm run perf` | Misura il fotogramma con `dist/perf.html` |
| `npx tsx tools/move-sheet.ts <mossa>` | Controllo visivo di una scena, con server acceso |

Per il giocatore automatico e le opzioni mirate leggere `tools/playtest/README.md`. I suoi rapporti sono generati in `test-results/`, non diventano altra documentazione permanente.

## Riferimenti di regressione

`tests/fixtures/engine-golden.json` contiene 2.040 lotte deterministiche. `sprites-golden.json` registra le stringhe SVG e `canvas-golden.json` le chiamate al canvas. Se cambia un golden senza volerlo, cercare la regressione: non aggiornare il riferimento per nasconderla. I test del motore attuali non sostituiscono ancora golden completi delle lotte di squadra.

GitHub e il Mac usano entrambi `npm run check` (`.github/workflows/ci.yml`). Per gli interventi sullo schermo eseguire anche Playwright, guardando il risultato a 1366×768. Il telefono ha una prova dei comandi touch.

## Playwright

La prima volta: `npx playwright install chromium`. `SHOTS=1 npm run test:e2e` salva le schermate in `test-results/shots/`. Il server riutilizzato sulla 5173 deve appartenere alla copia corretta del progetto; con un'altra copia usare una porta propria e `GAME_URL=http://localhost:5199/ npm run test:e2e`.

Non modificare `src/` durante le prove. Orologio finto e scene con animazioni reali possono interferire con il timeout di `safeShow`; non scambiare automaticamente un salto di scena nel test per un blocco reale. I test lunghi usano Grafica Bassa. Con macchina occupata ridurre i worker prima di modificare i test. Se fallisce solo l'avvio dell'audio, verificare che il contesto audio del browser avanzi: alcuni Chromium headless lo lasciano fermo.

## File generati

`dist/`, `dist-google-fonts/`, `test-results/`, `output/`, `.playwright-cli/` e `node_modules/` sono ignorati da Git. Non aggiungere schermate di test o copie dell'HTML a ogni commit. Il trailer e i suoi strumenti sono stati tolti il 12 novembre (erano della versione precedente): `tools/game.ts` resta come guida del gioco fotogramma per fotogramma per `move-sheet.ts`, `tools/tullio.ts` come aspetto di Tullio per i ritratti futuri.

Nel contenitore senza il browser di Playwright le partite girano con il Chrome di sistema (`launchOptions.executablePath` in una config locale non committata) e quattro worker: 43 partite in circa 25 minuti.
