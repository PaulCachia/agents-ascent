/* The Agent's Ascent — shared site script: storage, theme, nav, the start/stop time tracker, export/import. */
window.AA = (function () {
  "use strict";
  const KEY = "aa.v1.";
  const store = {
    get(k, d) { try { const v = localStorage.getItem(KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { return false; } try { window.dispatchEvent(new CustomEvent("aa:store", { detail: { key: k } })); } catch (e) {} return true; }
  };
  const START = new Date(2026, 9, 8); // 8 Oct 2026, week 1
  const TOTAL_WEEKS = 26;
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
  function currentWeek() { const d = Math.floor((Date.now() - START.getTime()) / 864e5); return Math.max(1, Math.floor(d / 7) + 1); }
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
      '<nav><a href="index.html" data-p="home">Home</a><a href="course.html" data-p="course">Course</a><a href="ascent.html" data-p="ascent">Ascent</a></nav>' +
      '<button class="theme" type="button" id="themeBtn" aria-label="Toggle light and dark theme" title="Theme">◐</button></div>';
    document.body.prepend(el);
    const a = el.querySelector('nav a[data-p="' + active + '"]'); if (a) a.classList.add("on");
    el.querySelector("#themeBtn").addEventListener("click", toggleTheme);
  }

  /* Sessions / tracker */
  function sessions() { const s = store.get("sessions", []); return Array.isArray(s) ? s : []; }
  function tracker() { const t = store.get("tracker", null); return t && t.running && t.start ? t : null; }
  function emit() { window.dispatchEvent(new CustomEvent("aa:sessions")); }
  function startSession(note) { if (tracker()) return false; store.set("tracker", { running: true, start: Date.now(), note: note || "" }); emit(); return true; }
  function stopSession(note) {
    const t = tracker(); if (!t) return null;
    const end = Date.now(); const mins = Math.max(1, Math.round((end - t.start) / 60000));
    const rec = { id: uid(), start: t.start, end: end, mins: mins, date: todayISO(), note: (note != null ? note : t.note) || "" };
    const all = sessions(); all.unshift(rec); store.set("sessions", all); store.set("tracker", null); emit(); return rec;
  }
  function deleteSession(id) { store.set("sessions", sessions().filter(s => s.id !== id)); emit(); }
  function minsOn(pred) { return sessions().filter(pred).reduce((a, s) => a + (Number(s.mins) || 0), 0); }
  function minsToday() { const t = todayISO(); return minsOn(s => s.date === t); }
  function minsThisWeek() { const now = new Date(); const day = (now.getDay() + 6) % 7; const mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(now.getDate() - day); const m0 = mon.getTime(); return minsOn(s => s.start >= m0); }
  function fmtMins(m) { const h = Math.floor(m / 60), r = m % 60; return h ? h + " h " + (r ? r + " min" : "") : r + " min"; }
  function hms(ms) { const s = Math.floor(ms / 1000); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? String(h).padStart(2, "0") + ":" : "") + String(m).padStart(2, "0") + ":" + String(x).padStart(2, "0"); }

  let toastT = null;
  function toast(msg) { let t = document.getElementById("toastg"); if (!t) { t = document.createElement("div"); t.id = "toastg"; t.className = "toastg"; document.body.appendChild(t); } t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600); }

  function mountTracker() {
    const root = document.createElement("div"); root.className = "trk";
    root.innerHTML = '<div class="trk-panel" id="trkPanel" hidden><div class="eyebrow">Session</div><input type="text" id="trkNote" placeholder="What are you working on? (optional)" maxlength="120">' +
      '<div class="row"><span>Today</span><b id="trkToday">0 min</b></div><div class="row"><span>This week</span><b id="trkWeek">0 min</b></div><div class="row"><span>All time</span><b id="trkAll">0 min</b></div>' +
      '<div class="muted" style="font-size:12px">Sessions are saved in this browser and count towards the hours on the Ascent page.</div></div>' +
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
      else { if (!startSession(note.value.trim())) return; toast("Session started"); }
      paint();
    });
    pill.addEventListener("click", () => { panel.hidden = !panel.hidden; if (!panel.hidden) note.focus(); });
    note.addEventListener("input", () => { const t = tracker(); if (t) { t.note = note.value; store.set("tracker", t); } });
    const t0 = tracker(); if (t0 && t0.note) note.value = t0.note;
    paint(); setInterval(paint, 1000);
    window.addEventListener("storage", paint); window.addEventListener("aa:sessions", paint);
  }

  /* Progress data (modules + check-ins) shared with ascent.js */
  function modules() { const m = store.get("modules", {}); return m && typeof m === "object" ? m : {}; }
  function setModules(m) { store.set("modules", m); }
  function checkins() { const c = store.get("checkins", []); return Array.isArray(c) ? c : []; }
  function setCheckins(c) { store.set("checkins", c); }

  function exportJSON() {
    const ss = sessions();
    return JSON.stringify({ app: "agents-ascent", version: 1, exportedAt: new Date().toISOString(), week: currentWeek(), modules: modules(), checkins: checkins(), sessions: ss, totals: { trackedMinutes: ss.reduce((a, s) => a + (Number(s.mins) || 0), 0), sessionCount: ss.length } }, null, 2);
  }
  function importJSON(text, mode) {
    let j; try { j = JSON.parse(text); } catch (e) { return { ok: false, error: "That isn't valid JSON." }; }
    if (!j || typeof j !== "object" || j.app !== "agents-ascent") return { ok: false, error: "This doesn't look like an Agent's Ascent export." };
    if (mode === "replace") { setModules(j.modules || {}); setCheckins(j.checkins || []); store.set("sessions", j.sessions || []); }
    else {
      const m = Object.assign({}, modules(), j.modules || {}); setModules(m);
      const byId = {}; checkins().concat(j.checkins || []).forEach(c => { byId[c.id || JSON.stringify(c)] = c; }); setCheckins(Object.values(byId).sort((a, b) => (b.created || 0) - (a.created || 0)));
      const sid = {}; sessions().concat(j.sessions || []).forEach(s => { sid[s.id || s.start] = s; }); store.set("sessions", Object.values(sid).sort((a, b) => (b.start || 0) - (a.start || 0)));
    }
    emit(); window.dispatchEvent(new CustomEvent("aa:progress")); return { ok: true };
  }
  async function copyText(text) { try { await navigator.clipboard.writeText(text); return true; } catch (e) { return false; } }

  return { store, START, TOTAL_WEEKS, PLAN, todayISO, currentWeek, fmtDate, uid, esc, applyTheme, toggleTheme, nav, sessions, tracker, startSession, stopSession, deleteSession, minsToday, minsThisWeek, fmtMins, hms, toast, mountTracker, modules, setModules, checkins, setCheckins, exportJSON, importJSON, copyText };
})();
AA.applyTheme();
