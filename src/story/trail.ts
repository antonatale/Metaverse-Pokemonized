import { st } from '../save/story-progress';
import { MAPS } from '../data/maps';
import { BOTTLES } from '../data/maps/formia';
import { ITEMS } from '../data/items';
import { prepare, treasureAt } from './maps';
import { powerOf } from './growth';

/* What a beaten trainer gives besides the prize (24 November 2026, Antonio: «se li batti ti diano qualcosa o ti diano
   accesso a qualcosa»): a secret of Formia that people there know and the player does not yet, a thing lost by Antonio, a
   belvedere, a bottle adrift in the gulf, the amphora under the water of Gianola. The secret becomes a trail: its own star
   on the map and its own line in the corner, until it is found. Rules only: the story screen tells it and draws it. */
export interface Secret {
  id: string; x: number; y: number;
  /** what it is, for the corner */
  name: string;
  /** what the trainer says of it */
  hint: string;
  /** out at sea: a creature that swims is needed */
  sea?: boolean;
}
function cap(t: string): string { return t.charAt(0).toUpperCase() + t.slice(1); }
/** the secrets of Formia still to be found, all of them */
export function secrets(): Secret[] {
  const out: Secret[] = [], F = MAPS.formia;
  (F.items || []).forEach(function (it) {
    if (!st.found[it.id]) out.push({ id: 'item:' + it.id, x: it.x, y: it.y, name: cap(ITEMS[it.move].name), hint: 'In giro ho visto una cosa che sembrava di Antonio: ' + ITEMS[it.move].name + '.' });
  });
  (F.signs || []).forEach(function (s) {
    if (s.view && !st.seen['veduta-' + s.view.id]) out.push({ id: 'view:' + s.view.id, x: s.x, y: s.y, name: s.view.name, hint: 'C\'è un belvedere che conoscono in pochi: ' + s.view.name + '. Da lassù Formia si vede tutta.' });
  });
  BOTTLES.forEach(function (b) {
    if (!st.seen[b.id]) out.push({ id: 'bottle:' + b.id, x: b.x, y: b.y, name: 'Una bottiglia nel golfo', hint: 'Al largo galleggia una bottiglia con un messaggio dentro. Ci vuole una creatura che nuota.', sea: true });
  });
  if (!st.seen.anfora) {
    const t = treasureAt(prepare('formia'));
    if (t) out.push({ id: 'anfora', x: t[0], y: t[1], name: 'L\'anfora di Gianola', hint: 'Sott\'acqua, nelle vasche romane del porticciolo di Gianola, c\'è un\'anfora intera. Ci vuole una creatura che nuota.', sea: true });
  }
  return out;
}
/** the secret being followed, if it is still there to be found (one found is dropped). Asked every frame: it looks only
    at that secret, and keeps the place of the amphora once found */
var known: { id: string; s: Secret } | null = null;
export function trail(): Secret | null {
  if (!st.trail) return null;
  const id = st.trail.id;
  if (!known || known.id !== id) { const s = secrets().filter(function (q) { return q.id === id; })[0]; known = s ? { id: id, s: s } : null; }
  if (!known || done(id)) { delete st.trail; known = null; return null; }
  return known.s;
}
/** whether a secret has been found since */
function done(id: string): boolean {
  if (id.indexOf('item:') === 0) return !!st.found[id.slice(5)];
  if (id.indexOf('view:') === 0) return !!st.seen['veduta-' + id.slice(5)];
  if (id.indexOf('bottle:') === 0) return !!st.seen[id.slice(7)];
  return id === 'anfora' && !!st.seen.anfora;
}
/** a new secret to follow, told near (x, y): the nearest one, on land unless the team has a swimmer. Null: none left */
export function newTrail(x: number, y: number, by?: string): Secret | null {
  const swim = !!powerOf('nuoto'), cur = st.trail ? st.trail.id : '';
  const list = secrets().filter(function (s) { return s.id !== cur && (swim || !s.sea); });
  if (!list.length) return null;
  list.sort(function (a, b) { return Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y); });
  st.trail = { id: list[0].id, by: by };
  return list[0];
}
