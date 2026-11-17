// Shared by index.html and thanks.html. CHECKOUT, CONTACT_EMAIL, SIGNUP_URL and PROD_HOST are set inline on each page.

// "?v=12" (video QR) or "?v=12d" (video description) -> "v12" / "v12d"; anything else -> "site"
function videoCode(search) {
  const v = new URLSearchParams(search).get("v");
  return v && /^[a-z0-9]{1,12}$/.test(v) ? "v" + v : "site";
}

// Hotmart's sales-origin dashboard shows sck: <video code>|<button position>|<offer>
// (Hotmart rules: at most 30 characters, no "_", "|" as separator)
function checkoutHref(offer, pos, code) {
  const base = CHECKOUT[offer];
  return base + (base.includes("?") ? "&" : "?") + "sck=" + code + "|" + pos + "|" + offer;
}

// Analytics must never break buying or signing up: a blocked or broken Clarity is ignored.
function track(...args) {
  try { if (typeof window.clarity === "function") window.clarity(...args); } catch (e) {}
}

function setBuyLinks(code) {
  document.querySelectorAll("a[data-offer]").forEach(a => { a.href = checkoutHref(a.dataset.offer, a.dataset.pos, code); });
  document.querySelectorAll("a.mail").forEach(a => { a.href = "mailto:" + CONTACT_EMAIL; a.textContent = CONTACT_EMAIL; });
  document.addEventListener("click", e => {
    const buy = e.target.closest("a[data-offer]");
    if (buy) { track("event", "buy"); track("event", "buy-" + buy.dataset.offer + "-" + buy.dataset.pos); }
    const tracked = e.target.closest("[data-track]");
    if (tracked) track("event", tracked.dataset.track);
  });
}

function validEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s) && s.length <= 254;
}

function thanksUrl(code) {
  return "thanks.html" + (code === "site" ? "" : "?v=" + code.slice(1));
}

// Posts to MailerLite's form endpoint (it allows cross-origin requests). Resolves true/false, never throws,
// and gives up after 8 seconds so a slow network can't keep someone from their download.
async function subscribe(email) {
  const body = new FormData();
  body.append("fields[email]", email);
  body.append("ml-submit", "1");
  body.append("anticsrf", "true");
  const ctrl = new AbortController(), timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const r = await fetch(SIGNUP_URL, { method: "POST", body, signal: ctrl.signal });
    const ok = r.ok && (await r.json()).success === true;
    if (!ok) track("event", "signup-failed");
    return ok;
  } catch (e) {
    track("event", "signup-failed");
    return false;
  } finally {
    clearTimeout(timer);
  }
}
