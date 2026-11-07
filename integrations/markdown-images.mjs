import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { satteri } from '@astrojs/markdown-satteri';

// Keep the original public URLs as fallbacks; generate content-addressed WebP alternatives.
export default function markdownImages() {
  let publicDir;
  let pipelineKey;
  let watchImage;
  const prepared = new Map();
  const sources = new Map();
  const watched = new Set();
  const sizes = '(max-width: 540px) calc(100vw - 66px), (max-width: 760px) calc(100vw - 90px), (max-width: 898px) calc(100vw - 158px), 740px';

  async function prepare(src) {
    if (typeof src !== 'string' || !src.startsWith('/') || src.startsWith('//')) return;
    const pathname = decodeURIComponent(new URL(src, 'https://local.invalid').pathname);
    if (!/\.(png|jpe?g|gif|webp)$/i.test(pathname)) return;
    const file = resolve(publicDir, `.${pathname}`);
    const local = relative(publicDir, file);
    if (local.startsWith('..') || isAbsolute(local)) throw new Error(`Image outside public/: ${src}`);
    if (!watched.has(file)) {
      watchImage(file);
      watched.add(file);
    }
    const input = await readFile(file);
    const hash = createHash('sha256').update(input).update(pipelineKey).update(JSON.stringify(sharp.versions)).digest('hex').slice(0, 16);
    sources.set(pathname, hash);
    if (!prepared.has(hash)) prepared.set(hash, optimize(input, hash));
    return prepared.get(hash);
  }

  async function optimize(input, hash) {
    const metadata = await sharp(input, { animated: true }).metadata();
    const width = metadata.width;
    const height = metadata.pageHeight ?? metadata.height;
    const candidates = [];
    const widths = [...new Set([480, 960, Math.min(width, 1480)].filter((size) => size <= width))].sort((a, b) => a - b);
    for (const size of widths.toReversed()) {
      const output = await sharp(input, { animated: true })
        .resize({ width: size, withoutEnlargement: true })
        .webp({ lossless: metadata.format !== 'jpeg', quality: 82 }).toBuffer();
      if (output.length >= input.length) {
        // A smaller-only srcset would upscale on large screens. Keep the original
        // when WebP cannot improve the full-resolution image.
        if (size === widths.at(-1)) return { width, height, srcset: '' };
        continue;
      }
      const url = `/_images/${hash}-${size}.webp`;
      await writeFile(resolve(publicDir, `.${url}`), output);
      candidates.unshift(`${url} ${size}w`);
    }
    return { width, height, srcset: candidates.join(', ') };
  }

  function imagePlugin(assetKey) {
    return {
      name: `public-image-loading-${assetKey}`,
      element: {
        filter: ['img'],
        async visit(node, ctx) {
          const imageIndex = ctx.data.publicImageIndex ?? 0;
          ctx.data.publicImageIndex = imageIndex + 1;
          const image = await prepare(node.properties.src);
          if (!image) return;
          const child = { ...node, properties: { ...node.properties,
            width: image.width, height: image.height, decoding: 'async',
            loading: imageIndex === 0 ? 'eager' : 'lazy',
          } };
          ctx.replaceNode(node, image.srcset ? {
            type: 'element', tagName: 'picture', properties: {}, children: [
              { type: 'element', tagName: 'source', properties: { type: 'image/webp', srcSet: image.srcset, sizes }, children: [] },
              child,
            ],
          } : child);
        },
      },
    };
  }

  return {
    name: 'markdown-images',
    hooks: {
      'astro:config:setup': async ({ config, updateConfig, addWatchFile }) => {
        publicDir = fileURLToPath(config.publicDir);
        pipelineKey = await readFile(new URL(import.meta.url));
        watchImage = addWatchFile;
        prepared.clear();
        sources.clear();
        watched.clear();
        await rm(resolve(publicDir, '_images'), { recursive: true, force: true });
        await mkdir(resolve(publicDir, '_images'), { recursive: true });
        // Generate before Astro copies public/; the plugin also handles new images during dev.
        for (const file of await readdir(publicDir, { recursive: true })) {
          if (!file.startsWith('_images/') && /\.(png|jpe?g|gif|webp)$/i.test(file)) await prepare(`/${file}`);
        }
        // Include the asset digest in the processor config so content-store HTML is rebuilt
        // when an image changes, even when its Markdown file has not changed.
        const assetKey = createHash('sha256').update(JSON.stringify([...sources].sort())).digest('hex');
        updateConfig({ markdown: { processor: satteri({ hastPlugins: [imagePlugin(assetKey)] }) } });
      },
    },
  };
}
