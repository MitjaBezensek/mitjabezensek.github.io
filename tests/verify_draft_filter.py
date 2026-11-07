"""Verify draft privacy and image cache invalidation with temporary content."""

from pathlib import Path
import re
import struct
import subprocess
import sys
import tempfile
import zlib

ROOT = Path(__file__).resolve().parents[1]
MARKER = "migration-private-draft-sentinel"
images = [ROOT / f'public/img/image-cache-check-{letter}.png' for letter in 'ab']
assert not any(image.exists() for image in images), 'Image fixture paths must be unused'

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

![First test image](/img/image-cache-check-a.png)
![Second test image](/img/image-cache-check-b.png)
''')


def png(width, height, color):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    pixels = (b'\0' + bytes(color) * width) * height
    return (b'\x89PNG\r\n\x1a\n'
            + chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 2, 0, 0, 0))
            + chunk(b'IDAT', zlib.compress(pixels)) + chunk(b'IEND', b''))


def image_output():
    markup = (ROOT / 'dist/new-article-verification/index.html').read_text()
    return [dict(re.findall(r'([\w-]+)="([^"]*)"', tag))
            for tag in re.findall(r'<img\b[^>]*>', markup)]


red = png(32, 16, (255, 0, 0))
blue = png(16, 32, (0, 0, 255))

try:
    images[0].write_bytes(red)
    images[1].write_bytes(blue)
    subprocess.run(["pnpm", "run", "build"], cwd=ROOT, check=True)
    for path in (ROOT / "dist").rglob("*"):
        assert MARKER not in str(path), f"Draft route leaked: {path}"
        if path.is_file() and path.suffix in {".html", ".xml", ".json", ".js"}:
            assert MARKER not in path.read_text(), f"Draft content leaked: {path}"
    print("Draft filter verified across routes, indexes, feeds, sitemap, and scripts.")
    subprocess.run([sys.executable, "tests/verify_site.py"], cwd=ROOT, check=True)
    assert [(i['width'], i['height']) for i in image_output()] == [('32', '16'), ('16', '32')]

    # Swapping contents keeps the set of image hashes unchanged. Their URL mapping
    # must still invalidate cached Markdown, even though the post did not change.
    images[0].write_bytes(blue)
    images[1].write_bytes(red)
    subprocess.run(["pnpm", "run", "build"], cwd=ROOT, check=True)
    assert [(i['width'], i['height']) for i in image_output()] == [('16', '32'), ('32', '16')]
    images[0].write_bytes(png(48, 24, (0, 255, 0)))
    subprocess.run(["pnpm", "run", "build"], cwd=ROOT, check=True)
    assert (image_output()[0]['width'], image_output()[0]['height']) == ('48', '24')
    subprocess.run(['node', '--test', 'tests/performance.test.mjs'], cwd=ROOT, check=True)
    print('Image-only replacements and URL swaps invalidate cached Markdown output.')
finally:
    draft.unlink(missing_ok=True)
    published.unlink(missing_ok=True)
    for image in images:
        image.unlink(missing_ok=True)
    # Leave dist as a normal build, without the temporary published article.
    subprocess.run(["pnpm", "run", "build"], cwd=ROOT, check=True)
