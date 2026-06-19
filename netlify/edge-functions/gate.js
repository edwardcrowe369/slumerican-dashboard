// Netlify Edge Function: password-gate the dashboard ONLY.
// Protects "/" and "/index.html". Leaves review.html, artboard.html,
// and all /.netlify/functions/* OPEN so share links keep working.
//
// Setup:
//   1. Put this file at:  netlify/edge-functions/gate.js
//   2. In Netlify > Site configuration > Environment variables, add:
//        DASH_PASSWORD = (whatever password you want)
//   3. Redeploy. Visiting the dashboard now asks for the password.
//
// Notes: shared password (not per-user). Cookie lasts 24h. The password
// is never stored or compared in plaintext (SHA-256). To change it, just
// update DASH_PASSWORD and redeploy.

function getPassword() {
  try { if (globalThis.Netlify && Netlify.env) return Netlify.env.get("DASH_PASSWORD"); } catch (e) {}
  try { return Deno.env.get("DASH_PASSWORD"); } catch (e) {}
  return undefined;
}

async function sha256hex(s) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(String(s)));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function page(message, status) {
  const note = message
    ? '<p class="err">' + message + "</p>"
    : '<p class="sub">Enter the password to open the dashboard.</p>';
  const html =
    '<!doctype html><html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">' +
    "<title>Locked</title><style>" +
    "*{box-sizing:border-box}html,body{margin:0;height:100%}" +
    "body{background:#0a0a0a;color:#f6f6f4;font-family:'Helvetica Neue',Arial,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px}" +
    ".box{width:100%;max-width:360px;text-align:center}" +
    ".lock{width:46px;height:46px;border:1px solid rgba(255,255,255,.25);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 18px}" +
    "h1{font-size:18px;letter-spacing:3px;text-transform:uppercase;margin:0 0 6px}" +
    ".sub{color:#8a8a86;font-size:13px;margin:0 0 22px}" +
    ".err{color:#e7553f;font-size:13px;margin:0 0 22px}" +
    "input{width:100%;background:#141414;border:1px solid rgba(255,255,255,.14);border-radius:6px;padding:13px 14px;color:#f6f6f4;font-size:14px;outline:none;text-align:center}" +
    "input:focus{border-color:#5c5c5a}" +
    "button{width:100%;margin-top:12px;background:#f4f4f2;color:#0b0b0b;border:none;border-radius:6px;padding:13px;font-size:14px;font-weight:700;letter-spacing:.5px;cursor:pointer}" +
    "button:hover{background:#fff}" +
    "</style></head><body><div class='box'>" +
    "<div class='lock'><svg width='20' height='20' viewBox='0 0 24 24' fill='none' stroke='#cfcfcc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg></div>" +
    "<h1>Content Dashboard</h1>" + note +
    "<form method='POST' action=''>" +
    "<input type='password' name='password' placeholder='Password' autofocus autocomplete='current-password'>" +
    "<button type='submit'>Unlock</button>" +
    "</form></div></body></html>";
  return new Response(html, { status: status || 401, headers: { "content-type": "text/html; charset=utf-8" } });
}

export default async function handler(request, context) {
  const pw = getPassword();
  if (!pw) {
    // Fail closed: never serve the dashboard if no password is configured.
    return page("Not configured yet \u2014 the owner must set DASH_PASSWORD in Netlify.", 503);
  }
  const expected = await sha256hex(pw);

  // Already authenticated?
  const cookie = request.headers.get("cookie") || "";
  const m = cookie.match(/(?:^|;\s*)dash_auth=([a-f0-9]{64})/);
  if (m && m[1] === expected) {
    return context.next(); // serve the real dashboard
  }

  // Handle a login attempt
  if (request.method === "POST") {
    let tried = "";
    try {
      const form = await request.formData();
      tried = form.get("password") || "";
    } catch (e) {}
    if (tried && (await sha256hex(tried)) === expected) {
      const headers = new Headers();
      headers.set(
        "set-cookie",
        "dash_auth=" + expected + "; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=86400"
      );
      headers.set("location", new URL(request.url).pathname);
      return new Response(null, { status: 303, headers });
    }
    return page("Wrong password. Try again.", 401);
  }

  return page("", 401);
}

// Gate ONLY the dashboard. review.html, artboard.html, and functions stay open.
export const config = { path: ["/", "/index.html"] };
