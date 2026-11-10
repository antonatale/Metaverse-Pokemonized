# Prossimi passi

Le richieste di Antonio per la modalità storia (31 ottobre 2026), con lo stato di ognuna. Serve a riprendere il
lavoro in una sessione nuova, senza il contesto di quella vecchia: per ogni punto c'è cosa si vuole, un'idea di come
farlo e i file da toccare. Quando un punto è fatto, si sposta in fondo tra i fatti (e si documenta in `CLAUDE.md`).

Regole che valgono sempre (vedi `CLAUDE.md`): i golden del motore (le 2040 lotte libere) non cambiano, le aggiunte
alla storia sono campi facoltativi; salvataggi compatibili (`lotte-tra-amici:storia:v1`); testi in italiano, commenti
in inglese, commit in italiano; niente versione per telefono (solo PC); creature originali, non i Pokémon veri.

## Da fare

**Le task di Antonio dopo la prima prova a mano** (5 novembre 2026): sono in `TASK-MODELLI.md`, divise per modello. Vengono prima di tutto il resto.

**Il briefing delle idee** (4 novembre 2026): `BRIEFING-IDEE.md` ha lo studio su cosa rende divertenti questi giochi, due misure sul motore (il tipo decide già i duelli; le scelte nel turno sono poche), le idee per lotte, mappa, progressione, avvenimenti, amici, luoghi misteriosi, animazioni, versi, musica, scelte, leggendari e palestre-labirinto, le priorità di tutto (§7) e chi fa cosa tra Opus, Sonnet e Haiku (§9). Delle cose da **Opus max** è fatto tutto (vedi le sezioni in `CLAUDE.md`), tranne le lotte in due: Antonio ha detto di lasciarle perdere per adesso. Il briefing le vuole per il secondo atto, che non c'è ancora, e sono il cambio di motore più rischioso. Il nome del gioco è da cambiare (§6; non le chiavi `lotte-tra-amici:*`). Il metro delle lotte è `npm run sim:fun`.

**Il trailer è fermo** (4 novembre 2026): Antonio ha chiesto di non aggiornarlo più dopo ogni miglioramento del gioco, finché non lo chiede lui. Quando lo chiede, prima di registrare: la tappa `trama-dentro` è nuova e va aggiunta ai capitoli zittiti in `tools/promo/capture.ts`. Poi: `npm run promo` rifà da solo la versione nuova del video dal gioco com'è adesso (circa 40 minuti); se una novità merita una scena tutta sua, si aggiunge una clip in `tools/promo/capture.ts` e uno shot in `tools/promo/trailer.ts` (vedi «Il trailer» in `CLAUDE.md`).



9. **Creature, il resto**: una mossa che cambia con il terreno, altri posti da raggiungere con i poteri (fatti:
   nuotare, arrampicarsi, vedere dall'alto), e per i tipi nuovi le tracce che mancano: una musica per lotta di tipo,
   gli allenatori con squadre dei tipi nuovi (oggi hanno le creature di prima), una scheda dei dieci tipi anche fuori
   dalla lotta (nel diario). Le leggende sono pensate per una squadra intera (`tools/sim-legend.ts`): se Antonio le
   trova troppo dure o troppo facili, si toccano il livello sull'Npc (`formia.ts`) e i numeri della specie.
10. **La trama, il seguito**: dopo le Pietre di Telepilo (fatte), un secondo atto: Torino e poi Chicago come capitoli
    veri (una mappa di Torino, il cancello del treno in `data/gates.ts` è già il punto d'aggancio); altre missioni a
    più passi in città (la Fonte Artacia dell'Odissea, la Grotta della Janara a Gianola, il presepe vivente di
    Maranola a Natale); scelte nei dialoghi che cambiano qualcosa.
12. **Da provare a fondo**: tutta la trama giocata dall'inizio alla fine senza salvataggi preparati (i test la
    provano a pezzi), e il bilanciamento delle lotte con Mamurra (Tenaglione 21, Olivastro 19, Sibilla 23: con il simulatore le iniziali al 22 battono l'Olivastro al 19 l'85–100% delle volte, al 20 solo il 16–44%) con `tools/sim-story.ts`.

13. **Le tre iniziali pari tra loro ai primi livelli** (trovato il 4 novembre 2026): al livello 5 Gabbì batte Polpino
    il 100% delle volte con il Furto di panino (potenza 60 e metà del danno restituito, imparato al livello 1), e
    Ramarrino batte Polpino il 76%; senza quella mossa, o con meno usi o meno potenza, Gabbì perde quasi sempre contro
    le selvatiche di Gianola. Idea: per tutte e tre un inizio alla Pokémon (una mossa semplice e una di supporto) e la
    mossa forte verso il livello 6–8, poi ricontrollare le selvatiche. Si prova con `npx tsx tools/sim-story.ts
    polpino:5 gabbi:5` (e senza argomenti per tutte le coppie della storia). Attenzione: ai primi livelli le lotte sono
    quasi tutto o niente (un livello vale il 2,5% dei numeri), quindi ogni ritocco va simulato. Oggi la prima lotta
    con Tullio lo aggira dando alla sua creatura solo le prime mosse (`FIRST_MOVES` in `src/story/rival.ts`).
14. **La seconda lotta con Tullio** (sull'Appia, dopo la seconda pietra: Cicalina 13 e la seconda forma della sua
    creatura al 16, `teamOf` in `src/story/rival.ts`) è dura: da sola la creatura di Antonio la vince poco (Calamastro
    contro Burrasco al 16: 16%; Burrasco contro Ramarmo: 7%; Ramarmo contro Calamastro: 100%). Va bene se si usa
    tutta la squadra; da decidere se renderla più facile.
15. **Il ritratto di Tullio nel gioco**: oggi c'è solo nel trailer (`tools/promo/tullio.ts`, disegnato come gli amici
    con `defsOf` e il quinto argomento di `person` in `src/render/svg/index.ts`); nel gioco Tullio è solo l'omino
    sulla mappa (`LOOKS.tullio`). Si può mostrare nei suoi dialoghi o all'inizio della lotta con lui.

Le cose fatte sono in `docs/storia-task.md`.
