import { defineConfig, devices } from '@playwright/test';

/* Parity tests: every scenario runs on the old single-file game (/legacy/) and on the new build,
   with a fake clock and seeded Math.random, and the screenshots must match. */
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  fullyParallel: true,
  workers: 4,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', ...devices['Desktop Chrome'] },
  webServer: { command: 'npx vite --port 5173 --strictPort', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 60_000 }
});
