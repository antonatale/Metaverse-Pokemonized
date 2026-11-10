# Revisione del 10 novembre 2026

Una revisione di tutto il progetto, chiesta da Antonio: cosa è fatto peggio (architettura e gioco), cosa renderebbe il gioco bello davvero, e le task da dare a Opus, Sonnet e Haiku.

**Su cosa è fatta:** la cartella sul Mac com'era il 10 novembre, cioè `main` (`3539dcb`) più 46 file non ancora committati (i sei protagonisti).

**Come è fatta:** ho letto codice e documenti, lanciato controlli e simulatori, e giocato con un browser automatico: l'apertura, la prima lotta, i menu a quattro risoluzioni da PC, tutte le 98 animazioni delle mosse, e un giocatore automatico che segue la freccia della storia da zero. I numeri di questo documento sono misurati, salvo dove dico «da verificare». Come rifarli è in fondo.

**Stato al 10 novembre, sera:** fatte A0, R1, R2, R3, R4, R13, R15; in parte R18 e R19. Tutto sul ramo `sei-protagonisti` di GitHub, non ancora in `main`. Le altre aspettano D1–D5 o sono le prossime (R5, R6, R14, R16, R17, R20…).

**Come usarla:** ogni task ha una sigla (R1, R2…). A un modello basta dire: «Leggi `REVISIONE.md` e fai la task R7». Le task già fatte restano in `TASK-MODELLI.md`.

---

## In breve

Il gioco è bello da vedere e ha sotto un motore serio. Il suo problema non è che manca qualcosa: in dodici giorni sono entrati più sistemi di quanti il percorso della storia ne faccia usare. Chi segue la freccia arriva a tre spille e alla prima pietra con una sola creatura, senza mai entrare nell'erba alta e senza aver catturato niente.

Le sei cose che contano, in ordine:

1. **I covi non usano le creature.** Le palestre sono duelli tra persone; le creature che allevi non c'entrano. Il gioco ha due metà che non si parlano.
2. **I sei protagonisti non sono pari.** Con Zendavid o Andrea il primo covo si vince il 10% e il 47% delle volte; alcuni covi chiedono dieci o venti livelli in più.
3. **Il caffè rompe la crescita.** 3 sesterzi danno 60 punti esperienza: con il premio della prima lotta la creatura va dal livello 5 all'11 senza lottare.
4. **Il ritmo è lento all'inizio.** Dieci schermate di spiegazione prima di muoversi, poi una lotta di 36–83 secondi in cui c'è un solo bottone sensato.
5. **L'interfaccia è da telefono, su un gioco per PC.** Menu e schede sono strisce di 600 pixel in mezzo allo schermo, e 32 partite di prova su 39 girano a misura di telefono.
6. **`CLAUDE.md` pesa 143 KB.** Sono circa 40 mila token che ogni sessione paga prima di cominciare, ed è in parte superato.

In più due cose da sistemare oggi: **due giorni di lavoro non sono committati**, e **il repo è pubblico con nomi veri, soprannomi e vie di casa** degli amici.

---

## 1. Cosa ho trovato

### A. Le due metà del gioco non si parlano

- I covi sono lotte tra persone, uno contro uno: chi giochi contro il capo (`fightOn` in `ui/story-screen.ts`). Da quando nessuno entra più nella compagnia (8 novembre) sei sempre tu, da solo.
- Le creature servono per selvatiche, allenatori, Mamurra e leggende. Con le spille non c'entrano.
- Quindi il giocatore cresce due cose separate: sé stesso per i covi, la squadra per la trama. Il livello della persona sale con i covi, con «Lotto io!», con le attività (20 punti) e con il caffè (60 punti).
- I resti delle idee di prima sono ancora sullo schermo. Il menu Squadra mostra «Le persone, 1 su 6» con cinque posti vuoti e dice «Gli altri amici sono in giro per Formia: batti chi ha un covo… e vengono con te», che non è più vero (`ui/team.ts`, riga 336). Restano `joinFriend`, «Gioca con lui», la modalità a due giocatori e l'Esame.

### B. Il percorso non fa giocare il gioco

Il giocatore automatico (Antonio, con Polpino) ha seguito la freccia per le prime dieci tappe, fino dentro al Cisternone, saltando i due minigiochi:

| Misura | Valore |
|---|---|
| Passi camminati fino al Cisternone | 296 (meno di un minuto di cammino) |
| Incontri nell'erba alta lungo il percorso | 0 |
| Creature in squadra a tre spille | 1 (Polpino, livello 8–10) |
| Retini usati | 0 su 5 |
| Lotte in tutto | 9: sei di creature (tre perse), tre covi (tutti vinti) |
| Sesterzi mai spesi | 345 |

- **Le strade non passano dall'erba.** Catturare, allenare, cambiare creatura, oggetti, stati, Risonanza: tutto fuori dal percorso.
- **Poi arriva il muro.** Fino alle peschiere bastano due creature al livello 13–14. Mamurra ha tre creature evolute al 19–23: con due creature al suo livello si vince dallo 0 al 9% (`sim-story trainers`). Tra le due tappe ci sono otto livelli e nessuna lotta di creature sul percorso.
- **Un allenatore di livello 22–28 sulla strada obbligata.** Il signore di Castellone guarda la via che porta alla signora del teatro, tappa della trama. Ha sfidato il giocatore automatico, che aveva un Polpino al 9, con una sola risposta possibile: «Sfida!».
- **Nel primo dungeon** una selvatica su nove è una Pipistrega di livello 20–22 (`HIDINGS.cisterna`), contro una squadra che lì arriva al livello 10. Si può scappare, ma niente lo dice.

### C. I sei protagonisti non sono pari

Simulazione dei cinque covi per ognuno (`docs/revisione/covi-sim.ts`: IA contro IA, 300 lotte, e a ogni passo si sceglie il capo più facile, cosa che il gioco non fa: mette i covi in ordine di distanza da casa).

| Chi giochi | Primo covo | Il covo peggiore | Livello per vincerlo 6 volte su 10 |
|---|---|---|---|
| Antonio | 90% | Valentin (liv. 18): 12% | 17 |
| Valentin | 100% | Costanzo (liv. 18): 23% | 26 |
| Costanzo | 100% | Antonio (liv. 15): 0% | 22 |
| Forchetta | 100% | Costanzo (liv. 18): 3% | 26 |
| Andrea | 47% | Antonio (liv. 9): 3% | 11, poi 16 e 21 |
| Zendavid | 10% | Costanzo (liv. 18): 6% | 39 |

- Il motivo: gli amici sono nati per un gioco alla pari tra amici, dove vinci scegliendo chi mandare. Qui sei bloccato su uno solo, e i loro scontri vanno da 0 a 100.
- Un livello vale il 2,5%: salire non basta, e per salire si beve caffè.
- Un giocatore vero fa meglio dell'IA, quindi i numeri esatti sono pessimisti. La forma del problema però resta.

### D. I numeri: crescita piatta, lotte sul filo, caffè

- **Crescita piatta.** Attacco, Difesa e Velocità +2,5% a livello, PS +1%. Dal livello 5 al 30 una creatura ha il 62% di attacco in più e il 25% di PS in più. Salire di livello si sente poco («PS +1»).
- **Lotte sul filo.** I colpi variano solo del 12% e i duelli sono gare vinte di poco. Per questo un +12% ribalta tutto: Gabbì contro Polpino passa dal 38 al 68%, Olivella contro Ramarrino dallo 0 al 53% (`npm run sim:fun`). Ogni modificatore del 10% vale quanto un vantaggio di tipo, e ce ne sono una decina uno sull'altro: tipo, luogo, carattere, oggetto, abilità, forma, guardia, scudo.
- **«Superefficace!» vale +12%.** La parola promette il doppio, come nei Pokémon; il numero che salta su passa da 23 a 26. Il giocatore non lo vede.
- **Poche scelte nel turno.** Chi usa sempre la mossa più forte tiene testa all'IA in 10 specie su 18; un duello dura in media 6 turni (obiettivo del briefing: 8–10).
- **Il caffè.** 3 sesterzi, 60 punti esperienza e +3 di legame (`COFFEE_XP` in `story/growth.ts`). Il premio della prima lotta con Tullio (30 sesterzi) compra dieci caffè: 600 punti, dal livello 5 all'11. Vale anche per la persona: è il modo più rapido di passare i covi.

### E. Il ritmo

- **L'apertura:** dieci schermate di Cicerone prima del primo passo, con comandi, tipi, livelli, soldi e covi tutti insieme. Il sistema per spiegare le cose quando succedono c'è già (`TIPS` in `story/mentor.ts`).
- **Un turno di lotta** dura 6,5–10 secondi lasciando scorrere il testo, 4,4 premendo Invio di continuo (tempo reale, animazioni accese). Le animazioni pesano poco: da quando parte la mossa al colpo passano in mediana 1,1 secondi. Il tempo va nelle attese tra una riga e l'altra.
- **La prima lotta** dura 7–8 turni, cioè 36–83 secondi, e la creatura conosce due mosse: con Polpino, Scintilla e una mossa «poco efficace». Non c'è niente da decidere.
- Non c'è un'opzione di velocità (era tra le cose rimaste in `PROSSIMI-PASSI.md`).

### F. Lo schermo

Il gioco è per PC (regola in `TASK-MODELLI.md`), ma è nato da telefono e si vede:

- menu, negozi, scheda della creatura, albero delle abilità sono fogli larghi circa 600 pixel attaccati al bordo basso, tagliati dallo schermo, in mezzo a un monitor da 1920;
- la pianta di Formia nel menu è circa 560×230 pixel per una mappa di 200×82 caselle;
- in lotta le carte delle mosse sono semitrasparenti e la scena dietro disturba la lettura;
- si cammina solo con la tastiera: niente clic sulla mappa (il percorso più breve c'è già, `route` in `story/maps.ts`), niente schermo intero, niente gamepad.

Difetti visti giocando:

- «Tu abiti in parco la Fontana», «in castellone», «in scauri»: l'apertura mette la minuscola al nome del posto (`ui/story-screen.ts`, riga 1032);
- la Scheda in lotta elenca tutte le mosse che la creatura imparerà, non le due che conosce;
- `index.html` non dichiara la lingua (`<html lang="it">`);
- `CLAUDE.md` dice 650 KB per il file del gioco: oggi è 1,23 MB.

Quello che invece funziona: ho lanciato tutte le 98 scene delle mosse, nessun errore e nessuna che si blocca.

### G. Codice e progetto

- **`CLAUDE.md`: 143 KB, circa 40 mila token**, caricati in ogni sessione di Claude Code. Con il resto (`TASK-MODELLI`, `PROSSIMI-PASSI`, `BRIEFING-IDEE`) i documenti sono 250 KB. Parti sono superate e si contraddicono: «Antonio è il protagonista», «gli amici si uniscono», «Gioca con lui», gli euro, i livelli dei covi.
- **Tutto il lavoro è stato fatto da Opus.** In `TASK-MODELLI.md` anche le task segnate per Sonnet e Haiku risultano fatte da Opus 5.5 a effort alto. È il costo che volevi evitare.
- **Due giorni di lavoro non committati**: 46 file, più uno stash e due bundle in `promo/`. Esistono solo sul Mac.
- **I golden proteggono il gioco che non c'è più.** Le 2040 lotte dei golden sono tutte lotte libere tra amici, Esame e due giocatori compresi (`tests/golden/scenarios.mjs`). Le lotte di creature, cioè il gioco di oggi, hanno test di singole regole ma nessuna trascrizione di riferimento. E la regola «i golden non cambiano» ha costretto ogni novità a entrare nel motore come caso a parte («solo nella storia»).
- **Un golden dipende dalla macchina.** Su Linux con Node 22 `canvas-golden` fallisce su quattro omini (Antonio e Valentin), anche sul codice committato; sul Mac risulta verde. Il registratore fa l'impronta dei numeri con tutti i decimali. Finché è così non si possono far girare i controlli in automatico su GitHub.
- **Le partite di prova guardano lo schermo sbagliato.** 32 su 39 girano a 390×844 (telefono), 36 su 39 con le animazioni spente. Le 2800 righe di scene animate non le prova quasi nessuno.
- **Le regole stanno nell'interfaccia.** `ui/story-screen.ts` ha 1167 righe, 229 funzioni e 49 import, e dentro ci sono incontri, allenatori che ti vedono, avvio e fine delle lotte, torneo, premi. Il 9% delle righe di `src/` supera i 160 caratteri.
- **Salvataggi senza rete.** Un salvataggio che non si legge diventa una storia nuova senza dire niente, e al primo passo viene sovrascritto (`load` e `save` in `save/story-progress.ts`). Non c'è modo di esportarlo, e ogni indirizzo diverso (file aperto da disco, localhost, pagina pubblicata) ha i suoi salvataggi. Se salvare fallisce il giocatore non lo sa.
- **Un'animazione rotta fermerebbe la lotta.** `caught` in `ui/battle-screen.ts` rilancia l'errore e la catena si ferma con i bottoni spenti. Non l'ho visto succedere; manca la rete di sicurezza, e lo stato della lotta sarebbe intatto.
- **Prestazioni, da verificare sul Mac.** La mappa si ridisegna intera a ogni fotogramma alla risoluzione piena dello schermo. In un contenitore senza scheda grafica: 17 ms a 1440×900, 34 ms a 1920×1080, 25 ms di notte. Sul tuo Mac andrà meglio; sul portatile di un amico può scattare.

### H. Persone vere in un repo pubblico

Il repo `antonatale/Metaverse-Pokemonized` è pubblico. Dentro ci sono nome e cognome di tre amici (`full` in `data/characters.ts`), i soprannomi, la via dove abita ognuno, e l'indirizzo di casa tua con il numero civico: in `CLAUDE.md` e su un cartello del gioco (`sign-casa` in `data/maps/formia.ts`). C'è anche il nome di una persona reale che non è nel gruppo, con la sua attività. Se pubblichi il gioco con un link, vale lo stesso per il gioco. È una decisione tua e loro (D2).

### I. Cosa è fatto bene, e non va toccato

Lo dico perché chi fa le task non lo «sistemi»: il motore con lo stato in JSON e il seme dentro; il validatore dei luoghi con enigma; i simulatori di bilanciamento; lo stile dei disegni e delle scene; i fatti di Formia verificati con le fonti; la mappa generata dai dati veri.

---

## 2. Cinque decisioni che spettano a te

| # | Decisione | Cosa consiglio |
|---|---|---|
| D1 | **Cosa sono i covi.** | Il capo ha due o tre creature del suo tipo e scende in campo per ultimo, con le sue mosse da persona. Tu lotti con la tua squadra, e per ultimo scendi tu. Il motore ha già la regola: è il tuo «Lotto io!» (`last` sulla panchina), e non distingue i due lati; dal lato del computer va provata. Le creature diventano il modo di prendere le spille e i sei protagonisti tornano pari. L'alternativa, tenere i duelli tra persone e ribilanciarne trenta, costa di più e resta fragile. |
| D2 | **Persone vere.** | Chiedi ai cinque amici se va bene. Poi una di queste: repo privato; oppure togliere cognomi, vie e numero civico dal gioco e dai documenti pubblici (restano nella storia di git: per cancellarli davvero serve riscriverla o rifare il repo). |
| D3 | **PC o anche telefono.** | Se lo mandi agli amici con un link, lo apriranno dal telefono. Consiglio: PC come schermo principale, telefono che funziona. Decidilo prima di R16. |
| D4 | **I tipi devono sentirsi?** | Fai fare l'esperimento R9 e giocalo. Non decidere a tavolino. |
| D5 | **Fermare i sistemi nuovi.** | Finché R5, R7 e R8 non sono fatte, niente meccaniche nuove. Ogni sistema in più oggi allarga il problema B. |

---

## 3. Le task

Ordine consigliato. Con pochi token, le otto che contano sono **R1, R3, R4, R5, R7, R8, R13, R15**.

| # | Cosa | Modello | Effort | Prima serve |
|---|---|---|---|---|
| A0 | Committare e mandare su GitHub il lavoro fermo | Antonio | — | — |
| R1 | `CLAUDE.md` corto, il resto in `docs/` | Sonnet 5.5 | medium | A0 |
| R2 | Archiviare le task fatte | Haiku 5.5 | medium | R1 |
| R3 | Golden uguali su ogni macchina, e controlli automatici su GitHub | Sonnet 5.5 | high | A0 |
| R4 | I difetti visti giocando | Sonnet 5.5 | medium | A0 |
| R5 | Il giocatore automatico e il suo rapporto | Sonnet 5.5 | xhigh | R3 |
| R6 | Il simulatore dei covi come strumento | Sonnet 5.5 | medium | D1 |
| R7 | I covi con le creature | Opus 5.5 | max | D1, R5, R6 |
| R8 | Economia e curva di crescita | Opus 5.5 | max | R5, R7 |
| R9 | Esperimento: i tipi che si sentono | Opus 5.5 | xhigh | R8 |
| R10 | Le tappe che insegnano il gioco | Sonnet 5.5 | xhigh | R5 |
| R11 | Tre percorsi con erba e allenatori | Opus 5.5 | high | R8, R10 |
| R12 | Golden delle lotte vere; via Esame e due giocatori | Opus 5.5 | high | R7 |
| R13 | L'apertura in tre battute | Sonnet 5.5 | high | — |
| R14 | Via i resti di «tutti in compagnia» | Sonnet 5.5 | high | D1 |
| R15 | La velocità della lotta | Sonnet 5.5 | high | — |
| R16 | L'interfaccia da PC | Sonnet 5.5 | xhigh | D3 |
| R17 | Comandi da PC: clic per camminare, schermo intero | Sonnet 5.5 | medium | — |
| R18 | Salvataggi sicuri: esporta, importa, copia di riserva | Opus 5.5 | high | — |
| R19 | La lotta non si blocca mai; partite di prova da PC | Sonnet 5.5 | high | R3 |
| R20 | Misurare la mappa sul Mac | Sonnet 5.5 | medium | — |
| R21 | Le regole fuori da `ui/story-screen.ts` | Opus 5.5 | high | R7, R8 |
| R22 | Righe leggibili, una volta sola | Haiku 5.5 | medium | R21 |

**Regole per tutte**, oltre a quelle di `CLAUDE.md`: una task per sessione; commit solo quando Antonio lo chiede; alla fine `npx tsc --noEmit`, `npm test`, `npm run build`, e `npm run test:e2e` se la task tocca lo schermo; si scrive in fondo alla task cosa è stato fatto e cosa no.

### Fase 0: subito

**A0. Committare il lavoro fermo (Antonio).** In Claude Code: «committa tutto su un ramo `sei-protagonisti` e fai push». Poi decidi se unirlo a `main`.

**Fatto (10 novembre, sera):** il lavoro del Mac è il commit `b4aebdc` sul ramo `sei-protagonisti`; lo stash del 4 novembre è sul ramo `archivio/stash-4-novembre` (da non unire); i due bundle di `promo/` erano già in `main`. `main` non è stato toccato.

**R1. `CLAUDE.md` corto (Sonnet, medium).**
- *Perché:* 143 KB in ogni sessione.
- *Cosa:* `CLAUDE.md` tiene solo: cos'è il gioco in dieci righe, i comandi, le convenzioni, le regole che non si rompono, e un indice «se tocchi X leggi `docs/X.md`». Ogni sezione di oggi va in un file di `docs/` (mappa, trama, creature-e-lotte, protagonisti, audio, trailer, test, fonti-formia…), spostata intera. Poi, in un secondo passaggio, si correggono le parti superate elencate al punto G, controllando ogni frase sul codice con una ricerca.
- *Fatto quando:* `CLAUDE.md` sotto i 10 KB; ogni titolo di oggi si ritrova in `docs/`; nessuna frase dice che gli amici si uniscono o parla di euro.

**Fatto:** `CLAUDE.md` 6 KB; le sezioni spostate intere in 14 file di `docs/`, con note **Oggi:** sulle frasi superate (euro, compagnia, livelli dei covi, apertura, misura del file, Phaser). Non fatto: il controllo frase per frase di tutto `docs/creature-e-lotte.md` (61 KB).

**R2. Archiviare le task fatte (Haiku, medium).** Le task segnate «fatto» di `TASK-MODELLI.md` e i punti ✅ di `PROSSIMI-PASSI.md` vanno in `docs/storia-task.md`, tagliati e incollati senza riscriverli. Nei due file resta solo quello che è da fare. *Fatto quando:* nessun testo perso (stesso numero di righe in tutto) e i due file sotto i 5 KB l'uno.

**Fatto:** `docs/storia-task.md`; nei due file resta solo P5 e le idee da fare (nessuna riga persa, controllato). `TASK-MODELLI.md` 2,4 KB, `PROSSIMI-PASSI.md` 5,3 KB: il secondo è sopra i 5 KB perché è tutto da fare.

**R3. Golden uguali ovunque, e controlli su GitHub (Sonnet, high).**
- *Cosa:* in `tests/golden/canvas.mjs` arrotondare i numeri (tre decimali) prima dell'impronta, poi `npm run golden`. Un file `.github/workflows/ci.yml` che a ogni push fa typecheck, `npm test` e build su Linux con Node 22.
- *Fatto quando:* `npm test` verde su Mac e su Linux; il segno verde compare su GitHub.

**Fatto:** arrotondamento a tre decimali in `tests/golden/canvas.mjs`, golden della mappa rigenerati (motore e ritratti identici), `.github/workflows/ci.yml` verde su GitHub. Da verificare: `npm test` sul Mac dopo il pull.

**R4. I difetti visti giocando (Sonnet, medium).** Quelli del punto F: la minuscola in «Tu abiti in…» (scrivere in `HOMES` la frase intera per ognuno, senza cambiare le maiuscole a mano); la Scheda in lotta mostra solo le mosse conosciute; `lang="it"`; il signore di Castellone non sfida a vista chi ha la creatura più forte più di tre livelli sotto la sua più debole (dice una frase e basta, la sfida resta parlando con lui). Un test per ognuno.

**Fatto:** `LIVES` in `data/people.ts`; la Scheda usa le mosse dei bottoni (`padMoves`); `lang="it"` e un'icona nella pagina (senza, Chrome prende un 404 su `/favicon.ico` e le partite falliscono); regola generale per tutti gli allenatori (`tooStrong` in `ui/story-screen.ts`, scarto 3), Cicerone dice che ti ha squadrato e lasciato perdere. Test: unitari e la partita «a trainer too strong to challenge on sight».

### Fase 1: il metro

**R5. Il giocatore automatico (Sonnet, xhigh).**
- *Perché:* oggi nessuno gioca la storia dall'inizio alla fine senza salvataggi preparati. È lo strumento che dice dove sono i muri dopo ogni modifica.
- *Cosa:* `tools/playtest/` a partire da `docs/revisione/bot-prototipo.mjs` (legge i ganci che servono in cima al file). Deve: arrivare al treno; ripartire dopo una sconfitta in un luogo con enigma; giocare o saltare i minigiochi dichiarandolo; girare per i 6 protagonisti e le 3 iniziali. Due modi di giocare: «solo freccia» e «prudente» (cattura quando la squadra ha meno di N creature, allena nell'erba quando perde due volte).
- *Il rapporto* (`npm run playtest`, un file Markdown): per tappa livelli, squadra, soldi, lotte vinte e perse, turni; e in fondo i sistemi mai toccati (catture, cambi, oggetti, Risonanza, negozi).
- *Fatto quando:* diciotto partite arrivano in fondo o dichiarano il muro; il rapporto di oggi ritrova i numeri del punto B.

**R6. Il simulatore dei covi (Sonnet, medium).** `docs/revisione/covi-sim.ts` diventa `tools/sim-covi.ts`, con la regola di lotta decisa in D1. Un test fallisce se un protagonista ha un covo sotto il 45% al livello previsto.

### Fase 2: il cuore

**R7. I covi con le creature (Opus, max).** Dipende da D1.
- *Cosa:* ogni capo ha una squadra di creature del suo tipo (2 al primo covo, 3 dal terzo) e scende per ultimo come persona (`last` sulla panchina, come già il giocatore: oggi è usato solo dal lato del giocatore, quindi l'IA che manda in campo va controllata). Il suo meccanismo di sempre resta, ed è il suo carattere da boss. Il livello segue le spille come oggi. I premi e le frasi restano.
- *Misura:* con R5 e R6, ogni protagonista con ognuna delle tre iniziali vince ogni covo tra il 55 e l'85% con la squadra che il percorso gli ha fatto costruire.
- *Attenzione:* le lotte tra sole persone restano nel torneo; i golden di oggi non devono cambiare.

**R8. Economia e curva di crescita (Opus, max).**
- *Il caffè:* non deve comprare livelli. Proposta: dà legame e un piccolo vantaggio per la prossima lotta, niente esperienza; oppure esperienza con un tetto legato alle spille. Scegliere con i numeri.
- *La curva:* una tabella «tappa → livello atteso → dimensione della squadra», e i livelli di allenatori e selvatiche messi su quella. Il salto tra le peschiere e Mamurra va riempito.
- *La prima lotta:* le iniziali partono con tre mosse, una delle quali non fa danno, così c'è una scelta dal primo turno. Controllare `sim-story` prima e dopo.
- *La crescita:* provare +4% a livello e PS +3%, con il simulatore, e tenere solo se la storia regge.
- *Fatto quando:* il giocatore «prudente» di R5 arriva al treno con tutti e diciotto gli abbinamenti, senza una tappa sotto il 50% e senza comprare caffè.

**R9. Esperimento: i tipi che si sentono (Opus, xhigh).** Su un ramo a parte: vantaggio ×1,5 e svantaggio ×0,67, con PS più alti e danni più bassi finché i duelli durano 8–10 turni e il tipo decide il 70–85% delle volte. Consegna: i numeri di `sim:fun` e `sim-story` prima e dopo, e una build da giocare. Decide Antonio (D4). Se non regge, si scrive perché e si chiude.

**R10. Le tappe che insegnano il gioco (Sonnet, xhigh).** Senza toccare la mappa:
- dopo la prima lotta, una tappa «La tua seconda creatura»: il guardaparco manda nell'erba di Gianola, con i cinque retini che già regala;
- prima del Cisternone e prima di Mamurra, Cicerone dice quante creature servono, e la tappa non parte finché la squadra non le ha;
- la prima volta che una creatura è in svantaggio di tipo, Cicerone insegna a cambiare;
- nel Cisternone la selvatica di livello 20 esce solo dopo la prima pietra.

**R11. Tre percorsi con erba e allenatori (Opus, high).** La strada per tre tappe della trama passa da un tratto con erba alta, due allenatori e una cosa da trovare: il sentiero della pineta verso la Tomba di Cicerone, il parco di Gianola verso la villa, gli uliveti verso i monti. Si fa con `tools/formia/network.ts` e `build.ts`; se le caselle cambiano serve il nuovo `formiaN` nei salvataggi. *Fatto quando:* il giocatore «solo freccia» incontra almeno dieci selvatiche e sei allenatori prima di Mamurra.

**R12. Golden delle lotte vere (Opus, high).** Un secondo file di golden con lotte di squadra tra creature (panchina, stati, abilità, oggetti, parti delle leggende, capo che scende per ultimo), stesso metodo delle 2040. Poi togliere dallo schermo e dai golden quello che il gioco non usa più (Esame, due giocatori), lasciando le coppie di amici che servono al torneo.

### Fase 3: ritmo e schermo

**R13. L'apertura in tre battute (Sonnet, high).** Cicerone dice chi è, che a Formia succede qualcosa, e dove andare. Il resto (comandi, tipi, livelli, soldi, covi) arriva con i `TIPS` nel momento in cui serve. *Fatto quando:* dal «chi sei?» al primo passo ci sono al massimo quattro schermate, e ogni cosa tolta ha il suo consiglio al momento giusto.

**Fatto:** quattro schermate (tre righe di `OPENING` più quella su casa e covi); `TIPS.covo` nuovo per il ciclo dei tipi delle persone, `level` e `money` dicono livelli e sesterzi. Test in `creatures.test.ts`.

**R14. Via i resti di «tutti in compagnia» (Sonnet, high).** Dipende da D1. Dal menu spariscono «Le persone, 1 su 6», il testo «vengono con te» e «Gioca con lui»; dal codice `joinFriend` e quello che lo serve, se niente lo chiama più. I salvataggi vecchi con una compagnia devono aprirsi lo stesso.

**R15. La velocità della lotta (Sonnet, high).** Un'opzione nel menu e in lotta: Normale, Veloce, Lampo. In Veloce un turno sta sotto i 2,5 secondi: attese tra le righe dimezzate, la carica della mossa mostrata intera solo la prima volta in ogni lotta. Tenere premuto Invio manda avanti. La scelta si ricorda (`lotte-tra-amici:velocita:v1`). Un test in tempo reale misura il turno.

**Fatto:** `ui/speed.ts` (vedi `docs/lotta-a-schermo.md`). Veloce: testo ×2, attese a metà, tutte le animazioni della lotta a 0,4; Lampo: testo intero, attese a un quarto, animazioni a 0,3. Invio tenuto premuto andava già avanti. Misura con l'orologio del gioco (partite «a turn at speed …»): primo turno sotto i 2,5 s in Veloce, sopra i 5 a Normale. Da guardare a occhio da Antonio: se Lampo è troppo.

**R16. L'interfaccia da PC (Sonnet, xhigh).** Dipende da D3. Sopra i 900 pixel di larghezza: menu e schede al centro o di lato, alti quanto lo schermo, mai tagliati; la pianta di Formia a schermo intero con M; le carte delle mosse opache. Sotto, tutto resta com'è. Antonio guarda le schermate a 1366×768 e 1920×1080 prima di chiudere.

**R17. Comandi da PC (Sonnet, medium).** Clic su una casella: ci si cammina con `route`. Clic su una persona vicina: ci si parla. Tasto F: schermo intero. Gamepad solo se resta tempo.

**R18. Salvataggi sicuri (Opus, high).**
- *Esporta e importa:* dal titolo, un codice da copiare o un file. Quello che si importa va controllato e ripulito campo per campo (nomi delle creature compresi), perché viene da fuori.
- *Copia di riserva:* prima di sovrascrivere un salvataggio che non si è letto bene, la versione vecchia va in una chiave `:backup`.
- *Avviso:* se salvare fallisce, il giocatore lo vede.
- *Versioni:* una lista ordinata di passaggi da una versione alla successiva, al posto dei `formia2…6`.

**Fatto in parte:** esporta e importa (codice e file), copia di riserva, avviso se salvare fallisce; test unitari e la partita «a story exported and imported» (vedi `docs/titolo-e-salvataggi.md`). Non fatto: la lista ordinata delle versioni al posto dei `formia2…6`.

**R19. La lotta non si blocca mai; partite da PC (Sonnet, high).** Ogni scena animata gira dentro una rete: se lancia un errore o supera gli otto secondi, la lotta la salta, scrive l'errore in console e continua. Le partite di prova passano a 1366×768 di base (restano a misura di telefono solo quelle che provano la croce), e almeno dieci girano con le animazioni accese.

**Fatto in parte:** `safeShow` (`ui/safe-show.ts`) con test; partite a 1366×768 di base (telefono solo con la croce). Non fatto: portare a dieci le partite con le animazioni accese (oggi sono otto). Nel contenitore, a 1366×768 alcune partite sono lente (fino a 5 minuti): il tempo massimo è salito a 240 s; sul Mac vanno guardate.

**R20. Misurare la mappa sul Mac (Sonnet, medium).** Con il profiler di Chrome: tempo per fotogramma camminando, di giorno e di notte, a schermo pieno. Se supera gli 8 ms: limitare la risoluzione del canvas a 2× di 1440×900 e disegnare la notte meno spesso. Si scrive il prima e il dopo.

### Fase 4: l'architettura, dopo che il gioco è deciso

**R21. Le regole fuori dall'interfaccia (Opus, high).** Da `ui/story-screen.ts` a `story/`: incontri, allenatori che vedono il giocatore, preparazione e fine di una lotta, torneo, premi. Una estrazione per commit, partite verdi a ogni passo. Si fa dopo R7 e R8, perché quel codice cambierà.

**R22. Righe leggibili (Haiku, medium).** Prettier una volta sola su `src/`, larghezza 140, in un commit che non cambia altro, quando non ci sono altri lavori aperti. I golden devono restare identici.

---

## 4. Idee oltre le richieste

Non sono task finché non le scegli. Le prime tre sono quelle su cui punterei.

1. **Il campione di Formia è la tua partita di prima.** Ci sono sei protagonisti e tre salvataggi. Quando finisci la storia con uno, la sua squadra finale diventa l'ultimo avversario nella storia del protagonista dopo, con le sue creature, i loro nomi e le sue scelte. Dà un motivo per rigiocare, non serve un server, e il gioco diventa più difficile da solo. *Opus high per il bilanciamento, dopo R7.*
2. **La sfida con un link.** Il gioco pubblicato legge una squadra dall'indirizzo (`…/#sfida=codice`). Mandi il link su WhatsApp, l'amico lo apre e lotta contro la tua squadra guidata dall'IA. Passo dopo: il covo di Costanzo usa la squadra vera che Costanzo ha esportato. Usa lo stesso codice di R18. *Opus xhigh per formato e controlli, Sonnet per lo schermo.*
3. **La cartolina da Formia.** Al treno, l'epilogo diventa un'immagine da salvare e mandare: chi sei, la squadra disegnata, le spille, cosa hai deciso delle pietre, quanto ci hai messo. È il modo in cui il gioco gira tra gli amici. *Sonnet high.*
4. **Formia secondo il calendario.** L'ora vera c'è già. Aggiungere i giorni: il 2 giugno Sant'Erasmo con la processione a Castellone e Fuocelmo più facile da trovare, il 24 giugno San Giovanni a Mola, d'estate i lidi pieni e d'inverno vuoti. *Sonnet high, fatti da verificare.*
5. **Una passeggiata senza lotte.** Una modalità per chi non gioca (genitori, chi a Formia ci è nato): si cammina, si leggono i cartelli e le storie dei posti, si riempie un album. I fatti verificati ci sono già. *Sonnet high.*
6. **Persone che vogliono qualcosa.** Oggi molti abitanti recitano un fatto da guida turistica. A dieci di loro dare un desiderio piccolo che il giocatore può esaudire (portare una tiella, trovare un gatto, dire chi ha vinto il comizio), con una frase diversa dopo. *Sonnet xhigh.*
7. **Una pagina pubblica e un README in inglese.** Motore deterministico, validatore che dimostra gli enigmi, bilanciamento fatto con le simulazioni: è lavoro da ingegnere e si può mostrare. *Sonnet medium, dopo D2.*

---

## 5. Cosa non fare adesso

- **Phaser.** Il disegno non è il problema del gioco, e la migrazione costerebbe molto senza cambiare quello che il giocatore fa.
- **Torino e Milano.** Prima Formia deve reggere dall'inizio alla fine.
- **Altre creature, mosse, tipi, stati.** Ce ne sono più di quante il percorso ne mostri.
- **Portare i meccanismi degli amici sui ganci a dati.** Elegante, rischioso per i golden, e inutile finché D1 non è deciso.

---

## Come ho misurato

| Cosa | Come rifarlo |
|---|---|
| Covi per protagonista (C) | `npx tsx docs/revisione/covi-sim.ts` |
| Tipi, scelte, turni (D) | `npm run sim:fun` |
| Allenatori della storia (B) | `npx tsx tools/sim-story.ts trainers` |
| Percorso della storia (B) | `docs/revisione/bot-prototipo.mjs`, con i ganci scritti in cima al file |
| Durata del turno (E) | Playwright in tempo reale, 1440×900, animazioni accese, prima lotta con Tullio: 8 turni in 83 s senza toccare, 7 turni in 36 s premendo Invio ogni 100 ms |
| Scene delle mosse (F) | `UI._debug.cast` per ognuna delle 98 mosse di `CMOVES`, tempo fino al colpo: mediana 1,1 s |
| Fotogramma della mappa (G) | durata della funzione di `requestAnimationFrame` camminando, Chromium senza scheda grafica |
| Golden (G) | `npm test` su Linux x64, Node 22 |

Non ho provato: il gioco oltre il Cisternone con il giocatore automatico; i minigiochi; l'audio; le partite Playwright del progetto (il browser del contenitore è di un'altra versione).
