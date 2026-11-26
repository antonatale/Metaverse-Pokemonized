import { netSVG } from './nets';
import { NET_IDS } from '../../data/nets';

/* The things of the bag, drawn (24 November 2026, Antonio: «anche il design degli elementi stessi quando li vedi nel menu
   o in partita deve essere migliorato»): one sticker each, as the nets and the creatures are, with fixed colours, a dark
   outline and a spot of light. The same drawing is used everywhere: the bag, the shops, the battle, what is found or won.
   wareSVG(id, size) is the thing; the nets come from nets.ts. Besides the things of the bag there are the sesterzi and
   the things found around town (the amphora, the bottle) for the cards of what has been won. */

const INK = '#1c2340';
const S = ' stroke="' + INK + '" stroke-linejoin="round" stroke-linecap="round"';
/** a small four-point star of light */
function star(x: number, y: number, r: number, col = '#ffffff'): string {
  const a = r, b = r * 0.32;
  return '<path d="M' + x + ' ' + (y - a) + 'L' + (x + b) + ' ' + (y - b) + 'L' + (x + a) + ' ' + y + 'L' + (x + b) + ' ' + (y + b) + 'L' + x + ' ' + (y + a) + 'L' + (x - b) + ' ' + (y + b) + 'L' + (x - a) + ' ' + y + 'L' + (x - b) + ' ' + (y - b) + 'Z" fill="' + col + '"' + S + ' stroke-width="1.4"/>';
}
const ART: Record<string, string> = {
  /* the food of the gods, in a little round flask: gold and honey, a cork, a ribbon, and light around it */
  ambrosia:
    '<circle cx="32" cy="38" r="24" fill="#ffe8a3" opacity=".45"/>' +
    '<path d="M27 11h10v10c7 2.6 13 8.6 13 17.5C50 49 42 56 32 56S14 49 14 38.5C14 29.6 20 23.6 27 21Z" fill="#fdf6e3"' + S + ' stroke-width="3.4"/>' +
    '<path d="M16.5 38c4.5-2.6 9.5 1.6 15.5 0s10.5-3 15.6-.4C47.4 48 40.6 53.5 32 53.5S16.8 48 16.5 38Z" fill="#ffb92e"/>' +
    '<path d="M18.5 44c5 1.6 10-1 14 0s7.6 1.8 11.6-.4C41.5 50 37 52.6 32 52.6S21 50 18.5 44Z" fill="#f08a24"/>' +
    '<path d="M20 31c1.6-3.6 4.4-6 7.6-7.2" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>' +
    '<circle cx="38" cy="45" r="2" fill="#fff3c4"/><circle cx="26" cy="47.5" r="1.4" fill="#fff3c4"/>' +
    '<rect x="25" y="5" width="14" height="8" rx="2.5" fill="#b57a45"' + S + ' stroke-width="3"/>' +
    '<path d="M27 21c3 2 7 2 10 0" fill="none" stroke="#e8473a" stroke-width="3.4"/><path d="M37 21l4 6M35.5 22l1 7" stroke="#e8473a" stroke-width="2.6" stroke-linecap="round"/>' +
    star(52, 14, 6, '#fff6c9') + star(10, 22, 4, '#fff6c9'),
  /* the tiella of Gaeta and Formia: a round pie seen from the side, its crust crimped, three cuts on top */
  tiella:
    '<path d="M7 33v9c0 6.6 11.2 12 25 12s25-5.4 25-12v-9" fill="#d48a35"' + S + ' stroke-width="3.4"/>' +
    '<path d="M9 42c4 3.6 12.6 6 23 6s19-2.4 23-6" fill="none" stroke="#a9651f" stroke-width="2"/>' +
    '<ellipse cx="32" cy="33" rx="25" ry="12" fill="#f2c068"' + S + ' stroke-width="3.4"/>' +
    '<ellipse cx="32" cy="33" rx="19" ry="8" fill="#f7d58c"/>' +
    '<path d="M22 31l6 2M30 28l6 2M36 34l6 2" stroke="#9c5a1c" stroke-width="2.6"/>' +
    '<path d="M10 30.5l3 1.5M15 25.5l2 2.4M22 22.4l1.2 2.8M31 21.2v3M40 21.8l-1 2.9M47.5 24.4l-1.8 2.5M53.4 29l-2.8 1.8" stroke="#c07a2c" stroke-width="2"/>' +
    '<path d="M17 29c2-3 6-5 10-5.6" fill="none" stroke="#fff6dc" stroke-width="2.4"/>',
  /* a slice of it, with the filling showing: scarola and octopus */
  fetta:
    '<path d="M8 40L52 26l4 10L13 52Z" fill="#d48a35"' + S + ' stroke-width="3.2"/>' +
    '<path d="M11 45L53.6 31l1 2.6L12.2 48.4Z" fill="#6f9a3c"/><circle cx="24" cy="44" r="2" fill="#e05a4a"/><circle cx="38" cy="39.5" r="1.8" fill="#e05a4a"/><circle cx="31" cy="42" r="1.2" fill="#fff3d6"/>' +
    '<path d="M8 40L52 26L40 14Z" fill="#f2c068"' + S + ' stroke-width="3.2"/>' +
    '<path d="M34 22l4 2M26 27l4 2" stroke="#9c5a1c" stroke-width="2.4"/><path d="M16 36c5-5 11-9 18-12" fill="none" stroke="#fff6dc" stroke-width="2.2"/>',
  /* the ciambella all'anice: a ring of biscuit with white sugar and the seeds */
  ciambella:
    '<path fill-rule="evenodd" d="M32 12c13.8 0 25 8.6 25 19.5S45.8 51 32 51 7 42.4 7 31.5 18.2 12 32 12Zm0 12c-5.5 0-10 3.4-10 7.5S26.5 39 32 39s10-3.4 10-7.5S37.5 24 32 24Z" fill="#e7b76a"' + S + ' stroke-width="3.4"/>' +
    '<path d="M10 28c3-9 13-13.4 22-13.4S51 19 54 28c-2 2.6-4.6 1-6.4 3.6-1 1.5-3.6 1.2-4.6-.4C41 26 37 24 32 24s-9 2-11 7.2c-1 1.6-3.6 1.9-4.6.4C14.6 29 12 30.6 10 28Z" fill="#fffaf0"' + S + ' stroke-width="2"/>' +
    '<path d="M18 21l2 1M28 17.6l1.6 1.4M40 18.4l-1.4 1.6M47 23l-2 .6M24 25.5l1.4 1M37 23.6l1.6-.4" stroke="#6b4a2a" stroke-width="2.2"/>' +
    '<path d="M14 23c3-4 8-6.6 13-7.4" fill="none" stroke="#ffffff" stroke-width="2.4"/>',
  /* two olives of Gaeta on their twig */
  oliva:
    '<path d="M10 16c10 0 18 4 26 12" fill="none" stroke="#7a5a2a" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M18 17c-4-8 2-13 10-12-1 7-4 11-10 12Z" fill="#8fb04a"' + S + ' stroke-width="2.4"/><path d="M27 21c3-8 10-9 16-5-4 6-9 8-16 5Z" fill="#7a9a3a"' + S + ' stroke-width="2.4"/>' +
    '<path d="M34 26c-2 6-10 10-15 16" fill="none" stroke="#7a5a2a" stroke-width="2.6"/>' +
    '<ellipse cx="22" cy="44" rx="11" ry="13" transform="rotate(-20 22 44)" fill="#5b2a4a"' + S + ' stroke-width="3.2"/>' +
    '<ellipse cx="42" cy="40" rx="11" ry="13" transform="rotate(18 42 40)" fill="#7a3a5e"' + S + ' stroke-width="3.2"/>' +
    '<path d="M16 38c1-3 3-5 5.4-6" fill="none" stroke="#e7b9d4" stroke-width="2.6"/><path d="M37 33c1.6-2.6 4-4 6.4-4.4" fill="none" stroke="#f0c9dc" stroke-width="2.6"/>',
  /* a mussel, a little open: the dark shell and the orange inside */
  cozza:
    '<path d="M12 50C8 36 18 14 40 8c8-2 14 4 12 12-4 16-20 30-40 30Z" fill="#f08a4b"' + S + ' stroke-width="3"/>' +
    '<path d="M12 50C14 36 24 18 44 10c6-2 10 2 8 8-5 15-22 28-40 32Z" fill="#2f3550"' + S + ' stroke-width="3.2"/>' +
    '<path d="M18 44c6-9 14-18 26-26M22 46c5-6 12-12 21-18M16 40c5-9 12-17 22-25" fill="none" stroke="#5a6488" stroke-width="2"/>' +
    '<path d="M40 14c3-1.4 6-1.2 8 .4" fill="none" stroke="#c9d3f0" stroke-width="2.4"/>',
  /* a sea horn: the shell of a triton, spiralled */
  corno:
    '<path d="M7 55C11 35 25 17 45 9l11 19C39 31 22 41 7 55Z" fill="#ffd8b8"' + S + ' stroke-width="3.2"/>' +
    '<path d="M18 39l6 6M26 30l7 6.6M35 22.6l7 6M44 15.4l6.6 6" stroke="#e8875a" stroke-width="3.6"/>' +
    '<ellipse cx="50.5" cy="18.5" rx="6.6" ry="11" transform="rotate(-32 50.5 18.5)" fill="#f7a88a"' + S + ' stroke-width="3"/>' +
    '<ellipse cx="51.2" cy="19.4" rx="3" ry="6" transform="rotate(-32 51.2 19.4)" fill="#c8614a"/>' +
    '<path d="M12 44c4-9 10-17 18-23" fill="none" stroke="#ffffff" stroke-width="2.4"/>',
  /* what the legends leave: Lamo's crown, Janus's key, the flame of Saint Elmo */
  corona:
    '<path d="M10 46L8 18l13 12 11-18 11 18 13-12-2 28Z" fill="#ffd84d"' + S + ' stroke-width="3.4"/>' +
    '<rect x="10" y="44" width="44" height="9" rx="3" fill="#f2b62e"' + S + ' stroke-width="3.2"/>' +
    '<circle cx="32" cy="34" r="4.4" fill="#e8473a"' + S + ' stroke-width="2"/><circle cx="19" cy="38" r="3" fill="#3b8fd9"' + S + ' stroke-width="2"/><circle cx="45" cy="38" r="3" fill="#57c968"' + S + ' stroke-width="2"/>' +
    '<circle cx="8" cy="18" r="3" fill="#fff6c9"' + S + ' stroke-width="2"/><circle cx="32" cy="12" r="3" fill="#fff6c9"' + S + ' stroke-width="2"/><circle cx="56" cy="18" r="3" fill="#fff6c9"' + S + ' stroke-width="2"/>',
  chiave:
    '<circle cx="20" cy="22" r="13" fill="#d9a441"' + S + ' stroke-width="3.4"/><circle cx="20" cy="22" r="5.5" fill="#fdf6e3"' + S + ' stroke-width="2.6"/>' +
    '<path d="M29 31l23 23" stroke="' + INK + '" stroke-width="9" stroke-linecap="round"/><path d="M29 31l23 23" stroke="#d9a441" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M42 44l-5 5M48 50l-4 4" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M42 44l-5 5M48 50l-4 4" stroke="#d9a441" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M12 16c2-3 5-4.6 8-4.6" fill="none" stroke="#fff3c4" stroke-width="2.4"/>',
  fiammella:
    '<circle cx="32" cy="36" r="22" fill="#b9d8ff" opacity=".45"/>' +
    '<path d="M32 6c6 10 18 16 18 30 0 10-8 18-18 18s-18-8-18-18c0-8 5-11 8-17 1 5 3 7 6 8-1-9 1-15 4-21Z" fill="#4f7df0"' + S + ' stroke-width="3.2"/>' +
    '<path d="M32 24c4 6 10 10 10 18 0 6-4.4 10-10 10s-10-4-10-10c0-5 3-7 5-11 1 3 2 4 4 5-.6-5 0-9 1-12Z" fill="#a9c8ff"/>' +
    '<path d="M32 38c2 3 4 5 4 8a4 4 0 0 1-8 0c0-3 2-5 4-8Z" fill="#ffffff"/>',
  /* the pharmacy's balm */
  balsamo:
    '<rect x="16" y="12" width="32" height="11" rx="3" fill="#57c968"' + S + ' stroke-width="3.4"/>' +
    '<rect x="12" y="21" width="40" height="34" rx="9" fill="#ffffff"' + S + ' stroke-width="3.4"/>' +
    '<path d="M29 29h6v6h6v6h-6v6h-6v-6h-6v-6h6Z" fill="#2ecc71"' + S + ' stroke-width="2"/><path d="M17 30c0-3 1.6-5 4-5.6" fill="none" stroke="#d8f3de" stroke-width="2.4"/>',
  /* a paper cone of anchovies, silver and blue, from the fishmonger of Mola */
  alici:
    '<g fill="#c3d0de"' + S + ' stroke-width="2.4">' +
    '<path d="M21 4c4 3 5 10 4 16l-6 1c-3-5-2-12 2-17Z"/><path d="M33 2c4 4 4 11 2 17h-6c-2-6-1-13 4-17Z"/><path d="M46 6c3 4 1 11-3 16l-6-2c0-6 3-12 9-14Z"/></g>' +
    '<path d="M22 8v10M33 6v11M44 10l-4 9" stroke="#3b6fb0" stroke-width="1.8" stroke-linecap="round"/>' +
    '<circle cx="21.5" cy="8" r="1.4" fill="' + INK + '"/><circle cx="33" cy="6.2" r="1.4" fill="' + INK + '"/><circle cx="45" cy="9.8" r="1.4" fill="' + INK + '"/>' +
    '<path d="M11 19h42L32 59Z" fill="#f3e3c3"' + S + ' stroke-width="3.4"/><path d="M16 27h32M20 35h24M24 43h16" stroke="#d6bf92" stroke-width="2.4"/>' +
    '<path d="M11 19h42" stroke="#3b8fd9" stroke-width="4"/>',
  /* a manual, with its bookmark */
  manuale:
    '<rect x="14" y="8" width="36" height="48" rx="3" fill="#3b8fd9"' + S + ' stroke-width="3.4"/>' +
    '<path d="M21 8v48" stroke="' + INK + '" stroke-width="3"/><rect x="27" y="18" width="18" height="9" rx="1.5" fill="#ffffff"' + S + ' stroke-width="2"/>' +
    '<path d="M41 50v12l4-3.6 4 3.6V50" fill="#e8473a"' + S + ' stroke-width="2.4"/><path d="M28 34h14M28 40h10" stroke="#a9d0f5" stroke-width="2.4"/>',
  giornale:
    '<rect x="9" y="11" width="46" height="42" rx="2" fill="#fdfaf0"' + S + ' stroke-width="3.4"/>' +
    '<path d="M15 19h34" stroke="' + INK + '" stroke-width="4"/><rect x="15" y="25" width="15" height="13" fill="#9aa3b8"/>' +
    '<path d="M34 26h15M34 31h15M34 36h15M15 43h34M15 48h26" stroke="' + INK + '" stroke-width="2"/>',
  /* the gifts of the keepers of the covi (data/covo-places.ts), and the keys of the scooter */
  visore:
    '<path d="M8 26c0-5 4-8 9-8h30c5 0 9 3 9 8v10c0 5-4 8-9 8H40l-4-5h-8l-4 5h-7c-5 0-9-3-9-8Z" fill="#3b4a7a"' + S + ' stroke-width="3.2"/>' +
    '<rect x="13" y="23" width="16" height="13" rx="5" fill="#6fd3ff"' + S + ' stroke-width="2.4"/><rect x="35" y="23" width="16" height="13" rx="5" fill="#6fd3ff"' + S + ' stroke-width="2.4"/>' +
    '<path d="M16 27l4-2M38 27l4-2" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/><path d="M4 30h4M56 30h4" stroke="' + INK + '" stroke-width="4" stroke-linecap="round"/>',
  quaderno:
    '<rect x="13" y="8" width="40" height="48" rx="4" fill="#fdfaf0"' + S + ' stroke-width="3.2"/><rect x="13" y="8" width="9" height="48" rx="3" fill="#e8473a"' + S + ' stroke-width="3"/>' +
    '<path d="M26 44c4 0 5-20 10-20s6 20 12 20" fill="none" stroke="#3b8fd9" stroke-width="3" stroke-linecap="round"/><path d="M26 47h22M28 16h20" stroke="#9aa3b8" stroke-width="2"/>',
  fischio:
    '<path d="M8 14c8 2 14 8 16 16" fill="none" stroke="#e8473a" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M22 30h26a10 10 0 0 1 0 20H30a10 10 0 0 1-10-10v-6Z" fill="#c9d2e3"' + S + ' stroke-width="3.2"/><rect x="40" y="24" width="16" height="9" rx="2" fill="#c9d2e3"' + S + ' stroke-width="3"/>' +
    '<circle cx="32" cy="40" r="4" fill="' + INK + '"/><path d="M26 36c1-2 3-3 5-3" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>' + star(52, 12, 5, '#fff6c9'),
  martisor:
    '<path d="M12 18c10-10 30-10 40 0" fill="none" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/><path d="M12 18c10-10 30-10 40 0" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 5"/>' +
    '<path d="M12 18c10-10 30-10 40 0" fill="none" stroke="#e8473a" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 5" stroke-dashoffset="5"/>' +
    '<path d="M32 12v18" stroke="' + INK + '" stroke-width="2"/><circle cx="32" cy="40" r="11" fill="#ffffff"' + S + ' stroke-width="3"/>' +
    '<path d="M32 33c3 0 4 3 2 5 3 0 4 4 1 5 1 3-2 5-3 3-1 2-4 0-3-3-3-1-2-5 1-5-2-2-1-5 2-5Z" fill="#ff8fc1"' + S + ' stroke-width="1.6"/><circle cx="32" cy="40" r="2" fill="#ffd84d"/>',
  lanterna:
    '<circle cx="32" cy="38" r="22" fill="#ffe9a8" opacity=".5"/><path d="M26 6h12M32 6v6" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/>' +
    '<path d="M22 12h20l-3 8H25Z" fill="#7a5a2a"' + S + ' stroke-width="3"/><rect x="21" y="20" width="22" height="28" rx="3" fill="#fff3c4"' + S + ' stroke-width="3.2"/>' +
    '<path d="M32 26c3 4 5 6 5 10a5 5 0 0 1-10 0c0-4 2-6 5-10Z" fill="#ff9f1c"' + S + ' stroke-width="1.8"/><path d="M20 48h24v6H20Z" fill="#7a5a2a"' + S + ' stroke-width="3"/>',
  tessera:
    '<rect x="6" y="14" width="52" height="36" rx="5" fill="#ffffff"' + S + ' stroke-width="3.2"/><path d="M6 22h52" stroke="#e8473a" stroke-width="7"/>' +
    '<rect x="12" y="29" width="13" height="15" rx="2" fill="#bba0ff"' + S + ' stroke-width="2"/><path d="M30 31h20M30 37h16M30 43h12" stroke="#9aa3b8" stroke-width="2.4" stroke-linecap="round"/>' + star(50, 40, 5, '#ffd84d'),
  cuffie:
    '<path d="M12 40V32a20 20 0 0 1 40 0v8" fill="none" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M12 40V32a20 20 0 0 1 40 0v8" fill="none" stroke="#3b8fd9" stroke-width="3.6" stroke-linecap="round"/>' +
    '<rect x="6" y="36" width="13" height="20" rx="5" fill="#2f3550"' + S + ' stroke-width="3"/><rect x="45" y="36" width="13" height="20" rx="5" fill="#2f3550"' + S + ' stroke-width="3"/>' +
    '<path d="M28 20l2 3 4-6" fill="none" stroke="#ffd84d" stroke-width="2.4" stroke-linecap="round"/>',
  chiavi:
    '<circle cx="20" cy="18" r="9" fill="none" stroke="' + INK + '" stroke-width="3"/>' +
    '<rect x="8" y="26" width="20" height="26" rx="5" fill="#3f7ccf"' + S + ' stroke-width="3"/><path d="M13 34h10M13 40h7" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/>' +
    '<circle cx="36" cy="22" r="9" fill="#d9a441"' + S + ' stroke-width="3"/><circle cx="36" cy="22" r="3" fill="#fdf6e3"' + S + ' stroke-width="1.6"/>' +
    '<path d="M42 28l14 14M50 36l-4 4M54 40l-3 3" stroke="' + INK + '" stroke-width="7" stroke-linecap="round"/><path d="M42 28l14 14M50 36l-4 4M54 40l-3 3" stroke="#d9a441" stroke-width="3.4" stroke-linecap="round"/>',
  /* the sesterzi: a little pile of coins, an S on the top one */
  sesterzi:
    '<ellipse cx="32" cy="46" rx="20" ry="7" fill="#e2a72a"' + S + ' stroke-width="3"/>' +
    '<path d="M12 40v6c0 3.8 9 7 20 7s20-3.2 20-7v-6" fill="#e2a72a"' + S + ' stroke-width="3"/>' +
    '<path d="M12 31v8c0 3.8 9 7 20 7s20-3.2 20-7v-8" fill="#f2bd38"' + S + ' stroke-width="3"/>' +
    '<ellipse cx="32" cy="31" rx="20" ry="7" fill="#ffd84d"' + S + ' stroke-width="3"/>' +
    '<path d="M36 28.4c-1.4-1.2-6-1.4-6.6.4-.6 2 6.6 1.4 6.4 3.6-.2 2-5 2-7 .6" fill="none" stroke="#a8741a" stroke-width="2.2"/>' +
    star(50, 16, 5, '#fff6c9'),
  /* the amphora of the Roman tanks of Gianola */
  anfora:
    '<path d="M27 6h10v8c9 4 14 12 14 22 0 9-6 16-13 20l-6 4-6-4c-7-4-13-11-13-20 0-10 5-18 14-22Z" fill="#d9774a"' + S + ' stroke-width="3.4"/>' +
    '<path d="M27 14c-6-2-10 2-9 8M37 14c6-2 10 2 9 8" fill="none"' + S + ' stroke-width="3.2"/>' +
    '<path d="M18 30h28M17 38h30" stroke="#a9532e" stroke-width="2.6"/><path d="M20 26c1-4 4-7 7-8.6" fill="none" stroke="#f5c3a6" stroke-width="2.6"/>',
  /* a bottle with a message */
  bottiglia:
    '<path d="M26 6h8v10c5 2 8 6 8 11v25c0 3-2 5-5 5H23c-3 0-5-2-5-5V27c0-5 3-9 8-11Z" fill="#bfe8d6" fill-opacity=".85"' + S + ' stroke-width="3.2"/>' +
    '<rect x="24" y="3" width="12" height="6" rx="2" fill="#b57a45"' + S + ' stroke-width="2.6"/>' +
    '<rect x="23" y="28" width="14" height="20" rx="3" fill="#fdf2d0"' + S + ' stroke-width="2.2"/><path d="M26 33h8M26 37h8M26 41h6" stroke="#a88a56" stroke-width="1.6"/>' +
    '<path d="M22 26c0-3 1.6-5 4-6" fill="none" stroke="#ffffff" stroke-width="2.4"/>'
};
/** whether there is a drawing for this thing (a net, one of the bag, the sesterzi, a find) */
export function hasWare(id: string): boolean { return id in ART || (NET_IDS as string[]).indexOf(id) >= 0; }
/** the drawing of a thing, size px across */
export function wareSVG(id: string, size: number): string {
  if ((NET_IDS as string[]).indexOf(id) >= 0) return netSVG(id, size);
  const art = ART[id];
  if (!art) return '';
  return '<svg class="ware-svg" viewBox="0 0 64 64" width="' + size + '" height="' + size + '" aria-hidden="true">' + art + '</svg>';
}
