# Telepilo · Creature di Formia

TypeScript strict + Vite, DOM/SVG per lotte e interfaccia, canvas 2D per la mappa, audio sintetizzato. Build in `dist/index.html`, un file autonomo. Il nome è `GAME_NAME` in `src/data/growth.ts`.

## Stato e responsabilità

- Il gioco attivo ha sei protagonisti. Claudia e le revisioni dei personaggi sono **proposte non integrate** in `design/personaggi/`.
- Antonio vuole prima migliorare tutti i personaggi. Codex prepara idee, specifiche e grafiche; **Opus farà l'integrazione solo quando Antonio la richiederà**. Non applicare la patch del prototipo e non cambiare `src/` per anticiparla.
- `docs/roadmap.md` è l'unica lista del lavoro aperto. Nessuna task parte automaticamente: seguire la richiesta corrente.
- Leggere solo ciò che serve: `docs/architettura.md` per i file; `gioco.md` per le regole attuali; `mappa.md` per il territorio; `sviluppo.md` per strumenti e verifiche; `fonti-formia.md` per i fatti locali. Per i personaggi partire da `design/personaggi/README.md`.
- Non leggere in blocco SVG, patch, archivi o immagini di `design/`: usare la galleria per la grafica e aprire una patch solo quando serve alla richiesta corrente.

## Regole essenziali

- Motore in `src/battle/` puro: stato JSON e RNG con seme; niente DOM, `Date` o `Math.random`. La UI riproduce gli eventi; regole della storia in `src/story/`.
- Salvataggi compatibili: non rinominare `lotte-tra-amici:*`; campi nuovi facoltativi, accesso a `localStorage` protetto. Cambiando le coordinate della mappa aggiungere una migrazione in `save/story-progress.ts`.
- Golden: rigenerarli solo per cambiamenti voluti e verificati. Le 2.040 lotte tra amici sono il riferimento esistente; non eliminarle prima che ci sia una copertura equivalente delle lotte di squadra.
- Prima di cambiare numeri, misurare con i simulatori pertinenti. Nessun ritocco di bilanciamento solo per far combaciare la biografia.
- Testi in italiano, commenti del codice in inglese, colori UI nei token CSS; ritratti e omini usano colori fissi. Stile quaderno a penna ed evidenziatori; niente migrazione a Phaser o al 3D.
- Le persone sono reali: niente nuovi cognomi o numeri civici. Fatti di Formia verificati e fonti in `docs/fonti-formia.md`.
- Preservare `window.claude.hot`. Effetti puramente ambientali in `render/atmosphere.ts`, senza dipendere dalla storia, fermi con movimento ridotto e spenti in Grafica Bassa.
- PC principale, telefono funzionante. Non aggiornare il trailer senza una richiesta di Antonio. Commit e push solo se richiesti.

## Verifica

`npm run typecheck`, `npm test`, `npm run build`; anche `npm run test:e2e` quando cambia lo schermo o il flusso giocabile. Non scrivere in `src/` durante Playwright: il server ricarica la pagina. Dettagli e comandi mirati in `docs/sviluppo.md`.
