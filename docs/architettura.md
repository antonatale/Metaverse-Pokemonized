# Dove sta il codice

Leggere i file della parte interessata; i numeri e gli elenchi completi restano nel codice, senza copie in questa guida.

| Parte | File principali |
|---|---|
| Avvio e API per i playtest | `src/main.ts`, `window.WORLD`, `window.UI`, gancio `window.claude.hot` |
| Amici: dati e progressione | `src/data/characters.ts`, `people.ts`, `growth.ts`; applicazione in `src/story/growth.ts` |
| Creature, mosse, evoluzioni | `src/data/creatures.ts`; accesso comune ai combattenti in `fighters.ts` |
| Tipi e taratura | `src/data/types.ts`, `tuning.ts` |
| Stati, abilità, oggetti tenuti | Dati `src/data/passives.ts`; esecuzione `src/battle/passives.ts` |
| Motore deterministico | `src/battle/index.ts`, `types.ts`, `state.ts`, `rng.ts`, `turn.ts`, `moves.ts`, `damage.ts`, `ai.ts`, `labels.ts`, `stages.ts` |
| Trama, scelte e missioni | `src/story/plot.ts`, `choices.ts`, `missions.ts`, `mentor.ts`, `rival.ts`, `goals.ts`, `epilogue.ts`; dati omonimi in `src/data/` |
| Covi e squadre dei capi | `src/data/covi.ts`, `src/story/covo-crew.ts`; torneo in `src/data/tourney.ts` |
| Mappe e movimento | `src/data/maps/`, `src/story/maps.ts`, `movement.ts`; enigmi in `place.ts`, `place-run.ts` |
| Mappa generata di Formia | `tools/formia/`; risultato `src/data/maps/formia-ground.ts` |
| Incontri, catture, attività | `src/data/encounters.ts`, `nets.ts`; `src/story/activities.ts`, `run.ts`, `growth.ts` |
| Salvataggi e trasferimento | `src/save/story-progress.ts`, `transfer.ts` |
| Mappa a schermo | `src/render/world-view.ts`, `atmosphere.ts`, `src/render/canvas/` |
| Ritratti e forme | `src/render/svg/looks.ts`, `forms.ts`, `hair.ts`, `outfit.ts`, `face.ts`, `extras.ts`, `index.ts` |
| Omini sulla mappa | `src/render/canvas/walkers.ts`: `PEOPLE`, `PEOPLE_FORMS`, `LOOKS`, `townsperson` |
| Creature, rune e sfondi | `src/render/svg/creatures.ts`, `type-shapes.ts`, `scenes.ts` |
| Titolo e storia a schermo | `src/ui/home.ts`, `story-screen.ts`, `plot.ts`, `team.ts`, `train.ts`, `activities.ts` |
| Lotta a schermo | `src/ui/battle-screen.ts`, `move-card.ts`, `person-scenes.ts`, `move-scenes.ts`, `self-scenes.ts`, `move-props.ts`, `safe-show.ts` |
| Grafica, velocità, audio UI | `src/ui/gfx.ts`, `speed.ts`, `sound.ts`; stili in `src/styles/`, colori in `tokens.css` |
| Audio sintetizzato | `src/audio/context.ts`, `synth.ts`, `music.ts`, `tracks.ts`, `zones.ts`, `sfx.ts`, `cues.ts`, `cries.ts` |

## Confini da mantenere

`data/` descrive; `battle/` calcola; `story/` applica le regole della partita; `render/` disegna; `ui/` presenta e raccoglie scelte. Il motore consegna eventi, etichette e bollini: la schermata non ricalcola i danni. L'RNG della lotta non viene consumato da suoni o animazioni.

Il motore conserva anche Esame e modalità storiche usate dai golden. La loro presenza non significa che siano percorsi attuali del titolo. Non rimuoverli durante una pulizia documentale.

`design/` non è importato dall'applicazione. Contiene materiali di lavoro da integrare in futuro, non moduli attivi o file da caricare all'avvio.
