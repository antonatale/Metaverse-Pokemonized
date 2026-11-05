import { st } from '../save/story-progress';

/* The plot of the story: the seal of Telepilo. Cicero called Formia "the Telepilo of the Laestrygonians", the city
   of the giants of the Odyssey and of their king Lamo; the legend of the game says its gates were closed by a seal
   of three stones, the stones of Telepilo, hidden when the people left the old Formiae and two villages were born,
   Castellone up on the hill and Mola by the sea (in 1862 they took back the old name: Formia). Now the ghost of
   Lucius Mamurra, the richest man of Formiae, wants them, to wake Lamo and make Formia "the city of the Mamurras"
   again; his men dig for them. Antonio, with Cicero, finds them first: the stone of the walls at Castellone, the
   stone of the sea at Caposele, the stone of the voice at Cicero's tomb, and then faces Mamurra at his villa.
   The steps are stops of the tour (story/goals.ts); the people of the plot are on the map with `when`; what they
   say is in ui/plot.ts. Everything is remembered as flags: keys of st.seen, or st.beaten for the battles. */
export const MAMURRA = 'Mamurra';
/** a thing that has happened: a key of st.seen, or of st.beaten ('tr-…' for a trainer, a covo's id) */
export function flag(id: string): boolean { return !!(st.seen[id] || st.beaten[id]); }

/** what someone says now: the world notices what Antonio has done */
export function linesNow(n: { lines?: string[]; reacts?: { after: string; say: string[]; keep?: boolean }[] }): string[] {
  const r = (n.reacts || []).filter(function (x) { return flag(x.after); }).pop();
  return r ? (r.keep ? r.say.concat(n.lines || []) : r.say) : n.lines || [];
}
export interface Stone { id: string; name: string; where: string; text: string; color: string; mark: 'wall' | 'wave' | 'voice' }
export const STONES: Stone[] = [
  { id: 'pietra-mura', name: 'Pietra delle Mura', where: 'Castellone, nel Cisternone', color: '#b8ad94', mark: 'wall',
    text: 'Grigia e squadrata come un blocco delle mura poligonali. È tiepida, come se respirasse.' },
  { id: 'pietra-mare', name: 'Pietra del Mare', where: 'Caposele, tra le peschiere romane', color: '#5fb3c7', mark: 'wave',
    text: 'Verde e azzurra, fredda come il mare d\'inverno. Dentro si muove un\'onda.' },
  { id: 'pietra-voce', name: 'Pietra della Voce', where: 'La Tomba di Cicerone, sull\'Appia', color: '#f4f1ea', mark: 'voice',
    text: 'Bianca come il marmo. Se l\'avvicini all\'orecchio si sente una voce che parla latino.' }
];
export function stonesHeld(): number { return STONES.filter(function (s) { return st.seen[s.id]; }).length; }
/** how far the story has gone, 0 to 4: a stone each, and Mamurra beaten (the wild levels rise with it, data/encounters.ts) */
export function storyStage(): number { return stonesHeld() + (st.beaten['tr-mamurra'] ? 1 : 0); }
