import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function setup() {
  const source = readFileSync('src/components/DevDrawer.astro', 'utf8');
  const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
  const listeners = {};
  const drawer = {
    open: false,
    showModal() { this.open = true; },
    close() { this.open = false; },
    addEventListener(type, handler) { listeners[`drawer:${type}`] = handler; },
  };
  vm.runInNewContext(script, {
    document: {
      getElementById: () => drawer,
      addEventListener(type, handler) { listeners[type] = handler; },
    },
  });
  const key = (overrides = {}) => listeners.keydown({
    key: 'D', shiftKey: true, target: { closest: () => null },
    preventDefault() {}, ...overrides,
  });
  return { drawer, listeners, key };
}

test('Shift+D toggles the drawer, ignoring typing, held keys, and other shortcuts', () => {
  const { drawer, key } = setup();
  for (const event of [
    { shiftKey: false }, { ctrlKey: true }, { metaKey: true }, { altKey: true },
    { repeat: true }, { isComposing: true }, { defaultPrevented: true },
    { target: { closest: () => ({}) } },
  ]) {
    key(event);
    assert.equal(drawer.open, false);
  }
  key();
  assert.equal(drawer.open, true);
  key();
  assert.equal(drawer.open, false);
});

test('only clicks outside the drawer panel close it', () => {
  const { drawer, listeners, key } = setup();
  key();
  listeners['drawer:click']({ target: {} });
  assert.equal(drawer.open, true);
  listeners['drawer:click']({ target: drawer });
  assert.equal(drawer.open, false);
});
