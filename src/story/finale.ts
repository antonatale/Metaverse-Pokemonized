import { COVI } from '../data/covi';
import type { FriendId } from '../data/characters';
import { st } from '../save/story-progress';
import { flag, STONES } from './plot';

export const ABDUCTION = 'finale-rapimento';
export const ARRIVAL = 'finale-castellone';
export const REVEAL = 'finale-soglia';
export const REUNION = 'finale-riunione';
export const MAMURRA_BEATEN = 'tr-mamurra';

export function creaturesMissing(): boolean {
  return !!st.seen[ABDUCTION] && !st.beaten[MAMURRA_BEATEN];
}

export function allFriendsFreed(hero: FriendId): boolean {
  return Object.entries(COVI).every(([id, covo]) => covo.city !== 'formia' || covo.leader === hero || st.beaten[id] || st.badges.includes(covo.badge.id));
}

export function friendFreed(friend: FriendId): boolean {
  return Object.entries(COVI).some(([id, covo]) => covo.leader === friend && (st.beaten[id] || st.badges.includes(covo.badge.id)));
}

export function readyForVilla(hero: FriendId): boolean {
  return allFriendsFreed(hero) && STONES.every(stone => flag(stone.id));
}

export type Command = 'guard' | 'advance' | 'distract' | 'open' | 'sides' | 'center' | 'strike';
type Phase = 'bridge' | 'cages' | 'wave' | 'finish' | 'won' | 'lost';
export interface FinaleBattle { phase: Phase; step: number; freed: number; resolve: number; turn: number }

export const COMMANDS: Record<Command, string> = {
  guard: 'Copri il gruppo', advance: 'Avanza con Andrea', distract: 'Crea un diversivo con Valentin',
  open: 'Apri la gabbia con Forchetta', sides: 'Riparatevi ai lati', center: 'Stringetevi al centro', strike: 'Attaccate insieme'
};

const BRIDGE = ['guard', 'advance'] as const;
const CAGES = ['guard', 'open', 'distract', 'open', 'guard', 'open'] as const;
interface Action { tell: string; success: string; actors: FriendId[] }

const ACTIONS: Record<Command, Action> = {
  guard: { tell: 'Le monete si mettono di taglio. L’acqua dietro Mamurra si solleva.', success: 'La lanterna di Claudia e la voce di Costanzo tengono unito il gruppo mentre l’onda passa.', actors: ['claudia', 'costanzo'] },
  advance: { tell: 'L’acqua ricade. Tra le due file di monete resta il passaggio che Andrea aveva indicato.', success: 'Andrea dà il via. Tutti e sette raggiungono le gabbie.', actors: ['andrea', 'valentin'] },
  distract: { tell: 'Mamurra ha gli occhi sulla serratura. Dal lato opposto il ponte è libero.', success: 'Valentin gli passa davanti. Mamurra perde di vista la gabbia.', actors: ['valentin', 'costanzo'] },
  open: { tell: 'L’onda si ferma per un battito e la prima serratura si schiude. Forchetta può raggiungerla.', success: 'Zendavid conta il battito. Forchetta tiene fermo il chiavistello e la prima gabbia si apre.', actors: ['zendavid', 'forchetta'] },
  sides: { tell: '', success: '', actors: ['valentin', 'andrea'] },
  center: { tell: 'L’ultima onda riempie i lati del ponte. Claudia vede un riparo al centro, sotto la mano di Lamo.', success: 'I sette reggono l’urto insieme. Lo scudo di Mamurra si spezza.', actors: ['claudia', 'forchetta', 'costanzo'] },
  strike: { tell: 'Le gabbie sono aperte. Lo scudo è caduto. Adesso, tutti insieme.', success: 'I sette colpiscono insieme. Mamurra perde la presa sulla Porta.', actors: [] }
};

const BY_CAGE: Partial<Record<Command, Action>>[] = [
  { guard: { tell: 'Mamurra alza una mano. Le monete si staccano dal ponte e puntano al gruppo.', success: 'Costanzo dà l’allarme. Claudia raduna gli altri dietro il parapetto finché le monete li superano.', actors: ['claudia', 'costanzo'] } },
  { open: { tell: 'Mamurra si volta verso Valentin. Per un momento tiene il braccio lontano dalla seconda gabbia.', success: 'Antonio copre Forchetta, che gli passa davanti e libera la seconda gabbia. Un’altra fila di monete cade.', actors: ['antonio', 'valentin', 'forchetta'] } },
  {
    guard: { tell: 'L’ultima fila di monete si mette di taglio. L’onda piega la passerella sotto i vostri piedi.', success: 'Andrea trova un tratto stabile. Costanzo fa segno agli altri di stringersi lì e tenersi per mano.', actors: ['andrea', 'costanzo'] },
    open: { tell: 'Claudia illumina il fermo dell’ultima gabbia. Zendavid sente il battito rallentare.', success: 'Il gruppo tiene ferma la passerella. Forchetta solleva l’ultimo fermo e l’ultima creatura esce dalla gabbia.', actors: ['claudia', 'zendavid', 'forchetta'] }
  }
];

function actionAt(battle: FinaleBattle, command: Command): Action {
  return (battle.phase === 'cages' && BY_CAGE[battle.freed]?.[command]) || ACTIONS[command];
}

export function newFinale(): FinaleBattle { return { phase: 'bridge', step: 0, freed: 0, resolve: 100, turn: 0 }; }

function expected(battle: FinaleBattle): Command {
  switch (battle.phase) {
    case 'bridge': return BRIDGE[battle.step];
    case 'cages': return CAGES[battle.step];
    case 'wave': return 'center';
    default: return 'strike';
  }
}

export function finalePrompt(battle: FinaleBattle) {
  const choices: Record<Phase, Command[]> = {
    bridge: ['advance', 'guard', 'distract'], cages: ['open', 'guard', 'distract'], wave: ['sides', 'center'], finish: ['strike'], won: [], lost: []
  };
  const threat = expected(battle);
  return { threat, tell: actionAt(battle, threat).tell, commands: choices[battle.phase] };
}

export function finaleTurn(battle: FinaleBattle, command: Command) {
  if (!finalePrompt(battle).commands.includes(command)) return null;
  const next = { ...battle, turn: battle.turn + 1 };
  const action = actionAt(battle, command);
  if (command !== expected(battle)) {
    next.resolve = Math.max(0, battle.resolve - (battle.phase === 'wave' ? 40 : 26));
    if (next.resolve === 0) next.phase = 'lost';
    const line = battle.phase === 'wave' ? 'L’acqua colpisce ai lati. L’unico riparo è l’ombra della lastra al centro.'
      : 'Mamurra respinge il gruppo. Le monete tornano nella stessa posizione.';
    return { next, success: false, line, actors: action.actors };
  }
  next.step++;
  if (command === 'open') next.freed++;
  if (next.phase === 'bridge' && next.step === BRIDGE.length) { next.phase = 'cages'; next.step = 0; }
  if (next.phase === 'cages' && next.step === CAGES.length) { next.phase = 'wave'; next.step = 0; }
  if (command === 'center') next.phase = 'finish';
  if (command === 'strike') next.phase = 'won';
  return { next, success: true, line: action.success, actors: action.actors };
}
