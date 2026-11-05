/* «Un giorno a Formia»: a short run, a day in town from the morning to the night. Only data: src/day/plan.ts turns it, with
   a seed, into the same day for everyone. */

export interface DayFloor {
  /** the hour of the day and the place, as the player reads them */
  name: string;
  /** the drawn scene behind the battle (render/svg/scenes.ts) */
  scene: string;
  /** the table of creatures it draws from (data/encounters.ts) */
  table: string;
  /** how many creatures the foe has; one alone is a wild one */
  foes: number;
  /** who sends them in, with more than one */
  who?: string;
  /** how well they play their team (data/trainers.ts) */
  smart?: number;
  /** it is dark: the moves and the abilities of the night count, and the scene is drawn by night */
  night?: boolean;
  /** the last one: a legend, in parts */
  boss?: boolean;
}

export const DAY_FLOORS: DayFloor[] = [
  { name: 'La mattina a Gianola', scene: 'gianola', table: 'gianola', foes: 1 },
  { name: 'Le dieci, in pineta', scene: 'pineta', table: 'pineta', foes: 2, who: 'Un ragazzo della pineta' },
  { name: 'Mezzogiorno alla Scogliera', scene: 'vindicio', table: 'scogliera', foes: 2, who: 'Una bagnante della Scogliera' },
  { name: 'Il pomeriggio agli uliveti', scene: 'castellonorato', table: 'ulivi', foes: 3, who: 'Una contadina degli uliveti', smart: 1 },
  { name: 'Le cinque, sui monti', scene: 'maranola', table: 'monti', foes: 3, who: 'Un pastore dei Monti Aurunci', smart: 1 },
  { name: 'Il tramonto al porto', scene: 'porto', table: 'mare', foes: 3, who: 'Un pescatore di Mola', smart: 1 },
  { name: 'La sera a Castellone', scene: 'castellone', table: 'mura', foes: 3, who: 'Il custode delle mura', smart: 2, night: true },
  { name: 'La notte', scene: 'gianola', table: '', foes: 1, boss: true, night: true }
];
export const DAY_TUNE = {
  /** the level the day starts at, and how much a floor is worth, to the team and to the foes */
  start: 10, perFloor: 2,
  /** the foes are this many levels below the team: three creatures against all the day, with what is left of their health */
  under: 4,
  /** the legend at the end has this share of its health: it stands alone against what is left of a team of the day, not
      against six last forms, and with its level it would show a number that a legend should not have */
  bossHp: 0.6,
  /** what is left of the team's health comes back this much between floors */
  rest: 0.3,
  /** what the heal among the rewards gives back, to everyone, those who are down included */
  heal: 0.5,
  /** the most creatures in the team */
  team: 6,
  /** levels from the reward */
  levels: 3,
  /** the score of a floor: won, with what is left of the team's health, with a bonus for each turn under `par` */
  floor: 100, health: 50, turn: 2, par: 20
};
/** the abilities on offer as a reward, one more for a creature: those that are good on anyone */
export const DAY_ABILITIES = ['ventose', 'coda', 'ladro', 'frinire', 'corazza', 'radici', 'aculei', 'salto', 'falco', 'bassa'];
