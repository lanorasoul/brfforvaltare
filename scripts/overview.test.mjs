import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { overviewRows, sortRows } from "../lib/overview.ts";

const dir = path.resolve(import.meta.dirname, "..", "data", "providers");
const all = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));

test("Varje förvaltare får en rad med länkade källor", () => {
  const rows = overviewRows(all);
  assert.equal(rows.length, all.length);
  for (const r of rows) {
    for (const f of [r.founded, r.clients, r.offices, r.employees, ...r.terms, ...r.ratings]) if (f) assert.match(f.url, /^https:\/\//);
  }
});

test("NKI tar det senaste mätåret och har branschsnittet för samma år", () => {
  const rows = overviewRows(all);
  for (const r of rows.filter((x) => x.nki)) {
    assert.ok(r.nki.average !== null, r.slug);
    assert.equal(r.nki.average, { 2024: 66, 2025: 68 }[r.nki.year]);
  }
});

test("HSB är en förvaltare", () => {
  assert.equal(all.filter((p) => p.slug.startsWith("hsb")).length, 1);
});

test("sortRows: saknade värden hamnar sist i namnordning", () => {
  const rows = [
    { name: "Ö", v: null },
    { name: "B", v: 2 },
    { name: "A", v: null },
    { name: "C", v: 5 },
    { name: "D", v: 5 },
  ];
  assert.deepEqual(sortRows(rows, (r) => r.v, "desc").map((r) => r.name), ["C", "D", "B", "A", "Ö"]);
  assert.deepEqual(sortRows(rows, (r) => r.v, "asc").map((r) => r.name), ["B", "C", "D", "A", "Ö"]);
});
