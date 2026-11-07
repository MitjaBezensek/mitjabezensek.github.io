# Mitja Bezenšek’s blog

Personal blog built with Astro and Markdown, published at
[bezensek.com](https://bezensek.com) through GitHub Pages.

- [Start locally](#local-development)
- [Write and edit posts](#writing-posts)
- [Publish an update](#publishing-updates)
- [Find files](#repository-map)
- [Handle private drafts](#draft-privacy)
- [Configure the domain and HTTPS](#domain-and-https)
- [Deploy for the first time](#first-deployment-github-pages)

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
| `pnpm test` | Verify the built site and theme behavior; build first. |
| `pnpm run test:drafts` | Verify draft exclusion and new-post support, then leave a normal production build. |

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
pubDate: "2026-11-07T12:00:00+01:00"
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
already used by pages, such as `/about/`, `/palettes/`, and `/page/2/`.
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

### About and automatic pages

Edit `src/content/pages/about.md` for the biography. It contains the original
2014 copy; the date label is in `src/pages/about.astro`.

The homepage shows five posts per page, newest first. Archives, categories,
Atom feeds, and the sitemap update automatically. `/atom.xml` contains the
latest twenty articles; category feeds contain the latest five. Posts have
no discussion section or third-party comment scripts.

## Publishing updates

After the [first deployment](#first-deployment-github-pages), use `source` for
normal writing and publishing. Start a writing session with:

```sh
git switch source
git pull --ff-only origin source
```

Edit and preview your post, then run the same checks as CI:

```sh
pnpm run check
pnpm run test:drafts
pnpm test
```

Stage the post and its images, review the diff, and publish:

```sh
git add src/content/posts/my-new-post.md public/img/my-new-post/
git diff --cached
git commit -m "Publish my new post"
git push origin source
```

Use your actual filenames and omit the image directory if there are no new
images. For edits to About or other files, stage those paths instead.
Keep commit messages focused on the change, such as `Fix a code example in
powerset construction` or `Update the About biography`.

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
| `src/content/drafts/` | Original unpublished material, outside the loaded collections. |
| `public/img/`, `public/about/` | Images copied directly to the site. |
| `src/layouts/Base.astro` | Shared header, navigation, metadata, and footer. |
| `src/pages/` | Page templates, article routes, archives, feeds, and redirects. |
| `src/styles/global.css` | Typography, spacing, and shared theme styles. |
| `src/lib/palettes.ts` | Preview palettes and dark-mode colors. |
| `src/components/PalettePreview.astro` | Theme selection, persistence, and palette previews. |
| `src/components/PixelComputer.astro` | Pixel computer illustration. |
| `src/lib/posts.ts` | Site identity, post ordering, categories, and page size. |
| `tests/` | Migration preservation, theme, and draft checks. |
| `.github/workflows/pages.yml` | Automated checks and GitHub Pages deployment. |
| `assets/`, `references/` | Original working material; excluded from the built site. |
| `dist/` | Generated production site; do not edit it. |

## Theme

The custom pixel-computer theme takes its visual direction from Greenhouse:
neutral dotted gutters, ivory reading panels, beveled controls, and original
SVG computer artwork. The header uses a solid cream backing for readability.
JetBrains Mono is used for headings/navigation, Source Sans 3 for reading text, and
Fira Code with contextual ligatures for code blocks. Fonts are served locally; their SIL Open Font Licenses are
included in `public/licenses/`. The blue-and-coral palette supports light and dark
modes. New visitors start in light mode; the header switch remembers an explicit
choice for later visits. Edit `src/styles/global.css` for theme styling and
`src/components/PixelComputer.astro` for the illustration.

`/palettes/` compares five color alternatives on the real homepage. Open a
preview to carry that palette through internal article links using a query
parameter; it does not save a preference or change the default theme. The
preview page is marked noindex and is excluded from the sitemap. Palette
values are in `src/lib/palettes.ts`.

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

## Domain and HTTPS

`bezensek.com` uses NEOSERV DNS. The pre-launch audit on 7 November 2026 found
the legacy GitHub Pages addresses `192.30.252.153` and `192.30.252.154`, no
GitHub-issued certificate for the domain, and no HTTP-to-HTTPS redirect.

In the domain's DNS editor, replace those two apex `A` records with
[GitHub Pages' current addresses](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site):

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |

`@` means the apex domain, `bezensek.com`; the editor may display the full
domain name instead. Keep the nameservers and unrelated DNS records as they
are. NEOSERV documents its editor in
[DNS hosting instructions](https://www.neoserv.si/podpora/dns-gostovanje).

Keep `bezensek.com` configured as the custom domain in GitHub Pages. After
the new DNS records propagate, wait for GitHub to provision a valid certificate,
then enable **Enforce HTTPS** in Pages settings. The old records had a
one-hour TTL; certificate provisioning can take additional time. See
[GitHub's HTTPS troubleshooting guide](https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https).

Verify the result without bypassing certificate checks:

```sh
dig +short bezensek.com A
curl -I https://bezensek.com/
curl -I http://bezensek.com/
```

DNS should return the four new addresses, HTTPS should have a valid certificate,
and HTTP should redirect to HTTPS once enforcement is enabled.

## First deployment (GitHub Pages)

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

2. Commit any remaining work on `codex/astro-migration`. Skip this first block
   if `git status --short` is empty. Review the staged diff for private writing
   before committing; the repository is public.

   ```sh
   git add -A
   git diff --cached
   git commit -m "Finish Astro blog migration"
   ```

   Then merge the committed migration into `source`:

   ```sh
   git switch source
   git merge --ff-only codex/astro-migration
   ```

3. In [Settings → Pages](https://github.com/MitjaBezensek/mitjabezensek.github.io/settings/pages),
   choose **GitHub Actions** as the publishing source. Keep the custom domain
   `bezensek.com` and configure [DNS and HTTPS](#domain-and-https). If deployment
   environment rules block the workflow, allow `source` in `github-pages`.

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
