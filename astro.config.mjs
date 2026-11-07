import { defineConfig, fontProviders } from 'astro/config';
import markdownImages from './integrations/markdown-images.mjs';

export default defineConfig({
  site: 'https://bezensek.com',
  output: 'static',
  trailingSlash: 'always',
  integrations: [markdownImages()],
  fonts: [
    {
      name: 'JetBrains Mono', cssVariable: '--font-mono', provider: fontProviders.local(),
      fallbacks: ['monospace'],
      options: { variants: [
        { src: ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-400-normal.woff2'], weight: 400, style: 'normal' },
        { src: ['@fontsource/jetbrains-mono/files/jetbrains-mono-latin-600-normal.woff2'], weight: 600, style: 'normal' },
      ] },
    },
    {
      name: 'Source Sans 3', cssVariable: '--font-body', provider: fontProviders.local(),
      fallbacks: ['sans-serif'],
      options: { variants: [
        { src: ['@fontsource/source-sans-3/files/source-sans-3-latin-400-normal.woff2'], weight: 400, style: 'normal' },
        { src: ['@fontsource/source-sans-3/files/source-sans-3-latin-600-normal.woff2'], weight: 600, style: 'normal' },
        { src: ['@fontsource/source-sans-3/files/source-sans-3-latin-400-italic.woff2'], weight: 400, style: 'italic' },
      ] },
    },
    {
      name: 'Fira Code', cssVariable: '--font-code', provider: fontProviders.local(),
      fallbacks: ['monospace'],
      options: { variants: [
        { src: ['@fontsource/fira-code/files/fira-code-latin-400-normal.woff2'], weight: 400, style: 'normal' },
      ] },
    },
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: false,
    },
  },
});
