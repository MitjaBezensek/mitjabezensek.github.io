import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { lightColors, darkColors } from '../src/lib/theme.ts';

const markup = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const scripts = [...markup.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]);

function preview(url, targets, { savedTheme = null, systemDark = false, storageBlocked = false, mediaSupport = 'available' } = {}) {
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
    window: { location: new URL(url), localStorage, matchMedia: mediaSupport === 'missing' ? undefined : () => {
      if (mediaSupport === 'blocked') throw new Error('System preference is unavailable');
      return { matches: systemDark };
    } },
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

test('new visitors follow the system color scheme', () => {
  for (const systemDark of [false, true]) {
    const page = preview('https://bezensek.com/', [], { systemDark });
    assert.equal(page.dataset.paletteMode, systemDark ? 'dark' : 'light');
    assert.equal(page.button.hidden, false);
    assert.equal(page.button.ariaLabel, systemDark ? 'Switch to light mode' : 'Switch to dark mode');
  }
});

test('unavailable or unreadable system preferences fall back to light', () => {
  for (const mediaSupport of ['missing', 'blocked']) {
    const page = preview('https://bezensek.com/', [], { systemDark: true, mediaSupport });
    assert.equal(page.dataset.paletteMode, 'light');
    assert.equal(page.colors['--paper'], lightColors.paper);
    page.toggle();
    assert.equal(page.dataset.paletteMode, 'dark');
  }
});

test('saved choices override the system preference even when it cannot be read', () => {
  for (const savedTheme of ['light', 'dark']) {
    for (const mediaSupport of ['available', 'missing', 'blocked']) {
      const page = preview('https://bezensek.com/', [], { savedTheme, systemDark: savedTheme === 'light', mediaSupport });
      assert.equal(page.dataset.paletteMode, savedTheme);
    }
  }
});

test('an unrecognized saved choice follows the system preference', () => {
  const page = preview('https://bezensek.com/', [], { savedTheme: 'invalid', systemDark: true });
  assert.equal(page.dataset.paletteMode, 'dark');
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
  const page = preview('https://bezensek.com/', [], { storageBlocked: true, systemDark: true });
  assert.equal(page.dataset.paletteMode, 'dark');
  page.toggle();
  assert.equal(page.dataset.paletteMode, 'light');
  page.toggle();
  assert.equal(page.dataset.paletteMode, 'dark');
});

function luminance(hex) {
  return [0.2126, 0.7152, 0.0722].reduce((total, weight, index) => {
    const value = parseInt(hex.slice(index * 2 + 1, index * 2 + 3), 16) / 255;
    return total + weight * (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  }, 0);
}

test('old palette parameters do not override the theme or rewrite links', () => {
  for (const id of ['graphite', 'copper', 'phosphor']) {
    const page = preview(`https://bezensek.com/?palette=${id}`, ['/about/', '/atom.xml'], { savedTheme: 'dark' });
    assert.equal(page.dataset.paletteMode, 'dark');
    assert.deepEqual(page.links.map(link => link.href), ['https://bezensek.com/about/', 'https://bezensek.com/atom.xml']);
  }
});

test('palette text remains readable on panels, title bars, and background dots', () => {
  for (const palette of [{ id: 'light', colors: lightColors }, { id: 'dark', colors: darkColors }]) {
    for (const [foreground, background] of [['muted', 'paper'], ['muted', 'soft'], ['ink', 'dots'], ['on-accent', 'accent'], ['secondary', 'paper']]) {
      const [low, high] = [luminance(palette.colors[foreground]), luminance(palette.colors[background])].sort((a, b) => a - b);
      assert.ok((high + 0.05) / (low + 0.05) >= 4.5, `${palette.id}: ${foreground} on ${background}`);
    }
  }
  const { colors } = preview('https://bezensek.com/', [], { savedTheme: 'dark' });
  for (const [foreground, background] of [['muted', 'paper'], ['muted', 'soft'], ['ink', 'dots'], ['on-accent', 'accent'], ['secondary', 'paper']]) {
    const [low, high] = [luminance(colors[`--${foreground}`]), luminance(colors[`--${background}`])].sort((a, b) => a - b);
    assert.ok((high + 0.05) / (low + 0.05) >= 4.5, `dark theme: ${foreground} on ${background}`);
  }
});
