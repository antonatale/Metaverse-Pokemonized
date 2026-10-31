import porto from '../assets/photos/porto.jpg';
import castellone from '../assets/photos/castellone.jpg';
import maranola from '../assets/photos/maranola.jpg';
import castellonorato from '../assets/photos/castellonorato.jpg';
import gianola from '../assets/photos/gianola.jpg';
import vindicio from '../assets/photos/vindicio.jpg';
import caposele from '../assets/photos/caposele.jpg';
import mola from '../assets/photos/mola.jpg';
import centro from '../assets/photos/centro.jpg';

/* Real photos of Formia, taken from the ground, behind the story's battles: the one of the part of town where the
   battle is. All of them are on Wikimedia Commons under free licences: public domain, or Creative Commons with
   attribution (CC BY, CC BY-SA), which is why the credit (title, author, licence, link to the file) is shown under
   the turn counter in every battle. They are only made smaller and compressed for the game. */
export interface Photo { src: string; title: string; author: string; license: string; page: string }
export const PHOTOS: Record<string, Photo> = {
  porto: { src: porto, title: 'Il porto di Formia', author: 'Dom dom 70', license: 'pubblico dominio', page: 'https://commons.wikimedia.org/wiki/File:Formia_-_Il_Porto.JPG' },
  castellone: { src: castellone, title: 'La Porta dell\'Orologio, Castellone', author: 'Dom dom 70', license: 'pubblico dominio', page: 'https://commons.wikimedia.org/wiki/File:Formia_-_Arco_della_Porta_dell%27Orologio.jpg' },
  maranola: { src: maranola, title: 'Formia dal borgo di Maranola', author: 'Dom dom 70', license: 'pubblico dominio', page: 'https://commons.wikimedia.org/wiki/File:Formia_-_Panorama_dal_Borgo_di_Maranola.JPG' },
  castellonorato: { src: castellonorato, title: 'Il golfo al tramonto da Castellonorato', author: 'Dom dom 70', license: 'pubblico dominio', page: 'https://commons.wikimedia.org/wiki/File:Formia_-_Panorama_al_Tramonto_da_Castellonorato.JPG' },
  gianola: { src: gianola, title: 'Il porticciolo romano di Gianola', author: 'Luigi Versaggi', license: 'CC BY-SA 2.5', page: 'https://commons.wikimedia.org/wiki/File:Porticciolo_Romano_Gianola.jpg' },
  vindicio: { src: vindicio, title: 'La spiaggia di Vindicio', author: 'trolvag', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Vendicio_spiaggia_-_panoramio.jpg' },
  caposele: { src: caposele, title: 'Le peschiere romane sul lungomare', author: 'Sailko', license: 'CC BY 3.0', page: 'https://commons.wikimedia.org/wiki/File:Formia,_peschiere_romane_01.jpg' },
  mola: { src: mola, title: 'Via Abate Tosti, Mola', author: 'Gobbler', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Formia_-_Via_Abate_Tosti.JPG' },
  centro: { src: centro, title: 'Formia dalla stazione', author: 'Gobbler', license: 'CC BY-SA 3.0', page: 'https://commons.wikimedia.org/wiki/File:Formia_Panorama_dalla_stazione_ferroviaria.JPG' }
};
/** which photo for each part of town (the names of the areas of formia.ts), and for the inside of places */
const BY_AREA: Record<string, string> = {
  'Porto': 'porto', 'Caposele': 'caposele',
  'Vindicio': 'vindicio', 'Eclipse beach': 'vindicio', 'Pineta di Vindicio': 'vindicio',
  'Mola': 'mola', 'Birreria Morgana': 'mola', 'Piazza San Giovanni': 'mola',
  'Centro': 'centro', 'Piazza della Vittoria': 'centro', 'Stazione': 'centro', 'Gelateria Lavezzi': 'centro',
  'Castellone': 'castellone',
  'Monti Aurunci': 'maranola', 'Rio Fresco': 'maranola', 'Campagna': 'maranola', 'Tomba di Cicerone': 'maranola',
  'Via Amendola': 'castellonorato', 'Acqualonga': 'castellonorato', 'Santo Janni': 'castellonorato', 'Parco la Fontana': 'castellonorato',
  'Bruno Zauli': 'castellonorato', 'Parco Gramsci': 'castellonorato', 'Villaggio Don Bosco': 'castellonorato',
  'Gianola': 'gianola'
};
const BY_MAP: Record<string, string> = { casa: 'castellonorato', circolo: 'castellonorato', morgana: 'mola' };
/** the photo behind a battle on that map, in that part of town */
export function photoFor(map: string, area: string | null): string {
  return BY_MAP[map] || (area && BY_AREA[area]) || 'porto';
}
