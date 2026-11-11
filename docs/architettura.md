# Architettura: dove sta ogni parte

> Spostato intero da `CLAUDE.md` il 10 novembre 2026 (task R1 di `REVISIONE.md`). Dove una frase è superata dal codice di oggi c'è una nota **Oggi:**.

## Dove si trova ogni parte

```
index.html                 guscio della pagina: le quattro sezioni (home, battle, world, overlay)
src/
  main.ts                  avvio: listener della tastiera (prima la mappa, poi la lotta), window.WORLD/UI per i
                           playtest, gancio window.claude.hot per l'aggiornamento a caldo dell'Artifact
  data/                    solo dati, niente logica
    characters.ts          i sei amici e l'Esame: statistiche, mosse, passive, difetti, frasi; ROSTER, PAIRS, JOKES
    creatures.ts           le creature di Formia: specie, mosse (CMOVES), evoluzioni, le tre iniziali, chi impara cosa
    fighters.ts            fighter(id): un amico, l'Esame o una creatura, per il motore e le schermate
    growth.ts              livelli (numeri al livello, esperienza), abilità di Antonio, negozi e prezzi
    types.ts               i tipi: i cinque delle persone in ciclo (TYPES, TYPE_ORDER), i dieci delle creature (MAGIC_CHART)
    tuning.ts              numeri di bilanciamento (TUNE, K, CRIT)
    items.ts               le cose che Antonio perde (ITEMS) e dove le ritrova (FOUND)
    nets.ts                i retini per le creature: sei tipi, quanto prendono meglio, quelli per il mare e per la notte
    maps/                  le mappe (index.ts: MAPS) e legend.ts (cosa significa ogni carattere)
      formia.ts            Formia vera: persone, cartelli, oggetti persi, quartieri, motorino (RIDES)
      formia-places.ts     i luoghi con le coordinate reali e i testi (casa, Eclipse, Morgana, stazione…)
      formia-ground.ts     GENERATO da tools/formia/build.ts: terreno, posizioni risolte, case di contorno
      formia-projection.ts dalle coordinate reali alle caselle
      casa.ts, circolo.ts, interni: l'appartamento di Antonio, i campi coperti del Bruno Zauli,
      morgana.ts           la Birreria Morgana (bancone, tavoli, palco del quiz)
      cisterna.ts          il Cisternone: il primo luogo con un enigma, e il modello degli altri
      telepilo.ts          La Porta di Telepilo: la strada per Lamo, sotto le mura di Castellone
    passives.ts            stati, abilità e oggetti che le creature portano: solo dati, «quando, se, fa»
    legends.ts             le leggende: quando escono, cosa apre la strada, la lotta in parti, come finiscono
    people.ts              le persone che crescono: mosse per livello, le mosse nuove, le forme; come si unisce ogni amico (JOIN)
    missions.ts            le missioni che può fare solo uno della compagnia
    choices.ts             le scelte della storia: chi chiede, le risposte
    covi.ts, gates.ts      i covi (palestre) con spille e frasi; le uscite dalle città
  battle/                  motore di lotta: puro, senza DOM, stato JSON con l'RNG dentro
    index.ts               API (ENGINE): newBattle, intro, beginTurn, playTurn, needs, available, moveLabel, snap, ai…
    turn.ts                flusso del turno, ordine di azione, fine lotta, voto dell'esame
    moves.ts               cosa fa ogni mossa, personaggio per personaggio
    damage.ts              danni, critici, cure, confusione
    ai.ts                  scelta del computer (e piano dell'Esame), chi mandare e quando cambiare nelle lotte di squadra
    passives.ts            fa quello che dice data/passives.ts: i quattro ganci (entrata, colpo dato, colpo subito, fine turno)
    stages.ts              la lotta a parti delle leggende
    labels.ts              etichette dei pulsanti (moveLabel) e bollini (snap/chips)
    state.ts, rng.ts, events.ts, types.ts
  story/                   logica della modalità storia, senza disegno
    choices.ts             le scelte del giocatore e cosa ne segue: Tullio, le pietre, come finisce una leggenda
    missions.ts            le regole delle missioni: chi può farle, cosa pagano
    maps.ts                mappe preparate, collisioni, oggetti persi, quartieri, covi, percorso più breve
    movement.ts            passi, rotazioni, porte, warp e viaggi (travel)
    activities.ts          le attività per Formia: elenco, volte fatte, record
    goals.ts               il giro di Formia: le tappe in ordine, la prossima, dove puntare la freccia
    daytime.ts             l'ora di Formia: alba e tramonto veri del giorno, buio, scelta del menu (chiave lotte-tra-amici:ora:v1)
    run.ts                 lo stato della corsetta in pineta
    growth.ts              la crescita nella storia: livelli ed esperienza, abilità, soldi, borsa, creature di Antonio
    rival.ts               il rivale Tullio: la creatura che sceglie, dove si trova, le squadre che crescono con la storia
    epilogue.ts            la storia di questa partita, raccontata prima di partire
    place.ts               le regole dei luoghi con un enigma e la dimostrazione che si possono finire (puro)
    place-run.ts           lo stesso nel gioco: cosa è stato fatto in un luogo, nel salvataggio
  save/
    story-progress.ts      le tre storie del dispositivo: la prima nella chiave lotte-tra-amici:storia:v1, le altre in
                           lotte-tra-amici:storia:v1:2 e :3; lotte-tra-amici:slot:v1 dice l'ultima giocata
  render/
    svg/                   ritratti generati da parametri (looks.ts), espressioni, capelli, vestiti, Esame, robot;
                           forms.ts: quello che gli amici indossano nelle forme della storia; badges.ts: spille e icone degli oggetti; creatures.ts: le creature, un SVG intero ciascuna; type-shapes.ts: la forma
                           di ogni tipo (luna, fulmine… onda, fiamma, piuma, pietra, tramonto);
                           nets.ts: i retini (in mano, nella borsa, chiusi per terra)
    canvas/                arte della mappa: terreno, edifici e oggetti, omini visti dall'alto, palette dai token --m-*
    world-view.ts          camera, cache dei pezzi di terreno, disegno ordinato, la notte (lampioni, finestre, faro),
                           anteprima della home, mappa intera
    atmosphere.ts          la luce e la vita della mappa: ombre che girano con il sole, nuvole, luce sui volumi, vento, risacca,
                           piccioni, farfalle, lucciole (vedi «La luce e la vita» in mappa.md)
  audio/                   musica ed effetti sintetizzati con la Web Audio API (nessun file audio)
    context.ts             AudioContext creato al primo tocco o tasto, bus musica/effetti, acceso/spento
                           (chiave lotte-tra-amici:audio:v1), pausa quando la scheda non è visibile
    tracks.ts              i brani in notazione da tracker: home, world, battle, boss, victory, defeat
    music.ts               sequencer: programma le note in anticipo sull'orologio audio, dissolvenze tra brani
    sfx.ts                 gli effetti (colpi, cure, KO, striscioni, passi, spille, clic…)
    cues.ts                quale suono va con quale evento del motore; blip della macchina da scrivere
    synth.ts               strumenti: oscillatori con inviluppo, rumore filtrato, batteria
  ui/
    gfx.ts                 Grafica della mappa: Alta o Bassa (chiave lotte-tra-amici:grafica:v1)
    sound.ts               l'interruttore audio (home, barra della lotta, HUD della storia) e il clic dei pulsanti
    common.ts              colori dei tipi, ritratti, le sezioni della pagina, scelte del giocatore (view)
    home.ts                il titolo a schermo intero: l'intro da saltare, il nome, «Entra nel mondo» e i tre salvataggi
    move-card.ts           una mossa disegnata come carta: i quattro bottoni della lotta e il foglio per impararne una
    battle-screen.ts       schermo di lotta: riproduce gli eventi del motore, passaggio del telefono, risultato, scheda
    effects.ts             effetti della lotta (affondi, proiettili, coriandoli, striscioni…)
    spells.ts              le magie delle creature in lotta: la carica, lo spettacolo di ogni tipo, il retino lanciato
    move-stages.ts         le scene delle mosse (data/move-fx.ts): i cinque gesti e quelle di Corrente (onda, morso…)
    move-scenes.ts         le altre scene: temporale, ombra, faro, canicola, lucciole, tromba d'aria, furto, frana…
    self-scenes.ts         le scene delle mosse su se stessi: conchiglia, mura, sole, libro, clessidra, radici, olio…
    move-props.ts          di cosa è fatta una mossa quando non sono le forme del tipo: rune, spine, pesci, piume, massi
    spell-kit.ts           gli aiuti per disegnarle: punti, curve, pezzi, tratti, e come chi subisce prende il colpo
    story-screen.ts        schermo della storia: HUD, croce, tastiera, dialoghi, covi, premi, menu (con il Diario
                           di Formia), motorino, ciclo dei frame
    activities.ts          le attività: beach volley, lettino, gelato, quiz da Morgana
    team.ts                le due squadre del menu, prima creatura, chi va in campo, ricompense ed evoluzioni, negozi,
                           l'albero delle abilità
    run.ts                 la corsetta in pineta: bandierine, cronometro nell'HUD
    icons.ts, dom.ts
  styles/                  CSS diviso per sezione; index.css = font + app.css; l'ordine degli @import è la cascata
  assets/fonts/            Atkinson Hyperlegible, Lilita One, Patrick Hand, Alegreya (woff2, OFL); Alegreya scrive le
                           parole delle lotte sulla pergamena (--font-book)
tests/
  unit/                    Vitest
  golden/                  scenari e registratori usati dai golden (lotte deterministiche, finto canvas, finto document)
  fixtures/                i golden: impronte di 2040 lotte, 168 stringhe SVG, le sequenze di disegno del canvas
  e2e/                     Playwright: harness.ts (orologio finto, seme), playthrough.spec.ts (partite intere,
                           storia, attività, casa e motorino), audio.spec.ts
tools/
  sim.ts                   simulatore di bilanciamento
  golden.mjs               genera i golden
  formia/                  la mappa di Formia: network.ts (strade e ferrovia disegnate a mano), build.ts (il generatore),
                           playable.ts e audit.ts (controlli), extract.mjs, paint.ts, show.ts, where.ts, drift.ts, density.ts (quanto c'è
                           da fare in ogni schermata)
  promo/                   il trailer: make.ts (tutto in un comando), capture.ts (le scene giocate), music.ts (la musica),
                           trailer.ts e trailer.html (il montaggio), city3d.ts (Formia in 3D), timeline.ts (battute e
                           suoni), encode.swift (l'mp4)
```

## Aggiungere una città

- **Mappa:** un file in `src/data/maps/` con righe tutte della stessa lunghezza, registrato in `maps/index.ts`.
- **Collegamento:** con una porta (`to`, `tx`, `ty`, `tdir` su un edificio) oppure con un `warp`. Gli interni hanno `inside: true` e la `city` di appartenenza.
- **Covo:** l'amico va messo nella mappa con `person` e `covo`. In `data/covi.ts` serve la voce con la spilla e le frasi (`intro`, `win`, `lose`, `after`).
- **Uscite** (`data/gates.ts`): si aprono con tutte le spille della città. Il cancello del treno per Torino è il punto di aggancio della prossima città, che non esiste ancora.
- **Verifica:** `npm test` controlla tutto.

## Se il build torna a essere un Artifact di claude.ai

- **CSP della cornice:** script esterni solo da cdnjs, jsdelivr o unpkg; fogli di stile solo da Google Fonts; niente immagini esterne. Il resto deve essere inline o generato in codice, e Phaser va benissimo incorporato nel bundle singlefile.
- **Font:** dopo la prima pubblicazione va verificato che i font incorporati (`@font-face` con URL `data:`) si carichino davvero nella cornice. Se no, pubblica `dist-google-fonts/index.html`.
- **Limite della pagina:** 16 MB. Oggi il file è di circa 1,2 MB (font compresi; erano 650 KB a fine ottobre).
- **Origine nuova:** un nuovo Artifact è una nuova origine, quindi salvataggi e libretto ripartono vuoti.

## Verso Phaser

> **Oggi:** la revisione del 10 novembre consiglia di non farlo adesso: il disegno non è il problema del gioco.

Le parti che una scena Phaser può sostituire senza toccare il resto:
- `render/world-view.ts` (legge `st`, `M`, `mover`, `parity`) con l'arte di `render/canvas/`;
- poi `ui/battle-screen.ts` ed `effects.ts` per la lotta, continuando a riprodurre gli stessi eventi del motore.

Motore, dati, logica della storia e salvataggi restano come sono.
