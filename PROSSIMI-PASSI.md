# Prossimi passi

Le richieste di Antonio per la modalità storia (31 ottobre 2026), con lo stato di ognuna. Serve a riprendere il
lavoro in una sessione nuova, senza il contesto di quella vecchia: per ogni punto c'è cosa si vuole, un'idea di come
farlo e i file da toccare. Quando un punto è fatto, si sposta in fondo tra i fatti (e si documenta in `CLAUDE.md`).

Regole che valgono sempre (vedi `CLAUDE.md`): i golden del motore (le 2040 lotte libere) non cambiano, le aggiunte
alla storia sono campi facoltativi; salvataggi compatibili (`lotte-tra-amici:storia:v1`); testi in italiano, commenti
in inglese, commit in italiano; niente versione per telefono (solo PC); creature originali, non i Pokémon veri.

## Da fare

**Il trailer, dopo ogni aggiornamento:** `npm run promo` rifà da solo la versione nuova del video dal gioco com'è adesso (circa 20 minuti). Se la novità merita una scena tutta sua (Torino, i poteri delle creature, la pesca…), si aggiunge una clip in `tools/promo/capture.ts` e uno shot in `tools/promo/trailer.ts`: vedi «Il trailer» in `CLAUDE.md`.


9. **Creature più coinvolgenti, il resto**: poteri sulla mappa che aprono strade (le creature del mare nuotano fino ai
   blocchi del porticciolo di Gianola, quelle dei muri si arrampicano sulle mura di Castellone, quelle che volano
   vedono dall'alto), altre specie selvatiche, una mossa per tipo di terreno. Carattere e legame sono fatti.
10. **La trama, il seguito**: dopo le Pietre di Telepilo (fatte), un secondo atto: Torino e poi Chicago come capitoli
    veri (una mappa di Torino, il cancello del treno in `data/gates.ts` è già il punto d'aggancio); altre missioni a
    più passi in città (la Fonte Artacia dell'Odissea, la Grotta della Janara a Gianola, il presepe vivente di
    Maranola a Natale); scelte nei dialoghi che cambiano qualcosa.
11. **Pesca dal molo** (un'attività per guadagnare: un pescatore sul molo del porto, un mini-gioco a tempo come il
    windsurf, `ui/activities.ts`) e **rivincite con gli amici** a livello più alto: i capi dei covi, battuti, lasciano
    il covo e si uniscono ad Antonio (`unless` sull'Npc), quindi la rivincita va fatta altrove, per esempio un torneo
    al Bruno Zauli dove gli amici lottano a livelli che crescono.
12. **Da provare a fondo**: tutta la trama giocata dall'inizio alla fine senza salvataggi preparati (i test la
    provano a pezzi), e il bilanciamento delle lotte con Mamurra (Granchione 21, Olivastro 19, Civettona 23: con il simulatore le iniziali al 22 battono l'Olivastro al 19 l'85–100% delle volte, al 20 solo il 16–44%) con `tools/sim-story.ts`.

## Fatti

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
- **Il trailer** (4 novembre 2026): 67 secondi in 1080p, fatto tutto da codice (`npm run promo`, `tools/promo/`): scene giocate dal gioco vero (Formia di giorno e di notte, casa, motorino, erba alta, lotte, cattura, evoluzione, diario, Lamo, Mamurra, Cicerone, abilità, attività, negozi, covi, l'Esame), i sei amici e le 20 creature con gli SVG del gioco, voli in 3D sulla pianta di Formia, il codice vero, e una musica originale sul tema delle lotte.
