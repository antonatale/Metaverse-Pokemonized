import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import { GAME } from './game';

/* The whole trailer in one command, from the game as it is now:   npm run promo
     1. the clips, played and recorded from the game (capture.ts)      --skip-capture reuses the ones already there
     2. the music (music.ts, rendered by render-music.ts)               --skip-music reuses promo/work/music.wav
     3. the frames: clips, titles, code, drone shots (compose.ts)
     4. the films: promo/lotte-tra-amici-trailer.mp4 (1080p) and promo/lotte-tra-amici-trailer-light.mp4 (smaller,
        for messaging), with the encoder in encode.swift (macOS frameworks, no ffmpeg)
   The dev server is used if it is running, otherwise one is started for the run. The frames are deleted at the end
   (--keep-frames keeps them). */
const args = process.argv.slice(2), has = (k: string) => args.includes(k);
const BIN = 'promo/work/bin/encode', OUT = 'promo/lotte-tra-amici-trailer';

async function up(): Promise<boolean> { try { return (await fetch(GAME)).ok; } catch { return false; } }
function run(cmd: string, a: string[]) {
  console.log('\n> ' + cmd + ' ' + a.join(' '));
  const r = spawnSync(cmd, a, { stdio: 'inherit' });
  if (r.status !== 0) throw new Error(cmd + ' ' + a[0] + ' failed');
}

let server: ChildProcess | null = null;
if (!(await up())) {
  console.log('starting the dev server…');
  server = spawn('npx', ['vite', '--port', '5173', '--strictPort'], { stdio: 'ignore' });
  for (let i = 0; i < 120 && !(await up()); i++) await new Promise((r) => setTimeout(r, 500));
  if (!(await up())) throw new Error('the dev server did not start');
}
const t0 = Date.now();
try {
  if (!has('--skip-capture')) run('npx', ['tsx', 'tools/promo/capture.ts']);
  if (!has('--skip-music') || !fs.existsSync('promo/work/music.wav')) run('npx', ['tsx', 'tools/promo/render-music.ts']);
  run('npx', ['tsx', 'tools/promo/compose.ts']);
  if (!fs.existsSync(BIN) || fs.statSync(BIN).mtimeMs < fs.statSync('tools/promo/encode.swift').mtimeMs) {
    fs.mkdirSync('promo/work/bin', { recursive: true });
    run('swiftc', ['-O', 'tools/promo/encode.swift', '-o', BIN]);
  }
  run(BIN, ['promo/work/frames', 'promo/work/music.wav', OUT + '.mp4', '30', '14']);
  run(BIN, ['promo/work/frames', 'promo/work/music.wav', OUT + '-light.mp4', '30', '5']);
  if (!has('--keep-frames')) fs.rmSync('promo/work/frames', { recursive: true, force: true });
  console.log('\ndone in ' + Math.round((Date.now() - t0) / 60000) + ' min: ' + OUT + '.mp4 and ' + OUT + '-light.mp4');
} finally {
  if (server) server.kill();
}
