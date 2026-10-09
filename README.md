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

Locally first: the browser's `localStorage` (keys prefixed `aa.v1.`) is always the working copy, so the site
works with no account at all. The Ascent page has **Copy progress for Claude** (export JSON) and
**Import pasted JSON** (merge on another device).

With cloud sync switched on, every change is also saved to a Supabase Postgres table and pulled back on
sign-in, so progress follows you between devices and Claude can read it.

### Switching on cloud sync

1. Create a free project at supabase.com.
2. SQL Editor → New query → paste `supabase/schema.sql` → Run. This creates the `progress` table, turns on
   Row-Level Security, and adds two policies: the signed-in owner can read and write their own rows; the public
   (anon) key can read, so Claude can see progress without holding a secret.
3. Authentication → URL Configuration → set Site URL to the site's address (so magic links come back here).
4. Put the project URL and anon key into `assets/config.js`. Both are public values; security is the RLS.
5. Open the site, click **Sign in** in the nav, enter your email, open the magic link **on that same device**
   (if it opens inside a mail app's viewer, choose "Open in browser"). Sign-in is per browser.
6. `ownerId` in `assets/config.js` is the climber shown to signed-out visitors by default (any climber can be
   chosen from the selector). Editing and the study clock need sign-in. Module rows flash "Saved to your
   database" as pushes land.

### Several climbers, one mountain

Every climber signs in with their own email and gets their own rows under RLS. A `profile` row (name, start
date, end goal, professor link, public flag) sets their week numbers and puts them on the shared mountain; a
`plan` row holds the professor's current plan. Signed out, the site shows one climber's climb read-only in a
separate overlay (`AA.setView`) that is never merged into the signed-in working copy.

Each climber has their own professor: a Claude Project carrying `professor/PROFESSOR.md` (served as
`professor.html` with set-up steps and a copy button; rebuild with `python3 build/build_professor.py`). The
professor reads the database through the public key, quizzes the student, and at each phase checkpoint hands
over a plan as JSON (or a `ascent.html#plan=<url-encoded json>` link). The site validates it — camps on the
essential spine (`core: true` in `assets/ascent.js`) can be lightened but never skipped — and the student
applies it. The plan sets a depth per module (core / expanded / lightened / skip), notes, extra resources and
optional week-by-week text.

Claude reads it with one call:

```
curl "https://<project>.supabase.co/rest/v1/progress?select=kind,key,data,updated_at&order=updated_at.desc" \
  -H "apikey: <anon key>"
```

## Deploying

Hosted on GitHub Pages from the `main` branch (root). Any push to `main` redeploys within a minute or two.
