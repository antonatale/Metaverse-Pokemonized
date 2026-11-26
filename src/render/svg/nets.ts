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
/* The net in the hand (24 November 2026): a hand net as the fishermen of Mola have it, the hoop seen a little from above and
   its mesh hanging under it like a bag, the handle across; before, a round hoop that read as a magnifying glass. */
const RIM = { cx: 26, cy: 20, rx: 19, ry: 9.5, rot: -16 * Math.PI / 180 };
/** a point of the hoop, at an angle (0: its right end, π/2: the side nearer to the eye) */
function rim(t: number): [number, number] {
  const x = RIM.rx * Math.cos(t), y = RIM.ry * Math.sin(t);
  return [RIM.cx + x * Math.cos(RIM.rot) - y * Math.sin(RIM.rot), RIM.cy + x * Math.sin(RIM.rot) + y * Math.cos(RIM.rot)];
}
const f1 = (n: number) => n.toFixed(1);
const R = rim(0), BOTTOM: [number, number] = [21, 57];
/** a point of the bag: across it `u` (0 at the left end of the hoop, 1 at the right) and down it `v` (0 at the hoop, 1 at
    the bottom), along a curve that bellies out */
function bagAt(u: number, v: number): [number, number] {
  const s0 = rim(Math.PI * (1 - u)), c = [s0[0] * 0.7 + BOTTOM[0] * 0.3 + (u - 0.5) * 14, s0[1] * 0.25 + BOTTOM[1] * 0.75];
  const w = 1 - v;
  return [w * w * s0[0] + 2 * w * v * c[0] + v * v * BOTTOM[0], w * w * s0[1] + 2 * w * v * c[1] + v * v * BOTTOM[1]];
}
function bagLine(pts: [number, number][]): string { return 'M' + pts.map(function (p) { return f1(p[0]) + ' ' + f1(p[1]); }).join('L'); }
function down(u: number): [number, number][] { const out: [number, number][] = []; for (let k = 0; k <= 10; k++) out.push(bagAt(u, k / 10)); return out; }
function across(v: number): [number, number][] { const out: [number, number][] = []; for (let k = 0; k <= 12; k++) out.push(bagAt(k / 12, v)); return out; }
/** the bag of mesh: down the left side, up the right side */
const BAG = bagLine(down(0).concat(down(1).reverse())) + 'Z';
/** the mesh of the bag: lines from the hoop down to the bottom, and rings across */
function bagMesh(col: string): string {
  let d = '';
  for (let u = 1; u < 5; u++) d += bagLine(down(u / 5).slice(0, 10));
  for (let v = 1; v < 4; v++) d += bagLine(across(v / 4.2));
  return '<path d="' + d + '" stroke="' + col + '" stroke-width="1.6" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>';
}
/** the hoop: the far half first (behind the bag), the near half after */
function hoopArc(from: number, to: number): string {
  const pts: string[] = [];
  for (let k = 0; k <= 16; k++) { const p = rim(from + (to - from) * k / 16); pts.push(f1(p[0]) + ' ' + f1(p[1])); }
  return 'M' + pts.join('L');
}
const FAR = hoopArc(Math.PI, 2 * Math.PI), NEAR = hoopArc(0, Math.PI);
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
  const hx = R[0] - 2, hy = R[1] + 3;
  s += '<path d="M' + f1(hx) + ' ' + f1(hy) + 'L58 58" stroke="' + INK + '" stroke-width="8.5"/><path d="M' + f1(hx) + ' ' + f1(hy) + 'L58 58" stroke="' + a.handle + '" stroke-width="5"/>' +
    '<path d="M52 52L58 58" stroke="' + INK + '" stroke-width="8.5"/><path d="M52.6 52.6L57.6 57.6" stroke="#5a4426" stroke-width="5"/>' +
    '<path d="' + FAR + '" stroke="' + INK + '" stroke-width="6.5"/><path d="' + FAR + '" stroke="' + a.hoop + '" stroke-width="3.2"/>' +
    '<path d="' + BAG + '" fill="' + a.mesh + '" fill-opacity=".55" stroke="' + INK + '" stroke-width="2.8"/>' + bagMesh(INK) +
    '<path d="' + NEAR + '" stroke="' + INK + '" stroke-width="7"/><path d="' + NEAR + '" stroke="' + a.hoop + '" stroke-width="3.6"/>';
  if (a.shine) s += '<path d="' + hoopArc(Math.PI * 0.55, Math.PI * 0.85) + '" stroke="' + a.shine + '" stroke-width="1.8"/><path d="M52 6l1.5 3.5L57 11l-3.5 1.5L52 16l-1.5-3.5L47 11l3.5-1.5Z" fill="' + a.shine + '" stroke="' + INK + '" stroke-width="1.2"/>';
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
