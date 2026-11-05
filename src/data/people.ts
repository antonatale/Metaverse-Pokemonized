import { CHARS, type Character, type FriendId, type Move, type Stats } from './characters';
import type { SpeciesId } from './creatures';

/* The people grow too. Only in the story: in the free battles the six friends are the ones in data/characters.ts, whole
   from the first turn, and the golden battles do not change. In the story they start with two moves and find the others
   going up, as the creatures do; at two levels they change form, with new clothes (render/svg/forms.ts) and a title, and
   they learn moves of their own that nobody has in the free battles. The moves are numbers, done by genericMove.
   Who starts must never be left with nothing to do: Antonio can lose an object, which locks a move, so his first two are
   both blows with no limit of uses (tests/unit/people.test.ts). */

/** what a blow looks like, for someone who has no magic to cast: an animation of the battle screen, with its words */
export interface PersonForm { at: number; title: string; text: string }
export interface PersonPath {
  /** the moves it learns, by level: it fights with the last four */
  learn: [number, string][];
  /** the moves nobody else has */
  moves: Move[];
  /** the two forms after the first one */
  forms: [PersonForm, PersonForm];
}
const atk = (id: string, name: string, power: number, text: string, o: Partial<Move> = {}): Move => ({ id, name, kind: 'atk', power, text, ...o });

export const PATHS: Record<FriendId, PersonPath> = {
  antonio: {
    learn: [[5, 'diagnosi'], [5, 'simtoreal'], [7, 'certificati'], [10, 'america'], [14, 'paper'], [20, 'gradiente'], [26, 'chicago']],
    moves: [
      atk('paper', 'Paper su arXiv', 75, 'Lo pubblica di notte, prima di tutti: danno alto, e la Difesa avversaria cala per 4 turni.', { fx: { foe: 'defDown' } }),
      { id: 'gradiente', name: 'Discesa del Gradiente', kind: 'buff', text: 'Ottimizza tutto, un passo alla volta: l\'Attacco sale per 5 turni.', fx: { self: 'atkUp' } },
      atk('chicago', 'Volo per Chicago', 130, 'Un turno per il check-in, poi atterra sull\'avversario: danno enorme, ma si vede arrivare.', { twoTurn: true, windup: '{n} fa il check-in: al prossimo turno atterra a Chicago!', show: { a: 'banner', text: 'CHICAGO!', style: 'usa' } })
    ],
    forms: [
      { at: 14, title: 'Il Ricercatore', text: 'Camice bianco sopra la felpa, e il robot ha smesso di cadere. Quasi.' },
      { at: 26, title: 'Stato dell\'Arte', text: 'La giacca buona e la catena d\'oro: quando parla, stanno a sentire anche a Chicago.' }
    ]
  },
  costanzo: {
    learn: [[5, 'comizio'], [5, 'bidet'], [7, 'daje'], [10, 'personaggismo'], [14, 'mozione'], [20, 'decreto'], [26, 'elezioni']],
    moves: [
      atk('mozione', 'Mozione di Sfiducia', 75, 'La presenta in aula: danno alto, e una volta su tre l\'avversario resta confuso.', { fx: { conf: 0.33 } }),
      atk('decreto', 'Decreto d\'Urgenza', 60, 'Niente dibattito: colpisce per primo.', { priority: 1 }),
      atk('elezioni', 'Elezioni Anticipate', 110, 'Scioglie tutto e si va al voto: danno enorme, va a segno 8 volte su 10.', { acc: 0.8, show: { a: 'banner', text: 'SI VOTA!', style: 'roma' } })
    ],
    forms: [
      { at: 14, title: 'L\'Onorevole', text: 'Giacca, cravatta e la stessa voce di prima. Più forte.' },
      { at: 26, title: 'Er Presidente', text: 'La fascia tricolore: adesso i comizi li fanno gli altri, per lui.' }
    ]
  },
  andrea: {
    learn: [[5, 'analisi'], [5, 'palestra'], [7, 'volpino'], [10, 'cucinato'], [14, 'foglio'], [20, 'smash'], [26, 'picchiata2']],
    moves: [
      atk('foglio', 'Foglio di Calcolo', 75, 'Tutto in tabella, punti deboli compresi: danno alto, critico più facile (25%).', { crit: 0.25 }),
      atk('smash', 'Smash a Padel', 85, 'Sopra la rete, a tutta forza: danno alto, e la Difesa avversaria cala per 4 turni.', { acc: 0.9, fx: { foe: 'defDown' } }),
      atk('picchiata2', 'Picchiata del Volpino', 110, 'Dall\'alto, con le ali aperte: danno enorme, va a segno 85 volte su 100.', { acc: 0.85, show: { a: 'fox' } })
    ],
    forms: [
      { at: 14, title: 'Il Volpino', text: 'La tuta arancione del padel: adesso si vede da lontano. Lui ti ha già calcolato.' },
      { at: 26, title: 'Il Volpino Alato', text: 'Le ali sul petto non sono un disegno. Dicono.' }
    ]
  },
  valentin: {
    learn: [[5, 'weee'], [5, 'king'], [7, 'manipolazione'], [10, 'copenhagen'], [14, 'trenino'], [20, 'afterparty'], [26, 'festona']],
    moves: [
      atk('trenino', 'Trenino', 75, 'Tutti in fila dietro di lui: danno alto, e una volta su tre confonde.', { fx: { conf: 0.33 } }),
      { id: 'afterparty', name: 'Afterparty', kind: 'heal', uses: 2, text: 'La festa continua da lui: recupera il 30% dei PS e la Difesa sale per 5 turni.', fx: { heal: 0.3, self: 'defUp' } },
      atk('festona', 'La Festa dell\'Anno', 110, 'Vengono tutti: danno enorme, e si riprende un quarto del danno. Va a segno 85 volte su 100.', { acc: 0.85, drain: 0.25, show: { a: 'confetti' } })
    ],
    forms: [
      { at: 14, title: 'L\'Animale', text: 'Giacca maculata, e nessuno sa dove l\'ha trovata. Nemmeno lui.' },
      { at: 26, title: 'Il King del Verde', text: 'Tutto verde, dalla giacca agli occhiali. La festa adesso è sua.' }
    ]
  },
  forchetta: {
    learn: [[5, 'servizio'], [5, 'pitstop'], [7, 'formia'], [10, 'criptico'], [14, 'volee'], [20, 'play'], [26, 'matchpoint']],
    moves: [
      atk('volee', 'Volée', 70, 'A rete, prima che tu capisca: colpisce per primo, anche lui.', { priority: 1 }),
      { id: 'play', name: 'Partita alla Play', kind: 'status', text: 'Ti convince a fare una partita: l\'Attacco avversario cala per 5 turni.', fx: { foe: 'atkDown' } },
      atk('matchpoint', 'Match Point', 110, 'Il punto che chiude tutto: danno enorme, va a segno 8 volte su 10, critico più facile (25%).', { acc: 0.8, crit: 0.25, show: { a: 'banner', text: 'MATCH POINT!', style: 'formia' } })
    ],
    forms: [
      { at: 14, title: 'Forchetta da Torneo', text: 'La polo bianca dei tornei. Poteva andare peggio.' },
      { at: 26, title: 'Il Più Formiano', text: 'Bianco e azzurro, come la fascia di Forza Formia. Non poteva andare meglio.' }
    ]
  },
  zendavid: {
    learn: [[5, 'abbaia'], [5, 'zen'], [7, 'stronger'], [10, 'battuta'], [14, 'campione'], [20, 'remix'], [26, 'drop']],
    moves: [
      atk('campione', 'Campionamento', 75, 'Prende un pezzo della tua mossa e ci fa un pezzo suo: danno alto.'),
      { id: 'remix', name: 'Remix', kind: 'buff', text: 'Rifà tutto da capo, meglio: l\'Attacco sale per 5 turni.', fx: { self: 'atkUp' } },
      atk('drop', 'Il Drop', 130, 'Un turno per alzare il volume, poi crolla tutto: danno enorme, ma si vede arrivare.', { twoTurn: true, windup: '{n} alza il volume: al prossimo turno parte il drop!', show: { a: 'notes' } })
    ],
    forms: [
      { at: 14, title: 'DJ Zendavid', text: 'La giacca nera e le cuffie più grosse di Formia.' },
      { at: 26, title: 'Il Maestro Zen', text: 'Bianco, calmo, senza ansia. Quasi.' }
    ]
  }
};
export function isFriend(id: string): id is FriendId { return Object.prototype.hasOwnProperty.call(PATHS, id); }

/** how a friend comes into the company: beating its covo, or doing its activity together (`activity`). Everyone is a
    protagonist, with a team of its own: it comes with its first creature, of its own type */
export const JOIN: Record<Exclude<FriendId, 'antonio'>, { sp: SpeciesId; lv: number; activity?: string; say?: string[] }> = {
  costanzo: { sp: 'cicalina', lv: 6 },
  forchetta: { sp: 'lumacotta', lv: 9 },
  andrea: { sp: 'stellina', lv: 8, activity: 'padel', say: ['Ho calcolato che con te perdo meno tempo. Vengo.', 'Questa stella l\'ho trovata sugli scogli: è di tipo Cervello, come me.'] },
  valentin: { sp: 'cinghialetto', lv: 8, activity: 'volley', say: ['Weee! Da oggi la festa si sposta dove vai tu.', 'Lui è il mio cinghialetto. Non chiedere.'] },
  zendavid: { sp: 'olivella', lv: 8, activity: 'corsa', say: ['Bau. Se corri così, vengo con te.', 'Questa Olivella ascolta la musica con me. Non si lamenta mai.'] }
};
/** how far a form takes the numbers: the people have no second form of a kind to get them from, as the creatures do */
export const FORM_STATS = [1, 1.08, 1.16];
/** the form at a level: 0, 1 or 2 */
export function formAt(id: FriendId, lv: number): number { return PATHS[id].forms.filter(function (f) { return lv >= f.at; }).length; }
export function withForm(s: Stats, form: number): Stats {
  const k = FORM_STATS[form];
  return { hp: Math.round(s.hp * k), atk: Math.round(s.atk * k), def: Math.round(s.def * k), spe: Math.round(s.spe * k) };
}
/** the moves a person knows at a level: the last four it has learned */
export function personKnows(id: FriendId, lv: number): string[] { return PATHS[id].learn.filter(function (l) { return l[0] <= lv; }).map(function (l) { return l[1]; }).slice(-4); }
/** the moves it learns exactly at a level */
export function personLearns(id: FriendId, lv: number): string[] { return PATHS[id].learn.filter(function (l) { return l[0] === lv; }).map(function (l) { return l[1]; }); }

/** a friend as the story has it: the same one, with every move it can come to know (the side says which it knows) */
const grown: Partial<Record<FriendId, Character>> = {};
export function grownChar(id: FriendId): Character {
  return grown[id] || (grown[id] = Object.assign({}, CHARS[id], { moves: CHARS[id].moves.concat(PATHS[id].moves) }));
}
/** a person's move, from its id */
export function personMove(id: string): Move | null {
  for (const k in PATHS) for (const m of grownChar(k as FriendId).moves) if (m.id === id) return m;
  return null;
}
