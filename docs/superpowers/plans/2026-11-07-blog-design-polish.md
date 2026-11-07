# Blog design polish implementation plan

**Goal:** Implement the nine design recommendations approved in chat, preserving the retro identity.
**Architecture:** Shared CSS owns responsive typography, rhythm, controls and surfaces. The existing theme module supplies CSS palette defaults. Category presentation stays separate from historical URL/feed membership.
**Tech stack:** Astro, TypeScript, CSS, Node and Python tests.
**Spec:** The nine recommendations in this chat, approved with “implement all of these”.

## Constraints
- Work on `MitjaBezensek/blog-design-polish`; user subsequently approved final validation and merge to `source`.
- Preserve unrelated in-progress 404 artwork.
- Keep existing category URLs and feed membership.
- Preserve light/dark switching, code readability and image behavior.

## Tasks
- [x] Consolidate palette defaults, typography roles, spacing and surface tokens.
- [x] Increase labels and controls; compact mobile header/hero; strengthen post titles; improve reading measure.
- [x] Normalize arrows and writing-section navigation; clean category labels and consolidate duplicate browsing entries without deleting legacy routes.
- [x] Update showcase/documentation; run check, build, tests and desktop/mobile visual review; obtain a fresh code review.

## Review focus
Phone overflow and long titles; dark/no-script palettes; legacy category feeds; deduplicated Excel counts; unrelated dirty files.

## Decisions
Keep legacy category membership intact for feeds and existing pages. Group duplicate categories only in browsing presentation and point their displayed tag to the canonical topic. Existing migration tests will continue verifying the historical feeds independently of displayed tag links.

## Verification
- Final combined Astro check: 29 files, zero errors/warnings/hints.
- Production build: 39 pages.
- Full test suite: 8 Python migration checks and 26 Node tests pass.
- Desktop light/dark and phone visual review; no overflow at 320px across home, article, archives, categories, pagination, About, showcase and combined 404.
- Independent code review found no actionable issues.
- Final 404 is animated artwork only, with desk contact corrected and a final shake.
- Post/archive rows are fully clickable; only titles underline on hover/focus. All link arrows share optical alignment. Underlines are dashed at 80% of the current text color.
- Checked all 14 category destinations and feeds plus 29 article category links over HTTP.
