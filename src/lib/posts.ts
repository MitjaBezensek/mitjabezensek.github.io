import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export const SITE = 'https://bezensek.com';
export const AUTHOR = 'Mitja Bezenšek';
export const PAGE_SIZE = 5;

export async function getPosts(): Promise<Post[]> {
  return (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => Date.parse(b.data.pubDate) - Date.parse(a.data.pubDate),
  );
}

export function categorySlug(category: string): string {
  return category.toLowerCase().trim().replace(/\s+/g, '-');
}

export function getCategories(posts: Post[]) {
  const categories = new Map<string, { slug: string; name: string; posts: Post[] }>();
  for (const post of posts) {
    for (const name of new Set(post.data.categories.map(categorySlug))) {
      const category = categories.get(name) ?? {
        slug: name,
        name: name.replaceAll('-', ' '),
        posts: [],
      };
      category.posts.push(post);
      categories.set(name, category);
    }
  }
  return [...categories.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  }).format(new Date(date.slice(0, 10)));
}

export function pageUrl(page: number): string {
  return page === 1 ? '/' : `/page/${page}/`;
}
