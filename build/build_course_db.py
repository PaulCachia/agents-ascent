#!/usr/bin/env python3
"""Turn build/course.md into database rows: one row per camp (m00–m23) and per phase, with a stable id for every
resource and exercise, so a climber's plan can drop, swap or add to them by id.

Writes:
  supabase/course_data.sql   upsert of course_meta / course_phases / course_camps (run after supabase/course.sql)
  build/course.json          the same data, for checking and for the site's offline fallback
  build/course_db_state.json the course version and per-camp hashes; the version goes up when anything changes,
                             and each camp records the version it last changed in (changed_in)

Camp metadata (names, weeks, hours, video minutes, spine) comes from MODULES/PHASES in assets/ascent.js, so the
site and the database never disagree about the 24 camps.
"""
import hashlib, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "build" / "course.md"
STATE = ROOT / "build" / "course_db_state.json"
RELEASED = "2026-10-08"
PAGE = "https://paulcachia.github.io/agents-ascent/course.html"


def site_constants():
    js = (ROOT / "assets" / "ascent.js").read_text(encoding="utf-8")
    def grab(name):
        m = re.search(r"const %s = (\[.*?\n  \]);" % name, js, re.S)
        if not m:
            sys.exit("Could not find %s in ascent.js" % name)
        return m.group(1)
    code = "const PHASES=%s;const MODULES=%s;process.stdout.write(JSON.stringify({PHASES,MODULES}));" % (grab("PHASES"), grab("MODULES"))
    out = subprocess.run(["node", "-e", code], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def clean(text):
    text = text.replace("\\~", "~").replace("\\_", "_").replace("\\[", "[").replace("\\]", "]")
    return text


STOP = {"for", "the", "and", "a", "an", "to", "with", "in", "of", "your", "from", "on", "s1", "s2", "s3", "now"}


def slug(text, n=5, cap=44):
    t = re.sub(r"\*|`|\[|\]|\(.*?\)", " ", text.lower())
    words = [w for w in re.findall(r"[a-z0-9]+", t) if w not in STOP]
    s = "-".join(words[:n])[:cap].strip("-")
    return s or "item"


URL_RE = re.compile(r"https?://[^\s|)·]+")


def first_url(cell):
    m = URL_RE.search(cell or "")
    return m.group(0).rstrip(".,;") if m else ""


def split_row(line):
    cells = [c.strip() for c in line.strip().strip("|").split("|")]
    return cells


# Where each camp starts inside its phase. Text before the first marker is the phase intro; "outro" collects
# phase-level text (project, checkpoint, pitfalls) that belongs to the whole phase rather than one camp.
CUTS = {
    0: [(r"^### Key context", "m00")],
    1: [(r"^### Module 1\.1", "m01"), (r"^### Module 1\.2", "m02"), (r"^### Module 1\.3", "m03"), (r"^### Module 1\.4", "m04"),
        (r"^#### Part B", "m11"), (r"^\*\*Phase 1 project", "outro")],
    2: [(r"^### Module 2\.1", "m05"), (r"^### Module 2\.2", "m06"), (r"^### Module 2\.3", "m07"), (r"^\*\*How to learn with AI here", "outro")],
    3: [(r"^\| Resource", "m08")],
    4: [(r"^### Module 4\.1", "m09"), (r"^### Module 4\.2", "m10"), (r"^\*\*Ready to move on", "outro")],
    5: [(r"^\| Resource", "m12"), (r"^### Security", "m13"), (r"^\*\*Capstone 1", "m14")],
    6: [(r"^### Module 6\.1", "m15"), (r"^### Module 6\.2", "m16"), (r"^### Module 6\.3", "m17"), (r"^### Module 6\.4", "m18"), (r"^\*\*Capstone 2", "m19")],
    7: [(r"^\| Resource", "m20"), (r"^\*\*Capstone 3", "m21")],
    8: [(r"^\| Topic", "m22"), (r"^\*\*Capstone 4", "m23")],
}
# Headings that only repeat the camp's own title (dropped from the body; the camp header shows the title).
STRUCTURAL = re.compile(r"^#{3,4} (Module \d|Part [AB] –|Resources$|Security for vibe-coded apps)")


def blocks(lines):
    """Group lines into blocks: table, list, heading or paragraph."""
    out, cur, kind = [], [], None
    def flush():
        nonlocal cur, kind
        if cur:
            out.append((kind, cur))
        cur, kind = [], None
    for ln in lines:
        s = ln.rstrip()
        if not s.strip():
            flush(); continue
        k = "table" if s.startswith("|") else "list" if re.match(r"^\s*(- |\d+\. )", s) else "heading" if s.startswith("#") else "para"
        if k == "heading":
            flush(); out.append(("heading", [s])); continue
        if kind is None:
            kind = k
        elif k != kind and not (kind == "list" and k == "para" and s.startswith("  ")):
            # a paragraph directly followed by a list (e.g. "**Concepts:**" + "1. …") stays one block
            if kind == "para" and k == "list":
                kind = "para+list"
            elif kind == "para+list" and k == "list":
                pass
            else:
                flush(); kind = k
        cur.append(s)
    flush()
    return out


def table_items(key, rows, seen):
    head = [h.lower() for h in split_row(rows[0])]
    body = [split_row(r) for r in rows[2:]]
    items = []
    if head[:3] == ["resource", "creator", "url"]:
        for c in body:
            c += [""] * (8 - len(c))
            title, creator, url_cell, dur, date, cost, why, status = c[:8]
            items.append(dict(title=title, creator=creator, url=first_url(url_cell), link=url_cell if url_cell.strip() != first_url(url_cell) else "",
                              len=dur, date=date, cost=cost, why=why, status=status))
    elif head[:3] == ["topic", "resource", "url"]:
        for c in body:
            c += [""] * (5 - len(c))
            if len(head) == 5:
                topic, res, url_cell, notes, status = c[:5]
            else:
                topic, res, url_cell, status = c[:4]; notes = ""
            items.append(dict(title=topic + ": " + res, creator="", url=first_url(url_cell), link=url_cell if url_cell.strip() != first_url(url_cell) else "",
                              len="", date="", cost="", why=notes, status=status))
    elif head[:2] == ["framework", "language"]:
        for c in body:
            c += [""] * (5 - len(c))
            fw, lang, best, watch, learn = c[:5]
            items.append(dict(title=fw, creator=lang, url=first_url(learn), link=learn, len="", date="", cost="",
                              why="Best for: " + best + ". Watch-outs: " + watch + ".", status=("✔" if "✔" in learn else "◐" if "◐" in learn else "")))
    else:
        return None
    for it in items:
        it["kind"] = "video" if re.search(r"youtube\.com|youtu\.be", it["url"] + it["link"]) else ("reading" if re.match(r"(?i)reading|reference", it["len"] or "") else "course")
        base = key + "." + slug(it["title"])
        iid, n = base, 2
        while iid in seen:
            iid = "%s-%d" % (base, n); n += 1
        seen.add(iid)
        it["id"] = iid
        it["status"] = it["status"].strip()
    return items


LABEL = re.compile(r"^\*\*(Exercise|Ready to move on when…|Pitfalls|Capstone \d[^*]*|Module 1\.4 half-day exercise):?\*\*:?\s*", re.I)


def build():
    consts = site_constants()
    modules = {m["key"]: m for m in consts["MODULES"]}
    phase_meta = {p["id"]: p for p in consts["PHASES"]}
    src = clean(SRC.read_text(encoding="utf-8")).splitlines()

    # Split into H2 sections, keep the nine phases.
    sections, cur = [], None
    for ln in src:
        if ln.startswith("## "):
            cur = [ln[3:].strip(), []]; sections.append(cur)
        elif cur:
            cur[1].append(ln)
    phases = [s for s in sections if re.match(r"Phase \d", s[0])]
    assert len(phases) == 9, [s[0] for s in phases]

    camps = {k: dict(body=[], items=[], exercises=[], ready="", pitfalls="") for k in modules}
    phase_rows = []
    for n, (title, lines) in enumerate(phases):
        cuts = CUTS[n]
        target, segs = "intro", {"intro": [], "outro": []}
        for ln in lines:
            for pat, tgt in cuts:
                if re.match(pat, ln):
                    target = tgt; segs.setdefault(tgt, []); break
            segs.setdefault(target, []).append(ln)
        pid = "p%d" % n
        intro, outro = [], []
        for kind, bl in blocks(segs["intro"]):
            intro.append("\n".join(bl))
        for kind, bl in blocks(segs.get("outro", [])):
            outro.append("\n".join(bl))
        name = re.sub(r"\s*\(.*\)$", "", title)
        timing = (re.search(r"\((.*)\)$", title) or [None, ""])[1]
        phase_rows.append(dict(id=pid, pos=n, title=name, timing=timing, land=phase_meta[pid]["land"], weeks=phase_meta[pid]["weeks"],
                               intro="\n\n".join(intro), outro="\n\n".join(outro)))
        for key in [t for _, t in cuts if t.startswith("m")]:
            camp, seen = camps[key], set()
            pending_ex_label = False
            for kind, bl in blocks(segs.get(key, [])):
                text = "\n".join(bl)
                if kind == "heading":
                    if STRUCTURAL.match(text):
                        continue
                    camp["body"].append("#### " + text.lstrip("#").strip()); continue
                if kind == "table":
                    items = table_items(key, bl, seen)
                    if items is not None:
                        camp["items"] += items; continue
                    camp["body"].append(text); continue
                m = LABEL.match(text)
                if m:
                    label, rest = m.group(1), text[m.end():]
                    if label.lower().startswith("exercise"):
                        camp["exercises"].append(dict(text=rest)); continue
                    if label.lower().startswith("module 1.4 half-day"):
                        # Item 1 (conflicts and recovery) is Part A's work; items 2–4 are Part B's.
                        steps = re.split(r"\n(?=\d+\. )", rest.strip())
                        steps = [re.sub(r"^\d+\.\s*", "", s).strip() for s in steps if s.strip()]
                        if not steps:
                            pending_ex_label = True; continue
                        camps["m04"]["exercises"].append(dict(text=steps[0]))
                        for s in steps[1:]:
                            camp["exercises"].append(dict(text=s))
                        continue
                    if label.lower().startswith("ready"):
                        camp["ready"] = rest; continue
                    if label.lower().startswith("pitfalls"):
                        camp["pitfalls"] = rest; continue
                    if label.lower().startswith("capstone"):
                        camp["exercises"].append(dict(text=rest, label=label.strip().rstrip(":"))); continue
                if pending_ex_label and kind == "list":
                    steps = [re.sub(r"^\d+\.\s*", "", s).strip() for s in bl]
                    camps["m04"]["exercises"].append(dict(text=steps[0]))
                    for s in steps[1:]:
                        camp["exercises"].append(dict(text=s))
                    pending_ex_label = False; continue
                camp["body"].append(text)

    # Assemble rows.
    rows = []
    for pos, (key, m) in enumerate(modules.items()):
        c = camps[key]
        for i, e in enumerate(c["exercises"], 1):
            e["id"] = "%s.ex%d" % (key, i)
        content_phase = "p1" if key == "m11" else m["phase"]
        rows.append(dict(key=key, pos=pos, phase=content_phase, title=m["name"], week_label=m["wk"], week=m["week"],
                         hours=m.get("hours"), video_min=m.get("video") or 0, vids=m.get("vids", ""), core=bool(m.get("core")),
                         capstone=bool(m.get("cap")), body="\n\n".join(c["body"]), items=c["items"], exercises=c["exercises"],
                         ready=c["ready"], pitfalls=c["pitfalls"]))
    for r in rows:
        assert r["items"] or r["exercises"] or r["body"], "empty camp " + r["key"]

    # Versioning: bump when the content changes; each camp keeps the version it last changed in.
    state = json.loads(STATE.read_text()) if STATE.exists() else {"version": 0, "camps": {}, "phases": ""}
    def h(o):
        return hashlib.sha256(json.dumps(o, sort_keys=True, ensure_ascii=False).encode()).hexdigest()[:16]
    hashes = {r["key"]: h({k: v for k, v in r.items() if k != "changed_in"}) for r in rows}
    ph_hash = h(phase_rows)
    changed = [k for k in hashes if state["camps"].get(k, {}).get("hash") != hashes[k]] or (ph_hash != state.get("phases"))
    version = state["version"] + (1 if changed else 0)
    for r in rows:
        prev = state["camps"].get(r["key"], {})
        r["changed_in"] = version if prev.get("hash") != hashes[r["key"]] else prev.get("changed_in", version)
    new_state = {"version": version, "phases": ph_hash, "camps": {r["key"]: {"hash": hashes[r["key"]], "changed_in": r["changed_in"]} for r in rows}}
    STATE.write_text(json.dumps(new_state, indent=1) + "\n")

    meta = dict(id=1, version=version, released=RELEASED, title="Novice to Agentic AI Developer — Fast-Track Curriculum", page=PAGE)
    data = dict(meta=meta, phases=phase_rows, camps=rows)
    (ROOT / "build" / "course.json").write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")

    def dq(obj, tag):
        s = json.dumps(obj, ensure_ascii=False)
        assert "$" + tag + "$" not in s
        return "$" + tag + "$" + s + "$" + tag + "$"
    camp_cols = ["key", "pos", "phase", "title", "week_label", "week", "hours", "video_min", "vids", "core", "capstone", "body", "items", "exercises", "ready", "pitfalls", "changed_in"]
    phase_cols = ["id", "pos", "title", "timing", "land", "weeks", "intro", "outro"]
    sql = ["-- The Agent's Ascent — course content (generated by build/build_course_db.py from build/course.md; do not edit by hand).",
           "-- Run supabase/course.sql once first (tables and functions); run this file whenever the course changes.",
           "-- Course version %d." % version, "begin;",
           "insert into public.course_meta (id, version, released, title, page) values (1, %d, '%s', %s, '%s')" % (version, RELEASED, "'" + meta["title"].replace("'", "''") + "'", PAGE),
           "  on conflict (id) do update set version = excluded.version, released = excluded.released, title = excluded.title, page = excluded.page, updated_at = now();",
           "insert into public.course_phases (%s)" % ", ".join(phase_cols),
           "  select %s from jsonb_populate_recordset(null::public.course_phases, %s::jsonb)" % (", ".join(phase_cols), dq(phase_rows, "ph")),
           "  on conflict (id) do update set %s;" % ", ".join("%s = excluded.%s" % (c, c) for c in phase_cols[1:]),
           "insert into public.course_camps (%s)" % ", ".join(camp_cols),
           "  select %s from jsonb_populate_recordset(null::public.course_camps, %s::jsonb)" % (", ".join(camp_cols), dq(rows, "cc")),
           "  on conflict (key) do update set %s, updated_at = now();" % ", ".join("%s = excluded.%s" % (c, c) for c in camp_cols[1:]),
           "delete from public.course_camps where key not in (%s);" % ", ".join("'%s'" % r["key"] for r in rows),
           "commit;",
           "select version, (select count(*) from public.course_camps) as camps, (select count(*) from public.course_phases) as phases from public.course_meta;"]
    out = "\n".join(sql) + "\n"
    (ROOT / "supabase" / "course_data.sql").write_text(out, encoding="utf-8")
    n_items = sum(len(r["items"]) for r in rows); n_ex = sum(len(r["exercises"]) for r in rows)
    print("course version %d; %d camps, %d phases, %d resources, %d exercises; course_data.sql %d bytes" % (version, len(rows), len(phase_rows), n_items, n_ex, len(out.encode())))
    for r in rows:
        print(" %s %-48s items=%-2d ex=%d ready=%s pitfalls=%s body=%d" % (r["key"], r["title"][:48], len(r["items"]), len(r["exercises"]), "y" if r["ready"] else "-", "y" if r["pitfalls"] else "-", len(r["body"])))


if __name__ == "__main__":
    build()
