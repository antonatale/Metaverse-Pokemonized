/* The parameters a portrait is drawn from. No photos anywhere: skin, lips, eyes, brows, hair, clothes,
   glasses and earrings are numbers and colours, and the code below turns them into SVG. */

export type ExprName = 'smirk' | 'grin' | 'pout' | 'worried' | 'sleepy' | 'cool';
export type MouthName = 'smirk' | 'grin' | 'pout' | 'worried' | 'sleepy' | 'cool' | 'neutral' | 'soft' | 'talk' | 'smug';
export type FaceShape = 'square' | 'oval' | 'round' | 'strong';

export interface Skin { base: string; light: string; shade: string; deep: string; line: string; blush?: string }
export interface Lips { base: string; dark: string; light: string; inside: string }
export interface Iris { base: string; dark: string; light: string }
export interface Brow { color: string; hi: string; w: number; lift?: number }

/** how far each part of a brow moves up */
export interface BrowPose { inner?: number; mid?: number; outer?: number }
export interface EyePose {
  open?: number;
  look?: [number, number];
  lowerRaise?: number;
  closed?: 'happy' | 'calm';
  lid?: boolean;
  lidAt?: number;
}
export interface Expression { bl: BrowPose; br: BrowPose; e: EyePose; m: MouthName; cheeks?: boolean; glasses?: 'shades' }

interface HairBase {
  /** shadow the fringe casts on the forehead */
  fshadow?: string;
  /** ringlets over the fringe: x, y, r, turns, dir, rot, pitch */
  rings?: number[][];
}
/** curl clusters (Antonio, Costanzo, Valentin's mane, Forchetta) */
export interface CurlsHair extends HairBase {
  style: 'curls';
  seed: number;
  cx: number; cy: number; rx: number; ry: number;
  /** superellipse exponent of the outline, 2 when missing */
  p?: number;
  out: string;
  fills: string[];
  hi: string;
  hiStyle?: 'wave';
  /** curls stretched along the flow, away from (130, flowY) */
  elong?: number;
  flowY?: number;
  /** the hairline over the forehead, right to left */
  front: [number, number][];
  frontDefault?: number;
  rEdge: [number, number];
  rIn: [number, number];
  rFront: [number, number];
  count: number;
  minD?: number;
  /** keep the face clear */
  avoid?: { cx: number; cy: number; rx: number; ry: number };
  sides?: [number, number, number][];
  frizz?: number;
  frizzColor?: string;
  glow0?: number;
  glow1?: number;
  a0?: number;
  aSpan?: number;
  edgeN?: number;
  mane?: boolean;
}
/** wavy medium-length locks (no friend wears it at the moment) */
export interface WavyHair extends HairBase { style: 'wavy'; seed: number; out: string; fills: string[]; hi: string }
/** long hair parted in the middle, in soft waves down onto the shoulders (Claudia) */
export interface LongHair extends HairBase {
  style: 'long'; seed: number; out: string; fills: string[]; hi: string;
  /** cut at the shoulders, the ends turned a little out (Claudia) */
  bob?: boolean;
  /** a full fringe straight across the forehead, down to the brows, in place of the parting (Claudia) */
  bangs?: boolean;
}
/** short faded sides, top brushed up and to the side (Andrea) */
export interface QuiffHair extends HairBase { style: 'quiff'; seed: number; out: string; body: string[]; hi: string }
/** buzz cut (Zendavid) */
export interface BuzzHair extends HairBase { style: 'buzz'; base: string }
export type Hair = CurlsHair | WavyHair | LongHair | QuiffHair | BuzzHair;

export interface Outfit {
  style: 'hoodie' | 'turtleneck' | 'tee' | 'jacket' | 'stripes' | 'knit' | 'strapless';
  base: string; dark: string; light: string; line: string;
  deep?: string;
  broad?: boolean;
  /** the tee under a jacket or a jumper */
  tee?: string;
  fold?: string;
  collar?: string;
  stripes?: string[];
  strap?: string;
  /** what is worn on the chest, over the clothes: a tie, a sash, a medal (render/svg/forms.ts) */
  over?: string;
}
export interface Glasses {
  style: 'round' | 'shadesGreen' | 'politico';
  /** always on, or only with these expressions */
  when: 'always' | ExprName[];
  /** knocked askew when KO */
  koTilt?: boolean;
}
export interface Earring { x: number; y: number; r: number; metal: 'gold' | 'silver'; stud?: boolean; bar?: boolean }

export interface Look {
  /** prefix of every id in the shared <defs> */
  P: string;
  name: string;
  face: FaceShape;
  /** viewBox of the head-and-shoulders thumbnail: a square from over the hair (and what a form wears on it) down to the
      collar, so that no small portrait cuts the head or the chin */
  thumb: string;
  skin: Skin;
  lips: Lips;
  iris: Iris;
  brow: Brow;
  hair: Hair;
  outfit: Outfit;
  /** KO: the hood comes up (Antonio), or just closed eyes */
  ko: 'hood' | 'eyes';
  /** this character's take on the base expressions */
  ex?: Partial<Record<ExprName, Partial<Expression>>>;
  glasses?: Glasses;
  earring?: Earring;
  chain?: boolean;
  beard?: { color: string };
  props?: { phones?: boolean };
  /** what is worn on the head, over the hair: the part of a form that shows even in a small picture (render/svg/forms.ts) */
  head?: string;
  earDx?: number;
  nose?: 'strong';
  underEye?: number;
  /** a line of liner and lashes on the upper lids */
  lashes?: boolean;
  /** a little ring in the septum (Claudia) */
  septum?: boolean;
  /** big hoops at both ears, hanging in front of the hair */
  hoops?: { r: number; metal: 'gold' | 'silver' };
  /** a chunky pendant on cords, on the collarbones */
  pendant?: boolean;
}
