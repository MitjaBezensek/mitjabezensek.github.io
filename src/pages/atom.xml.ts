import { getPosts } from '../lib/posts';
import { atomFeed } from '../lib/feed';

export async function GET() {
  return new Response(atomFeed((await getPosts()).slice(0, 20)), {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
}
