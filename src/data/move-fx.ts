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
  | 'tide' | 'jaws' | 'clamp' | 'grasp' | 'pod' | 'volley' | 'sting' | 'jet' | 'ram' | 'dive' | 'fall'
  | 'bolt' | 'shade' | 'omen' | 'cone' | 'haze' | 'swarm' | 'rise' | 'twister' | 'snatch' | 'quake' | 'sign' | 'song' | 'speech'
  | 'scratch' | 'curtain' | 'topple' | 'ambush' | 'memory' | 'peck' | 'sparkle' | 'hop';
/** what a scene throws about, if not the type's own shapes: runes, thorns, moons, fish, feathers, rocks… (ui/move-props.ts) */
export type Prop = 'rune' | 'thorn' | 'moon' | 'slab' | 'rock' | 'fish' | 'feather' | 'star' | 'eye' | 'pit' | 'flower' | 'firefly' | 'flame'
  | 'note' | 'wish' | 'pollen' | 'sun' | 'panino' | 'stoneheart' | 'mast' | 'foot' | 'spark' | 'heart';
export interface Scene {
  stage: Stage;
  /** what it is made of, if not the type's shapes */
  prop?: Prop;
  /** its colour, if not the type's (the yellow of the broom, the blue of St Elmo's fire) */
  col?: string;
  /** the words it throws, for a scene made of words */
  words?: string[];
  /** the other way round: the wave comes back from behind the one hit */
  rev?: boolean;
  /** 'none': no dark and no magic circle before it, only the name (a quick blow); otherwise as its stage says */
  charge?: 'none' | 'full';
  /** how the one hit takes it, if not as the stage says */
  foe?: Take;
  /** how many of something (bites, dolphins, quills, tentacles), if not as the stage says */
  n?: number;
}
const s = (stage: Stage, more?: Omit<Scene, 'stage'>): Scene => Object.assign({ stage: stage }, more);

export const MOVE_FX: Record<string, Scene> = {
  /* Corrente: the sea */
  mareggiata: s('tide'), morsomurena: s('jaws'), morsa: s('clamp'), tentacolata: s('grasp'), fischio: s('pod'), aculei: s('volley'), urtica: s('sting'),
  /* Calma: the moon and the old stones */
  coda: s('slash', { prop: 'rune' }), morso: s('jaws'), spinata: s('rain', { prop: 'thorn' }), marmo: s('lob', { prop: 'slab' }), tempesta: s('bolt', { prop: 'moon' }),
  ombra: s('shade'), profezia: s('omen', { prop: 'rune' }), risacca: s('tide', { rev: true }), fascio: s('cone'), lunargento: s('orbit', { prop: 'moon', col: '#dfe8f5' }),
  /* Calore: the heat, the summer nights, St Elmo's blue fire */
  canicola: s('haze'), lucciole: s('swarm', { prop: 'firefly', n: 9, col: '#ffd26a' }), fuocoelmo: s('rise', { prop: 'flame', col: '#6fc8ff' }), primaluce: s('cone', { prop: 'sun' }),
  tempestelmo: s('bolt', { prop: 'flame', col: '#6fc8ff' }),
  /* Caos: the Laestrygonians, the gulls and the thieves */
  carica: s('ram'), chela: s('slash'), pinza: s('clamp'), presa: s('grasp'), burrasca: s('twister'), ira: s('tide'), pellegrina: s('dive'),
  alberomaestro: s('bolt', { prop: 'mast' }), banco: s('volley', { prop: 'fish', n: 6 }), furto: s('snatch', { prop: 'panino' }), furia: s('quake'), beccata: s('peck'),
  /* Cervello: ink, stars and the evil eye */
  spruzzo: s('jet'), abbraccio: s('grasp'), malocchio: s('omen', { prop: 'eye', n: 5 }), notturno: s('dive'), pennino: s('sign'), stellata: s('beam', { prop: 'star' }), botta: s('sparkle'),
  /* Chiacchiera: the cicadas of August, Cicero, the claws */
  concerto: s('song', { prop: 'note' }), catilinaria: s('speech', { words: ['QUO', 'USQUE', 'TANDEM', '?'] }), graffio: s('scratch'),
  /* Cielo: the wind and the feathers */
  picchiata: s('dive'), planata: s('ram'), aurora: s('curtain'), libeccio: s('tide', { prop: 'feather' }), raffica: s('volley', { prop: 'feather', n: 9 }),
  polline: s('lob', { prop: 'pollen', col: '#ffe36a' }), vele: s('twister', { prop: 'feather' }),
  /* Corazza: the giants' stones */
  frana: s('fall', { prop: 'rock' }), masso: s('lob', { prop: 'rock' }), naufragio: s('rain', { prop: 'rock' }), zanne: s('jaws'), torre: s('topple'), passogigante: s('quake', { prop: 'foot' }),
  /* Crepuscolo: the dusk, its lights and its shadows */
  agguato: s('ambush'), lucina: s('swarm', { prop: 'wish', n: 3 }), ala: s('slash', { prop: 'feather' }), duevolti: s('orbit', { prop: 'eye' }), portatempo: s('fall'),
  /* Cuore: the walls, the wishes, the broom of the mountains, the Formia of once */
  cuorepietra: s('fall', { prop: 'stoneheart' }), desiderio: s('orbit', { prop: 'wish' }), mappaceleste: s('sign', { n: 7 }), maregiallo: s('tide', { prop: 'flower', col: '#ffd84d' }),
  nocciolo: s('lob', { prop: 'pit' }), nostalgia: s('memory'),
  /* the spells on the foe that do no damage (they lower a number, confuse, put to sleep): a scene each too */
  scia: s('jet', { prop: 'wish', col: '#dfe8f5' }), arsura: s('song', { prop: 'sun' }), scintille: s('orbit', { prop: 'flame', col: '#6fc8ff' }),
  strillo: s('song', { prop: 'feather' }), grufolata: s('rain', { prop: 'rock', col: '#c9a074' }), occhiata: s('orbit', { prop: 'eye' }), ninna: s('song', { prop: 'note' }),
  frinire: s('orbit', { prop: 'note' }), miagolio: s('omen', { prop: 'heart', n: 5, col: '#ff8fc1' }), ruggito: s('song'), ultrasuoni: s('song', { prop: 'wish' }),
  passato: s('memory'), eco: s('song', { prop: 'note' }), saltello: s('hop')
};

/* The moves a creature casts on itself (it raises a number, it heals): each has a scene of its own (ui/self-scenes.ts)
   instead of the pillar of light they all shared. A move not listed here keeps the pillar. */
export type SelfStage = 'shell' | 'walls' | 'scales' | 'sunbath' | 'bloom' | 'calm' | 'veil' | 'idea' | 'tome' | 'regrow' | 'burrow' | 'hourglass' | 'door' | 'gates' | 'roots' | 'oil';
export const SELF_FX: Record<string, SelfStage> = {
  /* Calma */ scaglie: 'scales', sole: 'sunbath', muraglia: 'walls',
  /* Calore */ profumo: 'bloom', bonaccia: 'calm',
  /* Cervello */ mimetismo: 'veil', genio: 'idea', saggezza: 'tome', rigenera: 'regrow',
  /* Corrente */ guscio: 'shell', tana: 'burrow',
  /* Crepuscolo */ futuro: 'hourglass', soglia: 'door',
  /* Corazza */ telepilo: 'gates',
  /* Cuore */ radici: 'roots', olio: 'oil'
};
