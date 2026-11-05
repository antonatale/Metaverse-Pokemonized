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
  'Gianola': 'gianola'
};
const BY_MAP: Record<string, string> = { casa: 'castellonorato', circolo: 'campo', morgana: 'birreria', cisterna: 'cisterna', telepilo: 'castellone' };
/** the scene behind a battle on that map, in that part of town */
export function sceneFor(map: string, area: string | null): string {
  return BY_MAP[map] || (area && BY_AREA[area]) || 'porto';
}
