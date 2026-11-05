/* What a creature brings to a battle besides its moves: the states it can fall into, the ability of its kind and the
   thing it carries. Only data: battle/passives.ts does what these say, so a new one is a line here, not engine work.
   Only the creatures have them, so the free battles between friends stay exactly as they were. */

/* ---------- the states: one at a time, on top of the confusion that was already there ---------- */
export type StatusId = 'sole' | 'siesta' | 'rete';
export interface Status {
  id: StatusId;
  name: string;
  /** an icon of ui/icons.ts */
  icon: string;
  /** what the battle says when it comes and when it goes; {n} is who */
  got: string;
  over: string;
  /** what it does, in words */
  text: string;
  /** how many turns, from and to */
  turns: [number, number];
  /** share of the full health lost at the end of each turn */
  burn?: number;
  /** its Attack and its Speed are multiplied by this */
  atk?: number;
  spe?: number;
  /** it loses its turns; a hit wakes it */
  sleep?: boolean;
  /** it cannot change */
  trap?: boolean;
}
export const STATUS: Record<StatusId, Status> = {
  sole: { id: 'sole', name: 'Colpo di sole', icon: 'flame', turns: [4, 4], burn: 1 / 12, atk: 0.75,
    got: '{n} prende un colpo di sole!', over: '{n} si riprende dal caldo.', text: 'Perde PS a ogni turno e l\'Attacco cala del 25%.' },
  siesta: { id: 'siesta', name: 'Siesta', icon: 'mute', turns: [1, 3], sleep: true,
    got: '{n} crolla in una siesta!', over: '{n} si sveglia.', text: 'Dorme e perde il turno. Un colpo lo sveglia.' },
  rete: { id: 'rete', name: 'Rete', icon: 'net', turns: [3, 3], spe: 0.8, trap: true,
    got: '{n} resta impigliato!', over: '{n} si libera.', text: 'Non può cambiare, e la Velocità cala del 20%.' }
};

/* ---------- abilities and held things: when something happens, if something holds, do something ---------- */
export type StatFx = 'atkUp' | 'defUp' | 'atkDown' | 'defDown';
/** when it may fire. Every condition has to hold; a `once` one fires one time in a battle */
export interface PassiveIf {
  /** in the dark */
  night?: boolean;
  /** it acted before the foe this turn */
  first?: boolean;
  /** one time in a battle */
  once?: boolean;
  /** with less than this share of its full health left */
  below?: number;
  /** the hit comes from the type that beats the creature's own */
  weak?: boolean;
}
export interface PassiveDo {
  /** share of the full health it gets back */
  heal?: number;
  /** share of the damage just done that it gets back */
  drain?: number;
  /** share of the attacker's full health it costs the attacker */
  thorn?: number;
  /** a number going down on the foe, or up on itself; for fewer turns than a move, which costs a turn and this does not */
  foe?: StatFx;
  self?: StatFx;
  turns?: number;
  /** a state put on the foe */
  status?: StatusId;
  /** its own state goes away */
  cure?: boolean;
}
export interface PassiveOn {
  /** coming on, after hitting, after being hit, at the end of the turn */
  when: 'enter' | 'hit' | 'hurt' | 'turn';
  if?: PassiveIf;
  do: PassiveDo;
}
export interface Passive {
  id: string;
  name: string;
  text: string;
  on?: PassiveOn[];
  /** numbers it changes, multiplied in: Speed, damage done, damage taken */
  spe?: number;
  dealt?: number;
  taken?: number;
  /** when those numbers count */
  if?: PassiveIf;
  /** states that do not take; with `once` in `if`, the first one is stopped and it is spent */
  blocks?: StatusId[] | 'all';
}

/* each kind has one, in the character of the animal; the last forms a second one */
export const ABILITIES: Record<string, Passive> = {
  ventose: { id: 'ventose', name: 'Ventose', text: 'La prima volta che scende sotto la metà dei PS, l\'Attacco sale per 3 turni.',
    on: [{ when: 'hurt', if: { below: 0.5, once: true }, do: { self: 'atkUp', turns: 3 } }] },
  coda: { id: 'coda', name: 'Coda che ricresce', text: 'Una volta a lotta, sotto il 30% dei PS, ne recupera il 15%.',
    on: [{ when: 'hurt', if: { below: 0.3, once: true }, do: { heal: 0.15 } }] },
  ladro: { id: 'ladro', name: 'Ladro di panini', text: 'Se colpisce prima dell\'altro, si riprende un quarto del danno.',
    on: [{ when: 'hit', if: { first: true }, do: { drain: 0.25 } }] },
  frinire: { id: 'frinire', name: 'Frinire d\'agosto', text: 'Quando entra in campo, l\'Attacco avversario cala per 2 turni.',
    on: [{ when: 'enter', do: { foe: 'atkDown', turns: 2 } }] },
  occhi: { id: 'occhi', name: 'Occhi di notte', text: 'Di notte è più veloce del 30%.', spe: 1.3, if: { night: true } },
  corazza: { id: 'corazza', name: 'Corazza', text: 'Il primo colpo che subisce fa il 30% in meno.', taken: 0.7, if: { once: true } },
  radici: { id: 'radici', name: 'Radici', text: 'Recupera il 4% dei PS a ogni turno.',
    on: [{ when: 'turn', do: { heal: 0.04 } }] },
  aculei: { id: 'aculei', name: 'Aculei', text: 'Chi lo colpisce perde il 6% dei suoi PS.',
    on: [{ when: 'hurt', do: { thorn: 0.06 } }] },
  /* the last forms */
  oratoria: { id: 'oratoria', name: 'Oratoria', text: 'Quando entra in campo, la Difesa avversaria cala per 2 turni.',
    on: [{ when: 'enter', do: { foe: 'defDown', turns: 2 } }] },
  mura: { id: 'mura', name: 'Mura di Telepilo', text: 'Subisce il 10% di danni in meno.', taken: 0.9 },
  poppa: { id: 'poppa', name: 'Vento in poppa', text: 'È più veloce del 10%.', spe: 1.1 },
  /* the kinds that came later: each one out of its animal */
  filamenti: { id: 'filamenti', name: 'Filamenti', text: 'La prima volta che la colpiscono, chi l\'ha colpita resta impigliato.',
    on: [{ when: 'hurt', if: { once: true }, do: { status: 'rete' } }] },
  punte: { id: 'punte', name: 'Punte che ricrescono', text: 'Una volta a lotta, sotto il 30% dei PS, ne recupera il 15%.',
    on: [{ when: 'hurt', if: { below: 0.3, once: true }, do: { heal: 0.15 } }] },
  tana: { id: 'tana', name: 'Tana', text: 'Il primo colpo che subisce fa il 30% in meno.', taken: 0.7, if: { once: true } },
  salto: { id: 'salto', name: 'Salto fuori dall\'acqua', text: 'Quando entra in campo, l\'Attacco sale per 2 turni.',
    on: [{ when: 'enter', do: { self: 'atkUp', turns: 2 } }] },
  ira: { id: 'ira', name: 'Ira repressa', text: 'La prima volta che scende sotto la metà dei PS, l\'Attacco sale per 3 turni.',
    on: [{ when: 'hurt', if: { below: 0.5, once: true }, do: { self: 'atkUp', turns: 3 } }] },
  luce: { id: 'luce', name: 'Luce propria', text: 'Di notte recupera il 4% dei PS a ogni turno.',
    on: [{ when: 'turn', if: { night: true }, do: { heal: 0.04 } }] },
  buio: { id: 'buio', name: 'Amico del buio', text: 'Di notte e nei luoghi bui colpisce il 15% più forte.', dealt: 1.15, if: { night: true } },
  bassa: { id: 'bassa', name: 'Testa bassa', text: 'Il primo colpo della lotta fa il 20% in più.', dealt: 1.2, if: { once: true } },
  falco: { id: 'falco', name: 'Occhio di falco', text: 'Se colpisce prima dell\'altro, fa il 15% in più.', dealt: 1.15, if: { first: true } },
  maggio: { id: 'maggio', name: 'Sole di maggio', text: 'Il primo colpo che mette a segno dà un colpo di sole.',
    on: [{ when: 'hit', if: { once: true }, do: { status: 'sole' } }] },
  casa: { id: 'casa', name: 'Casa sulle spalle', text: 'Subisce il 10% di danni in meno.', taken: 0.9 },
  /* the legends */
  gigante: { id: 'gigante', name: 'Re dei giganti', text: 'Non cade negli stati alterati.', blocks: 'all' },
  leggenda: { id: 'leggenda', name: 'Leggenda di Formia', text: 'Non cade negli stati alterati.', blocks: 'all' }
};

/* one thing to a creature; it comes back after the battle */
export type HeldId = 'fetta' | 'ciambella' | 'oliva' | 'cozza' | 'corno';
export const HELD: Record<HeldId, Passive> = {
  fetta: { id: 'fetta', name: 'Fetta di tiella', text: 'Sotto il 25% dei PS la mangia, e ne recupera il 30%. Una volta a lotta.',
    on: [{ when: 'hurt', if: { below: 0.25, once: true }, do: { heal: 0.3 } }] },
  ciambella: { id: 'ciambella', name: 'Ciambella all\'anice', text: 'Velocità +10%.', spe: 1.1 },
  oliva: { id: 'oliva', name: 'Oliva di Gaeta', text: 'Una volta a lotta, un colpo del tipo che batte il suo fa il 25% in meno.', taken: 0.75, if: { once: true, weak: true } },
  cozza: { id: 'cozza', name: 'Cozza', text: 'Ferma il primo stato alterato.', blocks: 'all', if: { once: true } },
  corno: { id: 'corno', name: 'Corno di mare', text: 'Il primo colpo della lotta fa il 20% in più.', dealt: 1.2, if: { once: true } }
};
