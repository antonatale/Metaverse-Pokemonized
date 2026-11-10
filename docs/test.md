# Test

> Spostato intero da `CLAUDE.md` il 10 novembre 2026 (task R1 di `REVISIONE.md`). Dove una frase è superata dal codice di oggi c'è una nota **Oggi:**.

## Test

- **Golden** (`npm test`):
  - il motore deve produrre, lotta per lotta, gli stessi eventi, le stesse etichette e lo stesso stato finale;
  - i ritratti, le stesse stringhe SVG;
  - l'arte della mappa, le stesse chiamate al canvas (registrate da un finto contesto 2D).

  Se fallisce un golden e non volevi cambiare nulla, hai cambiato il comportamento.
- **I pacchetti git** (`promo/*.bundle`): un'altra sessione lavora sul gioco e passa il suo lavoro come bundle, a partire da `origin/main`. Prima di fare `git pull` del bundle: `git bundle verify`, guardare cosa cambia con `git fetch <bundle> main` e `git diff HEAD FETCH_HEAD`, provarlo in un worktree. Se ci sono modifiche locali il pull viene rifiutato: vanno messe da parte e rifuse. Con più di un lavoro in corso conviene che `main` resti aggiornato spesso, o le fusioni crescono.
- **Mappe** (`tests/unit/maps.test.ts`): controlla righe tutte della stessa lunghezza, caratteri noti, persone, cartelli, oggetti e porte raggiungibili, warp e porte su caselle libere, covi e cancelli coerenti.
- **Partite intere** (`npm run test:e2e`): il titolo, l'intro e le tre storie, storia (oggetti, covo, circolo, menu), croce touch, salvataggi nel vecchio formato, aggiornamento a caldo.
  - Girano con orologio finto di Playwright, `Math.random` con seme e movimento ridotto, e devono arrivare in fondo senza un errore.
  - Gli allenatori che vedono Antonio sono spenti, perché molte partite ci passano davanti; li accende chi passa `spot: true` a `play()` (`a trainer who sees Antonio`).
  - Con `SHOTS=1` salvano le schermate in `test-results/shots`.
  - **Quale codice stanno provando:** Playwright riusa un server già acceso sulla porta 5173 (`reuseExistingServer`), e il server serve la cartella da cui è partito, non quella del test. Per provare un'altra copia del repo (un `git worktree`, un pacchetto prima di unirlo) serve un server suo su un'altra porta e `GAME_URL=http://localhost:5199/ npx playwright test`: altrimenti si prova il codice sbagliato senza accorgersene. E mentre girano non si salvano file: il server ricarica la pagina a metà partita («Execution context was destroyed»).
  - **Se fallisce solo `audio.spec.ts`** («Expected: > 5, Received: 5» dopo aver acceso il suono in lotta), di solito è il Mac e non il gioco: a volte in Chromium headless l'orologio audio resta fermo (`currentTime` a 0,005 con il contesto `running`), la musica non avanza e si contano solo gli effetti. Rilanciato più tardi passa; per esserne sicuri si prova sul commit di prima.
  - Fino alla conferma della migrazione gli stessi scenari erano confrontati pixel per pixel con il vecchio gioco in un file (`legacy/index.html`, ora eliminato; resta nella storia di git).
