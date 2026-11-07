# Short post URLs

User request: replace dated article URLs with `/post-name` and choose the best
SEO redirect while keeping GitHub Pages. Work remains local-only.

Use `/post-name/` for canonical article URLs, matching the existing trailing
slash policy and GitHub Pages directory hosting. Keep each final slug from
the previous path. Preserve the dated URL in `legacyUrl` and generate a
standalone zero-second meta-refresh alias with a canonical and fallback link.
GitHub Pages serves static files, so these are HTTP 200 HTML redirects,
not server-side 301 responses. Google recognizes immediate meta refresh as
permanent; an actual 301 would require a redirect-capable host or proxy.

Update internal links, listings, Atom visit links, and the sitemap to the
short URLs. Keep original Atom IDs and Disqus identifiers unchanged using
`legacyUrl`. Do not duplicate articles at old URLs or include aliases in the
sitemap. Drafts generate neither article pages nor aliases.

Verification: first run the changed preservation checks against the old build
and observe failures. Implement the new route and aliases, run Astro check,
the synthetic draft/new-post build, and all eight preservation checks. Verify
a built legacy URL reaches the new article in a browser and that its HTML
has an immediate redirect and correct canonical. Independently review changes.

Completed locally: type checking and all eight preservation checks pass,
including the synthetic draft/new-post build. Independent review found no
remaining issues. A browser visit to the original minimization URL reached
`/deterministic-finite-state-machine-minimization/` and declared the matching
HTTPS canonical. The local production preview was restarted to serve this
build. No remote changes were made.
