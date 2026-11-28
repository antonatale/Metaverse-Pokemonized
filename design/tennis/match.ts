import type { TennisCharacter } from './roster';

export type Side = 'player' | 'opponent';
export type ServiceTurn = { server: Side; side: -1 | 1; attempt: 1 | 2 };
export type TieBreak = { score: Record<Side, number>; attempt: 1 | 2; winner: Side | null };
export type TennisResult = {
  player: TennisCharacter;
  opponent: TennisCharacter;
  score: Readonly<Record<Side, number>>;
  winner: Side;
  longestRally: number;
};

export function newTieBreak(): TieBreak {
  return { score: { player: 0, opponent: 0 }, attempt: 1, winner: null };
}

export function serviceTurn(match: TieBreak): ServiceTurn {
  const points = match.score.player + match.score.opponent;
  const server = Math.floor((points + 1) / 2) % 2 === 0 ? 'player' : 'opponent';
  const side = (points % 2 === 0) === (server === 'player') ? 1 : -1;
  return { server, side, attempt: match.attempt };
}

export function awardPoint(match: TieBreak, side: Side): TieBreak {
  if (match.winner) return match;
  const score = { ...match.score, [side]: match.score[side] + 1 };
  const winner = score[side] >= 7 && Math.abs(score.player - score.opponent) >= 2 ? side : null;
  return { score, winner, attempt: 1 };
}
