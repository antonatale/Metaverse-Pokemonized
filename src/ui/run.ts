import type { Npc } from '../data/maps/types';
import { st } from '../save/story-progress';
import { M, blocked, key } from '../story/maps';
import { run, beginRun, endRun } from '../story/run';
import { record, bestOf, timesDone } from '../story/activities';
import { hash } from '../render/canvas';
import { sfx } from '../audio';
import { say } from './story-screen';
import { $ } from './dom';

/* The run in the pineta with Zendavid: five flags among the pines, a minute to touch them all. */
const FLAGS = 5, LIMIT = 60_000;
const clock = (ms: number) => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + ('0' + (s % 60)).slice(-2); };

export function startRun(n: Npc) {
  const area = M.areas.find((a) => a.name === 'Pineta di Vindicio');
  if (!area) return;
  /* free tiles of the pineta, in an order that changes every run; flags at least 4 tiles apart */
  const k = timesDone('corsa'), cand: [number, number, number][] = [];
  for (let y = area.y; y < area.y + area.h; y++) for (let x = area.x; x < area.x + area.w; x++) {
    if (blocked(M, x, y) || M.at[key(x, y)] || M.cell(x, y).g === 'road') continue;
    cand.push([x, y, hash(x, y, 300 + k)]);
  }
  cand.sort((a, b) => a[2] - b[2]);
  const flags: [number, number][] = [];
  for (const [x, y] of cand) {
    if (flags.length >= FLAGS) break;
    if (Math.abs(x - st.x) + Math.abs(y - st.y) < 4) continue;
    if (flags.some((f) => Math.abs(f[0] - x) + Math.abs(f[1] - y) < 4)) continue;
    flags.push([x, y]);
  }
  const best = bestOf('corsa');
  say(['Cinque bandierine tra i pini, un minuto per toccarle tutte.' + (best != null ? ' Il tuo record è ' + clock(best * 1000) + '.' : ''), 'Pronti… via!'], n.name, null, function () {
    beginRun({ flags, got: flags.map(() => false), t0: performance.now(), limit: LIMIT, who: n.name || 'zendavid' });
    sfx('whoosh');
  });
}

let shown = '';
/** called every frame of the story map */
export function checkRun(now: number) {
  const hud = $('wrun');
  if (!run) { if (hud && !hud.hidden) { hud.hidden = true; shown = ''; } return; }
  if (st.map !== 'formia') { endRun(); return; }
  const r = run;
  r.flags.forEach(function (f, i) {
    if (!r.got[i] && f[0] === st.x && f[1] === st.y) { r.got[i] = true; sfx('pickup'); }
  });
  const got = r.got.filter(Boolean).length, left = r.limit - (now - r.t0);
  const text = 'Bandierine ' + got + '/' + r.flags.length + ' · ' + clock(left);
  if (hud && text !== shown) { hud.hidden = false; hud.textContent = text; shown = text; }
  if (got === r.flags.length) {
    const secs = Math.round((now - r.t0) / 100) / 10, better = record('corsa', secs);
    endRun();
    if (better) sfx('badge');
    say(['Tutte e cinque in ' + clock(secs * 1000) + '!' + (better ? ' Nuovo record.' : ''), secs < 30 ? 'Bau! Manco Mennea.' : 'Bau. Bella corsa, ora un po\' di musica e si respira.'], r.who);
  } else if (left <= 0) {
    endRun();
    record('corsa');   /* it counts as done, with no time */
    sfx('lost');
    say(['Tempo scaduto: ' + got + ' bandierine su ' + r.flags.length + '.', 'Ok. Respira. Riproviamo quando vuoi.'], r.who);
  }
}
/** leaving the map ends the run */
export function cancelRun() { endRun(); }
