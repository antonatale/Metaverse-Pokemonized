/* The nets for the creatures of Formia: an ordinary one, better and better ones, and two made for a place and a time.
   They go in the bag of story battles (battle/state.ts makes them moves, battle/moves.ts throws them) and are sold
   around Formia (WARES in data/growth.ts). Only against a wild creature. */
export type NetId = 'retino' | 'retino2' | 'argento' | 'oro' | 'nassa' | 'lampara';
export interface Net {
  id: NetId;
  name: string;
  /** "nel retino", "nella nassa": where the creature ends up */
  into: string;
  /** "un retino", "la nassa": what Antonio throws */
  a: string;
  /** how much better than a plain net it catches */
  mult: number;
  /** better again against the creatures of the sea (polpi, ricci, granchi) */
  sea?: number;
  /** better again when it is dark */
  night?: number;
  text: string;
}
export const NETS: Record<NetId, Net> = {
  retino: { id: 'retino', name: 'Retino', into: 'nel retino', a: 'un retino', mult: 1, text: 'Il retino di sempre: più la creatura è stanca, più è facile prenderla.' },
  retino2: { id: 'retino2', name: 'Retino da pesca', into: 'nel retino', a: 'un retino da pesca', mult: 1.6, text: 'Il retino dei pescatori di Mola: cattura molto più facilmente.' },
  argento: { id: 'argento', name: 'Retino d\'argento', into: 'nel retino d\'argento', a: 'un retino d\'argento', mult: 2.2, text: 'Maglie fitte e cerchio d\'argento: più del doppio di un retino.' },
  oro: { id: 'oro', name: 'Retino d\'oro', into: 'nel retino d\'oro', a: 'il retino d\'oro', mult: 3.2, text: 'Il più prezioso di tutti: quasi nessuna creatura gli sfugge.' },
  nassa: { id: 'nassa', name: 'Nassa', into: 'nella nassa', a: 'una nassa', mult: 1, sea: 3, text: 'La trappola dei pescatori: con le creature di mare (polpi, ricci, granchi) vale tre retini.' },
  lampara: { id: 'lampara', name: 'Rete della lampara', into: 'nella rete', a: 'la rete della lampara', mult: 1, night: 3, text: 'La rete della pesca di notte, con la lampada che attira i pesci: quando è buio vale tre retini.' }
};
/** in the order of the bag: from the plainest to the finest, then the special ones */
export const NET_IDS: NetId[] = ['retino', 'retino2', 'argento', 'oro', 'nassa', 'lampara'];
export function isNet(id: string): id is NetId { return Object.prototype.hasOwnProperty.call(NETS, id); }
/** the creatures of the sea, by the shape of their body */
export const SEA_BODIES = ['octo', 'urchin', 'crab'];
