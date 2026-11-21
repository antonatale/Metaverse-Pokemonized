/* What is going on at sea (data/sea.ts): the race being sailed, its marks and the time; the missions at sea, in the
   save as flags of st.seen ('sj-<id>' started, 'sj-<id>-<k>' a thing found, 'ms-sea-<id>' done); the swimmer adrift.
   Only the state and its arithmetic: ui/sea.ts plays it, render/world-view.ts draws the marks. */
import { st } from '../save/story-progress';
import { SEA_JOBS, type SeaJob } from '../data/sea';

/** a race: its marks, how many are rounded, the seconds sailed (the clock stops while someone talks) */
export interface Race { id: string; marks: [number, number][]; got: number; t: number; last: number; rival: boolean; par: number }
/** something to draw at sea: a mark of the race (the next one picked out), a thing a mission asks for, the swimmer */
export interface SeaMark { x: number; y: number; kind: 'mark' | 'next' | 'gavitello' | 'boa' | 'tavola' | 'ragazzo'; n?: number }
export const sea: { race: Race | null; kid: { x: number; y: number; t: number; last: number; limit: number; next: number } | null; marks: SeaMark[] } = { race: null, kid: null, marks: [] };

export function jobFlag(j: SeaJob) { return 'sj-' + j.id; }
export function jobDone(j: SeaJob) { return !!st.seen['ms-sea-' + j.id]; }
export function jobStarted(j: SeaJob) { return !!st.seen[jobFlag(j)]; }
export function thingFound(j: SeaJob, k: number) { return !!st.seen[jobFlag(j) + '-' + k]; }
export function foundCount(j: SeaJob) { var n = 0; for (var k = 0; k < j.things.length; k++) if (thingFound(j, k)) n++; return n; }
export function jobOf(npc: string): SeaJob | null { return SEA_JOBS.filter(function (j) { return j.npc === npc && !jobDone(j) && (!j.after || !!st.seen[j.after]); })[0] || null; }
/** the missions at sea started and not yet done */
export function openJobs(): SeaJob[] { return SEA_JOBS.filter(function (j) { return jobStarted(j) && !jobDone(j); }); }
