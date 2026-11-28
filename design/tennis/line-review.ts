import { HALF_LENGTH, HALF_WIDTH, SERVICE_LINE } from './physics';
import type { Ball, Bounce, Rally } from './physics';

export function lineReview(mark: Bounce, service: Rally['service']) {
  const side = mark.hitter === 'player' ? 1 : -1;
  const depth = service ? SERVICE_LINE : HALF_LENGTH;
  const xMin = service?.turn.side === -1 ? 0 : -HALF_WIDTH;
  const xMax = service?.turn.side === 1 ? 0 : HALF_WIDTH;
  const x = Math.max(xMin, Math.min(xMax, mark.x));
  const y = side * Math.max(0, Math.min(depth, mark.y * side));
  return { x, y, xMin, xMax, side, depth, distance: Math.hypot(mark.x-x, mark.y-y),
    lateral: Math.abs(mark.x-x) > Math.abs(mark.y-y) };
}

// The net absorbs the drive. The ball drops on the hitter's side and skips once.
export function netDrop(ball: Ball, elapsed: number): Ball {
  const t = Math.max(0, elapsed);
  const fall = Math.sqrt(2 * Math.max(0,ball.z) / 9.81);
  const rebound = 9.81 * fall * .28;
  const after = Math.min(Math.max(0,t-fall), 2 * rebound / 9.81);
  const travel = (1 - Math.exp(-3.8*t)) / 3.8;
  return { ...ball, x: ball.x + ball.vx * .10 * travel,
    y: ball.y - Math.sign(ball.vy) * Math.min(3.2,Math.abs(ball.vy) * .16) * travel,
    z: t < fall ? ball.z - 4.905*t*t : Math.max(0,rebound*after - 4.905*after*after) };
}

// Two decaying hops followed by a roll that comes to rest on the ground.
export function deadBall(ball: Ball, time: number): Ball {
  let remaining = Math.max(0,time), speed = .48, travel = 0;
  let vertical = Math.max(1.65, Math.min(3.65, -ball.vz * .58));
  for (let hop = 0; hop < 2; hop++) {
    const duration = 2 * vertical / 9.81;
    const t = Math.min(duration, remaining);
    travel += speed * t;
    remaining -= t;
    if (t < duration) return { ...ball, x: ball.x+ball.vx*travel, y: ball.y+ball.vy*travel, z: vertical*t-4.905*t*t };
    vertical *= .46;
    speed *= .52;
  }
  const roll = Math.min(.56, remaining);
  travel += speed * (roll - roll * roll / 1.12);
  return { ...ball, x: ball.x+ball.vx*travel, y: ball.y+ball.vy*travel, z: 0 };
}

export function drawReview(canvas: HTMLCanvasElement, mark: Bounce, service: Rally['service'], progress: number, velocity: Ball) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const call = lineReview(mark, service);
  const scale = Math.min(560, 162 / Math.max(.05,call.distance));
  const X = (x: number) => 220 + (x-(mark.x+call.x)/2)*scale;
  const Y = (y: number) => 85 - (y-(mark.y+call.y)/2)*scale*.65;
  ctx.fillStyle='#673724'; ctx.fillRect(0,0,440,170);
  const top = Y(Math.max(0,call.side*call.depth));
  const w = (call.xMax-call.xMin)*scale, h = call.depth*scale*.65;
  ctx.fillStyle='#a85a36'; ctx.fillRect(X(call.xMin),top,w,h);
  ctx.strokeStyle='#f4e5c5'; ctx.lineWidth=Math.max(2,.05*scale);
  ctx.strokeRect(X(call.xMin)+ctx.lineWidth/2,top+ctx.lineWidth/2,w-ctx.lineWidth,h-ctx.lineWidth);
  ctx.strokeStyle='#ffdf81'; ctx.lineWidth=2; ctx.setLineDash([4,3]); ctx.beginPath();
  ctx.moveTo(X(call.x),Y(call.y)); ctx.lineTo(X(mark.x),Y(mark.y)); ctx.stroke(); ctx.setLineDash([]);
  const approach = Math.max(0, Math.min(1, (progress - .32) / .32));
  const dx = velocity.vx, dy = -velocity.vy * .65;
  const length = Math.max(.01, Math.hypot(dx, dy));
  const reach = 86;
  const sx = X(mark.x) - dx / length * reach, sy = Y(mark.y) - dy / length * reach;
  const bx = sx + dx / length * reach * approach, by = sy + dy / length * reach * approach;
  ctx.beginPath(); ctx.moveTo(sx,sy); ctx.lineTo(bx,by); ctx.strokeStyle='#f9d486aa'; ctx.stroke();
  if (approach < 1) {
    ctx.beginPath(); ctx.arc(bx,by,5,0,Math.PI*2); ctx.fillStyle='#fff292'; ctx.fill(); return;
  }
  ctx.beginPath(); ctx.ellipse(X(mark.x),Y(mark.y),Math.max(3,.0335*scale),Math.max(2,.022*scale),0,0,2*Math.PI);
  ctx.fillStyle='#51271c'; ctx.fill(); ctx.strokeStyle='#ffcc78'; ctx.stroke();
  const radius=8+14*(1-progress); ctx.beginPath(); ctx.arc(X(mark.x),Y(mark.y),radius,0,Math.PI*2);
  ctx.strokeStyle='#ffdc7b'; ctx.stroke();
}
