import type { NetId } from '../../data/nets';

/* The nets, drawn: the hoop and its mesh in the colours of its worth (wood, blue, silver, gold), the fishermen's trap
   basket, the night net with its lamp. netSVG is the net in the hand (the bag, the shop, the throw); netBall is the net
   closed on a creature, lying on the ground. Stickers, like the creatures: fixed colours with a dark outline. */

const INK = '#1c2340';
interface NetArt { hoop: string; mesh: string; handle: string; shine?: string }
const ART: Record<NetId, NetArt> = {
  retino: { hoop: '#c8a06a', mesh: '#f4efe6', handle: '#8a6a3c' },
  retino2: { hoop: '#3f7fbf', mesh: '#e9f4ff', handle: '#8a6a3c' },
  argento: { hoop: '#c9d2e3', mesh: '#ffffff', handle: '#7d879c', shine: '#ffffff' },
  oro: { hoop: '#ffd84d', mesh: '#fff6cc', handle: '#b7862a', shine: '#fffbe6' },
  nassa: { hoop: '#b08a52', mesh: '#e8d9b8', handle: '#8a6a3c' },
  lampara: { hoop: '#ff9a3c', mesh: '#fff1d6', handle: '#8a6a3c' }
};
const artOf = (id: string): NetArt => ART[id as NetId] || ART.retino;
/** the mesh inside a circle: chords at 45°, both ways */
function mesh(cx: number, cy: number, r: number, col: string, step: number): string {
  let d = '';
  for (let o = -r + step / 2; o < r; o += step) {
    const h = Math.sqrt(Math.max(0, r * r - o * o)), c = Math.SQRT1_2;
    /* a chord at offset o, turned by +45° and by −45° */
    d += 'M' + (cx + (o - h) * c).toFixed(1) + ' ' + (cy + (o + h) * c).toFixed(1) + ' L' + (cx + (o + h) * c).toFixed(1) + ' ' + (cy + (o - h) * c).toFixed(1) + ' ';
    d += 'M' + (cx + (o - h) * c).toFixed(1) + ' ' + (cy - (o + h) * c).toFixed(1) + ' L' + (cx + (o + h) * c).toFixed(1) + ' ' + (cy - (o - h) * c).toFixed(1) + ' ';
  }
  return '<path d="' + d + '" stroke="' + col + '" stroke-width="2" fill="none" stroke-linecap="round" opacity=".95"/>';
}
/** a net in the hand, as an SVG of size px */
export function netSVG(id: string, size: number): string {
  const a = artOf(id);
  let s = '<svg viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">';
  if (id === 'nassa') {
    /* the trap basket: a wicker cylinder with a funnel mouth */
    s += '<path d="M14 18h30a12 14 0 0 1 0 28H14Z" fill="' + a.hoop + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M22 18v28M30 18v28M38 18v28M14 26h36M14 34h38M14 42h36" stroke="' + a.mesh + '" stroke-width="2.2"/>' +
      '<ellipse cx="14" cy="32" rx="7" ry="14" fill="' + a.mesh + '" stroke="' + INK + '" stroke-width="3"/><ellipse cx="14" cy="32" rx="3" ry="6" fill="' + INK + '" opacity=".75"/>';
    return s + '</svg>';
  }
  s += '<path d="M38 38L58 58" stroke="' + INK + '" stroke-width="8"/><path d="M38 38L58 58" stroke="' + a.handle + '" stroke-width="4.5"/>' +
    '<circle cx="25" cy="25" r="19" fill="' + a.mesh + '" fill-opacity=".35"/>' + mesh(25, 25, 17, INK, 7) +
    '<circle cx="25" cy="25" r="19" stroke="' + INK + '" stroke-width="7.5"/><circle cx="25" cy="25" r="19" stroke="' + a.hoop + '" stroke-width="4"/>';
  if (a.shine) s += '<path d="M12 16A16 16 0 0 1 22 8" stroke="' + a.shine + '" stroke-width="2.4"/><path d="M50 8l1.5 3.5L55 13l-3.5 1.5L50 18l-1.5-3.5L45 13l3.5-1.5Z" fill="' + a.shine + '" stroke="' + INK + '" stroke-width="1.2"/>';
  if (id === 'lampara') s += '<circle cx="52" cy="12" r="9" fill="#ffe9a8" opacity=".55"/><rect x="47.5" y="8" width="9" height="10" rx="2.5" fill="#ffe45c" stroke="' + INK + '" stroke-width="2"/><path d="M49 6h6" stroke="' + INK + '" stroke-width="2"/>';
  return s + '</svg>';
}
/** the net closed on a creature, on the ground: a round sack of mesh with the hoop as its band, knotted on top */
export function netBall(id: string): string {
  const a = artOf(id);
  if (id === 'nassa') return netSVG(id, 100).replace('width="100" height="100"', '');
  return '<svg viewBox="0 0 100 100" aria-hidden="true" fill="none" stroke-linecap="round" stroke-linejoin="round">' +
    '<ellipse cx="50" cy="92" rx="30" ry="6" fill="' + INK + '" opacity=".18"/>' +
    '<circle cx="50" cy="56" r="34" fill="' + a.mesh + '" stroke="' + INK + '" stroke-width="5"/>' + mesh(50, 56, 31, INK, 10) +
    '<path d="M17 50Q50 66 83 50" stroke="' + INK + '" stroke-width="10"/><path d="M17 50Q50 66 83 50" stroke="' + a.hoop + '" stroke-width="6"/>' +
    '<path d="M42 22Q50 14 58 22" stroke="' + INK + '" stroke-width="5"/><circle cx="50" cy="20" r="6" fill="' + a.hoop + '" stroke="' + INK + '" stroke-width="3.5"/>' +
    (a.shine ? '<path d="M28 40A26 26 0 0 1 40 28" stroke="' + a.shine + '" stroke-width="4"/>' : '') + '</svg>';
}
