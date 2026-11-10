import { afterEach, describe, expect, it, vi } from 'vitest';
import { safeShow } from '../../src/ui/safe-show';

/* A battle never stops on a show (ui/safe-show.ts): one that throws, rejects or never ends lets the battle go on. */
describe('a show in battle', () => {
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  it('goes on when the scene throws or rejects, and says so in the console', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(safeShow(() => { throw new Error('boom'); }, 'boom')).resolves.toBeUndefined();
    await expect(safeShow(() => Promise.reject(new Error('no')), 'no')).resolves.toBeUndefined();
    expect(err).toHaveBeenCalledTimes(2);
  });
  it('goes on when the scene never ends', async () => {
    vi.useFakeTimers();
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    let done = false;
    safeShow(() => new Promise(() => {}), 'stuck').then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(7999);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toBe(true);
    expect(err).toHaveBeenCalledTimes(1);
  });
  it('waits for a scene that ends, and stays quiet', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    let ran = false;
    await safeShow(() => new Promise<void>((r) => setTimeout(() => { ran = true; r(); }, 5)), 'ok');
    expect(ran).toBe(true);
    expect(err).not.toHaveBeenCalled();
  });
});
