export default function devShowcase() {
  return {
    name: 'dev-showcase',
    hooks: {
      'astro:config:setup': ({ command, injectRoute }) => {
        if (command === 'dev') {
          injectRoute({ pattern: '/404-preview', entrypoint: new URL('../src/dev/not-found.astro', import.meta.url) });
          injectRoute({ pattern: '/showcase', entrypoint: new URL('../src/dev/showcase.astro', import.meta.url) });
        }
      },
    },
  };
}
