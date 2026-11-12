# Telepilo · Creature di Formia

Gioco di lotte a turni nella Formia reale: scegli uno di sei amici, alleva creature originali, affronta i cinque covi degli altri e segui Cicerone sulle tracce delle Pietre di Telepilo.

Richiede Node.js 22+. TypeScript e Vite, senza framework; distribuzione in un unico HTML autonomo.

```sh
npm ci
npm run dev
```

Apri http://localhost:5173. `npm run build` produce `dist/index.html`; `npm test` verifica dati, motore e grafica.

## Dove leggere

- [CLAUDE.md](CLAUDE.md): istruzioni brevi per lavorare sul progetto.
- [Gioco attuale](docs/gioco.md): meccaniche, protagonisti, trama e salvataggi.
- [Architettura](docs/architettura.md): dove trovare il codice da modificare.
- [Mappa](docs/mappa.md): generazione, rilievo, disegno e controlli geografici.
- [Sviluppo e verifiche](docs/sviluppo.md): comandi, simulatori, build e trailer.
- [Lavoro ancora aperto](docs/roadmap.md): unica lista delle migliorie future.
- [Fonti su Formia](docs/fonti-formia.md): provenienza dei fatti e attribuzione OpenStreetMap.

## Personaggi in preparazione

[Laboratorio dei personaggi](design/personaggi/README.md): specifica, ritratti SVG delle tre forme di tutti e sei, proposta di Costanzo e prototipo conservato come patch **non applicata**. [Apri la galleria](design/personaggi/galleria.html).

Il gioco attivo conserva i personaggi precedenti. Antonio vuole completare la qualità di tutti prima dell'integrazione, che affiderà a Opus. Codex cura idee, specifiche e grafiche.

Un'altra proposta geografica non integrata è conservata in [design/mappa](design/mappa/README.md).
