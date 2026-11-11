import { describe, expect, it } from 'vitest';
import { MAPS, LEGEND } from '../../src/data/maps';
import { st } from '../../src/save/story-progress';
import { setMap, route, blocked } from '../../src/story/maps';
import { LEDGES, SCARPS, TRAILS } from '../../tools/formia/network';

/* V4 of VISIONE.md: Formia on three levels. The faces of the terraces, the steps up them, the ledges one jumps down
   from and never up, the belvederi. */
describe('the relief of Formia', () => {
  const m = MAPS.formia, at = (x: number, y: number) => m.rows[y][x];
  const from = (x: number, y: number) => { st.map = 'formia'; st.x = x; st.y = y; st.mons = []; setMap('formia'); };

  it('has every scarp drawn from end to end: its face, the steps of a trail, a ledge, or a street climbing it', () => {
    SCARPS.forEach((s) => {
      const [[x0, y], [x1]] = s.pts;
      for (let x = x0; x <= x1; x++) expect(/[\^\[jH=vz]/.test(at(x, y)), s.name + ' at ' + x + ',' + y + ': ' + at(x, y)).toBe(true);
    });
  });
  it('has steps where a trail meets a scarp', () => {
    let steps = 0;
    TRAILS.forEach((t) => { for (let i = 0; i + 1 < t.pts.length; i++) { const [ax, ay] = t.pts[i], [bx, by] = t.pts[i + 1]; if (ax === bx) for (let y = Math.min(ay, by); y <= Math.max(ay, by); y++) if (at(ax, y) === 'H') steps++; } });
    expect(steps).toBeGreaterThanOrEqual(4);
  });
  it('lets one jump down every ledge, and never climb it back', () => {
    expect(LEDGES.length).toBeGreaterThanOrEqual(4);
    LEDGES.forEach(([x, y]) => {
      expect(LEGEND[at(x, y)].deco, 'ledge at ' + x + ',' + y).toBe('ledge');
      /* from the tile above, the way to the tile below is one step: the jump */
      from(x, y - 1);
      expect(blocked(setMap('formia'), x, y), 'a ledge is not walked on').toBe(true);
      expect(route(x, y + 1), 'down the ledge at ' + x + ',' + y).toEqual(['down']);
      /* from the tile below, the way up is the long way round, by the steps: never one step, and never through the ledge */
      from(x, y + 1);
      const back = route(x, y - 1);
      expect(back && back.length > 2, 'up from under the ledge at ' + x + ',' + y + ' goes round').toBe(true);
    });
  });
  it('has three belvederi, each with its own view, each reached on foot from home', () => {
    const views = (m.signs || []).filter((s) => !!s.view);
    expect(views.length).toBe(3);
    expect(new Set(views.map((s) => s.view!.id)).size).toBe(3);
    from(m.start[0], m.start[1]);
    views.forEach((s) => {
      const ways = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([a, b]) => route(s.x + a, s.y + b)).filter(Boolean);
      expect(ways.length, 'the belvedere ' + s.view!.name).toBeGreaterThan(0);
    });
  });
});
