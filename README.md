# Mitja Bezenšek’s blog

A static Astro site, with Markdown posts and GitHub Pages hosting at
[bezensek.com](https://bezensek.com).

## Local development

Use Node 24.14.1 or newer (the development version is in `.nvmrc`) and Python 3
for the migration checks.

```sh
nvm use
npm ci
npm run dev
```

Open the local URL printed by Astro. To inspect the production build:

```sh
npm run check
npm run build
npm test
npm run preview
```

`npm run test:drafts` builds with a temporary draft and a new published post.
It verifies draft exclusion and that the migration checks accept new writing,
then removes the temporary files and restores a normal build.

## Writing

Create a file in `src/content/posts/`, for example `my-new-post.md`:

```yaml
---
title: "My new post"
description: "A short description for listings and search results."
pubDate: "2026-11-07T12:00:00+01:00"
url: "/blog/2026/11/07/my-new-post/"
categories: [programming]
draft: false
comments: false
---
```

Write regular Markdown below the frontmatter. Fenced code blocks accept
language names such as `csharp`, `typescript`, and `javascript`. Images in
`public/img/` are linked as `![Description](/img/example.png)`.

The explicit `url` preserves old links independently of filenames and titles.
For new posts, use a unique lowercase, hyphenated slug and keep the URL stable.
Set `comments: true` to offer the existing Disqus discussion; Disqus loads
only when the reader clicks **Load comments**. Historical posts retain their
original HTTP Disqus identifiers so existing discussions stay associated.

The homepage shows five articles per page. Archives, categories, Atom feeds,
and the sitemap update automatically. `/atom.xml` contains the latest twenty
articles; category feeds contain the latest five. Atom IDs retain their old
HTTP spelling as stable identities; visit links and canonicals use HTTPS.

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
those routes, post titles, publication dates, code examples, images, feed IDs,
category feed membership, internal link targets, HTTPS metadata, and source
and draft exclusion. New articles are supported without changing the fixture;
intentional changes to historical content may require corresponding fixture
updates.

One historical image remains externally hosted over HTTP in the Git/Visual
Studio article (the SourceTree UI screenshot). Its URL is preserved from the
original content; availability and mixed-content handling depend on that
external server. All locally hosted images are preserved.

## GitHub Pages cutover (not performed by this migration)

The existing Pages site serves generated HTML from `master`; editable source
lives on `source`. The migration is on `codex/astro-migration`. All work is
local until explicitly approved for publishing.

When ready to publish:

1. Back up the local `pre-astro` tag and migration branch to an appropriate
   remote. The tag includes historical drafts; a public push exposes
   everything reachable from it.
2. Merge the migration into `source`, keeping `master` untouched for rollback.
3. In **Settings → Pages**, choose **GitHub Actions** as the publishing source.
   Keep the custom domain `bezensek.com`. Ensure the `github-pages` environment
   allows deployments from `source`; existing rules may only allow `master`.
4. Push `source`. The workflow installs locked dependencies, type-checks,
   builds, runs preservation checks, and uploads only `dist/`. Pull requests
   run the same checks without deploying. After the switch, a push to `source`
   triggers deployment; do not push it until cutover is intended.
5. Verify domain DNS and certificate status. Enable **Enforce HTTPS** once
   GitHub reports the certificate ready. Check the homepage, an old post URL,
   an image, `/atom.xml`, and Disqus thread association after deployment.

Because the default branch is still `master`, manual workflow dispatch may
not be available in the UI until the workflow exists on that branch too.
The `source` push trigger is the intended first-deploy path. Renaming the
default branch is a separate optional change.

To roll back, switch Pages back to **Deploy from a branch → master → /(root)**.
That branch retains the old generated site. Local tag `pre-astro` points to
the editable Octopress source (`1a77db3`); inspect it with
`git show pre-astro:path/to/file` or create a recovery branch from it.
