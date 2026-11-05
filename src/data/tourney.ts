import type { FriendId } from './characters';

/* The friends' tournament at the Centro Bruno Zauli: once both covi of Formia are won, the friends meet Antonio's
   company on the track one after the other, each a little stronger, Costanzo and Forchetta last (the rematches).
   Won once, it starts again: every edition after the first, everyone is STEP levels higher. */
export interface Round { who: FriendId; lv: number; line: string }
export const TOURNEY = {
  name: 'Torneo degli amici',
  /* sesterzi and experience for the cup, the first time and every time */
  prize: 120,
  step: 3,
  rounds: [
    { who: 'andrea', lv: 12, line: 'Ho studiato le tue statistiche. Ti conviene ritirarti.' },
    { who: 'valentin', lv: 14, line: 'Weee! Torneo! Chi perde paga da bere.' },
    { who: 'zendavid', lv: 16, line: 'Cuffie in testa, modalità zen. Vieni.' },
    { who: 'costanzo', lv: 18, line: 'Rivincita, {hero}: stavolta il comizio lo finisco io.' },
    { who: 'forchetta', lv: 20, line: 'La finale. Poteva andare peggio: potevi non arrivarci.' }
  ] as Round[]
};
/** the rounds of an edition (0 is the first): the same friends, STEP levels higher each time */
export function roundsOf(edition: number): Round[] {
  return TOURNEY.rounds.map(function (r) { return { who: r.who, lv: r.lv + edition * TOURNEY.step, line: r.line }; });
}
