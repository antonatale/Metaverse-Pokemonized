# Lavoro ancora aperto

Unica lista delle migliorie future. Le attività concluse sono state tolte; l'implementazione corrente è descritta in `gioco.md`. Nessuna voce autorizza a partire senza una richiesta di Antonio.

## Adesso: qualità dei personaggi

Codex prepara idee, narrazione e grafiche di tutti; Opus integrerà quando Antonio lo chiederà. Materiali e stato di ciascuno in `design/personaggi/README.md`. Il prototipo di Costanzo, Claudia e Valentin è una patch non applicata. Valutare ogni proposta contro mosse, statistiche, forme e relazioni esistenti; Claudia è nuova. Il set di riferimento comprende le tre forme di tutti e sei.

## Prima di aggiungere sistemi

1. **La Formia grande, da guardare.** Antonio gioca la mappa nuova e dice cosa spostare (centro fra Castellone e Largo Paone, Mola, i due lungomare); confronto con la vista satellitare di Parco la Fontana, Zauli e piazza San Giovanni (Google Earth non è stato aperto: le posizioni vengono da OpenStreetMap). `npm run test:e2e` e `npm run perf` sul Mac. La tribuna dello Zauli va ridisegnata da una foto. I monti in alto a sinistra (90×70 caselle chiuse) possono ospitare un altro sentiero. Motorino, idee non fatte: giro di pista cronometrato, casco, fari di notte, selvatici che scappano al rumore, una consegna come attività, richiamarlo quando è lontano.
2. **Percorso e densità.** Legare i tre sentieri, la Rotabile e Scauri alle tappe effettive e rimisurare; le otto schermate vuote rimaste sono bordi di monti e mare. Nei posti nuovi non ci sono allenatori. Obiettivi precedenti da verificare sul codice corrente: massimo sei schermate vuote; chi segue solo la freccia incontra almeno dieci selvatiche e sei allenatori prima di Mamurra. File: `story/goals.ts`, `tools/formia/network.ts`, `build.ts`; strumenti `density`, `playtest`.
3. **Castellone e salite.** Riorganizzare lo spazio fra borgo e Appia per muro, salita e belvedere dalla Torre. Conservare l'accesso a tutte le tappe da ciascuna casa. Il rilievo numerico per casella serve solo se il disegno delle ombre lo richiede; gradoni e salti esistono già.
4. **Curva della partita.** Costruire una tabella tappa → livelli attesi → dimensione della squadra, includendo i sette allenatori dei sentieri. Riempire il salto verso Mamurra; valutare una terza mossa iniziale e una crescita più percepibile soltanto dopo simulazione. Il caffè ha già un tetto: non rifare quella correzione. Obiettivo: tutti i 18 abbinamenti protagonista/iniziale raggiungono il treno senza comprare livelli; controllare le tappe sotto il 50% di vittorie del giocatore prudente.
5. **Golden delle lotte vere.** Aggiungere un riferimento deterministico per squadre, cambi, stati, oggetti, abilità, leggende a parti e capo ultimo. Solo dopo decidere la rimozione di Esame e modalità storiche: oggi servono ancora alla copertura dei test e alla compatibilità.
6. **Descrizioni fedeli al motore.** Costanzo: testo «Non ti fa parlare» 20%, motore 25%; la correzione è nella proposta non applicata. Andrea: testo Calcolatore −30%, `TUNE.calc = 0.8` applica −20%. Correggere il testo, oppure motivare un vero cambio di taratura con i simulatori. Non confondere una descrizione sbagliata con una regola da sostituire.

## Esperimenti da decidere con Antonio

- **Intento e leggibilità dei tipi.** Dopo la curva, provare su un ramo una categoria onesta dell'azione avversaria (attacco, difesa, cura, preparazione, cambio), senza rivelare sempre la mossa. Allenatori, capi e leggende per primi; selvatiche solo con abilità o lettura. Confrontare anche un vantaggio di tipo più percepibile e duelli di 8–10 turni. Misurare `sim:fun` e `sim-story` prima/dopo e consegnare una build da valutare; i moltiplicatori proposti nei vecchi piani non sono valori approvati.
- **Legami con gli amici.** Tre gradini costruiti su attività già esistenti: storia/regalo, insegnamento di una mossa compatibile, spalla una volta per lotta. Dovrebbero sostituire le missioni ridondanti, senza riportare tutti in squadra. Dialoghi e contenuti da definire con Antonio; Mamurra e Lamo devono restare equilibrati con la squadra del percorso. La Trinità e la rivalità Claudia–Costanzo rientrano in questo lavoro, non in una trama che sostituisce le pietre.
- **Una dote per protagonista.** Proposte da rivedere insieme alla qualità dei personaggi: Antonio legge gli incontri; Costanzo tratta e convince; Andrea vede probabilità e danni; Valentin richiama incontri; Forchetta conosce luoghi e scorciatoie; Zendavid calma e favorisce il legame. Non sono regole attive né approvate. Una dote a testa, visibile alla scelta iniziale, con difficoltà confrontabile tramite `sim-covi` e playtest.

## Migliorie di presentazione da scegliere

- Strade e terreno: segnaletica, bordi, auto parcheggiate senza bloccare passaggi, macere, orti, spiaggia bagnata. Controllo visivo prima/dopo, golden aggiornati solo apposta.
- Vita ambientale: treno sui binari e passaggi a livello, traghetto in movimento, panni e bandiere, erba che si piega. Eventuali meteo restano solo visivi finché non c'è una decisione sulle lotte. Tutto deve rispettare Grafica Bassa e movimento ridotto.
- Omini: più pose e tempi di camminata, sguardi e nuvolette che anticipino un'interazione, passi diversi delle creature. Ritratti di Tullio e figure della trama nei dialoghi: l'aspetto di Tullio è in `tools/tullio.ts`.
- Suono dei luoghi: mare, cicale, grilli, campane e passi secondo terreno e distanza, sintetizzati senza consumare RNG della lotta. Verificare ogni fatto locale nuovo.
- Impatto dei colpi e transizione dalla mappa: breve arresto, scossa, lampo, barra PS in due tempi; adattare alla velocità e all'accessibilità già presenti. Proteggere ogni nuova scena con `safeShow`.
- Mappa a schermo intero come estensione del menu, se Antonio la considera utile; le finestre da PC e lo schermo intero del gioco esistono già.

## Dopo che Formia regge

- Campione della partita precedente: la squadra finale di una storia sfida il protagonista della successiva, senza server. Valutare poi squadre condivise con link e una cartolina esportabile dell'epilogo.
- Trasferire da `ui/story-screen.ts` a `story/` le regole rimaste su incontri, allenatori, preparazione/fine delle lotte, torneo e premi, una parte verificabile alla volta. Eventuale formattazione generale in un cambiamento separato, con golden identici.
- Torino/Milano/Chicago come capitoli veri, calendario e missioni cittadine aggiuntive solo dopo il completamento e la verifica di Formia. Non aggiungere ora altri tipi, stati o specie per compensare problemi del percorso.

Niente migrazione a Phaser/3D, modalità giornaliera già rimossa o un nuovo trailer senza richiesta: sono direzioni escluse o superate, non backlog da riaprire.
