import type { FriendId } from '../../src/data/characters';
import { PEOPLE, posed } from '../../src/render/canvas/walkers';
import type { Motion } from './athlete';

export type Tactic = 'neutral' | 'baseline' | 'net' | 'counter';
export type Kit = { shirt: string; trim: string; shorts: string; hair: string; cap?: boolean; skin?: string;
  haircut?: 'bob' | 'curls' | 'quiff'; cut?: 'polo' | 'crew' | 'sleeveless'; motion?: Motion };

// Sporting outfits and tactics belong to the prototype. The IDs match the game roster.
export const roster = {
  forchetta: { name: 'Forchetta', description: 'Gioca profondo e costruisce da fondo', tactic: 'baseline', intro: 'Poteva andare peggio.',
    kit: { shirt: '#eee9db', trim: '#346775', shorts: '#28344b', hair: PEOPLE.forchetta.hair.color, skin: PEOPLE.forchetta.skin, haircut: 'curls', cap: true, cut: 'polo',
      motion: { stance: 1.14, coil: 1.15, finish: .96, step: .88 } } },
  andrea: { name: 'Andrea', description: 'Avanza e cerca la volée', tactic: 'net', intro: 'Ho calcolato tutto.',
    kit: { shirt: '#77cbd7', trim: '#226588', shorts: '#25354a', hair: PEOPLE.andrea.hair.color, skin: PEOPLE.andrea.skin, haircut: 'quiff', cut: 'crew',
      motion: { stance: .91, coil: .77, finish: .83, step: 1.16 } } },
  claudia: { name: 'Claudia', description: 'Contrattacca verso lo spazio libero', tactic: 'counter', intro: 'Ho sentito il tuo punto. Ora senti il mio.',
    kit: { shirt: '#c8b1eb', trim: '#6b5296', shorts: '#302a4b', hair: PEOPLE.claudia.hair.color, skin: PEOPLE.claudia.skin, haircut: 'bob', cut: 'sleeveless',
      motion: { stance: 1.03, coil: .98, finish: 1.21, step: 1.04 } } },
} satisfies Partial<Record<FriendId, { name: string; description: string; tactic: Tactic; intro: string; kit: Kit }>>;

export const trainingKits = { player: roster.claudia.kit, opponent: roster.forchetta.kit };

export type TennisCharacter = keyof typeof roster;

export function isTennisCharacter(id: string): id is TennisCharacter {
  return Object.prototype.hasOwnProperty.call(roster, id);
}

export function tennisPortrait(id: TennisCharacter): string {
  const figure = posed(PEOPLE[id], 2, 'down', 'stand');
  const portrait = document.createElement('canvas');
  const size = 56;
  portrait.width = portrait.height = size;
  portrait.getContext('2d')?.drawImage(figure, (figure.width - size) / 2, 0, size, size, 0, 0, size, size);
  return portrait.toDataURL();
}
