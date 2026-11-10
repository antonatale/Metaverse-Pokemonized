import { defineConfig, devices } from '@playwright/test';

/* End-to-end: whole games played with a fake clock and a seeded Math.random (playthrough.spec.ts),
   and the sound (audio.spec.ts). */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 240_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', ...devices['Desktop Chrome'] },
  webServer: { command: 'npx vite --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 60_000 }
});
