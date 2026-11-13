import type { BrowPose, ExprName, EyePose, Expression, FaceShape, Look, MouthName } from './types';
import { thru, r1, pt, merge } from './util';

/* ================= faces ================= */
const FACES: Record<FaceShape, [string, string]> = {
  square: ['M79 104C74 126 73 152 78 172C81 186 86 197 96 207C106 216 118 222 130 222.5C142 222 154 216 164 207C174 197 179 186 182 172C187 152 186 126 181 104', 'C177 80 156 66 130 66C104 66 83 80 79 104'],
  oval: ['M80 104C76 128 76 156 82 178C88 196 100 212 116 219C121 221.5 126 222.5 130 222.5C134 222.5 139 221.5 144 219C160 212 172 196 178 178C184 156 184 128 180 104', 'C176 80 156 66 130 66C104 66 84 80 80 104'],
  round: ['M77 106C71 132 73 162 83 186C93 206 110 220 130 221C150 220 167 206 177 186C187 162 189 132 183 106', 'C178 80 156 66 130 66C104 66 82 80 77 106'],
  strong: ['M80 102C75 126 75 156 80 178C84 194 92 206 104 214C114 220 122 223 130 223C138 223 146 220 156 214C168 206 176 194 180 178C185 156 185 126 180 102', 'C176 78 156 64 130 64C104 64 84 78 80 102']
};
export function faceD(c: Look): string { var f = FACES[c.face]; return f[0] + f[1] + 'Z'; }

/* ================= expressions ================= */
function brow(c: Look, side: number, o: BrowPose): string {
  var B = c.brow, w = B.w || 1, lift = B.lift || 0;
  var ix = 130 + side * 9, ox = 130 + side * 46, mx = 130 + side * 26;
  var iy = 128.8 - lift - (o.inner || 0), my = 125.4 - lift - (o.mid || 0), oy = 128.6 - lift - (o.outer || 0);
  var pts = [[ox, oy - 1.2 * w], [mx, my - 3.8 * w], [ix + side * 1.4, iy - 4 * w], [ix - side * 0.5, iy - 0.2], [ix + side * 0.6, iy + 3.6 * w], [mx, my + 3.4 * w], [ox - side * 2.2, oy + 1.1 * w]];
  var s = '<path d="' + thru(pts, true) + '" fill="' + B.color + '" filter="url(#fSoft)"/>';
  var h = '';
  for (var k = 0; k < 9; k++) {
    var t = k / 8, x = ix + (ox - ix) * t, y = iy + (oy - iy) * t - Math.sin(t * Math.PI) * (iy - my + 1.5);
    h += '<path d="M' + r1(x - side * 1.4) + ' ' + r1(y + 2.2 * w) + 'l' + r1(side * 4.2) + ' ' + r1(-2.4 * w + t * 0.8) + '"/>';
  }
  return s + '<g stroke="' + B.hi + '" stroke-width=".75" stroke-linecap="round" opacity=".75">' + h + '</g>';
}

function eye(c: Look, side: number, o: EyePose, id: string): string {
  var S = c.skin, cx = 130 + side * 24, cy = 142.5, w = 12.4, s = '';
  var inner = [cx - side * w, cy + 0.9], outer = [cx + side * w, cy - 0.5];
  /* deep-set socket and under-eye */
  s += '<path d="M' + r1(cx - side * 15) + ' ' + (cy - 3) + 'C' + r1(cx - side * 8) + ' ' + (cy - 15) + ' ' + r1(cx + side * 9) + ' ' + (cy - 15) + ' ' + r1(cx + side * 16) + ' ' + (cy - 4) + 'C' + r1(cx + side * 8) + ' ' + (cy - 8) + ' ' + r1(cx - side * 8) + ' ' + (cy - 8) + ' ' + r1(cx - side * 15) + ' ' + (cy - 3) + 'Z" fill="' + S.shade + '" opacity=".7" filter="url(#fB2)"/>';
  s += '<path d="M' + r1(cx - side * 13) + ' ' + (cy + 4) + 'C' + r1(cx - side * 5) + ' ' + (cy + 12.5) + ' ' + r1(cx + side * 7) + ' ' + (cy + 11.5) + ' ' + r1(cx + side * 13.5) + ' ' + (cy + 3) + 'C' + r1(cx + side * 6) + ' ' + (cy + 7.4) + ' ' + r1(cx - side * 5) + ' ' + (cy + 8.4) + ' ' + r1(cx - side * 13) + ' ' + (cy + 4) + 'Z" fill="' + S.deep + '" opacity="' + (c.underEye || 0.45) + '" filter="url(#fB2)"/>';
  if (o.closed) {
    var dy = o.closed === 'happy' ? -4.4 : 3;
    s += '<path d="M' + pt(inner) + 'C' + pt([cx - side * w * 0.45, cy + dy]) + ' ' + pt([cx + side * w * 0.45, cy + dy]) + ' ' + pt(outer) + '" fill="none" stroke="' + c.brow.color + '" stroke-width="2.3" stroke-linecap="round"/>';
    if (o.closed !== 'happy') s += '<path d="M' + r1(cx + side * 4) + ' ' + r1(cy + 3) + 'l' + side * 1 + ' 2.4M' + r1(cx + side * 8) + ' ' + r1(cy + 2) + 'l' + side * 1.6 + ' 2.2" stroke="' + c.brow.color + '" stroke-width="1.1" stroke-linecap="round"/>';
    s += '<path d="M' + pt([cx - side * 10, cy - 5]) + 'C' + pt([cx - side * 4, cy - 8]) + ' ' + pt([cx + side * 5, cy - 8]) + ' ' + pt([cx + side * 11, cy - 4.6]) + '" fill="none" stroke="' + S.line + '" stroke-width=".9" opacity=".5"/>';
    return s;
  }
  var open = o.open == null ? 1 : o.open, lr = o.lowerRaise || 0;
  var hT = 5.2 * open, hB = 4.3 * (1 - lr * 0.65) * Math.max(0.6, open);
  var top = 'M' + pt(inner) + 'C' + pt([cx - side * w * 0.42, cy - hT * 1.32]) + ' ' + pt([cx + side * w * 0.52, cy - hT * 1.1]) + ' ' + pt(outer);
  var bottom = 'C' + pt([cx + side * w * 0.45, cy + hB * 1.05]) + ' ' + pt([cx - side * w * 0.45, cy + hB * 1.2]) + ' ' + pt(inner) + 'Z';
  var shape = top + bottom, lx = (o.look || [0, 0])[0], ly = (o.look || [0, 0])[1], I = c.iris;
  s += '<clipPath id="' + id + '"><path d="' + shape + '"/></clipPath>';
  s += '<path d="' + shape + '" fill="#ede5dc"/>';
  s += '<g clip-path="url(#' + id + ')">';
  var ix = cx + lx, iy = cy - 0.4 + ly;
  s += '<circle cx="' + r1(ix) + '" cy="' + r1(iy) + '" r="6.4" fill="url(#' + c.P + 'IrisG)"/>';
  s += '<circle cx="' + r1(ix) + '" cy="' + r1(iy) + '" r="6.4" fill="none" stroke="' + I.dark + '" stroke-width="1.1"/>';
  s += '<circle cx="' + r1(ix) + '" cy="' + r1(iy) + '" r="2.6" fill="#111"/>';
  s += '<circle cx="' + r1(ix - 1.9) + '" cy="' + r1(iy - 1.9) + '" r="1.3" fill="#fff"/>';
  s += '<path d="' + top + 'L' + pt([cx + side * w, cy - 14]) + 'L' + pt([cx - side * w, cy - 14]) + 'Z" fill="' + S.deep + '" opacity=".28" transform="translate(0 2.2)"/>';
  s += '</g>';
  if (o.lid) {
    var le = cy + (o.lidAt || -1.6);
    var lid = 'M' + pt([inner[0], inner[1] - 0.6]) + 'C' + pt([cx - side * w * 0.42, cy - 12]) + ' ' + pt([cx + side * w * 0.52, cy - 12]) + ' ' + pt([outer[0], outer[1] - 0.6]) + 'C' + pt([cx + side * w * 0.45, le + 1.4]) + ' ' + pt([cx - side * w * 0.45, le + 1.8]) + ' ' + pt([inner[0], inner[1] - 0.6]) + 'Z';
    s += '<path d="' + lid + '" fill="' + S.base + '"/><path d="' + lid + '" fill="' + S.shade + '" opacity=".35"/>';
    s += '<path d="M' + pt([inner[0], inner[1] - 0.3]) + 'C' + pt([cx - side * w * 0.45, le + 2.1]) + ' ' + pt([cx + side * w * 0.45, le + 1.7]) + ' ' + pt([outer[0] + side * 0.6, outer[1] - 0.2]) + '" fill="none" stroke="' + c.brow.color + '" stroke-width="2" stroke-linecap="round"/>';
    s += '<path d="M' + pt([cx - side * 10, cy - 5.6]) + 'C' + pt([cx - side * 4, cy - 8.4]) + ' ' + pt([cx + side * 5, cy - 8.4]) + ' ' + pt([cx + side * 11, cy - 5.4]) + '" fill="none" stroke="' + S.line + '" stroke-width=".9" opacity=".5"/>';
  } else {
    s += '<path d="' + top + '" fill="none" stroke="' + c.brow.color + '" stroke-width="' + (c.lashes ? 3 : 2.3) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    if (c.lashes) {
      /* the liner flicks out at the corner, a few lashes along the outer half of the lid */
      s += '<path d="M' + pt(outer) + 'l' + r1(side * 3.6) + ' -2.6" stroke="' + c.brow.color + '" stroke-width="2.2" stroke-linecap="round"/>';
      for (var q = 0; q < 4; q++) {
        var t = 0.45 + q * 0.16, lx0 = cx + side * w * (t * 2 - 1) * 0.95, ly0 = cy - hT * 1.18 * Math.sin(Math.PI * (0.5 + (t - 0.5) * 0.9)) - 0.6;
        s += '<path d="M' + r1(lx0) + ' ' + r1(ly0) + 'q' + r1(side * 1.2) + ' -2 ' + r1(side * 2.6) + ' -3.2" fill="none" stroke="' + c.brow.color + '" stroke-width="1.1" stroke-linecap="round"/>';
      }
    }
    s += '<path d="M' + pt([cx - side * 10.5, cy - hT - 1.8]) + 'C' + pt([cx - side * 4, cy - hT - 5]) + ' ' + pt([cx + side * 6, cy - hT - 4.6]) + ' ' + pt([cx + side * 12.6, cy - hT - 0.4]) + '" fill="none" stroke="' + S.line + '" stroke-width="1.05" opacity=".6"/>';
    s += '<path d="M' + pt(outer) + bottom.slice(0, -1) + '" fill="none" stroke="' + S.line + '" stroke-width=".85" opacity=".45"/>';
  }
  return s;
}

export function mouths(c: Look): Record<MouthName, string> {
  var L = c.lips, D = c.skin.deep, IN = L.inside;
  return {
    smirk:
      '<path d="M108.6 183.2C110.2 188.4 113.2 192 117.4 193.4" fill="none" stroke="' + D + '" stroke-width="1.5" opacity=".6" stroke-linecap="round"/>' +
      '<path d="M115 188.2C120 186 125 185.6 129.4 187C133.6 185.4 140.6 186.2 149.6 190.2C141 191.2 127 190.8 115 188.2Z" fill="' + L.dark + '"/>' +
      '<path d="M115.4 188.8C128 191.4 140.4 191.6 149.2 190.6C146.4 197.8 139.6 201.6 131 201.6C121.4 201.2 116.6 195.4 115.4 188.8Z" fill="' + L.base + '"/>' +
      '<path d="M123 196.2C128 198.2 135.4 198 141 195" fill="none" stroke="' + L.light + '" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>' +
      '<path d="M114.6 188.6C127.6 191.2 140 191.4 150 190.4" fill="none" stroke="' + IN + '" stroke-width="1.3" stroke-linecap="round"/>',
    grin:
      '<path d="M103.6 180C107 184 109.6 186.6 112 188.4M156.4 180C153 184 150.4 186.6 148 188.4" fill="none" stroke="' + D + '" stroke-width="1.5" opacity=".6" stroke-linecap="round"/>' +
      '<path d="M108 185C118 189 142 189 152 185C150 198 142 207 130 207C118 207 110 198 108 185Z" fill="' + IN + '"/>' +
      '<path d="M110.5 186.2C120 189.8 140 189.8 149.5 186.2L148.6 191.6C140 194 120 194 111.4 191.6Z" fill="#f6f1ea"/>' +
      '<path d="M118 193.4L118 189.2M124 194L124 189.7M130 194.2L130 189.9M136 194L136 189.7M142 193.4L142 189.2" stroke="#d8cfc5" stroke-width=".7"/>' +
      '<path d="M116 201C122 204.6 138 204.6 144 201C140 205.6 135 207 130 207C125 207 120 205.6 116 201Z" fill="#b8596a"/>' +
      '<path d="M106 184.5C114 182 122 181 130 182.5C138 181 146 182 154 184.5C146 187.5 114 187.5 106 184.5Z" fill="' + L.dark + '"/>' +
      '<path d="M108 185C110 198 118 208 130 208.5C142 208 150 198 152 185C150 202 141 211.5 130 211.5C119 211.5 110 202 108 185Z" fill="' + L.base + '"/>',
    pout:
      '<path d="M115 190C120 184 125 183.4 130 185.2C135 183.4 140 184 145 190C138 191.6 122 191.6 115 190Z" fill="' + L.dark + '"/>' +
      '<path d="M115.5 190.6C122 192.2 138 192.2 144.5 190.6C145 198.4 139 204.6 130 204.8C121 204.6 115 198.4 115.5 190.6Z" fill="' + L.base + '"/>' +
      '<ellipse cx="131" cy="197.5" rx="7" ry="2.6" fill="' + L.light + '" opacity=".8"/>' +
      '<ellipse cx="128" cy="187.6" rx="4" ry="1.2" fill="' + L.light + '" opacity=".5"/>' +
      '<path d="M115 190.4C122 192 138 192 145 190.4" fill="none" stroke="' + IN + '" stroke-width="1.3" stroke-linecap="round"/>',
    worried:
      '<ellipse cx="130" cy="195.5" rx="7.4" ry="6.8" fill="' + IN + '"/>' +
      '<path d="M122.6 195.5C122.6 189.6 126.4 187.6 130 187.6C133.6 187.6 137.4 189.6 137.4 195.5C137.4 192.4 133.6 190.6 130 190.6C126.4 190.6 122.6 192.4 122.6 195.5Z" fill="' + L.dark + '"/>' +
      '<path d="M122.6 195.5C122.6 201.6 126.4 204.6 130 204.6C133.6 204.6 137.4 201.6 137.4 195.5C137.4 200.2 133.6 202 130 202C126.4 202 122.6 200.2 122.6 195.5Z" fill="' + L.base + '"/>',
    sleepy:
      '<path d="M114 191C120 188 125 187.6 130 188.8C135 187.6 140 188 146 191C138 192.2 122 192.2 114 191Z" fill="' + L.dark + '"/>' +
      '<path d="M114.5 191.4C122 192.8 138 192.8 145.5 191.4C143 198 137.6 200.4 130 200.4C122.4 200.4 117 198 114.5 191.4Z" fill="' + L.base + '"/>' +
      '<path d="M122 196.6C127 198 133 198 138 196.6" fill="none" stroke="' + L.light + '" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>' +
      '<path d="M114 191.2C122 192.6 138 192.6 146 191.2" fill="none" stroke="' + IN + '" stroke-width="1.2" stroke-linecap="round"/>',
    cool:
      '<path d="M148 183.4C151 185.6 152.2 188 152.8 191" fill="none" stroke="' + D + '" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>' +
      '<path d="M113 189.5C120 186.6 125 186 129.5 187.4C134 185.8 141 185.6 149 186.4C140 190.6 127 191.4 113 189.5Z" fill="' + L.dark + '"/>' +
      '<path d="M113.6 190C127 191.6 140 190.6 148.6 186.8C146.6 195.6 139 200.6 130.5 200.8C121 200.6 116 196 113.6 190Z" fill="' + L.base + '"/>' +
      '<path d="M122 195.8C127 197.6 135 197.2 141 193.6" fill="none" stroke="' + L.light + '" stroke-width="1.7" stroke-linecap="round" opacity=".8"/>' +
      '<path d="M113 189.8C127 191.8 140 190.8 149 186.6" fill="none" stroke="' + IN + '" stroke-width="1.3" stroke-linecap="round"/>',
    neutral:
      '<path d="M115 190.6C121 188.6 126 188.2 130 189.4C134 188.2 139 188.6 145 190.6C138 191.8 122 191.8 115 190.6Z" fill="' + L.dark + '"/>' +
      '<path d="M115.4 191C122 192.4 138 192.4 144.6 191C142.4 197.2 137.4 199.8 130 199.8C122.6 199.8 117.6 197.2 115.4 191Z" fill="' + L.base + '"/>' +
      '<path d="M123 196C127.6 197.4 132.4 197.4 137 196" fill="none" stroke="' + L.light + '" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>' +
      '<path d="M115 190.9C122 192.2 138 192.2 145 190.9" fill="none" stroke="' + IN + '" stroke-width="1.25" stroke-linecap="round"/>',
    soft:
      '<path d="M112.6 186.6C114.6 188.6 116.4 189.6 118 190M147.4 186.6C145.4 188.6 143.6 189.6 142 190" fill="none" stroke="' + D + '" stroke-width="1.3" opacity=".5" stroke-linecap="round"/>' +
      '<path d="M114 188.8C120 187.2 125 186.8 130 188C135 186.8 140 187.2 146 188.8C138 191.4 122 191.4 114 188.8Z" fill="' + L.dark + '"/>' +
      '<path d="M114.6 189.4C122 191.8 138 191.8 145.4 189.4C143 196.8 137.4 199.6 130 199.6C122.6 199.6 117 196.8 114.6 189.4Z" fill="' + L.base + '"/>' +
      '<path d="M122.6 195.4C127.4 197 132.6 197 137.4 195.4" fill="none" stroke="' + L.light + '" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>' +
      '<path d="M114 189.2C122 191.6 138 191.6 146 189.2" fill="none" stroke="' + IN + '" stroke-width="1.25" stroke-linecap="round"/>',
    talk:
      '<path d="M113 188C120 185.6 125 185.2 130 186.6C135 185.2 140 185.6 147 188C140 189.6 120 189.6 113 188Z" fill="' + L.dark + '"/>' +
      '<path d="M116 189C122 190.4 138 190.4 144 189C143 194.6 137.6 198.4 130 198.4C122.4 198.4 117 194.6 116 189Z" fill="' + IN + '"/>' +
      '<path d="M118.6 189.6C124 190.8 136 190.8 141.4 189.6L140.8 191.6C135 192.8 125 192.8 119.2 191.6Z" fill="#f6f1ea"/>' +
      '<path d="M116.6 195.6C121 200.6 139 200.6 143.4 195.6C141.4 201.4 136.4 203.6 130 203.6C123.6 203.6 118.6 201.4 116.6 195.6Z" fill="' + L.base + '"/>',
    smug:
      '<path d="M147.6 182.6C150.6 184.6 152 187 152.8 190.4" fill="none" stroke="' + D + '" stroke-width="1.4" opacity=".55" stroke-linecap="round"/>' +
      '<path d="M115 190.6C121 188.6 126 188.2 130 189.2C134 187.6 140 186.6 148 186.8C140 191 124 191.8 115 190.6Z" fill="' + L.dark + '"/>' +
      '<path d="M115.4 191C127 192.6 140 191.2 147.6 187.4C145.4 195.6 138.6 199.6 130.6 199.8C122 199.8 117.4 196.2 115.4 191Z" fill="' + L.base + '"/>' +
      '<path d="M115 190.8C127 192.6 140 191.4 148.4 187" fill="none" stroke="' + IN + '" stroke-width="1.3" stroke-linecap="round"/>'
  };
}

const BASE_EX: Record<ExprName, Expression> = {
  smirk: { bl: {}, br: { outer: 1, mid: 0.8 }, e: { open: 0.92, look: [2.3, -0.1] }, m: 'soft' },
  grin: { bl: { outer: 1.6, mid: 2, inner: 1.2 }, br: { outer: 1.6, mid: 2, inner: 1.2 }, e: { open: 0.86, lowerRaise: 0.85, look: [1.4, 0] }, m: 'grin', cheeks: true },
  pout: { bl: { outer: 0.8, mid: 0.2, inner: -1.8 }, br: { outer: 0.8, mid: 0.2, inner: -1.8 }, e: { open: 0.86, look: [0.3, -0.3] }, m: 'pout' },
  worried: { bl: { outer: -1.6, mid: 1.8, inner: 4.4 }, br: { outer: -1.6, mid: 1.8, inner: 4.4 }, e: { open: 1.16, look: [-2.3, -0.6] }, m: 'worried' },
  sleepy: { bl: { outer: -1, mid: -0.5, inner: 0.3 }, br: { outer: -1, mid: -0.5, inner: 0.3 }, e: { closed: 'calm' }, m: 'sleepy' },
  cool: { bl: { outer: 1.6, mid: 1.8, inner: 0.6 }, br: { outer: 2.8, mid: 2.4, inner: 0.6 }, e: { open: 0.9, look: [1, 0] }, m: 'cool' }
};

export function exprGroup(c: Look, name: ExprName, M: Record<MouthName, string>): string {
  var x = merge(BASE_EX[name], (c.ex || {})[name]), P = c.P, s = '<g id="' + P + 'Ex-' + name + '">';
  if (x.cheeks) {
    s += '<ellipse cx="98" cy="165" rx="13" ry="7" fill="' + c.skin.light + '" opacity=".55" filter="url(#fB3)"/>';
    s += '<ellipse cx="162" cy="165" rx="13" ry="7" fill="' + c.skin.light + '" opacity=".4" filter="url(#fB3)"/>';
  }
  s += eye(c, -1, x.e, P + 'EyL-' + name) + eye(c, 1, x.e, P + 'EyR-' + name);
  s += brow(c, -1, x.bl) + brow(c, 1, x.br);
  s += M[x.m];
  if (x.glasses === 'shades') {
    var lens = function (x0: number) {
      return 'M' + (x0 + 3) + ' 132L' + (x0 + 30) + ' 131C' + (x0 + 33) + ' 130.9 ' + (x0 + 34) + ' 132.5 ' + (x0 + 33.6) + ' 135L' + (x0 + 31.6) + ' 146.5C' + (x0 + 31) + ' 150 ' + (x0 + 29) + ' 151.5 ' + (x0 + 25.6) + ' 151.5L' + (x0 + 8) + ' 151.5C' + (x0 + 4) + ' 151.5 ' + (x0 + 1.6) + ' 149.5 ' + (x0 + 1) + ' 146.1L' + (x0 - 0.4) + ' 135.5C' + (x0 - 0.8) + ' 133.3 ' + (x0 + 0.6) + ' 132.1 ' + (x0 + 3) + ' 132Z';
    };
    s += '<path d="M80 136.5L88.6 134.9M180 136.5L171.4 134.9" stroke="#0e0f13" stroke-width="3" stroke-linecap="round"/>';
    s += '<path d="' + lens(88) + '" fill="url(#gLensDark)" stroke="#0e0f13" stroke-width="3.2" stroke-linejoin="round"/>';
    s += '<path d="' + lens(138.4) + '" fill="url(#gLensDark)" stroke="#0e0f13" stroke-width="3.2" stroke-linejoin="round"/>';
    s += '<path d="M121.4 136.9C125 134.1 135 134.1 138.6 136.9" fill="none" stroke="#0e0f13" stroke-width="3.2" stroke-linecap="round"/>';
    s += '<path d="M95 148.5L108 133.5M101 150.1L113 136.1M145.4 148.5L158.4 133.5M151.4 150.1L163.4 136.1" stroke="#fff" stroke-width="2.2" opacity=".2" stroke-linecap="round"/>';
  }
  return s + '</g>';
}

/* ================= ears, face ================= */
export function ears(c: Look): string {
  var P = c.P, S = c.skin, dx = c.earDx || 0;
  var earL = 'M81 130C73 122 63 126 63.5 139C64 151 67.5 162 73 168.5C76.6 172.4 80.6 170 81.6 163Z';
  var earLin = 'M77.4 138C72.6 134 68.8 138 69.6 145.4C70.4 151 73.2 156 76.6 158.8';
  var one = '<path d="' + earL + '" fill="url(#' + P + 'EarG)" stroke="' + S.line + '" stroke-width="1.3"/><path d="' + earLin + '" fill="none" stroke="' + S.deep + '" stroke-width="1.5" stroke-linecap="round" opacity=".8"/><path d="M74.4 145.6C72.8 147.6 73.6 151 75.8 152" fill="none" stroke="' + S.deep + '" stroke-width="1.1" opacity=".6"/>';
  var e = '<g transform="translate(' + dx + ' 0)">' + one + '</g>' + '<g transform="translate(' + (260 - dx) + ' 0) scale(-1 1)">' + one + '</g>';
  var R = c.earring;
  if (R) {
    var metal = R.metal === 'gold' ? ['#9c7629', 'url(#gGold)', '#fff6d6'] : ['#7d838c', 'url(#gSilver)', '#ffffff'];
    if (R.stud) e += '<circle cx="' + R.x + '" cy="' + R.y + '" r="' + R.r + '" fill="' + metal[1] + '" stroke="' + metal[0] + '" stroke-width=".6"/>';
    else {
      e += '<circle cx="' + R.x + '" cy="' + R.y + '" r="' + R.r + '" fill="none" stroke="' + metal[0] + '" stroke-width="2"/>';
      e += '<circle cx="' + R.x + '" cy="' + R.y + '" r="' + R.r + '" fill="none" stroke="' + metal[1] + '" stroke-width="1.25"/>';
      e += '<path d="M' + r1(R.x - R.r * 0.8) + ' ' + r1(R.y - R.r * 0.5) + 'A' + R.r + ' ' + R.r + ' 0 0 1 ' + r1(R.x - R.r * 0.1) + ' ' + r1(R.y - R.r) + '" fill="none" stroke="' + metal[2] + '" stroke-width=".8" stroke-linecap="round"/>';
      if (R.bar) e += '<rect x="' + r1(R.x - 0.9) + '" y="' + r1(R.y + R.r - 0.5) + '" width="1.8" height="14" rx=".9" fill="' + metal[1] + '" stroke="' + metal[0] + '" stroke-width=".5"/>';
    }
  }
  return '<g id="' + P + 'Ears">' + e + '</g>';
}

export function face(c: Look): string {
  var P = c.P, S = c.skin, F = FACES[c.face], FD = faceD(c), f = '';
  f += '<g id="' + P + 'Face"><path d="' + FD + '" fill="url(#' + P + 'SkinG)"/><g clip-path="url(#' + P + 'FaceClip)">';
  f += '<path d="M168 92C186 120 186 170 160 214L196 214L196 92Z" fill="' + S.shade + '" opacity=".55" filter="url(#fB6)"/>';
  f += '<path d="M78 150C80 176 92 200 112 214L72 214Z" fill="' + S.shade + '" opacity=".35" filter="url(#fB6)"/>';
  f += '<path d="M86 168C94 178 104 182 112 182" fill="none" stroke="' + S.shade + '" stroke-width="5" opacity=".35" filter="url(#fB3)"/>';
  f += '<path d="M174 168C166 178 156 182 148 182" fill="none" stroke="' + S.shade + '" stroke-width="5" opacity=".45" filter="url(#fB3)"/>';
  f += '<path d="M116.6 170C112 175 109.6 180 109.4 185M143.4 170C148 175 150.4 180 150.6 185" fill="none" stroke="' + S.shade + '" stroke-width="2.4" opacity=".5" filter="url(#fB2)"/>';
  var blush = S.blush || '#e78c7d', bo = S.blush ? 0.34 : 0.15;
  f += '<ellipse cx="97" cy="163" rx="12" ry="6.6" fill="' + blush + '" opacity="' + bo + '" filter="url(#fB3)"/>';
  f += '<ellipse cx="163" cy="163" rx="12" ry="6.6" fill="' + blush + '" opacity="' + (bo * 0.9) + '" filter="url(#fB3)"/>';
  f += '<ellipse cx="114" cy="104" rx="22" ry="10" fill="' + S.light + '" opacity=".6" filter="url(#fB6)"/>';
  if (c.beard) {
    var beard = 'M79 126C77 150 79 172 87 190C97 208 113 219 130 220C147 219 163 208 173 190C181 172 183 150 181 126L176.4 126C176 145 172 159 164 167C158 172 152 174 148.4 180C146 191 140 197.6 130 197.6C120 197.6 114 191 111.6 180C108 174 102 172 96 167C88 159 84 145 83.6 126Z';
    var mous = 'M110 182.6C116 176.4 124 175.4 130 177.4C136 175.4 144 176.4 150 182.6C145 184.6 140 182.4 130 183.4C120 182.4 115 184.6 110 182.6Z';
    var jaw = 'M82 172C86 189 96 204 111 213C119 218.6 141 218.6 149 213C164 204 174 189 178 172C174 187 166 196 155 201C149 209 141 212.4 130 212.4C119 212.4 111 209 105 201C94 196 86 187 82 172Z';
    f += '<path d="' + beard + '" fill="' + c.beard.color + '" opacity=".26" filter="url(#fB2)"/><path d="' + beard + '" fill="#000" filter="url(#fGrain)" opacity=".34"/>';
    f += '<path d="' + jaw + '" fill="' + c.beard.color + '" opacity=".34" filter="url(#fB2)"/><path d="' + jaw + '" fill="#000" filter="url(#fGrain)" opacity=".3"/>';
    f += '<path d="' + mous + '" fill="' + c.beard.color + '" opacity=".46" filter="url(#fSoft)"/><path d="' + mous + '" fill="#000" filter="url(#fGrain)" opacity=".36"/>';
    f += '<path d="M123 204C126 210 134 210 137 204Z" fill="' + c.beard.color + '" opacity=".35" filter="url(#fSoft)"/>';
  }
  f += '</g><path d="' + F[0] + '" fill="none" stroke="' + S.line + '" stroke-width="1.4"/>';
  var strong = c.nose === 'strong';
  f += '<path d="M135.6 129C137.8 141 139.2 151 141.6 162L137.2 164C135.6 152 134.4 142 133.2 130Z" fill="' + S.shade + '" opacity="' + (strong ? 0.85 : 0.7) + '" filter="url(#fB2)"/>';
  f += '<path d="M125 131C124.4 143 122.6 153 120.8 161" fill="none" stroke="' + S.line + '" stroke-width="1" opacity="' + (strong ? 0.4 : 0.26) + '"/>';
  f += '<path d="M128.6 132C128.8 146 128.8 156 129.8 164" fill="none" stroke="' + S.light + '" stroke-width="3" opacity=".8" stroke-linecap="round" filter="url(#fB2)"/>';
  f += '<ellipse cx="121.6" cy="170.2" rx="4.4" ry="3.6" fill="' + S.shade + '" opacity=".38"/>';
  f += '<ellipse cx="139.4" cy="170.2" rx="4.4" ry="3.6" fill="' + S.shade + '" opacity=".55"/>';
  f += '<ellipse cx="130.6" cy="' + (strong ? 167 : 166) + '" rx="' + (strong ? 5.4 : 4.8) + '" ry="3.4" fill="' + S.light + '" opacity=".75"/>';
  f += '<path d="M123.6 170.6C126.6 173.4 134.6 173.4 137.6 170.6" fill="none" stroke="' + S.shade + '" stroke-width="2.2" opacity=".5" filter="url(#fB2)"/>';
  f += '<path d="M118.4 167.6C117.6 171.4 119.8 174 123.4 174.6M142.6 167.6C143.4 171.4 141.2 174 137.6 174.6" fill="none" stroke="' + S.line + '" stroke-width="1" stroke-linecap="round" opacity=".6"/>';
  f += '<ellipse cx="125.2" cy="173.6" rx="2.5" ry="1.2" fill="' + S.deep + '" opacity=".9" transform="rotate(12 125.2 173.6)"/>';
  f += '<ellipse cx="135.8" cy="173.6" rx="2.5" ry="1.2" fill="' + S.deep + '" opacity=".9" transform="rotate(-12 135.8 173.6)"/>';
  f += '<path d="M127.4 175Q130.5 176.8 133.6 175" fill="none" stroke="' + S.line + '" stroke-width="1" opacity=".55"/>';
  f += '<path d="M126.6 178.8C127.6 181.6 128.6 183.2 130.4 183.4C132.2 183.2 133.2 181.6 134.2 178.8" fill="' + S.shade + '" opacity=".35"/>';
  /* a little ring in the septum */
  if (c.septum) f += '<path d="M127.6 174.4A3 3 0 0 0 133.4 174.4" fill="none" stroke="#6f7680" stroke-width="1.9" stroke-linecap="round"/><path d="M127.8 174.6A2.8 2.8 0 0 0 133.2 174.6" fill="none" stroke="url(#gSilver)" stroke-width="1.1" stroke-linecap="round"/>';
  f += '</g>';
  return f;
}
