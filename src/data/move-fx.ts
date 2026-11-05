/* How each creature move is shown: its scene. The type decides what it is made of and its colour (water, flames,
   feathers, the moon, the lightning…); the scene decides what happens: a cut, a rain from above, a ring that closes in, a
   ray, a lob, or a scene of its own (a wall of water across the arena, a bite, two claws, tentacles out of the ground…).
   Two attacks of the same type look different because their scenes are (tests/unit/move-fx.test.ts checks it for the
   types already done). A move not listed here flies as its type does. ui/move-stages.ts draws the scenes; only
   drawing: nothing in the battle depends on it. */
/** how the one hit takes a blow: thrown back, lifted and dropped, squashed from above, spun round, shaking, sunk */
export type Take = 'recoil' | 'lift' | 'squash' | 'spin' | 'shake' | 'sink';
export type Stage =
  /* the gestures every type can make */
  | 'slash' | 'rain' | 'orbit' | 'beam' | 'lob'
  /* scenes of their own */
  | 'tide' | 'jaws' | 'clamp' | 'grasp' | 'pod' | 'volley' | 'sting' | 'jet' | 'ram' | 'dive' | 'fall';
export interface Scene {
  stage: Stage;
  /** 'none': no dark and no magic circle before it, only the name (a quick blow); otherwise as its stage says */
  charge?: 'none' | 'full';
  /** how the one hit takes it, if not as the stage says */
  foe?: Take;
  /** how many of something (bites, dolphins, quills, tentacles), if not as the stage says */
  n?: number;
}
const s = (stage: Stage, more?: Omit<Scene, 'stage'>): Scene => Object.assign({ stage: stage }, more);

export const MOVE_FX: Record<string, Scene> = {
  /* Corrente, the first type with a scene for each attack */
  mareggiata: s('tide'), morsomurena: s('jaws'), morsa: s('clamp'), tentacolata: s('grasp'), fischio: s('pod'), aculei: s('volley'), urtica: s('sting'),
  /* scenes of their own in other types, the model for the rest */
  spruzzo: s('jet'), carica: s('ram'), picchiata: s('dive'), frana: s('fall'),
  /* teeth, claws, quills: a cut */
  coda: s('slash'), morso: s('slash'), chela: s('slash'), pinza: s('slash'), pennino: s('slash'), furia: s('slash'),
  /* things that fall from above */
  concerto: s('rain'), spinata: s('rain'), tempesta: s('rain'),
  /* wind and arms that circle before they strike */
  abbraccio: s('orbit'), raffica: s('orbit'), burrasca: s('orbit'),
  /* a ray: the wind, the heat, the oration */
  libeccio: s('beam'), canicola: s('beam'), catilinaria: s('beam'),
  /* thrown things */
  nocciolo: s('lob'), marmo: s('lob'), masso: s('lob'),
  /* the creatures found later */
  zanne: s('slash'), banco: s('slash'), graffio: s('slash'),
  mappaceleste: s('rain'), lucciole: s('rain'), maregiallo: s('rain'), fuocoelmo: s('rain'),
  aurora: s('orbit'), risacca: s('orbit'), ira: s('orbit'), duevolti: s('orbit'),
  fascio: s('beam'), malocchio: s('beam'), pellegrina: s('beam'), alberomaestro: s('beam'),
  torre: s('lob'), stellata: s('lob'), polline: s('lob'),
  /* the legends' other moves (their own have a show of their own, EPIC in ui/spells.ts) */
  primaluce: s('beam'), vele: s('orbit'), passogigante: s('rain')
};
