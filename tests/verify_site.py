"""Check the built site against the pre-migration rendered blog."""

import html
from datetime import datetime
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import unittest
from urllib.parse import unquote, urljoin, urlsplit
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
DIST = ROOT / "dist"
LEGACY = json.loads((ROOT / "tests/legacy-site.json").read_text())
ATOM = {"a": "http://www.w3.org/2005/Atom"}


class Document(HTMLParser):
    def __init__(self, markup):
        super().__init__()
        self.links = []
        self.images = []
        self.codes = []
        self.canonicals = []
        self.h1 = []
        self.dates = []
        self.refresh = []
        self.is_post = False
        self._code = None
        self._h1 = False
        self.feed(markup)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "a" and "href" in attrs:
            self.links.append(attrs["href"])
        if tag == "img":
            self.images.append(attrs.get("src", ""))
        if tag == "code":
            self._code = []
        if tag == "h1":
            self._h1 = True
        if tag == "time" and "datetime" in attrs:
            self.dates.append(attrs["datetime"])
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonicals.append(attrs["href"])
        if tag == "meta" and attrs.get("http-equiv", "").lower() == "refresh":
            self.refresh.append(attrs.get("content", ""))
        if tag == "meta" and attrs.get("property") == "article:published_time":
            self.is_post = True

    def handle_endtag(self, tag):
        if tag == "code" and self._code is not None:
            self.codes.append("".join(self._code).strip())
            self._code = None
        if tag == "h1":
            self._h1 = False

    def handle_data(self, data):
        if self._code is not None:
            self._code.append(data)
        if self._h1:
            self.h1.append(data)


def output_path(url):
    path = DIST / unquote(urlsplit(url).path).lstrip("/")
    return path / "index.html" if path.is_dir() else path


def normalize_code(value):
    return re.sub(r"\s+", " ", value).strip()


def short_url(legacy_url):
    return "/" + legacy_url.rstrip("/").split("/")[-1] + "/"


def stable_id(url):
    for post in LEGACY["posts"]:
        if short_url(post["url"]) == url:
            return post["id"]
    return "http://bezensek.com" + url.rstrip("/")


def built_posts():
    posts = []
    for path in DIST.glob("*/index.html"):
        url = "/" + str(path.relative_to(DIST)).removesuffix("index.html")
        doc = Document(path.read_text())
        if not doc.is_post:
            continue
        posts.append({"url": url, "doc": doc, "date": datetime.fromisoformat(doc.dates[0].replace("Z", "+00:00"))})
    return sorted(posts, key=lambda post: post["date"], reverse=True)


class MigrationChecks(unittest.TestCase):
    def test_old_post_urls_redirect_directly_to_short_canonicals(self):
        for post in LEGACY["posts"]:
            with self.subTest(url=post["url"]):
                destination = short_url(post["url"])
                doc = Document(output_path(post["url"]).read_text())
                self.assertEqual(doc.refresh, [f"0;url={destination}"])
                self.assertEqual(doc.canonicals, ["https://bezensek.com" + destination])
                self.assertIn(destination, doc.links)
                target = Document(output_path(destination).read_text())
                self.assertTrue(target.is_post)
                self.assertEqual(target.refresh, [])
                self.assertEqual(target.canonicals, ["https://bezensek.com" + destination])

    def test_all_legacy_routes_survive(self):
        for path in LEGACY["pages"] + LEGACY["feeds"] + ["404.html"]:
            with self.subTest(path=path):
                self.assertTrue((DIST / path).is_file(), path)

    def test_published_posts_preserve_titles_images_and_code(self):
        for post in LEGACY["posts"]:
            with self.subTest(url=post["url"]):
                markup = output_path(short_url(post["url"])).read_text()
                doc = Document(markup)
                self.assertEqual(len(doc.h1), 1)
                self.assertEqual(html.unescape(post["title"]), "".join(doc.h1))
                for image in post["images"]:
                    target = urlsplit(image)
                    image_path = target.path if target.netloc == "bezensek.com" else image
                    self.assertIn(image_path, doc.images)
                    if image_path.startswith("/"):
                        self.assertTrue(output_path(image_path).is_file(), image_path)
                code = {normalize_code(c) for c in doc.codes}
                for expected in post["code"]:
                    self.assertIn(normalize_code(expected), code)
                expected_date = "-".join(post["date"])
                self.assertIn(f'datetime="{expected_date}', markup)
                self.assertIn("http://bezensek.com" + post["url"], markup)

    def test_atom_preserves_ids_dates_and_full_content(self):
        feed = ET.parse(DIST / "atom.xml").getroot()
        entries = feed.findall("a:entry", ATOM)
        expected_posts = built_posts()[:20]
        self.assertEqual(
            [entry.find("a:link", ATOM).get("href") for entry in entries],
            ["https://bezensek.com" + post["url"] for post in expected_posts],
        )
        by_id = {entry.find("a:id", ATOM).text: entry for entry in entries}
        for post in LEGACY["posts"]:
            if short_url(post["url"]) not in [p["url"] for p in expected_posts]:
                continue
            entry = by_id[post["id"]]
            self.assertEqual(entry.find("a:link", ATOM).get("href"), "https://bezensek.com" + short_url(post["url"]))
            self.assertTrue(entry.find("a:updated", ATOM).text.startswith("-".join(post["date"])))
            content = entry.find("a:content", ATOM).text
            self.assertGreater(len(content), 500)
            self.assertNotRegex(content, r'(?:src|href)=[\x27"]/(?!/)')
        self.assertEqual(feed.find("a:id", ATOM).text, "http://bezensek.com/")

    def test_category_feed_membership_is_preserved(self):
        posts = built_posts()
        for category, expected_ids in LEGACY["categoryEntries"].items():
            with self.subTest(category=category):
                category_url = f"/blog/categories/{category}/"
                category_posts = [post for post in posts if category_url in post["doc"].links]
                all_ids = [stable_id(post["url"]) for post in category_posts]
                for expected_id in expected_ids:
                    self.assertIn(expected_id, all_ids)
                feed = ET.parse(DIST / f"blog/categories/{category}/atom.xml").getroot()
                ids = [entry.find("a:id", ATOM).text for entry in feed.findall("a:entry", ATOM)]
                self.assertEqual(ids, all_ids[:5])

    def test_drafts_and_private_source_stay_out_of_output(self):
        self.assertTrue(DIST.is_dir(), "Build the site first")
        forbidden = ["How to Stay a Healthy Hacker", "response-time-of-your-editor", "creating-a-plus-minus-chart-with-vsto"]
        for path in DIST.rglob("*"):
            self.assertNotIn(path.suffix, [".md", ".markdown", ".pptx", ".gv", ".map"])
            if path.is_file() and path.suffix in [".html", ".xml", ".json", ".js"]:
                text = path.read_text()
                for value in forbidden:
                    self.assertNotIn(value, text, str(path.relative_to(DIST)))
        for name in [".git", "src", "source", "references", "tests", "docs"]:
            self.assertFalse((DIST / name).exists())

    def test_internal_links_and_images_resolve(self):
        self.assertTrue(DIST.is_dir(), "Build the site first")
        for path in DIST.rglob("*.html"):
            doc = Document(path.read_text())
            base = "https://bezensek.com/" + str(path.relative_to(DIST)).removesuffix("index.html")
            for link in doc.links + doc.images:
                target = urlsplit(urljoin(base, link))
                if target.netloc in ["bezensek.com", "www.bezensek.com"]:
                    with self.subTest(page=str(path.relative_to(DIST)), link=link):
                        self.assertTrue(output_path(target.path).is_file(), target.path)
                        self.assertNotRegex(target.path, r"^/blog/\d{4}/", "Link directly to the short canonical URL")

    def test_https_metadata_and_sitemap(self):
        self.assertTrue(DIST.is_dir(), "Build the site first")
        for path in DIST.rglob("*.html"):
            doc = Document(path.read_text())
            self.assertEqual(len(doc.canonicals), 1, str(path))
            self.assertTrue(doc.canonicals[0].startswith("https://bezensek.com/"))
        sitemap = ET.parse(DIST / "sitemap.xml").getroot()
        urls = {el.text for el in sitemap.iter() if el.tag.endswith("}loc")}
        for post in LEGACY["posts"]:
            self.assertIn("https://bezensek.com" + short_url(post["url"]), urls)
            self.assertNotIn("https://bezensek.com" + post["url"], urls)
        self.assertEqual((DIST / "CNAME").read_text().strip(), "bezensek.com")


if __name__ == "__main__":
    unittest.main(verbosity=2)
