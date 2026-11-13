import { describe, expect, it } from 'vitest';
import { QUIZZES } from '../../src/data/quizzes';
import { TRAINERS } from '../../src/data/trainers';
import { MAPS } from '../../src/data/maps';

/* The quizzes at the doors of the covi (data/quizzes.ts): enough questions, three different answers each, and an asker
   who stands in a covo and can be fought instead */
describe('quizzes', () => {
  for (const q of Object.values(QUIZZES)) {
    it(q.id + ' has its questions and its asker', () => {
      expect(q.pool.length).toBeGreaterThanOrEqual(q.ask);
      q.pool.forEach((Q) => expect(new Set(Q.a).size, Q.q).toBe(3));
      expect(TRAINERS[q.trainer], q.trainer).toBeDefined();
      const at = Object.values(MAPS).flatMap((m) => m.npcs || []).filter((n) => n.quiz === q.id);
      expect(at.length).toBe(1);
      expect(at[0].trainer).toBe(q.trainer);
    });
  }
});

/* a defender who stands in the way steps aside onto a free tile of his map, never onto a wall or onto someone */
describe('the defenders of the covi', () => {
  for (const [id, m] of Object.entries(MAPS)) for (const n of m.npcs || []) if (n.aside) it(id + ': ' + n.id + ' steps aside onto a free tile', () => {
    const [x, y] = n.aside!, ch = m.rows[y][x];
    expect('xW#@|+~'.indexOf(ch), ch).toBe(-1);
    expect((m.npcs || []).some((q) => q !== n && q.x === x && q.y === y)).toBe(false);
  });
});
