# Giorno e notte

> Spostato intero da `CLAUDE.md` il 10 novembre 2026 (task R1 di `REVISIONE.md`). Dove una frase è superata dal codice di oggi c'è una nota **Oggi:**.

## Giorno e notte

- **L'ora di Formia** (`story/daytime.ts`): di base è quella di fuori, dall'orologio del dispositivo. Alba e tramonto sono quelli veri di Formia per quel giorno, calcolati da latitudine, longitudine, equazione del tempo e ora legale (il 30 ottobre: 6:38 e 17:00). Il buio cresce da un quarto d'ora prima del tramonto a un'ora dopo, e al contrario all'alba.
- **Dal menu** ("Ora del giorno") si sceglie Come fuori, Giorno, Tramonto o Notte. La scelta sta in `lotte-tra-amici:ora:v1`, sempre in `try/catch`; i salvataggi non si toccano.
- **Il letto di casa** (cartello `sleep` in `casa.ts`, `sleep()` in `ui/story-screen.ts`): quando è buio si dorme fino a domattina e l'ora diventa Giorno; di giorno si fa un pisolino fino a stasera e diventa Notte. Lo schermo sfuma nel colore della notte.
- **Come si disegna** (`drawNight` in `render/world-view.ts`): un foglio di notte (`--m-night`) a un terzo della risoluzione, con buchi sfumati dove c'è luce e una tinta calda (`--m-lamp`) nelle pozze; poi la lampadina di ogni lampione. Al tramonto c'è una velatura arancio (`--m-dusk`). Fanno luce:
  - i lampioni;
  - le porte dei posti (più larga dove c'è vita: Morgana, il bar, Lavezzi, la stazione, l'Eclipse) e di un terzo delle case;
  - torri, chiese, la Tomba di Cicerone e il monumento, illuminati;
  - le finestre: il vetro azzurro delle sprite (`#bfe3ff`, `#e8f5ff`) diventa caldo (`glowOf`), in tutti i posti e in sette case su dieci;
  - il faro, con due fasci che girano sulla baia;
  - un alone intorno ad Antonio, che non si perde mai nel buio.
- **Dentro** (casa, circolo, Morgana) le luci sono sempre accese: niente buio. Di notte i gabbiani dormono.
- **Nei test** l'orologio finto di Playwright segna le 11 di mattina: si gioca di giorno. Per guardare la notte basta mettere `lotte-tra-amici:ora:v1` a `notte`.
