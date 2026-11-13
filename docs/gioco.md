# Il gioco attuale

Questa pagina descrive la versione attiva; le proposte per i personaggi stanno in `design/personaggi/`.

## Percorso della partita

Dal titolo si sceglie uno dei sette amici (l'ultima arrivata, Claudia, ha il nastro NEW) e si parte da casa sua, con il solo protagonista nella compagnia. Cicerone si presenta a casa e annuncia un rivale senza dire chi è: lo si scopre a Gianola. Poi vibra il telefono: nel gruppo «il caminetto» gli amici parlano del giorno delle creature (`data/chat.ts`, chat `inizio`). Nicola Spadea passa con il furgone: la guardaparco di Gianola lo ha chiamato, a Gianola si arriva dal mare e i windsurf sono all'Eclipse. Il viaggio per le vie vere è lento e Nicola racconta Formia: i Lestrigoni, i massi del porto, Mamurra, il libeccio (`RIDE_TALK` in `data/nicola.ts`, sottotitoli sotto il furgone; `ui/nicola.ts`, `story/van.ts`). All'Eclipse si scende alla riva, Nicola presenta Faro, il suo Delfaro che salta in acqua (un `npc` con `mon`), e gli fa fare un'idropompa sulla tavola vecchia che galleggia lì davanti: la tavola vola via e cade al largo (`pump` in `story/lead.ts`, disegno in `render/world-view.ts`). Poi presta un windsurf e fa strada: si segue la sua vela rossa intorno al golfo, fra le boe di Vindicio, davanti al porto, fino a Mola, lungo Acqualonga e giù fino alla spiaggia dei Sassolini (`WS_ROUTE` in `data/nicola.ts`, `story/lead.ts`). Se si resta indietro Nicola si ferma e aspetta; in alcuni punti grida qualcosa sul posto. Il windsurf accelera sui rettilinei (`WIND` in `story/movement.ts`); la freccia della tappa sta sopra Nicola. A terra a Gianola Nicola saluta e torna indietro col windsurf da solo; se si sbarca prima avvisa che Gianola è più a est. La guardaparco (una donna, `LOOKS.guardaparco`) scende in spiaggia, affida la prima creatura, e subito dopo arriva il rivale. Si costruisce la squadra, si conquistano i sei covi degli altri amici, si seguono Cicerone e le Pietre di Telepilo, si affrontano Mamurra e le leggende. Il treno porta nell'atrio della seconda città; il seguito non è ancora un capitolo giocabile.

`story/goals.ts` filtra le tappe secondo chi si gioca e indica la prossima nell'HUD, sulla mappa e nel menu. Le tappe future restano nascoste. Il rivale è uno degli altri amici, estratto a caso a ogni storia nuova (`story/rival-who.ts`, `st.rivalFriend`; le storie che avevano già incontrato Tullio lo tengono): sceglie la creatura in vantaggio sull'iniziale del protagonista, porta con sé la creatura con cui si unisce alla squadra, parla con la sua voce (`data/rival-lines.ts`) e il suo covo è sempre l'ultima spilla di Formia: si apre solo dopo le altre. La storia contiene scelte persistenti che cambiano il rapporto con il rivale, il destino delle pietre e l'epilogo. Ai momenti chiave vibra il telefono e si apre «il caminetto», la chat del gruppo (`data/chat.ts`, `ui/chat.ts`): un telefono disegnato, con «sta scrivendo…», le bolle con faccia e nome nel colore di ciascuno, e alla fine tre risposte fra cui scegliere. Ogni amico, tranne chi si gioca, scrive la sua. Il telefono si riapre quando si vuole (tasto T o il bottone in alto) per rileggere tutta la chat; le risposte date restano (`st.chats`).

I dialoghi stanno su una pergamena che si srotola (`ui/rich.ts`): i nomi degli amici in grassetto nel loro colore, luoghi, creature e persone di Formia in grassetto rosso scuro, le parole fra asterischi evidenziate, le parole in MAIUSCOLO che tremano. Il testo scorre con pause alle virgole e ai punti e ognuno parla con una voce sintetizzata sua (`voiceBlip` in `audio/sfx.ts`); accanto c'è il ritratto di chi parla (gli amici, Nicola, la guardaparco, Tullio).

| Protagonista | Tipo | Covo | Treno |
|---|---|---|---|
| Antonio | Cervello | Palamendola | Torino |
| Costanzo | Chiacchiera | Piazza della Vittoria | Milano |
| Andrea | Cervello | Padel del Bruno Zauli | Milano |
| Valentin | Caos | Eclipse | Torino |
| Forchetta | Calma | Tennis coperti del Bruno Zauli | Torino |
| Zendavid | Cuore | Pineta | Torino |
| Claudia | Calma | Birreria Morgana (Mola) | Torino |

Claudia abita a San Giulio, in via Palazzo, di fronte alla scuola Mattej e al parchetto con gli alberi e le altalene; il suo ritratto viene dalla sua foto (frangia e caschetto neri, cerchi d'argento, piercing al setto, top nero e ciondolo). Sopra le case degli amici c'è scritto «Casa di …»; il nome della via sta su una targa all'angolo, leggibile sulla mappa (`streetPlate`).

**Nicola Spadea** (`data/nicola.ts`) dopo il viaggio cammina dietro al protagonista: parlandogli dà un passaggio col furgone verso spiagge e piazze (il furgone guida per le strade, la camera lo segue, si può saltare il viaggio), racconta spiagge e mare; il windsurf prestato all'inizio resta al protagonista. Congedato torna all'Eclipse, dove si può richiamare.

Gli amici mantengono case, dialoghi specifici, attività e missioni personali. I covi usano le creature: il capo ne schiera due nei primi due covi affrontati, tre dal terzo, e scende in campo per ultimo. Il livello dei capi parte da 6 e cresce di 3 per ogni spilla già ottenuta. Le squadre sono tarate in `data/covi.ts` e `story/covo-crew.ts`. Il proprio covo non va affrontato. Il torneo degli amici conserva i duelli fra persone.

## Combattimento e crescita

Il motore ha stato JSON con seme: stesse scelte e stesso seme producono gli stessi eventi. Lotte di squadra con cambio, panchina, guardia, oggetti, abilità, stati, terreno, Slancio, Risonanza e capo che interviene dopo le sue creature. Le leggende possono avere più parti. I numeri effettivi sono in `data/tuning.ts`; le mosse in `characters.ts`, `people.ts` e `creatures.ts`.

I cinque tipi delle persone formano il ciclo Calma → Caos → Cervello → Chiacchiera → Cuore → Calma. Le creature hanno anche Corrente, Calore, Cielo, Corazza e Crepuscolo, una tabella propria e talvolta due tipi. Oltre alla confusione esistono Colpo di sole, Siesta e Rete. Le abilità delle creature sono descritte a dati e attivate dai ganci del motore.

I valori base delle persone corrispondono al livello 5. Nella storia conoscono due mosse al 5, aggiungono le classiche al 7 e al 10, poi mosse proprie al 14, 20 e 26. Le forme cambiano al 14 e al 26; si equipaggiano quattro mosse e si sceglie quale sostituire. Le lotte libere di riferimento mantengono le quattro mosse classiche fin dall'inizio. Le carte delle mosse degli amici hanno lo stesso formato di quelle delle creature (tipo, potenza, precisione, efficacia); ogni mossa ha una scena propria in `ui/friend-moves.ts`, avviata dal segno `act` del motore. Livelli, esperienza e forme sono applicati da `story/growth.ts`, non dalla UI.

Le tre iniziali sono Polpino, Ramarrino e Gabbì. Hanno tre forme, mosse caratteristiche e un legame necessario all'ultima evoluzione. Per compatibilità gli ID interni di alcune forme differiscono dal nome mostrato. Le creature hanno livello, carattere, mosse, oggetto tenuto, legame, eventuale soprannome e variante dorata; quelle fuori squadra aspettano a casa. Le catture usano retini diversi e si registrano nel diario.

Il protagonista dispone dell'albero abilità a tre rami: esplorazione, allenamento e vita a Formia. Alcune descrizioni citano ancora Antonio. Gli oggetti persi sono una particolarità di Antonio: ritrovarli impedisce di perderli nelle lotte della storia. L'economia usa sesterzi, negozi e attività; il caffè dà esperienza con un tetto legato al prossimo covo. Non confondere i testi delle descrizioni con i numeri effettivi del motore: le incongruenze note sono nella roadmap.

## Mondo, interfaccia e suono

Formia deriva da dati OpenStreetMap adattati alla giocabilità. Ci sono interni, tre sentieri, il mare aperto (si nuota con una creatura o si va in windsurf con quello di Nicola: boe, un belvedere su una boa, bottiglie con messaggi, incontri e allenatori al largo), salti a senso unico, belvedere, enigmi, incontri in erba e scogli, pesca e attività con gli amici. Largo Paone ha il Tabacchi Altieri e Telaro, Mola ha Barber May: si entra in tutti e due i negozi. Le case dei sette hanno piante e oggetti diversi.

**Il motorino** è un Liberty blu con il bauletto, uno solo, parcheggiato accanto alla casa di chi si gioca. Invio davanti al motorino per salire, Invio per scendere (resta dove lo si lascia: `st.moto`, `st.sella`). Sui rettilinei sale di marcia (cinque, `GEARS` in `story/movement.ts`), in curva ne perde due; Invio in corsa suona. La creatura sta sulla sella dietro. Non va su scale, sabbia, erba alta, salti e non entra nelle porte (`rideable` in `story/maps.ts`). Disegno in `render/canvas/moto.ts`. A piedi la creatura che segue è disegnata a 44 px (`FOLLOWER`). I poteri delle creature consentono nuoto, scalata e vista dall'alto. L'ora vera o scelta dal menu cambia luce, musica e alcuni incontri.

Stile quaderno a penna ed evidenziatori. Ritratti e creature sono SVG generati da codice; terreno e omini sono canvas 2D. Grafica Alta aggiunge ombre, luce, vento, risacca e animali; Bassa usa la mappa semplice. Movimento ridotto ferma gli effetti ambientali. Tastiera e clic muovono il personaggio; M apre il menu, C richiama Cicerone, F attiva lo schermo intero. Ci sono comandi touch e tre velocità di lotta. L'audio è sintetizzato con Web Audio e parte al primo gesto dell'utente; non contiene file musicali da scaricare.

## Persistenza

Tre storie locali: `lotte-tra-amici:storia:v1`, `:v1:2`, `:v1:3`; la selezione è `lotte-tra-amici:slot:v1`. Esportazione/importazione e copia di riserva sono implementate. La storia ricorda anche flag, scelte, attività, catture e luoghi visitati.

`save/story-progress.ts` contiene le migrazioni ordinate; l'ultima della mappa è `formia10`; una storia nuova nasce con tutte le migrazioni già viste. I vecchi salvataggi con più amici continuano a essere leggibili: le funzioni di compatibilità non vanno eliminate solo perché il percorso nuovo parte da un protagonista. Su un'altra origine o browser occorre importare il salvataggio. Ogni nuovo campo resta facoltativo.
