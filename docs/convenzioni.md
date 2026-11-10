# Convenzioni

> Spostato intero da `CLAUDE.md` il 10 novembre 2026 (task R1 di `REVISIONE.md`). Dove una frase è superata dal codice di oggi c'è una nota **Oggi:**.

## Convenzioni

- **Lingue:** testi del gioco in italiano, commenti del codice in inglese, messaggi di commit in italiano.
- **Colori:** solo token CSS, definiti per il tema chiaro e per quello scuro (`styles/tokens.css`). La mappa usa i token `--m-*`. I personaggi sono "adesivi" a colori fissi con contorno scuro.
- **Ritratti:** nessuna foto nella repo. Sono generati da parametri: pelle, labbra, occhi, sopracciglia, capelli `curls`/`wavy`/`quiff`/`buzz`, vestiti, occhiali, orecchini.
  - Espressioni con `data-expr`: smirk, grin, pout, worried, sleepy, cool.
  - Cuffie di Zendavid con `data-ph`.
- **La UI non conosce le regole:** riproduce gli eventi del motore. Etichette dei pulsanti e bollini arrivano dal motore (`moveLabel`, `chips` dentro `snap`). Questa separazione va mantenuta: è quella che rende possibile Phaser.
- **Stato della lotta:** JSON puro con l'RNG dentro. A parità di seme e di mosse la lotta è identica: su questo si reggono i golden. Nel motore niente `Math.random`, `Date` o DOM.
- **Salvataggi:**
  - chiavi e formati restano quelli di prima: la storia di sempre è la prima delle tre (`lotte-tra-amici:storia:v1`); `lotte-tra-amici:libretto:v2` e `lotte-tra-amici:giorno:v1` restano orfane nei browser, innocue;
  - `localStorage` sempre in `try/catch`, perché nella cornice dell'Artifact può mancare o lanciare errori.
- **Gancio `window.claude.hot`** in `main.ts`: serve all'aggiornamento a caldo dell'Artifact (una lotta aperta sopravvive). Va tenuto.
- **TypeScript strict**, `noUnusedLocals`.
  - Il codice migrato è stato tradotto istruzione per istruzione (molti `var` e `function` sono rimasti): un refactor di stile va fatto a parte, con i golden verdi.
  - `allowJs` resta attivo solo per gli aiuti `.mjs` dei test.
