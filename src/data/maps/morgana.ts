import type { MapDef } from './types';
import { FORMIA_AT } from './formia-ground';

/* back out in via Tullia, in front of the pub */
const out = FORMIA_AT.morgana.door!;

/* Inside the Birreria Morgana: the counter with the taps (the host behind it runs the quiz), the little stage with
   the microphone, wooden tables. Claudia keeps her table here: it is her covo. When Costanzo has joined the squad,
   he holds court at another table. */
export const morgana: MapDef = {
  name: 'Birreria Morgana',
  city: 'formia',
  inside: true,
  rows: [
    'xxxxxxxxxxxx',
    'xFFFFFFxsssx',
    'xkkkkkkxsmsx',
    'xFFFFFFFFFFx',
    'xFtFFtFFFtFx',
    'xFFFFFFFFFFx',
    'xFtFFtFFFtFx',
    'xFFFFFFFFFFx',
    'xxxxxDDxxxxx'
  ],
  groundObjects: [{ kind: 'banner', x: 1, y: 0, w: 6, text: 'MORGANA', color: '#ffd166' }],
  signs: [
    { x: 9, y: 2, quiet: true, text: ['Il palco, con il microfono.', 'Stasera: quiz su Formia. Chiedi al bancone.'] },
    { x: 2, y: 2, quiet: true, text: ['Le spine della birra: bionda, rossa, e una artigianale che cambia ogni mese.'] },
    { x: 9, y: 4, quiet: true, text: ['Sul tavolo, una tiella da dividere e quattro boccali vuoti.'] }
  ],
  warps: [{ x: 5, y: 8, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' }, { x: 6, y: 8, to: 'formia', tx: out[0], ty: out[1] + 1, tdir: 'down' }],
  npcs: [
    { id: 'oste', name: 'Al bancone', seed: 82, x: 4, y: 1, dir: 'down', activity: 'quiz', lines: ['Benvenuti da Morgana!', 'Avete un tavolo? Stasera c\'è il quiz.'] },
    { id: 'costanzo-morgana', person: 'costanzo', name: 'costanzo', x: 3, y: 5, dir: 'up', beaten: 'piazza', lines: ['GIÀ LO SAI: stasera qui da Morgana offro io.', 'Anzi no. Facciamo alla romana.'] },
    { id: 'claudia', person: 'claudia', x: 7, y: 5, dir: 'left', covo: 'morgana', unless: 'claudia' },
    { id: 'avventore', name: 'Avventore', seed: 84, x: 8, y: 6, dir: 'left', lines: ['La domanda su Mamurra la sbagliano tutti.', 'Io no. Io l\'ho sbagliata solo tre volte.'] }
  ],
  start: [5, 7, 'up']
};
