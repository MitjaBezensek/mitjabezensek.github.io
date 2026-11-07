import { defineConfig, fontProviders } from 'astro/config';
import markdownImages from './integrations/markdown-images.mjs';
import { readFileSync } from 'node:fs';

function fontVariants(family, faces) {
  const ranges = JSON.parse(readFileSync(new URL(import.meta.resolve(`@fontsource/${family}/unicode.json`)), 'utf8'));
  return faces.flatMap(([weight, style = 'normal']) => ['latin', 'latin-ext'].map(subset => ({
    src: [`@fontsource/${family}/files/${family}-${subset}-${weight}-${style}.woff2`],
    weight, style, unicodeRange: ranges[subset].split(','),
  })));
}

export default defineConfig({
  site: 'https://bezensek.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [markdownImages()],
  fonts: [
    {
      name: 'Fira Code', cssVariable: '--font-mono', provider: fontProviders.local(),
      fallbacks: ['monospace'],
      options: { variants: fontVariants('fira-code', [[400], [600]]) },
    },
    {
      name: 'Source Sans 3', cssVariable: '--font-body', provider: fontProviders.local(),
      fallbacks: ['sans-serif'],
      options: { variants: fontVariants('source-sans-3', [[400], [600], [400, 'italic']]) },
    },
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
});
