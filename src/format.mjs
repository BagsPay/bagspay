// Lamports, SOL and USD formatting.
export const LAMPORTS = 1_000_000_000;
export const toSol = (lamports) => Number(BigInt(String(lamports ?? 0))) / LAMPORTS;
export const fmtSol = (sol) => `${sol >= 1 ? sol.toFixed(3) : sol.toPrecision(3)} SOL`;
export const fmtUsd = (usd) => (usd == null ? "–" : usd >= 1e6 ? `$${(usd / 1e6).toFixed(2)}M` : usd >= 1e3 ? `$${(usd / 1e3).toFixed(1)}K` : `$${usd.toFixed(2)}`);
export const isAddress = (s) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(String(s || ""));
