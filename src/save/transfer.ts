import { MAPS } from '../data/maps';
import type { Dir } from '../data/maps/types';
import { ROSTER, type FriendId } from '../data/characters';
import { SPECIES, type SpeciesId } from '../data/creatures';
import type { StoryProgress } from './story-progress';

/* A story that comes from outside (a code pasted on the title, a file) is checked and cleaned field by field before it
   becomes a save: whatever is not of the right shape is dropped, numbers are kept in their range, names lose anything
   that is not plain text. What comes out has the same shape as a save written by the game, and goes through the same
   fix() as one read from this device. A code is TELEPILO1: and the save's JSON in base64 (UTF-8). */
export const CODE_PREFIX = 'TELEPILO1:';
const DIRS: Dir[] = ['up', 'down', 'left', 'right'];
/** an id, a flag, a key: letters, digits and a few signs, not too long */
const ID = /^[A-Za-z0-9_:.\-]{1,64}$/;

function obj(v: unknown): Record<string, unknown> | null { return v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null; }
function num(v: unknown, lo: number, hi: number): number | undefined { return typeof v === 'number' && isFinite(v) ? Math.max(lo, Math.min(hi, v)) : undefined; }
function int(v: unknown, lo: number, hi: number): number | undefined { const n = num(v, lo, hi); return n == null ? undefined : Math.round(n); }
function ids(v: unknown, max = 400): string[] { return Array.isArray(v) ? v.filter(function (x) { return typeof x === 'string' && ID.test(x); }).slice(0, max) as string[] : []; }
function flags(v: unknown): Record<string, boolean> {
  const o = obj(v), out: Record<string, boolean> = {};
  if (o) Object.keys(o).slice(0, 2000).forEach(function (k) { if (ID.test(k) && typeof o[k] === 'boolean') out[k] = o[k] as boolean; });
  return out;
}
function counts(v: unknown, hi: number): Record<string, number> {
  const o = obj(v), out: Record<string, number> = {};
  if (o) Object.keys(o).slice(0, 500).forEach(function (k) { const n = num(o[k], 0, hi); if (ID.test(k) && n != null) out[k] = n; });
  return out;
}
/** a name given to a creature: plain text, short, no tags or control characters */
export function cleanName(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.replace(/[\u0000-\u001f\u007f<>&"'`\\]/g, '').replace(/\s+/g, ' ').trim().slice(0, 16);
  return s || undefined;
}
function isFriendId(v: unknown): v is FriendId { return typeof v === 'string' && (ROSTER as string[]).indexOf(v) >= 0; }
function isSpecies(v: unknown): v is SpeciesId { return typeof v === 'string' && Object.prototype.hasOwnProperty.call(SPECIES, v); }

/** a story from outside, made safe; null when it is not a story at all */
export function cleanStory(raw: unknown): StoryProgress | null {
  const r = obj(raw);
  if (!r || r.v !== 1 || typeof r.map !== 'string' || !Object.prototype.hasOwnProperty.call(MAPS, r.map)) return null;
  const m = MAPS[r.map], h = m.rows.length, w = m.rows[0].length;
  const x = int(r.x, 0, w - 1), y = int(r.y, 0, h - 1);
  if (x == null || y == null) return null;
  const squad = (Array.isArray(r.squad) ? r.squad : []).filter(isFriendId).slice(0, 6) as FriendId[];
  const s: StoryProgress = {
    v: 1, map: r.map, x: x, y: y, dir: DIRS.indexOf(r.dir as Dir) >= 0 ? r.dir as Dir : 'down',
    badges: ids(r.badges, 50), squad: squad.length ? squad : ['antonio'], beaten: flags(r.beaten), seen: flags(r.seen), found: flags(r.found)
  };
  s.done = counts(r.done, 1e6); s.best = counts(r.best, 1e9);
  const lv = obj(r.lv);
  s.lv = {};
  if (lv) Object.keys(lv).slice(0, 400).forEach(function (k) {
    const e = obj(lv[k]), l = e && int(e.lv, 1, 100), xp = e && int(e.xp, 0, 1e7);
    if (ID.test(k) && l != null) s.lv![k] = { lv: l, xp: xp || 0 };
  });
  s.skills = counts(r.skills, 20);
  Object.keys(s.skills).forEach(function (k) { s.skills![k] = Math.round(s.skills![k]); });
  s.money = int(r.money, 0, 1e7) || 0;
  s.bag = counts(r.bag, 9999);
  Object.keys(s.bag).forEach(function (k) { s.bag![k] = Math.round(s.bag![k]); });
  const seenUid: Record<string, true> = {};
  s.mons = (Array.isArray(r.mons) ? r.mons : []).slice(0, 400).map(function (v) {
    const o = obj(v);
    if (!o || typeof o.uid !== 'string' || !ID.test(o.uid) || seenUid[o.uid] || !isSpecies(o.sp)) return null;
    seenUid[o.uid] = true;
    const c: NonNullable<StoryProgress['mons']>[number] = { uid: o.uid, sp: o.sp };
    const nick = cleanName(o.nick); if (nick) c.nick = nick;
    if (o.gold === true) c.gold = true;
    if (Array.isArray(o.moves)) c.moves = ids(o.moves, 4);
    const bond = int(o.bond, 0, 100); if (bond != null) c.bond = bond;
    if (typeof o.nat === 'string' && ID.test(o.nat)) c.nat = o.nat;
    if (o.home === true) c.home = true;
    if (typeof o.item === 'string' && ID.test(o.item)) c.item = o.item;
    if (isFriendId(o.owner)) c.owner = o.owner;
    return c;
  }).filter(Boolean) as NonNullable<StoryProgress['mons']>;
  const dex = counts(r.dex, 2);
  s.dex = {};
  Object.keys(dex).forEach(function (k) { if (isSpecies(k)) s.dex![k] = Math.round(dex[k]); });
  const places = obj(r.places);
  if (places) {
    s.places = {};
    Object.keys(places).forEach(function (k) {
      const p = obj(places[k]);
      if (!p || !Object.prototype.hasOwnProperty.call(MAPS, k)) return;
      const rest = Array.isArray(p.rest) && p.rest.length === 2 ? [int(p.rest[0], 0, 999), int(p.rest[1], 0, 999)] : null;
      s.places![k] = { flags: flags(p.flags), tick: int(p.tick, 0, 1e7) || 0, rest: rest && rest[0] != null && rest[1] != null ? [rest[0], rest[1]] : null };
    });
  }
  const people = obj(r.people);
  if (people) {
    s.people = {};
    Object.keys(people).forEach(function (k) { const p = obj(people[k]); if (ID.test(k) && p) s.people![k] = Array.isArray(p.moves) ? { moves: ids(p.moves, 4) } : {}; });
  }
  if (typeof r.lead === 'string' && seenUid[r.lead]) s.lead = r.lead;
  const leads = obj(r.leads);
  if (leads) { s.leads = {}; Object.keys(leads).forEach(function (k) { const u = leads[k]; if (isFriendId(k) && typeof u === 'string' && seenUid[u]) s.leads![k] = u; }); }
  if (isFriendId(r.first)) s.first = r.first;
  if (isSpecies(r.rival)) s.rival = r.rival;
  const books = int(r.books, 0, 99); if (books != null) s.books = books;
  const at = int(r.at, 0, 4102444800000); if (at != null) s.at = at;
  return s;
}

/** a story as a code to copy */
export function toCode(s: StoryProgress): string {
  const json = JSON.stringify(s), bytes = new TextEncoder().encode(json);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return CODE_PREFIX + btoa(bin);
}
/** a code back to a story, cleaned (null with the reason when it is not one) */
export function fromCode(code: string): { story: StoryProgress } | { why: string } {
  const c = code.replace(/\s+/g, '');
  if (c.length > 2_000_000) return { why: 'Il codice è troppo lungo per essere una storia.' };
  if (c.indexOf(CODE_PREFIX) !== 0) return { why: 'Non è un codice di Telepilo: deve cominciare con ' + CODE_PREFIX };
  let raw: unknown;
  try {
    const bin = atob(c.slice(CODE_PREFIX.length)), bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    raw = JSON.parse(new TextDecoder().decode(bytes));
  } catch (e) { return { why: 'Il codice è rovinato: forse non è stato copiato tutto.' }; }
  const story = cleanStory(raw);
  return story ? { story: story } : { why: 'Il codice non contiene una storia che il gioco sa leggere.' };
}
