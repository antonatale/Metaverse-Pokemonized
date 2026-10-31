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
export type SkillId = 'forza' | 'scorza' | 'scatto' | 'memoria' | 'prompt' | 'affari';
export interface Skill { id: SkillId; name: string; text: string; max: number }
export const SKILLS: Skill[] = [
  { id: 'forza', name: 'Muscoli', text: 'Palestra al Bruno Zauli: +6% di Attacco a ogni grado.', max: 3 },
  { id: 'scorza', name: 'Pelle dura', text: '+6% di Difesa e +5% di PS a ogni grado.', max: 3 },
  { id: 'scatto', name: 'Scatto', text: 'Le ripetute sulla pista di Mennea: +6% di Velocità a ogni grado.', max: 3 },
  { id: 'memoria', name: 'Memoria di ferro', text: 'Perde meno le cose: dal 15% a turno all\'11%, al 7%, al 3%.', max: 3 },
  { id: 'prompt', name: 'Prompt engineer', text: 'L\'IA gli suggerisce idee più spesso: dal 25% a turno al 30%, al 35%, al 40%.', max: 3 },
  { id: 'affari', name: 'Contrattare', text: 'Nei negozi di Formia paga il 10% in meno a ogni grado.', max: 2 }
];
/** Antonio's numbers with his abilities */
export function withSkills(s: Stats, sk: Partial<Record<SkillId, number>>): Stats {
  const r = (k: SkillId) => sk[k] || 0;
  return { hp: Math.round(s.hp * (1 + 0.05 * r('scorza'))), atk: Math.round(s.atk * (1 + 0.06 * r('forza'))), def: Math.round(s.def * (1 + 0.06 * r('scorza'))), spe: Math.round(s.spe * (1 + 0.06 * r('scatto'))) };
}
/** his chances a turn to lose a thing, and to get an idea from the AI */
export function perksFor(sk: Partial<Record<SkillId, number>>): { lose: number; idea: number } {
  return { lose: Math.max(0, 0.15 - 0.04 * (sk.memoria || 0)), idea: 0.25 + 0.05 * (sk.prompt || 0) };
}

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
export function priceOf(it: ItemId, sk: Partial<Record<SkillId, number>>): number { return Math.max(1, Math.round(WARES[it].price * (1 - 0.1 * (sk.affari || 0)))); }
