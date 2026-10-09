import { deliver } from "../server/inbox.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }
  const result = await deliver(req.body || {});
  res.status(result.ok ? 200 : 502).json({ ok: !!result.ok });
}
