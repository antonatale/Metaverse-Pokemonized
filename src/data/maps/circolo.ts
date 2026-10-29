import type { MapDef } from './types';

/* Inside the Circolo Tennis, Forchetta's covo. */
export const circolo: MapDef = {
  name: 'Circolo Tennis',
  city: 'formia',
  inside: true,
  rows: [
    'xxxxxxxxxxxx',
    'xFFFFFFFFFFx',
    'xFccccccccFx',
    'xFccccccccFx',
    'xFccccccccFx',
    'xFccccccccFx',
    'xFnnnnnnnnFx',
    'xFccccccccFx',
    'xFccccccccFx',
    'xFccccccccFx',
    'xFccccccccFx',
    'xFFFFFFFFFFx',
    'xxxxxDDxxxxx'
  ],
  groundObjects: [{ kind: 'court', x: 2, y: 2, w: 8, h: 9 }, { kind: 'scoreboard', x: 4, y: 0, w: 4, text: '15 – 0' }],
  warps: [{ x: 5, y: 12, to: 'formia', tx: 38, ty: 10, tdir: 'down' }, { x: 6, y: 12, to: 'formia', tx: 38, ty: 10, tdir: 'down' }],
  npcs: [
    { id: 'forchetta', person: 'forchetta', x: 5, y: 5, dir: 'down', covo: 'circolo' },
    { id: 'raccattapalle', name: 'Raccattapalle', seed: 71, x: 9, y: 11, dir: 'left', lines: ['Forchetta risponde quando vuole lui.', 'Parlagli da qui, oltre la rete.'] },
    { id: 'spettatrice', name: 'Spettatrice', seed: 72, x: 1, y: 4, dir: 'right', lines: ['Forchetta non sbaglia mai il servizio.', 'Quasi mai.'] }
  ],
  start: [5, 11, 'up']
};
