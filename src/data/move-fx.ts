/* How each creature move travels, apart from what it is made of. The type decides the shapes and the colour (the moon,
   the lightning, the stars, the song, the heart); the gesture decides how they go: a cut across the foe, a rain from
   above, a ring that closes in, a ray, a lob. A move not listed here flies as its type does. A new move gets a line
   here (ui/spells.ts draws them). Only drawing: nothing in the battle depends on it. */
export type Gesture = 'slash' | 'rain' | 'orbit' | 'beam' | 'lob';

export const MOVE_FX: Record<string, Gesture> = {
  /* teeth, claws, quills, tentacles: a cut */
  tentacolata: 'slash', coda: 'slash', morso: 'slash', chela: 'slash', pinza: 'slash', pennino: 'slash', morsa: 'slash', furia: 'slash',
  /* things that fall from above */
  frana: 'rain', concerto: 'rain', spinata: 'rain', tempesta: 'rain',
  /* wind and arms that circle before they strike */
  abbraccio: 'orbit', raffica: 'orbit', burrasca: 'orbit',
  /* a ray: the sea, the wind, the heat, the oration */
  mareggiata: 'beam', libeccio: 'beam', canicola: 'beam', catilinaria: 'beam', picchiata: 'beam',
  /* thrown things */
  spruzzo: 'lob', nocciolo: 'lob', aculei: 'lob', marmo: 'lob', masso: 'lob'
};
