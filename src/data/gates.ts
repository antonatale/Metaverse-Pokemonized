import type { FriendId } from './characters';

/* City gates: what you need to leave a city (all the pins of that city: story/maps.ts cityCovi, without one's own).
   After Formia each one goes where his life goes (Antonio's choice): Torino for Antonio, Zendavid, Forchetta and
   Valentin, Milano for Costanzo and Andrea. The capotreno of Formia is the gate of whichever it is. */
export interface Gate { city: string; label: string; to: string; station: string }

export const GATES: Record<string, Gate> = {
  torino: { city: 'formia', label: 'Il treno per Torino', to: 'torino', station: 'Torino Porta Nuova' },
  milano: { city: 'formia', label: 'Il treno per Milano', to: 'milano', station: 'Milano Centrale' },
  /* and back home: nothing to win in a city still in the clouds */
  'torino-formia': { city: 'torino', label: 'Il treno per Formia', to: 'formia', station: 'Formia' },
  'milano-formia': { city: 'milano', label: 'Il treno per Formia', to: 'formia', station: 'Formia' }
};
/** the second city of each one */
export const SECOND_CITY: Record<FriendId, 'torino' | 'milano'> = {
  antonio: 'torino', zendavid: 'torino', forchetta: 'torino', valentin: 'torino', costanzo: 'milano', andrea: 'milano'
};
/** the gate of a person who stands at one: a train gate is the train of whoever is played */
export function gateFor(g: string, who: FriendId): Gate { return GATES[g] && GATES[g].city === 'formia' ? GATES[SECOND_CITY[who]] : GATES[g]; }
