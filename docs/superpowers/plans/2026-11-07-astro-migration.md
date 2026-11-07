# Astro Migration Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Replace Octopress with a verified static Astro blog, ready for GitHub Pages cutover.

**Architecture:** File-based Markdown collections with explicit legacy URLs feed static post, archive, category, pagination, and Atom routes. Shared layouts and CSS provide the new reading experience. GitHub Actions verifies and publishes only built output.

**Tech Stack:** Astro 7, TypeScript, Markdown, Node 24, Python 3 standard library for migration verification.

**Spec:** `docs/superpowers/specs/2026-11-07-astro-migration-design.md`

## Global Constraints

- Preserve bezensek.com, all nine published post URLs, `/atom.xml`, category feeds, About, archives, categories, and `/page/2/`.
- Preserve unpublished Markdown but exclude it from production output. Local-only branches are the user's preferred location for future private drafts.
- Preserve prose, dates, code, images, stable feed IDs, and Disqus identifiers.
- Keep `assets/` and `references/` outside the published directory.
- Work on the existing migration branch; no push or live Pages setting changes.

## Review Focus

- Frontmatter dates differing from filenames must not change post URLs.
- Literal Liquid examples must survive conversion without becoming executable scripts.
- Drafts must stay absent from post routes, every index, feeds, and sitemap.
- Images and internal links must resolve from nested post and feed URLs.
- Deployment must target `source` while preserving `master` for rollback.

### Task 1: Content and preservation contract

**Files:** `tests/legacy-site.json`, `tests/verify_site.py`, `src/content/posts/*.md`, `src/content/pages/about.md`, `public/`, `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/content.config.ts`.

**Interfaces:** Produces `posts` collection with `title`, `description`, `pubDate`, `url`, `categories`, `draft`, `comments`; `pages` collection for About. Legacy fixture records routes, images, code blocks, dates, IDs and category membership.

- [x] Capture the old rendered site's preservation fixture from `master` and original Markdown.
- [x] Write output assertions for routes, draft exclusion, image assets, code blocks, feed IDs, HTTPS metadata, and private-source exclusion.
- [x] Run `python3 tests/verify_site.py`; expected failure because `dist/` is absent.
- [x] Install stable Astro, convert Markdown rendering syntax, preserve original date metadata and explicit post paths, copy public content assets.

### Task 2: Render and verify the site

**Files:** `src/layouts/Base.astro`, `src/components/{PostList,Disqus}.astro`, `src/lib/{posts,feed}.ts`, `src/pages/**`, `src/styles/global.css`.

**Interfaces:** `getPosts()` returns published posts newest first; `getCategories(posts)` produces distinct normalized categories; `atomFeed(posts, path, title)` returns XML with full rendered content and stable IDs.

- [x] Implement post routes, About, home and pagination, archives, category pages and feeds, Atom, sitemap, robots, and 404.
- [x] Build using `npm run build`; expected successful static output.
- [x] Run `npm run check` and `python3 tests/verify_site.py`; expected zero errors and all preservation checks passing.
- [x] Preview homepage, About, and image/code-heavy posts at desktop and mobile widths; verify navigation and comments interaction.
- [x] Commit the verified site migration.

### Task 3: Deployment and authoring handoff

**Files:** `.github/workflows/pages.yml`, `README.md`, `.gitignore`, `.editorconfig`, `.nvmrc`; remove legacy Octopress build/theme files.

**Interfaces:** `npm ci`, `npm run check`, `npm run build`, and `npm test` are the local/CI contract. Production deploy is limited to `source`; PRs only validate.

- [x] Add CI build verification and Pages deployment of `dist/` with job-scoped permissions.
- [x] Document editor authoring, draft privacy, preview, cutover, HTTPS, backup tag, and rollback.
- [x] Remove unused Ruby/theme code while retaining original content source material in `assets/` and `references/`.
- [x] Re-run the full contract and independently review the final diff before committing the handoff.

## Execution notes

The user's explicit instruction to go ahead authorizes inline execution of the approved design. The migration branch already provides the agreed isolation; no additional worktree is needed. No baseline test suite exists for the old Octopress build; the preserved generated HTML is the comparison baseline.

## Result

Completed locally on `MitjaBezensek/astro-migration`. Independent review found no
blocking migration issues. The inconsistent pnpm declaration was removed so
tooling follows the npm lockfile and documented commands.

Final validation: `npm run check` reports zero errors, warnings, or hints;
`npm run build` produces 30 HTML pages; all seven migration checks pass.
The synthetic draft/new-post build also passes. All nineteen migrated image
files are byte-identical to the original source. Mobile preview at 390px
showed no page overflow, and local article/About images loaded successfully.

No push, PR, live deployment, or Pages configuration change was performed.
The separate untracked `prototypes/` project was left untouched. Live
certificate setup and Disqus thread association remain cutover checks.
