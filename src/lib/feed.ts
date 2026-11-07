import { AUTHOR, SITE, type Post } from './posts';

export function escapeXml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export function atomFeed(posts: Post[], path = '/atom.xml', title = AUTHOR): string {
  const entries = posts.map((post) => {
    if (!post.rendered?.html) throw new Error(`Missing rendered content for ${post.id}`);
    const content = post.rendered.html.replace(
      /\b(href|src)=(['"])(\/(?!\/)[^'"]*)\2/g,
      (_, attr, quote, url) => `${attr}=${quote}${SITE}${url}${quote}`,
    );
    // Atom IDs are permanent identifiers, not the URLs used to visit the site.
    const id = `http://bezensek.com${post.data.url.slice(0, -1)}`;
    return `<entry>
      <title type="text">${escapeXml(post.data.title)}</title>
      <id>${escapeXml(id)}</id>
      <link href="${SITE}${post.data.url}"/>
      <updated>${post.data.pubDate}</updated>
      <published>${post.data.pubDate}</published>
      <content type="html">${escapeXml(content)}</content>
    </entry>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
      <title>${escapeXml(title)}</title>
      <id>http://bezensek.com/</id>
      <link href="${SITE}${path}" rel="self"/>
      <link href="${SITE}/"/>
      <updated>${posts[0]?.data.pubDate ?? '2014-03-06T00:00:00Z'}</updated>
      <author><name>${AUTHOR}</name></author>
      ${entries}
    </feed>`;
}
