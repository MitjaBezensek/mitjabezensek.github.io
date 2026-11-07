# Mitja Bezenšek’s blog

Personal blog built with Astro and Markdown, published at
[bezensek.com](https://bezensek.com) through GitHub Pages.

- [Start locally](#local-development)
- [Write and edit posts](#writing-posts)
- [Publish an update](#publishing-updates)
- [Find files](#repository-map)
- [Handle private drafts](#draft-privacy)
- [Configure the domain and HTTPS](#domain-and-https)
- [Configure GitHub Pages](#github-pages-configuration)

## Local development

Run these commands from the repository root. You need Node.js 24.14.1 or
newer, pnpm 12.18.0, and Python 3. `.nvmrc` pins the development Node version;
`package.json` pins pnpm. If needed, install pnpm once with
`npm install --global pnpm@12.18.0`.

```sh
nvm use
pnpm install --frozen-lockfile
pnpm dev
```

Open the URL printed by Astro. The development server updates as you save
Markdown, components, or styles. Stop it with Ctrl+C.

| Command | Use it for |
| --- | --- |
| `pnpm dev` | Write and preview with live updates. |
| `pnpm run check` | Check Astro and TypeScript. |
| `pnpm build` | Generate the static site in `dist/`. |
| `pnpm preview` | Serve the existing production build locally. |
| `pnpm run deploy` | Verify committed work on `source` and push it to trigger GitHub Pages. |
| `pnpm run deploy --dry-run` | Run deployment checks and print the push step without publishing. |
| `pnpm test` | Verify the built site, themes, image loading, animation integrity, and font setup; build first. |
| `pnpm run test:drafts` | Verify draft exclusion, new posts, and image replacement cache invalidation, then leave a normal build. |

For a production preview:

```sh
pnpm run check
pnpm build
pnpm test
pnpm preview
```

The preview server serves `dist/`; rebuild and refresh after further edits.
Generated files in `dist/` and `.astro/` are ignored by Git.

## Writing posts

Create a Markdown file in `src/content/posts/`, such as `my-new-post.md`:

````md
---
title: "My new post"
description: "A short summary for article lists and search results."
pubDate: "2026-01-01T12:00:00Z"
url: "/my-new-post/"
categories: [programming]
draft: false
---

Start the article here. Use regular Markdown for paragraphs, headings,
lists, links, and images.

## A section heading

```typescript
const message = "Hello, world";
```
````

Replace the example date with the post's publication date, including its time
and timezone offset. `title`, `description`, `pubDate`, and `url` are required.
`categories` is optional and defaults to an empty list. `draft` defaults to
`false`; set it explicitly when keeping a post unpublished.

The URL is independent of the filename. Use a unique, lowercase, hyphenated
slug such as `/my-new-post/`. Keep published URLs stable, and avoid routes
already used by pages, such as `/about/`, `/showcase/`, and `/page/2/`.
A future `pubDate` does not schedule a post: only `draft: true` hides it.

Use the post's own title for the page heading; start body sections at `##`.
Fenced code blocks accept names such as `csharp`, `typescript`, and
`javascript`. Code blocks use Fira Code.

For an existing post, edit its Markdown file and keep its `url`, publication
date, and `legacyUrl` unless you intend to change those identities.
`legacyUrl` belongs to migrated articles: it preserves the old dated redirect
and Atom entry ID. New posts do not need it.

### Images

Put images under `public/img/`, preferably grouped by post:

```text
public/img/my-new-post/diagram.png
```

Reference them using a root-relative URL and descriptive alternative text:

```md
![State transitions in the example machine](/img/my-new-post/diagram.png)
```

Everything in `public/` is copied to the live site, even if the post using it
is a draft. Keep private draft assets outside that directory until publishing.

Images in Markdown get width and height automatically, so they reserve their
space before loading. The first image loads normally; subsequent images use
native lazy loading and asynchronous decoding. Builds create responsive WebP
alternatives under `public/_images/` when they are smaller, preserving animation
and keeping the original files and URLs as fallbacks. This generated directory
is ignored by Git; continue adding images to `public/img/` as usual. Replacing
an image restarts the development server automatically to refresh its metadata
and optimized copies.

### About and automatic pages

Edit `src/content/pages/about.md` for the biography and
`src/pages/about.astro` for its page layout.

The homepage shows five posts per page, newest first. Archives, categories,
Atom feeds, and the sitemap update automatically. Category display names live
in `src/lib/categories.ts`; duplicate Excel tags share one browsing destination,
while the historical `excel-excel` page and feed remain available. `/atom.xml` contains the
latest twenty articles; category feeds contain the latest five. Posts have
no discussion section or third-party comment scripts.

## Publishing updates

Use `source`, the repository’s default branch, for writing and publishing.
Start a writing session with:

```sh
git switch source
git pull --ff-only origin source
```

Edit and preview your post. Stage the post and its images, review the diff,
commit, and deploy:

```sh
git add src/content/posts/my-new-post.md public/img/my-new-post/
git diff --cached
git commit -m "Publish my new post"
pnpm run deploy
```

Use your actual filenames and omit the image directory if there are no new
images. For edits to About or other files, stage those paths instead.
Keep commit messages focused on the change, such as `Fix a code example in
powerset construction` or `Update the About biography`.

`pnpm run deploy` requires a clean `source` branch. It fetches `origin/source`,
stops if your branch is behind or has diverged, then runs `check`, `test:drafts`,
and `test`. After checking that the branch, commit, and working tree still match,
it pushes only the verified commit to `source`, without tags. It does not stage
or commit files for you. GitHub Actions then builds and publishes the site.

To run the same verification without pushing:

```sh
pnpm run deploy --dry-run
```

Use `pnpm run deploy` in full: `pnpm deploy` is pnpm's separate built-in
command for packaging workspace dependencies.

A push to `source` runs **Verify and deploy blog** in
[GitHub Actions](https://github.com/MitjaBezensek/mitjabezensek.github.io/actions).
It installs locked dependencies, checks, builds, tests, and deploys only
`dist/`. Pull requests targeting `source` run checks without deploying.
Wait for a successful deployment, then check the changed page on
[bezensek.com](https://bezensek.com).

Use pnpm for dependency changes too: `pnpm add` for runtime dependencies and
`pnpm add -D` for development tools. Commit `package.json` and
`pnpm-lock.yaml` together, plus `pnpm-workspace.yaml` if its settings change.
The workspace file includes a scoped dependency fix required by the current
Astro checker.

## Repository map

| Path | Contents |
| --- | --- |
| `src/content/posts/` | Published articles and posts marked as drafts. |
| `src/content/pages/about.md` | Editable About biography. |
| `src/content/drafts/` | Content outside the loaded collections; excluded from builds. |
| `public/img/`, `public/about/` | Images copied directly to the site. |
| `src/layouts/Base.astro` | Shared header, navigation, metadata, and footer. |
| `src/pages/` | Page templates, article routes, archives, feeds, and redirects. |
| `src/styles/global.css` | Typography, spacing, and shared theme styles. |
| `src/lib/theme.ts` | Shared light and dark color tokens. |
| `src/components/ThemeScript.astro` | System theme detection, saved preference, and theme switching. |
| `src/dev/showcase.astro` | Development-only component showcase. |
| `integrations/dev-showcase.mjs` | Registers `/showcase/` only for `pnpm dev`. |
| `src/components/PixelComputer.astro` | Pixel computer illustration. |
| `src/lib/posts.ts` | Site identity, post ordering, categories, and page size. |
| `tests/` | Migration preservation, theme, and draft checks. |
| `scripts/deploy.mjs` | Local verification and publishing shortcut for the `source` branch. |
| `.github/workflows/pages.yml` | Automated checks and GitHub Pages deployment. |
| `assets/`, `references/` | Original working material; excluded from the built site. |
| `dist/` | Generated production site; do not edit it. |

## Theme

The theme follows the system color scheme unless the reader has saved a choice
with the sun/moon toggle. If the system preference cannot be read, it defaults
to light mode.

Fonts are self-hosted WOFF2 files with metric-matched fallbacks. The heading and
regular body faces preload four small files for their Latin and extended Latin
subsets. These cover characters such as `š`; other weights and styles load when needed.
Font, CSS, and optimized image filenames change with their contents,
allowing cached assets to be reused safely. GitHub Pages sets the HTTP cache
headers; this repository cannot override them with a `_headers` file.

The custom pixel-computer theme uses dotted gutters, ivory reading panels,
beveled controls, and SVG computer artwork. The header uses a solid cream
backing for readability.
The site uses two font families: Fira Code for headings, navigation, and code
blocks (with contextual ligatures), and Source Sans 3 for reading text.
Reading text is 18px on desktop and 16px on phones, with a 76ch maximum
reading measure. Functional labels are at least 12px; navigation controls
have a 44px minimum height. The compact mobile hero keeps writing near the top.
Fonts are served locally; their SIL Open Font Licenses are
included in `public/licenses/`. The blue-and-coral palette supports light and dark
modes. Edit `src/styles/global.css` for theme styling and
`src/components/PixelComputer.astro` for the illustration.
The header icon and favicon share `src/assets/site-icon.svg`. The header follows
the selected site palette; the standalone favicon adapts to the system theme.

Shared styling values live in the stylesheet's `:root`: `--space-*` for spacing,
`--text-*` for font sizes, and weight, line-height, and link variables. Ordinary
text links share the underline, color, and hover rules; navigation buttons and
article titles have explicit treatments. Homepage and archive title links share
the `.post-title` class. Internal navigation uses →; external links use ↗.
The Writing tab stays active on articles, archives and category pages. Palette colors live only in
`src/lib/theme.ts`: the theme component generates the no-script CSS defaults
and applies the selected palette. Shared panel and control shadow tokens retain
the retro bevels. Page gutters, section spacing and list rows use semantic
spacing tokens; heading sizes and tracking are shared across page types.

Syntax highlighting uses the custom Shiki theme in `src/lib/syntax-theme.mjs`.
Its `--code-*` variables in the global stylesheet reference the same palette
colors: coral keywords and blue functions, with dedicated teal types, green
strings, amber constants, and muted comments. The dedicated colors have light
and dark variants. Code panels use the soft-panel background in both themes. Publishing checks verify highlighted output and text contrast.

### Component showcase

Run `pnpm dev` and open `/showcase/` on the URL Astro prints. The footer links
to it during development. It includes real buttons and links, state examples,
typography, article content, post lists, navigation, artwork, and design tokens.
Use the normal theme switch to compare light and dark appearances.

The showcase route is registered only by the dev server. Production builds
exclude its page, styles, and interaction script entirely; `pnpm preview` and
the live site return 404 for `/showcase/`. The source is still tracked in this
public repository. Publishing checks enforce production exclusion.

The former color-preview page and URL-based palette overrides have been removed.

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

## Draft privacy

`draft: true` excludes a post from every published route, listing, feed, and
sitemap, including during local development. Files in `src/content/drafts/`
are outside the loaded collections entirely.
To preview one, move it into `posts/` on a local branch and temporarily set
`draft: false` with valid post metadata. Revert that flag before publishing.

Build exclusion does **not** make a tracked draft private: anyone can read it
if its branch or history is pushed to a public repository. Keep future private
writing on local-only branches and back it up privately. Before sharing a
branch, check its complete commit range for unfinished writing.

`assets/` and `references/` contain original working material, including source
diagrams. They are preserved in the repository and never copied into the site.
Only `dist/` is uploaded to Pages. Keep secrets in ignored `.env` files, never
in `public/` or variables prefixed with `PUBLIC_`.

## Migration checks

`tests/legacy-site.json` records the pre-migration generated site. Verification
covers legacy routes and redirect destinations, post titles, publication dates,
code examples, images, feed IDs, category membership, internal links, HTTPS
metadata, and draft exclusion. New articles are supported without changing the
fixture; intentional changes to historical content may require fixture updates.

Additional checks cover theme switching, font coverage, image loading and
animation preservation, syntax contrast, and deployment safeguards. All run
through `pnpm test`; build first. `pnpm run test:drafts` also verifies draft
exclusion and image-cache invalidation using temporary content.

## Domain and HTTPS

The custom domain is configured in [GitHub Pages settings](https://github.com/MitjaBezensek/mitjabezensek.github.io/settings/pages).
For domain changes, follow [GitHub’s DNS configuration guide](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
and update `site` in `astro.config.mjs` and `SITE` in `src/lib/posts.ts`.
Enable **Enforce HTTPS** after GitHub provisions the domain’s certificate.

## GitHub Pages configuration

The repository’s default and publishing branch is `source`. The workflow in
`.github/workflows/pages.yml` builds Astro and publishes only `dist/`.

The required repository settings are:

- **Settings → Pages → Source:** GitHub Actions.
- **Settings → Environments → github-pages:** allow the `source` branch.
- **Settings → Pages → Custom domain:** the site’s domain, with Enforce HTTPS enabled.

For updates, commit your changes on `source` and run `pnpm run deploy`.
Check the deployment in [GitHub Actions](https://github.com/MitjaBezensek/mitjabezensek.github.io/actions),
then verify the changed page on the live site.
