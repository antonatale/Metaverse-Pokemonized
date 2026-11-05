import { st, save } from '../save/story-progress';
import { gainXp, earn, firstHuman, joinFriend, type Growth } from './growth';
import { JOIN } from '../data/people';
import type { FriendId } from '../data/characters';
import { friendsPay } from '../data/growth';

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
const grams = (n: number) => n >= 1000 ? (n / 1000).toFixed(2).replace('.', ',') + ' kg' : n + ' g';
export const ACTIVITIES: Activity[] = [
  { id: 'volley', name: 'Beach volley con Valentin', where: 'Eclipse beach, Vindicio', verb: 'Gioca a beach volley', score: (n) => n + (n === 1 ? ' scambio' : ' scambi') },
  { id: 'windsurf', name: 'Lezione di windsurf con Nicola', where: 'Eclipse beach, Vindicio', verb: 'Prendi una lezione', score: (n) => n + ' m di planata' },
  { id: 'lettino', name: 'Un pomeriggio all\'Eclipse', where: 'Eclipse beach, Vindicio', verb: 'Prendi un lettino' },
  { id: 'corsa', name: 'Corsetta in pineta con Zendavid', where: 'Pineta di Vindicio', verb: 'Corri tra i pini', score: secs, lower: true },
  { id: 'padel', name: 'Padel con Andrea', where: 'Centro Bruno Zauli', verb: 'Gioca a padel', score: (n) => n + (n === 1 ? ' scambio' : ' scambi') },
  { id: 'quiz', name: 'Quiz su Formia da Morgana', where: 'Birreria Morgana, Mola', verb: 'Siediti al tavolo', score: (n) => n + ' risposte giuste su 5' },
  { id: 'gelato', name: 'Gelato da Lavezzi', where: 'Piazza Marconi, centro', verb: 'Prendi un gelato' },
  { id: 'pesca', name: 'Pesca dal molo', where: 'Porto di Formia, Mola', verb: 'Pesca dal molo', score: grams },
  { id: 'torneo', name: 'Torneo degli amici', where: 'Centro Bruno Zauli', verb: 'Iscriviti!', score: (n) => n + (n === 1 ? ' incontro vinto' : ' incontri vinti') }
];
export function activity(id: string): Activity { const a = ACTIVITIES.find((x) => x.id === id); if (!a) throw new Error('no activity ' + id); return a; }
export function timesDone(id: string): number { return (st.done && st.done[id]) || 0; }
export function bestOf(id: string): number | undefined { return st.best ? st.best[id] : undefined; }
/** what each thing to do brings: experience for Antonio, and a few sesterzi for a good score */
const XP = 20;
const PAY: Record<string, (score: number) => number> = {
  volley: (n) => Math.min(10, n), padel: (n) => Math.min(10, n), quiz: (n) => 2 * n, windsurf: (n) => Math.min(12, Math.floor(n / 20)), corsa: () => 4,
  /* the fisherman buys the catch: a sesterzio every 300 g */
  pesca: (g) => Math.min(12, Math.floor(g / 300))
};
/** the story screen shows what an activity brought (set by ui/story-screen.ts) */
let rewardHook: ((g: Growth, money: number, joined: FriendId | null) => void) | null = null;
export function onReward(f: (g: Growth, money: number, joined: FriendId | null) => void) { rewardHook = f; }
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
  const g = gainXp(firstHuman(), XP), cash = PAY[id] && score != null ? friendsPay(PAY[id](score), st.skills || {}) : 0;
  if (cash) earn(cash);
  /* the friend who has done this with Antonio comes along from now on */
  const joins = (Object.keys(JOIN) as (keyof typeof JOIN)[]).filter(function (f) { return JOIN[f].activity === id; })[0];
  const joined = joins && joinFriend(joins, JOIN[joins].lv) ? joins : null;
  save();
  if (rewardHook) rewardHook(g, cash, joined);
  return better;
}
