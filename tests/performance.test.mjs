import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';
import sharp from 'sharp';
import { create as readFont } from 'fontkitten';

const attributes = (tag) => Object.fromEntries(
  [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map((match) => [match[1], match[2]]),
);
const files = await readdir('dist', { recursive: true });

test('the shared monospace font contains the complete author name at both weights', async () => {
  const fonts = await Promise.all(files.filter(file => file.endsWith('.woff2'))
    .map(async file => readFont(await readFile(join('dist', file)))));
  for (const weight of [500, 700]) {
    const faces = fonts.filter(font => font.familyName.startsWith('Ioskeley Mono') && font['OS/2'].usWeightClass === weight);
    for (const character of 'Mitja Bezenšek') {
      assert.ok(faces.some(font => font.hasGlyphForCodePoint(character.codePointAt(0))), `${weight}: ${character}`);
    }
  }
});

test('content images reserve space and defer images after the first', async () => {
  let count = 0;
  for (const file of files.filter((file) => file.endsWith('.html'))) {
    const html = await readFile(join('dist', file), 'utf8');
    const images = [...html.matchAll(/<img\b[^>]*>/g)].map(([tag]) => attributes(tag));
    for (const [index, image] of images.entries()) {
      assert.ok(Number(image.width) > 0 && Number(image.height) > 0, `${file}: ${image.src} dimensions`);
      assert.equal(image.decoding, 'async');
      assert.equal(image.loading, index === 0 ? 'eager' : 'lazy', `${file}: ${image.src} loading`);
      count++;
    }
  }
  assert.ok(count >= 19, 'checked all published images');
});

test('optimized animations preserve every frame, timing, and the original GIF fallback', async () => {
  for (const [slug, name] of [
    ['the-best-way-to-get-to-know-excel-object-model', 'recordMacro'],
    ['excel-activepane-index-property-bug-and-a-workaround', 'ActivePane'],
  ]) {
    const html = await readFile(`dist/${slug}/index.html`, 'utf8');
    const picture = [...html.matchAll(/<picture>([\s\S]*?)<\/picture>/g)]
      .find(([tag]) => tag.includes(`/img/${name}.gif`));
    assert.ok(picture, `${name}: WebP picture with GIF fallback`);
    const source = attributes(picture[1].match(/<source\b[^>]*>/)[0]);
    assert.equal(source.type, 'image/webp');
    const largest = source.srcset.split(',').at(-1).trim().split(/\s+/)[0];
    const optimized = join('dist', largest);
    const original = `public/img/${name}.gif`;
    const before = await sharp(original, { animated: true }).metadata();
    const after = await sharp(optimized, { animated: true }).metadata();
    assert.equal(after.pages, before.pages);
    assert.deepEqual(after.delay, before.delay);
    assert.equal(after.loop, before.loop);
    assert.equal(after.width, before.width);
    assert.equal(after.pageHeight, before.pageHeight);
    assert.ok((await stat(optimized)).size < (await stat(original)).size);
    assert.deepEqual(await readFile(`dist/img/${name}.gif`), await readFile(original));
  }
});

test('responsive sources exist and are smaller than their original fallback', async () => {
  let count = 0;
  for (const file of files.filter((file) => file.endsWith('.html'))) {
    const html = await readFile(join('dist', file), 'utf8');
    for (const [, picture] of html.matchAll(/<picture>([\s\S]*?)<\/picture>/g)) {
      const image = attributes(picture.match(/<img\b[^>]*>/)[0]);
      const source = attributes(picture.match(/<source\b[^>]*>/)[0]);
      const largestWidth = Number(source.srcset.split(',').at(-1).trim().split(/\s+/)[1].slice(0, -1));
      assert.ok(largestWidth >= Math.min(Number(image.width), 1480), `${file}: ${image.src}: retain desktop/retina resolution`);
      for (const candidate of source.srcset.split(',')) {
        const [path, width] = candidate.trim().split(/\s+/);
        const info = await sharp(join('dist', path)).metadata();
        assert.equal(`${info.width}w`, width);
        assert.ok((await stat(join('dist', path))).size < (await stat(join('dist', image.src))).size);
      }
      count++;
    }
  }
  assert.ok(count > 0, 'checked responsive sources in published content');
});

test('only critical fonts preload, with local WOFF2 files and metric-matched fallbacks', async () => {
  const html = await readFile('dist/index.html', 'utf8');
  const preloads = [...html.matchAll(/<link\b[^>]*>/g)]
    .map(([tag]) => attributes(tag)).filter((link) => link.rel === 'preload');
  assert.equal(preloads.length, 3);
  for (const preload of preloads) {
    assert.equal(preload.as, 'font');
    assert.equal(preload.type, 'font/woff2');
    assert.ok((await stat(join('dist', preload.href))).size > 0);
    assert.match(html, new RegExp(preload.href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(html, /size-adjust:/);
  assert.match(html, /ascent-override:/);
  assert.equal(files.filter((file) => file.endsWith('.woff')).length, 0);
});
