import type { FriendId } from '../characters';
import type { SpeciesId } from '../creatures';

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
  /** the houses of the town: a variation seed for their look (facade colour, roof, shutters, sun tents) */
  v?: number;
  /** a palazzo of a cortina: how far it rises over its footprint, in tiles (HEIGHT of its kind when missing), and
      what its ground floor is (a shop, the pub, the tobacconist…; a portone when missing) */
  up?: number;
  look?: string;
  /** a shop: after its message, you can buy (data/growth.ts SHOPS) */
  shop?: string;
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
/** something to read or use on a tile; quiet ones are not drawn as a signpost (furniture, a parked scooter),
    plates are the street-name plates at the corners */
export interface Sign {
  x: number; y: number; text: string[]; quiet?: boolean; ride?: boolean; plate?: boolean; sleep?: boolean;
  /** a buoy out at sea, read swimming up to it */
  buoy?: boolean;
  /** a belvedere: read from there, Formia is seen from above (the id of the view, for the diary, and its name) */
  view?: { id: string; name: string };
  /** a way in that opens with the story: once one of these flags is there the sign offers to go in (a place under the town) */
  enter?: { to: string; tx: number; ty: number; tdir: Dir; after: string[]; label: string };
}
export interface Npc {
  id: string;
  x: number; y: number;
  dir: Dir;
  /** one of the friends, drawn as himself */
  person?: FriendId;
  /** the covo he leads */
  covo?: string;
  /** organises the friends' tournament at the Bruno Zauli (data/tourney.ts) */
  tourney?: boolean;
  /** townsfolk: a name, a look picked by seed, and what they say */
  name?: string;
  seed?: number;
  /** someone who has a look of their own (render/canvas/walkers.ts LOOKS), like Nicola Spadea */
  look?: string;
  lines?: string[];
  /** what they say instead, once something has happened (a flag): the last one that holds. With `keep`, it comes before
      their usual lines instead of taking their place: those that hold a hint must not lose it */
  reacts?: { after: string; say: string[]; keep?: boolean }[];
  /** talks about a city exit */
  gate?: string;
  /** offers something to do together (see story/activities.ts) */
  activity?: string;
  /** after the lines, a tip about the next stop of the tour (see story/goals.ts) */
  hint?: boolean;
  /** there only once this friend is in Antonio's squad (he hangs out with him), or only until then (he leaves his covo) */
  with?: FriendId;
  unless?: FriendId;
  /** there only once that covo has been beaten: a friend out of his covo, where he hangs out */
  beaten?: string;
  /** a wild creature of Formia, and the levels it may have when met; another one in its place at night */
  wild?: { sp: SpeciesId; lv: [number, number]; night?: { sp: SpeciesId; lv: [number, number] } };
  /** gives Antonio his first creature (the guardaparco of Gianola) */
  starter?: boolean;
  /** sells things (data/growth.ts SHOPS) */
  shop?: string;
  /** has creatures and challenges Antonio (data/trainers.ts) */
  trainer?: string;
  /** a legend of Formia (data/legends.ts): there at its hour, once the story has got that far, until it is caught */
  legend?: string;
  /** part of the plot (story/plot.ts): there only after a thing has happened, and until another has (a flag: a key
      of st.seen, or of st.beaten such as 'tr-mamurra') */
  when?: { after?: string; until?: string };
  /** a ghost of Formia, drawn see-through (render/svg/cicero.ts) instead of a person */
  ghost?: 'mamurra';
  /** one of Antonio's creatures waiting at home (its place among them, story/growth.ts homeMons): drawn as that creature */
  pet?: number;
  /** a guard of a place: at every step of Antonio's it looks the next way of this list */
  patrol?: Dir[];
  /** out at sea: swimming (the water to the waist), standing on a paddle board or a windsurf, or sitting in a gozzo */
  float?: 'swim' | 'sup' | 'boat' | 'windsurf';
  /** someone's own creature, tame (Nicola's Delfaro at the Eclipse): drawn as that creature, leaping when in the sea */
  mon?: SpeciesId;
  /** a guard of a covo (data/covo-places.ts): there only while that covo is still to be beaten by the one played */
  guard?: string;
  /** asks the questions of a quiz at the door of a covo (data/quizzes.ts), and steps aside once it is passed */
  quiz?: string;
  /** sends the player to a covo and gives the invitation to it (data/covo-places.ts, hook) */
  hook?: string;
  /** a defender of a covo who stands in the way: once beaten (or his quiz passed) he steps aside, onto this tile */
  aside?: [number, number];
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
/** a neighbourhood, for the place name in the corner; its note says what it is, the first time Antonio walks in */
export interface Area { name: string; x: number; y: number; w: number; h: number; note?: string }
export interface Warp { x: number; y: number; to: string; tx: number; ty: number; tdir: Dir }

/* ---------- places with a puzzle: gyms, dungeons (story/place.ts does what these say, and proves it can be done) ---------- */
/** something on the floor of a place. Everything that moves with time moves with Antonio's steps, not with the clock:
    a player who stops to think loses nothing, and the validator can prove the place can be finished */
export type Thing =
  /** stepping on it turns a flag on, and off again (`once`: on for good) */
  | { k: 'plate'; x: number; y: number; flag: string; once?: boolean }
  /** solid until the flag is on; with `open`, the other way round */
  | { k: 'gate'; x: number; y: number; flag: string; open?: boolean }
  /** a floor that carries whoever steps on it, one tile after the other */
  | { k: 'slide'; x: number; y: number; dir: Dir }
  /** takes you to another tile of the same map */
  | { k: 'pad'; x: number; y: number; tx: number; ty: number; tdir?: Dir }
  /** dangerous on some steps out of every so many: stepping on it then sends you back to the last rest. `rock`: what
      comes is a boulder, not the water; `mist`: the Iele dancing in the green mist of Valentin's tower */
  | { k: 'beat'; x: number; y: number; every: number; on: number[]; look?: 'rock' | 'mist' }
  /** where a fall brings you back to, once you have been there */
  | { k: 'rest'; x: number; y: number }
  /** clears every flag: the way out of anything */
  | { k: 'reset'; x: number; y: number };
export interface PlaceDef {
  /** where Antonio comes in, and where he goes back to with no rest yet */
  entry: [number, number, Dir];
  /** what the place is about: the validator proves that from anywhere you can get next to it (or on it) */
  goal: [number, number];
  things: Thing[];
  /** what is said at a rest, and when a beat sends you back */
  words?: { rest: string; hit: string };
}

export interface MapDef {
  name: string;
  /** the city an indoors map belongs to */
  city?: string;
  inside?: boolean;
  rows: string[];
  /** a home: where the creatures that are not travelling wait, in this plan (story/maps.ts has the ones of Antonio's) */
  homeSpots?: [number, number, Dir][];
  buildings?: Building[];
  objects?: MapObject[];
  groundObjects?: GroundObject[];
  signs?: Sign[];
  /** strings of lights hung across a lane, from the palazzi on one side to those on the other (via Abate Tosti):
      over the tiles x0..x1 of row y, drawn over whoever walks under them */
  festoons?: { x0: number; x1: number; y: number }[];
  npcs?: Npc[];
  items?: LostItem[];
  areas?: Area[];
  warps?: Warp[];
  start: [number, number, Dir];
  /** where each protagonist's story begins, at his home (Antonio's is `start`) */
  starts?: Record<string, [number, number, Dir]>;
  /** a place with a puzzle */
  place?: PlaceDef;
  /** no light of its own: dark by day and by night, only the lamps and Antonio's own light */
  dark?: boolean;
  /** the wild creatures of a place (data/encounters.ts): every step inside may meet one */
  meet?: string;
  /** the mood of a covo inside (render/canvas/covo.ts, ambience): the keeper it belongs to */
  theme?: string;
}
