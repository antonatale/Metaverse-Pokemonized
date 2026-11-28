import clayUrl from './terra-di-laterizio.webp';
import type { Camera } from './volumes';

const texture = new Image();
texture.src = clayUrl;
export const clayReady = texture.decode();

export function paintClay(ctx: CanvasRenderingContext2D, project: Camera['project'], halfWidth: number, near: number, far: number): void {
  if (!texture.complete || !texture.naturalWidth) return;
  ctx.save();
  ctx.imageSmoothingQuality = 'high';
  const segments = 240;
  const strip = texture.naturalHeight / segments;
  let a = project(0, far, 0);
  for (let index = 0; index < segments; index++) {
    const b = project(0, far + (near - far) * (index + 1) / segments, 0);
    const radius = halfWidth * (a.scale + b.scale) / 2;
    for (const tile of [-1, 0, 1]) {
      ctx.drawImage(texture, 0, index * strip, texture.naturalWidth, strip, a.x + (tile * 2 - 1) * radius, a.y, radius * 2 + .5, b.y - a.y + .55);
    }
    a = b;
  }
  ctx.restore();
}
