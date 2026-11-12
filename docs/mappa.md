# Mappa di Formia

## Dati e generazione

- `tools/formia/osm-extract.json`: dati geografici di base; attribuzione e fatti locali in `fonti-formia.md`.
- `src/data/maps/formia-projection.ts`: trasformazione delle coordinate reali in caselle.
- `src/data/maps/formia-places.ts`: luoghi, coordinate e punti di interesse.
- `tools/formia/network.ts`: rete giocabile, sentieri, rilievi e aree selvatiche.
- `tools/formia/build.ts`: generatore; produce `src/data/maps/formia-ground.ts`.
- `src/data/maps/formia.ts`: persone, cartelli, edifici interattivi, quartieri e collegamenti. Gli interni sono file separati registrati in `maps/index.ts`.

Non correggere a mano il file generato. Modificare l'origine, eseguire `npx tsx tools/formia/build.ts` e risolvere `NOT PLACED` e `PROBLEMS`. Le porte e i warp devono lasciare il giocatore su caselle libere e consentire di uscire.

## Rilievo esistente

La mappa ha gradoni sugli Aurunci, all'Acervara e a Gianola, muraglione dell'Appia, tre sentieri, cinque salti verso sud e tre belvedere registrati nel diario. I fianchi sono caselle solide; una quota numerica per casella non è implementata. Castellone richiede ancora un intervento specifico per diventare visibilmente più alto dell'Appia.

Nel generatore `TERRACES` definisce le terrazze, `SCARPS` i fianchi, `TRAILS` i sentieri, `LEDGES` i salti e `WILD` la chiusura della campagna lontana dai passaggi. `route` in `story/maps.ts` usa i salti solo nel verso consentito. `story/movement.ts` gestisce il salto; le scale funzionano nei due versi. I belvedere sono cartelli con `view`.

Il disegno è in `render/canvas/ground.ts` e `objects.ts`: texture continue, contorni arrotondati, facciate determinate da semi, fianchi e ombre al piede. I colori della mappa vengono dai token `--m-*`. Gli omini riconoscibili usano `person` per gli amici e `look` per gli altri aspetti specifici.

## Luce e vita

`render/atmosphere.ts` disegna ombre dal sole, nuvole, luce sui volumi, vento, mare, piccioni, farfalle, lucciole e falchi. `world-view.ts` gestisce camera, cache, notte e piccoli movimenti delle persone. Gli effetti puramente visivi non leggono la storia, non consumano l'RNG della lotta, si fermano con movimento ridotto e si spengono in Grafica Bassa.

`story/daytime.ts` calcola sole e buio dall'ora reale o dalla scelta del menu. La preferenza usa `lotte-tra-amici:ora:v1`. Le finestre e i lampioni si accendono di notte. Prima di ottimizzare misurare con `npm run perf`: gli ultimi controlli sul Mac erano sotto il tetto di 8 ms per fotogramma a 1440×900; i browser senza accelerazione possono essere molto più lenti.

## Controlli

`tools/formia/audit.ts`: rete stradale, ferrovia, vicoli e percorsi. `drift.ts`: spostamenti dei luoghi. `density.ts`: distanza dalle attività e schermate vuote. `show.ts x0 x1 y0 y1`: dettaglio della mappa.

Test pertinenti: `maps.test.ts`, `relief.test.ts`, `density.test.ts`, `place.test.ts` e golden del canvas. Cambiando coordinate salvate aggiungere una migrazione; non riutilizzare `formia7` per un layout nuovo. Le mappe con enigmi hanno un validatore in `story/place.ts`.

## Proposta geografica separata

`design/mappa/` conserva una revisione geografica proveniente da un altro lavoro, con patch, file nuovi compressi e riferimenti visivi. Non è attiva e non è stata applicata durante questa pulizia. Prima di usarla confrontarla con il generatore attuale e con i rilievi già presenti; non sommare due rifacimenti incompatibili.
