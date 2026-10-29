/* Canvas helpers for the map art. Style: a map drawn in ballpoint on squared paper, coloured with highlighters. */
import type { Palette } from './palette';

export type Ctx = CanvasRenderingContext2D;

export const T = 32;                       /* tile size in CSS px */
/** the dark outline of the characters, who are fixed-colour stickers on the map */
export const STICKER_INK = '#1c2340';

export function mk(w: number, h: number): HTMLCanvasElement { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
/* rounded rectangle; keep = add to the current path instead of starting a new one */
export function rr(c: Ctx, x: number, y: number, w: number, h: number, r: number, keep?: boolean) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (!keep) c.beginPath();
  c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
export function hash(x: number, y: number, k?: number): number {
  var h = (x * 374761393 + y * 668265263 + (k || 0) * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
export function fillStroke(c: Ctx, fill: string | null | undefined, ink?: string | null, lw?: number) { if (fill) { c.fillStyle = fill; c.fill(); } if (ink) { c.strokeStyle = ink; c.lineWidth = lw || 1.6; c.stroke(); } }
export function circle(c: Ctx, x: number, y: number, r: number) { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); }
export function ell(c: Ctx, x: number, y: number, rx: number, ry: number) { c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
export function poly(c: Ctx, pts: number[][]) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); }
/* soft shapes made of circles: stroked wide first, then filled, so only the outer outline shows */
export function blobs(c: Ctx, list: number[][], fill: string, ink: string | null, lw?: number) {
  c.beginPath();
  list.forEach(function (b) { c.moveTo(b[0] + b[2], b[1]); c.arc(b[0], b[1], b[2], 0, Math.PI * 2); });
  if (ink) { c.strokeStyle = ink; c.lineWidth = (lw || 1.6) * 2; c.stroke(); }
  c.fillStyle = fill; c.fill();
}
/* a cream plaque with a name on it, as on the buildings */
export function plaque(c: Ctx, P: Palette, txt: string, x: number, y: number, maxW: number, size?: number) {
  size = size || 15;
  c.font = size + 'px "Lilita One", "Arial Rounded MT Bold", sans-serif';
  var tw = Math.min(maxW, c.measureText(txt).width + 14), hh = size + 3;
  rr(c, x - tw / 2, y - hh / 2, tw, hh, 3); fillStroke(c, '#fffdf6', P.ink, 1.5);
  c.fillStyle = '#1b1f2e'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, x, y + 0.5, tw - 8);
}
/* a cylinder seen from the front, for towers and the tomb */
export function cylinder(c: Ctx, P: Palette, x0: number, x1: number, top: number, bot: number, ry: number) {
  var cx = (x0 + x1) / 2, rx = (x1 - x0) / 2;
  c.beginPath(); c.moveTo(x0, top); c.lineTo(x0, bot); c.ellipse(cx, bot, rx, ry, 0, Math.PI, 0, true); c.lineTo(x1, top); c.closePath();
  var gr = c.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, P.stone2); gr.addColorStop(0.42, P.stone); gr.addColorStop(1, P.stone2);
  c.fillStyle = gr; c.fill(); c.strokeStyle = P.ink; c.lineWidth = 1.8; c.stroke();
  c.strokeStyle = P.stone2; c.lineWidth = 1;
  for (var y = top + 12; y < bot - 4; y += 10) { c.beginPath(); c.ellipse(cx, y, rx - 1, ry * 0.8, 0, 0.18, Math.PI - 0.18); c.stroke(); }
}
