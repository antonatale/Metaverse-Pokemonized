import type { Point } from './physics';

export function swipeRange(width: number): number {
  return Math.max(72, Math.min(118, width * 0.12));
}

export function swipeVector(origin: Point, pointer: Point, range: number): Point {
  const axis = (delta: number, full: number) => Math.sign(delta) * Math.min(1.35, Math.max(0, (Math.abs(delta) - 7) / (full - 7)));
  // Screen up is positive court depth. Each axis saturates independently for deep corners.
  return { x: axis(pointer.x - origin.x, range), y: axis(origin.y - pointer.y, range * 0.66) };
}

// Normalize the displacement of a group of fingers independently of the pointer location.
export function flickVector(dx: number, up: number, range: number): Point {
  return swipeVector({ x: 0, y: 0 }, { x: dx, y: -up }, range);
}

type FingerStroke = (vector: Point) => void;

export function courtGestures(court: HTMLElement, active: () => boolean, sensitivity: () => number,
  invert: () => boolean, shoot: FingerStroke, signal: AbortSignal) {
  let timer = 0;
  let lastWheel = -Infinity;
  let consumed = false;
  let dx = 0;
  let up = 0;
  let fingers = 0;
  let origin: Point | null = null;
  let displacement: Point | null = null;
  let lifted = false;
  const options = { passive: false, signal };
  const range = () => swipeRange(court.clientWidth) * sensitivity();
  const reset = () => {
    clearTimeout(timer);
    timer = 0;
    consumed = true;
    fingers = 0;
    origin = displacement = null;
    lifted = false;
  };
  signal.addEventListener('abort', reset, { once: true });

  court.addEventListener('wheel', event => {
    if (!active() || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    const now = performance.now();
    if (now - lastWheel > 165) {
      dx = up = 0;
      consumed = false;
    }
    lastWheel = now;
    if (consumed) return;
    const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? court.clientHeight : 1;
    const direction = invert() ? -1 : 1;
    dx -= event.deltaX * unit * direction;
    up += event.deltaY * unit * direction;
    if (!timer && Math.hypot(dx, up) > 8) {
      timer = window.setTimeout(() => {
        timer = 0;
        consumed = true;
        if (active()) shoot(flickVector(dx, up, range() * .68));
      }, 40);
    }
  }, options);

  function center(touches: TouchList): Point {
    let x = 0, y = 0;
    for (const touch of Array.from(touches)) { x += touch.clientX; y += touch.clientY; }
    return { x: x / touches.length, y: y / touches.length };
  }

  court.addEventListener('touchstart', event => {
    const count = event.targetTouches.length;
    if (!active() || lifted || count < 2) return;
    event.preventDefault();
    fingers = count;
    origin = center(event.targetTouches);
    displacement = null;
  }, options);
  court.addEventListener('touchmove', event => {
    if (!origin || !active() || event.targetTouches.length !== fingers) return;
    event.preventDefault();
    const to = center(event.targetTouches);
    displacement = flickVector(to.x - origin.x, origin.y - to.y, range());
  }, options);
  court.addEventListener('touchend', event => {
    if (origin) {
      event.preventDefault();
      if (active() && fingers === 2 && displacement && (displacement.x || displacement.y)) shoot(displacement);
      origin = null;
      lifted = true;
    }
    if (!event.targetTouches.length) reset();
  }, options);
  court.addEventListener('touchcancel', reset, options);
  return reset;
}
