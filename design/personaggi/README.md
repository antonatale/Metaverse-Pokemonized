# Laboratorio dei personaggi — non integrato

**Stato:** idee e grafiche in revisione. Il gioco attivo è stato riportato ai personaggi del commit `fa6acef`; le modifiche sperimentali di questa chat sono conservate qui e non sono importate dall'applicazione.

**Responsabilità:** Codex cura idee, specifiche e grafiche. Antonio vuole migliorare la qualità di tutti prima dell'attuazione; l'integrazione sarà affidata a Opus quando Antonio la richiederà. Non applicare automaticamente la patch.

**Attenzione (12 novembre):** `prototipo/implementazione.patch` parte da `fa6acef`. Dopo la Formia grande `src/data/maps/homes.ts` è riscritto e `walkers.ts` ha aspetti nuovi: lì la patch non entra più pulita, i testi delle case e gli aspetti vanno portati a mano.

## Cosa aprire

- [Galleria offline](galleria.html): le tre forme attuali di tutti e sei, la proposta fotografica di Costanzo e l'anteprima della scena di Morgana.
- [Specifica da rivedere](specifica.md): fatti esistenti, nuove informazioni, proposte e limiti del prototipo.
- `grafica/riferimenti-attuali/`: 18 SVG autonomi esportati dal gioco precedente alle modifiche; **riferimenti esistenti, non nuovi redesign approvati**.
- `grafica/proposta-costanzo/`: tre SVG con volto e stile originali, capelli e completo rivisti dalla foto.
- `grafica/anteprime/`: le tavole mostrate in questa chat e la scena sperimentale.
- `prototipo/implementazione.patch`: codice e test dell'esperimento, non applicati. Include i quattro test della scelta narrativa e gli aggiornamenti deliberati ai golden. `base.txt` identifica il commit di partenza. `git apply --check` ne verifica l'applicabilità senza integrarla.

## Stato per personaggio

| Personaggio | Materiale disponibile | Lavoro ancora da fare |
|---|---|---|
| Antonio | Tre forme del gioco, mosse e progressione attuali | Approfondire qualità visiva, storia e ruolo di Figlio senza sostituire la sua identità |
| Costanzo | Tre riferimenti + tre forme proposte dalla foto, nuova biografia e dialoghi | Revisione e approvazione di riconoscibilità, scrittura e relazioni |
| Valentin | Tre forme attuali, nuova lore su Spirito e Trinità | Tradurre spiritualità e silenzio in una proposta visiva e narrativa completa |
| Andrea | Tre forme e meccaniche attuali | Revisione visiva/narrativa; chiarire l'incongruenza del testo di Calcolatore |
| Forchetta | Tre forme e meccaniche attuali | Revisione della qualità, delle battute e dei collegamenti |
| Zendavid | Tre forme e meccaniche attuali | Revisione della qualità e del ruolo nel gruppo |
| Claudia/Diabolica | Prima proposta narrativa e piccolo sprite nel prototipo | Riferimento visivo e design completo; eventuali mosse/forme ancora da decidere |

## Consegna a Opus, in futuro

Rileggere prima `specifica.md` e il codice attuale dei personaggi. Usare gli SVG come riferimenti e la patch come esperimento tecnico: non ricreare da zero chi esiste già e non trattare il prototipo come design finale. Preservare statistiche, mosse, tipi, progressione e salvataggi salvo cambiamenti esplicitamente motivati e misurati. Simulare i cambiamenti numerici; poi verificare ritratti, mappa, storia e prove complete. Approvazione del design e richiesta di integrazione devono precedere l'applicazione al gioco.
