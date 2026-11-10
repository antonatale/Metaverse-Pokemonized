import type { Prop, Stage, SelfStage } from '../data/move-fx';
import type { TypeName } from '../data/types';
import { SELF } from './self-scenes';
import { colOf } from './spell-kit';
import type { BattleEvent } from '../battle';
import { reduced } from './dom';
import { STAGES } from './move-stages';
import { body, type Ctx } from './spell-kit';

/* The moves of the people, shown with the scenes of the creatures (ui/move-stages.ts, ui/move-scenes.ts): the engine
   sends a little sign for each one (data/characters.ts: «speech» for Costanzo's comizio, «fox» for Andrea's Volpino
   Alato, «ball» for Forchetta's serve…), and here each sign becomes a scene with the person's own pieces, colours and
   words. Only drawing: the battle and its golden files do not change. */
interface PersonScene { stage: Stage; col: string; prop?: Prop; words?: string[]; n?: number; k?: number }

const SCENES: Record<string, PersonScene> = {
  /* Antonio: the diagnosis looks for the inefficiencies (eyes open all round the one in front); the robot of
     Sim-to-Real runs in crackling; Formia → Torino → AMERICA lands from the sky, starred */
  reveal: { stage: 'omen', col: '#c3a0ff', prop: 'eye', n: 6 },
  robot: { stage: 'jet', col: '#8fd0f6', prop: 'spark', k: 1.2 },
  'banner:usa': { stage: 'dive', col: '#ff5a5a', prop: 'star', k: 1.4 },
  /* Costanzo: the comizio, word after word; Daje Roma Daje, a song from the curva */
  speech: { stage: 'speech', col: '#ffd84d', words: ['GIÀ', 'LO', 'SAI!'], k: 1.2 },
  'banner:roma': { stage: 'song', col: '#ffb300', prop: 'note', k: 1.3 },
  /* Andrea: the Volpino Alato takes off and falls from above */
  fox: { stage: 'dive', col: '#ff8a3c', prop: 'feather', k: 1.2 },
  /* Valentin: the party drags everyone in; back from Copenhagen, straight into the one in front */
  confetti: { stage: 'swarm', col: '#ffa04a', prop: 'wish', n: 9, k: 1.1 },
  flyBack: { stage: 'ram', col: '#57c968', prop: 'feather', k: 1.4 },
  /* Forchetta: an ace (a ball over the net), a message nobody understands, Forza Formia in white and blue */
  ball: { stage: 'lob', col: '#d8f04a', prop: 'pollen', k: 1.1 },
  cryptic: { stage: 'speech', col: '#8fd0f6', words: ['ok…', '?¿', '…'], k: 1 },
  'banner:formia': { stage: 'tide', col: '#3b8fd9', prop: 'star', k: 1.2 },
  /* Zendavid: the bark, the joke that lands (everyone falls down laughing), Kanye at full volume */
  bark: { stage: 'speech', col: '#ff8fc1', words: ['BAU!', 'BAU!'], k: 1.1 },
  laugh: { stage: 'quake', col: '#ffd84d', prop: 'star', k: 1.3 },
  notes: { stage: 'song', col: '#ff8fc1', prop: 'note', k: 1.2 },
  /* the moves learned growing up (data/people.ts, `show`), told apart by their banner from the base ones: Antonio's
     Chicago in a spotlight of stars, Forchetta's match point as a smash of lightning, Costanzo's vote raining ballots */
  'banner:CHICAGO!': { stage: 'cone', col: '#5ab0ff', prop: 'star', k: 1.4 },
  'banner:MATCH POINT!': { stage: 'bolt', col: '#d8f04a', prop: 'pollen', n: 2, k: 1.3 },
  'banner:SI VOTA!': { stage: 'rain', col: '#ffd84d', prop: 'wish', k: 1.3 }
};

/* the moves on oneself: Costanzo puts on the character (a veil), Valentin the King of green relaxes in the sun, Zendavid
   puts his headphones on (calm), the training of Andrea and the others' buffs harden them (scales) */
const SELF_SIGNS: Record<string, SelfStage> = { glint: 'veil', glowGreen: 'sunbath', phOn: 'calm', pump: 'scales' };
/** a person's move on himself, in the colour of his type; null when there is none */
export function personSelf(ev: Extract<BattleEvent, { k: 'anim' }>, type: TypeName): (() => Promise<void>) | null {
  const st = SELF_SIGNS[ev.a];
  if (!st || reduced) return null;
  return function () { return SELF[st]({ i: ev.who, t: type, mc: colOf(type), k: 1.1 }); };
}
/** how the scene goes with the sign the battle always showed: after it (the sign brings the one back, as from
    Copenhagen), together with it (the robot, the fox), instead of it (the ball), or before it (the rest) */
export function personOrder(a: string): 'after' | 'with' | 'instead' | 'before' {
  return a === 'flyBack' ? 'after' : a === 'robot' || a === 'fox' ? 'with' : a === 'ball' ? 'instead' : 'before';
}
/** the scene of a person's sign, from the one who does it to the one in front, as a function that starts it; null
    when the sign has none (or motion is reduced), and the battle shows it as before */
export function personScene(ev: Extract<BattleEvent, { k: 'anim' }>): (() => Promise<void>) | null {
  const key = ev.a + (ev.style ? ':' + ev.style : ''), sc = (ev.text ? SCENES[ev.a + ':' + ev.text] : undefined) || SCENES[key] || SCENES[ev.a];
  if (!sc || reduced) return null;
  /* a sign on the one hit (the diagnosis, the laugh) is cast by the other side */
  const onFoe = ev.a === 'reveal' || ev.a === 'laugh', from = onFoe ? 1 - ev.who : ev.who, to = 1 - from;
  const stage = STAGES[sc.stage], b = body(to, 0.5, 0.5);
  const x: Ctx = {
    from: from, to: to, end: b, b: b, t: null, mc: sc.col, k: sc.k || 1.1, n: sc.n || stage.n || 1, miss: false, prop: sc.prop, words: sc.words,
    c: { type: null, name: '', power: 70, sig: false, outcome: 'hit', crit: false, lvl: 0 }
  };
  return function () { return stage.run(x); };
}
