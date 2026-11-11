import { describe, expect, it } from 'vitest';
import { MAPS, LEGEND } from '../../src/data/maps';
import { FORMIA_AT as AT, FORMIA_HOUSES, FORMIA_ROWS, FORMIA_SPOT } from '../../src/data/maps/formia-ground';
import { tile, METRES_PER_TILE } from '../../src/data/maps/formia-projection';
import { prepare, blocked, route, setMap, DV } from '../../src/story/maps';
import { HOME_MAPS } from '../../src/data/maps/homes';
import { MIGRATIONS, st, type StoryProgress } from '../../src/save/story-progress';

/* These check the requested geographic relationships, surface collision and save compatibility,
   independent of the rasterizer's exact pixel output. */
describe('geographic Formia', () => {
  it('uses a consistent urban scale in both axes', () => {
    const a = tile(41.26, 13.61),
      east = tile(41.26, 13.61 + 200 / 83760),
      north = tile(41.26 + 200 / 111320, 13.61);
    expect(METRES_PER_TILE).toBe(20);
    expect(east[0] - a[0]).toBe(10);
    expect(a[1] - north[1]).toBe(10);
  });
  it('keeps the CONI east of San Giovanni at a city-scale distance, and Costanzo up to its right', () => {
    const c = AT['chiesa-mola'],
      coni = AT.pista,
      home = AT['casa-costanzo'];
    expect(coni.x - c.x).toBeGreaterThan(50);
    expect(coni.x - c.x).toBeLessThan(85);
    expect(home.x).toBeGreaterThan(c.x + c.w);
    expect(home.y).toBeLessThan(c.y);
    expect(home.w * home.h).toBeLessThan(coni.w * coni.h);
  });
  it('includes every other surveyed apartment block, with stable distinct identities', () => {
    const ids = FORMIA_HOUSES.filter((h) => h.id?.startsWith('parco-')).map((h) => h.id);
    expect(ids.sort()).toEqual(
      ['6380', '6381', '6382', '6383', '6395', '6397', '6398'].map((n) => 'parco-120520' + n),
    );
    expect(new Set(ids).size).toBe(7);
    expect(Math.abs(AT.fontana.x + 0.5 - (AT['parco-corte'].x + AT['parco-corte'].w / 2))).toBeLessThan(1);
    expect(Math.abs(AT.fontana.y + 0.5 - (AT['parco-corte'].y + AT['parco-corte'].h / 2))).toBeLessThan(1);
    expect(FORMIA_SPOT.start).toEqual([AT.casa.door![0], AT.casa.door![1] + 1]);
    const g = AT.giardino;
    expect(FORMIA_ROWS[g.y + 1][g.x]).toBe('!');
    expect(LEGEND['!'].solid).toBeFalsy();
  });
  it('lets a player stand on the running surface and infield, without buildings hiding a collision wall', () => {
    const m = prepare('formia'),
      p = AT.pista;
    expect(p.h).toBeGreaterThan(p.w);
    let surface = 0;
    for (let y = p.y; y < p.y + p.h; y++)
      for (let x = p.x; x < p.x + p.w; x++) {
        expect(blocked(m, x, y), `track ${x},${y}`).toBe(false);
        if (FORMIA_ROWS[y][x] === '7') surface++;
      }
    expect(surface).toBeGreaterThan(15);
    for (const id of [
      'largo-paone',
      'altieri',
      'barber-may',
      'telaro',
      'risorgimento',
      'ospedale',
      'san-michele',
    ])
      expect(AT[id], id).toBeDefined();
  });
  it('keeps the water off the Eclipse as sea, without reclaiming a rectangular lido footprint', () => {
    const [x, y] = tile(41.247, 13.5884);
    expect(LEGEND[FORMIA_ROWS[y][x]].g).toBe('sea');
  });
  it('routes to a coastal activity over a clear approach instead of crossing encounter patches', () => {
    const before = { map: st.map, x: st.x, y: st.y, dir: st.dir };
    try {
      st.map = 'formia';
      [st.x, st.y] = FORMIA_SPOT.start;
      const m = setMap('formia'),
        [x, y] = FORMIA_SPOT['bagnino-oriente'];
      const wild = (x: number, y: number) => /^(tall|pools)$/.test(m.cell(x, y).deco || '');
      const paths = Object.values(DV)
        .map(([a, b]) => [x + a, y + b])
        .filter(([a, b]) => !blocked(m, a, b) && !wild(a, b))
        .map(([a, b]) => ({ path: route(a, b), x: a, y: b }))
        .filter((p) => p.path);
      expect(paths.length).toBeGreaterThan(0);
      let a = st.x,
        b = st.y;
      for (const d of paths[0].path!) {
        a += DV[d][0];
        b += DV[d][1];
        if (d === 'down' && m.cell(a, b).deco === 'ledge') b++;
        expect(wild(a, b)).toBe(false);
      }
      expect([a, b]).toEqual([paths[0].x, paths[0].y]);
    } finally {
      Object.assign(st, before);
      setMap(before.map);
    }
  });
  it('gives each friend a different floor plan and safe places for the creatures that wait at home', () => {
    expect(new Set([MAPS.casa, ...Object.values(HOME_MAPS)].map((m) => m.rows.join('\n'))).size).toBe(6);
    for (const [id, m] of Object.entries(HOME_MAPS))
      for (const [x, y] of m.homeSpots!) {
        expect(LEGEND[m.rows[y][x]].solid, `${id} pet ${x},${y}`).toBeFalsy();
        expect(
          m.signs?.some((s) => s.x === x && s.y === y),
          `${id} pet on a prop`,
        ).toBe(false);
      }
  });
  it('keeps the bed and furniture reachable with six creatures waiting at home', () => {
    for (const [id, m] of Object.entries(HOME_MAPS)) {
      const pets = new Set(m.homeSpots!.map(([x, y]) => x + ',' + y)),
        props = new Set(m.signs!.map((s) => s.x + ',' + s.y));
      const q = [[m.start[0], m.start[1]]],
        seen = new Set(q.map((p) => p.join(','))),
        dirs = Object.values(DV);
      for (let i = 0; i < q.length; i++)
        for (const [a, b] of dirs) {
          const x = q[i][0] + a,
            y = q[i][1] + b,
            k = x + ',' + y,
            ch = m.rows[y]?.[x];
          if (!ch || LEGEND[ch].solid || pets.has(k) || props.has(k) || seen.has(k)) continue;
          seen.add(k);
          q.push([x, y]);
        }
      for (const s of m.signs!) {
        const reachable = dirs.some(
          ([a, b]) =>
            seen.has(s.x + a + ',' + (s.y + b)) ||
            (LEGEND[m.rows[s.y + b]?.[s.x + a]]?.reach &&
              seen.has(s.x + a * 2 + ',' + (s.y + b * 2))),
        );
        expect(reachable, id + ': ' + s.text[0]).toBe(true);
      }
    }
  });
  it('relocates old indoor saves when the new room plan would put the player in a wall', () => {
    const v = { map: 'casa-zendavid', x: 8, y: 2, dir: 'down' } as StoryProgress;
    MIGRATIONS.find((m) => m.id === 'formia8')!.run(v);
    expect([v.x, v.y, v.dir]).toEqual(MAPS['casa-zendavid'].start);
    expect(v.map).toBe('casa-zendavid');
  });
});
