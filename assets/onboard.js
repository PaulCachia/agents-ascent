/* The Agent's Ascent — first-time set-up: a guided walk-through on first sign-in (every step can be skipped),
   and a "First steps" checklist on the Ascent page that ticks itself off from what's in the database, as a
   backup for anything skipped. Both read and write only the signed-in climber's own profile. */
(function () {
  "use strict";
  const esc = AA.esc;
  const ASCENT = /ascent\.html$/.test(location.pathname);
  const isHttp = u => /^https?:\/\/\S+$/.test(String(u || "").trim());
  const own = () => AA.own.profile();
  const signedIn = () => { const c = AA.cloud || {}; return !!(c.user && !AA.isViewing()); };
  const synced = () => { const c = AA.cloud || {}; return !!(c.user && c.pulled === c.user.id); };
  function saveProfile(patch) { AA.setProfile(Object.assign({}, own(), patch)); }

  const RULES = '<ul class="ob-rules">' +
    "<li><b>Practice is unlimited</b>, never posted, and shows the right answer and why.</li>" +
    "<li><b>The test is 8 questions, 90 seconds each.</b> The clock starts when the first question appears.</li>" +
    "<li><b>70% (6 of 8) passes the camp</b> and moves your climber. Your first attempt is the one on the board.</li>" +
    "<li><b>Not passed? A retake opens 24 hours later.</b> After two attempts without a pass, the third waits 72 hours and a session with your professor.</li></ul>";
  const CONNECT_STEPS = ["Copy your connector link.",
    "In Claude, open <b>Customize → Connectors</b>, press <b>+ Add</b>, then <b>Add custom connector</b>.",
    "Name it <b>Ascent professor</b>, paste the link as its URL, choose <b>No sign in</b>, and add it.",
    "Open your professor's Project and check the connector is switched on for it (the tools menu in the message box)."];

  /* ───────── What's done: the same tests drive the walk-through's ticks and the checklist ───────── */
  let keyCache = { uid: null, has: false, at: 0 };
  async function hasKey(force) { const c = AA.cloud || {}; if (!c.user || !c.professorKey) return false;
    if (!force && keyCache.uid === c.user.id && Date.now() - keyCache.at < 60000) return keyCache.has;
    const k = await c.professorKey(); keyCache = { uid: c.user.id, has: !!(k && k.key), at: Date.now() }; return keyCache.has; }
  function sessionsLogged() { try { return AA.own.sessions ? AA.own.sessions().length : AA.sessions().length; } catch (e) { return 0; } }
  function campPassed(k) { const m = (AA.own.modules ? AA.own.modules() : AA.modules())[k] || {}; return m.status === "done" || m.status === "skip"; }
  async function state(force) {
    const p = own();
    return { profile: !!(p.name && p.goal), professor: isHttp(p.professor), connector: await hasKey(force), plan: !!AA.own.plan(), session: sessionsLogged() > 0, test: campPassed("m00") };
  }

  /* ───────── The guided set-up ───────── */
  const STEPS = ["welcome", "you", "professor", "connect", "tests", "go"];
  let box = null, at = 0;
  function mount() {
    if (box) return box;
    box = document.createElement("div"); box.className = "ob"; box.hidden = true; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-labelledby", "obTitle");
    box.innerHTML = '<div class="ob-card"><div class="ob-top"><span class="ob-count" id="obCount"></span><button class="ghost ob-x" type="button" id="obX" aria-label="Close the set-up">✕</button></div>' +
      '<div class="ob-bar" aria-hidden="true"><i id="obBar"></i></div><h2 id="obTitle"></h2><div class="ob-body" id="obBody"></div>' +
      '<div class="ob-f"><button class="ghost" type="button" id="obBack">Back</button><span class="ob-sp"></span><button class="linkish" type="button" id="obSkip">Skip this step</button><button class="primary" type="button" id="obNext">Next</button></div></div>';
    document.body.appendChild(box);
    box.querySelector("#obX").addEventListener("click", () => close(true));
    box.querySelector("#obBack").addEventListener("click", () => show(at - 1));
    box.querySelector("#obSkip").addEventListener("click", () => show(at + 1));
    box.addEventListener("keydown", e => { if (e.key === "Escape") close(true); });
    return box;
  }
  function open(step) { if (!signedIn()) return; mount(); document.body.style.overflow = "hidden"; box.hidden = false; show(typeof step === "number" ? step : 0); }
  function close(later) {
    if (!box || box.hidden) return; box.hidden = true; document.body.style.overflow = "";
    if (!own().onboarded) saveProfile({ onboarded: new Date().toISOString().slice(0, 10) });
    if (later) AA.toast("Set-up closed. The First steps list on the Ascent page keeps track of what's left.");
    paintList(); maybeWelcome();
  }
  const $ = id => document.getElementById(id);
  function foot(o) { $("obBack").hidden = !o.back; $("obSkip").hidden = !o.skip; $("obNext").textContent = o.next || "Next"; $("obNext").onclick = o.onNext || (() => show(at + 1)); }
  async function show(i) {
    at = Math.max(0, Math.min(STEPS.length - 1, i)); const id = STEPS[at]; const s = await state(); const p = own();
    $("obCount").textContent = at === 0 ? "Getting set up" : "Step " + at + " of " + (STEPS.length - 1); $("obBar").style.width = (at / (STEPS.length - 1) * 100) + "%";
    const body = $("obBody"); const T = t => { $("obTitle").textContent = t; };
    if (id === "welcome") {
      T("Welcome to the Ascent");
      body.innerHTML = "<p>A 26-week climb from novice to shipping your own AI product. This set-up takes about ten minutes, and you can skip any step: a <b>First steps</b> list on the Ascent page keeps track of what's left.</p>" +
        '<div class="ob-loop" aria-label="The loop at every camp"><span>Learn</span><span>Practise</span><span>Test</span><span>Climb</span><span class="p">Check in</span><span class="p">Re-plan</span></div>' +
        '<p class="ob-small">That loop repeats at each of the 24 camps. <a href="how.html" target="_blank" rel="noopener">See how it all works</a>.</p>';
      foot({ back: false, skip: false, next: "Let's start" }); $("obSkip").hidden = false; $("obSkip").textContent = "Skip set-up"; $("obSkip").onclick = () => close(true);
      return;
    }
    $("obSkip").textContent = "Skip this step"; $("obSkip").onclick = () => show(at + 1);
    if (id === "you") {
      T("Your climber");
      body.innerHTML = '<div class="ob-form"><label>Your name<input type="text" id="obName" maxlength="40" placeholder="e.g. Mick" value="' + esc(p.name || "") + '"></label>' +
        '<label>Start date (your week 1)<input type="date" id="obStart" value="' + esc(p.start || AA.todayISO()) + '"></label>' +
        '<label class="full">Your end goal: what do you want to be able to build?<textarea id="obGoal" maxlength="200" rows="3" placeholder="e.g. ship a paid AI product for our clients by next summer">' + esc(p.goal || "") + "</textarea></label>" +
        '<label class="full ob-check"><input type="checkbox" id="obPublic"' + (p.public === false ? "" : " checked") + "> Show my climb on the shared mountain</label></div>" +
        '<p class="ob-small">Your professor steers every plan towards your goal; you can change it any time. Add a photo for your climber on <a href="profile.html" target="_blank" rel="noopener">My profile</a>.</p>';
      foot({ back: true, skip: true, next: "Save and continue", onNext: () => { saveProfile({ name: $("obName").value.trim(), start: $("obStart").value || AA.todayISO(), goal: $("obGoal").value.trim(), public: $("obPublic").checked }); AA.toast("Saved"); show(at + 1); } });
      return;
    }
    if (id === "professor") {
      T("Your professor");
      body.innerHTML = "<p>Your professor is your own AI tutor: a Claude Project that reads your progress, teaches what's shaky and <b>builds the course around you</b>. In your first chat it asks about your goal, your time and what you already know, then sends you a personal plan.</p>" +
        '<ol class="ob-steps"><li><a class="ob-btn" href="professor.html" target="_blank" rel="noopener">Open the step-by-step guide</a> <span class="ob-small">(about five minutes; it has the brief to copy)</span></li>' +
        '<li><label>Paste your Project\'s web address<input type="url" id="obProf" placeholder="https://claude.ai/project/…" value="' + esc(p.professor || "") + '"></label><span class="ob-state" id="obProfState">' + (s.professor ? "✓ Saved" : "") + "</span></li></ol>";
      foot({ back: true, skip: true, next: s.professor ? "Next" : "Save and continue", onNext: () => { const v = $("obProf").value.trim(); if (v && !isHttp(v)) { $("obProfState").textContent = "That needs to be a full web address starting https://"; $("obProfState").classList.add("warn"); return; } if (v) { saveProfile({ professor: v }); AA.toast("Professor saved"); } show(at + 1); } });
      return;
    }
    if (id === "connect") {
      T("Connect your professor");
      body.innerHTML = "<p><b>Recommended.</b> With the connector, your professor can send a plan straight to your Ascent page, where you apply it with one tap, and read your course without opening links.</p><div id=\"obConn\"></div>";
      foot({ back: true, skip: true, next: "Next" });
      paintConnect();
      return;
    }
    if (id === "tests") {
      T("How the tests work");
      body.innerHTML = RULES + '<p class="ob-small">You\'ll see these again before every test, with a way back before the clock starts.</p>';
      foot({ back: true, skip: false, next: "Next" });
      return;
    }
    if (id === "go") {
      T("Your first chat, then your first climb");
      const prof = isHttp(p.professor); const canMsg = prof && AA.contextMessage && AA.professorLink;
      const L = canMsg ? AA.professorLink(p.professor, AA.contextMessage()) : null;
      body.innerHTML = '<div class="ob-go">' +
        '<div><b>1. Talk to your professor</b><p>Your first chat is a short intake that ends with your personal plan, waiting on the Ascent page.</p>' +
        (L ? '<a class="ob-btn primary" href="' + esc(L.href) + '" target="_blank" rel="noopener" id="obTalk">Talk to my professor</a>' : prof ? '<a class="ob-btn primary" href="ascent.html">Open the Ascent page to talk to it</a>' : '<a class="ob-btn" href="professor.html" target="_blank" rel="noopener">Set up my professor first</a>') + "</div>" +
        '<div><b>2. Start the clock and open Orientation</b><p>Camp 1 is about three hours of video. Press ■ in the corner when you stop.</p><button class="ob-btn" type="button" id="obGo">Start a session at camp 1</button></div></div>';
      const t = $("obTalk"); if (t && L && !L.prefill) t.addEventListener("click", () => AA.copyText(AA.contextMessage()));
      $("obGo").addEventListener("click", () => { if (!AA.tracker()) AA.startSession("Orientation"); close(false); if (ASCENT) { location.hash = "m00"; const r = document.querySelector('.mod[data-key="m00"]'); if (r) r.scrollIntoView({ block: "center" }); } else location.href = "ascent.html#m00"; });
      foot({ back: true, skip: false, next: "Finish", onNext: () => { close(false); AA.toast("You're set up. Enjoy the climb"); } });
      return;
    }
  }
  async function paintConnect() {
    const el = $("obConn"); if (!el) return; const c = AA.cloud || {};
    if (!c.professorKey) { el.innerHTML = '<p class="ob-small">You can do this later on <a href="profile.html" target="_blank" rel="noopener">My profile</a>.</p>'; return; }
    const k = await c.professorKey();
    if (k && k.error) { el.innerHTML = '<p class="ob-small">The connector isn\'t available right now (' + esc(k.error) + "). You can do this later on My profile.</p>"; return; }
    if (!k) { el.innerHTML = '<button class="ob-btn primary" type="button" id="obMake">Make my connector link</button>';
      $("obMake").addEventListener("click", async () => { $("obMake").disabled = true; const { error } = await c.makeProfessorKey(); if (error) { AA.toast("Couldn't make the link: " + error.message); $("obMake").disabled = false; return; } keyCache.at = 0; paintConnect(); }); return; }
    const url = c.connectorUrl(k.key);
    el.innerHTML = '<label class="ob-url"><span class="ob-small">Your connector link (keep it private)</span><input type="text" id="obUrl" readonly value="' + esc(url) + '"></label>' +
      '<div class="ob-row"><button class="ob-btn primary" type="button" id="obCopy">Copy link</button><a class="ob-btn" href="https://claude.ai" target="_blank" rel="noopener">Open Claude</a></div>' +
      '<ol class="ob-steps">' + CONNECT_STEPS.map(x => "<li>" + x + "</li>").join("") + "</ol>";
    $("obUrl").addEventListener("focus", e => e.target.select());
    $("obCopy").addEventListener("click", async () => { const okc = await AA.copyText(url); AA.toast(okc ? "Connector link copied" : "Copy was blocked; select the link and copy it"); });
  }

  /* ───────── First steps: the checklist on the Ascent page ───────── */
  const ITEMS = [
    { k: "profile", t: "Fill in your profile", d: "Name, start date and end goal", a: () => '<button class="linkish" type="button" data-step="1">Fill it in</button>' },
    { k: "professor", t: "Set up your professor", d: "Your own AI tutor, about five minutes", a: () => '<button class="linkish" type="button" data-step="2">Set it up</button>' },
    { k: "connector", t: "Connect your professor", d: "Plans arrive here for one-tap apply", a: () => '<button class="linkish" type="button" data-step="3">Connect</button>' },
    { k: "plan", t: "First chat: get your personal plan", d: "Your professor's intake", a: () => '<button class="linkish" type="button" data-talk="1">Talk to my professor</button>' },
    { k: "session", t: "Put your first session on the clock", d: "Press ▶︎ when you sit down to study", a: () => '<button class="linkish" type="button" data-clock="1">Start the clock</button>' },
    { k: "test", t: "Pass your first test", d: "Orientation, camp 1", a: () => '<a href="#m00">Go to camp 1</a>' }];
  async function paintList() {
    const el = document.getElementById("obList"); if (!el) return;
    if (!signedIn() || !synced() || own().checklistHidden) { el.hidden = true; return; }
    const s = await state(); const done = ITEMS.filter(x => s[x.k]).length;
    if (done === ITEMS.length) { el.hidden = true; if (!own().checklistHidden) { saveProfile({ checklistHidden: true }); AA.toast("First steps done. You're well on your way"); } return; }
    el.hidden = false;
    el.innerHTML = '<div class="card-h"><h2>First steps</h2><span class="ob-done">' + done + " of " + ITEMS.length + ' done</span></div><div class="ob-bar" aria-hidden="true"><i style="width:' + Math.round(done / ITEMS.length * 100) + '%"></i></div>' +
      '<ol class="ob-list">' + ITEMS.map(x => '<li class="' + (s[x.k] ? "ok" : "") + '"><span class="ob-tick" aria-hidden="true"></span><div><b>' + esc(x.t) + "</b><span>" + esc(x.d) + "</span></div>" + (s[x.k] ? '<span class="ob-state">Done</span>' : x.a()) + "</li>").join("") + "</ol>" +
      '<div class="ob-list-f"><button class="linkish" type="button" id="obReopen">Open the guided set-up</button><a href="how.html">How the Ascent works</a><button class="linkish" type="button" id="obHide">Hide this list</button></div>';
    el.querySelectorAll("[data-step]").forEach(b => b.addEventListener("click", () => open(Number(b.dataset.step))));
    el.querySelectorAll("[data-talk]").forEach(b => b.addEventListener("click", () => { const h = document.getElementById("hdrProfGo"); if (h && !document.getElementById("hdrProf").hidden) h.click(); else open(5); }));
    el.querySelectorAll("[data-clock]").forEach(b => b.addEventListener("click", () => { if (AA.startSession("Study session")) AA.toast("Session started: press ■ in the corner when you stop"); setTimeout(paintList, 300); }));
    $("obReopen").addEventListener("click", () => open(0));
    $("obHide").addEventListener("click", () => { saveProfile({ checklistHidden: true }); el.hidden = true; AA.toast("Hidden. Open the guided set-up any time from My profile."); });
  }

  /* ───────── One welcome email for a new climber (sent by the server, once; retried on a later visit if it couldn't go) ───────── */
  let welcoming = false;
  async function maybeWelcome() {
    const c = AA.cloud || {}; const p = own(); if (welcoming || !signedIn() || !synced() || p.welcomed || !c.invoke) return;
    const s = await state(); if (s.profile && s.professor && s.plan) return;
    welcoming = true;
    try { const { data, error } = await c.invoke("welcome", { name: own().name || "" }); if (!error && data && (data.sent || data.already)) saveProfile({ welcomed: new Date().toISOString().slice(0, 10) }); }
    catch (e) { /* try again next time */ } finally { welcoming = false; }
  }

  /* ───────── When to show what ───────── */
  async function maybeStart() {
    paintList();
    if (!signedIn() || !synced()) return;
    if (own().onboarded) { maybeWelcome(); return; }
    const s = await state();
    /* Someone who is already set up (profile, professor and a plan) isn't new: note it and don't interrupt. */
    if (s.profile && s.professor && s.plan) { saveProfile({ onboarded: new Date().toISOString().slice(0, 10) }); return; }
    if (box && !box.hidden) return;
    open(0);
  }
  window.addEventListener("aa:pulled", maybeStart);
  window.addEventListener("aa:auth", () => { if (!signedIn() && box && !box.hidden) { box.hidden = true; document.body.style.overflow = ""; } paintList(); });
  ["aa:progress", "aa:sessions", "aa:synced"].forEach(ev => window.addEventListener(ev, () => { clearTimeout(paintList.t); paintList.t = setTimeout(paintList, 250); }));
  AA.openSetup = open;
  if (synced()) maybeStart();
})();
