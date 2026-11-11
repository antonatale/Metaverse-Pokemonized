# La mappa di Formia

> Spostato intero da `CLAUDE.md` il 10 novembre 2026 (task R1 di `REVISIONE.md`). Dove una frase è superata dal codice di oggi c'è una nota **Oggi:**.

## La mappa di Formia

- **È Formia vera, resa giocabile:** costa, spiagge, pinete e parchi vengono da OpenStreetMap; strade e ferrovia sono disegnate a mano sul modello di quelle vere (l'Appia, via Vitruvio, il lungomare, via Amendola); i luoghi stanno vicino a dove sono davvero, con la porta su una strada. Antonio è il protagonista (**Oggi:** se ne gioca uno dei sei, e si parte da casa sua: vedi `protagonisti.md`): si parte da casa sua, Parco la Fontana in via Giovanni Amendola 1, e i posti dove va con gli amici (l'Eclipse beach di Nicola Spadea a Vindicio, la pineta di Vindicio, la Birreria Morgana a Mola) hanno persone e attività. Il resto della città fa da contorno.
- **Come è fatta:** è una mappa da gioco disegnata sulla geografia vera.
  - **Dati veri, da OpenStreetMap:** costa, spiagge, pineta, parchi e colline vengono da `tools/formia/osm-extract.json` (© OpenStreetMap contributors, ODbL), proiettati con `formia-projection.ts`. La costa è lisciata: niente moli sottili, isolette o insenature di una casella.
  - **Scheletro giocabile, a mano:** ferrovia e strade sono in `tools/formia/network.ts`, come elenchi di angoli in caselle, e corrono dritte da un angolo all'altro. La ferrovia è una sola linea, dalla galleria nella collina a ovest al bordo est, passando davanti alla stazione; dove una strada la incrocia c'è un passaggio a livello. Le strade (Appia, lungomare, via Vitruvio, le vie dei quartieri, via Amendola…) si toccano in caselle comuni, quindi sono un'unica rete senza vicoli ciechi. I sentieri della pineta sono `PATHS`.
  - **I luoghi vengono dopo le strade:** ognuno di `formia-places.ts` va sulla casella libera più vicina alla posizione vera da cui la sua porta dà su una strada (o, se non c'è, su un vialetto di pochi passi). Quelli del centro hanno `tile`, una casella scelta a mano, perché stazione, Comune, piazza, bar e Morgana sono composti insieme alle strade.
  - **Poi il resto:** persone e cose accanto ai loro posti (mai su un edificio, su un vialetto, dietro un tetto, o in un angolo da cui chiuderebbero un altro); le case di contorno lungo le vie; i marciapiedi del centro; gli ulivi in campagna, in file con lo spazio per passare.
  - **Per ultimi i lampioni:** lungo le strade della città, sul marciapiede o sul bordo erboso (`K` erba, `L` pietra, `Y` lastricato), un lato e l'altro a turno. Mai davanti a una porta o accanto a qualcuno, e ognuno viene tolto se taglia fuori anche una sola casella raggiungibile da casa.

  Tutto finisce in `formia-ground.ts`.
- **Per cambiarla:**
  - **Strade e ferrovia:** in `tools/formia/network.ts`. Lì ci sono anche gradoni, fianchi, sentieri, salti e zone di selvatico (vedi «Formia a tre piani»). `npx tsx tools/formia/build.ts --base` stampa costa e verde con le coordinate, per disegnarci sopra.
  - **Luoghi e spot** (persone, cartelli, oggetti, motorini): in `formia-places.ts`.
  - **Ritocchi a mano sul terreno:** in `tools/formia/paint.ts`.
  - **Poi:** `npx tsx tools/formia/build.ts`, che stampa `NOT PLACED` e `PROBLEMS` se un luogo non trova posto o una strada finisce in mare.
  - **Per controllare:**
    - `npx tsx tools/formia/audit.ts`: strade in un pezzo, vicoli ciechi, binari interrotti, quanto si cammina da casa a ogni posto;
    - `npx tsx tools/formia/show.ts x0 x1 y0 y1`: un pezzo di mappa;
    - `npx tsx tools/formia/drift.ts`: di quanto si è spostato ogni luogo;
    - `npx tsx tools/formia/density.ts`: quante cose da fare ci sono in ogni schermata e quanto della mappa è deserto (V3 di `VISIONE.md`); `tests/unit/density.test.ts` tiene i numeri di oggi come tetto;
    - `npm test`: controlla anche che strade e ferrovia restino continue (`tools/formia/playable.ts`). Poi `npm run golden`, perché il disegno cambia.
- **Scala:** circa 33 m per casella in centro, di più nei tratti in mezzo; le spiagge di Vindicio e Gianola sono allargate di qualche casella verso il mare, sennò a questa scala sarebbero strisce.
- **Salvataggi:** chi aveva una partita sulle mappe di prima riparte da casa (`seen.formia6`, l'ultima volta che le caselle sono cambiate), con spille, compagnia e oggetti ritrovati. Se rigeneri la mappa e le posizioni cambiano molto, aggiungi un nuovo `formiaN` in `save/story-progress.ts`.

## Com'è disegnata Formia

- **Il terreno** (`render/canvas/ground.ts`): prima i colori di tutte le caselle, poi le texture, poi i contorni a penna. Non si vede più la griglia delle caselle:
  - le texture sono ritagliate sulla loro casella (non sbordano su un terreno diverso), ma le macchie d'erba appartengono a una casella e le disegnano anche le vicine dello stesso terreno, e le increspature della sabbia e le lastre di pietra sono disposte sulla mappa intera, quindi passano da una casella all'altra senza tagli;
  - erba con macchie più scure, ciuffi e qualche fiore; sabbia con le increspature del vento; mare con le onde, l'acqua più chiara vicino alla riva, la schiuma lungo le spiagge e qualche riflesso di sole; piazze di lastre sfalsate; sampietrini un po' storti;
  - i contorni arrotondano gli angoli: dove una casella sporge dalle tre intorno, l'angolo passa al terreno delle altre e la linea curva, così coste, spiagge e piazze sono forme e non scalini. Ferrovia, muri, pavimenti, pontili e mura poligonali restano squadrati. Ogni vertice disegna metà dei lati che ci arrivano, così i pezzi della mappa disegnati separatamente combaciano.
- **Case di contorno:** ognuna ha un seme `v` (in `formia-ground.ts`) da cui `render/canvas/objects.ts` (`facade`) sceglie:
  - la facciata: crema, giallo, rosa, pesca o azzurro;
  - le persiane: verdi o marroni;
  - il tetto: a falde, con il comignolo, oppure un terrazzo con piante o il serbatoio;
  - le fioriere e le tende a strisce sui balconi delle palazzine.

  I colori sono token `--m-wall-*`, `--m-shutter-*`, `--m-tent-*`.
- **Posti importanti, riconoscibili:**
  - casa (Parco la Fontana, palazzina gialla con le tende), con il giardino e la fontana: la siepe lo separa dall'Appia;
  - quasi di fronte, dall'altra parte dell'Appia e un po' verso il centro, il Villaggio Don Bosco: la chiesa con la vetrata, la canonica e il campanile, l'oratorio, il campo (`parish`);
  - in piazza San Giovanni, a Mola, la chiesa dei Santi Lorenzo e Giovanni Battista, con la facciata a due ordini, le nicchie, il campanile con l'orologio (`collegiata`); di fronte la scuola Vitruvio Pollione con le bandiere (`school`); accanto, gli archi dell'acquedotto romano (`aqueduct`);
  - la Gelateria Lavezzi in piazza Marconi, accanto al Comune: insegna verde e oro «dal 1870», tenda a strisce, vetrina con le vaschette, il cono (`gelateria`);
  - il Bruno Zauli con la pista d'atletica;
  - il Palamendola con il tetto a volta;
  - la stazione con il treno fermo;
  - la piazza con il monumento e il comizio;
  - il porto con il traghetto, le barche e il faro sul molo;
  - Morgana con le lucine;
  - l'Eclipse: ombrelloni con i lettini, gazebo, beach volley, le tavole da windsurf di Nicola sulla riva, i windsurf che scivolano nella baia e la fila di boe.
- **Pineta di Vindicio:** è dove sta davvero, accanto al Lido Frungillo all'inizio di via Tito Scipione. Venendo da Gaeta si trovano La Scogliera, poi l'Eclipse, poi la pineta, poi il centro. È un'area `pines` di `formia-places.ts`, con i due sentieri di `PATHS`.
- **Persone con un aspetto loro:** gli amici hanno `person`; chi è qualcuno senza essere nella compagnia ha `look`, come Nicola Spadea (`LOOKS` in `walkers.ts`).
- **Antonio sulla mappa** è stilizzato come gli altri omini, ma con i suoi tratti: i ricci grandi (`bigcurls`, una nuvola di riccioli con un solo contorno, `cloud` in `walkers.ts`), la felpa blu con i lacci, la catenina e l'orecchino d'oro, le sopracciglia folte e il sorriso storto (`chain`, `earring`, `brows`, `smirk` su `PersonLook`). Non è il ritratto delle lotte: è la sua versione da mappa.

## La luce e la vita (11 novembre 2026, V1 di `VISIONE.md`)

Tutto in `render/atmosphere.ts`, chiamato da `drawFrame` in `render/world-view.ts`, all'aperto e con Grafica: Alta (`ui/gfx.ts`, menu Mappa, chiave `lotte-tra-amici:grafica:v1`). Non legge la storia e niente la legge: disegna soltanto.

- **Il sole** (`sunAt` in `story/daytime.ts`): dall'ora vera (o da quella del menu) dice dove cade un'ombra per ogni pixel di altezza e quanto è forte la luce. Ombre lunghe verso ovest la mattina, corte a mezzogiorno, lunghe verso est la sera; di notte niente. Cadono sempre un po' verso chi guarda.
- **Le ombre** (`shade`): un foglio a un terzo della risoluzione, steso sotto le persone. Gli edifici e le cose larghe sono blocchi (l'impronta, spostata di quanto sono alti: `box` su `SceneItem`); alberi, lampioni, cartelli, persone, creature e oggetti persi sono il loro disegno sdraiato dal piede (`casters`). Chi galleggia e i fantasmi non fanno ombra. Sullo stesso foglio passano le ombre delle nuvole (`cloudSheet`, una tavola che si ripete).
- **La luce sui volumi** (`volume`): su ogni disegno di `sceneItems`, una volta sola, un po' di `--m-sunlit` in alto e di `--m-shade` al piede. Le finestre accese di notte si trovano dal colore del vetro, quindi sul disegno com'era prima: ogni edificio tiene `flat`, che lo ridisegna (`glowOf`).
- **Il vento** (`wind`, `SWAY`): alberi, ulivi, pini, palme e cipressi si piegano dal piede, a raffiche che attraversano la città; l'ombra li segue (`lean`).
- **Il mare** (`seaLife`): lungo ogni spiaggia un'onda dopo l'altra sale e torna indietro; il sole luccica qua e là (meno di notte).
- **La vita:** i piccioni delle piazze (`pigeons`: sulle caselle `paving` e, più rari, `stone`) volano via quando chi gioca arriva a meno di due caselle e tornano quando si è allontanato; le farfalle sull'erba di giorno (`butterflies`); le lucciole sull'erba e nell'erba alta di notte, disegnate sopra il buio (`fireflies`).
- **Gli omini:** un saltello a ogni passo (`stepHop`) e il respiro di chi sta fermo (`breath` su `Drawn`), senza toccare i disegni di `walkers.ts`.
- **La cornice:** un foglio della pagina sopra il canvas (`.wframe` in `styles/story.css`), più scuro verso i bordi.
- **Il titolo** (`preview`): le ombre di un pomeriggio di sole.
- **Regole:** niente `Math.random` (posizioni e tempi vengono da `hash` e dal tempo del fotogramma); con «riduci il movimento» tutto resta fermo; con Bassa non si disegna niente di questo. I colori sono token: `--m-shade`, `--m-sunlit`, `--m-glint`, `--m-firefly`.
- **Quanto costa:** nel contenitore, senza scheda grafica, a 1440×900: Bassa 2,9 ms a fotogramma, Alta 10,5 ms; a 1920×1080: 4,0 e 15,6. Sul Mac è da misurare (R20, V1).

## Formia a tre piani (11 novembre 2026, V3 e V4 di `VISIONE.md`)

La terra sale verso nord, dal mare agli Aurunci: quindi il fianco di ogni gradone guarda a sud, verso chi gioca. Tutto è nel generatore (`tools/formia/network.ts` e il passo 12c di `build.ts`); nessun posto di prima è stato spostato.

- **I caratteri nuovi** (`data/maps/legend.ts`): `^` il fianco di roccia di un gradone, `[` un muraglione di blocchi, `j` il punto dove si salta giù, `a` una macera (il muretto a secco degli uliveti). Sono tutti solidi. Le scale sono `H`, che c'era già.
- **I gradoni** (`TERRACES`): terreno aperto che resta com'è, senza case e senza selvatico sopra. Sono quattro: i due degli Aurunci, quello dell'Acervara, le terrazze della villa sulla punta di Gianola.
- **I fianchi** (`SCARPS`): una riga di caselle. Dove la attraversa una strada, la strada sale; dove la attraversa un sentiero, ci sono le scale; sotto i fianchi di roccia resta una striscia libera, così un palazzo non li copre. C'è anche il muraglione dell'Appia, che corre sopra Vindicio e la pineta.
- **I sentieri** (`TRAILS`): la Strada della Statua su per gli Aurunci, il sentiero dell'Acervara dall'Appia alla Tomba di Tulliola, il sentiero di Gianola fino alla punta, giù per la Grotta della Janara (che è una scala).
- **I salti** (`LEDGES`): cinque. Si scende camminando verso sud sopra un `j`: un salto di due caselle (`tryStep` in `story/movement.ts`, `JUMP`, `Mover.jump`); non si risale. Il clic sulla mappa li usa (`route` in `story/maps.ts`). Per ogni altra cosa un `j` è un muro.
- **Il selvatico** (`WILD`): dentro le zone, il terreno aperto a più di `keep` caselle da qualsiasi cosa si percorra apposta (strade, sentieri, pietra, sabbia, erba alta, edifici con il loro spazio, persone e cartelli) si chiude: montagna (`hill`), collina boscosa (`wood`), uliveti dietro le loro macere (`grove`). Così gli Aurunci scendono fino alla ferrovia a est e fino a via Penitro al centro.
- **I belvedere:** un cartello con `view` (`data/maps/types.ts`), disegnato come un cannocchiale (`viewer` in `render/canvas/objects.ts`). Letto, la camera sale come per le creature con le ali (`lookOut` in `ui/story-screen.ts`), e la prima volta la veduta va nel Diario (`st.seen['veduta-…']`, «Vedute · n su 3»). Sono tre: Aurunci, Acervara, punta di Gianola.
- **Com'è disegnato** (`relief` in `render/canvas/ground.ts`, dopo i contorni): il fianco di un gradone (`scarp`: il terreno di sopra arriva fino al bordo, poi roccia a strati o blocchi di pietra; il bordo si abbassa dove c'è un salto, con due freccette); il fianco di roccia di ogni collina che finisce su terreno più basso (`hillFace`); un filo d'ombra al piede (`footShade`). Le montagne schiariscono con la quota (`hillDepth`: quante righe mancano al piede, guardando a sud a ventaglio) e hanno due creste. Sopra le montagne girano i falchi (`hawks` in `render/atmosphere.ts`); dove si atterra da un salto, la polvere (`landing`).
- **Chi c'è:** due allenatori per sentiero più una prima sfida facile in via Gianola (`data/trainers.ts`: bagnante, archeologa, polparo, ciclista, contadino, pastore, escursionista), l'erba della macchia di Gianola (`macchia` in `data/encounters.ts`), una terza macchia di pozze nella cala, nove cartelli con fatti verificati (`docs/fonti-formia.md`), e cinque persone lungo via Penitro, via Gianola e la strada per Scauri. Il ragazzo con lo zaino spiega i salti.
- **Controlli:** il generatore dice in `PROBLEMS` se una persona, un cartello o una porta non si raggiungono più a piedi da casa (le scale nei due versi, i salti solo in giù), o se un salto non ha terreno sopra e sotto. `tests/unit/relief.test.ts`: ogni fianco è continuo, ogni salto si scende in un passo e non si risale, i tre belvedere si raggiungono.
- **Salvataggi:** `formia7` in `MIGRATIONS`: chi era sulla mappa di prima riparte da casa sua.
- **Le misure** (`npx tsx tools/formia/density.ts`): schermate dove si cammina senza niente da fare, da 28 su 56 a 8 su 47; caselle percorribili a più di dieci passi da qualcosa, dal 50% al 17% (da 4151 a 936). Le otto rimaste sono strisce di strada e di spiaggia ai bordi: l'Appia a ovest, via Vindicio, le spiagge a est.

## I quartieri

Ogni quartiere ha il suo aspetto, le sue persone e una nota che compare quando Antonio ci entra (`note` sulle aree di `formia.ts`; il messaggio è `neighbourhood` in `ui/story-screen.ts`).

- **Castellone**, il borgo alto:
  - è tutto lastricato, con i vicoli di sampietrini e le case antiche di pietra (`borgo`);
  - lungo il bordo corrono le mura poligonali;
  - ci sono la torre ottagonale dei Caetani, Sant'Erasmo e la cavea del teatro romano;
  - c'è l'ingresso del Cisternone;
  - ci abitano la signora del teatro e la devota di Sant'Erasmo.
- **Centro:** via Vitruvio con i negozi sul lato nord, il Comune con il Museo archeologico (c'è la guida), la piazza con il monumento ai caduti e la stazione con il treno.
- **Mola**, il borgo marinaro: case colorate dei pescatori, reti stese sulle banchine, barche, la torre angioina, Morgana. Più su, piazza San Giovanni: la chiesa dei Santi Lorenzo e Giovanni Battista, di fronte la scuola Vitruvio Pollione (c'è uno studente), accanto l'acquedotto romano.
- **Porto:** traghetto, biglietteria Laziomar, faro sul molo.
- **Vindicio:** villette con la bouganville, i lidi, la pineta, la Tomba di Cicerone sull'Appia.
- **Via Amendola, Acqualonga, Santo Janni:** palazzine, il Bruno Zauli con la pista, il Palamendola. Via Acqualonga corre sotto la ferrovia; giù fino all'Appia scendono via Gramsci, via Amendola (casa di Antonio, con il giardino) e via Santo Janni.
- **Villaggio Don Bosco:** dall'Appia scende via San Giovanni Bosco; la chiesa, l'oratorio e il campo, con l'animatore.
- **Gianola:** il parco, la villa di Mamurra e le vasche del porticciolo romano in mare.
- **Monti Aurunci:** in cima si vede Maranola.
- **Targhe:** le vie principali hanno la targa con il nome vero e una frase. I nomi delle strade di `network.ts` sono quelli reali, confrontati con le posizioni di OpenStreetMap.
