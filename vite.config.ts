import { defineConfig } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

/* `npm run build` writes one self-contained dist/index.html: scripts, styles and fonts inlined,
   so the game can still be shared as a single page. */
export default defineConfig({
  plugins: [viteSingleFile()],
  build: {
    /* only the new game: legacy/index.html is served in dev for comparison, never built */
    rollupOptions: { input: 'index.html' }
  },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' }
});
