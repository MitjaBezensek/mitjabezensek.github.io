import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { palettes } from '../src/lib/palettes.ts';

const markup = readFileSync(new URL('../dist/palettes/index.html', import.meta.url), 'utf8');
const scripts = [...markup.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);

function preview(url, targets) {
  const links = targets.map(href => ({ href: new URL(href, url).href }));
  const colors = {};
  const ready = [];
  const context = {
    URL, URLSearchParams,
    window: { location: new URL(url) },
    document: {
      documentElement: { style: { setProperty: (name, value) => { colors[name] = value; } }, dataset: {} },
      addEventListener: (_, callback) => ready.push(callback),
      querySelectorAll: () => links,
    },
  };
  vm.createContext(context);
  for (const script of scripts) vm.runInContext(script, context);
  for (const callback of ready) callback();
  return { links, colors };
}

test('the gallery keeps five distinct explicit palette destinations', () => {
  const targets = palettes.map(palette => `/?palette=${palette.id}`);
  const { links } = preview('https://bezensek.com/palettes/', targets);
  assert.deepEqual(links.map(link => new URL(link.href).searchParams.get('palette')), palettes.map(palette => palette.id));
});

test('each palette applies and follows article links without changing feeds or external links', () => {
  for (const palette of palettes) {
    const { links, colors } = preview(`https://bezensek.com/?palette=${palette.id}`, ['/excel-rgb-color-bug/', '/atom.xml', 'https://github.com/MitjaBezensek']);
    assert.equal(colors['--accent'], palette.colors.accent);
    assert.equal(new URL(links[0].href).searchParams.get('palette'), palette.id);
    assert.equal(links[1].href, 'https://bezensek.com/atom.xml');
    assert.equal(links[2].href, 'https://github.com/MitjaBezensek');
  }
});

test('unrecognized palettes leave the default appearance and links alone', () => {
  const { colors, links } = preview('https://bezensek.com/?palette=invalid', ['/about/']);
  assert.deepEqual(colors, {});
  assert.equal(links[0].href, 'https://bezensek.com/about/');
});

function luminance(hex) {
  return [0.2126, 0.7152, 0.0722].reduce((total, weight, index) => {
    const value = parseInt(hex.slice(index * 2 + 1, index * 2 + 3), 16) / 255;
    return total + weight * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  }, 0);
}

test('palette text remains readable on panels, title bars, and background dots', () => {
  for (const palette of palettes) {
    for (const [foreground, background] of [['muted', 'paper'], ['muted', 'soft'], ['ink', 'dots'], ['on-accent', 'accent']]) {
      const [low, high] = [luminance(palette.colors[foreground]), luminance(palette.colors[background])].sort((a, b) => a - b);
      assert.ok((high + 0.05) / (low + 0.05) >= 4.5, `${palette.id}: ${foreground} on ${background}`);
    }
  }
});
