import type { ItemId } from './growth';

/* The sea (Antonio, 21 November 2026): races on the windsurf, round marks laid on the water, and missions out on the
   gulf for the people of the shore. Where the marks and the things to find are is in maps/formia-places.ts (spots
   `gara-…`, `gavitello-…`…); the regatta with Nicola follows the way of the start (data/nicola.ts, WS_ROUTE).
   ui/sea.ts plays them, story/sea.ts keeps the state. The activities (story/activities.ts) keep the best times. */

/** a good time: this many times that of a race sailed well in today's wind (story/regatta.ts) */
export const GOOD = 1.3;
export interface Course {
  /** the activity it is (story/activities.ts: the best time, the pay) */
  id: string;
  name: string;
  /** who offers it, what they say before and after */
  npc: string;
  ask: string[];
  /** where one sets off (a spot at sea), and the marks in order (spots); the regatta takes them from WS_ROUTE */
  start: string;
  marks: string[];
  /** a race against Nicola: he sails the way of the start as fast as a good sailor would in today's wind
      (story/regatta.ts), this many times slower */
  rival?: number;
  win: string[]; lose: string[];
}
export const COURSES: Course[] = [
  { id: 'slalom', name: 'Lo slalom di Vindicio', npc: 'istruttrice', start: 'start-windsurf',
    marks: ['gara-slalom-1', 'gara-slalom-2', 'gara-slalom-3', 'gara-slalom-4', 'gara-slalom-5', 'gara-slalom-6', 'gara-slalom-7'],
    ask: ['Sette boe arancioni in fila davanti a Vindicio: girale tutte, in ordine, più in fretta che puoi.', 'Guarda il vento, mi raccomando: controvento non si va da nessuna parte. Al lasco si vola.'],
    win: ['Che slalom! Hai letto il vento come un vecchio lupo di mare.'], lose: ['Non male. Ma al prossimo giro prova a stare al lasco tra una boa e l\'altra.'] },
  { id: 'regata', name: 'La regata del golfo con Nicola', npc: 'nicola', start: 'start-windsurf', marks: [],
    ask: ['Uagliò, la rifacciamo? Stavolta non ti aspetto: da Vindicio a Gianola, chi arriva primo alla caletta offre il caffè. Ahahah!', 'Passa da tutte le boe che ti segno, eh. Niente scorciatoie per i porti.'],
    rival: 1.12,
    win: ['NOOO! Mi hai battuto! Uagliò, sei un campione. Il caffè lo pago io, giuro.'], lose: ['Ahahah! Il vento ce l\'ho nelle ossa, uagliò. Riprova quando vuoi!'] },
  { id: 'traversata', name: 'La traversata del golfo', npc: 'velista', start: 'via-traversata',
    marks: ['gara-traversata-1', 'gara-traversata-2', 'gara-traversata-3', 'gara-traversata-4', 'gara-traversata-5', 'gara-traversata-6', 'gara-traversata-7'],
    ask: ['La traversata: da Gianola a Vindicio, tutto il golfo. Le secche, la boa del golfo, il porto, e giù fino all\'Eclipse.', 'Col libeccio si va di bolina all\'andata: sceglilo bene, il bordo.'],
    win: ['Tutto il golfo in un fiato. Hai il mare nelle braccia.'], lose: ['È lunga, eh? La prossima volta tieni le boe più strette.'] }
];

/** a mission at sea: someone of the shore asks for things out on the water (spots), or for someone adrift */
export interface SeaJob {
  id: string;
  npc: string;
  name: string; where: string;
  ask: string[]; again: string[]; done: string[];
  /** what to find: the spots where they float, and how one is called */
  things: string[]; thing: string;
  /** a swimmer carried off by the wind: he drifts, and the time to reach him, in seconds */
  adrift?: number;
  /** offered only once this has happened (a flag of st.seen) */
  after?: string;
  pay: { money: number; items?: Partial<Record<ItemId, number>>; sail?: boolean };
}
export const SEA_JOBS: SeaJob[] = [
  { id: 'gavitelli', npc: 'pescatore', name: 'I gavitelli del pescatore', where: 'Il porto di Formia',
    ask: ['La mareggiata di stanotte mi ha strappato le reti: quattro gavitelli sono andati per il golfo.', 'Sono quelli bianchi e rossi, galleggiano. Se vai per mare, me li riporti?'],
    again: ['I gavitelli sono ancora là fuori: uno verso il porto, uno davanti all\'Appia, uno lontano verso Gianola, uno al largo di Vindicio.'],
    done: ['Tutti e quattro! Domani le reti tornano in mare.', 'Tieni, e questa nassa: con le creature del mare fa miracoli.'],
    things: ['gavitello-1', 'gavitello-2', 'gavitello-3', 'gavitello-4'], thing: 'gavitello', pay: { money: 60, items: { nassa: 1, ambrosia: 1 } } },
  { id: 'boe', npc: 'bagnino-oriente', name: 'Le boe del Lido Oriente', where: 'Lido Oriente, Gianola',
    ask: ['Il vento s\'è portato via tre boe gialle del Lido: senza, i pedalò vanno dove vogliono.', 'Sono al largo di Gianola. Le ripeschi tu?'],
    again: ['Mancano ancora delle boe: sono tutte al largo, davanti al promontorio.'],
    done: ['Rimesse a posto. Oggi i bagnanti sono al sicuro, grazie a te.', 'Prendi queste ciambelle: le fa mia madre.'],
    things: ['boa-persa-1', 'boa-persa-2', 'boa-persa-3'], thing: 'boa', pay: { money: 50, items: { ciambella: 2 } } },
  { id: 'tavola', npc: 'nicola', name: 'La tavola vecchia di Nicola', where: 'Eclipse beach, Vindicio',
    ask: ['Uagliò, la tavola vecchia che Faro ha sparato via… era la mia prima tavola. Ci ho imparato da ragazzino.', 'È finita lontano, al largo, verso il mezzo del golfo. Se la ritrovi, ti do la mia vela da regata. Parola!'],
    again: ['La tavola vecchia è al largo, verso il mezzo del golfo, più giù della boa del golfo. Segui la corrente.'],
    done: ['La mia tavola! Ahahah, è tutta gialla di sale, ma è lei.', 'Ecco la vela da regata: con questa prendi il vento meglio, sul windsurf. Vedrai.'],
    things: ['tavola-persa'], thing: 'tavola', after: 'ws-landed', pay: { money: 40, sail: true } },
  { id: 'materassino', npc: 'bagnina-scauri', name: 'Il materassino portato via', where: 'Spiaggia di Scauri',
    ask: ['Aiuto! Un ragazzino col materassino è finito al largo, il vento lo porta via!', 'Io non posso lasciare la postazione. Vai tu, presto: hai un minuto e mezzo prima che sia troppo lontano.'],
    again: ['Il ragazzino è ancora al largo, nella baia: corri!'],
    done: ['L\'hai raggiunto! Ora torna a riva a nuoto, tranquillo: era solo spaventato.', 'Sei stato bravissimo. Prendi: offre il lido.'],
    things: ['materassino'], thing: 'ragazzo', adrift: 90, pay: { money: 80, items: { corno: 1, ambrosia: 1 } } }
];
