import { defineConfig, type Plugin } from 'vitest/config';
import { viteSingleFile } from 'vite-plugin-singlefile';

/* `npm run build` writes one self-contained dist/index.html: scripts, styles and fonts inlined,
   so the game can still be shared as a single page.
   `npm run build:google-fonts` writes dist-google-fonts/index.html, the same page with the fonts linked from
   Google Fonts as the old page had them: for a claude.ai artifact frame, if fonts from data: URLs don't load there. */
const GOOGLE_FONTS =
  '<link rel="preconnect" href="https://fonts.googleapis.com">\n' +
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n' +
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Lilita+One&family=Patrick+Hand&display=swap">\n';

function fontsFromGoogle(): Plugin {
  return {
    name: 'fonts-from-google',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        const embedded = '<link rel="stylesheet" href="/src/styles/index.css">';
        if (!html.includes(embedded)) throw new Error('index.html no longer links src/styles/index.css');
        return html.replace(embedded, GOOGLE_FONTS + '<link rel="stylesheet" href="/src/styles/app.css">');
      }
    }
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [viteSingleFile(), ...(mode === 'google-fonts' ? [fontsFromGoogle()] : [])],
  build: {
    outDir: mode === 'google-fonts' ? 'dist-google-fonts' : 'dist',
    /* only the new game: legacy/index.html is served in dev for comparison, never built */
    rollupOptions: { input: 'index.html' }
  },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' }
}));
