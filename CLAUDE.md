# Working on this repo with Claude

This is the public code for The Agent's Ascent. The reasoning behind it (decisions, incidents, the playbook and the
current Handover) is in Paul's private build-log repo, `Unconventionalists/ascent-buildlog`.

**Start of a session:** attach `Unconventionalists/ascent-buildlog` and read `HANDOVER.md`, then the newest file in `log/`.
Before changing an area, search its `decisions/` and `incidents/` indexes. If you can't reach the build log, ask Paul.

**After shipping** (pushed to `main` and checked live): do the wrap-up in the build log
(`playbook/checklists/session-wrap-up.md`). The log entry must list every commit hash shipped; a daily check flags
any that are missing.

**House rules**
- No secrets in this repo. The only key here is the public publishable key in `assets/config.js`.
- Never commit question banks or answers. They live only in the database and Paul's private copy.
- Copy that states a rule the code enforces (tests, waits, who can see what) must match the code: check the SQL.
- Test at 390 and 1200 px; iOS Safari needs a real iPhone. SQL is tested locally before it goes to the dashboard.
- After editing `professor/PROFESSOR.md`, rebuild `professor.html` with `python3 build/build_professor.py`.
- Dates and times are London time.
