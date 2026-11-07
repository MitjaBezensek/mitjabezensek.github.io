# Five palette alternatives and larger dates

The user rejected purple and slate blue and requested five alternatives while
keeping the computer-window design. They also requested larger dates.

Provide Graphite, Warm gray, Copper, Green terminal, and Amber terminal as
query-parameter previews of the actual homepage and article layouts. Semantic
CSS tokens also recolor the computer artwork. `/palettes/` compares embedded
previews and links to full versions. The page is noindex and omitted from the
sitemap. Previews carry their selected palette through internal article
links, preserve explicit palette choices, leave feeds/external links alone,
and never save preferences or change the default palette.

Dates in post listings, article metadata and archive entries now use 12px,
including on mobile. Code blocks retain locally hosted Fira Code; the dark
previews use Shiki's dark syntax colors.

Verification: Astro check has zero errors/warnings/hints; build produces 40
pages; eight preservation tests and four palette regression tests pass.
Independent review caught explicit preview links being overwritten and low
contrast in Warm gray's secondary text. Both failures were reproduced first,
fixed and verified. Browser inspection confirms all five distinct palettes,
12px dates at desktop and 390px widths, palette continuity into articles,
Fira Code and dark code backgrounds. All work remains local.
