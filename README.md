# Lotte tra Amici

Gioco di lotte a turni in stile Pokémon con sei amici e un boss, l'Esame di Controlli, più una modalità storia per le strade di Formia. Musica ed effetti sonori sono sintetizzati in tempo reale; l'interruttore audio è nella home, nella barra della lotta e nella mappa. Scritto in TypeScript con Vite; la build è un'unica pagina HTML che si apre e si condivide da sola.

## Come avviarlo

Serve Node.js 22 o più recente.

```sh
npm install
npm run dev
```

Poi apri http://localhost:5173.

## Una pagina sola da condividere

```sh
npm run build
```

Crea `dist/index.html`: un unico file con dentro tutto (script, stili, font). Si apre con un doppio clic e si può mandare a chiunque.

Se la pagina deve girare dove i font incorporati non si caricano (per esempio come Artifact su claude.ai), usa `npm run build:google-fonts`. Crea `dist-google-fonts/index.html`, con i font presi da Google Fonts.

## Test

```sh
npm test               # motore, ritratti, mappa, dati e controllo delle mappe
npm run test:parity    # confronto pixel per pixel con la vecchia versione (legacy/index.html)
npm run sim            # percentuali di vittoria di tutte le coppie, per il bilanciamento
```

La prima volta, per i test di parità serve anche `npx playwright install chromium`.

## Note

- I progressi della storia e il libretto sono salvati nel `localStorage` del browser, quindi sono legati alla pagina e al browser in cui giochi. Le chiavi sono le stesse della versione in un file solo: i vecchi salvataggi restano validi se apri la nuova pagina dallo stesso indirizzo.
- Struttura del progetto, convenzioni e dove si trova ogni parte del gioco: [CLAUDE.md](CLAUDE.md).
