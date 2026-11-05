import type { Member, NewBattle } from '../battle/types';
import { DAY_ABILITIES, DAY_FLOORS, DAY_TUNE, type DayFloor } from '../data/day';
import { CMOVES, SPECIES, knownAt, type SpeciesId } from '../data/creatures';
import { HIDINGS } from '../data/encounters';
import { HELD_IDS, atLevel } from '../data/growth';
import { LEGENDS, type LegendStage } from '../data/legends';
import { ABILITIES, HELD, type HeldId } from '../data/passives';
import { PLACE_MAGIC } from '../data/scenes';

/* «Un giorno a Formia»: a short run, the same for everyone who plays the same day. Pure: no clock, no save, no drawing, and
   no Math.random. Everything about a day comes from its seed, floor by floor, and never from what the player has done:
   two friends meet the same creatures and are offered the same rewards, however they got there. That is what makes
   their scores worth comparing. The day's seed comes from the date (ui/day-screen.ts); a free run brings its own. */

/** a generator of its own for each thing that is drawn: taking one number more here moves nothing there */
function stream(seed: number, salt: number): () => number {
  let a = (seed ^ Math.imul(salt + 1, 0x9E3779B1)) >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** a seed out of a text, the same on every computer (FNV-1a) */
export function seedOf(text: string): number {
  let h = 0x811C9DC5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0) || 1;
}
/** the date as the key of a day, on the player's clock */
export function dayKey(d: Date): string { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function pick<T>(r: () => number, list: T[]): T { return list[Math.floor(r() * list.length)]; }
function shuffled<T>(r: () => number, list: T[]): T[] {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; }
  return a;
}

/** the form a creature has at a level: in a run the bond does not count, the day is too short for it */
export function formAt(sp: SpeciesId, lv: number): SpeciesId {
  let f = sp;
  for (let e = SPECIES[f].evolve; e && lv >= e.at; e = SPECIES[f].evolve) f = e.into;
  return f;
}
/** a creature that can fight at the level the day starts: the fish that only jumps until level 15 cannot */
function fights(sp: SpeciesId): boolean { return knownAt(sp, DAY_TUNE.start).filter(function (m) { return CMOVES[m].kind === 'atk'; }).length >= 2; }
/** who may be drawn: the first forms, with no legend among them */
const POOL = (Object.keys(SPECIES) as SpeciesId[]).filter(function (id) { return SPECIES[id].stage === 1 && !SPECIES[id].legend && fights(id); });

/* ---------- what a day holds ---------- */
export type Offer =
  /** everyone gets some health back, those who are down too */
  | { k: 'heal' }
  /** a thing to carry, for one creature */
  | { k: 'held'; id: HeldId }
  /** a second ability, for one creature */
  | { k: 'abil'; id: string }
  /** a new creature, at the level of the team */
  | { k: 'mon'; sp: SpeciesId }
  /** some levels, for one creature */
  | { k: 'levels' };
export interface PlanFloor extends DayFloor { foeList: { sp: SpeciesId; lv: number }[]; stages?: LegendStage[]; seed: number; offers: Offer[] }
export interface DayPlan { team: SpeciesId[]; floors: PlanFloor[] }

export function levelAt(floor: number): number { return DAY_TUNE.start + DAY_TUNE.perFloor * floor; }
/** three creatures to start with, of three different types: nobody starts the day with one idea only */
function teamOf(seed: number): SpeciesId[] {
  const r = stream(seed, 1), out: SpeciesId[] = [];
  shuffled(r, POOL).forEach(function (sp) { if (out.length < 3 && !out.some(function (o) { return SPECIES[o].type === SPECIES[sp].type; })) out.push(sp); });
  return out;
}
function foesOf(seed: number, n: number, f: DayFloor): { sp: SpeciesId; lv: number; stages?: LegendStage[] }[] {
  const r = stream(seed, 100 + n), lv = levelAt(n) - DAY_TUNE.under;
  if (f.boss) {
    const L = LEGENDS[pick(r, Object.keys(LEGENDS).sort())];
    return [{ sp: L.sp, lv: lv, stages: L.stages }];
  }
  /* the day's table by day, the night's by night, as in town */
  const h = HIDINGS[f.table], table = ((f.night && h.night) || h.day).filter(function (m) { return !SPECIES[m.sp].legend && fights(m.sp); }), out: { sp: SpeciesId; lv: number }[] = [];
  const kinds = shuffled(r, table.map(function (m) { return m.sp; }).filter(function (sp, i, a) { return a.indexOf(sp) === i; }));
  for (let k = 0; k < f.foes; k++) out.push({ sp: formAt(kinds[k % kinds.length], lv), lv: lv });
  return out;
}
/** three rewards, never two of a kind: what they are does not depend on who is left to take them */
function offersOf(seed: number, n: number): Offer[] {
  const r = stream(seed, 200 + n), kinds = shuffled(r, ['heal', 'held', 'abil', 'mon', 'levels']).slice(0, 3);
  return kinds.map(function (k): Offer {
    if (k === 'held') return { k: 'held', id: pick(r, HELD_IDS) };
    if (k === 'abil') return { k: 'abil', id: pick(r, DAY_ABILITIES) };
    if (k === 'mon') return { k: 'mon', sp: pick(r, POOL) };
    return { k: k as 'heal' | 'levels' };
  });
}
/** the whole day, from its seed */
export function planOf(seed: number): DayPlan {
  return { team: teamOf(seed), floors: DAY_FLOORS.map(function (f, n) {
    const foes = foesOf(seed, n, f);
    return Object.assign({}, f, { foeList: foes.map(function (x) { return { sp: x.sp, lv: x.lv }; }), stages: foes[0].stages, seed: (stream(seed, 300 + n)() * 4294967296) >>> 0, offers: offersOf(seed, n) });
  }) };
}

/* ---------- a day being played: plain JSON, so that it can be saved ---------- */
export interface DayMon { key: string; sp: SpeciesId; lv: number; /** the share of its health, 0 when down */ hp: number; item?: HeldId; abil?: string[] }
export interface DayRun {
  v: 1;
  /** the date of a daily run, '' for a free one */
  day: string;
  seed: number;
  /** the floor to play next */
  floor: number;
  team: DayMon[];
  /** how each floor went: 2 nobody fell, 1 someone fell, 0 lost */
  log: number[];
  score: number;
  /** waiting for the player to take a reward */
  picking: boolean;
  over: '' | 'won' | 'lost';
  /** the creatures met so far, to name the new ones */
  born: number;
  /** a battle has started and has not been told how it ended: reloading the page must not give a second try at a seed
      that is known by now */
  fighting?: boolean;
  /** what the last floor has done to the team, until a reward is taken */
  said?: string[];
}
function grow(m: DayMon, by: number) { m.lv += by; m.sp = formAt(m.sp, m.lv); }
export function newRun(seed: number, day: string): DayRun {
  const lv = levelAt(0);
  return { v: 1, day: day, seed: seed, floor: 0, log: [], score: 0, picking: false, over: '', born: 3,
    team: planOf(seed).team.map(function (sp, i) { return { key: 'd' + i, sp: formAt(sp, lv), lv: lv, hp: 1 }; }) };
}
/** one of the team, as the battle engine wants it */
export function memberOf(m: DayMon): Member {
  /* a day is too short for a bond: everyone can answer to the magic of the place */
  const stats = atLevel(SPECIES[m.sp].stats, m.lv), o: Member = { id: m.sp, key: m.key, stats: stats, lvl: m.lv, known: knownAt(m.sp, m.lv), hp: m.hp * stats.hp, resonate: true };
  if (m.item) o.item = m.item;
  if (m.abil) o.abil = m.abil.slice();
  return o;
}
export function foeMember(f: { sp: SpeciesId; lv: number }, stages?: LegendStage[]): Member {
  const o: Member = { id: f.sp, stats: atLevel(SPECIES[f.sp].stats, f.lv), lvl: f.lv, known: knownAt(f.sp, f.lv) };
  if (stages) { o.stages = stages; o.stats!.hp = Math.round(o.stats!.hp * DAY_TUNE.bossHp); }
  return o;
}
export function alive(r: DayRun): DayMon[] { return r.team.filter(function (m) { return m.hp > 0; }); }
/** the battle of the floor to play, for the engine: one place only, so that the screen and the simulator play the same.
    The hour is the day's, never the clock's: with the same choices the same battle, at any hour of the player's day */
export function battleOf(r: DayRun): NewBattle {
  const f = planOf(r.seed).floors[r.floor], mine = alive(r).map(memberOf), foes = f.foeList.map(function (x) { return foeMember(x, f.stages); });
  const o: NewBattle = { a: mine[0].id, b: foes[0].id, seed: f.seed, sideA: mine[0], sideB: foes[0], benchA: mine.slice(1), benchB: foes.slice(1), smart: [0, f.smart || 0], wild: foes.length < 2, night: !!f.night, field: PLACE_MAGIC[f.scene] };
  if (f.who) o.trainer = f.who;
  return o;
}
/** the floor is over. `left`: what is left of each creature's health, as a share, `turns` how long it took; what the day
    says goes back to the player, a line for each creature that has changed */
export function afterFloor(r: DayRun, won: boolean, left: Record<string, number>, turns: number): string[] {
  const said: string[] = [];
  let fell = false;
  r.fighting = false;
  r.team.forEach(function (m) { if (left[m.key] != null) { if (m.hp > 0 && left[m.key] <= 0) fell = true; m.hp = Math.max(0, Math.min(1, left[m.key])); } });
  if (!won) { r.log.push(0); r.over = 'lost'; return said; }
  r.log.push(fell ? 1 : 2);
  const t = DAY_TUNE, health = r.team.reduce(function (a, m) { return a + m.hp; }, 0) / r.team.length;
  r.score += t.floor + Math.round(health * t.health) + Math.max(0, t.par - turns) * t.turn;
  r.floor++;
  if (r.floor >= DAY_FLOORS.length) { r.over = 'won'; return said; }
  r.team.forEach(function (m) {
    const was = m.sp;
    grow(m, t.perFloor);
    if (m.hp > 0) m.hp = Math.min(1, m.hp + t.rest);
    if (m.sp !== was) said.push(SPECIES[was].name + ' diventa ' + SPECIES[m.sp].name + '!');
  });
  r.picking = true;
  r.said = said;
  return said;
}
/** the rewards of the floor just won */
export function offersNow(r: DayRun): Offer[] { return planOf(r.seed).floors[r.floor - 1].offers; }
/** this reward can go to this creature: an ability is worth something only to who does not have it already */
export function fits(m: DayMon, o: Offer): boolean {
  if (o.k !== 'abil') return true;
  return (SPECIES[m.sp].abil || []).indexOf(o.id) < 0 && (m.abil || []).indexOf(o.id) < 0;
}
/** can this reward be taken as things stand? */
export function canTake(r: DayRun, o: Offer): boolean {
  if (o.k === 'mon') return r.team.length < DAY_TUNE.team;
  if (o.k === 'heal') return r.team.some(function (m) { return m.hp < 1; });
  return alive(r).some(function (m) { return fits(m, o); });
}
/** it needs a creature to go to */
export function needsTarget(o: Offer): boolean { return o.k === 'held' || o.k === 'abil' || o.k === 'levels'; }
/** the player takes a reward (`key`: the creature it goes to, if it goes to one), or none with a null */
export function takeOffer(r: DayRun, o: Offer | null, key?: string) {
  r.picking = false; r.said = [];
  if (!o || !canTake(r, o)) return;
  const m = r.team.filter(function (x) { return x.key === key && fits(x, o); })[0];
  if (o.k === 'heal') r.team.forEach(function (x) { x.hp = Math.min(1, x.hp + DAY_TUNE.heal); });
  else if (o.k === 'mon') { const lv = levelAt(r.floor); r.team.push({ key: 'd' + r.born++, sp: formAt(o.sp, lv), lv: lv, hp: 1 }); }
  else if (!m) r.picking = true;
  else if (o.k === 'held') m.item = o.id;
  else if (o.k === 'abil') m.abil = (m.abil || []).concat([o.id]);
  else grow(m, DAY_TUNE.levels);
}
/** a reward in words, on the floor it comes after; `no`: why it cannot be taken, when it cannot */
export function offerText(o: Offer, floor: number): { name: string; text: string; no: string } {
  if (o.k === 'heal') return { name: 'Tiella per tutti', text: 'Tutti recuperano il ' + DAY_TUNE.heal * 100 + '% dei PS, e chi è KO torna in piedi.', no: 'Stanno tutti bene.' };
  if (o.k === 'held') return { name: HELD[o.id].name, text: HELD[o.id].text, no: 'Non c\'è nessuno a cui darla.' };
  if (o.k === 'abil') return { name: ABILITIES[o.id].name, text: ABILITIES[o.id].text, no: 'Non serve a nessuno: chi è in piedi ce l\'ha già.' };
  /* it comes in the form it has at the level of the team: the name on the card is the one that arrives */
  if (o.k === 'mon') return { name: SPECIES[formAt(o.sp, levelAt(floor))].name, text: 'Si unisce alla squadra per oggi.', no: 'La squadra è al completo.' };
  return { name: 'Allenamento', text: 'Una creatura sale di ' + DAY_TUNE.levels + ' livelli.', no: 'Non c\'è nessuno da allenare.' };
}

/* ---------- what the player passes to a friend ---------- */
const MARK = ['🟥', '🟨', '🟩'];
/** a line of text to paste in a chat: a square for each floor, the score, the team */
export function shareLine(r: DayRun, when: string): string {
  const row = DAY_FLOORS.map(function (_, n) { return n < r.log.length ? MARK[r.log[n]] : '⬜'; }).join('');
  return 'Un giorno a Formia, ' + when + ': ' + r.log.filter(Boolean).length + ' su ' + DAY_FLOORS.length + ', ' + r.score + ' punti ' + row + ' ' + r.team.map(function (m) { return SPECIES[m.sp].name; }).join(', ');
}
