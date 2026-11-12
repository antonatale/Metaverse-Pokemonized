# Specifica in revisione

Questa è una proposta separata dal gioco. Il prototipo è stato provato e poi ritirato dal runtime su richiesta di Antonio. La patch ne conserva l'implementazione; le idee restano da migliorare e approvare insieme agli altri personaggi.

## Fatti dell'implementazione esistente

Sei protagonisti, con mosse, passive, debolezze e progressione già complete. Numeri base al livello 5:

| Chi | Tipo | PS / Attacco / Difesa / Velocità |
|---|---|---|
| Antonio | Cervello | 104 / 118 / 76 / 110 |
| Costanzo | Chiacchiera | 105 / 100 / 86 / 95 |
| Andrea | Cervello | 100 / 98 / 85 / 100 |
| Valentin | Caos | 104 / 95 / 80 / 105 |
| Forchetta | Calma | 108 / 96 / 92 / 75 |
| Zendavid | Cuore | 108 / 100 / 86 / 90 |

I personaggi apprendono mosse al 5, 7, 10, 14, 20 e 26; le forme cambiano al 14 e 26. Le quattro mosse equipaggiate, le squadre dei covi e i bonus delle forme esistono già. Fonti principali: `src/data/characters.ts`, `people.ts`, `covi.ts`, `tuning.ts`, `src/story/growth.ts` e `src/battle/`. Claudia era assente.

### Costanzo: conservare il nucleo

Er Politico, Chiacchiera. Comizio (potenza 50); Personaggismo (contro-tipo per 3 turni); Difesa del Bidet (+25 PS, pulizia degli effetti negativi, 3 usi); Daje Roma Daje (potenza 70, precisione 80%). «Non ti fa parlare» usa il 25% nel motore ma dichiara il 20% nel testo. «La fissa» penalizza il cambio di attacco del 20% e rende critico ogni terzo attacco identico consecutivo. Nella storia arrivano Mozione di Sfiducia, Decreto d'Urgenza, Elezioni Anticipate; forme L'Onorevole ed Er Presidente. Non sostituirle con un kit nuovo.

### Valentin: conservare il nucleo

Caos, Anima della festa (+5 PS a fine turno), Animale anomalo (15% di cambiare mossa). Weee, Manipolazione a Fin di Bene, Volo per Copenhagen e King del Verde; nella storia Trenino, Afterparty e La Festa dell'Anno. Forme L'Animale e Il King del Verde. La spiritualità amplia questa identità, non richiede un altro tipo o nuove statistiche arbitrarie.

## Nuove informazioni date da Antonio

- **Costanzo contro Claudia/Diabolica:** è un antagonismo ideologico. Secondo lui Claudia ha portato il gruppo sulla cattiva strada con la cannabis. La narrazione deve attribuire il giudizio a lui, non presentarlo come fatto oggettivo. Ritardi, lunghissime pause in bagno e al bidet, episodio del camminare contro i muri, spiegazioni interminabili; ossessioni per capelli, stempia e calvizie, Roma, politica, legalità e moralità.
- **Trinità:** Claudia = Padre, Antonio = Figlio, Valentin = Spirito. Valentin è l'anima della festa, spiritualmente sviluppato, quello che parla meno ma ha più da dire.
- **Inseguimento 1 e 2:** titoli leggendari dei suoi racconti. Temeva di essere fermato dalla polizia e si allontanava in macchina; non era stato fermato. Evitare di trasformare il racconto in un inseguimento reale confermato.
- **Valentin:** drummini, reel AI, Italian brainrot e cannabis; chiama Antonio «Broccolio».

## Proposta grafica di Costanzo

La foto è stata effettivamente consultata. Tratti osservabili: capelli castani mossi di media lunghezza, nessun occhiale permanente, completo blu petrolio, camicia bianca, papillon scuro a piccoli motivi, spilla rossa. Gli SVG proposti conservano volto, espressioni e stile del generatore originale. La base riprende il completo della foto; l'Onorevole mantiene la cravatta e il Presidente fascia e alloro. I capelli restano presenti: l'ossessione per la calvizie non autorizza a inventare una calvizie visibile.

Il prototipo allineava anche l'omino della mappa, che nella versione attuale ha ancora occhiali incoerenti col ritratto. La foto personale non è copiata nel repository. Gli SVG sono autonomi ed editabili; `grafica/anteprime/costanzo-ritratti.png` conserva la tavola mostrata.

## Proposta narrativa sperimentata

Claudia appare da Morgana come personaggio narrativo. Aspetto dello sprite provvisorio: mancano un suo riferimento visivo e un design approvato. Nessun settimo protagonista, statistiche, mosse o evoluzioni inventate nel prototipo.

Dopo il covo della piazza, parlando con Claudia si può avviare o rimandare la scena; se si gioca Costanzo è disponibile subito. Costanzo espone la sua critica, Claudia risponde, Valentin interviene con un breve vocale per Antonio/Broccolio. La scelta è parlare uno alla volta oppure, per quella sera, stare a tavoli separati. Il dissenso resta. Entrambi gli esiti cambiano risposte successive ed epilogo, usando flag `st.seen` esistenti, senza ricompense che alterino il bilanciamento. La scena è facoltativa e compatibile coi salvataggi precedenti.

Il prototipo aggiungeva inoltre i nuovi dettagli a case, dialoghi del covo e descrizioni delle forme. Manteneva mosse, statistiche e trama principale: la Trinità è il nome del trio, non una riscrittura dell'origine delle pietre o un sostituto di Mamurra. Per una versione migliore valutare un secondo episodio che reagisca alla prima scelta e una scena in cui Valentin ascolta dopo la festa. Un'eventuale Claudia combattente richiede prima un ruolo, una progressione e una taratura veri.

## Misure e limiti

La simulazione dei 30.000 duelli fra amici dava Costanzo 53,3% e Valentin 50,1% di vittorie complessive. Esistono asimmetrie preesistenti, soprattutto Costanzo–Zendavid 84,1–15,9%; non correggerle senza confrontare duelli liberi, squadre dei covi e partite reali.

Prima del ritiro il prototipo passava 408 test unitari e 43 prove complete; le 2.040 lotte di riferimento restavano identiche. Questi risultati documentano quell'esperimento, non garantiscono una futura integrazione diversa. Ora `src/` e i test attivi sono tornati alla base precedente; la patch è stata verificata con `git apply --check`, senza applicarla.
