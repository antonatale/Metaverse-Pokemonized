# Prossimi passi

Le richieste di Antonio per la modalità storia (31 ottobre 2026), con lo stato di ognuna. Serve a riprendere il
lavoro in una sessione nuova, senza il contesto di quella vecchia: per ogni punto c'è cosa si vuole, un'idea di come
farlo e i file da toccare. Quando un punto è fatto, si sposta in fondo tra i fatti (e si documenta in `CLAUDE.md`).

Regole che valgono sempre (vedi `CLAUDE.md`): i golden del motore (le 2040 lotte libere) non cambiano, le aggiunte
alla storia sono campi facoltativi; salvataggi compatibili (`lotte-tra-amici:storia:v1`); testi in italiano, commenti
in inglese, commit in italiano; niente versione per telefono (solo PC); creature originali, non i Pokémon veri.

## Da fare

**Il trailer, dopo ogni aggiornamento:** `npm run promo` rifà da solo la versione nuova del video dal gioco com'è adesso (circa 40 minuti). Se la novità merita una scena tutta sua (Torino, i poteri delle creature, la pesca…), si aggiunge una clip in `tools/promo/capture.ts` e uno shot in `tools/promo/trailer.ts`: vedi «Il trailer» in `CLAUDE.md`.


14. **Il trailer dopo le magie nuove**: le lotte durano di più, quindi gli shot di `tools/promo/trailer.ts` agganciati a un momento di una clip di lotta vanno ricontrollati (vedi «Il trailer» in `CLAUDE.md`).

9. **Creature, il resto**: altre specie selvatiche con disegni nuovi (meduse e ricci in acqua bassa, un pipistrello
   della Grotta della Janara), una mossa che cambia con il terreno, e altri posti da raggiungere con i poteri
   (fatti: nuotare, arrampicarsi, vedere dall'alto).
10. **La trama, il seguito**: dopo le Pietre di Telepilo (fatte), un secondo atto: Torino e poi Chicago come capitoli
    veri (una mappa di Torino, il cancello del treno in `data/gates.ts` è già il punto d'aggancio); altre missioni a
    più passi in città (la Fonte Artacia dell'Odissea, la Grotta della Janara a Gianola, il presepe vivente di
    Maranola a Natale); scelte nei dialoghi che cambiano qualcosa.
12. **Da provare a fondo**: tutta la trama giocata dall'inizio alla fine senza salvataggi preparati (i test la
    provano a pezzi), e il bilanciamento delle lotte con Mamurra (Tenaglione 21, Olivastro 19, Sibilla 23: con il simulatore le iniziali al 22 battono l'Olivastro al 19 l'85–100% delle volte, al 20 solo il 16–44%) con `tools/sim-story.ts`.

## Fatti

- **Il rivale, gli allenatori che ti vedono, le due squadre, l'albero delle abilità** (4 novembre 2026): Tullio, il nipote del guardaparco, sceglie dopo Antonio l'iniziale che batte la sua e lo sfida tre volte (al parco, sull'Appia, dopo Mamurra); gli allenatori non battuti vedono Antonio davanti a sé, il «!», gli vengono incontro e lo sfidano; nel menu le persone e le creature sono due squadre da sei posti; le abilità sono un albero a tre rami dove ognuna si apre con un punto in quella prima.

- **Le magie delle creature, grandi e diverse per tipo** (4 novembre 2026): il buio intorno, il cerchio magico, il nome della mossa su una fascia; la falce di luna, i fulmini dalla nuvola, la rete di stelle, le onde di canto, il cuore gigante, ognuna col suo suono, e una versione grande per le mosse forti; numeri dei danni grandi con «Superefficace!» e simili, la barra dei PS che scende con la fascia chiara; le mosse delle creature colorate col loro tipo e la runa; l'entrata in lotta con le fasce, come nei Pokémon (`ui/spells.ts`).
- **I retini** (4 novembre 2026): sei retini di pregio diverso (dal Retino al Retino d'oro, più Nassa e Rete della lampara), il retaio accanto al guardaparco che li vende tutti, cinque retini in regalo con la prima creatura e la spiegazione di come si cattura, la Borsa come riga in lotta con la probabilità, il retino che trema prima di reggere (`data/nets.ts`).
- **I premi del diario delle creature** (4 novembre 2026): il guardaparco dà retini sempre migliori (e sesterzi) a 3, 6, 10, 15 creature avute e a tutte.
- **I sesterzi al posto degli euro** (4 novembre 2026): la moneta della Formia romana, con la moneta d'oro nell'HUD; il nome sta in `COIN` (`data/growth.ts`).

- **Cicerone compare solo quando serve** (nuovo capitolo, prima volta di qualcosa, quando Antonio sembra perso da quattro minuti, tasto C), poi svanisce: sulla mappa e nell'angolo.
- **Il caffè si beve al bancone** del bar di Mola, scegliendo subito chi lo beve; niente più caffè nel menu.
- **Umani contro umani, creature contro creature**: con selvatiche e allenatori lottano le creature, una dopo l'altra; Antonio scende in campo solo quando sono tutte KO. Nei covi lottano Antonio e gli amici.
- **Incontri nascosti, come nei Pokémon**: erba alta e pozze tra gli scogli, con creature diverse per zona e per ora del giorno. Idea per dopo: altre specie selvatiche (meduse e ricci in acqua bassa, una lucertola dei muretti a secco, un pipistrello della Grotta della Janara) e un oggetto o un'abilità che tiene lontane le creature.
- **Sfondi delle lotte disegnati, a schermo intero**: dodici scene di Formia in SVG (Vindicio, pineta, porto, Mola, Castellone, monti, golfo, Gianola, Caposele, piazza della Vittoria, circolo, Morgana), di giorno e di notte; le foto sono state tolte.
- **Antonio sulla mappa più simile a lui**, ma stilizzato (come chiesto dopo una prima prova con la testa del ritratto, che risultava tagliata): ricci grandi, felpa blu, catenina e orecchino d'oro, sopracciglia, sorriso storto.
- **Abilità che cambiano il gioco**: tre strade (Esploratore, Allenatore, Formiano doc) con dieci abilità: meno incontri, creature rare e dorate, passo più svelto, esperienza alle creature, retini più sicuri, creature che resistono a 1 PS, Antonio più forte quando lotta da solo, prezzi e attività.
- **Crescita delle creature**: la schermata del livello dice cosa cresce, si sceglie la mossa da dimenticare, l'ultima forma delle iniziali (al 26) vuole il legame; ogni creatura ha un legame con Antonio (cuori, cresce lottando, passeggiando, parlandole) e un carattere.
- **Una trama legata alle radici di Formia**: le Pietre di Telepilo. Il fantasma di Mamurra e i suoi uomini cercano le tre pietre del sigillo della città dei Lestrigoni; Antonio le trova con Cicerone (scavi di Gianola, Archivio della Torre di Mola, Cisternone e l'indovinello della signora del teatro, peschiere di Caposele, tre domande alla Tomba di Cicerone) e affronta Mamurra alla sua villa; poi esce Lamo. Il sogno Torino → Chicago è il finale.
- **La creatura che ti segue trova cose per terra**: euro, tielle, retini, più spesso se il legame è forte.
- **Niente spoiler** (4 novembre 2026): Cicerone all'inizio non anticipa più Torino e Chicago né il nome di Mamurra; nel menu le tappe future sono «???».
- **Barre dell'esperienza sempre sulla mappa** (il Primo della compagnia, che si sceglie, e la creatura che segue), **menu in quattro schede**, **squadra di sei creature con le altre a casa** (si vedono nell'appartamento e lì si cambiano), **effetti delle mosse più belli** (scie, onde, stelle, forme di ogni tipo).
- **I poteri delle creature**: con quelle del mare si nuota (fino alle vasche romane di Gianola, con un'anfora sul fondo), con lucertole e cicale si sale sulle mura di Castellone, con gabbiani e civette si vede Formia dall'alto (tasto V); in acqua e sulle mura vivono altre creature, tra cui le iniziali non scelte.
- **Pesca dal molo e Torneo degli amici**: il pescatore di Mola porta a pescare (tre lanci a tempo, il punteggio in grammi); al Bruno Zauli il velocista organizza un torneo di cinque amici di fila, con le rivincite di Costanzo e Forchetta, che a ogni edizione vinta diventa più duro.
- **Il trailer** (4 novembre 2026): un minuto e quaranta in 1080p, fatto tutto da codice (`npm run promo`, `tools/promo/`): Formia in 3D di notte, al tramonto e di giorno (three.js, con i Monti Aurunci, la luna, il faro e le lucine della magia), scene giocate dal gioco vero (Formia di giorno e di notte, casa, motorino, erba alta, lotte, cattura, nuoto, volo, Cicerone, abilità, attività, covi, l'Esame), due colpi visti dagli occhi della creatura, i sei amici e le 20 creature in ombra, e una musica originale epica e misteriosa (coro, ottoni, archi, taiko). Senza spoiler, e senza dire come è fatto: «Creato dall'immaginazione».
