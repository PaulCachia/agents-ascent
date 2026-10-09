#!/usr/bin/env python3
"""Build professor.html from professor/PROFESSOR.md: set-up steps, the rendered brief, and a copy button."""
import re, html, pathlib, json
import markdown

ROOT = pathlib.Path(__file__).resolve().parent.parent
md = (ROOT / "professor" / "PROFESSOR.md").read_text(encoding="utf-8")
body = markdown.markdown(re.sub(r"^# .*\n", "", md, count=1), extensions=["tables", "sane_lists", "fenced_code"], output_format="html5")
body = body.replace("<table>", '<div class="tbl"><table>').replace("</table>", "</table></div>")
body = re.sub(r'<a href="(http[^"]+)"', r'<a href="\1" target="_blank" rel="noopener"', body)

page = (ROOT / "build" / "professor.template.html").read_text(encoding="utf-8")
page = page.replace("<!--BRIEF_HTML-->", body).replace("<!--BRIEF_RAW-->", html.escape(md))
(ROOT / "professor.html").write_text(page, encoding="utf-8")
print("professor.html written,", len(page), "bytes")
