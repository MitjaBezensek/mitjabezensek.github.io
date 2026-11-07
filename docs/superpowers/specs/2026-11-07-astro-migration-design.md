# Astro migration

The subsequent [short-URL design](2026-11-07-short-post-urls.md) supersedes the
original choice to serve articles directly at their dated URLs. Those URLs
now remain as redirects, with article canonicals at `/post-name/`.

## Intent and agreed choices

Replace the Octopress/Jekyll build with Astro while keeping this repository,
Markdown authoring in an editor, Git history, GitHub Pages, and bezensek.com.
The user selected Astro with Markdown over Eleventy, Hugo, and a CMS, and
authorized a pre-astro snapshot and work on a migration branch.

## Current state

- Editable source is on `source`, at `1a77db3` before migration.
- Local annotated tag `pre-astro` preserves that source revision.
- Work proceeds on `MitjaBezensek/astro-migration`.
- GitHub Pages currently publishes `/` from `master` using the legacy build.
  Its custom domain is `bezensek.com`; HTTPS enforcement is currently off.
- Nine posts are published. One additional post has `published: false`, and
  six pieces are in `_drafts`.
- The site includes About, archives, categories, pagination, an Atom feed,
  images, fenced C# code, and Octopress image tags and Liquid examples.
- Several frontmatter dates differ from their filenames. Existing generated
  pages in `_deploy` and `master` establish the URLs to preserve.

## Approaches considered

1. Astro with file-based Markdown: selected by the user. Modern content
   tooling and optional interactive components, with no CMS backend to run.
2. Eleventy or Hugo: suitable simpler static generators, but not selected.
3. Astro with EmDash or Ghost: browser publishing and database-backed content;
   unnecessary for the selected editor-and-Git workflow.

## Goals and scope

- Replace Ruby, Octopress plugins, and the old theme build with a supported
  stable Astro release, a lockfile, and documented Node requirements.
- Keep published prose, titles, original publication dates, code examples,
  images, and original post URLs. Convert rendering syntax only.
- Preserve unpublished writing in Markdown and exclude it from all production
  routes, indexes, feeds, and sitemaps.
- Preserve `/about/`, `/blog/archives/`, `/blog/categories/`, category paths,
  `/page/2/`, `/atom.xml`, and existing public asset URLs used by content.
- Produce a responsive, readable personal blog with accessible navigation,
  readable code blocks, metadata, canonical links, a sitemap, and a 404 page.
- Build and deploy static output using GitHub Actions and GitHub Pages.
- Keep `assets/` and `references/` source material; preserve history of all
  removed Octopress files through the tag and existing commits.

## Implementation design

Use Astro content collections and plain `.md` files with validated frontmatter.
Make legacy post paths explicit metadata so date parsing and title slugging
cannot silently change URLs. Keep date-only publication metadata separate
from URL metadata. Keep draft state explicit and consistently filter it in
production. No MDX or client framework is needed.

Move public content assets to `public/` while keeping their URL paths. Convert
Octopress image tags to Markdown or HTML with meaningful alt text. Remove
Liquid raw wrappers around examples while preserving literal Liquid code.
Keep excerpt boundaries or explicit descriptions for listing summaries.

Builder choices: use a small custom Astro layout and CSS, system fonts, and
minimal JavaScript. Prioritize typography and mobile reading. Keep the About
copy as-is, since factual updates need the user's input. Search, newsletters,
a CMS, and new content are outside this migration.

Integration choices approved with this design: retain Disqus on
existing comment-enabled posts with their original HTTP URL identifiers to
preserve thread association, loading its embed over HTTPS. Remove obsolete
Google Analytics UA, Google+, AddThis widgets, and unused theme scripts.
Retain the native Atom endpoint and existing entry IDs; FeedBurner account
changes are outside scope. Use HTTPS canonical URLs after verifying the
domain certificate; do not silently change GitHub's HTTPS setting.

## Deployment and recovery

Prepare a workflow that verifies pull requests and deploys only the selected
production branch. Target `source` for the first migration PR, so the old
generated `master` deployment can remain intact until cutover. Document the
GitHub Pages switch from branch publishing to GitHub Actions, and any domain
verification required. Renaming the repository's default branch is deferred.

Implementation and local review are authorized. Pushing the backup tag or
branch, opening a PR, merging, and changing live Pages settings are separate
publication steps to settle after the built result is reviewable. Once
approved, push `pre-astro` before publishing the replacement.

Rollback: select the untouched `master` branch in Pages settings to restore
the generated site. The `pre-astro` tag restores the old editable source.

## Verification and completion

Build successfully and inspect the generated output against the legacy route
inventory. Check all nine posts, draft exclusion, assets and internal links,
feed parsing and stable IDs, category counts, code rendering, and metadata.
Preview the homepage and representative image/code-heavy posts at desktop
and mobile sizes. Document any existing broken external URLs rather than
rewriting historical content speculatively.

The migration is ready for publication when the build and preservation checks
pass, the preview is reviewed, and the README explains authoring, local
preview, deployment cutover, and rollback.
