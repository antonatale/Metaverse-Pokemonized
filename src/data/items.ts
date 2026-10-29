/* The things Antonio keeps losing, keyed by the move each one blocks. */
export type ItemIcon = 'notes' | 'wallet' | 'charger' | 'passport';
export interface Item { name: string; short: string; icon: ItemIcon }

export const ITEMS: Record<string, Item> = {
  diagnosi: { name: 'gli appunti', short: 'Appunti persi', icon: 'notes' },
  certificati: { name: 'il portafoglio', short: 'Portafoglio perso', icon: 'wallet' },
  simtoreal: { name: 'il caricabatterie del robot', short: 'Caricabatterie perso', icon: 'charger' },
  america: { name: 'il passaporto', short: 'Passaporto perso', icon: 'passport' }
};
/** where it turns out to have been */
export const FOUND: string[] = ['in tasca', 'nello zaino', 'nel cappuccio della felpa', 'sotto il banco', 'nella giacca dell\'anno scorso', 'in mano. Da tutto il tempo'];
