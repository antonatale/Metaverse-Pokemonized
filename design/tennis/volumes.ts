import type { Joint } from './athlete';

export type Projected = { x: number; y: number; scale: number };
export type Camera = { eye: Joint; project: (x: number, y: number, z: number) => Projected };
export type Ring = readonly [position: number, width: number, depth: number];
type Face = { points: Projected[]; depth: number; color: string; edges?: readonly [string, string] };
type Detail = { points: Projected[]; depth: number; color: string; thickness: number };

export const up: Joint = { x: 0, y: 0, z: 1 };
export const east: Joint = { x: 1, y: 0, z: 0 };
export const add = (a: Joint, b: Joint): Joint => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const subtract = (a: Joint, b: Joint): Joint => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const stretch = (v: Joint, n: number): Joint => ({ x: v.x * n, y: v.y * n, z: v.z * n });
export const dot = (a: Joint, b: Joint): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const mixJoint = (a: Joint, b: Joint, n: number): Joint => add(a, stretch(subtract(b, a), n));
export const cross = (a: Joint, b: Joint): Joint => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });

export function unit(v: Joint): Joint {
  return stretch(v, 1 / Math.max(.00001, Math.hypot(v.x, v.y, v.z)));
}

export function perpendicular(axis: Joint, hint: Joint): Joint {
  const reference = Math.abs(dot(axis, hint)) < .96 ? hint : Math.abs(axis.z) < .92 ? up : east;
  return unit(subtract(reference, stretch(axis, dot(axis, reference))));
}

const mainLight = unit({ x: -.56, y: -.59, z: .74 });
const rimLight = unit({ x: .48, y: .75, z: .44 });
const palettes = new Map<string, string[]>();
const orbits = new Map<number, readonly { cosine: number; sine: number }[]>();

function orbit(sides: number) {
  const known = orbits.get(sides);
  if (known) return known;
  const points = Array.from({ length: sides }, (_, index) => {
    const theta = index * Math.PI * 2 / sides;
    return { cosine: Math.cos(theta), sine: Math.sin(theta) };
  });
  orbits.set(sides, points);
  return points;
}

function shade(color: string, light: number): string {
  let colors = palettes.get(color);
  if (!colors) {
    const rgb = [1, 3, 5].map((start) => parseInt(color.slice(start, start + 2), 16));
    colors = Array.from({ length: 34 }, (_, index) => {
      const strength = .46 + index * .022;
      // Cool skylight and a warm key keep dark fabrics readable on the clay.
      const channels = rgb.map((value, channel) => Math.round(Math.min(255, value * strength + (channel === 2 ? 11 : channel === 1 ? 7 : 4))));
      return `rgb(${channels.join(',')})`;
    });
    palettes.set(color, colors);
  }
  return colors[Math.min(colors.length - 1, Math.max(0, Math.round((light - .46) / .022)))];
}

function illumination(normal: Joint, view: Joint, studio: boolean): number {
  const fill = studio ? .14 : .035;
  return .60 + Math.max(0, dot(normal, mainLight)) * .43 + Math.max(0, dot(normal, rimLight)) * .13 + Math.max(0, dot(normal, view)) * fill;
}

export function createVolumePainter() {
  const queue: (Face | Detail)[] = [];
  let camera: Camera;
  let sides: number;

  function begin(view: Camera, detail: number): void {
    queue.length = 0;
    camera = view;
    sides = detail;
  }

  function project(p: Joint): Projected { return camera.project(p.x, p.y, p.z); }

  function surface(from: Joint, to: Joint, right: Joint, rings: readonly Ring[], color: string,
    accents?: (band: number, sector: number) => string | undefined): void {
    const axis = unit(subtract(to, from));
    const side = perpendicular(axis, right);
    const across = cross(axis, side);
    const circle = orbit(sides);
    const centers = rings.map(([position]) => mixJoint(from, to, position));
    const vertices = rings.map(([, width, depth], band) => circle.map(({ cosine, sine }) =>
      add(centers[band], add(stretch(side, width * cosine), stretch(across, depth * sine)))));
    const view = unit(subtract(camera.eye, mixJoint(from, to, .5)));
    const transform = vertices.map((ring) => ring.map(project));
    const studio = sides > 12;

    for (let band = 0; band < vertices.length - 1; band++) {
      for (let j = 0; j < sides; j++) {
        const k = (j + 1) % sides;
        const a = vertices[band][j];
        const b = vertices[band][k];
        const c = vertices[band + 1][j];
        const d = vertices[band + 1][k];
        // The diagonal form remains well-defined at the pointed ends of an ellipsoid.
        const normal = unit(cross(subtract(d, a), subtract(c, b)));
        if (dot(normal, view) < 0) continue;
        const points = [transform[band][j], transform[band][k], transform[band + 1][k], transform[band + 1][j]];
        const depth = (1 / points[0].scale + 1 / points[1].scale + 1 / points[2].scale + 1 / points[3].scale) / 4;
        const material = accents?.(band, j) ?? color;
        const face: Face = { points, depth, color: shade(material, illumination(normal, view, studio)) };
        if (studio) {
          const axial = dot(normal, axis);
          const radial = Math.sqrt(Math.max(0, 1 - axial * axial));
          const edgeColor = ({ cosine, sine }: typeof circle[number]) => {
            const edge = add(stretch(axis, axial), stretch(add(stretch(side, cosine), stretch(across, sine)), radial));
            return shade(material, illumination(edge, view, studio));
          };
          face.edges = [edgeColor(circle[j]), edgeColor(circle[k])];
        }
        queue.push(face);
      }
    }
  }

  function line(points: Joint[], color: string, thickness: number): void {
    const projected = points.map(project);
    queue.push({ points: projected, depth: projected.reduce((value, point) => value + 1 / point.scale, 0) / projected.length,
      color, thickness: Math.max(.4, projected[0].scale * thickness) });
  }

  function flush(ctx: CanvasRenderingContext2D): void {
    queue.sort((a, b) => b.depth - a.depth);
    ctx.save();
    ctx.lineJoin = ctx.lineCap = 'round';
    for (const face of queue) {
      const { points } = face;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.strokeStyle = face.color;
      if ('thickness' in face) {
        ctx.lineWidth = face.thickness;
        ctx.stroke();
      } else {
        ctx.closePath();
        let fill: string | CanvasGradient = face.color;
        if (face.edges && face.edges[0] !== face.edges[1]) {
          const gradient = ctx.createLinearGradient((points[0].x + points[3].x) / 2, (points[0].y + points[3].y) / 2,
            (points[1].x + points[2].x) / 2, (points[1].y + points[2].y) / 2);
          gradient.addColorStop(0, face.edges[0]);
          gradient.addColorStop(1, face.edges[1]);
          fill = gradient;
        }
        ctx.fillStyle = ctx.strokeStyle = fill;
        ctx.fill();
        ctx.lineWidth = .52;
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  return { begin, surface, line, flush };
}
