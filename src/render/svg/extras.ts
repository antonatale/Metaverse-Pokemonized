import type { Look } from './types';

/* ================= glasses & props ================= */
export function glasses(c: Look): string {
  var G0 = c.glasses, P = c.P;
  if (!G0) return '';
  var g = '';
  if (G0.style === 'round') {
    g += '<path d="M92.6 139.6L79 136.4M167.4 139.6L181 136.4" stroke="#141416" stroke-width="3" stroke-linecap="round"/>';
    g += '<circle cx="106" cy="142" r="13.6" fill="#ffffff" fill-opacity=".07" stroke="#141416" stroke-width="3.6"/>';
    g += '<circle cx="154" cy="142" r="13.6" fill="#ffffff" fill-opacity=".07" stroke="#141416" stroke-width="3.6"/>';
    g += '<path d="M119.6 139.8C124 136.6 136 136.6 140.4 139.8" fill="none" stroke="#141416" stroke-width="3" stroke-linecap="round"/>';
    g += '<path d="M97 134.6A11 11 0 0 1 104 131.6M145 134.6A11 11 0 0 1 152 131.6" fill="none" stroke="#fff" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>';
  } else if (G0.style === 'shadesGreen') {
    var lens = function (x0: number) { return '<rect x="' + x0 + '" y="129" width="36" height="22" rx="8" fill="url(#gLensDark)" stroke="#57c968" stroke-width="5.4"/>'; };
    g += '<path d="M84 136L76 134M176 136L184 134" stroke="#57c968" stroke-width="5" stroke-linecap="round"/>';
    g += lens(86) + lens(138);
    g += '<rect x="121" y="135" width="18" height="6" rx="3" fill="#57c968"/>';
    g += '<rect x="86" y="129" width="36" height="22" rx="8" fill="none" stroke="#2f8f3e" stroke-width="1" transform="translate(-2.7 -2.7) scale(1.0)" opacity=".0"/>';
    g += '<path d="M84.6 126.6L123.4 126.6M136.6 126.6L175.4 126.6" stroke="#9af0a4" stroke-width="1.2" opacity=".55" stroke-linecap="round"/>';
    g += '<path d="M93 146L104 133M99 148L110 135M145 146L156 133M151 148L162 135" stroke="#fff" stroke-width="2" opacity=".18" stroke-linecap="round"/>';
  } else if (G0.style === 'politico') {
    var pl = function (x0: number) { return '<rect x="' + x0 + '" y="134.5" width="31" height="15" rx="3" fill="#ffffff" fill-opacity=".08" stroke="#9aa1aa" stroke-width="1"/><path d="M' + x0 + ' 137C' + x0 + ' 134.5 ' + (x0 + 1.5) + ' 134.5 ' + (x0 + 3) + ' 134.5L' + (x0 + 28) + ' 134.5C' + (x0 + 30) + ' 134.5 ' + (x0 + 31) + ' 135 ' + (x0 + 31) + ' 137.5" fill="none" stroke="#202227" stroke-width="3" stroke-linecap="round"/>'; };
    g += '<path d="M90.4 137L80 135M169.6 137L180 135" stroke="#3a3d44" stroke-width="1.8" stroke-linecap="round"/>';
    g += pl(90.4) + pl(138.6);
    g += '<path d="M121.4 138C125 135.6 135 135.6 138.6 138" fill="none" stroke="#3a3d44" stroke-width="1.8"/>';
    g += '<path d="M95 147L103 137.4M143 147L151 137.4" stroke="#fff" stroke-width="1.4" opacity=".3" stroke-linecap="round"/>';
  }
  var s = '<g id="' + P + 'Gl">' + g + '</g>';
  if (G0.koTilt) s += '<g id="' + P + 'GlKo"><g transform="translate(0 6) rotate(-9 130 142)">' + g + '</g></g>';
  return s;
}
export function props(c: Look): string {
  var P = c.P, s = '';
  if (c.props && c.props.phones) {
    var cup = function (x: number) { return '<rect x="' + (x - 13) + '" y="128" width="26" height="44" rx="12" fill="#1e1e23" stroke="#0b0b0e" stroke-width="2"/><rect x="' + (x - 8) + '" y="134" width="16" height="32" rx="8" fill="#2d2d34"/><circle cx="' + x + '" cy="150" r="2.4" fill="#c9ccd2"/>'; };
    s += '<g id="' + P + 'PhOn"><path d="M68 140C60 80 92 38 130 38C168 38 200 80 192 140" fill="none" stroke="#0b0b0e" stroke-width="11" stroke-linecap="round"/>' +
      '<path d="M68 140C60 80 92 38 130 38C168 38 200 80 192 140" fill="none" stroke="#2a2a31" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M86 70C98 52 112 46 128 45" fill="none" stroke="#5a5a64" stroke-width="2" stroke-linecap="round"/>' + cup(68) + cup(192) + '</g>';
    var ncup = function (x: number, rot: number) {
      return '<g transform="rotate(' + rot + ' ' + x + ' 246)"><rect x="' + (x - 11) + '" y="229" width="22" height="32" rx="10" fill="#1e1e23" stroke="#0b0b0e" stroke-width="2"/>' +
        '<rect x="' + (x - 6.5) + '" y="234" width="13" height="22" rx="6.5" fill="#34343c"/><circle cx="' + x + '" cy="245" r="2" fill="#9ea3ab"/></g>';
    };
    s += '<g id="' + P + 'PhNeck"><path d="M95 236C96 226 98 218 101 212M165 236C164 226 162 218 159 212" fill="none" stroke="#0b0b0e" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="M95 236C96 226 98 218 101 212M165 236C164 226 162 218 159 212" fill="none" stroke="#2a2a31" stroke-width="3.4" stroke-linecap="round"/>' + ncup(92, -34) + ncup(168, 34) + '</g>';
  }
  return s;
}
export function hood(c: Look): string {
  if (c.ko !== 'hood') return '';
  var P = c.P, O = c.outfit, s = '';
  var open = 'M72 124C70 82 98 54 130 54C162 54 190 82 188 124C188 168 180 206 166 240L94 240C80 206 72 168 72 124Z';
  var rim = 'M94 240C80 206 72 168 72 124C70 82 98 54 130 54C162 54 190 82 188 124C188 168 180 206 166 240';
  s += '<clipPath id="' + P + 'HoodOpen"><path d="' + open + '"/></clipPath>';
  s += '<g id="' + P + 'HoodBack"><path d="M38 304C28 250 32 150 48 98C64 50 98 26 130 26C162 26 196 50 212 98C228 150 232 250 222 304Z" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.6"/><path d="' + open + '" fill="' + O.deep + '"/></g>';
  s += '<g id="' + P + 'HairHood" clip-path="url(#' + P + 'HoodOpen)"><use href="#' + P + 'Top"/></g>';
  s += '<g id="' + P + 'HoodFront"><path d="' + rim + '" fill="none" stroke="url(#' + P + 'ClothG)" stroke-width="15" stroke-linecap="round"/>' +
    '<path d="' + rim + '" fill="none" stroke="' + O.line + '" stroke-width="1.3" opacity=".55" transform="translate(130 148) scale(.92 .94) translate(-130 -148)"/>' +
    '<path d="M48 300C44 240 50 160 64 112M212 300C216 240 210 160 196 112" fill="none" stroke="' + O.dark + '" stroke-width="1.6" opacity=".55"/></g>';
  return s;
}
