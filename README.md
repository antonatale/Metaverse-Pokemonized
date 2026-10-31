# Lotte tra Amici

Gioco di lotte a turni in stile Pokémon con sei amici e un boss, l'Esame di Controlli, più una modalità storia nella Formia vera (mappa da OpenStreetMap): si parte da casa, a Parco la Fontana, e si va all'Eclipse a Vindicio, in pineta, da Morgana, con attività e minigiochi nei posti di tutti i giorni. Un giro di Formia mette in fila sfide, attività e oggetti persi: la prossima tappa è sempre in alto, con una freccia che indica la strada, e il motorino porta da un posto all'altro. Musica ed effetti sonori sono sintetizzati in tempo reale; l'interruttore audio è nella home, nella barra della lotta e nella mappa. Scritto in TypeScript con Vite; la build è un'unica pagina HTML che si apre e si condivide da sola.

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
npm run test:e2e       # partite intere giocate fino in fondo, e l'audio
npm run sim            # percentuali di vittoria di tutte le coppie, per il bilanciamento
```

La prima volta, per i test end-to-end serve anche `npx playwright install chromium`.

## Note

- I progressi della storia e il libretto sono salvati nel `localStorage` del browser, quindi sono legati alla pagina e al browser in cui giochi. Le chiavi sono le stesse della versione in un file solo: i vecchi salvataggi restano validi se apri la nuova pagina dallo stesso indirizzo.
- Struttura del progetto, convenzioni e dove si trova ogni parte del gioco: [CLAUDE.md](CLAUDE.md).
- La mappa di Formia è generata da dati © OpenStreetMap contributors (ODbL 1.0): vedi `tools/formia/`.

## Prossimi passi

Le richieste ancora da fare e le idee per le prossime sessioni sono in [PROSSIMI-PASSI.md](PROSSIMI-PASSI.md); com'è fatto il gioco è in [CLAUDE.md](CLAUDE.md).
