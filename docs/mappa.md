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

## Il corridoio del furgone (13 novembre 2026)

- `VAN_ROADS` in `network.ts` riserva una fascia di tre caselle lungo l’Appia e il lungomare fino all’Eclipse, con bordi pavimentati e spazio per le svolte. Il generatore tiene fuori case di riempimento, persone, cartelli e lampioni; gli edifici fissi mantengono la loro impronta.
- `story/vehicle-space.ts` condivide fra disegno, percorso e sosta la posizione sulla carreggiata e l’ingombro del furgone. La centratura segue le corsie che continuano oltre gli incroci, senza spostamenti laterali a ogni traversa. Il percorso controlla tutto il mezzo, anche fra due caselle, contro edifici, ostacoli e Liberty; una fermata deve avere un accesso collegato al tragitto.
- `formia12` mette al sicuro i salvataggi se una casa di riempimento o un arredo spostato occupa la vecchia posizione. Misure: 208 case, 7 schermate vuote su 86, 9% di caselle deserte.

## La pineta grande, il lungomare di Vindicio, i porti aperti, più erba alta (13 novembre 2026, notte)

Richiesta di Antonio: pineta di Vindicio «molto più grande», lungomare più lungo con il Frungillo e il Bandiera, porto e traghetto con sbocco a mare, più erba alta.

- **Pineta:** `PINETA` in `network.ts` è la zona; il generatore (passo 7b di `build.ts`) mette un pino domestico in circa una casella su tre, mai due vicini (resta sempre un passaggio) e mai subito sotto un sentiero o il lungomare, più fiori e i lampioni del lungomare dal lato dei pini. Va dal Viale al lungomare e da Caposele alla fine della spiaggia, tagliata da via Vindicio (che scende dall'Appia fino all'Eclipse) e dai `PATHS` «Sentiero della pineta». Il Tempio del Basso è nel cuore della parte ovest, all'incrocio dei sentieri. Il luogo `pineta` è solo il suo «cuore» (cartello, persone); l'area «Pineta di Vindicio» copre tutta la zona ma non conta su sabbia, mare, pietra e strade (`not` nelle aree, `story/maps.ts`). La corsa con Zendavid sceglie bandierine sull'erba e entro 13 caselle.
- **Viale Unità d'Italia:** da Gaeta sale dritto lungo il bosco (x 26) e corre in cima alla pineta; il vecchio giro a y 108 è tolto. Le ville di Vindicio restano sopra l'Appia.
- **Lungomare:** `LUNGOMARE` in `network.ts`, una passeggiata di pietra larga due caselle a gradoni lungo la spiaggia, da Caposele alla Scogliera; sotto, tutto sabbia fino al mare (`WIDEN` di Vindicio ora 6). In fila da est: Lido Frungillo (via Tito Scipione 3), Lido Bandiera (7, con beach volley e pedalò), l'Eclipse (58), la Scogliera. Aree «Lido Frungillo», «Lido Bandiera», «Lungomare di Vindicio»; lo sfondo delle lotte è `vindicio`.
- **Porti:** `MOUTHS` in `network.ts`: il bacino del traghetto si apre a est fra i due moli, la darsena di Mola esce in mare sotto il ponte del lungomare.
- **Erba alta:** sette macchie nuove (`selv-erba-*` e `selv-pineta-3/4` in `formia-places.ts`, tavole già esistenti), Parco Gramsci più ampio: 538 caselle di erba alta invece di 366.
- **L'arrivo con Nicola** (14 novembre): la riva dell'Eclipse (`riva-eclipse`) è sull'ultima fila di sabbia davanti al lido, con Faro, la tavola vecchia e i windsurf in acqua subito sotto; il primo punto del giro in windsurf è in mare. `build.ts` segnala un problema se la riva non ha il mare subito sotto o se un punto di `WS_ROUTE` (`data/nicola.ts`) finisce sulla terra.
- **Salvataggi:** `formia13` riporta a casa chi era dove ora c'è un pino, un lido, un lampione; il motorino o il furgone lasciati lì tornano al loro posto.
- **Misure:** 192 case (prima 208: le ville tra il Viale e la spiaggia sono diventate pineta).

## Gianola com'è, la rotonda dei Carabinieri, le vedute (21 novembre 2026)

Dalle indicazioni di Antonio, dalla vista satellitare e da Street View (Google Maps) e da OpenStreetMap.

- **La costa di Gianola** (`CLIFFS`, `COVES`, `GROYNES` in `network.ts`): il lungomare Città di Ferrara è una spiaggia sola, tagliata dai pennelli di scogli (`R` in fila verso il largo) in mezzelune di sabbia; niente palme a caso (restano a Vindicio). Dalla foce del Rio Santa Croce il promontorio è scogliera: in acqua scogli `R`, a riva gli scogli su cui si cammina (`&`, terreno `rock`, disegnato in `ground.ts`; il motorino non ci va), poi la macchia (`WILD` `wood`). Restano due calette di sassi: quella sotto la villa, dove arriva il windsurf di Nicola (sentiero `Sentiero della caletta`), e la Spiaggia dei Sassolini in fondo alla baia di Scauri. Le pozze tra gli scogli ora possono stare anche sulla roccia (`*`, `HIDING` con `on: 'rock'`).
- **Il porticciolo romano** non è più la piattaforma in mare davanti alla spiaggia: è una caletta sul lato est del promontorio (`PORTICCIOLO`, righe di `~` acqua, `_` banchine, `&` roccia; `OPEN_SEA` tiene libera la bocca), con le due vasche, le banchine a blocchi squadrati, gli anelli, la bitta e la scaletta (oggetto di terra `porticciolo`, `ground.ts`; il generatore scrive `FORMIA_PORTICCIOLO`). Ci si scende dal sentiero della villa (`Discesa al porticciolo`). Il gradone basso finisce prima, a x 279.
- **La rotonda dei Carabinieri** (OSM «Rotonda dei carabinieri», 41.2606, 13.6200): un anello di strada (`STREETS`, 11×11 caselle, il lato ovest è la corsia del furgone) intorno al prato grande (`rotonda-carabinieri`, `fill: 'rotonda'`), disegnato dall'oggetto `rotonda`: corsia tratteggiata, frecce, cordolo, prato a strisce, aiuole di oleandri, aiuola di fiori al centro. A nord, oltre l'Appia: il Comando Compagnia Carabinieri (`caserma`, via Appia Lato Napoli 1: bianco, base in pietra, tetto rosso, insegna, bandiera, sbarra) e il palazzo giallo chiaro con il Bar Elsa (`bar-elsa`, via Appia Lato Napoli 3). Sotto l'anello, verso il mare, la passeggiata sugli scogli (`ROTONDA_LAND`) e i due frangiflutti (`BREAKWATERS`).
- **Il castello di Claudia** è più a est, fra via Verdi e via Rossini, sopra la scuola elementare Gianni Rodari (`scuola-rodari`, via Palazzo 68 secondo Google Maps; il posto ora è chiuso).
- **Le vedute dei belvedere** sono in prima persona (`render/canvas/panorama.ts`, dati in `data/panorama.ts`, finestra in `ui/panorama.ts`): un rilievo in lat/lon costruito dalla geografia vera (la costa del golfo da OpenStreetMap, `tools/panorama/coast.ts` → `data/panorama-coast.ts`; i monti come coni con le quote vere; le isole Pontine), disegnato colonna per colonna con la curvatura della Terra, la foschia, il mare, i paesi, alberi, case e luoghi riconoscibili. Gaeta è il promontorio attaccato a terra, non un'isola (`tests/unit/panorama.test.ts`). Aurunci (Redentore), Acervara, punta di Gianola, Rotabile, golfo dal largo; si gira trascinando o con le frecce, «Nomi» o N nasconde le scritte, la luce segue l'ora della mappa. «Dall'alto» porta alla vecchia vista dall'alto.
- **Salvataggi:** `formia19` riporta a casa chi era sotto un edificio o un albero nuovo. Misure: 205 case, 5 schermate vuote su 85, 8% di caselle deserte.

## Il mare: vento, gare e missioni (21 novembre 2026)

- **Il vento** (`story/wind.ts`) cambia ogni cinque minuti, uguale per tutti alla stessa ora: libeccio, ponente, maestrale, scirocco… con forza e raffiche. In mare un riquadro in alto a destra dice da dove viene e come si sta andando: in poppa, al lasco (il più veloce), al traverso, di bolina, controvento (quasi fermi: si bordeggia).
- **Il windsurf** (`story/movement.ts`): la rotta è la somma delle ultime quattro mosse, così uno zig-zag (su, sinistra, su, sinistra) naviga in diagonale e si può bordeggiare, risalendo il vento di bolina; finché la rotta non gira troppo la tavola tiene la velocità. Le marce massime dipendono dall'andatura e dalla forza del vento; una raffica dà una marcia in più; girarsi di colpo all'indietro sopra la quarta marcia fa cadere in acqua; lasciando i tasti la tavola plana ancora un paio di caselle. La vela da regata di Nicola dà una marcia in più. Scia e spruzzi quando plana (`render/canvas/sea-marks.ts`).
- **Le gare** (`data/sea.ts`, `ui/sea.ts`): lo slalom di Vindicio (l'istruttrice sulla spiaggia dell'Eclipse), la regata con Nicola lungo il giro dell'inizio, che stavolta non aspetta (dopo lo sbarco a Gianola), la traversata del golfo da Gianola a Vindicio (il velista al Lido Oriente). Boe arancioni da girare in ordine, la freccia sulla prossima, il tempo che si ferma quando si parla, niente incontri durante la gara; i record nelle attività. Il tempo buono dipende dal vento del giorno: 1,3 volte quello di una gara fatta bene con le stesse regole della tavola (`story/regatta.ts`, `tests/unit/regatta.test.ts`), e Nicola va 1,12 volte più piano di quella. Misurato su otto venti e tre forze: slalom 5–24 s (mediana 8), regata 17–83 (29), traversata 15–73 (25).
- **Le missioni in mare**: i quattro gavitelli del pescatore di Mola, le tre boe del Lido Oriente, la tavola vecchia di Nicola sparata via da Faro (premio: la vela da regata), il ragazzino col materassino portato via dal vento nella baia di Scauri (un minuto e mezzo per raggiungerlo). Le posizioni sono spot `on: 'sea'` in `formia-places.ts`; lo stato è nei flag `sj-…` di `st.seen`. Nel menu, «In mare» elenca le missioni sentite e quanto manca.
- **Il traghetto per Ponza** (`render/atmosphere.ts`, spot `traghetto-…`): ogni cinque minuti esce dal porto verso sud-ovest e poi rientra; solo immagine, fermo all'imboccatura con movimento ridotto, assente in Grafica Bassa.
- **I treni** (`render/atmosphere.ts`, `FORMIA_RAILS` scritto da `build.ts` con i binari di `network.ts`): un regionale di tre carrozze passa sulla Roma–Napoli, verso Scauri e poi indietro, ogni tre minuti e mezzo, e sparisce nella galleria fra Vindicio e la stazione. Spento con movimento ridotto e in Grafica Bassa.

## Rilievo

La mappa ha gradoni sugli Aurunci, all'Acervara e a Gianola, muraglione dell'Appia, la salita di via Solaro, tre sentieri, cinque salti verso sud e quattro belvedere registrati nel diario. I fianchi sono caselle solide; una quota numerica per casella non è implementata. Castellone richiede ancora un intervento specifico per diventare visibilmente più alto dell'Appia.

Nel generatore `TERRACES` definisce le terrazze, `SCARPS` i fianchi, `TRAILS` i sentieri, `LEDGES` i salti e `WILD` la chiusura della campagna lontana dai passaggi. `route` in `story/maps.ts` usa i salti solo nel verso consentito. `story/movement.ts` gestisce il salto; le scale funzionano nei due versi. I belvedere sono cartelli con `view`.

Il disegno è in `render/canvas/ground.ts` e `objects.ts`: texture continue, contorni arrotondati, facciate determinate da semi, fianchi e ombre al piede.

**Erba alta** (13 novembre 2026): il letto della macchia è nel terreno (`DECO.tall`: un tappeto scuro unito alle caselle vicine, la linea a penna solo sul bordo della macchia); i ciuffi lunghi sono in `render/tall-grass.ts`, disegnati a ogni fotogramma da immagini preparate a 13 inclinazioni: si piegano col vento (`wind` di `atmosphere.ts`), si aprono attorno al giocatore e alla sua creatura, dopo il passaggio oscillano e tornano; a ogni passo dentro saltano su pezzetti di foglia e semi e si sente un fruscio (`sfx('grass')`). Con movimento ridotto o Grafica Bassa niente vento né oscillazioni né pezzetti. Nelle immagini ferme (titolo, pianta del menu, overview) i ciuffi sono dipinti nel terreno (`stillGround` in `world-view.ts`).

**Ombre dei tetti non squadrati** (13 novembre 2026): `SHAPED` in `world-view.ts`. Cupole, torri, covi, chiese con campanile, la tomba, la fontana, le rovine, i lidi proiettano il contorno del proprio disegno (colonna per colonna, pieno anche dove il disegno è di vetro) invece del parallelepipedo dell'impronta: `k` dice quanto è alto il contorno (1 per chi è disegnato in alzato come una torre; `box` per una facciata con il tetto sopra, alto quanto lo sarebbe il blocco), `sweep` quanto indietro il contorno si ripete. Gli altri edifici restano blocchi. I colori della mappa vengono dai token `--m-*`. Gli omini riconoscibili usano `person` per gli amici e `look` per gli altri aspetti specifici.

## Luce e vita

`render/atmosphere.ts` disegna ombre dal sole, nuvole, luce sui volumi, vento, mare, piccioni, farfalle, lucciole e falchi. `world-view.ts` gestisce camera, cache, notte e piccoli movimenti delle persone. Gli effetti puramente visivi non leggono la storia, non consumano l'RNG della lotta, si fermano con movimento ridotto e si spengono in Grafica Bassa.

`story/daytime.ts` calcola sole e buio dall'ora reale o dalla scelta del menu. La preferenza usa `lotte-tra-amici:ora:v1`. Le finestre e i lampioni si accendono di notte. Prima di ottimizzare misurare con `npm run perf`: gli ultimi controlli sul Mac erano sotto il tetto di 8 ms per fotogramma a 1440×900; i browser senza accelerazione possono essere molto più lenti.

## Controlli

`tools/formia/audit.ts`: rete stradale, ferrovia, vicoli e percorsi. `drift.ts`: spostamenti dei luoghi. `density.ts`: distanza dalle attività e schermate vuote. `show.ts x0 x1 y0 y1`: dettaglio della mappa.

Test pertinenti: `maps.test.ts`, `relief.test.ts`, `density.test.ts`, `place.test.ts` e golden del canvas. Cambiando coordinate salvate aggiungere una migrazione; non riutilizzare `formia10` per un layout nuovo. Le mappe con enigmi hanno un validatore in `story/place.ts`.

## Riferimenti

`design/mappa/riferimenti/` conserva due viste satellitari (via Amendola e lo Zauli) per il confronto a occhio. La proposta geografica di Codex dell'11 novembre è stata sostituita dalla Formia grande e tolta: ne restano fonti e coordinate in `fonti-formia.md`.

## Vindicio e il confine con Gaeta (17 novembre 2026)

Via Canzatora collega l’Appia alla Flacca sul lato di terra. Le case seguono la strada verso il confine. A Vindicio, via Acervara, via Taliente, via Sem Benelli, via Giuseppe Garibaldi e un tratto di via Remigio Paone articolano gli isolati. Per i tracciati e la distribuzione dei fabbricati sono stati confrontati l’estratto OSM del progetto e le impronte degli edifici. La griglia conserva incroci e orientamento generale, con distanze e ingombri adattati al gioco. [Cartografia di Vindicio e del confine, © OpenStreetMap contributors](https://www.openstreetmap.org/#map=16/41.2490/13.5830) · [Comune di Formia, incrocio fra via Vindicio e la Flacca](https://www.comune.formia.lt.it/notizie/Attivazione-Nuovo-Rilevatore-di-Infrazioni-Semaforiche-a-Vindicio.html)

Sul lato di Gaeta si incontra il Convento di Villa Irlanda. Il disegno riprende il portico a tre arcate, il frontone e le persiane verdi dell’ala lunga dalla fotografia della struttura. Le altre abitazioni alternano case con loggia, ville con terrazza e palazzine con balconi. [Fotografia e storia del Convento](https://www.villairlanda.it/il-convento/)

La mappa passa da 192 a 219 case di riempimento, più il Convento. La migrazione `formia14` controlla la posizione salvata del giocatore, del motorino e del furgone nella zona interessata.

## La litoranea da Vindicio a Gaeta

La mappa misura 320×152 caselle. Le 24 righe aggiunte a sud seguono il lungomare Giovanni Caboto oltre Villa Irlanda, in località Arcella. Da Formia si percorre viale Unità d’Italia passando per l’incrocio semaforizzato con via Vindicio. Al bivio di via Canzatora si può salire verso l’Appia e la Tomba di Cicerone, oppure proseguire lungo la costa fino all’ingresso della Villa. Dal marciapiede si raggiunge il Convento attraverso il vialetto accanto alla piscina. La passeggiata dei lidi corre sul lato della spiaggia.

La carreggiata, la mezzeria e i nomi che compaiono durante la guida seguono i due tracciati di `LITORANEA` in `formia-places.ts`. La migrazione `formia15` gestisce le posizioni salvate interessate dal nuovo tracciato e dalla variazione della riva sul vecchio bordo sud. [Cartografia del confine](https://www.openstreetmap.org/#map=16/41.2448/13.5777)

## La pineta costiera, il Tempio del Basso e il Bodeguita

Da Formia si passa per Caposele e si entra nella Pineta di Vindicio prima di raggiungere via Tito Scipione e i lidi. Nel gioco la passeggiata attraversa il parco tra il viale e la riva. Le fasce di `PINETA_SHORE` danno spazio ai pini domestici e al sottobosco fino all’acqua. Il Tempio del Basso occupa la radura centrale, collegata da sentieri di ghiaia all’ingresso dalla litoranea e alle panchine che guardano il golfo.

Il Bodeguita del Mar è fra i pini sul lato di Caposele, con tre ombrelloni di paglia, quattro tavolini e le sedie. Oltre il margine ovest della pineta comincia la passeggiata dei lidi, dal Frungillo verso il Bandiera e l’Eclipse. La migrazione `formia17` sposta le posizioni salvate occupate dai nuovi arredi e dagli edifici.

## Castellone e il centro in grande (17 novembre 2026)

La mappa misura 350×152 caselle. Da Castellone a via Lavanga (le colonne 83–111 della mappa di prima) la scala è doppia: circa 11 metri per casella invece di 23, così i vicoli, le piazzette e i gradoni del borgo hanno lo spazio che hanno davvero. Tutto quello che sta a est è 30 colonne più a destra. La regola è `widened(x)` in `save/story-progress.ts`: `x` fino a 82, `82 + 2(x − 82)` nella fascia, `x + 30` oltre; `X_ANCHORS` in `formia-projection.ts` la segue. Tracciati, piazze e blocchi vengono dall'estratto OpenStreetMap del centro (strade, scalinate, impronte degli edifici), letto il 17 novembre. [Cartografia di Castellone e del centro, © OpenStreetMap contributors](https://www.openstreetmap.org/#map=18/41.2556/13.6030)

- **Castellone:** via Vitruvio sale fra le mura (`W`) e il borgo; dentro, via Mamurra fa il giro del colle (alta, sopra, sotto Sant'Erasmo, al castello) con via Orticello, via Traiano, via del Castello, via San Giovanni, via delle Mura Ciclopiche, il vicolo di Sant'Anna. Piazza Sant'Erasmo con la chiesa e la Torre di Castellone; Largo Sant'Anna con il Cisternone; la piazzetta del castello; la piazza della Porta. Il teatro romano (`kind: 'teatro'`, la cavea a gradoni con le case sopra gli archi, come in via del Teatro) con la piazzetta Forcina davanti.
- **Gradoni:** le scalinate vere sono `STAIRS` in `network.ts` (Gradoni del Duomo, Scalinata della Torre, vico del Teatro, via Orticello, via Traiano, via del Castello, via San Giovanni, via delle Mura Ciclopiche, via del Pesce, via Tacito, vico Antonino Pio, via Orazio). Il generatore le lastrica e le segna `>`: si camminano come le strade, `ground.ts` le disegna a quattro alzate di pietra.
- **Case del borgo:** le file di Castellone hanno `kind: 'casale'` (`render/canvas/cortina.ts`): case di pietra e intonaco a due o tre piani, tetti di coppi a falde che si incastrano sulle impronte profonde, terrazzi, comignoli, finestre piccole con i fiori, panni, l'edicola col santo, porte ad arco e scale esterne, buganvillea. Più in basso, verso il mare, le cortine dei palazzi come a Mola.
- **Il centro:** via Vitruvio verso Santa Teresa (facciata propria, `look: 'teresa'`), piazza Marconi, piazza Aldo Moro, piazza IV Novembre lungo la ferrovia con il largo della stazione (via dei Carmelitani, larga due caselle: il furgone ci arriva), piazza della Vittoria col giardino dei Caduti formiani, via Divisione Julia, via Costanzo Ciano, via Salvo D'Acquisto, via degli Olivetani, il viale lungo il mare.
- **Gente:** nove persone nuove (il cameriere, il ragazzo col motorino di via Mamurra, la signora di Castellone, la studentessa, il tassista della stazione, il negoziante di via Vitruvio, il pescatore del Viale, il signore di Santa Maria la Noce, il ciclista di via Sant'Antonio) e i cartelli del teatro e della Noce.
- **Salvataggi:** `formia18` è la prima della lista: sposta le posizioni salvate (giocatore, motorino, furgone) con `widened`, così le revisioni dopo leggono la mappa di oggi; chi stava dentro la fascia ridisegnata, o dove ora c'è un edificio, torna a casa (il motorino e il furgone tornano al loro posto). Le zone delle revisioni precedenti (`VINDICIO_REVISION`, `LITORANEA_*`, `PINETA_*`) sono già nelle colonne nuove.
- **Misure dopo:** 294 case, 154 lampioni, nessun vicolo cieco. 16 schermate vuote su 104 (prima 7 su 93): le schermate a est di Castellone sono tagliate di nuovo e i monti e le colline sopra la fascia contano come terreno in più. `density.test.ts` ha il tetto a 16; scenderlo è lavoro aperto (`roadmap.md`). Caselle deserte 10%.


## Le schermate vuote — 23 novembre 2026

Le quindici schermate che si attraversavano senza niente da fare (`density.ts`) ora hanno tutte qualcosa. I punti sono in `formia-places.ts`, le persone e il cartello in `formia.ts`.

- **Persone:** la passeggera per Ponza sul pontile del porto, il pescatore della banchina e la signora a passeggio sul lungomare di Mola, la signora alla fermata sull'Appia, il signore che guarda i treni dietro casa di Zendavid, la signora e il vicino di Scauri, il cercatore di funghi nel bosco verso Gaeta, la raccoglitrice di asparagi ai piedi del Monte di Scauri. Dicono cose loro; quelle con `hint` dicono anche dove va la storia.
- **Un'allenatrice:** la ragazza con lo skate a Scauri (`skate` in `data/trainers.ts`, Granchietto al 5 e Cicalina al 6): una prima sfida facile per chi abita lì, come la bagnante sulla strada di Gianola.
- **Il belvedere di Maranola:** in cima ai vicoli, sopra la torre (`vista-maranola`, veduta `maranola` in `data/panorama.ts`): Gianola a sinistra, Formia sotto, Gaeta e il largo a destra.
- **Erba e scogli:** erba alta nel prato sopra Maranola (`monti`), sul prato davanti al mare a Rio Fresco (`gramsci`), nell'ultimo uliveto prima del Monte di Scauri (`ulivi`); pozze sulla spiaggia di Scauri verso il Garigliano (`scogliera`, due macchie). La macchia d'erba `selv-ulivi-7` è larga una casella in più: l'uliveto si ritira e il prato ai piedi del Monte di Scauri, che prima era chiuso dalle macere, si può percorrere.
- **Salvataggi:** `formia20` riporta a casa chi stava dove ora c'è una persona, un cartello, un albero, un lampione o una macera (il motorino e il furgone tornano al loro posto).
- **Misure dopo:** nessuna schermata vuota su 105 (prima 15 su 104), 6% di caselle deserte (prima 9%). `density.test.ts` ha il tetto a 0 e al 6%.
