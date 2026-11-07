import { getPosts, getCategories, PAGE_SIZE, pageUrl, SITE } from '../lib/posts';
import { canonicalCategorySlug } from '../lib/categories';

export async function GET() {
  const posts = await getPosts();
  const paths = [
    '/', '/about/', '/blog/archives/', '/blog/categories/',
    ...posts.map((post) => post.data.url),
    ...getCategories(posts)
      .filter((category) => canonicalCategorySlug(category.slug) === category.slug)
      .map((category) => `/blog/categories/${category.slug}/`),
    ...Array.from({ length: Math.max(0, Math.ceil(posts.length / PAGE_SIZE) - 1) }, (_, index) => pageUrl(index + 2)),
  ];
  return new Response(`<?xml version="1.0" encoding="utf-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${paths.map((path) => `<url><loc>${SITE}${path}</loc></url>`).join('\n')}
    </urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
