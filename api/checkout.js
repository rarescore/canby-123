import { startCheckout } from "../server/inbox.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }
  const proto = req.headers["x-forwarded-proto"] || "https";
  const origin = `${proto}://${req.headers.host}`;
  const result = await startCheckout(req.body || {}, origin);
  res.status(result.ok ? 200 : 502).json({ ok: !!result.ok, url: result.url || "" });
}
