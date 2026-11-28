import { EXCUSES, SCALA_PAY, OWN_SHARE, TITLES, TITLE_AFTER, type Excuse } from '../data/mazzarri';
import type { FriendId } from '../data/characters';

/* The rules of the Scala Mazzarri (data/mazzarri.ts): which excuse a friend says after losing, what a vote is worth,
   and what is remembered of the votes. Pure: the memory comes in and is changed in place, the dice are given. */

/** what is known of the battle just lost: it decides which excuses can be said, and fills them */
export interface ScalaCtx {
  loser: FriendId;
  /** who won: a creature's or a person's name */
  foe?: string;
  /** where (an area's name) */
  place?: string;
  night?: boolean; sea?: boolean;
  /** in the loser's own covo */
  own?: boolean;
  /** against a wild creature */
  wild?: boolean;
  turns?: number;
  /** how much health the winner had left at the end (0–1) */
  left?: number;
  /** the winner's level minus the loser's */
  gap?: number;
}
/** what the story remembers: when each excuse was last heard (by a counter, not a clock), and how the votes went */
export interface ScalaMemory {
  k: number;
  at: Record<string, number>;
  /** votes given, on the rung, one off, the sum of the distances, the run of votes on the rung and the best one, sesterzi won */
  n: number; exact: number; near: number; diff: number; streak: number; best: number; paid: number;
}
export function newMemory(): ScalaMemory { return { k: 0, at: {}, n: 0, exact: 0, near: 0, diff: 0, streak: 0, best: 0, paid: 0 }; }

/** whether an excuse can be said after this battle: it must be true of it */
export function fits(e: Excuse, c: ScalaCtx): boolean {
  var t = c.turns || 0, g = c.gap || 0;
  switch (e.when) {
    case undefined: return true;
    case 'night': return !!c.night;
    case 'sea': return !!c.sea;
    case 'own': return !!c.own;
    case 'wild': return !!c.wild && !!c.foe;
    case 'long': return t >= 20;
    case 'short': return t > 0 && t <= 6;
    case 'close': return c.left != null && c.left > 0 && c.left <= 0.25;
    case 'rout': return c.left != null && c.left > 0.8;
    case 'lvUp': return g >= 3;
    case 'lvDown': return g <= -2;
    case 'place': return !!c.place;
  }
  return false;
}

/** «a Scauri», «al Palazzo del Popolo», «in via Vitruvio», «sul lungomare di Vindicio», «alla stazione», «ad Acqualonga» */
const PREP: [RegExp, string, boolean?][] = [
  /* streets and squares: «in»; the coast road: «sul»; the mountains: «sui»; «Sopra la stazione» already says where */
  [/^(Via|Viale|Vico|Corso|Largo|Piazza|Piazzale|Piazzetta|Salita|Strada|Località) /, 'in ', true], [/^(Centro|Campagna)$/, 'in ', true],
  [/^Lungomare\b/, 'sul ', true], [/^Monti /, 'sui '], [/^Sopra /, '', true],
  /* the places named after what they are */
  [/^(Parco|Lido|Teatro|Villaggio|Bruno Zauli|Tabacchi) /, 'al '], [/^Porto$/, 'al ', true], [/^Bruno Zauli$/, 'al '],
  [/^(Pineta|Pinetina|Torre|Birreria|Tomba|Gelateria|Bodeguita) /, 'alla '], [/^Stazione$/, 'alla ', true],
  [/^(Ospedale|Eclipse)\b/, 'all\''], [/^Casa\b/, 'a ', true], [/^Barber /, 'da '],
  [/^Il /, 'al '], [/^Lo /, 'allo '], [/^La /, 'alla '], [/^L'/, 'all\''], [/^I /, 'ai '], [/^Gli /, 'agli '], [/^Le /, 'alle ']
];
export function inPlace(name: string): string {
  for (var i = 0; i < PREP.length; i++) {
    var r = PREP[i];
    if (!r[0].test(name)) continue;
    /* an article of the name is taken into the preposition: «Il Cisternone» → «al Cisternone» */
    var rest = /^(Il|Lo|La|I|Gli|Le) /.test(name) ? name.replace(/^\S+ /, '') : /^L'/.test(name) ? name.slice(2) : name;
    return r[1] + (r[2] ? rest.charAt(0).toLowerCase() + rest.slice(1) : rest);
  }
  return (/^[AEIOU]/.test(name) ? 'ad ' : 'a ') + name;
}
/** the excuse with this battle in it */
export function fill(text: string, c: ScalaCtx): string {
  return text.replace(/\{foe\}/g, c.foe || '').replace(/\{gap\}/g, String(Math.abs(c.gap || 0))).replace(/\{turns\}/g, String(c.turns || 0))
    .replace(/\{inplace\}/g, c.place ? inPlace(c.place) : '');
}

/** the excuse to say now: of those true of this battle, the one heard longest ago (never heard first), and one that
    fits this battle in particular a little before a plain one; it is marked as heard */
export function pick(c: ScalaCtx, mem: ScalaMemory, rnd: () => number): { e: Excuse; text: string } | null {
  var list = (EXCUSES[c.loser] || []).filter(function (e) { return fits(e, c); });
  if (!list.length) return null;
  var score = function (e: Excuse) { return (e.id in mem.at ? mem.at[e.id] : -1000) - (e.when ? 3 : 0); };
  var low = Math.min.apply(null, list.map(score)), best = list.filter(function (e) { return score(e) === low; });
  var e = best[Math.min(best.length - 1, Math.floor(rnd() * best.length))];
  mem.k++; mem.at[e.id] = mem.k;
  return { e: e, text: fill(e.text, c) };
}

export type Tier = 'exact' | 'one' | 'two' | 'off';
export interface Verdict { diff: number; tier: Tier; pay: number; puro: boolean; under: boolean }
/** a vote against the rung: how far, and what the cassa pays (half for an excuse of the one being played) */
export function verdict(vote: number, r: number, own?: boolean): Verdict {
  var diff = Math.abs(vote - r), tier: Tier = diff === 0 ? 'exact' : diff === 1 ? 'one' : diff === 2 ? 'two' : 'off';
  var puro = diff === 0 && r === 10;
  var pay = (tier === 'exact' ? SCALA_PAY.exact : tier === 'one' ? SCALA_PAY.one : tier === 'two' ? SCALA_PAY.two : 0) + (puro ? SCALA_PAY.puro : 0);
  if (own) pay = Math.round(pay * OWN_SHARE);
  return { diff: diff, tier: tier, pay: pay, puro: puro, under: vote < r };
}
/** a vote is remembered */
export function tally(mem: ScalaMemory, v: Verdict) {
  mem.n++; mem.diff += v.diff; mem.paid += v.pay;
  if (v.tier === 'exact') { mem.exact++; mem.streak++; mem.best = Math.max(mem.best, mem.streak); } else mem.streak = 0;
  if (v.tier === 'one') mem.near++;
}
/** what Costanzo calls the one who votes, after a few votes */
export function title(mem: ScalaMemory): { name: string; text: string } | null {
  if (mem.n < TITLE_AFTER) return null;
  var avg = mem.diff / mem.n;
  return TITLES.filter(function (t) { return avg <= t.upTo; })[0];
}
/** of each friend's excuses, how many have been heard */
export function heard(mem: ScalaMemory, who: FriendId): { got: number; of: number } {
  var all = EXCUSES[who] || [];
  return { got: all.filter(function (e) { return e.id in mem.at; }).length, of: all.length };
}
