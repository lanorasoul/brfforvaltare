import test from "node:test";
import assert from "node:assert/strict";
import { issueToken, signingSecret, TOKEN_MAX_AGE_MS, verifyToken } from "../lib/token.ts";

const now = Date.UTC(2026, 10, 6, 12, 0, 0);
const secret = "hemlig-nyckel-for-test";

test("En tidsstämpel som servern har signerat godtas och ger tillbaka tiden", () => {
  const tok = issueToken(now - 5000, secret);
  assert.deepEqual(verifyToken(tok, now, secret), { kind: "ok", t: now - 5000 });
});

test("En förfalskad tid, fel nyckel eller trasig text godtas inte", () => {
  const tok = issueToken(now - 5000, secret);
  const [, sig] = tok.split(".");
  assert.equal(verifyToken(`${now - 60_000}.${sig}`, now, secret).kind, "bad");
  assert.equal(verifyToken(tok, now, "annan-nyckel").kind, "bad");
  for (const t of [undefined, null, 123, "", "abc", "1.2", `${now}.`, `${now}.${"x".repeat(300)}`, { t: now }]) {
    assert.equal(verifyToken(t, now, secret).kind, "bad", String(t));
  }
});

test("En tid i framtiden godtas inte, en för gammal tid ber om omladdning", () => {
  assert.equal(verifyToken(issueToken(now + 120_000, secret), now, secret).kind, "bad");
  assert.equal(verifyToken(issueToken(now - TOKEN_MAX_AGE_MS - 1, secret), now, secret).kind, "stale");
  assert.equal(verifyToken(issueToken(now - TOKEN_MAX_AGE_MS + 1000, secret), now, secret).kind, "ok");
});

test("Nyckeln tas i första hand från en egen variabel, sedan från mejltjänstens nyckel", () => {
  assert.equal(signingSecret({ REQUEST_SIGNING_SECRET: "a", RESEND_API_KEY: "b" }), "a");
  assert.equal(signingSecret({ RESEND_API_KEY: "b" }), "b");
  assert.ok(signingSecret({}).length > 10);
});
