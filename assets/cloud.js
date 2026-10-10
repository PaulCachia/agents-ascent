/* The Agent's Ascent — cloud sync (Supabase). Loads only when assets/config.js has a URL and key.
   Model: the browser's localStorage is the signed-in climber's working copy; every change is pushed to the
   `progress` table (one row per module, check-in, session, plus one profile row and one plan row), and on
   sign-in the cloud copy is pulled and merged. Signed out, the site reads a chosen climber's rows through the
   public-read policy into a separate read-only overlay (AA.setView), never into the working copy, so nothing
   viewed can leak into an account on a later sign-in. Sign-in is a magic link by email; only the signed-in
   owner can write (Row-Level Security). The "expedition" is every climber whose profile is public. */
(function () {
  "use strict";
  const cfg = window.AA_CONFIG || {};
  AA.cloud = { configured: false, enabled: false, user: null, ready: false, viewOnly: false, viewId: null, climbers: [] };
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) { AA.cloud.ready = true; window.dispatchEvent(new CustomEvent("aa:auth")); return; }
  AA.cloud.configured = true;

  const LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.0/dist/umd/supabase.min.js";
  const s = document.createElement("script"); s.src = LIB; s.onload = init;
  s.onerror = () => { AA.cloud.ready = true; status("Sync library didn't load; working locally.", true); window.dispatchEvent(new CustomEvent("aa:auth")); };
  document.head.appendChild(s);

  let sb = null, user = null, pulling = false, timers = {}, cloudKeys = { module: new Set(), checkin: new Set(), session: new Set(), profile: new Set(), plan: new Set() };
  let ui = null;
  const KIND = { modules: "module", checkins: "checkin", sessions: "session", profile: "profile", plan: "plan" };

  function init() {
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    AA.cloud.enabled = true;
    mountUI();
    sb.auth.onAuthStateChange((ev, session) => {
      user = session ? session.user : null; AA.cloud.user = user; AA.cloud.ready = true; AA.cloud.viewOnly = !user;
      AA.clearView(); AA.cloud.viewId = null;
      paint(); window.dispatchEvent(new CustomEvent("aa:auth"));
      if (user) pull(); else pullPublic();
      expedition();
    });
    window.addEventListener("aa:store", e => { if (!user || pulling) return; let k = e.detail && e.detail.key; if (k === "planlog") k = "plan"; if (KIND[k]) schedulePush(k); });
    AA.cloud.signIn = signIn; AA.cloud.signOut = () => sb.auth.signOut(); AA.cloud.pull = () => (user ? pull() : pullPublic());
    /* View a climber's rows read-only (works signed in or out). "me" or your own id returns to your working copy. */
    AA.cloud.viewAs = id => { const u = AA.cloud.user; if (u && (!id || id === "me" || id === u.id)) { AA.clearView(); AA.cloud.viewId = null; window.dispatchEvent(new CustomEvent("aa:auth")); window.dispatchEvent(new CustomEvent("aa:progress")); window.dispatchEvent(new CustomEvent("aa:sessions")); return Promise.resolve(); } if (!AA.cloud.user) AA.store.set("viewId", id); return viewClimber(id); };
    AA.cloud.refreshExpedition = expedition;
    AA.cloud.rpc = (fn, args) => sb.rpc(fn, args || {});
    /* The shared course (ids of every resource and exercise, per camp), loaded once: used to check a plan before it's applied. */
    let coursePromise = null;
    AA.cloud.course = () => coursePromise || (coursePromise = Promise.all([
      sb.from("course_meta").select("version,released").eq("id", 1).maybeSingle(),
      sb.from("course_camps").select("key,title,core,items,exercises,changed_in").order("pos")
    ]).then(([m, c]) => { if (m.error || c.error || !c.data || !c.data.length) { coursePromise = null; return null; }
      const camps = {}; c.data.forEach(r => { camps[r.key] = { title: r.title, core: r.core, changed_in: r.changed_in, items: (r.items || []).map(i => ({ id: i.id, title: i.title })), exercises: (r.exercises || []).map(e => ({ id: e.id, text: e.text })) }; });
      return { version: m.data ? m.data.version : null, released: m.data ? m.data.released : null, camps: camps }; }).catch(() => { coursePromise = null; return null; }));
    /* One climber's course with their plan layered on (uid null = the shared course as written). */
    AA.cloud.courseFor = uid => sb.rpc("course_for", { uid: uid || null });
    /* Plans a professor sent through the connector: the newest one still waiting for the signed-in climber. */
    AA.cloud.pendingProposal = async () => { if (!user) return null; const { data, error } = await sb.from("plan_proposals").select("id,plan,message,status,created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(1);
      return error || !data || !data.length ? null : data[0]; };
    AA.cloud.decideProposal = (id, status) => (user ? sb.from("plan_proposals").update({ status: status, decided_at: new Date().toISOString() }).eq("id", id) : Promise.resolve({ error: { message: "Sign in first" } }));
    /* The professor connector: the climber's own key (readable only by them), made, remade or removed here. */
    AA.cloud.professorKey = async () => { if (!user) return null; const { data, error } = await sb.from("professor_keys").select("key,created_at").maybeSingle(); return error ? { error: error.message } : data; };
    AA.cloud.makeProfessorKey = () => sb.rpc("create_professor_key");
    AA.cloud.deleteProfessorKey = () => sb.rpc("delete_professor_key");
    AA.cloud.connectorUrl = key => cfg.supabaseUrl + "/functions/v1/professor?key=" + encodeURIComponent(key);
    AA.cloud.openPanel = () => { if (!ui) return; const p = ui.querySelector("#syncPanel"); p.hidden = false; paint(); const em = p.querySelector("#syncEmail"); if (em) em.focus(); };
  }

  function status(msg, warn) { if (!ui) return; const el = ui.querySelector("#syncMsg"); el.textContent = msg; el.style.color = warn ? "var(--warn)" : "var(--muted)"; }
  function synced(kind, ok, message) { window.dispatchEvent(new CustomEvent("aa:synced", { detail: { kind: kind, ok: ok, message: message || "" } })); }

  function mountUI() {
    const navIn = document.querySelector(".nav-in"); if (!navIn) return;
    ui = document.createElement("div"); ui.className = "sync";
    ui.innerHTML = '<button class="ghost" type="button" id="syncBtn" style="font-size:13px;padding:6px 10px;border-radius:8px">Sync</button>' +
      '<div class="trk-panel" id="syncPanel" hidden style="position:absolute;right:0;top:44px;width:min(320px,calc(100vw - 32px))">' +
      '<div class="eyebrow">Cloud sync</div><div id="syncBody"></div><div id="syncMsg" class="muted" style="font-size:12px"></div></div>';
    ui.style.position = "relative";
    navIn.insertBefore(ui, navIn.querySelector("#themeBtn"));
    ui.querySelector("#syncBtn").addEventListener("click", () => { const p = ui.querySelector("#syncPanel"); p.hidden = !p.hidden; if (!p.hidden) paint(); });
    document.addEventListener("click", e => { if (!ui.contains(e.target) && !(e.target.closest && e.target.closest("[data-opens-sync]"))) ui.querySelector("#syncPanel").hidden = true; });
    paint();
  }

  function paint() {
    if (!ui) return;
    const btn = ui.querySelector("#syncBtn"), body = ui.querySelector("#syncBody");
    if (user) {
      btn.textContent = "Synced"; btn.style.borderColor = "var(--done)"; btn.style.color = "var(--done)";
      body.innerHTML = '<div style="font-size:13px">Signed in as <b>' + AA.esc(user.email || "you") + '</b>. Changes save to your database as you make them.</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><button class="ghost" type="button" id="syncNow">Pull latest</button><button class="ghost" type="button" id="syncOut">Sign out</button></div>';
      body.querySelector("#syncNow").addEventListener("click", () => pull().then(() => status("Pulled the latest copy.")));
      body.querySelector("#syncOut").addEventListener("click", () => sb.auth.signOut());
    } else {
      btn.textContent = "Sign in"; btn.style.borderColor = "var(--accent)"; btn.style.color = "var(--accent)";
      body.innerHTML = '<form id="syncForm" style="display:grid;gap:6px"><label style="font-size:12px;color:var(--muted)">Email for a sign-in link<input type="email" id="syncEmail" required placeholder="you@example.com" autocomplete="email" inputmode="email"></label><button class="primary" type="submit">Send magic link</button></form>' +
        '<div class="muted" style="font-size:12px">New climber? The same link starts your own climb. Open it on this device; if it opens inside your mail app, choose "Open in browser".</div>';
      body.querySelector("#syncForm").addEventListener("submit", e => { e.preventDefault(); signIn(body.querySelector("#syncEmail").value.trim()); });
    }
  }

  async function signIn(email) {
    if (!email) return;
    status("Sending the link…");
    const redirect = location.origin + location.pathname;
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    if (error) { status(error.message, true); return; }
    status("Link sent. Open it on this device (it brings you back here, signed in). It works once and expires in an hour.");
  }

  /* Rows always come from this browser's OWN working copy (AA.own), never from a viewed climber's overlay. */
  function rowsFor(kind) {
    if (!user) return [];
    const o = AA.own;
    if (kind === "modules") { const m = o.modules(); return Object.keys(m).map(k => ({ user_id: user.id, kind: "module", key: k, data: m[k] })); }
    if (kind === "checkins") return o.checkins().filter(c => c && c.id).map(c => ({ user_id: user.id, kind: "checkin", key: String(c.id), data: c }));
    if (kind === "sessions") return o.sessions().filter(x => x && x.id).map(x => ({ user_id: user.id, kind: "session", key: String(x.id), data: x }));
    if (kind === "profile") { const p = o.profile(); return Object.keys(p).length ? [{ user_id: user.id, kind: "profile", key: "me", data: p }] : []; }
    if (kind === "plan") { const p = o.plan(); const rows = p ? [{ user_id: user.id, kind: "plan", key: "current", data: p }] : [];
      o.planlog().forEach(e => rows.push({ user_id: user.id, kind: "plan", key: "h" + e.at, data: e })); return rows; }
    return [];
  }

  function schedulePush(k) { clearTimeout(timers[k]); timers[k] = setTimeout(() => push(k), 700); }

  async function push(k) {
    if (!user) return;
    const rows = rowsFor(k); const kind = KIND[k];
    try {
      if (rows.length) { for (let i = 0; i < rows.length; i += 100) { const { error } = await sb.from("progress").upsert(rows.slice(i, i + 100), { onConflict: "user_id,kind,key" }); if (error) throw error; } }
      const localKeys = new Set(rows.map(r => r.key)); const gone = [...cloudKeys[kind]].filter(key => !localKeys.has(key));
      if (gone.length) { const { error } = await sb.from("progress").delete().eq("user_id", user.id).eq("kind", kind).in("key", gone); if (error) throw error; }
      cloudKeys[kind] = localKeys; status("Saved " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + "."); synced(kind, true);
      if (kind === "profile" || kind === "module") expedition();
    } catch (err) { const m = err.message || "error"; status("Couldn't save (" + m + "). Will retry on the next change.", true); synced(kind, false, m); }
  }

  /* Plan history rows (key "h<ms>") → [{ at, plan }], oldest first. */
  function historyOf(planRows) { return Object.keys(planRows).filter(k => /^h\d+$/.test(k)).map(k => planRows[k]).filter(e => e && e.at && e.plan).sort((a, b) => a.at - b.at); }
  function group(data) { const c = { module: {}, checkin: {}, session: {}, profile: {}, plan: {} }; data.forEach(r => { if (c[r.kind]) c[r.kind][r.key] = r.data; }); return c; }

  /* Merge cloud rows into the signed-in working copy: cloud wins per module/profile/plan; check-ins and sessions union by id. */
  function mergeOwn(data) {
    const cloud = group(data); const o = AA.own;
    pulling = true;
    try {
      AA.setModules(Object.assign({}, o.modules(), cloud.module));
      const ci = {}; o.checkins().forEach(c => { if (c && c.id) ci[c.id] = c; }); Object.assign(ci, cloud.checkin);
      AA.setCheckins(Object.values(ci).sort((a, b) => (b.created || 0) - (a.created || 0)));
      const ss = {}; o.sessions().forEach(x => { if (x && x.id) ss[x.id] = x; }); Object.assign(ss, cloud.session);
      AA.store.set("sessions", Object.values(ss).sort((a, b) => (b.start || 0) - (a.start || 0)));
      if (cloud.profile.me) AA.setProfile(Object.assign({}, o.profile(), cloud.profile.me));
      if (cloud.plan.current) AA.setPlan(cloud.plan.current);
      const log = {}; o.planlog().forEach(e => { log[e.at] = e; }); historyOf(cloud.plan).forEach(e => { log[e.at] = e; });
      AA.store.set("planlog", Object.values(log).sort((a, b) => a.at - b.at));
    } finally { pulling = false; }
    window.dispatchEvent(new CustomEvent("aa:progress")); window.dispatchEvent(new CustomEvent("aa:sessions"));
    return cloud;
  }

  async function pull() {
    if (!user) return;
    const { data, error } = await sb.from("progress").select("kind,key,data").eq("user_id", user.id);
    if (error) { status("Couldn't read your database: " + error.message, true); return; }
    const cloud = mergeOwn(data);
    cloudKeys = { module: new Set(Object.keys(cloud.module)), checkin: new Set(Object.keys(cloud.checkin)), session: new Set(Object.keys(cloud.session)), profile: new Set(Object.keys(cloud.profile)), plan: new Set(Object.keys(cloud.plan)) };
    // Push anything that only existed locally.
    await push("modules"); await push("checkins"); await push("sessions"); await push("profile"); await push("plan");
    status("Synced.");
  }

  /* Signed-out read: one climber's rows (the last one viewed on this device, else the default climber) into the view overlay. */
  function pullPublic() { if (user) return Promise.resolve(); return viewClimber(AA.store.get("viewId", null) || cfg.ownerId || null); }
  async function viewClimber(id) {
    AA.cloud.viewId = id;
    let q = sb.from("progress").select("kind,key,data"); if (id) q = q.eq("user_id", id);
    const { data, error } = await q;
    if (error) { status("Couldn't read the database: " + error.message, true); return; }
    const c = group(data);
    AA.setView({ modules: c.module, checkins: Object.values(c.checkin).sort((a, b) => (b.created || 0) - (a.created || 0)), sessions: Object.values(c.session).sort((a, b) => (b.start || 0) - (a.start || 0)), profile: c.profile.me || {}, plan: c.plan.current || null, planlog: historyOf(c.plan) });
    window.dispatchEvent(new CustomEvent("aa:auth")); window.dispatchEvent(new CustomEvent("aa:progress")); window.dispatchEvent(new CustomEvent("aa:sessions"));
    status("Showing " + ((c.profile.me && c.profile.me.name) || "a climber") + "'s synced copy (read-only).");
  }

  /* Everyone on the mountain: public profiles plus how many camps each has passed. */
  async function expedition() {
    const { data, error } = await sb.from("progress").select("user_id,kind,key,data").in("kind", ["profile", "module"]);
    if (error) return;
    const by = {};
    data.forEach(r => { const u = by[r.user_id] || (by[r.user_id] = { id: r.user_id, name: "", start: "", public: true, done: {} }); if (r.kind === "profile") { u.name = r.data.name || ""; u.start = r.data.start || ""; u.public = r.data.public !== false; u.goal = r.data.goal || ""; u.photo = r.data.photo || ""; } else if (/^m\d\d$/.test(r.key) && r.data && (r.data.status === "done" || r.data.status === "skip")) u.done[r.key] = true; });
    AA.cloud.climbers = Object.values(by).filter(u => u.public).sort((a, b) => (a.name || "zz").localeCompare(b.name || "zz"));
    window.dispatchEvent(new CustomEvent("aa:expedition"));
  }
})();
