import assert from 'node:assert/strict';
import { test } from 'node:test';
import { awardPoint, newTieBreak, serviceTurn } from './match';
import { athletePose } from './athlete';
import { canHit, contactGuide, createRally, createService, inServiceBox, netHeight, previewStroke, SERVICE_LINE, step } from './physics';
import type { Side } from './match';
import type { Command, Rally, TennisEvent } from './physics';

const idle: Command = { x: 0, y: 0, pressed: false, released: false, aim: { swipe: { x: -.75, y: .22 } } };

function advance(rally: Rally, ticks: number, from = -1, release = -1): TennisEvent[] {
  const events: TennisEvent[] = [];
  for (let tick = 1; tick <= ticks; tick++) {
    events.push(...step(rally, { ...idle, pressed: tick === from, released: tick === release }));
  }
  return events;
}

test('tie-break serves once, then twice in turn and alternates the service court', () => {
  let match = newTieBreak();
  const turns = [];
  for (let point = 0; point < 7; point++) {
    turns.push(serviceTurn(match));
    match = awardPoint(match, point % 2 ? 'opponent' : 'player');
  }
  assert.deepEqual(turns.map((turn) => turn.server), ['player', 'opponent', 'opponent', 'player', 'player', 'opponent', 'opponent']);
  assert.deepEqual(turns.map((turn) => turn.side), [1, 1, -1, -1, 1, 1, -1]);
});

test('six all, seven all and the next two points produce one winner', () => {
  let match = newTieBreak();
  for (const winner of [...Array<Side>(6).fill('player'), ...Array<Side>(6).fill('opponent'), 'player', 'opponent', 'player', 'player'] as Side[]) {
    match = awardPoint(match, winner);
    if (match.score.player < 9) assert.equal(match.winner, null);
  }
  assert.deepEqual(match, { score: { player: 9, opponent: 7 }, winner: 'player', attempt: 1 });
  assert.equal(awardPoint(match, 'opponent'), match);
});

test('a timed serve lands in the highlighted box and keeps the rally alive', () => {
  const turn = serviceTurn(newTieBreak());
  const rally = createService(turn, 'easy', 'baseline', 'rally');
  advance(rally, 39, 32);
  const guide = contactGuide(rally);
  assert.equal(guide?.state, 'ready');
  const preview = previewStroke(rally, idle.aim, guide);
  assert.equal(preview?.kind, 'serve');
  assert.ok(preview && inServiceBox(preview.target, turn));
  const events = advance(rally, 100, -1, 1);
  assert.ok(events.some((event) => event.type === 'hit' && event.kind === 'serve' && event.hitter === 'player'));
  assert.ok(events.some((event) => event.type === 'service' && event.result === 'in'));
  assert.equal(rally.phase, 'rally');
  assert.equal(rally.service, null);
});

test('driving a falling toss into the net on first and second attempts separates the fault from the point', () => {
  const first = createService({ server: 'player', side: 1, attempt: 1 }, 'easy', 'neutral', 'rally');
  const second = createService({ server: 'player', side: 1, attempt: 2 }, 'easy', 'neutral', 'rally');
  for (const [rally, count] of [[first, 0], [second, 1]] as const) {
    const events = advance(rally, 150, 1, 52);
    assert.ok(events.some((event) => event.type === 'service' && event.result === 'fault' && event.reason === 'Rete'));
    assert.equal(events.filter((event) => event.type === 'point').length, count);
    if (count) assert.ok(events.some((event) => event.type === 'point' && event.winner === 'opponent' && event.reason === 'Doppio fallo'));
  }
});

test('the service lines count and touching the tape on a good service is a let', () => {
  const turn = { server: 'player', side: 1, attempt: 2 } as const;
  assert.equal(inServiceBox({ x: 0, y: SERVICE_LINE }, turn), true);
  assert.equal(inServiceBox({ x: .1, y: SERVICE_LINE }, turn), false);
  const rally = createService(turn, 'easy', 'neutral', 'rally');
  assert.ok(rally.service);
  rally.service.phase = 'flight';
  rally.ball = { x: -1.45, y: -.04, z: netHeight(-1.45) + .006, vx: 0, vy: 8, vz: 0 };
  const events = advance(rally, 60);
  assert.ok(events.some((event) => event.type === 'service' && event.result === 'let' && event.turn.attempt === 2));
  assert.ok(events.every((event) => event.type !== 'point'));
});

test('the CPU serve reaches the correct box and the player can prepare a volley later in play', () => {
  const rally = createService({ server: 'opponent', side: -1, attempt: 1 }, 'normal', 'net', 'rally');
  const events = advance(rally, 157);
  assert.ok(events.some((event) => event.type === 'service' && event.result === 'in'));
  assert.ok(events.some((event) => event.type === 'hit' && event.hitter === 'opponent' && event.kind === 'serve'));
  rally.match = true;
  rally.phase = 'rally';
  rally.bounces = 0;
  rally.player = { x: 0, y: -3.05, vx: 0, vy: 0 };
  rally.ball = { x: .53, y: -2.5, z: 1.06, vx: 0, vy: -11, vz: -.1 };
  assert.equal(canHit(rally), true);
  assert.equal(contactGuide(rally)?.volley, true);
  assert.ok(advance(rally, 1, 1, 1).some((event) => event.type === 'hit' && event.kind === 'volley'));
});

test('the 3D racket head meets the impact in world coordinates', () => {
  const impact = { x: .85, y: -9.4, z: 1.12, charge: .8, kind: 'ground', wing: 'Diritto' } as const;
  const frame = athletePose({ runner: { x: .10, y: -10.35, vx: 0, vy: 0 }, tick: 117,
    forward: 1, charge: .8, preparing: false, swing: 0, wing: 'Diritto', kind: 'ground', impact, toss: null, reaction: null });
  assert.equal(frame.racket.tip.x, impact.x);
  assert.equal(frame.racket.tip.y, impact.y);
  assert.equal(frame.racket.tip.z, impact.z);
});

test('both volley wings meet the ball with a firm upright racket and a short forward punch', () => {
  for (const wing of ['Diritto', 'Rovescio'] as const) {
    const impact = { x: wing === 'Diritto' ? .7 : -.7, y: -2.5, z: 1.3, charge: .4, kind: 'volley', wing } as const;
    const pose = (swing: number) => athletePose({ runner: { x: 0, y: -3, vx: 0, vy: 0 }, tick: 0, forward: 1,
      charge: .4, preparing: false, swing, wing, kind: 'volley', impact, toss: null, reaction: null }).racket;
    const contact = pose(0);
    assert.ok(Math.hypot(contact.tip.x-impact.x, contact.tip.y-impact.y, contact.tip.z-impact.z) < 1e-8);
    const finish = pose(.36);
    assert.ok(contact.tip.z > contact.wrist.z + .30 && finish.tip.z > finish.wrist.z + .30);
    assert.ok(finish.tip.y > impact.y + .20 && finish.tip.y < impact.y + .30);
    assert.ok(Math.abs(finish.tip.x - impact.x) < .12);
  }
});

test('a lightly charged swipe down brakes on clay, and swiping up gives a high, deep lob', () => {
  for (const [y, kind] of [[-1, 'drop'], [1, 'lob']] as const) {
    const rally = createRally('center', 'rally');
    rally.match = true;
    let apex = 0;
    let landing = 0;
    let hit = false;
    for (let tick = 1; tick <= 330; tick++) {
      const previousPace = Math.hypot(rally.ball.vx, rally.ball.vy);
      const events = step(rally, { ...idle, pressed: tick === 110, released: tick === 117, aim: { swipe: { x: 0, y } } });
      if (events.some((event) => event.type === 'hit' && event.hitter === 'player' && event.kind === kind)) hit = true;
      if (hit) apex = Math.max(apex, rally.ball.z);
      const bounce = events.find((event) => event.type === 'bounce' && event.mark.hitter === 'player');
      if (bounce?.type === 'bounce') {
        assert.equal(bounce.mark.inCourt, true);
        landing = bounce.mark.y;
        if (kind === 'drop') assert.ok(Math.hypot(rally.ball.vx, rally.ball.vy) < previousPace * .52);
        break;
      }
    }
    assert.ok(hit && landing > 0);
    if (kind === 'drop') assert.ok(landing < 3.1);
    else assert.ok(landing > 11.5 && apex > 5);
  }
});

test('both wings keep the dominant racket hand and a rigid racket through the finish', () => {
  const distance = (a: { x: number; y: number; z: number }, b: typeof a) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
  for (const wing of ['Diritto', 'Rovescio'] as const) {
    const runner = { x: .1, y: -10.4, vx: .2, vy: 0 };
    const impact = { x: wing === 'Diritto' ? .76 : -.56, y: -9.9, z: .95, charge: .84, kind: 'ground', wing } as const;
    for (const swing of [0, .12, .36, .74, .98]) {
      const pose = athletePose({ runner, tick: 110, forward: 1, charge: 0, preparing: false, swing, wing, kind: 'ground', impact, toss: null, reaction: null });
      assert.equal(distance(pose.racket.wrist, pose.arms[1].hand), 0);
      assert.ok(Math.abs(distance(pose.racket.wrist, pose.racket.tip) - .48) < 1e-8);
      if (wing === 'Rovescio') assert.ok(distance(pose.arms[0].hand, pose.racket.wrist) < .09);
      if (!swing) assert.ok(pose.arms[1].shoulder.x > pose.arms[0].shoulder.x);
    }
  }
});

test('running alternates the supporting foot and bends the free knee on both sides of the court', () => {
  for (const forward of [-1, 1] as const) {
    const pose = (stride: number) => athletePose({ runner: { x: 0, y: -8 * forward, vx: 4, vy: forward * 3, stride },
      tick: 77, forward, charge: 0, preparing: false, swing: 1, wing: 'Diritto', kind: 'ground', impact: null, toss: null, reaction: null });
    const a = pose(.30), b = pose(.80);
    assert.ok(a.legs[0].ankle.z > a.legs[1].ankle.z + .17);
    assert.ok(b.legs[1].ankle.z > b.legs[0].ankle.z + .17);
    assert.ok(a.legs[0].knee.z > a.legs[1].knee.z + .10);
  }
});

test('the net drill offers repeatable forehand and backhand volleys before the first bounce', () => {
  for (const side of [-1, 1] as const) {
    const rally = createRally('volley', 'rally', 'easy', 'neutral', side);
    advance(rally, 60, 51);
    const guide = contactGuide(rally);
    assert.ok(guide?.volley && guide.state === 'ready' && !rally.bounces);
    const preview = previewStroke(rally, idle.aim);
    assert.equal(preview?.kind, 'volley');
    const events = advance(rally, 1, -1, 1);
    const hit = events.find(e => e.type === 'hit' && e.hitter === 'player');
    assert.ok(hit?.type === 'hit' && hit.hitter === 'player' && hit.kind === 'volley');
    assert.equal(hit.wing, side === 1 ? 'Diritto' : 'Rovescio');
    assert.ok(rally.swing && rally.swing.readyAt - rally.swing.started <= 19);
  }
});

test('a rising low ball permits a half-volley and a serve must bounce before a net return', () => {
  const rally = createService({ server:'opponent', side: 1, attempt: 1 }, 'easy', 'neutral', 'rally');
  rally.service!.phase = 'flight';
  rally.player = {x: 0, y: -4, vx:0, vy:0};
  rally.ball = {x: .45, y: -3.6, z: .44, vx:0, vy:-8, vz:-2};
  assert.equal(canHit(rally), false);
  rally.service = null;
  rally.bounces = 1;
  rally.ball.vz = 2.8;
  assert.ok(advance(rally, 1, 1, 1).some(e => e.type === 'hit' && e.kind === 'halfVolley'));
});

test('at toss apex the full first serve is faster than a kicked second and both land in the box', () => {
  const speeds = [];
  for (const attempt of [1, 2] as const) {
    const rally = createService({server:'player',side:1,attempt},'normal','neutral','rally');
    const events = advance(rally, 33, 9, 33);
    const shot = events.find(e => e.type === 'hit' && e.hitter === 'player');
    assert.ok(shot?.type === 'hit' && shot.hitter === 'player' && shot.charge === 1);
    assert.equal(!!rally.ball.kick,attempt === 2);
    speeds.push(shot.speed);
    assert.ok(advance(rally,100).some(e => e.type === 'service' && e.result === 'in'));
  }
  assert.ok(speeds[0] > 155 && speeds[0] > speeds[1] * 1.3);
});
