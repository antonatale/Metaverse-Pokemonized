import type { FriendId } from '../characters';

/* The shape of a map. To add a city: every row the same length, linked by a door with `to` or a warp;
   indoors maps have `inside: true` and the `city` they belong to. tests/unit/maps.test.ts checks all of it. */

export type Dir = 'up' | 'down' | 'left' | 'right';

/** one kind of tile, see legend.ts */
export interface Ground {
  g: string;
  solid?: boolean;
  deco?: string;
  obj?: string;
  reach?: boolean;
}
export interface Building {
  id: string;
  kind: string;
  x: number; y: number; w: number; h: number;
  /** the door tile, on the bottom row of the building */
  door: [number, number];
  label?: string;
  roof?: string;
  awning?: string;
  /** what the door says when bumped */
  msg?: string[];
  /** a city exit (see gates.ts) */
  gate?: string;
  /** a door you walk through: target map, tile and facing */
  to?: string; tx?: number; ty?: number; tdir?: Dir;
}
export interface MapObject {
  kind: string;
  x: number; y: number; w: number; h: number;
  /** tiles of the footprint you can walk through (an arch) */
  open?: [number, number][];
  /** rocks gently on the water */
  bob?: boolean;
  color?: string;
}
/** flat things drawn into the ground: court lines, banners, mountains, the track, names */
export interface GroundObject {
  kind: string;
  x: number; y: number; w?: number; h?: number;
  text?: string;
  size?: number;
  alpha?: number;
  align?: CanvasTextAlign;
  rot?: number;
  color?: string;
  /** a hill village inside a range of peaks, in tiles from its corner */
  village?: [number, number];
}
/** something to read or use on a tile; quiet ones are not drawn as a signpost (furniture, a parked scooter) */
export interface Sign { x: number; y: number; text: string[]; quiet?: boolean; ride?: boolean }
export interface Npc {
  id: string;
  x: number; y: number;
  dir: Dir;
  /** one of the friends, drawn as himself */
  person?: FriendId;
  /** the covo he leads */
  covo?: string;
  /** townsfolk: a name, a look picked by seed, and what they say */
  name?: string;
  seed?: number;
  lines?: string[];
  /** talks about a city exit */
  gate?: string;
  /** offers something to do together (see story/activities.ts) */
  activity?: string;
}
/** one of the things Antonio lost around town: found, it is never lost again in story battles */
export interface LostItem {
  id: string;
  /** the move it blocks, see items.ts */
  move: string;
  x: number; y: number;
  /** the pronoun for "non lo/li perde più" */
  pron: string;
  text: string;
}
/** a neighbourhood, for the place name in the corner */
export interface Area { name: string; x: number; y: number; w: number; h: number }
export interface Warp { x: number; y: number; to: string; tx: number; ty: number; tdir: Dir }

export interface MapDef {
  name: string;
  /** the city an indoors map belongs to */
  city?: string;
  inside?: boolean;
  rows: string[];
  buildings?: Building[];
  objects?: MapObject[];
  groundObjects?: GroundObject[];
  signs?: Sign[];
  npcs?: Npc[];
  items?: LostItem[];
  areas?: Area[];
  warps?: Warp[];
  start: [number, number, Dir];
}
