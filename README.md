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

The course lives in two places built from the same source, `build/course.md`: the readable page
(`course.html`) and the database (one row per camp, with a stable id for every resource and exercise). Edit
`build/course.md`, then:

```bash
python3 build/build_course.py      # course.html
python3 build/build_course_db.py   # supabase/course_data.sql + build/course.json; bumps the course version
```

Run `supabase/course_data.sql` in the Supabase SQL editor (after `supabase/course.sql` the first time). Every
climber gets the fix at once; each camp records the version it last changed in (`changed_in`), and a camp that
changed after a climber's plan was made is flagged on their My course page and to their professor. Ids are
built from titles, so renaming a resource changes its id: check no applied plan uses the old one.

### The course and each climber's layer

`supabase/course.sql` holds `course_meta`, `course_phases` and `course_camps` (everyone reads, nobody writes
through the API) and two read-only functions:

- `course_for(uid)` returns the course as JSON with that climber's plan applied. `mycourse.html` draws it.
- `course_md(uid, camp)` returns the same as Markdown for the professor, from one link:
  `/rest/v1/rpc/course_md?uid=<id>&apikey=<key>` (add `&camp=m05` for one camp).

A plan (version 3) can, per camp, set a depth, add a note, `drop` resources by id, add `extra` resources
(`replaces` drops the original), add or replace `exercises`, and add to the `ready` check; `sideCamps` adds
extra camps (no test) after a given camp. The Ascent page checks every plan against the course before it can be
applied. Applying keeps the old plan: `plan/current` is the plan in force and `plan/h<timestamp>` rows are every
plan ever applied, which My course lists with a link to use one again.

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

### Tests and practice quizzes

`supabase/quiz.sql` adds four tables and two functions. Questions and the answer key are unreadable through the
API; `start_quiz(module, set)` issues a session of 8 random questions and `grade_quiz(session, answers)` marks it
on the server and, for the test set, writes the score to the climber's module row and grants "Checkpoint
passed" at 70%. Rules live in the functions: practice is unlimited and never posted; the test posts its latest
score with the attempt number; a retake opens 24 h after a fail, 72 h after two; an abandoned test counts as an
attempt once its clock runs out; passing closes the test. The question bank (currently Phases 0–2, 12 test +
12 practice per module) is not in this repository because it carries the answer key; the course owner keeps it
and loads it through the SQL editor. `quiz_attempts` is public to read so professors can see attempts and the
topics missed.
