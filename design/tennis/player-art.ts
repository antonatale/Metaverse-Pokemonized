import { athletePose } from './athlete';
import { add, createVolumePainter, cross, dot, mixJoint, perpendicular, stretch, subtract, unit, up } from './volumes';
import type { Joint } from './athlete';
import type { Kit } from './roster';
import type { Camera, Ring } from './volumes';

const smoothProfile = [[0, 0, 0], [.13, .67, .67], [.31, .93, .93], [.55, 1, 1], [.78, .84, .84], [1, 0, 0]] as const;
const compactProfile = [[0, 0, 0], [.23, .86, .86], [.64, 1, 1], [.88, .62, .62], [1, 0, 0]] as const;
const portraitProfile: readonly Ring[] = Array.from({ length: 11 }, (_, index) => {
  const angle = index * Math.PI / 10;
  return [(1 - Math.cos(angle)) / 2, Math.sin(angle), Math.sin(angle)];
});
const graphite = '#26323e';
const white = '#eef0e6';
const carbon = '#182733';

export function createPlayerArt() {
  const volume = createVolumePainter();

  function draw(ctx: CanvasRenderingContext2D, pose: ReturnType<typeof athletePose>, kit: Kit, camera: Camera, detail: number): void {
    volume.begin(camera, detail);
    const right = unit(subtract(pose.shirt[1], pose.shirt[0]));
    const front = cross(up, right);
    const skin = kit.skin ?? '#dfab87';
    const trim = kit.trim;
    const tank = kit.cut === 'sleeveless';
    const fit = tank ? .91 : kit.cut === 'polo' ? 1.03 : 1;
    const fabricSide = (sector: number) => sector % Math.floor(detail / 2) === 0 ? trim : undefined;
    const neckBase = mixJoint(pose.shirt[0], pose.shirt[1], .5);
    const hips = mixJoint(pose.shirt[2], pose.shirt[3], .5);
    const collar = add(neckBase, stretch(up, .065));
    const longHair = kit.haircut === 'bob' || kit.haircut === 'curls';
    const ballShape = (center: Joint, rx: number, ry: number, rz: number, color: string, highDetail = false) => {
      const profile = highDetail ? detail > 12 ? portraitProfile : smoothProfile : compactProfile;
      volume.surface(add(center, stretch(up, -rz)), add(center, stretch(up, rz)), right,
        profile.map(([position, width, depth]): Ring => [position, width * rx, depth * ry]), color);
    };
    const sleeve = (a: Joint, b: Joint, fromRadius: number, toRadius: number, color: string, edge?: string) => {
      volume.surface(a, b, right, [[0, fromRadius * .76, fromRadius * .76], [.18, fromRadius, fromRadius],
        [.86, toRadius, toRadius], [1, toRadius * .78, toRadius * .78]], color, (band) => band === 2 ? edge : undefined);
    };

    for (const { hip, knee, ankle, toe } of pose.legs) {
      const cuff = mixJoint(hip, knee, .67);
      const sock = mixJoint(ankle, knee, .24);
      sleeve(hip, cuff, .128, .109, kit.shorts, trim);
      volume.surface(cuff, knee, right, [[0, .091, .085], [.37, .087, .080], [.79, .064, .064], [1, .067, .061]], skin);
      volume.surface(knee, sock, right, [[0, .064, .061], [.21, .074, .080], [.44, .072, .083], [.81, .048, .052], [1, .045, .047]], skin);
      sleeve(sock, ankle, .052, .046, white);
      const heel = mixJoint(toe, ankle, 1.36);
      const end = mixJoint(ankle, toe, 1.47);
      const sole: Ring[] = [[0, .02, .02], [.23, .078, .034], [.79, .080, .033], [1, .023, .017]];
      volume.surface(add(heel, stretch(up, -.033)), add(end, stretch(up, -.021)), right, sole, graphite);
      volume.surface(add(heel, stretch(up, .015)), add(end, stretch(up, .029)), right,
        [[0, .014, .017], [.22, .072, .055], [.59, .075, .041], [1, .017, .014]], white, (band, sector) => band === 1 && sector % 3 === 0 ? trim : undefined);
      const lace = add(mixJoint(ankle, toe, .58), stretch(up, .07));
      volume.line([add(lace, stretch(right, -.046)), add(lace, stretch(right, .044))], '#d2d8d6', .013);
    }

    const hipAxis = unit(subtract(pose.legs[1].hip, pose.legs[0].hip));
    volume.surface(add(hips, stretch(up, -.115)), add(hips, stretch(up, .067)), hipAxis,
      [[0, .175 * fit, .115], [.40, .202 * fit, .142], [.85, .193 * fit, .130], [1, .183 * fit, .120]], kit.shorts,
      band => band === 2 ? trim : undefined);
    volume.surface(add(hips, stretch(up, -.035)), collar, right,
      [[0, .168 * fit, .112], [.12, .197 * fit, .132], [.24, .187 * fit, .129], [.58, .226 * fit, .148], [.82, .252 * fit, .124], [1, .164 * fit, .102]], kit.shirt,
      (band, sector) => band === 0 ? kit.shorts : tank && band === 4 ? '#dbd2ed' : fabricSide(sector));
    if (tank) {
      const hem = add(hips, stretch(up,-.23));
      volume.surface(hem, add(hips,stretch(up,.08)), hipAxis,
        [[0,.254,.187],[.075,.249,.182],[.34,.228,.158],[.78,.191,.136],[1,.180,.126]], kit.shirt,
        (band,sector) => band === 0 || band === 3 ? trim : sector % 4 === 1 ? '#a18bb8' : undefined);
    } else {
      const yoke = mixJoint(hips,collar,.66);
      volume.surface(yoke, collar, right, [[0,.233,.150],[.23,.253,.145],[.54,.259,.132],[1,.167,.104]], trim,
        (band,sector) => band === 0 ? white : sector % detail < 2 ? kit.shirt : undefined);
    }
    volume.surface(mixJoint(neckBase, collar, .83), mixJoint(pose.neck, pose.head, .63), right,
      [[0, .093, .084], [.24, .092, .079], [.55, .071, .067], [1, .070, .066]], skin, (band) => band === 0 ? trim : undefined);
    if (kit.cut === 'polo') {
      const lapel = add(collar, stretch(front, .104));
      const button = add(lapel, add(stretch(front, .029), stretch(up, -.178)));
      volume.line([add(lapel, stretch(right, -.073)), button, add(lapel, stretch(right, .073))], '#71818a', .013);
    } else if (kit.cut === 'crew') {
      const stripe = add(mixJoint(neckBase, hips, .32), stretch(front, .145));
      volume.line([add(stripe, stretch(right, -.124)), add(stripe, stretch(right, .124))], '#c4dee0', .018);
    }

    // Raglan seams follow the shoulder blades when the player uncoils.
    for (const side of [-1, 1]) {
      const nape = add(collar, add(stretch(front, -.087), stretch(right, side * .075)));
      const blade = add(mixJoint(neckBase, hips, .22), add(stretch(front, -.132), stretch(right, side * .143)));
      const flank = add(mixJoint(neckBase, hips, .44), add(stretch(front, -.089), stretch(right, side * .198)));
      volume.line([nape, blade, flank], trim, tank ? .018 : .013);
    }

    for (const [index, { shoulder, elbow, hand }] of pose.arms.entries()) {
      const cuff = mixJoint(shoulder, elbow, .48);
      ballShape(mixJoint(shoulder, elbow, .12), tank ? .083 : .097, .087, .095, tank ? skin : kit.shirt);
      const wrist = mixJoint(elbow, hand, .81);
      sleeve(shoulder, cuff, tank ? .078 : .097, tank ? .066 : .084, tank ? skin : kit.shirt, tank ? undefined : trim);
      volume.surface(cuff, elbow, right, [[0,.068,.065],[.24,.073,.071],[.50,.071,.067],[.82,.055,.054],[1,.056,.052]], skin);
      ballShape(elbow,.054,.053,.052,skin);
      volume.surface(elbow, wrist, right, [[0, .053, .054], [.18, .065, .059], [.47, .056, .052], [1, .038, .039]], skin);
      sleeve(wrist, hand, .044, .043, index === 1 ? trim : skin);
      const palmAxis = unit(subtract(hand, wrist));
      volume.surface(wrist, add(hand, stretch(palmAxis,.052)), right,
        [[0,.038,.033],[.31,.048,.037],[.65,.055,.039],[.84,.049,.035],[1,.026,.022]], skin);
      const thumb = add(hand, stretch(right,index ? -.036 : .036));
      ballShape(thumb,.021,.026,.038,skin);
    }

    const head = pose.head;
    const faceRight = pose.headRight;
    const faceFront = cross(up, faceRight);
    if (longHair) {
      const nape = add(head, add(stretch(faceFront, -.057), stretch(up, -.028)));
      ballShape(nape, .144, .134, kit.haircut === 'curls' ? .184 : .159, kit.hair, true);
    }
    const chin = add(head, add(stretch(up, -.158), stretch(faceFront, .016)));
    const crown = add(head, stretch(up, .153));
    volume.surface(chin, crown, faceRight, [[0,.037,.039],[.09,.070,.070],[.24,.096,.091],
      [.44,.120,.111],[.59,.122,.119],[.76,.115,.114],[.89,.089,.092],[.97,.050,.057],[1,.014,.016]], skin);
    for (const direction of [-1, 1]) {
      const ear = add(head, add(stretch(faceRight, direction * .115), stretch(up, -.031)));
      ballShape(ear, .024, .032, .034, skin);
      if (kit.haircut === 'bob') ballShape(add(ear, stretch(up, -.034)), .013, .013, .018, '#dadad0');
    }
    if (dot(faceFront, subtract(camera.eye, head)) > 0) {
      const nose = add(head, add(stretch(faceFront, .110), stretch(up, -.009)));
      ballShape(nose, .025, .031, .040, skin);
      for (const side of [-1, 1]) {
        const eye = add(head, add(stretch(faceRight, .044 * side), add(stretch(faceFront, .117), stretch(up, .024))));
        volume.line([add(eye, stretch(faceRight, -.017)), add(eye, stretch(faceRight, .017))], detail > 12 ? '#b6a59c' : '#343037', .014);
        if (detail > 12) {
          const pupil = add(eye, stretch(faceFront, .004));
          volume.line([add(pupil, stretch(up, -.005)), add(pupil, stretch(up, .005))], '#352e31', .012);
          const brow = add(eye, stretch(up, .020));
          volume.line([add(brow, stretch(faceRight, -.018)), add(brow, stretch(faceRight, .018))], kit.hair, .010);
        }
      }
      const mouth = add(head, add(stretch(faceFront, .104), stretch(up, -.063)));
      volume.line([add(mouth, stretch(faceRight, -.022)), add(mouth, stretch(faceRight, .018))], '#805351', .012);
    }

    if (kit.cap) {
      const crown = add(head, stretch(up, .084));
      volume.surface(add(crown, stretch(up, -.013)), add(crown, stretch(up, .118)), faceRight,
        [[0, .133, .128], [.37, .138, .125], [.78, .108, .098], [1, .02, .021]], kit.shirt, (band) => band === 0 ? trim : undefined);
      const brim = add(crown, stretch(faceFront, .073));
      volume.surface(brim, add(brim, stretch(faceFront, .148)), faceRight, [[0, .126, .019], [.54, .120, .019], [1, .053, .011]], trim);
    } else {
      const hairline = add(head, add(stretch(faceFront, -.012), stretch(up, .058)));
      const quiff = kit.haircut === 'quiff';
      volume.surface(hairline, add(hairline, add(stretch(faceFront, quiff ? .038 : 0), stretch(up, quiff ? .145 : .116))), faceRight,
        [[0, .127, .112], [.27, .134, .121], [.70, .111, .096], [1, .004, .006]], kit.hair);
      if (longHair) {
        for (const side of [-1, 1]) {
          const lock = add(head, add(stretch(faceRight, side * .093), add(stretch(faceFront, -.021), stretch(up, -.045))));
          ballShape(lock, .049, .084, .111, kit.hair);
        }
      }
    }

    drawRacket(pose.racket.wrist, pose.racket.tip, pose.racket.faceAxis ?? right, trim);
    volume.flush(ctx);
  }

  function drawRacket(wrist: Joint, center: Joint, right: Joint, trim: string): void {
    const long = unit(subtract(center, wrist));
    const across = perpendicular(long, right);
    const point = (x: number, y: number) => add(center, add(stretch(across, x * .151), stretch(long, y * .205)));
    const hoop = Array.from({ length: 17 }, (_, i) => point(Math.cos(i * Math.PI / 8), Math.sin(i * Math.PI / 8)));
    const neck = mixJoint(wrist, point(0, -1), .50);
    volume.line([add(wrist, stretch(long, -.058)), neck], carbon, .047);
    volume.line([wrist, neck], graphite, .034);
    volume.line([neck, point(-.52, -.85)], carbon, .033);
    volume.line([neck, point(.52, -.85)], carbon, .033);
    for (const x of [-.72, -.36, 0, .36, .72]) {
      const y = Math.sqrt(1 - x * x) * .94;
      volume.line([point(x, -y), point(x, y)], '#e9eddfb8', .010);
    }
    for (const y of [-.59, -.29, 0, .29, .59]) {
      const x = Math.sqrt(1 - y * y) * .94;
      volume.line([point(-x, y), point(x, y)], '#e9eddfb8', .010);
    }
    volume.line(hoop, carbon, .047);
    volume.line(hoop.slice(0, 9), '#e9ecde', .023);
    volume.line(hoop.slice(8), trim, .022);
  }

  function portrait(canvas: HTMLCanvasElement, kit: Kit, side: -1 | 1): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ratio = Math.min(2, devicePixelRatio || 1);
    const width = 184;
    const height = 192;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const eye = { x: side * 1.65, y: 4.25, z: 1.82 };
    const focus = { x: 0, y: 0, z: 1.18 };
    const depth = unit(subtract(focus, eye));
    const horizontal = unit(cross(depth, up));
    const vertical = cross(horizontal, depth);
    const camera: Camera = { eye, project: (x, y, z) => {
      const delta = subtract({ x, y, z }, eye);
      const scale = 670 / Math.max(1, dot(delta, depth));
      return { x: width * .5 + dot(delta, horizontal) * scale, y: height * .58 - dot(delta, vertical) * scale, scale };
    } };
    const pose = athletePose({ runner: { x: 0, y: 0, vx: 0, vy: 0 }, tick: 0, forward: 1, charge: .2,
      preparing: true, swing: 1, wing: 'Diritto', kind: 'ground', impact: null, toss: null, reaction: null, motion: kit.motion });
    draw(ctx, pose, kit, camera, 22);
  }

  return { draw, portrait };
}
