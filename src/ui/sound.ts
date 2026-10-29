import { isOn, setOn, sfx, onReady } from '../audio';
import { ico } from './icons';
import { each } from './dom';

/* The sound switch, on the home page, in the battle's top bar and in the story's HUD,
   and the click every button makes. */

function inner() { return ico(isOn() ? 'sound' : 'mute'); }
function label() { return isOn() ? 'Audio acceso: tocca per spegnere' : 'Audio spento: tocca per accendere'; }
/** the switch's markup; cls places it on its screen */
export function soundButton(cls?: string): string {
  return '<button class="tb-btn snd' + (cls ? ' ' + cls : '') + '" type="button" aria-pressed="' + isOn() + '" aria-label="' + label() + '" title="' + label() + '">' + inner() + '</button>';
}
function refresh() {
  each(document.querySelectorAll<HTMLButtonElement>('.snd'), function (b) {
    if (b.getAttribute('aria-pressed') === String(isOn())) return;
    b.innerHTML = inner(); b.setAttribute('aria-pressed', String(isOn()));
    b.setAttribute('aria-label', label()); b.title = label();
  });
}
export function installSoundButtons() {
  document.addEventListener('click', function (e) {
    const el = e.target as Element | null, b = el && el.closest ? el.closest('button') : null;
    if (!b) return;
    if (b.classList.contains('snd')) { setOn(!isOn()); refresh(); sfx('click'); return; }
    sfx('click');
  }, true);
  onReady(refresh);
}
