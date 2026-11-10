import { each } from './dom';

/* How fast a battle goes: Normale, Veloce, Lampo. It changes the words, not the rules: how fast a line is typed and how
   long it stays before the next, and in Veloce and Lampo a move's charge (the dark, the magic circle) is shown in full
   only the first time in a battle. The choice is kept in lotte-tra-amici:velocita:v1 (never in the story's save), and
   set from the battle's top bar or the menu (Mappa). Holding Enter or Space goes on as fast as the keyboard repeats. */
export type Speed = 'normale' | 'veloce' | 'lampo';
export const SPEEDS: { id: Speed; label: string }[] = [
  { id: 'normale', label: 'Normale' }, { id: 'veloce', label: 'Veloce' }, { id: 'lampo', label: 'Lampo' }
];
const KEY = 'lotte-tra-amici:velocita:v1';

let now: Speed = read();
function read(): Speed {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'veloce' || v === 'lampo' ? v : 'normale';
  } catch (e) { return 'normale'; }
}
export function speed(): Speed { return now; }
export function setSpeed(v: Speed) {
  now = v;
  try { localStorage.setItem(KEY, v); } catch (e) { /* a frame without storage: it lasts the session */ }
  refresh();
}

/** how much of every wait and animation of a battle is played: the shows keep their shape, only shorter */
export function tempo(): number { return now === 'lampo' ? 0.3 : now === 'veloce' ? 0.4 : 1; }
/** a line in the battle: characters per step of the typing (0: all at once), and how long it stays once written */
export function linePace(len: number, quick: boolean): { chars: number; hold: number } {
  const hold = quick ? 320 : Math.min(2400, 750 + len * 18);
  if (now === 'lampo') return { chars: 0, hold: quick ? 120 : Math.max(250, Math.round(hold * 0.25)) };
  if (now === 'veloce') return { chars: 4, hold: quick ? 160 : Math.round(hold * 0.5) };
  return { chars: 2, hold: hold };
}
/** whether a move's charge is shown whole: always at Normale, the first time in the battle otherwise */
const shown: Record<string, true> = {};
export function fullCharge(id: string | undefined): boolean {
  if (now === 'normale' || !id) return true;
  if (shown[id]) return false;
  shown[id] = true;
  return true;
}
/** a new battle: every charge is new again */
export function newShows() { for (const k in shown) delete shown[k]; }

function name(v: Speed): string { return SPEEDS.filter(function (s) { return s.id === v; })[0].label; }
function next(v: Speed): Speed { const i = SPEEDS.map(function (s) { return s.id; }).indexOf(v); return SPEEDS[(i + 1) % SPEEDS.length].id; }
/** the button of the battle's top bar: says the speed, a tap goes to the next */
export function speedButton(): string {
  return '<button class="tb-btn spd" type="button" title="Velocità della lotta: tocca per cambiarla" aria-label="Velocità della lotta: ' + name(now) + '">' + name(now) + '</button>';
}
/** the three buttons of the menu */
export function speedChoice(): string {
  return '<div class="seg seg3" role="group" aria-label="Velocità delle lotte">' + SPEEDS.map(function (s) {
    return '<button type="button" data-vel="' + s.id + '" aria-pressed="' + (s.id === now) + '">' + s.label + '</button>';
  }).join('') + '</div>';
}
function refresh() {
  each(document.querySelectorAll<HTMLButtonElement>('.spd'), function (b) { b.textContent = name(now); b.setAttribute('aria-label', 'Velocità della lotta: ' + name(now)); });
  each(document.querySelectorAll<HTMLButtonElement>('[data-vel]'), function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-vel') === now)); });
}
export function installSpeedButtons() {
  document.addEventListener('click', function (e) {
    const el = e.target as Element | null, b = el && el.closest ? el.closest('button') : null;
    if (!b) return;
    if (b.classList.contains('spd')) { setSpeed(next(now)); return; }
    const v = b.getAttribute('data-vel');
    if (v === 'normale' || v === 'veloce' || v === 'lampo') setSpeed(v);
  });
}
