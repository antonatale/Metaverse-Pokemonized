/* The things the friends' moves are made of (ui/friend-moves.ts): each one a little drawing in the battle's style, ink
   outlines and flat colours with a white shine, as big as asked (s is its width in pixels). Only drawing. */

export const INK = '#1c2340';
const W = '#ffffff';

/** an SVG of the given view, `s` pixels wide */
function svg(vw: number, vh: number, s: number, inner: string): string {
  return '<svg viewBox="0 0 ' + vw + ' ' + vh + '" width="' + Math.round(s) + '" height="' + Math.round(s * vh / vw) + '" aria-hidden="true" stroke="' + INK + '" stroke-linejoin="round" stroke-linecap="round">' + inner + '</svg>';
}
const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');

/* ---------- Antonio ---------- */
/** the corners of a thermal camera's frame, with its readout */
export function viewfinder(col: string, s: number, label: string): string {
  const c = 'fill="none" stroke-width="7"';
  return svg(200, 200, s, '<g ' + c + ' stroke="' + INK + '"><path d="M10 50V10H50M150 10H190V50M190 150V190H150M50 190H10V150"/></g>' +
    '<g fill="none" stroke-width="3.5" stroke="' + col + '"><path d="M10 50V10H50M150 10H190V50M190 150V190H150M50 190H10V150"/><path d="M100 82V118M82 100H118" stroke="' + W + '"/></g>' +
    '<rect x="44" y="160" width="112" height="24" rx="6" fill="' + INK + '" stroke="none" opacity=".85"/><text x="100" y="178" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="15" fill="' + col + '" stroke="none">' + esc(label) + '</text>');
}
/** a white certificate with a green seal: a Certificato Bianco (TEE) */
export function certificate(s: number): string {
  return svg(120, 90, s, '<rect x="5" y="5" width="110" height="80" rx="6" fill="#fbf8ef" stroke-width="4"/><rect x="13" y="13" width="94" height="64" rx="3" fill="none" stroke="#5bb36a" stroke-width="2.5" stroke-dasharray="5 3"/>' +
    '<text x="60" y="36" text-anchor="middle" font-family="Georgia,serif" font-weight="700" font-size="16" fill="' + INK + '" stroke="none">TEE</text>' +
    '<path d="M26 48H94M26 58H80" stroke="#9aa1b8" stroke-width="3"/>' +
    '<circle cx="92" cy="66" r="13" fill="#5bb36a" stroke-width="3"/><path d="M85 66L90 71L99 61" fill="none" stroke="' + W + '" stroke-width="3.5"/>');
}
/** a wire-frame grid, for the simulation */
export function simGrid(col: string, s: number): string {
  let g = '';
  for (let k = 0; k <= 8; k++) { const x = 20 + k * 20, y = 20 + k * 12; g += '<path d="M' + x + ' 20L' + (x - 40 + k * 10) + ' 116"/><path d="M' + (20 - k * 5) + ' ' + y + 'H' + (180 + k * 5) + '"/>'; }
  return svg(200, 120, s, '<g fill="none" stroke="' + col + '" stroke-width="2" opacity=".85">' + g + '</g>');
}
/** a map pin with a name under it */
export function pin(col: string, s: number, label: string): string {
  return svg(110, 120, s, '<path d="M55 106C38 78 22 64 22 44A33 33 0 0 1 88 44C88 64 72 78 55 106Z" fill="' + col + '" stroke-width="5"/><circle cx="55" cy="44" r="12" fill="' + W + '" stroke-width="4"/>' +
    '<rect x="8" y="98" width="94" height="20" rx="10" fill="' + W + '" stroke-width="3.5"/><text x="55" y="113" text-anchor="middle" font-family="\'Lilita One\',\'Arial Rounded MT Bold\',sans-serif" font-size="14" fill="' + INK + '" stroke="none">' + esc(label) + '</text>');
}
/** a plane seen from above, pointing right */
export function plane(col: string, s: number): string {
  return svg(120, 90, s, '<path d="M8 45C8 40 18 37 30 37H86C100 37 114 41 114 45C114 49 100 53 86 53H30C18 53 8 50 8 45Z" fill="' + W + '" stroke-width="4.5"/>' +
    '<path d="M54 37L40 6H52L78 37ZM54 53L40 84H52L78 53Z" fill="' + col + '" stroke-width="4"/><path d="M14 40L6 26H14L26 38ZM14 50L6 64H14L26 52Z" fill="' + col + '" stroke-width="3.5"/>' +
    '<path d="M92 41H104" stroke="' + INK + '" stroke-width="4"/><path d="M36 43H82" stroke="#9fc6ef" stroke-width="3"/>');
}
/** the stars and stripes, waving */
export function usa(s: number): string {
  let st = '';
  for (let k = 0; k < 7; k++) st += '<path d="M6 ' + (12 + k * 10) + 'Q40 ' + (6 + k * 10) + ' 74 ' + (12 + k * 10) + 'T144 ' + (12 + k * 10) + '" stroke="' + (k % 2 ? W : '#d8324a') + '" stroke-width="8" fill="none" stroke-linecap="butt"/>';
  let dots = '';
  for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) dots += '<circle cx="' + (14 + q * 12 + (r % 2) * 6) + '" cy="' + (16 + r * 10) + '" r="2.6" fill="' + W + '" stroke="none"/>';
  return svg(150, 90, s, '<g>' + st + '</g><path d="M6 8Q30 2 62 8V44Q30 38 6 44Z" fill="#2b4aa0" stroke-width="3"/>' + dots + '<path d="M6 8Q40 2 74 8T144 8V78Q110 72 74 78T6 78Z" fill="none" stroke-width="4"/>');
}
/** a paper, with a title and a stamp across it */
export function paper(s: number, title: string, stamp: string, col: string): string {
  return svg(110, 140, s, '<path d="M8 6H80L102 28V134H8Z" fill="#fbf8ef" stroke-width="4"/><path d="M80 6V28H102" fill="#e8e2d2" stroke-width="3.5"/>' +
    '<text x="18" y="32" font-family="Georgia,serif" font-weight="700" font-size="15" fill="#b3261e" stroke="none">' + esc(title) + '</text>' +
    '<path d="M18 46H90M18 58H90M18 70H76M18 82H90M18 94H64" stroke="#a9afc2" stroke-width="3.5"/>' +
    (stamp ? '<g transform="rotate(-16 56 110)"><rect x="12" y="96" width="88" height="28" rx="5" fill="none" stroke="' + col + '" stroke-width="4"/><text x="56" y="116" text-anchor="middle" font-family="\'Lilita One\',sans-serif" font-size="16" fill="' + col + '" stroke="none">' + esc(stamp) + '</text></g>' : ''));
}
/** a curve going down to its minimum, with the steps of the descent */
export function gradient(col: string, s: number): string {
  return svg(200, 120, s, '<path d="M10 14C40 20 60 104 100 106C140 104 160 20 190 14" fill="none" stroke="' + INK + '" stroke-width="9"/><path d="M10 14C40 20 60 104 100 106C140 104 160 20 190 14" fill="none" stroke="' + col + '" stroke-width="5"/>' +
    '<g fill="' + W + '" stroke-width="3"><circle cx="30" cy="22" r="6"/><circle cx="50" cy="50" r="6"/><circle cx="66" cy="80" r="6"/><circle cx="84" cy="100" r="6"/></g><circle cx="100" cy="106" r="10" fill="#ffd84d" stroke-width="4"/>');
}
/** a boarding pass */
export function boarding(s: number, to: string): string {
  return svg(150, 70, s, '<rect x="4" y="4" width="142" height="62" rx="9" fill="' + W + '" stroke-width="4"/><path d="M106 4V66" stroke-dasharray="5 5" stroke-width="3"/><rect x="4" y="4" width="102" height="16" rx="6" fill="#2b4aa0" stroke="none"/>' +
    '<text x="14" y="16" font-family="ui-monospace,monospace" font-weight="700" font-size="10" fill="' + W + '" stroke="none">BOARDING PASS</text>' +
    '<text x="14" y="44" font-family="\'Lilita One\',sans-serif" font-size="20" fill="' + INK + '" stroke="none">FCO → ' + esc(to) + '</text><text x="14" y="58" font-family="ui-monospace,monospace" font-size="9" fill="#5b6280" stroke="none">GATE 1 · POSTO 1A</text>' +
    '<g stroke-width="2.5">' + [114, 119, 122, 127, 131, 134, 139].map(function (x) { return '<path d="M' + x + ' 16V54"/>'; }).join('') + '</g>');
}
/** a skyline, for Chicago */
export function skyline(col: string, s: number): string {
  return svg(240, 110, s, '<path d="M0 110V70H18V40H34V70H44V22H62V8H70V22H80V70H92V52H110V70H120V30H136V18H146V30H150V70H164V46H184V70H196V36H214V70H240V110Z" fill="' + col + '" stroke-width="4"/>' +
    '<g fill="#ffe680" stroke="none">' + [[24, 48], [50, 30], [66, 30], [50, 46], [126, 38], [140, 40], [170, 54], [202, 44], [202, 56], [98, 60]].map(function (p) { return '<rect x="' + p[0] + '" y="' + p[1] + '" width="5" height="6"/>'; }).join('') + '</g>');
}

/* ---------- Costanzo ---------- */
/** a lectern with two microphones and the seal on the front */
export function podium(col: string, s: number): string {
  return svg(140, 150, s, '<path d="M50 30Q44 8 34 6M90 30Q96 8 106 6" fill="none" stroke-width="4"/><rect x="26" y="0" width="16" height="12" rx="6" fill="#3a3f55" stroke-width="3"/><rect x="98" y="0" width="16" height="12" rx="6" fill="#3a3f55" stroke-width="3"/>' +
    '<path d="M14 34H126L116 54H24Z" fill="#8a5a3a" stroke-width="5"/><path d="M28 54H112L104 146H36Z" fill="#a8734c" stroke-width="5"/>' +
    '<circle cx="70" cy="92" r="20" fill="' + col + '" stroke-width="4"/><path d="M70 78L74 88H84L76 94L79 104L70 98L61 104L64 94L56 88H66Z" fill="' + W + '" stroke-width="2"/>' +
    '<path d="M42 62H98" stroke="' + W + '" stroke-width="3" opacity=".6"/>');
}
/** big round glasses, the ones he puts on to become someone else */
export function glasses(col: string, s: number): string {
  return svg(160, 70, s, '<path d="M64 30Q80 20 96 30" fill="none" stroke-width="6"/><path d="M6 24L22 26M154 24L138 26" stroke-width="6"/>' +
    '<rect x="16" y="12" width="52" height="46" rx="20" fill="' + col + '" fill-opacity=".35" stroke-width="7"/><rect x="92" y="12" width="52" height="46" rx="20" fill="' + col + '" fill-opacity=".35" stroke-width="7"/>' +
    '<path d="M28 26L40 18M104 26L116 18" stroke="' + W + '" stroke-width="5"/>');
}
/** a bidet, white china, with its tap and a jet of water */
export function bidet(s: number): string {
  return svg(130, 120, s, '<path d="M60 4Q92 0 98 34" fill="none" stroke="#7cc8f2" stroke-width="6"/><path d="M60 4Q92 0 98 34" fill="none" stroke="' + W + '" stroke-width="2.5"/>' +
    '<rect x="50" y="36" width="20" height="12" rx="4" fill="#c9d3e3" stroke-width="3.5"/><path d="M14 52H116Q116 84 92 92L86 116H44L38 92Q14 84 14 52Z" fill="#fbfdff" stroke-width="5"/>' +
    '<ellipse cx="65" cy="54" rx="44" ry="10" fill="#d9ecfa" stroke-width="4"/><path d="M28 70Q34 84 48 88" fill="none" stroke="#c9d3e3" stroke-width="4"/>');
}
/** a flag on its pole, in two colours, waving */
export function flag(a: string, b: string, s: number, text?: string): string {
  return svg(130, 120, s, '<path d="M12 6V116" stroke-width="7"/><path d="M12 6V116" stroke="#d9c7a0" stroke-width="3"/>' +
    '<path d="M14 10Q44 0 74 12T124 12V62Q94 72 74 62T14 60Z" fill="' + a + '" stroke-width="5"/><path d="M14 35Q44 25 74 37T124 37V62Q94 72 74 62T14 60Z" fill="' + b + '" stroke="none"/>' +
    '<path d="M14 10Q44 0 74 12T124 12V62Q94 72 74 62T14 60Z" fill="none" stroke-width="5"/>' +
    (text ? '<text x="70" y="44" text-anchor="middle" font-family="\'Lilita One\',sans-serif" font-size="17" fill="' + W + '" stroke="' + INK + '" stroke-width="3" paint-order="stroke">' + esc(text) + '</text>' : ''));
}
/** a stadium scarf, striped */
export function scarf(a: string, b: string, s: number): string {
  let st = '';
  for (let k = 0; k < 6; k++) st += '<rect x="' + (8 + k * 20) + '" y="10" width="20" height="34" fill="' + (k % 2 ? b : a) + '" stroke="none"/>';
  return svg(140, 60, s, st + '<rect x="8" y="10" width="120" height="34" rx="4" fill="none" stroke-width="4"/><path d="M8 44V56M16 44V56M120 44V56M128 44V56" stroke-width="3"/>');
}
/** a wooden gavel */
export function gavel(s: number): string {
  return svg(130, 100, s, '<g transform="rotate(-30 60 50)"><rect x="56" y="40" width="64" height="12" rx="5" fill="#a8734c" stroke-width="4"/><rect x="22" y="20" width="40" height="52" rx="8" fill="#8a5a3a" stroke-width="5"/><path d="M22 34H62M22 58H62" stroke-width="3.5"/></g>' +
    '<ellipse cx="44" cy="92" rx="32" ry="7" fill="#8a5a3a" stroke-width="4"/>');
}
/** a ballot box with a slit, and a ballot going in */
export function ballotBox(col: string, s: number): string {
  return svg(130, 130, s, '<path d="M34 6H92V46H34Z" fill="#fbf8ef" stroke-width="4"/><path d="M50 18L70 34M70 18L50 34" stroke="' + col + '" stroke-width="5"/>' +
    '<path d="M10 46H120L112 126H18Z" fill="#cfd8e8" stroke-width="5"/><rect x="38" y="42" width="54" height="9" rx="3" fill="' + INK + '" stroke="none"/><path d="M28 60H102" stroke="' + W + '" stroke-width="4" opacity=".7"/>' +
    '<circle cx="65" cy="92" r="17" fill="' + col + '" stroke-width="4"/><path d="M58 92L63 97L73 86" fill="none" stroke="' + W + '" stroke-width="4"/>');
}
/** one ballot, marked with a cross */
export function ballot(col: string, s: number): string {
  return svg(60, 44, s, '<rect x="3" y="3" width="54" height="38" rx="3" fill="#fbf8ef" stroke-width="3"/><circle cx="20" cy="22" r="10" fill="none" stroke-width="2.5"/><path d="M13 15L27 29M27 15L13 29" stroke="' + col + '" stroke-width="4"/><path d="M36 17H50M36 27H48" stroke="#a9afc2" stroke-width="3"/>');
}

/* ---------- Andrea ---------- */
/** a bar chart, the last bar the tallest */
export function chart(col: string, s: number): string {
  return svg(150, 120, s, '<rect x="4" y="4" width="142" height="112" rx="10" fill="#fbf8ef" stroke-width="4"/><path d="M22 18V98H134" fill="none" stroke-width="4"/>' +
    [[32, 70], [52, 54], [72, 62], [92, 38], [112, 22]].map(function (b, k) { return '<rect x="' + b[0] + '" y="' + b[1] + '" width="14" height="' + (98 - b[1]) + '" fill="' + (k === 4 ? col : '#9fb4d9') + '" stroke-width="3"/>'; }).join('') +
    '<path d="M30 74C50 50 70 66 90 40S118 22 128 16" fill="none" stroke="#e23a4f" stroke-width="4"/><path d="M120 12L130 15L126 24" fill="none" stroke="#e23a4f" stroke-width="4"/>');
}
/** a bell curve with sigma marks */
export function bell(col: string, s: number): string {
  return svg(160, 90, s, '<path d="M6 82C46 82 54 10 80 10S114 82 154 82Z" fill="' + col + '" fill-opacity=".45" stroke-width="5"/><path d="M6 84H154" stroke-width="4"/>' +
    '<path d="M80 10V84M52 46V84M108 46V84" stroke-width="2.5" stroke-dasharray="4 4"/><text x="80" y="60" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-weight="700" font-size="20" fill="' + INK + '" stroke="none">σ</text>');
}
/** a target's crosshair */
export function crosshair(col: string, s: number): string {
  return svg(100, 100, s, '<g fill="none"><circle cx="50" cy="50" r="38" stroke-width="8"/><circle cx="50" cy="50" r="38" stroke="' + col + '" stroke-width="4"/><circle cx="50" cy="50" r="14" stroke="' + col + '" stroke-width="4"/>' +
    '<path d="M50 2V30M50 70V98M2 50H30M70 50H98" stroke-width="7"/><path d="M50 2V30M50 70V98M2 50H30M70 50H98" stroke="' + W + '" stroke-width="3"/></g><circle cx="50" cy="50" r="4" fill="#e23a4f" stroke="none"/>');
}
/** a dumbbell */
export function dumbbell(s: number): string {
  return svg(150, 60, s, '<rect x="30" y="25" width="90" height="10" rx="4" fill="#c9d3e3" stroke-width="4"/><rect x="10" y="8" width="22" height="44" rx="6" fill="#3a3f55" stroke-width="4"/><rect x="118" y="8" width="22" height="44" rx="6" fill="#3a3f55" stroke-width="4"/>' +
    '<rect x="2" y="16" width="10" height="28" rx="4" fill="#5d6394" stroke-width="3.5"/><rect x="138" y="16" width="10" height="28" rx="4" fill="#5d6394" stroke-width="3.5"/><path d="M15 14V24M123 14V24" stroke="' + W + '" stroke-width="3" opacity=".6"/>');
}
/** a padel racket: solid, with its holes */
export function racket(col: string, s: number): string {
  let h = '';
  for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) h += '<circle cx="' + (34 + q * 16 + (r % 2) * 8 - 4) + '" cy="' + (26 + r * 14) + '" r="3.4" fill="' + INK + '" stroke="none"/>';
  return svg(100, 150, s, '<path d="M46 92L42 140H58L54 92Z" fill="#3a3f55" stroke-width="4"/><rect x="40" y="128" width="20" height="16" rx="4" fill="#e9e4d8" stroke-width="3.5"/>' +
    '<path d="M50 4C80 4 92 26 92 50C92 78 72 96 50 96C28 96 8 78 8 50C8 26 20 4 50 4Z" fill="' + col + '" stroke-width="5"/>' + h + '<path d="M22 28Q30 14 44 10" fill="none" stroke="' + W + '" stroke-width="4" opacity=".8"/>');
}
/** a tennis (or padel) ball */
export function ball(s: number, col?: string): string {
  return svg(40, 40, s, '<circle cx="20" cy="20" r="16" fill="' + (col || '#d8f04a') + '" stroke-width="3"/><path d="M8 10C15 15 15 25 8 30M32 10C25 15 25 25 32 30" fill="none" stroke="' + W + '" stroke-width="2.6"/>');
}
/** a flame */
export function flame(col: string, s: number): string {
  return svg(80, 110, s, '<path d="M40 4C52 30 74 40 74 70A34 34 0 0 1 6 70C6 50 18 40 22 26C28 38 32 44 38 46C34 30 36 16 40 4Z" fill="' + col + '" stroke-width="5"/>' +
    '<path d="M40 50C48 62 58 66 58 80A18 18 0 0 1 22 80C22 70 30 64 32 58C36 64 40 64 40 50Z" fill="#ffe36b" stroke-width="3"/>');
}
/** a frying pan */
export function pan(s: number): string {
  return svg(170, 70, s, '<path d="M110 36H164" stroke-width="12"/><path d="M110 36H164" stroke="#5d4030" stroke-width="7"/><ellipse cx="58" cy="34" rx="54" ry="22" fill="#3a3f55" stroke-width="5"/><ellipse cx="58" cy="31" rx="44" ry="15" fill="#22273a" stroke-width="3"/>' +
    '<ellipse cx="52" cy="30" rx="12" ry="7" fill="#fff6d8" stroke-width="2.5"/><circle cx="54" cy="30" r="4.5" fill="#ffb300" stroke="none"/>');
}
/** a spreadsheet, one cell lit red */
export function sheet(col: string, s: number): string {
  let g = '';
  for (let r = 0; r < 5; r++) for (let q = 0; q < 4; q++) {
    const lit = r === 3 && q === 2;
    g += '<rect x="' + (14 + q * 32) + '" y="' + (22 + r * 18) + '" width="32" height="18" fill="' + (lit ? '#e23a4f' : r === 0 ? '#cfe8d2' : W) + '" stroke-width="2"/>';
  }
  return svg(156, 126, s, '<rect x="4" y="4" width="148" height="118" rx="8" fill="#e9f3ea" stroke-width="4"/><rect x="4" y="4" width="148" height="14" rx="6" fill="' + col + '" stroke-width="3"/>' + g +
    '<text x="94" y="91" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700" font-size="10" fill="' + W + '" stroke="none">#DEBOLE</text>');
}

/* ---------- Valentin ---------- */
/** a disco ball on its string */
export function disco(s: number): string {
  let t = '';
  for (let r = 0; r < 5; r++) for (let q = 0; q < 6; q++) {
    const x = 18 + q * 11 + (r % 2) * 5, y = 30 + r * 11, d = Math.hypot(x - 50, y - 52);
    if (d < 30) t += '<rect x="' + x + '" y="' + y + '" width="9" height="9" fill="' + ['#c9d3e3', W, '#9fc6ef', '#ffd2f0', '#fff6b0'][(r * 3 + q) % 5] + '" stroke="none"/>';
  }
  return svg(100, 100, s, '<path d="M50 0V20" stroke-width="3"/><circle cx="50" cy="52" r="32" fill="#aeb8cc" stroke-width="5"/>' + t + '<circle cx="50" cy="52" r="32" fill="none" stroke-width="5"/><path d="M34 36L40 42M62 34L64 38" stroke="' + W + '" stroke-width="4"/>');
}
/** a hypnotic spiral */
export function spiral(col: string, s: number): string {
  let d = 'M50 50', a = 0, r = 0;
  for (let k = 0; k < 64; k++) { a += 0.42; r += 0.72; d += ' L' + (50 + Math.cos(a) * r).toFixed(1) + ' ' + (50 + Math.sin(a) * r).toFixed(1); }
  return svg(100, 100, s, '<circle cx="50" cy="50" r="48" fill="' + W + '" stroke-width="4"/><path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="7"/><path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="4"/>');
}
/** the arrow that goes round: do it again */
export function loop(col: string, s: number): string {
  return svg(100, 100, s, '<path d="M78 40A30 30 0 1 0 80 62" fill="none" stroke-width="12"/><path d="M78 40A30 30 0 1 0 80 62" fill="none" stroke="' + col + '" stroke-width="7"/><path d="M64 34L84 40L84 18Z" fill="' + col + '" stroke-width="4"/>');
}
/** green sunglasses: the King of green */
export function shades(s: number): string {
  return svg(160, 60, s, '<path d="M62 22Q80 14 98 22" fill="none" stroke-width="6"/><path d="M8 18L20 20M152 18L140 20" stroke-width="6"/>' +
    '<path d="M18 14H68Q70 50 44 52Q18 50 18 14Z" fill="#2e8f4e" stroke-width="6"/><path d="M92 14H142Q142 50 116 52Q90 50 92 14Z" fill="#2e8f4e" stroke-width="6"/><path d="M28 22L40 20M102 22L114 20" stroke="#bff0c9" stroke-width="4"/>');
}
/** a crown of leaves */
export function leafCrown(s: number): string {
  let l = '';
  for (let k = 0; k < 7; k++) { const a = Math.PI + k / 6 * Math.PI, x = 70 + Math.cos(a) * 52, y = 56 + Math.sin(a) * 30; l += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="12" ry="6" transform="rotate(' + (a * 57.3 + 90).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')" fill="' + (k % 2 ? '#57c968' : '#2e8f4e') + '" stroke-width="3"/>'; }
  return svg(140, 70, s, '<path d="M18 56Q70 10 122 56" fill="none" stroke="#8a5a3a" stroke-width="5"/>' + l);
}
/** a little partygoer of the conga line: a party hat and arms up */
export function conga(col: string, s: number): string {
  return svg(60, 90, s, '<path d="M30 2L40 26H20Z" fill="' + col + '" stroke-width="3.5"/><circle cx="30" cy="2" r="4" fill="#ffd84d" stroke-width="2.5"/><circle cx="30" cy="38" r="13" fill="#f2c9a8" stroke-width="4"/>' +
    '<path d="M24 36V38M36 36V38" stroke-width="3.5"/><path d="M24 43Q30 47 36 43" fill="none" stroke-width="3"/><path d="M18 52H42L46 84H14Z" fill="' + col + '" stroke-width="4"/><path d="M18 56L4 46M42 56L56 46" stroke-width="5"/>');
}
/** a speaker box */
export function speaker(s: number): string {
  return svg(80, 120, s, '<rect x="6" y="4" width="68" height="112" rx="8" fill="#2c3146" stroke-width="5"/><circle cx="40" cy="30" r="14" fill="#151927" stroke-width="3.5"/><circle cx="40" cy="30" r="5" fill="#5d6394" stroke="none"/>' +
    '<circle cx="40" cy="78" r="26" fill="#151927" stroke-width="3.5"/><circle cx="40" cy="78" r="16" fill="#3a3f55" stroke-width="2.5"/><circle cx="40" cy="78" r="6" fill="#5d6394" stroke="none"/>');
}
/** a cocktail, with its umbrella */
export function cocktail(col: string, s: number): string {
  return svg(80, 110, s, '<path d="M8 20H72L40 58Z" fill="' + col + '" stroke-width="4.5"/><path d="M14 26H66" stroke="' + W + '" stroke-width="3" opacity=".7"/><path d="M40 58V96M22 100H58" stroke-width="5"/>' +
    '<path d="M52 18L66 2" stroke-width="3"/><path d="M50 4Q62 -6 74 6Z" fill="#ff8fc1" stroke-width="3"/><circle cx="24" cy="18" r="7" fill="#ffd84d" stroke-width="3"/>');
}

/* ---------- Forchetta ---------- */
/** a tyre, with its rim */
export function tyre(s: number): string {
  return svg(100, 100, s, '<circle cx="50" cy="50" r="44" fill="#22273a" stroke-width="5"/><circle cx="50" cy="50" r="26" fill="#c9d3e3" stroke-width="4"/><circle cx="50" cy="50" r="8" fill="#e23a4f" stroke-width="3"/>' +
    [0, 1, 2, 3, 4].map(function (k) { const a = k / 5 * Math.PI * 2; return '<path d="M' + (50 + Math.cos(a) * 9).toFixed(1) + ' ' + (50 + Math.sin(a) * 9).toFixed(1) + 'L' + (50 + Math.cos(a) * 24).toFixed(1) + ' ' + (50 + Math.sin(a) * 24).toFixed(1) + '" stroke-width="4"/>'; }).join('') +
    '<path d="M50 6A44 44 0 0 1 90 32" fill="none" stroke="#e23a4f" stroke-width="4"/>');
}
/** a wrench */
export function wrench(s: number): string {
  return svg(130, 60, s, '<path d="M30 30H112" stroke-width="16"/><path d="M30 30H112" stroke="#c9d3e3" stroke-width="10"/><path d="M8 12A20 20 0 1 0 40 22L30 30L40 38A20 20 0 1 0 8 48L18 38V22Z" fill="#c9d3e3" stroke-width="4"/>' +
    '<circle cx="114" cy="30" r="12" fill="#c9d3e3" stroke-width="4"/><circle cx="114" cy="30" r="4" fill="' + INK + '" stroke="none"/>');
}
/** a stopwatch with a time on it */
export function timer(col: string, s: number, text: string): string {
  return svg(100, 116, s, '<rect x="40" y="2" width="20" height="12" rx="3" fill="#c9d3e3" stroke-width="3.5"/><path d="M78 24L86 16" stroke-width="5"/><circle cx="50" cy="66" r="46" fill="' + W + '" stroke-width="6"/>' +
    '<circle cx="50" cy="66" r="38" fill="none" stroke="' + col + '" stroke-width="4" stroke-dasharray="6 4"/><text x="50" y="76" text-anchor="middle" font-family="ui-monospace,monospace" font-weight="700" font-size="26" fill="' + INK + '" stroke="none">' + esc(text) + '</text>');
}
/** a phone with a message nobody understands */
export function phone(col: string, s: number, text: string): string {
  return svg(80, 130, s, '<rect x="6" y="4" width="68" height="122" rx="12" fill="#2c3146" stroke-width="5"/><rect x="12" y="16" width="56" height="96" rx="4" fill="#eef3ff" stroke="none"/>' +
    '<path d="M18 34H58Q62 34 62 38V52Q62 56 58 56H28L20 62V38Q20 34 18 34Z" fill="' + col + '" stroke-width="2.5"/><text x="40" y="50" text-anchor="middle" font-family="\'Patrick Hand\',\'Comic Sans MS\',cursive" font-weight="700" font-size="13" fill="' + INK + '" stroke="none">' + esc(text) + '</text>' +
    '<path d="M24 70H52M24 80H46" stroke="#a9afc2" stroke-width="5"/><rect x="30" y="118" width="20" height="4" rx="2" fill="#5d6394" stroke="none"/>');
}
/** a tennis net */
export function net(s: number): string {
  let g = '';
  for (let k = 0; k <= 10; k++) g += '<path d="M' + (10 + k * 14) + ' 14V66"/>';
  for (let k = 0; k <= 3; k++) g += '<path d="M10 ' + (14 + k * 17) + 'H150"/>';
  return svg(160, 80, s, '<path d="M6 8V78M154 8V78" stroke-width="6"/><g stroke-width="2" opacity=".85">' + g + '</g><rect x="6" y="8" width="148" height="9" rx="3" fill="' + W + '" stroke-width="3"/>');
}
/** a game pad */
export function gamepad(col: string, s: number): string {
  return svg(140, 90, s, '<path d="M30 14H110C128 14 136 34 136 56C136 76 126 86 114 82L94 66H46L26 82C14 86 4 76 4 56C4 34 12 14 30 14Z" fill="' + col + '" stroke-width="5"/>' +
    '<path d="M30 36V56M20 46H40" stroke="' + INK + '" stroke-width="7"/><circle cx="100" cy="38" r="6" fill="#e23a4f" stroke-width="3"/><circle cx="112" cy="50" r="6" fill="#57c968" stroke-width="3"/><circle cx="88" cy="50" r="6" fill="#5ab0ff" stroke-width="3"/>');
}
/** a scoreboard */
export function scoreboard(s: number, text: string): string {
  return svg(180, 70, s, '<rect x="4" y="4" width="172" height="62" rx="8" fill="#20263a" stroke-width="5"/><text x="90" y="46" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-weight="700" font-size="30" fill="#ffd166" stroke="none">' + esc(text) + '</text>');
}
/** the wave of Formia: the sea, in white and blue */
export function wave(s: number): string {
  return svg(220, 110, s, '<path d="M2 108V60C30 30 70 20 104 34C80 42 74 62 94 74C112 84 140 70 150 50C170 60 196 80 218 76V108Z" fill="#3b8fd9" stroke-width="5"/>' +
    '<path d="M14 72C40 50 70 44 92 50M118 80C140 76 154 66 160 58" fill="none" stroke="' + W + '" stroke-width="6"/><path d="M104 34C90 36 84 48 90 58" fill="none" stroke="' + W + '" stroke-width="4"/>');
}

/* ---------- Zendavid ---------- */
/** a dog's face, barking */
export function dog(col: string, s: number): string {
  return svg(120, 110, s, '<path d="M22 16C8 22 6 52 18 62C26 50 30 34 34 22Z" fill="#8a5a3a" stroke-width="4.5"/><path d="M98 16C112 22 114 52 102 62C94 50 90 34 86 22Z" fill="#8a5a3a" stroke-width="4.5"/>' +
    '<path d="M60 10C88 10 98 34 98 56C98 82 80 100 60 100C40 100 22 82 22 56C22 34 32 10 60 10Z" fill="' + col + '" stroke-width="5"/><circle cx="44" cy="46" r="6" fill="' + INK + '" stroke="none"/><circle cx="76" cy="46" r="6" fill="' + INK + '" stroke="none"/>' +
    '<ellipse cx="60" cy="64" rx="11" ry="8" fill="' + INK + '" stroke="none"/><path d="M40 76Q60 100 80 76Z" fill="#c2263a" stroke-width="4"/><path d="M50 86Q60 92 70 86" fill="none" stroke="#ff8fa0" stroke-width="4"/>');
}
/** a microphone on its stand */
export function micStand(s: number): string {
  return svg(70, 160, s, '<path d="M35 46V146M14 152H56" stroke-width="6"/><path d="M35 46V146" stroke="#c9d3e3" stroke-width="2.5"/><rect x="20" y="4" width="30" height="46" rx="15" fill="#3a3f55" stroke-width="5"/>' +
    '<path d="M24 18H46M24 28H46M24 38H46" stroke="#8d93c4" stroke-width="2.5"/><path d="M28 10Q32 6 38 8" fill="none" stroke="' + W + '" stroke-width="3"/>');
}
/** a cricket, who is the only one laughing */
export function cricket(s: number): string {
  return svg(90, 60, s, '<path d="M30 30Q50 6 76 20" fill="none" stroke-width="3"/><path d="M20 30Q8 6 2 8M24 26Q20 4 30 2" fill="none" stroke-width="2.5"/><ellipse cx="44" cy="38" rx="28" ry="12" fill="#57c968" stroke-width="4"/>' +
    '<circle cx="18" cy="34" r="9" fill="#57c968" stroke-width="3.5"/><circle cx="15" cy="32" r="2.5" fill="' + INK + '" stroke="none"/><path d="M40 48L32 58M54 48L62 58M64 40L84 56" stroke-width="3.5"/>');
}
/** headphones */
export function headphones(col: string, s: number): string {
  return svg(140, 110, s, '<path d="M20 70V56A50 50 0 0 1 120 56V70" fill="none" stroke-width="13"/><path d="M20 70V56A50 50 0 0 1 120 56V70" fill="none" stroke="' + col + '" stroke-width="7"/>' +
    '<rect x="6" y="58" width="30" height="46" rx="12" fill="#2c3146" stroke-width="5"/><rect x="104" y="58" width="30" height="46" rx="12" fill="#2c3146" stroke-width="5"/><path d="M14 66V96M126 66V96" stroke="' + col + '" stroke-width="4"/>');
}
/** a vinyl record */
export function vinyl(col: string, s: number): string {
  return svg(100, 100, s, '<circle cx="50" cy="50" r="46" fill="#151927" stroke-width="4"/><circle cx="50" cy="50" r="36" fill="none" stroke="#3a3f55" stroke-width="2"/><circle cx="50" cy="50" r="27" fill="none" stroke="#3a3f55" stroke-width="2"/>' +
    '<circle cx="50" cy="50" r="15" fill="' + col + '" stroke-width="3"/><circle cx="50" cy="50" r="3" fill="' + INK + '" stroke="none"/><path d="M22 30A34 34 0 0 1 40 16" fill="none" stroke="' + W + '" stroke-width="3" opacity=".6"/>');
}
/** a sound wave, as a sampler shows it */
export function waveform(col: string, s: number): string {
  let d = '';
  for (let k = 0; k < 36; k++) { const h = 6 + Math.abs(Math.sin(k * 0.7) * Math.cos(k * 0.23)) * 34; d += '<path d="M' + (8 + k * 5) + ' ' + (50 - h).toFixed(1) + 'V' + (50 + h).toFixed(1) + '"/>'; }
  return svg(196, 100, s, '<rect x="2" y="2" width="192" height="96" rx="10" fill="#20263a" stroke-width="4"/><g stroke="' + col + '" stroke-width="3">' + d + '</g><rect x="70" y="6" width="54" height="88" fill="' + W + '" fill-opacity=".2" stroke="#ffd84d" stroke-width="3"/>');
}
/** a level meter, bars rising */
export function meter(col: string, s: number, level: number): string {
  let b = '';
  for (let k = 0; k < 10; k++) b += '<rect x="' + (10 + k * 14) + '" y="' + (70 - k * 6) + '" width="10" height="' + (k * 6 + 8) + '" rx="2" fill="' + (k < level ? (k > 7 ? '#e23a4f' : k > 5 ? '#ffd84d' : col) : '#3a3f55') + '" stroke="none"/>';
  return svg(160, 90, s, '<rect x="2" y="2" width="156" height="86" rx="10" fill="#20263a" stroke-width="4"/>' + b);
}

/* ---------- Claudia ---------- */
/** an ear, listening */
export function ear(col: string, s: number): string {
  return svg(80, 110, s, '<path d="M60 40C60 18 46 6 32 6C16 6 6 20 6 38C6 56 18 62 22 74C26 86 22 104 40 104C54 104 56 90 56 80C56 66 60 58 60 40Z" fill="#f0c4a6" stroke-width="5"/>' +
    '<path d="M44 40C44 28 38 22 32 22C24 22 20 30 22 38C24 46 30 48 30 56" fill="none" stroke-width="4"/>' +
    '<path d="M66 30Q74 40 66 50M72 20Q86 40 72 60" fill="none" stroke="' + col + '" stroke-width="4"/>');
}
/** a table from above, with its three glasses */
export function tableTop(col: string, s: number): string {
  return svg(130, 80, s, '<rect x="4" y="10" width="122" height="60" rx="12" fill="#a8734c" stroke-width="5"/><path d="M14 24H116M14 56H116" stroke="#8a5a3a" stroke-width="3"/>' +
    [28, 65, 102].map(function (x) { return '<circle cx="' + x + '" cy="40" r="10" fill="#ffd166" fill-opacity=".85" stroke-width="3.5"/><circle cx="' + (x - 3) + '" cy="37" r="3" fill="' + W + '" stroke="none"/>'; }).join('') +
    '<rect x="45" y="0" width="40" height="10" rx="4" fill="' + col + '" stroke-width="3"/>');
}
/** the sign of the Trinità: a triangle with a light at each corner */
export function trinity(col: string, s: number): string {
  return svg(140, 130, s, '<path d="M70 10L130 116H10Z" fill="none" stroke-width="11"/><path d="M70 10L130 116H10Z" fill="none" stroke="' + col + '" stroke-width="6"/><circle cx="70" cy="74" r="14" fill="none" stroke="' + W + '" stroke-width="4"/>' +
    [[70, 10], [130, 116], [10, 116]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" fill="' + W + '" stroke-width="4"/><circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="' + col + '" stroke="none"/>'; }).join(''));
}
/** a road sign with its arrows the wrong way */
export function roadSign(col: string, s: number, text: string): string {
  return svg(150, 150, s, '<path d="M75 74V146" stroke-width="7"/><path d="M75 74V146" stroke="#c9d3e3" stroke-width="3"/>' +
    '<path d="M14 18H118L138 34L118 50H14Z" fill="' + col + '" stroke-width="5"/><text x="70" y="40" text-anchor="middle" font-family="\'Lilita One\',sans-serif" font-size="15" fill="' + W + '" stroke="none">' + esc(text) + '</text>' +
    '<path d="M136 58H32L12 74L32 90H136Z" fill="#fbf8ef" stroke-width="5"/><path d="M50 74H118M50 74L62 64M50 74L62 84" fill="none" stroke="#e23a4f" stroke-width="5"/>');
}
/** a candle */
export function candle(s: number): string {
  return svg(40, 90, s, '<path d="M20 4C26 14 30 20 30 26A10 10 0 0 1 10 26C10 20 14 14 20 4Z" fill="#ffd84d" stroke-width="3"/><path d="M20 16C22 20 24 22 24 26A4 4 0 0 1 16 26C16 22 18 20 20 16Z" fill="' + W + '" stroke="none"/>' +
    '<rect x="10" y="36" width="20" height="50" rx="3" fill="#fbf3dc" stroke-width="3.5"/><path d="M20 30V36" stroke-width="2.5"/>');
}
/** a halo */
export function halo(col: string, s: number): string {
  return svg(140, 50, s, '<ellipse cx="70" cy="25" rx="62" ry="16" fill="none" stroke-width="11"/><ellipse cx="70" cy="25" rx="62" ry="16" fill="none" stroke="' + col + '" stroke-width="7"/><ellipse cx="70" cy="25" rx="62" ry="16" fill="none" stroke="' + W + '" stroke-width="2.5"/>');
}

/* ---------- everyone's ---------- */
/** a word in big comic letters */
export function word(text: string, col: string, px: number): string {
  return '<b class="fm-word" style="--c:' + col + ';font-size:' + Math.round(px) + 'px">' + esc(text) + '</b>';
}
/** a speech bubble */
export function bubble(text: string, col: string, px: number): string {
  return '<b class="fm-bubble" style="--c:' + col + ';font-size:' + Math.round(px) + 'px">' + esc(text) + '</b>';
}
/** a five-pointed star */
export function star(col: string, s: number): string {
  return svg(40, 40, s, '<path d="M20 2L25 14L38 15L28 24L31 37L20 30L9 37L12 24L2 15L15 14Z" fill="' + col + '" stroke-width="3"/>');
}
/** a music note */
export function note(col: string, s: number): string {
  return svg(32, 40, s, '<path d="M12 32V6L28 2V10L12 14" fill="none" stroke-width="4"/><ellipse cx="7.5" cy="32.5" rx="6.5" ry="5" fill="' + col + '" stroke-width="3"/>');
}
/** a question mark, or any glyph, in a circle */
export function glyphDot(text: string, col: string, s: number): string {
  return svg(40, 40, s, '<circle cx="20" cy="20" r="17" fill="' + col + '" stroke-width="3"/><text x="20" y="27" text-anchor="middle" font-family="\'Lilita One\',sans-serif" font-size="20" fill="' + W + '" stroke="' + INK + '" stroke-width="2.5" paint-order="stroke">' + esc(text) + '</text>');
}
/** a spotlight's cone of light, from the top */
export function cone(col: string, s: number): string {
  return svg(160, 260, s, '<defs><linearGradient id="fmcone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + W + '" stop-opacity=".9"/><stop offset="1" stop-color="' + col + '" stop-opacity=".12"/></linearGradient></defs>' +
    '<path d="M66 0H94L158 252Q80 268 2 252Z" fill="url(#fmcone)" stroke="none"/><ellipse cx="80" cy="252" rx="78" ry="10" fill="' + col + '" fill-opacity=".35" stroke="none"/>');
}
/** a confetti bit */
export function confetto(col: string, s: number, k: number): string {
  return svg(20, 20, s, k % 3 === 0 ? '<rect x="4" y="7" width="12" height="6" rx="1.5" fill="' + col + '" stroke-width="1.8"/>' : k % 3 === 1 ? '<circle cx="10" cy="10" r="5" fill="' + col + '" stroke-width="1.8"/>' : '<path d="M3 15Q8 3 10 10T17 5" fill="none" stroke="' + col + '" stroke-width="3"/>');
}
