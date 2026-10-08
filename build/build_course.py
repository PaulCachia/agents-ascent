#!/usr/bin/env python3
"""Build course.html from course.md (exported from the curriculum doc)."""
import re, html, pathlib
import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
md_path = ROOT / "build" / "course.md"
src = md_path.read_text(encoding="utf-8")

# Clean the doc export: unescape tildes, drop the doc byline + tracker line.
src = src.replace("\\~", "~")
lines = src.splitlines()
out = []
skip_patterns = (re.compile(r"^Oct 8, 2026 ·"), re.compile(r"^Progress, quiz scores and check-ins live in"))
for ln in lines:
    if any(p.match(ln) for p in skip_patterns):
        continue
    out.append(ln)
src = "\n".join(out)
# Replace the H1 (the page provides its own header)
src = re.sub(r"^# .*\n", "", src, count=1)

body = markdown.markdown(src, extensions=["tables", "sane_lists", "fenced_code"], output_format="html5")

def slug(text):
    t = text.split(" (")[0]
    t = re.sub(r"<[^>]+>", "", t)
    t = html.unescape(t).lower()
    t = re.sub(r"[^a-z0-9]+", "-", t).strip("-")
    return t

toc = []
def h2_sub(m):
    text = m.group(1)
    s = slug(text)
    toc.append((s, html.unescape(re.sub(r"<[^>]+>", "", text)).split(" (")[0]))
    return '<h2 id="%s">%s</h2>' % (s, text)
body = re.sub(r"<h2>(.*?)</h2>", h2_sub, body)
body = re.sub(r"<h3>(.*?)</h3>", lambda m: '<h3 id="%s">%s</h3>' % (slug(m.group(1)), m.group(1)), body)
body = body.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")
# External links open in a new tab
body = re.sub(r'<a href="(https?://[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', body)

toc_html = "\n".join('<a href="#%s">%s</a>' % (s, html.escape(t)) for s, t in toc)

template = (ROOT / "build" / "course.template.html").read_text(encoding="utf-8")
page = template.replace("{{TOC}}", toc_html).replace("{{CONTENT}}", body)
(ROOT / "course.html").write_text(page, encoding="utf-8")
print("course.html written:", len(page), "chars;", len(toc), "sections")
for s, t in toc:
    print(" -", s)
