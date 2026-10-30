import { st, save } from '../save/story-progress';

/* Things to do around Formia, in the places where Antonio and his friends actually go. Each one is offered by
   someone on the map (an Npc with `activity`), played by ui/activities.ts, and remembered in the save:
   how many times, and the best score. */
export interface Activity {
  id: string;
  name: string;
  where: string;
  /** what the button says when it is offered */
  verb: string;
  /** what the best score means, for the diary; none when it has no score */
  score?: (n: number) => string;
  /** a lower score is better (a time) */
  lower?: boolean;
}
const secs = (n: number) => Math.floor(n / 60) + ':' + ('0' + Math.round(n % 60)).slice(-2);
export const ACTIVITIES: Activity[] = [
  { id: 'volley', name: 'Beach volley con Valentin', where: 'Eclipse beach, Vindicio', verb: 'Gioca a beach volley', score: (n) => n + (n === 1 ? ' scambio' : ' scambi') },
  { id: 'windsurf', name: 'Lezione di windsurf con Nicola', where: 'Eclipse beach, Vindicio', verb: 'Prendi una lezione', score: (n) => n + ' m di planata' },
  { id: 'lettino', name: 'Un pomeriggio all\'Eclipse', where: 'Eclipse beach, Vindicio', verb: 'Prendi un lettino' },
  { id: 'corsa', name: 'Corsetta in pineta con Zendavid', where: 'Pineta di Vindicio', verb: 'Corri tra i pini', score: secs, lower: true },
  { id: 'padel', name: 'Padel con Andrea', where: 'Centro Bruno Zauli', verb: 'Gioca a padel', score: (n) => n + (n === 1 ? ' scambio' : ' scambi') },
  { id: 'quiz', name: 'Quiz su Formia da Morgana', where: 'Birreria Morgana, Mola', verb: 'Siediti al tavolo', score: (n) => n + ' risposte giuste su 5' },
  { id: 'gelato', name: 'Gelato da Lavezzi', where: 'Piazza Marconi, centro', verb: 'Prendi un gelato' }
];
export function activity(id: string): Activity { const a = ACTIVITIES.find((x) => x.id === id); if (!a) throw new Error('no activity ' + id); return a; }
export function timesDone(id: string): number { return (st.done && st.done[id]) || 0; }
export function bestOf(id: string): number | undefined { return st.best ? st.best[id] : undefined; }
/** remembers that it was done, with its score; true when the score is a new best */
export function record(id: string, score?: number): boolean {
  const a = activity(id);
  st.done = st.done || {}; st.best = st.best || {};
  st.done[id] = (st.done[id] || 0) + 1;
  let better = false;
  if (score != null) {
    const b = st.best[id];
    better = b == null || (a.lower ? score < b : score > b);
    if (better) st.best[id] = score;
  }
  save();
  return better;
}
