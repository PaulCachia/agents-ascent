/* The Agent's Ascent — dashboard logic. State lives in this browser (AA.store); export it for Claude at check-ins. */
(function () {
  "use strict";
  const RM = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const PHASES = [
    { id: "p0", land: "Base Camp", title: "Phase 0 · Orientation", weeks: "Week 1" },
    { id: "p1", land: "Foothills", title: "Phase 1 · Computer foundations", weeks: "Weeks 1–3" },
    { id: "p2", land: "Code Forest", title: "Phase 2 · Programming foundations", weeks: "Weeks 4–7" },
    { id: "p3", land: "Model Ridge", title: "Phase 3 · How LLMs work", weeks: "Week 8" },
    { id: "p4", land: "Claude Pass", title: "Phase 4 · AI coding tools", weeks: "Weeks 9–11" },
    { id: "p5", land: "SaaS Cliffs", title: "Phase 5 · Building real apps", weeks: "Weeks 12–17" },
    { id: "p6", land: "Agent Forge", title: "Phase 6 · Building AI agents", weeks: "Weeks 17–22" },
    { id: "p7", land: "Orchestration", title: "Phase 7 · Automation & multi-agent", weeks: "Weeks 22–25" },
    { id: "p8", land: "Launch Pad", title: "Phase 8 · Shipping & launch", weeks: "Weeks 25–26" }
  ];
  const MODULES = [
    { key: "m00", core: true, phase: "p0", name: "Orientation: vibe coding vs agentic engineering", wk: "Week 1", week: 1, hours: 6, video: 180, vids: "Karpathy, Vibe Coding → Agentic Engineering 30 m · DLAI Claude Code (first 2 lessons) ~1 h · AI Fluency ~1–2 h", anchor: "phase-0-orientation" },
    { key: "m01", core: true, phase: "p1", name: "1.1 Terminal, file system, package managers", wk: "Week 1", week: 1, hours: 6, video: 190, vids: "60 Linux commands 10 m · Linux for Hackers series ~3 h (length unverified) · WSL/Homebrew docs", anchor: "phase-1-computer-foundations" },
    { key: "m02", core: true, phase: "p1", name: "1.2 VS Code, Git & GitHub basics, SSH", wk: "Week 2", week: 2, hours: 6, video: 83, vids: "Git & GitHub crash course 1 h 08 m · GitHub for Beginners: Git in VS Code 15 m · VS Code docs", anchor: "phase-1-computer-foundations" },
    { key: "m03", core: true, phase: "p1", name: "1.3 How the web works", wk: "Week 3", week: 3, hours: 4, video: 2, vids: "DNS in 100 seconds 2 m · MDN How the web works (reading, most of the 4 h)", anchor: "phase-1-computer-foundations" },
    { key: "m04", core: true, phase: "p1", name: "1.4A Git depth: conflicts, rebase, reflog", wk: "Week 3", week: 3, hours: 5, video: 100, vids: "Rebase in 6 min 7 m · Merge vs rebase 8 m · Git for Professionals 41 m · Advanced Git 35 m · 13 Git techniques 8 m · Learn Git Branching ~2 h (interactive) · Oh Shit, Git 15 m", anchor: "phase-1-computer-foundations" },
    { key: "m05", core: true, phase: "p2", name: "2.1 Python from zero", wk: "Weeks 4–5", week: 5, hours: 20, video: 1080, vids: "Mosh, Python Full Course 2 h · Harvard CS50P ~16 h", anchor: "phase-2-programming-foundations-fast" },
    { key: "m06", core: true, phase: "p2", name: "2.2 TypeScript & Node", wk: "Week 6", week: 6, hours: 18, video: 210, vids: "Beginner's TypeScript, 18 video exercises ~3–4 h · Node/npm docs", anchor: "phase-2-programming-foundations-fast" },
    { key: "m07", phase: "p2", name: "2.3 HTML/CSS & reading code", wk: "Week 7", week: 7, hours: 7, video: 90, vids: "Claude Code for Beginners, debugging & navigation sections ~1.5 h · MDN HTML & CSS ~4 h (reading)", anchor: "phase-2-programming-foundations-fast" },
    { key: "m08", core: true, phase: "p3", name: "3 How LLMs work, practically", wk: "Week 8", week: 8, hours: 15, video: 211, vids: "Karpathy, Deep Dive into LLMs 3 h 31 m · Building with the Claude API course (several h) · Effective context engineering 30 m (reading)", anchor: "phase-3-how-llms-work-practically" },
    { key: "m09", core: true, phase: "p4", name: "4.1 Claude Code deep dive", wk: "Weeks 9–10", week: 10, hours: 20, video: 630, vids: "Claude Code Full Course 1.5 h · Claude Code 101 1.5 h · Claude Code in Action 1 h · Agent Skills + Subagents 2 h · Claude Code for Beginners 4 h 27 m · optional deep dives: Essentials 12 h, Mosh 9 h", anchor: "phase-4-ai-assisted-coding-tools" },
    { key: "m10", phase: "p4", name: "4.2 Alternatives & headless/CI", wk: "Week 11", week: 11, hours: 10, video: 0, vids: "No set videos: hands-on comparison with Gemini CLI and Codex, then Claude Code headless/CI docs", anchor: "phase-4-ai-assisted-coding-tools" },
    { key: "m11", core: true, phase: "p4", name: "1.4B GitHub as the agents' operating system", wk: "Week 11", week: 11, hours: 3, video: 90, vids: "GitHub for Beginners: Issues & Projects 15 m · Actions 15 m · Security 15 m · Code review 15 m · GitHub Skills: Review PRs ~30 m · rulesets, gh and Claude Code Actions docs", anchor: "phase-1-computer-foundations" },
    { key: "m12", core: true, phase: "p5", name: "5 Next.js, Supabase, Stripe, deploy", wk: "Weeks 12–15", week: 15, hours: 36, video: 650, vids: "SaaS Full Course 2026 3 h 56 m · Next.js 13 & Supabase playlists ~4 h · Docker concepts 10 m · Essentials: dev containers & Actions ~2 h · Actions 15 m · Next.js Learn ~8–10 h (text tutorial)", anchor: "phase-5-building-real-apps" },
    { key: "m13", core: true, phase: "p5", name: "5 Security for vibe-coded apps", wk: "Week 16", week: 16, hours: 6, video: 0, vids: "Reading and an audit exercise: RLS, keys, prod access, injection, webhooks (OWASP Top 10)", anchor: "phase-5-building-real-apps" },
    { key: "m14", core: true, phase: "p5", name: "Capstone 1: paid micro-SaaS live", wk: "Week 16", week: 16, cap: true, hours: 18, video: 0, vids: "Build time, no videos", anchor: "phase-5-building-real-apps" },
    { key: "m15", core: true, phase: "p6", name: "6.1 APIs, tool use, the agent loop", wk: "Weeks 17–18", week: 18, hours: 12, video: 690, vids: "DLAI Agentic AI 9 h 55 m (31 videos) · Building toward Computer Use 1 h 35 m · Building effective agents 30 m (reading) · optional: Certified Developer prep ~8 h", anchor: "phase-6-building-ai-agents" },
    { key: "m16", core: true, phase: "p6", name: "6.2 Model Context Protocol", wk: "Week 19", week: 19, hours: 10, video: 98, vids: "DLAI MCP: Build Rich-Context AI Apps 1 h 38 m · Hugging Face MCP course (several h, mixed) · modelcontextprotocol.io", anchor: "phase-6-building-ai-agents" },
    { key: "m17", phase: "p6", name: "6.3 Frameworks compared", wk: "Week 20", week: 20, hours: 12, video: 0, vids: "No set videos: build the same agent in two frameworks and compare", anchor: "phase-6-building-ai-agents" },
    { key: "m18", core: true, phase: "p6", name: "6.4 Evals, observability, RAG, guardrails", wk: "Week 21", week: 21, hours: 26, video: 0, vids: "Evals modules of DLAI Agentic AI (already counted in 6.1) · Langfuse/LangSmith, pgvector and guardrail docs", anchor: "phase-6-building-ai-agents" },
    { key: "m19", core: true, phase: "p6", name: "Capstone 2: production agent", wk: "Week 22", week: 22, cap: true, hours: null, video: 0, vids: "Budget sits inside Module 6.4's 26 h", anchor: "phase-6-building-ai-agents" },
    { key: "m20", core: true, phase: "p7", name: "7 n8n, integrations, multi-agent, HITL", wk: "Weeks 23–24", week: 24, hours: 20, video: 315, vids: "n8n Tutorial for Beginners playlist, 10 videos ~3 h · Master n8n in 2 Hours 2 h · Selling to AI Agents 14 m · optional: Ultimate n8n Course 17 h", anchor: "phase-7-automation-and-multi-agent-business-systems" },
    { key: "m21", core: true, phase: "p7", name: "Capstone 3: multi-agent ops system", wk: "Week 25", week: 25, cap: true, hours: 10, video: 0, vids: "Build time, no videos", anchor: "phase-7-automation-and-multi-agent-business-systems" },
    { key: "m22", core: true, phase: "p8", name: "8 Shipping, product, compliance", wk: "Weeks 25–26", week: 25, hours: 20, video: 150, vids: "Greg Isenberg episodes you pick ~2–3 h · PostHog, ICO and EU AI Act reading", anchor: "phase-8-shipping-product-and-entrepreneurship" },
    { key: "m23", core: true, phase: "p8", name: "Capstone 4: real launch", wk: "Week 26", week: 26, cap: true, hours: 30, video: 0, vids: "Customer conversations, launch and iteration; no videos", anchor: "phase-8-shipping-product-and-entrepreneurship" }
  ];
  const STATUS = { todo: "Not started", doing: "In progress", done: "Checkpoint passed", skip: "Skipped (already knew it)" };
  const LEVELS = ["Novice", "Shell Scripter", "Git Wrangler", "Code Reader", "Prompt Engineer", "Agent Pilot", "Shipper", "Agent Builder", "Orchestrator", "Agentic Engineer"];
  const XP_PER_LEVEL = 320;
  const BADGES = [
    { id: "first", name: "First Steps", sub: "Orientation done", test: s => ok(s, "m00") },
    { id: "shell", name: "Shell Shocked", sub: "Terminal tamed", test: s => ok(s, "m01") },
    { id: "git", name: "Git Wrangler", sub: "Rebase without fear", test: s => ok(s, "m04") },
    { id: "poly", name: "Polyglot", sub: "Python + TypeScript", test: s => ok(s, "m05") && ok(s, "m06") },
    { id: "model", name: "Model Whisperer", sub: "Knows what a token costs", test: s => ok(s, "m08") },
    { id: "hook", name: "Hook, Line & Subagent", sub: "Claude Code deep dive", test: s => ok(s, "m09") },
    { id: "gate", name: "Gatekeeper", sub: "main is protected", test: s => ok(s, "m11") },
    { id: "ship", name: "Shipped", sub: "Capstone 1 live", test: s => ok(s, "m14") },
    { id: "agent", name: "Agent Builder", sub: "Capstone 2 passes evals", test: s => ok(s, "m19") },
    { id: "orch", name: "Orchestrator", sub: "7 days unattended", test: s => ok(s, "m21") },
    { id: "founder", name: "Founder", sub: "Capstone 4 launched", test: s => ok(s, "m23") },
    { id: "scholar", name: "Scholar", sub: "Quiz average ≥ 85 (3+ quizzes)", test: s => { const q = quizStats(s); return q.n >= 3 && q.avg >= 85; } },
    { id: "pace", name: "Pacesetter", sub: "Ahead of the plan", test: s => pace(s).state === "ahead" },
    { id: "hours", name: "Forty Hours", sub: "40 h tracked on the clock", test: () => AA.sessions().reduce((a, x) => a + (Number(x.mins) || 0), 0) >= 2400 }
  ];

  const state = { modules: AA.modules(), checkins: AA.checkins() };
  let lastPos = null, firstRender = true;
  const $ = id => document.getElementById(id);
  const esc = AA.esc;
  function ok(s, k) { const m = s.modules[k]; return !!m && (m.status === "done" || m.status === "skip"); }
  function modOf(k) { return state.modules[k] || { status: "todo", quiz: null, date: null, notes: "" }; }
  function xpOf() { let x = 0; MODULES.forEach(m => { if (modOf(m.key).status === "done") x += m.cap ? 300 : 100; }); return x; }
  function quizStats(s) { let n = 0, t = 0; MODULES.forEach(m => { const q = modOf(m.key).quiz; if (typeof q === "number" && !isNaN(q)) { n++; t += q; } }); return { n, avg: n ? Math.round(t / n) : 0 }; }
  function pace(s) { const w = Math.min(AA.currentWeek(), AA.TOTAL_WEEKS); const planned = MODULES.filter(m => m.week < w).length; const done = MODULES.filter(m => ok(s, m.key)).length; const diff = done - planned; return { planned, done, state: diff > 0 ? "ahead" : diff < 0 ? "behind" : "on", diff }; }
  function position() { for (let i = 0; i < MODULES.length; i++) { if (!ok(state, MODULES[i].key)) return i; } return MODULES.length - 1; }

  /* Scene */
  const trail = $("trail"), trailDone = $("trailDone"), campsG = $("camps"), climberG = $("climber"), padG = $("pad");
  const L = trail.getTotalLength();
  trailDone.setAttribute("stroke-dasharray", String(L)); trailDone.setAttribute("stroke-dashoffset", String(L));
  const N = MODULES.length;
  const campPts = MODULES.map((m, i) => { const t = (i / (N - 1)) * (L - 30) + 15; const p = trail.getPointAtLength(t); return { x: p.x, y: p.y, len: t }; });
  (function () { let s = ""; for (let i = 0; i < 60; i++) { const x = Math.random() * 1000, y = Math.random() * 300, r = Math.random() * 1.4 + .3; s += '<circle class="star" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(2) + '"/>'; } $("stars").innerHTML = s; })();
  (function () { const e = trail.getPointAtLength(L); const x = e.x, y = e.y; padG.innerHTML =
    '<rect class="pad" x="' + (x - 26) + '" y="' + (y + 6) + '" width="52" height="7" rx="3"/>' +
    '<g id="rocket"><g transform="translate(' + (x + 6) + ',' + (y + 6) + ')">' +
    '<polygon class="flame" points="-5,0 5,0 0,16"/>' +
    '<rect class="rocket-body" x="-6" y="-34" width="12" height="34" rx="4"/>' +
    '<polygon class="rocket-nose" points="-6,-34 6,-34 0,-48"/>' +
    '<polygon class="rocket-fin" points="-6,-10 -12,2 -6,2"/><polygon class="rocket-fin" points="6,-10 12,2 6,2"/>' +
    '<circle class="rocket-win" cx="0" cy="-22" r="3"/></g></g>'; })();
  campsG.innerHTML = MODULES.map((m, i) => { const p = campPts[i]; const r = m.cap ? 12 : 9; return '<g class="camp todo' + (m.cap ? " cap" : "") + '" data-i="' + i + '" tabindex="0" role="button" aria-label="' + esc(m.name) + '">' +
    '<circle class="pulse" cx="' + p.x + '" cy="' + p.y + '" r="11"/>' +
    (m.cap ? '<line class="pole" x1="' + p.x + '" y1="' + (p.y - r) + '" x2="' + p.x + '" y2="' + (p.y - r - 22) + '"/><polygon class="flag" points="' + p.x + ',' + (p.y - r - 22) + ' ' + (p.x + 16) + ',' + (p.y - r - 17) + ' ' + p.x + ',' + (p.y - r - 12) + '"/>' : "") +
    '<circle class="ring" cx="' + p.x + '" cy="' + p.y + '" r="' + r + '"/>' +
    '<text x="' + p.x + '" y="' + (p.y + 0.5) + '">' + (m.cap ? "★" : i + 1) + '</text></g>'; }).join("");
  campsG.querySelectorAll(".camp").forEach(c => { const go = () => { const i = +c.dataset.i; const row = document.querySelector('.mod[data-key="' + MODULES[i].key + '"]'); if (row) { row.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "center" }); document.querySelectorAll(".mod.hi").forEach(x => x.classList.remove("hi")); row.classList.add("hi"); setTimeout(() => row.classList.remove("hi"), 2000); } }; c.addEventListener("click", go); c.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } }); });
  climberG.innerHTML = '<g id="bot"><ellipse class="bot-shadow" cx="0" cy="2" rx="9" ry="3"/>' +
    '<rect class="leg l" x="-6" y="-8" width="4" height="9" rx="2"/><rect class="leg r" x="2" y="-8" width="4" height="9" rx="2"/>' +
    '<rect class="bot-pack" x="-13" y="-22" width="6" height="11" rx="3"/>' +
    '<rect class="bot-body" x="-8" y="-24" width="16" height="17" rx="6"/>' +
    '<g class="bot-head"><circle class="bot-body" cx="0" cy="-31" r="8"/><circle class="bot-eye" cx="-3" cy="-32" r="1.7"/><circle class="bot-eye" cx="3" cy="-32" r="1.7"/>' +
    '<line class="bot-ant" x1="0" y1="-39" x2="0" y2="-45"/><circle class="bot-tip" cx="0" cy="-46" r="2.2"/></g></g>';
  function placeClimber(len) { const p = trail.getPointAtLength(Math.max(0, Math.min(L, len))); climberG.setAttribute("transform", "translate(" + p.x.toFixed(1) + "," + p.y.toFixed(1) + ")"); }
  let walkAnim = null;
  function walkTo(fromI, toI) { const a = campPts[fromI].len, b = campPts[toI].len; if (RM || fromI === toI) { placeClimber(b); return; }
    if (walkAnim) cancelAnimationFrame(walkAnim); const dur = Math.min(2600, 600 + Math.abs(toI - fromI) * 700); const t0 = performance.now(); climberG.classList.add("walking");
    const step = now => { const k = Math.min(1, (now - t0) / dur); const e = k < .5 ? 2 * k * k : -1 + (4 - 2 * k) * k; placeClimber(a + (b - a) * e); if (k < 1) { walkAnim = requestAnimationFrame(step); } else { climberG.classList.remove("walking"); walkAnim = null; } };
    walkAnim = requestAnimationFrame(step); }
  const cv = $("confetti"), ctx = cv.getContext("2d"); let parts = [], confAnim = null;
  function confetti(n, x, y) { if (RM) return; const r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.height; const sx = r.width / 1000, sy = r.height / 560; const cs = getComputedStyle(document.documentElement); const cols = [cs.getPropertyValue("--accent"), cs.getPropertyValue("--done"), "#ffffff", "#f27d7d"];
    for (let i = 0; i < n; i++) parts.push({ x: x * sx, y: y * sy, vx: (Math.random() - .5) * 7, vy: -Math.random() * 7 - 3, g: .18, s: Math.random() * 5 + 3, c: cols[i % cols.length].trim(), a: Math.random() * 6.28, w: (Math.random() - .5) * .3, life: 90 + Math.random() * 40 });
    if (!confAnim) tick(); }
  function tick() { ctx.clearRect(0, 0, cv.width, cv.height); parts = parts.filter(p => p.life > 0); parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.a += p.w; p.life--; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a); ctx.globalAlpha = Math.min(1, p.life / 30); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * .6); ctx.restore(); });
    if (parts.length) { confAnim = requestAnimationFrame(tick); } else { confAnim = null; ctx.clearRect(0, 0, cv.width, cv.height); } }
  let toastT = null; function toast(msg) { const t = $("toast"); t.textContent = msg; t.classList.add("show"); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2800); }

  /* Durations: round video minutes to the nearest half hour above 1 h (the course's figures are approximate). */
  function fmtDur(min) { if (!min) return "0 m"; if (min < 60) return min + " m"; const h = Math.round(min / 30) / 2; const w = Math.floor(h); return "~" + (h === w ? w : w + "½") + " h"; }
  const PLANNED_HOURS = MODULES.reduce((a, m) => a + (m.hours || 0), 0), PLANNED_VIDEO = MODULES.reduce((a, m) => a + (m.video || 0), 0);

  /* Module list */
  (function () { const list = $("modList"); let html = ""; PHASES.forEach(ph => { const pm = MODULES.filter(m => m.phase === ph.id); const ph_h = pm.reduce((a, m) => a + (m.hours || 0), 0), ph_v = pm.reduce((a, m) => a + (m.video || 0), 0);
    html += '<div class="phase"><div class="phase-h"><h3>' + esc(ph.land) + ' <small>· ' + esc(ph.title) + '</small></h3><small>' + esc(ph.weeks) + ' · ~' + ph_h + ' h' + (ph_v ? ' · ▶ ' + fmtDur(ph_v) : '') + '</small></div>';
    MODULES.forEach((m, i) => { if (m.phase !== ph.id) return; html += '<div class="mod todo" data-key="' + m.key + '"><div class="n">' + (m.cap ? "★" : String(i + 1).padStart(2, "0")) + '</div><div class="name">' + (m.core ? '<span class="spine" title="Essential spine: can be lightened, never dropped">●</span>' : "") + esc(m.name) + (m.cap ? '<span class="cap-tag">CAPSTONE · 300 XP</span>' : "") + '<small>' + esc(m.wk) + ' · <a href="course.html#' + m.anchor + '">open in course</a></small>' +
      '<div class="dur"><span class="chip" title="Hours the course budgets for this module, videos and exercises included">⏱ ' + (m.hours == null ? "in 6.4" : "~" + m.hours + " h") + '</span>' + (m.video ? '<button class="chip vbtn" type="button" data-v="' + m.key + '" aria-expanded="false" title="Tap for the videos">▶ ' + fmtDur(m.video) + ' video</button>' : '<span class="chip dim">▶ no set videos</span>') + '<span class="chip depth" id="dp-' + m.key + '" hidden></span></div>' +
      '<div class="vids" id="v-' + m.key + '" hidden>' + esc(m.vids) + '</div><div class="plannote" id="pn-' + m.key + '" hidden></div></div>' +
      '<select id="st-' + m.key + '" aria-label="Status for ' + esc(m.name) + '">' + Object.keys(STATUS).map(k => '<option value="' + k + '">' + STATUS[k] + '</option>').join("") + '</select>' +
      '<div class="extra"><input class="q" id="q-' + m.key + '" type="number" min="0" max="100" placeholder="Quiz %" aria-label="Quiz score"><input class="d" id="d-' + m.key + '" type="date" aria-label="Checkpoint date"><input class="note" id="n-' + m.key + '" type="text" placeholder="Note (e.g. redo rebase exercise)" aria-label="Note"></div></div>'; }); html += '</div>'; }); list.innerHTML = html;
    list.querySelectorAll(".vbtn").forEach(b => b.addEventListener("click", () => { const v = $("v-" + b.dataset.v); v.hidden = !v.hidden; b.setAttribute("aria-expanded", String(!v.hidden)); }));
    MODULES.forEach(m => { $("st-" + m.key).addEventListener("change", e => { const v = e.target.value; const patch = { status: v }; if (v === "done" && !modOf(m.key).date) patch.date = AA.todayISO(); saveModule(m.key, patch, true); });
      $("q-" + m.key).addEventListener("change", e => { const v = e.target.value === "" ? null : Math.max(0, Math.min(100, Number(e.target.value))); saveModule(m.key, { quiz: v }); });
      $("d-" + m.key).addEventListener("change", e => saveModule(m.key, { date: e.target.value || null }));
      let t = null; $("n-" + m.key).addEventListener("input", e => { clearTimeout(t); const v = e.target.value; t = setTimeout(() => saveModule(m.key, { notes: v }), 500); }); });
    $("ciDate").value = AA.todayISO(); })();

  /* Render */
  function render() {
    const pos = position(); const xp = xpOf(); const lvl = Math.min(LEVELS.length, Math.floor(xp / XP_PER_LEVEL) + 1);
    $("lvl").textContent = lvl; $("lvlTitle").textContent = LEVELS[lvl - 1];
    const into = lvl >= LEVELS.length ? XP_PER_LEVEL : xp % XP_PER_LEVEL; $("xpFill").style.width = (lvl >= LEVELS.length ? 100 : (into / XP_PER_LEVEL) * 100) + "%"; $("xpText").textContent = xp + " XP" + (lvl >= LEVELS.length ? " · max level" : " · " + (XP_PER_LEVEL - into) + " to level " + (lvl + 1));
    const done = MODULES.filter(m => modOf(m.key).status === "done").length, skip = MODULES.filter(m => modOf(m.key).status === "skip").length;
    $("campsDone").innerHTML = done + '<span style="font-size:14px;color:var(--muted)"> / 24</span>'; $("campsSkip").textContent = skip ? skip + " skipped" : "";
    const tracked = AA.sessions().reduce((a, s) => a + (Number(s.mins) || 0), 0) / 60; const logged = state.checkins.reduce((a, c) => a + (Number(c.hours) || 0), 0); const hrs = tracked + logged;
    $("hours").innerHTML = (Math.round(hrs * 10) / 10) + '<span style="font-size:14px;color:var(--muted)"> / ~' + PLANNED_HOURS + '</span>'; $("hoursSub").textContent = (Math.round(tracked * 10) / 10) + " h on the clock · " + (Math.round(logged * 10) / 10) + " h from check-ins";
    const w = AA.currentWeek(); $("week").textContent = w > AA.TOTAL_WEEKS ? "Week " + AA.TOTAL_WEEKS + "+" : "Week " + w + " of " + AA.TOTAL_WEEKS;
    const pc = pace(state); const pill = $("pace"); pill.className = "pill " + (pc.state === "ahead" ? "ahead" : pc.state === "behind" ? "behind" : "ok"); pill.textContent = pc.state === "on" ? "on plan" : pc.state === "ahead" ? pc.diff + " camp" + (pc.diff > 1 ? "s" : "") + " ahead" : Math.abs(pc.diff) + " camp" + (Math.abs(pc.diff) > 1 ? "s" : "") + " behind";
    const q = quizStats(state); $("quizAvg").textContent = q.n ? q.avg + "%" : "–"; $("quizN").textContent = q.n ? q.n + " quiz" + (q.n > 1 ? "zes" : "") + " recorded" : "no quizzes yet";
    $("lands").innerHTML = PHASES.map(ph => { const ms = MODULES.filter(m => m.phase === ph.id); const d = ms.filter(m => ok(state, m.key)).length; return '<div class="land" title="' + esc(ph.title) + '"><b>' + esc(ph.land) + '</b><div class="bar"><i style="width:' + (ms.length ? d / ms.length * 100 : 0) + '%"></i></div></div>'; }).join("");
    MODULES.forEach((m, i) => { const st = modOf(m.key); const c = campsG.querySelector('.camp[data-i="' + i + '"]'); c.classList.remove("todo", "doing", "done", "skip"); c.classList.add(st.status || "todo");
      const row = document.querySelector('.mod[data-key="' + m.key + '"]'); row.classList.remove("todo", "doing", "done", "skip"); row.classList.add(st.status || "todo");
      const sel = $("st-" + m.key); if (document.activeElement !== sel) sel.value = st.status || "todo";
      const qi = $("q-" + m.key); if (document.activeElement !== qi) qi.value = (typeof st.quiz === "number") ? st.quiz : "";
      const di = $("d-" + m.key); if (document.activeElement !== di) di.value = st.date || "";
      const ni = $("n-" + m.key); if (document.activeElement !== ni) ni.value = st.notes || ""; });
    trailDone.setAttribute("stroke-dashoffset", String(Math.max(0, L - campPts[pos].len)));
    $("caption").textContent = (pos === MODULES.length - 1 && ok(state, "m23")) ? "Summit: launched" : PHASES.find(p => p.id === MODULES[pos].phase).land + " · camp " + (pos + 1) + ": " + MODULES[pos].name;
    if (lastPos === null || firstRender) { placeClimber(campPts[pos].len); } else if (pos !== lastPos) { walkTo(lastPos, pos); }
    lastPos = pos; firstRender = false;
    const earned = BADGES.filter(b => b.test(state)); $("badgeCount").textContent = earned.length + " of " + BADGES.length;
    $("badges").innerHTML = BADGES.map(b => '<div class="badge' + (b.test(state) ? " on" : "") + '"><div class="ic">' + esc(b.name.slice(0, 1)) + '</div><div><b>' + esc(b.name) + '</b><small>' + esc(b.sub) + '</small></div></div>').join("");
    const cl = $("ciList"); if (!state.checkins.length) { cl.innerHTML = '<div class="empty">No check-ins yet. Log the first one above; Claude reads these before each quiz.</div>'; }
    else { cl.innerHTML = state.checkins.map(c => '<div class="ci-item" data-id="' + esc(c.id) + '"><div><div class="d">' + esc(AA.fmtDate(c.date)) + (c.hours ? ' · ' + esc(c.hours) + ' h' : "") + (c.quiz ? ' · quiz ' + esc(c.quiz) : "") + '</div><div>' + esc(c.what) + '</div>' + (c.next ? '<div class="meta">Next: ' + esc(c.next) + '</div>' : "") + '</div><button class="ghost" data-del="' + esc(c.id) + '" aria-label="Delete check-in">×</button></div>').join("");
      cl.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => { state.checkins = state.checkins.filter(x => x.id !== b.dataset.del); AA.setCheckins(state.checkins); render(); })); }
    const ss = AA.sessions(); const sl = $("sessList"); if (!ss.length) { sl.innerHTML = '<div class="empty">No sessions yet. Press ▶ in the corner when you sit down to study; press ■ when you stop.</div>'; }
    else { sl.innerHTML = ss.slice(0, 40).map(s => { const d = new Date(s.start); const hh = String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0"); return '<div class="sess-item"><div><div class="d">' + esc(AA.fmtDate(s.date)) + ' · ' + hh + '</div><div>' + (s.note ? esc(s.note) : '<span class="muted">Study session</span>') + '</div></div><div class="m">' + esc(AA.fmtMins(s.mins)) + '</div><button class="ghost" data-sdel="' + esc(s.id) + '" aria-label="Delete session">×</button></div>'; }).join("") + (ss.length > 40 ? '<div class="muted" style="font-size:12px">' + (ss.length - 40) + ' older sessions not shown (still counted).</div>' : "");
      sl.querySelectorAll("[data-sdel]").forEach(b => b.addEventListener("click", () => AA.deleteSession(b.dataset.sdel))); }
    const r = $("rocket"); if (ok(state, "m23")) { if (!r.classList.contains("launch")) r.classList.add("launch"); } else r.classList.remove("launch");
    paintHeader(); paintPlan(); paintOthers(); paintMe();
  }

  /* Header line: whose climb, and when it started. */
  function paintHeader() {
    const p = AA.profile(); const nm = p.name ? p.name + "'s" : "A"; const st = AA.fmtDate(AA.startISO());
    $("hdrEyebrow").textContent = (AA.isViewing() ? "Viewing " + (p.name ? p.name + "'s" : "a climber's") + " climb" : nm + " 26-week expedition") + " · started " + st;
  }

  /* Other climbers on the same mountain (public profiles), drawn beside the trail with their names. */
  function paintOthers() {
    const g = $("others"); const c = AA.cloud || {}; const list = c.climbers || []; const me = c.user ? c.user.id : c.viewId;
    g.innerHTML = list.filter(u => u.id !== me).map((u, j) => { let i = 0; for (; i < MODULES.length; i++) { if (!u.done[MODULES[i].key]) break; } if (i >= MODULES.length) i = MODULES.length - 1;
      const p = campPts[i]; const dx = 14 + j * 12; return '<g class="other-climber"><circle cx="' + (p.x + dx) + '" cy="' + (p.y - 6) + '" r="5"/><text x="' + (p.x + dx) + '" y="' + (p.y - 15) + '">' + esc(u.name || "climber") + '</text></g>'; }).join("");
  }

  /* Profile card: fill from the profile; save as you type when signed in. */
  let meBusy = false;
  function paintMe() {
    const p = AA.profile(); meBusy = true;
    [["meName", p.name || ""], ["meStart", p.start || AA.DEFAULT_START], ["meGoal", p.goal || ""], ["meProf", p.professor || ""]].forEach(([id, v]) => { const el = $(id); if (document.activeElement !== el) el.value = v; });
    $("mePublic").checked = p.public !== false; meBusy = false;
    $("meState").textContent = AA.isViewing() ? "read-only" : (p.name ? "synced as " + p.name : "fill this in first");
    const go = $("profGo"); if (p.professor && /^https?:\/\//.test(p.professor)) { go.href = p.professor; go.removeAttribute("aria-disabled"); go.style.opacity = ""; } else { go.href = "#meCard"; go.removeAttribute("target"); go.setAttribute("aria-disabled", "true"); go.style.opacity = ".55"; go.title = "Add your professor's link in the Climber profile"; }
  }
  (function () { let t = null; const save = () => { if (meBusy || !AA.requireSignIn("edit your profile")) return; const p = Object.assign({}, AA.profile(), { name: $("meName").value.trim(), start: $("meStart").value || AA.DEFAULT_START, goal: $("meGoal").value.trim(), professor: $("meProf").value.trim(), public: $("mePublic").checked }); AA.setProfile(p); render(); };
    ["meName", "meGoal", "meProf"].forEach(id => $(id).addEventListener("input", () => { clearTimeout(t); t = setTimeout(save, 500); }));
    $("meStart").addEventListener("change", save); $("mePublic").addEventListener("change", save);
    $("meForm").addEventListener("submit", e => e.preventDefault()); })();

  /* The professor's plan: banner, depth chips, notes and extra resources on the rows. */
  const DEPTH = { core: "", expanded: "EXPANDED", lightened: "LIGHTENED", skip: "SKIP IF PROVEN" };
  function paintPlan() {
    const pl = AA.plan(); const bar = $("planBar");
    MODULES.forEach(m => { const d = pl && pl.modules && pl.modules[m.key] || null; const chip = $("dp-" + m.key), note = $("pn-" + m.key);
      const depth = d && d.depth && DEPTH[d.depth] ? d.depth : "core";
      chip.hidden = depth === "core"; chip.textContent = DEPTH[depth]; chip.className = "chip depth" + (depth === "lightened" ? " light" : depth === "skip" ? " skip" : "");
      const bits = []; if (d && d.note) bits.push(esc(d.note)); if (d && Array.isArray(d.extra) && d.extra.length) bits.push("Professor added: " + d.extra.map(x => (x.url ? '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.title || x.url) + '</a>' : esc(x.title || "")) + (x.len ? " " + esc(x.len) : "")).join(" · "));
      note.hidden = !bits.length; note.innerHTML = bits.join("<br>"); });
    if (!pl) { bar.hidden = true; return; }
    bar.hidden = false; $("planTitle").textContent = "Plan v" + (pl.version || 1) + (pl.checkpoint ? " · " + pl.checkpoint : "") + (pl.updatedAt ? " · " + AA.fmtDate(String(pl.updatedAt).slice(0, 10)) : "");
    $("planSummary").textContent = pl.summary || ""; $("planDetail").innerHTML = planChanges(pl).map(esc).join("<br>") || "No module changes; the default course applies.";
  }
  function planChanges(pl) { const out = []; MODULES.forEach(m => { const d = pl.modules && pl.modules[m.key]; if (!d) return; const bits = []; if (d.depth && d.depth !== "core") bits.push(DEPTH[d.depth].toLowerCase()); if (d.note) bits.push(d.note); if (Array.isArray(d.extra) && d.extra.length) bits.push(d.extra.length + " extra resource" + (d.extra.length > 1 ? "s" : "")); if (bits.length) out.push(m.name + ": " + bits.join("; ")); }); if (Array.isArray(pl.weeks) && pl.weeks.length) out.push("Week-by-week text replaced for " + pl.weeks.filter(Boolean).length + " weeks"); return out; }
  $("planMore").addEventListener("click", () => { const d = $("planDetail"); d.hidden = !d.hidden; $("planMore").setAttribute("aria-expanded", String(!d.hidden)); });

  /* Validate a plan object: shape, known modules, depths, and the spine rule (essential camps cannot be skipped). */
  function checkPlan(obj) {
    const errs = []; if (!obj || typeof obj !== "object") return { ok: false, errs: ["Not a plan object."] };
    const pl = { version: Number(obj.version) || 1, checkpoint: String(obj.checkpoint || ""), summary: String(obj.summary || ""), updatedAt: obj.updatedAt || AA.todayISO(), modules: {}, weeks: Array.isArray(obj.weeks) ? obj.weeks.slice(0, AA.TOTAL_WEEKS).map(w => (w == null ? "" : String(w))) : undefined };
    const mods = obj.modules && typeof obj.modules === "object" ? obj.modules : {};
    Object.keys(mods).forEach(k => { const m = MODULES.find(x => x.key === k); const d = mods[k] || {}; if (!m) { errs.push("Unknown module key " + k); return; }
      const depth = d.depth || "core"; if (!DEPTH.hasOwnProperty(depth)) { errs.push(k + ": depth must be core, expanded, lightened or skip"); return; }
      if (depth === "skip" && m.core) errs.push(m.name + " is on the essential spine and cannot be skipped (lighten it instead)");
      pl.modules[k] = { depth: depth, note: d.note ? String(d.note).slice(0, 400) : "", extra: Array.isArray(d.extra) ? d.extra.slice(0, 8).map(x => ({ title: String(x.title || "").slice(0, 120), url: /^https?:\/\//.test(x.url || "") ? String(x.url) : "", len: String(x.len || "").slice(0, 20) })) : [] }; });
    if (pl.weeks === undefined) delete pl.weeks;
    return { ok: !errs.length, errs, plan: pl };
  }
  let offered = null;
  function offerPlan(obj, source) {
    const r = checkPlan(obj); offered = r.ok ? r.plan : null; const card = $("planOffer"); card.hidden = false;
    $("offerMeta").textContent = (source || "") + (r.ok ? " · v" + r.plan.version + (r.plan.checkpoint ? " · " + r.plan.checkpoint : "") : "");
    $("offerText").textContent = r.ok ? (r.plan.summary || "A new plan for the rest of the climb.") : "This plan can't be applied as written.";
    $("offerChanges").innerHTML = r.ok ? planChanges(r.plan).map(esc).join("<br>") : ""; $("offerErr").hidden = r.ok; $("offerErr").innerHTML = r.errs.map(esc).join("<br>"); $("offerApply").disabled = !r.ok;
    card.scrollIntoView({ behavior: RM ? "auto" : "smooth", block: "start" });
  }
  $("offerApply").addEventListener("click", () => { if (!offered || !AA.requireSignIn("apply a plan")) return; AA.setPlan(offered); offered = null; $("planOffer").hidden = true; if (location.hash.indexOf("plan=") >= 0) history.replaceState(null, "", location.pathname); render(); toast("Plan v" + AA.plan().version + " applied"); });
  $("offerSkip").addEventListener("click", () => { offered = null; $("planOffer").hidden = true; if (location.hash.indexOf("plan=") >= 0) history.replaceState(null, "", location.pathname); });
  $("planApplyBtn").addEventListener("click", () => { const t = $("planText").value.trim(); if (!t) return; let obj; try { obj = JSON.parse(t); } catch (e) { offerPlan(null, "pasted"); $("offerErr").textContent = "That isn't valid JSON: " + e.message; $("offerErr").hidden = false; return; } offerPlan(obj, "pasted"); });
  function planFromHash() { const m = /[#&]plan=([^&]+)/.exec(location.hash || ""); if (!m) return; let obj = null; const raw = m[1];
    try { obj = JSON.parse(decodeURIComponent(raw)); } catch (e) { try { const b = raw.replace(/-/g, "+").replace(/_/g, "/"); obj = JSON.parse(decodeURIComponent(escape(atob(b + "===".slice((b.length + 3) % 4))))); } catch (e2) { obj = null; } }
    if (obj) setTimeout(() => offerPlan(obj, "from a link"), 300); else { offerPlan(null, "from a link"); $("offerErr").textContent = "The link's plan couldn't be read. Ask your professor for the JSON and paste it under Professor instead."; $("offerErr").hidden = false; } }
  planFromHash(); window.addEventListener("hashchange", planFromHash);

  /* Signed-out climber selector. */
  function paintClimbers() {
    const sel = $("viewSel"), wrap = $("viewWrap"); const c = AA.cloud || {}; const list = c.climbers || [];
    if (mode() !== "view" || !list.length) { wrap.hidden = true; return; }
    wrap.hidden = false; sel.innerHTML = list.map(u => '<option value="' + esc(u.id) + '">' + esc(u.name || "Unnamed climber") + '</option>').join("");
    if (list.some(u => u.id === c.viewId)) sel.value = c.viewId;
  }
  $("viewSel").addEventListener("change", () => AA.cloud.viewAs($("viewSel").value));
  window.addEventListener("aa:expedition", () => { paintClimbers(); paintOthers(); });

  /* "Saved" flash on a module row: local save at once, then the database result when the push lands. */
  const pendingSaves = new Set();
  function flashRow(key, text, warn) { const row = document.querySelector('.mod[data-key="' + key + '"]'); if (!row) return; let tag = row.querySelector(".saved");
    if (!tag) { tag = document.createElement("span"); tag.className = "saved"; const nm = row.querySelector(".name"); nm.insertBefore(tag, nm.querySelector("small")); }
    tag.textContent = text; tag.classList.toggle("warn", !!warn); tag.classList.add("show"); clearTimeout(tag._t); tag._t = setTimeout(() => tag.classList.remove("show"), warn ? 5000 : 2200); }
  window.addEventListener("aa:synced", e => { const d = e.detail || {}; if (d.kind === "module") { pendingSaves.forEach(k => flashRow(k, d.ok ? "SAVED TO YOUR DATABASE ✓" : "NOT SAVED · " + d.message, !d.ok)); if (d.ok) pendingSaves.clear(); }
    else if (d.kind === "checkin") toast(d.ok ? "Check-in saved to your database" : "Check-in not saved: " + d.message); });

  function saveModule(key, patch, celebrate) { if (!AA.requireSignIn("edit your camps")) { render(); return; } const cur = modOf(key); const next = Object.assign({}, cur, patch); if (JSON.stringify(cur) === JSON.stringify(next)) return;
    const was = cur.status, now = next.status; state.modules[key] = next; AA.setModules(state.modules); render();
    if (AA.cloud && AA.cloud.user) { pendingSaves.add(key); flashRow(key, "SAVING…"); } else flashRow(key, "SAVED ON THIS DEVICE ✓");
    if (celebrate && now === "done" && was !== "done") { const i = MODULES.findIndex(m => m.key === key); const m = MODULES[i]; const p = campPts[i];
      if (key === "m23") { toast("Summit reached. Launch!"); confetti(260, p.x, p.y); setTimeout(() => confetti(200, 500, 120), 900); }
      else if (m.cap) { toast("Capstone passed: " + m.name.split(":")[0] + " · +300 XP"); confetti(160, p.x, p.y); }
      else { toast("Checkpoint passed · +100 XP"); confetti(70, p.x, p.y); } } }

  $("ciForm").addEventListener("submit", e => { e.preventDefault(); if (!AA.requireSignIn("log a check-in")) return; const rec = { id: AA.uid(), date: $("ciDate").value || AA.todayISO(), what: $("ciWhat").value.trim(), hours: Number($("ciHours").value) || 0, quiz: $("ciQuiz").value.trim(), next: $("ciNext").value.trim(), created: Date.now() }; if (!rec.what) return;
    state.checkins.unshift(rec); state.checkins.sort((a, b) => (b.created || 0) - (a.created || 0)); AA.setCheckins(state.checkins);
    $("ciWhat").value = ""; $("ciHours").value = ""; $("ciQuiz").value = ""; $("ciNext").value = ""; $("ciDate").value = AA.todayISO(); toast("Check-in logged"); render(); });

  /* Export / import */
  $("btnCopy").addEventListener("click", async () => { const j = AA.exportJSON(); const okc = await AA.copyText(j); const ta = $("ioText"); ta.value = j; if (okc) AA.toast("Progress copied. Paste it to Claude in the Project chat."); else { ta.hidden = false; ta.select(); AA.toast("Copy blocked by the browser; the text is selected below."); } });
  $("btnShow").addEventListener("click", () => { const ta = $("ioText"); ta.hidden = !ta.hidden; if (!ta.hidden) { ta.value = AA.exportJSON(); ta.focus(); } });
  $("btnImport").addEventListener("click", () => { const ta = $("ioText"); ta.hidden = false; const txt = ta.value.trim(); if (!txt) { ta.placeholder = "Paste an export here, then press Import again."; ta.focus(); return; } const r = AA.importJSON(txt, "merge"); if (!r.ok) { AA.toast(r.error); return; } state.modules = AA.modules(); state.checkins = AA.checkins(); render(); AA.toast("Progress imported and merged."); });
  $("btnReset").addEventListener("click", () => { const btn = $("btnReset"); if (btn.dataset.armed !== "1") { btn.dataset.armed = "1"; btn.textContent = "Really reset? Click again"; setTimeout(() => { btn.dataset.armed = "0"; btn.textContent = "Reset all progress"; }, 4000); return; } AA.setModules({}); AA.setCheckins([]); AA.store.set("sessions", []); AA.store.set("tracker", null); AA.setPlan(null); state.modules = {}; state.checkins = []; btn.dataset.armed = "0"; btn.textContent = "Reset all progress"; render(); AA.toast("Progress reset."); });

  /* Mode: local (no cloud configured) · pending (checking sign-in) · view (signed out: read-only copy) · edit (signed in) · offline (library failed). */
  function mode() { const c = AA.cloud || {}; if (!c.configured) return "local"; if (!c.ready) return "pending"; if (!c.enabled) return "offline"; return c.user ? "edit" : "view"; }
  function applyMode() {
    const m = mode(); const bar = $("authBar"), txt = $("authText"), btn = $("authBtn");
    const ro = m === "view"; document.body.classList.toggle("ro", ro);
    document.querySelectorAll("#modList select, #modList input, #ciForm input, #ciBtn, #meForm input").forEach(el => { el.disabled = ro; });
    paintClimbers();
    if (bar) {
      bar.className = "authbar" + (m === "view" ? " view" : m === "offline" ? " warn" : ""); bar.hidden = m === "local" || m === "edit"; btn.hidden = m !== "view";
      if (m === "pending") txt.textContent = "Checking your sign-in…";
      else if (m === "view") { const nm = AA.profile().name; txt.innerHTML = "<b>Read-only.</b> Viewing " + (nm ? esc(nm) + "'s" : "a climber's") + " climb from the shared database. Sign in to edit your own."; }
      else if (m === "offline") txt.textContent = "The sync library didn't load, so changes stay on this device until it does. Reload to try again.";
    }
    paintProf();
  }
  $("authBtn").addEventListener("click", () => { if (AA.cloud && AA.cloud.openPanel) AA.cloud.openPanel(); });
  function paintProf() {
    const st = $("profState"), tx = $("profText"); if (!st || !tx) return;
    const c = AA.cloud || {}; const m = mode();
    if (m === "local") { st.textContent = "local only"; tx.textContent = "Cloud sync isn't configured on this copy of the site, so progress stays in this browser. Use the manual backup below to share it with Claude."; return; }
    if (m === "pending") { st.textContent = "checking…"; tx.textContent = "Checking your sign-in…"; return; }
    if (m === "offline") { st.textContent = "offline"; tx.textContent = "The sync library didn't load. Changes stay on this device until you reload with a connection."; return; }
    if (m === "edit") { st.textContent = "synced"; tx.textContent = "Signed in as " + (c.user.email || "you") + ". Every change here saves to your database as you make it. Your professor reads it before each check-in; put quiz scores in the Quiz % box on the module row. After a checkpoint, apply the plan your professor gives you (link or paste below)."; }
    else { st.textContent = "read-only"; tx.textContent = "You're looking at a climber's synced copy; their professor reads the same database. To edit your own climb, tap Sign in (top right) and open the magic link on this device. New here? The same sign-in starts your climb."; }
  }
  window.addEventListener("aa:auth", applyMode); applyMode();
  window.addEventListener("aa:sessions", render);
  window.addEventListener("aa:progress", () => { state.modules = AA.modules(); state.checkins = AA.checkins(); render(); });
  window.addEventListener("storage", () => { state.modules = AA.modules(); state.checkins = AA.checkins(); render(); });
  window.addEventListener("resize", () => { if (parts.length) { const r = cv.getBoundingClientRect(); cv.width = r.width; cv.height = r.height; } });
  render();
})();
