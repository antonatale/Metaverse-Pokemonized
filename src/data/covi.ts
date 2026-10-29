import type { FriendId } from './characters';

/* The covi: our gyms. Each one belongs to a friend, gives a pin and adds him to the squad. */
export interface Badge { id: string; name: string; mark: string; color: string }
export interface Covo {
  name: string;
  city: string;
  leader: FriendId;
  badge: Badge;
  /** what the leader says before the challenge, after winning, after losing, and once beaten */
  intro: string[];
  win: string[];
  lose: string[];
  after: string[];
}

export const COVI: Record<string, Covo> = {
  piazza: {
    name: 'Piazza della Vittoria', city: 'formia', leader: 'costanzo',
    badge: { id: 'gialosai', name: 'Spilla «Già lo sai»', mark: 'C', color: '#ffe45c' },
    intro: ['GIÀ LO SAI.', 'Questa è la mia piazza. Se vuoi parlare, prima devi battermi.'],
    win: ['Daje Roma daje… va bene, hai vinto tu.', 'Vengo con te: un comizio in giro per il mondo ci sta.'],
    lose: ['Il popolo ha deciso. Ripassa quando vuoi.'],
    after: ['Il prossimo comizio lo facciamo insieme. GIÀ LO SAI.']
  },
  circolo: {
    name: 'Tennis coperti del Bruno Zauli', city: 'formia', leader: 'forchetta',
    badge: { id: 'peggio', name: 'Spilla «Poteva andare peggio»', mark: 'F', color: '#8fd0f6' },
    intro: ['Poteva andare peggio.', 'Palleggiamo? Chi perde paga il campo.'],
    win: ['Poteva andare peggio. Per me.', 'Vengo con te. La prossima però si gioca alla Play.'],
    lose: ['Ace. Riprova quando vuoi.'],
    after: ['Dopo la lotta, una partita alla Play?']
  }
};
