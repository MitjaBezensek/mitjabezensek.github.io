# Mitja Bezenšek’s blog

A static Astro site, with Markdown posts and GitHub Pages hosting at
[bezensek.com](https://bezensek.com).

The custom pixel-computer theme takes its visual direction from Greenhouse:
slate-blue dotted gutters, warm silver reading panels, beveled controls, and original
SVG computer artwork. The header uses a solid cream backing for readability.
JetBrains Mono is used for headings/navigation, Source Sans 3 for reading text, and
Fira Code with contextual ligatures for code blocks. Fonts are served locally; their SIL Open Font Licenses are
included in `public/licenses/`. The blue-and-coral palette supports light and dark
modes, with a header switch that remembers the reader's choice. Edit `src/styles/global.css` for theme styling and
`src/components/PixelComputer.astro` for the illustration.

`/palettes/` compares five color alternatives on the real homepage. Open a
preview to carry that palette through internal article links using a query
parameter; it does not save a preference or change the default theme. The
preview page is marked noindex and is excluded from the sitemap. Palette
values are in `src/lib/palettes.ts`.

## Local development

Use Node 24.14.1 or newer (the development version is in `.nvmrc`) and Python 3
for the migration checks. The project pins pnpm 12.18.0. If needed, install it
once with `npm install --global pnpm@12.18.0`.

```sh
nvm use
pnpm install --frozen-lockfile
pnpm run dev
```

Open the local URL printed by Astro. To inspect the production build:

```sh
pnpm run check
pnpm run build
pnpm test
pnpm run preview
```

`pnpm run test:drafts` builds with a temporary draft and a new published post.
It verifies draft exclusion and that the migration checks accept new writing,
then removes the temporary files and restores a normal build.

## Writing

Create a file in `src/content/posts/`, for example `my-new-post.md`:

```yaml
---
title: "My new post"
description: "A short description for listings and search results."
pubDate: "2026-11-07T12:00:00+01:00"
url: "/my-new-post/"
categories: [programming]
draft: false
---
```

Write regular Markdown below the frontmatter. Fenced code blocks accept
language names such as `csharp`, `typescript`, and `javascript`. Images in
`public/img/` are linked as `![Description](/img/example.png)`.

The explicit `url` sets a short root-level path independently of filenames
and dates. Use a unique lowercase, hyphenated slug and keep the URL stable.
Existing articles also have `legacyUrl` for their dated Octopress path;
retain it to preserve incoming links and the original feed identities.
New posts do not need `legacyUrl`. Avoid reserved paths such as `/about/`.
Posts have no discussion section or third-party comment scripts.

The homepage shows five articles per page. Archives, categories, Atom feeds,
and the sitemap update automatically. `/atom.xml` contains the latest twenty
articles; category feeds contain the latest five. Atom IDs retain their old
HTTP spelling as stable identities; visit links and canonicals use the short
HTTPS URLs.

## URL redirects and SEO

Published posts use `/post-name/`. Each original dated URL serves a small
redirect page with an immediate (zero-second) HTML meta refresh, a canonical
link to the short URL, and a clickable fallback. Articles, their internal
links, indexes, feeds, and the sitemap point directly to the short URL.
Redirect pages are excluded from the sitemap and never duplicate article
content. Keep the original redirects indefinitely for incoming links.

An HTTP **301 Moved Permanently** is the usual choice for this move, but
GitHub Pages cannot set custom redirect response headers. These redirect
pages therefore return HTTP 200, not an actual 301. Google treats an immediate
meta refresh as a permanent redirect; see [Google’s redirect guidance](https://developers.google.com/search/docs/crawling-indexing/301-redirects).
True HTTP 301 responses would require a proxy in front of GitHub Pages or a
host supporting redirect rules. HTTP 304 is a caching response, not a redirect.

Edit `src/content/pages/about.md` for the biography. It preserves the original
2014 copy, marked as historical.

## Draft privacy

`draft: true` excludes a post from every published route, listing, feed, and
sitemap, including during local development. `src/content/drafts/` preserves
the seven old unpublished pieces outside the loaded collections entirely.
To preview one, move it into `posts/` on a local branch and temporarily set
`draft: false` with valid post metadata. Revert that flag before publishing.

Build exclusion does **not** make a tracked draft private: anyone can read it
if its branch or history is pushed to a public repository. Keep future private
writing on local-only branches and back it up privately. Before sharing a
branch, check its complete commit range for unfinished writing. The original
drafts already existed on the public `source` branch before this migration.

`assets/` and `references/` contain original working material, including source
diagrams. They are preserved in the repository and never copied into the site.
Only `dist/` is uploaded to Pages. Keep secrets in ignored `.env` files, never
in `public/` or variables prefixed with `PUBLIC_`.

## Migration checks

`tests/legacy-site.json` records the old generated site from `master`:
29 pages, nine published articles, and sixteen Atom feeds. The verifier checks
those routes (including redirect destinations), post titles, publication dates,
code examples, images, feed IDs,
category feed membership, internal link targets, HTTPS metadata, and source
and draft exclusion. New articles are supported without changing the fixture;
intentional changes to historical content may require corresponding fixture
updates.

External links were audited on 7 November 2026. Working destinations use HTTPS,
moved resources point to their current pages, and confirmed dead links were
removed while retaining the surrounding text. The unavailable external
SourceTree screenshot was removed; the other original images remain locally
hosted. Automated-request blocks are not treated as evidence of a dead link.

## GitHub Pages cutover (not performed by this migration)

The existing Pages site serves generated HTML from `master`; editable source
lives on `source`. The migration is on `codex/astro-migration`. All work is
local until explicitly approved for publishing.

When ready to publish:

1. Select Node and install the pinned pnpm version if needed, then run the
   same checks as CI. `test:drafts` also leaves a normal production build.

   ```sh
   nvm use
   npm install --global pnpm@12.18.0
   pnpm install --frozen-lockfile
   pnpm run check
   pnpm run test:drafts
   pnpm test
   ```

2. Commit the finished migration and merge it into `source`. Review the staged
   diff for private writing before committing; the repository is public.

   ```sh
   git add -A
   git diff --cached
   git commit -m "Finish Astro blog migration"
   git switch source
   git merge --ff-only codex/astro-migration
   ```

3. In [Settings → Pages](https://github.com/MitjaBezensek/mitjabezensek.github.io/settings/pages),
   choose **GitHub Actions** as the publishing source. Keep the custom domain
   `bezensek.com`. If deployment environment rules block the workflow, allow
   `source` in the `github-pages` environment.

4. Start deployment with `git push origin source`. The workflow installs locked
   dependencies, checks, builds, and uploads only `dist/`. Wait for
   **Verify and deploy blog** to succeed in the repository's Actions tab.

5. Check the homepage, an old dated URL, images, `/atom.xml`, page 2, and the
   light/dark switch on the live domain. Enable **Enforce HTTPS** in Pages
   settings once GitHub reports the certificate ready.

Future updates are Markdown edits followed by a commit and `git push origin
source`; GitHub builds and deploys automatically. Keep `master` unchanged for
rollback. Keep the local `pre-astro` tag backed up privately: it includes
historical drafts, and pushing it publicly exposes everything reachable from it.

Because the default branch is still `master`, manual workflow dispatch may
not be available in the UI until the workflow exists on that branch too.
The `source` push trigger is the intended first-deploy path. Renaming the
default branch is a separate optional change.

To roll back, switch Pages back to **Deploy from a branch → master → /(root)**.
That branch retains the old generated site. Local tag `pre-astro` points to
the editable Octopress source (`1a77db3`); inspect it with
`git show pre-astro:path/to/file` or create a recovery branch from it.
