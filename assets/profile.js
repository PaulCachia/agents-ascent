/* The Agent's Ascent — My profile page: climber details, the photo cropper, and the climber preview. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const ROBOT = '<svg viewBox="-12 -48 24 24"><circle class="bot-body" cx="0" cy="-36" r="9"/><circle class="bot-eye" cx="-3.5" cy="-37" r="1.8"/><circle class="bot-eye" cx="3.5" cy="-37" r="1.8"/></svg>';
  function hasPhoto(p) { return !!(p.photo && /^data:image\//.test(p.photo)); }
  function mode() { const c = AA.cloud || {}; if (!c.configured) return "local"; if (!c.ready) return "pending"; if (!c.enabled) return "offline"; return c.user ? "edit" : "view"; }

  let busy = false;
  function paint() {
    const p = AA.own.profile(); busy = true;
    [["meName", p.name || ""], ["meStart", p.start || AA.DEFAULT_START], ["meGoal", p.goal || ""], ["meProf", p.professor || ""]].forEach(([id, v]) => { const el = $(id); if (document.activeElement !== el) el.value = v; });
    $("mePublic").checked = p.public !== false; busy = false;
    const prev = $("mePhotoPrev"); prev.innerHTML = hasPhoto(p) ? '<img src="' + p.photo + '" alt="">' : ROBOT; $("mePhotoClear").hidden = !hasPhoto(p);
    const img = $("botFaceImg"); if (hasPhoto(p)) img.setAttribute("href", p.photo); $("botFace").toggleAttribute("hidden", !hasPhoto(p)); $("botRobot").toggleAttribute("hidden", hasPhoto(p));
    const m = mode();
    $("meState").textContent = m === "edit" ? (p.name ? "signed in as " + p.name : "signed in · fill this in") : m === "pending" ? "checking your sign-in…" : m === "local" ? "local only" : "not signed in";
    const bar = $("authBar"), txt = $("authText"), btn = $("authBtn");
    bar.hidden = m === "edit" || m === "local" || m === "pending"; btn.hidden = m !== "view";
    if (m === "view") txt.innerHTML = "<b>Sign in to edit your profile.</b> The same sign-in starts your climb if you are new.";
    else if (m === "offline") txt.textContent = "The sync library didn't load; changes stay on this device until you reload with a connection.";
    const ro = m === "view"; document.querySelectorAll("#meForm input").forEach(el => { el.disabled = ro; }); $("mePhotoClear").disabled = ro;
  }
  $("authBtn").addEventListener("click", () => { if (AA.cloud && AA.cloud.openPanel) AA.cloud.openPanel(); });

  let t = null;
  const save = () => { if (busy || !AA.requireSignIn("edit your profile")) return; AA.setProfile(Object.assign({}, AA.own.profile(), { name: $("meName").value.trim(), start: $("meStart").value || AA.DEFAULT_START, goal: $("meGoal").value.trim(), professor: $("meProf").value.trim(), public: $("mePublic").checked })); paint(); };
  ["meName", "meGoal", "meProf"].forEach(id => $(id).addEventListener("input", () => { clearTimeout(t); t = setTimeout(save, 500); }));
  $("meStart").addEventListener("change", save); $("mePublic").addEventListener("change", save);
  $("meForm").addEventListener("submit", e => e.preventDefault());
  window.addEventListener("aa:synced", e => { if (e.detail && e.detail.kind === "profile") AA.toast(e.detail.ok ? "Profile saved to your database" : "Profile not saved: " + e.detail.message); });

  /* Photo: framed by the climber (drag + zoom), shrunk to ~112 px, stored as a small JPEG data URL on the profile row. */
  $("mePhoto").addEventListener("change", () => { const f = $("mePhoto").files && $("mePhoto").files[0]; if (!f) return; if (!AA.requireSignIn("add a photo")) { $("mePhoto").value = ""; return; }
    const rd = new FileReader(); rd.onload = () => { const im = new Image(); im.onload = () => openCropper(im); im.onerror = () => AA.toast("Couldn't read that image"); im.src = rd.result; }; rd.readAsDataURL(f); $("mePhoto").value = ""; });
  const CR = { im: null, base: 1, zoom: 1, x: 0, y: 0, drag: null, size: 280 };
  const cropEl = $("crop"), stage = $("cropStage"), cimg = $("cropImg"), czoom = $("cropZoom");
  function cropScale() { return CR.base * CR.zoom; }
  function cropClamp() { const S = cropScale(), w = CR.im.width * S, h = CR.im.height * S, st = CR.size; CR.x = Math.min(0, Math.max(st - w, CR.x)); CR.y = Math.min(0, Math.max(st - h, CR.y)); }
  function cropPaint() { cropClamp(); cimg.style.transform = "translate(" + CR.x + "px," + CR.y + "px) scale(" + cropScale() + ")"; }
  function fit(w) { CR.size = w; CR.base = Math.max(w / CR.im.width, w / CR.im.height); CR.x = (w - CR.im.width * CR.base) / 2; CR.y = (w - CR.im.height * CR.base) / 2; cropPaint(); }
  function openCropper(im) { CR.im = im; CR.zoom = 1; czoom.value = 100; cimg.src = im.src; cimg.style.width = im.width + "px"; cimg.style.height = im.height + "px";
    cropEl.hidden = false; document.body.style.overflow = "hidden"; fit(stage.getBoundingClientRect().width || 280);
    requestAnimationFrame(() => { const w = stage.getBoundingClientRect().width; if (w && Math.abs(w - CR.size) > 1) fit(w); }); }
  function closeCropper() { cropEl.hidden = true; document.body.style.overflow = ""; CR.im = null; cimg.removeAttribute("src"); }
  czoom.addEventListener("input", () => { if (!CR.im) return; const z = Number(czoom.value) / 100; const S0 = cropScale(); const cx = CR.size / 2, cy = CR.size / 2; CR.zoom = z; const S1 = cropScale(); CR.x = cx - (cx - CR.x) * S1 / S0; CR.y = cy - (cy - CR.y) * S1 / S0; cropPaint(); });
  stage.addEventListener("pointerdown", e => { if (!CR.im) return; CR.drag = { px: e.clientX, py: e.clientY, x: CR.x, y: CR.y }; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", e => { if (!CR.drag) return; CR.x = CR.drag.x + (e.clientX - CR.drag.px); CR.y = CR.drag.y + (e.clientY - CR.drag.py); cropPaint(); });
  ["pointerup", "pointercancel"].forEach(ev => stage.addEventListener(ev, () => { CR.drag = null; }));
  stage.addEventListener("wheel", e => { e.preventDefault(); czoom.value = Math.max(100, Math.min(400, Number(czoom.value) - Math.sign(e.deltaY) * 8)); czoom.dispatchEvent(new Event("input")); }, { passive: false });
  $("cropCancel").addEventListener("click", closeCropper); $("cropCancel2").addEventListener("click", closeCropper);
  window.addEventListener("keydown", e => { if (e.key === "Escape" && !cropEl.hidden) closeCropper(); });
  $("cropOk").addEventListener("click", () => { if (!CR.im) return; const S = cropScale(); const sx = -CR.x / S, sy = -CR.y / S, sw = CR.size / S; let size = 112, q = 0.82, out = "";
    for (let tries = 0; tries < 4; tries++) { const c = document.createElement("canvas"); c.width = c.height = size; c.getContext("2d").drawImage(CR.im, sx, sy, sw, sw, 0, 0, size, size); out = c.toDataURL("image/jpeg", q); if (out.length <= 16000) break; q -= 0.18; if (q < 0.4) { q = 0.6; size = 88; } }
    if (out.length > 16000) { AA.toast("That photo won't shrink enough; try a simpler one."); return; }
    AA.setProfile(Object.assign({}, AA.own.profile(), { photo: out })); closeCropper(); paint(); AA.toast("Photo saved: your climber has a new head"); });
  $("mePhotoClear").addEventListener("click", () => { if (!AA.requireSignIn("remove the photo")) return; const p = AA.own.profile(); delete p.photo; AA.setProfile(p); paint(); });

  window.addEventListener("aa:auth", paint); window.addEventListener("aa:progress", paint); paint();
})();
