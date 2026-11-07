import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.iso.datetime({ offset: true }),
    url: z.string().regex(/^\/blog\/\d{4}\/\d{2}\/\d{2}\/[a-z0-9-]+\/$/),
    categories: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    comments: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({ title: z.string(), description: z.string() }),
});

export const collections = { posts, pages };
