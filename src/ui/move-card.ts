import type { TypeName } from '../data/types';
import { runeIcon } from '../render/svg/creatures';
import { ico } from './icons';
import { esc } from './dom';
import { TC } from './common';

/* A move drawn as a card: the battle's four buttons and the sheet for learning a move use this one drawing, so the
   player sees the same thing in both places. The colour of its magic fills it; the name is big; underneath, the type,
   the power, the aim and the uses left; in between, what else it does. */

export interface MoveCard {
  name: string;
  /** a creature's move: the type of its magic (null for a plain one); a person's move has none */
  type?: TypeName | null;
  creature: boolean;
  /** the colour of a person's move: the person's type */
  tc?: string;
  /** a person's move: its icon, in place of the rune */
  icon?: string | null;
  /** 'atk', 'buff', 'heal', 'status' */
  kind: string;
  power?: number;
  acc?: number;
  /** what else it does, in words */
  more: string;
  /** limited moves: uses left, out of how many */
  left?: number;
  uses?: number;
  /** how well it works on the one in front: 2, 1, 0, −1, −2 */
  eff?: number;
  /** Antonio's trip: one dot per stage reached */
  dots?: boolean[] | null;
}
export const EFF_WORD: Record<string, string> = { '2': 'Doppio vantaggio', '1': 'Superefficace', '-1': 'Poco efficace', '-2': 'Per niente efficace' };
const KIND: Record<string, string> = { buff: 'Su di sé', heal: 'Cura', status: 'Sull\'avversario' };

/** the colour that fills the card */
export function cardColour(d: MoveCard): string {
  return d.creature ? (d.type ? TC[d.type] : 'var(--t-none)') : d.tc || 'var(--t-none)';
}
/** the class the card adds to its button */
export function cardClass(d: MoveCard): string {
  return 'card' + (d.creature && !d.type ? ' plain' : '') + (d.kind === 'atk' ? ' atk' : '');
}
/** what goes inside the button */
export function cardHtml(d: MoveCard): string {
  const rune = d.creature ? (d.type ? runeIcon(d.type, 34) : ico('spark')) : ico(d.icon || 'spark');
  const lvl = d.eff || 0, tag = lvl ? '<i class="eff ' + (lvl > 0 ? 'up' : 'down') + '">' + EFF_WORD[lvl] + '</i>' : '';
  const foot: string[] = [];
  if (d.creature) foot.push('<i class="mv-type">' + (d.type ? d.type : 'Senza tipo') + '</i>');
  if (d.kind === 'atk' && d.power) foot.push('<i>Potenza ' + d.power + '</i>');
  if (d.kind === 'atk' && d.acc && d.power) foot.push('<i>' + (d.acc >= 1 ? 'Sempre' : Math.round(d.acc * 100) + '%') + '</i>');
  if (d.kind !== 'atk' && KIND[d.kind] && d.creature) foot.push('<i>' + KIND[d.kind] + '</i>');
  if (d.uses) foot.push('<i class="mv-uses">' + (d.left != null ? d.left : d.uses) + '/' + d.uses + '</i>');
  const dots = d.dots ? '<span class="stage">' + d.dots.map(function (on) { return '<i class="' + (on ? 'on' : '') + '"></i>'; }).join('') + '</span>' : '';
  return '<span class="mv-rune">' + rune + '</span><span class="mv-top"><b>' + esc(d.name) + '</b>' + tag + '</span>' +
    (d.more || dots ? '<small class="mv-more">' + dots + esc(d.more) + '</small>' : '') +
    (foot.length ? '<span class="mv-foot">' + foot.join('') + '</span>' : '');
}
/** a card on a button: its look, its words, its colour */
export function paintCard(b: HTMLElement, d: MoveCard) {
  b.innerHTML = cardHtml(d);
  b.style.setProperty('--tc', cardColour(d));
}
