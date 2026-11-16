# Mitja Bezenšek’s blog

Personal blog built with Astro and Markdown, published at
[bezensek.com](https://bezensek.com) through GitHub Pages.

- [Start locally](#local-development)
- [Write and edit posts](#writing-posts)
- [Publish an update](#publishing-updates)
- [Find files](#repository-map)
- [Handle private drafts](#draft-privacy)

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
`javascript`.

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

Markdown images get dimensions and responsive alternatives automatically,
with animation and original files preserved. Generated files in
`public/_images/` are ignored by Git; add originals to `public/img/`.

### About and automatic pages

Edit `src/content/pages/about.md` for the biography and
`src/pages/about.astro` for its page layout.

The homepage shows five posts per page, newest first. Archives, categories,
Atom feeds, and the sitemap update automatically. Category display names live
in `src/lib/categories.ts`.

## Publishing updates

Create a `mitja/<topic>` branch from `production`:

```sh
git fetch origin
git switch -c mitja/my-new-post origin/production
pnpm install --frozen-lockfile
```

Edit and preview with `pnpm dev`, then run the checks:

```sh
pnpm run check
pnpm run test:drafts
pnpm test
```

`test:drafts` leaves a production build in `dist/`; inspect it with `pnpm preview`.

Commit your changes, push the branch, and open a PR targeting `production`:

```sh
git push -u origin mitja/my-new-post
gh pr create --base production
```

PRs run **Check blog** without deploying. Merging into `production` runs
**Deploy blog**, which checks, builds, and deploys
the site through [GitHub Actions](https://github.com/MitjaBezensek/mitjabezensek.github.io/actions).
After deployment, verify the changed page on [bezensek.com](https://bezensek.com).

Use pnpm for dependency changes too: `pnpm add` for runtime dependencies and
`pnpm add -D` for development tools. Commit `package.json` and
`pnpm-lock.yaml` together, plus `pnpm-workspace.yaml` if its settings change.

## Repository map

| Path | Contents |
| --- | --- |
| `src/content/posts/` | Published articles and posts marked as drafts. |
| `src/content/pages/about.md` | Editable About biography. |
| `public/img/`, `public/about/` | Images copied directly to the site. |
| `src/layouts/Base.astro` | Shared header, navigation, metadata, and footer. |
| `src/pages/` | Page templates, article routes, archives, feeds, and redirects. |
| `src/styles/global.css` | Typography, spacing, and shared theme styles. |
| `src/lib/theme.ts` | Shared light and dark color tokens. |
| `src/components/ThemeScript.astro` | System theme detection, saved preference, and theme switching. |
| `src/components/DevDrawer.astro` | Development-only drawer, opened with Shift+D. |
| `src/dev/showcase.astro` | Development-only component showcase. |
| `integrations/dev-showcase.ts` | Registers `/showcase/` only for `pnpm dev`. |
| `src/components/PixelComputer.astro` | Pixel computer illustration. |
| `src/lib/posts.ts` | Site identity, post ordering, categories, and page size. |
| `tests/` | Content, theme, image, and publishing checks. |
| `.github/workflows/check.yml` | PR checks. |
| `.github/workflows/deploy.yml` | Checks and GitHub Pages deployment on `production`. |
| `assets/` | Original diagrams; excluded from the built site. |
| `dist/` | Generated production site; do not edit it. |

## Theme and components

The site follows the system color scheme unless the reader saves a choice
with the theme toggle. Fonts are self-hosted; licenses are in `public/licenses/`.

- `src/styles/global.css`: typography, spacing, and shared styles.
- `src/lib/theme.ts`: light and dark palette colors.
- `src/lib/syntax-theme.ts`: code highlighting.
- `src/components/PixelComputer.astro`: homepage illustration.
- `src/assets/site-icon.svg`: header icon and favicon.

During `pnpm dev`, press **Shift+D** for the development drawer. It links to
`/showcase/` for components and design tokens, and `/404-preview/` for the error
page. These tools are excluded from production builds.

## URL redirects

Posts use `/post-name/`. Keep existing `legacyUrl` values: they preserve dated
redirects and Atom entry IDs. New posts do not need them. Redirects preserve
query strings and fragments and stay out of the sitemap.

## Draft privacy

`draft: true` excludes a post from every published route, listing, feed, and
sitemap, including during local development. To preview a draft, temporarily
set `draft: false` on a local branch. Revert that flag before publishing.

Build exclusion does **not** make a tracked draft private: anyone can read it
if its branch or history is pushed to a public repository. Keep future private
writing on local-only branches and back it up privately. Before sharing a
branch, check its complete commit range for unfinished writing.

`assets/` contains original diagrams, which are not copied into the site.
Only `dist/` is uploaded to Pages. Keep secrets in ignored `.env` files, never
in `public/` or variables prefixed with `PUBLIC_`.

## Tests

Run `pnpm test` after building. Tests cover content and links, redirects,
feeds, themes, fonts, images, and publishing safeguards. `pnpm run test:drafts`
also checks draft exclusion and image-cache invalidation with temporary content.

`tests/legacy-site.json` preserves existing article identities and content.
Intentional edits to those articles may require fixture updates; new posts do not.
