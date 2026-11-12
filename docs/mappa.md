# Mappa di Formia

## Dati e generazione

- `tools/formia/osm-extract.json`: dati geografici di base; attribuzione e fatti locali in `fonti-formia.md`.
- `src/data/maps/formia-projection.ts`: trasformazione delle coordinate reali in caselle.
- `src/data/maps/formia-places.ts`: luoghi, coordinate e punti di interesse.
- `tools/formia/network.ts`: rete giocabile, sentieri, rilievi e aree selvatiche.
- `tools/formia/build.ts`: generatore; produce `src/data/maps/formia-ground.ts`.
- `src/data/maps/formia.ts`: persone, cartelli, edifici interattivi, quartieri e collegamenti. Gli interni sono file separati registrati in `maps/index.ts`.

Non correggere a mano il file generato. Modificare l'origine, eseguire `npx tsx tools/formia/build.ts` e risolvere `NOT PLACED` e `PROBLEMS`. Le porte e i warp devono lasciare il giocatore su caselle libere e consentire di uscire.

## La Formia grande (12 novembre 2026)

La mappa è 320×128 caselle (`W`, `H`, `X_ANCHORS` in `formia-projection.ts`), disegnata a mano sopra le strade vere di OpenStreetMap. Formia va da sud-ovest a nord-est: ogni diagonale è una scala di tratti lunghi e dritti, buoni da fare in motorino. Ogni linea di `network.ts` porta il nome della via vera.

- **Tutto ciò che ha coordinate sta in `network.ts`**, non nel generatore: `STREETS`, `RAILS` (due pezzi e la galleria, `TUNNEL_ENDS`), `PATHS`, `TRAILS`, `TERRACES`, `SCARPS`, `LEDGES`, `MACERE`, `WILD`, `HILLS`, `QUAYS` (banchine del porto e di Mola), `SEAS` (i semi del mare: il secondo allaga la baia di Scauri), `TOWN` (dove nascono le case; `far` per quelle lontane dalla strada), `BORGO`, `WALLS`, `MARANOLA`.
- **Luoghi** in `formia-places.ts` con `tile` fisso. Riempimenti speciali: `track` (la pista dello Zauli, sei corsie, ci si cammina sopra), `court`, `round` (il giardino rotondo di Parco la Fontana).
- **Posti nuovi:** le palazzine di via Amendola con casa di Antonio al piano terra, lo Zauli con tribuna e tennis, San Giovanni in mattoni e la sua piazza, via Solaro oltre la salita, Largo Paone con il Tabacchi Altieri e Telaro, Barber May, piazza Risorgimento, via Ferrucci, l'ospedale, via Abate Tosti, la Rotabile fino a Maranola, l'eremo di San Michele, i lungomare di Vindicio e di Gianola, Scauri. Interni di tabacchi e barbiere in `data/maps/botteghe.ts`; le case degli amici hanno ognuna la sua pianta in `homes.ts`.
- **Misure** (`density.ts`): 8 schermate vuote su 85, ai bordi; 10% di caselle deserte; 216 case; quattro belvedere. `density.test.ts` le tiene come tetto.
- **Salvataggi:** `formia8` riporta a casa chi era sulla mappa di prima.

## Rilievo

La mappa ha gradoni sugli Aurunci, all'Acervara e a Gianola, muraglione dell'Appia, la salita di via Solaro, tre sentieri, cinque salti verso sud e quattro belvedere registrati nel diario. I fianchi sono caselle solide; una quota numerica per casella non è implementata. Castellone richiede ancora un intervento specifico per diventare visibilmente più alto dell'Appia.

Nel generatore `TERRACES` definisce le terrazze, `SCARPS` i fianchi, `TRAILS` i sentieri, `LEDGES` i salti e `WILD` la chiusura della campagna lontana dai passaggi. `route` in `story/maps.ts` usa i salti solo nel verso consentito. `story/movement.ts` gestisce il salto; le scale funzionano nei due versi. I belvedere sono cartelli con `view`.

Il disegno è in `render/canvas/ground.ts` e `objects.ts`: texture continue, contorni arrotondati, facciate determinate da semi, fianchi e ombre al piede. I colori della mappa vengono dai token `--m-*`. Gli omini riconoscibili usano `person` per gli amici e `look` per gli altri aspetti specifici.

## Luce e vita

`render/atmosphere.ts` disegna ombre dal sole, nuvole, luce sui volumi, vento, mare, piccioni, farfalle, lucciole e falchi. `world-view.ts` gestisce camera, cache, notte e piccoli movimenti delle persone. Gli effetti puramente visivi non leggono la storia, non consumano l'RNG della lotta, si fermano con movimento ridotto e si spengono in Grafica Bassa.

`story/daytime.ts` calcola sole e buio dall'ora reale o dalla scelta del menu. La preferenza usa `lotte-tra-amici:ora:v1`. Le finestre e i lampioni si accendono di notte. Prima di ottimizzare misurare con `npm run perf`: gli ultimi controlli sul Mac erano sotto il tetto di 8 ms per fotogramma a 1440×900; i browser senza accelerazione possono essere molto più lenti.

## Controlli

`tools/formia/audit.ts`: rete stradale, ferrovia, vicoli e percorsi. `drift.ts`: spostamenti dei luoghi. `density.ts`: distanza dalle attività e schermate vuote. `show.ts x0 x1 y0 y1`: dettaglio della mappa.

Test pertinenti: `maps.test.ts`, `relief.test.ts`, `density.test.ts`, `place.test.ts` e golden del canvas. Cambiando coordinate salvate aggiungere una migrazione; non riutilizzare `formia8` per un layout nuovo. Le mappe con enigmi hanno un validatore in `story/place.ts`.

## Riferimenti

`design/mappa/riferimenti/` conserva due viste satellitari (via Amendola e lo Zauli) per il confronto a occhio. La proposta geografica di Codex dell'11 novembre è stata sostituita dalla Formia grande e tolta: ne restano fonti e coordinate in `fonti-formia.md`.
