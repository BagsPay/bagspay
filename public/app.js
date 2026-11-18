// BagsPay dashboard: read claimable fees for a wallet, look up tokens, claim with the connected wallet.
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const short = (a) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "–");
const sol = (x) => `${x >= 1 ? x.toFixed(3) : x.toPrecision(3)} SOL`;
const wallet = () => window.phantom?.solana || window.solflare || window.backpack || window.solana || null;
let connected = null;

async function api(path, opts = {}) {
  const res = await fetch(`/api${path}`, { method: opts.body ? "POST" : "GET", headers: opts.body ? { "content-type": "application/json" } : {}, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error || `Request failed (${res.status})`);
  return j;
}
function toast(msg) { const t = $("#toast"); t.textContent = msg; t.hidden = false; setTimeout(() => (t.hidden = true), 3500); }

async function load(address) {
  $("#positions").innerHTML = "Loading…";
  try {
    const r = await api(`/wallet/${encodeURIComponent(address)}/claimable`);
    $("#total").textContent = sol(r.totalSol);
    $("#count").textContent = r.positions.length;
    $("#who").textContent = short(address);
    $("#positions").className = "";
    $("#positions").innerHTML = r.positions.length
      ? r.positions.map((p) => `<div class="pos"><span class="mono">${esc(short(p.tokenMint))}</span><b>${sol(p.claimableSol)}</b><button class="btn sm solid" data-claim="${esc(p.tokenMint)}" type="button">Claim</button></div>`).join("")
      : `<div class="empty">Nothing to claim right now.</div>`;
    document.querySelectorAll("[data-claim]").forEach((b) => (b.onclick = () => claim(address, b.dataset.claim)));
  } catch (e) { $("#positions").innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}

async function claim(address, tokenMint) {
  const w = wallet();
  if (!w || connected !== address) return toast("Connect this wallet to claim.");
  try {
    const { txs } = await api(`/wallet/${encodeURIComponent(address)}/claim`, { body: { tokenMint } });
    for (const b64 of txs) {
      const tx = window.solanaWeb3.VersionedTransaction.deserialize(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
      await w.signAndSendTransaction(tx);
    }
    toast("Claim sent");
    load(address);
  } catch (e) { toast(e.message || "Claim failed"); }
}

$("#connect").onclick = async () => {
  const w = wallet();
  if (!w) return toast("Install Phantom, Solflare or Backpack.");
  const r = await w.connect();
  connected = String(r?.publicKey || w.publicKey);
  $("#connect").textContent = short(connected);
  $("#walletInput").value = connected;
  load(connected);
};
$("#walletForm").onsubmit = (e) => { e.preventDefault(); const a = $("#walletInput").value.trim(); if (a) load(a); };
$("#tokenForm").onsubmit = async (e) => {
  e.preventDefault();
  const m = $("#tokenInput").value.trim(); if (!m) return;
  $("#tokenOut").innerHTML = "Loading…";
  try {
    const t = await api(`/token/${encodeURIComponent(m)}`);
    $("#tokenOut").innerHTML = `<div class="pos"><span>Lifetime fees</span><b>${sol(t.lifetimeFeesSol)}</b></div>` +
      t.creators.map((c) => `<div class="pos"><span>${esc(c.username || c.providerUsername || "creator")}</span><span class="mono">${esc(short(c.wallet))}</span><span class="muted">${((c.royaltyBps || 0) / 100).toFixed(0)}% share</span></div>`).join("");
  } catch (err) { $("#tokenOut").innerHTML = `<div class="empty">${esc(err.message)}</div>`; }
};
