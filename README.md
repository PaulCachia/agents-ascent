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
6. After the first sign-in, copy your `user_id` from the `progress` table into `ownerId` in `assets/config.js`.
   Signed-out visitors (your phone, say) then see a read-only copy of your progress through the public-read
   policy; editing and the study clock need sign-in. Module rows flash "Saved to your database" as pushes land.

Claude reads it with one call:

```
curl "https://<project>.supabase.co/rest/v1/progress?select=kind,key,data,updated_at&order=updated_at.desc" \
  -H "apikey: <anon key>"
```

## Deploying

Hosted on GitHub Pages from the `main` branch (root). Any push to `main` redeploys within a minute or two.
