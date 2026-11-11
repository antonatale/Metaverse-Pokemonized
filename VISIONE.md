# Visione dell'11 novembre 2026: il livello dopo

Antonio ha chiesto di essere ambiziosi: idee prese dai grandi giochi, decisioni prese, e una base su cui Opus possa lavorare e finire. Questo documento viene dopo `REVISIONE.md` e non la sostituisce: la revisione dice cosa non regge, questa dice dove portare il gioco quando regge. Le task hanno la sigla V (V1, V2…) e lo stesso formato delle R.

**Su cosa è fatta:** `main` al commit `6d1f9b8` (11 novembre, dopo R5, R10, R16, R18, R19). Ho letto codice e documenti, costruito il gioco, guardato la mappa intera e una ventina di schermate a 1366×768 di giorno, al tramonto e di notte, e misurato la mappa con uno strumento nuovo.

**Cosa c'è già di fatto, l'11 novembre:** la base di V1 (la luce e la vita della mappa) e, la sera, la base di V3 e V4 insieme (Formia più piena e a tre piani: gradoni, sentieri, salti, belvedere, la campagna chiusa). Poi C1, la verifica. Sono in fondo, in «Cosa è stato fatto oggi».

---

## In breve

Il gioco ha tre cose che i giochi grandi invidierebbero: una città vera, sei amici veri, e un motore serio con i suoi simulatori. Non le usa ancora fino in fondo. Guardandolo e misurandolo, i tre punti dove un salto si vede di più sono questi.

1. **Formia è mezza vuota, piatta e ferma.** Su 56 schermate dove si cammina, in 28 non c'è niente da fare; metà delle caselle percorribili è a più di dieci passi da qualsiasi cosa. Castellone, «il borgo alto», è disegnato alla stessa quota del porto. Fino a oggi sulla mappa non si muoveva quasi niente. *(La sera dell'11 novembre, dopo la base di V3 e V4: 8 schermate su 47, e il 17% delle caselle.)*
2. **Le lotte chiedono poche scelte.** Lo dice già la revisione: chi usa sempre la mossa più forte tiene testa al computer in 10 specie su 18.
3. **Gli amici sono solo cinque capi da battere.** Lo scopo del progetto è che ognuno dei sei si diverta con il suo personaggio; oggi cambia la casa di partenza e l'ordine dei covi.

Le sette decisioni che ho preso (Antonio può rovesciarle tutte) sono al punto 2. La più grossa: **la mappa si rifà una volta sola**, più piccola, più piena e con il rilievo, e si porta dentro R11.

---

## La coda: cosa fare adesso, in ordine

Una task per sessione, come sempre. Chi apre una sessione nuova prende la prima non fatta, la fa, e scrive **Fatto** sotto la sua sezione qui o in `REVISIONE.md`. I dettagli di ognuna sono nelle sezioni delle task, più giù.

| # | Cosa | Modello | Fatto quando |
|---|---|---|---|
| C1 | **Fatta l'11 novembre, sera** (vedi «C1, la verifica» in fondo), con le 43 partite verdi anche sul Mac. **Verifica sul Mac** del lavoro dell'11 novembre (V1, V3, V4; è anche R20): `npm run test:e2e` intero, il fotogramma con Grafica Alta e Bassa di giorno e di notte, il tema scuro, una partita a mano fino al primo belvedere | Sonnet 5.5, high | le misure sono scritte in V1; le partite stanno nei 240 secondi (se no: il foglio delle ombre a un quarto, o Bassa nelle partite lunghe); ogni difetto visto è corretto o segnato qui |
| C2 | **Finire V3:** legare i tre sentieri al giro (una tappa in cima a ognuno, o una tappa della trama spostata lì), riempire le otto schermate vuote, misurare R11 con `npm run playtest` | Opus 5.5, high | il giocatore «solo freccia» incontra dieci selvatiche e sei allenatori prima di Mamurra; schermate vuote 6 o meno |
| C3 | **Finire V4:** Castellone in alto (il muro tra il borgo e l'Appia, la salita, il belvedere dalla Torre), e le strade che salgono un fianco disegnate come salite | Opus 5.5, max | da casa di ognuno dei sei si arriva a ogni tappa; quattro belvedere nel Diario |
| C4 | **R8, il resto** (la curva di crescita, la terza mossa delle iniziali): con i sette allenatori nuovi dentro la tabella tappa → livello | Opus 5.5, max | come scritto in R8 di `REVISIONE.md` |
| C5 | **V5 con R9:** l'esperimento dell'Intento e dei tipi che si sentono, su un ramo | Opus 5.5, xhigh | i numeri di `sim:fun` prima e dopo, e una build che Antonio gioca |
| C6 | **R12:** i golden delle lotte vere | Opus 5.5, high | come scritto in `REVISIONE.md` |
| C7 | **V6:** i Legami con gli amici | Opus 5.5, high; lo schermo a Sonnet | come scritto in V6 |
| C8 | **V8:** la dote di ogni protagonista (dopo che i sei l'hanno approvata) | Opus 5.5, high | come scritto in V8 |
| C9 | **V2, V7, V9, V10:** strade e terreno, gli omini, il suono dei posti, il colpo che si sente. Non toccano le regole: si possono fare in qualsiasi momento, una per sessione | Sonnet 5.5, xhigh | come scritto in ognuna |
| C10 | **V11:** il campione di Formia è la tua partita di prima | Opus 5.5, high | come scritto in V11 |

Tre cose che spettano ad Antonio prima che le task ci arrivino: **guardare** la mappa nuova e dire se i gradoni e la campagna chiusa gli piacciono (se no, si toglie tutto cambiando `SCARPS`, `TERRACES` e `WILD` in `tools/formia/network.ts`); **far approvare** a ognuno dei sei la sua dote (V8) e le frasi dei Legami (V6); **decidere** D4 dopo aver giocato la build di C5.

---

## 1. Da chi imparare, e cosa

Non «aggiungiamo quello che ha quel gioco»: per ognuno, la lezione sola che serve qui.

| Gioco | La lezione | Dove va |
|---|---|---|
| **Yakuza** (Kamurocho), **A Short Hike** | Piccolo e pieno batte grande e vuoto. Kamurocho è poche strade, e a ogni angolo c'è qualcosa. | V3 |
| **Link's Awakening** (2019), **Octopath Traveler** | Un mondo semplice diventa un diorama con tre cose: ombre, profondità, luce che cambia. Non serve il 3D. | V1, V4 |
| **Stardew Valley**, **Animal Crossing** | Un posto è vivo quando fa cose anche se non lo guardi: campane all'ora, il treno, chi esce la sera. | V1, V9 |
| **Pokémon** (i percorsi, non le città) | La strada tra due città è il gioco: erba, allenatori, un oggetto in vista ma fuori mano, un dislivello che si salta solo in un verso. | V3, V4 |
| **Slay the Spire**, **Into the Breach** | Se vedi cosa sta per fare il nemico, ogni turno è una decisione. È informazione, non un numero in più. | V5 |
| **Persona** (i Confidant), **Fire Emblem** (i sostegni) | Gli amici non sono in squadra: sono rapporti che crescono facendo cose insieme, e ogni gradino dà qualcosa in lotta. | V6 |
| **Golden Sun** (la Psinergia), **Pokémon** (le MN) | Quello che sai fare in lotta lo usi anche sulla mappa. Qui i poteri delle creature ci sono già (nuotare, arrampicarsi, vedere dall'alto): manca la dote di chi giochi. | V8 |
| **Hades**, **Undertale** | Il mondo si ricorda di te e te lo dice. Qui `reacts` e le scelte ci sono già: vanno estesi, non rifatti. | V6 |
| **Vlambeer** («the art of screenshake») | Un colpo si sente per tre decimi di secondo: fermo immagine, scossa, lampo. | V10 |
| **Chrono Trigger** | Niente schermata che ti porta via: l'incontro comincia dove sei. | V10 |

Una cosa che nessuno di questi ha, e questo sì: **il posto è vero, e chi gioca ci è cresciuto.** Ogni scelta qui sotto va giudicata con una domanda: uno di Formia, guardando lo schermo, dice «è proprio lì»?

---

## 2. Le decisioni

| # | Decisione | Perché |
|---|---|---|
| DV1 | **Niente Phaser e niente 3D. Lo stile resta «quaderno a penna ed evidenziatori», con la luce sopra.** | È uno stile suo, e regge il salto: le schermate di oggi lo mostrano. Un motore nuovo costerebbe settimane senza cambiare quello che si fa. Conferma il punto 5 della revisione. |
| DV2 | **La mappa si rifà una volta sola (`formia7`): più piccola, più piena, con il rilievo.** R11 confluisce in V3. | Ogni cambio di caselle costa un passaggio nei salvataggi e i golden della mappa. Tre percorsi (R11), il rilievo (V4) e il taglio del vuoto toccano le stesse caselle: farli separati vuol dire pagare tre volte. |
| DV3 | **Il prossimo sistema di lotta è uno solo: l'Intento.** Si prova insieme a R9 (i tipi che si sentono). | Le lotte hanno già dieci modificatori; ne manca la lettura. Vedere l'intenzione del nemico dà un senso a guardia, cambio e stati senza aggiungere un numero. |
| DV4 | **Gli amici tornano come Legami, non in squadra.** | Tenerli in squadra è stato tolto l'8 novembre, e a ragione: sbilanciava. Un legame che cresce con le attività che esistono già (padel, beach volley, il quiz da Morgana, il gelato) li riporta al centro senza toccare il motore. |
| DV5 | **Ogni protagonista ha una dote, una sola, che si vede dal primo minuto.** | È l'obiettivo scritto del progetto. Sei partite diverse costano sei regole piccole, non sei storie. |
| DV6 | **Tutto quello che è solo da vedere sta in `render/atmosphere.ts`, non legge la storia, e si spegne con Grafica: Bassa.** Il tetto è 8 ms a fotogramma sul Mac a 1440×900. | Così la grafica può crescere senza rompere una partita di prova, un golden o un portatile lento. |
| DV7 | **L'ordine non cambia: prima il gioco regge (R8, R12), poi cresce.** Le V che toccano le regole (V5, V6, V8) vengono dopo R8. | È D5 della revisione, e resta giusta. V1, V2, V4, V7, V9, V10 non toccano le regole e si possono fare quando si vuole. |

---

## 3. Le task

| # | Cosa | Modello | Effort | Prima serve |
|---|---|---|---|---|
| V1 | La luce e la vita della mappa | fatta la base oggi; il resto Sonnet 5.5 | high | — |
| V2 | Strade e terreno | Sonnet 5.5 | xhigh | — |
| V3 | Formia compatta: meno vuoto, tre percorsi (è anche R11) | fatta la base l'11 novembre; il resto Opus 5.5 | high | R8 |
| V4 | Formia a tre piani: il rilievo | fatta la base l'11 novembre; il resto Opus 5.5 | high | — |
| V5 | Esperimento: l'Intento (insieme a R9) | Opus 5.5 | xhigh | R8 |
| V6 | I Legami con gli amici | Opus 5.5 per le regole, Sonnet per lo schermo | high | R8, R14 |
| V7 | Gli omini: camminata, gesti, nuvolette | Sonnet 5.5 | xhigh | — |
| V8 | La dote di ogni protagonista | Opus 5.5 | high | V5 |
| V9 | Il suono dei posti | Sonnet 5.5 | high | — |
| V10 | Il colpo che si sente, e l'incontro senza stacco | Sonnet 5.5 | high | R15 |
| V11 | Il campione di Formia è la tua partita di prima | Opus 5.5 | high | R7, R12 |

**Regole per tutte:** quelle di `CLAUDE.md` e di `REVISIONE.md`. In più: una task che cambia quello che si vede consegna le schermate prima e dopo, a 1366×768, di giorno e di notte.

### V1. La luce e la vita della mappa

- *Perché:* la mappa era bella e ferma, senza un'ombra. È la differenza tra una pianta e un posto.
- *Fatto oggi* (vedi in fondo): ombre che girano con il sole vero, ombre delle nuvole, luce sui volumi, vento tra gli alberi, risacca e luccichio del mare, piccioni che scappano, farfalle, lucciole, la camminata con il passo e il respiro, l'opzione Grafica.
- *Resta da fare (Sonnet, high):*
  - ~~misurare sul Mac~~ **fatto con C1** (è R20): sul MacBook Air di Antonio, camminando, da 1,1 a 2,3 ms a fotogramma a 1440×900 (lo schermo intero del Mac) e da 1,3 a 1,5 a 1920×1080, Alta come Bassa, giorno e notte, sempre 60 fotogrammi al secondo. Sotto gli 8 ms con largo margine: il foglio delle ombre e il vento restano come sono. I numeri sono in «C1, la verifica», in fondo; si rifà la misura con `npm run perf`;
  - **il treno che passa**: ogni tanto un regionale attraversa la mappa sui binari, le sbarre dei passaggi a livello scendono e non si passa finché non è passato. Un orario finto ma fisso (dall'ora, non da `Math.random`);
  - **il traghetto per Ponza** che esce dal porto e rientra;
  - **il fumo dai comignoli** d'inverno, **i panni stesi** che si muovono a Mola, **le bandiere** della scuola;
  - **l'erba alta che si piega** dove passa il vento e dove cammini;
  - **il tempo**: giornate di scirocco (foschia calda), di tramontana (limpido, mare mosso), di pioggia. Solo da vedere, finché V5 non decide se il tempo entra nelle lotte.
- *Fatto quando:* le misure sono scritte qui sotto; ogni cosa nuova si ferma con «riduci il movimento» e si spegne con Bassa.

### V2. Strade e terreno

- *Perché:* le strade sono fasce grigie senza niente, e sono la cosa che si guarda di più.
- *Cosa* (in `render/canvas/ground.ts`; i golden della mappa si rigenerano apposta):
  - la mezzeria tratteggiata sull'Appia e sul lungomare, il bordo del marciapiede con la sua ombra, tombini, strisce davanti alle scuole;
  - auto e Vespe parcheggiate lungo le vie del centro (ferme, sul bordo: non chiudono caselle);
  - dove due terreni si incontrano, un filo d'ombra dalla parte più bassa;
  - gli uliveti a terrazze con le macere (i muretti a secco degli Aurunci), gli orti, gli agrumi: la campagna non è un prato con i pallini;
  - la spiaggia: orme, conchiglie, la riga bagnata della risacca.
- *Fatto oggi:* l'asfalto un tono più scuro (`--m-road`), perché le strade si stacchino dai marciapiedi.
- *Fatto quando:* Antonio guarda dieci schermate prima e dopo e nessuna è peggiorata; `npm test` verde con i golden rigenerati.

### V3. Formia compatta (Opus, max). È anche R11.

- *Perché, misurato* (`npx tsx tools/formia/density.ts`):

  | Misura | Oggi |
  |---|---|
  | Schermate dove si cammina (20×12 caselle) | 56 |
  | Di queste, senza niente da fare | 28 |
  | Con una o due cose sole | 13 |
  | Caselle percorribili a più di 10 passi da qualcosa | 4151 su 8287 (50%) |

  Le cose da fare in tutta Formia sono 32 persone, 10 allenatori, 35 cartelli, 25 porte e 4 oggetti persi, quasi tutte tra Castellone e Mola. Il nord (gli uliveti), l'ovest (verso Gaeta) e tutto l'est dopo il Villaggio Don Bosco sono prato da attraversare.
- *Cosa:*
  1. **Tagliare.** Stringere le fasce vuote nel generatore (`X_ANCHORS` e la scala in `tools/formia/`): la campagna a nord e la strada per Scauri non hanno bisogno di venti caselle per dire che sono lontane. Obiettivo: da 200×82 a circa 160×72, senza spostare tra loro i posti del centro.
  2. **I tre percorsi di R11**, ognuno con una sua idea e non solo erba e allenatori:
     - *l'Appia antica*, dalla pineta alla Tomba di Cicerone: i basoli, i cipressi, un miliario da leggere, due allenatori, l'erba ai lati;
     - *il sentiero di Gianola*, dal parco alla villa: la macchia, gli scogli con le pozze, la Grotta della Janara chiusa finché non hai chi si arrampica;
     - *la mulattiera degli Aurunci*, dagli uliveti verso Maranola: terrazze, un salto che si fa solo in discesa, un belvedere (V4).
  3. **Riempire quello che resta.** Regola: nessuna schermata sul giro della storia senza almeno due cose da fare. Le cose sono quelle che il gioco ha già: una persona con una frase vera su quel posto (con la fonte in `docs/fonti-formia.md`), un cartello, un oggetto in vista ma fuori mano, un allenatore, una macchia d'erba.
  4. **Un solo passaggio nei salvataggi** (`formia7` in `MIGRATIONS`), insieme a V4.
- *I fatti:* il miliario, la Grotta della Janara, le macere, i nomi dei sentieri sono idee mie, non verificate. Chi fa la task le controlla e scrive la fonte, come vuole `CLAUDE.md`; quello che non si trova non entra.
- *Fatto quando:* schermate vuote da 28 a 6 o meno, e nessuna sul giro della storia; caselle lontane da tutto dal 50% al 20% o meno; il giocatore «solo freccia» incontra almeno dieci selvatiche e sei allenatori prima di Mamurra (è la misura di R11); `tests/unit/density.test.ts` abbassato ai numeri nuovi.

**Fatto, la base (11 novembre, sera).** Come è fatto è in «Formia a tre piani» di `docs/mappa.md`.

| Misura | Prima | Dopo |
|---|---|---|
| Schermate dove si cammina | 56 | 47 |
| Di queste, senza niente da fare | 28 | 8 |
| Con una o due cose sole | 13 | 19 |
| Caselle percorribili a più di 10 passi da qualcosa | 4151 su 8287 (50%) | 936 su 5641 (17%) |
| Persone, allenatori, cartelli | 32, 10, 35 | 35, 19, 46 |

- **Non ho tagliato la mappa: ho chiuso il vuoto.** Stringere le colonne voleva dire rifare a mano ogni coordinata del generatore e spostare tutto. Invece il terreno lontano da ogni strada, sentiero e posto ora non si percorre più: è montagna, collina boscosa o uliveto dietro le macere (`WILD` in `tools/formia/network.ts`). L'effetto sul gioco è quello del taglio (quasi tremila caselle di prato in meno da attraversare) e nessun posto si è mosso: la mappa resta 200×82.
- **I tre percorsi ci sono:** la Strada della Statua, l'Acervara, la punta di Gianola. Ognuno ha erba alta, due allenatori, cartelli con fatti verificati (`docs/fonti-formia.md`) e un belvedere in fondo. I nomi che avevo proposto sono cambiati con quello che ho trovato: la mulattiera vera è la «Strada della Statua» del Redentore, sopra la Tomba di Cicerone c'è la Tomba di Tulliola sull'Acervara, e la Grotta della Janara non è una grotta ma la scala coperta della villa (nel gioco è una scala).
- **Resta da fare:**
  - la misura di R11 con il giocatore automatico: i tre sentieri sono a lato delle tappe, non sulla strada obbligata, quindi chi segue solo la freccia non li percorre. Vanno legati al giro: una tappa per sentiero, o una tappa della trama spostata in cima a ognuno;
  - i livelli dei sette allenatori nuovi sono messi sulle creature del posto e provati con `sim-story trainers` (tra il 40 e il 100% secondo l'iniziale), ma aspettano la curva di R8;
  - le otto schermate ancora vuote: l'Appia a ovest di via Vindicio, via Vindicio stessa, le spiagge a est. Lì servono cose, non muri;
  - «un oggetto in vista ma fuori mano» non c'è: il gioco ha solo i quattro oggetti persi di Antonio. Servirebbe un tipo di cosa da raccogliere (sesterzi, un retino), ed è un sistema nuovo: lo decide Antonio.

### V4. Formia a tre piani (Opus, high). Con V3.

- *Perché:* Formia è una città tra i monti e il mare, in salita. Sulla mappa è un foglio. Castellone è «il borgo alto» solo nel nome.
- *Cosa:*
  - tre quote: il mare e il lungomare; la città; Castellone, le colline e gli Aurunci. Tra una quota e l'altra una scarpata disegnata (muro di pietra in città, roccia e macchia fuori), che non si attraversa;
  - si sale per le scale e per le strade in salita che ci sono davvero: quali, lo dice Antonio o OpenStreetMap, non questa pagina (la salita a Castellone è la prima);
  - **i salti**: dalla quota alta si scende in un punto segnato, non si risale. Scorciatoie al ritorno, come nei percorsi di Pokémon;
  - **i belvedere**: tre o quattro punti alti, scelti tra quelli veri (la Torre di Castellone è il primo candidato). Lì la camera sale come fa già per le creature con le ali (`skyFrom` in `ui/story-screen.ts`), e si vede il golfo. La prima volta, il Diario segna la veduta;
  - gli Aurunci in alto non sono una striscia verde: tre creste una dietro l'altra, più chiare man mano che si allontanano, con Maranola sulla sua.
- *Nel motore della mappa:* una quota per casella (`level` in `Ground`, 0 se manca), le scarpate come terreno solido con il loro disegno, `ledge` come casella che si passa in un solo verso. `route` e il validatore dei luoghi vanno aggiornati; `tools/formia/audit.ts` deve dire che ogni posto si raggiunge ancora.
- *Fatto quando:* da casa di ognuno dei sei si arriva a ogni tappa (test); le ombre di V1 cadono giuste sulle scarpate; una partita di prova sale a Castellone per la scala e scende da un salto.

**Fatto, la base (11 novembre, sera).**
- quattro gradoni con il fianco disegnato (due sugli Aurunci, l'Acervara, la punta di Gianola) e il muraglione dell'Appia sopra Vindicio; le scale dove passa un sentiero; cinque salti che si scendono e non si risalgono, usati anche dal clic sulla mappa;
- tre belvedere con il cannocchiale: la camera sale, e la veduta va nel Diario («Vedute · n su 3»);
- gli Aurunci scendono fino alla città, più chiari con la quota, con due creste; ogni collina che finisce su terreno più basso mostra il fianco di roccia;
- in più, non chiesto: i falchi che girano sopra le montagne, la polvere quando si atterra da un salto, e un ragazzo in via Penitro che spiega i salti.
- **Resta da fare:**
  - **Castellone non è ancora in alto.** Tra il borgo e l'Appia non c'è una riga libera per il muro: la cavea del teatro arriva fino alla strada. Va rifatto quel pezzo del generatore (`TOWN`, `URBAN`, le mura `W`), ed è il lavoro più delicato perché lì stanno otto tappe;
  - il belvedere dalla Torre di Castellone, che ne dipende;
  - le salite vere: oggi una strada attraversa un fianco senza cambiare disegno;
  - la quota come numero (`level` in `Ground`) non c'è: il rilievo è fatto di caselle solide, e basta al gioco. Servirebbe solo per far cadere le ombre di V1 più lunghe dall'alto.

### V5. Esperimento: l'Intento (Opus, xhigh). Insieme a R9.

- *Perché:* la revisione ha misurato che nel turno si sceglie poco. I rimedi che il gioco ha già (guardia, cambio, stati, Slancio, Risonanza) servono solo se sai cosa sta per succedere.
- *Cosa, su un ramo a parte:*
  - a inizio turno il computer ha già scelto (`ai` in `battle/ai.ts`); sopra la creatura avversaria compare **che genere di cosa farà**: attacca (e se è una mossa forte), si protegge, si cura, prepara qualcosa, cambia. Non la mossa: il genere;
  - non sempre. Di base si vede contro capi, allenatori e leggende; le selvatiche lo mostrano solo a chi ha la dote giusta (V8) o dopo una mossa che «legge» (c'è già: la Diagnosi di Antonio rende visibili i numeri);
  - nel motore è un campo facoltativo dello stato, come `known`: i golden delle 2040 lotte non cambiano;
  - il computer deve restare onesto: quello che mostra è quello che fa, salvo le mosse che dicono di mentire (una, di un solo capo: è il suo carattere).
- *Misura:* `npm run sim:fun` con un giocatore che legge l'Intento contro uno che usa sempre la mossa più forte. Oggi il secondo tiene testa in 10 specie su 18: deve scendere a 4 o meno, e i duelli durare 8–10 turni.
- *Consegna:* i numeri prima e dopo e una build da giocare. Decide Antonio insieme a D4. Se non regge si scrive perché e si chiude.

### V6. I Legami con gli amici (Opus per le regole, Sonnet per lo schermo)

- *Perché:* gli amici sono la ragione del gioco, e dopo il covo non servono più a niente.
- *Cosa:*
  - battuto il suo covo, un amico si trova in giro nei posti suoi, a ore diverse (l'ora vera c'è già);
  - **ogni cosa fatta insieme alza il legame**, tre gradini. Le cose sono le attività che esistono (`story/activities.ts`): padel e palestra con Andrea, il comizio e il bar con Costanzo, l'Eclipse con Valentin, tennis e Formula 1 con Forchetta, la musica in pineta con Zendavid, il Palamendola con Antonio. Una per gradino, più una frase che cambia;
  - **cosa dà ogni gradino:** primo, un regalo suo e un pezzo di storia (una cosa vera, che fa ridere chi lo conosce: le scrive Antonio); secondo, **insegna una sua mossa** a una creatura del tipo giusto; terzo, **la spalla**: una volta per lotta, nelle lotte della trama, lo chiami e fa una delle sue mosse al posto del tuo turno;
  - nell'epilogo e nella cartolina, i legami contano.
- *Cosa toglie:* le missioni «che può fare solo uno della compagnia» e i resti di R14 diventano legami. Il conto dei sistemi non sale.
- *Persone vere:* ogni frase nuova su un amico la approva lui. Niente cognomi, niente indirizzi (`CLAUDE.md`).
- *Fatto quando:* `sim-story` con e senza spalla: Mamurra e Lamo restano tra il 55 e l'85% con la squadra del percorso; un test controlla che ogni gradino di ogni amico si possa raggiungere (come `flags.test.ts`).

### V7. Gli omini (Sonnet, xhigh)

- *Perché:* le creature in lotta hanno 98 scene; gli omini sulla mappa hanno tre pose.
- *Cosa* (in `render/canvas/walkers.ts`; i golden degli omini si rigenerano apposta):
  - la camminata in quattro tempi, con le braccia; la corsa quando si tiene premuto, con la polvere sullo sterrato e sulla sabbia;
  - gli occhi che si chiudono ogni tanto; chi sta fermo guarda chi gli passa accanto;
  - **le nuvolette** sopra la testa, una famiglia sola come il «!» degli allenatori (`exclaim` in `render/world-view.ts`): «…» per chi ha un consiglio (`hint`), «♪» per chi è contento, «?» «!» «♥» «zzz». Dicono cosa aspettarsi prima di parlare;
  - pose di chi vive lì: seduto sulla panchina, appoggiato al muretto, il pescatore con la canna sul molo, la signora alla finestra;
  - la creatura che segue ha il suo passo secondo il tipo: salta, striscia, galleggia, vola bassa;
  - il ritratto di Tullio e degli altri personaggi della trama nei dialoghi (punto 15 di `PROSSIMI-PASSI.md`).
- *Fatto oggi:* il saltello a ogni passo e il respiro di chi sta fermo (in `world-view.ts`, senza toccare i disegni).

### V8. La dote di ogni protagonista (Opus, high)

- *Perché:* DV5. Oggi scegliere chi sei cambia poco.
- *Proposta, una regola a testa, da tarare con i simulatori e da far approvare a ognuno:*

  | Chi | Dote | Cosa cambia |
  |---|---|---|
  | Antonio | **Diagnosi** | Nell'erba alta vede cosa si nasconde prima di entrarci (sagoma e livello), e in lotta vede l'Intento anche delle selvatiche. Sceglie i suoi incontri. |
  | Costanzo | **Comizio** | Prima di una lotta con un allenatore può parlargli: se lo convince, quello paga senza lottare, o lotta con una creatura in meno. Nei negozi tratta sul prezzo. |
  | Andrea | **Calcolo** | Vede la percentuale di cattura e il danno previsto di ogni mossa. Chi gioca con i numeri, li ha. |
  | Valentin | **La festa** | Le creature vengono da lui: incontri più frequenti, di notte quelle rare escono di più, e nell'erba può chiamarne una quando vuole. |
  | Forchetta | **Il più formiano** | Tutti lo conoscono: ogni abitante gli dice una cosa in più, i cartelli letti danno un po' di esperienza, e conosce due scorciatoie tra i vicoli che gli altri non hanno. |
  | Zendavid | **Le cuffie** | La musica le calma: le selvatiche non scappano e il legame con le sue creature cresce più in fretta. |

- *Attenzione:* una dote sola, visibile nella carta di «chi sei?». Niente che renda una partita più facile delle altre: `sim-covi` e il giocatore automatico devono dare a tutti e sei numeri vicini.

### V9. Il suono dei posti (Sonnet, high)

- *Perché:* la musica c'è; il posto non si sente.
- *Cosa* (in `audio/`, tutto sintetizzato, niente `Math.random`): le onde vicino al mare, più forti in spiaggia; le cicale in pineta di giorno d'estate, i grilli di sera; **le campane di Sant'Erasmo e di San Giovanni all'ora vera**; il treno che arriva (con V1); il vociare in piazza al comizio; i passi che cambiano tra strada, sabbia ed erba. Volume legato alla distanza dal posto.
- *Fatto quando:* la partita `audio.spec.ts` sente le onde all'Eclipse e non a Castellone; a mezzogiorno finto suonano dodici rintocchi.

### V10. Il colpo che si sente, e l'incontro senza stacco (Sonnet, high)

- *Cosa:*
  - al colpo: un fermo immagine di 60–90 ms, una scossa proporzionata al danno, un lampo su chi lo prende; al critico la camera stringe; al KO mezzo secondo al rallentatore. Tutto scalato con la velocità di R15, e spento con «riduci il movimento»;
  - la barra dei PS scende in due tempi (prima il segno del danno, poi la barra), come nei picchiaduro;
  - **l'incontro comincia dov'eri**: la mappa non sparisce in un lampo. Il foglio si piega, o l'inchiostro si allarga dal punto dove è saltata fuori la creatura, e lo sfondo della lotta è quel posto (c'è già una scena per ogni parte di città, `SCENES` in `render/svg/scenes.ts`: va scelta dalla casella dove si è).
- *Attenzione:* niente `Math.random` negli effetti; `safeShow` intorno a ogni scena nuova.

### V11. Il campione di Formia è la tua partita di prima (Opus, high)

È l'idea 1 della revisione, e la confermo come la migliore per far rigiocare: finita la storia con un protagonista, la sua squadra finale, con i nomi e le scelte, aspetta al Palamendola il protagonista della partita dopo. Con il codice di R18 anche la squadra vera di un amico, mandata con un link.

---

## 4. Cosa non fare

- **Altre creature, mosse, tipi, stati.** Vale ancora quello che dice la revisione.
- **Torino e Milano.** Prima Formia.
- **Il tempo che cambia le lotte**, prima che V5 dica se le scelte nel turno contano.
- **Effetti in `ui/story-screen.ts` o in `story/`.** Quello che si vede soltanto sta in `render/atmosphere.ts` (DV6).
- **Ritoccare a mano le caselle della mappa:** si cambia `tools/formia/network.ts` o `formia-places.ts` e si rilancia il generatore.

---

## Cosa è stato fatto oggi

**La base di V1**, nel codice:

| Cosa | Dove |
|---|---|
| Il sole: dove cade l'ombra e quanto è forte la luce, dall'ora vera o da quella scelta nel menu | `sunAt` in `src/story/daytime.ts` |
| Le ombre di edifici, alberi, lampioni, persone e creature, che girano con il sole; le ombre delle nuvole che passano | `shade` in `src/render/atmosphere.ts` |
| La luce sui volumi: un po' di sole in alto e un po' d'ombra al piede di tutto quello che sta in piedi | `volume`, applicato in `sceneItems` di `src/render/world-view.ts` |
| Il vento: alberi, pini, palme e ulivi che si piegano a raffiche, con la loro ombra | `wind`, `SWAY`, `drawSorted` |
| Il mare: la risacca lungo le spiagge, il luccichio del sole | `seaLife` |
| La vita: i piccioni delle piazze che volano via quando ci cammini in mezzo e poi tornano, le farfalle di giorno, le lucciole di notte | `pigeons`, `butterflies`, `fireflies` |
| Gli omini: un saltello a ogni passo, il respiro di chi sta fermo | `stepHop`, `breath` in `world-view.ts` |
| La cornice più scura intorno alla mappa | `.wframe` in `src/styles/story.css` |
| Il titolo: Formia in un pomeriggio di sole, con le ombre | `preview` in `world-view.ts` |
| L'opzione **Grafica della mappa: Alta o Bassa** nel menu (Mappa), chiave `lotte-tra-amici:grafica:v1` | `src/ui/gfx.ts` |
| I colori nuovi, chiari e scuri | `--m-shade`, `--m-sunlit`, `--m-glint`, `--m-firefly` in `src/styles/tokens.css` |
| L'asfalto un tono più scuro | `--m-road`, `--m-road2` |

**Lo strumento di V3:** `tools/formia/density.ts` (`npx tsx tools/formia/density.ts`, con `--csv` per la tabella), e `tests/unit/density.test.ts`, che tiene i numeri di oggi come tetto: la mappa può migliorare, non peggiorare.

**Controlli:** `npx tsc --noEmit` pulito; `npm test` 400 su 400; `npm run build`. Dei golden è cambiata una sola voce su 478 disegni della mappa, la tavolozza (quattro colori in più e l'asfalto): il resto, i 168 ritratti e le 2040 lotte sono identici. Sette partite Playwright con il Chrome di sistema, tutte verdi: «story: circolo and menu», «maps overview» chiara e scura, «home and the scooter», «a trainer who sees Antonio», «walking with a click», «the creatures' powers». Le altre partite non le ho lanciate.

**Non provato:** il Mac (le misure del fotogramma sono del contenitore, senza scheda grafica); il telefono; il tema scuro a occhio (i colori ci sono, le schermate le ho guardate solo in chiaro).

**Come è fatto, per chi continua:**
- le finestre accese di notte si trovano dal colore del vetro, quindi sul disegno senza la luce sopra: per questo ogni edificio tiene `flat`, la funzione che lo ridisegna com'era (`glowOf`);
- le ombre e le nuvole stanno su un foglio solo, a un terzo della risoluzione, steso una volta per fotogramma sotto le persone: due ombre che si incrociano non sono più scure di una;
- un'ombra cade sempre un po' verso chi guarda (`sun.y`), anche a mezzogiorno: la mappa si vede da sud, e un'ombra dritta a nord resterebbe dietro a chi la fa;
- niente `Math.random`: dove sta una cosa e quando si muove vengono da `hash` e dal tempo del fotogramma. Con «riduci il movimento» tutto resta fermo.

### La sera: la base di V3 e V4, Formia a tre piani

| Cosa | Dove |
|---|---|
| I caratteri nuovi della mappa: il fianco di roccia, il muraglione, il salto, la macera | `src/data/maps/legend.ts` |
| Gradoni, fianchi, sentieri, salti, macere e zone di selvatico, come dati | `TERRACES`, `SCARPS`, `TRAILS`, `LEDGES`, `MACERE`, `WILD` in `tools/formia/network.ts` |
| Il passo del generatore che li mette sulla mappa, e i controlli che tutto si raggiunga ancora da casa | passo 12c di `tools/formia/build.ts` |
| Il salto: si scende in un passo, non si risale; il clic sulla mappa lo usa | `tryStep`, `JUMP`, `ledgeAt` in `src/story/movement.ts`; `route` in `src/story/maps.ts` |
| I belvedere: il cannocchiale, la camera che sale, le Vedute nel Diario | `view` su `Sign`; `viewer` in `render/canvas/objects.ts`; `lookOut` in `ui/story-screen.ts` |
| Il disegno del rilievo: fianchi dei gradoni, fianchi delle colline, ombra al piede, montagne più chiare con la quota e con le creste | `relief`, `scarp`, `hillFace`, `footShade`, `hillDepth` in `render/canvas/ground.ts` |
| I falchi sopra le montagne, la polvere dell'atterraggio | `hawks`, `landing` in `render/atmosphere.ts` |
| Sette allenatori, l'erba della macchia di Gianola, nove cartelli, tre belvedere, cinque persone lungo le strade | `data/trainers.ts`, `data/encounters.ts`, `data/maps/formia.ts`, `formia-places.ts` |
| I fatti nuovi con le fonti | `docs/fonti-formia.md` |
| Il passaggio dei salvataggi | `formia7` in `src/save/story-progress.ts` |
| I test: fianchi continui, salti in un verso solo, belvedere raggiungibili; il tetto della densità abbassato a 8 schermate e 18% | `tests/unit/relief.test.ts`, `tests/unit/density.test.ts` |

**Controlli della sera:** `npx tsc --noEmit` pulito; `npm test` 404 su 404; `npm run build`. I golden della mappa sono rigenerati apposta (la mappa e il disegno del terreno sono cambiati); le 2040 lotte e i 168 ritratti sono identici. `sim-story trainers` con i sette allenatori nuovi: tra il 40 e il 100% secondo l'iniziale. Nel gioco, con un browser automatico: il belvedere degli Aurunci (la camera sale, la veduta entra nel Diario), un salto giù e il tentativo di risalire, il clic che attraversa un salto, nessun errore in console. Le 43 partite Playwright, con il Chrome di sistema, passano tutte: 39 al primo giro con quattro worker; le altre quattro («story», «activities around Formia», «creatures of Formia», «the stones of Telepilo») sono andate fuori tempo a 400 secondi e passano rilanciate con più tempo, in 3–10,5 minuti. Senza scheda grafica la Grafica Alta rallenta ogni fotogramma, e le partite lunghe ne risentono: sul Mac va guardato che restino sotto i 240 secondi di `playwright.config.ts` (è C1).

**Non provato la sera:** il Mac; una partita intera dall'inizio alla fine sulla mappa nuova (è C1 e la misura di C2); i sentieri di notte.

### C1, la sera: la verifica

**Il fotogramma sul Mac** (è R20). Misurato sul MacBook Air di Antonio (schermo 1440×900, densità 2), nel browser integrato dell'app Claude: è il Chromium di Electron, con la scheda grafica del Mac. La pagina di misura è il gioco con davanti `tools/perf/bench.js` (`npm run perf` scrive `dist/perf.html`): entra in mappa con una storia sua, cammina otto secondi avanti e indietro su via Vitruvio, e somma per ogni fotogramma il tempo delle chiamate del gioco (il giro della mappa: `update` e `drawWorld`). Una pagina caricata per ogni prova, così Grafica e ora si leggono come all'avvio.

| Finestra (canvas) | Alta, giorno | Alta, notte | Bassa, giorno | Bassa, notte |
|---|---|---|---|---|
| 1440×860 (2880×1720) | 1,2 ms (95%: 3,0) | 2,3 (3,5) | 1,4 (2,6) | 1,1 (2,7) |
| 1920×1040 (3840×2080) | 1,4 (3,1) | 1,3 (3,3) | 1,5 (2,7) | 1,4 (2,7) |

Sempre 60 fotogrammi al secondo (480 su 8 secondi); il fotogramma più lento, uno solo, 18,5 ms di notte a 1920. Il tetto di DV6 è 8 ms: Alta sul Mac costa quanto Bassa, e nessun rimedio serve. Con lo stesso strumento nel contenitore, senza scheda grafica e alla stessa densità, a 1440×900 di giorno: Bassa 22 ms, Alta 42 (da 15 a 30 fotogrammi al secondo). I numeri di prima (2,9 e 10,5) erano a densità 1.

**Le partite intere.** Nel contenitore, con il Chrome di sistema e due worker, passano tutte e 43, ma due andavano oltre i 240 secondi. Dentro «activities around Formia», da sola, con Alta i fotogrammi prendono 231 secondi su 415 (23 ms l'uno, su quasi diecimila), con Bassa 44 su 246: il resto è il giro di Playwright. Quindi il rimedio scritto in C1, Bassa nelle partite lunghe: un'opzione `gfx` di `play()` in `tests/e2e/harness.ts`, e `gfx: 'bassa'` nelle quattro più lunghe. Le due che anche su Bassa restano sopra i 4 minuti hanno `test.slow()`, cioè 720 secondi. Le altre 39 restano su Alta, comprese le due di notte.

| Partita | Contenitore, prima (Alta) | Contenitore, dopo | Mac di Antonio, dopo |
|---|---|---|---|
| activities around Formia | 524 s | 318 s (Bassa, `test.slow`) | 300 s |
| the stones of Telepilo | 348 s | 249 s (Bassa, `test.slow`) | 250 s |
| story | 187 s | 125 s (Bassa) | 116 s |
| creatures of Formia | 187 s | 126 s (Bassa) | 118 s |
| Tutte e 43 | 24,0 minuti (2 worker) | 20,0 minuti (2 worker), tutte verdi con il tetto di 240 s | 9 minuti e 19 secondi (4 worker), 43 su 43 |

**Sul Mac** le ha lanciate Antonio la sera, sul ramo, con `npm run test:e2e` e un rapporto JSON: 43 su 43, nessuna instabile. Le due con `test.slow()` restano oltre i 240 secondi anche lì (300 e 250), quindi il tempo triplo resta; tutte le altre stanno sotto i 150 secondi (la più lunga, «Lamo, in three parts», 147).

**La partita fino al primo belvedere.** Giocata da un browser automatico a tempo vero, come la giocherebbe una persona, a 1366×768, con le animazioni accese: il titolo, «chi sei?» (Antonio), casa, la freccia fino al guardaparco, Polpino, il sentiero di Gianola, le terrazze con le scale, il cannocchiale della punta. La camera sale, compare «Una veduta nuova nel Diario» e il Diario dice «Vedute · 1 su 3». Poi il salto sopra le terrazze: da (168,61) si atterra a (168,63) e non si risale. Nessun errore in console.

**Il tema scuro e i sentieri di notte.** I tre belvedere (Aurunci, Acervara, punta di Gianola) in chiaro e in scuro, di giorno e di notte, la veduta dagli Aurunci di notte, Castellone di notte, via Vitruvio al tramonto: nessun errore in console, i fianchi, le scale e le freccette dei salti si vedono in tutti e quattro i modi.

**Visti e segnati, non corretti qui:**
- **Il primo sentiero è troppo duro per chi ci va subito.** Il belvedere della punta è a pochi passi dal guardaparco, quindi è il primo posto dove va chi esplora: lì, con Polpino da solo al 5, Antonio ha incontrato un allenatore del sentiero e ha perso (Cicerone: «Hai perso?»). L'archeologa ha due creature al 5 e al 6, il pescatore di polpi due al 7. È bilanciamento: va con la curva di R8 (C4). Si può abbassare il pescatore o spostarlo più in fondo, dopo la seconda creatura.
- **Il tema scuro di notte è molto scuro.** Si legge grazie ai contorni a penna chiari, ma il terreno quasi non si vede. Da giudicare a occhio sul Mac: se è troppo, il foglio della notte va alleggerito quando il tema è scuro.

**Come sono state lanciate sul Mac:** il Terminale del Mac da qui non si può usare (l'app concede ai terminali e agli editor solo i clic, non la tastiera; la shell remota è una macchina Linux senza browser). La cartella del Mac l'ho portata sul ramo con git dalla shell remota, e la riga di Playwright l'ha incollata Antonio.

**Come è fatto, per chi continua:**
- `dist/perf.html` si apre con un doppio clic (meglio in Chrome) e lavora da solo per circa un minuto e mezzo. Rimette a posto la storia, la Grafica e l'ora di chi gioca, e alla fine scrive i numeri sulla pagina, con «Rifai». Tra un caricamento e l'altro ricorda il punto in `window.name`, che sopravvive anche in un frame senza `sessionStorage`. Se la pagina è nascosta lo scrive, perché il browser allora non disegna;
- per misurare sul Mac senza toccarlo: la pagina pubblicata come artifact privato, aperta nel browser integrato dell'app con la finestra emulata (1440×900, 1920×1080). Il pannello deve essere visibile e collegato a claude.ai: l'accesso lo fa Antonio;
- con l'orologio finto di Playwright e le animazioni accese, una scena della lotta («abil») superava gli 8 secondi finti e `safeShow` la saltava con un errore. A tempo vero non succede: è il giocatore automatico, non il gioco (nota in `docs/test.md`).

**Controlli:** `npx tsc --noEmit` pulito; `npm test` 404 su 404; `npm run build`; le 43 partite come sopra.
