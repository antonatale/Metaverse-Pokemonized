import type { FriendId } from '../../data/characters';
import type { Look } from './types';

/* ================= the six friends ================= */
/* Drawn from their photos once, now only these numbers. The order is the order of the shared <defs>. */
export const CH: Record<FriendId, Look> = {
  antonio: {
    P: 'an', name: 'Antonio', face: 'square', thumb: '44 16 172 172',
    skin: { base: '#ddae93', light: '#f1cfb6', shade: '#c1937b', deep: '#9b6b59', line: '#6e4638' },
    lips: { base: '#b8716d', dark: '#8c4b4c', light: '#d39690', inside: '#55222a' },
    iris: { base: '#6c776f', dark: '#29302b', light: '#a1ab9c' },
    brow: { color: '#2b201a', hi: '#5a483e', w: 1 },
    hair: {
      style: 'curls', seed: 4242, cx: 130, cy: 94, rx: 66, ry: 63, out: '#130e0c', fills: ['#1d1512', '#251b16', '#2c211b', '#19120f'], hi: '#9a8a7c',
      front: [[193, 112], [189, 121], [181, 125], [171, 123], [160, 120], [149, 116], [138, 112], [127, 108], [116, 106], [105, 106], [95, 108], [86, 111], [78, 114], [70, 110]],
      rEdge: [8.5, 12], rIn: [7, 10], rFront: [6.2, 8.4], count: 96,
      sides: [[63, 114, 8], [59, 125, 7.6], [61, 136, 7], [66, 146, 6.2], [72, 120, 7.2], [70, 131, 6.6]],
      rings: [[102, 109, 6.6, 1.12, 1, 0.1, 0.55], [115, 108, 4.6, 1.15, -1, 0, 0.7], [166, 117, 6, 1.35, -1, -0.25, 1.05], [180, 121, 5.2, 1.2, 1, -0.35, 1]],
      fshadow: 'M78 114C94 106 112 106 130 108C150 108 170 112 190 122L186 132C168 124 150 120 130 121C110 120 94 121 76 128Z'
    },
    outfit: { style: 'hoodie', base: '#414c72', dark: '#2a3252', deep: '#1a2040', light: '#5d6a96', line: '#151a33' },
    chain: true, earring: { x: 72.6, y: 173, r: 4.5, metal: 'gold' }, ko: 'hood',
    ex: {
      smirk: { bl: { inner: -0.6 }, br: { outer: 5, mid: 4, inner: 1.2 }, e: { open: 0.92, look: [2.3, -0.1] }, m: 'smirk' },
      sleepy: { e: { open: 0.9, lid: true, lidAt: -1.4, look: [0, 1.5] } },
      cool: { glasses: 'shades' }
    }
  },
  costanzo: {
    P: 'co', name: 'Costanzo', face: 'oval', earDx: 1, thumb: '30 10 200 200',
    skin: { base: '#e6bea5', light: '#f6d9c6', shade: '#ca9e86', deep: '#a5755f', line: '#764a3b' },
    lips: { base: '#c47c78', dark: '#965256', light: '#e0a29d', inside: '#5a2329' },
    iris: { base: '#6a4a33', dark: '#2c1d14', light: '#9b7654' },
    brow: { color: '#2a1d16', hi: '#5a4335', w: 0.88 },
    hair: {
      style: 'curls', p: 2.9, hiStyle: 'wave', elong: 1.55, flowY: 60, seed: 777, cx: 130, cy: 124, rx: 73, ry: 78, out: '#120c09', fills: ['#2a1d16', '#33241b', '#251912', '#3a291f'], hi: '#9a7c68',
      front: [[184, 118], [174, 112], [162, 108], [150, 106], [138, 106], [126, 108], [114, 111], [103, 115], [94, 120], [86, 126]], frontDefault: 999,
      rEdge: [8.5, 11], rIn: [7.5, 10], rFront: [7, 9], count: 140, minD: 9, avoid: { cx: 130, cy: 168, rx: 51, ry: 63 },
      frizz: 16, frizzColor: '#3a291f', glow0: 0.2, glow1: 0.45, a0: 0.56, aSpan: 1.88, edgeN: 34,
      fshadow: 'M84 118C100 108 116 106 132 108C150 108 168 112 186 122L182 132C166 122 150 118 132 119C114 119 100 122 84 130Z'
    },
    outfit: { style: 'turtleneck', base: '#25272f', dark: '#14151a', light: '#3d404b', line: '#07080b' },
    ko: 'eyes',
    ex: {
      smirk: { m: 'talk', bl: { outer: 0.6, mid: 0.8 }, br: { outer: 1.4, mid: 1.6 }, e: { open: 0.95, look: [2.4, -0.2] } },
      cool: { m: 'smug' }
    }
  },
  andrea: {
    P: 'av', name: 'Andrea', face: 'strong', earDx: 1, nose: 'strong', thumb: '44 16 172 172',
    skin: { base: '#e3b99d', light: '#f4d4be', shade: '#c69a81', deep: '#9f705b', line: '#714637' },
    lips: { base: '#c27773', dark: '#924f52', light: '#dea09a', inside: '#58222a' },
    iris: { base: '#7c8a7f', dark: '#36413a', light: '#b7c2b4' },
    brow: { color: '#18110e', hi: '#42342c', w: 1.18 },
    hair: { style: 'quiff', seed: 99, out: '#140f0d', body: ['#2b201b', '#33271f', '#251c17'], hi: '#7a6b60' },
    outfit: { style: 'tee', broad: true, base: '#25262c', dark: '#121317', light: '#3a3c45', line: '#060709' },
    ko: 'eyes',
    ex: {
      smirk: { m: 'neutral', bl: {}, br: {}, e: { open: 0.9, look: [2.4, 0] } },
      cool: { m: 'smug', br: { outer: 4, mid: 3.4, inner: 1 } }
    }
  },
  valentin: {
    P: 'va', name: 'Valentin', face: 'round', earDx: -2, thumb: '20 4 220 220', underEye: 0.3,
    skin: { base: '#edc4ab', light: '#f9dfcf', shade: '#d4a18a', deep: '#af7864', line: '#7c4b3d', blush: '#ea877b' },
    lips: { base: '#c9787a', dark: '#9c5058', light: '#e5a5a2', inside: '#5c2229' },
    iris: { base: '#6b4b35', dark: '#2b1c13', light: '#9a7656' },
    brow: { color: '#6a4530', hi: '#9a6c4f', w: 0.82, lift: 4 },
    hair: {
      style: 'curls', mane: true, seed: 31337, cx: 130, cy: 114, rx: 100, ry: 96, out: '#4a2b1c', fills: ['#7b4d33', '#8a5a3c', '#6d432d', '#965f3f'], hi: '#e6b98c',
      front: [[178, 114], [168, 106], [156, 101], [143, 98], [130, 97], [117, 98], [104, 101], [92, 106], [82, 114]], frontDefault: 999,
      rEdge: [12, 17], rIn: [10, 14], rFront: [7.4, 9.6], count: 150, minD: 11.5, avoid: { cx: 130, cy: 164, rx: 50, ry: 66 },
      frizz: 90, frizzColor: '#a8754f', glow0: 0.22, glow1: 0.5, a0: 0.62, aSpan: 1.76, edgeN: 30
    },
    outfit: { style: 'jacket', base: '#ddd6c6', dark: '#b6ad99', light: '#efebe2', line: '#6b6252', tee: '#1c1c21', fold: '#a39a85' },
    glasses: { style: 'shadesGreen', when: 'always', koTilt: true },
    earring: { x: 189.4, y: 173, r: 4.4, metal: 'silver', bar: true }, ko: 'eyes',
    ex: { smirk: { m: 'talk' }, cool: { m: 'grin', cheeks: true } }
  },
  forchetta: {
    P: 'fo', name: 'Forchetta', face: 'oval', earDx: 1, thumb: '38 12 184 184',
    skin: { base: '#e4bca1', light: '#f4d6c1', shade: '#c79c84', deep: '#a0715d', line: '#724739' },
    lips: { base: '#c07672', dark: '#924d51', light: '#dc9e98', inside: '#572229' },
    /* light eyes, between blue and green */
    iris: { base: '#7ea7b8', dark: '#3d5c6b', light: '#c2dbe4' },
    brow: { color: '#4a3324', hi: '#7a5a43', w: 0.86 },
    hair: {
      style: 'curls', p: 2.3, seed: 2024, cx: 130, cy: 106, rx: 75, ry: 77, out: '#26170e', fills: ['#4f3423', '#5b3d29', '#45301f', '#664632'], hi: '#c29670',
      front: [[186, 120], [176, 115], [164, 112], [152, 110], [140, 109], [128, 109], [116, 110], [104, 112], [94, 115], [86, 120]], frontDefault: 999,
      rEdge: [10, 13.5], rIn: [8.5, 11.5], rFront: [7, 9.4], count: 122, minD: 10, avoid: { cx: 130, cy: 168, rx: 50, ry: 62 },
      frizz: 26, frizzColor: '#6e4d34', a0: 0.62, aSpan: 1.76, edgeN: 30,
      fshadow: 'M82 118C98 110 114 110 130 112C150 112 168 116 188 124L184 134C168 126 150 122 130 123C110 122 96 124 80 130Z'
    },
    outfit: { style: 'stripes', base: '#5d5a3e', dark: '#3a3828', light: '#7a7650', line: '#14161f', collar: '#20263a', stripes: ['#283046', '#d6c9a8', '#6e6c43', '#5d4331', '#8b8f93', '#a59a6b', '#283046', '#d6c9a8', '#4b5160'] },
    earring: { x: 186.6, y: 170.6, r: 1.9, metal: 'silver', stud: true }, ko: 'eyes',
    ex: {
      smirk: { m: 'neutral', e: { open: 1, lid: true, lidAt: -3.4, look: [1.6, 1.6] }, bl: { inner: 0.4 }, br: { inner: 0.4 } },
      cool: { m: 'soft', e: { closed: 'happy' } }
    }
  },
  zendavid: {
    P: 'zd', name: 'Zendavid', face: 'oval', earDx: 1, thumb: '40 14 180 180',
    skin: { base: '#deb294', light: '#efcdb5', shade: '#c09177', deep: '#986751', line: '#6c4334' },
    lips: { base: '#b87170', dark: '#8b4a4e', light: '#d69791', inside: '#552127' },
    iris: { base: '#5a3e2b', dark: '#24170f', light: '#8a684c' },
    brow: { color: '#231915', hi: '#4f3d33', w: 0.98, lift: 1 },
    hair: { style: 'buzz', base: '#2a201b' },
    beard: { color: '#2a1f1a' },
    outfit: { style: 'knit', base: '#837c74', dark: '#5f5953', light: '#9a938b', line: '#3a3530', tee: '#d1cdc6', strap: '#19191d' },
    glasses: { style: 'round', when: 'always', koTilt: true },
    earring: { x: 187.6, y: 172, r: 3.4, metal: 'silver' }, props: { phones: true }, ko: 'eyes',
    ex: { smirk: { m: 'soft' }, cool: { m: 'soft', e: { closed: 'happy' } } }
  }
};
