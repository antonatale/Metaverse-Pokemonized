import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fitCourtCamera } from './camera';
import { DOUBLES_WIDTH, HALF_LENGTH } from './physics';

const sizes = [[1068, 594], [980, 447], [374, 352], [304, 176], [495, 111]] as const;

test('the broadcast camera keeps both baselines and the runout inside the viewport', () => {
  for (const [width, height] of sizes) {
    const camera = fitCourtCamera(width, height);
    for (const x of [-DOUBLES_WIDTH, DOUBLES_WIDTH, -6.22, 6.22]) {
      for (const y of [-14.06, -HALF_LENGTH, HALF_LENGTH, 13.65]) {
        const projected = camera.project(x, y, 0);
        assert.ok(projected.x >= 0 && projected.x <= width && projected.y >= 0 && projected.y <= height);
      }
    }
  }
});

test('the projected ground and the cursor agree on positions on both sides of the net', () => {
  for (const [width, height] of sizes) {
    const camera = fitCourtCamera(width, height);
    for (const [x, y] of [[-3.4, -12.1], [4.1, -6.4], [0, 0], [2.2, 9.7]]) {
      const projected = camera.project(x, y, 0);
      const mapped = camera.ground(projected.x, projected.y);
      assert.ok(mapped && Math.abs(mapped.x - x) < 1e-8 && Math.abs(mapped.y - y) < 1e-8);
    }
  }
});

test('both hops finish on the surface and the dead ball rolls to rest', async () => {
  const { deadBall, lineReview } = await import('./line-review');
  const ball = { x: 4.32, y: 8, z: 0, vx: 4, vy: 15, vz: -6 };
  const first = 2 * 6 * .58 / 9.81;
  assert.ok(deadBall(ball,.2).z > .3);
  assert.ok(deadBall(ball,first).z < 1e-8);
  assert.ok(deadBall(ball,first+.1).z > 0);
  assert.equal(deadBall(ball,2).z,0);
  assert.deepEqual(deadBall(ball,2),deadBall(ball,3));
  const mark = { ...ball, first:true, inCourt:false, stroke:1, hitter:'player' as const };
  assert.ok(Math.abs(lineReview(mark,null).distance - .205) < 1e-5);
});

test('a stopped drive falls back onto the hitter’s side and settles after a bounce', async () => {
  const { netDrop } = await import('./line-review');
  for (const vy of [-22, 22]) {
    const ball = { x: 1, y: 0, z: .82, vx: 3, vy, vz: -2 };
    const impact = Math.sqrt(2 * ball.z / 9.81);
    assert.equal(netDrop(ball, 0).z, ball.z);
    assert.equal(netDrop(ball, impact).z, 0);
    assert.ok(netDrop(ball, impact + .09).z > 0);
    assert.equal(Math.sign(netDrop(ball, .8).y), -Math.sign(vy));
    assert.ok(netDrop(ball, 1).z < 1e-8);
  }
});
