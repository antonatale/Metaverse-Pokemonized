import { beforeEach, describe, expect, it } from 'vitest';
import { ROSTER, type FriendId } from '../../src/data/characters';
import { COVI, COVO_STEP } from '../../src/data/covi';
import { MAPS } from '../../src/data/maps';
import { SECOND_CITY, gateFor } from '../../src/data/gates';
import { st, resetProgress } from '../../src/save/story-progress';
import { cityCovi, covoLevel } from '../../src/story/maps';
import { myStops } from '../../src/story/goals';
import { chapterOf, typeWord } from '../../src/story/mentor';

/* The six covi (data/covi.ts): one per friend, in Formia; whoever is played meets the other five, in any order, and
   each pin makes the next covo stronger; then the train of his city. */
const play = (who: FriendId) => { resetProgress(); st.squad = [who]; st.first = who; st.seen.protagonisti = true; };

describe('the six covi', () => {
  beforeEach(() => play('antonio'));
  it('are one per friend, each with its pin, its leader standing on the map', () => {
    const leaders = Object.values(COVI).map((c) => c.leader).sort();
    expect(leaders).toEqual(ROSTER.slice().sort());
    expect(new Set(Object.values(COVI).map((c) => c.badge.id)).size).toBe(6);
    const all = Object.values(MAPS).flatMap((m) => m.npcs || []);
    for (const id of Object.keys(COVI)) expect(all.filter((n) => n.covo === id), id).toHaveLength(1);
  });
  it('whoever is played meets the other five, and never his own', () => {
    for (const who of ROSTER) {
      play(who);
      const mine = cityCovi('formia');
      expect(mine, who).toHaveLength(5);
      expect(mine.map((c) => c.leader), who).not.toContain(who);
      expect(myStops().some((s) => s.who === who), who + ' has no stop about himself').toBe(false);
    }
  });
  it('get stronger with every pin already won, whatever the order', () => {
    play('valentin');
    expect(covoLevel('piazza')).toBe(COVI.piazza.level);
    st.badges.push(COVI.circolo.badge.id, COVI.padel.badge.id);
    expect(covoLevel('piazza')).toBe(COVI.piazza.level + 2 * COVO_STEP);
    /* his own pin, should he have it from an old save, does not count: his covo is not his to beat */
    st.badges.push(COVI.eclipse.badge.id);
    expect(covoLevel('piazza')).toBe(COVI.piazza.level + 2 * COVO_STEP);
  });
  it('each one starts at his own door: Antonio at Parco la Fontana, the others at theirs (Zendavid in Scauri)', () => {
    const starts = MAPS.formia.starts || {};
    expect(Object.keys(starts).sort()).toEqual(['andrea', 'costanzo', 'forchetta', 'valentin', 'zendavid']);
    const b = (MAPS.formia.buildings || []).map((x) => x.id);
    for (const id of Object.keys(starts)) expect(b, id).toContain('casa-' + id);
    const area = (x: number, y: number) => (MAPS.formia.areas || []).find((a) => x >= a.x && x < a.x + a.w && y >= a.y && y < a.y + a.h)!.name;
    expect(area(starts.zendavid[0], starts.zendavid[1])).toBe('Scauri');
  });
  it('come in order of distance from home: Zendavid from the east, Andrea from the centre', () => {
    const covi = () => myStops().filter((s) => s.id.indexOf('covo-') === 0).map((s) => s.id);
    play('zendavid');
    expect(covi()[0]).toBe('covo-palamendola');
    play('andrea');
    expect(['covo-pineta', 'covo-piazza'], 'west, near Castellone').toContain(covi()[0]);
    expect(covi()[covi().length - 1], 'the farthest, by Parco la Fontana').toBe('covo-palamendola');
    expect(covi()).not.toContain('covo-padel');
  });
  it('lead to Torino or Milano, as each one\'s life does', () => {
    expect(SECOND_CITY).toEqual({ antonio: 'torino', zendavid: 'torino', forchetta: 'torino', valentin: 'torino', costanzo: 'milano', andrea: 'milano' });
    expect(gateFor('torino', 'andrea').station).toBe('Milano Centrale');
    expect(gateFor('torino', 'forchetta').station).toBe('Torino Porta Nuova');
    play('costanzo');
    expect(myStops()[myStops().length - 1].text).toBe('Il treno per Milano');
  });

  it('each leader has his own words for each of the other five, and none for himself', () => {
    Object.keys(COVI).forEach((k) => {
      const cv = COVI[k];
      ROSTER.filter((id) => id !== cv.leader).forEach((id) => {
        const v = cv.vs[id as FriendId];
        expect(v && v.length, k + ' → ' + id).toBeGreaterThan(0);
        v!.forEach((l) => expect(l.trim().length).toBeGreaterThan(0));
      });
      expect(cv.vs[cv.leader]).toBeUndefined();
    });
  });

  it('Cicero speaks to whoever is played: his train, and his type against each leader', () => {
    play('andrea');
    expect(chapterOf('torino')!.title).toBe('Il treno per Milano');
    expect(chapterOf('torino')!.intro.join(' ')).toContain('Milano Centrale');
    play('antonio');
    expect(chapterOf('torino')!.intro.join(' ')).toContain('Torino Porta Nuova');
    /* Calma > Caos > Cervello > Chiacchiera > Cuore > Calma */
    expect(typeWord('valentin')).toContain('il suo tipo batte il tuo');
    expect(typeWord('costanzo')).toContain('avvantaggiato');
    expect(typeWord('andrea')).toContain('tutti e due di tipo Cervello');
    expect(typeWord('zendavid')).toBeNull();
    /* the park is west of Scauri, east of everyone else */
    expect(chapterOf('starter')!.intro.join(' ')).toContain('verso est');
    play('zendavid');
    expect(chapterOf('starter')!.intro.join(' ')).toContain('verso ovest');
  });
});
