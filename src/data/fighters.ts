import { CHARS, type Character, type CharId, type FighterId } from './characters';
import { creatureChar, isSpecies } from './creatures';

/** anyone who can fight, by id: one of the friends, the Esame, or a creature of Formia */
export function fighter(id: FighterId | string): Character {
  return isSpecies(id) ? creatureChar(id) : CHARS[id as CharId];
}
