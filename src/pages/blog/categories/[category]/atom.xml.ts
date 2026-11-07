import { getPosts, getCategories, AUTHOR, type Post } from '../../../../lib/posts';
import { atomFeed } from '../../../../lib/feed';
import type { APIRoute } from 'astro';

export async function getStaticPaths() {
  return getCategories(await getPosts()).map((category) => ({
    params: { category: category.slug }, props: category,
  }));
}

export const GET: APIRoute = ({ props }) => {
  const { slug, name, posts } = props as { slug: string; name: string; posts: Post[] };
  return new Response(atomFeed(posts.slice(0, 5), `/blog/categories/${slug}/atom.xml`, `Category: ${name} | ${AUTHOR}`), {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
};
