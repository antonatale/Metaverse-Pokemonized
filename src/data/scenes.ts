import type { TypeName } from './types';

/* Which drawn scene of Formia (render/svg/scenes.ts) is behind a story battle: the one of the part of town where
   Antonio is when it starts, or of the place he is inside. */
const BY_AREA: Record<string, string> = {
  'Porto': 'porto', 'Caposele': 'caposele',
  'Vindicio': 'vindicio', 'Eclipse beach': 'vindicio', 'Pineta di Vindicio': 'pineta',
  'Mola': 'mola', 'Birreria Morgana': 'mola', 'Piazza San Giovanni': 'mola',
  'Centro': 'centro', 'Piazza della Vittoria': 'centro', 'Stazione': 'centro', 'Gelateria Lavezzi': 'centro',
  'Castellone': 'castellone',
  'Monti Aurunci': 'maranola', 'Rio Fresco': 'maranola', 'Campagna': 'maranola', 'Tomba di Cicerone': 'maranola',
  'Via Amendola': 'castellonorato', 'Acqualonga': 'castellonorato', 'Santo Janni': 'castellonorato', 'Parco la Fontana': 'castellonorato',
  'Bruno Zauli': 'castellonorato', 'Parco Gramsci': 'castellonorato', 'Villaggio Don Bosco': 'castellonorato',
  'Gianola': 'gianola', 'Lido Oriente': 'gianola'
};
const BY_MAP: Record<string, string> = { casa: 'castellonorato', circolo: 'campo', morgana: 'birreria', cisterna: 'cisterna', telepilo: 'castellone' };
/** the magic of a place: a part of town has a type of its own, stronger there (data/tuning.ts FIELD_TUNE) and what a creature
    can take with Risonanza. `name` comes after «la magia». The fights of the friends, indoors, have none */
export const PLACE_MAGIC: Record<string, { type: TypeName; name: string }> = {
  castellone: { type: 'Calma', name: 'di Castellone' }, gianola: { type: 'Cervello', name: 'di Gianola' }, porto: { type: 'Caos', name: 'del porto' },
  pineta: { type: 'Chiacchiera', name: 'della pineta' }, castellonorato: { type: 'Cuore', name: 'degli uliveti' }, vindicio: { type: 'Calore', name: 'di Vindicio' },
  mola: { type: 'Corrente', name: 'di Mola' }, caposele: { type: 'Corrente', name: 'di Caposele' }, maranola: { type: 'Cielo', name: 'dei Monti Aurunci' },
  centro: { type: 'Corazza', name: 'di piazza della Vittoria' }, cisterna: { type: 'Crepuscolo', name: 'del Cisternone' }
};
/** the scene behind a battle on that map, in that part of town */
export function sceneFor(map: string, area: string | null): string {
  return BY_MAP[map] || (area && BY_AREA[area]) || 'porto';
}
