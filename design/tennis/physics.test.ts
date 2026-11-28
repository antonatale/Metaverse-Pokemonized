import assert from 'node:assert/strict';
import { test } from 'node:test';
import { swipeRange, swipeVector } from './gesture';
import { ballGravity, canHit, contactGuide, contactWindow, createRally, HALF_WIDTH, previewStroke, STEP, step } from './physics';
import type { Aim, Command, Difficulty, Feed, TennisEvent } from './physics';

const idle: Command = { x: 0, y: 0, pressed: false, released: false, aim: 'timing' };
const sample = {
  center: { early: 108, late: 123, run: 0 },
  backhand: { early: 108, late: 123, run: 0 },
  wide: { early: 101, late: 113, run: 23 },
  short: { early: 105, late: 126, run: 35 },
} as const;

function replay(feed: Feed, release: number, hold: number, { fps = 60, aim = 'timing', difficulty = 'easy' }: {
  fps?: 30 | 60; aim?: Aim; difficulty?: Difficulty;
} = {}) {
  const rally = createRally(feed, 'rally', difficulty);
  const events: TennisEvent[] = [];
  let accumulator = 0;
  let tick = 0;
  while (rally.phase === 'rally' && tick < 420) {
    accumulator += 1 / fps;
    while (accumulator >= STEP && rally.phase === 'rally') {
      tick++;
      events.push(...step(rally, {
        x: Number(feed === 'wide' && tick <= sample[feed].run),
        y: Number(feed === 'short' && tick <= sample[feed].run),
        pressed: tick === release - hold,
        released: tick === release,
        aim,
      }));
      accumulator -= STEP;
    }
  }
  return { events, rally };
}

function firstShot(events: TennisEvent[]) {
  const hit = events.find((event) => event.type === 'hit' && event.hitter === 'player');
  const bounce = events.find((event) => event.type === 'bounce' && event.shot);
  assert.ok(hit?.type === 'hit' && hit.hitter === 'player');
  assert.ok(bounce?.type === 'bounce' && bounce.mark.inCourt);
  return { hit, bounce };
}

for (const feed of ['center', 'backhand', 'wide', 'short'] as const) {
  test(`${feed}: with the same movement, releasing early goes crosscourt and releasing late goes down the line`, () => {
    const { early, late } = sample[feed];
    const cross = replay(feed, early, 6);
    const line = replay(feed, late, 6);
    assert.deepEqual(cross, replay(feed, early, 6, { fps: 30 }));
    assert.deepEqual(line, replay(feed, late, 6, { fps: 30 }));
    const { hit: crossHit, bounce: crossBounce } = firstShot(cross.events);
    const { hit: lineHit, bounce: lineBounce } = firstShot(line.events);
    assert.equal(crossHit.shot, 'Incrociato');
    assert.equal(lineHit.shot, 'Lungolinea');
    assert.equal(crossHit.charge, lineHit.charge);
    const side = feed === 'backhand' ? -1 : 1;
    assert.ok(crossBounce.mark.x * side < -1.2);
    assert.ok(lineBounce.mark.x * side > 1.2);
    assert.equal(crossHit.wing, feed === 'backhand' ? 'Rovescio' : 'Diritto');
  });

  test(`${feed}: holding longer at the same contact makes the shot faster and deeper`, () => {
    const { early } = sample[feed];
    const shots = [1, 9, 17, 19].map((hold) => firstShot(replay(feed, early, hold).events));
    for (let index = 1; index < 3; index++) {
      assert.ok(shots[index].hit.speed > shots[index - 1].hit.speed);
      assert.ok(shots[index].bounce.mark.y > shots[index - 1].bounce.mark.y);
    }
    assert.ok(shots[2].hit.speed > shots[0].hit.speed * 1.6);
    assert.ok(shots[2].bounce.mark.y > shots[0].bounce.mark.y + 3);
    assert.ok(shots[3].hit.charge > shots[2].hit.charge);
  });
}

test('a light ball is returned and the same fully charged shot wins the point', () => {
  const { late } = sample.center;
  const light = replay('center', late, 1);
  const full = replay('center', late, 27);
  assert.ok(light.events.some((event) => event.type === 'hit' && event.hitter === 'opponent'));
  assert.deepEqual(full.events.filter((event) => event.type === 'point'), [{
    type: 'point', winner: 'player', reason: 'Doppio rimbalzo', hitter: 'player',
  }]);
  assert.ok(full.rally.opponent.x > 0, 'opponent also chases the winner');
});

test('the same full drive clears a comfortable feed and finds the net on a pressured ball', () => {
  for (const difficult of [false,true]) {
    const rally = createRally('center','rally');
    rally.bounces = 1;
    rally.preparation = {started: -27};
    Object.assign(rally.ball,{ x:rally.player.x + (difficult ? 1.82 : .4), y:rally.player.y+.22,
      z:1.1,vx:difficult ? 8 : 0,vy:difficult ? -22 : -8,vz:0 });
    const preview = previewStroke(rally,0);
    assert.equal(preview?.net,difficult);
    const events = step(rally,{...idle,released:true,aim:0});
    for(let t=0;t<160;t++) events.push(...step(rally,idle));
    assert.equal(events.some(e=>e.type==='point' && e.reason==='Rete'),difficult);
    if(!difficult) assert.ok(events.some(e=>e.type==='bounce' && e.mark.inCourt));
  }
});

test('manual aim covers the center and intermediate angles with either stroke', () => {
  for (const feed of ['center', 'backhand'] as const) {
    const aimValues = [-1, -0.5, 0, 0.5, 1];
    const bounces = aimValues.map((aim) => firstShot(replay(feed, 117, 27, { aim }).events).bounce.mark.x);
    for (const [index, aim] of aimValues.entries()) {
      const expected = aim * (feed === 'backhand' ? -3.52 : 3.52);
      assert.ok(Math.abs(bounces[index] - expected) < 0.001);
    }
  }
});

test('the same swipe works on both wings and at different powers', () => {
  const aim = { swipe: { x: 0.5, y: 0.4 } };
  const right = firstShot(replay('center', 117, 27, { aim }).events);
  const left = firstShot(replay('backhand', 117, 27, { aim }).events);
  assert.equal(right.hit.shot, 'Lungolinea');
  assert.equal(left.hit.shot, 'Incrociato');
  const expectedX = 0.5 * (HALF_WIDTH - 0.23);
  assert.ok(Math.abs(right.bounce.mark.x - expectedX) < 0.001);
  assert.ok(Math.abs(left.bounce.mark.x - expectedX) < 0.001);
  const soft = firstShot(replay('center', 117, 1, { aim }).events);
  assert.ok(right.hit.speed > soft.hit.speed * 1.45);
  assert.ok(Math.abs(right.bounce.mark.y - left.bounce.mark.y) < 0.001);
  assert.ok(right.bounce.mark.y > soft.bounce.mark.y + 1.5);
});

test('swiping includes short angles, a neutral center, and a deep sideline', () => {
  const landings = [{ x: -1, y: -1 }, { x: 0, y: 0 }, { x: 1, y: 1 }].map((swipe) =>
    firstShot(replay('center', 117, 27, { aim: { swipe } }).events).bounce.mark);
  assert.ok(landings[0].x < -3.8 && landings[0].y < 3);
  assert.ok(Math.abs(landings[1].x) < 0.001 && landings[1].y > 9);
  assert.ok(landings[2].x > 3.8 && landings[2].y > 11.5);
  const { events } = replay('center', 117, 62, { aim: { swipe: { x: -0.6, y: -1 } } });
  assert.ok(events.some((event) => event.type === 'bounce' && event.mark.hitter === 'player' && event.mark.inCourt));
});

test('a swipe depends on displacement and direction, and ignores small click jitter', () => {
  const range = swipeRange(900);
  const first = swipeVector({ x: 220, y: 400 }, { x: 260, y: 376 }, range);
  const second = swipeVector({ x: 600, y: 180 }, { x: 640, y: 156 }, range);
  assert.deepEqual(first, second);
  assert.ok(first.x > 0 && first.x < 1 && first.y > 0 && first.y < 1);
  const jitter = swipeVector({ x: 100, y: 200 }, { x: 106, y: 205 }, range);
  assert.ok(jitter.x === 0 && jitter.y === 0);
  assert.deepEqual(swipeVector({ x: 100, y: 200 }, { x: -150, y: 400 }, range), { x: -1.35, y: -1.35 });
});

test('a player can run toward a chosen position and swipe toward the opposite side', () => {
  const rally = createRally('wide', 'rally');
  const aim = { swipe: { x: -0.75, y: 1 } };
  const destination = { x: 2.94, y: -10.65 };
  const events: TennisEvent[] = [];
  for (let tick = 0; tick < 280; tick++) {
    // The selected run continues during the brief charge even when aiming the other way.
    const moving = tick >= 70;
    events.push(...step(rally, { ...idle, pressed: tick === 98, released: tick === 108, aim, destination: moving ? destination : undefined }));
  }
  const { bounce } = firstShot(events);
  assert.ok(rally.player.x > 2.8);
  assert.ok(bounce.mark.x < -2.6 && bounce.mark.y > 11.5);
});

test('pointer movement settles at the requested position and directional input can take over', () => {
  const rally = createRally('wide', 'rally');
  const destination = { x: 2.67, y: -9.8 };
  for (let tick = 0; tick < 86; tick++) step(rally, { ...idle, destination });
  assert.ok(Math.hypot(rally.player.x - destination.x, rally.player.y - destination.y) < 0.01);
  assert.ok(Math.hypot(rally.player.vx, rally.player.vy) < 0.05);
  for (let tick = 0; tick < 15; tick++) step(rally, { ...idle, x: -1, destination });
  assert.ok(rally.player.x < destination.x - .60);
});

test('the timing mode passes through the middle before reaching the line', () => {
  const early = firstShot(replay('center', 104, 10).events);
  const middle = firstShot(replay('center', 115, 10).events);
  const late = firstShot(replay('center', 124, 10).events);
  assert.ok(early.bounce.mark.x < -2.8);
  assert.ok(Math.abs(middle.bounce.mark.x) < 0.15);
  assert.equal(middle.hit.shot, 'Centro');
  assert.ok(late.bounce.mark.x > 2.8);
});

test('the preview uses the same target as the strike at contact', () => {
  const rally = createRally('backhand', 'rally');
  for (let t = 1; t <= 116; t++) step(rally, { ...idle, pressed: t === 89, aim: -0.5 });
  const preview = previewStroke(rally, -0.5);
  assert.ok(preview && preview.wing === 'Rovescio' && preview.charge === 1);
  const events = step(rally, { ...idle, released: true, aim: -0.5 });
  for (let t = 0; t < 90; t++) events.push(...step(rally, idle));
  const { bounce } = firstShot(events);
  assert.ok(Math.abs(preview.target.x - bounce.mark.x) < 0.001);
  assert.ok(Math.abs(preview.target.y - bounce.mark.y) < 0.001);
});

test('difficulty changes reaction and the harder opponent reaches a winner on easy', () => {
  const levels = ['easy', 'normal', 'hard'] as const;
  const outcomes = levels.map((difficulty) => replay('center', 117, 16, { aim: .75, difficulty }));
  const delays = outcomes.map(({ rally }) => rally.reactionUntil - 117);
  assert.ok(delays[0] > delays[1] && delays[1] > delays[2]);
  assert.ok(outcomes[0].events.some((event) => event.type === 'point' && event.winner === 'player'));
  assert.ok(outcomes[2].events.some((event) => event.type === 'hit' && event.hitter === 'opponent'));
  const lateCross = replay('backhand', 123, 27, { aim: -1, difficulty: 'hard' });
  assert.ok(lateCross.events.some((event) => event.type === 'point' && event.winner === 'player'));
});

test('the player moves while charging and decelerates on the clay after releasing movement', () => {
  const rally = createRally('wide', 'rally');
  const origin = rally.player.x;
  for (let tick = 0; tick < 25; tick++) step(rally, { ...idle, x: -1, pressed: tick === 0 });
  assert.ok(rally.preparation);
  assert.ok(rally.player.x < origin - 1);
  const beforeBraking = rally.player.x;
  for (let tick = 0; tick < 16; tick++) step(rally, idle);
  assert.equal(rally.player.vx, 0);
  assert.ok(Math.abs(rally.player.x - beforeBraking) > .36 && Math.abs(rally.player.x - beforeBraking) < .58);
});

test('the player stays in place without input, even on a wide feed', () => {
  const rally = createRally('wide', 'rally');
  const origin = { ...rally.player };
  for (let tick = 0; tick < 120; tick++) {
    step(rally, idle);
    assert.deepEqual(rally.player, origin);
    assert.equal(contactWindow(rally), null);
  }
});

test('a release several frames outside the window gives timing feedback', () => {
  const early = replay('center', 60, 20);
  const late = replay('center', 136, 20);
  assert.ok(early.events.some((event) => event.type === 'miss' && event.reason === 'early'));
  assert.ok(late.events.some((event) => event.type === 'miss' && event.reason === 'late'));
  assert.ok(!early.events.some((event) => event.type === 'hit'));
  assert.ok(!late.events.some((event) => event.type === 'hit'));
});

test('contact cues match racket reach, and a slightly early release waits for actual contact', () => {
  const rally = createRally('center', 'rally');
  let released = false;
  let hit = false;
  for (let tick = 0; tick < 160 && !hit; tick++) {
    const guide = contactGuide(rally);
    assert.equal(guide?.state === 'ready', canHit(rally));
    const release = !released && guide?.state === 'wait' && guide.seconds < 0.10;
    const events = step(rally, { ...idle, pressed: tick === 70, released: release });
    if (release) {
      assert.ok(rally.pending);
      assert.equal(events.some((event) => event.type === 'hit'), false);
      released = true;
    }
    hit = events.some((event) => event.type === 'hit' && event.hitter === 'player');
  }
  assert.ok(released && hit);
  const { events } = replay('center', 154, 34);
  assert.ok(events.some((event) => event.type === 'miss' && event.reason === 'late'));
});

test('a wide feed asks the player to move, even after it has passed out of reach', () => {
  const rally = createRally('wide', 'rally');
  for (let tick = 0; tick < 138; tick++) {
    assert.equal(contactGuide(rally)?.state, 'away');
    step(rally, idle);
  }
});

test('a ground mark survives one racket contact and disappears on the second', () => {
  const rally = createRally('center', 'rally');
  for (let tick = 0; tick < 260 && rally.strokes < 2; tick++) {
    step(rally, { ...idle, aim: 0, pressed: tick === 111, released: tick === 116 });
    if (rally.strokes === 1) assert.ok(rally.marks.some((mark) => mark.hitter === 'feed'));
  }
  assert.equal(rally.strokes, 2);
  assert.equal(rally.marks.some((mark) => mark.hitter === 'feed'), false);
  assert.ok(rally.marks.some((mark) => mark.hitter === 'player'));
});

test('a fast ball hits the net between updates and ends the point once', () => {
  const rally = createRally('wide', 'rally');
  rally.hitter = 'player';
  rally.ball = { x: 1, y: -0.21, z: 0.62, vx: 0, vy: 34, vz: 0 };
  const events = step(rally, idle);
  assert.deepEqual(events, [{ type: 'point', winner: 'opponent', reason: 'Rete', hitter: 'player' }]);
  assert.deepEqual(step(rally, idle), []);
});

test('first contact at the singles line is in', () => {
  const rally = createRally('wide', 'rally');
  rally.hitter = 'player';
  rally.ball = { x: HALF_WIDTH, y: 3, z: 0.04, vx: 0, vy: 3, vz: -6 };
  const [event] = step(rally, idle);
  assert.ok(event?.type === 'bounce' && event.mark.first && event.mark.inCourt);
  assert.equal(rally.phase, 'rally');
});

test('charge rises continuously from a tap to a sustained full swing', () => {
  for(const ticks of [0,1,8,14,20,26,27,36]) {
    const hit = replay('center',117,ticks).events.find(e=>e.type==='hit' && e.hitter==='player');
    assert.ok(hit?.type==='hit' && hit.hitter==='player');
    assert.equal(hit.charge,Math.min(1,ticks/27));
  }
});

test('late and wide balls admit one defensive reach before passing, on both wings', () => {
  for (const offset of [{ x: -1.91, y: .25 }, { x: 1.94, y: .25 }, { x: -.35, y: -2.50 }]) {
    const rally = createRally('center', 'rally');
    rally.bounces = 1;
    Object.assign(rally.ball, { x: rally.player.x + offset.x, y: rally.player.y + offset.y, z: .74, vy: -9, vz: -.8 });
    assert.equal(contactGuide(rally)?.stretched, true);
    const events = step(rally, { ...idle, pressed: true, released: true });
    assert.ok(events.some(e => e.type === 'hit' && e.kind === 'reach'));
    assert.equal(rally.ball.backspin, 'slice');
    assert.equal(canHit(rally), false);
  }
  const missed = createRally('center', 'rally');
  missed.bounces = 1;
  Object.assign(missed.ball, { x: missed.player.x, y: missed.player.y - 2.84, z: .4 });
  assert.equal(canHit(missed), false);
});

test('a finger flick selects its own shot, in practice and in match, with distinct clay rebounds', () => {
  for (const match of [true, false]) {
    for (const [technique, depth, kind] of [['cut', .62, 'slice'], ['cut', -.78, 'drop'], ['lob', -.78, 'lob']] as const) {
      const rally = createRally('center', 'rally');
      rally.match = match;
      while (rally.tick < 116) step(rally, idle);
      const events = step(rally, { ...idle, pressed: true, released: true, aim: { technique, swipe: { x: -.72, y: depth } } });
      const strike = events.find(e => e.type === 'hit' && e.hitter === 'player');
      assert.ok(strike?.type === 'hit' && strike.hitter === 'player' && strike.kind === kind && strike.target.x < -2.7 && strike.charge > .2);
      let apex = 0;
      while (!rally.bounces && rally.phase === 'rally' && rally.hitter === 'player') {
        const before = { ...rally.ball };
        step(rally, idle);
        apex = Math.max(apex, rally.ball.z);
        if (rally.bounces && kind === 'slice') {
          assert.ok(Math.abs(rally.ball.vy / before.vy - .83) < .001);
          assert.ok(rally.ball.vz < Math.abs(before.vz) * .50);
        }
      }
      assert.ok(rally.marks.some(bounce => bounce.hitter === 'player' && bounce.inCourt));
      if (kind === 'lob') assert.ok(apex > 5 && strike.target.y > 9);
      if (kind === 'drop') assert.ok(strike.target.y < 3);
    }
  }
});

test('a firmly struck special stays inside when its target is inside', () => {
  for (const technique of ['cut', 'lob'] as const) {
    for (const y of [-.9, .7]) {
      const { events } = replay('center', 117, 23, { aim: { technique, swipe: { x: -.65, y } } });
      assert.ok(events.some(e => e.type === 'bounce' && e.mark.hitter === 'player' && e.mark.inCourt));
    }
  }
});

test('a sub-frame tap swings immediately, connects once and cannot double-hit during recovery', () => {
  const rally = createRally('center', 'rally');
  while (rally.tick < 116) step(rally, idle);
  const tap = { ...idle, pressed: true, released: true };
  assert.ok(step(rally, tap).some(e => e.type === 'hit'));
  const first = rally.swing;
  assert.ok(first && first.result === 'hit' && first.readyAt - first.started >= 19);
  for (let i = 0; i < 8; i++) assert.ok(step(rally, tap).every(e => e.type !== 'hit'));
  assert.equal(rally.swing, first);
  assert.equal(rally.strokes, 1);
});

test('a whiff on a wide ball has its own swing, no imaginary contact, and accepts a late queued tap', () => {
  const rally = createRally('wide', 'rally');
  const tap = { ...idle, pressed: true, released: true };
  while (rally.tick < 100) step(rally, idle);
  step(rally, tap);
  const attempt = rally.swing;
  assert.ok(attempt && attempt.result === 'swinging');
  assert.ok(rally.pending && rally.impact === null);
  const events: TennisEvent[] = [];
  while (rally.tick < attempt.readyAt - 3) events.push(...step(rally, idle));
  assert.ok(events.some(e => e.type === 'miss' && e.reason === 'reach'));
  assert.equal(attempt.result, 'miss');
  assert.equal(rally.strokes, 0);
  step(rally, tap);
  assert.equal(rally.queuedTap, 'timing');
  while (rally.tick < attempt.readyAt) step(rally, idle);
  assert.equal(rally.swing?.started, attempt.readyAt);
  assert.equal(rally.queuedTap, null);
});

test('reversing a sprint brakes into a bounded clay slide before pushing off, and strides follow distance', () => {
  const rally = createRally('wide', 'rally');
  for (let i = 0; i < 26; i++) step(rally, { ...idle, x: 1 });
  const atTurn = rally.player.x;
  const stride = rally.player.stride!;
  let steps = 0, furthest = atTurn;
  while (rally.player.vx > 0 && steps < 45) {
    step(rally, { ...idle, x: -1 });
    furthest = Math.max(furthest, rally.player.x);
    steps++;
  }
  assert.ok(steps >= 23 && steps <= 30);
  assert.ok(furthest - atTurn > .55 && furthest - atTurn < 1.1);
  assert.ok(rally.player.stride! > stride && rally.slides.some(s => s.side === 'player'));
  for (let i = 0; i < 32; i++) step(rally, idle);
  const planted = rally.player.stride;
  step(rally, idle);
  assert.equal(rally.player.stride, planted);
  assert.equal(rally.player.plant, 0);
});

test('identical deep targets produce steadily lower apex, net clearance and flight time as power rises', () => {
  const samples = [1, 14, 27].map(hold => {
    const rally = createRally('center', 'rally');
    const aim = { swipe: { x: .5, y: 1 } };
    while (rally.tick < 116) step(rally, { ...idle, aim, pressed: rally.tick === 116 - hold });
    const hit = step(rally, { ...idle, aim, released: true }).find(e => e.type === 'hit' && e.hitter === 'player');
    assert.ok(hit?.type === 'hit' && hit.hitter === 'player' && rally.impact);
    const start = rally.impact;
    const ball = rally.ball;
    const net = -start.y / ball.vy;
    const gravity = ballGravity(ball);
    const vz = ball.vz + gravity * STEP;
    return { speed: hit.speed, x: hit.target.x, y: hit.target.y, flight: (hit.target.y - start.y) / ball.vy,
      apex: start.z + Math.max(0, vz) ** 2 / (2 * gravity), crossing: start.z + vz * net - gravity * net ** 2 / 2 };
  });
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i-1], b = samples[i];
    assert.ok(Math.abs(a.y - b.y) < 1e-8 && Math.abs(a.x - b.x) < 1e-8);
    assert.ok(b.speed > a.speed && b.flight < a.flight && b.apex < a.apex && b.crossing < a.crossing);
    assert.ok(b.crossing > .97);
  }
  assert.ok(samples[2].speed > 110 && samples[2].speed < 150 && samples[2].crossing < 1.65 && samples[2].flight > .48 && samples[2].flight < .82);
});

test('aiming beyond the sideline or baseline produces the corresponding out call', () => {
  for (const swipe of [{x:-1.07,y:.2},{x:1.35,y:.2},{x:.4,y:1.35}]) {
    const {events} = replay('center',117,14,{aim:{swipe}});
    assert.ok(events.some(e=>e.type==='point' && e.reason===(swipe.y>1?'Lunga':'Larga')));
  }
});

test('a short slow ball invites an approach into the open court', () => {
  const rally = createRally('center','rally','normal','baseline');
  rally.match = true;
  rally.hitter = 'player';
  rally.bounces = 1;
  Object.assign(rally.opponent,{ x:1.2,y:6.3 });
  Object.assign(rally.player,{ x:2.4,y:-10 });
  Object.assign(rally.ball,{ x:1.32,y:6.4,z:.84,vx:0,vy:7,vz:.3 });
  const events = step(rally,idle);
  assert.ok(events.some(e => e.type === 'hit' && e.hitter === 'opponent'));
  assert.equal(rally.attacking,true);
  assert.ok(rally.ball.vx < 0 && rally.ball.vy < -13);
  const contact = rally.opponent.y;
  for (let tick=0;tick<15;tick++) step(rally,idle);
  assert.ok(rally.opponent.y < contact);
});

test('a committed recovery across the middle opens a wrong-foot attack', () => {
  for (const vx of [0, -4]) {
    const rally = createRally('center', 'rally', 'normal', 'counter');
    rally.match = true;
    rally.hitter = 'player';
    rally.bounces = 1;
    Object.assign(rally.player, { x: .75, y: -10, vx });
    Object.assign(rally.opponent, { x: 0, y: 6 });
    Object.assign(rally.ball, { x: 0, y: 6, z: .8, vx: 0, vy: 8, vz: .2 });
    step(rally, idle);
    assert.equal(rally.attacking, true);
    assert.equal(rally.wrongFoot, vx < 0);
    assert.equal(Math.sign(rally.ball.vx), vx < 0 ? 1 : -1);
  }
});
