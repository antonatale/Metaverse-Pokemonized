import type { FriendId } from '../../data/characters';
import type { Look } from './types';
import { CH } from './looks';

/* What the friends wear as they grow in the story (data/people.ts): the same face, other clothes and something on the chest.
   Only numbers and colours, as in looks.ts. The first form is the portrait of looks.ts, the one of the free battles. */
const INK = '#1c2340';
const tie = (c: string) => '<path d="M124 239L136 239L140 252L130 304L120 252Z" fill="' + c + '" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/><path d="M124 239L136 239L133 248L127 248Z" fill="' + c + '" stroke="' + INK + '" stroke-width="1.6"/>';
/** a sash across the chest, in three bands */
const sash = (a: string, b: string, c: string) => '<path d="M58 262L78 252L196 304L154 304Z" fill="' + b + '"/><path d="M58 262L66 258L168 304L154 304Z" fill="' + a + '"/><path d="M70 256L78 252L196 304L182 304Z" fill="' + c + '"/><path d="M58 262L78 252L196 304M154 304L58 262" fill="none" stroke="' + INK + '" stroke-width="1.5"/>';
const medal = (c: string, s: string) => '<path d="M106 240L130 280L154 240" fill="none" stroke="' + s + '" stroke-width="4"/><circle cx="130" cy="286" r="13" fill="' + c + '" stroke="' + INK + '" stroke-width="1.8"/><path d="M130 277L133 283L139 284L134.5 288L136 294L130 291L124 294L125.5 288L121 284L127 283Z" fill="#fff4c4"/>';
const wings = '<path d="M130 272C118 258 96 258 78 268C92 270 96 276 104 276C96 280 94 284 88 288C106 288 122 284 130 272Z" fill="#f4f1ea" stroke="' + INK + '" stroke-width="1.6"/><path d="M130 272C142 258 164 258 182 268C168 270 164 276 156 276C164 280 166 284 172 288C154 288 138 284 130 272Z" fill="#f4f1ea" stroke="' + INK + '" stroke-width="1.6"/>';
const spots = [[72, 268], [100, 262], [92, 288], [176, 268], [196, 280], [168, 292], [116, 296], [58, 286], [212, 292]].map(function (p) { return '<ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="7" ry="5" fill="#3a2a18" transform="rotate(20 ' + p[0] + ' ' + p[1] + ')"/><ellipse cx="' + p[0] + '" cy="' + p[1] + '" rx="3" ry="2" fill="#c9a25a"/>'; }).join('');
const star = '<path d="M196 262L199 269L207 270L201 275L203 283L196 279L189 283L191 275L185 270L193 269Z" fill="#f2c14e" stroke="' + INK + '" stroke-width="1.4"/>';
const lotus = '<path d="M130 262C138 274 138 284 130 292C122 284 122 274 130 262ZM130 292C142 290 150 282 152 272C142 274 136 280 130 292ZM130 292C118 290 110 282 108 272C118 274 124 280 130 292Z" fill="#e8a33d" stroke="' + INK + '" stroke-width="1.5" stroke-linejoin="round"/>';

/* on the head, over the hair: the coordinates are those of the portrait, 260 wide and 300 high */
const line = 'stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"';
/** a baseball cap, with a letter in a white circle */
const cap = (c: string, d: string, l: string) => '<path d="M74 78C72 36 102 18 132 18C162 18 188 36 186 78C150 64 110 64 74 78Z" fill="' + c + '" ' + line + '/><path d="M150 67C174 66 204 76 218 90C198 87 170 82 144 79Z" fill="' + d + '" ' + line + '/><circle cx="130" cy="44" r="14" fill="#f4f1ea" ' + line + '/><text x="130" y="51" text-anchor="middle" font-family="Georgia,serif" font-size="20" font-weight="700" fill="' + d + '">' + l + '</text>';
const laurel = '<path d="M72 96C80 66 104 50 130 50C156 50 180 66 188 96" fill="none" stroke="#a8841f" stroke-width="4"/>' + [[74, 88, -60], [84, 70, -40], [100, 57, -22], [118, 51, -8], [142, 51, 8], [160, 57, 22], [176, 70, 40], [186, 88, 60]].map(function (a) { return '<ellipse cx="' + a[0] + '" cy="' + a[1] + '" rx="11" ry="5" fill="#d9b63a" stroke="' + INK + '" stroke-width="1.5" transform="rotate(' + a[2] + ' ' + a[0] + ' ' + a[1] + ')"/>'; }).join('');
/** a band across the forehead */
const band = (c: string, d: string) => '<path d="M80 104C108 90 152 90 180 104L180 120C152 106 108 106 80 120Z" fill="' + c + '" ' + line + '/><path d="M80 112C108 98 152 98 180 112" fill="none" stroke="' + d + '" stroke-width="3"/>';
const ears2 = '<path d="M86 84L84 26L124 58Z" fill="#d0702c" ' + line + '/><path d="M92 72L91 42L112 58Z" fill="#fbe3cf"/><path d="M174 84L176 26L136 58Z" fill="#d0702c" ' + line + '/><path d="M168 72L169 42L148 58Z" fill="#fbe3cf"/>';
const partyHat = '<path d="M102 44L130 0L158 44C146 50 114 50 102 44Z" fill="#e8588a" ' + line + '/><path d="M114 26L150 34M122 14L140 18" stroke="#ffe45c" stroke-width="4"/><circle cx="130" cy="4" r="7" fill="#ffe45c" ' + line + '/>';
const crown = '<path d="M86 44L78 4L108 24L130 0L152 24L182 4L174 44C146 52 114 52 86 44Z" fill="#f2c14e" ' + line + '/><circle cx="130" cy="30" r="6" fill="#2f8f4e" stroke="' + INK + '" stroke-width="1.5"/><circle cx="102" cy="34" r="4" fill="#c0392b" stroke="' + INK + '" stroke-width="1.5"/><circle cx="158" cy="34" r="4" fill="#c0392b" stroke="' + INK + '" stroke-width="1.5"/>';
const phones = '<path d="M72 136C70 44 190 44 188 136" fill="none" stroke="#111216" stroke-width="10"/><path d="M72 136C70 44 190 44 188 136" fill="none" stroke="#e8a33d" stroke-width="3"/><rect x="58" y="118" width="24" height="44" rx="10" fill="#1f2027" ' + line + '/><rect x="178" y="118" width="24" height="44" rx="10" fill="#1f2027" ' + line + '/>';
const halo = '<ellipse cx="130" cy="44" rx="50" ry="11" fill="none" stroke="#b08a3e" stroke-width="9"/><ellipse cx="130" cy="44" rx="50" ry="11" fill="none" stroke="#ffe08a" stroke-width="4"/>';

export const FORMS: Record<FriendId, [Partial<Look>, Partial<Look>]> = {
  antonio: [
    { ko: 'eyes', glasses: { style: 'round', when: 'always', koTilt: true }, outfit: { style: 'jacket', base: '#e9ebee', dark: '#bfc4cc', light: '#ffffff', line: '#6b7280', tee: '#414c72', fold: '#aab0ba' } },
    { ko: 'eyes', head: cap('#b22234', '#8e1a29', 'C'), outfit: { style: 'jacket', base: '#2a3252', dark: '#1a2040', light: '#414c72', line: '#0d1126', tee: '#f4f1ea', fold: '#151a33', over: star } }
  ],
  costanzo: [
    { outfit: { style: 'jacket', base: '#2f3a56', dark: '#1f2739', light: '#46557a', line: '#10141f', tee: '#f4f1ea', fold: '#181e2c', over: tie('#c0392b') } },
    { outfit: { style: 'jacket', base: '#1d1f26', dark: '#101116', light: '#33363f', line: '#07080b', tee: '#f4f1ea', fold: '#0c0d11', over: sash('#2f8f4e', '#f4f1ea', '#c0392b') }, head: laurel }
  ],
  andrea: [
    { head: band('#f4f1ea', '#d0702c'), outfit: { style: 'tee', broad: true, base: '#d0702c', dark: '#9a4f1c', light: '#ec934c', line: '#5a2d0f' } },
    { outfit: { style: 'jacket', broad: true, base: '#d0702c', dark: '#9a4f1c', light: '#ec934c', line: '#5a2d0f', tee: '#25262c', fold: '#7a3f16', over: wings }, head: ears2 }
  ],
  valentin: [
    { outfit: { style: 'jacket', base: '#c9a25a', dark: '#9a7a3e', light: '#e4c47e', line: '#5e4a22', tee: '#1c1c21', fold: '#8a6c34', over: spots }, head: partyHat },
    { outfit: { style: 'jacket', base: '#2f8f4e', dark: '#1f6a38', light: '#4cb06c', line: '#113c20', tee: '#f4f1ea', fold: '#175a2e', over: medal('#f2c14e', '#e0b44c') }, head: crown }
  ],
  forchetta: [
    { head: band('#f4f1ea', '#2f8f4e'), outfit: { style: 'tee', base: '#f2f0ea', dark: '#cfccc2', light: '#ffffff', line: '#6e6c63', collar: '#2f8f4e' } },
    { outfit: { style: 'stripes', base: '#1f5fa8', dark: '#164a85', light: '#3a7cc7', line: '#14161f', collar: '#1f5fa8', stripes: ['#1f5fa8', '#f4f1ea', '#1f5fa8', '#f4f1ea'] }, head: cap('#1f5fa8', '#164a85', 'F') }
  ],
  zendavid: [
    { head: phones, outfit: { style: 'jacket', base: '#1f2027', dark: '#111216', light: '#34363f', line: '#07080b', tee: '#e8a33d', fold: '#0c0d11' } },
    { outfit: { style: 'tee', base: '#efe9db', dark: '#cdc5b2', light: '#ffffff', line: '#7a7362', over: lotus }, head: halo }
  ]
};
const made: Record<string, Look> = {};
/** a friend as it looks in a form: nothing for the first one, which is the portrait everybody has */
export function lookOf(id: string, form?: number): Look | undefined {
  if (!form || !FORMS[id as FriendId]) return undefined;
  var k = id + form;
  return made[k] || (made[k] = Object.assign({}, CH[id as FriendId], FORMS[id as FriendId][form - 1], { P: CH[id as FriendId].P + 'f' + form }));
}
