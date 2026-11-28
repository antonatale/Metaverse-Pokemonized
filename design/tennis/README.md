# Tennis sulla terra · Prototipo giocabile

Il prototipo offre allenamento e tie-break sullo stesso campo. In allenamento i lanci ripartono dalla stessa posizione. Nel tie-break scegli il tuo personaggio e l’avversario. Forchetta gioca profondo, Andrea avanza a rete e Claudia contrattacca verso lo spazio libero.

## Avvio

Installa le dipendenze con `npm ci` se necessario e avvia Vite dalla radice del repository.

```sh
npm exec -- vite design/tennis --host 0.0.0.0 --port 5175 --strictPort
```

Apri [il campo nel browser](http://localhost:5175/). Su un telefono collegato alla stessa rete Wi-Fi, apri l’indirizzo `Network` che Vite stampa nel terminale.

Per ottenere un HTML autonomo da aprire nel browser, esegui `npm exec -- vite build design/tennis`. Il file è `design/tennis/dist/index.html`.


In allenamento giochi con Claudia contro Forchetta. Sul desktop gli strumenti ai quattro angoli lasciano al campo tutta la larghezza della finestra. Gli scambi danno più tempo per coprire il campo mantenendo l’inerzia della corsa.

In **Servizio** scegli prima o seconda e lato di battuta. Mira al disco sulla terra. Quando lo centri passi dalla T al corpo, poi al lato esterno. Una battuta valida fuori dal disco mostra la distanza dal centro e ti lascia riprovare. Il tabellone conta valide e falli. Dopo il contatto trovi altezza, velocità e percentuale di carica. Premi **R** per ripetere anche durante lo scambio. [Apri la prova di servizio](http://localhost:5175/?esercizio=servizio).

Il pulsante **Volée** apre una prova dalla rete. I lanci alternano dritto e rovescio. Un clic breve blocca il passante, un rilascio carico su palla alta permette di chiudere più teso. Appena dopo il rimbalzo, una palla bassa davanti alla linea di servizio si può rialzare in demi-volée. Nel tie-break la risposta al servizio richiede il rimbalzo.

## Tie-break

1. Scegli **Tie-break**, poi **Inizia tie-break**. Quando batti, aspetta il segnale di carica durante il lancio, tieni brevemente il clic e rilascia su **ORA**. Il quadrato illuminato mostra dove deve cadere il servizio. La seconda è più lenta e più corta a parità di carica. Sulla terra rimbalza più alta e scarta lateralmente.
2. Alla risposta aspetta il primo rimbalzo. Dopo il servizio puoi anche entrare nella tua area di servizio e giocare al volo. Con una carica leggera, una strusciata ampia in su produce il **pallonetto**. In giù fa partire la **smorzata**, che frena sulla terra al rimbalzo. Su telefono puoi strisciare a partire da **Colpisci** mentre tieni premuto.
3. Il tie-break si chiude da sette punti con due di vantaggio. Chi apre batte una volta, poi si alternano due battute a testa. Un let ripete la battuta e il primo fallo passa alla seconda. A fine punto **Rivedi il punto** riproduce lo scambio a metà velocità. Il selettore permette di seguire la palla, vedere il campo intero o stringere sul rimbalzo decisivo. La chiamata OUT indica il margine dalla linea e la palla prosegue dopo il rimbalzo.

## Personaggi e integrazione

I tre ID in [roster.ts](roster.ts) corrispondono al `FriendId` del gioco. Selettori e incarnati riusano le figure esistenti di Telepilo. Completi sportivi e tattiche sono proposte per il tennis. Il canvas proietta le pose in coordinate spaziali con un unico punto d’impatto condiviso con la palla.

Alla chiusura del tie-break il campo emette l’evento DOM `telepilo:tennis:result` una volta per partita. Il payload [TennisResult](match.ts) contiene gli ID di entrambi, il punteggio, il vincitore e la lunghezza massima dello scambio in contatti di racchetta. Questo è il punto di aggancio per un futuro rientro nel mondo o per il diario. [Specifica di integrazione](progetto.md)

Passa `?modalita=tie-break&giocatore=claudia&avversario=andrea` per aprire direttamente quella sfida. Il comando **Esci** emette `telepilo:tennis:exit` e libera i controlli della partita. Entrambi gli eventi partono da `#court` e risalgono al documento.

## Giocare con il trackpad

1. Clicca sul campo per lanciare. Muovi il puntatore nella tua metà per correre. Il cerchio azzurro indica la destinazione e il rombo indica dove puoi incontrare la palla.
2. Quando compare **CARICA**, tieni premuto il clic e striscia dal punto in cui hai premuto. Sinistra e destra scelgono l’angolo, su e giù la profondità. I gesti piccoli danno angoli intermedi. A clic fermo tiri al centro. Il giocatore continua verso la destinazione già scelta anche durante la strusciata.
3. Rilascia su **ORA**. Un rilascio appena in anticipo viene tenuto in memoria per circa 0,17 secondi. Il movimento del puntatore dopo il rilascio torna a controllare la corsa.

La carica cambia la velocità del tiro e, con un gesto orizzontale, anche la profondità. La tacca Limite segue la difficoltà della palla e gli appoggi. Superandola, la traiettoria scende in rete. Per mirare fuori, prolunga la strusciata oltre la linea laterale o di fondo. I rimbalzi lasciano un trattino sulla terra che sparisce dopo due contatti di racchetta o al nuovo lancio.

Su **ORA** basta anche un clic brevissimo. I due archi ai piedi e il cerchio sulla palla segnalano la finestra di contatto. **ALLUNGO** in ambra indica che resta una risposta difensiva. Un colpo a vuoto fa passare la racchetta e lascia continuare la palla. Dopo un allungo, la freccia ai piedi suggerisce la diagonale da coprire. La barra **Riarmo** segue il ritorno in posizione. Una ripartenza anticipata può lasciare spazio a un contropiede. La volée permette di riprovare prima del recupero in corsa. Un tocco negli ultimi quattro fotogrammi del riarmo viene conservato.

Per un colpo speciale, striscia direttamente sul campo senza premere il clic. **Due dita** in avanti o di lato giocano lo slice che schizza basso. Due dita verso di te giocano la smorzata. Per il pallonetto puoi usare **L**. La componente laterale del gesto sceglie il lato del campo. La pausa permette di invertire lo scorrimento del browser se la tua preferenza di sistema lo richiede.

Il mouse usa gli stessi comandi. Sul computer, **Tastiera** apre le scorciatoie. Sul telefono sono disponibili leva e pulsante **Colpisci**.

Nel menu **Pausa** puoi regolare la sensibilità della strusciata. La traiettoria sul campo distingue pallonetto, smorzata e tiro lungo. L’indicatore Trackpad mostra il bersaglio durante la carica, la velocità dopo il rilascio e il rimbalzo effettivo in ambra, o in rosso se esce.

## Tastiera e touch

1. Scegli **Centrale** per il diritto o **Rovescio** per una palla sul lato sinistro. I lanci **Larga** e **Corta** richiedono di muoversi con frecce, WASD o leva.
2. Seleziona **Incrociato**, **Centro** o **Lungolinea** con un tocco. Trascina il cursore per trovare un angolo intermedio. Su tastiera usa **Q**, **X**, **E**. Seleziona **Tempismo** (**T**) per lasciare che il momento del rilascio faccia passare la mira dall’incrociato, attraverso il centro, al lungolinea.
3. Premi **R** o **Lancia**, poi inizia a tenere **Spazio** o **Colpisci** mentre la palla scende. La racchetta si prepara sul lato della palla e il bersaglio mostra dove rimbalzerà il colpo.
4. Rilascia sul segnale verde **ORA**. La carica sale continuamente fino al 100% in 450 ms da fondo e in 400 ms al servizio. Colpisci il lancio vicino al culmine per sfruttare la prima piatta. In discesa la tacca Limite scende. I tempi sono quelli dello scambio a velocità normale.

**Facile**, **Normale** e **Difficile** cambiano reazione, corsa e profondità della risposta avversaria. Cambiare livello riavvia la prova e azzera il punteggio. Da **Pausa** puoi rallentare lo scambio al 65%.

Per un confronto ripetibile, scegli **Centrale** e mira a mano. Rilascia a circa 1,95 secondi dal lancio. Inizia a caricare a 1,50 secondi per un colpo pieno oppure a 1,85 per un appoggio. Con il lancio **Rovescio** puoi ripetere gli stessi tempi e osservare come incrociato e lungolinea cambino lato del campo.

## Verifiche

```sh
npm exec -- tsc -p design/tennis/tsconfig.json
node --import tsx --test design/tennis/physics.test.ts design/tennis/match.test.ts design/tennis/camera.test.ts
npm exec -- vite build design/tennis
```

Le prove coprono mira relativa, corsa e tiro in direzioni opposte, i tre livelli, servizio, let, doppio fallo, volée, pallonetto e smorzata. Controllano anche la chiusura da 6–6 a 9–7 e la corrispondenza della racchetta al punto d’impatto. In Chromium è stato completato un 7–0 contro Forchetta, seguiti replay e rivincita. Le prove di proiezione verificano la visibilità delle linee e la corrispondenza tra puntatore e terreno su schermi di cinque dimensioni. Lo sfondo è incluso nell’HTML autonomo.

## Campo e giocatori

La camera da fondo campo proietta insieme il terreno, il bersaglio, gli atleti e la palla. La [terra di laterizio](terra-di-laterizio.webp) viene proiettata in prospettiva fino ai piedi delle tribune. Colore, grana e zone battute si ispirano alla preparazione della terra da torneo. Le frenate lasciano strisce sottili che si dissolvono. I passi avanzano in base ai metri percorsi e il piede di appoggio si apre per invertire uno sprint. [La preparazione al Foro Italico](https://internazionalibnlditalia.com/it/news/in-evidenza/foro-italico-addetti-campi) · [La terra del Roland-Garros](https://www.rolandgarros.com/en-us/article/behold-the-clay-canvas-at-roland-garros-rg2022) I giocatori usano superfici costruite attorno allo scheletro animato, illuminate da due direzioni e ordinate in profondità. I primi piani prepartita riusano gli stessi modelli con più dettaglio. Nel tie-break Forchetta, Andrea e Claudia hanno appoggi, preparazioni e finali di colpo distinti. I ritratti del tabellone riusano i personaggi di Telepilo.

Il riferimento per l’identità dei movimenti è il lavoro di Hangar 13 su preparazioni e finali distinti. Il rapporto di 2K sul gioco in campo è il riferimento per leggere insieme superficie, pubblico e azione. [Animazioni di TopSpin 2K25](https://news.xbox.com/en-us/2024/04/03/signature-gameplay-animations-for-topspin-2k25/) · [Centre Court Report di 2K](https://newsroom-anz.2k.com/news/topspin-2k25-gameplay-showcase-and-full-list-of-tournaments-and-venues-revealed-including-all-four-grand-slamr-tournaments)

## Sfondo dell’arena

Lo [sfondo in travertino](arena-travertino.webp) è un’illustrazione originale generata con lo strumento integrato ImageGen e ottimizzata in WebP.

> Use case: stylized-concept. Create a new original wide 16:9 environment plate for a premium Italian tennis videogame, a fictional compact show court venue carved into a coastal stone terrace. Perspective is the broadcast game camera at a high fixed position directly behind the near baseline, exactly looking along the center axis of the future court. A crisp elegant Mediterranean stadium under dusk lighting: on the far left and right are curved pale travertine stands with deep petrol-blue seats, thin brass railings, and a discreet local crowd in understated clothing, shallow tiered geometry wrapping toward the foreground at the edges. Two slender LED floodlight arrays, warm illumination glazing the stone, a visible opening down the middle overlooking the deep blue sea and one dark headland. Cloud-filled evening sky lit with subtle rose-gold peach, cold navy upper sky, restrained palette. The sea horizon lies roughly 24 percent down from the top. The base of the far terrace is precisely 36 percent down. All of the middle foreground below that terrace is a clear matte mottled desaturated petrol-green outdoor apron, open uncluttered blank surface for an interactive tennis court to be composited later. Camera perspective, realistic atmospheric shading and beautiful believable materials, crisp modern sport videogame environmental art, no excessive bloom, no depth-of-field blur, no text or logos or graphics. Absolutely no existing venue replica and no actual tennis surface lines, no net, no court marking, no athlete in the foreground, no beige platform sticking into the blank central apron. Leave upper parts of the left and right architecture visually distinct. Full bleed.


## Materiale della terra

Texture originale generata con ImageGen integrato e compressa in WebP. Prompt utilizzato in produzione.

> Use case: photorealistic-natural. Produce a photoreal sports-game base-color texture plate, tall portrait 1:2 composition. Exactly orthographic vertical overhead survey looking straight down at an entire flat 15 by 29 metre championship red clay tennis surface after a few professional rallies. Full bleed from edge to edge entirely made of very fine crushed fired red-brick dust on a compacted court, mature burnt sienna, iron oxide red, sun-warmed rich russet and terracotta orange. Authentic Rome Foro Italico and Paris terre battue material at broadcast distance. Fine velvety granular powder, modest irregular directional drag-mat sweep passes, slender parallel bristle lines broken by foot traffic, faintly burnished sliding areas and a few delicate shoe scrapes in the two baseline zones about one tenth from the ends. Centre and run-offs carefully groomed, nuanced moisture patches. No tennis lines at all, zero white lines. No perspective, people, equipment, objects, typography, outside scenery, logos, shadows, directional light, borders or vignettes. Diffuse evenly lit professional albedo material, natural documentary photography, no large stones, craters, cracks, furrows or grass, no large dramatically exaggerated marks. Full uninterrupted earthen surface to be mapped under real moving players and painted court lines.
