"""Build with a temporary draft and prove it never enters public output."""

from pathlib import Path
import subprocess
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
MARKER = "migration-private-draft-sentinel"

with tempfile.NamedTemporaryFile(
    mode="w", suffix=".md", prefix="draft-check-",
    dir=ROOT / "src/content/posts", delete=False,
) as file:
    draft = Path(file.name)
    file.write(f'''---
title: "{MARKER}"
description: "{MARKER}"
pubDate: "2026-11-07T12:00:00Z"
url: "/{MARKER}/"
legacyUrl: "/blog/2026/11/07/{MARKER}/"
categories: ["{MARKER}"]
draft: true
comments: true
---
{MARKER}
''')

with tempfile.NamedTemporaryFile(
    mode="w", suffix=".md", prefix="published-check-",
    dir=ROOT / "src/content/posts", delete=False,
) as file:
    published = Path(file.name)
    file.write('''---
title: "New article verification"
description: "An additional published article must not break the migration checks."
pubDate: "2026-11-07T12:00:00Z"
url: "/new-article-verification/"
categories: [programming]
---
This additional article verifies that future writing can still be published.
''')

try:
    subprocess.run(["pnpm", "run", "build"], cwd=ROOT, check=True)
    for path in (ROOT / "dist").rglob("*"):
        assert MARKER not in str(path), f"Draft route leaked: {path}"
        if path.is_file() and path.suffix in {".html", ".xml", ".json", ".js"}:
            assert MARKER not in path.read_text(), f"Draft content leaked: {path}"
    print("Draft filter verified across routes, indexes, feeds, sitemap, and scripts.")
    subprocess.run([sys.executable, "tests/verify_site.py"], cwd=ROOT, check=True)
finally:
    draft.unlink()
    published.unlink()
    # Leave dist as a normal build, without the temporary published article.
    subprocess.run(["pnpm", "run", "build"], cwd=ROOT, check=True)
