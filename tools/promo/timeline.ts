/* The trailer's clock, shared by the music (music.ts) and the pictures (trailer.ts): 150 bpm, so a beat is 0.4 s,
   twelve frames at 30 fps, and every cut can land on a beat. Positions are in bars and beats from the start. */
export const BPM = 150;
export const FPS = 30;
export const BEAT = 60 / BPM;
export const BAR = BEAT * 4;
/** seconds at bar b, beat k (fractions allowed) */
export const at = (b: number, k = 0) => (b * 4 + k) * BEAT;
/** the frame at bar b, beat k */
export const fr = (b: number, k = 0) => Math.round(at(b, k) * FPS);

/** the parts of the trailer, in bars [from, to) */
export const PARTS = {
  intro: [0, 4],     /* code, notes, the town: "it all began with some code…" */
  logo: [4, 6],      /* the title, on the first hit */
  friends: [6, 9],   /* the six friends */
  world: [9, 14],    /* Formia from above, day and night */
  build: [14, 18],   /* the tall grass… something moves */
  drop1: [18, 26],   /* creatures: battle, catch, grow, evolve */
  plot: [26, 30],    /* Mamurra, the stones, Cicero */
  code: [30, 32],    /* made by hand */
  drop2: [32, 38],   /* the exam, the friends, the montage */
  outro: [38, 41]    /* the end card */
} as const;
export const BARS = 41;
/** the whole film, with the last chord's tail */
export const LENGTH = at(BARS) + 1.6;
export const FRAMES = Math.round(LENGTH * FPS);

/** the game's own sounds, where the pictures need them: [bar, beat, sfx name, gain] */
export const CUES: [number, number, string, number][] = [
  /* the tall grass, the rock pools, the pineta… and the shadows */
  [14, 0, 'rustle', 0.5], [14, 2, 'rustle', 0.4], [15, 0, 'rustle', 0.55], [15, 2, 'rustle', 0.6], [16, 0, 'rustle', 0.6], [16, 2, 'reveal', 0.45],
  [17, 0, 'meet', 0.9],
  /* creatures: the rune and its hit, the three cubs, the net, twenty shadows, the hearts, a light, the find, a shadow under the walls */
  [18, 0.33, 'magic', 0.7], [18, 1.85, 'reveal', 0.35], [18, 3.5, 'hit', 0.8], [19, 0.25, 'magicUp', 0.6], [20, 2.2, 'caught', 0.7], [21, 0.25, 'shimmer', 0.45],
  [22, 0.5, 'heal', 0.5], [23, 1, 'reveal', 0.6], [23, 2.5, 'shimmer', 0.6], [24, 0.8, 'found', 0.7], [25, 0, 'reveal', 0.4],
  /* the mystery: someone digging at night, a secret, the ghost who guides, the tour */
  [26, 0.5, 'rustle', 0.45], [26, 2.5, 'rustle', 0.4], [27, 0, 'shimmer', 0.35], [28, 0, 'magic', 0.4], [29, 0.5, 'pickup', 0.5],
  /* and more: a skill, the ball, a gelato, the run, the shop, a covo, the badges, the exam, the button */
  [32, 2, 'pickup', 0.6], [33, 0.5, 'ball', 0.6], [33, 1.25, 'ball', 0.6], [34, 0.5, 'pickup', 0.5], [34, 2, 'whoosh', 0.5],
  [35, 0.33, 'pickup', 0.6], [35, 3, 'pickup', 0.6], [36, 0, 'banner', 0.5], [36, 2.2, 'badge', 0.5], [37, 1.33, 'crit', 0.7],
  [39, 3, 'click', 0.8]
];
