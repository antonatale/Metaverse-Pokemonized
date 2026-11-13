import type { Dir } from '../data/maps/types';
import type { PreparedMap } from './maps';
import { T } from '../render/canvas/draw';

/** Ground footprints, in map pixels. Roofs may hide things behind them; wheels may never cross them. */
export interface VehicleBox { left: number; right: number; top: number; bottom: number }
export const VAN_SCALE = 1;
const wet = (m: PreparedMap, x: number, y: number) => m.cell(x, y).g === 'sea';
function laneShift(m: PreparedMap, x: number, y: number, dir: Dir, size: number) {
  const road = (xx: number, yy: number) => xx >= 0 && yy >= 0 && xx < m.w && yy < m.h && m.solid[yy * m.w + xx] !== 1 && m.cell(xx, yy).g === 'road';
  const vertical = dir === 'up' || dir === 'down';
  /* Side streets do not move the centre of a straight road. Follow the continuing lanes on either side of a junction. */
  const lane = (dx: number, dy: number) => {
    let n = 0;
    for (let k = -2; k <= 2; k++) if (road(x + dx + (vertical ? 0 : k), y + dy + (vertical ? k : 0))) n++;
    return n >= 3;
  };
  if (vertical) {
    const l = lane(-1, 0), r = lane(1, 0);
    return { dx: l && !r ? -size / 2 : r && !l ? size / 2 : wet(m, x - 1, y) && !wet(m, x + 1, y) ? 8 : wet(m, x + 1, y) && !wet(m, x - 1, y) ? -8 : 0, dy: 0 };
  }
  const a = lane(0, -1), b = lane(0, 1);
  return { dx: 0, dy: b && !a ? size / 2 : a && !b ? -size / 2 : 0 };
}
/** Interpolate the lane offset too, so a vehicle does not jump sideways halfway through a tile. */
export function roadShift(m: PreparedMap, x: number, y: number, dir: Dir, size = T): { dx: number; dy: number } {
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  const a = laneShift(m, x0, y0, dir, size), b = laneShift(m, x0 + 1, y0, dir, size);
  const c = laneShift(m, x0, y0 + 1, dir, size), d = laneShift(m, x0 + 1, y0 + 1, dir, size);
  return { dx: (a.dx * (1 - fx) + b.dx * fx) * (1 - fy) + (c.dx * (1 - fx) + d.dx * fx) * fy,
    dy: (a.dy * (1 - fx) + b.dy * fx) * (1 - fy) + (c.dy * (1 - fx) + d.dy * fx) * fy };
}
export function vanBody(m: PreparedMap, x: number, y: number, dir: Dir): VehicleBox {
  const sh = roadShift(m, x, y, dir), cx = (x + 0.5) * T + sh.dx, bottom = (y + 1) * T + sh.dy;
  const side = dir === 'left' || dir === 'right', half = side ? 45 : 28;
  return { left: cx - half, right: cx + half, top: bottom - (side ? 18 : 30), bottom };
}
export function motoBody(x: number, y: number): VehicleBox {
  return { left: (x + 0.5) * T - 22, right: (x + 0.5) * T + 22, top: (y + 1) * T - 16, bottom: (y + 1) * T };
}
export function overlaps(a: VehicleBox, b: VehicleBox): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}
export function tileBox(x: number, y: number): VehicleBox { return { left: x * T, right: (x + 1) * T, top: y * T, bottom: (y + 1) * T }; }
