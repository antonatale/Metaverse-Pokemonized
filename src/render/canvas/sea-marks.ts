/* What the races and the missions at sea put on the water (story/sea.ts): the orange marks of a race, the next one
   ringed; the floats of the fisherman, the yellow buoys of the Lido, Nicola's old board, the kid on his lilo. And the
   windsurf itself: the wake when it planes, the splash of a fall. In map units, fixed colours like the other sprites. */
import type { SeaMark } from '../../story/sea';
import { T } from './index';

const INK = '#1c2340';
function bob(now: number, x: number, still: boolean) { return still ? 0 : Math.sin(now / 430 + x * 1.7) * 1.6; }
function ring(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, a: number) {
  ctx.globalAlpha = a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.ellipse(cx, cy, r, r * 0.42, 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
}
export function drawSeaMarks(ctx: CanvasRenderingContext2D, marks: SeaMark[], now: number, still: boolean, view: { x0: number; x1: number; y0: number; y1: number }) {
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  marks.forEach(function (m) {
    if (m.x < view.x0 - 2 || m.x > view.x1 + 2 || m.y < view.y0 - 2 || m.y > view.y1 + 2) return;
    var cx = m.x * T + T / 2, cy = m.y * T + T * 0.62 + bob(now, m.x + m.y, still);
    ring(ctx, cx, cy + 3, T * 0.42, 0.55);
    if (m.kind === 'mark' || m.kind === 'next') {
      /* a race mark: an orange cone with a white band and a little flag */
      if (m.kind === 'next') {
        var p = still ? 0.5 : (now / 900) % 1;
        ctx.globalAlpha = 0.9 * (1 - p); ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(cx, cy + 3, T * (0.55 + p * 0.9), T * (0.25 + p * 0.4), 0, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = m.kind === 'next' ? '#ff7a1a' : '#e8964f'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(cx - 7, cy + 3); ctx.lineTo(cx - 3, cy - 14); ctx.lineTo(cx + 3, cy - 14); ctx.lineTo(cx + 7, cy + 3); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 5, cy - 6, 10, 3.5);
      ctx.beginPath(); ctx.moveTo(cx, cy - 14); ctx.lineTo(cx, cy - 22); ctx.stroke();
      ctx.fillStyle = m.kind === 'next' ? '#ffd166' : '#ffffff'; ctx.beginPath(); ctx.moveTo(cx, cy - 22); ctx.lineTo(cx + 7, cy - 19.5); ctx.lineTo(cx, cy - 17); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (m.n != null) { ctx.font = '700 9px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText(String(m.n), cx, cy - 1); }
    } else if (m.kind === 'gavitello') {
      /* a fisherman's float: white and red, with its stick */
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(cx, cy - 2, 6, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#d64545'; ctx.beginPath(); ctx.ellipse(cx, cy - 2, 6, 5, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy - 7); ctx.lineTo(cx, cy - 17); ctx.stroke();
      ctx.fillStyle = '#1c2340'; ctx.fillRect(cx, cy - 17, 6, 4);
    } else if (m.kind === 'boa') {
      ctx.fillStyle = '#ffd23f'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(cx, cy - 4, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.globalAlpha = 0.6; ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx - 2.5, cy - 7, 2, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    } else if (m.kind === 'tavola') {
      /* the old board, yellowed by the salt, adrift */
      ctx.save(); ctx.translate(cx, cy - 1); ctx.rotate(still ? -0.3 : -0.3 + Math.sin(now / 900) * 0.08);
      ctx.fillStyle = '#f2d98a'; ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.ellipse(0, 0, 13, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#d64545'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-9, 0); ctx.lineTo(9, 0); ctx.stroke();
      ctx.restore();
    } else if (m.kind === 'ragazzo') {
      /* the kid on his lilo, waving, and the seconds left over him */
      ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
      ctx.fillStyle = '#ff6b8a'; ctx.beginPath(); ctx.ellipse(cx, cy, 12, 4.5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#e9b98f'; ctx.beginPath(); ctx.arc(cx - 6, cy - 7, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      var wave = still ? 0 : Math.sin(now / 160) * 3;
      ctx.beginPath(); ctx.moveTo(cx - 3, cy - 6); ctx.lineTo(cx + 2, cy - 13 + wave); ctx.stroke();
      if (m.n != null) {
        var txt = m.n + '"';
        ctx.font = '700 11px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff'; ctx.strokeText(txt, cx, cy - 20);
        ctx.fillStyle = m.n <= 20 ? '#d64545' : INK; ctx.fillText(txt, cx, cy - 20);
      }
    }
  });
}
/** the windsurf going fast: a wake behind, white spray at the bow; fallen: the splash and the rings */
export function wake(ctx: CanvasRenderingContext2D, x: number, y: number, dx: number, dy: number, gear: number, now: number, fallFor: number) {
  var cx = x + T / 2, cy = y + T * 0.8;
  if (fallFor > 0) {
    var u = 1 - fallFor / 1400;
    for (var k = 0; k < 3; k++) { var r = (u * 1.4 + k * 0.3) % 1.2; ring(ctx, cx, cy, T * (0.3 + r), Math.max(0, 0.8 - r * 0.7)); }
    if (u < 0.35) {
      ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 1 - u / 0.35;
      for (var j = 0; j < 7; j++) { var a = -Math.PI * (0.15 + j * 0.1), h = Math.sin(u / 0.35 * Math.PI) * 14; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 10 * (1 + u * 3), cy + Math.sin(a) * h, 2, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    return;
  }
  if (gear < 3 || (!dx && !dy)) return;
  var len = T * (0.6 + (gear - 3) * 0.35);
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for (var s = -1; s <= 1; s += 2) {
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(cx - dx * 4 + dy * s * 3, cy - dy * 2 + dx * s * 3);
    ctx.quadraticCurveTo(cx - dx * len * 0.6 + dy * s * 8, cy - dy * len * 0.5 + dx * s * 6, cx - dx * len + dy * s * 13, cy - dy * len * 0.8 + dx * s * 9); ctx.stroke();
  }
  if (gear >= 4) {
    ctx.fillStyle = '#ffffff';
    for (var i = 0; i < 4; i++) {
      var ph = (now / 90 + i * 0.25) % 1;
      ctx.globalAlpha = 0.8 * (1 - ph);
      ctx.beginPath(); ctx.arc(cx + dx * (8 + ph * 6) + (i - 1.5) * 3 * (dy ? 1 : 0), cy + dy * (4 + ph * 4) - ph * 6 + (i - 1.5) * 2 * (dx ? 1 : 0), 1.6, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}
/** over the night: a little light on the marks and the things to find, as on the lost things on land */
export function seaGlints(ctx: CanvasRenderingContext2D, marks: SeaMark[], now: number, still: boolean, night: number) {
  if (night < 0.25) return;
  marks.forEach(function (m, i) {
    var cx = m.x * T + T / 2, cy = m.y * T + T * 0.62 - (m.kind === 'mark' || m.kind === 'next' ? 22 : 12) + bob(now, m.x + m.y, still);
    var tw = still ? 0.8 : 0.55 + 0.45 * Math.sin(now / 300 + i * 1.7), r = (m.kind === 'next' || m.kind === 'ragazzo' ? 9 : 6) * (0.8 + tw * 0.4);
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.2);
    g.addColorStop(0, m.kind === 'mark' || m.kind === 'next' ? 'rgba(255,190,90,' + (0.9 * night) + ')' : 'rgba(255,255,235,' + (0.9 * night) + ')');
    g.addColorStop(1, 'rgba(255,220,150,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 2.2, 0, Math.PI * 2); ctx.fill();
  });
}
