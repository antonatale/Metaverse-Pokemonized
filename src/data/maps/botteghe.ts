import type { MapDef } from './types';
import { FORMIA_AT } from './formia-ground';

/* Two shops of Mola one walks into (11 November 2026): the tobacconist of Largo Paone, where Antonio's
   grandparents and his uncle Lele work, and Barber May. Antonio asked for both, by name: they are the only places of
   the town that bear the name of someone, and nothing is said of the people in them but what he told (REVISIONE.md, D2).
   The rooms are made up: nobody has measured the real ones. */
const out = (id: string): [number, number] => FORMIA_AT[id].door!;
const doors = (id: string, xs: number[], y: number) => xs.map((x) => ({ x, y, to: 'formia', tx: out(id)[0], ty: out(id)[1] + 1, tdir: 'down' as const }));

export const altieri: MapDef = {
  name: 'Tabacchi Altieri',
  city: 'formia',
  inside: true,
  rows: [
    'xxxxxxxxxx',
    'x5FFFFFF5x',
    'xkkkkkkkkx',
    'xFFFFFFFFx',
    'x5FFFFFF5x',
    'x6FFFFFFFx',
    'xFFFFFFFFx',
    'xxxxDDxxxx'
  ],
  groundObjects: [{ kind: 'banner', x: 2, y: 0, w: 6, text: 'TABACCHI', color: '#9ec5ff' }],
  signs: [
    { x: 1, y: 4, quiet: true, text: ['Lo scaffale dei quaderni e delle penne. Settembre comincia qui.'] },
    { x: 8, y: 2, quiet: true, text: ['Sul bancone: gratta e vinci, schedine, ricariche.', 'Un cartello scritto a mano: «Si vince poco, ma si spera tanto».'] },
    { x: 8, y: 4, quiet: true, text: ['La rastrelliera delle cartoline: il golfo, la Torre di Mola, la Tomba di Cicerone.'] }
  ],
  warps: doors('altieri', [4, 5], 7),
  npcs: [
    { id: 'nonna-altieri', name: 'Nonna', seed: 91, x: 3, y: 1, dir: 'down', with: 'antonio', lines: ['Antonio, a nonna! Hai mangiato?', 'Qua a Largo Paone passa tutta Formia: prima o poi li vedi tutti.', 'Vai piano con quel motorino.'] },
    { id: 'nonna-altieri-amici', name: 'La signora del tabacchi', seed: 91, x: 3, y: 1, dir: 'down', unless: 'antonio', lines: ['Tu sei un amico di Antonio, mio nipote, è vero?', 'Se lo vedi, digli che la nonna lo aspetta. E che ha mangiato poco.'] },
    { id: 'nonno-altieri', name: 'Nonno', seed: 92, look: 'nonno', x: 6, y: 1, dir: 'down', lines: ['Dietro questo bancone ne ho viste passare, di facce.', 'Il sabato, col mercato, non ci si ferma un minuto.'] },
    { id: 'zio-lele', name: 'Zio Lele', look: 'lele', x: 7, y: 5, dir: 'left', lines: ['Uè! Serve qualcosa?', 'I capelli? Li ho lasciati al mare, tanti anni fa. Si sta più freschi.', 'Se cerchi gli altri, a quest\'ora stanno tra il lungomare e Morgana.'] }
  ],
  start: [4, 6, 'up']
};

export const barberMay: MapDef = {
  name: 'Barber May',
  city: 'formia',
  inside: true,
  rows: [
    'xxxxxxxxxx',
    'x5FFFFFF6x',
    'xFFFFFFFFx',
    'xFFFFFFFFx',
    'xF4FFFFF4x',
    'xFFFFFFFFx',
    'xxxxDDxxxx'
  ],
  groundObjects: [{ kind: 'banner', x: 2, y: 0, w: 6, text: 'BARBER MAY', color: '#ff9a8b' },
    { kind: 'home-prop', x: 2, y: 1, w: 1, h: 1, text: 'mirror' }, { kind: 'home-prop', x: 5, y: 1, w: 1, h: 1, text: 'mirror' },
    { kind: 'home-prop', x: 2, y: 2, w: 1, h: 1, text: 'barber-chair' }, { kind: 'home-prop', x: 5, y: 2, w: 1, h: 1, text: 'barber-chair' }],
  signs: [
    { x: 2, y: 2, quiet: true, text: ['La poltrona da barbiere, davanti allo specchio.', 'Sulla mensola: forbici, pettini, il rasoio e la macchinetta.'] },
    { x: 5, y: 2, quiet: true, text: ['La seconda poltrona. Sullo specchio, una foto del golfo.'] },
    { x: 2, y: 1, quiet: true, text: ['Lo specchio. Il ciuffo, per ora, regge.'] },
    { x: 5, y: 1, quiet: true, text: ['Lo specchio, con le lampadine intorno come in un camerino.'] },
    { x: 1, y: 1, quiet: true, text: ['Lozioni, cere e dopobarba, in fila come soldati.'] },
    { x: 1, y: 4, quiet: true, text: ['Il divanetto di chi aspetta: una pila di giornali sportivi, tutti di lunedì.'] }
  ],
  warps: doors('barber-may', [4, 5], 6),
  npcs: [
    { id: 'barbiere', name: 'Il barbiere', seed: 93, x: 3, y: 2, dir: 'down', lines: ['Accomodati! Sfumatura alta o bassa?', 'Qui a Mola si viene per i capelli e si resta per le chiacchiere.', 'Con questo vento, il ciuffo dura fino al lungomare. Poi sono affari tuoi.'] },
    { id: 'cliente-barbiere', name: 'Uno che aspetta', seed: 94, x: 7, y: 4, dir: 'left', lines: ['Sto qua da un\'ora. Ma tanto, dove devo andare?'] }
  ],
  start: [4, 5, 'up']
};
