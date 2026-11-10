import type { MapDef } from './types';

/* The second cities, for now only their stations (Antonio's choice): Torino Porta Nuova and Milano Centrale. One
   arrives by train from Formia (the trip across Italy: ui/train.ts); beyond the hall the city is still in the clouds
   (Z), until the next update of the game. The capotreno takes you back to Formia. */
function station(name: string, city: string, board: string[], cloud: string[]): MapDef {
  return {
    name, city, inside: true,
    rows: [
      'xxxxxxxxxxxxxxxx',
      'xZZZZZZZZZZZZZZx',
      'xZZZZZZZZZZZZZZx',
      'xFFFFFFFFFFFFFFx',
      'xFFBFFFFFFFFBFFx',
      'xFFFFFFFFFFFFFFx',
      'xFFFFFFFFFFFFFFx',
      'x______________x',
      'xrrrrrrrrrrrrrrx',
      'x______________x',
      'xrrrrrrrrrrrrrrx',
      'xxxxxxxxxxxxxxxx'
    ],
    signs: [
      { x: 7, y: 3, text: cloud },
      { x: 2, y: 6, text: board },
      /* the welcome, to whoever is being played (heroText fills {hero}) */
      { x: 13, y: 3, text: ['Benvenuto a ' + name + ', {hero}!', 'Cinque spille di Formia e tutta l\'Italia in treno: ce l\'hai fatta.'] }
    ],
    npcs: [{ id: 'capotreno-' + city, name: 'Capotreno', seed: 21, x: 12, y: 6, dir: 'left', gate: city + '-formia' }],
    start: [8, 7, 'up']
  };
}
export const torino = station('Torino Porta Nuova', 'torino',
  ['Il tabellone delle partenze: Formia, Roma, Napoli.', 'Il treno per Formia è sempre sul binario.'],
  ['Oltre l\'atrio, Torino è ancora nelle nuvole.', 'Il resto della città arriva con il prossimo aggiornamento del gioco.']);
export const milano = station('Milano Centrale', 'milano',
  ['Il tabellone delle partenze: Formia, Roma, Napoli.', 'Il treno per Formia è sempre sul binario.'],
  ['Oltre l\'atrio, Milano è ancora nelle nuvole.', 'Il resto della città arriva con il prossimo aggiornamento del gioco.']);
