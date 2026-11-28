import type { Camera } from './volumes';
import type { Point } from './physics';

export type CourtCamera = Camera & { focal: number; ground: (x: number, y: number) => Point | null };

export function fitCourtCamera(width: number, height: number): CourtCamera {
  const distance = 43;
  const eye = Math.max(16, Math.min(28, 28 - (width / height - .8) * 6));
  const hypotenuse = Math.hypot(eye, distance);
  const sin = eye / hypotenuse;
  const cos = distance / hypotenuse;
  const depth = (y: number, z = 0) => (y + distance) * cos + (eye - z) * sin;
  const vertical = (y: number, z = 0) => ((y + distance) * sin + (z - eye) * cos) / depth(y, z);
  const near = vertical(-14.55);
  const far = vertical(14.6);
  const focal = Math.min(height * .90 / (far - near), width * .075 * depth(-14.55));
  const center = height * .532 + focal * (near + far) / 2;
  return {
    eye: { x: 0, y: -distance, z: eye },
    focal,
    project(x, y, z = 0) {
      const scale = focal / depth(y, z);
      return { x: width / 2 + x * scale, y: center - focal * vertical(y, z), scale };
    },
    ground(x, y) {
      const ratio = (center - y) / focal;
      const divisor = sin - ratio * cos;
      if (divisor <= .0001) return null;
      const courtY = eye * (cos + ratio * sin) / divisor - distance;
      return { x: (x - width / 2) * depth(courtY) / focal, y: courtY };
    },
  };
}
