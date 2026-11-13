import type { FriendId } from './characters';
import type { Trainer } from './trainers';

/* The rival's words, when the rival is one of the friends (story/rival-who.ts): the same three meetings Tullio had (at
   the park as soon as both have a creature, on the Appia, after Mamurra), told by whoever it is this time. {voice} is
   a line of the friend's own (VOICE), {rival} the friend's creature, {partner} the other one they bring along, {mine}
   the player's, {why} why they picked it. Tullio's own words stay in data/trainers.ts, for the stories that met him. */

/** each friend's voice as a rival: when they challenge, when they win, when they lose */
export const VOICE: Record<FriendId, { hi: string; won: string; beaten: string }> = {
  antonio: { hi: 'Ho letto un paper sulle creature: la mia è ottimizzata.', won: 'Stato dell\'arte.', beaten: 'Devo rifare la simulazione. Il robot, intanto, ride.' },
  costanzo: { hi: 'GIÀ LO SAI: la creatura più forte di Formia è la mia. L\'ho detto in piazza, quindi è vero.', won: 'Comizio finito. Applausi, prego.', beaten: 'Mozione respinta… per ora. Mi ricandido.' },
  andrea: { hi: 'Ho calcolato tutto: col tipo giusto vinco il 73% delle volte.', won: 'Era nei dati.', beaten: 'Non era nei dati. Rifaccio il foglio di calcolo.' },
  valentin: { hi: 'Weee! Dopo la lotta si fa festa: chi perde offre.', won: 'Weee! Offri tu, allora.', beaten: 'Va be\', la festa si fa lo stesso. Offro io.' },
  forchetta: { hi: 'Poteva andare peggio: potevo non avere una creatura.', won: 'Gioco, partita, incontro.', beaten: 'Poteva andare peggio. Non so come, ma poteva.' },
  zendavid: { hi: 'Bau. Tolgo le cuffie solo per questa lotta.', won: 'Bau! (È un bau contento.)', beaten: 'Rimetto le cuffie e ci penso su.' },
  claudia: { hi: 'Uno alla volta: prima parlo io, poi le creature.', won: 'Il Padre ha deciso.', beaten: 'Ti ho ascoltato. Ora ascolta tu: la prossima volta vinco io.' }
};
/** the other creature a friend brings to the second and third meetings (Antonio has none of his own: a cicada of the park) */
export const PARTNER: Record<FriendId, string> = { antonio: 'cicalina', costanzo: 'cicalina', forchetta: 'lumacotta', andrea: 'stellina', valentin: 'cinghialetto', zendavid: 'olivella', claudia: 'lumacotta' };

type Words = Pick<Trainer, 'intro' | 'win' | 'lose' | 'after'>;
export const RIVAL_LINES: Record<string, Words & { title: string; moods?: Trainer['moods'] }> = {
  'rivale-1': {
    title: '{rv}, il tuo rivale',
    intro: ['{hero}! Aspetta!', '{voice}', 'La guardaparco ha affidato una creatura anche a me, subito dopo di te. Ho preso {rival}. {why}', 'Le nostre creature sono appena nate: vediamo subito chi è più forte!'],
    win: ['Cosa?! Avevo scelto quella giusta, eppure…', '{beaten}', 'Stavolta hai vinto tu. Ma mi alleno, e la prossima volta ti batto!'],
    lose: ['{won}', 'Allena il tuo {mine} e riprova quando vuoi: io sto qui.'],
    after: ['Rivincita? Il mio {rival} non vede l\'ora.']
  },
  'rivale-2': {
    title: '{rv}, il tuo rivale',
    intro: ['{hero}! Ti ho visto passare: ho girato tutta Formia per allenarmi, dalla pineta al porto.', 'Guarda il mio {rival}: è cambiato! E con me c\'è anche {partner}. Rivincita?'],
    win: ['Di nuovo! Ma come fai?', '{beaten}', 'Va\' pure da Cicerone. Ma non è finita, eh!'],
    lose: ['{won}', 'Le tue creature sono stanche: falle riposare e torna.'],
    after: ['Rivincita? Stavolta vinco io.']
  },
  'rivale-3': {
    title: '{rv}, il tuo rivale',
    intro: ['{hero}. Hai battuto il fantasma di Mamurra: a Formia non si parla d\'altro.', 'Però adesso il più forte di Formia chi è? Tu o io?', 'Il mio {rival} ha preso la sua forma più grande. {voice}'],
    win: ['…Sei tu il più forte di Formia.', 'Da quella prima lotta al parco ne hai fatta di strada. Grazie per le lotte, {hero}.', 'Quando vuoi la rivincita, sono qui al parco.'],
    lose: ['{won}', 'Il più forte di Formia sono io! Per adesso. Torna quando vuoi.'],
    after: ['Rivincita? Vediamo chi è il più forte di Formia, oggi.'],
    moods: {
      ally: {
        intro: ['{hero}! Hai visto come si è crepata la Ricchezza? Un pezzo è merito mio, eh.', 'Però adesso, tra noi due, il più forte di Formia chi è? Non ti regalo niente.'],
        win: ['…Sei tu il più forte di Formia. E mi va bene così.', 'Quando vuoi allenarti, sai dove trovarmi.'],
        lose: ['Ho vinto io! Te l\'avevo detto che mi allenavo. Torna quando vuoi.'],
        after: ['Ci alleniamo? Stavolta ti batto, e te lo dico prima.'],
        gift: { items: { oro: 2 }, say: 'Tieni: due retini d\'oro. La guardaparco li aveva dati a me, ma li userai meglio tu.' }
      },
      bitter: {
        intro: ['Hai salvato Formia, eh? Complimenti. Non si parla d\'altro.', 'Lo sai chi ha detto a Mamurra come lotti? E lo sai cosa ho imparato io, nel frattempo?', 'Adesso ridi, se ci riesci.'],
        win: ['…', 'Vattene, {hero}. Qui sto bene da sol{rv-a}.'],
        lose: ['Tutto qui?', 'Te lo ricordi? L\'hai detto tu.'],
        after: ['Che vuoi ancora?'],
        prize: 500
      }
    }
  }
};
