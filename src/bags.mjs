// Client for the Bags public API. Reads fees and positions, and asks for unsigned claim transactions.
// BAGSPAY_MOCK=1 answers from fixed sample data (tests only).
import { isAddress, toSol } from "./format.mjs";

const BASE = (process.env.BAGS_API_URL || "https://public-api-v2.bags.fm/api/v1").replace(/\/$/, "");
const KEY = process.env.BAGS_API_KEY || "";
export const MOCK = process.env.BAGSPAY_MOCK === "1";

async function call(path, { method = "GET", body } = {}) {
  if (MOCK) return mock(path, body);
  if (!KEY) throw Object.assign(new Error("BAGS_API_KEY is not set on the server"), { status: 500 });
  const res = await fetch(BASE + path, {
    method,
    signal: AbortSignal.timeout(15000),
    headers: { "x-api-key": KEY, ...(body ? { "content-type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok || j.success === false) throw Object.assign(new Error(j.error || j.response || `Bags API returned ${res.status}`), { status: res.status === 429 ? 429 : 502 });
  return j.response ?? j;
}

const need = (v, what) => { if (!isAddress(v)) throw Object.assign(new Error(`${what} must be a Solana address`), { status: 400 }); };

/** token(mint) → creators and lifetime fees */
export async function token(mint) {
  need(mint, "Token mint");
  const [fees, creators] = await Promise.all([
    call(`/token-launch/lifetime-fees?tokenMint=${mint}`),
    call(`/token-launch/creator/v3?tokenMint=${mint}`).catch(() => []),
  ]);
  return { mint, lifetimeFeesSol: toSol(fees), creators: Array.isArray(creators) ? creators : [] };
}

/** claimable(wallet) → positions with fees ready to claim */
export async function claimable(wallet) {
  need(wallet, "Wallet");
  const rows = await call(`/token-launch/claimable-positions?wallet=${wallet}`);
  const positions = (Array.isArray(rows) ? rows : [])
    .map((p) => ({ tokenMint: p.baseMint || p.tokenMint, claimableSol: toSol(p.totalClaimableLamportsUserShare ?? p.claimableLamports ?? 0) }))
    .filter((p) => p.tokenMint);
  return { wallet, totalSol: positions.reduce((s, p) => s + p.claimableSol, 0), positions };
}

/** claimTxs(wallet, tokenMint) → unsigned base64 transactions the wallet signs */
export async function claimTxs(wallet, tokenMint) {
  need(wallet, "Wallet");
  need(tokenMint, "Token mint");
  const r = await call(`/token-launch/claim-txs/v2`, { method: "POST", body: { feeClaimer: wallet, tokenMint } });
  const txs = (Array.isArray(r) ? r : []).map((t) => t.tx || t.transaction || t).filter((t) => typeof t === "string");
  return { wallet, tokenMint, txs };
}

// ---------- sample data for tests ----------
const SAMPLE_MINT = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";
function mock(path) {
  if (path.startsWith("/token-launch/lifetime-fees")) return "12500000000";
  if (path.startsWith("/token-launch/creator")) return [{ username: "creator", wallet: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM", royaltyBps: 10000, isCreator: true }];
  if (path.startsWith("/token-launch/claimable-positions")) return [{ baseMint: SAMPLE_MINT, totalClaimableLamportsUserShare: 1500000000 }];
  if (path.startsWith("/token-launch/claim-txs")) return [{ tx: Buffer.from("sample-claim").toString("base64") }];
  throw new Error("unknown sample path " + path);
}
