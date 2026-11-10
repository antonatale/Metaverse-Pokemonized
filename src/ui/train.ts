import type { Gate } from '../data/gates';
import { reduced, esc } from './dom';
import { sfx } from '../audio';
import { firstHuman, nameOf } from '../story/growth';

/* The train across Italy (Antonio's wish): from Formia up the peninsula to Torino Porta Nuova or Milano Centrale, and
   back. Italy is drawn by hand from about forty real points of its coast; the train runs along the line through Roma,
   Firenze, Bologna (and Milano, on the way to Torino), and each city lights up as it passes. A key or a touch skips it. */
type LL = [number, number];
const X = (lon: number) => (lon - 6.3) * 26, Y = (lat: number) => (47.3 - lat) * 34;
const pt = (p: LL) => X(p[0]).toFixed(1) + ' ' + Y(p[1]).toFixed(1);
const path = (ps: LL[]) => 'M' + ps.map(pt).join('L') + 'Z';
const ITALY: LL[] = [[6.8, 45.9], [7.0, 45.2], [7.6, 44.1], [7.5, 43.8], [8.9, 44.4], [9.8, 44.1], [10.3, 43.7], [10.3, 43.5], [10.5, 42.9], [11.2, 42.4],
  [11.8, 42.1], [12.3, 41.7], [12.6, 41.45], [13.05, 41.23], [13.57, 41.21], [14.25, 40.83], [14.4, 40.6], [14.75, 40.65], [15.3, 40.0], [15.8, 39.5],
  [16.0, 38.9], [15.65, 38.1], [16.05, 37.93], [16.6, 38.4], [17.1, 39.08], [16.6, 39.7], [17.2, 40.47], [17.98, 40.05], [18.37, 39.8], [18.5, 40.15],
  [17.95, 40.64], [16.87, 41.13], [15.9, 41.6], [16.2, 41.9], [15.0, 42.0], [14.2, 42.47], [13.5, 43.62], [12.57, 44.06], [12.2, 44.4], [12.5, 44.95],
  [12.33, 45.44], [13.77, 45.65], [13.5, 46.0], [12.5, 46.7], [11.0, 46.9], [10.5, 46.5], [9.0, 46.4], [8.7, 46.1], [8.0, 46.3]];
const SICILY: LL[] = [[12.4, 37.8], [13.3, 38.1], [15.6, 38.25], [15.1, 37.5], [15.1, 36.7], [14.3, 37.0], [12.6, 37.6]];
const SARDINIA: LL[] = [[8.4, 41.0], [9.6, 41.1], [9.8, 40.5], [9.6, 39.2], [9.0, 39.0], [8.4, 39.1], [8.5, 40.4]];
const CITY: Record<string, LL> = { Formia: [13.61, 41.26], Roma: [12.5, 41.9], Firenze: [11.25, 43.77], Bologna: [11.34, 44.49], Milano: [9.19, 45.48], Torino: [7.68, 45.07] };
const LINE: Record<string, string[]> = { torino: ['Formia', 'Roma', 'Firenze', 'Bologna', 'Milano', 'Torino'], milano: ['Formia', 'Roma', 'Firenze', 'Bologna', 'Milano'] };
const TRAIN = '<g transform="scale(1.5)"><rect x="-11" y="-6" width="22" height="11" rx="3" fill="#e5484d" stroke="#1c2340" stroke-width="1.6"/><rect x="-8" y="-4" width="5" height="4" rx="1" fill="#bfe3ff"/>' +
  '<rect x="-1" y="-4" width="5" height="4" rx="1" fill="#bfe3ff"/><path d="M11 -6Q16 -1 11 5" fill="#ffffff" stroke="#1c2340" stroke-width="1.4"/><circle cx="-5" cy="6" r="2" fill="#1c2340"/><circle cx="5" cy="6" r="2" fill="#1c2340"/></g>';

/** when (0..1 of the trip) the train is at a share of the way, under the ease-in-out it runs with (the cubic Bézier
    0.42 0 0.58 1): so each city lights up just as the train gets there */
function whenAt(share: number): number {
  let lo = 0, hi = 1;
  for (let n = 0; n < 30; n++) { const s = (lo + hi) / 2; if (3 * s * s - 2 * s * s * s < share) lo = s; else hi = s; }
  const s = (lo + hi) / 2;
  return 3 * (1 - s) * (1 - s) * s * 0.42 + 3 * (1 - s) * s * s * 0.58 + s * s * s;
}
/** the trip, then `done`; nothing to see with reduced motion */
export function trainTrip(g: Gate, done: () => void) {
  const to = g.to === 'formia' ? null : g.to, cities = to ? LINE[to] : LINE[g.city].slice().reverse();
  if (reduced) { done(); return; }
  const pts = cities.map((c) => [X(CITY[c][0]), Y(CITY[c][1])]);
  const el = document.createElement('div');
  el.className = 'train-trip';
  el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', g.label);
  el.innerHTML = '<div class="tt-box"><h2>' + esc(g.label) + '</h2><p class="tt-who">' + esc(nameOf(firstHuman()) + (to ? ' parte da Formia' : ' torna a casa')) + '</p><svg viewBox="0 0 330 370" aria-hidden="true">' +
    '<path d="' + path(ITALY) + '" class="tt-land"/><path d="' + path(SICILY) + '" class="tt-land"/><path d="' + path(SARDINIA) + '" class="tt-land"/>' +
    '<path d="M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + '" class="tt-line"/>' +
    '<path d="M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + '" class="tt-done" pathLength="1"/>' +
    cities.map((c, k) => '<g class="tt-city" data-k="' + k + '"><circle cx="' + pts[k][0].toFixed(1) + '" cy="' + pts[k][1].toFixed(1) + '" r="4"/><text x="' + (pts[k][0] + 7).toFixed(1) + '" y="' + (pts[k][1] + 4).toFixed(1) + '">' + c + '</text></g>').join('') +
    '<g class="tt-train">' + TRAIN + '</g></svg><p class="tt-to">' + esc(to ? 'Arrivo: ' + g.station : 'Si torna a Formia') + '</p><button class="btn" type="button">Salta</button></div>';
  document.body.appendChild(el);
  sfx('plane');
  /* the train along the line: each leg as long as its distance */
  const legs: number[] = [];
  for (let k = 1; k < pts.length; k++) legs.push(Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const total = legs.reduce((a, b) => a + b, 0), D = 1200 + total * 18, frames: Keyframe[] = [];
  let acc = 0;
  pts.forEach(function (p, k) {
    if (k) acc += legs[k - 1];
    const a = k < pts.length - 1 ? Math.atan2(pts[k + 1][1] - p[1], pts[k + 1][0] - p[0]) : Math.atan2(p[1] - pts[k - 1][1], p[0] - pts[k - 1][0]);
    const flip = Math.cos(a) < 0 ? ' scale(-1,1)' : '', deg = Math.cos(a) < 0 ? a * 180 / Math.PI + 180 : a * 180 / Math.PI;
    frames.push({ transform: 'translate(' + p[0].toFixed(1) + 'px,' + p[1].toFixed(1) + 'px) rotate(' + deg.toFixed(0) + 'deg)' + flip, offset: acc / total });
  });
  const train = el.querySelector('.tt-train') as SVGGElement, line = el.querySelector('.tt-done') as SVGPathElement;
  let over = false;
  const end = function () {
    if (over) return; over = true;
    document.removeEventListener('keydown', key, true);
    el.classList.add('out');
    setTimeout(function () { el.remove(); done(); }, 350);
  };
  const key = function (e: KeyboardEvent) { e.preventDefault(); e.stopImmediatePropagation(); end(); };
  document.addEventListener('keydown', key, true);
  el.querySelector('button')!.addEventListener('click', end);
  if (train.animate) {
    train.animate(frames, { duration: D, easing: 'ease-in-out', fill: 'both' });
    line.animate([{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], { duration: D, easing: 'ease-in-out', fill: 'both' });
  }
  /* each city lights up as the train gets there */
  acc = 0;
  pts.forEach(function (_p, k) {
    if (k) acc += legs[k - 1];
    setTimeout(function () { const c = el.querySelector('.tt-city[data-k="' + k + '"]'); if (c) c.classList.add('on'); if (k) sfx('click'); }, D * whenAt(acc / total));
  });
  setTimeout(end, D + 900);
}
