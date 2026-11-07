import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { palettes } from '../src/lib/palettes.ts';

const markup = readFileSync(new URL('../dist/palettes/index.html', import.meta.url), 'utf8');
const scripts = [...markup.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);

function preview(url, targets, { savedTheme = null, systemDark = false, storageBlocked = false } = {}) {
  const links = targets.map(href => ({ href: new URL(href, url).href }));
  const colors = {};
  const ready = [];
  const dataset = {};
  const handlers = {};
  const storage = { value: savedTheme };
  const button = { hidden: true, addEventListener: (event, handler) => { handlers[event] = handler; } };
  const localStorage = {
    getItem: () => { if (storageBlocked) throw new Error('Storage is blocked'); return storage.value; },
    setItem: (_, value) => { if (storageBlocked) throw new Error('Storage is blocked'); storage.value = value; },
  };
  const context = {
    URL, URLSearchParams,
    window: { location: new URL(url), localStorage, matchMedia: () => ({ matches: systemDark }) },
    document: {
      documentElement: { style: { setProperty: (name, value) => { colors[name] = value; } }, dataset },
      addEventListener: (_, callback) => ready.push(callback),
      querySelectorAll: () => links,
      querySelector: () => button,
    },
  };
  vm.createContext(context);
  for (const script of scripts) vm.runInContext(script, context);
  for (const callback of ready) callback();
  return { links, colors, dataset, button, storage, toggle: () => { assert.equal(typeof handlers.click, 'function'); handlers.click(); } };
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

test('unrecognized palettes use the default theme and leave links alone', () => {
  const { colors, links } = preview('https://bezensek.com/?palette=invalid', ['/about/']);
  assert.equal(colors['--accent'], palettes[0].colors.accent);
  assert.equal(links[0].href, 'https://bezensek.com/about/');
});

test('the system dark preference starts with a dark blue and coral theme', () => {
  const page = preview('https://bezensek.com/', [], { systemDark: true });
  assert.equal(page.dataset.paletteMode, 'dark');
  assert.notEqual(page.colors['--paper'], palettes[0].colors.paper);
  assert.equal(page.button.hidden, false);
  assert.equal(page.button.ariaLabel, 'Switch to light mode');
});

test('the switch persists the choice across pages and can switch back', () => {
  const page = preview('https://bezensek.com/', [], { savedTheme: 'light', systemDark: true });
  assert.equal(page.dataset.paletteMode, 'light');
  page.toggle();
  assert.equal(page.dataset.paletteMode, 'dark');
  assert.equal(page.storage.value, 'dark');
  assert.equal(page.button.ariaLabel, 'Switch to light mode');
  const article = preview('https://bezensek.com/excel-rgb-color-bug/', [], { savedTheme: page.storage.value });
  assert.equal(article.dataset.paletteMode, 'dark');
  article.toggle();
  assert.equal(article.dataset.paletteMode, 'light');
  assert.equal(article.button.ariaLabel, 'Switch to dark mode');
  assert.equal(article.storage.value, 'light');
});

test('the switch works when browser storage is blocked', () => {
  const page = preview('https://bezensek.com/', [], { storageBlocked: true });
  page.toggle();
  assert.equal(page.dataset.paletteMode, 'dark');
  page.toggle();
  assert.equal(page.dataset.paletteMode, 'light');
});

test('explicit palette previews take priority over saved dark mode', () => {
  const page = preview('https://bezensek.com/?palette=copper', [], { savedTheme: 'dark' });
  assert.equal(page.colors['--accent'], palettes.find(palette => palette.id === 'copper').colors.accent);
  assert.equal(page.dataset.paletteMode, 'light');
});

function luminance(hex) {
  return [0.2126, 0.7152, 0.0722].reduce((total, weight, index) => {
    const value = parseInt(hex.slice(index * 2 + 1, index * 2 + 3), 16) / 255;
    return total + weight * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  }, 0);
}

test('palette text remains readable on panels, title bars, and background dots', () => {
  for (const palette of palettes) {
    for (const [foreground, background] of [['muted', 'paper'], ['muted', 'soft'], ['ink', 'dots'], ['on-accent', 'accent'], ['secondary', 'paper']]) {
      const [low, high] = [luminance(palette.colors[foreground]), luminance(palette.colors[background])].sort((a, b) => a - b);
      assert.ok((high + 0.05) / (low + 0.05) >= 4.5, `${palette.id}: ${foreground} on ${background}`);
    }
  }
  const { colors } = preview('https://bezensek.com/', [], { systemDark: true });
  for (const [foreground, background] of [['muted', 'paper'], ['muted', 'soft'], ['ink', 'dots'], ['on-accent', 'accent'], ['secondary', 'paper']]) {
    const [low, high] = [luminance(colors[`--${foreground}`]), luminance(colors[`--${background}`])].sort((a, b) => a - b);
    assert.ok((high + 0.05) / (low + 0.05) >= 4.5, `dark theme: ${foreground} on ${background}`);
  }
});
