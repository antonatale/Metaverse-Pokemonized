import type { MapDef } from './types';
import { FORMIA_AT } from './formia-ground';
const exit = (id: string) =>
  [5, 6].map((x) => ({
    x,
    y: 7,
    to: 'formia',
    tx: FORMIA_AT[id].door![0],
    ty: FORMIA_AT[id].door![1] + 1,
    tdir: 'down' as const,
  }));
export const LOCAL_SHOPS: Record<string, MapDef> = {
  altieri: {
    name: 'Tabacchi Altieri',
    city: 'formia',
    inside: true,
    rows: [
      'xxxxxxxxxxxx',
      'x5FF5FFFF5Fx',
      'xFFFFFFFFFFx',
      'xkkkkFkkkkFx',
      'xFFFFFFFFFFx',
      'xFFFFFFFFFFx',
      'xFFFFFFFFFFx',
      'xxxxxDDxxxxx',
    ],
    start: [5, 6, 'up'],
    warps: exit('altieri'),
    groundObjects: [
      { kind: 'nameplate', x: 2, y: 0, w: 8, h: 1, text: 'TABACCHI ALTIERI' },
      { kind: 'home-prop', x: 1, y: 1, w: 3, h: 1, text: 'papers' },
    ],
    npcs: [
      {
        id: 'nonno-altieri',
        x: 2,
        y: 2,
        name: 'Nonno',
        look: 'nonno',
        dir: 'down',
        lines: ['Eccoti! Ci trovi sempre qui a Largo Paone.', 'Tua nonna ha tenuto da parte il giornale.'],
      },
      {
        id: 'nonna-altieri',
        x: 8,
        y: 2,
        name: 'Nonna',
        look: 'nonna',
        dir: 'down',
        lines: [
          'Hai salutato zio Lele? È dietro al banco.',
          'Passa anche al ritorno, così ci racconti il giro.',
        ],
      },
      {
        id: 'lele',
        x: 6,
        y: 2,
        name: 'Zio Lele',
        look: 'lele',
        dir: 'down',
        lines: [
          'Oh, eccoti! Tutto a posto?',
          'Da qui vediamo passare mezza Formia. Ci si dà appuntamento a Largo Paone.',
        ],
      },
    ],
    signs: [{ x: 1, y: 1, quiet: true, text: ['Giornali e oggetti del negozio, in ordine sugli scaffali.'] }],
  },
  'barber-may': {
    name: 'Barber May',
    city: 'formia',
    inside: true,
    rows: [
      'xxxxxxxxxxxx',
      'x2FF2FF2FFFx',
      'xFFFFFFFFFFx',
      'x4FF4FF4FFFx',
      'xFFFFFFFFFFx',
      'x5FFFFFF6FFx',
      'xFFFFFFFFFFx',
      'xxxxxDDxxxxx',
    ],
    start: [5, 6, 'up'],
    warps: exit('barber-may'),
    groundObjects: [
      { kind: 'nameplate', x: 2, y: 0, w: 8, h: 1, text: 'BARBER MAY' },
      { kind: 'home-prop', x: 1, y: 1, w: 2, h: 1, text: 'mirror' },
      { kind: 'home-prop', x: 4, y: 1, w: 2, h: 1, text: 'mirror' },
      { kind: 'home-prop', x: 7, y: 1, w: 2, h: 1, text: 'mirror' },
      { kind: 'rug', x: 2, y: 4, w: 7, h: 2, color: 'stone2' },
    ],
    npcs: [
      {
        id: 'barbiere-may',
        x: 9,
        y: 2,
        name: 'Il barbiere',
        seed: 27,
        dir: 'left',
        lines: [
          'Benvenuto da Barber May! Accomodati.',
          'Dopo il taglio puoi scendere verso via Abate Tosti o risalire a San Giovanni.',
        ],
      },
    ],
    signs: [
      { x: 4, y: 3, quiet: true, text: ['La poltrona da barbiere, davanti allo specchio.'] },
      { x: 1, y: 5, quiet: true, text: ['Pettini, forbici e prodotti per la cura dei capelli.'] },
    ],
  },
};
