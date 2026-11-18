// BagsPay server: static dashboard plus a small JSON API over the Bags public API.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { claimable, claimTxs, MOCK, token } from "./src/bags.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".svg": "image/svg+xml", ".png": "image/png" };
const send = (res, status, body) => { res.writeHead(status, { "content-type": "application/json", "cache-control": "no-store" }); res.end(JSON.stringify(body)); };
const readBody = (req) => new Promise((ok) => {
  let s = "";
  req.on("data", (c) => { s += c; if (s.length > 1e5) req.destroy(); });
  req.on("end", () => { try { ok(JSON.parse(s || "{}")); } catch { ok({}); } });
});

export async function handler(req, res) {
  const p = new URL(req.url, "http://x").pathname;
  try {
    if (p === "/api/health") return send(res, 200, { ok: true, mock: MOCK, keyConfigured: !!process.env.BAGS_API_KEY });
    let m;
    if ((m = p.match(/^\/api\/token\/([^/]+)$/))) return send(res, 200, await token(m[1]));
    if ((m = p.match(/^\/api\/wallet\/([^/]+)\/claimable$/))) return send(res, 200, await claimable(m[1]));
    if ((m = p.match(/^\/api\/wallet\/([^/]+)\/claim$/)) && req.method === "POST") return send(res, 200, await claimTxs(m[1], (await readBody(req)).tokenMint));
    if (p.startsWith("/api/")) return send(res, 404, { error: "Not found" });
    const file = path.join(ROOT, p === "/" ? "index.html" : path.normalize(p));
    if (!file.startsWith(ROOT)) return send(res, 403, { error: "Forbidden" });
    const data = await readFile(file).catch(() => null);
    if (!data) return send(res, 404, { error: "Not found" });
    res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" });
    res.end(data);
  } catch (e) {
    send(res, e.status || 500, { error: e.message || "Server error" });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8787);
  createServer(handler).listen(port, process.env.PORT ? "0.0.0.0" : "127.0.0.1", () => console.log(`BagsPay on http://127.0.0.1:${port}`));
}
