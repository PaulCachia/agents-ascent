# The Agent's Ascent

Paul Cachia's 26-week fast-track from novice to agentic AI developer, as a website:

- `index.html` — home: this week's plan, the three parts, how the professor loop works.
- `course.html` — the full curriculum (generated from `build/course.md` by `build/build_course.py`).
- `ascent.html` — the game-style progress map: 24 camps, XP, levels, badges, check-ins, study sessions.
- `assets/site.js` — shared storage, theme toggle, nav, and the start/stop study clock shown on every page.
- `assets/ascent.js` — the dashboard logic. `assets/site.css` — all styles (dark-first, light theme included).

Plain HTML, CSS and JavaScript. No build step for the site itself; only the course page is generated.

## Running it locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Updating the course text

Edit `build/course.md`, then:

```bash
python3 build/build_course.py
```

## Where progress is stored

In the browser (`localStorage`, keys prefixed `aa.v1.`). It does not sync between devices. The Ascent page has
**Copy progress for Claude** (export JSON) and **Import pasted JSON** (merge on another device).
Replacing this with a real database with Row-Level Security is a Phase 5 exercise in the course.

## Deploying

Hosted on GitHub Pages from the `main` branch (root). Any push to `main` redeploys within a minute or two.
