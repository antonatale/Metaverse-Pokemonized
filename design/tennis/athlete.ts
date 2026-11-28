import { add, mixJoint, perpendicular, stretch, subtract, unit } from './volumes';
import { STEP } from './physics';
import type { Rally, Runner, StrokeKind, Wing } from './physics';

export type Joint = { x: number; y: number; z: number };
export type Motion = { stance: number; coil: number; finish: number; step: number };
type Leg = { hip: Joint; knee: Joint; ankle: Joint; toe: Joint };
type Arm = { shoulder: Joint; elbow: Joint; hand: Joint };
type Frame = {
  runner: Runner;
  tick: number;
  forward: 1 | -1;
  charge: number;
  preparing: boolean;
  swing: number;
  wing: Wing;
  kind: StrokeKind;
  impact: Rally['impact'];
  toss: number | null;
  reaction: { won: boolean; age: number } | null;
  motion?: Motion;
  anticipation?: number;
  tracking?: Joint;
  slot?: number;
  lead?: number;
};

const standardMotion: Motion = { stance: 1, coil: 1, finish: 1, step: 1 };

const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

// Solve the elbow away from the rib cage. Near extension the bend naturally flattens.
function bentElbow(shoulder: Joint, hand: Joint, pole: Joint): Joint {
  const axis = subtract(hand, shoulder);
  const reach = Math.hypot(axis.x, axis.y, axis.z);
  const bend = Math.sqrt(Math.max(.0016, .32 ** 2 - (reach / 2) ** 2));
  return add(mixJoint(shoulder, hand, .50), stretch(perpendicular(unit(axis), pole), bend));
}

export function athletePose(frame: Frame) {
  const { runner, tick, forward, charge, preparing, swing, wing, kind, impact, toss, reaction, motion = standardMotion } = frame;
  const velocity = Math.hypot(runner.vx, runner.vy);
  const gait = Math.min(1, velocity / 4.8);
  const strideLength = (1.12 + velocity * .235) / motion.step;
  const phase = runner.stride !== undefined ? runner.stride * 2 * Math.PI * motion.step : tick * STEP * velocity * 2 * Math.PI / strideLength;
  const plant = runner.plant ?? 0;
  const drive = Math.min(1, velocity / 5.8);
  const runYaw = Math.atan2(runner.vx * forward, Math.max(1.2, Math.abs(runner.vy))) * drive;
  const bob = Math.cos(phase * 2) * .034 * gait * (1 - .65 * plant);
  const turn = wing === 'Rovescio' ? -1 : 1;
  const anticipation = frame.anticipation ?? 0;
  const cut = kind === 'slice' || kind === 'drop' || kind === 'reach';
  const atNet = kind === 'volley' || kind === 'halfVolley';
  const twoHands = wing === 'Rovescio' && !cut && !atNet && kind !== 'serve';
  const loaded = frame.lead !== undefined ? (.42 + Math.min(charge, 1) * .5) * (1 - frame.lead) : swing < 1 ? 0 : Math.max(anticipation * .74, preparing ? .23 + .77 * Math.min(1, charge) : 0);
  const follow = swing < 1 ? Math.sin(Math.PI * Math.pow(swing, .66)) : 0;
  const strike = frame.lead !== undefined ? frame.lead * frame.lead * (3 - 2 * frame.lead) : impact ? Math.max(0, 1 - swing * 2.35) : 0;
  const stance = (.19 + loaded * .14 + gait * .04) * motion.stance;
  const reactionAge = reaction?.age ?? 0;
  const celebrate = reaction?.won ? Math.sin(reactionAge * Math.PI * .78) : 0;
  const slump = reaction && !reaction.won ? Math.sin(reactionAge * Math.PI * .7) : 0;
  const trophy = toss === null ? 0 : Math.sin(Math.PI * Math.min(1,toss * 1.34));
  const serveJump = kind === 'serve' && impact ? .17 * Math.max(0,1 - swing * 2.2) : 0;
  const hop = reaction?.won ? .25 * Math.sin(Math.PI * Math.min(1, reactionAge * 1.8)) : serveJump;
  const yaw = trophy * .65 + turn * ((atNet ? .28 : twoHands ? 1.17 : .98) * loaded * motion.coil - (atNet ? .23 : cut ? .60 : 1.03) * follow * motion.finish) + runYaw * (1 - Math.max(loaded, follow) * .73) * .73;
  const serveLanding = kind === 'serve' && impact ? Math.sin(Math.PI * swing) : 0;
  const hipYaw = yaw * .49 - turn * .16 * follow;
  const shiftX = turn * (.075 * loaded - .105 * follow);
  const reachPose = kind === 'reach' ? strike : 0;
  const yawSin = Math.sin(yaw);
  const yawCos = Math.cos(yaw);
  const flat = (x: number, y: number, z: number): Joint => ({ x: runner.x + forward * x, y: runner.y + forward * y, z: z + hop });
  const body = (x: number, y: number, z: number): Joint => flat(x * yawCos + y * yawSin, y * yawCos - x * yawSin, z);

  const leanX = shiftX + clamp(runner.vx * forward * .034, .20) + (impact ? clamp((impact.x - runner.x) * forward * (.33 + .10 * reachPose), .53) * strike : 0);
  const leanY = (atNet ? .16 * Math.max(strike, follow) : 0) + clamp(runner.vy * forward * .023, .14) + (impact ? clamp((impact.y - runner.y) * forward * (.32 + .12 * reachPose), .66) * strike : 0);
  const crouch = trophy * .18 + (kind === 'halfVolley' ? .16 * Math.max(loaded, strike) : 0) + plant * .12 - bob + loaded * .15 + reachPose * .17 + gait * .045 + slump * .13;
  const legs: Leg[] = [-1, 1].map((side) => {
    const cycle = (phase / (2 * Math.PI) + (side < 0 ? .5 : 0)) % 1;
    const support = .56;
    const strideTime = strideLength * support / Math.max(.01, velocity);
    const travel = Math.max(0, (cycle - support) / (1 - support));
    // Match the grounded foot's travel to the root velocity during the support phase.
    const shift = cycle < support ? .5 - cycle / support : travel * travel * (3 - 2 * travel) - .5;
    const stepX = clamp(runner.vx * forward * strideTime * shift, .59) + side * plant * .10;
    const stepY = clamp(runner.vy * forward * strideTime * shift, .65);
    const lift = (side > 0 ? .30 * serveLanding : 0) + Math.sin(travel * Math.PI) ** 1.32 * (.20 + .13 * drive) * gait * (1 - .58 * plant);
    const push = Math.max(0, Math.sin(travel * Math.PI * 2)) * gait;
    const toeTurn = runYaw * (1 - loaded * .72) + side * .14;
    const plantX = side * stance + stepX + turn * follow * -.11 + (side === turn ? leanX * strike * .90 : 0);
    const netStep = atNet && side === -turn ? .32 * Math.max(loaded * .55, strike, follow) : 0;
    const serviceStep = kind === 'serve' ? (side < 0 ? .18 + .31 * serveLanding : -.21 - .19 * serveLanding) : 0;
    const plantY = serviceStep + netStep + stepY - side * turn * loaded * .19 + follow * .14 + (side === turn ? leanY * strike * .87 : 0);
    return {
      hip: flat(side * .14 * Math.cos(hipYaw) + leanX * .44, -side * .14 * Math.sin(hipYaw) + leanY * .39, .89 - crouch),
      knee: flat(plantX * .77 + leanX * .37, plantY * .59 + .13 + push * .085, .47 - crouch * .48 + lift * .66),
      ankle: flat(plantX, plantY, .09 + lift),
      toe: flat(plantX + Math.sin(toeTurn) * .23, plantY + Math.cos(toeTurn) * .23, .064 + lift * .72),
    };
  });

  const shoulderZ = 1.42 - crouch;
  const side = kind === 'serve' ? 1 : turn;
  const shoulder = body(.23 + leanX, leanY, shoulderZ - turn * loaded * .035);
  const otherShoulder = body(-.23 + leanX, leanY, shoulderZ + turn * loaded * .035);
  const neck = body(leanX, leanY, shoulderZ + .055);
  const head = body(leanX + turn * follow * .07, leanY + slump * .10, shoulderZ + .23);

  const pump = !preparing && swing >= 1 && toss === null ? Math.sin(phase) * gait : 0;
  const restWrist = body(.23 + leanX, leanY + .35 + pump * .16, shoulderZ - .34 + celebrate * .55);
  const restTip = body(.14 + leanX, leanY + .59 + pump * .17, shoulderZ + .08 + celebrate * .59);
  const backswing = flat(side * (twoHands ? .44 : .59), twoHands ? -.26 : -.42, shoulderZ - (cut ? .02 : .24));
  const backTip = flat(side * (twoHands ? .87 : .92), twoHands ? -.58 : -.76, shoulderZ + (cut ? .42 : .12));
  let wrist = mixJoint(restWrist, backswing, loaded);
  let tip = mixJoint(restTip, backTip, loaded);
  // Drop into the hitting slot on approach. The final extension remains under release control.
  if (frame.slot && frame.tracking && !impact && !atNet && kind !== 'serve') {
    const ball = frame.tracking;
    const inward = unit(subtract(shoulder, ball));
    const distance = Math.hypot(ball.x - runner.x, ball.y - runner.y);
    const meeting = flat(clamp((ball.x - runner.x) * forward, .90),
      clamp((ball.y - runner.y) * forward - .28, .65), Math.max(.34, Math.min(1.67, ball.z + (cut ? .16 : -.19))));
    tip = mixJoint(tip, meeting, frame.slot);
    wrist = mixJoint(wrist, add(meeting, stretch(inward, .48)), frame.slot * Math.min(1, .8 + distance * .20));
  }
  if (impact && frame.lead === undefined && kind !== 'serve') {
    const through = Math.sin(Math.PI * Math.min(1, swing / .60));
    const wrap = Math.sin(Math.PI * swing) ** .66;
    const extension = flat(-side * (twoHands ? .34 : .48), .49, shoulderZ + (cut ? -.31 : .16) * motion.finish);
    const finish = flat(-side * (twoHands ? .58 : .73), cut ? .72 : .08, shoulderZ + (cut ? -.29 : .59) * motion.finish);
    wrist = mixJoint(restWrist, extension, wrap);
    tip = mixJoint(restTip, finish, wrap);
    wrist.y += forward * through * .15;
    tip.y += forward * through * .36;
  }
  if (kind === 'serve') {
    if (toss !== null) {
      const rise = Math.min(1,toss * 1.9);
      wrist = body(.34 + .08*trophy, .16 - .48*rise, shoulderZ - .27 + .52*rise);
      tip = body(.43, .31 - .79*rise, shoulderZ + .12 + .42*trophy - .32*rise);
      if (frame.tracking) {
        const lift = Math.min(.84, Math.max(0,(toss - .28) * 2.6));
        const overhead = add(frame.tracking,{x:-.09 * forward,y:-.12 * forward,z:-.42});
        wrist = mixJoint(wrist, overhead, lift);
        tip = mixJoint(tip, frame.tracking, lift);
      }
    } else if (impact) {
      const finish = Math.sin(Math.PI * Math.min(1,swing / .88));
      wrist = body(.22 - .62*finish, .36 + .14*finish, shoulderZ - .27 - .19*finish);
      tip = body(.17 - .87*finish, .49 + .13*finish, shoulderZ + .12 - .80*finish);
    }
  } else if (atNet) {
    // Compact block, then push the grip through the target; the free hand counterbalances.
    const low = kind === 'halfVolley' ? .44 : 0;
    wrist = body(side * (.28 + .09 * follow), .36 + .31 * follow, shoulderZ + .02 - low - .07 * follow);
    tip = body(side * (.45 + .17 * follow), .47 + .49 * follow, shoulderZ + .46 - low * 1.7 - .24 * follow);
  } else if (kind === 'lob') {
    wrist.z += follow * .29;
    tip.z += follow * .43;
  }
  // On a volley the grip stays below the string bed and the face stays open.
  // Punch through contact, then recover to the ready position without wrapping the arm.
  const volleyAxis = atNet ? unit({ x: side * forward * .68, y: forward * .09, z: kind === 'halfVolley' ? .12 : .73 }) : null;
  if (volleyAxis && !impact && frame.tracking && frame.slot) {
    const incoming = frame.tracking;
    const meeting = flat(clamp((incoming.x - runner.x) * forward, 1.05),
      Math.max(.15, Math.min(.70, (incoming.y - runner.y) * forward - .18)),
      Math.max(.34, Math.min(1.80, incoming.z)));
    wrist = mixJoint(wrist, add(meeting, stretch(volleyAxis, -.48)), frame.slot);
    tip = mixJoint(tip, meeting, frame.slot);
  }
  if (volleyAxis && impact) {
    const extension = Math.min(1,swing / .36);
    const hold = swing < .38 ? 1 : Math.max(0,(1-swing)/.62);
    const weight = frame.lead === undefined ? hold : strike;
    const center = add(impact,{ x:side * forward * .055 * extension, y:forward * .25 * extension, z:-.045 * extension });
    wrist = mixJoint(wrist,add(center,stretch(volleyAxis,-.48)),weight);
    tip = mixJoint(tip,center,weight);
  } else if (impact && strike > 0) {
    // Keep the grip behind the string bed by a racket length, including on low digs.
    const fromShoulder = unit(subtract(impact, shoulder));
    const towardBall = add(impact, stretch(fromShoulder, -.48));
    wrist = mixJoint(wrist, towardBall, strike);
    tip = strike === 1 ? { x: impact.x, y: impact.y, z: impact.z } : mixJoint(tip, impact, strike);
  }
  // A rigid frame keeps its proportions through wrist rotation and both follow-throughs.
  const racketAxis = unit(subtract(tip, wrist));
  if (strike === 1) wrist = add(tip, stretch(racketAxis, -.48));
  else tip = add(wrist, stretch(racketAxis, .48));
  let otherHand = body(-.34 - .12 * gait - loaded * .19, .29 + .17 * loaded - .18 * pump, shoulderZ - .33 + celebrate * .74);
  if (atNet) otherHand = body(-.24 - .41 * follow, .27 - .65 * follow, shoulderZ - .04 - .18 * follow);
  if (toss !== null) {
    const reach = Math.sin(Math.PI * Math.min(1, toss * 1.3));
    otherHand = body(-.17, .43, shoulderZ - .12 + reach * .91);
  } else if (kind === 'serve' && impact) {
    otherHand = body(-.12, .22, shoulderZ - .32 + .13 * serveLanding);
  } else if (twoHands) {
    otherHand = add(wrist, stretch(unit(subtract(tip, wrist)), .084));
  }
  const elbow = bentElbow(shoulder, wrist, { x: forward, y: -.32 * forward, z: -.68 });
  const otherElbow = bentElbow(otherShoulder, otherHand, { x: -forward, y: -.22 * forward, z: -.76 });
  const arms: Arm[] = [{ shoulder: otherShoulder, elbow: otherElbow, hand: otherHand }, { shoulder, elbow, hand: wrist }];

  const shirt = [body(-.25 + leanX, leanY, shoulderZ), body(.25 + leanX, leanY, shoulderZ),
    body(.18 + leanX * .33, leanY * .25, .85 - crouch), body(-.18 + leanX * .33, leanY * .25, .85 - crouch)];
  const gaze = frame.tracking ?? impact;
  const gazeYaw = gaze ? clamp(Math.atan2((gaze.x - head.x) * forward, Math.max(.6, (gaze.y - head.y) * forward)), .77) : yaw * .45;
  const headRight = { x: forward * Math.cos(gazeYaw), y: -forward * Math.sin(gazeYaw), z: 0 };
  return { legs, arms, shirt, neck, head, headRight, racket: { wrist, tip, faceAxis: atNet ? unit({x:side * forward * .74,y:forward * -.20,z:-.68}) : undefined }, yaw, hop };
}
