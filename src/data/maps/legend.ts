import type { Ground } from './types';

/* What each map character is made of: the ground (g), whether it blocks (solid), a flat decoration drawn
   into the ground (deco), a tall object drawn sorted with the people (obj), and whether you can talk across it (reach). */
export const LEGEND: Record<string, Ground> = {
  '.': { g: 'grass' }, 'f': { g: 'grass', deco: 'flowers' }, ',': { g: 'path' }, '=': { g: 'road' }, ':': { g: 'sand' },
  '~': { g: 'sea', solid: true }, 'w': { g: 'pier' }, '_': { g: 'stone' }, 'c': { g: 'clay' }, 'F': { g: 'floor' }, 'D': { g: 'floor', deco: 'mat' },
  'x': { g: 'wall', solid: true }, 'r': { g: 'rail', solid: true },
  'T': { g: 'grass', obj: 'tree', solid: true }, 'p': { g: 'path', obj: 'palm', solid: true }, 'P': { g: 'sand', obj: 'palm', solid: true },
  '#': { g: 'grass', deco: 'hedge', solid: true }, 'b': { g: 'path', deco: 'bench', solid: true }, 'l': { g: 'path', obj: 'lamp', solid: true },
  'u': { g: 'sand', obj: 'umbrella', solid: true }, 'o': { g: 'sea', obj: 'boat', solid: true }, 'q': { g: 'path', deco: 'railing', solid: true },
  's': { g: 'stone', deco: 'stage', solid: true }, 'm': { g: 'stone', deco: 'stage', obj: 'mic', solid: true },
  'n': { g: 'clay', deco: 'net', solid: true, reach: true }, 'k': { g: 'floor', deco: 'counter', solid: true, reach: true },
  /* Formia, second edition: mountains, olive trees, cypresses, steps, cobbles, the old polygonal walls, rocks in the sea */
  'M': { g: 'hill', solid: true }, 'O': { g: 'grass', obj: 'olive', solid: true }, 'C': { g: 'grass', obj: 'cypress', solid: true },
  'H': { g: 'steps' }, 'v': { g: 'paving' }, 'W': { g: 'mura', solid: true }, 'R': { g: 'sea', deco: 'rocks', solid: true },
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
  /* inside Morgana: a wooden table with its chairs */
  't': { g: 'floor', deco: 'table', solid: true },
  /* a table outside the Gelateria Lavezzi */
  'd': { g: 'stone', deco: 'cafe', solid: true },
  /* the quay of Mola: nets spread out to dry (you can walk over them) */
  'e': { g: 'stone', deco: 'nets' },
  /* the Cisternone: water you can wade through, where a current may carry you (see `slide` in data/maps/types.ts) */
  '%': { g: 'sea', deco: 'ford' },
  /* where the wild creatures hide (data/encounters.ts): tall grass, and rock pools on the beach */
  'E': { g: 'grass', deco: 'tall' }, 'A': { g: 'sand', deco: 'pools' }
};
