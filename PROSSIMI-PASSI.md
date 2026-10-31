# Prossimi passi

Le richieste di Antonio per la modalità storia (31 ottobre 2026), con lo stato di ognuna. Serve a riprendere il
lavoro in una sessione nuova, senza il contesto di quella vecchia: per ogni punto c'è cosa si vuole, un'idea di come
farlo e i file da toccare. Quando un punto è fatto, si sposta in fondo tra i fatti (e si documenta in `CLAUDE.md`).

Regole che valgono sempre (vedi `CLAUDE.md`): i golden del motore (le 2040 lotte libere) non cambiano, le aggiunte
alla storia sono campi facoltativi; salvataggi compatibili (`lotte-tra-amici:storia:v1`); testi in italiano, commenti
in inglese, commit in italiano; niente versione per telefono (solo PC); creature originali, non i Pokémon veri.

## Da fare

5. **Antonio sulla mappa uguale a quello delle lotte**: stessi capelli, barba, occhiali e vestiti del ritratto.
   File: `render/canvas/walkers.ts`, `render/svg/looks.ts`.
7. **Abilità meno scontate.** Non +Attacco/+Difesa, ma poteri che cambiano il gioco: meno incontri, più catture,
   creature che crescono più in fretta, prezzi, Antonio che resiste quando lotta da solo… File: `data/growth.ts`
   (`SKILLS`), `ui/team.ts` (`openSkills`).
8. **Livelli ed evoluzioni delle iniziali fatti meglio**: curva dell'esperienza, livelli dell'evoluzione, schermata
   del livello con le statistiche che crescono, scelta della mossa da dimenticare quando se ne impara una quinta.
9. **Creature più coinvolgenti**: carattere, legame con Antonio (cresce lottando e passeggiando, in lotta le fa
   resistere), poteri sulla mappa che aprono strade (Polpino nuota, Ramarrino si arrampica, Gabbì vola).
10. **Una trama più ricca e missioni più complesse**, legate alle radici di Formia: i Lestrigoni e re Lamo, Cicerone,
    Mamurra di Gianola («Formia, la città dei Mamurra» di Orazio), Castellone e Mola che erano due paesi e nel 1862
    tornarono a chiamarsi Formia. Il sogno Formia → Torino → Chicago è solo una parte. File: `story/goals.ts`,
    `story/mentor.ts`, `data/maps/formia.ts`.
11. **Pesca dal molo** (un'attività per guadagnare) e **rivincite nei covi** con il livello che cresce.

## Fatti

- **Cicerone compare solo quando serve** (nuovo capitolo, prima volta di qualcosa, quando Antonio sembra perso da quattro minuti, tasto C), poi svanisce: sulla mappa e nell'angolo.
- **Il caffè si beve al bancone** del bar di Mola, scegliendo subito chi lo beve; niente più caffè nel menu.
- **Umani contro umani, creature contro creature**: con selvatiche e allenatori lottano le creature, una dopo l'altra; Antonio scende in campo solo quando sono tutte KO. Nei covi lottano Antonio e gli amici.
- **Incontri nascosti, come nei Pokémon**: erba alta e pozze tra gli scogli, con creature diverse per zona e per ora del giorno. Idea per dopo: altre specie selvatiche (meduse e ricci in acqua bassa, una lucertola dei muretti a secco, un pipistrello della Grotta della Janara) e un oggetto o un'abilità che tiene lontane le creature.
- **Sfondi delle lotte disegnati, a schermo intero**: dodici scene di Formia in SVG (Vindicio, pineta, porto, Mola, Castellone, monti, golfo, Gianola, Caposele, piazza della Vittoria, circolo, Morgana), di giorno e di notte; le foto sono state tolte.
