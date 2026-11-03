import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { interpolate, priceRow, priceRows, niceMax } from "../lib/price.ts";

const dir = path.join(import.meta.dirname, "..", "data", "providers");
// Priset gäller ekonomisk förvaltning, så testerna får förvaltarens prisblock i den form som lib/price.ts tar emot.
const load = (slug) => {
  const d = JSON.parse(fs.readFileSync(path.join(dir, `${slug}.json`), "utf8"));
  return { slug: d.slug, name: d.name, pricing: d.ekonomisk.pricing };
};
const erf = load("erf");
const sbc = load("sbc");
const fastum = load("fastum");

test("ERF: stämmer med förvaltarens eget exempel (35 lägenheter = 28 469 kr)", () => {
  assert.equal(Math.round(interpolate(erf.pricing.anchors, 35)), 28469);
});

test("ERF: publicerade gränser ger exakta värden", () => {
  for (const a of erf.pricing.anchors) assert.equal(Math.round(interpolate(erf.pricing.anchors, a.lgh)), a.perYear);
});

test("ERF: pris per lägenhet matchar tabellens intervall", () => {
  // Tabellen anger 1 362 till 3 156 kr per lägenhet för 3 till 10 lägenheter och rundar ned.
  assert.equal(priceRow(erf, 3).perLgh, 3156);
  assert.equal(priceRow(erf, 10).perLgh, 1362);
  assert.equal(priceRow(erf, 50).perLgh, 747); // tabellen anger 747 till 959 för 21 till 50
  assert.equal(priceRow(erf, 21).perLgh, 959);
});

test("ERF: publicerade storlekar är verifierade, mellanliggande uppskattade", () => {
  const exact = priceRow(erf, 50);
  assert.equal(exact.status, "verified");
  assert.equal(exact.perYear, 37375);
  const mid = priceRow(erf, 35);
  assert.equal(mid.status, "estimated");
  assert.equal(Math.round(mid.perYear), 28469);
});

test("ERF: över 100 lägenheter ger från-pris", () => {
  const r = priceRow(erf, 120);
  assert.equal(r.kind, "from");
  assert.equal(r.perYear, 67063);
});

test("SBC: exakta exempel är verifierade, mellanvärden uppskattade", () => {
  assert.equal(priceRow(sbc, 50).status, "verified");
  assert.equal(priceRow(sbc, 50).perYear, 55000);
  const mid = priceRow(sbc, 35);
  assert.equal(mid.status, "estimated");
  assert.equal(Math.round(mid.perYear), 40500);
});

test("SBC: under 20 lägenheter visas från-pris, över 100 inget pris", () => {
  assert.equal(priceRow(sbc, 10).kind, "from");
  assert.equal(priceRow(sbc, 10).perYear, 22000);
  assert.equal(priceRow(sbc, 120).kind, "none");
});

test("Fastum: tumregel är ett antagande eftersom perioden saknas", () => {
  const r = priceRow(fastum, 50);
  assert.equal(r.status, "assumed");
  assert.equal(r.perYear, 50000);
});

test("Förvaltare utan pris sorteras sist, efter namn", () => {
  const all = ["erf", "sbc", "riksbyggen", "hsb-skane", "fastum", "nabo", "simpleko"].map(load);
  const rows = priceRows(all, 50);
  assert.deepEqual(rows.slice(0, 3).map((r) => r.slug), ["erf", "fastum", "sbc"]);
  assert.ok(rows.slice(3).every((r) => r.perYear === null));
  assert.deepEqual(rows.slice(3).map((r) => r.name), ["HSB Skåne", "Nabo", "Riksbyggen", "Simpleko"]);
});

test("niceMax", () => {
  assert.equal(niceMax(37375), 40000);
  assert.equal(niceMax(59400), 60000);
  assert.equal(niceMax(70000), 80000);
  assert.equal(niceMax(18000), 20000);
  assert.equal(niceMax(1100), 1200);
});
