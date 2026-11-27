import test from "node:test";
import assert from "node:assert/strict";
import { joinNames, mentionsOffice } from "../lib/place-facts.ts";

test("Kontor räknas bara när meningen nämner kontor och orten som eget ord", () => {
  assert.equal(mentionsOffice("Kontor i Solna och Uppsala.", "Solna"), true);
  assert.equal(mentionsOffice("Lokala kontor i Stockholmsområdet, Malmö och Uppsala.", "Stockholm"), true);
  assert.equal(mentionsOffice("Teknisk förvaltning i Malmö. Kontor i Lund.", "Malmö"), false);
  assert.equal(mentionsOffice("Kontor i Stockholmsvägen 5.", "Stockholm"), false);
  assert.equal(mentionsOffice("Kontor i Malmö.", "Malmö"), true);
});

test("Namn binds ihop med och", () => {
  assert.equal(joinNames(["A"]), "A");
  assert.equal(joinNames(["A", "B", "C"]), "A, B och C");
});
