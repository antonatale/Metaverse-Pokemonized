# Sfondi illustrati di Telepilo

Intervento richiesto da Antonio il 13 novembre 2026: nuovo titolo, **tutti i 13 ambienti di lotta**, **7 interni dei covi e 7 sale dei boss**. Le 28 illustrazioni sono integrate nel gioco; la proposta dei filmati rimane separata in [cinematica](../cinematica/README.md). Le immagini si vedono tutte nella [galleria](galleria.html); temi e precisazione su Forchetta sono in [covi.md](covi.md).

## Direzione artistica

Illustrazione mediterranea a gouache, contorni a inchiostro, materia della carta e profondità atmosferica. Rocce, ulivi, mare e architettura locale collegano le immagini. Sono interpretazioni illustrate dei luoghi, non ricostruzioni fotografiche.

Il titolo mostra il golfo al crepuscolo, rocce ai lati e due piccoli occhi luminosi in una fessura. Nome e menu sono elementi del gioco sovrapposti all'immagine, così restano nitidi e accessibili.

Ogni arena ha un primo piano libero per i combattenti e una composizione leggibile anche in verticale. Le creature, le mosse, i comandi e i nomi dei luoghi non sono impressi nelle immagini. La scelta dell'arena continua a seguire il luogo della storia; la notte usa una correzione di luce, più lieve negli interni già illuminati.

## File nel gioco

`src/assets/scenes/` contiene solo i WebP ottimizzati: `titolo`, `vindicio`, `pineta`, `porto`, `mola`, `castellone`, `maranola`, `castellonorato` (golfo da via Amendola), `gianola`, `caposele`, `centro`, `campo`, `birreria`, `cisterna`; inoltre `covo-<custode>` e `covo-<custode>-boss` per ciascuno dei sette custodi.

Il catalogo con nomi e inquadratura è `src/render/scenes.ts`; le associazioni ai luoghi sono in `src/data/scenes.ts`. Gli sfondi sono incorporati anche nella build HTML autonoma. Il vecchio generatore degli sfondi SVG è stato sostituito, evitando di tenere due sistemi per la stessa funzione. Le pedane sospese sono state sostituite dall'appoggio diretto sul pavimento; l'inquadratura conserva intere anche le creature più grandi.

## Generazione

Creati con il generatore di immagini integrato, autorizzato da Antonio quando è emerso che il modello richiesto «Images 2.6» non era selezionabile né verificabile. Nessuna attribuzione a un modello non confermato. Titolo generato da descrizione; ciascuna arena generata separatamente con l'illustrazione del titolo come riferimento stilistico. I prompt completi sono in `prompts.json`.

Gli originali ad alta qualità restano nella cartella di immagini generate di Codex; nel progetto si conservano le versioni WebP pronte per il gioco, senza duplicati PNG pesanti o schermate di test.

## Verifica del 13 novembre

540 controlli unitari e golden passati, TypeScript e build riusciti; passate le tre prove del prologo e delle prime sfide. Controllati tutti i 27 ambienti di lotta su computer, telefono e di notte: 81 combinazioni, con creature intere e comandi visibili. Verificate anche le leggende e gli schermi bassi.

Provato un incontro reale con un adepto e poi con Valentin: l'interno cambia nella sala del custode e resta quello fino alla vittoria, attraverso Granchietto, Cinghialetto e Valentin. Tutte le 28 immagini si decodificano anche senza rete dalla pagina costruita. I WebP occupano circa 5,4 MB; l'HTML autonomo completo circa 8,9 MB.
