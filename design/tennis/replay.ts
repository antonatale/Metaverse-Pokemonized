import type { Rally } from './physics';

export function createReplayBuffer() {
  const frames: Rally[] = [];
  let played = false;
  function observe(rally: Rally, contact: boolean): void {
    played ||= contact;
    if (!contact && rally.tick % 2 !== 0 && rally.phase !== 'finished') return;
    frames.push(structuredClone(rally));
    // Keep up to two minutes of play, retaining the decisive exchange even in a marathon point.
    if (frames.length > 3660) frames.splice(0, 60);
  }
  function reset(): void {
    frames.length = 0;
    played = false;
  }
  return { observe, reset, get frames(): readonly Rally[] { return played ? frames : []; } };
}
