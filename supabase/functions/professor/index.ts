// The Agent's Ascent — professor connector: a small MCP server (Streamable HTTP, stateless) on Supabase Edge
// Functions. Add it to Claude as a custom connector; the link carries the climber's professor key (?key=…), made
// on My profile. With it the professor can read that one climber's course and progress and send them a plan.
// A sent plan waits on the climber's Ascent page until they apply it; nothing here changes their course directly.
//
// Deploy with JWT verification OFF (Claude doesn't send a Supabase token). The only credential in this file is the
// public publishable key; what a key holder may do is enforced in the database (supabase/professor.sql).

const API = "https://ijznfijgzqgedwprulfb.supabase.co/rest/v1/";
const PUBLIC_KEY = "sb_publishable_jQRHdKBORCh8RmEKmNnWyg_1f9et7W4";
const SITE = "https://paulcachia.github.io/agents-ascent/";
const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const DEPTHS = ["core", "expanded", "lightened", "skip"];

type Json = any;

async function rest(path: string, init: Json = {}): Promise<Json> {
  const r = await fetch(API + path, { ...init, headers: { apikey: PUBLIC_KEY, "Content-Type": "application/json", Accept: "application/json", ...(init.headers || {}) } });
  const text = await r.text();
  let body: Json = text; try { body = text ? JSON.parse(text) : null; } catch (_e) { /* keep text */ }
  if (!r.ok) throw new Error((body && body.message) || text || r.statusText);
  return body;
}
const rpc = (fn: string, args: Json) => rest("rpc/" + fn, { method: "POST", body: JSON.stringify(args) });

/* The course's camps and the ids of their resources and exercises, cached for ten minutes. */
let courseCache: Json = null, courseAt = 0;
async function course(): Promise<Json> {
  if (courseCache && Date.now() - courseAt < 600000) return courseCache;
  const [meta, camps] = await Promise.all([rest("course_meta?select=version&id=eq.1"), rest("course_camps?select=key,title,core,items,exercises&order=pos")]);
  const map: Json = {};
  for (const c of camps) map[c.key] = { title: c.title, core: c.core, items: (c.items || []).map((i: Json) => ({ id: i.id, title: i.title })), exercises: (c.exercises || []).map((e: Json) => e.id) };
  courseCache = { version: meta && meta[0] ? meta[0].version : null, camps: map, keys: camps.map((c: Json) => c.key) }; courseAt = Date.now();
  return courseCache;
}

/* ───────── The same checks the Ascent page runs before a plan can be applied ───────── */
const arr = (x: Json) => (Array.isArray(x) ? x : []);
const str = (x: Json, n: number) => (x == null ? "" : String(x)).trim().slice(0, n);
const httpUrl = (u: Json) => (/^https?:\/\/[^\s"'<>]+$/i.test(String(u || "").trim()) ? String(u).trim().slice(0, 500) : "");
const dropId = (x: Json) => (typeof x === "string" ? x : x && x.id) || "";

function checkPlan(obj: Json, c: Json) {
  const errs: string[] = [];
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { ok: false, errs: ["The plan must be one JSON object."], plan: null };
  const pl: Json = { version: Number(obj.version) || 3, checkpoint: str(obj.checkpoint, 80), summary: str(obj.summary, 600), updatedAt: str(obj.updatedAt, 30) || new Date().toISOString().slice(0, 10), modules: {} };
  if (Array.isArray(obj.weeks)) pl.weeks = obj.weeks.slice(0, 26).map((w: Json) => str(w, 300));
  const mods = obj.modules && typeof obj.modules === "object" && !Array.isArray(obj.modules) ? obj.modules : {};
  const item = (x: Json, k: string, ids: string[] | null | undefined) => {
    const e: Json = { title: str(x.title, 140) }; const u = httpUrl(x.url);
    if (u) e.url = u; else if (x.url) errs.push((k ? k + ": " : "") + "\"" + str(x.title || x.url, 60) + "\" needs a full https:// link");
    for (const f of ["len", "why", "creator"]) { const v = str(x[f], f === "why" ? 300 : 80); if (v) e[f] = v; }
    const r = str(x.replaces, 60);
    if (r && ids !== undefined) { e.replaces = r; if (ids && !ids.includes(r)) errs.push(k + ": replaces " + r + ", which isn't a resource of this camp"); }
    if (!e.title) e.title = e.url || ""; return e;
  };
  for (const k of Object.keys(mods)) {
    const camp = c.camps[k]; const d = mods[k] && typeof mods[k] === "object" ? mods[k] : {};
    if (!camp) { errs.push("Unknown camp " + k + " (camps are m00 to m23)"); continue; }
    const depth = d.depth || "core";
    if (!DEPTHS.includes(depth)) { errs.push(k + ": depth must be core, expanded, lightened or skip"); continue; }
    if (depth === "skip" && camp.core) errs.push(camp.title + " is on the essential spine and can't be skipped (lighten it instead)");
    for (const f of ["drop", "extra", "exercises"]) if (d[f] != null && !Array.isArray(d[f])) errs.push(k + ": " + f + " must be a list");
    const itemIds = camp.items.map((i: Json) => i.id), exIds = camp.exercises;
    const out: Json = { depth }; const note = str(d.note, 400); if (note) out.note = note;
    const extra = arr(d.extra).slice(0, 8).filter((x: Json) => x && typeof x === "object").map((x: Json) => item(x, k, itemIds)).filter((e: Json) => e.title);
    const drop: Json[] = [];
    for (const x of arr(d.drop).slice(0, 20)) {
      const id = str(dropId(x), 60); if (!id || drop.some(y => y.id === id)) continue;
      if (!itemIds.includes(id)) { errs.push(k + ": can't drop " + id + "; it isn't a resource of this camp"); continue; }
      const why = x && typeof x === "object" ? str(x.why, 200) : ""; drop.push(why ? { id, why } : { id });
    }
    for (const e of extra) if (e.replaces && !drop.some(y => y.id === e.replaces) && itemIds.includes(e.replaces)) drop.push({ id: e.replaces, why: "replaced by " + e.title });
    const exs = arr(d.exercises).slice(0, 6).filter((x: Json) => x && typeof x === "object" && str(x.text, 1000)).map((x: Json) => {
      const e: Json = { text: str(x.text, 1000) }; const r = str(x.replaces, 40);
      if (r) { e.replaces = r; if (!exIds.includes(r)) errs.push(k + ": replaces exercise " + r + ", which isn't one of this camp's"); }
      return e; });
    if (camp.core && camp.items.length && camp.items.every((i: Json) => drop.some(y => y.id === i.id)) && !extra.length) errs.push(camp.title + " is on the spine: keep at least one of its resources or add a replacement");
    if (extra.length) out.extra = extra; if (drop.length) out.drop = drop; if (exs.length) out.exercises = exs;
    const ready = str(d.ready, 400); if (ready) out.ready = ready;
    pl.modules[k] = out;
  }
  if (obj.sideCamps != null && !Array.isArray(obj.sideCamps)) errs.push("sideCamps must be a list");
  const side: Json[] = [];
  arr(obj.sideCamps).slice(0, 12).forEach((s: Json, i: number) => {
    if (!s || typeof s !== "object") return; const id = str(s.id, 30).toLowerCase(); const where = "Side camp " + (id || "#" + (i + 1));
    if (!/^[a-z0-9][a-z0-9-]{0,29}$/.test(id)) { errs.push(where + ": id must be short, lowercase letters, numbers and dashes"); return; }
    if (side.some(x => x.id === id)) { errs.push(where + ": id used twice"); return; }
    if (!c.camps[s.after]) { errs.push(where + ": after must be a camp key, m00 to m23"); return; }
    const t = str(s.title, 120); if (!t) { errs.push(where + ": needs a title"); return; }
    const o: Json = { id, after: s.after, title: t }; const h = Number(s.hours); if (s.hours != null && isFinite(h) && h > 0 && h <= 60) o.hours = Math.round(h * 2) / 2;
    const note = str(s.note, 400); if (note) o.note = note; const ex = str(s.exercise, 1000); if (ex) o.exercise = ex;
    const items = arr(s.items).slice(0, 8).filter((x: Json) => x && typeof x === "object").map((x: Json) => item(x, "", undefined)).filter((e: Json) => e.title); if (items.length) o.items = items;
    side.push(o);
  });
  if (side.length) pl.sideCamps = side;
  return { ok: !errs.length, errs, plan: pl };
}

function changes(pl: Json, c: Json): string[] {
  const out: string[] = [];
  for (const k of c.keys) {
    const d = pl.modules[k]; if (!d) continue; const camp = c.camps[k]; const bits: string[] = [];
    const title = (id: string) => (camp.items.find((i: Json) => i.id === id) || { title: id }).title;
    if (d.depth !== "core") bits.push(d.depth);
    if (d.note) bits.push(d.note);
    if (arr(d.extra).length) bits.push("+ " + d.extra.map((x: Json) => x.title).join(", "));
    if (arr(d.drop).length) bits.push("− " + d.drop.map((x: Json) => title(x.id)).join(", "));
    if (arr(d.exercises).length) bits.push(d.exercises.length + " new exercise" + (d.exercises.length > 1 ? "s" : ""));
    if (d.ready) bits.push("ready check: " + d.ready);
    if (bits.length) out.push(camp.title + ": " + bits.join("; "));
  }
  for (const s of arr(pl.sideCamps)) out.push("Side camp after " + (c.camps[s.after] ? c.camps[s.after].title : s.after) + ": " + s.title + (s.hours ? " (~" + s.hours + " h)" : ""));
  if (Array.isArray(pl.weeks) && pl.weeks.some(Boolean)) out.push("Week-by-week text replaced for " + pl.weeks.filter(Boolean).length + " weeks");
  return out;
}

/* ───────── Tools ───────── */
const TOOLS = [
  { name: "read_course", title: "Read the student's course",
    description: "The student's course as Markdown: the shared course with their plan applied. Every resource and exercise has an id (e.g. m05.uv-docs, m05.ex1) that plans use. ★ PROFESSOR marks what a professor added; ~~struck~~ is dropped for this student. Pass camp (e.g. \"m05\" or \"m05,m06\") for just those camps; leave it out for the whole course (about 50 KB).",
    inputSchema: { type: "object", properties: { camp: { type: "string", description: "Optional: a camp key like m05, or several separated by commas." } } },
    annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: "read_progress", title: "Read the student's progress",
    description: "Everything about the student in one call: profile and end goal, current week, every camp's status and test score, recent check-ins, study-clock totals, every test attempt with the topics missed, the plan in force (JSON) with how many plans came before it, and the status of plans you sent.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true, openWorldHint: false } },
  { name: "propose_plan", title: "Send the student a plan",
    description: "Send a plan (format: section 5 of your brief). It is checked against the course first: unknown ids, a spine camp skipped or emptied, and links that aren't full https:// links are refused with reasons, so fix and send again. A plan replaces the plan in force, so carry forward any earlier changes that should stay. Nothing changes until the student taps Apply on their Ascent page. Use dry_run: true to check without sending.",
    inputSchema: { type: "object", required: ["plan"], properties: {
      plan: { type: "object", description: "The plan JSON: version, checkpoint, summary, modules{campKey:{depth, note, drop[], extra[], exercises[], ready}}, sideCamps[], weeks[]." },
      message: { type: "string", description: "One or two sentences for the student, shown with the plan on their Ascent page." },
      dry_run: { type: "boolean", description: "true = check only, don't send." } } },
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false } }
];

function weekOf(start: string): number { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(start || ""); const s = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : Date.UTC(2026, 9, 8); return Math.max(1, Math.floor((Date.now() - s) / 864e5 / 7) + 1); }

async function readProgress(uid: string, key: string): Promise<Json> {
  const [rows, attempts, sent] = await Promise.all([
    rest("progress?user_id=eq." + uid + "&select=kind,key,data,updated_at&order=updated_at.desc"),
    rest("quiz_attempts?user_id=eq." + uid + "&select=module,qset,attempt,score,missed,seconds,created_at&order=created_at.desc&limit=60"),
    rpc("professor_proposals", { p_key: key })
  ]);
  const by = (k: string) => rows.filter((r: Json) => r.kind === k);
  const profile = (by("profile").find((r: Json) => r.key === "me") || { data: {} }).data;
  const plans = by("plan"); const current = plans.find((r: Json) => r.key === "current");
  const sessions = by("session").map((r: Json) => r.data);
  const mins = (since: number) => sessions.filter((s: Json) => (s.start || 0) >= since).reduce((a: number, s: Json) => a + (Number(s.mins) || 0), 0);
  const camps: Json = {}; for (const r of by("module")) camps[r.key] = r.data;
  return {
    student: { name: profile.name || null, start: profile.start || null, week: weekOf(profile.start), goal: profile.goal || null },
    camps,
    checkins: by("checkin").map((r: Json) => r.data).sort((a: Json, b: Json) => (b.created || 0) - (a.created || 0)).slice(0, 8),
    study_clock: { sessions: sessions.length, hours_total: Math.round(mins(0) / 6) / 10, hours_last_7_days: Math.round(mins(Date.now() - 7 * 864e5) / 6) / 10 },
    test_attempts: attempts,
    plan_in_force: current ? current.data : null,
    earlier_plans: plans.filter((r: Json) => /^h\d+$/.test(r.key)).length,
    plans_you_sent: sent
  };
}

function text(t: string, isError = false) { return { content: [{ type: "text", text: t }], isError }; }

async function callTool(name: string, args: Json, key: string): Promise<Json> {
  if (!TOOLS.some(t => t.name === name)) return text("Unknown tool " + name, true);
  if (!key) return text("This connector link has no professor key. The student makes one on My profile (" + SITE + "profile.html) and adds that link as the connector.", true);
  const who = await rpc("professor_whoami", { p_key: key });
  if (!who || !who.user_id) return text("This connector link isn't valid any more (the student may have made a new one). Ask them for the new link from My profile and re-add the connector.", true);
  const uid = who.user_id;
  if (name === "read_course") {
    const camp = str(args && args.camp, 60).replace(/[^a-z0-9,]/gi, "");
    const md = await rest("rpc/course_md?uid=" + uid + (camp ? "&camp=" + encodeURIComponent(camp) : ""));
    return text(typeof md === "string" ? md : JSON.stringify(md));
  }
  if (name === "read_progress") return text(JSON.stringify(await readProgress(uid, key), null, 1));
  // propose_plan
  const c = await course();
  let plan = args && args.plan; if (typeof plan === "string") { try { plan = JSON.parse(plan); } catch (_e) { return text("plan must be a JSON object (it arrived as text that isn't valid JSON).", true); } }
  const r = checkPlan(plan, c);
  if (!r.ok) return text("Not sent. The plan was refused for these reasons; fix them and send again:\n- " + r.errs.join("\n- "), true);
  const list = changes(r.plan, c); const summary = list.length ? list.map(x => "- " + x).join("\n") : "- No camp changes.";
  if (args && args.dry_run) return text("The plan passes the checks (not sent). It would change:\n" + summary);
  const sent = await rpc("professor_propose", { p_key: key, p_plan: r.plan, p_message: str(args && args.message, 1000) || null });
  return text("Sent to " + (who.name || "the student") + " (plan #" + sent.id + "). It is waiting on their Ascent page, " + SITE + "ascent.html, for them to apply; any earlier plan you sent that they hadn't applied is replaced by this one. It will change:\n" + summary + "\nTell them it's there; read_progress shows when they apply it.");
}

/* ───────── MCP over HTTP (JSON responses, no sessions) ───────── */
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, content-type, accept, mcp-protocol-version, mcp-session-id", "Access-Control-Allow-Methods": "POST, GET, OPTIONS" };
const json = (body: Json, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...CORS } });

async function handleMessage(m: Json, key: string): Promise<Json | null> {
  const isRequest = m && typeof m === "object" && "method" in m && "id" in m && m.id !== null;
  if (!isRequest) return null; // notifications and responses get no reply
  const reply = (result: Json) => ({ jsonrpc: "2.0", id: m.id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id: m.id, error: { code, message } });
  try {
    switch (m.method) {
      case "initialize": {
        const asked = m.params && m.params.protocolVersion;
        return reply({ protocolVersion: VERSIONS.includes(asked) ? asked : VERSIONS[0], capabilities: { tools: { listChanged: false } },
          serverInfo: { name: "agents-ascent-professor", title: "The Agent's Ascent — professor", version: "1.0.0" },
          instructions: "You are this student's professor on The Agent's Ascent. read_progress and read_course show where they are; propose_plan sends them a plan, which they apply with one tap on their Ascent page. Follow the professor brief in your project instructions." });
      }
      case "ping": return reply({});
      case "tools/list": return reply({ tools: TOOLS });
      case "tools/call": {
        const p = m.params || {};
        try { return reply(await callTool(p.name, p.arguments || {}, key)); }
        catch (e) { return reply(text("That didn't work: " + ((e as Error).message || String(e)), true)); }
      }
      case "resources/list": return reply({ resources: [] });
      case "prompts/list": return reply({ prompts: [] });
      default: return fail(-32601, "Method not found: " + m.method);
    }
  } catch (e) { return fail(-32603, (e as Error).message || "Internal error"); }
}

export async function handle(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response("The Agent's Ascent professor connector. Add this address to Claude as a custom connector.", { status: 405, headers: { Allow: "POST", "Content-Type": "text/plain", ...CORS } });
  const url = new URL(req.url);
  const auth = req.headers.get("authorization") || "";
  const key = (url.searchParams.get("key") || (/^Bearer\s+(aap_[a-f0-9]+)$/i.exec(auth) || [])[1] || "").trim();
  let body: Json;
  try { body = await req.json(); } catch (_e) { return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } }, 400); }
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map(m => handleMessage(m, key)))).filter(Boolean);
    return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
  }
  const out = await handleMessage(body, key);
  return out ? json(out) : new Response(null, { status: 202, headers: CORS });
}

// @ts-ignore: Deno global exists on Supabase Edge Functions
if (typeof Deno !== "undefined" && Deno.serve) Deno.serve(handle);
