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
  let data = null, filter = "all", query = "", target = undefined, chosen = false, loading = 0;

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
    if (location.hash && !render.scrolled) { render.scrolled = true; setTimeout(() => reveal(decodeURIComponent(location.hash.slice(1))), 50); }
  }

  /* A plan the professor sent through the connector and the climber hasn't decided on yet. */
  async function paintProposal() { const el = $("mcProposal"); const c = AA.cloud || {}; const me = ownId();
    if (!me || target !== me || !c.pendingProposal) { el.hidden = true; return; }
    const p = await c.pendingProposal(); if (!p) { el.hidden = true; return; }
    el.hidden = false; el.innerHTML = "<b>Your professor sent you a new plan</b>" + (p.plan && p.plan.checkpoint ? " (" + esc(p.plan.checkpoint) + ")" : "") + ". Review and apply it on the Ascent →"; }


  /* ───────── Helpers for a camp ───────── */
  function changed(c) { return c.depth !== "core" || !!c.note || !!c.ready_add || arr(c.side).length > 0 || arr(c.items).some(i => i.source === "professor" || i.dropped) || arr(c.exercises).some(e => e.source === "professor" || e.replaced); }
  function fmtMin(m) { m = Number(m) || 0; if (!m) return ""; if (m < 60) return m + " m"; const h = Math.round(m / 30) / 2; return "~" + (h === Math.floor(h) ? h : Math.floor(h) + "½") + " h"; }
  /* Whose camp statuses we can see: your own, or the climber this device is viewing. null = none (e.g. the shared course). */
  function mods() { const me = ownId();
    if (target && me && target === me) return AA.own.modules();
    if (target && AA.isViewing() && (AA.cloud || {}).viewId === target) return AA.modules();
    return null; }
  function stateOf(key, m) { const st = (m || {})[key] || {}; return st.status === "done" || st.status === "skip" ? "done" : st.status === "doing" || st.quizAttempt ? "doing" : "todo"; }
  function statusChip(key, m) {
    if (!m) return "";
    const st = m[key] || {};
    if (st.status === "done") return '<span class="chip ok">' + (st.quizAttempt ? "Passed " + esc(st.quiz) + "%" : "Done") + "</span>";
    if (st.status === "skip") return '<span class="chip">Skipped</span>';
    if (st.quizAttempt) return '<span class="chip score' + (st.quiz >= 70 ? "" : " fail") + '">Test ' + esc(st.quiz) + "%</span>";
    if (st.status === "doing") return '<span class="chip doing">In progress</span>';
    return "";
  }
  const ICON = { video: "▶", reading: "≡", course: "◆" };
  function statusMark(s) { s = String(s || ""); if (!s) return ""; const good = s.indexOf("✔") === 0;
    return '<span class="mc-chk' + (good ? "" : " part") + '" title="' + (good ? "Opened and checked when the course was researched" : "An official or well-known page that wasn't opened individually; check it loads") + '">' + esc(s === "✔" ? "✔ checked" : s === "◐" ? "◐ check it loads" : s) + "</span>"; }
  function findItem(key, id) { const c = arr(data && data.camps).find(x => x.key === key); return c ? arr(c.items).find(i => i.id === id) : null; }
  function itemHTML(it, campKey, q) {
    const pro = it.source === "professor", drop = !!it.dropped; const u = httpUrl(it.url);
    const hit = q && matches([it.title, it.creator, it.why, it.link], q);
    const title = u && !drop ? '<a href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(it.title || u) + "</a>" : esc(it.title || u || "");
    const meta = [it.creator, it.len, it.date, it.cost].filter(Boolean).map(x => "<span>" + esc(x) + "</span>").join("");
    let repl = ""; if (it.replaces) { const orig = findItem(campKey, it.replaces); repl = '<div class="mc-x">Instead of: ' + esc(orig ? orig.title : it.replaces) + "</div>"; }
    return '<li class="mc-item' + (pro ? " pro" : "") + (drop ? " drop" : "") + (hit ? " hit" : "") + '"><span class="mc-ico" aria-hidden="true">' + (ICON[it.kind] || "◆") + "</span><div>" +
      '<div class="mc-t">' + title + (pro ? ' <span class="pc-tag pro">Added by your professor</span>' : "") + (drop ? ' <span class="pc-tag drop">Dropped for you</span>' : "") + "</div>" +
      (meta || it.status ? '<div class="mc-m">' + meta + (it.status && !drop ? statusMark(it.status) : "") + "</div>" : "") +
      (it.link && !drop ? '<div class="mc-m">Links: ' + inline(it.link) + "</div>" : "") +
      (it.why && !drop ? '<div class="mc-w">' + inline(it.why) + "</div>" : "") + repl +
      (drop && it.drop_why ? '<div class="mc-x">Why: ' + esc(it.drop_why) + "</div>" : "") +
      '<div class="mc-id">' + esc(it.id) + "</div></div></li>";
  }
  function exHTML(e) {
    const pro = e.source === "professor";
    return '<li class="mc-ex' + (pro ? " pro" : "") + (e.replaced ? " drop" : "") + '">' + (e.label ? "<b>" + esc(e.label) + ".</b> " : "") + inline(e.text) +
      (pro ? ' <span class="pc-tag pro">From your professor</span>' : "") + (e.replaced ? ' <span class="pc-tag drop">Replaced for you</span>' : "") + '<span class="mc-id">' + esc(e.id) + "</span></li>";
  }

  /* ───────── Search: a camp matches when its title, text, resources or exercises contain every word typed ───────── */
  function norm(s) { return String(s || "").toLowerCase(); }
  function matches(fields, q) { const hay = norm(fields.filter(Boolean).join(" ")); return q.split(/\s+/).filter(Boolean).every(w => hay.indexOf(w) >= 0); }
  function campText(c) { return [c.title, c.body, c.ready, c.ready_add, c.pitfalls, c.note, c.vids].concat(arr(c.items).map(i => [i.title, i.creator, i.why, i.link].join(" "))).concat(arr(c.exercises).map(e => e.text)).concat(arr(c.side).map(s => [s.title, s.note, s.exercise].concat(arr(s.items).map(i => i.title)).join(" "))); }

  /* ───────── What's open: remembered per device; first visit opens where you are ───────── */
  const OPEN = "mcOpen";
  function savedOpen() { const s = AA.store.get(OPEN, null); return Array.isArray(s) ? new Set(s) : null; }
  function saveOpen() { if (filter !== "all" || query) return; const ids = [...document.querySelectorAll("#mcBody details[open]")].map(d => d.id).filter(Boolean); AA.store.set(OPEN, ids); }

  /* ───────── Camp, side camp and phase blocks ───────── */
  function campBody(c, q) {
    const items = arr(c.items), live = items.filter(i => !i.dropped), dropped = items.filter(i => i.dropped); const ex = arr(c.exercises);
    return '<div class="cp-body">' +
      (c.updated_since_plan ? '<div class="mc-upd">The course updated this camp after your plan was made. Your professor will see this at your next check-in.</div>' : "") +
      (c.note ? '<div class="mc-note"><span class="pc-tag pro">From your professor</span>' + esc(c.note) + "</div>" : "") +
      (c.body ? '<div class="mc-prose">' + md(c.body) + "</div>" : "") +
      (items.length ? '<h4 class="mc-sub">Watch and read</h4><ul class="mc-items">' + live.map(i => itemHTML(i, c.key, q)).join("") + "</ul>" +
        (dropped.length ? '<details class="mc-dropped"><summary>' + dropped.length + " dropped for you</summary><ul class=\"mc-items\">" + dropped.map(i => itemHTML(i, c.key, q)).join("") + "</ul></details>" : "") : "") +
      (ex.length ? '<h4 class="mc-sub">' + (c.capstone ? "The capstone" : "Do") + '</h4><ul class="mc-exs">' + ex.map(exHTML).join("") + "</ul>" : "") +
      (c.ready || c.ready_add ? '<div class="mc-ready"><b>Ready to move on when…</b> ' + (c.ready ? inline(c.ready) : "") + (c.ready_add ? '<div class="mc-ready-add"><span class="pc-tag pro">Your professor adds</span>' + esc(c.ready_add) + "</div>" : "") + "</div>" : "") +
      (c.pitfalls ? '<div class="mc-pit"><b>Pitfalls:</b> ' + inline(c.pitfalls) + "</div>" : "") +
      '<div class="cp-foot"><a class="chip link" href="ascent.html#' + esc(c.key) + '">Practice and take the test on the Ascent</a></div></div>';
  }
  function campBlock(c, m, here, open, q) {
    const st = m ? stateOf(c.key, m) : "none";
    const depth = DEPTH[c.depth] ? '<span class="chip depth' + (c.depth === "lightened" ? " light" : c.depth === "skip" ? " skip" : "") + '">' + DEPTH[c.depth] + "</span>" : "";
    const hours = c.hours == null ? "time inside 6.4" : "~" + c.hours + " h";
    return '<details class="cp st-' + st + (changed(c) ? " changed" : "") + (here ? " here" : "") + '" id="' + esc(c.key) + '"' + (open ? " open" : "") + ">" +
      '<summary class="cp-h"><span class="cp-dot" aria-hidden="true"></span><span class="cp-k">' + (c.capstone ? "★" : esc(c.key.slice(1))) + "</span>" +
      '<span class="cp-t"><span class="cp-name">' + esc(c.title) + (c.core ? "" : ' <span class="cp-opt">optional</span>') + "</span>" +
      '<span class="cp-meta"><span>' + esc(c.week_label || "") + "</span><span>" + esc(hours) + "</span>" + (c.video_min ? "<span>▶ " + fmtMin(c.video_min) + "</span>" : "") + "</span></span>" +
      '<span class="cp-badges">' + (here ? '<span class="pill here">You\'re here</span>' : "") + depth + statusChip(c.key, m) + (changed(c) ? '<span class="cp-mark" title="Your professor changed this camp">changed</span>' : "") + "</span>" +
      '<span class="chev" aria-hidden="true"></span></summary>' + campBody(c, q) + "</details>";
  }
  function sideBlock(s, after, m, open, q) {
    const st = m ? stateOf("side:" + s.id, m) : "none";
    const items = arr(s.items).map((x, i) => itemHTML({ source: "professor", id: s.id + "." + (i + 1), title: x.title, url: x.url, len: x.len, why: x.why, kind: /youtube\.com|youtu\.be/.test(x.url || "") ? "video" : "course" }, after, q)).join("");
    return '<details class="cp side st-' + st + '" id="side-' + esc(s.id) + '"' + (open ? " open" : "") + ">" +
      '<summary class="cp-h"><span class="cp-dot" aria-hidden="true"></span><span class="cp-k">+</span><span class="cp-t"><span class="cp-name">' + esc(s.title) + "</span>" +
      '<span class="cp-meta"><span>Side camp from your professor</span>' + (s.hours ? "<span>~" + esc(s.hours) + " h</span>" : "") + "<span>no test</span></span></span>" +
      '<span class="cp-badges">' + (m && st === "done" ? '<span class="chip ok">Done</span>' : "") + "</span><span class=\"chev\" aria-hidden=\"true\"></span></summary>" +
      '<div class="cp-body">' + (s.note ? '<div class="mc-note">' + esc(s.note) + "</div>" : "") + (items ? '<h4 class="mc-sub">Watch and read</h4><ul class="mc-items">' + items + "</ul>" : "") +
      (s.exercise ? '<h4 class="mc-sub">Do</h4><p class="mc-prose">' + inline(s.exercise) + "</p>" : "") +
      '<div class="cp-foot"><span class="muted">Mark it done on the <a href="ascent.html#' + esc(after) + '">Ascent</a>.</span></div></div></details>';
  }

  /* Phases in the order you climb them. A camp whose content belongs to an earlier phase (1.4B, done in week 11)
     joins the phase it's climbed in, labelled with where it comes from. */
  function groups(d) {
    const phases = {}; arr(d.phases).forEach(ph => { phases[ph.id] = ph; });
    const out = []; let g = null; const seen = new Set();
    arr(d.camps).forEach(c => {
      if (!g || (c.phase !== g.id && !seen.has(c.phase))) { g = { id: c.phase, ph: phases[c.phase] || { title: c.phase }, camps: [] }; out.push(g); seen.add(c.phase); }
      g.camps.push(c);
    });
    return out;
  }
  function phaseName(t) { const m = /^Phase (\d+)\s*[–-]\s*(.*)$/.exec(t || ""); return m ? { n: m[1], name: m[2] } : { n: "", name: t || "" }; }

  /* ───────── Render ───────── */
  function render() {
    const d = data; if (!d) return;
    const who = d.student ? (d.student.name || "This climber") : null; const me = ownId();
    const mine = !!(target && me && target === me);
    $("mcTitle").textContent = mine || !who ? (who && mine ? "My course" : "The course") : who + "'s course";
    $("mcEyebrow").textContent = d.plan ? "The shared course + " + (mine ? "your" : "their") + " plan" : "The shared course, as written";
    $("mcWho").innerHTML = target === null ? "The course exactly as written, with no plan on top." : mine ? "The course every climber shares, with your professor's changes marked." : "Viewing " + esc(who || "a climber") + "'s course, read-only.";
    $("mcCourseV").textContent = "This is course version " + (d.course && d.course.version || "?") + ".";
    const camps = arr(d.camps); const nChanged = camps.filter(changed).length; const nSide = camps.reduce((a, c) => a + arr(c.side).length, 0); const stale = camps.filter(c => c.updated_since_plan).length;
    const p = d.plan;
    $("mcPlan").innerHTML = !p ? (target === null ? '<div class="mc-plan-t">No plan</div><div>Pick a climber to see their plan on top.</div>' : '<div class="mc-plan-t">No plan yet</div><div>At each checkpoint your professor may send one; you apply it on the <a href="ascent.html">Ascent</a>.</div>')
      : '<div class="mc-plan-t">Plan v' + esc(p.version || "?") + (p.checkpoint ? ", " + esc(p.checkpoint) : "") + (p.appliedAt ? ", applied " + esc(AA.fmtDate(String(p.appliedAt).slice(0, 10))) : "") + "</div>" +
        (p.summary ? '<div style="color:var(--fg)">' + esc(p.summary) + "</div>" : "") +
        "<div>" + nChanged + " camp" + (nChanged === 1 ? "" : "s") + " changed" + (nSide ? ", " + nSide + " side camp" + (nSide === 1 ? "" : "s") : "") + (p.courseVersion ? ", made on course v" + esc(p.courseVersion) : "") + "</div>" +
        (stale ? '<div class="mc-upd" style="margin-top:6px">' + stale + " camp" + (stale === 1 ? " has" : "s have") + " been updated in the course since this plan was made.</div>" : "");
    const hist = mine ? AA.own.planlog() : (AA.isViewing() && (AA.cloud || {}).viewId === target ? AA.planHistory() : []);
    $("mcHist").hidden = !hist.length;
    $("mcHistList").innerHTML = hist.slice().reverse().map((e, i) => { const q = e.plan || {}; const reuse = Object.assign({}, q); delete reuse.appliedAt; delete reuse.courseVersion; delete reuse.reappliedFrom;
      return "<li><div><b>" + esc(AA.fmtDate(new Date(e.at).toISOString().slice(0, 10))) + "</b>, v" + esc(q.version || "?") + (q.checkpoint ? ", " + esc(q.checkpoint) : "") + (i === 0 ? ' <span class="pill ok">in force</span>' : "") + "</div>" +
        (q.summary ? '<div class="muted">' + esc(q.summary) + "</div>" : "") + (mine && i > 0 ? '<a href="ascent.html#plan=' + encodeURIComponent(JSON.stringify(reuse)) + '">Use this plan again</a> <span class="muted">(you\'ll see the changes and confirm on the Ascent)</span>' : "") + "</li>"; }).join("");
    if (target) { const url = (cfg.supabaseUrl || "") + "/rest/v1/rpc/course_md?uid=" + target + "&apikey=" + (cfg.supabaseAnonKey || ""); $("mcProf").hidden = false; $("mcProfLink").href = url; $("mcProfCopy").onclick = async () => { const okc = await AA.copyText(url); AA.toast(okc ? "Link copied" : "Copy was blocked"); }; }
    else $("mcProf").hidden = true;
    renderTrail();
  }

  /* The trail: nine phases, each a section you open; inside, its camps, each a section you open. */
  function renderTrail() {
    const d = data; if (!d) return;
    const m = mods(); const q = norm(query).trim(); const searching = q.length >= 2; const narrow = searching || filter === "changed";
    const camps = arr(d.camps);
    const hereKey = m ? (camps.find(c => stateOf(c.key, m) !== "done") || {}).key : null;
    const saved = savedOpen();
    const gs = groups(d);
    const hereGroup = gs.find(g => g.camps.some(c => c.key === hereKey));
    const startGroup = hereGroup || gs[0], startCamp = hereKey || (startGroup && startGroup.camps[0] || {}).key;
    const isOpen = id => saved ? saved.has(id) : !!startGroup && (id === startGroup.id || id === startCamp);
    let html = "", shown = 0;
    gs.forEach((g, gi) => {
      const ph = g.ph; const pn = phaseName(ph.title);
      const show = g.camps.filter(c => (filter !== "changed" || changed(c)) && (!searching || matches(campText(c), q)));
      if (narrow && !show.length) return;
      shown += show.length;
      const total = g.camps.length; const passed = m ? g.camps.filter(c => stateOf(c.key, m) === "done").length : 0;
      const pst = !m ? "none" : passed === total ? "done" : (g.camps.some(c => c.key === hereKey) || passed) ? "doing" : "todo";
      const hours = g.camps.reduce((a, c) => a + (Number(c.hours) || 0), 0), video = g.camps.reduce((a, c) => a + (Number(c.video_min) || 0), 0);
      const nCh = g.camps.filter(changed).length;
      const open = narrow || isOpen(g.id);
      html += '<details class="ph st-' + pst + (g.camps.some(c => c.key === hereKey) ? " here" : "") + '" id="' + esc(g.id) + '"' + (open ? " open" : "") + ">" +
        '<summary class="ph-h"><span class="ph-node" aria-hidden="true">' + esc(pn.n) + "</span>" +
        '<span class="ph-t"><span class="ph-land">' + esc(ph.land || "") + (pn.n ? ", phase " + esc(pn.n) : "") + "</span><span class=\"ph-name\">" + esc(pn.name) + "</span>" +
        '<span class="ph-meta"><span>' + esc(ph.weeks || "") + "</span><span>~" + Math.round(hours) + " h</span>" + (video ? "<span>▶ " + fmtMin(video) + "</span>" : "") + "<span>" + total + " camp" + (total === 1 ? "" : "s") + "</span>" + (nCh ? '<span class="ph-ch">' + nCh + " changed for you</span>" : "") + "</span></span>" +
        (m ? '<span class="ph-prog" title="' + passed + " of " + total + ' camps passed"><span class="bar"><i style="width:' + Math.round(passed / total * 100) + '%"></i></span><span>' + passed + "/" + total + "</span></span>" : "") +
        '<span class="chev" aria-hidden="true"></span></summary><div class="ph-body">' +
        (!narrow && ph.intro ? '<div class="mc-prose ph-intro">' + md(ph.intro) + "</div>" : "") +
        '<div class="cp-list">' + show.map(c => { const from = c.phase !== g.id ? phaseName((d.phases.find(x => x.id === c.phase) || {}).title) : null;
          return (from ? '<div class="cp-from">From phase ' + esc(from.n) + ", " + esc(from.name) + ", done here in week " + esc(c.week) + "</div>" : "") +
            campBlock(c, m, c.key === hereKey, narrow || isOpen(c.key), searching ? q : "") +
            arr(c.side).map(s => sideBlock(s, c.key, m, narrow || isOpen("side-" + s.id), searching ? q : "")).join(""); }).join("") + "</div>" +
        (!narrow && ph.outro ? '<details class="ph-check" id="' + esc(g.id) + '-check"' + (isOpen(g.id + "-check") ? " open" : "") + '><summary>Phase checkpoint: the project, the ready check and the pitfalls</summary><div class="mc-prose">' + md(ph.outro) + "</div></details>" : "") +
        "</div></details>";
    });
    $("mcBody").innerHTML = html ? '<div class="mc-trail">' + html + "</div>" : '<div class="empty">' + (searching ? "Nothing in the course mentions “" + esc(query.trim()) + "”. Try a shorter word, or a tool's name." : "Nothing has been changed for " + (target && target === ownId() ? "you" : "this climber") + " yet: every camp is the course as written.") + "</div>";
    document.querySelectorAll("#mcBody details[open]").forEach(x => { x.dataset.o = "1"; });
    paintToggle();
    $("mcCount").textContent = searching ? shown + " camp" + (shown === 1 ? "" : "s") + " match" + (shown === 1 ? "es" : "") : filter === "changed" ? shown + " camp" + (shown === 1 ? "" : "s") + " changed" : "";
  }

  /* Open a camp, side camp or phase by id (from a link like mycourse.html#m05) and scroll to it. */
  function reveal(id) { const el = document.getElementById(id); if (!el) return;
    let p = el; while (p) { if (p.tagName === "DETAILS") p.open = true; p = p.parentElement; }
    el.scrollIntoView({ block: "start" }); saveOpen(); }

  /* ───────── Controls ───────── */
  document.querySelectorAll(".mc-seg button").forEach(b => b.addEventListener("click", () => { filter = b.dataset.f; document.querySelectorAll(".mc-seg button").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", String(x === b)); }); renderTrail(); }));
  let qT = null; $("mcSearch").addEventListener("input", e => { clearTimeout(qT); const v = e.target.value; qT = setTimeout(() => { query = v; renderTrail(); }, 150); });
  $("mcSearch").addEventListener("keydown", e => { if (e.key === "Escape") { e.target.value = ""; query = ""; renderTrail(); } });
  /* One button: Expand all while anything is closed, Collapse all once everything is open. */
  function allOpen() { const ds = document.querySelectorAll("#mcBody details.ph, #mcBody details.cp"); return ds.length > 0 && [...ds].every(x => x.open); }
  function paintToggle() { $("mcToggleAll").textContent = allOpen() ? "Collapse all" : "Expand all"; }
  $("mcToggleAll").addEventListener("click", () => { const close = allOpen(); document.querySelectorAll(close ? "#mcBody details" : "#mcBody details.ph, #mcBody details.cp").forEach(x => { x.open = !close; }); saveOpen(); paintToggle(); });
  /* Only what you open or close is remembered. Sections drawn already open also fire "toggle", so each one
     notes the state it was drawn in and an event that matches it is ignored. */
  document.addEventListener("toggle", e => { const t = e.target; if (!t || !t.closest || !t.closest("#mcBody")) return;
    const was = t.dataset.o === "1"; t.dataset.o = t.open ? "1" : "";
    if (t.open !== was) saveOpen();
    paintToggle(); }, true);
  window.addEventListener("hashchange", () => reveal(decodeURIComponent(location.hash.slice(1))));

  /* Reload when sign-in settles, the climber list arrives, or this climber's plan has just been saved. */
  window.addEventListener("aa:auth", () => { if (!chosen) target = undefined; load(); });
  window.addEventListener("aa:expedition", () => { if (target !== undefined) paintSelector(); });
  window.addEventListener("aa:synced", e => { const d = e.detail || {}; if (d.ok && d.kind === "plan" && target && target === ownId()) load(); });
  window.addEventListener("aa:progress", renderTrail);
  load();
})();
