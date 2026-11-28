/* the levels count in a battle (24 November 2026: 5% of every blow for each level of difference): beside a level, how
   many above or below the foe, from two up; the same marks as in the battle's boxes (ui/battle-screen.ts) */
export function gapCls(lv: number, foe?: number): string { var d = foe ? lv - foe : 0; return d >= 2 ? ' up' : d <= -2 ? ' down' : ''; }
export function gapMark(lv: number, foe?: number): string {
  var d = foe ? lv - foe : 0;
  return Math.abs(d) >= 2 ? ' <i class="lv-gap" aria-label="' + Math.abs(d) + ' livelli ' + (d > 0 ? 'sopra' : 'sotto') + '">' + (d > 0 ? '▲' : '▼') + Math.abs(d) + '</i>' : '';
}
