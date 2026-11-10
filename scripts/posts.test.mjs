import assert from "node:assert/strict";
import test from "node:test";
import { allStrings, countWords, fillTokens, isExternal, linksIn, mapStrings, parseInline, plainText, readingMinutes, tokensIn } from "../lib/post-text.ts";

test("parseInline delar upp text, länkar och fetstil i ordning", () => {
  assert.deepEqual(parseInline("Se [prisguiden](/prisguide) och **läs avtalet** först."), [
    { kind: "text", text: "Se " },
    { kind: "link", text: "prisguiden", href: "/prisguide" },
    { kind: "text", text: " och " },
    { kind: "strong", text: "läs avtalet" },
    { kind: "text", text: " först." },
  ]);
});

test("parseInline lämnar vanlig text orörd, även med parenteser och hakar", () => {
  assert.deepEqual(parseInline("NKI (0 till 100) och [inte en länk]."), [{ kind: "text", text: "NKI (0 till 100) och [inte en länk]." }]);
});

test("plainText tar bort märkningen men behåller orden", () => {
  assert.equal(plainText("Enligt [Bokföringsnämnden](https://www.bfn.se/x) gäller **K3** från 2026."), "Enligt Bokföringsnämnden gäller K3 från 2026.");
});

test("linksIn hittar alla adresser och isExternal skiljer ut de som går ut från sajten", () => {
  const links = linksIn("[a](/kunskap/k3-brf) [b](https://www.bfn.se/x) [c](#kallor)");
  assert.deepEqual(links, ["/kunskap/k3-brf", "https://www.bfn.se/x", "#kallor"]);
  assert.deepEqual(links.map(isExternal), [false, true, false]);
});

test("fillTokens fyller i värden och vägrar okända nycklar", () => {
  assert.equal(fillTokens("{{tek.priced}} av {{tek.total}} anger pris.", { "tek.priced": 0, "tek.total": 8 }), "0 av 8 anger pris.");
  assert.deepEqual(tokensIn("{{a}} och {{b.c}}"), ["a", "b.c"]);
  assert.throws(() => fillTokens("{{saknas}}", {}), /Okänd nyckel/);
});

test("countWords räknar ord utan märkning, och lästiden är minst en minut", () => {
  assert.equal(countWords("Se [hela prisguiden](/prisguide) nu"), 4);
  assert.equal(readingMinutes(40), 1);
  assert.equal(readingMinutes(900), 5);
});

test("mapStrings och allStrings går igenom hela strukturen", () => {
  const v = { a: "x", b: ["y", { c: "z", n: 3 }] };
  assert.deepEqual(mapStrings(v, (s) => s.toUpperCase()), { a: "X", b: ["Y", { c: "Z", n: 3 }] });
  assert.deepEqual(allStrings(v), ["x", "y", "z"]);
});

test("datakontrollen känner till samma nycklar som artiklarna får använda", async () => {
  const fs = await import("node:fs");
  const { POST_FACT_KEYS } = await import("../lib/post-text.ts");
  const src = fs.readFileSync(new URL("./validate-data.mjs", import.meta.url), "utf8");
  const list = JSON.parse(/const POST_TOKENS = (\[[^\]]+\]);/.exec(src)[1]);
  assert.deepEqual(list, [...POST_FACT_KEYS]);
});
