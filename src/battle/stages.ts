import type { BattleEvent, BattleState, Side } from './types';
import { NET_IDS } from '../data/nets';
import { say, line, anim } from './events';
import { ch, netShut } from './state';
import { snap } from './labels';
import { stageFx } from './passives';

/* A legend's fight comes in parts (data/legends.ts): when its health falls to a mark the next part starts, with other
   moves and sometimes other types. Only a side that has `stages` gets here, and that is only a legend of the story. */

/** the health a hit cannot take a legend below: every part gets played, however hard the blow */
export function stageFloor(x: Side): number {
  const next = x.stages && x.stages[x.stage! + 1];
  return next ? Math.ceil(x.max * next.at) : 0;
}
/** the health has reached the mark: the next part starts, true if it has. What was only of the moment goes with the last
    one, the drops that had been put on it and a blow it was winding up included: reaching the mark in time is how you
    stop that blow */
export function stageUp(s: BattleState, i: number, ev: BattleEvent[]): boolean {
  const x = s.sides[i], next = x.stages && x.stages[x.stage! + 1];
  if (!next || x.hp <= 0 || x.hp > Math.ceil(x.max * next.at)) return false;
  x.stage! += 1;
  x.mods = []; x.conf = 0; x.status = null;
  x.known = next.moves.slice();
  if (next.types) x.types = next.types.slice();
  ev.push(anim(i, 'stage', { text: next.name }));
  ev.push(line(i, next.line));
  if (x.charge) { x.charge = null; ev.push(say(ch(x).name + ' perde la presa: il colpo è andato a vuoto.')); }
  if (next.self) next.self.forEach(function (fx) { stageFx(s, i, fx, ev); });
  /* a net holds only now: it is said once, and it is the moment */
  if (s.wild && i === 1 && !netShut(s) && s.bag && NET_IDS.some(function (n) { return (s.bag![n] || 0) > 0; })) {
    s.tired = true;
    ev.push(say(ch(x).name + ' barcolla: adesso un retino può tenerlo!'));
  }
  ev.push(snap(s));
  return true;
}
