# Telepilo · Creature di Formia

Gioco di lotte a turni in stile Pokémon nella Formia vera (mappa da OpenStreetMap), con creature originali. Il gioco è
la modalità storia: si sceglie uno dei sei amici («chi sei?»), si parte da casa sua, si prende una creatura dal
guardaparco di Gianola, si battono i covi degli altri cinque e si seguono le Pietre di Telepilo fino a Mamurra, poi il
treno per Torino o Milano. Cicerone (il fantasma) fa da guida. Vite + TypeScript strict, niente framework: DOM e SVG per
titolo e lotta, canvas 2D per la mappa, audio sintetizzato. La build è un unico file HTML autonomo.

Il nome è in una costante sola, `GAME_NAME` in `src/data/growth.ts`. Il vecchio nome «Lotte tra Amici» resta solo nelle
chiavi dei salvataggi `lotte-tra-amici:*` (che non cambiano mai), nel trailer e nel nome del repo.

**Cosa fare adesso:** `REVISIONE.md` (10 novembre 2026) ha le task R1…R22 e le decisioni D1…D5 che spettano ad Antonio.
In fondo a ogni task fatta c'è cosa è stato fatto. Le task vecchie sono in `TASK-MODELLI.md`, le idee in `PROSSIMI-PASSI.md`
e `BRIEFING-IDEE.md`.

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm install` | dipendenze (Node 22 o più recente) |
| `npm run dev` | server di sviluppo su http://localhost:5173 |
| `npm run build` | typecheck + `dist/index.html`, un solo file con tutto dentro |
| `npm run typecheck` | solo `tsc --noEmit` |
| `npm test` | Vitest: golden di motore, ritratti e mappa, dati, mappe, regole |
| `npm run test:e2e` | Playwright: partite intere giocate fino in fondo, senza errori, e l'audio |
| `npm run golden` | rigenera i golden dopo un cambio **voluto** |
| `npm run sim`, `npm run sim:fun` | bilanciamento tra amici; duelli tra creature (tipi, scelte, panchina) |
| `npx tsx tools/sim-story.ts trainers` | ogni allenatore della storia contro le tre iniziali |
| `npx tsx tools/sim-legend.ts giano:36 <squadra>` | una leggenda contro una squadra |
| `npx tsx tools/sim-covi.ts` | i covi con le creature: ogni protagonista e iniziale, da 0 a 4 spille (`--tune` ritara le squadre dei capi) |
| `npm run promo` | il trailer (serve macOS) |

GitHub fa typecheck, `npm test` e build a ogni push (`.github/workflows/ci.yml`). Le partite Playwright girano sul Mac;
in un contenitore senza il browser di Playwright si possono lanciare con il Chrome di sistema passando
`launchOptions.executablePath` in una config locale, e con pochi worker (a 6 le partite lunghe vanno fuori tempo).

## Regole che non si rompono

- **Il motore è puro** (`src/battle/`): stato JSON con l'RNG dentro, niente `Math.random`, `Date` o DOM. A parità di seme
  e di mosse la lotta è identica: su questo si reggono i golden.
- **I golden** (`tests/fixtures/`): se uno fallisce e non volevi cambiare niente, hai cambiato il comportamento. Si
  rigenerano solo apposta, e si committano insieme al cambio. Le 2040 lotte dei golden sono le lotte libere tra amici:
  per ora le novità della storia entrano nel motore come caso a parte (`field`, `bench`, `known`…), senza toccarle.
- **La UI non conosce le regole:** riproduce gli eventi del motore (`ui/battle-screen.ts`); etichette e bollini vengono
  dal motore. Le regole della storia stanno in `src/story/`, non in `ui/`.
- **Salvataggi:** chiavi e formati restano compatibili (`lotte-tra-amici:storia:v1`, `:2`, `:3`); i campi nuovi sono
  facoltativi; `localStorage` sempre in `try/catch`. Se le caselle della mappa cambiano, serve un nuovo `formiaN` in
  `save/story-progress.ts`.
- **Niente `Math.random` nell'audio né negli effetti di lotta**: un suono o una scena non devono cambiare una lotta.
- **Il gancio `window.claude.hot`** in `main.ts` resta (aggiornamento a caldo dell'Artifact).
- **I fatti di Formia sono veri:** chi aggiunge un cartello, una frase o un quiz lo controlla e scrive la fonte in
  `docs/fonti-formia.md`. La trama non si anticipa (Cicerone, menu, trailer).
- **Persone vere:** gli amici sono persone reali. Niente numeri civici né cognomi in testi nuovi, e niente persone che
  non sono nel gruppo in primo piano (D2 di `REVISIONE.md`).
- **Bilanciamento:** prima di cambiare un numero si misura con il simulatore, `sim-story trainers` oltre a `sim:fun`.

## Come si lavora

- Una task per sessione. Commit solo quando Antonio lo chiede, messaggi in italiano.
- Alla fine: `npx tsc --noEmit`, `npm test`, `npm run build`, e `npm run test:e2e` se la task tocca lo schermo.
- Il gioco è per PC: le partite di prova girano a 1366×768 (il telefono solo per la croce touch).
- Testi del gioco in italiano, commenti del codice in inglese. Colori solo da token CSS (`styles/tokens.css`).
- Mentre girano le partite Playwright non si salvano file in `src/`: il server ricarica la pagina a metà partita.

## Se tocchi X, leggi prima

| Parte | Documento |
|---|---|
| Dove sta ogni file, città nuove, Artifact, Phaser | `docs/architettura.md` |
| Convenzioni di codice, ritratti, TypeScript | `docs/convenzioni.md` |
| La mappa, il generatore, i quartieri, com'è disegnata | `docs/mappa.md` |
| Cicerone, la trama, le scelte, il giro di Formia | `docs/trama.md` |
| «Chi sei?», i sei covi, le case, il treno | `docs/protagonisti.md` |
| Il titolo e le tre storie (salvataggi) | `docs/titolo-e-salvataggi.md` |
| Creature, mosse, tipi, lotte di squadra, stati, leggende, luoghi con enigma, economia, bilanciamento | `docs/creature-e-lotte.md` |
| Menu, lotta a schermo, magie e scene delle mosse, velocità della lotta | `docs/lotta-a-schermo.md` |
| Attività, casa, motorino, torneo | `docs/attivita.md` |
| Giorno e notte | `docs/giorno-e-notte.md` |
| Musica, effetti, versi | `docs/audio.md` |
| Il trailer | `docs/trailer.md` |
| Golden, partite Playwright, pacchetti git | `docs/test.md` |
| Fonti dei fatti di Formia | `docs/fonti-formia.md` |

I documenti di `docs/` sono le sezioni del vecchio `CLAUDE.md` (143 KB), spostate intere il 10 novembre: dove il codice
di oggi dice altro c'è una nota **Oggi:**. Se trovi una frase superata, correggila lì.
