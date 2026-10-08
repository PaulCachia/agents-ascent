/* The Agent's Ascent — cloud sync (Supabase). Loads only when assets/config.js has a URL and key.
   Model: the browser's localStorage stays the working copy; every change is pushed to the `progress` table,
   and on sign-in the cloud copy is pulled and merged. Sign-in is a magic link by email; only the signed-in
   owner can write (Row-Level Security). */
(function () {
  "use strict";
  const cfg = window.AA_CONFIG || {};
  AA.cloud = { enabled: false, user: null };
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) return;

  const LIB = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
  const s = document.createElement("script"); s.src = LIB; s.onload = init; s.onerror = () => status("Sync library didn't load; working locally.", true); document.head.appendChild(s);

  let sb = null, user = null, pulling = false, timers = {}, cloudKeys = { module: new Set(), checkin: new Set(), session: new Set() };
  let ui = null;

  function init() {
    sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    AA.cloud.enabled = true;
    mountUI();
    sb.auth.onAuthStateChange((ev, session) => { user = session ? session.user : null; AA.cloud.user = user; paint(); if (user) pull(); });
    window.addEventListener("aa:store", e => { if (!user || pulling) return; const k = e.detail && e.detail.key; if (k === "modules" || k === "checkins" || k === "sessions") schedulePush(k); });
    AA.cloud.signIn = signIn; AA.cloud.signOut = () => sb.auth.signOut(); AA.cloud.pull = pull;
  }

  function status(msg, warn) { if (!ui) return; const el = ui.querySelector("#syncMsg"); el.textContent = msg; el.style.color = warn ? "var(--warn)" : "var(--muted)"; }

  function mountUI() {
    const navIn = document.querySelector(".nav-in"); if (!navIn) return;
    ui = document.createElement("div"); ui.className = "sync";
    ui.innerHTML = '<button class="ghost" type="button" id="syncBtn" style="font-size:13px;padding:6px 10px;border-radius:8px">Sync</button>' +
      '<div class="trk-panel" id="syncPanel" hidden style="position:absolute;right:0;top:44px;width:min(320px,calc(100vw - 32px))">' +
      '<div class="eyebrow">Cloud sync</div><div id="syncBody"></div><div id="syncMsg" class="muted" style="font-size:12px"></div></div>';
    ui.style.position = "relative";
    navIn.insertBefore(ui, navIn.querySelector("#themeBtn"));
    ui.querySelector("#syncBtn").addEventListener("click", () => { const p = ui.querySelector("#syncPanel"); p.hidden = !p.hidden; if (!p.hidden) paint(); });
    document.addEventListener("click", e => { if (!ui.contains(e.target)) ui.querySelector("#syncPanel").hidden = true; });
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
      btn.textContent = "Sync"; btn.style.borderColor = ""; btn.style.color = "";
      body.innerHTML = '<form id="syncForm" style="display:grid;gap:6px"><label style="font-size:12px;color:var(--muted)">Email for a sign-in link<input type="email" id="syncEmail" required placeholder="you@example.com" autocomplete="email"></label><button class="primary" type="submit">Send magic link</button></form>' +
        '<div class="muted" style="font-size:12px">Signing in syncs this browser with your database so progress follows you between devices and Claude can read it.</div>';
      body.querySelector("#syncForm").addEventListener("submit", e => { e.preventDefault(); signIn(body.querySelector("#syncEmail").value.trim()); });
    }
  }

  async function signIn(email) {
    if (!email) return;
    status("Sending the link…");
    const redirect = location.origin + location.pathname;
    const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: redirect } });
    if (error) { status(error.message, true); return; }
    status("Check your inbox for the sign-in link (it opens this page signed in).");
  }

  function rowsFor(kind) {
    if (kind === "modules") { const m = AA.modules(); return Object.keys(m).map(k => ({ user_id: user.id, kind: "module", key: k, data: m[k] })); }
    if (kind === "checkins") return AA.checkins().filter(c => c && c.id).map(c => ({ user_id: user.id, kind: "checkin", key: String(c.id), data: c }));
    if (kind === "sessions") return AA.sessions().filter(x => x && x.id).map(x => ({ user_id: user.id, kind: "session", key: String(x.id), data: x }));
    return [];
  }
  const KIND = { modules: "module", checkins: "checkin", sessions: "session" };

  function schedulePush(k) { clearTimeout(timers[k]); timers[k] = setTimeout(() => push(k), 700); }

  async function push(k) {
    if (!user) return;
    const rows = rowsFor(k); const kind = KIND[k];
    try {
      if (rows.length) { for (let i = 0; i < rows.length; i += 100) { const { error } = await sb.from("progress").upsert(rows.slice(i, i + 100), { onConflict: "user_id,kind,key" }); if (error) throw error; } }
      const localKeys = new Set(rows.map(r => r.key)); const gone = [...cloudKeys[kind]].filter(key => !localKeys.has(key));
      if (gone.length) { const { error } = await sb.from("progress").delete().eq("user_id", user.id).eq("kind", kind).in("key", gone); if (error) throw error; }
      cloudKeys[kind] = localKeys; status("Saved " + new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + ".");
    } catch (err) { status("Couldn't save (" + (err.message || "error") + "). Will retry on the next change.", true); }
  }

  async function pull() {
    if (!user) return;
    const { data, error } = await sb.from("progress").select("kind,key,data").eq("user_id", user.id);
    if (error) { status("Couldn't read your database: " + error.message, true); return; }
    const cloud = { module: {}, checkin: {}, session: {} };
    data.forEach(r => { if (cloud[r.kind]) cloud[r.kind][r.key] = r.data; });
    cloudKeys = { module: new Set(Object.keys(cloud.module)), checkin: new Set(Object.keys(cloud.checkin)), session: new Set(Object.keys(cloud.session)) };
    pulling = true;
    try {
      // Modules: the cloud copy wins where both exist; local-only modules are kept and pushed.
      const modules = Object.assign({}, AA.modules(), cloud.module); AA.setModules(modules);
      const ci = {}; AA.checkins().forEach(c => { if (c && c.id) ci[c.id] = c; }); Object.assign(ci, cloud.checkin);
      AA.setCheckins(Object.values(ci).sort((a, b) => (b.created || 0) - (a.created || 0)));
      const ss = {}; AA.sessions().forEach(x => { if (x && x.id) ss[x.id] = x; }); Object.assign(ss, cloud.session);
      AA.store.set("sessions", Object.values(ss).sort((a, b) => (b.start || 0) - (a.start || 0)));
    } finally { pulling = false; }
    window.dispatchEvent(new CustomEvent("aa:progress")); window.dispatchEvent(new CustomEvent("aa:sessions"));
    // Push anything that only existed locally.
    await push("modules"); await push("checkins"); await push("sessions");
    status("Synced.");
  }
})();
