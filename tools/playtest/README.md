# Il giocatore automatico (R5)

Gioca una storia nuova da solo, seguendo la freccia della prossima tappa, e scrive tappa per tappa com'è andata.

```sh
npm run build                                   # gioca il file di dist/
node tools/playtest/bot.mjs antonio polpino prudente   # una partita, in console e in test-results/playtest/
npm run playtest                                # le 18 partite (6 protagonisti × 3 iniziali), solo freccia
node tools/playtest/report.mjs antonio,zendavid gabbi prudente   # una scelta
```

- **freccia:** solo la freccia; cattura solo quando una tappa chiede una creatura in più (R10).
- **prudente:** cattura finché la squadra ha meno creature di quante la tappa ne vuole (fino a quattro), e dopo due
  sconfitte di fila contro lo stesso avversario va ad allenarsi negli scogli di Gianola finché le tre creature migliori
  non sono salite di tre livelli in tutto.
- Salta i minigiochi (lo scrive), sceglie la mossa con l'IA del gioco (`UI._debug.suggest`), nei luoghi con enigma
  cammina la strada del validatore e dopo una lotta riprende da dove era.
- Si ferma al treno (`no goal`: la stazione della seconda città non ha una prossima tappa), o al **muro**: lo stesso
  avversario che lo batte quattro volte.
- Il rapporto è `test-results/playtest/report.md`: per ogni partita dove finisce, lotte, catture, cambi, retini,
  allenamenti, e per ogni tappa le tre creature migliori, quante sono, i sesterzi e le lotte fin lì.
- `PW_CHROME=/percorso/di/chrome` per un Chrome che non sia quello di Playwright; `PLAYTEST_JOBS` per quante partite
  insieme (2 di base); `GAME_URL` per un altro indirizzo.
- I ganci che usa: `WORLD._debug.goal`, `stops`, `lv`, `skipStop`, `hiding`, `way`, `route`, `pos` e `UI._debug.pick`,
  `info`, `suggest`.
