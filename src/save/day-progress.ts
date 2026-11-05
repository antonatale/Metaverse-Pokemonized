import type { DayRun } from '../day/plan';

/* «Un giorno a Formia» has its own key, like the libretto: it has nothing to do with the story, and a run must not touch
   a story save. localStorage may be missing or throw in the frame of an Artifact. */
const KEY = 'lotte-tra-amici:giorno:v1';
/** how a day's challenge went: it is played once, and the line stays there to pass on */
export interface DayDone { floors: number; score: number; line: string }
export interface DaySave {
  /** the run being played, if any */
  run: DayRun | null;
  /** the days already played, by date */
  days: Record<string, DayDone>;
  /** the best score ever, of any run */
  best: number;
}
function load(): DaySave {
  try {
    var v = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (v && v.days) return { run: v.run || null, days: v.days, best: v.best || 0 };
  } catch (e) { /* no storage in this frame, or a broken value: a fresh start */ }
  return { run: null, days: {}, best: 0 };
}
export const daySave: DaySave = load();
export function saveDay() { try { localStorage.setItem(KEY, JSON.stringify(daySave)); } catch (e) { /* it lasts until the page is closed */ } }
