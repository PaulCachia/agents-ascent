/* The Agent's Ascent — shared site script: storage, theme, nav, the start/stop time tracker, export/import. */
window.AA = (function () {
  "use strict";
  const KEY = "aa.v1.";
  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { return false; } try { window.dispatchEvent(new CustomEvent("aa:store", { detail: { key: k } })); } catch (e) {} return true; }
  };
  const DEFAULT_START = "2026-10-08"; // the expedition's first day when a climber has no start date yet
  const TOTAL_WEEKS = 26;

  /* A read-only "view" overlay: another climber's data, kept apart from this browser's own working copy so it can
     never be merged or pushed into the signed-in account. While viewing, the getters below read the overlay. */
  let viewing = false;
  function setView(d) { d = d || {}; store.set("view.modules", d.modules || {}); store.set("view.checkins", d.checkins || []); store.set("view.sessions", d.sessions || []); store.set("view.profile", d.profile || {}); store.set("view.plan", d.plan || null); store.set("view.planlog", d.planlog || []); viewing = true; }
  function clearView() { viewing = false; }
  function isViewing() { return viewing; }
  function vk(k) { return viewing ? "view." + k : k; }
  /* This browser's own working copy, never the view overlay: what sync pushes, merges and backs up. */
  const own = {
    modules() { const m = store.get("modules", {}); return m && typeof m === "object" ? m : {}; },
    checkins() { const c = store.get("checkins", []); return Array.isArray(c) ? c : []; },
    sessions() { const s = store.get("sessions", []); return Array.isArray(s) ? s : []; },
    profile() { const p = store.get("profile", {}); return p && typeof p === "object" ? p : {}; },
    plan() { const p = store.get("plan", null); return p && typeof p === "object" && p.modules ? p : null; },
    planlog() { const l = store.get("planlog", []); return Array.isArray(l) ? l.filter(e => e && e.at && e.plan) : []; }
  };
  const PLAN = [
    "Phase 0 + terminal: Karpathy talk, NetworkChuck, WSL/Homebrew. Deliverable: learning contract.",
    "Quick win: fCC Claude Code Full Course + fCC Git crash course. Deliverable: this site deployed from your own repo.",
    "SSH/VS Code, how the web works, Git depth (conflicts, rebase, reflog). Deliverable: PR workflow without notes.",
    "Python I: Mosh; CS50P lectures 0–3. Deliverable: API → CSV script.",
    "Python II: CS50P 4–6; uv. Deliverable: async fetcher.",
    "TypeScript + Node (Total TypeScript). Deliverable: TS CLI tool.",
    "HTML/CSS + reading code. Deliverable: planted-bug fix.",
    "LLMs: Karpathy Deep Dive; context engineering. Deliverable: two-vendor JSON test.",
    "Claude Code core: 101, in Action, docs. Deliverable: CLAUDE.md + plan-mode feature.",
    "Hooks, skills, subagents, MCP. Deliverable: skill + hook + subagent + MCP.",
    "Alternatives + headless/CI + GitHub as the agents' OS. Deliverable: agent PR reviewed and squash-merged; main protected.",
    "Next.js (nextjs.org/learn). Deliverable: skeleton with auth.",
    "Supabase + RLS. Deliverable: RLS-tested schema.",
    "SaaS build (JS Mastery). Deliverable: core feature.",
    "Stripe + webhooks. Deliverable: test-mode subscriptions.",
    "Deploy, CI, Sentry, security audit. Deliverable: Capstone 1 live.",
    "Launch to 10 users; Ng Agentic AI modules 1–2. Deliverable: first feedback.",
    "Hand-built agent loop. Deliverable: 80-line agent.",
    "MCP (DLAI; Hugging Face). Deliverable: your MCP server.",
    "Frameworks: Agent SDK, OpenAI Agents SDK, LangGraph. Deliverable: same agent in 2 frameworks.",
    "Evals, observability, RAG. Deliverable: eval set + traces.",
    "Capstone 2: production agent.",
    "n8n + integrations. Deliverable: inbox triage.",
    "Multi-agent + human-in-the-loop. Deliverable: Slack approval loop.",
    "Capstone 3 + compliance. Deliverable: 7-day unattended run.",
    "Validation + launch. Deliverable: Capstone 4 launched."
  ];
  function todayISO() { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  /* Profile: name, start date (ISO), goal, professor link, public flag. One row per climber. */
  function profile() { const p = store.get(vk("profile"), {}); return p && typeof p === "object" ? p : {}; }
  function setProfile(p) { store.set("profile", p); }
  function startISO() { const p = profile(); return /^\d{4}-\d{2}-\d{2}$/.test(p.start || "") ? p.start : DEFAULT_START; }
  function startDate() { const q = startISO().split("-"); return new Date(+q[0], +q[1] - 1, +q[2]); }
  function currentWeek() { const d = Math.floor((Date.now() - startDate().getTime()) / 864e5); return Math.max(1, Math.floor(d / 7) + 1); }
  /* The professor's plan (see professor.html): depth per module, optional week text, notes. null = the default course. */
  function plan() { const p = store.get(vk("plan"), null); return p && typeof p === "object" && p.modules ? p : null; }
  function setPlan(p) { store.set("plan", p); }
  /* Every plan ever applied, oldest first: [{ at: ms, plan }]. The one in force is also the "plan" key. */
  function planHistory() { const l = store.get(vk("planlog"), []); return Array.isArray(l) ? l.filter(e => e && e.at && e.plan && e.plan.modules) : []; }
  /* Apply a plan: stamp when, and which course version it was made against, then keep it in the history too. */
  function applyPlan(p, opt) {
    opt = opt || {}; const at = Date.now();
    const q = Object.assign({}, p, { appliedAt: new Date(at).toISOString() });
    if (opt.courseVersion) q.courseVersion = opt.courseVersion;
    if (opt.reappliedFrom) q.reappliedFrom = opt.reappliedFrom; else delete q.reappliedFrom;
    const log = own.planlog().concat([{ at: at, plan: q }]); while (log.length > 30) log.shift();
    store.set("planlog", log); store.set("plan", q); return q;
  }
  function weekPlan(n) { const p = plan(); const w = p && Array.isArray(p.weeks) && p.weeks[n - 1]; return w || PLAN[n - 1] || ""; }
  function fmtDate(iso) { if (!iso) return ""; const p = iso.split("-"); if (p.length < 3) return iso; const m = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][+p[1] - 1]; return (+p[2]) + " " + m + " " + p[0]; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  const esc = s => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  /* Theme */
  function applyTheme() { const t = store.get("theme", null); if (t === "dark" || t === "light") document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme"); }
  function toggleTheme() { const cur = store.get("theme", null); const sys = window.matchMedia && matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"; const now = (cur || sys) === "dark" ? "light" : "dark"; store.set("theme", now); applyTheme(); }

  /* Nav */
  function nav(active) {
    const el = document.createElement("div"); el.className = "nav";
    el.innerHTML = '<div class="nav-in"><a class="brand" href="index.html"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 20 9 7l4 6 2-3 7 10Z" fill="var(--accent)"/><path d="M9 7l2 3-2 1-2-1Z" fill="var(--snow)"/></svg><span>The Agent\'s Ascent</span></a>' +
      '<nav><a href="index.html" data-p="home">Home</a><a href="mycourse.html" data-p="course">My course</a><a href="ascent.html" data-p="ascent">Ascent</a></nav>' +
      '<button class="theme" type="button" id="themeBtn" aria-label="Toggle light and dark theme" title="Theme">◐</button>' +
      '<a class="avatar" id="navAvatar" href="profile.html" aria-label="My profile" title="My profile"></a></div>';
    document.body.prepend(el);
    const a = el.querySelector('nav a[data-p="' + active + '"]'); if (a) a.classList.add("on");
    el.querySelector("#themeBtn").addEventListener("click", toggleTheme);
    if (active === "profile") el.querySelector("#navAvatar").classList.add("on");
    paintAvatar(); ["aa:auth", "aa:progress", "storage"].forEach(ev => window.addEventListener(ev, paintAvatar));
    window.addEventListener("aa:store", e => { if (e.detail && e.detail.key === "profile") paintAvatar(); });
  }
  /* The top-bar button for My profile is the climber's own picture (never a viewed climber's). */
  function paintAvatar() { const el = document.getElementById("navAvatar"); if (!el) return; const p = own.profile(); const has = !!(p.photo && /^data:image\//.test(p.photo));
    el.innerHTML = has ? '<img src="' + p.photo + '" alt="">' : '<svg viewBox="-12 -48 24 24" aria-hidden="true"><circle class="bot-body" cx="0" cy="-36" r="9"/><circle class="bot-eye" cx="-3.5" cy="-37" r="1.8"/><circle class="bot-eye" cx="3.5" cy="-37" r="1.8"/></svg>'; el.classList.toggle("has", has); }

  /* Sessions / tracker */
  function sessions() { const s = store.get(vk("sessions"), []); return Array.isArray(s) ? s : []; }
  function tracker() { const t = store.get("tracker", null); return t && t.running && t.start ? t : null; }
  function emit() { window.dispatchEvent(new CustomEvent("aa:sessions")); }
  function startSession(note) { if (tracker()) return false; store.set("tracker", { running: true, start: Date.now(), note: note || "" }); emit(); return true; }
  function stopSession(note) {
    const t = tracker(); if (!t) return null;
    const end = Date.now(); const mins = Math.max(1, Math.round((end - t.start) / 60000));
    const rec = { id: uid(), start: t.start, end: end, mins: mins, date: todayISO(), note: (note != null ? note : t.note) || "" };
    const all = own.sessions(); all.unshift(rec); store.set("sessions", all); store.set("tracker", null); emit(); return rec;
  }
  function deleteSession(id) { store.set("sessions", own.sessions().filter(s => s.id !== id)); emit(); }
  function minsOn(pred) { return own.sessions().filter(pred).reduce((a, s) => a + (Number(s.mins) || 0), 0); }
  function minsToday() { const t = todayISO(); return minsOn(s => s.date === t); }
  function minsThisWeek() { const now = new Date(); const day = (now.getDay() + 6) % 7; const mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(now.getDate() - day); const m0 = mon.getTime(); return minsOn(s => s.start >= m0); }
  function fmtMins(m) { const h = Math.floor(m / 60), r = m % 60; return h ? h + " h " + (r ? r + " min" : "") : r + " min"; }
  function hms(ms) { const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? String(h).padStart(2, "0") + ":" : "") + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0"); }

  /* Editing is allowed locally, or when signed in; signed out with cloud sync configured, the site is read-only. */
  function canEdit() { if (viewing) return false; const c = window.AA && window.AA.cloud; if (!c || !c.configured || !c.enabled) return true; return !!c.user; }
  function requireSignIn(what) {
    if (canEdit()) return true;
    const c = window.AA.cloud;
    toast(c.ready ? "Sign in (top right) to " + (what || "edit") + " from this device." : "Still checking your sign-in; try again in a moment.");
    if (c.ready && c.openPanel) c.openPanel();
    return false;
  }

  let toastT = null;
  function toast(msg) { let t = document.getElementById("toastg"); if (!t) { t = document.createElement("div"); t.id = "toastg"; t.className = "toastg"; document.body.appendChild(t); } t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }

  function mountTracker() {
    const root = document.createElement("div"); root.className = "trk";
    root.innerHTML = '<div class="trk-panel" id="trkPanel" hidden><div class="eyebrow">Session</div><input type="text" id="trkNote" placeholder="What are you working on? (optional)" maxlength="120">' +
      '<div class="row"><span>Today</span><b id="trkToday">0 min</b></div><div class="row"><span>This week</span><b id="trkWeek">0 min</b></div><div class="row"><span>All time</span><b id="trkAll">0 min</b></div>' +
      '<div class="muted" style="font-size:12px">Sessions count towards the hours on the Ascent page and save to your database when you are signed in.</div></div>' +
      '<div class="trk-pill" id="trkPill" role="group" aria-label="Time tracker"><button class="go" id="trkGo" type="button" aria-label="Start session">▶</button><span class="t" id="trkTime">00:00</span><span class="lbl" id="trkLbl">Start session</span></div>';
    document.body.appendChild(root);
    const pill = root.querySelector("#trkPill"), go = root.querySelector("#trkGo"), time = root.querySelector("#trkTime"), lbl = root.querySelector("#trkLbl"), panel = root.querySelector("#trkPanel"), note = root.querySelector("#trkNote");
    function paint() {
      const t = tracker();
      pill.classList.toggle("running", !!t);
      go.textContent = t ? "■" : "▶"; go.setAttribute("aria-label", t ? "Stop session" : "Start session");
      lbl.textContent = t ? "Stop" : "Start session";
      time.textContent = t ? hms(Date.now() - t.start) : "00:00";
      root.querySelector("#trkToday").textContent = fmtMins(minsToday() + (t ? Math.floor((Date.now() - t.start) / 60000) : 0));
      root.querySelector("#trkWeek").textContent = fmtMins(minsThisWeek() + (t ? Math.floor((Date.now() - t.start) / 60000) : 0));
      root.querySelector("#trkAll").textContent = fmtMins(minsOn(() => true));
    }
    go.addEventListener("click", e => {
      e.stopPropagation();
      const t = tracker();
      if (t) { const rec = stopSession(note.value.trim()); note.value = ""; toast("Session saved: " + fmtMins(rec.mins)); }
      else { if (!requireSignIn("put time on the clock")) return; if (!startSession(note.value.trim())) return; toast("Session started"); }
      paint();
    });
    pill.addEventListener("click", () => { panel.hidden = !panel.hidden; if (!panel.hidden) note.focus(); });
    note.addEventListener("input", () => { const t = tracker(); if (t) { t.note = note.value; store.set("tracker", t); } });
    const t0 = tracker(); if (t0 && t0.note) note.value = t0.note;
    paint(); setInterval(paint, 1000);
    window.addEventListener("storage", paint); window.addEventListener("aa:sessions", paint);
  }

  /* Progress data (modules + check-ins) shared with ascent.js */
  function modules() { const m = store.get(vk("modules"), {}); return m && typeof m === "object" ? m : {}; }
  function setModules(m) { store.set("modules", m); }
  function checkins() { const c = store.get(vk("checkins"), []); return Array.isArray(c) ? c : []; }
  function setCheckins(c) { store.set("checkins", c); }

  function exportJSON() {
    const ss = own.sessions();
    return JSON.stringify({ app: "agents-ascent", version: 1, exportedAt: new Date().toISOString(), week: currentWeek(), profile: own.profile(), plan: own.plan(), planlog: own.planlog(), modules: own.modules(), checkins: own.checkins(), sessions: ss, totals: { trackedMinutes: ss.reduce((a, s) => a + (Number(s.mins) || 0), 0), sessionCount: ss.length } }, null, 2);
  }
  function importJSON(text, mode) {
    let j; try { j = JSON.parse(text); } catch (e) { return { ok: false, error: "That isn't valid JSON." }; }
    if (!j || typeof j !== "object" || j.app !== "agents-ascent") return { ok: false, error: "This doesn't look like an Agent's Ascent export." };
    if (mode === "replace") { setModules(j.modules || {}); setCheckins(j.checkins || []); store.set("sessions", j.sessions || []); }
    else {
      const m = Object.assign({}, own.modules(), j.modules || {}); setModules(m);
      const byId = {}; own.checkins().concat(j.checkins || []).forEach(c => { byId[c.id || JSON.stringify(c)] = c; }); setCheckins(Object.values(byId).sort((a, b) => (b.created || 0) - (a.created || 0)));
      const sid = {}; own.sessions().concat(j.sessions || []).forEach(s => { sid[s.id || s.start] = s; }); store.set("sessions", Object.values(sid).sort((a, b) => (b.start || 0) - (a.start || 0)));
    }
    emit(); window.dispatchEvent(new CustomEvent("aa:progress")); return { ok: true };
  }
  async function copyText(text) { try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; } }

  return { store, own, DEFAULT_START, TOTAL_WEEKS, PLAN, todayISO, currentWeek, startISO, startDate, weekPlan, profile, setProfile, plan, setPlan, planHistory, applyPlan, setView, clearView, isViewing, fmtDate, uid, esc, applyTheme, toggleTheme, nav, sessions, tracker, startSession, stopSession, deleteSession, minsToday, minsThisWeek, fmtMins, hms, toast, canEdit, requireSignIn, mountTracker, modules, setModules, checkins, setCheckins, exportJSON, importJSON, copyText };
})();
AA.applyTheme();
