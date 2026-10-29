import { INK, RED, BLUE, HAND } from './palette';

/* ================= Esame di Controlli ================= */
export function esameParts(): string {
  var s = '';
  s += '<linearGradient id="eShadeG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#e9e5d6"/></linearGradient>';
  s += '<clipPath id="eSheetClip"><path d="M44 22L142 16L162 36L166 176L50 182Z"/></clipPath>';
  var g = '<g id="eBody">';
  g += '<path d="M48 120C34 124 26 112 22 100" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>';
  g += '<circle cx="21" cy="98" r="4.6" fill="#fffdf6" stroke="' + INK + '" stroke-width="2.4"/>';
  g += '<path d="M164 110C178 106 184 92 186 80" fill="none" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>';
  g += '<g transform="rotate(28 186 74)"><rect x="181.5" y="40" width="9" height="40" rx="2" fill="' + RED + '" stroke="' + INK + '" stroke-width="2"/><path d="M181.5 80L186 90L190.5 80Z" fill="#f4e3c8" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/><path d="M184.6 87L186 90L187.4 87Z" fill="' + RED + '"/><rect x="181.5" y="40" width="9" height="7" fill="' + INK + '"/></g>';
  g += '<circle cx="186" cy="80" r="5" fill="#fffdf6" stroke="' + INK + '" stroke-width="2.4"/>';
  g += '<path d="M44 22L142 16L162 36L166 176L50 182Z" fill="url(#eShadeG)"/>';
  g += '<g clip-path="url(#eSheetClip)" stroke="#8fb1d8" stroke-width=".7" opacity=".7">';
  for (var x = 46; x < 170; x += 7) g += '<path d="M' + x + ' 10L' + (x + 4) + ' 190"/>';
  for (var y = 22; y < 190; y += 7) g += '<path d="M40 ' + y + 'L170 ' + (y - 2) + '"/>';
  g += '</g>';
  g += '<path d="M62 21L67 181" stroke="#e0574a" stroke-width="1.2" opacity=".8"/>';
  g += '<path d="M142 16L144 36L162 36" fill="#ddd7c4" stroke="' + INK + '" stroke-width="2.2" stroke-linejoin="round"/>';
  g += '<path d="M44 22L142 16L162 36L166 176L50 182Z" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>';
  g += '<text x="72" y="37" font-family="' + HAND + '" font-size="11.5" fill="' + BLUE + '" transform="rotate(-3.4 72 37)">CONTROLLI</text>';
  g += '<text x="73" y="49" font-family="' + HAND + '" font-size="8.4" fill="' + BLUE + '" transform="rotate(-3.4 73 49)">Appello · 2 ore</text>';
  g += '<g transform="rotate(-3 110 140)"><path d="M76 128L76 168L154 168" fill="none" stroke="' + INK + '" stroke-width="1.6"/>';
  g += '<path d="M78 136L104 136C112 136 114 124 118 124C122 124 124 142 132 150L152 164" fill="none" stroke="' + BLUE + '" stroke-width="2"/>';
  g += '<path d="M78 146L108 146C116 146 120 158 130 160L152 162" fill="none" stroke="' + RED + '" stroke-width="1.6" stroke-dasharray="3 2.4"/>';
  g += '<text x="80" y="126" font-family="' + HAND + '" font-size="7.6" fill="' + INK + '">|G(jω)|</text></g>';
  g += '<ellipse cx="146" cy="128" rx="10" ry="12" fill="none" stroke="' + RED + '" stroke-width="2" transform="rotate(-12 146 128)"/>';
  g += '<text x="141" y="133" font-family="' + HAND + '" font-size="15" fill="' + RED + '">?</text>';
  g += '<text x="56" y="172" font-family="' + HAND + '" font-size="12" fill="' + RED + '" transform="rotate(-8 56 172)">−3</text>';
  g += '</g>';
  s += g;
  var eyes = function (look: number) {
    return '<ellipse cx="88" cy="82" rx="12" ry="13" fill="#fff" stroke="' + INK + '" stroke-width="2.4"/><ellipse cx="124" cy="80" rx="12" ry="13" fill="#fff" stroke="' + INK + '" stroke-width="2.4"/>' +
      '<circle cx="' + (84 + look) + '" cy="86" r="5.2" fill="' + INK + '"/><circle cx="' + (120 + look) + '" cy="84" r="5.2" fill="' + INK + '"/>' +
      '<circle cx="' + (82.6 + look) + '" cy="84.4" r="1.5" fill="#fff"/><circle cx="' + (118.6 + look) + '" cy="82.4" r="1.5" fill="#fff"/>';
  };
  s += '<g id="eFace-idle">' + eyes(0) + '<path d="M72 66L100 74M140 62L112 72" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>' +
    '<path d="M80 106L88 100L96 107L104 100L112 106L120 99L128 105L134 101" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/></g>';
  s += '<g id="eFace-angry">' + eyes(-2) + '<path d="M70 62L102 76M142 58L110 74" stroke="' + INK + '" stroke-width="6" stroke-linecap="round"/>' +
    '<path d="M76 102C90 96 120 94 136 100C128 114 88 116 76 102Z" fill="#7a1d25" stroke="' + INK + '" stroke-width="2.6" stroke-linejoin="round"/>' +
    '<path d="M80 102L86 108L92 100L98 108L104 99L110 107L116 98L122 106L128 99L133 103" fill="#fff" stroke="' + INK + '" stroke-width="1.6" stroke-linejoin="round"/></g>';
  s += '<g id="eFace-hurt"><path d="M78 78L96 86M78 90L96 82M114 76L132 84M114 88L132 80" stroke="' + INK + '" stroke-width="3.4" stroke-linecap="round"/>' +
    '<path d="M74 68L98 72M140 64L116 70" stroke="' + INK + '" stroke-width="4.4" stroke-linecap="round"/><path d="M86 108C94 102 112 100 124 106" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/></g>';
  s += '<g id="eFace-ko"><path d="M80 78L94 90M94 78L80 90M116 76L130 88M130 76L116 88" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/>' +
    '<path d="M84 106C92 110 100 102 108 106C116 110 122 102 128 106" fill="none" stroke="' + INK + '" stroke-width="3" stroke-linecap="round"/></g>';
  return s;
}
export function robotParts(): string {
  return '<g id="rBot"><path d="M30 6L30 14" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round"/><circle cx="30" cy="5" r="3.4" fill="#e0574a" stroke="' + INK + '" stroke-width="2"/>' +
    '<rect x="14" y="14" width="32" height="24" rx="9" fill="#eef1f4" stroke="' + INK + '" stroke-width="2.6"/><rect x="19" y="20" width="22" height="11" rx="5.5" fill="' + INK + '"/><circle cx="25.5" cy="25.5" r="2.4" fill="#7fe3ff"/><circle cx="34.5" cy="25.5" r="2.4" fill="#7fe3ff"/>' +
    '<rect x="16" y="41" width="28" height="22" rx="6" fill="#eef1f4" stroke="' + INK + '" stroke-width="2.6"/><rect x="24" y="47" width="12" height="7" rx="2" fill="#7c5cff" stroke="' + INK + '" stroke-width="1.6"/>' +
    '<path d="M16 46L7 56M44 46L53 56" stroke="' + INK + '" stroke-width="4.6" stroke-linecap="round"/><path d="M16 46L7 56M44 46L53 56" stroke="#eef1f4" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M23 63L21 76M37 63L39 76" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/><path d="M23 63L21 76M37 63L39 76" stroke="#eef1f4" stroke-width="2.2" stroke-linecap="round"/>' +
    '<path d="M15 77L26 77M34 77L45 77" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round"/></g>';
}
