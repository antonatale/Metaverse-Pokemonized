# La mappa di Formia

## Base geografica attuale — 11 novembre 2026

La revisione richiesta da Antonio usa **20 metri per casella nei due assi**, con nord in alto, da Vindicio a Scauri. La mappa è larga 670 e alta 210 caselle. Il settore a nord di 41.275° comprime la salita da Maranola al Redentore: è un itinerario di gioco, non una carta escursionistica in scala. Edifici, porte e arredi conservano ingombri minimi leggibili: la scala del territorio non implica un rilievo architettonico esatto.

- `src/data/maps/formia-projection.ts`: proiezione e scala; `legacyTile` converte soltanto i vecchi punti narrativi ancora scritti sulla griglia precedente.
- `tools/formia/osm-extract.json`: costa, strade, ferrovia, verde e impianti OSM. La nuova rete usa le polilinee originali; non le sostituisce con un rettangolo di strade ortogonali.
- `tools/formia/survey-osm.json`: sagome rilevate attorno a via Amendola. Le sette palazzine aggiuntive di Parco la Fontana hanno ID stabili; la palazzina di Antonio è distinta.
- `tools/formia/survey-centre.json`: sagome e punti del centro, aggiornati dall'API OSM.
- `tools/formia/network.ts`: rete stradale proiettata e itinerari dei rilievi. Le strade isolate fuori dalla rete principale sono sentieri; i vicoli ciechi reali finiscono su un accesso lastricato.
- `src/data/maps/formia-places.ts`: luoghi con coordinate, dimensioni e persone. I luoghi si spostano al massimo di poche caselle per aprire la porta su terreno raggiungibile; `drift.ts` rende visibili questi adattamenti.
- `tools/formia/build.ts`: generatore riproducibile. Colloca luoghi, palazzine, giardino, superfici sportive, persone, targhe e lampioni; verifica gli accessi prima di scrivere `formia-ground.ts`.

Le fonti, gli URL e le approssimazioni sono in [fonti-formia.md](fonti-formia.md), sezione «Revisione geografica».

## Luoghi della revisione

Parco la Fontana comprende la palazzina di Antonio al piano terra, giardino privato, siepe, cancello percorribile, giardino comune circolare con fontana centrale e sette altre palazzine ricavate dalle sagome del complesso. Le posizioni dei singoli appartamenti e il giardino seguono Antonio e restano da affinare con riferimenti privati. Il Palamendola è separato, a nord.

Il CONI occupa la sua posizione reale, più a est di San Giovanni: pista nord–sud, sei corsie e rettilineo con otto, campo centrale, tribuna, tennis coperti e scoperti, padel e beach arena. La superficie della pista è `7` (`running`), percorribile; il bordo curvo e le linee sono disegnati nello stesso rettangolo della superficie. Nessun edificio o albero può occupare la pista.

San Giovanni usa coordinate corrette e un nuovo prospetto in mattoni con grande arco e oculo. La casa di Costanzo è una palazzina sul lato destro e più in alto; via Solaro segue la polilinea OSM. Via Abate Tosti, via Vitruvio, via Ferrucci, piazza Risorgimento e ospedale Dono Svizzero sono identificabili sulla rete geografica.

Largo Paone è una piazza distinta. Qui c'è il Tabacchi Altieri, con un interno e i nonni e zio Lele (pelato). Telaro è in via Tullia. Barber May ha insegna, palo da barbiere e salone visitabile. Gli interni dei due negozi sono interpretazioni di gioco, non ricostruzioni fotografiche certificate.

Vindicio e Gianola seguono i rispettivi lungomare e le curve della costa. L'Eclipse ha una posizione corretta dal suo collegamento Maps, accessi, gazebo, arredi, corridoio per le tavole e Nicola. Il suo dialogo usa fatti del profilo ufficiale; la lezione mostra raffiche, direzione del vento e un rig più dettagliato. Gli ombrelloni sulla mappa rappresentano il lido con simboli distanziati, non tutte le postazioni commerciali.

L'eremo di San Michele è una facciata di pietra incassata nella rupe, con rosone, portale acuto e corpi laterali, raggiungibile dall'itinerario montano.

## Case e salvataggi

`homes.ts` contiene cinque piante diverse: Valentin ha zona festa verde e casse; Costanzo studio, giornali e Roma; Forchetta coppe e racchetta; Andrea attrezzi e spazio per allenarsi; Zendavid console e casse da DJ. Antonio mantiene robotica e giardino al piano terra. Gli oggetti visibili accompagnano le descrizioni; queste stanze sono caratterizzazioni narrative. `MapDef.homeSpots` definisce dove aspettano le creature, evitando muri e arredi di ciascuna pianta.

La migrazione `formia8` riporta a casa chi era all'aperto sulla vecchia mappa, mantenendo squadra e progressi. Chi aveva salvato in una casa con la pianta modificata viene ricollocato al suo ingresso. Le chiavi di salvataggio non cambiano.

## Disegno e controlli

Il terreno è dipinto in pezzi di 12 caselle (`render/world-view.ts`), con texture continue, contorni arrotondati e rilievi. Oggetti e persone sono ordinati per profondità. Luci, vento, animali e ombre restano in `render/atmosphere.ts`; Grafica: Bassa li spegne e «riduci il movimento» li ferma. I nuovi colori usano token CSS, incluso il laterizio di San Giovanni.

Le vedute complete sono limitate a 4096 pixel per lato per evitare canvas giganteschi. I golden delle mappe grandi lavorano sugli stessi pezzi da 12 caselle del gioco, coprendo tutta la mappa senza conservare un unico enorme registro in memoria.

```sh
npx tsx tools/formia/build.ts
npx tsx tools/formia/audit.ts
npx tsx tools/formia/drift.ts
npx tsx tools/formia/density.ts
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Il generatore fallisce se un luogo non trova posto o un accesso importante resta isolato. I test controllano anche tutte le porte, le persone, i cartelli, gli oggetti, le case, i salti e i belvedere. Per la densità si confronta la **percentuale** di schermate vuote con la mappa precedente (8 su 47), dato che l'estensione è aumentata di oltre otto volte; resta il limite del 18% di terreno percorribile a più di dieci passi da qualcosa da fare. Dopo una modifica intenzionale al disegno si aggiorna `npm run golden`.

`FORMIA_POWERS` conserva ingresso del bacino, anfora e tratto scalabile delle mura come punti nominati, invece di lasciare coordinate numeriche della vecchia griglia nel gioco o nei test. Le peschiere e il segmento di mura sono simboli giocabili nei rispettivi siti; gli accessi restano verificati. I test dei salvataggi usano le nuove posizioni, mentre gli scenari di migrazione storica conservano intenzionalmente salvataggi delle versioni precedenti.

Il percorso automatico preferisce passaggi senza incontri selvatici per raggiungere luoghi della città. I punti di erba alta e le pozze restano raggiungibili intenzionalmente.
