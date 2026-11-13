import type { Look } from './types';
import { r1, mirrorG } from './util';

/* ================= outfits ================= */
function torsoD(broad: boolean | undefined, dip: number): string {
  var y0 = broad ? 235 : 239, xl = broad ? 100 : 102, xr = broad ? 160 : 158;
  var cut = dip ? 'C' + (xl + 6) + ' ' + r1(y0 + dip * 0.8) + ' ' + (xl + 18) + ' ' + (y0 + dip) + ' 130 ' + (y0 + dip) + 'C' + (xr - 18) + ' ' + (y0 + dip) + ' ' + (xr - 6) + ' ' + r1(y0 + dip * 0.8) + ' ' + xr + ' ' + y0 : 'L' + xr + ' ' + y0;
  if (broad) return 'M-8 304L-8 277C6 259 36 249 70 244C86 242 96 239 ' + xl + ' ' + y0 + cut + 'C164 239 174 242 190 244C224 249 254 259 268 277L268 304Z';
  return 'M-4 304L-4 283C8 266 38 255 72 250C86 248 96 244 ' + xl + ' ' + y0 + cut + 'C164 244 174 248 188 250C222 255 252 266 264 283L264 304Z';
}
const DIP: Record<string, number> = { hoodie: 0, turtleneck: 0, tee: 14, knit: 11, stripes: 9, jacket: 0, strapless: 0 };

export function outfit(c: Look): string {
  var O = c.outfit, P = c.P, S = c.skin, s = '', st = O.style;
  var torso = torsoD(O.broad, DIP[st]);
  var nx1 = O.broad ? 97 : 100, nx2 = O.broad ? 163 : 160;
  s += '<linearGradient id="' + P + 'ClothG" x1="0" y1="0" x2=".7" y2="1"><stop offset="0" stop-color="' + O.light + '"/><stop offset=".55" stop-color="' + O.base + '"/><stop offset="1" stop-color="' + O.dark + '"/></linearGradient>';
  s += '<clipPath id="' + P + 'TorsoClip"><path d="' + torso + '"/></clipPath>';
  var body = '<path d="' + torso + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.6"/>';
  if (st === 'stripes') {
    var y = 236, k = 0, band = '';
    var hs = [7, 6, 9, 5, 8, 6, 7, 5, 9, 6, 7, 8];
    while (y < 304) { var hgt = hs[k % hs.length]; band += '<rect x="-10" y="' + y + '" width="280" height="' + hgt + '" fill="' + O.stripes![k % O.stripes!.length] + '"/>'; y += hgt; k++; }
    body = '<g clip-path="url(#' + P + 'TorsoClip)">' + band + '<rect x="-10" y="230" width="280" height="80" fill="#000" filter="url(#fKnit)" opacity=".16"/>' +
      '<path d="M-10 236L270 236" stroke="none"/></g><path d="' + torso + '" fill="none" stroke="' + O.line + '" stroke-width="1.6"/>';
  }
  if (st === 'knit') body += '<g clip-path="url(#' + P + 'TorsoClip)"><rect x="-10" y="230" width="280" height="80" fill="#000" filter="url(#fKnit)" opacity=".22"/></g>';
  body += '<path d="M22 278C38 268 56 262 76 260M238 278C222 268 204 262 184 260M40 302C46 290 52 284 60 280M220 302C214 290 208 284 200 280" fill="none" stroke="' + (O.fold || O.dark) + '" stroke-width="1.6" stroke-linecap="round" opacity=".5"/>';
  if (st === 'jacket') body += '<path d="M104 238C112 254 148 254 156 238L170 304L90 304Z" fill="' + O.tee + '"/>';
  /* a strapless top: bare shoulders and collarbones, the top straight across the chest */
  if (st === 'strapless') {
    s += '<linearGradient id="' + P + 'ShoulderG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.base + '"/><stop offset="1" stop-color="' + S.shade + '"/></linearGradient>';
    body = '<path d="' + torso + '" fill="url(#' + P + 'ShoulderG)" stroke="' + S.line + '" stroke-width="1.4"/>' +
      '<path d="M84 258C96 262 110 262 122 258M176 258C164 262 150 262 138 258" fill="none" stroke="' + S.deep + '" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>' +
      '<path d="M40 268C52 262 66 258 80 256M220 268C208 262 194 258 180 256" fill="none" stroke="' + S.light + '" stroke-width="3" opacity=".5" filter="url(#fB2)"/>' +
      '<g clip-path="url(#' + P + 'TorsoClip)"><path d="M-10 282C40 278 90 276 130 276C170 276 220 278 270 282L270 310L-10 310Z" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.6"/>' +
      '<path d="M20 284C60 280 96 279 130 279C164 279 200 280 240 284" fill="none" stroke="' + O.light + '" stroke-width="1.6" opacity=".5"/></g>';
  }
  if (O.over) body += '<g clip-path="url(#' + P + 'TorsoClip)">' + O.over + '</g>';
  s += '<g id="' + P + 'Body">' + body + '</g>';

  /* neck */
  s += '<linearGradient id="' + P + 'NeckG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + S.deep + '"/><stop offset=".5" stop-color="' + S.shade + '"/><stop offset="1" stop-color="' + S.base + '"/></linearGradient>';
  var neck = '<path d="M' + nx1 + ' 196C' + (nx1 + 1) + ' 220 ' + nx1 + ' 240 ' + (nx1 - 2) + ' 268L' + (nx2 + 2) + ' 268C' + nx2 + ' 240 ' + (nx2 - 1) + ' 220 ' + nx2 + ' 196Z" fill="url(#' + P + 'NeckG)"/>';
  neck += '<path d="M98 198C108 213 120 219 130 219C140 219 152 213 162 198L162 214C150 225 140 229 130 229C120 229 110 225 98 214Z" fill="' + S.deep + '" opacity=".45" filter="url(#fB3)"/>';
  neck += '<path d="M112 230C115.6 238 117.6 246 118.6 256M148 230C144.4 238 142.4 246 141.4 256" fill="none" stroke="' + S.deep + '" stroke-width="1.1" opacity=".18"/>';
  if (c.chain) {
    neck += '<path d="M105 236.6C111 252 149 252 155 236.6" fill="none" stroke="#8a9099" stroke-width="1.5" opacity=".8"/>';
    neck += '<path d="M105 236C111 251.4 149 251.4 155 236" fill="none" stroke="#e3e6ea" stroke-width="1" stroke-dasharray="1.6 .9"/>';
  }
  s += '<g id="' + P + 'Neck">' + neck + '</g>';

  /* front pieces over the neck */
  var f = '';
  if (st === 'hoodie') {
    s += '<g id="' + P + 'Collar"><path d="M64 260C60 230 92 210 130 210C168 210 200 230 196 260C188 246 162 236 130 236C98 236 72 246 64 260Z" fill="' + O.dark + '" stroke="' + O.line + '" stroke-width="1.4"/>' +
      '<path d="M72 246C80 226 104 216 130 216C156 216 180 226 188 246" fill="none" stroke="' + O.light + '" stroke-width="2.2" opacity=".55" filter="url(#fB2)"/>' +
      '<path d="M84 246C94 232 112 226 130 226C148 226 166 232 176 246" fill="none" stroke="' + O.deep + '" stroke-width="5" opacity=".7" filter="url(#fB2)"/></g>';
    var bandL = 'M99 224C100 243 112 256 134 262L132 277C106 271 86 260 78 245C82 234 90 228 99 224Z';
    var bandR = 'M161 224C160 243 148 256 126 262L128 277C154 271 174 260 182 245C178 234 170 228 161 224Z';
    f += '<path d="' + bandL + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.4"/>';
    f += '<path d="M89 236C94 252 108 264 131 270" fill="none" stroke="' + O.light + '" stroke-width=".9" stroke-dasharray="2.4 2" opacity=".7"/>';
    f += '<path d="' + bandR + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.4"/>';
    f += '<path d="M171 236C166 252 152 264 129 270" fill="none" stroke="' + O.light + '" stroke-width=".9" stroke-dasharray="2.4 2" opacity=".7"/>';
    [['M114 260C111.6 274 114.6 290 111.8 306', 114], ['M146 260C148.4 274 145.4 290 148.2 306', 146]].forEach(function (q) {
      f += '<path d="' + q[0] + '" fill="none" stroke="' + O.deep + '" stroke-width="4" stroke-linecap="round"/>';
      f += '<path d="' + q[0] + '" fill="none" stroke="' + O.light + '" stroke-width="1" stroke-dasharray="1.6 2.2" opacity=".7"/>';
      f += '<circle cx="' + q[1] + '" cy="259.4" r="4.2" fill="url(#gBrass)" stroke="#8b6b3c" stroke-width=".8"/><circle cx="' + q[1] + '" cy="259.4" r="1.9" fill="' + O.deep + '"/>';
    });
  } else if (st === 'turtleneck') {
    var tube = 'M99 204C99 220 97 236 93 248C106 257 154 257 167 248C163 236 161 220 161 204C150 212 110 212 99 204Z';
    f += '<clipPath id="' + P + 'TubeClip"><path d="' + tube + '"/></clipPath>';
    f += '<path d="' + tube + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.4"/>';
    var ribs = '';
    for (var xr = 92; xr < 170; xr += 3.2) ribs += '<path d="M' + r1(xr) + ' 200L' + r1(xr - 2) + ' 258"/>';
    f += '<g clip-path="url(#' + P + 'TubeClip)" stroke="#fff" stroke-width=".7" opacity=".07">' + ribs + '</g>';
    f += '<path d="M99 214C112 221 148 221 161 214M97 228C111 235 149 235 163 228M95 241C110 248 150 248 165 241" fill="none" stroke="' + O.light + '" stroke-width="1.6" opacity=".45"/>';
    f += '<path d="M99 205C110 213 150 213 161 205" fill="none" stroke="' + O.line + '" stroke-width="2"/>';
  } else if (st === 'tee') {
    f += '<path d="M100 235C106 246 118 249 130 249C142 249 154 246 160 235" fill="none" stroke="' + O.light + '" stroke-width="4.4"/>';
    f += '<path d="M100 237.6C106 248.6 118 251.6 130 251.6C142 251.6 154 248.6 160 237.6" fill="none" stroke="' + O.line + '" stroke-width="1.1"/>';
    f += '<path d="M112 238C118 242 124 243 128 242M148 238C142 242 136 243 132 242" fill="none" stroke="' + S.deep + '" stroke-width="1.1" opacity=".35"/>';
  } else if (st === 'jacket') {
    var pl = 'M102 236C96 256 92 280 90 304L112 304C112 280 114 258 120 244C114 242 108 240 102 236Z';
    f += '<path d="' + pl + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.3"/>' + mirrorG('<path d="' + pl + '" fill="url(#' + P + 'ClothG)" stroke="' + O.line + '" stroke-width="1.3"/>');
    f += '<path d="M118 246C114 264 112 284 112 304" fill="none" stroke="#8a8478" stroke-width="1.6" stroke-dasharray="1.4 1.4"/>';
    var cl = 'M93 240C88 226 92 212 102 204L117 238C109 243 100 244 93 240Z';
    f += '<path d="' + cl + '" fill="' + O.light + '" stroke="' + O.line + '" stroke-width="1.3"/>' + mirrorG('<path d="' + cl + '" fill="' + O.light + '" stroke="' + O.line + '" stroke-width="1.3"/>');
    f += '<path d="M106 238C112 249 148 249 154 238" fill="none" stroke="#2c2c33" stroke-width="3.2"/>';
  } else if (st === 'stripes') {
    var mock = 'M101 224C101 233 100 240 97 248C110 255 150 255 163 248C160 240 159 233 159 224C147 230 113 230 101 224Z';
    f += '<path d="' + mock + '" fill="' + O.collar + '" stroke="' + O.line + '" stroke-width="1.3"/>';
    f += '<path d="M100 232C112 238 148 238 160 232M99 241C111 247 149 247 161 241" fill="none" stroke="#fff" stroke-width="1" opacity=".12"/>';
  } else if (st === 'knit') {
    f += '<path d="M106 236C112 245 148 245 154 236" fill="none" stroke="' + O.tee + '" stroke-width="3.4"/>';
    f += '<path d="M102 240C108 249 120 252 130 252C140 252 152 249 158 240" fill="none" stroke="' + O.dark + '" stroke-width="7"/>';
    f += '<path d="M102 240C108 249 120 252 130 252C140 252 152 249 158 240" fill="none" stroke="' + O.light + '" stroke-width="7" stroke-dasharray=".9 1.8" opacity=".5"/>';
    /* crossbody bag strap (photo at the castle) */
    f += '<path d="M180 247L194 255L78 312L62 304Z" fill="' + O.strap + '"/><path d="M186 251L70 308" stroke="#3b3b42" stroke-width=".9" stroke-dasharray="2 2"/>';
  }
  /* a chunky pendant on dark cords, over whatever is worn: a silver plate with a black stone */
  if (c.pendant) {
    f += '<path d="M104 228C110 246 120 256 130 262M156 228C150 246 140 256 130 262M106 230C112 247 121 257 130 263M154 230C148 247 139 257 130 263" fill="none" stroke="#1a1a1f" stroke-width="1.3" opacity=".9"/>';
    f += '<path d="M120 262L140 262L142 280L130 284L118 280Z" fill="url(#gSilver)" stroke="#4d535c" stroke-width="1.2" stroke-linejoin="round"/>';
    f += '<path d="M124 266L136 266L137 277L130 279.6L123 277Z" fill="#17161b" stroke="#6f7680" stroke-width=".8"/><path d="M126 268.4L131 268" stroke="#ffffff" stroke-width="1" opacity=".7" stroke-linecap="round"/>';
  }
  s += '<g id="' + P + 'Front">' + f + '</g>';
  return s;
}
