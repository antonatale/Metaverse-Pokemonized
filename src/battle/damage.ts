import { CHARS, type Move } from '../data/characters';
import { SPECIES, isSpecies } from '../data/creatures';
import { TUNE, K, CRIT, MAGIC_TUNE } from '../data/tuning';
import { magicBeats, type TypeName } from '../data/types';
import type { BattleEvent, BattleState, Side } from './types';
import { rand } from './rng';
import { NET_IDS } from '../data/nets';
import { say, line, expr, anim } from './events';
import { ch, mv, eff, modMult, sideType, zenOn, statsOf } from './state';

/* ---------- the creatures' magic ---------- */
/** a side's types: a creature's own (one or two), a person's of the moment */
export function typesOf(s: BattleState, side: Side, foe: Side): TypeName[] {
  if (isSpecies(side.id)) { const sp = SPECIES[side.id]; return sp.type2 ? [sp.type, sp.type2] : [sp.type]; }
  return [sideType(s, side, foe)];
}
/** the type of a creature's move: the one of its magic, or the creature's own; null for a plain move */
export function moveType(side: Side, m: Move): TypeName | null { return m.plain ? null : m.mtype || ch(side).type; }
/** a creature's magic against the types of the one it hits; with two types it adds up (or cancels out) */
export function magicEff(t: TypeName | null, against: TypeName[]): number {
  let e = 1;
  if (!t) return e;
  for (const d of against) { if (magicBeats(t, d)) e *= MAGIC_TUNE.se; else if (magicBeats(d, t)) e *= MAGIC_TUNE.nve; }
  return Math.round(e * 1000) / 1000;
}

/** how well a hit works, in steps: 2 double advantage, 1 super effective, 0 even (or cancelled out), −1, −2.
    A person's advantage is ×1.12 or ×0.9; a creature's magic multiplies one step for each of the foe's types. */
export function effLevel(e: number): number {
  if (e >= 1.2) return 2;
  if (e > 1.02) return 1;
  if (e <= 0.85) return -2;
  if (e < 0.98) return -1;
  return 0;
}

/* ---------- damage ---------- */
export function movePower(side: Side, m: Move): number {
  if (m.id === 'america') return m.powers![side.lv];
  if (m.id === 'cucinato') return Math.round(20 + 100 * (1 - side.hp / side.max));
  return m.power!;
}
interface Parts { base: number; eff: number; type: TypeName | null; critChance: number; forceCrit: boolean; acc: number; notes: string[] }
function parts(s: BattleState, i: number, id: string): Parts {
  const me = s.sides[i], foe = s.sides[1 - i], m = mv(me, id)!;
  /* a person's advantage is the person's type against the other's; a creature's is the type of the spell it casts */
  const magic = isSpecies(me.id), type = magic ? moveType(me, m) : sideType(s, me, foe);
  const e = magic ? magicEff(type, typesOf(s, foe, me)) : eff(type, sideType(s, foe, me));
  const atk = statsOf(me).atk * modMult(s, me, 'atk') * (me.id === 'zendavid' ? 1 - 0.06 * me.anx : 1);
  const def = statsOf(foe).def * modMult(s, foe, 'def');
  let mult = 1, forceCrit = false;
  const critChance = m.crit || CRIT, notes: string[] = [];
  if (me.boost) mult *= 1.5;
  if (me.id === 'costanzo') {
    if (me.lastAtk && me.lastAtk !== id) { mult *= 0.8; notes.push('filo'); }
    else if (me.lastAtk === id && (me.atkStreak + 1) % 3 === 0) forceCrit = true;
  }
  if (me.id === 'zendavid') {
    if (!me.used[id]) mult *= 1.25;
    if (id === 'stronger' && zenOn(s, me)) mult *= TUNE.zenBoost;
  }
  if (foe.id === 'andrea' && foe.seen[id]) { mult *= TUNE.calc; notes.push('calc'); }
  mult *= modMult(s, foe, 'guard');
  const base = movePower(me, m) * atk / def * (s.K || K) * e * mult;
  return { base: base, eff: e, type: type, critChance: forceCrit ? 1 : critChance, forceCrit: forceCrit, acc: foe.away ? 0 : (m.acc || 1), notes: notes };
}
/** average damage of a move, for the computer's choice */
export function expected(s: BattleState, i: number, id: string): number {
  const m = mv(s.sides[i], id)!;
  if (m.kind !== 'atk') return 0;
  const p = parts(s, i, id);
  let v = p.base * 0.94 * (1 + p.critChance * 0.5) * p.acc;
  if (m.risk) v *= 1 - m.risk;
  if (m.chance) v *= m.chance;
  if (m.twoTurn) v *= 0.55;
  return v;
}

export function applyHit(s: BattleState, i: number, id: string, ev: BattleEvent[], opt?: { mult?: number; noLunge?: boolean; quiet?: boolean }): number {
  opt = opt || {};
  const me = s.sides[i], foe = s.sides[1 - i], j = 1 - i, cm = ch(me);
  const p = parts(s, i, id);
  if (rand(s) > p.acc) {
    ev.push(anim(i, 'lunge'));
    if (foe.away) ev.push(say(ch(foe).name + ' è a Copenhagen: il colpo va a vuoto.'));
    else { ev.push(anim(j, 'dodge')); ev.push(say('Ma ' + ch(foe).name + ' la scampa!')); }
    return 0;
  }
  const crit = p.forceCrit || rand(s) < p.critChance;
  const roll = 0.88 + rand(s) * 0.12;
  let dmg = Math.max(1, Math.round(p.base * roll * (crit ? (foe.id === 'andrea' ? TUNE.critAndrea : 1.5) : 1) * (opt.mult || 1)));
  let sturdy = false;
  if (foe.id === 'forchetta' && !foe.sturdy && dmg >= foe.hp && foe.hp > 1) { dmg = foe.hp - 1; foe.sturdy = true; sturdy = true; }
  /* a creature bound to Antonio may hold on, once (story battles only: the others have no endure) */
  let held = false;
  if (foe.endure && !foe.sturdy && dmg >= foe.hp && foe.hp > 1 && rand(s) < foe.endure) { dmg = foe.hp - 1; foe.sturdy = true; held = true; }
  foe.hp = Math.max(0, foe.hp - dmg);
  me.st.dmg += dmg; if (crit) me.st.crits++;
  if (!opt.noLunge) ev.push(anim(i, 'lunge'));
  ev.push({ k: 'hp', who: j, hp: foe.hp, dmg: dmg, crit: crit, eff: p.eff });
  ev.push(expr(j, foe.hp > 0 ? 'pout' : 'sleepy'));
  if (crit) ev.push(say(p.forceCrit ? 'La fissa di Costanzo: colpo critico sicuro!' : 'Colpo critico!'));
  const lvl = effLevel(p.eff);
  if (lvl === 2) ev.push(say('Doppio vantaggio di tipo: è superefficace!'));
  else if (lvl === 1) ev.push(say('È superefficace!'));
  else if (lvl === -2) ev.push(say('Non è per niente efficace…'));
  else if (lvl === -1) ev.push(say('Non è molto efficace…'));
  if (p.notes.indexOf('filo') >= 0 && !opt.quiet) ev.push(say('Costanzo cambia argomento e perde il filo: −20%.'));
  if (p.notes.indexOf('calc') >= 0) { ev.push(say('Andrea ha già i dati su questa mossa: −' + Math.round(100 - TUNE.calc * 100) + '%.')); }
  if (sturdy) { ev.push(say('Forchetta resta in piedi con 1 PS!')); ev.push(line(j, CHARS.forchetta.lines.sturdy)); }
  if (held) ev.push(say(ch(foe).name + ' non vuole deludere Antonio: resta in piedi con 1 PS!'));
  /* a wild creature worn out: the moment for a net, said once (story battles only) */
  if (s.wild && j === 1 && foe.hp > 0 && foe.hp / foe.max < 0.35 && !s.tired && s.bag && NET_IDS.some(function (n) { return (s.bag![n] || 0) > 0; })) {
    s.tired = true;
    /* she or he: the wild ones are announced as "Una Cicalina selvatica", "Un Riccetto selvatico" */
    const she = isSpecies(foe.id) && /selvatica\b/.test(SPECIES[foe.id].wild);
    ev.push(say(ch(foe).name + (she ? ' è stanca' : ' è stanco') + ': è il momento buono per un retino!'));
  }
  if (foe.id === 'andrea' && foe.hp > 0) foe.seen[id] = (foe.seen[id] || 0) + 1;
  if (foe.id === 'zendavid' && foe.hp > 0 && !zenOn(s, foe) && foe.anx < 3) {
    foe.anx++;
    ev.push(say('L\'ansia di Zendavid sale (' + foe.anx + '/3).'));
  }
  if (crit && foe.hp > 0 && cm.lines.crit) { ev.push(expr(i, 'grin')); ev.push(line(i, cm.lines.crit)); }
  if (me.id === 'costanzo' && foe.hp > 0 && rand(s) < TUNE.talk) {
    if (zenOn(s, foe)) ev.push(say('Costanzo prova a non farlo parlare, ma Zendavid ha le cuffie: non sente niente.'));
    else { foe.skip = { why: 'talk' }; ev.push(say('Costanzo non lo fa parlare: ' + ch(foe).name + ' perde il turno!')); }
  }
  return dmg;
}
export function heal(s: BattleState, i: number, amt: number, ev: BattleEvent[], msg?: string): number {
  const me = s.sides[i], real = Math.min(Math.round(amt), me.max - me.hp);
  if (real <= 0) { ev.push(say(ch(me).name + ' ha già tutti i PS.')); return 0; }
  me.hp += real; me.st.heals++;
  ev.push(anim(i, 'heal'));
  ev.push({ k: 'hp', who: i, hp: me.hp, heal: real });
  ev.push(say(msg || ch(me).name + ' recupera ' + real + ' PS.'));
  return real;
}
export function confuse(s: BattleState, j: number, turns: number, ev: BattleEvent[]): boolean {
  const foe = s.sides[j];
  foe.conf = Math.max(foe.conf, turns);
  ev.push(anim(j, 'confused'));
  ev.push(say(ch(foe).name + ' è confuso!'));
  return true;
}
