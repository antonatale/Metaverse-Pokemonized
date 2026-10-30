/* A run in the Pineta di Vindicio: flags to touch before the time runs out. Only state here;
   ui/run.ts starts and checks it, render/world-view.ts draws the flags. */
export interface Run { flags: [number, number][]; got: boolean[]; t0: number; limit: number; who: string }
export let run: Run | null = null;
export function beginRun(r: Run) { run = r; }
export function endRun() { run = null; }
