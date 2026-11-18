// Offline tests: BAGSPAY_MOCK=1 (set by npm test) answers from sample data.
import assert from "node:assert/strict";
import { test } from "node:test";
import { claimable, claimTxs, token } from "../src/bags.mjs";
import { fmtSol, isAddress, toSol } from "../src/format.mjs";

const WALLET = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM";
const MINT = "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU";

test("formatting", () => {
  assert.equal(toSol("1500000000"), 1.5);
  assert.equal(fmtSol(1.5), "1.500 SOL");
  assert.ok(isAddress(WALLET));
  assert.ok(!isAddress("0xabc"));
});

test("token lifetime fees and creators", async () => {
  const t = await token(MINT);
  assert.equal(t.lifetimeFeesSol, 12.5);
  assert.equal(t.creators.length, 1);
});

test("claimable positions for a wallet", async () => {
  const c = await claimable(WALLET);
  assert.equal(c.positions.length, 1);
  assert.equal(c.totalSol, 1.5);
});

test("claim returns unsigned transactions", async () => {
  const r = await claimTxs(WALLET, MINT);
  assert.equal(r.txs.length, 1);
});

test("rejects bad addresses", async () => {
  await assert.rejects(claimable("not-an-address"), /Solana address/);
});
