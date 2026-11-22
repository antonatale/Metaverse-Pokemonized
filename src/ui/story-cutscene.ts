import { cry, music, sfx } from '../audio';
import { CHARS, type FriendId } from '../data/characters';
import type { SpeciesId } from '../data/creatures';
import { sceneInfo, warmScene } from '../render/scenes';
import { heroText } from '../story/growth';
import { lock } from '../story/movement';
import { reduced, esc } from './dom';
import { root, refreshMusic } from './story-screen';

export type Tile = [number, number];
export interface Beat {
  line: string;
  who?: string;
  ms: number;
  art?: string;
  image?: string;
  draw?: (shot: HTMLElement) => void;
  motif?: string;
  sound?: string;
  creatureCall?: { sp: SpeciesId; gold?: boolean };
  color?: string;
  to?: Tile;
  actors?: FriendId[];
}

export let worldShot: { from: Tile; to: Tile; start: number; ms: number; actors: FriendId[]; entering: FriendId[] } | null = null;
let stop: (() => void) | null = null;
export const scenePlaying = () => stop !== null;

export function cancelScene() { stop?.(); }

export function playScene(id: string, origin: Tile, beats: Beat[], done: () => void, score?: string) {
  cancelScene();
  const panel = document.createElement('section');
  panel.className = 'story-film';
  panel.dataset.scene = id;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Scena della storia');
  panel.setAttribute('aria-modal', 'true');
  panel.innerHTML = '<div class="film-shot" aria-hidden="true"></div><p class="film-line" aria-live="polite"></p><button type="button" class="btn film-skip">Salta</button>';
  const shot = panel.querySelector<HTMLElement>('.film-shot')!;
  const subtitle = panel.querySelector<HTMLElement>('.film-line')!;
  const skip = panel.querySelector<HTMLButtonElement>('button')!;
  let index = 0, timer: ReturnType<typeof setTimeout>, from = origin, present: FriendId[] = [];
  beats.forEach(beat => { if (beat.art) warmScene(beat.art); });
  function clean() {
    clearTimeout(timer);
    window.removeEventListener('keydown', onKey, true);
    panel.remove();
    worldShot = null;
    stop = null;
    lock(false);
    root.classList.remove('filming');
    if (score) refreshMusic();
  }
  function finish() { clean(); done(); }
  function onKey(event: KeyboardEvent) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); finish(); }
  }
  function next() {
    const beat = beats[index++];
    if (!beat) { finish(); return; }
    const to = beat.to || from;
    const actors = beat.actors || [];
    worldShot = { from: reduced ? to : from, to, start: performance.now(), ms: beat.ms, actors, entering: actors.filter(id => !present.includes(id)) };
    if (!beat.art) present = actors;
    from = to;
    shot.dataset.motif = beat.motif || '';
    shot.classList.toggle('illustrated', !!beat.art);
    shot.style.setProperty('--echo', beat.color || '#ffe7a5');
    shot.style.backgroundImage = beat.art ? `url("${sceneInfo(beat.art).art}")` : '';
    shot.innerHTML = (beat.image || '') + '<i class="film-effect"></i>';
    beat.draw?.(shot);
    const speaker = CHARS[beat.who as FriendId]?.name || beat.who;
    subtitle.innerHTML = (speaker ? '<b>' + esc(speaker) + '</b>' : '') + esc(heroText(beat.line));
    if (beat.sound) sfx(beat.sound);
    if (beat.creatureCall) cry(beat.creatureCall.sp, 'entry', beat.creatureCall.gold);
    timer = setTimeout(next, beat.ms);
  }
  stop = clean;
  lock(true);
  root.classList.add('filming');
  root.append(panel);
  if (score) music(score, { fade: 0.5 });
  skip.addEventListener('click', finish);
  window.addEventListener('keydown', onKey, true);
  skip.focus({ preventScroll: true });
  next();
}
