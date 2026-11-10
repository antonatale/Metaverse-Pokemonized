# Il titolo e le tre storie

> Spostato intero da `CLAUDE.md` il 10 novembre 2026 (task R1 di `REVISIONE.md`). Dove una frase è superata dal codice di oggi c'è una nota **Oggi:**.

## Il titolo e le tre storie

- **Il titolo** (`ui/home.ts`, `styles/home.css`): a schermo intero, con dietro la Formia vera vista dall'alto (`WORLD.preview`, intorno a dove si è fermata l'ultima storia) che si muove piano. Il nome è disegnato lettera per lettera: sotto il contorno e l'ombra, sopra l'oro di un tramonto.
- **L'intro** (tre frasi, poi il nome che cade lettera per lettera) si salta con «Salta», un tocco o un tasto. Va una volta per sessione (`sessionStorage`). Non va con il movimento ridotto né nelle partite automatiche (`navigator.webdriver`), che la chiedono con `?intro=1`. Il fatto su Telepilo è quello già usato nel gioco: Odissea X, e Cicerone che chiama Formia la Telepilo dei Lestrigoni.
- **Entra nel mondo** (`#go-story`, lo usano anche i test e il trailer) continua l'ultima storia giocata, o la comincia. **Salvataggi** mostra le tre storie: chi si gioca, il livello, dove, spille, creature, compagnia e quando è stata salvata. Una storia vuota è «Nuova storia», e «Elimina» chiede un secondo tocco.
- **Una storia alla volta** (`save/story-progress.ts`): `st` è quella dello slot in uso. `useSlot(n)` la cambia, e tutto il gioco legge `st`, quindi mappa, squadra e borsa sono quelle dello slot. `save()` scrive nello slot in uso e segna l'ora (`at`). Dal menu della storia, nella scheda Mappa, «Torna al titolo».
- **Test:** `the intro, and three stories at once` (l'intro, una storia nuova nello slot 2, il ritorno alla prima com'era, l'eliminazione) e `title light`/`title dark`.

## Salvataggi sicuri (10 novembre 2026, R18)

- **Esporta e Importa** (nei Salvataggi del titolo, sotto ogni storia): «Esporta» dà un codice `TELEPILO1:` + il JSON
  della storia in base64 (`toCode` in `save/transfer.ts`), da copiare o scaricare come file; per la storia in uso è
  quella in memoria, quindi giusta anche se il dispositivo non è riuscito a salvarla. «Importa» prende un codice
  incollato o un file, lo controlla e lo ripulisce campo per campo (`cleanStory`: mappe, specie e amici che esistono,
  numeri nel loro intervallo, nomi delle creature solo testo e al massimo 16 caratteri), poi lo passa a `fix` come un
  salvataggio letto dal dispositivo (`putSlot` in `save/story-progress.ts`). Un codice sbagliato dice perché.
- **Copia di riserva:** una storia che non si legge più non viene sovrascritta in silenzio: prima il suo testo va in
  `<chiave>:backup` (una volta sola, una copia più vecchia non si perde) e il titolo lo dice. Anche importare sopra
  una storia mette quella vecchia nel `:backup`.
- **Avviso:** se salvare fallisce (finestra privata, memoria piena) il gioco va avanti e lo dice una volta, con il
  consiglio di esportare (`onSaveFail`, `trouble`).
- **Da fare:** la lista ordinata dei passaggi da una versione all'altra al posto dei `formia2…6` (l'ultimo punto di R18).
- Test: `tests/unit/transfer.test.ts`, e la partita `a story exported and imported`.
