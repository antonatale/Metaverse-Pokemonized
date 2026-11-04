/* The trailer's clock, shared by the music (music.ts) and the pictures (trailer.ts): 120 bpm, so a beat is half a
   second, fifteen frames at 30 fps, a bar two seconds, and every cut lands on a beat. Positions are in bars and beats
   from the start. Captions stay on screen a bar at least, so there is time to read them. */
export const BPM = 120;
export const FPS = 30;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
/** seconds at bar b, beat k (fractions allowed) */
export const at = (b: number, k = 0) => (b * 4 + k) * BEAT;
/** the frame at bar b, beat k */
export const fr = (b: number, k = 0) => Math.round(at(b, k) * FPS);

/** the parts of the trailer, in bars [from, to) */
export const PARTS = {
  intro: [0, 5],       /* Formia at night, in 3D, from the sea: a town that hides a secret */
  logo: [5, 7],        /* the title over the gulf at dusk */
  friends: [7, 13],    /* the six friends, and the rival */
  world: [13, 21],     /* Formia: in 3D by day, then the game's streets, day and night */
  build: [21, 24],     /* the tall grass… something moves */
  creatures: [24, 34], /* battles, magic seen from the creature's eyes, catching, growing, the powers */
  plot: [34, 38],      /* the mystery */
  dream: [38, 40],     /* created by imagination */
  finale: [40, 46],    /* everything else there is to do: trainers, covi, the rival */
  outro: [46, 50]      /* the end card over Formia by night */
} as const;
export const BARS = 50;
/** the whole film, with the last chord's tail */
export const LENGTH = at(BARS) + 2.5;
export const FRAMES = Math.round(LENGTH * FPS);

/** the game's own sounds, where the pictures need them: [bar, beat, sfx name, gain] */
export const CUES: [number, number, string, number][] = [
  /* the rival's "!" */
  [12, 0.27, 'spot', 0.6],
  /* Formia: the scooter */
  [17, 0.4, 'scooter', 0.5],
  /* the tall grass, the rock pools, the pineta… and the encounter */
  [21, 0, 'rustle', 0.5], [21, 2, 'rustle', 0.45], [21, 3, 'rustle', 0.5], [22, 2, 'rustle', 0.55], [23, 0, 'rustle', 0.6], [23, 2, 'meet', 0.9],
  /* creatures: the spell in the game (the banner at the cut, the moon leaves 19 frames in and lands on the third
     beat); then the spells seen from the creature: its cry, the charge, the launch, the hit on the and of three */
  [24, 0.28, 'magic', 0.6], [24, 1.27, 'reveal', 0.3], [24, 2, 'hit', 0.7],
  [25, 0, 'cry-octo', 0.5], [25, 0.25, 'magicUp', 0.55], [25, 1.5, 'magic', 0.75], [25, 2.5, 'hit', 0.9],
  [26, 0, 'cry-bird', 0.5], [26, 0.25, 'magicUp', 0.55], [26, 1.5, 'magic', 0.8], [26, 2.5, 'crit', 1.0], [26, 2.6, 'superEff', 0.6],
  /* the cubs, the net, the shadows, the hearts, a swim, the light, a flight */
  [27, 0.3, 'magicUp', 0.5], [28, 0.1, 'net', 0.5], [28, 3.2, 'caught', 0.7], [29, 0.3, 'shimmer', 0.45], [30, 0.5, 'heal', 0.5], [30, 2.1, 'whoosh', 0.35],
  [31, 0.8, 'reveal', 0.6], [31, 2.4, 'shimmer', 0.6], [32, 0.2, 'whoosh', 0.5],
  /* the mystery: someone digging at night, a secret, the ghost who guides, the tour */
  [34, 0.5, 'rustle', 0.45], [34, 2.5, 'rustle', 0.4], [35, 0, 'shimmer', 0.35], [36, 0, 'magic', 0.4], [37, 0.5, 'pickup', 0.5],
  /* and more: a skill, the ball, a right answer, the cup, a trainer's "!", home, a covo, the badges, the red bands of
     the rival's battle, the button */
  [40, 2, 'pickup', 0.6], [41, 0.5, 'ball', 0.6], [41, 2.6, 'found', 0.5], [42, 0.4, 'banner', 0.45], [42, 2.33, 'spot', 0.6],
  [43, 0.5, 'cry-lizard', 0.4], [43, 2.3, 'banner', 0.5], [44, 0.4, 'badge', 0.5], [44, 2.15, 'whoosh', 0.5],
  [48, 3, 'click', 0.8]
];
