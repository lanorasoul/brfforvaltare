import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { overviewRows } from "../lib/overview.ts";
import { matchProviders, matchQuery, parseMatch } from "../lib/match.ts";

const dir = path.resolve(import.meta.dirname, "..", "data", "providers");
const providers = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")))
  .sort((a, b) => a.name.localeCompare(b.name, "sv"));
const ov = overviewRows(providers);
const rows = providers.map((p, i) => ({
  ...ov[i],
  coverage: { ekonomisk: p.ekonomisk?.coverage ?? null, teknisk: p.teknisk?.coverage ?? null },
  digital: p.ekonomisk?.digital.length ?? 0,
  places: p.facts.offices?.places ?? [],
}));
const run = (o) => matchProviders(rows, { need: "ekonomisk", ort: "", lgh: 50, priorities: [], ...o });

test("Utan önskemål står alla med rätt förvaltning i namnordning", () => {
  const r = run({});
  const names = r.matches.map((m) => m.row.name);
  assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "sv")));
  assert.equal(r.matches.length, providers.filter((p) => p.services.ekonomisk === "yes").length);
});

test("Teknisk förvaltning tar bort de som bara har ekonomisk", () => {
  const r = run({ need: "teknisk" });
  assert.ok(r.wrongService.includes("ERF"));
  assert.ok(r.wrongService.includes("Simpleko"));
});

test("En ort som förvaltaren inte nämner döljer regionala förvaltare", () => {
  const r = run({ ort: "Kiruna" });
  assert.ok(r.otherPlaces.includes("Fastighetsägarna Service"));
  assert.ok(r.matches.some((m) => m.row.slug === "riksbyggen"));
});

test("Lågt pris sätter den billigaste publicerade prislistan först", () => {
  const r = run({ priorities: ["pris"] });
  assert.equal(r.matches[0].row.slug, "erf");
  assert.match(r.matches[0].reasons[0], /37 375 kr per år för 50 lägenheter/);
});

test("Nöjda kunder sätter högst NKI först och skriver ut snittet", () => {
  const r = run({ priorities: ["nojda"] });
  assert.equal(r.matches[0].row.slug, "simpleko");
  assert.match(r.matches[0].reasons[0], /NKI 78/);
});

test("Kontor nära oss hittar orten i förvaltarens kontor", () => {
  const r = run({ ort: "Östersund", priorities: ["lokalt"] });
  assert.equal(r.matches[0].row.slug, "simpleko");
  assert.equal(r.matches[0].reasons[0], "Finns i Östersund");
});

test("Svaren går fram och tillbaka via adressen", () => {
  const input = { need: "bada", ort: "Malmö", lgh: 42, priorities: ["pris", "nojda"] };
  const back = parseMatch(Object.fromEntries(new URLSearchParams(matchQuery(input))));
  assert.deepEqual({ ...back, asked: undefined }, { ...input, asked: undefined });
  assert.equal(parseMatch({}).asked, false);
  assert.deepEqual(parseMatch({ behov: "ekonomisk", vill: "pris,okand" }).priorities, ["pris"]);
});
