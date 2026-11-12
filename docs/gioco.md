# Il gioco attuale

Questa pagina descrive la versione attiva; le proposte per i personaggi stanno in `design/personaggi/`.

## Percorso della partita

Dal titolo si sceglie uno dei sei amici e si parte da casa sua, con il solo protagonista nella compagnia. Il guardaparco di Gianola affida la prima creatura. Si costruisce la squadra, si conquistano i cinque covi degli altri amici, si seguono Cicerone e le Pietre di Telepilo, si affrontano Mamurra e le leggende. Il treno porta nell'atrio della seconda città; il seguito non è ancora un capitolo giocabile.

`story/goals.ts` filtra le tappe secondo chi si gioca e indica la prossima nell'HUD, sulla mappa e nel menu. Le tappe future restano nascoste. Il rivale Tullio sceglie la creatura in vantaggio sull'iniziale del protagonista. La storia contiene scelte persistenti che cambiano il rapporto con lui, il destino delle pietre e l'epilogo.

| Protagonista | Tipo | Covo | Treno |
|---|---|---|---|
| Antonio | Cervello | Palamendola | Torino |
| Costanzo | Chiacchiera | Piazza della Vittoria | Milano |
| Andrea | Cervello | Padel del Bruno Zauli | Milano |
| Valentin | Caos | Eclipse | Torino |
| Forchetta | Calma | Tennis coperti del Bruno Zauli | Torino |
| Zendavid | Cuore | Pineta | Torino |

Gli amici mantengono case, dialoghi specifici, attività e missioni personali. I covi usano le creature: il capo ne schiera due nei primi due covi affrontati, tre dal terzo, e scende in campo per ultimo. Il livello dei capi parte da 6 e cresce di 3 per ogni spilla già ottenuta. Le squadre sono tarate in `data/covi.ts` e `story/covo-crew.ts`. Il proprio covo non va affrontato. Il torneo degli amici conserva i duelli fra persone.

## Combattimento e crescita

Il motore ha stato JSON con seme: stesse scelte e stesso seme producono gli stessi eventi. Lotte di squadra con cambio, panchina, guardia, oggetti, abilità, stati, terreno, Slancio, Risonanza e capo che interviene dopo le sue creature. Le leggende possono avere più parti. I numeri effettivi sono in `data/tuning.ts`; le mosse in `characters.ts`, `people.ts` e `creatures.ts`.

I cinque tipi delle persone formano il ciclo Calma → Caos → Cervello → Chiacchiera → Cuore → Calma. Le creature hanno anche Corrente, Calore, Cielo, Corazza e Crepuscolo, una tabella propria e talvolta due tipi. Oltre alla confusione esistono Colpo di sole, Siesta e Rete. Le abilità delle creature sono descritte a dati e attivate dai ganci del motore.

I valori base delle persone corrispondono al livello 5. Nella storia conoscono due mosse al 5, aggiungono le classiche al 7 e al 10, poi mosse proprie al 14, 20 e 26. Le forme cambiano al 14 e al 26; si equipaggiano quattro mosse e si sceglie quale sostituire. Le lotte libere di riferimento mantengono le quattro mosse classiche fin dall'inizio. Livelli, esperienza e forme sono applicati da `story/growth.ts`, non dalla UI.

Le tre iniziali sono Polpino, Ramarrino e Gabbì. Hanno tre forme, mosse caratteristiche e un legame necessario all'ultima evoluzione. Per compatibilità gli ID interni di alcune forme differiscono dal nome mostrato. Le creature hanno livello, carattere, mosse, oggetto tenuto, legame, eventuale soprannome e variante dorata; quelle fuori squadra aspettano a casa. Le catture usano retini diversi e si registrano nel diario.

Il protagonista dispone dell'albero abilità a tre rami: esplorazione, allenamento e vita a Formia. Alcune descrizioni citano ancora Antonio. Gli oggetti persi sono una particolarità di Antonio: ritrovarli impedisce di perderli nelle lotte della storia. L'economia usa sesterzi, negozi e attività; il caffè dà esperienza con un tetto legato al prossimo covo. Non confondere i testi delle descrizioni con i numeri effettivi del motore: le incongruenze note sono nella roadmap.

## Mondo, interfaccia e suono

Formia deriva da dati OpenStreetMap adattati alla giocabilità. Ci sono interni, tre sentieri, salti a senso unico, belvedere, enigmi, incontri in erba e scogli, pesca, motorino e attività con gli amici. I poteri delle creature consentono nuoto, scalata e vista dall'alto. L'ora vera o scelta dal menu cambia luce, musica e alcuni incontri.

Stile quaderno a penna ed evidenziatori. Ritratti e creature sono SVG generati da codice; terreno e omini sono canvas 2D. Grafica Alta aggiunge ombre, luce, vento, risacca e animali; Bassa usa la mappa semplice. Movimento ridotto ferma gli effetti ambientali. Tastiera e clic muovono il personaggio; M apre il menu, C richiama Cicerone, F attiva lo schermo intero. Ci sono comandi touch e tre velocità di lotta. L'audio è sintetizzato con Web Audio e parte al primo gesto dell'utente; non contiene file musicali da scaricare.

## Persistenza

Tre storie locali: `lotte-tra-amici:storia:v1`, `:v1:2`, `:v1:3`; la selezione è `lotte-tra-amici:slot:v1`. Esportazione/importazione e copia di riserva sono implementate. La storia ricorda anche flag, scelte, attività, catture e luoghi visitati.

`save/story-progress.ts` contiene le migrazioni ordinate; l'ultima della mappa è `formia7`. I vecchi salvataggi con più amici continuano a essere leggibili: le funzioni di compatibilità non vanno eliminate solo perché il percorso nuovo parte da un protagonista. Su un'altra origine o browser occorre importare il salvataggio. Ogni nuovo campo resta facoltativo.
