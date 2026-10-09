const INBOX = "office@canbycc.org";
const MAX_FILE = 3_500_000;
const ALLOWED = new Set(["image/jpeg", "image/png", "application/pdf"]);

export function sanitize(value) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .trim()
    .slice(0, 4000);
}

function fieldsOf(payload) {
  const fields = payload?.fields && typeof payload.fields === "object" ? payload.fields : {};
  const lines = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === "company" || key === "website") continue;
    const label = sanitize(key).slice(0, 80);
    const text = sanitize(value);
    if (!label || !text) continue;
    lines.push(`${label}: ${text}`);
  }
  return lines;
}

export function messageFrom(payload) {
  const subject = sanitize(payload.subject).slice(0, 140) || "Website message";
  const page = sanitize(payload.page).slice(0, 200);
  const lines = [
    "Canby Community Clinic website form",
    `Page: ${page || "/"}`,
    "",
    ...fieldsOf(payload),
    "",
    "This email is the clinic's copy of a website form.",
    "It is not a medical record. Please do not reply with private health details.",
  ];
  return { subject: `Canby Clinic — ${subject}`, text: lines.join("\n") };
}

async function sendResend({ subject, text, reply }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Canby Clinic <onboarding@resend.dev>",
      to: [INBOX],
      reply_to: reply || undefined,
      subject,
      text,
    }),
  });
  return res.ok;
}

async function sendForm({ subject, text, reply, file }) {
  const form = new FormData();
  form.set("_subject", subject);
  form.set("_template", "box");
  form.set("_captcha", "false");
  if (reply) form.set("_replyto", reply);
  form.set("message", text);
  if (file) form.set("attachment", new Blob([file.bytes], { type: file.type }), file.name);
  const res = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(INBOX)}`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  return res.ok && (data.success === true || data.success === "true");
}

export async function deliver(payload) {
  if (sanitize(payload?.company) || sanitize(payload?.fields?.company)) return { ok: true };
  const { subject, text } = messageFrom(payload);
  const reply = sanitize(payload.fields?.Email || payload.fields?.email || "");
  let file = null;
  if (payload.file?.data && payload.file?.name) {
    const type = sanitize(payload.file.type);
    if (!ALLOWED.has(type)) return { ok: false };
    const bytes = Buffer.from(String(payload.file.data), "base64");
    if (!bytes.length || bytes.length > MAX_FILE) return { ok: false };
    file = { bytes, type, name: sanitize(payload.file.name).slice(0, 120) || "upload" };
  }
  const ok = process.env.RESEND_API_KEY
    ? await sendResend({ subject, text, reply })
    : await sendForm({ subject, text, reply, file });
  return { ok };
}

export async function startCheckout(payload, origin) {
  const amount = Number(payload.amount);
  const method = sanitize(payload.method);
  const name = sanitize(payload.name);
  const email = sanitize(payload.email);
  const cadence = sanitize(payload.cadence) || "One time";
  if (!["Apple Pay", "PayPal", "Stripe", "Check"].includes(method)) return { ok: false };
  if (!Number.isFinite(amount) || amount < 1 || amount > 100000) return { ok: false };
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false };
  const mailed = await deliver({
    subject: method === "Check" ? "Check donation" : "Donation checkout",
    page: "/give/",
    fields: {
      "Full name": name,
      Email: email,
      Amount: `$${amount.toFixed(2)} USD`,
      Cadence: cadence,
      Method: method,
    },
  });
  if (!mailed.ok) return { ok: false };
  if (method === "Check") return { ok: true };
  const url = await paymentUrl({ amount, method, email, origin });
  return url ? { ok: true, url } : { ok: false };
}

async function paymentUrl({ amount, method, email, origin }) {
  const cents = String(Math.round(amount * 100));
  if ((method === "Stripe" || method === "Apple Pay") && process.env.STRIPE_SECRET_KEY) {
    const body = new URLSearchParams({
      mode: "payment",
      success_url: `${origin}/give/?gift=received`,
      cancel_url: `${origin}/give/`,
      customer_email: email,
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][unit_amount]": cents,
      "line_items[0][price_data][product_data][name]": "Gift to Canby Community Clinic",
      "payment_method_types[0]": "card",
    });
    if (method === "Apple Pay") body.set("payment_method_types[0]", "card");
    const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) return data.url;
  }
  const paypal = new URL("https://www.paypal.com/donate");
  paypal.searchParams.set("business", INBOX);
  paypal.searchParams.set("currency_code", "USD");
  paypal.searchParams.set("amount", amount.toFixed(2));
  paypal.searchParams.set("item_name", `Canby Community Clinic — ${method}`);
  return paypal.toString();
}
