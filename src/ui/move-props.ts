import type { Prop } from '../data/move-fx';

/* What a move is made of, when it is not its type's shapes (data/move-fx.ts, `prop`): the runes of Coda runica, the
   thorns of Pioggia di spine, the fish stolen from the stall, the boulders thrown at Ulysses' ships. Each is drawn in
   the move's colour, at a given size; a few keep their own colours (the panino, the stone heart). Only drawing. */

/** the ink of every outline (INK in ui/spell-kit.ts, which draws with these) */
const INK = '#1c2340';
const svg = (vb: string, w: number, h: number, inner: string) =>
  '<svg viewBox="' + vb + '" width="' + Math.round(w) + '" height="' + Math.round(h) + '" aria-hidden="true" stroke-linejoin="round" stroke-linecap="round">' + inner + '</svg>';
const ink = (w: number) => ' stroke="' + INK + '" stroke-width="' + w + '"';
const hi = (d: string, w: number) => '<path d="' + d + '" fill="none" stroke="#ffffff" stroke-width="' + w + '" opacity=".75"/>';
const STAR = 'M12 1L15 8.6L23 9.2L17 14.4L18.8 22.4L12 18.2L5.2 22.4L7 14.4L1 9.2L9 8.6Z';
export const HEART = 'M12 21C5 16 2 12 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 4-3 8-10 13Z';

export const PROPS: Record<Prop, (col: string, s: number) => string> = {
  /* a stone of the walls with a rune cut in it */
  rune: (c, s) => svg('0 0 24 24', s, s, '<path d="M12 1L22 12L12 23L2 12Z" fill="' + c + '"' + ink(1.8) + '/><path d="M8.5 7.5L12 10.5L15.5 7.5M12 10.5V17.5M9 14.5H15" fill="none" stroke="#ffffff" stroke-width="2"/>'),
  thorn: (c, s) => svg('0 0 24 24', s, s, '<path d="M3 22C7 15 13 8 23 1C19 9 13 16 7 23Z" fill="' + c + '"' + ink(1.6) + '/>' + hi('M7 19C11 14 15 9 20 4', 1.6)),
  /* a moon of silver, a crescent with a face of craters */
  moon: (c, s) => svg('0 0 24 24', s, s, '<path d="M15 2A10 10 0 1 0 22 16A8 8 0 0 1 15 2Z" fill="' + c + '"' + ink(1.6) + '/><circle cx="8" cy="10" r="1.6" fill="#ffffff" opacity=".6"/><circle cx="10" cy="16" r="1.1" fill="#ffffff" opacity=".6"/>'),
  /* a slab of the polygonal walls, shining */
  slab: (c, s) => svg('0 0 24 24', s, s, '<path d="M3 7L10 2L21 5L22.5 15L14 22.5L3.5 19Z" fill="' + c + '"' + ink(1.6) + '/><path d="M10 2L11.5 11L22.5 15M11.5 11L3.5 19" fill="none"' + ink(1.1) + ' opacity=".6"/>' + hi('M5 8L10 4.5L18 6.5', 1.4)),
  rock: (c, s) => svg('0 0 24 24', s, s, '<path d="M3 15L5.5 6.5L13 2L20.5 6L22.5 14.5L17 21.5L7.5 21.5Z" fill="' + c + '"' + ink(1.6) + '/><path d="M13 2L12 9L16.5 13M12 9L7 12.5" fill="none"' + ink(1.1) + ' opacity=".55"/>' + hi('M6.5 8L12.5 4.5', 1.6)),
  fish: (c, s) => svg('0 0 32 18', s, s * 18 / 32, '<path d="M8 9L1 2.5L2.5 9L1 15.5Z" fill="' + c + '"' + ink(1.5) + '/><path d="M6 9Q14 0 24 3Q29 5 31 9Q29 13 24 15Q14 18 6 9Z" fill="' + c + '"' + ink(1.6) + '/>' +
    hi('M10 11Q18 14 26 11', 1.6) + '<circle cx="25" cy="7.5" r="1.4" fill="' + INK + '"/>'),
  feather: (c, s) => svg('0 0 24 24', s, s, '<path d="M21 2C11 3.5 4.5 11 3.5 20.5L5 22C13 21 20.5 13 21 2Z" fill="' + c + '"' + ink(1.6) + '/><path d="M4 21L18.5 5.5" fill="none" stroke="#ffffff" stroke-width="1.6"/>' +
    '<path d="M9 15.5L13 16.5M11.5 12.5L16 13M14 9.5L18.5 9.5" fill="none"' + ink(1) + ' opacity=".5"/>'),
  star: (c, s) => svg('0 0 24 24', s, s, '<path d="' + STAR + '" fill="' + c + '"' + ink(1.6) + '/><path d="M12 6L13.4 10" fill="none" stroke="#ffffff" stroke-width="1.6"/>'),
  eye: (c, s) => svg('0 0 32 18', s, s * 18 / 32, '<path d="M1 9Q16 -5 31 9Q16 23 1 9Z" fill="#ffffff"' + ink(1.8) + '/><circle cx="16" cy="9" r="5.4" fill="' + c + '"' + ink(1.4) + '/><circle cx="16" cy="9" r="2.4" fill="' + INK + '"/><circle cx="14.4" cy="7.2" r="1.2" fill="#ffffff"/>'),
  /* an olive's stone */
  pit: (c, s) => svg('0 0 24 24', s, s, '<path d="M12 2C18 2 21 7 21 12C21 18 17 22 12 22C7 22 3 18 3 12C3 7 6 2 12 2Z" fill="' + c + '"' + ink(1.6) + '/><path d="M12 3C10 9 10 15 12 21" fill="none"' + ink(1.2) + ' opacity=".6"/>' + hi('M7 7C8 5.5 9.5 4.5 11 4.3', 1.6)),
  /* the broom of the mountains, a yellow flower */
  flower: (c, s) => svg('0 0 24 24', s, s, [0, 72, 144, 216, 288].map((a) => '<ellipse cx="12" cy="6" rx="4" ry="5.5" transform="rotate(' + a + ' 12 12)" fill="' + c + '"' + ink(1.3) + '/>').join('') +
    '<circle cx="12" cy="12" r="3.2" fill="#ffffff"' + ink(1.2) + '/>'),
  /* a firefly: a light with little wings */
  firefly: (c, s) => svg('0 0 24 24', s, s, '<circle cx="12" cy="13" r="10" fill="' + c + '" opacity=".28"/><ellipse cx="8" cy="7.5" rx="4" ry="2.4" transform="rotate(-30 8 7.5)" fill="#ffffff" opacity=".8"' + ink(1) + '/>' +
    '<ellipse cx="16" cy="7.5" rx="4" ry="2.4" transform="rotate(30 16 7.5)" fill="#ffffff" opacity=".8"' + ink(1) + '/><circle cx="12" cy="13" r="5" fill="' + c + '"' + ink(1.4) + '/><circle cx="12" cy="13" r="2.4" fill="#ffffff"/>'),
  flame: (c, s) => svg('0 0 24 24', s, s, '<path d="M12 1C14 7 20 9 19.5 15.5A7.5 7.5 0 0 1 4.5 15.5C4.5 11 8.5 9 9 5C11 7 11.5 9 12 10.5C13 7.5 13 4 12 1Z" fill="' + c + '"' + ink(1.6) + '/>' +
    '<path d="M12 11C13.5 13.5 15.5 14.5 15 17.5A3 3 0 0 1 9 17.5C9 15.5 11 14 12 11Z" fill="#ffffff"/>'),
  note: (c, s) => svg('0 0 24 24', s, s, '<path d="M9 18.5V4.5L20 2V15.5" fill="none"' + ink(4.4) + '/><path d="M9 18.5V4.5L20 2V15.5" fill="none" stroke="' + c + '" stroke-width="2"/>' +
    '<ellipse cx="6" cy="18.5" rx="4" ry="3.2" fill="' + c + '"' + ink(1.6) + '/><ellipse cx="17" cy="15.5" rx="4" ry="3.2" fill="' + c + '"' + ink(1.6) + '/>'),
  /* a wish: a little four-pointed light */
  wish: (c, s) => svg('0 0 24 24', s, s, '<path d="M12 1L14 10L23 12L14 14L12 23L10 14L1 12L10 10Z" fill="' + c + '"' + ink(1.4) + '/><circle cx="12" cy="12" r="2.2" fill="#ffffff"/>'),
  pollen: (c, s) => svg('0 0 24 24', s, s, [[12, 5], [18.5, 9], [18, 16], [12, 19.5], [6, 16], [5.5, 9]].map((p) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="4.6" fill="' + c + '"' + ink(1.3) + '/>').join('') +
    '<circle cx="12" cy="12" r="6" fill="' + c + '"/><circle cx="10" cy="10" r="1.3" fill="#ffffff"/><circle cx="14" cy="13.5" r="1" fill="#ffffff"/>'),
  sun: (c, s) => svg('0 0 24 24', s, s, [0, 45, 90, 135, 180, 225, 270, 315].map((a) => '<path d="M12 0.5L13.6 4.5L10.4 4.5Z" transform="rotate(' + a + ' 12 12)" fill="' + c + '"' + ink(1) + '/>').join('') +
    '<circle cx="12" cy="12" r="6.5" fill="' + c + '"' + ink(1.5) + '/><circle cx="10" cy="10" r="2" fill="#ffffff" opacity=".8"/>'),
  /* the stolen panino: bread, salad, tomato */
  panino: (_c, s) => svg('0 0 24 24', s, s, '<path d="M2 14.5H22V17.5Q12 21 2 17.5Z" fill="#e3a65a"' + ink(1.4) + '/><path d="M1.5 13Q4 11 6 13Q8 11 10 13Q12 11 14 13Q16 11 18 13Q20 11 22.5 13L22 14.5H2Z" fill="#7ccf5a"' + ink(1.2) + '/>' +
    '<rect x="4" y="11.5" width="16" height="2.4" rx="1" fill="#ff6a5a"' + ink(1) + '/><path d="M2.5 11.5Q3 4 12 4Q21 4 21.5 11.5Z" fill="#f0bd6e"' + ink(1.5) + '/><path d="M8 7.5L9 7M12 6.5L13 6M15.5 8L16.5 7.5" stroke="#fff3d6" stroke-width="1.4"/>'),
  stoneheart: (_c, s) => svg('0 0 24 24', s, s, '<path d="' + HEART + '" fill="#cbb49a"' + ink(1.6) + '/><path d="M12 7L10.5 11L13.5 13L11 17M5 9L8 10.5M17.5 9.5L15 12" fill="none"' + ink(1.1) + ' opacity=".6"/>' + hi('M5 6.5C6 5 8 4.6 9.5 5.5', 1.6)),
  mast: (c, s) => svg('0 0 24 24', s, s, '<path d="M12 1V23M5 6H19M7 13H17" fill="none"' + ink(3.4) + '/><path d="M12 1V23M5 6H19M7 13H17" fill="none" stroke="' + c + '" stroke-width="1.6"/>'),
  foot: (c, s) => svg('0 0 24 24', s, s, '<path d="M5 22C3 16 4 10 8 9C12 8 14 11 15 14C16 17 19 18 19 21Z" fill="' + c + '"' + ink(1.6) + '/>' +
    [[9, 5.5, 2.3], [13, 4.5, 2], [16.5, 6, 1.8], [19.5, 8.5, 1.6], [21, 12, 1.4]].map((p) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="' + c + '"' + ink(1.3) + '/>').join('')),
  heart: (c, s) => svg('0 0 24 24', s, s, '<path d="' + HEART + '" fill="' + c + '"' + ink(1.6) + '/>' + hi('M5.5 6.5C6.5 5 8.5 4.6 10 5.5', 1.6)),
  /* a spark of plain magic, white */
  spark: (_c, s) => svg('0 0 24 24', s, s, '<path d="M13 1L6 13H11.5L9 23L18.5 9.5H13L16 1Z" fill="#ffffff"' + ink(1.6) + '/>')
};
