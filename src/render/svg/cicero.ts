/* The ghost of Marcus Tullius Cicero, Antonio's guide: killed at Formia in 43 BC, his tomb is on the Appia, and
   in Italian a guide is still called a "cicerone". A friendly ghost in a toga, pale and glowing, a laurel wreath and
   a scroll, with a wisp for legs. One SVG, whole (it works inline and as an image on the map). */
const INK = '#1c2340';
export function cicero(cls?: string, look?: 'talk' | 'idle'): string {
  var mouth = look === 'talk' ? '<path d="M53 61 Q60 69 67 61 Q60 65 53 61Z" fill="#5a6b9a" stroke="' + INK + '" stroke-width="2"/>'
    : '<path d="M53 62 Q60 67 67 62" fill="none" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/>';
  return '<svg xmlns="http://www.w3.org/2000/svg" class="ghost ' + (cls || '') + '" viewBox="0 0 120 140" role="img" aria-label="Il fantasma di Cicerone">' +
    '<defs><radialGradient id="ghost-glow"><stop offset="0" stop-color="#cfe9ff" stop-opacity=".8"/><stop offset="1" stop-color="#cfe9ff" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="60" cy="68" rx="58" ry="66" fill="url(#ghost-glow)"/>' +
    /* the toga, ending in a wisp */
    '<path d="M24 86 Q22 66 40 58 L80 58 Q98 66 96 86 L94 112 Q84 104 78 116 Q70 108 62 122 Q54 110 46 118 Q40 106 30 114 Z" fill="#eef6ff" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M40 60 Q62 84 90 74 M34 80 Q56 96 82 92" fill="none" stroke="#9fb7d8" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M78 60 L90 66 L84 100" fill="none" stroke="#c96b6b" stroke-width="4" stroke-linecap="round" opacity=".8"/>' +
    /* the scroll in his hand */
    '<rect x="20" y="78" width="22" height="13" rx="4" fill="#fff3d0" stroke="' + INK + '" stroke-width="2.4" transform="rotate(-18 31 84)"/>' +
    '<circle cx="21" cy="88" r="4" fill="#e8d3a0" stroke="' + INK + '" stroke-width="2"/>' +
    /* the head: short hair, the wreath */
    '<ellipse cx="60" cy="40" rx="24" ry="27" fill="#e8f2ff" stroke="' + INK + '" stroke-width="3"/>' +
    '<path d="M37 34 Q40 16 60 14 Q80 16 83 34 Q74 24 60 24 Q46 24 37 34Z" fill="#c9d6ea" stroke="' + INK + '" stroke-width="2.4"/>' +
    [[38, 30, -40], [44, 22, -25], [52, 17, -10], [68, 17, 10], [76, 22, 25], [82, 30, 40]].map(function (l) {
      return '<ellipse cx="' + l[0] + '" cy="' + l[1] + '" rx="6" ry="3.2" fill="#9cc77a" stroke="' + INK + '" stroke-width="1.6" transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')"/>';
    }).join('') +
    '<path d="M48 31 Q53 28 57 31 M63 31 Q67 28 72 31" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
    '<ellipse cx="52" cy="40" rx="4" ry="4.6" fill="' + INK + '"/><ellipse cx="68" cy="40" rx="4" ry="4.6" fill="' + INK + '"/>' +
    '<circle cx="50.8" cy="38.6" r="1.4" fill="#ffffff"/><circle cx="66.8" cy="38.6" r="1.4" fill="#ffffff"/>' +
    '<path d="M60 43 Q57 51 61 53" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>' +
    '<ellipse cx="45" cy="50" rx="4" ry="2.4" fill="#ffb3c0" opacity=".6"/><ellipse cx="75" cy="50" rx="4" ry="2.4" fill="#ffb3c0" opacity=".6"/>' +
    mouth + '</svg>';
}

/* The ghost of Lucius Mamurra, of Formiae, Caesar's prefect of engineers, the richest man of his town (and the
   villa at Gianola): the antagonist. A ghost like Cicero's, but gold and purple, with a golden wreath, rings and a
   purse of coins, and a smug smile. */
export function mamurra(cls?: string): string {
  return '<svg xmlns="http://www.w3.org/2000/svg" class="ghost ' + (cls || '') + '" viewBox="0 0 120 140" role="img" aria-label="Il fantasma di Mamurra">' +
    '<defs><radialGradient id="mamurra-glow"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".8"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs>' +
    '<ellipse cx="60" cy="68" rx="58" ry="66" fill="url(#mamurra-glow)"/>' +
    '<path d="M22 86 Q20 64 40 57 L80 57 Q100 64 98 86 L96 112 Q86 104 80 116 Q72 108 62 122 Q54 110 46 118 Q40 106 30 114 Z" fill="#fff4d6" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>' +
    '<path d="M40 59 Q62 84 92 74 M34 80 Q58 96 86 92" fill="none" stroke="#d9b56a" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M44 58 L34 66 L40 104" fill="none" stroke="#8e3fa8" stroke-width="5" stroke-linecap="round" opacity=".85"/>' +
    /* the purse of coins, the rings */
    '<path d="M86 84 Q100 80 102 94 Q100 104 88 102 Q80 96 86 84Z" fill="#c9a227" stroke="' + INK + '" stroke-width="2.4"/><path d="M88 84 L96 80" stroke="' + INK + '" stroke-width="2.4"/>' +
    '<circle cx="93" cy="94" r="3" fill="#ffe08a" stroke="' + INK + '" stroke-width="1.6"/>' +
    '<ellipse cx="60" cy="40" rx="24" ry="27" fill="#fff1d0" stroke="' + INK + '" stroke-width="3"/>' +
    '<path d="M37 34 Q40 15 60 13 Q80 15 83 34 Q74 23 60 23 Q46 23 37 34Z" fill="#b8a27a" stroke="' + INK + '" stroke-width="2.4"/>' +
    [[38, 30, -40], [44, 22, -25], [52, 17, -10], [68, 17, 10], [76, 22, 25], [82, 30, 40]].map(function (l) {
      return '<ellipse cx="' + l[0] + '" cy="' + l[1] + '" rx="6.4" ry="3.4" fill="#f2c14e" stroke="' + INK + '" stroke-width="1.6" transform="rotate(' + l[2] + ' ' + l[0] + ' ' + l[1] + ')"/>';
    }).join('') +
    /* raised brows, half-closed eyes, a smug smile */
    '<path d="M46 29 Q52 25 57 30 M63 30 Q68 25 74 29" fill="none" stroke="' + INK + '" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M47 40 Q52 36 57 40" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/><path d="M63 40 Q68 36 73 40" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M60 43 Q57 51 61 53" fill="none" stroke="' + INK + '" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M50 60 Q60 67 71 58" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round"/>' +
    '</svg>';
}
