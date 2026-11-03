import test from "node:test";
import assert from "node:assert/strict";
import { fold, matchPlace, placeOptions, splitByPlace } from "../lib/coverage.ts";

const national = { scope: "national", places: [] };
const malmo = { scope: "regional", places: ["Malmö", "Lund", "Helsingborg"] };
const unknown = { scope: "unknown", places: [] };
const sthlm = { scope: "regional", places: ["Stockholm", "Södertälje"] };

test("fold tar bort versaler, å, ä, ö och extra mellanslag", () => {
  assert.equal(fold("Göteborg"), "goteborg");
  assert.equal(fold("  Malmö  "), "malmo");
  assert.equal(fold("Älvsjö  gård"), "alvsjo gard");
});

test("Hela landet matchar alltid", () => {
  assert.equal(matchPlace(national, "Kiruna"), "national");
  assert.equal(matchPlace(national, ""), "national");
});

test("En nämnd ort matchar oavsett stavning av å, ä, ö och versaler", () => {
  assert.equal(matchPlace(malmo, "malmo"), "listed");
  assert.equal(matchPlace(malmo, "MALMÖ"), "listed");
  assert.equal(matchPlace(sthlm, "sodertalje"), "listed");
});

test("Början på ett ortnamn räcker från tre bokstäver", () => {
  assert.equal(matchPlace(malmo, "hels"), "listed");
  assert.equal(matchPlace(malmo, "hel"), "listed");
  assert.equal(matchPlace(malmo, "he"), "no");
});

test("Orter som inte nämns ger nej, men bara när förvaltaren anger orter", () => {
  assert.equal(matchPlace(malmo, "Umeå"), "no");
  assert.equal(matchPlace(unknown, "Umeå"), "unknown");
  assert.equal(matchPlace({ scope: "regional", places: [] }, "Umeå"), "unknown");
});

test("splitByPlace döljer bara förvaltare som nämner andra orter", () => {
  const rows = [
    { name: "A", coverage: national },
    { name: "B", coverage: malmo },
    { name: "C", coverage: unknown },
    { name: "D", coverage: sthlm },
  ];
  const { shown, hidden } = splitByPlace(
    rows.map((r) => ({ ...r })),
    "Lund",
  );
  assert.deepEqual(shown.map((s) => s.row.name), ["A", "B", "C"]);
  assert.deepEqual(shown.map((s) => s.match), ["national", "listed", "unknown"]);
  assert.deepEqual(hidden.map((r) => r.name), ["D"]);
});

test("Tomt ortfält visar alla utan märke", () => {
  const rows = [
    { name: "A", coverage: national },
    { name: "D", coverage: sthlm },
  ];
  const { shown, hidden } = splitByPlace(rows, "   ");
  assert.equal(shown.length, 2);
  assert.ok(shown.every((s) => s.match === null));
  assert.equal(hidden.length, 0);
});

test("placeOptions ger unika orter i svensk ordning", () => {
  const opts = placeOptions([malmo, sthlm, { scope: "regional", places: ["Malmö", "Åre", "Örebro"] }]);
  assert.deepEqual(opts, ["Helsingborg", "Lund", "Malmö", "Stockholm", "Södertälje", "Åre", "Örebro"]);
});
