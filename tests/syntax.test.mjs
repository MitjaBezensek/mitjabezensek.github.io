import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import { palettes, darkColors } from '../src/lib/palettes.ts';

const html = readdirSync('dist', { recursive: true }).filter(file => file.endsWith('.html'))
  .map(file => readFileSync(`dist/${file}`, 'utf8')).join('\n');
const css = readFileSync('src/styles/global.css', 'utf8');
const declarations = (block) => Object.fromEntries([...block.matchAll(/--code-([\w-]+):\s*([^;]+);/g)]
  .map(match => [match[1], match[2].trim()]));
function syntaxColors(colors, dark) {
  const tokens = declarations(css.match(/:root \{([^}]+)\}/s)[1]);
  if (dark) Object.assign(tokens, declarations(css.match(/:root\[data-palette-mode='dark'\] \{([^}]+)\}/s)?.[1] ?? ''));
  return Object.fromEntries(Object.entries(tokens).map(([role, value]) =>
    [role, value.startsWith('#') ? value : colors[value.match(/var\(--([\w-]+)\)/)[1]] ]));
}

test('published code uses palette-aware syntax colors instead of fixed GitHub themes', () => {
  for (const role of ['background', 'foreground', 'keyword', 'type', 'string', 'comment']) {
    assert.ok(html.includes(`var(--code-${role},`), `Rendered ${role} tokens with feed-safe fallbacks`);
  }
  assert.ok(!html.includes('github-light') && !html.includes('github-dark'));
});

function luminance(hex) {
  return [0.2126, 0.7152, 0.0722].reduce((sum, weight, index) => {
    const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    return sum + weight * (value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  }, 0);
}

test('syntax text stays readable in every light and dark palette', () => {
  for (const { colors, dark } of [...palettes, { colors: darkColors, dark: true }]) {
    const resolved = syntaxColors(colors, dark);
    assert.ok(resolved.background, 'Code background resolves');
    for (const [role, color] of Object.entries(resolved).filter(([role]) => role !== 'background')) {
      const [low, high] = [luminance(color), luminance(resolved.background)].sort((a, b) => a - b);
      assert.ok((high + .05) / (low + .05) >= 4.5, `${role} against code background`);
    }
  }
});

test('code distinguishes keywords, types, functions, strings, and numbers by color', () => {
  for (const dark of [false, true]) {
    const colors = syntaxColors(dark ? darkColors : palettes[0].colors, dark);
    assert.equal(new Set(['keyword', 'type', 'function', 'string', 'constant'].map(role => colors[role])).size, 5);
  }
});
