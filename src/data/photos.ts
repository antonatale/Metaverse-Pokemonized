import porto from '../assets/photos/porto.jpg';
import castellone from '../assets/photos/castellone.jpg';
import maranola from '../assets/photos/maranola.jpg';
import castellonorato from '../assets/photos/castellonorato.jpg';
import gianola from '../assets/photos/gianola.jpg';

/* Real photos of Formia, taken from the ground, behind the story's battles: the one of the part of town where the
   battle is. All of them are free of copyright on Wikimedia Commons (public domain or CC0); the credit is shown
   in the corner of the battle anyway. */
export interface Photo { src: string; title: string; author: string; license: string; page: string }
export const PHOTOS: Record<string, Photo> = {
  porto: { src: porto, title: 'Il porto di Formia', author: 'Dom dom 70', license: 'pubblico dominio', page: 'https://commons.wikimedia.org/wiki/File:Formia_-_Il_Porto.JPG' },
  castellone: { src: castellone, title: 'La Porta dell\'Orologio, Castellone', author: 'Dom dom 70', license: 'pubblico dominio', page: 'https://commons.wikimedia.org/wiki/File:Formia_-_Arco_della_Porta_dell%27Orologio.jpg' },
  maranola: { src: maranola, title: 'Formia dal borgo di Maranola', author: 'Dom dom 70', license: 'pubblico dominio', page: 'https://commons.wikimedia.org/wiki/File:Formia_-_Panorama_dal_Borgo_di_Maranola.JPG' },
  castellonorato: { src: castellonorato, title: 'Il golfo al tramonto da Castellonorato', author: 'Dom dom 70', license: 'pubblico dominio', page: 'https://commons.wikimedia.org/wiki/File:Formia_-_Panorama_al_Tramonto_da_Castellonorato.JPG' },
  gianola: { src: gianola, title: 'La cisterna della villa di Mamurra, Gianola', author: 'rafle50', license: 'CC0', page: 'https://commons.wikimedia.org/wiki/File:Cistern_villa_mamurra.jpg' }
};
/** which photo for each part of town (the names of the areas of formia.ts), and for the inside of places */
const BY_AREA: Record<string, string> = {
  'Porto': 'porto', 'Centro': 'porto', 'Mola': 'porto', 'Caposele': 'porto', 'Vindicio': 'porto', 'Eclipse beach': 'porto', 'Pineta di Vindicio': 'porto',
  'Birreria Morgana': 'porto', 'Piazza della Vittoria': 'porto', 'Stazione': 'porto', 'Gelateria Lavezzi': 'porto', 'Piazza San Giovanni': 'porto',
  'Castellone': 'castellone',
  'Monti Aurunci': 'maranola', 'Rio Fresco': 'maranola', 'Campagna': 'maranola', 'Tomba di Cicerone': 'maranola',
  'Via Amendola': 'castellonorato', 'Acqualonga': 'castellonorato', 'Santo Janni': 'castellonorato', 'Parco la Fontana': 'castellonorato',
  'Bruno Zauli': 'castellonorato', 'Parco Gramsci': 'castellonorato', 'Villaggio Don Bosco': 'castellonorato',
  'Gianola': 'gianola'
};
const BY_MAP: Record<string, string> = { casa: 'castellonorato', circolo: 'castellonorato', morgana: 'porto' };
/** the photo behind a battle on that map, in that part of town */
export function photoFor(map: string, area: string | null): string {
  return BY_MAP[map] || (area && BY_AREA[area]) || 'porto';
}
