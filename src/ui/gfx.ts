import { each } from './dom';

/* How rich the map is drawn (VISIONE.md, V1): Alta has the light and the life of Formia (the shadows that turn with
   the sun, the clouds passing, the wind in the trees, the sea that glitters, pigeons, butterflies, fireflies);
   Bassa is the map as it was, for a slow laptop. The choice is kept in lotte-tra-amici:grafica:v1 (never in the
   story's save) and set from the menu (Mappa). Nothing here changes a battle or a save: it is only what is drawn. */
export type Gfx = 'alta' | 'bassa';
export const GFX: { id: Gfx; label: string }[] = [{ id: 'alta', label: 'Alta' }, { id: 'bassa', label: 'Bassa' }];
const KEY = 'lotte-tra-amici:grafica:v1';

let now: Gfx = read();
function read(): Gfx {
  try { return localStorage.getItem(KEY) === 'bassa' ? 'bassa' : 'alta'; } catch (e) { return 'alta'; }
}
/** whether the light and the life of the map are drawn */
export function rich(): boolean { return now === 'alta'; }
export function gfx(): Gfx { return now; }
export function setGfx(v: Gfx) {
  now = v;
  try { localStorage.setItem(KEY, v); } catch (e) { /* a frame without storage: it lasts the session */ }
  each(document.querySelectorAll<HTMLButtonElement>('[data-gfx]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-gfx') === now)); });
}
/** the two buttons of the menu */
export function gfxChoice(): string {
  return '<div class="seg" role="group" aria-label="Grafica della mappa">' + GFX.map(function (g) {
    return '<button type="button" data-gfx="' + g.id + '" aria-pressed="' + (g.id === now) + '">' + g.label + '</button>';
  }).join('') + '</div>';
}
export function installGfxButtons() {
  document.addEventListener('click', function (e) {
    const el = e.target as Element | null, b = el && el.closest ? el.closest('button') : null, v = b ? b.getAttribute('data-gfx') : null;
    if (v === 'alta' || v === 'bassa') setGfx(v);
  });
}
