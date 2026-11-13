import type { Ground } from './types';

/* What each map character is made of: the ground (g), whether it blocks (solid), a flat decoration drawn
   into the ground (deco), a tall object drawn sorted with the people (obj), and whether you can talk across it (reach). */
export const LEGEND: Record<string, Ground> = {
  '.': { g: 'grass' }, 'f': { g: 'grass', deco: 'flowers' }, ',': { g: 'path' }, '=': { g: 'road' }, ':': { g: 'sand' },
  '~': { g: 'sea', solid: true }, 'w': { g: 'pier' }, '_': { g: 'stone' }, 'c': { g: 'clay' }, 'F': { g: 'floor' }, 'D': { g: 'floor', deco: 'mat' },
  'x': { g: 'wall', solid: true }, 'r': { g: 'rail', solid: true },
  'T': { g: 'grass', obj: 'tree', solid: true }, 'p': { g: 'path', obj: 'palm', solid: true }, 'P': { g: 'sand', obj: 'palm', solid: true },
  '#': { g: 'grass', deco: 'hedge', solid: true }, 'b': { g: 'path', deco: 'bench', solid: true }, 'l': { g: 'path', obj: 'lamp', solid: true },
  'u': { g: 'sand', obj: 'umbrella', solid: true }, 'o': { g: 'sea', obj: 'boat', solid: true }, '9': { g: 'sea', obj: 'gozzo', solid: true }, 'q': { g: 'path', deco: 'railing', solid: true },
  's': { g: 'stone', deco: 'stage', solid: true }, 'm': { g: 'stone', deco: 'stage', obj: 'mic', solid: true },
  'n': { g: 'clay', deco: 'net', solid: true, reach: true }, 'k': { g: 'floor', deco: 'counter', solid: true, reach: true },
  /* Formia, second edition: mountains, olive trees, cypresses, steps, cobbles, the old polygonal walls, rocks in the sea */
  'M': { g: 'hill', solid: true }, 'O': { g: 'grass', obj: 'olive', solid: true }, 'C': { g: 'grass', obj: 'cypress', solid: true },
  'H': { g: 'steps' }, 'v': { g: 'paving' }, ';': { g: 'paving', obj: 'scooter', solid: true }, 'W': { g: 'mura', solid: true }, 'R': { g: 'sea', deco: 'rocks', solid: true },
  'z': { g: 'road', deco: 'zebra' }, 'G': { g: 'far', solid: true }, 'B': { g: 'stone', deco: 'bench', solid: true },
  'L': { g: 'stone', obj: 'lamp', solid: true }, 'Y': { g: 'paving', obj: 'lamp', solid: true }, 'K': { g: 'grass', obj: 'lamp', solid: true },
  'Q': { g: 'hill', obj: 'tree', solid: true }, 'J': { g: 'hill', obj: 'cypress', solid: true },
  /* the big Formia: umbrella pines on grass and on sand, a beach-volley net on sand */
  'i': { g: 'grass', obj: 'pine', solid: true },
  /* Antonio's flat */
  '1': { g: 'floor', deco: 'bed', solid: true }, '2': { g: 'floor', deco: 'desk', solid: true }, '3': { g: 'floor', deco: 'tv', solid: true },
  '4': { g: 'floor', deco: 'sofa', solid: true }, '5': { g: 'floor', deco: 'shelf', solid: true }, '6': { g: 'floor', deco: 'plant', solid: true }, 'I': { g: 'sand', obj: 'pine', solid: true }, 'N': { g: 'sand', deco: 'net', solid: true, reach: true },
  /* the lidi of Vindicio: sunbeds, gazebos, the windsurf boards on the sand, windsurfers and the line of buoys out at sea */
  'h': { g: 'sand', deco: 'lounger', solid: true }, 'g': { g: 'sand', obj: 'gazebo', solid: true }, 'S': { g: 'sand', obj: 'board', solid: true },
  'V': { g: 'sea', obj: 'windsurf', solid: true }, 'y': { g: 'sea', deco: 'buoy', solid: true },
  /* the Lido Oriente: its canoes pulled up on the sand, its pedalò on the water */
  'U': { g: 'sand', obj: 'canoe', solid: true }, 'X': { g: 'sea', obj: 'pedalo', solid: true },
  /* the second cities, still in the clouds beyond their stations (stations.ts) */
  'Z': { g: 'floor', obj: 'cloud', solid: true },
  /* inside Morgana: a wooden table with its chairs */
  't': { g: 'floor', deco: 'table', solid: true },
  /* a table outside the Gelateria Lavezzi */
  'd': { g: 'stone', deco: 'cafe', solid: true },
  /* the quay of Mola: nets spread out to dry (you can walk over them) */
  'e': { g: 'stone', deco: 'nets' },
  /* the Cisternone: water you can wade through, where a current may carry you (see `slide` in data/maps/types.ts) */
  '%': { g: 'sea', deco: 'ford' },
  /* Formia on three levels (VISIONE.md, V4): the face of a terrace, of rock out of town and of stone blocks in it (the
     higher ground is always to the north, so the face looks at the player); the spot where one jumps down from it, and
     never climbs back (story/movement.ts); a macera, the dry-stone wall of the olive terraces of the Aurunci */
  '^': { g: 'scarp', solid: true }, '[': { g: 'scarp', deco: 'wall', solid: true }, 'j': { g: 'scarp', deco: 'ledge', solid: true },
  'a': { g: 'grass', deco: 'macera', solid: true },
  /* the Bruno Zauli: the tartan of the athletics track, where one runs for real */
  '7': { g: 'grass', deco: 'tartan' },
  /* where the wild creatures hide (data/encounters.ts): tall grass, and rock pools on the beach */
  'E': { g: 'grass', deco: 'tall' }, 'A': { g: 'sand', deco: 'pools' },
  /* the 12 November 2026 revision: the anchor of Mola on its plinth; the railing of Parco la Fontana and its locked
     gates; the back door of Antonio's flat on the walk of the park (a warp, see formia.ts) */
  '8': { g: 'paving', obj: 'anchor', solid: true },
  '|': { g: 'grass', deco: 'fence', solid: true }, '+': { g: 'path', deco: 'gate', solid: true },
  '0': { g: 'path', deco: 'backdoor' },
  /* the car parks of Largo Paone and of the Pinetina (Street View): asphalt, the bays with their lines, parked cars */
  '!': { g: 'road' }, '$': { g: 'road', deco: 'stall' }, '-': { g: 'road', deco: 'stall', obj: 'car', solid: true },
  /* the covi inside (13 November 2026): a floor tile taken by one of the keeper's things (a throne, a speaker, a server…,
     drawn by the map's covo-prop ground objects) */
  '@': { g: 'floor', solid: true }
};
