/* The Agent's Ascent — My course: the shared course from the database with one climber's plan layered on top
   (public.course_for). Course material, professor additions, drops, swapped exercises and side camps are all
   marked. Nothing here writes: plans are applied on the Ascent page, which checks them first. */
(function () {
  "use strict";
  AA.nav("course"); AA.mountTracker();
  const $ = id => document.getElementById(id);
  const esc = AA.esc;
  const cfg = window.AA_CONFIG || {};
  const arr = x => (Array.isArray(x) ? x : []);
  const httpUrl = u => (/^https?:\/\/[^\s"'<>]+$/i.test(String(u || "").trim()) ? String(u).trim() : "");
  const DEPTH = { expanded: "EXPANDED", lightened: "LIGHTENED", skip: "SKIP IF PROVEN" };
  let data = null, filter = "all", target = undefined, chosen = false, loading = 0;

  /* ───────── A small Markdown renderer for the course text: headings, lists, tables, bold, italics, code, links ───────── */
  function inline(t) {
    let s = esc(t); const codes = [];
    s = s.replace(/`([^`]+)`/g, (m, c) => { codes.push(c); return "\u0000" + (codes.length - 1) + "\u0000"; });
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, "$1<i>$2</i>");
    s = s.replace(/https?:\/\/[^\s<)"'·]+/g, u => { const clean = u.replace(/[.,;:]+$/, ""); const label = clean.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""); return '<a href="' + clean + '" target="_blank" rel="noopener">' + (label.length > 60 ? label.slice(0, 57) + "…" : label) + "</a>" + u.slice(clean.length); });
    return s.replace(/\u0000(\d+)\u0000/g, (m, i) => "<code>" + codes[+i] + "</code>");
  }
  function table(rows) { const cells = r => r.trim().replace(/^\||\|$/g, "").split("|").map(c => c.trim());
    return '<div class="tbl"><table><thead><tr>' + cells(rows[0]).map(h => "<th>" + inline(h) + "</th>").join("") + "</tr></thead><tbody>" + rows.slice(2).map(r => "<tr>" + cells(r).map(c => "<td>" + inline(c) + "</td>").join("") + "</tr>").join("") + "</tbody></table></div>"; }
  function md(src) {
    const L = String(src || "").split("\n"); let out = "", i = 0;
    const isList = l => /^\s*(- |\d+\. )/.test(l);
    while (i < L.length) { const l = L[i];
      if (!l.trim()) { i++; continue; }
      if (/^#{2,4} /.test(l)) { out += "<h4>" + inline(l.replace(/^#+\s*/, "")) + "</h4>"; i++; continue; }
      if (l.trim().startsWith("|")) { const rows = []; while (i < L.length && L[i].trim().startsWith("|")) rows.push(L[i++]); out += table(rows); continue; }
      if (isList(l)) { const ord = /^\s*\d+\. /.test(l); const items = [];
        while (i < L.length && isList(L[i])) { items.push(L[i].replace(/^\s*(- |\d+\. )/, "")); i++; while (i < L.length && /^\s{2,}\S/.test(L[i]) && !isList(L[i])) { items[items.length - 1] += " " + L[i].trim(); i++; } }
        out += (ord ? "<ol>" : "<ul>") + items.map(t => "<li>" + inline(t) + "</li>").join("") + (ord ? "</ol>" : "</ul>"); continue; }
      const para = []; while (i < L.length && L[i].trim() && !/^#{2,4} /.test(L[i]) && !L[i].trim().startsWith("|") && !isList(L[i])) para.push(L[i++]);
      out += "<p>" + inline(para.join(" ")) + "</p>"; }
    return out;
  }

  /* ───────── Whose course ───────── */
  function ownId() { const c = AA.cloud || {}; return c.user ? c.user.id : null; }
  function defaultTarget() { const c = AA.cloud || {}; return ownId() || c.viewId || AA.store.get("viewId", null) || cfg.ownerId || null; }
  function paintSelector() {
    const sel = $("mcSel"); const c = AA.cloud || {}; const me = ownId(); const list = (c.climbers || []).filter(u => u.id !== me);
    const opts = (me ? [["me", "Me"]] : []).concat(list.map(u => [u.id, u.name || "Unnamed climber"])).concat([["shared", "The course as written (no plan)"]]);
    if (target && target !== me && !list.some(u => u.id === target)) opts.splice(me ? 1 : 0, 0, [target, "This climber"]);
    sel.innerHTML = opts.map(o => '<option value="' + esc(o[0]) + '">' + esc(o[1]) + "</option>").join("");
    sel.value = target === null ? "shared" : (target === me ? "me" : target);
  }
  $("mcSel").addEventListener("change", e => { const v = e.target.value; chosen = true; target = v === "shared" ? null : v === "me" ? ownId() : v; if (!ownId() && target) AA.store.set("viewId", target); load(); });

  async function load() {
    const c = AA.cloud || {};
    if (!c.configured) { $("mcBody").innerHTML = '<div class="empty">This copy of the site isn\'t connected to the course database. The course is in <a href="course.html">the full course document</a>.</div>'; $("mcWho").textContent = "Not connected"; return; }
    if (!c.ready || !c.courseFor) { setTimeout(load, 150); return; }
    if (target === undefined) target = defaultTarget();
    paintSelector();
    const n = ++loading;
    $("mcWho").textContent = "Loading…";
    const { data: d, error } = await c.courseFor(target);
    if (n !== loading) return;
    if (error || !d || !arr(d.camps).length) { $("mcBody").innerHTML = '<div class="empty">The course couldn\'t be loaded' + (error ? " (" + esc(error.message) + ")" : "") + '. The written course is in <a href="course.html">the full course document</a>.</div>'; $("mcWho").textContent = "Couldn't load"; return; }
    data = d; render(); paintProposal();
    if (location.hash && !render.scrolled) { render.scrolled = true; const el = document.getElementById(location.hash.slice(1)); if (el) setTimeout(() => el.scrollIntoView({ block: "start" }), 50); }
  }

  /* A plan the professor sent through the connector and the climber hasn't decided on yet. */
  async function paintProposal() { const el = $("mcProposal"); const c = AA.cloud || {}; const me = ownId();
    if (!me || target !== me || !c.pendingProposal) { el.hidden = true; return; }
    const p = await c.pendingProposal(); if (!p) { el.hidden = true; return; }
    el.hidden = false; el.innerHTML = "<b>Your professor sent you a new plan</b>" + (p.plan && p.plan.checkpoint ? " (" + esc(p.plan.checkpoint) + ")" : "") + ". Review and apply it on the Ascent →"; }

  /* ───────── Helpers for a camp ───────── */
  function changed(c) { return c.depth !== "core" || !!c.note || !!c.ready_add || arr(c.side).length > 0 || arr(c.items).some(i => i.source === "professor" || i.dropped) || arr(c.exercises).some(e => e.source === "professor" || e.replaced); }
  function fmtMin(m) { m = Number(m) || 0; if (!m) return ""; if (m < 60) return m + " m"; const h = Math.round(m / 30) / 2; return "~" + (h === Math.floor(h) ? h : Math.floor(h) + "½") + " h"; }
  function statusOf(key) {
    const me = ownId(); let mods = null;
    if (target && me && target === me) mods = AA.own.modules(); else if (target && AA.isViewing() && (AA.cloud || {}).viewId === target) mods = AA.modules();
    if (!mods) return "";
    const st = mods[key] || {};
    if (st.status === "done") return '<span class="chip ok">' + (st.quizAttempt ? "PASSED " + esc(st.quiz) + "%" : "DONE") + "</span>";
    if (st.status === "skip") return '<span class="chip">SKIPPED</span>';
    if (st.quizAttempt) return '<span class="chip score' + (st.quiz >= 70 ? "" : " fail") + '">TEST ' + esc(st.quiz) + "%</span>";
    if (st.status === "doing") return '<span class="chip doing">IN PROGRESS</span>';
    return "";
  }
  const ICON = { video: "▶", reading: "≡", course: "◆" };
  function statusMark(s) { s = String(s || ""); if (!s) return ""; const good = s.indexOf("✔") === 0;
    return '<span class="mc-chk' + (good ? "" : " part") + '" title="' + (good ? "Opened and checked when the course was researched" : "An official or well-known page that wasn't opened individually; check it loads") + '">' + esc(s === "✔" ? "✔ checked" : s === "◐" ? "◐ check it loads" : s) + "</span>"; }
  function itemHTML(it, campKey) {
    const pro = it.source === "professor", drop = !!it.dropped; const u = httpUrl(it.url);
    const title = u && !drop ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(it.title || u) + "</a>" : esc(it.title || u || "");
    const meta = [it.creator, it.len, it.date, it.cost].filter(Boolean).map(esc).join(" · ");
    let repl = ""; if (it.replaces) { const orig = findItem(campKey, it.replaces); repl = '<div class="mc-x">Instead of: ' + esc(orig ? orig.title : it.replaces) + "</div>"; }
    return '<li class="mc-item' + (pro ? " pro" : "") + (drop ? " drop" : "") + '"><span class="mc-ico" aria-hidden="true">' + (ICON[it.kind] || "◆") + "</span><div>" +
      '<div class="mc-t">' + title + (pro ? ' <span class="pc-tag pro">Added by your professor</span>' : "") + (drop ? ' <span class="pc-tag drop">Dropped for you</span>' : "") + "</div>" +
      (meta || it.status ? '<div class="mc-m">' + meta + (it.status && !drop ? (meta ? " · " : "") + statusMark(it.status) : "") + "</div>" : "") +
      (it.link && !drop ? '<div class="mc-m">Links: ' + inline(it.link) + "</div>" : "") +
      (it.why && !drop ? '<div class="mc-w">' + inline(it.why) + "</div>" : "") + repl +
      (drop && it.drop_why ? '<div class="mc-x">Why: ' + esc(it.drop_why) + "</div>" : "") +
      '<div class="mc-id">' + esc(it.id) + "</div></div></li>";
  }
  function findItem(key, id) { const c = arr(data && data.camps).find(x => x.key === key); return c ? arr(c.items).find(i => i.id === id) : null; }
  function exHTML(e) {
    const pro = e.source === "professor";
    return '<li class="mc-ex' + (pro ? " pro" : "") + (e.replaced ? " drop" : "") + '">' + (e.label ? "<b>" + esc(e.label) + ".</b> " : "") + inline(e.text) +
      (pro ? ' <span class="pc-tag pro">From your professor</span>' : "") + (e.replaced ? ' <span class="pc-tag drop">Replaced for you</span>' : "") + '<span class="mc-id">' + esc(e.id) + "</span></li>";
  }
  function sideHTML(s, after) {
    const items = arr(s.items).map((x, i) => itemHTML({ source: "professor", id: s.id + "." + (i + 1), title: x.title, url: x.url, len: x.len, why: x.why, kind: /youtube\.com|youtu\.be/.test(x.url || "") ? "video" : "course" }, after)).join("");
    return '<article class="mc-side" id="side-' + esc(s.id) + '"><div class="mc-side-h"><span class="pc-tag side">Side camp · added by your professor · no test</span><h3>' + esc(s.title) + "</h3>" +
      '<div class="mc-meta">' + (s.hours ? "⏱ ~" + esc(s.hours) + " h · " : "") + "after " + esc(after) + " · mark it done on the <a href=\"ascent.html\">Ascent</a></div></div>" +
      (s.note ? '<p class="mc-note">' + esc(s.note) + "</p>" : "") + (items ? '<ul class="mc-items">' + items + "</ul>" : "") +
      (s.exercise ? '<div class="mc-sub">Exercise</div><p>' + inline(s.exercise) + "</p>" : "") + "</article>";
  }
  function campHTML(c) {
    const depth = DEPTH[c.depth] ? '<span class="chip depth' + (c.depth === "lightened" ? " light" : c.depth === "skip" ? " skip" : "") + '">' + DEPTH[c.depth] + "</span>" : "";
    const hours = c.hours == null ? "inside m18's budget" : "~" + c.hours + " h";
    const items = arr(c.items), live = items.filter(i => !i.dropped), dropped = items.filter(i => i.dropped);
    const ex = arr(c.exercises);
    return '<article class="mc-camp' + (changed(c) ? " changed" : "") + '" id="' + esc(c.key) + '">' +
      '<div class="mc-camp-h"><span class="mc-key">' + (c.capstone ? "★" : esc(c.key.slice(1))) + "</span><div class=\"mc-camp-t\"><h3>" + esc(c.title) + "</h3>" +
      '<div class="mc-meta">' + esc(c.week_label || "") + " · ⏱ " + esc(hours) + (c.video_min ? " · ▶ " + fmtMin(c.video_min) + " video" : "") +
      (c.core ? ' · <span class="spine" title="Essential spine: can be lightened, never dropped">●</span> spine' : " · optional") + (c.capstone ? " · capstone" : "") + "</div>" +
      '<div class="mc-chips">' + depth + statusOf(c.key) + '<a class="chip link" href="ascent.html#' + esc(c.key) + '">Practice &amp; test on the Ascent</a></div></div></div>' +
      (c.updated_since_plan ? '<div class="mc-upd">The course updated this camp after your plan was made. Your professor will see this at your next check-in.</div>' : "") +
      (c.note ? '<div class="mc-note"><span class="pc-tag pro">From your professor</span>' + esc(c.note) + "</div>" : "") +
      (c.body ? '<div class="mc-prose">' + md(c.body) + "</div>" : "") +
      (items.length ? '<div class="mc-sub">Resources</div><ul class="mc-items">' + live.map(i => itemHTML(i, c.key)).join("") + "</ul>" +
        (dropped.length ? '<details class="mc-dropped"><summary>' + dropped.length + " dropped for you</summary><ul class=\"mc-items\">" + dropped.map(i => itemHTML(i, c.key)).join("") + "</ul></details>" : "") : "") +
      (ex.length ? '<div class="mc-sub">' + (c.capstone ? "The capstone" : "Exercises") + '</div><ul class="mc-exs">' + ex.map(exHTML).join("") + "</ul>" : "") +
      (c.ready || c.ready_add ? '<div class="mc-ready"><b>Ready to move on when…</b> ' + (c.ready ? inline(c.ready) : "") + (c.ready_add ? '<div class="mc-ready-add"><span class="pc-tag pro">Your professor adds</span>' + esc(c.ready_add) + "</div>" : "") + "</div>" : "") +
      (c.pitfalls ? '<div class="mc-pit"><b>Pitfalls:</b> ' + inline(c.pitfalls) + "</div>" : "") +
      "</article>" + arr(c.side).map(s => sideHTML(s, c.key)).join("");
  }

  /* ───────── Render ───────── */
  function render() {
    const d = data; if (!d) return;
    const who = d.student ? (d.student.name || "This climber") : null; const me = ownId();
    const mine = !!(target && me && target === me);
    $("mcTitle").textContent = mine || !who ? (who && mine ? "My course" : "The course") : who + "'s course";
    $("mcEyebrow").textContent = d.plan ? "The shared course + " + (mine ? "your" : "their") + " plan" : "The shared course, as written";
    $("mcWho").innerHTML = target === null ? "Showing the course as written, with no plan applied." : mine ? "Your course, with the plan you applied." : "Viewing " + esc(who || "a climber") + "'s course (read-only).";
    $("mcCourseV").textContent = "Course v" + (d.course && d.course.version || "?");
    const camps = arr(d.camps); const nChanged = camps.filter(changed).length; const nSide = camps.reduce((a, c) => a + arr(c.side).length, 0); const stale = camps.filter(c => c.updated_since_plan).length;
    const p = d.plan;
    $("mcPlan").innerHTML = !p ? (target === null ? "The course exactly as written. Pick a climber above to see their plan on top." : "No plan applied yet, so this is the course exactly as written. At each checkpoint your professor may propose one; you apply it on the <a href=\"ascent.html\">Ascent page</a> under Professor.")
      : '<div class="mc-plan-t">Plan v' + esc(p.version || "?") + (p.checkpoint ? " · " + esc(p.checkpoint) : "") + (p.appliedAt ? " · applied " + esc(AA.fmtDate(String(p.appliedAt).slice(0, 10))) : "") + "</div>" +
        (p.summary ? '<div style="color:var(--fg)">' + esc(p.summary) + "</div>" : "") +
        '<div>' + nChanged + " camp" + (nChanged === 1 ? "" : "s") + " changed" + (nSide ? " · " + nSide + " side camp" + (nSide === 1 ? "" : "s") : "") + (p.courseVersion ? " · made on course v" + esc(p.courseVersion) : "") + "</div>" +
        (stale ? '<div class="mc-upd" style="margin-top:6px">' + stale + " camp" + (stale === 1 ? " has" : "s have") + " been updated in the course since this plan was made.</div>" : "");
    // Plan history (yours, or the climber being viewed on this device).
    const hist = mine ? AA.own.planlog() : (AA.isViewing() && (AA.cloud || {}).viewId === target ? AA.planHistory() : []);
    $("mcHist").hidden = !hist.length;
    $("mcHistList").innerHTML = hist.slice().reverse().map((e, i) => { const q = e.plan || {}; const reuse = Object.assign({}, q); delete reuse.appliedAt; delete reuse.courseVersion; delete reuse.reappliedFrom;
      return "<li><div><b>" + esc(AA.fmtDate(new Date(e.at).toISOString().slice(0, 10))) + "</b> · v" + esc(q.version || "?") + (q.checkpoint ? " · " + esc(q.checkpoint) : "") + (i === 0 ? ' <span class="pill ok">in force</span>' : "") + "</div>" +
        (q.summary ? '<div class="muted">' + esc(q.summary) + "</div>" : "") + (mine && i > 0 ? '<a href="ascent.html#plan=' + encodeURIComponent(JSON.stringify(reuse)) + '">Use this plan again</a> <span class="muted">(you\'ll see the changes and confirm on the Ascent)</span>' : "") + "</li>"; }).join("");
    // The professor's text version.
    if (target) { const url = (cfg.supabaseUrl || "") + "/rest/v1/rpc/course_md?uid=" + target + "&apikey=" + (cfg.supabaseAnonKey || ""); $("mcProf").hidden = false; $("mcProfLink").href = url; $("mcProfCopy").onclick = async () => { const okc = await AA.copyText(url); AA.toast(okc ? "Link copied" : "Copy was blocked"); }; }
    else $("mcProf").hidden = true;
    // Phases and camps, in camp order; a phase's checkpoint follows its last camp in a run.
    const phases = {}; arr(d.phases).forEach(ph => { phases[ph.id] = ph; });
    const started = new Set(), closed = new Set(); let html = "", cur = null, sec = "";
    const closePhase = id => { const ph = phases[id]; if (!ph || closed.has(id)) return ""; closed.add(id); return ph.outro && filter === "all" ? '<div class="mc-outro"><div class="mc-sub">' + esc(ph.title.replace(/^Phase \d+ – /, "")) + ": phase checkpoint</div>" + md(ph.outro) + "</div>" : ""; };
    camps.forEach(c => {
      if (cur && cur !== c.phase) { sec += closePhase(cur); html += sec + "</section>"; sec = ""; }
      if (cur !== c.phase) { const ph = phases[c.phase] || { title: c.phase }; const cont = started.has(c.phase); started.add(c.phase);
        sec = '<section class="mc-phase"><div class="mc-phase-h"><span class="eyebrow">' + esc(ph.land || "") + (ph.weeks ? " · " + esc(ph.weeks) : "") + "</span><h2>" + esc(ph.title) + (cont ? " <small>(continued)</small>" : "") + "</h2></div>" +
          (!cont && ph.intro && filter === "all" ? '<div class="mc-prose mc-intro">' + md(ph.intro) + "</div>" : ""); }
      cur = c.phase;
      if (filter === "changed" && !changed(c)) return;
      sec += campHTML(c);
    });
    if (cur) { sec += closePhase(cur); html += sec + "</section>"; }
    $("mcBody").innerHTML = html;
    // Hide phase sections that have no camps showing (only-changed filter).
    document.querySelectorAll(".mc-phase").forEach(s => { if (!s.querySelector(".mc-camp")) s.hidden = true; });
    if (filter === "changed" && !nChanged) $("mcBody").innerHTML = '<div class="empty">Nothing has been changed for ' + (mine ? "you" : "this climber") + " yet: every camp is the course as written.</div>";
    $("mcJump").innerHTML = '<option value="">Camp…</option>' + camps.filter(c => filter === "all" || changed(c)).map(c => '<option value="' + esc(c.key) + '">' + esc(c.key.slice(1)) + " · " + esc(c.title) + "</option>").join("");
  }
  $("mcJump").addEventListener("change", e => { const el = document.getElementById(e.target.value); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); e.target.value = ""; });
  document.querySelectorAll(".mc-seg button").forEach(b => b.addEventListener("click", () => { filter = b.dataset.f; document.querySelectorAll(".mc-seg button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); }); render(); }));

  /* Reload when sign-in settles, the climber list arrives, or this climber's plan has just been saved. */
  window.addEventListener("aa:auth", () => { if (!chosen) target = undefined; load(); });
  window.addEventListener("aa:expedition", () => { if (target !== undefined) paintSelector(); });
  window.addEventListener("aa:synced", e => { const d = e.detail || {}; if (d.ok && d.kind === "plan" && target && target === ownId()) load(); });
  window.addEventListener("aa:progress", render);
  load();
})();
