import type { FriendId } from './characters';

export const COVO_CLUES: Record<FriendId, string> = {
  antonio: 'Guarda il Visore. Alle 3:12 ha registrato un impulso a Gianola. Lo stesso impulso è passato per ogni covo. Ho salvato il tracciato.',
  andrea: 'Le luci dei covi si accendono una dopo l’altra, sempre allo stesso intervallo. Ho segnato gli orari. Possiamo risalire il percorso dell’eco.',
  claudia: 'Gli uomini con la torcia sono passati di qui. Ho visto la polvere sulle scarpe. Prendi la lanterna. Al Cisternone ci guardiamo noi.',
  costanzo: 'Ho fatto parlare la piazza. Uno ha visto quelli con le corde e gli attrezzi scendere verso le peschiere. Almeno adesso sappiamo dove cercare.',
  forchetta: 'Il pezzo di pietra viene da sotto il campo. Lo tengo fermo col supporto della protesi. Se vuoi capire le tacche, portiamolo all’Archivio.',
  valentin: 'Adesso la danzatrice è fuori. Me lo ricorderò: nella nebbia la luce ferma indica sempre dove puoi mettere i piedi.',
  zendavid: 'Ho tolto il basso alla registrazione. Sotto c’è una voce che parla latino, sempre la stessa. Sentila. Secondo me Cicerone la riconosce.'
};

export const COVO_NOTES: Record<FriendId, [string, string]> = {
  antonio: ['Il segnale delle 3:12', 'Il Visore ha registrato il boato a Gianola. La stessa onda ha raggiunto i covi.'],
  andrea: ['Gli intervalli dell’eco', 'Ogni luce pulsa allo stesso intervallo. Con gli orari si può risalire da un punto all’altro.'],
  claudia: ['La polvere sulle scarpe', 'Claudia ha visto gli uomini con la torcia. La lanterna aiuta a seguire le loro tracce al Cisternone.'],
  costanzo: ['I testimoni in piazza', 'Gli uomini con corde e attrezzi sono scesi verso le peschiere di Caposele.'],
  forchetta: ['Le tre tacche', 'Sul frammento trovato sotto il campo ci sono tre incisioni. Il supporto della protesi lo tiene fermo mentre vibra.'],
  valentin: ['La via nella nebbia', 'Le luci ferme indicano un passaggio sicuro. Valentin le ha seguite per tornare a prendere chi era rimasto nella torre.'],
  zendavid: ['La voce sotto il rumore', 'Filtrando l’eco emerge una voce in latino. Cicerone potrebbe riconoscerla.']
};

export const COVO_FOLLOW_UP: Partial<Record<FriendId, { after: string; say: string }>> = {
  forchetta: { after: 'trama-archivio', say: 'Tre tacche, come nel disegno della Torre di Mola. Il frammento combacia col bordo del sigillo. Tienilo per quando trovi le nicchie.' },
  claudia: { after: 'pietra-mura', say: 'Allora era dal Cisternone che tornavano. I loro passaggi sono finiti, ma i graffi sulle pietre restano. Prendi la lanterna se trovi altre tracce.' },
  costanzo: { after: 'pietra-mare', say: 'Ho fatto parlare il testimone di Caposele. Mentre il sub risaliva, stringeva una moneta. Quando l’ha lasciata andare, anche la Pietra si è spenta.' },
  zendavid: { after: 'pietra-voce', say: 'Era Cicerone. Ho sovrapposto la sua voce alla registrazione. Sotto c’è il battito delle monete, uguale dall’inizio alla fine. Tieni il file.' }
};
