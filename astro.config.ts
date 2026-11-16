import { defineConfig, fontProviders } from 'astro/config';
import markdownImages from './integrations/markdown-images.ts';
import { readFileSync } from 'node:fs';
import { syntaxTheme } from './src/lib/syntax-theme.ts';
import devShowcase from './integrations/dev-showcase.ts';

function fontVariants(family: string, faces: [number, ('normal' | 'italic')?][]) {
  const ranges: Record<string, string> = JSON.parse(readFileSync(new URL(import.meta.resolve(`@fontsource/${family}/unicode.json`)), 'utf8'));
  const variants = faces.flatMap(([weight, style = 'normal']) => ['latin', 'latin-ext'].map(subset => ({
    src: [`@fontsource/${family}/files/${family}-${subset}-${weight}-${style}.woff2`] as [string],
    weight, style, unicodeRange: ranges[subset].split(',') as [string, ...string[]],
  })));
  const first = variants[0];
  if (!first) throw new Error(`No font variants for ${family}`);
  return [first, ...variants.slice(1)] as [typeof first, ...typeof variants];
}

export default defineConfig({
  site: 'https://bezensek.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [markdownImages(), devShowcase()],
  fonts: [
    {
      name: 'Ioskeley Mono', cssVariable: '--font-mono', provider: fontProviders.local(),
      fallbacks: ['monospace'],
      options: { variants: [
        { src: ['./public/fonts/ioskeley-mono/IoskeleyMono-Medium.woff2'], weight: 500, style: 'normal' },
        { src: ['./public/fonts/ioskeley-mono/IoskeleyMono-Bold.woff2'], weight: 700, style: 'normal' },
      ] },
    },
    {
      name: 'Source Sans 3', cssVariable: '--font-body', provider: fontProviders.local(),
      fallbacks: ['sans-serif'],
      options: { variants: fontVariants('source-sans-3', [[400], [600], [400, 'italic']]) },
    },
  ],
  markdown: {
    shikiConfig: {
      theme: syntaxTheme,
      wrap: false,
    },
  },
});
