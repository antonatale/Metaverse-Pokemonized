import type { PlaceDef, Thing } from '../../data/maps/types';
import { beatOn, gateShut } from '../../story/place';
import { T, circle, fillStroke, type Ctx } from './draw';
import type { Palette } from './palette';

/* What lies on the floor of a place with a puzzle (data/maps/types.ts). The solution is seen, not guessed: a plate and the
   gates it opens have the same colour, a current shows where it goes, a floor that is about to flood says so one step
   ahead. It changes with the steps, so it is drawn each frame over the ground, under the people. */

/** the colour of a flag: the same on its plate and on its gates, by the order they come in (read once for each theme) */
const HUES = ['--m-rune-a', '--m-rune-b', '--m-rune-c', '--m-rune-d'];
let huesOf: Palette | null = null, hues: string[] = [];
function hueOf(P: Palette, p: PlaceDef, flag: string): string {
  if (huesOf !== P) {
    const css = getComputedStyle(document.documentElement);
    hues = HUES.map(function (h) { return css.getPropertyValue(h).trim(); }); huesOf = P;
  }
  const flags: string[] = [];
  p.things.forEach(function (t) { if ((t.k === 'plate' || t.k === 'gate') && flags.indexOf(t.flag) < 0) flags.push(t.flag); });
  return hues[flags.indexOf(flag) % hues.length];
}
function plate(c: Ctx, P: Palette, X: number, Y: number, hue: string, on: boolean) {
  circle(c, X + T / 2, Y + T / 2, 11); fillStroke(c, on ? hue : P.stone2, P.ink, 2);
  circle(c, X + T / 2, Y + T / 2, 5.5); fillStroke(c, hue, P.ink, 1.4);
}
function gate(c: Ctx, P: Palette, X: number, Y: number, hue: string, shut: boolean) {
  if (!shut) {
    /* open: only the frame on the floor, so that it is clear where it stood */
    c.globalAlpha = 0.55; c.strokeStyle = hue; c.lineWidth = 2; c.strokeRect(X + 3, Y + 3, T - 6, T - 6); c.globalAlpha = 1;
    return;
  }
  c.fillStyle = P.ink; c.fillRect(X + 2, Y + 3, T - 4, T - 6);
  c.fillStyle = hue;
  for (let k = 0; k < 4; k++) c.fillRect(X + 5 + k * 6.4, Y + 5, 3, T - 10);
  c.fillRect(X + 3, Y + T / 2 - 1.5, T - 6, 3);
}
const ANGLE = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
function slide(c: Ctx, P: Palette, X: number, Y: number, dir: keyof typeof ANGLE, now: number, reduced: boolean) {
  c.save(); c.translate(X + T / 2, Y + T / 2); c.rotate(ANGLE[dir]);
  const off = reduced ? 0 : (now / 90) % 12;
  c.strokeStyle = P.foam; c.lineWidth = 2.4; c.lineCap = 'round'; c.lineJoin = 'round'; c.globalAlpha = 0.9;
  for (let k = 0; k < 3; k++) {
    const x = -14 + k * 12 + off - (off + k * 12 > 24 ? 24 : 0);
    c.beginPath(); c.moveTo(x - 4, -6); c.lineTo(x + 2, 0); c.lineTo(x - 4, 6); c.stroke();
  }
  c.restore(); c.globalAlpha = 1;
}
function pad(c: Ctx, P: Palette, X: number, Y: number, now: number, reduced: boolean) {
  const r = 11 + (reduced ? 0 : Math.sin(now / 300) * 1.5);
  circle(c, X + T / 2, Y + T / 2, r); fillStroke(c, P.sea2, P.ink, 2);
  circle(c, X + T / 2, Y + T / 2, r * 0.5); fillStroke(c, P.foam, null);
}
/** water that rises on some steps: already up, it shows what the next step is going to find */
function beat(c: Ctx, P: Palette, X: number, Y: number, danger: boolean) {
  c.globalAlpha = danger ? 0.85 : 0.25; c.fillStyle = danger ? P.sea2 : P.sea; c.fillRect(X + 1, Y + 1, T - 2, T - 2); c.globalAlpha = 1;
  if (danger) { c.strokeStyle = P.foam; c.lineWidth = 2; c.strokeRect(X + 3, Y + 3, T - 6, T - 6); }
}
/** a boulder about to land: the shadow on the floor grows, and it shows the next step's danger like the water does */
function boulder(c: Ctx, P: Palette, X: number, Y: number, danger: boolean) {
  c.globalAlpha = danger ? 0.5 : 0.14; c.fillStyle = P.ink; c.beginPath(); c.ellipse(X + T / 2, Y + T / 2 + 4, danger ? 13 : 8, danger ? 9 : 5, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  if (!danger) return;
  c.beginPath(); c.moveTo(X + 7, Y + 17); c.lineTo(X + 10, Y + 7); c.lineTo(X + 20, Y + 4); c.lineTo(X + 26, Y + 12); c.lineTo(X + 23, Y + 20); c.lineTo(X + 13, Y + 22); c.closePath();
  fillStroke(c, P.rock, P.ink, 2);
  c.strokeStyle = P.ink; c.lineWidth = 1.4; c.beginPath(); c.moveTo(X + 13, Y + 10); c.lineTo(X + 18, Y + 14); c.lineTo(X + 16, Y + 19); c.stroke();
}
/** the Iele of the Carpathians dancing in the green mist (Valentin's tower): a swirl, and when they are about to pass, a
    pale dancer in a ring of mist */
function iele(c: Ctx, P: Palette, X: number, Y: number, danger: boolean) {
  c.globalAlpha = danger ? 0.75 : 0.22; c.fillStyle = '#7dff9e'; c.beginPath(); c.ellipse(X + T / 2, Y + T / 2 + 3, 13, 9, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
  c.strokeStyle = danger ? '#e9fff0' : '#3fbf6a'; c.lineWidth = 1.6; c.beginPath(); c.arc(X + T / 2, Y + T / 2 + 3, 8, 0.4, 5.2); c.stroke();
  if (!danger) return;
  c.fillStyle = '#f4fff6'; c.strokeStyle = P.ink; c.lineWidth = 1.3;
  c.beginPath(); c.moveTo(X + 16, Y + 6); c.quadraticCurveTo(X + 25, Y + 18, X + 23, Y + 25); c.lineTo(X + 9, Y + 25); c.quadraticCurveTo(X + 7, Y + 18, X + 16, Y + 6); c.closePath(); c.fill(); c.stroke();
  circle(c, X + 16, Y + 6, 3.4); c.fill(); c.stroke();
}
function rest(c: Ctx, P: Palette, X: number, Y: number) {
  c.fillStyle = P.lamp; c.beginPath(); c.moveTo(X + T / 2, Y + 7); c.quadraticCurveTo(X + 23, Y + 18, X + T / 2, Y + 24); c.quadraticCurveTo(X + 9, Y + 18, X + T / 2, Y + 7); c.fill();
  c.strokeStyle = P.ink; c.lineWidth = 1.6; c.stroke();
}
function mark(c: Ctx, P: Palette, X: number, Y: number) {
  circle(c, X + T / 2, Y + T / 2, 8); fillStroke(c, P.stone2, P.ink, 1.6);
  c.strokeStyle = P.ink; c.lineWidth = 2; c.beginPath(); c.arc(X + T / 2, Y + T / 2, 3.6, 0.6, 5.4); c.stroke();
}
export function drawThings(c: Ctx, P: Palette, p: PlaceDef, flags: Record<string, boolean>, tick: number, now: number, reduced: boolean, view: { x0: number; x1: number; y0: number; y1: number }) {
  p.things.forEach(function (t: Thing) {
    if (t.x < view.x0 || t.x > view.x1 || t.y < view.y0 || t.y > view.y1) return;
    const X = t.x * T, Y = t.y * T;
    if (t.k === 'plate') plate(c, P, X, Y, hueOf(P, p, t.flag), !!flags[t.flag]);
    else if (t.k === 'gate') gate(c, P, X, Y, hueOf(P, p, t.flag), gateShut(t, flags));
    else if (t.k === 'slide') slide(c, P, X, Y, t.dir, now, reduced);
    else if (t.k === 'pad') pad(c, P, X, Y, now, reduced);
    else if (t.k === 'beat') (t.look === 'rock' ? boulder : t.look === 'mist' ? iele : beat)(c, P, X, Y, beatOn(t, tick + 1));
    else if (t.k === 'rest') rest(c, P, X, Y);
    else mark(c, P, X, Y);
  });
}
