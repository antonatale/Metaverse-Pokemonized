import type { Stats } from './characters';

/* Growing up in the story. Every fighter (Antonio, the friends who join him, his creatures) has a level, and
   the experience toward the next one; Antonio also gets a point a level for his abilities. The characters' own
   numbers are their numbers at level 5, the level the story starts at, so a battle between two level-5 fighters
   is the same battle as in the free mode. */
export const START_LEVEL = 5, MAX_LEVEL = 50;
/** experience to go from a level to the next */
export function toNext(lv: number): number { return 10 * lv + 20; }
/** a fighter's numbers at a level: Attack, Defence and Speed +2.5% a level, health +1% */
export function atLevel(base: Stats, lv: number): Stats {
  const k = 1 + (lv - START_LEVEL) * 0.025, h = 1 + (lv - START_LEVEL) * 0.01;
  return { hp: Math.round(base.hp * h), atk: Math.round(base.atk * k), def: Math.round(base.def * k), spe: Math.round(base.spe * k) };
}
/** experience for a battle against a foe of that level: half of it when the battle is lost */
export function xpFor(foeLv: number, won: boolean, covo: boolean): number {
  const x = (14 + 6 * foeLv) * (covo ? 1.5 : 1);
  return Math.round(won ? x : x / 3);
}
/** euro for beating a wild creature, and a covo the first time */
export function moneyFor(foeLv: number, covo: boolean): number { return covo ? 80 : 3 + foeLv; }

/* ---------- Antonio's abilities: a point every level, up to the ranks of each ---------- */
/* Not numbers going up: powers that change how the story plays. Three ways of being Antonio: the explorer of Formia
   (fewer meetings in the grass, rarer creatures, a quicker step), the trainer (creatures that grow faster, surer
   nets, creatures that hold on for him), the man of Formia (who fights for himself when the creatures are down,
   his memory, his AI, his friends in every shop). The story asks for them where they act (story/growth.ts, the
   story screen, the battle's side options). */
export type SkillId = 'passo' | 'fortuna' | 'svelto' | 'allenatore' | 'mano' | 'legame' | 'ultima' | 'memoria' | 'prompt' | 'amici';
export type Branch = 'Esploratore' | 'Allenatore' | 'Formiano';
export interface Skill { id: SkillId; branch: Branch; name: string; text: string; max: number }
export const SKILLS: Skill[] = [
  { id: 'passo', branch: 'Esploratore', name: 'Passo felpato', text: 'Nell\'erba alta e tra gli scogli le creature ti sentono meno: un terzo di incontri in meno a grado.', max: 2 },
  { id: 'fortuna', branch: 'Esploratore', name: 'Occhio da pescatore', text: 'Le creature rare saltano fuori più spesso, e quelle dorate il doppio a ogni grado.', max: 2 },
  { id: 'svelto', branch: 'Esploratore', name: 'Gambe da Mennea', text: 'Le ripetute sulla pista del Bruno Zauli: cammini più svelto per Formia.', max: 2 },
  { id: 'allenatore', branch: 'Allenatore', name: 'Allenatore', text: 'Le tue creature guadagnano il 15% di esperienza in più a ogni grado.', max: 3 },
  { id: 'mano', branch: 'Allenatore', name: 'Mano ferma', text: 'Lanci meglio il retino: le catture riescono il 20% più spesso a ogni grado.', max: 2 },
  { id: 'legame', branch: 'Allenatore', name: 'Legame', text: 'Le tue creature non vogliono deluderti: una volta a lotta, un colpo che le manderebbe KO può lasciarle a 1 PS (15% a grado).', max: 3 },
  { id: 'ultima', branch: 'Formiano', name: 'Ultima difesa', text: 'Quando le tue creature sono KO e scendi in campo tu: Attacco e Difesa +15% a grado.', max: 2 },
  { id: 'memoria', branch: 'Formiano', name: 'Memoria di ferro', text: 'Nelle lotte perdi meno le cose: dal 15% a turno all\'11%, al 7%, al 3%.', max: 3 },
  { id: 'prompt', branch: 'Formiano', name: 'Prompt engineer', text: 'L\'IA ti suggerisce idee più spesso: dal 25% a turno al 30%, al 35%, al 40%.', max: 3 },
  { id: 'amici', branch: 'Formiano', name: 'Amico di tutti', text: 'Formia ti conosce: nei negozi paghi il 10% in meno e le attività rendono il 25% in più, a ogni grado.', max: 2 }
];
type Grades = Partial<Record<SkillId, number>>;
/** Antonio's numbers when he steps in for his creatures, with his last stand */
export function lastStand(s: Stats, sk: Grades): Stats {
  const k = 1 + 0.15 * (sk.ultima || 0);
  return { hp: s.hp, atk: Math.round(s.atk * k), def: Math.round(s.def * k), spe: s.spe };
}
/** his chances a turn to lose a thing, and to get an idea from the AI */
export function perksFor(sk: Grades): { lose: number; idea: number } {
  return { lose: Math.max(0, 0.15 - 0.04 * (sk.memoria || 0)), idea: 0.25 + 0.05 * (sk.prompt || 0) };
}
/** the chance a step in a hiding place meets a creature, out of 1 */
export function meetChance(rate: number, sk: Grades): number { return (1 - (sk.passo || 0) / 3) / rate; }
/** how much more often the rare creatures (weight 1) and the golden ones come out */
export function luck(sk: Grades): { rare: number; gold: number } { return { rare: 1 + (sk.fortuna || 0), gold: Math.pow(2, sk.fortuna || 0) }; }
/** a step on the map, in ms */
export function stepTime(sk: Grades): number { return 165 - 20 * (sk.svelto || 0); }
/** experience for a creature, with the trainer */
export function trainerXp(xp: number, sk: Grades): number { return Math.round(xp * (1 + 0.15 * (sk.allenatore || 0))); }
/** the nets thrown by a steady hand */
export function netHand(sk: Grades): number { return 1 + 0.2 * (sk.mano || 0); }
/** the chance a creature holds on at 1 HP, once a battle */
export function bond(sk: Grades): number { return 0.15 * (sk.legame || 0); }
/** euro from an activity, with friends everywhere */
export function friendsPay(n: number, sk: Grades): number { return Math.round(n * (1 + 0.25 * (sk.amici || 0))); }

/* ---------- things to buy around Formia, and what they do ---------- */
export type ItemId = 'retino' | 'retino2' | 'tiella' | 'caffe';
export interface Ware { id: ItemId; name: string; price: number; text: string }
export const WARES: Record<ItemId, Ware> = {
  retino: { id: 'retino', name: 'Retino', price: 8, text: 'Per catturare una creatura selvatica: più è stanca, più è facile.' },
  retino2: { id: 'retino2', name: 'Retino da pesca', price: 20, text: 'Il retino dei pescatori di Mola: cattura molto più facilmente.' },
  tiella: { id: 'tiella', name: 'Tiella', price: 6, text: 'In lotta: una fetta di tiella fa recuperare 40 PS (e si usa il turno).' },
  caffe: { id: 'caffe', name: 'Caffè al bancone', price: 3, text: 'Si beve subito, al bancone: 60 punti esperienza a chi scegli tu.' }
};
/** the shops: who sells what */
export interface Shop { name: string; hello: string; sells: ItemId[] }
export const SHOPS: Record<string, Shop> = {
  pesca: { name: 'Reti e retini', hello: 'Reti da pesca, retini, ami: a Mola si pesca da sempre.', sells: ['retino', 'retino2'] },
  forno: { name: 'Il forno di Castellone', hello: 'Tiella di polpo o di scarola: appena sfornata.', sells: ['tiella'] },
  bar: { name: 'Il bar di Mola', hello: 'Un caffè? Qui lo facciamo come si deve.', sells: ['caffe'] }
};
/** the price with Antonio's bargaining */
export function priceOf(it: ItemId, sk: Grades): number { return Math.max(1, Math.round(WARES[it].price * (1 - 0.1 * (sk.amici || 0)))); }

/* ---------- the character of a creature: every one has its own ---------- */
export interface Nature { name: string; up?: keyof Stats; down?: keyof Stats; text: string }
export const NATURES: Record<string, Nature> = {
  coraggioso: { name: 'Coraggioso', up: 'atk', down: 'def', text: 'si butta nella mischia' },
  prudente: { name: 'Prudente', up: 'def', down: 'atk', text: 'para prima di colpire' },
  svelto: { name: 'Svelto', up: 'spe', down: 'def', text: 'non sta mai fermo' },
  robusto: { name: 'Robusto', up: 'hp', down: 'spe', text: 'regge tutto, con calma' },
  furbo: { name: 'Furbo', up: 'spe', down: 'hp', text: 'sa sempre dove scappare' },
  sereno: { name: 'Sereno', text: 'prende la vita come viene' }
};
const STAT_NAME: Record<keyof Stats, string> = { hp: 'PS', atk: 'Attacco', def: 'Difesa', spe: 'Velocità' };
/** a creature's numbers with its character: +10% in one, −10% in another */
export function withNature(s: Stats, nat?: string): Stats {
  var n = nat ? NATURES[nat] : null, out = { hp: s.hp, atk: s.atk, def: s.def, spe: s.spe };
  if (n && n.up) out[n.up] = Math.round(out[n.up] * 1.1);
  if (n && n.down) out[n.down] = Math.round(out[n.down] * 0.9);
  return out;
}
/** the character in words: "Coraggioso (+Attacco, −Difesa): si butta nella mischia" */
export function natureText(nat?: string): string {
  var n = nat ? NATURES[nat] : null;
  if (!n) return '';
  return n.name + (n.up ? ' (+' + STAT_NAME[n.up] + ', −' + STAT_NAME[n.down!] + ')' : '') + ': ' + n.text;
}
/** what a level brings, in words: "PS +1, Attacco +3, Difesa +2, Velocità +2" */
export function statGain(a: Stats, b: Stats): string {
  return (['hp', 'atk', 'def', 'spe'] as (keyof Stats)[]).map(function (k) { return STAT_NAME[k] + ' +' + (b[k] - a[k]); }).join(', ');
}
