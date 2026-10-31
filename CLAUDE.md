# Lotte tra Amici

Gioco di lotte a turni in stile Pokémon con sei amici e un boss (l'Esame di Controlli), più una modalità storia su una mappa di Formia vista dall'alto, dove Antonio cresce di livello, guadagna e spende soldi e ha una squadra di creature di Formia (originali, non i Pokémon veri). Vite + TypeScript strict, niente framework: DOM e SVG per home e lotta, canvas 2D per la mappa. La build è un unico file HTML autonomo.

Il gioco nasce come pagina singola (un Artifact di claude.ai) ed è stato migrato a moduli **senza cambiare nulla**: stesse meccaniche, numeri, testi, animazioni e salvataggi. Il prossimo passo previsto è spostare gradualmente il rendering su Phaser (vedi in fondo).

## Comandi

| Comando | Cosa fa |
|---|---|
| `npm install` | dipendenze (Node 22 o più recente) |
| `npm run dev` | server di sviluppo su http://localhost:5173 |
| `npm run build` | typecheck + `dist/index.html`: un solo file con script, stili e font incorporati |
| `npm run build:google-fonts` | come sopra, ma con i font da Google Fonts (`dist-google-fonts/index.html`), per la cornice degli Artifact se i font `data:` non si caricano |
| `npm run preview` | serve `dist/` |
| `npm run typecheck` | solo `tsc --noEmit` |
| `npm test` | Vitest: golden di motore, ritratti e mappa, dati, controllo delle mappe |
| `npm run test:e2e` | Playwright: partite intere giocate fino in fondo, senza errori, e l'audio |
| `npm run test:e2e:dist` | le stesse partite sul file singolo di `dist/` aperto da disco |
| `npm run test:all` | Vitest + Playwright |
| `npm run sim` | simulatore di bilanciamento (vedi sotto) |
| `npx tsx tools/sim-story.ts` | bilanciamento della storia: quanto spesso una creatura o un amico a un livello batte un altro (`polpino:8 forchetta:9` per uno scontro solo) |
| `npm run golden` | rigenera i golden dal codice attuale, dopo un cambio voluto |

## Dove si trova ogni parte

```
index.html                 guscio della pagina: le quattro sezioni (home, battle, world, overlay)
src/
  main.ts                  avvio: listener della tastiera (prima la mappa, poi la lotta), window.WORLD/UI per i
                           playtest, gancio window.claude.hot per l'aggiornamento a caldo dell'Artifact
  data/                    solo dati, niente logica
    characters.ts          i sei amici e l'Esame: statistiche, mosse, passive, difetti, frasi; ROSTER, PAIRS, JOKES
    creatures.ts           le creature di Formia: specie, mosse (CMOVES), evoluzioni, le tre iniziali, chi impara cosa
    fighters.ts            fighter(id): un amico, l'Esame o una creatura, per il motore e le schermate
    growth.ts              livelli (numeri al livello, esperienza), abilità di Antonio, negozi e prezzi
    types.ts               i cinque tipi in ciclo (TYPES, TYPE_ORDER)
    tuning.ts              numeri di bilanciamento (TUNE, K, CRIT)
    items.ts               le cose che Antonio perde (ITEMS) e dove le ritrova (FOUND)
    maps/                  le mappe (index.ts: MAPS) e legend.ts (cosa significa ogni carattere)
      formia.ts            Formia vera: persone, cartelli, oggetti persi, quartieri, motorino (RIDES)
      formia-places.ts     i luoghi con le coordinate reali e i testi (casa, Eclipse, Morgana, stazione…)
      formia-ground.ts     GENERATO da tools/formia/build.ts: terreno, posizioni risolte, case di contorno
      formia-projection.ts dalle coordinate reali alle caselle
      casa.ts, circolo.ts, interni: l'appartamento di Antonio, i campi coperti del Bruno Zauli,
      morgana.ts           la Birreria Morgana (bancone, tavoli, palco del quiz)
    covi.ts, gates.ts      i covi (palestre) con spille e frasi; le uscite dalle città
  battle/                  motore di lotta: puro, senza DOM, stato JSON con l'RNG dentro
    index.ts               API (ENGINE): newBattle, intro, beginTurn, playTurn, needs, available, moveLabel, snap, ai…
    turn.ts                flusso del turno, ordine di azione, fine lotta, voto dell'esame
    moves.ts               cosa fa ogni mossa, personaggio per personaggio
    damage.ts              danni, critici, cure, confusione
    ai.ts                  scelta del computer (e piano dell'Esame)
    labels.ts              etichette dei pulsanti (moveLabel) e bollini (snap/chips)
    state.ts, rng.ts, events.ts, types.ts
  story/                   logica della modalità storia, senza disegno
    maps.ts                mappe preparate, collisioni, oggetti persi, quartieri, covi, percorso più breve
    movement.ts            passi, rotazioni, porte, warp e viaggi (travel)
    activities.ts          le attività per Formia: elenco, volte fatte, record
    goals.ts               il giro di Formia: le tappe in ordine, la prossima, dove puntare la freccia
    daytime.ts             l'ora di Formia: alba e tramonto veri del giorno, buio, scelta del menu (chiave lotte-tra-amici:ora:v1)
    run.ts                 lo stato della corsetta in pineta
    growth.ts              la crescita nella storia: livelli ed esperienza, abilità, soldi, borsa, creature di Antonio
  save/
    story-progress.ts      salvataggio della storia  (chiave lotte-tra-amici:storia:v1)
    libretto.ts            vittorie, sconfitte, voti (chiave lotte-tra-amici:libretto:v2)
  render/
    svg/                   ritratti generati da parametri (looks.ts), espressioni, capelli, vestiti, Esame, robot;
                           badges.ts: spille e icone degli oggetti; creatures.ts: le creature, un SVG intero ciascuna
    canvas/                arte della mappa: terreno, edifici e oggetti, omini visti dall'alto, palette dai token --m-*
    world-view.ts          camera, cache dei pezzi di terreno, disegno ordinato, la notte (lampioni, finestre, faro),
                           anteprima della home, mappa intera
  audio/                   musica ed effetti sintetizzati con la Web Audio API (nessun file audio)
    context.ts             AudioContext creato al primo tocco o tasto, bus musica/effetti, acceso/spento
                           (chiave lotte-tra-amici:audio:v1), pausa quando la scheda non è visibile
    tracks.ts              i brani in notazione da tracker: home, world, battle, boss, victory, defeat
    music.ts               sequencer: programma le note in anticipo sull'orologio audio, dissolvenze tra brani
    sfx.ts                 gli effetti (colpi, cure, KO, striscioni, passi, spille, clic…)
    cues.ts                quale suono va con quale evento del motore; blip della macchina da scrivere
    synth.ts               strumenti: oscillatori con inviluppo, rumore filtrato, batteria
  ui/
    sound.ts               l'interruttore audio (home, barra della lotta, HUD della storia) e il clic dei pulsanti
    common.ts              colori dei tipi, ritratti, le sezioni della pagina, scelte del giocatore (view)
    home.ts                home (scheda del personaggio, boss, tipi, libretto) e foglio "Nuova sfida"
    battle-screen.ts       schermo di lotta: riproduce gli eventi del motore, passaggio del telefono, risultato, scheda
    effects.ts             effetti della lotta (affondi, proiettili, coriandoli, striscioni…)
    story-screen.ts        schermo della storia: HUD, croce, tastiera, dialoghi, covi, premi, menu (con il Diario
                           di Formia), motorino, ciclo dei frame
    activities.ts          le attività: beach volley, lettino, gelato, quiz da Morgana
    team.ts                la squadra: prima creatura, chi va in campo, ricompense ed evoluzioni, negozi, abilità
    run.ts                 la corsetta in pineta: bandierine, cronometro nell'HUD
    icons.ts, dom.ts
  styles/                  CSS diviso per sezione; index.css = font + app.css; l'ordine degli @import è la cascata
  assets/fonts/            Atkinson Hyperlegible, Lilita One, Patrick Hand (woff2, OFL)
tests/
  unit/                    Vitest
  golden/                  scenari e registratori usati dai golden (lotte deterministiche, finto canvas, finto document)
  fixtures/                i golden: impronte di 2040 lotte, 168 stringhe SVG, le sequenze di disegno del canvas
  e2e/                     Playwright: harness.ts (orologio finto, seme), playthrough.spec.ts (partite intere,
                           storia, attività, casa e motorino), audio.spec.ts
tools/
  sim.ts                   simulatore di bilanciamento
  golden.mjs               genera i golden
  formia/                  la mappa di Formia: network.ts (strade e ferrovia disegnate a mano), build.ts (il generatore),
                           playable.ts e audit.ts (controlli), extract.mjs, paint.ts, show.ts, where.ts, drift.ts
```

## La mappa di Formia

- **È Formia vera, resa giocabile:** costa, spiagge, pinete e parchi vengono da OpenStreetMap; strade e ferrovia sono disegnate a mano sul modello di quelle vere (l'Appia, via Vitruvio, il lungomare, via Amendola); i luoghi stanno vicino a dove sono davvero, con la porta su una strada. Antonio è il protagonista: si parte da casa sua, Parco la Fontana in via Giovanni Amendola 1, e i posti dove va con gli amici (l'Eclipse beach di Nicola Spadea a Vindicio, la pineta di Vindicio, la Birreria Morgana a Mola) hanno persone e attività. Il resto della città fa da contorno.
- **Come è fatta:** è una mappa da gioco disegnata sulla geografia vera.
  - **Dati veri, da OpenStreetMap:** costa, spiagge, pineta, parchi e colline vengono da `tools/formia/osm-extract.json` (© OpenStreetMap contributors, ODbL), proiettati con `formia-projection.ts`. La costa è lisciata: niente moli sottili, isolette o insenature di una casella.
  - **Scheletro giocabile, a mano:** ferrovia e strade sono in `tools/formia/network.ts`, come elenchi di angoli in caselle, e corrono dritte da un angolo all'altro. La ferrovia è una sola linea, dalla galleria nella collina a ovest al bordo est, passando davanti alla stazione; dove una strada la incrocia c'è un passaggio a livello. Le strade (Appia, lungomare, via Vitruvio, le vie dei quartieri, via Amendola…) si toccano in caselle comuni, quindi sono un'unica rete senza vicoli ciechi. I sentieri della pineta sono `PATHS`.
  - **I luoghi vengono dopo le strade:** ognuno di `formia-places.ts` va sulla casella libera più vicina alla posizione vera da cui la sua porta dà su una strada (o, se non c'è, su un vialetto di pochi passi). Quelli del centro hanno `tile`, una casella scelta a mano, perché stazione, Comune, piazza, bar e Morgana sono composti insieme alle strade.
  - **Poi il resto:** persone e cose accanto ai loro posti (mai su un edificio, su un vialetto, dietro un tetto, o in un angolo da cui chiuderebbero un altro); le case di contorno lungo le vie; i marciapiedi del centro; gli ulivi in campagna, in file con lo spazio per passare.
  - **Per ultimi i lampioni:** lungo le strade della città, sul marciapiede o sul bordo erboso (`K` erba, `L` pietra, `Y` lastricato), un lato e l'altro a turno. Mai davanti a una porta o accanto a qualcuno, e ognuno viene tolto se taglia fuori anche una sola casella raggiungibile da casa.

  Tutto finisce in `formia-ground.ts`.
- **Per cambiarla:**
  - **Strade e ferrovia:** in `tools/formia/network.ts`. `npx tsx tools/formia/build.ts --base` stampa costa e verde con le coordinate, per disegnarci sopra.
  - **Luoghi e spot** (persone, cartelli, oggetti, motorini): in `formia-places.ts`.
  - **Ritocchi a mano sul terreno:** in `tools/formia/paint.ts`.
  - **Poi:** `npx tsx tools/formia/build.ts`, che stampa `NOT PLACED` e `PROBLEMS` se un luogo non trova posto o una strada finisce in mare.
  - **Per controllare:**
    - `npx tsx tools/formia/audit.ts`: strade in un pezzo, vicoli ciechi, binari interrotti, quanto si cammina da casa a ogni posto;
    - `npx tsx tools/formia/show.ts x0 x1 y0 y1`: un pezzo di mappa;
    - `npx tsx tools/formia/drift.ts`: di quanto si è spostato ogni luogo;
    - `npm test`: controlla anche che strade e ferrovia restino continue (`tools/formia/playable.ts`). Poi `npm run golden`, perché il disegno cambia.
- **Scala:** circa 33 m per casella in centro, di più nei tratti in mezzo; le spiagge di Vindicio e Gianola sono allargate di qualche casella verso il mare, sennò a questa scala sarebbero strisce.
- **Salvataggi:** chi aveva una partita sulle mappe di prima riparte da casa (`seen.formia6`, l'ultima volta che le caselle sono cambiate), con spille, compagnia e oggetti ritrovati. Se rigeneri la mappa e le posizioni cambiano molto, aggiungi un nuovo `formiaN` in `save/story-progress.ts`.

## Il mentore: il fantasma di Cicerone

- **Chi è:** Marco Tullio Cicerone, morto a Formia nel 43 a.C., con la tomba sull'Appia; e «cicerone» vuol dire guida. È la guida di Antonio per tutto il viaggio (`story/mentor.ts`, disegnato in `render/svg/cicero.ts`).
- **All'inizio** (storia da zero) appare lui: si presenta, racconta il sogno (Formia → Torino → Chicago) e la leggenda delle creature, spiega i comandi, i tipi, i livelli, gli euro, e dà la prima tappa (`OPENING`).
- **Compare solo quando serve** (`cicPresence`, `ciceroShown` in `ui/story-screen.ts`): non segue Antonio. Quando ha qualcosa da dire appare trasparente accanto a lui sulla mappa e nel suo angolo in basso a sinistra, con una nuvoletta che non ferma il gioco; poi svanisce. Parla:
  - a ogni capitolo (le tappe del giro, `CHAPTERS`): com'è andato quello finito e la sfida dopo, con quanto è difficile;
  - la prima volta che succede qualcosa (sconfitta, primo livello, primi soldi, notte, creatura selvatica, allenatore, evoluzione, cattura), una volta sola (`TIPS`, segnati in `st.seen['cic-…']`);
  - quando Antonio sembra perso: quattro minuti senza fare un passo avanti nel giro e senza sentirlo (`nudge`), gli ricorda la prossima tappa.
- **Quando lo chiami** (tasto C, scritto anche in basso) dice il capitolo, cosa fare e, per i covi, se la squadra è pronta, confrontando il livello più alto della squadra con quello del capo (`advice`).
- **Nei dialoghi** quando parla lui compare il suo ritratto.

## Il giro di Formia

- **Cos'è:** il filo che tiene insieme la storia. `story/goals.ts` mette in fila le tappe (`STOPS`): la prima creatura dal guardaparco di Gianola, padel con Andrea, Forchetta, Morgana, il gelato, Costanzo, gli oggetti persi, l'Eclipse, la pineta, la Tomba di Cicerone e, alla fine, il treno per Torino. Il percorso va da casa verso ovest.
- **Prossima tappa:** è la prima non ancora fatta; si può comunque fare tutto in qualsiasi ordine. Si vede in tre posti:
  - nell'HUD, sotto il nome del posto, con una freccia che punta verso la tappa (`renderGoal` in `ui/story-screen.ts`);
  - sulla mappa, come una freccia gialla che rimbalza sopra la persona, la cosa o la porta (`drawWorld`);
  - sulla pianta del menu, come una stella; il menu elenca anche tutto il giro.
- **Dentro casa o al circolo**, la freccia punta all'uscita; fuori, alla porta del posto dove sta la tappa (`heading`).
- **Chi dà consigli:** alcuni abitanti (la vicina, il tifoso al bar, il marinaio al porto, il bagnino all'Eclipse) hanno `hint: true`. Dopo le loro frasi dicono il `tip` della prossima tappa, con parole loro.
- **Aggiungere una tappa:** una voce in `STOPS`, nell'ordine del giro. Il test `the tour of Formia` controlla la prima tappa e il conteggio.

## Com'è disegnata Formia

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

## Fonti dei fatti di Formia

I testi di cartelli, targhe, persone, quiz e note dei quartieri dicono cose vere. Se ne aggiungi, controllale.
- **Torre di Castellone:** ottagonale, alta 25 m, fatta costruire nel 1377 da Onorato I Caetani sulla base in opera poligonale dell'arce romana. Le mura avevano 12 torri, distrutte dai bombardamenti del 1943. Il borgo nacque contro le incursioni saracene. Fonte: italia.it, «Torre di Castellone».
- **Cisternone romano:** del I sec. a.C., sotto Castellone, 1200 m², 7000 m³ d'acqua. Fonti: cultura.gov.it, italia.it.
- **Sant'Erasmo:** vescovo e martire, protettore dei marinai, morto a Formia il 2 giugno 303. La chiesa di Castellone sorge sulla sua sepoltura: gli scavi del 1970–76 hanno trovato una necropoli romana e una cripta carolingia. Le reliquie andarono a Gaeta dopo l'842. Da «Elmo» viene il fuoco di Sant'Elmo. Fonti: italia.it, Arcidiocesi di Gaeta.
- **Teatro romano:** di età augustea, a sud di Sant'Erasmo. Circa 300 persone abitano in più di settanta appartamenti costruiti dentro. Fonte: italia.it.
- **Torre di Mola:** del castello angioino, costruita dopo il sacco del 1289 sopra le terme romane. Oggi ospita l'Archivio storico. Fonti: italia.it, formiae.it.
- **Chiesa dei Santi Lorenzo e Giovanni Battista**, in piazza San Giovanni a Mola: citata dall'841. Fino all'Ottocento erano due chiese divise da un muro; la guerra l'ha quasi distrutta. Dentro c'è una tavola di Antoniazzo Romano (verso il 1490). San Giovanni si festeggia a Mola il 24 giugno. Vicino alla chiesa ci sono resti dell'acquedotto romano. Fonti: Wikipedia, gcatholic.org, wanderlog, travel365, guide turistiche.
- **Scuola Vitruvio Pollione:** istituto comprensivo, la scuola media è in via Emanuele Filiberto, a Mola. Che Vitruvio fosse di Formia è una tradizione, non una certezza: i testi dicono «molti dicono». Fonti: tuttitalia, whatschool, gjc.it. Che la scuola stia di fronte alla chiesa, e il giardino con la siepe sull'Appia di Parco la Fontana, sono indicazioni di chi ci abita, non di fonti pubbliche.
- **Villaggio Don Bosco:** è la parrocchia del Cuore Immacolato di Maria, su via Appia Lato Napoli, con l'oratorio. Nell'aprile 2023 un incendio ha danneggiato la sacrestia e la canonica (Avvenire): non è nei testi del gioco. Com'è fatta davvero la chiesa non l'abbiamo trovato: il disegno è una chiesa parrocchiale moderna qualunque. La frase «Basta che siate giovani perché io vi ami assai» è di San Giovanni Bosco. Fonti: Avvenire, gcatholic.org, copray.ch.
- **Gelateria Lavezzi:** in piazza Guglielmo Marconi (9 o 11, le fonti non concordano), dal 1870: Amalio Lavezzi cominciò con un chiosco, limone e caffè, con la neve presa sul Vesuvio; oggi c'è la quarta generazione. Ha i tavolini fuori. I colori veri dell'insegna non li abbiamo verificati: verde e oro sono una scelta. Fonti: innercitynews.com.au, Broadsheet, TripAligner, RestaurantGuru.
- **Museo archeologico nazionale:** in via Vitruvio 184, nell'ala sud del Palazzo comunale (le sale degli «Stalloni dei Borbone»). Ha statue togate con tracce di colore e statue di notabili e della famiglia imperiale, tra cui Gaio Cesare, trovate nell'antico Foro, oggi piazza Mattej. Fonti: italia.it, cultura.gov.it.
- **Monumento ai caduti** in piazza della Vittoria: del 1926. Fonte: Wikipedia.
- **Porto:** traghetti e aliscafi Laziomar per Ponza e Ventotene, tutto l'anno. Fonti: laziomar.it e gli aggregatori di traghetti.
- **Birreria Morgana:** via Abate Tosti 105, nel centro storico di Mola. Fonti: Gambero Rosso, Trip.com.
- **Centro Bruno Zauli:** nato nel 1955 da un'idea di Bruno Zauli, presidente della federazione di atletica dal 1946 al 1957. Carlo Vittori ci lavorò dal 1966 all'84 e allenava Mennea; ogni anno c'è il Memorial Mennea. Indirizzo: via Appia Lato Napoli 175. Fonti: Wikipedia, CONI, FIDAL.
- **Gianola:** parco regionale dal 1987, Monte di Scauri 123 m. La villa è di Lucio Mamurra, cavaliere formiano e prefetto del genio di Cesare, con l'ottagono detto «Tempio di Giano». Il porticciolo romano era forse una peschiera; oggi è area marina protetta. Fonti: italia.it, Pesando–Stefanile (Università L'Orientale).
- **Vindicio:** spiaggia di oltre un chilometro dal porto a Gaeta, Bandiera Blu, spot di windsurf e kite. La pineta è accanto al Lido Frungillo, in via Tito Scipione 3; l'Eclipse è in via Tito Scipione 58. Nicola Spadea è campione di windsurf e istruttore (Gunsails, Freedome). Fonti: spiagge.it, siviaggia.it, waterwind.it.
- **Lido Oriente:** lungomare Città di Ferrara 128. Fonte: spiagge.it.
- **Maranola:** il presepe vivente nei vicoli, da più di quarant'anni. Fonti: siti di eventi.
- **Cucina:** tiella (la pizza bassa ripiena del golfo), spaghetti alla formiana con cozze, vongole e canocchie, olive di Gaeta, mozzarella di bufala, ciambelle all'anice. Fonti: Gazzetta del Gusto, guide gastronomiche.
- **I Lestrigoni a Formia** (la leggenda delle creature): Cicerone, in una lettera ad Attico, chiama Formia «la Telepilo dei Lestrigoni». Ovidio riprende l'episodio nel XIV libro delle Metamorfosi. La gens degli Aelii Lamiae diceva di discendere da Lamo, re dei Lestrigoni. Il nome si fa derivare dal greco *hormiai*, «approdo». Che Formia sia davvero la città dei Lestrigoni non è provato (il Ministero della Cultura ha riportato ipotesi diverse): nel gioco è detto «si racconta». Fonti: tuttostoria.net, meteoweb, cultura.gov.it.
- **Incerti, quindi non usati:** la «Porta degli Spagnoli» (le fonti non concordano se sia a Castellone o a Mola), il «molo Azzurra» per i traghetti, l'indirizzo preciso del Cisternone.

## Attività, casa e motorino

- **Attività** (`story/activities.ts`): all'Eclipse la lezione di windsurf con Nicola Spadea (campione di windsurf: si tiene la vela nelle raffiche), il beach volley con Valentin e il lettino dal bar del lido; poi la corsetta in pineta con Zendavid, il padel con Andrea, il quiz da Morgana e il gelato da Lavezzi (limone e caffè sono i primi gusti, come nel 1870). Le propone una persona sulla mappa (`activity` sull'Npc); `ui/activities.ts` e `ui/run.ts` le fanno giocare; volte e record si salvano nella storia (`done`, `best`, campi facoltativi) e si vedono nel "Diario di Formia" del menu.
- **Aggiungerne una:** una voce in `ACTIVITIES`, un caso in `play()` di `ui/activities.ts`, `activity: 'id'` su chi la propone in `formia.ts`, e un pezzo nel test `activities around Formia`.
- **Casa:** il portone di Parco la Fontana porta in `casa.ts`. Mobili e finestra sono cartelli `quiet` (si usano, ma non si disegna il cartello di legno). Nel letto si dorme fino a domattina, o si fa un pisolino fino a sera (vedi Giorno e notte).
- **Morgana:** la porta su via Abate Tosti porta in `morgana.ts`: bancone, tavoli, palco con il microfono. Il quiz lo propone l'oste dietro il bancone; Costanzo, quando è in compagnia, sta a un tavolo. Il giro di Formia punta alla porta da fuori e all'oste da dentro.
- **Motorino:** parcheggiato sotto casa, all'Eclipse, da Morgana, in piazza della Vittoria, al Bruno Zauli e in pineta (`SCOOTERS` e `RIDES` in `formia.ts`, cartelli `ride`): si sale e si sceglie dove andare.
- **Cartelli:** quelli dei posti principali dicono anche da che parte sono gli altri (← Vindicio · Mola →).

## Crescita, creature ed economia

- **Livelli** (`data/growth.ts`, `story/growth.ts`): ogni lottatore della storia (Antonio, gli amici che si uniscono, le creature) ha un livello e l'esperienza verso il prossimo, salvati in `st.lv` con chiave `antonio`, l'id dell'amico o l'uid della creatura (`c1`, `c2`…).
  - I numeri dei personaggi sono quelli al livello 5, il livello di partenza: una lotta tra due livelli 5 è identica a quella libera.
  - Da lì Attacco, Difesa e Velocità crescono del 2,5% a livello, i PS dell'1%.
  - L'esperienza arriva dalle lotte (un terzo se si perde), dalle attività (20 ad Antonio) e dal caffè.
  - I capi dei covi hanno un livello (`level` in `covi.ts`): Costanzo 6, Forchetta 9. Gli amici battuti si uniscono a quel livello.
- **Abilità di Antonio:** un punto a ogni livello, da spendere nel menu (Squadra → Abilità).
  - Muscoli, Pelle dura e Scatto alzano i numeri.
  - Memoria di ferro gli fa perdere meno le cose, Prompt engineer gli fa venire più idee: sono le probabilità di `beginTurn`, passate al motore come `perk`.
  - Contrattare abbassa i prezzi.
- **Creature di Formia** (`data/creatures.ts`): animali e piante della città, disegnati per questo gioco, con una magia loro.
  - **La leggenda:** si racconta che Formia fosse la città dei giganti Lestrigoni dell'Odissea e del loro re Lamo, dove approdarono le navi di Ulisse. Quando i giganti se ne andarono, la loro magia restò nelle pietre, nel mare e negli ulivi, e da lì nascono le creature. Lo racconta il guardaparco, e ogni creatura ha la sua storia legata a un posto (le mura dei giganti di Castellone, il golfo, i venti, la luna di Gianola, gli ulivi, Maranola).
  - **La magia di ogni tipo** (`MAGIC` in `render/svg/creatures.ts`):
    - Calma è la luna, Caos il fulmine, Cervello la stella, Chiacchiera il canto, Cuore il cuore;
    - ogni creatura ha un'aura, la runa del suo tipo sulla fronte o sul petto e scintille di luce che salgono (`MAGIC_CSS`);
    - dalla seconda forma c'è un cerchio magico ai piedi, doppio nella terza.
  - **In lotta** le loro mosse sono incantesimi: una runa del tipo vola e scoppia (`magic`), o si accende su chi la lancia (`magicUp`).
  - **Di notte** le creature sulla mappa, selvatiche e quella che ti segue, brillano del colore della loro magia (`drawNight`).
  - **L'evoluzione** è una luce che avvolge la creatura, con i raggi dietro la nuova forma.
  - Ci sono tre iniziali con tre forme (Polpino → Polpetto → Polpastro, Ramarrino → Ramarrone → Muraglione, Gabbì → Gabbianotto → Gabbiammiraglio, che si evolvono ai livelli 14 e 30).
  - Le selvatiche hanno due forme (al 18): Cicalina in pineta e al Parco Gramsci, Riccetto a Gianola, Granchietto sugli scogli della Scogliera, Olivella negli uliveti, Civettina sui Monti Aurunci.
  - Le mosse sono numeri (`CMOVES`, con `fx`: alza o abbassa Attacco e Difesa, confonde, cura) e le esegue `genericMove` in `battle/moves.ts`. Una creatura lotta con le ultime quattro mosse imparate.
  - **La prima creatura** si sceglie dal guardaparco di Gianola (`starter: true` sull'Npc): è la prima tappa del giro.
  - **Le selvatiche non si vedono:** si nascondono nell'erba alta (`E`, disegnata con i ciuffi che coprono i piedi di Antonio e della sua creatura) e nelle pozze tra gli scogli (`A`), come nei Pokémon. A ogni passo lì dentro una volta su `RATE` (9) ne salta fuori una, mai nei `CALM` (3) passi dopo un incontro: lo schermo lampeggia, si sente il fruscio (`meet`) e si sceglie tra «Lotta!» e «Scappa» (`stepped` e `meet` in `ui/story-screen.ts`).
    - **Dove e chi** (`data/encounters.ts`): ogni zona ha la sua tabella, di giorno e di notte, con i pesi. Parco Gramsci (Cicalina, di notte Civettina), pineta di Vindicio (Cicalina, di notte Civettina), uliveti (Olivella), monti Aurunci (Civettina, Olivella e, rara, la forma evoluta), le pozze di Gianola (Riccetto, Granchietto) e della Scogliera (Granchietto, raro il Granchione).
    - **Sulla mappa:** le zone sono macchie disegnate dal generatore (passo 12b di `tools/formia/build.ts`) intorno agli spot di `HIDING` in `formia-places.ts`; il centro e il raggio di ognuna finiscono in `FORMIA_HIDING`, e `hidingAt` in `story/maps.ts` dice in quale zona è Antonio.
    - Gli incontri cominciano quando Antonio ha almeno una creatura. Nei test si fa saltare fuori una creatura con `WORLD._debug.meet('gianola')`.
  - **La leggenda** (Lamo) è l'unica selvatica che si vede: un Npc con `wild` e `legend`. Dopo una lotta vinta o una cattura sparisce per due minuti (`wildGone` in `story/maps.ts`).
  - **Giorno e notte:** di notte le cicale dormono e nell'erba alta escono le civettine (la tabella `night` di ogni zona).
  - **Dorate:** una selvatica su 32 è dorata (`gold`): stessi numeri, colori d'oro e scintille. Se la catturi resta dorata (`mons[].gold`).
  - **La leggenda: Lamo, il re dei Lestrigoni**, gigante di pietra con la corona (`giant` nei disegni), livello 35, tipo Caos. Ha mosse sue: Masso dei giganti, Furia dei Lestrigoni, Ruggito di Lamo, Porte di Telepilo.
    - Esce solo di notte, sotto le mura poligonali di Castellone, quando Antonio ha le due spille, finché non lo cattura (`legend` sull'Npc, `legendHere` in `story/maps.ts`).
    - Il retino lo tiene molto più di rado (`catchRate` 0,35).
    - Cicerone ne svela il segreto alla seconda spilla.
  - **Il retino** si lancia dalla borsa durante la lotta. Più la creatura è stanca, più è facile prenderla; il retino da pesca vale 1,6 volte.
  - **Scheda di ogni creatura** (Squadra → Scheda, `openCreature` in `ui/team.ts`): numeri al suo livello, mosse, la prossima da imparare, le forme, il nome. Il nome che le dà Antonio (`nick`) vale anche in lotta: il lato ha `nick` e `ch()` restituisce il personaggio con quel nome.
  - **Diario delle creature** (`st.dex`: 1 vista in lotta, 2 avuta): nel menu, tutte le specie. Quelle mai viste sono in ombra, quelle viste in grigio, quelle avute a colori.
  - **Chi ti segue:** la creatura principale (`st.lead`, altrimenti la prima) cammina un passo dietro Antonio su tutte le mappe, anche dentro, e prende la casella che lui ha appena lasciato (`follower` in `render/world-view.ts`). Dopo una porta, un warp o il motorino si rimette dietro di lui. È solo disegno e non blocca il passo; se Antonio si gira verso di lei e preme Invio, dice il suo verso e come sta (`followerTalk`). Nel menu, Squadra → «Dietro di me», si sceglie chi segue.
- **Chi lotta con chi:** le creature lottano con le creature, le persone con le persone.
  - **Selvatiche e allenatori** (`fight`, `fightOn`, `fightAfter` in `ui/story-screen.ts`): scendono in campo le creature di Antonio, una dopo l'altra. Ognuna tiene i PS che le restano, e anche la creatura avversaria tiene i suoi. Quando sono tutte KO, Antonio può scendere in campo lui («Lotto io!») o scappare. Dopo una sconfitta in queste lotte la schermata del risultato ha solo «Continua»: si decide sulla mappa.
  - **Covi:** lottano le persone, cioè Antonio e gli amici che si sono uniti (`st.squad`).
  - Senza creature gli allenatori non sfidano Antonio e le selvatiche non saltano fuori.
- **Allenatori** (`data/trainers.ts`): persone già sulla mappa con `trainer` sull'Npc. Prima dicono le loro frasi, poi sfidano Antonio con le loro creature una dopo l'altra:
  - l'animatore dell'oratorio (Lv 6–7), il bambino dell'Eclipse (7), lo studente della Vitruvio Pollione (10–11), la guida del museo (17–19), il signore di Castellone con il Muraglione (22–28);
  - in battaglia si legge «L'animatore dell'oratorio manda in campo Olivella!» (`trainer` nella lotta);
  - la prima vittoria paga il premio (`st.beaten['tr-<id>']`), poi c'è sempre la rivincita per l'esperienza.
- **Economia:**
  - **Gli euro** (`st.money`, nell'HUD) si guadagnano battendo creature (3 + livello), vincendo un covo la prima volta (80) e con le attività (scambi, risposte giuste, metri di planata).
  - **I negozi** (`SHOPS`): reti e retini dal pescatore di Mola, la tiella al forno di Castellone, il caffè al bar di Mola (`shop` su Npc o Building).
  - **Cosa fanno:** la tiella cura 40 PS in lotta. Il caffè si beve subito al bancone del bar (`coffee` in `ui/team.ts`): 60 punti esperienza a chi sceglie Antonio, senza passare dal menu. Un caffè già pagato in un salvataggio vecchio si beve lì gratis.
- **Nel motore** solo le lotte della storia usano queste cose; quelle libere restano identiche e i golden delle 2040 lotte non cambiano.
  - Ogni lato può avere `stats`, `lvl`, `known` (le mosse di una creatura) e `perk`.
  - La lotta può essere `wild`, con una `bag`: retino e retino da pesca solo contro una selvatica, la tiella sempre. Si usano prima delle mosse.
  - Il risultato `catch` chiude la lotta con la creatura nel retino.
  - **Dopo la lotta** la schermata della storia (`afterBattle`) riceve chi ha lottato, il livello dell'avversario e la borsa rimasta, poi dà esperienza e soldi, dice le mosse imparate e mostra l'evoluzione (`ui/team.ts`).
- **Salvataggi:** campi nuovi e facoltativi in `lotte-tra-amici:storia:v1` (`lv`, `skills`, `money`, `bag`, `mons`, `seen.starter`). Un salvataggio vecchio parte dal livello 5, senza soldi e senza creature.
- **Test:** `tests/unit/creatures.test.ts` controlla i dati, le lotte tra creature a ogni livello, la cattura e la crescita. La partita `creatures of Formia` sceglie Polpino, lotta con un Riccetto uscito dalle pozze di Gianola, compra i retini a Mola e cattura quello che esce dall'erba alta del Parco Gramsci.

## Foto vere di Formia dietro le lotte

- **Cosa:** le lotte della storia hanno dietro una foto vera della zona in cui avvengono, scattata da terra. È un po' sbiadita nel colore della pagina, e il credito sta sotto il contatore dei turni (`data/photos.ts`, `photoHtml` in `ui/battle-screen.ts`).
- **Quale foto:** la sceglie `photoFor(mappa, zona)` dalla zona dove si trova Antonio quando parte la lotta.
  | Foto | Zone | Autore | Licenza |
  |---|---|---|---|
  | La spiaggia di Vindicio | Vindicio, Eclipse, pineta | trolvag | CC BY-SA 3.0 |
  | Le peschiere romane sul lungomare | Caposele | Sailko | CC BY 3.0 |
  | Il porto di Formia | porto | Dom dom 70 | pubblico dominio |
  | Formia dalla stazione | centro, piazza della Vittoria, stazione, Lavezzi | Gobbler | CC BY-SA 3.0 |
  | Via Abate Tosti | Mola, Morgana, piazza San Giovanni | Gobbler | CC BY-SA 3.0 |
  | La Porta dell'Orologio | Castellone | Dom dom 70 | pubblico dominio |
  | Formia dal borgo di Maranola | monti, Rio Fresco, campagna, Tomba di Cicerone | Dom dom 70 | pubblico dominio |
  | Il golfo al tramonto da Castellonorato | via Amendola, Acqualonga, Santo Janni, Bruno Zauli, Don Bosco, Parco Gramsci, casa | Dom dom 70 | pubblico dominio |
  | Il porticciolo romano di Gianola | Gianola | Luigi Versaggi | CC BY-SA 2.5 |
- **Licenze:** sono tutte libere, su Wikimedia Commons. Quelle Creative Commons chiedono di citare l'autore e la licenza.
  - In ogni lotta, sotto il contatore dei turni, c'è il credito: titolo, autore, licenza e il link alla pagina del file.
  - Le foto sono solo ridotte e compresse; le CC BY-SA restano sotto la loro licenza.
  - Se ne aggiungi, controlla licenza e autore sulla pagina del file.
- **Formato:** le foto stanno in `src/assets/photos`, ridotte a 880 px (circa 720 KB in tutto). Nella build finiscono incorporate nel file unico.

## Giorno e notte

- **L'ora di Formia** (`story/daytime.ts`): di base è quella di fuori, dall'orologio del dispositivo. Alba e tramonto sono quelli veri di Formia per quel giorno, calcolati da latitudine, longitudine, equazione del tempo e ora legale (il 30 ottobre: 6:38 e 17:00). Il buio cresce da un quarto d'ora prima del tramonto a un'ora dopo, e al contrario all'alba.
- **Dal menu** ("Ora del giorno") si sceglie Come fuori, Giorno, Tramonto o Notte. La scelta sta in `lotte-tra-amici:ora:v1`, sempre in `try/catch`; i salvataggi non si toccano.
- **Il letto di casa** (cartello `sleep` in `casa.ts`, `sleep()` in `ui/story-screen.ts`): quando è buio si dorme fino a domattina e l'ora diventa Giorno; di giorno si fa un pisolino fino a stasera e diventa Notte. Lo schermo sfuma nel colore della notte.
- **Come si disegna** (`drawNight` in `render/world-view.ts`): un foglio di notte (`--m-night`) a un terzo della risoluzione, con buchi sfumati dove c'è luce e una tinta calda (`--m-lamp`) nelle pozze; poi la lampadina di ogni lampione. Al tramonto c'è una velatura arancio (`--m-dusk`). Fanno luce:
  - i lampioni;
  - le porte dei posti (più larga dove c'è vita: Morgana, il bar, Lavezzi, la stazione, l'Eclipse) e di un terzo delle case;
  - torri, chiese, la Tomba di Cicerone e il monumento, illuminati;
  - le finestre: il vetro azzurro delle sprite (`#bfe3ff`, `#e8f5ff`) diventa caldo (`glowOf`), in tutti i posti e in sette case su dieci;
  - il faro, con due fasci che girano sulla baia;
  - un alone intorno ad Antonio, che non si perde mai nel buio.
- **Dentro** (casa, circolo, Morgana) le luci sono sempre accese: niente buio. Di notte i gabbiani dormono.
- **Nei test** l'orologio finto di Playwright segna le 11 di mattina: si gioca di giorno. Per guardare la notte basta mettere `lotte-tra-amici:ora:v1` a `notte`.

## Come gira

- **Lotta:** `ui/battle-screen.ts` chiede al motore gli eventi (`say`, `line`, `expr`, `anim`, `hp`, `sync`, `end`) e li riproduce uno dopo l'altro con una catena di Promise. Il contatore `flow` annulla le riproduzioni vecchie. Le fasi sono `intro → begin → select → busy → begin … → over`. Non c'è un game loop.
- **Storia:** ha un ciclo `requestAnimationFrame` in `ui/story-screen.ts`: `update(now)` (movimento) e poi `drawWorld(now)` (disegno). Il disegno legge soltanto lo stato della storia.
- **Comunicazione tra i moduli:** import diretti. Le variabili condivise vivono nel modulo che le modifica e gli altri le leggono come binding live; dove serve modificarle da fuori ci sono dei setter (`setMap`, `resetProgress`, `halt`, `invalidate`).

## Audio

- **Tutto sintetizzato:** musica ed effetti nascono da oscillatori e rumore, quindi il file singolo resta leggero.
- **Accensione:** l'audio parte acceso, ma il browser lo lascia partire solo dopo il primo tocco o tasto. L'interruttore lo spegne, e la scelta resta in `lotte-tra-amici:audio:v1`; i salvataggi del gioco non si toccano.
- **Musica per schermata:** `home` (avvio, ritorno alla home), `world` (apertura della storia), `battle`/`boss` (inizio lotta), `victory`/`defeat` (risultato, una volta sola).
- **Effetti della lotta:** escono da `cueBattle(ev)`, chiamato per ogni evento riprodotto in `ui/battle-screen.ts`. Il motore non sa niente del suono.
- **Mai `Math.random` nell'audio:** il seme delle lotte nasce da `Math.random`, e un suono non deve cambiare una lotta. Per le piccole variazioni c'è `wobble()` in `synth.ts`.
- **Le creature:** ognuna ha il suo verso, uno per tipo di corpo (`cry-octo`, `cry-bird`, `cry-owl`…). Suona quando la creatura parla in lotta (`stepEvent` in `ui/battle-screen.ts`). Gli incantesimi hanno `magic` e `magicUp`, il retino `net`, la cattura `caught`.
- **Nuovo brano:** aggiungilo in `tracks.ts`, con battute da 16 passi (il test unitario le controlla). `tests/e2e/audio.spec.ts` lo renderizza offline e controlla che non sia muto e non distorca.

## Convenzioni

- **Lingue:** testi del gioco in italiano, commenti del codice in inglese, messaggi di commit in italiano.
- **Colori:** solo token CSS, definiti per il tema chiaro e per quello scuro (`styles/tokens.css`). La mappa usa i token `--m-*`. I personaggi sono "adesivi" a colori fissi con contorno scuro.
- **Ritratti:** nessuna foto nella repo. Sono generati da parametri: pelle, labbra, occhi, sopracciglia, capelli `curls`/`wavy`/`quiff`/`buzz`, vestiti, occhiali, orecchini.
  - Espressioni con `data-expr`: smirk, grin, pout, worried, sleepy, cool.
  - Cuffie di Zendavid con `data-ph`.
- **La UI non conosce le regole:** riproduce gli eventi del motore. Etichette dei pulsanti e bollini arrivano dal motore (`moveLabel`, `chips` dentro `snap`). Questa separazione va mantenuta: è quella che rende possibile Phaser.
- **Stato della lotta:** JSON puro con l'RNG dentro. A parità di seme e di mosse la lotta è identica: su questo si reggono i golden. Nel motore niente `Math.random`, `Date` o DOM.
- **Salvataggi:**
  - chiavi e formati restano quelli di prima (`lotte-tra-amici:storia:v1`, `lotte-tra-amici:libretto:v2`);
  - `localStorage` sempre in `try/catch`, perché nella cornice dell'Artifact può mancare o lanciare errori.
- **Gancio `window.claude.hot`** in `main.ts`: serve all'aggiornamento a caldo dell'Artifact (una lotta aperta sopravvive). Va tenuto.
- **TypeScript strict**, `noUnusedLocals`.
  - Il codice migrato è stato tradotto istruzione per istruzione (molti `var` e `function` sono rimasti): un refactor di stile va fatto a parte, con i golden verdi.
  - `allowJs` resta attivo solo per gli aiuti `.mjs` dei test.

## Bilanciamento

- I valori di `TUNE`, le statistiche in `CHARS` e gli `uses` delle mosse sono tarati con migliaia di lotte simulate, computer contro computer.
- **Obiettivo:** ogni personaggio vince tra il 45% e il 55% in totale, e nessuno scontro singolo supera circa 25/75, salvo rivalità volute. Oggi Costanzo contro Zendavid (84%) e Zendavid contro Forchetta (83%) superano la soglia: sono vantaggi di tipo.
- **Vantaggio di tipo:** conta il tipo del **personaggio**, non quello della mossa. Ciclo Calma → Caos → Cervello → Chiacchiera → Cuore → Calma. Chi ha il vantaggio fa ×1,12 (`TUNE.se`) e subisce ×0,9 (`TUNE.nve`).
- **Mosse con `uses` limitati:** servono a evitare lotte infinite a colpi di cure. Non vanno tolti.
- **Battuta:** l'etichetta dice "40% di far ridere", ma la probabilità è 0,45 e il bilanciamento è stato simulato con 0,45. Se si corregge, va corretta l'etichetta (`battle/labels.ts`), non la probabilità.
- **Creature e livelli della storia:** vanno tarati con `tools/sim-story.ts`.
  - Gli starter battono le selvatiche di pari livello quasi sempre: servono ad allenarsi e catturare.
  - Contro i covi conta il tipo: chi ha il vantaggio vince spesso, chi è svantaggiato deve salire di livello.
  - Le cure delle creature hanno 2 usi, così nessuno vince solo curandosi.
- **Prima di cambiare un numero**, prova con `npm run sim -- '{"antonio":{"atk":95}}'`. Gli override riguardano statistiche, mosse (`{"zendavid":{"moves":{"battuta":{"chance":0.4}}}}`) e `TUNE`. Poi modifica `src/data/`, controlla, e rigenera i golden apposta con `npm run golden`.

## Test

- **Golden** (`npm test`):
  - il motore deve produrre, lotta per lotta, gli stessi eventi, le stesse etichette e lo stesso stato finale;
  - i ritratti, le stesse stringhe SVG;
  - l'arte della mappa, le stesse chiamate al canvas (registrate da un finto contesto 2D).

  Se fallisce un golden e non volevi cambiare nulla, hai cambiato il comportamento.
- **Mappe** (`tests/unit/maps.test.ts`): controlla righe tutte della stessa lunghezza, caratteri noti, persone, cartelli, oggetti e porte raggiungibili, warp e porte su caselle libere, covi e cancelli coerenti.
- **Partite intere** (`npm run test:e2e`): home, lotte contro il computer, Esame, due giocatori, storia (oggetti, covo, circolo, menu), croce touch, salvataggi nel vecchio formato, aggiornamento a caldo.
  - Girano con orologio finto di Playwright, `Math.random` con seme e movimento ridotto, e devono arrivare in fondo senza un errore.
  - Con `SHOTS=1` salvano le schermate in `test-results/shots`.
  - Fino alla conferma della migrazione gli stessi scenari erano confrontati pixel per pixel con il vecchio gioco in un file (`legacy/index.html`, ora eliminato; resta nella storia di git).

## Aggiungere una città

- **Mappa:** un file in `src/data/maps/` con righe tutte della stessa lunghezza, registrato in `maps/index.ts`.
- **Collegamento:** con una porta (`to`, `tx`, `ty`, `tdir` su un edificio) oppure con un `warp`. Gli interni hanno `inside: true` e la `city` di appartenenza.
- **Covo:** l'amico va messo nella mappa con `person` e `covo`. In `data/covi.ts` serve la voce con la spilla e le frasi (`intro`, `win`, `lose`, `after`).
- **Uscite** (`data/gates.ts`): si aprono con tutte le spille della città. Il cancello del treno per Torino è il punto di aggancio della prossima città, che non esiste ancora.
- **Verifica:** `npm test` controlla tutto.

## Se il build torna a essere un Artifact di claude.ai

- **CSP della cornice:** script esterni solo da cdnjs, jsdelivr o unpkg; fogli di stile solo da Google Fonts; niente immagini esterne. Il resto deve essere inline o generato in codice, e Phaser va benissimo incorporato nel bundle singlefile.
- **Font:** dopo la prima pubblicazione va verificato che i font incorporati (`@font-face` con URL `data:`) si carichino davvero nella cornice. Se no, pubblica `dist-google-fonts/index.html`.
- **Limite della pagina:** 16 MB. Oggi il file è di circa 1,5 MB (le foto delle lotte sono quasi 1 MB in base64).
- **Origine nuova:** un nuovo Artifact è una nuova origine, quindi salvataggi e libretto ripartono vuoti.

## Verso Phaser

Le parti che una scena Phaser può sostituire senza toccare il resto:
- `render/world-view.ts` (legge `st`, `M`, `mover`, `parity`) con l'arte di `render/canvas/`;
- poi `ui/battle-screen.ts` ed `effects.ts` per la lotta, continuando a riprodurre gli stessi eventi del motore.

Motore, dati, logica della storia e salvataggi restano come sono.
