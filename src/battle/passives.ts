import { ABILITIES, HELD, STATUS, type HeldId, type Passive, type PassiveDo, type PassiveIf, type PassiveOn, type StatFx, type StatusId } from '../data/passives';
import { magicBeats, type TypeName } from '../data/types';
import { isSpecies, SPECIES } from '../data/creatures';
import type { Stats } from '../data/characters';
import type { BattleEvent, BattleState, Side } from './types';
import { rand } from './rng';
import { say, anim, expr } from './events';
import { ch, addMod, statsOf } from './state';
import { heal } from './damage';

/* States, abilities and held things: the one place that does what data/passives.ts says. The hooks are four (coming on,
   after a hit given, after a hit taken, the end of the turn), plus the numbers that read them. Nothing here runs for a
   fighter who has none, and only creatures have them: the free battles stay exactly as they were. */

/** a creature's ability, the second one of a last form, the thing it carries */
function passivesOf(x: Side): Passive[] {
  const out: Passive[] = [];
  if (x.abil) x.abil.forEach(function (id) { if (ABILITIES[id]) out.push(ABILITIES[id]); });
  if (x.item && HELD[x.item as HeldId]) out.push(HELD[x.item as HeldId]);
  return out;
}
function spent(x: Side, id: string): boolean { return !!x.spent && !!x.spent[id]; }
function spend(x: Side, id: string) { x.spent = x.spent || {}; x.spent[id] = true; }
/** the hit comes from a type that beats one of the creature's own */
function isWeak(x: Side, type: string | null | undefined): boolean {
  if (!type || !isSpecies(x.id)) return false;
  const sp = SPECIES[x.id];
  return magicBeats(type as TypeName, sp.type) || (!!sp.type2 && magicBeats(type as TypeName, sp.type2));
}
/** `side`: health lost without a blow (a state, a sting, one's own confusion): it counts for what looks at the health, and
    for nothing that answers to being hit */
interface Ctx { dmg?: number; type?: string | null; side?: boolean }
function holds(s: BattleState, x: Side, foe: Side, c: PassiveIf | undefined, id: string, ctx?: Ctx): boolean {
  if (!c) return true;
  if (c.once && spent(x, id)) return false;
  if (c.night && !s.night) return false;
  if (c.first && foe.went) return false;
  if (c.below != null && x.hp >= x.max * c.below) return false;
  if (c.weak && !isWeak(x, ctx && ctx.type)) return false;
  return true;
}

/* ---------- a number going up or down ---------- */
const FX: Record<StatFx, { stat: string; mult: number; turns: number; text: string }> = {
  atkUp: { stat: 'atk', mult: 1.3, turns: 5, text: 'l\'Attacco di {n} sale per 5 turni.' },
  defUp: { stat: 'def', mult: 1.25, turns: 5, text: 'la Difesa di {n} sale per 5 turni.' },
  atkDown: { stat: 'atk', mult: 0.75, turns: 5, text: 'l\'Attacco di {n} cala per 5 turni.' },
  defDown: { stat: 'def', mult: 0.8, turns: 4, text: 'la Difesa di {n} cala per 4 turni.' }
};
function cap(t: string) { return t.charAt(0).toUpperCase() + t.slice(1); }
/** the standard raises and drops: the strength of the friends' (Palestra, Pit stop, Abbaia, Diagnosi), but lasting longer.
    In three turns a raise gives back less than the turn it costs, and hitting is always better (tools/sim-fun.ts) */
export function statFx(s: BattleState, who: number, fx: StatFx, ev: BattleEvent[], turns?: number) {
  const x = s.sides[who], f = FX[fx], n = turns || f.turns, had = x.mods.filter(function (m) { return m.tag === fx; })[0];
  /* a short one coming on top of a long one does not cut it short */
  addMod(x, f.stat, f.mult, Math.max(s.turn + n, had ? had.until : 0), fx);
  ev.push(anim(who, 'stat', { style: fx }));
  ev.push(say(cap(f.text.replace('{n}', ch(x).name).replace(/\d turni/, n + ' turni'))));
}

/* ---------- states ---------- */
/** what would stop this state on that side, if anything */
function stopper(s: BattleState, j: number, id: StatusId): Passive | undefined {
  const x = s.sides[j];
  return passivesOf(x).filter(function (p) { return p.blocks && (p.blocks === 'all' || p.blocks.indexOf(id) >= 0) && holds(s, x, s.sides[1 - j], p.if, p.id); })[0];
}
/** a state that would not take on that side: the computer does not waste a turn on it */
export function immune(s: BattleState, j: number, id: StatusId): boolean { return !!stopper(s, j, id); }
/** a state falls on that side: not on one who has one already, nor through what stops it */
export function inflict(s: BattleState, j: number, id: StatusId, ev: BattleEvent[]): boolean {
  const x = s.sides[j], st = STATUS[id], name = ch(x).name;
  if (x.status) { ev.push(say('Ma ' + name + ' ha già i suoi problemi.')); return false; }
  const stop = stopper(s, j, id);
  if (stop) {
    if (stop.if && stop.if.once) spend(x, stop.id);
    ev.push(anim(j, 'abil', { text: stop.name }));
    ev.push(say(stop.name + ': ' + name + ' non ci casca.'));
    return false;
  }
  const [lo, hi] = st.turns;
  x.status = { id: id, left: lo === hi ? lo : lo + Math.floor(rand(s) * (hi - lo + 1)) };
  ev.push(anim(j, 'status', { style: id }));
  ev.push(say(st.got.replace('{n}', name)));
  return true;
}
export function cureStatus(s: BattleState, i: number, ev: BattleEvent[]) {
  const x = s.sides[i];
  if (!x.status) return;
  const st = STATUS[x.status.id];
  x.status = null;
  ev.push(say(st.over.replace('{n}', ch(x).name)));
}
/** a sleeper loses its turn: true if that is what happened */
export function sleeping(s: BattleState, i: number, ev: BattleEvent[]): boolean {
  const x = s.sides[i];
  if (!x.status || !STATUS[x.status.id].sleep) return false;
  ev.push(expr(i, 'sleepy'));
  ev.push(say(ch(x).name + ' dorme.'));
  if (--x.status.left <= 0) cureStatus(s, i, ev);
  return true;
}
/** what is left of the numbers once the state has had its say */
export function statusMult(x: Side, stat: 'atk' | 'spe'): number {
  const st = x.status ? STATUS[x.status.id] : null;
  return (st && st[stat]) || 1;
}
export function trapped(x: Side): boolean { return !!x.status && !!STATUS[x.status.id].trap; }

/* ---------- the hooks ---------- */
function doIt(s: BattleState, i: number, p: Passive, o: PassiveOn, ev: BattleEvent[], ctx?: Ctx) {
  const x = s.sides[i], j = 1 - i, foe = s.sides[j], a: PassiveDo = o.do;
  /* at full health a cure has nothing to do: it does not say its name, and a one-time one is not spent */
  if ((a.heal || a.drain) && x.hp >= x.max && !(a.thorn || a.foe || a.self || a.status || a.cure)) return;
  if (o.if && o.if.once) spend(x, p.id);
  ev.push(anim(i, 'abil', { text: p.name }));
  if (a.heal) heal(s, i, x.max * a.heal, ev, ch(x).name + ' si riprende un po\'.');
  if (a.drain && ctx && ctx.dmg) heal(s, i, ctx.dmg * a.drain, ev, ch(x).name + ' si riprende un po\' di PS.');
  if (a.thorn && foe.hp > 0) {
    const amt = Math.max(1, Math.round(foe.max * a.thorn));
    foe.hp = Math.max(0, foe.hp - amt);
    ev.push({ k: 'hp', who: j, hp: foe.hp, dmg: amt });
    ev.push(say(ch(foe).name + ' si punge.'));
    fire(s, j, 'hurt', ev, { side: true });
  }
  if (a.foe && foe.hp > 0) statFx(s, j, a.foe, ev, a.turns);
  if (a.self) statFx(s, i, a.self, ev, a.turns);
  if (a.status && foe.hp > 0) inflict(s, j, a.status, ev);
  if (a.cure) cureStatus(s, i, ev);
}
/** something has happened to side i: whatever it carries that answers to it, answers. Nobody down answers anything */
export function fire(s: BattleState, i: number, when: PassiveOn['when'], ev: BattleEvent[], ctx?: Ctx) {
  const x = s.sides[i];
  if (x.hp <= 0 || !(x.abil || x.item)) return;
  passivesOf(x).forEach(function (p) {
    (p.on || []).forEach(function (o) {
      if (ctx && ctx.side && !(o.if && o.if.below != null)) return;
      if (o.when === when && x.hp > 0 && holds(s, x, s.sides[1 - i], o.if, p.id, ctx)) doIt(s, i, p, o, ev, ctx);
    });
  });
}
/** the end of the turn: what the state costs, the state wearing off, what answers to it */
export function turnEnd(s: BattleState, i: number, ev: BattleEvent[]) {
  const x = s.sides[i];
  if (x.hp <= 0) return;
  if (x.status) {
    const st = STATUS[x.status.id];
    if (st.burn) {
      const amt = Math.max(1, Math.round(x.max * st.burn));
      x.hp = Math.max(0, x.hp - amt);
      ev.push({ k: 'hp', who: i, hp: x.hp, dmg: amt, quiet: true });
      ev.push(say(st.name + ': ' + ch(x).name + ' perde ' + amt + ' PS.'));
      fire(s, i, 'hurt', ev, { side: true });
    }
    if (x.hp > 0 && !st.sleep && --x.status.left <= 0) cureStatus(s, i, ev);
  }
  fire(s, i, 'turn', ev);
}

/* ---------- the numbers ---------- */
function product(s: BattleState, x: Side, foe: Side, what: 'spe' | 'dealt' | 'taken', ctx?: Ctx): number {
  let m = 1;
  passivesOf(x).forEach(function (p) { const v = p[what]; if (v && holds(s, x, foe, p.if, p.id, ctx)) m *= v; });
  return m;
}
/** a fighter's Speed: its own, with what it carries and the state it is in */
export function speedOf(s: BattleState, i: number): number { return speedIn(s, s.sides[i], s.sides[1 - i]); }
/** the same for someone who may not be on the field */
export function speedIn(s: BattleState, x: Side, foe: Side): number {
  const base = (statsOf(x) as Stats).spe;
  if (!(x.abil || x.item || x.status)) return base;
  return base * product(s, x, foe, 'spe') * statusMult(x, 'spe');
}
export function dealtBy(s: BattleState, me: Side, foe: Side): number { return me.abil || me.item ? product(s, me, foe, 'dealt') : 1; }
export function takenBy(s: BattleState, foe: Side, me: Side, type: string | null): number { return foe.abil || foe.item ? product(s, foe, me, 'taken', { type: type }) : 1; }
/** a hit has landed: the one-time numbers that counted for it are gone */
export function spendHit(s: BattleState, me: Side, foe: Side, type: string | null) {
  [[me, foe, 'dealt'], [foe, me, 'taken']].forEach(function (t) {
    const x = t[0] as Side, o = t[1] as Side, what = t[2] as 'dealt' | 'taken';
    if (!(x.abil || x.item)) return;
    passivesOf(x).forEach(function (p) { if (p[what] && p.if && p.if.once && holds(s, x, o, p.if, p.id, { type: type })) spend(x, p.id); });
  });
}
