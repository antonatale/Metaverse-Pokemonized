import { deadBall, netDrop } from './line-review';
import { athletePose } from './athlete';
import { paintClay } from './clay';
import { fitCourtCamera } from './camera';
import { createPlayerArt } from './player-art';
import { ballGravity, DOUBLES_WIDTH, HALF_LENGTH, HALF_WIDTH, contactPowerLimit, netHeight, preparationPower, SERVICE_LINE } from './physics';
import type { Side } from './match';
import type { Kit } from './roster';
import type { Projected } from './volumes';
import type { Ball, Bounce, ContactGuide, Point, previewStroke, Rally, Runner } from './physics';

export type Pose = { ball: Ball; player: Runner; opponent: Runner; tick: number; charge: number };
export const poseOf = (rally: Rally): Pose => ({
  ball: { ...rally.ball }, player: { ...rally.player }, opponent: { ...rally.opponent },
  tick: rally.tick, charge: preparationPower(rally),
});

const palette = getComputedStyle(document.documentElement);
const color = (name: string): string => palette.getPropertyValue(`--${name}`).trim();
const ink = color('ink');
const light = color('cream');
const accent = color('accent');
const lineCue = color('cyan');
const strikeCue = color('contact');
const overhit = color('overhit');
const lobCue = color('lob-cue');
const dropCue = color('drop-cue');
const ballColor = color('ball');
const halo = color('halo');

function context(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const drawing = canvas.getContext('2d');
  if (!drawing) throw new Error('Canvas 2D non disponibile');
  return drawing;
}

function interpolate<T extends Point>(from: T, to: T, alpha: number): T {
  return { ...to, x: from.x + (to.x - from.x) * alpha, y: from.y + (to.y - from.y) * alpha };
}

export function createCourt(canvas: HTMLCanvasElement) {
  const ctx = context(canvas);
  const background = document.createElement('canvas');
  const paper = context(background);
  const netLayer = document.createElement('canvas');
  const net = context(netLayer);
  const athletes = createPlayerArt();
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let width = 1;
  let height = 1;
  let pixelRatio = 1;
  let camera = fitCourtCamera(width, height);
  let netY = 0;

  function project(x: number, y: number, z = 0): Projected {
    return camera.project(x, y, z);
  }

  function groundAt(clientX: number, clientY: number): Point | null {
    const bounds = canvas.getBoundingClientRect();
    return camera.ground(clientX - bounds.left, clientY - bounds.top);
  }

  function path(drawing: CanvasRenderingContext2D, points: Point[], close = false): void {
    drawing.beginPath();
    drawing.moveTo(points[0].x, points[0].y);
    for (const point of points.slice(1)) drawing.lineTo(point.x, point.y);
    if (close) drawing.closePath();
  }

  function polygon(drawing: CanvasRenderingContext2D, points: Point[], fill: string | CanvasGradient): void {
    path(drawing, points, true);
    drawing.fillStyle = fill;
    drawing.fill();
  }

  function stroke(drawing: CanvasRenderingContext2D, points: Point[], shade: string, thickness: number): void {
    path(drawing, points);
    drawing.strokeStyle = shade;
    drawing.lineWidth = thickness;
    drawing.stroke();
  }

  function ellipse(point: Point, rx: number, ry: number, fill: string | CanvasGradient | null, border?: string, thickness = 1): void {
    ctx.beginPath();
    ctx.ellipse(point.x, point.y, rx, ry, 0, 0, Math.PI * 2);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (border) { ctx.strokeStyle = border; ctx.lineWidth = thickness; ctx.stroke(); }
  }

  function drawBackground(): void {
    const half = 9.65, near = -16.05, far = 14.66;
    // Match the toe of the limestone wall in the arena plate at every aspect ratio.
    const plateHeight = height * (width / height > 1.5 ? .67 : .74);
    const plateWidth = Math.max(width, plateHeight * 1672 / 941);
    const top = project(0, 14.6).y - plateHeight * .431;
    const wall = [[0, .692], [.04, .61], [.073, .552], [.12, .502], [.18, .466], [.245, .442], [.31, .435],
      [.69, .435], [.755, .442], [.82, .464], [.88, .502], [.927, .552], [.96, .605], [1, .692]]
      .map(([u,v]) => ({ x: (width - plateWidth) / 2 + u * plateWidth, y: top + v * plateHeight }));
    const slab = [...wall, { x: wall[wall.length - 1].x, y: height }, { x: wall[0].x, y: height }];
    polygon(paper, slab, '#b4532e');
    paper.save();
    path(paper, slab, true);
    paper.clip();
    paintClay(paper, project, half, near, far);
    const lightCenter = project(-2.9, -4);
    const wash = paper.createRadialGradient(lightCenter.x, lightCenter.y, 4, lightCenter.x, lightCenter.y, height * .79);
    wash.addColorStop(0, '#ffdabf28');
    wash.addColorStop(.52, '#ffc58a0a');
    wash.addColorStop(1, '#30303c30');
    polygon(paper, slab, wash);
    stroke(paper, wall, '#442e344a', Math.min(6, plateHeight * .012));
    paper.restore();

    const stripe = (a: Point, b: Point, size = .060) => {
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      const dx = (a.y - b.y) / length * size / 2;
      const dy = (b.x - a.x) / length * size / 2;
      const paint = [project(a.x - dx, a.y - dy), project(a.x + dx, a.y + dy),
        project(b.x + dx, b.y + dy), project(b.x - dx, b.y - dy)];
      const start = project(a.x, a.y);
      const end = project(b.x, b.y);
      stroke(paper, [{ x: start.x, y: start.y + .87 }, { x: end.x, y: end.y + .87 }], '#55362b98', 1.6);
      polygon(paper, paint, '#f7e8c8');
    };
    for (const y of [-HALF_LENGTH, HALF_LENGTH]) {
      stripe({ x: -DOUBLES_WIDTH, y }, { x: DOUBLES_WIDTH, y }, .085);
      stripe({ x: 0, y }, { x: 0, y: y - Math.sign(y) * .23 });
    }
    for (const x of [-DOUBLES_WIDTH, -HALF_WIDTH, HALF_WIDTH, DOUBLES_WIDTH]) stripe({ x, y: -HALF_LENGTH }, { x, y: HALF_LENGTH });
    for (const y of [-SERVICE_LINE, SERVICE_LINE]) stripe({ x: -HALF_WIDTH, y }, { x: HALF_WIDTH, y });
    stripe({ x: 0, y: -SERVICE_LINE }, { x: 0, y: SERVICE_LINE });

    const fence = 14.63;
    for (let x = -7.25; x < 7.28; x += .35) stroke(paper, [project(x, fence), project(x, fence, 1.65)], '#a8b5a526', .9);
    for (const z of [.33, .89, 1.65]) stroke(paper, [project(-7.43, fence, z), project(7.43, fence, z)], '#a8b5a550', z > 1 ? 1.4 : .85);
    for (const x of [-7.43, -3.72, 0, 3.72, 7.43]) stroke(paper, [project(x, fence), project(x, fence, 1.72)], '#172326', 2.2);
    const board = [project(-7.41, fence), project(7.41, fence), project(7.41, fence, .72), project(-7.41, fence, .72)];
    const panel = paper.createLinearGradient(board[3].x, board[3].y, board[0].x, board[0].y);
    panel.addColorStop(0, '#314d58');
    panel.addColorStop(.42, '#1c3742');
    panel.addColorStop(1, '#152831');
    polygon(paper, board, panel);
    stroke(paper, [board[3], board[2]], '#d0aa77', 1.10);
    for (const x of [-5.56, -1.85, 1.85, 5.56]) {
      const p = (dx: number, z: number) => project(x + dx, fence, z);
      stroke(paper, [p(-.63, .20), p(-.17, .43), p(.14, .43), p(.59, .20)], '#c4bf9d88', 1.25);
    }
    drawBench(-8.1, 2.5);
    drawBench(8.1, -2.8);
    drawChair(-7.86, -.6);
  }

  function drawChair(x: number, y: number): void {
    const seat = 1.66;
    const p = (dx: number, dy: number, z = 0) => project(x + dx, y + dy, z);
    polygon(paper, [p(-.48, -.55), p(.65, -.55), p(1.28, .27), p(.12, .39)], '#09142170');
    const rail = '#bdc4ba';
    for (const dx of [-.34, .34]) {
      stroke(paper, [p(dx, -.74), p(dx, .12, seat), p(dx, .12, seat + .38)], '#182431', 3.15);
      stroke(paper, [p(dx, -.74), p(dx, .12, seat), p(dx, .12, seat + .38)], rail, 1.35);
      stroke(paper, [p(dx, .46), p(dx, .12, seat)], '#77878c', 1.45);
    }
    for (const z of [.3, .59, .88, 1.17, 1.46]) stroke(paper, [p(-.34, -.74 + z * .52, z), p(.34, -.74 + z * .52, z)], rail, 1.2);
    polygon(paper, [p(-.43, -.19, seat), p(.43, -.19, seat), p(.43, .44, seat), p(-.43, .44, seat)], '#d7a276');
    polygon(paper, [p(-.42, .44, seat), p(.42, .44, seat), p(.41, .46, seat + .43), p(-.41, .46, seat + .43)], '#9c795e');
  }

  function drawBench(x: number, y: number): void {
    const side = Math.sign(x);
    const rail = (z: number, delta: number) => [project(x + delta, y - 1.34, z), project(x + delta, y + 1.34, z)];
    polygon(paper, [...rail(0, -.3), ...rail(0, .54).reverse()], '#08122265');
    for (const end of [y - 1.05, y + 1.05]) {
      stroke(paper, [project(x - side * .26, end), project(x - side * .26, end, .47)], '#182636', 1.6);
      stroke(paper, [project(x + side * .28, end), project(x + side * .28, end, .88)], '#182636', 1.6);
    }
    for (let plank = 0; plank < 4; plank++) {
      const a = -side * .28 + plank * side * .148;
      polygon(paper, [...rail(.47, a), ...rail(.47, a + side * .13).reverse()], plank % 2 ? '#b58b67' : '#ba9471');
      stroke(paper, rail(.47, a), '#e1c099', .66);
    }
    for (const z of [.63, .80]) {
      polygon(paper, [...rail(z, side * .29), ...rail(z + .13, side * .32).reverse()], '#94745c');
      stroke(paper, rail(z + .13, side * .32), '#d4ad86', .91);
    }
  }

  function drawNet(): void {
    const post = DOUBLES_WIDTH + .65;
    polygon(net, [project(-post, 0), project(post, 0), project(post + .45, .34), project(-post + .45, .34)], '#43291f2b');
    stroke(net, [project(-post + .45, .34), project(post + .45, .34)], '#4e322259', 1.3);
    const top = Array.from({ length: 15 }, (_, index) => {
      const x = -post + index * post / 7;
      return project(x, 0, netHeight(x));
    });
    const center = project(0, 0, netHeight(0));
    const bottom = project(0, 0);
    const mesh = net.createLinearGradient(center.x, center.y, bottom.x, bottom.y);
    mesh.addColorStop(0, '#2c373c38');
    mesh.addColorStop(1, '#121b2352');
    polygon(net, [project(-post, 0), ...top, project(post, 0)], mesh);
    for (let x = -post; x < post; x += .13) stroke(net, [project(x, 0), project(x, 0, netHeight(x))], '#0f1824a9', .68);
    for (const y of [.12, .245, .37, .495, .62, .745, .87]) stroke(net, [project(-post, 0, y), project(post, 0, y)], '#141d24b9', .68);
    stroke(net, [center, bottom], '#e3d9bb', Math.max(1.25, center.scale * .049));
    for (const x of [-post, post]) {
      const low = project(x, 0, .02);
      const cap = project(x, 0, 1.155);
      stroke(net, [low, cap], ink, Math.max(3.25, cap.scale * .17));
      stroke(net, [project(x - .039, 0, .06), project(x - .039, 0, 1.13)], '#858f89', Math.max(1, cap.scale * .042));
      stroke(net, [project(x - .09, 0, 1.15), project(x + .09, 0, 1.15)], '#d2cac0', Math.max(1.3, cap.scale * .044));
    }
    stroke(net, top, '#181e1b', Math.max(2.5, camera.focal * .006));
    stroke(net, top, light, Math.max(1.5, camera.focal * .0035));
  }

  function drawMark(mark: Bounce, strokes: number): void {
    const p = project(mark.x, mark.y);
    const size = Math.max(1.7, Math.min(3.2, p.scale * .066));
    const shade = mark.inCourt ? '#ffe0b2' : '#ffe4d8';
    ctx.globalAlpha = strokes === mark.stroke ? .92 : .42;
    stroke(ctx, [{ x: p.x - size, y: p.y + 1 }, { x: p.x + size, y: p.y - 1 }], shade, 1.55);
    ctx.globalAlpha = 1;
  }

  function drawBall(ball: Ball, travelling: boolean, signal?: string): void {
    const ground = project(ball.x, ball.y);
    const air = project(ball.x, ball.y, Math.max(0, ball.z));
    const size = Math.max(3.4, Math.min(6.1, air.scale * .105));
    ellipse(ground, size + ball.z * .61, size * .47 + ball.z * .17, '#171a2549');
    ellipse(ground, size * .75 + ball.z * .21, size * .32 + ball.z * .06, '#1a1a2090');
    if (ball.z > .42) stroke(ctx, [ground, air], '#fff4cc63', .8);
    if (travelling && !reducedMotion.matches && Math.hypot(ball.vx, ball.vy) > 7) {
      const exposure = .022 + Math.min(1, Math.hypot(ball.vx, ball.vy) / 30) ** 2 * .032;
      const behind = (dt: number) => project(ball.x - ball.vx * dt, ball.y - ball.vy * dt,
        Math.max(0, ball.z - ball.vz * dt - ballGravity(ball) * dt * dt / 2));
      const wake = behind(exposure);
      const tail = behind(exposure * .43);
      stroke(ctx, [wake, tail], '#f2ffad3a', Math.max(1.25, size * .41));
      stroke(ctx, [tail, air], '#f2ffad8c', Math.max(1.5, size * .73));
    }
    const felt = ctx.createRadialGradient(air.x - size * .34, air.y - size * .41, size * .08, air.x, air.y, size);
    felt.addColorStop(0, '#ffffc4');
    felt.addColorStop(.45, ballColor);
    felt.addColorStop(1, '#7b903c');
    ellipse(air, size, size, felt, '#252c26', 1.05);
    ctx.beginPath();
    ctx.moveTo(air.x - size * .88, air.y + size * .16);
    ctx.quadraticCurveTo(air.x - size * .06, air.y + size * .31, air.x + size * .37, air.y - size * .89);
    ctx.strokeStyle = '#fff8d6a1';
    ctx.lineWidth = Math.max(.55, size * .12);
    ctx.stroke();
    if (signal) ellipse(air, size + 3.7, size + 3.7, null, signal, 1.7);
  }

  function drawImpact(rally: Rally, age: number): void {
    if (!rally.impact || age < 0 || age >= 1 || reducedMotion.matches || rally.phase !== 'rally') return;
    const { x, y, z, charge } = rally.impact;
    const location = project(x, y, z);
    const radius = Math.max(7, location.scale * .23) * (1 + age * 1.5);
    ctx.save();
    ctx.globalAlpha = (1 - age) * .82;
    const shade = rally.hitter === 'opponent' ? lineCue : charge > 1 ? overhit : accent;
    const direction = project(x + rally.ball.vx * .044, y + rally.ball.vy * .044, z + rally.ball.vz * .044);
    const heading = Math.atan2(direction.y - location.y, direction.x - location.x);
    const normal = { x: -Math.sin(heading), y: Math.cos(heading) };
    const length = radius * (rally.impact.kind === 'drop' ? .40 : .77);
    for (const side of [-1, 1]) {
      const start = { x: location.x + side * normal.x * 2, y: location.y + side * normal.y * 2 };
      const end = { x: start.x + side * normal.x * length, y: start.y + side * normal.y * length };
      stroke(ctx, [start, end], shade, 1.4);
    }
    ctx.restore();
  }

  function drawDestination(target: Point, player: Runner): void {
    const distance = Math.hypot(target.x - player.x, target.y - player.y);
    if (distance < .16) return;
    const marker = project(target.x, target.y);
    const radius = Math.max(6, marker.scale * .19);
    if (distance > 1.5) {
      const from = project(player.x, player.y);
      ctx.setLineDash([2, 4]);
      stroke(ctx, [interpolate(from, marker, .25), marker], '#a4eff073', 1.2);
      ctx.setLineDash([]);
    }
    ellipse(marker, radius, radius * .53, '#91ddf02f', '#a4eff0cf', 1.3);
    ellipse(marker, 1.5, 1.2, lineCue);
  }

  function drawAim(preview: NonNullable<ReturnType<typeof previewStroke>>, ready: boolean): void {
    const { target, path: samples, kind } = preview;
    const end = samples[samples.length - 1];
    const landing = preview.net ? project(end.x,end.y,end.z) : project(target.x, target.y);
    const shade = preview.net ? overhit : kind === 'lob' ? lobCue : kind === 'slice' || kind === 'reach' ? '#ffd39d' : kind === 'drop' ? dropCue : kind === 'volley' ? strikeCue : lineCue;
    const radius = Math.max(9, Math.min(15, landing.scale * .38));
    const arc = samples.map((point) => project(point.x, point.y, point.z));
    ctx.save();
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(arc[0].x, arc[0].y);
    for (let i = 1; i < arc.length - 1; i++) {
      const mid = interpolate(arc[i], arc[i + 1], .5);
      ctx.quadraticCurveTo(arc[i].x, arc[i].y, mid.x, mid.y);
    }
    ctx.lineTo(landing.x, landing.y);
    ctx.globalAlpha = ready ? .59 : .37;
    ctx.strokeStyle = halo;
    ctx.lineWidth = 4.5;
    ctx.stroke();
    ctx.globalAlpha = ready ? .95 : .73;
    ctx.strokeStyle = shade;
    ctx.lineWidth = 2.15;
    ctx.setLineDash([2.6, 5.2]);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = .38;
    ellipse(landing, radius + 4, radius * .57 + 2, null, shade, 1.2);
    ctx.globalAlpha = 1;
    ellipse(landing, radius, radius * .56, '#10233ac2', halo, 3.0);
    ellipse(landing, radius, radius * .56, null, shade, 1.6);
    stroke(ctx, [{ x: landing.x - 3.4, y: landing.y }, { x: landing.x + 3.4, y: landing.y }], light, 1.25);
    stroke(ctx, [{ x: landing.x, y: landing.y - 2.6 }, { x: landing.x, y: landing.y + 2.6 }], light, 1.25);
    const caption = preview.net ? 'RETE' : Math.abs(target.x) > HALF_WIDTH ? 'LARGO' : Math.abs(target.y) > HALF_LENGTH ? 'LUNGO' : kind === 'lob' ? 'PALLONETTO' : kind === 'drop' ? 'SMORZATA' : kind === 'slice' ? 'SLICE' : '';
    if (caption) {
      ctx.font = '700 9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const x = landing.x;
      const y = Math.max(13, landing.y - radius * .68 - 9);
      const w = ctx.measureText(caption).width + 13;
      ctx.beginPath();
      ctx.roundRect(x - w / 2, y - 8, w, 16, 4);
      ctx.fillStyle = halo;
      ctx.fill();
      ctx.fillStyle = shade;
      ctx.fillText(caption, x, y);
    }
    ctx.restore();
  }

  function drawContact(guide: ContactGuide): void {
    if (guide.state === 'late') return;
    const { point } = guide;
    const ground = project(point.x, point.y);
    const radius = Math.max(6, Math.min(12, ground.scale * .29));
    const shape = [
      { x: ground.x, y: ground.y - radius * .48 }, { x: ground.x + radius, y: ground.y },
      { x: ground.x, y: ground.y + radius * .48 }, { x: ground.x - radius, y: ground.y },
    ];
    const ready = guide.state === 'ready';
    const shade = guide.stretched ? '#ffca89' : ready ? strikeCue : guide.state === 'away' ? '#ffd9a6' : lineCue;
    polygon(ctx, shape, ready ? '#baf98c42' : '#10233a85');
    stroke(ctx, [...shape, shape[0]], halo, 3.3);
    stroke(ctx, [...shape, shape[0]], shade, ready ? 2.2 : 1.4);
  }

  function drawTiming(feet: Projected, unit: number, guide: ContactGuide | null, charge: number, preparing: boolean, limit: number): void {
    const radius = Math.max(13, unit * .55);
    const ready = guide?.state === 'ready';
    const approaching = guide?.state === 'wait' && guide.seconds < .44;
    if (ready || approaching) {
      const amount = ready ? Math.min(1, guide.seconds / .32) : 1 - guide.seconds / .44;
      const color = guide.stretched ? '#ffca89' : ready ? strikeCue : lineCue;
      ctx.save();
      ctx.translate(feet.x, feet.y + 1);
      ctx.scale(1, .41);
      for (const direction of [-1, 1]) {
        const mid = direction === 1 ? 0 : Math.PI;
        const extent = .18 + amount * .98;
        ctx.beginPath();
        ctx.arc(0, 0, radius * (ready ? 1 : 1.15), mid - extent, mid + extent);
        ctx.strokeStyle = halo;
        ctx.lineWidth = 5;
        ctx.stroke();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2.7;
        ctx.stroke();
      }
      ctx.restore();
    }
    if (preparing) {
      const w = Math.max(32, unit * 1.12);
      const x = feet.x - w / 2;
      const y = Math.min(height - 9, feet.y + radius * .50 + 3);
      ctx.fillStyle = halo;
      ctx.fillRect(x - 2, y - 1, w + 4, 6);
      ctx.fillStyle = '#fa916b77';
      ctx.fillRect(x + w * limit, y, w * (1 - limit), 4);
      ctx.fillStyle = charge > limit ? overhit : charge >= .95 ? strikeCue : accent;
      ctx.fillRect(x, y, w * charge, 4);
      ctx.fillStyle = light;
      ctx.fillRect(x + w * limit, y - 1, 1, 6);
    }
    if (!ready && !(approaching && guide.seconds <= .44)) return;
    const title = guide.stretched ? 'ALLUNGO' : ready ? guide.volley ? 'VOLÉE · ORA' : 'ORA' : 'CARICA';
    ctx.font = '800 11px system-ui, sans-serif';
    const w = ctx.measureText(title).width + 12;
    const x = feet.x > width * .53 ? Math.max(4, feet.x - radius - w - 9) : Math.min(width - w - 4, feet.x + radius + 9);
    const y = Math.min(height - 23, feet.y - unit * .6);
    ctx.beginPath();
    ctx.roundRect(x, y, w, 19, 4);
    ctx.fillStyle = guide.stretched ? '#ffca89' : ready ? strikeCue : lineCue;
    ctx.fill();
    ctx.strokeStyle = halo;
    ctx.lineWidth = 1.45;
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.textBaseline = 'middle';
    ctx.fillText(title, x + 6, y + 9.5);
  }

  function drawAthlete(pose: ReturnType<typeof athletePose>, runner: Runner, kit: Kit, near: boolean, guide: ContactGuide | null, preparing: boolean, charge: number, limit: number): void {
    const feet = project(runner.x, runner.y);
    const scale = Math.max(15, feet.scale);
    // Composite one silhouette so overlapping limbs do not darken their joints.
    const cast = (joint: typeof pose.head) => project(joint.x + .51 * joint.z, joint.y + .34 * joint.z);
    ctx.save();
    ctx.fillStyle = '#25212d45';
    ctx.beginPath();
    const castLimb = (a: typeof pose.head, b: typeof pose.head, ra: number, rb: number) => {
      const from = cast(a), to = cast(b);
      const dx = to.x - from.x, dy = to.y - from.y;
      const length = Math.max(.01, Math.hypot(dx, dy));
      const nx = -dy / length, ny = dx / length;
      const r1 = ra * scale, r2 = rb * scale;
      ctx.moveTo(from.x - nx * r1, from.y - ny * r1);
      ctx.lineTo(to.x - nx * r2, to.y - ny * r2);
      ctx.lineTo(to.x + nx * r2, to.y + ny * r2);
      ctx.lineTo(from.x + nx * r1, from.y + ny * r1);
      ctx.closePath();
    };
    for (const leg of pose.legs) {
      castLimb(leg.ankle, leg.knee, .052, .073);
      castLimb(leg.knee, leg.hip, .073, .105);
    }
    castLimb(pose.legs[1].hip, pose.neck, .15, .19);
    for (const arm of pose.arms) {
      castLimb(arm.shoulder, arm.elbow, .072, .051);
      castLimb(arm.elbow, arm.hand, .051, .037);
    }
    const skull = cast(pose.head);
    ctx.moveTo(skull.x + scale * .105, skull.y);
    ctx.ellipse(skull.x, skull.y, scale * .105, scale * .074, .15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.restore();
    ellipse(feet, scale * .36, scale * .10, '#27202a42');
    for (const leg of pose.legs) {
      const contact = project((leg.ankle.x + leg.toe.x) * .5, (leg.ankle.y + leg.toe.y) * .5);
      ellipse(contact, scale * .107, scale * .060, leg.ankle.z > .20 ? '#33292634' : '#201f28a0');
    }
    if (!reducedMotion.matches && (runner.plant ?? 0) > .33 && Math.hypot(runner.vx, runner.vy) > 2.3) {
      for (const [delay, radius] of [[.060, .11], [.095, .076], [.13, .043]]) {
        const dust = project(runner.x - runner.vx * delay, runner.y - runner.vy * delay, delay * .3);
        ellipse(dust, scale * radius, scale * radius * .35, '#f5d9b44a');
      }
    }
    if (near) drawTiming(feet, scale * .88, guide, charge, preparing, limit);
    athletes.draw(ctx, pose, kit, camera, scale > 30 ? 16 : 13);
  }

  function drawServiceBox(service: NonNullable<Rally['service']>): void {
    const { server, side } = service.turn;
    const half = server === 'player' ? 1 : -1;
    const box = [project(0, 0), project(-side * HALF_WIDTH, 0), project(-side * HALF_WIDTH, half * SERVICE_LINE), project(0, half * SERVICE_LINE)];
    polygon(ctx, box, '#f6f69424');
    stroke(ctx, [box[1], box[2], box[3]], '#e9f88cb0', 1.7);
  }

  function resize(): void {
    const layout = getComputedStyle(canvas);
    width = Math.max(1, parseFloat(layout.width) || canvas.clientWidth);
    height = Math.max(1, parseFloat(layout.height) || canvas.clientHeight);
    pixelRatio = Math.min(2, window.devicePixelRatio || 1);
    camera = fitCourtCamera(width, height);
    // Anchor the illustrated clearing to the far edge of the playable ground.
    const sceneryHeight = height * (width / height > 1.5 ? .67 : .74);
    const sceneryTop = project(0, 14.6).y - sceneryHeight * .431;
    const sceneryStyle = canvas.parentElement?.style;
    sceneryStyle?.setProperty('--scenery-height', `${sceneryHeight}px`);
    sceneryStyle?.setProperty('--scenery-width', `${sceneryHeight * 1672 / 941}px`);
    sceneryStyle?.setProperty('--scenery-top', `${sceneryTop}px`);
    sceneryStyle?.setProperty('--scenery-end', `${sceneryTop + sceneryHeight}px`);
    canvas.width = background.width = Math.round(width * pixelRatio);
    canvas.height = background.height = Math.round(height * pixelRatio);
    paper.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawBackground();
    netY = Math.floor(project(0, 0, 1.2).y) - 4;
    netLayer.width = canvas.width;
    netLayer.height = Math.ceil((project(0, -.9).y - netY + 4) * pixelRatio);
    net.setTransform(pixelRatio, 0, 0, pixelRatio, 0, -netY * pixelRatio);
    drawNet();
  }

  function followReplay(ball: Point, progress: number, view = 'ball', landing: Point = ball): void {
    const overlay = canvas.parentElement?.style;
    if (!overlay || reducedMotion.matches) return;
    const zoom = view === 'wide' ? 1 : view === 'landing' ? 1.70 : 1 + (width < 520 ? .12 : .24) * Math.sin(progress * Math.PI);
    const subject = view === 'landing' ? landing : ball;
    const focus = project(subject.x, subject.y, .4);
    const x = Math.max(width * (1 - zoom), Math.min(0, width * .5 - focus.x * zoom));
    const y = Math.max(height * (1 - zoom), Math.min(0, height * .55 - focus.y * zoom));
    overlay.setProperty('--replay-x', `${x}px`);
    overlay.setProperty('--replay-y', `${y}px`);
    overlay.setProperty('--replay-zoom', String(zoom));
  }

  function draw(rally: Rally, previous: Pose, mix: number, guide: ContactGuide | null, preview: ReturnType<typeof previewStroke>,
    destination: Point | null, charge: number, kits: Record<Side, Kit>, winner: Side | null, outcome: number): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(background, 0, 0);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const ball = interpolate(previous.ball, rally.ball, mix);
    ball.z = previous.ball.z + (rally.ball.z - previous.ball.z) * mix;
    const finalMark = rally.marks[rally.marks.length - 1];
    if (rally.phase === 'finished' && finalMark?.first && !finalMark.inCourt && !reducedMotion.matches && canvas.parentElement?.dataset.replay !== 'true') {
      // Continue the dead ball visually after the call without advancing the scored rally.
      Object.assign(ball, deadBall(rally.ball, outcome * 2));
    }
    const showNetStop = rally.netStop && canvas.parentElement?.dataset.replay !== 'true';
    if (showNetStop) Object.assign(ball,netDrop(rally.ball,reducedMotion.matches ? 1 : outcome * .95));
    const player = interpolate(previous.player, rally.player, mix);
    const opponent = interpolate(previous.opponent, rally.opponent, mix);
    player.stride = (previous.player.stride ?? 0) + ((rally.player.stride ?? 0) - (previous.player.stride ?? 0)) * mix;
    opponent.stride = (previous.opponent.stride ?? 0) + ((rally.opponent.stride ?? 0) - (previous.opponent.stride ?? 0)) * mix;
    const visualTick = previous.tick + (rally.tick - previous.tick) * mix + (winner && rally.phase === 'finished' ? outcome * 56 : 0);
    for (const slide of rally.slides) {
      const age = Math.max(0, visualTick - slide.tick);
      if (age > 200) continue;
      const from = project(slide.from.x, slide.from.y), to = project(slide.to.x, slide.to.y);
      ctx.globalAlpha = Math.max(0, .58 - age / 355);
      stroke(ctx, [from, to], '#86371e', Math.max(.65, to.scale * .069));
      stroke(ctx, [project(slide.from.x + .033, slide.from.y), project(slide.to.x + .033, slide.to.y)], '#e89a61', Math.max(.4, to.scale * .024));
    }
    ctx.globalAlpha = 1;
    if (rally.service && rally.phase !== 'finished') drawServiceBox(rally.service);
    for (const mark of rally.marks) drawMark(mark, rally.strokes);
    if (rally.serveTarget) {
      const target = rally.serveTarget;
      const center = project(target.x, target.y);
      const ring = Array.from({length: 33}, (_, i) => {
        const angle = i * Math.PI / 16;
        return project(target.x + target.radius * Math.cos(angle), target.y + target.radius * Math.sin(angle));
      });
      polygon(ctx, ring, '#ecf68d38');
      stroke(ctx, ring, '#f3f7b6', 1.6);
      ctx.save();
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.lineWidth = 3;
      ctx.strokeStyle = halo;
      ctx.fillStyle = light;
      ctx.strokeText(target.name, center.x, center.y - 9);
      ctx.fillText(target.name, center.x, center.y - 9);
      ctx.restore();
    }
    if (rally.phase === 'rally' && rally.hitter === 'player' && rally.impact?.kind === 'reach' && rally.swing && visualTick < rally.swing.readyAt) {
      const feet = project(player.x,player.y);
      const cover = project(rally.opponent.x * -.30, player.y < -7 ? -10 : -5);
      const dx = cover.x - feet.x, dy = cover.y - feet.y;
      const distance = Math.hypot(dx, dy);
      if (distance > 25) {
        const x = dx / distance, y = dy / distance;
        const tip = {x: feet.x + x * 28, y: feet.y + y * 28};
        const base = {x: tip.x - x * 8, y: tip.y - y * 8};
        stroke(ctx, [{x: base.x - y * 4,y: base.y + x * 4},tip,{x:base.x + y * 4,y:base.y - x * 4}], '#ffda9c', 2.2);
      }
    }
    if (destination) drawDestination(destination, player);
    if (preview) drawAim(preview, guide?.state === 'ready');
    const kind = rally.impact?.kind;
    const swing = Math.max(0, visualTick - rally.strikeTick) / (kind === 'serve' ? 24 : kind === 'volley' || kind === 'drop' ? 16 : kind === 'reach' ? 29 : 25);
    const renderAthlete = (side: Side, runner: Runner) => {
      const near = side === 'player';
      const serverToss = rally.service?.phase === 'toss' && rally.service.turn.server === side ? rally.service.started : null;
      const toss = serverToss === null ? null : Math.max(0, Math.min(1, (visualTick - serverToss) / 55));
      const attempt = near ? rally.swing : null;
      const progress = attempt ? Math.max(0, (visualTick - attempt.started) / (attempt.readyAt - attempt.started)) : swing;
      const lead = attempt && attempt.result !== 'hit' && progress < .22 ? progress / .22 : undefined;
      const swingPhase = attempt && attempt.result !== 'hit' ? Math.max(0, (progress - .22) / .78) : progress;
      const impact = progress >= 1 ? null : attempt?.spot ?? (rally.hitter === side ? rally.impact : null);
      const opponentApproach = !near && !rally.service && rally.phase === 'rally' && rally.hitter === 'player'
        && (rally.opponentPlan && Math.hypot(rally.opponentPlan.x - rally.ball.x, rally.opponentPlan.y - rally.ball.y) < 4.4);
      const opponentAtNet = opponentApproach && (rally.tactic === 'net' || rally.attacking) && rally.bounces === 0 && runner.y < 5.25;
      const preparing = near ? !!rally.preparation : !!opponentApproach;
      const readySwing = rally.opponentPlan && rally.opponentPlan.x > runner.x ? 'Rovescio' : 'Diritto';
      const anticipation = near && guide ? guide.state === 'ready' ? 1 : guide.state === 'wait' ? Math.max(0, 1 - guide.seconds / .44) : 0 : 0;
      const expectedWing = guide && guide.point.x < runner.x - .10 ? 'Rovescio' : 'Diritto';
      const pose = athletePose({ runner, tick: visualTick, forward: near ? 1 : -1,
        charge: near ? charge : .68, preparing, swing: impact ? swingPhase : 1, lead, wing: impact?.wing ?? (near ? preview?.wing ?? (anticipation ? expectedWing : rally.lastWing) : readySwing),
        kind: impact?.kind ?? (toss !== null ? 'serve' : near ? preview?.kind ?? (guide?.volley ? 'volley' : guide?.stretched ? 'reach' : 'ground') : opponentAtNet ? 'volley' : 'ground'), impact,
        slot: anticipation && toss === null ? Math.max(0, (anticipation - .66) / .34) * (preparing ? .72 : .54) : opponentAtNet ? .55 : 0,
        anticipation, tracking: rally.phase === 'rally' ? ball : undefined, toss, motion: kits[side].motion, reaction: winner && !reducedMotion.matches ? { won: winner === side, age: outcome } : null });
      drawAthlete(pose, runner, kits[side], near, near ? guide : null, preparing, charge, near ? preview?.limit ?? contactPowerLimit(rally,guide) ?? 1 : 1);
    };
    renderAthlete('opponent', opponent);
    if (ball.y >= 0) drawBall(ball, rally.phase === 'rally');
    if (rally.hitter === 'opponent') drawImpact(rally, swing * 1.38);
    if (showNetStop && outcome < .72 && !reducedMotion.matches) {
      const impactX = project(rally.ball.x,0).x;
      const wave = 4 * Math.sin(outcome * 29) * Math.exp(-7 * outcome);
      const band = Math.max(2, Math.round(pixelRatio * 6));
      for (let left = 0; left < netLayer.width; left += band) {
        const size = Math.min(band,netLayer.width-left);
        const offset = wave * Math.exp(-Math.abs(left/pixelRatio-impactX) / 40);
        ctx.drawImage(netLayer,left,0,size,netLayer.height,left/pixelRatio,netY+offset,size/pixelRatio,netLayer.height/pixelRatio);
      }
    } else ctx.drawImage(netLayer, 0, netY, width, netLayer.height / pixelRatio);
    if (guide && rally.service?.phase !== 'toss') drawContact(guide);
    renderAthlete('player', player);
    if (ball.y < 0) drawBall(ball, rally.phase === 'rally', guide?.state === 'ready' ? guide.stretched ? '#ffca89' : strikeCue : undefined);
    if (rally.hitter === 'player') drawImpact(rally, swing * 1.38);
  }

  return { draw, resize, groundAt, followReplay, portrait: athletes.portrait };
}
