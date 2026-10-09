import { deliver, startCheckout } from "./inbox.mjs";

const hits = new Map();

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 6_000_000) {
        reject(new Error("too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function limited(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "local").split(",")[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((time) => now - time < 10 * 60 * 1000);
  if (recent.length >= 8) return true;
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

function originFrom(req) {
  const host = req.headers.host || "127.0.0.1:8080";
  const proto = req.headers["x-forwarded-proto"] || (String(host).startsWith("127.") || String(host).includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function attachForms(server) {
  server.middlewares.use(async (req, res, next) => {
    const url = (req.url || "").split("?")[0];
    if (url !== "/api/forms" && url !== "/api/checkout") return next();
    if (req.method !== "POST") {
      res.statusCode = 405;
      res.end();
      return;
    }
    try {
      if (limited(req)) {
        res.statusCode = 429;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ ok: false }));
        return;
      }
      const payload = JSON.parse((await readBody(req)).toString("utf8") || "{}");
      const result = url === "/api/checkout" ? await startCheckout(payload, originFrom(req)) : await deliver(payload);
      res.statusCode = result.ok ? 200 : 502;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: !!result.ok, url: result.url || "" }));
    } catch {
      res.statusCode = 400;
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify({ ok: false }));
    }
  });
}
