import { describe, expect, it, beforeEach } from 'vitest';
import { CHATS } from '../../src/data/chat';
import { REPLY_FX, FLOOR_GUARD } from '../../src/data/replies';
import { FLOOR_MAPS } from '../../src/data/maps/covi-floors';
import { COVI } from '../../src/data/covi';
import { st } from '../../src/save/story-progress';
import { applyReply, moodLevels, moodPrize, moodLine, backFrom, replyFx } from '../../src/story/replies';

/* What an answer in the group chat does (data/replies.ts, story/replies.ts) */
describe('the answers in the group chat', () => {
  beforeEach(() => { Object.assign(st, { beaten: {}, bag: {}, money: 0, chats: {}, moods: {}, mons: [], squad: ['antonio'], first: undefined }); });
  it('every chat with answers has a consequence for each of them, in the same order', () => {
    for (const c of CHATS) if (c.replies) expect(REPLY_FX[c.id], c.id).toHaveLength(c.replies.length);
    for (const id of Object.keys(REPLY_FX)) expect(CHATS.some((c) => c.id === id), id).toBe(true);
  });
  it('the guard who lets one by stands on the floor above the ground of his own covo', () => {
    for (const [covo, guard] of Object.entries(FLOOR_GUARD)) {
      expect(COVI[covo], covo).toBeDefined();
      const on = Object.values(FLOOR_MAPS).find((m) => (m.npcs || []).some((n) => n.trainer === guard));
      expect(on, guard).toBeDefined();
    }
  });
  it('a gift goes in the bag, money in the pocket', () => {
    applyReply('inizio', 1);
    expect(st.bag!.retino).toBe(3);
    applyReply('inizio', 2);
    expect(st.money).toBe(30);
    expect(st.chats!.inizio.fx).toBe(2);
  });
  it('a keeper written to is softened or fired up, and says so', () => {
    applyReply('eco-morgana', 0);
    expect(moodLevels('morgana')).toBe(-1);
    expect(moodPrize('morgana')).toBe(1);
    expect(moodLine('morgana')).toContain('messaggio');
    applyReply('eco-morgana', 1);
    expect(moodLevels('morgana')).toBe(1);
    expect(moodPrize('morgana')).toBe(1.5);
    applyReply('starter', 1);
    expect(moodLevels('piazza')).toBe(1);
  });
  it('a joke makes the guard of the floor above step aside', () => {
    applyReply('eco-pineta', 2);
    expect(st.beaten['tecnico-luci']).toBe(true);
  });
  it('whoever is played never writes back to himself', () => {
    st.squad = ['claudia']; (st as { first?: string }).first = 'claudia';
    expect(backFrom('inizio', replyFx('inizio', 0)!)).toBe('valentin');
    expect(backFrom('eco-morgana', replyFx('eco-morgana', 0)!)).toBe('valentin');
  });
});
