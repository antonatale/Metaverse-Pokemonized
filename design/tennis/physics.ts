import type { ServiceTurn, Side } from './match';
import type { Tactic } from './roster';

export const STEP = 1 / 60;
export const HALF_WIDTH = 8.23 / 2;
export const HALF_LENGTH = 23.77 / 2;
export const DOUBLES_WIDTH = 10.97 / 2;
export const SERVICE_LINE = 6.4;
export const PRACTICE_SPEED = 0.65;

const GRAVITY = 9.81;
// Scale the flight clock alone, preserving the shot arc and the manual footwork clock.
const STROKE_CLOCK = .83;
export const ballGravity = (ball: Ball) => GRAVITY * (ball.clock ?? 1) ** 2;
const BALL_RADIUS = 0.0335;
const LINE_EPSILON = 0.000001;
const CLAY = { rebound: 0.68, pace: 0.78 };
const PLAYER_MOTION = { speed: 4.22, acceleration: 21, braking: 18 };
const DIFFICULTIES = {
  easy: { speed: 3.32, acceleration: 17, braking: 20, reaction: 30, recovery: { x: -1.42, y: 9.1 }, pace: 1.49, depth: 9.25, angle: 2.85 },
  normal: { speed: 3.93, acceleration: 21, braking: 24, reaction: 22, recovery: { x: -0.78, y: 9.35 }, pace: 1.37, depth: 9.85, angle: 3.05 },
  hard: { speed: 4.62, acceleration: 24, braking: 30, reaction: 18, recovery: { x: -0.35, y: 8.82 }, pace: 1.25, depth: 10.55, angle: 3.36 },
};
const REACH = 1.28;
const PLAYER_REACH = { lateral: 1.78, depth: 2.30, minHeight: 0.15, maxHeight: 2.14 };
const RELEASE_BUFFER = 10;
// Tick-aligned gates keep the power meter and the release on the same simulation frame.
const GROUND_CHARGE = 27;
const SERVE_CHARGE = 24;
export const MAX_CHARGE = 1;

export type Difficulty = keyof typeof DIFFICULTIES;
export type Feed = 'center' | 'backhand' | 'wide' | 'short' | 'volley';
export type Phase = 'ready' | 'rally' | 'finished';
export type Hitter = 'feed' | 'player' | 'opponent';
export type Shot = 'Incrociato' | 'Centro' | 'Lungolinea';
export type Wing = 'Diritto' | 'Rovescio';
export type StrokeKind = 'ground' | 'volley' | 'halfVolley' | 'serve' | 'lob' | 'drop' | 'slice' | 'reach';
export type Point = { x: number; y: number };
export type Technique = 'cut' | 'lob';
export type Aim = 'timing' | number | { swipe: Point; technique?: Technique };
export type Ball = Point & { z: number; vx: number; vy: number; vz: number; clock?: number; kick?: number; backspin?: true | 'slice' };
export type Runner = Point & { vx: number; vy: number; stride?: number; plant?: number };
type Impact = Point & { z: number; charge: number; kind: StrokeKind; wing: Wing };
type Swing = { started: number; readyAt: number; result: 'swinging' | 'miss' | 'hit'; spot: Impact };
type Slide = { from: Point; to: Point; tick: number; side: Side };
export type Command = Point & { pressed: boolean; released: boolean; aim: Aim; destination?: Point };
export type Bounce = Point & { hitter: Hitter; inCourt: boolean; first: boolean; stroke: number };
export type ContactGuide = {
  state: 'wait' | 'ready' | 'away' | 'late';
  point: Ball;
  seconds: number;
  volley?: true;
  stretched?: boolean;
};
type FlightFault = 'Rete' | 'Larga' | 'Lunga';
type Fault = FlightFault | 'Doppio rimbalzo' | 'Doppio fallo';
export type TennisEvent =
  | { type: 'hit'; hitter: 'player'; shot: Shot; wing: Wing; charge: number; speed: number; kind: StrokeKind; target: Point }
  | { type: 'hit'; hitter: 'opponent'; kind: StrokeKind }
  | { type: 'bounce'; mark: Bounce; shot?: Shot }
  | { type: 'miss'; reason: 'early' | 'late' | 'reach' }
  | { type: 'service'; result: 'in' | 'let' | 'fault'; reason?: FlightFault; turn: ServiceTurn }
  | { type: 'point'; winner: Side; reason: Fault; hitter: Hitter };

type Service = { turn: ServiceTurn; phase: 'toss' | 'flight'; started: number; net: boolean };

export type Rally = {
  feed: Feed;
  difficulty: Difficulty;
  tactic: Tactic;
  match: boolean;
  service: Service | null;
  phase: Phase;
  tick: number;
  player: Runner;
  opponent: Runner;
  ball: Ball;
  hitter: Hitter;
  bounces: number;
  strokes: number;
  marks: Bounce[];
  preparation: { started: number } | null;
  pending: { expires: number; charge: number; aim: Aim } | null;
  opponentPlan: Point | null;
  reactionUntil: number;
  strikeTick: number;
  impact: Impact | null;
  swing: Swing | null;
  queuedTap: Aim | null;
  slides: Slide[];
  lastWing: Wing;
  attacking?: boolean;
  serviceDrill?: boolean;
  serveTarget?: Point & { name: string; radius: number };
  wrongFoot?: boolean;
  netStop?: boolean;
  shot: Shot | null;
};

const FEEDS = {
  center: { bounce: { x: 0.47, y: -8.15 }, seconds: 1.63 },
  backhand: { bounce: { x: -0.56, y: -8.15 }, seconds: 1.63 },
  wide: { bounce: { x: 2.58, y: -8.66 }, seconds: 1.55 },
  volley: { bounce: { x: 1.46, y: -7.45 }, seconds: 1.27 },
  short: { bounce: { x: 0.63, y: -5.15 }, seconds: 1.60 },
} satisfies Record<Feed, { bounce: Point; seconds: number }>;

const FEED_ORIGIN = { x: -0.9, y: 9.6, z: 1.42 };
const TOSS_OPEN = 28;
const TOSS_CLOSE = 53;
const TOSS_END = 65;
const PLAYER_LIMITS = { x: 6.22, minY: -14.06, maxY: -0.9 };
export const netHeight = (x: number): number => 0.914 + 0.156 * Math.min(1, Math.abs(x) / (DOUBLES_WIDTH + 0.65));
const clamp = (n: number, low: number, high: number): number => Math.max(low, Math.min(n, high));

function launch(from: Point & { z: number }, to: Point, seconds: number): Ball {
  return {
    x: from.x, y: from.y, z: from.z,
    vx: (to.x - from.x) / seconds,
    vy: (to.y - from.y) / seconds,
    vz: (GRAVITY * seconds * seconds / 2 - from.z) / seconds,
  };
}

export function createRally(feed: Feed, phase: 'ready' | 'rally' = 'ready', difficulty: Difficulty = 'easy', tactic: Tactic = 'neutral', volleySide: 1 | -1 = 1): Rally {
  const preset = FEEDS[feed];
  const side = feed === 'volley' ? volleySide : 1;
  const origin = { ...FEED_ORIGIN, x: FEED_ORIGIN.x * side };
  const ball = launch(origin, { ...preset.bounce, x: preset.bounce.x * side }, preset.seconds);
  return {
    feed, phase, difficulty, tactic, match: false, service: null, tick: 0, player: { x: feed === 'volley' ? 0 : .32, y: feed === 'volley' ? -3.8 : -10.65, vx: 0, vy: 0 },
    opponent: { x: origin.x, y: origin.y, vx: 0, vy: 0 },
    ball,
    hitter: 'feed', bounces: 0, strokes: 0, marks: [], preparation: null, pending: null,
    opponentPlan: null, reactionUntil: 0, strikeTick: -60, impact: null, swing: null, queuedTap: null, slides: [], lastWing: 'Diritto', shot: null,
  };
}

export function practiceTarget(turn: ServiceTurn, completed: number) {
  const zones = [
    { name: 'T', x: .62, y: 5.72 },
    { name: 'Corpo', x: 2.05, y: 4.78 },
    { name: 'Esterno', x: 3.48, y: 5.35 },
  ];
  const zone = zones[completed % zones.length];
  return { name: zone.name, x: -turn.side * zone.x, y: zone.y, radius: .62 };
}

export function createService(turn: ServiceTurn, difficulty: Difficulty, tactic: Tactic, phase: 'ready' | 'rally' = 'ready'): Rally {
  const rally = createRally('center', phase, difficulty, tactic);
  const servingNear = turn.server === 'player';
  const server = { x: turn.side * 2.05, y: servingNear ? -12.46 : 12.46, vx: 0, vy: 0 };
  const receiver = { x: -turn.side * 2.18, y: servingNear ? 8.35 : -8.35, vx: 0, vy: 0 };
  rally.player = servingNear ? server : receiver;
  rally.opponent = servingNear ? receiver : server;
  rally.service = { turn, phase: 'toss', started: 0, net: false };
  rally.match = true;
  rally.hitter = turn.server;
  rally.ball = tossedBall(rally, rally.service, 0);
  return rally;
}

function tossedBall(rally: Rally, service: Service, age: number): Ball {
  const server = rally[service.turn.server];
  const forward = service.turn.server === 'player' ? 1 : -1;
  return along({ x: server.x - forward * .16, y: server.y + forward * .35, z: 1.25,
    vx: forward * .79, vy: forward * .26, vz: 5.25 }, clamp(age, 0, TOSS_END + 3) * STEP);
}

export function clearPreparation(rally: Rally): void {
  rally.preparation = null;
  rally.pending = null;
  rally.queuedTap = null;
}

function reachAt(ball: Point & { z: number }, player: Point): 'clean' | 'stretch' | null {
  if (ball.z < .11 || ball.z > PLAYER_REACH.maxHeight) return null;
  const dx = ball.x - player.x;
  const ahead = ball.y - player.y;
  if (ball.z >= PLAYER_REACH.minHeight && Math.hypot(dx / PLAYER_REACH.lateral, ahead / PLAYER_REACH.depth) <= 1) {
    return ahead < -1.58 || Math.abs(dx) > 1.52 ? 'stretch' : 'clean';
  }
  // A low, wide or trailing ball can still be lifted with a single outstretched arm.
  return (ahead < 0 || Math.abs(dx) > 1.18) && ball.z < 1.76 &&
    Math.hypot(dx / 2.30, ahead / 2.78) <= 1 ? 'stretch' : null;
}

export function recoveryTicks(rally: Rally): number {
  return Math.max(0, (rally.swing?.readyAt ?? 0) - rally.tick);
}

export function canHit(rally: Rally, hitter: 'player' | 'opponent' = 'player'): boolean {
  if (rally.phase !== 'rally' || (hitter === 'player' && recoveryTicks(rally) > 0 && !rally.pending)) return false;
  if (rally.service?.phase === 'toss') {
    const age = rally.tick - rally.service.started;
    return hitter === rally.service.turn.server && age >= TOSS_OPEN && age <= TOSS_CLOSE;
  }
  if (rally.serviceDrill && hitter === 'opponent') return false;
  if (rally.hitter === hitter || (rally.bounces !== 1 && !canVolley(rally, rally.ball, hitter))) return false;
  const { ball } = rally;
  if (hitter === 'player') return !!reachAt(ball, rally.player);
  const dx = ball.x - rally.opponent.x, dy = ball.y - rally.opponent.y;
  const passing = dx * (ball.vx-rally.opponent.vx) + dy * (ball.vy-rally.opponent.vy) > 0;
  return ball.z >= .19 && ball.z <= 1.75 && (Math.hypot(dx,dy) <= REACH ||
    (rally.bounces === 1 && passing && Math.hypot(dx / 1.95,dy / 1.70) <= 1));
}

function canVolley(rally: Rally, ball: Ball, hitter: Side): boolean {
  if (rally.service || rally.bounces !== 0) return false;
  const forward = hitter === 'player' ? 1 : -1;
  const ahead = (ball.y - rally[hitter].y) * forward;
  if (ahead < -.23 || Math.hypot((ball.x-rally[hitter].x)/1.25,(ahead-.26)/1.10) > 1) return false;
  return hitter === 'player' ? rally.player.y >= -SERVICE_LINE && ball.y < 0 && ball.vy < 0
    : rally.match && (rally.tactic === 'net' || !!rally.attacking) && rally.opponent.y < 5.9 && ball.y > 0 && ball.vy > 0;
}

function move(runner: Runner, command: Point, far: boolean, motion: typeof PLAYER_MOTION): void {
  const { speed, acceleration, braking } = motion;
  const magnitude = Math.max(1, Math.hypot(command.x, command.y));
  const desiredX = command.x * speed / magnitude;
  const desiredY = command.y * speed / magnitude;
  const deltaX = desiredX - runner.vx;
  const deltaY = desiredY - runner.vy;
  const current = Math.hypot(runner.vx, runner.vy);
  const demand = Math.hypot(desiredX, desiredY);
  const alignment = demand && current ? (runner.vx * desiredX + runner.vy * desiredY) / (current * demand) : 1;
  const skid = clamp((.68 - alignment) / 1.68, 0, 1) * clamp((current - .9) / 2.5, 0, 1);
  const traction = deltaX * desiredX + deltaY * desiredY > 0 ? acceleration : braking;
  const cap = traction * (1 - skid * .72) * STEP;
  if (skid > 0 || runner.plant) runner.plant = Math.max(skid, (runner.plant ?? 0) - STEP * 3.6);
  const blend = Math.min(1, cap / Math.max(0.00001, Math.hypot(deltaX, deltaY)));
  runner.vx += deltaX * blend;
  runner.vy += deltaY * blend;
  const x = runner.x + runner.vx * STEP;
  const y = runner.y + runner.vy * STEP;
  runner.x = clamp(x, -PLAYER_LIMITS.x, PLAYER_LIMITS.x);
  runner.y = clamp(y, far ? 0.9 : PLAYER_LIMITS.minY, far ? 13.65 : PLAYER_LIMITS.maxY);
  if (runner.x !== x) runner.vx = 0;
  if (runner.y !== y) runner.vy = 0;
  const pace = Math.hypot(runner.vx, runner.vy);
  if (pace > .015) runner.stride = (runner.stride ?? 0) + pace * STEP / (1.12 + pace * .235);

}

export function playerDestination(target: Point): Point {
  return { x: clamp(target.x, -PLAYER_LIMITS.x, PLAYER_LIMITS.x), y: clamp(target.y, PLAYER_LIMITS.minY, PLAYER_LIMITS.maxY) };
}

function playerCommand(player: Runner, command: Command): Point {
  if (!command.destination || command.x || command.y) return command;
  const goal = playerDestination(command.destination);
  // Slow down proportionally near the cursor so the player settles without overshooting it.
  return { x: (goal.x - player.x) * 3.5, y: (goal.y - player.y) * 3.5 };
}

function along(ball: Ball, dt: number): Ball {
  return {
    ...ball,
    x: ball.x + ball.vx * dt,
    y: ball.y + ball.vy * dt,
    z: ball.z + ball.vz * dt - ballGravity(ball) * dt * dt / 2,
    vz: ball.vz - ballGravity(ball) * dt,
  };
}

function untilGround(ball: Ball): number {
  return (ball.vz + Math.sqrt(ball.vz * ball.vz + 2 * ballGravity(ball) * Math.max(0, ball.z))) / ballGravity(ball);
}

function rebound(ball: Ball): Ball {
  if (ball.kick) {
    return { ...ball, kick: undefined, z: 0, vx: ball.vx * .74 + ball.kick, vy: ball.vy * .74, vz: -ball.vz * .83 };
  }
  if (ball.backspin === 'slice') {
    return { ...ball, z: 0, vx: ball.vx * .83, vy: ball.vy * .83, vz: -ball.vz * .47 };
  }
  if (ball.backspin) {
    return { ...ball, z: 0, vx: ball.vx * .50, vy: ball.vy * .50, vz: -ball.vz * .48 };
  }
  return { ...ball, z: 0, vx: ball.vx * CLAY.pace, vy: ball.vy * CLAY.pace, vz: -ball.vz * CLAY.rebound };
}

function inside(point: Point, far: boolean): boolean {
  return Math.abs(point.x) <= HALF_WIDTH + LINE_EPSILON && Math.abs(point.y) <= HALF_LENGTH + LINE_EPSILON &&
    (far ? point.y >= 0 : point.y <= 0);
}

export function contactGuide(rally: Rally): ContactGuide | null {
  const { ball, player, bounces } = rally;
  if (rally.phase !== 'rally' || (recoveryTicks(rally) && !rally.pending)) return null;
  const service = rally.service;
  if (service?.phase === 'toss') {
    if (service.turn.server !== 'player') return null;
    const age = rally.tick - service.started;
    if (age > TOSS_CLOSE) return { state: 'late', point: ball, seconds: 0 };
    if (age >= TOSS_OPEN) return { state: 'ready', point: ball, seconds: (TOSS_CLOSE + 1 - age) * STEP };
    return { state: 'wait', point: tossedBall(rally, service, TOSS_OPEN), seconds: (TOSS_OPEN - age) * STEP };
  }
  if (rally.hitter === 'player' || ball.vy >= 0) return null;
  const delay = bounces ? 0 : untilGround(ball);
  if (!bounces && !service && player.y >= -SERVICE_LINE) {
    let first = -1;
    for (let time = 0; time < delay; time += STEP) {
      const point = along(ball, time);
      if (canVolley(rally, point, 'player') && reachAt(point, player)) {
        if (first < 0) first = time;
      } else if (first >= 0) {
        return first === 0 ? { state: 'ready', point: ball, seconds: time, volley: true }
          : { state: 'wait', point: along(ball, first), seconds: first, volley: true };
      }
    }
    if (first >= 0) return first === 0 ? { state: 'ready', point: ball, seconds: delay, volley: true }
      : { state: 'wait', point: along(ball, first), seconds: first, volley: true };
  }
  const landing = along(ball, delay);
  if (!bounces && !(service ? inServiceBox(landing, service.turn) : inside(landing, false))) return null;
  const incoming = bounces ? ball : rebound(landing);
  const duration = untilGround(incoming);
  const ready = canHit(rally);
  let first = ready ? 0 : -1;
  let last = first;
  for (let time = ready ? STEP : 0; time < duration; time += STEP) {
    if (reachAt(along(incoming, time), player)) {
      if (first < 0) first = time;
      last = time;
    } else if (first >= 0) break;
  }
  if (ready) return { state: 'ready', point: ball, seconds: last + STEP, stretched: reachAt(ball, player) === 'stretch' };
  if (first >= 0) return { state: 'wait', point: along(incoming, (first + last) / 2), seconds: delay + first };
  // Show a playable position on the trajectory at roughly the player's depth.
  const ideal = clamp((player.y - incoming.y) / incoming.vy, duration * 0.30, duration * 0.72);
  if (bounces) {
    const bounce = rally.marks[rally.marks.length - 1];
    const sinceBounce = bounce ? (ball.y - bounce.y) / ball.vy : 0;
    for (let time = STEP; time <= sinceBounce; time += STEP) {
      if (reachAt(along(ball, -time), player)) return { state: 'late', point: ball, seconds: 0 };
    }
  }
  return { state: 'away', point: along(incoming, ideal), seconds: delay + ideal };
}

export function inServiceBox(point: Point, turn: ServiceTurn): boolean {
  return inside(point, turn.server === 'player') && point.x * turn.side <= LINE_EPSILON && Math.abs(point.y) <= SERVICE_LINE + LINE_EPSILON;
}

function stopService(rally: Rally, service: Service, events: TennisEvent[], reason?: FlightFault): void {
  rally.phase = 'finished';
  clearPreparation(rally);
  events.push({ type: 'service', result: reason ? 'fault' : 'let', reason, turn: service.turn });
  if (reason && service.turn.attempt === 2) {
    const winner = service.turn.server === 'player' ? 'opponent' : 'player';
    events.push({ type: 'point', winner, reason: 'Doppio fallo', hitter: service.turn.server });
  }
}

function finish(rally: Rally, reason: Fault, events: TennisEvent[]): void {
  const successful = reason === 'Doppio rimbalzo';
  const winner = (rally.hitter === 'player') === successful ? 'player' : 'opponent';
  rally.phase = 'finished';
  clearPreparation(rally);
  events.push({ type: 'point', winner, reason, hitter: rally.hitter });
}

function moveBall(rally: Rally, events: TennisEvent[]): void {
  const service = rally.service;
  let remaining = STEP;
  while (remaining > 0 && rally.phase === 'rally') {
    const groundTime = untilGround(rally.ball);
    const netTime = -rally.ball.y / rally.ball.vy;
    if (netTime > 0 && netTime <= Math.min(remaining, groundTime)) {
      const netBall = along(rally.ball, netTime);
      const tape = netHeight(netBall.x);
      if (Math.abs(netBall.x) <= DOUBLES_WIDTH + 0.65 && netBall.z < tape + BALL_RADIUS) {
        if (service && netBall.z >= tape - 0.035) service.net = true;
        else {
          rally.ball = netBall;
          rally.netStop = true;
          if (service) stopService(rally, service, events, 'Rete');
          else finish(rally, 'Rete', events);
          return;
        }
      }
    }
    if (groundTime > remaining) {
      rally.ball = along(rally.ball, remaining);
      return;
    }
    const contact = along(rally.ball, groundTime);
    rally.bounces++;
    const first = rally.bounces === 1;
    const inCourt = service && first ? inServiceBox(contact, service.turn) : inside(contact, rally.hitter === 'player');
    const mark = { x: contact.x, y: contact.y, hitter: rally.hitter, inCourt, first, stroke: rally.strokes };
    rally.marks.push(mark);
    events.push({ type: 'bounce', mark, shot: rally.hitter === 'player' && first ? rally.shot ?? undefined : undefined });
    if (service && first) {
      if (!inCourt) stopService(rally, service, events, Math.abs(contact.x) > HALF_WIDTH || contact.x * service.turn.side > 0 ? 'Larga' : 'Lunga');
      else if (service.net) stopService(rally, service, events);
      else {
        rally.service = null;
        events.push({ type: 'service', result: 'in', turn: service.turn });
      }
    } else if (first && !inCourt) finish(rally, Math.abs(contact.x) > HALF_WIDTH ? 'Larga' : 'Lunga', events);
    if (!first) {
      if (rally.serviceDrill) rally.phase = 'finished';
      else finish(rally, 'Doppio rimbalzo', events);
    }
    rally.ball = rally.phase === 'rally' ? rebound(contact) : { ...contact, z: 0 };
    remaining -= groundTime;
  }
}

function intercept(rally: Rally): Point | null {
  const { ball, opponent } = rally;
  const profile = DIFFICULTIES[rally.difficulty];
  const first = untilGround(ball);
  const landing = along(ball, first);
  if (!inside(landing, true)) return null;
  if (rally.match && !rally.service && (rally.tactic === 'net' || !!rally.attacking)) {
    for (let time = Math.max(.12, -ball.y / ball.vy + .09); time < first; time += STEP * 2) {
      const point = along(ball, time);
      const available = Math.max(0, time - profile.reaction * STEP);
      if (point.y > 4.8) break;
      if (point.z >= .35 && point.z <= 1.63 && Math.hypot(opponent.x - point.x, opponent.y - point.y) <= profile.speed * available + .6) return point;
    }
  }
  const bounced = rebound(landing);
  const limit = Math.min(0.57, untilGround(bounced));
  let fallback = landing;
  for (let time = 0.11; time < limit; time += STEP) {
    const point = along(bounced, time);
    if (Math.abs(point.x) > 6.25 || point.y > 13.65) break;
    fallback = point;
    const available = Math.max(0, first + time - profile.reaction * STEP - 0.12);
    if (Math.hypot(opponent.x - point.x, opponent.y - point.y) <= profile.speed * available + REACH * 0.6) return point;
  }
  return fallback;
}

function chase(rally: Rally): void {
  const { opponent, opponentPlan } = rally;
  const profile = DIFFICULTIES[rally.difficulty];
  const incoming = rally.hitter === 'player';
  const recovery = rally.attacking ? { x: rally.player.x * -.22, y: 5.55 } : rally.tactic === 'net' ? { x: 0, y: 4.35 } : rally.tactic === 'baseline' ? { x: 0, y: 10.58 }
    : rally.tactic === 'counter' ? { x: .38, y: profile.recovery.y } : profile.recovery;
  const goal = incoming ? opponentPlan ?? opponent : recovery;
  const reacts = !incoming || rally.tick >= rally.reactionUntil;
  const command = reacts ? { x: (goal.x - opponent.x) * 1.55, y: (goal.y - opponent.y) * 1.55 } : { x: 0, y: 0 };
  const recovering = !incoming && rally.impact?.kind === 'reach' && rally.tick - rally.strikeTick < 32;
  move(opponent, command, true, recovering ? { ...profile, acceleration: 6, braking: 6 } : profile);
}

export function preparationPower(rally: Rally): number {
  if (!rally.preparation) return 0;
  const ticks = Math.max(0, rally.tick - rally.preparation.started);
  const gate = rally.service?.phase === 'toss' ? SERVE_CHARGE : GROUND_CHARGE;
  return clamp(ticks / gate, 0, 1);
}

function shotAngle(aim: Aim, ahead: number, side: number): number {
  if (typeof aim === 'object') return clamp(aim.swipe.x, -1, 1) * side;
  if (aim !== 'timing') return clamp(aim, -1, 1);
  const offset = 0.16 - ahead;
  return Math.sign(offset) * clamp((Math.abs(offset) - 0.24) / 0.98, 0, 1);
}

export function shotName(angle: number): Shot {
  return angle < -0.23 ? 'Incrociato' : angle > 0.23 ? 'Lungolinea' : 'Centro';
}

export function contactWindow(rally: Rally, aim: Aim = 'timing'): Shot | null {
  const { ball, player } = rally;
  return canHit(rally) ? shotName(shotAngle(aim, ball.y - player.y, contactSide(ball.x, player.x))) : null;
}

function contactSide(ballX: number, playerX: number): number {
  return Math.abs(ballX) > 0.22 ? Math.sign(ballX) : ballX < playerX - 0.10 ? -1 : 1;
}

function clearNetTime(ball: Point & { z: number }, target: Point, seconds: number): number {
  const fraction = clamp(-ball.y / (target.y - ball.y), 0.0001, 0.9999);
  const height = netHeight(ball.x + (target.x - ball.x) * fraction) + BALL_RADIUS + 0.065;
  const rise = Math.max(0, height - ball.z * (1 - fraction));
  return Math.max(seconds, Math.sqrt(2 * rise / (GRAVITY * fraction * (1 - fraction))));
}

function serveLimit(height: number, first: boolean): number {
  return clamp(.71 + (height - 2.05) * .64 + (first ? 0 : .08), .57, 1);
}

function rallyPowerLimit(rally: Rally, ball: Point & { z: number }): number {
  const { player, ball: incoming } = rally;
  const pace = clamp((Math.hypot(incoming.vx, incoming.vy) - 9) / 18, 0, 1);
  const angle = clamp(Math.abs(incoming.vx) / 7, 0, 1);
  const deep = clamp((-ball.y - 9.8) / 3, 0, 1);
  const late = clamp((player.y - ball.y - .25) / 1.6, 0, 1);
  const sprint = clamp((Math.hypot(player.vx, player.vy) - 1.1) / 3.7, 0, 1);
  const extension = clamp((Math.hypot(ball.x - player.x, ball.y - player.y) - .8) / 1.32, 0, 1);
  const lunging = reachAt(ball, player) === 'stretch';
  return clamp(1.25 - pace * .29 - angle * .13 - deep * .13 - late * .20
    - sprint * .13 - extension * .23 - (lunging ? .19 : 0), .30, 1);
}

export function contactPowerLimit(rally: Rally, guide: ContactGuide | null): number | null {
  if (!guide || guide.state === 'away' || guide.state === 'late') return null;
  return rally.service?.phase === 'toss' ? serveLimit(guide.point.z, rally.service.turn.attempt === 1)
    : rallyPowerLimit(rally, guide.point);
}

function serveStroke(ball: Point & { z: number }, turn: ServiceTurn, aim: Aim, charge: number) {
  const power = Math.min(charge, 1);
  const swipe = typeof aim === 'object' ? aim.swipe : null;
  const angle = clamp(swipe ? swipe.x * -turn.side : typeof aim === 'number' ? -aim : 0, -1, 1);
  const depth = swipe ? clamp(swipe.y, -1, 1) : 0;
  const first = turn.attempt === 1;
  const target = { x: -turn.side * (1.98 + angle * 1.72) + (swipe ? (swipe.x - clamp(swipe.x,-1,1)) * 4 : 0),
    y: (turn.server === 'player' ? 1 : -1) * ((first ? 4.7 : 4.35) + depth * 1.53 + (swipe ? Math.max(0,swipe.y-1) * 5 : 0)) };
  // A falling toss costs clearance. A second serve trades pace for a larger margin.
  const limit = serveLimit(ball.z, first);
  return { shot: shotName(angle), wing: 'Diritto' as Wing, angle, charge, target, limit,
    seconds: clearNetTime(ball, target, first ? 1.46 - power * .99 : 1.54 - power * .83), kind: 'serve' as const };
}

function strokeTo(rally: Rally, ball: Point & { z: number }, aim: Aim, charge: number, kind: StrokeKind = 'ground') {
  const { player } = rally;
  const wing: Wing = ball.x < player.x - 0.10 ? 'Rovescio' : 'Diritto';
  const side = contactSide(ball.x, player.x);
  const angle = shotAngle(aim, ball.y - player.y, side);
  const power = Math.min(charge, 1);

  const sprint = clamp((Math.hypot(player.vx, player.vy) - 1.1) / 3.7, 0, 1);
  const stretch = clamp((Math.hypot(ball.x - player.x, ball.y - player.y) - 0.8) / 1.32, 0, 1);
  const lateral = angle * side * (2.6 + power * 0.92) + player.vx * (0.12 * sprint + 0.07 * stretch);
  const swipe = typeof aim === 'object' ? aim.swipe : null;
  const softGesture = rally.match && kind === 'ground' && swipe && charge >= .12 && charge <= .45;
  const technique = typeof aim === 'object' ? aim.technique : undefined;
  const stretched = kind === 'ground' && reachAt(ball, player) === 'stretch';
  if (stretched) kind = 'reach';
  else if (technique === 'lob' || (softGesture && !technique && swipe.y > .84)) kind = 'lob';
  else if (technique === 'cut') kind = swipe && swipe.y < -.32 ? 'drop' : 'slice';
  else if (softGesture && swipe.y < -.84) kind = 'drop';
  else if (kind === 'ground' && rally.bounces === 1 && player.y >= -SERVICE_LINE && ball.z < .61 && rally.ball.vz > 0) kind = 'halfVolley';
  const neutralDepth = 6.6 + 3.4 * power;
  const depth = swipe ? clamp(swipe.y, -1, 1.35) : 0;
  const target = {
    x: swipe ? clamp(swipe.x,-1.35,1.35) * (HALF_WIDTH - .23) : clamp(lateral,-HALF_WIDTH+.08,HALF_WIDTH-.08),
    y: swipe ? neutralDepth + (depth < 0 ? neutralDepth - 2.9 : HALF_LENGTH - .25 - neutralDepth) * Math.min(1, depth)
      + Math.max(0, depth-1) * 5 : 4.7 + 6.85 * power,
  };
  let seconds = 2.35 - 1.52 * power;
  if (swipe) seconds *= clamp(Math.hypot(target.x - ball.x, target.y - ball.y) / 20, 0.62, 1.17);
  if (kind === 'ground') {
    // Drive the same target through a lower net crossing as racket speed increases.
    seconds = clearNetTime(ball, target, seconds * (.79 - .12 * power ** 1.7));
  }
  if (kind === 'volley' || kind === 'halfVolley') {
    const low = kind === 'halfVolley';
    const punch = clamp((ball.z - .70) / .95, 0, 1);
    if (depth <= 1) target.y = clamp(target.y, 2.35, low ? 6.7 + power : 6.1 + power * 3.4 + punch);
    const distance = Math.hypot(target.x - ball.x, target.y - ball.y);
    seconds = low ? 1.13 - .18 * power : distance / (12.8 + 10.6 * power + punch * 4);
  }
  if (kind === 'lob') seconds = 2.11;
  if (depth <= 1 && kind === 'lob') target.y = Math.max(target.y, 9.2 + power * 1.2);
  if (depth <= 1 && kind === 'drop') target.y = 2.35 + power * .85;
  if (kind === 'slice') seconds = 1.27 - .23 * power;
  if (kind === 'reach') {
    if (depth <= 1) target.y = Math.min(target.y, 7.5 + power * 1.9);
    seconds = Math.max(seconds, 1.68);
  }
  if (kind !== 'ground') seconds = clearNetTime(ball, target, seconds);
  const limit = rallyPowerLimit(rally, ball);
  return { shot: shotName(angle), wing, angle, charge, target, seconds, kind, limit };
}

// Excess pace closes the racket face. Solve the vertical velocity at the net
// while preserving the horizontal direction and speed of the intended shot.
function shotBall(from: Point & { z: number }, target: Point, seconds: number, excess: number) {
  const ball = launch(from,target,seconds);
  if (excess > 0) {
    const time = -ball.y / ball.vy;
    const height = netHeight(ball.x + ball.vx * time) - .05 - Math.min(.60, excess * 2);
    ball.vz = (height - ball.z) / time + GRAVITY * time / 2;
  }
  return ball;
}

export function previewStroke(rally: Rally, aim: Aim, guide = contactGuide(rally)) {
  const service = rally.service?.phase === 'toss' ? rally.service : null;
  if (rally.phase !== 'rally' || (rally.hitter === 'player' && !service) || (!rally.preparation && !rally.pending)) return null;
  if (!guide || guide.state === 'late') return null;
  const direction = rally.pending?.aim ?? aim;
  const charge = rally.pending?.charge ?? preparationPower(rally);
  const stroke = service ? serveStroke(guide.point, service.turn, direction, charge)
    : strokeTo(rally, guide.point, direction, charge, guide.volley ? 'volley' : 'ground');
  const excess = charge - stroke.limit;
  const ball = shotBall(guide.point, stroke.target, stroke.seconds, excess);
  const duration = excess > 0 ? -ball.y / ball.vy : stroke.seconds;
  const path = Array.from({ length: 17 }, (_, index) => along(ball, duration * (index + 2) / 18));
  const speed = Math.hypot(ball.vx, ball.vy, ball.vz) * strokeClock(stroke.kind, charge) * 3.6;
  return { ...stroke, path, speed, net: excess > 0 };
}

function strokeClock(kind: StrokeKind, charge: number): number {
  return STROKE_CLOCK + (kind === 'serve' ? .52 : .22) * charge ** 2;
}

function hit(rally: Rally, hitter: Side, target: Point, seconds: number, kind: StrokeKind, wing: Wing, charge: number, limit = 1): void {
  const { x, y, z } = rally.ball;
  if (kind === 'reach') {
    const runner = rally[hitter];
    const dx = x - runner.x, dy = y - runner.y;
    const distance = Math.max(.1, Math.hypot(dx, dy));
    // Commit weight toward contact; reversing now requires a braking step.
    runner.vx = runner.vx * .70 + 1.65 * dx / distance;
    runner.vy = runner.vy * .70 + 1.65 * dy / distance;
    runner.plant = .78;
  }
  rally.impact = { x, y, z, charge, kind, wing };
  rally.ball = shotBall(rally.ball, target, seconds, charge - limit);
  const clock = strokeClock(kind, charge);
  rally.ball.clock = clock;
  rally.ball.vx *= clock;
  rally.ball.vy *= clock;
  rally.ball.vz *= clock;
  if (kind === 'serve' && rally.service?.turn.attempt === 2) {
    rally.ball.kick = (hitter === 'player' ? 1 : -1) * (.45 + .48 * charge);
  }
  if (kind === 'drop') rally.ball.backspin = true;
  if (kind === 'slice' || kind === 'reach') rally.ball.backspin = 'slice';
  rally.hitter = hitter;
  rally.bounces = 0;
  rally.strokes++;
  rally.marks = rally.marks.filter((mark) => rally.strokes - mark.stroke < 2);
  rally.strikeTick = rally.tick;
}

function recoveryLength(kind: StrokeKind, power: number, moving: number): number {
  const base = kind === 'volley' || kind === 'drop' ? 14 : kind === 'halfVolley' ? 20 : kind === 'reach' ? 36 : kind === 'serve' ? 24 : 19;
  return base + Math.round(Math.min(1.25, power) * 4 + Math.min(1, moving / 6) * 3);
}

function startSwing(rally: Rally, aim: Aim, charge: number): void {
  const { player, ball } = rally;
  const toss = rally.service?.phase === 'toss' && rally.service.turn.server === 'player';
  const dx = clamp(ball.x - player.x, -1.03, 1.03);
  const spot = { x: player.x + dx, y: player.y + clamp(ball.y - player.y, -.40, .76), z: clamp(ball.z, .45, toss ? 2.35 : 1.63) };
  const stroke = toss ? serveStroke(spot, rally.service!.turn, aim, charge) : strokeTo(rally, spot, aim, charge);
  rally.swing = { started: rally.tick, readyAt: rally.tick + recoveryLength(stroke.kind, charge, Math.hypot(player.vx, player.vy)),
    result: 'swinging', spot: { ...spot, kind: stroke.kind, wing: stroke.wing, charge } };
  rally.pending = { charge, aim, expires: rally.tick + RELEASE_BUFFER };
}

function recordSlide(rally: Rally, side: Side): void {
  const runner = rally[side];
  if ((runner.plant ?? 0) < .43 || Math.hypot(runner.vx, runner.vy) < 1.8) return;
  const offset = runner.vx < 0 ? -.17 : .17;
  const to = { x: runner.x + offset, y: runner.y + .02 };
  let last: Slide | undefined;
  for (let index = rally.slides.length - 1; index >= 0; index--) {
    if (rally.slides[index].side === side) { last = rally.slides[index]; break; }
  }
  if (last && rally.tick - last.tick <= 2 && Math.hypot(to.x - last.to.x, to.y - last.to.y) < .25) {
    last.to = to;
    last.tick = rally.tick;
  } else {
    rally.slides.push({ from: { x: to.x - runner.vx * STEP, y: to.y - runner.vy * STEP }, to, tick: rally.tick, side });
    if (rally.slides.length > 12) rally.slides.shift();
  }
}

function tryPlayerHit(rally: Rally, events: TennisEvent[]): void {
  const pending = rally.pending;
  if (!pending) return;
  if (!canHit(rally)) return;
  const { charge, aim } = pending;
  const service = rally.service?.phase === 'toss' ? rally.service : null;
  const stroke = service ? serveStroke(rally.ball, service.turn, aim, charge)
    : strokeTo(rally, rally.ball, aim, charge, rally.bounces === 0 ? 'volley' : 'ground');
  if (service) service.phase = 'flight';
  hit(rally, 'player', stroke.target, stroke.seconds, stroke.kind, stroke.wing, charge, stroke.limit);
  rally.swing = { started: rally.tick, readyAt: rally.tick + recoveryLength(stroke.kind, charge, Math.hypot(rally.player.vx, rally.player.vy)),
    result: 'hit', spot: rally.impact! };
  rally.shot = stroke.shot;
  rally.lastWing = stroke.wing;
  rally.opponentPlan = intercept(rally);
  rally.reactionUntil = rally.tick + DIFFICULTIES[rally.difficulty].reaction;
  rally.pending = null;
  const { vx, vy, vz } = rally.ball;
  events.push({ type: 'hit', hitter: 'player', shot: stroke.shot, wing: stroke.wing, kind: stroke.kind, charge, speed: Math.hypot(vx, vy, vz) * 3.6, target: stroke.target });
}

function expireRelease(rally: Rally, events: TennisEvent[]): void {
  if (!rally.pending || rally.tick < rally.pending.expires) return;
  const guide = contactGuide(rally);
  const reason = guide?.state === 'late' ? 'late' : guide?.state === 'away' ? 'reach' : 'early';
  if (rally.swing) rally.swing.result = 'miss';
  events.push({ type: 'miss', reason });
  rally.pending = null;
}

function stepToss(rally: Rally, service: Service, command: Command, events: TennisEvent[]): void {
  const age = rally.tick - service.started;
  rally.ball = tossedBall(rally, service, age);
  if (service.turn.server === 'opponent') {
    move(rally.player, playerCommand(rally.player, command), false, PLAYER_MOTION);
    if (age === 43) {
      const power = (rally.difficulty === 'hard' ? .83 : rally.difficulty === 'normal' ? .65 : .42) + (rally.tactic === 'baseline' ? .06 : 0);
      const stroke = serveStroke(rally.ball, service.turn, rally.tactic === 'net' ? .56 : -.25, power);
      service.phase = 'flight';
      hit(rally, 'opponent', stroke.target, stroke.seconds, 'serve', 'Diritto', power, stroke.limit);
      events.push({ type: 'hit', hitter: 'opponent', kind: 'serve' });
    }
    return;
  }
  tryPlayerHit(rally, events);
  expireRelease(rally, events);
  if (service.phase === 'toss' && age >= TOSS_END) {
    service.started = rally.tick + 12;
    rally.ball = tossedBall(rally, service, 0);
    clearPreparation(rally);
  }
}

export function step(rally: Rally, command: Command): TennisEvent[] {
  if (rally.phase !== 'rally') return [];
  const events: TennisEvent[] = [];
  rally.tick++;
  const recovering = recoveryTicks(rally);
  if (rally.queuedTap !== null && !recovering) {
    startSwing(rally, rally.queuedTap, 0);
    rally.queuedTap = null;
  }
  if (command.pressed && !rally.pending) {
    rally.preparation = { started: rally.tick + recovering };
  }
  if (command.released && rally.preparation) {
    const flick = command.pressed && typeof command.aim === 'object' && command.aim.technique ? command.aim.swipe : null;
    const charge = flick ? .24 + .36 * Math.min(1, Math.hypot(flick.x, flick.y)) : preparationPower(rally);
    rally.preparation = null;
    if (!recovering) startSwing(rally, command.aim, charge);
    else if (recovering <= 4) rally.queuedTap = command.aim;
  }
  if (rally.pending && rally.service?.phase !== 'toss') tryPlayerHit(rally, events);
  if (rally.service?.phase === 'toss') {
    stepToss(rally, rally.service, command, events);
    return events;
  }
  const lunging = rally.swing?.result === 'hit' && rally.swing.spot.kind === 'reach' ? recoveryTicks(rally) / 42 : 0;
  const footing = lunging ? { speed: PLAYER_MOTION.speed, acceleration: 21 - 16 * lunging, braking: 18 - 12 * lunging } : PLAYER_MOTION;
  move(rally.player, playerCommand(rally.player, command), false, footing);
  if (!rally.serviceDrill) chase(rally);
  recordSlide(rally, 'player');
  recordSlide(rally, 'opponent');
  moveBall(rally, events);
  if (rally.phase !== 'rally') return events;
  tryPlayerHit(rally, events);
  expireRelease(rally, events);
  if (canHit(rally, 'opponent')) {
    const profile = DIFFICULTIES[rally.difficulty];
    const openSide = rally.player.x > 0 ? -1 : 1;
    const onRun = Math.hypot(rally.opponent.vx, rally.opponent.vy) > 3.1;
    const volley = rally.bounces === 0;
    const angle = rally.tactic === 'counter' ? .38 : rally.tactic === 'baseline' ? -.49 : 0;
    const depth = rally.tactic === 'baseline' ? .54 : volley ? -3.1 : 0;
    const target = { x: openSide * (profile.angle + angle - (onRun ? 1.25 : 0)), y: -profile.depth - depth + (onRun ? 2.25 : 0) };
    const seconds = profile.pace + (onRun ? .12 : 0);
    const wing = rally.ball.x > rally.opponent.x + .1 ? 'Rovescio' : 'Diritto';
    let kind: StrokeKind = volley ? 'volley' : 'ground';
    let flight = volley ? clearNetTime(rally.ball, target, seconds * .83) : seconds;
    const incomingPace = Math.hypot(rally.ball.vx, rally.ball.vy);
    const attackable = incomingPace < 10.5 || (rally.ball.y < 7.8 && incomingPace < (onRun ? 16 : 21));
    rally.attacking = !volley && attackable && rally.ball.z > .20 && Math.hypot(rally.ball.x - rally.opponent.x,rally.ball.y - rally.opponent.y) <= REACH;
    const reaching = Math.hypot(rally.ball.x-rally.opponent.x,rally.ball.y-rally.opponent.y) > REACH;
    rally.wrongFoot = false;
    if (reaching) {
      kind = 'reach';
      target.x *= .50;
      target.y = -6.8;
      flight = clearNetTime(rally.ball,target,1.70);
    } else if (rally.attacking) {
      // Read a committed recovery step: the defender can run past the centre
      // before the ball arrives. Send the attack back behind that movement.
      const projectedX = rally.player.x + rally.player.vx * (rally.difficulty === 'easy' ? .30 : .52);
      const attackSide = projectedX > 0 ? -1 : 1;
      rally.wrongFoot = attackSide !== openSide && Math.abs(rally.player.vx) > 2;
      target.x = attackSide * (HALF_WIDTH - (rally.difficulty === 'easy' ? .98 : .43));
      target.y = -10.85;
      flight = clearNetTime(rally.ball,target,seconds * .72);
    } else if (rally.match && !volley && !onRun && rally.player.y > -3.6 && rally.opponent.y > 5.8) {
      kind = 'lob';
      target.y = -10.9;
      flight = 2.08;
    } else if (rally.match && !volley && onRun && rally.ball.z < .76 && rally.ball.backspin !== undefined) {
      kind = 'slice';
      target.y = Math.max(target.y, -8.65);
      flight = clearNetTime(rally.ball, target, seconds);
    }
    hit(rally, 'opponent', target, flight, kind, wing, rally.attacking ? .91 : .60);
    rally.shot = null;
    events.push({ type: 'hit', hitter: 'opponent', kind });
  }
  return events;
}
