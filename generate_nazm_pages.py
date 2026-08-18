#!/usr/bin/env python3
"""
generate_nazm_pages.py
-------------------------------------------------------------------
Zaan Farzaan website — per-nazm static page generator.
Sibling of generate_ghazal_pages.py; same idea, applied to nazms.html
instead of ghazals.html. See generate_ghazal_pages.py's docstring for
the full "why" (fragment URLs aren't indexable/shareable on their own).

Reads NAZM_ITEMS out of nazms-data.js and, for every nazm, writes a
small, real, crawlable static HTML file at:

    /nazms/nazm-<num>.html

Each file has its own <title>, meta description, canonical URL, OG/
Twitter tags, and a JSON-LD CreativeWork block — built from the nazm's
own title and opening lines — plus the full nazm text rendered as plain
HTML. A prominent link sends readers back to the full interactive
experience at nazms.html#nazm-<num>.

It also rewrites the <nazm>-related block of sitemap.xml to include
every generated URL.

USAGE
-----
    python3 generate_nazm_pages.py [path-to-site-root]

Run this any time you add/edit a nazm in nazms-data.js, then commit
the regenerated files. Nothing here needs to run on GitHub Pages
itself — it's a pre-publish build step. Defaults to the current
directory if no path is given; expects nazms-data.js, style.css,
nazms.html, sitemap.xml, logo.png etc. in that directory (i.e. point
it at your `final_site` folder).
"""

import json
import os
import re
import sys
import html as html_lib

SITE_URL = "https://zaanfarzaan.site"
BRAND = "Zaan Farzaan"
AUTHOR_NAME = "Zaan Farzaan"


def load_nazm_items(site_root):
    data_path = os.path.join(site_root, "nazms-data.js")
    with open(data_path, "r", encoding="utf-8") as f:
        content = f.read()
    m = re.search(r"NAZM_ITEMS\s*=\s*(\[.*\]);", content, re.S)
    if not m:
        raise SystemExit("Could not find NAZM_ITEMS array in nazms-data.js")
    return json.loads(m.group(1))


def strip_tags(s):
    return re.sub(r"<[^>]+>", " ", s or "").strip()


def collapse_ws(s):
    return re.sub(r"\s+", " ", s or "").strip()


def opening_lines_text(item, lang="hi", max_lines=2):
    verses_key = "versesHtml" if lang == "hi" else "versesHtmlEn"
    verses = item.get(verses_key) or item.get("versesHtml")
    snippet = " ".join(collapse_ws(strip_tags(v)) for v in verses[:max_lines])
    return snippet


def build_description(item):
    opening = opening_lines_text(item, "hi", max_lines=2)
    desc = f"{opening} — ज़ान फ़रज़ान की नज़्म \u2018{item['title']}\u2019 (#{item['num']})। पूरी नज़्म पढ़ें।"
    if len(desc) > 300:
        desc = desc[:297].rsplit(" ", 1)[0] + "…"
    return desc


def build_title(item):
    return f"{item['title']} — Nazm #{item['num']} | {BRAND}"


def json_ld(item, canonical_url):
    plain_text = collapse_ws(strip_tags(" / ".join(item.get("versesHtml", []))))
    data = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": item["title"],
        "alternateName": item.get("titleEn", ""),
        "genre": "Nazm",
        "inLanguage": "hi",
        "author": {"@type": "Person", "name": AUTHOR_NAME},
        "url": canonical_url,
        "mainEntityOfPage": canonical_url,
        "text": plain_text,
        "isPartOf": {
            "@type": "CreativeWorkSeries",
            "name": f"Nazms — {BRAND}",
            "url": f"{SITE_URL}/nazms.html",
        },
        "publisher": {"@type": "Person", "name": AUTHOR_NAME},
    }
    return json.dumps(data, ensure_ascii=False, indent=2)


PAGE_TEMPLATE = """<!DOCTYPE html>
<html lang="hi">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title}</title>
<meta name="description" content="{description}">
<link rel="canonical" href="{canonical_url}">

<meta property="og:title" content="{itemTitle} — Nazm #{num}">
<meta property="og:description" content="{description}">
<meta property="og:image" content="{SITE_URL}/logo.png">
<meta property="og:url" content="{canonical_url}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="{BRAND}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="{itemTitle} — Nazm #{num}">
<meta name="twitter:description" content="{description}">
<meta name="twitter:image" content="{SITE_URL}/logo.png">

<script type="application/ld+json">
{json_ld}
</script>

<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Lora:ital,wght@0,400;0,500;1,400&family=Noto+Serif+Devanagari:wght@400;500;600;700&family=Noto+Nastaliq+Urdu:wght@400;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../style.css">
<link rel="icon" type="image/x-icon" href="../favicon.ico">
<link rel="icon" type="image/png" sizes="32x32" href="../favicon-32x32.png">
<link rel="icon" type="image/png" sizes="96x96" href="../favicon-96x96.png">
<link rel="icon" type="image/png" sizes="16x16" href="../favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="../apple-touch-icon.png">
</head>
<body data-page="nazms">

<nav>
  <div class="brand-group">
    <a href="../index.html" class="brand-logo-link"><img src="../logo.png" alt="Zaan Farzaan" class="brand-logo" width="44" height="44"></a>
    <a href="../index.html" class="brand">ज़ान फ़रज़ान <span>Shaayar · Poet</span></a>
  </div>
  <div class="nav-right">
    <div class="navlinks" id="nav-links">
      <a href="../index.html" data-page="home">होम</a>
      <a href="../about.html" data-page="about">परिचय</a>
      <a href="../ghazals.html" data-page="ghazals">ग़ज़लें</a>
      <a href="../nazms.html" data-page="nazms">नज़्में</a>
      <a href="../profiles.html" data-page="profiles">प्रोफ़ाइल</a>
      <a href="../feedback.html" data-page="feedback">फ़ीडबैक</a>
      <a href="../contact.html" data-page="contact">संपर्क</a>
    </div>
    <button type="button" class="nav-toggle" id="nav-toggle" aria-label="मेन्यू खोलें">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
    </button>
  </div>
</nav>

<main>
<div class="poem-detail open" style="display:block;">
  <a href="../nazms.html" class="back-link">&larr; सभी नज़्में</a>
  <div class="card manuscript reveal in" id="{id}">
    <div class="kind">Nazm · #{num}</div>
    <h3>{itemTitle}</h3>
    {verses_html}
  </div>
  <div class="poem-nav-buttons">
    {prev_link}
    {next_link}
  </div>
  <p class="seo-cta" style="margin:1.6rem 0 0; text-align:center;">
    <a href="../nazms.html#{id}">इस नज़्म को खोज, शेयर और डाउनलोड के पूरे इंटरएक्टिव अनुभव के साथ पढ़ें — ज़ान फ़रज़ान की वेबसाइट पर &rarr;</a>
  </p>

  <div class="card" style="margin-top:1.6rem;">
    <div class="kind">Roman Transliteration</div>
    <h3>{itemTitleEn}</h3>
    {verses_html_en}
  </div>
</div>
</main>

<footer class="site-footer">
  <div class="fineprint">© 2026 ज़ान फ़रज़ान · संग्रह</div>
  <div class="foot-links">
    <a href="mailto:zaanfarzaan1@gmail.com">Email</a>
    <a href="https://instagram.com/zaanfarzaan" target="_blank" rel="noopener">Instagram</a>
  </div>
</footer>

<script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
<script src="../ur-translit.js"></script>
<script src="../i18n.js"></script>
<script src="../app.js"></script>
<script>
  if (typeof attachCardActions === 'function') { attachCardActions(document); }
</script>
</body>
</html>
"""


def render_page(item, prev_item, next_item):
    num = item["num"]
    canonical_url = f"{SITE_URL}/nazms/{item['id']}.html"

    if prev_item:
        prev_link = f'<a href="{prev_item["id"]}.html">&larr; पिछली</a>'
    else:
        prev_link = '<span class="disabled"></span>'
    if next_item:
        next_link = f'<a href="{next_item["id"]}.html">अगली &rarr;</a>'
    else:
        next_link = '<span class="disabled"></span>'

    replacements = {
        "{title}": html_lib.escape(build_title(item)),
        "{description}": html_lib.escape(build_description(item)),
        "{canonical_url}": canonical_url,
        "{itemTitle}": html_lib.escape(item["title"]),
        "{itemTitleEn}": html_lib.escape(item.get("titleEn", "")),
        "{num}": str(num),
        "{SITE_URL}": SITE_URL,
        "{BRAND}": BRAND,
        "{json_ld}": json_ld(item, canonical_url),
        "{id}": item["id"],
        "{verses_html}": "".join(item["versesHtml"]),
        "{verses_html_en}": "".join(item.get("versesHtmlEn", [])),
        "{prev_link}": prev_link,
        "{next_link}": next_link,
    }
    html_out = PAGE_TEMPLATE
    for key, val in replacements.items():
        html_out = html_out.replace(key, val)
    return html_out


def update_sitemap(site_root, items):
    sitemap_path = os.path.join(site_root, "sitemap.xml")
    with open(sitemap_path, "r", encoding="utf-8") as f:
        sitemap = f.read()

    start_marker = "  <!-- BEGIN individual nazm pages (auto-generated by generate_nazm_pages.py) -->"
    end_marker = "  <!-- END individual nazm pages -->"

    block_lines = [start_marker]
    for item in items:
        block_lines.append("  <url>")
        block_lines.append(f"    <loc>{SITE_URL}/nazms/{item['id']}.html</loc>")
        block_lines.append("  </url>")
    block_lines.append(end_marker)
    block = "\n".join(block_lines)

    if start_marker in sitemap:
        sitemap = re.sub(
            re.escape(start_marker) + r".*?" + re.escape(end_marker),
            block,
            sitemap,
            flags=re.S,
        )
    else:
        sitemap = sitemap.replace("</urlset>", block + "\n</urlset>")

    with open(sitemap_path, "w", encoding="utf-8") as f:
        f.write(sitemap)


def main():
    site_root = sys.argv[1] if len(sys.argv) > 1 else "."
    site_root = os.path.abspath(site_root)

    items = load_nazm_items(site_root)
    out_dir = os.path.join(site_root, "nazms")
    os.makedirs(out_dir, exist_ok=True)

    for i, item in enumerate(items):
        prev_item = items[i - 1] if i > 0 else None
        next_item = items[i + 1] if i < len(items) - 1 else None
        page_html = render_page(item, prev_item, next_item)
        out_path = os.path.join(out_dir, f"{item['id']}.html")
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(page_html)
        print(f"wrote {out_path}")

    update_sitemap(site_root, items)
    print(f"updated {os.path.join(site_root, 'sitemap.xml')}")
    print(f"\nDone. {len(items)} nazm pages generated in {out_dir}")


if __name__ == "__main__":
    main()
