# Pixel garden blog theme

Follow-up: the user requested a software-development/computer theme rather
than gardening. The current theme uses a pixel monitor logo/favicon and a
CRT, tower, keyboard, and mouse illustration (`PixelComputer.astro`). All
gardening copy and plant artwork were removed. The header now has an opaque
cream panel so the author's name never sits directly on the dotted texture.
Desktop and 390px mobile previews fit without horizontal overflow; Astro
check, build, and all eight preservation checks pass. Review found no blockers.
The original reference and implementation notes below describe the first
iteration.

The user requested a custom pixel-art theme based on their Greenhouse app at
localhost:5100. Its pixel-garden skin provides the visual reference: cream
panels, lavender dotted gutters, beveled borders, violet controls, moss-green
pixel plants, and JetBrains Mono interface text with Geist body text.

Apply those colors and interface details to the existing blog layouts. Use
original SVG pixel artwork for a little desk and plants, with crisp edges,
and serve open-source font files locally. Keep pixel details decorative and
article copy readable in sans-serif. Use a light palette matching the
reference, compact framed navigation, and an opaque reading panel. Scale to
mobile without page overflow; code blocks scroll independently.

This replaces the rejected custom serif theme. Existing routes, redirects,
content, feed/comment identities, draft exclusions and hosting stay intact.
No Greenhouse application data or code is copied into the blog.

Verification: Astro type check, build, all preservation checks, and visual
inspection of homepage and a long article at desktop and mobile widths.
Run an independent final review. Keep everything local and refresh the
running preview for the user.

Completed locally: check reports zero errors/warnings/hints, static build
produces 39 pages, and all eight preservation checks pass. Desktop 1280px and
mobile 390px previews fit the viewport; long article images and locally served
fonts load. Independent review found one contrast issue outside the reading
panel. A direct luminance check reproduced 4.06:1 for the subtitle, then
verified the corrected header/footer ink at 6.04:1 against the darker dots.
Font licenses are distributed alongside the fonts in public/licenses/.
