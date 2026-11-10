# Task per modello

Le richieste di Antonio del 5 novembre 2026, dopo aver provato il gioco a mano. Se sei un modello e ti ha detto di cercare le tue task, sono qui: trova la tua sezione e parti dalla prima non fatta, in ordine.

**Prima di iniziare:** leggi `CLAUDE.md`: architettura, convenzioni e regole sono lì. Le regole che contano di più:

- I 2040 golden delle lotte libere non cambiano. Il motore resta puro: niente `Math.random`, `Date` né DOM. La UI non conosce le regole.
- Salvataggi compatibili: campi facoltativi, le chiavi `lotte-tra-amici:*` non si rinominano.
- Testi in italiano, commenti in inglese, commit in italiano, un commit per idea. Solo PC: niente versione per telefono.
- Il trailer (`tools/promo/`) non si tocca finché Antonio non lo chiede.
- I fatti su Formia si verificano prima di scriverli: niente di inventato.
- Commit e push solo quando Antonio lo chiede.

**Prima di dire che hai finito:** `npx tsc --noEmit`, `npx vitest run`, `npx playwright test`. Se fallisce solo la prova `sound is on by default` di `audio.spec.ts` con «Expected: > 5, Received: 5», di solito è il Mac: vedi «Test» in `CLAUDE.md`. Quando finisci una task, segna «fatto» nella tabella.

Le task fatte sono in `docs/storia-task.md`; quelle nuove in `REVISIONE.md`.

## I sei protagonisti (richiesta di Antonio dell'8 novembre 2026)

| # | Cosa | Stato |
|---|---|---|
| P5 | La storia di ognuno. Fatto senza bisogno di risposte: l'intro di Cicerone dice dove abiti, i cinque covi e la tua città; il giro di Formia mette i covi in ordine di distanza da casa tua (`myStops`); il rivale Tullio sceglie la creatura che batte quella del protagonista (`st.squad[0]` in `story/rival.ts`); in una storia di un protagonista ci sono solo le sue missioni (`myMissions`). Da fare con le informazioni di Antonio: frasi, consigli, posti e mosse pensati per ognuno | in corso |

**Domande fatte ad Antonio** (le risposte vanno in P5 e P6, e nell'aspetto in `render/svg/looks.ts`): per ognuno, cosa fa e perché va a Torino o a Milano; due o tre posti di Formia dove va davvero e con chi; frasi tipiche e fissazioni; com'è fatto (capelli, occhi, barba, vestiti, accessori) e come lo vede nelle due forme; due o tre cose da trasformare in mosse; se i covi stanno bene dove sono (Valentin all'Eclipse, Zendavid in pineta, Andrea al padel del Bruno Zauli, Antonio al Palamendola).
