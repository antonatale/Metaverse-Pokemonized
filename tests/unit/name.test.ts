import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { GAME_NAME, gameTitle } from '../../src/data/growth';

/* The game's name is in one place (GAME_NAME): the page, the README and the code all say it, and the old one is gone
   from what the player sees. The save keys keep the old name on purpose: lotte-tra-amici:* never changes. */
const root = path.resolve(__dirname, '../..');
function files(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]));
}

describe('the name of the game', () => {
  it('is the page\'s title and the README\'s', () => {
    expect(fs.readFileSync(path.join(root, 'index.html'), 'utf8')).toContain('<title>' + gameTitle() + '</title>');
    expect(fs.readFileSync(path.join(root, 'README.md'), 'utf8').split('\n')[0]).toBe('# ' + gameTitle());
    expect(GAME_NAME.name).toBe('Telepilo');
  });
  it('is on a page that says it is in Italian, with its own icon (no request for a missing favicon)', () => {
    const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    expect(html).toContain('<html lang="it">');
    expect(html).toMatch(/<link rel="icon" href="data:image\/svg\+xml,/);
  });
  it('is the only one the code shows: the old one is left only in the save keys', () => {
    for (const f of files(path.join(root, 'src'))) {
      const s = fs.readFileSync(f, 'utf8');
      expect(/lotte tra amici/i.test(s.replace(/lotte-tra-amici:/g, '')), f).toBe(false);
    }
  });
});
