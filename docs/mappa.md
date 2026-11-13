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

## Le cortine, la Torre di Mola, il parco chiuso (12 novembre 2026)

Dalle foto di Antonio di via Abate Tosti e di Largo Paone: in centro e a Mola le strade sono corridoi tra palazzi alti, non casette sparse.

- **`ROWS` in `network.ts`:** file di impronte con la facciata sul lato basso. Il generatore le taglia in palazzi larghi 2–4 caselle, attaccati, intorno ai luoghi che ci stanno già (Morgana, il barbiere, il tabacchi, Telaro, il bar, casa di Forchetta: `kind: 'cortina'` con `look`), mai due intonaci uguali vicini. `up` è quanto il palazzo sale sopra l'impronta, in caselle: una fila che dà le spalle a un vicolo lo tiene basso, così il vicolo resta visibile; `shops` è la quota di botteghe al piano terra. Le botteghe senza negozio dicono che è chiuso; i negozi di `SHOPS` in `formia.ts` prendono la bottega più vicina.
- **Disegno:** `render/canvas/cortina.ts` (`cortina`, `castello`, `anchor`). Tetto visto dall'alto, cornicione, piani di portefinestre con persiane e balconi di ferro (fiori, panni stesi), piano terra ad archi con portone, serrande, vetrine e tende; il palazzo alto di Largo Paone (`look: 'alto'`) ha balconi continui e tredici piani. Tre colori d'intonaco nuovi: `--m-wall-f/g/h`.
- **Via Abate Tosti:** vicolo largo una casella, lastricato (`v`), da Largo Paone alla piazzetta dell'Ancora sotto la Torre di Mola (`ANCHOR`, `BENCHES`). La torre è il luogo `torre-mola`, `kind: 'castello'`, 4×3 caselle e 5 di altezza: non è più uguale a quella di Maranola (`tower`).
- **Largo Paone:** piazza di 14×4 caselle con due aiuole (`BEDS`) e i pini sul lungomare (`PINES`); la rientranza di mare accanto è riempita da una banchina (`QUAYS`). `KEEP_OPEN` tiene vuoto il retro del palazzo alto.
- **Parco la Fontana chiuso:** `FENCES` (ringhiera `|`), `GATES` (cancelli chiusi `+`, che si leggono), `CLOSED` (dentro, i controlli di raggiungibilità non valgono). Si entra solo dalla porta sul retro di casa di Antonio: lo spot `porta-parco` è un warp verso `casa` (porta `D` sul muro destro del salotto) e torna nel parco. La vicina ora sta sul marciapiede di via Amendola, davanti al giardino.
- **Salvataggi:** `formia9` riporta a casa solo chi era su una casella dove ora c'è un palazzo, una ringhiera, un albero o l'ancora.
- **Misure dopo:** 8 schermate vuote su 85, 10% di caselle deserte, 217 case.

## Largo Paone, Mola e piazza Risorgimento come sono (12 novembre 2026, seconda revisione)

Dalle indicazioni di Antonio, dai dati OSM/Overpass (`/ref/poi` del lavoro: Zanzibar, Altieri, Farmacia S. Anna, Telaro, Morgana, le Cinque Cannelle, i due parcheggi, la chiesa, le scuole, l'ospedale), dalla ricognizione di Codex «astra» (le posizioni relative erano buone) e da Street View per l'atmosfera.

- **La sequenza:** via Vitruvio → rotonda di Largo Paone (`Largo Domenico Paone`, anello 4×4) → la strada del Largo lungo l'enorme parcheggio (`fill: 'parking'`: corsie `!`, stalli `$`, auto parcheggiate `-`, colori a caso) dove il giovedì c'è il mercato → il porto con i traghetti (biglietteria, Bar del Porto, Zi' Anna Mare). Il marciapiede largo davanti alla fila di Zanzibar, Tabacchi Altieri e Farmacia S. Anna separa i negozi dal parcheggio; le Cinque Cannelle (`cannelle`) e piazza Tommaso Testa sono all'angolo. Il palazzo altissimo (`palazzo-alto`) è a ovest della rotonda, a sinistra del tabacchi guardando i negozi.
- **Telaro** è su via Tullia (x 132), perpendicolare a via Vitruvio e a via Abate Tosti: da via Abate Tosti si gira a destra, c'è Telaro e si sale verso Largo Paone.
- **Via Abate Tosti** è il vicolo `v` a y 65: a nord Telaro, il bar, Barber May, casa di Forchetta; a sud Morgana accanto alla pescheria (lato mare, `up` basso: si vede il tetto dal vicolo, la facciata sulla Pinetina). La Pinetina (`fill: 'pinetina'`) è il parcheggio sotto i pini.
- **La Torre di Mola sta sul porticciolo interno:** `DARSENA` in `network.ts` (x 148–150, y 59–79) è acqua, il lungomare le passa sopra sul ponticello; lungo le due banchine i gozzi (`9`, `gozzo`, colori a caso). Davanti alla torre le mura del castello (`castello-mura`, `castlewall`: merli, portale di conci con lo stemma, la lanterna, il cortile con l'ulivo e il pozzo).
- **Mola alta:** via Emanuele Filiberto sale dalla rotonda, passa San Giovanni (ora con canonica bianca a loggia, timpano e campanile; `collegiata`), via Solaro con la Vitruvio Pollione e il Castellum Aquae, la De Amicis (`school` con `look: 'deamicis'`: anni Trenta, ocra, portale e balcone con le bandiere) di fronte a piazza Risorgimento. Da lì via Ferrucci sale lungo il lato ovest dell'ospedale Dono Svizzero (OSM: lo costeggia a ovest e poi gli gira sopra; uscendo dall'ospedale verso via Appia è a destra), che ora è un blocco anni Settanta con piano terra in mattoni, finestre a nastro, pronto soccorso con pensilina e ambulanza.
- **Da Street View:** le luminarie a zigzag sopra via Abate Tosti (`festoons` nella mappa, oggetto `festoon`: dai primi piani di Telaro, del bar e di Barber May ai tetti di Morgana e della pescheria; ci si passa sotto, di notte le lampadine si accendono) e tre motorini parcheggiati sul bordo del marciapiede largo di Largo Paone (`SCOOTERS` in `network.ts`, carattere `;`, colori a caso).
- **Visto attraverso:** quello che è alto e sta davanti ad Antonio (la torre, un palazzo) non lo nasconde: lui e la sua creatura vengono ridisegnati sopra in trasparenza (`drawSorted` in `world-view.ts`).
- **Salvataggi:** `formia10` riporta a casa chi era sotto un palazzo, un'auto o una barca; il motorino parcheggiato dove ora c'è un'auto torna al suo posto.

## San Giulio, le targhe delle vie, il mare aperto (13 novembre 2026)

- **San Giulio** (area propria fra Ferrucci e via Verdi, sopra l'Appia): in via Palazzo la scuola Mattej (`scuola-mattej`, a nord), e di fronte, a sud, il parchetto con alberi, altalene e scivolo (`parchetto-mattej`, oggetti `swings` e `slide`) e la palazzina di Claudia (`casa-claudia`). Indicazione di Antonio: fra il CONI e piazza Risorgimento, su una via interna.
- **Case degli amici:** sopra la casa c'è «Casa di …», non più il nome della via. Il nome della via è su una targa all'angolo, larga tre caselle e leggibile (`streetPlate` in `render/canvas/objects.ts`): via Palazzo, via Adalgiso Ferrucci, via Solaro, piazza Pasquale Mattei, oltre a quelle che c'erano (via Abate Tosti, via Amendola…). Per Zendavid a Scauri non c'è targa: la via non è stata detta.
- **Mare aperto:** le caselle di mare sono raggiungibili a nuoto o in SUP; boe, bottiglie e tre allenatori al largo sono punti `on: 'sea'`, esclusi dai controlli di raggiungibilità a piedi.

## I covi e il parco grande (13 novembre 2026)

- **Covi** (`kind: 'covo'`, `look` = custode, in `formia-places.ts`): le case di Valentin (4×3), Claudia (5×4, alto 5 caselle) e Andrea (4×3) al posto delle vecchie, il Palazzo del Popolo (6×3) in mezzo a piazza della Vittoria (un covo può stare su una piazza), il Tempio del Basso (5×2) all'incrocio dei sentieri della pineta, i tennis coperti, la Cupola (5×4) nel parco. Le porte portano agli interni `covo-*` (o a `circolo`), a casa per il custode.
- **Parco la Fontana** va fino alla ferrovia (x 220–240, y 31–45): quattro palazzine, il giardino rotondo 10×7 con la fontana al centro e la cupola di Antonio accanto, a est. Via Palazzo finisce a via Amendola, via Stendhal è tolta. `HEDGES` in `network.ts`: le siepi tengono chiusi giardino e cupola dal lato della porta sul retro; si scende lungo la palazzina, si va lungo la ringhiera e si risale in fondo.
- **Il furgone di Nicola** evita la corsia accanto al mare (`shoreCost` in `story/van.ts`) e dove non può viene disegnato spostato sulla strada (`shoreShift`): a Mola non sta più sulla darsena.
- **Salvataggi:** `formia11` riporta a casa chi era sotto un covo o una siepe, fa uscire dal vecchio circolo e lascia le chiavi del Liberty a chi l'aveva già guidato.

## Rilievo

La mappa ha gradoni sugli Aurunci, all'Acervara e a Gianola, muraglione dell'Appia, la salita di via Solaro, tre sentieri, cinque salti verso sud e quattro belvedere registrati nel diario. I fianchi sono caselle solide; una quota numerica per casella non è implementata. Castellone richiede ancora un intervento specifico per diventare visibilmente più alto dell'Appia.

Nel generatore `TERRACES` definisce le terrazze, `SCARPS` i fianchi, `TRAILS` i sentieri, `LEDGES` i salti e `WILD` la chiusura della campagna lontana dai passaggi. `route` in `story/maps.ts` usa i salti solo nel verso consentito. `story/movement.ts` gestisce il salto; le scale funzionano nei due versi. I belvedere sono cartelli con `view`.

Il disegno è in `render/canvas/ground.ts` e `objects.ts`: texture continue, contorni arrotondati, facciate determinate da semi, fianchi e ombre al piede. I colori della mappa vengono dai token `--m-*`. Gli omini riconoscibili usano `person` per gli amici e `look` per gli altri aspetti specifici.

## Luce e vita

`render/atmosphere.ts` disegna ombre dal sole, nuvole, luce sui volumi, vento, mare, piccioni, farfalle, lucciole e falchi. `world-view.ts` gestisce camera, cache, notte e piccoli movimenti delle persone. Gli effetti puramente visivi non leggono la storia, non consumano l'RNG della lotta, si fermano con movimento ridotto e si spengono in Grafica Bassa.

`story/daytime.ts` calcola sole e buio dall'ora reale o dalla scelta del menu. La preferenza usa `lotte-tra-amici:ora:v1`. Le finestre e i lampioni si accendono di notte. Prima di ottimizzare misurare con `npm run perf`: gli ultimi controlli sul Mac erano sotto il tetto di 8 ms per fotogramma a 1440×900; i browser senza accelerazione possono essere molto più lenti.

## Controlli

`tools/formia/audit.ts`: rete stradale, ferrovia, vicoli e percorsi. `drift.ts`: spostamenti dei luoghi. `density.ts`: distanza dalle attività e schermate vuote. `show.ts x0 x1 y0 y1`: dettaglio della mappa.

Test pertinenti: `maps.test.ts`, `relief.test.ts`, `density.test.ts`, `place.test.ts` e golden del canvas. Cambiando coordinate salvate aggiungere una migrazione; non riutilizzare `formia10` per un layout nuovo. Le mappe con enigmi hanno un validatore in `story/place.ts`.

## Riferimenti

`design/mappa/riferimenti/` conserva due viste satellitari (via Amendola e lo Zauli) per il confronto a occhio. La proposta geografica di Codex dell'11 novembre è stata sostituita dalla Formia grande e tolta: ne restano fonti e coordinate in `fonti-formia.md`.
