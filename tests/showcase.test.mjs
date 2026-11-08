import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
import devShowcase from '../integrations/dev-showcase.mjs';

test('showcase route is registered only by the development server', () => {
  for (const command of ['dev', 'build', 'preview', 'sync']) {
    const routes = [];
    devShowcase().hooks['astro:config:setup']({ command, injectRoute: route => routes.push(route) });
    assert.deepEqual(routes.map(route => route.pattern), command === 'dev' ? ['/404-preview', '/showcase'] : []);
  }
});

test('development showcase and obsolete palette preview are absent from production', () => {
  assert.equal(existsSync('dist/palettes'), false);
  assert.equal(existsSync('dist/showcase'), false);
  assert.equal(existsSync('dist/404-preview'), false);
  for (const file of readdirSync('dist', { recursive: true }).filter(file => /\.(html|js|css|xml)$/.test(file))) {
    const body = readFileSync(`dist/${file}`, 'utf8');
    assert.ok(!body.includes('?palette='), `${file}: no preview links`);
    assert.ok(!body.includes('showcase-page'), `${file}: no development showcase markup or styles`);
    assert.ok(!body.includes('href="/showcase/"'), `${file}: no development navigation link`);
    assert.ok(!body.includes('Showcase interaction example'), `${file}: no development script`);
    assert.ok(!body.includes('dev-drawer'), `${file}: no development drawer markup, styles, or script`);
  }
});
