import type { Look } from '../src/render/svg/types';

/* Tullio, the guardaparco's grandson and Antonio's rival (src/story/rival.ts), drawn like the six friends for the
   trailer: red hair in a quiff, green eyes, the green hoodie of his grandfather's park, a cocky smile. In the game he
   is only on the map (LOOKS.tullio in src/render/canvas/walkers.ts). */
export const TULLIO: Look = {
  P: 'tu', name: 'Tullio', face: 'oval', earDx: 1, thumb: '44 16 172 172',
  skin: { base: '#efc6a6', light: '#fbe0cb', shade: '#d6a888', deep: '#b07e62', line: '#7d4f3e', blush: '#f0a58f' },
  lips: { base: '#cf8078', dark: '#9f5654', light: '#e8a8a0', inside: '#5e2a2e' },
  iris: { base: '#5e8f4c', dark: '#284622', light: '#a3cc86' },
  brow: { color: '#8c3b1b', hi: '#c66a3e', w: 1.05 },
  hair: { style: 'quiff', seed: 314, out: '#5a220e', body: ['#b5532b', '#c66432', '#a44a26'], hi: '#f0a36c' },
  outfit: { style: 'hoodie', base: '#2f8f5b', dark: '#1f6b42', deep: '#134a2c', light: '#52b27c', line: '#0e3320' },
  ko: 'eyes',
  ex: {
    smirk: { m: 'smirk', bl: { inner: -0.6 }, br: { outer: 5, mid: 4, inner: 1.2 }, e: { open: 0.95, look: [-2.4, 0] } },
    cool: { m: 'smug', br: { outer: 4, mid: 3.4, inner: 1 } }
  }
};
