import test from "node:test";
import assert from "node:assert/strict";
import { findPlace, MIN_PROVIDERS_FOR_PLACE_PAGE, placeIndex, placePages, placeSlug } from "../lib/places.ts";

test("placeSlug gör ortnamn till adresser utan å, ä, ö och mellanslag", () => {
  assert.equal(placeSlug("Malmö"), "malmo");
  assert.equal(placeSlug("Södertälje"), "sodertalje");
  assert.equal(placeSlug("Upplands Väsby"), "upplands-vasby");
  assert.equal(placeSlug("Upplands-Bro"), "upplands-bro");
  assert.equal(placeSlug("  Östra   Göinge "), "ostra-goinge");
  assert.equal(placeSlug("???"), "");
});

test("placeIndex räknar förvaltare och inte rader, och slår ihop stavningar", () => {
  const rows = [
    { slug: "a", coverage: { places: ["Malmö", "Lund"] } },
    // Samma förvaltare, andra delen av förvaltningen. Ska inte räknas som en andra förvaltare.
    { slug: "a", coverage: { places: ["Malmö"] } },
    { slug: "b", coverage: { places: ["malmo", "Lund"] } },
    { slug: "c", coverage: { places: ["Kiruna"] } },
  ];
  const index = placeIndex(rows);
  assert.deepEqual(
    index.map((e) => [e.slug, e.providers]),
    [
      ["kiruna", ["c"]],
      ["lund", ["a", "b"]],
      ["malmo", ["a", "b"]],
    ],
  );
  // Stavningen är den första som förekommer.
  assert.equal(index.find((e) => e.slug === "malmo").name, "Malmö");
});

test("placeIndex ignorerar tomma ortnamn och orter utan bokstäver", () => {
  const index = placeIndex([{ slug: "a", coverage: { places: ["", "  ", "???", "Lund"] } }]);
  assert.deepEqual(index.map((e) => e.slug), ["lund"]);
});

test("placePages släpper bara in orter som minst två förvaltare nämner", () => {
  assert.equal(MIN_PROVIDERS_FOR_PLACE_PAGE, 2);
  const index = placeIndex([
    { slug: "a", coverage: { places: ["Malmö", "Kiruna"] } },
    { slug: "b", coverage: { places: ["Malmö"] } },
  ]);
  assert.deepEqual(placePages(index).map((e) => e.slug), ["malmo"]);
  assert.deepEqual(placePages(index, 1).map((e) => e.slug), ["kiruna", "malmo"]);
});

test("findPlace hittar en ort på adressen eller ingenting", () => {
  const index = placeIndex([{ slug: "a", coverage: { places: ["Malmö"] } }]);
  assert.equal(findPlace(index, "malmo")?.name, "Malmö");
  assert.equal(findPlace(index, "kiruna"), undefined);
});
