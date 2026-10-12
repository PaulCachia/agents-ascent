// The Agent's Ascent — welcome email. The site calls this once, after a new climber's first sign-in, with their own
// sign-in token. It checks the token with Supabase Auth, claims the climber's one welcome (supabase/welcome.sql),
// and sends the email through Brevo's transactional API.
//
// Deploy with JWT verification OFF (the code checks the token itself, and the browser's CORS preflight carries none).
// Needs one secret: BREVO_API_KEY (Brevo → SMTP & API → API keys). Without it the function sends nothing.

const BASE = "https://ijznfijgzqgedwprulfb.supabase.co";
const PUBLIC_KEY = "sb_publishable_jQRHdKBORCh8RmEKmNnWyg_1f9et7W4";
const SITE = "https://paulcachia.github.io/agents-ascent/";
const FROM = { name: "The Agent's Ascent", email: "no-reply@ascent.unconventionalists.com" };
const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

const json = (o: unknown, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

function text(name: string) {
  return `Hi ${name || "there"},

You're signed in to The Agent's Ascent: 24 camps up one mountain, from novice to shipping your own AI product.

Three things worth knowing before you start:

1. Set up your professor first. It's your own AI tutor (a Claude Project). In your first chat it asks about your goal, your time and what you already know, then builds your personal programme.
   Set it up: ${SITE}professor.html

2. Plans arrive on your Ascent page. Your professor sends them and one tap applies them. Connect it on My profile so they arrive by themselves.

3. The tests. Practise as often as you like. The real test is 8 questions and 70% passes the camp. If you don't pass, a retake opens 24 hours later; after two attempts it's 72 hours and a session with your professor.

Open the Ascent: ${SITE}ascent.html
How it all works: ${SITE}how.html

See you on the mountain.

You're getting this because you signed in to The Agent's Ascent. It's the only welcome email: there are no newsletters.`;
}

function html(name: string) {
  const p = (s: string) => `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#1b2340">${s}</p>`;
  const item = (n: string, title: string, body: string) =>
    `<tr><td style="vertical-align:top;padding:0 12px 14px 0;font:800 18px/1.3 Arial,sans-serif;color:#d97f1f">${n}</td><td style="vertical-align:top;padding:0 0 14px;font:15px/1.55 Arial,sans-serif;color:#1b2340"><b>${title}</b><br>${body}</td></tr>`;
  const btn = (href: string, label: string, primary: boolean) =>
    `<a href="${href}" style="display:inline-block;margin:0 8px 8px 0;padding:11px 18px;border-radius:10px;text-decoration:none;font:700 15px Arial,sans-serif;${primary ? "background:#f0a04b;color:#1b1206" : "border:1px solid #c9d2e3;color:#1b2340"}">${label}</a>`;
  return `<!doctype html><html><body style="margin:0;padding:24px 12px;background:#f2f4f8;font-family:Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:28px">
<tr><td>
<p style="margin:0 0 6px;font:800 13px Arial,sans-serif;color:#d97f1f">THE AGENT'S ASCENT</p>
<h1 style="margin:0 0 16px;font:800 26px/1.2 Arial,sans-serif;color:#1b2340">Welcome to the climb${name ? ", " + esc(name) : ""}</h1>
${p("You're signed in: 24 camps up one mountain, from novice to shipping your own AI product. Three things worth knowing before you start.")}
<table role="presentation" cellspacing="0" cellpadding="0">
${item("1", "Set up your professor first", `It's your own AI tutor (a Claude Project). In your first chat it asks about your goal, your time and what you already know, then builds your personal programme. <a href="${SITE}professor.html" style="color:#d97f1f">Set it up</a>.`)}
${item("2", "Plans arrive on your Ascent page", "Your professor sends them and one tap applies them. Connect it on My profile so they arrive by themselves.")}
${item("3", "The tests", "Practise as often as you like. The real test is 8 questions and 70% passes the camp. If you don't pass, a retake opens 24 hours later; after two attempts it's 72 hours and a session with your professor.")}
</table>
<div style="margin:6px 0 10px">${btn(SITE + "ascent.html", "Open the Ascent", true)}${btn(SITE + "how.html", "How it all works", false)}</div>
${p("See you on the mountain.")}
<p style="margin:18px 0 0;font-size:12px;line-height:1.5;color:#6b7590">You're getting this because you signed in to The Agent's Ascent. It's the only welcome email: there are no newsletters.</p>
</td></tr></table></td></tr></table></body></html>`;
}

async function asUser(path: string, auth: string, init: RequestInit = {}) {
  const r = await fetch(BASE + path, { ...init, headers: { apikey: PUBLIC_KEY, Authorization: auth, "Content-Type": "application/json", ...(init.headers || {}) } });
  const t = await r.text(); let body: any = t; try { body = t ? JSON.parse(t) : null; } catch (_e) { /* text */ }
  return { ok: r.ok, status: r.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ sent: false, reason: "method" }, 405);
  const apiKey = Deno.env.get("BREVO_API_KEY");
  if (!apiKey) return json({ sent: false, reason: "not_configured" });
  const auth = req.headers.get("Authorization") || "";
  if (!/^Bearer\s+\S+/.test(auth)) return json({ sent: false, reason: "sign_in" }, 401);

  const who = await asUser("/auth/v1/user", auth);
  const email = who.ok && who.body && who.body.email;
  if (!email) return json({ sent: false, reason: "sign_in" }, 401);

  const claim = await asUser("/rest/v1/rpc/claim_welcome", auth, { method: "POST", body: "{}" });
  if (!claim.ok) return json({ sent: false, reason: "claim_failed" }, 500);
  if (claim.body !== true) return json({ sent: false, already: true });

  let name = "";
  try { const b = await req.json(); name = String((b && b.name) || "").trim().slice(0, 40); } catch (_e) { /* no body */ }
  const r = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ sender: FROM, to: [name ? { email, name } : { email }], subject: "Welcome to The Agent's Ascent", htmlContent: html(name), textContent: text(name), tags: ["welcome"] }),
  });
  if (!r.ok) {
    await asUser("/rest/v1/rpc/release_welcome", auth, { method: "POST", body: "{}" });
    return json({ sent: false, reason: "brevo_" + r.status, detail: (await r.text()).slice(0, 300) }, 502);
  }
  return json({ sent: true });
});
